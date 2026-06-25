import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

// `checklist lint` productizes the repo's standalone audit script as a
// first-class subcommand. It does two core jobs and a few cheap file-level ones:
//
//   1. STRICT-VALIDATE .checklist.yml — the same shape loader.ts enforces, but
//      it collects EVERY violation in one pass (loader throws on the first, which
//      is right for the gate runtime but useless for an author fixing a file) and
//      adds rules loader.ts never had to (well-formed `verify` kinds).
//   2. CROSS-VALIDATE SKILL.md <-> .checklist.yml parity — every
//      `checklist check <phase> <id>` / `checklist verify <phase>` command in the
//      SKILL.md must name a phase + check that actually exists in the yml (catches
//      typos / orphaned references), and every yml check should be referenced by
//      at least one command (catches a check the SKILL.md forgot to drive).
//
// Plus cheap file-level checks (missing LICENSE/NOTICE, orphaned `references/`
// files) that the original audit also ran.
//
// The engine NEVER throws on bad input and NEVER calls process.exit: it returns
// a flat list of located diagnostics, so it is fully unit-testable and the
// command layer owns presentation + exit code.

const CONFIG_FILE = '.checklist.yml';
const SKILL_FILE = 'SKILL.md';

// Mirrors runner.ts's PREFIX_MAP — the set of verify kinds the runtime knows how
// to execute. A `verify:` string must begin with one of these prefixes (the
// runtime also auto-classifies prefix-less strings, but for a lint we hold
// authors to an explicit, unambiguous kind).
const VERIFY_PREFIXES = ['builtin:', 'shell:', 'script:'] as const;

export type LintSeverity = 'error' | 'warning';

export interface LintDiagnostic {
  /** The file the problem lives in (absolute path). */
  file: string;
  severity: LintSeverity;
  /** Short machine-ish rule id, e.g. "schema/missing-id" or "parity/orphan-command". */
  rule: string;
  /** Human-readable description of what is wrong. */
  message: string;
  /** Concrete, actionable fix. */
  fix?: string;
}

export interface LintResult {
  /** Skill directories that were linted (absolute paths). */
  skillDirs: string[];
  diagnostics: LintDiagnostic[];
}

// ── .checklist.yml schema validation ────────────────────────────────────────

interface ParsedCheck {
  id: string;
  hasVerify: boolean;
}

interface ParsedPhase {
  name: string;
  checks: ParsedCheck[];
}

interface SchemaParse {
  /** The structurally-sound phases/checks, for the parity pass. Best-effort:
   *  malformed entries are skipped here but reported as diagnostics. */
  phases: ParsedPhase[];
}

/**
 * Strict, all-violations-at-once schema validation of a .checklist.yml.
 * Generalizes loader.ts's piecemeal, throw-on-first checks into one explicit
 * pass that keeps going after each defect so an author sees the whole list.
 */
function lintChecklistSchema(ymlPath: string, diags: LintDiagnostic[]): SchemaParse {
  const empty: SchemaParse = { phases: [] };

  let raw: string;
  try {
    raw = fs.readFileSync(ymlPath, 'utf-8');
  } catch (e) {
    diags.push({
      file: ymlPath,
      severity: 'error',
      rule: 'schema/unreadable',
      message: `could not read ${CONFIG_FILE}: ${e instanceof Error ? e.message : String(e)}`,
    });
    return empty;
  }

  let data: unknown;
  try {
    data = yaml.load(raw);
  } catch (e) {
    diags.push({
      file: ymlPath,
      severity: 'error',
      rule: 'schema/invalid-yaml',
      message: `not valid YAML: ${e instanceof Error ? e.message : String(e)}`,
      fix: 'fix the YAML syntax error reported above',
    });
    return empty;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    diags.push({
      file: ymlPath,
      severity: 'error',
      rule: 'schema/not-a-mapping',
      message: `${CONFIG_FILE} must be a YAML mapping with a top-level "phases" list`,
      fix: 'wrap the file in a top-level `phases:` key',
    });
    return empty;
  }

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.phases)) {
    diags.push({
      file: ymlPath,
      severity: 'error',
      rule: 'schema/missing-phases',
      message: 'missing top-level "phases" array',
      fix: 'add a `phases:` list with at least one phase',
    });
    return empty;
  }

  if (obj.phases.length === 0) {
    diags.push({
      file: ymlPath,
      severity: 'error',
      rule: 'schema/empty-phases',
      message: '"phases" array is empty',
      fix: 'add at least one phase — an empty checklist gates nothing',
    });
    return empty;
  }

  const phases: ParsedPhase[] = [];
  const seenPhaseNames = new Map<string, string>(); // lower-cased -> original

  obj.phases.forEach((p, i) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      diags.push({
        file: ymlPath,
        severity: 'error',
        rule: 'schema/phase-not-a-mapping',
        message: `phase ${i}: entry is not a mapping (a bare "- " or "- null" list item?)`,
        fix: 'give the entry a `name:` and a `checks:` list',
      });
      return;
    }
    const phase = p as Record<string, unknown>;

    const hasName = typeof phase.name === 'string' && phase.name.length > 0;
    if (!hasName) {
      diags.push({
        file: ymlPath,
        severity: 'error',
        rule: 'schema/phase-missing-name',
        message: `phase ${i}: missing a non-empty string "name"`,
        fix: 'add a `name:` to this phase',
      });
    } else {
      const name = phase.name as string;
      const key = name.toLowerCase();
      const prior = seenPhaseNames.get(key);
      if (prior !== undefined) {
        diags.push({
          file: ymlPath,
          severity: 'error',
          rule: 'schema/duplicate-phase-name',
          message: `phase ${i}: duplicate phase name "${name}" (collides with "${prior}", names are compared case-insensitively)`,
          fix: 'rename one of the phases — phases are addressed by name, so a duplicate makes one unreachable',
        });
      } else {
        seenPhaseNames.set(key, name);
      }
    }

    const phaseLabel = hasName ? `"${phase.name as string}"` : `${i}`;

    if (!Array.isArray(phase.checks)) {
      diags.push({
        file: ymlPath,
        severity: 'error',
        rule: 'schema/phase-missing-checks',
        message: `phase ${phaseLabel}: missing "checks" array`,
        fix: 'add a `checks:` list with at least one check',
      });
      return;
    }
    if (phase.checks.length === 0) {
      diags.push({
        file: ymlPath,
        severity: 'error',
        rule: 'schema/empty-checks',
        message: `phase ${phaseLabel}: "checks" array is empty — an empty stage is vacuously gate-complete`,
        fix: 'add at least one check to this phase, or remove the phase',
      });
      return;
    }

    const checks: ParsedCheck[] = [];
    const seenIds = new Set<string>();

    phase.checks.forEach((c, j) => {
      if (!c || typeof c !== 'object' || Array.isArray(c)) {
        diags.push({
          file: ymlPath,
          severity: 'error',
          rule: 'schema/check-not-a-mapping',
          message: `phase ${phaseLabel}, check ${j}: entry is not a mapping (a bare "- " list item?)`,
          fix: 'give the entry an `id:` and a `description:`',
        });
        return;
      }
      const check = c as Record<string, unknown>;

      const hasId = typeof check.id === 'string' && check.id.length > 0;
      if (!hasId) {
        diags.push({
          file: ymlPath,
          severity: 'error',
          rule: 'schema/missing-id',
          message: `phase ${phaseLabel}, check ${j}: missing a non-empty string "id"`,
          fix: 'add a unique `id:` to this check',
        });
      }

      const checkLabel = hasId ? `"${check.id as string}"` : `${j}`;

      if (!(typeof check.description === 'string' && check.description.length > 0)) {
        diags.push({
          file: ymlPath,
          severity: 'error',
          rule: 'schema/missing-description',
          message: `phase ${phaseLabel}, check ${checkLabel}: missing a non-empty string "description"`,
          fix: 'add a `description:` explaining what this check confirms',
        });
      }

      // verify (optional) must be a well-formed string of a known kind. loader.ts
      // only rejected a non-string verify; lint additionally requires an explicit,
      // recognized prefix so a typo'd kind (`buildin:`) is caught at author time
      // rather than mis-classified at run time.
      if (check.verify !== undefined) {
        if (typeof check.verify !== 'string') {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/verify-not-a-string',
            message: `phase ${phaseLabel}, check ${checkLabel}: "verify" must be a string, got ${describeType(check.verify)} (an indentation mistake turning it into a nested mapping?)`,
            fix: 'put the rule on one line, e.g. `verify: shell:npm test`',
          });
        } else {
          const v = check.verify.trim();
          if (v.length === 0) {
            diags.push({
              file: ymlPath,
              severity: 'error',
              rule: 'schema/verify-empty',
              message: `phase ${phaseLabel}, check ${checkLabel}: "verify" is empty`,
              fix: 'remove the `verify:` key for a manual check, or give it a rule',
            });
          } else if (!VERIFY_PREFIXES.some(pfx => v.startsWith(pfx))) {
            diags.push({
              file: ymlPath,
              severity: 'error',
              rule: 'schema/verify-unknown-kind',
              message: `phase ${phaseLabel}, check ${checkLabel}: "verify" must start with a known kind (${VERIFY_PREFIXES.join(', ')}), got "${truncate(v, 40)}"`,
              fix: `prefix the rule with its kind, e.g. \`verify: shell:${truncate(v, 20)}\``,
            });
          }
        }
      }

      // evidence (optional) mirrors loader.ts: the only legal value is the literal
      // "required", and it may never co-exist with a `verify` rule (a mechanical
      // check is cleared by `checklist verify`, never by `check --evidence`, so the
      // combination is unsatisfiable). lint must reject both, or it certifies a
      // .checklist.yml that loadChecklist throws on at runtime — a false "OK" from
      // the authoring gate. (assay R1: lint must be a superset of loader validation.)
      if (check.evidence !== undefined) {
        if (check.evidence !== 'required') {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/evidence-invalid-value',
            message: `phase ${phaseLabel}, check ${checkLabel}: "evidence" may only be the string "required", got ${describeType(check.evidence)}`,
            fix: 'use `evidence: required` for a manual check that must cite a basis, or remove the key',
          });
        } else if (check.verify !== undefined) {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/evidence-with-verify',
            message: `phase ${phaseLabel}, check ${checkLabel}: "evidence: required" is for manual checks, but this check also has a "verify" rule (it is mechanical, cleared by \`checklist verify\`) — the combination can never be satisfied`,
            fix: 'remove `evidence: required` (mechanical checks need no manual cite), or remove the `verify` rule to make it a manual check',
          });
        }
      }

      // timeout (optional) mirrors loader.ts: a positive, finite number of
      // seconds within the 1800s ceiling, and ONLY on a mechanical check (one
      // with a `verify` rule) — there is nothing to time on a manual check. lint
      // must reject every shape loadChecklist throws on, or the authoring gate
      // certifies a file that crashes at runtime (assay R1: lint ⊇ loader).
      if (check.timeout !== undefined) {
        if (check.verify === undefined) {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/timeout-without-verify',
            message: `phase ${phaseLabel}, check ${checkLabel}: "timeout" applies only to a mechanical check, but this check has no "verify" rule`,
            fix: 'add a `verify:` rule (a real sensor), or remove the `timeout` key',
          });
        } else if (typeof check.timeout !== 'number' || !Number.isFinite(check.timeout) || check.timeout <= 0) {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/timeout-not-positive',
            message: `phase ${phaseLabel}, check ${checkLabel}: "timeout" must be a positive number of seconds, got ${describeType(check.timeout)}`,
            fix: 'set `timeout:` to a positive number, e.g. `timeout: 600`',
          });
        } else if (check.timeout > 1800) {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/timeout-too-large',
            message: `phase ${phaseLabel}, check ${checkLabel}: "timeout" of ${check.timeout}s exceeds the 1800s ceiling (a gate sensor must not run unbounded)`,
            fix: 'lower `timeout:` to 1800 seconds or less',
          });
        }
      }

      if (hasId) {
        const id = check.id as string;
        if (seenIds.has(id)) {
          diags.push({
            file: ymlPath,
            severity: 'error',
            rule: 'schema/duplicate-check-id',
            message: `phase ${phaseLabel}: duplicate check id "${id}"`,
            fix: 'check ids must be unique within a phase — rename one',
          });
        } else {
          seenIds.add(id);
          checks.push({ id, hasVerify: check.verify !== undefined });
        }
      }
    });

    if (hasName) {
      phases.push({ name: phase.name as string, checks });
    }
  });

  return { phases };
}

function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'a list';
  return typeof v === 'object' ? 'a mapping' : typeof v;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// ── SKILL.md <-> .checklist.yml parity ───────────────────────────────────────

interface SkillCommand {
  kind: 'check' | 'verify';
  phase: string;
  itemId?: string;
  line: number;
}

// Matches `checklist check <phase> <item-id>` and `checklist verify <phase>` as
// they appear in a SKILL.md — typically inside backticks and a numbered list.
// We scan line by line so each command carries a line number for the diagnostic.
// The leading `checklist` may be preceded by a backtick / list marker / `!`
// (the init opener is `!`checklist init ...``); we only care about check/verify.
const CHECK_RE = /\bchecklist\s+check\s+([^\s`]+)\s+([^\s`]+)/g;
const VERIFY_RE = /\bchecklist\s+verify\s+([^\s`]+)/g;

// A captured phase/item token may carry trailing sentence or markdown punctuation
// when a command is written in prose ("...check charter motivation." or wrapped in
// "(…)"), because the token pattern stops only at whitespace/backtick. Phase names
// and check ids are kebab-case ([a-z0-9-]) and never end in punctuation, so trimming
// a trailing run of .,;:!?)]}> recovers the real token and avoids a spurious
// parity/unknown-* false positive — without suppressing a genuine typo, which is
// still wrong after trimming (assay finding C).
function trimToken(token: string): string {
  return token.replace(/[.,;:!?)\]}>]+$/, '');
}

function extractSkillCommands(text: string): SkillCommand[] {
  const commands: SkillCommand[] = [];
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    const lineNo = idx + 1;

    let m: RegExpExecArray | null;
    // Reset lastIndex defensively — these regexes are module-level + /g.
    CHECK_RE.lastIndex = 0;
    while ((m = CHECK_RE.exec(line)) !== null) {
      commands.push({ kind: 'check', phase: trimToken(m[1]), itemId: trimToken(m[2]), line: lineNo });
    }

    VERIFY_RE.lastIndex = 0;
    while ((m = VERIFY_RE.exec(line)) !== null) {
      commands.push({ kind: 'verify', phase: trimToken(m[1]), line: lineNo });
    }
  });
  return commands;
}

/**
 * Cross-validate the SKILL.md's `checklist check/verify` commands against the
 * parsed phases. Flags:
 *   - a command naming a phase that does not exist (parity/unknown-phase)
 *   - a `check` naming an item id that does not exist in that phase
 *     (parity/unknown-check)
 *   - a yml check that no SKILL.md `check` command ever drives
 *     (parity/orphan-check, a warning — the gate still works, but the SKILL.md
 *     forgot to tell the agent to confirm it)
 */
function lintParity(
  skillPath: string,
  ymlPath: string,
  text: string,
  parse: SchemaParse,
  diags: LintDiagnostic[],
): void {
  const commands = extractSkillCommands(text);

  // Phases are addressed case-insensitively (findPhaseIndex). A pure-digit phase
  // token is a numeric index; everything else is a name.
  const phaseByName = new Map<string, ParsedPhase>();
  parse.phases.forEach(p => phaseByName.set(p.name.toLowerCase(), p));

  const resolvePhase = (token: string): ParsedPhase | undefined => {
    if (/^\d+$/.test(token)) {
      const idx = parseInt(token, 10);
      if (idx < parse.phases.length) return parse.phases[idx];
    }
    return phaseByName.get(token.toLowerCase());
  };

  // Track which (phaseName, id) pairs a `check` command referenced, to find
  // orphaned checks afterward.
  const referenced = new Set<string>();
  const key = (phaseName: string, id: string) => `${phaseName.toLowerCase()} ${id}`;

  for (const cmd of commands) {
    const phase = resolvePhase(cmd.phase);
    if (!phase) {
      diags.push({
        file: skillPath,
        severity: 'error',
        rule: 'parity/unknown-phase',
        message: `line ${cmd.line}: \`checklist ${cmd.kind} ${cmd.phase}${cmd.itemId ? ' ' + cmd.itemId : ''}\` names phase "${cmd.phase}", which does not exist in ${path.basename(ymlPath)}`,
        fix: `use one of the phases defined in ${path.basename(ymlPath)}: ${parse.phases.map(p => p.name).join(', ') || '(none)'}`,
      });
      continue;
    }

    if (cmd.kind === 'check' && cmd.itemId !== undefined) {
      const found = phase.checks.find(c => c.id === cmd.itemId);
      if (!found) {
        diags.push({
          file: skillPath,
          severity: 'error',
          rule: 'parity/unknown-check',
          message: `line ${cmd.line}: \`checklist check ${cmd.phase} ${cmd.itemId}\` names check id "${cmd.itemId}", which does not exist in phase "${phase.name}"`,
          fix: `use one of phase "${phase.name}"'s check ids: ${phase.checks.map(c => c.id).join(', ') || '(none)'}`,
        });
      } else {
        referenced.add(key(phase.name, found.id));
      }
    }
  }

  // Orphaned checks: a yml check that no `check` command drives. A check WITH a
  // `verify` rule is cleared by `checklist verify <phase>` (no per-id command),
  // so only manual checks are expected to have a matching `check` command.
  for (const phase of parse.phases) {
    for (const check of phase.checks) {
      if (check.hasVerify) continue;
      if (!referenced.has(key(phase.name, check.id))) {
        diags.push({
          file: skillPath,
          severity: 'warning',
          rule: 'parity/orphan-check',
          message: `check "${check.id}" in phase "${phase.name}" is never driven by a \`checklist check ${phase.name} ${check.id}\` command in ${path.basename(skillPath)}`,
          fix: `add \`checklist check ${phase.name} ${check.id}\` to the ${phase.name} stage in ${path.basename(skillPath)}, or remove the check from ${path.basename(ymlPath)}`,
        });
      }
    }
  }
}

// ── Cheap file-level checks (the original audit also ran these) ───────────────

function lintFiles(skillDir: string, hasSkill: boolean, diags: LintDiagnostic[]): void {
  // LICENSE / NOTICE — every shipped skill carries both (audit §二).
  for (const required of ['LICENSE', 'NOTICE']) {
    if (!fs.existsSync(path.join(skillDir, required))) {
      diags.push({
        file: path.join(skillDir, required),
        severity: 'warning',
        rule: 'files/missing-license',
        message: `${required} is missing from the skill directory`,
        fix: `add a ${required} file (copy a sibling skill's)`,
      });
    }
  }

  // Orphaned references: a file under references/ that the SKILL.md never links.
  // Cheap, link-text-based scan (not a full markdown crawler): we just check the
  // basename appears somewhere in SKILL.md.
  const refsDir = path.join(skillDir, 'references');
  if (hasSkill && fs.existsSync(refsDir) && fs.statSync(refsDir).isDirectory()) {
    let skillText = '';
    try {
      skillText = fs.readFileSync(path.join(skillDir, SKILL_FILE), 'utf-8');
    } catch {
      skillText = '';
    }
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(refsDir).filter(f => f.endsWith('.md'));
    } catch {
      entries = [];
    }
    for (const ref of entries) {
      if (!skillText.includes(ref)) {
        diags.push({
          file: path.join(refsDir, ref),
          severity: 'warning',
          rule: 'files/orphan-reference',
          message: `references/${ref} is never mentioned in ${SKILL_FILE} (possible orphan)`,
          fix: `link references/${ref} from ${SKILL_FILE}, or delete it if it is dead`,
        });
      }
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** True if `dir` is a skill directory (contains a .checklist.yml). */
export function isSkillDir(dir: string): boolean {
  try {
    return fs.statSync(path.join(dir, CONFIG_FILE)).isFile();
  } catch {
    return false;
  }
}

/** Lint a single skill directory. Returns all diagnostics found (never throws). */
export function lintSkill(skillDir: string): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];
  const ymlPath = path.join(skillDir, CONFIG_FILE);
  const skillPath = path.join(skillDir, SKILL_FILE);

  const parse = lintChecklistSchema(ymlPath, diags);

  const hasSkill = fs.existsSync(skillPath);
  if (!hasSkill) {
    diags.push({
      file: skillPath,
      severity: 'error',
      rule: 'parity/missing-skill-md',
      message: `${SKILL_FILE} is missing — cannot cross-validate the checklist against it`,
      fix: `add a ${SKILL_FILE} next to ${CONFIG_FILE}`,
    });
  } else {
    let text = '';
    try {
      text = fs.readFileSync(skillPath, 'utf-8');
    } catch (e) {
      diags.push({
        file: skillPath,
        severity: 'error',
        rule: 'parity/unreadable-skill-md',
        message: `could not read ${SKILL_FILE}: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    if (text) {
      lintParity(skillPath, ymlPath, text, parse, diags);
    }
  }

  lintFiles(skillDir, hasSkill, diags);

  return diags;
}

/**
 * Recursively find every skill directory (one containing a .checklist.yml) at or
 * under `root`, then lint each. If `root` is itself a skill dir, only it is
 * linted. node_modules / dotfile dirs are skipped.
 */
export function lintTree(root: string): LintResult {
  const skillDirs: string[] = [];

  if (isSkillDir(root)) {
    skillDirs.push(root);
  } else {
    walk(root, skillDirs);
    skillDirs.sort();
  }

  const diagnostics: LintDiagnostic[] = [];
  for (const dir of skillDirs) {
    diagnostics.push(...lintSkill(dir));
  }

  return { skillDirs, diagnostics };
}

function walk(dir: string, found: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  // A skill dir contains the config file directly; record it and do NOT descend
  // (a skill's references/ never holds nested skills).
  if (entries.some(e => e.isFile() && e.name === CONFIG_FILE)) {
    found.push(dir);
    return;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    walk(path.join(dir, e.name), found);
  }
}

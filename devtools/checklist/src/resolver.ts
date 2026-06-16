import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ChecklistConfig, Phase, PhaseResult } from './types.js';
import type { ChecklistState } from './state.js';
import { isPhaseComplete } from './state.js';
import { runCheck, type VerifyVars } from './runner.js';

// cwd-independent record of the active checklist dir. `init` writes it, and every
// later command resolves it no matter which directory they run from — so the skill
// never has to pass --dir, and there is no cwd-coupled pointer a stale copy could
// shadow. The pointer DIR is overridable via CHECKLIST_HOME (used to sandbox tests).
//
// The pointer is keyed PER SESSION, not machine-global: the filename carries a
// stable session id, so two concurrent runs (different terminals / agent sessions)
// each get their OWN pointer file and cannot stomp each other's active dir. Before
// this, a single shared `~/.config/checklist/active` meant one session's `init`
// (or a bare `reset`/self-heal) silently repointed every other session — flagless
// commands in the victim then resolved to the WRONG skill.
const CONFIG_FILE = '.checklist.yml';

// A filesystem-safe per-session tag, or '' when no session id is available. Claude
// Code exposes CLAUDE_CODE_SESSION_ID (a UUID, identical across every shell of one
// session); CHECKLIST_SESSION_ID overrides it (tests / non-Claude harnesses). With
// neither set — a human at a plain terminal — the tag is empty and the pointer
// falls back to the legacy shared `active` file, so standalone use is unchanged.
function sessionTag(): string {
  const raw = (process.env.CHECKLIST_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || '').trim();
  // Never let a session id escape into a path: keep only safe chars, bound length.
  return raw.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 64);
}

function activePointerPath(): string {
  const dir =
    process.env.CHECKLIST_HOME ||
    (process.env.XDG_CONFIG_HOME
      ? path.join(process.env.XDG_CONFIG_HOME, 'checklist')
      : path.join(os.homedir(), '.config', 'checklist'));
  const tag = sessionTag();
  return path.join(dir, tag ? `active.${tag}` : 'active');
}

export function resolveDir(explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.CHECKLIST_DIR) return process.env.CHECKLIST_DIR;
  // A running skill always knows its own dir; the harness exposes it here. This
  // lets an agent run any checklist command (even before `init`) with no flags
  // and no guesswork about where .checklist.yml lives.
  if (process.env.CLAUDE_SKILL_DIR) return process.env.CLAUDE_SKILL_DIR;

  const pointerPath = activePointerPath();
  let raw: string;
  try {
    raw = fs.readFileSync(pointerPath, 'utf-8');
  } catch {
    return process.cwd(); // no pointer (ENOENT) or unreadable
  }

  const target = raw.trim();
  if (target) {
    try {
      fs.statSync(path.join(target, CONFIG_FILE));
      return target; // points at a real checklist dir
    } catch (e) {
      // Only self-heal when the target is *definitely* gone. statSync returning
      // ENOENT/ENOTDIR means the dir/file is absent; any other errno (EACCES,
      // EIO, ELOOP, an NFS stall, ...) means "can't tell" — never delete a valid
      // pointer over a transient read failure.
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        return target;
      }
    }
  }

  // Empty content, or target is definitely gone: self-heal and fall through.
  try {
    fs.unlinkSync(pointerPath);
  } catch {
    /* best-effort cleanup; ignore races */
  }
  return process.cwd();
}

export function writeActivePointer(targetDir: string): void {
  const absDir = path.resolve(targetDir);
  const pointerPath = activePointerPath();
  fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
  fs.writeFileSync(pointerPath, absDir, 'utf-8');
}

// Remove the active pointer. With a targetDir, only removes it when it points
// there (so `reset` of skill A never clobbers an active pointer for skill B).
// Returns whether a pointer was removed.
export function clearActivePointer(targetDir?: string): boolean {
  const pointerPath = activePointerPath();
  let current: string;
  try {
    current = fs.readFileSync(pointerPath, 'utf-8').trim();
  } catch {
    return false; // no pointer (handles the ENOENT race too)
  }
  if (targetDir && current !== path.resolve(targetDir)) return false;
  try {
    fs.unlinkSync(pointerPath);
    return true;
  } catch {
    return false;
  }
}

export function findPhaseIndex(config: ChecklistConfig, nameOrIndex: string): number {
  // STRICT index parse: only a pure digit string is an index. parseInt's
  // lenient prefix parse ("1abc" → 1, "0survey" → 0, "1.9" → 1) let a typo'd
  // phase reference silently resolve to a real index — and record a pass
  // against a stage the caller never named. Anything that is not all digits
  // falls through to the name lookup, where a miss is an error.
  if (/^\d+$/.test(nameOrIndex)) {
    const num = parseInt(nameOrIndex, 10);
    if (num < config.phases.length) {
      return num;
    }
    // Out-of-range pure number: fall through — a phase may literally be NAMED
    // e.g. "99"; otherwise the name lookup below throws.
  }

  const idx = config.phases.findIndex(p => p.name.toLowerCase() === nameOrIndex.toLowerCase());
  if (idx === -1) {
    throw new Error(`Phase not found: "${nameOrIndex}". Use \`checklist phases\` to list available phases.`);
  }
  return idx;
}

export async function runPhase(
  phase: Phase,
  phaseIndex: number,
  cwd: string,
  targetPath: string,
  vars: VerifyVars = {},
): Promise<PhaseResult> {
  const checks = await Promise.all(
    phase.checks.map(item => runCheck(item, cwd, targetPath, vars))
  );

  let mechanicalPassed = 0;
  let mechanicalTotal = 0;
  let manualCount = 0;

  for (const c of checks) {
    if (c.kind === 'manual') {
      manualCount++;
    } else {
      mechanicalTotal++;
      if (c.result?.status === 'pass') mechanicalPassed++;
    }
  }

  return {
    phaseName: phase.name,
    phaseIndex,
    checks,
    mechanicalPassed,
    mechanicalTotal,
    manualCount,
  };
}

export interface GateResult {
  passed: boolean;
  failedPhase?: string;
  failedPhaseIndex?: number;
}

export function gatePriorPhases(
  config: ChecklistConfig,
  targetPhaseIndex: number,
  state: ChecklistState
): GateResult {
  for (let i = 0; i < targetPhaseIndex; i++) {
    const phase = config.phases[i];
    const ids = phase.checks.map(c => c.id);
    // Key by phase NAME, not index: reordering phases in the .checklist.yml must
    // not mis-attach an old pass to the check that now sits at the same index.
    if (!isPhaseComplete(state, phase.name, ids)) {
      return {
        passed: false,
        failedPhase: phase.name,
        failedPhaseIndex: i,
      };
    }
  }
  return { passed: true };
}

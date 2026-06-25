import { execFileSync, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getBuiltin, listBuiltins } from './builtins/index.js';
import type { CheckItem, CheckItemResult, CheckResult } from './types.js';

type VerifyKind = 'shell' | 'builtin' | 'script';

// Default sensor timeout when a check does not set its own `timeout:`. Tuned for
// the fast in-process builtins and trivial shell probes; a real test/build/scan
// sensor overrides it per-check (loader caps the override at 30 min).
const DEFAULT_EXEC_TIMEOUT = 10_000;
const BASH = '/bin/bash';

const PREFIX_MAP: Record<string, VerifyKind> = {
  'builtin:': 'builtin',
  'shell:': 'shell',
  'script:': 'script',
};

interface Classification {
  kind: VerifyKind;
  value: string;
  explicit: boolean;
}

// Run variables (from `init --var`) overlaid on a process-env fallback. Empty
// when nothing was captured and the env supplies nothing.
export type VerifyVars = Record<string, string>;

// Thrown by interpolate() when a `${name}` references a variable that is neither
// a captured run var nor a process-env var. Carried up to runCheck and turned
// into a located `error` result (never a half-interpolated command that runs).
class UndefinedVarError extends Error {
  constructor(public readonly varName: string) {
    super(`undefined variable "\${${varName}}"`);
    // NB: `varName`, not `name` — `name` is Error.prototype.name, which we set to
    // the class name here; an earlier `public readonly name` field was clobbered
    // by this line, so the hint below mis-rendered the variable as the class name.
    this.name = 'UndefinedVarError';
  }
}

// Substitute ${name} placeholders in a shell:/script: rule string.
//
//   - precedence: a captured run var (init --var) outranks a process-env var of
//     the same name; if neither is set the reference is an error.
//   - escaping: a doubled `$$` is a literal `$`, so `$${HOME}` emits the literal
//     text `${HOME}` and is never interpolated. This is the only escape; it lets
//     a rule include a shell `${...}` expansion that bash should evaluate at run
//     time rather than checklist expanding at verify time.
//   - `${name}` names match /[A-Za-z_][A-Za-z0-9_]*/; a `${` that does not open a
//     well-formed name is left verbatim (e.g. bash `${1}`, `${arr[0]}`).
export function interpolate(template: string, vars: VerifyVars): string {
  let out = '';
  let i = 0;
  while (i < template.length) {
    const ch = template[i];
    if (ch === '$' && template[i + 1] === '$') {
      // Escaped dollar: emit one literal `$`, consume both, and do NOT treat the
      // following `{` as opening a placeholder.
      out += '$';
      i += 2;
      continue;
    }
    if (ch === '$' && template[i + 1] === '{') {
      const close = template.indexOf('}', i + 2);
      const name = close === -1 ? '' : template.slice(i + 2, close);
      if (close !== -1 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        // Read the env fallback as an OWN property only. A bare `process.env[name]`
        // resolves INHERITED Object.prototype members for prototype-key names
        // (`__proto__`, `constructor`, `toString`, …) — each is `!== undefined`, so
        // the guard below was bypassed and the object/function was stringified into
        // the command. A prototype key is not a real environment variable, so it
        // must hit the undefined-variable error like any other unset name (assay R3).
        const value = Object.prototype.hasOwnProperty.call(vars, name)
          ? vars[name]
          : Object.prototype.hasOwnProperty.call(process.env, name)
            ? process.env[name]
            : undefined;
        if (value === undefined) {
          throw new UndefinedVarError(name);
        }
        out += value;
        i = close + 1;
        continue;
      }
      // Not a checklist placeholder (no close brace, or a non-identifier body
      // like ${1} / ${arr[0]}): pass `${` through untouched for bash to handle.
    }
    out += ch;
    i += 1;
  }
  return out;
}

function classifyVerify(verify: string): Classification {
  for (const [prefix, kind] of Object.entries(PREFIX_MAP)) {
    if (verify.startsWith(prefix)) {
      return { kind, value: verify.slice(prefix.length).trim(), explicit: true };
    }
  }
  const firstToken = verify.split(/\s/)[0];
  if (firstToken.includes('/') || /\.(sh|bash|ts|js|py)$/.test(firstToken)) {
    return { kind: 'script', value: verify, explicit: false };
  }
  return { kind: 'shell', value: verify, explicit: false };
}

function failureFromExec(e: unknown): CheckResult {
  const err = e as { stderr?: string; message?: string };
  const detail = (err.stderr || err.message || 'command failed').trim();
  return { status: 'fail', message: detail };
}

async function runShell(command: string, cwd: string, timeoutMs: number): Promise<CheckResult> {
  try {
    const stdout = execSync(command, {
      cwd,
      timeout: timeoutMs,
      encoding: 'utf-8',
      shell: BASH,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { status: 'pass', message: stdout || 'OK' };
  } catch (e) {
    return failureFromExec(e);
  }
}

// Execute a (containment-vetted) script file. The path is passed as an argv
// element to bash — NOT interpolated into a shell command string — so paths
// containing spaces or shell metacharacters are executed verbatim instead of
// being word-split or interpreted.
async function runScriptFile(scriptPath: string, cwd: string, timeoutMs: number): Promise<CheckResult> {
  try {
    const stdout = execFileSync(BASH, [scriptPath], {
      cwd,
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { status: 'pass', message: stdout || 'OK' };
  } catch (e) {
    return failureFromExec(e);
  }
}

async function runBuiltin(name: string, targetPath: string): Promise<CheckResult> {
  const handler = getBuiltin(name);
  if (!handler) {
    const available = listBuiltins().join(', ');
    return { status: 'error', message: `unknown builtin "${name}". available: ${available}` };
  }
  return handler(targetPath);
}

async function runScript(
  scriptPath: string,
  containmentBase: string,
  execCwd: string,
  explicit: boolean,
  timeoutMs: number,
): Promise<CheckResult> {
  const base = path.resolve(containmentBase);
  const resolved = path.resolve(base, scriptPath);
  const rel = path.relative(base, resolved);
  // Containment: the script FILE must live inside the checklist (skill) dir.
  // Absolute paths are fine as long as they resolve within `base`; escapes
  // (`..`, other roots) are rejected to prevent a malicious .checklist.yml from
  // executing arbitrary files elsewhere on disk. NB: containment is anchored to
  // the skill dir (where the vetted script ships), but the script EXECUTES with
  // `execCwd` = the project under review — a trusted sensor operating on the
  // untrusted project, not on its own install dir.
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    return {
      status: 'error',
      message: `script path escapes the checklist dir: "${scriptPath}" (resolved to "${resolved}")`,
    };
  }

  if (!fs.existsSync(resolved)) {
    const hint = explicit
      ? `script not found: "${resolved}" (resolved from "${scriptPath}")`
      : `auto-classified as script (first token contains "/" or has script extension), but file not found: "${resolved}". use "shell:" prefix if this is a shell command`;
    return { status: 'error', message: hint };
  }

  // Containment (canonical): the lexical check above never follows symlinks, but
  // execution does — a symlink planted inside the dir can point outside it. Re-check
  // against the real (symlink-resolved) paths before running.
  const realBase = fs.realpathSync(base);
  const realResolved = fs.realpathSync(resolved);
  const realRel = path.relative(realBase, realResolved);
  if (realRel === '..' || realRel.startsWith('..' + path.sep) || path.isAbsolute(realRel)) {
    return {
      status: 'error',
      message: `script path escapes the checklist dir via symlink: "${scriptPath}" (resolves to "${realResolved}")`,
    };
  }

  return runScriptFile(realResolved, execCwd, timeoutMs);
}

export async function runCheck(
  item: CheckItem,
  cwd: string,
  targetPath: string,
  vars: VerifyVars = {},
): Promise<CheckItemResult> {
  if (!item.verify) {
    return { item, kind: 'manual' };
  }

  const { kind, value, explicit } = classifyVerify(item.verify);
  // A real sensor (run the suite, build, scan) runs against the PROJECT and may
  // need minutes; builtins/manual checks ignore this. `cwd` is the skill dir
  // (script containment base); `targetPath` is the project the sensor inspects.
  const timeoutMs = item.timeoutMs ?? DEFAULT_EXEC_TIMEOUT;
  let result: CheckResult;

  try {
    switch (kind) {
      case 'builtin':
        // builtins take a fixed name, not a templated command — no interpolation.
        result = await runBuiltin(value, targetPath);
        break;
      case 'script': {
        // Interpolate FIRST, then containment-vet the resulting path: a `${...}`
        // can supply part of a script path, but the vetted real path is still
        // what gets executed, so an interpolated value cannot escape the dir.
        const scriptPath = interpolate(value, vars);
        result = await runScript(scriptPath, cwd, targetPath, explicit, timeoutMs);
        break;
      }
      case 'shell':
        result = await runShell(interpolate(value, vars), targetPath, timeoutMs);
        break;
    }
  } catch (e) {
    // A located, human-readable error for an unresolved `${name}` — and NOT a
    // half-interpolated command that silently runs. Attributed to the check id,
    // same shape as a crashing-handler error below.
    if (e instanceof UndefinedVarError) {
      return {
        item,
        kind: 'mechanical',
        result: {
          status: 'error',
          message: `${item.id}: ${e.message} in verify rule "${item.verify}" — pass it with \`checklist init <skill> --var ${e.varName}=...\` or export ${e.varName} in the environment`,
        },
      };
    }
    // A handler that THROWS (e.g. a builtin hitting js-yaml's parser on a
    // SKILL.md with malformed frontmatter) must degrade to this one check's
    // error result, attributed to its id — not abort the whole verify batch
    // with a raw, unattributed stack trace.
    const reason = e instanceof Error ? e.message : String(e);
    result = { status: 'error', message: `${item.id}: ${reason}` };
  }

  return { item, kind: 'mechanical', result };
}

import { execFileSync, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getBuiltin, listBuiltins } from './builtins/index.js';
import type { CheckItem, CheckItemResult, CheckResult } from './types.js';

type VerifyKind = 'shell' | 'builtin' | 'script';

const EXEC_TIMEOUT = 10_000;
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

async function runShell(command: string, cwd: string): Promise<CheckResult> {
  try {
    const stdout = execSync(command, {
      cwd,
      timeout: EXEC_TIMEOUT,
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
async function runScriptFile(scriptPath: string, cwd: string): Promise<CheckResult> {
  try {
    const stdout = execFileSync(BASH, [scriptPath], {
      cwd,
      timeout: EXEC_TIMEOUT,
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

async function runScript(scriptPath: string, cwd: string, explicit: boolean): Promise<CheckResult> {
  const base = path.resolve(cwd);
  const resolved = path.resolve(base, scriptPath);
  const rel = path.relative(base, resolved);
  // Containment: the script must live inside the checklist dir. Absolute paths
  // are fine as long as they resolve within `base`; escapes (`..`, other roots)
  // are rejected to prevent a malicious .checklist.yml from executing arbitrary
  // files elsewhere on disk.
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

  return runScriptFile(realResolved, cwd);
}

export async function runCheck(item: CheckItem, cwd: string, targetPath: string): Promise<CheckItemResult> {
  if (!item.verify) {
    return { item, kind: 'manual' };
  }

  const { kind, value, explicit } = classifyVerify(item.verify);
  let result: CheckResult;

  try {
    switch (kind) {
      case 'builtin':
        result = await runBuiltin(value, targetPath);
        break;
      case 'script':
        result = await runScript(value, cwd, explicit);
        break;
      case 'shell':
        result = await runShell(value, cwd);
        break;
    }
  } catch (e) {
    // A handler that THROWS (e.g. a builtin hitting js-yaml's parser on a
    // SKILL.md with malformed frontmatter) must degrade to this one check's
    // error result, attributed to its id — not abort the whole verify batch
    // with a raw, unattributed stack trace.
    const reason = e instanceof Error ? e.message : String(e);
    result = { status: 'error', message: `${item.id}: ${reason}` };
  }

  return { item, kind: 'mechanical', result };
}

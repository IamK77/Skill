import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getBuiltin, listBuiltins } from './builtins/index.js';
import type { CheckItem, CheckItemResult, CheckResult } from './types.js';

type VerifyKind = 'shell' | 'builtin' | 'script';

const EXEC_TIMEOUT = 10_000;

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

async function runShell(command: string, cwd: string): Promise<CheckResult> {
  try {
    const stdout = execSync(command, {
      cwd,
      timeout: EXEC_TIMEOUT,
      encoding: 'utf-8',
      shell: '/bin/bash',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { status: 'pass', message: stdout || 'OK' };
  } catch (e) {
    const err = e as { stderr?: string; message?: string };
    const detail = (err.stderr || err.message || 'command failed').trim();
    return { status: 'fail', message: detail };
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
  return runShell(resolved, cwd);
}

export async function runCheck(item: CheckItem, cwd: string, targetPath: string): Promise<CheckItemResult> {
  if (!item.verify) {
    return { item, kind: 'manual' };
  }

  const { kind, value, explicit } = classifyVerify(item.verify);
  let result: CheckResult;

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

  return { item, kind: 'mechanical', result };
}

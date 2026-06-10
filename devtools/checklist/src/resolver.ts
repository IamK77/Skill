import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ChecklistConfig, Phase, PhaseResult } from './types.js';
import type { ChecklistState } from './state.js';
import { isPhaseComplete } from './state.js';
import { runCheck } from './runner.js';

// Single, cwd-independent record of the active checklist dir. `init` writes it
// (its dir comes from the harness-expanded ${CLAUDE_SKILL_DIR}, so it is
// reliable), and every later command resolves it no matter which directory they
// run from — so the skill never has to pass --dir, and there is no cwd-coupled
// pointer that a stale copy could shadow. Location is overridable via
// CHECKLIST_HOME (used to sandbox tests).
const CONFIG_FILE = '.checklist.yml';

function activePointerPath(): string {
  const dir =
    process.env.CHECKLIST_HOME ||
    (process.env.XDG_CONFIG_HOME
      ? path.join(process.env.XDG_CONFIG_HOME, 'checklist')
      : path.join(os.homedir(), '.config', 'checklist'));
  return path.join(dir, 'active');
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

export async function runPhase(phase: Phase, phaseIndex: number, cwd: string, targetPath: string): Promise<PhaseResult> {
  const checks = await Promise.all(
    phase.checks.map(item => runCheck(item, cwd, targetPath))
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
    if (!isPhaseComplete(state, i, ids)) {
      return {
        passed: false,
        failedPhase: phase.name,
        failedPhaseIndex: i,
      };
    }
  }
  return { passed: true };
}

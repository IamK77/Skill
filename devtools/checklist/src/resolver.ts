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
  const pointerPath = activePointerPath();
  if (fs.existsSync(pointerPath)) {
    return fs.readFileSync(pointerPath, 'utf-8').trim();
  }
  return process.cwd();
}

export function writeActivePointer(targetDir: string): void {
  const absDir = path.resolve(targetDir);
  const pointerPath = activePointerPath();
  fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
  fs.writeFileSync(pointerPath, absDir, 'utf-8');
}

export function findPhaseIndex(config: ChecklistConfig, nameOrIndex: string): number {
  const num = parseInt(nameOrIndex, 10);
  if (!isNaN(num) && num >= 0 && num < config.phases.length) {
    return num;
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

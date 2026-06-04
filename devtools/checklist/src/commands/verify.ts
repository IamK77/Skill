import { loadChecklist } from '../loader.js';
import { loadState, saveState, setItemResult } from '../state.js';
import { findPhaseIndex, gatePriorPhases, runPhase, resolveDir } from '../resolver.js';
import { formatVerifyResult, formatGateFailure } from '../formatter.js';

export async function verifyCommand(phaseArg: string, options: { dir?: string; path?: string }): Promise<void> {
  const cwd = resolveDir(options.dir);
  const targetPath = options.path || cwd;

  try {
    const config = loadChecklist(cwd);
    const state = loadState(cwd);
    const phaseIndex = findPhaseIndex(config, phaseArg);

    const gate = gatePriorPhases(config, phaseIndex, state);
    if (!gate.passed) {
      console.error(formatGateFailure(gate.failedPhase!, gate.failedPhaseIndex!));
      process.exit(1);
    }

    const result = await runPhase(config.phases[phaseIndex], phaseIndex, cwd, targetPath);

    for (const c of result.checks) {
      if (c.kind === 'mechanical' && c.result) {
        if (c.result.status === 'pass') {
          setItemResult(state, phaseIndex, c.item.id, c.result);
        }
      }
    }

    saveState(cwd, state);
    console.log(formatVerifyResult(result, state, config.phases.length));

    if (result.mechanicalPassed < result.mechanicalTotal) {
      process.exit(1);
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

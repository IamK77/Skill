import { loadChecklist } from '../loader.js';
import { loadState, stateFilePath } from '../state.js';
import { findPhaseIndex, gatePriorPhases, runPhase, resolveDir } from '../resolver.js';
import { formatOverview, formatPhaseShow, formatGateFailure } from '../formatter.js';

export async function showCommand(phaseArg?: string, options?: { dir?: string; path?: string }): Promise<void> {
  const cwd = resolveDir(options?.dir);
  const targetPath = options?.path || process.cwd();   // key by project cwd, not the shared skill dir
  const stateFile = stateFilePath(cwd, targetPath);

  try {
    const config = loadChecklist(cwd);
    const state = loadState(stateFile);

    if (!phaseArg) {
      console.log(formatOverview(config, state));
      return;
    }

    const phaseIndex = findPhaseIndex(config, phaseArg);

    const gate = gatePriorPhases(config, phaseIndex, state);
    if (!gate.passed) {
      console.error(formatGateFailure(gate.failedPhase!, gate.failedPhaseIndex!));
      process.exit(1);
    }

    const result = await runPhase(config.phases[phaseIndex], phaseIndex, cwd, targetPath);
    console.log(formatPhaseShow(result, state, config.phases.length));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

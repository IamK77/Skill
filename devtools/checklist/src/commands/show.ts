import { loadChecklist } from '../loader.js';
import { loadState, stateFilePath } from '../state.js';
import { findPhaseIndex, gatePriorPhases, runPhase, resolveDir } from '../resolver.js';
import { formatOverview, formatPhaseShow, formatGateFailure, formatStateJson } from '../formatter.js';

export async function showCommand(phaseArg?: string, options?: { dir?: string; path?: string; json?: boolean }): Promise<void> {
  const cwd = resolveDir(options?.dir);
  const targetPath = options?.path || process.cwd();   // key by project cwd, not the shared skill dir
  const stateFile = stateFilePath(cwd, targetPath);

  try {
    const config = loadChecklist(cwd);
    const state = loadState(stateFile);

    // Machine-readable current state — a foundation for hooks/statusline. Always
    // the whole checklist (no per-phase gating): a tool wants the full picture,
    // and the gate is itself represented in each phase's `complete` flag.
    if (options?.json) {
      console.log(formatStateJson(config, state));
      return;
    }

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

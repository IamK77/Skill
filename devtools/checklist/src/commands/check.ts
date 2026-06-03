import { loadChecklist } from '../loader.js';
import { loadState, saveState, setItemResult } from '../state.js';
import { findPhaseIndex, gatePriorPhases, resolveDir } from '../resolver.js';
import { formatCheckConfirm, formatGateFailure } from '../formatter.js';

export function checkCommand(phaseArg: string, itemId: string, options: { dir?: string; path?: string }): void {
  const cwd = resolveDir(options.dir);

  try {
    const config = loadChecklist(cwd);
    const state = loadState(cwd);
    const phaseIndex = findPhaseIndex(config, phaseArg);

    const gate = gatePriorPhases(config, phaseIndex, state);
    if (!gate.passed) {
      console.error(formatGateFailure(gate.failedPhase!, gate.failedPhaseIndex!));
      process.exit(1);
    }

    const phase = config.phases[phaseIndex];
    const item = phase.checks.find(c => c.id === itemId);

    if (!item) {
      const available = phase.checks.map(c => c.id).join(', ');
      console.error(`item "${itemId}" not found in phase "${phase.name}". available: ${available}`);
      process.exit(1);
    }

    if (item.verify) {
      console.error(`"${itemId}" has a verify rule — it is mechanical, not manual. run: checklist verify ${phaseArg}`);
      process.exit(1);
    }

    setItemResult(state, phaseIndex, itemId, { status: 'pass', message: 'confirmed' });
    saveState(cwd, state);
    console.log(formatCheckConfirm(phaseIndex, itemId));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

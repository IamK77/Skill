import { loadChecklist } from '../loader.js';
import { loadState, mergeAndSaveState, setItemResult, stateFilePath, journalDir, type ChecklistState } from '../state.js';
import { findPhaseIndex, gatePriorPhases, runPhase, resolveDir } from '../resolver.js';
import { formatVerifyResult, formatGateFailure } from '../formatter.js';
import { appendEvents, journalPathFor, runStamp, type JournalEvent } from '../journal.js';

export async function verifyCommand(phaseArg: string, options: { dir?: string; path?: string }): Promise<void> {
  const cwd = resolveDir(options.dir);
  const targetPath = options.path || process.cwd();   // key by project cwd, not the shared skill dir
  const stateFile = stateFilePath(cwd, targetPath);

  try {
    const config = loadChecklist(cwd);
    const state = loadState(stateFile);
    const phaseIndex = findPhaseIndex(config, phaseArg);

    const gate = gatePriorPhases(config, phaseIndex, state);
    if (!gate.passed) {
      console.error(formatGateFailure(gate.failedPhase!, gate.failedPhaseIndex!));
      process.exit(1);
    }

    const result = await runPhase(config.phases[phaseIndex], phaseIndex, cwd, targetPath);

    const updates: ChecklistState = { checked: {} };
    const events: JournalEvent[] = [];
    const phaseName = config.phases[phaseIndex].name;
    const ts = new Date().toISOString();
    for (const c of result.checks) {
      if (c.kind === 'mechanical' && c.result) {
        // Record the CURRENT result, pass or fail — so a check that was green on
        // an earlier verify and has since regressed overwrites its stale pass and
        // the gate (isItemChecked === 'pass') sees current reality, instead of a
        // failing re-verify silently leaving the old pass (and the gate) standing.
        setItemResult(updates, result.phaseName, c.item.id, c.result);
        // One journal line per mechanical check — a regressing re-verify leaves a
        // `fail` line in the trail instead of silently overwriting a stale pass.
        events.push({
          ts,
          kind: 'verify',
          phaseIndex,
          phaseName,
          itemId: c.item.id,
          status: c.result.status,
          message: c.result.message,
        });
      }
    }

    // merge-save the DELTA (only the checks this run actually executed), not the
    // loaded snapshot: records written by a concurrent check/verify since our
    // load survive, and our stale in-memory copies of untouched items cannot
    // clobber newer results. Print from the merged state so the summary matches
    // what is actually on disk.
    const merged = mergeAndSaveState(stateFile, updates);

    // Append-only audit trace (best-effort; never fail verify over a journal
    // write). Records the mechanical results this run produced. The journal lives
    // under the XDG state home (journalDir), never the read-only skill dir.
    try {
      appendEvents(journalPathFor(journalDir(cwd), runStamp()), events);
    } catch {
      /* journal is a best-effort trace */
    }
    console.log(formatVerifyResult(result, merged, config.phases.length));

    if (result.mechanicalPassed < result.mechanicalTotal) {
      process.exit(1);
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

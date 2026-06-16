import { loadChecklist } from '../loader.js';
import { loadState, mergeAndSaveState, setItemResult, stateFilePath, journalDir, type ChecklistState } from '../state.js';
import { findPhaseIndex, gatePriorPhases, resolveDir } from '../resolver.js';
import { formatCheckConfirm, formatGateFailure } from '../formatter.js';
import { appendEvents, journalPathFor, runStamp, type JournalEvent } from '../journal.js';

export function checkCommand(
  phaseArg: string,
  itemId: string,
  options: { dir?: string; path?: string; evidence?: string },
): void {
  const cwd = resolveDir(options.dir);
  const target = options.path || process.cwd();   // key the run by WHAT you work on (project cwd), not the shared skill dir
  const stateFile = stateFilePath(cwd, target);

  try {
    const config = loadChecklist(cwd);
    const state = loadState(stateFile);
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

    // Normalize the evidence string: a whitespace-only `--evidence ""` is no
    // evidence at all. An `evidence: required` check needs a non-empty cite.
    const evidence = options.evidence?.trim() || undefined;
    if (item.evidenceRequired && !evidence) {
      console.error(`check "${phase.name}/${itemId}" requires evidence — re-run with --evidence "<file:line | command output | artifact path>"`);
      process.exit(1);
      return; // guard against a stubbed process.exit in tests
    }

    // merge-save the DELTA (just this confirmation), not the loaded snapshot:
    // records written by a concurrent invocation since our load survive, and our
    // stale in-memory copies of untouched items cannot clobber newer results.
    const updates: ChecklistState = { checked: {} };
    setItemResult(updates, phase.name, itemId, { status: 'pass', message: 'confirmed', evidence });
    mergeAndSaveState(stateFile, updates);

    // Append-only audit trace. Best-effort: a journal write failure must not
    // fail the check itself (the gate state is the source of truth), but in the
    // normal case it leaves a durable line that survives `done`. The journal
    // lives under the XDG state home (journalDir), never the read-only skill dir.
    const event: JournalEvent = {
      ts: new Date().toISOString(),
      kind: 'check',
      phaseIndex,
      phaseName: phase.name,
      itemId,
      status: 'pass',
      message: 'confirmed',
      ...(evidence ? { evidence } : {}),
    };
    try {
      appendEvents(journalPathFor(journalDir(cwd), runStamp()), [event]);
    } catch {
      /* journal is a best-effort trace; never fail the check over it */
    }

    console.log(formatCheckConfirm(phaseIndex, itemId, evidence));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

import type { ChecklistConfig, PhaseResult, CheckItemResult } from './types.js';
import type { ChecklistState } from './state.js';
import { getItemResult, isItemChecked, isPhaseComplete, phaseProgress } from './state.js';
import type { JournalEvent } from './journal.js';

function padDots(left: string, right: string, width: number = 50): string {
  const dotsCount = width - left.length - right.length;
  if (dotsCount < 3) return `${left} .. ${right}`;
  return `${left} ${'.' .repeat(dotsCount)} ${right}`;
}

export function formatInit(config: ChecklistConfig, cleared: boolean): string {
  const total = config.phases.length;
  const phaseList = config.phases
    .map((p, i) => `  ${i}: ${p.name} (${p.checks.length} checks)`)
    .join('\n');
  const header = cleared
    ? `checklist ready, ${total} phases (previous state cleared)`
    : `checklist ready, ${total} phases`;
  return `${header}\n${phaseList}`;
}

export function formatOverview(config: ChecklistConfig, state: ChecklistState): string {
  let currentPhase = -1;

  const lines = config.phases.map((phase, i) => {
    const ids = phase.checks.map(c => c.id);
    const complete = isPhaseComplete(state, phase.name, ids);
    const { done, total } = phaseProgress(state, phase.name, ids);

    let status: string;
    if (complete) {
      status = '[x] passed';
    } else if (done > 0) {
      status = `[ ] ${done}/${total}`;
      if (currentPhase === -1) currentPhase = i;
    } else {
      status = '[ ] pending';
      if (currentPhase === -1) currentPhase = i;
    }

    return `PHASE ${i}: ${phase.name.toUpperCase().padEnd(20)} ${status}`;
  });

  const allDone = config.phases.every((phase) =>
    isPhaseComplete(state, phase.name, phase.checks.map(c => c.id))
  );

  if (allDone) {
    lines.push('', 'all phases passed');
  } else {
    lines.push('', `current phase: PHASE ${currentPhase}`);
  }

  return lines.join('\n');
}

export function formatPhaseShow(result: PhaseResult, state: ChecklistState, totalPhases?: number): string {
  const header = `PHASE ${result.phaseIndex}: ${result.phaseName.toUpperCase()}`;

  const items = result.checks.map((c, i) => {
    const checked = isItemChecked(state, result.phaseName, c.item.id);
    const mark = checked ? '[x]' : '[ ]';
    const num = `${i + 1}.`;
    const line = `${num} ${mark} ${padDots(c.item.id, c.item.description)}`;

    if (checked) {
      return line;
    }

    if (c.kind === 'manual') {
      return `${line}\n       -> [manual confirmation required]`;
    }

    if (c.result) {
      const reading = c.result.status === 'error'
        ? `[ERROR] ${c.result.message}`
        : `[reading] ${c.result.message}`;
      return `${line}\n       -> ${reading}`;
    }

    return line;
  }).join('\n');

  const ids = result.checks.map(c => c.item.id);
  const { done, total } = phaseProgress(state, result.phaseName, ids);

  const lines = [header, '', items, ''];

  if (done === total) {
    const isLast = totalPhases !== undefined && result.phaseIndex >= totalPhases - 1;
    lines.push(isLast
      ? `PHASE ${result.phaseIndex} passed — all phases complete, run \`checklist done\``
      : `PHASE ${result.phaseIndex} passed, proceed to PHASE ${result.phaseIndex + 1}`);
  } else {
    lines.push(`${done}/${total} completed`);
  }

  return lines.join('\n');
}

export function formatVerifyResult(result: PhaseResult, state: ChecklistState, totalPhases?: number): string {
  const header = `PHASE ${result.phaseIndex}: ${result.phaseName.toUpperCase()}`;

  const items = result.checks.map((c, i) => {
    const num = `${i + 1}.`;

    if (c.kind === 'manual') {
      const checked = isItemChecked(state, result.phaseName, c.item.id);
      if (checked) {
        return `${num} [x] ${padDots(c.item.id, 'confirmed')}`;
      }
      return `${num} [ ] ${padDots(c.item.id, c.item.description)}\n       -> run: checklist check ${result.phaseIndex} ${c.item.id}`;
    }

    const passed = c.result?.status === 'pass';
    const mark = passed ? '[x]' : '[ ]';
    const suffix = passed ? 'PASS' : `FAIL: ${c.result?.message || 'unknown'}`;
    return `${num} ${mark} ${padDots(c.item.id, suffix)}`;
  }).join('\n');

  const lines = [header, '', items, ''];

  if (result.mechanicalTotal > 0) {
    lines.push(`mechanical: ${result.mechanicalPassed}/${result.mechanicalTotal} passed`);
  }
  if (result.manualCount > 0) {
    const manualChecked = result.checks
      .filter(c => c.kind === 'manual' && isItemChecked(state, result.phaseName, c.item.id))
      .length;
    const remaining = result.manualCount - manualChecked;
    if (remaining > 0) {
      lines.push(`manual: ${remaining} pending`);
    }
  }

  // Explicit verdict so `verify` (the gate command) states pass/proceed itself,
  // instead of requiring a follow-up `show`.
  const ids = result.checks.map(c => c.item.id);
  const { done, total } = phaseProgress(state, result.phaseName, ids);
  // The verify verdict must reflect THIS run, not just stored progress: never
  // announce "verified, proceed" when a mechanical check failed on this run,
  // even if stored state still carries an earlier (now-stale) pass.
  const mechanicalOk = result.mechanicalPassed === result.mechanicalTotal;
  if (mechanicalOk && done === total) {
    const isLast = totalPhases !== undefined && result.phaseIndex >= totalPhases - 1;
    lines.push(isLast
      ? `PHASE ${result.phaseIndex} verified — all phases complete, run \`checklist done\``
      : `PHASE ${result.phaseIndex} verified, proceed to PHASE ${result.phaseIndex + 1}`);
  }

  return lines.join('\n');
}

export function formatCheckConfirm(phaseIndex: number, itemId: string, evidence?: string): string {
  const base = `[x] ${itemId} .. confirmed`;
  return evidence ? `${base}\n       evidence: ${evidence}` : base;
}

export function formatGateFailure(failedPhase: string, failedIndex: number): string {
  return `gate blocked: PHASE ${failedIndex} (${failedPhase}) incomplete`;
}

export function formatPhases(config: ChecklistConfig): string {
  return config.phases
    .map((p, i) => `${i}: ${p.name} (${p.checks.length} checks)`)
    .join('\n');
}

const STATUS_MARK: Record<string, string> = { pass: '[x]', fail: '[FAIL]', error: '[ERROR]' };

// Render the append-only run journal as a markdown gate-trail. This is the
// audit artifact: it shows every check/verify/reset event, in order, with the
// evidence string the agent supplied — fitting the repo's output/ report habit.
//
// Honest framing: this trail proves WHAT was recorded and WHEN, not that the
// evidence is real or the work was actually done. Manual checks are still
// agent-entered; the evidence column forces specificity, the trail leaves an
// audit trace. It is a record, not a verifier.
export function formatReport(events: JournalEvent[], config?: ChecklistConfig): string {
  const lines: string[] = ['# checklist gate-trail', ''];

  if (config) {
    lines.push(`Checklist: ${config.phases.length} phases`, '');
  }

  if (events.length === 0) {
    lines.push('_No journal events recorded yet._', '');
    lines.push('> The journal proves what was recorded and when; manual checks are still');
    lines.push('> agent-entered, so a recorded pass is a claim with a cited basis, not a proof.');
    return lines.join('\n');
  }

  lines.push('| time (UTC) | event | phase | check | status | evidence / detail |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const e of events) {
    const mark = STATUS_MARK[e.status] ?? e.status;
    const phase = e.kind === 'reset' ? '—' : `${e.phaseIndex} (${e.phaseName})`;
    const check = e.kind === 'reset' ? '—' : e.itemId;
    // The evidence string is what an `evidence: required` check was based on;
    // otherwise fall back to the recorded message (the runner output, or
    // "confirmed" for a bare manual check).
    const detail = (e.evidence ?? e.message ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${e.ts} | ${e.kind} | ${phase} | ${check} | ${mark} | ${detail} |`);
  }

  lines.push('');
  lines.push('> The journal proves what was recorded and when; manual checks are still');
  lines.push('> agent-entered, so a recorded pass is a claim with a cited basis, not a proof.');
  return lines.join('\n');
}

export interface StateJsonPhase {
  index: number;
  name: string;
  complete: boolean;
  done: number;
  total: number;
  checks: {
    id: string;
    description: string;
    kind: 'manual' | 'mechanical';
    evidenceRequired: boolean;
    status: 'pass' | 'fail' | 'error' | 'unchecked';
    message?: string;
    evidence?: string;
  }[];
}

export interface StateJson {
  phases: StateJsonPhase[];
  allComplete: boolean;
  currentPhase: number | null;
}

// Machine-readable current state — a foundation for hooks/statusline. Built
// from the config (the shape) overlaid with the recorded state (the readings),
// so it reports CURRENT pass-status (the gate's notion), not mere row existence.
export function buildStateJson(config: ChecklistConfig, state: ChecklistState): StateJson {
  let currentPhase: number | null = null;

  const phases: StateJsonPhase[] = config.phases.map((phase, i) => {
    const ids = phase.checks.map(c => c.id);
    // Key state by phase NAME, not index: state.ts stores results under the
    // case-folded phase name (phaseKeyOf), so an index lookup (`state.checked["0"]`)
    // always misses and every check reports `unchecked`. Use the state module's own
    // name-keyed helpers so --json matches the human `show`.
    const complete = isPhaseComplete(state, phase.name, ids);
    const { done, total } = phaseProgress(state, phase.name, ids);
    if (!complete && currentPhase === null) currentPhase = i;

    const checks = phase.checks.map(c => {
      const rec = getItemResult(state, phase.name, c.id);
      return {
        id: c.id,
        description: c.description,
        kind: (c.verify ? 'mechanical' : 'manual') as 'manual' | 'mechanical',
        evidenceRequired: c.evidenceRequired === true,
        status: (rec?.status ?? 'unchecked') as 'pass' | 'fail' | 'error' | 'unchecked',
        ...(rec?.message !== undefined ? { message: rec.message } : {}),
        ...(rec?.evidence !== undefined ? { evidence: rec.evidence } : {}),
      };
    });

    return { index: i, name: phase.name, complete, done, total, checks };
  });

  const allComplete = phases.every(p => p.complete);
  return { phases, allComplete, currentPhase: allComplete ? null : currentPhase };
}

export function formatStateJson(config: ChecklistConfig, state: ChecklistState): string {
  return JSON.stringify(buildStateJson(config, state), null, 2);
}

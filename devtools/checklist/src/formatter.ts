import type { ChecklistConfig, PhaseResult, CheckItemResult } from './types.js';
import type { ChecklistState } from './state.js';
import { isItemChecked, isPhaseComplete, phaseProgress } from './state.js';

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
    const complete = isPhaseComplete(state, i, ids);
    const { done, total } = phaseProgress(state, i, ids);

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

  const allDone = config.phases.every((phase, i) =>
    isPhaseComplete(state, i, phase.checks.map(c => c.id))
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
    const checked = isItemChecked(state, result.phaseIndex, c.item.id);
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
  const { done, total } = phaseProgress(state, result.phaseIndex, ids);

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
      const checked = isItemChecked(state, result.phaseIndex, c.item.id);
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
      .filter(c => c.kind === 'manual' && isItemChecked(state, result.phaseIndex, c.item.id))
      .length;
    const remaining = result.manualCount - manualChecked;
    if (remaining > 0) {
      lines.push(`manual: ${remaining} pending`);
    }
  }

  // Explicit verdict so `verify` (the gate command) states pass/proceed itself,
  // instead of requiring a follow-up `show`.
  const ids = result.checks.map(c => c.item.id);
  const { done, total } = phaseProgress(state, result.phaseIndex, ids);
  if (done === total) {
    const isLast = totalPhases !== undefined && result.phaseIndex >= totalPhases - 1;
    lines.push(isLast
      ? `PHASE ${result.phaseIndex} verified — all phases complete, run \`checklist done\``
      : `PHASE ${result.phaseIndex} verified, proceed to PHASE ${result.phaseIndex + 1}`);
  }

  return lines.join('\n');
}

export function formatCheckConfirm(phaseIndex: number, itemId: string): string {
  return `[x] ${itemId} .. confirmed`;
}

export function formatGateFailure(failedPhase: string, failedIndex: number): string {
  return `gate blocked: PHASE ${failedIndex} (${failedPhase}) incomplete`;
}

export function formatPhases(config: ChecklistConfig): string {
  return config.phases
    .map((p, i) => `${i}: ${p.name} (${p.checks.length} checks)`)
    .join('\n');
}

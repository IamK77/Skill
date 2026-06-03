import { describe, it, expect } from 'vitest';
import {
  formatInit,
  formatOverview,
  formatPhaseShow,
  formatVerifyResult,
  formatCheckConfirm,
  formatGateFailure,
  formatPhases,
} from '../../src/formatter.js';
import type { ChecklistConfig, PhaseResult } from '../../src/types.js';
import type { ChecklistState } from '../../src/state.js';

// ---------------------------------------------------------------------------
// Helpers to build test fixtures
// ---------------------------------------------------------------------------

function makeConfig(phases: { name: string; checks: { id: string; description: string }[] }[]): ChecklistConfig {
  return {
    phases: phases.map(p => ({
      name: p.name,
      checks: p.checks.map(c => ({ id: c.id, description: c.description })),
    })),
  };
}

function emptyState(): ChecklistState {
  return { checked: {} };
}

function stateWith(entries: { phase: number; id: string; status: 'pass' | 'fail' | 'error'; message: string }[]): ChecklistState {
  const state: ChecklistState = { checked: {} };
  for (const e of entries) {
    const key = String(e.phase);
    if (!state.checked[key]) state.checked[key] = {};
    state.checked[key][e.id] = { status: e.status, message: e.message };
  }
  return state;
}

// ---------------------------------------------------------------------------
// formatInit
// ---------------------------------------------------------------------------

describe('formatInit', () => {
  const config = makeConfig([
    { name: 'Setup', checks: [{ id: 'a', description: 'do a' }, { id: 'b', description: 'do b' }] },
    { name: 'Build', checks: [{ id: 'c', description: 'do c' }] },
    { name: 'Deploy', checks: [{ id: 'd', description: 'do d' }, { id: 'e', description: 'do e' }, { id: 'f', description: 'do f' }] },
  ]);

  it('without cleared state shows "checklist ready, N phases"', () => {
    const result = formatInit(config, false);
    expect(result).toContain('checklist ready, 3 phases');
    expect(result).not.toContain('previous state cleared');
  });

  it('with cleared state includes "(previous state cleared)"', () => {
    const result = formatInit(config, true);
    expect(result).toContain('checklist ready, 3 phases (previous state cleared)');
  });

  it('lists all phases with their check counts', () => {
    const result = formatInit(config, false);
    expect(result).toContain('0: Setup (2 checks)');
    expect(result).toContain('1: Build (1 checks)');
    expect(result).toContain('2: Deploy (3 checks)');
  });

  it('indents phase lines with two spaces', () => {
    const lines = formatInit(config, false).split('\n');
    // First line is the header; the rest are phase lines
    for (const line of lines.slice(1)) {
      expect(line).toMatch(/^ {2}\d+:/);
    }
  });
});

// ---------------------------------------------------------------------------
// padDots (exercised through formatPhaseShow / formatVerifyResult)
// ---------------------------------------------------------------------------

describe('padDots edge case (dotsCount < 3)', () => {
  it('uses " .. " fallback when id + description are very long', () => {
    const longId = 'x'.repeat(30);
    const longDesc = 'y'.repeat(30);
    const phaseResult: PhaseResult = {
      phaseName: 'Test',
      phaseIndex: 0,
      checks: [
        {
          item: { id: longId, description: longDesc },
          kind: 'mechanical',
          result: { status: 'pass', message: 'ok' },
        },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatPhaseShow(phaseResult, emptyState());
    expect(result).toContain(`${longId} .. ${longDesc}`);
  });
});

// ---------------------------------------------------------------------------
// formatOverview
// ---------------------------------------------------------------------------

describe('formatOverview', () => {
  const config = makeConfig([
    { name: 'Setup', checks: [{ id: 'a', description: '' }, { id: 'b', description: '' }] },
    { name: 'Build', checks: [{ id: 'c', description: '' }] },
  ]);

  it('empty state shows all phases as pending, current phase 0', () => {
    const result = formatOverview(config, emptyState());
    expect(result).toContain('PHASE 0:');
    expect(result).toContain('[ ] pending');
    expect(result).toContain('current phase: PHASE 0');
  });

  it('some items checked in phase 0 shows partial progress', () => {
    const state = stateWith([{ phase: 0, id: 'a', status: 'pass', message: '' }]);
    const result = formatOverview(config, state);
    expect(result).toContain('[ ] 1/2');
    expect(result).toContain('current phase: PHASE 0');
  });

  it('phase 0 complete, phase 1 pending shows phase 0 passed and current phase 1', () => {
    const state = stateWith([
      { phase: 0, id: 'a', status: 'pass', message: '' },
      { phase: 0, id: 'b', status: 'pass', message: '' },
    ]);
    const result = formatOverview(config, state);
    // Phase 0 line should show passed
    const lines = result.split('\n');
    const phase0Line = lines.find(l => l.includes('PHASE 0:'));
    expect(phase0Line).toContain('[x] passed');
    // Phase 1 line should show pending
    const phase1Line = lines.find(l => l.includes('PHASE 1:'));
    expect(phase1Line).toContain('[ ] pending');
    expect(result).toContain('current phase: PHASE 1');
  });

  it('all phases complete shows "all phases passed"', () => {
    const state = stateWith([
      { phase: 0, id: 'a', status: 'pass', message: '' },
      { phase: 0, id: 'b', status: 'pass', message: '' },
      { phase: 1, id: 'c', status: 'pass', message: '' },
    ]);
    const result = formatOverview(config, state);
    expect(result).toContain('all phases passed');
    expect(result).not.toContain('current phase:');
  });

  it('uppercases phase names and pads them', () => {
    const result = formatOverview(config, emptyState());
    expect(result).toContain('SETUP');
    expect(result).toContain('BUILD');
  });

  it('tracks currentPhase correctly when first incomplete phase has partial progress and later phases are pending', () => {
    const threePhaseConfig = makeConfig([
      { name: 'Setup', checks: [{ id: 'a', description: '' }, { id: 'b', description: '' }] },
      { name: 'Build', checks: [{ id: 'c', description: '' }] },
      { name: 'Deploy', checks: [{ id: 'd', description: '' }] },
    ]);
    const state = stateWith([
      { phase: 0, id: 'a', status: 'pass', message: '' },
    ]);
    const result = formatOverview(threePhaseConfig, state);
    expect(result).toContain('current phase: PHASE 0');
    const lines = result.split('\n');
    const phase1Line = lines.find(l => l.includes('PHASE 1:'));
    expect(phase1Line).toContain('[ ] pending');
    const phase2Line = lines.find(l => l.includes('PHASE 2:'));
    expect(phase2Line).toContain('[ ] pending');
  });

  it('does not reassign currentPhase when multiple phases have partial progress', () => {
    const threePhaseConfig = makeConfig([
      { name: 'Setup', checks: [{ id: 'a', description: '' }, { id: 'b', description: '' }] },
      { name: 'Build', checks: [{ id: 'c', description: '' }, { id: 'd', description: '' }] },
      { name: 'Deploy', checks: [{ id: 'e', description: '' }] },
    ]);
    const state = stateWith([
      { phase: 0, id: 'a', status: 'pass', message: '' },
      { phase: 1, id: 'c', status: 'pass', message: '' },
    ]);
    const result = formatOverview(threePhaseConfig, state);
    expect(result).toContain('current phase: PHASE 0');
    const lines = result.split('\n');
    const phase0Line = lines.find(l => l.includes('PHASE 0:'));
    expect(phase0Line).toContain('1/2');
    const phase1Line = lines.find(l => l.includes('PHASE 1:'));
    expect(phase1Line).toContain('1/2');
  });
});

// ---------------------------------------------------------------------------
// formatPhaseShow
// ---------------------------------------------------------------------------

describe('formatPhaseShow', () => {
  it('unchecked manual item shows "[manual confirmation required]"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 0,
      checks: [
        { item: { id: 'review-code', description: 'Review the code' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 1,
    };
    const result = formatPhaseShow(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('[manual confirmation required]');
  });

  it('unchecked mechanical item with pass result shows "[reading]" line', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          result: { status: 'pass', message: 'all clear' },
        },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatPhaseShow(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('[reading] all clear');
  });

  it('unchecked mechanical item with error result shows "[ERROR]" line', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          result: { status: 'error', message: 'crashed' },
        },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatPhaseShow(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('[ERROR] crashed');
  });

  it('checked item shows "[x]" mark with no additional annotation', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        { item: { id: 'lint', description: 'Run linter' }, kind: 'mechanical' },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const state = stateWith([{ phase: 0, id: 'lint', status: 'pass', message: 'ok' }]);
    const result = formatPhaseShow(phaseResult, state);
    expect(result).toContain('[x]');
    expect(result).not.toContain('[manual confirmation required]');
    expect(result).not.toContain('[reading]');
    expect(result).not.toContain('[ERROR]');
  });

  it('all items done shows "passed, proceed to PHASE N+1"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 2,
      checks: [
        { item: { id: 'lint', description: 'Run linter' }, kind: 'mechanical' },
        { item: { id: 'test', description: 'Run tests' }, kind: 'mechanical' },
      ],
      mechanicalPassed: 2,
      mechanicalTotal: 2,
      manualCount: 0,
    };
    const state = stateWith([
      { phase: 2, id: 'lint', status: 'pass', message: '' },
      { phase: 2, id: 'test', status: 'pass', message: '' },
    ]);
    const result = formatPhaseShow(phaseResult, state);
    expect(result).toContain('PHASE 2 passed, proceed to PHASE 3');
  });

  it('some items incomplete shows "X/Y completed"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        { item: { id: 'lint', description: 'Run linter' }, kind: 'mechanical' },
        { item: { id: 'test', description: 'Run tests' }, kind: 'mechanical' },
        { item: { id: 'typecheck', description: 'Type check' }, kind: 'mechanical' },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 3,
      manualCount: 0,
    };
    const state = stateWith([{ phase: 0, id: 'lint', status: 'pass', message: '' }]);
    const result = formatPhaseShow(phaseResult, state);
    expect(result).toContain('1/3 completed');
  });

  it('header line uses uppercased phase name', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'final review',
      phaseIndex: 1,
      checks: [],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 0,
    };
    const result = formatPhaseShow(phaseResult, emptyState());
    expect(result).toContain('PHASE 1: FINAL REVIEW');
  });
});

// ---------------------------------------------------------------------------
// formatVerifyResult
// ---------------------------------------------------------------------------

describe('formatVerifyResult', () => {
  it('passing mechanical check shows "[x]" with "PASS"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          result: { status: 'pass', message: 'ok' },
        },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('[x]');
    expect(result).toContain('PASS');
  });

  it('failing mechanical check shows "[ ]" with "FAIL: message"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          result: { status: 'fail', message: '3 errors found' },
        },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('FAIL: 3 errors found');
  });

  it('mechanical check with no result shows "FAIL: unknown"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          // no result
        },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 1,
      manualCount: 0,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('FAIL: unknown');
  });

  it('unchecked manual item shows "[ ]" with run command hint', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 1,
      checks: [
        { item: { id: 'code-review', description: 'Review code changes' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 1,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('[ ]');
    expect(result).toContain('run: checklist check 1 code-review');
  });

  it('checked manual item shows "[x]" with "confirmed"', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 1,
      checks: [
        { item: { id: 'code-review', description: 'Review code changes' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 1,
    };
    const state = stateWith([{ phase: 1, id: 'code-review', status: 'pass', message: 'confirmed' }]);
    const result = formatVerifyResult(phaseResult, state);
    expect(result).toContain('[x]');
    expect(result).toContain('confirmed');
    expect(result).not.toContain('run: checklist check');
  });

  it('mechanical summary line present when mechanicalTotal > 0', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Build',
      phaseIndex: 0,
      checks: [
        {
          item: { id: 'lint', description: 'Run linter' },
          kind: 'mechanical',
          result: { status: 'pass', message: '' },
        },
        {
          item: { id: 'test', description: 'Run tests' },
          kind: 'mechanical',
          result: { status: 'fail', message: 'nope' },
        },
      ],
      mechanicalPassed: 1,
      mechanicalTotal: 2,
      manualCount: 0,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('mechanical: 1/2 passed');
  });

  it('no mechanical summary line when mechanicalTotal is 0', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 0,
      checks: [
        { item: { id: 'review', description: 'Review code' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 1,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).not.toContain('mechanical:');
  });

  it('manual pending line present when unchecked manuals exist', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 0,
      checks: [
        { item: { id: 'review-a', description: 'Review A' }, kind: 'manual' },
        { item: { id: 'review-b', description: 'Review B' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 2,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('manual: 2 pending');
  });

  it('manual pending line shows correct remaining count when some are checked', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 0,
      checks: [
        { item: { id: 'review-a', description: 'Review A' }, kind: 'manual' },
        { item: { id: 'review-b', description: 'Review B' }, kind: 'manual' },
        { item: { id: 'review-c', description: 'Review C' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 3,
    };
    const state = stateWith([{ phase: 0, id: 'review-a', status: 'pass', message: '' }]);
    const result = formatVerifyResult(phaseResult, state);
    expect(result).toContain('manual: 2 pending');
  });

  it('no manual pending line when all manuals are checked', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'Review',
      phaseIndex: 0,
      checks: [
        { item: { id: 'review-a', description: 'Review A' }, kind: 'manual' },
      ],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 1,
    };
    const state = stateWith([{ phase: 0, id: 'review-a', status: 'pass', message: '' }]);
    const result = formatVerifyResult(phaseResult, state);
    expect(result).not.toContain('manual:');
  });

  it('header uses uppercased phase name', () => {
    const phaseResult: PhaseResult = {
      phaseName: 'deploy',
      phaseIndex: 3,
      checks: [],
      mechanicalPassed: 0,
      mechanicalTotal: 0,
      manualCount: 0,
    };
    const result = formatVerifyResult(phaseResult, emptyState());
    expect(result).toContain('PHASE 3: DEPLOY');
  });
});

// ---------------------------------------------------------------------------
// formatCheckConfirm
// ---------------------------------------------------------------------------

describe('formatCheckConfirm', () => {
  it('outputs "[x] itemId .. confirmed"', () => {
    expect(formatCheckConfirm(0, 'review-code')).toBe('[x] review-code .. confirmed');
  });

  it('works with different phase indices and item ids', () => {
    expect(formatCheckConfirm(5, 'security-audit')).toBe('[x] security-audit .. confirmed');
  });
});

// ---------------------------------------------------------------------------
// formatGateFailure
// ---------------------------------------------------------------------------

describe('formatGateFailure', () => {
  it('outputs "gate blocked: PHASE N (name) incomplete"', () => {
    expect(formatGateFailure('Setup', 0)).toBe('gate blocked: PHASE 0 (Setup) incomplete');
  });

  it('works with different indices and names', () => {
    expect(formatGateFailure('Final Review', 3)).toBe('gate blocked: PHASE 3 (Final Review) incomplete');
  });
});

// ---------------------------------------------------------------------------
// formatPhases
// ---------------------------------------------------------------------------

describe('formatPhases', () => {
  it('lists phases with indices and check counts', () => {
    const config = makeConfig([
      { name: 'Setup', checks: [{ id: 'a', description: '' }] },
      { name: 'Build', checks: [{ id: 'b', description: '' }, { id: 'c', description: '' }] },
      { name: 'Deploy', checks: [] },
    ]);
    const result = formatPhases(config);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('0: Setup (1 checks)');
    expect(lines[1]).toBe('1: Build (2 checks)');
    expect(lines[2]).toBe('2: Deploy (0 checks)');
  });

  it('single phase produces a single line with no trailing newline', () => {
    const config = makeConfig([
      { name: 'Only', checks: [{ id: 'x', description: '' }] },
    ]);
    const result = formatPhases(config);
    expect(result).toBe('0: Only (1 checks)');
    expect(result).not.toContain('\n');
  });
});

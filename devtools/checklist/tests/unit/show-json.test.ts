// Regression coverage for `show --json` (buildStateJson). The branch shipped this
// feature with NO direct test of its status output, so a stale index-keyed lookup
// (`state.checked["0"]`) survived the rebase onto main — which keys state by phase
// NAME — and every check reported `unchecked` even after a recorded pass. These
// tests construct state the canonical way (setItemResult, which name-keys via
// phaseKeyOf) and assert the JSON reflects it, so the human `show` and `--json`
// can never silently diverge again.
import { describe, it, expect } from 'vitest';
import { buildStateJson } from '../../src/formatter.js';
import { setItemResult, type ChecklistState } from '../../src/state.js';
import type { ChecklistConfig } from '../../src/types.js';

const config: ChecklistConfig = {
  phases: [
    {
      name: 'Build', // mixed-case on purpose: phaseKeyOf folds to 'build'
      checks: [
        { id: 'tests-green', description: 'tests pass', evidenceRequired: true },
        { id: 'reviewed', description: 'a human read the diff' },
      ],
    },
    { name: 'ship', checks: [{ id: 'changelog', description: 'changelog updated' }] },
  ],
};

function emptyState(): ChecklistState {
  return { checked: {} };
}

describe('buildStateJson (show --json) reads name-keyed state', () => {
  it('reports status:pass + evidence for a check recorded by phase NAME', () => {
    const state = emptyState();
    setItemResult(state, 'Build', 'tests-green', { status: 'pass', message: 'confirmed', evidence: 'core-stats.test.mjs:42' });

    const json = buildStateJson(config, state);
    const build = json.phases.find(p => p.name === 'Build')!;
    const tg = build.checks.find(c => c.id === 'tests-green')!;

    expect(tg.status).toBe('pass'); // the regression: was 'unchecked' under index-keying
    expect(tg.evidence).toBe('core-stats.test.mjs:42');
    expect(tg.evidenceRequired).toBe(true);
  });

  it('an unrecorded check is unchecked; a partially-done phase is incomplete', () => {
    const state = emptyState();
    setItemResult(state, 'Build', 'tests-green', { status: 'pass', message: 'confirmed' });
    // 'reviewed' is left unrecorded

    const json = buildStateJson(config, state);
    const build = json.phases.find(p => p.name === 'Build')!;
    expect(build.checks.find(c => c.id === 'reviewed')!.status).toBe('unchecked');
    expect(build.complete).toBe(false);
    expect(build.done).toBe(1);
    expect(build.total).toBe(2);
    // currentPhase is the first incomplete phase (Build at index 0)
    expect(json.currentPhase).toBe(0);
    expect(json.allComplete).toBe(false);
  });

  it('allComplete + null currentPhase once every check across every phase passes', () => {
    const state = emptyState();
    setItemResult(state, 'Build', 'tests-green', { status: 'pass', message: 'confirmed', evidence: 'x' });
    setItemResult(state, 'Build', 'reviewed', { status: 'pass', message: 'confirmed' });
    setItemResult(state, 'ship', 'changelog', { status: 'pass', message: 'confirmed' });

    const json = buildStateJson(config, state);
    expect(json.allComplete).toBe(true);
    expect(json.currentPhase).toBeNull();
    expect(json.phases.every(p => p.complete)).toBe(true);
  });

  it('a recorded FAIL is surfaced as status:fail, not a pass and not unchecked', () => {
    const state = emptyState();
    setItemResult(state, 'Build', 'tests-green', { status: 'fail', message: 'a test regressed' });

    const json = buildStateJson(config, state);
    const tg = json.phases[0].checks.find(c => c.id === 'tests-green')!;
    expect(tg.status).toBe('fail');
    expect(json.phases[0].complete).toBe(false); // a fail does not complete the gate
  });
});

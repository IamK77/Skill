import { findPhaseIndex, gatePriorPhases } from '../../src/resolver.js';
import { isPhaseComplete } from '../../src/state.js';
import type { ChecklistState } from '../../src/state.js';
import type { ChecklistConfig } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers (kept local; these do NOT duplicate resolver.test.ts helpers)
// ---------------------------------------------------------------------------

// Build a config from tuples of [phaseName, ...checkIds]. An empty tuple tail
// means the phase has zero checks.
function makeConfig(phases: string[][]): ChecklistConfig {
  return {
    phases: phases.map(([name, ...ids]) => ({
      name,
      checks: ids.map(id => ({ id, description: `desc:${id}` })),
    })),
  };
}

// Mark a phase's items as checked in state (status value is irrelevant to the
// gate; presence is what matters).
function check(
  state: ChecklistState,
  phaseIndex: number,
  ...itemIds: string[]
): ChecklistState {
  const key = String(phaseIndex);
  state.checked[key] = state.checked[key] ?? {};
  for (const id of itemIds) {
    state.checked[key][id] = { status: 'pass', message: 'ok' };
  }
  return state;
}

// ===========================================================================
// findPhaseIndex — boundary & blind-spot cases NOT covered by resolver.test.ts
// ===========================================================================

describe('findPhaseIndex — numeric-parse blind spots', () => {
  // Three phases: indices 0,1,2.
  const config = makeConfig([
    ['Setup', 's1'],
    ['Build', 'b1'],
    ['Deploy', 'd1'],
  ]);

  it('numeric "0" is the low boundary (>= 0 guard, inclusive)', () => {
    // Pins the `num >= 0` lower edge: index 0 must be accepted by the numeric
    // branch, not fall through to a name search.
    expect(findPhaseIndex(config, '0')).toBe(0);
  });

  it('exact phases.length ("3") is one-past-last and is rejected (< length is exclusive)', () => {
    // Boundary on the upper guard `num < config.phases.length`. length === 3,
    // so "3" must NOT be treated as an index; it falls to name search → throws.
    expect(() => findPhaseIndex(config, '3')).toThrow('Phase not found');
  });

  it('leading-whitespace numeric " 1" is parsed as index 1 (parseInt tolerates leading ws)', () => {
    // parseInt(" 1", 10) === 1. So a phase ref with a leading space still
    // resolves by index. If src ever switched to Number()/strict parse this
    // would change — this pins the current parseInt behavior.
    expect(findPhaseIndex(config, ' 1')).toBe(1);
  });

  it('numeric with trailing garbage "1abc" resolves to index 1 (parseInt stops at "a")', () => {
    // parseInt("1abc", 10) === 1, !isNaN, in range → numeric branch wins even
    // though "1abc" is not a clean integer and is not a phase name. Sharp
    // blind spot: coverage on the numeric branch never reveals this.
    expect(findPhaseIndex(config, '1abc')).toBe(1);
  });

  it('float-looking "1.9" resolves to index 1 (parseInt truncates at the dot)', () => {
    // parseInt("1.9", 10) === 1.
    expect(findPhaseIndex(config, '1.9')).toBe(1);
  });

  it('"2.0" (== last valid index as a float string) resolves to last index 2', () => {
    expect(findPhaseIndex(config, '2.0')).toBe(2);
  });

  it('empty string "" falls through to name search and throws', () => {
    // parseInt("", 10) === NaN → name search → no phase named "" → throws.
    expect(() => findPhaseIndex(config, '')).toThrow('Phase not found');
  });

  it('whitespace-only "   " falls through to name search and throws', () => {
    // parseInt("   ", 10) === NaN.
    expect(() => findPhaseIndex(config, '   ')).toThrow('Phase not found');
  });

  it('a phase name with surrounding whitespace is NOT trimmed before name match → throws', () => {
    // The name branch compares with .toLowerCase() but never trims. "Build "
    // (trailing space) is not NaN-safe (parseInt → NaN) and does not equal
    // "build", so it throws. Pins that there is no trim on the name path.
    expect(() => findPhaseIndex(config, 'Build ')).toThrow('Phase not found');
  });
});

describe('findPhaseIndex — numeric branch shadows a numeric-looking phase NAME', () => {
  // Phase literally NAMED "1" sitting at index 0, plus a normal phase at 1.
  const config = makeConfig([
    ['1'], // index 0, name is the string "1"
    ['Real'], // index 1
  ]);

  it('"1" resolves to the INDEX (1) — the numeric branch wins over the name "1" at index 0', () => {
    // parseInt("1",10)=1, in range → returns 1 (the index), so the phase named
    // "1" at index 0 is unreachable by that literal. Pins precedence: numeric
    // branch is checked BEFORE the name search.
    expect(findPhaseIndex(config, '1')).toBe(1);
  });

  it('"0" resolves to index 0 (which happens to be the phase named "1") — by index, not by name', () => {
    expect(findPhaseIndex(config, '0')).toBe(0);
  });
});

describe('findPhaseIndex — single-phase last-index boundary', () => {
  const config = makeConfig([['Only', 'x']]);

  it('"0" is both first and last valid index for a single-phase config', () => {
    expect(findPhaseIndex(config, '0')).toBe(0);
  });

  it('"1" is one past the only index → throws', () => {
    expect(() => findPhaseIndex(config, '1')).toThrow('Phase not found');
  });
});

// ===========================================================================
// gatePriorPhases — boundary, earliest-report, empty-phase, state-advance
// ===========================================================================

describe('gatePriorPhases — target index 0 never inspects prior state', () => {
  const config = makeConfig([
    ['P0', 'a'],
    ['P1', 'b'],
  ]);

  it('target 0 passes even when state already has unrelated/incomplete entries', () => {
    // There are no phases with index < 0, so the loop body never runs and the
    // gate cannot fail regardless of what state holds.
    const state: ChecklistState = { checked: { '0': {} /* incomplete */ } };
    const result = gatePriorPhases(config, 0, state);
    expect(result.passed).toBe(true);
    expect(result.failedPhase).toBeUndefined();
    expect(result.failedPhaseIndex).toBeUndefined();
  });
});

describe('gatePriorPhases — does NOT gate the target phase itself (i < target, not <=)', () => {
  const config = makeConfig([
    ['P0', 'a'],
    ['P1', 'b'],
    ['P2', 'c'],
  ]);

  it('target phase 1 passes while phase 1 itself is empty, as long as phase 0 is complete', () => {
    // Off-by-one pin: the loop is `i < targetPhaseIndex`. The target's own
    // completeness is irrelevant. Only phase 0 is gated here.
    const state = check({ checked: {} }, 0, 'a'); // phase 0 complete, phase 1 untouched
    const result = gatePriorPhases(config, 1, state);
    expect(result.passed).toBe(true);
  });

  it('target phase 2 fails on phase 1 even when the target (phase 2) is fully complete', () => {
    // Completing the target does not help; an incomplete prior still blocks.
    const state: ChecklistState = { checked: {} };
    check(state, 0, 'a'); // phase 0 complete
    // phase 1 (id 'b') left incomplete
    check(state, 2, 'c'); // target phase 2 complete (should not matter)
    const result = gatePriorPhases(config, 2, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P1');
    expect(result.failedPhaseIndex).toBe(1);
  });
});

describe('gatePriorPhases — reports the EARLIEST incomplete prior phase', () => {
  const config = makeConfig([
    ['P0', 'a'],
    ['P1', 'b'],
    ['P2', 'c'],
    ['P3', 'd'],
  ]);

  it('with phases 1 AND 2 both incomplete, reports phase 1 (the earliest), not phase 2', () => {
    // Mutation mindset: if the loop iterated in reverse or returned the LAST
    // incomplete, this would report P2. Pins forward order + early return.
    const state: ChecklistState = { checked: {} };
    check(state, 0, 'a'); // complete
    // phase 1 'b' missing, phase 2 'c' missing (both incomplete)
    const result = gatePriorPhases(config, 3, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P1');
    expect(result.failedPhaseIndex).toBe(1);
  });

  it('exactly one prior incomplete (a middle one) is reported precisely', () => {
    const state: ChecklistState = { checked: {} };
    check(state, 0, 'a');
    // phase 1 'b' missing
    check(state, 2, 'c'); // complete (out of order completion still counts)
    const result = gatePriorPhases(config, 3, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P1');
    expect(result.failedPhaseIndex).toBe(1);
  });
});

describe('gatePriorPhases — a prior phase with ZERO checks is vacuously complete', () => {
  // Phase 1 has no checks at all.
  const config = makeConfig([
    ['P0', 'a'],
    ['EmptyPrior'], // index 1, zero checks
    ['P2', 'c'],
  ]);

  it('empty prior phase never blocks the gate (isPhaseComplete over [] is true)', () => {
    // Blind spot: isPhaseComplete uses `every`, which is true on an empty list.
    // So a checkless prior phase always passes the gate even with empty state.
    const state = check({ checked: {} }, 0, 'a'); // only phase 0 needs completing
    const result = gatePriorPhases(config, 2, state);
    expect(result.passed).toBe(true);
  });

  it('sanity: the empty phase really is vacuously complete via isPhaseComplete', () => {
    // Direct pin so the reasoning above is anchored to real state behavior.
    expect(isPhaseComplete({ checked: {} }, 1, [])).toBe(true);
  });
});

describe('gatePriorPhases — partial completion of a prior phase still blocks', () => {
  // Phase 0 has TWO checks; completing only one must not pass the gate.
  const config = makeConfig([
    ['P0', 'a', 'b'],
    ['P1', 'c'],
  ]);

  it('one of two prior checks done → still incomplete → gate fails at that phase', () => {
    const state = check({ checked: {} }, 0, 'a'); // 'b' still missing
    const result = gatePriorPhases(config, 1, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P0');
    expect(result.failedPhaseIndex).toBe(0);
  });
});

describe('gatePriorPhases — CALL-IT-TWICE / write-then-resolve (state advance)', () => {
  const config = makeConfig([
    ['P0', 'a', 'b'],
    ['P1', 'c'],
  ]);

  it('is a pure read: calling twice on the SAME state yields identical results', () => {
    const state = check({ checked: {} }, 0, 'a'); // incomplete prior
    const first = gatePriorPhases(config, 1, state);
    const second = gatePriorPhases(config, 1, state);
    expect(first).toEqual(second);
    expect(first.passed).toBe(false);
    expect(first.failedPhaseIndex).toBe(0);
  });

  it('does not mutate the passed-in state (no self-healing / advancing here)', () => {
    const state = check({ checked: {} }, 0, 'a');
    const snapshot = JSON.parse(JSON.stringify(state));
    gatePriorPhases(config, 1, state);
    expect(state).toEqual(snapshot);
  });

  it('fail → complete the missing prior item → re-gate now passes (write-then-resolve)', () => {
    const state = check({ checked: {} }, 0, 'a'); // 'b' missing
    expect(gatePriorPhases(config, 1, state).passed).toBe(false);

    check(state, 0, 'b'); // resolve the gap
    const after = gatePriorPhases(config, 1, state);
    expect(after.passed).toBe(true);
    expect(after.failedPhase).toBeUndefined();
    expect(after.failedPhaseIndex).toBeUndefined();
  });
});

describe('gatePriorPhases — targetPhaseIndex past the end of the phases array', () => {
  // Guards behavior when callers pass an over-large target (e.g. derived from a
  // stale index). The loop indexes config.phases[i] up to target-1.
  const config = makeConfig([
    ['P0', 'a'],
    ['P1', 'b'],
  ]);

  it('target == phases.length gates ALL existing phases (no out-of-bounds access)', () => {
    // i runs 0..length-1, which are all valid. With everything complete it
    // passes; this confirms no off-by-one over-reach at the exact length.
    const state: ChecklistState = { checked: {} };
    check(state, 0, 'a');
    check(state, 1, 'b');
    expect(gatePriorPhases(config, config.phases.length, state).passed).toBe(true);
  });

  it('target == phases.length still reports the earliest incomplete among all phases', () => {
    const state = check({ checked: {} }, 1, 'b'); // phase 0 'a' missing
    const result = gatePriorPhases(config, config.phases.length, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P0');
    expect(result.failedPhaseIndex).toBe(0);
  });

  it('target > phases.length: a missing prior phase is reported before any out-of-bounds index is read', () => {
    // With phase 0 incomplete, the loop returns at i=0 long before reaching the
    // out-of-bounds index, so this is well-defined and fails at P0.
    const state: ChecklistState = { checked: {} }; // nothing complete
    const result = gatePriorPhases(config, 99, state);
    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('P0');
    expect(result.failedPhaseIndex).toBe(0);
  });

  it('target > phases.length with all real phases complete: reading config.phases[length] (undefined) throws', () => {
    // BLIND SPOT / current behavior: when every real prior phase is complete,
    // the loop advances to i === phases.length, where config.phases[i] is
    // undefined and `phase.checks` throws a TypeError. Pinning CURRENT
    // behavior — gatePriorPhases has no upper-bound guard on targetPhaseIndex.
    const state: ChecklistState = { checked: {} };
    check(state, 0, 'a');
    check(state, 1, 'b');
    expect(() => gatePriorPhases(config, config.phases.length + 1, state)).toThrow(
      TypeError,
    );
  });
});

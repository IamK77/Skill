// Boundary / blind-spot suite for src/formatter.ts.
//
// The existing formatter.test.ts hits the happy paths and was 100% coverage,
// yet still shipped a last-phase off-by-one. This file hunts the *siblings* of
// that bug: exact-boundary inputs, equivalence-class edges, the single-phase
// config (index 0 is ALSO the last phase), padDots width arithmetic, and the
// "current phase" math when phases complete out of order.
//
// Conventions: vitest globals (describe/it/expect) — no imports for them.
// formatter.ts is pure (no fs / env), so no sandbox save/restore needed here.

import {
  formatInit,
  formatOverview,
  formatPhaseShow,
  formatVerifyResult,
  formatCheckConfirm,
  formatGateFailure,
  formatPhases,
} from '../../src/formatter.js';
import type { ChecklistConfig, PhaseResult, CheckItemResult } from '../../src/types.js';
import type { ChecklistState } from '../../src/state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeConfig(
  phases: { name: string; checks: { id: string; description: string }[] }[],
): ChecklistConfig {
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

// State is keyed by phase NAME now (case-folded), not numeric index. Each entry
// names its phase by NAME; the helper folds case to match phaseKeyOf in state.ts.
function stateWith(
  entries: { phase: string; id: string; status?: 'pass' | 'fail' | 'error'; message?: string }[],
): ChecklistState {
  const state: ChecklistState = { checked: {} };
  for (const e of entries) {
    const key = e.phase.toLowerCase();
    if (!state.checked[key]) state.checked[key] = {};
    state.checked[key][e.id] = { status: e.status ?? 'pass', message: e.message ?? '' };
  }
  return state;
}

// A phase result with a single mechanical check, passing + recorded.
function singleMechPhase(phaseIndex: number, id = 'x'): PhaseResult {
  return {
    phaseName: 'P',
    phaseIndex,
    checks: [
      { item: { id, description: 'd' }, kind: 'mechanical', result: { status: 'pass', message: 'ok' } },
    ],
    mechanicalPassed: 1,
    mechanicalTotal: 1,
    manualCount: 0,
  };
}

// ---------------------------------------------------------------------------
// padDots — exercised via formatPhaseShow (left=id, right=description on the
// UNCHECKED-with-no-result path so the bare `line` is returned unannotated).
// width defaults to 50. dotsCount = 50 - id.length - description.length.
//   dotsCount >= 3  -> `${id} ${'.'*dotsCount} ${description}`  (line len = 52)
//   dotsCount <  3  -> `${id} .. ${description}`                (fixed 2 dots)
// ---------------------------------------------------------------------------

// Extract the rendered check line (the one starting with "1. ") from a show.
function checkLineOf(rendered: string): string {
  const line = rendered.split('\n').find(l => l.startsWith('1. '));
  if (line === undefined) throw new Error(`no check line in:\n${rendered}`);
  return line;
}

// Render a single unchecked check whose id/desc drive padDots, return the
// "ID ... DESC" substring (everything after the "1. [ ] " prefix).
function padDotsBody(id: string, description: string): string {
  const pr: PhaseResult = {
    phaseName: 'P',
    phaseIndex: 0,
    // mechanical with NO result => formatPhaseShow returns the bare `line`,
    // so no "-> [reading]/[ERROR]" trailer to confuse substring checks.
    checks: [{ item: { id, description }, kind: 'mechanical' }],
    mechanicalPassed: 0,
    mechanicalTotal: 1,
    manualCount: 0,
  };
  const line = checkLineOf(formatPhaseShow(pr, emptyState()));
  const prefix = '1. [ ] ';
  expect(line.startsWith(prefix)).toBe(true);
  return line.slice(prefix.length);
}

describe('padDots boundary arithmetic (via formatPhaseShow)', () => {
  it('dotsCount === 3 (exact threshold) uses the dot-repeat branch, NOT the .. fallback', () => {
    // id.length + desc.length = 47 -> dotsCount = 3
    const id = 'a'.repeat(40);
    const desc = 'b'.repeat(7);
    const body = padDotsBody(id, desc);
    expect(body).toBe(`${id} ${'.'.repeat(3)} ${desc}`);
    // Pin: the off-by-one sibling. If `< 3` were `<= 3`, this would be " .. ".
    expect(body).not.toContain(' .. ');
    // Full body length = id + 1 + 3 + 1 + desc = width + 2 = 52.
    expect(body.length).toBe(52);
  });

  it('dotsCount === 2 (just under threshold) falls back to the fixed " .. " form', () => {
    // id.length + desc.length = 48 -> dotsCount = 2 -> fallback
    const id = 'a'.repeat(40);
    const desc = 'b'.repeat(8);
    const body = padDotsBody(id, desc);
    expect(body).toBe(`${id} .. ${desc}`);
  });

  it('dotsCount === 4 (one above threshold) repeats exactly 4 dots', () => {
    // 40 + 6 = 46 -> dotsCount = 4
    const id = 'a'.repeat(40);
    const desc = 'b'.repeat(6);
    const body = padDotsBody(id, desc);
    expect(body).toBe(`${id} .... ${desc}`);
    expect(body.length).toBe(52);
  });

  it('dotsCount === 0 (left+right exactly fill width) uses the .. fallback', () => {
    // 25 + 25 = 50 -> dotsCount = 0
    const body = padDotsBody('a'.repeat(25), 'b'.repeat(25));
    expect(body).toBe(`${'a'.repeat(25)} .. ${'b'.repeat(25)}`);
  });

  it('dotsCount negative (id alone longer than width) still uses .. fallback without throwing', () => {
    // id.length = 60 > width 50 -> dotsCount = 50 - 60 - 1 = -11
    const id = 'a'.repeat(60);
    const body = padDotsBody(id, 'b');
    expect(body).toBe(`${id} .. b`);
  });

  it('empty id and empty description still produce a valid dotted line', () => {
    // 0 + 0 = 0 -> dotsCount = 50 -> repeat branch with 50 dots
    const body = padDotsBody('', '');
    expect(body).toBe(` ${'.'.repeat(50)} `);
    expect(body.length).toBe(52);
  });

  it('multibyte unicode id counts UTF-16 code units, not glyphs (surrogate pairs widen)', () => {
    // An emoji like 🚀 is a surrogate pair => .length === 2 per glyph.
    // 3 rockets => "id".length is 6, even though it looks like 3 chars.
    const id = '🚀🚀🚀'; // length 6
    expect(id.length).toBe(6);
    const desc = 'x'.repeat(41); // 6 + 41 = 47 -> dotsCount = 3
    const body = padDotsBody(id, desc);
    expect(body).toBe(`${id} ${'.'.repeat(3)} ${desc}`);
    // Sanity: had .length measured glyphs (3) instead of code units (6),
    // dotsCount would be 6 and this assertion would fail.
  });
});

// ---------------------------------------------------------------------------
// formatInit — cleared vs not, and the call-it-twice overwrite of the header.
// ---------------------------------------------------------------------------

describe('formatInit boundaries', () => {
  it('single-phase config still reports "1 phases" (no pluralization logic)', () => {
    const cfg = makeConfig([{ name: 'Solo', checks: [{ id: 'a', description: '' }] }]);
    const out = formatInit(cfg, false);
    expect(out.split('\n')[0]).toBe('checklist ready, 1 phases');
  });

  it('zero-phase config reports "0 phases" with no phase lines', () => {
    const cfg = makeConfig([]);
    const out = formatInit(cfg, false);
    // join('') of an empty phaseList leaves a trailing empty line after header.
    expect(out).toBe('checklist ready, 0 phases\n');
  });

  it('cleared flag only changes the header, not the phase list (toggle is idempotent on body)', () => {
    const cfg = makeConfig([
      { name: 'Setup', checks: [{ id: 'a', description: '' }] },
      { name: 'Build', checks: [{ id: 'b', description: '' }, { id: 'c', description: '' }] },
    ]);
    const cleared = formatInit(cfg, true);
    const fresh = formatInit(cfg, false);
    const clearedBody = cleared.split('\n').slice(1).join('\n');
    const freshBody = fresh.split('\n').slice(1).join('\n');
    expect(clearedBody).toBe(freshBody);
    expect(cleared.split('\n')[0]).toBe('checklist ready, 2 phases (previous state cleared)');
    expect(fresh.split('\n')[0]).toBe('checklist ready, 2 phases');
  });

  it('exact full-string render for a known config (pins formatting, not just contains)', () => {
    const cfg = makeConfig([
      { name: 'Setup', checks: [{ id: 'a', description: '' }, { id: 'b', description: '' }] },
      { name: 'Ship', checks: [{ id: 'c', description: '' }] },
    ]);
    expect(formatInit(cfg, false)).toBe(
      'checklist ready, 2 phases\n  0: Setup (2 checks)\n  1: Ship (1 checks)',
    );
  });
});

// ---------------------------------------------------------------------------
// formatPhaseShow — the single-phase / last-phase off-by-one and its edges.
// ---------------------------------------------------------------------------

describe('formatPhaseShow last-phase boundary (the off-by-one zone)', () => {
  it('single-phase config: phaseIndex 0 IS the last phase -> "all phases complete", never "proceed to PHASE 1"', () => {
    const pr = singleMechPhase(0);
    const state = stateWith([{ phase: 'P', id: 'x' }]);
    const out = formatPhaseShow(pr, state, 1); // totalPhases = 1
    expect(out).toContain('PHASE 0 passed — all phases complete, run `checklist done`');
    expect(out).not.toContain('proceed to PHASE 1');
  });

  it('isLast uses >= : phaseIndex one past last (== totalPhases) also yields completion text', () => {
    // Defensive: index 3 with totalPhases 3 -> 3 >= 2 -> isLast true.
    const pr = singleMechPhase(3);
    const state = stateWith([{ phase: 'P', id: 'x' }]);
    const out = formatPhaseShow(pr, state, 3);
    expect(out).toContain('PHASE 3 passed — all phases complete');
    expect(out).not.toContain('proceed to PHASE 4');
  });

  it('exact-last boundary: index === totalPhases-1 -> completion; index === totalPhases-2 -> proceed', () => {
    const last = singleMechPhase(4);
    const lastOut = formatPhaseShow(last, stateWith([{ phase: 'P', id: 'x' }]), 5);
    expect(lastOut).toContain('all phases complete');

    const penult = singleMechPhase(3);
    const penultOut = formatPhaseShow(penult, stateWith([{ phase: 'P', id: 'x' }]), 5);
    expect(penultOut).toContain('PHASE 3 passed, proceed to PHASE 4');
    expect(penultOut).not.toContain('all phases complete');
  });

  it('totalPhases undefined: even the genuine last phase says "proceed to PHASE N+1" (cannot know it is last)', () => {
    // This is the pre-fix blind spot: without totalPhases, isLast is false.
    const pr = singleMechPhase(2);
    const out = formatPhaseShow(pr, stateWith([{ phase: 'P', id: 'x' }]), undefined);
    expect(out).toContain('PHASE 2 passed, proceed to PHASE 3');
    expect(out).not.toContain('all phases complete');
  });

  it('first phase (index 0) of a multi-phase config proceeds to PHASE 1', () => {
    const pr = singleMechPhase(0);
    const out = formatPhaseShow(pr, stateWith([{ phase: 'P', id: 'x' }]), 4);
    expect(out).toContain('PHASE 0 passed, proceed to PHASE 1');
  });

  it('empty checks (done===total===0) is treated as complete -> emits a verdict line, not "0/0 completed"', () => {
    // phaseProgress over [] gives done=0,total=0 => done===total => verdict branch.
    const pr: PhaseResult = {
      phaseName: 'Empty', phaseIndex: 0, checks: [],
      mechanicalPassed: 0, mechanicalTotal: 0, manualCount: 0,
    };
    const lastOut = formatPhaseShow(pr, emptyState(), 1);
    expect(lastOut).toContain('all phases complete');
    expect(lastOut).not.toContain('0/0 completed');

    const midOut = formatPhaseShow(pr, emptyState(), 3);
    expect(midOut).toContain('proceed to PHASE 1');
  });
});

describe('formatPhaseShow call-it-twice / overwrite semantics', () => {
  it('is a pure function: same inputs render byte-identical twice (no hidden state)', () => {
    const pr = singleMechPhase(1);
    const state = stateWith([{ phase: 'P', id: 'x' }]);
    const a = formatPhaseShow(pr, state, 4);
    const b = formatPhaseShow(pr, state, 4);
    expect(a).toBe(b);
  });

  it('checking the remaining item flips "1/2 completed" into the passed verdict', () => {
    const pr: PhaseResult = {
      phaseName: 'Build', phaseIndex: 0,
      checks: [
        { item: { id: 'lint', description: 'd' }, kind: 'mechanical', result: { status: 'pass', message: '' } },
        { item: { id: 'test', description: 'd' }, kind: 'mechanical', result: { status: 'pass', message: '' } },
      ],
      mechanicalPassed: 2, mechanicalTotal: 2, manualCount: 0,
    };
    const partial = formatPhaseShow(pr, stateWith([{ phase: 'Build', id: 'lint' }]), 3);
    expect(partial).toContain('1/2 completed');
    expect(partial).not.toContain('proceed to PHASE 1');

    const full = formatPhaseShow(pr, stateWith([{ phase: 'Build', id: 'lint' }, { phase: 'Build', id: 'test' }]), 3);
    expect(full).toContain('PHASE 0 passed, proceed to PHASE 1');
    expect(full).not.toContain('1/2 completed');
  });

  it('a checked item suppresses its "-> [reading]" / manual annotations entirely', () => {
    // Checked items short-circuit to the bare line regardless of kind/result.
    const pr: PhaseResult = {
      phaseName: 'Mix', phaseIndex: 0,
      checks: [
        { item: { id: 'm', description: 'manual thing' }, kind: 'manual' },
        { item: { id: 'k', description: 'mech thing' }, kind: 'mechanical', result: { status: 'pass', message: 'reading-msg' } },
      ],
      mechanicalPassed: 1, mechanicalTotal: 1, manualCount: 1,
    };
    const out = formatPhaseShow(pr, stateWith([{ phase: 'Mix', id: 'm' }, { phase: 'Mix', id: 'k' }]), 2);
    expect(out).not.toContain('[manual confirmation required]');
    expect(out).not.toContain('[reading]');
    expect(out).not.toContain('reading-msg');
  });
});

// ---------------------------------------------------------------------------
// formatVerifyResult — verdict line (totalPhases) parity with formatPhaseShow,
// plus the mechanical/manual summary equivalence classes.
// ---------------------------------------------------------------------------

describe('formatVerifyResult last-phase boundary', () => {
  it('single-phase verify: index 0 with totalPhases 1 -> "verified — all phases complete"', () => {
    const pr = singleMechPhase(0);
    const out = formatVerifyResult(pr, stateWith([{ phase: 'P', id: 'x' }]), 1);
    expect(out).toContain('PHASE 0 verified — all phases complete, run `checklist done`');
    expect(out).not.toContain('proceed to PHASE 1');
  });

  it('non-last verify still proceeds; exact-last vs penultimate differ', () => {
    const lastOut = formatVerifyResult(singleMechPhase(2), stateWith([{ phase: 'P', id: 'x' }]), 3);
    expect(lastOut).toContain('all phases complete');

    const penultOut = formatVerifyResult(singleMechPhase(1), stateWith([{ phase: 'P', id: 'x' }]), 3);
    expect(penultOut).toContain('PHASE 1 verified, proceed to PHASE 2');
    expect(penultOut).not.toContain('all phases complete');
  });

  it('totalPhases undefined: no "verified — all phases complete", but DOES emit the proceed verdict', () => {
    // done===total so the verdict block runs; isLast false => proceed line.
    const out = formatVerifyResult(singleMechPhase(0), stateWith([{ phase: 'P', id: 'x' }]), undefined);
    expect(out).toContain('PHASE 0 verified, proceed to PHASE 1');
    expect(out).not.toContain('all phases complete');
  });

  it('incomplete phase emits NO verdict line at all (done !== total)', () => {
    const pr: PhaseResult = {
      phaseName: 'Build', phaseIndex: 0,
      checks: [
        { item: { id: 'a', description: 'd' }, kind: 'mechanical', result: { status: 'pass', message: '' } },
        { item: { id: 'b', description: 'd' }, kind: 'mechanical', result: { status: 'fail', message: 'no' } },
      ],
      mechanicalPassed: 1, mechanicalTotal: 2, manualCount: 0,
    };
    const out = formatVerifyResult(pr, stateWith([{ phase: 'Build', id: 'a' }]), 3);
    expect(out).not.toContain('verified');
    expect(out).not.toContain('proceed to PHASE');
  });
});

describe('formatVerifyResult summary-line equivalence classes', () => {
  it('mechanicalTotal === 0 (boundary): no mechanical line even with manuals present', () => {
    const pr: PhaseResult = {
      phaseName: 'Review', phaseIndex: 0,
      checks: [{ item: { id: 'r', description: 'd' }, kind: 'manual' }],
      mechanicalPassed: 0, mechanicalTotal: 0, manualCount: 1,
    };
    expect(formatVerifyResult(pr, emptyState())).not.toContain('mechanical:');
  });

  it('mechanicalTotal === 1 (just over boundary): mechanical line appears', () => {
    const pr = singleMechPhase(0);
    expect(formatVerifyResult(pr, emptyState())).toContain('mechanical: 1/1 passed');
  });

  it('manual remaining exactly 0 after checking the last one: no "manual:" line (boundary remaining>0)', () => {
    const pr: PhaseResult = {
      phaseName: 'Review', phaseIndex: 0,
      checks: [{ item: { id: 'r', description: 'd' }, kind: 'manual' }],
      mechanicalPassed: 0, mechanicalTotal: 0, manualCount: 1,
    };
    // unchecked -> "manual: 1 pending"; checked -> remaining 0 -> no line.
    expect(formatVerifyResult(pr, emptyState())).toContain('manual: 1 pending');
    expect(formatVerifyResult(pr, stateWith([{ phase: 'Review', id: 'r' }]))).not.toContain('manual:');
  });

  it('manual checked count only counts manual-kind items, not stray mechanical state entries with same id', () => {
    // A mechanical item id collides with state, but manualChecked filters kind==='manual'.
    const pr: PhaseResult = {
      phaseName: 'Mix', phaseIndex: 0,
      checks: [
        { item: { id: 'm1', description: 'd' }, kind: 'manual' },
        { item: { id: 'm2', description: 'd' }, kind: 'manual' },
        { item: { id: 'mech', description: 'd' }, kind: 'mechanical', result: { status: 'pass', message: '' } },
      ],
      mechanicalPassed: 1, mechanicalTotal: 1, manualCount: 2,
    };
    // Only the mechanical id is in state. manualChecked must be 0 -> remaining 2.
    const out = formatVerifyResult(pr, stateWith([{ phase: 'Mix', id: 'mech' }]), 3);
    expect(out).toContain('manual: 2 pending');
  });

  it('manual verify line: unchecked manual emits the exact "run: checklist check <phase> <id>" hint', () => {
    const pr: PhaseResult = {
      phaseName: 'Review', phaseIndex: 6,
      checks: [{ item: { id: 'sign-off', description: 'desc' }, kind: 'manual' }],
      mechanicalPassed: 0, mechanicalTotal: 0, manualCount: 1,
    };
    const out = formatVerifyResult(pr, emptyState());
    expect(out).toContain('-> run: checklist check 6 sign-off');
  });

  it('failing mechanical with empty message renders literal "FAIL: unknown" (falsy message -> default)', () => {
    const pr: PhaseResult = {
      phaseName: 'B', phaseIndex: 0,
      checks: [{ item: { id: 'k', description: 'd' }, kind: 'mechanical', result: { status: 'fail', message: '' } }],
      mechanicalPassed: 0, mechanicalTotal: 1, manualCount: 0,
    };
    // empty string is falsy -> `|| 'unknown'`.
    const body = checkLineOf(formatVerifyResult(pr, emptyState()));
    expect(body).toContain('FAIL: unknown');
  });

  it('error-status mechanical (not "pass") renders as a FAIL with its message', () => {
    const pr: PhaseResult = {
      phaseName: 'B', phaseIndex: 0,
      checks: [{ item: { id: 'k', description: 'd' }, kind: 'mechanical', result: { status: 'error', message: 'boom' } }],
      mechanicalPassed: 0, mechanicalTotal: 1, manualCount: 0,
    };
    const body = checkLineOf(formatVerifyResult(pr, emptyState()));
    expect(body).toContain('[ ]');
    expect(body).toContain('FAIL: boom');
    expect(body).not.toContain('PASS');
  });
});

// ---------------------------------------------------------------------------
// formatOverview — "current phase" math across completion orderings.
// ---------------------------------------------------------------------------

describe('formatOverview current-phase math', () => {
  const cfg3 = makeConfig([
    { name: 'A', checks: [{ id: 'a1', description: '' }, { id: 'a2', description: '' }] },
    { name: 'B', checks: [{ id: 'b1', description: '' }] },
    { name: 'C', checks: [{ id: 'c1', description: '' }] },
  ]);

  it('a LATER phase started before an earlier one: current phase is the earliest incomplete (PHASE 0)', () => {
    // Phase 2 has progress, phases 0 & 1 untouched. currentPhase must be 0 (first
    // incomplete encountered), NOT 2. This is the out-of-order blind spot.
    const state = stateWith([{ phase: 'C', id: 'c1' }]);
    const out = formatOverview(cfg3, state);
    expect(out).toContain('current phase: PHASE 0');
  });

  it('earlier phase fully passed, a later phase has progress -> current phase is the first NON-complete (the partial later one only if all before it are done)', () => {
    // Phase 0 complete, phase 1 untouched, phase 2 has progress.
    // First non-complete walking 0..n is phase 1 (pending) -> current = 1.
    const state = stateWith([
      { phase: 'A', id: 'a1' }, { phase: 'A', id: 'a2' },
      { phase: 'C', id: 'c1' },
    ]);
    const out = formatOverview(cfg3, state);
    expect(out).toContain('current phase: PHASE 1');
  });

  it('all phases complete EXCEPT the last yields current phase = last index', () => {
    const state = stateWith([
      { phase: 'A', id: 'a1' }, { phase: 'A', id: 'a2' },
      { phase: 'B', id: 'b1' },
    ]);
    const out = formatOverview(cfg3, state);
    expect(out).toContain('current phase: PHASE 2');
    expect(out).not.toContain('all phases passed');
  });

  it('every phase complete -> "all phases passed" and NO "current phase" line', () => {
    const state = stateWith([
      { phase: 'A', id: 'a1' }, { phase: 'A', id: 'a2' },
      { phase: 'B', id: 'b1' },
      { phase: 'C', id: 'c1' },
    ]);
    const out = formatOverview(cfg3, state);
    expect(out).toContain('all phases passed');
    expect(out).not.toContain('current phase');
  });

  it('single-phase config, complete -> "all phases passed"', () => {
    const cfg1 = makeConfig([{ name: 'Solo', checks: [{ id: 's', description: '' }] }]);
    const out = formatOverview(cfg1, stateWith([{ phase: 'Solo', id: 's' }]));
    expect(out).toContain('all phases passed');
  });

  it('single-phase config, untouched -> "current phase: PHASE 0"', () => {
    const cfg1 = makeConfig([{ name: 'Solo', checks: [{ id: 's', description: '' }] }]);
    const out = formatOverview(cfg1, emptyState());
    expect(out).toContain('current phase: PHASE 0');
  });

  it('empty config (zero phases): no phase complete to violate "every", so allDone is vacuously TRUE -> "all phases passed"', () => {
    // [].every(...) === true. Pins the vacuous-truth edge.
    const cfg0 = makeConfig([]);
    const out = formatOverview(cfg0, emptyState());
    expect(out).toContain('all phases passed');
    expect(out).not.toContain('current phase');
  });

  it('a phase with ZERO checks is "complete" (isPhaseComplete over [] is true) and is skipped as current', () => {
    // Phase 0 has no checks -> complete. Phase 1 pending -> current phase 1.
    const cfg = makeConfig([
      { name: 'NoChecks', checks: [] },
      { name: 'Real', checks: [{ id: 'r', description: '' }] },
    ]);
    const out = formatOverview(cfg, emptyState());
    const phase0Line = out.split('\n').find(l => l.includes('PHASE 0:'));
    expect(phase0Line).toContain('[x] passed');
    expect(out).toContain('current phase: PHASE 1');
  });

  it('partial-progress phase reports "done/total" with the real total, and pads name to width 20', () => {
    const state = stateWith([{ phase: 'A', id: 'a1' }]);
    const line = formatOverview(cfg3, state).split('\n').find(l => l.includes('PHASE 0:'))!;
    expect(line).toContain('[ ] 1/2');
    // name 'A' uppercased + padEnd(20): "A" + 19 spaces between name and status.
    expect(line).toContain('PHASE 0: ' + 'A'.padEnd(20) + ' [ ] 1/2');
  });
});

// ---------------------------------------------------------------------------
// formatCheckConfirm / formatGateFailure / formatPhases — exact strings.
// ---------------------------------------------------------------------------

describe('formatCheckConfirm exact form', () => {
  it('ignores phaseIndex entirely in the output (only itemId is used)', () => {
    // The phaseIndex param is unused in the rendered string — pin that.
    const a = formatCheckConfirm(0, 'item-x');
    const b = formatCheckConfirm(99, 'item-x');
    expect(a).toBe('[x] item-x .. confirmed');
    expect(a).toBe(b);
  });

  it('uses a literal " .. " separator (two dots), not padDots width logic', () => {
    const out = formatCheckConfirm(3, 'longish-identifier-name');
    expect(out).toBe('[x] longish-identifier-name .. confirmed');
    expect(out).not.toContain('...');
  });
});

describe('formatGateFailure exact form', () => {
  it('renders index and name verbatim (name NOT uppercased)', () => {
    expect(formatGateFailure('lower case name', 2)).toBe('gate blocked: PHASE 2 (lower case name) incomplete');
  });

  it('handles index 0', () => {
    expect(formatGateFailure('Setup', 0)).toBe('gate blocked: PHASE 0 (Setup) incomplete');
  });
});

describe('formatPhases exact form', () => {
  it('empty config renders an empty string (no lines, no newline)', () => {
    expect(formatPhases(makeConfig([]))).toBe('');
  });

  it('preserves original casing of phase names (no uppercase, unlike overview/show)', () => {
    const cfg = makeConfig([{ name: 'MixedCase', checks: [{ id: 'a', description: '' }] }]);
    expect(formatPhases(cfg)).toBe('0: MixedCase (1 checks)');
  });

  it('check count reflects array length including zero', () => {
    const cfg = makeConfig([
      { name: 'A', checks: [] },
      { name: 'B', checks: [{ id: 'b', description: '' }] },
    ]);
    expect(formatPhases(cfg)).toBe('0: A (0 checks)\n1: B (1 checks)');
  });
});

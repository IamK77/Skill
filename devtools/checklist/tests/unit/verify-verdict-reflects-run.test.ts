// assay VERIFY probe — INTERNAL-CONSISTENCY oracle.
//
// Candidate defect: formatVerifyResult prints the "PHASE N verified / proceed /
// all phases complete" verdict whenever STORED state has done===total, even when
// THIS run's mechanical checks did not all pass. verify.ts:34 exits 1 precisely
// when `result.mechanicalPassed < result.mechanicalTotal`, so the verdict and the
// exit code (two encodings of "did THIS run pass?") contradict each other in one
// output:  `mechanical: 0/1 passed` + exit 1  alongside  `PHASE 0 verified ...`.
//
// ORACLE (internal consistency, not an invented spec clause): the verdict line is
// the run's pass/proceed signal (per the formatter's own comment, lines 136-137),
// so it must agree with the exit-driving condition. When this run is red
// (mechanicalPassed < mechanicalTotal), the output must NOT claim verified/proceed.
//
// Fixture builds the divergent case the existing suite never constructs: stored
// state records the check green (a PREVIOUS run passed and verify.ts only ever
// WRITES passes, never clears on failure), but the PhaseResult for THIS run is red.
//
// Conventions: vitest globals (describe/it/expect) — no imports for them.

import { formatVerifyResult } from '../../src/formatter.js';
import type { PhaseResult } from '../../src/types.js';
import type { ChecklistState } from '../../src/state.js';

// Stored state: the check `gate-check` was recorded green by an earlier verify run.
// (verify.ts only setItemResult()s on status==='pass' and never deletes on fail,
// so once-green-now-red checks linger in state exactly like this.)
function statePreviouslyGreen(): ChecklistState {
  return { checked: { '0': { 'gate-check': { status: 'pass', message: 'OK' } } } };
}

// THIS run's result: the same single mechanical check FAILED this invocation
// (e.g. `shell:test -f /tmp/FLAG` after the flag was removed).
function thisRunRed(): PhaseResult {
  return {
    phaseName: 'Build',
    phaseIndex: 0,
    checks: [
      {
        item: { id: 'gate-check', description: 'flag present' },
        kind: 'mechanical',
        result: { status: 'fail', message: 'Command failed: test -f /tmp/FLAG' },
      },
    ],
    mechanicalPassed: 0, // <-- drives exit 1 in verify.ts:34
    mechanicalTotal: 1,
    manualCount: 0,
  };
}

describe('formatVerifyResult verdict must agree with this-run result (internal consistency)', () => {
  it('does NOT print a verified/proceed verdict when this run is red, even if stored state is green', () => {
    const out = formatVerifyResult(thisRunRed(), statePreviouslyGreen(), 1);

    // Ground the contradiction: this run genuinely failed and DOES report it.
    expect(out).toContain('mechanical: 0/1 passed');
    expect(out).toContain('FAIL:');

    // The oracle: a red run must not also be told it is verified / may proceed /
    // is complete. Each of these contradicts the `0/1 passed` + exit-1 signal.
    expect(out).not.toContain('verified');
    expect(out).not.toContain('all phases complete');
    expect(out).not.toContain('proceed to PHASE');
    expect(out).not.toContain('checklist done');
  });

  it('the exit-driving condition and the verdict are the same fact: red run => no green verdict', () => {
    const result = thisRunRed();
    const runIsRed = result.mechanicalPassed < result.mechanicalTotal; // verify.ts:34 exits 1 here
    const out = formatVerifyResult(result, statePreviouslyGreen(), 1);

    const claimsSuccess =
      out.includes('verified') ||
      out.includes('all phases complete') ||
      out.includes('proceed to PHASE');

    // If this run is red, the output must not simultaneously claim success.
    expect(runIsRed && claimsSuccess).toBe(false);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { checkCommand } from '../../src/commands/check.js';
import { stateFilePath } from '../../src/state.js';

// ────────────────────────────────────────────────────────────────────────────
// assay VERIFY probe — candidate defect:
//   "a bogus numeric-prefix phase argument silently clears a gate; the suite
//    is structurally blind to that consequence."
//
// The existing suite (tests/unit/gate-and-phase.test.ts) PINS the *unit* return
// value findPhaseIndex('1abc') === 1 as current behaviour. What no test asserts
// is the *downstream consequence* at the command layer: that a typo'd phase
// reference does NOT silently write a passed gate entry — and, sharper, that the
// trailing NAME suffix of the argument is not silently ignored while the numeric
// prefix steers the write into a DIFFERENT phase than the one named.
//
// These probes were written to redden on the pre-fix code (fail-first proof,
// probe-construction §8). Disposition (resolved — audit batch 2, finding M5):
// the owner ruled FIX. findPhaseIndex now only accepts pure digit strings as
// indexes, so a numeric-prefix typo is rejected at the command layer (exit 1,
// no state write). This suite is the sanctioned regression test for that
// downstream consequence.
// ────────────────────────────────────────────────────────────────────────────

let tmpDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;
let originalHome: string | undefined;

function writeChecklist(content: string): void {
  fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
}

function readState(): Record<string, unknown> {
  // State lives under the (sandboxed) XDG state home now, keyed by (skill,target).
  // checkCommand here runs with { dir: tmpDir } (no --path), so target == tmpDir.
  const p = stateFilePath(tmpDir, tmpDir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const ONE_PHASE_YML = `
phases:
  - name: charter
    checks:
      - id: motivation-identified
        description: motivation identified
`;

// Two phases where BOTH carry an id "shared-id". This lets us tell apart "acted
// on the phase the agent NAMED" from "acted on the phase the numeric prefix
// resolved to".
const TWO_PHASE_SHARED_YML = `
phases:
  - name: charter
    checks:
      - id: shared-id
        description: present in both phases
      - id: motivation-identified
        description: motivation identified
  - name: survey
    checks:
      - id: shared-id
        description: present in both phases
      - id: surface-mapped
        description: surface mapped
`;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay-probe-'));
  originalHome = process.env.CHECKLIST_HOME;
  process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (originalHome !== undefined) process.env.CHECKLIST_HOME = originalHome;
  else delete process.env.CHECKLIST_HOME;
  vi.restoreAllMocks();
});

describe('check — bogus numeric-prefix phase arg must not silently clear a gate', () => {
  // PROBE 1 — negative-space oracle:
  //   `check <numeric-prefix-garbage> <id>` must exit 1 AND leave state with no
  //   new passed entry. (Pre-fix the gate WAS cleared, exit 0.)
  it('a typo phase ref "0typo" exits non-zero and writes no passed entry', () => {
    writeChecklist(ONE_PHASE_YML);

    checkCommand('0typo', 'motivation-identified', { dir: tmpDir });

    // Negative-space: nothing moved on a rejected/garbage reference. State is
    // keyed by phase NAME now, so charter's key is 'charter' (not '0').
    expect(exitSpy).toHaveBeenCalledWith(1);
    const state = readState() as { checked?: Record<string, unknown> };
    expect(state.checked?.['charter']).toBeUndefined();
  });

  // PROBE 2 — the oracle-HONEST finding (consistency oracle, not a fabricated
  //   "must reject"). The argument's name suffix says "survey"; the numeric
  //   prefix steers the write into "charter" (phase 0). The exact reference
  //   `check survey shared-id` is gate-blocked (exit 1, no write) because
  //   charter is incomplete. The fat-fingered `0survey` must not produce a
  //   *different, passing* outcome that clears a check in a phase the agent did
  //   not name. (Pre-fix, '0survey' cleared charter[shared-id].)
  it('"0survey" must not silently clear a check in charter when the name says survey', () => {
    writeChecklist(TWO_PHASE_SHARED_YML);

    // Baseline: the EXACT name the agent typed is correctly refused (charter
    // gate not yet cleared), so nothing is written under that reference.
    // The typo'd form must not be MORE permissive than the exact form.
    checkCommand('0survey', 'shared-id', { dir: tmpDir });

    // Metamorphic/consistency oracle: a reference whose name part is "survey"
    // must never clear a gate in phase 0 (charter). Either it resolves to
    // survey (then gate-blocked → exit 1, no write) or it is rejected — but it
    // must NOT silently pass under charter.
    // State is keyed by phase NAME now; charter's key is 'charter' (not '0').
    const state = readState() as { checked?: Record<string, Record<string, unknown>> };
    expect(state.checked?.['charter']?.['shared-id']).toBeUndefined();
  });
});

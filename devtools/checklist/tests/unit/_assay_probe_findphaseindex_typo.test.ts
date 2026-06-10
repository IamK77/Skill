import { describe, it, expect } from 'vitest';
import { findPhaseIndex } from '../../src/resolver.js';
import type { ChecklistConfig } from '../../src/types.js';

// ---------------------------------------------------------------------------
// ASSAY PROBE — fail-first proof for the candidate defect:
//
//   findPhaseIndex uses parseInt(nameOrIndex, 10), which is LENIENT: it parses
//   the leading numeric run of a string and discards the rest. So a typo'd
//   phase argument that begins with an in-range digit run ("0typo", "1abc",
//   "0x1", "1.9", ...) resolves to that integer index instead of being
//   rejected as "Phase not found". Reached by `checklist check <phase> <id>`
//   (src/commands/check.ts:12), this lets a typo SILENTLY clear the wrong
//   stage's gate (exit 0, state marked pass) — defeating the SKILL contract
//   that the CLI is "the sole authority that a gate has cleared" and that
//   stages are addressed BY NAME.
//
// ORACLE (probe-construction.md §1, spec/hand-derived rung): a string that is
// NEITHER a clean integer index NOR an exact (case-insensitive) phase name is
// a typo and must fall through to the name search and throw "Phase not found".
// The CONTROL below ("chartr", no leading digit) already did exactly that on
// the pre-fix code — it is the trusted reference behavior these inputs deviate
// from.
//
// Disposition (resolved — audit batch 2, finding M5): the owner ruled FIX.
// findPhaseIndex now treats an argument as an index only when it is a pure
// digit string (/^\d+$/); everything else goes to the name lookup, where a
// miss throws. This suite is the sanctioned regression test for that contract.
// ---------------------------------------------------------------------------

const config: ChecklistConfig = {
  phases: [
    { name: 'charter', checks: [{ id: 'c1', description: 'charter item' }] },
    { name: 'survey', checks: [{ id: 's1', description: 'survey item' }] },
    { name: 'triage', checks: [{ id: 't1', description: 'triage item' }] },
  ],
};

describe('findPhaseIndex rejects leading-numeric-prefix typos', () => {
  // CONTROL — the trusted reference. A typo with NO leading digit already
  // threw on the pre-fix code. This anchors the oracle: it is the behavior
  // every typo below now shares.
  it('CONTROL: a non-numeric typo ("chartr") throws Phase not found (passes today)', () => {
    expect(() => findPhaseIndex(config, 'chartr')).toThrow('Phase not found');
  });

  // Each row is a typo that names NO real stage. parseInt(.,10) used to
  // extract an in-range index and accept it. The correct behavior is the same
  // as the CONTROL: throw "Phase not found".
  const typos: Array<[string, string]> = [
    ['0typo', 'parseInt("0typo",10) === 0'],
    ['1abc', 'parseInt("1abc",10) === 1'],
    ['0x1', 'parseInt("0x1",10) === 0 (NOT hex 1)'],
    ['1.9', 'parseInt("1.9",10) === 1 (decimal truncated)'],
    ['1e1', 'parseInt("1e1",10) === 1 (NOT 10)'],
    ['+1', 'parseInt("+1",10) === 1'],
    ['1,2', 'parseInt("1,2",10) === 1'],
    ['2 ', 'parseInt("2 ",10) === 2 (trailing space)'],
  ];

  it.each(typos)(
    'typo %j (%s) names no stage and must throw Phase not found',
    (input) => {
      expect(() => findPhaseIndex(config, input)).toThrow('Phase not found');
    },
  );
});

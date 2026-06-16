// Boundary / blind-spot hardening for src/state.ts.
//
// Distinct from tests/unit/state.test.ts (which covers the happy paths and a
// couple of error paths). Here we pin:
//   - the EXACT equivalence classes of malformed loadState input (null / number
//     / string / boolean / {} / arrays) and the LENIENT blind spots the guard
//     lets through (checked:null, checked:[]),
//   - empty-file -> corrupt (JSON.parse throws on ''),
//   - existence-based isPhaseComplete (fail/error still count as complete),
//   - state-progression CALL-IT-TWICE cases (set->set overwrite; the first
//     value is gone), write-then-clear-then-resolve, clear-twice idempotency,
//   - saveState pretty-prints with 2-space indent and overwrites on re-save.
//
// globals: true is configured, so describe/it/expect/vi are not imported.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  loadState,
  saveState,
  mergeAndSaveState,
  clearState,
  getItemResult,
  setItemResult,
  isItemChecked,
  isPhaseComplete,
  phaseProgress,
  type ChecklistState,
} from '../../src/state.js';
import type { CheckResult } from '../../src/types.js';

// state.ts now takes a state FILE path, not a dir; `sf` is that file inside the
// throwaway dir. (The basename is arbitrary now — it is not the in-skill-dir
// `.checklist.state.json`, which the new model never reads or writes.)
let tmpDir: string;
let sf: string;

function write(raw: string): void {
  fs.writeFileSync(sf, raw, 'utf-8');
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-state-sem-'));
  sf = path.join(tmpDir, 'state.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadState malformed equivalence classes', () => {
  // valid JSON that is not an object -> /malformed/. Each is a distinct
  // equivalence class hitting a different clause of the guard.
  it('rejects JSON null (the !parsed clause) as malformed', () => {
    write('null');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('rejects a JSON number as malformed', () => {
    write('42');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('rejects a JSON string as malformed', () => {
    write('"hello"');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('rejects a JSON boolean as malformed', () => {
    write('true');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('rejects an object missing the "checked" key as malformed', () => {
    // typeof undefined !== 'object' -> the third clause fires.
    write('{}');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('rejects an object whose "checked" is a number as malformed', () => {
    write('{"checked":42}');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });

  it('includes the resolved file path in the malformed error', () => {
    write('[1,2,3]');
    const expectedPath = sf;
    expect(() => loadState(sf)).toThrow(expectedPath);
  });
});

describe('loadState corrupt vs malformed boundary', () => {
  it('treats an empty file as corrupt (JSON.parse throws on "")', () => {
    // Boundary: '' is NOT valid JSON, so it routes to /corrupt/, not /malformed/.
    write('');
    expect(() => loadState(sf)).toThrow(/corrupt/);
  });

  it('treats whitespace-only content as corrupt', () => {
    write('   \n  ');
    expect(() => loadState(sf)).toThrow(/corrupt/);
  });

  it('includes the resolved file path in the corrupt error', () => {
    write('{ not json');
    const expectedPath = sf;
    expect(() => loadState(sf)).toThrow(expectedPath);
  });
});

describe('loadState rejects non-object `checked` (null / array)', () => {
  // typeof null === 'object' and typeof [] === 'object', so a corrupt or
  // partially-written state file shaped like {"checked":null} or {"checked":[]}
  // used to slip past the existence/typeof guard and then crash gate evaluation
  // downstream with an unhandled TypeError. loadState now rejects both at the
  // parse boundary with the documented malformed-state error.
  it('rejects checked:null with the malformed error (not a downstream crash)', () => {
    write('{"checked":null}');
    expect(() => loadState(sf)).toThrow('state file is malformed');
  });

  it('rejects checked as an array with the malformed error', () => {
    write('{"checked":[]}');
    expect(() => loadState(sf)).toThrow('state file is malformed');
  });

  it('ignores extra unknown keys alongside a valid checked object', () => {
    write('{"checked":{"0":{"a":{"status":"pass","message":""}}},"extra":1}');
    const state = loadState(sf) as ChecklistState & { extra?: number };
    expect(state.checked['0']['a']).toEqual({ status: 'pass', message: '' });
    expect(state.extra).toBe(1);
  });
});

describe('saveState formatting and overwrite', () => {
  it('pretty-prints with 2-space indentation', () => {
    const state: ChecklistState = {
      checked: { '0': { a: { status: 'pass', message: 'ok' } } },
    };
    saveState(sf, state);
    const raw = fs.readFileSync(sf, 'utf-8');
    // JSON.stringify(_, null, 2) -> nested keys indented by 2/4/... spaces.
    expect(raw).toContain('\n  "checked"');
    expect(raw).toContain('\n    "0"');
    expect(raw).toBe(JSON.stringify(state, null, 2));
  });

  it('overwrites a previous file rather than appending (save twice)', () => {
    const first: ChecklistState = {
      checked: { '0': { a: { status: 'fail', message: 'old' } } },
    };
    const second: ChecklistState = {
      checked: { '1': { b: { status: 'pass', message: 'new' } } },
    };
    saveState(sf, first);
    saveState(sf, second);
    const loaded = loadState(sf);
    expect(loaded).toEqual(second);
    // The old phase '0' must be entirely gone, not merged.
    expect(loaded.checked['0']).toBeUndefined();
  });

  it('round-trips an empty state', () => {
    const empty: ChecklistState = { checked: {} };
    saveState(sf, empty);
    expect(loadState(sf)).toEqual(empty);
  });
});

describe('isPhaseComplete is pass-based, not existence-based', () => {
  // The gate semantic: an item counts as complete only when its recorded result
  // is a PASS. isItemChecked keys on status === 'pass', so a stored fail/error
  // (or a once-green check re-recorded after it regressed) does NOT satisfy the
  // gate — completeness means current pass-status, not existence of a row.
  it('does NOT count a single fail-status item as complete', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'fail', message: 'broke' });
    expect(isPhaseComplete(state, 0, ['a'])).toBe(false);
  });

  it('does NOT count a single error-status item as complete', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'error', message: 'threw' });
    expect(isPhaseComplete(state, 0, ['a'])).toBe(false);
  });

  it('is complete only when every id is recorded as a pass', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'error', message: '' });
    setItemResult(state, 0, 'b', { status: 'fail', message: '' });
    expect(isPhaseComplete(state, 0, ['a', 'b'])).toBe(false);
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    setItemResult(state, 0, 'b', { status: 'pass', message: '' });
    expect(isPhaseComplete(state, 0, ['a', 'b'])).toBe(true);
    expect(isPhaseComplete(state, 0, ['a', 'b', 'c'])).toBe(false);
  });

  it('treats an empty-message pass-status item as checked', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    expect(isItemChecked(state, 0, 'a')).toBe(true);
  });
});

describe('setItemResult state-progression (call it twice)', () => {
  it('overwrites on the second call, discarding the first result', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'fail', message: 'first' });
    setItemResult(state, 0, 'a', { status: 'pass', message: 'second' });
    expect(getItemResult(state, 0, 'a')).toEqual({ status: 'pass', message: 'second' });
    // Only one entry under the id; the first value is fully gone.
    expect(Object.keys(state.checked['0'])).toEqual(['a']);
  });

  it('keeps a sibling item when the same item is re-set twice', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: 'a1' });
    setItemResult(state, 0, 'b', { status: 'pass', message: 'b1' });
    setItemResult(state, 0, 'a', { status: 'fail', message: 'a2' });
    expect(getItemResult(state, 0, 'a')).toEqual({ status: 'fail', message: 'a2' });
    expect(getItemResult(state, 0, 'b')).toEqual({ status: 'pass', message: 'b1' });
  });

  it('coerces the phase index to a string key', () => {
    // Numeric 2 must land at key '2', so getItemResult(state, 2, ...) sees it.
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 2, 'a', { status: 'pass', message: '' });
    expect(Object.keys(state.checked)).toContain('2');
    expect(getItemResult(state, 2, 'a')).toBeDefined();
  });

  it('does not mutate the passed result object identity into a shared reference', () => {
    // Pin that the stored value is the same object handed in (no defensive copy),
    // so callers mutating their object afterwards would see it reflected.
    const state: ChecklistState = { checked: {} };
    const r: CheckResult = { status: 'pass', message: 'x' };
    setItemResult(state, 0, 'a', r);
    expect(getItemResult(state, 0, 'a')).toBe(r);
  });
});

describe('clearState idempotency and write-then-clear-then-resolve', () => {
  const filePath = () => sf;

  it('is idempotent: clearing twice on a missing file does not throw', () => {
    expect(() => {
      clearState(sf);
      clearState(sf);
    }).not.toThrow();
    expect(fs.existsSync(filePath())).toBe(false);
  });

  it('is idempotent: save, clear, clear again -> still gone, no throw', () => {
    saveState(sf, { checked: { '0': { a: { status: 'pass', message: '' } } } });
    expect(fs.existsSync(filePath())).toBe(true);
    clearState(sf);
    expect(fs.existsSync(filePath())).toBe(false);
    expect(() => clearState(sf)).not.toThrow();
    expect(fs.existsSync(filePath())).toBe(false);
  });

  it('write-then-clear-then-resolve returns a fresh empty state', () => {
    saveState(sf, { checked: { '0': { a: { status: 'pass', message: 'recorded' } } } });
    clearState(sf);
    // After clearing, the file is gone, so loadState falls back to empty state.
    expect(loadState(sf)).toEqual({ checked: {} });
  });
});

describe('phaseProgress counting boundaries', () => {
  it('counts duplicate ids in the requested list each time', () => {
    // itemIds is filtered as-is; a repeated checked id is counted twice (and
    // inflates total too). Pin this current arithmetic.
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    const result = phaseProgress(state, 0, ['a', 'a', 'b']);
    expect(result).toEqual({ done: 2, total: 3 });
  });

  it('reports zero done when the phase has no records', () => {
    const state: ChecklistState = { checked: {} };
    expect(phaseProgress(state, 0, ['a', 'b', 'c'])).toEqual({ done: 0, total: 3 });
  });

  it('counts only pass-status records as done (fail/error are not done)', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    setItemResult(state, 0, 'b', { status: 'fail', message: '' });
    setItemResult(state, 0, 'c', { status: 'error', message: '' });
    expect(phaseProgress(state, 0, ['a', 'b', 'c'])).toEqual({ done: 1, total: 3 });
  });

  it('ignores records that belong to a different phase', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    // Querying phase 1 must not see phase 0's record.
    expect(phaseProgress(state, 1, ['a'])).toEqual({ done: 0, total: 1 });
  });
});

describe('saveState atomicity — observable surface (white-box pins live in state-atomic-write.test.ts)', () => {
  it('leaves no temp litter after a successful save', () => {
    saveState(sf, { checked: {} });
    saveState(sf, { checked: { '1': { b: { status: 'fail', message: 'x' } } } });
    expect(fs.readdirSync(tmpDir)).toEqual([path.basename(sf)]);
  });
});

describe('mergeAndSaveState — concurrent load-modify-save interleave (lost-update regression)', () => {
  // Simulates two checklist invocations racing the same state file. The
  // interleave is sequential (single process) but exercises the same
  // load → record → save windows real concurrent runs hit.

  it('a save does not drop a record another invocation wrote since our load', () => {
    // A and B both start from the empty state…
    const aUpdates: ChecklistState = { checked: {} };
    const bUpdates: ChecklistState = { checked: {} };
    setItemResult(aUpdates, 0, 'from-a', { status: 'pass', message: 'a' });
    setItemResult(bUpdates, 1, 'from-b', { status: 'pass', message: 'b' });

    mergeAndSaveState(sf, aUpdates); // …A lands first…
    mergeAndSaveState(sf, bUpdates); // …then B, which never saw A's record

    const final = loadState(sf);
    expect(isItemChecked(final, 0, 'from-a')).toBe(true); // pre-fix: lost
    expect(isItemChecked(final, 1, 'from-b')).toBe(true);
  });

  it('merges records within the SAME phase key, not just across phases', () => {
    const aUpdates: ChecklistState = { checked: {} };
    const bUpdates: ChecklistState = { checked: {} };
    setItemResult(aUpdates, 0, 'x', { status: 'pass', message: 'a' });
    setItemResult(bUpdates, 0, 'y', { status: 'fail', message: 'b' });

    mergeAndSaveState(sf, aUpdates);
    mergeAndSaveState(sf, bUpdates);

    const final = loadState(sf);
    expect(getItemResult(final, 0, 'x')).toEqual({ status: 'pass', message: 'a' });
    expect(getItemResult(final, 0, 'y')).toEqual({ status: 'fail', message: 'b' });
  });

  it('our fresh result for an item we re-ran wins over the on-disk record', () => {
    // Disk holds an older pass; this run re-verified the item and it FAILED.
    saveState(sf, { checked: { '0': { x: { status: 'pass', message: 'stale' } } } });
    const updates: ChecklistState = { checked: {} };
    setItemResult(updates, 0, 'x', { status: 'fail', message: 'regressed' });

    mergeAndSaveState(sf, updates);

    expect(getItemResult(loadState(sf), 0, 'x')).toEqual({
      status: 'fail',
      message: 'regressed',
    });
  });

  it('does NOT resurrect a stale pass for an item this run never touched', () => {
    // The audit scenario: another invocation records a FAIL for x after we
    // loaded (when x was still a pass). Our save of an unrelated item must keep
    // their fail — re-writing our stale snapshot would re-green a failing gate.
    saveState(sf, { checked: { '0': { x: { status: 'pass', message: 'old' } } } });
    loadState(sf); // our invocation loads while x is still green
    saveState(sf, { checked: { '0': { x: { status: 'fail', message: 'regressed' } } } });

    const updates: ChecklistState = { checked: {} }; // delta: only OUR new item
    setItemResult(updates, 0, 'y', { status: 'pass', message: 'confirmed' });
    mergeAndSaveState(sf, updates);

    const final = loadState(sf);
    expect(getItemResult(final, 0, 'x')!.status).toBe('fail'); // not resurrected
    expect(isItemChecked(final, 0, 'y')).toBe(true);
  });

  it('degrades to a plain replace when the on-disk file went corrupt since our load', () => {
    fs.writeFileSync(sf, '{ torn write', 'utf-8');
    const updates: ChecklistState = { checked: {} };
    setItemResult(updates, 0, 'a', { status: 'pass', message: 'ok' });

    const merged = mergeAndSaveState(sf, updates);

    expect(merged).toEqual(updates);
    expect(loadState(sf)).toEqual(updates); // file is valid again
  });

  it('returns the merged state it wrote (disk records + our delta)', () => {
    saveState(sf, { checked: { '0': { a: { status: 'pass', message: 'kept' } } } });
    const updates: ChecklistState = { checked: {} };
    setItemResult(updates, 1, 'b', { status: 'pass', message: 'new' });

    const merged = mergeAndSaveState(sf, updates);

    expect(merged).toEqual(loadState(sf));
    expect(getItemResult(merged, 0, 'a')).toEqual({ status: 'pass', message: 'kept' });
    expect(getItemResult(merged, 1, 'b')).toEqual({ status: 'pass', message: 'new' });
  });
});

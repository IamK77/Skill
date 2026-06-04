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
  clearState,
  getItemResult,
  setItemResult,
  isItemChecked,
  isPhaseComplete,
  phaseProgress,
  type ChecklistState,
} from '../../src/state.js';
import type { CheckResult } from '../../src/types.js';

const STATE_FILE = '.checklist.state.json';

let tmpDir: string;

function write(raw: string): void {
  fs.writeFileSync(path.join(tmpDir, STATE_FILE), raw, 'utf-8');
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-state-sem-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadState malformed equivalence classes', () => {
  // valid JSON that is not an object -> /malformed/. Each is a distinct
  // equivalence class hitting a different clause of the guard.
  it('rejects JSON null (the !parsed clause) as malformed', () => {
    write('null');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('rejects a JSON number as malformed', () => {
    write('42');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('rejects a JSON string as malformed', () => {
    write('"hello"');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('rejects a JSON boolean as malformed', () => {
    write('true');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('rejects an object missing the "checked" key as malformed', () => {
    // typeof undefined !== 'object' -> the third clause fires.
    write('{}');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('rejects an object whose "checked" is a number as malformed', () => {
    write('{"checked":42}');
    expect(() => loadState(tmpDir)).toThrow(/malformed/);
  });

  it('includes the resolved file path in the malformed error', () => {
    write('[1,2,3]');
    const expectedPath = path.resolve(tmpDir, STATE_FILE);
    expect(() => loadState(tmpDir)).toThrow(expectedPath);
  });
});

describe('loadState corrupt vs malformed boundary', () => {
  it('treats an empty file as corrupt (JSON.parse throws on "")', () => {
    // Boundary: '' is NOT valid JSON, so it routes to /corrupt/, not /malformed/.
    write('');
    expect(() => loadState(tmpDir)).toThrow(/corrupt/);
  });

  it('treats whitespace-only content as corrupt', () => {
    write('   \n  ');
    expect(() => loadState(tmpDir)).toThrow(/corrupt/);
  });

  it('includes the resolved file path in the corrupt error', () => {
    write('{ not json');
    const expectedPath = path.resolve(tmpDir, STATE_FILE);
    expect(() => loadState(tmpDir)).toThrow(expectedPath);
  });
});

describe('loadState lenient blind spots (typeof null/array === object)', () => {
  // These are the cases the existence/typeof guard lets through. Pinning CURRENT
  // behavior: the guard checks typeof checked === 'object', and both null and
  // arrays satisfy that, so loadState does NOT throw and returns them as-is.
  it('accepts checked:null without throwing (typeof null === object)', () => {
    write('{"checked":null}');
    const state = loadState(tmpDir);
    expect(state).toEqual({ checked: null });
  });

  it('accepts checked as an array without throwing (typeof [] === object)', () => {
    write('{"checked":[]}');
    const state = loadState(tmpDir);
    expect(state).toEqual({ checked: [] });
  });

  it('ignores extra unknown keys alongside a valid checked object', () => {
    write('{"checked":{"0":{"a":{"status":"pass","message":""}}},"extra":1}');
    const state = loadState(tmpDir) as ChecklistState & { extra?: number };
    expect(state.checked['0']['a']).toEqual({ status: 'pass', message: '' });
    expect(state.extra).toBe(1);
  });
});

describe('saveState formatting and overwrite', () => {
  it('pretty-prints with 2-space indentation', () => {
    const state: ChecklistState = {
      checked: { '0': { a: { status: 'pass', message: 'ok' } } },
    };
    saveState(tmpDir, state);
    const raw = fs.readFileSync(path.join(tmpDir, STATE_FILE), 'utf-8');
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
    saveState(tmpDir, first);
    saveState(tmpDir, second);
    const loaded = loadState(tmpDir);
    expect(loaded).toEqual(second);
    // The old phase '0' must be entirely gone, not merged.
    expect(loaded.checked['0']).toBeUndefined();
  });

  it('round-trips an empty state', () => {
    const empty: ChecklistState = { checked: {} };
    saveState(tmpDir, empty);
    expect(loadState(tmpDir)).toEqual(empty);
  });
});

describe('isPhaseComplete is existence-based, not pass-based', () => {
  // The real semantic: an item recorded with ANY status (including fail/error)
  // counts as complete. isItemChecked coerces the result OBJECT with !!, which
  // is always truthy regardless of status.
  it('counts a single fail-status item as complete', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'fail', message: 'broke' });
    expect(isPhaseComplete(state, 0, ['a'])).toBe(true);
  });

  it('counts a single error-status item as complete', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'error', message: 'threw' });
    expect(isPhaseComplete(state, 0, ['a'])).toBe(true);
  });

  it('is incomplete only when an id has no recorded result at all', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'error', message: '' });
    setItemResult(state, 0, 'b', { status: 'fail', message: '' });
    expect(isPhaseComplete(state, 0, ['a', 'b'])).toBe(true);
    expect(isPhaseComplete(state, 0, ['a', 'b', 'c'])).toBe(false);
  });

  it('still treats an empty-message pass-status item as checked (truthy object)', () => {
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
  const filePath = () => path.join(tmpDir, STATE_FILE);

  it('is idempotent: clearing twice on a missing file does not throw', () => {
    expect(() => {
      clearState(tmpDir);
      clearState(tmpDir);
    }).not.toThrow();
    expect(fs.existsSync(filePath())).toBe(false);
  });

  it('is idempotent: save, clear, clear again -> still gone, no throw', () => {
    saveState(tmpDir, { checked: { '0': { a: { status: 'pass', message: '' } } } });
    expect(fs.existsSync(filePath())).toBe(true);
    clearState(tmpDir);
    expect(fs.existsSync(filePath())).toBe(false);
    expect(() => clearState(tmpDir)).not.toThrow();
    expect(fs.existsSync(filePath())).toBe(false);
  });

  it('write-then-clear-then-resolve returns a fresh empty state', () => {
    saveState(tmpDir, { checked: { '0': { a: { status: 'pass', message: 'recorded' } } } });
    clearState(tmpDir);
    // After clearing, the file is gone, so loadState falls back to empty state.
    expect(loadState(tmpDir)).toEqual({ checked: {} });
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

  it('reports all done when every requested id is recorded (any status)', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    setItemResult(state, 0, 'b', { status: 'fail', message: '' });
    setItemResult(state, 0, 'c', { status: 'error', message: '' });
    expect(phaseProgress(state, 0, ['a', 'b', 'c'])).toEqual({ done: 3, total: 3 });
  });

  it('ignores records that belong to a different phase', () => {
    const state: ChecklistState = { checked: {} };
    setItemResult(state, 0, 'a', { status: 'pass', message: '' });
    // Querying phase 1 must not see phase 0's record.
    expect(phaseProgress(state, 1, ['a'])).toEqual({ done: 0, total: 1 });
  });
});

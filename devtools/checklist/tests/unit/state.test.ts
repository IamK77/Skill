import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  loadState,
  saveState,
  clearState,
  isItemChecked,
  getItemResult,
  setItemResult,
  isPhaseComplete,
  phaseProgress,
  type ChecklistState,
} from '../../src/state.js';
import type { CheckResult } from '../../src/types.js';

let tmpDir: string;
// state.ts now takes a state FILE path, not a dir; each test points at a file
// inside its throwaway dir.
let sf: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-state-test-'));
  sf = path.join(tmpDir, 'state.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadState', () => {
  it('returns empty state when no file exists', () => {
    const state = loadState(sf);
    expect(state).toEqual({ checked: {} });
  });

  it('loads existing state from file', () => {
    const existing: ChecklistState = {
      checked: {
        '0': {
          'item-1': { status: 'pass', message: 'ok' },
        },
      },
    };
    fs.writeFileSync(sf, JSON.stringify(existing), 'utf-8');

    const state = loadState(sf);
    expect(state).toEqual(existing);
  });

  it('throws a clear error when the state file is corrupt JSON', () => {
    fs.writeFileSync(sf, '{ not valid json', 'utf-8');
    expect(() => loadState(sf)).toThrow(/corrupt/);
  });

  it('throws a clear error when the state file is valid JSON but malformed', () => {
    fs.writeFileSync(sf, '[1,2,3]', 'utf-8');
    expect(() => loadState(sf)).toThrow(/malformed/);
  });
});

describe('saveState', () => {
  it('writes state to file', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'item-a': { status: 'pass', message: 'done' },
        },
      },
    };

    saveState(sf, state);

    expect(fs.existsSync(sf)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(sf, 'utf-8'));
    expect(raw).toEqual(state);
  });

  it('can be loaded back', () => {
    const state: ChecklistState = {
      checked: {
        '1': {
          'check-x': { status: 'fail', message: 'missing' },
          'check-y': { status: 'pass', message: 'ok' },
        },
      },
    };

    saveState(sf, state);
    const loaded = loadState(sf);
    expect(loaded).toEqual(state);
  });
});

describe('clearState', () => {
  it('removes state file', () => {
    fs.writeFileSync(sf, '{}', 'utf-8');
    expect(fs.existsSync(sf)).toBe(true);

    clearState(sf);
    expect(fs.existsSync(sf)).toBe(false);
  });

  it('no-op when file does not exist', () => {
    expect(() => clearState(sf)).not.toThrow();
  });
});

describe('isItemChecked', () => {
  it('returns false for unchecked item', () => {
    const state: ChecklistState = { checked: {} };
    expect(isItemChecked(state, 0, 'item-1')).toBe(false);
  });

  it('returns true for checked item', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'item-1': { status: 'pass', message: 'ok' },
        },
      },
    };
    expect(isItemChecked(state, 0, 'item-1')).toBe(true);
  });

  it('returns false for wrong phase', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'item-1': { status: 'pass', message: 'ok' },
        },
      },
    };
    expect(isItemChecked(state, 1, 'item-1')).toBe(false);
  });
});

describe('getItemResult', () => {
  it('returns undefined when not set', () => {
    const state: ChecklistState = { checked: {} };
    expect(getItemResult(state, 0, 'item-1')).toBeUndefined();
  });

  it('returns the result when set', () => {
    const result: CheckResult = { status: 'error', message: 'something broke' };
    const state: ChecklistState = {
      checked: {
        '2': {
          'item-z': result,
        },
      },
    };
    expect(getItemResult(state, 2, 'item-z')).toEqual(result);
  });
});

describe('setItemResult', () => {
  it('sets result in empty state', () => {
    const state: ChecklistState = { checked: {} };
    const result: CheckResult = { status: 'pass', message: 'good' };

    setItemResult(state, 0, 'item-1', result);

    expect(state.checked['0']['item-1']).toEqual(result);
  });

  it('creates phase key if missing', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'item-a': { status: 'pass', message: 'ok' },
        },
      },
    };
    const result: CheckResult = { status: 'fail', message: 'nope' };

    setItemResult(state, 3, 'item-b', result);

    expect(state.checked['3']).toBeDefined();
    expect(state.checked['3']['item-b']).toEqual(result);
    expect(state.checked['0']['item-a']).toEqual({ status: 'pass', message: 'ok' });
  });

  it('overwrites existing result', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'item-1': { status: 'fail', message: 'bad' },
        },
      },
    };
    const updated: CheckResult = { status: 'pass', message: 'fixed' };

    setItemResult(state, 0, 'item-1', updated);

    expect(state.checked['0']['item-1']).toEqual(updated);
  });
});

describe('isPhaseComplete', () => {
  it('returns true when all items are recorded as a pass', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'a': { status: 'pass', message: '' },
          'b': { status: 'pass', message: '' },
          'c': { status: 'pass', message: '' },
        },
      },
    };
    expect(isPhaseComplete(state, 0, ['a', 'b', 'c'])).toBe(true);
  });

  it('returns false when an item is recorded fail/error (not a pass)', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'a': { status: 'pass', message: '' },
          'b': { status: 'fail', message: '' },
          'c': { status: 'error', message: '' },
        },
      },
    };
    expect(isPhaseComplete(state, 0, ['a', 'b', 'c'])).toBe(false);
  });

  it('returns false when some items missing', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'a': { status: 'pass', message: '' },
        },
      },
    };
    expect(isPhaseComplete(state, 0, ['a', 'b'])).toBe(false);
  });

  it('returns true for empty itemIds', () => {
    const state: ChecklistState = { checked: {} };
    expect(isPhaseComplete(state, 0, [])).toBe(true);
  });
});

describe('phaseProgress', () => {
  it('counts correctly', () => {
    const state: ChecklistState = {
      checked: {
        '1': {
          'x': { status: 'pass', message: '' },
          'z': { status: 'fail', message: '' },
        },
      },
    };
    const result = phaseProgress(state, 1, ['x', 'y', 'z']);
    // pass-based: x passes (1), y absent (0), z fail (0) -> 1 done of 3
    expect(result).toEqual({ done: 1, total: 3 });
  });

  it('handles empty list', () => {
    const state: ChecklistState = { checked: {} };
    const result = phaseProgress(state, 0, []);
    expect(result).toEqual({ done: 0, total: 0 });
  });
});

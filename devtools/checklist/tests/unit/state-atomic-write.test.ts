// White-box pins for saveState's atomic write mechanics (temp file in the SAME
// dir + renameSync over the target). These need to observe/override fs calls
// made by the SUT, so node:fs is partially mocked with call-through wrappers —
// kept in this dedicated file so no other suite runs against a mocked fs.
//
// Why same-dir matters: renameSync is atomic only within a single filesystem.
// A temp file in os.tmpdir() could land on a different device, turning the
// "atomic" replace into a copy window a concurrent reader can tear.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { loadState, saveState, type ChecklistState } from '../../src/state.js';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(actual.writeFileSync),
    renameSync: vi.fn(actual.renameSync),
    unlinkSync: vi.fn(actual.unlinkSync),
  };
});

const STATE_FILE = '.checklist.state.json';

const writeMock = vi.mocked(fs.writeFileSync);
const renameMock = vi.mocked(fs.renameSync);
const unlinkMock = vi.mocked(fs.unlinkSync);

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-atomic-'));
  writeMock.mockClear();
  renameMock.mockClear();
  unlinkMock.mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('saveState writes atomically (temp sibling + rename)', () => {
  it('never writes the target path directly: JSON goes to a same-dir temp file, then renameSync', () => {
    const target = path.join(tmpDir, STATE_FILE);
    const state: ChecklistState = {
      checked: { '0': { a: { status: 'pass', message: 'ok' } } },
    };

    saveState(tmpDir, state);

    // The content write targets a temp sibling, NOT the final path…
    const writtenPaths = writeMock.mock.calls.map(c => String(c[0]));
    expect(writtenPaths).not.toContain(target);
    const tempPath = writtenPaths.find(p => p.startsWith(`${target}.`));
    expect(tempPath).toBeDefined();
    // …in the SAME directory (cross-device rename would not be atomic)…
    expect(path.dirname(tempPath!)).toBe(tmpDir);
    // …and the temp file is renamed over the target.
    expect(renameMock).toHaveBeenCalledWith(tempPath, target);
    expect(loadState(tmpDir)).toEqual(state);
  });

  it('two saves use distinct temp names (concurrent writers cannot collide on the temp path)', () => {
    saveState(tmpDir, { checked: {} });
    saveState(tmpDir, { checked: {} });
    const tempPaths = writeMock.mock.calls.map(c => String(c[0]));
    expect(new Set(tempPaths).size).toBe(tempPaths.length);
  });

  it('a failed rename leaves the PREVIOUS state intact, cleans up its temp file, and rethrows', () => {
    const before: ChecklistState = {
      checked: { '0': { a: { status: 'pass', message: 'previous' } } },
    };
    saveState(tmpDir, before);
    renameMock.mockClear();

    renameMock.mockImplementationOnce(() => {
      throw new Error('simulated rename failure');
    });

    expect(() =>
      saveState(tmpDir, { checked: { '0': { a: { status: 'fail', message: 'new' } } } }),
    ).toThrow('simulated rename failure');

    // The crash window must not corrupt or truncate the existing state…
    expect(loadState(tmpDir)).toEqual(before);
    // …and the orphaned temp file is removed (no litter in the skill dir).
    expect(unlinkMock).toHaveBeenCalled();
    expect(fs.readdirSync(tmpDir)).toEqual([STATE_FILE]);
  });
});

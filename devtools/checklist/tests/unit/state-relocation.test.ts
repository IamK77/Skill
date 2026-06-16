// State-relocation suite for src/state.ts (the XDG-state-dir, (skill,target)-keyed,
// phase-NAME-keyed model). These pin the behaviours the relocation feature exists
// to deliver:
//   1. stateHomeDir() precedence (CHECKLIST_STATE_HOME > $XDG_STATE_HOME/checklist
//      > ~/.local/state/checklist),
//   2. stateFilePath/stateKey stability across equivalent (skill,target) spellings
//      and divergence on a different target,
//   3. (skill,target) isolation: same skill, two targets => two independent files,
//   4. phase-NAME keying survives a phase reorder (an old pass is not mis-attached
//      to whatever check now sits at the old index),
//   5. the skill dir stays clean after init+check (no in-skill-dir state file), and
//   6. a legacy in-skill-dir `.checklist.state.json` is detected but never read.
//
// globals: true is configured, so describe/it/expect/beforeEach/afterEach are not
// imported. tests/setup.ts sandboxes CHECKLIST_STATE_HOME for the whole run; the
// precedence test below saves/restores the relevant env vars locally.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  stateHomeDir,
  stateKey,
  stateFilePath,
  loadState,
  saveState,
  mergeAndSaveState,
  setItemResult,
  isPhaseComplete,
  findLegacyStateFile,
  legacyStateFilePath,
  type ChecklistState,
} from '../../src/state.js';
import { gatePriorPhases } from '../../src/resolver.js';
import { initCommand } from '../../src/commands/init.js';
import { checkCommand } from '../../src/commands/check.js';
import type { ChecklistConfig } from '../../src/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-reloc-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 1. stateHomeDir() precedence
// ---------------------------------------------------------------------------

describe('stateHomeDir() precedence', () => {
  // Save/restore the two env vars this function reads; tests/setup.ts sets
  // CHECKLIST_STATE_HOME for the run, so we must restore it afterwards.
  let savedStateHome: string | undefined;
  let savedXdg: string | undefined;

  beforeEach(() => {
    savedStateHome = process.env.CHECKLIST_STATE_HOME;
    savedXdg = process.env.XDG_STATE_HOME;
  });

  afterEach(() => {
    if (savedStateHome !== undefined) process.env.CHECKLIST_STATE_HOME = savedStateHome;
    else delete process.env.CHECKLIST_STATE_HOME;
    if (savedXdg !== undefined) process.env.XDG_STATE_HOME = savedXdg;
    else delete process.env.XDG_STATE_HOME;
  });

  it('CHECKLIST_STATE_HOME wins over XDG_STATE_HOME', () => {
    process.env.CHECKLIST_STATE_HOME = '/explicit/state/home';
    process.env.XDG_STATE_HOME = '/xdg/state';
    expect(stateHomeDir()).toBe('/explicit/state/home');
  });

  it('falls back to $XDG_STATE_HOME/checklist when CHECKLIST_STATE_HOME is unset', () => {
    delete process.env.CHECKLIST_STATE_HOME;
    process.env.XDG_STATE_HOME = '/xdg/state';
    expect(stateHomeDir()).toBe(path.join('/xdg/state', 'checklist'));
  });

  it('falls back to ~/.local/state/checklist when neither is set', () => {
    delete process.env.CHECKLIST_STATE_HOME;
    delete process.env.XDG_STATE_HOME;
    expect(stateHomeDir()).toBe(path.join(os.homedir(), '.local', 'state', 'checklist'));
  });
});

// ---------------------------------------------------------------------------
// 2. stateFilePath / stateKey stability and divergence
// ---------------------------------------------------------------------------

describe('stateFilePath / stateKey identity & divergence', () => {
  it('the same (skill,target) maps to an identical path', () => {
    const skill = path.join(tmpDir, 'skill');
    const target = path.join(tmpDir, 'target');
    expect(stateFilePath(skill, target)).toBe(stateFilePath(skill, target));
    expect(stateKey(skill, target)).toBe(stateKey(skill, target));
  });

  it('trailing-slash and relative-vs-absolute spellings of the same dirs collapse to one key', () => {
    const skill = path.join(tmpDir, 'skill');
    const target = path.join(tmpDir, 'target');
    fs.mkdirSync(skill, { recursive: true });
    fs.mkdirSync(target, { recursive: true });

    // Trailing slash should not change the resolved path.
    expect(stateKey(skill, target)).toBe(stateKey(`${skill}/`, `${target}/`));

    // A relative spelling resolved from the same cwd lands on the same absolute
    // path, hence the same key.
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    try {
      expect(stateKey('skill', 'target')).toBe(stateKey(skill, target));
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it('a different target yields a different key (and path)', () => {
    const skill = path.join(tmpDir, 'skill');
    const targetX = path.join(tmpDir, 'x');
    const targetY = path.join(tmpDir, 'y');
    expect(stateKey(skill, targetX)).not.toBe(stateKey(skill, targetY));
    expect(stateFilePath(skill, targetX)).not.toBe(stateFilePath(skill, targetY));
  });

  it('the key carries a readable skill-basename prefix and lands under stateHomeDir', () => {
    const skill = path.join(tmpDir, 'my-skill');
    const target = path.join(tmpDir, 'proj');
    const key = stateKey(skill, target);
    expect(key.startsWith('my-skill.')).toBe(true);
    expect(path.dirname(stateFilePath(skill, target))).toBe(stateHomeDir());
  });
});

// ---------------------------------------------------------------------------
// 3. (skill,target) isolation: same skill, two targets, two independent files
// ---------------------------------------------------------------------------

describe('(skill,target) isolation — two targets of one skill do not stomp', () => {
  it('saving state for (skillA, targetX) and (skillA, targetY) yields two independent files', () => {
    const skillA = path.join(tmpDir, 'skillA');
    const targetX = path.join(tmpDir, 'X');
    const targetY = path.join(tmpDir, 'Y');

    const fileX = stateFilePath(skillA, targetX);
    const fileY = stateFilePath(skillA, targetY);
    expect(fileX).not.toBe(fileY);

    const stateX: ChecklistState = { checked: { build: { x: { status: 'pass', message: 'x-only' } } } };
    const stateY: ChecklistState = { checked: { build: { y: { status: 'pass', message: 'y-only' } } } };
    saveState(fileX, stateX);
    saveState(fileY, stateY);

    // Neither file's content leaked into the other.
    expect(loadState(fileX)).toEqual(stateX);
    expect(loadState(fileY)).toEqual(stateY);
    expect(loadState(fileX).checked.build.y).toBeUndefined();
    expect(loadState(fileY).checked.build.x).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Phase-NAME keying survives a phase reorder
// ---------------------------------------------------------------------------

describe('phase-NAME keying survives a phase reorder', () => {
  it('a pass recorded under "build" stays attached to build after the phases are reordered', () => {
    // Original order: charter(0), build(1). Record build's only check as a pass.
    const original: ChecklistConfig = {
      phases: [
        { name: 'charter', checks: [{ id: 'c1', description: '' }] },
        { name: 'build', checks: [{ id: 'b1', description: '' }] },
      ],
    };
    const sf = path.join(tmpDir, 'state.json');
    const updates: ChecklistState = { checked: {} };
    setItemResult(updates, 'build', 'b1', { status: 'pass', message: 'ok' });
    mergeAndSaveState(sf, updates);

    const state = loadState(sf);

    // Reordered: build now sits at index 0 (where charter used to be), and a
    // DIFFERENT phase ("charter") now sits at index 1.
    const reordered: ChecklistConfig = {
      phases: [
        { name: 'build', checks: [{ id: 'b1', description: '' }] },
        { name: 'charter', checks: [{ id: 'c1', description: '' }] },
      ],
    };

    // The recorded build-pass still belongs to build BY NAME, not to whatever
    // check now sits at the old index (charter's c1, which was never recorded).
    expect(isPhaseComplete(state, 'build', ['b1'])).toBe(true);
    expect(isPhaseComplete(state, 'charter', ['c1'])).toBe(false);

    // Gate over the ORIGINAL config [charter(0), build(1)]: targeting build
    // (index 1) gates charter (index 0), which was never recorded -> BLOCKED.
    // This proves the build-pass did NOT leak onto charter at the old index 0.
    const origGate = gatePriorPhases(original, 1, state);
    expect(origGate.passed).toBe(false);
    expect(origGate.failedPhase).toBe('charter');

    // Gate over the REORDERED config [build(0), charter(1)]: targeting charter
    // (now index 1) gates build (now index 0). build is genuinely complete BY
    // NAME, so the gate passes — the pass followed the NAME to the new index,
    // it was not stuck to the old numeric slot.
    const reorderedGate = gatePriorPhases(reordered, 1, state);
    expect(reorderedGate.passed).toBe(true);

    // And targeting build's new index-0 position is vacuously clear (no priors).
    expect(gatePriorPhases(reordered, 0, state).passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Skill dir stays clean after init+check
// ---------------------------------------------------------------------------

describe('skill dir stays clean (no in-skill-dir state file)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let savedHome: string | undefined;

  beforeEach(() => {
    // Sandbox the global active pointer; tests/setup.ts already sandboxes the
    // state home for the whole run.
    savedHome = process.env.CHECKLIST_HOME;
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    if (savedHome !== undefined) process.env.CHECKLIST_HOME = savedHome;
    else delete process.env.CHECKLIST_HOME;
    vi.restoreAllMocks();
  });

  it('after init + check, the skill dir has NO .checklist.state.json and the state lives under the state home', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.checklist.yml'),
      `
phases:
  - name: charter
    checks:
      - id: motivation
        description: motivation identified
`,
      'utf-8',
    );

    initCommand(tmpDir, { force: true });
    checkCommand('charter', 'motivation', { dir: tmpDir, path: tmpDir });

    expect(exitSpy).not.toHaveBeenCalled();

    // The skill dir is clean: nothing was written into it.
    expect(fs.existsSync(path.join(tmpDir, '.checklist.state.json'))).toBe(false);

    // The result landed in the (skill,target) state file under the sandboxed home.
    const sf = stateFilePath(tmpDir, tmpDir);
    expect(path.dirname(sf)).toBe(stateHomeDir());
    expect(fs.existsSync(sf)).toBe(true);
    const state = loadState(sf);
    expect(state.checked.charter.motivation.status).toBe('pass');
  });
});

// ---------------------------------------------------------------------------
// 6. Legacy in-skill-dir state file is detected but never read
// ---------------------------------------------------------------------------

describe('legacy in-skill-dir state file is ignored', () => {
  it('findLegacyStateFile detects it, but loadState(stateFilePath(...)) does not read it', () => {
    // Plant a legacy in-skill-dir state file that, if it were read, would make
    // phase "old" look complete.
    const legacy = legacyStateFilePath(tmpDir);
    const legacyContent: ChecklistState = {
      checked: { old: { ghost: { status: 'pass', message: 'from-legacy' } } },
    };
    fs.writeFileSync(legacy, JSON.stringify(legacyContent), 'utf-8');

    // It is detected (so init can surface a migration hint)…
    expect(findLegacyStateFile(tmpDir)).toBe(legacy);

    // …but the new flow's state file (a different, empty location) does not read
    // it: the relocated state is empty, the ghost pass is invisible.
    const sf = stateFilePath(tmpDir, tmpDir);
    expect(sf).not.toBe(legacy);
    const state = loadState(sf);
    expect(state).toEqual({ checked: {} });
    expect(isPhaseComplete(state, 'old', ['ghost'])).toBe(false);

    // And the legacy file is left untouched on disk.
    expect(fs.existsSync(legacy)).toBe(true);
    expect(JSON.parse(fs.readFileSync(legacy, 'utf-8'))).toEqual(legacyContent);
  });
});

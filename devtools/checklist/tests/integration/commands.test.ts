import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { initCommand } from '../../src/commands/init.js';
import { showCommand } from '../../src/commands/show.js';
import { verifyCommand } from '../../src/commands/verify.js';
import { checkCommand } from '../../src/commands/check.js';
import { phasesCommand } from '../../src/commands/phases.js';
import { resetCommand } from '../../src/commands/reset.js';
import { writeActivePointer } from '../../src/resolver.js';
import { stateFilePath } from '../../src/state.js';
import * as loader from '../../src/loader.js';

// ── Helpers ─────────────────────────────────────────────────────────

let tmpDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

function writeChecklist(content: string): void {
  fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
}

// State no longer lives inside the skill dir; it is a (skill,target)-keyed file
// under the sandboxed XDG state home. Every command in this suite resolves to
// (skill=tmpDir, target=tmpDir), so that is the file these helpers read/write.
function statePath(): string {
  return stateFilePath(tmpDir, tmpDir);
}

function writeState(state: object): void {
  const p = statePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf-8');
}

function readState(): Record<string, unknown> {
  const p = statePath();
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// The skill dir must stay clean: the new model never writes a state file into it.
function skillDirHasStateFile(): boolean {
  return fs.existsSync(path.join(tmpDir, '.checklist.state.json'));
}

function logged(): string {
  return logSpy.mock.calls.map(c => c.join(' ')).join('\n');
}

function errored(): string {
  return errorSpy.mock.calls.map(c => c.join(' ')).join('\n');
}

const MINIMAL_YML = `
phases:
  - name: Build
    checks:
      - id: compile
        description: TypeScript compiles
        verify: "shell:true"
      - id: review
        description: Code review done
`;

const TWO_PHASE_YML = `
phases:
  - name: Setup
    checks:
      - id: env
        description: Env configured
        verify: "shell:echo ok"
      - id: approve
        description: Approved by lead
  - name: Build
    checks:
      - id: compile
        description: TypeScript compiles
        verify: "shell:true"
`;

let originalHome: string | undefined;
let originalCwd: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmd-test-'));
  // A run is keyed by the project you work IN (process.cwd()), not the shared
  // skill dir — so model that by making tmpDir the cwd, then canonicalize tmpDir
  // to the resolved cwd so the (skill=tmpDir, target=cwd) key these helpers
  // assume holds exactly (macOS resolves the symlinked tmp path on chdir).
  originalCwd = process.cwd();
  process.chdir(tmpDir);
  tmpDir = process.cwd();
  // Per-test global-pointer sandbox so init's global pointer never leaks into
  // another test's cwd-fallback resolution.
  originalHome = process.env.CHECKLIST_HOME;
  process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
});

afterEach(() => {
  process.chdir(originalCwd);   // leave tmpDir before removing it
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (originalHome !== undefined) {
    process.env.CHECKLIST_HOME = originalHome;
  } else {
    delete process.env.CHECKLIST_HOME;
  }
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════
// initCommand
// ═══════════════════════════════════════════════════════════════════════

describe('initCommand', () => {
  it('initializes with valid config and prints phase summary', () => {
    writeChecklist(MINIMAL_YML);
    initCommand(tmpDir, {});

    const output = logged();
    expect(output).toContain('checklist ready, 1 phases');
    expect(output).toContain('Build');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('errors when positional dir conflicts with --dir', () => {
    initCommand('/a/dir', { dir: '/b/dir' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('conflicting target dir');
  });

  it('clears existing state with --force flag', () => {
    writeChecklist(MINIMAL_YML);
    writeState({ checked: { '0': { compile: { status: 'pass', message: 'ok' } } } });

    initCommand(tmpDir, { force: true });

    const output = logged();
    expect(output).toContain('previous state cleared');
    // The relocated (skill,target) state file is cleared…
    expect(fs.existsSync(statePath())).toBe(false);
    // …and the skill dir is never written to.
    expect(skillDirHasStateFile()).toBe(false);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with error when state exists without --force', () => {
    writeChecklist(MINIMAL_YML);
    writeState({ checked: {} });

    initCommand(tmpDir, {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('state file exists');
    expect(errored()).toContain('--force');
  });

  it('exits with error when .checklist.yml not found', () => {
    initCommand(tmpDir, {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('.checklist.yml not found');
  });

  it('exits with error for invalid YAML config', () => {
    writeChecklist('phases: not-an-array');
    initCommand(tmpDir, {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('missing "phases" array');
  });

  it('uses resolveDir fallback when dir argument is undefined', () => {
    writeChecklist(MINIMAL_YML);
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    initCommand(undefined, {});

    const output = logged();
    expect(output).toContain('checklist ready');
    expect(exitSpy).not.toHaveBeenCalled();

    cwdSpy.mockRestore();
  });

  it('handles non-Error exception via String(e) fallback', () => {
    vi.spyOn(loader, 'loadChecklist').mockImplementation(() => { throw 'string error'; });

    initCommand(tmpDir, {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('string error');

    vi.restoreAllMocks();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// showCommand
// ═══════════════════════════════════════════════════════════════════════

describe('showCommand', () => {
  it('shows overview when no phase argument given', async () => {
    writeChecklist(MINIMAL_YML);

    await showCommand(undefined, { dir: tmpDir });

    const output = logged();
    expect(output).toContain('PHASE 0:');
    expect(output).toContain('BUILD');
    expect(output).toContain('pending');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('shows phase detail for a specific phase index', async () => {
    writeChecklist(MINIMAL_YML);

    await showCommand('0', { dir: tmpDir, path: tmpDir });

    const output = logged();
    expect(output).toContain('PHASE 0: BUILD');
    expect(output).toContain('compile');
    expect(output).toContain('review');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with gate failure when prior phase is incomplete', async () => {
    writeChecklist(TWO_PHASE_YML);

    await showCommand('1', { dir: tmpDir, path: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('gate blocked');
    expect(errored()).toContain('Setup');
  });

  it('shows phase detail when prior phases are complete', async () => {
    writeChecklist(TWO_PHASE_YML);
    // State is keyed by phase NAME now (case-folded): Setup -> 'setup'.
    writeState({
      checked: {
        setup: {
          env: { status: 'pass', message: 'ok' },
          approve: { status: 'pass', message: 'confirmed' },
        },
      },
    });

    await showCommand('1', { dir: tmpDir, path: tmpDir });

    const output = logged();
    expect(output).toContain('PHASE 1: BUILD');
    expect(output).toContain('compile');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with error for invalid phase name', async () => {
    writeChecklist(MINIMAL_YML);

    await showCommand('nonexistent', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('Phase not found');
  });

  it('exits with error when config not found', async () => {
    await showCommand(undefined, { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('.checklist.yml not found');
  });

  it('handles non-Error exception via String(e) fallback', async () => {
    vi.spyOn(loader, 'loadChecklist').mockImplementation(() => { throw 42; });

    await showCommand(undefined, { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('42');

    vi.restoreAllMocks();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// verifyCommand
// ═══════════════════════════════════════════════════════════════════════

describe('verifyCommand', () => {
  it('verifies mechanical checks and saves passing results to state', async () => {
    writeChecklist(MINIMAL_YML);

    await verifyCommand('0', { dir: tmpDir, path: tmpDir });

    const output = logged();
    expect(output).toContain('PHASE 0: BUILD');
    expect(output).toContain('PASS');

    const state = readState() as { checked: Record<string, Record<string, { status: string }>> };
    expect(state.checked['build']['compile'].status).toBe('pass');
  });

  it('records failing mechanical results so the gate reflects them', async () => {
    writeChecklist(`
phases:
  - name: Build
    checks:
      - id: fail-check
        description: Will fail
        verify: "shell:exit 1"
`);

    await verifyCommand('0', { dir: tmpDir, path: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const output = logged();
    expect(output).toContain('FAIL');

    const state = readState() as { checked: Record<string, Record<string, { status: string }>> };
    // The failing result IS recorded (status 'fail') so a later gate read sees
    // current reality — a stale pass cannot survive a regression.
    expect(state.checked['build']['fail-check'].status).toBe('fail');
  });

  it('exits with gate failure when prior phase is incomplete', async () => {
    writeChecklist(TWO_PHASE_YML);

    await verifyCommand('1', { dir: tmpDir, path: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('gate blocked');
  });

  it('shows manual items as pending in verify output', async () => {
    writeChecklist(MINIMAL_YML);

    await verifyCommand('0', { dir: tmpDir, path: tmpDir, all: true });

    const output = logged();
    expect(output).toContain('review');
    expect(output).toContain('manual');
  });

  it('exits with error when config not found', async () => {
    await verifyCommand('0', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('.checklist.yml not found');
  });

  it('handles non-Error exception via String(e) fallback', async () => {
    vi.spyOn(loader, 'loadChecklist').mockImplementation(() => { throw 'verify-string-error'; });

    await verifyCommand('0', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('verify-string-error');

    vi.restoreAllMocks();
  });

  it('exits with exit code 1 when some mechanical checks fail', async () => {
    writeChecklist(`
phases:
  - name: Build
    checks:
      - id: pass-one
        description: Will pass
        verify: "shell:true"
      - id: fail-one
        description: Will fail
        verify: "shell:exit 1"
`);

    await verifyCommand('0', { dir: tmpDir, path: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    const state = readState() as { checked: Record<string, Record<string, { status: string }>> };
    expect(state.checked['build']['pass-one'].status).toBe('pass');
    expect(state.checked['build']['fail-one'].status).toBe('fail');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// checkCommand
// ═══════════════════════════════════════════════════════════════════════

describe('checkCommand', () => {
  it('confirms a manual item and saves to state', () => {
    writeChecklist(MINIMAL_YML);

    checkCommand('0', 'review', { dir: tmpDir });

    const output = logged();
    expect(output).toContain('[x]');
    expect(output).toContain('review');
    expect(output).toContain('confirmed');

    const state = readState() as { checked: Record<string, Record<string, { status: string; message: string }>> };
    expect(state.checked['build']['review'].status).toBe('pass');
    expect(state.checked['build']['review'].message).toBe('confirmed');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('rejects a mechanical item (has verify rule)', () => {
    writeChecklist(MINIMAL_YML);

    checkCommand('0', 'compile', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('mechanical');
    expect(errored()).toContain('verify');
  });

  it('exits with error when item id not found', () => {
    writeChecklist(MINIMAL_YML);

    checkCommand('0', 'nonexistent', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('not found');
    expect(errored()).toContain('nonexistent');
    expect(errored()).toContain('compile');
    expect(errored()).toContain('review');
  });

  it('exits with gate failure when prior phase is incomplete', () => {
    writeChecklist(TWO_PHASE_YML);

    checkCommand('1', 'compile', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('gate blocked');
    expect(errored()).toContain('Setup');
  });

  it('exits with error when config not found', () => {
    checkCommand('0', 'review', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('.checklist.yml not found');
  });

  it('exits with error for invalid phase', () => {
    writeChecklist(MINIMAL_YML);

    checkCommand('99', 'review', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('Phase not found');
  });

  it('handles non-Error exception via String(e) fallback', () => {
    vi.spyOn(loader, 'loadChecklist').mockImplementation(() => { throw null; });

    checkCommand('0', 'review', { dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('null');

    vi.restoreAllMocks();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// phasesCommand
// ═══════════════════════════════════════════════════════════════════════

describe('phasesCommand', () => {
  it('lists all phases from .checklist.yml in cwd', () => {
    writeChecklist(TWO_PHASE_YML);
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    phasesCommand();

    const output = logged();
    expect(output).toContain('0: Setup');
    expect(output).toContain('1: Build');
    expect(exitSpy).not.toHaveBeenCalled();

    cwdSpy.mockRestore();
  });

  it('exits with error when .checklist.yml not found in cwd', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phases-empty-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(emptyDir);

    phasesCommand();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('.checklist.yml not found');

    cwdSpy.mockRestore();
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('handles non-Error exception via String(e) fallback', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    vi.spyOn(loader, 'loadChecklist').mockImplementation(() => { throw undefined; });

    phasesCommand();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('undefined');

    cwdSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// resetCommand
// ═══════════════════════════════════════════════════════════════════════

describe('resetCommand', () => {
  it('clears the (skill,target) state file and never touches the skill dir', () => {
    writeChecklist(MINIMAL_YML);
    writeState({ checked: { build: { item: { status: 'pass', message: 'ok' } } } });
    expect(fs.existsSync(statePath())).toBe(true);

    resetCommand({ dir: tmpDir });

    // The relocated state file for this (skill,target) is removed…
    expect(fs.existsSync(statePath())).toBe(false);
    // …and the skill dir was never written to.
    expect(skillDirHasStateFile()).toBe(false);
    expect(logged()).toContain('cleared state');
  });

  it('removes the active pointer when it points at the reset dir', () => {
    writeChecklist(MINIMAL_YML);
    writeActivePointer(tmpDir);
    resetCommand({ dir: tmpDir });

    expect(fs.existsSync(path.join(process.env.CHECKLIST_HOME!, 'active'))).toBe(false);
    expect(logged()).toContain('active pointer');
  });

  it('leaves a pointer that belongs to a different skill', () => {
    writeChecklist(MINIMAL_YML);
    writeActivePointer('/some/other/skill');
    resetCommand({ dir: tmpDir });

    expect(fs.readFileSync(path.join(process.env.CHECKLIST_HOME!, 'active'), 'utf-8')).toBe('/some/other/skill');
    expect(logged()).not.toContain('active pointer');
  });

  it('is a safe no-op when there is nothing to clean', () => {
    writeChecklist(MINIMAL_YML);
    resetCommand({ dir: tmpDir });
    expect(logged()).toContain('cleared state');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('REFUSES and deletes nothing when the target has no .checklist.yml', () => {
    // No writeChecklist: tmpDir is an unrelated dir. The (skill,target) state file
    // must survive — reset must not clobber state for a dir the user never named.
    writeState({ checked: { build: { item: { status: 'pass', message: 'ok' } } } });

    resetCommand({ dir: tmpDir });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('no active checklist to reset');
    expect(fs.existsSync(statePath())).toBe(true); // untouched
  });

  it('REFUSES rather than falling back to cwd when nothing resolves', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    writeState({ checked: { build: { item: { status: 'pass', message: 'ok' } } } });

    resetCommand(); // no --dir, no env, no pointer -> would have resolved to cwd

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(fs.existsSync(statePath())).toBe(true); // cwd state untouched
    cwdSpy.mockRestore();
  });
});

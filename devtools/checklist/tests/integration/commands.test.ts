import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { initCommand } from '../../src/commands/init.js';
import { showCommand } from '../../src/commands/show.js';
import { verifyCommand } from '../../src/commands/verify.js';
import { checkCommand } from '../../src/commands/check.js';
import { phasesCommand } from '../../src/commands/phases.js';
import * as loader from '../../src/loader.js';

// ── Helpers ─────────────────────────────────────────────────────────

let tmpDir: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

function writeChecklist(content: string): void {
  fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
}

function writeState(state: object): void {
  fs.writeFileSync(
    path.join(tmpDir, '.checklist.state.json'),
    JSON.stringify(state, null, 2),
    'utf-8',
  );
}

function readState(): Record<string, unknown> {
  const p = path.join(tmpDir, '.checklist.state.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
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

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmd-test-'));
  // Per-test global-pointer sandbox so init's global pointer never leaks into
  // another test's cwd-fallback resolution.
  originalHome = process.env.CHECKLIST_HOME;
  process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
});

afterEach(() => {
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

  it('clears existing state with --force flag', () => {
    writeChecklist(MINIMAL_YML);
    writeState({ checked: { '0': { compile: { status: 'pass', message: 'ok' } } } });

    initCommand(tmpDir, { force: true });

    const output = logged();
    expect(output).toContain('previous state cleared');
    expect(fs.existsSync(path.join(tmpDir, '.checklist.state.json'))).toBe(false);
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
    writeState({
      checked: {
        '0': {
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
    expect(state.checked['0']['compile'].status).toBe('pass');
  });

  it('does not save failing mechanical results to state', async () => {
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

    const state = readState() as { checked: Record<string, Record<string, unknown>> };
    expect(state.checked?.['0']?.['fail-check']).toBeUndefined();
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
    expect(state.checked['0']['pass-one'].status).toBe('pass');
    expect(state.checked['0']?.['fail-one']).toBeUndefined();
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
    expect(state.checked['0']['review'].status).toBe('pass');
    expect(state.checked['0']['review'].message).toBe('confirmed');
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

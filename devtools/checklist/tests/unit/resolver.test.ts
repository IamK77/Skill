import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { findPhaseIndex, runPhase, gatePriorPhases, resolveDir, writeActivePointer, clearActivePointer } from '../../src/resolver.js';
import type { ChecklistState } from '../../src/state.js';
import type { ChecklistConfig, Phase } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(phaseNames: string[][]): ChecklistConfig {
  return {
    phases: phaseNames.map(([name, ...ids]) => ({
      name,
      checks: ids.map(id => ({ id, description: `desc for ${id}` })),
    })),
  };
}

function makePhase(name: string, checks: { id: string; verify?: string }[]): Phase {
  return {
    name,
    checks: checks.map(c => ({
      id: c.id,
      description: `desc for ${c.id}`,
      ...(c.verify ? { verify: c.verify } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// findPhaseIndex
// ---------------------------------------------------------------------------

describe('findPhaseIndex', () => {
  const config: ChecklistConfig = {
    phases: [
      { name: 'Setup', checks: [{ id: 's1', description: 'setup item' }] },
      { name: 'Build', checks: [{ id: 'b1', description: 'build item' }] },
      { name: 'Deploy', checks: [{ id: 'd1', description: 'deploy item' }] },
    ],
  };

  it('finds phase by numeric index "0"', () => {
    expect(findPhaseIndex(config, '0')).toBe(0);
  });

  it('finds phase by numeric index "1"', () => {
    expect(findPhaseIndex(config, '1')).toBe(1);
  });

  it('finds phase by numeric index "2" (last phase)', () => {
    expect(findPhaseIndex(config, '2')).toBe(2);
  });

  it('finds phase by name (exact case)', () => {
    expect(findPhaseIndex(config, 'Build')).toBe(1);
  });

  it('finds phase by name (case-insensitive lowercase)', () => {
    expect(findPhaseIndex(config, 'setup')).toBe(0);
  });

  it('finds phase by name (case-insensitive uppercase)', () => {
    expect(findPhaseIndex(config, 'DEPLOY')).toBe(2);
  });

  it('finds phase by name (case-insensitive mixed)', () => {
    expect(findPhaseIndex(config, 'bUiLd')).toBe(1);
  });

  it('throws for out-of-range numeric index', () => {
    expect(() => findPhaseIndex(config, '3')).toThrow('Phase not found');
  });

  it('throws for large out-of-range numeric index', () => {
    expect(() => findPhaseIndex(config, '100')).toThrow('Phase not found');
  });

  it('throws for unknown name with descriptive message', () => {
    expect(() => findPhaseIndex(config, 'nonexistent')).toThrow(
      'Phase not found: "nonexistent". Use `checklist phases` to list available phases.',
    );
  });

  it('negative index falls through to name search and throws', () => {
    // parseInt("-1", 10) = -1, which fails the >= 0 guard,
    // so it falls through to the name search. "-1" is not a phase name.
    expect(() => findPhaseIndex(config, '-1')).toThrow('Phase not found');
  });

  it('negative index falls through to name search and matches if name exists', () => {
    const specialConfig: ChecklistConfig = {
      phases: [
        { name: '-1', checks: [{ id: 'x', description: 'x' }] },
      ],
    };
    // The numeric parse yields -1 which fails >= 0, so it falls to name search.
    // The phase is literally named "-1", so it matches.
    expect(findPhaseIndex(specialConfig, '-1')).toBe(0);
  });

  it('non-numeric string that is not a phase name throws', () => {
    expect(() => findPhaseIndex(config, 'abc')).toThrow('Phase not found');
  });
});

// ---------------------------------------------------------------------------
// runPhase
// ---------------------------------------------------------------------------

describe('runPhase', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-resolver-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('phase with only manual checks has correct counts', async () => {
    const phase = makePhase('Manual Phase', [
      { id: 'm1' },
      { id: 'm2' },
      { id: 'm3' },
    ]);

    const result = await runPhase(phase, 0, tmpDir, tmpDir);

    expect(result.phaseName).toBe('Manual Phase');
    expect(result.phaseIndex).toBe(0);
    expect(result.manualCount).toBe(3);
    expect(result.mechanicalTotal).toBe(0);
    expect(result.mechanicalPassed).toBe(0);
    expect(result.checks).toHaveLength(3);
    for (const c of result.checks) {
      expect(c.kind).toBe('manual');
      expect(c.result).toBeUndefined();
    }
  });

  it('phase with passing shell checks has mechanicalPassed equal to mechanicalTotal', async () => {
    const phase = makePhase('Shell Phase', [
      { id: 'c1', verify: 'shell:echo ok' },
      { id: 'c2', verify: 'shell:true' },
    ]);

    const result = await runPhase(phase, 1, tmpDir, tmpDir);

    expect(result.phaseName).toBe('Shell Phase');
    expect(result.phaseIndex).toBe(1);
    expect(result.mechanicalTotal).toBe(2);
    expect(result.mechanicalPassed).toBe(2);
    expect(result.manualCount).toBe(0);
    for (const c of result.checks) {
      expect(c.kind).toBe('mechanical');
      expect(c.result?.status).toBe('pass');
    }
  });

  it('phase with mix of manual and mechanical checks has correct counts', async () => {
    const phase = makePhase('Mixed Phase', [
      { id: 'manual1' },
      { id: 'mech1', verify: 'shell:echo hello' },
      { id: 'manual2' },
      { id: 'mech2', verify: 'shell:true' },
    ]);

    const result = await runPhase(phase, 2, tmpDir, tmpDir);

    expect(result.phaseName).toBe('Mixed Phase');
    expect(result.phaseIndex).toBe(2);
    expect(result.manualCount).toBe(2);
    expect(result.mechanicalTotal).toBe(2);
    expect(result.mechanicalPassed).toBe(2);
    expect(result.checks).toHaveLength(4);
  });

  it('phase with failing mechanical check has mechanicalPassed less than mechanicalTotal', async () => {
    const phase = makePhase('Failing Phase', [
      { id: 'pass1', verify: 'shell:echo good' },
      { id: 'fail1', verify: 'shell:exit 1' },
      { id: 'pass2', verify: 'shell:true' },
    ]);

    const result = await runPhase(phase, 0, tmpDir, tmpDir);

    expect(result.mechanicalTotal).toBe(3);
    expect(result.mechanicalPassed).toBe(2);
    expect(result.manualCount).toBe(0);

    // Verify individual check results
    const passChecks = result.checks.filter(c => c.result?.status === 'pass');
    const failChecks = result.checks.filter(c => c.result?.status === 'fail');
    expect(passChecks).toHaveLength(2);
    expect(failChecks).toHaveLength(1);
    expect(failChecks[0].item.id).toBe('fail1');
  });

  it('phase with empty checks list produces zeroed counts', async () => {
    const phase = makePhase('Empty Phase', []);

    const result = await runPhase(phase, 0, tmpDir, tmpDir);

    expect(result.phaseName).toBe('Empty Phase');
    expect(result.mechanicalTotal).toBe(0);
    expect(result.mechanicalPassed).toBe(0);
    expect(result.manualCount).toBe(0);
    expect(result.checks).toHaveLength(0);
  });

  it('preserves item references in check results', async () => {
    const phase = makePhase('Ref Phase', [
      { id: 'item-a', verify: 'shell:echo a' },
    ]);

    const result = await runPhase(phase, 5, tmpDir, tmpDir);

    expect(result.checks[0].item.id).toBe('item-a');
    expect(result.checks[0].item.description).toBe('desc for item-a');
  });
});

// ---------------------------------------------------------------------------
// gatePriorPhases
// ---------------------------------------------------------------------------

describe('gatePriorPhases', () => {
  const config: ChecklistConfig = {
    phases: [
      {
        name: 'Phase-0',
        checks: [
          { id: 'p0-a', description: 'first check' },
          { id: 'p0-b', description: 'second check' },
        ],
      },
      {
        name: 'Phase-1',
        checks: [
          { id: 'p1-a', description: 'another check' },
        ],
      },
      {
        name: 'Phase-2',
        checks: [
          { id: 'p2-a', description: 'yet another' },
          { id: 'p2-b', description: 'and another' },
        ],
      },
    ],
  };

  it('target phase 0 always passes (no prior phases to gate)', () => {
    const state: ChecklistState = { checked: {} };
    const result = gatePriorPhases(config, 0, state);

    expect(result.passed).toBe(true);
    expect(result.failedPhase).toBeUndefined();
    expect(result.failedPhaseIndex).toBeUndefined();
  });

  it('all prior phases complete passes the gate', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'p0-a': { status: 'pass', message: 'ok' },
          'p0-b': { status: 'pass', message: 'ok' },
        },
        '1': {
          'p1-a': { status: 'pass', message: 'ok' },
        },
      },
    };
    const result = gatePriorPhases(config, 2, state);

    expect(result.passed).toBe(true);
    expect(result.failedPhase).toBeUndefined();
    expect(result.failedPhaseIndex).toBeUndefined();
  });

  it('first prior phase incomplete fails with that phase info', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'p0-a': { status: 'pass', message: 'ok' },
          // p0-b is missing
        },
      },
    };
    const result = gatePriorPhases(config, 2, state);

    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('Phase-0');
    expect(result.failedPhaseIndex).toBe(0);
  });

  it('second prior phase incomplete (first complete) fails with second phase info', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'p0-a': { status: 'pass', message: 'ok' },
          'p0-b': { status: 'fail', message: 'failed but still checked' },
        },
        // phase 1 has no entries at all
      },
    };
    const result = gatePriorPhases(config, 2, state);

    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('Phase-1');
    expect(result.failedPhaseIndex).toBe(1);
  });

  it('completely empty state fails at phase 0 when targeting phase 1', () => {
    const state: ChecklistState = { checked: {} };
    const result = gatePriorPhases(config, 1, state);

    expect(result.passed).toBe(false);
    expect(result.failedPhase).toBe('Phase-0');
    expect(result.failedPhaseIndex).toBe(0);
  });

  it('passes when prior phase items have non-pass statuses (fail/error still count as checked)', () => {
    const state: ChecklistState = {
      checked: {
        '0': {
          'p0-a': { status: 'fail', message: 'failed' },
          'p0-b': { status: 'error', message: 'errored' },
        },
      },
    };
    // isPhaseComplete only checks existence, not status
    const result = gatePriorPhases(config, 1, state);

    expect(result.passed).toBe(true);
  });

  it('config with single phase and target 0 always passes', () => {
    const singleConfig: ChecklistConfig = {
      phases: [
        { name: 'Only', checks: [{ id: 'x', description: 'x' }] },
      ],
    };
    const state: ChecklistState = { checked: {} };
    const result = gatePriorPhases(singleConfig, 0, state);

    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveDir
// ---------------------------------------------------------------------------

describe('resolveDir', () => {
  let tmpDir: string;
  const originalEnv = process.env.CHECKLIST_DIR;
  const originalHome = process.env.CHECKLIST_HOME;
  const originalSkill = process.env.CLAUDE_SKILL_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-dir-test-'));
    delete process.env.CHECKLIST_DIR;
    delete process.env.CLAUDE_SKILL_DIR;
    // Point the active pointer at a fresh empty dir so it is not seen unless a
    // test explicitly creates it.
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (originalEnv !== undefined) {
      process.env.CHECKLIST_DIR = originalEnv;
    } else {
      delete process.env.CHECKLIST_DIR;
    }
    if (originalHome !== undefined) {
      process.env.CHECKLIST_HOME = originalHome;
    } else {
      delete process.env.CHECKLIST_HOME;
    }
    if (originalSkill !== undefined) {
      process.env.CLAUDE_SKILL_DIR = originalSkill;
    } else {
      delete process.env.CLAUDE_SKILL_DIR;
    }
    vi.restoreAllMocks();
  });

  function writePointer(dir: string): void {
    const p = path.join(process.env.CHECKLIST_HOME!, 'active');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, dir, 'utf-8');
  }

  // A real dir that looks like a checklist dir (has .checklist.yml), so the
  // self-heal in resolveDir treats a pointer to it as valid.
  function makeCheckdir(): string {
    const d = fs.mkdtempSync(path.join(tmpDir, 'skill-'));
    fs.writeFileSync(path.join(d, '.checklist.yml'), 'phases: []', 'utf-8');
    return d;
  }

  function pointerExists(): boolean {
    return fs.existsSync(path.join(process.env.CHECKLIST_HOME!, 'active'));
  }

  it('returns explicit argument when provided', () => {
    expect(resolveDir('/some/path')).toBe('/some/path');
  });

  it('returns CHECKLIST_DIR env var when set and no explicit arg', () => {
    process.env.CHECKLIST_DIR = '/env/dir';
    expect(resolveDir()).toBe('/env/dir');
  });

  it('returns CLAUDE_SKILL_DIR when set (a running skill knows its own dir)', () => {
    process.env.CLAUDE_SKILL_DIR = '/skill/dir';
    expect(resolveDir()).toBe('/skill/dir');
  });

  it('prioritizes CHECKLIST_DIR over CLAUDE_SKILL_DIR', () => {
    process.env.CHECKLIST_DIR = '/env/dir';
    process.env.CLAUDE_SKILL_DIR = '/skill/dir';
    expect(resolveDir()).toBe('/env/dir');
  });

  it('prioritizes CLAUDE_SKILL_DIR over the pointer file', () => {
    process.env.CLAUDE_SKILL_DIR = '/skill/dir';
    writePointer('/pointed/dir');
    expect(resolveDir()).toBe('/skill/dir');
  });

  it('reads the active pointer file when present (cwd-independent)', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    const skillDir = makeCheckdir();
    writePointer(skillDir);

    expect(resolveDir()).toBe(skillDir);

    cwdSpy.mockRestore();
  });

  it('self-heals a zombie pointer whose target no longer exists', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    writePointer('/no/such/dir');

    expect(resolveDir()).toBe(tmpDir); // falls through to cwd
    expect(pointerExists()).toBe(false); // and removes the dead pointer

    cwdSpy.mockRestore();
  });

  it('self-heals a stale pointer whose target lacks .checklist.yml', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    const emptyDir = fs.mkdtempSync(path.join(tmpDir, 'empty-'));
    writePointer(emptyDir);

    expect(resolveDir()).toBe(tmpDir);
    expect(pointerExists()).toBe(false);

    cwdSpy.mockRestore();
  });

  it('self-heals an empty/whitespace-only pointer', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    writePointer('   \n');

    expect(resolveDir()).toBe(tmpDir);
    expect(pointerExists()).toBe(false);

    cwdSpy.mockRestore();
  });

  it('KEEPS a pointer when its target cannot be stat-ed (non-ENOENT error)', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    // A self-referential symlink makes statSync throw ELOOP (not ENOENT) when
    // resolving a path through it — standing in for a permission flap / NFS stall.
    const loop = path.join(tmpDir, 'loop');
    fs.symlinkSync(loop, loop);
    writePointer(loop);

    expect(resolveDir()).toBe(loop); // trusted, not self-healed
    expect(pointerExists()).toBe(true); // valid pointer preserved

    cwdSpy.mockRestore();
  });

  it('falls back to cwd when no explicit, no env, no pointer file', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    expect(resolveDir()).toBe(tmpDir);

    cwdSpy.mockRestore();
  });

  it('prioritizes explicit arg over env var', () => {
    process.env.CHECKLIST_DIR = '/env/dir';
    expect(resolveDir('/explicit')).toBe('/explicit');
  });

  it('prioritizes env var over the pointer file', () => {
    process.env.CHECKLIST_DIR = '/env/dir';
    writePointer('/pointed/dir');

    expect(resolveDir()).toBe('/env/dir');
  });

  it('trims whitespace from the pointer file content', () => {
    const skillDir = makeCheckdir();
    writePointer(`  ${skillDir}  \n`);

    expect(resolveDir()).toBe(skillDir);
  });
});

// ---------------------------------------------------------------------------
// writeActivePointer
// ---------------------------------------------------------------------------

describe('writeActivePointer', () => {
  let tmpDir: string;
  const originalHome = process.env.CHECKLIST_HOME;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'write-pointer-test-'));
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
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

  function pointerContent(): string {
    return fs.readFileSync(path.join(process.env.CHECKLIST_HOME!, 'active'), 'utf-8');
  }

  it('writes the target dir to the pointer file', () => {
    writeActivePointer('/some/other/dir');
    expect(pointerContent()).toBe('/some/other/dir');
  });

  it('writes the pointer even when target equals cwd', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    writeActivePointer(tmpDir);
    expect(pointerContent()).toBe(tmpDir);

    cwdSpy.mockRestore();
  });

  it('does not create any cwd-local .checklist.active file', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    writeActivePointer('/some/other/dir');
    expect(fs.existsSync(path.join(tmpDir, '.checklist.active'))).toBe(false);

    cwdSpy.mockRestore();
  });

  it('resolves a relative target to an absolute path', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    const subDir = path.join(tmpDir, 'sub');
    fs.mkdirSync(subDir);

    writeActivePointer('./sub');
    expect(pointerContent()).toBe(subDir);

    cwdSpy.mockRestore();
  });

  it('creates the pointer directory if it does not exist', () => {
    writeActivePointer('/some/dir');
    expect(fs.existsSync(path.join(process.env.CHECKLIST_HOME!, 'active'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clearActivePointer
// ---------------------------------------------------------------------------

describe('clearActivePointer', () => {
  let tmpDir: string;
  const originalHome = process.env.CHECKLIST_HOME;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clear-pointer-test-'));
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
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

  function pointerPath(): string {
    return path.join(process.env.CHECKLIST_HOME!, 'active');
  }

  it('returns false and no-ops when no pointer exists', () => {
    expect(clearActivePointer()).toBe(false);
  });

  it('removes the pointer unconditionally when called without a target', () => {
    writeActivePointer('/some/dir');
    expect(clearActivePointer()).toBe(true);
    expect(fs.existsSync(pointerPath())).toBe(false);
  });

  it('removes the pointer when it matches the given target', () => {
    writeActivePointer('/skill/a');
    expect(clearActivePointer('/skill/a')).toBe(true);
    expect(fs.existsSync(pointerPath())).toBe(false);
  });

  it('leaves the pointer when it points at a different skill', () => {
    writeActivePointer('/skill/b');
    expect(clearActivePointer('/skill/a')).toBe(false);
    expect(fs.readFileSync(pointerPath(), 'utf-8')).toBe('/skill/b');
  });
});

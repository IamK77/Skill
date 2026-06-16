// ASSAY PROBE — call-it-again / gate-property defect.
//
// Candidate defect: verifyCommand (src/commands/verify.ts:23-29) only writes a
// mechanical result when status === 'pass'. It has NO else-branch to clear (or
// overwrite) a now-FAILING item. So a phase whose mechanical gate was once
// recorded green keeps that stale `pass` forever: a later re-verify that prints
// `mechanical: 0/1 passed` and exits 1 writes nothing and deletes nothing, and
// the once-green gate stays OPEN.
//
// ORACLE — the GATE PROPERTY (SKILL.md: the tool "will not advance past a GATE
// the checklist tool has not cleared"; probe-construction.md §7 call-it-again
// + the State-lifecycle row "every invalid transition is refused and leaves
// state untouched"): a mechanical check is a LIVE predicate over the world (a
// file / a command), not a one-time event. A green that can no longer be
// reproduced must not keep a gate open. The contradiction is self-evident from
// the tool's own output in ONE run — `verify 0` says 0/1 passed + exit 1, yet
// `check 1` / `show` still treat phase 0 as cleared.
//
// This is the CALL-IT-AGAIN probe the existing suite is missing. The closest
// existing tests only cover a NEVER-recorded failing item (integration
// "does not save failing mechanical results to state",
// formatter-boundaries.test.ts:344). NONE re-verify an item previously recorded
// green, so the stale-pass / open-gate consequence is untested.
//
// The mechanical check is `test -f <flag>` over a per-test flag file we flip
// between the two verify calls — a real live predicate, no mocking of the SUT.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { verifyCommand } from '../../src/commands/verify.js';
import { checkCommand } from '../../src/commands/check.js';
import { showCommand } from '../../src/commands/show.js';
import { stateFilePath } from '../../src/state.js';

let tmpDir: string;
let flagPath: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;
let originalHome: string | undefined;

function logged(): string {
  return logSpy.mock.calls.map(c => c.join(' ')).join('\n');
}
function errored(): string {
  return errorSpy.mock.calls.map(c => c.join(' ')).join('\n');
}
function clearSpies(): void {
  logSpy.mockClear();
  errorSpy.mockClear();
  exitSpy.mockClear();
}
function readState(): { checked: Record<string, Record<string, { status?: string }>> } {
  // State now lives under the (sandboxed) XDG state home, keyed by (skill,target).
  // Commands here run with { dir: tmpDir, path: tmpDir }, so that is the key.
  const p = stateFilePath(tmpDir, tmpDir);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay-stalepass-'));
  flagPath = path.join(tmpDir, 'FLAG');
  // Sandbox the global active pointer so we never touch the real one.
  originalHome = process.env.CHECKLIST_HOME;
  process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');

  // Phase 0 has ONE mechanical gate over a live file predicate.
  // Phase 1 has a manual surface check that the gate must protect.
  fs.writeFileSync(
    path.join(tmpDir, '.checklist.yml'),
    `
phases:
  - name: phase0
    checks:
      - id: gate-check
        description: mechanical gate over a file
        verify: "shell:test -f ${flagPath}"
  - name: phase1
    checks:
      - id: surface
        description: manual surface check
`,
    'utf-8',
  );

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

describe('ASSAY: re-verify that goes RED must revoke the stale pass (gate property)', () => {
  it('a RED re-verify clears the previously-recorded pass for that item', async () => {
    // Arrange: flag present -> first verify is GREEN and records the gate as pass.
    fs.writeFileSync(flagPath, '');
    await verifyCommand('0', { dir: tmpDir, path: tmpDir });
    expect(readState().checked['phase0']['gate-check'].status).toBe('pass');

    // Act: the gated condition reverts; re-verify the SAME phase (call-it-again).
    fs.rmSync(flagPath);
    clearSpies();
    await verifyCommand('0', { dir: tmpDir, path: tmpDir });

    // The tool itself reports the gate is RED now.
    expect(logged()).toContain('mechanical: 0/1 passed');
    expect(exitSpy).toHaveBeenCalledWith(1);

    // ORACLE: a live-RED mechanical check must NOT leave a stale `pass` standing.
    // The recorded state must no longer claim the gate passed.
    const recorded = readState().checked['phase0']?.['gate-check'];
    expect(recorded?.status).not.toBe('pass');
  });

  it('with phase 0 live-RED, the gate blocks phase 1 and show does not claim all passed', async () => {
    // Arrange: drive phase 0 green, then revert the world.
    fs.writeFileSync(flagPath, '');
    await verifyCommand('0', { dir: tmpDir, path: tmpDir });
    fs.rmSync(flagPath);

    // Re-verify -> RED (records that the gate no longer holds).
    clearSpies();
    await verifyCommand('0', { dir: tmpDir, path: tmpDir });
    expect(exitSpy).toHaveBeenCalledWith(1);

    // ORACLE (gate property, end to end): phase 1 must be BLOCKED because the
    // only gate of phase 0 is failing NOW.
    clearSpies();
    await checkCommand('1', 'surface', { dir: tmpDir, path: tmpDir });
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errored()).toContain('gate blocked');

    // And the overview must NOT declare victory while phase 0's gate is RED.
    clearSpies();
    await showCommand(undefined, { dir: tmpDir, path: tmpDir });
    expect(logged()).not.toContain('all phases passed');
  });
});

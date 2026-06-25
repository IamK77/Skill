// ASSAY — the sensor's ACTUAL USAGE EFFECT through the real command stack.
//
// #15 made shell:/script: sensors execute in the PROJECT (targetPath) with a
// per-check timeout. The unit tests (sensor-exec-cwd) prove that at the runCheck
// level — but a user never calls runCheck. They run `checklist verify <phase>`,
// which is commands/verify.ts → resolver.runPhase → runCheck → runShell. That
// stack threads TWO directories: dir = the skill (where .checklist.yml lives) and
// path = the project under review. If runPhase/verify forwarded the wrong one as
// the exec cwd, every unit test would still pass while real use ran sensors in
// the skill's install dir. These tests drive the REAL verifyCommand with the two
// dirs DISTINCT, which the existing command tests never do (they pass dir===path).
//
// ORACLE (no invented spec): a marker file is created ONLY in the project dir;
// the sensor is `shell:cat marker`. It can succeed ⟺ the command executed with
// the project as its working directory. status===pass is therefore a direct
// witness of "ran in the project", needing no assertion on the code's own output.
//
// Conventions: vitest globals; real temp dirs + real bash exec; console/process
// .exit spied (the exit code IS observable behaviour); CHECKLIST_HOME sandboxed
// so the global state/pointer is never touched.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { verifyCommand } from '../../src/commands/verify.js';
import { stateFilePath } from '../../src/state.js';

let skillDir: string;   // holds .checklist.yml (resolver `dir`)
let projectDir: string; // the project under review (`path` / targetPath)
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;
let originalHome: string | undefined;

function logged(): string {
  return logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
}
function recorded(phase: string, id: string): { status?: string } | undefined {
  const p = stateFilePath(skillDir, projectDir); // keyed by (skill, project)
  const state = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return state.checked?.[phase]?.[id];
}
function writeChecklist(yml: string): void {
  fs.writeFileSync(path.join(skillDir, '.checklist.yml'), yml, 'utf-8');
}

beforeEach(() => {
  skillDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sci-skill-')));
  projectDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sci-proj-')));
  originalHome = process.env.CHECKLIST_HOME;
  process.env.CHECKLIST_HOME = path.join(skillDir, 'cfg');
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
});

afterEach(() => {
  fs.rmSync(skillDir, { recursive: true, force: true });
  fs.rmSync(projectDir, { recursive: true, force: true });
  if (originalHome !== undefined) process.env.CHECKLIST_HOME = originalHome;
  else delete process.env.CHECKLIST_HOME;
  vi.restoreAllMocks();
});

describe('ASSAY: `verify` runs a sensor in the project, end to end', () => {
  it('a project-only marker makes the sensor PASS — proving exec cwd is the project, not the skill dir', async () => {
    fs.writeFileSync(path.join(projectDir, 'marker'), 'PROJECT-ONLY', 'utf-8');
    writeChecklist(
      'phases:\n  - name: build\n    checks:\n      - id: tests-green\n        description: d\n        verify: "shell:cat marker"\n',
    );

    await verifyCommand('build', { dir: skillDir, path: projectDir });

    // ORACLE: passes ⟺ `cat marker` found the file ⟺ ran in the project.
    expect(recorded('build', 'tests-green')?.status).toBe('pass');
    expect(logged()).toContain('1/1 passed');
    expect(exitSpy).not.toHaveBeenCalledWith(1);
  });

  it('a skill-dir-only file is INVISIBLE to the sensor (the working dir really moved off the skill dir)', async () => {
    // Inverse witness: the file lives where the OLD behaviour would have run.
    fs.writeFileSync(path.join(skillDir, 'skill-only'), 'x', 'utf-8');
    writeChecklist(
      'phases:\n  - name: build\n    checks:\n      - id: tests-green\n        description: d\n        verify: "shell:cat skill-only"\n',
    );

    await verifyCommand('build', { dir: skillDir, path: projectDir });

    expect(recorded('build', 'tests-green')?.status).not.toBe('pass');
    expect(logged()).toContain('0/1 passed');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('call-it-again: a green project sensor re-verified with the world unchanged stays green and stable (idempotent)', async () => {
    fs.writeFileSync(path.join(projectDir, 'marker'), 'PROJECT-ONLY', 'utf-8');
    writeChecklist(
      'phases:\n  - name: build\n    checks:\n      - id: tests-green\n        description: d\n        verify: "shell:cat marker"\n',
    );

    await verifyCommand('build', { dir: skillDir, path: projectDir });
    const first = recorded('build', 'tests-green')?.status;
    await verifyCommand('build', { dir: skillDir, path: projectDir }); // second invocation

    expect(first).toBe('pass');
    expect(recorded('build', 'tests-green')?.status).toBe('pass'); // no drift on re-run
    expect(exitSpy).not.toHaveBeenCalledWith(1);
  });

  it('a per-check timeout survives the whole command stack: yaml timeout: 1 fails a sleep 3 sensor', async () => {
    // Proves the timeout flows .checklist.yml → loader → runPhase → runCheck →
    // runShell, not just runCheck. Without the per-check timeout this sleep would
    // sit under the 10s default and PASS.
    writeChecklist(
      'phases:\n  - name: build\n    checks:\n      - id: slow\n        description: d\n        verify: "shell:sleep 3"\n        timeout: 1\n',
    );

    await verifyCommand('build', { dir: skillDir, path: projectDir });

    expect(recorded('build', 'slow')?.status).not.toBe('pass');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

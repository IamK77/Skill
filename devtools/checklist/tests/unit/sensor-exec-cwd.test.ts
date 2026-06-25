// Independent-verification sensors: a shell:/script: rule must run AGAINST THE
// PROJECT, not the skill's install dir, and must honour a per-check timeout.
//
// Before this, runShell/runScript executed in `cwd` (the skill dir holding
// .checklist.yml) with a hardcoded 10s budget — so "run the project's tests"
// could neither find the project nor finish. These pin the two enablers:
//   1. exec working directory = targetPath (the project), containment still anchored
//      to the skill dir for script: files.
//   2. item.timeoutMs overrides the 10s default per check.
//
// Conventions: globals (no vitest imports), real temp dirs, real fs/exec.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCheck } from '../../src/runner.js';
import type { CheckItem } from '../../src/types.js';

describe('sensor execution targets the project, not the skill dir', () => {
  let skillDir: string;
  let projectDir: string;

  beforeEach(() => {
    skillDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sensor-skill-')));
    projectDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sensor-proj-')));
  });

  afterEach(() => {
    fs.rmSync(skillDir, { recursive: true, force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  const item = (verify: string, extra: Partial<CheckItem> = {}): CheckItem =>
    ({ id: 'it', description: 'd', verify, ...extra });

  it('a shell: sensor runs with the PROJECT as its working directory', async () => {
    // A marker exists only in the project. `cat marker` passes iff exec cwd is the
    // project; if it ran in the skill dir (the old behaviour) it would fail.
    fs.writeFileSync(path.join(projectDir, 'marker'), 'PROJECT-CWD', 'utf-8');
    const result = await runCheck(item('shell:cat marker'), skillDir, projectDir);
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('PROJECT-CWD');
  });

  it('a shell: sensor does NOT see files that live only in the skill dir', async () => {
    // Inverse of the above: a skill-dir-only file is invisible to a project-rooted
    // sensor. Proves the working dir really moved off the skill dir.
    fs.writeFileSync(path.join(skillDir, 'skill-only'), 'x', 'utf-8');
    const result = await runCheck(item('shell:cat skill-only'), skillDir, projectDir);
    expect(result.result!.status).toBe('fail');
  });

  it('a script: file lives in the skill dir (containment) but executes against the project', async () => {
    // The vetted sensor SHIPS in the skill dir, yet its side effects land in the
    // project: it writes a file relative to its own working directory.
    const script = path.join(skillDir, 'probe.sh');
    fs.writeFileSync(script, '#!/bin/bash\necho "$PWD" > ran-here.txt\necho probed\n', 'utf-8');
    fs.chmodSync(script, 0o755);

    const result = await runCheck(item('script:./probe.sh'), skillDir, projectDir);

    expect(result.result!.status).toBe('pass');
    // The artifact landed in the PROJECT, and its recorded $PWD is the project.
    const dropped = path.join(projectDir, 'ran-here.txt');
    expect(fs.existsSync(dropped)).toBe(true);
    expect(fs.readFileSync(dropped, 'utf-8').trim()).toBe(projectDir);
    // It did NOT pollute the skill dir.
    expect(fs.existsSync(path.join(skillDir, 'ran-here.txt'))).toBe(false);
  });

  it('a script: that escapes the skill dir is still rejected (containment unchanged)', async () => {
    // The exec-cwd move must not loosen containment: the FILE is still vetted
    // against the skill dir, so an absolute outside path is rejected, not run.
    const outside = path.join(projectDir, 'evil.sh'); // exists, but outside skillDir
    fs.writeFileSync(outside, '#!/bin/bash\necho ESCAPED\n', 'utf-8');
    fs.chmodSync(outside, 0o755);
    const result = await runCheck(item(`script:${outside}`), skillDir, projectDir);
    expect(result.result!.status).toBe('error');
    expect(result.result!.message).toContain('escapes the checklist dir');
  });

  it('honours a per-check timeoutMs override (a short budget fails a command that 10s would pass)', async () => {
    // sleep 1 completes well under the 10s default — so if it fails, the 200ms
    // per-check override is what cut it off. Pins item.timeoutMs is wired through.
    const result = await runCheck(item('shell:sleep 1', { timeoutMs: 200 }), skillDir, projectDir);
    expect(result.result!.status).toBe('fail');
    expect(result.result!.message.length).toBeGreaterThan(0);
  });

  it('the same command PASSES under a generous per-check timeoutMs', async () => {
    // Control for the override test: with room to finish, sleep 0.1 passes.
    const result = await runCheck(item('shell:sleep 0.1; echo done', { timeoutMs: 5000 }), skillDir, projectDir);
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('done');
  });

  // ── per-check timeout on a SCRIPT sensor (the shell path is covered above; the
  //    script path through runScriptFile was not) ──
  it('honours timeoutMs for a script: sensor too (short budget fails a slow script)', async () => {
    // The script FILE lives in the skill dir (containment base); a 200ms budget
    // cuts off its 1s sleep. Pins that timeoutMs reaches runScriptFile, not only
    // runShell.
    const script = path.join(skillDir, 'slow.sh');
    fs.writeFileSync(script, '#!/bin/bash\nsleep 1\necho done\n', 'utf-8');
    fs.chmodSync(script, 0o755);
    const result = await runCheck(item('script:./slow.sh', { timeoutMs: 200 }), skillDir, projectDir);
    expect(result.result!.status).toBe('fail');
  });

  it('a script: sensor PASSES under a generous timeoutMs', async () => {
    const script = path.join(skillDir, 'quick.sh');
    fs.writeFileSync(script, '#!/bin/bash\nsleep 0.1\necho quick-done\n', 'utf-8');
    fs.chmodSync(script, 0o755);
    const result = await runCheck(item('script:./quick.sh', { timeoutMs: 5000 }), skillDir, projectDir);
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('quick-done');
  });
});

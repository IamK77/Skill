import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

// One contract, two shipping entrypoints. Never rebuild inside this test: a stale
// committed bundle MUST fail, rather than silently repairing itself before use.
const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const YAML = `phases:
  - name: charter
    checks:
      - id: goal
        description: scope agreed
        evidence: required
  - name: build
    checks:
      - id: tests
        description: project tests
        verify: 'shell:test -f target-marker && echo output && echo diagnostic >&2'
        timeout: 1
      - id: review
        description: review result
      - id: optional
        description: optional deployment
        allow-na: true
`;
for (const flavor of ['compiled', 'bundle']) describe(`run contract: ${flavor}`, () => {
  let tmp: string, skill: string, target: string, executable: string, env: NodeJS.ProcessEnv;
  beforeEach(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-v2-')));
    skill = path.join(tmp, 'skill with spaces'); target = path.join(tmp, 'project');
    fs.mkdirSync(skill); fs.mkdirSync(target); fs.writeFileSync(path.join(target, 'target-marker'), '');
    fs.writeFileSync(path.join(skill, '.checklist.yml'), YAML);
    executable = flavor === 'compiled' ? path.join(pkg, 'dist/index.js') : path.join(tmp, 'checklist.mjs');
    if (flavor === 'bundle') fs.copyFileSync(path.join(pkg, 'bundle/checklist.mjs'), executable);
    env = { ...process.env, CHECKLIST_STATE_HOME: path.join(tmp, 'state'), CHECKLIST_HOME: path.join(tmp, 'config') };
    for (const key of ['CHECKLIST_RUN_ID', 'CHECKLIST_SESSION_ID', 'CLAUDE_SESSION_ID', 'CLAUDE_CODE_SESSION_ID', 'CHECKLIST_DIR', 'CLAUDE_SKILL_DIR']) delete env[key];
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));
  function call(args: string[], cwd = target) { return spawnSync(process.execPath, [executable, ...args], { cwd, env, encoding: 'utf8', timeout: 10_000 }); }
  function ok(args: string[], cwd = target) { const r = call(args, cwd); expect(r.stderr, r.stdout).toBe(''); expect(r.status, r.stderr).toBe(0); return r.stdout; }
  function start() { return JSON.parse(ok(['init', skill, '--new', '--json'])).id as string; }
  function show(id: string, cwd = target) { return JSON.parse(ok(['show', '--run', id, '--json'], cwd)); }
  function charter(id: string) { ok(['check', 'charter', 'goal', '--evidence', 'brief.md:1', '--run', id]); ok(['advance', 'charter', '--run', id]); }
  function completeBuild(id: string) { ok(['verify', 'build', '--run', id]); ok(['check', 'build', 'review', '--run', id]); ok(['na', 'build', 'optional', '--reason', 'no deployment in scope', '--run', id]); ok(['advance', 'build', '--run', id]); }

  it('requires explicit new/resume and never accepts destructive init --force', () => {
    expect(call(['init', skill]).status).not.toBe(0);
    expect(call(['init', skill, '--force']).stderr).toContain('removed');
    const id = start(); expect(show(id).status).toBe('active');
    expect(call(['check', 'charter', 'goal']).status).not.toBe(0);
  });
  it('keeps separate runs on the same skill/project and resumes from a different cwd', () => {
    const a = start(), b = start(); expect(a).not.toBe(b);
    ok(['check', 'charter', 'goal', '--evidence', 'decision', '--run', a]);
    expect(show(b).phases[0].checks[0].reading).toBeNull();
    ok(['resume', a], tmp);
    expect(show(a, tmp).target).toBe(target);
    expect(show(a, tmp).phases[0].checks[0].reading.status).toBe('pass');
    expect(call(['show', '--run', a, '--path', tmp]).status).not.toBe(0);
    expect(call(['show', '--run', '../escape']).status).not.toBe(0);
  });
  it('requires closure, not just confirmations; done archives and reset abandons', () => {
    const id = start();
    expect(call(['check', 'charter', 'goal', '--run', id]).status).not.toBe(0);
    ok(['check', 'charter', 'goal', '--evidence', 'brief', '--run', id]);
    expect(call(['check', 'build', 'review', '--run', id]).stderr).toContain('gate blocked');
    ok(['verify', 'charter', '--run', id]);
    expect(show(id).phases[0].closed).toBe(false);
    ok(['advance', 'charter', '--run', id]);
    expect(call(['done', '--run', id]).status).not.toBe(0);
    expect(call(['check', 'build', 'tests', '--run', id]).status).not.toBe(0);
    completeBuild(id); ok(['done', '--run', id]);
    expect(show(id).status).toBe('completed');
    expect(ok(['report', '--run', id])).toContain('brief');
    expect(call(['reset', '--run', id, '--reason', 'discard']).status).not.toBe(0);
    const abandoned = start(); ok(['reset', '--run', abandoned, '--reason', 'scope withdrawn']);
    expect(show(abandoned).status).toBe('abandoned');
  });
  it('executes against the fixed project, stores stdout/stderr/provenance, and show is read-only', () => {
    const id = start(); charter(id);
    const before = show(id);
    ok(['show', 'build', '--run', id]);
    expect(show(id).revision).toBe(before.revision);
    ok(['verify', 'build', '--run', id], tmp);
    const reading = show(id).phases[1].checks[0].reading;
    const artifact = JSON.parse(fs.readFileSync(path.join(env.CHECKLIST_STATE_HOME!, 'v2/runs', id, reading.artifact), 'utf8'));
    expect(artifact.trace.cwd).toBe(target);
    expect(artifact.trace.stdout).toContain('output'); expect(artifact.trace.stderr).toContain('diagnostic');
    expect(artifact.trace.exitCode).toBe(0); expect(artifact.trace.durationMs).toBeGreaterThanOrEqual(0);
    expect(show(id).phases[1].closed).toBe(false);
    fs.unlinkSync(path.join(target, 'target-marker'));
    expect(call(['verify', 'build', '--run', id]).status).toBe(1);
    expect(show(id).phases[1].checks[0].reading.status).toBe('fail');
  });
  it('keeps N/A distinct, disallows unauthorized or blank N/A, and supports flat lists without advance', () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: applicable\n  - id: b\n    description: conditional\n    allow-na: true\n');
    const id = start();
    expect(call(['na', 'main', 'a', '--reason', 'no', '--run', id]).status).not.toBe(0);
    expect(call(['na', 'main', 'b', '--reason', ' ', '--run', id]).status).not.toBe(0);
    ok(['check', 'main', 'a', '--run', id]); ok(['na', 'main', 'b', '--reason', 'not applicable', '--run', id]);
    ok(['done', '--run', id]); expect(show(id).phases[0].checks[1].reading.status).toBe('na');
  });
  it('invalidates definition changes and preserves previous evidence across refresh', () => {
    const id = start(); charter(id); completeBuild(id);
    fs.appendFileSync(path.join(skill, '.checklist.yml'), '\n# changed definition\n');
    expect(show(id).definitionChanged).toBe(true);
    expect(call(['done', '--run', id]).stderr).toContain('changed');
    ok(['resume', id, '--refresh']);
    expect(show(id).phases[0].checks[0].reading.status).toBe('stale');
    expect(show(id).phases[0].closed).toBe(false);
    expect(ok(['report', '--run', id])).toContain('brief.md:1');
  });
  it('freezes command bindings, then invalidates results when a binding is explicitly changed', () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: sensor\n    verify: "shell:${TEST_CMD}"\n');
    env.TEST_CMD = 'echo frozen'; const id = start(); env.TEST_CMD = 'exit 1';
    ok(['verify', 'main', '--run', id]); expect(show(id).phases[0].checks[0].reading.message).toBe('frozen');
    ok(['resume', id, '--var', 'TEST_CMD=exit 1']);
    expect(show(id).phases[0].checks[0].reading.status).toBe('stale');
    expect(call(['verify', 'main', '--run', id]).status).toBe(1);
  });
  it('honors short sensor timeouts, distinguishes execution errors, and never accepts empty bindings', () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: timeout\n    verify: "shell:${TEST_CMD}"\n    timeout: 0.05\n');
    const id = JSON.parse(ok(['init', skill, '--new', '--var', 'TEST_CMD=sleep 5', '--json'])).id;
    expect(call(['verify', 'main', '--run', id]).status).toBe(1);
    expect(show(id).phases[0].checks[0].reading.status).toBe('error');
    ok(['resume', id, '--var', 'TEST_CMD=']);
    expect(call(['verify', 'main', '--run', id]).status).toBe(1);
    expect(show(id).phases[0].checks[0].reading.message).toContain('empty');
  });
  it('retains an interrupted sensor as stale and recovers only after the owner exits', async () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: sensor\n    verify: "shell:touch started; while [ ! -f release ]; do sleep 0.02; done"\n    timeout: 3\n');
    const id = start();
    const child = spawn(process.execPath, [executable, 'verify', 'main', '--run', id], { cwd: target, env, stdio: 'ignore' });
    const exited = new Promise<number | null>((resolve, reject) => { child.on('exit', resolve); child.on('error', reject); });
    try {
      await new Promise<void>((resolve, reject) => {
        const watcher = fs.watch(target, () => { if (fs.existsSync(path.join(target, 'started'))) { clearTimeout(timer); watcher.close(); resolve(); } });
        const timer = setTimeout(() => { watcher.close(); reject(new Error('sensor did not start')); }, 2000);
        if (fs.existsSync(path.join(target, 'started'))) { clearTimeout(timer); watcher.close(); resolve(); }
      });
      child.kill('SIGTERM'); expect(await exited).toBe(143);
      expect(show(id).phases[0].checks[0].reading.status).toBe('stale');
      expect(call(['done', '--run', id]).stderr).toContain('busy');
      ok(['unlock', '--run', id]);
      expect(call(['done', '--run', id]).status).not.toBe(0);
      fs.writeFileSync(path.join(target, 'release'), ''); ok(['verify', 'main', '--run', id]); ok(['done', '--run', id]);
    } finally { if (child.exitCode === null) child.kill('SIGTERM'); await exited; }
  });

  it('protects the complete same-run transaction from another process', async () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: slow sensor\n    verify: "shell:touch started; while [ ! -f release ]; do sleep 0.02; done"\n    timeout: 3\n');
    const id = start();
    const child = spawn(process.execPath, [executable, 'verify', 'main', '--run', id], { cwd: target, env, stdio: 'ignore' });
    const exited = new Promise<number | null>((resolve, reject) => { child.on('exit', resolve); child.on('error', reject); });
    try {
      await new Promise<void>((resolve, reject) => {
        const watcher = fs.watch(target, () => { if (fs.existsSync(path.join(target, 'started'))) { clearTimeout(timer); watcher.close(); resolve(); } });
        const timer = setTimeout(() => { watcher.close(); reject(new Error('sensor did not start')); }, 2000);
        if (fs.existsSync(path.join(target, 'started'))) { clearTimeout(timer); watcher.close(); resolve(); }
      });
      expect(call(['reset', '--run', id, '--reason', 'concurrent reset']).stderr).toContain('busy');
      expect(call(['unlock', '--run', id]).stderr).toContain('alive');
      fs.writeFileSync(path.join(target, 'release'), '');
      expect(await exited).toBe(0);
      expect(show(id).phases[0].checks[0].reading.status).toBe('pass');
    } finally { fs.writeFileSync(path.join(target, 'release'), ''); await exited; }
  });
});

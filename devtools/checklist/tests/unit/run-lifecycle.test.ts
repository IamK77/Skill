import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createRun, hash, loadDefinition, readRun, runDir, selectRun, unlockRun, withRun } from '../../src/runs.js';
import { parseVars } from '../../src/variables.js';
import { advance, captureVars, confirm, finish, inspect, requiredVars, resume, verify } from '../../src/workflow.js';
import { loadChecklist } from '../../src/loader.js';
import { runCheck } from '../../src/runner.js';
import type { SensorTrace } from '../../src/types.js';

let tmp: string, skill: string, project: string;
beforeEach(() => {
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-')));
  skill = path.join(tmp, 'skill'); project = path.join(tmp, 'project'); fs.mkdirSync(skill); fs.mkdirSync(project);
  fs.writeFileSync(path.join(skill, '.checklist.yml'), 'phases:\n  - name: first\n    checks:\n      - id: sensor\n        description: sensor\n        verify: "shell:test -f marker"\n  - name: second\n    checks:\n      - id: decision\n        description: decision\n        evidence: required\n');
  fs.writeFileSync(path.join(project, 'marker'), '');
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));
const start = () => createRun(skill, project, {});

describe('run invariants beyond the entrypoint matrix', () => {
  it('requires a reason for abandonment at the domain boundary too', async () => {
    const run = start();
    await expect(finish(run.id, true, ' ')).rejects.toThrow('reason');
    expect(readRun(run.id).status).toBe('active');
    await finish(run.id, true, 'scope withdrawn');
    expect(readRun(run.id).status).toBe('abandoned');
  });
  it('snapshots and hashes the same definition bytes', () => {
    const definition = loadDefinition(skill);
    expect(definition.hash).toBe(hash(fs.readFileSync(path.join(skill, '.checklist.yml'), 'utf8')));
    const run = start();
    expect(run.config).toEqual(definition.config); expect(run.definitionHash).toBe(definition.hash);
  });
  it('requires explicit predecessor closure even after every predecessor reading passes', async () => {
    const run = start(); await verify(run.id, 'first');
    await expect(confirm(run.id, 'second', 'decision', 'artifact')).rejects.toThrow('gate blocked');
    await advance(run.id, 'first'); await confirm(run.id, 'second', 'decision', 'artifact');
  });
  it('stores prototype-like variable names as ordinary own properties', () => {
    const vars = parseVars(['__proto__=literal', 'constructor=value']);
    expect(Object.hasOwn(vars, '__proto__')).toBe(true);
    expect(vars.__proto__).toBe('literal'); expect(vars.constructor).toBe('value');
    expect(Object.getPrototypeOf(vars)).toBe(Object.prototype);
    expect(() => parseVars(['__proto__=a', '__proto__=b'])).toThrow('duplicate');
  });
  it('never picks the most recent run when a session is ambiguous', () => {
    const a = createRun(skill, project, {}, 'session');
    expect(selectRun(undefined, 'session')).toBe(a.id);
    const b = createRun(skill, project, {}, 'session');
    expect(() => selectRun(undefined, 'session')).toThrow('2 active runs');
    expect(selectRun(b.id, 'session')).toBe(b.id);
  });
  it('revokes downstream closures and readings after upstream verification regresses', async () => {
    const r = start(); await verify(r.id, 'first'); await advance(r.id, 'first');
    await confirm(r.id, 'second', 'decision', 'artifact'); await advance(r.id, 'second');
    fs.unlinkSync(path.join(project, 'marker'));
    expect((await verify(r.id, 'first')).failed).toBe(true);
    const state = readRun(r.id);
    expect(state.closed).toEqual([]); expect(state.checked.second.decision.status).toBe('stale');
    expect(state.checked.second.decision.evidence).toBe('artifact');
    fs.writeFileSync(path.join(project, 'marker'), ''); await verify(r.id, 'first'); await advance(r.id, 'first');
    await expect(advance(r.id, 'second')).rejects.toThrow('incomplete');
    await expect(finish(r.id)).rejects.toThrow('cannot complete');
  });
  it('does not keep a pass when output artifact storage fails', async () => {
    const r = start(); await verify(r.id, 'first');
    const outputs = path.join(runDir(r.id), 'outputs');
    fs.renameSync(outputs, outputs + '-saved'); fs.writeFileSync(outputs, 'not a directory');
    await expect(verify(r.id, 'first')).rejects.toThrow();
    expect(readRun(r.id).checked.first.sensor.status).toBe('stale');
    await expect(advance(r.id, 'first')).rejects.toThrow('incomplete');
    expect(fs.existsSync(path.join(runDir(r.id), 'lock'))).toBe(false);
  });
  it('serializes same-run writers but not independent runs, and releases locks after failure', async () => {
    const a = start(), b = start();
    await withRun(a.id, async () => {
      await expect(confirm(a.id, 'second', 'decision', 'x')).rejects.toThrow('busy');
      await verify(b.id, 'first');
    });
    await expect(withRun(a.id, () => { throw new Error('deliberate'); })).rejects.toThrow('deliberate');
    await verify(a.id, 'first');
  });
  it('refuses live-owner and ownerless locks without deleting them', () => {
    const r = start(); const lock = path.join(runDir(r.id), 'lock'); fs.mkdirSync(lock);
    expect(() => unlockRun(r.id)).toThrow(); expect(fs.existsSync(lock)).toBe(true);
    fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, token: 'owner' }));
    expect(() => unlockRun(r.id)).toThrow('alive'); expect(fs.existsSync(lock)).toBe(true);
  });
  it('shows changed rules as stale without mutating state, even before a write detects them', async () => {
    const r = start(); await verify(r.id, 'first');
    const before = fs.readFileSync(path.join(runDir(r.id), 'run.json'), 'utf8');
    fs.appendFileSync(path.join(skill, '.checklist.yml'), '\n# new revision\n');
    const view = inspect(r.id);
    expect(view.definitionChanged).toBe(true); expect(view.phases[0].checks[0].reading?.status).toBe('stale');
    expect(fs.readFileSync(path.join(runDir(r.id), 'run.json'), 'utf8')).toBe(before);
  });
  it('archives a snapshot that remains readable without the source checklist', async () => {
    const r = start(); await verify(r.id, 'first'); await advance(r.id, 'first');
    await confirm(r.id, 'second', 'decision', 'file:1'); await advance(r.id, 'second'); await finish(r.id);
    fs.unlinkSync(path.join(skill, '.checklist.yml'));
    expect(inspect(r.id).status).toBe('completed'); expect(inspect(r.id).definitionChanged).toBe(false);
    await expect(resume(r.id, false, {})).rejects.toThrow('completed');
  });
  it('does not recapture a previously missing variable at verification time', async () => {
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: a\n    verify: "shell:${UNBOUND_WORKFLOW_TEST}"\n');
    delete process.env.UNBOUND_WORKFLOW_TEST;
    const r = createRun(skill, project, captureVars(loadChecklist(skill), {}));
    process.env.UNBOUND_WORKFLOW_TEST = 'echo should-not-run';
    try {
      expect((await verify(r.id, 'main')).failed).toBe(true);
      expect(readRun(r.id).checked.main.a.message).toContain('unbound');
    } finally { delete process.env.UNBOUND_WORKFLOW_TEST; }
  });
  it('captures only unescaped placeholders and expands bindings exactly once', async () => {
    expect(requiredVars('shell:$${HOME} ${CMD} $$$${ESCAPED}')).toEqual(['CMD']);
    fs.writeFileSync(path.join(skill, '.checklist.yml'), 'checks:\n  - id: a\n    description: a\n    verify: "shell:${CMD}"\n');
    // The nested dollars belong to bash, not another checklist interpolation pass.
    const r = createRun(skill, project, { CMD: "printf '%s' '${NOT_A_BINDING}'" });
    expect((await verify(r.id, 'main')).failed).toBe(false);
    expect(readRun(r.id).checked.main.a.message).toBe('${NOT_A_BINDING}');
  });
  it('preserves multi-byte stdout across chunks and bounds output bytes, not characters', async () => {
    let trace: SensorTrace | undefined;
    const script = path.join(skill, 'utf8.sh');
    // Node emits >1 MiB but <1 Mi UTF-16 code units. This catches a character-count cap.
    fs.writeFileSync(script, `"${process.execPath}" -e 'process.stdout.write("界".repeat(400000))'`);
    const result = await runCheck({ id: 'utf8', description: 'utf8', verify: 'script:utf8.sh' }, skill, project, {}, t => { trace = t; });
    expect(result.result?.status).toBe('error'); expect(trace?.truncated).toBe(true);
    expect(Buffer.byteLength(trace!.stdout, 'utf8')).toBeLessThanOrEqual(1024 * 1024 + 2); // a cut final codepoint decodes to replacement
  });
});

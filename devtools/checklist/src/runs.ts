import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { stateHomeDir } from './state.js';
import type { ChecklistConfig } from './types.js';
import { parseChecklist } from './loader.js';
import { captureVars } from './variables.js';

export interface Reading {
  status: 'pass' | 'fail' | 'error' | 'na' | 'stale';
  message: string;
  evidence?: string;
  recordedAt: string;
  source: 'confirmation' | 'sensor' | 'na';
  artifact?: string;
}
export interface RunEvent {
  at: string;
  action: string;
  phase?: string;
  item?: string;
  detail: string;
}
export interface Run {
  schema: 2;
  id: string;
  skill: string;
  target: string;
  session?: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  revision: number;
  definitionHash: string;
  config: ChecklistConfig;
  vars: Record<string, string>;
  checked: Record<string, Record<string, Reading>>;
  closed: string[];
  events: RunEvent[];
}
export function hash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
export function loadDefinition(skill: string): { config: ChecklistConfig; hash: string } {
  const raw = fs.readFileSync(path.join(skill, '.checklist.yml'), 'utf8');
  return { config: parseChecklist(raw), hash: hash(raw) };
}
export function definitionHash(skill: string): string {
  return hash(fs.readFileSync(path.join(skill, '.checklist.yml'), 'utf8'));
}
export function sessionId(explicit?: string): string | undefined {
  return explicit || process.env.CHECKLIST_SESSION_ID || process.env.CLAUDE_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || undefined;
}
export function runsDir(): string { return path.join(stateHomeDir(), 'v2', 'runs'); }
export function runDir(id: string): string {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)) throw new Error('invalid run ID');
  return path.join(runsDir(), id);
}
export function readRun(id: string): Run {
  const data = JSON.parse(fs.readFileSync(path.join(runDir(id), 'run.json'), 'utf8')) as Run;
  if (data.schema !== 2 || data.id !== id || !Array.isArray(data.events) || !data.checked || !data.config?.phases || !['active', 'completed', 'abandoned'].includes(data.status)) {
    throw new Error(`malformed run ${id}; preserve the file for recovery, do not reset it blindly`);
  }
  return data;
}
// State and history form one atomic record; a successful write cannot lose its event.
export function saveRun(run: Run): void {
  const dir = runDir(run.id);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tmp = path.join(dir, `.run-${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(run, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(tmp, path.join(dir, 'run.json'));
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
export function event(run: Run, action: string, detail: string, phase?: string, item?: string): void {
  const at = new Date().toISOString();
  run.events.push({ at, action, detail, ...(phase ? { phase } : {}), ...(item ? { item } : {}) });
  run.updatedAt = at;
  run.revision++;
}
export function listRuns(): Run[] {
  if (!fs.existsSync(runsDir())) return [];
  return fs.readdirSync(runsDir()).filter(id => /^[a-f0-9-]{36}$/.test(id)).map(readRun);
}
export function selectRun(id?: string, session?: string): string {
  const explicit = id || process.env.CHECKLIST_RUN_ID;
  if (explicit) { readRun(explicit); return explicit; }
  const sid = sessionId(session);
  if (!sid) throw new Error('select a run explicitly with --run <id> (or CHECKLIST_RUN_ID); use checklist runs to list runs');
  const candidates = listRuns().filter(r => r.status === 'active' && r.session === sid);
  if (candidates.length !== 1) throw new Error(`${candidates.length} active runs in this session; select --run <id>, never the most recent by guess`);
  return candidates[0].id;
}
// A run-level exclusive lock covers checking prerequisites, executing sensors and
// committing results. Different runs remain independent. Contention fails visibly
// rather than queueing an agent indefinitely. No time-based lock stealing.
export async function withRun<T>(id: string, fn: (run: Run) => T | Promise<T>): Promise<T> {
  const lock = path.join(runDir(id), 'lock');
  const token = randomUUID();
  try { fs.mkdirSync(lock, { mode: 0o700 }); }
  catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`run ${id} is busy; retry after the running command, or use unlock after its process has exited`);
    throw e;
  }
  try {
    fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, token }), { mode: 0o600 });
    return await fn(readRun(id));
  } finally {
    const owner = JSON.parse(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'));
    if (owner.token === token) {
      fs.unlinkSync(path.join(lock, 'owner.json'));
      fs.rmdirSync(lock);
    }
  }
}
export function unlockRun(id: string): void {
  readRun(id);
  const lock = path.join(runDir(id), 'lock');
  // Serialize recoverers. While the dead owner's lock exists, ordinary writers
  // cannot acquire it. After rmdir we never touch that lock path again.
  const recovery = path.join(runDir(id), 'recovery');
  fs.mkdirSync(recovery, { mode: 0o700 });
  try {
    const owner = JSON.parse(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'));
    if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0 || typeof owner.token !== 'string') throw new Error('malformed lock owner; manual recovery required');
    try { process.kill(owner.pid, 0); }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw new Error('cannot establish whether the lock owner exited; refusing unlock');
      fs.unlinkSync(path.join(lock, 'owner.json'));
      fs.rmdirSync(lock);
      return;
    }
    throw new Error(`lock owner ${owner.pid} is still alive; refusing unlock`);
  } finally { fs.rmdirSync(recovery); }
}
export function createRun(skillDir: string, targetPath: string, vars: Record<string, string>, session?: string): Run {
  const skill = fs.realpathSync(skillDir);
  const target = fs.realpathSync(targetPath);
  if (!fs.statSync(target).isDirectory()) throw new Error('target must be a project directory');
  const definition = loadDefinition(skill);
  const at = new Date().toISOString();
  const run: Run = {
    schema: 2, id: randomUUID(), skill, target, session: sessionId(session),
    status: 'active', createdAt: at, updatedAt: at, revision: 0,
    definitionHash: definition.hash, config: definition.config, vars: captureVars(definition.config, vars), checked: {}, closed: [], events: [],
  };
  event(run, 'start', `target: ${target}`);
  saveRun(run);
  return run;
}
export function invalidate(run: Run, reason: string): void {
  for (const items of Object.values(run.checked)) {
    for (const reading of Object.values(items)) reading.status = 'stale';
  }
  run.closed = [];
  event(run, 'invalidate', reason);
  saveRun(run);
}
export function assertActive(run: Run): void {
  if (run.status !== 'active') throw new Error(`run is ${run.status}; start a new run instead of rewriting its history`);
}
export function assertDefinition(run: Run): void {
  if (definitionHash(run.skill) !== run.definitionHash) {
    invalidate(run, 'checklist definition changed; resume --refresh to accept it and recheck');
    throw new Error('checklist definition changed; results are stale. Use resume <id> --refresh');
  }
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { findPhaseIndex } from './resolver.js';
import { interpolate, runCheck } from './runner.js';
import type { CheckItem, SensorTrace } from './types.js';
import { assertActive, assertDefinition, definitionHash, loadDefinition, event, invalidate, readRun, runDir, saveRun, withRun, type Reading, type Run } from './runs.js';

import { requiredVars } from './variables.js';
export { requiredVars, captureVars } from './variables.js';
function ruleFor(run: Run, item: CheckItem): CheckItem {
  if (item.verify === undefined) return item;
  for (const name of requiredVars(item.verify)) {
    if (!Object.hasOwn(run.vars, name)) throw new Error(`unbound variable ${name}; use resume ${run.id} --var '${name}=...' (invalidates old readings)`);
  }
  // Freeze interpolation exactly once. Escape dollars before the legacy runner's
  // interpolation pass so shell expansions remain shell expansions, not bindings.
  const expanded = interpolate(item.verify, run.vars);
  return { ...item, verify: expanded.replace(/\$/g, '$$$$') };
}
function phaseIndex(run: Run, name: string): number { return findPhaseIndex(run.config, name); }
function phaseKey(run: Run, index: number): string { return run.config.phases[index].name.toLowerCase(); }
function requirePrior(run: Run, index: number): void {
  for (let i = 0; i < index; i++) {
    if (!run.closed.includes(phaseKey(run, i)) || missing(run, i).length) throw new Error(`gate blocked: ${run.config.phases[i].name} is not closed; use advance after fulfilling its checks`);
  }
}
function fulfilled(item: CheckItem, reading?: Reading): boolean {
  return reading?.status === 'pass' || (item.allowNa === true && reading?.status === 'na' && !!reading.message.trim());
}
function missing(run: Run, index: number): string[] {
  const p = run.config.phases[index];
  return p.checks.filter(item => !fulfilled(item, run.checked[p.name.toLowerCase()]?.[item.id])).map(item => item.id);
}
function reopen(run: Run, index: number): void {
  const affected = new Set(run.config.phases.slice(index).map(p => p.name.toLowerCase()));
  run.closed = run.closed.filter(key => !affected.has(key));
  // Later results relied on a now-revised earlier stage. Keep their evidence but
  // don't silently reuse it when that stage subsequently goes green again.
  for (const phase of run.config.phases.slice(index + 1)) {
    for (const reading of Object.values(run.checked[phase.name.toLowerCase()] || {})) reading.status = 'stale';
  }
}
function record(run: Run, index: number, id: string, reading: Reading): void {
  const key = phaseKey(run, index);
  if (!Object.hasOwn(run.checked, key)) Object.defineProperty(run.checked, key, { value: {}, enumerable: true, writable: true, configurable: true });
  Object.defineProperty(run.checked[key], id, { value: reading, enumerable: true, writable: true, configurable: true });
}
export async function confirm(id: string, phase: string, itemId: string, evidence?: string, naReason?: string): Promise<Run> {
  return withRun(id, run => {
    assertActive(run); assertDefinition(run);
    const index = phaseIndex(run, phase); requirePrior(run, index);
    const item = run.config.phases[index].checks.find(c => c.id === itemId);
    if (!item) throw new Error(`item not found: ${itemId}`);
    const isNa = naReason !== undefined;
    if (isNa && (!item.allowNa || !naReason.trim())) throw new Error('N/A requires allow-na: true and a nonblank reason');
    if (!isNa && item.verify !== undefined) throw new Error('mechanical checks require verify, not manual confirmation');
    if (!isNa && item.evidenceRequired && !evidence?.trim()) throw new Error('this confirmation requires --evidence');
    reopen(run, index);
    record(run, index, itemId, { status: isNa ? 'na' : 'pass', source: isNa ? 'na' : 'confirmation', message: isNa ? naReason!.trim() : 'confirmed (not independently verified)', recordedAt: new Date().toISOString(), ...(evidence?.trim() ? { evidence: evidence.trim() } : {}) });
    event(run, isNa ? 'na' : 'check', isNa ? naReason!.trim() : evidence?.trim() || 'confirmation without independent verification', phase, itemId);
    saveRun(run); return run;
  });
}
export async function verify(id: string, phase: string): Promise<{ run: Run; failed: boolean }> {
  return withRun(id, async run => {
    assertActive(run); assertDefinition(run);
    const index = phaseIndex(run, phase); requirePrior(run, index);
    const items = run.config.phases[index].checks.filter(c => c.verify !== undefined && run.checked[phaseKey(run, index)]?.[c.id]?.status !== 'na');
    if (!items.length) return { run, failed: false };
    reopen(run, index);
    // Persist invalidation BEFORE executing: a killed CLI must never leave an old
    // pass in place for a verification attempt that didn't finish.
    for (const item of items) record(run, index, item.id, { status: 'stale', source: 'sensor', message: 'verification started; no completed reading yet', recordedAt: new Date().toISOString() });
    event(run, 'verify-start', `${items.length} sensor(s)`, phase); saveRun(run);
    let failed = false;
    for (const item of items) {
      const startedAt = new Date().toISOString();
      const start = performance.now();
      let trace: SensorTrace | undefined;
      let result: { status: 'pass' | 'fail' | 'error'; message: string };
      try {
        result = (await runCheck(ruleFor(run, item), run.skill, run.target, {}, t => { trace = t; })).result!;
      } catch (e) { result = { status: 'error', message: String((e as Error).message || e) }; }
      // If someone edited the rules while the sensor ran, never publish its pass
      // under the new rules; previously persisted readings remain stale.
      assertDefinition(run);
      const artifact = `outputs/${randomUUID()}.json`;
      fs.mkdirSync(path.join(runDir(id), 'outputs'), { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(runDir(id), artifact), JSON.stringify({ runId: id, target: run.target, phase, item: item.id, definitionHash: run.definitionHash, rule: item.verify, result, trace: trace || { cwd: run.target, startedAt, durationMs: Math.round(performance.now() - start), executed: false } }, null, 2) + '\n', { mode: 0o600 });
      record(run, index, item.id, { ...result, source: 'sensor', recordedAt: new Date().toISOString(), artifact });
      event(run, 'verify', `${result.status}: ${result.message}`, phase, item.id);
      saveRun(run);
      if (result.status !== 'pass') failed = true;
    }
    return { run, failed };
  });
}
export async function advance(id: string, phase?: string): Promise<Run> {
  return withRun(id, run => {
    assertActive(run); assertDefinition(run);
    const index = phase ? phaseIndex(run, phase) : run.config.phases.findIndex((_, i) => !run.closed.includes(phaseKey(run, i)));
    if (index < 0) throw new Error('all phases are closed; use done to complete the run');
    requirePrior(run, index);
    const pending = missing(run, index);
    if (pending.length) throw new Error(`phase incomplete: ${pending.join(', ')}`);
    const key = phaseKey(run, index);
    if (!run.closed.includes(key)) {
      run.closed.push(key); event(run, 'advance', 'phase closed', run.config.phases[index].name); saveRun(run);
    }
    return run;
  });
}
export async function finish(id: string, abandon = false, reason?: string): Promise<Run> {
  return withRun(id, run => {
    assertActive(run);
    if (abandon && !reason?.trim()) throw new Error('abandonment requires a nonblank reason');
    if (!abandon) {
      assertDefinition(run);
      for (let i = 0; i < run.config.phases.length; i++) {
        if (missing(run, i).length || (!run.config.flat && !run.closed.includes(phaseKey(run, i)))) throw new Error(`cannot complete: ${run.config.phases[i].name} is not fulfilled and closed`);
      }
    }
    run.status = abandon ? 'abandoned' : 'completed';
    event(run, abandon ? 'reset' : 'done', reason?.trim() || run.status); saveRun(run); return run;
  });
}
export async function resume(id: string, refresh: boolean, vars: Record<string, string>): Promise<Run> {
  return withRun(id, run => {
    assertActive(run);
    if (refresh) {
      const definition = loadDefinition(run.skill);
      invalidate(run, 'explicit definition refresh');
      run.config = definition.config; run.definitionHash = definition.hash;
    } else assertDefinition(run);
    if (Object.keys(vars).length) {
      const next = { ...run.vars, ...vars };
      if (JSON.stringify(next) !== JSON.stringify(run.vars)) { invalidate(run, 'run variables changed'); run.vars = next; }
    }
    event(run, 'resume', refresh ? 'definition refreshed; recheck required' : 'existing run retained'); saveRun(run); return run;
  });
}
export function inspect(id: string) {
  const run = readRun(id);
  let definitionChanged = false, definitionError: string | undefined;
  if (run.status === 'active') {
    try { definitionChanged = definitionHash(run.skill) !== run.definitionHash; }
    catch (e) { definitionChanged = true; definitionError = (e as Error).message; }
  }
  const phases = run.config.phases.map((p, i) => ({
    name: p.name, closed: !definitionChanged && run.closed.includes(p.name.toLowerCase()),
    missing: definitionChanged ? p.checks.map(c => c.id) : missing(run, i),
    checks: p.checks.map(item => {
      const recorded = run.checked[p.name.toLowerCase()]?.[item.id];
      const reading = recorded && definitionChanged ? { ...recorded, recordedStatus: recorded.status, status: 'stale' as const } : recorded || null;
      return { id: item.id, description: item.description, kind: item.verify === undefined ? 'manual' : 'mechanical', allowNa: !!item.allowNa, reading };
    }),
  }));
  const current = phases.find(p => !p.closed);
  return { id: run.id, skill: run.skill, target: run.target, status: run.status, revision: run.revision, definitionChanged, definitionError, phases, next: run.status !== 'active' ? null : definitionChanged ? `resume ${id} --refresh` : current ? current.missing.length ? `fulfill ${current.name}: ${current.missing.join(', ')}` : run.config.flat ? 'done' : `advance ${current.name}` : 'done', events: run.events };
}

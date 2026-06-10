import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CheckResult } from './types.js';

const STATE_FILE = '.checklist.state.json';

export interface ChecklistState {
  checked: Record<string, Record<string, CheckResult>>;
}

function statePath(dir: string): string {
  return path.resolve(dir, STATE_FILE);
}

export function loadState(dir: string): ChecklistState {
  const p = statePath(dir);
  if (!fs.existsSync(p)) {
    return { checked: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    throw new Error(`state file is corrupt: ${p}. run \`checklist init --force\` to reset it`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`state file is malformed: ${p}. run \`checklist init --force\` to reset it`);
  }
  // `typeof null === 'object'` and `typeof [] === 'object'`, so a corrupt or
  // partially-written file shaped like {"checked":null} or {"checked":[]} would
  // slip past a bare typeof guard and then crash gate evaluation downstream with
  // an unhandled TypeError. Reject any non-plain-object `checked` here instead,
  // so the corruption surfaces as the documented malformed-state error.
  const checked = (parsed as { checked?: unknown }).checked;
  if (typeof checked !== 'object' || checked === null || Array.isArray(checked)) {
    throw new Error(`state file is malformed: ${p}. run \`checklist init --force\` to reset it`);
  }
  return parsed as ChecklistState;
}

// Replace the state file with exactly `state`. The write is atomic: the JSON
// is written to a temp file in the SAME directory and renamed over the target,
// so a reader never observes a truncated/half-written file and a crash mid-write
// leaves the previous state intact (renameSync is atomic only within one
// filesystem, hence same-dir temp).
export function saveState(dir: string, state: ChecklistState): void {
  const p = statePath(dir);
  const tmp = `${p}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  try {
    fs.renameSync(tmp, p);
  } catch (e) {
    try {
      fs.unlinkSync(tmp); // best-effort: don't litter the skill dir on failure
    } catch {
      /* ignore */
    }
    throw e;
  }
}

// Read-merge-write for the load-modify-save flows (check/verify). Between OUR
// load and OUR save another invocation may have recorded results; blindly
// writing back the whole in-memory copy would clobber them with our stale
// snapshot (lost update) — and a clobbered fail/error would resurrect a stale
// pass for the gate. So re-read the file at save time and overlay ONLY the
// records this run actually produced (`updates` must be the delta, NOT the
// loaded state): everything on disk survives unless WE re-recorded that same
// item, in which case our current result wins. Returns the merged state that
// was written.
export function mergeAndSaveState(dir: string, updates: ChecklistState): ChecklistState {
  let onDisk: ChecklistState;
  try {
    onDisk = loadState(dir);
  } catch {
    // The file went corrupt/malformed since our load: there is nothing valid to
    // merge with, so degrade to a plain (atomic) replace with our records.
    onDisk = { checked: {} };
  }
  const merged: ChecklistState = { ...onDisk, ...updates, checked: {} };
  for (const [phase, items] of Object.entries(onDisk.checked)) {
    merged.checked[phase] = { ...items };
  }
  for (const [phase, items] of Object.entries(updates.checked)) {
    merged.checked[phase] = { ...merged.checked[phase], ...items };
  }
  saveState(dir, merged);
  return merged;
}

export function clearState(dir: string): void {
  const p = statePath(dir);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}

export function isItemChecked(state: ChecklistState, phaseIndex: number, itemId: string): boolean {
  // An item counts as checked only when its recorded result is a PASS — not
  // merely present. A stored fail/error, or a once-green check that later
  // regressed and was re-recorded, must NOT satisfy the gate. The gate is the
  // safety floor: completeness means current pass-status, not existence of a row.
  return state.checked[String(phaseIndex)]?.[itemId]?.status === 'pass';
}

export function getItemResult(state: ChecklistState, phaseIndex: number, itemId: string): CheckResult | undefined {
  return state.checked[String(phaseIndex)]?.[itemId];
}

export function setItemResult(state: ChecklistState, phaseIndex: number, itemId: string, result: CheckResult): void {
  const key = String(phaseIndex);
  if (!state.checked[key]) {
    state.checked[key] = {};
  }
  state.checked[key][itemId] = result;
}

export function isPhaseComplete(state: ChecklistState, phaseIndex: number, itemIds: string[]): boolean {
  return itemIds.every(id => isItemChecked(state, phaseIndex, id));
}

export function phaseProgress(state: ChecklistState, phaseIndex: number, itemIds: string[]): { done: number; total: number } {
  const done = itemIds.filter(id => isItemChecked(state, phaseIndex, id)).length;
  return { done, total: itemIds.length };
}

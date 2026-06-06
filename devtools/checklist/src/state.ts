import * as fs from 'node:fs';
import * as path from 'node:path';
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
  if (!parsed || typeof parsed !== 'object' || typeof (parsed as ChecklistState).checked !== 'object') {
    throw new Error(`state file is malformed: ${p}. run \`checklist init --force\` to reset it`);
  }
  return parsed as ChecklistState;
}

export function saveState(dir: string, state: ChecklistState): void {
  fs.writeFileSync(statePath(dir), JSON.stringify(state, null, 2), 'utf-8');
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

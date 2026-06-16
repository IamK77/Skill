import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { CheckResult } from './types.js';

// State is no longer written INTO the skill directory. The skill dir is treated
// as READ-ONLY (under a plugin install it is a package-managed directory whose
// fate on update is uncertain, and writing there couples per-run results to a
// directory that may be shared or replaced). Instead, each (skill, target) pair
// gets its OWN state file under an XDG state directory, so:
//   - the skill dir is never written to (clean / read-only-safe),
//   - two concurrent runs of the SAME skill against DIFFERENT targets keep
//     independent state and cannot stomp each other,
//   - results are keyed by phase NAME (not numeric index), so reordering phases
//     in the .checklist.yml never mis-attaches an old pass to the wrong check.
//
// Legacy in-skill-dir `.checklist.state.json` files (the old location) are
// detected and IGNORED — never read, written, or deleted by the normal flow —
// see findLegacyStateFile and the migration note in the README.

const STATE_FILE = '.checklist.state.json';

export interface ChecklistState {
  // keyed by phase NAME (case-folded), then by check id.
  checked: Record<string, Record<string, CheckResult>>;
}

// Resolve the XDG state directory for checklist. Precedence:
//   1. CHECKLIST_STATE_HOME (explicit override; used to sandbox tests)
//   2. $XDG_STATE_HOME/checklist
//   3. ~/.local/state/checklist  (the XDG default)
export function stateHomeDir(): string {
  if (process.env.CHECKLIST_STATE_HOME) {
    return process.env.CHECKLIST_STATE_HOME;
  }
  if (process.env.XDG_STATE_HOME) {
    return path.join(process.env.XDG_STATE_HOME, 'checklist');
  }
  return path.join(os.homedir(), '.local', 'state', 'checklist');
}

// A filesystem-safe, collision-resistant file name for a (skill, target) pair.
// Both are resolved to absolute paths first so two references to the same dir
// (e.g. with/without a trailing slash, or relative vs absolute) land on ONE
// file. The name carries a readable prefix (skill basename) purely for human
// debuggability; the sha256 of the resolved (skill\0target) tuple is what makes
// it unique and stable. Different targets => different hash => different file,
// which is what keeps two concurrent runs of the same skill from stomping.
export function stateKey(skillDir: string, targetPath: string): string {
  const skill = path.resolve(skillDir);
  const target = path.resolve(targetPath);
  const hash = createHash('sha256').update(`${skill}\0${target}`).digest('hex').slice(0, 16);
  const base = path.basename(skill) || 'skill';
  const safeBase = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40);
  return `${safeBase}.${hash}.json`;
}

// Absolute path to the state file for a (skill, target) pair, under the XDG
// state dir. This is the ONLY place state is read from or written to in the
// new model — never inside skillDir.
export function stateFilePath(skillDir: string, targetPath: string): string {
  return path.join(stateHomeDir(), stateKey(skillDir, targetPath));
}

// The run journal's BASE dir, under the XDG state home — NEVER inside skillDir,
// which is read-only under a plugin install (a package-managed cache whose fate on
// update is uncertain). Keyed by the SKILL dir only (not the target), so one skill
// keeps a single append-only gate-trail across the projects it reviews and `report`
// needs only the skill dir. journalPathFor/readJournal add the `runs/` subdir.
export function journalDir(skillDir: string): string {
  const skill = path.resolve(skillDir);
  const hash = createHash('sha256').update(skill).digest('hex').slice(0, 16);
  const base = path.basename(skill) || 'skill';
  const safeBase = base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40);
  return path.join(stateHomeDir(), `${safeBase}.${hash}.journal`);
}

// The legacy state location: `.checklist.state.json` INSIDE the skill dir.
export function legacyStateFilePath(skillDir: string): string {
  return path.resolve(skillDir, STATE_FILE);
}

// Returns the legacy in-skill-dir state file path if one exists, else undefined.
// Used to surface a one-line migration hint; the new flow never reads, writes,
// or deletes it.
export function findLegacyStateFile(skillDir: string): string | undefined {
  const p = legacyStateFilePath(skillDir);
  return fs.existsSync(p) ? p : undefined;
}

export function loadState(stateFile: string): ChecklistState {
  if (!fs.existsSync(stateFile)) {
    return { checked: {} };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  } catch {
    throw new Error(`state file is corrupt: ${stateFile}. run \`checklist init --force\` to reset it`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`state file is malformed: ${stateFile}. run \`checklist init --force\` to reset it`);
  }
  // `typeof null === 'object'` and `typeof [] === 'object'`, so a corrupt or
  // partially-written file shaped like {"checked":null} or {"checked":[]} would
  // slip past a bare typeof guard and then crash gate evaluation downstream with
  // an unhandled TypeError. Reject any non-plain-object `checked` here instead,
  // so the corruption surfaces as the documented malformed-state error.
  const checked = (parsed as { checked?: unknown }).checked;
  if (typeof checked !== 'object' || checked === null || Array.isArray(checked)) {
    throw new Error(`state file is malformed: ${stateFile}. run \`checklist init --force\` to reset it`);
  }
  return parsed as ChecklistState;
}

// Replace the state file with exactly `state`. The write is atomic: the JSON
// is written to a temp file in the SAME directory and renamed over the target,
// so a reader never observes a truncated/half-written file and a crash mid-write
// leaves the previous state intact (renameSync is atomic only within one
// filesystem, hence same-dir temp). The containing dir is created on demand —
// the XDG state dir may not exist yet on a first run.
export function saveState(stateFile: string, state: ChecklistState): void {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const tmp = `${stateFile}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  try {
    fs.renameSync(tmp, stateFile);
  } catch (e) {
    try {
      fs.unlinkSync(tmp); // best-effort: don't litter the state dir on failure
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
export function mergeAndSaveState(stateFile: string, updates: ChecklistState): ChecklistState {
  let onDisk: ChecklistState;
  try {
    onDisk = loadState(stateFile);
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
  saveState(stateFile, merged);
  return merged;
}

export function clearState(stateFile: string): void {
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
}

// Phase keys are phase NAMES (case-folded), not numeric indices. Folding to
// lower-case mirrors findPhaseIndex's case-insensitive name lookup and the
// loader's case-insensitive duplicate-name check, so a phase addressed as
// "Build" and stored as "build" reconcile. Callers pass the phase NAME; the
// `string | number` type is a back-compat convenience for older call sites /
// tests that still pass a numeric index (it is simply String()-coerced).
function phaseKeyOf(phase: string | number): string {
  return String(phase).toLowerCase();
}

export function isItemChecked(state: ChecklistState, phase: string | number, itemId: string): boolean {
  // An item counts as checked only when its recorded result is a PASS — not
  // merely present. A stored fail/error, or a once-green check that later
  // regressed and was re-recorded, must NOT satisfy the gate. The gate is the
  // safety floor: completeness means current pass-status, not existence of a row.
  return state.checked[phaseKeyOf(phase)]?.[itemId]?.status === 'pass';
}

export function getItemResult(state: ChecklistState, phase: string | number, itemId: string): CheckResult | undefined {
  return state.checked[phaseKeyOf(phase)]?.[itemId];
}

export function setItemResult(state: ChecklistState, phase: string | number, itemId: string, result: CheckResult): void {
  const key = phaseKeyOf(phase);
  if (!state.checked[key]) {
    state.checked[key] = {};
  }
  state.checked[key][itemId] = result;
}

export function isPhaseComplete(state: ChecklistState, phase: string | number, itemIds: string[]): boolean {
  return itemIds.every(id => isItemChecked(state, phase, id));
}

export function phaseProgress(state: ChecklistState, phase: string | number, itemIds: string[]): { done: number; total: number } {
  const done = itemIds.filter(id => isItemChecked(state, phase, id)).length;
  return { done, total: itemIds.length };
}

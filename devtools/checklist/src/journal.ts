import * as fs from 'node:fs';
import * as path from 'node:path';

// An append-only run journal. Every `check`/`verify` event is appended as one
// JSON line under `<stateDir>/runs/<runStamp>.jsonl`, colocated with the
// EXISTING state file (the skill dir today). The point is durability of the
// audit trail: `reset`/`done` clears the mutable state file (so the next run
// starts clean), but it leaves the journal standing — so "done" no longer wipes
// the trail, and a regressing re-verify leaves a record of the regression
// instead of silently overwriting a stale pass.
//
// Honest framing: the journal proves WHAT was recorded and WHEN, with the
// evidence string the agent supplied. It does not prove the evidence is real or
// the substance was actually done — manual checks are still agent-entered. It
// is an audit trace, not a verifier.

const RUNS_DIR = 'runs';

export type JournalEventKind = 'check' | 'verify' | 'reset';

export interface JournalEvent {
  // ISO-8601 UTC timestamp of the event. Real `Date` at runtime is fine — the
  // no-Date constraint applies to workflow scripts, not shipped CLI code.
  ts: string;
  kind: JournalEventKind;
  phaseIndex: number;
  phaseName: string;
  itemId: string;
  status: CheckLikeStatus;
  message: string;
  // Present only when the agent supplied `--evidence` (manual checks).
  evidence?: string;
}

export type CheckLikeStatus = 'pass' | 'fail' | 'error';

function runsDir(stateDir: string): string {
  return path.resolve(stateDir, RUNS_DIR);
}

// A monotonically-sortable, filesystem-safe stamp: 2026-06-16T04-42-09-123Z.
// Colons are illegal in filenames on some platforms, so swap them (and the
// millisecond dot) for dashes while keeping ISO ordering.
export function runStamp(now: Date = new Date()): string {
  return now.toISOString().replace(/[:.]/g, '-');
}

// Append events to the per-run journal file. Each event is one line of JSON
// (JSONL). The file is opened in append mode so concurrent invocations writing
// to the SAME run file never truncate each other, and a single short line write
// is atomic on POSIX. `runFile` is the absolute path the caller chose for this
// process's run (see `journalPathFor`).
export function appendEvents(runFile: string, events: JournalEvent[]): void {
  if (events.length === 0) return;
  fs.mkdirSync(path.dirname(runFile), { recursive: true });
  const payload = events.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.appendFileSync(runFile, payload, 'utf-8');
}

// The journal file for THIS process: one file per CLI invocation's run stamp,
// so a `verify` that records several checks groups them in one file while still
// being distinguishable from a later run.
export function journalPathFor(stateDir: string, stamp: string): string {
  return path.join(runsDir(stateDir), `${stamp}.jsonl`);
}

// Read every event from every run file, in chronological order (run files sort
// by their ISO stamp; lines within a file preserve append order). A malformed
// line is skipped rather than aborting the whole read — the journal is a
// best-effort trace, and one corrupt line must not blind `report` to the rest.
export function readJournal(stateDir: string): JournalEvent[] {
  const dir = runsDir(stateDir);
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  } catch {
    return []; // no runs/ dir yet
  }
  files.sort();

  const events: JournalEvent[] = [];
  for (const f of files) {
    let raw: string;
    try {
      raw = fs.readFileSync(path.join(dir, f), 'utf-8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as JournalEvent;
        if (parsed && typeof parsed === 'object' && typeof parsed.ts === 'string') {
          events.push(parsed);
        }
      } catch {
        /* skip a corrupt line; keep reading the rest of the trail */
      }
    }
  }
  return events;
}

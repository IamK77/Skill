import { loadChecklist } from '../loader.js';
import { resolveDir } from '../resolver.js';
import { journalDir } from '../state.js';
import { readJournal } from '../journal.js';
import { formatReport } from '../formatter.js';
import type { ChecklistConfig } from '../types.js';

// Render the append-only run journal as a markdown gate-trail. Unlike `show`,
// `report` reads the durable runs/ trail rather than the mutable state file, so
// it works even after `done` has cleared state — the whole point of the journal.
export function reportCommand(options?: { dir?: string; path?: string }): void {
  const cwd = resolveDir(options?.dir);

  try {
    // The config is best-effort context for the header; the journal alone is
    // enough to produce a report, so a missing/invalid .checklist.yml does not
    // dead-end the trail (e.g. reporting after the skill dir's config changed).
    let config: ChecklistConfig | undefined;
    try {
      config = loadChecklist(cwd);
    } catch {
      config = undefined;
    }

    const events = readJournal(journalDir(cwd));
    console.log(formatReport(events, config));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

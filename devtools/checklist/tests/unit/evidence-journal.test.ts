import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  appendEvents,
  readJournal,
  journalPathFor,
  runStamp,
  type JournalEvent,
} from '../../src/journal.js';
import { formatReport } from '../../src/formatter.js';
import { loadChecklist } from '../../src/loader.js';

function ev(over: Partial<JournalEvent> = {}): JournalEvent {
  return {
    ts: '2026-06-16T04:42:09.123Z',
    kind: 'check',
    phaseIndex: 0,
    phaseName: 'charter',
    itemId: 'motivation',
    status: 'pass',
    message: 'confirmed',
    ...over,
  };
}

describe('run journal', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('runStamp is filesystem-safe (no colons/dots) and ISO-sortable', () => {
    const s = runStamp(new Date('2026-06-16T04:42:09.123Z'));
    expect(s).toBe('2026-06-16T04-42-09-123Z');
    expect(s).not.toContain(':');
    // lexical order of stamps tracks chronological order
    const earlier = runStamp(new Date('2026-06-16T04:42:09.000Z'));
    expect(earlier < s).toBe(true);
  });

  it('journalPathFor places the file under <stateDir>/runs/<stamp>.jsonl', () => {
    const p = journalPathFor(tmp, '2026-06-16T04-42-09-123Z');
    expect(p).toBe(path.join(tmp, 'runs', '2026-06-16T04-42-09-123Z.jsonl'));
  });

  it('appendEvents then readJournal round-trips events in order', () => {
    const file = journalPathFor(tmp, runStamp(new Date('2026-06-16T04:42:09.123Z')));
    appendEvents(file, [ev({ itemId: 'a' }), ev({ itemId: 'b' })]);
    const back = readJournal(tmp);
    expect(back.map(e => e.itemId)).toEqual(['a', 'b']);
    expect(back[0].evidence).toBeUndefined();
  });

  it('appendEvents([]) is a no-op (creates no file)', () => {
    const file = journalPathFor(tmp, 'whatever');
    appendEvents(file, []);
    expect(fs.existsSync(file)).toBe(false);
    expect(readJournal(tmp)).toEqual([]);
  });

  it('readJournal on a dir with no runs/ returns []', () => {
    expect(readJournal(tmp)).toEqual([]);
  });

  it('appends (never truncates) when called twice on the same run file', () => {
    const file = journalPathFor(tmp, '2026-06-16T04-42-09-123Z');
    appendEvents(file, [ev({ itemId: 'first' })]);
    appendEvents(file, [ev({ itemId: 'second' })]);
    expect(readJournal(tmp).map(e => e.itemId)).toEqual(['first', 'second']);
  });

  it('merges multiple run files in chronological (stamp) order', () => {
    appendEvents(journalPathFor(tmp, '2026-01-01T00-00-00-000Z'), [ev({ itemId: 'old' })]);
    appendEvents(journalPathFor(tmp, '2026-02-01T00-00-00-000Z'), [ev({ itemId: 'new' })]);
    expect(readJournal(tmp).map(e => e.itemId)).toEqual(['old', 'new']);
  });

  it('skips a corrupt JSONL line but keeps reading the rest of the trail', () => {
    const file = journalPathFor(tmp, '2026-06-16T04-42-09-123Z');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      [JSON.stringify(ev({ itemId: 'good1' })), '{ this is not json', JSON.stringify(ev({ itemId: 'good2' }))].join('\n') + '\n',
      'utf-8',
    );
    expect(readJournal(tmp).map(e => e.itemId)).toEqual(['good1', 'good2']);
  });

  it('DURABILITY: the trail survives deleting the mutable state file (what `done` does)', () => {
    // simulate a run: a state file plus a journal, colocated.
    const stateFile = path.join(tmp, '.checklist.state.json');
    fs.writeFileSync(stateFile, '{"checked":{}}', 'utf-8');
    appendEvents(journalPathFor(tmp, '2026-06-16T04-42-09-123Z'), [
      ev({ status: 'pass', evidence: 'threats.md:1-40' }),
    ]);
    // `done`/`reset` clears the state file but NOT runs/
    fs.rmSync(stateFile);
    const back = readJournal(tmp);
    expect(back).toHaveLength(1);
    expect(back[0].evidence).toBe('threats.md:1-40');
  });
});

describe('formatReport', () => {
  it('renders an explicit empty-trail line when there are no events', () => {
    const out = formatReport([]);
    expect(out).toContain('# checklist gate-trail');
    expect(out).toContain('No journal events recorded yet');
  });

  it('renders a markdown row carrying the check id, a pass marker, and the evidence', () => {
    const out = formatReport([ev({ itemId: 'threat-model-done', status: 'pass', evidence: 'STRIDE threats.md:1-40' })]);
    expect(out).toContain('threat-model-done');
    expect(out).toContain('STRIDE threats.md:1-40');
    expect(out).toContain('[x]'); // pass marker
    // the honest-framing caveat is part of the report
    expect(out.toLowerCase()).toContain('agent-entered');
  });
});

describe('loader: evidence parsing', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loader-ev-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });
  const write = (yml: string) => fs.writeFileSync(path.join(tmp, '.checklist.yml'), yml, 'utf-8');

  it('`evidence: required` sets evidenceRequired = true', () => {
    write('phases:\n  - name: a\n    checks:\n      - id: c\n        description: d\n        evidence: required\n');
    const cfg = loadChecklist(tmp);
    expect(cfg.phases[0].checks[0].evidenceRequired).toBe(true);
  });

  it('rejects an evidence value other than the literal "required"', () => {
    write('phases:\n  - name: a\n    checks:\n      - id: c\n        description: d\n        evidence: "yes please"\n');
    expect(() => loadChecklist(tmp)).toThrowError(/only be the string "required"/);
  });

  it('rejects `evidence: required` combined with a `verify` rule (mechanical, not manual)', () => {
    write('phases:\n  - name: a\n    checks:\n      - id: c\n        description: d\n        verify: "shell:make"\n        evidence: required\n');
    expect(() => loadChecklist(tmp)).toThrowError(/mechanical/);
  });
});

import { describe, it, expect } from 'vitest';
import { formatReport } from '../../src/formatter.js';
import type { JournalEvent } from '../../src/journal.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 3) — finding R-rep: formatReport renders the journal as a markdown
// table and carefully escapes `|` (and strips newlines) in the DETAIL column —
// `(e.evidence ?? e.message).replace(/\|/g,'\\|').replace(/\n/g,' ')` — but
// interpolates the phaseName, itemId, and ts columns RAW. A phase name or check id
// containing a `|` (both are unconstrained strings in .checklist.yml) therefore
// injects extra cells and breaks the table. The code's own detail-escaping shows
// the intent: pipes must be escaped in every dynamic cell, not just one.
//
// ORACLE — structural: a markdown table is well-formed only when every data row has
// the same number of *unescaped* column delimiters as the header row. The detail
// column (already escaped) is the trusted reference that this holds when sanitized.
//
// Fail-first: the phaseName/itemId cases redden on the pre-fix code (extra unescaped
// pipes). Disposition: FIX in the same change (user-chosen).
// ─────────────────────────────────────────────────────────────────────────────

function ev(o: Partial<JournalEvent> = {}): JournalEvent {
  return {
    ts: '2026-06-23T00-00-00-000Z',
    kind: 'check',
    phaseIndex: 0,
    phaseName: 'charter',
    itemId: 'motivation',
    status: 'pass',
    message: 'confirmed',
    ...o,
  };
}

// Count `|` that are NOT escaped as `\|` — i.e. the real markdown column delimiters.
function unescapedPipes(line: string): number {
  let n = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '|' && line[i - 1] !== '\\') n++;
  }
  return n;
}

// The data rows of the rendered table (lines that start with '|' after the
// header + separator).
function tableRows(out: string): string[] {
  return out.split('\n').filter((l) => l.startsWith('|'));
}

function headerAndData(out: string): { header: string; data: string[] } {
  const rows = tableRows(out);
  return { header: rows[0], data: rows.slice(2) }; // [0]=header, [1]=separator
}

describe('formatReport keeps the table well-formed regardless of field content (R-rep)', () => {
  it('a phaseName containing | does not add columns to the row', () => {
    const out = formatReport([ev({ phaseName: 'a|b|c' })]);
    const { header, data } = headerAndData(out);
    expect(data).toHaveLength(1);
    expect(unescapedPipes(data[0])).toBe(unescapedPipes(header));
  });

  it('an itemId containing | does not add columns to the row', () => {
    const out = formatReport([ev({ itemId: 'x|y' })]);
    const { header, data } = headerAndData(out);
    expect(unescapedPipes(data[0])).toBe(unescapedPipes(header));
  });

  it('a newline in phaseName does not split the row or drop columns', () => {
    const out = formatReport([ev({ phaseName: 'a\nb' })]);
    const { header, data } = headerAndData(out);
    // Exactly one data row (a leaked newline splits the row; the second fragment
    // does not start with '|' and is dropped, truncating the row's columns).
    expect(data).toHaveLength(1);
    expect(unescapedPipes(data[0])).toBe(unescapedPipes(header));
  });

  it('the escaped phaseName content is preserved (pipe kept, just escaped)', () => {
    const out = formatReport([ev({ phaseName: 'a|b' })]);
    expect(out).toContain('a\\|b');
  });
});

describe('formatReport — controls / no regression', () => {
  it('CONTROL: a | in the detail column is already escaped (trusted reference)', () => {
    const out = formatReport([ev({ evidence: 'see a|b.md' })]);
    const { header, data } = headerAndData(out);
    expect(unescapedPipes(data[0])).toBe(unescapedPipes(header));
  });

  it('an ordinary event still renders one clean row with all columns', () => {
    const out = formatReport([ev({ phaseName: 'charter', itemId: 'motivation' })]);
    const { header, data } = headerAndData(out);
    expect(data).toHaveLength(1);
    expect(unescapedPipes(data[0])).toBe(unescapedPipes(header));
    expect(data[0]).toContain('motivation');
  });

  it('formatReport is pure — identical output on repeated calls', () => {
    const events = [ev({ phaseName: 'a|b' }), ev({ kind: 'reset', phaseIndex: -1, phaseName: '', itemId: '' })];
    expect(formatReport(events)).toBe(formatReport(events));
  });
});

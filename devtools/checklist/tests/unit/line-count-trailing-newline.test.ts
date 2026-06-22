import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { lineCountCheck } from '../../src/builtins/line-count.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — finding R-A: lineCountCheck counts `content.split('\n').length`.
// A file whose last line is newline-terminated (the normal case for any editor)
// has a trailing '' segment after the final '\n', so the count is one HIGHER than
// the visible/`wc -l` line count. At the MAX_LINES boundary this trips a false
// "exceeds 500 limit" on a file that has exactly 500 lines of text.
//
// ORACLE — the wc -l / editor convention: a single trailing newline TERMINATES the
// last line, it does not begin a new empty one. So the count must not depend on
// whether the file ends in '\n'. (metamorphic: count(text) == count(text + '\n').)
//
// Fail-first: the trailing-newline case reddens on the pre-fix code ("501 lines,
// exceeds 500 limit"). Disposition: FIX in the same change (user-chosen).
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay2-linecount-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeRaw(content: string): void {
  fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), content, 'utf-8');
}

function nLines(n: number): string {
  return Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n');
}

describe('lineCountCheck is not off-by-one on a trailing newline (R-A)', () => {
  it('500 text lines WITH a trailing newline passes as 500 (not 501)', async () => {
    writeRaw(nLines(500) + '\n');
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('500 lines');
  });

  it('metamorphic: a trailing newline does not change the reported count', async () => {
    writeRaw(nLines(123));
    const without = await lineCountCheck(tmpDir);
    writeRaw(nLines(123) + '\n');
    const withNl = await lineCountCheck(tmpDir);
    expect(withNl.message).toBe(without.message);
    expect(withNl.message).toBe('123 lines');
  });

  it('501 real text lines with a trailing newline still correctly exceeds the limit', async () => {
    writeRaw(nLines(501) + '\n');
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('501 lines, exceeds 500 limit');
  });

  it('control: 500 lines with NO trailing newline still passes as 500 (unchanged)', async () => {
    writeRaw(nLines(500));
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('500 lines');
  });
});

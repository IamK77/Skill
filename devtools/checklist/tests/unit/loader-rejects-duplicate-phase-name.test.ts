import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';

// Regression (assay audit): the loader used to silently accept two phases with
// the same name. Because findPhaseIndex resolves a name to the FIRST match
// (findIndex, case-insensitively), every non-first phase that shared a name was
// unreachable through its only documented handle — the name — even though its
// checks were plainly declared in the config the user is looking at, and the
// not-found "available" list misled. Stages are addressed BY NAME (SKILL.md), so
// a declared check no name can reach is a real addressability defect.
//
// The loader now rejects duplicate phase names at the parse boundary — the same
// way it rejects duplicate check ids within a phase — so the unreachable-by-name
// situation can never be constructed from a real config.
describe('loader rejects duplicate phase names', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-dupphase-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
  function writeConfig(content: string): void {
    fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
  }

  it('throws a clear error naming the duplicate phase name', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: a1
        description: first-phase check
  - name: Build
    checks:
      - id: b1
        description: second-phase check
`);
    expect(() => loadChecklist(tmpDir)).toThrowError('duplicate phase name "Build"');
  });

  it('rejects case-insensitive duplicates (names resolve case-insensitively)', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: a1
        description: first-phase check
  - name: build
    checks:
      - id: b1
        description: second-phase check
`);
    expect(() => loadChecklist(tmpDir)).toThrowError('duplicate phase name');
  });

  it('accepts distinct phase names (no false positive)', () => {
    writeConfig(`
phases:
  - name: Alpha
    checks:
      - id: a1
        description: a
  - name: Beta
    checks:
      - id: b1
        description: b
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases.map(p => p.name)).toEqual(['Alpha', 'Beta']);
  });
});

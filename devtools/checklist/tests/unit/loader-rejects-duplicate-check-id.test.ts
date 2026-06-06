import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';

// Regression (assay audit): a duplicate check id within one phase used to be
// silently accepted, collapsing N checks into a single state slot so one
// `check`/`verify` could satisfy a failing id-twin and open the gate. The loader
// now rejects it at the parse boundary — the same way it rejects every other
// structural defect — so the gate-collapse scenario is unreachable.
describe('loader rejects a duplicate check id within a phase', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-dupid-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
  function writeConfig(content: string): void {
    fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
  }

  it('throws a clear, phase-scoped error naming the duplicate id', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: dup
        description: first
      - id: dup
        description: second
`);
    expect(() => loadChecklist(tmpDir)).toThrowError('duplicate check id "dup"');
  });

  it('accepts distinct ids in the same phase (no false positive)', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: a
        description: first
      - id: b
        description: second
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases[0].checks.map(c => c.id)).toEqual(['a', 'b']);
  });

  it('allows the same id in DIFFERENT phases (dedup is per-phase)', () => {
    writeConfig(`
phases:
  - name: Alpha
    checks:
      - id: x
        description: a
  - name: Beta
    checks:
      - id: x
        description: b
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases.map(p => p.checks[0].id)).toEqual(['x', 'x']);
  });
});

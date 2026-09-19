import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadChecklist } from '../../src/loader.js';
import { runCheck } from '../../src/runner.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'sop-schema-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));
function load(rule: string) {
  writeFileSync(join(dir, '.checklist.yml'), `phases:\n  - name: build\n    checks:\n      - id: test\n        description: run tests\n${rule}`);
  return loadChecklist(dir);
}
it.each(['""', '"   "', '"shell:"', '"script: "', '"builtin:"'])('rejects empty verification %s rather than manual/pass', value => {
  expect(() => load(`        verify: ${value}\n`)).toThrow(/empty|non-empty/);
});
it('accepts an unordered top-level checklist as a single main phase', () => {
  writeFileSync(join(dir, '.checklist.yml'), 'checks:\n  - id: review\n    description: review the output\n    allow-na: true\n');
  const cfg = loadChecklist(dir);
  expect(cfg.phases[0].name).toBe('main');
  expect(cfg.phases[0].checks[0]).toHaveProperty('allowNa', true);
});
it('rejects ambiguous flat and phased definitions', () => {
  expect(() => load('checks: []\n')).toThrow(/both/);
});
it('rejects non-boolean N/A permission', () => {
  expect(() => load('        allow-na: "yes"\n')).toThrow(/allow-na/);
});
it('refuses an interpolated empty shell command', async () => {
  const cfg = load('        verify: "shell:${TEST_CMD}"\n');
  const result = await runCheck(cfg.phases[0].checks[0], dir, dir, { TEST_CMD: ' ' });
  expect(result.result?.status).toBe('error');
});

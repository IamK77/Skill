// Loader validation for the per-check sensor `timeout:` (seconds → timeoutMs).
// Same refuse-to-load posture the loader takes for malformed verify/evidence.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';

describe('loader: per-check timeout', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'loader-timeout-')));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(yml: string): void {
    fs.writeFileSync(path.join(dir, '.checklist.yml'), yml, 'utf-8');
  }

  it('accepts a positive number and converts seconds → timeoutMs', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: tests\n        description: run tests\n        verify: "shell:\${TEST_CMD}"\n        timeout: 120\n`);
    const cfg = loadChecklist(dir);
    expect(cfg.phases[0].checks[0].timeoutMs).toBe(120_000);
  });

  it('leaves timeoutMs undefined when no timeout is given', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: tests\n        description: run tests\n        verify: "shell:echo hi"\n`);
    const cfg = loadChecklist(dir);
    expect(cfg.phases[0].checks[0].timeoutMs).toBeUndefined();
  });

  it('rejects timeout on a manual check (no verify rule)', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: x\n        description: manual\n        timeout: 60\n`);
    expect(() => loadChecklist(dir)).toThrow(/timeout.*only.*mechanical|no "verify"/);
  });

  it('rejects a non-numeric timeout', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: x\n        description: d\n        verify: "shell:echo hi"\n        timeout: "60"\n`);
    expect(() => loadChecklist(dir)).toThrow(/timeout.*must be a positive number/);
  });

  it('rejects a zero / negative timeout', () => {
    for (const t of [0, -5]) {
      write(`phases:\n  - name: build\n    checks:\n      - id: x\n        description: d\n        verify: "shell:echo hi"\n        timeout: ${t}\n`);
      expect(() => loadChecklist(dir)).toThrow(/timeout.*must be a positive number/);
    }
  });

  it('rejects a timeout above the 1800s ceiling', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: x\n        description: d\n        verify: "shell:echo hi"\n        timeout: 3600\n`);
    expect(() => loadChecklist(dir)).toThrow(/exceeds.*1800s ceiling/);
  });

  it('accepts a fractional second value (rounds to ms)', () => {
    write(`phases:\n  - name: build\n    checks:\n      - id: x\n        description: d\n        verify: "shell:echo hi"\n        timeout: 1.5\n`);
    const cfg = loadChecklist(dir);
    expect(cfg.phases[0].checks[0].timeoutMs).toBe(1500);
  });
});

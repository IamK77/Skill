import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { spawnSync, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

// The self-carry bundle is a SINGLE file with commander/gray-matter/js-yaml
// inlined. Its whole point is to run the gate on a machine that has neither a
// global `checklist` install nor a node_modules. We prove that by copying the
// bundle OUT of the repo into an isolated temp dir (so node can resolve no
// node_modules anywhere up the tree from it) and running it via plain `node`.

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, '..', '..'); // devtools/checklist
const bundlePath = path.join(pkgRoot, 'bundle', 'checklist.mjs');

const FIXTURE = `phases:
  - name: charter
    checks:
      - id: motivation
        description: motivation identified
  - name: build
    checks:
      - id: compiles
        description: it compiles
`;

describe('self-carried bundle', () => {
  let tmp: string;
  let mjs: string;
  let skill: string;

  beforeAll(() => {
    // The bundle is committed; build it only if it is somehow absent so the
    // suite is self-sufficient on a clean checkout.
    if (!fs.existsSync(bundlePath)) {
      execSync('npm run bundle', { cwd: pkgRoot, stdio: 'ignore' });
    }
  }, 60_000);

  beforeEach(() => {
    // os.tmpdir() has no node_modules up to the filesystem root — copying the
    // bundle here divorces it from the repo's installed dependencies entirely.
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'selfcarry-'));
    mjs = path.join(tmp, 'checklist.mjs');
    fs.copyFileSync(bundlePath, mjs);
    skill = path.join(tmp, 'skill');
    fs.mkdirSync(skill, { recursive: true });
    fs.writeFileSync(path.join(skill, '.checklist.yml'), FIXTURE, 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  // Run the RELOCATED bundle copy with plain node, from the isolated dir.
  function run(...args: string[]) {
    return spawnSync(process.execPath, [mjs, ...args], { cwd: tmp, encoding: 'utf-8' });
  }

  it('is a single self-contained .mjs file', () => {
    const st = fs.statSync(bundlePath);
    expect(st.isFile()).toBe(true);
    expect(st.size).toBeGreaterThan(50_000); // deps inlined, not a thin shim
  });

  it('runs --version with no node_modules resolvable from its location', () => {
    const r = run('--version');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('runs a full gate cycle (init -> check -> show) standalone', () => {
    expect(run('init', '-d', skill, '--force').status).toBe(0);
    expect(run('check', 'charter', 'motivation', '-d', skill).status).toBe(0);
    const show = run('show', '-d', skill);
    expect(show.status).toBe(0);
    // the overview lists phases (not check ids); charter's single check is now
    // confirmed, so the charter phase reads as complete.
    expect(show.stdout.toLowerCase()).toContain('charter');
    expect(show.stdout).toMatch(/\[x\]|passed/i);
  });

  it('still BITES: a refused gate (unknown item) exits non-zero', () => {
    run('init', '-d', skill, '--force');
    const r = run('check', 'charter', 'no-such-item', '-d', skill);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('not found');
  });

  it('still BITES: an out-of-order phase is blocked until its prior phase is done', () => {
    run('init', '-d', skill, '--force');
    // build (phase 1) before charter (phase 0) is complete -> gate blocked
    const blocked = run('check', 'build', 'compiles', '-d', skill);
    expect(blocked.status).not.toBe(0);
    // complete phase 0, then phase 1 opens
    expect(run('check', 'charter', 'motivation', '-d', skill).status).toBe(0);
    expect(run('check', 'build', 'compiles', '-d', skill).status).toBe(0);
  });
});

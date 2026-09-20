import { afterEach, beforeEach, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let tmp: string;
beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-build-')); });
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

it('rejects a builder/lock mismatch before reading or writing a bundle', () => {
  fs.mkdirSync(path.join(tmp, 'scripts'));
  fs.copyFileSync(path.join(pkg, 'scripts/bundle.mjs'), path.join(tmp, 'scripts/bundle.mjs'));
  fs.copyFileSync(path.join(pkg, 'package.json'), path.join(tmp, 'package.json'));
  const lock = JSON.parse(fs.readFileSync(path.join(pkg, 'package-lock.json'), 'utf8'));
  lock.packages['node_modules/esbuild'].version = '0.0.0-deliberate-mismatch';
  fs.writeFileSync(path.join(tmp, 'package-lock.json'), JSON.stringify(lock));
  fs.symlinkSync(path.join(pkg, 'node_modules'), path.join(tmp, 'node_modules'), 'dir');
  const result = spawnSync(process.execPath, [path.join(tmp, 'scripts/bundle.mjs'), '--check'], { cwd: tmp, encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('does not match package-lock.json');
  expect(result.stderr).toContain('npm ci');
  expect(fs.existsSync(path.join(tmp, 'bundle'))).toBe(false);
});

it('checks the same committed artifact from the package, repository, or unrelated cwd without writing it', () => {
  const artifact = path.join(pkg, 'bundle/checklist.mjs');
  const before = fs.readFileSync(artifact);
  for (const cwd of [pkg, path.resolve(pkg, '../..'), tmp]) {
    const result = spawnSync(process.execPath, [path.join(pkg, 'scripts/bundle.mjs'), '--check'], { cwd, encoding: 'utf8' });
    expect(result.status, `cwd=${cwd}\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('bundle matches source byte-for-byte');
  }
  expect(fs.readFileSync(artifact).equals(before)).toBe(true);
});

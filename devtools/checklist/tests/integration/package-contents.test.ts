import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageName = '@iamk77/skill-checklist';

function packArtifact(output: string) {
  const report = JSON.parse(output);
  // npm 11 returns an array; npm 12 returns an object keyed by package name.
  const entries = Array.isArray(report) ? report : Object.values(report);
  expect(entries).toHaveLength(1);
  const artifact = entries[0] as { name: string; files: { path: string }[] };
  expect(artifact.name).toBe(packageName);
  expect(Array.isArray(artifact.files)).toBe(true);
  return artifact;
}

const fixture = { name: packageName, files: [{ path: 'MIGRATION.md' }] };
it.each([
  ['npm 11 array', [fixture]],
  ['npm 12 keyed object', { [packageName]: fixture }],
])('reads the %s pack report', (_name, report) => {
  expect(packArtifact(JSON.stringify(report))).toEqual(fixture);
});
it.each([
  ['empty', {}],
  ['multiple packages', [fixture, fixture]],
  ['wrong package', [{ ...fixture, name: 'other-package' }]],
  ['missing inventory', [{ name: packageName }]],
])('rejects a %s pack report', (_name, report) => {
  expect(() => packArtifact(JSON.stringify(report))).toThrow();
});

it('ships the CLI, data-only parser, licensing and linked migration guide in the npm package', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkg, encoding: 'utf8', timeout: 20_000,
  });
  expect(result.status, result.stderr).toBe(0);
  const artifact = packArtifact(result.stdout);
  const files = artifact.files.map((file: { path: string }) => file.path);
  expect(files).toEqual(expect.arrayContaining([
    'package.json', 'bin/checklist.js', 'dist/index.js', 'dist/frontmatter.js',
    'README.md', 'MIGRATION.md', 'LICENSE', 'NOTICE',
  ]));
  expect(files.filter((name: string) => /^(?:src|tests|node_modules|schedule)\//.test(name))).toEqual([]);
});

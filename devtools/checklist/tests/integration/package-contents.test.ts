import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

it('ships the CLI, data-only parser, licensing and linked migration guide in the npm package', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkg, encoding: 'utf8', timeout: 20_000,
  });
  expect(result.status, result.stderr).toBe(0);
  const [artifact] = JSON.parse(result.stdout);
  const files = artifact.files.map((file: { path: string }) => file.path);
  expect(files).toEqual(expect.arrayContaining([
    'package.json', 'bin/checklist.js', 'dist/index.js', 'dist/frontmatter.js',
    'README.md', 'MIGRATION.md', 'LICENSE', 'NOTICE',
  ]));
  expect(files.filter((name: string) => /^(?:src|tests|node_modules|schedule)\//.test(name))).toEqual([]);
});

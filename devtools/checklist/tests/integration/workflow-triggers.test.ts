import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

for (const [name, source] of [
  ['ci', 'devtools/checklist/**'],
  ['probe', 'skills/atelier/**/probes/**'],
]) describe(`${name} workflow triggers`, () => {
  const relative = `.github/workflows/${name}.yml`;
  const workflow = yaml.load(fs.readFileSync(path.join(repo, relative), 'utf8')) as {
    on: Record<string, { paths: string[] }>;
  };
  it.each(['push', 'pull_request'])('checks source and workflow-only changes on %s', (event) => {
    expect(workflow.on[event].paths).toEqual(expect.arrayContaining([source, relative]));
    // This contract test lives in the CLI suite, so probe-only workflow edits
    // must trigger that suite too, not just the browser probe harnesses.
    if (name === 'ci') expect(workflow.on[event].paths).toContain('.github/workflows/probe.yml');
  });
});

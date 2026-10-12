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
    if (name === 'ci') {
      expect(workflow.on[event].paths).toContain('.github/workflows/probe.yml');
      expect(workflow.on[event].paths).toContain('.github/workflows/release-please.yml');
    }
  });
});

it('tests with the same pinned npm as publishing, before installing dependencies', () => {
  type Step = { run?: string; uses?: string; with?: Record<string, unknown> };
  const steps = (name: string, job: string): Step[] => {
    const workflow = yaml.load(fs.readFileSync(path.join(repo, `.github/workflows/${name}.yml`), 'utf8')) as {
      jobs: Record<string, { steps: Step[] }>;
    };
    return workflow.jobs[job].steps;
  };
  const ci = steps('ci', 'test');
  const publish = steps('release-please', 'publish');
  const install = (list: Step[]) => list.filter(step => step.run?.startsWith('npm install -g npm@'));
  expect(install(ci)).toHaveLength(1);
  expect(install(publish)).toHaveLength(1);
  expect(install(ci)[0].run).toMatch(/^npm install -g npm@\d+\.\d+\.\d+$/);
  expect(install(publish)[0].run).toBe(install(ci)[0].run);
  for (const list of [ci, publish]) {
    const installer = list.indexOf(install(list)[0]);
    const dependencies = list.findIndex(step => step.run === 'npm ci');
    const tests = list.findIndex(step => step.run === 'npm test');
    expect(installer).toBeLessThan(dependencies);
    expect(dependencies).toBeLessThan(tests);
  }
});

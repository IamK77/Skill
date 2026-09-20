import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as yaml from 'js-yaml';
import matter from 'gray-matter';

const require = createRequire(import.meta.url);
const legacyYaml = require(require.resolve('js-yaml', { paths: [dirname(require.resolve('gray-matter/package.json'))] }));
// Small inputs exercise the budget contract without running an expensive DoS.
const repeatedEmptySources = 'empty: &empty {}\nvalue:\n  <<: [*empty, *empty, *empty, *empty, *empty, *empty]\n';

for (const [name, parse] of [
  ['checklist YAML 4.x', (source: string, options: object) => yaml.load(source, options)],
  ['gray-matter YAML 3.x', (source: string, options: object) => legacyYaml.safeLoad(source, options)],
] as const) describe(name, () => {
  it('counts empty merge sources toward the configured work budget', () => {
    expect(() => parse(repeatedEmptySources, { maxTotalMergeKeys: 2 })).toThrow(/merge|limit/i);
  });
  it('still accepts ordinary aliases and merge keys within budget', () => {
    expect(parse('base: &base {enabled: true}\nvalue: {<<: *base, label: sample}\n', { maxTotalMergeKeys: 10 })).toEqual({
      base: { enabled: true }, value: { enabled: true, label: 'sample' },
    });
  });
});

it('keeps the gray-matter safeLoad engine compatible with ordinary frontmatter', () => {
  const result = matter('---\nname: fixture\nmetadata:\n  kind: sop\n---\n# Body\n');
  expect(result.data).toEqual({ name: 'fixture', metadata: { kind: 'sop' } });
  expect(result.content).toBe('# Body\n');
});

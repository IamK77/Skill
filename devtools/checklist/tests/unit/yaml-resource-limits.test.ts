import { describe, expect, it } from 'vitest';
import * as yaml from 'js-yaml';
import { parseFrontmatter } from '../../src/frontmatter.js';
// Small inputs exercise the budget contract without running an expensive DoS.
const repeatedEmptySources = 'empty: &empty {}\nvalue:\n  <<: [*empty, *empty, *empty, *empty, *empty, *empty]\n';

const parse = (source: string, options: object) => yaml.load(source, options);

describe('checklist YAML resource limits', () => {
  it('counts empty merge sources toward the configured work budget', () => {
    expect(() => parse(repeatedEmptySources, { maxTotalMergeKeys: 2 })).toThrow(/merge|limit/i);
  });
  it('still accepts ordinary aliases and merge keys within budget', () => {
    expect(parse('base: &base {enabled: true}\nvalue: {<<: *base, label: sample}\n', { maxTotalMergeKeys: 10 })).toEqual({
      base: { enabled: true }, value: { enabled: true, label: 'sample' },
    });
  });
});

it('keeps the data-only parser compatible with ordinary frontmatter', () => {
  const result = parseFrontmatter('---\nname: fixture\nmetadata:\n  kind: sop\n---\n# Body\n');
  expect(result.data).toEqual({ name: 'fixture', metadata: { kind: 'sop' } });
  expect(result.content).toBe('# Body\n');
});

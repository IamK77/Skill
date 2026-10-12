import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../../src/frontmatter.js';

describe('frontmatter framing and YAML compatibility', () => {
  it('preserves a document without frontmatter', () => {
    const content = '# Body\n\n---\nA rule in the body.\n';
    expect(parseFrontmatter(content)).toEqual({ data: {}, content, hasFrontmatter: false });
  });
  it('accepts a BOM, CRLF and trailing delimiter whitespace without normalizing the body', () => {
    expect(parseFrontmatter('\ufeff--- \t\r\nname: sample\r\n--- \t\r\n# Body\r\n')).toEqual({
      data: { name: 'sample' }, content: '# Body\r\n', hasFrontmatter: true,
    });
  });
  it('requires delimiters to occupy a whole line', () => {
    expect(parseFrontmatter('---\ndescription: before---after\nnote: |\n  ---\n---\n# Body\n')).toEqual({
      data: { description: 'before---after', note: '---\n' }, content: '# Body\n', hasFrontmatter: true,
    });
  });
  it.each(['', '# Just a comment\n'])('keeps an empty mapping for an empty YAML document: %s', (yaml) => {
    expect(parseFrontmatter(`---\n${yaml}---\n`)).toEqual({ data: {}, content: '', hasFrontmatter: true });
  });
  it('accepts a closing delimiter at EOF', () => {
    expect(parseFrontmatter('---\nname: sample\n---').content).toBe('');
  });
  it('accepts YAML mappings, including JSON flow syntax', () => {
    expect(parseFrontmatter('---\n{"name":"sample","metadata":{"kind":"sop"}}\n---\n').data).toEqual({
      name: 'sample', metadata: { kind: 'sop' },
    });
  });
  it('retains ordinary aliases and merge keys as data', () => {
    expect(parseFrontmatter('---\nbase: &base {enabled: true}\nmetadata: {<<: *base, kind: sop}\n---\n').data).toEqual({
      base: { enabled: true }, metadata: { enabled: true, kind: 'sop' },
    });
  });
  it('rejects executable YAML tags', () => {
    expect(() => parseFrontmatter('---\nvalue: !!js/function "function () { return 1; }"\n---\n')).toThrow();
  });
  it.each(['---yaml\nname: sample\n---\n', '---json\n{"name":"sample"}\n---\n', '---\nname: sample\n---trailing\n'])('rejects noncanonical framing: %s', (raw) => {
    expect(() => parseFrontmatter(raw)).toThrow(/delimiter|language/);
  });
});

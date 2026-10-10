import * as yaml from 'js-yaml';

export interface Frontmatter {
  data: Record<string, unknown>;
  content: string;
  hasFrontmatter: boolean;
}

/** Read SKILL.md metadata as YAML data, never as an executable language engine. */
export function parseFrontmatter(raw: string): Frontmatter {
  const source = raw.replace(/^\uFEFF/, '');
  if (!source.startsWith('---')) {
    return { data: {}, content: source, hasFrontmatter: false };
  }

  // Delimiters occupy whole lines. Do not dispatch on ---javascript / ---js,
  // or mistake an inline "---" inside a YAML value for the end of the header.
  const opening = /^---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!opening) throw new Error('frontmatter must begin with a plain --- YAML delimiter; language labels are not supported');
  const rest = source.slice(opening[0].length);
  const closing = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (!closing) throw new Error('missing closing --- frontmatter delimiter');

  const header = rest.slice(0, closing.index);
  const value: unknown = yaml.load(header);
  // js-yaml returns null for comments alone as well as explicit null. Only the
  // former is empty metadata; arrays, dates and scalar roots are not mappings.
  const empty = header.split(/\r?\n/).every(line => /^[ \t]*(?:#[^\r\n]*)?$/.test(line));
  const data = empty ? {} : value;
  if (data === null || typeof data !== 'object' || Object.getPrototypeOf(data) !== Object.prototype) {
    throw new Error('frontmatter must be a YAML mapping');
  }
  return {
    data: data as Record<string, unknown>,
    content: rest.slice(closing.index + closing[0].length),
    hasFrontmatter: true,
  };
}

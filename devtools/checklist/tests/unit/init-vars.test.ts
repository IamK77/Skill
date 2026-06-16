import { describe, it, expect } from 'vitest';
import { parseVars } from '../../src/commands/init.js';

// parseVars: turn the repeated `--var name=value` flags into a vars map, with a
// located error on malformed input rather than a silent drop / last-wins.

describe('parseVars', () => {
  it('returns {} for no --var flags', () => {
    expect(parseVars([])).toEqual({});
  });

  it('parses a single name=value', () => {
    expect(parseVars(['test_cmd=npm test'])).toEqual({ test_cmd: 'npm test' });
  });

  it('parses multiple --var flags into one map', () => {
    expect(parseVars(['a=1', 'b=2'])).toEqual({ a: '1', b: '2' });
  });

  it('keeps everything after the first = (values may contain =)', () => {
    expect(parseVars(['cmd=FOO=bar npm test'])).toEqual({ cmd: 'FOO=bar npm test' });
  });

  it('allows an empty value', () => {
    expect(parseVars(['empty='])).toEqual({ empty: '' });
  });

  it('rejects an entry with no =', () => {
    expect(() => parseVars(['justaname'])).toThrowError(/expected name=value/);
  });

  it('rejects a name that is not a shell identifier', () => {
    expect(() => parseVars(['1bad=x'])).toThrowError(/invalid --var name/);
    expect(() => parseVars(['has-dash=x'])).toThrowError(/invalid --var name/);
    expect(() => parseVars(['has space=x'])).toThrowError(/invalid --var name/);
  });

  it('rejects a duplicate name instead of silently last-wins', () => {
    expect(() => parseVars(['x=1', 'x=2'])).toThrowError(/duplicate --var name "x"/);
  });
});

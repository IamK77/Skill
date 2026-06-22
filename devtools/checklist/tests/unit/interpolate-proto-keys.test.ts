import { describe, it, expect } from 'vitest';
import { interpolate } from '../../src/runner.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — finding R3: interpolate()'s documented contract is "if neither
// a captured run var nor a process-env var is set, the reference is an error"
// (UndefinedVarError). The env fallback is `process.env[name]`, which reads
// INHERITED Object.prototype members for prototype-key names: `${__proto__}` →
// the prototype object, `${constructor}`/`${toString}`/`${valueOf}` → native
// functions. Each is `!== undefined`, so the "undefined variable" guard is bypassed
// and interpolate emits "[object Object]" / "function () { [native code] }" INTO the
// shell command string instead of erroring — a silently-wrong command runs.
//
// ORACLE — spec: a prototype-key name is not a captured var and is not a real
// (own) environment variable, so by the contract it MUST throw, exactly like any
// other unset name. The CONTROL (a plain unset name) already throws today and is
// the trusted reference these deviate from.
//
// Fail-first: reddens on the pre-fix code (returns junk instead of throwing).
// Disposition: FIX in the same change (user-chosen).
// ─────────────────────────────────────────────────────────────────────────────

const protoKeys = [
  '__proto__',
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
];

describe('interpolate rejects prototype-key names like any other unset variable (R3)', () => {
  // CONTROL — the trusted reference: a plain unset name throws on current code.
  it('CONTROL: a plain unset name throws (anchors the oracle)', () => {
    expect(() => interpolate('${CHECKLIST_R3_PLAIN_UNSET}', {})).toThrowError(/undefined variable/);
  });

  it.each(protoKeys)('${%s} is not a defined variable and must throw', (key) => {
    expect(() => interpolate(`\${${key}}`, {})).toThrowError(/undefined variable/);
  });

  it('the thrown error names the offending variable (located message)', () => {
    expect(() => interpolate('${constructor}', {})).toThrowError(/constructor/);
  });
});

describe('interpolate still resolves real variables after the R3 fix (no regression)', () => {
  it('a captured run var whose name IS a prototype key resolves to its value, not the inherited member', () => {
    // An explicitly-captured var must win — own-property on `vars` is honoured.
    expect(interpolate('${toString}', { toString: 'REAL_VALUE' })).toBe('REAL_VALUE');
  });

  it('a real (own) process-env var still falls back correctly', () => {
    const KEY = 'CHECKLIST_R3_REAL_ENV_PROBE';
    process.env[KEY] = 'from-env';
    try {
      expect(interpolate(`\${${KEY}}`, {})).toBe('from-env');
    } finally {
      delete process.env[KEY];
    }
  });
});

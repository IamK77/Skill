import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { interpolate, runCheck } from '../../src/runner.js';
import type { CheckItem } from '../../src/types.js';

// ─────────────────────────────────────────────────────────────────────────
// interpolate(): pure substitution unit. Precedence, escaping, and the
// undefined-var error all live here; runCheck wires it into a verify rule.
// ─────────────────────────────────────────────────────────────────────────

describe('interpolate', () => {
  it('substitutes a captured run var into a ${name} placeholder', () => {
    expect(interpolate('${test_cmd}', { test_cmd: 'npm test' })).toBe('npm test');
  });

  it('substitutes multiple placeholders, in-line with surrounding text', () => {
    const out = interpolate('run ${a} then ${b}!', { a: 'foo', b: 'bar' });
    expect(out).toBe('run foo then bar!');
  });

  it('leaves a string with no placeholders untouched', () => {
    expect(interpolate('npm test', {})).toBe('npm test');
  });

  // ── precedence: run var > process env ───────────────────────────────
  it('prefers a captured run var over a process-env var of the same name', () => {
    const KEY = 'CHECKLIST_VARS_PRECEDENCE_PROBE';
    process.env[KEY] = 'from-env';
    try {
      expect(interpolate(`\${${KEY}}`, { [KEY]: 'from-var' })).toBe('from-var');
    } finally {
      delete process.env[KEY];
    }
  });

  it('falls back to a process-env var when no run var is set (documented fallback)', () => {
    const KEY = 'CHECKLIST_VARS_ENV_FALLBACK_PROBE';
    process.env[KEY] = 'from-env';
    try {
      expect(interpolate(`\${${KEY}}`, {})).toBe('from-env');
    } finally {
      delete process.env[KEY];
    }
  });

  it('treats an empty-string run var as defined (not a fallback to env)', () => {
    const KEY = 'CHECKLIST_VARS_EMPTY_PROBE';
    process.env[KEY] = 'from-env';
    try {
      expect(interpolate(`x\${${KEY}}y`, { [KEY]: '' })).toBe('xy');
    } finally {
      delete process.env[KEY];
    }
  });

  // ── escaping: $$ is a literal $ and suppresses interpolation ─────────
  it('treats $${name} as a literal ${name} (escape)', () => {
    expect(interpolate('$${HOME}', { HOME: 'should-not-appear' })).toBe('${HOME}');
  });

  it('escapes only the doubled $, leaving a later real placeholder intact', () => {
    expect(interpolate('$${literal} and ${real}', { real: 'X' })).toBe('${literal} and X');
  });

  it('collapses a lone $$ to a single $', () => {
    expect(interpolate('cost is $$5', {})).toBe('cost is $5');
  });

  // ── non-placeholder ${...} shapes pass through for bash ─────────────
  it('passes a bash positional like ${1} through untouched', () => {
    expect(interpolate('echo ${1}', {})).toBe('echo ${1}');
  });

  it('passes a bash array index like ${arr[0]} through untouched', () => {
    expect(interpolate('echo ${arr[0]}', {})).toBe('echo ${arr[0]}');
  });

  it('passes an unclosed ${ through untouched', () => {
    expect(interpolate('echo ${unclosed', {})).toBe('echo ${unclosed');
  });

  // ── undefined var → throw (located error happens at runCheck) ───────
  it('throws on a ${name} that is neither a run var nor an env var', () => {
    const KEY = 'CHECKLIST_VARS_DEFINITELY_UNSET_PROBE';
    delete process.env[KEY];
    expect(() => interpolate(`\${${KEY}}`, {})).toThrowError(/undefined variable/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// runCheck(): the wiring — interpolation applied to shell:/script: values,
// undefined vars surfaced as a located, attributed error result.
// ─────────────────────────────────────────────────────────────────────────

describe('runCheck with vars', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-vars-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeItem(overrides: Partial<CheckItem> = {}): CheckItem {
    return { id: 'test-item', description: 'A test check item', ...overrides };
  }

  it('interpolates a run var into a shell rule and runs the resolved command', async () => {
    const item = makeItem({ verify: 'shell:echo ${greeting}' });
    const result = await runCheck(item, tmpDir, tmpDir, { greeting: 'hello-world' });

    expect(result.kind).toBe('mechanical');
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('hello-world');
  });

  it('drives pass/fail from the var value (the unlock: one rule, target-bound command)', async () => {
    const item = makeItem({ verify: 'shell:${test_cmd}' });

    const pass = await runCheck(item, tmpDir, tmpDir, { test_cmd: 'true' });
    expect(pass.result!.status).toBe('pass');

    const fail = await runCheck(item, tmpDir, tmpDir, { test_cmd: 'false' });
    expect(fail.result!.status).toBe('fail');
  });

  it('records a located, attributed error (not a half-run command) for an undefined var', async () => {
    const item = makeItem({ id: 'tests-green', verify: 'shell:${test_cmd}' });
    const result = await runCheck(item, tmpDir, tmpDir, {}); // no vars

    expect(result.kind).toBe('mechanical');
    expect(result.result!.status).toBe('error');
    // attribution + the offending var + the rule + how to fix it
    expect(result.result!.message).toMatch(/^tests-green: /);
    expect(result.result!.message).toContain('${test_cmd}');
    expect(result.result!.message).toContain('shell:${test_cmd}');
    expect(result.result!.message).toContain('--var test_cmd=');
  });

  it('does NOT run the command when a var is undefined (no side effect)', async () => {
    const marker = path.join(tmpDir, 'side-effect.txt');
    const item = makeItem({ verify: 'shell:touch ${out} && echo done' });
    const result = await runCheck(item, tmpDir, tmpDir, {}); // ${out} unset

    expect(result.result!.status).toBe('error');
    expect(fs.existsSync(marker)).toBe(false);
  });

  it('honours the $$ escape so bash evaluates ${...} at run time', async () => {
    // $${USER...} -> literal ${USER...}; bash expands it. We use a var WE set in
    // the child's env via the command itself to keep it deterministic.
    const item = makeItem({ verify: 'shell:X=ok; echo $${X}' });
    const result = await runCheck(item, tmpDir, tmpDir, {});

    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('ok');
  });

  it('interpolates a var into a script path and runs the contained script', async () => {
    fs.writeFileSync(path.join(tmpDir, 'check.sh'), '#!/bin/bash\necho "script ok"', 'utf-8');
    const item = makeItem({ verify: 'script:./${script_name}' });
    const result = await runCheck(item, tmpDir, tmpDir, { script_name: 'check.sh' });

    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('script ok');
  });

  it('still containment-rejects a script path AFTER interpolation (no escape via var)', async () => {
    const item = makeItem({ verify: 'script:${escape}' });
    const result = await runCheck(item, tmpDir, tmpDir, { escape: '../../../etc/passwd' });

    expect(result.result!.status).toBe('error');
    expect(result.result!.message).toContain('escapes the checklist dir');
  });
});

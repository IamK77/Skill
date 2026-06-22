import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileRefsCheck } from '../../src/builtins/file-refs.js';
import { noSecretsCheck } from '../../src/builtins/no-secrets.js';
import { interpolate } from '../../src/runner.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — the COMPOSE "call-it-again" probe. These targets are read-only
// (no advancing state, not idempotency-sensitive in the billing sense), so the
// second-invocation risk here is a HIDDEN-STATE one: module-level `/g` regexes
// carry `lastIndex` between calls. file-refs.ts uses a module-level `const LINK_RE
// = /.../g`; today its while-loop runs to completion (exec → null) and lastIndex
// resets, so a second call is stable — but an early `break`/`return` added later
// would leak lastIndex and make the SECOND scan start mid-string and under-count.
//
// ORACLE — idempotence of a pure read: calling the unit twice on byte-identical
// input must return a byte-identical result. This is a GREEN regression GUARD
// (the bug it prevents is not present today); it pins invocation-stability so a
// future stateful-regex regression reddens here instead of silently dropping refs.
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay2-stability-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeSkill(body: string): void {
  fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), `---\nname: t\n---\n${body}\n`, 'utf-8');
}

describe('fileRefsCheck is invocation-stable across repeated calls (module-level /g LINK_RE)', () => {
  it('a SKILL.md with several local links yields the SAME result on the 2nd call', async () => {
    for (const f of ['a.md', 'b.md', 'c.md']) {
      fs.writeFileSync(path.join(tmpDir, f), `# ${f}`, 'utf-8');
    }
    writeSkill('See [a](a.md), [b](b.md "title"), and [c](<c.md>). Also [ext](https://x.io) and [anchor](#top).');

    const first = await fileRefsCheck(tmpDir);
    const second = await fileRefsCheck(tmpDir);
    expect(second).toEqual(first);
    // And the result is the correct one (3 local refs, externals/anchors excluded).
    expect(first.status).toBe('pass');
    expect(first.message).toBe('3 refs valid');
  });

  it('a SKILL.md with missing links yields the SAME failure on the 2nd call', async () => {
    writeSkill('Broken [x](missing-one.md) and [y](missing-two.md).');
    const first = await fileRefsCheck(tmpDir);
    const second = await fileRefsCheck(tmpDir);
    expect(second).toEqual(first);
    expect(first.status).toBe('fail');
  });
});

describe('noSecretsCheck is invocation-stable across repeated calls', () => {
  it('a multi-finding SKILL.md reports the SAME findings on the 2nd call', async () => {
    writeSkill(['AKIAIOSFODNN7EXAMPLE', '-----BEGIN PRIVATE KEY-----'].join('\n'));
    const first = await noSecretsCheck(tmpDir);
    const second = await noSecretsCheck(tmpDir);
    expect(second).toEqual(first);
    expect(first.status).toBe('fail');
  });
});

describe('interpolate is a pure function — identical output on repeated calls', () => {
  it('the same template + vars produces byte-identical output twice', () => {
    const tpl = 'run ${a} then ${b} with $${LITERAL} and ${1}';
    const vars = { a: 'one', b: 'two' };
    expect(interpolate(tpl, vars)).toBe(interpolate(tpl, vars));
  });
});

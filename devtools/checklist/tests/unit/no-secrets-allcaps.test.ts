import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { noSecretsCheck } from '../../src/builtins/no-secrets.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — finding R2: noSecretsCheck's placeholder guard exempts ANY
// all-caps value via /^[A-Z][A-Z0-9_]+$/. That rule exists to skip doc placeholders
// like YOUR_TOKEN / ALL_CAPS_VALUE, but it ALSO swallows a whole class of REAL
// secrets that happen to be all-caps — base32 tokens, upper-hex, some cloud
// secrets — so a committed secret of that shape passes the scan silently.
//
// ORACLE — spec + metamorphic:
//   * spec: a high-entropy all-caps value (mixes letters AND digits, no
//     word-separating underscore) assigned to secret=/token= is NOT a doc
//     placeholder and MUST be flagged.
//   * metamorphic: lower-casing a non-placeholder value must NOT change the
//     verdict — yet today the mixed-case twin is flagged while the all-caps one
//     is not. Case alone must not flip a real secret to "clean".
//   * negative (no false positives): genuine placeholders — YOUR_TOKEN, <key>,
//     changeme, an ALL_CAPS_VALUE word-combo, and a plain CAPS word — must still
//     pass after the fix.
//
// Fail-first: reddens on the pre-fix code (the all-caps secret passes). Disposition:
// FIX in the same change (user-chosen).
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay2-nosecrets-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeSkill(body: string): void {
  fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), `---\nname: t\n---\n${body}\n`, 'utf-8');
}

// A high-entropy all-caps token: 26 chars, letters+digits, no underscore. This is
// the exact shape the old guard swallowed.
const ALLCAPS_SECRET = 'ABCDEFGHIJ1234567890KLMNOP';

describe('noSecretsCheck flags a real all-caps secret (R2)', () => {
  it('DOES flag a high-entropy all-caps token assigned to secret=', async () => {
    writeSkill(`secret = ${ALLCAPS_SECRET}`);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('Token/Secret assignment');
  });

  it('metamorphic: case must not flip the verdict — the all-caps twin is flagged like the mixed-case one', async () => {
    // Reference (trusted): the mixed-case form is already flagged on current code.
    writeSkill('secret = aBcDeFgH1234567890kLmNoP');
    const mixed = await noSecretsCheck(tmpDir);
    expect(mixed.status).toBe('fail');

    // The all-caps form of an equally-high-entropy value must reach the SAME verdict.
    writeSkill(`secret = ${ALLCAPS_SECRET}`);
    const upper = await noSecretsCheck(tmpDir);
    expect(upper.status).toBe(mixed.status);
  });
});

describe('noSecretsCheck still skips genuine placeholders (R2 fix introduces no false positives)', () => {
  const placeholders: Array<[string, string]> = [
    ['YOUR_TOKEN word-prefix', 'api_key = YOUR_TOKEN_HERE'],
    ['angle-bracket', 'password = <your-password>'],
    ['changeme word', 'secret = changeme'],
    ['ALL_CAPS_VALUE underscored word-combo', 'token = ALL_CAPS_VALUE'],
    // A plain all-caps English word (no digits, no underscore) is word-like, not a
    // token — it must remain a placeholder so the fix does not start over-flagging.
    ['plain CAPS word', 'secret = DESCRIPTION'],
    // An underscored word-combo that ALSO carries a digit (CONFIG_VALUE_2). The
    // underscore is what marks it word-like; this pins the underscore half of the
    // exemption so a mutant that drops it (and would over-flag this) is caught.
    ['underscored word-combo with a digit', 'token = CONFIG_VALUE_2'],
  ];

  it.each(placeholders)('does NOT flag %s', async (_label, body) => {
    writeSkill(body);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });
});

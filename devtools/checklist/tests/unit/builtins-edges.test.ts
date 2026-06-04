import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { nameFormatCheck } from '../../src/builtins/name-format.js';
import { descriptionPresentCheck, descriptionLengthCheck } from '../../src/builtins/description.js';
import { noSecretsCheck } from '../../src/builtins/no-secrets.js';
import { fileRefsCheck } from '../../src/builtins/file-refs.js';
import { hasChecklistCheck } from '../../src/builtins/has-checklist.js';
import { lineCountCheck } from '../../src/builtins/line-count.js';
import { frontmatterCheck } from '../../src/builtins/frontmatter.js';

// ── Helpers ──────────────────────────────────────────────────────────
//
// These tests target BOUNDARY / blind-spot cases NOT covered by
// builtins.test.ts. Classicist stance: real temp dirs, real fs, no mocking.

function writeSkill(dir: string, content: string): void {
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf-8');
}

function mkTmp(label: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${label}-`));
}

// ── no-secrets: placeholders NOT flagged, new token shapes ARE ────────

describe('noSecretsCheck — placeholders vs standalone tokens (edges)', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('no-secrets-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  // PLACEHOLDER_RE / isPlaceholder: each of these value shapes must be
  // recognized as a documentation placeholder and therefore NOT flagged.
  // Breaking any alternative in PLACEHOLDER_RE turns one of these red.
  it('does NOT flag an angle-bracket <secret> placeholder', async () => {
    // value "<secret>" is 8 chars (meets the >=8 assignment threshold) but
    // matches [<{].*[>}] in PLACEHOLDER_RE -> skipped.
    writeSkill(tmpDir, '---\nname: doc\n---\npassword: <secret>\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('does NOT flag a ${ENV} shell-expansion placeholder', async () => {
    // matches the \$\{ alternative in PLACEHOLDER_RE.
    writeSkill(tmpDir, '---\nname: doc\n---\ntoken: ${ENV}_VALUE\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('does NOT flag a YOUR_TOKEN placeholder value', async () => {
    // matches the your[_-] alternative in PLACEHOLDER_RE.
    writeSkill(tmpDir, '---\nname: doc\n---\napi_key: YOUR_TOKEN_GOES_HERE\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('does NOT flag a changeme placeholder value', async () => {
    writeSkill(tmpDir, '---\nname: doc\n---\nsecret: changeme_now\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('does NOT flag an ALL_CAPS_VALUE placeholder', async () => {
    // ALL_CAPS_VALUE does not match PLACEHOLDER_RE alternatives but is caught
    // by the /^[A-Z][A-Z0-9_]+$/ ALL-CAPS guard in isPlaceholder().
    writeSkill(tmpDir, '---\nname: doc\n---\ntoken: ALL_CAPS_VALUE\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('does NOT flag an "example"-prefixed placeholder value', async () => {
    // matches the example alternative in PLACEHOLDER_RE.
    writeSkill(tmpDir, '---\nname: doc\n---\npassword: example-placeholder-pw\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  // A real, non-placeholder assignment value still gets flagged. This pins the
  // negative side: the ALL-CAPS / placeholder guards must not swallow real ones.
  it('DOES flag a real mixed-case token assignment value', async () => {
    writeSkill(tmpDir, '---\nname: bad\n---\ntoken: realLongSecretValue123\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('L4: Token/Secret assignment');
  });

  // Standalone token shapes added recently — none of these are in builtins.test.ts.
  // Each pins the exact finding label so a mislabel/removed-pattern goes red.
  it('flags a standalone Slack token with exact label', async () => {
    const slack = 'xoxb-' + '1'.repeat(12);
    writeSkill(tmpDir, '---\nname: bad\n---\n' + slack + '\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('L4: Slack Token');
  });

  it('flags a standalone OpenAI sk- key with exact label', async () => {
    const sk = 'sk-' + 'a'.repeat(24);
    writeSkill(tmpDir, '---\nname: bad\n---\n' + sk + '\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('L4: OpenAI Key');
  });

  it('flags a standalone Google AIza API key with exact label', async () => {
    const google = 'AIza' + 'B'.repeat(35);
    writeSkill(tmpDir, '---\nname: bad\n---\n' + google + '\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('L4: Google API Key');
  });

  it('still flags the AKIA...EXAMPLE AWS key as a standalone token', async () => {
    // AKIA + 16 [0-9A-Z]; "IOSFODNN7EXAMPLE" is exactly 16 chars.
    writeSkill(tmpDir, '---\nname: bad\n---\nAKIAIOSFODNN7EXAMPLE\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('L4: AWS Access Key');
  });
});

// ── file-refs: title links, fragments, anchors ───────────────────────

describe('fileRefsCheck — link-target parsing edges', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('file-refs-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  // The optional Markdown title is stripped: `[x](a.md "t")` resolves to a.md.
  it('a titled link resolves to the path with the title stripped', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '# A', 'utf-8');
    writeSkill(tmpDir, '---\nname: t\n---\nSee [x](a.md "t").\n');
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 refs valid');
  });

  // A `#fragment` suffix on a local path is stripped: `[x](a.md#sec)` resolves to a.md.
  it('a fragment link a.md#sec resolves to a.md (fragment stripped)', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '# A', 'utf-8');
    writeSkill(tmpDir, '---\nname: t\n---\nSee [x](a.md#sec).\n');
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 refs valid');
  });

  // Pure in-page anchor (target STARTS with #) IS correctly skipped by the
  // (?!#) lookahead — distinct from the a.md#sec case above.
  it('skips a pure in-page #anchor target (no file reference)', async () => {
    writeSkill(tmpDir, '---\nname: t\n---\nJump to [top](#heading).\n');
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no file references');
  });

  // Plain local ref to a file that DOES exist -> the happy boundary for the
  // "1 ref valid" count message (single-ref, not the 2-ref case already tested).
  it('passes for a single plain local ref that exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'a.md'), '# A', 'utf-8');
    writeSkill(tmpDir, '---\nname: t\n---\nSee [x](a.md).\n');
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 refs valid');
  });
});

// ── name-format: non-string, exact-64 boundary ───────────────────────

describe('nameFormatCheck — type and length boundaries', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('name-format-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('fails when name is a non-string (YAML number)', async () => {
    // gray-matter parses `name: 123` as the number 123 -> typeof !== 'string'.
    writeSkill(tmpDir, '---\nname: 123\n---\n# Skill');
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('name must be a string');
  });

  it('passes at exactly 64 chars (the length boundary, inclusive)', async () => {
    // builtins.test.ts only checks 65 (over). 64 must still PASS: the check is
    // `name.length > MAX_LENGTH`, so 64 is allowed.
    const name = 'a'.repeat(64);
    writeSkill(tmpDir, `---\nname: ${name}\n---\n# Skill`);
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe(`"${name}", 64 chars`);
  });

  it('reports invalid chars BEFORE the length check for an over-long invalid name', async () => {
    // 70 chars containing an uppercase letter: NAME_RE fails first, so the
    // message is the invalid-characters one (not the length one). Pins ordering.
    const name = 'A'.repeat(70);
    writeSkill(tmpDir, `---\nname: ${name}\n---\n# Skill`);
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe(`invalid characters: "${name}"`);
  });
});

// ── description: non-string, present-but-long, length-only typing ─────

describe('descriptionPresentCheck — type and unbounded length', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('desc-present-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('fails when description is a non-string (YAML number)', async () => {
    writeSkill(tmpDir, '---\nname: t\ndescription: 42\n---\n# Skill');
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('description must be a string');
  });

  it('fails when description is whitespace-only (trim -> empty)', async () => {
    // "   " is truthy but desc.trim().length === 0 -> empty branch.
    writeSkill(tmpDir, '---\nname: t\ndescription: "   "\n---\n# Skill');
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('description is empty');
  });

  it('PASSES for a very long present description (presence has no upper bound)', async () => {
    // descriptionPresentCheck only checks presence; length is the OTHER check's
    // job. A 2000-char description must still pass here and report its length.
    const desc = 'x'.repeat(2000);
    writeSkill(tmpDir, `---\nname: t\ndescription: "${desc}"\n---\n# Skill`);
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('2000 chars');
  });
});

describe('descriptionLengthCheck — non-string fields coerced to empty', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('desc-length-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('treats a non-string description as empty (0 length) rather than failing', async () => {
    // `typeof data.description === 'string' ? ... : ''` -> a numeric description
    // contributes 0 to the total. Pins the typeof guard in descriptionLengthCheck.
    writeSkill(tmpDir, '---\nname: t\ndescription: 999\n---\n# Skill');
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('0/1536 chars');
  });

  it('fails one char over the combined limit (1537/1536)', async () => {
    // Boundary just above MAX_COMBINED: builtins.test.ts checks 1536 (pass) and
    // 1600 (fail); 1537 pins the strict `> 1536` edge.
    const desc = 'a'.repeat(1000);
    const when = 'b'.repeat(537);
    writeSkill(tmpDir, `---\ndescription: "${desc}"\nwhen_to_use: "${when}"\n---\n# Skill`);
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('1537/1536 chars');
  });
});

// ── frontmatter: exact single-field boundary ─────────────────────────

describe('frontmatterCheck — single-field boundary', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('frontmatter-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('passes with exactly one field (fieldCount === 1, boundary above 0)', async () => {
    // builtins.test.ts covers 0 fields (fail) and 2 fields (pass). One field is
    // the inclusive boundary of `fieldCount === 0` -> must pass with count 1.
    writeSkill(tmpDir, '---\nname: solo\n---\n# Skill');
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('parsed, 1 fields');
  });
});

// ── has-checklist: heading anchoring boundary ────────────────────────

describe('hasChecklistCheck — heading-anchor requirement', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('has-checklist-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('does NOT match a plain "CHECKLIST:" line that lacks a leading # heading marker', async () => {
    // CHECKLIST_RE requires ^#+\s*CHECKLIST: — a bare line is not a heading.
    writeSkill(tmpDir, '---\nname: t\n---\nCHECKLIST: not a heading\nmore text\n');
    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('no CHECKLIST section found');
  });

  it('matches a heading with no space after the # (#CHECKLIST:)', async () => {
    // \s* allows zero spaces between #+ and CHECKLIST:.
    writeSkill(tmpDir, '---\nname: t\n---\n#CHECKLIST: tight\n- [ ] x\n');
    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 checklist sections');
  });

  it('does NOT match CHECKLIST: that appears mid-line after other text', async () => {
    // ^ anchor (with m flag) requires it at line start; "see ## CHECKLIST:" is not.
    writeSkill(tmpDir, '---\nname: t\n---\nsee ## CHECKLIST: inline\n');
    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('no CHECKLIST section found');
  });
});

// ── line-count: tiny-file boundaries ─────────────────────────────────

describe('lineCountCheck — small-file boundaries', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = mkTmp('line-count-edge'); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('counts an empty file as 1 line (split("\\n") of "" yields ["" ])', async () => {
    writeSkill(tmpDir, '');
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 lines');
  });

  it('passes at 499 lines, just under the 500 limit', async () => {
    // builtins.test.ts covers 500 (pass) and 501 (fail); 499 pins the just-under edge.
    const content = Array.from({ length: 499 }, (_, i) => `L${i + 1}`).join('\n');
    writeSkill(tmpDir, content);
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('499 lines');
  });
});

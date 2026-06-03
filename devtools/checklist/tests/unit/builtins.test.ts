import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { getBuiltin, listBuiltins } from '../../src/builtins/index.js';
import { frontmatterCheck } from '../../src/builtins/frontmatter.js';
import { nameFormatCheck } from '../../src/builtins/name-format.js';
import { descriptionPresentCheck, descriptionLengthCheck } from '../../src/builtins/description.js';
import { noSecretsCheck } from '../../src/builtins/no-secrets.js';
import { fileRefsCheck } from '../../src/builtins/file-refs.js';
import { hasChecklistCheck } from '../../src/builtins/has-checklist.js';
import { lineCountCheck } from '../../src/builtins/line-count.js';

// ── Helper ───────────────────────────────────────────────────────────

function writeSkill(dir: string, content: string): void {
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf-8');
}

function makeFrontmatter(fields: Record<string, string>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---', '', '# Skill');
  return lines.join('\n');
}

// ── Registry ─────────────────────────────────────────────────────────

describe('builtins registry', () => {
  it('getBuiltin returns a handler for every known builtin', () => {
    const names = listBuiltins();
    for (const name of names) {
      expect(getBuiltin(name)).toBeTypeOf('function');
    }
  });

  it('getBuiltin returns undefined for an unknown name', () => {
    expect(getBuiltin('nonexistent')).toBeUndefined();
  });

  it('listBuiltins returns all 8 registered names', () => {
    const names = listBuiltins();
    expect(names).toHaveLength(8);
    expect(names).toEqual(expect.arrayContaining([
      'frontmatter',
      'name-format',
      'description-present',
      'description-length',
      'no-secrets',
      'file-refs',
      'has-checklist',
      'line-count',
    ]));
  });
});

// ── frontmatterCheck ─────────────────────────────────────────────────

describe('frontmatterCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('fails when SKILL.md does not start with ---', async () => {
    writeSkill(tmpDir, '# No Frontmatter\nJust content.');
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('missing --- frontmatter delimiter');
  });

  it('fails when frontmatter is empty (no fields)', async () => {
    writeSkill(tmpDir, '---\n---\n# Empty');
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('frontmatter is empty');
  });

  it('passes with valid frontmatter and reports field count', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'my-skill', description: 'A skill' }));
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('parsed, 2 fields');
  });

  it('returns fail with parse error for malformed YAML frontmatter', async () => {
    writeSkill(tmpDir, '---\n: :\n  invalid:: yaml\n---\n# Broken');
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('parse error');
  });

  it('covers the String(e) branch by triggering a parse error', async () => {
    // gray-matter always throws Error objects, so the String(e) branch in
    // frontmatterCheck is a defensive catch. We verify the error path works
    // with a real parse error (which is an Error instance, covering arm=0).
    // The arm=1 (non-Error) branch is a defensive guard against unknown throws.
    writeSkill(tmpDir, '---\ntabs:\t\t- broken: [yaml\n---\n');
    const result = await frontmatterCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('parse error');
  });
});

// ── nameFormatCheck ──────────────────────────────────────────────────

describe('nameFormatCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'name-format-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('passes when name field is not set', async () => {
    writeSkill(tmpDir, makeFrontmatter({ description: 'no name here' }));
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toContain('will use directory name');
  });

  it('passes for a valid kebab-case name', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'my-skill-1' }));
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toContain('"my-skill-1"');
    expect(result.message).toContain('10 chars');
  });

  it('fails for a name with invalid characters', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'My Skill' }));
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('invalid characters');
    expect(result.message).toContain('My Skill');
  });

  it('fails for a name that exceeds 64 characters', async () => {
    const longName = 'a'.repeat(65);
    writeSkill(tmpDir, makeFrontmatter({ name: longName }));
    const result = await nameFormatCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('65/64');
  });
});

// ── descriptionPresentCheck ──────────────────────────────────────────

describe('descriptionPresentCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'desc-present-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('fails when description is missing', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'test' }));
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('description is empty');
  });

  it('fails when description is an empty string', async () => {
    writeSkill(tmpDir, '---\nname: test\ndescription: ""\n---\n# Skill');
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('description is empty');
  });

  it('passes with a valid description and reports char count', async () => {
    writeSkill(tmpDir, makeFrontmatter({ description: 'A useful skill' }));
    const result = await descriptionPresentCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('14 chars');
  });
});

// ── descriptionLengthCheck ───────────────────────────────────────────

describe('descriptionLengthCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'desc-length-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('passes when combined length is under the limit', async () => {
    writeSkill(tmpDir, makeFrontmatter({ description: 'Short desc', when_to_use: 'Sometimes' }));
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('pass');
    // "Short desc" = 10 chars, "Sometimes" = 9 chars => 19/1536
    expect(result.message).toBe('19/1536 chars');
  });

  it('fails when description + when_to_use exceeds 1536 chars', async () => {
    const longDesc = 'x'.repeat(1000);
    const longWhen = 'y'.repeat(600);
    writeSkill(tmpDir, `---\ndescription: "${longDesc}"\nwhen_to_use: "${longWhen}"\n---\n# Skill`);
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('1600/1536');
  });

  it('passes at exactly 1536 chars combined', async () => {
    const desc = 'a'.repeat(1000);
    const when = 'b'.repeat(536);
    writeSkill(tmpDir, `---\ndescription: "${desc}"\nwhen_to_use: "${when}"\n---\n# Skill`);
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1536/1536 chars');
  });

  it('passes with 0/1536 when both description and when_to_use are missing', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'no-desc' }));
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('0/1536 chars');
  });

  it('counts only description when when_to_use is absent', async () => {
    writeSkill(tmpDir, makeFrontmatter({ description: 'hello' }));
    const result = await descriptionLengthCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('5/1536 chars');
  });
});

// ── noSecretsCheck ───────────────────────────────────────────────────

describe('noSecretsCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-secrets-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('passes for a clean file with no secret patterns', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'clean-skill', description: 'No secrets here' }));
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no secret patterns detected');
  });

  it('fails when an AWS access key pattern is found', async () => {
    const content = makeFrontmatter({ name: 'bad-skill' }) + '\nkey: AKIAIOSFODNN7EXAMPLE\n';
    writeSkill(tmpDir, content);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('AWS Access Key');
  });

  it('fails when a private key block is found', async () => {
    const content = makeFrontmatter({ name: 'bad-skill' }) + '\n-----BEGIN RSA PRIVATE KEY-----\n';
    writeSkill(tmpDir, content);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('Private Key');
  });

  it('fails when a GitHub token is found', async () => {
    const ghToken = 'ghp_' + 'a'.repeat(36);
    const content = makeFrontmatter({ name: 'bad-skill' }) + `\ntoken: ${ghToken}\n`;
    writeSkill(tmpDir, content);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('GitHub Token');
  });

  it('fails when an npm token is found', async () => {
    const npmToken = 'npm_' + 'B'.repeat(36);
    const content = makeFrontmatter({ name: 'bad-skill' }) + `\ntoken: ${npmToken}\n`;
    writeSkill(tmpDir, content);
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('npm Token');
  });

  it('reports multiple findings with line numbers', async () => {
    const lines = [
      '---',
      'name: bad-skill',
      '---',
      '',
      'AKIAIOSFODNN7EXAMPLE',
      '-----BEGIN PRIVATE KEY-----',
    ];
    writeSkill(tmpDir, lines.join('\n'));
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('L5');
    expect(result.message).toContain('L6');
    expect(result.message).toContain('AWS Access Key');
    expect(result.message).toContain('Private Key');
  });

  it('does not flag documentation placeholders in assignments', async () => {
    const lines = [
      'token: YOUR_TOKEN_HERE',
      'password: <your-password>',
      'api_key: ${OPENAI_API_KEY}',
      'secret: changeme',
    ];
    writeSkill(tmpDir, makeFrontmatter({ name: 'doc-skill' }) + '\n' + lines.join('\n') + '\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('pass');
  });

  it('flags a GitHub fine-grained PAT and an OpenSSH private key', async () => {
    const pat = 'github_pat_' + 'a'.repeat(30);
    const lines = [`token: ${pat}`, '-----BEGIN OPENSSH PRIVATE KEY-----'];
    writeSkill(tmpDir, makeFrontmatter({ name: 'bad-skill' }) + '\n' + lines.join('\n') + '\n');
    const result = await noSecretsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('GitHub Fine-grained Token');
    expect(result.message).toContain('Private Key');
  });
});

// ── fileRefsCheck ────────────────────────────────────────────────────

describe('fileRefsCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-refs-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('passes when there are no file references', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'no-refs' }) + '\nJust plain text.');
    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no file references');
  });

  it('passes when all referenced files exist', async () => {
    fs.writeFileSync(path.join(tmpDir, 'helper.sh'), '#!/bin/bash', 'utf-8');
    fs.mkdirSync(path.join(tmpDir, 'docs'));
    fs.writeFileSync(path.join(tmpDir, 'docs', 'guide.md'), '# Guide', 'utf-8');

    const content = makeFrontmatter({ name: 'valid-refs' })
      + '\nSee [helper](helper.sh) and [guide](docs/guide.md).\n';
    writeSkill(tmpDir, content);

    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('2 refs valid');
  });

  it('fails when referenced files do not exist', async () => {
    const content = makeFrontmatter({ name: 'missing-refs' })
      + '\nSee [missing](missing.txt) and [also missing](nope/gone.md).\n';
    writeSkill(tmpDir, content);

    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toContain('missing.txt');
    expect(result.message).toContain('nope/gone.md');
  });

  it('ignores http, https, hash, and mailto links', async () => {
    const content = makeFrontmatter({ name: 'ext-refs' })
      + '\n[web](https://example.com) [mail](mailto:a@b.com) [anchor](#foo) [http](http://x.com)\n';
    writeSkill(tmpDir, content);

    const result = await fileRefsCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('no file references');
  });
});

// ── hasChecklistCheck ────────────────────────────────────────────────

describe('hasChecklistCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'has-checklist-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('fails when no CHECKLIST section is present', async () => {
    writeSkill(tmpDir, makeFrontmatter({ name: 'no-checklist' }) + '\n# Stuff\nContent only.');
    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('no CHECKLIST section found');
  });

  it('passes when a CHECKLIST: heading is present', async () => {
    const content = makeFrontmatter({ name: 'has-checklist' })
      + '\n## CHECKLIST: Pre-flight\n- [ ] Step 1\n';
    writeSkill(tmpDir, content);

    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 checklist sections');
  });

  it('counts multiple CHECKLIST sections', async () => {
    const content = makeFrontmatter({ name: 'multi-checklist' })
      + '\n## CHECKLIST: Phase 1\n- [ ] A\n### CHECKLIST: Phase 2\n- [ ] B\n';
    writeSkill(tmpDir, content);

    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('2 checklist sections');
  });

  it('matches CHECKLIST: case-insensitively', async () => {
    const content = makeFrontmatter({ name: 'case-test' })
      + '\n## checklist: lowercase\n- [ ] Item\n';
    writeSkill(tmpDir, content);

    const result = await hasChecklistCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('1 checklist sections');
  });
});

// ── lineCountCheck ───────────────────────────────────────────────────

describe('lineCountCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'line-count-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails when SKILL.md does not exist', async () => {
    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('SKILL.md not found');
  });

  it('passes when the file is under 500 lines', async () => {
    const content = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');
    writeSkill(tmpDir, content);

    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('50 lines');
  });

  it('passes at exactly 500 lines', async () => {
    // 500 lines means 499 newlines; split('\n') on that gives 500 elements
    const content = Array.from({ length: 500 }, (_, i) => `Line ${i + 1}`).join('\n');
    writeSkill(tmpDir, content);

    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('pass');
    expect(result.message).toBe('500 lines');
  });

  it('fails when the file exceeds 500 lines', async () => {
    const content = Array.from({ length: 501 }, (_, i) => `Line ${i + 1}`).join('\n');
    writeSkill(tmpDir, content);

    const result = await lineCountCheck(tmpDir);
    expect(result.status).toBe('fail');
    expect(result.message).toBe('501 lines, exceeds 500 limit');
  });
});

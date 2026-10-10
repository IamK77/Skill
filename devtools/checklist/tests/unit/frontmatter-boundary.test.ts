import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCheck } from '../../src/runner.js';

const builtins = ['frontmatter', 'name-format', 'description-present', 'description-length', 'file-refs'];
const marker = '__checklistFrontmatterExecuted';
const globals = globalThis as unknown as Record<string, unknown>;

for (const builtin of builtins) describe(`${builtin}: data-only frontmatter`, () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-boundary-'));
    delete globals[marker];
  });
  afterEach(() => {
    delete globals[marker];
    fs.rmSync(dir, { recursive: true });
  });
  function check(raw: string) {
    fs.writeFileSync(path.join(dir, 'SKILL.md'), raw);
    return runCheck({ id: 'metadata', description: 'Inspect metadata', verify: `builtin:${builtin}` }, dir, dir);
  }

  it('accepts ordinary YAML metadata', async () => {
    const result = await check('---\nname: safe-skill\ndescription: Safe data.\n---\n# Body\n');
    expect(result.result?.status).toBe('pass');
  });

  it.each(['javascript', 'js', '\ufeffjavascript'])('rejects %s without executing it', async (language) => {
    const bom = language.startsWith('\ufeff') ? '\ufeff' : '';
    const label = language.replace('\ufeff', '');
    // Distinct content avoids the old parser's content cache masking execution.
    // The payload changes only a boolean in this test process, never files/network.
    const raw = `${bom}---${label}\n({ name: 'safe-skill', description: '${builtin} ${language}', marker: (globalThis.${marker} = true) })\n---\n# Body\n`;
    const result = await check(raw);
    expect(globals[marker], `${builtin} executed the document`).toBeUndefined();
    expect(result.result?.status).toMatch(/^(fail|error)$/);
  });

  it('rejects unsupported language labels even when their body is valid YAML', async () => {
    const result = await check('---javascript\nname: safe-skill\ndescription: Data is not a language opt-in.\n---\n');
    expect(result.result?.status).toMatch(/^(fail|error)$/);
  });

  it.each(['[one, two]', 'plain scalar', '42', 'false', 'null', '2026-10-10'])('rejects a non-mapping root: %s', async (value) => {
    expect((await check(`---\n${value}\n---\n`)).result?.status).toMatch(/^(fail|error)$/);
  });

  it('rejects an unterminated header rather than accepting partial metadata', async () => {
    expect((await check('---\nname: safe-skill\ndescription: Missing closing delimiter.\n')).result?.status).toMatch(/^(fail|error)$/);
  });
});

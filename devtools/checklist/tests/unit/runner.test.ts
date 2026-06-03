import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCheck } from '../../src/runner.js';
import type { CheckItem } from '../../src/types.js';

describe('runCheck', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeItem(overrides: Partial<CheckItem> = {}): CheckItem {
    return {
      id: 'test-item',
      description: 'A test check item',
      ...overrides,
    };
  }

  // ── 1. No verify → manual ──────────────────────────────────────────

  it('returns manual kind with no result when verify is undefined', async () => {
    const item = makeItem({ verify: undefined });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.item).toBe(item);
    expect(result.kind).toBe('manual');
    expect(result.result).toBeUndefined();
  });

  // ── 2. Shell command (implicit) ────────────────────────────────────

  it('runs an implicit shell command and returns pass with stdout', async () => {
    const item = makeItem({ verify: 'echo hello' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('hello');
  });

  // ── 3. Failing shell command ───────────────────────────────────────

  it('returns fail status for a shell command that exits non-zero', async () => {
    const item = makeItem({ verify: 'shell:false' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('fail');
  });

  // ── 4. Explicit shell prefix ───────────────────────────────────────

  it('runs a command with explicit "shell:" prefix and returns pass', async () => {
    const item = makeItem({ verify: 'shell:echo test' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('test');
  });

  // ── 5. Builtin prefix (real builtin) ──────────────────────────────

  it('dispatches to a real builtin when "builtin:" prefix is used', async () => {
    // Create a SKILL.md with valid frontmatter for the frontmatter builtin
    const skillContent = [
      '---',
      'name: test-skill',
      'description: A test skill',
      '---',
      '',
      '# Test Skill',
    ].join('\n');
    fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), skillContent, 'utf-8');

    const item = makeItem({ verify: 'builtin:frontmatter' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('parsed');
  });

  // ── 6. Unknown builtin ─────────────────────────────────────────────

  it('returns error status for an unknown builtin name', async () => {
    const item = makeItem({ verify: 'builtin:nonexistent' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('error');
    expect(result.result!.message).toContain('unknown builtin "nonexistent"');
    expect(result.result!.message).toContain('available:');
  });

  // ── 7. Explicit script prefix, file not found ─────────────────────

  it('returns error with "script not found" when explicit script: target is missing', async () => {
    const item = makeItem({ verify: 'script:./missing-script.sh' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('error');
    expect(result.result!.message).toContain('script not found');
  });

  // ── 8. Auto-classified script (path-like), file not found ─────────

  it('returns error with "auto-classified as script" hint when path-like verify is missing', async () => {
    const item = makeItem({ verify: './scripts/check.sh' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('error');
    expect(result.result!.message).toContain('auto-classified as script');
    expect(result.result!.message).toContain('shell:');
  });

  // ── 9. Auto-classified script that exists and runs ─────────────────

  it('runs an auto-classified script that exists and returns pass', async () => {
    const scriptPath = path.join(tmpDir, 'check.sh');
    fs.writeFileSync(scriptPath, '#!/bin/bash\necho "script ok"', 'utf-8');
    fs.chmodSync(scriptPath, 0o755);

    const item = makeItem({ verify: './check.sh' });
    const result = await runCheck(item, tmpDir, tmpDir);

    expect(result.kind).toBe('mechanical');
    expect(result.result).toBeDefined();
    expect(result.result!.status).toBe('pass');
    expect(result.result!.message).toContain('script ok');
  });

  // ── 10. Classification behavior tests ──────────────────────────────

  describe('classification behavior (tested indirectly via runCheck)', () => {
    it('classifies "builtin:foo" as builtin', async () => {
      // A builtin that does not exist proves it went through the builtin path
      const item = makeItem({ verify: 'builtin:foo' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('unknown builtin "foo"');
    });

    it('classifies "shell:ls" as shell', async () => {
      const item = makeItem({ verify: 'shell:ls' });
      const result = await runCheck(item, tmpDir, tmpDir);

      // ls in a valid directory should pass
      expect(result.result!.status).toBe('pass');
    });

    it('classifies "script:./run.sh" as script', async () => {
      // Explicit script prefix → script path, file not found → "script not found"
      const item = makeItem({ verify: 'script:./run.sh' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('script not found');
    });

    it('classifies "echo hello" as implicit shell', async () => {
      const item = makeItem({ verify: 'echo hello' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('hello');
    });

    it('classifies "./scripts/test.sh" as script (contains /)', async () => {
      const item = makeItem({ verify: './scripts/test.sh' });
      const result = await runCheck(item, tmpDir, tmpDir);

      // Goes through script path → file not found → auto-classified hint
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('auto-classified as script');
    });

    it('classifies "test.sh" as script (has .sh extension)', async () => {
      const item = makeItem({ verify: 'test.sh' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('auto-classified as script');
    });

    it('classifies "test.py" as script (has .py extension)', async () => {
      const item = makeItem({ verify: 'test.py' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('auto-classified as script');
    });

    it('classifies "ls -la" as implicit shell', async () => {
      const item = makeItem({ verify: 'ls -la' });
      const result = await runCheck(item, tmpDir, tmpDir);

      // ls should succeed in the temp directory
      expect(result.result!.status).toBe('pass');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns "OK" message when shell command produces no stdout', async () => {
      const item = makeItem({ verify: 'true' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toBe('OK');
    });

    it('runs an explicit script that exists', async () => {
      const scriptPath = path.join(tmpDir, 'my-check.sh');
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho "explicit script pass"', 'utf-8');
      fs.chmodSync(scriptPath, 0o755);

      const item = makeItem({ verify: `script:${scriptPath}` });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('explicit script pass');
    });

    it('captures stderr on failure', async () => {
      const item = makeItem({ verify: 'shell:echo "oops" >&2 && false' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('fail');
      expect(result.result!.message).toContain('oops');
    });

    it('falls back to "command failed" when stderr and message are both empty', async () => {
      const item = makeItem({ verify: 'shell:exit 1' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('fail');
      expect(result.result!.message.length).toBeGreaterThan(0);
    });

    it('uses cwd for shell command execution', async () => {
      // Create a unique file in tmpDir and verify it appears in ls output
      const marker = `marker-${Date.now()}.txt`;
      fs.writeFileSync(path.join(tmpDir, marker), '', 'utf-8');

      const item = makeItem({ verify: `ls ${marker}` });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain(marker);
    });

    it('preserves the original item reference in the result', async () => {
      const item = makeItem({ id: 'ref-check', verify: 'echo ok' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.item).toBe(item);
      expect(result.item.id).toBe('ref-check');
    });

    it('rejects a script path that escapes the checklist dir via ".."', async () => {
      const item = makeItem({ verify: 'script:../../../etc/passwd' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
    });

    it('rejects an absolute script path outside the checklist dir', async () => {
      const item = makeItem({ verify: 'script:/etc/passwd' });
      const result = await runCheck(item, tmpDir, tmpDir);

      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
    });
  });
});

// Boundary / blind-spot suite for src/runner.ts — focused on the RCE containment
// boundary in runScript(), prefix vs auto-classification edges, runShell exit/stderr
// handling (incl. the real timeout path), runBuiltin unknown-name, and call-it-twice
// (overwrite / idempotent) state probes.
//
// Conventions: globals enabled (no vitest imports); REAL temp dirs + real fs; spies
// via vi.spyOn restored in afterEach. No fs mocking. This file does NOT duplicate the
// cases already covered in runner.test.ts — it targets the gaps coverage can't see.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCheck } from '../../src/runner.js';
import type { CheckItem } from '../../src/types.js';

describe('runner containment + classification boundaries', () => {
  let tmpDir: string;

  beforeEach(() => {
    // realpathSync to defeat macOS /var -> /private/var symlink: runner uses
    // path.resolve (lexical) and path.relative against the cwd we pass, so the
    // cwd itself does not need canonicalizing for containment math — but using
    // the canonical path keeps fs.existsSync and assertions consistent.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runner-contain-')));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeItem(verify?: string): CheckItem {
    return { id: 'it', description: 'd', verify };
  }

  function makeScript(relName: string, body: string): string {
    const p = path.join(tmpDir, relName);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, `#!/bin/bash\n${body}\n`, 'utf-8');
    fs.chmodSync(p, 0o755);
    return p;
  }

  // ───────────────────────────── CONTAINMENT (the RCE boundary) ──────────────
  describe('runScript containment boundary', () => {
    // ── ALLOW side ──

    it('ALLOWS an absolute path that resolves INSIDE the checklist dir', async () => {
      const abs = makeScript('inside.sh', 'echo abs-inside-ok');
      // abs is /tmp/.../inside.sh — absolute, but inside `base`.
      const result = await runCheck(makeItem(`script:${abs}`), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('abs-inside-ok');
    });

    it('ALLOWS a ".." that resolves BACK INSIDE the dir (sub/../file.sh)', async () => {
      // sub/../back.sh canonicalizes to <base>/back.sh — rel === "back.sh", contained.
      makeScript('back.sh', 'echo back-inside-ok');
      fs.mkdirSync(path.join(tmpDir, 'sub'), { recursive: true });
      const result = await runCheck(makeItem('script:sub/../back.sh'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('back-inside-ok');
    });

    it('ALLOWS a relative path that climbs out then re-enters by the same dir name', async () => {
      // ../<basename>/x.sh — path.resolve cancels the .. against the basename,
      // landing back inside base (rel === "x.sh"). This is the subtle "looks like
      // an escape, isn't one" case.
      makeScript('x.sh', 'echo reenter-ok');
      const baseName = path.basename(tmpDir);
      const verify = `script:../${baseName}/x.sh`;
      const result = await runCheck(makeItem(verify), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('reenter-ok');
    });

    // ── REJECT side ──

    it('REJECTS exactly ".." (the parent directory itself, rel === "..")', async () => {
      // Distinct from ../foo: this hits the `rel === '..'` branch precisely.
      const result = await runCheck(makeItem('script:..'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
    });

    it('REJECTS a single-level "../sibling.sh" escape (rel starts with "../")', async () => {
      const result = await runCheck(makeItem('script:../sibling.sh'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
      // The error message echoes the resolved absolute path for diagnostics.
      expect(result.result!.message).toContain('resolved to');
    });

    it('REJECTS an absolute path OUTSIDE the dir even when that file exists', async () => {
      // /etc/hosts reliably exists on macOS — proves rejection is by containment,
      // not by existence (we must fail BEFORE the existsSync check).
      const result = await runCheck(makeItem('script:/etc/hosts'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
    });

    it('rejection wins over existence: a deep ".." escape to a real file is still error', async () => {
      const result = await runCheck(makeItem('script:../../../../etc/hosts'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('escapes the checklist dir');
    });

    // ── BOUNDARY: rel === "" (the dir itself) ──

    it('treats "script:." (the dir itself, rel === "") as contained, then fails to exec the directory', async () => {
      // rel === "" passes all three reject predicates (not "..", not "../",
      // not absolute). existsSync(dir) is true, so runShell tries to execute the
      // directory as a command → bash reports "is a directory" → fail (not error).
      const result = await runCheck(makeItem('script:.'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      // Pinning: it reached runShell (a containment/not-found path would be 'error').
    });

    // ── THE SYMLINK PROBE: lexical resolve, not realpath ──

    it('a symlink INSIDE the dir pointing OUTSIDE is rejected by canonical containment, NOT executed', async () => {
      // The lexical path.resolve check (rel === "link.sh") does not catch this, but
      // runScript now re-checks the realpath-resolved path, so a symlink that
      // escapes the dir is rejected and the outside script never runs.
      const outsideDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runner-outside-')));
      try {
        const target = path.join(outsideDir, 'evil.sh');
        fs.writeFileSync(target, '#!/bin/bash\necho SYMLINK-ESCAPE-EXECUTED\n', 'utf-8');
        fs.chmodSync(target, 0o755);
        fs.symlinkSync(target, path.join(tmpDir, 'link.sh'));

        const result = await runCheck(makeItem('script:./link.sh'), tmpDir, tmpDir);

        expect(result.result!.status).toBe('error');
        expect(result.result!.message).toContain('escapes the checklist dir');
        expect(result.result!.message).not.toContain('SYMLINK-ESCAPE-EXECUTED');
      } finally {
        fs.rmSync(outsideDir, { recursive: true, force: true });
      }
    });

    it('a symlink INSIDE the dir pointing to another file INSIDE is allowed and executed', async () => {
      const realTarget = path.join(tmpDir, 'real.sh');
      fs.writeFileSync(realTarget, '#!/bin/bash\necho INSIDE-SYMLINK-OK\n', 'utf-8');
      fs.chmodSync(realTarget, 0o755);
      fs.symlinkSync(realTarget, path.join(tmpDir, 'alias.sh'));

      const result = await runCheck(makeItem('script:./alias.sh'), tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('INSIDE-SYMLINK-OK');
    });
  });

  // ──────────────── SCRIPT PATH QUOTING (argv exec, not shell string) ────────
  describe('script paths with spaces/metacharacters are exec\'d as argv, not interpolated', () => {
    // Pre-fix, runScript handed the RESOLVED PATH to bash as a command STRING:
    // a dir with a space word-split into a wrong command, and $(...) in a path
    // was command-substituted. The path is now an execFileSync argv element.

    it('runs a script whose checklist dir contains a SPACE', async () => {
      const spaced = path.join(tmpDir, 'dir with space');
      fs.mkdirSync(spaced, { recursive: true });
      const p = path.join(spaced, 'run.sh');
      fs.writeFileSync(p, '#!/bin/bash\necho SPACED-OK\n', 'utf-8');
      fs.chmodSync(p, 0o755);

      const result = await runCheck(makeItem('script:./run.sh'), spaced, spaced);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('SPACED-OK');
    });

    it('runs a script whose FILENAME contains a space', async () => {
      const p = path.join(tmpDir, 'my check.sh');
      fs.writeFileSync(p, '#!/bin/bash\necho FILENAME-SPACE-OK\n', 'utf-8');
      fs.chmodSync(p, 0o755);

      const result = await runCheck(makeItem('script:./my check.sh'), tmpDir, tmpDir);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('FILENAME-SPACE-OK');
    });

    it('does NOT shell-interpret metacharacters in the resolved path ($(…) stays literal)', async () => {
      const evil = path.join(tmpDir, 'meta-$(touch ESCAPED)');
      fs.mkdirSync(evil, { recursive: true });
      const p = path.join(evil, 'run.sh');
      fs.writeFileSync(p, '#!/bin/bash\necho META-OK\n', 'utf-8');
      fs.chmodSync(p, 0o755);

      const result = await runCheck(makeItem('script:./run.sh'), evil, evil);

      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('META-OK');
      // The command-substitution payload must never have run.
      expect(fs.existsSync(path.join(evil, 'ESCAPED'))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, 'ESCAPED'))).toBe(false);
    });
  });

  // ───────────────────────────── CLASSIFICATION ─────────────────────────────
  describe('classifyVerify dispatch', () => {
    it('prefix beats heuristic: "shell:has/a/slash" runs as SHELL, not script', async () => {
      // The value contains "/" which would auto-classify as script, but the
      // explicit shell: prefix must win. "echo a/b" prints a/b and passes.
      const result = await runCheck(makeItem('shell:echo a/b/c'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('a/b/c');
    });

    it('explicit prefix value is TRIMMED ("builtin:  frontmatter " → frontmatter)', async () => {
      fs.writeFileSync(
        path.join(tmpDir, 'SKILL.md'),
        ['---', 'name: t', 'description: d', '---', '', '# T'].join('\n'),
        'utf-8',
      );
      const result = await runCheck(makeItem('builtin:  frontmatter  '), tmpDir, tmpDir);
      // If trim were missing the builtin name would be "  frontmatter  " → unknown.
      expect(result.result!.status).toBe('pass');
    });

    it('auto-classifies "scripts/run" (slash, NO extension) as script', async () => {
      // First token contains "/" → script even without a script extension.
      const result = await runCheck(makeItem('scripts/run'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('auto-classified as script');
    });

    it('auto-classifies "build.ts" (.ts) and "x.js" (.js) and "x.bash" (.bash) as script', async () => {
      for (const v of ['build.ts', 'x.js', 'x.bash']) {
        const result = await runCheck(makeItem(v), tmpDir, tmpDir);
        expect(result.result!.status).toBe('error');
        expect(result.result!.message).toContain('auto-classified as script');
      }
    });

    it('extension match is on the FIRST TOKEN only: "echo done.sh extra" → script (token "echo"? no)', async () => {
      // firstToken = "echo" (no slash, no ext) → SHELL, even though a later token
      // ends in .sh. Pins that the regex tests split(/\s/)[0], not the whole string.
      const result = await runCheck(makeItem('echo done.sh'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toContain('done.sh');
    });

    it('a command whose FIRST token ends in .sh IS classified as script ("clean.sh --flag")', async () => {
      // Contrast with the previous case: here the first token is "clean.sh".
      const result = await runCheck(makeItem('clean.sh --flag'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('auto-classified as script');
    });

    it('a bare command with a dotted name but non-script extension stays SHELL ("a.txt")', async () => {
      // .txt is not in (sh|bash|ts|js|py); no slash → SHELL. Running "a.txt" as a
      // command fails (not found) → fail, NOT the script "not found" error.
      const result = await runCheck(makeItem('a.txt'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message).not.toContain('auto-classified as script');
    });

    it('case sensitivity: uppercase ".SH" is NOT a script extension → SHELL', async () => {
      // The regex has no /i flag. "X.SH" → no slash, no lowercase ext → shell,
      // which then fails as an unknown command.
      const result = await runCheck(makeItem('X.SH'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message).not.toContain('auto-classified as script');
    });
  });

  // ───────────────────────────── runShell exit / stderr ─────────────────────
  describe('runShell exit-code + stderr handling', () => {
    it('non-zero exit with stdout-only message: stderr empty → falls back to err.message', async () => {
      // `echo info; exit 3` writes to stdout then exits 3. execSync throws; stderr
      // is empty, so detail comes from err.message (non-empty). status = fail.
      const result = await runCheck(makeItem('shell:echo info; exit 3'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message.length).toBeGreaterThan(0);
    });

    it('prefers stderr over message when stderr is present', async () => {
      const result = await runCheck(
        makeItem('shell:echo "STDERR-MARKER" >&2; exit 1'),
        tmpDir,
        tmpDir,
      );
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message).toContain('STDERR-MARKER');
    });

    it('trims surrounding whitespace from the pass message', async () => {
      const result = await runCheck(makeItem('shell:printf "  padded  \\n"'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('pass');
      expect(result.result!.message).toBe('padded');
    });

    it('a process killed by a SIGNAL (empty stderr) is reported as fail via message fallback', async () => {
      // Deterministic stand-in for an abnormally-terminated child: self-SIGTERM.
      // stderr is empty, err.message is non-empty → fail with non-empty detail.
      const result = await runCheck(makeItem('shell:kill -TERM $$'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message.length).toBeGreaterThan(0);
    });

    it('the REAL 10s timeout path: a command exceeding EXEC_TIMEOUT fails (ETIMEDOUT)', async () => {
      // EXEC_TIMEOUT is hardcoded at 10_000ms and not injectable, so this is a
      // genuinely slow test. `sleep 30` blows past it; execSync throws ETIMEDOUT
      // with empty stderr → message fallback → fail. Pins that the timeout option
      // is wired into runShell.
      const result = await runCheck(makeItem('shell:sleep 30'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('fail');
      expect(result.result!.message.length).toBeGreaterThan(0);
    }, 20_000);
  });

  // ───────────────────────────── runBuiltin unknown name ────────────────────
  describe('runBuiltin', () => {
    it('lists the REAL available builtins in the unknown-name error', async () => {
      const result = await runCheck(makeItem('builtin:does-not-exist'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('unknown builtin "does-not-exist"');
      // The "available" list must name a builtin that actually exists in the registry.
      expect(result.result!.message).toMatch(/available:.*frontmatter/);
    });

    it('an empty builtin name ("builtin:") is unknown, not a silent pass', async () => {
      // value === "" after trim; getBuiltin("") is undefined → error.
      const result = await runCheck(makeItem('builtin:'), tmpDir, tmpDir);
      expect(result.result!.status).toBe('error');
      expect(result.result!.message).toContain('unknown builtin ""');
    });
  });

  // ───────────────────────────── CALL-IT-TWICE / state probes ───────────────
  describe('call-it-twice & purity', () => {
    it('runScript is idempotent: same contained script run twice yields identical pass results', async () => {
      makeScript('idem.sh', 'echo idem-run');
      const item = makeItem('script:./idem.sh');
      const a = await runCheck(item, tmpDir, tmpDir);
      const b = await runCheck(item, tmpDir, tmpDir);
      expect(a.result).toEqual(b.result);
      expect(a.result!.status).toBe('pass');
      expect(a.result!.message).toContain('idem-run');
    });

    it('does not mutate the input item (same reference, verify unchanged) across two calls', async () => {
      const item = makeItem('shell:echo stable');
      const before = item.verify;
      const r1 = await runCheck(item, tmpDir, tmpDir);
      const r2 = await runCheck(item, tmpDir, tmpDir);
      expect(r1.item).toBe(item);
      expect(r2.item).toBe(item);
      expect(item.verify).toBe(before); // classifyVerify's .trim() must not write back
    });

    it('write-then-rerun: a script created AFTER a failed lookup is found on the second call', async () => {
      // Mirrors a real workflow (author adds the script, re-runs). First call: not
      // found (error). Second call after writing the file: pass. Proves runner
      // re-stats the filesystem each call rather than caching a miss.
      const item = makeItem('script:./late.sh');
      const first = await runCheck(item, tmpDir, tmpDir);
      expect(first.result!.status).toBe('error');
      expect(first.result!.message).toContain('script not found');

      makeScript('late.sh', 'echo arrived-late');
      const second = await runCheck(item, tmpDir, tmpDir);
      expect(second.result!.status).toBe('pass');
      expect(second.result!.message).toContain('arrived-late');
    });

    it('explicit-vs-auto not-found hints differ for the SAME missing path', async () => {
      // Same resolved path, two classification origins → two distinct messages.
      const explicit = await runCheck(makeItem('script:./ghost.sh'), tmpDir, tmpDir);
      const auto = await runCheck(makeItem('./ghost.sh'), tmpDir, tmpDir);
      expect(explicit.result!.status).toBe('error');
      expect(auto.result!.status).toBe('error');
      expect(explicit.result!.message).toContain('script not found');
      expect(explicit.result!.message).not.toContain('auto-classified');
      expect(auto.result!.message).toContain('auto-classified as script');
    });
  });
});

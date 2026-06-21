// Regression suite for the PER-SESSION active pointer (resolver.sessionTag /
// activePointerPath). The bug this fixes: a single machine-global
// `~/.config/checklist/active` meant one session's `init` (or a bare `reset` /
// self-heal unlink) silently repointed EVERY other concurrent session, so a
// flagless command in the victim resolved to the WRONG skill. Keying the pointer
// FILENAME by a stable session id gives each session its own file.
//
// Conventions mirror resolver-resolution.test.ts: globals on, real temp dirs +
// real fs, spy on process.cwd, CHECKLIST_HOME sandboxed per-test, the session-id
// envs saved+restored (tests/setup.ts deletes them, so original is "unset").

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { resolveDir, writeActivePointer, clearActivePointer } from '../../src/resolver.js';

const CONFIG_FILE = '.checklist.yml';

describe('per-session active pointer', () => {
  let tmpDir: string;
  const originalHome = process.env.CHECKLIST_HOME;
  const originalSessionId = process.env.CHECKLIST_SESSION_ID;
  const originalClaudeSession = process.env.CLAUDE_CODE_SESSION_ID;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-session-'));
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
    delete process.env.CHECKLIST_SESSION_ID;
    delete process.env.CLAUDE_CODE_SESSION_ID;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (originalHome !== undefined) process.env.CHECKLIST_HOME = originalHome;
    else delete process.env.CHECKLIST_HOME;
    if (originalSessionId !== undefined) process.env.CHECKLIST_SESSION_ID = originalSessionId;
    else delete process.env.CHECKLIST_SESSION_ID;
    if (originalClaudeSession !== undefined) process.env.CLAUDE_CODE_SESSION_ID = originalClaudeSession;
    else delete process.env.CLAUDE_CODE_SESSION_ID;
    vi.restoreAllMocks();
  });

  const home = (): string => process.env.CHECKLIST_HOME!;
  const fileExists = (name: string): boolean => fs.existsSync(path.join(home(), name));
  const readFile = (name: string): string => fs.readFileSync(path.join(home(), name), 'utf-8');

  // A real dir that looks like a checklist dir so a pointer to it resolves as valid.
  function makeCheckdir(prefix = 'skill-'): string {
    const d = fs.mkdtempSync(path.join(tmpDir, prefix));
    fs.writeFileSync(path.join(d, CONFIG_FILE), 'phases: []', 'utf-8');
    return d;
  }
  function pinCwd(dir: string): void {
    vi.spyOn(process, 'cwd').mockReturnValue(dir);
  }

  // -------------------------------------------------------------------------
  // THE REGRESSION: concurrent sessions no longer stomp each other.
  // -------------------------------------------------------------------------

  it("one session's init does NOT clobber another session's active pointer", () => {
    const dirA = makeCheckdir('skillA-');
    const dirB = makeCheckdir('skillB-');

    process.env.CHECKLIST_SESSION_ID = 'sessionA';
    writeActivePointer(dirA);

    // Concurrent session B activates a different skill — the write that used to
    // stomp the single global pointer.
    process.env.CHECKLIST_SESSION_ID = 'sessionB';
    writeActivePointer(dirB);

    // Session A still resolves to skill A (pre-fix this returned dirB).
    process.env.CHECKLIST_SESSION_ID = 'sessionA';
    expect(resolveDir()).toBe(dirA);

    // Session B resolves to skill B.
    process.env.CHECKLIST_SESSION_ID = 'sessionB';
    expect(resolveDir()).toBe(dirB);
  });

  it("clearing one session's pointer (bare reset/done) leaves another session's intact", () => {
    const dirA = makeCheckdir('a-');
    const dirB = makeCheckdir('b-');
    pinCwd(tmpDir);

    process.env.CHECKLIST_SESSION_ID = 'A';
    writeActivePointer(dirA);
    process.env.CHECKLIST_SESSION_ID = 'B';
    writeActivePointer(dirB);

    // Session A does a bare clear (what `reset`/`done` does). Pre-fix this could
    // unlink the shared pointer out from under B.
    process.env.CHECKLIST_SESSION_ID = 'A';
    expect(clearActivePointer()).toBe(true);
    expect(resolveDir()).toBe(tmpDir); // A now has no pointer → falls to cwd

    // B is completely untouched.
    process.env.CHECKLIST_SESSION_ID = 'B';
    expect(resolveDir()).toBe(dirB);
  });

  it('each session writes a physically distinct pointer file', () => {
    process.env.CHECKLIST_SESSION_ID = 'alpha';
    writeActivePointer('/skill/a');
    process.env.CHECKLIST_SESSION_ID = 'beta';
    writeActivePointer('/skill/b');

    expect(readFile('active.alpha')).toBe('/skill/a');
    expect(readFile('active.beta')).toBe('/skill/b');
    expect(fileExists('active')).toBe(false); // never falls back to the shared file when a session id is present
  });

  // -------------------------------------------------------------------------
  // session-id SOURCE precedence + back-compat
  // -------------------------------------------------------------------------

  it('CHECKLIST_SESSION_ID overrides CLAUDE_CODE_SESSION_ID', () => {
    process.env.CLAUDE_CODE_SESSION_ID = 'from-claude';
    process.env.CHECKLIST_SESSION_ID = 'explicit';
    writeActivePointer('/skill/x');

    expect(fileExists('active.explicit')).toBe(true);
    expect(fileExists('active.from-claude')).toBe(false);
  });

  it('uses CLAUDE_CODE_SESSION_ID when CHECKLIST_SESSION_ID is unset', () => {
    process.env.CLAUDE_CODE_SESSION_ID = 'claude-sess';
    writeActivePointer('/skill/x');
    expect(readFile('active.claude-sess')).toBe('/skill/x');
  });

  it('with NO session id, writes the legacy shared `active` (back-compat for a plain terminal)', () => {
    writeActivePointer('/skill/x'); // setup.ts already cleared both ids
    expect(readFile('active')).toBe('/skill/x');
    const files = fs.readdirSync(home());
    expect(files).toEqual(['active']);
  });

  it('an empty / whitespace-only session id falls back to the legacy `active`', () => {
    process.env.CHECKLIST_SESSION_ID = '   ';
    writeActivePointer('/skill/x');
    expect(fileExists('active')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // SAFETY: a session id can never escape the pointer dir.
  // -------------------------------------------------------------------------

  it('a session id with path separators / .. cannot traverse out of the pointer dir', () => {
    process.env.CHECKLIST_SESSION_ID = '../../../etc/evil id';
    writeActivePointer('/skill/x');

    const files = fs.readdirSync(home());
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^active\.[A-Za-z0-9._-]+$/); // separators/space squashed to _
    expect(files[0]).not.toContain('/');
    expect(fs.existsSync('/etc/evil')).toBe(false); // nothing written outside home
  });

  it('a very long session id is bounded so the filename stays sane', () => {
    process.env.CHECKLIST_SESSION_ID = 'x'.repeat(500);
    writeActivePointer('/skill/x');
    const files = fs.readdirSync(home());
    expect(files).toHaveLength(1);
    expect(files[0].length).toBeLessThanOrEqual('active.'.length + 64);
  });

  // -------------------------------------------------------------------------
  // round-trip within one session is unchanged (write → resolve → clear).
  // -------------------------------------------------------------------------

  it('within a single session, write → resolve → clear behaves exactly as before', () => {
    const checkdir = makeCheckdir();
    pinCwd(tmpDir);
    process.env.CHECKLIST_SESSION_ID = 'solo';

    writeActivePointer(checkdir);
    expect(resolveDir()).toBe(checkdir);
    expect(clearActivePointer()).toBe(true);
    expect(resolveDir()).toBe(tmpDir);
  });
});

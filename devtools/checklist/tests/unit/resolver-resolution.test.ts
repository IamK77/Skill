// Boundary / blind-spot tests for resolver.ts resolution + self-heal + pointer
// mutation. These intentionally do NOT duplicate resolver.test.ts: they pin the
// FULL precedence ladder (each level beating ALL lower ones), the ENOTDIR
// self-heal branch, the "keep on non-ENOENT error" branch via ELOOP, the
// relative-vs-absolute normalization in clearActivePointer, pointer overwrite,
// and the write->resolve / write->clear->resolve state progressions.
//
// Conventions: globals on (no vitest import), real temp dirs + real fs, spy on
// process.cwd, restore in afterEach. CHECKLIST_HOME is sandboxed per-test;
// CHECKLIST_DIR / CLAUDE_SKILL_DIR are saved+restored because we mutate them.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  resolveDir,
  writeActivePointer,
  clearActivePointer,
} from '../../src/resolver.js';

const CONFIG_FILE = '.checklist.yml';

describe('resolver resolution (boundary / blind-spot)', () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn> | undefined;

  const originalDir = process.env.CHECKLIST_DIR;
  const originalHome = process.env.CHECKLIST_HOME;
  const originalSkill = process.env.CLAUDE_SKILL_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-resolution-'));
    delete process.env.CHECKLIST_DIR;
    delete process.env.CLAUDE_SKILL_DIR;
    // Sandbox the pointer file inside this test's temp dir.
    process.env.CHECKLIST_HOME = path.join(tmpDir, 'cfg');
    cwdSpy = undefined;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (originalDir !== undefined) process.env.CHECKLIST_DIR = originalDir;
    else delete process.env.CHECKLIST_DIR;
    if (originalHome !== undefined) process.env.CHECKLIST_HOME = originalHome;
    else delete process.env.CHECKLIST_HOME;
    if (originalSkill !== undefined) process.env.CLAUDE_SKILL_DIR = originalSkill;
    else delete process.env.CLAUDE_SKILL_DIR;
    vi.restoreAllMocks();
  });

  // --- local helpers (mirror resolver.test.ts but kept independent) ---------

  function pointerFile(): string {
    return path.join(process.env.CHECKLIST_HOME!, 'active');
  }

  function writePointerRaw(content: string): void {
    fs.mkdirSync(path.dirname(pointerFile()), { recursive: true });
    fs.writeFileSync(pointerFile(), content, 'utf-8');
  }

  function pointerExists(): boolean {
    return fs.existsSync(pointerFile());
  }

  function readPointer(): string {
    return fs.readFileSync(pointerFile(), 'utf-8');
  }

  // A real dir that looks like a checklist dir (has .checklist.yml) so resolveDir
  // treats a pointer to it as valid.
  function makeCheckdir(prefix = 'skill-'): string {
    const d = fs.mkdtempSync(path.join(tmpDir, prefix));
    fs.writeFileSync(path.join(d, CONFIG_FILE), 'phases: []', 'utf-8');
    return d;
  }

  function pinCwd(dir: string): void {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(dir);
  }

  // -------------------------------------------------------------------------
  // FULL PRECEDENCE LADDER — each level must beat ALL lower ones at once.
  // The existing suite only checks adjacent pairs; these set every lower
  // source simultaneously so a wrong short-circuit order would go red.
  // -------------------------------------------------------------------------

  describe('precedence ladder (each level beats ALL lower)', () => {
    it('explicit --dir wins over CHECKLIST_DIR + CLAUDE_SKILL_DIR + pointer + cwd', () => {
      process.env.CHECKLIST_DIR = '/env/dir';
      process.env.CLAUDE_SKILL_DIR = '/skill/dir';
      const checkdir = makeCheckdir();
      writePointerRaw(checkdir);
      pinCwd(tmpDir);

      expect(resolveDir('/explicit/dir')).toBe('/explicit/dir');
      // explicit short-circuits before the pointer is ever read, so a valid
      // pointer is left completely untouched.
      expect(pointerExists()).toBe(true);
    });

    it('CHECKLIST_DIR wins over CLAUDE_SKILL_DIR + pointer + cwd', () => {
      process.env.CHECKLIST_DIR = '/env/dir';
      process.env.CLAUDE_SKILL_DIR = '/skill/dir';
      const checkdir = makeCheckdir();
      writePointerRaw(checkdir);
      pinCwd(tmpDir);

      expect(resolveDir()).toBe('/env/dir');
      expect(pointerExists()).toBe(true); // env wins before pointer is read
    });

    it('CLAUDE_SKILL_DIR wins over pointer + cwd (CHECKLIST_DIR unset)', () => {
      process.env.CLAUDE_SKILL_DIR = '/skill/dir';
      const checkdir = makeCheckdir();
      writePointerRaw(checkdir);
      pinCwd(tmpDir);

      expect(resolveDir()).toBe('/skill/dir');
      expect(pointerExists()).toBe(true); // skill wins before pointer is read
    });

    it('valid pointer wins over cwd (no env at all)', () => {
      const checkdir = makeCheckdir();
      writePointerRaw(checkdir);
      pinCwd(tmpDir);

      expect(resolveDir()).toBe(checkdir);
    });

    it('cwd is the floor when nothing else is set', () => {
      pinCwd(tmpDir);
      expect(resolveDir()).toBe(tmpDir);
    });

    // Boundary: an empty-string explicit arg is FALSY, so resolveDir must NOT
    // return it — it falls through to the next source. Pins the `if (explicit)`
    // truthiness check rather than a `!== undefined` check.
    it('empty-string explicit arg is ignored (falsy) and falls through to CHECKLIST_DIR', () => {
      process.env.CHECKLIST_DIR = '/env/dir';
      expect(resolveDir('')).toBe('/env/dir');
    });

    it('empty-string explicit arg with nothing else falls through to cwd', () => {
      pinCwd(tmpDir);
      expect(resolveDir('')).toBe(tmpDir);
    });

    // Boundary: CHECKLIST_DIR set to empty string is falsy, so it is skipped and
    // CLAUDE_SKILL_DIR takes over. Pins the truthiness of the env read too.
    it('empty CHECKLIST_DIR is skipped, CLAUDE_SKILL_DIR is used', () => {
      process.env.CHECKLIST_DIR = '';
      process.env.CLAUDE_SKILL_DIR = '/skill/dir';
      expect(resolveDir()).toBe('/skill/dir');
    });
  });

  // -------------------------------------------------------------------------
  // SELF-HEAL branches not covered by resolver.test.ts
  // -------------------------------------------------------------------------

  describe('self-heal', () => {
    // ENOTDIR branch: the pointer target is a *file*, so stat of
    // `<file>/.checklist.yml` throws ENOTDIR (not ENOENT). The code lists
    // ENOTDIR explicitly alongside ENOENT, so it must self-heal.
    it('self-heals when the target is a file, not a directory (ENOTDIR)', () => {
      pinCwd(tmpDir);
      const filePath = path.join(tmpDir, 'a-file');
      fs.writeFileSync(filePath, 'i am a file', 'utf-8');
      writePointerRaw(filePath);

      expect(resolveDir()).toBe(tmpDir); // fell through to cwd
      expect(pointerExists()).toBe(false); // and deleted the bad pointer
    });

    // Whitespace-padded pointer to a *valid* checkdir: the trim must run before
    // the existence check, so this resolves (and does NOT self-heal).
    it('keeps and resolves a whitespace-padded pointer to a valid checkdir', () => {
      const checkdir = makeCheckdir();
      writePointerRaw(`\n\t  ${checkdir}  \n`);

      expect(resolveDir()).toBe(checkdir);
      expect(pointerExists()).toBe(true);
    });

    // KEEP-on-error via ELOOP, asserting the *returned* value is the trimmed
    // target (not raw) — complements the existing ELOOP test which used a path
    // with no surrounding whitespace.
    it('KEEPS a pointer on a non-ENOENT stat error and returns the TRIMMED target', () => {
      pinCwd(tmpDir);
      const loop = path.join(tmpDir, 'loop');
      fs.symlinkSync(loop, loop); // self-referential -> ELOOP on stat
      writePointerRaw(`  ${loop}\n`); // padded, to prove trim happens first

      expect(resolveDir()).toBe(loop); // trimmed, trusted
      expect(pointerExists()).toBe(true); // preserved over transient error
    });

    // Tab/CR-only content trims to empty -> treated as empty -> self-heal.
    it('self-heals a pointer that is only tabs and carriage returns', () => {
      pinCwd(tmpDir);
      writePointerRaw('\t\r\n  \t');

      expect(resolveDir()).toBe(tmpDir);
      expect(pointerExists()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // clearActivePointer — relative/absolute normalization + idempotency
  // -------------------------------------------------------------------------

  describe('clearActivePointer normalization & idempotency', () => {
    // The stored pointer is absolute (writeActivePointer resolves it). Passing
    // the SAME dir as a RELATIVE path must still match, because clear runs
    // path.resolve on its arg before comparing.
    it('matches when the stored target is absolute but the arg is relative (path.resolve)', () => {
      const sub = path.join(tmpDir, 'sub');
      fs.mkdirSync(sub);
      pinCwd(tmpDir);
      writeActivePointer(sub); // stored absolute

      // './sub' resolves (against the pinned cwd) to the same absolute path.
      expect(clearActivePointer('./sub')).toBe(true);
      expect(pointerExists()).toBe(false);
    });

    // A relative arg that resolves to a DIFFERENT dir must NOT clear.
    it('does not clear when a relative arg resolves to a different dir', () => {
      const sub = path.join(tmpDir, 'sub');
      fs.mkdirSync(sub);
      pinCwd(tmpDir);
      writeActivePointer(sub);

      expect(clearActivePointer('./other')).toBe(false);
      expect(readPointer()).toBe(sub); // untouched
    });

    // The stored pointer content is compared against path.resolve(targetDir).
    // A trailing-slash / non-normalized absolute arg must still match because
    // path.resolve normalizes it.
    it('matches a non-normalized absolute target with a trailing slash', () => {
      writeActivePointer('/skill/a');
      expect(clearActivePointer('/skill/a/')).toBe(true);
      expect(pointerExists()).toBe(false);
    });

    // The stored content is trimmed on read; a raw pointer written WITH padding
    // must still match a clean absolute target.
    it('trims stored pointer content before comparing to the target', () => {
      writePointerRaw('  /skill/a  \n');
      expect(clearActivePointer('/skill/a')).toBe(true);
      expect(pointerExists()).toBe(false);
    });

    // CALL-IT-TWICE: clearing twice. First removes (true), second is an
    // idempotent no-op (false) because the pointer is gone (ENOENT race path).
    it('clear twice: first removes (true), second is an idempotent no-op (false)', () => {
      writeActivePointer('/skill/a');
      expect(clearActivePointer()).toBe(true);
      expect(clearActivePointer()).toBe(false);
      expect(pointerExists()).toBe(false);
    });

    // CALL-IT-TWICE with a target: a non-matching clear leaves the pointer, so a
    // second non-matching clear is still false and the pointer still survives.
    it('clear twice with a non-matching target: stays false, pointer survives both', () => {
      writeActivePointer('/skill/b');
      expect(clearActivePointer('/skill/a')).toBe(false);
      expect(clearActivePointer('/skill/a')).toBe(false);
      expect(readPointer()).toBe('/skill/b');
    });

    // no-target call on a NON-existent pointer is the pure no-pointer path.
    it('returns false when clearing (untargeted) and there is no pointer at all', () => {
      expect(clearActivePointer()).toBe(false);
      expect(clearActivePointer('/anything')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // writeActivePointer — overwrite (CALL-IT-TWICE) + absolute storage
  // -------------------------------------------------------------------------

  describe('writeActivePointer overwrite', () => {
    // CALL-IT-TWICE: write then write again with a different target must
    // OVERWRITE, not append/duplicate. Pins single-line absolute content.
    it('writing twice overwrites the previous target (no append)', () => {
      writeActivePointer('/skill/first');
      expect(readPointer()).toBe('/skill/first');

      writeActivePointer('/skill/second');
      expect(readPointer()).toBe('/skill/second');
    });

    // Overwrite from a relative target still stores the resolved absolute path,
    // fully replacing the prior content.
    it('overwriting with a relative target stores the new absolute path', () => {
      const sub = path.join(tmpDir, 'sub');
      fs.mkdirSync(sub);
      pinCwd(tmpDir);

      writeActivePointer('/skill/first');
      writeActivePointer('./sub');
      expect(readPointer()).toBe(sub);
    });

    // Re-writing the SAME target is idempotent in content.
    it('writing the same target twice leaves identical content', () => {
      writeActivePointer('/skill/same');
      const first = readPointer();
      writeActivePointer('/skill/same');
      expect(readPointer()).toBe(first);
      expect(readPointer()).toBe('/skill/same');
    });
  });

  // -------------------------------------------------------------------------
  // STATE PROGRESSION across resolve <-> write <-> clear
  // -------------------------------------------------------------------------

  describe('state progression (write -> resolve -> clear)', () => {
    // write -> resolve: a freshly written pointer to a real checkdir is read
    // back by resolveDir, cwd-independently.
    it('write then resolve reads the pointer back (cwd-independent)', () => {
      const checkdir = makeCheckdir();
      const elsewhere = fs.mkdtempSync(path.join(tmpDir, 'elsewhere-'));
      pinCwd(elsewhere);

      writeActivePointer(checkdir);
      expect(resolveDir()).toBe(checkdir);
    });

    // write -> clear -> resolve: after clearing, resolution falls through to cwd
    // and the pointer is gone.
    it('write then clear then resolve falls through to cwd', () => {
      const checkdir = makeCheckdir();
      pinCwd(tmpDir);

      writeActivePointer(checkdir);
      expect(resolveDir()).toBe(checkdir); // sanity: pointer active

      expect(clearActivePointer()).toBe(true);
      expect(resolveDir()).toBe(tmpDir); // now cwd
      expect(pointerExists()).toBe(false);
    });

    // write A -> overwrite with B -> resolve reads B. Pins that the LATEST write
    // wins through the full resolveDir path (both targets are valid checkdirs).
    it('overwriting the pointer then resolving reads the NEWEST target', () => {
      const dirA = makeCheckdir('a-');
      const dirB = makeCheckdir('b-');
      pinCwd(tmpDir);

      writeActivePointer(dirA);
      writeActivePointer(dirB);
      expect(resolveDir()).toBe(dirB);
    });

    // write valid -> remove the target's .checklist.yml -> resolve self-heals
    // (pointer deleted, falls to cwd). Couples writeActivePointer with the
    // self-heal path through a real fs mutation between calls.
    it('write valid pointer, then target loses .checklist.yml -> resolve self-heals to cwd', () => {
      const checkdir = makeCheckdir();
      pinCwd(tmpDir);
      writeActivePointer(checkdir);
      expect(resolveDir()).toBe(checkdir);

      fs.rmSync(path.join(checkdir, CONFIG_FILE)); // now stale
      expect(resolveDir()).toBe(tmpDir);
      expect(pointerExists()).toBe(false);

      // And a second resolve is stable: still cwd, no pointer.
      expect(resolveDir()).toBe(tmpDir);
      expect(pointerExists()).toBe(false);
    });
  });
});

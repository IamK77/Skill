/**
 * ASSAY PROBE — resolved: the owner ruled FIX (audit batch 2, finding L7), the
 * loader now validates list entries, and this file is the sanctioned regression
 * test for that contract.
 *
 * The defect (now fixed): a `null` (or otherwise non-object) entry in `phases:` /
 * `checks:` was rejected by the loader with a RAW, UNLOCATED `TypeError`
 * ("Cannot read properties of null (reading 'name')") instead of the structured,
 * located Error every other malformed-structure path emits.
 *
 * ORACLE = consistency-with-sibling-error-paths + the boundary-parsing norm
 * (gauge/legible-failures): a non-conforming list entry is one equivalence
 * class of bad input, so it must be reported the same legible way the loader
 * already reports a bare-scalar entry:
 *    `- just a string`  ->  Error: 'Phase 0: missing "name" field'
 *    `checks: [- "x"]`  ->  Error: 'Phase "P", check 0: missing "id"'
 * The `as Record<string, unknown>` cast over `null` is unsound (typeof null ===
 * 'object' but null is not indexable), which is why null slips past the structured
 * check while the string sibling does not.
 *
 * EXPECTED (and now actual): a null entry throws a plain structured `Error`
 * whose message names the offending phase/check location.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';

describe('null list entry in phases/checks yields a structured, located error', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay-null-entry-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(content: string): void {
    fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
  }

  /** Capture whatever loadChecklist throws, or null if it didn't throw. */
  function thrownBy(): Error | null {
    try {
      loadChecklist(tmpDir);
      return null;
    } catch (e) {
      return e as Error;
    }
  }

  // ---- GREEN ANCHORS: the sibling equivalence class (bare scalar entry) -----
  // These pin the contract the null cases are measured against. They pass on
  // current code, demonstrating the loader CAN and DOES report a non-object
  // entry legibly when it is a string.

  it('ANCHOR: a bare-scalar phase entry yields a structured, located Error', () => {
    writeConfig('phases:\n  - just a string\n');
    const err = thrownBy();
    expect(err).not.toBeNull();
    expect(err!.constructor.name).toBe('Error'); // not a raw TypeError
    expect(err!.message).toMatch(/Phase 0/); // located
  });

  it('ANCHOR: a bare-scalar check entry yields a structured, located Error', () => {
    writeConfig('phases:\n  - name: P\n    checks:\n      - just a string\n');
    const err = thrownBy();
    expect(err).not.toBeNull();
    expect(err!.constructor.name).toBe('Error');
    expect(err!.message).toMatch(/check 0/);
  });

  // ---- THE PROBE: null entries must be handled the SAME legible way ---------

  it('a null phase entry is rejected with a structured, located Error (not a raw TypeError)', () => {
    writeConfig('phases:\n  - null\n');
    const err = thrownBy();

    expect(err).not.toBeNull();
    // Oracle: same class of failure as the scalar sibling -> a plain structured
    // Error, NOT the unsound-cast TypeError that leaks today.
    expect(err).not.toBeInstanceOf(TypeError);
    // And it must name the offending location, like every sibling path does.
    expect(err!.message).toMatch(/Phase 0/);
    expect(err!.message).not.toMatch(/Cannot read properties of null/);
  });

  it('a null check entry is rejected with a structured, located Error (not a raw TypeError)', () => {
    writeConfig('phases:\n  - name: P\n    checks:\n      - null\n');
    const err = thrownBy();

    expect(err).not.toBeNull();
    expect(err).not.toBeInstanceOf(TypeError);
    expect(err!.message).toMatch(/check 0/);
    expect(err!.message).not.toMatch(/Cannot read properties of null/);
  });
});

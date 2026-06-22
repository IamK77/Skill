import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';
import { lintSkill } from '../../src/lint.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — finding R1: `checklist lint` is the authoring/CI gate and its
// documented job is to STRICT-VALIDATE .checklist.yml with "the same shape
// loader.ts enforces" (lint.ts header). It is therefore expected to be a SUPERSET
// of the loader's validation: anything the runtime loader REJECTS, lint must flag —
// otherwise an author lints clean, ships the skill, and every user's gate crashes
// when `init`/`verify`/`show` calls loadChecklist and it throws.
//
// The gap: lint never inspected the `evidence` field at all, while the loader
// rejects two `evidence` shapes — a non-"required" value, and `evidence: required`
// co-existing with a `verify` rule (a mechanical check can never be cleared by
// `check --evidence`, so the combination is unsatisfiable).
//
// ORACLE (consistency / metamorphic between the two validators of ONE format):
//   for every .checklist.yml, loadChecklist throws  ⇒  lintSkill reports ≥1 error.
// This suite is fail-first: it reddens on the pre-fix lint (which returned zero
// errors for the loader-rejected configs below). Disposition: FIX in the same
// change (user-chosen: fail-first test + fix).
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay2-lint-parity-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function write(yml: string): void {
  fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), yml, 'utf-8');
  // A SKILL.md must exist or lint emits an unrelated parity/missing-skill-md error;
  // give it one that drives the check so only the schema rule under test can fire.
  fs.writeFileSync(
    path.join(tmpDir, 'SKILL.md'),
    '---\nname: x\n---\n# x\n`checklist check p c1`\n`checklist verify p`\n',
    'utf-8',
  );
}

function loaderThrows(): boolean {
  try {
    loadChecklist(tmpDir);
    return false;
  } catch {
    return true;
  }
}

function lintErrorRules(): string[] {
  return lintSkill(tmpDir)
    .filter((d) => d.severity === 'error')
    .map((d) => d.rule);
}

// Each row is a .checklist.yml the LOADER rejects. The name documents why.
const loaderRejected: Array<[string, string]> = [
  [
    'evidence: required alongside a verify rule (unsatisfiable combo)',
    `phases:
  - name: p
    checks:
      - id: c1
        description: d
        verify: shell:true
        evidence: required
`,
  ],
  [
    'evidence with a non-"required" string value',
    `phases:
  - name: p
    checks:
      - id: c1
        description: d
        evidence: maybe
`,
  ],
  [
    'evidence with a boolean value (YAML true)',
    `phases:
  - name: p
    checks:
      - id: c1
        description: d
        evidence: true
`,
  ],
];

describe('lint is a superset of the loader: every loader-rejected config lints as error', () => {
  it.each(loaderRejected)('%s — loader throws AND lint reports an error', (_label, yml) => {
    write(yml);
    // Pre-condition: this really is a loader-rejected config (anchors the oracle).
    expect(loaderThrows()).toBe(true);
    // The consistency oracle: lint must not certify a config the runtime rejects.
    expect(lintErrorRules().length).toBeGreaterThan(0);
  });
});

describe('lint does not regress on configs the loader ACCEPTS (no new false positives)', () => {
  // GREEN ANCHORS — the legitimate uses of `evidence`/`verify` must still lint
  // clean, so the R1 fix narrows nothing it should not.
  it('a manual check with evidence: required (no verify) loads and lints clean', () => {
    write(`phases:
  - name: p
    checks:
      - id: c1
        description: d
        evidence: required
`);
    expect(loaderThrows()).toBe(false);
    expect(lintErrorRules()).toEqual([]);
  });

  it('a mechanical check with a verify rule (no evidence) loads and lints clean', () => {
    write(`phases:
  - name: p
    checks:
      - id: c1
        description: d
        verify: shell:true
`);
    expect(loaderThrows()).toBe(false);
    expect(lintErrorRules()).toEqual([]);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { lintSkill } from '../../src/lint.js';

// ─────────────────────────────────────────────────────────────────────────────
// assay (round 2) — finding C: lint's SKILL.md command scanner captures the phase
// and item tokens as `[^\s`]+`, which includes trailing sentence punctuation. A
// command written in prose like "run checklist check charter motivation." captures
// the item as "motivation." (with the period) and then reports a spurious
// parity/unknown-check, even though the real check id "motivation" exists. That is
// a FALSE POSITIVE from the authoring gate.
//
// ORACLE — a trailing sentence/markdown punctuation must not turn a VALID command
// reference into a spurious unknown-phase/unknown-check. The fix trims trailing
// punctuation from the captured tokens before resolving them. CONTROL: a genuine
// typo (a token that is not a real id even after trimming) must STILL be flagged —
// the fix removes noise, not real diagnostics.
//
// Fail-first: the trailing-period case reddens on the pre-fix code (it emits a
// parity/unknown-check). Disposition: FIX in the same change (user-chosen).
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'assay2-lint-prose-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const YML = `phases:
  - name: charter
    checks:
      - id: motivation
        description: motivation identified
`;

function writeSkill(body: string): void {
  fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), YML, 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'SKILL.md'), `---\nname: t\n---\n# t\n${body}\n`, 'utf-8');
}

function parityErrors(): string[] {
  return lintSkill(tmpDir)
    .filter((d) => d.severity === 'error' && d.rule.startsWith('parity/'))
    .map((d) => d.rule);
}

describe('lint does not false-positive on trailing punctuation in a command reference (C)', () => {
  it('a check command ending in a period is recognized (no spurious unknown-check)', () => {
    writeSkill('Run checklist check charter motivation. Then continue.');
    expect(parityErrors()).not.toContain('parity/unknown-check');
  });

  it('a verify command ending in a period is recognized (no spurious unknown-phase)', () => {
    writeSkill('Finally run checklist verify charter.');
    expect(parityErrors()).not.toContain('parity/unknown-phase');
  });

  it('a backticked command (already clean) keeps recognizing the check', () => {
    writeSkill('Step: `checklist check charter motivation`.');
    expect(parityErrors()).toEqual([]);
  });
});

describe('lint still flags a genuine typo after trimming punctuation (no regression)', () => {
  it('a real wrong id is still reported even with a trailing period', () => {
    writeSkill('Run checklist check charter not-a-real-id.');
    expect(parityErrors()).toContain('parity/unknown-check');
  });

  it('a real wrong phase is still reported even with a trailing period', () => {
    writeSkill('Run checklist verify nosuchphase.');
    expect(parityErrors()).toContain('parity/unknown-phase');
  });
});

describe('extractSkillCommands is invocation-stable (module-level /g regexes)', () => {
  it('linting the same skill twice yields identical diagnostics', () => {
    writeSkill('Run checklist check charter motivation. And `checklist verify charter`.');
    const first = lintSkill(tmpDir);
    const second = lintSkill(tmpDir);
    expect(second).toEqual(first);
  });
});

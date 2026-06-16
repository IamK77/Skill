import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { lintSkill, lintTree, isSkillDir, type LintDiagnostic } from '../../src/lint.js';

describe('checklist lint', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  function writeSkill(
    name: string,
    opts: { yml?: string; skill?: string; license?: boolean; notice?: boolean },
  ): string {
    const dir = path.join(tmp, name);
    fs.mkdirSync(dir, { recursive: true });
    if (opts.yml !== undefined) fs.writeFileSync(path.join(dir, '.checklist.yml'), opts.yml, 'utf-8');
    if (opts.skill !== undefined) fs.writeFileSync(path.join(dir, 'SKILL.md'), opts.skill, 'utf-8');
    if (opts.license !== false) fs.writeFileSync(path.join(dir, 'LICENSE'), 'x', 'utf-8');
    if (opts.notice !== false) fs.writeFileSync(path.join(dir, 'NOTICE'), 'x', 'utf-8');
    return dir;
  }
  const rulesOf = (d: LintDiagnostic[]) => d.map(x => x.rule);
  const errorsOf = (d: LintDiagnostic[]) => d.filter(x => x.severity === 'error');

  // A fully valid skill: a manual check driven by a `check` command, a verify-
  // driven check cleared by `verify`, LICENSE + NOTICE present, no references/.
  const GOOD_YML = `phases:
  - name: charter
    checks:
      - id: motivation
        description: motivation identified
  - name: build
    checks:
      - id: compiles
        description: it compiles
        verify: "shell:make"
`;
  const GOOD_SKILL = `# demo skill
Run \`checklist check charter motivation\` first.
Then \`checklist verify build\`.
`;

  it('a fully valid skill lints clean (zero diagnostics)', () => {
    const dir = writeSkill('good', { yml: GOOD_YML, skill: GOOD_SKILL });
    expect(lintSkill(dir)).toEqual([]);
  });

  // ── schema (collected all-at-once, never throws) ───────────────────────────

  it('flags a case-insensitive duplicate phase name', () => {
    const yml = `phases:
  - name: alpha
    checks: [{id: a, description: first}]
  - name: Alpha
    checks: [{id: b, description: second}]
`;
    const dir = writeSkill('s', { yml, skill: '# s\n`checklist check alpha a`\n`checklist check Alpha b`\n' });
    expect(rulesOf(lintSkill(dir))).toContain('schema/duplicate-phase-name');
  });

  it('flags a duplicate check id within a phase', () => {
    const yml = `phases:
  - name: alpha
    checks:
      - id: dup
        description: first
      - id: dup
        description: second
`;
    const dir = writeSkill('s', { yml, skill: '# s\n`checklist check alpha dup`\n' });
    expect(rulesOf(lintSkill(dir))).toContain('schema/duplicate-check-id');
  });

  it('flags a check missing id and a check missing description', () => {
    const yml = `phases:
  - name: alpha
    checks:
      - description: has no id
      - id: noDesc
`;
    const r = rulesOf(lintSkill(writeSkill('s', { yml, skill: '# s\n' })));
    expect(r).toContain('schema/missing-id');
    expect(r).toContain('schema/missing-description');
  });

  it('flags an empty phases array and an empty checks array', () => {
    const empty = writeSkill('e', { yml: 'phases: []\n', skill: '# e\n' });
    expect(rulesOf(lintSkill(empty))).toContain('schema/empty-phases');

    const noChecks = writeSkill('n', { yml: 'phases:\n  - name: alpha\n    checks: []\n', skill: '# n\n' });
    expect(rulesOf(lintSkill(noChecks))).toContain('schema/empty-checks');
  });

  it('flags a non-string verify (an indentation mistake) and an unknown verify kind', () => {
    const notString = `phases:
  - name: a
    checks:
      - id: c
        description: d
        verify:
          shell: make
`;
    expect(rulesOf(lintSkill(writeSkill('ns', { yml: notString, skill: '# ns\n' }))))
      .toContain('schema/verify-not-a-string');

    const unknownKind = `phases:
  - name: a
    checks:
      - id: c
        description: d
        verify: "buildin:make"
`;
    expect(rulesOf(lintSkill(writeSkill('uk', { yml: unknownKind, skill: '# uk\n' }))))
      .toContain('schema/verify-unknown-kind');
  });

  it('flags a bare/null phase list entry without throwing', () => {
    const yml = 'phases:\n  - \n  - name: real\n    checks: [{id: c, description: d}]\n';
    const dir = writeSkill('bare', { yml, skill: '# bare\n`checklist check real c`\n' });
    expect(() => lintSkill(dir)).not.toThrow();
    expect(rulesOf(lintSkill(dir))).toContain('schema/phase-not-a-mapping');
  });

  it('reports MULTIPLE schema violations in a single pass (vs loader throw-on-first)', () => {
    const yml = `phases:
  - name: alpha
    checks:
      - id: dup
        description: x
      - id: dup
        description: y
  - name: alpha
    checks: []
`;
    const errs = errorsOf(lintSkill(writeSkill('multi', { yml, skill: '# m\n' })));
    expect(errs.length).toBeGreaterThanOrEqual(3); // dup-check-id + dup-phase-name + empty-checks
  });

  // ── parity (SKILL.md <-> yml) ──────────────────────────────────────────────

  it('flags a check command naming a nonexistent check id, with the line number', () => {
    const skill = '# demo\nsome prose\n`checklist check charter NOPE`\n';
    const dir = writeSkill('p', { yml: GOOD_YML, skill });
    const d = lintSkill(dir).find(x => x.rule === 'parity/unknown-check');
    expect(d).toBeDefined();
    expect(d!.message).toContain('line 3');
    expect(d!.message).toContain('NOPE');
    expect(d!.severity).toBe('error');
  });

  it('flags a command naming a nonexistent phase', () => {
    const skill = '# demo\n`checklist verify ghostphase`\n';
    const dir = writeSkill('p', { yml: GOOD_YML, skill });
    expect(rulesOf(lintSkill(dir))).toContain('parity/unknown-phase');
  });

  it('warns on a manual check that no command drives, but NOT on a verify-driven check', () => {
    // charter/motivation is manual and undriven here -> orphan warning.
    // build/compiles has a verify rule -> cleared by `verify`, never orphaned.
    const skill = '# demo\n`checklist verify build`\n';
    const d = lintSkill(writeSkill('o', { yml: GOOD_YML, skill }));
    const orphans = d.filter(x => x.rule === 'parity/orphan-check');
    expect(orphans).toHaveLength(1);
    expect(orphans[0].message).toContain('motivation');
    expect(orphans[0].severity).toBe('warning');
  });

  it('errors when SKILL.md is missing', () => {
    const dir = writeSkill('noskill', { yml: GOOD_YML });
    fs.rmSync(path.join(dir, 'SKILL.md'), { force: true }); // writeSkill didn't create one
    expect(rulesOf(lintSkill(dir))).toContain('parity/missing-skill-md');
  });

  // ── file-level ─────────────────────────────────────────────────────────────

  it('warns when LICENSE and NOTICE are missing', () => {
    const dir = writeSkill('nolic', { yml: GOOD_YML, skill: GOOD_SKILL, license: false, notice: false });
    const missing = lintSkill(dir).filter(x => x.rule === 'files/missing-license');
    expect(missing).toHaveLength(2);
    expect(missing.every(x => x.severity === 'warning')).toBe(true);
  });

  // ── tree walking / isSkillDir ──────────────────────────────────────────────

  it('isSkillDir is true only for a dir containing .checklist.yml', () => {
    const dir = writeSkill('sd', { yml: GOOD_YML, skill: GOOD_SKILL });
    expect(isSkillDir(dir)).toBe(true);
    expect(isSkillDir(tmp)).toBe(false);
  });

  it('lintTree finds every skill dir under a root, sorted, skipping dotfiles', () => {
    writeSkill('zebra', { yml: GOOD_YML, skill: GOOD_SKILL });
    writeSkill('alpha', { yml: GOOD_YML, skill: GOOD_SKILL });
    fs.mkdirSync(path.join(tmp, '.hidden'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.hidden', '.checklist.yml'), GOOD_YML, 'utf-8');
    const res = lintTree(tmp);
    expect(res.skillDirs).toHaveLength(2); // .hidden skipped
    expect(res.skillDirs).toEqual([...res.skillDirs].sort());
    expect(res.diagnostics).toEqual([]); // both are clean
  });

  it('lintTree on a single skill dir lints just that dir', () => {
    const dir = writeSkill('solo', { yml: GOOD_YML, skill: GOOD_SKILL });
    const res = lintTree(dir);
    expect(res.skillDirs).toEqual([dir]);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChecklist } from '../../src/loader.js';

describe('loadChecklist', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeConfig(content: string): void {
    fs.writeFileSync(path.join(tmpDir, '.checklist.yml'), content, 'utf-8');
  }

  // 1. Missing file
  it('throws when .checklist.yml does not exist', () => {
    expect(() => loadChecklist(tmpDir)).toThrowError(
      '.checklist.yml not found',
    );
  });

  // 2. Empty YAML
  it('throws when YAML is empty (just "---")', () => {
    writeConfig('---');
    expect(() => loadChecklist(tmpDir)).toThrowError(
      'empty or not a valid YAML object',
    );
  });

  // 3. YAML with no phases key
  it('throws when YAML has no "phases" key', () => {
    writeConfig('title: my checklist\n');
    expect(() => loadChecklist(tmpDir)).toThrowError(
      'missing "phases" array',
    );
  });

  // 4. Empty phases array
  it('throws when phases array is empty', () => {
    writeConfig('phases: []\n');
    expect(() => loadChecklist(tmpDir)).toThrowError(
      '"phases" array is empty',
    );
  });

  // 5. Phase missing name
  it('throws when a phase is missing the "name" field', () => {
    writeConfig(`
phases:
  - checks:
      - id: c1
        description: some check
`);
    expect(() => loadChecklist(tmpDir)).toThrowError(
      'missing "name" field',
    );
  });

  // 6. Phase missing checks
  it('throws when a phase is missing "checks" array', () => {
    writeConfig(`
phases:
  - name: Build
`);
    expect(() => loadChecklist(tmpDir)).toThrowError(
      'missing "checks" array',
    );
  });

  // 6b. Phase with an empty checks array (vacuously gate-complete)
  it('throws when a phase\'s "checks" array is empty', () => {
    writeConfig(`
phases:
  - name: Build
    checks: []
`);
    expect(() => loadChecklist(tmpDir)).toThrowError(
      '"checks" array is empty',
    );
  });

  // 7. Check missing id
  it('throws when a check is missing "id"', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - description: some check
`);
    expect(() => loadChecklist(tmpDir)).toThrowError('missing "id"');
  });

  // 8. Check missing description
  it('throws when a check is missing "description"', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: c1
`);
    expect(() => loadChecklist(tmpDir)).toThrowError('missing "description"');
  });

  // 9. Valid minimal config
  it('parses a valid minimal config with one phase and one check', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: build-ok
        description: Build succeeds
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases).toHaveLength(1);
    expect(config.phases[0].name).toBe('Build');
    expect(config.phases[0].checks).toHaveLength(1);
    expect(config.phases[0].checks[0]).toEqual({
      id: 'build-ok',
      description: 'Build succeeds',
      verify: undefined,
    });
  });

  // 10. Valid config with verify field
  it('preserves the verify string when provided', () => {
    writeConfig(`
phases:
  - name: Test
    checks:
      - id: unit-tests
        description: All unit tests pass
        verify: npm test
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases[0].checks[0].verify).toBe('npm test');
  });

  // 11. verify field is non-string
  it('sets verify to undefined when the verify field is a non-string value', () => {
    writeConfig(`
phases:
  - name: Test
    checks:
      - id: unit-tests
        description: All unit tests pass
        verify: 42
`);
    const config = loadChecklist(tmpDir);
    expect(config.phases[0].checks[0].verify).toBeUndefined();
  });

  // 12. Multiple phases with multiple checks
  it('parses multiple phases with multiple checks correctly', () => {
    writeConfig(`
phases:
  - name: Build
    checks:
      - id: compile
        description: TypeScript compiles
        verify: tsc --noEmit
      - id: lint
        description: Linter passes
        verify: eslint .
  - name: Deploy
    checks:
      - id: docker
        description: Docker image builds
      - id: push
        description: Image pushed to registry
        verify: docker push myapp
`);
    const config = loadChecklist(tmpDir);

    expect(config.phases).toHaveLength(2);

    // First phase
    const build = config.phases[0];
    expect(build.name).toBe('Build');
    expect(build.checks).toHaveLength(2);
    expect(build.checks[0]).toEqual({
      id: 'compile',
      description: 'TypeScript compiles',
      verify: 'tsc --noEmit',
    });
    expect(build.checks[1]).toEqual({
      id: 'lint',
      description: 'Linter passes',
      verify: 'eslint .',
    });

    // Second phase
    const deploy = config.phases[1];
    expect(deploy.name).toBe('Deploy');
    expect(deploy.checks).toHaveLength(2);
    expect(deploy.checks[0]).toEqual({
      id: 'docker',
      description: 'Docker image builds',
      verify: undefined,
    });
    expect(deploy.checks[1]).toEqual({
      id: 'push',
      description: 'Image pushed to registry',
      verify: 'docker push myapp',
    });
  });
});

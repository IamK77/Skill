import { beforeEach, afterEach, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { lintSkill } from '../../src/lint.js';
let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-run-'));
  for (const name of ['LICENSE', 'NOTICE']) fs.writeFileSync(path.join(dir, name), 'fixture');
  fs.writeFileSync(path.join(dir, '.checklist.yml'), 'phases:\n  - name: work\n    checks:\n      - id: manual\n        description: decision\n      - id: sensor\n        description: sensor\n        verify: "shell:true"\n');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));
function rules(text: string) {
  fs.writeFileSync(path.join(dir, 'SKILL.md'), '---\nname: demo\nmetadata:\n  kind: sop\n---\n' + text);
  return lintSkill(dir).map(d => d.rule);
}
it('validates advance phase names', () => { expect(rules('checklist advance typo')).toContain('parity/unknown-phase'); });
it('requires v2 SOP entrypoints to close phased checklists explicitly', () => { expect(rules('checklist check work manual\nchecklist verify work')).toContain('parity/missing-advance'); });
it('rejects manually confirming mechanical checks', () => { expect(rules('checklist check work sensor')).toContain('parity/manual-mechanical'); });
it('rejects N/A not allowed by the definition', () => { expect(rules('checklist na work manual --reason x')).toContain('parity/na-not-allowed'); });
it('accepts a complete phased v2 entrypoint', () => { expect(rules('checklist check work manual --run ID\nchecklist verify work --run ID\nchecklist advance work --run ID')).toEqual([]); });

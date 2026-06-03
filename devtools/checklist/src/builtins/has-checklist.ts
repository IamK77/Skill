import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CheckResult } from '../types.js';

const CHECKLIST_RE = /^#+\s*CHECKLIST:/im;

export async function hasChecklistCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.match(new RegExp(CHECKLIST_RE.source, 'gim'));
  const count = matches ? matches.length : 0;

  if (count === 0) {
    return { status: 'fail', message: 'no CHECKLIST section found' };
  }

  return { status: 'pass', message: `${count} checklist sections` };
}

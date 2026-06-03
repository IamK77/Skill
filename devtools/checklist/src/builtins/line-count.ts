import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CheckResult } from '../types.js';

const MAX_LINES = 500;

export async function lineCountCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const count = content.split('\n').length;

  if (count > MAX_LINES) {
    return { status: 'fail', message: `${count} lines, exceeds ${MAX_LINES} limit` };
  }

  return { status: 'pass', message: `${count} lines` };
}

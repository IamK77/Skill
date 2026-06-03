import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { CheckResult } from '../types.js';

const MAX_COMBINED = 1536;

export async function descriptionPresentCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
  const desc = data.description;

  if (desc !== undefined && typeof desc !== 'string') {
    return { status: 'fail', message: 'description must be a string' };
  }

  if (!desc || desc.trim().length === 0) {
    return { status: 'fail', message: 'description is empty' };
  }

  return { status: 'pass', message: `${desc.length} chars` };
}

export async function descriptionLengthCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
  const desc = typeof data.description === 'string' ? data.description : '';
  const whenToUse = typeof data.when_to_use === 'string' ? data.when_to_use : '';
  const total = desc.length + whenToUse.length;

  if (total > MAX_COMBINED) {
    return { status: 'fail', message: `${total}/${MAX_COMBINED} chars` };
  }

  return { status: 'pass', message: `${total}/${MAX_COMBINED} chars` };
}

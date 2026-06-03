import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { CheckResult } from '../types.js';

const NAME_RE = /^[a-z0-9-]+$/;
const MAX_LENGTH = 64;

export async function nameFormatCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
  const name = data.name;

  if (name === undefined || name === null || name === '') {
    return { status: 'pass', message: 'name field not set (will use directory name)' };
  }

  if (typeof name !== 'string') {
    return { status: 'fail', message: 'name must be a string' };
  }

  if (!NAME_RE.test(name)) {
    return { status: 'fail', message: `invalid characters: "${name}"` };
  }

  if (name.length > MAX_LENGTH) {
    return { status: 'fail', message: `${name.length}/${MAX_LENGTH} chars` };
  }

  return { status: 'pass', message: `"${name}", ${name.length} chars` };
}

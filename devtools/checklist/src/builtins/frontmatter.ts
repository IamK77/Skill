import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { CheckResult } from '../types.js';

export async function frontmatterCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trimStart().startsWith('---')) {
      return { status: 'fail', message: 'missing --- frontmatter delimiter' };
    }
    const { data } = matter(raw);
    const fieldCount = Object.keys(data).length;
    if (fieldCount === 0) {
      return { status: 'fail', message: 'frontmatter is empty' };
    }
    return { status: 'pass', message: `parsed, ${fieldCount} fields` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 'fail', message: `parse error: ${msg}` };
  }
}

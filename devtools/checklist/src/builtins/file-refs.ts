import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { CheckResult } from '../types.js';

const LINK_RE = /\[.*?\]\(((?!https?:\/\/|#|mailto:).*?)\)/g;

export async function fileRefsCheck(targetPath: string): Promise<CheckResult> {
  const filePath = path.resolve(targetPath, 'SKILL.md');

  if (!fs.existsSync(filePath)) {
    return { status: 'fail', message: 'SKILL.md not found' };
  }

  const { content } = matter(fs.readFileSync(filePath, 'utf-8'));
  const refs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = LINK_RE.exec(content)) !== null) {
    refs.push(match[1]);
  }

  if (refs.length === 0) {
    return { status: 'pass', message: 'no file references' };
  }

  const missing = refs.filter(ref => {
    const resolved = path.resolve(targetPath, ref);
    return !fs.existsSync(resolved);
  });

  if (missing.length > 0) {
    return { status: 'fail', message: `missing: ${missing.join(', ')}` };
  }

  return { status: 'pass', message: `${refs.length} refs valid` };
}

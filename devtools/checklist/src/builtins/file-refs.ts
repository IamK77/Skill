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
    let ref = match[1].trim();
    ref = ref.replace(/^<(.*)>$/, '$1');             // <path> angle-bracket form
    ref = ref.replace(/\s+["'][^"']*["']\s*$/, '');  // optional "title" / 'title'
    const hash = ref.indexOf('#');                   // strip a #fragment on a local path
    if (hash !== -1) ref = ref.slice(0, hash);
    ref = ref.trim();
    if (ref) refs.push(ref);                         // skip pure-fragment / empty targets
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

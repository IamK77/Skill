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
  // Count visible text lines (the wc -l / editor convention): a single trailing
  // newline TERMINATES the last line, it does not begin a new empty one. The naive
  // content.split('\n') counted that phantom trailing '' segment, so a file with
  // exactly MAX_LINES lines of text plus a final newline falsely tripped the limit
  // (assay R-A). Strip one trailing newline before splitting. (An empty file stays
  // 1 here — "".split('\n') is [''] — unchanged from before; that edge is out of
  // scope for this off-by-one fix.)
  const text = content.endsWith('\n') ? content.slice(0, -1) : content;
  const count = text.split('\n').length;

  if (count > MAX_LINES) {
    return { status: 'fail', message: `${count} lines, exceeds ${MAX_LINES} limit` };
  }

  return { status: 'pass', message: `${count} lines` };
}

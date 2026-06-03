import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadChecklist } from '../loader.js';
import { clearState } from '../state.js';
import { formatInit } from '../formatter.js';
import { resolveDir, writeActivePointer } from '../resolver.js';

const STATE_FILE = '.checklist.state.json';

export function initCommand(dir?: string, options?: { force?: boolean; dir?: string; path?: string }): void {
  // init accepts the dir both positionally (`init <dir>`) and via the uniform
  // --dir flag; reject a conflicting combination rather than silently using one.
  if (dir && options?.dir && path.resolve(dir) !== path.resolve(options.dir)) {
    console.error(`conflicting target dir: positional "${dir}" vs --dir "${options.dir}"`);
    process.exit(1);
  }
  const targetDir = dir || resolveDir(options?.dir);
  try {
    const config = loadChecklist(targetDir);
    const stateExists = fs.existsSync(path.resolve(targetDir, STATE_FILE));

    if (stateExists && !options?.force) {
      console.error(`state file exists in ${targetDir}. use --force to clear and reinitialize`);
      process.exit(1);
    }

    clearState(targetDir);
    writeActivePointer(targetDir);
    console.log(formatInit(config, stateExists));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

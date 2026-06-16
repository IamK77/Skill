import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadChecklist } from '../loader.js';
import { clearState, stateFilePath, findLegacyStateFile } from '../state.js';
import { formatInit } from '../formatter.js';
import { resolveDir, writeActivePointer } from '../resolver.js';

export function initCommand(dir?: string, options?: { force?: boolean; dir?: string; path?: string }): void {
  // init accepts the dir both positionally (`init <dir>`) and via the uniform
  // --dir flag; reject a conflicting combination rather than silently using one.
  if (dir && options?.dir && path.resolve(dir) !== path.resolve(options.dir)) {
    console.error(`conflicting target dir: positional "${dir}" vs --dir "${options.dir}"`);
    process.exit(1);
  }
  const targetDir = dir || resolveDir(options?.dir);
  const target = options?.path || targetDir;
  const stateFile = stateFilePath(targetDir, target);
  try {
    const config = loadChecklist(targetDir);
    const stateExists = fs.existsSync(stateFile);

    if (stateExists && !options?.force) {
      console.error(`state file exists in ${targetDir}. use --force to clear and reinitialize`);
      process.exit(1);
    }

    clearState(stateFile);
    writeActivePointer(targetDir);

    // The state file no longer lives inside the skill dir. If an OLD in-skill-dir
    // state file is lingering from a previous version, surface a one-line note:
    // it is never read/written by the new flow and is safe to delete.
    const legacy = findLegacyStateFile(targetDir);
    if (legacy) {
      console.error(`note: legacy state file ${legacy} is ignored (state now lives outside the skill dir); it is safe to delete`);
    }

    console.log(formatInit(config, stateExists));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

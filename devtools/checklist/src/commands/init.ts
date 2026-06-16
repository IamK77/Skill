import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadChecklist } from '../loader.js';
import { clearState, stateFilePath, findLegacyStateFile, writeInitialState } from '../state.js';
import { formatInit } from '../formatter.js';
import { resolveDir, writeActivePointer } from '../resolver.js';

// A var name must be a shell-identifier — the same shape interpolate() will match
// in a `${name}` placeholder. Reject anything else loudly at init so a typo can
// never quietly capture a var that no rule can ever reference.
const VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

// Parse the repeated `--var name=value` flags into a vars map. Each entry must
// be `name=value` with a valid name; the value may be empty or contain further
// `=` (only the first splits). Throws a located error on a malformed entry or a
// duplicate name rather than silently dropping or last-wins overwriting it.
export function parseVars(raw: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const entry of raw) {
    const eq = entry.indexOf('=');
    if (eq === -1) {
      throw new Error(`invalid --var "${entry}": expected name=value`);
    }
    const name = entry.slice(0, eq);
    const value = entry.slice(eq + 1);
    if (!VAR_NAME.test(name)) {
      throw new Error(`invalid --var name "${name}": must match [A-Za-z_][A-Za-z0-9_]* (from "${entry}")`);
    }
    if (Object.prototype.hasOwnProperty.call(vars, name)) {
      throw new Error(`duplicate --var name "${name}"`);
    }
    vars[name] = value;
  }
  return vars;
}

export function initCommand(
  dir?: string,
  options?: { force?: boolean; dir?: string; path?: string; var?: string[] },
): void {
  // init accepts the dir both positionally (`init <dir>`) and via the uniform
  // --dir flag; reject a conflicting combination rather than silently using one.
  if (dir && options?.dir && path.resolve(dir) !== path.resolve(options.dir)) {
    console.error(`conflicting target dir: positional "${dir}" vs --dir "${options.dir}"`);
    process.exit(1);
  }
  const targetDir = dir || resolveDir(options?.dir);
  const target = options?.path || process.cwd();   // key by project cwd, not the shared skill dir
  const stateFile = stateFilePath(targetDir, target);
  try {
    const vars = parseVars(options?.var ?? []);
    const config = loadChecklist(targetDir);
    const stateExists = fs.existsSync(stateFile);

    if (stateExists && !options?.force) {
      console.error(`state file exists in ${targetDir}. use --force to clear and reinitialize`);
      process.exit(1);
    }

    // Seed the (cleared) state with the captured run vars so the first verify can
    // interpolate them. With no vars, keep the leaner behaviour of removing the
    // state file entirely — a fresh init starts from no file on disk.
    if (Object.keys(vars).length > 0) {
      writeInitialState(stateFile, vars);
    } else {
      clearState(stateFile);
    }
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

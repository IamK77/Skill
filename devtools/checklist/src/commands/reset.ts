import * as fs from 'node:fs';
import * as path from 'node:path';
import { clearState, stateFilePath } from '../state.js';
import { resolveDir, clearActivePointer } from '../resolver.js';

const CONFIG_FILE = '.checklist.yml';

// End-of-run cleanup. Symmetric with `init`: clears this skill's state file and
// drops the global active pointer when it points here, so nothing is left
// lingering after a checklist session completes.
//
// `reset` is destructive, so — unlike the read-only fall-through in resolveDir —
// it must NOT act on a directory the user never named. Every other command is
// implicitly guarded by loadChecklist (which throws on a missing .checklist.yml);
// reset has no such call, so it guards explicitly here. Without this, a bare
// `checklist reset`/`done` with no --dir/env/pointer would resolve to cwd and
// delete an unrelated project's .checklist.state.json.
export function resetCommand(options?: { dir?: string; path?: string }): void {
  const targetDir = resolveDir(options?.dir);

  if (!fs.existsSync(path.join(targetDir, CONFIG_FILE))) {
    console.error(`no active checklist to reset in ${targetDir}. pass --dir <skill-dir>`);
    process.exit(1);
    return; // ensure the destructive ops below never run even if exit is stubbed
  }

  // reset is per-(skill,target): it clears the state file for THIS skill against
  // THIS target only, leaving any other target's state for the same skill intact.
  const target = options?.path || targetDir;
  const stateFile = stateFilePath(targetDir, target);
  clearState(stateFile);
  const pointerCleared = clearActivePointer(targetDir);
  const pointerNote = pointerCleared ? ' and active pointer' : '';
  console.log(`checklist reset: cleared state${pointerNote} for ${targetDir}`);
}

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Sandbox the active-checklist pointer (resolver.activePointerPath) so the test
// run never reads or writes the real ~/.config/checklist/active. Each test file
// gets its own throwaway dir.
process.env.CHECKLIST_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-home-'));

// Sandbox the XDG state home (state.stateHomeDir) so the test run never reads or
// writes the real ~/.local/state/checklist. CHECKLIST_STATE_HOME outranks
// XDG_STATE_HOME, so also clear a leaked XDG_STATE_HOME to keep resolution hermetic.
process.env.CHECKLIST_STATE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-state-'));
delete process.env.XDG_STATE_HOME;

// The harness sets CLAUDE_SKILL_DIR during real skill runs, and CHECKLIST_DIR
// outranks it in resolveDir's resolution order; make sure a leaked value of
// either from the host environment cannot perturb resolution in tests.
delete process.env.CHECKLIST_DIR;
delete process.env.CLAUDE_SKILL_DIR;

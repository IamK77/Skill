import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Sandbox the active-checklist pointer (resolver.activePointerPath) so the test
// run never reads or writes the real ~/.config/checklist/active. Each test file
// gets its own throwaway dir.
process.env.CHECKLIST_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-home-'));

// The harness sets CLAUDE_SKILL_DIR during real skill runs; make sure a leaked
// value from the host environment cannot perturb resolution in tests.
delete process.env.CLAUDE_SKILL_DIR;

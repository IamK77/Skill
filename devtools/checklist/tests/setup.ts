import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Sandbox the global active-checklist pointer (resolver.globalActivePath) so the
// test run never reads or writes the real ~/.config/checklist/active. Each test
// file gets its own throwaway dir.
process.env.CHECKLIST_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-home-'));

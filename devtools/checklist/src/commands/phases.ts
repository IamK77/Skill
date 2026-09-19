// Legacy 0.4 adapter, retained for compatibility regression tests only.
// Not registered by the shipping CLI. Run-based behaviour lives in workflow.ts.
import { loadChecklist } from '../loader.js';
import { formatPhases } from '../formatter.js';
import { resolveDir } from '../resolver.js';

export function phasesCommand(options?: { dir?: string; path?: string }): void {
  const targetDir = resolveDir(options?.dir);
  try {
    const config = loadChecklist(targetDir);
    console.log(formatPhases(config));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

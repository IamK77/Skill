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

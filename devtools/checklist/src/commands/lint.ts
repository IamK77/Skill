import * as path from 'node:path';
import { lintTree } from '../lint.js';
import { formatLintReport } from '../formatter.js';
import { resolveDir } from '../resolver.js';

// `checklist lint [path]` validates skill checklists as a CI / authoring gate,
// rather than at gate-runtime. It:
//   - strict-validates each .checklist.yml's schema (all violations at once),
//   - cross-validates the SKILL.md's `checklist check/verify` commands against
//     the yml (catches typo'd / orphaned phase + check references),
//   - runs cheap file-level checks (LICENSE/NOTICE, orphan references).
//
// The target may be a single skill dir or a tree to scan. It exits non-zero on
// ANY error. Warnings do not fail by default; `--strict` makes them fail too.
export function lintCommand(
  pathArg?: string,
  options?: { dir?: string; path?: string; strict?: boolean; json?: boolean },
): void {
  // A lint target is a path to scan, not the active-checklist dir. Prefer the
  // positional arg, then --dir, then the resolver (so a bare `checklist lint`
  // inside a skill dir lints that skill); fall back to cwd.
  const target = pathArg || options?.dir || resolveDir(options?.dir);

  try {
    const result = lintTree(path.resolve(target));

    if (options?.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    const { report, errorCount, warningCount } = formatLintReport(result);

    if (!options?.json) {
      console.log(report);
    }

    const failed = errorCount > 0 || (options?.strict === true && warningCount > 0);
    if (failed) {
      process.exit(1);
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

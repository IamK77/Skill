import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initCommand } from './commands/init.js';
import { showCommand } from './commands/show.js';
import { verifyCommand } from './commands/verify.js';
import { checkCommand } from './commands/check.js';
import { phasesCommand } from './commands/phases.js';
import { resetCommand } from './commands/reset.js';
import { reportCommand } from './commands/report.js';
import { lintCommand } from './commands/lint.js';

// Single source of truth for the version: read it from package.json at
// runtime rather than hard-coding it here. Works from both src/ (tests) and
// dist/ (the shipped build) because package.json is one level up in each.
// This is what lets release-please bump the version in package.json alone.
//
// The self-carry bundle (npm run bundle -> bundle/checklist.mjs) is a single
// file with no package.json beside it, so the runtime read would fail there.
// `npm run bundle` therefore esbuild-`--define`s BUNDLED_VERSION to the
// package.json version at bundle time; this `declare` lets tsc type the
// replaced literal, and the `typeof` guard keeps the unbundled dist/ build
// (where the define is absent) on the original package.json read.
declare const __CHECKLIST_BUNDLED_VERSION__: string;
const bundledVersion =
  typeof __CHECKLIST_BUNDLED_VERSION__ === 'string' ? __CHECKLIST_BUNDLED_VERSION__ : '';
const version =
  bundledVersion ||
  (JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version: string })
    .version;

const program = new Command()
  .name('checklist')
  .description('Flight checklist CLI for Claude Code skills')
  .version(version);

// Flags are uniform across every command so an agent never has to remember
// which command accepts what. In the normal skill flow none are needed:
// `--dir` defaults to $CLAUDE_SKILL_DIR / the active checklist, and `--path`
// defaults to that same dir.
const DIR_OPT = ['-d, --dir <dir>', 'Directory containing .checklist.yml'] as const;
const PATH_OPT = ['-p, --path <path>', 'Target skill directory for builtins (defaults to --dir)'] as const;

// Collect a repeatable flag into an array (commander keeps only the last value
// for a single-value option otherwise).
const collect = (value: string, previous: string[]): string[] => previous.concat([value]);

program
  .command('init [dir]')
  .description('Load .checklist.yml, clear state, show ready summary')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .option('--force', 'Clear existing state without prompting')
  .option(
    '--var <name=value>',
    'Capture a run variable for ${name} interpolation in shell:/script: verify rules (repeatable)',
    collect,
    [],
  )
  .action(initCommand);

program
  .command('show [phase]')
  .description('Show checklist overview, or a specific phase with readings')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .option('--json', 'Emit machine-readable current state (for hooks/statusline)')
  .action(showCommand);

program
  .command('verify <phase>')
  .description('Batch verify mechanical checks for a phase')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .action(verifyCommand);

program
  .command('check <phase> <item-id>')
  .description('Manually confirm a human-judgment check item')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .option('--evidence <text>', 'Cite the basis for this confirmation (file:line, command output, artifact path); required when the check sets evidence: required')
  .action(checkCommand);

program
  .command('phases')
  .description('List all phases')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .action(phasesCommand);

program
  .command('reset')
  .alias('done')
  .description('End-of-run cleanup: clear this skill\'s state and active pointer (run journal retained)')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .action(resetCommand);

program
  .command('report')
  .description('Render a markdown gate-trail from the append-only run journal')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .action(reportCommand);

program
  .command('lint [path]')
  .description('Validate skill checklists: yml schema + SKILL.md parity (CI / authoring gate)')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .option('--strict', 'Treat warnings as errors (non-zero exit)')
  .option('--json', 'Emit machine-readable lint results')
  .action(lintCommand);

program.parse();

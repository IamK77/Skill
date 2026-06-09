import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initCommand } from './commands/init.js';
import { showCommand } from './commands/show.js';
import { verifyCommand } from './commands/verify.js';
import { checkCommand } from './commands/check.js';
import { phasesCommand } from './commands/phases.js';
import { resetCommand } from './commands/reset.js';

// Single source of truth for the version: read it from package.json at
// runtime rather than hard-coding it here. Works from both src/ (tests) and
// dist/ (the shipped build) because package.json is one level up in each.
// This is what lets release-please bump the version in package.json alone.
const { version } = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as { version: string };

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

program
  .command('init [dir]')
  .description('Load .checklist.yml, clear state, show ready summary')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .option('--force', 'Clear existing state without prompting')
  .action(initCommand);

program
  .command('show [phase]')
  .description('Show checklist overview, or a specific phase with readings')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
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
  .description('End-of-run cleanup: clear this skill\'s state and active pointer')
  .option(...DIR_OPT)
  .option(...PATH_OPT)
  .action(resetCommand);

program.parse();

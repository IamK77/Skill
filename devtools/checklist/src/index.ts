import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { showCommand } from './commands/show.js';
import { verifyCommand } from './commands/verify.js';
import { checkCommand } from './commands/check.js';
import { phasesCommand } from './commands/phases.js';

const program = new Command()
  .name('checklist')
  .description('Flight checklist CLI for Claude Code skills')
  .version('0.2.0');

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

program.parse();

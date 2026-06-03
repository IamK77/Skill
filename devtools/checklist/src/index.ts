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

program
  .command('init [dir]')
  .description('Load .checklist.yml, clear state, show ready summary')
  .option('--force', 'Clear existing state without prompting')
  .action(initCommand);

program
  .command('show [phase]')
  .description('Show checklist overview, or a specific phase with readings')
  .option('-d, --dir <dir>', 'Directory containing .checklist.yml')
  .option('-p, --path <path>', 'Target skill directory for builtins')
  .action(showCommand);

program
  .command('verify <phase>')
  .description('Batch verify mechanical checks for a phase')
  .option('-d, --dir <dir>', 'Directory containing .checklist.yml')
  .option('-p, --path <path>', 'Target skill directory for builtins')
  .action(verifyCommand);

program
  .command('check <phase> <item-id>')
  .description('Manually confirm a human-judgment check item')
  .option('-d, --dir <dir>', 'Directory containing .checklist.yml')
  .action(checkCommand);

program
  .command('phases')
  .description('List all phases')
  .option('-d, --dir <dir>', 'Directory containing .checklist.yml')
  .action(phasesCommand);

program.parse();

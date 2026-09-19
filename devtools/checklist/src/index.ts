import { Command } from 'commander';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lintCommand } from './commands/lint.js';
import { parseVars } from './variables.js';
import { createRun, listRuns, readRun, selectRun, unlockRun } from './runs.js';
import { advance, confirm, finish, inspect, resume, verify } from './workflow.js';

declare const __CHECKLIST_BUNDLED_VERSION__: string;
const bundledVersion = typeof __CHECKLIST_BUNDLED_VERSION__ === 'string' ? __CHECKLIST_BUNDLED_VERSION__ : '';
const version = bundledVersion || (JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version: string }).version;
const program = new Command().name('checklist').description('SOP runs: confirmations, sensor readings, explicit stage closure').version(version);
type Options = { run?: string; session?: string; json?: boolean; dir?: string; path?: string; var?: string[]; new?: boolean; resume?: string; force?: boolean; refresh?: boolean; evidence?: string; reason?: string };
const collect = (value: string, values: string[]) => [...values, value];
function output(id: string, json = false): void {
  const view = inspect(id);
  if (json) { console.log(JSON.stringify(view, null, 2)); return; }
  console.log(`run ${id} · ${view.status}\nskill: ${view.skill}\ntarget: ${view.target}`);
  if (view.definitionChanged) console.log('STALE: definition changed or unavailable; resume --refresh before continuing');
  for (const phase of view.phases) {
    console.log(`${phase.closed ? '[closed]' : '[open]'} ${phase.name}`);
    for (const item of phase.checks) console.log(`  ${item.id}: ${view.definitionChanged ? 'stale' : item.reading?.status || 'pending'} (${item.kind})${item.reading ? ` — ${item.reading.message}` : ''}`);
  }
  console.log(`next: ${view.next || 'none'}`);
}
function select(options: Options): string {
  const id = selectRun(options.run, options.session);
  const run = readRun(id);
  if (options.dir && realpathSync(options.dir) !== run.skill) throw new Error('--dir conflicts with the selected run');
  if (options.path && realpathSync(options.path) !== run.target) throw new Error('--path conflicts with the fixed run target; start a new run');
  return id;
}
function selected(name: string, description: string): Command {
  return program.command(name).description(description)
    .option('--run <id>', 'Explicit run ID (or CHECKLIST_RUN_ID)')
    .option('--session <id>', 'Select only when this session has exactly one active run')
    .option('-d, --dir <dir>', 'Assert the selected run uses this skill directory')
    .option('-p, --path <path>', 'Assert the selected run uses this fixed project directory')
    .option('--json', 'Machine-readable recorded state');
}
program.command('init [dir]').alias('start').description('Explicitly create a new run, or resume a named run; never erase work on skill load')
  .option('-d, --dir <dir>', 'Directory containing .checklist.yml')
  .option('-p, --path <path>', 'Project directory, frozen at creation (default: cwd)')
  .option('--new', 'Create a distinct run even for the same skill/project')
  .option('--resume <id>', 'Resume an existing run instead of creating one')
  .option('--force', 'Removed: use --new or --resume explicitly')
  .option('--session <id>', 'Record an optional session association')
  .option('--var <name=value>', 'Trusted command binding, stored locally; do not store secrets', collect, [])
  .option('--json', 'Machine-readable recorded state')
  .action(async (dir: string | undefined, opts: Options) => {
    if (opts.force) throw new Error('init --force was removed; use --new or --resume <id>. Old state is not deleted or imported.');
    if (!!opts.new === !!opts.resume) throw new Error('choose exactly one: init --new or init --resume <id>');
    if (dir && opts.dir && resolve(dir) !== resolve(opts.dir)) throw new Error('conflicting target dir');
    if (opts.resume) {
      const id = select({ ...opts, dir: dir || opts.dir, run: opts.resume });
      await resume(id, false, parseVars(opts.var || [])); output(id, opts.json); return;
    }
    const skill = dir || opts.dir || process.env.CLAUDE_SKILL_DIR || process.env.CHECKLIST_DIR || process.cwd();
    const vars = parseVars(opts.var || []);
    const run = createRun(skill, opts.path || process.cwd(), vars, opts.session);
    output(run.id, opts.json);
  });
program.command('resume <id>').description('Resume without clearing work; explicit refresh/binding changes invalidate old results')
  .option('--refresh', 'Accept changed checklist definition and invalidate old readings')
  .option('--var <name=value>', 'Change a binding and invalidate old readings', collect, [])
  .option('--json', 'Machine-readable recorded state')
  .action(async (id: string, opts: Options) => { await resume(id, !!opts.refresh, parseVars(opts.var || [])); output(id, opts.json); });
program.command('runs').description('List recorded runs, including completed and abandoned runs').option('--json').action((opts: Options) => {
  const rows = listRuns().map(({ id, status, skill, target, session }) => ({ id, status, skill, target, session }));
  console.log(opts.json ? JSON.stringify(rows, null, 2) : rows.map(r => `${r.id} ${r.status} ${r.skill} → ${r.target}`).join('\n'));
});
selected('show [phase]', 'Read recorded state only; never execute sensors').action((phase: string | undefined, opts: Options) => {
  const id = select(opts);
  if (phase && !readRun(id).config.phases.some(p => p.name.toLowerCase() === phase.toLowerCase())) throw new Error(`phase not found: ${phase}`);
  output(id, opts.json);
});
selected('phases', 'List phases of the selected run').action((opts: Options) => { output(select(opts), opts.json); });
selected('check <phase> <item>', 'Record a manual confirmation, not an independent verification')
  .option('--evidence <text>', 'Basis or artifact reference; not proof of user authorization')
  .action(async (phase: string, item: string, opts: Options) => { const id = select(opts); await confirm(id, phase, item, opts.evidence); output(id, opts.json); });
selected('na <phase> <item>', 'Record not-applicable only where the definition explicitly permits it')
  .requiredOption('--reason <text>', 'Nonblank reason the check does not apply')
  .action(async (phase: string, item: string, opts: Options) => { const id = select(opts); await confirm(id, phase, item, undefined, opts.reason); output(id, opts.json); });
selected('verify <phase>', 'Execute sensors and record readings; does NOT close the phase')
  .action(async (phase: string, opts: Options) => { const id = select(opts); const result = await verify(id, phase); output(id, opts.json); if (result.failed) process.exitCode = 1; });
selected('advance [phase]', 'Close a fulfilled phase; no sensors are run implicitly')
  .action(async (phase: string | undefined, opts: Options) => { const id = select(opts); await advance(id, phase); output(id, opts.json); });
selected('done', 'Complete a fulfilled run and retain its evidence and history')
  .action(async (opts: Options) => { const id = select(opts); await finish(id); output(id, opts.json); });
selected('reset', 'Abandon this run without deleting its history; not an alias of done')
  .requiredOption('--reason <text>', 'Reason for abandonment')
  .action(async (opts: Options) => {
    if (!opts.reason?.trim()) throw new Error('reset requires a nonblank reason');
    const id = select(opts); await finish(id, true, opts.reason); output(id, opts.json);
  });
selected('report', 'Read this run’s history, including archived runs; never execute sensors')
  .action((opts: Options) => {
    const id = select(opts);
    if (opts.json) { output(id, true); return; }
    const run = readRun(id);
    // Plain lines rather than an unescaped Markdown table; user evidence remains data.
    console.log(`# Run ${id}\nStatus: ${run.status}\nTarget: ${run.target}\n`);
    for (const e of run.events) console.log(`${e.at} ${e.action} ${e.phase || ''}/${e.item || ''} ${JSON.stringify(e.detail)}`);
  });
selected('unlock', 'Recover a lock only after its owning process has exited')
  .action((opts: Options) => { const id = select(opts); unlockRun(id); console.log(`unlocked ${id}; inspect and rerun interrupted sensors`); });
program.command('lint [path]').description('Validate checklist schemas and skill references')
  .option('-d, --dir <dir>').option('--strict').option('--json').action(lintCommand);
program.parseAsync().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });

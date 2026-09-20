# checklist

Run records for execution SOPs. Node 20+, TypeScript, commander. This working tree implements the **0.5 interface / state schema 2**; publication is a separate release action.

This CLI records confirmations and sensor observations, then checks whether a phase can close. It does not prove the truth of a manual statement, grant authority, constrain access to skill prose, or sandbox commands. Creative heuristic skills do not use it.

## Run locally

The committed bundle is self-contained; it can be copied outside the repository and run without `node_modules`:

```sh
node /path/to/Skill/devtools/checklist/bundle/checklist.mjs --help
```

Or build the source:

```sh
cd devtools/checklist
npm ci
npm run build
node dist/index.js --help
```

In examples, `checklist` means the matching CLI on PATH or the `node .../checklist.mjs` invocation. Check `--version`: older published/global 0.4 commands are not compatible with the new SOPs. Do not assume a new npm release exists because source has changed.

## Lifecycle

```sh
checklist init /path/to/skill --new --path /path/to/project --json
# Copy the returned id into RUN. init does not change your shell environment.
RUN='<returned-run-id>'
checklist show --run "$RUN"
checklist check scope goal --run "$RUN" --evidence 'brief.md:12 — accepted example'
checklist advance scope --run "$RUN"
checklist verify exercise --run "$RUN"
# Record the actual remaining manual items, then close the phase.
checklist advance exercise --run "$RUN"
checklist done --run "$RUN"
```

Those phase/item names are illustrative; `show` displays the definition for the selected skill. A sensor exit 0 is **not** a phase completion event. `advance` refuses missing manual confirmations, pending sensors, failures, errors, stale readings, or required N/A reasons.

| Command | Contract |
| --- | --- |
| `init [dir] --new [--path project] [--var NAME=value]` | Create a distinct run and freeze canonical skill/project paths. Project defaults to the creation cwd. No old state is erased or imported. |
| `init --resume ID` / `resume ID` | Continue that active run without clearing its records. |
| `resume ID --refresh` | Accept a changed definition and invalidate prior readings/closures. |
| `resume ID --var NAME=value` | Change captured command bindings; changed values invalidate prior readings/closures. |
| `runs [--json]` | List active, completed, and abandoned run IDs and targets. |
| `show [phase] --run ID [--json]` | Read recorded state only. A supplied phase is validated; the overview is still shown for context. Never executes sensors. |
| `phases --run ID` | Show the selected run's phases and recorded state. |
| `check phase item --run ID [--evidence text]` | Record a manual confirmation. Reject mechanical items and missing required evidence. |
| `na phase item --run ID --reason text` | Record not-applicable only if that item declares `allow-na: true`. Never represented as a pass. |
| `verify phase --run ID` | Run that phase's mechanical checks, except explicitly N/A items. Exit nonzero on failure/error. Manual pending items can remain; no phase is closed implicitly. |
| `advance [phase] --run ID` | Close the named or next open phase only when it is fulfilled and earlier phases are closed. |
| `done --run ID` | Complete a fulfilled run, requiring explicit phase closure for phased definitions. Retain all history and artifacts. |
| `reset --run ID --reason text` | Abandon an active run without deleting its history. |
| `report --run ID [--json]` | Read a run's event history, including archived runs; never execute sensors. |
| `unlock --run ID` | Remove a stale lock only after the recorded owner process is confirmed absent. |
| `lint [path] [--strict] [--json]` | Validate checklist schema and skill command parity; `--strict` also fails on warnings. |

Readings have `pass`, `fail`, `error`, `na`, or `stale`; absence is pending. Each records its source (`confirmation`, `sensor`, or `na`) and time. `show --json` includes phases, missing items, run status, revision, next action, and events. Changed/unavailable definitions are exposed as stale in an active run's view without writing state.

A new confirmation or verification reopens that phase and invalidates downstream readings/closures. Sensor readings are persisted as stale **before** execution, so an interrupted rerun cannot leave an old pass usable. To reconsider an N/A sensor, use an explicit refresh and obtain new readings; ordinary `verify` respects the recorded N/A.

## Selection, recovery, and storage

Use `--run ID` or `CHECKLIST_RUN_ID`. Otherwise selection is allowed only when the supplied `--session`, `CHECKLIST_SESSION_ID`, `CLAUDE_SESSION_ID`, or `CLAUDE_CODE_SESSION_ID` identifies **exactly one active run**. Multiple candidates are an error. There is no global latest-run guess and no lookup by skill/project pair.

`--dir` and `--path` on selected-run commands are assertions: a conflicting path is refused rather than rebinding the run. `resume ID` works from another cwd. Skill-directory environment variables are creation defaults only, not selected-run targets.

Records live under `$CHECKLIST_STATE_HOME/v2/runs/<id>/`, or `$XDG_STATE_HOME/checklist/v2/runs/<id>/`, or `~/.local/state/checklist/v2/runs/<id>/`:

- `run.json`: definition snapshot/hash, fixed target, bindings, readings, closures, and event history in one atomically replaced record.
- `outputs/<id>.json`: sensor artifact with rule, result, run/item identity, target, and execution trace.
- `lock/owner.json`: exclusive transaction owner while a command mutates the run.

Run directories are created with mode 0700 and new record/artifact files with 0600. Commands and output can contain private data; these modes are not encryption. Do not bind secrets or collect unnecessary sensitive output. History is local, mutable by its owner, and **not tamper-proof**.

The run lock covers prerequisite checks, execution, and commit—not just the final rename. Contention fails visibly. Different runs can proceed independently. It is intended for local filesystems and local processes; shared cross-host state is unsupported. No lock is stolen on a timer. On normal interruption the active sensor process group is stopped; a forcibly killed CLI cannot run cleanup. Inspect the process and run, then `unlock` only after its owner exited and rerun interrupted sensors. A malformed/ownerless lock or interrupted recovery directory requires human inspection, not blind deletion. A reused PID is treated conservatively as alive.

Atomic rename prevents a partially written JSON record becoming current; it is not a power-loss durability guarantee. Failure to save an artifact or state is a command failure, not a successful reading. Old `0.4` files remain untouched; see [MIGRATION.md](MIGRATION.md).

## Definition schema

Use phases when their closure is a meaningful dependency:

```yaml
phases:
  - name: scope
    checks:
      - id: goal
        description: Agreed outcome and acceptance example
        evidence: required
  - name: exercise
    checks:
      - id: tests
        description: Relevant project tests
        verify: "shell:${TEST_CMD}"
        timeout: 900
      - id: review
        description: Review observations recorded
        evidence: required
      - id: deployment
        description: Deployment checks, when deployment is in scope
        allow-na: true
```

For independent short checks, avoid artificial stage ceremony:

```yaml
checks:
  - id: source
    description: Primary source and access date recorded
    evidence: required
  - id: fit
    description: Fit to the stated need assessed
    evidence: required
```

Flat checks use phase name `main` for commands. `done` may complete a fulfilled flat list without `advance`. Do not specify both `checks` and `phases`. Names/IDs must be unique within their applicable scope. Empty verification rules or commands, nonboolean `allow-na`, and evidence requirements on mechanical items are rejected.

## Sensors and bindings

- `builtin:name`: an in-process structural check. Available names: `frontmatter`, `name-format`, `description-present`, `description-length`, `no-secrets`, `file-refs`, `has-checklist`, `line-count`. They inspect the target project, not the skill definition unless that is the chosen target.
- `shell:command`: `/bin/bash -c`, with the fixed project as cwd.
- `script:path`: a bash script contained in the skill directory, checked lexically and through symlinks; executes with the project as cwd. This is path containment, **not a sandbox**: a trusted script or shell command can access anything the process can access.

Use explicit prefixes; the loader retains historical bare-rule classification, while authoring lint requires explicit kinds. Timeout defaults to 10 seconds; `timeout` is a positive number of seconds, at most 1800. Normal exit 0 means pass; normal nonzero exit means fail; spawn errors, signals, timeout, and output overflow are execution errors. stdout and stderr are retained separately, bounded to 1 MiB of input bytes per stream; overflow stops the process group and is flagged. A cut UTF-8 sequence may decode to a replacement character. Summary messages are shortened; consult the artifact for captured output.

Subprocess traces record effective command, cwd, start time, duration, exit code, signal, timeout and truncation flags. Builtin or pre-execution errors have timing/location metadata but no subprocess exit trace.

`${NAME}` placeholders bind from explicit `--var` first, then matching environment values **at creation**. Missing bindings are errors at verification, even if a later process has that environment variable. `$$` escapes a dollar for the shell. Binding contents are trusted shell text, not quoted arguments or a secret store. The rest of the command environment (PATH, tools, files, shell `$NAME` expansions) is not frozen.

Definition-file changes and explicit binding changes invalidate prior readings. The CLI does **not** automatically hash the entire project, dependencies, or scripts invoked by a shell command; rerun sensors after relevant inputs change. A recorded observation is from a particular time, not a perpetual guarantee.

Four shipped SOPs bind real project commands: assay `TEST_CMD`, aegis `SCA_CMD`, flightline `LINT_CMD`, and gauge `TYPECHECK_CMD`. Determine those commands from the project. Never replace a missing tool with `echo success` or `true`.

## Develop and verify

```sh
npm ci
npm test                  # builds dist, then runs tests
npm run bundle            # intentional regeneration
npm run bundle:check      # compare in memory; no rewriting
node dist/index.js lint ../../skills --strict
```

Use `npm ci` before regenerating or validating a release artifact. Both bundle commands reject an installed esbuild version that differs from `package-lock.json`; a locally self-consistent artifact from a different builder is not a reproducible artifact. The build uses the package directory as its fixed working directory, so calling the script from the repository root or another directory does not change the output.

The run-contract integration suite exercises compiled source and a relocated committed bundle with identical cases. It intentionally does not repair a stale bundle before testing. CI checks freshness before merge rather than pushing a generated update afterward. Pure and legacy helper regression tests remain separately named; the shipping run contract is tested through the real CLI entrypoints.

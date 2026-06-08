# checklist

A CLI that gates a Claude Code skill's phases. A stage cannot open until every check in every prior stage is recorded as passing. It exists so an agent running a multi-stage skill cannot skip ahead or self-certify a stage it did not actually do.

Package name `skill-checklist`, version 0.2.0. TypeScript, commander-based. Not published to npm (see Install).

## What it does

`checklist` reads a `.checklist.yml` file from a skill directory. That file is an ordered list of `phases`; each phase has `checks`, and each check has an `id`, a `description`, and an optional `verify` rule. The CLI tracks a pass/fail result per check, per skill directory, in a state file, and enforces sequential gating: before it will let you `verify` or `check` a phase, every check in every earlier phase must already be recorded as `pass`.

The gate floor is strict about what "done" means. An item counts toward a phase only when its current recorded result is `pass` — not merely that a row for it exists. A stored `fail`/`error`, or a check that was green on an earlier run and has since regressed, does not satisfy the gate. A failing re-`verify` overwrites the stale pass, so the gate always reflects current state rather than the best state ever seen.

There are two ways a check gets a result:

- A check with **no** `verify` rule is a manual, human-judgment item. It is cleared by `checklist check <phase> <item-id>`, which records `pass` with the message `confirmed`.
- A check **with** a `verify` rule is mechanical. It is run (and recorded) by `checklist verify <phase>`. Trying to `check` a mechanical item is rejected with an error pointing you at `verify`.

## Install (no npm)

This package is **not** on npm. There is no `npm install -g skill-checklist` and no npx-from-registry path. A `build` script (`tsc` to `dist/`) and a `prepublishOnly` hook exist in `package.json`, but their presence is not a published package.

To install it:

1. Clone the repo:

   ```sh
   git clone https://github.com/IamK77/Skill.git
   ```

2. Install dependencies inside the CLI directory:

   ```sh
   cd Skill/devtools/checklist
   npm install
   ```

   This pulls `commander`, `gray-matter`, `js-yaml`, and `tsx`.

3. Put the `checklist` command on `PATH`, either with:

   ```sh
   npm link
   ```

   or by referencing `devtools/checklist/bin/checklist.js` directly (symlink it onto `PATH`, or call it by full path).

The bin runs the TypeScript source live through `tsx` — `bin/checklist.js` does `require('tsx/cjs')` then `require('../src/index.ts')` — so **no compile step is needed to run it**. `npm run build` is available if you want a `dist/` build, but you do not need it to use the CLI.

Requires Node >= 18.

In normal use you never pass any flags. The skill calls `checklist init ${CLAUDE_SKILL_DIR} --force`, and later commands resolve the directory from `$CLAUDE_SKILL_DIR` or the active pointer (see How directories are resolved).

## Commands

All commands accept the same two flags: `-d, --dir <dir>` (the directory containing `.checklist.yml`) and `-p, --path <path>` (the target directory for builtin checks; defaults to the resolved `--dir`).

| Command | What it does |
| --- | --- |
| `init [dir] [--force]` | Load `.checklist.yml`, clear any existing state, write the active pointer, print a ready summary. Without `--force` it refuses if a state file already exists. The directory may be given positionally or via `--dir`; a conflicting pair is rejected. |
| `show [phase]` | Print the checklist overview, or — with a phase argument — that one phase with its recorded readings. |
| `verify <phase>` | Gate all prior phases, then batch-run that phase's mechanical (`verify`-rule) checks and record their current results. Exits non-zero if any mechanical check fails. |
| `check <phase> <item-id>` | Manually confirm one human-judgment item (records `pass`). Errors if the item has a `verify` rule (that item belongs to `verify`) or if a prior phase is not complete. |
| `phases` | List all phases. |
| `reset` (alias `done`) | End-of-run cleanup: clear this skill's state file and drop the active pointer when it points here. Refuses if the resolved directory has no `.checklist.yml`, so a bare `reset` can't delete an unrelated project's state. |

Both `verify` and `check` apply the prior-phase gate before doing anything else. `verify` additionally records results; `check` records a single confirmation.

### A worked example

Given a checklist whose first two phases are `charter` (one check, `motivation-identified`) and `survey` (one check, `surface-mapped`):

```sh
$ checklist init /path/to/skill --force      # load config, clear state, set active pointer

$ checklist check survey surface-mapped       # rejected: charter not complete yet
gate blocked: PHASE 0 (charter) incomplete     # (exits non-zero)

$ checklist check charter motivation-identified
# records charter/motivation-identified = pass

$ checklist verify charter                     # gate passes; charter has no mechanical checks
$ checklist check survey surface-mapped        # now allowed; charter is complete
# records survey/surface-mapped = pass

$ checklist show                               # review all phases and readings
$ checklist done                               # clear state + active pointer
```

The second line shows the core guarantee: an agent cannot record `survey` before `charter`'s checks are all `pass`.

## How directories are resolved

Most commands need no `--dir` because the directory is resolved in this order:

1. an explicit `--dir`
2. `$CHECKLIST_DIR`
3. `$CLAUDE_SKILL_DIR` (a running skill always knows its own dir; the harness sets this)
4. the global **active pointer** file
5. the current working directory

The active pointer is a single file written by `init` and removed by `reset`/`done`. Its location is `$CHECKLIST_HOME` if set, else `$XDG_CONFIG_HOME/checklist/active`, else `~/.config/checklist/active`. Because `init` writes the pointer from the harness-expanded `${CLAUDE_SKILL_DIR}`, every later command finds the right directory with no flags and regardless of the current working directory.

The pointer self-heals, but conservatively: it is removed and the resolver falls through to cwd only when its target is *definitely* gone (a `statSync` of `<target>/.checklist.yml` returns `ENOENT`/`ENOTDIR`). Any other error — `EACCES`, `EIO`, `ELOOP`, an NFS stall — is treated as "can't tell," and a valid pointer is never deleted over a transient read failure.

`--path` (the target directory for builtin checks) defaults to the resolved `--dir`.

## verify rules

A check's `verify:` value can take one of three forms. The kind is taken from an explicit prefix; without a prefix it is auto-classified (a first token containing `/` or ending in `.sh`/`.bash`/`.ts`/`.js`/`.py` is treated as a script, otherwise as a shell command).

- **`builtin:<name>`** — an in-process check. The available builtins are: `frontmatter`, `name-format`, `description-present`, `description-length`, `no-secrets`, `file-refs`, `has-checklist`, `line-count`. An unknown name returns an error listing the valid ones.
- **`shell:<cmd>`** — run a shell command (via `/bin/bash`) with a 10s timeout. Non-zero exit is a fail; its stderr/message is the recorded detail.
- **`script:<path>`** — run a script that must live **inside** the checklist directory. The path is checked twice for containment: lexically, and again against the real (symlink-resolved) paths before execution. Paths that escape the directory via `..`, another root, or a symlink are rejected with an error rather than run.

A check with no `verify:` is a manual item, cleared by `checklist check`.

In practice, **all five shipped skills' checklists use only manual checks** — none defines any `verify` rules. So in those flows the `verify` command does no mechanical work; its job is purely to apply the prior-phase gate. The `builtin`/`shell`/`script` machinery exists and is tested, but no shipped skill currently exercises it.

## .checklist.yml format

Top-level `phases:` is an ordered, non-empty list. Each phase has a `name` and a non-empty `checks:` list. Each check has an `id` (unique within its phase) and a `description`, plus an optional `verify`. The loader rejects a missing `phases` array, an empty `phases` array, a phase without a `name` or `checks`, a check without an `id` or `description`, and duplicate `id`s within a phase.

```yaml
phases:
  - name: charter
    checks:
      - id: motivation-identified
        description: Testing motivation classified and confirmed with the user
        # no verify: -> manual item, cleared by `checklist check charter motivation-identified`

  - name: build
    checks:
      - id: tests-green
        description: Tests written and the full suite passes
        verify: shell:npm test          # mechanical, run by `checklist verify build`
      - id: skill-shape
        description: SKILL.md frontmatter is well-formed
        verify: builtin:frontmatter
```

A phase is addressed by `name` (case-insensitive) or by 0-based index. Skills typically address stages by name only, so the index never surfaces.

## State and files

`checklist` writes two things:

- `.checklist.state.json` in the skill directory — the per-phase, per-item results (`{ checked: { "<phaseIndex>": { "<itemId>": { status, message } } } }`). This is gitignored. A corrupt or malformed state file is reported with a hint to run `checklist init --force`.
- the global `active` pointer file (location described above).

`init --force` clears the state file; `reset`/`done` clears the state file and drops the active pointer when it points at this directory.

## Run the tests

```sh
npm test
```

Runs the vitest suite. The current run is 434 tests passing (with 15 skipped probe tests for deferred, owner-pending defects), across unit and integration files covering the loader, resolver, runner containment, state semantics, the gate, the builtins, and the command surface.

## License

Apache-2.0, Copyright 2026 IamK77. See `LICENSE` and `NOTICE` at the repository root.

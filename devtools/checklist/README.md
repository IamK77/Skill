# checklist

A CLI that gates a Claude Code skill's phases. A stage cannot open until every check in every prior stage is recorded as passing. It exists so an agent running a multi-stage skill cannot skip ahead or self-certify a stage it did not actually do.

Package name `@iamk77/skill-checklist` (current version: see [CHANGELOG](https://github.com/IamK77/Skill/blob/main/devtools/checklist/CHANGELOG.md)). TypeScript, commander-based.

## What it does

`checklist` reads a `.checklist.yml` file from a skill directory. That file is an ordered list of `phases`; each phase has `checks`, and each check has an `id`, a `description`, and an optional `verify` rule. The CLI tracks a pass/fail result per check, per skill directory, in a state file, and enforces sequential gating: before it will let you `verify` or `check` a phase, every check in every earlier phase must already be recorded as `pass`.

The gate floor is strict about what "done" means. An item counts toward a phase only when its current recorded result is `pass` — not merely that a row for it exists. A stored `fail`/`error`, or a check that was green on an earlier run and has since regressed, does not satisfy the gate. A failing re-`verify` overwrites the stale pass, so the gate always reflects current state rather than the best state ever seen.

There are two ways a check gets a result:

- A check with **no** `verify` rule is a manual, human-judgment item. It is cleared by `checklist check <phase> <item-id>`, which records `pass` with the message `confirmed`.
- A check **with** a `verify` rule is mechanical. It is run (and recorded) by `checklist verify <phase>`. Trying to `check` a mechanical item is rejected with an error pointing you at `verify`.

## Install

```sh
npm install -g @iamk77/skill-checklist
```

This puts the `checklist` command on `PATH`. To run it without a global install:

```sh
npx @iamk77/skill-checklist show
```

The published package ships a compiled `dist/` build, and `bin/checklist.js` runs it through Node directly (`require('../dist/index.js')`) — no `tsx` and no compile step at install time. Its only runtime dependencies are `commander`, `gray-matter`, and `js-yaml`.

Requires Node >= 20 (the `commander` dependency declares `>=20`).

### From source

To run it from a clone instead:

```sh
git clone https://github.com/IamK77/Skill.git
cd Skill/devtools/checklist
npm install      # dev deps: typescript, vitest, tsx
npm run build    # compile src/ -> dist/
npm link         # put `checklist` on PATH
```

`npm run dev` (`tsc --watch`) keeps `dist/` current while you edit `src/`. The version is read from `package.json` at runtime (single source of truth), and releases are automated from Conventional Commits — see [RELEASING.md](https://github.com/IamK77/Skill/blob/main/devtools/checklist/RELEASING.md).

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

- **`builtin:<name>`** — an in-process check. The available builtins are: `frontmatter`, `name-format`, `description-present`, `description-length`, `no-secrets`, `file-refs`, `has-checklist`, `line-count`. An unknown name returns an error listing the valid ones. A builtin that crashes (e.g. on a `SKILL.md` whose frontmatter is not even parseable YAML) is recorded as that one check's `error` result, prefixed with the check id — it does not abort the rest of the batch.
- **`shell:<cmd>`** — run a shell command (via `/bin/bash`) with a 10s timeout. Non-zero exit is a fail; its stderr/message is the recorded detail.
- **`script:<path>`** — run a script that must live **inside** the checklist directory. The path is checked twice for containment: lexically, and again against the real (symlink-resolved) paths before execution. Paths that escape the directory via `..`, another root, or a symlink are rejected with an error rather than run. The vetted path is executed with `/bin/bash <path>` (passed as an argument, not interpolated into a shell string), so directories with spaces or shell metacharacters in their names are fine.

A check with no `verify:` is a manual item, cleared by `checklist check`. A `verify:` that is present but not a string (e.g. an indentation mistake that turns the rule into a nested mapping) is a config error — the file refuses to load rather than silently demoting a mechanical check to a manual one.

**Platform note:** `shell:` and `script:` rules require a POSIX shell at `/bin/bash` (macOS, Linux). On Windows, run the CLI under WSL if your checklist uses them — checklists with only manual checks and `builtin:` rules work anywhere Node runs.

In practice, **every shipped skill's checklist uses only manual checks** — none defines any `verify` rules. So in those flows the `verify` command does no mechanical work; its job is purely to apply the prior-phase gate. The `builtin`/`shell`/`script` machinery exists and is tested, but no shipped skill currently exercises it.

## .checklist.yml format

Top-level `phases:` is an ordered, non-empty list. Each phase has a `name` and a non-empty `checks:` list. Each check has an `id` (unique within its phase) and a `description`, plus an optional `verify`. The loader rejects, with a located error: a missing `phases` array, an empty `phases` array, a phase without a `name` or `checks`, an empty `checks:` array (it would be vacuously gate-complete), a check without an `id` or `description`, duplicate `id`s within a phase, duplicate phase names (compared case-insensitively, since phases are addressed by name), a `verify` that is not a string, and a list entry that is not a mapping (e.g. a dangling `- `).

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

A phase is addressed by `name` (case-insensitive) or by 0-based index. An index argument must be all digits — anything else (`1abc`, `1.9`, a stray space) is looked up as a name and errors if no phase has that name, so a typo can never silently land on the wrong phase. Skills typically address stages by name only, so the index never surfaces.

## State and files

`checklist` writes two things, and **neither lives inside the skill directory** — the skill dir is treated as read-only (under a plugin install it is a package-managed directory whose fate on update is uncertain):

- the **per-run state file**, under an XDG state directory. Its location is `$CHECKLIST_STATE_HOME` if set, else `$XDG_STATE_HOME/checklist`, else `~/.local/state/checklist`. Within that directory the file is keyed per **(skill, target)** pair — its name is the skill's basename plus a sha256 of the resolved `skill\0target` tuple (`<skill-basename>.<hash>.json`). Two references to the same dirs (with/without a trailing slash, relative vs absolute) resolve to one file; a different `--path` target gets its own file. So two concurrent runs of the same skill against different targets keep independent state and cannot stomp each other. The records are keyed per **phase NAME** (case-folded), then per check id (`{ checked: { "<phaseName>": { "<itemId>": { status, message } } } }`). Keying by name (not numeric index) means reordering phases in the `.checklist.yml` never mis-attaches an old pass to whatever check now sits at the old index. A corrupt or malformed state file is reported with a hint to run `checklist init --force`. Writes are atomic (temp file in the same directory + rename), and `check`/`verify` merge their new records into whatever is on disk at save time, so concurrent invocations don't overwrite each other's results.
- the global `active` pointer file (location described above).

`init --force` clears the (skill, target) state file; `reset`/`done` clears the (skill, target) state file for the target it resolves (`--path`, else the skill dir) and drops the active pointer when it points at this directory.

**Migration note (breaking):** earlier versions wrote `.checklist.state.json` *inside* the skill directory. That location is no longer read, written, or deleted by any command — an existing in-skill-dir `.checklist.state.json` is abandoned (its recorded progress does not carry over). `init` prints a one-line stderr note when it spots one; the file is safe to delete.

## Run the tests

```sh
npm test
```

Runs the vitest suite. The current run is 482 tests passing (none skipped — the probe suites for the once-deferred defects are fixed and un-skipped), across unit and integration files covering the loader, resolver, runner containment, state semantics, state relocation, the gate, the builtins, and the command surface.

## License

Apache-2.0, Copyright 2026 IamK77. See `LICENSE` and `NOTICE` (shipped with the package; also at the repository root).

# Skill

A repository of agent-era engineering skills for Claude Code, plus the `checklist` CLI that gates them.

## What's here today

Two things you can use today:

1. **`assay`** — a risk-driven testing skill for Claude Code. It plans, writes, and hardens tests through a decision tree, in eight gated stages.
2. **`checklist`** — a small TypeScript CLI that gates a skill's stages. A stage cannot open until every check in every prior stage is recorded as passing. `assay` runs on it.

Apache-2.0, Copyright 2026 IamK77.

Four more skills exist in the tree as the broader direction (groundwork, load-bearing, flightline, gauge), but they are **not yet published** — see [Where this is going](#where-this-is-going). `assay` is the first piece shipped.

## assay

`assay` is a Claude Code skill that drives testing through a risk-driven decision tree: what is worth testing, which test type, which test double, and which cases actually catch bugs. It works in eight gated stages:

| Stage | Does |
|-------|------|
| **Charter** | Fix what this testing is hired to do (bug-fix, refactor-safety, defect hunt, load-hardening, pre-release, suite audit, general confidence) |
| **Survey** | Map the testable surface — entry points, untrusted edges, collaborators, side effects, existing coverage |
| **Triage** | Build a ranked risk ledger (`likelihood × blast-radius × detection-gap`) and an explicit DO-NOT-TEST list |
| **Choose** | Per risk: test type and scope, example vs property, the weakest sufficient double, determinism guards |
| **Compose** | Turn each risk into cases with a named oracle; design second-invocation cases for stateful units |
| **Build** | Write and run the tests; build determinism in by construction; apply the language's norms and must-run commands |
| **Bite** | Prove the suite can go red — mutation or a deliberate break — audit single-call tests, sweep for test smells |
| **Books** | Dispose of every bug found (fix / file-and-defer / pin); close the non-functional-requirement loop |

Detail lives in a `references/` library of ten Markdown files, opened per stage rather than upfront: `decision-tree`, `evidence-catalogue`, `probe-construction`, `test-doubles`, `property-based`, `determinism-and-flakiness`, `coverage-and-mutation`, `language-norms`, `agent-test-smells`, `parallel-execution`.

**The load-bearing rule:** `assay` will not advance past a stage gate the `checklist` CLI has not cleared. The gates are machine-enforced — the skill cannot skip ahead, batch its checks, or self-certify a stage. `assay`'s own checklist defines 15 checks across the 8 stages; all of them are manual human-judgment confirmations, so in the `assay` flow the gate's enforcement comes from (a) the per-check confirmations and (b) the sequential prior-stage gate, not from auto-verified mechanical rules.

### Install assay

A Claude Code skill is a directory — `SKILL.md` + `references/` + `.checklist.yml`. There is no package-manager step and no build. To install `assay`, place (clone or copy) `skills/assay/` into a path Claude Code discovers skills from.

`assay` calls the `checklist` CLI to run its gates, so `checklist` must be installed and on `PATH` (next section). With both in place, invoke the skill in Claude Code and point it at a target:

```
/assay path/to/module
```

`assay`'s `SKILL.md` opens with `` !`checklist init ${CLAUDE_SKILL_DIR} --force` `` and then drives the gates itself.

## checklist

`checklist` is a TypeScript CLI (package name `skill-checklist`, version 0.2.0, built on `commander`). It loads a skill's `.checklist.yml`, tracks per-stage pass/fail state in the skill directory, and refuses to open a stage until every check in every prior stage is recorded as `pass` — not merely present. A check that regresses on re-verify overwrites a stale pass, so the gate reflects current state. (`checklist` calls these units `phases`; `assay` presents them to the user as `stages` — they are the same thing.)

It is **not published to npm.** Install it from this repo:

```sh
git clone https://github.com/IamK77/Skill.git
cd Skill/devtools/checklist
npm install
```

The `checklist` bin runs the TypeScript source directly through `tsx` (`bin/checklist.js` does `require('tsx/cjs')` then `require('../src/index.ts')`), so no build step is needed to run it. Put it on `PATH` with `npm link`, or reference `devtools/checklist/bin/checklist.js` directly. Requires Node >= 18.

A `build` script (`tsc` → `dist/`) and a `prepublishOnly` hook exist in `package.json`, but the package is not published — do not run `npm install -g skill-checklist`.

### How a skill uses checklist

From `assay`'s real flow — stages are addressed by name, never by number:

```sh
checklist init ${CLAUDE_SKILL_DIR} --force      # load config, clear state, set the active pointer
checklist check charter motivation-identified   # confirm a manual human-judgment check
checklist verify charter                         # gate prior stages, run any mechanical checks
# ... per stage ...
checklist show                                   # confirm all stages passed
checklist done                                   # clear this run's state
```

In normal use no `--dir`/`--path` flags are needed: `init` writes an active pointer (from the harness-expanded `$CLAUDE_SKILL_DIR`), and later commands resolve the directory from `$CLAUDE_SKILL_DIR` or that pointer.

Full command reference, directory-resolution rules, the `.checklist.yml` schema, and the `verify` rule kinds (`builtin:` / `shell:` / `script:`): **[devtools/checklist/README.md](devtools/checklist/README.md)**.

## Why these skills exist

Agents now write much of the code, and they do not reliably repeat process steps unless something enforces them. These skills move human-era engineering practice into a form an agent-assisted workflow can follow, with machine-enforced gates instead of relying on anyone remembering the step. `assay` does this for testing; the rest of the suite extends it across the lifecycle.

## Where this is going

Not yet published — direction, not shipping. Four sibling skills are intended to form an agent-era engineering methodology:

- **groundwork** — requirements: pin down what to build before building it.
- **load-bearing** — architecture: choose the style, stack, boundaries, contracts, and data model.
- **flightline** — engineering process: version control, CI/CD, code review, dependency and build management.
- **gauge** — the codebase's feedback surface: strict typing, boundary validation, legible failures.

The lifecycle is **groundwork → load-bearing → flightline → assay**, with **gauge** cross-cutting. These directories exist in the repo tree but are not git-tracked and not part of the published surface. `assay` is the first piece published; treat the rest as planned, not available.

## Repository layout

```
skills/
  assay/                 # published: the risk-driven testing skill
    SKILL.md
    references/          # 10 Markdown files backing the 8 stages
    .checklist.yml       # the 8-stage, 15-check gate definition
    LICENSE  NOTICE
  groundwork/  load-bearing/  flightline/  gauge/
                         # present in tree, NOT git-tracked, NOT yet published
devtools/
  checklist/             # the gate CLI (see its own README)
LICENSE  NOTICE
```

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

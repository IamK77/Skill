# Skill

Practical execution workflows and creative thinking lenses for engineering, research, and design.

**38 entrypoints across 6 suites: 20 SOPs, 15 heuristics, and 3 auxiliary routers.**

## Two kinds of skill

- **SOP — carry out a chosen task.** Inputs, steps, branches, concrete artifacts, verification, and completion conditions. A run-based CLI records progress where execution constraints are useful.
- **Heuristic — open possibilities.** Philosophical perspectives, analogies, associations, inversions, and thought experiments. These are not multi-angle diagnostic checklists. They have no mandatory gates, certificates, scores, or obligation to end with an action plan.

The human chooses what is worth pursuing. Exploration can hand a selected direction to an SOP, but it can also end with a sketch, a new question, or several unresolved possibilities. Routers help choose a skill—or a direct answer. Reference essays and design probes are supporting resources, not more skill categories.

## Suites

| Suite | Entrypoints | Focus |
| --- | ---: | --- |
| [engineering](skills/engineering/README.md) | 11 | Requirements, testing, feedback, delivery, maintenance, security, operations; architecture and code-design exploration |
| [distributed](skills/distributed/README.md) | 1 | Alternative coordination designs, causality, and partial knowledge |
| [inquiry](skills/inquiry/README.md) | 6 | Research possibilities, experimental plans, reproducible execution, analysis, and communication |
| [quarry](skills/quarry/README.md) | 2 | Software discovery and use-specific project assessment |
| [surface](skills/surface/README.md) | 9 | Frontend journeys, state and visual exploration, implementation, tests, and maintenance |
| [atelier](skills/atelier/README.md) | 9 | Creative visual lenses, design-system implementation, and optional probes |

Start with `engineering:groundwork` for an unclear task, `engineering:assay` for a regression, `surface:bearings` for alternative frontend directions, or `atelier:canon` for visual possibilities. The three `pilot` routers are available in engineering, surface, and atelier. There is no mandatory suite-wide pipeline.

## Setup

In Claude Code, add the repository marketplace and install only the suites you want:

```text
/plugin marketplace add IamK77/Skill
/plugin install engineering@skill
/plugin install distributed@skill
/plugin install inquiry@skill
/plugin install quarry@skill
/plugin install surface@skill
/plugin install atelier@skill
```

Invoke a plugin skill by its namespace, such as `/engineering:assay` or `/atelier:color`. Alternatively, copy `skills/<suite>/<name>/` into your host's skills directory, preserving references, LICENSE, and NOTICE. Heuristics and routers need no checklist runtime.

**The rewritten SOPs require checklist 0.5 or newer.** The source and committed bundle in this working tree implement that interface; this does not imply an npm release has been published. With Node 20 or newer, the repository's self-contained bundle needs no dependency install:

```sh
node /absolute/path/to/Skill/devtools/checklist/bundle/checklist.mjs --help
```

Use that invocation wherever a skill says `checklist`, or put the matching local CLI on PATH. Installing a suite plugin does not by itself install a global CLI. Do not use an older global command without checking its version. See the [CLI guide](devtools/checklist/README.md) and [migration notes](devtools/checklist/MIGRATION.md).

## What checklist records—and what it does not prove

Each new task gets a distinct run ID, even when skill and project are the same. The project path is fixed at creation. Loading a skill never clears state; resuming is explicit.

```sh
checklist init /path/to/skill --new --path /path/to/project
# Retain the returned ID as RUN; follow that skill's concrete item names.
checklist show --run "$RUN"
checklist resume "$RUN"
checklist report --run "$RUN"
```

- `check` records a manual confirmation and its stated evidence. It cannot establish whether the claim is true or whether a person consented.
- `verify` executes the defined sensors and records their readings. Success covers those commands, not every manual item or the whole stage.
- `advance` explicitly closes a fulfilled phase. Later phase mutations require earlier phases to be closed.
- `done` completes a fulfilled run and retains its history. `reset --reason ...` abandons a run; it is not an alias for completion and does not erase evidence.
- N/A is allowed only where declared and requires a reason. Failed, errored, pending, and stale results do not satisfy completion.

The CLI constrains **its own state transitions**. It cannot stop an agent from reading later prose, doing work outside the CLI, or making a false manual assertion. It is not a sandbox, an authorisation system, or a proof of engineering quality.

## Maintained scope

Active work here is the skills, checklist CLI, authoring checks, and design probes. The root A/B experiment platform has been removed from the tracked tree; its source and artifacts remain in [Git history](docs/retired-ab.md). The supported [`quarry:touchstone`](skills/quarry/touchstone/SKILL.md) repository-assessment skill remains available.

The reference library follows the same split as the entrypoints: SOP method cards and creative lenses with optional technique notes. The full migration rewrote 194 references and retained 4 already-current routing notes; it does not leave a hidden legacy workflow behind. See [AUTHORING.md](AUTHORING.md) and the [migration record](docs/reference-migration.md).

## Development checks

```sh
cd devtools/checklist
npm ci
npm run bundle:check   # fails on a stale committed artifact; never rewrites it
npm test              # builds source; same run contract tests compiled and relocated bundle
cd ../..
python3 devtools/skill-lint.py
python3 -m unittest discover -s devtools -p 'test_skill_lint.py'
node devtools/checklist/dist/index.js lint skills --strict
```

After intentional CLI changes, run `npm run bundle` and review the generated diff before the freshness check. Probe tests remain in [canon](skills/atelier/canon/probes/README.md) and [color](skills/atelier/color/probes/README.md).

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

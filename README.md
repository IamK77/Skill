# Skill

Step-by-step engineering and research skills for Claude Code, with a CLI that won't let your coding agent skip a stage or mark one done when it isn't.

[![npm](https://img.shields.io/npm/v/@iamk77/skill-checklist?label=checklist&color=blue)](https://www.npmjs.com/package/@iamk77/skill-checklist) ![suites](https://img.shields.io/badge/suites-5-blue) ![skills](https://img.shields.io/badge/skills-28-blue) ![CLI tests](https://img.shields.io/badge/CLI%20tests-400%2B-brightgreen) ![node](https://img.shields.io/badge/node-%3E%3D18-blue) [![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

Your agent writes most of the code now. It also skips the test it said it wrote, marks a check green without running it, and quotes a number it never measured. In the diff, all three look fine.

Each skill here takes one part of established engineering or research practice and writes it down as ordered stages. A small CLI, [`checklist`](#checklist), holds the gate: a stage stays shut until every check before it is recorded as passed, and an attempt to jump ahead exits non-zero. The agent does the work and follows the method; it can't skip a stage or quietly close one it didn't do.

Here is the gate stopping an agent that jumped ahead in a testing run, then opening once the first stage is actually done:

```console
$ checklist verify survey                    # agent jumps to a later stage, before stage 0 is done
gate blocked: PHASE 0 (charter) incomplete   # exits non-zero — the run stops here

$ checklist check charter motivation-identified
[x] motivation-identified .. confirmed

$ checklist verify charter
PHASE 0 verified, proceed to PHASE 1         # the next stage opens only now
```

- **The order is enforced, not suggested.** A stage stays shut until every earlier check is recorded as passed. Re-run a check that now fails and it overwrites the old pass, so the gate reflects the current state, not a stale one.
- **37 skills across 6 suites** — the software lifecycle, distributed-systems correctness, computational research, open-source discovery, a frontend from 0 to 1, and the design craft behind it. Each suite installs as one Claude Code plugin.
- **It's just files.** A skill is a directory — one `SKILL.md`, a `references/` folder, one `.checklist.yml`. No runtime, no build step. Copy it into `~/.claude/skills/` and it runs without the plugin.
- **What's enforced, stated plainly.** The CLI enforces the *order* of stages and records that each check was confirmed. It does not yet check the *substance* of a check; that judgment stays with you and the agent. The mechanical-verify rules exist and are tested, but no shipped skill uses them yet.

## Quickstart

```sh
npm install -g @iamk77/skill-checklist   # the CLI that enforces every gate — without it a skill stops at its first command
```

```
/plugin marketplace add IamK77/Skill
/plugin install engineering@skill
/plugin install distributed@skill
/plugin install inquiry@skill
/plugin install quarry@skill
/plugin install surface@skill
/plugin install atelier@skill
```

First run: have existing code? `/engineering:assay path/to/module` — it works on any module and audits the tests you already have. Starting something new? `/engineering:groundwork <the-feature>`, or `/surface:bearings <the-feature>` for a frontend. Not sure which skill fits? `/engineering:pilot <your task>` (or `/surface:pilot` for frontend work) routes you — or tells you when no skill is needed.

Plugin-provided skills are prefixed by their plugin name — `/engineering:plumb`, `/distributed:holdfast`; bundling each suite into one plugin makes the prefix a meaningful namespace. To use a skill without plugins instead, copy `skills/<suite>/<name>/` (e.g. `skills/engineering/assay/`) into `~/.claude/skills/` (personal) or `.claude/skills/` (per-project), keep the `checklist` CLI on `PATH`, and drop the prefix: `/assay path/to/module`.

## The suites

Five suites, each installed as one plugin and documented on its own page. The per-skill detail — the full method, the stages, the references — lives in each skill's `SKILL.md`; each suite page below lists its skills and links straight to them.

- **[engineering](skills/engineering/)** — the software lifecycle, its security, and the craft of the code itself. *11 skills.*
- **[distributed](skills/distributed/)** — correctness for systems that span machines. *1 skill.*
- **[inquiry](skills/inquiry/)** — computational research, from a vague area to a published paper. *6 skills.*
- **[quarry](skills/quarry/)** — finding and judging other people's open-source, from a need to a repo you can trust. *2 skills.*
- **[surface](skills/surface/)** — building a modern frontend from 0 to 1; the suite's first domain vertical. *8 skills.*
- **[atelier](skills/atelier/)** — the design craft behind a premium interface: color, type, layout, form, and motion as one system. *9 skills.*

Every gated skill is the same shape — a `SKILL.md` walking ordered stages, each closed by a hard **GATE** the `checklist` CLI won't let the agent read past until the prior checks are recorded as passed. The navigators (`pilot`) are un-gated dispatchers and carry no `.checklist.yml`.

## Which skills you start, which the agent runs

The skills split by who pulls the trigger — and the line between them is the one thing an agent can't do for you: judgment.

- **You start these.** Each opens with a call only you can make — a taste decision, a one-way-door architecture choice, which gap to bet on — and an agent left to run one alone just fills in a plausible default and hands you a confident, hollow result. Reach for them when *you* are setting direction: `bearings` and `canon` for a frontend's architecture and visual language, `groundwork` and `load-bearing` for what to build and how to structure it, `prospect` / `crucible` / `ledger` / `reckoning` / `envoy` for the bets in a research project, `touchstone` for trusting a dependency. The agent still does the work behind each gate — it just can't place the bet. (`gungnir`, offensive security, is yours for a different reason: it must not act without your authorization.)
- **The agent reaches for these on its own.** They exist because an agent skips them by default — it writes the happy path and stops, ships a vulnerability green, reaches for a distributed lock by reflex. Disciplines like `seaworthy`, `trials`, `assay`, `flightline`, `stationkeeping`, `husbandry`, `plumb`, `holdfast`, and `aegis` are guardrails it should apply to its own output without being asked.
- **`pilot`** (one per suite) is the front door for either: the agent runs it to route a task — and to tell you when the next call is yours to make.

It's a spectrum, not a wall — many skills are *you set two or three gates, the agent runs the rest*. But it's why the two kinds read differently: a skill you trigger names the decision moment in a line or two; a skill the agent triggers carries a wider net of keywords so it catches the work inside a task.

## checklist

`checklist` is a TypeScript CLI (npm: [`@iamk77/skill-checklist`](https://www.npmjs.com/package/@iamk77/skill-checklist), built on `commander`). It loads a skill's `.checklist.yml`, tracks per-stage pass/fail state in the skill directory, and refuses to open a stage until every check in every prior stage is recorded as `pass` — not merely present. A check that regresses on re-verify overwrites a stale pass, so the gate reflects current state. (`checklist` calls these units `phases`; the skills present them to the user as `stages` — they are the same thing.)

```sh
npm install -g @iamk77/skill-checklist
```

A whole run is set up once and then walked stage by stage — `checklist init -d <skill>` reports the phases, `checklist show` reports where the run stands, `checklist check`/`verify` advance it, and a refused gate exits non-zero so an agent driving the run can't read past a closed gate as success.

The enforcement model, plainly: today every shipped skill's checks are manual human-judgment confirmations — the CLI's teeth are the ordered prior-stage gate plus regress-overwrites-stale-pass. Mechanical `verify` rules (`builtin:` / `shell:` / `script:`) exist and are tested, but no shipped skill uses them yet.

The published package ships a compiled `dist/` build run through Node directly (no `tsx`, no install-time compile); runtime deps are `commander`, `gray-matter`, and `js-yaml`; requires Node >= 18. Released via release-please from Conventional Commits, backed by a 400+-test vitest suite — current version: see [CHANGELOG](devtools/checklist/CHANGELOG.md) and Releases.

To run it from a clone instead, `cd Skill/devtools/checklist && npm install && npm run build && npm link`. Full command reference, directory-resolution rules, the `.checklist.yml` schema, and the `verify` rule kinds: **[devtools/checklist/README.md](devtools/checklist/README.md)**.

## Repository layout

```
skills/
  engineering/   distributed/   inquiry/   quarry/   surface/   # one dir per suite
                 # each suite dir: a README.md (the suite page) + its skill dirs
  …/<skill>/     # each gated skill: SKILL.md  references/  .checklist.yml  LICENSE  NOTICE
                 #      a navigator (pilot): SKILL.md  references/  LICENSE  NOTICE  (un-gated)
devtools/
  checklist/             # the gate CLI (see its own README)
.claude-plugin/
  marketplace.json       # registers the repo as a Claude Code plugin marketplace
LICENSE  NOTICE
```

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

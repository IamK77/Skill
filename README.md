# Skill — gated skill suites for Claude Code

Agents now write much of the code, and they do not reliably repeat process steps unless something enforces them. Each skill here moves one piece of human-era engineering practice into a form an agent-assisted workflow can follow: a multi-stage procedure whose stage gates are machine-enforced by the [`checklist`](#checklist) CLI — the agent cannot skip ahead, and cannot close a stage without recording every check. Two suites, each installable as one Claude Code plugin: **[engineering](#the-engineering-suite)** (the software lifecycle, its security, and the craft of the code itself) and **[distributed](#the-distributed-suite)** (correctness for systems that span machines).

## Quickstart

```sh
npm install -g @iamk77/skill-checklist   # the CLI that enforces every gate — without it a skill stops at its first command
```

```
/plugin marketplace add IamK77/Skill
/plugin install engineering@agent-era-skills
/plugin install distributed@agent-era-skills
```

First run: have existing code? `/engineering:assay path/to/module` — it works on any module and audits the tests you already have. Starting something new? `/engineering:groundwork <the-feature>`.

Plugin-provided skills are prefixed by their plugin name — `/engineering:plumb`, `/distributed:holdfast`; bundling each suite into one plugin makes the prefix a meaningful namespace. To use a skill without plugins instead, copy `skills/<name>/` into `~/.claude/skills/` (personal) or `.claude/skills/` (per-project), keep the `checklist` CLI on `PATH`, and drop the prefix: `/assay path/to/module`.

## What a gated run looks like

Every skill walks its stages in order, and the CLI refuses to open a stage until every check in every prior stage is recorded as `pass`. From a real `assay` session (stages are addressed by name, never by number; a refused gate exits non-zero):

```
$ checklist init $CLAUDE_SKILL_DIR --force
checklist ready, 8 phases
  0: charter (1 checks)
  1: survey (1 checks)
  ...

$ checklist verify survey                       # try to skip ahead
gate blocked: PHASE 0 (charter) incomplete

$ checklist check charter motivation-identified
[x] motivation-identified .. confirmed

$ checklist verify charter
PHASE 0: CHARTER

1. [x] motivation-identified .................... confirmed

PHASE 0 verified, proceed to PHASE 1            # now survey opens
```

## The engineering suite

Ten skills covering the engineering lifecycle, its security, and the craft of the code itself. The lifecycle runs **groundwork → load-bearing → flightline → assay → stationkeeping → husbandry**, with **gauge** (feedback), the **aegis** / **gungnir** security pair (shield & spear), and **plumb** (code craft) cross-cutting:

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| [**`groundwork`**](#groundwork) | Requirements — pin down what to build before building it | 5 |
| [**`load-bearing`**](#load-bearing) | Architecture — style, stack, boundaries, contracts, data model | 6 |
| [**`flightline`**](#flightline) | Engineering process — version control, review, CI/CD, dependencies | 6 |
| [**`assay`**](#assay) | Testing — what to test, how, and proving the suite can fail | 8 |
| [**`stationkeeping`**](#stationkeeping) | Operations — deploy & release, observability, monitoring, SLOs & incidents, capacity, DR | 7 |
| [**`husbandry`**](#husbandry) | Maintenance & evolution — debt, refactoring, defects, versioning, dependencies, legacy, retirement | 6 |
| [**`gauge`**](#gauge) | Feedback surface (cross-cutting) — strict types, boundary validation, legible failures | 5 |
| [**`aegis`**](#aegis) | Security (cross-cutting, the shield) — threat modeling, secure design & coding, SAST/DAST/SCA, OWASP defenses | 6 |
| [**`gungnir`**](#gungnir) | Adversarial validation (the spear) — authorized pentest: scope, recon, exploit, chain, fix & re-test | 6 |
| [**`plumb`**](#plumb) | Code craft (cross-cutting, the plumb line) — naming, functions, abstraction, trust-chains, smells, testability | 6 |

Every skill is a directory — `SKILL.md` + a `references/` library + a `.checklist.yml` gate definition. No build, no package step. Each section below links to the skill's directory; the stage tables live there.

### groundwork

`groundwork` is the requirements work that comes *before* code. It resists the agent's strongest instinct — implement the literal ask — and instead pins down what is actually worth building. Its output is a requirements baseline — the contract the build, and later `assay`'s tests, honor.

Invoke with `/engineering:groundwork <feature-or-change-to-scope>` · stages and references: [skills/groundwork/](skills/groundwork/)

### load-bearing

`load-bearing` designs architecture for the agent-assisted era. Architecture is the set of decisions that are *expensive to reverse* — so the skill triages every decision into a **one-way door** (data schema, public contract, trust model, the split into services) that earns real human judgment and an ADR, or a **two-way door** that gets a default and is left for agents to refactor freely. Its output is the architecture (boundaries, contracts, data model) and the ADRs the build honors.

Invoke with `/engineering:load-bearing <system-or-change-to-architect>` · stages and references: [skills/load-bearing/](skills/load-bearing/)

### flightline

`flightline` sets up or hardens a project's engineering process so quality is an **automated floor** that holds for everyone, instead of something each contributor has to remember. The agent era makes this the whole game: the most prolific contributor is an agent with no self-discipline, so every quality property not encoded as a hard, un-gameable gate is one it will eventually violate while looking successful.

Invoke with `/engineering:flightline <project-or-practice-area>` · stages and references: [skills/flightline/](skills/flightline/)

### assay

`assay` drives testing through a risk-driven decision tree: what is worth testing, which test type, which test double, and which cases actually catch bugs. A green suite is worthless until it has proven it can go red — so the skill drives a defect through its whole life. Shown in full as the one worked example — every other skill follows the same shape:

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

Invoke with `/engineering:assay <path/to/module>` · stages and references: [skills/assay/](skills/assay/)

### stationkeeping

`stationkeeping` is the operations work that begins where a green pipeline ends: **software's life is in production, not the repository** — and most outages are not logic bugs but deployment, configuration, capacity, or dependency failures that only exist once the system is live. It holds a running system *on station* — against drift, failure, load, and attack — tuned for a world where an agent operates production and reads a green dashboard as safety and silence as health.

Invoke with `/engineering:stationkeeping <service-or-system-to-operate>` · stages and references: [skills/stationkeeping/](skills/stationkeeping/)

### husbandry

`husbandry` is the maintenance-and-evolution work the whole lifecycle is really a down-payment on: maintenance is **60–80% of a system's total cost**, and software is **read and changed far more than it is written**. So it treats software not as a building you finish but as a living thing to keep cheaply changeable — tuned for a world where an agent does the maintaining and reaches for a rewrite, banks debt invisibly, refactors without a net, and rots the docs.

Invoke with `/engineering:husbandry <system-or-module-to-maintain>` · stages and references: [skills/husbandry/](skills/husbandry/)

### gauge

`gauge` engineers a codebase's feedback surface so an agent gets clear feedback at every step — **fast, local, attributed, deterministic, trustworthy, un-fakeable** — instead of flailing against late, opaque, or false-green signals. It is the *medium*, not a lifecycle phase: it makes the code emit clear signal and leans on its siblings for depth.

Invoke with `/engineering:gauge <project-or-module>` · stages and references: [skills/gauge/](skills/gauge/)

### aegis

`aegis` is the **shield**: it weaves security through the whole lifecycle instead of bolting it on at the end — because the worst weaknesses are architectural and can't be patched in later. It is cross-cutting like `gauge`, owning the security line and directing the siblings (SAST/secret-scan in `flightline`, runtime defense in `stationkeeping`).

Invoke with `/engineering:aegis <system-or-scope-to-secure>` · stages and references: [skills/aegis/](skills/aegis/)

### gungnir

`gungnir` is the **spear** that proves the shield: authorized, adversarial penetration testing of a system you own or have written permission to test, to find the holes while they're still cheap to fix. Its first gate is absolute — you attack only authorized targets, never anything else. **Authorized use only — your own or explicitly-permitted systems.**

Invoke with `/engineering:gungnir <your-own-or-authorized-target>` · stages and references: [skills/gungnir/](skills/gungnir/)

### plumb

`plumb` is the **plumb line** you hold against code to see whether it is *true*: a cross-cutting craft / legibility lens. Its thesis is the oldest in the craft — **code is written for humans to read, and only incidentally for a machine to run** — and its goal is *boring*: simple, clear, predictable code that the next reader (now usually an agent session with no context) gets at a glance. It owns the legibility line and routes fixes to its siblings (types to `gauge`, refactors to `husbandry`, tests to `assay`).

Invoke with `/engineering:plumb <code-to-audit>` · stages and references: [skills/plumb/](skills/plumb/)

## The distributed suite

Where the engineering suite is general software practice, the **distributed** suite is for systems that span machines — where partial failure, an unreliable asynchronous network, and the absence of a global clock make "correct" genuinely hard.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`holdfast`**](#holdfast) | Distributed correctness — partial failure, communication, ordering, replication, consensus, sharding, fault tolerance, coordination | 8 |

### holdfast

`holdfast` is the distributed-correctness lens — the realities a single-machine programmer (and an agent) gets wrong by default. The one shift it installs is **the third state**: a remote call can succeed, fail, *or leave you not knowing which* — and single-machine code has no branch for "I don't know," which is where most distributed bugs live. Its eight stages are eight facets of one problem — surviving partial failure, an asynchronous unreliable network, and the absence of a global clock or state: frame · communication · ordering · replication · consensus · sharding · fault tolerance · coordination.

Invoke with `/distributed:holdfast <design-or-code>` · stages and references: [skills/holdfast/](skills/holdfast/)

## checklist

`checklist` is a TypeScript CLI (npm: [`@iamk77/skill-checklist`](https://www.npmjs.com/package/@iamk77/skill-checklist), built on `commander`). It loads a skill's `.checklist.yml`, tracks per-stage pass/fail state in the skill directory, and refuses to open a stage until every check in every prior stage is recorded as `pass` — not merely present. A check that regresses on re-verify overwrites a stale pass, so the gate reflects current state. (`checklist` calls these units `phases`; the skills present them to the user as `stages` — they are the same thing.)

```sh
npm install -g @iamk77/skill-checklist
```

The enforcement model, plainly: today every shipped skill's checks are manual human-judgment confirmations — the CLI's teeth are the ordered prior-stage gate plus regress-overwrites-stale-pass. Mechanical `verify` rules (`builtin:` / `shell:` / `script:`) exist and are tested, but no shipped skill uses them yet.

The published package ships a compiled `dist/` build run through Node directly (no `tsx`, no install-time compile); runtime deps are `commander`, `gray-matter`, and `js-yaml`; requires Node >= 18. Released via release-please from Conventional Commits, backed by a 400+-test vitest suite — current version: see [CHANGELOG](devtools/checklist/CHANGELOG.md) and Releases.

To run it from a clone instead, `cd Skill/devtools/checklist && npm install && npm run build && npm link`. Full command reference, directory-resolution rules, the `.checklist.yml` schema, and the `verify` rule kinds: **[devtools/checklist/README.md](devtools/checklist/README.md)**.

## Repository layout

```
skills/
  groundwork/  load-bearing/  flightline/  assay/  stationkeeping/
  husbandry/   gauge/         aegis/       gungnir/ plumb/          # the engineering suite
  holdfast/                                                          # the distributed suite
                 # each: SKILL.md  references/  .checklist.yml  LICENSE  NOTICE
devtools/
  checklist/             # the gate CLI (see its own README)
.claude-plugin/
  marketplace.json       # registers the repo as a Claude Code plugin marketplace
LICENSE  NOTICE
```

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

# Skill

Step-by-step engineering and research skills for Claude Code, with a CLI that won't let your coding agent skip a stage or mark one done when it isn't.

[![npm](https://img.shields.io/npm/v/@iamk77/skill-checklist?label=checklist&color=blue)](https://www.npmjs.com/package/@iamk77/skill-checklist) ![suites](https://img.shields.io/badge/suites-5-blue) ![skills](https://img.shields.io/badge/skills-27-blue) ![CLI tests](https://img.shields.io/badge/CLI%20tests-400%2B-brightgreen) ![node](https://img.shields.io/badge/node-%3E%3D18-blue) [![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

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
- **27 skills across 5 suites** — the software lifecycle, distributed-systems correctness, computational research, open-source discovery, and a frontend from 0 to 1. Each suite installs as one Claude Code plugin.
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
```

First run: have existing code? `/engineering:assay path/to/module` — it works on any module and audits the tests you already have. Starting something new? `/engineering:groundwork <the-feature>`. Not sure which skill fits? `/engineering:pilot <your task>` routes you — or tells you when no skill is needed.

Plugin-provided skills are prefixed by their plugin name — `/engineering:plumb`, `/distributed:holdfast`; bundling each suite into one plugin makes the prefix a meaningful namespace. To use a skill without plugins instead, copy `skills/<suite>/<name>/` (e.g. `skills/engineering/assay/`) into `~/.claude/skills/` (personal) or `.claude/skills/` (per-project), keep the `checklist` CLI on `PATH`, and drop the prefix: `/assay path/to/module`.

## The five suites

- **[engineering](#the-engineering-suite)** — the software lifecycle, its security, and the craft of the code itself. 11 skills.
- **[distributed](#the-distributed-suite)** — correctness for systems that span machines. 1 skill.
- **[inquiry](#the-inquiry-suite)** — computational research, from a vague area to a published paper. 6 skills.
- **[quarry](#the-quarry-suite)** — finding and judging other people's open-source, from a need to a repo you can trust. 2 skills.
- **[surface](#the-surface-suite)** — building a modern frontend from 0 to 1; the suite's first domain vertical. 7 skills.

## What a gated run looks like

The gate above is one moment from a run. A whole `assay` (testing) run is eight stages, set up once:

```console
$ checklist init -d skills/engineering/assay
checklist ready, 8 phases
  0: charter (1 checks)
  1: survey (1 checks)
  2: triage (1 checks)
  3: choose (2 checks)
  4: compose (2 checks)
  5: build (3 checks)
  6: bite (3 checks)
  7: books (2 checks)
```

You confirm each check as you go, and `checklist show` reports where the run stands — what has passed, the stage you're on, and everything still shut:

```console
$ checklist show
PHASE 0: CHARTER              [x] passed
PHASE 1: SURVEY               [ ] pending
PHASE 2: TRIAGE               [ ] pending
PHASE 3: CHOOSE               [ ] pending
PHASE 4: COMPOSE              [ ] pending
PHASE 5: BUILD                [ ] pending
PHASE 6: BITE                 [ ] pending
PHASE 7: BOOKS                [ ] pending

current phase: PHASE 1
```

Stages are addressed by name, never by number, and a refused gate exits non-zero — so an agent driving the run can't read past a closed gate as success.

## The engineering suite

Ten skills covering the engineering lifecycle, its security, and the craft of the code itself. The lifecycle runs **groundwork → load-bearing → flightline → assay → stationkeeping → husbandry**, with **gauge** (feedback), the **aegis** / **gungnir** security pair (shield & spear), and **plumb** (code craft) cross-cutting. A separate un-gated navigator, **pilot**, sits in front of them all: tell it your task and it routes you to the right skill(s) in the right order — or says plainly when no skill is needed.

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| [**`pilot`**](#pilot) | Navigator (un-gated front door) — routes a task to the right skill(s), or says none is needed | — |
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

Every gated skill is a directory — `SKILL.md` + a `references/` library + a `.checklist.yml` gate definition (the navigator `pilot` is un-gated, so it carries no `.checklist.yml`). No build, no package step. Each section below links to the skill's directory; the stage tables live there.

### pilot

`pilot` is the **navigator** — the front door to the suite. It is a dispatcher, not a methodology, so it has **no gates**: tell it a task, a goal, or just a confusion, and it returns a routing verdict — run this skill, run these in this order, or *don't reach for a skill, here's why*. Its value is the four things a trigger-match can't do: **sequence** a multi-skill job, **redirect** ("you asked for a review, but there are no tests yet — start with `assay`"), **refuse** when no skill is warranted, and **disambiguate** the confusable pairs (`plumb` vs `gauge`, `assay` vs `gauge`, `flightline` vs `husbandry`, `aegis` vs `gungnir`). Before sending you into a gated skill it checks that the `checklist` CLI is installed.

Invoke with `/engineering:pilot <the-task-to-route>` · map and references: [skills/engineering/pilot/](skills/engineering/pilot/)

### groundwork

`groundwork` is the requirements work that comes *before* code. It resists the agent's strongest instinct — implement the literal ask — and instead pins down what is actually worth building. Its output is a requirements baseline — the contract the build, and later `assay`'s tests, honor.

Invoke with `/engineering:groundwork <feature-or-change-to-scope>` · stages and references: [skills/engineering/groundwork/](skills/engineering/groundwork/)

### load-bearing

`load-bearing` designs architecture for the agent-assisted era. Architecture is the set of decisions that are *expensive to reverse* — so the skill triages every decision into a **one-way door** (data schema, public contract, trust model, the split into services) that earns real human judgment and an ADR, or a **two-way door** that gets a default and is left for agents to refactor freely. Its output is the architecture (boundaries, contracts, data model) and the ADRs the build honors.

Invoke with `/engineering:load-bearing <system-or-change-to-architect>` · stages and references: [skills/engineering/load-bearing/](skills/engineering/load-bearing/)

### flightline

`flightline` sets up or hardens a project's engineering process so quality is an **automated floor** that holds for everyone, instead of something each contributor has to remember. The agent era makes this the whole game: the most prolific contributor is an agent with no self-discipline, so every quality property not encoded as a hard, un-gameable gate is one it will eventually violate while looking successful.

Invoke with `/engineering:flightline <project-or-practice-area>` · stages and references: [skills/engineering/flightline/](skills/engineering/flightline/)

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

Invoke with `/engineering:assay <path/to/module>` · stages and references: [skills/engineering/assay/](skills/engineering/assay/)

### stationkeeping

`stationkeeping` is the operations work that begins where a green pipeline ends: **software's life is in production, not the repository** — and most outages are not logic bugs but deployment, configuration, capacity, or dependency failures that only exist once the system is live. It holds a running system *on station* — against drift, failure, load, and attack — tuned for a world where an agent operates production and reads a green dashboard as safety and silence as health.

Invoke with `/engineering:stationkeeping <service-or-system-to-operate>` · stages and references: [skills/engineering/stationkeeping/](skills/engineering/stationkeeping/)

### husbandry

`husbandry` is the maintenance-and-evolution work the whole lifecycle is really a down-payment on: maintenance is **60–80% of a system's total cost**, and software is **read and changed far more than it is written**. So it treats software not as a building you finish but as a living thing to keep cheaply changeable — tuned for a world where an agent does the maintaining and reaches for a rewrite, banks debt invisibly, refactors without a net, and rots the docs.

Invoke with `/engineering:husbandry <system-or-module-to-maintain>` · stages and references: [skills/engineering/husbandry/](skills/engineering/husbandry/)

### gauge

`gauge` engineers a codebase's feedback surface so an agent gets clear feedback at every step — **fast, local, attributed, deterministic, trustworthy, un-fakeable** — instead of flailing against late, opaque, or false-green signals. It is the *medium*, not a lifecycle phase: it makes the code emit clear signal and leans on its siblings for depth.

Invoke with `/engineering:gauge <project-or-module>` · stages and references: [skills/engineering/gauge/](skills/engineering/gauge/)

### aegis

`aegis` is the **shield**: it weaves security through the whole lifecycle instead of bolting it on at the end — because the worst weaknesses are architectural and can't be patched in later. It is cross-cutting like `gauge`, owning the security line and directing the siblings (SAST/secret-scan in `flightline`, runtime defense in `stationkeeping`).

Invoke with `/engineering:aegis <system-or-scope-to-secure>` · stages and references: [skills/engineering/aegis/](skills/engineering/aegis/)

### gungnir

`gungnir` is the **spear** that proves the shield: authorized, adversarial penetration testing of a system you own or have written permission to test, to find the holes while they're still cheap to fix. Its first gate is absolute — you attack only authorized targets, never anything else. **Authorized use only — your own or explicitly-permitted systems.**

Invoke with `/engineering:gungnir <your-own-or-authorized-target>` · stages and references: [skills/engineering/gungnir/](skills/engineering/gungnir/)

### plumb

`plumb` is the **plumb line** you hold against code to see whether it is *true*: a cross-cutting craft / legibility lens. Its thesis is the oldest in the craft — **code is written for humans to read, and only incidentally for a machine to run** — and its goal is *boring*: simple, clear, predictable code that the next reader (now usually an agent session with no context) gets at a glance. It owns the legibility line and routes fixes to its siblings (types to `gauge`, refactors to `husbandry`, tests to `assay`).

Invoke with `/engineering:plumb <code-to-audit>` · stages and references: [skills/engineering/plumb/](skills/engineering/plumb/)

## The distributed suite

Where the engineering suite is general software practice, the **distributed** suite is for systems that span machines — where partial failure, an unreliable asynchronous network, and the absence of a global clock make "correct" genuinely hard.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`holdfast`**](#holdfast) | Distributed correctness — partial failure, communication, ordering, replication, consensus, sharding, fault tolerance, coordination | 8 |

### holdfast

`holdfast` is the distributed-correctness lens — the realities a single-machine programmer, and an agent, gets wrong by default. Its one idea is **the third state**: a remote call can succeed, fail, *or leave you not knowing which*, and single-machine code has no branch for "I don't know" — which is where most distributed bugs live. The eight stages are eight faces of one problem, surviving partial failure, an asynchronous and unreliable network, and the absence of a global clock or shared state: frame · communication · ordering · replication · consensus · sharding · fault tolerance · coordination.

Invoke with `/distributed:holdfast <design-or-code>` · stages and references: [skills/distributed/holdfast/](skills/distributed/holdfast/)

## The inquiry suite

Where the engineering and distributed suites are about *building* software, the **inquiry** suite is about *doing computational research* — the work of going from a vague area to published results in any field where you run experiments to publish (machine learning, combinatorial optimization, operations research, systems, scheduling). It updates human-era research practice for a world where the agent does the searching, reading, reproducing, drafting, and defending — and therefore fools you by default, optimizing for output that *looks* like a result. Six skills form the complete pipeline over all six research steps, each handing the next a concrete artifact: **prospect** (find and prove the gap) → **crucible** (design the method) → **ledger** (design the experiments) → **forge** (run the experiments) → **reckoning** (analyze the results) → **envoy** (write it up, submit, and defend). Across all six the human keeps four things — taste, spec, judgment, and the signature on the claims — and everything else is discipline and the agent.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`prospect`**](#prospect) | Research-gap prospecting — bound the ground, mine candidate gaps in parallel, attack & rank, kill cheaply, land the gap | 6 |
| [**`crucible`**](#crucible) | Method design — decidable spec, oracle ceiling, race death-orthogonal variants in a feasibility-checked tournament, deepen with theory / ablation / novelty | 7 |
| [**`ledger`**](#ledger) | Experiment design — claim-evidence matrix, exploration/confirmation firewall, instances & fair baselines, statistics, ablation & sensitivity, frozen protocol | 7 |
| [**`forge`**](#forge) | Experiment run — harden the method to research-standard code, per-run provenance, idempotent pipeline with a read-only operator agent, version-tag integrity, one-command regeneration | 6 |
| [**`reckoning`**](#reckoning) | Results analysis — audit before reading, distribution & slices with honest statistics, ablation traps, mechanism probes, failure boundary, claim verdicts, systematized red-team | 7 |
| [**`envoy`**](#envoy) | Writing, submission & rebuttal — figure-first skeleton, claim-organized sections, the three agent red-lines (every number to a run id), venue-fit submission, the four-beat rebuttal, the revise-before-resubmit ladder | 6 |

### prospect

Research step one is choosing what to work on and proving it is worth the months it will cost. `prospect` throws out the usual way that choice gets made — close-reading the literature until an idea *emerges* — and **mines** for the gap instead: a fixed set of extraction strategies (the **seven seams**: limitation-clustering, the cross-blank matrix, assumption-audit, leaderboard-weakness, reproduction-arbitrage, cross-domain transplant, trend arbitrage) run in parallel, and every candidate they turn up has to **survive an adversarial "prove this was already done" attack** before you bet on it. A gap you read out of a paper is a hope; one that survives the attack is closer to evidence. The agent does the mining and the attacking, but never the deciding — three judgments stay yours: how to slice the dimensions, why a blank is blank, and which gap to back. The six stages go frame · mine · filter · rank · kill · land, and the literature review is *done* the moment you hold three things: a one-page gap statement, a comparison table against the core papers, and one or two of their baselines reproduced on your own machine.

Invoke with `/inquiry:prospect <area-to-prospect-or-gap-to-stress-test>` · stages and references: [skills/inquiry/prospect/](skills/inquiry/prospect/)

### crucible

A method used to take weeks to implement, so you bet on one idea and then talked yourself into it. `crucible` turns a landed gap into a method by using the fact that an agent can prototype *each* candidate cheaply: build several variants and **race them to death** in an elimination tournament, scored against kill criteria you commit to *before* the race rather than after you've fallen for one. The scaffold runs an **independent feasibility checker**, because a variant that suddenly soars is usually emitting infeasible solutions nobody checked. You size the prize first with an **oracle ladder** — the total gap says whether the direction is worth chasing, the per-level gaps say which component to attack — and you deepen the survivor afterward: theory (hunt for a counterexample before you try to prove anything, and guard against proof-laundering), pre-wired ablation switches, and a mechanism-keyword novelty defense. Seven stages: spec · ceiling · variants · tournament · theory · ablation · novelty.

Invoke with `/inquiry:crucible <gap-to-turn-into-a-method-or-method-to-stress-test>` · stages and references: [skills/inquiry/crucible/](skills/inquiry/crucible/)

### ledger

`ledger` designs the experiments that turn a method into evidence a reviewer will believe, and the discipline is to **write down what counts as evidence before you look at any data**. The protocol — the claims, the instances, the baselines, the metrics, and the conditions that would support *or refute* each claim — is frozen before the main run, because running first and choosing the story afterward is just the experiment-stage version of p-hacking. The piece everything hangs on is a **firewall between exploration and confirmation**: you chaos-test an MVP to throw off hypotheses, but those numbers live in an append-only notebook and never reach the paper, and confirmation re-runs the survivors on fresh seeds and instances under the frozen protocol. The agent works the experiments — batch-submit, monitor, auto-retry, summarize — and never rules on what the numbers mean. Seven stages: matrix · firewall · instances · baselines · stats · ablation · freeze.

Invoke with `/inquiry:ledger <method-to-design-experiments-for-or-protocol-to-stress-test>` · stages and references: [skills/inquiry/ledger/](skills/inquiry/ledger/)

### forge

By step four the method has survived and the protocol is frozen, so `forge` is where the experiments actually run and get recorded. What changes here is *who the agent is*: the code is hardened and frozen, and the agent drops from developer to **operator — read and execute, no write.** The reason is blunt. A coding agent optimizes for "the test passed," not "the result is correct," and the shortest path to a passing validator is to edit the validator; taking away write access closes that path in a way no amount of instruction can. Everything serves one standard, **one-command regeneration**: every table and figure rebuilds from the raw results with a single command, which buys reproducibility, resistance to data-rot, and the reproduction package in one move. Getting there means hardening the MVP to a research standard (config-ize it, force a single metric path, add an **independent feasibility checker**, freeze the interface), stamping each run with a provenance archive behind a clean-commit gate, driving the grid through an idempotent pipeline that retries resource failures but never code failures, and version-tagging every result so a summary script refuses to build a table from mixed versions. Six stages: harden · provenance · pipeline · operator · integrity · regen.

Invoke with `/inquiry:forge <method-and-protocol-to-run-or-experiment-run-problem-to-fix>` · stages and references: [skills/inquiry/forge/](skills/inquiry/forge/)

### reckoning

`reckoning` turns a finished results store into settled claims, mechanism evidence, and paper-grade figures, and it starts by distrusting the data. Analysis here is audit, attribution, and the careful statement of evidence — not computing a mean and seeing whose is bigger. You **audit before you read**: a number that looks too good is a bug or an infeasible solution until it survives that suspicion. You show *why* the method wins with **mechanism probes** — checkable predictions that are deliberately not the headline result, and they are the line between a paper that is publishable and one that is strong. And you defend against the **garden of forking paths**, which the agent era makes worse, because when experiments are cheap so is unconscious cheating; the same cheap compute, pointed at the whole analysis multiverse instead of the prettiest path through it, turns from a false-positive factory into a robustness proof. The agent audits, runs the probes, and plays systematic adversarial reviewer; you keep the three calls it cannot make — the unit of analysis, what the mechanism predicts, and how each claim is settled. The seven stages — audit · distribution · ablation · mechanism · boundary · verdict · redteam — leave the paper already written in pieces: the claims are its argument, the protocol its method, the probes its discussion.

Invoke with `/inquiry:reckoning <results-to-analyze-or-analysis-claim-figure-to-stress-test>` · stages and references: [skills/inquiry/reckoning/](skills/inquiry/reckoning/)

### envoy

If the first five steps kept their discipline, the paper already exists in pieces before `envoy` opens: the claims are its argument, the frozen protocol its experiments section, the mechanism probes its discussion, the comparison table its related work. Writing is mostly stringing that argument into prose, not composing from a blank page. This is also the step where the line between human and agent is sharpest. The agent polishes, runs the consistency vet, and reader-tests the draft — hand a clean session the paper, ask it to restate the claims, and wherever it stumbles is where you wrote unclearly — and it runs the rebuttal-window experiments that forge's one-command pipeline now makes feasible, the one thing the agent era genuinely changes about rebuttal. What it must never do is write a sentence whose evidence it has not seen: every number traces to a run id, and the story, the contributions, and the signature stay in your hand. The six stages — skeleton · draft · vet · submit · rebuttal · persist — carry the work from a figure-first skeleton through the court of peers, with the 48-hour rule, the four-beat rebuttal, and the revise-before-resubmit ladder along the way. When the paper lands the research is finished, and the next one begins again at `prospect`.

Invoke with `/inquiry:envoy <analyzed-results-to-write-up-or-writing-venue-rebuttal-problem>` · stages and references: [skills/inquiry/envoy/](skills/inquiry/envoy/)

## The quarry suite

Where the other suites build and study software, the **quarry** suite is about finding and judging *other people's* — getting from a need, or idle curiosity, to a repository worth trusting, without the usual ritual of searching by keyword and believing the star count. Two skills: one finds, one judges. Both turn on the same shift, which is what the agent changed. It can run forty searches or check fifty repos while you blink, but it trusts the signals cheapest to fake — a high star count, a fluent README — which in 2026 is exactly what an abandoned project or an AI-generated star-farm wears. So the agent does the legwork and you keep the two things it can't: the taste to know what's worth opening, and the calibration of what a verdict means for your risk.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`forage`**](#forage) | Discovery — find candidates worth your time, by target or by serendipity, captured cheaply with provenance | 5 |
| [**`touchstone`**](#touchstone) | Evaluation — scan the dashboards not the code, weight the un-gameable signals over the gameable, score three axes, calibrate to your use | 6 |

### forage

`forage` finds the few repositories worth your time, in either of the two modes finding actually happens in. When you arrive with a concrete need, it sharpens the need-spec until "does this fit?" is a yes/no, then fans every search seam out in parallel — qualifier combinations, a trusted developer's stars, the right awesome list, a project's dependency graph, off-peak trending, the "alternative to X?" threads in issues — and returns a deduped, provenance-tagged shortlist. When you arrive with no goal and just want to be surprised, it ranges the high-signal surfaces (Show HN, the topic corners, the feeds of people whose taste you trust) with an adjacency dial aimed at the orthogonal, and captures what it finds cheaply so none of it is lost. The shift it installs is that search-syntax mastery is commoditized — the agent knows every qualifier — so your edge is the need-spec and the taste, and the agent never decides what is worth opening. Five stages: frame · seams · cast · sift · capture.

Invoke with `/quarry:forage <a-need-to-hunt-or-a-vibe-to-wander>` · stages and references: [skills/quarry/forage/](skills/quarry/forage/)

### touchstone

`touchstone` judges a repository in minutes by scanning its dashboards instead of reading its code. An agent can pull the commit history, issue timeline and contributor graph for fifty repos in seconds, but it ranks them by the two signals cheapest to fake — the star count and a polished README — which is what a dead project or an AI-generated, feature-stacked star-farm wears best. So it inverts the weighting: discount stars and README polish, weight what can't be cheaply faked (commit substance, whether the maintainer actually answers issues, the bus factor, real downstream use, tests and CI), run an explicit slop detector, and score three axes — alive, healthy, well-built — without averaging them into one misleading number. The verdict is calibrated to your use, because the same single-maintainer tool is a fine weekend tryout and a poor production dependency, and every claim traces back to the repo. Six stages: frame · scan · signal-weight · slop-check · score · verdict.

Invoke with `/quarry:touchstone <a-repo-or-shortlist-and-what-you-need-it-for>` · stages and references: [skills/quarry/touchstone/](skills/quarry/touchstone/)

## The surface suite

Where the other suites are deliberately domain-agnostic, the **surface** suite is the first vertical: building a modern **frontend** from 0 to 1. It exists because frontend is the one discipline whose "correct" is not checked against a document — its benchmark is a human nervous system (16ms is a fusion threshold, 100ms is "I touched it directly"), so **taste is load-bearing and cannot be outsourced**, and as the agent writes the code the leverage migrates from the keyboard to the membrane between machine and mind: *which boundary, whose source of truth, what causal story forms in the user's head, and whose interest the optimizer serves.* Seven gated lenses run the build lifecycle, each handing the next a concrete artifact, with three principles threaded through all of them — **boundaries > frameworks**, **allocate caution by reversibility** (one-way vs two-way doors), and **the source of truth lives in the user's mind, not the database**.

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| [**`bearings`**](#bearings) | Before the first line — model the mind, fix the one-way doors, write the perception contract, set the objective function | 5 |
| [**`keel`**](#keel) | Walking skeleton — pierce every integration seam with one real-but-trivial slice, with a contract that can't drift | 4 |
| [**`wellspring`**](#wellspring) | State architecture (the heart) — classify state, minimize the source of truth, model the implicit machine | 4 |
| [**`seaworthy`**](#seaworthy) | Build, unhappy-path-first — the four states are the product; illusion-maintenance, accessibility, a perf budget | 4 |
| [**`shakedown`**](#shakedown) | Correctness — test behavior not structure (the testing trophy), mock only the network | 4 |
| [**`lookout`**](#lookout) | Delivery & observability — RUM as psychophysics, plus the pre-launch objective-function ethics gate | 4 |
| [**`bulwark`**](#bulwark) | 1→N — fight entropy by making the architecture self-enforcing; a steady state | 5 |

### bearings

`bearings` is the work before the first line of code — the stage that writes no business logic yet decides the project's fate, because it pins the decisions that are brutal to reverse while reversing them is still free. It resists the agent's instinct to scaffold, and instead models the user's mind (not the database), fixes the boundaries and the source-of-truth one-way doors, writes the perception contract (the latency tiers that become architecture constraints), and sets the objective function and its guardrails *before* the metrics dashboard exists to pull every decision. Its output is five one-page artifacts the whole build honors.

Invoke with `/surface:bearings <the-frontend-product-or-feature-to-scope>` · stages and references: [skills/surface/bearings/](skills/surface/bearings/)

### keel

`keel` lays the walking skeleton: the thinnest possible feature that nonetheless passes through every real integration **seam** — auth, the data contract, hydration, the state round-trip, deploy, config — end to end, deployed, on day one, while a leak is still free to fix. It exists because projects die at the seams, not in any one component, and the agent hides that risk by building wide on mock data ("looks 90% done"). Its output is a deployed, CI-green, real-but-trivial slice and a contract generated from one source so types can't drift.

Invoke with `/surface:keel <the-architecture-to-prove-end-to-end>` · stages and references: [skills/surface/keel/](skills/surface/keel/)

### wellspring

`wellspring` is the state architecture — the heart of the system, where the project's complexity ceiling is set. Its one idea is that nearly all frontend bugs are state with more than one copy drifting out of sync, so it relentlessly **classifies** every piece of state into the single bucket that owns it (most of what looks "global" is server-cache in disguise), minimizes the source of truth and derives the rest, models hard interactions as explicit state machines, and wires data along the dependency graph rather than down the component tree. Its output is a written state-classification map.

Invoke with `/surface:wellspring <the-application-state-to-architect-or-audit>` · stages and references: [skills/surface/wellspring/](skills/surface/wellspring/)

### seaworthy

`seaworthy` builds the feature, with one inverted discipline: the happy path is ~40% done, not 90%, so you design the **unhappy paths first**. What you ship is not a correct program but a maintained *illusion* of direct manipulation over an async, failing machine — so the loading / error / empty / edge states are the product (illusion-maintenance: optimistic updates with rollback, animation as causal narrative), and accessibility and a performance budget are built into every slice, not bolted on. Its output is feature slices that catch the user when the system breaks.

Invoke with `/surface:seaworthy <the-feature-slice-to-build-or-audit>` · stages and references: [skills/surface/seaworthy/](skills/surface/seaworthy/)

### shakedown

`shakedown` is correctness, organized around one question that decides whether a test suite is a safety net or a straitjacket: does the test go red when *behavior* changes, or when the *implementation* changes? It tests observable behavior, never internal structure, and spends the test budget where frontend bugs actually cluster — at integration — which makes the right shape a testing **trophy**, not the classic pyramid. It mocks only the network (with a contract-true mock), prunes the tests that don't earn their keep, and proves the suite can go red.

Invoke with `/surface:shakedown <the-feature-or-suite-to-test-or-audit>` · stages and references: [skills/surface/shakedown/](skills/surface/shakedown/)

### lookout

`lookout` is delivery and observability — and the place the suite's ethics becomes a launch gate. Shipping is the start of the conversation with reality, so every change gets a preview, and the real world is instrumented (RUM is psychophysics encoded as numbers — field, not lab). The heavy part: because A/B testing is a gradient-descent optimizer that will **discover manipulation as a local optimum with no one designing it**, the objective function set in `bearings` returns here as a pre-launch ethics gate with declared guardrails and an automatic kill-switch. The real villain is never a person — it is the loss function.

Invoke with `/surface:lookout <the-delivery/observability-to-set-up-or-the-metric/experiment-to-gate>` · stages and references: [skills/surface/lookout/](skills/surface/lookout/)

### bulwark

`bulwark` is the 1-to-N work, where the enemy is no longer building but **entropy** — boundaries eroded one "just this once" import at a time, the two graphs drifting apart as features pile on. Its one move is to make the architecture *self-enforcing*, because at scale no one remembers the rules: boundaries fossilized into lint and fitness functions, wrong abstractions pruned (not just stacked), module edges aligned to team edges (Conway), and the design system kept a living, discoverable artifact. There is no exit — 1-to-N is a steady state, read by one external metric: how fast a newcomer ships on the docs alone.

Invoke with `/surface:bulwark <the-living-frontend-system-to-keep-changeable>` · stages and references: [skills/surface/bulwark/](skills/surface/bulwark/)

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
  engineering/                                                       # the engineering suite
    pilot/                                                           # navigator (un-gated front door)
    groundwork/  load-bearing/  flightline/  assay/  stationkeeping/
    husbandry/   gauge/         aegis/       gungnir/  plumb/
  distributed/                                                       # the distributed suite
    holdfast/
  inquiry/                                                           # the inquiry suite
    prospect/  crucible/  ledger/  forge/  reckoning/  envoy/
  quarry/                                                            # the quarry suite
    forage/  touchstone/
  surface/                                                           # the surface suite
    bearings/  keel/  wellspring/  seaworthy/  shakedown/  lookout/  bulwark/
                 # each gated skill: SKILL.md  references/  .checklist.yml  LICENSE  NOTICE
                 # pilot (un-gated): SKILL.md  references/  LICENSE  NOTICE
devtools/
  checklist/             # the gate CLI (see its own README)
.claude-plugin/
  marketplace.json       # registers the repo as a Claude Code plugin marketplace
LICENSE  NOTICE
```

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

# Skill

Agent-era skill suites for Claude Code, organized by domain — each installable as one plugin, gated by the `checklist` CLI. The first suite is **engineering**; more domains will follow.

## The engineering suite

Ten Claude Code skills covering the engineering lifecycle, its security, and the craft of the code itself. The lifecycle runs **groundwork → load-bearing → flightline → assay → stationkeeping → husbandry**, with **gauge** (feedback), the **aegis** / **gungnir** security pair (shield & spear), and **plumb** (code craft) cross-cutting:

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| **`groundwork`** | Requirements — pin down what to build before building it | 5 |
| **`load-bearing`** | Architecture — style, stack, boundaries, contracts, data model | 6 |
| **`flightline`** | Engineering process — version control, review, CI/CD, dependencies | 6 |
| **`assay`** | Testing — what to test, how, and proving the suite can fail | 8 |
| **`stationkeeping`** | Operations — deploy & release, observability, monitoring, SLOs & incidents, capacity, DR | 7 |
| **`husbandry`** | Maintenance & evolution — debt, refactoring, defects, versioning, dependencies, legacy, retirement | 6 |
| **`gauge`** | Feedback surface (cross-cutting) — strict types, boundary validation, legible failures | 5 |
| **`aegis`** | Security (cross-cutting, the shield) — threat modeling, secure design & coding, SAST/DAST/SCA, OWASP defenses | 6 |
| **`gungnir`** | Adversarial validation (the spear) — authorized pentest: scope, recon, exploit, chain, fix & re-test | 6 |
| **`plumb`** | Code craft (cross-cutting, the plumb line) — naming, functions, abstraction, trust-chains, smells, testability | 6 |
| `checklist` | The TypeScript CLI that enforces every skill's stage gates | — |

Apache-2.0, Copyright 2026 IamK77.

## Install

Each skill is a directory — `SKILL.md` + a `references/` library + a `.checklist.yml` gate definition. No build, no package step.

**Per skill:** copy `skills/<name>/` into a path Claude Code discovers skills from, ensure the `checklist` CLI is installed and on `PATH` (see [checklist](#checklist) — it is what enforces every skill's gates), then invoke it, e.g. `/groundwork <target>` or `/assay path/to/module`. Each skill's `SKILL.md` opens with `` !`checklist init ${CLAUDE_SKILL_DIR} --force` `` and drives its own gates from there.

**As a plugin marketplace:** register the repo and install the whole suite as one plugin:

```
/plugin marketplace add IamK77/Skill
/plugin install engineering@agent-era-skills
```

This installs all ten skills under the `engineering` namespace — invoke them as `/engineering:groundwork`, `/engineering:assay`, `/engineering:plumb`, and so on. (Plugin-provided skills are always prefixed by their plugin name; bundling the suite into one `engineering` plugin makes that prefix a meaningful namespace rather than a per-skill repeat.)

## groundwork

`groundwork` is the requirements work that comes *before* code. It resists the agent's strongest instinct — implement the literal ask — and instead pins down what is actually worth building, across five gated stages:

| Stage | Does |
|-------|------|
| **Elicit** | Map the stakeholders (including the silent-but-affected) and dig out the real need under a solution-shaped ask |
| **Analyze** | Split functional from non-functional, sweep the NFRs, prioritize with MoSCoW, and draw the out-of-scope line |
| **Specify** | Turn each funded requirement into a verifiable user story + Given/When/Then acceptance criteria; replace vague words with numbers |
| **Validate** | Walk the requirements back to the user, confirm what you understood is what they want, and park the unconfirmable as named open questions |
| **Manage** | Set a baseline, a lightweight change process, and traceability so a later change tells you what it touches |

Six references back the five stages. Its output is a requirements baseline — the contract the build, and later `assay`'s tests, honor. Invoke with `/groundwork <feature-or-change-to-scope>`.

## load-bearing

`load-bearing` designs architecture for the agent-assisted era. Architecture is the set of decisions that are *expensive to reverse* — so the skill triages every decision into a **one-way door** (data schema, public contract, trust model, the split into services) that earns real human judgment and an ADR, or a **two-way door** that gets a default and is left for agents to refactor freely. Six gated stages:

| Stage | Does |
|-------|------|
| **Frame** | Set the weight class, triage decisions by reversibility, reconcile inherited decisions |
| **Structure** | Architecture style (Monolith First, sharpened) and machine-enforced module boundaries |
| **Select** | Choose the stack on agent-era criteria — model fluency, version stability, reviewer verifiability |
| **Contracts & data** | The hardest-to-reverse layer: interface-first contracts, SQL-vs-NoSQL by access pattern, explicit CAP |
| **Non-functional** | Turn each NFR into a design decision *and* an enforced guardrail |
| **Record** | Capture every one-way-door decision as an ADR — persistent memory across stateless agent sessions |

Eight references back the six stages. Its output is the architecture (boundaries, contracts, data model) and the ADRs the build honors. Invoke with `/load-bearing <system-or-change-to-architect>`.

## flightline

`flightline` sets up or hardens a project's engineering process so quality is an **automated floor** that holds for everyone, instead of something each contributor has to remember. The agent era makes this the whole game: the most prolific contributor is an agent with no self-discipline, so every quality property not encoded as a hard, un-gameable gate is one it will eventually violate while looking successful. Six gated stages:

| Stage | Does |
|-------|------|
| **Calibrate** | How much process this project earns (team × cadence × agent involvement) |
| **Version control** | Branching matched to cadence, atomic commits, machine-enforced secret/`.gitignore` discipline |
| **Code style** | Formatter + linter enforced by machine, so review attention is spent only on logic |
| **Code review** | Small reviewable PRs; the human as the irreplaceable gate on agent code |
| **CI/CD** | Fast, stable, **un-gameable** pipelines; red-means-stop; one-click rollback |
| **Dependencies & reproducibility** | Lockfiles, supply-chain review, container parity, a README a fresh agent can bootstrap from |

Seven references back the six stages. Invoke with `/flightline <project-or-practice-area>`.

## assay

`assay` drives testing through a risk-driven decision tree: what is worth testing, which test type, which test double, and which cases actually catch bugs. A green suite is worthless until it has proven it can go red — so the skill drives a defect through its whole life, across eight gated stages:

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

Ten references back the eight stages. `assay`'s checklist defines 15 checks across the 8 stages, all manual human-judgment confirmations, so the gate's enforcement comes from the per-check confirmations plus the sequential prior-stage gate. Invoke with `/assay <path/to/module>`.

## stationkeeping

`stationkeeping` is the operations work that begins where a green pipeline ends: **software's life is in production, not the repository** — and most outages are not logic bugs but deployment, configuration, capacity, or dependency failures that only exist once the system is live. It holds a running system *on station* — against drift, failure, load, and attack — across seven gated stages, tuned for a world where an agent operates production and reads a green dashboard as safety and silence as health:

| Stage | Does |
|-------|------|
| **Calibrate** | Size operational rigor to blast radius × criticality × scale × agent-ops share; pick SETUP vs AUDIT |
| **Release** | Rehearsed rollback; progressive delivery (canary/blue-green/rolling) and feature flags that decouple *deploy* from *release*; immutable infra |
| **Environments** | Infrastructure as code, container parity across dev/staging/prod, config separated from code |
| **Observability** | The three pillars (logs/metrics/traces) with a trace id; monitoring vs observability; secrets/PII kept out of telemetry |
| **Monitoring** | The golden signals over machine metrics; symptom-based, actionable alerts — no alert fatigue |
| **Reliability** | SLOs and an error budget (not 100%); on-call, runbooks, blameless postmortems; MTTR over MTBF |
| **Continuity** | Capacity proven by load test; FinOps cost; least-privilege runtime security; rehearsed backups/DR (RTO/RPO) |

Eight references back the seven stages. Its output is a production-ready, operable system and the rehearsed controls that keep it serving users. Invoke with `/stationkeeping <service-or-system-to-operate>`.

## husbandry

`husbandry` is the maintenance-and-evolution work the whole lifecycle is really a down-payment on: maintenance is **60–80% of a system's total cost**, and software is **read and changed far more than it is written**. So it treats software not as a building you finish but as a living thing to keep cheaply changeable — across six gated stages, tuned for a world where an agent does the maintaining and reaches for a rewrite, banks debt invisibly, refactors without a net, and rots the docs:

| Stage | Does |
|-------|------|
| **Frame** | Size the care to the system's stage of life (growing / steady / legacy / sunsetting); judge every change by the cost of the *next* one |
| **Debt** | Make technical debt visible and budgeted (Fowler's quadrant); resist the impulsive big rewrite |
| **Refactor** | Improve structure under a test net; small & continuous; characterization tests for legacy; separate commits |
| **Defects** | Triage; reproduce with a failing test first; fix the root cause (5 Whys), not the symptom |
| **Evolve** | Semver & backward-compatible APIs with graceful deprecation; keep dependencies current, before EOL |
| **Continuity** | Lower the bus factor; living docs (stale docs are worse than none); strangler-fig legacy migration; planned retirement |

Eight references back the six stages. Its output is a system that stays cheap to change for as long as it is worth keeping alive. Invoke with `/husbandry <system-or-module-to-maintain>`.

## gauge

`gauge` engineers a codebase's feedback surface so an agent gets clear feedback at every step — **fast, local, attributed, deterministic, trustworthy, un-fakeable** — instead of flailing against late, opaque, or false-green signals. It is the *medium*, not a lifecycle phase: it makes the code emit clear signal and leans on its siblings for depth. Five gated stages:

| Stage | Does |
|-------|------|
| **Frame** | Enumerate the ways the code can fail, weight by blast radius, set strictness by risk |
| **Static layer** | The leftmost, cheapest signal — strict checker as a gate, typed records, errors in the signature |
| **Boundary** | Validate (don't assert) untrusted data into typed models at every edge; contain `Any`/`any` |
| **Behavior & runtime** | Behavior tests as legible oracles, structured failures, observability hooks |
| **Trustworthy** | Make signals un-fakeable and make *absence* itself a signal (unchecked paths, coverage, mutation) |

Six references back the five stages. Invoke with `/gauge <project-or-module>`.

## aegis

`aegis` is the **shield**: it weaves security through the whole lifecycle instead of bolting it on at the end — because the worst weaknesses are architectural and can't be patched in later. It is cross-cutting like `gauge`, owning the security line and directing the siblings (SAST/secret-scan in `flightline`, runtime defense in `stationkeeping`), across six gated stages, tuned for a world where an agent writes insecure code by default, has no threat model, trusts its input, and ships a vulnerability green:

| Stage | Does |
|-------|------|
| **Frame** | Size the defense to risk (crown jewels, data classification); set the timeless principles (least privilege, defense in depth, fail secure, zero trust) |
| **Model** | Threat-model with STRIDE; mark trust boundaries and the attack surface; rank by risk |
| **Design** | Vetted auth (never invent crypto), server-side authorization, defense in depth, fail secure |
| **Build** | Never trust input (parameterized queries, output encoding); secrets out of code; least privilege |
| **Verify** | Gate SAST/DAST/SCA blocking; walk the OWASP Top 10; hand the adversarial attack to `gungnir` |
| **Operate** | Runtime defense & monitoring; patch CVEs continuously; rehearsed incident response |

Eight references back the six stages. Invoke with `/aegis <system-or-scope-to-secure>`.

## gungnir

`gungnir` is the **spear** that proves the shield: authorized, adversarial penetration testing of a system you own or have written permission to test, to find the holes while they're still cheap to fix. Its first gate is absolute — you attack only authorized targets, never anything else — and it drives a real attack through its whole arc across six gated stages, tuned for a world where an agent can run the tools, shares the defender's blind spots, and mistakes a clean scan for a secure system:

| Stage | Does |
|-------|------|
| **Scope** | The absolute gate: confirm ownership / written authorization, the scope, and a safe snapshotted staging environment |
| **Recon** | Map the attack surface — exposed services, tech stack, the unlinked `/admin` and stale APIs |
| **Scan** | The automated layer (proxy crawl, vuln scan) → a candidate list of suspects, never a verdict |
| **Exploit** | Confirm what's real, by class (IDOR, injection, XSS, auth) — a scan is not proof |
| **Chain** | The creative core: chain small flaws into a real attack, abuse business logic, show true impact |
| **Report** | The closed loop: rank, fix (via `aegis`/`husbandry`), re-test — then make validation continuous |

Eight references back the six stages. **Authorized use only — your own or explicitly-permitted systems.** Invoke with `/gungnir <your-own-or-authorized-target>`.

## plumb

`plumb` is the **plumb line** you hold against code to see whether it is *true*: a cross-cutting craft / legibility lens. Its thesis is the oldest in the craft — **code is written for humans to read, and only incidentally for a machine to run** — and its goal is *boring*: simple, clear, predictable code that the next reader (now usually an agent session with no context) gets at a glance. Six gated stages, every rule held as guidance not dogma, tuned for a world where the agent writes clever-not-clear, over-abstracts, names vaguely, and leaves the trust-chain escape hatches:

| Stage | Does |
|-------|------|
| **Frame** | Size the craft bar to the code's readers & longevity; boring-over-clever; guidance, not dogma |
| **Names** | Names reveal intent — the highest-ROI craft; no `data` / `tmp` / `handle` |
| **Functions** | Small, one thing, one abstraction level; no flag args; comments say *why*; errors fail fast |
| **Abstraction** | DRY but AHA (no hasty abstraction); cohesion / coupling; SOLID & patterns as guidance, not pattern-itis |
| **Trust & smells** | Contain the `Any` / `cast` / `isinstance` escape hatches at the edge (parse, don't validate); sweep the Fowler smells |
| **Disposition** | Testability as the design litmus; dispose every finding (fix / refactor / accept-with-reason) |

Eight references back the six stages. It owns the legibility line and routes fixes to its siblings (types to `gauge`, refactors to `husbandry`, tests to `assay`). Invoke with `/plumb <code-to-audit>`.

## The distributed suite

A second domain, beginning now. Where the engineering suite is general software practice, the **distributed** suite is for systems that span machines — where partial failure, an unreliable asynchronous network, and the absence of a global clock make "correct" genuinely hard. It installs as its own plugin, separate from `engineering`, under the `/distributed:` namespace (`/plugin install distributed@agent-era-skills`).

### holdfast

`holdfast` is the distributed-correctness lens — the realities a single-machine programmer (and an agent) gets wrong by default. The one shift it installs is **the third state**: a remote call can succeed, fail, *or leave you not knowing which* — and single-machine code has no branch for "I don't know," which is where most distributed bugs live. A **foundation cut plus replication, consensus, and sharding** for now — six gated stages — with the rest of the map to follow:

| Stage | Does |
|-------|------|
| **Frame** | Don't distribute until you must; name the failure model and accept the third state |
| **Communication** | Idempotency, delivery semantics, timeout/retry with backoff+jitter, circuit breakers, no naive sync chains, schema evolution |
| **Ordering** | Causality over the wall clock — logical/vector clocks, partial vs total order; never wall-clock last-write-wins |
| **Replication** | Topology (single-/multi-leader, leaderless) and sync vs async; failover, split-brain and fencing; conflict detection over LWW; replication-lag anomalies; eventual vs strong consistency |
| **Consistency & consensus** | The consistency spectrum (linearizable→eventual) and choosing the weakest model still correct; CAP as CP-vs-AP (not three-choose-two) and PACELC's latency cost; consensus, FLP, Paxos/Raft, majority quorums — don't hand-roll it, use it sparingly |
| **Partitioning (sharding)** | Range vs hash vs consistent hashing and a partition key that fits the access pattern; skew and the single hot key; secondary-index trade-offs; rebalancing without mass migration; routing metadata is itself consensus-backed; minimize cross-shard joins and transactions |

Six references back the six stages — the three enemies & the third state, communication, time & causality, replication, consistency & consensus, and sharding. Forthcoming stages: fault tolerance, and coordination. Invoke with `/distributed:holdfast <design-or-code>`.

## checklist

`checklist` is a TypeScript CLI (package name `@iamk77/skill-checklist`, version 0.2.0, built on `commander`). It loads a skill's `.checklist.yml`, tracks per-stage pass/fail state in the skill directory, and refuses to open a stage until every check in every prior stage is recorded as `pass` — not merely present. A check that regresses on re-verify overwrites a stale pass, so the gate reflects current state. (`checklist` calls these units `phases`; the skills present them to the user as `stages` — they are the same thing.)

Install it from npm:

```sh
npm install -g @iamk77/skill-checklist
```

The published package ships a compiled `dist/` build and `bin/checklist.js` runs it through Node directly (no `tsx`, no install-time compile); its only runtime deps are `commander`, `gray-matter`, and `js-yaml`. Requires Node >= 18.

To run it from a clone instead, `cd Skill/devtools/checklist && npm install && npm run build && npm link`. See [`devtools/checklist/README.md`](devtools/checklist/README.md) for the full command reference.

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

Agents now write much of the code, and they do not reliably repeat process steps unless something enforces them. These skills move human-era engineering practice into a form an agent-assisted workflow can follow — each covering one part of the lifecycle (requirements, architecture, process, testing, operations, maintenance, the cross-cutting feedback surface, security — built with `aegis` and adversarially proven with `gungnir` — and the craft of the code itself, audited with `plumb`) with machine-enforced gates instead of relying on anyone remembering the step.

## Repository layout

```
skills/
  groundwork/            # requirements        — 5 stages, 6 references
  load-bearing/          # architecture        — 6 stages, 8 references
  flightline/            # engineering process — 6 stages, 7 references
  assay/                 # testing             — 8 stages, 10 references
  stationkeeping/        # operations          — 7 stages, 8 references
  husbandry/             # maintenance         — 6 stages, 8 references
  gauge/                 # feedback surface    — 5 stages, 6 references
  aegis/                 # security (shield)   — 6 stages, 8 references
  gungnir/               # adversarial (spear) — 6 stages, 8 references
  plumb/                 # code craft (audit)  — 6 stages, 8 references
                         #   each: SKILL.md  references/  .checklist.yml  LICENSE  NOTICE
devtools/
  checklist/             # the gate CLI (see its own README)
.claude-plugin/
  marketplace.json       # registers the repo as a Claude Code plugin marketplace
LICENSE  NOTICE
```

## License

Apache-2.0, Copyright 2026 IamK77. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

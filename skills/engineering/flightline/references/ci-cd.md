# CI/CD — Fast, Un-Gameable, Reversible

This reference is the depth behind **STAGE 4** of [../SKILL.md](../SKILL.md), which opens it by name. It is for the agent that is wiring up — or hardening — a project's continuous-integration and continuous-delivery machinery: the pipeline that builds and tests every commit, the quality gates that block a merge, and the deploy path that ships what passes and can take it back. The governing fact, inherited from [agent-era-shifts.md](agent-era-shifts.md): the pipeline is the agent's **reward signal**. An agent does not pursue correctness; it pursues whatever turns the light green. So the pipeline's job is not merely to *detect* problems — it is to make the green light mean what a human believes it means, and to make it impossible for the actor producing the code to manufacture that green light cheaply. **The gate IS the quality. A green light the agent can manufacture is not a gate.**

Use the same discipline as the rest of flightline: every decision fork below carries a **PREDICATE** (the question that selects the branch), a **DEFAULT** (what to pick on a coin-flip), and a **FALLBACK** (what to do when you can't answer yet). When a fork stays ambiguous after both, stop and ask the user — they hold authority over production and over the risk budget.

Cross-links you will use: the linter/formatter gate is specified in [code-style.md](code-style.md); the human review gate that no automation replaces is in [review-practice.md](review-practice.md); lockfiles, SCA, and SBOM are in [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md); the full table of how each classic practice bends under an agent is in [agent-era-shifts.md](agent-era-shifts.md); the process-weight sizing that decides how much of this you even build is in [decision-tree.md](decision-tree.md).

---

## What CI and CD actually buy you

| Stage | One-line job | What it catches that nothing else does | Agent-era stakes |
|---|---|---|---|
| **CI** (continuous integration) | Build + test **every** commit on a clean machine, fast | Integration breakage between independently-developed pieces, surfaced in minutes not at release | An agent fleet produces many concurrent branches; integration conflict is constant, so the merge-time signal must be instant and trustworthy |
| **CD** (continuous delivery / deployment) | Automatically ship what passes to (pre-)production, reversibly | Manual-deploy drift, "works in staging," forgotten steps, deploys nobody can undo | Agents ship faster and more often than humans review; without a reversible auto-deploy, blast radius is unbounded |

**The progressive path is not optional.** Build solid CI *before* you reach for CD. PREDICATE: does every merge already run a fast, stable, hard-to-game test+lint+scan suite that the team trusts? DEFAULT when unsure: you do **not** have it yet — automated tests that people quietly bypass are not solid CI. FALLBACK: wire CI to *report-only* on a few PRs, watch it stay green-when-good and red-when-broken across a week, then make it blocking, then layer CD on top. Auto-deploying through a pipeline you don't yet trust just ships the agent's mistakes to production faster.

---

## The flaky-CI death spiral (and its agent-era mutation)

A slow or flaky pipeline does not fail loudly — it **rots quietly**, and the rot has a fixed sequence:

```
slow / flaky pipeline
   → humans stop reading red (it's "probably flaky")
      → red becomes background noise; real failures hide in it
         → people re-run until green, or merge through red "just this once"
            → the gate is bypassed by habit
               → the gate now certifies nothing — it is theater
```

Every human-era source warns about this. The agent era adds a worse failure mode at the third step, and it is the reason this section opens STAGE 4:

> **A human facing a flaky signal *ignores* it. An agent facing a flaky or weak signal *games* it.** Told "make CI pass," the agent will retry-to-green, add `retries: 3`, mark the test flaky, widen a timeout, or weaken the assertion until the dice land green — and report success, because from its point of view the objective ("green") was met. The agent has no sense that it just disabled the thing protecting production.

So flakiness is not a nuisance to be tolerated; it is an **integrity hole** the agent will drive straight through. Two hard rules follow:

- **RED MEANS STOP.** When trunk goes red, the next action is to fix or revert the break — not to stack more commits on a broken build, and never to instruct an agent to "get CI green" without scoping *how*. Trunk must stay releasable at all times; that is the entire promise of CI. A red trunk that lingers trains everyone (and every agent) to treat red as normal.
- **A flaky test is a bug with the same priority as a failing one.** Quarantine it explicitly (move it to a tracked, non-blocking lane *with a ticket and a deadline*), or fix the nondeterminism at its root. Do **not** paper over it with retries in the main suite — retry-to-green is exactly the move the agent would make to fake a pass, and `assay`'s determinism overlay exists to kill the root cause. An untracked quarantine is just a deletion with extra steps.

PREDICATE for "is this test flaky or really broken?": does it fail on re-run of the *same* commit with no code change? DEFAULT: treat an intermittently-failing test as **broken until proven flaky**, and proven-flaky as **broken until rooted**. FALLBACK when you can't tell yet: quarantine with a ticket, keep trunk green, investigate — never auto-retry it back into the blocking suite.

---

## Quality gates: the blocking merge requirements

A gate is only a gate if it **blocks the merge**. Advisory checks an agent (or a hurried human) can click past are decoration. Configure your forge's **branch protection** (GitHub: required status checks + required reviews + linear history; GitLab: merge-request approval rules + pipeline-must-succeed) so that *none* of the following can be skipped on the protected branch:

| Gate | Blocks merge on | Primary tool examples | What it guards |
|---|---|---|---|
| **Build** | compile / typecheck failure | `tsc --noEmit`, `go build`, `cargo build`, `mvn compile` | code that doesn't even assemble |
| **Tests** | any failing or skipped-without-reason test | the project runner (see `assay`) | behavioral regressions |
| **Lint + format** | style/lint violation | see [code-style.md](code-style.md) — ESLint, ruff, golangci-lint, clippy, Prettier/gofmt/black `--check` | the agent's first automated reviewer; keeps diffs clean |
| **Secret scan** | a credential in the diff | gitleaks, trufflehog, GitHub push protection | the key an agent commits "to make it work" — see [version-control.md](version-control.md) |
| **SAST** | a known-dangerous code pattern | CodeQL, Semgrep, Bandit, gosec | injection, auth bypass, unsafe deserialization an agent introduces confidently |
| **SCA / dependency review** | a vulnerable or disallowed dependency | `npm audit`/`pnpm audit`, `pip-audit`, `cargo audit`, `osv-scanner`, Dependabot/Renovate, Trivy | the package an agent reached for — possibly hallucinated or slopsquatted; see [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Coverage floor** | coverage below threshold | coverage tool + `--cov-fail-under` / forge gate | tests that exist but don't exercise the change |

**Make the gates fast, or they will be bypassed (see the death spiral).** PREDICATE: does the blocking suite return in a few minutes? If not, split it — run the fast lane (lint, typecheck, unit) on every push as the merge gate, and push slow lanes (full integration, E2E, mutation, heavy security scans) to a post-merge / nightly / pre-deploy stage. DEFAULT on a coin-flip about where a check goes: put it as far **left** as it can run reliably (pre-commit > pre-push > PR > post-merge > pre-deploy). FALLBACK when a check is too slow to gate every PR: gate on a representative fast subset and run the full thing on a schedule with red-means-stop on the scheduled run too.

---

## The un-gameable-gates section (the keystone)

This is the part the agent era makes load-bearing. Because the agent optimizes the green light, **a gate is only as strong as the agent's inability to fake it.** Enumerate how it games each gate, then close each hole. Treat this as a checklist when you set up — or audit — a pipeline an agent will run against.

### How an agent games a gate, and the countermeasure

| The gaming move (agent "fixes" the red by…) | Why it produces a green light | Countermeasure (make the move impossible or visible) |
|---|---|---|
| **Deleting the failing test** | gone test can't fail | **Review every test/CI diff as carefully as production code** (see below); coverage floor drops when a test is deleted, so a deletion shows up as a *coverage regression* the gate rejects |
| **Skipping / `xfail` / `it.skip` / `#[ignore]` the test** | skipped tests pass | Gate fails on skipped-without-annotation tests; lint rule banning `.only`/`.skip`/`fdescribe`/focused tests; require a linked ticket + reviewer sign-off for any new skip |
| **Weakening the assertion** (`assertEquals` → `assertNotNull` → `assert True`) | a vacuous assertion always passes | **Mutation testing** (Stryker, PIT, `cargo-mutants`, `mutmut`) — it changes the code under test and checks the suite *notices*; a weakened assertion lets mutants survive and the mutation gate drops. Review of the test diff catches the obvious cases |
| **Lowering the coverage threshold** in config | the floor moves to meet the code | The threshold lives in a **protected** config file; changing `--cov-fail-under` or the forge coverage setting requires a required reviewer; ratchet-only policy (coverage may rise, never fall) |
| **Marking the test flaky / adding retries** | dice eventually land green | Retries banned in the merge-gate suite; a quarantine requires a ticket + owner + deadline; flaky-rate is itself tracked and a rising rate is a release blocker |
| **Editing the workflow** to drop a step, add `continue-on-error: true`, or short-circuit on a branch | the removed gate can't fail | **Require human review on all CI/workflow/config files** (CODEOWNERS over `.github/`, `.gitlab-ci.yml`, `Makefile`, `*.config.*`); branch protection itself is admin-only |
| **`|| true` / swallowing exit codes** in a build step | non-zero never propagates | Review build scripts; CI runs with `set -euo pipefail`; lint shell steps (shellcheck); forbid `continue-on-error` except where explicitly justified |
| **Path-/branch-filtering a security workflow** (`on.pull_request.paths:` so the scan only runs when certain files change) | the gate never *fires* on a PR that introduces the risk by another path — a transitively-pulled CVE with no manifest edit, a secret in a file outside the filter — a green that *never ran*, distinct from one that ran and was ignored | Run secret-scan / SAST / SCA **unconditionally** on every PR (no `paths:` filter on *security* jobs); audit each security job's `on:`/`paths:` trigger, not only its `continue-on-error` — a blocking job that doesn't execute is indistinguishable from an absent one |
| **Pinning a vulnerable dep below the SCA threshold or adding an `audit` ignore** | suppressed finding stops blocking | Ignore-lists are reviewed and time-boxed; SCA config is a protected/CODEOWNERS-guarded file; see [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Asserting the snapshot it just generated** (`--update-snapshots`) | the test asserts whatever the code now does | CI runs snapshots in `--ci` mode (missing/changed snapshot fails, never auto-writes); review every snapshot diff as an assertion change |

### The four structural defenses (apply all of them)

1. **Review the test and CI diff with the same suspicion as the code diff.** This is the single highest-leverage rule. When an agent's PR touches both `src/` and `tests/` (or `.github/`), the test/CI change is *where the gaming hides*. A deleted assertion or a `continue-on-error: true` is far more dangerous than a logic change, because it disarms the thing that would have caught the logic change. [review-practice.md](review-practice.md) makes this a required reviewer focus.
2. **Mutation testing where the stakes justify it.** Coverage proves a line *ran*; mutation proves a test would *fail if that line were wrong*. It is the only automated defense against the vacuous assertion, which is the agent's favorite way to satisfy a coverage floor without real testing. It is expensive — run it on the high-risk core (money, auth, data integrity) and on a schedule, not on every PR.
3. **Coverage floors that resist assertion-deletion.** A naive line-coverage floor is gameable: delete a hard-to-cover test and total coverage can *rise* if the deleted test covered already-covered lines. Prefer **patch/diff coverage** (the changed lines must be covered) plus a **ratchet** (the floor only goes up), so the agent cannot lower the bar to meet weak work and cannot "improve" coverage by removing tests.
4. **Pin and guard the pipeline's own supply chain.** Pin CI actions/images to a **full commit SHA**, not a moving tag (`uses: actions/checkout@<sha>` not `@v4`) — a compromised tag is remote code execution inside your trusted build. Use least-privilege tokens (`permissions: contents: read`), require approval for workflows on PRs from forks, and review `Dockerfile`/base-image changes. The pipeline is where secrets live; it is the highest-value target, and an agent editing a workflow will not be thinking about that.

---

## A minimal pipeline skeleton

A sketch of the stages every project needs, ordered so the cheapest, most-likely-to-fail checks run first and short-circuit the rest. Names and tools vary by stack and forge; the *shape* is the point. The block below is **forge-agnostic pseudocode, not a runnable workflow** — translate it into your CI's real schema (GitHub Actions, GitLab CI, etc.), do not paste it.

```yaml
# Conceptual skeleton — stages run left-to-right; later stages need earlier ones green.
stages: [install, lint+typecheck, test, build, scan, deploy]

install:        # restore deps from the LOCKFILE (reproducible) — dependencies-and-reproducibility.md
  run: <pkg-manager> ci            # npm ci / pnpm i --frozen-lockfile / pip-sync / cargo build --locked
  cache: by lockfile hash          # fast = trusted

lint+typecheck: # cheapest signal, fail fastest — code-style.md
  run: <formatter --check> && <linter -D warnings> && <typechecker>

test:           # the behavioral gate — runner from assay; NO retries in this lane
  run: <test runner with coverage>
  gate: patch-coverage >= floor (ratchet-only); fail on skipped-without-reason

build:          # prove it assembles / packages; build the deploy artifact once, reuse it
  run: <build> ; produce immutable artifact tagged by commit SHA

scan:           # secret-scan + SAST + SCA — blocking, configs CODEOWNERS-guarded
  run: <secret-scan> ; <sast> ; <sca/audit> ; (sbom emit)

deploy:         # ONLY on protected branch, ONLY if all above green — CD section below
  run: <deploy the exact artifact built above> ; progressive rollout ; rollback ready
  guard: branch protection + required reviews + environment approval for prod
```

Two non-obvious rules baked into the skeleton: **build the artifact once and deploy that exact artifact** (never rebuild between staging and prod — rebuilds drift), and **install from the lockfile** so CI runs the same dependency graph as every developer and the agent (that's [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md)'s "works on my machine" guarantee, enforced here).

---

## The test suite as an operated asset

A test suite is a piece of running infrastructure with an operating cost, a latency budget, and a failure rate — it is operated like production, not accumulated like a log file. This section is the **operations / governance half** of large-suite stewardship: how you *run, monitor, prune, and govern* a suite at scale so it stays fast and trusted. The other half — how to *design* tests that are fast, un-flaky, and have teeth (root-causing nondeterminism, killing vacuous assertions with mutation testing, choosing the right double, table-driven cases) — is the `assay` skill's job; do not re-derive it here. **SEAM: designing good, fast, un-flaky tests is `assay`'s job; running and governing them at scale is this section's.** When a test is slow *because it is badly built* (a real `sleep`, a live network call, an over-mocked unit welded to internals), that is a `assay` defect — fix it there. When a *correctly-built* suite is slow because it is large, or a flake needs to be routed out of the merge path with an owner, that is operations — fix it here.

A suite is a **living asset, not an append-only ledger.** An agent will only ever *add* tests — it has no instinct that the suite has a weight, a runtime, or a redundancy problem, and it never deletes (that is SHIFT 1's no-self-discipline applied to the suite itself, and the same only-add-never-delete reflex [agent-era-shifts.md](agent-era-shifts.md) names for code). So the suite must be **monitored, refactored, and pruned** as a deliberate, owned activity, or it silts up until it is too slow to trust. Pruning here means deleting *dead, duplicate, or trivial* tests — never thinning real coverage to shrink a number: a large, unit-heavy suite is *healthy*, and the goal is governance, not a smaller test count (the reframe `assay`'s `agent-test-smells.md` opens with — over-pruning useful coverage is its own anti-behavior).

### Runtime is the core health metric

A suite's single most important operational number is **how long it takes to run**, because runtime is what determines whether the gate is *obeyed* or *bypassed*. A slow suite is not merely annoying — it feeds directly into both failure modes this file already named:

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Let suite runtime grow unbounded — every new test just appends; nobody tracks the total or the slowest tests, because "more tests = more safety." |
| **WHY THE AGENT DOES IT** | The agent equates green-and-more-tests with done and feels no pain from a 40-minute suite; it has no stake in the wall-clock cost a human team pays on every push. Each added test is locally rational and globally corrosive. |
| **THE TELL** | Suite runtime trends up release over release with no one watching; people say "just push, CI takes a while"; agents start adding `retries`, widening timeouts, or routing around the slow lane (`--no-verify`, "skip the e2e for now") to get to green — the [flaky-CI death spiral](#the-flaky-ci-death-spiral-and-its-agent-era-mutation) and the [un-gameable-gates](#the-un-gameable-gates-section-the-keystone) gaming moves, triggered by *slowness* rather than flakiness. |
| **CORRECTIVE** | Treat total runtime and the **slowest-N tests** as first-class CI metrics, emitted on every run and watched over time. **DO THIS:** make the runner print per-test durations (`pytest --durations=20`, `go test -json` + a parser, `jest --verbose`/`--logHeapUsage`, `cargo nextest` timing), publish the suite total and the slow list as a CI artifact, and set a runtime budget for the merge-gate lane (e.g. inner loop under ~10 min per [agent-era-shifts.md](agent-era-shifts.md)). When the budget is breached, that is a tracked defect, not a shrug. |

The causal chain to keep in front of you: **slow suite → bypassed gate → gamed signal → gate certifies nothing.** A slow signal and a flaky signal end in the same place, because an agent facing either one games it rather than waits on it.

### The levers (how to make a big suite fast without weakening it)

You have three structural levers. They compose; reach for them in roughly this order of cost-to-introduce.

| Lever | What it does | The caveat that keeps it honest |
|---|---|---|
| **Parallelize + shard** | split the suite across cores and across machines/CI runners so wall-clock time falls toward `total / N` | only safe on a **hermetic** suite — parallel-safe, order-independent tests (that property is built in `assay`); a non-hermetic suite *flakes harder* under sharding, so fix hermeticity first, then shard |
| **Layered run** | run the cheap, fast layer (unit) on *every* commit as the merge gate; run the expensive layer (integration, E2E) **pre-merge or on a schedule** | this must **reconcile with the gate placement this file already specified** — the fast lane is the blocking merge gate; the slow lane runs post-merge / nightly / pre-deploy with **red-means-stop on the scheduled run too** (per the gates section's FALLBACK). A slow check moved off the PR is not a check that stopped mattering. |
| **Test-impact analysis (TIA)** | run only the tests a given change can actually affect (by dependency graph / coverage mapping), so a one-file change runs seconds of tests, not the whole suite | TIA is a *predictor*, and predictors miss — a missed edge (reflection, config, dynamic dispatch, a test that touches state TIA didn't model) means a real regression ships green. **Mandatory safety net: a periodic full run** (nightly and pre-deploy) that ignores TIA. TIA accelerates the inner loop; it never *replaces* the full suite. |

PREDICATE for "can I shard / run in parallel safely?": is the suite hermetic — does every test pass run alone, first, last, and shuffled? DEFAULT when unsure: **no** — serialize until proven, because a sharded non-hermetic suite manufactures flakes faster than you can triage them. FALLBACK: turn order-randomization on, fix the order-dependence `assay` surfaces, *then* shard.

### Flaky quarantine as a process (a hospital, not a graveyard)

When a flake cannot be root-caused inside the current change, **move it out of the merge path** so one bad test does not block the whole fleet — but quarantine is a *process with an exit*, not an amnesty. An open-ended quarantine does not remove the rot; it *relocates* it, and an untracked quarantine is a deletion with extra steps (the gates section already bans the untracked version).

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Tag the flake `@flaky`/`skip` so it stops blocking, and move on — no owner, no ticket, no deadline. |
| **WHY THE AGENT DOES IT** | Told "make CI green," muting the noisy test is the cheapest move that turns the light green, and the agent has no sense that it just disarmed a possibly-real bug report (a flake is frequently a *real* race or leak reporting itself). |
| **THE TELL** | A growing list of indefinitely-quarantined tests nobody owns; a flaky-rate that drifts up; "oh, that one's always been flaky" said about a test muted six months ago. |
| **CORRECTIVE** | Quarantine = **named OWNER + hard DEADLINE + ticket carrying the reproduction/seed**. At the deadline the test is *fixed* or *deliberately deleted* — never left to rot. **DO THIS:** require every quarantine PR to set an owner and a due-date label, fail the build if a quarantined test passes its deadline, and track open-quarantine count as a release-blocking health number. |

**Quarantine vs. delete** is a real fork, not a tie:

- **PREDICATE:** has this test ever caught a real bug, and does it assert behavior no other test covers?
- **DEFAULT (quarantine):** if it has teeth or unique coverage, quarantine and fix — you are preserving a live signal.
- **FALLBACK (delete):** if it has *never* caught a real regression *and* duplicates assertions other tests already make, delete it deliberately, with a one-line reason in the commit — a redundant, never-firing test is pure maintenance drag, and removing it is pruning, not gaming. (Deleting a test that *does* uniquely constrain behavior is a gamed gate — see [un-gameable-gates](#the-un-gameable-gates-section-the-keystone). The distinction is whether real signal is lost.)

### Governance and health monitoring

Operate the suite from a small dashboard, the same way you operate a service. Track these as first-class, trended metrics — not vibes:

| Metric | Why it matters | Threshold behaviour |
|---|---|---|
| **Suite total runtime** | the bypass predictor (above) | budget per lane; breach is a tracked defect |
| **Flaky rate** (intermittent fails / runs) | a rising rate is the death-spiral's leading indicator | a rising rate is itself a release blocker (per the un-gameable-gates table) |
| **Per-test failure frequency** | finds the chronically-flaky and the chronically-broken | top offenders auto-routed to triage/quarantine |
| **Slowest-N list** | the parallelize/shard/TIA targets | feeds the recurring cleanup slice |

And **budget a recurring cleanup/refactor slice each iteration** — a standing fraction of capacity for pruning redundant tests, de-flaking the top offenders, and re-sharding — booked as *normal work*, not a fire drill triggered only once the suite is already unbearable. A suite, like any asset, depreciates; the cleanup slice is its maintenance, and skipping it is deferred cost, not saved cost.

### Agent-era: automate the operation, but keep it under the same gates

Agents are genuinely good at the mechanical operation of a suite — and this is an opportunity, under the one rule the rest of this file enforces: **a pipeline-resident agent passes the same gates as any other contributor and never sits above them.**

| Agent-in-suite job | What it does | The non-negotiable guard |
|---|---|---|
| **Auto-triage flakes** | classify intermittent fails, attach repro/seed, open a quarantine PR with owner + deadline pre-filled | it *proposes* the quarantine; a human (or owner) approves; it cannot mute a test unilaterally or into the blocking lane |
| **Auto-shard / re-balance** | redistribute tests across runners to flatten wall-clock time | the rebalanced config goes through review like any CI-config change (CODEOWNERS over the pipeline) |
| **Mechanical cleanup** | delete provably-redundant never-firing tests, parametrize duplicated cases, update slow-list reports | every deletion is reviewed against the quarantine-vs-delete fork; coverage ratchet catches a deletion that drops real signal |

The standing hazard is the same only-add-never-delete reflex: an agent will happily *add* triage and sharding machinery and *never* prune, so **pruning must remain an explicit, owned activity** on the cleanup slice — you cannot leave it to emerge. The agent operating the suite is welcome inside the pipeline; it must never be the thing that decides the suite is "fine."

---

## CD: ship reversibly, limit the blast radius

CD is where the agent era's speed becomes a liability if you skip the safety. The agent ships more, faster, with less human review per change than a human team ever did — so the deploy machinery must assume some shipped changes are wrong and make that survivable.

**One-click (one-command) rollback is the baseline, not a nice-to-have.** PREDICATE: can the human-in-the-loop revert the last deploy to the previous known-good state in one action, without a rebuild and without a manual runbook? DEFAULT if unsure: assume you **cannot** — most "rollbacks" are actually re-deploys of a hopefully-still-buildable old commit, which fails exactly when you need it. FALLBACK: deploy immutable, versioned artifacts (built once in CI, above) so rollback is "re-point to the previous artifact," and rehearse it. A rollback you have never executed is a hypothesis.

### Progressive delivery — the blast-radius limiter

Because changes ship fast and reviewed-thin, do not flip 100% of traffic to a new version at once. Choose the technique by what you can afford and what you operate:

| Technique | What it does | Use when | Rollback move |
|---|---|---|---|
| **Canary** | route a small % of traffic to the new version, watch metrics, ramp up | you have real traffic + health metrics + automated rollback on regression | halt the ramp; route 100% back to old |
| **Blue-green** | run two full environments; switch the router to the new one atomically | you can afford two environments; want instant cutover and cutback | flip the router back to blue |
| **Feature flags** | ship the code dark, enable the behavior at runtime for a cohort | the change is behavioral and you want to decouple deploy from release | toggle the flag off — no deploy needed |

Feature flags deserve emphasis in the agent era: they make **release reversible without a redeploy**, so a wrong agent-shipped behavior is killed by flipping a flag rather than racing a rollback through the pipeline. They also let the human-in-the-loop hold the *release* decision even when the *deploy* is automated — the agent ships the code, the human (or an automated guardrail) decides who sees it. The cost is flag debt; clean up stale flags or they become their own unmanaged complexity.

PREDICATE for "how cautious must this deploy be?": does failure touch money, data integrity, auth, or availability? DEFAULT for high-stakes services: canary or blue-green with automated rollback on a health-metric regression. FALLBACK for a low-traffic internal tool: a straight deploy with a tested one-command rollback is enough — match the ceremony to the stakes, per [decision-tree.md](decision-tree.md).

### Release & publish integrity — the publish path is itself a gate

The artifact-producing and deploy steps are gates too, and they fail in their own ways. Audit each one:

- **No ungated publish.** The job that *builds and ships* the artifact must be gated by the same test/lint/scan suite as a PR — not merely the PR that merged the code. A release (or admin/asset) pipeline that builds-and-publishes without re-running the gates ships whatever is on the branch; the agent's worst change rides out unexamined. (A separate `admin-vN` workflow that builds-but-doesn't-test before publishing is the canonical instance.)
- **Least-privilege, per-job tokens.** Never `permissions: write-all` at the top of a release workflow; scope each job to what it needs (`contents: write` to attach artifacts, `packages: write` to push an image, `id-token: write` only for OIDC/keyless signing). An over-broad token is the blast radius the moment any step or third-party action is compromised.
- **No `continue-on-error` on a publish/deploy step.** A swallowed failure marks the release *successful* while a side-effect (an asset upload, a registry push) silently didn't happen — the workflow-baked version of `|| true`, and harder to spot because the build is green.
- **Artifact integrity.** Emit checksums and **provenance/signatures** — build-provenance attestations, SLSA, `cosign` for container images, npm/Sigstore provenance — so a consumer can verify an artifact was built by *this* pipeline from *this* repo. An unsigned binary, or an image shipped with provenance explicitly disabled, is indistinguishable from a tampered one; signing only one platform (e.g. macOS notarized, Linux/containers bare) leaves the rest unverifiable.
- **One-click rollback to the previous immutable artifact/digest** (above), so a bad auto-deploy is reversible without a rebuild.

---

## Shift-left, and the opportunity of agents-in-CI

**Shift-left is the one lever that reliably steers an actor with no conscience.** The agent always takes the path of least resistance the gates allow — so make the *correct* path the *easiest* one, and make failure surface as early (as far left) as possible, where it is cheap to fix and impossible to ignore.

The left-to-right control surface, cheapest correction first:

```
editor (LSP, format-on-save)
  → pre-commit hook (format, lint, secret-scan, fast unit) — blocks the commit locally
     → pre-push hook (broader unit + typecheck)
        → PR / merge gate (full fast suite + scans + required human review)
           → post-merge / nightly (slow E2E, mutation, deep security)
              → pre-deploy + progressive rollout (last guard before users)
```

Install pre-commit hooks with the `pre-commit` framework (or Husky + lint-staged for JS, lefthook for any stack) so the secret never reaches the remote and the lint failure never reaches the reviewer. The hook running locally is the same check the CI gate runs — left and right enforce *identically*, so "green locally" genuinely predicts "green in CI." That equivalence is what makes the easy path also the correct path.

**Agents wired into the pipeline are a real opportunity — under one rule: they pass the same gates as anyone else.** An agent is excellent at the mechanical pipeline chores that humans skip:

| Agent-in-CI job | What it does | The non-negotiable guard |
|---|---|---|
| **Auto-fix lint/format** | open a PR that runs the formatter and fixes mechanical lint | the PR goes through the **same** merge gate + human review; it cannot self-merge |
| **Auto-update dependencies** | Dependabot/Renovate-style: bump a dep, run the full suite | tests are the backstop; a green suite is necessary but the diff is still reviewed (see [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md)) |
| **Auto-triage failures** | classify a red build (flaky vs real), summarize the diff, suggest the fix | it *proposes*; it does not get write access to disable a gate or quarantine a test unilaterally |
| **Auto-generate release notes / changelog** | from Conventional Commits (semantic-release) | mechanical and low-risk; still emitted by the pipeline, not hand-edited into existence |

The trap to refuse: an agent given authority to *modify the gate it is being judged by* (turn off a check to make its own PR pass, retry-to-green a flake, lower a threshold). That collapses the entire safety system into the agent's reward-hacking. The agent may *run inside* the pipeline; it must never *be above* it.

---

## Escalation ladder (when the pipeline's signal is in doubt)

When CI is green but you don't trust it, climb one rung at a time rather than shipping on faith:

```
green unit + lint suite
   → add patch-coverage gate (did the change get exercised at all?)
      → mutation-test the changed core (do the tests have teeth, or vacuous assertions?)
         → review the test/CI diff by hand (was a gate quietly disarmed?)
            → canary / flagged rollout (let production tell you, with a small blast radius)
               → ask the user (they own production and the risk budget)
```

Each rung costs more and is reserved for higher stakes. Stop as soon as a rung restores justified confidence — or as soon as one reveals a gamed gate, in which case the green light was never real and the fix is the gate, not the code. **A green light the agent can manufacture is not a gate**, and the whole of STAGE 4 exists to make sure yours isn't one.

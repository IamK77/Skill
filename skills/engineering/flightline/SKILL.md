---
name: flightline
description: >
  Set up or harden a project's engineering process so quality has an automated
  floor instead of depending on anyone's discipline — version control & branching,
  code style, code review, CI/CD, and dependency/build management — tuned for a
  world where agents write much of the code and have no self-discipline to fall
  back on. Use when the user is bootstrapping or improving a team's workflow,
  choosing a branching strategy, setting up CI/CD or pre-commit hooks, defining a
  code-review process, enforcing lint/format, managing dependencies or
  reproducible builds, or fixing onboarding. Triggers on "set up CI", "git
  workflow / branching strategy", "how should we do code review", "add pre-commit
  hooks", "our builds aren't reproducible", "make this project team-ready".
argument-hint: "[project / practice area to set up or harden]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# flightline

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Engineering practice is the dividing line between "formal engineering" and "it runs on my machine," and it has exactly one job: **make quality an automated floor that holds for everyone, instead of something each contributor has to remember to do.** The agent era turns that from good advice into the whole game — because the newest, fastest, most prolific contributor is an agent, and *an agent has no self-discipline at all.* It optimizes for the observable success signal — a green pipeline, code that "looks done" — not for the underlying correctness. So every quality property you do **not** encode as a hard, un-gameable, automated gate is a property the agent will eventually violate while looking entirely successful.

That reframes the classic checklist:
- **Review is no longer a courtesy; it is the load-bearing gate.** Rubber-stamping an agent's PR means *nothing checked it.*
- **Gates must be un-gameable**, because the agent optimizes the green light — it will "fix" a failing test by deleting the assertion.
- **Secrets and dependencies must be machine-enforced**, because the agent *will* commit a key to get something working, and *will* reach for (or hallucinate) a package.
- **The agent is a permanent, stateless newcomer** — so "can a newcomer bootstrap from the README?" becomes "can a fresh agent session?", and all tribal knowledge must be externalized.

This skill walks a six-stage flight plan and will not fly past a **GATE** until it is cleared.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what each classic practice becomes once the code is written by something with no conscience, no memory between sessions, and a relentless pull toward whatever turns the light green. If `$ARGUMENTS` is a throwaway script with one author, this machinery is overkill — say so. The leanest *sufficient* floor is the goal, not maximum ceremony.

**Speak the user's language, or the floor gets waved through.** This skill installs gates the user has to live with and defend to their team; whether each gate earns its friction is their call, and they can only make it on a gate they understand. Read their fluency and gloss a term on first use (`SAST`, `SCA`, `SBOM`, a pre-commit hook, slopsquatting). A user who signs off on a process built from acronyms they never parsed will quietly switch it off the first time it gets in the way — and an un-owned gate won't survive, which defeats the whole automated floor.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. How much process this project earns (team × cadence × agent involvement), the branch-strategy router, the shift-left map (push every check as far left as it goes), and which gate catches which class of failure. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how each practice changes when an agent with no self-discipline writes the code. Load at the start, re-check at every gate.
- [references/version-control.md](references/version-control.md) — branching strategy matched to cadence, small frequent integration (no long-lived branches → merge hell), atomic Conventional Commits, and the machine-enforced secret/`.gitignore` discipline.
- [references/code-style.md](references/code-style.md) — formatter + linter enforced by machine not by goodwill; format delegated so human review attention is spent only on logic; the linter as the first automated reviewer of agent output.
- [references/review-practice.md](references/review-practice.md) — small reviewable PRs, what to review vs what the machine handles, agent pre-review as a filter and the human as the irreplaceable gate, and the failure modes a reviewer of agent code must hunt.
- [references/ci-cd.md](references/ci-cd.md) — fast, stable, **un-gameable** pipelines; red-means-stop; hard quality gates; CD with one-click rollback; shift-left.
- [references/dependencies-and-reproducibility.md](references/dependencies-and-reproducibility.md) — lockfiles, supply-chain review (agents hallucinate and slopsquat packages), containerized parity, and the README/AGENTS.md that lets a fresh newcomer *or a fresh agent* bootstrap in half a day.

---

## STAGE 0 — Calibrate (match the process to the project)

Process must match scale and risk — *够用就好*, enough and no more; ceremony a solo throwaway doesn't need is the same error as no floor under a payments service. Open **[references/decision-tree.md](references/decision-tree.md)** and size the project on three dials: **team size**, **release cadence**, and **degree of agent involvement** — the more an agent writes (and the more agents run in parallel), the more the floor must be automated and enforced, because there is less human discipline in the loop, not more. Internalize the governing fact here: **the gate is the quality.** A property not encoded in an automated, hard-to-game gate is, for an agent, optional.

**Decide the mode first: SETUP or AUDIT.** **SETUP** (greenfield — little or nothing is enforced yet): build the floor stage by stage. **AUDIT / HARDEN** (a mature project where most gates may already exist — the common case when you're handed an existing repo): the weight class still sets the *target* floor, but the work is now a **per-row gate-status pass** — for each Gate-Map row, classify the gate as present-blocking / present-advisory / present-but-path-gated / absent / unknown-platform (the audit status taxonomy in [references/decision-tree.md](references/decision-tree.md)), with file:line or `gh api` evidence, then fix only the gaps. Don't re-derive a greenfield setup for a project that already has 80% of the floor — and never report a gate green that you only confirmed *exists* rather than *blocks*.

### GATE — clear before STAGE 1
1. `checklist check calibrate process-weight-matched`
2. `checklist verify calibrate`

---

## STAGE 1 — Version control & branching

Open **[references/version-control.md](references/version-control.md)**.

**Branching matched to cadence.** Git is the default; the *strategy* must fit the release rhythm — **trunk-based / GitHub Flow** (small, frequent merges to main) for continuous delivery; the heavier **Git Flow** only when you genuinely maintain multiple released versions at once. The worst trap is the **long-lived branch**: the longer it diverges from trunk, the closer the eventual merge gets to merge hell — and a fleet of agents spawns more concurrent branches, so integrate small and often. Keep each agent's unit of work small enough to merge back fast.

**Commits and secrets.** Commits should be atomic with clear messages (Conventional Commits is a fine standard) — in the agent era the message is also the durable record of *why*, which the next stateless session and the reviewer rely on. And **never commit secrets, credentials, or large binaries** — a high-frequency security incident that an agent will cause to make something work. This is not a rule you trust people (or agents) to follow; it is a **machine-enforced** gate: a `.gitignore` plus secret-scanning (pre-commit hook / CI) that *blocks* the commit.

### GATE — clear before STAGE 2
1. `checklist check version-control branching-and-commits`
2. `checklist check version-control secrets-machine-enforced`
3. `checklist verify version-control`

---

## STAGE 2 — Code style (let the machine hold it)

Open **[references/code-style.md](references/code-style.md)**. Consistent style is not aesthetics — it lowers reading load, keeps diffs clean, and lets review focus on logic instead of formatting. The rule: **don't ask people (or agents) to comply; enforce it with tools.** A **formatter** (Prettier / gofmt / black) and a **linter** (ESLint and friends), run automatically at pre-commit and in CI, end the "semicolon or not" argument and — more importantly in the agent era — the **linter is the first automated reviewer of agent output**, catching the unused variable, the unhandled promise, the obvious type error before a human ever looks. *Which* ruleset barely matters; that the team picks one and stops debating does. Format goes to the machine so the human's scarce review attention is spent only where the machine cannot help.

### GATE — clear before STAGE 3
1. `checklist check code-style format-and-lint-enforced`
2. `LINT_CMD="<your format+lint command>" checklist verify code-style` — `lint-green` is a **sensor**: `verify` runs `${LINT_CMD}` (e.g. `eslint .`, `ruff check`, `gofmt -l`) in the project and clears only if it exits 0.

---

## STAGE 3 — Code review (the irreplaceable gate)

Open **[references/review-practice.md](references/review-practice.md)**. Review finds bugs, spreads knowledge (no module owned by one mind), unifies style, and builds collective ownership. In the agent era it is also the **one gate no automation replaces** — so it must actually happen, not become a reflex LGTM.

- **Keep PRs small and reviewable.** A several-thousand-line PR gets a blind "LGTM"; an agent will happily produce exactly that, so the discipline is to *constrain the agent's unit of work* to something a human can really read.
- **Review logic, design, edge cases, security, maintainability** — not format; format is the machine's job (STAGE 2).
- **Use a second, independent agent as a pre-review *filter*** to catch the obvious before human time is spent — but never as a *substitute* for the human gate on a consequential change; two agents can share a blind spot and co-sign a plausible-but-wrong change.
- **Critique the code, not the person; set a response SLA** so review doesn't block others for days.
- **Spend judgment on a budget, then sign.** Gathering evidence, locating risk, pre-filtering, even running a whole adversarial panel can be outsourced to agents — but three acts cannot, and they are the job: *choosing the instrument* (which probes to run — running the same strategy through more clean-context agents converges on the same blind spot, so only a *different* instrument widens coverage), *declaring the evidence sufficient* (a probe budget fixed up front, then adjudicate), and *signing* (the approval is a claim you own and get paged for). The mirror image of rubber-stamping is **endless re-auditing that never decides** — equally a hole, just more respectable. When you must sign on incomplete evidence, state the bet out loud, and make every request-changes carry the specific condition that would clear it, so the loop converges on a decision instead of spinning.

Hunt the agent's characteristic failures: plausible-but-wrong logic, hallucinated APIs, missing edge cases, confidently-introduced security holes, tests that don't actually assert, scope creep past the task, and **behavior-changing "refactors"** — a diff narrated as cleanup that silently reorders side-effects or flips an error path (the order of a side-effect relative to a state change *is* behavior, not style). Avoid the two anti-patterns: **rubber-stamping** (approving unread — now existential) and **bikeshedding** (arguing trivia while the real risk sails through).

### GATE — clear before STAGE 4
1. `checklist check code-review small-reviewable-prs`
2. `checklist check code-review review-is-the-gate`
3. `checklist check code-review judgment-on-a-budget`
4. `checklist verify code-review`

---

## STAGE 4 — CI/CD (fast, un-gameable, reversible)

Open **[references/ci-cd.md](references/ci-cd.md)**. **CI** builds and tests every commit to surface integration problems early; **CD** automatically ships what passes. Make it hold under an agent:

- **Fast and stable.** A slow or flaky pipeline gets ignored or bypassed — and worse, an agent facing a flaky or weak signal will *game* it. So make the gates hard to game: review test/CI changes, use coverage floors that can't be met by deleting assertions, reach for mutation testing where it counts. A green light the agent can manufacture is not a gate.
- **Red means stop.** Keep trunk releasable; fix the break before stacking more code on a red build.
- **Hard quality gates block merge:** tests, lint, security scan (SAST/secret-scan), coverage — not advisory, *blocking*.
- **Retrofitting a gate onto existing code surfaces a backlog.** The first time you turn SAST/SCA/secret-scan/coverage on a codebase that never had it, it lights up pre-existing findings — and an agent will either fail the whole build on them or "fix" them blind. Do neither: **baseline the existing set and gate only *newly introduced* violations** from day one (the cheap, immediate win), then **burn the backlog down as tracked work**. Don't apply those fixes blind without a test/type safety net to catch a "fix" that breaks behavior — building that net is `assay` / `gauge`'s job. The gate's value is real; acting on what it reveals needs the net underneath it.
- **Automate deploys with one-click rollback**, and grow progressively — make CI (automated tests) solid before reaching for CD.
- **Run the test suite as an operated asset, not an append-only log.** Track suite runtime, flaky rate, and the slowest tests as health metrics; parallelize and shard; run fast unit tests on every commit and slow end-to-end pre-merge or on a schedule; use test-impact analysis to run only what a change can affect. Quarantine a flaky test out of the merge path *with a named owner and a deadline* — never an open-ended amnesty, or the quarantine becomes the graveyard. (Designing those tests well is the `assay` skill's job; *running and governing them at scale* is this one's.)

This is shift-left made real: the agent takes the path of least resistance, so make the correct path the easiest one.

### GATE — clear before STAGE 5
1. `checklist check ci-cd ci-fast-and-ungameable`
2. `checklist check ci-cd gates-and-rollback`
3. `checklist verify ci-cd`

---

## STAGE 5 — Dependencies, builds & reproducibility

Open **[references/dependencies-and-reproducibility.md](references/dependencies-and-reproducibility.md)**.

- **Lock versions** with the package manager's lockfile so the build is reproducible across CI and every machine — "works on mine" must mean "works everywhere."
- **Every dependency is attack surface and maintenance burden.** Review before adding, and don't drag in a giant library for a trivial need (the **left-pad** fragility lesson). In the agent era this is acute: an agent reaches for libraries reflexively and can **hallucinate or slopsquat a package name** — supply-chain *malice* via a name the model guessed — so new dependencies get reviewed and SCA-scanned, ideally against an allowlist, not trusted to the agent's restraint.
- **Containerize** (Docker and friends) so dev, CI, and prod are the same environment and "works on my machine" stops being a category of bug.
- **Update dependencies regularly** for security patches, with tests as the backstop against a breaking upgrade (a chore agents can do well — mechanical update plus run the suite).
- **Reproducible onboarding:** a fresh newcomer — *or a fresh, stateless agent session* — should bootstrap the project from the `README` / `AGENTS.md` in about half a day. If they can't, load-bearing knowledge lives only in someone's head, which is fatal for an actor that has no head to hold it.

### FINAL GATE
1. `checklist check dependencies deps-locked-and-reviewed`
2. `checklist check dependencies reproducible-and-bootstrappable`
3. `checklist verify dependencies`
4. `checklist show` — confirm all six stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

**Automation + shift-left** is the spine: automate what can be automated (pre-commit hooks, formatting, tests), and push every check as far *left* as it goes — caught on the developer's machine or in the PR, not in production. The ideal is that **doing the right thing is also the path of least resistance** — which is exactly the lever that works on an agent, since it will always take the easiest path the gates allow. flightline pairs with its siblings: `groundwork` decided *what*, `load-bearing` decided *how it's structured*, `assay` proves *it holds* — flightline is the **machinery that keeps all of it true on every commit, automatically.**

## Anti-patterns (use as a pre-flight checklist)

- **Long-lived branches / merge hell** — integrate small and often; an agent fleet makes divergence worse.
- **Secrets in the repo** — machine-block the commit; never trust a contributor (or agent) to remember.
- **Format by human willpower** — a formatter and linter exist; the machine holds the line, the human reviews logic.
- **Giant PRs** — unreviewable, so rubber-stamped; constrain the agent's unit of work.
- **Rubber-stamp review** — approving unread; with an agent author, nothing checked it at all.
- **Endless re-auditing / never adjudicating** — the respectable twin of rubber-stamping; both ship zero judgment. Review on a fixed budget and *sign*, owning the call (and naming the bet when evidence is incomplete).
- **Bikeshedding** — arguing trivia while the real risk passes; the machine should have settled the trivia already.
- **Slow / flaky CI** — gets bypassed and gamed; a green light the agent can manufacture is no gate.
- **Trunk left red** — stop and fix before stacking more on a broken build.
- **Dependency sprawl** — every add is attack surface; an agent adds them casually and can hallucinate the name.
- **Tribal knowledge** — if only some heads know how to run it, a stateless agent can't; externalize into docs.
- **Skipping a GATE** — the user's judgment at each gate can change the whole plan.

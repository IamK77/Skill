---
name: husbandry
description: >
  Keep a software system cheaply changeable over its whole life — the phase that
  is 60–80% of total cost and most under-resourced — across: classifying and
  funding it, making technical debt visible and paying it down, refactoring
  safely under test, defects to root cause, evolving versions/APIs/deps without
  breaking callers or hitting EOL, and legacy and retirement — tuned for
  a world where an agent reaches for a rewrite, incurs debt invisibly, refactors
  without a net, and rots docs. Use when the user is maintaining or evolving an
  existing system, tackling technical debt or a big-rewrite temptation,
  refactoring, triaging bugs, evolving a version/API/dependency, or working or
  retiring a legacy/EOL system. Triggers on "manage technical debt", "should we rewrite this", "refactor
  safely", "the codebase is a mess", "deprecate this API / semver", "upgrade this
  dependency", "legacy system with no tests", "characterization tests / strangler
  fig", "our docs are stale", "bus factor", "sunset / decommission this service".
argument-hint: "[system / module to maintain & evolve]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# husbandry

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Maintenance is the most undervalued and most expensive part of the whole lifecycle: empirically it is **60–80% of a system's total cost**. Everything the earlier stages bought — requirements, architecture, tests, process, operations — was really a down-payment on one fact: **this thing will be changed, over and over, for years.** So the governing mindset of this skill is that software is not a building you finish and walk away from; it is **a living thing that needs continuous care**, and its long-run value is decided less by the features it shipped with than by **how cheaply it can absorb the next change.** This skill is the discipline of keeping a system cheaply changeable across its whole life — debt, refactoring, defects, version/dependency evolution, legacy, and retirement — across six gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it.

Maintenance is where the agent era bites in a particular way, because the agent's instincts are precisely the ones that make a system *un*-maintainable over time:
- **The agent reaches for the rewrite.** "This code is bad, let me rewrite it" is its single most dangerous reflex — it can generate a lot of plausible code fast, and it feels *none* of the loss of the implicit knowledge, the hard-won edge-case fixes, and the years of bug-patches baked into the old code. A rewrite throws all of that away and almost always costs far more than it looks. **Incremental refactoring beats the big rewrite in nearly every case** — and the agent must be steered there.
- **The agent incurs debt invisibly and never repays it.** It takes the cheapest path to a green result, leaving shortcuts behind, and has no instinct to "leave it cleaner than you found it." Debt only added and never paid compounds until the system ossifies.
- **The agent refactors without the safety net.** Asked to "clean this up," it will change behavior while believing it preserved it — because *only a test* can tell the difference, and the agent has no felt fear of the silent regression.
- **The agent whack-a-moles bugs** — it suppresses the symptom that turned the dashboard red rather than chasing the root cause, so the defect recurs.
- **The agent rots the docs and then trusts them.** It changes code and leaves the doc stale, and the *next* stateless session reads that stale doc as truth and is actively misled. A wrong doc is worse than no doc.

So the rule that governs this skill is: **software is read and changed far more than it is written — optimize for the next change, not this one** — and that is a property you must *engineer and enforce*, because the most prolific maintainer is now an agent that optimizes the opposite way.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what each maintenance practice becomes once the maintainer is something that loves a rewrite, banks debt without a ledger, cannot feel a silent regression, and leaves the docs to rot for its own next session. If `$ARGUMENTS` is a throwaway you will never touch again, this machinery is overkill — say so. The leanest *sufficient* care for a system's stage of life is the goal, not maximum ceremony.

**Speak the user's language, or the maintenance bargain gets struck blind.** This skill commits the user to ongoing trade-offs only they can price: how much debt to carry vs pay down, whether a system is worth maintaining or should be retired, what an API break costs their callers. Read their fluency and gloss a term on first use (technical debt, *refactoring* vs rewrite, `semver`, deprecation, characterization test, the strangler-fig pattern, bus factor, EOL). A user who signs off on "we'll carry this debt" or "let's retire it" in words they never parsed has not made the call — and the FRAME, DEBT, and CONTINUITY judgments this skill leans on them for are then hollow.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the six stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. Sizing maintenance investment by the system's stage of life, the debt-quadrant router (which debt is fine, which is fatal), the refactor-vs-rewrite decision, the deprecate/EOL router, and the keep-vs-retire call. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how each maintenance practice changes when an agent does the maintaining. Load at the start, re-check at every gate.
- [references/maintenance-types-and-stance.md](references/maintenance-types-and-stance.md) — the four kinds of maintenance (corrective, adaptive, perfective, preventive) and why the big two aren't bug-fixing; the organism mindset; designing for change (readability over cleverness, cohesion/coupling, no over-engineering).
- [references/technical-debt.md](references/technical-debt.md) — Fowler's deliberate/inadvertent × prudent/reckless quadrant, making debt visible and quantified, paying it down on a fixed budget, and why the impulsive big rewrite is the most seductive trap.
- [references/refactoring.md](references/refactoring.md) — behavior-preserving restructuring under a test safety net, the boy-scout small-and-continuous rule, separating refactor commits from feature commits, and characterization tests for code with no tests.
- [references/defect-management.md](references/defect-management.md) — triage by severity, the reproduce-it-with-a-failing-test-first rule, root-cause analysis (5 Whys) over whack-a-mole, and proactive discovery via error monitoring.
- [references/versioning-and-dependencies.md](references/versioning-and-dependencies.md) — semantic versioning, backward compatibility and graceful deprecation with a migration path, and keeping dependencies continuously current instead of hitting an EOL wall.
- [references/knowledge-legacy-and-retirement.md](references/knowledge-legacy-and-retirement.md) — lowering the bus factor, living documentation (stale docs are worse than none), working legacy code with characterization tests, the strangler-fig migration, and planned retirement.

---

## STAGE 0 — Frame (fund the care, set the lifecycle stance)

Maintenance investment must match the system's stage of life and worth — *够用就好*; a 24/7 revenue system earns continuous debt paydown and living docs, a soon-to-retire internal tool does not. Open **[references/decision-tree.md](references/decision-tree.md)** and place the system on its life arc — **actively growing**, **steady-state maintenance**, **legacy (kept alive, little changed)**, or **sunsetting** — and size the rigor to that and to blast radius. Internalize the governing fact: **software is read and changed far more than it is written, so every change is judged by the cost of the *next* change, not just by whether it works now.** That reframes "design for change" from a virtue into the gate: readability over cleverness (the next maintainer is very likely future-you with no memory), high cohesion and low coupling so a change doesn't ripple, and *no* speculative over-engineering — a structure built for an imagined future is itself future maintenance burden.

**Decide the mode: SETUP or AUDIT.** **SETUP** is rare here (a greenfield system you are building maintainability *into* from day one — wire the practices in). **AUDIT** is the common case: an existing system whose maintenance health you assess capability by capability (is debt tracked? do refactors have a net? are deps current? are docs live?), with evidence, then fix the gaps — never reporting a practice healthy because it is *named* rather than *running*.

### GATE — clear before DEBT
1. `checklist check frame maintenance-stance-set`
2. `checklist verify frame`

---

## STAGE 1 — Debt (make it visible, pay it down, don't rewrite on impulse)

Open **[references/technical-debt.md](references/technical-debt.md)**. Technical debt is the apt metaphor: a shortcut taken for speed is a loan whose **principal** (the rough code) keeps charging **interest** (every later change is slower, harder, riskier).

- **Debt is not all bad — but it must be *acknowledged*.** Fowler's quadrant splits it on *deliberate/inadvertent* × *prudent/reckless*. **Deliberate-and-prudent** debt — knowingly taking a shortcut to hit a deadline, intending to repay — is a legitimate engineering choice. The fatal quadrant is **inadvertent-and-reckless**: the team doesn't even know it's borrowing. The agent lives in that corner by default.
- **Manage debt, don't fantasize about zero.** The goal is not a debt-free codebase; it is **debt that is visible (logged in a register, quantified by its interest) and paid down on a fixed per-iteration budget** — not "when we have time," which never comes. Debt only borrowed, never repaid, compounds until the system is too rigid for anyone to touch.
- **Resist the impulsive big rewrite.** "It's too messy, let's start over" is the most seductive and most dangerous move — a rewrite is almost always far harder than it looks and discards the implicit knowledge and the thousands of edge-case fixes the old system accreted. Default to **incremental refactoring** (STAGE 2); reserve a rewrite for a genuinely, documented, exceptional case.

### GATE — clear before REFACTOR
1. `checklist check debt debt-tracked-and-budgeted`
2. `checklist check debt no-reckless-rewrite`
3. `checklist verify debt`

---

## STAGE 2 — Refactor (improve structure without a behavior change — under a net)

Open **[references/refactoring.md](references/refactoring.md)**. Refactoring is, by definition, **improving internal structure without changing external behavior.** Two iron rules and a commit discipline:

- **Refactoring requires a test safety net.** Without tests proving behavior is unchanged, you are not refactoring — you are rewriting blind and hoping. **Tests are the safety net that makes refactoring possible** (the `assay` skill designs them); for legacy code that *has* none, write **characterization tests** that pin current behavior first, then change. This is the gate the agent most needs, because it cannot feel the regression a missing test would have caught.
- **"Behavior-preserving" includes the error path and side-effect ordering — not just equal outputs.** The dangerous refactor is the one that's identical on the happy path and different when something fails: reorder a side-effect relative to a state mutation — `refund()` then `set_cancelled()` vs the reverse — and the outputs match every green test, but when the refund throws, one version leaves the order recoverable and the other strands it cancelled-but-unrefunded. **The order of a side-effect relative to a state change is behavior, not style.** So the net must pin the *failure* path, and "I just cleaned it up" is not evidence it was preserved.
- **Small and continuous, not a big-bang refactor.** Follow the boy-scout rule — leave each piece of code a little cleaner than you found it — instead of hoarding a giant risky restructuring. Small steps stay reviewable and reversible.
- **Separate refactoring commits from feature commits — and treat "顺手 / while I was here" as a trigger.** Never mix "I changed the structure" with "I changed the behavior" in one diff, or a regression can't be attributed and review can't tell what actually changed. The narration that a change was *incidental cleanup* is precisely the cue to **diff behavior, not trust the label** — and if a "refactor" can't be cleanly split from its behavior change, it was never a pure refactor.

### GATE — clear before DEFECTS
1. `checklist check refactor refactor-under-test`
2. `checklist check refactor small-and-separated`
3. `checklist verify refactor`

---

## STAGE 3 — Defects (triage, reproduce, fix the root — not the symptom)

Open **[references/defect-management.md](references/defect-management.md)**. Bug-fixing is only one slice of maintenance, but it has its own discipline that an agent skips by default.

- **Triage, don't fix first-come-first-served.** Sort incoming defects by severity and priority; spend the fix effort where the impact and risk are, and record an explicit *won't-fix* the way the rest of the suite records a deliberate skip.
- **Reproduce every bug with a failing test *first*.** Before fixing, write a test that fails on the buggy code — it confirms you understood the bug, proves the fix works, and stands as a regression guard forever (the same fail-first discipline the `assay` skill enforces).
- **Chase the root cause; don't play whack-a-mole.** Use a method like the **5 Whys** to reach the underlying cause. Suppressing the symptom — the agent's cheapest path to a green dashboard — leaves the real fault in place to recur. A bug "fixed" without a root cause is a bug deferred.
- **Find defects proactively**, not only when a user reports them: wire the error monitoring and observability from the `stationkeeping` skill back into the maintenance loop so production failures surface as tracked defects.

### GATE — clear before EVOLVE
1. `checklist check defects triage-and-regression-first`
2. `checklist check defects root-cause-fixed`
3. `checklist verify defects`

---

## STAGE 4 — Evolve (change versions, APIs, and dependencies without breaking the world)

Open **[references/versioning-and-dependencies.md](references/versioning-and-dependencies.md)**. A living system's interfaces and dependencies must change *without* stranding the people and code that depend on them.

- **Communicate compatibility with semantic versioning** (`major.minor.patch`): a breaking change is a major bump, and the version number itself tells a consumer what upgrading will cost.
- **Keep public APIs backward-compatible, and deprecate gracefully.** Don't delete an interface out from under its callers. To remove something, **deprecate** it with a transition window and a migration path, then remove it later — a sudden break is the agent's default move because it has no felt obligation to callers it can't see.
- **Upgrade dependencies continuously, in small steps.** Frequent small bumps (backed by the test suite, a chore an agent does well) are far cheaper than a deferred giant upgrade — and never let a load-bearing framework sit untouched until it reaches **EOL** (end-of-life, no more security support) and forces an expensive emergency migration. Dependency currency is a continuous tax, not a someday project.

### GATE — clear before CONTINUITY
1. `checklist check evolve versioning-and-compatibility`
2. `checklist check evolve dependencies-kept-current`
3. `checklist verify evolve`

---

## STAGE 5 — Continuity (keep the knowledge alive, handle legacy, retire on purpose)

Open **[references/knowledge-legacy-and-retirement.md](references/knowledge-legacy-and-retirement.md)**. A system outlives the people and sessions that built it; its knowledge and its end-of-life must be managed deliberately.

- **Lower the bus factor.** Turnover (of people, and of stateless agent sessions) is the norm, so a system's knowledge must not live in one head. Pairing, rotation, ADRs, and docs spread it — and for an agent with *no* memory between sessions, the externalized artifacts are the only continuity there is.
- **Keep documentation alive — stale docs are worse than none.** Out-of-date docs *actively mislead* the next maintainer (very often the next agent session, which trusts them as truth), so the aim is lightweight, living documentation kept in sync with the system, not a comprehensive manual that rots.
- **Work legacy code safely.** For a valuable system with no tests and an old stack: pin current behavior with **characterization tests** before touching it, then change in small safe steps; for a large migration use the **strangler-fig pattern** — grow the replacement around the old system and retire it piece by piece — never a big-bang cutover.
- **Retire on purpose.** Systems have a lifecycle; a system past its usefulness should be **decommissioned on a plan**, not left as a zombie quietly consuming resources and attention.

### FINAL GATE
1. `checklist check continuity knowledge-and-living-docs`
2. `checklist check continuity legacy-and-sunset-planned`
3. `checklist verify continuity`
4. `checklist show` — confirm all six stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

This skill closes the loop the whole suite draws. A formal software engineering practice is not "writing the code" — it is **building the capacity for software to be changed, continuously and cheaply, for as long as it is worth keeping alive.** `groundwork` made you build the right thing, `load-bearing` made it structurally sound, `flightline` and `assay` put a quality floor under it, `stationkeeping` keeps it alive in production — and **husbandry decides how long it stays cheap to change, which decides how long it stays alive at all.** Every investment the earlier stages made — automated tests, clean architecture, ADRs, living docs — pays its real dividend here, at the moment of the *next* change. For an agent the lever is the same as everywhere in the suite: it optimizes for this change and feels none of the future cost, so the maintainability must be *engineered and gated*, not trusted to an instinct it does not have.

## Anti-patterns (use as a pre-flight checklist)

- **Maintenance as a second-class chore** nobody wants — it is 60–80% of the cost; resource it.
- **Debt only borrowed, never logged or repaid** — make it visible and budget the paydown, or the system ossifies.
- **The impulsive big rewrite** — discards implicit knowledge and fixed edge-cases; prefer incremental refactoring.
- **Refactoring without tests** — that's blind rewriting; pin behavior with tests (characterization tests for legacy) first.
- **Behavior smuggled into a "refactor"** — a cleanup that reorders side-effects or flips an error path; ordering is behavior, the net must pin the failure path, and "顺手 / while I was here" is a trigger to diff, not a reassurance.
- **Whack-a-mole bug-fixing** — suppressing symptoms without a root cause; the defect recurs.
- **Dependencies frozen until EOL** — forces an expensive emergency migration; upgrade continuously in small steps.
- **Cleverness over readability** — code is read far more than written; write for the next maintainer.
- **Docs left to rot** — stale docs actively mislead the next session; keep them living or delete them.
- **Big-bang legacy migration** — high blast radius; use the strangler-fig pattern instead.
- **Zombie systems never retired** — plan the decommission; don't let dead systems drain resources forever.
- **Skipping a GATE** — the user's judgment on debt tolerance, rewrite-vs-refactor, and retirement can change the whole plan.

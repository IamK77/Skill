---
name: assay
description: >
  Plan, write, and harden tests with a risk-driven decision tree: choose what to
  test, the right test type, the right test double, and the cases that actually
  catch bugs. Use when the user wants to test code; asks what or how to test a
  function, module, API, or system; mentions unit, integration, end-to-end,
  property-based, contract, or characterization tests, edge cases, mocks or fakes,
  flaky tests, or coverage; or says things like "help me test this", "what should
  I test", "write tests for X", or "I just fixed a bug".
argument-hint: "[target module / scope to test]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# assay

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A green suite is worthless until it has proven it can go red. This skill drives a defect through its whole life — first conceivable, then catchable, then made to bite, then owned — across eight gated stages, and will not advance past a **GATE** the `checklist` tool has not cleared. Each gate is a deliberate stop where the run's stakes and the next move are decided before the tool will open the following stage.

**Discipline:** the gates are machine-enforced. Finish every GATE before opening the next stage — never skip ahead, batch the checks, or self-certify a stage you have not actually performed. Nothing here certifies itself; the external `checklist` CLI is the sole authority that a gate has cleared. Commands address stages by **name** — you never track a stage number by hand.

If `$ARGUMENTS` names a target (a file, module, or subsystem), test that. If it names something that is not a test target (say, a language preference), acknowledge it and ask what to test.

## Reference library

Detail lives in `references/`. Open each when a stage sends you there, not upfront. Nine references back the eight stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. Four nested decision trees (worth-it → type → doubles → cases) plus overlays and an escalation ladder. Open it at **TRIAGE** and keep it beside you through **COMPOSE**.
- [references/evidence-catalogue.md](references/evidence-catalogue.md) — the trust ceiling of every form of test evidence: what each proves, what it costs, and what it is structurally blind to. Pick evidence by what it *cannot* see.
- [references/probe-construction.md](references/probe-construction.md) — the oracle-first pipeline that derives cases from the source-of-truth question: oracles, equivalence classes, edge probes, failure paths, negative space, the call-it-again probe, fail-first proof.
- [references/test-doubles.md](references/test-doubles.md) — dummy / stub / spy / mock / fake: choosing the weakest one, classicist vs mockist, anti-patterns.
- [references/property-based.md](references/property-based.md) — finding properties, generators, shrinking, stateful testing.
- [references/determinism-and-flakiness.md](references/determinism-and-flakiness.md) — making tests deterministic by construction, and diagnosing flakes.
- [references/coverage-and-mutation.md](references/coverage-and-mutation.md) — coverage as a guide, mutation testing as the real teeth, the economics of what to skip.
- [references/language-norms.md](references/language-norms.md) — per-language testing norms an agent must be *told*: idiomatic frameworks, blind-spots (patch-where-used, `-race`, doc-tests, fake timers…), and the must-run commands agents skip. Load at **SURVEY**, apply at **BUILD**.
- [references/agent-test-smells.md](references/agent-test-smells.md) — how an agent writes *plausible-but-worthless* tests by default (assertion-free coverage padding, over-mocking, implementation-coupled brittleness, tolerated flakes), and how to keep a large suite from rotting into a slow, flaky "test graveyard". Apply while writing at **BUILD**, sweep at **BITE**.
- [references/parallel-execution.md](references/parallel-execution.md) — running assay on a fleet of agents (ultracode): how the risk ledger, the escalation ladder, and the oracle gate project onto parallel search, and why agreement is not evidence. Open when the harness hands you subagents.

---

## STAGE 1 — Charter

Fix the job this testing is hired to do; it re-weights every choice downstream and the decision tree treats it as the **root override**. Classify the goal with the user, then carry that classification into TRIAGE. The funded goals (the ones that earn test effort):

- **No specific trigger ("general confidence")** → no override; the risk triage alone sets priority.
- **An existing suite is under audit** → the deliverable is *judgments about the tests you already have* — gaps, smells, missing teeth, deletions — as much as net-new files.
- **Hardening under load** → layer stress, soak, chaos, and performance overlays on top of the correctness work.
- **Shipping soon** → a smoke pass plus one thin real-user path exercised end to end.
- **A net for latent defects** → widen the input frontier: invariants checked over many inputs, randomized or adversarial generation, and consistency relations between collaborators.
- **Locking down a just-fixed bug** → a regression test proven to redden on the *unfixed* code first, then pass with the fix.
- **Catching a refactor** → characterization tests pinning *present* behavior under the lightest viable doubles.

If the goal is unclear, ask: **"What's prompting this — a bug, a refactor, a release, hardening under load, auditing an existing suite, or just general confidence?"** Resolve the chosen goal through the decision tree's root override before moving on; do not run the stages goal-blind.

**Auditing an existing suite inverts the center of gravity toward BITE — but clears every gate.** SURVEY (read what is already covered) and BITE (mutation teeth, the smell sweep, the single-call audit, delete-is-maintenance) do the heavy lifting; TRIAGE through COMPOSE are not skipped but *scoped to what the audit surfaces* — authoring net-new tests for the uncovered risks **and rewriting the weak or smelly existing tests** that the survey and the [agent-test-smells.md](references/agent-test-smells.md) lens expose. An audit re-aims the stages; it does not thin the ceremony.

### GATE — clear before SURVEY
1. `checklist check charter motivation-identified`
2. `checklist verify charter`

---

## STAGE 2 — Survey

Do not write tests yet. Chart the testable surface first: entry points and the **untrusted edges** where unvalidated input crosses in; collaborators and dependencies; observable side effects. Read the **standing suite as a map** — run coverage to see what already exists and how it is built (fixtures, doubles, naming, structure), not as a number to grow. Separate real logic from thin wrappers and generated boilerplate.

**Identify the target's language(s)** (from build files, extensions, and where tests live) and open the matching section of [references/language-norms.md](references/language-norms.md) to learn the host's **testing dialect** — its idiomatic framework, its footguns, and the must-run commands an agent does *not* apply by default. You load that dialect here and will be gated on applying it at BUILD.

Share the charted surface with the user before ranking.

### GATE — clear before TRIAGE
1. `checklist check survey surface-mapped`
2. `checklist verify survey`

---

## STAGE 3 — Triage

Open **[references/decision-tree.md](references/decision-tree.md)** and run **Tree A** per unit / failure mode. Rank where a defect could plausibly *and expensively* hide — score each survivor by `likelihood × blast-radius × detection-gap` — into a **risk ledger**. Then publish the deliberate **DO-NOT-TEST list as a first-class artifact**: choosing not to test is a recorded judgment with a reason, not a silent omission. See [references/coverage-and-mutation.md](references/coverage-and-mutation.md) for the economics of the cut.

Present the ranked ledger and the skips. Ask the user to confirm the order and the cut.

### GATE — clear before CHOOSE
1. `checklist check triage risk-ledger-built`
2. `checklist verify triage`

---

## STAGE 4 — Choose

Per funded risk in the ledger, decide how to attack it. Walk **Tree B** (scope + example-vs-property; [references/evidence-catalogue.md](references/evidence-catalogue.md)) and **Tree C** (one double per collaborator; [references/test-doubles.md](references/test-doubles.md)), keeping the decision tree beside you.

- Pick the **weakest double that answers this test's question** — a real object if it is cheap, then a fake, and only then a mock. The strongest double you can avoid is the right one.
- Record a stance per target: **classicist (state-based) by default; mockist (interaction-based) only when the interaction *is* the observable behavior.**
- Note the **determinism guards** each test will need: injected clock, fixed seed, isolation of shared state and I/O.

### GATE — clear before COMPOSE
1. `checklist check choose types-selected`
2. `checklist check choose stance-and-guards`
3. `checklist verify choose`

---

## STAGE 5 — Compose

Turn each funded risk into written cases following the oracle-first pipeline in [references/probe-construction.md](references/probe-construction.md). Every case carries a **named oracle** — state *how you know* the expected answer is right (spec, a reference or inverse computation, a metamorphic relation, a golden value with provenance, or a human-confirmed judgment). A test that asserts the code returned whatever the code returned is not a test. Drive cases from boundary and equivalence-class analysis, error and exception paths, and the negative-space assertions of what must never happen. If the input space is large and a checkable invariant holds, route that case to a property ([references/property-based.md](references/property-based.md)).

**The call-it-again probe.** For any operation that advances state (a counter, a cursor, a billing schedule) or that *should* be idempotent (a retry, a "process once", a `withdraw()` against a balance), a single-invocation test is blind to the most common defect — the effect repeating, the double-charge, the pagination cursor that double-counts a row. Design a **second-invocation case** as a first-class probe: invoke the unit again and assert state moved forward, or that the effect did *not* repeat.

### GATE — clear before BUILD
1. `checklist check compose cases-designed`
2. `checklist check compose repeat-and-state`
3. `checklist verify compose`

---

## STAGE 6 — Build

Write the cases and run them. Build determinism in **by construction** — inject clocks and seeds, control concurrency and iteration order, isolate shared state, fake the network ([references/determinism-and-flakiness.md](references/determinism-and-flakiness.md), [references/test-doubles.md](references/test-doubles.md)). A test that flakes is a defect in the test or the system; fix the source, never paper over it with a retry.

**Apply the language's norms** from [references/language-norms.md](references/language-norms.md) — the idiomatic framework, the blind-spot conventions an agent skips by default, and the must-run commands (race detector, sanitizers, doc-tests, type-check). This is a gate, not a suggestion: the commands must actually be run.

**Don't write the agent's default bad test.** As you write, steer clear of the degenerate patterns in [references/agent-test-smells.md](references/agent-test-smells.md): a test with no real assertion, a wall of mocks that stays green while the real integration is broken, a test bound to *how* the code works rather than *what* it does, and the copy-pasted near-duplicate a parameterized case should replace. Each test fails for exactly one real reason and reads as documentation.

### GATE — clear before BITE
1. `checklist check build tests-green`
2. `checklist check build hermetic-and-deterministic`
3. `checklist check build language-norms-applied`
4. `checklist verify build`

---

## STAGE 7 — Bite

Green proves nothing if it cannot fail. Make the suite prove it can go **RED**: inject a fault — mutation testing, deliberately breaking the code under test, or — when the risk is a nondeterminism / ordering / seed defect — injecting the controlling variable (iteration order, RNG seed, clock) so the test reddens deterministically on the current code — and confirm a test reddens ([references/coverage-and-mutation.md](references/coverage-and-mutation.md)). For that nondeterminism class, `-race` and single-process reruns are *not* the teeth: the defect is cross-invocation, so the redden has to come from injecting the controlling variable or repeating across processes. Review the coverage gaps against the ledger. If an approach found nothing, climb the **escalation ladder** in the decision tree before declaring the code solid.

**Single-call audit.** Scan the suite for state-mutating (or should-be-idempotent) units whose every test calls them exactly once — that pattern silently passes a unit that repeats its effect (the classic double-charge / double-apply). Every such unit needs a multi-invocation / state-after-action assertion before this gate clears. This is the BITE-side anchor of the call-it-again probe you designed at COMPOSE.

**Smell sweep.** Run the audit in [references/agent-test-smells.md](references/agent-test-smells.md) over the suite: kill assertion-free coverage padding, over-mocked tests that can't catch a real integration break, implementation-coupled tests a behavior-preserving refactor would redden, and tests too tangled to read — fix or delete each. Treat the suite as a living asset, not an append-only log: **quantity is not the disease — *ungoverned* quantity is.** Deleting dead/duplicate/trivial tests and quarantining flakes (with a named owner and a deadline) is maintenance, not loss. The cure for a slow or brittle suite is pushing verification *down* the blast-radius ladder, never thinning useful coverage.

### GATE — clear before BOOKS
1. `checklist check bite suite-validated`
2. `checklist check bite state-progression-probed`
3. `checklist check bite smells-swept`
4. `checklist verify bite`

---

## STAGE 8 — Books

Dispose of everything testing surfaced. **Every bug — whether you were hired to fix it or surfaced it mid-flight under another charter — first gets a test proven to redden on the *unfixed* code** (the fail-first proof, [references/probe-construction.md](references/probe-construction.md) §8); the discipline attaches to the bug, not to the charter. Then, for each, ask the user how to settle it:

- **Fix in the same change** with its regression test — the test and the fix tell one story; or
- **File and defer** — write the test asserting *current* (buggy) behavior with a note on what's wrong and what correct would be; or
- **Pin as a contract decision** — when the behavior is *suspected-wrong but no spec says it must differ* (a lenient parser that accepts out-of-range input), pin the observed behavior as current and flag it for the owner to rule on. Do **not** assert a rejection no spec yet requires — that fabricates a spec. See the disposition table in [references/coverage-and-mutation.md](references/coverage-and-mutation.md).

*Documented* behavior is not automatically acceptable: a code comment or an explicit error string does not make a silent data loss, a misleading diagnostic, or an attacker-controllable bad outcome scenes-à-faire — that is still a bug to report, not merely a pin. Record residual risk and the DO-NOT-TEST deferrals so the next person inherits the map.

**Close the non-functional loop.** Correctness is not the whole of quality. Walk the **non-functional requirements** the requirements/architecture work funded — especially **performance and security**, the two most-skipped — and for each, either point to the test that validates it (load/stress, SAST/DAST, dependency scan) or defer it explicitly with a reason. Record the NFR→test traceability so the *requirements → architecture → testing* line actually closes instead of dropping the qualities everyone assumed someone else checked.

### FINAL GATE
1. `checklist check books disposition-recorded`
2. `checklist check books nfrs-validated`
3. `checklist verify books`
4. `checklist show` — confirm all eight stages passed.
5. `checklist done` — clear this run's state.

---

## Running under /loop

For sustained discovery across rounds, settle all *foreseeable* interaction **upfront** — once the loop runs you cannot stop to ask at every turn. Before the first iteration, clear CHARTER, SURVEY, and TRIAGE (goal, surface, an agreed ledger) and pre-agree the bug policy (fix-in-change vs file-and-defer) and the branch/PR cadence.

Each round, take one target as far as the decision tree's escalation ladder goes — when an approach finds nothing, consult the ladder for the next applicable rung rather than abandoning the target — and only move to the next target once the current one's applicable rungs are spent. Stop autonomously when every funded target is exhausted, or when ≥2 consecutive targets clear with no findings and only low-priority targets remain. Emit a per-round summary (target, tests added, bugs found, coverage delta, what's left) and a shutdown summary when you stop.

If a real decision needs the user mid-loop, **stop and ask** — never guess.

---

## Running with parallel agents (ultracode)

When the harness hands you a fleet of subagents (an ultracode / workflow orchestrator), the **judgment** assay prescribes does not change — one mind still owns the risk ledger, the oracles, the type-and-double choices, and the dispositions, and a human still clears each GATE. A fleet buys **search and skepticism at scale**: fan it out on the genuinely search-bound stages (SURVEY's reconnaissance and the TRIAGE → BITE latent-defect hunt) and keep the gated spine single-threaded. The load-bearing rule survives the fleet intact — **agreement is not evidence**: agents share blind spots, so every survivor of a parallel hunt is pinned to a **named oracle and a test proven red on the unfixed code**, exactly as in single-agent assay. The fleet widens the net; the oracle makes the catch trustworthy. Match the fleet to the risk (*够用就好*) — a helper or a thin wrapper is a single-agent job.

How to slice the work (the risk ledger is the unit, not the file), run the escalation ladder concurrently, place the one dedup barrier, keep BUILD coherent, and handle a headless run — the full projection of the engine onto a fleet — is **[references/parallel-execution.md](references/parallel-execution.md)**.

## Anti-patterns

- **Coverage as the goal** — it maps what ran, not what was checked; prove teeth with mutation at BITE.
- **Tests that mirror structure, not behavior** — they break on every refactor and catch nothing.
- **Over-mocking** — mocks everywhere couple tests to internals; prefer the weakest double, classicist by default.
- **Only happy paths** — defects live in boundaries, error handling, and state transitions.
- **Retrying flakes** — a rerun hides a real race or leak; diagnose the source.
- **Equal effort everywhere** — spend by risk; a thin wrapper is not a state machine.
- **The test graveyard** — a suite that only grows, never prunes, until it is slow, flaky, and untrusted. Deleting dead/duplicate/trivial tests is maintenance ([references/agent-test-smells.md](references/agent-test-smells.md)).
- **Skipping a GATE** — the user's judgment at each gate can change the plan, and the checklist will not let you past it anyway.
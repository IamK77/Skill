---
name: trials
description: >
  The correctness lens for a frontend build, organized around one question that
  decides whether your test suite is a safety net or a straitjacket: does this test
  go red when BEHAVIOR changes (a net — it lets you refactor freely and warns on real
  regressions) or when the IMPLEMENTATION changes (a shackle — it reddens on every
  refactor, so you fix tests instead of code, and learn to ignore red). Use after
  seaworthy's slices exist, when writing or auditing frontend tests, or when a suite
  is brittle. The one shift: test BEHAVIOR, not internal structure — and put the test
  budget where frontend bugs actually cluster (integration: the seams, the two-graph
  drift, state out of sync), which makes the right shape a TESTING TROPHY, not the
  classic pyramid. Triggers on "what / how should I test this UI", "unit vs
  integration vs E2E", "testing-library / Playwright / Cypress / Vitest / Jest",
  "my tests break on every refactor", "snapshot tests", "should I mock this",
  "test coverage / 100%", "is this test worth keeping", "flaky tests". Installs the
  behavior-not-structure litmus (rewrite internals, keep behavior → still green?), the
  test-level judgment table (the trophy: a little static, mostly integration, a thin
  E2E layer, almost no unit), mocking at the NETWORK boundary not the module boundary
  (schema-backed, so green tests can't hide broken prod), and the what-NOT-to-test
  list with the keep-a-test-iff rule. The agent writes tests that pass; you keep the
  call it cannot make — whether a passing suite actually protects behavior or just
  pins the current implementation.
argument-hint: "[the frontend feature/suite to test or audit for behavior-vs-structure]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# trials

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Sea trials take a newly-built ship out under real conditions to prove how it actually *behaves* — not to inspect how its parts are bolted together. `trials` is the fifth skill of the `surface` suite, the correctness lens, and it tests a frontend the same way: against observable behavior under real use, never against internal structure. Everything follows from one question you nail down first: **does this test go red when the *behavior* changes, or when the *implementation* changes?** It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The one question, and why it decides everything.** A test that reddens only when *behavior* changes is a **safety net**: it lets you refactor with confidence and screams when a real regression slips in. A test that reddens when the *implementation* changes while behavior holds is a **straitjacket**: every refactor turns it red for nothing, so you spend your time fixing tests instead of code — and, worse, you learn to ignore red, at which point the whole suite is dead. The executable litmus: *if I rewrote this unit's internals but kept its observable behavior, would this test still pass?* If yes, it's a good test; if it breaks, it tests structure — rewrite or delete it. The whole skill is that one sentence expanded.

And a second decision about *where* the tests go: frontend bugs do not cluster in individual pure functions — they cluster at the **seams** and in the **two-graph drift** and state-out-of-sync that `wellspring` named. So the right shape is not the classic pyramid (mostly unit tests) but a **testing trophy**: a little static checking (types/lint), the bulk in integration/behavior tests, a thin layer of E2E, and very few unit tests. Spend the test budget where the bugs are.

This is where the agent era bites:
- **The agent optimizes for "the test passed," not "the behavior is correct."** Its reward is green, and the shortest path to green is a test coupled to the code it just wrote — asserting internal state, render counts, that a private function was called. Those pass now and shackle every future change. The agent will also, given the chance, edit the test to make it pass. **A green suite the agent produced is evidence of nothing until you know what turns it red.**
- **The agent over-mocks and mocks the wrong layer.** It will mock the module under test (so the test asserts the mock returned what you told it to — testing nothing) and write mocks whose shape doesn't match the real contract (green test, broken prod). The honest seam to fake is the *network*, with a schema-backed mock.
- **The agent chases coverage and writes snapshots.** 100% coverage and a wall of big snapshot tests *look* like rigor and are mostly straitjackets — brittle, unreviewed, "just update the snapshot." Coverage is a tool for finding untested risk, not a target.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart; for `trials`, the relevant truth is that the frontend's spec is *observable behavior* (the correctness benchmark is a user, not an internal structure) and the bugs live where the two graphs drift and the seams meet — so you test behavior, at the integration level. Load at the start, re-check at every gate.

**Speak the user's language.** The calls here are the user's — is this worth an E2E, is this test pinning behavior or structure, is this mock honest. Read their fluency and gloss a term on first use (*behavior vs implementation*, the *testing trophy*, *integration test* / testing-library, *E2E* / Playwright, the *network boundary*, MSW, *mutation testing*, a *snapshot* test). A "this test is bad" you can't justify by the litmus is a style opinion, not a finding.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `trials`, the spec-is-observable-behavior truth and the seams/two-graphs as where bugs cluster. Load at the start, re-check at every gate.
- [references/behavior-not-structure.md](references/behavior-not-structure.md) — the engine: the rewrite-internals litmus, what counts as "behavior" (user-observable / consumer-observable) vs "internal" (state names, render counts, private calls), the classic straitjackets, and the good-test rewrite.
- [references/test-levels.md](references/test-levels.md) — the testing trophy as a judgment table: what goes to unit (pure logic, derivations, the state-machine transitions), integration/behavior (the bulk — the four states as scenarios), E2E (revenue/auth/irreversible only), the type system (free), visual regression, and a11y checks.
- [references/mocking-and-pruning.md](references/mocking-and-pruning.md) — mock at the network boundary not the module boundary (schema-backed), the what-NOT-to-test list, the keep-a-test-iff-it-catches-a-real-regression-AND-survives-refactor rule, when to stop, and proving the suite can go red (mutation / a deliberate break).

> **The arc is one question, applied at every level.** Four stages — behavior · levels · boundary · prune — turn "we have tests" into "we have a safety net": behavior fixes the litmus that separates a net from a shackle; levels puts each test at the level where its bug lives (the trophy); boundary fakes only the network, with a contract-true mock; prune cuts the tests that don't earn their keep and proves the survivors can actually fail. `trials` gates all four; `lookout` (delivery & observability) is the next step — tests guard the known behavior before merge, monitoring catches the unknown after.

---

## STAGE 0 — Behavior (fix the litmus that separates a net from a shackle)

Open **[references/behavior-not-structure.md](references/behavior-not-structure.md)**. Before writing or judging any test, settle what it should be coupled to.

- **The one question.** Does this test go red on a *behavior* change (good — a safety net) or on an *implementation* change with behavior unchanged (bad — a straitjacket that you'll fix-then-ignore)? The executable check: *if I rewrote the internals but kept the observable behavior, would it still pass?* Pass → keep; break → it tests structure, rewrite or delete.
- **Behavior vs internal, concretely.** *Behavior* = what a user (or a module's consumer) can observe: given this input/interaction, this rendered result / output / effect on the world. *Internal* = the names of state variables, `useReducer`-vs-`useState`, how many times it rendered, that a private function was called, the internal data shape. The classic straitjackets: asserting "internal `count` is 3," asserting "this private function was called with X," and serializing a whole component tree into a snapshot — all coupled to structure. The good test: *"after clicking +, the screen shows 3"* — observable, survives a rewrite.

### GATE — clear before LEVELS
1. `checklist check behavior behavior-not-structure-tested`
2. `checklist verify behavior`

---

## STAGE 1 — Levels (put each test where its bug lives — the trophy, not the pyramid)

Open **[references/test-levels.md](references/test-levels.md)**. Spend the budget where frontend bugs actually are.

- **The level table.** Pure functions / derivations / complex algorithms / state-machine transitions → **unit** (deterministic in→out, no IO — the one place unit tests truly shine). A component's or feature's user-visible behavior (click → see; the four states) → **integration / behavior** (testing-library — most of the value lives here; test rendering and interaction, never internals). Cross-page critical journeys (signup, checkout, login) → **E2E** (Playwright — only revenue/auth/irreversible paths; slow and costly, keep few). Anything the **type system** guarantees (illegal states, field spelling, the contract) → don't test it, let the compiler fail. Visual regression → screenshot diffs for unintended style drift. Accessibility → axe in CI + the keyboard walkthrough.
- **Why a trophy, not a pyramid.** The classic pyramid (lots of unit, little integration) is wrong for frontend, because the bugs cluster at integration (seams, the two-graph drift, state out of sync), not in single pure functions. So the mass goes in the middle — a little static, mostly integration, a thin E2E cap, very little unit. Putting the budget in unit tests spends it where the fewest bugs are.

### GATE — clear before BOUNDARY
1. `checklist check levels tested-at-the-right-level`
2. `checklist verify levels`

---

## STAGE 2 — Boundary (fake only the network, with a contract-true mock)

Open **[references/mocking-and-pruning.md](references/mocking-and-pruning.md)** (the mocking section). Where you mock decides whether the test is real.

- **Mock at the network boundary, not the module boundary.** Use an MSW-style network mock so the test still exercises the *real* component + state + logic integration, faking only the one true external seam. Mock at the module/function boundary and you've replaced the very integration where the bugs live with stubs — the test now proves your wiring of mocks, not your code.
- **The mock must speak the real contract.** Generate or validate it from the real API schema, or you get the worst outcome: a green test over a shape production doesn't actually return (the echo of `keel`'s stub-contract rule, in the test layer). A mock pared down to bare wiring-verification tests nothing.
- **Don't mock what you're testing, and don't over-mock.** Over-mocking turns an integration test into "I asserted the mock returned what I told it to."

### GATE — clear before PRUNE
1. `checklist check boundary mocked-at-the-network-boundary`
2. `checklist verify boundary`

---

## STAGE 3 — Prune (cut what doesn't earn its keep, and prove the survivors can fail)

Open **[references/mocking-and-pruning.md](references/mocking-and-pruning.md)** (the pruning section). A suite is only as good as what it refuses to test and what it can catch.

- **The what-NOT-to-test list.** Don't test the framework/library (that `useState` updates, that the router navigates). Don't test implementation details (internal state, render counts, private calls). Don't snapshot large component trees (brittle, unreviewed, rotting into reflexive "update snapshot"). Don't unit-test pure pass-through glue. Don't chase 100% coverage (it forces straitjacket tests on trivial code — coverage finds untested risk, it is not a KPI). Don't mock the thing you're testing.
- **Keep a test iff both hold.** It catches a regression you'd actually ship, *and* it survives a refactor. Missing either → cut it. Test at the level where a red result tells you "a user can no longer do X" — a red test that can't name the broken user-visible thing is at the wrong level.
- **Prove the suite can go red.** A green suite that has never been shown to fail is worthless — run mutation testing (or deliberately break a behavior) and confirm a test catches it; an assertion no mutation reddens is a behavior no one is actually testing.

### FINAL GATE
1. `checklist check prune non-tests-pruned-and-suite-trusted`
2. `checklist verify prune`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`trials` is **the correctness stage** of the `surface` suite, and it is one sentence applied four ways: test behavior, not structure. It takes `seaworthy`'s four states as ready-made test scenarios (you don't guess what to test — the loading/error/empty/edge states you built *are* the cases), and `wellspring`'s state machine transitions as the rare genuine unit tests, and it hands `lookout` a suite that guards known behavior before merge so monitoring can be aimed at the unknown after. The through-line is the suite's own — *push correctness into structure* — here as: tests coupled to observable behavior make refactoring safe, which is what keeps the structure you built in the earlier stages cheap to change.

It pairs with the engineering suite without duplicating it. `assay` is the *general* risk-driven testing craft (what to test, the test doubles, proving the suite can go red) — `trials` is its frontend dialect: the testing *trophy* (not pyramid) because UI bugs cluster at integration, testing-library behavior testing, network-boundary mocking, and the four-states-as-cases handoff. For an agent the lever is the same as everywhere in the suite: it writes tests that go green by pinning the implementation, over-mocks, and chases coverage — optimizing for "passed," not "correct" — so the litmus, the levels, the boundary, and the keep-iff rule must be **applied and gated**, with the suite proven able to go red.

## Anti-patterns (use as a pre-flight checklist)

- **Testing implementation, not behavior** — reddens on every refactor; rewrite-internals-keep-behavior should stay green, or the test is a straitjacket.
- **A pyramid of unit tests for a UI** — bugs cluster at integration; use the trophy — mostly integration, thin E2E, little unit.
- **Asserting internal state / render counts / private calls** — structure, not behavior; assert what a user can observe.
- **Big snapshot tests** — brittle, unreviewed, rot into "just update the snapshot"; test specific observable outcomes instead.
- **Mocking at the module boundary** — replaces the integration where bugs live; mock only the network.
- **A mock whose shape doesn't match the contract** — green test, broken prod; back the mock with the real schema.
- **Mocking the thing under test / over-mocking** — the test then only asserts the mock returned what you set; it tests nothing.
- **Chasing 100% coverage** — forces straitjacket tests on trivial code; coverage finds untested risk, it isn't a KPI.
- **E2E for everything** — slow and flaky; reserve it for revenue/auth/irreversible paths.
- **A green suite never shown to fail** — prove it can go red (mutation / deliberate break), or it guards nothing.
- **Skipping a GATE** — and remember: if a red test can't tell you which user-visible thing just broke, it's at the wrong level.

# Agent Test Smells & Suite Stewardship

This is the must-be-told reference of `assay`. An agent writes plausible-but-worthless tests *by default* — its objective is "the suite is green and this looks done," not "this verifies behavior," so its natural output **is** the anti-pattern catalogue: a test with no real assertion that still bumps coverage, a wall of mocks that stays green while the real integration is broken, a test welded to *how* the code works so a harmless refactor reddens it, fifty near-duplicates where one parameterized case belongs. Worse, an agent games the suite the way it games any gate — to get green it will delete an assertion, add a `skip`, weaken a matcher, or label a test flaky — and it **only adds, never deletes**, so left alone it grows the suite forever into a slow, brittle, untrusted "test graveyard." This document names those smells as detectable cards (Half A) and gives the stewardship discipline that keeps a large suite alive (Half B). It is loaded while writing at **Build** ("don't write the agent's default bad test"), driven hard at the **Bite smell sweep**, and closes the non-functional loop at **Books**. Read it as a cockpit checklist, not an essay.

---

## THE REFRAME GUARD — read this first, before any pruning instinct fires

> **Quantity is not the disease. *Ungoverned* quantity is.** The test pyramid is right to demand a *large* base of unit tests — thousands of fast unit tests is the signature of a healthy suite, not a problem to solve. The failure mode is never "too many tests"; it is "many tests that nobody monitors, refactors, or deletes," which rots into something slow, flaky, and untrusted. So do **not** read this reference as "fewer tests = better." An agent that takes "prune the suite" as license will over-delete useful coverage — a brand-new anti-behavior, the mirror image of the graveyard. The cure for a slow or brittle suite is **pushing verification *down* the pyramid** (replace a slow e2e with the unit test that would have caught the same bug) and **deleting tests that are genuinely dead, duplicate, or trivial** — never thinning real coverage to make a number go down. When in doubt, keep the test and fix the rot; a useful test you find hard to love is worth more than a coverage gap you can't see.

Two control loops run this whole document, one at the entry of each test and one over the standing stock:

- **Entry control (every new test):** *"When this fails, will it tell me about a real, unique problem?"* If no — it asserts nothing real, or it duplicates a verification another test already does — don't write it.
- **Stock control (every iteration):** *"Which tests are slow, brittle, AND have never caught a real bug?"* Those are the rot; fix or retire them.

Manage both ends and a large suite stays under control. Manage neither and it becomes the graveyard.

---

# HALF A — THE SMELLS

Each smell is a must-be-told card with four fields, so you can scan it at a gate in seconds:

- **DEFAULT WRONG MOVE** — what the agent does on its own.
- **WHY THE AGENT DOES IT** — the incentive that produces it (almost always "green/looks-done is the reward").
- **THE TELL** — how to detect it, mechanically wherever possible.
- **CORRECTIVE + DO THIS** — the principle and one literal move you execute.

---

## S1 — The ice-cream cone (e2e-heavy, pyramid inverted)

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Verify everything through the widest, most lifelike test available — drive the full app/UI/API end-to-end even for logic a unit test would pin. The result is a top-heavy "cone": few or no unit tests, a bulge of e2e. |
| **WHY THE AGENT DOES IT** | An e2e test *looks* the most convincing — it exercises the real thing, so it reads as "really done." The agent has no felt cost for the 40-minute runtime or the flakiness it is signing the team up for; those costs land later, on someone else. |
| **THE TELL** | The suite's runtime is dominated by a handful of slow tests; a one-line UI/wording change reddens a wall of them; the test-count-by-layer histogram is widest at the top. Mechanically: sort tests by duration (`--durations=N`, `--durations` in pytest; `-json` timing in Go) and bucket by layer — a fat top is the cone. |
| **CORRECTIVE + DO THIS** | Push verification **down** the pyramid: anything a fast unit or narrow-integration test can verify should *not* be an e2e. Keep e2e to a small set of critical user-journey smokes. **DO THIS:** for each slow e2e, ask "what single bug does this catch that a unit test couldn't?" If the answer is "none," replace it with the unit test that would have caught the same bug, and delete the e2e. (Re-route via [decision-tree.md](decision-tree.md) Tree B scope; this is rebalancing, not coverage loss — the [REFRAME GUARD](#the-reframe-guard--read-this-first-before-any-pruning-instinct-fires).) |

---

## S2 — Coverage-as-KPI / assertion-free padding

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Write tests that *execute* code without *checking* it — call the function, maybe `print` or log, assert nothing meaningful (or assert it "doesn't throw"). Coverage climbs; defect-catching power does not. When a coverage floor is the gate, the agent pads to clear it. |
| **WHY THE AGENT DOES IT** | Coverage is the visible number, and the agent optimizes the visible number. Executing a line is cheap; verifying its result requires reasoning about the *correct* answer, which is the hard part it routes around. "Covered" reads as "done." |
| **THE TELL** | Tests with no assertion, or only `assert result is not None` / `assertTrue(x)` on a truthy-by-construction value; a test whose body would pass if the function `return`ed a constant. Mechanically: **mutation testing** — a line that is "covered" but whose mutation *survives* is padded. High coverage with a low mutation score is the fingerprint. |
| **CORRECTIVE + DO THIS** | Coverage is a **map for finding dark corners, never a target** (Goodhart: the moment it's a gate it stops measuring quality). Mutation testing measures real effectiveness — it asks "if this line were wrong, would a test fail?" **DO THIS:** never set a hard coverage number as the goal; instead run a mutation pass on the risky modules and kill every survivor with a real assertion. Depth, tooling, and the manual-mutant fallback live in [coverage-and-mutation.md](coverage-and-mutation.md). |

---

## S3 — Tolerating flaky tests

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | On a red CI run, re-run the job; if it goes green, move on. Or wrap the test in a retry, mark it flaky, and treat intermittent red as background noise rather than a defect. |
| **WHY THE AGENT DOES IT** | A rerun is the fastest path to green, and green is the reward. The agent feels no erosion of trust from a flaky suite — it does not have to live with the suite long enough to stop believing it. "Click rerun" is the single most dangerous reflex it has. |
| **THE TELL** | The same commit passes and fails; CI history shows retries; a test only fails under parallelism, certain orderings, or near midnight. Mechanically: run the suspect in a loop and under shuffled order (record the seed); a pass-rate below 100% on unchanged code is a flake by definition. |
| **CORRECTIVE + DO THIS** | **Zero tolerance** — a flake is a defect in the test or the system, never noise. **DO THIS:** fix the nondeterminism at its root, or quarantine it under the protocol in [determinism-and-flakiness.md](determinism-and-flakiness.md) — which owns the full diagnosis-and-quarantine procedure (capture the seed/clock/order, assign an owner, set a deadline, keep it running and reporting, never a silent skip). Never retry-to-green; that is the exact move an agent makes to fake a pass. Operating the quarantine *lane* in CI (the tracked, release-blocking metric) is the `flightline` skill's job, not this one's. |

---

## S4 — Implementation-coupled brittleness (testing structure, not behavior)

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Assert on *how* the code does its work — internal call sequences, private method names, intermediate variables, the exact shape of a helper — rather than on the observable result or contract. The test mirrors the implementation the agent just wrote. |
| **WHY THE AGENT DOES IT** | The agent wrote the implementation moments ago, so the implementation *is* the model in its head; the cheapest test to generate is one that restates that model back. Asserting structure is mechanical; deciding what the *behavior* should be requires understanding the spec. |
| **THE TELL** | The litmus test: **perform a behavior-preserving refactor** — rename a private method, reorder independent internal calls, extract a helper, swap a collaborator for an equivalent. If a test reddens though observable behavior is unchanged, it tests structure, not behavior. Symptom: functionality untouched, internals refactored, a wall of tests goes red. |
| **CORRECTIVE + DO THIS** | Test **public behavior and contracts**; treat private internals as a black box. The judgment rule: *a behavior-preserving refactor must not redden a single test.* **DO THIS:** assert on return values and observable state, not on interaction transcripts (reserve interaction assertions for cases where the call *is* the contract — see S5 and [test-doubles.md](test-doubles.md)). If a refactor reddened a test and the behavior is unchanged, the test is at the wrong layer — rewrite it against the public surface or delete it. |

---

## S5 — Over-mocking (everything stubbed, nothing integrated)

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Replace every collaborator with a mock — including fast, deterministic, in-process objects the agent owns — and assert on the mock interactions. Every unit test is green; the assembled system is broken because the mocks encoded *"I assume it returns this,"* not reality. |
| **WHY THE AGENT DOES IT** | Mocking removes the work of constructing real collaborators and the risk of a real dependency misbehaving, so it is the fastest route to an isolated green test. The agent's mock returns exactly what the agent expects — a closed loop that can never surprise it, and never catches a seam bug. |
| **THE TELL** | A unit test file with more mock setup than assertions; doubles for value objects or pure functions; all units green but the integration path untested. Mechanically: count mocks per test (a high ratio is the smell); and check whether *any* test exercises two real owned modules meeting at a seam — if none does, the seams are unguarded. |
| **CORRECTIVE + DO THIS** | Use the **weakest double that answers the test's question**: a real object if it's cheap and deterministic, then a fake, and only then a mock. Mock only what is genuinely uncontrollable — network, wall-clock, third-party SDKs, irreversible side effects — and keep internal collaborators real. **An integration layer must guard the seams** so "it actually wires together" is proven somewhere. **DO THIS:** for each mock, ask "is this collaborator slow, nondeterministic, or owned-by-someone-else?" If no, use the real thing. Add at least one narrow-integration test per seam. Full double-selection engine and the classicist default: [test-doubles.md](test-doubles.md). |

---

## S6 — Only-functional: ignoring performance and security

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Validate correctness — the function returns the right answer — and stop. Performance and security, the non-functional requirements someone *funded* at the requirements/architecture stage, go entirely untested. The feature ships, then falls over under load or gets breached. |
| **WHY THE AGENT DOES IT** | "Correct output" is the obvious, easy-to-check definition of done; NFRs need a different test *kind* (load harness, SAST/DAST, dependency scan) the agent doesn't reach for unprompted. Functional green looks complete, so the agent declares victory there. |
| **THE TELL** | The risk ledger or requirements list names a performance budget or a trust boundary, and **no test references it**. Mechanically: walk the funded NFRs and try to point at the test that validates each — every NFR with no test is the smell. |
| **CORRECTIVE + DO THIS** | Close the **NFR loop**: turn each funded non-functional requirement into a test or an explicit, reasoned deferral. Performance → a load/stress test with a stated budget and a hard threshold; security → SAST/dependency-scan/auth-and-injection tests on the boundary. **DO THIS:** at Books, for each funded NFR either name the validating test or record the deferral with a rationale (the `books / nfrs-validated` gate). This ties to the `flightline` skill's pipeline scans — the SAST/secret-scan/SCA steps that run those security checks in CI live there; *design* the tests here, *run them as blocking gates* there. |

---

## S7 — Tests rot / never maintained

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Treat tests as write-once. The agent only ever *adds* tests; it never reads the existing suite to delete a duplicate, retire a test for deleted code, or refactor a tangle. The suite grows monotonically and decays. |
| **WHY THE AGENT DOES IT** | The agent's task is "add tests for X," and deleting feels like *losing* coverage — the safe-looking move is always to add. It has no memory of the suite as a maintained asset and no instinct that an unmaintained test is a liability. Adding is rewarded; pruning is invisible. |
| **THE TELL** | Tests referencing deleted/renamed code (kept alive by mocks); two tests asserting the same thing; commented-out or perpetually-skipped tests nobody removed; a suite whose size only ever increases. Mechanically: skipped-test count trending up, duplicate assertions, tests over code the ledger marks do-not-test. |
| **CORRECTIVE + DO THIS** | Tests are a **living asset, maintained alongside production code** — monitored, refactored, and *deleted*. This is the entire subject of Half B. **DO THIS:** every iteration, budget time to sweep the suite with the two stock-control questions and act on the answers; deleting a dead/duplicate/trivial test is maintenance, not loss. Proceed to **HALF B**. |

---

# HALF B — SUITE STEWARDSHIP

This half governs the **test-quality** side of running a large suite: which tests earn their keep, how to prove they have teeth, and how to keep them readable as they multiply. The **operational** side — runtime budgets, parallelism and sharding, test-impact analysis (only run what a change touches), layered run schedules, and the CI mechanics of a quarantine — is **explicitly the `flightline` skill's `ci-cd.md` reference, and is not duplicated here.** When this document says "keep the suite fast," the *how* (shard it, run fast unit tests per-commit and slow e2e pre-merge, gate on the total runtime metric) lives there; what follows is the discipline that decides *what belongs in the suite at all*.

> **SEAM BOX.** *Design the tests = `assay` (here). Run and govern them at scale = `flightline`.* This reference picks the doubles, kills the smells, and decides what to delete; the pipeline that runs them fast, blocks merges on them, and operates the quarantine is `flightline`'s job. Don't reimplement either side in the other.

---

## B1 — Delete-is-maintenance: the two questions

An agent only adds, so it must be **told** that deleting is a first-class maintenance act. The economics are the same ones [coverage-and-mutation.md](coverage-and-mutation.md) sets out for deciding *not* to write a test in the first place — only applied to the *standing* suite instead of the Triage cut: a test that pins no behavior down still has to be read, updated, and debugged for the life of the code, and it dilutes the signal of the tests that do. Run **two questions** over any test you are considering keeping (or writing):

1. **When it fails, does it tell me about a real problem?** A test that can only fail when the test itself is broken (asserts a constant, restates a field, exercises framework-guaranteed glue) reports nothing about the product. Delete it.
2. **Is it redundantly verifying something another test already covers?** Near-duplicate tests, or a unit test of behavior a higher-level test already *asserts*, add maintenance cost and no signal. Collapse or delete.

What is safe and correct to delete: **duplicates**, tests over **deleted/rewritten code**, and tests of **trivial code** — plain getters/setters, framework boilerplate, third-party library behavior, DTO field copies. What is **not** safe to delete (see the [REFRAME GUARD](#the-reframe-guard--read-this-first-before-any-pruning-instinct-fires)): a test that covers a real branch just because it's inconvenient, a slow-but-load-bearing integration test (push it down a layer instead of cutting it), or the last test guarding a high-blast-radius path. Pruning is a scalpel, not a chainsaw.

---

## B2 — Mutation testing: the "looks-many-but-useless" detector

Coverage lies — it counts execution, not verification — so a suite can look thorough and verify almost nothing. **Mutation testing does not lie.** It automatically breaks the production code one small edit at a time (`>` → `>=`, `+` → `-`, delete a statement, `return n` → `return 0`) and reruns the suite against each mutant:

- **Killed** — a test failed. The suite detects that defect. Good.
- **Survived** — every test still passed. **A bug your suite cannot see** — a covered-but-unverified line. This is the signal: a survivor inside code you *thought* was well-tested is exactly the "looks-many-but-useless" test exposed.

This is the only reliable way to find the padded tests of S2 and the over-mocked tests of S5 — both produce survivors despite green coverage. Scope it to the high-risk modules (it's slow by a large constant) and run it **after** you believe a target is tested, to prove it. Tooling: `mutmut`/`cosmic-ray` (Python), **Stryker** (JS/TS, `.NET`), **PIT**/`pitest` (JVM), `cargo-mutants` (Rust), `go-mutesting`/`gremlins` (Go). No tool for the stack? Do the **manual mutant**: break the riskiest line on purpose, run the suite, *expect red*; still green means the test has no teeth — fix the assertion, then revert. Full mechanics, equivalent-mutant triage, and the regression-test-is-an-automatic-mutant note: [coverage-and-mutation.md](coverage-and-mutation.md).

---

## B3 — Parameterize and factor out duplication — but DRY yields to readability

The fix for fifty copy-pasted near-duplicate tests is **not** fewer behaviors verified; it is the *same* coverage expressed once. Two tools:

- **Parameterized / table-driven tests.** One assertion structure fed many input rows, so dozens of cases are a single readable table instead of fifty pastes. `@pytest.mark.parametrize` (Python), table-driven `[]struct{...}` with subtests in Go, `@ParameterizedTest`/`@CsvSource` (JUnit), `it.each` (Jest), `#[case(...)]` (rstest, Rust). Each row is named and runs independently — never a `for` loop that stops at the first failure and reports one opaque result.
- **Test-data factories / builders / fixtures.** Construct test objects in one place (`factory-boy` + `faker` in Python, builders elsewhere) so a change to the data structure is a one-line edit, not a hundred. Centralize the *construction*, not the *assertion*.

**But hold the line: in test code, DRY yields to readability.** Production code optimizes for reuse; test code optimizes for **a failure you can diagnose in one glance**. An over-abstracted test — where understanding a failure means jumping through **three layers of shared helper** (`makeWidget` → `withDefaults` → `buildContext`) before you can see what was even asserted — is *worse than duplication*. When a test fails you should see Arrange, Act, and Assert right there. So extract construction and parameter rows; do **not** bury the assertion or the scenario behind indirection that forces a spelunk to understand a red. A little duplication that reads clearly beats a clever abstraction that doesn't.

---

## B4 — Test-as-documentation: the only spec the next session inherits

The agent is a stateless newcomer; a readable test is the only behavioral spec the **next** agent session inherits. A test that reads as documentation pays off twice — once when it catches a bug, once when it tells the next reader what the code is *supposed* to do. Make every test a sentence:

- **Fixed structure: AAA (Arrange-Act-Assert) or Given-When-Then.** Set up the world, perform the one action, assert the outcome — visibly, in that order, in the test body.
- **Intention-revealing names.** Name the condition and the expected behavior — `test_transfer_rejects_overdraft_when_balance_equals_amount`, not `test1` / `testTransfer` / `testFoo`. The name is the spec line.
- **One behavior, one reason to fail.** A test should have a single reason to go red, so that when it does you know *immediately* what broke without debugging the test itself. A test that asserts five unrelated things hides which one failed and why.
- **Failure-message quality.** The assertion should report *expected X, got Y* with enough context to diagnose without a debugger. A bare `assertTrue(result)` that prints "expected true, got false" is a riddle; assert on the value so the message tells the story.

| Smell | Fix |
|---|---|
| `test1`, `testFoo`, `testHandler` | name the condition + expected behavior |
| one test asserting many behaviors | split: one behavior, one reason to fail |
| `assert result` / `assertTrue(x)` | assert the *value*, so the message shows expected vs actual |
| Arrange/Act/Assert tangled together | impose the AAA / GWT skeleton, blank-line-separated |

---

## B5 — Investment matches risk: don't gold-plate trivial code

Spend test effort where defects are likely and costly, and *don't* where they aren't. **Thick** tests — boundaries, error paths, multiple cases, mutation-proven — belong on core business logic, error-prone boundaries, and frequently-changed modules. **Thin** tests, or none, are correct for trivial, stable, low-risk code: getters, framework wiring, DTOs, code the framework's own suite already guarantees. Testing those "to look complete" creates **zero value and permanent maintenance drag** — every one is a line someone must read and update forever, for a defect that can't occur. This is the same risk-economics the do-not-test list in [coverage-and-mutation.md](coverage-and-mutation.md) and Tree A in [decision-tree.md](decision-tree.md) enforce at Triage: the override is that anything reachable by untrusted input is *never* trivial regardless of size, and any "thin wrapper" that maps, defaults, or validates is *not* thin. Match the spend to the stakes; gold-plating is its own anti-pattern.

---

## GATE MAP — which smell each `.checklist.yml` check governs

Read down this table at the corresponding GATE: it tells you which smell or stewardship rule you are actually enforcing, and what "done" means for an agent-written suite. The checks are the contract; the cards above are *why* the contract reads the way it does.

| Stage | Check ID | Smells / rules it governs | What it enforces, agent-era framing |
|---|---|---|---|
| build | `tests-green` | S2, S4, S5 | Green proves little — write tests that *verify*, not ones that merely execute or mirror the implementation. Don't manufacture the agent's default bad test in the first place. |
| build | `language-norms-applied` | S4 (assert behavior not internals), B3 (parametrize-not-loop), B4 (intention-revealing names) | Write clean, idiomatic tests: weakest double, behavior-not-structure, parameterized cases, readable AAA. The per-language footguns live in [language-norms.md](language-norms.md). |
| bite | `suite-validated` | S2, S5, B2 | Prove the suite has **teeth** — inject a fault (mutation or a deliberate break) and confirm a test reddens. A survivor is a covered-but-unverified line; this is where padding (S2) and over-mocking (S5) get caught. |
| bite | `state-progression-probed` | (state/idempotency audit) | Every state-mutating or should-be-idempotent unit has a multi-invocation / state-after-action assertion — single-call-only suites silently pass a double-apply bug. |
| bite | `smells-swept` | S1, S3, S4, S5, S7, B1 | Run the **smell sweep**: kill assertion-free padding, over-mocking, implementation-coupled brittleness, unreadable/multi-reason tests; fix or quarantine flakes (owner + deadline, never tolerated); delete dead/duplicate/trivial tests; rebalance an inverted pyramid by pushing *down*, never by thinning real coverage. |
| books | `nfrs-validated` | S6 | Close the non-functional loop — each funded performance/security NFR is validated by a test (load/stress, SAST/DAST, dependency scan) or explicitly deferred with rationale, so requirements → architecture → testing actually closes. The CI scans that *run* the security checks are `flightline`'s pipeline gates. |

> The whole map reduces to the two control loops from the [REFRAME GUARD](#the-reframe-guard--read-this-first-before-any-pruning-instinct-fires): the `build` checks are **entry control** (don't admit a worthless test), the `bite` checks are **stock control** (don't let the standing suite rot). Govern both ends and the suite scales without becoming a graveyard.

---

## Related

- [decision-tree.md](decision-tree.md) — Tree A risk economics (what's worth testing) and Tree B scope (pushing verification down the pyramid)
- [evidence-catalogue.md](evidence-catalogue.md) — what each test layer costs, catches, and misses; sizing the pyramid
- [test-doubles.md](test-doubles.md) — the weakest-double engine and the classicist default that defuse S5
- [probe-construction.md](probe-construction.md) — boundaries, oracles, and the cases a behavior test should hold
- [property-based.md](property-based.md) — one property in place of fifty brittle examples
- [determinism-and-flakiness.md](determinism-and-flakiness.md) — building determinism in, diagnosing flakes, the quarantine protocol behind S3
- [coverage-and-mutation.md](coverage-and-mutation.md) — coverage as a map, mutation as the teeth behind S2 and B2, and the do-not-test economics behind B5
- [language-norms.md](language-norms.md) — the per-language idioms and must-run commands the `language-norms-applied` gate enforces
- [../SKILL.md](../SKILL.md) — the eight-stage flight plan these gates sit in

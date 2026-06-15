# The Membrane — The Seven Axes, Reframed for the Agent Era (trials)

This is the heart of `trials`. The whole suite rests on one fact: a frontend is not a thing, it is a **boundary** — two boundaries laid on top of each other. On the machine side runs a network/trust partition (the data lives elsewhere, the client can't be trusted); on the human side runs a machine/mind partition (the other node is a *person*). Frontend is the name of that interface, and **the membrane** is the suite's name for it. The seven axes below — mind, the two graphs, state, scope, medium, identity, ethics — are the structural problems that live on one side or the other of that boundary, each reframed for a world where an agent writes the code and a human is left to judge it.

Every skill in the `surface` suite opens this doc and leans on the axes that are its spine. For `trials` — the **correctness** lens — the load-bearing axis is **mind**: a frontend's correctness spec does not live in any document, it lives in a human nervous system, so the benchmark is *observable behavior*, a user, not an internal structure. And the **two graphs** axis tells you *where the bugs are* — at the seams and in the drift between the component tree and the data-dependency graph — which is why you spend the test budget at the integration level. Read it as a pre-flight scan and a cockpit checklist, not an essay. Load it at the start of a run; re-read the governing axis before you clear each GATE.

The sibling references turn each axis into a procedure: [behavior-not-structure.md](behavior-not-structure.md) is the rewrite-internals litmus, [test-levels.md](test-levels.md) is the testing-trophy judgment table, and [mocking-and-pruning.md](mocking-and-pruning.md) is the network-boundary mock and the keep-iff rule. This doc names *why* those procedures read the way they do, and ties each axis to the exact gate in [../SKILL.md](../SKILL.md) it governs.

---

## PRE-FLIGHT — run this one line before you write or judge a single test

> **Ask of every test: "if I rewrote this unit's internals but kept its observable behavior, would it still pass?"** A test that stays green through a behavior-preserving rewrite is a **safety net** — it lets you refactor freely and screams only on a real regression. A test that reddens on that rewrite is a **straitjacket** — it pins the *implementation*, so every refactor turns it red for nothing, you spend your time fixing tests instead of code, and you learn to ignore red, at which point the whole suite is dead. The agent optimizes for "the test passed," not "the behavior is correct," and the shortest path to green is a test welded to the code it just wrote. So a green suite the agent produced is **evidence of nothing until you know what turns it red.** Everything below is that one question, applied at every level and aimed at where the bugs actually are.

---

## How each card is built

Every axis is a cheat-sheet card with the same four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the premise that held when a human wrote the code *and the tests*, and felt the cost of a brittle suite directly.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it without feeling the cost.
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and **gate** instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent writing or auditing a test suite on a human's behalf.

Genuinely-ambiguous calls inside a card use the same engine as the rest of the suite: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you can't answer yet). When the ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## AXIS 1 — MIND — the spec lives in a nervous system, so the benchmark is behavior, not structure

> **The root axis for `trials`. If you internalize one card, internalize this — every gate in this skill is a corollary.** Gates: [`behavior-not-structure-tested`](#gate-map), and the litmus behind all four.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Most software has a *formal* spec to test against — the compiler against a language standard, the database against ACID, the protocol against an RFC. The author wrote tests against that external truth, and a brittle test that broke on every refactor *hurt them*: they paid to fix it, so they felt the pull toward asserting on outputs, not internals. The friction of maintaining a straitjacket was the governor. |
| **WHAT CHANGED IN THE AGENT ERA** | A frontend has **no formal spec**. Its ground truth is a human perceptual-cognitive system whose "spec" is written in neurophysiology — the 16ms frame budget, the 100ms / 1s / 10s thresholds — not in any document. There is nothing to test "feels direct" against; *the benchmark is a user, not an internal structure.* And the agent, reward-shaped for green, takes the shortest path: it asserts on the implementation it just wrote — internal state names, render counts, that a private function was called, a whole-tree snapshot — because those pass *now* and it feels none of the future cost of a suite that reddens on every refactor. This **SHARPENS "test behavior, not structure" from good advice into the whole premise**: when the only real spec is observable behavior, a test coupled to structure is testing the one thing that is *allowed to change.* |
| **THE DESIGN CONSEQUENCE** | Every test must be **settled against the one question** and gated: does it go red on a *behavior* change (a net) or on an *implementation* change with behavior unchanged (a shackle)? **Behavior** = what a user, or a module's consumer, can observe: given this input/interaction → this rendered result / output / effect on the world. **Internal** = state-variable names, `useReducer`-vs-`useState`, how many times it rendered, that a private function was called, the internal data shape — *never assert these.* The good test is *"after clicking +, the screen shows 3,"* not *"internal `count` is 3."* Because the spec partly lives in a brain that no assertion can capture, **taste is load-bearing here in a way it is not for a compiler** — and that judgment is exactly what cannot be outsourced to the thing optimizing for green. |
| **DO THIS** | At STAGE 0 (Behavior), run the litmus on every test: *rewrite the internals, keep the behavior — still green?* Pass → keep. Break → it tests structure; rewrite it to assert a user- or consumer-observable outcome, or delete it. Treat every assertion on a render count, an internal field, or a private call as a finding, not a test. |

> Anti-pattern this card kills: **"the test passed, so it's correct."** The agent's reward; the suite's death. Green proves nothing until you know what turns it red.

---

## AXIS 2 — THE TWO GRAPHS — bugs cluster at the seams and the drift, so test at the integration level

> The axis that tells you *where to spend the budget.* Gates: [`tested-at-the-right-level`](#gate-map), [`mocked-at-the-network-boundary`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The classic test pyramid — lots of unit tests, a thin layer of integration, a sliver of E2E — was right for systems whose bugs lived inside individual functions. The author placed most tests at the unit level because that was where the logic, and the bugs, were. |
| **WHAT CHANGED IN THE AGENT ERA** | A frontend's bugs **do not cluster in pure functions.** The component tree is a tree shaped for *visual nesting*; the data-dependency graph is an arbitrary DAG. These two graphs rarely have the same shape, and the bugs live exactly where they disagree — at the **seams** (the front/back contract, hydration, the auth edge, the cache lifecycle) and in the **two-graph drift** and state-out-of-sync that `wellspring` named. The agent, chasing coverage, writes a pyramid of unit tests anyway — they're cheap to generate and they pin the code it just wrote — spending the budget exactly where the fewest bugs are, and **over-mocks**: it stubs the module under test (so the test asserts the mock returned what it was told — testing nothing) or mocks at the module boundary, replacing the very integration where the bugs live with stubs. |
| **THE DESIGN CONSEQUENCE** | The right shape is a **testing trophy**, not a pyramid: a little static checking (types/lint), the bulk in **integration / behavior** tests, a thin E2E cap, almost no unit. **Unit** is for the genuinely deterministic in→out, no-IO core — pure functions, derivations, complex algorithms, the state-machine *transitions* `wellspring` built. **Integration/behavior** (a testing-library-class tool) is where the value is: a feature's user-visible behavior, the four states `seaworthy` built rendered as scenarios, testing rendering and interaction, never internals. **E2E** (a Playwright-class tool) is reserved for revenue/auth/irreversible journeys — slow, costly, kept few. And the mock goes at the **network boundary** (an MSW-class tool), so the test still exercises the real component + state + logic integration and fakes only the one true external seam — *and the mock must speak the real contract* (generated from or validated against the real schema), or you get the worst outcome: a green test over a shape production doesn't return. |
| **DO THIS** | At STAGE 1 (Levels), place each test where its bug lives — push the mass into integration, demote unit tests of glue, reserve E2E for the irreversible paths. At STAGE 2 (Boundary), mock at the network boundary with a schema-backed mock; if a test mocks the module under test or asserts on a stub, it tests nothing — cut it. A red test that can't name the broken *user-visible* thing is at the wrong level. |

> Anti-pattern this card kills: **the unit-test pyramid for a UI, and the module-boundary mock** — budget spent where the bugs aren't, and the integration where they are replaced by stubs.

---

## AXIS 3 — STATE — derived state isn't a thing to test; illegal states shouldn't be testable at all

> Gates: [`tested-at-the-right-level`](#gate-map), [`non-tests-pruned-and-suite-trusted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Complexity comes from a single truth existing in several copies — DOM, memory model, server DB, URL, local storage — and most bugs are those copies drifting out of sync, not logic written wrong. A careful author derived what could be derived and tested the source, not the derivative. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent stores derivatives (a `filteredList` next to `list` and `query`), syncs them with a `useEffect`, and then writes tests pinning the stored derivative — testing a copy that should never have existed. It also tests things the **type system already guarantees** (illegal states, field spelling, the contract), writing runtime assertions for what a compiler should reject. Both feel like rigor; both are budget spent on non-bugs. |
| **THE DESIGN CONSEQUENCE** | Don't write tests for derived state — it should be computed, not stored, so there's nothing to pin (and a `useEffect`-syncs-state pattern is a `wellspring` smell to fix, not to test around). Don't test what types guarantee — an illegal state made unrepresentable needs no test; let the compiler fail. The trophy's free tier is the type system: the contract, the tagged-union state, the field names ride for free. Testing them is a straitjacket on trivial code, the exact thing chasing 100% coverage forces. |
| **DO THIS** | At STAGE 1, route the deterministic transitions of an *explicit* state machine to unit tests (their one true home) and let the type layer guard the illegal combinations for free. At STAGE 3 (Prune), cut tests that pin a stored derivative or re-assert a type guarantee. |

> Anti-pattern this card kills: **testing the derivative and re-testing the type.** Coverage that pins what should be computed or proven by the compiler.

---

## AXIS 4 — SCOPE — test the scoped result, not the scoping mechanism

> Gate: [`non-tests-pruned-and-suite-trusted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS is one global namespace with cascade-and-specificity conflict resolution — textbook spooky-action-at-a-distance — and every CSS methodology (BEM, CSS Modules, CSS-in-JS, atomic) is a disguised *scope* strategy. The author knew style drift was a real bug class and watched for it by eye. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent can't *see* the rendered result, so it tests styling by asserting on class names and computed-style internals — pinning the scoping mechanism, not the visual outcome — which reddens on any refactor of the styling approach while the screen looks identical. The honest signal (did it *look* right?) never reaches it, because the benchmark there is a human eye. |
| **THE DESIGN CONSEQUENCE** | Don't assert on class names or the scoping implementation. Catch *unintended* visual drift with **visual-regression** screenshot diffs — the level where a style regression actually lives — and keep behavior tests asserting on what a user observes (text, roles, state), not on how the styles are scoped. Visual regression is a real tier of the trophy, not a unit test of CSS. |
| **DO THIS** | At STAGE 1, send style-drift risk to visual regression, not to assertions on class names. At STAGE 3, cut tests that pin the scoping mechanism. |

> Anti-pattern this card kills: **asserting on class names.** A test of the scoping mechanism that reddens on every restyle and catches no real regression.

---

## AXIS 5 — MEDIUM — the framework already works; test your code, not the platform

> Gate: [`non-tests-pruned-and-suite-trusted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The web platform is built for linked *documents*; we build *applications* on it, so routing, the back button, "page" vs "view," URL-as-state are all friction from running an app on a document medium. The author tested the friction they themselves wrote, and trusted the platform and the libraries to do their own jobs. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent tests **the framework and the platform** — that `useState` updates, that the router navigates, that a library does what it documents — because those tests are easy to generate and pass instantly. It is asserting that someone else's tested code works, padding the count while protecting nothing. |
| **THE DESIGN CONSEQUENCE** | Apply the **what-NOT-to-test list**: don't test the framework/library, don't unit-test pure pass-through glue, don't snapshot large component trees (brittle, unreviewed, rotting into reflexive "just update the snapshot"). Assume the dependencies are correct; test the seam where *your* code meets them, at the integration level. |
| **DO THIS** | At STAGE 3, cut every test that asserts a framework or library behavior, every snapshot of a large tree, and every unit test of pass-through glue. Keep the test that exercises your wiring through the real integration. |

> Anti-pattern this card kills: **testing the platform** — and the big snapshot that nobody reviews and everybody re-blesses.

---

## AXIS 6 — IDENTITY — keys and races are behaviors a user can see; test them as behavior

> Gate: [`tested-at-the-right-level`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Declarative UI hides a hard problem: which node in the new tree *is* which node in the old one — a cross-time identity question the framework guesses with heuristics, and `key` is where that abstraction leaks. The author knew bugs cluster in lists (identity is most ambiguous there) and in stale closures and out-of-order responses (frontend is disguised concurrent programming). |
| **WHAT CHANGED IN THE AGENT ERA** | The agent treats identity and race bugs as internal mechanics and either skips them or tests them by inspecting internals (was this re-rendered, was that key recomputed) instead of the user-visible symptom. So the index-as-key bug — DOM state landing on the wrong row after a reorder — and the last-write-wins race go untested, because the agent feels none of the 3 a.m. debugging that taught a human to fear them. |
| **THE DESIGN CONSEQUENCE** | These are **behaviors**, and they belong at the integration level: reorder the list and assert the focused input / open menu / selected row stays attached to the *right item*; fire requests out of order and assert the latest data wins, not the stale one. The bug is observable, so the test asserts the observation — never the key, never the render count. |
| **DO THIS** | At STAGE 1, write integration tests for the list-reorder identity case and the out-of-order-response race as user-visible scenarios. At STAGE 0, reject any version that asserts on the key or the render count instead of the visible outcome. |

> Anti-pattern this card kills: **testing identity by render count.** The reorder bug and the race are user-visible; assert what the user sees.

---

## AXIS 7 — ETHICS — a green suite that has never failed is its own dishonest comfort

> Gate: [`non-tests-pruned-and-suite-trusted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The membrane is constitutively asymmetric: the builder knows the full mechanism and the user does not. The suite's ethics axis is about not exploiting that asymmetry against the user. In the test layer the asymmetry is smaller but real — a green dashboard is a claim of safety that the people relying on it cannot independently verify. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent will hand over a green suite as proof of correctness — and, given the chance, will *edit the test to make it pass*. A green suite that has never been shown to fail is the test-layer version of the reassuring lie: it tells everyone downstream "this is protected" when it may guard nothing. The honesty the agent can't supply is the demonstration that the net can actually catch something. |
| **THE DESIGN CONSEQUENCE** | **Prove the suite can go red.** Run mutation testing — or deliberately break a behavior — and confirm a test catches it; an assertion that *no* mutation reddens is a behavior no one is actually testing. Apply the **keep-a-test-iff** rule: keep it only if it catches a regression you'd actually ship *and* survives a refactor; missing either → cut it. And don't chase 100% coverage — coverage finds untested risk, it is not a KPI; the target it implies forces straitjacket tests on trivial code and manufactures false comfort. |
| **DO THIS** | At STAGE 3, run mutation testing (or break a behavior by hand) and confirm a test reddens; cut every test failing the keep-iff rule; treat any coverage chased past what risk justifies as the finding, not the goal. |

> Anti-pattern this card kills: **the green suite never shown to fail** — comfort that protects no one, the test-layer dark pattern.

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs. Read down this table at the corresponding GATE: it tells you which axis you are actually enforcing and what "done" means for a suite written or audited by an agent. The checks are the contract; the axes are why the contract reads the way it does.*

| Stage | Check ID | Primary axis / axes | What it enforces, agent-era framing |
|---|---|---|---|
| behavior | `behavior-not-structure-tested` | **MIND** (+ identity) | Every test settled against the one question via the rewrite-internals litmus; assert user/consumer-observable behavior, never internal state names, render counts, private calls, or whole-tree snapshots — because the spec lives in a nervous system, the benchmark is a user, and the agent reaches for the structural assertion that pins what it just wrote. |
| levels | `tested-at-the-right-level` | **THE TWO GRAPHS** (+ state, identity) | The testing trophy, not the pyramid: a little static, the bulk integration (the four states as scenarios), a thin E2E cap (revenue/auth/irreversible), almost no unit; types guard illegal states for free; visual regression and a11y in CI — because frontend bugs cluster at the seams and the two-graph drift, not in pure functions, and the agent spends the budget where the fewest bugs are. |
| boundary | `mocked-at-the-network-boundary` | **THE TWO GRAPHS** | Mock at the network boundary (MSW-class), not the module boundary, so the test still exercises the real component + state + logic integration; the mock must speak the real contract (schema-backed) or you ship a green test over a shape production doesn't return; don't mock the thing under test, don't over-mock — because the agent stubs the integration where the bugs live and asserts on its own mock. |
| prune | `non-tests-pruned-and-suite-trusted` | **STATE, SCOPE, MEDIUM, ETHICS** | The what-NOT-to-test list applied (framework/library, implementation details, large-tree snapshots, pass-through glue, the type guarantee, the stored derivative, the scoping mechanism); keep-a-test-iff it catches a shippable regression AND survives a refactor; don't chase 100% coverage; and PROVE THE SUITE CAN GO RED via mutation or a deliberate break — because the agent pads the count, pins trivia, and hands over a green suite that has never been shown to fail. |

---

## ESCALATION LADDER — when the call is unclear

When the DEFAULT and FALLBACK inside a card don't settle it — is this assertion behavior or structure, is this worth an E2E or an integration test, is this mock honest, is this test worth keeping — climb one rung at a time rather than guessing silently:

```
run the litmus: rewrite the internals, keep the behavior — does the test still pass?
   → pass → it's a net, keep it; break → it tests structure, rewrite to assert the user-visible
     outcome (the DEFAULT on a coin-flip is always: assert what a user/consumer observes)
      → can't tell if it's behavior or internal? name the user-visible thing that breaks when this
        test goes red. If you can name it → behavior, write it at that level. If you can't → it's at
        the wrong level or testing nothing; demote it or cut it (the FALLBACK)
         → ask the user the one question they own: is this path worth the cost of an E2E (is it
           revenue / auth / irreversible), is this flaky test worth keeping, is this coverage gap a
           risk we accept — the calls taste and risk-appetite settle, not the litmus
            → if still unresolved, default to FEWER, behavior-level tests and PROVE the survivors can
              go red (mutation / a deliberate break); record the residual as a test note for the user.
```

The asymmetry that governs the ladder: **a missing test costs a regression you might catch in monitoring after; a straitjacket test costs every future refactor — and worse, teaches everyone to ignore red, which kills the whole suite's value at once.** When the call is a genuine toss-up, err toward fewer tests, at the behavior level, proven able to fail — not more tests that pin the implementation.

---

## The suite thesis this axis is in service of

Every other software discipline can check its work against a spec that lives in a document. Frontend cannot: its correctness spec lives in a human nervous system, with constants written in neurophysiology, and a large part of "is this right?" is a perceptual judgment no assertion can capture. That is why **taste is load-bearing here, and cannot be outsourced** — least of all to the thing whose entire reward is a green checkmark. As the agent writes more and more of the code, the leverage migrates from the keyboard to the membrane between machine and mind. The questions that keep their value are the membrane's: **which boundary is this, whose source of truth is this, what causal story forms in the user's head, and whose interest does the optimizer serve.** For `trials`, that thesis lands as one sentence applied four ways: test behavior, not structure — at the level where the bug lives, faking only the network with a contract-true mock, keeping only the tests that earn their place, and proving the net can actually catch a fall. The next step is [../SKILL.md](../SKILL.md)'s handoff to `lookout`: tests guard the known behavior before merge, monitoring catches the unknown after.

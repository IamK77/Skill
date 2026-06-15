# Mocking & Pruning — fake only the network, keep only what earns its place, prove it can fail

This reference is the depth behind two stages of the [../SKILL.md](../SKILL.md) flight plan — **STAGE 2 — Boundary** and **STAGE 3 — Prune** — and it governs the two checks they gate: **`mocked-at-the-network-boundary`** and **`non-tests-pruned-and-suite-trusted`**. The litmus and the test levels are its siblings — [behavior-not-structure.md](behavior-not-structure.md) and [test-levels.md](test-levels.md) — and they answer *what a good test asserts* and *where it lives*. This file answers the three questions that come after: **where do you fake the world, what do you refuse to test, and how do you know any of it can actually catch a fall.**

The governing fact, inherited from [the-membrane.md](the-membrane.md) and restated because every call below is judged against it:

> **A frontend's only real spec is observable behavior, the bugs cluster at the seams and the two-graph drift, and the agent is reward-shaped for green — so a green suite is evidence of nothing until you know what turns it red. Mock the one true external seam, cut every test that pins structure or trivia, and prove the survivors can fail.**

## Contents

- [The map — two stages, three moves](#the-map--two-stages-three-moves)
- [Boundary — fake only the network](#boundary--fake-only-the-network)
  - [The reframe — where you mock decides whether the test is real](#the-reframe--where-you-mock-decides-whether-the-test-is-real)
  - [The mock must speak the real contract](#the-mock-must-speak-the-real-contract)
  - [Don't mock the thing under test, and don't over-mock](#dont-mock-the-thing-under-test-and-dont-over-mock)
  - [Worked example — the order-status mock](#worked-example--the-order-status-mock)
- [Prune — the what-NOT-to-test list and the keep-iff rule](#prune--the-what-not-to-test-list-and-the-keep-iff-rule)
  - [The what-NOT-to-test list](#the-what-not-to-test-list)
  - [The keep-a-test-iff rule](#the-keep-a-test-iff-rule)
  - [When to stop](#when-to-stop)
- [Prove the suite can go red](#prove-the-suite-can-go-red)
- [The agent-era failure mode this counters](#the-agent-era-failure-mode-this-counters)
- [How findings route](#how-findings-route)

---

## The map — two stages, three moves

| Move | Stage / check | The underlying question | The failure it kills |
|---|---|---|---|
| **Boundary** | `mocked-at-the-network-boundary` | Where do you cut the test off from the real world? | An integration test gutted into a test of its own mocks |
| **Prune** | `non-tests-pruned-and-suite-trusted` | What does the suite refuse to test, and what does it cut? | A count padded with tests that pin trivia or structure |
| **Prove-can-go-red** | `non-tests-pruned-and-suite-trusted` | Has any test in this suite ever been shown to fail on a real break? | A green dashboard that guards nothing |

The three are one idea applied to the suite's edges instead of its assertions: **mocking and pruning are means, not ends.** A mock exists to fake the *one* thing you can't run for real, not to be convenient; a deletion exists to make the suite trustworthy, not to chase a number; mutation exists to convert "it's green" into "it can go red." Every call below is judged by whether it makes the suite a safety net or a straitjacket — the one question of [behavior-not-structure.md](behavior-not-structure.md), here aimed at the seams and the survivors.

---

## Boundary — fake only the network

Open this at **STAGE 2**. Where you mock decides whether the test is real before any assertion in it matters.

### The reframe — where you mock decides whether the test is real

A test fakes *something* — you cannot hit the real payment API on every run. The only question is **where you cut.** There are two boundaries you could fake, and they are not equivalent:

| You mock at the… | What the test then exercises | What it proves |
|---|---|---|
| **module / function boundary** (stub the hook, the service, the data layer the component calls) | the component wired to your stubs | that your component calls the mock and renders what the mock returned — i.e. nothing about the real integration |
| **network boundary** (intercept the HTTP/fetch/WebSocket call with an MSW-class interceptor) | the **real** component + state + cache + logic integration, with only the one true external seam faked | that your actual code, integrated, behaves correctly given a realistic response |

**Mock at the network boundary, not the module boundary.** The bugs cluster at the seams and the two-graph drift ([the-membrane.md](the-membrane.md), AXIS 2) — fetch → cache → derive → render → invalidate → re-render. Mock at the module boundary and you have replaced *exactly that integration* with stubs: the test now proves your wiring of mocks, not your code, and it goes green over a real bug living in the seam you stubbed out. Mock at the network boundary and that whole chain runs for real, faking only the genuinely external thing — the server you can't (and shouldn't) call from a test.

> **The rule of thumb:** mock where your code *ends* and the *world* begins, never where one of your modules ends and another begins. A TanStack-Query-class cache, your reducers, your state machine, your render — all of that is *your* code; it should run. The network is the world; fake it.

PREDICATE: is the thing you are about to mock something *your team wrote*? DEFAULT: if yes, don't mock it — let it run; mock the network call beneath it instead. FALLBACK: if a true external seam isn't HTTP (the clock, `crypto`, a third-party SDK with no network surface), fake that *specific* seam at its narrowest point and let everything else run — the principle is "fake the world, not your wiring," not "MSW or nothing."

### The mock must speak the real contract

A network mock that returns a shape production never returns is **the worst outcome in the whole skill**: a green test over a lie. The test passes, the refactor is "safe," and prod breaks on a field that was never there. This is the echo, in the test layer, of `keel`'s stub-contract rule — *a stub implementation is fine; a stub contract is not.* The backend logic behind the mock can be a thin fake; the **shape** it speaks — the types, the auth shape, the error shape — must be the real one.

So the mock's response must be **generated from, or validated against, the real API schema** (OpenAPI / GraphQL / tRPC — whatever the contract is generated from in `keel`). Not hand-typed from memory, not "what I think the server sends." The executable check, mirroring `keel`'s: *if the server changed a field, would this mock — and a test using it — be forced to change too?* If a server-side rename can leave your mock green, your mock is not contract-true; it is a hand-copy that will silently expire.

| Mock's source of truth | What happens when the real contract changes | Verdict |
|---|---|---|
| Generated from / validated against the schema | the mock (or its types) breaks at build → you find out at the seam | contract-true — keep |
| Hand-written to match "what I remember the API returns" | the mock stays green; prod breaks | a green test over a shape prod doesn't return — a finding |
| Pared down to the bare fields the wiring needs | tests the wiring, drifts from the contract, misses the field you don't reference yet | wiring-verification, not a real test |

### Don't mock the thing under test, and don't over-mock

Two adjacent failures share a tell — **the test asserts that the mock returned what you told it to:**

- **Mocking the thing under test.** If you stub the very module whose behavior the test claims to check, the test asserts your stub did what you configured it to do. It is a tautology with a green checkmark. (The membrane names this in AXIS 2: *over-mocks the module under test.*)
- **Over-mocking.** Even when the unit under test isn't itself stubbed, stubbing *everything around it* down to bare wiring collapses an integration test into "I asserted the mock returned what I set." The integration — the thing the test was for — is gone.

The smell is uniform: **count the mocks.** A behavior test that needs a dozen stubs to stand up is either testing too much or wired too tightly to a seam it shouldn't touch — the same mock-count probe `plumb` uses as a testability litmus. One network interceptor and a real render is the shape of a good integration test; a wall of `vi.mock(...)` over your own modules is the shape of a test that proves nothing.

### Worked example — the order-status mock

A component fetches an order and renders its status. The agent's reflex is to stub the data hook:

```ts
// BAD — mocked at the MODULE boundary; the integration is gone
vi.mock("./useOrder", () => ({
  useOrder: () => ({ data: { status: "shipped" }, isLoading: false }),
}));
// the test now asserts: "given the hook returns {status:'shipped'}, the screen shows Shipped."
// it proves your render of a stub. The cache, the fetch, the error mapping, the contract —
// all stubbed away. A broken query key or a wrong error shape ships green.
```

The same test, cut at the network boundary, with a schema-backed response:

```ts
// GOOD — fake only the network; everything you wrote runs for real
server.use(
  http.get("/api/orders/:id", () =>
    HttpResponse.json(orderFixture({ status: "shipped" }))   // orderFixture is built from the real schema
  )
);
render(<OrderStatus id="42" />);
expect(await screen.findByText("Shipped")).toBeVisible();
// this exercises the real hook + cache + state + render. If the query, the contract mapping,
// or the loading→data transition is wrong, THIS test reddens — at the seam, where the bug lives.
```

The four states `seaworthy` built are now ready-made cases against this one seam — feed a loading delay → assert the skeleton; feed a 500 → assert the error UI *and that the user's input survives*; feed `[]` → assert the empty-state CTA; feed data → assert the content. Each is one network response away, and each reddens only on a user-visible regression. (This is the four-states-as-cases handoff named in [the-membrane.md](the-membrane.md), AXIS 3; the level each sits at is [test-levels.md](test-levels.md)'s.)

### GATE — `mocked-at-the-network-boundary`

Before BOUNDARY clears: mocks are at the network seam (an MSW-class interceptor), not the module boundary; the real component + state + logic integration still runs; the mock speaks the real contract (schema-backed, would break if the server changed a field); nothing stubs the unit under test; mock-count is low. A test that asserts on its own stub is cut, not counted.

---

## Prune — the what-NOT-to-test list and the keep-iff rule

Open this at **STAGE 3**. A suite is only as good as what it refuses to test and what it can catch. Pruning is not vandalism; it is the move that converts a pile of passing tests into a *trusted* suite — fewer tests, each of which means something when it reddens.

### The what-NOT-to-test list

Each line below is a test that *looks* like rigor and is, in fact, either a straitjacket (reddens on refactor, catches nothing) or padding (passes always, protects nothing). Cut them, and refuse to write more.

| Don't test… | Because… | Membrane axis |
|---|---|---|
| **the framework / library** — that `useState` updates, that the router navigates, that a query library caches | you'd be asserting someone else's tested code works; assume the dependency is correct | MEDIUM |
| **implementation details** — internal state, render counts, that a private function / hook was called | structure, not behavior; reddens on every refactor (the litmus break) | MIND |
| **large component trees via snapshot** | brittle, no one reviews the diff, rots into reflexive "update snapshot" — a rubber stamp | MEDIUM |
| **pure pass-through glue** | a component with no logic has no behavior to protect | MEDIUM |
| **a stored derivative** (`filteredList` next to `list` + `query`) | it should be *computed*, not stored, so there's nothing to pin — and the stored copy is a `wellspring` smell to fix, not test around | STATE |
| **what the type system guarantees** — illegal states, field spelling, the contract | the compiler already fails on these for free; a runtime test of them is a straitjacket on trivial code | STATE |
| **the scoping mechanism** — asserting on class names / computed-style internals | pins *how* styles are scoped, reddens on any restyle, catches no visual regression (send drift to visual-regression instead) | SCOPE |
| **toward 100% coverage** | coverage finds untested risk — it is **not a KPI**; chasing the number forces straitjacket tests onto trivial code | ETHICS |
| **the thing you're mocking** | tautology — you assert the mock returned what you set | (boundary, above) |

**Coverage is a means, not an end.** Use it to *find* a risky path no test touches, then decide — by risk, not by the percentage — whether that path is worth a test. A line of trivial glue left uncovered is fine; a critical error-recovery branch left uncovered is a finding the coverage report surfaced. The number is a flashlight, never a target.

### The keep-a-test-iff rule

For every surviving test, apply the rule — **both conditions, or cut:**

> **Keep a test iff (1) it catches a regression you'd actually ship, AND (2) it survives a behavior-preserving refactor.** Missing *either* → cut it.

The two conditions are the two failure modes named once each:

- **Fails (1) — catches nothing you'd ship.** It tests the framework, a stored derivative, a type guarantee, or your own mock. Green forever; protects nothing. *Padding.*
- **Fails (2) — breaks on refactor.** It pins structure — internal state, render count, a private call, a snapshot. Reddens when behavior is unchanged; you fix the test instead of the code, and you learn to ignore red. *Straitjacket.* (This is the litmus of [behavior-not-structure.md](behavior-not-structure.md), applied as a cut.)

And the level check that comes with the rule: **a red test must be able to name the broken user-visible thing.** Write tests at the level where a red result tells you *"a user can no longer do X."* If a failing test can't name the user-visible thing that broke, it is at the wrong level — demote it (it's testing structure) or cut it (it's testing nothing). A red that says "render count changed" is not a regression report; a red that says "after submitting, the success message never appears" is.

PREDICATE: does this test fail the keep-iff rule on either limb? DEFAULT: on a genuine toss-up, **cut it** — the asymmetry below says a missing test is cheaper than a straitjacket. FALLBACK: if you can't yet tell whether it catches a shippable regression, demote it to the lowest level that still names a user-visible break and revisit at prove-can-go-red — a test no mutation reddens answers the question for you.

> **The asymmetry that settles every toss-up:** a *missing* test costs a regression you might still catch in monitoring after merge ([the-membrane.md](the-membrane.md)'s `lookout` handoff). A *straitjacket* test costs every future refactor — and, worse, teaches everyone to ignore red, which kills the whole suite's value at once. When in doubt, fewer tests, at the behavior level, proven able to fail.

### When to stop

More tests is not more safety; past a point it is more straitjacket and a slower suite people skip. Stop here:

- **Critical paths** (revenue / auth / irreversible — the same paths `test-levels.md` reserves for E2E) → tested to **high confidence.**
- **Everything else** → tested to **smoke level** — the happy path plus the four states, and stop.
- **Speed is a real exit criterion.** A suite slow enough to be skipped equals no suite. If the suite is too slow to run on every change, that is a finding — usually too many E2E tests or too little network-level mocking, not too few tests.

The exit standard from the source, made executable: critical journeys have E2E cover; you performed a real internal refactor and watched the suite stay green (the proof it tests behavior, not structure); any red points precisely at a real, user-visible regression; and the suite runs fast enough that people actually run it.

---

## Prove the suite can go red

A green suite that has never been shown to fail is worthless — it is the test-layer version of the reassuring lie ([the-membrane.md](the-membrane.md), AXIS 7): it tells everyone downstream "this is protected" when it may guard nothing. The agent will hand you exactly this, and given the chance will *edit the test to make it pass.* Green is the agent's reward; it is not your evidence. **The evidence is a demonstrated red on a real break.**

Two ways to produce that evidence, weakest-effort first:

- **The deliberate break (always available, do it at least once).** Pick a behavior the suite claims to protect; break it on purpose — invert a condition, drop the error-state render, return the stale response in the race. Run the suite. **If nothing reddens, the behavior is not actually tested** — that's a finding, not a pass. Revert. This is the cheapest honesty check and it needs no tooling.
- **Mutation testing (systematic, where it's worth standing up).** A mutation-testing tool (a Stryker-class tool) mechanically introduces small faults — flips a `>` to `>=`, deletes a statement, swaps a boolean — and reports which mutants your suite *killed* (caught) versus which *survived* (slipped through green). A surviving mutant is a precise statement: **this assertion is one no behavior actually depends on.** Aim it at the critical paths; a surviving mutant there is a real gap, a surviving mutant in trivial glue is usually a test you shouldn't have written anyway (back to the prune list).

> **The principle, stated as a rule:** *an assertion that no mutation reddens is a behavior no one is actually testing.* Coverage tells you a line *ran*; mutation tells you a line is *checked*. The suite is trusted only once you have watched it go red on a break it should catch — and watched the refactor leave it green. Both directions, or the suite is unproven.

### FINAL GATE — `non-tests-pruned-and-suite-trusted`

Before PRUNE clears: the what-NOT-to-test list is applied (framework, implementation details, large snapshots, glue, stored derivatives, type guarantees, scoping mechanism, mocking the thing under test); coverage is used as a risk-finder, not chased as a KPI; every surviving test passes the keep-iff rule and can name the user-visible thing its red reports; and the suite has been **proven able to go red** — via mutation or a deliberate break — with a real refactor confirmed to leave it green.

---

## The agent-era failure mode this counters

The agent optimizes for *"the test passed,"* not *"the behavior is correct,"* and that single misalignment produces every failure on this page:

- It **over-mocks and mocks the wrong layer** — stubbing the module under test (a tautology) or the module boundary (gutting the integration where the bugs live), because that is the shortest path to a green render of the code it just wrote.
- It writes a **mock whose shape doesn't match the contract**, because it has no instinct that a green test over a wrong shape is worse than no test — it feels none of the prod break.
- It **pads the count** with framework tests, snapshots, and coverage-chasing straitjackets, because each is cheap to generate and passes instantly, and the count *looks* like rigor.
- It **never proves the suite can fail**, because green is already the reward — and, given the chance, it will edit a failing test until it passes rather than fix the code.

None of these reflexes is corrigible by asking the agent to be more careful; the reward gradient points the other way. So the disposition is structural: the boundary, the prune list, the keep-iff rule, and the prove-can-go-red demonstration must be **applied and gated**, not trusted. The judgment that cannot be outsourced — *is this mock honest, is this test worth keeping, has this suite been shown to catch anything* — is the human's; the agent supplies the green, you supply the proof of what turns it red.

---

## How findings route

- **Litmus / behavior-vs-structure** — whether an assertion is behavior or structure, the rewrite-internals test → [behavior-not-structure.md](behavior-not-structure.md). The keep-iff rule's second limb *is* that litmus, applied as a cut.
- **The right level for a kept test** — unit vs integration vs E2E, the trophy, where a kept test belongs → [test-levels.md](test-levels.md). "A red test that can't name a user-visible break is at the wrong level" routes here.
- **Why these procedures read the way they do** — the seven axes and the gate map → [the-membrane.md](the-membrane.md). Each what-NOT-to-test line traces to an axis (MEDIUM, STATE, SCOPE, ETHICS, MIND).
- **A stored derivative you found while pruning** is a state-architecture smell, not a test to write around — fix it upstream (`wellspring`). **A contract that isn't generated from a single source** is a `keel` finding — the mock can't be contract-true if the contract itself can drift.
- **The general testing craft** — risk-driven test selection, the test doubles, the general form of proving a suite can go red → the engineering suite's `assay`. `trials` is its frontend dialect; this doc owns the network-boundary mock, the frontend what-NOT-to-test list, the keep-iff cut, and the mutation proof, and does not re-teach the general craft.
- **Tests guard the known; monitoring guards the unknown** — the survivors hand off to `lookout`: a suite proven to catch known regressions before merge lets monitoring be aimed at the unknown after ([the-membrane.md](the-membrane.md)'s closing handoff).

---

**Cross-links:** [../SKILL.md](../SKILL.md) (STAGE 2 — Boundary, STAGE 3 — Prune, the two checks this file is the depth behind) · [the-membrane.md](the-membrane.md) (AXIS 2 the two graphs, AXIS 7 ethics — why the boundary and the prove-can-go-red read as they do) · [behavior-not-structure.md](behavior-not-structure.md) (the litmus the keep-iff rule applies) · [test-levels.md](test-levels.md) (the trophy — where a kept test lives, and the four-states-as-cases).

# The Testing Trophy — the level judgment table

This reference is the depth behind **STAGE 1 — Levels** of the [../SKILL.md](../SKILL.md) flight plan, and it governs one check: **`tested-at-the-right-level`**. STAGE 0 ([behavior-not-structure.md](behavior-not-structure.md)) settled *what* a test should be coupled to — observable behavior, not internal structure. This stage settles *where* each test goes, because a test coupled to behavior can still be at the wrong altitude: a pure-logic assertion dressed up as an E2E run, an integration concern shrunk into a unit, a journey that should have been one Playwright case sliced into forty component tests. Right coupling, wrong level, is still wasted budget — and worse, it spends the budget where the fewest bugs are.

The governing fact, inherited from [the-membrane.md](the-membrane.md) (AXIS 2 — THE TWO GRAPHS) and restated because every call below is judged against it:

> **Frontend bugs do not cluster in pure functions. They cluster at the seams — the front/back contract, hydration, the auth edge, the cache lifecycle — and in the *two-graph drift* between the component tree and the data-dependency DAG, the state that falls out of sync. So the right shape is a *testing trophy*, not the classic pyramid: a little static checking, the bulk in integration, a thin E2E cap, almost no unit. Spend the budget where the bugs are.**

A level is **a means, not an end.** "We have 90% unit coverage" describes effort, not protection; the question is never "how many tests at level X" but "does a red result at this level name a user-visible thing that broke?" If it can't, the test is at the wrong level — demote it, promote it, or cut it.

## Contents

- [The trophy, and why not the pyramid](#the-trophy-and-why-not-the-pyramid)
- [The level judgment table — the deliverable](#the-level-judgment-table--the-deliverable)
- [The six levels in depth](#the-six-levels-in-depth)
  - [Unit — the one place it truly shines](#unit--the-one-place-it-truly-shines)
  - [Integration / behavior — the bulk of the value](#integration--behavior--the-bulk-of-the-value)
  - [E2E — the thin, expensive cap](#e2e--the-thin-expensive-cap)
  - [The type system — the free tier](#the-type-system--the-free-tier)
  - [Visual regression — the eye you don't have](#visual-regression--the-eye-you-dont-have)
  - [Accessibility — the second render tree](#accessibility--the-second-render-tree)
- [Where the level call routes the four states](#where-the-level-call-routes-the-four-states)
- [The agent-era failure mode this stage counters](#the-agent-era-failure-mode-this-stage-counters)
- [When the level is unclear — PREDICATE / DEFAULT / FALLBACK](#when-the-level-is-unclear--predicate--default--fallback)
- [Where findings route](#where-findings-route)

---

## The trophy, and why not the pyramid

The classic test pyramid — a wide base of unit tests, a thin band of integration, a sliver of E2E — was correct for systems whose bugs lived **inside individual functions.** You put most tests at the unit level because that was where the logic, and therefore the failure, was.

A frontend inverts that premise. Its bugs are not in the functions; they are in the **wiring between them and the boundary they sit behind.** The component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG; the two rarely agree, and the bugs live exactly where they disagree — the two-graph drift, the stored derivative out of sync, the unhappy-path states ([the-membrane.md](the-membrane.md), AXIS 2). None of that is reachable from a pure-function unit test. So the mass moves to the middle, and the shape becomes a **trophy**, not a pyramid: a small base of static checking (types + lint), a fat middle of integration/behavior tests, a thin E2E cap, and a near-vestigial unit tier.

The two shapes differ on one premise. The **pyramid** assumes the bugs live inside functions, so its widest tier is unit and its static base is left implicit. The **trophy** assumes the bugs live at the seams and in the two-graph drift, so its widest tier is integration/behavior and it makes the static base explicit — types and lint catch a whole class of bugs for free. Misapply the pyramid to a UI and you get the worst of both: the budget is spent where the bugs aren't, and a refactor reddens a wall of structural unit tests.

Putting the bulk of the budget into unit tests of a UI is not "thorough" — it is spending the money where the fewest bugs are, and buying a wall of tests that pin the implementation you just wrote.

---

## The level judgment table — the deliverable

This is the executable core. For any test, find the row whose **what** matches, write it at that **level**, and confirm against the **criterion**. The criterion is the filter: if it doesn't hold, the row is wrong.

| What you are testing | Level | Criterion (it belongs here iff…) |
|---|---|---|
| Pure functions / derivations / complex algorithms (sort, format, **state-machine transitions**) | **Unit** | deterministic in → out, no IO, branchy. The *one* place unit tests truly shine. |
| A component's or feature's **user-visible behavior** (click what → see what; the four states) | **Integration / behavior** (a testing-library-class tool) | **most of the value lives here.** Test rendering and interaction; never touch internals. |
| Cross-page **critical journeys** (signup, checkout, login) | **E2E** (a Playwright-class tool) | revenue / auth / irreversible path only. Slow and costly — keep few. |
| Anything the **types guarantee** (illegal states, field spelling, the contract) | **Type system** (free) | don't write a test for it — let the compiler fail. |
| Did the UI **look** right | **Visual regression** (screenshot diff) | automated; catches *unintended* style drift the eye would catch. |
| **Accessibility** | axe in CI + a keyboard walkthrough of critical paths | a CI gate, not a one-off audit. |

Two reading notes on the table:

- **The criterion column does the work, not the what column.** A "complex algorithm" that reaches into the network is not a unit test — the IO disqualifies the row; it is integration. A "user-visible behavior" you can only check by asserting an internal field has no integration form — it is mis-specified behavior, kick it back to STAGE 0. The level follows the criterion, not the loose category.
- **The mass is in row 2.** Rows 1, 3, 4, 5, 6 are each *thin*. If your suite's center of gravity is anywhere but row 2, the shape is wrong.

---

## The six levels in depth

### Unit — the one place it truly shines

A unit test earns its place only when the thing under test is **deterministic input → output, with no IO, and enough branches that the cases matter.** That is a narrow target in a frontend, and it is the *right* narrow target: a currency formatter, a sort comparator, a date-range calculation, a discount rule, a reducer's pure transition function.

The highest-value unit tests in the whole suite are **state-machine transitions** — an explicit `status: 'idle' | 'submitting' | 'success' | 'error'` machine (a tangle of `isLoading`/`isError`/`isSubmitting` booleans collapsed into one union plus a transition table). Those transitions are pure functions of (state, event) → state with no IO, the table is finite and branchy, and a wrong transition is a real bug. This is the rare genuine unit test a frontend offers: where an earlier stage already extracted such a machine ([../SKILL.md](../SKILL.md), the `wellspring` handoff), the test is handed to you — you don't invent it.

What does **not** belong at unit, even though the agent will put it there: a component's rendering (that's row 2), pass-through glue with no logic to protect (test nothing), or anything that needs a mock to run (the mock is the tell — you're at the wrong level).

### Integration / behavior — the bulk of the value

This is where the trophy is fat, because this is where the bugs are. With a testing-library-class tool you render the real component (real state, real logic, real wiring) and drive it the way a user does — query by what a user perceives (role, label, text), interact, assert on the rendered result. *"After typing a query and the response arrives, the list shows the three matching rows"* is an integration/behavior test; it survives any internal rewrite and reddens only on a real regression.

The non-negotiable discipline here: **test rendering and interaction, never internals.** The moment an assertion names a state variable, a render count, or a private call, you have a structural test wearing an integration costume — send it back to STAGE 0. The honest integration test exercises the **component + state + logic** integration end to end and fakes only the network (STAGE 2 / [mocking-and-pruning.md](mocking-and-pruning.md)) — mock at the module boundary instead and you have replaced the very integration where the bugs live with stubs, leaving a green test over nothing.

### E2E — the thin, expensive cap

A Playwright-class browser-driven test runs the *real* stack across pages. It is the only level that catches cross-page, cross-system journey breaks — but it is slow, flaky-prone, and expensive to maintain, so it is rationed hard. **Reserve E2E for revenue / auth / irreversible paths only:** signup, login, checkout, the payment confirmation, the "delete account" that can't be undone. These are the journeys where a silent break costs real money or real trust, which is exactly what justifies the cost of an E2E.

Everything else — the loading spinner, the empty-state CTA, the form validation message — is an integration test, not an E2E. The agent, given the chance, will write E2E for everything (it *looks* like maximum rigor); the result is a suite so slow and flaky that people stop running it, and a suite no one runs guards nothing. The DEFAULT when unsure whether a path is E2E-worthy: *it is not* — write it as integration unless it is demonstrably revenue/auth/irreversible.

### The type system — the free tier

The base of the trophy includes a tier that costs zero test code: **anything the types already guarantee, you do not test.** Field spelling, the front/back contract shape, the closed union that makes an illegal state unrepresentable (can the UI be `isLoading` *and* `isError` at once? — if the type allows it, you didn't model it) — these are proven by the compiler, not asserted by a test. Writing a runtime test for what the type system rejects at compile time is a straitjacket on trivial code, and it is exactly what chasing 100% coverage forces you to do.

So before writing any assertion, ask: *can a type make this case impossible instead?* If yes, that is the cheaper, stronger move, and it routes out to the type layer (`gauge` / `keel`), not into the test file.

### Visual regression — the eye you don't have

The agent cannot *see* the rendered screen, so it tends to "test styling" by asserting on class names and computed-style internals — which pins the scoping mechanism, reddens on any restyle, and catches no real regression (the membrane's SCOPE axis). The honest level for "did it *look* right" is a **screenshot diff**: render the component to an image, compare against an approved baseline, flag the unintended drift a human eye would catch. This is a real tier of the trophy — a thin one — not a unit test of CSS. Behavior tests stay on what a user observes (text, roles, state); style-drift risk goes here.

### Accessibility — the second render tree

Accessibility is not an after-the-fact audit; it is a CI gate, because it is the *second render tree* — the semantic / assistive-technology tree ([the-membrane.md](the-membrane.md)) — that must stay correct as the visual one changes. Two complementary instruments: an **axe-class automated check** in CI (catches the mechanical failures — missing labels, contrast, ARIA misuse) and a **keyboard walkthrough of critical paths** (catches what automation can't — focus order, trap, operability). Automated a11y is necessary and insufficient; the keyboard walk is the part that needs a human, and on critical journeys it is not optional.

---

## Where the level call routes the four states

This section stays inside the level question — *which tier each test sits in* — and shows the one place a whole set of tests lands on the same row.

**The four states all route to one level: integration.** Where an earlier stage built the unhappy paths explicitly — loading / error / empty / edge as first-class slices, not TODOs (the `seaworthy` handoff named in [../SKILL.md](../SKILL.md)) — the level call is already made for you: each slice gets **one behavior test per state, all at the integration level**, because each is user-observable rendering, never a pure-function in→out.

| The state | Assert (user-observable)… | Level |
|---|---|---|
| pending / never-resolving | the skeleton / loading UI renders | integration |
| error | the error UI shows **and the user's input is still there** | integration |
| empty | the empty-state CTA renders | integration |
| data | the content renders | integration |

Finite and concrete — and every row lands on integration, which is the level point: these are not four different tiers, they are four scenarios of the same one. (The *cases themselves* — what to feed, what to assert — come from STAGE 0 / the litmus; the *network mock* that feeds them is the boundary stage's, [mocking-and-pruning.md](mocking-and-pruning.md).)

**Two seam bugs that show why the level, not the assertion shape, is the call.** Both are user-visible, so both are integration tests — and the agent's instinct to test them by render count or internal key is the wrong-level error in miniature:

- **Index-as-key reorder bug.** The classic "array index as `key`" bug is an *identity* error: the DOM state lands on the wrong row after a reorder. The level is integration; test it as behavior — render the list, focus an input (or open a menu, or select a row), reorder, and assert the focus/selection **stays attached to the right item.** Asserting "this re-rendered N times" or "the key was recomputed" drops to the wrong level and catches nothing a user feels.
- **Out-of-order response race.** Fire two requests where the slow one resolves last and assert **the latest data wins, not the stale one.** The symptom is user-visible (wrong data on screen), so the level is integration and the assertion is on the screen, never on a render count or a stale closure's internals.

(A stored derivative synced by an effect is the agent's reflex to write a test for — but that is a *what-NOT-to-test* call, not a level call: it routes to STAGE 3 / [mocking-and-pruning.md](mocking-and-pruning.md), which owns the pruning of tests that protect a copy that should never have existed.)

---

## The agent-era failure mode this stage counters

The agent is reward-shaped for green, and the cheapest green is **a wall of unit tests pinned to the code it just wrote.** Unit tests are trivial to generate, they pass instantly, and they assert on exactly the internals the agent has in hand — so left to itself the agent builds the pyramid, not the trophy, and builds it inverted: heavy at the bottom (unit), light in the middle (integration), spending the entire budget where the fewest frontend bugs are. It compounds this two ways: it writes **E2E for everything** when it wants to look rigorous (yielding a slow, flaky suite people skip), and it writes **runtime tests for what the type system already proves** while chasing a coverage number (yielding straitjackets on trivial code). None of this is felt as a cost by the agent — it pays no maintenance, feels no 3-a.m. debugging, sees only the green.

This is why the level is **GATED**, not trusted. The agent can produce a green suite of any shape; the call it cannot make — and the one this stage forces a human to make — is *whether the suite's mass sits where the bugs actually live.* A passing suite shaped like a pyramid is a suite that will let the integration bugs through and redden on every refactor.

---

## When the level is unclear — PREDICATE / DEFAULT / FALLBACK

For genuinely ambiguous calls, don't guess silently — apply the router:

- **Unit or integration?** **PREDICATE:** is it deterministic in → out with no IO, no rendering, no mock needed? Yes → unit. No (it renders, wires, or needs a mock) → integration. **DEFAULT** on a coin-flip: integration — it exercises more of the real wiring. **FALLBACK** if you can't tell: name the user-visible thing that breaks when it reddens; if you can name one, it's behavior → integration; if you can't, it's testing internals → it goes to STAGE 0 to be rewritten or cut.
- **Integration or E2E?** **PREDICATE:** is this a cross-page journey on a revenue / auth / irreversible path? Yes → E2E. No → integration. **DEFAULT:** integration (E2E is the rationed, expensive tier — earn it). **FALLBACK:** this is a *risk-appetite* call the user owns — is this path worth the cost and flakiness of an E2E? Surface it; don't spend the E2E budget on the user's behalf.
- **Test it at all, or let a type / a tool guarantee it?** **PREDICATE:** can a type make the bad case unrepresentable, or does a library/framework already own this behavior? Yes → don't test it (route to `gauge`/`keel`, or drop it). **DEFAULT:** prefer the compiler over the test. **FALLBACK:** if it's a real behavior no type can encode, write it at the level its bug lives — which is almost always integration.

The asymmetry that governs all three: **a missing test costs a regression you might still catch in monitoring after; a test at the wrong level costs every future change** — an inverted pyramid reddens on every refactor and misses the seam bugs, and a suite of E2E gets skipped for being slow. When the call is a toss-up, err toward *fewer* tests, *lower-altitude where the bug lives*, pushed into the integration middle — not more tests scattered up and down the trophy.

---

## Where findings route

`tested-at-the-right-level` is a routing stage; it hands findings on to its neighbors and siblings rather than resolving everything itself:

- A test that's at the right level but **asserts structure** → back to STAGE 0 / [behavior-not-structure.md](behavior-not-structure.md) (the litmus). Level and coupling are orthogonal; this stage owns level.
- An integration test that needs a **mock** → forward to STAGE 2 / [mocking-and-pruning.md](mocking-and-pruning.md): mock the network boundary, schema-backed, never the module under test.
- A test that's at no useful level (framework behavior, pass-through glue, a stored derivative, a re-test of a type guarantee) → forward to STAGE 3 / [mocking-and-pruning.md](mocking-and-pruning.md) (the pruning section + the keep-a-test-iff rule). This stage flags "no level fits"; *prune* makes the cut and proves the survivors can go red.
- A case better made impossible than tested → out to `gauge` / `keel` (the type layer, the contract). The free tier of the trophy is the type system; closing a hole there is cheaper than any test.
- A genuine **risk-appetite** call (is this path worth an E2E, is this gap a risk we accept) → out to the user, in their language. The litmus and the table settle the mechanics; taste and risk appetite settle the rest.

The exit standard this stage serves (from [../SKILL.md](../SKILL.md)): the suite's mass sits in integration, the four states are covered as scenarios, the critical journeys have a thin E2E backstop, the type system carries the illegal states for free, and **a red result at any level names a user-visible thing that broke.** A red test that can't tell you "a user can no longer do X" is, by definition, at the wrong level.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 2 — THE TWO GRAPHS, *why* the trophy not the pyramid; AXIS 3 STATE, AXIS 4 SCOPE, AXIS 6 IDENTITY for the level-specific calls) · [behavior-not-structure.md](behavior-not-structure.md) (STAGE 0 — the coupling litmus that runs before this level call) · [mocking-and-pruning.md](mocking-and-pruning.md) (STAGE 2 the network-boundary mock, STAGE 3 the what-NOT-to-test list and keep-iff rule) · [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves, STAGE 1 — Levels).

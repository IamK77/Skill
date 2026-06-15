# Behavior, Not Structure — the litmus that separates a net from a shackle

This reference is the depth behind **STAGE 0 — Behavior** of the [../SKILL.md](../SKILL.md) flight plan, the first and load-bearing stage of `shakedown`. It governs one check: **`behavior-not-structure-tested`** — every test settled against the one question before any other call about it is made.

It is the engine the rest of the skill bolts onto. [test-levels.md](test-levels.md) decides *where* a behavior test should live (the trophy); [mocking-and-pruning.md](mocking-and-pruning.md) decides *what to fake* and *what to cut*. Both presuppose the call this doc owns: **is this assertion coupled to behavior, or to structure?** Get that wrong and a perfectly-placed, perfectly-mocked test is still a shackle.

The governing fact, inherited from [the-membrane.md](the-membrane.md) (AXIS 1 — MIND) and restated because every call below is judged against it:

> **A frontend has no formal spec. Its correctness benchmark is a user — observable behavior — not an internal structure. So a test welded to the implementation is testing the one thing that is *allowed to change*, and taste is load-bearing here in a way it is not for a compiler.**

## Contents

- [The one question, and why it decides everything](#the-one-question-and-why-it-decides-everything)
- [The rewrite-internals litmus — the executable check](#the-rewrite-internals-litmus--the-executable-check)
- [Behavior vs internal — the two-column table you assert from](#behavior-vs-internal--the-two-column-table-you-assert-from)
- [The classic straitjackets, and the good-test rewrite](#the-classic-straitjackets-and-the-good-test-rewrite)
- [The agent-era failure mode this stage exists to gate](#the-agent-era-failure-mode-this-stage-exists-to-gate)
- [When the call is genuinely ambiguous](#when-the-call-is-genuinely-ambiguous)
- [Where findings route](#where-findings-route)

---

## The one question, and why it decides everything

Everything in `shakedown` is one sentence expanded. Before you write or judge a test, settle what it is coupled to by asking:

> **Does this test go red when the *behavior* changes, or when the *implementation* changes?**

Two outcomes, and they are not symmetric:

- **Reddens only on a behavior change → a safety net (the umbrella).** It lets you refactor with confidence and screams when a real regression slips in. This is the test you want.
- **Reddens on an implementation change while behavior holds → a straitjacket (the shackle).** Every refactor turns it red for nothing, so you spend your time fixing *tests* instead of *code* — and, worse, **you learn to ignore red.** The moment a team trains itself to wave through a red suite, the suite is dead: it can no longer tell you anything, because its red is noise. A straitjacket does not merely fail to help; it actively destroys the value of every honest test next to it.

That asymmetry is why this is the *first* gate and why it is non-negotiable. The cost of a missing test is a regression you may still catch in review or monitoring. The cost of a straitjacket is the whole suite's credibility. When in doubt, the cheaper mistake is *fewer* tests, at the behavior level — never *more* tests that pin the implementation.

---

## The rewrite-internals litmus — the executable check

The one question becomes executable as a single thought experiment you run on every test:

> **If I rewrote this unit's internals but kept its observable behavior identical, would this test still pass?**

| Outcome of the rewrite | Verdict | Disposition |
|---|---|---|
| Still green | It tests **behavior** | Keep it |
| Goes red | It tests **structure** | Rewrite it to assert an observable outcome, or delete it |

The litmus is not a metaphor you can hand-wave — it has a *real, runnable* counterpart, and it is also the FINAL-GATE exit criterion: **actually perform a behavior-preserving refactor** (rename the state variables, swap `useState` for `useReducer`, extract a hook, re-shape the internal data) **and watch the suite.** A suite that stays green through a real internal rewrite has *proven* it tests behavior; a suite that lights up red has just shown you exactly which assertions are shackles. This is the same move as the `prune` stage's "prove the suite can go red," run in the opposite direction: there you mutate behavior and demand red; here you preserve behavior and demand green. A good suite passes both.

> **PREDICATE:** can you name an internal you'd change in a plausible refactor that this test would catch?
> **DEFAULT (coin-flip):** assume yes and rewrite the assertion toward the observable outcome — the structural coupling is the more common and more expensive mistake.
> **FALLBACK (can't tell):** run the litmus literally — do the rewrite in a scratch branch and look. The compiler-of-last-resort here is *doing the experiment*, not reasoning about it.

---

## Behavior vs internal — the two-column table you assert from

The litmus only works if "behavior" and "internal" are concrete. They are. **Behavior is what a *consumer* can observe; internal is everything the consumer cannot see.** The consumer is a user for a component or feature, and a calling module for a unit — the definition generalizes, which is why the same litmus works at every level of the trophy.

| | **BEHAVIOR — assert this** | **INTERNAL — never assert this** |
|---|---|---|
| **What it is** | What a user or a module's consumer observes: given this input/interaction → this rendered result, return value, or effect on the world | The mechanism that produces it — invisible to the consumer |
| **Frontend examples** | The rendered text/role/state on screen; navigation that happened; a request that fired with a given payload; the focused element after a reorder; which data won a race | The name of a state variable; `useReducer`-vs-`useState`; how many times it rendered; that a private function or a specific hook was called; the internal data shape; the CSS class names; the serialized component tree |
| **The test reads like** | "after clicking +, the screen shows 3"; "after submitting an empty form, the screen shows the validation error and keeps the typed text" | "internal `count` is 3"; "`recompute()` was called twice"; "this matches the stored snapshot" |
| **Survives a behavior-preserving rewrite?** | Yes — that is what makes it a net | No — it reddens the instant you touch the mechanism |

The boundary line is exactly the membrane: **behavior is what crosses the interface to the consumer; internal is what stays on your side of it.** A render count never crosses to the user. The on-screen "3" does. Assert what crosses.

Two refinements worth internalizing:

- **A side effect on the world is behavior, even though no pixel shows it.** "A `POST /orders` fired with this body" is consumer-observable at the network seam and is fair game — assert *that the request happened with that shape*, not *that an internal `submit()` was invoked.* The honest place to observe it is the network boundary (see [mocking-and-pruning.md](mocking-and-pruning.md)).
- **Styling is observed by an eye, not by a class name.** Asserting `className === "btn-primary"` pins the scoping mechanism and reddens on any restyle while the screen looks identical. The observable here is *visual*, so it routes to visual-regression, not to a string assertion (the membrane's SCOPE axis).

---

## The classic straitjackets, and the good-test rewrite

Three structural-coupling patterns recur so often they are worth naming and rejecting on sight. Each one passes *now* — which is exactly why it gets written — and shackles every future change.

**Straitjacket 1 — asserting internal state.**

```js
// BAD — pins the variable name and the fact that it's stored at all
expect(wrapper.state("count")).toBe(3)
// the moment you rename `count`, derive it, or lift it, this reddens — behavior unchanged
```
```js
// GOOD — asserts what the user sees; survives any internal rewrite
await userEvent.click(screen.getByRole("button", { name: "+" }))
expect(screen.getByText("3")).toBeInTheDocument()
```

**Straitjacket 2 — asserting a private call.**

```js
// BAD — pins the existence and signature of an internal function
expect(recomputeFilteredList).toHaveBeenCalledWith(query)
// inline that function, memoize it, or compute the list differently — red, behavior unchanged
```
```js
// GOOD — asserts the observable result of the filter, not how it was computed
await userEvent.type(screen.getByRole("searchbox"), "shoes")
expect(screen.getAllByRole("listitem")).toHaveLength(2)
```
This is the *filtered-list* case from the suite's spine: `wellspring` teaches you not to *store* the derived `filteredList` at all (it should be `filter(list, query)`, computed on the fly). The structural test makes that smell permanent — it asserts the derivation *function* exists, so you can't delete the stored copy without reddening the suite. The behavior test asserts the *visible filtered result*, and stays green whether the list is stored, derived, memoized, or moved to the server.

**Straitjacket 3 — the whole-tree snapshot.**

```js
// BAD — serializes the entire rendered tree; reddens on any markup change,
// nobody reviews the diff, and it rots into reflexive "update the snapshot"
expect(render(<OrderStatus order={order} />)).toMatchSnapshot()
```
```js
// GOOD — assert the specific observable outcome that actually matters
render(<OrderStatus order={shippedOrder} />)
expect(screen.getByText("Shipped")).toBeInTheDocument()
expect(screen.getByRole("link", { name: "Track package" })).toBeInTheDocument()
```
A big snapshot is the purest structural test: it pins *every* implementation detail at once, so *every* refactor reddens it, and because no human reads a 200-line serialized-DOM diff, the reflexive fix is to re-bless it — which means it catches nothing on purpose. The order-status example shows the cure: name the two or three things a user actually relies on (the status label, the action that status enables) and assert exactly those.

The common shape across all three: **the bad version names a mechanism (`count`, `recomputeFilteredList`, the tree); the good version names an observable (the text "3", two list items, the "Shipped" label).** If you can rewrite the assertion to talk about what a user or caller observes and it still expresses the thing you care about, you had a structural test.

---

## The agent-era failure mode this stage exists to gate

A human who wrote both the code *and* the tests felt the cost of a brittle suite directly: the next refactor reddened it, they paid to fix it, and that friction pulled them toward asserting on outputs rather than internals. The friction was the governor.

The agent has no such governor, and three habits follow:

- **Its reward is green, and the shortest path to green is a test welded to the code it just wrote.** Asserting internal state, a render count, that a private function was called — these pass *immediately* because they describe the implementation that exists right now. The agent feels none of the future cost of a suite that reddens on every refactor, so it reaches for the structural assertion by default. **A green suite the agent produced is therefore evidence of nothing until you know what turns it red.**
- **Given the chance, it will edit the test to make it pass** rather than fix the code — the structural test it wrote is the easiest thing in the repo to "satisfy."
- **It mistakes coverage and snapshots for rigor.** A wall of big snapshot tests and a 100% line number *look* like diligence and are mostly straitjackets.

This is why `behavior-not-structure-tested` must be *applied and gated*, not trusted. The judgment — is this assertion behavior or structure — is exactly the call that cannot be delegated to the thing optimizing for the green checkmark, because the structural assertion is *easier* for it and pays the same reward. The human keeps the call the agent cannot make: **whether a passing suite actually protects behavior, or just pins the current implementation.** The mechanical half (write the test bodies, run the litmus refactor, list every assertion that touches an internal) is exactly the work to hand the agent; the verdict on each one stays with you.

---

## When the call is genuinely ambiguous

Most assertions sort cleanly into the two columns. When one doesn't — is this behavior or internal? — do not guess silently; resolve it with one more probe before falling back:

> **Name the user-visible thing that breaks when this test goes red.**
> - If you *can* name it ("a user can no longer see the shipped status") → it's behavior; keep it, and make sure it's written at the level where that thing is observable.
> - If you *cannot* name it ("uh, `recompute` wasn't called") → it tests structure, or it tests nothing. Rewrite it toward the observable, or cut it.

This probe is the same instrument used at the `prune` stage's keep-iff rule and at the membrane's escalation ladder: **a red test that can't tell you which user-visible thing just broke is at the wrong level.** A render-count assertion fails the probe instantly — nobody can name a user-visible breakage that "rendered 3 times instead of 2" corresponds to — which is precisely why it's a straitjacket.

Genuinely two-sided calls (is the fired network request "behavior" worth asserting, or implementation detail?) are settled by *who observes it*: if a downstream consumer — the server, another module, the user — can observe it, it's behavior. If only this unit's own internals can, it's structure.

---

## Where findings route

This stage produces dispositions, not just a list — a finding with no disposition is the agent's "I made the audit, so I'm done" failure:

- **A structural assertion you can rewrite toward the observable** → rewrite it here; that is the stage's own work.
- **A test that pins a stored derivative or a private call you should delete** → the *test* is the symptom; the *cause* is a `wellspring` state smell (derived state stored, not computed). Fix the smell, then the behavior test falls out naturally. Route the smell to `wellspring`; keep the behavior test here.
- **An assertion on class names / scoping mechanism** → re-aim it at visual-regression (the SCOPE axis), routed through [test-levels.md](test-levels.md).
- **A test that's behavior but at the wrong level** → it survives the litmus but can't name the user-visible breakage at its current level → hand it to [test-levels.md](test-levels.md) to re-place on the trophy.
- **A mock the test asserts against instead of real behavior** → that's a boundary problem; route to [mocking-and-pruning.md](mocking-and-pruning.md).

Once every test is settled against the one question, clear the gate:

```
checklist check behavior behavior-not-structure-tested
checklist verify behavior
```

Then advance to **LEVELS** — [test-levels.md](test-levels.md) — to put each surviving behavior test where its bug actually lives.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 1 — MIND, *why* the spec is observable behavior; the escalation ladder this doc's ambiguity probe feeds) · [test-levels.md](test-levels.md) (the trophy — where a behavior test belongs) · [mocking-and-pruning.md](mocking-and-pruning.md) (the network-boundary mock, the keep-iff rule, proving the suite can go red — the inverse of this doc's litmus) · [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves; STAGE 0 — Behavior).

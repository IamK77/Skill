# Accessibility & the Performance Budget — the second render tree and the number CI enforces

This reference is the depth behind two stages of the [../SKILL.md](../SKILL.md) flight plan: **STAGE 2 — Reach** (the check **`accessibility-built-in`**) and **STAGE 3 — Budget** (the check **`performance-budget-enforced`**). The two share a file because they share a single agent-era failure: both live in a place the agent **cannot perceive** — one in a human's hands and eyes, the other in a human's nervous-system clock — so neither can be left to the agent's judgment, and both must be turned into a *gate*. The slice doesn't pass because it "looks accessible" or "feels fast"; it passes because the keyboard walk completed and the CI number is green.

Open [the-membrane.md](the-membrane.md) alongside this — the **MEDIUM axis (Axis 6)** is the root of accessibility (the platform ships a whole second render tree for free; re-implementing it badly is the SPA tax) and the **MIND axis (Axis 1)** is the root of the budget (the perception thresholds are hard neurophysiological constants, not SLAs). This file is *how to execute* those two cards; the membrane is *why they read the way they do*.

The governing fact, inherited from the membrane and restated because every call below is judged against it:

> **The frontend's correctness spec for "usable" and "fast" does not live in any document — it lives in a human's hands, eyes, and nervous system, which the agent does not have. So "I can use it" and "it feels fast" are not findings the agent can produce; they must be replaced by an *executable check* (unplug the mouse) and a *hard number* (INP/LCP/CLS/bundle, red-on-regression), or they will silently rot to broken.**

## Contents

- [The agent-era failure this counters](#the-agent-era-failure-this-counters)
- [Part A — Accessibility, built in (the `accessibility-built-in` gate)](#part-a--accessibility-built-in-the-accessibility-built-in-gate)
  - [The ladder — semantics first, ARIA last](#the-ladder--semantics-first-aria-last)
  - [The executable check — unplug the mouse](#the-executable-check--unplug-the-mouse)
  - [Focus management — where does focus go?](#focus-management--where-does-focus-go)
  - [Worked example — the order-status control](#worked-example--the-order-status-control)
  - [Make it a gate](#make-it-a-gate)
- [Part B — The performance budget as hard CI numbers (the `performance-budget-enforced` gate)](#part-b--the-performance-budget-as-hard-ci-numbers-the-performance-budget-enforced-gate)
  - [The numbers, and what they measure](#the-numbers-and-what-they-measure)
  - [The high-leverage moves](#the-high-leverage-moves)
  - [Worked example — the filtered list](#worked-example--the-filtered-list)
  - [Lab vs field, and the regression-in-the-PR rule](#lab-vs-field-and-the-regression-in-the-pr-rule)
- [When the call is genuinely ambiguous](#when-the-call-is-genuinely-ambiguous)
- [How findings route to siblings](#how-findings-route-to-siblings)

---

## The agent-era failure this counters

Both halves of this file exist because of one structural blindness, named on the MIND and MEDIUM axes of [the-membrane.md](the-membrane.md):

- **The agent cannot be a keyboard-only or screen-reader user.** It has no hands to take off a mouse and no screen reader narrating its DOM. So it reaches for `<div role="button" tabindex=0 onKeyDown=...>` over a real `<button>`, never moves focus after a route change or a modal open, and leaves accessibility for "later" — because *none of it turns the happy-path test red.* The second render tree (the accessibility tree, the keyboard model) is invisible to the thing writing the code, and a thing that can't perceive a tree won't maintain it.
- **The agent has no perception clock.** A spinner that flashes for 50ms, a list that re-sorts on every keystroke, a layout that jumps when the skeleton and content differ — all read identically to the agent: *the test passed.* "Feels fast" lives in a nervous system it has no access to, so it ships a perf regression green and feels nothing.

The human-era author *felt* both: the wince at tabbing into a trap, the jank of a janky scroll. That felt sense was the governor. The agent has no governor here — so the governor must become **a check you run and a number CI enforces.** Accessibility is "later" forever (and costs several times more to retrofit) unless it is gated per slice; performance is "optimize later" forever (and costs ~10× when it does) unless the build goes red in the PR that caused the regression. **Neither is polish. Both are the product, and both must be structure, not discipline.**

---

## Part A — Accessibility, built in (the `accessibility-built-in` gate)

Accessibility is **the second render tree**, present from the first slice — not a final retrofit pass. Retrofitting costs several times what building-in does, and it is an inclusion/ethics issue, not merely a technical one: a user navigating by keyboard or screen reader is a user, and a key path they can't complete is a door shut in their face. The discipline is built from one ladder, one executable check, and one focus rule, then made a gate.

### The ladder — semantics first, ARIA last

Accessibility is overwhelmingly *free* if you start from semantic HTML, and overwhelmingly *expensive and fragile* if you don't. The order is not a preference; it is a cost gradient. Climb only as far as you must:

| Rung | What it is | When to use it | The cost of skipping to the next rung |
|---|---|---|---|
| **1. Native semantic element** | `<button>`, `<a href>`, `<nav>`, `<input>`, `<label>`, `<dialog>`, a real heading hierarchy | **Always, by default.** The element *is* the accessibility — focusability, keyboard activation, role, and state come for free and stay correct. | — |
| **2. Native + a little ARIA state** | a real `<button aria-pressed>`, `<input aria-invalid>` — native element, ARIA only to express *state the element can't* | When a native element is the right control but has a state HTML has no attribute for. | You re-implement what the element gave you, worse. |
| **3. ARIA pattern from scratch** | `role`, `tabindex`, `aria-*`, hand-rolled `onKeyDown` | **Only when no native element can express the widget at all** (a custom combobox, a tree grid, a draggable reorder). | You own the entire keyboard model, focus model, and role contract by hand — and will get one wrong. |

> **The rule, stated as the membrane states it: a real `<button>` beats `<div role="button" tabindex=0 onKeyDown=...>` every time.** ARIA is a *means of last resort*, not a default — it does not add behavior, it only *describes* behavior you must then implement yourself. The agent reaches for the `<div>` because it can style it freely and the happy-path click test passes; it has not felt the keyboard user who can't reach it, the screen reader that announces nothing, or the `Enter`/`Space` activation it forgot. **The finding is: a non-native interactive element where a native one exists. The fix is: drop down the ladder.**

### The executable check — unplug the mouse

This is the heart of the gate, and it is *executable* precisely because "it's accessible" is not a judgment the agent can make but "the keyboard completed the path" is a fact anyone (or any harness) can observe:

> **Unplug the mouse. Complete the slice's key path with the keyboard alone. If you can't, it's broken.**

Run it **per slice**, not as a final sweep — because retrofitting a whole app's keyboard reachability at the end costs several times what doing it slice-by-slice costs, and the final sweep is the pass that never gets the time. The walk surfaces, in one pass, the whole family of defects the agent leaves: an interactive element that can't be focused (it wasn't a real control), a focus order that doesn't match the visual order, a focus *trap* with no escape, an action reachable only by hover or click, a modal you can tab *behind*. Each is invisible to a passing happy-path test and obvious within ten seconds of the keyboard walk.

### Focus management — where does focus go?

The single most-skipped piece, because focus is a stateful thing that lives across renders and the agent reasons one render at a time. After **any** moment that reshapes the page — a route change, a modal open, an async completion that swaps content — you must *decide where focus goes*, and the decision must be explicit:

| Moment | Where focus must go |
|---|---|
| Modal / dialog **opens** | moves **into** the dialog and is **trapped** there (Tab cycles within it) |
| Modal / dialog **closes** | **returns to the trigger** that opened it (not lost to `<body>`) |
| Route change (SPA navigation) | moves to the new view's heading or main region (the browser did this for free on a full page load; the SPA must re-create it) |
| Async completion that replaces a region | to the new content, or announced — focus must not vanish into nothing |

The failure tell is *focus lost to `<body>`*: the user tabs and the next stop is the top of the page, their place gone. The agent never sees it because focus is invisible to a render-snapshot test. **The finding is: a focus-reshaping moment with no decided focus destination. The fix is: name the destination and move focus there.**

### Worked example — the order-status control

A slice shows an order's status and lets the user advance it. The agent writes the happy path:

```jsx
// agent's version — passes the click test, fails the keyboard walk
<div className="status-pill" onClick={() => advance(order.id)}>
  {order.status}
</div>
```

Run the executable check — unplug the mouse — and it falls at every rung: a `<div>` is not focusable (Tab skips it), `Enter`/`Space` do nothing, a screen reader announces a generic group, not a control with a state. The fix is not to bolt three ARIA attributes onto the `<div>` (rung 3 reinventing rung 1); it is to **drop to the native element**:

```jsx
// built-in version — focusable, keyboard-activable, announced, all for free
<button className="status-pill" onClick={() => advance(order.id)}>
  Advance order — currently {order.status}
</button>
```

The `<button>` is in the tab order, responds to `Enter` and `Space`, announces as a button with an intelligible name, and shows a focus ring — none of which the author wrote. That is the ladder paying off: the accessible version is *less* code than the inaccessible one. (Only if the control were genuinely un-expressible by any native element — say a multi-thumb range with custom drag — would you climb to rung 3 and own the keyboard model by hand.)

### Make it a gate

Discipline doesn't survive a deadline; structure does. Two mechanisms, both cheap:

1. **An automated checker in CI.** An axe-style checker (run in the test harness or against a preview deploy) catches the mechanical, machine-checkable subset — missing labels, color-contrast failures, a `<div>` with a click handler and no role, broken heading order. **DEFAULT:** wire it as a build-failing gate, not an advisory warning, on the key-path components. It is a floor, not a ceiling: it cannot judge whether focus order *makes sense*, only that labels exist.
2. **A key-path keyboard-walkthrough line on the PR checklist.** The axe checker cannot run the unplug-the-mouse walk — that needs a hands-and-eyes pass — so the PR carries an explicit line: *"completed the key path with the keyboard alone."* This is the human-judgment half that the automated checker structurally can't cover.

> Why *both*: the checker catches what's mechanically detectable and the agent omits; the keyboard line catches what only a human walk reveals (a sensible focus order, no traps, every action reachable). Either alone has a hole the other plugs.

---

## Part B — The performance budget as hard CI numbers (the `performance-budget-enforced` gate)

"Feels fast" is a perception, and perception lives in a nervous system the agent cannot read. So the *only* way to make it survive an agent writing the code is to translate it into **numbers a machine checks and a build enforces** — because "optimize later" never happens, and when it finally does it costs roughly 10× and no one remembers which change caused the regression. This is the perception contract from the suite's upstream work (`bearings`'s perception thresholds — ~100ms reads as "I touched it directly," ~1s as "it's working," ~10s as "my attention is gone") expressed as the literal numbers CI can fail a build on.

### The numbers, and what they measure

Set numeric budgets per route and gate them. These are not arbitrary engineering targets; they are the perception thresholds written as numbers — psychophysics encoded:

| Budget | Threshold | What it measures (the perception it stands for) |
|---|---|---|
| **INP** (Interaction to Next Paint) | **< 200ms** | how long after a tap/click/keypress the UI visibly responds — the "did I touch it directly?" feel; the gap between an interaction and its acknowledgement against the perception threshold |
| **LCP** (Largest Contentful Paint) | **< 2.5s** | how long until the main content is on screen — "the page is here," not a blank or a spinner |
| **CLS** (Cumulative Layout Shift) | **< 0.1** | how much the layout *jumps* after first paint — the maddening shift where content moves as you reach for it (the skeleton-dimension-mismatch failure) |
| **Bundle size** | **a per-route budget** | the bytes shipped for a route — the upstream cause of slow LCP and slow INP; a budget here catches the regression before it becomes a Vitals regression |

> **The point is the gate, not the number.** Pick the numbers to fit the product's perception contract (a data-dense internal tool tolerates a slower LCP than a public landing page), but *commit them* and make the build go red when a route exceeds them. A budget that warns but doesn't fail is a budget the agent will blow past green.

### The high-leverage moves

These are the concrete techniques that keep the numbers green; each maps to a specific budget, and each is a thing the agent omits because it can't feel the cost:

| Move | Protects | Why the agent skips it |
|---|---|---|
| **Don't blank the screen on refetch** — keep old data + an unobtrusive indicator (stale-while-revalidate); distinguish first-load (skeleton) from background-refresh | perceived performance | a blank-then-fill passes the data-case test; the agent never feels the flash-of-nothing |
| **Match skeleton dimensions to final content** | **CLS** | the skeleton renders, the content renders; both pass — the *jump between them* is invisible to a snapshot test |
| **Code-split by route** | bundle size, LCP | the agent imports everything at the top; one big bundle "works" |
| **Lazy-load below the fold** | bundle size, LCP | offscreen content loads fine eagerly — the cost is only in the metric |
| **Keep a single interaction's main-thread work under ~50ms** | **INP** | a synchronous sort/filter/format on every keystroke "works" — until the list is large and the thread jams |
| **Push heavy work to a web worker, or chunk it** | **INP** | a long synchronous computation produces the right answer; it just freezes the UI while doing it |

The ~50ms main-thread budget is the one most worth internalizing: a single interaction that ties up the main thread longer than that *is* a janky interaction, no matter how correct its output, because the user's input has nowhere to land while the thread is busy. (This connects to [four-states.md](four-states.md)'s skeleton-dimension bar and the no-blank-on-refetch loading rule — perceived performance and the four states are the same discipline seen from the budget side.)

### Worked example — the filtered list

A slice renders a long list with a search box. The agent writes the obvious thing:

```jsx
// agent's version — correct output, blows the INP budget on a large list
function FilteredList({ items }) {
  const [query, setQuery] = useState("");
  const filtered = items
    .filter((i) => matches(i, query))
    .sort(expensiveSort);          // runs synchronously on EVERY keystroke
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <List items={filtered} />     {/* re-renders the whole list each keystroke */}
    </>
  );
}
```

It is machine-correct — it shows exactly the right filtered, sorted list. But on a large `items` it re-filters, re-sorts, and re-renders everything on *every keystroke*, ties up the main thread well past 50ms per interaction, and the search box stutters — an INP failure the agent cannot feel and the happy-path test doesn't catch. The budget gate catches it in the PR; the high-leverage moves fix it:

```jsx
// budget-respecting version — debounce the work, memoize the derivation, virtualize the render
function FilteredList({ items }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 150);            // don't recompute mid-keystroke
  const filtered = useMemo(
    () => items.filter((i) => matches(i, debounced)).sort(expensiveSort),
    [items, debounced],                                        // recompute only when inputs change
  );
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <VirtualList items={filtered} />                         {/* render only visible rows */}
    </>
  );
}
```

The keystroke now updates only the input (instant); the expensive derivation runs once after the user pauses; and the render touches only visible rows — main-thread work per interaction drops back under budget. Note the membrane subtlety this echoes ([the-membrane.md](the-membrane.md), Axis 1b): a "strictly correct" list that re-sorts on every keystroke is *machine-correct and a mind-side disaster*. The budget is how the mind-side correctness gets a number.

### Lab vs field, and the regression-in-the-PR rule

Two disciplines keep the budget honest:

- **The build goes red in the PR that caused the regression.** This is the whole point. A Lighthouse-CI / bundle-size check that fails the build means a perf regression is caught *by the change that introduced it*, with the author present and the cause known — not three months later in production, in a slow aggregate, with no one able to say which of two hundred merged changes did it. **PREDICATE:** does the route exceed its committed budget? → fail the build. **DEFAULT** when a borderline regression is genuinely justified (a deliberately heavier feature): raise the budget *explicitly* in the same PR, as a recorded decision, never silently.
- **Field data is the truth; lab data is the early warning.** Your CI runs on a fast machine on a fast network (the lab); your users are on mid-tier phones on 4G (the field). The lab gate catches regressions early and cheaply; **real-user monitoring (RUM)** of Core Web Vitals in production is the actual truth of whether it feels fast. The lab number is the gate that fails the build; the field number is the reality it's standing in for. (Standing up the RUM itself is downstream observability work — route it to the suite's delivery/observability stage, not here.)

---

## When the call is genuinely ambiguous

Most of this file is not ambiguous — the keyboard walk completes or it doesn't, the number is green or red. For the genuine toss-ups, use the suite's engine (PREDICATE / DEFAULT / FALLBACK), and let the [the-membrane.md](the-membrane.md) escalation ladder's asymmetry govern:

- **Which budget number?** **PREDICATE:** is this a public, first-impression surface (landing, marketing, signup)? → tighter budgets, weighted to LCP and CLS. A logged-in, data-dense tool? → INP and bundle dominate, LCP can relax. **DEFAULT** on a coin-flip: start from the standard thresholds (INP < 200, LCP < 2.5, CLS < 0.1) and tighten, not loosen. **FALLBACK** if you can't yet tell: commit the standard numbers as the gate now; a too-strict budget you relax later is cheap, a missing budget you add later is a regression already shipped.
- **Climb to ARIA, or is there a native element?** **DEFAULT:** assume a native element exists until you've genuinely searched for one — most "custom" widgets are a `<button>`, `<details>`, `<dialog>`, or `<input>` in disguise. **FALLBACK** when none fits: climb to rung 3, but then you *own* the full keyboard and focus model — budget for it and follow an established ARIA authoring pattern rather than inventing one.

The asymmetry that decides every toss-up, straight from the membrane: **an over-cautious call here costs a moment — a slightly conservative budget, a `<button>` where a `<div>` would have done. A dishonest one — an inaccessible key path, a perf regression shipped green — costs the user, on every use, for the life of the feature, and the agent felt none of it.** When it's a genuine toss-up, err toward accessible and within budget.

---

## How findings route to siblings

This file owns **accessibility** and the **performance budget**; the adjacent concerns live in sibling references and skills, and a finding that belongs to them routes there rather than being re-solved here:

- **The skeleton's dimensions, the no-blank-on-refetch loading rule, and the four states themselves** → [four-states.md](four-states.md). CLS and perceived performance are *enforced* here as numbers, but the *design* of the loading state (first-load skeleton vs background refresh) is the four-states bar.
- **`prefers-reduced-motion`, optimistic UI, and the machine-correct-vs-mind-correct negotiation** → [illusion-maintenance.md](illusion-maintenance.md). Honoring reduced motion is both accessibility *and* ethics; it's executed there, alongside causal animation.
- **Why these two checks read the way they do** → [the-membrane.md](the-membrane.md) (the MEDIUM axis for accessibility, the MIND axis for the budget). Re-read the governing card at each gate.
- **The perception thresholds these numbers encode, and the source-of-truth/state classification upstream** → the suite's earlier stages (`bearings`'s perception contract, `wellspring`'s state map). The budget *translates* that contract into CI; it does not redefine it.
- **The behaviors the four states test, and the testing layers** → the next skill in the suite (`shakedown`/correctness): the axe check and the keyboard walk are gates *here*; the broader test trophy (accessibility as a CI gate alongside integration/behavior tests) is the testing stage's.
- **Standing up RUM and error tracking in production** → the suite's delivery/observability stage. This file consumes field data as the truth behind the lab gate; it does not build the monitoring.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (the MEDIUM and MIND axes — *why* these two gates exist) · [four-states.md](four-states.md) (the skeleton-dimension/CLS bar and the loading-state design this enforces) · [illusion-maintenance.md](illusion-maintenance.md) (`prefers-reduced-motion` and the machine-vs-mind correctness this budget gives a number) · [../SKILL.md](../SKILL.md) (STAGE 2 — Reach and STAGE 3 — Budget, the gates this reference serves).

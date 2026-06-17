---
name: wellspring
description: >
  The state-architecture lens for a frontend build — the heart of the system,
  where the deep models become daily keystrokes. Use after keel's skeleton works,
  when designing or auditing state, or when "it's out of sync" bugs keep
  appearing. The one shift: almost all frontend complexity comes from state having
  MULTIPLE COPIES (DOM, memory model, server DB, URL, localStorage, component
  state) drifting out of sync — so the craft is to relentlessly CLASSIFY each
  piece of state into the one bucket that owns it, minimize the source of truth and
  derive the rest, and model hard interactions as explicit state machines. Most of
  what a novice calls "global state" is really server-cache in disguise; split it
  out and the global store shrinks by most of its bulk. Triggers on "state
  management", "Redux / Zustand / Context / signals / Jotai", "where should this
  state live", "derived state / single source of truth", "this keeps getting out
  of sync", "useEffect to sync state", "prop drilling", "should this be in the
  URL", "a form's state", "too many boolean flags / loading and error flags". The
  one shift on data flow: the component tree and the data-dependency graph are
  different shapes, and every state-management tool is a bypass channel for when
  they disagree. Installs the five-question classification tree (the store-size
  thermometer), the duplicate-fact audit and forms-as-deliberate-fork, the
  implicit-to-explicit state-machine move, and the two-graphs data-flow discipline
  with composition-over-config and the rule of three. The agent does the wiring;
  you keep the calls it cannot make — what is truly independent state vs derived,
  and which bucket each piece belongs in.
argument-hint: "[the application state / data flow to architect or audit]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# wellspring

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A wellspring is the source a stream flows from — and the whole art here is to keep that source *single*, and let everything downstream be derived from it rather than stored again. `wellspring` is the third skill of the `surface` suite, the lens over **state architecture** — the heart of the system, the place the suite's deep models (state, the two graphs) finally become the judgment you make at every keystroke, and the place that sets the ceiling on the project's complexity. Its product is a written **state-classification map**: every meaningful piece of state assigned to the bucket that owns it, the source of truth minimized, the hard interactions drawn as explicit machines, and the data-flow conventions fixed. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: nearly all frontend complexity is state having more than one copy.** The "same truth" lives at once in the DOM, the in-memory model, the server database, the URL, localStorage, a component's local state — and the overwhelming majority of bugs are not wrong logic but these copies drifting out of sync (the server updated but the view didn't; the URL changed but the view didn't; two components each kept a copy and they disagree). So the craft is subtraction: **classify each piece of state into the single bucket that owns it, keep the source of truth minimal, and derive everything else.** Do that and a surprising thing happens — most of what felt like "global state" turns out to be server-*cache* in disguise, and once you split it out the global store shrinks to a fraction of its size. Much of the pain people blame on Redux is really server-cache mismanaged as local state.

This is where the agent era bites:
- **The agent stores derived state, signing a sync contract it will break.** Asked for a filtered list, it keeps the list, the query, *and* the filtered result — then wires a `useEffect` to sync them. Every stored derivative is a "remember to update this everywhere" contract, and the next session forgets. **Derived values are recomputed, never stored.**
- **The agent dumps everything into one global store.** It does not feel the cost of a bloated store or a piece of state living in the wrong bucket, so server-cache, URL state, and local UI state all get jammed together with one lifecycle. The store's *size* is the thermometer: a big global store is near-proof the classification is wrong.
- **The agent writes a pile of boolean flags instead of a state machine.** `isLoading`, `isError`, `isSubmitted` as independent booleans — so the machine is implicit, and the illegal combinations (loading *and* error *and* success) it permits are exactly the 3 a.m. bugs. It also prop-drills rather than seeing the two-graph mismatch, and over-abstracts components into config-driven monsters with no escape hatch.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart; for `wellspring`, lean on two axes: *state* (the source-of-truth discipline, server-state-is-a-cache, illegal-states-unrepresentable) and *the two graphs* (the component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG; every state tool is a bypass for where they disagree). Load at the start, re-check at every gate.

**Speak the user's language.** The classification calls are the user's — is this derived or independent, is this server-cache or genuinely client-owned, does this belong in the URL. Read their fluency and gloss a term on first use (*source of truth*, *derived state*, *server-cache* vs client state, *URL state*, a *state machine* / statechart, *prop drilling*, *composition*, *signals/atoms*, the *rule of three*). A bucket assignment the user can't follow is an architecture imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `wellspring`, the *state* and *two-graphs* axes are the spine. Load at the start, re-check at every gate.
- [references/classification-tree.md](references/classification-tree.md) — the engine: the five-question decision tree (derived? → server-cache? → URL? → shared-client? → local), cheapest-answer-first and stop-on-hit, with the store-size thermometer and the grep-able classification smells.
- [references/source-of-truth.md](references/source-of-truth.md) — minimizing the source of truth, the duplicate-fact audit, the legitimate copy (forms as a deliberate fork with an explicit commit point), and why a stored derivative is the first place bugs die.
- [references/state-machines.md](references/state-machines.md) — counting the interdependent booleans, collapsing them into a status union, listing the legal transitions so the illegal ones can't happen, and when a statechart library earns its weight.
- [references/data-flow-and-component-api.md](references/data-flow-and-component-api.md) — the two graphs and the bypass channels (props/composition vs context/store/signals, chosen by update frequency), composition-over-config, the rule of three, and the escape-hatch test for a component API.
- [references/server-state-and-data-layer.md](references/server-state-and-data-layer.md) — the client data layer the server-cache bucket points to: query/mutation libraries (keys, invalidation, dedup, stale-while-revalidate), optimistic updates and rollback, and the advanced consistency layer (CRDTs/OT, local-first sync, conflict resolution).

> **The arc is one classified map.** Four stages — classify · source · machine · flow — turn a tangle of state into the system's heart, done right: classify assigns every piece of state to the bucket that owns it; source minimizes the truth and derives the rest; machine makes the hard interactions explicit so illegal states can't occur; flow wires data along the dependency graph without prop-drilling and keeps component APIs composable. `wellspring` gates all four; `seaworthy` (build the unhappy path first) is the next step, turning the four states each piece of state can be in into the product itself.

---

## STAGE 0 — Classify (put every piece of state in the bucket that owns it)

Open **[references/classification-tree.md](references/classification-tree.md)**. Run every piece of state down the tree — cheapest, most local answer first, stop on the first hit.

- **The five questions, in order.** Q1 — can it be **computed** from state you already have? → it's *derived*; never store it, recompute on the spot. Stop. Q2 — is its canonical copy **owned by the server** (persisted, changeable by other sessions)? → it's *server-cache*; put it in the query/cache layer (invalidation, dedup, background refresh), not a variable. Stop. Q3 — should it **survive refresh / be shareable / take part in back-forward**? → it's *URL state*; put it in the router. Stop. Q4 — is it genuinely **client-owned and needed by components with no clean parent-child line**? → *shared client state* (store/signals/context) — but first ask whether lifting it to a common ancestor and passing props (composition) is acceptable. Q5 — none of the above → *local UI state*, the default home.
- **The store-size thermometer.** After the pass, what landed in Q4 (the global store) should be *tiny*. A large global store is near-certain proof the classification is wrong — usually server-cache masquerading as client state. Size is the diagnostic.

### GATE — clear before SOURCE
1. `checklist check classify state-classified-by-bucket`
2. `checklist verify classify`

---

## STAGE 1 — Source (minimize the truth, derive the rest, name the one legitimate copy)

Open **[references/source-of-truth.md](references/source-of-truth.md)**. The first stage said *where* truth lives; this one keeps it *single*.

- **Run the duplicate-fact audit.** List the state and ask of each: *is this same fact stored anywhere else?* If yes, one of the two must become derived (computed from the other) or be deleted — the same fact stored twice is a sync bug waiting to fire. `items` + `selectedItemId` is fine (two different facts); `items` + `filteredItems` is a bug (the second is derived); server `user` copied into a local `userName` is a bug.
- **Name the one legitimate copy: a form.** The single honest reason to copy server state locally is to make it *editable* — a form/draft. Then you are deliberately forking the server truth into a local draft truth, editing locally, and writing it back at an explicit commit point. Name it as exactly that — *a form is a deliberate, explicitly-committed fork of the truth* — and most of the "where does form state go?" confusion dissolves.

### GATE — clear before MACHINE
1. `checklist check source source-of-truth-minimized`
2. `checklist verify source`

---

## STAGE 2 — Machine (make the implicit state machine explicit)

Open **[references/state-machines.md](references/state-machines.md)**. The behavioral twin of "make illegal states unrepresentable."

- **Count the booleans; three interdependent ones is a machine.** If an interaction has three or more state booleans that constrain each other (`isLoading`, `isError`, `isSuccess`, `isSubmitting`), it *is* a state machine — currently implicit, which is why it breaks in the corners. Make it explicit: (1) collapse the legal states into one variable (`status: 'idle' | 'submitting' | 'success' | 'error'`), not N booleans; (2) list the legal transitions (which state can go to which, on which event); (3) anything not in the transition table now cannot happen.
- **The executable check:** *can my UI be `isLoading` and `isError` at once?* If the types allow it, you haven't modeled it — collapse to a union. A `status` enum + a reducer is enough for simple cases; reach for a statechart library (XState) only when you hit nested states, parallel states, or guarded/delayed transitions.

### GATE — clear before FLOW
1. `checklist check machine hard-interactions-as-explicit-machines`
2. `checklist verify machine`

---

## STAGE 3 — Flow (wire data along the dependency graph; keep components composable)

Open **[references/data-flow-and-component-api.md](references/data-flow-and-component-api.md)**. The two graphs rarely have the same shape; this stage handles the mismatch without prop-drilling.

- **Choose the channel by the two graphs.** The component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG. When a piece of state must reach a component: if the consumer is a descendant of the owner → **props**, and when intermediate layers don't care about it, use **composition** (pass components as children/slots) to bypass them — the underrated move that dissolves most prop-drilling with *no* state library. If the consumers are scattered (distant cousins, deep leaves) → the tree can't express it → a **bypass channel**: low-frequency stable values (theme, current user, locale) via **Context**; high-frequency or fine-grained via a **store/signals/atoms** with selectors (they subscribe precisely; Context re-renders all consumers on any change).
- **Component API: composition over config, rule of three, escape-hatch test.** Don't abstract the first or second occurrence of a pattern — extract on the third, once it's stable (premature abstraction hurts more than a little duplication). Test an abstraction by asking: *when a consumer hits an edge case, can it escape?* Compound components and headless hooks can; a giant config-driven `<Select renderEverything=.../>` can't, and will bind you. Give primitives, not monoliths.

### FINAL GATE
1. `checklist check flow data-flow-and-component-api-disciplined`
2. `checklist verify flow`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`wellspring` is **the heart** of the `surface` suite — where `bearings`'s source-of-truth table (the one-way door) is refined into a full classification, and where the deep state models become the architecture you live in. Its classified map hands `seaworthy` exactly what to build: each piece of state has a known set of states (loading/error/empty/data), and those become the product's unhappy paths. The through-line is the suite's own — *push correctness into structure* — here at its sharpest: minimize the truth so there is nothing to keep in sync, and model the machine so illegal transitions are unrepresentable rather than merely guarded against.

It pairs with the engineering suite without duplicating it. `load-bearing` draws the *module* boundaries and `plumb`'s "make illegal states unrepresentable" is the same idea at the type level — `wellspring` owns the frontend-specific version: the server-cache-is-not-state distinction, URL-as-state, the two-graphs mismatch that *creates the whole category* of state-management tools, and the form-as-deliberate-fork. For an agent the lever is the same as everywhere in the suite: it stores derivatives and syncs them with `useEffect`, dumps everything into one store, and writes flag-soup instead of a machine — feeling none of the out-of-sync bugs that follow — so the classification must be **decided and gated**, with the store kept small and the truth kept single.

## Anti-patterns (use as a pre-flight checklist)

- **Storing derived state** — the filtered list, the is-all-selected flag, the validity; recompute it, never store it. A stored derivative is the first place bugs die.
- **`useEffect` syncing one piece of state into another** — the canonical "stored a derivative" smell; grep for it and delete it.
- **A big global store** — the thermometer reading "misclassified"; most of it is server-cache masquerading as client state. Split it out.
- **Server data treated as plain state** — it's a *cache*; manage it with invalidation/dedup/background-refresh, not as a variable in a store.
- **Filter/search lost on refresh or unshareable** — it should have been URL state.
- **The same fact stored in two places** — a sync bug waiting to fire; make one derived or delete it (the one exception is a form, a deliberate committed fork).
- **Three-plus interdependent boolean flags** — an un-modeled state machine; collapse to a `status` union and list the legal transitions.
- **Prop-drilling through layers that don't care** — use composition (children/slots) before reaching for a state library.
- **Context for high-frequency state** — it re-renders every consumer; use a store/signals with selectors for fine-grained updates.
- **Config-driven component monoliths with no escape hatch** — give composable primitives (compound components, headless hooks); extract on the rule of three, not the first sight.
- **Skipping a GATE** — and remember: the store's size is the temperature of your classification; if it's big, you classified wrong.

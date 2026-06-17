# The Membrane — the seven axes, reframed for the agent era

This is the heart of `wellspring` — the seven structural axes that every non-trivial frontend decision lands on, reframed for a world where an agent (or a fleet of them) writes the wiring and a human-in-the-loop mostly classifies, reviews, and lives with the result. It is opened at the **start** of the run, alongside [../SKILL.md](../SKILL.md), and kept open at **every GATE**: before you certify a stage, re-read the axis that governs it.

Frontend is the one branch of software engineering whose correctness spec does not live in any document. A compiler is checked against a language standard, a database against ACID, a protocol against an RFC — but the frontend's ground truth is a human perceptual-cognitive system whose "spec" is written in neurophysiology, not in prose. That is why **taste is load-bearing here and cannot be outsourced**, and it is also why the discipline is structural rather than incidental: the frontend rides the seam between two complex systems — a machine and a mind — whose definitions of "correct" are *incompatible*. Almost every interesting decision is a negotiation across that seam.

For `wellspring` specifically, two of the seven axes are the spine: **state** (source-of-truth, server-state-is-a-cache, illegal-states-unrepresentable) and **the two graphs** (the component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG; every state-management tool is a bypass channel for where they disagree). The other five axes are here so the heart is self-contained — read them once, but lead with state and the two graphs, because those are what the four wellspring gates enforce.

The governing fact this skill turns on: **nearly all frontend complexity is state having more than one copy** — the same truth living at once in the DOM, the in-memory model, the server DB, the URL, localStorage, and component-local state, with the overwhelming majority of bugs being not wrong logic but those copies drifting out of sync. The craft is subtraction: classify each piece of state into the single bucket that owns it, keep the source of truth minimal, and derive everything else.

---

## PRE-FLIGHT — run this one line before you classify or wire a single piece of state

> **Ask of every piece of state: "is this a *copy* of a truth that lives somewhere else — and if so, who owns the original?"** Almost every frontend bug is two copies of the same fact drifting apart. The agent does not feel that drift: it stores the derived value, dumps everything into one global store, and writes a `useEffect` to paper over the seam — and the sync bug it signs up for fires three sessions later, in someone else's lap. The whole job of this skill is to move correctness out of "I'll remember to keep these in sync" and into structure: one source of truth, everything else derived; illegal combinations made unrepresentable; data wired along the dependency graph, not forced through the tree. **State has one owner per fact; everything else is derived; the store's size is the thermometer of whether you got the classification right.** Everything below is a consequence of that.

---

## How each card is built

Every axis is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the author *felt* the out-of-sync bug, the bloated store, the flag-soup at 3 a.m.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and gate instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent architecting state on a human's behalf.

Decision forks inside a card use the same engine throughout the suite: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

Tools are named only as *examples of a class*, never mandated: a TanStack-Query-class library for server-cache, MSW for contract-backed mocks, XState for statecharts, eslint-plugin-boundaries / dependency-cruiser for enforced module edges. Pick the boring, well-supported one; the axis is the judgment, the tool is a means.

---

## AXIS 1 — STATE — source of truth, server-cache, illegal states *(the spine — go deepest here)*

> **The root axis. If you internalize only one card, internalize this one — three of the four gates are corollaries.** Gates: [`state-classified-by-bucket`](#gate-map), [`source-of-truth-minimized`](#gate-map), [`hard-interactions-as-explicit-machines`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The author *felt* the cost of a stored derivative: they kept a filtered list next to the raw list and the query, wired a `useEffect` to sync them, and then paid for it every time the three drifted apart — so the pain pushed them toward the plain version (compute the filter on the spot). They felt a bloated global store as weight, and felt the 3 a.m. bug when `isLoading` and `isError` were both true at once. The out-of-sync bug was the governor that drove toward one source of truth. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **stores derived state by default and signs a sync contract it will break** — asked for a filtered list, it keeps the list, the query, *and* the result, then `useEffect`s them together, because every stored value makes the immediate thing work and the agent feels none of the drift. It **dumps everything into one global store**, server-cache and URL state and local UI state jammed under one lifecycle, because it cannot feel the cost of a bloated store. And it **writes flag-soup instead of a state machine** — `isLoading`/`isError`/`isSubmitted` as independent booleans whose illegal combinations are exactly the corner-case bugs. None of these turn anything red, so the governor is gone. This **SHARPENS "minimize the source of truth" from good advice into the whole premise**: the property that keeps the app from rotting — one copy per fact — is precisely the property the agent is blind to. |
| **THE DESIGN CONSEQUENCE** | State classification must be *decided and gated*, not trusted to an instinct the agent lacks. **(a) Classify every piece down the five-question tree** (Q1 derived? → Q2 server-cache? → Q3 URL? → Q4 shared-client? → Q5 local), cheapest/most-local answer first, stop on first hit — the engine lives in [classification-tree.md](classification-tree.md). **(b) Server data is a *cache*, not state** — it is a copy of a truth owned elsewhere, with properties local state never has (it expires, needs revalidation, needs request dedup, needs background refresh); manage it in a query/cache layer (a TanStack-Query-class library), not a variable in a store. The biggest single win in the whole skill: most of what felt like "global state" is server-cache in disguise, and splitting it out shrinks the store to a fraction. **(c) Minimize the truth, derive the rest** — run the duplicate-fact audit; the one legitimate copy is a *form* (a deliberate, explicitly-committed fork of server truth into a local editable draft). **(d) Make illegal states unrepresentable** — collapse interdependent booleans into one `status` union so the contradictory combinations cannot be constructed; the behavioral twin is the explicit state machine ([state-machines.md](state-machines.md)). The target: nothing to keep in sync, because there is only one copy. |
| **DO THIS** | At Classify, run every piece of state down the tree and assign one bucket; check the store-size thermometer — a large Q4 store is near-proof of misclassification, usually server-cache masquerading as client state. At Source, run the duplicate-fact audit and make one copy derived or delete it; name every legitimate copy as a form with an explicit commit point. At Machine, count the booleans — three-plus interdependent ones is an un-modeled machine; collapse to a union, list the legal transitions, and confirm the types forbid `isLoading && isError`. |

> Anti-patterns this card kills: **the stored derivative** (recompute, never store — a stored derivative is the first place bugs die), **the `useEffect` that syncs one piece of state into another** (grep for it and delete it), **the big global store** (the thermometer reading "misclassified"), **server data treated as plain state**, and **three-plus interdependent boolean flags** (an un-modeled state machine).

**Decision fork — store this value, or recompute it?**

- **PREDICATE:** can it be computed *right now* from state you already hold (a `filter`, an `every`, a `derive`)?
- **DEFAULT** on a coin-flip: **do not store it** — recompute on the spot. A recomputation is always consistent; a stored derivative is a standing "remember to update this everywhere" contract the next session will forget.
- **FALLBACK** when recomputation looks expensive: still don't store a second source of truth — *memoize* the derivation (cache keyed on its inputs), which keeps one source of truth and pays only for performance, not for a sync contract.

---

## AXIS 2 — THE TWO GRAPHS — component tree vs data-dependency DAG *(the spine — go deepest here)*

> **The axis that *creates the whole category* of state-management tools.** Gate: [`data-flow-and-component-api-disciplined`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The author felt prop-drilling as pain — threading a value through six layers that don't care about it was tedious to write and tedious to change, so the friction pushed them to lift state to a common ancestor, use composition, or reach (deliberately, and only when needed) for a bypass channel. The same friction taught them that a value re-rendering every consumer on every change was a performance smell worth a selector. The discipline was backed by the cost of living in the wiring. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **prop-drills without friction** — it threads the value through every layer because that's the literal-minded path and it feels no tedium — *or*, the moment a value is needed in two places, it **reaches straight for a global store**, skipping composition entirely, because a store "looks like state management" and earns no red. It does not see that the component tree and the data-dependency graph are *different shapes*: the tree is optimized for visual nesting (who is rendered inside whom), while the data-dependency graph is an arbitrary DAG (which component needs which datum, sourced from anywhere). When the two graphs disagree — a value needed by distant cousins, or a deep leaf far from its source — the tree cannot express it, and *that mismatch is the entire reason state-management tools exist*. The agent uses the tools as a reflex instead of as a bypass for a specific, diagnosed disagreement. This **SHARPENS "choose the data-flow channel deliberately" into a gated decision**. |
| **THE DESIGN CONSEQUENCE** | Data is wired along the **data-dependency graph**, not forced through the tree, and the channel is chosen by where the two graphs disagree and how often the value changes (the full treatment is in [data-flow-and-component-api.md](data-flow-and-component-api.md)). When the two graphs *agree* (consumer is a descendant of the owner) → **props**, and where intermediate layers don't care, **composition** (pass components as `children`/slots) bypasses them with *no state library at all* — the underrated move that dissolves most prop-drilling. When the two graphs *disagree* (consumers scattered: distant cousins, deep leaves) → a **bypass channel**, chosen by update frequency: low-frequency stable values (theme, current user, locale) via **Context**; high-frequency or fine-grained via a **store / signals / atoms with selectors** (they subscribe precisely; Context re-renders *all* consumers on any change). Signals/atoms are interesting precisely because they make the implicit dependency DAG explicit, a first-class citizen. And the component API obeys **composition over config**, the **rule of three** (don't abstract the first or second occurrence; extract on the third, once stable), and the **escape-hatch test** (a consumer hitting an edge case must be able to escape). |
| **DO THIS** | At Flow, for each value that must reach a component, first ask *is the consumer a descendant of the owner?* If yes → props, and if intermediate layers don't care, refactor to composition before touching any state library. If the consumers are scattered → pick a bypass channel by update frequency (Context for low-frequency stable values; a store/signals with selectors for high-frequency/fine-grained). For component APIs, hold abstraction until the third stable occurrence, and run the escape-hatch test — compound components and headless hooks pass; a config-driven `<Select renderEverything=.../>` monolith fails. Give primitives, not monoliths. |

> Anti-patterns this card kills: **prop-drilling through layers that don't care** (use composition first), **a store reached for the first time a value is shared** (was composition tried?), **Context for high-frequency state** (it re-renders every consumer; use a store/signals with selectors), and **config-driven component monoliths with no escape hatch** (give composable primitives; extract on the rule of three).

**Decision fork — composition, Context, or a store?**

- **PREDICATE:** are the consumers descendants of the owner (the two graphs agree here), or scattered across the tree (they disagree)?
- **DEFAULT** on a coin-flip: **prefer the lighter channel** — props/composition over a bypass; and if you must bypass, Context for a value that changes rarely, a selector-based store only once you can name a high-frequency or fine-grained update that Context would over-render.
- **FALLBACK** when you can't yet tell how scattered the consumers are: keep it local / lifted with props, and let the *third* real consumer prove the DAG shape before you install a bypass channel — an unneeded store is harder to remove than a prop is to thread.

---

## AXIS 3 — IDENTITY — what is "the same node" across time

> Context axis (no `wellspring` gate maps to it, but it explains a class of state-classification bug). For the human-mind framing of identity, see the MIND axis below.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Declarative rendering (`UI = f(state)`) looks clean, but the author learned the hard way that the framework cannot throw away the old DOM tree and rebuild it — focus, cursor position, scroll, in-flight animations, expensive real nodes all live in it — so it must answer *which new node corresponds to which old one*. That is a graph-matching problem, expensive in general, so every framework cheats with a heuristic (same position + same type = same node), and `key` is where that abstraction leaks. The classic "array index as key" bug was a *felt* lesson. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent emits `key={index}` and unstable identities without unease, because the list renders fine in the demo and the identity bug only surfaces on reorder/insert/delete — a corner it never exercises. The virtual DOM was never about performance (hand-written DOM ops are often faster); its only reason to exist is to give the framework a place to compute cross-time identity, and the agent treats it as a black box. |
| **THE DESIGN CONSEQUENCE** | Stable identity is something you *assert deliberately*: a `key` must be a stable, unique business identity, never an array index for a reorderable list. Bugs cluster in lists precisely because lists are where identity is most ambiguous — and a misattributed identity is a *state*-classification bug wearing a rendering costume (DOM state lands on the wrong datum). |
| **DO THIS** | Wherever a collection renders, give each item a stable domain key; flag `key={index}` on anything that can reorder, insert, or delete. When a list bug smells like "the wrong row kept its state," read it as an identity error, not a render error. |

---

## AXIS 4 — SCOPE — CSS as a missing-scope problem

> Context axis (no `wellspring` gate maps to it; included so the heart is whole — `keel`/styling skills own scope in depth).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS is a single global namespace resolved by specificity, source order, and the cascade — textbook "spooky action at a distance," where a class written anywhere can affect any element. The author felt the remote-coupling bug and reached for a methodology to recover the lexical scope that programming languages solved decades ago. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent writes globally-scoped styles that work in isolation and break in composition, feeling no remote coupling. Every CSS methodology, unmasked, is a disguised **scoping strategy**: BEM hand-simulates encapsulation by naming convention; CSS Modules hashes class names at compile time; CSS-in-JS borrows the component boundary; atomic/Tailwind abandons the cascade so there is no specificity to fight and no remote action. |
| **THE DESIGN CONSEQUENCE** | Choose the styling approach *as a scope decision*, consciously — trading the cascade's expressive power (inheritance, theming, responsive fall-through) against scope safety — not by fashion. The platform adding `@scope` and Shadow DOM is the language admitting it needs scope. |
| **DO THIS** | Name the scoping strategy explicitly when you choose a styling approach, and judge it by whether it eliminates remote coupling at a cost you accept — not by which library is trending. |

---

## AXIS 5 — MEDIUM — the document-vs-application impedance mismatch

> Context axis (the architecture/`keel` skills own rendering-architecture choice; included here as the *why* behind URL-as-state, which the classification tree's Q3 enforces).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The Web platform was built for linked *documents*; we build *applications* on it. Routing, the back button, forms, scroll restoration, URL-as-state — every friction is the application model squeezed through a document medium, and the SPA→SSR→RSC pendulum is that mismatch swinging back and forth. The author felt the cost of reinventing the back button badly inside an SPA. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent reinvents the browser inside the app — and does it worse — because it does not feel the platform capabilities it is throwing away. The specific bite for `wellspring`: it stuffs shareable, refresh-surviving, back/forward-participating state into a component variable instead of the URL, because both render identically in the demo. |
| **THE DESIGN CONSEQUENCE** | The router *is a state container*. State that should survive refresh, be shareable by pasting a link, or take part in back/forward → **URL state** (the classification tree's Q3). The test is concrete: *if I send a colleague this URL, should they see the same screen?* If yes, it belongs in the URL. Choosing an architecture is choosing which free platform capabilities to keep and which to rebuild by hand. |
| **DO THIS** | When classifying state, before reaching for a store, ask the shareable/refresh/back-forward question; if any is yes, route it to the URL. Treat filter, tab, pagination, selected-detail, and deep-linkable dialog state as URL state by default. |

---

## AXIS 6 — MIND — the spec lives in a human nervous system

> The axis that makes taste load-bearing. No single `wellspring` gate maps to it directly, but it is *why* the state work matters: the classified states (loading / error / empty / data) are the raw material the next skill (`seaworthy`) turns into the product's unhappy paths.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A developer understood, at least implicitly, that what they ship is not "a correct program" but **a maintained illusion**: direct manipulation is a lie — the user is sending a message to a possibly-distant, possibly-failing, thoroughly-asynchronous system. The frontend's real work object is the *causal story in the user's head*, not the DOM. The author felt this through latency constants that are physiology, not SLAs: 16ms frame budget, Nielsen's 100ms / 1s / 10s thresholds — psychophysical limits you cannot unit-test "feels responsive" against. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has *no* perceptual clock and no nervous system to consult, so the entire ground truth of this axis is invisible to it. It will happily ship a "strictly correct" list that re-sorts and jitters on every keystroke (correct on the data axis, a disaster on the mind axis), or omit the optimistic update / skeleton / causal animation that keeps the illusion intact — because none of those omissions turn anything red. Two definitions of "correct" pull in opposite directions, and the agent only perceives the machine one. |
| **THE DESIGN CONSEQUENCE** | The user's *mental model* is a source of truth too — arguably the primary one: model "how this should work in the user's head" first, then make the data structures serve it. Consistency of *meaning* often beats consistency of *data* (a slightly-stale but stable view beats a real-time but jittery one — the real reason behind debounce, skeletons, and stale-while-revalidate). Optimistic UI is optimistic concurrency control aimed at a human node; undo is event sourcing for a person; loading and error states are honest confessions that the illusion broke. This is why **taste is load-bearing and cannot be outsourced** — part of the ground truth simply is not in the machine and cannot be formalized. |
| **DO THIS** | When you classify a piece of state, also note the *causal story* the user holds about it — that note is what `seaworthy` turns into the loading/error/empty states. Where the machine-correct answer would jitter, flicker, or stall the felt causal chain, prefer the meaning-stable answer (stale-while-revalidate, debounce, optimistic update with an honest rollback) — and treat that judgment as a call only a human can finally make. |

---

## AXIS 7 — ETHICS — the membrane is constitutively asymmetric

> Context axis (operated/governed by the delivery & observability skills; included because it is the suite's moral floor, and because the optimizer it warns about is downstream of every state decision).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The same levers that *maintain* a user's mental model — lowering cognitive load, making the right action obvious, telling an honest causal story — are the levers that *manipulate* it; there is no clean technical line between good design and a dark pattern, because they turn the same knobs toward a different objective function. The author understood the relationship is **constitutively asymmetric**: the designer knows every mechanism, has time, runs A/B tests over millions, and so knows the user's perceptual constants and cognitive weak points better than the user does. **Friction is the moral primitive** — where you place ease and difficulty, at the point where company interest and user interest diverge, *is* your ethics. |
| **WHAT CHANGED IN THE AGENT ERA** | Dark patterns are increasingly **optimized, not designed** — the engineer who wrote the "reject cookies" CSS rarely *decided* to hide it; A/B testing is a gradient-descent optimizer whose loss function is a business metric, and pointed at "maximize engagement" it *discovers* manipulation on its own, because under that loss function manipulation is often the local optimum (Goodhart's law applied to people; the same rhyme as AI misalignment). The agent makes this worse: it cheaply generates the variants and the consent flow, feeling none of the asymmetry, so the optimizer's reach goes from "very large" toward "near-total." The real villain is the loss function — treat your experiment framework as an *adversary* that will find manipulation if manipulation moves the number, even if no one in the company wants it to. |
| **THE DESIGN CONSEQUENCE** | This cannot be outsourced to a compliance review, because the harm grows inside the capability itself. Distinguish **rational persuasion** (gives real reasons, invokes judgment, leaves agency intact) from **manipulation** (bypasses agency via defaults, biases, perceptual inertia). The membrane operates in the *pre-rational* layer, upstream of the user's defenses, so the line is drawn at *invokes agency vs bypasses it*, and at *survives reflective endorsement vs not* — not at "has influence vs none." The sharpest cut: a UI manipulates when it chooses the user's **impulsive self** over their **reflective self**, because the impulsive self is the one that moves the metric. |
| **DO THIS** | Declare a north-star metric and 2–3 guardrail metrics (the ones that may never worsen even if the north star rises). Run a target-function pre-mortem — *what is the cheapest, most manipulative path to lift this metric?* — and guard against it. Apply the reversibility/publicity test: if the user could see every mechanism and your true intent, would they still endorse this design? Place friction symmetrically (refusing should be as easy as accepting — the GDPR Article 7 principle), and design for the self the user wants to be. |

---

## GATE MAP

*Each axis mapped to the exact [`.checklist.yml`](../.checklist.yml) check it governs. The state axis feeds three of the four gates; the two-graphs axis feeds the fourth.*

Read down this table at the corresponding GATE: it tells you which axis you are actually enforcing and what "done" means for state architected by an agent. The checks are the contract; the axes are *why* the contract reads the way it does.

| Stage | Check ID | Primary axis | What it enforces, agent-era framing |
|---|---|---|---|
| classify | `state-classified-by-bucket` | **STATE** (+ MEDIUM for Q3, IDENTITY for collection state) | Every meaningful piece of state run down the five-question tree (cheapest/most-local first, stop on first hit) into one bucket — derived / server-cache / URL / shared-client / local — with the store-size thermometer applied: a large Q4 store is near-proof of misclassification, usually server-cache masquerading as client state. Gated because the agent dumps everything into one store and feels no cost. |
| source | `source-of-truth-minimized` | **STATE** | The duplicate-fact audit run — the same fact stored twice is made derived or deleted (`items`+`selectedItemId` fine; `items`+`filteredItems` a bug; server `user` copied to local `userName` a bug). The one legitimate copy named as a *form* — a deliberate, explicitly-committed fork of server truth. Gated because the agent stores derivatives and `useEffect`s them in sync. |
| machine | `hard-interactions-as-explicit-machines` | **STATE** (the behavioral twin of illegal-states-unrepresentable) | Three-plus interdependent booleans recognized as an implicit machine and made explicit: legal states collapsed into one `status` union, legal transitions listed, anything off the table made unrepresentable; the executable check — *can my UI be `isLoading` AND `isError` at once?* — applied. A `status` enum + reducer for simple cases; a statechart library (XState) only for nested/parallel/guarded transitions. Gated because the agent writes flag-soup. |
| flow | `data-flow-and-component-api-disciplined` | **THE TWO GRAPHS** | Data wired along the data-dependency DAG, not forced through the component tree: descendant consumer → props, and composition (children/slots) to bypass uninterested layers with no state library; scattered consumers → a bypass channel chosen by update frequency (Context for low-frequency stable values, store/signals *with selectors* for high-frequency/fine-grained). Component API: composition over config, rule of three, escape-hatch test. Gated because the agent prop-drills or reaches straight for a global store. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this server-cache or genuinely client-owned, does this belong in the URL or the store, is this one fact or two, is this a machine yet — climb one rung at a time rather than guessing silently:

```
pick the DEFAULT for a clearly low-stakes call (recompute over store; props/composition over a bypass;
  one fact over two; local over global)
   → wrapped: make the choice reversible and small — a classification you can re-bucket, a derivation you
     can memoize, a prop you can later thread to a store
      → check it against the thermometer: did the global store stay small, and is any fact stored exactly once?
        (a growing store or a duplicated fact is the misclassification showing itself)
         → ask the user one sharp question — they own the calls structure can't settle: is this truly
           independent state or derived; is its canonical copy the server's or the client's; should this
           survive a refresh and be shareable; is the user's mental model of this asking for meaning-stability
           over data-freshness (the STATE and MIND calls bottom out here)
            → if still unresolved, default to the SMALLER, more reversible option (recompute over store, one
              source of truth over a copy, local over global, the lighter data-flow channel) and record the
              residual as a classification note for the user.
```

The asymmetry that governs the ladder: **an over-conservative state choice costs the agent a recomputation or a slightly lifted prop; a stored derivative, a misclassified store, or flag-soup costs every future session an out-of-sync bug that fires far from where it was planted, for the life of the app.** When the call is a genuine toss-up, err toward one source of truth, the smaller store, and the lighter channel. See [classification-tree.md](classification-tree.md) for the five-question engine and the grep-able classification smells, [source-of-truth.md](source-of-truth.md) for the duplicate-fact audit, [state-machines.md](state-machines.md) for collapsing booleans into a union, [data-flow-and-component-api.md](data-flow-and-component-api.md) for the two-graphs channel router, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

---

## The thread through all of it

`wellspring` is the heart of `surface` because state architecture is where the suite's deep models become the judgment you make at every keystroke — and the state axis alone feeds three of its four gates. But step back to the whole membrane and the suite's thesis comes into focus. The frontend rides the seam between a machine and a mind, and **its correctness spec does not live in any document — it lives in a human nervous system.** That is the irreducible fact: a compiler has a standard, a database has ACID, but "feels right" has only a brain to check it against. So **taste is load-bearing here and cannot be outsourced.**

And that is exactly why the agent era moves the leverage. As the agent writes more and more of the code, the "typing" part of frontend is commoditized and devalues; what *appreciates* is precisely the membrane work — the judgment the agent is blind to. The leverage migrates from the keyboard to the membrane between machine and mind. The master asks, less and less, "how do I write this code," and more and more: **whose source of truth is this state, which bucket does it belong in, is this one fact or two, and along which graph does the data flow.** Those four questions are exactly the four things `wellspring` gates — the state axis feeds three of the gates (classify, source, machine), the two-graphs axis the fourth (flow) — and they are calls the agent cannot feel for you. They do not exhaust the membrane: the same migration keeps moving outward to the questions the *later* skills gate — what causal story will form in the user's head from this one interaction (the MIND axis, which `seaworthy` turns into the unhappy paths), and whose interest does my optimizer actually serve (the ETHICS axis, the suite's moral floor, governed downstream by the delivery and observability skills, not here). `wellspring` owns the state and two-graphs end of that spectrum; it surfaces the mind and ethics questions but does not gate them.

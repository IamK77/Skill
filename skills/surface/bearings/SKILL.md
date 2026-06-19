---
name: bearings
description: >
  The before-the-first-line lens for a frontend build: fix what is expensive to
  reverse before sunk cost exists. Use when starting a frontend product or major
  feature, or stress-testing a plan that jumped straight to a framework. The three
  ruling principles: BOUNDARIES > FRAMEWORKS (frameworks get
  swapped; the network/trust line and state classification fossilize into bedrock);
  ALLOCATE CAUTION BY REVERSIBILITY (one-way doors earn slow human judgment, two-way
  doors get a default for agents); and THE SOURCE OF TRUTH LIVES IN THE USER'S MIND,
  not the database. The one shift:
  frontend is the one discipline whose correctness spec lives in a brain, so taste is
  load-bearing and cannot be outsourced. Triggers on "starting a frontend / from
  scratch", "which framework", "how should I architect this UI".
argument-hint: "[the frontend product or feature to scope before building]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# bearings

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Before you sail you fix your bearings — and stage zero of a frontend build is the same: it writes no business code, yet it decides the project's fate, because it is where the decisions that are *brutal to reverse once written* get made while there is still no sunk cost to fight. `bearings` is the first skill of the `surface` suite — the lens you hold over a frontend product *before the first line*. Its product is five one-page artifacts — a journey map, a perception contract, a source-of-truth table, a rendering decision, and an objective-function charter — that every later stage (`keel` builds the skeleton against them, `wellspring` refines the source-of-truth table into the full state classification) honors. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each decision made before the next — not the *substance* of the judgment inside it; the rigor is yours to supply.

**Three ruling principles govern every call downstream — internalize them first.** (1) **Boundaries > frameworks.** The framework is the most-discussed and least-durable decision you will make — it gets swapped, and behind a clean boundary the swap is cheap; the boundaries themselves (the network/trust line, the classification of state, the split of modules) are discussed least and fossilize into the foundation. The novice spends 80% of the deliberation on React-or-X; the master treats that as a two-hour reversible call and spends the judgment on the boundaries. (2) **Allocate caution by reversibility.** Decisions are one-way doors (data model, rendering architecture, network boundary — expensive to walk back) or two-way doors (a color, a component's internals — revert anytime). Most analysis-paralysis is one-way-door caution misapplied to a two-way door. Go slow and deliberate on the one-way doors; go fast and cheap on everything else. (3) **The source of truth lives in the user's mind, not the database.** Model how the thing works *in the user's head* — and what "feels right" means — first, then make the data structures serve that model, never the reverse.

**This is where the agent era bites hardest, because the spec is not in any document.** Frontend is the one discipline whose correctness benchmark is a wet human nervous system — 16ms is a fusion threshold, 100ms is "I touched it directly," not an SLA — so a piece of "correct" here can never be checked against a formal spec, and **taste is load-bearing**: it cannot be outsourced to the agent, which has no access to the brain on the other side of the membrane. As the agent writes more of the code, the cheap part — typing — devalues, and the leverage migrates to the membrane: *which boundary, whose source of truth, what causal story forms in the user's head, and whose interest the optimizer serves.* Left alone the agent will pick the popular framework, model the database instead of the mind, skip the one-way-door decisions because they earn no green, and never set an objective function — so every one of those must be **decided and gated here**, on paper, before the dashboard exists to pull you.

**Read [references/the-membrane.md](references/the-membrane.md) first** — it is the heart: the seven axes (state, identity, the two graphs, scope, medium, mind, ethics) that the whole suite rests on, each reframed for a world where the agent writes the code and is blind to the reader on the far side. Load it at the start and re-check the relevant axis at every gate. If `$ARGUMENTS` is a genuine throwaway — a prototype that ships nothing and dies in a week — this machinery is overkill; say so. The bar is sized to how long the thing must live.

**Speak the user's language.** Almost every call here is a trade-off the user owns — is realtime worth the architecture it forces, is this the right north-star, is this default honest. Read their fluency and gloss a term on first use (a *one-way door*, *JTBD*, the *perception contract*, *source of truth*, *SSR/SPA/RSC/islands*, an *objective function*, a *guardrail metric*, the *reflective vs impulsive self*). A decision the user can't evaluate is an architecture imposed, not a judgment shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes and the agent-era thesis (taste is load-bearing, the leverage moves to the membrane). Load at the start, re-check at every gate.
- [references/decision-tree.md](references/decision-tree.md) — the engine: the consistency-model decision tree (the one-way door), the rendering-architecture router, the hot-vs-cold path cut, and the PREDICATE/DEFAULT/FALLBACK for "do we need realtime / offline / collaboration".
- [references/perception-contract.md](references/perception-contract.md) — the latency tiers and their *architecture consequences*, the animation-as-causal-narrative budget, and how a perceptual threshold becomes a hard constraint you write down before code.
- [references/source-of-truth-and-consistency.md](references/source-of-truth-and-consistency.md) — the source-of-truth table, the consistency models and how to pick the weakest sufficient one, the trust boundary (every client input hostile), and why this is the deepest one-way door.
- [references/objective-function.md](references/objective-function.md) — the north-star and guardrails, the gradient-descent adversary pre-mortem, the reflective-vs-impulsive-self cut, and the reversibility / publicity / friction-symmetry tests that turn ethics into a checklist.
- [references/product-sense-and-judgment.md](references/product-sense-and-judgment.md) — product sense (what to build and why, the cost of every feature, friction as a primitive), the reality long-tail (the unglamorous states real products must handle), surface diversity, and quantified design-language judgment.

> **The arc is five artifacts, set before the first line.** Five stages — chart · contract · source · render · compass — turn a vague product into the five one-page decisions the rest of the build honors: chart models the domain and the journeys (not the database); contract fixes what "feels right" costs in milliseconds; source pins where each truth lives and how consistent it must be (the one-way door); render chooses what platform powers you keep versus rebuild; compass sets what you optimize and what you refuse — *before* the metric dashboard exists to pull you. `bearings` gates all five; `keel` (the walking skeleton) is the next step.

---

## STAGE 0 — Chart (model the domain and the journeys, not the database)

Open **[references/the-membrane.md](references/the-membrane.md)** and **[references/decision-tree.md](references/decision-tree.md)**. Before any interface, build the map.

- **Noun-verb list before data tables.** List the domain's core nouns (entities) and verbs (actions). The nouns become your data-model skeleton; the verbs become your component-and-interaction vocabulary. A test: if you can't say which noun a verb acts on and what it produces, the domain isn't understood yet — stop, don't build on it.
- **Each key journey as a JTBD.** Write the few most critical journeys as "*when [situation], the user wants [motivation], so that [outcome]*." Fill all three — especially *so that*, which is the basis for defining "what counts as success" later.
- **Rank journeys by frequency × consequence.** High-frequency, high-blast-radius journeys are **hot paths** (optimize relentlessly); the rest are **cold paths** (good-enough). The discipline: most teams spread effort evenly across every page; the master concentrates 80% of the polish on 2–3 hot paths.
- **List the thinks-vs-actually gaps.** For each journey, ask "*what does the user believe is happening vs. what is actually happening?*" Every gap is where you will do illusion-maintenance later (optimistic UI, animation, loading states) — this list is the seed of `seaworthy`'s work.

### GATE — clear before CONTRACT
1. `checklist check chart journeys-and-paths-mapped`
2. `checklist verify chart`

---

## STAGE 1 — Contract (the perception contract: latency tiers become architecture)

Open **[references/perception-contract.md](references/perception-contract.md)**. Turn "feels right" into hard numbers, because it is the one part of the spec that lives in the user's nervous system and can't be unit-tested.

- **Tier every key interaction by latency tolerance — and write down the architecture consequence.** Instant (<100ms, must feel like direct manipulation) → *no network round-trip on this path*, so it must be local or optimistic. Responsive (<1s) → may be async, but needs an immediate visual acknowledgement. Tolerable (<10s) → must show progress (skeleton/bar), never a blank screen. Long (>10s) → make it a background task with a notification, don't make the user wait. The right-hand column is the point: judging an interaction "instant" *locks an architecture constraint before the first line of code* — that like-button cannot wait on a server confirmation.
- **Set the animation budget.** Motion is causal narrative, not decoration, so its timing is a contract: micro-feedback ~150ms, transitions ~250–300ms, one consistent easing curve. Decide it here, not by taste later.

### GATE — clear before SOURCE
1. `checklist check contract perception-contract-set`
2. `checklist verify contract`

---

## STAGE 2 — Source (where each truth lives, and how consistent it must be — the one-way door)

Open **[references/source-of-truth-and-consistency.md](references/source-of-truth-and-consistency.md)** — the most clarifying, and most expensive-to-reverse, decision of the stage.

- **Build the source-of-truth table.** For each class of core data, name where its *canonical copy* lives — server, URL, local client, or a collaborative CRDT — and its consistency model. A `?` in that table (the classic one: *the shopping cart*) is exactly the thing you must decide now, not discover later.
- **Pick the consistency model down the decision tree — and default to the weakest.** Will the data change from another source while the user watches it? (No → simple fetch. Yes → realtime/poll/subscribe.) Will multiple users edit the same thing at once? (Yes → conflict resolution / CRDT — *a whole-architecture fork; bolting it on later is a rewrite*.) Must it work offline? (Yes → local-first — the client becomes a distributed node with its own source of truth.) Every "yes" pushes the project toward heavier architecture, so the discipline runs backwards: **default to the weakest consistency, and escalate only when a real requirement forces you** — don't put a CRDT on something nobody co-edits because "collaboration is cool."
- **Draw the trust boundary.** Treat every client input as hostile: name which validations and which authorizations must be re-done on the server. This one has no exceptions.

### GATE — clear before RENDER
1. `checklist check source source-of-truth-mapped`
2. `checklist check source consistency-and-trust-boundary-fixed`
3. `checklist verify source`

---

## STAGE 3 — Render (rendering architecture from requirements, not popularity)

Open **[references/decision-tree.md](references/decision-tree.md)** (the rendering section). Derive the architecture from the need, then count what it costs you.

- **Choose down the rendering tree.** Need SEO, or a fast first paint on a weak network? → SSR/SSG. Content basically static? → SSG / MPA + progressive enhancement (cheapest, most robust). A logged-in app, strong interaction, SEO irrelevant? → SPA or RSC. Need both SEO and local interactivity? → islands / partial hydration.
- **Run the platform keep-or-rebuild list.** Choosing an architecture = choosing which free platform powers you keep and which you hand-rebuild. Walk the list — URL-as-state, the back button, scroll restoration, accessibility, view transitions — and mark each "keep native" or "rebuild myself." Every "rebuild" is a debt you are signing here; the cost of a SPA is mostly hiding in the rows you marked "rebuild." See it before you sign it.

### GATE — clear before COMPASS
1. `checklist check render rendering-and-platform-decided`
2. `checklist verify render`

---

## STAGE 4 — Compass (set what you optimize and what you refuse — before the dashboard exists)

Open **[references/objective-function.md](references/objective-function.md)**. The metric dashboard does not exist yet, and that is exactly why this must be done now — the moment it exists, it starts pulling every decision, and the same membrane that maintains a user's mental model is the one that manipulates it.

- **Declare one north-star and 2–3 guardrails.** The guardrails are the teeth of the ethics: metrics you will *never let worsen even if the north-star climbs* (mis-order rate, rage-clicks, churn, a11y errors).
- **Run the objective-function pre-mortem.** Play the A/B-test gradient-descent optimizer against yourself: *"to push this north-star up, what is the cheapest, most manipulative path?"* Write those answers down — they are exactly what you must forbid by rule and block with guardrails. Ten minutes of playing the adversary here saves a half-year of "the metric went up but users are angry."
- **Install the reversibility / publicity test as a standing rule.** If the asymmetry were erased — the user could see every mechanism and your true intent — would they still endorse this design? Design for the self the user *wants to be* (their reflective self, the one they'd endorse afterward), not the impulsive self that moves the metric.

### FINAL GATE
1. `checklist check compass north-star-and-guardrails-set`
2. `checklist check compass objective-function-premortem-done`
3. `checklist verify compass`
4. `checklist show` — confirm all five stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`bearings` is **the orienting stage** of the `surface` suite — five paper decisions made while reversing them is still free. Its five artifacts are the contract the rest of the build honors: `keel` proves the walking skeleton against the rendering choice and the source-of-truth table; `wellspring` refines that table into the full state classification; `seaworthy`'s unhappy-path work grows from the thinks-vs-actually gap list and the perception contract; `lookout`'s pre-launch ethics gate is the objective-function charter coming back for its exam. The through-line is the suite's own — *push correctness from runtime carefulness into structural constraint* — applied here at the root: the one-way doors are pinned on paper before any code can fossilize a wrong one.

It pairs with the engineering suite without duplicating it. `load-bearing` draws *general* software boundaries with the same one-way/two-way-door lens — `bearings` shares that lens but owns the part that has no home there: the perception contract, the source-of-truth-in-the-mind, and the objective-function ethics, the layer that exists only because the node on the far side of this boundary is a *person*. For an agent the lever is the same as everywhere in the suite: it will model the database instead of the mind, pick the framework instead of drawing the boundary, and never set an objective function — feeling none of the future cost of a fossilized wrong decision — so the one-way doors must be **decided and gated**, on paper, before the build begins.

## Anti-patterns (use as a pre-flight checklist)

- **Opening `create-x` first** — the first move is the journey map and the boundaries, not the scaffold; code is the last thing that happens here.
- **Designing the UI from the database schema** — the interface becomes a visualization of the tables instead of a servant of the user's mind; model the mental model first.
- **Deferring "realtime / offline / collaboration" to later** — it's a one-way door; bolting it on after is a rewrite. Decide the consistency model now.
- **Spending a week on the framework, an afternoon on the boundaries** — exactly backwards; the framework is the reversible call, the boundaries are the bedrock.
- **No perception contract** — "feels janky" discovered at the end is an architecture problem you locked in at the start; tier the latencies before code.
- **A `?` left in the source-of-truth table** — the unanswered cell is the decision you must make now; an undecided owner is a sync bug waiting to happen.
- **Trusting the client** — every input is hostile; name the server-side re-validations, no exceptions.
- **Marking "rebuild" without counting the debt** — the SPA's true cost is in the platform-feature rows you hand-rebuild; see them before you sign.
- **Shipping before setting an objective function** — once the dashboard exists it pulls you; the north-star, guardrails, and adversary pre-mortem must precede it.
- **Skipping the adversary pre-mortem** — if you don't play the gradient-descent optimizer against your own metric, the A/B tests will find the manipulation for you, with no one having designed it.
- **Skipping a GATE** — and remember the meta-rule: the spec lives in a brain, so taste is load-bearing; these artifacts make the judgment explicit, they don't replace it.

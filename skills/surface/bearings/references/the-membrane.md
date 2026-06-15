# The Membrane — the seven axes of frontend in the agent era

This is the heart of `bearings` — and, because `bearings` is **stage 0** of the `surface` suite, it carries the **fullest map**: the seven axes on which every frontend decision sits, each reframed for a world where an agent writes the code and is structurally blind to the human on the far side of the screen. Every other `surface` skill carries its own copy of this file (each must be copy-standalone), but they lead with the axis they own; this one leads with **all seven**, because the orienting stage is where you draw the whole map before a single line fossilizes a wrong one. Open it at the start of the run, and re-read the governing axis at **every GATE** before you certify a stage — see the [GATE MAP](#gate-map) for which axis backs which check. The other references in this skill teach you *how* to execute each piece — [decision-tree.md](decision-tree.md), [perception-contract.md](perception-contract.md), [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md), [objective-function.md](objective-function.md). This one names *what is structurally different about frontend itself*, and why each difference must be **decided and gated here, on paper, before the build can pull you.** Read it as a pre-flight scan and a cockpit checklist, not an essay. Back to the contract: [../SKILL.md](../SKILL.md).

The thread that ties all seven together — the suite's own internal core — is one move: **push as much correctness as possible out of "runtime carefulness" and into "design-time structural constraint."** Declarative rendering, a minimal source of truth, making illegal states unrepresentable, modelling async as concurrency, drawing the trust boundary — they are all the same act seen from different sides. Frameworks turn over every few years; this core barely moves.

---

## THE MEMBRANE PRE-FLIGHT — run this one line before you scope or judge a frontend

> **Ask of every decision: "which side of the membrane does this serve, and is the truth I'm encoding the database's or the user's mind's?"** Frontend is not a domain — it is a *boundary*, in fact two boundaries stacked: a network/trust line on the machine side (the data lives elsewhere, the client cannot be trusted) and a machine/mind line on the human side. Everything in this suite falls on one of those lines. The machine side is *just distributed computing with a latency-and-trust boundary* — nothing unique. The irreducible part, the part no other software discipline must face, is the other line: **the node on the far side is a person**, and the correctness spec for that node is written in neurophysiology, not in any document you can diff. So a piece of "correct" here can never be checked against a formal spec, **taste is load-bearing**, and the agent — which has no access to the brain across the membrane and feels none of the future cost of a fossilized one-way-door decision — will default to modelling the database instead of the mind, picking the popular framework instead of drawing the boundary, and never setting an objective function. Every one of those must be **decided by a human and gated here.** Everything else below is a consequence of that.

---

## The three ruling principles — internalize these before any card

These govern every call downstream; the seven axes are how they bite on a specific decision.

1. **BOUNDARIES > FRAMEWORKS.** The framework is the most-discussed and *least-durable* decision you will make — it gets swapped, and behind a clean boundary the swap is cheap. The boundaries themselves — the network/trust line, the classification of state, the split of modules — are discussed *least* and fossilize into bedrock. The novice spends 80% of the deliberation on React-or-X; the master treats that as a two-hour reversible call and spends the judgment on the boundaries. **Gate consequence:** the framework choice is *not* a gate in this skill; the source-of-truth table, the trust boundary, and the rendering decision are.

2. **ALLOCATE CAUTION BY REVERSIBILITY.** Decisions are *one-way doors* (data model, rendering architecture, network/consistency boundary — brutal to walk back, a rewrite if bolted on later) or *two-way doors* (a color, a component's internals — revert anytime). Most analysis-paralysis is one-way-door caution misapplied to a two-way door. Go slow and deliberate on the one-way doors; default fast and cheap on everything else, and leave the two-way doors for the agent to refactor.

3. **THE SOURCE OF TRUTH LIVES IN THE USER'S MIND, NOT THE DATABASE.** Model how the thing works *in the user's head* — and what "feels right" means — first, then make the data structures serve that model, never the reverse. The naive engineering instinct is exactly backwards: design the tables, then hope the user learns them. Your real source of truth is the mental model; meaning-consistency often beats data-consistency (a slightly stale but stable view beats a "real-time correct" one that flickers).

> **The closing thesis, stated up front so you read the cards through it:** as the agent writes more of the code, the cheap part — typing — devalues, and the leverage migrates from the keyboard to **the membrane between machine and mind**. The questions that gain value are exactly the four the agent cannot answer: *which boundary, whose source of truth, what causal story forms in the user's head, and whose interest the optimizer serves.* `bearings` exists to force those four onto paper before the build begins.

---

## How each card is built

Every axis is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when a human author felt the cost of a fossilized wrong decision and got a flicker of doubt before signing a one-way door.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it (it feels no future cost, earns no green for the call, and is blind to the mind across the membrane).
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and gate instead of trust.
- **DO THIS** — one literal move you execute at this stage, phrased for an agent scoping a frontend on a human's behalf.

Genuinely-ambiguous forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you can't answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## AXIS 1 — State synchronization (complexity comes from multiple copies of the truth)

> The root of the machine side. Gate: [`journeys-and-paths-mapped`](#gate-map) (the noun-verb model is where you decide what is *independent* state vs *derived*).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A senior engineer's edge over a novice was rarely CSS tricks or framework API fluency — it was *data modelling*: the ability to identify what is genuinely independent state versus a derived quantity. They knew the same truth lives in many places (DOM, in-memory model, server DB, URL, localStorage, component state) and that most bugs are not wrong logic but *copies drifting out of sync*. They felt, every time, the contract they signed by storing a derivative: "remember to re-sync this," which they would eventually forget. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **stores derived state freely** — it computes a filtered list and *saves* it alongside the source list and the query, because storing-then-reading is the obvious literal move and it feels no future sync bug. It also reaches for the popular framework and the global store by reflex, never asking whether complexity is coming from copies it could eliminate. This **SHARPENS "minimize the source of truth" from a craft into a structural call that must be made on paper**: declarative rendering (`UI = f(state)`) is a *constraint* whose value is that it *removes* your ability to hand-mutate the DOM — and the agent will not impose a constraint on itself. |
| **THE DESIGN CONSEQUENCE** | The minimal source of truth is **decided here, not discovered later.** Each class of core data gets one canonical home; everything else is *derived on the spot, never stored* (storing a derivative signs a sync contract you will break). This is the seed of the source-of-truth table (Axis 2 / `source` stage) and what `wellspring` later refines into the full state classification. |
| **DO THIS** | At Chart, build the **noun-verb list before any data table**: nouns become the data-model skeleton, verbs become the interaction vocabulary. For each candidate piece of state ask "is this independent, or is it `f(other state)`?" If derived, mark it *recomputed, never stored*. A verb whose noun and effect you can't name means the domain isn't understood — stop. |

> Anti-pattern this card kills: **the stored derivative** — the filtered list saved instead of recomputed, the sync bug waiting to happen.

---

## AXIS 2 — Identity (the leak in `UI = f(state)`, and the deepest one-way door)

> Gates: [`source-of-truth-mapped`](#gate-map), [`consistency-and-trust-boundary-fixed`](#gate-map). This axis carries the **most expensive-to-reverse** decision of the whole stage.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | `UI = f(state)` produces a whole new tree, but the old DOM tree can't be thrown away — it holds focus, cursor position, scroll, playing animations. So the framework must answer *which new node is which old node*: a graph-matching problem it cheats at with "same position + same type = same node," and `key` is where that abstraction leaks (the array-index-as-key bug is an identity error). The deeper version: server data is **not state, it's a cache** — it expires, needs revalidation, dedup, background refresh — a different species from local UI state, and the human knew that conflating them (the Redux original sin) is a *category error*. They also knew "do we need realtime / offline / collaboration" is a one-way door: bolt it on later and you have a rewrite. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **conflates identity boundaries by default**: it dumps server data into the same global store as local UI state, manages both with one lifecycle, and never reaches for cache semantics — because a `TanStack-Query-class` library earns no green over a hand-rolled `useEffect` fetch, and the agent feels no 3 a.m. cache-coherence bug. Worse, it **skips the one-way-door consistency decision entirely** — realtime/offline/collaboration earn no immediate reward, so it defaults to the simplest fetch and silently forecloses (or silently over-builds) the architecture. This **SHARPENS the consistency model from an implementation detail into the single most expensive call to gate.** |
| **THE DESIGN CONSEQUENCE** | The **source-of-truth table** is built and the **consistency model** chosen *down the decision tree*, defaulting to the **weakest sufficient** one and escalating only when a real requirement forces it. Server state is treated as a cache (invalidation, dedup, stale-while-revalidate). Identity across the network boundary is pinned by an auto-generated contract (an OpenAPI/GraphQL/tRPC-class single source of types) so client and server types *cannot drift*. No `?` is left in the table; no CRDT is put on something nobody co-edits "because collaboration is cool." |
| **DO THIS** | At Source, name the canonical home (server / URL / local client / collaborative CRDT) and consistency model for each data class; resolve every `?` (the classic one is the shopping cart). Run the [consistency fork](#consistency-fork) below. |

<a id="consistency-fork"></a>**Decision fork — what consistency model does this data class need?**

- **PREDICATE:** Will it change from another source *while the user is watching it*? Will *multiple users edit the same thing at once*? Must it work *offline*?
- **DEFAULT** on a coin-flip: **the weakest sufficient model** — a simple fetch + cache. The burden of proof is on every escalation: "changes-while-watched" → realtime/poll/subscribe; "multiple editors" → conflict resolution / CRDT (a whole-architecture fork, a rewrite if bolted on later); "offline" → local-first (the client becomes a distributed node with its own source of truth).
- **FALLBACK** when you can't yet tell if it co-edits or goes offline: pin it as a simple fetch *and write the assumption down as a one-way door to revisit*, rather than pre-building a CRDT you may never need.

> Anti-pattern this card kills: **the global store full of server cache**, and the speculative CRDT. The framework gets swapped cheaply; the consistency model does not.

---

## AXIS 3 — The two graphs (component tree vs data-dependency DAG)

> Gate: [`journeys-and-paths-mapped`](#gate-map) (the journey map exposes which data crosses the tree to distant cousins). Refined by `wellspring` later.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The component tree is shaped for *visual nesting*; the data-dependency graph is an arbitrary DAG (which component needs which data). When the two shapes match, props suffice and "state management" need not exist as a category. Prop-drilling is the *symptom* of forcing DAG-shaped data through a tree-shaped pipe. Every state-management tool (Context, a Redux-class store, signals, atoms) is a bypass channel that lets data flow along dependency lines instead of tree lines — and the human reached for one only when the tree genuinely couldn't express the dependency. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **reaches for the global bypass channel immediately** — it lifts everything into a store or Context at the first hint of sharing, because that always works and it feels no cost of the implicit dependency graph it just made invisible. It does not default to composition (lift state up, pass props down, compound components) and wait for the tree to *actually* fail. This **SHARPENS "prefer composition" into a default that must be set, because the agent's reflex is the opposite.** |
| **THE DESIGN CONSEQUENCE** | The default is **composition first**; a bypass channel is used only when the tree *truly* cannot express the dependency. The journey map and noun-verb model surface which data is needed by distant cousins — that, not a reflex, is what justifies a store. Signals/atoms are interesting precisely because they make the implicit dependency graph *explicit and first-class*. |
| **DO THIS** | At Chart, when a journey shows one truth needed by two far-apart nodes, note it as a real DAG edge the tree can't carry — that is the seed for a later bypass channel. Do not pre-install a global store; record the dependency, decide the mechanism at `wellspring`. |

---

## AXIS 4 — Scope (CSS is the missing lexical-scope lesson)

> Two-way-door axis; surfaces at the `render`/tooling boundary. No dedicated gate here — it is a *consequence* of the rendering choice, flagged so you choose the styling strategy *as a scope decision, not by fashion*.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS is a single global namespace with cascade-and-specificity conflict resolution — textbook "spooky action at a distance," the problem languages solved decades ago with lexical scope (the cascade was designed for *documents*, not apps). So every CSS methodology is a disguised *scoping strategy*: BEM hand-simulates encapsulation by naming convention; CSS Modules hash class names at compile time; CSS-in-JS borrows the component boundary; atomic/utility CSS (a Tailwind-class approach) abandons the cascade entirely (no specificity to fight, no remote action — at the cost of the cascade's inheritance/theming expressiveness). The human chose *consciously*, trading scope-safety against cascade-power. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **picks the popular styling approach by training-distribution gravity**, not as a scope trade-off, and scatters styles that work locally but leak globally — because a leak is invisible until another component breaks, and the agent feels none of that future remote-coupling bug. This **SHARPENS "choose CSS as a scope strategy" into an explicit call you make rather than inherit.** |
| **THE DESIGN CONSEQUENCE** | The styling approach is chosen as a **scope decision** at the tooling/render boundary: name what scope-safety you're buying and what cascade-expressiveness you're giving up. It mostly rides Axis 5's rendering choice; it is reversible (a two-way door) so it does not earn a dedicated gate, but it must be a *deliberate* trade, not fashion. |
| **DO THIS** | When you fix the rendering architecture, name the styling strategy in the same breath and state the trade in one line ("atomic: no remote coupling, give up cascade theming"). Don't let the agent's default stand unexamined. |

---

## AXIS 5 — Medium (the document/application impedance mismatch)

> Gate: [`rendering-and-platform-decided`](#gate-map). A one-way-door axis.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The Web platform was built for *linked documents*; we build *applications* on it. Every friction — routing, the back button, "page" vs "view," scroll restoration, URL-as-state, accessibility — is the mismatch squeezed out. The SPA → SSR → RSC pendulum is that mismatch swinging: embrace the app model and you hand-rebuild the document features (back button, URL, a11y) — usually worse; embrace the document model (MPA / SSR / progressive enhancement) and you layer app interactivity on top. So **choosing an architecture = choosing which free platform powers you keep and which you hand-rebuild**, and the human counted the rebuild cost before signing. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **picks the rendering architecture by popularity** (a SPA because the tutorials use one) and then *silently rebuilds the browser inside it, worse* — losing the back button, URL-as-state, scroll restoration, a11y — because each loss is invisible to a passing demo and the agent feels none of the debt it just signed. This **SHARPENS "derive rendering from requirements" into a gated decision, because the agent will derive it from fashion.** |
| **THE DESIGN CONSEQUENCE** | The rendering architecture is **derived from requirements** down the tree, and the **platform keep-or-rebuild list is walked** — every "rebuild" recognized as a debt signed here (the true cost of a SPA hides in the rows marked rebuild). |
| **DO THIS** | At Render, route the [rendering fork](#rendering-fork) below, then walk URL-as-state, back button, scroll restoration, accessibility, view transitions — mark each "keep native" or "rebuild myself," and total the rebuilds before you sign. |

<a id="rendering-fork"></a>**Decision fork — which rendering architecture?**

- **PREDICATE:** Need SEO or a fast first paint on a weak network? Is the content basically static? Is it a logged-in, strongly-interactive app where SEO is irrelevant? Need *both* SEO and local interactivity?
- **DEFAULT** on a coin-flip: **the cheapest, most robust option that meets the need** — SSG / MPA + progressive enhancement keeps the most free platform powers; reach for a SPA/RSC only when strong interaction genuinely requires it. (SEO/weak-net → SSR/SSG; static → SSG/MPA; logged-in app → SPA/RSC; both → islands / partial hydration.)
- **FALLBACK** when the interaction requirements aren't settled yet: default to the document-model option and the progressive-enhancement path, which is the cheapest to *escalate* from later, and record it as a one-way door to revisit before scale.

> Anti-pattern this card kills: **reinventing the browser inside a SPA, worse** — the back button, URL, and a11y hand-rebuilt because the architecture was chosen by fashion.

---

## AXIS 6 — Mind (the spec lives in a wet nervous system; you deliver a maintained illusion)

> Gate: [`perception-contract-set`](#gate-map). This is the axis with no formal spec — the one that *cannot be unit-tested*.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Most software checks against a formal spec (compiler ↔ language standard, DB ↔ ACID, protocol ↔ RFC). Frontend has none: its ground truth is a human perceptual-cognitive system whose "spec" is written in neurophysiology, with *hard constants* — 16ms is the flicker-fusion threshold, not an SLA; 100ms is "I touched it directly," 1s is "the system is working," 10s is "attention is lost." So you can't unit-test "feels responsive," which is *why taste is load-bearing here and not in compilers.* And what you deliver is not "a correct program" but a **maintained illusion**: direct manipulation is a lie (you're messaging an async, possibly-failing system across a network), so optimistic UI tells the user the probable truth before it's confirmed, animation is *causal narrative* (an element flying from the clicked button says "this came from that click"), and loading/error states are the honest confession when the illusion breaks. The real work object is never the DOM — it's *the causal story in the user's head.* |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has **no access to the brain across the membrane** — it cannot feel "janky," cannot judge "feels instant," and treats a server round-trip on a like-button as fine because the test passes. It writes the happy path and treats loading/error/optimistic states as afterthoughts, when those *are the product* (they are the illusion-maintenance). This **SHARPENS the perception contract from tacit taste into hard numbers that must be written down before code, because the one part of the spec that lives in a nervous system is exactly the part the agent is blind to.** |
| **THE DESIGN CONSEQUENCE** | "Feels right" is turned into **architecture**: each key interaction is tiered by latency tolerance *with its architecture consequence written down* — judging an interaction "instant" *locks a constraint before the first line* (no network round-trip on that path → it must be local or optimistic). The animation budget is fixed as a contract (micro-feedback ~150ms, transitions ~250–300ms, one easing curve), not decided by taste later. The thinks-vs-actually gap list (drawn at Chart) names every site where illusion-maintenance is owed and seeds `seaworthy`'s work. |
| **DO THIS** | At Contract, tier every key interaction — Instant (<100ms) / Responsive (<1s) / Tolerable (<10s) / Long (>10s) — and write the right-hand architecture-consequence column, *that* is the deliverable. Set the animation budget. At Chart, list per journey "what the user believes is happening vs what actually is." |

> Anti-pattern this card kills: **the like-button that waits on the server** — and shipping the happy path with loading/error states bolted on at the end. The unhappy paths are the product.

---

## AXIS 7 — Ethics (the same membrane that maintains a mental model is the one that manipulates it)

> Gates: [`north-star-and-guardrails-set`](#gate-map), [`objective-function-premortem-done`](#gate-map). The ethics is not a chapter bolted on — it is this craft read from the other side.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The levers that *maintain* a mental model and those that *manipulate* it are the **same levers** — lower cognitive load (for the user's goal, or for the action *you* want), make the right action obvious (or the *profitable* one), tell an honest causal story (or a false one). There is no clean technical line between good design and a dark pattern; only the objective function is flipped. Ethics arises from *asymmetry*, and this membrane is constitutively asymmetric: the designer knows every mechanism, has time, runs A/B tests, holds aggregate data on millions; the user is one tired person at 3 a.m. who can read your JS but not your *intent*. Friction is the moral primitive: where you put the friction, at the fork between user-interest and business-interest, *is* your ethics. And dark patterns are mostly **optimized, not designed** — A/B testing is a gradient-descent optimizer whose loss function is a business metric, and pointed at a human nervous system it *discovers* manipulation as a local optimum, with no one designing it (Goodhart's law on people; the same shape as AI misalignment). The cut that has teeth: the interface structurally sides with the *impulsive self* (the one that moves the metric) over the *reflective self* (the one the user would endorse afterward). The human felt the duty to set the objective function and the guardrails *before* the dashboard existed to pull them. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **never sets an objective function** — it has no metric to serve and no metric to refuse, so left alone it ships with no north-star, no guardrails, no adversary pre-mortem. Then the *moment a dashboard exists*, an agentic optimizer (an A/B framework, an LLM tuning copy per-user) will find the manipulative local optimum *faster and more personalized than any human researcher*, and — critically — it leaves no fixed, screenshot-able artifact to critique, because the dark pattern is generated live, per user, per moment. The transparency defense ("the source is public, researchers can catalog it") collapses. This **SHARPENS the objective-function charter from a conscience into a hard artifact that must be written and gated *before* the metric dashboard exists.** |
| **THE DESIGN CONSEQUENCE** | One **north-star** and 2–3 **guardrails** are declared (the guardrails are the teeth: metrics never allowed to worsen even if the north-star climbs — mis-order rate, rage-clicks, churn, a11y errors), the **objective-function pre-mortem** is run (play the gradient-descent adversary against your own metric and write down the cheapest manipulative path, then forbid it by rule and block it by guardrail), and the **reversibility / publicity test** is installed as a standing rule (if the asymmetry were erased and the user saw every mechanism and your true intent, would they still endorse this?). Design for the **reflective self**, not the impulsive self. This must be *upstream, on the builder* — user vigilance cannot backstop it, because the asymmetry guarantees the user loses the cat-and-mouse game. |
| **DO THIS** | At Compass, write the north-star + guardrails; run the [adversary fork](#adversary-fork); install the reversibility/publicity test. Audit the friction: at every fork where user-interest and business-interest diverge, ask *whom does this ease/difficulty serve?* |

<a id="adversary-fork"></a>**Decision fork — is this design honest, or is it the optimizer's manipulation dressed as good UX?**

- **PREDICATE:** If the asymmetry were erased — the user could see every mechanism, every A/B graveyard, your true intent — would they still endorse this? Does it call the user's agency (give a real reason, leave their judgment intact) or *bypass* it (a default, a pre-attentive nudge, a confirm-shame, a roach-motel friction mismatch)?
- **DEFAULT** on a coin-flip: **side with the reflective self** — make consequential actions appropriately effortful, give stopping cues, keep the symmetry (cancelling as easy as subscribing — the GDPR Art. 7 principle, ethics encoded into law). When unsure whether a nudge calls or bypasses agency, treat it as bypassing and reject it.
- **FALLBACK** when you genuinely can't tell whose interest a default serves: that is a trade-off the *user's product owner* owns, not the agent — surface it as one sharp question rather than letting the optimizer settle it silently.

> Anti-pattern this card kills: **the metric dashboard with no charter** — once it exists it pulls every decision, and the A/B tests will find the manipulation for you, with no one having designed it.

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs. Read down this table at the corresponding GATE: it tells you which axis you are actually enforcing and what "done" means for a frontend scoped by an agent. The checks are the contract; the axes are *why* the contract reads the way it does.*

| Stage | Check ID | Primary axis (axes) | What it enforces, agent-era framing |
|---|---|---|---|
| chart | `journeys-and-paths-mapped` | **AXIS 1 (state)**, **AXIS 3 (two graphs)** | Noun-verb model before any data table; independent vs derived state distinguished (derived = recomputed, never stored); critical journeys as JTBD; journeys ranked frequency × consequence into hot/cold paths; the thinks-vs-actually gap list drawn (AXIS 6 seed) — because the agent stores derivatives, reaches for the global store, and models the database not the mind. |
| contract | `perception-contract-set` | **AXIS 6 (mind)** | Each interaction tiered by latency tolerance *with its architecture consequence* (Instant <100ms forbids a round-trip → local/optimistic; Responsive/Tolerable/Long each with their rule); animation budget fixed as contract not taste — because the one part of the spec living in a nervous system is exactly what the agent is blind to and cannot unit-test. |
| source | `source-of-truth-mapped` | **AXIS 1 (state)**, **AXIS 2 (identity)** | Source-of-truth table built; each data class's canonical copy named (server / URL / local / CRDT); no `?` left; derived values explicitly *not* given a home — because the agent conflates server cache with local state and stores derivatives. |
| source | `consistency-and-trust-boundary-fixed` | **AXIS 2 (identity)** | Consistency model chosen down the tree, defaulting to the *weakest sufficient* and escalating only on real requirement (no CRDT on what nobody co-edits); trust boundary drawn, every client input hostile, server-side re-validations/re-authorizations named — because the agent skips the one-way-door consistency call and trusts its input. |
| render | `rendering-and-platform-decided` | **AXIS 5 (medium)**, **AXIS 4 (scope)** | Rendering architecture derived from requirements not popularity; platform keep-or-rebuild list walked (URL-as-state, back button, scroll restoration, a11y, view transitions), each rebuild a debt signed here; styling chosen as a scope strategy — because the agent picks by fashion and silently rebuilds the browser, worse. |
| compass | `north-star-and-guardrails-set` | **AXIS 7 (ethics)** | One north-star + 2–3 guardrails (the teeth); reversibility/publicity test installed; design for the reflective self not the impulsive self — done *now* because the moment the dashboard exists it pulls every decision, and the agent never sets an objective function at all. |
| compass | `objective-function-premortem-done` | **AXIS 7 (ethics)** | The gradient-descent adversary played against your own metric, the cheapest manipulative path written down and forbidden by rule / blocked by guardrail — because an objective function pointed at a nervous system discovers manipulation as a local optimum, and an agentic optimizer finds it faster, per-user, leaving no artifact to critique. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this a one-way or two-way door, does this consistency model need escalating, does this default serve the user or the business — climb one rung at a time rather than guessing silently:

```
classify the door: is this reversible (two-way) or expensive-to-reverse (one-way)?
   → two-way door (color, a component's internals, the styling approach): take the DEFAULT, make it small and revertible, leave it for the agent to refactor later — do NOT spend one-way-door caution on it
      → one-way door (data model, consistency model, network/trust boundary, rendering architecture): slow down; write the assumption on paper and run the card's fork to its weakest-sufficient default
         → if the fork still won't resolve, ask the user ONE sharp question — they own the trade-offs taste and the optimizer cannot settle: is realtime/offline worth the architecture it forces, is this the right north-star, whose interest does this default serve, what counts as "feels right" here
            → if still unresolved, default to the WEAKEST/most-reversible option (weakest consistency, document-model rendering, the honest design that sides with the reflective self) and record the residual as a one-way-door note for the user to revisit before scale.
```

The asymmetry that governs the ladder: **an over-cautious scoping choice costs the agent a little speed or a moment of "too simple"; a fossilized wrong one-way door — the conflated source of truth, the missing consistency model, the optimizer with no charter — costs a rewrite, or costs the user their agency, for the life of the product.** When the call is a genuine toss-up, err toward the weakest sufficient consistency, the cheapest-to-escalate rendering, and the design that would survive the user seeing every mechanism. See [decision-tree.md](decision-tree.md) for the consistency and rendering routers, [perception-contract.md](perception-contract.md) for the latency tiers, [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md) for the trust boundary, [objective-function.md](objective-function.md) for the adversary pre-mortem, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

---

## The suite thesis — why this skill exists at all

Frontend is the one software discipline whose correctness spec lives in a **human nervous system**, not a document — so it can never be checked against a formal benchmark, and **taste is load-bearing and cannot be outsourced** to an agent that has no access to the brain on the far side of the membrane. As the agent writes more of the code, the cheap part — typing — devalues to zero, and the leverage migrates from the keyboard to **the membrane between machine and mind**. The four questions that gain all the value are exactly the four the agent cannot answer, and the four `bearings` forces onto paper before the build begins:

> **Which boundary do we draw? Whose source of truth is this? What causal story will form in the user's head? And whose interest does the optimizer serve?**

Walk the whole lifecycle and you find it is just this map projected onto practice: state, identity, the two graphs, scope, medium, mind, ethics — a master's only job, at every real decision point, is to make all seven hold at once. These seven cards make that judgment explicit. They do not replace it.

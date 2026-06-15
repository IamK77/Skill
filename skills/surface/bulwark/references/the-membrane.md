# The Membrane — the seven axes, reframed for the agent era

This is the heart of `bulwark`. The other references teach you *how* to do each piece of the 1-to-N maintenance loop — [enforce-boundaries.md](enforce-boundaries.md) (the import/layer rules, the public-API module, the fitness functions, the immune-system meta-rule), [prune.md](prune.md) (the extract/delete/keep flow, dead-code and stale-flag pruning, state reclassification), [conway-and-design-system.md](conway-and-design-system.md) (aligning module seams to team seams, the design system as a living artifact, the vitals read). **This** one names *what is different about frontend work now*, and ties each shift to the exact [GATE](../SKILL.md) it enforces. It is opened at **STAGE 0 (Enforce)** and kept open at **every GATE**: before you certify a stage, re-read the axis that governs it.

The whole `surface` suite rests on one uncomfortable fact: **frontend is the one branch of software engineering whose correctness spec does not live in any document — it lives in a human nervous system.** A compiler is checked against a language standard, a database against ACID, a protocol against an RFC. Frontend's ground truth is a perceptual-cognitive system whose "spec" is written in neurophysiology, not prose. So a chunk of the craft cannot be reduced to a passing test — and that is exactly the chunk an agent cannot supply. `bulwark` is the steady-state stage, where the enemy is **entropy**, and the two things rotting are the *boundaries* you drew (eroded one "just this once" cross-import at a time) and the *two graphs* (the component tree and the data-dependency graph, drifting apart as features pile on). The agent only ever **adds** — features, abstractions, flags, store slices — and crosses boundaries for convenience, feeling none of the accreting cost. Entropy is its natural output. So the boundaries must be *machine-enforced and gated*, never trusted to memory.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you accept any change into a living system

> **Ask of every change: "does this add an invisible edge to the dependency graph, or migrate a truth into the wrong bucket — and would the machine catch it if it did?"** The next maintainer of this system is a stateless agent session with no memory of which boundary is load-bearing, which abstraction earned its keep, or which store slice is really server-cache in disguise. It will reach for the shortest path to green — a deep import into another feature's internals, a stored derived value, a flag argument that makes one abstraction behave like two — and feel *zero* cost, because adding turns green and pruning earns nothing. The whole job of `bulwark` is to move every rule out of human memory and into a gate the machine rejects at merge, so the architecture survives its own creators. **A boundary that lives in a head or a wiki is already violated; only a boundary the machine rejects at merge holds — and every real violation must become a new permanent rule.** Everything below is a consequence of that.

---

## How each card is built

Every axis is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the premise that held when a human author *felt the cost* of their own rot: the deep import they'd have to untangle next month, the global store that grew until no one could reason about it, the wrong abstraction everyone routed around.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it (it adds without friction, crosses boundaries for convenience, never prunes, never feels the entropy tax).
- **THE DESIGN CONSEQUENCE** — what this forces you to *gate* rather than trust.
- **DO THIS** — one literal move you execute, phrased for an agent maintaining a living system on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

The seven axes are the suite's spine — **state-synchronization, identity, the two graphs, scope, medium, mind, ethics**. `bulwark` does not lean on all seven equally. It leans hardest on **scope** (the boundary/isolation axis — the same spooky-action-at-a-distance problem CSS has, now at the *module* level) and **the two graphs** (the drift you are actively fighting), plus the meta-principle that governs the whole stage: **optimize for change, not for the first version.** Those lead. The rest are the suite's shared frame, present so this card stands on its own.

---

## AXIS 1 (LEAD) — Scope: spooky action at a distance, now at the module level

> **The axis `bulwark` is built on.** Gate: [`boundaries-machine-enforced`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS taught everyone the lesson once: a single global namespace where a class written *anywhere* can affect *any* element is textbook "spooky action at a distance" — and programming languages solved it decades ago with **lexical scope**. Every CSS methodology, unmasked, is a disguised scoping strategy (BEM mimics encapsulation by convention, CSS Modules hashes class names at build time, CSS-in-JS borrows the component boundary, atomic/Tailwind abandons the cascade so there's no specificity to fight). A careful author felt the cost of an unscoped edit and reached for the boundary. |
| **WHAT CHANGED IN THE AGENT ERA** | The *same* problem reappears one level up — at the **module** boundary — and now the spooky action is a **deep import** into another feature's internals. The agent reaches for it because it is the shortest path to working code, and it feels **no cost to the architecture**: the designed module graph quietly dissolves into "whoever was in a hurry." A boundary in a head or a wiki is, to a stateless session, indistinguishable from no boundary at all. This **SHARPENS "draw module boundaries" from good advice into the one move that governs everything**: make the architecture *self-enforcing*, because at scale no one — human or agent — remembers the rules. |
| **THE DESIGN CONSEQUENCE** | Boundaries must be **fossilized into machine gates**, not trusted. Encode the dependency/import rules (a `eslint-plugin-boundaries`-class rule, `no-restricted-imports`, a `dependency-cruiser`-class tool): "layer A can't import layer B," "features can't import each other's internals — only the public entry," "the UI layer can't touch the data layer." Each module exposes **one public entry** (the single-entry / public-API pattern); deep imports into internals are lint-banned, so the graph keeps the shape *you* designed. Lint what you can of the state classification (ban global-store / `localStorage` writes outside designated layers). Run **fitness functions** in CI — assertions about the structure itself (no circular deps, layer X doesn't depend on Y, a route's bundle under budget). Put **CODEOWNERS** on the load-bearing files (contracts, core types, module boundaries). And the **immune-system meta-rule**: every accidental violation that *could* have been caught becomes a new permanent lint rule. |
| **DO THIS** | At Enforce, encode the import/layer rules so a cross-boundary import turns CI **red** at merge. Collapse each module behind one public entry and ban the deep imports. Add the fitness functions and CODEOWNERS. When a boundary is breached by accident, ask "is there a rule that would have caught it?" — if so, add it; the boundary set grows by turning each real violation into a permanent guard. See [enforce-boundaries.md](enforce-boundaries.md) for the engine. |

> Anti-pattern this card kills: **the deep import into a module's internals** — the agent's shortest path, the architecture's slow death. Expose one entry, ban the rest, and let the machine refuse the rest.

---

## AXIS 2 (LEAD) — The two graphs: the drift you are fighting

> **The other axis `bulwark` is built on.** Gate: [`abstractions-pruned-and-state-reclassified`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The most elegant explanation of why "state management" must exist as a category: the **component tree** is a tree, shaped for *visual nesting* (who renders inside whom); the **data-dependency graph** is something else — an arbitrary directed graph of which component needs which data. When the two shapes match, props suffice. They never quite do, and every state-management tool is a bypass channel letting data flow along the dependency line instead of the tree line. A human author felt the drift: props drilled through layers that don't care, a store that kept swelling, a derived value stored and then forgotten. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent makes the two graphs **drift apart without friction**. It will store a derived value (the filtered list it should have computed on the spot) because storing it is the obvious move and it never feels the synchronization contract it just signed. It will reach for the global store for state that is really server-cache, URL state, or local UI state, because one bucket is easier than four. It **adds, never reclassifies** — so the store grows, derived state fossilizes, the two graphs diverge — all invisibly, because adding turns green and pruning earns nothing. This **takes "minimize the source of truth and classify state ruthlessly" from a felt discipline to a rule that must be re-checked on a schedule.** |
| **THE DESIGN CONSEQUENCE** | The drift must be **measured and pruned**, not trusted to stay put. The global store's *size* is the thermometer (`wellspring`'s): when it grows, re-run the classification tree and move server-cache back to the cache layer — because nine times out of ten a swelling store is server-state that drifted back in. Prune the dead on a schedule (a `knip`/`ts-prune`-class tool): unused exports, stored derived state, and stale feature flags (the one rolled to 100% three months ago and never deleted — *a permanent flag is an un-merged fork*). Audit the import graph for new cycles and cross-layer leaks (the scope axis, re-read as drift). |
| **DO THIS** | At Prune, read the store-size thermometer; if it's climbing, re-run the state-classification tree and reclassify the drifted state. Run the dead-code pass: delete unused exports, inline stored derived values back to on-the-spot computation, and delete stale flags. Re-audit the import graph for new cycles. See [prune.md](prune.md). |

> Anti-pattern this card kills: **the growing global store and the stored derived value** — two silent symptoms of two-graph drift the agent plants because neither turns anything red.

---

## META-PRINCIPLE (LEAD) — Optimize for change, not for the first version

> **The principle that governs the whole stage. If you internalize one thing about 1-to-N, internalize this.** It cuts across both gates above and the three below.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The biggest trap of 0-to-1 is building for the demo. A master builds the first vertical slice so that the *hundredth* feature is still cheap — and that, almost entirely, means: the source of truth is small, the boundaries are enforced, the contracts are honest, and you delete code without flinching. A human felt the entropy tax accumulate and paid down debt to keep the system changeable. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent optimizes for **right now**: it ships the feature, reaches for a rewrite rather than a refactor, and piles speculative structure the next session must read through. It abstracts two similar snippets *immediately* (the wrong abstraction, more expensive than the duplication it replaced), and it keeps a wrong abstraction because it looks "DRY." The cost of the Nth feature climbs invisibly — the **entropy tax** — because no single add turns red. This **takes "optimize for change" from a felt discipline to the standing measure of whether the system is alive.** |
| **THE DESIGN CONSEQUENCE** | Three things become *gated steady-state signs*, not aspirations: the global store stays small as features grow; **the cost of the Nth feature ≈ the cost of the first** (no entropy tax); abstractions are pruned, not just piled. The maintenance bias on any ambiguous abstraction is **delete-and-duplicate**, because a wrong abstraction is an *invisible edge* in the dependency graph coupling distant things — duplication is local and visible, the wrong abstraction is not. Extract only on the rule of three. |
| **DO THIS** | At every gate, judge the change against "is the hundredth feature still cheap?" Keep the source of truth small, the boundaries machine-enforced, the contracts honest. Delete dead code, stale flags, and wrong abstractions without flinching — that is the only thing that keeps Nth-feature cost flat. The vitals stage reads whether you're winning. |

> Anti-pattern this card kills: **building for the first version** — the agent's default horizon, and the source of the entropy tax that 1-to-N exists to fight.

---

## AXIS 3 — State-synchronization: derived state must never be stored

> The suite's root axis; here it is the *thermometer* feeding [`abstractions-pruned-and-state-reclassified`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Frontend's essence is not "drawing UI" — it is **state synchronization**: keeping one truth consistent across its many copies (DOM, in-memory model, server DB, URL, `localStorage`, component state). Almost all bugs are copies falling out of sync. So: **minimize the source of truth, derive everything else on the spot.** Store the filtered list and you've signed a contract to keep it in sync — which you'll eventually forget. A human felt that 3 a.m. debugging session and reached for the derived value. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent stores the derived value freely — the `useEffect`-that-syncs-state-into-state — because it never feels the broken contract. The single highest-leverage modeling skill (telling truly-independent state from derived quantity) is the one it under-invests in, because the payoff is in a *future* synchronization bug it won't experience. |
| **THE DESIGN CONSEQUENCE** | Stored derived state is a **gated smell**, swept on the prune pass: the `useEffect` that copies one state into another, the server `user` re-copied into a local `userName`. The one legitimate copy is a *form/draft* — a deliberate fork of server truth, edited locally, written back at an explicit commit point. |
| **DO THIS** | At Prune, grep for the state-into-state `useEffect` and inline the derived value back to on-the-spot computation. Run the duplicate-fact audit: the same truth stored twice is a sync bug waiting to fire. |

---

## AXIS 4 — Identity: the abstraction that became its own edge

> A facet of the two-graphs gate: [`abstractions-pruned-and-state-reclassified`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Declarative UI hides a hard problem: when state changes, `f` produces a *new* tree, but the old DOM carries focus, cursor, scroll, in-flight animation — so the framework must match nodes across time (the graph-matching problem `key` exposes; the array-index-as-key bug is an identity error). The general principle: an abstraction, like a node, needs a stable, correct identity, or it couples the wrong things. A human felt a wrong abstraction as a thing everyone routed around. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent generates abstractions at no cost to itself, and they *look* like good engineering, so a wrong one — a flagged abstraction that is really two things in one coat — gets created and kept. Its identity is a coincidence (two snippets that *looked* alike), not an essence, so consumers fight it: they pass flags, they all need an escape hatch. |
| **THE DESIGN CONSEQUENCE** | The **flag-argument is the tell** and is gated on the prune pass: an abstraction growing booleans that switch its behavior is two things wearing one name → split or delete. The **escape-hatch test**: can a consumer hitting an edge case get out? Compound components and headless hooks can; a giant config-driven monolith can't → refactor to headless/compound, or delete. |
| **DO THIS** | At Prune, run extract/delete/keep on every abstraction: used 3+ times *and* genuinely shared → keep; used once/twice or coincidentally "shared" → inline it back; consumers fighting it with flags / all needing escape hatches → split or delete. When unsure, delete-and-duplicate. See [prune.md](prune.md). |

---

## AXIS 5 — Medium: the document/application impedance mismatch

> Frames the Conway gate's *change cost* and the vitals read: [`module-edges-aligned-to-team-edges`](#gate-map), [`architecture-vitals-healthy`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The Web platform was built for *linked documents*; we build *applications* on it. Every friction — routing, the back button, "page" vs "view," scroll restoration, URL-as-state — is the mismatch squeezed out. Choosing an architecture is choosing *which platform-given capabilities you keep and which you rebuild by hand* (and a team that can't see this reinvents the browser inside an SPA, worse). A human felt the cost of rebuilding what the platform gave for free. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent rebuilds platform capabilities by reflex (its own back-button, its own URL handling) and reaches for a rewrite over a refactor, never feeling the debt it signs. At 1-to-N this surfaces as architectural rot: the system becomes legible only to the person who built it. |
| **THE DESIGN CONSEQUENCE** | The mismatch shows up in the **vitals**: an architecture whose seams are honest lets a newcomer ship on the docs alone; one that reinvented the browser in a head needs a senior to walk them through "what not to touch." The Conway alignment keeps the seams where the teams are, so the medium's friction is owned, not scattered. |
| **DO THIS** | At Vitals, treat "how fast does a newcomer ship on the docs alone?" as the external sign of whether the medium's friction lives in the structure (healthy) or in someone's head (rot). See the vitals section of [conway-and-design-system.md](conway-and-design-system.md). |

---

## AXIS 6 — Mind: the spec lives in a nervous system, so the model must be externalized

> The vitals axis: [`architecture-vitals-healthy`](#gate-map); the design-system gate: [`design-system-is-a-real-artifact`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Frontend's ground truth is a perceptual-cognitive system, and what you deliver is *a continuously-maintained illusion of direct manipulation* over an async, fallible machine. The real source of truth is the **user's mental model**, not the database. So the shared mental model — of the system *and* of the user — has to live in an artifact (a catalog, an ADR, tokens), or it dies with the people who hold it. A human felt the bus-factor risk and wrote it down. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent rots the artifact: it changes the code and leaves the catalog story, the ADR, the token stale (no green reward to update it), and the *next* session reads the stale doc as truth. The mental model stays trapped in the original builder's head, and the system stops being legible. |
| **THE DESIGN CONSEQUENCE** | The design system must be a **real, discoverable artifact** — gated: a living component catalog (a Storybook-class catalog) where each reusable component documents its states (including `seaworthy`'s four — loading/error/empty/edge — as stories), so components are *found and reused, not reinvented*; tokens as the single source of visual decisions (re-theming is one edit, not a manhunt); ADRs as the living "why," not a rotting exhaustive API doc. The executable check: *can a newcomer find and reuse an existing component instead of building a duplicate?* Constant reinvention means the catalog is untrue or undiscoverable. |
| **DO THIS** | At System, make the catalog real and discoverable, with the four states as stories and tokens as the single source; keep ADRs as load-bearing decision records. At Vitals, track time-to-first-independent-delivery — if it climbs, the model is rotting faster than you're externalizing it. See [conway-and-design-system.md](conway-and-design-system.md). |

---

## AXIS 7 — Ethics: friction is the moral primitive, and the optimizer is the real villain

> Present as the suite's frame. At 1-to-N it folds into the [`architecture-vitals-healthy`](#gate-map) read of the metric you optimize — but the call is the *user's*, and lives upstream.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The lever that *maintains* a user's mental model and the lever that *manipulates* it are the **same lever** — only the objective function is flipped. Morality on this membrane grows from **asymmetry** (the builder knows every mechanism, runs the A/B tests, holds the aggregate data; the user is one tired person at 3 a.m.). The moral primitive is **friction**: where you put the easy and the hard, at the point where company and user interest diverge, *is* your ethics. The line is not "influence vs none" but "engages agency vs bypasses it." |
| **WHAT CHANGED IN THE AGENT ERA** | Dark patterns are increasingly **not designed but optimized into existence**: A/B testing is a gradient-descent optimizer whose loss function is some business metric, and pointed at a human nervous system it *discovers* manipulation as a local optimum — no villain required. The agent in this loop is the optimizer's hands: it implements whatever moves the metric, feeling none of the asymmetry it widens. The interface structurally takes the side of the user's *impulsive* self, because that's the self that produces the metric. |
| **THE DESIGN CONSEQUENCE** | This call **cannot be outsourced** to a compliance check — the harm grows inside the capability itself — and it cannot be left to the agent or the optimizer. It must be made *upstream*, by a human, before the dashboard exists to pull every decision. The standing gates: a stated north star *and* guardrails ("must not worsen even if the north star rises"); the reflective-self test (don't optimize the impulsive self against the self the user would endorse on reflection); the reversibility/publicity test (would the user endorse this if they saw every mechanism and intent?); the friction-symmetry test (GDPR Art. 7's "withdrawing consent as easy as giving it" is this principle written into law — apply it everywhere, not just consent). |
| **DO THIS** | At Vitals, when reading the metric the system optimizes, run the friction-symmetry and reflective-self tests, and surface the objective-function call to the user — it is theirs, not the agent's. Keep the guardrail metrics on the same dashboard as the north star, never checked after the fact. |

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs. Read down this table at the corresponding GATE: it tells you which axis you are actually enforcing and what "done" means for a living system maintained by an agent. The checks are the contract; the axes are *why* the contract reads the way it does.*

| Stage | Check ID | Primary axis | What it enforces, agent-era framing |
|---|---|---|---|
| enforce | `boundaries-machine-enforced` | **AXIS 1 (Scope)** | Boundaries fossilized into machine gates — import/layer rules, the single-entry public-API module, lint-checked state classification, CI fitness functions, CODEOWNERS, the immune-system meta-rule — because the agent crosses boundaries for convenience (the deep import) and feels no cost, so a boundary in a head is already violated. |
| prune | `abstractions-pruned-and-state-reclassified` | **AXIS 2 (Two graphs)** + AXIS 3, AXIS 4 | The drift measured and pruned: extract/delete/keep per abstraction (flag-argument and escape-hatch tells), dead code / stale flags / stored derived state removed, the store-size thermometer re-read and drifted state reclassified — because the agent adds and never reclassifies, so the two graphs diverge invisibly. |
| conway | `module-edges-aligned-to-team-edges` | **AXIS 5 (Medium)** | Module edges aligned to team edges via the "who must be in the room to change X?" probe and inverse Conway — so the medium's friction is owned at a seam, not scattered, and the code's seams stop fighting the org's. |
| system | `design-system-is-a-real-artifact` | **AXIS 6 (Mind)** | The shared mental model externalized into a real, discoverable artifact — a living catalog with the four states as stories, tokens as the single source, ADRs as the living "why" — because the agent rots the doc and the model otherwise dies in the builder's head. |
| vitals | `architecture-vitals-healthy` | **AXES 5, 6 + the meta-principle + AXIS 7** | The steady-state health read: a newcomer ships on the docs alone in days not weeks; the store stays small, Nth-feature cost ≈ first, abstractions pruned not piled, module edges match team edges; and the optimizer's objective function passes the upstream ethics tests — because 1-to-N has no exit, so health signs replace exit criteria. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this import a legitimate cross-boundary use or a leak, is this abstraction load-bearing or a coincidence, is this store slice really global or drifted server-cache, is the boundary in the right place — climb one rung at a time rather than guessing silently:

```
pick the DEFAULT for a clearly low-stakes structural choice (delete-and-duplicate the ambiguous abstraction;
classify the new state to the smallest/most-local bucket; leave the boundary where it is and add a rule)
   → wrapped: make the choice reversible and small — a rule you can relax, an inline you can re-extract once the
     rule of three is met, a reclassification the store-size thermometer will confirm or refute
      → check it against the gate: does the structure still pass the fitness functions and the import rules?
        (enforcing a boundary shouldn't change behavior — if it does, the boundary was load-bearing in a way
        you hadn't named)
         → ask the user one sharp question — they own the calls structure can't settle: which boundary is
           load-bearing, is this abstraction worth keeping, should the team structure change to fit the
           architecture (inverse Conway), and — for AXIS 7 — what is this system's objective function actually
           serving
            → if still unresolved, default to the MORE-ENFORCED, smaller-source-of-truth, more-reversible option
              (machine-gated over remembered, duplication over a wrong abstraction, a local bucket over the global
              store) and record the residual as a maintenance note for the user.
```

The asymmetry that governs the ladder: **an over-cautious structural choice costs the agent a little duplication or a slightly stricter rule; a leaked boundary, a wrong abstraction, or a swelling store costs every future maintainer — now mostly agent sessions — the entropy tax on every change, for the life of the system.** When the call is a genuine toss-up, err toward machine-enforced, small, and reversible. See [enforce-boundaries.md](enforce-boundaries.md) and [prune.md](prune.md) for the routers, and [../SKILL.md](../SKILL.md) for the stage order these gates run in. And remember: 1-to-N has **no exit** — the vitals replace it, and every rule you leave in human memory is one the next session, human or agent, will break.

---

## The suite thesis

Frontend's correctness spec does not live in a document. It lives in a human nervous system — a perceptual clock that ticks in neurons, a mental model that decides what "right" feels like — and that part of the spec cannot be formalized, cannot be tested, and therefore **cannot be outsourced.** This is why taste is *load-bearing* in frontend and not in, say, compilers: not because frontend engineers are more sentimental, but because a chunk of the ground truth is simply not in the machine.

So as the agent writes more and more of the code, the part that commoditizes is "typing" — and the part that *appreciates* is the work on this membrane between machine and mind. The master's leverage migrates from the keyboard to that membrane. The questions stop being "how do I write this code" and become the four that `bulwark` gates: **which boundary is load-bearing** (scope), **whose source of truth is this** (the two graphs), **what causal story will form in the user's head** (mind), and **whose interest does my optimizer actually serve** (ethics). The agent will add the feature, cross the boundary, store the derived value, rot the doc, and optimize the metric — feeling none of the cost. You keep the call it cannot make, and you move it out of your own memory and into a gate the machine refuses to merge without. That is how the architecture survives its own creators.

# The Membrane — the Seven Axes for the Agent Era

This is the heart of `seaworthy` — the seven structural axes a modern frontend rides on, each re-read for the moment an agent writes the code and a human mostly reviews, ships, and lives with the result. It is opened at the **start** of the skill (alongside [../SKILL.md](../SKILL.md)) and kept open at **every GATE**: before you certify a stage, re-read the axis that governs it. The other references teach you *how* to execute each piece — [four-states.md](four-states.md) (the per-slice acceptance bar), [illusion-maintenance.md](illusion-maintenance.md) (optimistic UI, causal animation), [accessibility-and-performance.md](accessibility-and-performance.md) (the second render tree and the perf budget). This one names *why the work is structured the way it is* — and for `seaworthy` it leads with, and goes deepest on, the **mind axis**, because the building stage of a frontend is governed by one fact the agent cannot perceive: **what you ship is not a correct program, it is a maintained illusion of direct manipulation over a real, asynchronous, failing system.**

The frontend is not a domain. It is a *boundary* — two boundaries stacked. On the machine side, a network/trust partition (the data lives elsewhere; the client cannot be trusted): that side is just distributed computing with a latency-and-trust edge, and it has no special difficulty. The irreducible part, the thing no other branch of software must face, is the *other* line: the partition between machine and mind. That is the membrane. Every axis below lands on one side of it or the other, and the agent-era failure mode is always the same — **the agent is blind to the mind side**, because the correctness spec there does not live in any document; it lives in a human nervous system. Read this as a pre-flight scan and a cockpit checklist, not an essay.

---

## PRE-FLIGHT — run this one line before you build or judge a slice

> **Ask of every slice: "what causal story forms in the user's head when this works, when it breaks, when it's slow, and when it's mis-clicked — and does the slice maintain that story, or only the happy one?"** The agent writes the fetch-and-render, the test passes on the data case, and it stops — leaving loading/error/empty/edge as `// TODO`, because the happy path turns green and the failure states earn no reward. But the product is the *whole* story, and the failure states are where the user's trust is won or lost. **The agent's "done" is the 40% mark.** Cleverness, a silent optimistic update, a decorative animation that lies about cause, a deferred keyboard path, a perf regression — each is invisible to a passing test and each tears the membrane, and the agent that wrote them felt *zero* cost, because it has no perception clock and no trust to lose. The whole job of this skill is to move quality out of "the data case renders" and into "the membrane holds in the storm." Everything below is a consequence of that.

---

## How each card is built

Every axis is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the author *felt* the jank, dreaded the 3 a.m. debug, and got a flicker of doubt at an unhandled failure.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and gate instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent building or auditing a feature on a human's behalf.

Decision forks inside a card use the same engine throughout the suite: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end. Tools are named only as *examples* of a class — a TanStack-Query-class cache library, MSW for boundary mocking, XState for statecharts, `eslint-plugin-boundaries` / `dependency-cruiser` for boundary enforcement. Never mandate one; the axis is the point, the tool is a means.

---

## AXIS 1 — MIND: direct manipulation is a lie, so you ship a maintained illusion, not a correct program

> **The spine of `seaworthy`. If you internalize only one card, internalize this one — the other six are the structure beneath it, but this is the one the building stage is *about*.** Gates: all four — [`four-states-designed`](#gate-map), [`illusion-maintenance-applied`](#gate-map), [`accessibility-built-in`](#gate-map), [`performance-budget-enforced`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The frontend is the one branch of software whose correctness spec is **not in any document** — not a language standard, not ACID, not an RFC — but in a wet human nervous system, written in neurophysiology. The thresholds are hard constants, not SLAs: ~100ms reads as *"I touched it directly"*, ~1s as *"it's working but I notice"*, ~10s as *"my attention is gone"*; a steady 100ms beats a jittery 50ms. A human author *felt* this — they felt the jank, felt the spinner flash, felt "I clicked and nothing happened then it jumped." That felt sense was the governor: it pushed them to maintain a coherent **causal story in the user's head against the machine's true asynchronous, failing nature**. "Direct manipulation" — dragging the file, flipping the switch — was understood as the lie it is: you are sending a message to a possibly-distant, possibly-failing, thoroughly async system. So a class of "best practices" was, to a careful author, *illusion-maintenance*: optimistic updates tell the likely truth before it's confirmed; animation is causal narrative (this new thing came from that click); loading and error states are the honest confession when the illusion can't hold. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **has no nervous system and no perception clock**, so the entire mind-side spec is invisible to it. It ships the happy path — the data renders, the test is green — and calls it done, because the failure states earn no reward and it cannot *feel* the broken causal story it leaves behind. It treats a silent optimistic update with no rollback as fine (it never feels the betrayal of "it said it saved and it didn't"); it adds motion that *lies* about causality and calls it polish; it cannot tell a 50ms spinner-flash from a smooth load, because both pass. This **SHARPENS "maintain the illusion" from a craft instinct into the entire premise of the building stage**: the property that makes a feature trustworthy — the user's causal story stays whole through success, failure, emptiness, and slowness — is exactly the property the agent is structurally blind to. Its "done" is the 40% mark. |
| **THE DESIGN CONSEQUENCE** | The unhappy paths are **not a polish pass — they ARE the product**, and they are designed *first*, per slice, and gated — because the polish pass that's supposed to add them never gets the time, and when the deadline bites, it's the unhappy paths that get cut. The work object was never the DOM; it is **the causal chain in the user's head**, and DOM/state/CSS are implementation details that exist to maintain it. And the difficulty is structural, not accidental: see Axis 1b. |
| **DO THIS** | Before building, list what the user *thinks* is happening vs what *actually* is, at each moment of the slice — every gap is illusion-maintenance work (an optimistic update, an animation, a loading state). Then design the four states (loading/error/empty/edge) as first-class, the rollback, the keyboard path, and the perf number *before or with* the happy path, never after. The acceptance question is not "does the data case render" but "what story forms in the user's head when this breaks — and do I maintain it?" |

> Anti-pattern this card kills: **"happy path shipped as done."** It is 40% done. The membrane holds in the storm or it doesn't, and the agent cannot feel the storm.

---

## AXIS 1b — MIND, the structural difficulty: two conflicting "corrects" — machine-correct vs mind-correct

> The reason the mind axis can't be reduced to engineering *or* to design. Gate: [`illusion-maintenance-applied`](#gate-map) (this is where the negotiation cashes out in code), with [`performance-budget-enforced`](#gate-map) on the perception side.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A skilled author knew the membrane has **two sides that define "correct" incompatibly**, and that almost every interesting frontend decision is a negotiation between them. **Machine-correct** wants: minimal source of truth, pure functions, consistent data, *never show unconfirmed state*. **Mind-correct** wants: instant feedback, causal continuity, *the reassuring lie shown before the truth is confirmed*. These pull in opposite directions. An optimistic update is machine-*incorrect* (you displayed data the server hasn't confirmed) and mind-*correct*. A "strictly correct" list that re-sorts on every keystroke is data-flawless and a mind-side disaster (it flickers and jumps). The author negotiated this consciously, slice by slice. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent optimizes for the side it can *measure* — machine-correct, because that's what the test asserts and the type-checker proves — and is blind to the side it must *feel*. So it defaults to one of two failures: it shows the honest-but-jarring truth (a spinner on every keystroke, no optimistic feedback, a list that thrashes) because that's machine-clean; or, worse, it fakes the reassuring lie *dishonestly* (an optimistic update with no rollback) because faking it looks like the mind-correct move and the missing failure branch never turns red. It cannot run the negotiation, because it can't perceive one of the two parties. |
| **THE DESIGN CONSEQUENCE** | Each consequential interaction needs a **deliberate machine-correct-vs-mind-correct call**, and the call is the human's — it's taste, and taste is load-bearing here precisely because one of the two correctness specs lives in a nervous system and can't be formalized. The governing ethic, which is the ethics axis (Axis 7) landing in code: **don't lie about things with consequences.** Cheap / reversible / high-frequency → optimistic (mind-correct wins, the lie is harmless). Consequential / irreversible → honest pending (machine-correct wins, the truth must be shown). |
| **DO THIS** | For every mutation, place it on the cheap-reversible ↔ consequential-irreversible axis, then resolve the two corrects deliberately (the fork below). Never let the agent pick by default — its default silently betrays one side. Read the user's fluency and *name the call* in their language ("is this safe to fake optimistically?"), because a "feel" judgment they can't weigh in on is taste imposed, not shared. |

**Decision fork — be optimistic (mind-correct), or honestly wait (machine-correct)?**

- **PREDICATE:** is this action cheap, reversible, and high-frequency (a like, a toggle, a reorder), AND does it land in the "instant" (<100ms expected) perception tier from `bearings`'s contract?
- **DEFAULT** on a coin-flip: **honestly wait** — show a real pending state. The reassuring lie is only worth telling when you can *take it back cleanly*; when you're unsure you can, the honest confession beats a lie you can't retract.
- **FALLBACK** when you can't yet tell if the action is reversible: treat it as consequential and wait honestly. The asymmetry: an unneeded spinner costs the user a moment of patience; a silently-failed optimistic update on something irreversible costs them their trust and maybe their data.

---

## AXIS 2 — STATE SYNCHRONIZATION: complexity comes from copies of the truth

> The machine-side root of bugs. Lands on the four states (the loading/error/empty/edge of each piece of state) and on the race edges. Gate: [`four-states-designed`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A frontend's hardest problem isn't drawing pixels, it's **keeping multiple copies of the same truth in sync** — DOM, in-memory model, server DB, URL, `localStorage`, component-local state. Most bugs aren't bad logic; they're copies drifting apart. The discipline: minimize the source of truth, *derive* everything else (filtered list = `filter(list, query)` computed live, never stored), because storing a derived value signs a contract to keep it in sync that you will eventually forget. The author felt that contract as future pain. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **stores derived state freely** — the classic "`useEffect` that copies one piece of state into another" — and copies server data into a local mirror without unease, because each duplicate makes the immediate thing work and it feels no future sync-bug it's planting. It also under-models the *states* of an async value: it writes the success case and treats loading/error/empty as afterthoughts, so the four states the next axis demands are missing by default. |
| **THE DESIGN CONSEQUENCE** | Every fetch-or-mutate slice has **at least four states beyond the happy one**, each a first-class design with a concrete bar (this is [four-states.md](four-states.md)): LOADING (no layout shift, first-load skeleton vs background-refresh, perception thresholds), ERROR (never lose input, recoverable vs not, scoped boundaries, reported), EMPTY (new vs filtered vs error), EDGE (0/1/many, slow/offline/stale). And the source of truth stays minimal: derived values are computed, not stored. |
| **DO THIS** | At STAGE 0 (States), enumerate the four states for the slice and design each to its bar before the happy path. Audit for "is this fact stored twice?" — if yes, one copy becomes derived or is deleted. The only legitimate copy of server state into local state is a *deliberate, explicitly-committed* draft (a form); name it as such. |

---

## AXIS 3 — IDENTITY: cross-time correspondence is where the abstraction leaks

> `UI = f(state)` leaks at identity, and identity is most ambiguous in lists — which is exactly the race/reorder corner of the edge states. Gate: [`four-states-designed`](#gate-map) (the edge cases).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Declarative rendering produces a *new* tree each state change, but the old DOM can't be thrown away — it holds focus, cursor position, scroll, in-flight animation. So the framework must answer a graph-matching question: *which new node is which old node?* `key` is where that abstraction leaks; the famous "array index as key" bug is an **identity error** — you told the framework "item 2 is the same thing" when the list reordered, so DOM state landed on the wrong data. A careful author knew bugs cluster in lists because lists are where identity is most ambiguous. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent reaches for index keys and re-render heuristics that *pass the data-case test* and silently corrupt identity under reorder, insertion, or an out-of-order response — the very edge cases it skips. It can't feel the misplaced cursor or the row that animated to the wrong data. |
| **THE DESIGN CONSEQUENCE** | Identity is an **edge-state concern that must be designed and tested**: stable keys tied to the data's real identity; and the **race edges** — rapid clicks, out-of-order responses — handled by *cancelling stale requests so an old response can't overwrite new data*. These are explicitly in the four-states edge bar. |
| **DO THIS** | At STAGE 0, in the edge list, test 0/1/many *plus* reorder, rapid clicks, and out-of-order responses; ensure keys carry true identity and stale requests are cancelled. Treat a list as the place identity breaks first. |

---

## AXIS 4 — THE TWO GRAPHS: the component tree is not the data-dependency graph

> Why "state management" is a category at all; and why the wrong scoping of state makes the four states harder to keep coherent. Mostly `wellspring`'s territory; here it informs how cleanly each slice's states can be expressed. Gate: [`four-states-designed`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The component tree is shaped for *visual nesting*; the data-dependency graph is an arbitrary DAG. When they don't match, a state is needed by distant cousins or a deep leaf far from its source, and prop-drilling is the symptom of forcing DAG-shaped data through tree-shaped pipes. Each state-management tool is a *side channel* letting data flow along dependency lines instead of tree lines. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent reaches for a global store reflexively (it looks like "real" state management) and over-shares state, so a single slice's loading/error/empty becomes entangled with unrelated components and the failure states get harder to reason about and to keep coherent. |
| **THE DESIGN CONSEQUENCE** | Prefer composition (lift content, pass children/slots) to bypass intermediate layers; reach for a side channel (context for low-frequency stable values, a selector-based store/signals for high-frequency) *only* when the tree genuinely can't express the dependency. Keep shared state small so each slice's four states stay locally coherent. |
| **DO THIS** | When wiring a slice, default to composition; if you're tempted by a global store, first ask whether lifting content resolves it. Keep the slice's state local enough that its four states are testable in isolation. |

---

## AXIS 5 — SCOPE: every CSS methodology is a disguised scoping strategy

> CSS is a single global namespace with cascade-based conflict resolution — "spooky action at a distance." Relevant to `seaworthy` mainly as: scoped, themeable styles that don't leak across slices, and skeleton dimensions that protect against layout shift. Gate: [`performance-budget-enforced`](#gate-map) (CLS) and [`four-states-designed`](#gate-map) (skeleton dimensions).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS lacks lexical scope, so a class written anywhere can affect any element; every methodology (BEM, CSS Modules, CSS-in-JS, atomic/Tailwind) is a way to *recover scope*. The author chose a scoping strategy deliberately, knowing the trade (cascade expressiveness vs scope safety). |
| **WHAT CHANGED IN THE AGENT ERA** | The agent writes styles that *look* right on the slice it's building and leak globally — a selector that wins by accident, a magic dimension that doesn't match the final content. It can't feel the layout shift (CLS) when the skeleton and content differ, because the jump happens in a nervous system it doesn't have. |
| **THE DESIGN CONSEQUENCE** | Styles stay scoped and themeable per slice; and the **skeleton's dimensions must match the final content** so the loading→loaded transition causes no layout shift — a perception/CLS requirement that is both a four-states bar and a perf-budget number. |
| **DO THIS** | At STAGE 0 and STAGE 3, match skeleton dimensions to final content (protect CLS); keep styling scoped so one slice can't leak into another's states. |

---

## AXIS 6 — MEDIUM: the document/application impedance mismatch

> The Web platform was built for linked documents; we build applications on it. For `seaworthy` this surfaces as: which platform-native behaviors (keyboard, focus, the back button, accessibility) you keep vs re-implement — i.e. the *reach* stage. Gate: [`accessibility-built-in`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Choosing an architecture is choosing *which free platform capabilities you keep and which you hand-rebuild* — URL-as-state, the back button, scroll restoration, **accessibility**, focus management. The platform ships a whole second render tree (the accessibility tree, the keyboard model) for free; re-implementing it badly is the SPA tax. A human author treated accessibility as built-in from the first slice because retrofitting it costs several times more — and it's an inclusion/ethics issue, not just a technical one. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent leaves accessibility for "later," reaches for `<div role="button" tabindex=0 onKeyDown=...>` over a real `<button>`, and never manages focus, because none of it turns the happy-path test red — and it can't *be* a keyboard-only or screen-reader user, so the broken second render tree is invisible to it. |
| **THE DESIGN CONSEQUENCE** | Accessibility is **built in per slice, not bolted on** (this is [accessibility-and-performance.md](accessibility-and-performance.md)): semantic HTML first; the executable check — *unplug the mouse and complete the key path with the keyboard alone* — run per slice; focus *managed* (modal opens → focus moves in and is trapped; closes → returns to trigger); ARIA only when native semantics genuinely fall short. Made a gate: an axe-style checker in CI plus a key-path keyboard-walkthrough line on the PR. |
| **DO THIS** | At STAGE 2 (Reach), unplug the mouse and walk the key path with the keyboard; if you can't, it's broken. Prefer native semantics; manage focus on every route change / modal / async completion; gate it in CI. |

---

## AXIS 7 — ETHICS: friction is the moral primitive; the optimizer serves whoever the loss function names

> The same levers that *maintain* a mind model can *manipulate* it — it's one set of knobs, aimed at a different target. For `seaworthy` this lands narrowly but sharply: don't lie about consequential actions, and honor `prefers-reduced-motion`. Gate: [`illusion-maintenance-applied`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The membrane is *constitutively asymmetric*: the builder knows every mechanism, has time, runs A/B tests, holds aggregate data on millions; the user is one person, in real time, often tired, at 3 a.m. So **where you put friction is your ethics** — good design aligns "easy" with the user's goal; manipulation aligns "easy" with the builder's, exactly where they diverge. Manipulation isn't "having influence" (a button's position influences); it's *bypassing the user's agency* — acting in the pre-rational layer (the 100ms, the default, the pre-attentive jump) on a choice they wouldn't endorse on reflection. The interface structurally sits on the *impulsive* self, because that's the self that moves the metric. |
| **WHAT CHANGED IN THE AGENT ERA** | Most dark patterns aren't *designed* anymore — they're *optimized into existence*. A/B testing is gradient descent on a business metric; point it at "engagement" and hand it the whole pre-rational toolkit and it *finds* manipulation as a local optimum, with no person deciding to be evil. In the agent era the optimizer gets stronger, per-person, real-time — and the agent, optimizing whatever it's told to, will follow the gradient straight into manipulation unless a guardrail stops it, feeling none of the harm. |
| **THE DESIGN CONSEQUENCE** | At the slice level `seaworthy` enforces the narrow, concrete corner of this: **don't lie about things with consequences** (consequential/irreversible actions get an honest pending state, never the reassuring optimistic lie) and **honor `prefers-reduced-motion`** (motion is causal narrative *and* an accessibility/ethics setting). The broader stance — the loss function, the friction audit, the guardrails — is set upstream (it's the suite's `keel`/`lookout` work); here it cashes out as *the optimistic-vs-honest call is an ethical call*, not just a UX one. |
| **DO THIS** | When deciding to fake an action optimistically, ask whose interest the lie serves and whether the user would endorse it on reflection; for anything consequential, wait honestly. Always honor `prefers-reduced-motion`. Delete decorative motion that narrates no causality — at best noise, at worst a lie about cause. |

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs. The mind axis (1/1b) runs through all four — it is the spine — while 2–7 each sharpen one specific gate.*

Read down this table at the corresponding GATE: it tells you which axis you are actually enforcing and what "done" means for a feature built by an agent. The checks are the contract; the axes are *why* the contract reads the way it does.

| Stage | Check ID | Primary axis(es) | What it enforces, agent-era framing |
|---|---|---|---|
| states | `four-states-designed` | **AXIS 1 (mind)**, AXIS 2 (state), AXIS 3 (identity), AXIS 4 (two graphs), AXIS 5 (scope) | Loading/error/empty/edge designed as first-class to their bars (no-shift skeleton with matched dimensions, input-preserving errors, the three empties, the 0/1/many *and* race/reorder edges with stale-request cancellation) — because the agent ships the happy path as "done" at the 40% mark and can't feel the broken causal story, the misplaced identity, or the layout shift. |
| illusion | `illusion-maintenance-applied` | **AXIS 1/1b (mind)**, AXIS 7 (ethics) | Optimistic updates *with rollback and a user-facing failure message*; the cheap/reversible→optimistic vs consequential→honest-wait call; animation as causal narrative from/to its source; `prefers-reduced-motion` honored — because the agent fakes failure dishonestly or not at all, can't run the machine-correct-vs-mind-correct negotiation, and a silent optimistic update is a trust-corroding lie it can't feel. |
| reach | `accessibility-built-in` | **AXIS 6 (medium)**, AXIS 1 (mind) | Semantic HTML first; the unplug-the-mouse keyboard walk per slice; focus managed; ARIA only when semantics fall short; axe-in-CI + keyboard-walkthrough on the PR — because the agent defers a11y, prefers `div role=button` over `<button>`, and can't be a keyboard/screen-reader user, so the second render tree is invisible to it. |
| budget | `performance-budget-enforced` | **AXIS 1 (mind perception)**, AXIS 5 (scope/CLS) | INP < 200ms, LCP < 2.5s, CLS < 0.1, per-route bundle budget, enforced red-on-regression in the PR that caused it; don't blank on refetch, match skeleton dimensions, code-split, lazy-load, keep interaction main-thread work under ~50ms — because "feels fast" lives in a nervous system the agent has no access to, so it must be a number CI enforces, not a feeling it's trusted to have. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this action safe to fake optimistically, is this animation honest, is this perception threshold met, is this "feels right" — climb one rung at a time rather than guessing silently:

```
pick the DEFAULT for a clearly low-stakes mind-side call (honest-wait over the optimistic lie, the
  plain transition over the clever one, the real <button> over the ARIA contraption)
   → wrapped: make it reversible and small — an optimistic update you can roll back cleanly, a slice
     you can ship or pull on its own
      → check it against the four states and the perf number: do loading/error/empty/edge each hold,
        and is the budget green in CI? (a "feel" that fails a hard number is not a toss-up — it's a finding)
         → ask the user one sharp question — they own the trade-offs taste can't settle, in THEIR language:
           is this action safe to fake optimistically, is this motion honest about cause, what does
           "feels right" mean for this interaction (the machine-correct-vs-mind-correct call and the
           cheap-vs-consequential call bottom out here, because one side lives in their nervous system)
            → if still unresolved, default to the HONEST, machine-correct-but-jarring option (the real
              pending state, no unconfirmed data, the plain transition) and record the residual as a
              perception/ethics note for the user.
```

The asymmetry that governs the ladder: **an over-honest mind-side call costs the user a moment of patience or a touch of polish; a dishonest one — a silent optimistic failure, an animation that lies about cause, a perf regression shipped green, an inaccessible key path — costs the user their trust, on every use, for the life of the feature, and the agent felt none of it.** When the call is a genuine toss-up, err toward honest, accessible, and within budget. See [../SKILL.md](../SKILL.md) for the stage order these gates run in, and [illusion-maintenance.md](illusion-maintenance.md) / [four-states.md](four-states.md) / [accessibility-and-performance.md](accessibility-and-performance.md) for how to execute each.

---

## The suite thesis

The frontend is the one branch of software whose correctness spec does not live in any document — it lives in a human nervous system. That is why **taste is load-bearing here and cannot be outsourced**: machine-correct can be proven by a type-checker and a test, but mind-correct — the causal story in the user's head, the threshold at which a load "feels instant," the line between an honest optimistic update and a manipulative one — is written in neurophysiology, and no test can capture it. So as the agent writes more and more of the code, the part that is "typing" gets commoditized, and the part that *appreciates in value* is exactly the work on this membrane. The leverage migrates from the keyboard to the membrane between machine and mind — and the master asks less and less "how do I write this code" and more and more: **which boundary is this, whose source of truth is this state, what causal story forms in the user's head on this click, and whose interest does my optimizer actually serve.** That is what `seaworthy` gates, slice by slice, building the unhappy paths first — because they are the product, and they are the part the agent cannot feel.

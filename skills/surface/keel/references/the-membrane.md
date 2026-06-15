# The Membrane — the Seven Axes at the Seams

This is the heart of `keel`. Frontend is not a layer of a system — it is a *boundary*, and in fact two boundaries stacked: toward the machine, a **network / trust** partition (the data lives elsewhere, the client cannot be trusted); toward the person, a **machine / mind** partition (the only correctness spec lives in a wet human nervous system). The whole `surface` suite rests on seven axes that cut across those two lines — **state-synchronization, identity, the two graphs, scope, medium, mind, ethics**. Every sibling `the-membrane.md` carries the same seven; each skill *leads with* the axes its stage actually exercises and goes deepest there. For `keel`, the stage is the moment paper meets reality, so this doc **leads with the medium axis (the document-vs-application impedance) and the network / trust boundary** — because that is the literal definition of a seam: *a place where two systems with different assumptions meet, and the membrane is thinnest, and so it breaks first.* The project does not die in a hard component; it dies at the seam. Open this at STAGE 0 alongside [seam-checklist.md](seam-checklist.md), and re-read the governing axis at every GATE before you certify it.

The classic walking-skeleton canon — prove it end to end, cross every integration point, don't build wide on mocks — is all still correct; it was written for an author who *felt the cliff of the last 10%*, who got a flicker of dread shipping something that only ran on localhost, who knew a hand-copied type would rot. **None of those feelings survive contact with an agent.** The agent builds wide on mock data because that turns green fast and it feels none of the deadline cliff; it mocks a shape that disagrees with reality without unease; it skips the seams that earn no green (CI, preview, error tracking, rollback) because they are invisible to "the feature works." This doc re-aims each axis for that author and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## PRE-FLIGHT — run this one line before you lay a single timber

> **Ask of the skeleton: "did this slice give *every real seam* at least one chance to leak, on a real deploy, on day one?"** A seam the skeleton does not cross is one you have *chosen* to first exercise under the most time pressure you will ever have. Mock-built "completeness" is a lie about how much integration risk remains — "looks 90% done" almost always means 100% of the integration risk is still live, parked at the deadline. The membrane is thinnest where two systems meet; the skeleton's whole job is to puncture each of those points while the puncture is free to patch. **Build deep through every seam first, not wide across static pages — and gate it, because the agent feels none of the cliff it is walking you toward.**

---

## How each card is built

Every axis is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the premise that held when the author felt the cost of an un-crossed seam: the dread of the last 10%, the wrongness of "works on my machine."
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it (almost always: the broken thing earns no green, and the agent feels no future cost).
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and **gate** instead of trust to an instinct the agent lacks.
- **DO THIS** — one literal move you execute on the skeleton, phrased for an agent wiring a build on a human's behalf.

Genuinely-ambiguous calls inside a card use the same engine as the rest of the suite: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## AXIS — MEDIUM: the document-vs-application impedance mismatch (lead axis)

> **The historical root of every seam. The web platform was built for linked *documents*; we build *applications* on top of it.** Gate: [`seams-enumerated-and-pierced`](#gate-map), [`walking-skeleton-accepted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Routing, the back button, forms, the page-vs-view distinction, scroll restoration, URL-as-state — every one of these is friction squeezed out of running an application on a document medium. An author who hand-rebuilt the back button, or hand-restored scroll, *felt* the impedance: the twenty-year SPA → SSR → RSC pendulum is that mismatch swinging, and choosing an architecture is choosing *which platform freebies you keep and which you rebuild by hand* (usually worse). The render/hydration boundary — server-render → hydrate → interactive — is the sharpest edge of the medium: a classic ship-day killer, felt by anyone who has watched a hydration mismatch detonate in prod. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent stands up the application UI against mock data and *never crosses the medium's real edges* — because static pages turn green and hydration, SSR/RSC boundaries, and deploy-environment quirks earn no green until something breaks far downstream. It will happily reinvent the browser inside an SPA, and reinvent it worse, without feeling the tax. Hydration mismatch is the canonical case: it passes every component test, looks perfect on localhost, and only mismatches on the real server-rendered → client-hydrated round-trip the agent had no reason to exercise. This **SHARPENS "prove the medium's edges" from good advice into the whole premise of the skeleton**: the seams the agent skips *are* the medium's edges. |
| **THE DESIGN CONSEQUENCE** | The render/hydration seam, the deploy seam, and the config seam are **enumerated and pierced by the skeleton**, not deferred. For SSR/RSC/islands, the skeleton must prove server-render → hydrate → interactive with **no mismatch** — on a real deploy environment, not localhost (localhost has proved nothing about prod). The slice must run on a deploy environment whose config (env, secrets) **mirrors prod**, because the medium's worst leaks live in the local-vs-preview-vs-prod differences. |
| **DO THIS** | At Seams, list the medium's edges this architecture actually has (build/dev, render/hydration, deploy, config/secrets) and require the slice to cross each. At Floor, verify the slice ran user-action → server → screen *on a deploy environment*, that hydration showed no mismatch, and that preview/staging config mirrors prod. If the slice never left localhost, it has not crossed the medium — it does not count. |

> Anti-pattern this card kills: **"it works on localhost."** The medium's real edges — hydration, the deploy environment, prod config — are exactly the ones localhost cannot exercise, and exactly the ones that detonate at the deadline.

---

## AXIS — TRUST BOUNDARY: the network / partition line (co-lead axis)

> **The other half of the seam. The data lives elsewhere; the client is hostile by default; the contract is the only thing holding the two halves' assumptions together.** Gate: [`contract-cannot-drift`](#gate-map), [`seams-enumerated-and-pierced`](#gate-map), [`walking-skeleton-accepted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Across the network line, the front-end and back-end each hold a copy of the same truth — the types, the auth shape, the error shape. An author who hand-copied a type from the API *felt* it go stale, felt the dread of "the contract doesn't line up," and treated auth (login → session → credentialed request → server-side validation) as the underrated, scary seam it is. Identity-synchronization across the network boundary was a known hazard, governed by the pain of the drift. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **mocks the network boundary with a shape that disagrees with reality** — the single most dangerous artifact in the build (green test, broken prod) — because a mock that returns plausible fake data turns the task green and the agent feels none of the future mismatch. It hand-copies types instead of generating them, and feels nothing as they rot. It treats auth as one more thing to stub past, never running the real token flow, because the happy-path UI is green without it. The trust line **leaks from compile-time guarantee to runtime surprise**, one convenient un-typed boundary at a time. This **SHARPENS "the contract is the deliverable" from craft into the law of this stage** — the toolchain is a commodity, the contract is not. |
| **THE DESIGN CONSEQUENCE** | Types are **generated from a single source** (a contract-generation pipeline — OpenAPI / GraphQL / tRPC-class) and wired into the build, so front-end and back-end types *cannot* be hand-written and drift. The executable acceptance test is hard: **change a field on the server, and the client must FAIL TO COMPILE.** If it doesn't, the contract is fake — you only hand-copied a snapshot that will silently go stale. **Stub impl is OK; stub contract is not:** an unbuilt backend may return fake data, but it must speak the *real* contract — real types, real auth shape, real error shape — and any network-mock (an MSW-class tool) is **backed by the generated schema** so it cannot drift from reality. The auth seam is run end to end (login → session → credentialed request → server-side validation) even against a stub. And the trust line has no exceptions: the client is hostile, so the validations the server owns are *re-done on the server*, not assumed because the typed client "wouldn't send that." |
| **DO THIS** | At Seams, name the data seam, the auth seam, and the state round-trip (fetch → cache → mutate → invalidate → re-render) and require the slice to cross each against a real-or-stub backend, types from the contract, **never raw mock data**. At Contract, wire generation into the build and run the field-change → compile-fail test; back every mock with the generated schema. At Floor, verify a server field change fails the client build and the slice passed through real auth. |

> Anti-pattern this card kills: **the mock that disagrees with reality, and the hand-copied type.** Both are green-today, broken-prod; the generated contract is the only thing that makes the field-change test fail honestly. **The framework is the reversible door; the contract is the one-way one — spend the week on the contract, not the framework.**

---

## AXIS — STATE-SYNCHRONIZATION: all complexity comes from a fact having multiple copies

> Gate: [`seams-enumerated-and-pierced`](#gate-map), [`vertical-slice-pierces-the-stack`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The same truth lives in many places at once — the DOM, the in-memory model, the server DB, the URL, localStorage, component-local state — and most bugs are not bad logic but *copies that fell out of sync*. The deepest case is **server state is a cache, not state**: data you don't own, that expires, needs revalidation, dedup, background refresh. The whole state round-trip — fetch → cache → mutate → invalidate → re-render — is the cache's life cycle, and an author felt it the first time two components each re-fetched "the current user." |
| **WHAT CHANGED IN THE AGENT ERA** | For `keel`, the failure is narrower than `wellspring`'s full classification but it bites here first: the agent will stand up state against mock data and **never run one real server-state round-trip**, so the cache life cycle — the part that actually leaks in prod (a mutation that doesn't invalidate, a stale view that never revalidates) — is never exercised. The round-trip earns no green beyond "the number rendered," so it is skipped. |
| **THE DESIGN CONSEQUENCE** | The skeleton must run **one full server-state round-trip** against the real-or-stub backend: fetch → cache → mutate → invalidate → re-render, with the cache mechanisms (a TanStack-Query-class library) actually wired, not faked. This is the single round-trip `keel` hands to `wellspring` to generalize into the whole state classification — so it must be *real*, not a mock that pretends. |
| **DO THIS** | At Seams, require the state seam in the list. At Slice, pick the slice so it forces a complete round-trip (the canonical "edit your own name, it persists and re-renders" does exactly this). Verify the mutation invalidates and the view re-renders from cache — not from a local copy you hand-synced. |

> Anti-pattern this card kills: **a state library bolted on but never round-tripped** — wired in name, faked in fact, so the cache life cycle first runs at the deadline.

---

## AXIS — IDENTITY: which node now is which node then

> Gate: [`contract-cannot-drift`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | `UI = f(state)` leaks at identity: when state changes, `f` yields a whole new tree, but the old DOM carries focus, cursor, scroll, animation — so the framework must match new-tree nodes to old-tree nodes, a graph-matching problem it solves with a heuristic (same position + same type = same node). `key` is where that abstraction leaks; the array-index-as-key bug is an *identity* error. At `keel`'s scale, the identity that bites is **identity-synchronization across the network boundary**: the front-end's "this type" and the back-end's "this type" must be the *same* identity, or they are two snapshots drifting apart. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent hand-writes the client type as a *separate* artifact from the server type and feels no cost, so the two "identities" silently diverge — the same drift the trust-boundary card names, read through the lens of *one identity, two representations*. |
| **THE DESIGN CONSEQUENCE** | Cross-network identity is established by **generation from one source**, so there is exactly one type-identity and the client cannot hold a stale twin. (Render-tree identity — `key`s, list reconciliation — is `wellspring`/`bulwark` territory; `keel` owns the network-line identity that the contract guarantees.) |
| **DO THIS** | At Contract, confirm the client and server types are *the same generated identity*, not two hand-maintained copies — verified by the same field-change → compile-fail test. |

> Anti-pattern this card kills: **two type-copies pretending to be one identity** — they pass review and rot in silence.

---

## AXIS — THE TWO GRAPHS: the component tree is not the data-dependency graph

> Gate: [`vertical-slice-pierces-the-stack`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG. State management exists only because the two shapes disagree — prop-drilling is the symptom of forcing DAG-shaped data through a tree-shaped pipe. |
| **WHAT CHANGED IN THE AGENT ERA** | At `keel` this is a light touch — the full data-flow discipline is `wellspring`'s — but the skeleton's one slice already crosses the two graphs once (data sourced in one place, consumed in another), and the agent will wire it with whatever turns green rather than along the real dependency edge. |
| **THE DESIGN CONSEQUENCE** | The slice's single data path is wired so it genuinely connects source to consumer through the real seam, proving the data can flow along its dependency edge at all — the minimal proof the two-graphs problem is solvable in this architecture before the build grows wide. |
| **DO THIS** | At Slice, ensure the chosen feature actually moves data from its source across the network seam to a consumer that isn't trivially co-located — so the path is real, not a local constant. Hand the generalization to `wellspring`. |

> Anti-pattern this card kills: **a slice whose "data" is a local constant** — it crosses no real dependency edge and proves nothing about the graphs.

---

## AXIS — SCOPE: CSS is a global namespace; every styling methodology is a disguised scope strategy

> Gate: [`seams-enumerated-and-pierced`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS has no lexical scope — a class written anywhere can hit any element (textbook spooky action at a distance), because the cascade was designed for documents. So every methodology is a scope strategy in disguise: BEM (hand-simulated encapsulation), CSS Modules (compile-time hashing), CSS-in-JS (component-boundary scope), atomic/Tailwind-class (abandon the cascade entirely). Choosing one is choosing *expressiveness vs scope safety*, consciously. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent treats styling as cosmetics that turn green on sight and never proves the *scope seam*: that the chosen strategy produces genuinely scoped, themeable output and that design tokens actually reach components. A token that looks wired but is really a copied number leaks at theme-change time, long after the green. |
| **THE DESIGN CONSEQUENCE** | The skeleton crosses the **style/scope seam**: the styling strategy produces scoped, themeable output, and **design tokens are executable** — change a token and every consumer changes, or the token isn't really wired in (it's a number someone copied, the visual cousin of the hand-copied type). |
| **DO THIS** | At Seams, require the style/scope seam. At Contract, treat tokens as a contract: change one and confirm consumers follow; if they don't, the token isn't wired. |

> Anti-pattern this card kills: **the design token that is secretly a copied magic number** — it can't drift loudly, only silently, exactly like a hand-copied type.

---

## AXIS — MIND: the spec lives in a nervous system; you deliver a maintained illusion

> Gate: [`vertical-slice-pierces-the-stack`](#gate-map) (the slice is the first place the illusion is even wired).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Frontend's correctness benchmark is a human perceptual-cognitive system whose spec is written in neurophysiology, not documents: 16ms is the flicker-fusion threshold, 100ms is "I touched it directly," 1s "still following," 10s "attention lost" — psychophysical constants, not SLAs. What you ship is not "a correct program" but a *maintained illusion of direct manipulation* over an async, failure-prone system. You cannot unit-test "feels responsive." |
| **WHAT CHANGED IN THE AGENT ERA** | At `keel` the mind axis is mostly `bearings`'s (the perceptual contract) and `bulwark`'s (the unhappy paths) — but it constrains the skeleton in one way the agent misses: the slice is the *first* place the illusion is wired at all, and the agent will wire only the happy path because loading/error/empty earn no green. The skeleton needn't be polished, but it must prove the round-trip the illusion later rides on. |
| **THE DESIGN CONSEQUENCE** | The slice proves the real user-action → server → screen path end to end, so the later illusion-maintenance work (optimistic update, skeletons, causal motion) has a *real* round-trip to attach to — not a mock that never fails, never lags, never errors. The perceptual judgment itself is not gated here; the structural path it needs is. |
| **DO THIS** | At Slice, keep the feature trivial in product value but structurally complete, so the path the mind axis later depends on is genuinely exercised. Hand perceptual gating to `bearings`/`bulwark`. |

> Anti-pattern this card kills: **a slice that only ever succeeds instantly** — it proves nothing about the async, failing reality the user's causal story must survive.

---

## AXIS — ETHICS: friction is the moral primitive; the optimizer serves someone

> Gate: [`walking-skeleton-accepted`](#gate-map) (observability + analytics are wired here, where the optimizer is born).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The membrane is constitutively asymmetric — the builder knows the mechanism, runs the A/B tests, holds aggregate data; the user is one tired person at 3 a.m. The same levers that *maintain* a mental model can *manipulate* it; dark patterns are mostly not authored, they are *optimized* — an A/B test is gradient descent on a business metric, and pointed at a nervous system it will find manipulation as a local optimum, with no one designing it. Friction is the moral primitive: where you put the ease is whose interest you serve. |
| **WHAT CHANGED IN THE AGENT ERA** | At `keel` the ethical *stance* is `bearings`'s (set the objective function before the dashboard exists to pull you). But `keel` wires the instruments that *become* the optimizer — error tracking, RUM, and the analytics/experiment plumbing — and the agent defers all of it because it earns no green, or wires it with no guardrails. A leak with no observability is invisible; an optimizer with no declared guardrail will, left running, drift toward whatever the metric rewards. |
| **THE DESIGN CONSEQUENCE** | The **observability seam is part of the skeleton, not a later chore**: error tracking + RUM wired *from* the skeleton, so any seam that leaks is immediately visible and so the perceptual metrics (the psychophysical constants encoded as numbers) are measured from day one. Where analytics/experiment plumbing is part of the architecture, it is wired with the `bearings` guardrails attached — the objective function is named, not left for the dashboard to choose. |
| **DO THIS** | At Seams, require the observability seam (don't defer it). At Floor, verify deployed-app errors land in error tracking. Hand the objective-function ethics audit to `bearings`; here, refuse to ship the skeleton with the optimizer's eyes (RUM, error tracking) unwired. |

> Anti-pattern this card kills: **deferring observability** — the green-less seam whose absence makes every other leak invisible, and the optimizer's birth with no one watching whose interest it serves.

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs. The checks are the contract; the axes are *why* the contract reads the way it does. Read down this table at the corresponding GATE.*

| Stage | Check ID | Primary axis / axes | What it enforces, agent-era framing |
|---|---|---|---|
| seams | `seams-enumerated-and-pierced` | **MEDIUM**, **TRUST BOUNDARY**, state-sync, scope, ethics | Every real seam (build/dev, data, auth, render/hydration, state round-trip, style/scope, deploy, observability, config/secrets) enumerated and required of the skeleton — because the agent builds wide on mocks and skips the green-less seams, and a seam not crossed day-one is one first crossed at the deadline. |
| slice | `vertical-slice-pierces-the-stack` | **state-sync**, the two graphs, mind, **MEDIUM** | One real-but-trivial feature that crosses auth + data + the full state round-trip + render + (deployed) deploy/config — the test: does it give *every* seam a chance to leak? — because mock-built completeness is a lie about remaining risk. |
| contract | `contract-cannot-drift` | **TRUST BOUNDARY**, identity, scope | Types generated from one source, field-change → client-fails-to-compile; stub-impl-OK-but-stub-contract-NOT; mocks schema-backed; tokens executable — because the agent hand-copies types and mocks shapes that disagree with reality, leaking the cross-network identity from compile-time to runtime. |
| floor | `walking-skeleton-accepted` | **MEDIUM**, **TRUST BOUNDARY**, ethics | All nine: real feature user→server→screen on a *deploy environment*, real auth, generated-contract data (field change fails build), CI gates merge, preview deploy per PR, errors in tracking, prod-mirroring config, minute-scale rollback, README-alone reproducibility (#9, the master gate) — because the agent's "done" is measured on mocks and localhost, and the build must not live in one human's head. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve it — *is this seam real in our setup; is a stub backend acceptable for now; is this contract genuine or a hand-copied type that will rot* — climb one rung at a time rather than guessing silently:

```
pick the DEFAULT for a clearly low-stakes seam call (cross it on the skeleton; a stub backend that speaks the real contract is fine)
   → wrapped: keep the slice trivial and reversible — the framework/build tool/style strategy are reversible doors (pick a boring,
     well-supported one in an hour), the contract and type-generation pipeline are the near-one-way door (spend the care there)
      → check it against the executable test: change a server field — does the client FAIL TO COMPILE? run the slice on a deploy
        environment, not localhost — does hydration mismatch, does prod-mirroring config hold? (a real seam either leaks or it doesn't)
         → ask the user one sharp question — the calls here are theirs: is this seam real in our setup, is a stub backend acceptable
           for now, is the contract's source of truth the API or hand-written types, is this throwaway that will never deploy
            → if still unresolved, default to CROSSING THE SEAM ON THE SKELETON anyway (the cost of crossing a not-quite-real seam
              early is an hour; the cost of a real seam first crossed at the deadline is the project) and record the residual.
```

The asymmetry that governs the ladder: **crossing a seam early costs the agent an hour of wiring that may turn out to be unneeded; a real seam first crossed at the deadline costs the project — because the integration risk it carried was paid at the moment you had the least time and the most on top of it.** When the call is a genuine toss-up, err toward crossing it now, on the thinnest real slice, on a real deploy. See [seam-checklist.md](seam-checklist.md) for the full catalogue of seams and how to find the ones your architecture adds, [contracts-that-cant-drift.md](contracts-that-cant-drift.md) for the generation pipeline and the field-change test, [skeleton-acceptance.md](skeleton-acceptance.md) for the nine-point gate, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

---

## The suite thesis

Frontend is the one discipline whose correctness spec does not live in any document — it lives in a wet human nervous system, where 16ms is a fusion threshold and 100ms is "I touched it directly," not an SLA. A piece of "correct" here can never be checked against a formal spec, so **taste is load-bearing, and it cannot be outsourced** to the agent, which has no access to the brain on the far side of the membrane. As the agent writes more of the code, the cheap part — typing — devalues, and the leverage migrates from the keyboard to **the membrane between machine and mind**. For `keel`, that membrane is read at its thinnest point — the seam — and the questions that survive automation are the ones the agent cannot feel its way to: *which boundary is this, whose source of truth holds across it, what causal story will form in the user's head when it leaks, and whose interest does the optimizer you just wired serve.* Cross every seam on the thinnest real slice, make the contract undriftable, and gate it — because the agent feels none of the cliff, and the cliff is exactly where the membrane breaks.

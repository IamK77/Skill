# The Seam Catalogue — every integration point, and what "pierced" means for each

This reference is the engine behind **STAGE 0 — Seams** of the [../SKILL.md](../SKILL.md) flight plan, and the depth behind its one check, **`seams-enumerated-and-pierced`**. It owns the *catalogue*: the full list of integration seams a frontend build really has, what counts as **piercing** each one, and how to find the seams a given architecture *adds* on top of the standard set. The contract mechanics live next door in [contracts-that-cant-drift.md](contracts-that-cant-drift.md); the nine-point acceptance gate in [skeleton-acceptance.md](skeleton-acceptance.md); the *why* — the seam as the thinnest point of the membrane — in [the-membrane.md](the-membrane.md). Open this one to *enumerate and cross*; route to the others to make the contract undriftable and to certify the slice.

The governing fact, inherited from the membrane and restated because every call below is judged against it:

> **A project almost never dies in a hard component — it dies at the SEAMS, the places where two systems with different assumptions meet. The skeleton's whole job is to puncture every one of them once, on day one, while the puncture is free to patch. A seam the skeleton does not cross is one you have *chosen* to first exercise under the most time pressure you will ever have.**

## The core principle — enumerate first, then pierce, then gate

A seam is an **integration point**: a boundary where your code hands off to, or takes a handoff from, another system — the bundler, the network, the auth server, the renderer's hydration step, the cache, the cascade, the deploy pipeline, the telemetry sink, the environment. Each is a place the membrane is thinnest, so each is where it breaks first. The method is three moves, in order, and the order is the whole point:

1. **Enumerate.** List every real seam *this architecture* has — the nine standard ones below, plus the ones your specific choices add (see [Finding the seams your architecture adds](#finding-the-seams-your-architecture-adds)). A seam you can't name is a risk you carry silently.
2. **Pierce.** Require the single skeleton slice to cross each one *for real* — real backend (even a stub), real auth flow, real deploy, real telemetry — never mock data standing in for the boundary.
3. **Gate.** Do not advance past the seams stage until every enumerated seam is both listed *and* required of the slice. That is `seams-enumerated-and-pierced`.

**"Pierced" is a high bar, and it is not "the feature works."** A seam is pierced only when the slice has exercised the *real* boundary at least once and given it a genuine chance to leak. The test for each seam below is phrased so you can answer it yes/no at the gate.

## The agent-era failure mode this counters

The classic walking-skeleton canon — cross every integration point, don't build wide on mocks — was written for an author who *felt the cliff of the last 10%*, got a flicker of dread shipping something that only ran on localhost, and knew a hand-copied type would rot. **None of those feelings survive contact with an agent.** Three habits follow, and each maps to a seam the agent skips:

- **It builds wide on mock data because that turns green fast.** It stands up every page's static UI against `mock` data — "looks 90% done!" — and feels none of the future cliff. But "done" measured on mocks is a lie about how much integration risk remains: the part it skipped (real auth, real deploy, the real contract) is exactly the part that kills projects, now parked at the deadline.
- **It mocks shapes that disagree with reality.** A mock that returns plausible fake data turns the task green; the agent feels nothing as the shape drifts from the real contract. Green test, broken prod — the most dangerous artifact in the build.
- **It skips the seams that earn no green.** CI, preview deploys, error tracking, config parity, rollback — each is invisible to "the feature works," so the agent defers them. Deferred seams are exactly the ones that leak in production, and a leak with no observability is invisible.

This is why the seams are **gated** rather than trusted to instinct: the agent will not enumerate them unprompted, and will not feel the cost of an un-crossed one. So you name them all, here, now.

---

## The nine standard seams

These nine are present in nearly every frontend build. For each: the boundary, what **piercing** it means (the yes/no test), and the agent-era leak it hides.

| # | Seam | The boundary | "Pierced" means (the test) | The leak it hides |
|---|---|---|---|---|
| 1 | **build/dev** | your source ↔ the toolchain | the toolchain really **builds**, **serves**, and **HMR** works on the real entry point | a build that only ever ran one file; HMR that breaks on the real module graph |
| 2 | **data (network)** | client ↔ backend over the wire | **one real API call** to a real-or-stub backend, **not mock data**, with types from the generated contract | a UI wired to a local constant that never crossed the network |
| 3 | **auth** | client ↔ identity/session authority | the **whole token flow**: login → session → credentialed request → **server-side** validation — even against a stub | the most underrated seam; the happy-path UI is green without it, and the auth edge detonates on ship day |
| 4 | **render/hydration** | server-rendered HTML ↔ client interactivity | for SSR/RSC/islands: server-render → **hydrate** → interactive with **no mismatch**, on a real deploy environment | passes every component test, looks perfect on localhost, mismatches only on the real round-trip — the classic ship-day killer |
| 5 | **state (round-trip)** | in-memory model ↔ server-owned truth (the cache) | **one full round-trip**: fetch → cache → mutate → invalidate → re-render, with the cache library actually wired | a state library bolted on in name but never round-tripped; a mutation that doesn't invalidate |
| 6 | **style/scope** | component styles ↔ the global CSS namespace + theme | the strategy produces **scoped, themeable** output, and **design tokens actually reach components** | a token that is secretly a copied magic number; leaks at theme-change time, long after the green |
| 7 | **deploy (CI/CD)** | commit ↔ a running prod-shaped environment | commit → CI (typecheck/lint/test/build) → a **preview/staging env that mirrors prod** | "it works on localhost" — which has proved nothing about prod |
| 8 | **observability** | the deployed app ↔ the telemetry sink | error tracking + RUM wired **from the skeleton**, so a leak is immediately visible | a green-less seam whose absence makes every other leak invisible |
| 9 | **config/secrets** | code ↔ environment (local/preview/prod) | env vars and secrets work **end to end**, and the local/preview/prod differences actually resolve | the medium's worst leaks live in the local-vs-preview-vs-prod gap |

A few of these carry extra weight and are worth the longer note.

**Auth (#3) is the most underrated seam.** The agent treats it as one more thing to stub past, because the happy-path UI renders without it. But auth is a *flow*, not a check: a token is issued, attached to a request, validated *on the server*, and refreshed or rejected. Pierce it by running the whole flow — even against a stub identity provider — so the token actually travels the wire and the server actually validates it. And the trust line has no exceptions: the client is hostile, so the validations the server owns are *re-done on the server*, never assumed because the typed client "wouldn't send that."

**Render/hydration (#4) is the medium's sharpest edge.** It exists only for SSR/RSC/islands; pure-SPA builds don't have it, and forcing it where it doesn't apply is over-application (see PREDICATE below). Where it *does* apply, it is the canonical agent miss: hydration mismatch passes every component test and only surfaces on the real server-render → client-hydrate round-trip on a deploy environment. Pierce it by proving that round-trip end to end with no mismatch — on the deploy env, not localhost.

**State (#5) is the one round-trip `keel` hands to `wellspring`.** The skeleton runs *one* complete server-state round-trip so the cache life cycle (the part that leaks in prod — a mutation that doesn't invalidate, a stale view that never revalidates) is exercised once. It must be *real* — the cache mechanisms (a TanStack-Query-class library) genuinely wired, the mutation genuinely invalidating, the view re-rendering *from cache*, not from a local copy you hand-synced. `wellspring` later generalizes this one round-trip into the whole state classification.

**Observability (#8) and the rest of the green-less cluster.** Observability, CI, preview, config parity, and rollback share a property: none of them earn green from "the feature works," so all of them get deferred — and all of them are where production leaks. They are part of the skeleton, not a later chore. Wire error tracking + RUM *from* the skeleton so the first leak you cause is the first leak you see.

---

## What "pierced" is NOT — the four near-misses

Each of these turns the gate green while leaving the seam un-crossed. They are the agent's reliable tells; refuse them.

| Looks pierced | Why it isn't | The real pierce |
|---|---|---|
| UI renders data from a `const` / `mock` array | the data never crossed the network seam | one real call to a real-or-stub backend, types from the contract |
| A mock returns plausible fake data | the mock shape can disagree with reality (green test, broken prod) | back the mock with the generated schema so it can't drift ([contracts-that-cant-drift.md](contracts-that-cant-drift.md)) |
| The slice runs on localhost | localhost cannot exercise hydration, deploy quirks, or prod config | run it on a real deploy environment whose config mirrors prod |
| The feature works, but auth was stubbed past | the token flow never ran end to end | run login → session → credentialed request → server-side validation, even against a stub |

The unifying tell: **the seam earned green without the real boundary ever being touched.** When a seam looks crossed, ask the membrane's one question — *did this slice give this seam a genuine chance to leak?* If the boundary it represents was faked, the answer is no.

---

## The canonical slice that pierces them all at once

You do not cross the seams nine times; you choose **one** slice that crosses them all. The canonical one, from the source:

> *"A logged-in user sees their own name fetched from the server, can edit it, and the change persists and re-renders."*

One sentence. Trace what it crosses: **auth** (logged-in), **data** (fetched from server), **state** (fetch → cache → the mutation → invalidate → re-render), **render** (it shows on screen), and — once deployed — **deploy** and **config**. Zero product value, complete structural coverage. *Looks empty, bones all present.* That is exactly the shape to aim for. (The slice's selection and its full acceptance test live in [skeleton-acceptance.md](skeleton-acceptance.md); here it is the proof that one trivial feature *can* pierce the whole catalogue.)

**Worked contrast — the filtered list, and why a derived-state slice fails the test.** A tempting "simple" slice is a search box over a product list: type a query, see the filtered results. It feels like it touches data and state. It doesn't pierce the catalogue:

- the list is a local `const`, so the **data seam** and **network** are never crossed;
- the filtered list is *derived* (`filter(list, query)` computed on the spot), so there is no server-state round-trip — no **state seam**;
- nothing logs in, so **auth** is untouched;
- it runs on localhost, so **deploy**, **config**, and **hydration** are all skipped.

It is green, it looks like progress, and it has crossed zero real seams. (Storing that derived filtered list instead of computing it is itself the first-class frontend bug — *minimize the source of truth, derive the rest* — but that is `wellspring`'s lens; here the point is only that a derived-state demo proves nothing about the seams.) Apply the test: **does the slice give *every* enumerated seam at least one chance to leak?** The filtered list fails; the edit-your-own-name slice passes.

---

## Finding the seams your architecture adds

The nine are the floor, not the ceiling. Your specific choices add seams, and the standard list will not name them — so derive them. The method: **wherever your architecture introduces a new system, a new boundary, or a new source of truth, there is a seam, and the skeleton must cross it.** Run these probes:

| Probe — "does this architecture have…" | If yes, the added seam | Pierce it by |
|---|---|---|
| a third-party service the client talks to directly (payments, maps, a feature-flag SDK) | a **third-party integration seam** — its real handshake, its failure mode | one real call against its sandbox, with its real error shape handled |
| realtime / collaborative / offline data (websockets, CRDTs, sync engines) | a **realtime/consistency seam** — the agent will stub it as request-response | one real subscribe → update → reconcile cycle |
| a server-side rendering boundary you didn't have before (you moved from SPA to RSC) | a sharper **render/hydration seam**, plus a **server-data seam** (data fetched on the server) | prove server-fetch → render → hydrate with no mismatch |
| a content/CMS or build-time data source (SSG, MDX, a headless CMS) | a **content seam** — build-time data that differs from runtime data | one real build pulling real content, deployed |
| internationalization, money, or timezones | a **locale/format seam** — formatting that differs across environments | one real value formatted under the real locale config on the deploy env |
| a monorepo or shared-package boundary | a **package/build-graph seam** — the shared lib really builds and resolves | the slice imports the shared package through the real build, not a path alias only the dev server knows |

The general rule: **name every place two systems with different assumptions meet.** If you can describe the boundary in a sentence ("the client hands a payment token to Stripe and trusts its webhook"), it is a seam, and you owe the skeleton a pierce of it.

> **PREDICATE / DEFAULT / FALLBACK for the genuinely-ambiguous "is this a real seam?" call:**
> - **PREDICATE** — *Does this boundary carry integration risk that localhost + mocks cannot exercise?* If yes, it is a real seam; require the pierce.
> - **DEFAULT (coin-flip)** — **cross it on the skeleton anyway.** The asymmetry governs: crossing a not-quite-real seam early costs the agent an hour of maybe-unneeded wiring; a real seam first crossed at the deadline costs the project.
> - **FALLBACK (can't answer yet)** — list it as a *candidate* seam now, mark it unresolved, and escalate one rung (ask the user: *is this seam real in our setup?*) rather than silently dropping it. The [escalation ladder in the-membrane.md](the-membrane.md#escalation-ladder--when-the-call-is-unclear) is the path. Never let an unanswered seam fall off the list — silence is how it ends up at the deadline.
>
> And the one over-application to avoid: **do not invent the render/hydration seam for a pure-SPA build, or a realtime seam for a request-response app.** A seam that isn't in your architecture isn't a seam to pierce; counting boundaries that don't exist is the same error as building wide on mocks, pointed the other way. Pierce the seams you *have*.

---

## How findings route

Enumerating and piercing the seams is the *start* of `keel`, not the end. Each seam's pierce feeds the stages downstream:

- **The data, auth, and state seams** → the slice ([skeleton-acceptance.md](skeleton-acceptance.md), STAGE 1) chooses the one feature that crosses all three at once, and the floor ([skeleton-acceptance.md](skeleton-acceptance.md), STAGE 3) certifies them on a deploy environment.
- **The data seam's types and any schema-backed mock** → the contract ([contracts-that-cant-drift.md](contracts-that-cant-drift.md), STAGE 2): "pierced" for the data seam only holds if the types come from a generated contract, so a server field change fails the client build. A pierce backed by hand-copied types is a fake pierce.
- **The style/scope seam's tokens** → also the contract: a design token is "pierced" only if it is *executable* — change it and every consumer changes; if it doesn't, it's a copied number, the visual cousin of the hand-copied type.
- **The deploy, observability, and config/secrets seams** → the floor's nine-point acceptance ([skeleton-acceptance.md](skeleton-acceptance.md)), where CI-gates-merge, preview-per-PR, errors-in-tracking, prod-mirroring-config, and minute-scale-rollback each become one of the nine conditions.
- **The state round-trip** → handed to **`wellspring`** to generalize from one cache life cycle into the whole state classification.
- **The general engineering floor** (version control, review, CI/CD plumbing) overlaps the engineering suite's `flightline`; `keel` owns the *frontend-specific* seams (hydration, the token flow, the design-token flow, the client/server state round-trip) and the contract across the network boundary. Route the general process setup there without duplicating it.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (why the seam is the thinnest point of the membrane; the medium and trust-boundary axes; the escalation ladder) · [contracts-that-cant-drift.md](contracts-that-cant-drift.md) (the generated contract and field-change → compile-fail test that make the data and token seams *really* pierced) · [skeleton-acceptance.md](skeleton-acceptance.md) (the canonical slice and the nine-point acceptance the pierced seams must pass) · [../SKILL.md](../SKILL.md) (the four-stage flight plan and the `seams-enumerated-and-pierced` gate this reference serves).

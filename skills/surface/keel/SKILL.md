---
name: keel
description: >
  The walking-skeleton lens for a frontend build: before you lay anything
  expensive on top, pierce every system-to-system SEAM with one real-but-trivial
  vertical slice, end to end, deployed. Use right after bearings, when starting to
  build, or when a build that grew wide on mock data is hitting integration pain.
  The one shift: a project almost never dies in a hard component — it dies at the
  SEAMS (front-end/back-end contract mismatch, hydration mismatch, an auth edge,
  config that differs in prod, the "last 10%" that becomes a cliff) — and the
  agent makes this worse by building wide on mock data ("looks 90% done") while
  the real integration risk it never touched waits for the deadline to detonate.
  So the skeleton is deliberately the thinnest possible feature that nonetheless
  passes through every real seam once, on the first day, when the cost to fix a
  leak is near zero. Triggers on "set up the project / scaffold", "walking
  skeleton / vertical slice", "wire the API / backend", "SSR hydration mismatch",
  "auth / session setup", "CI/CD / preview deploys", "the types are out of sync /
  contract drift", "it works locally but not in prod", "mock vs real data".
  Installs the seam checklist (every integration point this architecture really
  has), the one real-but-trivial slice that pierces the whole stack, the contract
  generated from a single source so types CANNOT drift (change a server field →
  the client fails to compile), and the nine-point acceptance gate that proves the
  build doesn't live in one person's head. The agent does the wiring; you keep the
  calls it cannot make — which seams are real, and whether the contract is genuine
  or a hand-copied type that will silently rot.
argument-hint: "[the project or architecture to prove end-to-end with a walking skeleton]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# keel

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The keel is the first timber laid and the spine every other timber joins to — lay it crooked and the whole hull is wrong. The walking skeleton is the keel of a frontend build: `keel` is the second skill of the `surface` suite, the lens you hold the moment code first meets reality, and its whole job is one thing — **pierce every seam between systems, prove it runs end to end, before you build anything expensive on top.** Its product is a *deployed, CI-green, real-but-trivial* vertical slice that has passed through every real integration point once. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing rule: real, but trivial.** Build *deep* first, not *wide*: one real page → one real fetch from a real (even stub) backend → render → deployed to a real environment → CI green — even if the feature is trivial enough to show one line of text from the server. The reason is structural: **the seams are the death zone.** A project rarely dies because a component was hard to write; it dies where two systems meet — the front-end/back-end contract that doesn't line up, the SSR hydration that mismatches, the auth edge case, the env config that's different in prod, the "last 10%" that turns into a cliff. Prove the whole pipeline end to end with the *simplest* feature and those risks surface on day one and get dismantled while fixing them is free. Build wide on mocks first and they all detonate together at the deadline.

This is where the agent era bites:
- **The agent builds wide on mock data, and mock completeness is fake.** It will happily stand up every page's static UI against `mock` data — "looks 90% done!" — because that turns green fast, and it feels none of the future cliff. But the part it skipped (real auth, real deploy, the real contract) is exactly the part that kills projects, now pushed to the moment you have the least time. **A "done" measured on mocks is a lie about how much risk remains.**
- **A stub implementation is fine; a stub contract is not.** When the backend isn't ready, the agent will mock it — and will cheerfully mock a *shape that doesn't match reality*, the single most dangerous kind of mock (green test, broken prod). The stub may fake the *logic*; it must speak the *true* contract — real types, real auth shape, real error shape.
- **The agent skips the seams that earn no green.** CI, preview deploys, error tracking, config parity, rollback — each is invisible to "the feature works," so the agent defers them, and deferred seams are the ones that leak in production. They are part of the skeleton, not a later chore.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart, here read through one axis above all: the *medium* (the document-vs-application impedance) and the network/trust boundary, because every seam is a place where two systems with different assumptions meet, and the membrane is thinnest — and breaks easiest — exactly there. Load it at the start, re-check at every gate. If `$ARGUMENTS` is a throwaway that will never deploy, this machinery is overkill — say so.

**Speak the user's language.** The calls here are the user's — is a stub backend acceptable for now, is this seam real in our setup, is the contract source of truth the API or hand-written types. Read their fluency and gloss a term on first use (a *seam* / integration point, a *walking skeleton*, *hydration*, a *contract* generated from OpenAPI/GraphQL/tRPC, *preview deploy*, *config parity*, MSW). A seam the user can't see named is a risk you carried silently.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `keel`, lean on the *medium* and the *network/trust boundary* axes — every seam is where the membrane is thinnest. Load at the start, re-check at every gate.
- [references/seam-checklist.md](references/seam-checklist.md) — the engine: the full catalogue of integration seams a frontend build really has (build/dev, data/network, auth, render/hydration, state round-trip, style/scope, deploy/CI, observability, config/secrets), what "pierced" means for each, and how to find the ones your architecture adds.
- [references/contracts-that-cant-drift.md](references/contracts-that-cant-drift.md) — generating types from a single source, the compile-fails-on-field-change acceptance test, stub-impl-ok-stub-contract-not, schema-backed mocks (MSW), and design tokens as an executable contract.
- [references/skeleton-acceptance.md](references/skeleton-acceptance.md) — the nine-point acceptance gate, the canonical real-but-trivial slice, the reproducibility gate (clone → run → deploy from the README alone), and the novice-vs-master "fake completeness" trap.
- [references/css-layout-and-space.md](references/css-layout-and-space.md) — the structural layout toolkit for the skeleton: box model and formatting contexts, positioning / containing block / stacking / z-index, Flexbox and Grid deep, and spacing systems (space-ownership coupling, logical properties, intrinsic/container-driven layout).

> **The arc is one slice, pierced through everything.** Four stages — seams · slice · contract · floor — take the paper decisions from `bearings` and prove they survive contact with reality: seams enumerates every integration point this architecture really has; slice builds the single thinnest feature that passes through all of them; contract makes the types impossible to drift; floor checks the nine acceptance conditions that prove the build is reproducible and doesn't live in one head. `keel` gates all four; `wellspring` (state architecture) is the next step, generalizing the slice's one server-state round-trip into the whole state classification.

---

## STAGE 0 — Seams (enumerate every integration point, then pierce it)

Open **[references/seam-checklist.md](references/seam-checklist.md)**. Before the feature, list the seams — the project's real death zone.

- **List the seams this architecture actually has, and require the skeleton to cross each.** The build/dev seam (the toolchain really builds, serves, HMR works); the **data seam** (one real API call to a real-or-stub backend — not mock data — with types from the contract); the **auth seam** (a real login → session → credentialed request → server-side validation, the most underrated seam — run the whole token flow even against a stub); the **render/hydration seam** (for SSR/RSC/islands, prove server-render → hydrate → interactive with no mismatch — the classic ship-day killer); the **state seam** (one full server-state round-trip: fetch → cache → mutate → invalidate → re-render); the **style/scope seam** (the styling strategy produces scoped, themeable output and tokens reach components); the **deploy seam** (commit → CI → a preview/staging env that mirrors prod); the **observability seam** (error tracking + RUM wired *from the skeleton* — defer it and a leak is invisible); the **config/secrets seam** (env vars and the local/preview/prod differences actually work end to end).
- **Miss a seam and it waits for the deadline.** Any real seam the skeleton doesn't cross is one you've chosen to first exercise under the most time pressure. Name them all now.

### GATE — clear before SLICE
1. `checklist check seams seams-enumerated-and-pierced`
2. `checklist verify seams`

---

## STAGE 1 — Slice (one real-but-trivial feature that pierces the whole stack)

Open **[references/skeleton-acceptance.md](references/skeleton-acceptance.md)** (the slice section). Pick the thinnest feature that is nonetheless structurally complete.

- **One sentence, whole stack.** A good skeleton feature is describable in a line but passes through the entire stack. The canonical one: *"a logged-in user sees their own name fetched from the server, can edit it, and the change persists and re-renders."* That single line crosses auth (logged-in), data (fetched from server), state (fetch → cache → the mutation → invalidate → re-render), render, and — once deployed — deploy and config. It has zero product value and complete structural coverage. That is exactly the shape: looks empty, bones all present.
- **The test for the slice:** does it give *every* seam at least one chance to leak? A slice that never touches auth, or never hits a real deploy, doesn't count.

### GATE — clear before CONTRACT
1. `checklist check slice vertical-slice-pierces-the-stack`
2. `checklist verify slice`

---

## STAGE 2 — Contract (make the types impossible to drift)

Open **[references/contracts-that-cant-drift.md](references/contracts-that-cant-drift.md)** — the real deliverable of this stage. The toolchain is a commodity; the contract is not.

- **Generate types from a single source, wired into the build.** OpenAPI / GraphQL / tRPC — so the front-end and back-end types *cannot* each be hand-written and drift apart (this is identity-synchronization across the network boundary). The executable acceptance test: **change a field on the server, and the client must fail to compile.** If it doesn't fail to compile, your contract is fake — you only hand-copied a set of types that will silently go stale.
- **Stub impl OK, stub contract not.** A not-yet-built backend may be a thin stub returning fake data, but it must speak the *real* contract — real types, real auth shape, real error shape — and a mock (MSW-style) should be **backed by the generated schema** so it can't drift from the real shape. The most dangerous artifact in the build is a mock that disagrees with reality.
- **Tokens are executable too.** Change a design token and every consumer changes; if it doesn't, the token isn't really wired in — it's a number someone copied.

### GATE — clear before FLOOR
1. `checklist check contract contract-cannot-drift`
2. `checklist verify contract`

---

## STAGE 3 — Floor (the nine-point acceptance that proves it isn't in one head)

Open **[references/skeleton-acceptance.md](references/skeleton-acceptance.md)** (the acceptance section). The skeleton is "done" only when all nine hold.

- **Walk the nine.** (1) A real, trivial feature runs from user action → server → back to the screen, on a **deploy environment, not localhost**. (2) It passed through real **auth** (if any). (3) Data comes from a real API typed by the **generated contract** — a server field change fails the client build. (4) Every PR triggers **CI** (typecheck + lint + test + build); red blocks merge. (5) Every PR gets a clickable **preview deploy**. (6) Errors from the deployed app land in **error tracking**. (7) Preview/staging **config** (env, secrets) mirrors prod. (8) **Rollback** works in minutes. (9) Another engineer, on the README **alone**, can clone → install → run → deploy with no tribal knowledge.
- **Number nine is the master gate.** It proves the setup does not live in one person's head — the same reproducibility bar the suite holds everywhere. Pass it and this stage is genuinely over; fail it and the build has a single point of failure made of a human.

### FINAL GATE
1. `checklist check floor walking-skeleton-accepted`
2. `checklist verify floor`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`keel` is **the proving stage** of the `surface` suite — the moment `bearings`'s paper decisions (the rendering architecture, the source-of-truth table) are forced to survive contact with reality, on day one, while a leak is free to fix. Its one slice hands `wellspring` a working server-state round-trip to generalize into the full state classification; its contract and CI floor are the ground every later stage stands on. The through-line is the suite's own — *push correctness into structure* — here as: the seams are crossed and the contract is made undriftable *before* the build grows wide, so integration risk is paid down when it is cheapest, not deferred to when it is most expensive.

It pairs with the engineering suite without duplicating it. `flightline` sets up the *general* engineering process floor (version control, review, CI/CD, dependencies) — `keel` shares the CI-and-preview instinct but owns what is frontend-specific: the catalogue of UI seams (hydration, the design-token flow, the client/server state round-trip) and the contract-that-can't-drift across the network boundary. And it applies `bearings`'s reversibility rule directly: the framework and build tool are reversible doors (pick a boring, well-supported one in an hour), while the contract and type-generation pipeline are closer to one-way — so the week of care goes into making the contract undriftable, not into choosing the framework. For an agent the lever is the same as everywhere in the suite: it builds wide on mocks, mocks a shape that doesn't match, and skips the green-less seams — feeling none of the deadline cliff — so the seams must be **crossed and gated** on the thinnest real slice, first.

## Anti-patterns (use as a pre-flight checklist)

- **Building wide on mock data** — the "90% done" that hides 100% of the integration risk; build one slice deep through every real seam first.
- **A mock whose shape doesn't match reality** — green tests, broken prod; back mocks with the generated schema so they can't drift.
- **Hand-copied types instead of a generated contract** — they go stale silently; generate from one source so a server field change fails the client build.
- **Deferring CI / preview / error tracking / rollback** — the green-less seams are the ones that leak; they are part of the skeleton, not a later chore.
- **A slice that skips auth or never really deploys** — it didn't pierce the stack; every seam must get a chance to leak.
- **Hydration left unproven** — SSR/RSC mismatch is a classic ship-day killer; cross that seam in the skeleton.
- **"It works on localhost"** — the skeleton must run on a real deploy environment with prod-mirroring config, or it has proved nothing about prod.
- **A build only one person can run** — fail the README-alone reproducibility gate and the project's bus factor is one; number nine is the master gate.
- **Spending the week on the framework, not the contract** — backwards: the framework is the reversible door, the contract is the one-way one.
- **Skipping a GATE** — and remember: a seam you didn't cross on day one is one you'll first cross at the deadline.

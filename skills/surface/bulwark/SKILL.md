---
name: bulwark
description: >
  The 1-to-N lens for a frontend system that is already alive: the enemy is no
  longer building, it is ENTROPY — boundaries eroded by one "just this once"
  cross-import at a time, and the two graphs (component tree vs data dependency)
  drifting apart as features pile on. Use when a frontend is in maintenance/scaling,
  onboarding more people, or showing rot (every change touches everything, the
  global store keeps growing, only one person dares touch the core). The one move:
  make the architecture SELF-ENFORCING, so it doesn't depend on everyone remembering
  the rules — because at scale they won't. Triggers on "the codebase is getting hard
  to change", "enforce architecture / module boundaries", "lint rules for imports /
  layering", "circular dependency", "this abstraction is everywhere / should I
  delete it", "dead code / unused exports / stale feature flags", "Conway's law /
  team structure", "design system / Storybook / component library", "onboarding /
  how long until a new hire ships". Installs boundaries machine-enforced in lint/CI
  (import rules, the public-API module, fitness functions, CODEOWNERS) with the
  immune-system meta-rule (every real violation becomes a new permanent rule), the
  abstraction extract/delete/keep flow plus dead-state and stale-flag pruning,
  Conway's-law alignment of module edges to team edges, the design system as a real
  artifact (a living catalog, tokens as the single source, ADRs as the living why),
  and the one external health metric that matters — how fast a newcomer ships on the
  docs alone. There is no exit; it is a steady state. The agent adds features and
  reaches for rewrites; you keep the call it cannot make — which boundaries are
  load-bearing, and what the architecture must refuse to let drift.
argument-hint: "[the living frontend system to keep changeable as it scales]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# bulwark

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A bulwark is the wall that holds a defended thing against constant pressure — it does its job by *standing*, not by being remembered. `bulwark` is the seventh and last skill of the `surface` suite, the 1-to-N lens for a frontend that is already alive, and its enemy has changed: the earlier stages built the thing; this one fights **entropy**. Its product is an architecture that enforces *itself* — boundaries fossilized into lint rules, a living design system, abstractions pruned not just stacked — so the system stays cheap to change as people and features multiply. There is **no exit**: 1-to-N is a steady state, so health criteria replace exit criteria. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The one move that governs everything: make the architecture self-enforcing.** A living system rots along two lines — **boundary erosion** (the state classification and module isolation you drew get punctured by one "just this once" cross-import at a time) and **two-graph drift** (features pile on, the component tree and the data-dependency graph slowly diverge, state migrates into the wrong bucket, derived values get stored). The master's core move is not vigilance — it's to make the architecture **enforce itself**, because at scale no one remembers the rules. A boundary that lives only in someone's head, or a wiki, *will* be violated; a boundary the machine rejects at merge time holds. Everything here is a way to move a rule out of human memory and into a gate.

This is where the agent era bites:
- **The agent's default is "add," never "remove."** It will add a feature, an abstraction, a flag, a store slice — and never delete, never reclassify, never prune the dead. So the global store grows, abstractions accrete, dead flags linger, and the two graphs drift — all invisibly, because adding turns green and pruning earns nothing. **Entropy is the agent's natural output.**
- **The agent crosses boundaries for convenience.** A direct import into another feature's internals is the shortest path to working code, and the agent feels no cost to the architecture — so unless the machine rejects it, the boundary you designed quietly dissolves into "whoever was in a hurry."
- **The agent reaches for a rewrite and over-abstracts.** It will rebuild rather than refactor, and pile speculative structure that the next session must read through — so the discipline of *delete the wrong abstraction, extract only on the rule of three* must be enforced, not trusted.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart; for `bulwark`, lean on the *scope* axis (boundaries and isolation — the same "spooky action at a distance" CSS/scope problem, now at the module level) and the *two-graphs* axis (the drift you are fighting), plus the meta-principle *optimize for change, not for the first version*. Load at the start, re-check at every gate.

**Speak the user's language.** The calls here are the user's — which boundary is load-bearing, is this abstraction earning its keep, should team structure change to fit the architecture. Read their fluency and gloss a term on first use (a *fitness function*, *dependency-cruiser* / import rules, a *public-API* module, *Conway's law* and inverse Conway, an *ADR*, dead-code / unused-export pruning, a stale *feature flag*). An enforcement rule the user can't evaluate is a constraint imposed, not a shared decision.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `bulwark`, the *scope* and *two-graphs* axes and the optimize-for-change meta-principle. Load at the start, re-check at every gate.
- [references/enforce-boundaries.md](references/enforce-boundaries.md) — the engine: import/layer rules (eslint-plugin-boundaries, no-restricted-imports, dependency-cruiser), the public-API (single-entry) module pattern, lint-able state-classification rules, architecture fitness functions in CI, CODEOWNERS on load-bearing files, and the immune-system meta-rule.
- [references/prune.md](references/prune.md) — the abstraction extract/delete/keep flow (rule of three; the flag-argument and no-escape-hatch tells; inline the wrong abstraction), dead-code / unused-export / stale-flag pruning, and state reclassification (the store-size thermometer revisited).
- [references/conway-and-design-system.md](references/conway-and-design-system.md) — Conway's law made executable (align module edges to team edges; the "who must be present to change X" probe; inverse Conway), and the design system as a real artifact (a living catalog with the four states as stories, tokens as the single source, ADRs as the living "why").
- [references/frontend-dx.md](references/frontend-dx.md) — the tooling that fossilizes good practice at 1→N: build/HMR, TypeScript strictness, lint/format, monorepo, CI gates, codegen, dependency hygiene — make the right thing easy and the wrong thing fail loudly.
- [references/frontend-security.md](references/frontend-security.md) — the threat model and architectural defenses: XSS / CSP / Trusted Types, CSRF / SameSite, token storage, CORS, clickjacking, supply-chain (SRI, dependency confusion), and the advanced adversary layer (mXSS, BFF, WebAuthn, Fetch Metadata).

> **The arc is a steady state, not a finish.** Five stages — enforce · prune · conway · system · vitals — keep a living frontend cheap to change: enforce fossilizes the boundaries into machine gates; prune fights accretion by deleting wrong abstractions, dead code, and stale flags; conway aligns the module seams with the team seams so they stop fighting; system makes the design system a real, discoverable artifact; vitals reads the one external sign of architectural health. `bulwark` gates all five, but there is no done — it is the maintenance loop the whole suite was a down-payment on. Its feedback comes from `lookout`'s observability, where entropy first becomes visible.

---

## STAGE 0 — Enforce (fossilize the boundaries into machine gates)

Open **[references/enforce-boundaries.md](references/enforce-boundaries.md)**. The principle: a boundary in someone's head is already violated; only a boundary the machine rejects at merge holds.

- **Declare the dependency/import rules.** Use `eslint-plugin-boundaries` / `no-restricted-imports` / `dependency-cruiser` to encode "layer A can't import layer B," "features can't import each other's internals — only the public entry," "the UI layer can't touch the data layer." Violations turn CI red — this fossilizes your designed module graph into a fact in the code.
- **The public-API (single-entry) module.** Each module exposes one entry (`index`); deep imports into internals are lint-banned, so the dependency graph keeps the shape *you* designed, not "whoever was in a hurry."
- **Lint what you can of the state classification, and add fitness functions.** Ban writes to the global store / `localStorage` outside designated layers; flag the `useEffect`-that-syncs-state-into-state smell. Run architecture **fitness functions** in CI — assertions about the structure itself (no circular deps, layer X doesn't depend on Y, a route's bundle is under budget). Put **CODEOWNERS** on load-bearing files (contracts, core types, module boundaries).
- **The immune-system meta-rule.** Every time a boundary is violated by accident, ask "is there a lint rule that would have caught it?" — and if so, add it. The boundary set grows by turning each real violation into a permanent guard; that's how the architecture defends itself across years.

### GATE — clear before PRUNE
1. `checklist check enforce boundaries-machine-enforced`
2. `checklist verify enforce`

---

## STAGE 1 — Prune (fight accretion: delete wrong abstractions, dead code, stale flags)

Open **[references/prune.md](references/prune.md)**. The counter-move to the agent's add-never-remove default.

- **Extract / delete / keep, for every abstraction.** Used 3+ times *and* genuinely shared behavior? No (used once or twice, or "shared" is coincidence) → premature/wrong abstraction → **inline it back** (duplication is cheaper than the wrong abstraction). Are consumers fighting it — passing flags to make it behave differently, everyone needing an escape hatch? → it coupled unrelated things → split or delete (the **flag-argument** is the tell: a flagged abstraction is two things in one coat). Consumers can't escape an edge case? → refactor to headless/compound, or delete. Load-bearing and stable (used widely, rarely changes, no one fights it)? → keep, it earns its place. The maintenance bias: when unsure, prefer to **delete the abstraction and duplicate**, because a wrong abstraction is an invisible edge in the dependency graph coupling distant things.
- **Prune the dead.** Periodically (or with `knip` / `ts-prune`) find unused exports, dead feature flags (the one rolled to 100% three months ago that no one deleted — a permanent flag is an un-merged fork), and stored derived state. Audit the import graph for new cycles or cross-layer leaks. And **reclassify drifted state**: the global store's size is `wellspring`'s thermometer — when it grows, re-run the classification tree and move server-cache back to the cache layer.

### GATE — clear before CONWAY
1. `checklist check prune abstractions-pruned-and-state-reclassified`
2. `checklist verify prune`

---

## STAGE 2 — Conway (align the module seams with the team seams)

Open **[references/conway-and-design-system.md](references/conway-and-design-system.md)** (the Conway section). Architecture will mirror the org chart whether you want it to or not.

- **Align module edges to team edges.** A system's structure ends up mirroring its organization's communication structure, so draw module boundaries to match team boundaries — one team owns a module end to end — and the code's seams become the org's seams instead of fighting them.
- **The executable probe.** Map "to change X, who must be in the room?" If a routine change needs more than one team, the boundary is in the wrong place (split it along the team line). Use **inverse Conway** deliberately: to get an architecture, first shape the teams that would produce it.

### GATE — clear before SYSTEM
1. `checklist check conway module-edges-aligned-to-team-edges`
2. `checklist verify conway`

---

## STAGE 3 — System (make the design system a real artifact, not folklore)

Open **[references/conway-and-design-system.md](references/conway-and-design-system.md)** (the design-system section). A shared mental model has to live in an artifact, or it dies with the people who hold it.

- **A living component catalog.** Each reusable component documents its states — including `seaworthy`'s four (loading/error/empty/edge) as stories — in a discoverable catalog (Storybook-style), so components are found and reused, not reinvented. The executable check: *can a newcomer find and reuse an existing component instead of building a duplicate?* If components keep getting reinvented, the catalog is either untrue or undiscoverable.
- **Tokens as the single source of visual decisions** (from `keel`): re-theming is one edit, not a manhunt. And **ADRs as the living "why"** — not a rotting exhaustive API doc, but load-bearing decision records that keep the reasoning alive after the people who made the decisions have gone.

### GATE — clear before VITALS
1. `checklist check system design-system-is-a-real-artifact`
2. `checklist verify system`

---

## STAGE 4 — Vitals (read the one external sign of architectural health)

Open **[references/conway-and-design-system.md](references/conway-and-design-system.md)** (the vitals section). The steady-state check that replaces an exit criterion.

- **The single best external metric: how fast a newcomer ships, on the docs alone.** Healthy = *days, not weeks* — they clone, the README runs and deploys it (`keel`'s reproducibility gate), clear boundaries let them find the relevant module, they reuse from the catalog, and ship a slice down a proven path. Unhealthy = *weeks, and a senior must walk them through "what not to touch"* — which means the architecture lives in someone's head, not in the structure (exactly the entropy you fight).
- **The standing health signs (no exit, a steady state).** Boundaries machine-enforced and each new violation class turned into a new rule; the global store stays small as features grow; the cost of the Nth feature is about the cost of the first (no entropy tax); abstractions pruned not just piled; module edges match team edges. Track the newcomer's "time to first independent delivery" — if it's climbing, rot is outrunning your documentation of it.

### FINAL GATE — the steady state holds
1. `checklist check vitals architecture-vitals-healthy`
2. `checklist verify vitals`
3. `checklist show` — confirm all five stages passed.
4. `checklist done` — clear this run's state. (1-to-N has no finish; re-run the loop as the system grows.)

---

## The thread through all of it

`bulwark` is **the steady-state stage** of the `surface` suite — the one the whole pipeline was a down-payment on, since the point of pinning the one-way doors (`bearings`), making the contract undriftable (`keel`), minimizing the source of truth (`wellspring`), building whole slices (`seaworthy`), testing behavior (`trials`), and instrumenting reality (`lookout`) was to make the system stay cheap to change at scale. It re-uses the suite's own artifacts as the things it enforces: `wellspring`'s classification (now lint-checked and the store-thermometer re-read), `seaworthy`'s four states (now catalog stories), `keel`'s tokens and reproducibility gate, `lookout`'s observability (now the entropy early-warning). The through-line is the suite's own — *push correctness into structure* — at its final form: move every rule out of human memory and into a machine gate, so the architecture survives its own creators.

It pairs with the engineering suite without duplicating it. `husbandry` owns the *general* maintenance-and-evolution craft (debt classification, refactoring mechanics, legacy, the same add-never-remove agent failure) and `flightline` owns the general process floor — `bulwark` is their frontend dialect: lint-enforced *frontend* boundaries (feature isolation, the state-classification rules, the two-graph drift), the design system as a living catalog of UI states, and the store-size thermometer. For an agent the lever is the same as everywhere in the suite: it only ever adds — features, abstractions, flags, store slices — and crosses boundaries for convenience, feeling none of the accreting entropy, so the boundaries must be **machine-enforced and gated**, with every violation turned into a permanent rule and the dead pruned on a schedule.

## Anti-patterns (use as a pre-flight checklist)

- **Boundaries that live in a wiki or a head** — they're already violated; encode them as lint/CI rules that turn red at merge.
- **Deep imports into a module's internals** — the designed graph dissolves into "whoever was in a hurry"; expose one public entry and ban the rest.
- **Add-only, never prune** — the agent's default; on a schedule, delete dead code, stale flags, and wrong abstractions, and reclassify drifted state.
- **Keeping a wrong abstraction because it's "DRY"** — a wrong abstraction is costlier than duplication; inline it; the flag-argument is the tell it's two things in one coat.
- **A permanent feature flag** — a flag rolled to 100% and never deleted is an un-merged fork; prune it.
- **A growing global store** — re-run the classification tree; it's server-cache that drifted back in.
- **A routine change that needs three teams in the room** — the module boundary is misplaced; align it to the team line (Conway).
- **A design system as folklore** — if components keep getting reinvented, the catalog is untrue or undiscoverable; make it a real, found artifact.
- **Onboarding that needs a senior to say "don't touch that"** — the architecture lives in a head, not the structure; the newcomer-time metric is the tell.
- **Treating 1-to-N as a project with an end** — it's a steady state; the health signs replace exit criteria, and the loop re-runs as the system grows.
- **Skipping a GATE** — and remember: every rule you leave in human memory is one the next session, human or agent, will break.

---
name: pilot
description: >
  Navigate the surface frontend suite: route a frontend task to the right skill —
  and, because the suite is a lifecycle, to the right ENTRY STAGE — or to a sibling
  suite, or say plainly when none is warranted. The un-gated front door to the
  seven surface skills (bearings, keel, wellspring, seaworthy, trials, lookout,
  bulwark). Use when starting or mid-way through frontend work, unsure which stage
  fits or whether the suite is needed. The shift it leans on: most frontend
  work is NOT greenfield, so the best routing names WHERE IN THE PIPELINE TO ENTER,
  not stage 0. Triggers on "which frontend
  skill / where do I start", "how should I build this UI / app", "my state is a mess /
  it's out of sync", "it feels janky / slow", "my component tests break on every
  refactor", "dark pattern / which metric", "the frontend is rotting as it
  grows". It also redirects ACROSS suites: code craft / architecture / testing /
  process / security → engineering; realtime / offline / CRDT → distributed; library
  choice → quarry.
argument-hint: "[the frontend task, goal, or confusion you want routed]"
allowed-tools: Read Bash Skill(surface:*)
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# pilot

A harbor pilot doesn't sail your ship — they board it because they know *these* waters, and put you on the right course through them. `pilot` is the front door to the `surface` suite: it takes a frontend task, a goal, or just a confusion, and returns a **routing verdict** — run this skill, enter the pipeline at *this* stage, run these in order, redirect to a sibling suite, or *don't reach for a skill, here's why*. It is a dispatcher, not a methodology, so it has **no GATEs**; its whole value is the call it makes in the next paragraph of your conversation, not a flight plan it walks you through.

**Earn your keep above the harness, or stay quiet.** The harness already routes a *single* clearly-named task to its skill on the trigger description alone. So `pilot` exists for the five things matching can't do:

1. **Enter at the right stage** — the suite is a lifecycle, but most frontend work is *not* greenfield. The single highest-value call here is "your skeleton runs but your state is a swamp → start at `wellspring`, not `bearings`." Don't make someone walk stage 0 when their work enters at stage 2.
2. **Sequence** — one ask ("build me this UI", "make it production-ready") is really *several* stages in order; name the chain and the hand-offs.
3. **Redirect** — across stages ("you asked to fix flaky component tests, but the cause is unclassified state with stored derivatives → `wellspring` before `trials`") and **across suites** (general code craft → `engineering:plumb`; realtime correctness → `distributed:holdfast`). This is the highest-value routing and the one a trigger match never does.
4. **Refuse** — the honest "no skill for this" (below). A router that always finds a skill to sell is worse than none.
5. **Disambiguate** — the confusable calls (`bearings` vs `wellspring` on the source of truth; `seaworthy` vs `lookout` on "it's slow"; `trials` vs `engineering:assay` on testing) where the wrong pick wastes a flight plan.

**Scope: the seven surface skills only — and surface owns the *membrane*, not all of frontend's code.** General code craft, architecture, testing-in-general, process, and security are the **`engineering`** suite — point there, don't absorb. Realtime/offline/CRDT *correctness* is **`distributed`** (`holdfast`). Choosing a library or framework to adopt is **`quarry`**. Anything that isn't frontend (a backend service, a factual lookup, prose) is out of scope: say where it belongs and stop.

---

## STEP 0 — Prerequisite: is `checklist` installed?

Every surface skill except this one opens with `checklist init` and is **gated by the `checklist` CLI**. If you route someone into `wellspring` and the CLI isn't there, the gates silently don't run and the skill degrades to prose. So before handing off into any gated skill, check once:

```bash
command -v checklist
```

- **Found** → proceed; route normally.
- **Not found** → tell the user the surface skills won't enforce their gates without it, and recommend installing first:
  ```bash
  npm i -g @iamk77/skill-checklist
  ```
  Routing *advice* still works without the CLI (you can recommend a stage and a sequence); only the in-skill GATE enforcement needs it. Recommend, note the degradation, let the user decide. `pilot` itself runs no gates and needs no `checklist`.

---

## The map — the surface pipeline in one screen

Seven stages, *roughly* in order (greenfield walks them front to back; real work usually enters somewhere in the middle). The through-line — the **membrane between machine and mind** — runs through all of them: the calls `pilot` can't make for you (which boundary, whose source of truth, what causal story forms in the user's head, whose interest the optimizer serves) stay yours.

| When | Skill | Owns the question |
|---|---|---|
| Before any code | **bearings** | What are the brutal-to-reverse decisions? (the user's mental model, the boundary & source-of-truth one-way doors, the perception contract, the objective function) |
| First code | **keel** | Does it run end-to-end? (one real-but-trivial deployed slice through every integration seam; a contract that can't drift) |
| The heart | **wellspring** | Where does each piece of state live? (classify state, minimize the source of truth, model the implicit machine, wire the two graphs) |
| Build each feature | **seaworthy** | What happens when it breaks? (the four states *are* the product; illusion-maintenance, accessibility, the perf budget) |
| Correctness | **trials** | Is the test a net or a straitjacket? (behavior not structure, the testing trophy, mock only the network) |
| Ship & watch | **lookout** | What is the optimizer doing to the user? (preview + RUM, and the pre-launch objective-function ethics gate) |
| 1 → N | **bulwark** | What holds the architecture against entropy? (self-enforcing boundaries, pruning, Conway, the living design system) |

See **[references/suite-map.md](references/suite-map.md)** for each stage's role in full, the entry-stage decision, the confusable-pair disambiguation, and ready-made sequences ("greenfield frontend", "I inherited a messy frontend", "make this production-ready and ethical", "it feels janky", "my state is a mess").

See **[references/lifecycle-handbook.md](references/lifecycle-handbook.md)** for the 0→1 frontend lifecycle phases and which skill owns each — the map for placing a task at its entry stage.

---

## The triage procedure

1. **Read the task for its real shape**, not its words. "Clean up my frontend", "make it faster", "the state is a mess" are under-specified — find what is actually being asked.
2. **Establish what already exists** — this picks the entry stage. Nothing yet → `bearings`. A running skeleton with messy state → `wellspring`. Built features that break ugly → `seaworthy`. Brittle tests → `trials`. About to ship / chasing a metric → `lookout`. Rotting at scale → `bulwark`.
3. **Ask at most one or two clarifying questions — and only if the route depends on the answer.** If you can route without asking, route.
4. **Run STEP 0** (checklist) if you're about to send them into a gated skill.
5. **Classify** against the map, the cross-suite scope, and the refusal test below.
6. **Return a verdict**: no skill (and why) · one stage (name it, one line why, the exact invocation) · a sequence from the entry stage forward · or a cross-suite redirect.
7. **Hand off** (below) — invoke the entry stage, or give the user the command.

---

## The router — what they say → where it goes

A starting map; the depth and edge cases are in [references/suite-map.md](references/suite-map.md).

| The user says… | Route to |
|---|---|
| "build a frontend / new UI / app from scratch" (vague) | **bearings** first (then the pipeline in order) |
| "which framework / React or X / SSR vs SPA vs RSC / rendering" | **bearings** (the render decision is derived from requirements there) |
| "do we need realtime / offline / collaboration" | **bearings** (the consistency one-way door) — and if yes, the *correctness* of it is **distributed:holdfast** |
| "set up the project / wire the API / works locally not in prod / hydration mismatch / preview deploys" | **keel** |
| "state management / where should this live / Redux vs Context vs signals / it's out of sync / prop drilling / too many boolean flags" | **wellspring** |
| "build this feature / loading & error & empty states / optimistic update / animation / accessibility / it feels janky / perf budget / Web Vitals in CI" | **seaworthy** |
| "what/how to test this UI / my tests break on every refactor / snapshot tests / should I mock this / coverage" | **trials** |
| "deploy / feature flags / RUM / monitoring / A/B test / which metric to optimize / is this a dark pattern / analytics" | **lookout** |
| "the codebase is rotting / enforce module boundaries / lint imports / circular deps / dead code / design system / onboarding is slow" | **bulwark** |
| "is this code clean / readable / well-named / over-engineered" | **out → `engineering:plumb`** (surface owns frontend architecture, not general code craft) |
| "general architecture / data model / service boundaries (not UI)" | **out → `engineering:load-bearing`** |
| "testing strategy in general / test doubles / a non-UI test" | **out → `engineering:assay`** (`trials` is the frontend dialect of it) |
| "CI / branching / review / dependencies" · "deploy infra / SLOs / incidents / capacity" | **out → `engineering:flightline`** · **`engineering:stationkeeping`** |
| "make it secure / threat model / pentest" | **out → `engineering:aegis` / `gungnir`** |
| "is the realtime/offline/CRDT design correct (retries, ordering, consensus)" | **out → `distributed:holdfast`** |
| "which UI library / is this repo worth adopting" | **out → `quarry` (forage / touchstone)** |

---

## Refusal rules — saying "no skill" is first-class

Per the suite's own ethic (*means, not an end*), the right answer is sometimes that no skill should come out. Refuse, plainly and with the reason, when:

- **It's trivial or throwaway.** A one-off prototype that ships nothing, a single component tweak — just build it; a gated flight plan is pure ceremony. (The bar is sized to how long the thing must live — see `bearings`.)
- **It isn't frontend.** A backend service, a data pipeline, a factual question — out of scope; route to `engineering`/`distributed` or answer directly.
- **A surface stage is already mid-flight.** If the user is *inside* a skill's work, don't bounce them to another for a sub-question; answer in place.
- **The ask names a stage but the gap is earlier.** Redirect honestly: "your component tests are brittle (`trials`), but the cause is stored derived state and an un-classified store — fix that in `wellspring` first"; "it feels janky (`seaworthy`), but there's no perception contract saying what 'instant' means here — that's `bearings`." This is the most valuable thing `pilot` does; do it even when it contradicts the request.
- **The work is too small for the stage it nominally matches.** A two-component change doesn't need the full pipeline — name the one decision that matters and skip the ceremony.

The test, before you route anyone anywhere: *would a competent frontend engineer reach for a multi-stage skill here, or just do the thing?* If the latter, say so.

---

## Hand-off — invoke, or hand the user the command

- **Auto-invoke (best effort):** invoke the entry-stage skill via the `Skill` tool (e.g. `surface:wellspring`). Skill-to-skill invocation is permitted but not formally documented, so treat it as best-effort.
- **If auto-invoke isn't available or fails:** give the exact command — `/surface:bearings <the framed task>` — plus the rest of the chain as a short numbered list they can walk. The routing is the value; the click is theirs if the harness won't make it.
- **For a sequence,** hand off only the *entry* step, and state the next ones ("after that, `seaworthy` per feature, then `trials` for the behavior tests"). Don't drive the whole pipeline from here; each stage owns its flight and hands back.

> The names above use the `surface:` plugin prefix (how the suite installs). If the skills are loaded un-prefixed in the current workspace, drop the prefix — the harness resolves the bare name.

---

## Anti-patterns (for pilot itself)

- **Always finding a stage to sell** — the refusal and cross-suite redirects are half the job; a router that never says "no" or "that's engineering's" is noise.
- **Forcing every task to start at `bearings`** — the suite is a pipeline, but real work enters mid-stream; naming the *entry stage* is the headline value.
- **Absorbing a sibling-suite concern** — general code craft is `plumb`, general architecture is `load-bearing`, distributed correctness is `holdfast`, picking a library is `quarry`. Point, don't route into surface.
- **Interrogating before routing** — ask only what the route depends on; otherwise route and move.
- **Routing into a gated skill without the `checklist` check** — the gates silently no-op and the user thinks they're protected.
- **Re-litigating a stage's content** — `pilot` says *which* and *in what order*, never *how*; the chosen stage owns the how.
- **Driving the whole pipeline from the cockpit** — hand off the entry stage and let each fly its own.

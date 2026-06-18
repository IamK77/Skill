---
name: pilot
description: >-
  Navigate the atelier design-craft suite: given a visual-design task, route to the right lens — and,
  because design is a system built in layers, to the right ENTRY lens — or to a sibling suite, or say
  plainly when no skill is warranted. The un-gated front door to the eight atelier lenses (canon, color,
  type, layout, form, graphics, motion, systems). Use when you're starting, or part-way through, the
  visual design of an interface and aren't sure which lens fits, suspect several apply in order, or aren't
  sure the suite is needed at all. The shift it leans on: "make it look good" is not one decision — it is a
  small SYSTEM of decided, quantified choices, and the highest-value routing is naming WHERE to enter (no
  system yet → the design language; colors feel cheap → color; looks like a draft → type; cluttered, no
  focal point → layout; flat / fake depth → form; need a chart, icon set, or canvas → graphics; lifeless or
  janky → motion; tokens drifting and the system rotting → systems). Triggers on "make this look premium /
  high-end", "the design feels cheap / generic / AI-default", "which design skill / where do I start",
  "the colors are off", "it looks like a draft / unstyled", "it's cluttered / no hierarchy", "it feels flat",
  "the UI feels lifeless / janky", "our design tokens keep drifting", "design system", "redesign this UI".
  It also redirects ACROSS suites: how CSS/Grid/cascade actually WORK → surface:keel; what to build / the
  user's mental model / is this a dark pattern → surface:bearings; state & data → surface:wellspring; the
  unhappy paths, accessibility, performance budget → surface:seaworthy / lookout; general code craft,
  architecture, testing, security → engineering; realtime/offline correctness → distributed; choosing a
  library → quarry. It sequences, redirects, refuses, and disambiguates the confusable lenses — it never
  does the design itself.
argument-hint: "<the design task, goal, or confusion — e.g. 'make this dashboard look premium' or 'the colors feel cheap'>"
allowed-tools: Read, Grep, Glob, Bash
---
<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# pilot

A harbor pilot doesn't repaint your ship — they board it because they know *these* waters, and put you on
the right course through them. `pilot` is the front door to the `atelier` suite: it takes a design task, a
goal, or just "this looks bad and I can't say why", and returns a **routing verdict** — run this lens, enter
the design system at *this* layer, run these in order, redirect to a sibling suite, or *don't reach for a
skill, here's why*. It is a dispatcher, not a method, so it has **no GATEs**; its whole value is the call it
makes in the next paragraph, not a flight plan it walks you through.

**Earn your keep above the harness, or stay quiet.** The harness already routes a *single* clearly-named
task to its skill on the trigger description alone. So `pilot` exists for the five things matching can't do:

1. **Enter at the right layer** — design is a system built in layers, and most design work is *not* a blank
   canvas. The single highest-value call here is "your build works but it reads cheap → the problem is the
   *color system* and the *type scale*, start at `color`/`type`, not a full redesign." Don't make someone
   define a whole design language when their work enters at one layer.
2. **Sequence** — "make it look premium" is really *several* lenses in order; name the chain (`canon` →
   `color` → `type` → `layout` → `form` → `motion` → `systems`) and the hand-offs, and which to skip.
3. **Redirect** — within design (the confusable lenses below) and **across suites**: the *mechanism* of CSS
   is `surface:keel`, *what to build* is `surface:bearings`, general code craft is `engineering:plumb`. This
   is the highest-value routing and the one a trigger match never does.
4. **Refuse** — the honest "no skill for this" (a one-off throwaway, a single color tweak). A router that
   always finds a lens to sell is worse than none.
5. **Disambiguate** — the confusable calls (`canon` vs `color` on "the palette"; `layout` vs `surface:keel`
   on "the grid"; `form` vs `graphics` on "the visual"; `systems` vs `surface:bulwark` on "the design system")
   where the wrong pick wastes a flight plan.

**Scope: the eight atelier lenses only — and atelier owns the *look and feel*, not all of frontend.** How
the CSS cascade / Grid / Flexbox actually *work* is **`surface:keel`** — atelier owns the composition
*judgment*, keel owns the mechanism. *What* to build, the user's mental model, and whether a design is
manipulative is **`surface:bearings`**. State, data, the unhappy paths, accessibility, and the performance
budget are **`surface`** (`wellspring` / `seaworthy` / `lookout`). General code craft, architecture, testing,
process, and security are **`engineering`**. Realtime/offline correctness is **`distributed`**. Choosing a
library is **`quarry`**. Point there; don't absorb.

---

## STEP 0 — Prerequisite: is `checklist` installed?

Every atelier lens except this one opens with `checklist init` and is **gated by the `checklist` CLI**. If
you route someone into `color` and the CLI isn't there, the gates silently don't run and the lens degrades
to prose. So before handing off into any gated lens, check once:

```bash
command -v checklist
```

- **Found** → proceed; route normally.
- **Not found** → tell the user the lenses won't enforce their gates without it, and recommend installing
  first:
  ```bash
  npm i -g @iamk77/skill-checklist
  ```
  Routing *advice* still works without the CLI (you can recommend a lens and a sequence); only the in-lens
  GATE enforcement needs it. Recommend, note the degradation, let the user decide. `pilot` runs no gates.

---

## The map — the atelier suite in one screen

Eight lenses. `canon` sets the system; the other seven each own one layer of it. The through-line — **a
polished surface is values derived from a small system; an amateur one is values picked one at a time** —
runs through all of them, and the benchmark is a human nervous system, so taste is load-bearing and cannot
be outsourced.

| When | Lens | Owns the question |
|---|---|---|
| Before any pixel | **canon** | What visual language, which surface archetype, and what are the quantified targets? (the design-judgment spine) |
| The palette | **color** | Is every color a token in a perceptual system — light and dark, contrast verified at design time? |
| The words | **type** | A modular type scale + a spacing rhythm — and does the text survive every language? |
| The composition | **layout** | Is the hierarchy and grid *decided*? Are the empty/edge states designed? Built for reality's long tail? |
| The depth | **form** | Does depth come from one light model? Are radii, shadows, and texture tokens with a job? |
| The picture | **graphics** | DOM-first — when does it earn Canvas/WebGL/GPU? One icon system; a coherent imagery system. |
| The feel | **motion** | Does every animation have a purpose and real physics? Gesture intent, reduced-motion, compositor-only. |
| 1 → N | **systems** | Is the design system one source of truth — tokens that don't drift, a living component library? |

See **[references/suite-map.md](references/suite-map.md)** for each lens in full, the entry-lens decision,
the confusable-pair disambiguation, and ready-made sequences ("make this premium from scratch", "it reads
cheap but I can't say why", "our tokens keep drifting").

---

## The triage procedure

1. **Read the task for its real shape**, not its words. "Make it look good", "it feels cheap", "it's a mess"
   are under-specified — find what is actually being asked.
2. **Establish what already exists** — this picks the entry lens. Nothing yet → `canon`. A build that reads
   cheap → usually `color` + `type` first (the two biggest "looks amateur" levers). Cluttered, no focal point
   → `layout`. Flat / invented shadows → `form`. Lifeless / janky → `motion`. Tokens drifting at scale →
   `systems`.
3. **Ask at most one or two clarifying questions — and only if the route depends on the answer.** If you can
   route without asking, route.
4. **Run STEP 0** (checklist) if you're about to send them into a gated lens.
5. **Classify** against the map, the cross-suite scope, and the refusal test below.
6. **Return a verdict**: no skill (and why) · one lens (name it, one line why, the exact invocation) · a
   sequence from the entry lens forward · or a cross-suite redirect.
7. **Hand off** — invoke the entry lens, or give the user the command.

---

## The router — what they say → where it goes

| The user says… | Route to |
|---|---|
| "make this look premium / high-end / expensive (from scratch)" | **canon** first (then the sequence: color → type → layout → form → motion → systems) |
| "it feels cheap / generic / like every AI app / mediocre" | **canon** (the design language & quantified targets are undecided) — then **color** + **type** |
| "the colors are off / palette / dark mode / contrast / oklch / data-viz colors" | **color** |
| "it looks like a draft / unstyled / the type / fonts / spacing rhythm / non-English text breaks" | **type** |
| "it's cluttered / no hierarchy / the layout / grid / empty & loading states look bad / form looks ugly" | **layout** |
| "it feels flat / cheap shadows / depth / elevation / radius / gradient / texture" | **form** |
| "I need a chart / data-viz render / 3D / a canvas / an icon set / illustrations / images" | **graphics** |
| "it feels lifeless / janky / the animation / transitions / gestures / it stutters" | **motion** |
| "our tokens keep drifting / the design system is rotting / two places maintain the palette / handoff" | **systems** |
| "how does CSS Grid / Flexbox / the cascade / z-index actually WORK" | **out → `surface:keel`** (atelier owns composition judgment, keel owns the mechanism) |
| "what should we build / model the user / is this a dark pattern / which metric" | **out → `surface:bearings`** |
| "state management / it's out of sync / data layer" · "loading/error states logic / a11y / perf budget" | **out → `surface:wellspring`** · **`surface:seaworthy` / `lookout`** |
| "is this code clean / architecture / testing / secure" | **out → `engineering` (plumb / load-bearing / assay / aegis)** |
| "is the realtime/offline design correct" · "which UI library should we adopt" | **out → `distributed:holdfast`** · **`quarry`** |

---

## Refusal rules — saying "no skill" is first-class

Refuse, plainly and with the reason, when:

- **It's trivial or throwaway.** A single color swap, one icon, a one-off prototype that ships nothing — just
  do it; a gated flight plan is pure ceremony.
- **It isn't a design task.** A backend service, a factual question, copy editing — out of scope; route or
  answer directly.
- **An atelier lens is already mid-flight.** If the user is *inside* a lens's work, don't bounce them; answer
  in place.
- **The ask names a layer but the gap is the system.** Redirect honestly: "you asked to fix the shadows
  (`form`), but nothing reads cheap *because* of shadows — there's no color system or type scale yet; fix
  those in `color`/`type` first." This is the most valuable thing `pilot` does; do it even against the request.

The test before routing anyone anywhere: *would a competent designer reach for a multi-stage lens here, or
just do the thing?* If the latter, say so.

---

## Hand-off — invoke, or hand the user the command

- **Auto-invoke (best effort):** invoke the entry-lens skill via the `Skill` tool (e.g. `atelier:color`).
- **If auto-invoke isn't available:** give the exact command — `/atelier:canon <the framed task>` — plus the
  rest of the chain as a short numbered list.
- **For a sequence,** hand off only the *entry* lens, and state the next ones ("then `type`, then `layout`").
  Don't drive the whole pipeline from here; each lens owns its flight and hands back.

> The names above use the `atelier:` plugin prefix. If the skills are loaded un-prefixed in the current
> workspace, drop the prefix — the harness resolves the bare name.

## Anti-patterns (for pilot itself)

- **Always finding a lens to sell** — the refusal and the cross-suite redirects are half the job.
- **Forcing every task to start at `canon`** — real design enters mid-system; naming the *entry lens* is the
  headline value.
- **Absorbing a sibling concern** — CSS mechanism is `surface:keel`, what-to-build is `surface:bearings`,
  enforcing the system at scale is `surface:bulwark`. Point, don't route into atelier.
- **Interrogating before routing** — ask only what the route depends on; otherwise route and move.
- **Driving the whole pipeline from the cockpit** — hand off the entry lens and let each fly its own.

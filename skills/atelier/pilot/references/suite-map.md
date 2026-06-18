# The atelier suite map — the eight lenses, the entry decision, and ready-made sequences

Design is not one decision; it is a small **system** built in layers. `canon` decides the system (which
visual language, which archetype, the quantified targets); the other seven lenses each own one layer of it
and enforce it as gates. The benchmark is a human nervous system, so taste is load-bearing and cannot be
outsourced — the agent picks plausible-but-incoherent values and feels no wrongness, which is exactly why
each layer is *decided and gated* rather than trusted to a default.

## The eight lenses in full

- **canon** — the design-judgment spine. What visual language? Which surface archetype (tool · dashboard ·
  editorial · marketing · data-dense)? What are the *quantified* targets the other lenses inherit (contrast,
  density, type ratio, motion budget)? Does the visual serve the user's actual job? Enter here when nothing
  is decided yet, or when a build "reads cheap" and you can't name why — the usual cause is that no design
  language was ever chosen, only defaults nudged.
- **color** — the palette as a perceptual system: an oklch neutral ramp with a temperature, semantic roles,
  a dark ramp that is *re-tuned* (never `invert()`), contrast verified at design time, and data-viz scales
  that are perceptually uniform and colorblind-safe. Enter when the colors feel off, cheap, or generic.
- **type** — a modular type scale + a spacing scale on the same rhythm (never px sized by eye), the optical
  tells that separate pro from amateur, and text that survives every language (BiDi/RTL, CJK, locale). Enter
  when it "looks like a draft", the type feels arbitrary, or non-English text breaks.
- **layout** — composition as a decision: the grid/armature, visual hierarchy and focal order, measure and
  spatial rhythm, the *designed* empty/loading/error states and form visuals, and robustness for reality's
  long tail (overflow, missing data, huge numbers, RTL). Enter when it's cluttered, flat in hierarchy, or
  the edge states look unfinished.
- **form** — depth from ONE light model (layered shadows sharing a direction, a tokenized elevation z-scale),
  concentric tokenized radii, and gradient/texture used only with a job and without banding. Enter when it
  feels flat, the shadows look invented, or the corners look wrong.
- **graphics** — DOM-first, dropping to Canvas/WebGL/GPU only where the DOM can't go (always with a fallback
  and a budget), plus one coherent icon system and a real imagery/illustration system. Enter when you need a
  chart, a custom render, 3D, an icon set, or images.
- **motion** — every animation mapped to a purpose with real physics (spring vs easing, never confused),
  gesture intent arbitration, a true reduced-motion path, and compositor-only properties at 60fps. Enter
  when it feels lifeless or janky.
- **systems** — the design system as one source of truth: tokens that cross the CSS↔JS boundary without
  drift, a living component/pattern library, and a design→code handoff that stays in sync. Enter at 1→N,
  when tokens drift or the system rots.

## The entry decision — most design work is not greenfield

Pick the entry lens by what already exists and what reads wrong:

```
nothing decided yet / "make it premium from scratch"      → canon  (then the full sequence)
it reads cheap/generic and I can't say why                → canon, then color + type (the two biggest levers)
the colors / dark mode / contrast feel wrong              → color
it looks like a draft / the type & spacing feel arbitrary → type
it's cluttered, no focal point, edge states look unfinished → layout
it feels flat / the shadows & depth look fake             → form
I need a chart / canvas / 3D / icons / imagery            → graphics
it feels lifeless or janky                                → motion
tokens keep drifting / the system is rotting at scale     → systems
```

## Confusable pairs — get these right or you waste a flight plan

- **canon vs color** — "the palette is wrong" is `color` if a system exists and a value is off; it's `canon`
  if there was never a decided language and the whole thing reads default.
- **layout vs `surface:keel`** — the *composition judgment* (hierarchy, grid choice, measure, rhythm) is
  `layout`; *how CSS Grid/Flexbox/positioning actually work* is `surface:keel`.
- **form vs graphics** — tokenized depth/shadow/texture on DOM elements is `form`; pixels the DOM can't
  express (canvas, shaders, generative, 3D) are `graphics`.
- **systems vs `surface:bulwark`** — building the design-system artifact (tokens, the living library) is
  `systems`; *enforcing* boundaries and pruning drift at 1→N across the whole codebase is `surface:bulwark`.
- **canon vs `surface:bearings`** — *which visual language and quantified aesthetic* is `canon`; *what to
  build, the user's mental model, the source of truth, is-this-a-dark-pattern* is `surface:bearings`.

## Ready-made sequences

- **"Make this premium, from scratch"** → `canon` → `color` → `type` → `layout` → `form` → `motion` →
  `systems`. (Skip `graphics` unless there's bespoke rendering.)
- **"It reads cheap but I can't say why"** → `canon` (name the language + quantified targets), then `color`
  + `type` (the levers most responsible for "amateur"), then `layout` for hierarchy.
- **"I inherited an ugly UI"** → audit-then-retrofit: each lens has a retrofit entry (inventory the ad-hoc
  values, then apply the gates). Start at `color`/`type`, not a full `canon` rebuild, unless the language
  itself is absent.
- **"Our tokens keep drifting / the design system is a mess"** → `systems` (one source of truth), pulling
  the per-layer token definitions from `color`/`type`/`form`/`motion`.

## Cross-suite hand-offs

atelier owns the *look and feel*. Route out when the real need is elsewhere: the CSS *mechanism* →
`surface:keel`; *what to build* / mental model / dark-pattern ethics → `surface:bearings`; state & data →
`surface:wellspring`; the unhappy paths, accessibility, performance budget → `surface:seaworthy` /
`surface:lookout`; enforcing the system at scale → `surface:bulwark`; general code craft / architecture /
testing / security → `engineering`; realtime/offline correctness → `distributed`; choosing a library →
`quarry`.

---
name: livery
description: >
  The visual-craft lens for a frontend build — where the surface gets its color,
  type, depth, and motion. Use after seaworthy's build works, when establishing or
  auditing a visual language, or when a UI "looks off". The one
  shift: a polished interface is
  not a pile of hand-picked values — every visual value is a TOKEN derived from a
  small SYSTEM, and ad-hoc values are the entropy that makes a UI look amateur and
  impossible to re-theme. Taste picks the system; the system enforces it.
  Triggers on "color / theme / dark
  mode / oklch / contrast", "typography
  / font / type scale / spacing", "shadow / elevation / depth / border-radius",
  "gradient / icon / image", "animation / transition / motion / gesture / spring",
  "design system / design tokens", "make it look good / polished", "it looks
  off / cheap / inconsistent". The benchmark is a human nervous system, not a
  document, so taste is load-bearing and cannot be outsourced; the agent picks
  plausible-but-incoherent values and feels none of the wrongness.
argument-hint: "[the UI / component / design system to give a coherent visual language]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# livery

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A livery is the coordinated visual identity a fleet wears — one paint-and-color scheme applied so every vessel reads as the same family, never repainted by hand per ship. `livery` is the visual-craft lens of the `surface` suite: where the other skills decide *what is true* (boundaries, source of truth, the four states), livery decides *what it looks and feels like* — and makes that a **system**, not a pile of ad-hoc values. Its product is a written **visual system**: a tokenized color-and-light scale, a modular type scale with its spacing scale, a single-light-source depth model, and a purpose-driven motion language — each committed *before* components consume it. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: a polished interface is values derived from a small system; an amateur one is values picked one at a time.** The same #3B82F6 typed in nineteen places, a font-size chosen by nudging until it "looks right", a `padding: 13px` here and `margin-top: 22px` there, a `box-shadow` invented per component, a 200ms transition copied from a tutorial — each is a hand-picked value, and their sum is the visual incoherence the eye reads as "cheap" without being able to name it. The craft is the same subtraction the rest of the suite preaches: **define a small system (a few tokens, a scale, one light source, a motion purpose), then derive every concrete value from it.** Do that and two things happen — the surface becomes *coherent* (a thousand values agree because they came from ten), and it becomes *evolvable* (re-theme, dark-mode, or rebrand by changing the system, not finding-and-replacing the thousand).

This is where the agent era bites:
- **The agent picks plausible-but-incoherent values and feels no wrongness.** It will emit `#2563eb` here and `#2f6ae0` there, a 1.31 then a 1.27 type ratio, a different gutter per component, four different shadow recipes — each defensible alone, the set visually noisy. It has no nervous system to flinch at 90ms of jank or a 4.2:1 contrast. **The values must come from a decided system, not per-call taste.**
- **The agent reaches for the cheap trick.** Dark mode by `filter: invert()`, depth by one fuzzy `box-shadow`, "animation" by a default `transition: all 0.3s`, a rainbow for a data series. Each is the move that *looks* like the craft and isn't.
- **The agent treats motion as decoration.** It animates because it can, not because the motion has a job — so transitions fire with no purpose, jank under load by animating layout properties, and ignore `prefers-reduced-motion` entirely.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the suite's heart; for `livery`, lean on the axis the README names load-bearing: **the benchmark is a human nervous system, so taste cannot be outsourced** (16ms is a fusion threshold, 100ms is "I caused that"). Every gate here is a taste decision the agent cannot make for you; what it *can* do is enforce the system once you've set it. Load at the start, re-check at every gate.

**Speak the user's language.** The decisions are the user's — which color system, which type scale, which spacing density, how much depth, what motion is *for*. Read their fluency and gloss a term on first use (*perceptual color* / *oklch*, *contrast ratio*, *type scale* / *modular ratio*, *fluid sizing* / `clamp()`, *measure* / line-length, *spacing scale* / base unit, *elevation* / *light model*, *design token*, *spring* vs *easing*, `prefers-reduced-motion`). A token system the user can't read is a style imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the agent-era axes; for `livery`, the *taste-is-load-bearing / nervous-system-benchmark* axis is the spine. Load at the start, re-check at every gate.
- [references/color-and-light.md](references/color-and-light.md) — perceptual color (oklch), neutral ramps with a temperature, semantic roles, contrast at design time, dark theme as a re-tuned ramp (not invert), and data-viz scales built for perceptual uniformity + colorblind-safety.
- [references/type.md](references/type.md) — the modular scale and ratio, fluid `clamp()` sizing, pairing and weight roles, measure and line-height by role, the spacing scale and vertical rhythm derived from the same rem unit, numerics, and the optical tells (display letter-spacing, font-features, metrics-compatible fallbacks with no CLS).
- [references/depth-form-texture.md](references/depth-form-texture.md) — one light model for layered shadows and a tokenized z-scale, concentric radii, intentional gradients/texture without banding, and shape.
- [references/icons-and-imagery.md](references/icons-and-imagery.md) — one coherent icon set (matched stroke/grid/optical size), responsive/art-directed imagery aspect-ratio-boxed against CLS, and when Canvas/WebGL earns its place (with a fallback).
- [references/motion-and-feel.md](references/motion-and-feel.md) — motion-with-a-purpose, spring/physics vs easing-curves, gesture intent and arbitration, the reduced-motion path, compositor-only properties, and masking latency to preserve the causal story.
- [references/css-and-tokens.md](references/css-and-tokens.md) — how the token system lives in the browser: custom properties (theming, @property, scoping, fallbacks), the cascade (@layer, specificity, inheritance), modern CSS (container queries, :has(), nesting, color-mix/relative color), the deep-water gotchas (containing-block traps, stacking contexts), and *auditing an existing surface* — the retrofit inventory that finds where the un-tokenized values hide.
- [references/tokens-across-css-and-js.md](references/tokens-across-css-and-js.md) — when styles live in JS (React inline-style objects, a JS color object, CSS-in-JS): the four ways tokens cross the CSS↔JS boundary, choosing ONE source of truth (var() strings vs a JS token module vs CSS-in-JS theming) so the palette is never maintained in two languages, and the trap that inline styles beat class rules — so an inline style must reference a token too, never a literal.

> **The arc is one visual system.** Four stages — color · type · form · motion — turn a working-but-styleless build into a coherent surface: color fixes the perceptual palette and light/dark as tokens; type fixes the scale, the spacing scale, and rhythm; form fixes depth, radius, and texture from one light source; motion gives every animation a purpose and physics. `livery` gates all four; it runs after `seaworthy` (the four states are built) and its visual system is what `lookout` later measures as felt performance.

> **Greenfield or retrofit? Decide the entry, not a new stage.** Most real work is not a blank canvas — it is an existing surface thick with ad-hoc values, and the job is *audit-then-retrofit*, not *invent*. The four stages are the same; only the entrance differs. If you are starting clean, walk STAGE 0→3 in order. If a UI already exists, do one pass first: **inventory the ad-hoc values** — every magic hex, every magic px (spacing especially), every duplicated palette and one-off shadow/radius/duration — and cluster them into the systems the stages will own (color · type · space · form · motion). That inventory is not a deliverable to perfect; it is the *raw material each gate consumes* — the cluster of forty blues becomes the perceptual ramp STAGE 0 commits, the scatter of font-sizes becomes the modular scale and the scatter of gutters becomes the spacing scale STAGE 1 commits, and so on. The technique for extracting it (where the literals hide across CSS / CSS-in-JS / JS token objects, how to spot the same value duplicated in two languages) is in **[references/css-and-tokens.md](references/css-and-tokens.md)** under *Auditing an existing surface*. The taste call stays a gate: for each ad-hoc cluster you still decide what the system *should* be — the inventory tells you what exists, never what's right. Bring the inventory to STAGE 0 and the gates run unchanged.

---

## STAGE 0 — Color & light (commit a perceptual color system as tokens)

Open **[references/color-and-light.md](references/color-and-light.md)**. Fix the palette *before* coloring any component.

- **Build in a perceptual space, as tokens.** Define the system in **oklch** (lightness and chroma independent, steps perceptually even), not scattered hex/hsl: a neutral ramp built on purpose (a chosen temperature/hue, not pure gray) plus a small set of semantic roles (surface / text / border / accent / the four feedback states), each a lightness step that *holds its contrast relationship* in both light and dark.
- **Dark is a re-tuned ramp, not `invert()`.** Compress the contrast range, de-saturate and lift accents, signal elevation with a lighter surface rather than a bigger shadow. **Check contrast at design time** — 4.5:1 body, 3:1 large & UI — not after. Data-viz uses a scale engineered for perceptual uniformity and colorblind-safety, never a hand-picked rainbow. The hard rule: no raw color literal in a component; a value not in the system doesn't ship. And the subtler duplicate isn't a literal — it's the *same* palette maintained in two languages at once (a CSS custom property **and** a JS color object), a second source of truth that drifts exactly like any other; that is `surface:wellspring`'s law applied to the design system — *the system is itself state, so it gets one source of truth and the other side is derived* (var() strings consumed by JS, or a token module that emits the CSS), never two hand-kept copies. When styles live in JS — inline-style objects, a JS color object, CSS-in-JS — pick ONE source and have both languages read it, because **inline styles beat class rules**, so a literal hidden in an inline style silently wins over every token (see [references/tokens-across-css-and-js.md](references/tokens-across-css-and-js.md)).

### GATE — clear before TYPE
1. `checklist check color color-system-as-tokens`
2. `checklist verify color`

---

## STAGE 1 — Type & space (a modular scale and a spacing scale, both rhythm — as tokens)

Open **[references/type.md](references/type.md)**. The thing most responsible for "looks designed" or "looks like a draft" — and the spacing scale that rides on the same rhythm.

- **A scale, not sizes.** Choose a modular ratio (≈1.2 for dense UI → 1.333 for editorial), express it fluidly with `clamp()` so it breathes between breakpoints without a media-query cascade, and reference scale steps from components — never magic px. Pair deliberately (or pick one strong family) and name each weight's role.
- **Rhythm and the optical tells.** Hold measure to ~45–75ch on running text; set line-height by role (tight on display, ~1.5 on body); keep a consistent vertical rhythm. Handle numerics (tabular-nums for data). Address the details that separate pro from amateur: negative letter-spacing on large display, `font-feature-settings` the face offers, and a metrics-compatible fallback stack so a late webfont causes **no layout shift**.
- **Spacing is the same rhythm, gated separately.** Pick one base unit and derive a *spacing scale* (a small geometric/4–8px-step set: `xs…3xl`) — every gap, padding, and margin references a step, never a magic px. It is the same rem-based rhythm the type scale rides on, so vertical rhythm and the spacing scale agree. Choose a density (compact data UI vs airy marketing) and let the scale, not the eye, set the values. This is the single most pervasive ad-hoc tell: `padding: 13px`, `margin-top: 22px`, a different gutter per component.

### GATE — clear before FORM
1. `checklist check type type-scale-and-rhythm-systematized`
2. `checklist check type spacing-scale-systematized`
3. `checklist verify type`

---

## STAGE 2 — Depth, form & texture (one light source, tokenized)

Open **[references/depth-form-texture.md](references/depth-form-texture.md)**. Depth is where invented values show up most.

- **One light model.** Every shadow shares a single light direction and is *layered* (ambient + direct, umbra/penumbra), never a lone fuzzy `box-shadow`; elevation maps to a tokenized z-scale (resting / raised / overlay / modal), not ad-hoc blur. Radii tokenized and **concentric** (inner = outer − padding) so nested corners look intentional.
- **Texture, icons, imagery with intent.** Gradients/texture only with a job (depth, focus, brand) and banding-free (perceptual interpolation / dithering). Icons from **one** set with matched stroke-width, grid, and optical size. Imagery aspect-ratio-boxed (no CLS), responsive/art-directed, with a deliberate loading + placeholder strategy. Canvas/WebGL only where the DOM genuinely can't go, always with a fallback. Like color and type: every radius, shadow, and surface is a token.

### GATE — clear before MOTION
1. `checklist check form depth-and-form-from-one-light-model`
2. `checklist verify form`

---

## STAGE 3 — Motion & feel (purpose, physics, and a reduced path)

Open **[references/motion-and-feel.md](references/motion-and-feel.md)**. The feel *is* the product; motion without a job is noise.

- **Every animation has a purpose; dynamics come from physics.** Map each to a job (orient on state change, show causality/continuity, mask latency, direct attention) — delete the rest. Use **spring / mass-damping** for interruptible, gesture-driven, or natural motion (a re-triggered animation continues from current velocity, it doesn't jank-restart); use **easing curves with short durations** (≈150–300ms) for discrete UI transitions — never confuse the two. **Scale intensity to the surface:** the same purpose taxonomy holds everywhere, but a marketing/brand surface can spend signature, expressive motion where a data/tool/dashboard surface should spend almost none — there, motion earns its place only as orientation and causality (state change, what-just-happened, masking latency), runs crisp and short, and a re-fire under streaming data must never restart or distract. The taxonomy is the constant; the budget is set by what the surface is *for*.
- **Non-negotiables.** Gesture interactions arbitrate intent (scroll-vs-drag, nested-gesture conflicts, Pointer Events not mouse-only). A real `prefers-reduced-motion` path (re-tuned, not just stripped). **Compositor-only properties** (transform/opacity — never animate layout/paint), 60fps held under load. Mask latency so the user's causal story holds — their action visibly, immediately causes the result.

### FINAL GATE
1. `checklist check motion motion-has-purpose-physics-and-a-reduced-path`
2. `checklist verify motion`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`livery` is the suite's **visual conscience** — the place the README's claim that *taste is load-bearing* finally gets a gate. It runs after `seaworthy` has built the four states, and its system is what `lookout` later measures as felt performance and what `bulwark` must keep from drifting at 1→N. The through-line is the suite's own — *push correctness into structure* — applied to looks: a value derived from a system can't drift the way a hand-picked one can, so coherence becomes structural rather than maintained by vigilance. The line that keeps `livery` honest inside a suite that says "the correct isn't in a document": **the document holds the encodable technique (how oklch works, how a spring is tuned, how tokens cross into JS); the taste — which palette, which scale, which density, what the motion is *for* — stays a gate the user clears.** Blur that line and the skill becomes a recipe book; hold it and it stays a lens.

## Anti-patterns (use as a pre-flight checklist)

- **Magic values** — the same color/size/radius/duration hand-typed in many places; derive every one from a token. A literal not in the system is the first place coherence dies — and on a retrofit, the same literal duplicated across two files or two languages is the same bug wearing a disguise (see wellspring: the design system is itself state, one source of truth).
- **The palette maintained in two languages** — the same color living in a CSS var AND a JS object is a magic literal wearing a disguise; pick one source of truth and have the other read it. Remember inline styles beat class rules, so a literal in an inline style outranks every token.
- **Dark mode by `invert()`** — it's a re-tuned ramp (compressed contrast, de-saturated accents, elevation by surface lightness), not a filter.
- **Contrast checked after the fact** — verify 4.5:1 / 3:1 at design time, in the system, not by patching failures later.
- **Type sized by eye** — pick a modular ratio and a fluid scale; reference steps, never nudge px until it looks right.
- **Spacing by eye / magic-px gaps** — `13px` here, `22px` there, a different gutter per component; derive every gap/padding/margin from one spacing scale, on the same rhythm as the type scale.
- **A webfont that shifts layout** — use a metrics-compatible fallback stack; a late font must cause no CLS.
- **Shadows with no shared light source** — one light model, layered shadows, a tokenized z-scale; not a fuzzy box-shadow invented per component.
- **Non-concentric nested radii** — inner radius = outer − padding, or the corners look wrong without anyone knowing why.
- **Icons from three sets / gradients as decoration** — one icon system; texture only with a job and without banding.
- **Motion without a purpose** — if you can't name the job (orient / causality / mask latency / attention), delete it.
- **Animating layout properties / `transition: all`** — compositor-only (transform/opacity); name the property and the dynamics (spring vs curve).
- **No `prefers-reduced-motion` path** — provide a re-tuned reduced experience, not a stripped one.
- **Skipping a GATE** — and remember: every value should trace to the system; if it doesn't, you picked it by hand.

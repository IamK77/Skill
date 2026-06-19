---
name: motion
description: >
  The motion, gesture & feel lens for a frontend build — where every animation
  earns its place and the feel IS the product.
  Use after the build works, when adding interaction physics, when a UI feels
  sluggish / janky or the gesture fights the scroll, or auditing animations.
  The one shift: every animation maps to a PURPOSE and its dynamics come from
  physics (spring vs easing, never confused); the feel is the product; compositor-
  only properties + a real reduced-motion path are non-negotiable — the agent
  animates because it can, feeling none of the jank, so motion must be gated.
  Triggers on "animation / transition / motion /
  spring / damping / bounce / easing / physics", "gesture / drag / scroll / swipe /
  scroll-vs-drag", "feels laggy / disconnected / jank / stiff / floaty",
  "prefers-reduced-motion / a11y", "FLIP / View Transitions / scroll-driven", "60fps /
  compositor / layout thrashing / will-change", "feels native / hand-feel / touch /
  stagger / orchestration / shared element / morph".
argument-hint: "[the UI / component / interaction to give purposeful motion and physics]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# motion

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An *atelier* is a craftsman's studio — the place where judgment is applied to material, where a decision about how something *moves* is as considered as a decision about how it *looks*. `motion` is the feel lens of the `atelier` suite: where the other skills decide *what is true* and *what it looks like*, `motion` decides *what it does when you touch it* — and makes that a **system**, not a pile of ad-hoc durations and default curves. Its product is a written **motion language**: every animation named to a purpose, dynamics derived from physics, gesture conflicts resolved by a declared arbitration policy, and a re-tuned reduced-motion path that preserves meaning. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: motion without a purpose is noise; noise is the fingerprint of agent-generated work.** The agent animates because it can: `transition: all 0.3s ease` applied to every state change, a spring dropped in for "feel," layout properties animated because they were convenient, and no `prefers-reduced-motion` path because no one asked for one. Each choice is locally defensible; the sum is jank, wasted attention, and an accessibility failure. The craft is the same subtraction the rest of the suite preaches: **name the purpose first; delete what has none; derive the dynamics from physics; make the platform carry the work.** Do that and two things happen — the surface *communicates* (a well-choreographed state transition tells users where they are; a precise spring on release tells them the object has real weight) and it *performs* (compositor-only properties stay off the main thread; a declared `touch-action` replaces a non-passive event handler).

This is where the agent era bites:
- **The agent animates decoration.** It reaches for `transition: all 0.3s` or drops a spring on a button fade. Neither has a job; both add noise. The test is merciless: name the purpose or delete the animation.
- **The agent confuses spring and curve.** A hover uses `framer-motion`; a modal fade uses a Bézier. Both "work" until the user grabs the modal mid-animation — the Bézier restarts from scratch; the spring would have carried the velocity. Using a curve where physics is needed, or a spring where a simple discrete 200ms ease-out would do, is a category error the agent makes constantly.
- **The agent forgets gesture arbitration.** A draggable panel is placed inside a scrollable list with no `touch-action`, no `overscroll-behavior`, and no axis-lock — so the finger fights the scroll on every open. The platform primitives exist; they are rarely set.
- **The agent ships no `prefers-reduced-motion` path.** The media query exists, it is never checked, and a user with vestibular sensitivity gets large-translation parallax on every scroll.

**Read [references/motion-purpose-and-physics.md](references/motion-purpose-and-physics.md) first** — the suite's motion spine; everything from easing direction through spring parameter tiers and orchestration patterns lives here. Load at the start, re-check at every gate.

**Speak the user's language.** The decisions are the user's — which animations earn their place, how much bounce the brand personality warrants, where the surface archetype (data tool vs marketing) changes the motion budget. Read their fluency and gloss a term on first use (*purpose taxonomy*, *spring / damping ratio ζ*, *easing curve / cubic-bezier*, *compositor vs layout properties*, *FLIP / View Transitions API*, *scroll-driven animation*, *overscroll-behavior / touch-action*, *prefers-reduced-motion*, *stagger / orchestration*). A motion system the user can't explain to a colleague is style imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/motion-purpose-and-physics.md](references/motion-purpose-and-physics.md)** — the heart: the seven-purpose taxonomy (causality / spatial continuity / feedback / progress / attention / depth / expression); the easing-vs-spring decision tree and why they can never be swapped; direction rules (ease-out for entrances, ease-in for exits); duration as a function of distance; spring parameter tiers by element weight; orchestration patterns (shared-element, stagger, container transform, enter/exit coordination, Z-axis lift); the 12 animation principles that UI actually uses; the ethics / attention test; and restraint as the default posture.
- [references/gesture-arbitration.md](references/gesture-arbitration.md) — nested gesture conflict resolution: the core arbitration law (inner scroller owns until boundary); axis lock and activation threshold; mid-gesture handoff without a jump; platform primitives (`touch-action`, `overscroll-behavior`, Pointer Events, `setPointerCapture`, the passive-listener trap); named conflict patterns and recipes (panel-wraps-scroll, horizontal carousel, swipe-to-delete, pull-to-refresh, edge-swipe drawer, same-axis nested, map/pinch-zoom); and platform convention differences (iOS / Android / Web).
- [references/the-feel-css-deep-water.md](references/the-feel-css-deep-water.md) — the CSS mechanics that separate "knows how to animate" from "knows why it works": the rendering pipeline and where each property falls; compositor-only properties and why `will-change` is temporary; FLIP and the View Transitions API; CSS scroll-driven animations (`animation-timeline: scroll()/view()`); spring numerical integration and why semi-implicit Euler; the stacking-context and containing-block traps that break `fixed` overlays; modern CSS that replaces JS hacks (`:has()`, container queries, anchor positioning, `@property`); and how to use DevTools to diagnose frame drops, paint flashing, and cascade failures.
- [references/reduced-motion-and-performance.md](references/reduced-motion-and-performance.md) — the non-negotiables as technique: the correct `prefers-reduced-motion` contract (re-tune, don't strip; replace vestibular triggers — translation/scale/parallax/rotation — with cross-fade or instant cut; gestures keep working); flicker ≤ 3×/sec (WCAG 2.3.1); every gesture needs a non-gesture alternative; 60fps / 16.7ms budget and how to hold it; the `transform`/`opacity`-only rule and its exceptions (`filter`); latency masking and the < 100ms first-frame rule; state machine framing for complex interactions; color animation in `oklch`/`oklab`.

> **The arc is one motion system.** Three stages — purpose & physics · gesture & intent · compositor, performance & reduced-motion — turn a working surface into one that *feels* right: animations earn their place and get the right dynamics; fingers are never fighting the scroll; and a user who prefers reduced motion gets a re-tuned experience, not silence.

> **Greenfield or audit? Decide the entry.** On a new surface, walk STAGE 0→2 in order. On an existing surface, inventory first: every animation (CSS `transition`, `animation`, JS-driven), its duration and property, and its apparent purpose — cluster by whether the purpose is nameable, whether it animates layout properties, and whether a reduced-motion path exists. That inventory is not a deliverable to perfect; it is the raw material the gates consume. The technique for finding where the un-named animations hide (DevTools Animations panel, a `transition: all` grep, a `will-change` audit) is in **[references/the-feel-css-deep-water.md](references/the-feel-css-deep-water.md)**. The taste call stays a gate: for each cluster you still decide which animations earn their place and what the physics should be.

---

## STAGE 0 — Purpose & physics (name every animation to a job; set the physics)

Open **[references/motion-purpose-and-physics.md](references/motion-purpose-and-physics.md)**. Establish the purpose taxonomy and the motion tokens before anything is tuned.

- **Every animation maps to a purpose — or is deleted.** Before touching timing or curve, classify into the seven jobs: *causality / origin story* (show where a thing came from — the button that triggered the panel); *spatial continuity* (state/route change that preserves the mental map — shared-element morph); *feedback* (confirm input received, first frame < 100ms); *progress / status* (loading, determinate vs indeterminate); *attention / hierarchy* (staggered entrance, what to look at first); *depth / spatial model* (modal forward, drawer from edge); *expression / brand* (the emotional layer — spend it on one signature moment). Anything that doesn't map is noise. Delete it. **Restraint is the default posture; over-animation is an agent-era tell.**
- **Physics by role — spring or curve, never confused.** The decision is mechanical: *discrete, state-to-state, known duration, not interruptible* → **easing curve** (CSS `transition` / Web Animations API). *Gesture-driven, interruptible, needs "physics," must carry velocity* → **spring** (stiffness / damping / mass; library-driven). A Bézier curve restarted mid-flight jumps; a spring carries current position and velocity — that round-trip is the fingerprint of native feel. Easing direction: **entrance → ease-out** (fast start, settle gently — responding to a user action must start instantly); **exit → ease-in** (accelerate away, get out of the way); **on-screen A→B → ease-in-out**. Pure ease-in on an entrance is forbidden — slow start reads as stuck. **Commit curve tokens** (`cubic-bezier(0, 0, 0.2, 1)` ease-out · `cubic-bezier(0.4, 0, 1, 1)` ease-in · `cubic-bezier(0.4, 0, 0.2, 1)` ease-in-out · an asymmetric expressive curve for signature moments). `linear` is reserved for genuinely constant motion: infinite spinner, progress fill, 1:1 drag tracking.
- **Spring parameters from the damping ratio ζ, not by feel.** Design in the two derived quantities: **ω₀ = √(k/m)** (speed) and **ζ = c / (2·√(k·m))** (character). ζ < 1 = underdamped (bounce); ζ = 1 = critical (fastest no-bounce settle); ζ > 1 = overdamped (sluggish, avoid). Design interface: **`response`** (≈ perceived duration, `2π/ω₀`) and **`bounce/dampingFraction`** (≈ ζ). Tiers by element weight: crisp/precise controls ≈ ζ 1.0 / response 0.2–0.3s; standard UI / cards / panels ζ 0.8–1.0 / 0.3–0.5s; modals / large surfaces ζ 0.9–1.0 / 0.4–0.6s; small delight elements ζ 0.5–0.7 / 0.3–0.5s; signature bounce only ζ 0.35–0.5 / 0.4–0.6s. **Bounce budget: most of the site ζ ≥ 0.8** (overshoot ≤ ~1.5%); visible bounce is reserved for the few light/signature elements. Overshoot formula: `exp(−ζπ/√(1−ζ²))`. Commit spring tokens to match the curve tokens.
- **Intensity calibrated to the surface archetype.** The purpose taxonomy is constant everywhere; the motion budget is set by what the surface is *for*. A marketing/brand surface may spend signature, expressive motion; a data/tool/dashboard surface earns motion only for *orientation* (state change), *causality* (what just happened), and *latency masking* — runs crisp and short, and a re-fire under streaming data must never restart or distract. Decide the budget as a taste gate; the taxonomy enforces it.
- **Duration as a function of distance and size.** Duration grows sub-linearly with travel and element size. **Exit ≈ 0.6–0.8× entrance.** Perceptual bands: < ~100ms = not perceived as motion; most functional UI = 150–400ms; > ~400–500ms starts to feel sluggish (signature/hero excepted). First frame of feedback < 100ms even when the full animation is longer. Stagger: 20–60ms between adjacent items, total duration capped (never linearly stagger 50 items — cap visible count or use a decay curve).

### GATE — clear before GESTURE
1. `checklist check purpose purpose-and-physics-committed`
2. `checklist verify purpose`

---

## STAGE 1 — Gesture & intent arbitration (scroll vs drag; conflict resolution)

Open **[references/gesture-arbitration.md](references/gesture-arbitration.md)**. Every gesture conflict must be declared and resolved before a finger is confused.

- **Axis lock and activation threshold.** Commit only after displacement **> ~8–10px** (a tap must not be misread as a drag). Assign by the displacement vector's angle: within **±~30°** of an axis belongs to that axis; the middle is a diagonal ambiguity zone — pick one policy (dominant-component-first or a small deadzone) and hold it site-wide. **First move locks the axis** for the rest of the gesture; the other axis is ignored (kills sideways jitter in a vertical scroll).
- **The core arbitration law.** The inner scroller consumes vertical gestures; *unless* it has already hit its boundary in the gesture's direction, at which point the gesture hands off to the outer panel. For a full-height panel containing a list scrolled to top: drag down with `scrollTop=0` → inner can't scroll → hand to panel; drag up → list scrolls, panel still. Once the panel starts dragging, lock the inner scroll until the panel returns to full-height and the gesture reverses.
- **Mid-gesture handoff — zero-jump is the hard constraint.** At handoff, the taker must start from the *exact current position* and consume only the **overflow past the boundary** — otherwise the element jumps by the overflow amount. Velocity transfer is a design choice held consistently: *chain* the residual fling velocity to the outer (iOS-style flick keeps going) or *absorb* it (stop at the edge, require a deliberate re-pull). Use boundary tolerance `scrollTop ≈ 0 / ≈ maxScroll` (~1px).
- **Platform primitives — declarative first, `preventDefault` last.** `overscroll-behavior: contain` stops scroll-chaining to ancestors (a modal's list at bottom no longer scrolls `body`) — first tool to reach for. `touch-action: pan-y` declares browser owns vertical scroll, horizontal gestures go to JS (mandatory for horizontal carousel inside vertical page); `pan-x` reverse; `none` = all to JS; `manipulation` = no double-tap zoom — the declarative workhorse for axis arbitration, and the agent almost never sets it. Pointer Events + `setPointerCapture` — build for pointer, not mouse-only. **Passive-listener trap:** `touchmove` is passive at document level by default (`preventDefault` silently no-ops); intercepting scroll needs `{passive:false}` — that hurts scroll perf, so anything solvable with `touch-action`/`overscroll-behavior` must NOT use non-passive `preventDefault`.
- **Named conflict patterns, declared.** *Vertical page + horizontal carousel* → page `touch-action: pan-y`, carousel handles pan-x, angle threshold on diagonal. *Swipe-to-delete row in scroll list* → angle test, lock once horizontal commits. *Pull-to-refresh* → fire only at `scrollTop=0` + downward + displacement threshold + rubber-band resistance; `overscroll-behavior-y: contain`. *Edge-swipe drawer over horizontal content* → reserve first ~16–20px for drawer. *Same-axis nested scroll* → inner to boundary then chains to outer via `overscroll-behavior`. *Map/pinch-zoom inside scroll* → `touch-action: none`, take over everything in JS.
- **Gesture physics on release.** 1:1 during drag — no easing, no spring, direct position tracking. At release: measure velocity over **last ~50ms window (EMA of Δx/Δt), never the whole-gesture average** (the average badly underestimates a "slow-then-flick"). Project the momentum endpoint: `current + v₀·rate/(1−rate)` (v₀ in px/ms, rate ≈ 0.998 normal / 0.99 fast), find nearest snap point *to the projection*, spring to it carrying v₀. **Flick-to-next threshold:** |v₀| > ~500 px/s → ignore position, go to next detent in fling direction. **Rubber-band:** Apple formula `b(x,d,c) = (1 − 1/(x·d/c + 1))·c` with d ≈ 0.55, c ≈ container dimension; or simplified `displacement × 0.2–0.5`.
- **Interruptibility as a requirement.** A spring mid-flight must be grababble: capture current *position + velocity*, return to 1:1 gesture tracking; on re-release, feed position + velocity back to the spring. This round-trip is the entire secret of "it is one continuous physical object." Model complex draggable interactions as a **state machine**: `idle → dragging → settling → snapped` — explicit legal transitions instead of flag juggling.

### GATE — clear before REDUCED-MOTION
1. `checklist check gesture gesture-arbitration-declared`
2. `checklist verify gesture`

---

## STAGE 2 — Reduced-motion, compositor-only & 60fps

Open **[references/reduced-motion-and-performance.md](references/reduced-motion-and-performance.md)** and **[references/the-feel-css-deep-water.md](references/the-feel-css-deep-water.md)**. These are non-negotiables — not taste decisions.

- **`prefers-reduced-motion` is a re-tuned path, not an off switch.** Replace the vestibular triggers — large translation, scale, parallax, rotation — with a cross-fade or instant cut; *keep* the necessary feedback (the user still needs to know a panel opened). For gestures: swap momentum/bounce for a fast fade or instant snap — the gesture still works, only the physics flourish is gone. Flicker **≤ 3×/sec** (WCAG 2.3.1). Critical information must never be conveyed by motion alone. Every gesture needs a **non-gesture alternative** (a swipe-to-dismiss panel also has a close button; keyboard scroll; focusable controls). Persons using switch control or voice control cannot perform gestures — gesture must never be the only path.
- **Compositor-only properties.** The rendering pipeline is parse → style → **layout → paint → composite**. Animating `width/height/top/left/margin` triggers layout reflow and drops frames. Animate **`transform` and `opacity` only**; `filter` is permitted but paint-heavy. To animate a layout change cheaply: **FLIP** (First/Last measure → Invert with a counter-transform so it *looks* unmoved → Play the transform to 0) or the **View Transitions API** (`document.startViewTransition()` + `view-transition-name` — automatic FLIP-style + shared-element morph; works for both SPA state changes and MPA cross-document navigation; prefer it over hand-rolled FLIP). **`will-change` is a temporary hint** — set just before the animation, removed after; leaving it on costs GPU memory and may harm more than help. Animate color in **`oklch`/`oklab`** to avoid the sRGB gray dead-zone.
- **60fps held under load.** 60fps = 16.7ms/frame; 120fps = 8.3ms/frame — the animation must stay on the compositor thread. Don't stack heavy animations on scroll or first-paint. JS-driven heavy animation blocks the main thread and hurts INP. **Quantified check:** only `transform`/`opacity` animated · no dropped frames in the Rendering panel · single-interaction main-thread work < ~50ms. For springs: prefer **semi-implicit (symplectic) Euler** integration over closed-form analytic `x(t)` — the analytic solution is cheaper but awkward when the target changes mid-flight; per-frame integration handles interruption and target changes natively (why most libraries use it). Use fixed step / sub-stepping at low frame rates to avoid divergence.
- **Mask latency to preserve the causal story.** The user's action must *visibly, immediately* cause the result; when the real result is slow, show the optimistic/skeleton response inside the < 100ms feedback window so the cause→effect link is never broken. `transform-origin` is the mechanical implementation of causality: a tooltip scaling from its anchor, a menu expanding from the trigger corner, a modal growing from the button that opened it — set the origin to the causal source, not the element's center.
- **CSS scroll-driven animations.** `animation-timeline: scroll()` / `view()` — no JS, no IntersectionObserver; compositor-friendly when only `transform`/`opacity` are animated. Prefer over JS-driven scroll effects.

### FINAL GATE
1. `checklist check compositor compositor-only-reduced-motion-and-60fps`
2. `checklist verify compositor`
3. `checklist show` — confirm all three stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`motion` is the suite's **kinetic conscience** — the place where taste about feel is gated, where the agent's default of "animate everything, animate layout, ignore reduced-motion" is refused. It runs after the surface has its visual system, and its motion language is what `lookout` later measures as felt performance and what `bulwark` must keep from regressing. The through-line is the suite's own — *push correctness into structure* — applied to movement: an animation derived from a purpose taxonomy and a physics system can't drift the way a hand-typed `0.3s ease` can. The line that keeps `motion` honest: **the document holds the encodable technique (how ζ controls overshoot, how `touch-action` routes a gesture axis, how FLIP does layout animation without layout cost); the taste — which animations earn their place, how much bounce the brand warrants, where the surface archetype sets the motion budget — stays a gate the user clears.** Blur that line and the skill becomes a recipe book; hold it and it stays a lens.

## Anti-patterns (use as a pre-flight checklist)

- **`transition: all 0.3s`** — never. Name the property, name the duration, name the curve. `all` animates layout properties, triggers reflow, hides intent, and fires on properties you didn't mean to animate.
- **Spring where a curve belongs** — hover/fade/discrete open: easing curve. Touch/interruptible/gesture-driven: spring. The test: can the animation be grabbed mid-flight? If yes, spring.
- **Curve where a spring belongs** — a Bézier restarted mid-animation jumps; a spring carries current position and velocity. Re-triggerable gestures always need a spring.
- **Animating layout properties** — `width`, `height`, `top`, `left`, `margin`, `padding` animate on the main thread. Use FLIP or View Transitions API instead.
- **`will-change` left on permanently** — it promotes the layer, costs GPU memory, and may hurt compositing of nearby elements. Set before the animation, remove after.
- **No `prefers-reduced-motion` path** — the media query is mandatory. Replace vestibular triggers with cross-fade or instant cut; keep necessary feedback; never strip motion entirely and leave the user without state information.
- **Motion only path** — a swipe-to-dismiss must also have a close button; a drag-and-drop must also have keyboard ordering. Gesture as the only path is an accessibility failure.
- **Animating color in sRGB/HSL** — interpolation crosses the gray dead-zone; use `oklch`/`oklab`.
- **Purpose-less animation** — if you cannot name the purpose from the seven-job taxonomy, delete it. "It looks nice" is not a purpose.
- **Uniform stagger on long lists** — cap total duration; use a decay curve so later items accelerate rather than linearly staggering all fifty items.
- **Whole-gesture average for velocity** — the average underestimates a "slow-then-flick." Always EMA over the last ~50ms window.
- **`preventDefault` on passive listeners** — silently no-ops at document level; use `touch-action` and `overscroll-behavior` instead; only drop to `{passive:false}` when declaration can't cover it, and document why.
- **No activation threshold on drag** — a tap becomes a drag at the first pixel. Require > ~8–10px before committing to a drag decision.
- **Mid-gesture handoff with a jump** — the incoming owner must start from the exact boundary point and consume only the overflow, not reset position to zero.
- **Skipping a GATE** — and remember: every animation should trace to a purpose and a physics decision; if it doesn't, it was invented by hand.

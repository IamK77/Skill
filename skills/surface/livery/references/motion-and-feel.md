# Motion & Feel — purpose, physics, and a 60fps reduced path

The encodable technique behind the motion gate. Taste decides what the motion is *for* and how lively it feels; this doc holds the system that turns that decision into correct, interruptible, 60fps technique. The thread holds here too: **a duration, a curve, a spring config, a stagger interval is a TOKEN derived from a small system (purpose + physics), never invented per animation.** Motion is not decoration — it is a function, and an animation that maps to no function is noise. Restraint is the default; over-animation is itself a tell of agent-generated work.

## Motion has a purpose — or it is deleted

Before it ships, classify every animation into one job. No job → it is noise → delete it.

- **Causality / origin story** — show where a thing came from and went to; the clicked button *grows* the new element (transform-origin is the mechanism, below).
- **Spatial continuity** — on state/route change, keep the user's mental map; a thing *persists* and moves rather than teleports (shared-element morph).
- **Feedback** — confirm input was received; first visible response **< 100ms** (below).
- **Progress / status** — communicate an ongoing process (loading; determinate vs indeterminate).
- **Attention / hierarchy** — order what gets seen first (staggered entrance; lead/settle).
- **Depth / spatial model** — establish Z relationships (modal forward, drawer from edge).
- **Expression / brand** — the emotional layer; spend it on *one* signature moment, not everywhere.

Scatter-shot effects < one orchestrated moment. Firing everything at once is amateur; a sequenced entrance reads as designed. Be wary of idle/ambient motion (things moving with no user action) — it is a frequent "AI smell."

**Named orchestration patterns (reusable):** *shared-element / morph* (a thumbnail expands into the detail image → spatial continuity); *staggered reveal* (list/grid items enter in sequence → attention); *container transform* (a container expands while its children fade/scale in); *enter/exit coordination* (old content leaves first or cross-fades with new — never a hard simultaneous cut); *Z-axis lift* (a modal scales up while its shadow grows larger and softer → reads as forward, echoing the depth model).

**The 12 animation principles that UI actually uses (non-default):** *Anticipation* — a tiny reverse wind-up before a big move. *Follow-through / overlap* — secondary elements start/stop slightly after the primary, producing layering. *Arcs* — cross-screen moves follow a curve, not a straight line. *Squash & stretch* — in UI, extremely restrained: a faint scale on button-press. *Staging* — lead one focus at a time. *Exaggeration* — controlled, signature moments only.

**Ethics — the attention test.** Motion can hijack attention, manufacture false urgency, or drag the eye toward a commercial goal. Decision rule: does this animation serve **the user's task** or **your attention capture**? The latter is a dark pattern.

## Physics vs curves — the choice that defines feel

Two engines, one decision tree. Confusing them is the root mistake.

```
discrete · state-to-state · known duration · not interruptible
        └─ easing curve  (CSS transition / Web Animations API)

gesture-driven · interruptible · needs "physics" · must carry velocity
        └─ spring  (stiffness/damping/mass; library-driven)
```

A spring is defined by **stiffness / damping / mass**, *not* by a duration — which is exactly why it can be interrupted and can inherit a release velocity. That property is the fingerprint of native feel; a Bézier curve restarted mid-flight jumps. Use curves for the cheap, declarative 90% (a hover, a fade, a discrete open) and springs for anything a finger touches or anything that must redirect without a jump.

## Easing curves — direction and duration

Default error: `linear` for everything, or one `ease` everywhere. Easing = energy and mass: real objects accelerate (ease-in) and decelerate (ease-out).

**Direction (the single most important rule):**
- **Entrance / responding to a user action → ease-out** (decelerate into place). Anything answering the user must *start instantly* (fast start = "follows my finger") then settle gently.
- **Exit → ease-in** (accelerate away — get out of the way fast).
- **On-screen A→B move → ease-in-out** (standard).
- Pure ease-in on an entrance = slow start = feels stuck. Forbidden.

**Curve tokens (`cubic-bezier`):**
```
ease-out  / decelerate (entrance, response)   cubic-bezier(0, 0, 0.2, 1)
ease-in   / accelerate (exit)                 cubic-bezier(0.4, 0, 1, 1)
ease-in-out / standard (move)                 cubic-bezier(0.4, 0, 0.2, 1)
expressive (dramatic entrance)                asymmetric: very fast start, long slow tail
```
Make these tokens, reuse site-wide. `linear` is reserved for genuinely constant motion with no start/end: infinite spinners, progress fill, 1:1 drag-tracking.

**Duration is a function of distance and size — and entrance ≠ exit:**
- Duration grows sub-linearly with travel distance / element size (small/short = faster, large/cross-screen = slower).
- **Exit ≈ 0.6–0.8× the entrance duration.**
- Perceptual bands: **< ~100ms** is not perceived as motion (≈ instant); most functional UI lands **150–400ms**; **> ~400–500ms** starts to feel sluggish (signature/hero only).
- **First frame of feedback < 100ms** even when the full animation is longer.
- **Stagger interval 20–60ms** between adjacent list items; > ~80ms feels slow; **cap total duration** (never linearly stagger 50 items — cap visible count or use a decay curve so later items accelerate).
- Typical layering: micro-feedback 50–150ms · standard transition 200–300ms · large/complex 300–500ms · expressive hero may go longer.

## Spring parameters — the real knobs

A spring is a 2nd-order system: `m·x″ + c·x′ + k·x = 0`. The three raw params:
- **stiffness `k`** — restoring force → how fast it wants to reach target.
- **damping `c`** — dissipation → how much bounce is suppressed.
- **mass `m`** — inertia → how "heavy."

Don't tune `k/c/m` directly; they're unintuitive. Think in the two *derived* perceptual quantities:
- **natural frequency ω₀ = √(k/m)** → controls **speed**.
- **damping ratio ζ = c / (2·√(k·m))** → controls **character** (the critical knob):

| ζ | type | behavior |
|---|---|---|
| ζ < 1 | underdamped | overshoot + oscillation (bounce); smaller ζ = bouncier |
| ζ = 1 | critical | **fastest settle with no overshoot** (the crispest "no bounce") |
| ζ > 1 | overdamped | slow approach, no overshoot, usually sluggish — avoid in UI |

**Design interface = `response` + `bounce`** (iOS UISpring / Framer Motion / react-spring):
- **`response`** (perceived duration, seconds) = `2π/ω₀ = 2π·√(m/k)`. Larger = slower/looser.
- **`bounce`**: Apple `dampingFraction` = **ζ** (0 = max bounce, 1 = none); Framer `bounce` ≈ **1 − ζ**.
- Convert back to a library wanting `k/c/m`: `k = m·(2π/response)²`, `c = 2·ζ·√(k·m)`.

**Parameter tiers by element weight/role** — heavier/more-precise/data-bearing → higher ζ (less or no bounce) and shorter response; lighter/playful → lower ζ (visible overshoot). Larger elements get longer response.

| tier | use | ζ | response | overshoot |
|---|---|---|---|---|
| crisp/precise | buttons, switches, data, controls | ≈ 1.0 | 0.2–0.3s | none |
| standard UI | most transitions, cards, panels | 0.8–1.0 | 0.3–0.5s | 0–tiny |
| smooth | modals, drawers, large surfaces | 0.9–1.0 | 0.4–0.6s | none |
| lively | small delight elements, badges | 0.5–0.7 | 0.3–0.5s | visible |
| bouncy (sparingly) | signature moments only | 0.35–0.5 | 0.4–0.6s | obvious |

**Bounce budget:** most of the site sits at **ζ ≥ 0.8** (overshoot ≤ ~1.5%); visible bounce is reserved for the few light/signature elements. Overshoot ratio is exact: `exp(−ζπ/√(1−ζ²))` → ζ 0.2:53% · 0.3:37% · 0.5:16% · 0.6:9.5% · 0.7:4.6% · 0.8:1.5%.

**Continuing from current velocity (interruptibility):** a spring never analytically reaches target, so set a **rest threshold** — when displacement < `restDistance` (~0.5px or 0.5%) *and* velocity < `restVelocity`, snap to target and stop the rAF loop (settle time ≈ `4/(ζ·ω₀)`). When a re-trigger or grab happens mid-flight, **capture current position AND current velocity** and feed them as initial conditions — the animation continues, it does not jank-restart. This round-trip of *position + velocity between gesture and spring* is the entire secret of "it is one continuous physical object."

## Gesture intent & arbitration — scroll vs drag

One pointer stream is fought over by nested consumers (draggable panel wrapping a scrollable list, horizontal carousel inside a vertical page, swipe-to-delete row inside a scroll list). At every instant the gesture must route to **exactly one** consumer, sometimes handing off mid-gesture *without a jump*. Two questions, asked at start and continuously: **which axis** (direction intent) and **whose** (ownership).

**Axis lock:**
- **Activation threshold:** commit only after displacement **> ~8–10px** (so a tap isn't misread as a drag).
- **Angle test:** assign by the displacement vector's angle; within **±~30°** of an axis belongs to that axis; the middle is a diagonal ambiguity zone (pick "dominant-component-first" or a small deadzone — one policy, site-wide).
- **First-move locks the axis** for the rest of the gesture; ignore the other axis (kills sideways jitter during a vertical scroll).

**Core arbitration law (panel-wraps-scroll, the canonical case):** *the inner scroller consumes vertical gestures; UNLESS it has already hit its boundary in the gesture's direction, at which point the gesture hands off to the outer panel.* For a full-height panel containing a list scrolled to top: drag down with `scrollTop=0` → inner can't scroll → hand to panel (drags toward dismiss); drag up → list scrolls normally, panel still. Once the panel starts dragging, **lock the inner scroll** until the panel returns to full-height and the gesture reverses.

**Mid-gesture handoff (zero-jump is the hard constraint):** at the handoff instant the taker must start from the *exact current position* and consume only the **overflow past the boundary** — otherwise the element jumps by the overflow amount. Velocity transfer is a design choice held consistently: **chain** the residual fling velocity to the outer (iOS-style flick keeps going) or **absorb** it (stop at the edge, require a deliberate re-pull). iOS leans absorb; Android NestedScrolling can chain. Use boundary tolerance `scrollTop ≈ 0 / ≈ maxScroll` (~1px).

**Platform primitives — declarative first, `preventDefault` last (the agent's blind spot):**
- **`overscroll-behavior`** — `contain` stops scroll-chaining to ancestors/page (a modal's list at its end no longer scrolls `body`); `none` also kills pull-to-refresh and the overscroll glow. *First tool to reach for.*
- **`touch-action`** — declares which gestures the browser handles natively. `pan-y` = browser owns vertical scroll, horizontal gestures go to your JS (mandatory for a horizontal carousel inside a vertical page); `pan-x` is the reverse; `none` = all to JS; `manipulation` = kill double-tap zoom. *The declarative workhorse for axis arbitration, and the agent almost never sets it.*
- **Pointer Events + `setPointerCapture`** — capture the gesture's subsequent pointer events onto one element. Build for pointer, not mouse-only.
- **Passive-listener trap:** `touchmove` is passive by default at the document level (`preventDefault` silently no-ops); intercepting scroll needs `{passive:false}` — but that hurts scroll perf. So: anything solvable with `touch-action`/`overscroll-behavior` must NOT use non-passive `preventDefault`.

**Named conflict patterns & recipes:** *vertical page + horizontal carousel* → page `touch-action: pan-y`, carousel handles pan-x, angle threshold disambiguates the diagonal. *Swipe-to-delete row in a scroll list* → horizontal = delete, vertical = scroll; angle test, lock once horizontal commits. *Pull-to-refresh* → fire only at `scrollTop=0` + downward + a displacement threshold + rubber-band resistance; `overscroll-behavior-y: contain` takes the overscroll. *Edge-swipe drawer over horizontal content* → reserve the first **~16–20px** edge zone for the drawer; past it falls through to the inner horizontal scroll. *Same-axis nested scroll* → inner consumes to its boundary then chains to outer, governed by `overscroll-behavior`. *Map / pinch-zoom inside a scroll* → `touch-action: none`, take over pinch / pan / page-scroll entirely in JS.

**Platform conventions (match the user's platform or own one consistent cross-platform model):** iOS = scroll owns until it hits the top, *then* the panel; global rubber-band; momentum leans absorb. Android = Material BottomSheet + NestedScroll protocol; fling can chain; overscroll renders as a **stretch / glow, not a rubber-band**. Web = rebuild it with `touch-action` + `overscroll-behavior` + Pointer Events; iOS Safari adds body-scroll and whole-page rubber-band quirks.

**Gesture physics on release** (the same spring math, applied to detents): project the momentum endpoint `projectedEndpoint = current + v₀·rate/(1−rate)` (`v₀` in px/ms, `rate ≈ 0.998` normal / `0.99` fast), find the nearest snap point *to the projection* (not the release position — so a light flick still reaches the next detent), then spring to it carrying `v₀`. **Flick-to-next threshold:** if `|v₀| > ~500 px/s`, ignore position and go to the *next* detent in the fling direction. **Measure velocity over the last ~50ms window (EMA of Δx/Δt), never the whole-gesture average** — the average badly underestimates a "slow-then-flick" and makes flicks feel dead. During a drag, motion is **1:1, no easing/spring** (`position = origin + accumulated delta`); the spring takes over only at release. **Rubber-band** past a boundary: Apple's `b(x,d,c) = (1 − 1/(x·d/c + 1))·c` with `d ≈ 0.55`, `c ≈ container dimension` (hard asymptote); or the simplified `displacement · 0.2–0.5`.

## The non-negotiables

These are not taste — they are correctness. A gate fails if any is missing.

- **`prefers-reduced-motion` is a re-tuned path, not an off switch.** Replace large translation/scale/parallax/rotation (the vestibular triggers) with cross-fade or instant cut; *keep* the necessary feedback. For gestures: swap momentum/bounce for a fast fade or instant snap — the gesture still works, only the physics flourish is gone. Flicker **≤ 3 times/sec** (WCAG 2.3.1). Critical information must never be conveyed by motion alone, and every gesture needs a **non-gesture alternative** (a swipe-to-dismiss panel also has a close button; keyboard scroll; focusable controls).
- **Compositor-only properties — `transform` and `opacity` only.** The pipeline is parse → style → **layout → paint → composite**; animating `width/height/top/left/margin` triggers layout reflow and drops frames. To animate a layout change cheaply use **FLIP** (First/Last measure, Invert with a transform so it *looks* unmoved, Play the transform to 0) or the platform **View Transitions API** (`document.startViewTransition()` + `view-transition-name`, automatic FLIP-style + shared-element morph; works for both SPA state changes and MPA cross-document navigation; prefer it over hand-rolled FLIP). `will-change` is a *temporary* hint set just before the animation and removed after — leaving it on costs GPU memory. Animate color in `oklch`/`oklab` to avoid the sRGB gray dead-zone.
- **60fps held under load.** 60fps = **16.7ms/frame**; 120fps = **8.3ms/frame** — the animation must stay on the compositor thread. Don't stack heavy animations on scroll or first-paint. JS-driven heavy animation blocks the main thread and hurts INP. Quantified check: only `transform`/`opacity` animated · no dropped frames in the Rendering panel · single-interaction main-thread work < ~50ms. For springs, prefer **numerical integration over the closed-form solution** — the analytic `x(t)` is cheap but awkward when the target moves mid-flight, whereas per-frame integration handles interruption and target changes natively (why most libraries use it); integrate with **semi-implicit (symplectic) Euler** (explicit Euler diverges at high stiffness); use a fixed step / sub-stepping at low frame rates.
- **Mask latency to preserve the causal story.** The user's action must *visibly, immediately* cause the result; when the real result is slow, show the optimistic/skeleton response inside the < 100ms feedback window so the cause→effect link is never broken. `transform-origin` is the mechanical implementation of causality — a tooltip scaling from its anchor, a menu from the trigger corner, a modal from the button that opened it — so set the origin to the causal source.

## Implementation selection

```
simple · discrete · declarative · compositor-friendly   → CSS transition / animation
needs JS control · interruptible · dynamic params        → Web Animations API (element.animate)
DOM state change · route transition · shared element     → View Transitions API (over hand-rolled FLIP)
scroll-linked                                            → CSS scroll-driven (animation-timeline: scroll()/view())
gesture · spring · velocity carry · interruptible physics → spring library (Motion / Framer Motion / react-spring)
```

A complex interaction is itself a **state machine** — a draggable snapping panel is `idle → dragging → settling → snapped`; model the legal transitions explicitly rather than juggling flags.

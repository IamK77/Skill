# Gesture Arbitration — scroll vs drag, nested conflicts, platform primitives

> One pointer stream is fought over by multiple nested consumers. At every instant the gesture must route to *exactly one* consumer, sometimes handing off mid-gesture without a jump. This is the hardest real-world interaction problem in frontend work, and the one the agent most reliably gets wrong — it ships no `touch-action`, no `overscroll-behavior`, and no axis-lock, and the finger fights the scroll on every open. The platform has declarative primitives for most of this. Use them.

---

## The two root questions

At gesture start and continuously throughout: **which axis** (direction intent) and **whose** (ownership). Answer both before a finger is confused.

---

## Axis lock and activation threshold

- **Activation threshold: > ~8–10px** before committing to a drag decision. Below this, treat as a tap. Without it, any momentary finger wobble becomes an unintended drag.
- **Angle test:** assign the gesture to an axis by the displacement vector's angle. Within **±~30°** of the horizontal or vertical axis, it belongs to that axis. The diagonal zone in between is ambiguous — pick one resolution policy and hold it site-wide:
  - *Dominant-component-first:* whichever axis has the larger delta owns.
  - *Small deadzone:* do nothing until the vector leaves the ambiguous zone.
- **First move locks the axis** for the entire gesture. Ignore the other axis from that point forward — this kills horizontal drift during a vertical scroll and vertical drift during a horizontal swipe.

---

## The core arbitration law

For the canonical case — a draggable panel containing a scrollable list:

> **The inner scroller consumes vertical gestures; unless it has already hit its boundary in the gesture's direction, at which point the gesture hands off to the outer panel.**

Worked example (full-height panel, list scrolled to top):

- **Drag down** with `scrollTop=0` → inner cannot scroll down → gesture hands to panel → panel moves toward dismiss.
- **Drag up** → list scrolls normally; panel does not move.
- Once the panel begins to drag, **lock the inner scroll** until the panel returns to full-height AND the gesture reverses direction.

The same law applies symmetrically for any nested consumer pair. The consumer with more specific scope (inner) always owns first; the outer consumer inherits only at the boundary.

---

## Mid-gesture handoff — zero-jump is the hard constraint

When the inner consumer hits its boundary while the user is still pulling, the outer consumer must take over. The constraint: **the element must not jump**.

What breaks it: the new owner applies the full pointer delta from the gesture start (or resets position to origin) — the element snaps by the overflow amount.

What fixes it: the new owner starts from the **exact current position** and consumes only the **delta past the boundary crossing point** — the surplus that pushed past the boundary, nothing more.

**Velocity transfer — decide once, hold consistently:**
- **Chain:** the residual velocity from the inner fling carries through to the outer (a list flung to the top continues the momentum into pulling the panel). iOS-style. Feels continuous.
- **Absorb:** velocity stops at the boundary; the user must deliberately re-pull the outer. Requires a second intentional action but feels more controlled.

iOS leans absorb for the panel-wraps-list case. Android NestedScrolling can chain. Pick one and own it as the site-wide convention — mixing them within the same surface is disorienting.

Boundary tolerance: `scrollTop ≈ 0` or `scrollTop ≈ maxScrollTop` with ~1px tolerance (exact-zero comparison fails due to fractional subpixel scroll values).

---

## Platform primitives — declarative first

The agent's blind spot: these primitives exist, solve most conflicts declaratively, and are almost never set.

**`overscroll-behavior`** — controls what happens when a scroll hits its boundary:
- `contain` — stops scroll chaining to the parent/body (a modal's inner list scrolled to the bottom no longer drags the page). **First tool to reach for in any nested-scroll situation.**
- `none` — also disables the native pull-to-refresh overscroll glow/rubber-band effect.
- Default: scroll chains to the parent.

**`touch-action`** — declares which gestures the browser handles natively vs routes to JS:
- `pan-y` — browser handles vertical scrolling; horizontal gestures go to your JS. Mandatory for a horizontal carousel inside a vertical-scrolling page.
- `pan-x` — browser handles horizontal scrolling; vertical to JS.
- `none` — all gestures go to JS (use for pinch-zoom containers, map interactions).
- `manipulation` — allows pan and pinch-zoom, disables double-tap-to-zoom. Appropriate for most interactive surfaces.
- **The declarative workhorse for axis arbitration.** Setting it correctly on the right container replaces most `preventDefault` hacks.

**Pointer Events + `setPointerCapture`:**
- `setPointerCapture(pointerId)` — routes all subsequent pointer events for this pointer to this element, even when the pointer moves outside. Use to keep gesture tracking stable during fast drags that exit the element.
- **Build for Pointer Events, not mouse events.** Pointer Events work for mouse, pen, and touch with one handler. Mouse-only event handlers are incomplete on touch devices.

**The passive-listener trap:**
- `touchmove` is passive by default at the document level — `preventDefault()` silently no-ops.
- To prevent native scroll you need `{ passive: false }` — but that opts the listener out of the browser's passive-listener optimization and **hurts scroll performance on the whole page**.
- The rule: **anything solvable with `touch-action` or `overscroll-behavior` must NOT use non-passive `preventDefault`**. Only drop to `{ passive: false }` when the declarative primitives genuinely can't express the constraint, and document why.

---

## Named conflict patterns and their solutions

**Vertical page + horizontal carousel:**
Set `touch-action: pan-y` on the page body. The carousel container handles `pan-x` gestures. Use the angle threshold to disambiguate diagonal first-moves.

**Swipe-to-delete row inside a scroll list:**
Horizontal swipe = delete; vertical swipe = scroll. Angle test: if |deltaX| > |deltaY| at the activation threshold, lock horizontal and go into swipe-to-delete mode; otherwise fall through to native scroll. Once horizontal is committed, `touch-action: none` on the row to prevent jitter.

**Pull-to-refresh:**
Fire only when `scrollTop === 0` (within tolerance) AND the gesture is downward AND displacement exceeds a minimum threshold. Apply rubber-band resistance progressively during the over-pull. Use `overscroll-behavior-y: contain` to claim the overscroll zone rather than relying on the native behavior (which is platform-specific).

**Edge-swipe drawer over horizontal content:**
Reserve the first **~16–20px** of the leading edge for the drawer gesture zone. Pointer events that start in this zone begin the drawer drag; those that start outside fall through to the inner horizontal scroll.

**Same-axis nested scroll (scrollable region inside a scrollable page):**
Inner consumer scrolls to its boundary, then `overscroll-behavior: contain` decides whether to chain to the outer or stop. Default chain if the inner has `overscroll-behavior: auto`; stop at boundary with `contain`.

**Map or pinch-zoom content inside a scrolling page:**
Set `touch-action: none` on the map container and handle all gestures — pinch, pan, two-finger scroll, and implicit page scroll — manually in JS. The map takes full ownership.

---

## Gesture physics on release

1:1 tracking during the drag — no easing, no spring. `position = origin + accumulated_delta`. The spring takes over only at release.

**Velocity measurement — the most commonly broken step:**
Measure velocity over the **last ~50ms window using an exponential moving average (EMA) of Δx/Δt**. Never use the whole-gesture average — a "slow-then-flick" pattern severely underestimates the actual release speed at the end, making flicks feel dead.
```
v = EMA(Δx/Δt, window ≈ 50ms)
```
Decompose by axis — horizontal and vertical velocities tracked separately.

**Snap point selection:**
Project the momentum endpoint: `projectedEndpoint = current + v₀·rate/(1−rate)` where v₀ is in px/ms and `rate ≈ 0.998` (normal deceleration) or `0.99` (fast). Find the nearest snap point *to the projected endpoint*, not to the release position — this is what makes a light flick still reach the next detent.

**Flick-to-next threshold:**
If `|v₀| > ~500 px/s`, ignore position entirely and snap to the *next* detent in the fling direction. This is the "fast flick" behavior; below the threshold, snap to the nearest projected detent.

**Spring carry:**
Spring from current position to the selected snap point, using the release velocity `v₀` as the spring's initial velocity. The spring carries the momentum.

**Rubber-band past boundary:**
Apply progressive resistance when the user pulls past a hard boundary. Apple's formula:
```
b(x, d, c) = (1 − 1/(x·d/c + 1)) × c     d ≈ 0.55, c ≈ container dimension
```
`x` is the raw overshoot, `b(x)` is the damped displacement, `c` is the asymptote (you can never pull more than ~c pixels past the boundary). Simplified version: `damped = rawOvershoot × 0.2–0.5` (lower coefficient = harder boundary). On release while over-pulled, spring back to the boundary.

---

## Interruptibility — the spring's core advantage

A spring mid-flight must be interruptible: when the user re-grabs the element during its animation, **capture current position AND current velocity**, and return to 1:1 gesture tracking from that exact state. On re-release, feed the new position and velocity back to the spring.

This position + velocity round-trip between gesture and spring is the complete secret of "this is one continuous physical object." Bézier curves restarted mid-flight jump to their start position — there is no mid-flight position + velocity to carry. This is why interruptible animations always need springs.

**Rest threshold — stop the spring loop:**
A spring theoretically never reaches its target (asymptotic convergence). Without a rest threshold it runs a `requestAnimationFrame` loop forever at near-zero velocity, wasting CPU and battery. Stop when: `|displacement| < restDistance` (~0.5px or 0.5% of the travel) **AND** `|velocity| < restVelocity` — snap to target exactly and cancel the rAF loop. Estimated settle time: `t_settle ≈ 4/(ζ·ω₀)` (~2% envelope, four time constants).

**State machine framing:**
Complex draggable interactions are state machines:

```
idle → dragging → settling → snapped
idle → dragging → settling → dismissed
```

Model the legal transitions explicitly rather than managing competing boolean flags. Each state has a defined entry condition, exit condition, and behavior. This eliminates "what do you do if the user grabs during settling" ambiguity.

---

## Platform conventions — match the user's expectation

**iOS:** scroll owns the gesture until it hits the boundary in the scroll direction, *then* the outer panel takes over. Global rubber-band overscroll. Momentum transfer on handoff tends to absorb. Whole-page rubber-band quirks in Safari.

**Android:** Material BottomSheet + NestedScrolling protocol; flings can chain across boundaries; overscroll renders as a stretch/glow animation (not a rubber-band). `overscroll-behavior` maps to NestedScrolling intent.

**Web:** Rebuild from `touch-action` + `overscroll-behavior` + Pointer Events. No native nested-gesture protocol exists; browsers have varying defaults; iOS Safari has body-scroll and whole-page rubber-band quirks that require special casing.

Decision: either match the platform the user is on (best for native-feeling apps) or define a consistent cross-platform model and own it completely (acceptable if the model is internally coherent). Never do neither.

---

## Accessibility in gesture interactions

- Every gesture interaction must have a **non-gesture alternative**: swipe-to-dismiss requires a close button; drag-and-drop requires keyboard reordering; pull-to-refresh requires a refresh button.
- Do not hijack scroll in a way that traps focus or prevents AT navigation.
- Switch control, voice control, and assistive technology users cannot perform gestures. If gesture is the only path to an action, the action is inaccessible.
- `prefers-reduced-motion`: the gesture still works; only the physics flourish (bounce, momentum) is replaced with a fast fade or instant snap.

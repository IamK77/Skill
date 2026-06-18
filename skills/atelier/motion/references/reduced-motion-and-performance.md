# Reduced Motion and Performance — the non-negotiables

> These are not taste. A gate fails if any of them is missing. `prefers-reduced-motion` is a medical accommodation — vestibular disorders, epilepsy, migraines. 60fps is a contract between the surface and the human nervous system (16ms fusion threshold). Compositor-only properties and latency masking are the technique behind that contract.

---

## `prefers-reduced-motion` — re-tune, do not strip

The media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* re-tuned alternatives here */
}
```

Or the JavaScript equivalent for library-driven animations:
```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

**What to replace:** the vestibular triggers — large translation, scale over significant distances, parallax (background and foreground moving at different rates), rotation, complex 3D transforms. These cause disorientation or physical nausea in users with vestibular disorders.

**What to replace them with:**
- **Cross-fade / opacity transition** — conveys state change without spatial displacement.
- **Instant cut** — for transitions where even a fade is distracting.
- **Short, low-distance motion** — a 2–4px nudge is generally safe; a 40% screen-width translation is not.

**What NOT to do:** strip all animation and leave the user with no state feedback. If a modal opens with no indication, or a notification appears invisibly, the user doesn't know what happened. The reduced path must still communicate; it just does so without vestibular triggers.

**For gesture interactions:** the gesture still works — the user can still swipe to dismiss. Only the physics flourish is replaced: momentum and bounce become a fast fade or instant snap-to-position.

**Flicker constraint (WCAG 2.3.1):** any area of the screen must not flash more than **3 times per second**. Above this threshold, the flicker can trigger photosensitive epileptic seizures. This applies to animation, to loading states, to notification badges, to anything that can rapidly alternate.

**Non-animated fallback for critical information:** if a status indicator, progress state, or important feedback relies *only* on animation to convey meaning (e.g., "the spinner means loading"), it must have a text or ARIA alternative. A user who can't see animations — and a user who has `prefers-reduced-motion` set — must still be able to obtain the information.

---

## Non-gesture alternatives — always

Every gesture interaction must have a non-gesture path to the same action:

| gesture | required alternative |
|---|---|
| Swipe to dismiss a panel | Close button (visible or accessible) |
| Drag to reorder | Keyboard reorder (Arrow key + modifier, or explicit controls) |
| Pull to refresh | Refresh button |
| Swipe to delete a row | Delete button, or right-click/long-press menu |
| Pinch to zoom | Zoom in/out controls |

Users with motor impairments, switch-control users, and voice-control users cannot perform gestures. Gesture as the sole path to an action is an accessibility failure under WCAG 2.5.1 (Pointer Gestures).

**Focus management:** when a gesture opens a panel, modal, or drawer, focus must move into the opened element. When it closes, focus must return to the triggering element. This applies to all motion-triggered state changes.

---

## Compositor-only properties — `transform` and `opacity`

Covered in detail in `the-feel-css-deep-water.md`. The summary for motion implementation:

**Animate only:**
- `transform` (translate, scale, rotate, skew) — compositor thread, no layout cost
- `opacity` — compositor thread, no layout cost
- `filter` — use with care; paint-heavy, especially `backdrop-filter`

**Never animate:**
- `width`, `height` — triggers layout
- `top`, `right`, `bottom`, `left` — triggers layout (for positioned elements)
- `margin`, `padding` — triggers layout
- `border-width` — triggers layout
- `font-size`, `line-height` — triggers layout

To animate a layout change (an element changing size, a list reordering), use **FLIP or the View Transitions API** — both use `transform` under the hood.

**Color animation:** interpolate in `oklch` or `oklab`, not `rgb`/`hsl`. The sRGB color space has a "gray dead-zone" through which interpolation passes when crossing hue-opposite colors. `oklch`/`oklab` interpolation stays perceptually even and avoids the desaturated midpoint.

```css
@property --accent-h {
  syntax: '<number>';
  inherits: false;
  initial-value: 250;
}
/* Now --accent-h can be animated with proper interpolation */
```

Use `@property` for typed custom property animation — untyped custom properties are not interpolated (they switch instantly).

---

## The 60fps contract

60fps = **16.7ms per frame** for all rendering work. 120fps = **8.3ms per frame** (high-refresh displays). Any work that takes longer than the frame budget drops a frame.

**Main thread vs compositor thread:**
- JS execution, layout, and paint happen on the main thread.
- Compositor-only animations (`transform`/`opacity`) run on a separate compositor thread — immune to main-thread JS blocking.
- If main thread work blocks for 50ms, compositor-thread animations continue smoothly. If animation triggers layout or paint, it moves onto the main thread and is blocked.

**First-frame feedback < 100ms:**
The user perceives their action as "instant" when the first visual response arrives within 100ms. After 100ms the cause-and-effect link begins to break. After 1000ms it is fully broken — the user is no longer connecting their action to the result.
- Even if the full animation is 300ms, something must change within the first 100ms.
- For slow operations (network requests, heavy computation): show an optimistic response or skeleton immediately, then update when the real response arrives. Do not make the user wait for the API before any feedback.

**Quantified performance checklist:**
- [ ] Only `transform` and `opacity` are animated (plus justified `filter` uses)
- [ ] No dropped frames visible in DevTools Rendering panel → FPS meter during interaction
- [ ] Single-interaction main-thread work < ~50ms (Performance panel flamechart)
- [ ] No layout thrashing in animation loops (alternating `.offsetWidth` reads and style writes)
- [ ] `will-change` is set transiently, removed after animation
- [ ] JS-driven animations do not block the main thread during scroll or first-paint

**Layout thrashing:** the worst self-inflicted performance bug in animation code. Reading layout properties (`offsetWidth`, `getBoundingClientRect()`, `scrollTop`) forces the browser to complete any pending layout before returning the value. If you do this inside a `requestAnimationFrame` loop *after* writing styles, the browser does layout twice per frame.

Pattern that causes it:
```js
// BAD — alternating read/write forces synchronous layout each iteration
elements.forEach(el => {
  const width = el.offsetWidth;  // forces layout
  el.style.width = width * 2 + 'px';  // schedules layout
});
```

Pattern that fixes it:
```js
// GOOD — batch all reads, then all writes
const widths = elements.map(el => el.offsetWidth);  // one layout
elements.forEach((el, i) => el.style.width = widths[i] * 2 + 'px');  // schedule once
```

---

## Masking latency — the causal story

The most important animation in a production application is often not decorative — it is the one that bridges the gap between a user action and a slow server response.

The rule: the user's action must **visibly and immediately cause a result**. When the real result takes 500ms, the brain's causal attribution window has already closed. Show the optimistic or skeleton state within the first 100ms.

**Patterns:**
- **Optimistic update:** immediately show the result as-if-successful (button turns "liked," item moves to cart) and correct if the server returns an error. Most operations succeed; optimistic UI is almost always right.
- **Skeleton state:** show the structure of the incoming content (gray placeholder blocks in the right shape) immediately. The user's mental model is primed; when the real content arrives, it slots in cleanly.
- **Progress indication:** for known-duration operations, show a determinate progress bar. For unknown-duration, an indeterminate spinner — but only if the wait is expected to exceed ~1s.

**`transform-origin` is the mechanical implementation of causality:**
When an element grows from a trigger (a modal opening from a button), the visual origin of the animation should be the trigger — not the center of the element. Set `transform-origin` to the button's position relative to the modal, not the default center.

A tooltip that scales from `transform-origin: top left` of the tooltip (instead of the anchor that triggered it) breaks the causal story. The user points at one place; the result appears to come from somewhere else.

---

## Implementation selection — the decision tree

```
simple · discrete · declarative · compositor-friendly
        └─ CSS transition / @keyframes animation

needs JS control · interruptible · dynamic target · velocity carry
        └─ Web Animations API (element.animate)

DOM state change · route transition · shared element morph
        └─ View Transitions API (over hand-rolled FLIP)

scroll-linked progress
        └─ CSS scroll-driven (animation-timeline: scroll()/view())

gesture · spring physics · velocity inheritance · mid-flight interrupt
        └─ spring library (Motion / Framer Motion / react-spring)
```

Use the simplest option that satisfies the constraints. CSS transitions for 90% of UI; springs only for what fingers touch.

**A complex interaction is a state machine.** Model `idle → dragging → settling → snapped` explicitly; define legal transitions; define what each transition means for position, velocity, and spring state. Implicit flags and boolean combinations collapse into impossible states — an explicit state machine cannot reach them.

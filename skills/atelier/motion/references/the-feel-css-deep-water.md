# The Feel / CSS Deep Water — rendering pipeline, compositor traps, FLIP, and modern CSS

> The CSS and rendering mechanics that separate "knows how to animate" from "knows why it works." Not a CSS tutorial — the things that determine whether you can reason about what's happening rather than guessing. The agent knows the happy path; this doc is everything just below the surface that makes the happy path break, and the platform primitives that replace JS hacks.

---

## The rendering pipeline — where cost lives

The browser pipeline, in order: **Parse → Style → Layout → Paint → Composite**

Animating a property that triggers Layout causes *all downstream steps* to rerun — including recalculating sizes, repainting, and recompositing. Animating a property that only triggers Composite skips everything above it and runs entirely on the compositor thread (separate from the main JS thread).

| property change | triggers | cost |
|---|---|---|
| `width`, `height`, `top`, `left`, `margin`, `padding` | Layout + Paint + Composite | expensive — avoid animating |
| `background-color`, `box-shadow`, `color` | Paint + Composite | moderate — avoid in tight loops |
| `transform`, `opacity` | Composite only | cheap — the goal |
| `filter` | Paint + Composite | moderate — use carefully, check frame rate |

**The rule: only animate `transform` and `opacity`.** Everything else in an animation path is a layout or paint trigger. `filter` is permitted for specific visual effects (blur, brightness) but must be profiled — `backdrop-filter` in particular is paint-heavy and can drop frames on complex backgrounds.

---

## `will-change` — temporary hints only

`will-change: transform` tells the compositor to promote the element to its own layer *before* the animation starts, eliminating the first-frame promotion cost.

**Rules:**
1. Set it just before the animation begins (in a hover or a JS handler, not in base CSS).
2. Remove it after the animation ends.
3. Never leave it permanently in static CSS — each promoted layer occupies GPU memory; too many promotions can exhaust GPU memory and slow compositing of the page.
4. It is a hint, not a command — the browser may ignore it.

If you find yourself wanting `will-change` as a permanent fix for jank, the real problem is animating a non-compositor property — fix that instead.

---

## FLIP — animating layout changes without paying layout cost

Layout changes (an element changing size, position, or flow position) are expensive to animate directly. FLIP is the technique for making them feel smooth using only `transform`:

1. **First** — measure the element's starting bounding rect (`getBoundingClientRect()`).
2. **Last** — apply the new state (DOM change, class change, etc.) and measure the ending bounding rect.
3. **Invert** — apply a `transform` that moves the element back to where it *looked* before: `translateX(first.x - last.x) translateY(first.y - last.y) scaleX(first.w / last.w) scaleY(first.h / last.h)`.
4. **Play** — animate the `transform` to `none` (or `translate(0) scale(1)`). The element appears to move smoothly from its old position to the new one.

The element is in its *final* DOM position the whole time; only the visual presentation is animated — using `transform` which stays on the compositor.

**View Transitions API — prefer over hand-rolled FLIP:**
`document.startViewTransition(() => { /* mutate DOM */ })` + `view-transition-name: someIdentifier` on the elements to morph. The browser automatically captures before/after screenshots, pairs named elements as shared-element morphs, and animates the transition. Works for:
- SPA state changes (any JS-driven DOM mutation inside the callback)
- MPA cross-document navigation (opt-in via CSS `@view-transition { navigation: auto; }`)

The CSS defaults (cross-fade for unmatched, FLIP-style transform for matched) can be overridden with `::view-transition-old` and `::view-transition-new` pseudo-elements.

Use View Transitions over hand-written FLIP unless you need behaviors the API can't express.

---

## CSS scroll-driven animations

`animation-timeline: scroll()` — links animation progress to scroll position within a scroll container.
`animation-timeline: view()` — links animation progress to an element's visibility within the viewport.

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reveal-on-scroll {
  animation: reveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

- Runs on the compositor thread when only `transform`/`opacity` are animated.
- Replaces JS + IntersectionObserver scroll-reveal patterns with zero JS.
- `animation-range` controls the entry/exit window within the `view()` timeline.

Browser support: widely available in modern browsers; check before using in production without a fallback.

---

## Spring numerical integration — why semi-implicit Euler

The analytic (closed-form) solution to the spring equation — `x(t)` given initial position and velocity — is computationally cheap but has a critical problem: **if the target changes mid-flight, the equation must be solved from scratch with new initial conditions**, which can cause a jump. That's why springs that need to be interruptible (gesture carry, re-triggered animations) use **per-frame numerical integration** instead.

**Semi-implicit (symplectic) Euler:**
```
v_new = v + (F/m) * dt   // update velocity first, using the force from current position
x_new = x + v_new * dt   // then update position using the NEW velocity
```

The semi-implicit form is stable at high stiffness; the explicit form (`x_new = x + v * dt` then `v_new = v + ...`) diverges. Most spring libraries (Framer Motion, react-spring, Motion) use this internally.

**Fixed step / sub-stepping at low frame rates:** if dt is large (the frame took longer than expected — a dropped frame), the spring equation can overshoot. Run the integration in fixed-size sub-steps rather than one large step.

**Rest threshold:** `|displacement| < restDistance` (~0.5px) AND `|velocity| < restVelocity` → snap to target and cancel the rAF loop. Without this, a spring technically never reaches its target (asymptotic convergence) and runs forever.

Settle time estimate: `t_settle ≈ 4 / (ζ · ω₀)` (~2% of target, four time constants).

---

## Cascade, specificity, and `@layer`

The CSS cascade resolves which declaration wins in this order: origin and importance → layers → specificity → source order.

**`@layer` (cascade layers):** explicitly declares a priority ordering for groups of styles:
```css
@layer reset, base, components, utilities;
```
Layers declared later win over layers declared earlier, regardless of specificity within each layer. This lets a utility class with low specificity (e.g., `:where(.mt-4)`) override a component style without needing `!important` — just ensure utilities are in a later layer. Ends specificity wars. Not the default — opt in deliberately.

**`:where()` (zero specificity):** `a:where(.nav-link)` has the specificity of `a` (one element = 0,0,1), not of `a.nav-link` (0,1,1). Use it to write low-specificity base styles that are easily overridden.

**`:is()` (specificity matching the highest-weight selector inside):** `a:is(.nav-link, .footer-link)` has the specificity of `.nav-link`. Use for grouping selectors without specificity escalation.

**`!important`** is a code smell in a design system — it means the cascade wasn't designed, it was overridden. One legitimate use: accessibility overrides (e.g., `prefers-reduced-motion` rules that must win regardless of other animation declarations).

---

## CSS layout deep water — the traps

**Containing block for `fixed` positioning:**
`position: fixed` is normally positioned relative to the viewport. But any ancestor with `transform`, `filter`, `will-change: transform`, `contain: paint`, or `perspective` creates a new containing block — and the `fixed` element is positioned relative to that ancestor, not the viewport. This is the classic "why won't my modal/tooltip position correctly."

Symptoms: a `position: fixed` overlay that scrolls with the page, or a tooltip pinned to a transformed container. Diagnosis: check ancestors in DevTools Computed for any of the listed properties.

**Stacking contexts and `z-index`:**
A new stacking context is created by: `position` + `z-index` (non-auto) · `opacity < 1` · `transform` · `filter` · `will-change` · `isolation: isolate` · `mix-blend-mode` (non-normal) · `clip-path` · `mask`.

`z-index` only compares elements within the same stacking context. "My z-index doesn't work" almost always means one element is in a different stacking context than the other. Diagnosis: use DevTools Layers panel or `isolation: isolate` to explicitly create a new context on the intended container.

**`sticky` positioning:**
Requires: a scrollable ancestor container; a threshold set (top/bottom/left/right); and no ancestor with `overflow: hidden` (which creates a scroll container and confines the sticky element to it, making it stop sticking). The most common break: `overflow: hidden` on a layout wrapper that was added to "fix" something else.

**`overflow: hidden` creates a scroll container.** Any `position: sticky` descendant is now sticky relative to that container's scroll, not the page scroll. This is a frequent silent break.

**`transform` and `fixed` — the double trap.** Applying `will-change: transform` (added before a hover animation) to a parent also traps its `fixed`-positioned children. Set `will-change` as close to the animated element as possible, never on a layout wrapper.

**Flex / grid `min-width: auto` overflow:**
Flex and grid children have `min-width: auto` by default, which means they resist shrinking below their content size. A flex child with long text or a wide image overflows the container. Fix: `min-width: 0` on the flex child (or `minmax(0, 1fr)` for grid tracks).

**Mobile `100vh` jump:**
`100vh` on mobile includes the browser chrome (address bar). When the user scrolls and the browser chrome retracts, `100vh` changes and the layout jumps. Use:
- `dvh` (dynamic viewport height) — updates as chrome shows/hides
- `svh` (small viewport height) — always includes chrome, no jump, but shorter
- `lvh` (large viewport height) — chrome always retracted

**Touch `:hover` sticking:**
`:hover` on touchscreen devices fires on tap and stays until the next tap elsewhere. Use `@media (hover: hover)` to constrain hover styles to devices with a real hover capability.

---

## Modern CSS that replaces JS hacks (agent's blind spot)

These exist, they're widely supported, and the agent almost never reaches for them:

- **`:has()` (parent selector)** — style a parent based on its children or siblings. Form validation styles, "card has an image," count-based layouts without JS.
- **`@container` (container queries)** — a component responds to its *container* size, not the viewport. Eliminates breakpoint-at-viewport hacks for reused components.
- **`animation-timeline: scroll()/view()` (scroll-driven)** — covered above. Replaces JS scroll listeners.
- **`anchor()` / `anchor-size()` (anchor positioning)** — tooltip and popover tethering to an element without JS positioning logic. Emerging; check support.
- **`popover` attribute + `::backdrop`** — native popover behavior (top-layer promotion, light-dismiss, focus management) without a positioning library.
- **`@property`** — typed custom properties that can be animated and interpolated. A number custom property transitions; a plain string property does not.
- **`field-sizing: content`** — a `textarea` grows with its content. Eliminates JS auto-resize handlers.
- **`light-dark()` / `color-scheme`** — declare light/dark token values inline; `color-scheme: light dark` makes native controls (inputs, scrollbars) render in the right theme.
- **`:focus-visible`** — focus ring shows only on keyboard navigation, not on click. Use instead of `outline: none` blanket suppression.
- **CSS nesting (`&`)** — available natively; eliminates preprocessor dependency for structural nesting.
- **`dvh/svh/lvh`** — viewport units that handle mobile chrome correctly (above).

---

## DevTools — systematic diagnosis not guessing

**Elements → Styles:** trace why a rule wins — which declaration is active, what is crossed out, what is inherited. Specificity battles are visible here. Toggle `:hover/:focus/:active/:visited` to inspect interactive states without a mouse.

**Elements → Computed:** the final resolved value for every CSS property. When "I set `width: 100%` but it ignores it," Computed shows the actual resolved width and the rule that set it.

**Performance panel → record → fire the animation:**
- Flame chart: long tasks (red corners), main thread work, layout/style/paint/composite events
- Look for: layout thrashing in an animation loop (alternating read/write forces synchronous layout), paint events inside an animation, large tasks blocking the main thread during a gesture

**Rendering panel (hamburger menu in DevTools):**
- **Paint flashing** — highlights regions that are repainting on each frame. Areas that flash continuously during an animation are painting, not compositing. Should be dark.
- **Layer borders** — shows promoted compositor layers as orange borders. Too many layers = GPU memory pressure.
- **FPS meter** — real-time frames per second during interaction.
- **Scrolling performance issues** — flags elements with non-passive scroll listeners.

**Systematic debug flow:**
1. Reproduce the issue.
2. Computed tab — verify the property is actually set to what you expect.
3. Styles tab — trace which rule wins (cascade, specificity, source order).
4. If positioning is wrong: check containing block (look for `transform`/`filter` on ancestors), check stacking context (`z-index` in wrong context).
5. If performance issue: Performance panel flamechart, Rendering paint-flash.
6. Binary split: comment out half the CSS and see if the issue persists. Never guess randomly.

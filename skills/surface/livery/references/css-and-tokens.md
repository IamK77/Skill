# CSS & Tokens — Custom Properties, the Cascade, and Modern CSS

## Custom Properties: The Token Mechanism

CSS custom properties (`--name: value`) are how design tokens actually live in the browser. They differ from preprocessor variables in three critical ways: they resolve at **computed value time** (not parse time), they cascade and inherit like any other property, and they can be mutated at runtime by JS, media queries, container queries, and `:hover`.

**Default inheritance is the foundation of theming.** Set tokens on `:root` and every element in the document sees them. Override on a subtree (`.dark-section { --color-bg: #111; }`) and only that branch re-themes — no class juggling, no re-rendering.

**Fallback chain for component APIs:**

```css
.button {
  background: var(--button-bg, var(--color-primary, #0066cc));
}
```

The outer consumer overrides `--button-bg`; if they don't, the middle semantic token wins; the hard-coded value is the last resort. This is the **CSS variable as public API** pattern — document the `--` hooks, not the internals.

**Runtime update:** `el.style.setProperty('--accent', newColor)` cascades instantly to every rule that reads `--accent`. One write, full-tree update.

**`calc()` composition:** `calc(var(--space-base) * 2)`, `clamp(var(--min), var(--fluid), var(--max))`. Unitless variables combine with units only inside `calc`: `calc(var(--n) * 1px)` — never concatenate units directly.

---

## @property: Typed Custom Properties

`@property` upgrades an untyped token stream into a first-class CSS value:

```css
@property --hue {
  syntax: '<angle>';
  inherits: false;
  initial-value: 220deg;
}
```

**Three capabilities:**

1. **Type validation** — invalid assignments fall back to `initial-value` instead of silently poisoning the property.
2. **Animation and transition** — typed custom properties (`<number>`, `<color>`, `<angle>`, `<length>`, `<percentage>`) interpolate correctly. **Untyped custom properties never interpolate — they snap.** To animate a gradient angle, a conic slice, or any computed custom value, `@property` registration is mandatory.
3. **Inheritance control** — `inherits: false` makes the property local to the element; each instance gets its own value rather than inheriting from an ancestor.

`@property` also doubles as machine-readable API documentation: a typed `--button-bg` communicates intent better than a comment.

---

## IACVT: The Invisible Footgun

**IACVT = Invalid At Computed Value Time.** When `var(--x)` resolves to a value that is invalid for the target property, CSS does **not** ignore the declaration — it sets the property to its **inherited or initial value**. This can cascade unexpectedly and is very hard to debug.

Key distinctions:
- `var(--x, fallback)` uses the fallback only when `--x` is **unset**. If `--x` is set to an invalid value, the fallback is ignored — IACVT fires instead.
- With `@property` registration, invalid values fall back to `initial-value`, not the inherited/initial value of the target property — safer and predictable.
- `var()` cannot appear in `@media` conditions or selector arguments — custom properties only work inside property values.

Other gotchas: names are case-sensitive (`--Foo ≠ --foo`); circular references (`--x: var(--x)`) are invalid; performance is fine for typical use, but animating many unregistered variables with JS on every frame can be costly.

---

## Style Queries and Conditional Token Branches

```css
@container style(--variant: compact) {
  .card { padding: var(--space-xs); }
}
```

Style queries (`@container style(--prop: value)`) branch on the **value** of a custom property, not a size — the clean replacement for the `space-toggle` hack (setting `--toggle: ` vs `--toggle: initial` as a CSS boolean). The incoming `if()` function will further consolidate this pattern; verify support before use.

---

## The Cascade: Full Priority Order

Cascade resolves conflicts in this order — **specificity is step 3, not step 1**:

1. **Origin & importance** (highest to lowest):
   - Active transitions
   - `!important` user-agent
   - `!important` user
   - `!important` author
   - Active animations
   - Normal author
   - Normal user
   - Normal user-agent
2. **Cascade layers** (`@layer`)
3. **Specificity** `(a, b, c)` — ID / class+attr+pseudoclass / type+pseudoelement
4. **Source order** (last wins)

`!important` inverts the author/user/UA order within the important tier. Transitions beat everything — that is why an in-progress transition value always "wins."

---

## Cascade Layers: @layer

`@layer` is the correct tool for managing cascade priority at scale:

```css
@layer reset, base, tokens, components, utilities;
```

**Order declared = priority order**: later layers win over earlier ones, regardless of specificity. A low-specificity utility rule in `utilities` beats a high-specificity rule in `components`.

**Unlayered normal declarations beat all layered normal declarations.** Wrap third-party CSS in a named layer so your own (unlayered or later-layered) rules always win without specificity hacks.

**`!important` reversal inside layers:** within the important tier, earlier layers win (opposite of normal). Unlayered important declarations are the lowest priority — the `reset` layer's `!important` rules can deliberately win over later layers' important declarations.

Nested layers: `@layer components.card { … }`. Anonymous layers `@layer { … }`. Import into layer: `@import url(…) layer(name)`.

**Bottom line:** `@layer` eliminates most `!important` needs. Use it.

---

## Specificity Calculation

Specificity is a three-slot tuple `(a, b, c)` — compared lexicographically, **not** as a base-10 number. One ID (`a=1`) beats any number of classes.

| Selector feature | Slot |
|---|---|
| ID `#x` | a |
| Class `.x`, attribute `[x]`, pseudoclass `:x` | b |
| Type `div`, pseudoelement `::x` | c |
| `*`, combinators (`>`, `+`, `~`, ` `) | 0 |
| Inline `style=""` | above all selectors |
| `!important` | not specificity — origin tier |

**Pseudoclass traps:**
- `:where(a, b)` — always **zero specificity**; ideal for resets and libraries.
- `:is(a, b)`, `:not(a, b)`, `:has(a, b)` — take the **specificity of the most specific argument**. `:is(#id, .c)` carries ID specificity — easy source of leaks.
- `:not()` over-match trap: `:not(.foo)` matches `html` and `body` too. Always scope it: `.parent :not(.foo)` or combine with a type selector.
- `:nth-child(n of S)` — adds the specificity of S.
- Nesting `&` is resolved as `:is(parent)`, so the parent's specificity is inherited — over-nesting inflates specificity silently.

---

## Inheritance Keywords

Five keywords operate on the cascade:

- `inherit` — force inheritance on any property.
- `initial` — the spec's initial value (surprises: `display: initial` = `inline`; `color: initial` = system canvas text).
- `unset` — inherits if inheritable, otherwise `initial`; the smart reset.
- `revert` — rolls back to the previous **origin** (author → user-agent stylesheet).
- `revert-layer` — rolls back to the previous **layer**.

`all: unset` or `all: revert` resets every property at once — useful for isolated components.

Custom properties **inherit by default**; use `@property { inherits: false }` for component-local values.

---

## @scope

```css
@scope (.card) to (.card-content) {
  img { border-radius: var(--radius-sm); }
}
```

`@scope` confines styles to a subtree with an optional lower boundary (donut scope). It introduces **proximity** as a new cascade step — closer ancestor scope wins — reducing reliance on naming conventions and specificity for encapsulation.

---

## The Selector Toolkit

**Grouping and DRY:**
- `:is(h1, h2, h3) a` — equivalent to three selectors, takes the specificity of the most specific argument. Use for DRY.
- `:where(h1, h2, h3) a` — same match, zero specificity. Use in resets and libraries so consumer styles win easily.
- Both use **forgiving selector lists** — one invalid selector is silently dropped; the rule remains valid.

**Relational — `:has()`:** The parent selector, finally. Matches ancestors and preceding siblings:
- `.card:has(img)` — card containing an image.
- `label:has(+ input:focus)` — label preceding a focused input.
- `form:has(input:invalid)` — invalid form state, without a JS class toggle.
- `body:has(dialog[open])` — lock scroll when a dialog is open, zero JS.
- `ul:has(> li:nth-child(6))` — quantity query (≥6 items).
- Chain: `:has(a):has(b)`, `:not(:has(…))`.

**Structural:**
- `:nth-child(an+b of S)` — count only among elements matching S (`:nth-child(2 of .highlighted)`).
- `:first-child` vs `:first-of-type` — `:first-child` requires the element to be both the first child AND match; `:first-of-type` is first among its tag type regardless of position.

**Form validation — use `:user-invalid`, not `:invalid`:** `:invalid` fires immediately on page load (empty required fields show red before the user types). `:user-invalid` only activates after the user has interacted and blurred — always prefer it for validation styles. Same for `:user-valid`.

**Interaction:**
- `:focus-visible` — shows focus ring only for keyboard navigation; suppress mouse-click ring without hiding accessibility indicators.
- `:focus-within` — matches the container when any descendant has focus; style the parent label or fieldset.
- `@media (hover: hover)` — guards `:hover` rules from sticking on touch devices.

**Attribute selectors for ARIA/data state:**
- `[aria-expanded="true"]`, `[data-state="open"]`, `[hidden]` — visual state driven by accessibility attributes; the a11y and visual layers stay in sync automatically.
- Case-insensitive: `[attr=value i]`.

**Pseudo-elements:**
- `::before`/`::after` need `content`; do not work on replaced elements (`img`, `input`); keep decorative.
- `::marker` (list symbol/counter), `::selection` (selected text), `::placeholder` (check contrast), `::backdrop` (dialog/popover overlay), `::file-selector-button`, `::first-letter`/`::first-line`.

---

## Modern CSS Features

**Container queries** — components that respond to their container, not the viewport:

```css
.sidebar { container-type: inline-size; }
@container (min-width: 400px) { .card { grid-template-columns: 1fr 1fr; } }
```

`inline-size` is the standard choice (only the inline axis). `size` requires an explicit container dimension. **`container-type` creates a containing block, a sizing containment context, and a new formatting context** — it traps `position: fixed` and `position: absolute` children (see Containing Block Traps below). Container query units: `cqi`, `cqb`, `cqw`, `cqh`, `cqmin`, `cqmax` — use `font-size: 4cqi` for component-relative fluid type.

**:has() as conditional logic** — see Selector Toolkit. Widely supported; use freely.

**CSS nesting** — `&` refers to the parent selector, resolved as `:is(parent)`. `.foo { &.bar {} }` compiles to `.foo.bar`; `.foo { & .bar {} }` compiles to `.foo .bar`. The `&` is mandatory for compound selectors (no space). Do not nest more than 2–3 levels — specificity inflates silently with each level.

**Subgrid:**

```css
.row { display: grid; grid-template-columns: repeat(3, 1fr); }
.item { grid-column: span 3; display: grid; grid-template-columns: subgrid; }
```

`subgrid` lets a nested grid participate in the parent's track definitions — aligns elements across independently-sized siblings without JS measurement.

**Color functions:**
- `color-mix(in oklch, var(--color-brand) 70%, transparent)` — alpha and tint in one expression.
- Relative color: `oklch(from var(--color-base) calc(l * 1.15) c h)` — derive a lighter tint from any token without separate variables.
- `light-dark(lightValue, darkValue)` — automatic light/dark switch respecting `color-scheme`.
- `oklch` is the recommended color space for perceptually uniform tokens; equal chroma/lightness steps look equal to the eye across hues.

**Viewport units:**
- `dvh` — dynamic viewport height (shrinks/grows with mobile browser chrome). Use for full-bleed sections.
- `svh` — small viewport (browser chrome fully shown). Use for min-height guarantees.
- `lvh` — large viewport (browser chrome hidden). Use for maximum available space.
- **Never use `100vh` for mobile full-screen layouts** — the address bar causes visible jumps.

**Anchor positioning:**

```css
.trigger { anchor-name: --tip; }
.tooltip { position: absolute; position-anchor: --tip; top: anchor(bottom); }
```

Replaces Popper/Floating UI for tooltip/popover tethering. `position-try-fallbacks: flip-block, flip-inline` auto-repositions when the element would overflow — native Floating UI. Emerging — keep JS fallback for now.

**Popover API + `<dialog>`:**
- `popover` attribute + `popovertarget` — native show/hide, top-layer rendering, light-dismiss, `::backdrop`, built-in focus management.
- `<dialog>` + `showModal()` — modal + focus trap + ESC + `::backdrop` + background `inert`. No library needed.
- Top-layer elements escape `z-index` and `overflow` entirely — the answer to "how do I make this appear above everything."

**Scroll-driven animations:**

```css
.progress { animation: grow linear; animation-timeline: scroll(); }
.card { animation: reveal linear; animation-timeline: view(); animation-range: entry 0% entry 100%; }
```

Runs on the compositor — zero main-thread cost. `scroll()` binds to scroll position; `view()` binds to element visibility in the viewport. Replaces scroll-listener + rAF patterns. Respect `prefers-reduced-motion`.

**View Transitions:**

```css
.hero { view-transition-name: hero-image; }
```

`document.startViewTransition(() => domMutation())` — cross-fade between DOM states by default; named `view-transition-name` elements morph between matched old and new positions. MPA: `@view-transition { navigation: auto; }`. Widely supported for same-document; cross-document is emerging.

**Other notable features:**
- `field-sizing: content` — `<textarea>` auto-grows with content, no JS (Chromium-first, emerging).
- `interpolate-size: allow-keywords` / `calc-size()` — enables transitions to/from `height: auto` (emerging).
- `<details name="group">` — mutual-exclusion accordion natively.
- `scroll-snap-type` / `scroll-snap-align` — CSS-only carousel/gallery snapping.
- `overscroll-behavior: contain` — prevent scroll chaining from inner containers to the page.

---

## Containing Block Traps and Stacking Contexts

**Containing block for `position: fixed`** is normally the viewport. It is **hijacked** by any ancestor with `transform`, `filter`, `will-change: transform`, `contain: layout|paint|strict`, or `container-type`. The fixed element stops scrolling with the page and is clipped to the ancestor instead. This is the most common "why won't my fixed header work" bug.

**Containing block for `position: absolute`** is the nearest ancestor with `position` other than `static`. Adding `position: relative` to a container is the fix — but also `transform`, `filter`, `will-change`, `contain`, and `container-type` all create containing blocks, so they can unexpectedly capture absolute children too.

**Stacking context creation** — `z-index` only orders elements within the same stacking context. A `z-index: 9999` child of a stacking context with `z-index: 1` can never appear above a sibling of its parent with `z-index: 2`. Contexts are created by:
- `position` (not `static`) + any `z-index` other than `auto`
- `opacity < 1`
- `transform` (any value other than `none`)
- `filter`, `backdrop-filter`
- `will-change` (any compositing property)
- `isolation: isolate` — **the clean way to create a deliberate context without visual side effects**
- `mix-blend-mode` (other than `normal`)
- `contain: layout|paint|strict`
- `container-type`

Debug `z-index` failures by asking "which stacking context does this element belong to?" in DevTools Layers panel.

**`position: sticky` requirements:** the element needs a scrollable ancestor, a threshold value (`top`, `bottom`, etc.), and that ancestor must not have `overflow: hidden` (which creates a scroll container that clips the sticky element to its own box, preventing it from sticking to the viewport).

---

## Layout Thrashing and Rendering Performance

**Layout thrashing** — reading a layout property (`offsetWidth`, `offsetHeight`, `getBoundingClientRect`, `clientHeight`, `scrollTop`, `getComputedStyle` on layout-dependent values) after writing a style forces the browser to synchronously flush pending layout before returning the value. In a loop this fires layout on every iteration.

Fix: batch all reads first, then all writes. Use `requestAnimationFrame` to defer writes to the start of the next frame.

**Expensive operations:** `box-shadow` with high blur, `filter: blur`, `backdrop-filter`, large gradients, `background-attachment: fixed` (repaints on every scroll frame). Minimize their repaint regions.

**`contain` and off-screen skipping:**
- `contain: layout` — internal reflows do not propagate outward.
- `contain: paint` — children do not paint outside the element; off-screen elements may skip paint.
- `content-visibility: auto` — fully skips layout and paint for off-screen elements. Pair with `contain-intrinsic-size` to reserve space and avoid scroll-position jumps.

**Subpixel text blur:** `transform: translateX(0.5px)` or any odd fractional translation applied to an ancestor can cause text in descendants to render blurry (subpixel rasterization). Keep translated values on whole pixels, or use `will-change: transform` + integer offsets.

**Margin collapse:** adjacent and parent-child vertical margins collapse to the larger value. Block Formatting Contexts prevent it: adding `padding`, `border`, `overflow` (non-visible), `display: flex/grid`, or `contain: layout` to the parent breaks collapse.

**Flex/Grid overflow:** flex and grid items have `min-width: auto` by default. Content wider than the track will overflow rather than shrink. Fix: `min-width: 0` on the item, or `minmax(0, 1fr)` in the grid template.

---

## DevTools Debugging Workflow

- **Styles panel** — lists every matching rule in cascade order; losing declarations are struck through. Tracks which layer and which specificity won.
- **Computed panel** — shows the final resolved value and which rule produced it.
- **Elements → toggle `:hover`/`:focus`/`:active`** — inspect state-dependent styles without holding the device.
- **Rendering panel → Paint Flashing** — highlights what repaints each frame; `backdrop-filter` and `filter: blur` show up immediately.
- **Layers panel** — shows compositor layer tree; diagnose stacking context and z-index problems; spot layer explosion.
- **Performance panel** — flame chart for long tasks, forced synchronous layout markers, frame timeline.

Systematic cascade debug: open Styles → find the target property → read rules from top (highest priority) down → identify the winner and the loser → check origin, layer, specificity, source order in that sequence. Never trial-and-error `!important`.

# CSS Layout & Space — Box Model, Positioning, Flex/Grid, and Spacing Systems

## Box Model Fundamentals

Every element generates four nested boxes: content → padding → border → margin. **Always baseline `*, *::before, *::after { box-sizing: border-box }`** — then `width` includes padding and border, making arithmetic predictable. With `content-box` (default), padding and border add on top of the declared width, causing constant math corrections.

**Margin does not contribute to the element's box size** — it is external spacing only, and it collapses. **Percentage padding and margin — including vertical padding/margin — are computed against the containing block's _width_, not height.** This is a persistent source of confusion; it also powered the old `padding-top: 56.25%` aspect-ratio hack before `aspect-ratio` existed.

Logical equivalents replace physical names for direction-agnostic layout: `inline-size` / `block-size` instead of `width` / `height`; `margin-inline` / `padding-block` instead of left/right and top/bottom. These mirror the writing axis, which is horizontal in default Latin layout but may rotate with `writing-mode`.

Replaced elements (`img`, `video`, `input`) carry intrinsic dimensions — sizing rules differ from non-replaced elements.

---

## Formatting Contexts

A formatting context is a self-contained layout environment with its own rules. The main ones: **BFC** (block), **IFC** (inline), **flex**, **grid**, **table**. A box's behavior is determined by which context it _participates in_ — many "mysterious" behaviors are simply BFC rules misread as bugs.

**Creating a BFC** — non-obvious triggers:
- `float: left/right`; `position: absolute/fixed`; `display: inline-block`, `table-cell`, `table-caption`
- `overflow: hidden/auto/scroll/clip` (the old hack)
- **`display: flow-root`** — the modern, side-effect-free way to establish a BFC, purpose-built for it
- `contain: layout/paint/content`; multi-column containers; flex/grid items

**What a BFC does — why you create one:**
1. **Contains floats** — a BFC expands to enclose floated children, eliminating the classic zero-height collapse. Replaces clearfix.
2. **Stops margin collapse** — margins on opposite sides of a BFC boundary do not collapse. Wrap a parent with `display: flow-root` to prevent child margin from escaping.
3. **Refuses to overlap floats** — a BFC box sits beside a float rather than flowing under it (the media-object pattern: float the image, give the text block `flow-root`, it occupies the adjacent column).

`display: flow-root` on a container delivers all three for free.

---

## Margin Collapse

Margin collapse is a BFC/block-axis behavior. Three adjacent-margin cases collapse into one (largest wins; opposite signs sum; two negatives take the more negative):

1. **Adjacent siblings** — bottom of one + top of next.
2. **Parent and first/last child** — parent `margin-top` + child `margin-top` collapse if no intervening border, padding, or BFC. **The child's margin "escapes" the parent** — the most surprising case.
3. **Empty blocks** — a block with no border/padding/content collapses its own top and bottom margins.

Collapse only occurs on the block axis, within the same BFC, with nothing in between.

**Stopping collapse:** add a `border` or `padding` to the parent; wrap the parent with `display: flow-root` / `overflow: hidden`; or switch to flex/grid — **flex/grid items never collapse margins**. This is why "switching to flex fixes the spacing" — flex formatting context prevents it mechanically.

Modern preferred approach: use `gap` instead of margin for stacked items. `gap` in flex/grid is non-collapsing and has no edge-child exceptions.

---

## IFC and the Image Gap

Inline boxes are placed into line boxes. `vertical-align` controls baseline-relative alignment within the line. **The gap beneath inline images is an IFC artifact**: an inline `<img>` sits on the text baseline, and the descender space below the baseline is reserved even if no text follows. Fix with `display: block` on the image, or `vertical-align: middle/bottom`. `inline-block` elements generate a visible white-space gap between them from the literal whitespace in HTML — remove via parent `font-size: 0`, comment tricks, or switching to flex.

---

## Positioning and Containing Blocks

Five position values:
- **`static`** — normal flow; `top/left/z-index` have no effect.
- **`relative`** — stays in flow (preserves its ghost space), offsets from its own original position. Creates a containing block for absolute descendants. `z-index ≠ auto` establishes a stacking context.
- **`absolute`** — removed from flow (no ghost space). Positioned against the **nearest positioned ancestor's padding-box**; if none exists, against the initial containing block (≈ viewport).
- **`fixed`** — removed from flow. Positioned against the **viewport** — _unless_ an ancestor establishes a containing block, in which case it's trapped. Triggers: `transform ≠ none` (including `translateZ(0)`), `filter`, `backdrop-filter`, `perspective`, `will-change: transform/filter`, `contain: layout/paint/content/strict`, **`container-type ≠ normal`** (container queries). The `container-type` trap is new and frequently overlooked.
- **`sticky`** — behaves as `relative` until a threshold is crossed, then sticks within its scrolling ancestor. Requires: a threshold value (`top: 0`), a scrollable ancestor, and a parent tall enough to provide scroll room. **Sticky fails when:** an ancestor has `overflow: hidden/auto/scroll` (creates a scroll container that clips it), or the parent is too short. Multiple stickies can stack (layered table headers).

`inset: 0` on an absolute/fixed child fills its containing block. Setting two opposing insets without explicit size stretches the element to fill that axis.

---

## Stacking Contexts and z-index

A stacking context is a local z-ordering environment. **z-index only sorts elements within the same stacking context — elements cannot interleave across context boundaries.** The entire context participates as a single unit in its parent's ordering.

**Stacking context triggers** — beyond the obvious:
- `position: relative/absolute` + `z-index ≠ auto`; `position: fixed/sticky` (always)
- `opacity < 1`; `transform`; `filter`; `backdrop-filter`; `clip-path`; `mask`; `perspective`
- `mix-blend-mode ≠ normal`; **`isolation: isolate`**; `will-change` (any of the above)
- Flex/grid items with `z-index ≠ auto`; `contain`; `container-type ≠ normal`

**Stacking order within one context**, back to front: root background/border → negative z-index contexts → non-positioned block boxes → floats → inline boxes → positioned elements (z-index auto/0) → positive z-index. **Positioned elements (even `z-index: auto`) paint above non-positioned content by default.**

**The two z-index failure modes:**
1. **"z-index: 9999 does nothing"** — the element is inside a parent context that sits lower in the stack. The child cannot escape its parent context. Fix: raise the parent's stacking order, or restructure the DOM.
2. **Accidental context creation** — `opacity: 0.99` or any `transform` traps a child's z-index unexpectedly.

**`isolation: isolate`** creates a stacking context with zero side effects — no opacity change, no transform, nothing else. Use it on component roots to scope internal z-index values, so they never need to be coordinated with the global stack.

**z-index token scale** (semantic naming): base 0 / dropdown 100 / sticky header 200 / overlay 300 / modal 400 / popover 500 / toast 600. Assign to CSS custom properties, not magic numbers.

**For "must sit above everything"**: use the **top layer** — native `popover` attribute or `<dialog>.showModal()`. The top layer is rendered above all stacking contexts; z-index is irrelevant. Never fight the stack with `z-index: 999999`.

---

## Flexbox — Deep Mechanics

`flex` is a shorthand: **grow shrink basis**.

| Value | Expands to | Behavior |
|---|---|---|
| `flex: initial` | `0 1 auto` | won't grow, can shrink, sized by content |
| `flex: auto` | `1 1 auto` | grows and shrinks, content-weighted |
| `flex: none` | `0 0 auto` | rigid, content-sized |
| `flex: 1` | `1 1 0%` | true equal shares — ignores content size |

**`flex: 1` vs `flex: auto`** is the key non-obvious distinction: `flex: 1` sets `basis: 0`, so all items start from zero and the remaining space is divided purely by grow factor. `flex: auto` starts from content size, so larger-content items get more.

**Grow distributes positive remainder by factor; shrink distributes negative space by factor × basis** — shrink is basis-weighted, grow is not.

**Top flex gotcha — `min-width: auto`**: flex items default to `min-width: auto` (cannot shrink below their minimum content size). A long word or fixed-width child overflows the flex container. Fix: **`min-width: 0`** on the item (or set `overflow` to anything but visible). This is the most common unexplained flex overflow bug.

`margin: auto` on a flex item absorbs all remaining space in that direction — `margin-left: auto` pushes everything before it to the right. `margin: auto` centers in both axes.

`align-content` only works when there are multiple flex lines (`flex-wrap: wrap`). On a single-line container it has no effect — a frequent source of confusion.

`order` and `flex-direction: row-reverse` change _visual_ order only; DOM order, tab order, and screen-reader order are unchanged. Do not use for reordering interactive content.

---

## Grid — Deep Mechanics

**Track sizing values**: `px`, `%`, `fr`, `auto`, `min-content`, `max-content`, `fit-content()`, `minmax()`.

**`fr`** distributes space _remaining after_ fixed and `auto` tracks are sized. **`1fr` has an implicit minimum of `auto` (min-content)** — a cell with a long word or large child expands the track and can overflow. **`minmax(0, 1fr)` overrides the implicit minimum**, allowing the track to shrink below content size. This is the grid-overflow fix.

**`auto` tracks** size to content; without `fr` tracks present, they absorb remaining space.

**`auto-fit` vs `auto-fill`** with `repeat()`:
- **`auto-fill`** — creates as many tracks as fit; preserves empty tracks (right side stays empty).
- **`auto-fit`** — collapses empty tracks to zero; existing items stretch to fill the row.

Decision: use `auto-fit` when you want items to expand into available space; use `auto-fill` when you want the grid slots to remain fixed and items should not stretch into empty columns.

**Intrinsic responsive grid (no media queries):**
```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
```
`min(100%, 16rem)` prevents overflow on narrow viewports. Items reflow automatically based on available width.

**Explicit vs implicit grid**: `grid-template-*` defines the explicit grid. Items that overflow create implicit tracks; size them with `grid-auto-rows`/`grid-auto-columns`. `grid-auto-flow: dense` backfills holes — visual reorder, same a11y caveat as `order`.

**Placement**: line-based (`grid-column: 1 / 3`, `grid-row: span 2`); named lines; `grid-template-areas` (ASCII-art layouts — readable and maintainable). Negative line numbers count from the end (`-1` = last explicit line).

**Overlapping items**: place multiple items in the same grid area with `grid-area` — they layer without `position: absolute`. A clean way to achieve content-over-image or badge compositions.

**`subgrid`**: `grid-template-columns: subgrid` on a nested grid makes its items align to the _parent's_ track lines. Solves the card-grid alignment problem: all cards' titles, body text, and footers align across the row regardless of content length. A significant non-default capability available in all modern browsers.

**Alignment axes**: `justify-items`/`align-items` align items inside their cells; `justify-content`/`align-content` position the whole grid track set within the container when the grid is smaller than the container. `place-items` and `place-content` are the 2-axis shorthands.

---

## Flex vs Grid — Decision Rule

**Flex is 1D and content-driven**: the container distributes space along one axis based on what items need. Use for toolbars, nav bars, button groups, chip lists, any row or column where item count or size is unknown.

**Grid is 2D and structure-driven**: you define the track structure first, then items fill it. Use for page layouts, card grids, any composition requiring alignment across both axes.

Mental shortcut: "content pushes out" → flex. "structure constrains in" → grid. Care about alignment across both rows and columns simultaneously → grid. A page-level grid containing flex components is the standard composition.

Grid-only: 2D alignment, overlap without absolute positioning, subgrid cross-item alignment.

---

## Spacing Systems

**Spacing scale** — base unit 4 or 8 px; front-loaded linear, back-loaded quasi-geometric: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`. Pure linear feels mechanical at large values; pure powers-of-two lack small-step granularity. Use two tiers: dense steps (4 px increments) for component internals, coarser steps for section and layout gaps.

**Proximity gradient — the highest-leverage spacing decision**: grouped elements must have visibly smaller gaps than the space between groups. **Quantified: inter-group ≥ 1.5–2× intra-group.** Equal spacing collapses all grouping — the most common amateur error. The rule is recursive: label ↔ input < field ↔ field < section ↔ section. **Spacing hierarchy mirrors content hierarchy.**

**`gap` over margin** in flex/grid: gap never collapses, has no first/last-child edge cases, and is semantically tied to the layout. For block stacking, the `* + *` owl selector (`> * + * { margin-top: ... }`) applies spacing only between siblings, avoiding edge-child problems.

**Spacing unit semantics — coupling decisions:**

| Unit | Coupled to | Use for |
|---|---|---|
| `px` | nothing (absolute) | borders, pixel-precise values |
| `rem` | root font size / user font size setting | layout gaps, section padding — scales with user preferences |
| `em` | element's own font size | component internal padding — self-scaling components |
| `ch` | character width in current font | prose `max-width` (target 45–75 ch, ~66 ideal) |
| `%` / `vw` | container or viewport | fluid widths; pair with `clamp()` for bounds |

**Self-scaling components**: set component padding in `em`. A larger font size automatically proportions the padding — one component definition covers all size variants.

**Fluid spacing**: `clamp(min, preferred, max)` gives any spacing or size a smooth range across viewport widths, replacing discrete breakpoint switches.

---

## Intrinsic Sizing and the Hug/Fill/Fixed Model

Before writing CSS, label each element's sizing intent:
- **Hug** — wraps content: `width: fit-content`, `inline-size: max-content`, or inline element default.
- **Fill** — occupies available space: `flex: 1`, `width: 100%`, or grid `1fr`.
- **Fixed** — explicit dimension: `width: 320px`.

Layout bugs are mostly intent mismatches: wanting Fill but writing Fixed (breaks responsiveness), or wanting Hug but getting stretched by an implicit `align-items: stretch`.

**Intrinsic sizing keywords**: `min-content` (minimum without overflow ≈ longest word), `max-content` (ideal width, no wrapping), `fit-content` (`min(max-content, available space)`). `aspect-ratio` locks proportions without height hacks.

**The universal flex/grid overflow trap**: grid and flex child items default `min-width: auto` — they refuse to shrink below their minimum content size. A single long text string or wide image blows out the track. Fix everywhere with **`minmax(0, 1fr)`** on grid tracks or **`min-width: 0`** on flex/grid children.

---

## Logical Properties and Writing Modes

Replace physical direction names with logical ones throughout. The block axis is the stacking axis (vertical in horizontal writing), the inline axis is the text flow axis.

- `margin-inline-start/end` replaces `margin-left/right` — auto-mirrors in RTL.
- `margin-block-start/end` replaces `margin-top/bottom`.
- `padding-inline`, `padding-block` shorthands.
- `inset` replaces `top/right/bottom/left` in a single property.

Writing logical properties from the start costs nothing and makes RTL and vertical-text layouts correct without a separate stylesheet. `margin-left` in an Arabic/Hebrew layout will be on the wrong side.

---

## Container Queries

`@container` makes a component respond to its _own_ container width, not the viewport. One component definition adapts wherever it is placed — sidebar, main column, modal — without viewport media queries.

```css
.card-wrapper { container-type: inline-size; }
@container (min-width: 480px) { .card { flex-direction: row; } }
```

**Important**: `container-type: inline-size` on an ancestor establishes a containing block for `position: fixed` descendants — the fixed-element trap described in the positioning section. Be aware when adding container queries to a layout that contains fixed overlays.

---

## Containment and Performance Boundaries

- `contain: layout` — internal layout does not affect the outside world; limits reflow scope.
- `contain: paint` — children cannot paint outside the boundary; off-screen elements skip paint.
- `contain: size` — element size is independent of content (requires explicit dimensions).
- `content-visibility: auto` — skips layout and paint for off-screen elements entirely; pair with `contain-intrinsic-size` to reserve space and prevent scroll-position jumps.
- `display: flow-root` / `overflow ≠ visible` — also create BFC, with the containment side effects noted above.

---

## Quick-Reference

| Topic | Rule |
|---|---|
| box-sizing baseline | `border-box` on `*` |
| vertical %-padding | computed against **width**, not height |
| BFC (clean) | `display: flow-root` |
| BFC effects | contains floats / stops margin collapse / refuses float overlap |
| margin collapse | siblings / parent-child / empty block; block axis, same BFC only |
| stop collapse | `flow-root` / border / padding / **flex or grid** |
| gap > margin | use `gap` in flex/grid for predictable spacing |
| image gap | inline sits on baseline → `display: block` or `vertical-align` |
| fixed trapped | transform / filter / will-change / contain / **container-type** ancestor |
| z-index truth | sorts within context only — child cannot escape parent context |
| accidental context | `opacity < 1`, any `transform` creates stacking context |
| z-index isolation | `isolation: isolate` on component root |
| above everything | **top layer** via `popover` / `dialog.showModal()`, not z: 99999 |
| sticky fails | ancestor `overflow` or parent too short |
| `flex: 1` | `1 1 0` — true equal shares |
| `flex: auto` | `1 1 auto` — content-weighted |
| flex overflow | `min-width: 0` on item |
| `align-content` | only works with `flex-wrap: wrap` + multiple lines |
| order / reverse | visual only — a11y order unchanged |
| `1fr` overflow | implicit min is `auto` → use `minmax(0, 1fr)` |
| auto-fit | collapses empty tracks, items stretch |
| auto-fill | preserves empty track slots |
| intrinsic grid | `repeat(auto-fit, minmax(min(100%, Xrem), 1fr))` |
| subgrid | inherits parent tracks — cross-card alignment |
| Hug/Fill/Fixed | label intent before writing CSS |
| spacing scale | 4/8/12/16/24/32/48/64/96 px |
| proximity rule | inter-group ≥ 1.5–2× intra-group |
| `em` padding | self-scaling components |
| `rem` gaps | tracks user font-size preferences |
| `ch` width | prose max-width 45–75 ch |
| fluid spacing | `clamp(min, ideal, max)` |
| logical props | `margin-inline`, `padding-block`, `inset` — RTL-safe |
| touch targets | ≥ 44×44 px, ≥ 8 px separation |
| reflow | content readable at 320 px / 400% zoom (WCAG 1.4.10) |

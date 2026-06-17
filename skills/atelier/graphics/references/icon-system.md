# Icon system — one family, a written spec, and optical craft

> An icon "system" is not "pick a library and drop icons." Its depth is in keyline optical
> sizing, the stroke-scaling bug, style-as-state encoding, currentColor cascading, and the
> a11y minefield — none of which an agent does by default. This doc holds the encodable
> technique behind the icon gate. Taste picks the family and the spec; the spec enforces
> every icon that follows.

---

## What makes it a system

Consistency across six axes: **stroke-width, grid / size, corner radius, optical weight, style (line / solid / duotone), and metaphor vocabulary.** A system means every icon reads as drawn by one hand.

The number-one failure: mixing families. Lucide, Heroicons, and a rogue Material icon pulled for one shape — different stroke weights, different grids, different corner radii — and the surface reads assembled, not designed. **One family, or a written spec for everything drawn.**

Well-maintained families to choose from: Lucide · Phosphor · Heroicons · Material Symbols · Tabler. Each has its own grid, stroke-width convention, and endpoint style — commit to one and hold it.

---

## The written spec

Before placing any icon in a component, write this down:

| Property | Example (Lucide) | Your system |
|---|---|---|
| Grid | 24×24 | |
| Safe-area padding | ~2px (live area ~20px) | |
| Stroke-width | 2px at 24 grid | |
| Corner radius | — (round by family default) | |
| `stroke-linecap` | `round` | |
| `stroke-linejoin` | `round` | |
| Primary style | line (stroke) | |
| Active/selected state | solid (fill) | |
| Duotone usage | optional brand accents | |

Without this written spec, every new icon is a hand-pick. When the family lacks an icon, draw a new one matching every property in the spec — grid, stroke, padding, endpoint style — until it is indistinguishable from the family, and record it in the spec.

---

## Grid, safe area, and optical sizing

**The pixel grid.** Icons are drawn on a pixel grid (24×24 is the common default; also 16/20/48). The grid includes a safe area / padding of ~2px on each side → ~20px live drawing area. The padding gives optical breathing room and keeps icon edges clear of adjacent text.

**Keyline / optical equality.** The grid carries keyline shapes — square, circle, portrait rectangle, landscape rectangle — that define *visually equal* size, not pixel-equal size. A circle icon must be drawn slightly **larger** (overflowing the keyline boundary) to read as the same size as a square icon. This is optical sizing, not pixel sizing. The agent never does this; a circle drawn to the same pixel bounds as a square reads smaller.

**Aligning to text.** An icon sitting next to text belongs at ~**cap-height**, optically centered — not "font-size px". In practice: `line-height: 1` + `vertical-align: middle` gets close; optical adjustment in the pixel grid is more precise.

**Small sizes and pixel-fitting.** Scaling a 24px icon master down to 16px often produces a muddy result — sub-pixel strokes alias badly. At small sizes: pixel-fit to the grid (draw or snap vertices to integer coordinates), or use a family that ships per-size artwork (Material Symbols, Phosphor ship separate 16/20/24/48 variants drawn for that size, not mechanically scaled).

---

## Stroke weight and the stroke-scaling bug

**One stroke-width across the set.** A common value is 1.5px or 2px on a 24-grid. Correlate to the adjacent text weight: heavier text needs a heavier icon. Balance *perceptual* weight too — a densely detailed or filled icon reads heavier than a sparse one; calibrate visually across the set.

**The stroke-scaling bug — the non-default fix.** When you scale an SVG, the stroke scales with it: a 24px@2px icon shrunk to 16px now has a 1.33px stroke — too thin, out-of-family, inconsistent. Three fixes:

1. **`vector-effect: non-scaling-stroke`** — tells the SVG engine to keep stroke at the *specified* width regardless of transform scaling. Apply to every `<path>` / `<line>` / `<circle>` that carries a stroke. CSS: `* { vector-effect: non-scaling-stroke; }` scoped inside the SVG.
2. **Per-size optical icons** — a different SVG drawn for each size (the family already does this; rely on it).
3. **Per-size stroke-width** — set `stroke-width` explicitly per rendered size (requires knowing the size at render time).

An agent that just drops the icon into a scaled container gets the broken version.

**Variable icon fonts (frontier).** Material Symbols exposes OpenType axes: `wght` (weight), `FILL` (0/1 fill toggle), `GRAD` (grade — dark-mode fine-tune), `opsz` (optical size). This allows animating the `FILL` axis on state change (a smooth line→solid transition), and lifting `GRAD` slightly in dark mode to compensate for perceived thinning. Non-default, not universally available.

---

## Style as state encoding

Pick **one primary style** for the default state; reserve the others for systematic state encoding. Do not randomly mix the three.

- **Line (stroke)** — default / inactive / lighter visual weight. The "at rest" state.
- **Solid (fill)** — active / selected / emphasized. A tab bar icon is line when unselected, solid when selected — **style encodes state.** This communicates selection without relying on color alone.
- **Duotone** — a low-opacity secondary fill + the stroke, for depth or brand accent. Use sparingly; not a replacement for solid-as-active.

If the base style is line, every base icon must be line and solid is reserved. Choosing a random mix case-by-case destroys the encoding system.

---

## Implementation: inline SVG + currentColor

**Inline SVG is the modern default** for UI icons. It is CSS-controllable, accessible, crisp at all densities, and animatable. The critical non-default:

```svg
<!-- Set fill or stroke to currentColor, not a fixed hex -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path stroke="currentColor" stroke-width="2" ... />
</svg>
```

`currentColor` inherits the element's CSS `color` property. This means:
- Hover/active/disabled states come **free** from the text color cascade — no icon-specific color rules needed.
- Dark mode comes free — the icon adapts as the text color token flips.
- Accent/semantic color is applied by setting `color` on the button/element, not per-icon.

**Remove fixed `width` and `height` attributes** from the SVG element; let CSS control size. Keep the `viewBox`. This makes the icon scale correctly at any CSS size.

```css
.icon { width: 20px; height: 20px; }       /* controlled in CSS */
.icon--lg { width: 24px; height: 24px; }
```

**SVG sprite** (`<use href="icons.svg#icon-name">`) — one cached file, many references. Good for high-repetition icons (table row icons, list items). Slightly harder to style per-instance vs inline SVG, but reduces page weight.

**Icon fonts — avoid in new systems.** Legacy approach with several problems: accessibility (AT reads character codes, not icon names), anti-aliasing inconsistency, FOUT on load, single-color only (no duotone), wrong semantics (a font is for text). Variable icon fonts (Material Symbols) are the modern exception — a proper font-rendering pipeline with axes.

**Optimization.** Run SVG through SVGO to strip editor metadata, unused defs, and superfluous attributes. Keep `viewBox`; remove fixed `width`/`height`; strip inline styles that would override CSS; normalize `fill`/`stroke` to `currentColor`.

---

## Accessibility — the minefield

**Two categories, two rules:**

1. **Decorative icon** — a text label is already visible and conveys the meaning. The icon is visual reinforcement only.
   ```html
   <button>
     <svg aria-hidden="true" focusable="false">...</svg>
     Delete
   </button>
   ```
   `aria-hidden="true"` tells AT to skip the SVG. `focusable="false"` prevents IE11 from making the SVG a tab stop. Without these, the AT reads "graphic" before the label.

2. **Meaningful icon** — icon-only button, no visible label. The icon *is* the entire communication.
   ```html
   <!-- Option A: aria-label on the button -->
   <button aria-label="Delete item">
     <svg aria-hidden="true" focusable="false">...</svg>
   </button>

   <!-- Option B: visually-hidden text -->
   <button>
     <svg aria-hidden="true" focusable="false">...</svg>
     <span class="sr-only">Delete item</span>
   </button>
   ```
   Without an accessible name, the button is **invisible to screen readers**. This is not a nice-to-have; it is a failure.

**Icon-only buttons need tooltips** — a label visible on hover and focus (`:focus-visible`) that is also screen-reader-reachable (not just `title`, which is unreliable and hover-only).

**Hit target ≥44px.** A 24px icon icon in a 24px container fails touch targets. Pad to 44×44px:
```css
.icon-button {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
}
```

**Contrast ≥3:1** (WCAG 1.4.11 non-text contrast) for all functional icons against their background. Disabled icons are technically exempt but should not vanish entirely.

**Metaphor universality.** Hamburger (three-line menu) and overflow dots (⋯) are learned conventions in tech contexts, not globally understood. Gear = settings, trash = delete, and magnifier = search are widely recognized. For anything unusual, pair the icon with a text label — **icon + label beats icon-only**.

---

## Metaphor and semantic consistency

One concept = one icon across the product. Build and maintain an icon ↔ meaning vocabulary:

| Concept | Icon | Notes |
|---|---|---|
| Delete / remove | trash / × | Pick one; don't use both |
| Search | magnifier | Universal |
| Settings / preferences | gear | Widely understood |
| Add / create | + (plus) | |
| Close / dismiss | × (X) | Not ← (back) |
| External link | arrow + box | Communicates new tab |
| Sort | two arrows ↑↓ | |

Avoid: culturally specific metaphors (floppy disk for save is contested; US-style mailbox); overly clever/novel symbols that need to be learned. When in doubt, add a text label.

---

## Icon color, state, and motion

**Default: monochrome / `currentColor`.** Functional UI icons carry no independent color — they inherit from their text context and respond to all state changes for free.

**State transitions via style:** unselected (line) → selected (solid), using the state-encoding system above.

**Semantic color** (green checkmark = success, red × = error) uses semantic color tokens from the color system. **Never rely on color alone** — the shape must also carry the meaning (redundant encoding for color blindness).

**Animated state transitions** are signature micro-interactions:
- Line ↔ solid (fill opacity or FILL axis on variable icon font)
- Hamburger ↔ X (SVG path morph)
- Play ↔ Pause (SVG path morph)
- Chevron rotation (CSS `transform: rotate()`)
- Checkmark draw-on (`stroke-dashoffset` animation)

These animate via SVG path interpolation, `stroke-dashoffset`, CSS `transform`, or the variable font's `FILL` axis. Always provide a `prefers-reduced-motion` alternative (skip the transition, jump to end state).

---

## Quick-reference checklist

| Check | Standard |
|---|---|
| One family | No icons from outside the chosen family |
| Written spec | Grid, stroke-width, padding, linecap, linejoin on record |
| Optical sizing | Circle keyline > square; per-size art at 16px |
| Stroke-scaling | `vector-effect: non-scaling-stroke` or per-size icons |
| `currentColor` | `fill`/`stroke: currentColor` on all paths; no fixed hex |
| Remove size attrs | `width`/`height` removed from SVG; viewBox kept |
| Style-as-state | One primary style; solid reserved for active/selected |
| Decorative | `aria-hidden="true"` + `focusable="false"` |
| Meaningful | `aria-label` or `.sr-only` text on the button |
| Hit target | ≥44×44px |
| Contrast | ≥3:1 (1.4.11) |
| Tooltip | Keyboard + SR-reachable, not hover-only |
| New icons | Drawn to spec; recorded in the vocabulary |
| Animation | `prefers-reduced-motion` respected |

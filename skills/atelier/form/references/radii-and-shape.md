# Radii and Shape — encodable technique

> The technique behind `form`'s second gate. Taste picks the radius family and the shape
> language; the system then derives every corner value by rule — concentric nesting,
> semantic mapping, directional intent. No random `border-radius` values — every corner
> is a TOKEN or a formula derived from one.

---

## The radius scale (token family)

Define a small stepped set. Map each step to a role, then assign components by role —
not by visual feel at the moment of coding.

**Reference scale:**

| Token | Value | Typical role |
|---|---|---|
| `--radius-none` | 0 | Hard data tables, grid cells that bleed to edges |
| `--radius-xs` | 2px | Chips, badges, tiny tags |
| `--radius-sm` | 4px | Input fields, small buttons, compact controls |
| `--radius-md` | 8px | Standard buttons, dropdowns, tooltips |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Modal dialogs, drawers, larger cards |
| `--radius-2xl` | 24px | Hero surfaces, featured panels |
| `--radius-full` | 9999px | Pills, avatars, loaders |

Components consume a token from this set — never a magic pixel value. One radius family
is a single "temperature" — a medical app runs cool (small radii, precise); a consumer
social app runs warm (large, pill-heavy). The whole surface reads as one language because
every element pulls from the same family.

---

## Concentric nesting — the most critical non-default

**The rule: inner radius = outer radius − padding.**

When element B is nested inside container A with padding P:
```
inner-radius = outer-radius − P
```
If `outer-radius − P ≤ 0`, the inner element gets `border-radius: 0` (never negative).
Apply recursively for each nesting level.

Why: when two concentric rounded rectangles share the same radius, the inner one looks
*pointier* than the outer because the same arc spans a shorter distance. The eye sees a
mismatch — the corners appear to pull different directions. Subtracting the padding
produces arcs that are geometrically concentric and perceptually parallel.

This is the single most visible fingerprint of attention to craft in a UI, and the step
an agent almost never takes.

**Example:**
```css
/* Card: outer-radius 16px, padding 16px */
.card {
  border-radius: var(--radius-xl); /* 16px */
  padding: var(--spacing-lg);      /* 16px */
}
/* Image or inset element inside the card */
.card__media {
  border-radius: calc(var(--radius-xl) - var(--spacing-lg)); /* 0px — goes square */
}
/* If padding were 8px, inner = 16 - 8 = 8px */
```

When nesting a small chip inside a larger card, the chip keeps its own chip radius
(small), not a calculated one — the rule applies to *inset content that shares the
container's visual edge*, not to every nested element.

---

## Smooth corners / squircle (continuous curvature)

CSS `border-radius` produces a circular arc. At the junction between the straight edge
and the arc, curvature jumps discontinuously from zero to 1/r. The eye reads this as a
micro-crease. It is subtle but cumulative across a UI.

A **continuous-curvature corner (G2-continuous)**, also known as a superellipse or
squircle, transitions the curvature smoothly from zero to maximum and back. This is why
Apple's "continuous corners" in iOS icons and macOS card UI looks softer and more
"premium" than standard CSS corners — the curve starts earlier and arrives later.

**Superellipse equation:** `|x/a|^n + |y/b|^n = 1`
- n = 2: circle/ellipse
- n → ∞: rectangle
- n ≈ 4–5: squircle (Figma's "corner smoothing 60–100%" approximates this)

**Implementation paths:**
- **CSS `corner-shape` (emerging):** `corner-shape: superellipse` paired with
  `border-radius`. Check current browser support before shipping — this is still
  experimental as of 2026.
- **SVG path / `clip-path` (established fallback):** Generate a squircle path or use a
  library. `clip-path` follows the alpha channel for shadow purposes — pair with
  `filter: drop-shadow()`.

**When it earns its cost:** large, prominent surfaces — feature cards, modals, floating
action buttons, avatars, app icons. Small controls (form inputs, tags) don't benefit
enough to justify the complexity.

---

## Shape language beyond "round"

CSS `corner-shape` (emerging spec) opens the corner vocabulary beyond circular arcs:

| Shape | Character | Use case |
|---|---|---|
| `round` | Default — friendly, approachable | General purpose |
| `bevel` | Chamfered / cut — technical, industrial | Data tools, precision instruments |
| `scoop` | Inward curve — playful, ticket-like | Promotional badges, tabs |
| `notch` | Bitten-in corner — tab connector | Navigation tabs, clip connectors |
| `squircle` / `superellipse` | Smooth and soft — premium | Cards, brand moments |

**Shape is a brand decision, not a default.** Most UIs ship `round` because no one
decided otherwise; a deliberate choice of `bevel` throughout reads as "precision tool"
in a way that generic round never achieves. Decide the shape family with the same
intentionality as the color system.

---

## Radius semantics and affordance

Rounder → more friendly, approachable, clickable, consumer.
Sharper → more serious, technical, data-dense, professional.

Map this to product archetype:
- **Consumer product / social / entertainment:** warm radius scale, frequent pills,
  `full` for avatars and action buttons.
- **Data tool / dashboard / B2B:** cooler scale, fewer pills, smaller base radius —
  `--radius-sm` or `--radius-md` as the default, `--radius-none` for table cells.
- **Medical / legal / financial:** often the sharpest — credibility and precision read
  as "this is serious."

These are not decorations. They are the first visual signal about what kind of surface
this is.

---

## Directional and asymmetric corners

`border-radius: top-left top-right bottom-right bottom-left` gives per-corner control.
Use this for semantic directional meaning:

- **Tab:** round top-left and top-right only — attached to the content pane below.
- **Bottom sheet:** round top-left and top-right only — attached to the edge below it.
- **Chat bubble:** three corners rounded, one pointed — the pointed corner indicates the
  speaker. The point is not decoration; it carries "this came from over there."
- **Dropdown below a button:** optionally flatten the top edge (continue from the
  button's bottom) — one surface extending from another.

Directional radii encode "attached to" and "pointing toward." Use only when those
semantics are real. Random asymmetry reads as broken.

---

## Optical and boundary details

- **Stroke's inner radius:** a `border` on a rounded element creates an outer radius r
  and an inner radius r − border-width. CSS handles this automatically. In hand-coded SVG
  or layered designs, calculate it explicitly.
- **Clipping nested content:** a rounded container with image or line content must have
  `overflow: hidden` (or equivalent `clip-path`) so the content doesn't bleed past the
  corner. Forgetting this is the most common radius bug — the element appears rounded but
  its child content ignores the corner.
- **Full-bleed at viewport edge:** if a card stretches to the viewport edge on mobile,
  remove the radius on the sides that touch the edge. An element pressing against a
  physical edge while still curving away looks like a mistake.
- **Anti-aliasing:** CSS and SVG clip-path use different anti-aliasing pipelines. On high-
  DPI screens the difference is minor; at low DPI or on transformed elements, SVG clip-
  path corners can look crisper or different.

---

## Responsive radius

Large radii can look over-scaled on small viewports. Options:
- Define separate token values per breakpoint (if the system supports it).
- Use `clamp(4px, 1vw, 16px)` for radii that should scale with viewport width.
- On mobile, containers that go full-bleed often drop to `--radius-none` on the
  bleed sides.

---

## Quick-reference (tokenizable / lintable)

| Item | Rule |
|---|---|
| Scale | 0 / 2 / 4 / 8 / 12 / 16 / 24 / full — one family, not mixed |
| Concentric | Inner = outer − padding; recursively; ≤ 0 → 0 |
| Smooth corners | Squircle (n ≈ 4–5) on large prominent surfaces |
| Shape language | round / bevel / scoop / notch — decided, not defaulted |
| Semantics | Rounder = friendly/consumer; sharper = technical/data |
| Directional | Per-corner only when direction has meaning |
| Clipping | `overflow: hidden` on any rounded container with child content |
| Full-bleed | Drop radius on sides touching the viewport edge |
| Non-rectangular | `filter: drop-shadow()` for shadow on clip-path shapes |
| Consistency | Same elevation → same radius treatment |

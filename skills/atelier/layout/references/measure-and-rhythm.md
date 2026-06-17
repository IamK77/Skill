# Measure and Rhythm — encodable technique

> The technique behind layout's Stage 1 gates. Taste picks the density register and spacing scale;
> rhythm then *derives* every gap, padding, and measure from that decision. No ad-hoc px — every
> spatial value traces back to the scale.

---

## The spacing scale: one base unit, derived steps

A spacing scale is a small set of named steps derived from a single base unit. Every gap, padding,
margin, and gutter in the layout references a step — never a magic number.

**Base unit: 4 or 8px.** A 4px base gives more granularity for dense UIs; an 8px base gives
cleaner values for comfortable UIs. Both work; pick one and hold it.

**Recommended scale (mixed linear / geometric):**

| token     | value  | use               |
|-----------|--------|-------------------|
| `space-1` | 4px    | micro-gap, icon padding |
| `space-2` | 8px    | component internal padding |
| `space-3` | 12px   | tight group gap   |
| `space-4` | 16px   | default component gap |
| `space-6` | 24px   | section sub-gap   |
| `space-8` | 32px   | section gap       |
| `space-12`| 48px   | layout zone gap   |
| `space-16`| 64px   | hero / page-level spacing |
| `space-24`| 96px   | macro whitespace  |
| `space-32`| 128px  | max hero padding  |

The front of the scale is linear (4, 8, 12, 16) for the fine resolution that component internals
need. The back is roughly geometric (24, 32, 48, 64, 96, 128) because large spacing needs more
perceptual separation between steps — equal linear steps at large sizes look identical.

**Two-speed spacing:** component-level spacing (inside a card, inside a form) draws from the
dense end of the scale (space-1 to space-4); layout-level spacing (between sections, page
margins) draws from the loose end (space-8 to space-24). Mixing levels is the source of most
"feels cramped" or "feels scattered" complaints.

---

## Proximity and grouping: the highest-leverage spacing decision

Gestalt proximity: **elements that are closer together are read as belonging to the same group.**
This is not aesthetic preference — it is how the visual system parses structure.

**Quantified rule:** group-internal spacing must be *measurably* smaller than group-to-group
spacing. A safe ratio: group-to-group gap ≥ 1.5–2× group-internal gap.

Example — a form field (label + input):
- label ↔ input: `space-1` (4px) — they belong to each other
- field ↔ field: `space-4` (16px) — they are siblings, not the same unit
- section ↔ section: `space-8` (32px) — they are distinct zones

The **spacing gradient** mirrors the **content hierarchy**: the deeper the nesting, the tighter the
spacing. Spacing is the visual projection of the document outline.

**The diagnostic:** squint until the layout blurs. Do the groups separate cleanly? If a label
looks equidistant from its input and from the previous field, proximity is broken. This is the
single most common "amateur" tell — it registers as visual mud without a name.

---

## Measure: line length and the reading column

**Measure** (typographic term) is the width of a line of text. Reading is most comfortable at
approximately **45–75 characters** (~66ch ideal). Beyond 75ch the eye loses its return saccade;
below 45ch the eye jumps too frequently and disrupts the reading rhythm.

The agent's default is to let text fill the full container width. On a 1400px viewport, this
produces 120–150 character lines — unreadable at sustained pace.

**Implementation:**

```css
.prose { max-width: 65ch; }
```

Use `ch` (width of the `0` glyph) not `px` — it scales with the typeface and with user font-size
preferences. A `px` measure breaks when the user increases their browser font size.

**Content well vs full-bleed:** a common pattern is a centered `max-width` container (e.g.,
1200–1440px) for the page scaffold, and a narrower reading column (65ch) for body text. Hero
sections, imagery, and data tables may bleed to the container edge; prose does not.

---

## Vertical rhythm and the baseline grid

**Vertical rhythm** means all vertical spacing — line heights, margins, padding — land on a
consistent beat (the base unit or a multiple). The eye reads rhythmic disruption as "off" even
without identifying the cause.

**In practice on the web,** a strict baseline grid (every text baseline on a grid line) is very
difficult because line-heights differ across elements and there is no `baseline-grid` CSS property.
The practical approximation is:
1. Express all vertical spacing as multiples of the base unit (4 or 8px).
2. Derive line-heights from the type scale, and choose line-heights that also land on multiples of
   the base unit where possible (e.g., a 16px body with 1.5 line-height = 24px per line, which
   is 3× the 8px base unit).

**The line-box trap:** `line-height` adds space above and below the cap-height. A `margin-top: 24px`
on a heading that has a `line-height: 1.2` at 32px actually adds invisible padding above. The
visually perceived gap is `margin-top + (line-height − 1) × font-size / 2`. To design for the
perceived gap rather than the box gap, use `text-box-trim: trim-both` + `text-box-edge: cap
alphabetic` (check browser support before shipping) or manually compensate with a negative margin
equal to the half-leading of each element.

---

## Spacing unit semantics: what you're coupling to

The CSS unit is not stylistic — it is a declaration of *what the spacing is coupled to*.

| Unit | Couples to | When to use |
|---|---|---|
| `px` | Nothing (absolute) | 1px borders; pixel-perfect details that must never change |
| `rem` | User's root font-size preference | Layout spacing, section gaps — respects user accessibility scaling |
| `em` | The element's own font-size | Component internal padding — a larger button inherits larger padding automatically |
| `ch` | Width of `0` glyph in current font | Line-length constraints (`max-width: 65ch`) |
| `%` / `vw` | Container or viewport size | Fluid layout widths; use with `clamp()` to cap extremes |

**The self-scaling component:** use `em` for component-internal padding. A button at `font-size: 1rem`
and `padding: 0.5em 1em` scales correctly at every type-scale step — the padding grows with the
font, not independently. Writing `padding: 8px 16px` breaks this relationship and requires a
separate CSS block for each size variant.

**The accessibility imperative:** layout spacing in `rem` means that when a user sets their browser
font to 20px, all spacing scales up proportionally. `px` spacing stays fixed, making the layout
feel cramped at large font sizes and failing WCAG 1.4.10 (reflow at 400% zoom).

---

## Fluid spacing with clamp()

`clamp(min, ideal, max)` gives a value that grows with viewport width without steps.

```css
/* Section padding that breathes between 16px (mobile) and 64px (desktop) */
padding-block: clamp(1rem, 4vw, 4rem);
```

The middle term is the "ideal" — use a viewport-relative unit (`vw`, `cqw` for container queries)
so the value grows proportionally. `min` and `max` are the hard stops in accessible units (`rem`).

This replaces the common pattern of `padding: 16px` overridden to `padding: 64px` at a breakpoint
— the fluid version transitions smoothly and avoids the jarring jump.

**Fluid layout spacing** is also the correct tool for gutters that should be tighter on mobile and
wider on desktop, and for hero section padding that would otherwise need three media query
overrides to feel natural.

---

## Direction-agnostic spacing: logical properties

Physical directional properties (`margin-left`, `padding-right`) break in RTL layouts — the
margins do not mirror. Logical properties map to the writing direction automatically.

| Physical | Logical | Meaning |
|---|---|---|
| `margin-left` | `margin-inline-start` | Start of the inline axis |
| `margin-right` | `margin-inline-end` | End of the inline axis |
| `padding-top` | `padding-block-start` | Start of the block axis |
| `padding-bottom` | `padding-block-end` | End of the block axis |
| `left: 0` | `inset-inline-start: 0` | Positioned element, inline start |

**Shorthand form:** `margin-inline: auto` (centers inline); `padding-block: var(--space-4)` (vertical padding).

Use logical properties everywhere except where the physical direction is intentionally
absolute (e.g., an element that must always be visually on the right regardless of writing
direction — a decorative flourish, not a functional element).

**Box model baseline:** always set `box-sizing: border-box` globally. Without it, padding is
additive to width, making spatial arithmetic impossible.

---

## Dense-layout spacing: tables and dashboards

Dense UIs (data tables, dashboards, admin panels) have a different spacing register. The same
spacing scale applies but from the tight end, with additional constraints:

**Vertical padding tiers for table rows / list items:**

| density tier | cell vertical padding | when to use |
|---|---|---|
| compact | 4–8px | maximum data density, power users |
| default | 8–12px | standard data UI |
| comfortable | 12–16px | consumer-facing, readable |

Provide a density switch where practical — power users and casual users have different needs.

**Number columns:** right-align + `font-variant-numeric: tabular-nums`. Decimal-point alignment
requires either tabular numerals or a fixed-width font. Text columns left-align. A column that
mixes text and numbers must commit to one alignment axis; never center-align a data column.

**Hairlines, not shadows:** in dense sections, dividers should be hairlines (1px, low-contrast
neutral). A shadow in a dense table reads as noise. The decision tree from the form/shadow docs
applies here: shadows are for elevation (floating over content); hairlines are for grouping
(adjacent on the same plane).

**Minimum column widths** prevent collapse. A column narrower than its content overflows or
wraps in ways that destroy the alignment discipline. Set `min-width` on columns and allow
horizontal scroll before truncation (truncation destroys data).

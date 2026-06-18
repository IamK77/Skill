# Grid and Hierarchy — encodable technique

> The technique behind layout's Stage 0 gates. Taste picks the armature (which grid, which
> hierarchy model, how many focal layers); the grid then *derives* every alignment decision
> by rule. No ad-hoc positioning — every element's place is a *consequence of the grid*.

---

## The armature: what a grid actually is

A grid is not a stylesheet pattern — it is the **underlying armature** of the composition. Before
any element is placed, the grid exists as a set of constraints: columns, gutters, a baseline unit.
Everything placed on the grid borrows its authority; everything placed *off* the grid must spend
that violation as intentional emphasis.

Two concepts worth separating:

- **The column grid** — horizontal divisions that align elements and establish rhythm across the
  axis the eye travels while reading (left-to-right in LTR; right-to-left in RTL). Typical: 4, 8,
  or 12 columns with consistent gutters. A 12-column grid is flexible (halves, thirds, quarters);
  a 4-column grid suits mobile or simple layouts.
- **The baseline unit** — the vertical rhythm unit (typically 4 or 8px). All vertical spacing —
  margin, padding, line-height cap — should land on a multiple of this unit. The eye is sensitive
  to rhythmic disruption even when the viewer cannot name the source.

**The grid is rules; breaking the grid is emphasis.** A single element that spans columns or bleeds
to the edge carries weight *because* it breaks the rule. Use one such break per composition maximum;
two breaks fight each other.

---

## Building the column grid

**Column count by context:**

| Surface type | Column count | Notes |
|---|---|---|
| Mobile / narrow panel | 4 | Simpler, fewer decisions |
| Tablet / medium | 8 | Transitional, flexible |
| Desktop / wide | 12 | Maximum flexibility |

**Intrinsic-responsive grid (no breakpoints):**

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
```

`min(100%, 16rem)` prevents overflow on narrow viewports. This pattern — the RAM (Repeat, Auto,
Minmax) pattern — adapts column count to available width without media queries. Use for card grids
and content grids where the *number* of columns is less important than the *minimum useful size*
of each item.

**Fixed-column grid:**

```css
grid-template-columns: repeat(12, 1fr);
gap: var(--space-4);
```

Use when column alignment across rows matters (e.g., a content page where text, aside, and caption
must share a column boundary).

**Subgrid** — for aligning nested content to the parent grid:

```css
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.card      { display: grid; grid-row: span 3; grid-template-rows: subgrid; }
```

With `subgrid`, all cards share the same row tracks — header, body, and footer align across cards
regardless of content length. Without subgrid, ragged card bottoms require a workaround or a fixed
height. Agent layouts almost never use subgrid; this is a major source of misaligned card grids.

---

## Visual hierarchy: the focal order

**Hierarchy is the answer to "where does the eye go first?"** A composition without hierarchy forces
the viewer to decide; a composition with hierarchy *guides* them. The brain scans, not reads — it
needs an obvious entry point, a path, and an exit.

**The hierarchy vocabulary (in descending order of authority):**

1. **Size** — the largest element carries the most weight. Simple, reliable, first.
2. **Weight** — bold/heavy type punches harder than regular at the same size.
3. **Contrast** — a high-contrast element (dark on light, saturated on neutral) draws before a
   low-contrast one.
4. **Position** — the optical center (slightly above geometric center) and the F/Z scan path are
   the locations the eye arrives at first.
5. **White space / isolation** — an element surrounded by space reads as important *because of the
   space around it*, not because of any intrinsic property.
6. **Color** — use sparingly; one saturated element in a neutral composition commands attention.

**The optical center** sits ~10% above the geometric center of the container. Place the primary
focal element here; it will feel centered even though it is not geometrically so. A logo or hero
headline placed at true geometric center reads as dropped.

**Scan patterns:**

- **F-pattern** — text-dense pages (articles, dashboards, search results). The eye reads across
  the top, then drops and reads a shorter span, then drops again. Place the primary CTA and
  critical labels at F-stop positions: top-left, mid-left.
- **Z-pattern** — sparse landing pages, simple forms. Eye moves across the top, diagonally to the
  bottom-left, then across the bottom. Place headline (top-left), secondary info (top-right), CTA
  (bottom-right).

**One primary element per composition.** If everything is bold, nothing is. The head-to-body ratio
of a composition is the primary hierarchy lever: make the primary element *much* larger than
secondary elements, not *a little* larger.

---

## Asymmetric balance and visual weight

**Symmetric composition** reads as formal and stable. **Asymmetric composition** reads as dynamic
and modern — but asymmetry is not the same as disorder. Asymmetric balance requires *counterweight*:
a large, light element on one side balanced by a small, dark or dense element on the other.

Visual weight is determined by: size · darkness (lightness L) · chroma · density · complexity.
A large low-contrast area can be balanced by a small high-contrast element.

**Practical rule:** an asymmetric layout that feels balanced is one where the *visual mass* of the
left and right (or top and bottom) is roughly equal, even if the *element count* and *size* are not.

---

## Alignment discipline

**Everything must align to something.** Not just to the grid — to *each other*. A label that is
3px off from the input below it registers as "broken" without the viewer knowing why. The eye is
a high-precision alignment detector.

**Hard rules:**
- Text elements align to a common left edge (in LTR), or a common baseline.
- Numbers in columns right-align and use `font-variant-numeric: tabular-nums` so decimal points land on a column.
- Mixed-type columns (text+number) must choose one alignment edge; never center-align a data column.
- Icon+label pairs: align by the icon's **optical center**, not its bounding box. A geometric icon
  positioned by bounding box is usually visually low; nudge by the overhang of cap-height vs
  bounding box.

**Optical edge alignment** — align to the *visual edge of the glyph*, not the bounding box. `W`
and `O` have different left visual edges from their bounding boxes; grid-aligned text should align
the ink, not the invisible box.

**Hanging punctuation** — opening quotation marks, bullet list markers, and leading dashes should
hang *outside* the text column (`text-indent: -1ch`), so the text block's left edge reads as a
clean vertical.

---

## Density pacing across a layout

A well-composed page is not uniformly dense or uniformly airy — it *moves* through densities. A
dense data section followed by breathing room before the next section creates rhythm that the eye
registers as editorial control.

**Density pacing:** plan the layout as a sequence of density zones — compact (data tables, lists),
comfortable (standard cards, body text), and open (hero, call-to-action, whitespace breaks). The
transitions between zones should be *intentional*, not accidental.

**Whitespace as structure** — negative space is not what's left after elements are placed; it is
*allocated* before elements are placed. A well-spaced layout reserves the whitespace first, then
fills it. This is why agent-generated layouts feel crowded: the agent places elements and leaves
the gaps, rather than designing the gaps.

**More whitespace than feels right** is usually the right call. The first instinct is always to
add more content; the craft move is to remove and breathe.

**Hero and opening composition — the anti-AI-default.** The opening composition of a surface
(the hero, the above-the-fold view) is the highest-leverage single composition decision. Open
with the *most characteristic thing* about the subject or the surface — the sharpest image, the
most specific claim, the most distinctive element — not the template. An agent-generated hero is
almost always: a generic headline, a subtitle, a centered CTA button, and a stock image. It is
not a bad design; it is not a *design at all*. The opening composition should feel chosen, not
defaulted into. One deliberate asymmetry, one concrete specific detail, one non-template
placement — these are the signals of a composed surface versus a generated one.

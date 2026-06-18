# The Optical Tells — what separates pro from amateur at a glance

> The type scale sets the structure; these details determine whether the structure reads as
> "designed" or "assembled." None of them are the agent's defaults. Tracking on display text,
> numerics in data columns, true small-caps, metrics-matched fallbacks — each is invisible when
> done right and immediately legible as "cheap" when absent.

---

## numerics — the agent's deepest blind spot

Controlled via `font-variant-numeric` (preferred, composable) with `font-feature-settings` as the low-level fallback. **Two orthogonal dimensions + several features.** Almost no generated code sets these; it is exactly what separates a "professional" data screen from an "amateur" one.

**Glyph height — lining vs oldstyle:**
- `lining-nums` — cap-height, sit on the baseline → UI, all-caps contexts, tables.
- `oldstyle-nums` — with ascenders/descenders, blend like lowercase → more elegant in running prose. The agent always reaches for lining; oldstyle in body text is the refined choice.

**Width — tabular vs proportional:**
- `tabular-nums` — every digit equal-width → columns align. **Force this on tables, prices, timers, and any number that updates in place** — otherwise width jitters as digits change (misaligned columns, clocks that jump).
- `proportional-nums` — natural widths (1 narrower than 0) → better in running prose.

**Other features:**
- `slashed-zero` — 0 with a slash, distinguishes it from O → mandatory for code, IDs, data displays.
- `diagonal-fractions` — renders a true ½, not 1/2.
- `ordinal` — true 1ˢᵗ superscript.
- `sups` / `subs` — true super/subscript, not a shrunk font-size.

Shorthand + fallback:
```css
font-variant-numeric: tabular-nums lining-nums slashed-zero;
/* low-level backstop where font-variant-numeric isn't supported: */
font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1;
```

Decision matrix:
```
tables / data / prices / live-updating  → tabular + lining
running prose                           → proportional + oldstyle (if the face has it)
code / IDs                              → tabular + lining + slashed-zero (often mono)
```

**Numeric alignment:** align numeric columns right + `tabular-nums` + align on the decimal point (`text-align: "."` is emerging; fall back to right-align / padding). Format content with `Intl.NumberFormat` for locale-correct grouping, currency, percent, and units — this is the bridge to i18n; never hand-roll separators.

---

## tracking — the inverse law

The face is designed for body size; override tracking only at the extremes, always in **`em`** (scales with the size; px breaks at any other size):

| level | tracking |
|---|---|
| display / large headings | **negative**: −0.01 to −0.04em (very large: to −0.05em) |
| body | ~0 (default) |
| small / caption | slightly positive: +0.01 to +0.02em |
| **all-caps / eyebrow / letter-spaced label** | **strongly positive**: +0.05 to +0.1em |

- Large sizes look too loose at default spacing → tighten.
- All-caps has no lowercase rhythm → needs to breathe.
- Mono/code keeps the default.
- Geometric sans and humanist sans have different natural spacing — the inverse law is the skeleton; tune the specific value per face and context.

---

## kerning & ligatures

- `font-kerning: normal` — pair spacing (AV, To, WA), critical at large sizes. This is the default in browsers but worth naming explicitly in font stacks that may inherit `none`.
- **Standard ligatures (`liga`):** fi, fl, ffi — repairs glyph collisions; keep on by default.
- **Contextual alternates (`calt`):** substitutes based on neighboring characters; usually on; drives script/handwriting connections.
- **Discretionary ligatures (`dlig`):** decorative (st, ct) — **display/editorial opt-in only**, not body text.
- **Code ligatures:** a deliberate choice — use a programming typeface that ships them, or turn them off explicitly. An accidental `liga` on a neutral mono face looks wrong.
- **Swash (`swsh`):** decorative entry/exit strokes — display-only; never body.

---

## true small-caps

`font-variant-caps: small-caps` — **never fake small-caps** (scaled-down capitals are too thin and light; they read as weak). Use for abbreviations in running text, eyebrow labels above headlines, and refined UI labels where all-caps would be too heavy.

Related values: `all-small-caps`, `petite-caps`, `unicase`. All require a face that actually contains the drawn glyphs — if the face lacks them, the browser falls back to scaled caps, which is the fake version you are trying to avoid. Check the font.

---

## stylesets & character variants

Many premium (and some free) typefaces hide their most distinctive forms behind OpenType styleset tags (`ss01`–`ss20`) or character variant tags (`cv01`+). Common examples: a single-story `a` (vs double-story), an alternate `g`, a different ampersand, a more ornate `R`. The agent never explores these.

Surface them via:
```css
font-variant-alternates: styleset(my-styleset);
/* with @font-feature-values .font-family { @styleset { my-styleset: 1; } } */
/* or directly: */
font-feature-settings: "ss01" 1;
```

Check the font's documentation or use a font inspector (Wakamai Fondue, Axis Praxis) to discover which features it ships.

---

## all-caps refinements

All-caps text needs two things the agent skips:

- **`case`** — lifts parentheses, brackets, and hyphens to vertical center-align (otherwise they hang too low, obviously wrong).
- **`cpsp`** (capitals spacing) or explicit `letter-spacing` — adds breath between uppercase glyphs. Use `em` units.

```css
.eyebrow {
  text-transform: uppercase;
  font-feature-settings: "case" 1, "cpsp" 1;
  letter-spacing: 0.06em;  /* fallback if cpsp absent */
}
```

---

## variable font axes as design tokens

Variable fonts expose continuous design axes beyond `font-weight`:

- `wdth` — character width. Use slightly narrower widths for dense data tables; wider for display.
- `opsz` — optical size, the type-scale-aware axis. Large sizes get the "display" cut (finer strokes, tighter fitting); small sizes get the "text" cut (sturdier, more open). `font-optical-sizing: auto` drives it automatically from `font-size`.
- `GRAD` (grade) — adjusts visual weight without changing character width, so no reflow. Use it on dark backgrounds to compensate for the perceptual thinning of strokes (dark-mode weight compensation without a font swap).
- `slnt` / `ital` — slant / italic.

These are design tokens too: `font-variation-settings: "wdth" 85` in a data-table token, `font-optical-sizing: auto` in every type role.

---

## quick reference (tokenizable / lintable)

| item | anchor |
|---|---|
| numerals width | tables/live-updating → `tabular-nums` (forced); prose → `proportional-nums` |
| numerals height | UI/tables → `lining-nums`; prose → `oldstyle-nums` |
| zero | `slashed-zero` for code/IDs/data |
| numeric format | `Intl.NumberFormat` — never hand-roll |
| tracking unit | `em` always; display negative / all-caps positive |
| ligatures | `liga`/`calt` on; `dlig`/`swsh` display-only; code ligatures deliberate |
| small-caps | `font-variant-caps: small-caps` — verify the face has the drawn glyphs |
| stylesets | explore `ss01–ss20` for the face's personality |
| all-caps | `case` + `cpsp` / letter-spacing |
| variable axes | `opsz: auto`; `GRAD` for dark-mode weight; `wdth` for density |

**Cross-links:** [type-scale-and-rhythm.md](type-scale-and-rhythm.md) — the scale these details layer onto; [internationalized-text.md](internationalized-text.md) — locale-aware number formatting via `Intl.NumberFormat`, language-form glyphs via `locl`.

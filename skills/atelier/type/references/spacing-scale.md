# Spacing Scale — the rem rhythm applied to space

> Spacing is not typography's neighbor — it *is* typography. The same rem-based rhythm that
> generates the type scale also generates the spacing scale, so headings, paragraphs, and gaps
> land on one consistent beat. The agent's tell: `padding: 13px`, `margin-top: 22px`, a
> different gutter per component — every value picked by eye, no two from the same system.

---

## one base unit, one scale

Pick **one base unit** and derive every gap, padding, and margin from it. Do not invent spacing values.

| base unit | fits |
|---|---|
| 4px (0.25rem) | dense, data-heavy, dashboard UI |
| 8px (0.5rem) | the common default for product apps |
| 16px / 24px step size | marketing / editorial (airier, content-led) |

Generate a small stepped set — typically **~7 named semantic steps** — by multiplying the base by a geometric or integer progression:

```
xs  = base × 0.5      (  2 / 4px  )   component-internal tight spacing
sm  = base × 1        (  4 / 8px  )   component-internal comfortable spacing
md  = base × 2        (  8 / 16px )   inter-element gap (label ↔ input, etc.)
lg  = base × 3        ( 12 / 24px )   section sub-divisions
xl  = base × 5        ( 20 / 40px )   section rhythm
2xl = base × 8        ( 32 / 64px )   major layout divisions
3xl = base × 13       ( 52 / 104px)   page-level margins, hero padding
```

(Exact multiples are a taste choice; what matters is that they form a coherent progression and that components reference the step names, not the raw values.)

The **role names are the tokens** — `var(--space-md)`, not `padding: 13px`. A spacing value not in the scale does not ship.

---

## the same rem rhythm as type

The spacing scale and the type scale ride on the same rem unit, so they **agree on a vertical baseline**. When `font-size: 1rem` = `16px` and `--space-md: 1rem`, a `line-height: 1.5` on body text yields a 24px line box — and `--space-lg` of 24px (`1.5rem`) is exactly one line's worth of breathing room. This is not coincidence; it is the system.

Practical consequence: **hold inter-element spacing to the line grid where possible.** Paragraphs, headings, and list items that land on the baseline rhythm feel composed; those that don't feel nudged by eye even when the pixel values are plausible.

---

## density is a single knob

**Compact vs airy is the base re-tuned once**, not a per-screen nudge. Define a `--space-base` custom property; a compact theme sets it to 4px, a default theme to 8px, an editorial theme to 12px or 16px. The scale multipliers remain constant — every step re-expresses itself automatically.

```css
:root                { --space-base: 0.5rem; }   /* 8px default */
[data-density=compact] { --space-base: 0.25rem; } /* 4px compact */
```

The agent's failure mode: adjusting individual `padding` values per component when the density changes — which is the scale maintained in N places. The density *is* the base; the base propagates.

---

## reference pattern — gap, padding, margin

Prefer **`gap`** (flex/grid) over margins for inter-element spacing — it sidesteps margin-collapse ambiguity and is layout-method-agnostic.

```css
.card          { padding: var(--space-md); }         /* internal breathing room */
.card + .card  { /* use gap on the container instead */ }
.section       { margin-block: var(--space-xl); }    /* vertical rhythm */
.form-group    { display: grid; gap: var(--space-sm); }
```

Use **logical properties** (`padding-inline`, `margin-block`, `inset-inline-start`) — they mirror for RTL for free.

Derive non-standard values arithmetically rather than inventing them:
```css
padding-inline: calc(var(--space-md) + var(--space-xs));  /* two steps added */
```

---

## auditing ad-hoc spacing

The most pervasive ad-hoc tell in real UIs is scattered magic spacing. On a retrofit, grep for literal `px` in spacing properties and cluster them:

- values in the 4–8px neighborhood → should be `xs`/`sm`
- values in the 12–16px neighborhood → should be `md`/`lg`
- anything odd (`13px`, `17px`, `22px`) → absorbed into the nearest step, not preserved

The inventory is not a deliverable to perfect; it is the raw material the gate consumes. The taste call — which base, which density — still belongs to the human.

---

## quick reference (tokenizable / lintable)

| item | anchor |
|---|---|
| base unit | 4px (dense UI) or 8px (default); all steps multiply it |
| step count | ~7 semantic roles (xs → 3xl); cap the set |
| unit | rem-based (same rhythm as type) |
| density | one `--space-base` token, not per-screen overrides |
| prefer | `gap` over margins; logical properties |
| no magic px | a spacing value not in the scale does not ship |
| derive | arithmetic with step tokens rather than new literal values |

**Cross-links:** [type-scale-and-rhythm.md](type-scale-and-rhythm.md) — the type scale this rhythm extends from; [internationalized-text.md](internationalized-text.md) — RTL layout shifts when physical spacing properties are used.

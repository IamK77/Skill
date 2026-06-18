# Data-Viz Color — perceptual uniformity, colorblind safety, and the palette types

> Data visualization has its own color rigor; UI palette rules do not transfer. An agent
> building a chart will reach for a rainbow, hand-pick a series of vivid hues, and convey
> meaning by color alone — failing perceptual uniformity, colorblind users, and accessibility
> in one move. This document covers the three palette types, how to construct each correctly,
> colorblind-safe strategies, the gray discipline, and tokenizing the viz palette.

---

## Why UI color rules don't transfer

In UI color, you spend color on brand and semantic signals across a small, known set of values. In data visualization:
- You may need to distinguish many series (not 4 semantics — 6, 8, or more categories)
- The data may be continuous (a sequential ramp for density or magnitude) or diverging (positive vs negative deviation from a midpoint)
- The color must encode *data* reliably, not just signal "primary / secondary / success"
- Users scan charts rapidly; misread color = misread data

A brand accent that works beautifully as a button CTA will pop out inappropriately as a chart series. A semantic red that clearly signals error will mislead when it's a neutral category in a chart. The viz palette is a separate tool in the same color system, built with different constraints.

---

## The three palette types — identify before building

The type of data determines the type of palette. Using the wrong type is a data-visualization error, not just a visual one.

**Decision tree:**

```
Is the data ordered?
    No  →  CATEGORICAL palette
    Yes →  Does it have a meaningful midpoint (zero, average, a threshold)?
               Yes  →  DIVERGING palette
               No   →  SEQUENTIAL palette
```

### Categorical — unordered classes

Use for: product lines, countries, device types, named entities — any set of discrete, unordered categories.

**Rules:**
- Maximum hue separation at **near-equal lightness and chroma** — so no one color dominates visually.
- Cap at **6–8 categories.** Beyond 8, human hue discrimination becomes unreliable. For more: introduce an "Other" category, use small multiples (one chart per series), or use direct labels instead of a shared legend.
- Leave enough luminance difference between categories to serve colorblind users (see below).
- The most prominent / brand-relevant color goes to the most important series.
- Honor domain conventions consistently: if series X has always been blue in the product, keep it blue.

**Construction in OKLCH:** pick 6–8 H values maximally spread (e.g., 30°, 80°, 140°, 200°, 250°, 300° — spacing depends on your brand hue). Set each to the same L (≈0.60–0.65) and C (≈0.16–0.18). This creates a family where no hue dominates and luminance is near-equal — the only robust categorical palette construction.

**Gold standard: Okabe-Ito 8-color (CVD-safe):**

| # | Name | Approx. hex | Notes |
|---|---|---|---|
| 1 | Black | #000000 | Anchors the series; surviving CVD |
| 2 | Orange | #E69F00 | |
| 3 | Sky blue | #56B4E9 | |
| 4 | Bluish green | #009E73 | |
| 5 | Yellow | #F0E442 | |
| 6 | Blue | #0072B2 | |
| 7 | Vermillion | #D55E00 | |
| 8 | Reddish purple | #CC79A7 | |

Okabe-Ito is designed to be distinguishable by deuteranopes, protanopes, and tritanopes — use it as the default categorical palette unless there is a strong brand reason not to.

### Sequential — ordered magnitude

Use for: density, population, temperature (in one direction), any "more/less" variable.

**Rules:**
- **Monotonic lightness** — lightness must increase or decrease consistently with the data value. This is non-negotiable; it is the only channel that communicates order reliably.
- **Single hue or multi-hue, both valid** — Viridis uses multiple hues (blue → green → yellow) but maintains strict lightness monotonicity. Single-hue is simpler; multi-hue can provide more visual range.
- Convention: **light = low value, dark = high value** (the bright-low convention aligns with natural luminance mapping on light backgrounds; some domains use dark = zero, bright = max — choose and stay consistent).

**Construction in OKLCH:** fix H (e.g., 250 for blue). Push L monotonically from 0.95 (near-white) to 0.25 (near-dark). Adjust C with a hump (0 at very light end, peak at mid, slight drop at dark end). This ensures equal data steps produce equal perceptual steps.

**Validated sequential palettes:** Viridis, Magma, Inferno, Plasma, Cividis (from d3-scale-chromatic). All are perceptually uniform and CVD-safe. Use them rather than building from scratch unless you need brand-specific hues.

### Diverging — meaningful midpoint

Use for: profit/loss, above/below average, positive/negative sentiment, anything where both sides of a central value matter distinctly.

**Rules:**
- Two sequential ramps meeting at a **neutral/light midpoint.**
- The midpoint must be **perceptually neutral** — a light gray or near-white, never a third saturated color. A saturated midpoint implies data values near the center are "intense" — wrong.
- The two ends must be **CVD-distinguishable** — they must differ in luminance, not only hue. Avoid red-green (the most common CVD combination). Use: **blue-orange, blue-red, or purple-green.**
- Common mistake: a red-green diverging palette for profit/loss. This is unreadable for ~8% of male users and a WCAG violation.

**Construction:** two OKLCH sequential ramps (e.g., blue at H=250 going from pale → rich; orange at H=65 going from pale → rich), meeting at oklch(0.92 0.005 H_neutral). Each ramp runs from the neutral midpoint outward.

**Choropleth binning (sequential and diverging).** Choropleth maps typically use 5–7 discrete bins rather than a continuous ramp — fewer bins are easier to read in a legend and decode in the map. The binning method changes perception: **quantile** (each bin contains equal counts) distributes color evenly but can obscure absolute distribution; **equal-interval** preserves absolute magnitude but produces uneven color distribution when data is skewed; **Jenks natural breaks** minimizes variance within classes and usually produces the most "honest" visual. Choose explicitly; don't default to quantile because it's the default in the library.

---

## Perceptual uniformity — why rainbow is banned

**Rainbow (jet) palette:** historically the default in MATLAB and early visualization tools. It is banned from serious data visualization because:
- **Not perceptually uniform.** The bright-yellow band at high values creates a false visual edge — the human eye reads a contour at that position even when no data contour exists. This misleads.
- **Not CVD-safe.** The red-green transition is invisible to deuteranopes.
- **Lightness is not monotonic.** The sequence includes both lightness increases and decreases, so it cannot reliably encode order.

Every one of these failures produces actual misinterpretation of data, not just poor aesthetics.

**What to use instead:**
- For **sequential:** Viridis (blue→green→yellow, monotonic, CVD-safe), Magma (dark purple→peach), Inferno (black→yellow), Cividis (modified for deuteranopia specifically)
- For **OKLCH custom:** fix H, push L monotonically from 0.95 → 0.25, adjust C with a hump — equal-step L guarantees equal perceptual steps

---

## Colorblind safety — mandatory, not optional

Color vision deficiency affects roughly 8% of men and 0.5% of women. In a typical user base, this is not an edge case.

**The worst offense in data visualization:** using red for profit/gain and green for loss/negative (or vice versa). Deuteranopes and protanopes cannot distinguish red from green at the same luminance — the most common form of CVD specifically breaks the most common data-viz convention.

**Three strategies — use all three:**

**1. Luminance difference.** Ensure categories differ in luminance, not only hue. Most CVD types preserve luminance sensitivity. A red (L=0.35) on a green (L=0.65) remains distinguishable to most deuteranopes because of the lightness difference.

**2. Redundant encoding.** Add a second visual channel alongside color:
- Different line styles (solid, dashed, dotted) for series in a line chart
- Different marker shapes (circle, square, triangle, diamond) for scatter plots
- Fill patterns (hatching, dots) for bar/area charts
- Direct labels colored to match the series (eliminates the need to decode a legend)

**3. CVD-safe palette selection.** Use Okabe-Ito for categorical; Viridis/Cividis for sequential; blue-orange or purple-green for diverging. These are engineered for CVD safety, not retrofitted.

**Testing:** Chrome DevTools > Rendering tab > Emulate vision deficiencies (deuteranopia, protanopia, tritanopia, achromatopsia). Stark plugin for Figma. Always verify the final chart, not just the palette in isolation.

---

## Gray is the most important color

The most effective data visualizations use color sparingly — as a *signal*, not as decoration.

**The discipline:** gray out every series and element that is not the point you are making. Color only the key insight. A chart with 8 vividly colored series gives the eye nowhere to land; the same chart with 7 gray series and 1 highlighted series immediately communicates the point.

**Where this applies:**
- Highlight a single time period or category in a large comparison
- Dimmed context lines in a small-multiples layout with one series highlighted per facet
- A gray sparkline for "others" with color only for the labeled outlier

**Direct labels beat legends.** A legend requires eye-travel (from chart → legend → back), color-memory (did I remember whether blue is product A or B?), and CVD tolerance. A direct label placed at the end of a line, colored to match the line, requires none of these. Where space allows, always prefer direct labels.

**Color is a weak quantitative channel.** For encoding precise magnitude, position and length are strong channels (bar length, y-position). Color is good for: category membership, qualitative secondary dimension, heatmap overviews. Never ask users to decode subtle color differences to read exact values — they cannot.

---

## Domain conventions — honor but make CVD-safe

Data visualization often operates in domains with established color conventions. These conventions exist because users already know them — overriding them forces re-learning and can produce mistakes (a user reading a "hot = blue" temperature chart after a lifetime of "hot = red").

**Honor conventions with CVD-safe alternatives or redundant encoding:**
- **Temperature maps:** hot = red/warm, cold = blue — the natural mental model. This is a legitimate red-blue diverging palette and is CVD-safe if luminance differs between ends.
- **Traffic lights (red-yellow-green):** widely understood, but red-green is the CVD minefield. Add redundant encoding (icons, text labels, position) or use orange-yellow-green for the 2/3 color version.
- **Profit/loss, positive/negative (green/red):** the most CVD-problematic convention. Mitigation: ensure the green and red have different luminances; add +/− icons or text; or shift to blue/orange for a more CVD-safe diverging pair while labeling clearly.

**Consistent product-wide mapping.** Whatever conventions you choose: series X is always color X throughout the product. Users build mental models from consistent series-color mapping; breaking it forces re-learning on every view. This is a system decision, not a per-chart aesthetic choice — hence tokenization (see below).

---

## Contrast in charts

Data marks must meet SC 1.4.11 (≥3:1 against adjacent background) to be accessible. This applies to:
- Bars against the plot background
- Line and point marks against the background
- Pie/donut segments against each other and adjacent background
- Map choropleth fill against adjacent fills

Gridlines and axes: use a low-contrast neutral (Lc≈25–30 against background) so they recede and the data marks remain primary. A chart where gridlines are as prominent as data marks is a contrast inversion.

**Dark charts:** do not invert. Raise L and drop C on all data marks (the same operation as dark-mode accent recoloring in UI); lighten gridlines proportionally. Design a separate dark viz palette alongside the light one, or construct it via formula from the light version.

**On light backgrounds:** avoid pure-saturated vivid colors directly on white — they vibrate. Slightly de-saturate or use high-L versions of accent hues for chart marks.

---

## Tokenizing the viz palette

The viz palette is part of the design system and must be tokenized and consistent product-wide. A series that is orange on the sales dashboard should be orange on the operations dashboard — users build mental models from the series-color mapping and breaking it forces re-learning.

**Token structure:**
```css
/* Categorical — 8 slots */
--viz-cat-1: oklch(0.62 0.18 250);  /* blue */
--viz-cat-2: oklch(0.62 0.17 65);   /* orange */
--viz-cat-3: oklch(0.62 0.16 150);  /* green */
--viz-cat-4: oklch(0.60 0.19 27);   /* red */
--viz-cat-5: oklch(0.62 0.17 300);  /* purple */
--viz-cat-6: oklch(0.62 0.15 190);  /* cyan */
--viz-cat-7: oklch(0.75 0.15 80);   /* amber */
--viz-cat-8: oklch(0.62 0.14 340);  /* pink */

/* Sequential ramp — 9 steps (low to high) */
--viz-seq-1: oklch(0.95 0.01 250);
--viz-seq-2: oklch(0.87 0.04 250);
--viz-seq-3: oklch(0.78 0.08 250);
--viz-seq-4: oklch(0.70 0.12 250);
--viz-seq-5: oklch(0.62 0.15 250);
--viz-seq-6: oklch(0.55 0.17 250);
--viz-seq-7: oklch(0.47 0.16 250);
--viz-seq-8: oklch(0.38 0.13 250);
--viz-seq-9: oklch(0.28 0.10 250);

/* Diverging ramp */
--viz-div-low: oklch(0.55 0.17 65);    /* negative end — orange (matches --viz-cat-2 and the blue-orange construction above) */
--viz-div-mid-low: oklch(0.75 0.08 65);
--viz-div-mid: oklch(0.94 0.004 250);  /* neutral midpoint — near-white */
--viz-div-mid-high: oklch(0.75 0.08 250);
--viz-div-high: oklch(0.55 0.18 250);  /* positive end — blue */

/* Emphasis color — for highlighting */
--viz-emphasis: oklch(0.55 0.18 250);  /* typically brand primary */
--viz-muted: oklch(0.75 0.008 250);    /* neutral gray for de-emphasized series */
```

Dark-mode viz tokens follow the same re-tuning rule as UI accent tokens: raise L by ~0.12–0.15, drop C by ~20–30%. Either provide a separate `[data-theme="dark"]` viz palette or construct it from the light tokens via relative color formula.

**Libraries:** `d3-scale-chromatic` ships Viridis, ColorBrewer, and Okabe-Ito as validated ready-to-use palettes. For custom palettes, use `d3.scaleSequential` with an OKLCH interpolator. `chroma.js` supports OKLCH interpolation directly.

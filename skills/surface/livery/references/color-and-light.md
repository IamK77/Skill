# Color and Light — encodable technique

> The technique behind livery's color gate. Taste picks the *system* (one brand hue, one
> neutral temperature, the contrast targets); the system then *derives* every value by formula.
> No ad-hoc hex — every visual color is a TOKEN computed from a small seed.

---

## Perceptual color spaces & why OKLCH

Pick the space by what it preserves:
- **sRGB / hex / rgb()** — device legacy, NOT perceptually uniform. Fine for a fixed known value, never for *generating* a system.
- **HSL / HSV** — cylindrical sRGB; its `L` is NOT perceptual lightness (at one L, yellow reads far brighter than blue — "the lightness lie"). Never build a palette in HSL; quick hue nudge only.
- **LAB / LCH** — perceptual, device-independent, but hue non-uniformity (blue shifts toward purple as L changes).
- **OKLAB / OKLCH** (Ottosson 2020) — fixes LAB's blue-purple shift and hue linearity. `oklch(L C H)`: **L** 0–1 perceptual lightness, **C** chroma (~0–0.4), **H** 0–360. The modern default.
- **Display-P3 / Rec2020** — wide gamut, via `color(display-p3 …)` or OKLCH.

Why OKLCH: (1) **uniform perceptual lightness** → same L is equally bright across hues, contrast predictable; (2) **independent hue rotation** → hold L+C, vary H, and accent/semantic colors sit at the same brightness (one family) — hex/HSL can't; (3) **L is a perceptual quantity** → reason about contrast and dark mode by arithmetic; (4) **better mixing** → interpolate in OKLAB/OKLCH to dodge sRGB's gray dead-zone and HSL's rainbow detour.

**Gamut:** OKLCH can name out-of-gamut colors → clamped/mapped, may shift. **Chroma ceiling varies with hue and L** (gamut is irregular); "max chroma" is always hue/L-dependent. `@supports` fallback for old browsers.

```
generate/maintain a palette, ramp, rotate hue, keep lightness consistent → oklch
mix two colors / gradient with no dead-gray midpoint, "straight through"  → oklab (rectangular)
gradient meant to travel the hue wheel                                    → oklch (long-way risk: set direction)
drop a known brand hex / one-off                                          → hex/rgb
beyond-sRGB vividness                                                     → oklch(P3) / color(display-p3 …)
```

**Derive, don't hand-pick:** relative color `oklch(from var(--brand) calc(l - 0.05) c h)` for states; mix `color-mix(in oklch, var(--brand) 80%, white)` for tints/shades. A few seeds + math generate the system.

---

## Building a neutral ramp with a temperature

**Pure gray (C=0) reads "default, lifeless."** Tint the whole ramp toward one hue.
- **Tint amount: C ≈ 0.005–0.03** — deliberate, not "colored."
- **Temperature is a taste choice, then held:** warm (H≈60–80, editorial/human) vs cool (H≈250, clean/tech). Pick ONE.
- **Endpoints carry the brand:** page bg off-white (not `#fff`); text-black a hue-tinted near-black (not `#000` — pure black reads like a "hole").

Ramp (~10–12 steps, named 50…950 Tailwind-style):
- **Perceptual L stepping, NOT linear-equal.** Surfaces, micro-fills, hairlines crowd into the **light end (L 0.9–1.0)** and need fine resolution → **denser at the light end**, sparser through mid/dark.
- Dark end may lift C slightly (deep neutrals hold more chroma without looking colored); light end near zero.

**Template (cool gray H=250; warm use H≈60–80):**

| token | oklch(L C H) | role | | token | oklch | role |
|---|---|---|---|---|---|---|
| 50  | 0.985 0.004 250 | page bg / off-white | | 500 | 0.600 0.016 250 | placeholder |
| 100 | 0.970 0.006 250 | subtle bg | | 600 | 0.500 0.016 250 | tertiary text |
| 200 | 0.920 0.008 250 | light border | | 700 | 0.420 0.014 250 | secondary text |
| 300 | 0.870 0.010 250 | border | | 800 | 0.300 0.012 250 | strong text |
| 400 | 0.710 0.014 250 | disabled / icon | | 900 | 0.220 0.010 250 | primary text |
| | | | | 950 | 0.160 0.010 250 | heading / near-black |

Calibrate as **pairs**: 900-on-50 hits primary-text Lc, 700-on-50 hits secondary-text Lc. Surfaces step along the ramp; borders/hairlines take low-C mid/near-bottom steps.

---

## The accent ramp & semantic role tokens

**Accent ramp** — full 50–950 so you get light tint (bg/hover fill) → base → dark shade (text-on-light/pressed). **L is a slope** (light→dark); **C is a "hump"** — extremes can't hold high chroma (gamut narrows + perception rejects it), so C peaks mid (**500–600**). **Base (500/600)** at usable mid L (≈0.6), high C — primary buttons, links.

**Template (H=250 blue):** 50 `0.97 0.02` tint/selected · 100 `0.93 0.04` · 200 `0.88 0.07` hover/border · 300 `0.80 0.11` · 400 `0.70 0.15` · 500 `0.62 0.18` **base** · 600 `0.55 0.18` button · 700 `0.48 0.16` active/text-on-light · 800 `0.40 0.13` · 900 `0.32 0.10` · 950 `0.25 0.07` (all H=250).

**States = same hue, L deltas, never a fresh color.** hover: base − L ~0.03–0.05 (or next-darker tint for fills); active: − ~0.06–0.08, optionally drop C; focus: base for the dual ring; disabled: drop C toward neutral + raise L (or just neutral). Compute: `oklch(from var(--accent) calc(l - 0.04) c h)`. Accent tints: high-L low-C accent (50/100); text on it = accent-700/800 on accent-50, or white on accent-600 — check Lc.

**Semantic colors — consistency trick: same L, near-same C, differ only in H** (one family, not four random saturations):

| semantic | oklch | semantic | oklch |
|---|---|---|---|
| success (green) | 0.62 0.16 150 | error (red) | 0.60 0.19 27 |
| warning (amber) | 0.75 0.15 80 | info (blue) | 0.62 0.17 240 (≈accent if brand blue) |

**Yellow problem:** yellow/green look brighter at a given L, read harder as text/on white, and yellow's max chroma sits higher → warning skews **amber/orange (H≈70–80)**, and as text **press to L≈0.55**. Each semantic gets its own ramp (same slope/hump) for base, light tint (banner bg), dark (text on tint).

**Three-layer token architecture** (makes theming a re-map, not a recolor): (1) **raw/ramp** `--blue-500`, `--neutral-100` (the OKLCH scales, theme-agnostic); (2) **semantic/alias** `--color-text-primary`, `--color-surface`, `--color-border`, `--color-primary`, `--color-success-bg` → raw steps, **re-pointed per theme**; (3) **component** `--button-bg` → semantic. **Components consume only semantic tokens, never raw/hex.** Theme switch = edit the alias mapping. Agents default to hardcoding; the system forbids it.

---

## Contrast at design time — WCAG numbers & APCA

**Never pure black on pure white** — harsh, glares, characters "vibrate," eye fatigue. Text-black = deep neutral **L ≈ 0.15–0.25** (~#1a1a1a–#222); large bg = off-white **L ≈ 0.97–0.99**.

**Contrast is a hierarchy, not one number** — map roles to neutral steps:

| role | approx ratio | APCA Lc |
|---|---|---|
| primary text | ~12–16:1 | 90 |
| secondary text | ~7:1 | 75 |
| tertiary / muted | ~4.5:1 | 60 |
| placeholder / disabled | ~3:1 (disabled exempt, not invisible) | — |

**#1 trap:** secondary text dialed to pale gray "for elegance" — an aesthetic crutch and usually a flat WCAG failure. Low-contrast gray text is the universal designer bug.

**WCAG 2 — the legal floor + defects:** ratio floors body **4.5:1**, large (≥24px or ≥18.66px bold) **3:1**, **UI components/graphics 3:1** (SC 1.4.11), AAA 7:1/4.5:1. Math `(L1+0.05)/(L2+0.05)`, L=relative luminance. Defects: simple luminance ratio → **overstates dark-mode contrast**, ignores weight/size, **symmetric** (ignores text-vs-bg polarity). Pure white/black scores 21:1 yet reads painfully high.

**APCA (WCAG 3 draft) — perceptually correct:** models **polarity + weight + size** → **Lc** (~−108…+108; + = dark-on-light, − = light-on-dark). **Lc targets:** **90** body preferred/small-thin · **75** body min/columns · **60** large/headings (~24px+) min · **45** non-text/UI or large-bold · **30** any non-text that must be visible · **15** invisibility threshold. **Requirement is bound to size × weight** — fine text needs much higher Lc. **Decision:** WCAG 2 = enforced legal floor; APCA = make it actually read right (dark mode, fine text). On conflict APCA is truer; satisfy both where possible.

**Comfort band — max contrast ≠ best:** there's a lower bound (a11y) AND an optimal band; pure B/W (21:1) is past optimum into glare. Disabled is intentionally low (exempt) but not invisible to everyone.

**Non-text contrast (forgotten):** input borders, icons, focus rings, chart marks, status indicators need **≥3:1** vs adjacent (1.4.11). Agents make borders too pale → inputs vanish. Focus = real contrast (dual ring).

**Color-blindness:** ~8% of men. **WCAG 1.4.1: never convey by color alone** — add luminance difference, icons, labels, patterns. **Luminance contrast survives most CVD; hue difference does not — luminance is the robust channel.** Test with deutan/protan/tritan simulators.

---

## Dark theme as a re-tuned ramp, not invert()

**Dark ≠ inversion** (not `filter: invert()`, not a B/W swap) — a separately designed theme:
- **Dark bg = deep gray L 0.12–0.18, not pure black** (pure black → halation, no elevation). Material ~#121212.
- **Elevation = brighter surface** (each layer higher L), NOT deeper shadow (shadows nearly vanish on dark); a top-edge highlight carries more. Mechanism: Material's **elevation overlay** = stack increasing white-transparency per level, or design a dark surface ramp (darkest base, each layer higher L).
- **Text = off-white L 0.85–0.92, not pure white** (halation); **drop chroma of bright text** to reduce bloom.
- **Accent/semantic on dark: raise L to ~0.70–0.75, drop C ~20–30%** (saturated mid-L vibrates on dark). e.g. `oklch(0.72 0.14 250)`.
- **Tint bgs go dark:** banner bg → low-L low-C version (dark success ≈ deep green L~0.25), not a light tint.
- **Re-point steps:** light links use accent-600; dark uses accent-300/400. Overall contrast eases slightly.

This is **all alias re-mapping** in the `[data-theme]` scope, never inverting raw values.

---

## Dark-theme engineering (the agent blind spot)

- **Three states: light / dark / system** (respect `prefers-color-scheme`, allow override) — not a binary toggle.
- **Zero-JS baseline:** `@media (prefers-color-scheme: dark)` redefines semantic tokens. Cascade for override:
  ```
  :root { /* light */ }
  @media (prefers-color-scheme: dark){ :root { /* dark */ } }
  [data-theme="light"]{ } [data-theme="dark"]{ }   /* forced */
  ```
- **Modern:** `color: light-dark(lightVal, darkVal)` + `color-scheme`. **`color-scheme: light dark` (almost always forgotten):** renders **native UI** (form controls, scrollbars) per theme — without it they stay light in dark mode.
- **FOUC fix:** theme read from localStorage *after* render flashes light→dark. Put a **blocking inline script in `<head>`** setting `[data-theme]` before first paint. **SSR:** store the preference in a **cookie** the server can read for a correct first paint.
- **Persist + sync:** localStorage (or cookie for SSR); cross-tab via `storage` event; system mode follows live via `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)`.
- **Transition trap:** `* { transition: background-color .3s }` animates every element on every switch/interaction — janky. Add a temporary scoped class then remove it, or use the **View Transitions API**. Respect `prefers-reduced-motion`.
- **Must adapt:** colors→tokens · shadows→brighter surface + top highlight · images→dark variants, transparent-PNG fringe · gradients→retuned · charts→recolor + lighten gridlines · code→dark syntax · maps/embeds→dark tiles · logo→two versions · `color-scheme`→native controls · `<meta name="theme-color">`→mobile chrome · favicon (optional).
- **a11y:** contrast still passes — **dark is where WCAG 2 overstates, so use APCA (polarity)**; off-white-not-white is itself a win; some astigmatic users find dark *harder* → **offer both, respect system, never force dark**; don't push below threshold "for softness."
- **Governance:** visual-regression every component in **both themes** (test mapping + a few components, not every color); **lint: forbid hardcoded colors**, every semantic token has a value in both themes. >2 themes extend the same architecture.

---

## Data-viz color: sequential / diverging / categorical + colorblind-safety

UI rules don't transfer; data-viz has its own rigor.

**Three palette types:** **categorical** (unordered — max-distinguishable **hue**, no implied order, **cap ~6–8**); **sequential** (ordered low→high — single hue, **monotonic lightness**, light=low/dark=high consistently); **diverging** (meaningful midpoint — two hues meet at a **neutral/light midpoint**, push outward). Tree: ordered? no→categorical · yes + meaningful mid→diverging · yes + one direction→sequential.

**Perceptual uniformity:** **rainbow/jet are banned** — not uniform; the bright-yellow band makes false boundaries, misleads, not CVD-safe. Use **Viridis / Magma / Inferno / Plasma / Cividis**, or an OKLCH monotonic uniform lightness ramp (equal data step = equal perceptual step). **Lightness is the magnitude channel** (read far more reliably than hue) → sequential = lightness ramp; categorical = hue variation at *near-equal* lightness. OKLCH sequential: fix H, push L monotonically (adjust C).

**Color-blindness (mandatory):** ~8% of men, red-green most common. **Red=profit/green=loss is the worst offense.** Add luminance difference (survives CVD); **redundant encoding** (shape/pattern/texture/direct label); CVD-safe palettes — **Okabe-Ito 8-color is the categorical gold standard**, plus Viridis & ColorBrewer CVD-safe. **Test with simulators.** Diverging: **avoid red-green**, use blue-orange / blue-red / purple-green.

**Categorical construction:** cap ~6–8 (else "other" bucket / small multiples / direct labels); max hue separation at near-equal lightness/chroma (no one bright color dominates) but leave luminance difference for CVD; honor brand/convention colors consistently; give the key series the most prominent color.

**Domain conventions:** honor but make CVD-safe — temperature (hot=red/warm-cold=blue), traffic-light (red-yellow-green, *has* CVD problem), profit/loss (green/red, CVD problem → add +/− or position); keep the mapping consistent product-wide (series X always one color).

**Sequential/diverging construction:** sequential single-hue monotonic lightness (multi-hue fine if lightness monotonic — Viridis blue→green→yellow); diverging = two ramps meeting at a **light/neutral midpoint (pale gray/near-white, NOT a third saturated color)**, ends CVD-distinguishable. Choropleth ~5–7 bins; classification (quantile/equal-interval/Jenks) changes perception.

**"Gray is the most important color":** **gray everything un-emphasized; color only the point** — color is scarce, spend it on signal. Don't color everything (no hierarchy, eye lost). **Direct labels > legend** (tint label = line color, kill the round-trip).

**Color is a weak quantitative channel:** encode precise magnitude by **position/length** (strong); color for category / secondary dimension / heatmap overview — never decode subtle color for exact values.

**Contrast & bg:** marks vs plot bg ≥3:1 (1.4.11); gridlines/axes low-contrast neutral to recede; on white soften pure-saturated vibration. **Dark charts not inverted** — recolor (raise L, drop C); lighten gridlines.

**a11y beyond CVD:** provide a **text alternative / data table** (color is invisible to screen readers — the *data* must be obtainable non-visually); marks large enough; never color alone.

**Implementation:** build uniform palettes in OKLCH or use validated (Viridis, ColorBrewer, Okabe-Ito, Tableau 10). **Tokenize** categorical-1..8, sequential ramp, diverging ramp — consistent product-wide. Libraries: d3-scale-chromatic, ColorBrewer.

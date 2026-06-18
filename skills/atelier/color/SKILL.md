---
name: color
description: >
  The color & light lens for a frontend build — where the palette gets its perceptual
  foundation, dark mode gets its re-tuned ramp, contrast gets verified, and data-viz gets
  a rigorous scale. Use when establishing a color system from scratch, auditing an existing
  palette for coherence or accessibility failures, designing a dark theme, or building a
  data visualization. The one shift: every color is a TOKEN in a perceptual system (oklch),
  dark is a re-tuned ramp (never invert()), and contrast is verified at DESIGN time — the
  agent emits plausible-but-incoherent hexes and feels no wrongness, so the palette must be
  a DECIDED system. Triggers on "color palette / oklch / perceptual color", "dark mode /
  dark theme / re-tuned ramp", "contrast / WCAG / APCA / accessibility", "semantic colors /
  tokens / color system", "data visualization color / colorblind / sequential / diverging /
  categorical", "neutral ramp / temperature / gray", "make the colors work / feel right /
  coherent palette".
argument-hint: "[the UI / design system / data visualization to give a coherent color language]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# color

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An atelier (a craftsman's studio) is named for the discipline of the hand — careful, deliberate, derived. `color` is the color & light lens of the `atelier` suite: where the other skills decide *what is true* and *what is composed*, `color` decides *what every hue, tone, and value actually is* — and makes that a **system**, not a scatter of hand-picked hexes. Its product is a **tokenized color system**: a perceptual neutral ramp with a chosen temperature, semantic role tokens mapped to that ramp, a correctly engineered dark theme, contrast verified at design time, and a data-viz scale engineered for perceptual uniformity and colorblind safety — each committed *before* components consume it. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: color coherence is not a matter of taste applied per component — it is a matter of deriving every value from a small, decided system.** The same blue typed as `#2563eb` in one component and `#2f6ae0` in another, a neutral gray that is just `#888888`, a dark mode that runs `filter: invert()`, a data viz that uses a stock rainbow — each is a hand-picked value, and their sum is the perceptual incoherence the eye reads as "off" without being able to name it. The craft is the same subtraction the suite preaches everywhere: **define a small system (one perceptual space, one neutral temperature, a handful of semantic roles, one contrast target), then derive every concrete value from it.** Do that and two things happen — the palette becomes *coherent* (a thousand component colors agree because they came from ten tokens), and it becomes *evolvable* (dark mode, re-theme, or rebrand by remapping the alias layer, not finding-and-replacing scattered hex).

This is where the agent era bites:
- **The agent picks plausible-but-incoherent values and feels no wrongness.** It will emit `oklch(0.62 0.18 250)` as a primary blue and `oklch(0.60 0.17 248)` for success green — close enough to look intentional, wrong enough to read as undesigned. It has no nervous system to flinch at a secondary text color that fails WCAG. **The values must come from a decided system, not per-call taste.**
- **The agent reaches for the cheap trick.** Dark mode by `filter: invert()`, a rainbow palette for a data series, `color: gray` for disabled, `border-color: #ccc` per component. Each is the move that *looks* like the craft and isn't.
- **The agent maintains two sources of truth without noticing.** It defines `--color-primary: oklch(0.62 0.18 250)` in CSS and then hardcodes `color: '#2563eb'` in a React inline style — two palettes, one in each language, that will silently drift. The design system is itself state; it gets one source of truth (see `atelier:systems`).

**Speak the user's language.** The decisions are the user's — which neutral temperature (warm / cool / brand-tinted), which accent hue, what the contrast targets are, whether the surface skews editorial or product. Read their fluency and gloss a term on first use (*perceptual color* / *oklch*, *neutral ramp*, *semantic token*, *alias layer*, *contrast ratio* / *APCA Lc*, *colorblind-safe* / *CVD*). A token system the user can't read is a palette imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- [references/color-spaces-and-neutrals.md](references/color-spaces-and-neutrals.md) — why oklch (perceptual uniformity, independent hue rotation, L is a perceptual quantity), the color-space decision tree, gamut and fallbacks, the neutral ramp with a temperature, surface and endpoint strategy.
- [references/oklch-palette-recipes.md](references/oklch-palette-recipes.md) — the full 8-step recipe: accent ramp (L slope, C hump), state derivation (relative color), semantic color family (same L/C, differ only in H), three-layer token architecture, dark ramp derivation (raise L, drop C, remap alias), contrast calibration.
- [references/contrast-and-bw.md](references/contrast-and-bw.md) — why not pure black/white (halation, eye fatigue), contrast as a hierarchy (primary / secondary / tertiary / disabled), WCAG 2 as the legal floor (4.5:1 / 3:1 / 3:1), APCA Lc as the perceptually correct model (Lc bound to size × weight), non-text contrast (borders, icons, focus rings), colorblindness, the comfort band.
- [references/dark-theme-engineering.md](references/dark-theme-engineering.md) — dark is a re-tuned ramp (not invert): deep-gray base, elevation by lighter surface, off-white text, de-saturated accents. Token architecture, three-state switching (light/dark/system), FOUC prevention, persistence + cross-tab sync, transition traps, the full adaptation checklist (shadows, images, gradients, charts, native controls), governance.
- [references/data-viz-color.md](references/data-viz-color.md) — the three palette types (categorical / sequential / diverging), perceptual uniformity (rainbow banned, Viridis, OKLCH monotonic ramp), colorblind-safe construction (Okabe-Ito, redundant encoding), categorical cap (~6–8), sequential and diverging construction, gray as the most important color, contrast in charts, dark chart recoloring, tokenizing the viz palette.

> **The arc is one perceptual color system.** Four stages — ramp & roles · dark ramp · contrast · data-viz — turn a scatter of hexes into a coherent, accessible, evolvable palette: STAGE 0 commits the neutral ramp and semantic tokens before any component touches a color; STAGE 1 re-tunes that ramp for dark without inversion; STAGE 2 verifies every text/background pair at design time; STAGE 3 builds the data-viz scale with rigor. `color` gates all four; it runs before components are colored and its token system is what `atelier:systems` later governs as a living artifact.

> **Greenfield or retrofit? Decide the entry, not a new stage.** Most real work is not a blank canvas — it is a codebase thick with `#3B82F6`, `border: 1px solid #e5e7eb`, `color: rgba(0,0,0,0.45)`, and a dark mode toggle that sets `background: #1a1a1a` inline. The four stages are the same; only the entrance differs. If starting clean, walk STAGE 0→3 in order. If a surface already exists, do one pass first: **inventory the ad-hoc color values** — every magic hex, every inline color, every duplicate — and cluster them into the systems the stages will own (neutrals · accent · semantics · contrast targets · viz palette). The inventory is the raw material each gate consumes, not a deliverable to perfect. Bring the inventory to STAGE 0 and the gates run unchanged.

---

## STAGE 0 — Perceptual ramp & semantic roles

Open **[references/color-spaces-and-neutrals.md](references/color-spaces-and-neutrals.md)** and **[references/oklch-palette-recipes.md](references/oklch-palette-recipes.md)**. Build the color system *before* coloring any component.

- **Build in oklch, as tokens.** Define the system in **oklch** (lightness and chroma independent, steps perceptually even), not scattered hex: a neutral ramp (~10–12 steps, 50…950) built on purpose (a chosen temperature/hue, not pure C=0 gray), plus an accent ramp (L slope + C hump, peak at 500–600), plus the four semantic colors — all using the same L and near-same C, differing only in H, so they read as one family.
- **Semantic role tokens (the alias layer).** Map semantic aliases (`--color-text-primary`, `--color-surface`, `--color-border`, `--color-primary`, `--color-success-bg`, …) onto the ramp steps. Components consume *only* the alias layer — never a raw ramp step, never a hex. Theme switch = edit the alias mapping; component code unchanged. The three-layer architecture: raw/ramp → semantic/alias → component.
- **State derivation by formula.** hover: `oklch(from var(--accent) calc(l - 0.04) c h)` — same hue, L delta. Never a fresh color per state. disabled: drop C toward neutral + raise L. focus: base color for the dual ring (verify contrast).
- **The yellow problem.** Warning/amber lives at H≈70–80 (not yellow H≈95) and needs L pressed to ≈0.55 when used as text — yellow at the same L as the other semantics reads harder and can fail contrast. Encode this into the warning semantic token, not patched later.

### GATE — clear before DARK
1. `checklist check ramp-and-roles neutral-ramp-in-oklch-with-temperature`
2. `checklist check ramp-and-roles accent-and-semantic-family-as-tokens`
3. `checklist verify ramp-and-roles`

---

## STAGE 1 — Dark as a re-tuned ramp

Open **[references/dark-theme-engineering.md](references/dark-theme-engineering.md)**. Dark mode is a design decision, not a filter.

- **Dark is not invert.** Dark base ≈ `oklch(0.14 0.008 250)` (deep gray, not `#000`); text ≈ `oklch(0.88 0.006 250)` (off-white, not `#fff`). Elevation = lighter surface per layer (not deeper shadow — shadows nearly vanish on dark). Accents: raise L to ~0.70–0.75, drop C ~20–30% (saturated mid-L colors vibrate on dark backgrounds).
- **Remap the alias layer, not the ramp.** The raw ramp stays fixed; the alias tokens (`--color-surface`, `--color-text-primary`, `--color-primary`, …) get different ramp steps assigned in the `[data-theme="dark"]` scope (or `@media (prefers-color-scheme: dark)`). Light mode uses accent-600 as a link; dark mode uses accent-300/400. This is alias remapping, not color inversion.
- **Three-state switching** (light / dark / system) with a zero-JS baseline (`@media` redefines tokens) and a `[data-theme]` override. **`color-scheme: light dark`** — almost always forgotten; tells the browser to render native form controls and scrollbars per theme.
- **FOUC prevention.** Blocking inline script in `<head>` reads `localStorage` and sets `[data-theme]` before first paint. SSR: store theme preference in a cookie the server reads for a correct first paint.
- **Full adaptation checklist.** Colors alone are not enough — also adapt: shadows (top-edge highlight replaces depth shadow), images (dark variants, transparent PNG fringe), gradients (re-tuned), charts (recolored, lighter gridlines), code highlighting, logo (two versions), `<meta name="theme-color">`, native controls via `color-scheme`.

### GATE — clear before CONTRAST
1. `checklist check dark-ramp dark-ramp-re-tuned-not-inverted`
2. `checklist check dark-ramp three-state-switching-and-fouc`
3. `checklist verify dark-ramp`

---

## STAGE 2 — Contrast at design time

Open **[references/contrast-and-bw.md](references/contrast-and-bw.md)**. Contrast is a design decision, not an audit finding.

- **Never pure black on pure white.** Text-black: `oklch(0.20 0.010 250)` (L≈0.15–0.25, not #000); large bg: off-white (L≈0.97–0.99, not #fff). Both carry the neutral hue tint — even black and white are branded.
- **Contrast is a hierarchy, not one number.** Map roles to neutral steps: primary text ~12–16:1 / Lc 90 · secondary text ~7:1 / Lc 75 · tertiary ~4.5:1 / Lc 60 · placeholder/disabled ~3:1 (exempt, not invisible). The single most common failure: secondary text dialed to pale gray "for elegance" — an aesthetic crutch and usually a WCAG failure.
- **WCAG 2 is the legal floor; APCA is the perceptually correct model.** WCAG 2: body 4.5:1, large (≥24px or ≥18.66px bold) 3:1, UI components/graphics 3:1 (SC 1.4.11). APCA Lc is bound to size × weight — fine text needs much higher Lc than large-bold text; this is the precision model, especially for dark mode where WCAG 2 systematically overstates contrast (ignores polarity).
- **Non-text contrast is not optional.** Input borders, icons, focus rings, chart marks, status indicators: ≥3:1 against adjacent color (SC 1.4.11). Agents make borders too pale — inputs vanish. Focus rings: dual ring, real contrast.
- **Verify at design time in the token system.** Calibrate the ramp as pairs (step-900 on step-50 for primary text, step-700 on step-50 for secondary, …) so contrast is structural, not patched per component. If a pair fails, move which step the alias points to — never nudge a raw ramp value to pass one test.
- **Colorblindness: luminance is the robust channel.** ~8% of men. WCAG 1.4.1: never convey information by color alone. Luminance contrast survives most CVD; hue difference does not. Test with deutan/protan/tritan simulators.

### GATE — clear before DATA-VIZ
1. `checklist check contrast contrast-hierarchy-verified-at-design-time`
2. `checklist check contrast non-text-contrast-and-cvd`
3. `checklist verify contrast`

---

## STAGE 3 — Data-viz & semantic color

Open **[references/data-viz-color.md](references/data-viz-color.md)**. Data visualization has its own color rigor; UI palette rules do not transfer.

- **Identify the palette type first.** Three types, each a different construction: **categorical** (unordered, max hue separation at near-equal lightness, cap ~6–8); **sequential** (ordered, monotonic lightness ramp, single hue or multi-hue if lightness stays monotonic); **diverging** (meaningful midpoint, two sequential ramps meeting at a *light/neutral* midpoint — not a third saturated color). Decision tree: ordered? no → categorical. yes + meaningful midpoint → diverging. yes + one direction → sequential.
- **Rainbow is banned.** Not perceptually uniform, not CVD-safe, the bright-yellow band creates false boundaries. Use Viridis / Magma / Inferno / Plasma / Cividis, or an OKLCH monotonic ramp (fix H, push L monotonically, adjust C). Lightness is the magnitude channel — encode quantity with lightness, not hue.
- **Colorblind-safe by construction, not by luck.** Okabe-Ito 8-color is the categorical gold standard. Diverging: avoid red-green, use blue-orange / blue-red / purple-green. Redundant encoding (shape, pattern, texture, direct label) alongside color — color alone never carries meaning.
- **Gray is the most important color.** Gray out everything un-emphasized; spend color only on signal. Direct labels (label colored like the line it names) beat legends.
- **Tokenize the viz palette.** `--viz-categorical-1` through `--viz-categorical-8`, `--viz-sequential-{1..9}`, `--viz-diverging-{low|mid|high}` — consistent product-wide, so the same series always wears the same color. Chart marks vs plot background: ≥3:1 (SC 1.4.11). On dark: recolor (raise L, drop C), do not invert.
- **Accessibility beyond CVD.** Provide a text alternative or data table — color is invisible to screen readers; the *data* must be obtainable non-visually. Mark size matters; do not encode meaning by color alone.

### FINAL GATE
1. `checklist check data-viz data-viz-palette-perceptually-uniform-cvd-safe-and-tokenized`
2. `checklist verify data-viz`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`color` is the suite's **perceptual conscience** — the place where the claim that *the agent picks plausible-but-incoherent values* finally gets a gate. It runs before any component is colored, and its token system is what `atelier:systems` later governs as a living artifact and what `atelier:canon` uses as a quantified commitment ("contrast target: Lc 75 on body text, Lc 60 on headings, dark base L≈0.14"). The through-line is the suite's own — *push correctness into structure* — applied to color: a value derived from a system can't drift the way a hand-picked one can, so palette coherence becomes structural rather than maintained by vigilance. The line that keeps `color` honest inside a suite that says "the correct isn't in a document": **the document holds the encodable technique (how oklch works, how APCA Lc is bound to size and weight, how a CVD-safe categorical palette is constructed); the taste — which temperature, which accent hue, what the contrast hierarchy actually is — stays a gate the user clears.** Blur that line and the skill becomes a recipe book; hold it and it stays a lens.

## Anti-patterns (use as a pre-flight checklist)

- **Magic hex in components** — any color literal that isn't a token reference is entropy. The first place coherence dies is `color: #2563eb` in a button file and `background: #2f6ae0` in a badge.
- **Pure gray neutrals (C=0)** — pure gray reads "default, lifeless." Pick a temperature (warm H≈60–80 or cool H≈250), commit it, hold it across the whole ramp.
- **Dark mode by `filter: invert()`** — it's a re-tuned ramp (deep gray base, off-white text, de-saturated accents, elevation by lighter surface), not a filter.
- **Contrast verified after the fact** — calibrate the ramp as pairs at design time; if a pair fails, move which alias step it points to, don't patch a single component.
- **Secondary text dialed to pale gray "for elegance"** — the most common WCAG failure. Low-contrast gray text is the universal designer bug.
- **Forgotten non-text contrast** — input borders, icons, focus rings, chart marks need ≥3:1 (SC 1.4.11).
- **Semantic colors that don't form a family** — each semantic at its own random saturation. Same L, near-same C, differ only in H — that is one family.
- **Warning yellow at standard L** — yellow/green reads brighter at a given oklch L; push warning to amber (H≈70–80) and press L to ≈0.55 for text.
- **States as fresh colors** — hover/active/focus/disabled are L deltas on the same hue, computed by formula, not four new hexes.
- **The palette in two languages** — `--color-primary` in CSS and `primaryColor: '#2563eb'` in a JS config are two sources of truth that will drift; pick one and derive the other (see `atelier:systems`).
- **Rainbow for data-viz** — not perceptually uniform, not CVD-safe. Banned. Use Viridis / Okabe-Ito / an OKLCH monotonic ramp.
- **Color alone carrying meaning in a chart** — luminance is the robust channel; add redundant encoding (shape, pattern, label) so CVD users and screen readers can use the data.
- **Dark charts by inversion** — recolor for dark (raise L, drop C, lighten gridlines); do not invert.
- **Skipping a GATE** — every color value must trace to a token, every token to a ramp step, every ramp step to the decided system. If it doesn't trace, you picked it by hand.

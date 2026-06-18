# OKLCH Palette Recipes — from one brand hue to a full system

> The complete 8-step recipe: accent ramp, state derivation, semantic color family,
> three-layer token architecture, contrast calibration, and dark ramp derivation.
> The companion to color-spaces-and-neutrals.md — that document builds the neutral
> foundation; this document builds everything else.

---

## The 8-step recipe overview

```
1. Choose H_brand (one hue number) + neutral temperature (H_neutral, C ≈ 0.005–0.03)
2. Build the neutral ramp (see color-spaces-and-neutrals.md)
3. Build the accent ramp (H_brand, L slope, C hump)
4. Derive the four semantic colors (same L/C as accent base, only H differs)
5. Calibrate key pairs against contrast targets (Lc / WCAG)
6. Commit semantic alias tokens (light theme) → mapped to ramp steps
7. Derive the dark ramp (raise L, drop C, remap aliases — never invert)
8. Wire states via relative color (L delta formula, not hand-picked)
```

---

## The accent ramp

A single brand hue generates a full 50–950 scale so every interaction state — light tint for selected/hover fills, base for buttons/links, darker shade for pressed states and text-on-light — draws from the same ramp rather than requiring invented values.

**Two structural rules:**
- **L is a slope** — the ramp runs from high L (near-white at 50) to low L (near-black at 950).
- **C is a "hump"** — the near-white and near-black ends cannot hold high chroma (the sRGB gamut narrows and perception rejects extreme chroma at extremes of lightness), so C peaks in the middle (steps 500–600) and tapers at both ends.

**Template (H=250 blue; substitute your brand H throughout):**

| Token | oklch(L C H) | Primary use |
|---|---|---|
| 50  | 0.97 0.02 250 | Lightest tint — selected row bg, info banner bg |
| 100 | 0.93 0.04 250 | Subtle tint |
| 200 | 0.88 0.07 250 | Hover tint fill, accent border |
| 300 | 0.80 0.11 250 | |
| 400 | 0.70 0.15 250 | |
| 500 | 0.62 0.18 250 | **Base color** — primary link, focus ring |
| 600 | 0.55 0.18 250 | Primary button, stronger emphasis |
| 700 | 0.48 0.16 250 | Active/pressed state; text on accent-50 |
| 800 | 0.40 0.13 250 | |
| 900 | 0.32 0.10 250 | |
| 950 | 0.25 0.07 250 | Deepest shade |

**Base at 500 or 600?** Both are valid — 500 (L≈0.62) is slightly lighter, better for links on white backgrounds; 600 (L≈0.55) is slightly darker, better for filled button backgrounds. Check contrast at STAGE 2 — white text on 600 should clear Lc≈75.

---

## State derivation — formula, not hand-picking

States are **L deltas on the same hue**. An agent left to its own devices picks a hover color, an active color, a focus color, and a disabled color — four hand-picked values that don't relate to each other or to the base. The system derives:

```css
/* Hover: base accent slightly darker */
--accent-hover: oklch(from var(--color-primary) calc(l - 0.04) c h);

/* Active / pressed: noticeably darker */
--accent-active: oklch(from var(--color-primary) calc(l - 0.07) c h);

/* Active with reduced chroma (slightly de-emphasize) */
--accent-active: oklch(from var(--color-primary) calc(l - 0.07) calc(c - 0.02) h);

/* Disabled: de-saturated and raised */
--accent-disabled: oklch(from var(--color-primary) calc(l + 0.15) calc(c * 0.3) h);
/* Or: just use neutral-400 for disabled backgrounds */

/* Focus ring: the base color itself, or brand color — verify ≥3:1 vs adjacent */
--accent-focus: var(--color-primary);
```

**Why relative color is the right tool:** the formula encodes the *relationship* (hover is 0.04 L darker than whatever --color-primary resolves to). If you retheme by changing the brand hue, hover states update automatically — no hunt-and-replace across component files.

---

## The semantic color family

The key insight: **four semantic colors feel coherent when they sit at the same L and near-same C, differing only in H.** An agent picks four separately saturated colors — a vivid green, a loud red, a pastel yellow, an arbitrary blue — and they look like four different design decisions. The system picks four from one family:

**Target for semantic bases: L≈0.62, C≈0.16–0.18, vary H.**

| Semantic | oklch | Notes |
|---|---|---|
| Success (green) | 0.62 0.16 150 | |
| Error (red) | 0.60 0.19 27 | Slightly lower L: red hue at 0.62 can read slightly brighter; a small L adjustment keeps perceptual equality. |
| Info (blue) | 0.62 0.17 240 | If brand is blue, this ≈ accent base; verify they don't visually clash. |
| Warning (amber) | 0.75 0.15 80 | See yellow problem below. |

**The yellow problem — warning needs special handling.** Yellow (H≈95) and yellow-green at a given oklch L read *perceptually brighter* than other hues — a well-known defect of human vision. This means:
1. Warning yellow at L=0.62 looks lighter than the other three semantics despite having the same L value.
2. Yellow text on a white background is hard to read and often fails contrast at standard L.
3. Yellow's maximum chroma in sRGB sits at a higher L than other hues.

The fix: **push warning to amber (H≈70–80), not yellow (H≈95).** Amber is more visually equal to the other semantics at L≈0.75, and when warning text must appear on a white background, press L to ≈0.55 — this is encoded into the warning semantic token, not handled per-component.

**Each semantic needs its own ramp (same L/C hump shape as accent):**
- `--green-50` through `--green-950` (for success bg tints and dark text-on-tint)
- Same for amber, red, blue/info

This allows banner backgrounds (`--color-success-bg` → green-50), border colors (green-200), and text on tinted bg (green-700 on green-50 — check Lc≈60).

---

## The three-layer token architecture

This is the structural guarantee that makes theming a remapping rather than a recoloring. Without it, a dark mode requires editing colors in every component file.

**Layer 1 — Raw/ramp tokens (theme-agnostic):**
```css
--blue-50: oklch(0.97 0.02 250);
--blue-500: oklch(0.62 0.18 250);
--blue-600: oklch(0.55 0.18 250);
--neutral-50: oklch(0.985 0.004 250);
--neutral-900: oklch(0.220 0.010 250);
/* … all ramp steps for all hues */
```

**Layer 2 — Semantic/alias tokens (theme-dependent):**
```css
:root {
  /* Light theme */
  --color-surface:        var(--neutral-50);
  --color-surface-raised: var(--neutral-100);
  --color-text-primary:   var(--neutral-900);
  --color-text-secondary: var(--neutral-700);
  --color-text-tertiary:  var(--neutral-600);
  --color-border:         var(--neutral-300);
  --color-border-subtle:  var(--neutral-200);
  --color-primary:        var(--blue-600);
  --color-primary-hover:  var(--blue-700);
  --color-primary-subtle: var(--blue-50);
  --color-success:        var(--green-600);
  --color-success-bg:     var(--green-50);
  --color-success-text:   var(--green-700);
  --color-error:          var(--red-600);
  --color-error-bg:       var(--red-50);
  --color-error-text:     var(--red-700);
  --color-warning:        var(--amber-600);
  --color-warning-bg:     var(--amber-50);
  --color-warning-text:   var(--amber-700);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark theme — alias re-pointing, not color inversion */
    --color-surface:        oklch(0.14 0.008 250);
    --color-surface-raised: oklch(0.18 0.008 250);
    --color-text-primary:   oklch(0.88 0.006 250);
    --color-text-secondary: oklch(0.75 0.008 250);
    --color-border:         oklch(0.28 0.010 250);
    --color-primary:        var(--blue-400);    /* lighter step for dark bg */
    --color-primary-hover:  var(--blue-300);
    --color-primary-subtle: oklch(0.22 0.06 250); /* dark tint, not light-50 */
    /* … */
  }
}

[data-theme="dark"] {
  /* Same as above — explicit override takes priority over @media */
}
```

**Layer 3 — Component tokens (optional, recommended for complex components):**
```css
/* In the button component */
--button-bg: var(--color-primary);
--button-bg-hover: var(--color-primary-hover);
--button-text: white;
```

**The hard rule: components consume only semantic tokens — never raw ramp steps, never hex literals.** If a component references `var(--blue-600)` directly, it breaks on theme switch. The system is only as robust as the strictest layer boundary.

---

## Contrast calibration

After building the ramps, calibrate the critical alias pairs:

| Pair | Target Lc (APCA) | Target ratio (WCAG 2) |
|---|---|---|
| --color-text-primary on --color-surface | ≥ 90 | ≥ 12:1 |
| --color-text-secondary on --color-surface | ≥ 75 | ≥ 7:1 |
| --color-text-tertiary on --color-surface | ≥ 60 | ≥ 4.5:1 |
| White text on --color-primary (button) | ≥ 75 | ≥ 4.5:1 |
| --color-success-text on --color-success-bg | ≥ 60 | ≥ 4.5:1 |
| --color-error-text on --color-error-bg | ≥ 60 | ≥ 4.5:1 |
| --color-warning-text on --color-warning-bg | ≥ 60 | ≥ 4.5:1 |

If a pair fails: **move which ramp step the alias points to** — adjust `--color-text-secondary` from `var(--neutral-700)` to `var(--neutral-800)` if 700 fails Lc≈75. Do not adjust the L value of step-700 itself; that would ripple through every use.

See **[contrast-and-bw.md](contrast-and-bw.md)** for the full contrast model including non-text contrast and APCA's size/weight binding.

---

## Deriving the dark ramp

Dark mode is not the light ramp reversed. The derivation follows three operations on each alias:

**Operation 1 — Surface/neutral aliases: use dark-specific values (not ramp steps).**
```
light: --color-surface → var(--neutral-50) [oklch 0.985 0.004 250]
dark:  --color-surface → oklch(0.14 0.008 250)  [freshly designed, not ramp-step-950-inverted]
```
The dark surface ramp is its own ramp: base ≈ L 0.14, each elevated layer adds +0.03–0.05 L. Elevation = lighter surface, not deeper shadow (shadows nearly vanish on dark).

**Operation 2 — Accent/semantic aliases: raise L ~0.12–0.15, drop C ~20–30%.**
```
light: --color-primary → var(--blue-600) [oklch 0.55 0.18 250]
dark:  --color-primary → var(--blue-400) [oklch 0.70 0.15 250]
```
Saturated mid-L colors vibrate aggressively on dark backgrounds — they're perceived as over-bright and harsh. Raising L makes the color visible without vibrating; dropping C reduces the harshness.

**Operation 3 — Tint backgrounds: use a deep low-C dark version, not the light-50 step.**
```
light: --color-success-bg → var(--green-50) [oklch 0.97 0.02 150]  — light mint tint
dark:  --color-success-bg → oklch(0.22 0.06 150)  — deep dark green, not light mint inverted
```
A light tint banner looks out of place and unreadable on a dark background. The dark version is designed as a deep, low-chroma dark, not a mathematical inversion.

**The result:** every dark theme value is a deliberate design decision encoded as an alias re-point. No value is computed by inverting a light value.

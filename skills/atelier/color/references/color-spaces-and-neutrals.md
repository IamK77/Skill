# Color Spaces and Neutrals — the perceptual foundation

> Why oklch, how to read its three axes, where the other spaces fail, and how to build
> a neutral ramp that carries a temperature rather than defaulting to lifeless gray.
> The starting material for STAGE 0 — before any accent or semantic color is defined.

---

## The color-space decision tree

Pick the space by what it preserves.

```
Generate / maintain a palette, step a ramp, rotate hue, keep lightness consistent
        └─ oklch

Mix two specific colors / gradient that must not pass through dead gray
        └─ oklab (rectangular coordinates, straight-line interpolation)

Gradient meant to travel the hue wheel
        └─ oklch with hue interpolation (watch: far hues take the long way — set direction explicitly)

Drop a known brand hex or one-off value
        └─ hex / rgb — don't reach for oklch here

Beyond-sRGB vividness (P3 gamut)
        └─ oklch(P3) or color(display-p3 r g b)

Quick hue nudge on an existing value
        └─ hsl is fine for a one-off nudge; never for building a system
```

| Space | Perceptual uniformity | Independent L | Notes |
|---|---|---|---|
| sRGB / hex / rgb() | No | No | Device legacy. Fine for fixed known values. |
| HSL / HSV | No | **No — "the lightness lie"** | Cylindrical sRGB. Same L, different hues → wildly different perceived brightness. Never build a system in HSL. |
| LAB / LCH (CIELAB) | Good | Yes | Device-independent. LCH is LAB in cylindrical coordinates. Known defect: hue non-uniformity — blue shifts toward purple as L changes. |
| OKLAB / OKLCH | **Best (Ottosson 2020)** | Yes | Fixes LAB's blue-purple hue shift and hue linearity. The modern default for design systems. |
| Display-P3 / Rec2020 | Depends on construction | — | Wide gamut; address via `oklch(P3)` or `color(display-p3 …)`. |

---

## Why OKLCH specifically

OKLCH expresses a color as `oklch(L C H)`:
- **L** — perceptual lightness, 0 (black) to 1 (white)
- **C** — chroma (colorfulness), practical range ~0–0.4; 0 = achromatic gray
- **H** — hue angle, 0–360°

Four properties make it the right foundation for a design system:

**1. Uniform perceptual lightness.** Same L across any H reads equally bright. In HSL, `hsl(60, 100%, 50%)` yellow is dramatically brighter than `hsl(240, 100%, 50%)` blue at the same lightness value. In OKLCH, `oklch(0.62 0.18 80)` and `oklch(0.62 0.18 250)` are genuinely equally bright — contrast is predictable by arithmetic.

**2. Independent hue rotation.** Hold L and C fixed, vary H — every accent and semantic color sits at the same brightness and colorfulness. Build your semantic family by fixing L≈0.62, C≈0.16–0.18, and rotating H: success at 150, error at 27, warning at 80, info at 240. This is impossible to do cleanly in hex or HSL.

**3. L is a perceptual quantity.** You can reason about contrast and dark-mode adaptation arithmetically. "Raise L by 0.1" is a genuine perceptual claim. "Raise HSL lightness by 10%" is not.

**4. Better mixing and gradients.** Interpolating in OKLAB/OKLCH avoids sRGB's "dead-gray midpoint" (a gradient from blue to orange in sRGB passes through a muddy gray) and HSL's "rainbow detour" (HSL interpolation from blue to orange swings through the entire hue wheel).

---

## Gamut and browser support

OKLCH can name colors outside the sRGB gamut. Out-of-gamut values are clamped or gamut-mapped by the browser — they may shift in unexpected ways. Two practical rules:
- **Chroma ceiling varies with L and H.** The sRGB gamut is an irregular solid in perceptual space — there is no global "max C." At some L/H combinations you can push C to 0.3; at others 0.15 is already out of gamut. Build your ramps, then check clipping.
- **Fallback for old browsers.** `oklch()` support is now broad (all modern browsers), but if targeting older environments, layer a hex/rgb fallback before the `oklch()` declaration, or use `@supports (color: oklch(0 0 0)) { … }`.

---

## CSS Color 4/5 derivation tools

These two functions let you generate a whole system from a few seeds:

**Relative color:**
```css
/* Derive a hover state from a token — same hue, lower L */
color: oklch(from var(--accent-500) calc(l - 0.04) c h);

/* Desaturate an accent for dark mode */
color: oklch(from var(--accent-500) calc(l + 0.12) calc(c * 0.75) h);
```

**Color mix:**
```css
/* Tint toward white (50/50) */
background: color-mix(in oklch, var(--accent-500) 80%, white);

/* Mix two semantic colors for a combined state */
border-color: color-mix(in oklch, var(--color-error) 70%, var(--color-warning));
```

These two functions — relative color and color-mix — are how "a few seed tokens + arithmetic" becomes a full design system. Agents default to hand-picking each value; the system derives.

---

## The neutral ramp — temperature over pure gray

**Pure gray (C = 0) reads "default, lifeless."** It is also a passive non-decision that makes the rest of the palette look arbitrary, because gray has no hue relationship to carry.

The fix: tint the entire neutral ramp toward one deliberate hue.

**Choosing the temperature — a taste decision, held once:**
- **Warm neutral** (H≈60–80): editorial, human, organic. Associated with print, content-first surfaces.
- **Cool neutral** (H≈250): clean, technical, corporate. Associated with product, dashboard, and data surfaces.
- **Brand-tinted neutral**: use the brand's own H, at very low C. Coheres the neutrals with the accent.

Tinting chroma: **C ≈ 0.005–0.03** — enough to read "deliberate", not enough to read "colored." Never more.

**The temperature is chosen once and held for the entire ramp.** Never mix warm and cool neutrals in one system.

---

## Ramp construction

A production-quality neutral ramp has ~10–12 steps, named 50…950 (Tailwind-style). Their L values are **not linearly spaced** — UI surfaces, micro-fills, and hairlines crowd into the light end (L 0.9–1.0) and need fine resolution, while the mid and dark range needs fewer distinctions.

**Step distribution (cool gray H=250 template):**

| Token | oklch(L C H) | Primary use |
|---|---|---|
| 50  | 0.985 0.004 250 | Page background / off-white |
| 100 | 0.970 0.006 250 | Subtle background, hover fill |
| 200 | 0.920 0.008 250 | Light border |
| 300 | 0.870 0.010 250 | Border |
| 400 | 0.710 0.014 250 | Disabled text / icon |
| 500 | 0.600 0.016 250 | Placeholder |
| 600 | 0.500 0.016 250 | Tertiary text |
| 700 | 0.420 0.014 250 | Secondary text |
| 800 | 0.300 0.012 250 | Strong text |
| 900 | 0.220 0.010 250 | Primary text |
| 950 | 0.160 0.010 250 | Heading / near-black |

For a warm neutral, substitute H≈60–80 throughout; adjust C slightly (warm hues can carry a touch more C at the light end without reading as colored).

**Why the dark end can lift C slightly:** deep neutrals tolerate more chroma without looking colored, and a small lift at 900/950 gives them depth. The extreme light end (50) should be near C=0.004 — any more reads as tinted at that lightness.

---

## Calibrating as pairs

The ramp is not useful until calibrated as contrast pairs. The two pairs that matter most:

- **step-900 on step-50** — this should hit your primary text contrast target (Lc≈90 APCA, ~12–16:1 WCAG).
- **step-700 on step-50** — this should hit your secondary text target (Lc≈75, ~7:1).

If step-900 on step-50 doesn't hit primary-text Lc, adjust the L values — typically push step-900 slightly darker (lower L) rather than pushing step-50 lighter (you want the page bg to stay off-white). The goal is a ramp that *structurally guarantees* the contrast hierarchy; see **[contrast-and-bw.md](contrast-and-bw.md)** for the full hierarchy.

---

## Surfaces and endpoints

**Surfaces step along the neutral ramp.** A card sits on the page background (50), with a border at 200 and content areas at 100 — each layer distinguished by one ramp step. Shadows and elevated surfaces pull from the same ramp rather than inventing values.

**The endpoint principle — even black and white carry the brand.** The page background is not `#ffffff` but `oklch(0.985 0.004 250)` — a hair off pure white, slightly cool. The text color is not `#000000` but `oklch(0.160 0.010 250)` — a hair off pure black, slightly cool. These are the smallest possible differences, but they signal "deliberate" rather than "default," and they ensure the entire surface reads as one temperature.

**Why not pure black and pure white:**
- Pure black (#000) reads as a "hole" on screen — a void rather than a surface. It also produces halation (glare/blooming) on high-brightness displays and is hard on the eyes over long sessions.
- Pure white (#fff) makes contrast excessive when paired with pure black (21:1 WCAG, which is past the comfort optimum). Off-white at L≈0.985 and near-black at L≈0.160 hit a contrast of roughly 18.6:1 — well above accessibility minimums, and trimmed off the 21:1 ceiling, but still sitting at the high end of (just above) the 9–14:1 comfort band; lift the text L toward step-900 (L≈0.22) if you want body copy to land inside that band rather than at maximum legibility. See the comfort-band discussion in **[contrast-and-bw.md](contrast-and-bw.md)**.

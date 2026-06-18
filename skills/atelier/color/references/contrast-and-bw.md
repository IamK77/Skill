# Contrast and Black-White — the accessibility spine of a color system

> Why never pure black on pure white, why contrast is a hierarchy not a number,
> how WCAG 2 and APCA differ (and when each applies), non-text contrast, colorblindness,
> and the comfort band. The techniques for STAGE 2 — verify every text/background pair
> at design time, not as a post-ship audit.

---

## Why not pure black on pure white

The gut-check move — `color: #000; background: #fff` — is not the best move. Three reasons:

**Glare and halation.** On high-brightness displays, pure black text on pure white background causes glare and halation — the letters seem to "vibrate" or "bloom," especially for users with astigmatism or low vision. The effect is subtle for neurotypical vision and severe for some.

**21:1 is past the comfort optimum.** WCAG 2 scores pure black on pure white at 21:1 — the theoretical maximum. But 21:1 is past the *comfortable* reading range. The optimal band for body text is somewhere in the 9–14:1 range; higher scores into eye fatigue.

**Pure black and white look "undesigned."** They carry no relationship to the rest of the palette. A near-black at `oklch(0.16 0.010 250)` — perceptually almost identical to #000, but carrying the neutral temperature — reads as intentional; pure #000 reads as default.

**The values to use:**
- Text-black: `oklch(0.15–0.25 0.010 H_neutral)` — this corresponds roughly to #1a1a1a–#222222 depending on H
- Large background: `oklch(0.97–0.99 0.004 H_neutral)` — off-white, slightly warm/cool depending on temperature
- Dark-mode text: `oklch(0.85–0.92 0.006 H_neutral)` — off-white, chroma dropped slightly vs body text to reduce halation
- Dark-mode base: `oklch(0.12–0.18 0.008 H_neutral)` — deep gray, not pure black

---

## Contrast as a hierarchy

UI text is not all the same priority. Forcing a single contrast target on every text element is both a technical failure (primary and disabled text should not be the same contrast) and a design failure (hierarchy communicates importance). The correct model is a **four-tier hierarchy** mapped to neutral ramp steps:

| Role | Approx WCAG ratio | APCA Lc target | Notes |
|---|---|---|---|
| Primary text | ~12–16:1 | 90 | Body copy, labels, inputs |
| Secondary text | ~7:1 | 75 | Supporting labels, metadata |
| Tertiary / muted | ~4.5:1 | 60 | Captions, helper text, timestamps |
| Placeholder / disabled | ~3:1 | — | WCAG accessibility-exempt; intentionally low but not invisible |

This hierarchy maps directly to neutral ramp steps: primary text → step-900 on step-50; secondary text → step-700 on step-50; tertiary → step-600 on step-50. The ramp is the contrast system.

**The most common failure: secondary text styled as pale gray "for elegance."** Designers drag secondary text to a light gray because it looks sophisticated — it's a visual crutch, and it usually breaks WCAG 2 outright. If step-700 on step-50 doesn't hit ~7:1, that step is too light; push it to step-800 in the alias.

---

## WCAG 2 — the legal floor

WCAG 2.x (2.1/2.2) is the accessibility standard in most jurisdictions. WCAG 2.2 is the latest W3C Recommendation (October 2023); 2.1 remains the most widely legally-referenced, and the contrast success criteria (1.4.3, 1.4.11) are identical across both, so the technique below is unaffected. It is legally enforced in many contexts. Treat it as a floor you cannot go below.

**Contrast ratio formula:** `(L1 + 0.05) / (L2 + 0.05)` where L1 > L2, and L is relative luminance in sRGB.

**Targets:**
- **Body text (normal, <24px or <18.66px bold):** 4.5:1 minimum (AA), 7:1 for AAA
- **Large text (≥24px or ≥18.66px bold):** 3:1 minimum (AA)
- **UI components and graphics (SC 1.4.11):** 3:1 — input borders, icons, focus rings, chart marks, status indicators against adjacent color
- **Disabled UI:** exempt (no minimum) — but see the comfort band note below

**Known defects of WCAG 2:**
- **Simple luminance ratio is not perceptually accurate.** The same ratio can produce very different perceptual contrast depending on which is text and which is background (polarity).
- **Systematically overstates dark-mode contrast.** Text at L≈0.85 on background at L≈0.12 passes WCAG 2 with a high ratio even though perceptually it is softer than the same light-mode pair.
- **Ignores font weight and size.** A 10px thin font at 4.5:1 is not readable; a 36px bold at 4.5:1 is fine. WCAG 2 does not model this.
- **Symmetric.** It treats text-on-bg and bg-on-text as identical, which they're not (humans read dark-on-light more reliably).

These defects mean passing WCAG 2 is necessary but not sufficient. Use APCA to ensure the palette actually reads correctly.

---

## APCA — the perceptually correct model

APCA (Advanced Perceptual Contrast Algorithm) is the contrast model proposed for WCAG 3. It corrects WCAG 2's defects by modeling polarity, font weight, and font size.

**Output:** Lc (Lightness Contrast), approximately −108 to +108. Positive Lc = dark text on light bg; negative = light text on dark bg. The absolute value is what matters for most purposes.

**Lc targets — bound to font size × weight:**

| Lc | Use case |
|---|---|
| 90 | Body text preferred; small or thin text minimum |
| 75 | Body text minimum; column text |
| 60 | Large headings (~24px+) minimum; medium-weight UI labels |
| 45 | Non-text UI minimum; large bold text |
| 30 | Any non-text that must be visible (borders, icons) |
| 15 | Visibility threshold — do not use for informational elements |

**The key insight: Lc is bound to size × weight.** A 12px regular weight label needs Lc≈90; a 32px bold heading at Lc≈60 is fine. WCAG 2 has no analog — it gives you one target regardless of how the text is rendered. This binding is the precision APCA provides and the agent will never apply automatically.

**When to use which:**
- **WCAG 2:** use as the legal compliance floor; verify all text meets the relevant threshold.
- **APCA:** use to ensure the palette actually reads well — especially on dark mode (where WCAG 2 overstates contrast), for fine or thin text, and for reading-intensive interfaces.
- On conflict between the two: APCA is perceptually truer, but satisfy WCAG 2 where you can for legal coverage.

---

## Non-text contrast — the forgotten half

WCAG SC 1.4.11 (Non-Text Contrast) requires ≥3:1 for:
- **Input component boundaries** — the border of a text field, checkbox, or dropdown against adjacent background
- **Icons** — when they convey meaning without accompanying text
- **Focus indicators** — the focus ring around interactive elements
- **Chart marks** — bars, dots, lines, segments against the chart background
- **Status indicators** — colored dots, badges, progress bars

This is systematically violated. Agents generate `border: 1px solid #e5e7eb` — a neutral step that passes WCAG text tests but fails SC 1.4.11 for input borders. The equivalent in oklch is roughly `--neutral-200` on `--neutral-50` — check the actual ratio; it's often under 3:1.

**Focus rings specifically:** a focus ring that fails contrast against both the adjacent background and the element it surrounds provides no usable focus indication. Use a dual ring (e.g., 2px solid brand + 2px offset solid white/near-black) to ensure contrast in both high and low-contrast contexts. Verify both rings against their respective adjacent colors.

**In the token system:** map non-text element colors (borders, icons, focus) to semantic tokens that are verified to hit ≥3:1, not eyeballed in a single context. A border that passes on white might fail on a colored banner background.

---

## Colorblindness — luminance is the robust channel

Color vision deficiency (CVD) affects ~8% of men and ~0.5% of women. Deuteranopia and protanopia (red-green) are most common; tritanopia (blue-yellow) is rarer.

**WCAG 1.4.1 (Use of Color):** information must not be conveyed by color alone. Add at least one of: luminance difference, icons/symbols, text labels, patterns/textures.

**Why luminance is the robust channel:** most CVD types preserve luminance sensitivity even when hue discrimination is impaired. A red on green with the same luminance is invisible to a deuteranope; a red on green with clearly different luminances (one much darker) remains distinguishable. Design for luminance difference first; treat hue difference as secondary.

**Practical rules:**
- Error states: don't rely only on red color — add an icon (✕), a label ("Error"), or position (inline below the field). Red-green is the CVD minefield.
- Form validation: success is not just green, failure is not just red — use icons, border position, text.
- Charts: see **[data-viz-color.md](data-viz-color.md)** for CVD-safe categorical and sequential palettes.
- Test with simulators: Stark (Figma plugin), Chrome DevTools rendering emulation (deuteranopia/protanopia/tritanopia/achromatopsia), or the macOS Accessibility > Display > Differentiate Without Color setting.

---

## The comfort band — lower and upper bounds

Contrast has both a lower bound (accessibility) and an upper optimum band. Pure black on pure white (21:1) is *past* the optimum — it scores best on WCAG 2 but produces the most glare.

**Practical optimum for body text:** 9–14:1 WCAG / Lc≈85–95 APCA. Strong-text at step-800 on off-white (e.g., L=0.30 on L=0.985) lands squarely here — roughly 9:1, maximum legibility with minimal glare. Near-black at L=0.16 on L=0.985 climbs to ~18.6:1 — above the upper bound, into the glare region — so reserve it for headings, where the higher contrast and larger type are comfortable, rather than for running body copy. This is the same endpoint pair discussed in **[color-spaces-and-neutrals.md](color-spaces-and-neutrals.md)**.

**Disabled states are intentionally below the lower bound** (accessibility-exempt). But intentionally low does not mean invisible — a completely invisible disabled state leaves users confused about whether a feature exists. The ethics: disabled text/controls should be *noticeably* reduced in prominence (communicating "unavailable") but still distinguishable at normal viewing distance. A placeholder at Lc≈25–30 reads as muted; at Lc≈10 it genuinely disappears for many users.

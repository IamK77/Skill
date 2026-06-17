# Dark Theme Engineering — re-tuned ramp, token architecture, and the full adaptation checklist

> Dark mode is a separately designed theme, not a filter. This document covers both the
> design side (what dark actually is: deep-gray base, off-white text, elevation by lighter
> surface, de-saturated accents) and the engineering side (token architecture, three-state
> switching, FOUC prevention, persistence, transition traps, adaptation checklist, governance).
> The engineering half is almost entirely an agent blind spot.

---

## Core principle: dark ≠ invert

`filter: invert(100%)` applied to the root produces a dark-looking UI. It is not a dark mode. The problems:
- Images and media are inverted (photos go negative; SVG icons with specific hue meanings flip).
- Saturated colors shift in unpredictable, perceptually incorrect ways.
- There is no way to express elevation (which layer is above which) because every surface maps mechanically.
- It cannot be tested systematically — you cannot write component-level contracts for an inverted filter.
- It fails APCA contrast verification (polarity is flipped but WCAG 2's symmetric model doesn't catch it).

The correct approach: dark mode is a theme where the alias layer is remapped to designed dark values. The raw ramp stays unchanged; only the semantic/alias tokens get new values.

**What "dark" actually means:**

| Element | Light | Dark | Why |
|---|---|---|---|
| Page background | oklch(0.985 0.004 H) — off-white | oklch(0.14 0.008 H) — deep gray, not black | Pure black causes halation; no elevation space remains |
| Elevated surface | +1–2 ramp steps lighter | +0.03–0.05 L per elevation layer | Elevation is lighter surface, not deeper shadow |
| Primary text | oklch(0.16 0.010 H) — near-black | oklch(0.88 0.006 H) — off-white, low C | Off-white prevents halation; drop C reduces bloom |
| Accent / primary | oklch(0.55 0.18 H) — mid-dark | oklch(0.72 0.14 H) — lighter, less saturated | Saturated mid-L colors vibrate on dark |
| Tint backgrounds (banners) | oklch(0.97 0.02 H) — light tint | oklch(0.22 0.06 H) — deep dark version | Light tints look wrong on dark bg |

The overall contrast range compresses slightly on dark — which is correct, since WCAG 2 overstates dark-mode contrast and pure off-white on dark-gray is already comfortable.

---

## Elevation in dark mode

In light mode, elevation is primarily expressed via shadow (each layer casts a slightly larger, more diffuse shadow). In dark mode, **shadows nearly vanish** — a dark shadow on a dark background is barely perceptible.

**Dark elevation uses lighter surfaces instead.** This is Material Design's "elevation overlay" principle:
- Layer 0 (base): `oklch(0.14 0.008 H)` — darkest surface
- Layer 1 (card): `oklch(0.17 0.008 H)`
- Layer 2 (dropdown, popover): `oklch(0.20 0.008 H)`
- Layer 3 (modal, dialog): `oklch(0.23 0.008 H)`
- Layer 4 (toast, tooltip): `oklch(0.26 0.008 H)`

Each layer is distinguished by ~0.03 L difference — perceptible but not abrupt. Shadows still appear on dark surfaces but serve as subtle depth indicators rather than the primary elevation signal.

**Top-edge highlight:** a subtle `box-shadow: 0 -1px 0 rgba(255,255,255,0.06)` on raised cards reads as a reflected highlight and reinforces elevation with minimal visual weight.

---

## Token architecture — why three layers matter for dark mode

Without a proper token architecture, implementing dark mode requires finding every color in every component and replacing it. With three layers, dark mode is a single alias remapping:

**Layer 1 (raw ramp):** unchanged, theme-agnostic.
**Layer 2 (semantic aliases):** remapped per theme in CSS scope.
**Layer 3 (component):** consumes semantic → automatically picks up the theme.

```css
/* Layer 2 — light */
:root {
  --color-surface: var(--neutral-50);
  --color-surface-raised: var(--neutral-100);
  --color-text-primary: var(--neutral-900);
  --color-border: var(--neutral-300);
  --color-primary: var(--blue-600);
}

/* Layer 2 — dark (alias re-pointing) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: oklch(0.14 0.008 250);
    --color-surface-raised: oklch(0.17 0.008 250);
    --color-text-primary: oklch(0.88 0.006 250);
    --color-border: oklch(0.28 0.010 250);
    --color-primary: var(--blue-400);  /* lighter step for dark bg */
  }
}
```

A button that uses `background: var(--color-primary)` automatically switches from blue-600 to blue-400 in dark mode without any change to the button file. That is the payoff.

---

## Three-state switching (light / dark / system)

Dark mode must never be a binary toggle. The correct model has three states:

1. **System** — respects `prefers-color-scheme`; no user preference stored yet, or user has explicitly reset to system.
2. **Light** — user has explicitly chosen light; overrides system even if OS is dark.
3. **Dark** — user has explicitly chosen dark; overrides system even if OS is light.

**The CSS cascade (order matters):**
```css
:root {
  /* Light defaults — always set here */
  --color-surface: var(--neutral-50);
  /* … */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* System dark — overrides light defaults */
    --color-surface: oklch(0.14 0.008 250);
    /* … */
  }
}

[data-theme="light"] {
  /* Explicit light — overrides system dark */
  --color-surface: var(--neutral-50);
  /* … */
}

[data-theme="dark"] {
  /* Explicit dark — overrides system light */
  --color-surface: oklch(0.14 0.008 250);
  /* … */
}
```

**Modern shorthand:** `color: light-dark(lightValue, darkValue)` — the browser selects the appropriate value based on the computed color scheme. Works alongside `color-scheme`.

---

## `color-scheme` — the always-forgotten property

```css
:root {
  color-scheme: light dark;
}
```

This single declaration tells the browser to render **native UI elements** (form controls: inputs, selects, checkboxes, radio buttons, date pickers; scrollbars) in the appropriate theme. Without it, native controls stay in light mode even when everything else switches to dark. Users see a jarring mismatch: dark card backgrounds, dark text — and a bright white `<select>` box.

For forced themes: set `color-scheme: light` on `[data-theme="light"]` and `color-scheme: dark` on `[data-theme="dark"]`.

---

## FOUC prevention — flash of wrong theme

**The problem:** if the theme preference is stored in `localStorage` and read after JavaScript loads and executes, the page renders with the default (light) theme first, then switches to dark — a visible flash of light theme before the dark theme takes over.

**The fix — blocking inline script in `<head>`:**
```html
<head>
  <script>
    (function() {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <!-- rest of head -->
</head>
```

This runs synchronously before the first paint. The `data-theme` attribute is set before any CSS is applied, so the browser paints the correct theme on the first frame.

**SSR environments:** the server does not have access to `localStorage` (a client-side API). For SSR, store the theme preference in a **cookie** that the server can read. The server then renders the initial HTML with the correct `data-theme` already set, eliminating the flash entirely — no blocking script needed for the initial paint.

---

## Persistence and cross-tab sync

```javascript
// Save user preference
function setTheme(theme) {
  localStorage.setItem('theme', theme);      // 'light' | 'dark' | 'system'
  applyTheme(theme);
}

// Cross-tab sync — when localStorage changes in another tab
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') applyTheme(e.newValue);
});

// Live system mode — follow OS changes in real time
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  if (getCurrentTheme() === 'system') {
    applyTheme('system');
  }
});
```

The `applyTheme` function reads the stored value, resolves 'system' to the current OS preference, and sets `document.documentElement.setAttribute('data-theme', resolved)`.

---

## Theme-switch transition — the traps

**The wrong approach:**
```css
* { transition: background-color 0.3s, color 0.3s; }
```
This animates every element on every interaction (hover, focus, etc.) not just on theme switch, causing constant unwanted animations and significant jank.

**Better approach — scoped transition:**
```javascript
function switchTheme(newTheme) {
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', newTheme);
  // Remove after transition completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 300);
}
```
```css
.theme-transitioning,
.theme-transitioning * {
  transition: background-color 0.3s, color 0.3s, border-color 0.3s !important;
}
```

**Best approach — View Transitions API** (progressive enhancement):
```javascript
if (document.startViewTransition) {
  document.startViewTransition(() => applyTheme(newTheme));
} else {
  applyTheme(newTheme);
}
```
This enables an elegant cross-fade or circular-expand animation from the toggle button. Wrap with `prefers-reduced-motion` respect.

---

## The full adaptation checklist

Colors are only the first item. Every one of these must be adapted:

| Element | What to do |
|---|---|
| Colors | Semantic tokens → re-pointed in dark scope. No raw hex in components. |
| Shadows | Elevation via lighter surface + top-edge highlight; box-shadows reduced (nearly invisible on dark). |
| Images / illustrations | Provide dark variants; or use `prefers-color-scheme` in `<picture>` with `<source media="(prefers-color-scheme: dark)">`. Transparent PNG fringe (white halo around a logo designed for white bg becomes visible on dark). |
| Gradients | Re-tune (a gradient from light-neutral to slightly-lighter-neutral is invisible on dark; redesign with appropriate dark colors). |
| Charts and data-viz | Recolor (raise L, drop C); lighten gridlines and axes; don't invert. See [data-viz-color.md](data-viz-color.md). |
| Code syntax highlighting | Switch to a dark syntax theme (not inverted — pick a purpose-built dark theme). |
| Maps / iframes / embeds | Dark tile layers (Mapbox/Google Maps have dark styles); pass a theme parameter to embeds where supported. |
| Logo | Two versions: one for light bg, one for dark bg. The dark-bg version often needs inversion of dark parts, not the whole SVG. |
| `color-scheme` | Set `color-scheme: light dark` on `:root`; override on `[data-theme]`. |
| `<meta name="theme-color">` | Provide two values: `<meta name="theme-color" content="#f8f9fa" media="(prefers-color-scheme: light)">` and dark equivalent. Colors the mobile browser chrome. |
| Favicon | Optional; SVG favicons can include `@media (prefers-color-scheme: dark)` styles. |

Missing any of these creates jarring mismatches — a perfectly dark UI with a white logo, or a dark chart with bright-white gridlines inverted from the light version.

---

## Accessibility in dark mode

**WCAG 2 overstates dark contrast.** WCAG 2's symmetric luminance ratio does not account for polarity (dark-on-light vs light-on-dark reads differently). Off-white text at L≈0.88 on dark-gray at L≈0.14 gives a WCAG ratio of roughly 9:1 — technically excellent — but perceptually this pair may feel softer than its score suggests because the absolute luminance levels are lower. Use APCA (which models polarity) to verify dark-mode contrast, not just WCAG 2.

**Off-white is itself an accessibility improvement.** Pure white text on dark backgrounds causes halation for users with astigmatism. Off-white at L≈0.85–0.92 reduces this effect — it's both a comfort and an accessibility improvement.

**Do not force dark mode.** Some users with astigmatism find dark backgrounds harder (halation on the glowing characters). Always provide both themes and respect the system preference. Never make dark mode the only option.

**Never push contrast below threshold "for softness."** Reducing contrast to make a dark theme feel "softer" is a WCAG failure. If the dark design feels harsh, the fix is off-white text and de-saturated accents — not lower contrast.

---

## Governance and testing

**Visual regression in both themes.** Every component must be tested in both light and dark. With a proper token architecture, this means testing the alias mapping (verify the tokens themselves point to correct values per theme) plus a sample of rendered components — not re-testing every individual color.

**Lint rule: forbid hardcoded colors.** Every color value in CSS, JavaScript, or inline styles must be a token reference. A hex or oklch literal in a component file is a bug waiting to break in one of the two themes.

**Lint rule: every semantic token has a value in both themes.** A semantic token without a dark-theme value silently falls back to the light value, which is almost always wrong. Enforce completeness in the token definition file.

**Extending beyond two themes.** The same architecture handles high-contrast themes, brand themes, and more: each is an additional `[data-theme]` scope that re-points the alias layer. The component code never changes. Define the extension protocol before it's needed — retrofitting multi-theme support into a hardcoded codebase is painful.

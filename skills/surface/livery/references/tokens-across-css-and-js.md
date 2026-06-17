# Tokens Across the CSS ↔ JS Boundary — One Source of Truth When Styles Live in JS

A design token is one value with one home. The moment styles also live in JS — an inline-style object, a `colors.ts` map, a CSS-in-JS theme — that same value tends to get a *second* home in a different language, and the palette is now maintained in two places: the subtler twin of the magic literal. This file holds only the encodable mechanics of keeping **one source of truth** across two languages and making every consumer (CSS rules, inline styles, JS logic, canvas) read *from* it rather than re-declare it. The taste calls — which palette, how dark, how saturated — stay in the color gate; they are not here.

This is the CSS↔JS *crossing*. The CSS-internal mechanics (cascade, `@layer`, `@property`, IACVT, specificity, containing blocks) live in [css-and-tokens.md](css-and-tokens.md); this file cross-links into it rather than repeating it.

## The boundary, and why it bites

JS-side styling shows up in four common forms:

- **React inline-style objects** — `style={{ color: ... }}` on an element.
- **A JS/TS token-ish object** — `export const color = { accent: ... }` in a `colors.ts` / `tokens.js`, often fed to a chart, a canvas, or a third-party component that takes a color prop.
- **CSS-in-JS** — styled-components / emotion (runtime), or vanilla-extract / Linaria (compile-time), with a `ThemeProvider` + theme object.
- **Tailwind / utility config** — `theme.extend` generating utilities and CSS variables.

The failure mode is always the same: oklch tokens defined on `:root`, then a JS color object **re-typing the same hexes** for a chart tooltip or an inline style. Two sources, guaranteed drift — one gets nudged in a redesign, the other doesn't, and the surface is subtly two-toned for months before anyone names it.

This is not a new discipline. `surface:wellspring` already treats **the design system as itself state — one source of truth** (the bearings↔livery lane is marked; this names livery↔wellspring). Cross-language palette duplication is exactly that law applied to looks: a second source of truth that drifts like any other. Keeping one source here *is* the same one-source rule, not a special case.

## The four options — pick ONE source

Pick one source for the stack you are in. Whichever you pick, the **other directions become read-only consumers** — never a second author.

**(a) CSS custom properties as the source, consumed in JS via `var()` strings.**
`style={{ color: 'var(--color-accent)' }}`; when JS needs the resolved value, `getComputedStyle(el).getPropertyValue('--color-accent')`.
- *Wins when* theming is runtime/cascade-driven — dark mode, per-subtree re-theming, a `.dark-section` override — because the cascade does the work for free.
- *Cost* — JS can't compute on the value without a read; `var()` strings are opaque to JS math (you can't lighten `'var(--x)'` arithmetically).

**(b) A single JS token module as the source, generating the CSS custom properties.**
`export const color = { accent: 'oklch(...)' }`, and a build/startup step writes those into `:root` (one writer → the cascade).
- *Wins when* JS genuinely needs the values — canvas/WebGL, chart libraries (Recharts/visx/D3), color math — because the JS object is the canonical, computable form.
- *Cost* — a build or inject step; and runtime theming must read the **generated** custom properties on the hot path, not the JS object, or you lose cascade theming.

**(c) CSS-in-JS theming.**
A `ThemeProvider` + theme object (styled-components/emotion), or vanilla-extract's `createTheme` / `createThemeContract`, which emits **real custom properties** at build time.
- *Wins when* the stack is already CSS-in-JS — the theme object is the natural single home.
- *Cost* — runtime CSS-in-JS has a per-render cost; prefer zero-runtime / compile-time variants (vanilla-extract, Linaria, or styled's compiler). The theme object must still be the *only* source — components must never inline a literal "just here."

**(d) Tailwind / utility config as the source.**
`theme.extend` generates utilities and CSS variables from one config.
- *Wins when* the stack is utility-first.
- *Cost* — **arbitrary values are the leak**: `bg-[#3b82f6]`, `mt-[13px]` re-introduce literals straight past the config. Ban arbitrary values in review; they are the Tailwind shape of a magic literal.

## The inline-style trap (the rule that catches people)

Inline `style=""` sits **above all selector specificity** in the cascade — only `!important` and active transitions beat it (see the specificity table in [css-and-tokens.md](css-and-tokens.md): *Inline `style=""` → above all selectors*). So a literal in an inline style silently **wins** over every tokenized class rule: your token system is correct, complete, and still loses, because one `style={{ background: '#fff' }}` outranks the entire `@layer components` stack.

Therefore inline styles must reference tokens too:

```jsx
// wrong — outranks every token, can't be re-themed
<div style={{ background: '#fff' }} />
// right — the inline style reads from the one source
<div style={{ background: 'var(--color-surface)' }} />
```

Same for a JS color object handed to a chart or canvas: it must be **derived from the source**, not hand-typed alongside it. A `chartColors = ['#2f6ae0', ...]` array parallel to the CSS palette is the trap in array form.

## Crossing back: when JS genuinely needs the value

Sometimes JS must hold the resolved value — a canvas fill, a WebGL uniform, a chart library that takes a color string, a scroll calc.

- **Read the custom property**: `getComputedStyle(el).getPropertyValue('--color-accent').trim()`. This resolves the cascade, so it respects the active theme.
- **Cost**: `getComputedStyle` is a layout-dependent read — calling it per frame forces synchronous style/layout flush (the layout-thrashing note in [css-and-tokens.md](css-and-tokens.md)). **Cache it**; re-read only when the theme changes, not every frame.
- **Feed canvas/WebGL/chart libs the resolved values from the one source** — read once on mount/theme-change, pass the resolved palette down — rather than maintaining a parallel hand-typed palette.
- **Values JS will animate** should be registered with `@property` (typed customs interpolate; untyped ones snap) — see the `@property` section in [css-and-tokens.md](css-and-tokens.md).

## Audit smell list

Sweep for these fast:

- The same hex (normalized: lowercase, `#fff`→`#ffffff`) appears in a `.css`/`.scss` **and** a `.ts`/`.js`.
- A `colors` / `theme` JS object whose values don't trace back to the token source.
- `style={{ }}` with literal colors or px (`'#fff'`, `'13px'`) instead of `var(--...)`.
- Tailwind arbitrary-value classes (`bg-[#2f6ae0]`, `mt-[13px]`).
- A chart/canvas palette hand-typed in an array instead of read from the source.

Found any of these on a retrofit? That is the cross-language duplication the *Auditing an existing surface* section of [css-and-tokens.md](css-and-tokens.md) tells you to collapse to one source.

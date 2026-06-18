# Token Architecture — One Source of Truth

> The token system is itself state. One source authors the tokens; every language
> reads from it. The architecture is the structure that makes drift impossible —
> not a convention that discourages it.

---

## The taxonomy: what gets a token

Every value that repeats or must cohere across components belongs in the taxonomy.
Five categories cover the system produced by the other atelier lenses:

| Category | What it names | Examples |
|---|---|---|
| **color** | Perceptual ramp + semantic alias + component hook | `--color-surface`, `--color-text-primary`, `--button-bg` |
| **type** | Scale steps, weight roles, measure, line-height | `--text-sm`, `--text-heading-lh`, `--text-measure` |
| **space** | Spacing scale (base unit × geometric steps) | `--space-xs`, `--space-md`, `--space-2xl` |
| **radius** | Concentric radii for nesting, a z-scale for elevation | `--radius-sm`, `--radius-card`, `--shadow-overlay` |
| **motion** | Duration and easing tokens; spring params | `--duration-fast`, `--ease-standard`, `--spring-bounce` |

This is the taxonomy the component library consumes. Values outside it are either
literals (a bug) or one-offs that should be absorbed.

---

## The three-layer architecture

```
Layer 1 — raw / primitive   --blue-500: oklch(0.62 0.18 250);
Layer 2 — semantic / alias  --color-primary: var(--blue-500);
Layer 3 — component         --button-bg: var(--color-primary);
```

**Raw**: the named scale. Theme-agnostic — never consumed directly by components.

**Semantic**: re-maps raw steps to roles (`surface`, `text-primary`, `border`,
`accent`, the four feedback states). Theme switch = re-point aliases in
`[data-theme="dark"]` scope; the raw ramp is never inverted.

**Component**: optional third layer for tokens with a clear component API (`--button-bg`
that the consumer can override without touching internals). Documented as a `@property`
so the type is machine-readable.

Components consume only semantic tokens (Layer 2) or their own component tokens
(Layer 3) — **never raw steps or literals**.

---

## The CSS custom property mechanism

Tokens live as CSS custom properties — they cascade, inherit, and are readable
by JS at runtime:

```css
@layer tokens {
  :root {
    /* Layer 1 — raw */
    --blue-500: oklch(0.62 0.18 250);
    /* Layer 2 — semantic */
    --color-primary: var(--blue-500);
    /* Layer 3 — component */
    --button-bg: var(--color-primary);
  }
}

@layer tokens {
  [data-theme="dark"] {
    --color-primary: var(--blue-300); /* re-point, never invert */
  }
}
```

`@layer tokens` sits below `@layer components` and `@layer utilities` — the
layer order makes token overrides win without specificity hacks. Declare
`@layer reset, base, tokens, components, utilities` once at the top.

**`@property` for animated tokens and API tokens:**

```css
@property --button-bg {
  syntax: '<color>';
  inherits: true;
  initial-value: oklch(0.62 0.18 250);
}
```

Typed customs interpolate (untyped snap); `@property` also documents the token's
expected type — a machine-readable public API. Register any token you plan to
transition or expose as a component API.

---

## The CSS↔JS boundary: pick ONE source

When tokens must also live in JS — for canvas, chart libraries, React inline
styles, CSS-in-JS themes — the failure mode is always the same: a CSS custom
property **and** a JS object each maintaining the same palette. Two sources
guaranteed to drift.

**The rule:** one direction authors; every other reads.

**(a) CSS custom properties are the source; JS reads via `getComputedStyle`.**

```js
const accent = getComputedStyle(el)
  .getPropertyValue('--color-primary').trim();
```

Cache the result; re-read only on theme change. `getComputedStyle` resolves the
cascade, so it respects the active theme automatically. Do not call per frame
(forces synchronous layout flush).

**(b) A JS token module is the source; a build step writes CSS custom properties.**

```ts
// tokens.ts — the one author
export const color = { primary: 'oklch(0.62 0.18 250)' };

// build / startup — generated, not hand-maintained
document.documentElement.style.setProperty(
  '--color-primary', color.primary
);
```

JS has the computable form; CSS consumes it. Runtime theming must read the
generated custom properties on the hot path, not the raw JS object, or it loses
cascade theming.

**(c) CSS-in-JS theming (vanilla-extract / Linaria preferred; runtime CSS-in-JS has per-render cost).**

The theme object is the single home. Components must never inline a literal.

**(d) Tailwind config as the source.** `theme.extend` generates utilities and
CSS variables from one config. Arbitrary values (`bg-[#2f6ae0]`) are banned —
they bypass the config and re-introduce literals.

**Whichever option: inline `style=""` must also reference tokens.**

```jsx
// wrong — outranks every tokenized class rule
<div style={{ background: '#fff' }} />

// right — the inline style reads from the one source
<div style={{ background: 'var(--color-surface)' }} />
```

Inline styles sit above all selector specificity (only `!important` and active
transitions beat them). A literal in an inline style silently wins over the
entire token system.

---

## Scoping and sub-themes

Custom properties override in subtrees with zero JS:

```css
.dark-section {
  --color-surface: oklch(0.14 0.01 250);
  --color-text-primary: oklch(0.90 0.005 250);
}
```

Only that subtree re-themes; everything outside is unchanged. This is the
mechanism for component-level theming, dark sidebars, brand-colored banners —
all without a component framework's theming runtime.

**`@scope` (emerging)** adds proximity: closer ancestor scope wins over farther.
Use once support is solid; the subtree-override pattern above is the baseline.

---

## IACVT: the footgun to know

When `var(--x)` resolves to a value invalid for the target property, CSS does
**not** ignore the declaration — it sets the property to its **inherited or
initial value**. Fallback syntax `var(--x, fallback)` does not help here:
the fallback fires only when `--x` is *unset*, not when it is set to an
invalid value.

With `@property` registration, invalid values fall back to `initial-value` —
predictable, debuggable. Register tokens that could receive bad values.

Debug via DevTools Computed panel: struck-through declarations point to the
loser; cascade order in the Styles panel shows origin → layer → specificity.

---

## Audit smell list (run on any codebase before gates)

- The same hex appears in a `.css`/`.scss` **and** a `.ts`/`.js` — two sources of the same token.
- A `colors` / `theme` JS object whose values do not trace back to the token source.
- `style={{ }}` with literal colors (`'#fff'`) or literal px (`'13px'`) instead of `var(--…)`.
- Tailwind arbitrary-value classes (`bg-[#2f6ae0]`, `mt-[13px]`).
- A chart/canvas palette hand-typed in an array instead of read from the source.
- A token that exists in one theme but has no value in the other — IACVT fires silently.
- Tokens consumed in component files by raw layer names (`var(--blue-500)`) — Layer 1 leak.

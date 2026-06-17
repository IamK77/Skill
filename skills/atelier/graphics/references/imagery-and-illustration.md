# Imagery & illustration — CLS-free, LCP-safe, system-governed

> The image element is the source of CLS, broken LCP, and over-fetched bytes unless it is
> engineered. This doc holds the encodable technique behind the imagery gate: the responsive
> pipeline (format ladder, srcset, art direction), the CLS prevention (aspect-ratio-boxed,
> always), the LCP rule (never lazy-load the hero), the placeholder strategy, and the
> illustration system. Taste decides the allowed ratios, the illustration style spec, and the
> photo treatment; this doc governs what every image requires.

---

## Two sub-systems, one pipeline

**Photography / raster images** and **illustration / drawn art** are governed by separate specs, but both flow through the same technical pipeline. Add icons (see [icon-system.md](icon-system.md)) and decorative accents as a third category.

Consistency binds everything: treatment (grade, duotone, scrim), aspect ratios, cropping approach, illustration style (line-weight, palette, perspective, character), corner radius alignment with the product's radius scale.

The failure mode is the mixed bag: random-style stock photography, four illustration packs in four different perspectives, a hero image that shifts the page, a format-ladderless JPEG served at 2× the needed size.

---

## Aspect-ratio-boxing — preventing CLS (highest leverage, always required)

**Cumulative Layout Shift (CLS)** happens when the browser doesn't know an image's dimensions until it loads — it paints other content, then the image arrives and shifts everything. The fix is a single rule applied universally:

**Every image element must reserve its space before the image loads.**

Two mechanisms:

```html
<!-- Option A: explicit width + height attributes (browser computes aspect-ratio from these) -->
<img src="hero.jpg" width="1200" height="675" alt="..." />

<!-- Option B: CSS aspect-ratio -->
<img src="hero.jpg" style="aspect-ratio: 16/9; width: 100%;" alt="..." />
```

When width+height are present, the browser automatically applies an intrinsic aspect-ratio to the `<img>` — no layout shift. This is a non-default browser behavior unlocked by those attributes; omitting them is the original CLS source.

**Define a fixed set of allowed aspect ratios** for the product (e.g. 16:9 for hero/video, 4:3 for card thumbnails, 1:1 for avatars/product squares, 3:2 for editorial, 21:9 for cinematic banners) and apply them consistently. Random per-image ratios produce visual noise.

**`object-fit: cover` + `object-position` for focal-point cropping** — fills the aspect-ratio container while keeping the subject in frame. The default is center-center; override with `object-position: top` (portrait photos), a focal-point percentage, or — for supported browsers — smart focal-point from the image CDN.

---

## Art direction: more than resolution

`srcset` + `sizes` delivers different file sizes for the same image at different viewports and DPRs (the default "responsive images" pattern). **Art direction is a step further**: a different *crop* or *composition* per viewport — a wide desktop hero becomes a tightly cropped portrait on mobile.

```html
<picture>
  <!-- Art-directed mobile crop (portrait subject, tighter composition) -->
  <source
    media="(max-width: 767px)"
    srcset="hero-mobile.avif 800w, hero-mobile.webp 800w"
    type="image/avif"
  />
  <!-- Desktop (wide composition) -->
  <source
    media="(min-width: 768px)"
    srcset="hero-desktop.avif 1200w 2x, hero-desktop.avif 1200w"
    type="image/avif"
  />
  <img src="hero-desktop.jpg" width="1200" height="675" alt="..." />
</picture>
```

`<picture>` doubles as art direction **and** format fallback — the two concerns live in one element.

---

## Format ladder

Serve the most efficient format the browser supports:

```
AVIF → WebP → JPEG / PNG (fallback)
Vectors, icons, logos → SVG (always)
```

Quality targets: AVIF ~50–65, WebP ~75–80, JPEG ~80–85. AVIF delivers ~50% smaller files than JPEG at equivalent quality; WebP ~30% smaller. The `<picture>` element with `type="image/avif"` / `type="image/webp"` handles the negotiation — browsers that don't support AVIF fall through to WebP, then to JPEG.

**Image CDN** (Cloudinary, imgix, Next Image, Imgproxy): transcode and resize on demand. Rather than pre-baking every combination of size + format + quality, the CDN generates them at request time from a URL parameter. For most projects, this is the correct infrastructure choice.

---

## The LCP rule — never lazy-load the hero

**Lazy-loading the LCP (Largest Contentful Paint) hero image is the single most common way to wreck the LCP score.** `loading="lazy"` tells the browser to defer the request until the image is near the viewport — but for an above-the-fold hero, that deferral means the browser actively slows down the most important render.

**LCP / hero image:**
```html
<img
  src="hero.jpg"
  loading="eager"
  fetchpriority="high"
  decoding="async"
  width="1200" height="675"
  alt="..."
/>
```

Plus a `<link rel="preload">` in the `<head>` for the highest-priority image:
```html
<link rel="preload" as="image" href="hero.avif" type="image/avif" />
```

**Everything below the fold:**
```html
<img src="card.jpg" loading="lazy" decoding="async" width="400" height="300" alt="..." />
```

`content-visibility: auto` on off-screen sections further reduces rendering work for images the user hasn't scrolled to.

---

## Responsive sizing: srcset + sizes

```html
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
  width="800" height="600"
  loading="lazy"
  decoding="async"
  alt="..."
/>
```

`sizes` tells the browser how wide the image will be rendered at each viewport width (before the stylesheet is parsed) so it can pick the right `srcset` candidate. Without `sizes`, the browser assumes 100vw and downloads a much larger file than needed.

---

## Placeholder strategy — perceived performance

The `aspect-ratio` box is already reserved. Fill it with a placeholder while the image loads, then cross-fade the real image in. This converts "blank box then pop" into "blur-in then sharpen."

**LQIP / blur-up (premium move):**
- Generate a tiny version of the image (4–20px wide), encode as base64.
- Alternatively, compute a **BlurHash** (a compact 20–30 character string encoding a blurred color mosaic) or **ThumbHash** (higher quality, color-aware).
- Display the blurred placeholder with CSS `filter: blur()` + `scale(1.1)` (to hide the blur edges).
- On load, cross-fade the real image: `opacity: 0 → 1` with `transition`.

**Dominant-color block:** a solid swatch of the image's average color — simpler to compute, no blur effect, but eliminates the blank-white flash.

```css
.image-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  background-color: var(--image-dominant-color, var(--color-surface-alt));
  overflow: hidden;
}

.image-wrapper img {
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper img.loaded { opacity: 1; }
```

Trigger `.loaded` via the `load` event: `img.addEventListener('load', () => img.classList.add('loaded'))`.

---

## Illustration system

**A written style spec for all drawn art:**

| Property | Decision |
|---|---|
| Line treatment | Stroke-based (and stroke weight) or fill-only (flat) |
| Color palette | Brand scale + small set of illustration-only additions |
| Perspective | Flat / isometric / 2.5D / perspective |
| Detail level | Minimal / medium / detailed |
| Character style | Proportions, face approach, representation diversity |
| Texture / grain | None / subtle noise / halftone |
| Shape language | Angular / rounded / organic |

**Palette discipline.** Constrain all illustrations to the brand color scale (+ a small, named set of illustration-only additions). Illustrations that use an arbitrary palette imported from a stock library clash with the product surface.

**Representation.** Character art (people illustrations) should show diversity across skin tone, body type, ability, age. This is both an ethical responsibility and a quality signal — a surface that represents only one type of person reads as unfinished.

**Spot illustration library.** A consistent set for the repeating moments: empty state (no results, first use), onboarding step, error / 404, success / completion. These must all look drawn by the same hand — if they're sourced from different packs they visually fragment.

Consistency principle: every illustration in the product is indistinguishable in style. When commissioning or generating new illustrations, hand the spec to the illustrator or the generator.

---

## SVG illustration

SVG illustrations get the same treatment as SVG icons in terms of delivery and optimization:

- **Optimize with SVGO** — strip metadata, unnecessary `<defs>`, redundant attributes.
- **`currentColor` for theme-aware parts** — text, strokes, or fills that should adapt to the color theme use `currentColor`. Colors that are fixed brand/illustration hues use explicit values.
- **Delivery modes:**
  - **Inline SVG** — fully styleable and animatable via CSS; correct choice for theme-sensitive or animated illustrations.
  - **`<img src="...svg">`** — cached like any image, simple to use; can't be styled via external CSS.
  - **CSS `background-image`** — for purely decorative art with no semantic meaning.
- **Accessibility:** inline SVG gets `role="img"` + `<title id="...">` with `aria-labelledby` pointing to it, or `aria-label` on the SVG. Decorative SVG (no meaning on its own) gets `aria-hidden="true"`.
- **Responsive:** keep `viewBox`, set no fixed `width`/`height` — let CSS control size.

---

## Photo treatment

**Unifying mismatched photography** to produce a coherent photographic identity:

- **Color grade:** a consistent LUT (look-up table) applied to all photos — warm, cool, desaturated, film-like, etc. In practice: CSS `filter` combinations, SVG filter chains, or an image CDN's grade transform.
- **Duotone (premium, non-default):** map a grayscale version of a photo to two brand colors. Any photograph becomes brand-coherent. Three CSS/SVG approaches:
  - SVG `feColorMatrix` / `feComponentTransfer` filter
  - `mix-blend-mode: multiply` + a brand-color overlay
  - CSS `filter: grayscale(1)` + a color overlay element with `mix-blend-mode`
- **Scrim:** a gradient overlay on top of a photo to ensure text legibility. A top-to-bottom translucent gradient covering the text area; do not rely on raw contrast between photo and text.
- **Grain/noise overlay:** a subtle noise texture over photos produces a film-like quality and softens JPEG compression artifacts.

---

## Dark mode

**Illustrations** are the hardest dark-mode case. A light-background illustration (off-white fill areas) placed on a dark page shows white fringes and clashes. Three approaches:
1. **Dark variant** — a second version drawn for dark contexts (fill areas become dark, outlines lighten).
2. **`currentColor` + CSS variables** — illustration colors reference CSS custom properties; the dark theme redefines them.
3. **`prefers-color-scheme` media query inside the SVG** — SVG can carry its own `@media (prefers-color-scheme: dark)`.

**Transparent PNGs** with white anti-aliased edges show those edges on dark backgrounds — a classic trap. Use SVG, or export with correct alpha (no white fringe).

**Photos:** a slight `filter: brightness(0.85)` reduces glare on dark backgrounds. A different duotone treatment per theme is stronger. Avoid inverting photos.

**Logos:** always ship both a light-theme and a dark-theme version.

---

## Alt-text discipline

Alt text describes the image's **purpose or meaning in context** — not a literal pixel description.

| Image type | Alt text rule |
|---|---|
| Informative | Concise, meaningful description of what the image communicates |
| Decorative | `alt=""` (empty string) — screen reader skips it entirely |
| Functional (image is a link or button) | Describes the action or destination |
| Complex (chart, diagram) | Short alt + an adjacent long description or data table |
| Text baked into an image | The alt must contain that text |

**Never start with "image of" or "photo of"** — screen readers already announce the element type.

The difference between `alt=""` (decorative) and a missing `alt` attribute: missing makes the screen reader read the file path/name. Always provide the attribute; choose empty or descriptive.

---

## Governance: the `<Image>` component

Enforce the entire pipeline structurally through a single wrapper component — Next/Image, Nuxt `<NuxtImg>`, or a custom component — that encodes:

- Format selection (AVIF/WebP/JPEG)
- `srcset` and `sizes`
- `loading` strategy (prop-controlled, defaulting to `lazy` with an `eager` override for LCP)
- `width` and `height` (or `aspect-ratio` enforcement)
- Placeholder strategy (BlurHash token or dominant color)
- **`alt` as a required prop** — a component without a required `alt` prop allows every consumer to omit it

When every image in the product passes through one component, correct behavior is structural, not dependent on each engineer remembering all the rules.

---

## Quick-reference checklist

| Check | Standard |
|---|---|
| Every image aspect-ratio-boxed | `width`+`height` or `aspect-ratio` on every `<img>` |
| Allowed ratio set defined | E.g. 16:9 / 4:3 / 1:1 / 3:2 — consistent, not random |
| Focal-point cropping | `object-fit: cover` + `object-position` |
| LCP hero: never lazy | `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">` |
| Below-fold: lazy | `loading="lazy"` + `decoding="async"` |
| Format ladder | AVIF → WebP → JPEG via `<picture>` |
| srcset + sizes | Correct `sizes` matches rendered width |
| Art direction | `<picture>` + `<source media>` for viewport-matched crops |
| Placeholder | LQIP / BlurHash / dominant color + cross-fade on load |
| Illustration spec | Line, palette, perspective, character, texture recorded |
| Spot library | One consistent set for empty/error/onboarding/success |
| Photo treatment | Grade / duotone / scrim defined and consistent |
| Dark mode | Illustration variants or CSS-var theming; no PNG fringe; logo x2 |
| Alt text | Meaningful / empty (decorative) / action (functional); no "image of" |
| Governance | `<Image>` component; `alt` required; pipeline enforced by construction |

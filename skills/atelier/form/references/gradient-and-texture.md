# Gradient and Texture — encodable technique

> The technique behind `form`'s third gate. Taste picks the interpolation space, the
> texture job, and the grain character; the system then derives every gradient and
> texture cue from that intent — perceptually smooth, banding-free, never decorative
> by default. No arbitrary CSS gradients — every gradient earns its place and is
> specified by formula, not by eye.

---

## Gradients have a job or they don't ship

The first question is not "what colors" — it is "what job." Three valid jobs:

1. **Depth / elevation:** a surface gradient (top lighter, bottom darker, Δ L ≈ 1–3%)
   that makes a card or button read as three-dimensional. Agrees with the light model.
2. **Focus / attention:** a directional gradient that pulls the eye toward a focal
   element or edge-fades a scroll region (a mask gradient).
3. **Brand / atmosphere:** a hero gradient, an ambient aurora background — chosen once,
   tokenized, used sparingly.

Anything else is noise. The agent will add gradients that look plausible — a subtle hero
tint here, a button color ramp there — without asking the job question. Each one adds
visual entropy. The decision is binary: name the job, or remove it.

---

## Interpolation space — the most important non-default

The default CSS gradient interpolates in sRGB. sRGB is not perceptually uniform, so two
saturated colors interpolate through a "dead gray zone" or a muddy midpoint (blue + yellow
→ gray midpoint in sRGB; orange + purple → brown). This is the most common gradient defect
in production UI and the most invisible to anyone who learned CSS gradients before OKLCH.

**Always specify the interpolation space explicitly:**

```css
/* sRGB (default) — produces muddy midpoints between saturated colors */
linear-gradient(to right, oklch(0.62 0.18 260), oklch(0.75 0.15 80))

/* OKLAB — straight-line mix, no hue detour, no dead zone */
linear-gradient(in oklab, oklch(0.62 0.18 260), oklch(0.75 0.15 80))

/* OKLCH — travels the hue wheel (specify direction to control which way) */
linear-gradient(in oklch shorter hue, oklch(0.62 0.18 260), oklch(0.75 0.15 80))
```

**Decision rule:**
- Mixing two colors directly (no hue rotation intended) → `in oklab` (straight-line mix,
  naturally de-saturates through the midpoint without going gray)
- Traveling the hue wheel (spectrum effect, rainbow, hue sweep) → `in oklch` with an
  explicit hue direction (`shorter hue` for shortest arc, `longer hue` for the scenic
  route)
- Color-stop-heavy ramps (multiple anchors) → both work; oklab is simpler to reason about

Never use `in srgb` deliberately for a designed gradient.

---

## Color banding — the invisible production defect

8-bit display panels can't represent subtle lightness gradations as a smooth ramp — they
quantize into visible steps ("Mach banding"). This is most visible in:
- Large low-contrast gradients (which is exactly the kind used in premium "barely-there"
  UI surfaces)
- Large blurred shadow regions
- Sky/hero backgrounds

**Fix: grain dithering.** Layering extremely faint noise over the gradient distributes
the quantization error spatially, breaking the banding pattern. The grain is nearly
invisible but the banding disappears.

Standard approach:
```css
.has-gradient {
  position: relative;
}
.has-gradient::after {
  content: "";
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,...");  /* precomputed noise texture */
  opacity: 0.03;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

Noise source options, from best dithering quality to simplest:
- **Blue noise (precomputed texture):** highest quality — spatially uniform, no clumping,
  minimum visible grain. Use a pre-baked blue-noise PNG tiled with `background-repeat`.
- **SVG `feTurbulence`:** Perlin/fractal noise, low-frequency blobs — adequate for
  banding, but leaves more visible texture. Simpler to implement. Cache as a `data-URI`.
- **White noise (random):** clumps visibly. Only use if the other two are not available.

The grain serves the surface — it fights banding and adds a slight tactile quality — but
it must be invisible as grain. If the viewer perceives "there is noise on this," the
opacity is too high.

---

## The transparent-black trap

CSS `transparent` is shorthand for `rgba(0,0,0,0)` — transparent *black*. So
`linear-gradient(red, transparent)` interpolates from red toward transparent black,
producing a murky dark-red midpoint instead of a clean fade-to-nothing.

**Fix: always fade to same-hue transparent:**
```css
/* Wrong — fades through dirty dark-red */
linear-gradient(oklch(0.55 0.20 27), transparent)

/* Correct — fades cleanly */
linear-gradient(oklch(0.55 0.20 27), oklch(0.55 0.20 27 / 0))
```

This also applies to scrims and mask gradients. Every fade-to-transparent in the UI
should use same-color-zero-alpha, not `transparent`.

---

## Eased alpha for scrims and edge fades

A linear alpha fade (from opaque to transparent in equal steps) looks mechanical — the
eye perceives a "crisp line" around the 50% point. Real transparency gradients ease in,
dwelling longer at the transparent end and compressing the transition.

Approximate an eased scrim with multiple color stops:
```css
/* Eased scrim: most of the alpha drops early, then a long thin tail toward zero */
linear-gradient(
  in oklab,
  oklch(0.10 0.00 0 / 0.85) 0%,
  oklch(0.10 0.00 0 / 0.45) 20%,
  oklch(0.10 0.00 0 / 0.18) 50%,
  oklch(0.10 0.00 0 / 0.06) 80%,
  oklch(0.10 0.00 0 / 0)    100%
)
```

The same principle applies to scroll-region edge masks (`mask-image: linear-gradient`).

---

## Gradient types by job

| Type | Primary job | Example |
|---|---|---|
| `linear-gradient` | Direction, overlay, scrim, surface texture | Card surface gradient, hero tint |
| `radial-gradient` | Focus point, glow, vignette | Hero ambient glow, spotlight effect |
| `conic-gradient` | Angular progress, color wheel | Pie chart, loading ring |
| "Mesh" / aurora | Atmospheric background, brand moment | Hero backdrop, landing page |

"Mesh gradient" has no native CSS — it is approximated by layering multiple large
`radial-gradient` blobs with heavy `filter: blur()`. A true mesh gradient (Figma's mesh,
Photoshop mesh warp) uses bicubic color interpolation over a control-point grid; in
production this is usually rasterized to an image. The programmatic GPU-shader approach
(GLSL, WebGL fragment) belongs to the `atelier:graphics` skill — when the design use of
gradient exceeds what CSS can express, that is the handoff point.

---

## Aurora / mesh gradients — use with restraint

Multiple soft radial color blobs (brand colors), blurred heavily, slowly drifting —
the "AI aesthetic" background that appeared everywhere in 2023–2025. It is a legitimate
design choice but has become a default-brand signal. Rules for using it intentionally:

- Limit to 2–4 color blobs (more adds visual noise, not richness)
- Keep saturation moderate — vivid blobs on a dark bg quickly feel garish
- Slow drift only (if animated): 15–30s cycles, not 3s
- Place readable content over a scrim or sufficiently dark/light region above the aurora,
  not directly over the gradient (contrast must hold)
- `prefers-reduced-motion`: stop the animation entirely

If this is the brand's signature choice, commit to it and tokenize the color stops and
animation parameters. If it is "I saw it somewhere and added it," remove it.

---

## Texture with intent

Like gradients, texture earns its place only with a job:

- **Depth:** noise grain over a large surface or background reads as material texture
  (paper, canvas, frosted glass) — adds tactility without decoration
- **Focus:** a texture that thickens or shifts at a focal element draws the eye
- **Brand:** a signature surface material (e.g., a particular grain on brand-moment cards)

Texture without a job is visual noise that competes with content. The threshold for
inclusion is the same as for motion: if you cannot name the job, remove it.

**Noise/grain types by appearance:**
- **Perlin / Simplex:** smooth, organic (clouds, smoke, natural material) — good for
  surface-material texture
- **Fractal Brownian Motion (fBm):** layered octaves of Perlin for added detail (the
  "hump" on top of the base noise)
- **Worley / Voronoi:** cellular, cracked, water-caustic patterns
- **Blue noise:** uniform, high-frequency — best for anti-banding; least visible as
  "texture"

**Film grain done correctly — luminance-dependent.** A uniform noise layer over an
entire surface does not look like film grain — it looks like a noise filter. Real film
grain is *luminance-dependent*: strongest in the midtones, weaker in deep shadows and
bright highlights. To approximate this in CSS, modulate the noise layer's opacity with a
luminance mask (a gradient or blend mode that reduces the grain at the extremes), or use
`mix-blend-mode: overlay` which naturally has this property (a 50%-gray blend layer is a
no-op; the grain's effect peaks in the midtones and falls off toward pure black and pure
white) — which is exactly the luminance dependence real film grain has. For a simpler
approach: `mix-blend-mode: soft-light` at very low opacity preserves the luminance
relationship adequately. Grain size (coarse vs fine) and whether it is monochrome or
color-shifted are additional decisions for a signature texture. A flat uniform noise
layer is recognizable as "someone added a noise filter"; luminance-weighted grain reads
as material quality.

For CSS-based texture (non-animated): generate with SVG `feTurbulence` → cache as a
`data-URI` image → tile with `background-repeat`. Regenerating noise on the fly is
expensive and gains nothing.

**Blend modes for texture integration:**
- `mix-blend-mode: overlay` — boosts contrast, darkens shadows, brightens highlights
- `mix-blend-mode: soft-light` — gentler; better for very subtle grain on mid-tones
- `mix-blend-mode: multiply` — darkens only; good for shadow-type texture
- Use on a pseudo-element with low opacity (0.02–0.05), never as a background property
  that fights the content

---

## Gradient text, border-gradient, and mask uses

- **Gradient text:** `background: linear-gradient(...); background-clip: text; color:
  transparent`. Caveat: contrast is not a single number — it varies across the text.
  Verify at the *lowest-contrast point*, not the average. This is most reliable over a
  solid background; over a gradient background, the math gets complex.
- **Gradient border:** `border-image: linear-gradient(...) 1` is the simplest method.
  Alternative: `background` on a pseudo-element with `padding-box` / `border-box` clip.
  Use when the border itself is a brand element.
- **Mask gradient (edge fade):** `mask-image: linear-gradient(to right, black,
  transparent)` fades the content of an element toward an edge — a scroll container's
  lateral fade, a text truncation fade. The mask is an alpha channel, not a visual layer.

---

## Animated gradients

Native CSS gradients cannot transition directly — the browser treats the whole gradient
as a single opaque value. To animate:

1. **`@property` (Houdini):** register a custom property as `<angle>`, `<color>`, or
   `<percentage>`. The browser can now interpolate it. Example: animate the direction
   angle of a gradient, or animate a color stop by registering it as a `<color>`.
2. **Opacity cross-fade:** pre-define two gradient states, cross-fade their opacity with
   `transition: opacity`. Simpler, less flexible.
3. **CSS `@keyframes` with `background-position`** on a gradient larger than the
   element: creates a sweep effect without JS.

Always pair animated gradients with `prefers-reduced-motion: reduce` — animated
backgrounds are among the highest-risk motion elements for vestibular disorders.

---

## Dark mode

Gradients built for a light surface do not simply invert for dark mode. Rethink:
- A light-to-transparent scrim becomes a dark-to-transparent one
- Surface gradients (L delta 1–3%) keep the same delta but from a dark base
- Color glows and ambient aurora work better on dark backgrounds — less scrim needed,
  colors can be more saturated
- Noise grain opacity may need adjustment (grain is often more visible on dark surfaces)

---

## Accessibility

- **Gradient text:** check contrast at the lowest-contrast point, not the average.
- **Text over a gradient background:** the contrast floor is the worst background color
  the text ever overlaps. Use a scrim layer to guarantee the minimum.
- **Animated gradients:** `prefers-reduced-motion` must stop or dramatically reduce the
  animation. A slowly drifting aurora is a mild risk; a fast-cycling gradient is a
  significant one.
- **Texture behind text:** keep grain opacity below the threshold where the user notices
  it. A visible texture competes with characters, especially for readers with dyslexia.

---

## Performance

- `filter: blur()` on large elements is expensive — it forces a composited layer and
  costs GPU memory proportional to element size. Limit aurora/mesh blurs to hero
  sections; do not use them in scrolling lists.
- SVG `feTurbulence` evaluated per-frame is expensive — rasterize to a `data-URI` image
  once and tile it.
- Stacking gradients + blur + noise + blend mode compounds the cost. Each layer adds to
  the compositing budget.
- Animated gradients with `@property` are GPU-friendly (the animation drives a single
  value, not a full repaint). Classic animated gradients that change color-stop values
  trigger repaint on every frame.

---

## Quick-reference (tokenizable / lintable)

| Item | Rule |
|---|---|
| Gradient has a job | Depth / focus / brand — name it or remove it |
| Interpolation | `in oklab` or `in oklch` — never default sRGB |
| Hue direction | oklch: `shorter hue` (default arc) / `longer hue` (scenic) |
| Banding | Grain dithering: blue noise (best) / feTurbulence (simpler) |
| Fade-to-transparent | Same-color zero-alpha, not `transparent` |
| Scrim alpha | Eased multi-stop, not linear |
| Aurora/mesh | 2–4 blobs; moderate saturation; commit or remove |
| Texture | Job only: depth / focus / brand |
| Grain blend | `overlay` or `soft-light`; opacity 0.02–0.05; pseudo-element |
| Gradient text | Check contrast at worst point |
| Animated gradient | `@property` for value interpolation; always `reduced-motion` path |
| Dark mode | Rethink, don't invert |
| Performance | Blur is expensive; feTurbulence cached; layers compound |

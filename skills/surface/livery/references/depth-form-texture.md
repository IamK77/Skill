# Depth, Form & Texture

> Depth is not "add a `box-shadow`"; form is not "add a `border-radius`"; texture is not "drop a noise PNG." Each is a physical model rendered through CSS, and every value is a **token derived from a small system** — one light direction, one elevation scale, one radius family, one interpolation space. Taste picks the system; the system enforces consistency. Governing rule: **every visual value must serve elevation / affordance / separation / curvature — never decorate ad-hoc, never map to nothing.**

## One light, four outputs

A single light source (almost always from above, slightly off-vertical) drives FOUR coordinated outputs, not one. "Raised" is a chord, not a single drop shadow:

1. **Drop shadow** — the diffuse shadow the object casts on the background behind it.
2. **Contact / occlusion shadow** — the tight, dark band hugging the bottom edge that "grounds" the object so it doesn't float.
3. **Top-edge highlight** — the upper edge catching the light.
4. **Surface gradient** — the face's own faint top-to-bottom luminance falloff.

All four must share the same light direction. "Looks like a real solid" vs "looks like CSS" is the difference between doing all four and doing only #1.

- **Top-edge highlight**: `box-shadow: inset 0 1px 0 rgba(255,255,255,.06–.12)`. A line of light, not a stroke. Critical in dark mode, where drop shadows nearly vanish — raise comes mostly from highlight + surface lightening.
- **Contact shadow**: offset/blur both `0–2px`, darker and tighter than the diffuse shadow. It is the tightest part of the ambient component (see below) — it pins the object to the surface.
- **Surface gradient**: L difference only `1–3%` (top slightly lighter), same direction as the light. More than that reads as a 1990s beveled button. This faint gradient is what makes a flat-color card read as a lit solid rather than a sticker — and it can fake material/curvature with no image (a vertical gradient = cylinder/sphere lighting; stacked gradients = a bevel).

## The physics of a real shadow (two components)

The default `box-shadow: 0 2px 4px rgba(0,0,0,.5)` misses the structure entirely. A real shadow has **two components**:

- **Key / direct shadow** — cast by the main directional light: sharper, offset, relatively tight (the umbra).
- **Ambient / contact shadow** — from diffuse light: soft, large, evenly wrapping the object (the penumbra + contact darkening).

Material's elevation model = **two shadows per level** (key + ambient). As elevation rises:

- The penumbra grows **softer and larger** (higher = bigger, softer, more diffuse blur).
- The contact shadow grows **lighter** (less occlusion when floating higher).

So a high level is not "just a bigger shadow" — it is **larger + softer + more diffuse + lighter contact**.

## Multi-layer shadows (the craft headline)

A single `box-shadow` decays roughly linearly in alpha and looks flat and CG. A premium shadow is **3–6 stacked layers** with doubling offset/blur and very low per-layer alpha, approximating the natural falloff of a real penumbra:

```css
box-shadow:
  0 1px  1px  hsl(H S L / .04),
  0 2px  2px  hsl(H S L / .04),
  0 4px  4px  hsl(H S L / .04),
  0 8px  8px  hsl(H S L / .04),
  0 16px 16px hsl(H S L / .04);
```

Doubling distance, equal (or further-decaying) low alpha. **Build the natural falloff by stacking, never with one high-alpha layer.**

## Tinting shadows & physically-correct blending

The cheapest leap in quality:

- **Never pure black.** Black shadows look dirty and gray out the color underneath.
- **Tint toward the surface/brand hue**: shadow = surface color at **lower L + slightly higher C**. "Shadows are saturated, not gray" — a painter's principle agents never apply.
- **Low per-layer alpha** (~`0.02–0.10`), moderate sum.
- **Dark-mode inversion**: on a dark base, shadows barely register. Express elevation by **lightening the surface (raising L)**, not deepening shadows. (Material dark uses incremental white overlays for elevation.)
- **Physically-correct on colored/image backgrounds**: a fixed-alpha black shadow grays out over brand colors or photos. Render the shadow as its own layer/pseudo-element with **`mix-blend-mode: multiply`** — it multiplies-darkens whatever sits beneath, correct on any background. Multiply + a hue-tinted shadow = correct across all backgrounds.

## Tokenized elevation / z-scale (the deliverable)

Define discrete levels mapped to component roles; each level = one multi-layer shadow token:

| Level | Role |
|---|---|
| 0 | Background / flush (no shadow) |
| 1 | Resting card / raised surface |
| 2 | Hover / interactive raise |
| 3 | Sticky / app bar |
| 4 | Dropdown / menu / popover |
| 5 | Modal / dialog |
| 6 | Toast / notification (highest) |

- **One light direction site-wide**: only size/softness vary by level; never mix shadow directions.
- **z-index order MUST match elevation order** (higher elevation also stacks higher).
- **Radius is part of the same physical model** — keep radii consistent within an elevation tier (radius + shadow together imply thickness and softness).

## Inset / pressed / recessed

- `inset` shadows for pressed states, grooves, and inputs (recessed feel). A pressed button = `inset` shadow + reduced outer shadow (it sinks).
- Neumorphism (dual inner+outer light/dark) is doable but **hostile to contrast accessibility** — use sparingly.

## Border vs shadow vs both (separation decision tree)

```
Need to separate a surface
    ├─ Loose, card-style UI   → whitespace + soft shadow (modern)
    ├─ Need a crisp edge      → shadow + a 1px low-alpha "ring"
    │     (0-offset, 0–1px-spread layer for a crisp edge)
    └─ Dense data UI (tables) → hairline (shadow would be too noisy)
```

- Modern default: **whitespace + shadow > hard border**; use a very-low-contrast 1px hairline for dense tables.
- **Ring + shadow combo**: a tight thin ring defines the crisp edge while a soft shadow gives depth — high-end UI stacks both.

## Depth is more than shadow (the full toolbox)

Shadow is one cue among many; **occlusion is the strongest**:

- **Occlusion / overlap** (one element covering another) — the strongest depth cue.
- **Surface brightness** (brighter = nearer, especially in dark mode).
- **Background blur** (`backdrop-filter: blur()` behind a modal = depth + focus).
- **Synchronized scale + shadow** (modal scales up on entry while its shadow grows — ties into motion).
- **Scrim / tint** (darken content behind a modal).
- **Atmospheric perspective** (distant = desaturated / cooler) — advanced.

## Backdrop blur / glass / scrim

- **`backdrop-filter: blur()`** for overlays, panels, nav over content → depth + readability (iOS/macOS vibrancy). Cost: **expensive** — limit area and count.
- **Scrim**: a semi-transparent layer behind a modal (black `0.4–0.6`, or a blurred+darkened backdrop) that pushes the background away and focuses the modal.
- True vibrancy needs blur radius + saturation boost + a tint layer.
- Glassmorphism = gradient + transparency + `backdrop-filter: blur()` + thin edge highlight. Text on glass: guarantee contrast against a variable background (solid fallback or contrast-guard layer).
- **Progressive blur** (iOS nav: content blurs more as it nears the bar): a single `backdrop-filter` can't vary radius → **stack multiple `backdrop-filter` layers, each masked to a band with a progressive-alpha gradient**, and use `mask-composite` to add/subtract masks. Premium, rarely done; keep layer count restrained.

## drop-shadow vs box-shadow

- **`box-shadow` follows the border-box** (rectangle, respects `border-radius`).
- **`filter: drop-shadow()` follows the alpha shape** — so **any non-rectangular element (transparent PNG, SVG icon, `clip-path` shape, squircle) MUST use `drop-shadow`**, or the shadow renders as a rectangle and the illusion breaks. This locks directly into the squircle/clip-path work below.

## Gradient type by use

- **linear** — directional fills (backgrounds, buttons, overlays). **radial** — spotlight / glow / hero backlight / vignette. **conic** — angular sweep (pie/donut charts, loading spinners, color wheels). **mesh** — multi-color blob blends (aurora backgrounds); no native CSS, approximate with stacked `radial-gradient` / blurred blobs / SVG.

## Gradient interpolation (the #1 non-default)

- **sRGB interpolation is broken**: between two saturated colors it passes through a "dirty gray dead zone" (blue→yellow goes through gray); complementary midpoints are ugliest.
- **Interpolate in OKLCH/OKLAB**: `linear-gradient(in oklch, blue, yellow)` — perceptually smooth, no dead zone, vivid throughout.
- **oklch vs oklab**, choose by intent:
  - **oklch** interpolates along the **hue wheel** (blue→yellow via green or purple; specify `shorter hue` / `longer hue`) — stays vivid, rotates hue.
  - **oklab** interpolates in a **straight line** (through a desaturated middle, no hue rotation) — direct mix.
- `<color-interpolation-method>` supports `in oklch / oklab / hsl / srgb` plus hue direction.

## Banding-free gradients & scrims

- **8-bit gradients step** (Mach banding), worst on large, low-contrast subtle gradients — exactly the premium use case. Fix: dither with a faint noise layer (below) AND add intermediate color stops over long distances (don't rely on two stops).
- **Eased gradients**: a linear ramp looks abrupt at the ends; a fade-to-transparent scrim needs **eased alpha** (multiple stops approximating an ease curve), or transparent→opaque reads as a hard edge. The `%` midpoint hint between stops shifts the curve.
- **The transparent-black gray-fog trap** (important): CSS `transparent` = **transparent black** `rgba(0,0,0,0)`. So `linear-gradient(red, transparent)` passes through a **grayed dark red** (interpolating toward black). Fix:
  - Use the **same color at 0 alpha**: `rgb(255 0 0 / 0)`, never `transparent`.
  - Combine with **oklab/oklch interpolation** + eased alpha. Same rule for text-darkening scrims over images.

## Gradients on text / borders / masks

- **Gradient text**: `background: linear-gradient; background-clip: text; color: transparent`.
- **Gradient border**: `border-image`, or the padding-box/border-box background trick, or a mask.
- **Gradient as mask**: `mask-image: linear-gradient(...)` — fade content edges (scroll-container edge fade) or reveal effects. A powerful non-default.
- **Animated gradients**: native gradients can't transition; register a custom property as `<angle>` / `<color>` with **`@property`**, then animate that. GPU-friendly to animate the registered angle; animating the stops themselves is paint-heavy.

## Texture & noise

- **Grain/noise overlay** adds tactile depth, dithers banding, and gives faux material. Source: SVG **`feTurbulence`** (fractal noise) or a tiled noise image, very low `opacity` (~`0.02–0.05` for a deband/grain layer), often with `mix-blend-mode: overlay` / `soft-light`. Fuse texture into an underlying color/gradient with **`background-blend-mode`** (vs `mix-blend-mode` which blends against what's behind the element).
- **Dithering truth — blue noise > white noise**: white (random) noise clumps and adds visible grain; `feTurbulence` is fractal (Perlin-ish) and also clumps at low frequency. **Blue noise (high-frequency, spatially uniform, no low-frequency clumping) debands cleanest** with far less visible noise — use a pre-generated blue-noise tile for static UI gradients. Ordered dithering (Bayer matrix) is deterministic and tileable (pixel/retro). Error diffusion (Floyd–Steinberg) is highest quality but not tileable — for static exports only.
- **Procedural noise, choose by look**: Perlin/Simplex (gradient noise — smooth, organic: clouds, smoke, terrain; Simplex is faster with fewer directional artifacts); Worley/Voronoi (cellular — cracks, caustics); fBm (fractal Brownian motion — octave-stacked detail); domain warping (noise warps noise's coordinates → swirls, marble). Per-frame/dynamic noise needs a **WebGL fragment shader (GLSL)**; CSS can't.
- **Film grain done right**: real grain is **luminance-dependent** — strongest in midtones, less in shadows/highlights — and has a grain size, mono vs color. Modulate noise by underlying luminance (a luma mask), don't flood a uniform layer.
- **Patterns**: repeating geometry via `repeating-linear-gradient` / `repeating-radial-gradient`, SVG `pattern`, or a tiled image. Generative variants: **Truchet tiles** (a small set of rotatable tiles randomly placed → continuous organic patterns) and parametric SVG `pattern` / Voronoi tiling. Material textures (paper/cloth) add skeuomorphic warmth — use very sparingly.
- **Performance**: large `feTurbulence` is expensive — **cache as a data-URI / single tile**, generate once and tile, never regenerate per frame. Use wrap-around sampling for seamless tiling.

## Environmental gradients (mesh / aurora) — with restraint

- **Faux mesh / aurora**: 2–4 soft brand-color radial blobs, heavy `filter: blur()` (or stacked `radial-gradient`), low saturation, slow drift; add a scrim/blur behind content for readability.
- **True mesh** = bilinear/bicubic color interpolation over a control-point grid (Figma/PS mesh); no native CSS — implement via SVG mesh (limited), per-pixel canvas, or a shader, then **rasterize to an image**. Don't conflate with stacked-radial faux mesh.
- **Restraint**: this is the modern hero background, but it is **becoming the AI default look** — don't overuse.

## Shape, radius & clipping

- **Radius scale (token)**: `0 / 2 / 4 / 8 / 12 / 16 / 24 / full(9999px)`. Map by element size/role — small radius for badges/inputs, medium for cards/containers, larger for modals/panels, `full` for pills/avatars. One "radius family" reads as one language; radius correlates with element size but stays coordinated, never random.
- **Concentric nesting (the most critical non-default)**: **`inner radius = outer radius − padding`**. For an element nested in a rounded container with padding `p`, the inner radius = `outer − p` so the arcs stay concentric and parallel. If inner = outer, the inner corner looks too sharp; if inner > outer−p, it bulges. Apply **recursively** per nesting level. Boundary: if `outer − p ≤ 0`, clamp inner to `0` (square) — never negative. The most direct fingerprint of polish; agents almost never tighten this.
- **Continuous curvature / squircle**: CSS `border-radius` makes a **circular arc** — straight edge has curvature 0, arc jumps to 1/r, **curvature is discontinuous at the join**, perceived as a subtle "kink." The premium fix is **G2-continuous superellipse / squircle** (Apple "continuous corners") where curvature transitions smoothly. Equation: `|x/a|^n + |y/b|^n = 1` (n=2 is a circle/ellipse, n→∞ approaches a rectangle, **n≈4–5 is a squircle**; Figma "corner smoothing 0–100%" approximates it). Implement via CSS `corner-shape: superellipse(...)` (emerging — verify browser support) or fall back to SVG `path` / `clip-path` / a squircle lib. Use on large, prominent surfaces (cards, modals, app icons, FAB, large buttons); small controls are fine with a plain arc.
- **Shape language via `corner-shape`** (emerging): beyond `round` — `bevel` (technical/industrial), `scoop` (playful/ticket), `notch` (a bite out of a card/tag), `squircle/superellipse` (soft/premium). A signature-level choice, not default-all-round.
- **Radius semantics / affordance**: rounder = friendly/soft/playful/more tappable; sharper = serious/technical/dense/data. Map brand personality to a radius "temperature." A full pill = a complete, atomic action/tag; a rectangle = part of a grid/continuous content.
- **Directional / asymmetric radius** (`border-radius: TL TR BR BL`): tabs round only the top two corners; bottom sheets round only the top; chat bubbles round three and leave one **sharp corner pointing at the sender** — the sharp corner encodes origin/ownership. Directional radius carries attachment/orientation meaning, not decoration.
- **Optical & boundary handling**: with a border, inner radius = `r − border-width` (CSS auto-handles it; compute it yourself in hand-rolled SVG/double layers or the border corner deforms). Clip nested content: a rounded container needs `overflow: hidden` (or `clip`) or images/dividers poke past the corners; inset dividers or clip to the container. Watch anti-aliasing quality at large radii or when combined with transforms.
- **Responsive / full-bleed**: scale radius with size (an oversized radius looks disproportionate on small screens); when a card goes full-bleed to the viewport edge, **zero the radius on the touching side** — nothing should stay rounded against a screen edge.

## Performance

- Large blurred `box-shadow` on many elements = high paint cost.
- **Don't animate `box-shadow` parameters** (repaints) — cross-fade the `opacity` of two pre-rendered shadows, or use a pseudo-element.
- `backdrop-filter` is a heavy GPU load; `filter: blur()` on large blobs is expensive (rasterize / use `will-change` carefully); stacked layers (gradient + blur + noise + blend) compound cost.
- `border-radius` is cheap, but many rounded + `overflow:hidden` clips + large blur shadows together eat paint.
- Landing ladder for generated effects: **CSS declarative → canvas/SVG procedural rasterized to a cached image → WebGL fragment shader** for dynamic/per-frame. Always rasterize static procedural effects to one image; never recompute per frame.

## Accessibility

- Shadow must not be the **only** signal for state/affordance (faint shadows are imperceptible to some).
- Cards separated by ultra-faint shadow alone may be indistinguishable to low vision — guarantee enough separation.
- Text over gradients/glass: meet contrast at the gradient's **worst point**, not the average (scrim or contrast-guard layer).
- **Focus ring visible on any background**: use a **double ring** — high-contrast inner (e.g. white) + accent-color outer — visible on light and dark. Pair with `:focus-visible`. Use a zero-offset low-blur `box-shadow: 0 0 Npx <accent-color>` in the element's own accent color for activated/glow/neon emphasis, distinct from structural elevation shadows.
- Busy textures hurt readability (especially dyslexia) — keep texture behind text very faint.
- Animated gradients respect `prefers-reduced-motion` (reduce/stop; they distract and can trigger vertigo).

## Dark mode

- Express elevation by lightening surfaces (raise L) + top-edge highlight, not by deepening shadows.
- Re-tune gradients for the dark base (a light gradient on a dark base is wrong); glows read better on dark; adjust noise opacity.
- Wide-gamut: gradient in P3 / Rec2020 (`color(display-p3 …)` / `color(rec2020 …)`) for richer transitions on HDR displays (verify support / HDR metadata before shipping).

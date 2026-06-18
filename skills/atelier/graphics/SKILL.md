---
name: graphics
description: >
  The advanced visual layer for a frontend build — where icons, imagery, Canvas, WebGL, GPU,
  and generative technique live, and where "random icon packs", "hero image that tanks LCP",
  and "three.js because it looks cool" are decided. Use after the core visual language is set
  (color, type, form), when establishing or auditing the graphics and generative layer, or when
  a UI uses icons that don't match, images that shift layout, or animated surfaces that drain
  the budget. The one shift: the DOM is the default and the budget — you drop to Canvas / SVG /
  WebGL / GPU only where the DOM genuinely cannot go, ALWAYS with a fallback and a perf budget,
  and icons come from ONE coherent set (matched stroke, grid, optical size). The agent reaches
  for canvas/three.js as a reflex, mixes three icon families, lazy-loads the LCP hero, and feels
  no wrongness — so the escape-to-GPU and the icon/imagery systems must be decided and gated.
  Triggers on "icon / icon set / icon pack / SVG icon / icon font", "image / hero / LCP / CLS /
  layout shift / srcset / lazy load / AVIF / WebP / blurhash / placeholder", "illustration /
  spot illustration / empty state / art direction", "canvas / WebGL / WebGPU / three.js /
  PixiJS / shader / GLSL / WGSL / SDF / raymarching", "GPU / generative / procedural /
  particle / data visualization / Deck.gl", "retina / devicePixelRatio / HiDPI / blurry canvas",
  "icon accessibility / aria-hidden / icon-only button", "duotone / photo treatment".
argument-hint: "[the UI / component / page where icons, imagery, or canvas/GPU rendering lives]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# graphics

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A graphics studio keeps every rendered mark — the icon drawn to a keyline, the hero photograph boxed to its ratio, the procedural surface compiled to the GPU — under a discipline that makes the whole surface read as one hand at work. `graphics` is the advanced visual lens of the `atelier` suite: where the other skills decide what color the surface wears and how the type scales, `graphics` decides **what renders when the document model can't**, and makes that too a **system**, not a pile of ad-hoc choices. Its product is a written **graphics contract**: one icon system (one family, one stroke, one optical-size rule), one imagery system (allowed ratios, CLS-proof pipeline, loading strategy, alt discipline), and a disciplined Canvas / WebGL / GPU layer with a DOM fallback and a frame budget — each committed *before* any component consumes them. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it.

**The governing fact: the DOM is the default and the budget — escape to Canvas/WebGL/GPU only where the DOM genuinely can't go, always with a fallback, always within a frame budget, and always with one coherent icon set and an aspect-ratio-boxed imagery system.** Mixed icon packs (three families, different strokes, mismatched corners), a hero `<img>` with `loading="lazy"` (the single most common way to wreck LCP), canvas blurry on retina because no one applied the `devicePixelRatio` fix, or three.js imported for a UI that a `<div>` and a CSS transition could have handled — each is a default move, and their sum is the technical and visual noise the eye and the profiler both read as wrong without being able to name it.

This is where the agent era bites:
- **The agent reaches for canvas/three.js as a reflex.** It imports WebGL infrastructure for a quantity selector, a CSS animation for a data chart, a shader for a hover effect — each because the API is there and the cost isn't felt. The DOM has a ceiling, but that ceiling is high; the escape-to-GPU must be *earned*, with a fallback written and a budget held.
- **The agent mixes icon families without noticing.** Lucide here, Heroicons there, a rogue Material icon pulled for a specific shape — each defensible in isolation, the set immediately amateur. Stroke weights, optical sizes, corner radii, endpoint styles: a mixed bag gets every one of these wrong. One family, or a written spec for everything drawn.
- **The agent lazy-loads the LCP hero.** `loading="lazy"` is a sensible default for most images; applied to the above-the-fold hero it cracks the LCP score in half. The LCP image gets `loading="eager"` + `fetchpriority="high"` + a `<link rel="preload">` in the head. This is the rule the agent consistently breaks.
- **The agent skips the retina fix.** A `<canvas>` on a 2× display is blurry unless the backing pixel buffer is scaled by `devicePixelRatio` and CSS holds the logical size. The agent sets up the canvas loop, ships the blur, and moves on.
- **The agent treats accessibility as optional.** Canvas and WebGL are accessibility black holes — no DOM, no semantics, AT sees nothing. A fallback (`<canvas>` fallback content, a parallel accessible DOM, a data table) is non-negotiable; without it the feature is invisible to a screen reader. And an icon-only button without an `aria-label` is equally invisible.

**Read [references/dom-vs-canvas-vs-webgl-and-fallback.md](references/dom-vs-canvas-vs-webgl-and-fallback.md) first** — the decision tree that earns each escape from the DOM, the fallback contract, and the frame budget. Load at the start, re-check at every gate.

**Speak the user's language.** The decisions are the user's — which icon family, which allowed aspect ratios, which generative technique fits the surface. Read their fluency and gloss terms on first use (*keyline / optical sizing*, *immediate mode vs retained scene graph*, *HiDPI / devicePixelRatio*, *CLS / aspect-ratio*, *LCP / fetchpriority*, *SDF / signed distance field*, *GLSL / WGSL*, *fallback path*, *frame budget / 16.7ms*). A rendering pipeline the user can't trace is imposed infrastructure, not shared craft.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/dom-vs-canvas-vs-webgl-and-fallback.md](references/dom-vs-canvas-vs-webgl-and-fallback.md)** — the escape-from-DOM decision tree (SVG / Canvas 2D / WebGL / WebGPU thresholds), the DOM-first principle, the fallback contract and accessibility requirement, the Canvas non-defaults (retina fix, render loop, hit detection, OffscreenCanvas), and the perf budget.
- [references/icon-system.md](references/icon-system.md) — one family (stroke-width, grid, optical size, keyline equality), implementation (inline SVG + currentColor), style-as-state-encoding (line/solid/duotone), accessibility (decorative vs meaningful, hit target, contrast), metaphor discipline, and extending the set to spec.
- [references/imagery-and-illustration.md](references/imagery-and-illustration.md) — the responsive/art-directed image pipeline (AVIF → WebP → JPEG, srcset/sizes, picture), CLS prevention (aspect-ratio-boxed, width/height always set), LCP rule (never lazy), placeholder strategy (LQIP/BlurHash), illustration system (palette discipline, spot library), photo treatment (duotone, scrim, dark mode variants), and alt-text discipline.
- [references/canvas-webgl-gpu.md](references/canvas-webgl-gpu.md) — GPU execution model (SIMT, branchless), shader craft (SDF, raymarching, procedural noise, GLSL toolbox), linear color workflow, antialiasing, 3D math (MVP, quaternions), draw-call minimization (instancing, atlases, LOD, culling), CPU-GPU sync stalls, WebGPU compute/GPGPU, and the library ladder (Three.js / react-three-fiber / PixiJS / Deck.gl / p5.js).

> **The arc is one graphics contract.** Four stages — fallback contract · icon system · imagery system · Canvas/WebGL/GPU — turn a surface with ad-hoc visuals into one governed by a single rendering discipline: the DOM is the default; icons read as one hand drew them; images never shift layout or break LCP; generative/GPU work earns its place with a fallback and a budget. `graphics` runs after the core visual language is set (color, type, form) and its contract is what the surface's visual integrity depends on at the advanced layer.

> **Greenfield or retrofit? The entry differs, the gates do not.** Starting clean: walk STAGE 0→3 in order. Auditing an existing surface: inventory first — every icon family in use, every `<img>` missing `aspect-ratio` or mis-using `loading="lazy"`, every canvas call missing the dpr fix — then bring that inventory to STAGE 0 and run the gates unchanged. The inventory tells you what exists; the gates tell you what's right.

---

## STAGE 0 — The fallback contract (DOM-first; when to escape; perf budget)

Open **[references/dom-vs-canvas-vs-webgl-and-fallback.md](references/dom-vs-canvas-vs-webgl-and-fallback.md)**. Decide the rendering boundary *before* any canvas or WebGL code is written.

- **DOM / SVG is the default.** A DOM or SVG solution is always preferred unless it genuinely cannot do the job — not "it's easier in canvas", not "three.js is already in the dependencies." The threshold for escape is *real*: SVG handles vectors, per-element interaction, and semantics up to ~1–5k elements; Canvas 2D handles raster and thousands+ of shapes with no semantic requirement; WebGL/WebGPU handles 3D, 100k+ elements, shaders, and GPU compute. Name the reason for crossing the threshold before writing a single canvas line.
- **Every canvas/WebGL surface carries a written fallback.** `<canvas>` fallback content (a static image, a description), a parallel accessible DOM mirror, or a data table/text alternative — one of these is non-negotiable. Canvas and WebGL are accessibility black holes; AT sees only what is in the DOM alongside them.
- **A frame budget is set and held.** Every rendering loop has a target: 16.7ms (60fps) for interactive surfaces, a named lower limit for background/decorative surfaces. The budget lives in a comment; it is measured against on the gate, not assumed.
- **The DOM-first rule applies to animation too.** CSS transforms and `opacity` run on the compositor thread without touching layout or paint; that handles the majority of animation use-cases. Canvas or WebGL animation is for work CSS genuinely cannot do.

### GATE — clear before ICON SYSTEM
1. `checklist check fallback dom-first-and-fallback-contract`
2. `checklist verify fallback`

---

## STAGE 1 — The icon system (one set; matched stroke, grid, optical size)

Open **[references/icon-system.md](references/icon-system.md)**. The icon system is decided and written down *before* any icon is placed in a component.

- **One family, not mixed.** Choose one: Lucide / Phosphor / Heroicons / Material Symbols / Tabler — or write a spec and draw to it. Any icon from outside the chosen family that enters the codebase makes the surface read as assembled, not designed. If the family lacks a needed icon, **draw a new one to the same spec** (grid, stroke-width, padding, corner-radius, endpoint style) and record it.
- **The system is a written spec.** Grid size (commonly 24×24; also 16/20/48), safe-area padding (~2px on a 24 grid), stroke-width (one width across the set, related to the adjacent text weight), corner radius, endpoint style (`stroke-linecap` / `stroke-linejoin` must match the family), and style vocabulary (which style is the default; which is the active/selected state). Without this spec, every new icon is a hand-pick.
- **Optical sizing over pixel equality.** Keyline shapes (square/circle/portrait/landscape rectangles) define visual equal-size. A circle must be drawn *slightly larger* (overflowing the keyline) to read the same size as a square. An icon sits at ~cap-height optically centered on its text line, not naively "same px." At 16px, pixel-fit to the grid; don't just scale a 24px master down (or use a family that ships per-size art). The stroke-scaling bug: scaling an SVG scales its stroke too — fix with `vector-effect: non-scaling-stroke`.
- **Implementation: inline SVG + currentColor.** Inline SVG is CSS-controllable, accessible, crisp, and animatable. `fill`/`stroke: currentColor` makes the icon inherit its text color and respond to every state (hover/active/disabled) for free. Remove fixed `width`/`height`, keep the `viewBox`, let CSS control size. SVG sprite (`<use href="#icon">`) for high-repeat cases. Icon fonts: avoid in new systems (legacy, a11y-broken, single-color; variable icon fonts are the modern exception).
- **Style-as-state encoding.** Pick one primary style (line or solid); the other is reserved for state (line = default/inactive, solid = selected/active). Duotone (low-opacity secondary fill + stroke) adds depth or brand. Random mixing of the three styles within a set is the tell.
- **Accessibility is non-negotiable.** Decorative icon (a text label is already visible): `aria-hidden="true"` + `focusable="false"`. Icon-only button (no visible label): `aria-label` or visually-hidden text — **an icon-only button with no accessible name is invisible to a screen reader.** Hit target ≥44px (padding brings a 24px icon up). Contrast ≥3:1 (WCAG 1.4.11). Icon-only buttons carry a tooltip that is keyboard- and screen-reader-reachable. Don't lean on obscure metaphors alone; pair with a text label when universality is in doubt.

### GATE — clear before IMAGERY
1. `checklist check icons icon-system-one-family-written-spec`
2. `checklist verify icons`

---

## STAGE 2 — Imagery & illustration system (aspect-ratio-boxed, CLS-free, LCP-safe)

Open **[references/imagery-and-illustration.md](references/imagery-and-illustration.md)**. The imagery pipeline is decided *before* any `<img>` is placed in production code.

- **Every image is aspect-ratio-boxed.** Define a fixed set of allowed ratios (e.g. 16:9 / 4:3 / 1:1 / 3:2 / 21:9) used consistently. Every image element carries `width`+`height` or an `aspect-ratio` declaration so the browser reserves space before the image loads — **this is the highest-leverage non-default for preventing CLS.** A layout-shifting hero image is almost always a missing `aspect-ratio`. Use `object-fit: cover` + `object-position` for focal-point cropping across ratios.
- **The LCP rule.** The above-the-fold / LCP hero image is **never** lazy-loaded: `loading="eager"` + `fetchpriority="high"` + a `<link rel="preload">` in the `<head>`. Everything below the fold gets `loading="lazy"` + `decoding="async"`. Lazy-loading the LCP image is the single most common way to crater the LCP metric.
- **Format ladder.** AVIF (best compression, ~50–65 quality) → WebP (broad support, ~75–80 quality) → JPEG/PNG fallback — served with `<picture>`/`<source>`. Vectors, icons, logos: SVG. Use an image CDN (Cloudinary / imgix / Next Image) to transcode and resize on demand rather than pre-baking every variant. `srcset` + `sizes` for responsive resolution; `<picture>` + `<source media="...">` for art direction (a different crop or image per viewport, not just a smaller file).
- **Placeholder strategy.** The box is already reserved by `aspect-ratio`. Fill it: LQIP/blur-up (a tiny blurred base64 placeholder or a BlurHash/ThumbHash token, cross-faded to the full image on load) or a dominant-color block. This turns a blank-then-pop into a perceived-fast blur-in.
- **Illustration system.** Drawn art is its own spec: line-weight (or fill-only), palette (from the brand color scale + a small set of illustration-only additions), perspective (flat / isometric / 2.5D), detail level, character style (proportions, diversity of representation), texture/grain, shape language. A spot-illustration library (empty state, onboarding, error, success) from one consistent set. Without a spec, every illustration is a hand-pick that clashes with the next.
- **Photo treatment.** Unify mismatched photography: color grade (LUT-style), consistent saturation/contrast, a tint overlay, grain. Duotone (map grayscale to two brand colors via `feColorMatrix` or `mix-blend-mode` + gradient) pulls any photo into the brand — premium, non-default. Scrim (gradient overlay) for text-over-image legibility.
- **Dark mode.** Illustrations need a dark variant (or `currentColor`/CSS-variable theming) — light-background art on a dark page gets white fringes. Transparent-PNG white anti-aliased edges show on dark → use SVG or correct alpha. Logos ship light and dark versions. Photos can take a different treatment or a slight `filter: brightness(.85)` to cut glare.
- **Alt-text discipline.** Describe the image's purpose/meaning in context, not its literal pixels. Informative → concise, meaningful `alt`. Decorative → `alt=""` (empty, so SR skips it — a *missing* `alt` makes SR read the filename). Functional image (is a link/button) → `alt` describes the action. Complex image (chart) → short `alt` + adjacent long description. Never start with "image of." Text baked into an image is inaccessible; if unavoidable, the `alt` must contain that text.
- **Governance mechanism.** Enforce the pipeline structurally with a single `<Image>` wrapper component (Next/Image et al.) that bakes in format selection, `srcset`, loading strategy, `aspect-ratio`, placeholder, and **mandatory `alt`** — so every image is handled correctly by construction.

### GATE — clear before CANVAS/WEBGL
1. `checklist check imagery imagery-and-illustration-system`
2. `checklist verify imagery`

---

## STAGE 3 — Canvas / WebGL / GPU & generative technique (earned escape, shader craft, fallback path)

Open **[references/canvas-webgl-gpu.md](references/canvas-webgl-gpu.md)**. Every canvas or WebGL surface has a fallback path, a frame budget, and a named reason for leaving the DOM.

- **Canvas 2D non-defaults (all of these are skipped by default).** Immediate mode means redrawing every frame — you hold your own model, there is no retained scene graph; the mental shift from declarative DOM is real. **The retina fix (non-negotiable):** backing pixel buffer = CSS size × `devicePixelRatio`, then `ctx.scale(dpr, dpr)`, CSS size kept at logical values — without this, every canvas is blurry on 2× displays, always. Render loop: `requestAnimationFrame` (syncs to display, auto-pauses on hidden tabs); use delta time for frame-rate-independent motion. State: `save()`/`restore()` around transforms; don't leak. Performance: `OffscreenCanvas` + Web Worker (render off the main thread); layering (static + dynamic on separate canvases); dirty rectangles (redraw only changed regions); batch by style (`fillStyle` switches are costly); `Path2D` to cache paths; avoid `getImageData` on the hot path (forces sync flush); avoid sub-pixel positioning (blurry). Hit detection: none — implement it (`isPointInPath` or an offscreen hit-canvas with a unique color per object). Text: `measureText` exists; line-breaking is your own.
- **WebGL fundamentals that matter.** The pipeline: vertices → vertex shader → rasterization → fragment shader → pixels. You write the shaders (GLSL). Uniforms (per-draw constants), attributes (per-vertex), varyings (interpolated). Clip space / NDC coords; render-to-texture via framebuffers. WebGL2 adds instancing, transform feedback, MRT. Prefer the library ladder: **Three.js** (3D default) / **react-three-fiber** (declarative 3D) / **PixiJS** (fast 2D) / **Deck.gl** (large-scale data viz / maps) / **p5.js** (creative coding) — write raw WebGL only for fine control.
- **GPU execution model and shader craft.** The fragment shader is a pure function `(uv) → color` running once per pixel in massive parallel (SIMT) — no shared state. Branches are expensive (divergence: both paths execute, one is discarded); write branchless: `step` / `mix` / `smoothstep` / `clamp` instead of `if`. SDF (signed distance fields): encode shapes as "distance from this point to the shape boundary" — resolution-independent forms, crisp text, rich effects (Inigo Quilez route). Raymarching: render 3D by marching through SDFs inside a single fragment shader. Procedural noise: Perlin / Simplex / Worley. GLSL toolbox: `mix / step / smoothstep / clamp / dot / cross / length / normalize / fract / mod`.
- **Linear color workflow (a classic bug).** Do math in linear space, encode to sRGB on output. "Lighting / blending looks washed-out gray" almost always means math is happening in gamma (sRGB) space. Decode sRGB → linear → compute → encode. Use premultiplied alpha to avoid black edge fringes; HDR/float textures for high-range work. Canvas `colorSpace` can be set to `display-p3` for wide-gamut surfaces.
- **Antialiasing.** Aliasing = undersampling. MSAA (geometry edges) / FXAA or SMAA (post-process) / TAA (temporal). Mipmaps fix minification aliasing; anisotropic filtering improves diagonal texture; `nearest` for pixel art, `linear` otherwise. Dithering/blue noise against banding (connects to gradients in form).
- **3D math.** MVP pipeline (model → view → projection): the matrix chain that puts a world point on screen. Quaternions for rotation — avoid Euler angles and gimbal lock. Raycasting/picking for screen↔world coordinate mapping. Normal matrices for correct lighting transforms.
- **Performance diagnosis and optimization.** First identify the bottleneck type: vertex-bound / fillrate-bound / bandwidth-bound / CPU-GPU sync stall — then apply the right fix. Minimizing draw calls is the first principle: instancing (draw many copies in one call), batching (one geometry + one draw call), texture atlases (fewer bind calls), LOD (simpler geometry at distance), frustum/occlusion culling (don't draw what's not visible), texture compression (ASTC/ETC/Basis). Frame budget: ~16.7ms (60fps). CPU-GPU sync stalls: `readPixels` / `getImageData` / `gl.finish` force synchronization — keep them off the hot path. Explicitly release GPU resources (textures, buffers) or leak GPU memory. Pause on hidden tabs (Page Visibility API).
- **WebGPU and GPGPU.** WebGPU is the modern, lower-overhead successor (Vulkan/Metal/D3D12-based, WGSL shaders, explicit pipeline-state objects + bind groups). Its key addition: **compute shaders** for general GPU compute — particle systems, fluid/physics simulation, image processing, ML inference — not just rendering. GPGPU work thinks in workgroups/threads and parallel algorithms (reduction, prefix-sum). Worth it for large data-parallel work that tolerates upload/readback overhead. Verify support before shipping (Chromium-first, emerging).
- **Integration non-negotiables.** Context loss: the GPU can reclaim your WebGL context (`webglcontextlost`) — you must listen and restore. Coordinate mapping: pointer/touch → canvas coords via `getBoundingClientRect` + dpr. Resize: `ResizeObserver` to reset canvas size + dpr. Tainted canvas: a cross-origin image without CORS blocks `getImageData`/`toDataURL` — textures need `crossOrigin`.

### FINAL GATE
1. `checklist check canvas canvas-webgl-gpu-with-fallback-and-budget`
2. `checklist verify canvas`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`graphics` is the suite's **advanced rendering conscience** — the place where the DOM's ceiling is honestly named and the work that earns the right to cross it is gated. It runs after the core visual language (color, type, form) is set, and its contract — one icon family, aspect-ratio-boxed imagery, LCP-safe loading, and a canvas/WebGL layer with a DOM fallback — is what the surface's visual integrity depends on at the advanced layer. The through-line is the suite's own — *push correctness into structure* — applied to rendering: an icon drawn to a written spec can't drift the way a hand-picked icon can, an image with a mandated `aspect-ratio` can't shift layout, a canvas loop with a written frame budget can't silently bloat. The line that keeps `graphics` honest: **the references hold the encodable technique (which GPU execution model, how a retina fix works, how a BlurHash cross-fades); the taste decisions — which icon family, which allowed aspect ratios, which generative technique fits the surface's purpose — stay gates the user clears.** Blur that line and the skill becomes a rendering tutorial; hold it and it stays a craft lens.

## Anti-patterns (use as a pre-flight checklist)

- **Mixed icon families** — two families in one surface; strokes, grids, and corner radii all disagree; the surface reads assembled, not designed.
- **No written icon spec** — icons placed by feel rather than derived from a system; extending the set produces obvious forgeries.
- **Icon-only button without accessible name** — invisible to a screen reader; `aria-label` or visually-hidden text is non-negotiable.
- **Decorative icon without `aria-hidden`** — the screen reader reads it anyway; add `aria-hidden="true"` + `focusable="false"`.
- **Stroke-scaling bug** — scaling an SVG icon scales its stroke; the set goes inconsistent; fix with `vector-effect: non-scaling-stroke` or per-size art.
- **Image without `aspect-ratio` or `width`/`height`** — CLS waiting to happen; the browser can't reserve space; always set one.
- **Lazy-loading the LCP hero** — the single most common LCP bust; the hero image gets `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">`.
- **No format ladder** — serving JPEG when AVIF would be half the bytes; use `<picture>` + AVIF → WebP → JPEG.
- **Art direction ignored** — a single crop scaled down on mobile instead of a viewport-matched crop via `<picture>`.
- **No placeholder strategy** — blank box then pop; implement LQIP / BlurHash cross-fade or a dominant-color block.
- **Canvas without the retina fix** — blurry on every 2× display; always multiply canvas backing size by `devicePixelRatio` and scale the context.
- **Canvas/WebGL without a fallback** — an accessibility black hole; always provide fallback content, a parallel DOM, or a data alternative.
- **WebGL imported for a DOM job** — the DOM/CSS/SVG ceiling is higher than assumed; name the reason for the escape before writing a canvas line.
- **Fragment shader with branches on the hot path** — divergence means both branches execute; rewrite with `step` / `mix` / `smoothstep`.
- **Math in gamma space** — "washed-out gray" blending; always decode sRGB → linear before arithmetic, encode on output.
- **draw call per object** — the classic WebGL bottleneck; batch, instance, use texture atlases.
- **`readPixels` / `gl.finish` on the render loop** — CPU-GPU sync stall; keep them off the hot path.
- **No `webglcontextlost` handler** — the GPU will eventually reclaim the context; handle and restore.
- **No resource release** — textures and buffers held forever; explicit cleanup or GPU memory leaks.
- **Skipping a GATE** — and remember: every rendering choice should trace to a written contract; if it doesn't, you picked it by hand.

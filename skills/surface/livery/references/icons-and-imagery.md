# Icons & imagery — and when the DOM gives way to canvas

Icons, photos, and illustrations are not "pick a library, drop a `<img>`." They are three token systems plus one technical pipeline, all governed by the same law as color and type: **every visual value derives from a small system, never ad-hoc.** An icon set has a stroke-width, a grid, an optical-size rule; imagery has an allowed aspect-ratio set, a format ladder, a placeholder strategy; illustration has a palette and a perspective. The agent's failure mode is the mixed bag — three icon packs, random stock photos, layout-shifting hero images, a late webfont's cousin: a hero `<img>` lazy-loaded into a CLS spike. This doc holds the encodable technique behind the form gate's icon/imagery line; **taste decides the system, the system enforces consistency.** The last section is the escape hatch: when the DOM genuinely can't render it, drop to canvas/WebGL — and always leave a DOM fallback.

## A coherent icon system (one hand drew them all)

"System" means consistency across **stroke-width, grid/size, corner radius, optical weight, style (line/solid/duotone), and metaphor vocabulary** — so every icon reads as drawn by one hand. The number-one failure is mixing packs: different strokes, grids, and endpoints scream amateur at a glance. **Use one family** (Lucide / Phosphor / Heroicons / Material Symbols / Tabler) or draw to one written spec — never combine.

- **Grid & safe area.** Icons live on a pixel grid (commonly 24×24; also 16/20/48) with built-in padding (~2px on a 24 grid → ~20px live area). Padding gives optical breathing room and keeps icons aligned to text.
- **Keyline / optical sizing.** The grid carries keyline shapes (square / circle / portrait / landscape rectangles) defining *visual* equal-size. A circle must be drawn slightly **larger** than a square (overflowing the keyline) to read as the same size. This is optical equality, not pixel equality — the agent never does it.
- **Align to text optically.** In UI, an icon sits at ~the **cap-height** of its line and is optically centered — not naively "same px as the font-size."
- **Per-size optical drawing.** Scaling a 24px icon down to 16px usually looks muddy. Small sizes need pixel-fitting to the grid, or icons drawn fresh per size (Material Symbols, Phosphor ship per-size art). Don't just shrink one master.

## Stroke weight & the stroke-scaling trap

- **One stroke width across the set** (e.g. 1.5 or 2px on a 24 grid), related to the weight of the text it sits beside (heavier text → heavier icon). Balance *optical* weight too: a detailed/filled icon reads heavier than a sparse one.
- **The stroke-scaling bug (non-default fix).** Scaling an SVG scales its stroke with it: a 24px@2px icon shrunk to 16px now has a 1.33px stroke — too thin, inconsistent with the set. Fix with **`vector-effect: non-scaling-stroke`**, or per-size optical icons, or a stroke-width set per size. An agent that just scales gets a noisy set.
- **Variable icon fonts** (Material Symbols) expose `weight` / `fill` / `grade` / `optical-size` axes — animate `fill` on selection, lift `grade` in dark mode. Frontier, non-default.

## Style as state encoding (line / solid / duotone)

Pick **one primary style**; use the others as a *systematic* state code, never random mix.

- **Line (stroke)** — default / inactive / lighter.
- **Solid (fill)** — active / selected / emphasis. The classic pattern: a tab icon is line when unselected, solid when selected — line-vs-solid *encodes state*.
- **Duotone** — a low-opacity secondary fill plus the stroke, for depth/brand.
- If the base is line, every base icon is line and solid is reserved for state.

## Implementation: inline SVG, sprite, font

- **Inline SVG (modern default).** CSS-controllable, accessible, crisp, animatable. Pair with **`currentColor`** (`fill`/`stroke: currentColor`) so the icon **inherits text color** and tracks hover/active/disabled state *for free*. This is the key non-default move.
- **SVG sprite** (`<use href="#icon">`) — one cached file, referenced many times; good for high-repeat icons.
- **Icon fonts** — legacy, problem-laden (a11y, anti-aliasing, FOUT, single-color only, wrong semantics — a font is for text). Avoid in new systems (variable icon fonts are the modern exception).
- **Optimize.** Run SVGO to strip metadata; keep the `viewBox` but **remove fixed `width`/`height`** so CSS controls size; avoid inline styles that leak.

## Icon accessibility (the minefield)

- **Decorative icon** (a visible text label sits beside it): `aria-hidden="true"` + `focusable="false"` so screen readers skip it.
- **Meaningful icon** (icon-only button, no visible text): MUST have an accessible name — `aria-label` on the button or visually-hidden text. **An icon-only button with no label is invisible to a screen reader.**
- **Icon-only buttons get a tooltip** that is keyboard- and SR-reachable, not hover-only.
- **Hit target ≥44px.** A 24px icon still needs padding (and spacing) to reach a 44px touch target.
- **Contrast ≥3:1** (non-text, WCAG 1.4.11); disabled icons are exempt but shouldn't vanish entirely.
- **Don't rely on an obscure icon alone** to carry meaning — hamburger and overflow-dots are *learned*, not universal; pair unusual icons with a label.

## Metaphor & semantic consistency

- **One concept = one icon**, everywhere (don't use two different glyphs for "delete"). Keep an icon↔meaning vocabulary.
- Use **conventional metaphors** (trash = delete, magnifier = search, gear = settings); for functional icons, **recognition > novelty** — don't be clever with obscure symbols.
- Avoid culture-specific / dated metaphors (floppy = save is contested; the mailbox flag is American). When a metaphor isn't universal, **add a text label** (icon + label beats icon-only).

## Icon color & motion

- `currentColor` makes hover / active / disabled states come **free** from the text color cascade. Active/selected uses the solid variant or an accent.
- Semantic icons (green check = success, red = error) use semantic color **but never color alone** — the shape must also carry the meaning. Functional UI icons stay **monochrome / currentColor**; reserve multi-color for illustration or brand accents.
- Icon transitions are signature micro-interactions: line↔solid, **hamburger↔X**, **play↔pause**, chevron rotation, checkmark draw-on — via SVG path morph, `stroke-dashoffset` (draw-on), or cross-fade. Always respect `prefers-reduced-motion`.

## Extending the set

When the family lacks an icon, **draw a new one to the same spec** (grid, stroke, padding, radius, endpoint style) until it's indistinguishable, and record the spec. Critically, match **`stroke-linecap` / `stroke-linejoin`** to the family (Lucide uses round caps/joins) — mismatched endpoints/corners give the forgery away instantly.

## Responsive & art-directed imagery (the format/perf pipeline)

This whole section is an agent blind spot. The image element is the source of CLS, blown LCP, and over-fetched bytes unless engineered.

- **Format ladder:** **AVIF** (best compression) → **WebP** (broad support) → JPEG/PNG fallback, served via `<picture>`; vectors/icons/logos stay **SVG**. Quality targets ~50–65 for AVIF, ~75–80 for WebP.
- **Responsive sizing:** `srcset` + `sizes` to serve a size matched to the device/DPR — don't pour a 2000px image into a 400px slot. `<picture>`/`<source>` doubles as both art direction and format fallback.
- **Art direction (not just resolution):** `<picture>` + `<source media="...">` swaps a *different crop or image* per viewport (a wide desktop hero, a tall mobile crop) — different content, not merely a smaller file.
- **Image CDN** (Cloudinary / imgix / Next Image): resize, transcode, and re-quality on demand instead of pre-baking every variant.

## Killing CLS and slow LCP (the two big mistakes)

- **Always reserve the box.** Set `width`+`height` *or* `aspect-ratio` so the browser holds space before the image loads → **no layout shift (CLS)**. This is the highest-leverage non-default.
- **Allowed aspect-ratio set.** Define a fixed set (16:9 / 4:3 / 1:1 / 3:2 / 21:9) used consistently, not random ratios per image.
- **Focal-point cropping:** `object-fit: cover` + `object-position` keeps the subject in frame across ratios (don't crop off the head).
- **LCP hero is never lazy-loaded.** Below the fold → `loading="lazy"`. The LCP/hero image → `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">`. **Lazy-loading the LCP image is the single most common way to wreck LCP.**
- Everything else: `decoding="async"`; `content-visibility: auto` for offscreen sections.

## Placeholders & perceived performance

The box is already reserved by `aspect-ratio` → fill it with a placeholder → cross-fade in on load.

- **LQIP / blur-up:** a tiny blurred placeholder (inline base64 / **BlurHash** / **ThumbHash**), cross-faded to the full image. Premium move.
- **Dominant-color block:** a solid swatch of the image's average color.

## Image accessibility — alt-text discipline

Describe the image's **purpose/meaning in context, not literal pixels.**

- Informative image → concise, meaningful `alt`.
- **Decorative image → `alt=""` (empty), so SR skips it — NOT a missing `alt`** (a missing attribute makes the SR read the filename).
- Functional image (image *is* a link/button) → `alt` describes the action/destination.
- Complex image (chart) → short `alt` + an adjacent long description.
- **Don't start with "image of"** — the SR already announces it's an image.
- **Text baked into an image** is unselectable, untranslatable, inaccessible — avoid it; if unavoidable, the `alt` must contain that text.

## Illustration systems

Drawn art is its own spec, distinct from photography. Pin down: **line-weight (or fill-only), palette (derived from brand), perspective (flat / isometric / 2.5D / perspective), detail level, character style (proportions / faces / diversity), texture/grain, shape language.**

- **Palette discipline** — constrain illustration to the brand color scale (+ a few illustration-only colors) so it sits inside the product; arbitrary palettes clash.
- **Diverse representation** in character art (skin tone, body type, ability) — both ethics and quality.
- **A spot-illustration library** for empty states, onboarding, error, success — one consistent set.
- Consistency = every illustration looks drawn by one illustrator; hand the spec to whoever (or whatever) generates them.

## Photo treatment & dark mode

- **Unify mismatched photos:** color grade (LUT-style), consistent saturation/contrast, a tint overlay, grain.
- **Duotone:** map a grayscale photo to two brand colors — pulls *any* photo into the brand. Via `feColorMatrix`/`feComponentTransfer`, `mix-blend-mode` + gradient, or `filter`. Premium, non-default.
- **Scrim:** a gradient overlay for text-over-image legibility.
- **Dark mode:** illustrations need a dark variant (or `currentColor`/CSS-variable theming) — light-background art on a dark page gets white fringes. Photos can take a different treatment or a slight `filter: brightness(.85)` to cut glare. **Transparent-PNG white anti-aliased edges** show on dark backgrounds → use SVG or correct alpha. Logos ship light/dark versions.

## SVG illustration

Optimize with SVGO; theme-dependent parts use **`currentColor`**. Choose delivery: **inline** (styleable/animatable) vs **`<img>`** (cached/simple) vs **CSS background** (decorative). Accessibility: inline SVG gets `role="img"` + `<title>` or `aria-label`; decorative → `aria-hidden`. Responsive: keep `viewBox`, set no fixed dimensions.

## The governance mechanism

Enforce the pipeline structurally with **one `<Image>` component** (Next/Image et al.) that bakes in format selection, `srcset`, lazy-loading, `aspect-ratio`, placeholder, and **mandatory `alt`** — so every image is handled correctly by construction. Record the illustration spec, share an asset library, never mix illustration styles or photo treatments.

## When the DOM gives way — Canvas / WebGL

The DOM/SVG is great for documents and UI but has ceilings: thousands of elements get slow (layout/paint/memory) and there's no pixel-level control. Drop down only when it genuinely can't cope:

```
vector · needs DOM/a11y/per-element interaction · ≤ ~1–5k elements → SVG (declarative, resolution-independent)
raster · many shapes (thousands+) · no semantics                   → Canvas 2D (immediate mode, you manage everything)
3D · massive 2D (100k+) · shaders · GPU compute                    → WebGL / WebGPU (steep)
```

Often the best answer is **hybrid**: DOM/SVG UI layered over a Canvas/WebGL render surface.

### Canvas 2D — the non-defaults

- **Immediate mode:** you **redraw every frame** — no retained scene graph. You hold your own model and re-render it. A genuine mental shift from declarative DOM.
- **Render loop:** `requestAnimationFrame` (syncs to display, auto-pauses on hidden tabs); clear + redraw each frame; **use delta time** for frame-rate-independent motion.
- **HiDPI / retina (the #1 trap):** canvas is blurry on retina. Fix, always: backing pixels = CSS size × `devicePixelRatio`, then `ctx.scale(dpr, dpr)`, with CSS size kept at logical values.
- **State:** `save()`/`restore()` around transforms; don't leak state.
- **Performance:** `OffscreenCanvas` + Web Worker (render off the main thread); layering (static background + dynamic foreground on separate canvases); dirty rectangles (redraw only changed regions); batch by style (switching `fillStyle` is costly); `Path2D` to cache paths; avoid `getImageData` on the hot path (forces a sync flush) and sub-pixel positioning (blurry).
- **Hit detection:** Canvas has none — implement it (`isPointInPath`, or an offscreen "hit canvas" with a unique color per object).
- **Text:** `measureText` exists but there's **no auto-wrap** — implement line-breaking yourself.

### WebGL / WebGPU — the fundamentals that matter

- **Pipeline:** vertices → vertex shader → rasterization → fragment shader → pixels. **You write the shaders (GLSL).** Uniforms (per-draw constants), attributes (per-vertex), varyings (interpolated). Coords run through clip space / NDC; render-to-texture via framebuffers. **WebGL2** adds instancing, transform feedback, MRT.
- **GPU execution model (why shaders are written oddly):** massively parallel (SIMT) — the fragment shader runs once per pixel, no shared state. **Branches are expensive (divergence):** if threads in a group take different branches, *both* run and one is discarded → slow. Write **branchless** code with `step` / `mix` / `smoothstep` / `clamp` instead of `if`.
- **Fragment shader = a pure function `(uv) → color`.** This unlocks **SDF** (signed distance fields) for resolution-independent shapes and crisp text, **raymarching** (3D inside one fragment shader), and procedural noise (Perlin/Simplex/Worley). GLSL toolbox: `mix/step/smoothstep/clamp/dot/cross/length/normalize/fract/mod`.
- **Linear color workflow (classic bug):** do math in linear space, encode to sRGB on output. "Lighting/blending looks washed-out gray" = doing math directly in gamma (sRGB) space. Decode sRGB → linear → compute → encode (gamma ≈ 2.2). Use **premultiplied alpha** to avoid black edge fringes; HDR/float textures for high-range work.
- **Aliasing = undersampling:** MSAA (geometry edges) vs FXAA/SMAA (post-process) vs TAA (temporal); **mipmaps** fix minification aliasing; anisotropic filtering; `nearest` (pixel art) vs `linear`; dithering / blue noise against banding.
- **3D math:** the **MVP** pipeline (model → view → projection); **quaternions** for rotation to avoid gimbal lock; raycasting/picking for screen↔world; normal matrices.
- **draw calls (+ state changes + overdraw) are the bottleneck:** minimize via **batching** and **instancing** (draw many copies in one call); texture atlases; mipmaps; LOD; frustum/occlusion culling; texture compression (ASTC/ETC/Basis). Budget **~16.7ms/frame**; profile with a GPU profiler. When profiling, first identify the bottleneck type — vertex-bound / fillrate-bound / bandwidth-bound / CPU-GPU sync stall.
- **CPU-GPU sync stalls:** `readPixels` / `getImageData` / `gl.finish` force synchronization — keep them off the hot path.
- **WebGPU (the successor):** lower-overhead modern API (Vulkan/Metal/D3D12-based) via explicit pipeline-state objects + bind groups, **WGSL** shaders, and **compute shaders** for general GPU compute (particles, fluid/physics sim, image processing, ML inference) — not just rendering. GPGPU thinks in workgroups/threads and parallel algorithms (reduction, prefix-sum mapped to the GPU); worth it for large data-parallel work that tolerates upload/readback. Emerging (Chromium-first; verify support before shipping).
- **Don't write raw WebGL** unless you need fine control — reach for **Three.js** (3D default), **react-three-fiber** (declarative 3D), **PixiJS** (fast 2D), **Deck.gl** (large-scale data viz/maps), **regl**, **p5.js**.

### Canvas/WebGL non-negotiables

- **Accessibility is a black hole:** canvas/WebGL has no semantics — AT sees nothing. **Always** provide fallback content inside `<canvas>`, a parallel accessible DOM mirror, or a data-table/text alternative; implement keyboard interaction yourself. **If SVG can do it, use SVG** (it has the DOM and semantics).
- **Context loss:** the GPU can reclaim your context (`webglcontextlost`) — you **must** listen and restore.
- **Resource lifecycle:** explicitly release GPU resources (textures/buffers) or leak GPU memory; pause on hidden tabs (Page Visibility).
- **Integration gotchas:** map pointer → canvas coords via `getBoundingClientRect` + dpr; handle resize with `ResizeObserver` (reset size + dpr); a **tainted canvas** (cross-origin image without CORS) blocks `getImageData`/`toDataURL` — textures need `crossOrigin`; mind `colorSpace` (sRGB / display-p3).

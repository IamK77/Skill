# DOM vs Canvas vs WebGL — the decision tree, fallback contract, and perf budget

> The DOM is the default and the budget. Canvas/WebGL/GPU is earned, not assumed. This doc
> holds the encodable technique behind the fallback gate: the threshold for each tier, the
> DOM-first principle, the retina fix, the render loop, and the accessibility contract.
> Taste decides which surfaces warrant the escape; this doc governs what that escape requires.

---

## The decision tree

Three rendering tiers; move down only when the tier above genuinely cannot cope.

```
Vector / needs DOM a11y / per-element interaction / ≤ ~1–5k elements
  → SVG (declarative, resolution-independent, DOM/semantics intact)

Raster / thousands+ of shapes / no semantic requirement / pixel-level control
  → Canvas 2D (immediate mode, you manage everything)

3D / massive 2D (100k+) / shaders / GPU compute / full GPU control
  → WebGL / WebGPU (steep learning curve, full power)
```

**SVG is still DOM.** It is resolution-independent, CSS-controllable, accessible, and animatable. It handles most icon/illustration/chart work up to ~1–5k elements without reaching for canvas. The boundary is real; benchmark before crossing it.

**Canvas 2D** is the right choice for raster work, many shapes, pixel-level operations (image filters, paint tools), or anything where per-element DOM overhead genuinely becomes the bottleneck. It cannot do semantics — that must be handled alongside it.

**WebGL / WebGPU** is for 3D, GPU shaders, rendering hundreds of thousands of elements, or general GPU compute. It is not for making a 2D chart look fancy.

**Mixed architecture is often optimal:** DOM or SVG UI elements layered over a Canvas/WebGL render surface below. The DOM handles interaction and accessibility; the canvas handles the heavy rendering.

---

## The DOM-first principle

Before writing a canvas line, answer: *why can't the DOM do this?*

The DOM's ceiling is higher than assumed. CSS transitions and animations run on the compositor thread (transform/opacity) and handle the vast majority of UI animation without touching layout or paint. SVG handles most vector rendering needs. The cases that genuinely require escape: pixel-level raster operations, rendering thousands of similar objects, 3D scenes, GPU shaders, or compute kernels.

"It would be easier in canvas," "three.js is already a dependency," or "I've seen this done in WebGL" are not reasons. Name the real constraint.

---

## The fallback contract (non-negotiable)

Canvas and WebGL are accessibility black holes. An assistive technology scanning the DOM sees a `<canvas>` element — opaque, no semantics, no text. The contract:

**Every canvas/WebGL surface must provide one of:**
1. **Fallback content inside `<canvas>`** — a static image, a description, or a text summary placed between the `<canvas>` tags. Browsers that cannot render canvas show this; AT reads it.
2. **A parallel accessible DOM** — a visible or visually-hidden DOM structure that mirrors the canvas content semantically. For a chart: a data table. For a game: a keyboard interface description. Must stay in sync.
3. **A data-table or text alternative** — adjacent to the canvas, providing the underlying data or narrative in accessible form.

Keyboard interactions that live on the canvas must be implemented by hand (canvas has no tab order, no keyboard event routing by default). If SVG can serve the same purpose, use SVG — it has the DOM, semantics, and keyboard handling already.

---

## The perf budget

Every rendering loop carries a written frame budget:

- **Interactive surfaces:** 16.7ms (60fps). If the loop exceeds this, the surface jank-scrolls and drags.
- **Background / decorative surfaces:** can trade fps for lower CPU/GPU usage; name the target explicitly (e.g. 30fps for a background animation).
- **CPU/JS target is ~half the frame budget** — the other half is for compositing, browser work, and margin. If JS alone is eating 16ms, the loop is already over budget.

Measure with the browser's performance panel and a GPU profiler. Assert the budget in a comment next to the loop; revisit it on hardware that's representative of the floor (not just a developer machine).

---

## Canvas 2D — the non-defaults (all skipped by default)

### The retina / HiDPI fix — #1 trap, always required

A canvas on a retina (2×) display is blurry unless you:

```js
const canvas = document.querySelector('canvas');
const dpr = window.devicePixelRatio ?? 1;

// Physical backing size (what the GPU actually renders to)
canvas.width  = logicalWidth  * dpr;
canvas.height = logicalHeight * dpr;

// CSS size stays at logical (display) size
canvas.style.width  = logicalWidth  + 'px';
canvas.style.height = logicalHeight + 'px';

// Scale the context so coordinates stay in logical pixels
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);
```

When the device pixel ratio changes (external monitor connect/disconnect), reset — use a `ResizeObserver` that also re-reads `devicePixelRatio`. Same fix applies to WebGL: `gl.viewport(0, 0, canvas.width, canvas.height)` after each resize using the physical size.

### The render loop

```js
let lastTime = 0;

function loop(timestamp) {
  const delta = timestamp - lastTime;  // ms since last frame — use for frame-rate-independent motion
  lastTime = timestamp;

  ctx.clearRect(0, 0, logicalWidth, logicalHeight); // clear with logical coords (ctx already scaled)
  draw(delta);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

`requestAnimationFrame` syncs to the display refresh rate and automatically pauses when the tab is hidden (Page Visibility API stops firing it). Pair with explicit pause logic for WebGL loops (listen for `visibilitychange`).

### State management

Transforms (translate/rotate/scale) accumulate. Wrap compound operations in `save()` / `restore()` to isolate state:

```js
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);
drawThing();
ctx.restore(); // back to state before save()
```

Never return early from a function that called `save()` without calling `restore()` — leaked state silently compounds across frames.

### Performance

| Technique | When to use |
|---|---|
| `OffscreenCanvas` + Web Worker | Render off the main thread — most useful when the loop is CPU-heavy or you need to isolate from main-thread jank |
| Layered canvases | Separate static background from animated foreground — never redraw the static layer every frame |
| Dirty rectangles | `clearRect` + redraw only the bounding box of changed content — crucial for sparse animations |
| Batch by `fillStyle` / `strokeStyle` | Context state switches are GPU commands — sort objects by style and draw all of one style before switching |
| `Path2D` cache | Pre-compute reusable paths; don't re-describe complex geometry every frame |
| Avoid `getImageData` in the loop | Forces a synchronous GPU readback (expensive); keep it out of the hot path |
| Avoid sub-pixel positioning | Drawing at non-integer coordinates forces antialiased blending; snap to integers for crisp rendering |

### Hit detection

Canvas has no built-in hit detection (no DOM events per shape). Two patterns:

1. **`isPointInPath(path, x, y)`** — check if a coordinate falls inside a given Path2D. Requires re-describing the path or caching it as Path2D.
2. **Offscreen hit canvas** — a second canvas (never displayed) where each object is drawn in a unique solid color. On click, read the pixel color at the cursor position to identify which object was hit. Scales to complex scenes cleanly.

Pointer coordinates must be mapped from page/window space to canvas logical space:

```js
const rect = canvas.getBoundingClientRect();
const dpr  = window.devicePixelRatio ?? 1;
const x = (event.clientX - rect.left);  // logical px (ctx already scaled)
const y = (event.clientY - rect.top);
```

### Text

`ctx.measureText(str).width` returns a width; `actualBoundingBoxAscent` / `actualBoundingBoxDescent` give vertical metrics. There is no auto-wrap — implement line-breaking by measuring word widths and accumulating until a wrap threshold is reached.

---

## WebGL — the render pipeline in brief

(Full GPU depth: see [canvas-webgl-gpu.md](canvas-webgl-gpu.md). This is the topology.)

```
CPU-side data           GPU pipeline
──────────────────      ──────────────────────────────────────────────
Vertices (attributes)   → Vertex shader (position, per-vertex)
Uniforms (constants)   ↗   ↓
Textures               → Rasterization (fill triangles with fragments)
                           ↓
                       → Fragment shader (color per pixel)
                           ↓
                       → Framebuffer (screen, or render-to-texture)
```

You write two programs in GLSL (the shading language) — one vertex shader, one fragment shader — and the GPU executes them in parallel across all geometry/pixels respectively.

**Library ladder (prefer in order before going raw):**
- **Three.js** — 3D default; scene graph, cameras, lights, materials, loaders
- **react-three-fiber** — declarative Three.js for React (JSX scene graph)
- **PixiJS** — fast 2D WebGL (sprites, particles, games)
- **Deck.gl** — large-scale data visualization and geo/map rendering
- **p5.js** — creative coding / generative art (Canvas 2D with a friendly API)
- **regl** — functional WebGL wrapper, lower level than Three.js
- **Raw WebGL** — only when you need control the libraries don't expose

---

## Integration gotchas

| Issue | Fix |
|---|---|
| Blurry canvas on retina | Backing size = CSS size × `devicePixelRatio`; see above |
| Canvas wrong size after window resize | `ResizeObserver` → re-read logical size and dpr, reset `canvas.width` / `canvas.height`, re-scale context |
| Tainted canvas (CORS block) | Cross-origin `<img>` drawn to canvas taints it; blocks `getImageData`/`toDataURL`. Set `img.crossOrigin = 'anonymous'` before loading |
| WebGL context loss | GPU reclaims context under pressure — listen for `webglcontextlost`, call `event.preventDefault()`, restore on `webglcontextrestored` |
| GPU memory leaks | Every texture, buffer, and framebuffer must be explicitly deleted (`gl.deleteTexture`, `gl.deleteBuffer`) when no longer needed |
| Pausing off-screen | Add `document.addEventListener('visibilitychange', …)` to pause/resume the rAF loop |
| Color space | Canvas defaults to sRGB; `getContext('2d', { colorSpace: 'display-p3' })` for wide-gamut surfaces |

# Canvas / WebGL / GPU — shader craft, GPU execution model, and generative technique

> This doc goes below the API surface: how the GPU actually executes code, how to write
> shaders as if you mean it, the linear color workflow that explains the "washed-out gray"
> bug, the 3D math that unlocks the renderer, and the performance diagnosis that goes beyond
> "reduce draw calls." The canvas non-defaults (retina fix, render loop) live in
> dom-vs-canvas-vs-webgl-and-fallback.md; this doc is for the GPU layer itself.

---

## GPU execution model — why shaders are written the way they are

The GPU runs thousands of shader invocations simultaneously (SIMT — Single Instruction, Multiple Threads). A fragment shader runs **once per pixel**, all pixels in parallel, with **no shared mutable state** between them. This is the core constraint that shapes everything:

**Branches are expensive (divergence).** Threads are grouped into "warps" or "subgroups." If threads in a group take different branches (the `if` condition is true for some, false for others), *both branches execute* — the GPU runs all of them and discards the results for threads that took the other path. On complex or varied geometry this causes significant waste.

**Write branchless code** wherever performance matters:

| Instead of | Use |
|---|---|
| `if (x > 0.5) return a; else return b;` | `mix(b, a, step(0.5, x))` |
| `if (cond) color = red; else color = blue;` | `mix(blue, red, float(cond))` |
| `clamp` + `if` combinations | `smoothstep(edge0, edge1, x)` |

`step(edge, x)` returns 0.0 if x < edge, 1.0 otherwise — a branchless threshold. `smoothstep(e0, e1, x)` is a smooth S-curve between 0 and 1. `mix(a, b, t)` linearly interpolates. These are the tools that make GPU code fast.

**Data-parallel thinking.** The GPU excels at the same operation applied to many independent data points. Design algorithms to be decomposable into per-pixel (or per-vertex) work with no inter-thread communication. Communication costs — it requires special atomic operations, barriers, or multiple passes.

---

## Fragment shader = a pure function (uv) → color

The mental model: a fragment shader receives a UV coordinate (position in the [0,1] × [0,1] normalized texture/screen space) and produces a color. No side effects, no shared state, just math.

```glsl
// Minimal fragment shader
precision highp float;
varying vec2 vUV;   // UV passed from vertex shader
uniform float uTime;

void main() {
  vec2 uv = vUV;

  // Everything is math on coordinates
  float d = length(uv - 0.5);             // distance from center
  vec3 color = mix(vec3(0.1, 0.2, 0.8),  // inside color
                   vec3(0.9, 0.7, 0.1),  // outside color
                   smoothstep(0.2, 0.5, d)); // smooth edge

  gl_FragColor = vec4(color, 1.0);
}
```

The GLSL toolbox — fluency here is craft:

| Function | Use |
|---|---|
| `mix(a, b, t)` | Linear interpolation; t in [0,1] |
| `step(edge, x)` | Branchless threshold: 0 below edge, 1 at or above |
| `smoothstep(e0, e1, x)` | Smooth S-curve between e0 and e1 |
| `clamp(x, min, max)` | Constrain a value |
| `fract(x)` | Fractional part — tiles a pattern |
| `mod(x, y)` | Modulo — also useful for tiling |
| `dot(a, b)` | Dot product — projection, lighting |
| `cross(a, b)` | Cross product — surface normals |
| `length(v)` | Vector magnitude — distance |
| `normalize(v)` | Unit vector |

---

## SDF — signed distance fields

An SDF encodes a shape as a function that returns the *signed distance* from any point to the shape's boundary: negative inside, positive outside, zero on the edge.

```glsl
// Circle SDF: negative inside, positive outside, 0 on boundary
float circleSDF(vec2 p, float r) {
  return length(p) - r;
}
```

With SDFs you get:
- **Resolution-independent shapes** — no geometry mesh, just math; works at any size without aliasing.
- **Crisp antialiased edges** via `smoothstep` at the 0-crossing.
- **Shape composition** — union (min), intersection (max), subtraction (max of first and negative of second).
- **Effects** — stroke (abs(sdf) < width), soft glow, drop shadows, rounded corners on any shape.

The canonical reference: **Inigo Quilez's articles** (iquilezles.org) cover 2D and 3D SDFs for every shape, plus SDF ops and effects.

```glsl
// Antialiased circle using SDF
float d = circleSDF(uv - 0.5, 0.3);
float alpha = 1.0 - smoothstep(-0.005, 0.005, d);
gl_FragColor = vec4(color, alpha);
```

---

## Raymarching

Raymarching renders 3D scenes entirely inside a fragment shader — no geometry is sent to the GPU at all.

```
For each pixel:
  Cast a ray from camera through the pixel
  Step along the ray — each step uses an SDF to find the nearest surface
  When close enough to a surface, that's a hit → compute lighting
  If max steps exceeded → background
```

The power: complex 3D geometry (fractals, organic surfaces, procedural landscapes) that would be impractical to mesh. The cost: CPU equivalent of multiple texture samples per step per pixel — GPU-heavy, profiling required.

```glsl
float march(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    float d = sceneSDF(ro + rd * t);
    if (d < 0.001) return t;   // hit
    t += d;                     // step
    if (t > 100.0) break;       // miss
  }
  return -1.0; // no hit
}
```

Useful for: generative backgrounds, interactive art, procedural environments. Not for production UI unless the render surface is clearly bounded (a hero element, a decorative panel) with a DOM fallback.

---

## Procedural noise

Noise functions produce pseudo-random values that vary smoothly in space — the basis for textures, organic motion, terrain, clouds, fire.

| Type | Character | Use |
|---|---|---|
| **Value noise** | Blocky smooth | Simple gradient/fog effects |
| **Perlin noise** | Smooth, gradient-based | Organic textures, displacement |
| **Simplex noise** | Faster Perlin, fewer artifacts | Default for most procedural work |
| **Worley / cellular noise** | Voronoi-cell pattern | Skin, rock, water surfaces |
| **Fractal Brownian Motion (fBm)** | Layered noise octaves | Terrain, clouds, turbulence |

fBm accumulates multiple noise octaves at increasing frequency and decreasing amplitude:

```glsl
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = p * 2.0 + 1.5;
    a *= 0.5;
  }
  return v;
}
```

---

## Linear color workflow — the classic "washed-out gray" bug

**The problem:** sRGB images and colors are stored in gamma-encoded space (approximately `linear^(1/2.2)`). If you perform lighting arithmetic (add, multiply, mix) directly on gamma-encoded values, the math is wrong — midtones collapse, colors desaturate, lit areas look washed out and gray.

**The rule: always do math in linear space, then encode to sRGB on output.**

```
sRGB texture/color (gamma) → decode to linear → multiply / add / blend → encode to sRGB → display
```

In GLSL, the decode and encode:
```glsl
// Approximate gamma decode/encode (use pow(x, 2.2) and pow(x, 1.0/2.2))
vec3 toLinear(vec3 srgb) { return pow(srgb, vec3(2.2)); }
vec3 toSRGB(vec3 linear) { return pow(linear, vec3(1.0/2.2)); }
```

Three.js handles this automatically when `renderer.outputEncoding = THREE.sRGBEncoding` and textures are loaded with the correct encoding.

**Premultiplied alpha.** When compositing transparent surfaces, unpremultiplied alpha produces dark edges (the RGB values near the transparent boundary get pulled toward black when alpha-blended). Use premultiplied alpha: `rgb = color × alpha`, `a = alpha`. This avoids the "black fringe" artifact around transparent shapes.

**Float textures and HDR.** HDR rendering (values > 1.0) requires float textures (`FLOAT` or `HALF_FLOAT` internal format in WebGL). After rendering, a tone-mapping pass compresses the HDR range back to [0,1] for display. This is standard for physically-based rendering.

---

## Antialiasing

Aliasing is undersampling — a continuous signal rendered at discrete pixels produces "staircase" edges and "shimmering" textures.

**Geometric antialiasing:**
- **MSAA (Multisample AA)** — renders geometry edges at higher sample count and averages. High quality, GPU-native in WebGL via `antialias: true`. Only covers geometry edges, not shader-generated content.
- **FXAA / SMAA** — post-process edge detection applied after rendering. Fast, works on all output including shaders. Lower quality than MSAA but covers more cases.
- **TAA (Temporal AA)** — uses multiple frames over time to accumulate more samples. High quality, handles both geometry and shaders, handles motion (with reprojection). Used in production 3D; Three.js supports it.

**Texture antialiasing:**
- **Mipmaps** — pre-computed downsampled versions of a texture at half-resolution steps. When a texture is displayed smaller than its native resolution, the appropriate mip is used, preventing minification aliasing. Always generate mipmaps for textures rendered at varying scales.
- **Anisotropic filtering** — improves texture quality at steep angles (floor tiles viewed from the side). `ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT` in WebGL; `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` in Three.js.
- **Nearest vs linear** — `NEAREST` (pixelated, pixel-art aesthetic) vs `LINEAR` (bilinear interpolation, smooth). Choose deliberately.

**Shader-based antialiasing:** For SDF shapes, use a `fwidth`-based smoothstep: the derivative of the SDF at the edge tells you the screen-space rate of change, enabling correctly-sized antialiasing:
```glsl
float d = sdf(uv);
float aa = fwidth(d);
float alpha = 1.0 - smoothstep(-aa, aa, d);
```

**Banding / dithering.** Low-precision color surfaces (8-bit per channel) show visible color bands in gradients. Counter with **dithering** (adding calibrated noise before quantization) or **blue noise** (spatially uniform noise that is perceptually invisible). This is the same concern as in the color/gradient work elsewhere in the suite.

---

## 3D math

**The MVP pipeline.** Every vertex in a 3D scene goes through three matrix transforms:
1. **Model matrix** — positions the object in world space (translation, rotation, scale).
2. **View matrix** — transforms world space to camera/eye space (the inverse of the camera transform).
3. **Projection matrix** — projects 3D eye space to 2D clip space (perspective or orthographic).

```glsl
// In the vertex shader:
gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
```

Three.js computes and maintains `projectionMatrix`, `viewMatrix` (as part of the camera), and `modelMatrix` (as part of Object3D) automatically.

**Quaternions for rotation.** Euler angles (rx, ry, rz) suffer from gimbal lock — when two rotation axes align, a degree of freedom is lost. Quaternions (`x, y, z, w` representing an axis + angle) avoid this entirely. Use `THREE.Quaternion`, `Object3D.quaternion`, `slerp()` for smooth interpolation between rotations.

**Raycasting / picking.** To convert a screen click to a world-space ray (for picking 3D objects):
1. Convert screen coordinates to normalized device coordinates (NDC): `x = (screenX / width) * 2 - 1`, `y = -(screenY / height) * 2 + 1`.
2. Unproject through the inverse projection+view matrices to get a world-space ray origin and direction.
3. Test against scene geometry (Three.js `Raycaster` handles this).

**Normal matrices.** A surface normal (the vector perpendicular to a surface) must be transformed with the **inverse transpose** of the model matrix (not the model matrix itself) to remain perpendicular after non-uniform scaling. Three.js provides `normalMatrix` (a `mat3`).

---

## GPU performance diagnosis

Go beyond "reduce draw calls" — first identify the bottleneck type:

| Bottleneck | Symptom | Fix |
|---|---|---|
| **Vertex-bound** | GPU busy even with few fragments | Reduce vertex count; use LOD; cull backfaces |
| **Fillrate-bound** | GPU busy in fragment shading; complex shaders | Simplify fragment shader; reduce overdraw; use early-Z |
| **Bandwidth-bound** | Slow even without complex shaders | Reduce texture sizes; use texture compression; reduce render target sizes |
| **CPU-GPU sync stall** | GPU idle while CPU waits for it | Eliminate `readPixels` / `gl.finish` from hot paths |

### Reducing draw calls

Each `gl.drawElements` / `gl.drawArrays` call has CPU overhead and GPU state-change cost. Minimize:

- **Instancing** — draw many copies of the same geometry in one call. WebGL 2: `gl.drawElementsInstanced`. Three.js: `InstancedMesh`. Per-instance data (transform, color) lives in instance attribute buffers.
- **Batching** — merge multiple objects with the same material into one geometry + one draw call. Three.js `BufferGeometryUtils.mergeBufferGeometries`.
- **Texture atlases** — pack many textures into one larger texture and use UV offsets to reference each. Reduces texture-bind state changes between draw calls.
- **LOD (Level of Detail)** — use simpler geometry (fewer polygons) for distant objects. Three.js `LOD` class.
- **Frustum culling** — don't draw objects outside the camera's view frustum. Three.js performs this automatically for `Mesh` objects.
- **Occlusion culling** — don't draw objects hidden behind other geometry. Requires explicit implementation (occlusion queries, or a pre-computed visibility set).
- **Texture compression** — ASTC (mobile), ETC2 (Android), S3TC/DXT (desktop). Compressed textures reduce bandwidth and GPU memory usage. Basis Universal (`.basis`) encodes once and transcodes to the appropriate format on device.

### CPU-GPU sync stalls

These calls force the CPU to wait for the GPU to complete all pending work before returning — they break the pipelined execution model:

- `gl.readPixels` — reads pixel data from the framebuffer
- `gl.getBufferSubData` (WebGL 2)
- `gl.finish` — waits for all commands to complete
- `ctx.getImageData` (Canvas 2D)

Keep these off the render loop. If you need to read back GPU data, use async patterns where available (`gl.fenceSync` + `gl.clientWaitSync`, or WebGPU's async `mapAsync`).

### GPU resource lifecycle

Textures, buffers, framebuffers, and shader programs are GPU-managed resources. The browser does not garbage-collect them. Explicit cleanup:

```js
// WebGL cleanup
gl.deleteTexture(texture);
gl.deleteBuffer(buffer);
gl.deleteFramebuffer(fb);
gl.deleteProgram(shaderProgram);
```

In Three.js: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`. Failing to do this causes GPU memory to grow until the browser crashes or kills the tab.

---

## WebGPU and GPGPU

WebGPU is the successor to WebGL — a modern, lower-overhead API built on Vulkan/Metal/Direct3D 12. Two key differences from WebGL:

**Lower CPU overhead** via explicit pipeline state objects (vs WebGL's implicit state machine) and bind groups (vs WebGL's per-call uniform binding). Less state-change cost enables more draw calls at the same CPU budget.

**Compute shaders** for general-purpose GPU compute (GPGPU). This is the key addition not in WebGL:

```wgsl
// WGSL (WebGPU Shading Language) compute shader
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  output[i] = input[i] * 2.0;  // process element i in parallel
}
```

Use cases for compute shaders:
- **Particle systems** — update thousands of particle positions per frame on the GPU, no CPU readback needed
- **Physics / fluid simulation** — run the simulation on the GPU; only read results when rendering
- **Image processing** — convolution filters, blur, tone mapping on full-resolution images
- **ML inference** — run neural networks (style transfer, super-resolution) in the browser

**GPGPU thinking.** Algorithms that work sequentially on a CPU must be reformulated for parallel execution. Key primitives: **parallel reduction** (sum/max across an array by halving in stages), **prefix sum** (partial sums for allocation/compaction), **histogram** (counting). These require understanding **workgroups** (a fixed-size thread group with shared memory) and **barriers** (synchronize within a workgroup).

**Support status.** WebGPU shipped in Chrome 113+ (2023). Firefox and Safari support is in progress. Verify support before shipping to production; provide a WebGL fallback for unsupported browsers.

---

## WebGL 2 additions

WebGL 2 (widely supported, target it as the baseline for new WebGL work) adds:

- **Instanced rendering natively** — `gl.drawElementsInstanced` / `gl.drawArraysInstanced` without requiring the `ANGLE_instanced_arrays` extension.
- **Transform feedback** — capture vertex shader output back into a buffer on the GPU. Enables GPU-side particle update (write updated positions back to a VBO, no CPU readback), sorting on GPU, and other compute-like patterns without WebGPU.
- **Multiple Render Targets (MRT)** — write to multiple framebuffer color attachments in one draw call. Used in deferred rendering (G-buffer pass: write color, normals, depth simultaneously).
- **Uniform Buffer Objects (UBO)** — share uniform data across multiple shader programs efficiently.
- **GLSL 3.00 es** — `in`/`out` instead of `attribute`/`varying`; `texture()` instead of `texture2D`; integer support; bitwise ops.

When targeting WebGL 2, explicitly request it: `canvas.getContext('webgl2')`. Always provide a WebGL 1 fallback path or feature-detect and degrade gracefully.

---

## Canvas 2D performance (OffscreenCanvas and layering)

The Canvas 2D non-defaults for the render loop (retina fix, rAF loop, delta time, state save/restore) live in [dom-vs-canvas-vs-webgl-and-fallback.md](dom-vs-canvas-vs-webgl-and-fallback.md). The performance-specific techniques:

**OffscreenCanvas + Web Worker.** Move the entire render loop off the main thread:

```js
// main thread
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('render-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// render-worker.js
self.onmessage = ({ data: { canvas } }) => {
  const ctx = canvas.getContext('2d');
  function loop() {
    draw(ctx);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
};
```

The main thread and the render loop are now independent — main-thread JS jank doesn't drop animation frames, and the render loop can't block interaction. `requestAnimationFrame` works inside Workers.

**Layered canvases.** Two overlapping `<canvas>` elements (both positioned absolute in a container): a static background layer and a dynamic foreground layer. Only the dynamic layer is cleared and redrawn each frame. The background is drawn once (or on explicit content change). This is the simplest and often most effective optimization for scenes with mostly-static content.

**Dirty rectangles.** Track which regions of the canvas changed and `clearRect` + redraw only those bounding boxes. Requires tracking object extents between frames (previous bounding box + current bounding box both get cleared).

**Batch by style.** Switching `fillStyle`, `strokeStyle`, or `globalCompositeOperation` is a state change that costs GPU commands. Sort/group drawing calls by style and draw all objects of one style before switching. `Path2D` objects cache computed paths for reuse without re-describing geometry.

---

## Library ladder

In order of preference; reach for the next tier only when the previous can't serve the need:

| Library | Best for |
|---|---|
| **Three.js** | 3D default — scene graph, cameras, lights, physically-based materials, loaders |
| **react-three-fiber** | Declarative 3D in React (JSX scene graph, R3F hooks) |
| **PixiJS** | Fast 2D WebGL — sprites, particles, UI elements at scale |
| **Deck.gl** | Large-scale data visualization, geo/map layers, WebGL 2 + WebGPU |
| **p5.js** | Creative coding / generative art — Canvas 2D with a friendly API |
| **regl** | Functional WebGL wrapper — lower level than Three.js, higher than raw |
| **Raw WebGL** | Fine-grained control the libraries don't expose; shader-forward work |
| **Raw WebGPU** | Compute shader pipelines, maximum control, when WebGL is the bottleneck |

---

## Quick-reference checklist

| Check | Standard |
|---|---|
| Retina fix | Backing size = CSS × dpr; `ctx.scale(dpr,dpr)` (see dom-vs-canvas ref) |
| Render loop | `requestAnimationFrame` + delta time + pause on hidden tab |
| Branchless shaders | `step`/`mix`/`smoothstep` instead of `if` on hot paths |
| Fragment shader as pure fn | `(uv) → color`; no side effects |
| SDF for shapes | Resolution-independent; compose with min/max; antialiased with fwidth |
| Linear color workflow | Decode sRGB → linear → compute → encode; premultiplied alpha |
| Antialiasing | MSAA or FXAA; mipmaps always; anisotropic for angled textures |
| 3D math | MVP pipeline; quaternions (no gimbal lock); raycasting for picking |
| Bottleneck type first | Vertex / fillrate / bandwidth / CPU-GPU sync before optimizing |
| Instancing | One draw call for many identical objects |
| Texture atlases | Reduce bind calls for many small textures |
| No sync on hot path | `readPixels`/`gl.finish` away from the render loop |
| Resource cleanup | `deleteTexture`/`deleteBuffer` / Three.js `.dispose()` |
| Context loss handled | `webglcontextlost` listener + restore |
| WebGPU compute | WGSL compute shaders for GPGPU; verify support |
| Library ladder | Three/r3f/Pixi/Deck/p5 before raw; raw only for fine control |

# Performance Engineering — Rendering, Loading, and Distribution

## Mental Model: Where a Change Enters the Pipeline Determines Its Cost

**JS → Style → Layout → Paint → Composite**

Changing a layout property (`width`, `height`, `top`, `margin`, `font-size`) triggers the full pipeline — the most expensive path. Changing a paint-only property (`color`, `background`, `box-shadow`, `border-radius`) skips Layout. Changing only `transform` or `opacity` skips both Layout and Paint; the compositor handles it on the GPU, independently of the main thread, enabling 60fps even when JS is busy. **Animate only transform and opacity.**

Cost order: layout > paint > composite.

---

## Rendering Pipeline Details

**Style** computes which rules apply and their cascade-resolved values. **Layout** computes box geometry (position, size) — expensive, invalidates the entire subtree and potentially ancestors. **Paint** rasterizes pixels (text, colors, borders, shadows) into layers. **Composite** blends layers in GPU order.

**Compositor layers** — the browser promotes elements to independent GPU textures when: a `transform`/`opacity` animation is active, `will-change` is set, `position: fixed` is in use, or `backdrop-filter`/`translateZ(0)` are present. Layers are not free: each consumes GPU memory. **Layer explosion** (too many layers) degrades performance. Use `will-change` sparingly — hint before animation, remove it after. Inspect via DevTools → Layers panel.

**Forced synchronous layout / layout thrashing** — reading layout properties (`offsetWidth`, `offsetHeight`, `getBoundingClientRect`, `getComputedStyle`, `scrollTop`, `clientHeight`) forces the browser to flush pending layout to return accurate values. A read→write→read loop inside a loop triggers layout on every iteration. Fix: batch all reads first, then all writes; or schedule writes with `requestAnimationFrame`.

**Expensive paint operations**: large `box-shadow` with high blur radius, `filter: blur()`, `backdrop-filter`, large gradients, combined `border-radius` + shadow, `background-attachment: fixed` (repaints on every scroll). Minimize repaint regions. DevTools → Rendering → Paint Flashing shows what repaints.

---

## Containment and Skipping Off-Screen Work

- `contain: layout` — internal layout changes do not escape the element; limits reflow scope.
- `contain: paint` — children do not paint outside the boundary; off-screen elements can skip paint.
- `contain: size` — size is independent of content (requires explicit dimensions).
- `content-visibility: auto` — fully skips layout and paint for off-screen elements until they approach the viewport. Pair with `contain-intrinsic-size` to reserve space and prevent scroll-position jumps. Major win for long pages and lists — lightweight virtual rendering without a JS library.

**Unused CSS** adds parse cost and inflates the CSSOM. Audit with DevTools → Coverage tab; remove dead rules with PurgeCSS or equivalent. Avoid shipping massive CSS frameworks when only a fraction of selectors are used.

---

## Core Web Vitals: Targets and Fixes

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |

Google's thresholds are measured at **p75** of field data — the long tail is the real experience.

**LCP** — identify the largest element, then: place it directly in HTML (not JS-injected so the preload scanner discovers it); add `<link rel="preload" as="image" fetchpriority="high">`; never lazy-load it (`loading="eager"`); serve via CDN; eliminate render-blocking resources above it.

**INP** (replaced FID) — any task > 50ms on the main thread blocks input response. Break long tasks with `scheduler.yield()`, `setTimeout` chunking, or `isInputPending()`. Debounce expensive event handlers. Offload heavy computation to a Web Worker. Use `startTransition`/`useDeferredValue` in React to deprioritize non-urgent renders. Signals (Solid, Preact Signals, Angular Signals) bypass VDOM diffing for fine-grained updates.

**CLS** — reserve space for every image and video with explicit `width`/`height` or `aspect-ratio`. Pre-allocate space for ads and embeds. Never insert content above existing content after load. Use `font-display: swap` + `size-adjust` on fallback fonts to match metrics. Animate with `transform`, not layout-changing properties.

---

## Critical Rendering Path and Resource Hints

CSS is render-blocking: the browser will not paint until CSSOM is built. Inline critical above-the-fold CSS; load the rest with a non-blocking `<link media="print" onload="...">` or defer via JS. Never use `@import` in CSS — it forces serial requests.

`<script>` tags without `defer`/`async` are also parser-blocking. Use `defer` for scripts that need the DOM; `async` for independent scripts. ES modules are deferred by default.

**Resource hints:**
- `preload` — fetch a critical resource the parser won't discover early (LCP image, key font, critical script). Use `fetchpriority="high"` to boost; `fetchpriority="low"` to demote below-fold images.
- `preconnect` — warm the TCP+TLS connection to a third-party origin before the request is needed.
- `dns-prefetch` — DNS resolution only, cheaper than preconnect for lower-priority origins.
- `prefetch` — fetch a resource likely needed on the next navigation (low priority, background).
- `modulepreload` — preload and parse an ES module graph.
- **Early Hints (103)** — server sends `Link: rel=preload` headers before the full response is ready, giving the browser a head start on critical resources.

---

## JavaScript: The Most Expensive Bytes

Every JS byte costs: download + parse + compile + execute, all on the main thread. JS is more expensive per byte than images.

**Reduce JS payload:**
- Code-split by route and component — ship only what the current page needs.
- Tree-shake with ESM and `"sideEffects": false` in package.json — eliminate dead code.
- Lazy-load with dynamic `import()` — defer non-critical modules.
- Audit bundles with `bundle-analyzer` or `source-map-explorer` — identify bloat (moment.js, full lodash, large chart libraries).
- Prefer small/zero-dependency packages; use sub-path imports (`import debounce from 'lodash/debounce'`); prefer native APIs (`Intl` over moment, `fetch` over axios).

**Hydration cost** — in SSR frameworks, hydration re-runs component logic to attach event listeners to server-rendered HTML. Reduce with: islands architecture (only hydrate interactive components), partial/progressive hydration, React Server Components (RSC), or resumability (Qwik — serializes execution state, no re-execution).

**Third-party scripts** are often the largest, least-controllable cost. Audit, delay loading, use facade patterns (YouTube embed loads iframe only on click), or offload to a Web Worker via Partytown.

---

## Rendering Strategies

```
Static content            → SSG  (build-time HTML, CDN-cacheable, fastest TTFB)
Dynamic + SEO             → Streaming SSR + Suspense (shell first, fill later)
SSG + periodic freshness  → ISR / on-demand revalidation
Auth-gated SPA            → CSR acceptable (no SEO requirement)
```

Streaming SSR with `<Suspense>` sends the HTML shell immediately and streams in deferred content chunks — improves TTFB and perceived load. Islands architecture limits JS to interactive components, reducing both bundle size and hydration cost.

---

## Image and Font Delivery

Images are typically the largest bytes on the wire. Use AVIF (best compression) or WebP with `<picture>` / `srcset` + `sizes` for responsive delivery. Lazy-load below-fold images with `loading="lazy"`; keep the LCP image `loading="eager"` with `fetchpriority="high"`. Always set explicit `width`/`height` or `aspect-ratio` to prevent CLS.

For video: set a `poster`, use `preload="none"` for non-critical video, choose efficient encoding (H.265/AV1), avoid auto-playing heavy video.

Fonts trigger CLS when the fallback swaps to the web font. Mitigate with:
- `font-display: swap` — show fallback immediately, swap when loaded.
- `font-display: optional` — use web font only if already cached, no swap.
- `<link rel="preload" as="font">` for critical fonts.
- Unicode-range subsetting to ship only used characters.
- Variable fonts (one file covers all weights/styles).
- `size-adjust`, `ascent-override`, `descent-override` on the fallback `@font-face` to match metrics and eliminate layout shift on swap.
- Self-hosting eliminates the `preconnect` round-trip to a third-party font CDN.

---

## Caching: Layered Model

**HTTP caching headers:**
- `Cache-Control: max-age=31536000, immutable` — permanent cache for content-hashed assets (e.g. `app.a1b2c3.js`). Never changes; the filename changes on update.
- `Cache-Control: no-cache` + `ETag` — revalidate on every request; returns 304 if unchanged.
- `Cache-Control: stale-while-revalidate=86400` — serve stale immediately, revalidate in background.
- `Cache-Control: no-store` — nothing cached (but note: this breaks bfcache).

**Content-hash filenames** (`[name].[contenthash].js`) are the standard pattern for JS/CSS: long max-age + immutable means zero revalidation requests; a code change produces a new filename, instantly invalidating the cache.

**HTML** should use short cache or `no-cache` — it references hashed assets by name, so it must stay fresh.

**CDN caching** adds edge-level caching with cache keys, purge APIs, and `stale-while-revalidate`/`stale-if-error` directives for resilience.

**Service Worker cache** enables offline-first patterns (PWA); strategies include cache-first, network-first, and stale-while-revalidate at the application level.

---

## Network and Delivery

**HTTP/2 and HTTP/3** eliminate the need for domain sharding, CSS sprites, and JS concatenation — those are anti-patterns under multiplexing. HTTP/2 multiplexes streams over one TCP connection; HTTP/3 (QUIC) eliminates TCP head-of-line blocking (each stream is independent), adds **0-RTT** connection resumption (saves one round-trip on reconnect), and is more resilient on lossy networks.

**Latency dominates over bandwidth.** Beyond a threshold, increasing bandwidth barely improves page load; reducing RTT always linearly improves it. A single request pays: DNS resolution + TCP handshake + TLS handshake + TTFB — mostly round trips, not bytes. TCP slow start further limits throughput on new connections. **CDN's primary benefit is latency reduction** — moving the origin closer. Reduce round trips; reuse connections.

**Brotli > gzip** for text compression. Serve pre-compressed `.br` files via CDN or configure the server to compress on the fly.

---

## Edge and Distribution

Edge functions/workers run code at CDN PoPs globally, reducing TTFB for dynamic responses. Use for: A/B testing, auth checks, personalization, response transformation — anything that would otherwise require a round-trip to a central origin.

Multi-region deployments with distributed caches (Redis Cluster, Cloudflare KV, DynamoDB global tables) move data closer to users. For cache invalidation across regions, use event-driven propagation or short TTLs with `stale-while-revalidate`. Distinguish hot paths (edge-cached) from cold paths (origin-computed).

---

## Compositor Thread, Scheduler, and Frame Budget

**Frame budget: ~16.7ms at 60fps / ~8ms at 120fps.** All work (JS execution, style recalc, layout, paint) must fit within the budget or frames drop.

**Compositor-thread scrolling** — the compositor handles scrolling independently of the main thread unless a scroll listener blocks it. Always register scroll and touch listeners with `{ passive: true }` to allow the compositor to scroll without waiting for JS. Use `touch-action` to declare gesture intent and avoid blocking.

**Frame consistency** — one dropped frame is more perceptible than a consistent 55fps. Prefer steady frame delivery over occasional fast frames.

**Scheduler API** — `scheduler.postTask({ priority: 'user-blocking' | 'user-visible' | 'background' })` schedules work at the right priority. `scheduler.yield()` yields back to the browser mid-task to process input. `isInputPending()` checks if the user is waiting before continuing a batch.

`requestAnimationFrame` for visual updates synchronized to vsync; `requestIdleCallback` for truly low-priority background work.

Web Workers and `OffscreenCanvas` move heavy computation off the main thread entirely.

---

## JS Engine (V8) Internals

**Hidden classes (shapes)** — V8 tracks object structure to generate optimized machine code. Initialize all properties in a consistent order in the constructor; never dynamically add or delete properties. Shape changes force deoptimization to a slow path.

**Inline caches (ICs)** — call sites are optimized for the shapes they've seen. Monomorphic (one shape) is fastest; polymorphic (a few shapes) is slower; megamorphic (many shapes) disables IC optimization. Keep hot code paths monomorphic.

**Deoptimization** — type or shape changes in hot code trigger re-compilation on the slow path (visible as "Deopt" in the DevTools flame chart).

**Lazy parsing + code cache** — V8 defers full parsing of uncalled functions; on repeat visits it reads a compiled bytecode cache, avoiding re-parsing overhead.

---

## Memory and GC

**Common leak patterns:** detached DOM nodes (removed from the tree but held in JS), event listeners not removed on cleanup, timers (`setInterval`) referencing large closures, unbounded caches.

**GC stop-the-world pauses** cause jank. High memory pressure forces layer eviction and repainting. Keep the heap small by releasing references promptly.

**Weak references:** `WeakMap`/`WeakSet` for caches keyed by objects (does not prevent GC). `WeakRef` + `FinalizationRegistry` for lifecycle-aware cleanup.

**Tools:** DevTools Memory panel → Heap Snapshot (find retained size, detached nodes), Allocation Timeline (find leaks over time).

---

## Navigation-Level Levers

**bfcache (Back/Forward Cache)** — the browser freezes the entire page in memory on navigation; back/forward restores it instantly with no network request. It is broken by: `unload` event listeners, `Cache-Control: no-store`, open IndexedDB transactions, or unresolved Promises. Replace `unload` with `pagehide`. Test in DevTools → Application → Back/Forward Cache.

**Speculation Rules API** — `<script type="speculationrules">` declaratively preloads or prerenders the next likely URL. Prerendering runs the full page lifecycle in a hidden tab; navigation becomes near-instant.

```json
{ "prerender": [{ "source": "list", "urls": ["/next-page"] }] }
```

Both bfcache preservation and Speculation Rules are high-impact, low-adoption — strong differentiation.

---

## Measurement, Attribution, and Budgets

**Lab tools:** Lighthouse (audits + scores), WebPageTest (filmstrip, waterfall, multi-step), DevTools Performance panel (flame chart, long tasks, layout/paint events, frame drops).

**Field / RUM:** `web-vitals` library reports LCP, INP, CLS, FCP, TTFB with attribution (which element caused LCP, which interaction caused INP via LoAF). CrUX (Chrome User Experience Report) aggregates real-user data per origin. Build your own RUM pipeline by beaconing to an analytics endpoint.

**Attribution APIs:**
- **LoAF (Long Animation Frames API)** — identifies which script caused a long frame, directly attributing INP regressions.
- **Event Timing API** — breaks down interaction latency into input delay, processing time, and presentation delay.
- `web-vitals` attribution build includes element-level LCP source and INP interaction target.
- User Timing (`performance.mark`/`performance.measure`) and Element Timing for custom milestones.

**Device gap and distribution** — the median real-world device is a mid-range Android phone, far slower than a developer's laptop. Simulate with **CPU 4–6× throttle** and network throttling in DevTools. CWV thresholds are measured at **p75** — the long tail is the real experience; optimizing the mean while ignoring the 95th percentile leaves real users behind.

**CI performance budgets:** Lighthouse CI fails the build on score regression; `bundlesize` / `size-limit` fail on bundle growth. Without automated guards, performance silently degrades. **Measure field data first, locate the bottleneck (JS bundle, third-party scripts, LCP image), fix, verify, then lock in a budget.**

**Perceived performance:** Skeleton screens and content placeholders prevent blank-page anxiety. Optimistic UI updates reflect actions before server confirmation. Streaming SSR delivers a usable shell in milliseconds. Intent-based prefetch (hover, `IntersectionObserver` near-viewport) makes navigations feel instant. < 100ms feedback makes interactions feel immediate.

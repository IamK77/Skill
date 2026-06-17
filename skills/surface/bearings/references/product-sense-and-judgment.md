# Product Sense & Design Judgment — Build the Right Thing, Build It Right

> Frontend engineers sit closest to the user surface. That proximity is a responsibility: you are the last human between a decision and its consequences on a real person. Product sense is not a PM skill you borrow — it is yours to exercise at every commit.

---

## 1. Requirements ≠ Problems

- **Build the solution to the problem, not the feature that was named.** When a PM says "add a dropdown," that is their hypothesis about a solution. Excavate the actual job-to-be-done.
- **Ask why before what.** When a spec does not serve the underlying goal, push back. A spec that contradicts the user's real need is a bug in the product process.
- **You are a product thinker, not a ticket executor.** The frontend layer is where users feel every decision — own that.

---

## 2. The Cost of Every Feature

- **Every feature has a cost:** development time, maintenance burden, cognitive load on users, and expanded surface area for bugs, accessibility failures, performance regressions, and i18n edge cases.
- **The best product decision is often "don't build it."** Each additional option or setting dilutes the core.
- **80/20 iteration:** What is the smallest thing that solves the real problem? Ship it, learn from it, iterate. Do not build the complete vision in one pass.
- **Scope/quality/time trade-offs must be explicit.** Never let the trade-off be implicit — name it, choose deliberately.

---

## 3. Friction as a Design Primitive

- **Friction is a tool, not a failure.** Apply it deliberately, not accidentally.
- **Core flows:** strip friction aggressively. Every extra step, field, or confirmation is a tax on the user.
- **Destructive / irreversible actions:** add friction intentionally — confirmation, secondary input, explicit acknowledgment.
- **Undo beats confirmation dialogs.** Make the happy path frictionless and errors recoverable. Reversibility is superior to interception.
- **Reversible vs. irreversible decisions:** move fast on reversible ones; be slow and deliberate on one-way doors.

---

## 4. Information Architecture & Hierarchy

- **One primary element per screen.** Most "confusing UIs" are information architecture failures, not visual ones. IA expresses priority; if everything competes, nothing wins.
- **Progressive disclosure:** show the common case; hide complexity behind "Advanced." Never dump everything at once.
- **Defaults are decisions.** The default option is what most users get. Defaults must serve the user — not a business dark interest, not engineering convenience.
- **Words are UI.** Use the user's language, not internal jargon. Structure should match the user's mental model, not the database schema or the org chart.

---

## 5. State Design — The Full Map, Not Just the Happy Path

Design every state. A product that only designs the ideal filled state is not finished.

| State | What it requires |
|---|---|
| Empty / zero items | An invitation or explanation, not a blank void |
| First run / onboarding | Treat as activation — this is a product moment |
| Loading | Feedback; skeleton > spinner where structure is known |
| Error | Recover the user, never blame them |
| Partial failure | Surface what succeeded, not just what failed |
| Offline / degraded | Communicate status, preserve what can be preserved |
| No permission | Explain why, offer a path forward |
| 10 000 items / overflow | Pagination, virtualization, truncation — planned |
| Long text / emoji in names | Layout must not break |

- **Zero state = activation battleground.** The moment a new user sees nothing is your best onboarding opportunity. Waste it and they churn.
- **Edge cases are product decisions, not bugs.** "What happens when there are 0 results?" is a product question with a right answer.
- **Error states are product moments.** Good error copy restores confidence; bad error copy assigns blame.

---

## 6. Data Model Shapes the Product

- **The shape of your state determines what is easy and what is impossible in the UI.** Product-minded engineers think about the state model early, because it constrains the experience.
- **Derive, don't store.** Derived state should be computed, not duplicated. Single source of truth prevents the divergence bugs that degrade trust.
- **Optimistic vs. pessimistic updates** is a UX decision about perceived speed vs. accuracy. Choose deliberately; do not inherit it from whichever is easier to implement.

---

## 7. Measurement & Its Ethics

- **You optimize what you measure.** Choosing the right metric is itself a product judgment. Vanity metrics (raw engagement, clicks) vs. user-value-aligned metrics (task completion, retention quality) produce different products.
- **A/B testing discovers manipulation.** Gradient descent on engagement will find dark patterns. Optimizing for the reflective, long-term self — not the impulsive click — is a product choice, not a constraint.
- **Guardrail metrics.** Never optimize a single number to the point of harm. Instrument the thing you are not trying to move and watch it.
- **Qualitative + quantitative.** Talk to users; do not govern by dashboard alone. The dashboard will not tell you why.

---

## 8. Ethics Layer — The Interface as a Membrane

- **Reject dark patterns outright:** confirmshaming, forced continuity, roach motels (easy in, hard out), pre-checked consent, disguised ads, fake urgency/scarcity.
- **Honest defaults + genuine consent.** Default states should favor the user. Opt-in for data collection, not opt-out buried in settings.
- **Respect user attention and agency.** Do not engineer addiction; do not weaponize the recommendation loop.
- **Accessibility and inclusion are product quality.** "Who does this design exclude?" is a product question. Inaccessible features are not features for those excluded.
- **Power asymmetry.** You shape the choice architecture. Use it responsibly.

---

## 9. The Reality Long-Tail — What Real Products Must Handle

Demo-time is 20 % of the work. The remaining 80 % lives in failure modes, weird inputs, race conditions, and untested environments. Default to defensive.

### Numeric Traps
- Money and finance: never use floating point. Use integer cents or a decimal library. `0.1 + 0.2 !== 0.3`.
- 64-bit integer IDs from the backend exceed `Number.MAX_SAFE_INTEGER` (2^53) — treat them as strings.
- `NaN !== NaN`; guard all parsing paths.

### Time Traps
- `Date` is broken: months are 0-indexed; string parsing is timezone-ambiguous (`"2023-01-01"` is UTC, `"2023/01/01"` is local).
- Never add 86 400 000 ms to "get tomorrow" — DST days are not 24 hours. Use a date library or Temporal.

### Async & Race Conditions
- **Stale response problem:** rapid input → slow response arrives after a faster one → old data overwrites new. Fix with `AbortController` and request-ID tracking.
- Debounce + disable to prevent double-submit. Server endpoints must be idempotent.
- `Promise.all` fast-fails; use `allSettled` when partial success is acceptable.
- `setTimeout` is not a reliable clock — throttled in background tabs, minimum latency exists.

### Input & File Reality
- Paste from Word or rich sources delivers HTML/RTF — sanitize clipboard data.
- File type validation: check magic bytes, never trust extension or MIME header alone.
- `dragover` must call `preventDefault()` or `drop` will not fire.
- `<input type="number">` mutates on scroll and behaves inconsistently with locale decimal separators.
- Autofill does not fire `change` events — account for this in form validation.
- IME composition: do not process keystrokes mid-composition.

### Third-Party & Environment Failures
- **Every external dependency will fail.** Analytics, fonts, widgets, CDNs — your page must survive their absence. Wrap in async loading, timeouts, try-catch, and facade patterns.
- Ad-blockers also block by class name and selector — never name elements "ad", "tracker", "analytics".
- `localStorage` throws in Safari private mode and when storage quota is exceeded — always wrap in try-catch.
- Schema-version your stored data; a schema migration path is required from day one.
- Browser extensions (Grammarly, Google Translate) mutate the DOM and cause React hydration errors — design defensively.

### Defensive Patterns
- Validate at every trust boundary: user input, API responses, URL parameters, localStorage reads. Use schema validation (Zod or equivalent).
- React error boundaries + `window.onerror` / `unhandledrejection` handlers — report to observability (Sentry).
- Test unhappy paths explicitly: empty, errored, slow, malformed, concurrent.
- You cannot reproduce every user environment locally — observability in production is not optional.

---

## 10. Surface Diversity — No "Average" Surface Exists

Your MacBook with a fast connection and a mouse is the single least representative surface in your user base. Design for the spectrum.

### Layout Across Sizes
- **Container queries over viewport queries** for component-level responsiveness. A component must work in a sidebar and at full width — it cannot be tied to a global viewport breakpoint.
- **Breakpoints follow content, not device names.** Set a breakpoint where the layout breaks (line length, grid collapse), not at "iPhone" or "iPad" widths.
- **Mobile-first:** design for the constrained surface, enhance upward. This forces prioritization.
- **Intrinsic / fluid layout:** `clamp()`, `min()`, `max()`, `grid auto-fit`, fluid type scales — adapt without hard breakpoints where possible.
- **Viewport units on mobile:** use `dvh`/`svh`/`lvh` instead of `vh`; account for notches with `env(safe-area-inset-*)`.

### Input Modality
- Touch, mouse, keyboard, stylus, voice, gamepad — design for all, assume none.
- `@media (hover: hover)` before adding hover-only interactions. `@media (pointer: coarse)` to increase target size.
- **Touch targets ≥ 44 × 44 px.** Non-negotiable. Quantifiable. Often ignored.
- Never put essential information only in hover state — it is invisible on touch surfaces.
- Keyboard full operability is not an accessibility add-on; it is a baseline.

### Capability & Progressive Enhancement
- Start from a universally capable baseline (semantic HTML, server-rendered content), then enhance for capable environments.
- **Feature detection, never UA sniffing.** `@supports`, `'feature' in window` — not user-agent strings.
- "No JS" baseline: forms submit, links navigate, content renders.
- Adaptive loading: respect `navigator.connection.effectiveType`, `saveData`, `deviceMemory`, and `hardwareConcurrency` — send less to constrained devices.
- Respect all `prefers-*` media features: `reduced-motion`, `color-scheme`, `contrast`, `reduced-data`.
- **`forced-colors` (Windows High Contrast Mode):** the OS overrides your colors. Do not break it. Use system color keywords; test under `@media (forced-colors)`.

### Non-Web Surfaces
- **Email is not the web.** Outlook renders with Microsoft Word's engine. Gmail strips `<style>` tags. Use table layout, inline styles, limited CSS. Design for images-off (alt text + bulletproof buttons). Test across clients (Litmus / Email on Acid). This is a separate discipline with 2005-era constraints.
- **Embedded widgets / third-party contexts:** your component runs in an unknown host page. CSS leaks both ways. Use Shadow DOM / Web Components for style and DOM encapsulation. iframe for full isolation (with postMessage communication cost).
- **SSR / SSG:** your code runs on the server (no `window`, no `document`) and in the browser. Never access browser globals at module load time.
- **Print:** `@media print` is a real surface. Reading-mode extensions and translation tools will mutate your DOM.

### Language as a Surface
- Text expansion, RTL scripts, non-Latin typefaces, locale-specific number and date formatting — the same UI must work across all of them. i18n is a surface diversity problem, not an afterthought. Design layouts that absorb ±40% text length change; never hardcode widths that depend on English string length.

### Testing Strategy
- Real devices, not only emulators — especially low-end Android and real iOS with real touch input.
- Cross-browser cloud testing (BrowserStack / Sauce Labs).
- The matrix is too large to test exhaustively — **prioritize by your actual analytics data.** Test the surfaces your users use.

---

## 11. Design-Language Judgment — Non-Default Choices, Quantified

High craft = a set of deliberate non-default choices. Every dimension below can be codified as a rule, a token, or a quantified threshold. If you cannot articulate why you made the choice, you defaulted.

### Color
- **Build color systems in oklch, not hsl.** HSL's lightness is perceptually non-uniform — same L value looks dramatically different across hues. oklch L is perceptually consistent.
- **Never use pure neutral grays.** Tint grays toward the brand hue at very low chroma (C ≈ 0.005–0.03). Pure gray is amateur; micro-tinted gray has character and unifies the surface.
- **Do not use pure black or pure white at large scale.** Body text: L ≈ 0.18–0.25. Background "white": L ≈ 0.97–0.99 with a micro tint.
- **Semantic colors (success/warning/error/info) at equal L and similar C**, varying only hue — so they read as a family.
- **Dark mode ≠ inverted light mode.** Elevation in dark mode is expressed through surface lightness increases, not added white opacity overlays. Brand colors usually need reduced L and C to avoid glare on dark backgrounds.
- **Contrast floors:** WCAG 2 minimum — body text ≥ 4.5:1, large text / UI graphics ≥ 3:1. Target APCA Lc for precision: body Lc ≥ 75, large text Lc ≥ 60, non-text Lc ≥ 45.
- **Color proportion:** 60-30-10 — dominant neutral / secondary / accent. Accent area > ~10% is almost always too much.

### Typography
- **Modular type scale.** One ratio (e.g. 1.25) generates the entire scale — not nine hand-picked sizes. Content-dense UIs: small ratio (1.2). Display pages: larger ratio (1.5–1.618).
- **Fluid type:** `clamp(min, viewport-unit, max)` — smooth scaling without hard breakpoints.
- **Tracking adjusts with size.** Large headlines: tighten (−0.02 to −0.04em). All-caps / small labels: loosen (+0.05 to +0.1em). This single step distinguishes professional from default.
- **Line height inverts with size.** Body: 1.5–1.65. Headlines: 1.05–1.25. Display: can reach 1.0. Rule: the larger the type, the tighter the leading.
- **Line length: 45–75 characters, target ~65ch.** Set `max-width: 65ch` on text blocks. Over 75 characters per line is unreadable.
- **`font-variant-numeric: tabular-nums`** on all numbers in tables, prices, data columns — they must align.
- **`text-wrap: balance`** on headlines (prevent ragged last lines); **`text-wrap: pretty`** on body (prevent orphans). Neither is default behavior.
- **Font families ≤ 2; weights ≤ 3.** Hierarchy comes from size + weight + color, not typeface proliferation.

### Spacing & Layout
- **Half-geometric scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Not purely linear (mechanical), not random.
- **Proximity ratio: group gap ≥ 2× within-group gap.** This is the single most common amateur failure — everything equally spaced, so groupings are illegible. Quantifiable and automatable.
- **Optical alignment over mathematical alignment.** Icon + label: visual center, not bounding-box center. Pointy shapes need slight overshoot.
- **Generous, rhythmic whitespace.** The shared characteristic of polished interfaces is more whitespace than feels comfortable.

### Depth & Shadow
- **Multi-layer shadows, not single hard shadows.** Layer 1: close, tight, slightly darker (contact shadow). Layer 2: farther, large blur, very faint (ambient). Each layer opacity: 0.03–0.12.
- **Tint shadows toward brand hue** — never pure black shadows.
- **Unified light source direction** across the entire product.
- **Separate elevation levels** into named tokens (resting / raised / overlay / modal), each with fixed y / blur / spread / opacity values.
- Prefer elevation + whitespace to divide regions. Use borders only when necessary — and then extremely low contrast (1px, low opacity).

### Shape & Nesting
- **Consistent radius scale:** 4 / 8 / 12 / 16 / full — never arbitrary values.
- **Nested radius rule:** `inner radius = outer radius − gap (padding)`. If a card and the button inside it share the same radius, the inner corner appears to bulge. This formula makes them concentric. Violating it is the most common precision failure in component design.

### Motion
- **Compose-only properties:** `transform` and `opacity` exclusively. `width`, `height`, `top`, `left` trigger layout — never animate them.
- **Non-linear easing:** custom `cubic-bezier` tokens or spring physics. Linear transitions are default and look mechanical.
- **Duration tiers:** micro-feedback 100–150ms, transitions 200–300ms, large elements 300–500ms.
- **Orchestrate, don't scatter.** A staggered entrance sequence reads as intentional. Simultaneous independent animations read as noise.
- **Respect `prefers-reduced-motion`.**
- **More animation is worse, not better.** Excessive animation is one of the most reliable markers of low-craft AI-generated UI. Restraint signals confidence.

### Developing Judgment
- **Study finished, polished products** deliberately — not to copy, but to train the eye for what "right" feels like in each dimension. Craft judgment is accumulated through observation, not derived from rules alone. Know what good feels like before you try to produce it.
- **Coherence is taste made visible.** A product with taste feels like it was built by one mind: patterns are consistent, the language is unified, nothing jars. Inconsistency in a UI is the fingerprint of parts built without a shared model.

### The Three Default Aesthetics to Actively Avoid
Unless the brief explicitly calls for one of these, avoid them — they are convergence traps, not choices:
1. Warm cream background + high-contrast serif + ochre accent
2. Near-black background + single neon accent
3. Newspaper thin lines + zero border-radius + dense columns

---

## 12. Decision Checklist

| Dimension | Anchor question |
|---|---|
| Problem | Am I solving the real job-to-be-done, or implementing a named feature? |
| Cost | What is the maintenance and cognitive cost of adding this? Is "don't build it" better? |
| Friction | Is this friction intentional? Does undo exist before I add a confirm dialog? |
| IA | One primary element per screen? Does the default serve the user? |
| States | Have I designed empty / loading / error / partial / offline / zero / overflow / long-text? |
| Data model | Does my state shape make the right things easy and the wrong things hard? |
| Metrics | Am I measuring user value, or a vanity proxy? Do I have guardrail metrics? |
| Ethics | Does this respect user agency? Does it exclude anyone? Any dark patterns? |
| Surface | Have I tested on a low-end device, on touch, with keyboard-only, in forced-colors? |
| Long-tail | Have I handled money as integers, dates with a library, race conditions with AbortController? |
| Design lang | Can I name the non-default choice in each dimension? Is every number from a token? |
| Trade-off | Have I named the scope / quality / time trade-off explicitly? |

# The Frontend Lifecycle Handbook — From Zero to One, the Phases That Matter

A navigator's map of the modern frontend lifecycle. Place a task in its phase, understand what owns that phase, and route to the right surface skill. Greenfield walks phases 0→6 in order; real work arrives mid-stream — the value is naming the phase, not re-walking the whole path.

---

## Three Governing Principles (hold these across every phase)

1. **Boundaries over frameworks.** Frameworks are the most-discussed, least-durable decision; they get replaced. Boundaries (the trust line, the source-of-truth assignment, the state classification) are the least-discussed, most-durable — they fossilize into the foundation.
2. **Allocate care by reversibility.** One-way doors (data model, rendering architecture, consistency model, network boundary) deserve slow, deliberate judgment. Two-way doors (colors, a component's internal implementation) deserve fast, cheap action. Most "analysis paralysis" is misapplying one-way-door caution to two-way-door decisions.
3. **The source of truth lives in the user's mental model, not the database.** Build the mental model first; then let the data structure serve it.

---

## Phase 0 — Before the First Line of Code

**Surface skill: `bearings`**

Zero sunk cost, maximum leverage. Every decision here is a one-way door that cannot be unmade cheaply. No business code is written; the fate of the project is decided.

### The decisions that must happen here

**1. Mental model and key journeys — not the schema.**
Map the core domain and 3–5 key user journeys (jobs-to-be-done). Write a **perception contract**: latency tolerance lines (100 ms = direct manipulation; 1 s = thought interrupted; 10 s = attention lost) and animation timing (causal narrative, not decoration). These become hard architecture constraints downstream.

**2. The boundaries — the real architecture decision.**
- Where does the network/trust line fall? Everything on the client is untrusted; validation must be duplicated server-side.
- What is the consistency requirement? Ordinary request-response, or realtime / offline / collaborative? The latter means building a human node in a distributed system (CRDT, eventual consistency, conflict resolution). This reshapes the entire architecture and cannot be deferred. If the answer is realtime/collaboration, the correctness of that belongs to `distributed:holdfast`.

**3. Rendering architecture, derived from requirements — not from popularity.**

| Product type | Architecture | Why |
|---|---|---|
| Content site (marketing, blog, docs) | SSR / SSG, or MPA + progressive enhancement | Keep the platform's free gifts: URL semantics, back button, accessibility, SEO |
| Post-login app | SPA or RSC | Complex interaction, complex state, SEO irrelevant |
| Hybrid (e-commerce, news) | Islands / partial hydration | Needs both SEO and local interaction |

Choosing an architecture is choosing which platform gifts you keep and which you re-invent by hand. Teams that miss this rebuild the browser inside an SPA and do it worse.

**4. Objective function and ethics, before any dashboard exists.**
Declare what you are optimizing, what that objective does when pointed at human neurology, and where the guardrails are. Once a dashboard exists it starts pulling you; this must be front-loaded.

### Exit standard
One page states: the core journeys, where the boundaries are, which rendering architecture and why, which metrics and their ethical guardrails.

**Artifacts:** User journey map · perception contract · boundary decision doc (with consistency model) · metrics/ethics charter.

---

## Phase 1 — The Walking Skeleton

**Surface skill: `keel`**

Prove the entire pipeline in one trivially thin real slice before building anything wide. The project's death usually happens at integration seams, not at a hard component. Expose those seams on day one.

### How it works
One real page → real data fetch → real render → real deployment → CI green. The feature can display a single server-sourced string. The goal is to **pierce every integration seam**, not to build a feature.

**Toolchain — treat as a commodity, select by criteria:**
- Build / dev server: fast start, stable HMR
- Language: TypeScript (non-negotiable — the tool that makes illegal states inexpressible)
- Framework: from Phase 0's rendering model, weighted by team familiarity over benchmarks
- Routing: must support the rendering model (nested routes, streaming)
- Server-state: a query library that treats server state as cache (TanStack Query class)
- Styling: chosen as a **scope strategy**, not aesthetics (atomic = no cascade coupling; CSS Modules / CSS-in-JS = compile-time or component-boundary scope; BEM = manual simulation, most fragile)

### Contracts that cannot drift
- API types auto-generated from a single source of truth (OpenAPI / GraphQL / tRPC) — front and back cannot each maintain their own copy; drift is structurally prevented.
- Design tokens (spacing, type scale, color, animation timing) committed to code constants — the perception contract materialized.

### Exit standard
One real feature, user action to server and back to screen, running through CI and auto-deployed to a preview environment.

**Artifacts:** Deployable minimal vertical slice · CI/CD pipeline · auto-generated type contract · design tokens.

---

## Phase 2 — State Architecture

**Surface skill: `wellspring`**

The heart of the system. State complexity is the upper bound on project complexity. Every prior philosophy — mental models, boundaries, type contracts — cashes out here.

### The four buckets (mixing them is the root of almost all state bugs)

| Kind | Owner | Key rule |
|---|---|---|
| Server cache state | Query library | Managed as a cache: invalidation, deduplication, stale-while-revalidate, background refresh |
| URL state | Router | Everything that should be shareable, bookmarkable, or navigable via back/forward |
| Local UI state | Component | Default location — modal open/closed, current input value |
| Truly global client state | Store / signals | Use it, but keep it small |

The critical insight: 90% of what teams call "global state" is server cache. Separate it out and the global store shrinks dramatically. Most Redux pain originates here — cache masquerading as local state.

### Three iron rules
1. **Minimize the source of truth; derive everything else.** Never store derived values (a filtered list, an "all selected" flag) — compute them inline. Storing a derived value is signing a contract to sync it on every mutation; you will eventually break that contract.
2. **Model difficult interactions as explicit state machines.** A form / wizard / upload is not a dozen boolean flags; it is `idle → submitting → (success | error)`. Use a state-diagram lens to eliminate illegal *transitions*, not just illegal states. Use XState-class libraries when warranted; otherwise keep the lens even without the library.
3. **Use two graphs, not one.** The component tree is optimized for visual nesting. Data dependencies are an arbitrary DAG. When their shapes differ, prop drilling appears as the symptom. Default to composition (lift state, pass props, use compound components). Reach for context / store / signals only when the tree genuinely cannot express the dependency.

### Component API design
- **Composition over configuration.** Offer composable primitives (slots, compound components, headless patterns) rather than a configurable monolith.
- **Deliberately under-abstract.** Apply the rule of three — extract a pattern only when it recurs a third time. Premature abstraction costs more than a little repetition.

### Exit standard
You can draw: where each piece of state lives, who holds the source of truth, what the state machine for each key interaction looks like. Any "two pieces of state out of sync" bug immediately points to the bucket classification that was broken.

**Artifacts:** State classification convention · state diagrams for key interactions · component composition spec.

---

## Phase 3 — Build Each Feature — Unhappy Paths First

**Surface skill: `seaworthy`**

A feature is not done when the happy path works. The unhappy paths — loading, error, empty, edge — are the product's quality. Build them first.

### The key inversion
Loading / error / empty states are not afterthoughts; they are **illusion maintenance** — the product's promise to the user when reality is uncertain or broken. These states are the quality of the product. The happy path is the easy part.

**Illusion maintenance toolkit:**
- **Optimistic updates:** show the likely-true result before confirmation; avoid the cause-effect break of "click → nothing → finally moves."
- **Causal animation:** let new elements grow from the source that triggered them, so the user's mental model of cause and effect holds.
- **Honest loading/error states:** when the illusion cannot be maintained, say so plainly — never a blank screen or silent failure.

### Three hard constraints parallel to building
1. **Accessibility from day one (the second render tree).** Semantic HTML, keyboard reachability, focus management, ARIA only where semantics fall short. Adding it later costs multiples more and is an ethical problem, not just a technical debt.
2. **Performance budget is a CI-enforced hard constraint from the start.** Attach a number to perceived performance (INP < 200 ms), measure it in CI, do not defer. Optimizing later without a prior contract is optimizing toward an unknown target.
3. **All four states — loading, error, empty, happy — are implemented together** for every feature, never left as TODO.

### Exit standard
With the network randomly cut, with endpoints returning 500, with empty data — the UI catches the user gracefully. Keyboard navigation completes the core flows. Core pages' Web Vitals are within budget.

**Artifacts:** Complete feature slices (all four states) · perf and a11y gates in CI.

---

## Phase 4 — Correctness: Test the Behavior, Not the Structure

**Surface skill: `trials`**

Tests are an investment. The return is confidence that behavior is preserved. A test that breaks on every refactor is not a net — it is a straitjacket.

### Strategy
- **Most value is in integration / behavior tests.** Use testing-library / Playwright-class tools to run real user flows; test contracts and behavior, not internal implementation details.
- **The type system already eliminates one entire class of bugs** (illegal states) for free — do not write tests for what TypeScript already proves.
- **E2E tests cover critical paths only:** revenue, authentication, non-reversible operations.
- **Visual regression + a11y checks automated** in CI.

After any refactor, a behavior test stays green (behavior unchanged) or turns red precisely where behavior changed. Red on implementation-detail change means the test measures the wrong thing.

### Exit standard
Key user flows have E2E coverage. Changing one implementation detail does not blow up a page of tests. After a refactor the suite either stays all-green or pinpoints exactly which behavior changed.

**Artifacts:** Behavior / integration test suite · critical-path E2E · automated visual and a11y checks.

---

## Phase 5 — Deliver and Observe

**Surface skill: `lookout`**

Shipping is not the end; it is the start of a conversation with reality. Every change should be visible in minutes and measurable with real-user data. The objective function must pass an ethics gate before the experiment framework runs.

### How it works
- **Preview deploy per PR.** The perception contract can only be judged by eye; compress the feedback loop to minutes.
- **Observability in two tiers:** perceptual metrics (RUM — Core Web Vitals LCP/INP/CLS — plus Sentry-class error tracking); and product analytics (A/B tests and feature flags).
- **Progressive rollout / feature flags:** new features launch to a percentage; problems roll back in seconds.

### The ethics gate on A/B testing
A/B testing is a gradient-descent optimizer: each experiment keeps the higher-metric variant; run a thousand times it slides toward whatever the metric rewards — including manipulation, by no one's design, found by search. Before running experiments, audit:
- **Objective function:** what does this metric reward when pointed at human neurology? What does the local optimum look like, and where are the guardrails?
- **Reflective vs impulsive self:** do not optimize the impulsive self (time-on-site, infinite-scroll variable reward) at the cost of the reflective self (considered wellbeing).
- **Reversibility test:** if the user saw every mechanism and intention, would they endorse the design?
- **Friction audit:** where you make something easier or harder at a point where your interests and the user's diverge — ask whose interests are served. GDPR mandates friction symmetry on consent.

### Exit standard
Any change is visible and monitored within minutes. Production errors alert. Key metrics are observable. The A/B / progressive-rollout framework is ready, and its objective function has passed the ethics gate with declared guardrails and a kill-switch.

**Artifacts:** Preview deploy pipeline · RUM + error tracking · feature flag / experiment framework · metrics ethics review record.

---

## Phase 6 — One to Many: Resist Entropy

**Surface skill: `bulwark`**

The product is live. The real enemy is now entropy and the drift between the two graphs. This is a steady state, not a stage with an exit.

### How it works
- **Keep the architecture readable:** boundaries enforced by lint rules and fitness functions; state classification maintained; **dead state pruned** — stored derived values are the first sites of rot.
- **Refactor only when the pattern recurs** (rule of three again). Do not abstract for imagined reuse.
- **Align module boundaries to team boundaries** (Conway's Law). Architecture will eventually mirror the org's communication structure; fight this by deliberate alignment rather than surprise drift.
- **The design system is a real artifact, not tribal knowledge:** a living component catalog (Storybook-class) with documentation, so the mental model is shared and searchable by anyone, not carried only in long-tenured engineers' heads. The metric: a newcomer ships their first feature without asking a person.

### Exit standard
Adding a new feature of the same type costs roughly what the first one cost — complexity has not grown with codebase size. New engineers ship from documentation alone. Anyone who breaks a boundary is caught by CI.

**Artifacts:** Boundary-constraint rules · living design system / component catalog · architecture and onboarding docs.

---

## Phase Map — At a Glance

| Phase | One sentence | Surface skill | Entry signal |
|---|---|---|---|
| 0 · Before code | Think through the one-way doors: model, boundary, rendering architecture, ethics | **bearings** | Nothing exists yet; or "should we build this and how" |
| 1 · Skeleton | Prove the pipeline end-to-end; eliminate integration risk | **keel** | Decisions made but nothing runs end-to-end; or hydration/contract pain |
| 2 · State | Classify state, minimize sources of truth, model the state machines | **wellspring** | A running skeleton with a state swamp, out-of-sync bugs, prop drilling, flag soup |
| 3 · Build | Build unhappy paths first; a11y and perf budget baked in | **seaworthy** | State sane but features break ugly, feel janky, or lack loading/error/empty handling |
| 4 · Correctness | Test behavior not structure; E2E on critical paths | **trials** | Features work but the test suite breaks on every refactor |
| 5 · Ship | Preview + RUM; A/B only after the ethics gate | **lookout** | About to ship, running an A/B test, choosing a metric, worried it's manipulative |
| 6 · Scale | Enforce boundaries, prune, align to Conway, living design system | **bulwark** | It's live and rotting — boundaries eroding, onboarding slow, abstractions compounding |

---

## Meta-Principles — Where Expert Judgment Separates from Framework Fluency

1. **Optimize for change, not the first version.** The biggest trap going from 0 to 1 is building for the demo. The 100th feature should cost as much as the first; this requires only: a small source of truth, enforced boundaries, honest contracts, and ruthless deletion.
2. **The most dangerous decisions are always the one-way doors.** Data model and network boundary are expensive to change; concentrate almost all caution there and move fast everywhere else.
3. **Connect end-to-end before building wide.** Integration points are where projects die. The walking skeleton eliminates them on day one.
4. **Test behavior, not structure; manage boundaries, not frameworks; classify state, don't merge it.** Three sentences cover 80% of daily judgment calls.
5. **Taste is load-bearing and cannot be outsourced.** As AI writes more code, "typing code" depreciates. What appreciates is exactly what this lifecycle's judgment calls require and cannot automate: where to draw the boundary, how to model the user's mental model, what "feels right" in the perception contract, what the objective function does to real people. The expert's leverage shifts from the keyboard to the membrane between machine and mind — asking less often "how do I write this" and more often "where does this boundary belong, whose source of truth is this, what causal story forms in the user's head, and whose interests is this optimizer actually serving."

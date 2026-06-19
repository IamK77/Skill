---
name: systems
description: >
  The design-system lens for an atelier build — where tokens, components, and patterns
  become one coherent, non-drifting artifact, and "design says one thing, code does the
  other" is decided. Use after the other atelier lenses have produced their tokens,
  when auditing a token architecture, or when a component library rots. The one shift: the design system is itself
  STATE, so it gets ONE source of truth — tokens cross the CSS↔JS boundary from one
  source, the library is a living artifact, design→code does not drift — the agent
  re-types tokens per file and lets the system rot, so this is gated. Hands the
  boundary-enforcement contract to surface:bulwark at 1→N. Triggers on
  "design system / token architecture / token source of truth / @layer tokens / CSS↔JS /
  Style Dictionary / vanilla-extract", "component library / Storybook / visual regression
  / pattern library / living documentation / stability tier", "design→code drift / Figma
  handoff / design sync / tokens in two languages / two sources of truth".
argument-hint: "[the design system / component library / token architecture to make non-drifting]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# systems

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An atelier is a craftsman's studio — the place where the individual lenses (color, type, form, motion) are forged. `systems` is the workbench that holds them together: the skill that turns a set of well-chosen tokens into **one coherent, non-drifting system** by establishing the architecture that makes drift structurally impossible. Where the other lenses decide *what the values are*, `systems` decides *where they live, how they cross every language boundary, and how they stay in sync* — permanently. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: the design system is itself state, so it gets one source of truth.** A CSS token file and a JS color object that both list the same palette are not two views of the same truth — they are two sources of truth, and the moment one is updated without the other, the surface is subtly two-toned, and no one knows why. The same law that `surface:wellspring` applies to application data (`the design system is itself state, one source of truth`) applies here to the design artifact: one source authors the tokens; every language reads from it. This is not a "keep things in sync" convention — it is the only architecture that does not rot under normal development velocity.

This is where the agent era bites:
- **The agent re-types tokens per file and feels no wrongness.** It will write `'#2563eb'` in an inline style object, `oklch(0.62 0.18 250)` in a CSS file, and `color.primary = '#2563eb'` in a `tokens.ts` — each plausible alone, the set a three-source system that will drift in three different directions within a sprint. It has no sense of the system degrading; the architecture must make the wrong thing impossible.
- **The agent treats a Figma file as the source of truth.** It will generate code "to match the design" by reading screenshots and re-deriving values — reinventing, not consuming. Reinventing is the first step of drift. The token source is code; Figma is a downstream consumer.
- **The agent reaches for prop explosion.** Every component variation becomes a boolean flag: `<Button variant="..." size="..." iconLeft="..." ghost pill loading>`. The combinations multiply; the component is unmaintainable. Composition over configuration is a structural decision, not a style preference — the agent will not make it without instruction.
- **The agent skips living documentation.** It generates components without stories, without accessibility contracts, without a stability tier. The library appears to grow, but no one can consume it correctly, and no CI catches visual regressions. A library with no living documentation is a library that has already started to rot.

**Read [references/token-architecture-one-source.md](references/token-architecture-one-source.md) first** — the taxonomy, the three-layer architecture, the CSS↔JS boundary mechanics, and the IACVT footgun. For `systems`, the axis that is load-bearing: **the single source of truth is an architectural decision, not a convention**. The CSS↔JS boundary mechanics (the four options, the inline-style-beats-class-rules trap) are the encodable technique; deciding which source architecture fits the stack is the taste call that belongs to each gate. Load at the start; re-check at every gate.

**This skill consumes the output of the other atelier lenses.** Color, type, form, and motion each produce tokens as their delivered artifact. `systems` takes those tokens, places them in the three-layer architecture (raw → semantic → component), closes the CSS↔JS boundary, and makes the living library the single point of contact for everything downstream. Cross-reference `surface:wellspring`'s law "the design system is itself state, one source of truth" — this skill is that law applied to the design artifact itself. Cross-reference `surface:bulwark` — it enforces the system at 1→N (the PR review pass that catches drift before it merges); its gate is only meaningful when `systems` has built the structure bulwark will protect.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/token-architecture-one-source.md](references/token-architecture-one-source.md)** — the heart: the token taxonomy (color/type/space/radius/motion), the three-layer architecture (raw → semantic → component), CSS custom property mechanics (`@layer`, `@property`, scoping, IACVT), the four CSS↔JS boundary options, and the inline-style-beats-class-rules trap. Load at the start; re-check at every gate.
- [references/the-living-component-library.md](references/the-living-component-library.md) — the primitive → composition → pattern hierarchy; composition over configuration; how the system documents itself (Storybook, visual regression, auto-generated props, accessibility contracts); the stability tier contract; and the Figma↔code relationship.
- [references/design-to-code-handoff.md](references/design-to-code-handoff.md) — the four things design hands to code; the audit that catches drift (literal-grep, cross-language duplication check, theme-parity check, visual regression); Style Dictionary as one-source-generates-many-outputs; the sync loop invariants; and the seam to `surface:bulwark`.

> **The arc is one non-drifting system.** Three stages — token architecture · the living library · handoff and audit — turn a pile of design decisions into a structurally enforced artifact: the token source of truth is decided and the CSS↔JS boundary collapsed to one author; the component library is alive (running stories, visual regression, accessibility contracts); and design→code drift is caught by CI before it lands, not discovered in a quarterly review. `systems` runs after the other atelier lenses have produced their tokens and before `surface:bulwark` takes ownership of boundary enforcement at 1→N.

> **Greenfield or retrofit? Decide the entry, not a new stage.** Most real work is not a blank canvas — it is an existing system thick with literals, two-source tokens, and components that have grown props instead of staying primitive. The three stages are the same; only the entrance differs. If starting clean, walk STAGE 0→2 in order. If a system already exists, do one pass first: **inventory the drift** — every literal in component source, every value duplicated across CSS and JS, every component without a story, every token missing from the dark theme. That inventory is not a deliverable; it is the raw material each gate consumes. The technique for finding where literals hide (the four hiding places: raw CSS/SCSS, CSS-in-JS template literals, JS/TS token objects, inline styles and Tailwind arbitrary values) is in **[references/token-architecture-one-source.md](references/token-architecture-one-source.md)** under *Audit smell list*. The taste call stays a gate: the inventory tells you what exists, never what the architecture should be.

---

## STAGE 0 — Token architecture, one source (collapse the boundary; gate the taxonomy)

Open **[references/token-architecture-one-source.md](references/token-architecture-one-source.md)**. Fix the architecture *before* wiring any component.

- **Pick the source; close every other author.** The token taxonomy (color / type / space / radius / motion) has exactly one home. The four options are: CSS custom properties as source (JS reads via `var()` strings and `getComputedStyle`); a JS/JSON token module as source (a build step writes CSS custom properties — Style Dictionary is the canonical tool); a CSS-in-JS theme contract (vanilla-extract / Linaria — emits real custom properties at build time, not a runtime `ThemeProvider`); or Tailwind config as source (arbitrary values banned — they re-introduce literals past the config). Pick the one that fits the stack. Whichever you pick, every other direction is read-only — never a second author. The CSS palette is never maintained alongside a JS color object; Tailwind config is never maintained alongside raw CSS vars.
- **Install the three-layer architecture.** Raw/primitive names (the OKLCH scales, the spacing steps — theme-agnostic, not consumed directly by components) → semantic/alias names (role tokens: `--color-surface`, `--color-text-primary`, `--space-md` — re-pointed per theme) → optional component hooks (`--button-bg`, `--button-radius` — documented and typed via `@property`). Components consume only semantic tokens or their own declared component tokens. A component that reads `--blue-500` directly is leaking through the architecture.
- **`@layer` and `@property` discipline.** Declare the layer order once: `@layer reset, base, tokens, components, utilities`. Tokens in `@layer tokens` — lowest priority, as expected; utilities in `@layer utilities` — highest normal-layer priority. Third-party CSS wrapped in a named layer. Register component API tokens and any animated token with `@property` — typed custom properties interpolate; untyped ones snap; `@property` also documents the type.
- **Close the CSS↔JS boundary.** Inline styles must reference `var(--…)`, never literals. Chart/canvas palettes must read from the source (cache `getComputedStyle` on mount/theme-change; do not call per frame). A token audit CI step — a grep for hex/magic-px in component source outside the token files — runs on every PR and fails the build on new matches.

### GATE — clear before LIVING LIBRARY
1. `checklist check token-architecture one-source-of-truth-established`
2. `checklist check token-architecture layer-and-scoping-discipline`
3. `checklist verify token-architecture`

---

## STAGE 1 — The component/pattern library as a living artifact (primitives → patterns; the system documents itself)

Open **[references/the-living-component-library.md](references/the-living-component-library.md)**. The library is the system made navigable.

- **Establish the primitive → composition → pattern hierarchy.** Primitives own one responsibility, expose a component token API, contain no literals. Compositions assemble primitives without reimplementing them; overrides flow through the primitive's component token hooks, not new CSS rules on the same element. Patterns are complete solutions — documented with every state (empty / loading / error / populated) and an accessibility contract (keyboard, ARIA, axe-core test). Anything used in three or more places is a composition or pattern candidate. Anything with more than a handful of visual-variation props is a composition waiting to be decomposed.
- **Make composition the default; configuration the exception.** Boolean explosions (`<Button iconLeft iconRight ghost pill loading>`) become composition slots. Visual variation that is purely token-based becomes a subtree token override, not a prop. Semantic variation (`intent="primary|secondary|danger"`) is the legitimate case for enumerations. The primitive API stays small and stable; compositions and patterns iterate.
- **The system must document itself.** Each component has Storybook (or equivalent) stories — running code, not screenshots. Visual-regression tests (Chromatic / Percy) run against stories on every PR; an unapproved appearance change fails CI. Prop tables are auto-generated from TypeScript types and JSDoc. Accessibility contracts are tested in-story. Stability tiers (`Stable / Beta / Experimental`) communicate API stability; `Stable` requires full coverage and a visual-regression baseline. Deprecated props fire a dev `console.warn` and have a one-major-version removal window.
- **The Figma relationship.** Figma is an exploration tool; the component library is the source of truth. When they diverge, code wins. The Figma token plugin reads from the token source; it does not author it. "The Figma component is done" is not graduation into `Stable` — "the Storybook story has visual-regression coverage" is.

### GATE — clear before HANDOFF AND AUDIT
1. `checklist check living-library primitive-to-pattern-hierarchy-established`
2. `checklist check living-library system-documents-itself`
3. `checklist verify living-library`

---

## STAGE 2 — Design↔code handoff without drift (the contract; the audit; the sync loop)

Open **[references/design-to-code-handoff.md](references/design-to-code-handoff.md)**. The system stays in sync not by heroic communication but by structure.

- **Define the handoff contract.** Handoff is a structured diff: token changes as a PR to the token source; component API changes specced in the existing component token language; new patterns as a Storybook story spec with states, token usage, and accessibility contract; and explicit CI-verifiable acceptance criteria (passing story, passing axe-core, visual-regression diff below threshold, zero literals in the token audit). A Figma link with a comment "match this" is not handoff — it is a request to re-derive the system from a screenshot.
- **Wire the four drift-audit channels in CI.** (1) Literal-grep: fail on any hex/magic-px in component source outside token files. (2) Cross-language duplication: fail when the same value exists in both CSS and JS (Style Dictionary or a normalization script). (3) Theme-parity: fail when a component token exists in one theme but not the other — a missing dark-theme value triggers IACVT silently. (4) Visual regression: a Storybook diff above threshold requires explicit approval. All four channels run on every PR — drift is caught before it merges, not discovered in a design review.
- **The sync loop invariants.** No token change bypasses a PR review. Generated outputs (`dist/tokens.css`, `dist/tokens.js`) are build artifacts — never hand-edited; optionally not committed (regenerated in CI on every build). Figma token plugin reads; it does not write. The loop: design proposes a token change → PR to token source → CI audit → merge → generated outputs update → all consumers see the new value on next build. One direction of authority; every other direction is downstream.
- **Hand off to `surface:bulwark`.** Once the token architecture is in place, the living library is generating its documentation, and the CI audit is catching literals and duplication — the boundary-enforcement contract transfers to `surface:bulwark`, which runs the PR review pass that catches drift before it merges. `systems` builds the structure; `bulwark` enforces it at 1→N. This is the handoff: a working drift-audit CI pipeline and a documented component API are the pre-conditions `bulwark` requires.

### FINAL GATE
1. `checklist check handoff-and-audit design-to-code-contract-defined`
2. `checklist check handoff-and-audit drift-audit-is-structural-not-manual`
3. `checklist verify handoff-and-audit`
4. `checklist show` — confirm all three stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`systems` is the atelier's **structural conscience** — the place the suite's claim that *the design system is itself state* finally gets a gate. It runs after the other atelier lenses have produced their tokens, and its architecture is what `surface:bulwark` later enforces at 1→N. The through-line is the same the whole suite preaches — *push correctness into structure* — applied to the system itself: tokens derived from one source can't drift the way tokens maintained in two languages can; a library with visual-regression coverage can't rot the way a library with screenshots can; a drift audit in CI can't be forgotten the way a quarterly design review can. The line that keeps `systems` honest: **the references hold the encodable technique (the three-layer architecture, the CSS↔JS boundary options, how Style Dictionary works, how Storybook stories become the canonical example); the architecture decisions — which source, which layer discipline, which stability tier — stay gates the user clears.** Blur that line and the skill becomes a recipe book; hold it and it stays a lens.

## Anti-patterns (use as a pre-flight checklist)

- **Two sources of the same token** — a CSS custom property and a JS color object maintaining the same palette; pick one source, make the other a consumer. This is `surface:wellspring`'s law applied to design: the system is state, so it gets one source of truth.
- **Literals in component source** — `#2563eb`, `13px`, `oklch(0.62 0.18 250)` typed directly in a component; every value in a component traces to a token. The literal is the first place coherence dies.
- **Literals in inline styles** — `style={{ color: '#fff' }}` outranks the entire token system (inline styles beat all class-rule specificity); inline styles must use `var(--…)`.
- **Tailwind arbitrary values** — `bg-[#2f6ae0]` and `mt-[13px]` bypass the token config; they are literals wearing Tailwind syntax. Ban them in review.
- **Prop explosion** — a component with twelve boolean flags for visual variation; decompose into composition slots or subtree token overrides. Configuration is for semantic intent, not visual permutations.
- **Figma as source of truth** — the design file and the code diverge; code wins; the design file is updated to match. A Figma edit that is not a PR to the token source does not change the system.
- **Hand-maintained generated outputs** — if `dist/tokens.css` is hand-edited, the next build overwrites it; generated files are build artifacts, never sources.
- **Token missing from the dark theme** — a token with no dark-theme value triggers IACVT (falls to the property's initial value, typically black or transparent) — not a graceful fallback. The theme-parity check catches this.
- **Components without stories** — a component with no Storybook story has no visual-regression baseline, no accessibility test, and no auto-generated documentation. The library appears to grow; the living documentation does not.
- **No stability tier** — a component used in production with no stability declaration; a breaking change causes unexpected breakage. Stable / Beta / Experimental is a signal of API stability, not quality.
- **Drift caught manually** — a design review where someone notices the UI no longer matches the design file. By this point drift has been accumulating for weeks. The four CI audit channels exist to catch it on every PR.
- **Skipping a GATE** — and remember: the system is only non-drifting if the architecture is in place *before* components consume it. Retrofitting the architecture onto an existing component tree is possible; it is ten times the work of getting it right at STAGE 0.

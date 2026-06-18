---
name: layout
description: >
  The composition lens for a frontend build — where hierarchy, grid, measure, and spatial rhythm
  are decided, and where "looks amateur" and "won't scale to real data" are determined. Use after
  the build works (seaworthy) and after or alongside canon's design-language gates, when
  establishing or auditing the compositional structure of a surface. The one shift: hierarchy
  and the grid are DECISIONS, not accidents — the page is *composed* (alignment, measure, spatial
  rhythm), the empty/loading/edge states have a designed visual form, and the surface is built for
  reality's long tail (overflow, missing data, huge numbers, RTL). The agent stacks boxes that
  "work" and leaves composition, empty-states, and the long tail to chance — so composition must
  be decided and gated. CSS mechanism (how Grid/Flexbox/positioning work) stays in surface:keel;
  this skill owns the composition *judgment* — which grid, which hierarchy, what density, how the
  long tail holds. Triggers on "layout / grid / composition / hierarchy", "measure / line length /
  reading column", "spacing / rhythm / density / proximity", "empty state / blank slate / no
  results", "loading state / skeleton / placeholder", "form layout / label / input / validation
  visual", "overflow / truncation / long text / huge numbers", "RTL / right-to-left / direction /
  i18n layout", "state machine / hover / focus / active / disabled", "real data / edge case / long
  tail / production-proof layout".
argument-hint: "[the UI / page / component layout to compose and harden]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# layout

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An *atelier* is a craftsman's working studio — the space where decisions about form, proportion,
and composition happen before the piece leaves the bench. `layout` is the composition lens of the
`atelier` suite: where the other skills decide *what it looks like* (color, type, form, motion),
`layout` decides *how it is organized* — the grid, the hierarchy, the reading measure, the spatial
rhythm, and the shape of every application-layer state. Its product is a **composed surface**: an
explicit armature, a quantified spacing system, and an application layer that holds its form when
reality provides the actual data. It runs across gated stages and will not advance past a **GATE**
until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: hierarchy and the grid are decisions, not defaults — and the agent makes neither.** The agent places elements in a container, sizes them to fit, and calls it done. It does not ask "what does the eye see first?", does not establish a grid before placing elements, does not consider what happens when a name is sixty characters long or when a table cell contains `null`. What reads as "amateur layout" is almost always the absence of three things: a decided visual hierarchy (everything at the same weight reads as noise), a consistent spatial system (ad-hoc gaps of 13px, 22px, 7px — the eye detects rhythmic incoherence before the mind names it), and a designed application layer (empty states that are blank divs, error states that are unstyled text, forms where the label disappears when you start typing). These are not polish — they are the substance. A layout without a composed hierarchy is not a draft of a good layout; it is a different artifact.

**The boundary with `surface:keel`:** `keel` owns the CSS *mechanism* — how Grid and Flexbox distribute space, the cascade, the box model, positioning contexts. `layout` owns the composition *judgment* — *which* grid, *which* hierarchy model, *what* density register, *how* the long tail holds. The questions answered here are design questions that require taste; the questions answered in `keel` are engineering questions that require correctness. Bring a layout decision here; bring a CSS bug to `keel`. Cross-reference `keel` for the mechanism when a stage sends you there for implementation.

This is where the agent era bites:
- **The agent does not compose.** It fills space. Every element gets a plausible size and a plausible gap; the result is a layout where everything competes equally for attention, nothing reads as the primary entry point, and the eye has no path. Hierarchy must be *decided* — one primary element, named, placed at the optical center, given dominant size or weight or contrast — before the agent implements it.
- **The agent does not design the long tail.** It designs the happy path: populated data, English text, a name that is twelve characters. The production surface has names that are sixty characters, numbers that are nine digits, fields that are empty, translations that are forty percent longer. Layout must be *stress-tested* before it ships, not after the first bug report from production.
- **The agent does not design states.** An empty state gets a blank div or a developer-default "No data found." An error state gets unstyled red text. A loading state gets a spinner that appears after the content-space has already shifted. The application layer — all states, not just the populated one — must be explicitly designed.
- **The agent uses magic px everywhere.** `padding: 13px`, `margin-top: 22px`, `gap: 7px` — each value chosen by eye, none derived from a system. The result is rhythmic incoherence that the eye reads as "off" without the viewer knowing why. All spatial values must come from the spacing scale.

**Read [references/grid-and-hierarchy.md](references/grid-and-hierarchy.md) first** — the armature without which the rest of the stages have no foundation. The grid is not a stylesheet detail; it is the governing constraint for all placement decisions. Load at the start, re-check at every gate.

**Speak the user's language.** The decisions are the user's — which column count, which density, which hierarchy model, how much whitespace, what the long tail looks like for their data. Read their fluency and gloss a term on first use (*visual hierarchy*, *focal order*, *optical center*, *measure* / line-length, *spacing scale* / base unit, *proximity* / grouping law, *spacing gradient*, *application-layer state*, *skeleton screen*, *subgrid*, *intrinsic sizing*, *logical properties* / RTL). A grid system the user can't read is a structure imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/grid-and-hierarchy.md](references/grid-and-hierarchy.md)** — the armature: column grids, the RAM intrinsic pattern, subgrid, visual hierarchy vocabulary (size/weight/contrast/position/isolation/color), the optical center, F/Z scan patterns, asymmetric balance and visual weight, alignment discipline (optical vs bounding-box), density pacing and whitespace as structure.
- [references/measure-and-rhythm.md](references/measure-and-rhythm.md) — the spacing scale (base unit, mixed linear/geometric steps, two-speed component vs layout spacing), proximity and grouping law (the 1.5–2× ratio), vertical rhythm and the line-box trap, measure and the reading column (45–75ch), spacing unit semantics (px/rem/em/ch and what each couples to), fluid spacing with `clamp()`, logical properties for direction-agnostic spacing, dense-layout spacing tiers.
- [references/application-states-and-form-visuals.md](references/application-states-and-form-visuals.md) — the three empty-state types (first-use, cleared, no-results) and their distinct anatomy, micro-interaction state machines (full state coverage: hover/active/focus/disabled/loading/success/error), first-feedback under 100ms, inline validation timing (blur not keydown, early-reward/late-penalty), form-layout rules (top-aligned labels, single-column default, input-width-as-affordance, full state coverage, error display, required/optional marking, touch targets, accessibility).
- [references/designing-for-the-long-tail.md](references/designing-for-the-long-tail.md) — text overflow strategies (`overflow-wrap`, ellipsis, multi-line clamp), numeric edge cases (large numbers, tabular-nums, zero/null/negative/float display), grid overflow trap (`minmax(0, 1fr)` / `min-width: 0`), scrollbar-gutter, `100dvh` vs `100vh` on mobile, RTL with logical properties and mirrored icons, text expansion for translated content, image and media containers (aspect-ratio, object-fit, CLS), third-party failure resilience, reflow at 320px/400% zoom (WCAG 1.4.10), the long-tail diagnostic checklist.

> **The arc is one composed surface.** Three stages — grid · rhythm · reality — turn a working-but-uncomposed layout into a surface that guides the eye, breathes consistently, and holds its form when real data arrives. Grid commits the armature and hierarchy; rhythm fixes the measure and spatial cadence; reality designs the application layer and stress-tests the long tail. `layout` gates all three; it runs after `seaworthy` (the build is correct) and its composed structure is what the `color`, `type`, `form`, and `motion` lenses later paint and what `bulwark` keeps from drifting at 1→N.

> **Greenfield or retrofit? Decide the entry, not a new stage.** Most real work is an existing layout with ad-hoc spacing, no explicit grid, and states that were never designed. The three stages are the same; the entry differs. For a retrofit: do one inventory pass first — find every magic px gap, every missing state, every place text overflows or a number is truncated. That inventory is raw material for the gates (the scatter of ad-hoc gaps becomes the spacing scale the rhythm stage commits; the missing states become the state machine the reality stage designs). Bring the inventory to STAGE 0 and the gates run unchanged. The composition judgment — what the grid *should* be, what the hierarchy *should* say — stays a gate the user clears.

---

## STAGE 0 — Grid, hierarchy & composition

Open **[references/grid-and-hierarchy.md](references/grid-and-hierarchy.md)**. Commit the armature *before* placing any element.

- **Establish the grid first.** Choose column count (4 / 8 / 12 or an intrinsic RAM grid), gutter width, and baseline unit (4 or 8px) as tokens before placing elements. The grid is the authority; placements are consequences. Use an intrinsic-responsive grid (`repeat(auto-fit, minmax(min(100%, Xrem), 1fr))`) for content grids that should adapt without breakpoints. Use subgrid where nested content must align across cards or rows with varying content length. Use `gap` — never child `margin` — for item spacing.
- **Decide the visual hierarchy.** Name the primary focal element: the one thing the eye should arrive at first. Establish it with at least two hierarchy levers (size, weight, contrast, position, isolation, color). Place it at or near the optical center. Map secondary and tertiary elements in explicit focal order. If every element has the same visual weight, the hierarchy is not decided — it is absent.
- **Enforce alignment discipline.** Every element aligns to the grid or to a shared edge; nothing is "approximately aligned." Use optical alignment (ink edge, not bounding box) for text and icons. Apply hanging punctuation to text columns. Use logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) throughout so alignment is direction-agnostic from the start.

### GATE — clear before RHYTHM
1. `checklist check grid grid-and-armature-committed`
2. `checklist check grid visual-hierarchy-and-focal-order-decided`
3. `checklist check grid alignment-discipline-enforced`
4. `checklist verify grid`

---

## STAGE 1 — Measure & spatial rhythm

Open **[references/measure-and-rhythm.md](references/measure-and-rhythm.md)**. Fix the measure and rhythm *before* the application layer, because the spacing system is what the application-layer states inherit.

- **Constrain the reading measure.** All running text gets a `max-width` in `ch` units (~65ch). Never let prose fill the full container on a wide viewport — the agent's default produces 120-character lines. Establish a content-well pattern for layouts that mix full-bleed and reading-column sections.
- **Apply the spacing scale.** Every gap, padding, margin, and gutter references a token from the committed spacing scale — no magic px. Enforce the proximity/grouping rule: group-internal spacing is measurably smaller than group-to-group spacing (1.5–2× minimum). The spacing gradient mirrors the content hierarchy; the eye reads it as document structure. Dense-layout contexts (tables, dashboards) use the tight end of the scale with explicit density tiers.
- **Choose the right unit for the right coupling.** Component-internal padding in `em` (self-scaling); layout spacing in `rem` (user font-size respecting); reading column in `ch` (typeface-coupled); fluid spacing in `clamp()` (breathes between viewport sizes without media-query steps). All-`px` layouts fail WCAG 1.4.10 reflow.

### GATE — clear before REALITY
1. `checklist check rhythm measure-and-reading-column-set`
2. `checklist check rhythm spacing-scale-applied-consistently`
3. `checklist verify rhythm`

---

## STAGE 2 — Application-layer states & the long tail

Open **[references/application-states-and-form-visuals.md](references/application-states-and-form-visuals.md)** and **[references/designing-for-the-long-tail.md](references/designing-for-the-long-tail.md)**. Design every state, then stress-test with real-data extremes.

- **Design all three empty-state types explicitly.** First-use/blank-slate is the retention battlefield — it needs a value statement, a primary CTA, and a preview. Cleared/completed is affirmation. No-results is navigation: explain why, offer a path out. Never a blank div; never "No data found." Error states are not empty states — they are distinct designs.
- **Cover the full state machine for every interactive element.** default · hover · active/pressed · focus · disabled · loading · success · error. First feedback under 100ms. Inline validation on blur (not keystroke); early reward, late penalty. Form layout: top-aligned labels, single-column by default, input width as affordance, ≥44px touch targets. Placeholder text is never a label.
- **Stress-test the long tail.** Text overflow: `overflow-wrap: break-word` globally; intentional truncation gets a tooltip. Numeric extremes: largest plausible values fit; `tabular-nums` on all numeric columns. Grid overflow: `minmax(0, 1fr)` or `min-width: 0` on children. Mobile: `100dvh` not `100vh`. RTL: logical properties throughout; directional icons mirror. Translated text: layout holds at 150% English length. WCAG 1.4.10: no horizontal scroll at 320px / 400% zoom.

### FINAL GATE
1. `checklist check reality application-layer-states-designed`
2. `checklist check reality form-visuals-and-state-coverage-complete`
3. `checklist check reality long-tail-and-overflow-handled`
4. `checklist verify reality`
5. `checklist show` — confirm all three stages passed.
6. `checklist done` — clear this run's state.

---

## The thread through all of it

`layout` is the suite's **compositional conscience** — the place where the claim that *hierarchy is a decision* finally gets a gate. It runs after `seaworthy` has built the four states and their correctness; its composed structure is what the `color`, `type`, `form`, and `motion` lenses later paint (the color, the type scale, the depth model, the motion language all make more sense on a composed surface than on an ad-hoc stack of boxes). The through-line is the suite's own — *push correctness into structure* — applied to space: a gap derived from a scale can't drift the way a hand-picked `13px` can, and an empty state designed as a state machine holds its form the way a blank div never can. The line that keeps `layout` honest: **the reference library holds the encodable technique (how the RAM grid works, how proximity is quantified, how logical properties flip for RTL, what the line-box trap is); the composition judgment — which grid, which hierarchy, what density, how the long tail is designed — stays a gate the user clears.** Blur that line and the skill becomes a recipe to follow; hold it and it stays a lens to see through.

## Anti-patterns (use as a pre-flight checklist)

- **No explicit grid before placing elements** — every element is individually sized and positioned; alignments are approximate; the layout has no armature. Define column count, gutters, and baseline unit as tokens before placing a single element.
- **Everything at the same visual weight** — no primary focal element, no hierarchy, no path for the eye. The viewer must decide where to look; most will decide to leave. Name the primary element and establish it with at least two hierarchy levers.
- **Ad-hoc spacing (magic px)** — `padding: 13px`, `margin-top: 22px`, `gap: 7px` — each chosen by eye, none derived from a scale. The rhythmic incoherence registers as "off" before the viewer names it. Every spatial value must come from the committed spacing scale.
- **Proximity broken** — label and its input have the same gap as adjacent fields; the eye cannot group the form. Group-internal spacing must be measurably smaller than group-to-group spacing (1.5–2× minimum).
- **Text spills to the full container width on wide viewports** — 120+ character lines are physically difficult to read; the agent's default is to allow this. Constrain running text to 45–75ch.
- **Spacings in `px` only** — does not scale with user font-size; fails WCAG 1.4.10 reflow at 400% zoom. Use `rem` for layout, `em` for component internals, `ch` for measure.
- **Empty states as blank divs** — the blank white rectangle that appears when data is absent is the developer's default, not a designed state. Three distinct empty-state types require three distinct designs.
- **Error state = empty state** — failed-to-load and no-data look similar but communicate entirely different things and require different user actions. Design them separately.
- **Happy-path-only state machine** — only the default/populated state is designed; hover/focus/disabled/loading/success/error states are accidental or absent. Every interactive element is a state machine; every state must be designed.
- **Placeholder text used as labels** — disappears on input, fails contrast, not screen-reader accessible, breaks on translation. Labels go above the input; placeholders are for example values.
- **Submit button disabled until valid** — traps users who cannot learn what is wrong. Allow submission; show errors after.
- **Layout designed only for comfortable data** — names of twelve characters, amounts of four digits, English text, all fields populated. The production surface will immediately provide sixty-character names, nine-digit numbers, empty optional fields, and German translations forty percent longer. Stress-test before shipping.
- **Physical directional properties in RTL-destined surfaces** — `margin-left: 16px` does not mirror in RTL. Logical properties (`margin-inline-start`) must be used from the start; retrofitting them is expensive.
- **`100vh` on mobile** — overflows on iOS Safari due to browser chrome. Use `100dvh`.
- **Grid overflow from `min-width: auto`** — a long word or wide image inside a `1fr` column blows out the grid. Use `minmax(0, 1fr)` or `min-width: 0` on children.
- **Skipping a GATE** — and remember: every spatial value should trace to the scale; every state should be in the state machine; if it doesn't, it was left to chance.

---
name: canon
description: >
  The design-judgment spine of the atelier suite — where the visual language is
  chosen, the surface archetype is named, and the quantified targets that all later
  craft lenses enforce are decided. Use before any pixel is placed, before a color
  system is built, before a type scale is chosen. The one shift: good design is NOT
  defaults nudged until it "looks ok" — it is a few NON-DEFAULT, QUANTIFIED decisions
  made before any pixel: the surface's point of view (derived from the product, not
  waited for), which visual language that POV demands, which surface archetype, what the
  surface is *for*, and what "premium" means in measurable terms for this surface and
  this user. The agent, having no taste and no nervous system, will always pick the
  bland default — the warm-cream-editorial-serif, the near-black-neon-accent, the
  newsgrid-with-zero-radius — because these are the statistical attractors of its
  training, not choices. These must be DECIDED and GATED. Triggers on "start a design",
  "which visual language", "what style should this be", "what kind of surface is this",
  "design brief", "make it feel premium", "before I start designing", "what archetype",
  "design direction", "what should this look like", "I don't know where to start
  visually", "set up the design", "design the UI", "establish a visual identity".
  The spine to the atelier suite the way bearings is spine to surface: canon decides
  the taste direction and quantifies it; the sibling lenses (color, type, layout,
  form, graphics, motion — and systems, which later governs the committed tokens)
  execute it. Installs three one-page artifacts the whole design
  build honors — the design-language brief (visual language named, archetypes
  chosen, the three AI defaults actively rejected), the quantified-targets sheet
  (contrast floors, density grade, type-scale ratio, motion budget, the "premium"
  tells made numeric), and the product-sense check (visual serves the user's real job
  and reality's long tail, not decoration).
argument-hint: "[the surface, product, or design problem to set a design direction for]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# canon

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A *canon* is the underlying measure from which a craftsman's proportions derive — not a style applied after, but the organizing principle that makes every dimension coherent before a single mark lands. `canon` is the judgment spine of the `atelier` suite: where a frontend build has `bearings` to fix the boundaries before the first line of code, a design build has `canon` to fix the design language before the first visual value. Its product is three one-page artifacts — a design-language brief, a quantified-targets sheet, and a product-sense check — that every later lens (`color`, `type`, `layout`, `form`, `graphics`, `motion`) honors. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it. The gate enforces *order*; the substance of every judgment inside it is yours.

**The governing fact: high-craft design is not defaults nudged until "ok" — it is a small set of NON-DEFAULT, QUANTIFIED decisions made before any pixel, all derived from one upstream choice: the surface's point of view.** Style is *derived* from that point of view (POV → style); the agent's signature failure is to run it backwards — reach for a premium-looking style first and reverse-justify it — which is exactly how it lands in the default mean. An agent without guidance converges to three statistical defaults: the warm-cream editorial (off-white ground, high-contrast serif, ochre accent); the near-black neon tool (single fluorescent accent, zero radius, dense grid); the newspaper grid (hairlines, dense columns, pure neutrals). These are not *choices* — they are the agent's aesthetic gravity, the modal outputs of its training. None of them is wrong in principle; each is wrong as a *default*, because it was never *decided*. The craft move is to name the organizing principle first — *which* visual language, *which* archetype, *what* this surface is for — and then derive every subsequent call from that decision rather than from the agent's statistical center of mass.

This is where the agent era bites:
- **The agent picks plausible-but-unconsidered values and feels no wrongness.** It emits a warm-cream serif because that combination is overrepresented in high-engagement design content, not because it fits your surface. It reaches for rounded corners and drop shadows because those are the defaults of the popular component libraries it has seen, not because they serve your user's cognitive load. It has no nervous system to feel that a dashboard with editorial-weight type is *wrong in kind*, not just aesthetically suboptimal.
- **The agent defaults to decoration over decision.** It adds gradients, shadows, and micro-animations because they pattern-match to "polished" in its training — but "polished" on a marketing surface and "polished" on a dense data tool are entirely different objects. Motion that signals craft on a landing page is noise on a trading terminal. The agent cannot make this distinction without being told the archetype.
- **The agent cannot quantify taste.** It will say "high contrast" without a number, "generous spacing" without a scale, "minimal motion" without a budget. The non-default choice must be a number — a contrast floor, a density grade, a type-scale ratio — or it will dissolve into the next prompt.

**Read [references/non-default-and-quantified.md](references/non-default-and-quantified.md) first** — this skill's spine; the encodable techniques for taking each aesthetic dimension from "default" to "decided and measured." Then read [references/surface-archetypes.md](references/surface-archetypes.md) to ground the language choice in what the surface is *for*. The product-sense reference opens at STAGE 2.

**Cross-suite lineage.** `canon` is to `atelier` what `bearings` is to `surface` — the spine that fixes the irreversible early decisions before sunk cost accrues. `bearings` asks: *which boundary, which source of truth, whose mental model?* `canon` asks: *which visual language, which archetype, what does premium mean here?* They share a governing insight: the agent writes the code / pixels competently; the leverage lives in the calls it cannot make — the ones that require taste, context, and a nervous system.

**Speak the user's language.** These decisions belong to the user. Read their fluency and gloss a term on first use (*visual language*, *surface archetype*, *design brief*, *quantified target*, *motion budget*, *density grade*, *type-scale ratio*, *non-default choice*). A design direction the user cannot read is a style imposed, not a judgment shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/non-default-and-quantified.md](references/non-default-and-quantified.md)** — the spine: the anchor (derive the point of view first — POV → style, never the reverse); the three AI default attractors to name and reject; how each aesthetic dimension (color, type, spacing, shadow, radius, motion) moves from agent default to decided-and-measured; the quantification anchors that make taste enforable.
- [references/surface-archetypes.md](references/surface-archetypes.md) — the five surface archetypes (dashboard / tool / editorial / marketing / data-dense) with their governing constraints, motion budgets, density grades, and the tells that distinguish each from the defaults.
- [references/product-sense.md](references/product-sense.md) — how the visual serves the user's actual job: the JTBD lens on design, the all-states obligation (not just happy path), the surface-diversity reality check (no average surface), and the ethics of choice architecture.

> **The arc is one design direction.** Three stages — language & archetype · quantified targets · product-sense fit — turn an unanchored brief into a precise design intent the suite's sibling lenses can execute: `color` builds the perceptual ramp the brief names; `type` picks the modular scale the ratio specifies; `layout` applies the density grade; `motion` respects the budget. `canon` gates all three; it runs before any other atelier lens, and its artifacts are the shared contract the whole design build honors.

> **Greenfield or redesign? Decide the entry, not a new stage.** Greenfield: walk STAGE 0→2 in order. Redesign or audit: first inventory the existing surface's design language — what archetype was it built for (even if unintentionally), what defaults is it trapped in, what quantified targets (if any) exist — then bring that inventory to STAGE 0 and the gates run unchanged. The inventory is raw material, not a deliverable; the taste calls remain gates the human clears.

---

## STAGE 0 — Point of view, design language & archetype (derive the POV first; then name the language and choose the archetype on purpose)

Open **[references/non-default-and-quantified.md](references/non-default-and-quantified.md)** and **[references/surface-archetypes.md](references/surface-archetypes.md)**. Fix the design direction *before* any color token is defined or any type scale is chosen.

- **Derive the point of view first — it is the anchor, and you can derive it yourself.** Before any style, state the surface's single point of view in one sentence — the one thing it is really arguing. The POV is **not an input to wait for** from the user; it is **derivable from the product's own facts**: what it delivers, what it costs the user, what it believes. The direction is one-way: **POV → style**, never style → POV. Picking a "premium-looking" shell first and reverse-justifying it is the exact mechanism by which the agent lands in the default mean. Ground the POV in the product, not the mood — *"a good cold email is read into existence, not generated; the deliverable is the user's voice, the cost was the reading"* is a point of view; *"clean, modern, trustworthy"* is a mood. If you can't state it without naming a style or a feeling, you haven't found it yet. (Apple's gift page: POV *"the product disappears; the human moment is the subject"* → near-empty white, one playful gesture carrying all the personality. Everything downstream is derived from that sentence.)
- **Name the visual language the POV demands, including what it is NOT.** A visual language is an organizing principle — *editorial and authoritative* (high typographic contrast, restrained palette, generous whitespace); *precise and tool-like* (strict grid, functional hierarchy, minimal ornament); *warm and inviting* (rounded forms, approachable scale, softer contrast); *data-forward* (tight density, information hierarchy primary, decoration absent). It is **derived from the POV** (the answer to *"what must this look like given that POV"*), not pulled off a shelf of styles that "look premium." The act of naming forces a choice; the act of naming what it is NOT rules out the agent's default attractors. Write the three AI defaults (warm-cream-serif / near-black-neon / newspaper-hairline) and actively reject or adopt each on purpose. **Deciding ≠ avoiding:** escaping one attractor by landing on another (fleeing near-black-neon straight into warm-cream-serif) is not a decision — if your named language *coincides* with one of the three, you must justify it **from the POV and archetype** (the surface genuinely *is* editorial), not merely assert you "chose" it.
- **Choose the surface archetype on purpose.** Five canonical archetypes: **dashboard** (at-a-glance status, scan-first, medium density, orientation motion only); **tool** (task-focused, low decoration, high precision, near-zero expressive motion); **editorial** (reading-forward, long measure, generous leading, type the hero, motion used sparingly for scroll-state); **marketing** (conversion-focused, signature motion permitted, brand-expressive, landing performance critical); **data-dense** (maximum information per pixel, compression over comfort, tabular numerics, motion almost entirely absent). Pick one primary archetype; a surface may straddle two but must name the primary. The archetype governs the motion budget, density grade, and decoration ceiling for every subsequent stage.
- **Name the one signature element.** The Chanel law: concentrate "bold" on one signature element (a typeface, a palette, a spatial gesture, an accent treatment) and keep everything else restrained. The agent scatters "bold" across every dimension simultaneously; naming the one signature element forces that restraint. Write it down.

### GATE — clear before QUANTIFIED TARGETS
1. `checklist check language point-of-view-derived-and-anchored`
2. `checklist check language visual-language-named-and-non-defaults-specified`
3. `checklist check language surface-archetype-chosen-and-documented`
4. `checklist verify language`

---

## STAGE 1 — Quantified targets (turn the language into numbers the later lenses enforce)

Open **[references/non-default-and-quantified.md](references/non-default-and-quantified.md)**. Every aesthetic dimension must become a measurable target — or it will dissolve into the agent's next prompt.

- **Contrast targets.** Name the contrast floors: WCAG 2 ratios as the legal floor (body ≥4.5:1, large/UI ≥3:1), APCA Lc as the perceptual target (body text Lc ≥75, large text Lc ≥60, UI/non-text Lc ≥45). The secondary-text trap: a "refined" gray secondary that fails both floors is the most common craft-failure in agent-generated UIs — name the minimum.
- **Density grade.** Choose: *compact* (4px base unit, tight line-height, information-maximizing — suits tool/data-dense); *standard* (8px base unit, ~1.5 body line-height — suits dashboard/tool); *airy* (8–12px base, generous leading, large whitespace budget — suits editorial/marketing). The grade drives the spacing scale the `type` lens will pick and the inter-group proximity ratio the `layout` lens will enforce (group-gap ≥ 2× intra-group gap).
- **Type-scale ratio.** Pick a modular ratio appropriate to the archetype: ≈1.2 (minor third, compact/dense UI); 1.25 (major third, versatile); 1.333 (perfect fourth, editorial); 1.5+ (expressive/marketing). Write the ratio as a number; the `type` lens instantiates it as a token scale.
- **Motion budget.** Set the ceiling, not the floor: *none* (tool/data-dense — motion only if it has a named job and a timer under 150ms); *orientation-only* (dashboard — state-change confirmation and latency masking only); *standard* (layout transitions + entrance/exit, ≤300ms discrete); *expressive* (marketing — signature motion permitted, spring physics allowed, longer durations with purpose). The budget is per-archetype; the purpose taxonomy (orient / causality / mask latency / attention) is constant — the budget controls how much the surface may *spend*.
- **The "premium" tells, made measurable.** For this surface: neutral gray chroma C ≥ 0.005 (tinted, not pure gray); text-black L ≈ 0.18–0.25 (not `#000`); background near-white L ≈ 0.97–0.99 (not `#fff`); shadow layers ≥ 2 at opacity 0.03–0.12 each; nested border-radius: inner = outer − padding (concentric); letter-spacing on display type −0.02 to −0.04em; touch targets ≥ 44×44px. These are the measurable gates that transform "it looks polished" from a feeling into a checkable condition.

### GATE — clear before PRODUCT-SENSE FIT
1. `checklist check targets contrast-floors-specified`
2. `checklist check targets density-grade-and-type-ratio-specified`
3. `checklist check targets motion-budget-specified`
4. `checklist check targets premium-tells-quantified`
5. `checklist verify targets`

---

## STAGE 2 — Product-sense fit (verify the visual serves the user's actual job and reality's long tail)

Open **[references/product-sense.md](references/product-sense.md)**. The design brief is not complete until the visual language has been stress-tested against the surface it will actually inhabit.

- **JTBD check: does the visual language serve the user's real job?** The user's job-to-be-done is not "look at a beautiful interface" — it is to accomplish something. Map the primary JTBD to the archetype: is the type scale readable under time pressure (tool)? does the density grade allow the user to scan 50 rows without fatigue (data-dense)? does the motion budget avoid distracting a user mid-task (dashboard)? A visual that is internally coherent but fights the job is wrong in kind, not just suboptimal.
- **States check: does the brief account for all states?** The agent designs the happy path — the screen with data, the user who succeeded. Verify the brief works for: empty (zero-data first-run), loading, error, partial, 0 items, 10,000 items, overflow text, a name with emoji, a user with no permissions. The brief's density grade and type scale must survive the long tail, not just the ideal fill.
- **Surface diversity check: whose device are you designing for?** The developer's MacBook on fast Wi-Fi is the least representative surface. Verify: does the density grade hold on a 375px wide phone? does the motion budget respect `prefers-reduced-motion`? does the contrast target hold in `forced-colors` mode? The archetype choice and quantified targets must survive the real device spectrum, not just the design tool.
- **Ethics check: does the visual respect user agency?** The visual language is choice architecture — it directs attention, implies hierarchy, and can manufacture urgency. Verify: the color hierarchy serves the user's mental model, not a conversion funnel; friction is intentional (added only for destructive actions, removed everywhere else); defaults serve the user. The premium tells must not become dark patterns.

### FINAL GATE
1. `checklist check sense jtbd-check-passed`
2. `checklist check sense states-and-long-tail-checked`
3. `checklist check sense surface-diversity-verified`
4. `checklist verify sense`
5. `checklist show` — confirm all three stages passed.
6. `checklist done` — clear this run's state.

---

## The thread through all of it

`canon` is the `atelier` suite's **design conscience** — the place where the suite's founding thesis (*taste is load-bearing and cannot be outsourced*) gets its first gate. It runs before any other design lens, and its three artifacts — the brief, the targets, the product-sense check — are the shared contract every sibling lens honors: `color` builds the perceptual ramp the brief names; `type` instantiates the ratio the targets specify; `layout` applies the density grade; `form` derives the shadow model from the archetype; `graphics` honors the archetype and motion budget for its imagery and icons; `motion` observes the budget; `systems` later governs the committed tokens. The lineage is the suite's own — *push correctness into structure* — applied to design judgment: a visual language that is decided and quantified can't drift the way a hand-nudged one can, so craft becomes structural rather than maintained by vigilance.

The line that keeps `canon` honest: the reference library holds the encodable technique (how to quantify a non-default choice, what the five archetypes constrain, how to run a JTBD check on a visual brief) — the taste (which language, which archetype, what the signature element is) stays a gate the user clears. Blur that line and the skill becomes a recipe book; hold it and it stays a lens.

## Anti-patterns (use as a pre-flight checklist)

- **Style before point of view** — picking a "premium-looking" language first and reverse-justifying it. The direction is POV → style; a style chosen without a POV to derive it from is the agent's default mean wearing a costume.
- **Point of view stated as a mood** — "clean / modern / trustworthy" is not a POV; it names no argument and constrains no choice. The POV is derived from the product's facts (what it delivers, costs, believes) and survives being said without naming any style.
- **Hopped attractors and called it a decision** — fleeing near-black-neon into warm-cream-serif (or any attractor into another) is not deciding. If the named language lands on one of the three defaults, it is only a decision when justified from the POV and archetype.
- **No design brief** — jumping to `color` or `type` without a named visual language; the agent will fill the vacuum with its default attractor.
- **Language named but not quantified** — "clean and minimal" without a density grade or type ratio is not a brief, it is a direction the agent will interpret as its own default.
- **Archetype unstated** — building motion, density, and decoration without naming the archetype means every lens will use different defaults; the surface will be incoherent in kind, not just in value.
- **Three AI defaults not actively rejected** — the warm-cream-serif, the near-black-neon, the newspaper-hairline are the agent's gravity wells; not naming them and ruling them in or out is not neutrality, it is drift.
- **"Premium" as a feeling, not a number** — a contrast floor is a number; a density grade is a choice; a motion budget is a ceiling. Without numbers the brief dissolves after one prompt.
- **Only the happy path** — a brief that works for the ideal-fill, ideal-device, ideal-user is not a brief; it is a sketch. The real brief survives the long tail.
- **Skipping a GATE** — each gate enforces order; the targets in STAGE 1 are meaningless without a named language from STAGE 0; the product-sense check in STAGE 2 has nothing to stress-test without the targets.

# skill-lab — canon (the design-judgment spine)

The shared contract every atelier lens (`color` · `type` · `layout` · `form` · `graphics` ·
`motion`) honors when rebuilding the bench's visual. Logic is frozen and authoritative in
`web/` (`index.html` + `core.mjs` + `harness.mjs`); the visual-agnostic state/invariant spec is
`web/INTERACTION.md`. The final deliverable is a claude.ai JSX artifact
(`../../skill-ab-experiment.jsx`). This file is produced by `atelier:canon` and answers, in order:
the point of view, the visual language, the archetype, the quantified targets, the product-sense fit.

---

## ARTIFACT 1 — design-language brief (STAGE 0)

### Point of view (the anchor; everything derives from this)

> **The bench is the suite betting its own credibility — it must convince a skeptic that the
> skills work, and the only way to convince a skeptic is to be visibly, rigorously honest (real
> maintainer commits as the anchor, a blind grader, a false-positive control, caveats shown not
> hidden); and because it is the suite's front door, the craft of the page is itself part of that
> proof.**

Derived from the product's own facts (the owner's stated 设计初心):
- **delivers** — a number a skeptical outsider will believe (a credible delta + the honest frame
  around it), *and* an internal quantified gate the team uses to optimize skills.
- **costs** — the discipline of not grading your own homework: blind grader, real-commit ground
  truth, false-positive control, the "read honestly" footer. The apparatus of honesty is the point.
- **believes** — a skill's value is an empirical question, not a marketing claim; an honest
  negative is as valuable as a positive; and a tool that looks generic discredits the craft it sells.

**The load-bearing resolution of the marketing↔honesty tension:** persuasion *is* honesty here.
The page wins the skeptic by refusing to flatter itself — the false-positive control, the
`6 = the maintainer's change, not the only right answer` anchor, the `N is small — a signal, not a
proof` caveat are shown *confidently*, not buried. Apple-grade craft applied to instrument-grade
honesty IS the marketing. This keeps the surface out of the marketing attractor.

### Visual language (the three AI defaults, ruled on purpose)

Named language: **paper & ink — warm editorial, light-default, near-monochrome, one restrained
deep-evergreen accent.** Derived from the POV (a credible, reading-forward instrument whose method
is the content), not reached for because it "looks premium."

- **Near-black-neon tool — REJECTED, with reason.** Empirically (livery PASS 5) this dark-slate +
  indigo/violet look *is* the "classic AI" signature; it reads generic, and generic both loses the
  skeptic and discredits the suite (the front-door argument). Out.
- **Warm-cream editorial — ADOPTED, justified from the POV.** A defensible coincidence: the POV
  demands editorial-authoritative (method-as-content, type/number as hero, lab-notebook sobriety),
  and paper & ink falls out of it. Guardrail: avoid the high-engagement-content cliché version
  (dramatic serif for drama's sake, ochre accent) — restraint + the evergreen spark keep it an
  *instrument*, not a lifestyle blog.
- **Newspaper hairline — DEMOTED to detail, not the primary.** Hairline rules and a table grid serve
  the results/fixtures regions; as the governing principle it is too cold/cramped to carry the
  long-form persuasion. Adopted locally, rejected as the spine.

**What it is NOT:** a marketing landing page (would read as hype and lose the skeptic); a SaaS/AI
dashboard (the generic look that discredits the suite). Reference craft bar: Apple / Anthropic /
OpenAI. Hard constraint inherited: the accent must not clash with Anthropic's clay, and must not be
indigo (the AI default).

### Surface archetype

**Primary = editorial** (straddles **tool**; results region leans **data-dense**).
- *Editorial governs the spine* — type is a lead actor, the method blurb + caveats are first-class
  reading at ~70ch measure, sections float on the paper separated by whitespace + uppercase
  eyebrows, calm single column. This is where the skeptic is persuaded, so it carries the weight.
- *Tool constraints apply locally* to the control cluster (provider form / arm toggles / trials /
  Run / live log): compact density, functional hierarchy, near-zero motion, instant feedback.
- *Data-dense constraints apply locally* to the result/why regions: tabular numerics, hairline
  grid, motion ~none.
- When archetypes conflict, **editorial wins** (the persuasion is the job). The marketing pull from
  intents ①③ is served *by* editorial honesty + craft, never by marketing decoration.

### The one signature element (Chanel law)

**The result delta — a single large, tabular, precise numeral, the one place scale + the evergreen
accent concentrate.** It is the POV made visible (the number you walk away with) and the honest move
made into the hero. Everything else is quiet: the serif headline is authoritative-but-restrained
(NOT a competing hero); the evergreen is a <10%-area accent system (skill name · brand dot · links ·
workflow arm · the delta's own color), not the signature.

- **Hard requirement on the signature:** it must render a **negative or zero delta** just as
  unflinchingly as a positive one (the skill not helping is a real, shippable result). Semantic
  color: positive = the evergreen; negative = a restrained warning hue (never an alarmist red). This
  is "refuses to flatter itself" built into the hero, and it is a first-class state, not an edge case.

---

## ARTIFACT 2 — quantified-targets sheet (STAGE 1)

Every dimension a number, or it dissolves into the next prompt. `canon` sets the targets; `color` /
`type` / `layout` / `form` / `motion` instantiate them. (livery's standing caveat — contrast was
asserted on construction, never pair-measured — is closed by making the floors gates the `color`
lens must *measure*, not assert.)

### Contrast floors (the secondary-text trap is the #1 failure here — name the minimum)

| role | WCAG 2 (legal floor) | APCA Lc (perceptual target) |
|---|---|---|
| primary body / method prose | ≥ 4.5:1 | ≥ 75 |
| secondary / supporting (the "elegant gray" trap) | ≥ 4.5:1 | ≥ 75 |
| tertiary / caption / caveat | ≥ 4.5:1 | ≥ 60 |
| headings / the delta numeral | ≥ 3:1 | ≥ 60 |
| UI components / borders / hairlines | ≥ 3:1 | ≥ 45 |

The caveats and the "read honestly" footer are **persuasion content, not fine print** — they sit at
the secondary floor (Lc ≥ 75), never dialed to pale gray. `color` lens must produce a measured
pair-by-pair report, not an assertion.

### Density grade

**Primary = standard-airy editorial, 8px base unit** (the reading spine: method blurb, caveats,
section rhythm). Two documented local overrides where sub-archetypes rule:
- **compact (4px base)** in the tool control cluster (provider form, arm toggles, trials, Run, log).
- **compact (4px base) + tabular** in the result / why / fixtures regions (data-dense).

Spacing scale (half-geometric, the smallest non-default that reads intentional):
**4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96**. Group-proximity law is a gate: **group-gap ≥ 2×
intra-group gap** (sections separated by ≥ 2× the within-card gap — the editorial "float on paper"
depends on it).

### Type-scale ratio

**Primary modular ratio = 1.333 (perfect fourth)** — editorial; gives the serif headline and the
delta numeral their authority spread. Documented exception: the small-end UI cluster
(labels/controls/table text, ~11–14px) compresses to near-linear ~1.125 steps — a deliberate tool-UI
choice (per livery PASS 2), not the modular scale. `type` lens instantiates with `clamp()` fluid
sizing. Body measure capped at **~65–70ch** (`max-width: ~68ch` on running prose).

### Motion budget

**Ceiling = restrained → minimal** (the POV is an instrument; motion must never read as marketing
flourish). Purpose taxonomy is the gate — every shipped animation maps to **orient / causality /
mask-latency**; none to decoration/attention-grab.
- Discrete UI transitions ≤ **200ms**; **compositor-only (`transform` / `opacity` only)** — no
  animated layout/paint props. The result bar animates `transform: scaleX()`, **never `width`**
  (livery PASS 2 caught this; it is a hard gate).
- Latency-masking is the main licensed use: the live log stream and bars filling incrementally
  during `running`. Nothing fires repeatedly or unpredictably during reading.
- A real, re-tuned `prefers-reduced-motion` path (snap, not strip).

### The "premium" tells, made measurable (for this surface)

- Neutral ramp **tinted warm**: chroma **C ≥ 0.005** on every neutral step (paper warmth, H ≈ 70–95).
  Quantified gate: no pure gray (C = 0) anywhere.
- Ink (text-black): **L ≈ 0.20–0.25**, warm — never `#000`.
- Paper (bg-white): **L ≈ 0.97–0.99**, faint warm tint — never `#fff`.
- Accent (deep evergreen): anchor **`oklch(0.47 0.075 158)`** (light mode), kept as **one swappable
  token**; NOT clay (Anthropic clash), NOT indigo (AI default). Accent **area < 10%** (gate).
- Shadows used sparingly (card-soup is killed — only the result panel is elevated): when present,
  **≥ 2 layers, per-layer opacity ≤ 0.12**, one light direction, hue-tinted.
- **Concentric radius:** inner = outer − gap, on every nested rounded element (gate).
- Display/headline letter-spacing **−0.02 to −0.04em**; delta numeral **tabular-nums**.
- Touch/click targets **≥ 44 × 44px** (gate).
- Dark mode (secondary, re-tuned not inverted): bg **L ≈ 0.12–0.18 warm**, elevation by lighter
  surface, accent **L → ~0.70–0.75, C −20–30%**; no `invert()` / B-W swap anywhere.

---

## ARTIFACT 3 — product-sense check (STAGE 2)

### JTBD — the visual serves two real jobs, and they are spatially separated

- **External skeptic:** "decide whether to believe this skill helps, in ~2 minutes, *without*
  trusting the authors." → demands the method + the honest controls be immediately legible and the
  delta credible-not-flashy. The **editorial spine** serves this; a dashboard wouldn't let them read
  the method, a marketing page would trigger distrust. Archetype confirmed correct, not just coherent.
- **Internal operator:** "run an experiment on skill X / model Y / N trials and read the
  per-fixture, per-trial breakdown to find *where* the skill helps." → demands compact functional
  controls, fast feedback, the expandable why-breakdown. The **tool sub-surface** serves this.
- **Conflict resolved:** the two jobs occupy different regions (read-spine vs control/data-region),
  so editorial-weight type never slows the operator and dense data never slows the skeptic. The
  straddle holds.

### All-states (this surface's long tail — these ARE the product, not edge cases)

- **Empty / first-run / `mode=null` "detecting…":** before any run, the page is ~60% method
  explanation with **no result data** — and this is the **default first impression** most visitors
  (skeptics) see. The editorial spine must fully persuade with zero results present. First-class, not
  an afterthought.
- **Loading / `running`:** live log stream + bars filling incrementally + all inputs disabled.
  Skeleton geometry must match loaded geometry (no layout shift). Latency-mask motion licensed here.
- **Error (`err`):** provider failure / API 4xx-5xx / grader parse-fail. A clear product moment at
  ≥ tertiary contrast with a re-run affordance — never a bare "Error 500".
- **Partial / `SKIPPED`:** a `fixture×arm×trial` unit can error while the run continues; results fill
  in with units missing and `n` reflecting only completed trials. The view must show partial results
  **honestly** (this is itself the honesty POV — don't hide a partial run).
- **Negative / zero delta:** the skill not helping is a real, shippable result; the signature numeral
  renders it as unflinchingly as a win (evergreen for ≥0, a restrained warning hue for <0 — never
  alarmist red). Redundant sign/label so it is **not color-only**.
- **Edge numerics:** `meanFound` 0.00–10.00, `fpRate` 0–100%, `n` as low as 1, `fixtures.length` 1
  (per-fixture breakdown hidden) → many; harness `gates k/4`. tabular-nums mandatory everywhere.
- **Harness arm unavailable (on claude.ai):** inline warning, arm unrunnable — must read clearly
  without breaking the hierarchy.
- **Overflow:** long repo names / `fix_summary` / file paths; the full `review` in `<details>` can be
  very long (mono, scrollable, must match geometry); long model names. Specify, don't `ellipsis`-defer.

### Surface diversity — the consistency requirement makes this load-bearing, not hypothetical

This bench runs in **two real environments by design** — local desktop (`server.mjs` @ localhost) and
a **claude.ai artifact** (potentially a narrow pane / tablet). The owner's paramount constraint is
*local ≡ claude.ai*, so:

- **⚠ Webfont consistency is a real divergence risk (feeds the `type` lens, hard constraint).** If
  the design uses Newsreader / Inter / JetBrains Mono from a CDN and claude.ai's artifact sandbox
  blocks or stalls external font loads (livery PASS 3-4 already hit Google-Fonts stalls under headless
  Chrome), then local shows the designed face and claude.ai falls back → **visual divergence, which
  violates the #1 requirement.** Resolution the `type` lens must pick: either (a) a font strategy that
  loads *identically and reliably* in both targets, or (b) a system-font stack that guarantees
  identity at the cost of the serif "expensive" move. **Identity wins over the flourish** when they
  conflict — the consistency requirement is non-negotiable.
- **Responsive:** the 2-col setup grid and label-gutter must collapse/stack on a narrow artifact pane
  (≤720px); density grade must hold at ~375px. Verify on the narrow pane, not the dev MacBook.
- **Input modality:** desktop-first, but touchable — targets ≥ 44px; **no hover-only affordances**
  (arm blurbs and verdicts are persistent text, not tooltips; `<details>` expand is click).
- **`forced-colors`:** the pos/neg delta and every semantic status carry a redundant signal
  (sign, label, icon) — never color-only. **`prefers-reduced-motion`:** bars snap to final, real path.

### Ethics — the choice architecture, and the sharp one for THIS surface

The bench measures skills its own authors sell — a built-in conflict of interest. The honesty POV
*is* the ethical guard, and the design must not undercut it:

- **No result-flattering (the surface's specific dark-pattern risk).** The design must look equally
  composed for a **negative/null** delta as for a win. A surface that only "looks good" when the
  skill wins is a subtle dark pattern — it flatters success. Equal visual dignity for the honest
  negative is an ethics gate, not just a state.
- **Caveats are first-class, legible content** (secondary contrast, Lc ≥ 75) — the false-positive
  control, `6 = anchor, not the only right answer`, `N small = signal, not proof`, the "read
  honestly" footer. Burying them to strengthen the apparent result is the failure mode; showing them
  confidently is both the POV and the ethics gate.
- **Honest defaults:** both arms default-on (you see the comparison, not a flattering single arm);
  trials=4 is a fair signal/cost default; no pre-selected traps, no fake urgency, no confirmshaming.
- **Restraint audit:** *over-build* rejected — the data is small (a delta + a few bars); DOM bars
  suffice, no chart/viz library, no decorative motion (so `graphics` is likely not needed downstream).
  *Under-finish* guarded — the empty/error/partial/negative states above are named as first-class,
  because they are exactly where a skeptic's trust is won or lost.

---

## Hand-off to the sibling lenses

This brief is the frozen contract. Suggested order and what each consumes:
1. **`color`** — build the oklch paper&ink ramp (warm neutrals C ≥ 0.005, ink L≈0.2, paper L≈0.98) +
   the single evergreen accent token + semantic pos/neg-delta colors; **produce a measured
   pair-by-pair contrast report** (close livery's open caveat). Re-tuned dark ramp.
2. **`type`** — instantiate the 1.333 scale (+ compact UI cluster) with `clamp()`; **resolve the
   webfont-consistency constraint above (identity across local≡claude.ai wins)**; tabular-nums on the
   delta; measure ~68ch.
3. **`layout`** — apply the density grades (airy spine / compact controls / dense results), the
   group-proximity 2:1 gate, the editorial "float on paper" + label-gutter; design the all-states.
4. **`form`** — single light-source elevation (only the result panel elevated), concentric radii.
5. **`motion`** — the restrained/minimal budget; `scaleX()` bars, reduced-motion path.
6. *(`graphics` likely skipped — no charts/illustration warranted; revisit only if data viz grows.)*

Run the `canon/probes/ai-default.mjs` detector once `color`+`type` produce a rendered candidate, as
a back-check on the named language (expect the warm-paper direction to fire few/zero tells; remember
0 tells ≠ a point of view — the POV above is the ceiling).

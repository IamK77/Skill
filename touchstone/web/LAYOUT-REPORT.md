# skill-lab — layout / composition (atelier:layout)

Composition rules: `layout.css` (consumes tokens.css + type.css). This doc holds the *judgment*:
the armature, the focal order, and the design of every application-layer state.

## Armature (STAGE 0)

- **Editorial single column on paper**, shell `max-inline-size: 54rem` (~864px), centered. Sections
  **float** — no card-soup; separated by whitespace + a hairline `border-block-start` + an uppercase
  label that hangs in a **9rem label-gutter** (Stripe/Tailwind-docs idiom). First section ruleless.
- **Grid:** `[label] 9rem [content] minmax(0, 1fr)`; the `minmax(0,…)` is the grid-overflow guard.
  The **result panel** and **error block** span `1 / -1` (break the gutter — they are full-width moments).
- Logical properties throughout (`padding-inline`, `margin-block`, `inset-inline`, `gap`,
  `text-align: start`) → RTL-safe by construction, no physical left/right.

## Visual hierarchy & focal order — TWO regimes (the key composition call)

The surface has two first-impressions and each needs its own focal element:

- **Empty / first-run (no results) — the skeptic's first screen, ~60% method, no data.**
  Focal = the **serif headline question** + the **method blurb** (the persuasion), with the
  **Run button as the single colored primary CTA**. Focal order: headline → method → fixtures
  (real before→after commits = the credibility evidence) → provider/arms → Run → honest footer.
  This screen must persuade *with zero results present* — so fixtures + the read-honestly footer are
  designed to stand alone, not as scaffolding around an absent result.
- **Resulted — the delta is the focal element.** Established by **four** hierarchy levers, so it wins
  regardless of its mid-document position: size (`--t-delta`, the largest type), weight (bold),
  color (accent / sober-neg), isolation (alone in the one elevated panel). Focal order: delta →
  per-arm bars → per-fixture breakdown → why → log → footer.

The serif headline is **quiet** (`--t-h1` 30→40px < delta 44→64px) — Chanel law: the number is the
one bold thing. Only the **result panel** is elevated; everything else sits flat on the paper.

## Measure & rhythm (STAGE 1)

- Running prose capped at `--measure` (68ch) via `.lead`/`.prose`/`.footer` (`max-inline-size`).
- Every gap/padding/margin = a `--space-*` token; **no magic px**.
- **Group-proximity 2:1 (gate):** section-to-section `--space-2xl` (48) ≥ 2× intra-section
  `--space-md`/`lg` (16/24); within the tool cluster, field-to-field `--space-sm` (12) ≥ 2× label-input
  `--space-2xs` (4). The spacing gradient mirrors document structure.
- Density registers: editorial spine = 8px-rhythm steps (md/lg/2xl); tool cluster (provider/arms/
  controls) = compact (2xs/xs/sm); results/why/log = compact + `tabular-nums` mono.
- Units: layout in `rem`, measure in `ch`, fluid shell padding in `clamp()` → passes WCAG 1.4.10
  reflow (no px-only layout).

## Application-layer states (STAGE 2) — all first-class, none a blank div

| state | design |
|---|---|
| **detecting** (`mode=null`) | env badge "detecting…" with a pulsing dot; headline/method/fixtures render normally; provider panel reserves its height (no shift); Run disabled. |
| **empty / first-run** | the persuasion screen above — complete and self-sufficient, not "waiting for data". Run = primary CTA; cost-line previews `fixtures × arms × trials`. |
| **running** | all inputs `disabled` (0.55 opacity, not-allowed); Run → "Running…"; log streams immediately (first feedback <100ms); result panel shows a **skeleton matching loaded geometry** (`.skeleton.delta-sk` + `.bar-sk`) until the first unit completes, then fills incrementally — no layout jump. |
| **error** (`err`) | a **distinct** `.error-block` (error-bg surface, sober red border/text ≥ floor) — NOT empty-state styling, NOT "Error 500": shows the message + a retry hint; the Run button remains the re-run path. |
| **partial / SKIPPED** | a unit can fail while the run continues; results render honestly with the actual `n`; skipped units appear only as `… · SKIPPED — msg` in the log. No fabricated 100%. |
| **negative / zero delta** | `.delta[data-sign="neg"]` — **equal dignity**: same size, same panel, same composition; only the color (`--delta-neg`, sober) and the leading `−` differ. The sign + the "points X adds over Y" label carry meaning (not color-only). Ethics gate: the surface looks as composed for a loss as for a win. |
| **harness unavailable** (claude.ai) | `.warn-inline` inside the delivery-arms section — a caution (inline-start rule, secondary text), not an alarm; explains the arm is unrunnable here. |

### Form visuals & full state coverage

- Top-aligned labels (`.field` column), single-column stack, input **width as affordance** (`flex`
  basis), recessed inputs (`--surface-2`) with a functional border (≥3:1) and an accent focus ring.
- State machine per control: default · hover · focus-visible (2px accent ring, 2px offset) ·
  disabled (0.55 + not-allowed) · running. Touch targets `min-block-size: 2.75rem` (≥44px) on
  inputs, selects, the Run button, arm rows, and `<summary>` expanders. No placeholder-as-label.

### Long tail & overflow

- `overflow-wrap: anywhere` on fixture file paths, the review body, and the log → long unbroken
  code tokens / URLs can't blow out the column; `minmax(0,1fr)` + `min-inline-size: 0` guard the grid.
- The full `review` and `cleanReview` live in `<details>` → `.review-body` mono, `max-block-size`
  with `overflow:auto` + `scrollbar-gutter: stable`; the run log likewise capped + scrollable.
- Numerics: `tabular-nums` everywhere (delta, scores, %, n); values fit at extremes; `n` reflects
  actual completed trials. Fixtures: per-fixture breakdown shown only when `fixtures.length > 1`.
- Responsive: label-gutter stacks ≤720px; single column + logical props + rem/ch → holds at 375px
  and at 320px / 400% zoom (no horizontal scroll).

## Hand-off

`form` adds the elevation (single light source; result panel = the lifted surface) + concentric
radii (define `--radius-sm`/`--radius-lg`; inner = outer − gap). `motion` animates the bars via
`transform: scaleX()` (never width), the skeleton/badge pulse already honors reduced-motion. Final
assembly wires these classes onto the INTERACTION.md view structure in the JSX (logic unchanged).

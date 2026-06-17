---
name: lookout
description: >
  The delivery-and-observability lens for a frontend build — and the place the
  suite's ethics stops being philosophy and becomes a launch gate. Use when setting
  up delivery/monitoring, shipping a metric-driven change, or running an A/B test.
  The mindset shift: shipping is not the finish line, it is the start of the
  conversation with reality — so every change is made instantly visible (a preview
  per PR), the real world is instrumented (RUM is psychophysics encoded as numbers;
  error tracking; product analytics), and — the heavy part — the moment the metrics
  dashboard is born it starts pulling every decision, so the objective function and
  guardrails you set in bearings come back here for their exam. A/B testing is a
  gradient-descent optimizer: point it at an engagement metric over a human nervous
  system and it will DISCOVER manipulation as a local optimum with no one designing
  it — the real villain is the loss function. Triggers on "deploy / CI/CD / preview
  deploys", "feature flags / progressive rollout / canary", "observability /
  monitoring / RUM / Web Vitals / Sentry / error tracking", "analytics / event
  tracking / what should we track", "A/B test / experiment", "which metric should we
  optimize", "is this metric / experiment ethical", "dark pattern". Installs the
  preview-per-PR + progressive-rollout setup, the two instrument classes (always-on
  health/perception vs deliberate product analytics), the telemetry discipline (every
  event tied to a decision; data minimization as ethics), and the pre-launch
  objective-function ethics gate (north-star + guardrails + adversary pre-mortem +
  reflective-self + reversibility + friction-symmetry + kill-switch). The agent wires
  the pipeline and runs the experiments; you keep the calls it cannot make — which
  metric is the north-star, and whether a winning variant serves the user or exploits
  them.
argument-hint: "[the delivery/observability to set up, or the metric/experiment to gate]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# lookout

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A lookout watches the real horizon — the live sea, not the chart — and is also the conscience posted to call danger before the ship runs into it. `lookout` is the sixth skill of the `surface` suite, the delivery-and-observability lens, and it carries the suite's ethics across the line from philosophy into a launch gate. Its mindset is one shift: **shipping is not the finish line, it is the start of the conversation with reality.** Its product is a delivery-and-observability setup — preview per PR, RUM and error tracking, an analytics-and-experiment framework — *plus* the pre-launch ethics gate that the objective function from `bearings` must pass. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The heavy part, stated up front: the moment the metrics dashboard exists, it starts pulling every decision — so the ethics must already be in place.** A/B testing is, mathematically, a **gradient-descent optimizer**: each experiment keeps the higher-scoring variant, and run thousands of times it slides down the gradient of whatever metric you chose. Point that optimizer at an engagement metric — time-on-site, scroll depth — over a human nervous system, and it will **discover manipulation as a local optimum**: infinite scroll, variable-ratio rewards, removed stopping cues, all selected *because they move the number*, with no person ever sitting down to design a dark pattern. This is Goodhart's law on a human, the same shape as AI misalignment: optimize a proxy hard enough and you get the proxy, not the intent. The real villain is the loss function — which is why the objective-function charter is set in `bearings`, before the dashboard exists, and audited *here*, before any metric-driven launch.

This is where the agent era bites:
- **The agent treats launch as the end.** It ships, the task turns green, and it never wires the feedback loop — no preview to judge perception by eye, no RUM, no error tracking — so the team flies blind exactly where the spec lives (the real user's nervous system).
- **The agent instruments by lab, not field, and tracks vanity.** It will trust a fast-machine/fast-network lab number, miss the mid-range-phone-on-4G truth, and happily collect every event "for analytics" — monitoring debt and a privacy liability with no decision attached.
- **The agent will optimize whatever metric it's handed, including engagement.** It feels nothing about the reflective-vs-impulsive-self betrayal, so left alone it points the optimizer at the number that grows, and the optimizer finds the manipulation. The conscience is not a thing the agent supplies — it must be a gate.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart; for `lookout`, the *ethics* axis is the spine (friction as the moral primitive, manipulation as bypassing agency, the impulsive-vs-reflective self, A/B as a gradient toward exploitation) along with the *mind* axis (RUM = psychophysics as numbers). Load at the start, re-check at every gate.

**Speak the user's language.** Almost every call here is the user's — which metric is the north-star, is this experiment honest, is this default serving the user. Read their fluency and gloss a term on first use (*preview deploy*, *feature flag* / progressive rollout, *RUM* vs lab, *Core Web Vitals* (LCP/INP/CLS), a *guardrail* metric, the *gradient-descent* framing of A/B, the *reflective vs impulsive self*, *friction symmetry* / GDPR Art. 7). A metric decision the user can't weigh is an ethics imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `lookout`, the *ethics* axis (A/B as gradient descent toward manipulation; friction; the two selves) and the *mind* axis (RUM as psychophysics). Load at the start, re-check at every gate.
- [references/delivery-and-instruments.md](references/delivery-and-instruments.md) — the engine: preview-per-PR and progressive rollout / feature flags; the two instrument classes — always-on health/perception (RUM field-not-lab, error tracking with release correlation, segmented error/slow rates) and deliberate product analytics.
- [references/telemetry-discipline.md](references/telemetry-discipline.md) — what to track (the JTBD funnels, pain signals like rage/dead clicks, the guardrails) vs not (vanity metrics, excess PII), the one rule (every event names the decision it drives), and data minimization as ethics not just compliance.
- [references/ethics-gate.md](references/ethics-gate.md) — the pre-launch objective-function gate: north-star declared and unique, guardrails on the same dashboard, the adversary pre-mortem (launch version), the reflective-self check, the reversibility/publicity test, friction symmetry (the GDPR floor), the stop-condition + kill-switch, and honest defaults/consent.
- [references/performance-engineering.md](references/performance-engineering.md) — the rendering pipeline (reflow/repaint/composite, the 16.7ms frame budget), Core Web Vitals targets and how to fix each, loading and delivery (critical path, code-splitting, resource hints, caching/CDN), and the edge/distribution layer.

> **The arc is the loop to reality, with a conscience on it.** Four stages — preview · instrument · telemetry · conscience — turn "we shipped" into "we are in honest conversation with the real world": preview makes every change visible and reversible in seconds; instrument wires the always-on health and perception sensors; telemetry adds product analytics with every event tied to a decision; conscience runs the objective-function ethics gate before any metric-driven launch. `lookout` gates all four; `bulwark` (1→N) is the next step — observability is also the early-warning system for the architectural entropy bulwark fights.

---

## STAGE 0 — Preview (make every change visible and reversible in seconds)

Open **[references/delivery-and-instruments.md](references/delivery-and-instruments.md)** (the delivery section). The delivery machine, kept brief because it's mostly standard.

- **A preview deploy per PR.** Every PR gets a clickable URL. High leverage, because the perception contract can only be judged *by eye* — a preview compresses the design feedback loop from days to minutes, and reviewers review the running thing, not the diff.
- **Progressive rollout and feature flags.** Decouple deploy from release; ramp 1% → 10% → 100%; roll back with a flag in seconds (faster than redeploy). A/B tests live here. The triad: ship small, ship often, roll back fast.

### GATE — clear before INSTRUMENT
1. `checklist check preview preview-and-progressive-rollout-set`
2. `checklist verify preview`

---

## STAGE 1 — Instrument (wire the always-on health and perception sensors)

Open **[references/delivery-and-instruments.md](references/delivery-and-instruments.md)** (the instruments section). The first of two instrument classes — non-negotiable, always on.

- **Error tracking.** Every uncaught and deliberately-logged error, with enough context to reproduce (user action, route, release version); upload source maps so stacks are real; **correlate with release** so you can see "errors spiked in version X."
- **RUM / Core Web Vitals — field, not lab.** LCP, INP, CLS measured on **real users** (field), not just your lab. The reason: your lab is a fast machine on fast network; real users are mid-range phones on 4G, and the field data is the truth. These metrics are psychophysics encoded as numbers — they're the closest numeric proxy to "does it feel right."
- **Segment the basics.** Error rate and slow-interaction rate, segmented by device / network / route, so a regression localizes to a specific population instead of hiding in an average.

### GATE — clear before TELEMETRY
1. `checklist check instrument health-and-perception-instrumented`
2. `checklist verify instrument`

---

## STAGE 2 — Telemetry (product analytics, every event tied to a decision)

Open **[references/telemetry-discipline.md](references/telemetry-discipline.md)**. The second instrument class — deliberate, and ethically heavy because this is where A/B and behavioral events live.

- **Track:** the critical-path funnels (the JTBD journeys from `bearings` — completion rate per step, to *find problems*, not to optimize engagement); the honest pain signals (rage clicks, repeated retries, dead clicks); and the guardrail metrics (the "never let worsen" set).
- **Don't track (or track only very deliberately):** vanity metrics no decision hangs on (monitoring debt + privacy risk); personal data beyond what a decision needs (data minimization — and per the ethics axis, every extra data point widens your asymmetry over the user, so minimization is *ethics*, not just compliance); and don't set engagement/time as the north-star you optimize — observe it, never point the gradient at it (it's exactly the loss function that finds manipulation).
- **The one rule** that kills both monitoring bloat and metric creep: **every event you track names the decision it will drive.** No decision → don't collect it.

### GATE — clear before CONSCIENCE
1. `checklist check telemetry telemetry-tied-to-decisions`
2. `checklist verify telemetry`

---

## STAGE 3 — Conscience (the objective-function ethics gate, before any metric-driven launch)

Open **[references/ethics-gate.md](references/ethics-gate.md)**. This is `bearings`'s objective-function charter coming back for its exam — the pre-mortem you did on paper, now a launch gate.

- **Run the gate before any A/B test or metric-driven rollout.** (1) **North-star declared and unique** — the one metric this change is meant to move. (2) **Guardrails declared, on the same dashboard** — the metrics that must not worsen even if the north-star climbs (mis-orders, rage-clicks, churn, a11y errors, support tickets), read *next to* the experiment, not checked after. (3) **Adversary check (launch version)** — "what is the cheapest, most manipulative path to move this number?" — and is that path forbidden / blocked by a guardrail? (4) **Reflective-self check** — is this optimizing the user's impulsive self and betraying the self they'd endorse on reflection? If the metric only moves by siding with the impulsive self, stop. (5) **Reversibility / publicity** — if the user saw every mechanism and intent, would they still endorse it? (6) **Friction symmetry** — where this change makes something easier or harder at a point where user and business interests diverge, whom does it serve? (GDPR Art. 7 — withdrawing consent as easy as giving it — is the legal floor; apply the principle everywhere.) (7) **Stop-condition + kill-switch** — declare each experiment's success/failure thresholds and the automatic stop when a guardrail breaks, *before* you have feelings about the result.
- **Run A/B honestly and decide ties for the user.** Pre-register hypothesis, metrics, and stopping rule (no peeking-until-significant); read guardrails on the same dashboard; on a tie or a wash, **default to the least manipulative variant** — the tiebreaker is the user's reflective interest, not the marginally higher number. Honest defaults: the default is the strongest lever (most never change it), so it must be the choice the user would endorse, not the one that benefits you.

### FINAL GATE
1. `checklist check conscience objective-function-ethics-gate-passed`
2. `checklist verify conscience`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`lookout` is **the delivery stage** of the `surface` suite, and the place its ethics gets teeth. It closes the loop `bearings` opened: the objective function and guardrails set on paper, before the dashboard could pull anyone, come back here as a gate that every metric-driven launch must pass. It instruments the perception contract (`bearings`) and the four states (`seaworthy`) with field RUM and error tracking, and it hands `bulwark` an early-warning system — error clusters and cross-version performance creep are entropy becoming visible. The through-line is the suite's own — *push correctness, and here conscience, into structure* — by making the ethics a pre-launch gate with declared guardrails and an automatic kill-switch, rather than a hope that no one optimizes the wrong number.

It pairs with the engineering suite without duplicating it. `stationkeeping` runs the *general* operations work (deploy, SLOs, incidents, capacity) — `lookout` shares the observability instinct but owns what is frontend-and-product-specific: RUM as psychophysics, preview-per-PR for perceptual review, and above all the objective-function ethics gate, which exists only because the optimized node is a person. For an agent the lever is the same as everywhere in the suite: it treats launch as the end, instruments by lab, tracks vanity, and will optimize whatever metric it's given — feeling nothing about the reflective-self betrayal — so the loop, the telemetry discipline, and the conscience must be **wired and gated**, with the kill-switch declared before the result is known.

## Anti-patterns (use as a pre-flight checklist)

- **Treating launch as the finish line** — it's the start of the conversation with reality; wire the feedback loop (preview, RUM, errors) as part of shipping.
- **No preview per PR** — the perception contract can only be judged by eye; give every PR a running URL.
- **Lab metrics only** — your fast machine lies; measure Web Vitals on real users in the field, segmented by device/network.
- **Errors with no release correlation or source maps** — you can't see "spiked in version X" or read the stack; wire both.
- **Tracking everything "for analytics"** — monitoring debt and privacy risk; every event must name the decision it drives.
- **Collecting PII beyond need** — data minimization is ethics (every extra point widens your asymmetry), not just compliance.
- **Optimizing engagement/time as the north-star** — that's the loss function that finds manipulation; observe it, never point the gradient at it.
- **Skipping the adversary pre-mortem at launch** — if you don't find the cheap manipulative path, the A/B optimizer will, and ship it for you.
- **Guardrails checked after, not beside** — read them on the same dashboard as the experiment, with an automatic kill-switch on breach.
- **Peeking until significant / breaking ties for the metric** — pre-register the stopping rule; on a tie, default to the least manipulative variant.
- **Dishonest defaults** — the default is the strongest lever; make it the choice the user would endorse, and keep consent friction symmetric (the GDPR floor).
- **Skipping a GATE** — and remember: the real villain is never a person, it's the loss function; choose it, guard it, and give it a kill-switch.

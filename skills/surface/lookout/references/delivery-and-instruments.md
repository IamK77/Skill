# Delivery & Instruments — the loop to reality, and the sensors on it

This reference is the depth behind two stages of the [../SKILL.md](../SKILL.md) flight plan: **STAGE 0 — Preview** (`preview-and-progressive-rollout-set`) and **STAGE 1 — Instrument** (`health-and-perception-instrumented`). It owns the **delivery machine** — preview-per-PR and progressive rollout / feature flags — and the **first of two instrument classes**: the always-on, non-negotiable health-and-perception sensors. It does **not** own product analytics, the track/don't-track rule, or the ethics gate — those are [telemetry-discipline.md](telemetry-discipline.md) and [ethics-gate.md](ethics-gate.md). Read the heart first: [the-membrane.md](the-membrane.md), the *mind* axis in particular (RUM is psychophysics encoded as numbers).

The governing fact, restated because every call below is judged against it:

> **Shipping is not the finish line, it is the start of the conversation with reality.** Frontend's correctness spec lives in a human nervous system, not a document — so the only way to know whether the shipped thing is *right* is to make every change instantly visible (judge it by eye) and instrument the real world (measure the nervous system in numbers). The delivery machine and the always-on instruments are the two ends of one loop: one pushes a change out fast and reversibly, the other reads back what the change did to the real user.

## Contents

- [The two halves of the loop](#the-two-halves-of-the-loop)
- [The delivery machine — make every change visible and reversible in seconds](#the-delivery-machine--make-every-change-visible-and-reversible-in-seconds)
  - [Preview per PR — the perception contract can only be judged by eye](#preview-per-pr--the-perception-contract-can-only-be-judged-by-eye)
  - [Progressive rollout and feature flags — decouple deploy from release](#progressive-rollout-and-feature-flags--decouple-deploy-from-release)
- [The first instrument class — always-on health and perception](#the-first-instrument-class--always-on-health-and-perception)
  - [Error tracking — release-correlated, source-mapped, reproducible](#error-tracking--release-correlated-source-mapped-reproducible)
  - [RUM / Core Web Vitals — field, not lab](#rum--core-web-vitals--field-not-lab)
  - [Segment the basics — a regression must localize to a population](#segment-the-basics--a-regression-must-localize-to-a-population)
- [The agent-era failure mode this counters](#the-agent-era-failure-mode-this-counters)
- [Where findings route](#where-findings-route)

---

## The two halves of the loop

Two complementary faces, one purpose. Keep them distinct, because they fail differently and an agent tends to wire neither.

| Half | What it does | The failure if missing | Gate |
|---|---|---|---|
| **Delivery machine** | every change instantly visible (preview) and instantly reversible (flag) | you can't judge perception by eye, can't roll back in seconds | `preview-and-progressive-rollout-set` |
| **Health/perception instruments** | always-on read-back of errors and felt performance from real users | you fly blind exactly where the spec lives — the user's nervous system | `health-and-perception-instrumented` |

The delivery machine is *mostly standard* and kept brief — it is the same triad every backend uses (ship small, ship often, roll back fast), with one frontend twist (the preview, because perception is judged by eye). The instrument half is where the frontend-specific weight sits, because the thing being measured is a person.

---

## The delivery machine — make every change visible and reversible in seconds

The whole machine is one sentence: **ship small, ship often, roll back fast.** Two pieces realize it.

### Preview per PR — the perception contract can only be judged by eye

**Every PR gets a clickable URL — a deployed, running build of exactly that change.** This is the single highest-leverage piece of delivery infrastructure on a frontend, and the reason is structural, not convenience:

> The perception contract — does this *feel* right, does the animation read as cause-and-effect, does the latency sit under the threshold — **can only be judged by eye.** No diff review and no automated check can tell you the thing is right, because the spec is in a nervous system. A preview compresses the design feedback loop **from days to minutes**, and the reviewer reviews the running thing, not the diff.

The acceptance test for a preview setup, drawn from the walking-skeleton seam list (this seam is wired from the skeleton on day one, not bolted on at the end):

- **PREDICATE — every PR produces a URL a reviewer can open**, deployed to an environment that *mirrors production form* (env, secrets, build mode), not localhost. A preview on a config that differs from prod is a preview of a different application.
- **PREDICATE — the preview is reachable by a non-author** (a designer, a PM) with no local toolchain, so the perceptual review can happen where the call actually lives — with the person who holds the taste.
- **DEFAULT** — wire it through whatever CI already deploys (a platform's per-branch preview, a containerized staging per PR). Name a specific host only as an example; the contract is "a URL per PR that mirrors prod," not a vendor.
- **FALLBACK** — if true per-PR previews are genuinely out of reach (e.g. a heavyweight monolith with no preview infra yet), the minimum bar is a shared staging that mirrors prod where each PR is deployed *before* merge and reviewed running. Record the gap as debt; a queue-of-one staging still beats reviewing the diff.

### Progressive rollout and feature flags — decouple deploy from release

**Deploy is not release.** The code reaching production (deploy) and the feature reaching a user (release) are two events, and a flag is what splits them. Once split:

- **Ramp the audience, don't flip it.** 1% → 10% → 100%, watching the always-on instruments at each step. A regression that would have hit 100% of users now hits 1%, and the segmented error/slow rate (below) tells you *which* 1% before you widen.
- **Roll back with a flag, in seconds — faster than a redeploy.** A flag flip is a config change, not a build-and-ship; it is the fastest reversal you have, and it works even when the bad code is already live everywhere. The walking-skeleton acceptance bar includes "a deploy can be reverted in minutes"; a flag makes it seconds.
- **A/B tests live here.** The flag/rollout substrate is the *same* mechanism an experiment runs on — which is exactly why the ethics gate sits downstream: the moment you can ramp a variant by metric, you are one config flip away from an engagement optimizer. This doc owns the *mechanism*; [ethics-gate.md](ethics-gate.md) owns the *conscience* on it. Do not run a metric-driven ramp until that gate has cleared.

> **A flag is a means, not an end — and a permanent flag is a debt, not an asset.** A feature flag that ramped to 100% three months ago and was never removed is a dead branch in the code with two live paths to reason about. Carrying it is monitoring and maintenance debt. Pruning dead flags is the `bulwark` (1→N) skill's dead-state concern; flag *hygiene* is named here only so you wire flags knowing they must later be removed, not accumulated.

---

## The first instrument class — always-on health and perception

There are two instrument classes. This is the **first: always-on, non-negotiable, wired from the skeleton.** (The second — deliberate product analytics, where A/B and behavioral events live — is [telemetry-discipline.md](telemetry-discipline.md), and is ethically heavy precisely because it is deliberate.) The distinction matters: this class has **no track/don't-track judgment** — you turn it *all* on, because its whole job is to catch the thing you didn't predict. Tests catch what you anticipated; this catches what you didn't.

Three sensors, all required to clear `health-and-perception-instrumented`.

### Error tracking — release-correlated, source-mapped, reproducible

Every uncaught error **and** every deliberately-logged error reaches an error-tracking sink, with three properties that separate a usable tracker from a noise firehose:

| Property | Why it's required | The failure without it |
|---|---|---|
| **Enough context to reproduce** | user action, route, **release version** | "TypeError: undefined" with no context — unactionable; you can't reproduce it |
| **Source maps uploaded** | minified production stacks become real file/line | the stack is gibberish; you can see the error but not where it lives |
| **Correlated with release** | each error is tagged with the version that emitted it | you can't see "errors spiked in version X" — the single most useful signal a deploy gives you |

The release-correlation point is the load-bearing one and the one most often skipped. Without it, an error tracker tells you *that* something is broken; with it, it tells you *which deploy broke it* — which turns "errors are up" into "roll back X." This is also the early-warning seam for architectural entropy: a cluster of errors correlated with a version is entropy becoming visible (the hand-off to `bulwark`).

This wires into the unhappy-path discipline from the build stage: an error state that does not report to the tracker is only *half* handled. **The order-status example:** a checkout page that catches a failed order-status fetch, shows the user a recoverable retry, and *preserves their input* — but logs nothing — looks correct to a reviewer and is invisible to operations. The fourth requirement of an error state ("must be observable") is satisfied *here*, by this sensor, not by the catch block alone.

- **PREDICATE — an error in production appears in the tracker, with route + action + release, and a real (de-minified) stack.**
- **DEFAULT** — a managed error-tracking service (a Sentry-class tool) with source-map upload in the CI build step and release tagging tied to the deploy. Name the tool as an example only.
- **FALLBACK** — if no managed service, structured error logs shipped to a queryable store, *still tagged with release and route*. The non-negotiable is release-correlation and reproducible context, not a particular product.

### RUM / Core Web Vitals — field, not lab

Measure **LCP, INP, CLS on real users (field)** — not just in your CI lab. This is the *mind*-axis instrument, and the field-vs-lab distinction is the whole point:

> **Your lab is a fast machine on a fast network. Your real users are mid-range phones on 4G. The field data is the truth.** A lab Web Vitals number that passes its budget can sit on top of a field distribution that is failing for the slowest third of your users — and that third is exactly the population you can't see from your desk. Lab metrics guard regressions in CI (a build-stage concern — the performance budget); **field metrics tell you what the user actually felt**, and only the field number answers "does it feel right" for the real audience.

These three metrics are **psychophysics encoded as numbers** — INP measures interaction latency against the perceptual threshold, CLS measures layout-shift against the felt stability of the page, LCP measures how long the user stares at nothing. They are the closest numeric proxy you have to the un-documentable spec. That is why you measure them in the field even though it is harder: a lab number is a number about your machine; a field number is a number about a nervous system.

- **PREDICATE — LCP/INP/CLS are collected from real-user sessions in production**, not only from a synthetic/CI run.
- **DEFAULT** — emit the web-vitals measurements from the live client to your RUM sink (a RUM product, or your own pipeline behind the standard web-vitals collection library). The lab budget in CI is complementary, not a substitute — keep both.
- **CONTRAST** — lab is for *gating regressions before merge* (it lives in the build stage's CI performance budget); field is for *knowing the truth after ship*. A finding that the lab passes but the field fails is not a contradiction — it is the lab telling you about your hardware and the field telling you about your users.

### Segment the basics — a regression must localize to a population

**Error rate and slow-interaction rate, segmented by device / network / route.** The reason is that an average hides the population that is hurting:

> A page that is fast for 95% of users and unusable for the 5% on a specific device class shows a *fine average* and a *broken experience for a real group of people*. Segmentation is what turns "slow-interaction rate is up 2%" into "INP collapsed on mid-range Android on the checkout route" — a regression you can localize, reproduce, and assign to a deploy.

This is the same shape as the rollout ramp: at 1%, you need to know *which* 1% is erroring before you widen to 10%. Unsegmented health metrics make a progressive rollout blind — you see the aggregate move but not the population, so you can't tell a real regression from noise.

- **PREDICATE — error rate and slow-interaction rate can be sliced by device, network, and route**, so a regression localizes to a population instead of averaging out.
- **DEFAULT** — three dimensions (device class, connection type, route) are the floor; add a release dimension so you can read "regression on route R, device class D, since version X" in one view.
- **FALLBACK** — if full segmentation isn't yet wired, at minimum tag every error/vitals event with route and a coarse device class, so the slicing can be reconstructed later. An untagged metric can never be segmented after the fact.

---

## The agent-era failure mode this counters

Three reliable agent tells, and what each forces to be **gated** rather than hoped for:

- **The agent treats launch as the end.** It ships, the task turns green, and it never wires the feedback loop — no preview to judge by eye, no error tracking, no field RUM. The task is "done" the moment the code merges, so the loop to reality is exactly the part that earns no green and is therefore skipped. **This is why preview-and-progressive-rollout-set and health-and-perception-instrumented are GATES, not advice** — the loop must be wired *as part of shipping*, enforced by the checklist, because the agent feels no need to wire it.
- **The agent instruments by lab, not field.** Handed a passing CI Web Vitals number, it reports the feature as fast and moves on — it has no instinct that the lab is a fast machine lying about a slow phone. Left alone it measures its own hardware and calls it the truth. The field-not-lab requirement in the gate exists because the agent will not seek the field number on its own.
- **The agent ships errors green.** An unhappy-path branch that catches an error and renders a fallback *looks* complete and turns the task green, even when it reports nothing — so the error is handled for the user and invisible to operations. The release-correlated, source-mapped, reproducible requirement is the gate that says "caught is not handled until it is observable."

The through-line: the agent reads a green dashboard as safety and silence as health, and feels nothing about the loop it never closed. So the loop and its sensors must be **structure** — wired and gated — not an instinct the agent is trusted to have.

---

## Where findings route

- **A change that can't be previewed, or a deploy that can't be rolled back fast** → fix here (STAGE 0). The preview seam is also a walking-skeleton acceptance item; if it's missing from the skeleton, that's a `seaworthy`/skeleton gap, not a launch afterthought.
- **An A/B test or metric-driven ramp on the rollout substrate** → the *mechanism* is here, but **do not run it** until [ethics-gate.md](ethics-gate.md) (STAGE 3, `objective-function-ethics-gate-passed`) clears. The flag/rollout machine is morally neutral; the optimizer it carries is not.
- **A behavioral or funnel event you want to add** → that is the *second* instrument class; it belongs to [telemetry-discipline.md](telemetry-discipline.md) and is governed by the one rule (every event names the decision it drives). The always-on class here has no such judgment — you turn it all on.
- **An error cluster correlated with a release, or cross-version performance creep** → hand to `bulwark` (1→N); this is architectural entropy becoming visible, and the always-on instruments are its early-warning system.
- **The lab/field split, deeper** → the lab budget in CI is the build-stage performance gate; the field RUM is this doc's. They are complementary instruments measuring different things — keep both, and read a lab-pass/field-fail as a finding about your audience, not a bug in the instruments.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves — STAGE 0 and STAGE 1) · [the-membrane.md](the-membrane.md) (the *mind* axis — RUM as psychophysics — and the *ethics* axis behind the rollout substrate) · [telemetry-discipline.md](telemetry-discipline.md) (the second instrument class: deliberate product analytics, the track/don't-track rule) · [ethics-gate.md](ethics-gate.md) (the conscience on the rollout/A-B mechanism this doc wires).

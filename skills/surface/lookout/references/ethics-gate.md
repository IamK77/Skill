# The Ethics Gate — the objective function comes back for its exam

This reference is the depth behind **STAGE 3 — Conscience** of the [../SKILL.md](../SKILL.md) flight plan, the signature stage of `lookout` and the place the suite's ethics stops being philosophy and becomes a launch gate. It governs the one check that closes the run: **`objective-function-ethics-gate-passed`** — the pre-launch gate every A/B test or metric-driven rollout must clear before it ships.

The whole stage hangs off one fact, restated because every call below is judged against it:

> **A metric is a means, not an end — and an A/B test pointed at a human nervous system is a gradient-descent optimizer that will discover manipulation as a local optimum, with no one having designed it. The real villain is never a person. It is the loss function.**

So this gate is not a conscience you hope the agent has. It is the substitute for the unease the agent does not feel: a fixed procedure that forces, before the result is known, the questions the optimizer will otherwise answer for you — silently, in whatever direction the metric rewards.

## Contents

- [Scope — what this doc owns, and where the rest lives](#scope--what-this-doc-owns-and-where-the-rest-lives)
- [The agent-era failure mode this gate counters](#the-agent-era-failure-mode-this-gate-counters)
- [The gate — seven checks, run before any metric-driven launch](#the-gate--seven-checks-run-before-any-metric-driven-launch)
  - [The reflective-vs-impulsive-self cut — the teeth behind check 4](#the-reflective-vs-impulsive-self-cut--the-teeth-behind-check-4)
  - [Friction is the moral material — check 6 in depth](#friction-is-the-moral-material--check-6-in-depth)
- [Running A/B honestly](#running-ab-honestly)
- [Honest defaults and consent — friction ethics, operationalized](#honest-defaults-and-consent--friction-ethics-operationalized)
- [Worked example — the order-status feed](#worked-example--the-order-status-feed)
- [When the call is genuinely unclear](#when-the-call-is-genuinely-unclear)
- [How findings route onward](#how-findings-route-onward)

## Scope — what this doc owns, and where the rest lives

This file owns the **launch-time** gate: the version run when the dashboard is actually wired and a real experiment is about to go live. Two doors away sit the other halves of the same idea — cross-mentioned here, not re-derived:

- The **stage-0 / on-paper** version of this gate — the charter you write *before any metric exists to chase* — is `bearings`'s [objective-function.md](../../bearings/references/objective-function.md). That is where the north-star, the guardrails, and the gradient-descent pre-mortem are first produced. **If no charter was set there, this gate has nothing to enforce.**
- The **theory** — why ethics is constitutive not additive, friction as the moral primitive, manipulation as bypassing agency, A/B as a gradient toward exploitation, the impulsive-vs-reflective self — is the *ethics axis* of [the-membrane.md](the-membrane.md). Read it at this GATE before you certify. This doc operationalizes that axis into a runnable gate; it restates only the *operational core* of the impulsive-vs-reflective cut, because check 4 is unusable without it, and leaves the full theory to the membrane.
- The **track / don't-track** rule and data minimization-as-ethics live one stage earlier in [telemetry-discipline.md](telemetry-discipline.md); the **preview + flag + kill-switch plumbing** is [delivery-and-instruments.md](delivery-and-instruments.md). This gate consumes both — it reads guardrails off the dashboard telemetry wired, and arms the kill-switch on the flag delivery built.

---

## The agent-era failure mode this gate counters

In the human era, the engineer who set a metric felt a flicker of unease — they knew "engagement up" could mean "users can't stop," and a conscientious person could simply decline to ship the dark pattern they recognized. Ethics was a review step you bolted on at the end. The agent breaks this in two distinct ways, and the gate backstops both:

- **The agent will optimize whatever metric it is handed, and feel nothing.** It has no nervous system to register the reflective-self betrayal, so left alone it points the optimizer at the number that grows — and the optimizer finds the manipulation as a local optimum. The conscience is not weak here; it is structurally **absent**.
- **The modern optimizer leaves no fixed artifact to critique.** The old transparency defense — "the source is public, a researcher can screenshot and catalog the dark pattern" — collapses when the pattern is A/B-tuned (or LLM-generated) live, per user, per moment. The asymmetry goes from large to near-total: the builder knows every mechanism, has unlimited experiments and aggregate data on the user's measured weaknesses; the user sees neither the mechanism nor the intent, in real time, often tired at 3 a.m. **The user loses the cat-and-mouse game by construction, so the fix must sit upstream, on the builder, and it must be a gate.**

This is why "I agreed to the terms" rings hollow: consent presupposes a deliberating agent, but this membrane operates *beneath* deliberation and is tuned to the user's specific weaknesses — so an engineered consent flow corrodes the very mechanism (informed consent) that ethics normally uses to license influence.

---

## The gate — seven checks, run before any metric-driven launch

This is the executable heart of `objective-function-ethics-gate-passed`. Run all seven before any A/B test or progressive rollout. The first three are *what you steer by*; the next three are the *standing tests* that catch a manipulative path the pre-mortem missed; the seventh is the *operational teeth* this launch version adds that the on-paper charter could not.

| # | Check | The question you answer out loud | A failure means |
|---|---|---|---|
| **1** | **North-star declared and unique** | What is the *one* metric this change is meant to move, and is it tied to the user's job-done (the JTBD `so that`)? | Two north-stars is no north-star: when they conflict, the one easier to move wins — and "easier to move" is almost always "the one the optimizer can game." |
| **2** | **Guardrails on the same dashboard** | What 2–3 metrics must *not* worsen even if the north-star climbs, and are they read *beside* the experiment readout, not after? | Guardrails checked after the fact are a wish-list, not a veto. They must be trip-wires laid exactly where the cheapest manipulative path trips them. |
| **3** | **Adversary check (launch version)** | "What is the cheapest, most manipulative path to move this number?" — and is that path forbidden by rule and blocked by a guardrail? | If you don't name the cheap manipulative path, the live optimizer will find it for you and ship it. |
| **4** | **Reflective-self check** | Does the metric move *only* by siding with the user's impulsive self over the self they'd endorse on reflection? | If the lift requires taking the impulsive self's side, **stop** — that is the definition of UI manipulation (see below). |
| **5** | **Reversibility / publicity** | If the user saw every mechanism, every A/B graveyard, and your true intent, would they still endorse this exact version? | A design that depends on the user *not* understanding it — that dependence is the tell of manipulation. |
| **6** | **Friction symmetry** | Where this change makes something easier or harder *at a user-vs-business fork*, whom does the asymmetry serve? | Friction pressed onto the user's side of a divergence (one-click subscribe, five-screen cancel) is the moral primitive of a dark pattern. GDPR Art. 7 is the legal *floor*. |
| **7** | **Stop-condition + kill-switch** | Are the success/failure thresholds and the automatic stop-on-guardrail-breach declared *before* you have feelings about the result? | A kill-switch decided after you see the number is decided by the number. Declare it cold. |

The discipline that keeps the seven honest is the master fact: **a metric is a means, not an end.** A check that fires is a finding, not a debate — but the *diagnosis* (is this lift impulsive or reflective; whom does this friction serve) is judgment, and where it won't resolve you take the PREDICATE / DEFAULT / FALLBACK below, then [the-membrane.md's escalation ladder](the-membrane.md#escalation-ladder--when-the-call-is-unclear).

### The reflective-vs-impulsive-self cut — the teeth behind check 4

This is the sharpest distinction in the gate, because it survives the strongest objection — *"all design influences the user; isn't the line between influence and manipulation arbitrary?"* It is not. The line is not drawn at *influence vs none* (that genuinely can't be drawn), but at **calling the user's agency vs bypassing it**:

> **UI manipulation = the interface, standing in the gap between the user's impulsive self and reflective self, choosing the impulsive self's side — because the other self doesn't move the number.**

- **Serving the impulsive self** (manipulation): removing the natural stopping point (infinite scroll — a stopping cue is friction, and removing *that* friction serves the machine), the variable-ratio reward (pull-to-refresh is a slot machine's reward schedule), turning "seen" receipts into social pressure. The interface structurally takes this side because the impulsive self is the one that produces the metric.
- **Serving the reflective self** (good design): real reasons that leave the user's judgment intact, stopping cues, consequential actions made *appropriately effortful*. Here friction is not an obstacle — it is **care**: the deliberate effort that lets the reflective self catch up to the impulsive one.

The rule that follows: **design for the self the user would endorse afterward, not the one that moves the metric this second.** When you can't tell whether a nudge *calls* agency or *bypasses* it, treat it as bypassing and reject it — the burden of proof is on the nudge.

### Friction is the moral material — check 6 in depth

Good design makes "easy" align with the user's goal; manipulation makes "easy" align with the builder's goal, precisely at the fork where they diverge. So the friction audit is the most operational of the standing tests: **walk every place the design makes something easier or harder, find the ones at a user-vs-business fork, and name whom the asymmetry serves.** "Accept all" in one click and "Reject" five layers deep is a friction mismatch; sign-up in one click and cancel-by-phone (the roach motel) is a friction mismatch; a pre-checked add-on is a friction mismatch. GDPR Art. 7 — *withdrawing consent must be as easy as giving it* — is one abstract ethical proposition encoded word-for-word into law; it is the floor, but apply the principle everywhere, not just consent flows.

---

## Running A/B honestly

An A/B test is a neutral, even elegant, causal-inference tool — the same experimental design used to test a new drug. It acquires ethical weight only when you point it at a human nervous system with a business metric as the loss function. Run it as an *instrument*, with the same statistical honesty you'd demand of a trial:

- **Pre-register the hypothesis, the metrics, and the stopping rule** — before the test starts. This is what forbids p-hacking and "peek until significant."
- **No peeking-until-significant.** Stopping the moment the number looks good inflates false positives. Use a pre-committed sample size or a sequential test designed for interim looks.
- **Read guardrails on the same dashboard as the north-star**, not in a separate report no one opens during the ramp.
- **On a tie or a wash, default to the least-manipulative variant.** The tiebreaker is the user's reflective interest, not the marginally higher number.

**Decision fork — an experiment ties or washes; which variant ships?**
- **PREDICATE:** does the winning variant move the north-star *only* by siding with the impulsive self over the reflective self (the adversary's cheap path), or does a guardrail flag it?
- **DEFAULT** on a tie or wash: ship the **least-manipulative variant**. Honest defaults follow the same rule — the default is the strongest lever (most users never change it), so it must be the choice the user would *endorse*, not the one that benefits you.
- **FALLBACK** when you cannot yet tell whether the lift is impulsive or reflective: do *not* ramp to 100%. Hold at a small percentage behind a flag, add the missing guardrail to the dashboard, and re-read. An un-audited engagement lift you cannot explain is a finding, not a win.

> **The anti-pattern this kills: optimizing engagement / time-on-site / scroll-depth as the north-star.** You may *observe* it (is it healthy?), but pointing the gradient at it is pointing the optimizer at exactly the loss function that finds infinite scroll, variable-ratio rewards, and removed stopping cues — because those genuinely move that number. Observe it; never steer by it.

---

## Honest defaults and consent — friction ethics, operationalized

The default is the strongest lever in the entire interface, because **most users never change it.** That makes the default a place where your ethics is decided whether you decide it deliberately or not:

- **Honest-defaults principle:** the default must be the choice the user would endorse on reflection, not the one that benefits you. A pre-checked upsell, an opt-out newsletter, a "share my data" toggle defaulted on — each is the friction asymmetry of check 6 applied to the strongest lever there is.
- **Don't lie about consequential, irreversible actions.** Optimistic UI (telling the likely truth before it's confirmed, to avoid a causal break) is fine for cheap/reversible/high-frequency actions; for payment, deletion, anything irreversible, an honest pending state beats the reassuring lie. (This is the same reflective-self call surfaced in `seaworthy`'s four-states work — the discipline that every fetch-or-mutate slice has four states beyond the happy path (loading, error, empty, edge) and each must keep the user's causal story honest; here it appears only as the consent-and-defaults face of that same call.)
- **Data minimization is ethics, not just compliance.** Every extra data point you collect widens your asymmetry over the user — so the minimization rule from [telemetry-discipline.md](telemetry-discipline.md) (every event names the decision it drives; no decision → don't collect it) is the same ethics axis seen from the data side.

---

## Worked example — the order-status feed

A concrete traversal, the kind the gate is meant to force. The product: a "where's my order" status page in a shop. The on-paper charter for this was set in `bearings`; here it comes back for its launch exam.

- **North-star (check 1).** The naive pick is *time-on-page* or *visits-per-order* — both reward anxiety, the user refreshing because they're worried. The disciplined pick ties to the job: **"the user knows their order's true status in one glance, and doesn't need to come back."** A *falling* visits-per-order is success here, not failure.
- **Guardrails on the dashboard (check 2).** Support-ticket rate per order (a confused user calls), rage-clicks on the refresh control, complaint/refund rate. Wired *next to* the experiment readout, with an automatic stop if any rises.
- **Adversary check (check 3).** Become the optimizer aimed at "engagement on the status page" (the wrong north-star, on purpose, to see what it would do): the cheapest path is to make the status *vague and animated* — a perpetual "your order is on its way!" with a moving truck and no real position data — so the user keeps checking. Written down, forbidden by rule ("status must show the real state, including 'delayed' and 'we don't know yet'"), blocked by guardrail (support-ticket rate would rise as confused users call in).
- **Reflective-self (check 4)** and **publicity (check 5).** If the user saw the truck animation was a retention device with nothing behind it, would they endorse it? No — fail. The design that wins tells the honest causal story and lets the user leave satisfied; the impulsive-self design keeps them anxiously refreshing.
- **Friction symmetry (check 6).** Is the "contact support" path as easy as the "keep waiting" path?
- **Stop-condition + kill-switch (check 7).** Declared before launch: if support-ticket rate rises N% in the ramp, the flag flips back automatically.

**The same shape, different surface — a filtered-list view.** The optimizer's temptation there is to **bury the "clear filters" exit** to keep the user inside the funnel longer — a removed stopping cue, exactly like the missing exit in a roach motel. The adversary check names it; the friction-symmetry test catches it (the exit must be as easy to reach as the path that keeps the user in); the reflective-self test fails the version that hides it. Different surface, identical disease — which is the point of running the seven checks rather than memorizing a dark-pattern catalog.

---

## When the call is genuinely unclear

Most of this gate is judgment, and some calls won't resolve from the seven checks alone. Use **PREDICATE / DEFAULT / FALLBACK**, climbing [the-membrane.md escalation ladder](the-membrane.md#escalation-ladder--when-the-call-is-unclear) when it doesn't:

- **PREDICATE:** Does this design *call* the user's agency (a real reason, judgment left intact) or *bypass* it (a default, a pre-attentive nudge, a confirm-shame, a friction mismatch)? Would the user endorse it with the asymmetry erased?
- **DEFAULT** on a coin-flip: **side with the reflective self.** Ship the least-manipulative variant, keep stopping cues, hold the friction symmetric (cancelling as easy as subscribing), keep the kill-switch armed. When you can't tell whether a nudge calls or bypasses agency, treat it as bypassing.
- **FALLBACK** when you genuinely can't tell whose interest a default serves: that is a trade-off the **user's product owner** owns, not the agent. Surface it as *one sharp question* ("this default decides whether most users ever change it — should it favor the user's reflective interest or the conversion number?") rather than letting the optimizer settle it silently. Record the residual as a launch note.

The asymmetry that governs every toss-up: **a cautious metric call costs the business a little lift or a slower ramp; a manipulative one costs the user — who can see neither the mechanism nor the intent, and whom the aggregate optimizer outruns — their agency, at scale, for as long as the pattern ships.** When the call is a genuine toss-up, err toward the reflective self, the symmetric friction, and the kill-switch.

---

## How findings route onward

The gate is not the end of the ethics — it is the contract `bearings` wrote, enforced at the line:

- **Up to `bearings`'s [objective-function.md](../../bearings/references/objective-function.md):** if a manipulative path surfaces here that the on-paper pre-mortem missed, that is a gap in the charter — the charter's adversary table should grow to include it. The launch gate and the on-paper gate are one loop; a miss at the line feeds back to the page.
- **To `lookout`'s own [telemetry-discipline.md](telemetry-discipline.md):** a guardrail this gate needs but the dashboard doesn't yet read is a telemetry finding — wire the event (and only that event, with its decision named).
- **To [delivery-and-instruments.md](delivery-and-instruments.md):** the kill-switch this gate arms is the feature flag built there; a stop-condition with no flag behind it is a forbiddance with no enforcement.
- **The engineering suite's `aegis` / `gungnir`** own *security* threat-modeling and *adversarial testing of systems you own* — a different adversary (an attacker, not your own metric). This gate is the *ethics* threat-model of the optimizer aimed at the user; named here only so the boundary is clear and not duplicated.

And when in doubt about any candidate, fall back to the one fact every check is a special case of: **the real villain is never a person — it is the loss function. Choose it, guard it, and give it a kill-switch.**

---

**Cross-links:** [the-membrane.md](the-membrane.md) (the *ethics* axis — the full theory this gate operationalizes; the impulsive-vs-reflective self; A/B as gradient descent; the escalation ladder; the GATE MAP) · [../../bearings/references/objective-function.md](../../bearings/references/objective-function.md) (the stage-0, on-paper version of this same gate — the charter this gate examines) · [telemetry-discipline.md](telemetry-discipline.md) (the track/don't-track rule and data-minimization-as-ethics this gate consumes) · [delivery-and-instruments.md](delivery-and-instruments.md) (the preview, flags, and kill-switch the gate arms) · [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves; STAGE 3 — Conscience).

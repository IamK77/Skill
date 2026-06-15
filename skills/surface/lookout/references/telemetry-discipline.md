# Telemetry Discipline — every event names the decision it drives

This reference is the depth behind **STAGE 2 — Telemetry** of the [../SKILL.md](../SKILL.md) flight plan, the second of the two instrument classes and the ethically heavy one, because this is where A/B and behavioral events live. It governs one check: **`telemetry-tied-to-decisions`** — product analytics held to the discipline that *what you collect, you collect for a decision*, and nothing else.

It owns **product analytics discipline only**. The delivery machine (preview-per-PR, progressive rollout) and the always-on health/perception sensors (error tracking, field RUM) are the previous stage's, in [delivery-and-instruments.md](delivery-and-instruments.md). The pre-launch ethics gate — the north-star/guardrail/adversary exam you run *before* a metric-driven launch — is the next stage's, in [ethics-gate.md](ethics-gate.md). The *why* — the full ethics theory the discipline is a consequence of — is [the-membrane.md](the-membrane.md)'s **Ethics axis**. This file is the rule you apply *while deciding what to track*: it ends one door before the gate that judges what you optimize.

The governing fact, the reason this stage is gated at all and not left to "instrument it and see":

> **A metric is a means, not an end — and an event you collect "for analytics" with no decision attached is not free. It is monitoring debt plus a privacy liability, and per the Ethics axis every extra data point widens your asymmetry over the user. So the discipline is a single rule, applied to every event: name the decision it will drive, or do not collect it.** This is what keeps telemetry an instrument for *finding problems in the real flow* rather than a dashboard that, the moment it exists, starts pulling you toward optimizing the number it happens to show.

## Contents

- [The map — one rule, two columns, one check](#the-map--one-rule-two-columns-one-check)
- [The agent-era failure mode this discipline counters](#the-agent-era-failure-mode-this-discipline-counters)
- [The one rule — every event names its decision](#the-one-rule--every-event-names-its-decision)
- [What to track — funnels, pain signals, guardrails](#what-to-track--funnels-pain-signals-guardrails)
- [What not to track — vanity, excess PII, the optimized north-star](#what-not-to-track--vanity-excess-pii-the-optimized-north-star)
- [Data minimization is ethics, not just compliance](#data-minimization-is-ethics-not-just-compliance)
- [Worked examples — the same flow, disciplined and not](#worked-examples--the-same-flow-disciplined-and-not)
- [When the call is genuinely unclear](#when-the-call-is-genuinely-unclear)
- [How findings route onward](#how-findings-route-onward)

---

## The map — one rule, two columns, one check

The whole stage hangs off **one rule, applied to any event you are unsure whether to collect:**

> **Name the decision this event will drive. If you cannot name one — a specific choice that a specific reading of this event would change — do not collect it.** No decision → don't collect. This single line kills both failure directions at once: *monitoring bloat* (events with no consumer) and *metric creep* (data gathered ahead of any need). The event's name is a label for a decision you already identified with this rule — never the other way around.

Everything else sorts into two columns under that rule:

| | Track | Don't track (or track only very deliberately) |
|---|---|---|
| **What** | Critical-path JTBD funnels (completion rate per step) · honest pain signals (rage clicks, repeated retries, dead clicks) · the guardrail metrics | Vanity metrics no decision hangs on · personal data beyond a decision's need · engagement/time as the metric you **optimize** |
| **Why** | each names a decision: *where do users fall out, what hurts, what must never worsen* | each is a cost with no payback: monitoring debt, privacy liability, and — for the optimized engagement metric — the loss function that finds manipulation |
| **The decision it drives** | "fix the step that bleeds" · "remove the friction that produces rage" · "block the change if a guardrail moves" | none — and "none" is the verdict, not a gap to fill |

The two columns are not symmetric. The **Track** column is *finding problems*; it points the instrument at the gap between the flow you designed and the flow that happens. The **Don't-track** column is *cost without a decision*, and one entry in it — optimizing engagement — is not merely wasteful but actively dangerous, which is why it routes into the ethics gate next door rather than ending here.

---

## The agent-era failure mode this discipline counters

In the human era, the author who added an event felt a small friction: another column in the warehouse, another field in the privacy review, another thing to maintain. That friction was a crude but real governor — it made you ask whether the event was worth its keep. The agent feels none of it, and the discipline exists to backstop two distinct failures the missing friction lets through:

- **The agent collects everything "for analytics," because collection is free to it.** It will happily emit an event on every click, store every field the payload happens to contain, and call the dashboard rich. Each event turned the task green — *instrumentation: done* — and none of them names a decision. The result is monitoring debt (a hundred metrics no one reads, that no one can safely delete because no one remembers why they exist) and a privacy liability (PII gathered ahead of, or instead of, a need). The agent feels nothing about the asymmetry each extra field opens, because the cost lands on a user it cannot see.
- **The agent will optimize whatever metric the dashboard shows, and engagement is the one that grows.** Handed a number and told to move it, it points the optimizer there and feels no betrayal of the user's reflective self. Left alone it will treat *time-on-site* or *scroll depth* as the north-star, because those climb — which is exactly the loss function that discovers manipulation as a local optimum (the full argument is [the-membrane.md](the-membrane.md)'s Ethics axis). The discipline's job here is upstream of the gate: keep engagement in the *observe* column, never the *optimize* column, so the dangerous metric never becomes the thing the optimizer is pointed at.

Both failures share a root: the agent has no instinct that an event costs anything, so it cannot self-limit. The one rule is the instinct made external — a gate, because the conscience the rule encodes is not something the agent supplies.

---

## The one rule — every event names its decision

The rule is the spine, so state it operationally. For each candidate event, write — literally, beside the event in the tracking plan — the sentence:

> *We track `<event>` to decide `<the specific choice this reading would change>`.*

If the sentence can be completed honestly, the event earns its place. If the only completion is "to know how we're doing" or "in case we need it later," that is the *no-decision* verdict, and the event does not ship. Three tells that the sentence is fake:

- **The decision is "monitor it."** Monitoring is not a decision; it is a place to put data you have not yet decided to use. A health metric that genuinely drives "page the on-call if it breaches X" is a real decision — but that belongs to the always-on health sensors in [delivery-and-instruments.md](delivery-and-instruments.md), not to product analytics.
- **The decision is the metric's own name.** "We track engagement to improve engagement" is circular: it names no *user-facing* choice, only the intent to move the number — and moving-the-number is precisely the thing the next stage gates.
- **The decision belongs to no one.** If you can name the choice but not who would make it or when, the event is collected ahead of a consumer. Collected-ahead is metric creep; it is the agent's default and it must be refused.

> **The rule is a hypothesis test, not paperwork.** "Name the decision" says *go check whether this event has a consumer* — it is not a box to tick by inventing a plausible-sounding decision. An invented decision that no one will ever act on is the same failure as no decision, dressed up. Confirm the consumer is real before you call the event earned.

The same rule, run in reverse on an *existing* tracking plan, is the highest-yield cleanup there is: walk every event, demand its decision sentence, and delete the ones that cannot produce one. The agent will have left a dense field of these; pruning them shrinks both the monitoring surface and the privacy surface in one pass.

---

## What to track — funnels, pain signals, guardrails

Three classes earn collection, because each names a decision by construction. The funnels and guardrails are not invented here — they are pulled forward from the JTBD journeys and the guardrail set declared in `bearings` (its [objective-function.md](../../bearings/references/objective-function.md)); telemetry instruments what `bearings` already named.

| Class | What it is | The decision it drives | The trap to avoid |
|---|---|---|---|
| **Critical-path JTBD funnels** | completion rate at *each step* of the journeys from `bearings` — the real path a user takes to get a real job done | "fix the step that bleeds" — the drop between two steps localizes a problem to one screen, one form field, one interaction | reading the funnel as an *engagement* number to grow rather than a *fall-out* signal to investigate — track it to **find problems, not to optimize participation** |
| **Honest pain signals** | rage clicks (rapid repeated taps on one element), repeated retries, dead clicks (taps on something that looks interactive and isn't) | "remove the friction that produced the rage" — these are the most honest analytics data because the user did not perform them *for* you; they leak real frustration | inferring intent from raw clickstream beyond the pain signal — the pain signal is behavior the user couldn't help, which is exactly why it's honest and why it needs no extra PII |
| **Guardrail metrics** | the `bearings` "never let worsen" set — mis-orders, rage-clicks, churn, a11y errors, support-ticket rate | "block the rollout if this moves, even if the north-star climbs" — guardrails are the teeth of the ethics gate, read *next to* the experiment | collecting the guardrail but reading it *after* the fact — it must land on the *same dashboard* as any experiment, which is the next stage's job ([ethics-gate.md](ethics-gate.md)) |

The unifying property: a funnel step, a pain signal, and a guardrail each have a *named consumer and a named action* before a single event is emitted. They pass the one rule on the way in.

---

## What not to track — vanity, excess PII, the optimized north-star

Three classes are costs with no payback — and the third is not merely wasteful but the dangerous one.

- **Vanity metrics no decision hangs on.** Total page views, raw session counts, a "likes" tally read for morale — if no choice changes when the number moves, it is not analytics, it is decoration. The cost is real even when the number feels harmless: every collected event is a column to maintain, a thing in the privacy review, and a future "we can't delete this, someone might be using it." Vanity metrics are pure monitoring debt. **DEFAULT: don't collect.** The rare exception is a vanity-shaped metric that is genuinely a *guardrail in disguise* (a sudden views collapse that would trigger a rollback decision) — but then write the rollback decision down and it stops being vanity.
- **Personal data beyond what a decision needs.** This is *data minimization*, and it is the rule turned toward PII specifically: collect the *minimum* that the decision requires, not the maximum the payload happens to carry. A funnel needs *that a step was completed*, not *who completed it*; a rage-click signal needs *the element and the rate*, not the user's identity. The agent will store the whole event object because it is there; minimization is the deliberate act of keeping only the field the decision named. (This is where the discipline becomes ethics — see the next section.)
- **Engagement/time as the north-star you optimize.** This is the sharp one. You *may* track engagement to **observe** — is it healthy, did it crater, is the product still alive — and that observation can name a real decision (investigate a collapse). What you may **not** do is set engagement/time as the loss function you point the gradient at. The distinction is the whole game: *observe it, never optimize it.* The moment engagement is the number an A/B test is run to grow, you have built exactly the loss function that discovers manipulation — infinite scroll, variable-ratio rewards, removed stopping cues — as a local optimum, with no one designing the dark pattern. Keeping engagement in the observe column here is the upstream move; the gate that enforces "is this the north-star we're optimizing?" is [ethics-gate.md](ethics-gate.md). **The villain is never the engineer who added the event — it is the loss function the number becomes if you let it.**

---

## Data minimization is ethics, not just compliance

It is tempting to file minimization under legal compliance — collect less, fewer breach obligations, GDPR cleaner — and treat it as a checkbox. That framing undersells it and is the framing the agent will adopt if left to. The deeper reason, the one from the Ethics axis, is the asymmetry between builder and user:

> **The relationship is constitutively asymmetric: you know every mechanism, you have time, you run aggregate experiments over millions, so you understand the user's perceptual constants and cognitive weak points better than they understand their own. The user is one person, in real time, who cannot see inside the machine. Every extra data point you hold widens that asymmetry — it is one more thing you know about them that they did not knowingly hand over and cannot see you using.**

So minimization is not *primarily* about breach risk; it is about not accumulating power over someone who cannot see it accumulating. That reframing changes the default. Under "compliance," the question is "is this field allowed?" — and the answer is often yes, so you keep it. Under "ethics," the question is "does a decision *need* this field?" — and if not, holding it is widening an asymmetry for nothing, so you drop it. Same field, opposite outcome, because the lens that decides is different.

This is why the *consent and friction* end of the same theory — symmetric consent flows, honest defaults, the GDPR Art. 7 floor — lives next door in [ethics-gate.md](ethics-gate.md): consent is the mechanism ethics normally uses to license influence, and an engineered consent flow corrodes it. Minimization is the *collection* half of that picture (hold less); the gate owns the *consent and friction* half (ask honestly, default fairly). Keep the boundary clean — this doc reduces what you gather; the gate judges how you ask and what you optimize.

---

## Worked examples — the same flow, disciplined and not

Two flows, each shown as the agent leaves it and as the discipline reshapes it. The transformation is always the same move: **replace "collect the event and its whole payload" with "name the decision, then collect only what that decision needs."**

**Order-status — the funnel, not the engagement number.** A user places an order and tracks it to delivery.

```
# undisciplined — the agent's default
track("order_status_viewed", { userId, email, fullPayload, sessionDuration, scrollDepth })
# north-star pointed at: "increase order-status page engagement"  ← the dangerous one
```
The decision sentence fails three ways: `email` is PII no decision needs; `sessionDuration`/`scrollDepth` are vanity (no choice changes when they move); and *optimizing* status-page engagement is the loss function that will discover "make the status ambiguous so they keep checking" as a local optimum — manipulation no one designed.

```
# disciplined — every event names its decision
track("order_status_step_completed", { step: "shipped", completedAt })
#   → decide: which step of the order→delivery funnel bleeds users, so we fix THAT screen
track("order_status_rage_click", { element: "refresh", rate })
#   → decide: is the status confusing enough to provoke retries — if so, clarify the copy
# engagement: OBSERVED on a health panel (did it crater?), never the optimized north-star
```
The funnel finds the broken step; the pain signal finds the confusing copy; engagement is watched, not chased. No identity, no scroll-depth, no loss function pointed at a person.

**Filtered list — instrument the friction, not the identity.** A user narrows a long list with filters to find one item (a JTBD journey from `bearings`).

```
# undisciplined
track("filter_applied", { userId, allFilterValues, resultsShown, timeOnPage })
```
`userId` + `allFilterValues` is a behavioral profile of one named person, collected because the payload offered it — pure asymmetry-widening with no decision behind the identity. `timeOnPage` is vanity dressed as insight.

```
# disciplined
track("filter_returned_zero_results", { filterCombo: "category+price", count: 0 })
#   → decide: which filter combinations dead-end users, so we fix the empty-state or the data
track("filter_dead_click", { element: "disabled-chip", rate })
#   → decide: are users tapping a control that looks active but isn't — fix the affordance
```
The "zero results" funnel signal names a real decision (fix the dead-end), and it needs the *filter combination*, not *who applied it*. The dead-click signal needs the *element*, not the *identity*. Minimization falls out of asking what the decision needs.

---

## When the call is genuinely unclear

Most events resolve cleanly — name the decision or don't collect. When a candidate is a genuine toss-up (an event you suspect *might* drive a decision later, a field that is borderline-PII, a metric you can't yet tell is observe-or-optimize), use PREDICATE / DEFAULT / FALLBACK rather than collecting silently:

- **PREDICATE:** can you, *today*, complete the decision sentence with a named consumer and a named action — and does the event need this specific PII field to drive it?
- **DEFAULT** when you can't: **don't collect it.** The asymmetry governs the call — *not collecting costs you a metric you might have wanted; collecting costs the user a data point they can't see you holding.* When in doubt, the cheaper error is the one that lands on you. An event with no nameable decision is a finding (delete it), not a maybe.
- **FALLBACK** when you genuinely cannot tell yet whether a metric is observe or optimize: keep it strictly in the **observe** column — put it on a health panel, point no experiment at it, and add it to the ethics-gate review *before* anyone proposes optimizing it. An un-disciplined metric you can't classify is held at observe, never promoted to north-star by default.

The escalation, when the doc can't resolve it, is the suite's: this is a user call (is this honest, does the user need this held), so surface it to the human rather than have the agent decide silently — the full ladder is in [the-membrane.md](the-membrane.md).

---

## How findings route onward

A tracking plan disciplined here is the input to the rest of the stage, and the routing is deliberate:

- **The guardrail metrics you keep here** are read *on the same dashboard as the experiment* by the next stage — that wiring, and the north-star/adversary/reflective-self exam, is [ethics-gate.md](ethics-gate.md). This doc decides *what* the guardrails are and that you collect them; the gate decides whether the launch passes.
- **The always-on health and perception sensors** (error tracking with release correlation, field RUM) are *not* this doc's — a metric whose decision is "page the on-call" or "is the perception contract holding" belongs to [delivery-and-instruments.md](delivery-and-instruments.md). Keep the line clean: that doc owns the non-negotiable health/perception class; this one owns deliberate product analytics.
- **An engagement metric you're tempted to optimize** routes straight to the gate — leaving it in the observe column is the disposition *here*, but the decision "is this our north-star?" is the gate's, and the theory behind the refusal is [the-membrane.md](the-membrane.md)'s Ethics axis.
- **A funnel that reveals a broken flow** routes back into the build — a bleeding step is a perception-contract or state-machine problem, not a telemetry one; the fix lives in the earlier `surface` stages, and `lookout` hands `bulwark` the cross-version performance creep and error clusters as the early-warning system for architectural entropy.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan and the `telemetry-tied-to-decisions` gate this file serves) · [the-membrane.md](the-membrane.md) (the Ethics axis — *why* minimization is ethics and engagement-as-loss-function finds manipulation; the State-synchronization axis — track the single source of truth, not its copies) · [delivery-and-instruments.md](delivery-and-instruments.md) (the previous stage: preview, progressive rollout, and the always-on health/perception sensors this doc does *not* own) · [ethics-gate.md](ethics-gate.md) (the next stage: the pre-launch objective-function gate, guardrails on the same dashboard, consent/friction symmetry, honest defaults) · [../../bearings/references/objective-function.md](../../bearings/references/objective-function.md) (where the JTBD funnels and guardrail set are first declared — telemetry instruments what `bearings` named).

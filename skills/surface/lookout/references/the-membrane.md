# The Membrane — the seven axes, read for the launch gate

This is the heart of `lookout`. The `surface` suite has one root claim: **frontend is the only branch of software engineering whose correctness spec does not live in any document — it lives in a wet human brain.** Frontend is not a layer, it is a *boundary* — two boundaries stacked: on the machine side a network/trust partition (the data lives elsewhere, the client cannot be trusted), and on the human side a **machine/mind partition**. Everything the suite teaches falls on one side of those two lines, and this doc names the seven axes that run across them, each re-aimed for an era where an *agent* writes the code and a human-in-the-loop mostly reviews and lives with the result.

`lookout` is where the suite's ethics stops being philosophy and becomes a launch gate. So this doc is self-contained — it carries all seven axes — but it **leads with, and goes deepest on, the two axes `lookout` is built to enforce: the *ethics* axis and the *mind* axis.** Read it back to [../SKILL.md](../SKILL.md) for the stage order; the engine and discipline live in the sibling references — [delivery-and-instruments.md](delivery-and-instruments.md), [telemetry-discipline.md](telemetry-discipline.md), and [ethics-gate.md](ethics-gate.md). This one names *why the gates read the way they do*: it is opened at the start of the run and re-read at **every GATE**.

The reason this axis-set is load-bearing *here in particular*: the moment the metrics dashboard exists, it starts pulling every decision toward whatever number it shows. The agent feels nothing about that pull. So the conscience cannot be an instinct you trust the agent to have — it must be a **gate**, and these axes are the substance the gate enforces.

---

## PRE-FLIGHT — run this one line before you ship a change or read a dashboard

> **Ask of every metric and every default: "whose interest does this optimizer serve, and would the user endorse the mechanism if they could see it?"** The optimized node here is a *person*. An A/B test is a gradient-descent optimizer; point it at an engagement number over a human nervous system and it will discover manipulation as a local optimum — no one designs the dark pattern, the loss function finds it. The agent will optimize whatever metric it is handed and feel no betrayal of the user's reflective self. So the whole job of this skill is to move the conscience out of "the dashboard went up" and into a declared objective function with declared guardrails and a kill-switch set *before the result is known*. Everything below is a consequence of that.

---

## How each card is built

Every axis is a card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the premise that held when a human felt the cost (of a sync bug, a vague boundary, a betrayed user staring back).
- **WHAT CHANGED IN THE AGENT ERA** — the habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and *gate* instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent wiring delivery or running an experiment on a human's behalf.

Genuinely-ambiguous calls inside a card use the same engine as the rest of the suite: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear).

---

## AXIS — Ethics: the same levers maintain the model and manipulate it; the optimizer finds the seam

> **The spine of `lookout`. If you internalize one card, this one.** Gate: [`objective-function-ethics-gate-passed`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Manipulation was a thing a *bad designer did on purpose* — you could name it, catalogue it (roach motel, confirmshaming, forced continuity), and a conscientious person could simply decline to ship it. Ethics was a review step you bolted on at the end, and "the engineer who wrote the CSS on the Reject-Cookies button" was presumed to have *chosen* to hide it. |
| **WHAT CHANGED IN THE AGENT ERA** | Two things. First, the levers that **maintain** a user's mental model and the levers that **manipulate** it are *the same set of knobs* — lower cognitive load / lower the load of the action *you* want; make the right action obvious / make the action that benefits *you* obvious; honest causal story / false one. There is no clean technical line between good design and a dark pattern, because they use the same dials pointed at different objects — so ethics can never be outsourced to a compliance pass; the harm grows *inside the capability itself*. Second, and decisively: **dark patterns are increasingly not designed, they are optimized into existence.** An A/B test is, mathematically, a gradient-descent optimizer whose loss function is a business metric. Aim that gradient at *maximize engagement*, hand it the whole pre-rational toolkit of the membrane, and **it discovers manipulation on its own** — because under that loss function, manipulation is often the local optimum. This is Goodhart's law executed on a human, the same rhyme as RL misalignment: optimize a proxy hard enough and you get the proxy, not the intent. The agent will run that optimizer faithfully and feel *nothing*. **The real villain is never a person — it is the loss function.** |
| **THE DESIGN CONSEQUENCE** | Ethics is **constitutive, not additive**, and it must be *gated before any metric-driven launch*, because the asymmetry guarantees the user loses the cat-and-mouse game (they see neither the mechanism nor the intent, and aggregate experiments outrun any individual's vigilance — so the fix must sit *upstream, on the builder*). The operational primitive is **friction**: where you put the *easy* and the *hard*, at the points where user and business interests diverge, *is* your ethics. "Accept all" in one click and "Reject" five layers deep is a friction mismatch; sign-up in one click and cancel-by-phone (roach motel) is a friction mismatch. Treat your experiment framework as an **adversary**: if manipulation moves the number, it will find it for you, even if no one in the company wants it to. |
| **DO THIS** | Run the [ethics-gate.md](ethics-gate.md) gate before any A/B test or metric-driven rollout: declare a **unique north-star**; declare **guardrails on the *same dashboard*** (mis-orders, rage-clicks, churn, a11y errors, support tickets — read *beside* the experiment, not after); run the **adversary check** ("what is the cheapest, most manipulative path to move this number, and is it forbidden / blocked by a guardrail?"); run the **reversibility/publicity test** (if the user saw every mechanism and intent, would they still endorse it?); audit **friction symmetry** (GDPR Art. 7 — withdraw consent as easily as you grant it — is the legal *floor*; apply the principle everywhere); and declare the **stop-condition + kill-switch before you have feelings about the result.** Pre-register hypothesis/metrics/stopping-rule — no peeking-until-significant. |

**The sharpest cut — which *self* the interface sides with.** "Mind-side correct" splits in two: serving the user's **impulsive self of this moment** (what good UX does, and what addiction exploits) versus serving the **reflective self the user would endorse** (their longer-range, avowed interest). Good UX and a dark pattern can be *identical* on the impulsive axis and *opposite* on the reflective axis. Infinite scroll removes the natural stopping point because a stopping point is friction, and removing *that* friction serves the machine; variable-ratio rewards (pull-to-refresh is a slot machine's reward schedule); "seen" receipts as social pressure — all operate in the gap between the two selves, **and the interface structurally sides with the impulsive self, because the impulsive self is the one that produces the metric.** This gives manipulation a definition with teeth:

> **UI manipulation = the interface, in the gap between the user's impulsive self and reflective self, choosing the impulsive self's side — because the other self doesn't move the number.**

It also explains why "I agreed to the terms" rings hollow here: consent presupposes a deliberating agent, but this membrane operates *beneath* deliberation and is tuned by aggregate experiment to the user's measured weaknesses — so an engineered consent flow corrodes the very mechanism (informed consent) that ethics normally uses to license influence.

**Decision fork — an experiment ties or washes; which variant ships?**
- **PREDICATE:** does the winning variant move the north-star *only* by siding with the impulsive self over the reflective self (the adversary's cheap path), or does a guardrail flag it?
- **DEFAULT** on a tie or a wash: **ship the least-manipulative variant.** The tiebreaker is the user's reflective interest, not the marginally higher number. Honest defaults follow the same rule — the default is the strongest lever (most users never change it), so it must be the choice the user would *endorse*, not the one that benefits you.
- **FALLBACK** when you cannot yet tell whether the lift is impulsive or reflective: do *not* ship to 100%; hold at a small ramp behind a flag, add the missing guardrail to the dashboard, and re-read. An un-audited engagement lift you cannot explain is a finding, not a win.

> Anti-pattern this card kills: **optimizing engagement/time as the north-star.** That is precisely the loss function that finds manipulation; observe it, never point the gradient at it.

---

## AXIS — Mind: the spec lives in a nervous system, so RUM is psychophysics encoded as numbers

> The second spine of `lookout`. Gate: [`health-and-perception-instrumented`](#gate-map) — and it underwrites the whole [PRE-FLIGHT](#pre-flight--run-this-one-line-before-you-ship-a-change-or-read-a-dashboard).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Correctness could be checked against a *formal spec* — the compiler against a language standard, the database against ACID, a protocol against an RFC. "Fast enough" was an SLA you negotiated. A developer trusted their lab: it ran, it felt snappy on the dev machine, ship it. |
| **WHAT CHANGED IN THE AGENT ERA** | Frontend has no formal spec — its ground truth is a **human perceptual-cognitive system whose "spec" is written in neurophysiology, not documents**, and that spec has *hard constants*: the ~16ms frame budget is the flicker-fusion threshold, not an engineering preference; Nielsen's three latency gates — **100ms** (feels instantaneous, "I operated it directly"), **1s** (train of thought unbroken but you notice the system working), **10s** (attention lost) — are psychophysical constants, not SLAs. "Perceived performance ≠ actual performance" holds *because the instrument measuring it is a brain*: a steady 100ms beats a jittery 50ms. The agent cannot feel any of this — it has no nervous system to be the ground truth — and it will trust the **lab over the field**: the lab is a fast machine on a fast network, real users are mid-range phones on 4G, and **the field data is the truth.** You cannot write a unit test for "feels responsive," which is exactly why taste is load-bearing here and is not in a compiler. |
| **THE DESIGN CONSEQUENCE** | The field is instrumented as a **non-negotiable, always-on sensor**, and the chosen metrics are read *as the closest numeric proxy to "does it feel right."* **Core Web Vitals — LCP, INP, CLS — are psychophysics encoded as numbers** (INP measures interaction latency against the perceptual threshold; CLS measures the betrayal of a layout that moves under the user's hand). They are measured on **real users (field)**, segmented by device/network/route so a regression localizes to a *population* instead of hiding in an average. Error tracking is the other always-on sensor: every uncaught and deliberately-logged error with enough context to reproduce (user action, route, **release version**), source maps uploaded so stacks are real, **correlated with release** so "errors spiked in version X" is visible. |
| **DO THIS** | Wire field RUM (a Web-Vitals-class library reporting from real sessions, not just a lab Lighthouse run) and release-correlated error tracking (a Sentry-class tool) *as part of shipping* — see [delivery-and-instruments.md](delivery-and-instruments.md). Segment error-rate and slow-interaction-rate by device/network/route. Treat a field Web Vital outside its perceptual budget as a defect against the spec, even when the lab is green. |

> Anti-pattern this card kills: **lab metrics only.** Your fast machine lies; the spec lives in the user's nervous system, and only the field measures it.

---

## AXIS — State-synchronization: complexity is copies of one truth

> Background axis for `lookout` (it shapes *what is worth observing*). Owned and gated upstream in the suite; here it is the lens for telemetry, not a gate of its own.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A developer felt the pain of a "it desynced" bug at 3 a.m. and learned to minimize the source of truth — derive everything else, never store a derived value, model state so illegal combinations cannot be expressed (a tagged union, not three loose booleans). |
| **WHAT CHANGED IN THE AGENT ERA** | The agent stores derived state, copies a server value into a local one, and emits the implicit state machine of loose booleans without friction — and *for observability* it will instrument those rotting copies as if they were truth. The deepest lever: push correctness from runtime caution into structural constraint, and the agent feels no pull to do it. |
| **THE DESIGN CONSEQUENCE** | Observe the **single source of truth**, not its copies. The critical-path funnels you track are about *finding desync and friction in the real flow*, not about decorating duplicated state. |
| **DO THIS** | When you choose what to track, track the truth's journey (completion per step of a real JTBD funnel), not a derived count that some component happened to store. |

---

## AXIS — Identity: declarative UI leaks at "which node is which across time"

> Background axis. Relevant to `lookout` only as a *source of field bugs* — list-key identity errors surface as error clusters and CLS, which is what you instrument for.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | `UI = f(state)` looks clean, but the old DOM cannot be thrown away each render (focus, cursor, scroll, animation live in it), so the framework must answer *which new node is which old node* — a graph-matching problem it solves by a `same position + same type` heuristic, and `key` is where that abstraction leaks. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent reaches for array-index keys and other identity shortcuts without unease; the bug shows up downstream as DOM state landing on the wrong data — exactly the kind of thing that surfaces in the field as a spike of errors or a layout shift, not in the lab. |
| **THE DESIGN CONSEQUENCE** | Identity bugs are caught by the **field instruments**, because they cluster in lists and are invisible to a lab pass. |
| **DO THIS** | When error/CLS metrics cluster on a list view, suspect an identity (key) error before a logic error. |

---

## AXIS — The two graphs: the component tree is not the data-dependency graph

> Background axis. For `lookout`, it explains *where to read a metric*: a regression that hides in an average is the two graphs drifting.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The component tree is shaped for visual nesting; the data-dependency graph is an arbitrary DAG. State management exists *only because the two shapes disagree* — every store/context/signal is a side-channel that lets data flow along dependency lines instead of tree lines. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent lets the two graphs drift as features pile up, and reads an *aggregate* metric that averages two diverged populations into one comforting number. |
| **THE DESIGN CONSEQUENCE** | **Segment the metrics** so the two graphs cannot hide in an average — a regression localizes to a device/network/route population. |
| **DO THIS** | Never read only the aggregate; segment by the dimensions where the populations actually differ. |

---

## AXIS — Scope: every CSS methodology is a disguised scoping strategy

> Background axis. Lowest-relevance for `lookout`; included for completeness.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | CSS is one global namespace resolved by specificity and cascade — "spooky action at a distance" the rest of programming solved with lexical scope decades ago; every methodology (BEM, CSS Modules, CSS-in-JS, atomic) is a way to *buy back scope*. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent picks a styling approach by fashion, not as a scoping decision, and a style regression slips out as a *visual* defect a behavioral test won't catch. |
| **THE DESIGN CONSEQUENCE** | Visual regressions need their own field/CI signal (screenshot diff), because they are invisible to functional metrics. |
| **DO THIS** | Treat unexplained visual drift as a defect; route it to a visual-regression check, not to RUM. |

---

## AXIS — Medium: the web is a document platform we build applications on

> Background axis for `lookout`. The SPA↔SSR↔RSC pendulum is impedance mismatch oscillating; for delivery it explains *why preview-per-PR is high-leverage* — the running thing is the only place the medium's seams show.

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The web platform was built for linked *documents*; we build *applications* on it. Routing, the back button, scroll restoration, URL-as-state, "page" vs "view" — every friction is the document medium squeezing an application out of shape. Choosing an architecture is choosing *which free platform capabilities you keep and which you rebuild by hand* (usually worse). |
| **WHAT CHANGED IN THE AGENT ERA** | The agent treats *launch as the end*: it ships, the task turns green, and it never wires the loop back to reality — no preview to judge perception by eye, no field instrument — so the team flies blind exactly where the spec lives. |
| **THE DESIGN CONSEQUENCE** | **Shipping is not the finish line, it is the start of the conversation with reality.** A **preview deploy per PR** is high-leverage because the perception contract can only be judged *by eye* — reviewers review the running thing, not the diff — and **progressive rollout / feature flags** decouple deploy from release so a flag rolls back in seconds, faster than a redeploy. |
| **DO THIS** | Give every PR a clickable preview URL; ramp 1% → 10% → 100% behind a flag; keep the kill-switch faster than a redeploy. Ship small, ship often, roll back fast — see [delivery-and-instruments.md](delivery-and-instruments.md). |

---

## GATE MAP

*Each axis mapped to the exact `.checklist.yml` check it governs in `lookout`. All four lookout checks appear; the checks are the contract, the axes are why the contract reads the way it does.*

| Stage | Check ID | Primary axis / axes | What it enforces, agent-era framing |
|---|---|---|---|
| preview | `preview-and-progressive-rollout-set` | **Medium** | Preview deploy per PR (perception judged by eye) + progressive rollout / feature flags (deploy decoupled from release, flag rollback in seconds) — because the agent treats launch as the end and never wires the loop back to the medium where the spec lives. |
| instrument | `health-and-perception-instrumented` | **Mind** (with Identity/Two-graphs as field-bug sources) | Release-correlated error tracking + **field** RUM (LCP/INP/CLS as psychophysics-encoded numbers), segmented by device/network/route — because the agent trusts the lab over the field and cannot feel the nervous-system spec the metrics proxy. |
| telemetry | `telemetry-tied-to-decisions` | **Ethics** (data minimization) + **State-synchronization** (what's worth tracking) | Every event names the decision it drives; track the JTBD funnels / pain signals / guardrails, *not* vanity metrics or excess PII (minimization is ethics — every extra data point widens the asymmetry), and never set engagement as the optimized north-star — because the agent collects everything for free and will optimize whatever it's handed. |
| conscience | `objective-function-ethics-gate-passed` | **Ethics** (the impulsive-vs-reflective self; friction; A/B as gradient descent) | The pre-launch objective-function gate: unique north-star, guardrails on the same dashboard, adversary check, reflective-self check, reversibility/publicity, friction symmetry (GDPR Art. 7 floor), stop-condition + kill-switch before the result — because the agent feels no betrayal of the user's reflective self and the optimizer finds manipulation as a local optimum. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve it — is this metric honest, is this default serving the user, is this engagement lift impulsive or reflective — climb one rung at a time rather than shipping silently:

```
read the metric against its declared guardrail on the SAME dashboard — did a guardrail move? if yes, the gate has already answered: hold.
   → run the adversary check out loud: "what is the cheapest, most manipulative path to this number, and is this it?"
      → run the reversibility/publicity test: if the user saw every mechanism and intent, would they endorse this exact version?
         → ask the user (the human operator) the one question the optimizer cannot settle — they own the trade-off the metric can't:
           is this north-star the right thing to move; does this default serve the user or exploit them; is this lift one we
           accept (the reflective-self call and the "ship the least-manipulative variant" tiebreaker bottom out here)
            → if still unresolved, DEFAULT to the user's reflective interest: ship the least-manipulative variant, keep the
              kill-switch armed, and record the residual as a launch note for the operator.
```

The asymmetry that governs the ladder: **a cautious metric call costs the business a little lift or a slower ramp; a manipulative one costs the user — who can see neither the mechanism nor the intent, and whom the aggregate optimizer outruns — their agency, at scale, for as long as the pattern ships.** When the call is a genuine toss-up, err toward the reflective self, the symmetric friction, and the kill-switch. See [ethics-gate.md](ethics-gate.md) for the full gate and [telemetry-discipline.md](telemetry-discipline.md) for the track/don't-track rule, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

---

## The suite thesis

Frontend is the one branch of software whose correctness spec does not live in a document but in a human nervous system — so **taste is load-bearing and cannot be outsourced.** That is not because frontend engineers are more sentimental; it is because part of the ground truth is, structurally, *not in the machine* and cannot be captured by a formal check. As the agent writes more and more of the code, the keyboard work is commoditized and devalues, and what *rises* in value is exactly the work on this membrane — the judgment the optimizer cannot supply. The leverage migrates from the keyboard to the membrane between machine and mind. The master stops asking "how do I write this code?" and asks, at every real decision point:

> **which boundary is this — one-way door or two? whose source of truth is this state? what causal story will form in the user's head this time? and my optimizer — whose interest does it actually serve?**

`lookout` exists to make the last of those a *gate* rather than a hope — because the agent will run the optimizer faithfully and feel nothing, and the real villain is never a person. It is the loss function. Choose it, guard it, and give it a kill-switch.

# The Objective Function — the compass set before the dashboard exists

This is the depth behind **STAGE 4 — Compass** of the [../SKILL.md](../SKILL.md) flight plan, the final and most uncomfortable stage of `bearings`. It governs the two checks that close the run: **`north-star-and-guardrails-set`** (one metric you steer by, 2–3 you will never let worsen, and the publicity test installed as a standing rule) and **`objective-function-premortem-done`** (the gradient-descent adversary played against your own metric, the cheapest manipulative path written down and forbidden). It owns the *executable* gate — the artifact you produce and the procedure that produces it. The *why* — the full ethics theory — lives one door over in [the-membrane.md](the-membrane.md)'s **AXIS 7 (ethics)**; the *launch-time* version of this same gate, run when the dashboard is actually wired, is `lookout`'s [ethics-gate.md](../../lookout/references/ethics-gate.md). Read those for the philosophy and the post-ship exam; read this for what you write down, on paper, *before there is any metric to chase*.

The governing fact, the reason this stage is gated at all and not left to conscience:

> **A metric is a means, not an end — and an objective function pointed at a human nervous system will discover manipulation as a local optimum, with no one having designed it.** The same membrane that *maintains* a user's mental model is the one that *manipulates* it (same levers, objective function flipped — see [the-membrane.md](the-membrane.md) AXIS 7). So the only defense that works is upstream: declare what you optimize and what you refuse *before the dashboard exists to pull you*, because the moment it exists, every later decision bends toward the number.

## Contents

- [The map — one charter, three artifacts, two checks](#the-map--one-charter-three-artifacts-two-checks)
- [The agent-era failure mode this gate counters](#the-agent-era-failure-mode-this-gate-counters)
- [Artifact 1 — the north-star and its guardrails](#artifact-1--the-north-star-and-its-guardrails)
- [Artifact 2 — the gradient-descent pre-mortem](#artifact-2--the-gradient-descent-pre-mortem)
- [Artifact 3 — the three standing tests (ethics as a checklist)](#artifact-3--the-three-standing-tests-ethics-as-a-checklist)
- [The reflective-vs-impulsive-self cut](#the-reflective-vs-impulsive-self-cut)
- [Worked example — the order-status feed](#worked-example--the-order-status-feed)
- [When the call is genuinely unclear](#when-the-call-is-genuinely-unclear)
- [How findings route onward](#how-findings-route-onward)

---

## The map — one charter, three artifacts, two checks

The whole stage produces **one page** — the objective-function charter — that the rest of the build (and `lookout`'s launch gate) honors. It has three parts, and the two checks fall across them:

| # | Artifact | What it pins | Check |
|---|---|---|---|
| **1** | North-star + guardrails | the *one* metric you steer by, and the 2–3 you will never let worsen even if it climbs | `north-star-and-guardrails-set` |
| **2** | Gradient-descent pre-mortem | the cheapest, most manipulative path *to your own metric* — written down so it can be forbidden | `objective-function-premortem-done` |
| **3** | The three standing tests | reversibility/publicity, friction symmetry, reflective-self — installed as rules, not run once | `north-star-and-guardrails-set` (the publicity test) + `objective-function-premortem-done` (the rest) |

The artifact is small on purpose. A new engineer should be able to read one page and answer: *what is this product optimizing, and what is it refusing to do to get there?* If that takes more than a page to explain, the charter isn't pinned — it's still in someone's head, which is exactly where the optimizer will route around it.

---

## The agent-era failure mode this gate counters

In the human era the author of a metric felt a flicker of unease setting one — they knew "engagement up" could mean "users can't stop," and they felt the duty to set the guardrails *before* the dashboard existed to pull them. The agent feels none of that, in two distinct ways, and the gate exists to backstop both:

- **The agent never sets an objective function at all.** It has no metric to serve and none to refuse, so left alone it ships with no north-star, no guardrails, no adversary pre-mortem — the conscience is simply absent, not weak. There is nothing to route around because nothing was declared. **This is why the charter must be a produced artifact, gated, not a hoped-for instinct.**
- **The moment a dashboard exists, the optimizer is the agent.** An A/B framework — or an LLM tuning copy per user — *is* a gradient-descent optimizer whose loss function is whatever metric you handed it. Point it at a human nervous system and it finds the manipulative local optimum faster, and more personalized, than any human researcher could, with no one having sat down to design a dark pattern (Goodhart's law on people; the same shape as AI misalignment). Worse, the modern version leaves **no fixed, screenshot-able artifact to critique** — the dark pattern is generated live, per user, per moment, so the old transparency defense ("the source is public, a researcher can catalog it") collapses. **This is why the defense has to be upstream, on the builder, before the optimizer runs — user vigilance cannot backstop it, because the asymmetry guarantees the user loses the cat-and-mouse game.**

So the gate is the substitute for the unease the agent doesn't feel: it forces the four questions the optimizer will otherwise answer for you, silently, in whatever direction the metric rewards.

---

## Artifact 1 — the north-star and its guardrails

**Declare exactly one north-star.** It is the single metric this product (or this change) is meant to move — and it must be tied to the user's *job done*, the `so that` of the JTBD from the Chart stage, not to a proxy for time spent. The discipline is the count: *one*. Two north-stars is no north-star — the moment they conflict, whichever is easier to move wins, and "easier to move" almost always means "the one the optimizer can game."

> **Never set engagement / time-on-site / scroll-depth as the north-star you optimize.** You may *observe* it (is it healthy?), but pointing the gradient at it is pointing the optimizer at exactly the loss function that finds infinite scroll, variable-ratio rewards, and removed stopping cues — because those genuinely move that number. The north-star is the outcome the user came for; engagement is a thing you watch, never a thing you steer by.

**Declare 2–3 guardrails — the teeth of the ethics.** A guardrail is a metric you will **never let worsen even if the north-star climbs.** It is not a secondary goal; it is a veto. Pick metrics that go *bad* exactly along the cheapest manipulative paths to your north-star — they are the trip-wires the pre-mortem (Artifact 2) tells you where to lay.

| If the north-star is… | A manipulative path to it looks like… | So the guardrails are… |
|---|---|---|
| task-completion rate | confirm-shame, misleading defaults, hiding the exit | mis-order / wrong-action rate, rage-clicks, refund/complaint rate — none may rise |
| checkout conversion | pre-checked add-ons, a buried "no thanks", a roach-motel cancel | churn / unsubscribe rate, support-ticket rate, a11y errors — none may rise |
| sign-up completion | a three-screen value-wall, dark-pattern consent | first-week retention, consent-withdrawal friction — must stay symmetric |

The default count is **2–3**. Fewer than two and you have a goal with no veto; more than three and the guardrails stop being trip-wires you actually watch and become a wish-list no one reads. If you can't name a metric that worsens along the manipulative path, that is a signal the pre-mortem isn't done — go back and run it.

**Install the reversibility / publicity test here, as a standing rule** (it is one of the three tests in Artifact 3, but it belongs to *this* check because it is what makes the guardrails honest): *if the asymmetry were erased — the user could see every mechanism, every A/B graveyard, your true intent — would they still endorse this design?* Or, Rawls-style: design it as if you don't know whether you are the one setting the test or the tired person answering it at 3 a.m. — would you sign this version?

---

## Artifact 2 — the gradient-descent pre-mortem

This is the executable heart of the second check, and the cheapest insurance in the whole stage. **Ten minutes playing the adversary here is set against a half-year of "the metric went up but users are angry."**

**The procedure — play the optimizer against yourself, in four steps:**

1. **Become the gradient-descent optimizer.** Drop the designer's intent. Your only goal is to make the north-star number go up, by any means the interface allows. You have unlimited A/B tests and no conscience.
2. **Ask the one question:** *"To push this north-star up, what is the cheapest, most manipulative path?"* Be concrete and ruthless — name the specific dark pattern (the pre-checked box, the grayed-out decline, the variable-ratio refresh, the removed stopping cue, the confirm-shame copy), not the category.
3. **Write each path down.** This list *is* the deliverable. An undeclared manipulative path is one the live optimizer will find for you; a written one is a thing you can forbid.
4. **For each path, do two things:** (a) **forbid it by rule** — a line in the charter that says "we will not do X," and (b) **block it with a guardrail** — confirm that the metric that worsens along that path is in your guardrail set; if it isn't, add it. A path with no guardrail watching it is a forbiddance with no enforcement.

The output is a short table you keep in the charter:

| Manipulative path (the optimizer's local optimum) | Forbidden by rule | Blocked by guardrail |
|---|---|---|
| pre-check the upsell add-on to lift cart value | yes — opt-in only, never opt-out | refund-rate, complaint-rate must not rise |
| auto-advance an infinite feed to lift session time | yes — keep natural stopping cues | (engagement is *observed*, never the north-star) |

The reason this works: the live optimizer is amoral but not creative in a way you can't anticipate — the manipulative local optima of a given metric are *knowable in advance* by anyone willing to think like the adversary for ten minutes. You are pre-registering the traps so the guardrails are laid before the optimizer ever walks the path.

---

## Artifact 3 — the three standing tests (ethics as a checklist)

The pre-mortem finds the specific traps; these three tests are the *general* lenses you install as standing rules, so a new manipulative path that wasn't in the pre-mortem still gets caught. Each turns a piece of ethics theory (from [the-membrane.md](the-membrane.md) AXIS 7) into a yes/no question you can put to any design decision.

| Test | The question | What a failure means |
|---|---|---|
| **Reversibility / publicity** | If the asymmetry were erased — the user saw every mechanism and your true intent — would they still endorse this? | the design depends on the user *not* understanding it — that dependence is the tell of manipulation |
| **Friction symmetry** | At every fork where user-interest and business-interest diverge, where did I put the friction — and whom does that ease/difficulty serve? | friction pressed onto the user's side of the fork (one-click subscribe, five-screen cancel) is the moral primitive of a dark pattern. GDPR Art. 7 — *withdrawing consent must be as easy as giving it* — is the legal floor; apply the principle everywhere, not just consent flows. |
| **Reflective-self** | Is this optimizing the user's *impulsive* self (the one that moves the metric) and betraying the *reflective* self (the one they'd endorse afterward)? | if the metric only moves by siding with the impulsive self, stop — see the cut below |

**Friction is the moral material of frontend.** Good design makes "easy" align with the user's goal; manipulation makes "easy" align with the builder's goal, precisely at the fork where they diverge. So the friction audit is the most operational of the three: walk every place your design makes something easier or harder, find the ones at a user-vs-business fork, and name whom the asymmetry serves. Where it serves the business at the user's expense, that is your ethics being decided — make the call deliberately, not by the optimizer's default.

---

## The reflective-vs-impulsive-self cut

This is the sharpest, most teeth-bearing distinction in the whole stage, because it survives the strongest objection — *"all design influences the user; isn't the line between influence and manipulation arbitrary?"* It is not, and here is why: the line is not drawn at *influence vs none* (that genuinely can't be drawn), but at **calling the user's agency vs bypassing it**, and at **what the user would endorse on reflection vs what they wouldn't.**

> **UI manipulation = the interface, standing in the gap between the user's impulsive self and reflective self, choosing the impulsive self's side — because that is the self that produces the metric.**

- **Serving the impulsive self:** removing the natural stopping point (infinite scroll), the variable-ratio reward (the pull-to-refresh slot machine), turning "seen" into social pressure. These work *because* they exploit the gap — and the interface structurally takes the impulsive side, because the impulsive self is the one that moves the number.
- **Serving the reflective self:** giving real reasons that leave the user's judgment intact, providing stopping cues, making consequential actions *appropriately effortful*. Here friction is not an obstacle — it is **care**: the deliberate effort that lets the reflective self catch up to the impulsive one.

The rule that follows: **design for the self the user wants to be — the one they'd endorse afterward — not the one that moves the metric this second.** When you can't tell whether a nudge *calls* agency or *bypasses* it, treat it as bypassing and reject it (the burden of proof is on the nudge). And note why "I agreed to the terms" rings hollow as a defense: consent presupposes the consenter understood and deliberated, but this membrane operates *beneath* deliberation and is tuned by aggregate experiments to the user's specific weaknesses — so a consent flow engineered to produce consent has hollowed out the very mechanism ethics uses elsewhere to license influence.

---

## Worked example — the order-status feed

A concrete traversal, the kind the gate is meant to force. The product: a "where's my order" status page in a shop.

- **North-star.** The naive pick is *time-on-page* or *visits-per-order* — both reward anxiety, the user refreshing because they're worried. The disciplined pick ties to the job: **"the user knows their order's true status in one glance, and doesn't need to come back."** A *falling* visits-per-order is success here, not failure. (Contrast a filtered-list view where the optimizer's temptation is to bury the "clear filters" exit to keep the user in the funnel — same shape, different surface.)
- **Guardrails.** From the pre-mortem below: support-ticket rate per order (a confused user calls), rage-clicks on the refresh control, and complaint/refund rate. None may rise even if the north-star metric improves.
- **Pre-mortem.** Become the optimizer aimed at "engagement on the status page" (the *wrong* north-star, deliberately, to see what it would do): the cheapest path is to make the status *vague and animated* — a perpetual "your order is on its way!" with a moving truck — so the user keeps checking. That moves engagement and *betrays the reflective self* (who wants the truth and to leave). Written down, forbidden by rule ("status must show the real state, including 'delayed' and 'we don't know yet'"), blocked by guardrail (support-ticket rate would rise as confused users call in).
- **Standing tests.** *Publicity:* if the user saw that the truck animation was a retention device with no real position data behind it, would they endorse it? No — fail. *Friction symmetry:* is the "contact support" path as easy as the "keep waiting" path? *Reflective-self:* the design that wins is the one that tells the honest causal story and lets the user leave satisfied — the impulsive-self design keeps them anxiously refreshing.

The charter for this feature is now one page, and the live optimizer that `lookout` will eventually wire has its traps already laid.

---

## When the call is genuinely unclear

Most of this stage is judgment, and some calls won't resolve from the tests alone. Use **PREDICATE / DEFAULT / FALLBACK**, climbing the [the-membrane.md escalation ladder](the-membrane.md#escalation-ladder--when-the-call-is-unclear) when it doesn't:

- **PREDICATE:** Does this design call the user's agency (give a real reason, leave their judgment intact) or *bypass* it (a default, a pre-attentive nudge, a confirm-shame, a friction mismatch)? Would the user endorse it with the asymmetry erased?
- **DEFAULT** on a coin-flip: **side with the reflective self.** Make consequential actions appropriately effortful, keep stopping cues, hold the friction symmetric (cancelling as easy as subscribing). When you can't tell whether a nudge calls or bypasses agency, treat it as bypassing and reject it.
- **FALLBACK** when you genuinely can't tell whose interest a default serves: that is a trade-off the **user's product owner** owns, not the agent — surface it as *one sharp question* ("the default here decides whether most users ever change it; should it favor the user's reflective interest or the conversion number?") rather than letting the optimizer settle it silently.

The asymmetry that governs every toss-up: an over-cautious charter costs you a little metric growth and a moment of "too honest"; a missing one costs the user their agency for the life of the product, and costs you the half-year of "the number went up but they're angry." When in doubt, set the north-star to the user's job, lay the guardrail, and side with the self they'd thank you for.

---

## How findings route onward

The charter is stage-0's last artifact, and it is not the end of the ethics — it is the contract the later stages and the launch gate enforce:

- **`lookout`'s [ethics-gate.md](../../lookout/references/ethics-gate.md)** is this charter coming back for its exam. The pre-mortem you ran on paper becomes the *launch-version* adversary check; the guardrails you declared get wired onto the same dashboard as the experiment readout (read *next to* it, not after); and the launch gate adds the operational teeth this stage can't — pre-registered stop-conditions and an automatic kill-switch declared *before* anyone has feelings about the result. If you set no charter here, there is nothing for that gate to enforce.
- **[the-membrane.md](the-membrane.md) AXIS 7 (ethics)** is the *why* behind every test above — the asymmetry that breeds the duty, friction as the moral primitive, manipulation-as-bypassing-agency, the optimizer-as-adversary. Re-read it at this GATE before you certify the stage; the [GATE MAP](the-membrane.md#gate-map) confirms AXIS 7 backs both compass checks.
- **The hot paths** ([decision-tree.md](decision-tree.md) TREE 1) are where the guardrails bite hardest — a manipulative optimum on a hot path touches every user, so the pre-mortem's attention belongs there first.
- **The engineering suite's `aegis`/`gungnir`** own *security* threat-modeling and *adversarial testing of systems you own*; this gate is the *ethics* threat-model of the optimizer aimed at the user — a different adversary (your own metric, not an attacker), named here so the boundary is clear and not duplicated.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 7 — the full ethics theory this gate operationalizes; the escalation ladder; the GATE MAP) · [decision-tree.md](decision-tree.md) (the hot-vs-cold cut that tells you where the guardrails bite hardest) · [../../lookout/references/ethics-gate.md](../../lookout/references/ethics-gate.md) (the launch-time version of this same gate — adversary check, guardrails on the dashboard, stop-condition + kill-switch) · [../SKILL.md](../SKILL.md) (the five-stage flight plan this reference serves; STAGE 4 — Compass).

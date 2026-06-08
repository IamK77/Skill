# Technical Debt

This reference is the depth behind **STAGE 1 — Debt** of the [../SKILL.md](../SKILL.md) flight plan, the stage that decides whether a system stays cheap to change or quietly ossifies. It governs two bound-together moves: making debt **visible and budgeted** so it stops compounding in the dark, and **refusing the impulsive rewrite** so years of hard-won edge-case knowledge are not thrown away in a fit of distaste. In the human era both rested on a feeling — the maintainer felt the slow drag of debt every time they touched the messy area, and felt the cost of a rewrite viscerally because they had to type all the new code by hand and remembered the last rewrite that overran. The agent era removes both feelings: the agent banks debt it doesn't recognize as debt and pays no interest it can feel, and it can generate a plausible replacement fast while feeling none of the loss. Read [agent-era-shifts.md](agent-era-shifts.md) for *why* these shift — **SHIFT 3** (the agent banks debt with no ledger) and **SHIFT 2** (the agent reaches for the rewrite) are the two cards behind this whole file. Come here for *how* to enforce them. The per-quadrant debt response and the refactor-vs-rewrite fork live in [decision-tree.md](decision-tree.md) and are not duplicated here; this file is the depth on *running* the register and *holding the line* against the rewrite. The mechanics of paying debt down safely — behavior-preserving steps under a test net — are in [refactoring.md](refactoring.md).

Every fork below states three things so two agents managing the same system reach the same plan:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact, inherited from [decision-tree.md](decision-tree.md), overrides every DEFAULT and FALLBACK here:

> **Software is read and changed far more than it is written — optimize for the next change, not this one.** Debt is precisely a charge against the *next* change, and the agent — optimizing the change in front of it, feeling none of the future cost — will book the loan as a win and never the interest as a loss. Everything in this file exists to move that interest from a thing felt to a thing measured.

---

## The debt metaphor, taken literally

The metaphor is not decoration; it is a financial model you should run literally, because every word of it has a maintenance meaning.

- **Principal** is the rough code itself — the shortcut, the copy-paste, the missing abstraction, the skipped test, the hard-coded value, the module that does six things. It is what you "borrowed" to ship faster *now*.
- **Interest** is what the principal charges on *every later change* in or near that code: the change is slower (you have to understand the mess first), harder (the mess fights you), and riskier (the mess hides the regression). You pay it every single time, forever, until you repay the principal.
- **Repayment** is refactoring the principal away (STAGE 2) so the interest stops.

The critical, counter-intuitive consequence: **the interest is the real cost, not the principal.** Taking the shortcut once is cheap. Paying interest on it for two years across forty changes is what bankrupts a codebase's changeability. A small piece of ugly code touched once a year charges trivial interest and may never be worth repaying; a small piece of ugly code on the hottest path in the system charges interest on every commit and is an emergency. **Debt's cost is a function of its principal × how often you touch it**, which is why you rank paydown by interest, not by how ugly the code looks (see [the register](#making-debt-visible-and-quantified)).

And like real debt, it **compounds**. Debt makes the next change harder, the harder change is more likely to be done as another shortcut (now under time pressure created by the first shortcut), and that shortcut is more debt. Left alone, a codebase doesn't accumulate debt linearly — it accelerates toward the state where every change is terrifying and slow, and no one can safely touch anything. That end state is *ossification*, and it is what STAGE 1 exists to prevent.

> **The agent angle (SHIFT 3).** A human maintainer pays interest in felt friction — the annoying, slow change is a standing reminder the debt is there. The agent re-reads everything from scratch every session, so the "slow, annoying next change" is *just as cheap for it to attempt* as a clean one would have been; it feels no interest at all. The drag that kept a human honest does not exist. The interest is still being charged — it lands on the humans, on the reviewers, on every session's blast radius, on the day a change finally can't be made safely — but the agent that incurs it registers nothing. So the interest must be **written down**, because the maintainer no longer feels it.

---

## Fowler's quadrant — why one corner is legitimate and one is fatal

Not all debt is bad. Fowler splits debt on two independent axes — was it **deliberate** or **inadvertent**, and was it **prudent** or **reckless** — giving four quadrants that demand four different responses. The per-quadrant *response* (log it / repay soon / refactor-on-revisit / make-visible-first) is the **debt-quadrant router in [decision-tree.md](decision-tree.md)**; route the actual decision there. What follows is *why* the corners differ and which one the agent lives in.

| | **Prudent** | **Reckless** |
|---|---|---|
| **Deliberate** | "We must ship now and clean this up next sprint." A *reasoned, logged* trade-off with repayment intended. **Legitimate engineering.** | "We don't have time for design." Known corner-cutting with no plan to repay — a habit that ossifies the system fast. |
| **Inadvertent** | "Now we see how we should have built it." Debt revealed by learning; refactor toward the better design as you revisit. | "What's layering?" Debt incurred with *no awareness at all*. **The fatal corner — and the agent's home address.** |

Two things make this quadrant the most important idea in the stage:

**Deliberate-and-prudent debt is a tool, not a sin.** The goal is *not* zero debt. Knowingly taking a clean, logged shortcut to hit a real deadline — with the trade-off stated and the repayment scheduled — is a legitimate, often correct, engineering choice. A team that refuses *all* debt ships too slowly to survive. What makes this quadrant safe is precisely the two qualities the agent lacks: it is *acknowledged* (someone chose it on purpose) and *bounded* (the repayment is on the books). Debt you chose, named, and scheduled is managed risk.

**Inadvertent-and-reckless debt is fatal because the team doesn't know it's borrowing.** You cannot pay down, schedule, or even discuss a loan no one recorded. It compounds silently until the interest is the whole budget. And this is **the agent's default corner**: it takes the cheapest path to a green result, banking shortcuts it does not recognize *as* shortcuts, with no awareness of the design rule it just violated and no instinct to log what it doesn't perceive. The only-add-never-clean reflex seen across the suite (the flag graveyard, the test graveyard) is this corner in motion. The entire job of the [register](#making-debt-visible-and-quantified) is to drag debt *out* of the inadvertent-reckless corner and into the deliberate-prudent one — not by preventing every shortcut, but by forcing every shortcut to be *named*. An un-logged shortcut **is** the reckless-inadvertent quadrant, by definition, whatever the intent behind it.

- **PREDICATE:** is this debt *acknowledged* (someone chose and logged it) and was it *prudent* (a reasoned trade-off you can state)?
- **DEFAULT** on a coin-flip about taking on a shortcut: take **deliberate-prudent** debt only — stateable trade-off, logged, repayment intended — and never the reckless kinds. If you cannot state the trade-off and write it down, you are not choosing debt, you are hiding it; don't borrow.
- **FALLBACK** when you find debt of unknown origin (the common AUDIT finding — most of a legacy system's debt is inadvertent): do not try to classify intent that no longer exists. Make it **visible first** (register it, quantify its interest), then prioritize paydown by interest. You cannot manage what isn't logged.

---

## Making debt visible and quantified

The register is the mechanism that supplies the awareness the agent does not have. Without it, "we track our debt" is the `named-only` status from [decision-tree.md](decision-tree.md) — the most dangerous status there is, because it looks like safety and is none.

### The debt register

Keep a single, durable, *in-repo* list of known debt — a `DEBT.md`, a label/component in the issue tracker, ADR-style notes, whatever the team already reads. In-repo and agent-readable matters: for a stateless agent the register is the *only* memory that the debt exists at all. Each item records enough to rank and repay it, not an essay:

| Field | What it captures | Why it's load-bearing |
|---|---|---|
| **What & where** | the shortcut and the file(s)/module it lives in | so the next session can find it without re-discovering it |
| **Why it was taken** | the deadline/trade-off (or "inadvertent — found in audit") | distinguishes deliberate-prudent from reckless; preserves the reasoning |
| **Interest** | how much it slows / endangers change, and *how often that area is touched* | the ranking key — this is the whole point of the entry |
| **Repayment sketch** | the refactor that would clear it, roughly | turns "someday" into a scoped, schedulable task |
| **Date logged** | when it entered the register | so silently-aging debt is visible as aging |

The discipline that makes the register real: **when you take a deliberate shortcut, log it in the same change that incurs it** — not later, not "when I have time," which is the same never that kills paydown. In review, **name the debt a change incurs out loud**; a reviewer (or an agent reviewing a diff) who spots an unlogged shortcut should treat the missing register entry as the defect, because that omission is exactly what sends the item into the fatal quadrant.

### Estimating an item's interest

You are estimating the *recurring cost the principal imposes on future change*, not the effort to fix it. A workable estimate multiplies two things:

- **Drag per change** — how much slower, harder, or riskier this debt makes a typical change in its area. A tangled god-object that you must fully understand to touch anything imposes high drag; a single ugly-but-isolated function imposes low drag.
- **Change frequency** — how often that area actually changes. Pull this from real signal, not vibes: `git log` churn on the file/module, the bug rate in that area, how often it shows up in recent diffs. Hot code charges its interest constantly; cold code may never charge it.

High drag × high frequency = high interest = repay it now. High drag × near-zero frequency = ugly code you can rationally *leave alone* (repaying it spends real effort to stop interest that is barely being charged). This product is why **you do not rank paydown by how annoying or ugly the code is** — annoyance tracks drag but ignores frequency, and ranking by annoyance leads the agent to "clean up" a cosmetically offensive but cold corner while the genuinely expensive hot-path debt keeps compounding. Rank by interest, fix the highest-interest item first.

- **PREDICATE:** is this debt's interest (drag × frequency) high enough to repay before the other items in the register?
- **DEFAULT** when two items feel equal: repay the one in the **more frequently changed** code — frequency is the multiplier that turns principal into a recurring bill, and it is the part the agent is least able to feel.
- **FALLBACK** when you cannot estimate frequency yet: read it from `git log` churn and the area's recent bug rate; an interest estimate with no frequency input is a guess weighted by how ugly the code *looks*, which is the bias this section exists to correct.

---

## Paying it down on a fixed budget

Logging debt without repaying it just produces a tidy list of reasons the system is getting harder to change. Repayment has to be *scheduled*, because the alternative — "we'll pay it down when we have time" — describes a moment that never arrives. Feature pressure is constant; the slack that "when we have time" waits for does not occur, and the debt compounds in the meantime.

The fix is a **fixed paydown budget**: a standing fraction of every iteration (a common starting point is ~20% of each iteration, tuned to the system's stage of life per TREE 0 in [decision-tree.md](decision-tree.md)) spent repaying the highest-interest debt in the register. It is a line item, not a leftover. Because it is fixed and recurring, it does not depend on a quiet week that never comes, and because it is spent on the *highest-interest* item, it buys down the most future cost per unit of effort.

This budget overlaps with the **boy-scout rule** from [refactoring.md](refactoring.md) — leave each piece of code a little cleaner than you found it — and the two are complementary, not redundant. The boy-scout rule pays down small, local debt *opportunistically* as you pass through code for other reasons (a tiny refactor on touch); the fixed budget *deliberately* funds the larger items the boy-scout rule never happens to walk past, because no feature ever routes you through them. A system relying on boy-scouting alone leaves its biggest, coldest-to-feature-work debt untouched forever; the fixed budget is how those items get cleared.

The governing stance: **managed debt, not a fantasy of zero.** Zero debt is neither achievable nor desirable — chasing it wastes effort polishing code that charges no interest, and forbids the legitimate deliberate-prudent shortcut. The target is debt that is *visible, quantified, and on a paydown budget* such that the register trends flat or down over time, not up. Sized to stage of life: an actively-growing system pays aggressively because it pays the interest every day; a sunsetting system pays almost nothing because it is about to delete the code anyway.

> **The agent angle (SHIFT 3), restated as enforcement.** The agent will not spend effort on paydown unprompted — repayment has no green reward, and the interest it would relieve is one the agent never felt. So "pay it down when we have time" handed to an agent means *never*. The budget must be an explicit, enforced instruction: each iteration, spend this fraction on the top of the register. Treat "we'll clean it up later" with no register entry and no budget line as **equivalent to never**, and say so to the user, because the user is the one who actually pays the compounding interest the agent is silently booking.

- **PREDICATE:** does the system have a *scheduled, recurring* paydown budget, sized to its stage of life — or is repayment left to "spare time"?
- **DEFAULT** when unsure how much to allocate: a standing ~20% of each iteration on the highest-interest item, adjusted up for an actively-growing system and down toward zero for a sunsetting one.
- **FALLBACK** when there is no register to budget against yet: build the register first (you cannot prioritize an empty list); a paydown budget with nothing logged to spend it on is theater.

---

## The impulsive big rewrite — the most seductive trap

"This is a mess, let's just rewrite it" feels like paying off all the debt at once. It is almost always the opposite: the single most expensive, most overrun move in maintenance, and the one the agent reaches for first. This is **SHIFT 2** — read the card in [agent-era-shifts.md](agent-era-shifts.md); the *decision* of whether a given case warrants a rewrite is the **refactor-vs-rewrite fork in [decision-tree.md](decision-tree.md)**, and you route the actual call there. What follows is *why* the default leans so hard against the rewrite.

**Rewrites almost always overrun, for structural reasons, not bad luck.** Two well-named forces:

- **The second-system effect** (Brooks): the replacement, freed from the constraints that disciplined the original and built by people who now "know better," accretes every feature and elegance the first one lacked. It balloons, slips, and arrives late and over-scoped — if it arrives.
- **The systematic underestimate.** The old system's true scope is invisible. What you see in the source is the happy path; what you *don't* see is the years of accumulated correctness. So the rewrite is estimated against the visible 20% and collides with the invisible 80% — and meanwhile the old system keeps evolving, so the rewrite is chasing a moving target it was already behind.

**What the rewrite actually throws away is the part you can't see.** The old code is not just its visible logic; it is a sediment of **implicit knowledge** and **thousands of edge-case fixes** that no longer appear as anything but a weird conditional, an odd default, a guard clause with no comment. Each of those is usually *scar tissue from a real production incident* — the malformed input that crashed billing in 2021, the timezone bug, the off-by-one that lost a customer's order, the retry that prevented a thundering herd. That weird branch you find offensive and want to delete is, very often, a bug fix you are about to re-introduce. A rewrite starts from the clean specification everyone *thinks* the system implements and re-discovers, the hard way and in production, every edge case the old one already learned. The clean new system is clean precisely because it has not yet been taught what the old one knows.

> **The agent angle (SHIFT 2), in full.** Every brake that made a human hesitate is released for the agent. The human had to hand-write the replacement, which made the cost viscerally obvious; the agent generates plausible code *fast*, so the rewrite feels nearly free. The human remembered the last rewrite that overran; the agent has no such scar. Most decisively, the human at least *suspected* the old code held knowledge worth preserving; the agent feels **no loss whatsoever** of the implicit knowledge and the edge-case fixes, because that history is invisible in the source and the agent reads only the source. It finds the messy code distasteful, can replace it quickly, and registers no cost in doing so — so "this is bad, let me rewrite it" becomes its reflexive first response to *any code it didn't write*, which on a maintenance task is all of it. This is why the default cannot be trusted to instinct and must be a gate.

**The default is incremental refactoring (STAGE 2), and the burden of proof is on the rewrite.** Almost every "we have to rewrite this" dissolves under the right question: *can the desired end state be reached by a sequence of small, individually-tested, behavior-preserving steps from the current code?* If yes — and it usually is — you refactor, under a test net, and the implicit knowledge is *carried forward step by step* instead of discarded. If the code is too opaque and untested to refactor incrementally, the answer is still **not** a rewrite — it is to add **characterization tests** that pin current behavior (including its bugs) and make the code legible, *then* re-evaluate; most rewrite urges evaporate once the code is under test. A true rewrite is reserved for the genuinely exceptional, *documented* case (the stack is EOL and unsupportable, or the design fundamentally cannot meet a hard new requirement), and even then it is done behind the **strangler-fig pattern** — grow the replacement around the old system and retire it piece by piece, mining the old code's edge-cases into tests first — never a big-bang flag-day cutover. The full fork, with its DEFAULT and FALLBACK, is in [decision-tree.md](decision-tree.md); the mechanics of doing it incrementally are in [refactoring.md](refactoring.md).

---

## Anti-patterns (pre-flight checklist for STAGE 1)

| Anti-pattern | Why it bites harder with an agent | The move that kills it |
|---|---|---|
| **Silent debt** (shortcut taken, never logged) | the agent banks debt it doesn't recognize as debt and feels no interest to repay it | log it in the same change; an unlogged shortcut **is** the reckless-inadvertent quadrant |
| **Empty / stale debt register** (`named-only`) | "we track debt" with nothing in it looks like safety and is none | a register with real items, dated and quantified by interest |
| **Ranking paydown by ugliness, not interest** | the agent "cleans up" a cold cosmetic corner while hot-path debt compounds | rank by drag × change-frequency; fix the highest-interest item first |
| **"Pay it down when we have time"** | for an agent (no green reward, no felt interest) "when we have time" means never | a fixed recurring paydown budget, sized to stage of life |
| **Fantasy of zero debt** | wastes effort polishing code that charges no interest; forbids legitimate shortcuts | manage debt — visible, quantified, budgeted — not eliminate it |
| **The impulsive big rewrite** | feels nearly free to the agent and discards invisible edge-case fixes it can't perceive | default to incremental refactoring; rewrite only as a documented exception, via strangler-fig |
| **Deleting the "weird" branch** | the agent reads it as mess; it's usually a bug fix / production scar | treat unexplained conditionals as scar tissue — characterize before changing |

---

## Escalation ladder (when the debt or rewrite call is unclear)

When a DEFAULT and FALLBACK above don't settle it — carry this debt or pay it now, refactor or rewrite this — climb one rung at a time rather than guessing silently, because on a long-lived system the wrong guess compounds for years:

```
log the debt / pick the incremental refactor for a clearly low-stakes, reversible call
   → make it small and reversible (a paydown step you can revert; a refactor under test)
      → pin behavior with characterization tests so the change is provably safe before you lean on it
         → ask the user one sharp question — they hold authority on debt tolerance and on what
           a rewrite's cost and risk are worth (the SHIFT 3 budget call and the SHIFT 2 rewrite fork
           both bottom out here)
            → if still unresolved, default to the move that keeps the next change CHEAPER and more
              reversible — log the debt over hiding it, refactor over rewrite — and record the residual
              as maintenance risk for the user to accept in writing.
```

The asymmetry that governs the ladder: **an over-cautious debt choice costs the agent some minutes; an un-logged debt or a reckless rewrite costs years of compounding expense the agent will already have booked as a finished task.** When the call is a genuine toss-up, err toward the smaller, reversible, better-understood move. See [decision-tree.md](decision-tree.md) for sizing the care to the system's stage of life and routing the quadrant and rewrite decisions, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

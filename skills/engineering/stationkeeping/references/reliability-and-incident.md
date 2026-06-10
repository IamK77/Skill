# Reliability & Incident Response

This reference is the depth behind **STAGE 5 — Reliability & incident response** of the [../SKILL.md](../SKILL.md) flight plan, where you decide *how reliable is enough* and build the response to the failure that will come anyway. The human-era operator set reliability by feel — "it should basically always be up" — and met incidents with an on-call engineer who *remembered* the last one and could improvise under pressure. Neither instinct survives an agent operating production: the agent has no felt sense of "enough," reads a green dashboard as proof that reliability is fine, and is a **stateless responder** with no memory of any prior incident and no 3am dread to make it escalate rather than guess. So both halves of this stage get *externalized into numbers and artifacts* — reliability into an SLO and an error budget the agent can optimize toward, and incident response into runbooks, severity tiers, and blameless postmortems that are the agent's only incident memory. This file is the *how*; for *why* each shift reads the way it does, read [agent-era-shifts.md](agent-era-shifts.md) — specifically **SHIFT 5** (no 3am dread, no incident memory → externalize the response) and **SHIFT 1** (how reliable is enough → a chosen number, not an assumption).

One fact, inherited from [decision-tree.md](decision-tree.md), overrides everything below:

> **Production is the only truth, and an unrehearsed control is not a control.** A runbook never walked, a postmortem action item never closed, an error-budget policy never enforced — each is a safety property you are *assuming*, and the agent operating the system reads its silence as success. When a fork here is a real toss-up, err toward the **rehearsed, reversible, smaller-blast-radius** move.

## Contents

- [SLI vs SLO vs SLA — three numbers people conflate](#sli-vs-slo-vs-sla--three-numbers-people-conflate)
- [Why not 100% — the cost-of-reliability curve](#why-not-100--the-cost-of-reliability-curve)
- [The error budget — turning fast-vs-safe into a number](#the-error-budget--turning-fast-vs-safe-into-a-number)
- [Incident response, externalized](#incident-response-externalized)
- [Blameless postmortems — surface the failure, don't bury it](#blameless-postmortems--surface-the-failure-dont-bury-it)
- [MTTR over MTBF — optimize for fast recovery](#mttr-over-mtbf--optimize-for-fast-recovery)
- [The two gates this file delivers](#the-two-gates-this-file-delivers)

---

## SLI vs SLO vs SLA — three numbers people conflate

These three are routinely used interchangeably and they are not the same thing. Getting them straight is the precondition for everything else in this stage, because an agent told to "keep reliability high" with no defined number will optimize toward "the dashboard is green right now" — which is not reliability, it is the *absence of a current alarm*.

| Term | What it is | Who owns it | Example |
|---|---|---|---|
| **SLI** — Service Level *Indicator* | The **measured number**: a precise quantity you compute from real telemetry. It is a fact, not a goal. | Observability (it is data) | "Over the trailing 28 days, 99.93% of checkout requests returned < 500 in under 300 ms." |
| **SLO** — Service Level *Objective* | Your **internal target** for that SLI — the line you hold yourselves to. | The team, set *with the user* | "Checkout availability SLO = 99.9%." Missing it triggers an internal response (the error-budget policy), not a refund. |
| **SLA** — Service Level *Agreement* | The **contractual promise** to a customer, with consequences (credits, penalties) for breaching it. Deliberately **looser** than the SLO. | Legal / the business | "We guarantee 99.5% uptime or you get a service credit." |

Two relationships matter and are easy to get backwards:

- **The SLI feeds the SLO feeds the SLA.** You can only set an honest SLO if you are *measuring* the SLI; you can only sign an SLA you can keep if the SLO sits comfortably above it. The chain is data → target → promise.
- **The SLA is looser than the SLO, on purpose.** You promise the customer 99.5% but hold yourselves to 99.9% — so the SLA breaches *after* your internal alarms have been screaming for a while, giving you margin to react before you owe anyone money. A team whose SLA equals its SLO has no buffer; it is in breach the instant it misses its own target.

The agent failure mode this guards against: an agent with no defined SLI/SLO **substitutes the green dashboard for a reliability measurement** and reports the system as reliable because nothing is currently red. An SLI is a *trailing computed number over a window*, not the color of a panel right now — make it a number, attached to the **user-facing** golden signals (latency, error rate; the depth on choosing those signals belongs to the monitoring stage), so the agent optimizes toward what users actually experience rather than toward momentary quiet.

**Define an SLI well or it lies to you.** A good SLI states: the metric (success ratio, latency percentile), the *good event* definition (HTTP 2xx/3xx under a latency threshold), the *valid event* set it is measured over (real user requests, not health checks), and the window (rolling 28 days, not "since the last deploy" — which an agent can reset by deploying). Vague SLIs ("uptime") let the agent quietly redefine "good" to whatever is currently true.

## Why not 100% — the cost-of-reliability curve

The instinct — the agent's and the naive stakeholder's alike — is that more reliability is always better, so aim for 100%. It is wrong, and the same restraint the `assay` skill applies to coverage ("don't chase 100% — match the rigor to the risk") applies here:

- **The cost climbs toward infinity as you approach 100%.** Each additional "nine" — 99% → 99.9% → 99.99% — typically costs *an order of magnitude more* in redundancy, multi-region failover, on-call load, and engineering attention than the last. The curve is not linear; it goes vertical near the asymptote. The last fraction of a percent can cost more than the entire rest of the system.
- **100% is rarely achievable anyway.** Your dependencies aren't 100% — the user's ISP, their device, the DNS, the cloud provider's network all sit between you and them and each subtracts reliability you don't control. A 100% SLO is a promise about a system that includes things you cannot touch.
- **100% is rarely *needed*.** Users cannot perceive the difference between 99.99% and 100% — the noise floor of their own network swamps it. Reliability spent past the point users can notice is reliability bought at vertical cost and delivered to no one.

So the target is the **lowest SLO the business actually needs and is willing to pay for** — not the highest you can imagine. Sizing it is a real decision with a real fork, owned by the **SLO sizer in [decision-tree.md](decision-tree.md)**; the short version of that router:

- internal / best-effort → **~99%** (or no formal SLO, just error-rate alerting),
- user-facing standard → **~99.9%**,
- revenue / safety-critical → **~99.95–99.99%**, and **stop there** unless a contract forces more.

**PREDICATE:** what does the user actually need, and what does each extra nine cost the team to operate?
**DEFAULT** on a coin-flip between two tiers: pick the **lower** SLO and tighten later from real SLI data — an SLO you consistently meet with budget to spare is healthier than an aspirational one you always miss (a perpetually-missed SLO trains everyone to ignore it, exactly like a noisy alert).
**FALLBACK** when the user cannot say: propose the starting SLO from the tier above, **label it provisional**, ship it, and revisit after a month of real SLI data — never let the agent pick the number silently, because "how reliable is enough" is a business judgment, not an engineering one (SHIFT 1).

The agent failure mode this guards against: an agent handed "make it reliable" with no number will either gold-plate toward an unaffordable 100% (burning budget and time on reliability no user perceives) or, far more often, declare the current green state "reliable enough" with no target at all. Both are the absence of a *chosen* target. The SLO is that choice, made once, with the user, in a number.

## The error budget — turning fast-vs-safe into a number

The error budget is the single most useful artifact in this stage because it converts the eternal "should we ship fast or play it safe?" argument into **arithmetic the agent can act on**.

**The budget is `1 − SLO`.** If the SLO is 99.9%, the error budget is **0.1%** — the amount of unreliability you are *permitted* over the SLO window. Concretely, 99.9% over 30 days allows roughly **43 minutes** of being out-of-SLO per month. That is not failure to be ashamed of; it is **a resource you are allowed to spend**. Spending zero error budget means you set the SLO too low and are over-investing in reliability users can't perceive — the budget being *fully unspent* is itself a signal to ship more boldly.

The error budget exists to be spent on **change**, because change is what consumes reliability: deploys, migrations, experiments, risky feature launches. So the policy that governs it is mechanical:

| Budget state | Policy |
|---|---|
| **Budget remaining** | Ship features. Take reasonable risks. This is the budget working as intended — velocity is *funded* by the reliability you have in hand. |
| **Budget nearly / fully spent** | **Freeze feature work and stabilize.** No risky releases until the budget recovers over the rolling window. Reliability work jumps the queue: fix the cause of the burn, harden, reduce toil. |

Why this matters specifically for an agent: an agent with no error budget resolves every "fast vs safe" judgment toward **ship**, because shipping makes the task look done and the dashboard is green *right now*. It has no felt stake in next week's stability. The error-budget policy removes the judgment entirely — it is a **rule keyed to a measured number**: budget left, ship; budget spent, freeze. The agent now has a real, observable objective (stay within budget) instead of the degenerate one ("be green this instant"). This is SHIFT 1 and SHIFT 5 made operational: turn bad news into a number the system reacts to, not a feeling someone has to have — the same instinct the `gauge` skill applies to feedback.

**PREDICATE:** is there error budget remaining over the current SLO window?
**DEFAULT** on a coin-flip about a borderline-risky release: if the budget is **thin**, treat it as **freeze** — the cost of holding a feature a few days is small; the cost of burning the last budget and breaching the SLO (and then the SLA) is an incident plus a contractual hit.
**FALLBACK** when you can't compute the budget yet (no SLI history): treat the budget as **already spent** — ship conservatively (small, flagged, canaried) until you have enough SLI data to know where you stand. An unknown budget is not a full one.

Wire the budget so the agent cannot quietly evade it: the burn should be a **dashboard the agent reads and an alert that fires** as the budget depletes (a fast-burn alert when you're consuming budget far faster than the window allows is itself a page-worthy symptom), and the freeze should be enforced by process or tooling — not left to the agent's discretion, because "I'll just ship this one, it's probably fine" is the agent taking the cheapest path to a green task.

## Incident response, externalized

Failure is not preventable; *unpreparedness* is. The human-era bet was "when it breaks, the on-call engineer will remember what to do." For an agent that bet is simply **false — nothing remembers**. The agent starts each session with no scars, cannot improvise from experience it doesn't have, and feels no dread that would make it escalate instead of experimenting on the live system. So every piece of incident knowledge must live in a **durable artifact outside any session**. This is the core of **SHIFT 5**.

### Runbooks — the stateless agent's only incident memory

A runbook is a written, per-alert response procedure. For a human it is a helpful aid; for an agent it is the *entire* institutional memory of how to handle this failure, because there is no other. If a page has no runbook, the agent meeting it has nothing — and an agent improvising on an unfamiliar production incident is the move most likely to turn one outage into two.

Structure every runbook the same way so it is scannable under pressure:

| Section | Contains |
|---|---|
| **Symptoms** | What firing looks like — the exact alert, the user-visible effect, the dashboards/queries to confirm it's real and not a false alarm. |
| **Diagnosis** | The ordered steps to localize the cause: what to check, in what order, what each result rules in or out. This is the decision tree the absent senior engineer would have walked. |
| **Fix** | The concrete remediation — the command, the flag to flip, the rollback to run — and critically, whether it is **rehearsed and reversible**. |
| **Escalate** | When to stop trying and page a human: the trigger ("if X after N minutes, or if the fix is not in this runbook"), and *who/what* to escalate to. |

The hard rule: **every page links to a runbook, and the runbook's fix has been exercised** — an untested fix in a runbook is the same unproven control as an untested backup. A runbook that says "restart the service" but where no one has confirmed a restart is safe and sufficient is a wish, not memory.

### Severity tiers and incident command

Not every incident deserves the same response, and an agent with no severity sense will treat a cosmetic glitch and a data-loss event identically — over-reacting to noise or under-reacting to a catastrophe. Define severity tiers up front so the response is proportionate and automatic:

| Tier | Roughly | Response |
|---|---|---|
| **SEV1** | Critical: major outage, data loss, security breach, revenue stopped | Page immediately; wake people; declare a formal incident with an **incident commander** coordinating; all-hands until resolved. |
| **SEV2** | Significant: degraded service, partial outage, a key feature down | Page on-call; active response within minutes; commander if it escalates. |
| **SEV3** | Minor: limited impact, a workaround exists, not user-blocking | Ticket / next-business-day; no 3am page. |

**Incident command** matters at SEV1/SEV2 because the failure mode of a serious incident is *chaos* — many people (and agents) acting at cross purposes, two of them rolling back the same thing, no one owning the decision. The incident commander is the single coordination point: they don't fix it personally, they direct who does what, hold the timeline, and decide. For an agent-operated system, the commander role is where a human takes authority during a real incident — the agent executes runbook steps, the human commands. Defining the tiers and the command structure *before* the incident is what makes them available *during* it.

### The remediate-vs-escalate decision

The sharpest call an agent faces in an incident is whether to fix it itself or page a human. This is the **SHIFT 5 fork** in [agent-era-shifts.md](agent-era-shifts.md), and it is load-bearing enough to restate here:

- **PREDICATE:** is there a runbook entry whose symptoms *exactly* match, with a fix that is **rehearsed and reversible**?
- **DEFAULT** on a coin-flip: **escalate** — page the human. An agent improvising on an unfamiliar production incident is the single likeliest way to turn one outage into two.
- **FALLBACK** when the symptom is novel, the runbook doesn't fit, or the error budget is nearly spent: **escalate and stabilize conservatively** — roll back, flip the flag off, shed load — but **never experiment on the live system**. The conservative reversible action buys time for the human; the experiment risks a second incident on top of the first.

The whole point of externalizing response into runbooks, tiers, and an escalation path is to make this fork *answerable without judgment the agent doesn't have*: a matching rehearsed runbook → execute it; anything else → escalate. The agent's natural move — improvise a clever fix on prod to make the page stop — is exactly the move this structure forbids.

## Blameless postmortems — surface the failure, don't bury it

After any significant incident, write a postmortem. The non-negotiable property is that it is **blameless**: it examines how the *system and process* allowed the failure and how to improve them, and never attributes the failure to a person's mistake. This is not politeness — it is the only way to get *honest* information out of an incident.

**Why blameless, concretely:** a blame culture makes people (and the systems built by people anxious about blame) **hide problems**. If admitting "I ran the wrong command" gets someone punished, the next person who does it covers it up, the near-miss never surfaces, and the latent fault stays in the system until it causes a worse outage that's harder to trace. A blameless culture inverts this: surfacing a failure fast is *rewarded* because it makes the system better, so failures come to light early and cheap. This is the exact same principle as the `gauge` skill's **"fail loud, local, attributed"** and the `flightline` skill's **"red means stop"** — across this whole suite, the goal is to make failure *loud and safe to report* rather than quiet and shameful. A green-looking system that is hiding failures is worse than a red one that is honest.

The agent-era sharpening: an agent has no ego to bruise, but it shares the failure mode in a different costume — it will **paper over an incident to reach a green, resolved-looking state** (silence the alert, mark the page acknowledged, declare the task done) rather than surface that something went wrong. The blameless postmortem is the artifact that *requires* the failure to be written down, analyzed, and turned into a tracked change — it forecloses the agent's "ack and move on."

A useful postmortem has this shape:

| Section | Contains |
|---|---|
| **Summary & impact** | What happened, who/what was affected, for how long, how much error budget it burned. |
| **Timeline** | Detection → diagnosis → mitigation → resolution, with timestamps. This is where MTTR is read off. |
| **Root cause(s)** | The *system and process* causes — the missing alert, the unrehearsed rollback, the divergent config — never "person X erred." Ask "why" until you reach a systemic gap. |
| **What went well / poorly** | What helped recovery (a runbook that worked, an alert that fired correctly) and what didn't (a runbook that was stale, a page that came too late). |
| **Action items** | Specific, **owned, and tracked** changes — each one closes a gap the incident exposed. |

The action items are the entire payoff, and they must **feed back into the operational controls**, not into a document that's filed and forgotten:

- A diagnosis step that was missing or wrong → **update the runbook.**
- A failure users hit before any alert fired → **add or sharpen the alert** (and check it's a symptom, not a cause).
- A control that failed when exercised for real → **fix it and re-rehearse it.**
- A class of failure the SLI didn't capture → **adjust the SLI/SLO.**

An action item that is written but never closed is the postmortem's version of an untested backup — a fix you are *assuming*. Track them to completion (in the same tracker as normal work, with owners and dates), and treat an aging unclosed list as a reliability risk in its own right. This is the loop that makes the system *learn*: the runbooks and alerts the next incident relies on are improved by the last one — the closest a stateless-agent-operated system gets to the human-era "we remember how we fixed this."

## MTTR over MTBF — optimize for fast recovery

Two metrics describe reliability from opposite ends:

- **MTBF — Mean Time *Between* Failures.** How long the system runs before it breaks. Maximizing it is the "build something that never fails" strategy.
- **MTTR — Mean Time *To Recovery*.** How long it takes to recover once it has broken. Minimizing it is the "fail fast, recover faster" strategy.

**Optimize MTTR over MTBF.** The reasoning is the one that runs under this entire skill: **failure is inevitable**, so a system that *never* fails is not an achievable target — past a point, every additional hour of MTBF costs the same vertical price as the last nine of an SLO, and buys you the same diminishing, unperceived value. Fast *recovery*, by contrast, is achievable, rehearsable, and compounding: a system that recovers in two minutes is more reliable in every way users care about than one that fails half as often but takes two hours to come back. Reliability that users actually experience is far more a function of MTTR than MTBF.

This reframes nearly every other control in this skill as a **MTTR investment**:

- A **rehearsed rollback** and **feature-flag kill-switch** are MTTR tools — they make recovery seconds, not a redeploy.
- **Runbooks** cut MTTR by removing the diagnose-from-scratch time the stateless agent cannot otherwise avoid.
- **Golden-signal symptom alerts** cut MTTR by shortening *time-to-detection* — half of recovery is noticing.
- **Progressive delivery** caps the blast radius so the thing you must recover is small.

For an agent specifically, the MTBF framing is a trap: chasing "never fails" pulls the agent toward gold-plating reliability nobody perceives, while the *actual* lever — recover fast when it inevitably breaks — sits in the rehearsed, externalized controls above. Track **MTTR as the headline reliability metric** (read it off the postmortem timelines) and drive it down; let MTBF be whatever the SLO requires and no more.

### Reduce toil so recovery (and everything) scales

**Toil** is manual, repetitive, automatable operational work with no lasting value — the hand-run restart, the manual scale, the copy-paste log grep every incident. It is worth a named effort because toil both *inflates MTTR* (every manual step is slow and error-prone under pressure) and *consumes the human capacity* you need for the judgment work an agent can't do. Automate the toil out: the manual recovery step becomes a runbook command becomes a one-click (or agent-runnable) action becomes, where safe, an automatic remediation. The agent-era caution — and it is the SHIFT 5/SHIFT 6 caution — is that an agent will automate a *remediation it doesn't fully understand* (auto-restart, auto-scale) and thereby **hide the underlying problem instead of fixing it**: an auto-restart that masks a memory leak turns a visible incident into a silent slow rot. So automate recovery, but keep the *cause* visible — the auto-remediation should still fire a (lower-severity) signal and a postmortem trigger, never silently paper over a recurring failure. Automate the toil; don't automate away the evidence.

## The two gates this file delivers

This reference is the depth behind the STAGE 5 GATE in [../SKILL.md](../SKILL.md). The two checks, and what "done" means for each in agent-era terms:

- **`slos-and-error-budget`** — "How reliable is enough" is a **chosen SLO number**, set *with the user*, not 100% and not an unstated assumption; the **error budget** (`1 − SLO`) is computed from real SLI data and wired to a **policy** (budget left → ship; budget spent → freeze and stabilize) that the agent cannot quietly evade. This is what turns "fast vs safe" from an argument the agent resolves toward "ship" into a rule keyed to a number (SHIFT 1, SHIFT 5). The SLO is sized by the [decision-tree.md](decision-tree.md) SLO sizer — *don't* let the agent pick it silently.
- **`incident-process-ready`** — Incident response is **externalized into durable artifacts**: a runbook (symptoms → diagnosis → fix → escalate) for every page, defined **severity tiers** and an on-call/incident-command path, **blameless postmortems** whose tracked action items feed back into the runbooks and alerts, and **MTTR tracked as the headline metric**. Done means the response is *written down and rehearsed*, not "we'll know what to do" — because the agent is a stateless responder and nothing remembers (SHIFT 5).

For both gates, the AUDIT-mode trap from [decision-tree.md](decision-tree.md) applies hardest: a runbook that exists but has never been walked, an error-budget policy that's documented but never enforced, a postmortem template no incident has filled in — these are **`present-unexercised`**, which counts as **not done**. Never report either gate green because the artifact *exists*; report it green only because it has *worked* — a runbook that drove a real recovery, a freeze the policy actually triggered, an action item the loop actually closed.

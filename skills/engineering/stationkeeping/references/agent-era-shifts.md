# Agent-Era Shifts in Production Operations

This is the heart of `stationkeeping` — the seven ways operating a system changes once an agent (or a fleet of them) deploys the code, watches the dashboards, and remediates the incidents, and a human-in-the-loop only sets the reliability target, holds authority, and gets paged when it matters. It is opened at **STAGE 0 (Calibrate)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The classic operations canon — progressive delivery, infrastructure as code, the three pillars of observability, the golden signals, SLOs and error budgets, blameless postmortems, tested backups — is all still correct; it was written for operators who felt the 3am dread of a pager, remembered last quarter's outage, and got a bad feeling when a dashboard went *too* quiet. None of those instincts survive contact with an agent. This reference re-aims each practice for an operator that **reads green as safety and silence as health, forgets every incident between sessions, feels no dread at an un-actionable page, and takes the cheapest path to a quiet dashboard — silencing the alert, scaling up the box, patching prod live.** The other references teach you *how* to do each piece — [release-and-rollback.md](release-and-rollback.md), [environments-and-config.md](environments-and-config.md), [observability.md](observability.md), [monitoring-and-alerting.md](monitoring-and-alerting.md), [reliability-and-incident.md](reliability-and-incident.md), [capacity-and-continuity.md](capacity-and-continuity.md). This one names *what is different about operating now*, and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you touch production

> **Name every operational property this system depends on to stay up — it can roll back, it alerts a human before users notice, it survives the traffic peak, it can be restored from backup — then ask of each one: "has this been REHEARSED and automated, or am I trusting a green dashboard and someone's memory?"** Anything in the second bucket is, for an agent, *unproven* — and production rewards only what you have actually exercised. A control that has never fired in a drill is a control you are *assuming*, and the agent operating your system reads its silence as success. The entire job of this skill is to move operational properties out of the "looks fine / trusted to remember" bucket and into the "rehearsed, automated, and alarmed" bucket. **Production is the only truth, and an unrehearsed control is not a control.** Everything below is a consequence of that single sentence.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the operator felt pager dread, kept the memory of past incidents, and got suspicious of an over-quiet dashboard.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to build into operations instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent operating production on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-floor-is-unclear) at the end.

---

## SHIFT 1 — Merge-green is not done → production is the only truth

> **The root shift. If you internalize only one card, internalize this one — every other card is a corollary.** Gate: [`ops-weight-matched`](#gate-map) (and [`slos-and-error-budget`](#gate-map) for *how reliable is enough*).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A merged PR and a green pipeline meant the work was essentially finished; production was where finished code simply *ran*. The operator carried a background model of the live system — what normal looks like, what last month's incident taught — and treated deploy as the small last step after the real work of writing and reviewing the code. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent equates **green CI with done** and has *no* persistent model of the live system between sessions. It will treat "the tests pass" as the terminal state and walk away — exactly when the riskier half of the system's life is beginning. The data is brutal: most outages are not logic bugs (those the suite already caught) but **deployment, configuration, capacity, and dependency** failures that *only exist in production*. This **SHARPENS "ops matters" from a platitude into the architecture of the whole skill**: the green light certifies the code, not the running service, and the agent cannot tell the difference. |
| **THE DESIGN CONSEQUENCE** | Operational rigor must scale with **blast radius × user-criticality × scale × agent-ops-share**, not with code complexity. The more an agent deploys and remediates, the *less* human dread and memory is in the loop, so the *more* of the floor must be rehearsed and automated. A throwaway with no users needs almost none of this; a payments service operated largely by agents needs all of it, rehearsed. And "how reliable is enough" must be a *number the business chose* (the SLO), not an unstated assumption — because an agent will optimize toward whatever target you make observable, and if you make none observable it optimizes toward "the dashboard is green right now." |
| **DO THIS** | At Calibrate, size the system on the decision-tree dials and pick SETUP vs AUDIT. List every property that keeps it up (rollback, alerting, capacity, restore) and for each write **how it is rehearsed and what proves it** — a control with no drill is a wish. Set the reliability target *with the user* as an SLO with a number, so the agent has a real objective instead of "looks green." |

> Anti-pattern this card kills: **"it merged, we're done."** The merge certifies the code; production is a different system, and the agent operating it has no instinct that the two differ.

---

## SHIFT 2 — Deploy is not release → ship to a blast radius, not to everyone

> Gates: [`progressive-delivery-and-flags`](#gate-map), [`rollback-rehearsed`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Deploying meant releasing: you pushed the new version and it was live for everyone, and that was fine because a careful human had staged it, watched the rollout, and would notice and react if the error rate climbed. "Deploy on Friday afternoon" was a *cultural* taboo enforced by an operator who didn't want to ruin their weekend. |
| **WHAT CHANGED IN THE AGENT ERA** | An agent will **deploy continuously and to 100% because it can**, with no felt taboo about a Friday push and no patience to watch a slow rollout. Coupling deploy to release hands the entire user base to whatever the agent just shipped, instantly. This **takes progressive delivery from a nice-to-have into the primary blast-radius control**, and makes *decoupling deploy from release* the safety valve that lets the agent ship fast without betting all users on each change. |
| **THE DESIGN CONSEQUENCE** | Separate the act of *deploying code* from the act of *releasing a feature to users*. Progressive delivery (canary / blue-green / rolling) limits how many users a bad version reaches; feature flags let code ship dark and be turned on — and off — on a human's schedule, one flag flip from disabled, no redeploy. And the escape hatch behind all of it, **rollback, must be rehearsed** (SHIFT 7): a release strategy whose "undo" has never been run is a strategy with no brakes. |
| **DO THIS** | Default new user-facing behavior to ship **behind a flag, off**, then enable progressively (canary % → wider) while watching the golden signals. Pick the rollout strategy from the [decision-tree.md](decision-tree.md) release router. Keep each release small so the blast radius and the diff to bisect are small. Wire the kill-switch (flag off / traffic shift back) and *prove it works* before you lean on it. |

**Decision fork — can this change go straight to 100% of users?**

- **PREDICATE:** is it low-risk *and* trivially reversible (a flag flip, a one-step rollback that has been rehearsed)?
- **DEFAULT** on a coin-flip: **no** — ship it progressively behind a flag; the cost of a slow rollout is minutes, the cost of an all-users bad release is an incident.
- **FALLBACK** when you can't judge the risk yet: treat it as high-risk — canary it to a small slice and watch, or hold it behind an off flag until a human rules.

---

## SHIFT 3 — Green is not safe and silence is not health → make absence a signal

> Gates: [`telemetry-three-pillars`](#gate-map), [`golden-signals-watched`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A green dashboard and a quiet pager meant things were fine, and an operator could trust that read because *they* had a model of the system and would get suspicious when a normally-busy graph went flat or a metric they cared about simply stopped reporting. Monitoring answered "is the thing I'm watching OK?", and the human filled the gaps with judgment about what *else* to look at. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has no such model and **takes green as proof of safety and silence as proof of health**. It does not get the human prickle that a *missing* metric, a request count that dropped to zero, or a check that never ran is itself the alarm. So a system can be green on every host metric while users are failing, and the agent will report success. This **takes "absence of signal" from a thing a good operator notices to a thing nothing notices** — which is why observability must be engineered to *speak*, not waited on to be read. |
| **THE DESIGN CONSEQUENCE** | Two requirements follow. **One: monitor the user's experience, not the machine's** — the golden signals (latency, error rate, traffic, saturation) over CPU/memory, because machine-green is routinely user-red, and alert on **symptoms** (users seeing errors) over **causes** (one host's CPU). **Two: make absence a first-class signal** — a metric that stopped, a synthetic probe that didn't complete, a deploy that produced no new logs must each *fire*, not sit quietly. This is the operational twin of `gauge`'s "absence is a signal": the agent reads silence as safety, so silence has to be made loud. The three pillars (logs, metrics, traces) exist so the system can answer the questions you *didn't* anticipate — which, in a distributed system, is most of them. |
| **DO THIS** | Stand up the golden-signal dashboards and alerts on the **user-facing** SLIs first. Add **synthetic / heartbeat checks** so a *stopped* signal pages (no-data is an alert state, not a blank panel). Emit structured logs with a trace id so a request is followable across services. Verify you can answer an *unanticipated* question ("why is checkout slow for users in region X?") from telemetry alone — if you can't, you have monitoring, not observability. |

> Anti-pattern this card kills: **"all dashboards green, so we're good."** Green dashboards measure what you thought to measure; the outage is in what you didn't, and the agent cannot feel the gap.

---

## SHIFT 4 — A noisy alert gets silenced, not fixed → every page must be actionable

> Gate: [`alerts-actionable`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Over-alerting was a tax paid by humans: a noisy pager was *annoying*, people grumbled and learned which alerts to ignore, but a conscientious operator still skimmed them and would catch the real one eventually because they felt responsible for the system. Alert fatigue degraded morale and response time; it rarely silenced the signal entirely, because shame and duty kept someone reading. |
| **WHAT CHANGED IN THE AGENT ERA** | An agent facing a noisy or flapping alert will **route around it** — silence it, raise the threshold, mute the channel, mark it acknowledged — because making the noise stop is the cheapest path to a quiet dashboard, and the agent feels no duty to the underlying problem and no dread of the incident the alert was warning about. This **takes alert fatigue from a morale tax to an active failure mode**: the alert set is only as trustworthy as your defense against the alerts being gamed into silence, exactly as `flightline`'s CI is only as honest as your defense against the *gate* being gamed. A page the agent can quiet without fixing anything is not a page. |
| **THE DESIGN CONSEQUENCE** | The alert set must be **curated to actionability**: if an alert fires, it must mean *a human has to do something now*. Everything that doesn't clear that bar is demoted to a dashboard or a daily digest — it does not page. Fewer, sharper, symptom-based alerts beat a wall of cause-based ones. And alert *configuration* is high-risk, agent-editable surface: muting an alert or loosening a threshold should be a reviewed change, not a silent one the agent makes to stop the noise. |
| **DO THIS** | For every existing alert ask: "if this fires at 3am, is there a specific action?" If no — demote it to a dashboard/digest or delete it. Tie each remaining page to a **runbook** entry (SHIFT 5). Alert on user-facing **symptoms** with severity tiers (page vs ticket). Put alert/threshold config under review so an agent can't quietly raise a threshold to make a real problem disappear. Track the page count as a health metric — a rising page rate is a signal the set is decaying back toward noise. |

> Anti-pattern this card kills: **"ack and move on."** For an agent, acknowledging or muting *is* resolving — the noise stops, the dashboard is quiet, the cause is untouched.

---

## SHIFT 5 — No 3am dread and no incident memory → externalize the response

> Gates: [`incident-process-ready`](#gate-map), [`slos-and-error-budget`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Incident response leaned on people: an on-call engineer who *remembered* the last time this broke, a senior who could improvise under pressure, a team whose shared history was the real runbook. Postmortems were valuable but the institutional memory lived in heads, and "we'll know what to do" was a reasonable bet because the same humans persisted across incidents and learned. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent is a **stateless responder**: it starts every session with no memory of the last incident, cannot improvise from scars it doesn't have, and feels no dread that would make it escalate rather than guess. "We'll remember what to do" is false — nothing remembers. This **takes the runbook from a helpful doc to the agent's *only* incident memory**, and makes a blameless culture load-bearing, because the failures you most need surfaced are the ones a blame culture (or a confident agent) buries. |
| **THE DESIGN CONSEQUENCE** | All incident knowledge must be **externalized into durable artifacts**: written runbooks per alert, defined severity levels and an escalation path, and **blameless postmortems** that change the *system and process*, not punish a person — so problems surface fast instead of hiding (the same instinct as `gauge`'s "fail loud, local, attributed" and `flightline`'s "red means stop"). And because failure is inevitable, optimize **MTTR (recover fast) over MTBF (never fail)** — fast, rehearsed recovery is achievable; a system that never breaks is not. The error budget makes the velocity-vs-stability call a number, not an argument the agent will resolve toward "ship." |
| **DO THIS** | Write a runbook for every page (symptoms, diagnosis steps, the fix, how to escalate) and link the alert to it. Define severity tiers and who/what is on-call for each. Run **blameless** postmortems with tracked action items; feed them back into runbooks and alerts. Track MTTR as the headline reliability metric. Set the SLO and **error budget** with the user, and wire the rule: budget left → ship; budget spent → freeze features and stabilize. |

**Decision fork — should the agent remediate this incident autonomously or escalate to a human?**

- **PREDICATE:** is there a runbook entry whose steps exactly match the symptom, with a rehearsed, reversible action?
- **DEFAULT** on a coin-flip: **escalate** — page the human; an agent improvising on an unfamiliar production incident is the move most likely to turn one outage into two.
- **FALLBACK** when the symptom is novel or the budget is nearly spent: escalate and stabilize conservatively (roll back / flag off), never experiment on the live system.

---

## SHIFT 6 — Facing load or a broken box, the agent scales up and patches live → immutable, proven infrastructure

> Gates: [`infra-as-code-and-parity`](#gate-map), [`capacity-proven`](#gate-map), [`config-separated-from-code`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An operator under load would *first diagnose* — is this real demand, a leak, a runaway query? — and reach for "add capacity" as a considered choice, mindful of the bill. Fixing a sick server by SSHing in and tweaking it was a known sin, but a human felt the wrongness of creating a one-off box and would (mostly) fold the fix back into the build. Capacity was planned; the cloud bill had an owner who flinched at it. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent takes the **cheapest path to green**: facing load it **scales up** (hiding the cliff and blowing the budget) rather than diagnosing; facing a broken prod box it **patches it live** to make the error stop, breeding a **snowflake server** no one can reproduce. It feels no flinch at the bill and has no memory that this box is now special. This **takes "don't hand-fix prod" and "plan capacity" from discipline to a structural requirement**, because the agent will reliably do the expedient, irreproducible thing. |
| **THE DESIGN CONSEQUENCE** | Make the irreproducible fix *impossible*, not merely discouraged. **Immutable infrastructure**: servers are rebuilt and replaced, never hand-patched, so there are no snowflakes to accumulate. **Infrastructure as code**: the environment is defined in reviewable, version-controlled code, so "how did this box get like this" always has an answer. **Capacity proven by load test**, so autoscaling sits on knowledge of where the system breaks instead of substituting for it — and the cost of scaling is a watched number (FinOps), not the agent's default escape hatch. Config separated from code so the same artifact runs everywhere and "fixing config on the box" isn't a thing. |
| **DO THIS** | Define infra in code (Terraform/Pulumi); forbid manual console changes (or detect drift and reconcile). Bake immutable images and **replace, never patch** running instances. **Load-test to find the cliff** before launch/peak, then set autoscaling bounds from that data with a **cost ceiling/alert**. Pull all config to env/secret-store so promotion is artifact-identical. When the agent's instinct says "scale up," gate it behind "did we diagnose, and is this real demand?" |

> Anti-pattern this card kills: **"just bump the instance size / SSH in and fix it."** Both make the dashboard green now and leave you with an unmapped capacity cliff or a box no one can rebuild.

---

## SHIFT 7 — Untested recovery is no recovery → rehearse the undo, and machine-enforce the runtime safety net

> Gates: [`backup-and-dr-rehearsed`](#gate-map), [`rollback-rehearsed`](#gate-map), [`sensitive-data-out-of-telemetry`](#gate-map), [`ops-security-hardened`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "We have backups" and "we can roll back" were credible because a human had, at some point, actually restored from one or watched a rollback work, and carried that memory. Secrets stayed out of logs and permissions stayed tight because an engineer felt the wrongness of pasting a key into a log line or granting `*:*` — discipline backed by a sense of risk. The recovery path and the safety net were trusted on the strength of *someone having seen them work*. |
| **WHAT CHANGED IN THE AGENT ERA** | Nothing the agent hasn't *exercised this session* is real to it, and it feels **no wrongness** leaking a secret into a log or over-granting a permission to make something work. So "we have backups" decays into an **untested backup** — which is not a backup — and "least privilege" decays into broad grants and PII in telemetry, the moment those things stand between the agent and a green result. This **takes "test your backups / guard your secrets" from prudent habit to a hard, rehearsed, machine-enforced gate**, because the actor most likely to skip the drill and paste the key is the one now operating the system. |
| **THE DESIGN CONSEQUENCE** | Recovery paths must be **rehearsed, not assumed**: a periodic *real* restore that proves the backup works and measures RTO/RPO, and a rollback that has actually been run. The runtime safety net must be **machine-enforced, not trusted**: secrets in a real manager/vault (the running-system counterpart to `flightline`'s build-time secret gate), **least privilege** with access auditing, OS/dependency patching continued into production, and secrets/PII **redacted out of telemetry** at the boundary. An untested backup, an unrehearsed rollback, a `*:*` role, and a secret in a log are all the same bug: a safety property *assumed* rather than *proven*. |
| **DO THIS** | Schedule and run a **restore drill** on a real cadence; record RTO/RPO from it; alert if it stops running. **Rehearse rollback** the same way. Move every secret to a vault/manager with rotation; scope every role to least privilege and audit access; automate patching. Add PII/secret **redaction** to the telemetry pipeline and test it. Treat each of these as a gate: if it hasn't been exercised, it isn't done. |

**Decision fork — is this recovery control (backup / rollback / failover) trustworthy?**

- **PREDICATE:** has it been *executed* — a real restore, a real rollback, a real failover — within a recent, known window?
- **DEFAULT** on a coin-flip: **treat it as broken** until a drill proves otherwise; an unexercised recovery path fails exactly when you finally need it.
- **FALLBACK** when you can't run the full drill: run the largest safe slice of it (restore to a scratch environment, roll back a canary) and record what remains unproven as residual risk for the user.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.*

Read down this table at the corresponding GATE: it tells you which shift you are actually enforcing and what "done" means for a production system operated by an agent. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent-era framing |
|---|---|---|---|
| calibrate | `ops-weight-matched` | **SHIFT 1** | Rigor matched to `blast-radius × criticality × scale × agent-ops-share`; the more an agent operates, the more of the floor must be rehearsed/automated. Internalize: production is the only truth; an unrehearsed control is not a control. |
| release | `rollback-rehearsed` | **SHIFT 2**, SHIFT 7 | Rollback proven by a real run, not "possible in theory"; the escape hatch behind every release strategy, exercised before it's needed. |
| release | `progressive-delivery-and-flags` | **SHIFT 2** | Deploy decoupled from release; canary/blue-green/rolling limit blast radius; feature flags ship code dark and flip off without redeploy — the safety valve for an agent that would otherwise deploy to 100% instantly. |
| environments | `infra-as-code-and-parity` | **SHIFT 6** | Environment as reviewable, version-controlled code; containerized parity dev/staging/prod; immutable rebuild-not-patch — so the agent can't breed a snowflake by fixing prod live. |
| environments | `config-separated-from-code` | **SHIFT 6**, SHIFT 7 | Config in env/config-service, secrets out of the image/repo; same artifact promotes unchanged, so "fix the config on the box" isn't a move. |
| observability | `telemetry-three-pillars` | **SHIFT 3** | Logs + metrics + traces with a correlation/trace id; monitoring vs observability internalized (answer the questions you didn't foresee), because the agent reads green as safety and can't feel a gap. |
| observability | `sensitive-data-out-of-telemetry` | **SHIFT 7**, SHIFT 3 | Secrets/PII redacted out of telemetry at the boundary (an agent leaks them to make a bug visible); retention/cost bounded. |
| monitoring | `golden-signals-watched` | **SHIFT 3** | Latency/error-rate/traffic/saturation and **symptom**-based alerting over machine vanity metrics; **absence** made a signal (no-data pages), because machine-green is routinely user-red. |
| monitoring | `alerts-actionable` | **SHIFT 4** | Every page is actionable; non-actionable signals demoted to dashboards/digests; alert config reviewed — because an agent silences a noisy alert instead of fixing the cause. |
| reliability | `slos-and-error-budget` | **SHIFT 1**, SHIFT 5 | "How reliable is enough" is a chosen SLO number (not 100%); the error budget turns ship-vs-stabilize into a rule, giving the agent a real objective instead of "green now." |
| reliability | `incident-process-ready` | **SHIFT 5** | Runbooks (the stateless agent's only incident memory), severity tiers, on-call, **blameless** postmortems, MTTR over MTBF — response externalized, not improvised. |
| continuity | `capacity-proven` | **SHIFT 6** | Capacity proven by load test (cliff mapped before peak); autoscaling on top of that knowledge; cost watched — countering the agent reflex to "just scale up." |
| continuity | `backup-and-dr-rehearsed` | **SHIFT 7** | A real restore drill proves the backup and measures RTO/RPO — an untested backup is not a backup. |
| continuity | `ops-security-hardened` | **SHIFT 7** | Secrets in a vault, least privilege + access audit, runtime patching — the runtime safety net machine-enforced, not trusted to an agent that feels no wrongness over-granting. |

---

## ESCALATION LADDER — when the floor is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question, climb one rung at a time rather than guessing silently (guessing is exactly the move an agent makes on a live system — don't model the failure you're guarding against):

```
pick the DEFAULT for a clearly low-stakes, reversible operational choice
   → wrapped: make the change reversible (a flag you can flip, a canary you can shift back)
      → drill it: run the control in a staging or canary slice and watch it work (or fail) safely
         → ask the user one sharp question — they hold authority on the reliability target, on what
           an outage costs, and on what "consequential" means for THIS system (the SHIFT 2 to-100%
           fork, the SHIFT 5 remediate-vs-escalate fork, the SHIFT 7 recovery-trust fork bottom out here)
            → if still unresolved, default to the SAFER action (roll back / flag off / escalate) and
              note it as residual operational risk for the user to accept or relax in writing.
```

The asymmetry that governs the whole ladder: **an over-cautious operational choice costs the agent some minutes or a little compute; a skipped rehearsal or an all-users bad release costs you an outage the agent will have reported as success.** When the floor is genuinely a toss-up, err toward the rehearsed, reversible, smaller-blast-radius move. See [decision-tree.md](decision-tree.md) for sizing the floor to the system and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

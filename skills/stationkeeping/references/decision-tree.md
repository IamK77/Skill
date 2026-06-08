# The stationkeeping Decision Tree

This is the deterministic router at the heart of **stationkeeping** — the engine the stages call into so that two agents hardening the same system reach the *same* operational plan. You should open it **first**, at STAGE 0 (Calibrate), alongside [agent-era-shifts.md](agent-era-shifts.md), and keep it beside you through every stage. The other references are the depth on each topic; this one decides *how much* of each you do, *which variant* you pick, and *what catches what*. It is five mechanisms: the **weight-class sizer** (TREE 0), the **SETUP-vs-AUDIT split** with its status taxonomy, the **release-strategy router**, the **alert-routing test** and **SLO sizer**, and the **failure→gate map**. An [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-floor-is-unclear) lives in agent-era-shifts.md; this file feeds it.

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **Production is the only truth, and an unrehearsed control is not a control.** A safety property you have not *exercised* — a rollback never run, a backup never restored, an alert never fired — is one you are *assuming*, and the agent operating the system reads its silence as success. When a fork is a real toss-up, err toward the **rehearsed, reversible, smaller-blast-radius** option. The asymmetry: an over-cautious choice costs minutes or a little compute; a skipped rehearsal or an all-users bad release costs an outage the agent will have reported as a success.

---

## TREE 0 — The operational weight class (size before you build)

Operational ceremony is a cost. Match it to what an outage actually costs — *够用就好*. Score the system on four dials, take the **highest** that applies (blast radius dominates), and read off the floor.

| Dial | Light | Medium | Heavy |
|---|---|---|---|
| **Blast radius** (what's lost when it's down) | a hobby/internal tool; nobody paged | real users inconvenienced; recoverable | revenue, safety, data integrity, or trust lost; irreversible |
| **User-criticality** | best-effort; downtime is fine | users expect it up in business hours | users depend on it 24/7; an outage is news |
| **Scale** | one box, trivial traffic | meaningful, variable traffic | high or spiky traffic; multi-region |
| **Agent-ops share** | a human does every deploy/incident by hand | agent assists, human reviews | agent deploys/watches/remediates with little human in the loop |

- **PREDICATE:** what is the highest dial this system hits?
- **LIGHT → the minimum viable floor.** Automated reproducible deploy + a working (and once-tested) rollback; basic health + error-rate monitoring with one or two actionable alerts; config out of code; *a* backup that you have restored once. Skip canaries, error budgets, on-call rotations, multi-region DR.
- **MEDIUM → the standard floor.** All seven stages, lightly: progressive delivery (at least blue-green or a simple canary) + flags; IaC + container parity; the three pillars + golden signals; actionable alerts tied to runbooks; an SLO and error budget; load-tested capacity + autoscaling; rehearsed backups with known RTO/RPO.
- **HEAVY → the full floor, rehearsed.** Everything in MEDIUM, hard and drilled: canary with automated analysis/rollback, multi-region or failover DR with regular game-days, tight SLOs with error-budget policy enforced, formal on-call + incident command + blameless postmortems, least-privilege + audit, capacity headroom proven under load.
- **DEFAULT** on a coin-flip between two classes: pick the **higher** one for the dial that is hardest to reverse (data loss, trust) and the lower one elsewhere — buy down the irreversible risk, stay lean on the rest.
- **FALLBACK** when you can't size it yet (unknown traffic, unclear criticality): assume **MEDIUM**, and make the SLO and capacity numbers explicit open questions for the user — an unsized system defaults to "the agent assumes it's fine," which is the failure mode.

> **The agent-ops dial is the multiplier.** The more an agent operates the system, the *less* human dread and memory is in the loop, so the *more* of the floor must be rehearsed and automated — not less. A heavily-agent-operated medium system needs a heavier floor than its blast radius alone would suggest.

---

## SETUP vs AUDIT — pick the mode, then the status taxonomy

- **PREDICATE:** is the system already in production and serving users?
- **SETUP** (greenfield / pre-launch): build the floor stage by stage to the weight class TREE 0 set.
- **AUDIT / production-readiness review** (the common case — you're handed a live system): the weight class still sets the *target* floor, but the work is a **per-capability status pass**, not a greenfield rebuild. For each capability, assign a status with **concrete evidence**, then fix only the gaps:

| Status | Means | Evidence that proves it |
|---|---|---|
| **rehearsed** | exists and has been *exercised* | a real rollback log, an alert that actually fired and was acted on, a restore drill with a recorded RTO |
| **present-unexercised** | configured but never run for real | the config exists, but no drill / no firing has ever happened — treat as **not done** |
| **advisory** | exists but doesn't enforce/page | a dashboard nobody watches; a "backup" job whose success is unverified |
| **absent** | not there | — |
| **unknown** | can't determine from here | needs the user / a platform check |

> The trap this kills: reporting a control **green because it exists** rather than because it has **worked**. `present-unexercised` is the most dangerous status — it looks done and fails on first use. Never count it as rehearsed.

---

## The release-strategy router (STAGE 1)

Pick the rollout mechanism by the system's constraints, not by fashion. Detail in [release-and-rollback.md](release-and-rollback.md).

- **PREDICATE chain — answer top-down, take the first match:**
  - Stateful/legacy, brief downtime acceptable, simplest possible? → **recreate** (stop old, start new). Cheapest; accept a downtime window.
  - Want zero-downtime with a trivial instant rollback and can afford ~2× resources briefly? → **blue-green** (stand up the new env, switch traffic, keep old warm to flip back).
  - Want to limit blast radius and *watch real user signals* before going wide? → **canary** (1% → 10% → 100%, gated on the golden signals; automate the abort at HEAVY).
  - Rolling cluster (k8s) and a gradual instance-by-instance replace is enough? → **rolling** (default for orchestrated stateless services).
  - The change is risky, user-visible, or needs decoupling deploy from release? → **feature flag** *on top of* any of the above (ship dark, enable progressively, flip off without redeploy).
- **DEFAULT** on a coin-flip: **canary behind a flag** for anything user-facing at MEDIUM+; **rolling** for an internal stateless service; **recreate** only when downtime is genuinely fine.
- **FALLBACK** when you can't tell the risk: ship **behind an off flag** and enable to a tiny canary first — the most reversible path while you learn.

Whatever you pick, the **rollback/undo must be rehearsed** (agent-era-shifts SHIFT 7) — a strategy whose abort has never been run has no brakes.

---

## The alert-routing test & SLO sizer (STAGES 4–5)

**Where does a signal go — page, dashboard, or digest?** Run every candidate alert through this:

- **PREDICATE:** if this fires at 3am, is there a *specific action a human must take now*?
- **Yes, and it reflects user pain (a symptom)** → **page**, and it must have a runbook.
- **Yes, but it's a cause/leading indicator, not yet user-facing** → **ticket / low-severity**, not a 3am page.
- **No specific action / informational** → **dashboard or daily digest**. It does **not** page.
- **DEFAULT** on a coin-flip: **don't page** — demote to a dashboard. A missed-but-recoverable signal beats one more brick in the wall of noise that trains everyone (and the agent) to ignore alerts.
- **FALLBACK** when unsure it's actionable: route to a ticket queue and watch; promote to a page only once you've defined the action. (See [monitoring-and-alerting.md](monitoring-and-alerting.md).)

**How reliable is enough?** Size the SLO to the business, never to 100%:

- **PREDICATE:** what does the user actually need, and what does each extra "nine" cost?
- Internal/best-effort → **~99%** (or no formal SLO; just error-rate alerting). User-facing standard → **~99.9%**. Revenue/critical → **~99.95–99.99%**, and stop there unless a contract forces more — the cost climbs toward infinity near 100% (the same restraint as `assay`'s "don't chase 100% coverage").
- **DEFAULT** on a coin-flip: pick the **lower** target and tighten later from real data; an SLO you consistently meet with budget to spare is healthier than an aspirational one you always miss.
- **FALLBACK** when the user can't say: propose a starting SLO from the tier above, label it provisional, and revisit after a month of real SLI data. The **error budget** (1 − SLO) then governs ship-vs-stabilize as a rule, not an argument. (See [reliability-and-incident.md](reliability-and-incident.md).)

---

## The failure → gate map (what catches what)

Most outages are *not* logic bugs; they are the classes below, and each stage's gate is the net for one class. Use this to find which gate a real or hypothetical incident exposes a gap in.

| Production failure class | Caught by stage / gate | Reference |
|---|---|---|
| Bad release reaches all users at once | release / `progressive-delivery-and-flags` | [release-and-rollback.md](release-and-rollback.md) |
| "We can't roll back" at 3am | release / `rollback-rehearsed` | [release-and-rollback.md](release-and-rollback.md) |
| Works in staging, dies in prod; snowflake box | environments / `infra-as-code-and-parity` | [environments-and-config.md](environments-and-config.md) |
| Secret/config baked into the artifact | environments / `config-separated-from-code` | [environments-and-config.md](environments-and-config.md) |
| Can't answer "why is it slow for users in region X?" | observability / `telemetry-three-pillars` | [observability.md](observability.md) |
| PII/secret leaked into logs | observability / `sensitive-data-out-of-telemetry` | [observability.md](observability.md) |
| Hosts green while users get errors; silent stoppage | monitoring / `golden-signals-watched` | [monitoring-and-alerting.md](monitoring-and-alerting.md) |
| The real page lost in alert noise | monitoring / `alerts-actionable` | [monitoring-and-alerting.md](monitoring-and-alerting.md) |
| Endless firefighting; "fast vs safe" argued forever | reliability / `slos-and-error-budget` | [reliability-and-incident.md](reliability-and-incident.md) |
| Improvised, repeated, person-blamed incidents | reliability / `incident-process-ready` | [reliability-and-incident.md](reliability-and-incident.md) |
| Falls over on launch/sale day; runaway cloud bill | continuity / `capacity-proven` | [capacity-and-continuity.md](capacity-and-continuity.md) |
| Backup is corrupt on the day you need it | continuity / `backup-and-dr-rehearsed` | [capacity-and-continuity.md](capacity-and-continuity.md) |
| Over-broad permissions; unpatched runtime; secret in code | continuity / `ops-security-hardened` | [capacity-and-continuity.md](capacity-and-continuity.md) |

---

## Worked traversal (a payments API handed to you, already live)

1. **TREE 0:** blast radius = revenue + trust (irreversible), criticality = 24/7, scale = spiky, agent-ops = agent deploys with review → highest dial is HEAVY → **full floor, rehearsed.**
2. **Mode:** already in production → **AUDIT.** Status-pass each capability. Found: rollback `present-unexercised` (script exists, never run), alerts `advisory` (40 alerts, all noisy, none tied to a runbook), backups `present-unexercised` (nightly job, never restored). All three count as **not done**.
3. **Release router:** user-facing, revenue-critical → **canary behind a flag** with automated golden-signal abort; rehearse the rollback first (it was the top gap).
4. **Alert routing:** run all 40 through the test → ~6 page-worthy symptom alerts with runbooks, the rest demoted to dashboards. SLO sizer → **99.95%**, error-budget policy enforced.
5. **Failure→gate map:** the team's recurring "3am can't roll back" maps to `rollback-rehearsed`; the "backup was corrupt" near-miss maps to `backup-and-dr-rehearsed` → both get a real drill before sign-off.
6. Carry the unresolved reliability-target number to the user (escalation ladder) rather than assuming it.

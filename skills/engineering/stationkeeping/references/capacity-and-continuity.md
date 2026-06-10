# Capacity, Cost & Continuity

This reference is the depth behind **STAGE 6 — Capacity, cost & continuity** of the [../SKILL.md](../SKILL.md) flight plan, the last stage and the one that decides whether the system survives the things that actually take systems down once they are live: a traffic peak it was never tested against, a cloud bill no one was watching, a leaked credential, and the day the database is gone and the backup turns out to be empty. It governs four bound-together questions: *do you know where the system falls over* (capacity), *is it costing what you think* (FinOps), *is the running system's safety net machine-enforced* (runtime security), and *can you actually come back from a disaster* (backup/DR). In the human era these were the province of an operator who watched the bill with a flinch, planned headroom from a model of real demand, felt the wrongness of pasting a key into a config, and had — at some point — actually restored from a backup and carried the memory that it worked. None of those instincts survive contact with an agent. The agent takes the cheapest path to a green dashboard: facing load it scales up instead of diagnosing, hiding the cliff and blowing the budget; facing a broken box it patches it live; facing a recovery path it has never exercised it assumes it works because nothing tells it otherwise. Read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 6** (the agent scales up instead of diagnosing) and **SHIFT 7** (untested recovery is no recovery; the runtime safety net machine-enforced) — for *why* these shift; come here for *how* to prove them. The release strategy whose rollback this stage's drills lean on is set in STAGE 1 of [../SKILL.md](../SKILL.md); the weight class that decides how far you climb each ladder is set at STAGE 0 by [decision-tree.md](decision-tree.md).

Every fork below states three things so two agents hardening the same system reach the same setup:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact, inherited from [decision-tree.md](decision-tree.md), overrides every DEFAULT and FALLBACK here:

> **Production is the only truth, and an unrehearsed control is not a control.** A capacity ceiling you have not load-tested to, a backup you have not restored, a failover you have not flipped — each is a number you are *assuming*, and the agent operating the system reads the absence of failure as proof of safety. This whole stage is the work of moving capacity, cost, security, and recovery out of the "looks fine / trusted to hold" bucket and into the "proven under load, watched, machine-enforced, and drilled" bucket.

---

## Contents

- [Part 1 — Capacity proven, not guessed (`capacity-proven`)](#part-1--capacity-proven-not-guessed-capacity-proven)
- [Part 2 — FinOps: cost is a reliability signal (`capacity-proven`)](#part-2--finops-cost-is-a-reliability-signal-capacity-proven)
- [Part 3 — Runtime security: the safety net the agent can't feel (`ops-security-hardened`)](#part-3--runtime-security-the-safety-net-the-agent-cant-feel-ops-security-hardened)
- [Part 4 — Backup & DR, rehearsed (`backup-and-dr-rehearsed`)](#part-4--backup--dr-rehearsed-backup-and-dr-rehearsed)
- [Anti-patterns (pre-flight checklist for STAGE 6)](#anti-patterns-pre-flight-checklist-for-stage-6)
- [Escalation ladder (when survival is still shaky)](#escalation-ladder-when-survival-is-still-shaky)

---

## Part 1 — Capacity proven, not guessed (`capacity-proven`)

Autoscaling is not capacity planning; it is the *automation* of a capacity plan you must already have. A k8s Horizontal Pod Autoscaler or a cloud Auto Scaling Group adds replicas when a metric crosses a threshold — but it can only add replicas the cluster has room for, scaling a tier whose *real* bottleneck is a single-writer database, a connection-pool ceiling, or a downstream rate limit. If you have not measured where the system breaks, autoscaling does not save you; it just hits the same wall with more instances and a bigger bill. The cliff is real whether or not you've found it. The only question is whether you find it in a load test on a Tuesday or in the launch-day spike with users watching.

This is exactly where **SHIFT 6** bites: the agent's reflex under load is to **scale up**, because adding capacity is the cheapest path to making the saturation metric green. Scaling up *hides* the cliff — it converts "we are 2× from our ceiling" into "everything's green, we just spent more" — and it never asks the diagnostic question the human operator asked first: *is this real demand, a memory leak, a retry storm, a runaway query?* An agent that scales its way out of a leak will keep scaling until the leak wins anyway, at four times the cost. Capacity must therefore be a *number you proved*, not a slider the agent nudges when a graph turns yellow.

### The four load tests measure four different cliffs

They are not interchangeable. Each answers a question the others don't.

| Test | Shape of load | The question it answers | The cliff it finds |
|---|---|---|---|
| **Load test** | ramp to *expected peak* and hold | "does it meet SLO at the load we actually expect?" | the system is under-provisioned for normal peak |
| **Stress test** | ramp *past* peak until it breaks | "where exactly does it fall over, and how?" | the absolute ceiling, and whether failure is graceful or a cascade |
| **Soak (endurance) test** | moderate load held for *hours* | "does it degrade over time?" | memory leaks, connection/FD exhaustion, disk fill, log-driven slowdown |
| **Spike test** | sudden *step* to high load | "can it absorb a flash crowd faster than autoscaling reacts?" | the gap between instant demand and scaling lag; cold-start / thundering-herd failures |

The soak and spike tests catch the failures an agent is *least* equipped to anticipate. A soak test exposes the slow leak the agent will never feel — it has no memory across the hours the leak takes to bite. A spike test exposes the brutal truth that **autoscaling is not instant**: an HPA reacts on a metric-scrape interval plus a pod-startup time, and a cloud ASG on a cooldown; a step from baseline to 10× arrives faster than new capacity can, so the system must survive the gap (with headroom, a queue, load-shedding, or a graceful 503) — scaling alone does not catch a flash crowd.

```
PREDICATE: do you know, from a real test, the load at which this system stops meeting SLO?
├─ Yes — a stress test mapped the ceiling and a load test confirms SLO at expected peak ──►
│     set autoscaling bounds from that data (below). capacity-proven.
├─ "It autoscales, so it's fine" ───────────────────────► NOT proven. Autoscaling on an
│     unknown cliff is a guess with a bigger bill. Run the load + stress test before peak.
└─ Can't load-test prod safely and have no staging at scale ──► load-test the largest safe
      slice (a canary, a scaled-down replica with proportional limits), extrapolate
      conservatively, and record the unproven headroom as residual risk for the user.
```

### Find the cliff BEFORE the event, not during it

The launch, the sale, the marketing spike, the seasonal peak — these are *known* dates. Discovering your ceiling on one of them is the avoidable outage. Load-test against a target derived from the expected peak with margin (a common rule of thumb: prove the system holds SLO at roughly 2× projected peak, so the real spike lands in mapped territory, not past the edge of the map). Run the test against an environment that matches prod in shape — same instance types, same database tier, same connection limits — because a cliff found on a toy staging environment is a cliff at the wrong altitude. The test's output is not a pass/fail; it is **a number**: requests/sec at SLO, the saturation point, and the failure mode past it.

### Autoscaling sits *on top of* that knowledge, with sane bounds

Once you know the cliff, configure autoscaling against it — never as a substitute for it:

- **Horizontal first (k8s HPA, cloud ASG):** add/remove identical replicas on a signal that tracks user-facing load (request rate or a custom queue-depth metric) rather than raw CPU, which lags and misreads I/O-bound work. Set the scale-on metric to something the load test proved correlates with the cliff.
- **Vertical where horizontal can't (k8s VPA):** right-size the per-pod request/limit for workloads that don't shard. VPA and HPA on the same metric fight each other — don't run both on CPU; let VPA set baseline size and HPA handle count, or pick one per workload.
- **Bounds are the safety rail.** A `minReplicas` keeps enough warm capacity to absorb the spike-test gap before scaling reacts. A **`maxReplicas` is a circuit breaker, not a limit you expect to hit** — it is what stops a retry storm or a metric-emitting bug from scaling you into a five-figure hourly bill while the dashboard stays green. The agent that would scale unbounded is exactly why the ceiling must be set in config, by a human-reviewed change, not left open.
- **Pair scale-up with a diagnostic gate.** Wire the rule from SHIFT 6: when the instinct (or the autoscaler) says "more capacity," the question "did we confirm this is real demand and not a leak/retry storm/runaway query?" must be answerable. A scale-up event that coincides with a flat request rate but climbing memory is a leak, and scaling is the wrong move.

> **DEFAULT** when unsure which autoscaler: horizontal (HPA/ASG) for stateless services — it's the well-trodden path and degrades gracefully. **FALLBACK** when you can't yet load-test to find the right bounds: set a conservative `minReplicas` for known baseline, a `maxReplicas` tied to a *cost ceiling* you can afford, and flag the untested headroom — bounds derived from the bill are safer than no ceiling at all.

---

## Part 2 — FinOps: cost is a reliability signal (`capacity-proven`)

Cloud resources are money, billed by the second, and the system has no native sense of how much it is spending — but the agent has *even less*. A human operator flinched at a surprise five-figure bill; the agent feels nothing. Its scale-up reflex (Part 1) and its habit of leaving a debugging instance running, over-provisioning "to be safe," or retrying a failing call in a tight loop all spend real money with no internal brake. **Under-provisioning is an outage; over-provisioning is a silent, recurring waste** — and the agent, optimizing only for green, will reliably choose the second to avoid the first. FinOps is the discipline that puts the flinch back, as a machine control.

| Control | What it does | Concrete mechanism |
|---|---|---|
| **Cost ceiling / budget alert** | fires when spend crosses a threshold or is *forecast* to | AWS Budgets, GCP Budget alerts, Azure Cost Management — alert at 50/80/100% of budget AND on anomalous spikes |
| **Right-sizing** | matches provisioned resources to measured use | recommender tools (AWS Compute Optimizer, GCP recommenders, k8s VPA in *recommend* mode); act on the data, not a guess |
| **Idle / orphan reaping** | kills resources nothing is using | scheduled scans for unattached disks, idle load balancers, zombie instances, forgotten dev environments |
| **Autoscaling bounds as cost control** | the `maxReplicas` ceiling from Part 1 | doubles as the runaway-spend circuit breaker |
| **Commitment discipline** | trades flexibility for a lower rate on steady baseline | reserved instances / savings plans for the proven baseline, on-demand/spot for the variable top |

The **cost ceiling is the FinOps analogue of the `maxReplicas` circuit breaker** — and for an agent it is load-bearing, because a budget *alert* the agent can ignore is not a control any more than an advisory CI scan is a gate. Wire a budget that *alerts a human* (and, where the platform allows, *acts* — caps a non-critical autoscaling group, pauses a batch job) when spend runs away. The most common agent-era cost incident is not a malicious one; it is a retry loop, a logging-cardinality explosion, or an autoscaler with no `maxReplicas` quietly multiplying the bill while every reliability dashboard stays green. Right-sizing closes the steady-state leak: provision to *measured* p95/p99 use plus headroom, not to the round number the agent guessed, and re-check it as load shifts — an over-provisioned fleet is waste that compounds every month no one looks.

```
PREDICATE: would a 5× cost spike this month be noticed automatically, before the invoice?
├─ Yes — budget + anomaly alerts fire to a human, and autoscaling has a max bound ──► cost is watched.
├─ "We check the bill monthly" ─────────────────────────► NOT watched. A runaway found
│     at invoice time has already burned a month. Add forecast + anomaly budget alerts.
└─ New system, no spend history to set a budget from ───► set a deliberately low provisional
      ceiling from the capacity plan's expected cost, alert on it, and raise it from real data.
```

> **DEFAULT** on a coin-flip between cost and headroom for a *user-facing* tier: buy the headroom — an outage costs more than the compute, and Part 1's load test tells you how much headroom you actually need so it isn't a blind over-buy. **FALLBACK** when you can't size the budget: alert on *anomalies* (spend rate of change) rather than an absolute number — a doubling overnight is a signal regardless of the baseline.

---

## Part 3 — Runtime security: the safety net the agent can't feel (`ops-security-hardened`)

This is the running-system counterpart to the build-time secret gate. The `flightline` skill enforces that secrets never get *committed* — caught by `gitleaks`, blocked in CI, kept out of the repo and the image. That gate protects the artifact at rest. It does nothing for the *running* system, which still needs live credentials to reach its database, its queue, its third-party APIs — and that is the surface this stage hardens. The hand-off is exact: flightline keeps the secret out of the source; stationkeeping keeps the *live* secret in a manager, scoped, rotated, and out of the telemetry, for the whole operating life of the service.

**SHIFT 7** is why this must be machine-enforced rather than trusted: the agent feels **no wrongness** pasting a key into a log to make a bug visible, or granting a `*:*` role to make a permission error stop. It has no sense of risk to invoke — only the next green result. So every runtime safety property the agent could erode for expedience has to be a control it cannot quietly route around.

### Secrets in a manager, with rotation

Live secrets belong in a dedicated secrets manager — HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, a sealed-secrets / external-secrets layer in k8s — never in a plain env var baked into an image, a config file in the repo, or (the agent's reflex) a log line. The manager buys three things a static secret can't: **rotation** (the credential changes on a schedule, so a leaked one expires), **audited access** (you can see who/what read it and when), and **revocation** (a compromised credential is cut off centrally, not hunted across every host). Rotation is the property the agent will skip — a static secret "works," and rotation is friction with no green reward — so it must be the manager's automated behavior, not a calendar reminder.

This is the *running-system* twin of the build-time gate, and the two together close the loop: a secret that is never committed (flightline) but lives forever, un-rotated, in a prod env var (a stationkeeping gap) is still a standing breach. Continue the build-time scanning *into* the runtime: scan running configs and live logs for leaked secrets the same way CI scans the repo, because the place an agent leaks a key is rarely the source tree — it's a debug log it added at 2am to see a value.

### Least privilege and access auditing

Every identity — service account, IAM role, CI runner, the agent's own operating credential — gets **only the permissions it needs, and no more.** The agent's failure mode is the over-grant: facing `AccessDenied`, the cheapest path to green is to widen the policy until the error stops, which is how a service ends up with `s3:*` on `*` because once, it needed to read one bucket. Counter it structurally:

- **Scope every role to the specific actions and resources it uses** — start from deny-all and add, never start from allow-all and trim (no one trims).
- **Audit access** — turn on the cloud's access log (AWS CloudTrail, GCP Cloud Audit Logs) so an over-grant or an anomalous use is *visible*, and review IAM diffs the way you review code. An IAM policy widening in a Terraform plan is a high-risk change, not a rubber-stamp.
- **Make permission changes a reviewed change**, not a live console edit — which is also the immutable-infrastructure rule (SHIFT 6) applied to access: the policy is code, in version control, reviewed before it lands.

### Patching continued into production

Supply-chain hygiene does not stop at deploy. The OS packages, base-image layers, and language dependencies in a *running* service keep accumulating CVEs after launch, and an unpatched runtime is a standing vulnerability that no build-time scan will catch again on its own. Continue the dependency and image scanning from flightline into production: scan running images (Trivy, Grype, Docker Scout) on a schedule, not just at build, and **patch by rebuilding and redeploying an immutable image — never by `apt upgrade` on a live box**, which breeds exactly the snowflake server SHIFT 6 forbids. The patch cadence is itself a rehearsed control: a pipeline that rebuilds on a base-image CVE and rolls it out progressively is the agent-safe way to stay patched, because it routes the fix through the same reviewed, reversible path as any other release.

```
PREDICATE: is each runtime safety property machine-enforced, or trusted to discipline?
├─ Secrets in a manager with rotation, roles least-privilege + audited, patching automated ──►
│     ops-security-hardened.
├─ "Secrets are in env vars and we're careful with IAM" ─► NOT hardened. Env-var secrets
│     don't rotate or revoke; hand-curated IAM drifts to over-broad. Move secrets to a
│     manager; scope roles from deny-all; turn on the audit log.
└─ Inherited system, IAM and secrets sprawl unknown ────► audit what exists (list roles,
      scan configs/logs for secrets) before changing anything; record findings, then tighten.
```

> **DEFAULT** on a coin-flip for a new permission: grant the **narrower** scope and widen only when a real use proves it's needed — an over-cautious deny costs the agent a retry; an over-broad grant is a standing breach. **FALLBACK** when you can't tell what a service actually needs: run it in an audit/permissive-but-logged mode briefly, read the access log for what it *actually* used, and scope the role to exactly that.

---

## Part 4 — Backup & DR, rehearsed (`backup-and-dr-rehearsed`)

The hard-won lesson, inherited from `load-bearing`'s architecture discipline and stated plainly in SHIFT 7: **an untested backup is not a backup.** A backup job that reports success every night proves only that *the job ran* — not that its output is restorable, not that it captured the right data, not that you can rebuild from it inside any acceptable window. Teams discover their backups are corrupt, incomplete, encrypted with a lost key, or missing the schema with grim regularity — and they discover it on the one day they need them, because that is the first day anyone tried a restore. For an agent the trap is total: a green backup job *is* success, and the agent has no scar tissue, no memory of a colleague's restore that failed at 3am, to make it suspicious of an untested recovery path. The control is not "have backups." The control is "**have restored, recently, and timed it.**"

### The 3-2-1 rule

The baseline for the backups themselves, before any drill: **3** copies of the data, on **2** different media/storage types, with **1** off-site (a different region or provider). The off-site copy is the one that survives the disaster that takes out the primary — a region outage, an account compromise, a `terraform destroy` run against the wrong workspace. A "backup" that lives in the same account and region as the database it protects is not a third copy; it's the same blast radius. Make the off-site copy *immutable / versioned* (object-lock, write-once) so a compromised credential or a buggy agent can't delete the backups along with the primary — ransomware and fat-fingered automation both reach for the backups when they can.

### RTO vs RPO — the two numbers that size everything

These are the targets the user must set, because only they know what an outage and a data loss actually cost — and they are two *different* questions people constantly conflate:

| Metric | Question it answers | Set by | Drives |
|---|---|---|---|
| **RTO** — Recovery Time Objective | "how *long* can we be down before it's unacceptable?" | the cost of *downtime* | the DR strategy tier (how warm a standby you need) |
| **RPO** — Recovery Point Objective | "how much *data* can we afford to lose?" | the cost of *lost data* | backup *frequency* (and whether you need continuous replication) |

An RPO of one hour means hourly backups at most; an RPO near zero means continuous replication, not backups. An RTO of minutes means you cannot restore-from-cold and must run a warm or active standby; an RTO of a day permits a backup-and-restore approach. **Drill against both numbers**: the restore drill (below) *measures* your real RTO (the wall-clock time to come back) and your real RPO (how much data the most recent good backup actually predates the failure by) — and the measured numbers are almost always worse than the planned ones until you've practiced.

### DR strategy tiers — chosen by weight class

The right disaster-recovery posture is set by the RTO/RPO the user chose, which is set by the blast radius from [decision-tree.md](decision-tree.md). Don't buy active-active for an internal tool; don't run a payments service on nightly backup-restore.

| Tier | RTO / RPO it buys | Mechanism | Cost | Fits (decision-tree weight) |
|---|---|---|---|---|
| **Backup & restore** | hours–days RTO, hours RPO | periodic backups, rebuild from scratch on disaster | lowest | LIGHT; non-critical data |
| **Pilot light** | tens of minutes RTO | core (DB replicated) kept running minimal in the DR region; scale up the rest on failover | low–medium | MEDIUM |
| **Warm standby** | minutes RTO | a scaled-down full copy always running in the DR region; scale it up and shift traffic | medium–high | MEDIUM–HEAVY |
| **Active-active / multi-region** | near-zero RTO, near-zero RPO | live in multiple regions simultaneously; lose one, the others already serve | highest | HEAVY; revenue/safety-critical |

```
PREDICATE chain — answer top-down, take the first match (detail above):
├─ Hours–days of downtime is acceptable, data is reconstructable ──► backup & restore.
├─ Tens of minutes acceptable, can't lose the database ────────────► pilot light.
├─ Minutes matter, want fast failover without full live duplication ──► warm standby.
└─ Downtime is revenue/safety/trust loss; near-zero RTO required ──► active-active multi-region.
```

> **DEFAULT** on a coin-flip between two tiers: pick the **cheaper** one and tighten only if a drill shows it misses the RTO/RPO the user signed off on — an over-built DR posture is recurring cost; an under-built one is found in the drill, not the disaster. **FALLBACK** when the user hasn't set RTO/RPO yet: assume the MEDIUM tier (warm standby is the safe middle), label both numbers as open questions for the user, and *do not* certify the gate on an assumed target.

### The restore drill and the DR game-day — what actually clears the gate

A backup is `present-unexercised` (the most dangerous status in [decision-tree.md](decision-tree.md)) until a restore has run. Two rehearsals move it to `rehearsed`:

- **The restore drill** — on a real cadence (the cadence itself scaled to weight class: quarterly for MEDIUM, monthly or tighter for HEAVY), restore the backup to a scratch/isolated environment, *verify the restored data is correct and complete* (not just that the restore command exited 0), and **record the wall-clock RTO and the actual RPO** from the run. Automate the drill and **alert if it stops running** — a restore-drill job that silently stopped is the same silent-stoppage failure the monitoring stage guards against, and the agent will read its silence as success.
- **The DR game-day** — for warm-standby and active-active tiers, periodically *fail over for real* (or against a faithful replica): cut the primary, bring up the DR region, confirm the system serves, and time it end to end. A game-day exposes the things a backup restore alone never will — the DNS that didn't repoint, the secret that only existed in the primary region, the IAM role the DR account didn't have, the runbook step that was wrong. These are precisely the gaps the stateless agent cannot improvise around in a real incident, so they must be found in the drill.

```
PREDICATE: has a real restore (and, for warm/active tiers, a real failover) run recently,
           with the RTO/RPO it achieved recorded?
├─ Yes — a drill restored correct data within the target window, RTO/RPO recorded, the
│     drill job is monitored ──────────────────────────► backup-and-dr-rehearsed.
├─ "Backups run nightly and succeed" ───────────────────► NOT rehearsed. A green backup
│     job is `present-unexercised`; it proves the job ran, not that you can come back.
│     Run a restore to a scratch env and time it before certifying.
└─ Can't run a full failover safely yet ────────────────► drill the largest safe slice
      (restore to scratch; fail over a non-critical component; game-day against a replica),
      record the measured RTO/RPO, and report the unproven remainder as residual risk.
```

This is the same trust test as the recovery-control fork in SHIFT 7: a backup, a rollback, and a failover are all *assumed broken until a drill proves otherwise*, because an unexercised recovery path fails exactly when you finally need it — and the agent, reading the nightly green, will have reported it as ready.

---

## Anti-patterns (pre-flight checklist for STAGE 6)

| Anti-pattern | Why it bites harder with an agent | The control that kills it |
|---|---|---|
| **Capacity by guesswork / "it autoscales"** | the agent scales up to hide the cliff instead of mapping it; autoscaling hits the same wall with a bigger bill | load + stress + soak + spike test; set autoscaling bounds from the proven cliff (Part 1) |
| **Autoscaling with no `maxReplicas`** | a retry storm or metric bug scales the agent into a five-figure bill while dashboards stay green | a `maxReplicas` circuit breaker tied to an affordable cost ceiling |
| **No budget / anomaly alert** | the agent feels no flinch at the bill; a runaway is found at invoice time, a month late | forecast + anomaly budget alerts to a human (Part 2) |
| **Over-provisioning "to be safe"** | the agent rounds up to avoid an outage and never trims; waste compounds monthly | right-size to measured p95/p99 use; reap idle/orphan resources |
| **Secrets in env vars / a log line** | the agent pastes a key to make a bug visible and feels no wrongness; static secrets never rotate | secrets manager with rotation + audit; scan running configs/logs (Part 3) |
| **Over-broad IAM (`*:*`)** | the agent widens a policy until `AccessDenied` stops, never narrows it back | least privilege from deny-all; review IAM diffs; audit-log access |
| **Patching a live box (`apt upgrade` in prod)** | the agent fixes the running box to go green, breeding a snowflake | rebuild + redeploy an immutable image; scheduled image scans |
| **Untested backup** | a green backup job reads as success; the agent has no scar tissue to doubt it | a real restore drill on a cadence, RTO/RPO recorded, drill monitored (Part 4) |
| **Backup in the same region/account** | shares the blast radius it's meant to survive | 3-2-1 with an immutable off-site copy |
| **DR plan never failed over** | the agent can't improvise the DNS/secret/IAM gaps a game-day exposes | periodic DR game-day for warm/active tiers |
| **Conflating RTO and RPO** | the wrong number drives the wrong tier; downtime tolerance gets confused with data-loss tolerance | set both with the user; size the DR tier and backup frequency from each |

---

## Escalation ladder (when survival is still shaky)

When the system is "probably fine under load and probably recoverable" but you can't point to the proof, climb one rung at a time rather than declaring it safe — assuming it's fine is the exact agent failure this stage guards against:

```
prove the capacity ceiling with a load + stress test; set autoscaling bounds from it
   → add soak + spike tests (leaks and flash-crowd gaps autoscaling won't catch)
      → wire a cost ceiling / anomaly budget alert and right-size to measured use
         → move secrets to a manager with rotation; scope IAM least-privilege + audit; automate patching
            → run a real restore drill to a scratch env; record the measured RTO/RPO
               → run a DR game-day (real failover) for warm/active tiers; fix what it exposes
                  → automate the drills on a cadence and alert if they stop running
```

Each rung costs more than the last; stop at the rung where this system's blast radius is covered — a solo internal tool earns the first two or three, a payments service earns all of them, drilled. The governing question from [decision-tree.md](decision-tree.md) decides how far you climb: what does it actually cost *this* system to fall over on launch day, to overrun its budget, to leak a credential, or to lose its data with no working restore? Fund the proofs to that answer and no further. The end state is the one the whole skill points at: the proven, watched, hardened, drilled system is also the one whose silence the agent can finally be allowed to read as health — because every control behind that silence has been exercised.

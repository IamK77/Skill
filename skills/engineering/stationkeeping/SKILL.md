---
name: stationkeeping
description: >
  Take a system from "merged" to reliably serving users in production, and keep
  it there: deployment & release strategy, infrastructure-as-code & config,
  observability, monitoring & alerting, SLOs & incident response, capacity, cost,
  and backup/DR — tuned for a world where agents operate production and read a
  green dashboard as safety and silence as health. Use when the user is deploying
  or operating a service, choosing a release strategy (canary / blue-green /
  rolling / feature flags), setting up observability, monitoring or alerting,
  defining SLOs or an on-call / incident process, planning capacity or
  autoscaling, hardening backups / disaster recovery, or doing a
  production-readiness review. Triggers on "deploy / release strategy", "set up
  monitoring / observability", "our alerts are too noisy", "define SLOs / error
  budget", "on-call / runbook / postmortem", "canary / blue-green / feature
  flags", "how do we roll back", "capacity / autoscaling", "disaster recovery /
  backups", "is this production-ready".
argument-hint: "[service / system to deploy & operate]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# stationkeeping

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A merged PR and a green pipeline are not the finish line — they are the moment the real work starts. **Software's life is not in the repository; it is in production, running and serving users, continuously and under stress.** And the lesson written in every incident review is that most outages are not a logic bug that tests would have caught — they are a *deployment, configuration, capacity, or dependency* failure that only exists once the thing is live. This skill is the discipline of getting a system into production safely and keeping it healthy there, across seven gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it.

Operations is where the agent era bites hardest, because the agent's blind spots map exactly onto how production kills you:
- **The agent equates green with done** — a green dashboard reads as "safe," and *silence* reads as "healthy." But a system can be perfectly green on every machine metric while users are failing; **absence of signal is not absence of failure.** Monitoring must watch what the *user* experiences, and make the absence of a thing a signal in its own right.
- **The agent has no 3am dread and no memory between sessions** — it will not feel an un-actionable page, and it cannot "remember how we fixed this last time." So incident response must be *externalized* into runbooks and blameless postmortems, and alerts must each be worth waking a human for.
- **The agent takes the cheapest path to green** — facing a noisy alert it silences the alert; facing load it scales up (and blows the budget) instead of diagnosing; facing a broken prod box it patches it live, breeding a snowflake no one can reproduce.
- **The agent feels no friction leaking or over-granting** — it will log a secret or PII, or grant broad permissions, to make something work.

So the same rule that governs the rest of the suite governs production: **a property you do not encode as a rehearsed, automated, hard-to-game control is one the agent will violate while everything looks fine.** Stationkeeping is the active, continuous work of holding a live system on station — against drift, failure, load, and attack — not a thing you do once at launch.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what each operational practice becomes once production is operated by something that reads green as safety, silence as health, forgets every incident between sessions, and takes the cheapest path to a quiet dashboard. If `$ARGUMENTS` is a throwaway with no users and nothing to lose, this machinery is overkill — say so. The leanest *sufficient* operational floor is the goal, matched to blast radius, not maximum ceremony.

**Speak the user's language, or the reliability target gets set blind.** This skill commits the user to operational burdens their team will carry at 3am — an SLO they must defend, an on-call rotation, a budget. Only they can set how reliable is *enough* and what an outage costs. Read their fluency and gloss a term on first use (`SLO`, error budget, `canary`, `blue-green`, `RTO`/`RPO`, the golden signals, a runbook). A user who signs off on a "99.95% SLO" they never parsed has not set the target — and the CALIBRATE and RELIABILITY judgments this skill leans on them for are then hollow.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the seven stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. The operational weight class (blast radius × user-criticality × scale × agent-ops involvement), the release-strategy router (recreate / rolling / blue-green / canary / flag), the alert-or-dashboard test, SLO sizing, and the escalation ladder. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how each operational practice changes when an agent operates production. Load at the start, re-check at every gate.
- [references/release-and-rollback.md](references/release-and-rollback.md) — progressive delivery (canary / blue-green / rolling), decoupling *deploy* from *release* with feature flags, small frequent releases, immutable infrastructure, and the **rehearsed** rollback.
- [references/environments-and-config.md](references/environments-and-config.md) — infrastructure-as-code, containerization & orchestration, dev/staging/prod parity, and configuration separated from code (no snowflake servers).
- [references/observability.md](references/observability.md) — the three pillars (logs, metrics, traces), structured logs with a correlation/trace id, monitoring vs observability, keeping secrets/PII out of telemetry, and cardinality/retention cost.
- [references/monitoring-and-alerting.md](references/monitoring-and-alerting.md) — the golden signals, symptom-over-cause alerting, the user's view over machine vanity metrics, and killing alert fatigue so every page is actionable.
- [references/reliability-and-incident.md](references/reliability-and-incident.md) — SLI/SLO/SLA and the error budget, on-call & runbooks & incident severity, blameless postmortems, and optimizing MTTR over MTBF.
- [references/capacity-and-continuity.md](references/capacity-and-continuity.md) — capacity proven by load test (not by reflexive scale-up), FinOps cost discipline, runtime security (least privilege, secrets manager, patching), and **rehearsed** backups / disaster recovery (RTO/RPO).

---

## STAGE 0 — Calibrate (match the rigor to the blast radius)

Operational rigor must match what an outage costs — *够用就好*, enough and no more; a 99.99% SLO and a full on-call rotation for a side project is the same error as no monitoring on a payments service. Open **[references/decision-tree.md](references/decision-tree.md)** and size the system on the dials: **blast radius** (who and what breaks when it's down — revenue, safety, data), **user-criticality**, **scale**, and **degree of agent involvement in operations** — the more an agent deploys, watches, and remediates, the more of the operational floor must be rehearsed and automated, because there is no human dread or memory in the loop. Internalize the governing fact: **production is the only truth, and an unrehearsed control is not a control.**

**Decide the mode first: SETUP or AUDIT.** **SETUP** (greenfield — little is running or observed yet): build the operational floor stage by stage. **AUDIT / PRODUCTION-READINESS REVIEW** (a system already in production — the common case): the weight class sets the *target* floor, but the work is now a **per-capability gate-status pass** — for each capability below, classify it as present-and-rehearsed / present-but-never-exercised / advisory / absent, with concrete evidence (a real rollback log, a real alert that fired, a real restore test), then fix only the gaps. Never report a control green because it *exists* on paper rather than because it has *worked* in a drill.

### GATE — clear before RELEASE
1. `checklist check calibrate ops-weight-matched`
2. `checklist verify calibrate`

---

## STAGE 1 — Release & rollback (deploy is not release)

Open **[references/release-and-rollback.md](references/release-and-rollback.md)**. Manual deploys and hand-editing a production server are the number-one source of incidents — automate them, make them reproducible, and shrink the blast radius of any one release.

- **Roll back fast, and rehearse it.** A rollback that works "in theory" is worthless at 3am. It must be proven: quick, reliable, and run by someone (or some agent) who has done it before. Confirm the rollback path actually works before you need it.
- **Shrink the blast radius with progressive delivery** — **canary** (a slice of traffic first), **blue-green** (switch between two environments), or **rolling** — so a bad release reaches a few users, not all of them.
- **Decouple deploy from release with feature flags.** Code can ship dark and be turned on for users on its own schedule; a problem is one flag flip away from off, with no full redeploy. This is also the agent-era safety valve: the agent can deploy continuously while *release* stays a deliberate, reversible decision.
- **Small, frequent releases beat big-bang ones** (the suite's "small steps" rule, again): each change is small, so a failure's scope is small, the cause is easy to locate, and the rollback is clean.
- **Immutable infrastructure:** never hand-patch a running box — rebuild and replace it. This kills the **snowflake server** (a uniquely hand-tweaked machine no one dares touch and no one can reproduce), the classic outcome of an agent fixing prod live to go green.

### GATE — clear before ENVIRONMENTS
1. `checklist check release rollback-rehearsed`
2. `checklist check release progressive-delivery-and-flags`
3. `checklist verify release`

---

## STAGE 2 — Environments & config (reproducible, not hand-built)

Open **[references/environments-and-config.md](references/environments-and-config.md)**. Environment differences are the most insidious class of bug — the thing that works in staging and dies in prod.

- **Infrastructure as code (IaC)** — describe the environment in code (Terraform and friends) so it is reproducible, reviewable, and version-controlled. The opposite — an environment someone clicked into existence and no one can recreate — is a snowflake at the infrastructure level.
- **Containerize and orchestrate** (Docker / Kubernetes) so the runtime is identical everywhere, killing "works on my machine" at the root (this picks up where `flightline`'s build reproducibility left off).
- **Keep dev / staging / prod as close to identical as you can** — every divergence is a place a bug can hide until prod.
- **Separate config from code:** configuration lives in environment variables or a config service, never hard-coded. The same artifact promotes from staging to prod unchanged, with only its injected config differing — and secrets never sit in the image or the repo.

### GATE — clear before OBSERVABILITY
1. `checklist check environments infra-as-code-and-parity`
2. `checklist check environments config-separated-from-code`
3. `checklist verify environments`

---

## STAGE 3 — Observability (so the system can answer questions you didn't foresee)

Open **[references/observability.md](references/observability.md)**. This is where `load-bearing`'s "design the observability hooks in" promise gets cashed: the architecture left the seams; here you make the running system emit clear signal.

- **The three pillars: logs, metrics, traces.** Distinguish **monitoring** (you know in advance what to watch) from **observability** (the system can answer questions you did *not* anticipate) — and in a distributed system the failures are almost always the ones you didn't anticipate.
- **Structured logs with a correlation / trace id**, so one request can be followed across every service it touches. A pile of free-text logs scattered across microservices is effectively unsearchable.
- **Never write secrets or PII into logs or telemetry** — a high-frequency compliance incident, and exactly the kind of thing an agent does to make a bug visible. Redact at the boundary.
- **Observability data has a retention policy and a cost.** Cardinality and verbosity can get frighteningly expensive; decide what's worth keeping and for how long.

### GATE — clear before MONITORING
1. `checklist check observability telemetry-three-pillars`
2. `checklist check observability sensitive-data-out-of-telemetry`
3. `checklist verify observability`

---

## STAGE 4 — Monitoring & alerting (watch the user, page only on what's actionable)

Open **[references/monitoring-and-alerting.md](references/monitoring-and-alerting.md)**. *What* you monitor and *when* you wake someone decide whether this system is operable at all.

- **Watch the user's experience, not just the machine.** CPU and memory are table stakes; the signals that matter are **latency, error rate, traffic, and saturation** (Google SRE's *four golden signals*). A perfectly healthy host while users get errors is an everyday occurrence — machine-green is not user-green.
- **Every alert must be actionable.** The cardinal failure here is **alert fatigue**: too many alerts, too noisy, too many false alarms, until the team learns to ignore all of them and the one that matters is missed. The rule: *if an alert fires, it means a human must do something now.* Anything that doesn't meet that bar becomes a dashboard or a daily digest — it does **not** page someone at 3am. This is the operational form of `flightline`'s "un-gameable gate": an agent facing a noisy alert will *silence* it, so the alert set has to be worth keeping.
- **Alert on symptoms, not causes.** "Users are seeing errors" (symptom) is a better page than "host 7's CPU is high" (cause) — the symptom is what actually matters and catches problems you didn't predict; the cause is one hypothesis among many.

### GATE — clear before RELIABILITY
1. `checklist check monitoring golden-signals-watched`
2. `checklist check monitoring alerts-actionable`
3. `checklist verify monitoring`

---

## STAGE 5 — Reliability & incident response (define "enough," plan for the failure)

Open **[references/reliability-and-incident.md](references/reliability-and-incident.md)**. Failure is not preventable; *unpreparedness* is.

- **Define how reliable is enough with SLI / SLO / SLA** — don't chase 100%. The cost of reliability climbs toward infinity as you approach 100%, and 100% is almost never the right or achievable target (the same restraint as `assay`'s "don't chase 100% coverage" and the suite's "match the rigor to the risk"). Pick a target the business actually needs and can pay for.
- **Use an error budget to balance shipping and stability:** the SLO implies an allowed amount of unreliability; while there's budget, ship features; when it's nearly spent, stop and stabilize. It turns "fast vs safe" from an argument into a number.
- **Stand up on-call, runbooks, and incident severity levels** so that when something breaks there is a known way to respond — not improvisation. The runbook is the agent's only incident memory; it must exist in writing.
- **Run blameless postmortems.** After an incident, focus on how the *system and process* let it happen and how to improve them — never on punishing a person. A blame culture makes people hide problems; this is the same principle as `gauge`'s "fail loud, local, attributed" and `flightline`'s "red means stop" — you want failures surfaced fast, not buried.
- **Optimize for MTTR over MTBF.** Since failure is inevitable, fast *recovery* (mean time to recovery) is a more realistic and valuable target than chasing a system that never fails (mean time between failures).

### GATE — clear before CONTINUITY
1. `checklist check reliability slos-and-error-budget`
2. `checklist check reliability incident-process-ready`
3. `checklist verify reliability`

---

## STAGE 6 — Capacity, cost & continuity (stay up, stay affordable, come back from the dead)

Open **[references/capacity-and-continuity.md](references/capacity-and-continuity.md)**. The last stage is survival under load, under budget, and under disaster.

- **Capacity proven, not guessed.** Autoscaling handles load automatically — but only if you have **load-tested** and *know* where the system falls over. Don't discover your ceiling during the launch-day or sale-day traffic spike; an agent's reflex to "just scale up" hides the cliff instead of mapping it.
- **Cost discipline (FinOps).** Cloud resources are money: over-provisioning is waste, under-provisioning is an outage — find the balance deliberately, and watch for the agent's habit of scaling its way out of every problem.
- **Runtime security:** secrets in a real manager / vault (never in code — `flightline` enforces this at build time; here it's the *running* system), the **principle of least privilege** plus access auditing, and regular patching of OS and dependencies (supply-chain hygiene continued into production).
- **Backups and disaster recovery — rehearsed.** The hard-won lesson: **an untested backup is not a backup.** Periodically perform a *real* restore to prove it works and to know how long recovery takes (your **RTO / RPO**). Plenty of teams discover their backups are corrupt only on the day they need them.

### FINAL GATE
1. `checklist check continuity capacity-proven`
2. `checklist check continuity backup-and-dr-rehearsed`
3. `checklist check continuity ops-security-hardened`
4. `checklist verify continuity`
5. `checklist show` — confirm all seven stages passed.
6. `checklist done` — clear this run's state.

---

## The thread through all of it

The spine is **you build it, you run it** — DevOps exists to tear down the wall between development and operations and the "my code is fine, it's your environment" blame it breeds. Make whoever builds a thing responsible for operating it, and that responsibility flows back into more deployable, observable, recoverable code. For an agent the lever is the same as everywhere in this suite: it takes the cheapest path to a quiet dashboard, so the controls must be *rehearsed and automated*, not trusted — production rewards only what you have actually exercised. stationkeeping closes the lifecycle its siblings open: `groundwork` decided *what*, `load-bearing` decided *how it's structured*, `flightline` got it *merged and shipped*, `assay` proved *it holds* — stationkeeping keeps it **alive, watched, and serving users once it's real.**

## Anti-patterns (use as a pre-flight checklist)

- **Manual deploys / hand-editing prod** — the number-one incident source; automate and make it reproducible.
- **Snowflake servers** — hand-tweaked boxes no one can reproduce; rebuild, don't patch live; describe infra as code.
- **Rollback that's never been run** — "we can roll back" is a wish until you've rehearsed it.
- **Big-bang releases** — large blast radius, hard to locate the cause; ship small and often, behind flags.
- **Unstructured logs / no trace id / secrets in logs** — unsearchable in a distributed system, and a compliance incident.
- **Watching only machine metrics** — green hosts while users fail; watch the golden signals and the user's experience.
- **Alert fatigue** — noisy, non-actionable pages train everyone to ignore the one that matters; page only on actionable symptoms.
- **Chasing 100% reliability** — the cost runs to infinity; pick an SLO and spend the error budget deliberately.
- **Blame-culture incidents** — drive problems into hiding; run postmortems blameless so failures surface early.
- **Capacity by guesswork** — load-test to find the cliff; don't meet it on launch day, and don't let "just scale up" hide it.
- **Untested backups** — equal to no backup; rehearse a real restore and know your RTO/RPO.
- **Skipping a GATE** — the user's judgment on blast radius and reliability target can change the whole plan.

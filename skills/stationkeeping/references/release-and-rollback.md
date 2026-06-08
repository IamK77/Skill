# Release & Rollback — Ship to a Blast Radius, Take It Back on a Drill

This reference is the depth behind **STAGE 1 — Release & rollback** of the [../SKILL.md](../SKILL.md) flight plan, which opens it by name. It governs the act of getting a passing build in front of real users *without* betting all of them on it, and the act of *un-shipping* a change fast when it goes wrong. The human-era→agent-era shift it serves is the collapse of two assumptions a careful operator used to hold for free: that **deploy meant release** (a human staged the rollout, watched the error rate, felt the Friday-afternoon taboo) and that **"we can roll back" was credible** (someone had actually done it and carried the memory). An agent holds neither. It deploys continuously and to 100% because it can, and it reports "we can roll back" off a script it has never executed. This file is the *how* — the mechanisms, costs, and drills that re-establish those two safeties as engineered controls. For the *why* behind every move here — why an agent breaks each assumption and what failure mode each control guards — read [agent-era-shifts.md](agent-era-shifts.md), specifically **SHIFT 2 (deploy is not release)** and **SHIFT 7 (rehearse the undo)**.

Restate the governing fact, inherited from [decision-tree.md](decision-tree.md) and true under everything below: **production is the only truth, and an unrehearsed control is not a control.** A rollback never run, a flag kill-switch never flipped, a canary abort never triggered — each is a safety property you are *assuming*, and the agent operating your system reads its silence as success. The entire job of this stage is to move *release* and *rollback* out of the "looks fine / trusted to remember" bucket and into the "rehearsed, automated, reversible" bucket.

Every decision fork below carries a **PREDICATE** (the question that selects the branch), a **DEFAULT** (what to pick on a coin-flip), and a **FALLBACK** (what to do when you cannot answer yet), so two agents hardening the same service reach the same setup. When a fork stays ambiguous after both, climb the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-floor-is-unclear) — the user holds authority over production and the risk budget.

## Contents

- [The two halves of this stage](#the-two-halves-of-this-stage)
- [Progressive delivery: the four strategies and what each costs](#progressive-delivery-the-four-strategies-and-what-each-costs)
- [Decoupling deploy from release: feature flags](#decoupling-deploy-from-release-feature-flags)
- [Flag lifecycle and flag debt](#flag-lifecycle-and-flag-debt)
- [Small, frequent releases](#small-frequent-releases)
- [Immutable infrastructure: rebuild, never hand-patch](#immutable-infrastructure-rebuild-never-hand-patch)
- [The rehearsed rollback](#the-rehearsed-rollback)
- [Rollback vs forward-fix](#rollback-vs-forward-fix)
- [The database-migration asymmetry](#the-database-migration-asymmetry)
- [GATE checklist for this stage](#gate-checklist-for-this-stage)

---

## The two halves of this stage

The stage backs two checks, and they pull in opposite directions on purpose:

- **`progressive-delivery-and-flags`** — *limit how far a bad release reaches.* Deploy decoupled from release; canary / blue-green / rolling shrink the blast radius; feature flags ship code dark and flip off without a redeploy. This is the *forward* safety: don't hand the whole user base to whatever just shipped.
- **`rollback-rehearsed`** — *prove you can take it back.* The escape hatch behind every release strategy, exercised before it's needed, not "possible in theory." This is the *reverse* safety: when the small blast radius still contains a real failure, undo it fast and reliably.

Neither alone is enough. Progressive delivery without a rehearsed rollback is brakes you've never pressed; a rehearsed rollback without progressive delivery means you only roll back *after* every user already saw the break. Build both. The agent failure mode the pair guards against is the one SHIFT 2 names: an agent ships to 100% instantly and then "rolls back" with a path that has never run — two assumptions, both false, compounding into an all-users outage the agent will have reported as a successful deploy.

---

## Progressive delivery: the four strategies and what each costs

Progressive delivery is the blast-radius control: a new version reaches a *slice* of traffic or infrastructure first, you watch real user signals, and you widen only if it holds. The four mechanisms differ in resource cost, downtime, operational complexity, and how fast and clean their rollback is. This section is the depth on *what each one is and what it costs*; **which to pick is the [release-strategy router in decision-tree.md](decision-tree.md#the-release-strategy-router-stage-1)** — answer its predicate chain top-down, don't re-derive the picker here.

| Strategy | What it is | Resource cost | Downtime | Complexity | Rollback move (and how clean) |
|---|---|---|---|---|---|
| **Recreate** | Stop every old instance, then start the new version | 1× (no overlap) | **Yes — a real outage window** | Lowest | Re-deploy the old version — but you eat a second downtime window; rollback is *slow* |
| **Rolling** | Replace instances batch-by-batch (k8s `RollingUpdate`); old and new serve side-by-side during the roll | ~1× + one batch of headroom | Zero | Low (the orchestrator default) | Roll *backward* the same way — gradual, so the bad version lingers on some instances while it unwinds; **mixed-version window in both directions** |
| **Blue-green** | Stand up a full second environment (green) beside the live one (blue), switch the router atomically, keep blue warm | **~2× during cutover** | Zero | Medium (two environments, a router, a cutover step) | Flip the router back to blue — **instant and clean**, the cleanest rollback of the four, as long as blue is still warm and schema-compatible |
| **Canary** | Route a small % to the new version (1% → 10% → 100%), watch the golden signals at each step, ramp only if healthy | ~1× + the canary slice | Zero | **Highest** — needs real traffic, per-cohort metrics, and (at HEAVY) automated analysis + abort | Halt the ramp, route 100% back to old — **fast and small-blast-radius**; only a slice ever saw the bad version |

How to read the cost columns against an agent operating the system:

- **Recreate** is the cheapest to build and the only one that accepts downtime. Pick it only when a brief outage is genuinely fine (an internal tool, a batch job, a maintenance window). Its trap in the agent era: its rollback is *also* a recreate, so an agent that ships a bad version takes two outages to recover — there is no fast undo. Acceptable for LIGHT systems where nobody is paged; never for user-facing revenue.
- **Rolling** is the orchestrated-stateless default and costs almost nothing extra. Its subtlety is the **mixed-version window**: old and new run simultaneously during the roll, so the new version must be backward-compatible with the old (and with the current schema — see [the migration asymmetry](#the-database-migration-asymmetry)). Its rollback is itself a gradual roll, so it is neither instant nor clean — the bad version keeps serving some fraction of traffic until the reverse roll completes.
- **Blue-green** buys you the cleanest, fastest rollback — one router flip back to a still-warm environment — at the price of running two full environments during cutover (~2× resources, briefly) and the operational machinery of a router and a cutover step. The agent-era win is that the undo is a single, instantly-reversible action that is *trivial to rehearse* — exactly the property SHIFT 7 demands. The catch: blue must stay schema- and dependency-compatible, or "flip back to blue" strands you on an environment that can no longer talk to the migrated database.
- **Canary** is the most powerful blast-radius limiter and the most complex to operate: it needs real production traffic, per-cohort golden-signal metrics, and a defined ramp. At HEAVY weight, the abort must be **automated** — the canary analysis halts the ramp and routes back on a metric regression *without* waiting for an agent to notice, because the agent reads the green slice as safety and will happily ramp a quietly-failing canary to 100%. Canary is the default for user-facing changes at MEDIUM+ in the router for exactly this reason: it lets *production* tell you, with a tiny blast radius, before you commit everyone.

**Whatever you pick, the rollback/abort must be rehearsed** ([below](#the-rehearsed-rollback)). A release strategy whose undo has never been run has no brakes — and the fancier the strategy, the more moving parts in the undo, the more important the drill.

---

## Decoupling deploy from release: feature flags

**Deploy** is putting the artifact on the infrastructure. **Release** is turning a behavior on for users. Coupling them — new code is live for everyone the instant it deploys — is the human-era default, and it was tolerable only because a careful operator staged the rollout and watched. An agent deploys continuously, to 100%, with no felt taboo and no patience to watch. So you must **separate the two acts**, and the tool that does it is the feature flag.

A feature flag (toggle) is a runtime conditional that gates new behavior. The code ships **dark** — deployed but inert — and a flag decides, at request time, who sees it. This delivers three things no deploy-time strategy can:

1. **Ship dark, enable on a human's schedule.** The artifact can sit in production for days before anyone turns it on, decoupling the *deploy* (continuous, agent-driven) from the *release* (deliberate, human-gated). The agent ships the code; a human (or an automated guardrail) decides who sees it and when.
2. **Enable progressively without a redeploy.** Turn the flag on for internal users, then 1%, then a cohort, then everyone — all at runtime, no new deploy per step. This is progressive delivery *layered on top of* whatever rollout strategy you already chose (the router's "feature flag on top of any of the above").
3. **One flag-flip to off, no redeploy.** A problem is a single toggle away from disabled. This is the fastest possible kill-switch — it does not race a rollback through the pipeline, it does not rebuild, it does not redeploy. For an agent-operated system this is the safety valve: **deploy is reversible the slow way (roll back the artifact); release is reversible the instant way (flip the flag).**

This is the agent-era safety valve SHIFT 2 names. The agent can deploy as fast and as often as it likes, because nothing is *released* until a deliberate, reversible decision flips the flag — and that decision can be taken back in one action. The flag is what lets you say "yes, deploy continuously" without saying "and expose every change to every user the moment it lands."

**Decision fork — should this change ship behind a flag?**

- **PREDICATE:** is the change user-visible, behavioral, or risky in a way you'd want to disable *without* a redeploy?
- **DEFAULT** on a coin-flip: **yes, ship it behind a flag, off** — the cost of a flag is a few lines and some cleanup debt; the cost of a wrong change you can only kill by racing a rollback through CI is an extended incident.
- **FALLBACK** when you can't judge the risk yet: ship behind an **off** flag and enable to a tiny internal cohort or canary first — the most reversible path while you learn.

**Kill-switch flags are not optional and must be proven.** A flag you have never flipped to off in production (or a faithful staging mirror) is, per the governing fact, *assumed*, not real. Wire the off-path, then **flip it once on purpose** to confirm the behavior actually disables and the system stays healthy without it. The agent will report a flag as a working kill-switch on the strength of its existence; only a flip proves it.

---

## Flag lifecycle and flag debt

A flag is a temporary control with a lifecycle, not a permanent fork in the code. Left unmanaged, flags become **flag debt**: a growing thicket of stale toggles that multiplies the code's possible states (N flags = up to 2^N runtime configurations), makes behavior impossible to reason about, and silently rots into bugs — a flag everyone assumes is "fully rolled out" but is still off in one config, a dead flag whose off-branch quietly bit-rots until someone flips it back on.

The lifecycle every release flag should travel:

1. **Created off** — ship dark, default disabled.
2. **Rolling out** — enabled progressively (internal → canary % → cohort → 100%), watched at each step.
3. **Fully on (or fully off, killed)** — the rollout decision is final.
4. **Retired** — the flag and its *dead branch* are **deleted from the code**, leaving only the kept path. This step is the one the agent never does.

The agent-era hazard, identical to the only-add-never-delete reflex `flightline` and the suite name elsewhere: an agent will happily *add* a flag for every change and **never retire one**. It has no instinct that the toggle has a weight, that the dead branch is now untested dead code, or that 40 stale flags make the system's behavior unknowable. So flag retirement must be an **explicit, owned, tracked activity**, not something left to emerge:

- **Give every flag an owner and an expiry.** A flag is created with a name, an owner, and a "remove by" date. A flag living past its expiry is a tracked defect, the way a quarantined flaky test past its deadline is in `flightline`.
- **Make stale flags visible.** Most flag platforms (LaunchDarkly, Unleash, Flagsmith, or a homegrown table) report flag age and last-evaluation; treat a long-lived "temporary" flag as a cleanup item, and track open-flag count as a health number.
- **Retire = delete the dead branch.** Removing a flag means deleting the unused code path, not just setting the toggle permanently on. A flag left "permanently on" still carries its dead off-branch as untested, reachable-by-accident code.
- **Permanent operational flags are a different thing** — a kill-switch for a third-party dependency, a regional toggle, a long-lived ops control. Mark these explicitly as long-lived so they aren't swept up by the staleness sweep, but hold them to the same review bar: a permanent flag is config, and config that changes behavior is reviewed.

> Anti-pattern this section kills: **the flag graveyard.** The agent ships a flag per change and retires none, so the codebase accretes toggles until no one can say what any given user actually sees. A flag is a loan against future cleanup; book the repayment when you take it.

---

## Small, frequent releases

The suite's "small steps" rule applies to releases with full force, and it is the cheapest blast-radius control you have — cheaper than any rollout strategy, because it shrinks the *content* of each release rather than the *audience*. A small release wins four ways at once:

- **Small blast radius.** A change that touches one thing can break, at most, that one thing. A big-bang release that batches twenty changes hands you twenty simultaneous suspects when the error rate climbs.
- **Easy bisect.** When something breaks after a small release, the cause is *in that small diff* — the search space is tiny. After a big-bang release, locating which of twenty changes broke production is the expensive part of the incident, and the agent (with no memory of what changed) is worst at exactly this.
- **Clean rollback.** Rolling back one small change is unambiguous and unlikely to revert something else people now depend on. Rolling back a big batch reverts the good with the bad, and may not even be safe if later work has built on part of the batch.
- **Continuous rehearsal.** Releasing small and often means the deploy *and the rollback* paths run constantly, so they stay warm, debugged, and trusted — the opposite of the quarterly big-bang whose tooling is rusty exactly when the stakes are highest.

This is why the SHIFT 2 "DO THIS" says *keep each release small so the blast radius and the diff to bisect are small.* For an agent fleet producing many concurrent changes, small-and-frequent is not just hygiene — it is what keeps each individual release within a blast radius the rollback and the canary can actually contain. The pairing is deliberate: **small releases + progressive delivery + rehearsed rollback** is one control, not three. Each makes the others' job tractable.

---

## Immutable infrastructure: rebuild, never hand-patch

Immutable infrastructure means a running server is **never modified in place** — to change it, you build a new image and *replace* the instance. No SSHing in to tweak a config, install a package, or apply a hotfix to a live box. This is a release concern because the most dangerous "release" is the one nobody calls a release: the agent fixing prod live to make an error stop.

The failure mode it kills is the **snowflake server** — a uniquely hand-tweaked machine whose exact state no one can reproduce, because its current configuration is the accumulated residue of every manual fix anyone ever applied to it. SHIFT 6 names why the agent breeds these: facing a broken box, the agent takes the cheapest path to green and **patches it live**, feeling no wrongness at creating a one-off and carrying no memory that this box is now special. The next deploy that rebuilds from the image silently wipes the fix; the box that *wasn't* rebuilt drifts further from its siblings until it fails in a way that reproduces nowhere else.

Immutability makes the irreproducible fix *impossible*, not merely discouraged:

- **Bake artifacts, replace instances.** A change to a server is a new image (a container image, a baked VM image via Packer, a new task definition) and a rolling/blue-green replacement of the running instance. The running fleet is disposable cattle, not hand-raised pets.
- **Forbid manual mutation, or detect and reconcile drift.** Lock down or audit interactive access to production hosts; where you can't forbid it, run drift detection (Terraform plan against live, AWS Config, etcd-vs-desired reconciliation) so a hand-change is *caught and reverted*, not absorbed.
- **The fix flows through the build, every time.** A production problem is fixed by changing the image/IaC and re-releasing through the normal path — so the fix is reviewed, version-controlled, and present on *every* instance, including the next one autoscaling brings up. The hotfix that exists only on box 7 is the snowflake in embryo.

The connective tissue — infrastructure-as-code, container parity, config separated from code — is **STAGE 2's** depth in `environments-and-config.md`; this section is only the release-time rule that follows from it: **a running box is replaced, not edited.** The agent reflex this guards against is precise: a live patch makes the dashboard green *now* and leaves you a box no one can rebuild.

> Anti-pattern this section kills: **"SSH in and fix it."** It is the fastest path to a quiet dashboard and the surest path to a fleet of snowflakes whose failures reproduce nowhere, debuggable by no one — least of all an agent with no memory that the box is special.

---

## The rehearsed rollback

A rollback that works "in theory" is worthless at 3am. This is the `rollback-rehearsed` check and the spine of SHIFT 7: **an untested recovery path is no recovery.** The actor most likely to skip the drill is the one now operating the system — the agent that reports "we can roll back" off a script it has never run and feels no wrongness doing so. So rollback is not a capability you *have*; it is a control you have *exercised*, recently, and can prove with a log.

**What a real rollback requires:**

- **One action, no rebuild.** The human-in-the-loop (or the automated guard) must be able to revert the last release to the previous known-good state in *one* action, without rebuilding from source and without following a manual runbook from memory. Most so-called rollbacks are actually re-deploys of a hopefully-still-buildable old commit — and that path fails exactly when you need it, because the old commit no longer builds, or its dependencies have moved, or the rebuild takes twenty minutes you don't have.
- **Re-point to a previous immutable artifact.** Because you build the artifact once and deploy *that exact artifact* (the `flightline` rule), rollback is "re-point to the previous artifact/digest," not "rebuild the past." Blue-green makes this a router flip; canary makes it a traffic shift back; rolling makes it a reverse roll; flags make it a toggle.
- **A defined, fast trigger.** Who or what can initiate a rollback, and how fast it completes (this is part of your MTTR). For an agent-operated canary at HEAVY weight, the trigger should be **automated**: a golden-signal regression on the canary halts the ramp and routes traffic back *without waiting* for the agent to notice — because the agent reads the green slice as safety and will ramp a failing canary rather than abort it.

**How to rehearse it — the drill, stated as a control:**

- **PREDICATE:** has the rollback for *this service* been *executed* — a real revert to the previous known-good state — within a recent, known window?
- **DEFAULT** on a coin-flip: **treat it as broken** until a drill proves otherwise; an unexercised rollback fails exactly when you finally need it, and the agent has already reported it as working.
- **FALLBACK** when you can't run the full drill in production: run the **largest safe slice** — roll back a canary, flip a kill-switch flag off in production, or execute the full rollback in a staging environment that mirrors prod's release tooling — and record what remains unproven as residual risk for the user to accept in writing.

Wire the drill so it *keeps* proving itself: rehearse rollback on a cadence (HEAVY systems fold it into game-days), and **alert if the rehearsal stops running** — a drill that silently stopped is itself a control that has decayed back into an assumption, and the agent reads its absence as health. The asymmetry that justifies the cost: a rehearsal costs minutes; an unrehearsed rollback that fails turns one outage into a much longer one the agent will have entered already believing it had brakes.

---

## Rollback vs forward-fix

When a release is bad, you have two moves: **roll back** (revert to the last known-good) or **forward-fix** (ship a new release that corrects the problem). Choosing wrong, or dithering, extends the incident. The default is strongly toward rollback, because rollback is the rehearsed, reversible, blast-radius-shrinking move and forward-fix is improvisation on a live system under pressure — exactly the move SHIFT 5's remediate-vs-escalate fork warns the agent away from.

- **PREDICATE:** can you return to a known-good state by reverting — a rollback you have rehearsed and that no irreversible side-effect (a schema change, a consumed message, an external charge) has stranded?
- **DEFAULT** on a coin-flip: **roll back.** Stop the bleeding first, diagnose after. Rolling back to a state you *know* worked is faster and safer than authoring a fix you *hope* works, under incident pressure, with the error rate climbing.
- **FALLBACK** when rollback is *not* clean — a forward-only schema migration has run, a side-effect can't be un-done, or rolling back would itself strand state: do **not** improvise a forward-fix on the live system. **Flip the kill-switch flag off** (release-level reversal, which a forward-only deploy can't strand), stabilize conservatively, and escalate to a human before shipping a forward-fix. This is precisely why you keep release reversible at the *flag* layer and not only the *deploy* layer: the flag undo survives situations the artifact undo cannot.

The trap for the agent: a forward-fix *feels* like progress (it's shipping something), while a rollback feels like retreat. But a forward-fix authored under pressure is a fresh, un-reviewed, un-rehearsed change going to production during an incident — the single likeliest way to turn one outage into two. Roll back, restore calm, then fix forward through the normal gated path.

---

## The database-migration asymmetry

The reason rollback is sometimes *not* clean — and the sharpest trap in this whole stage — is that **code rolls back, data does not.** You can re-point to the previous artifact in seconds; you cannot un-drop a column. A schema change is, by default, a one-way door, and a naive migration coupled to a release means rolling back the *code* strands you on a *schema* the old code can't read — a rollback that makes things worse.

The discipline that breaks the coupling is **expand/contract** (also called parallel-change), and it is the operational cash-out of `load-bearing`'s migration discipline — that skill designs the schema-evolution rules; this stage *runs* them at release time. The pattern splits every breaking schema change across multiple small, individually-reversible releases:

1. **Expand** — add the new schema element (new column, new table) *additively*, without removing the old. Deploy this first. The old code ignores it; nothing breaks; this release is trivially reversible.
2. **Migrate + dual-write/dual-read** — ship code that writes (and reads) both old and new shapes, backfill existing rows. The system now works on either schema. Still reversible: roll back the code and the old columns are still populated.
3. **Contract** — only once the new path is proven and no running code reads the old shape, remove the old element in a *later* release. By now nothing depends on it, so the removal is safe.

Why this is the rule, not a nicety, in the agent era:

- **It keeps every release individually rollback-able.** At no single step does rolling back the code strand the schema, because the schema is always compatible with *both* the current and previous code version. This is what makes the "DEFAULT: roll back" of the previous section actually safe.
- **It is mandatory for rolling and blue-green.** Both run old and new code *simultaneously* (the mixed-version window). The schema must satisfy both at once, which is exactly what expand/contract guarantees and what a naive coupled migration violates — a rolling deploy with a column-rename baked in breaks the half of the fleet still on the old code.
- **The agent will couple migration to release if you let it.** Told to ship a change that needs a schema change, the agent's cheapest path is one migration that renames/drops in the same release as the code — green in staging, an un-rollback-able trap in prod. The control is to *forbid destructive, coupled migrations* and require the expand/contract split, the same way you require small releases.

**Decision fork — is this schema change safe to release as one step?**

- **PREDICATE:** is the migration purely *additive* and backward-compatible — does the previous code version still run correctly against the new schema?
- **DEFAULT** on a coin-flip: **no — split it expand/contract.** Assume the change is breaking until you've proven the old code tolerates the new schema; an additive-only step is cheap to ship and trivially reversible.
- **FALLBACK** when you can't prove backward-compatibility: ship the **expand** step alone, gate the new behavior behind a flag, and hold the destructive **contract** for a later release once the new path is proven and no code reads the old shape — never drop or rename in the same release that introduces the dependency.

> Anti-pattern this section kills: **the irreversible migration.** A rename-or-drop coupled to the code release passes every test in staging and turns the code-rollback into a strand-the-schema incident in prod — the one case where rolling back makes things worse. Expand/contract is what keeps "roll back" the safe default.

---

## GATE checklist for this stage

Before running `checklist verify release`, confirm both checks are *rehearsed*, not merely *present* (the `present-unexercised` status in [decision-tree.md](decision-tree.md#setup-vs-audit--pick-the-mode-then-the-status-taxonomy) counts as **not done**):

- **`progressive-delivery-and-flags`** — deploy is decoupled from release; the rollout strategy is chosen from the [release router](decision-tree.md#the-release-strategy-router-stage-1) and matched to the weight class; user-facing/risky behavior ships behind a flag with a *proven* off-path; flags have owners and expiries and a retirement process exists (no flag graveyard); releases are small.
- **`rollback-rehearsed`** — rollback is one action to a previous immutable artifact, no rebuild; it has been *executed for real* within a known window (a drill log, not a script's existence); the canary/abort path is wired (automated at HEAVY); schema changes follow expand/contract so a code rollback never strands the data.

If either is only on paper — a rollback script never run, a kill-switch never flipped, a migration coupled to its release — it is, for an agent, *unproven*, and the gate is not clear. Production is the only truth, and an unrehearsed control is not a control.

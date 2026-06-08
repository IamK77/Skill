# The Architecture Decision Engine

This is the deterministic router at the heart of **load-bearing**. STAGE 0 (Frame) opens it by name, but you should open it *first* and keep it beside you through every stage — it decides the two things the whole design hangs on: **which decisions deserve your scarce human deliberation, and how much architecture this system even earns.** Everything downstream — style, stack, boundaries, contracts, data, NFRs, ADRs — is reached *from* this file. Traverse it top-down, once per system or restructuring you're handed; the leaves link you into the stage references where the real work happens. The agent-era reasoning the whole engine assumes — why the cost lines moved and which guardrails replace the instincts you lack — lives in [agent-era-shifts.md](agent-era-shifts.md); read it before you trust any DEFAULT below.

Every fork is written to be *decidable* — hand two agents the same system and they should land on the same branch. To make that hold, each fork states three things up front:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — which branch to take when the predicate is a genuine toss-up.
- **FALLBACK** — what to do when you can't answer the predicate yet.

There is exactly one invariant that overrides every DEFAULT and FALLBACK below:

> **Never silently walk through a one-way door under uncertainty.** If a decision is irreversible or expensive-to-reverse — a production data schema, a contract others will depend on, the auth/trust model, the split into separate deployables — and you are not certain, you do not get to pick and proceed. You climb the escalation ladder: spike it, ask the user, or defer it behind a contract. Guessing on a two-way door is cheap and an agent should just do it; guessing on a one-way door is how a single confident commit becomes a migration, a breach, or a public-contract break that outlives the project.

---

## The three axes this engine runs on

You route faster if these are crisp. They recur in every tree, and the first one is the master axis — the agent era bent the whole field around it.

| Axis | Cheap end | Expensive end | Why it routes |
|---|---|---|---|
| **Reversibility** | A wrong call is undone in an afternoon: rename it, swap the library, refactor the layout | A wrong call is a data migration, a broken public/inter-service contract, a leaked trust boundary, an undoing of a depended-on deployment split | Sets *who decides and how hard*. One-way doors get human deliberation + an ADR; two-way doors get a default and an agent. **This line MOVED in the agent era** — see below. |
| **Cost of getting it wrong** | A bug wastes an hour and is contained | A bug touches money, data integrity, auth, availability, safety, or many downstream consumers | Sets the *blast radius* and the weight class; raises the bar on validation before you commit. |
| **Collaborators (humans + agents)** | One worker owns the whole thing end-to-end | Many parties — human teams *and* parallel agents — touch it and must not collide | Conway's Law: structure grows into the shape of who builds it. In the agent era "who" now includes the agent fleet, so seams must be clean enough for parallel agents, not just teams. |

**The agent-era bend on reversibility.** When an agent (or a fleet) writes the code, the cost of *reversible* decisions collapses toward zero: internal code organization, the library you reached for, file layout, even a full rewrite are now cheap because the mechanical work is cheap. The cost of *irreversible* decisions does **not** move — agents do not make a data migration, a broken API contract, or a security breach cheaper. So decisions that were one-way doors in the human era *because all code was expensive to change* — "we must get the internal structure right up front" — are now **two-way doors**. The classic "design it carefully before you build" canon was calibrated for uniformly expensive code; half of it now applies only to the durable layer. The whole point of this engine is to stop you spending human judgment where the agent era made it free, and to concentrate it where the era changed nothing.

---

## TRIAGE — the master tree: one-way door or two-way door?

Run this **first, on every decision the design is about to make.** It is the move STAGE 0's reversibility-mapping check exists for. The output is a partition: a short list of one-way doors that earn full rigor, and a long list of two-way doors you hand to agents.

```
TR1. Will anything OUTSIDE your control come to depend on this in a way
     you can't unilaterally take back?
     PREDICATE: does crossing this commit production data, an external/inter-service
                contract, the trust model, or a deployment split others will build on?
     ├─ YES → ONE-WAY DOOR. Full rigor + human deliberation + an ADR. Continue to TR2.
     └─ NO  → continue to TR3.

TR2. (one-way doors only) Can it be made two-way by hiding it behind a seam?
     PREDICATE: can you put the irreversible choice behind an interface you own,
                so the choice itself becomes swappable later?
     ├─ YES → DEFER-BEHIND-A-CONTRACT. Design the seam now (that seam is itself a
              one-way door — get it right), let the implementation behind it be a
              two-way door. See the escalation ladder.
     └─ NO  → genuinely irreversible → it earns the most human judgment in the design.

TR3. Is it cheap to change once code exists?
     PREDICATE: could an agent refactor this in one pass with the tests green —
                internal layout, a library swap, naming, file organization?
     ├─ YES → TWO-WAY DOOR. Pick a reasonable DEFAULT, note "agents may revisit",
              and do NOT gold-plate it. Move on.
     └─ NO / UNSURE → treat as one-way until proven otherwise (TR1 invariant binds).
```

### The canonical lists

Memorize these; most decisions you meet are on one of them.

| ONE-WAY DOORS (irreversible / expensive — human + ADR) | TWO-WAY DOORS (reversible / cheap — default + agent) |
|---|---|
| **Production data schema** — once real data is in it, migration is costly and risky; agents do *not* lower this cost | **Internal module layout** — package/folder structure, where a function lives |
| **Public or inter-service contract** — once a consumer depends on it, breaking it breaks them | **Library / framework choice** behind your own seam — swap it later |
| **Auth & trust model** — the boundary between trusted and untrusted; a leak here is a breach, not a bug | **Naming** of internal types, variables, private functions |
| **The monolith-vs-distributed split, once depended on** — re-merging or re-splitting live services is surgery | **File organization** and code-level structure |
| **Choice of storage consistency model** (CAP/PACELC posture) once data is live | **Internal algorithm / implementation** behind a stable interface |
| **A wire format / event schema** other systems consume | **Local refactors**, extract-method, inline, rename-across-repo |

**Rule of the tree:** a one-way door gets your real deliberation, an explicit options-considered ADR ([adr-and-evolution.md](adr-and-evolution.md)), and — wherever TR2 allows — a seam that demotes it to two-way. A two-way door gets one reasonable default and an agent told it may refactor freely. The single most common waste is gold-plating a two-way door (an elaborate plugin system for a library you could swap in an hour); the single most dangerous error is rushing a one-way door (shipping a schema or a public API on a guess). The triage exists to stop both.

**DEFAULT** when you can't tell which side a decision is on: treat it as **one-way** and verify it's actually cheap before relaxing. The asymmetry is steep — over-deliberating a two-way door costs minutes; under-deliberating a one-way door costs a migration.

**FALLBACK** when you can't yet tell because the dependents don't exist yet (no consumers, no production data): the door is *currently* two-way but **becoming** one-way the moment something depends on it. Note the trip point ("this contract is two-way until the mobile client ships against it") and put the ADR-writing on that event.

**Worked leaf —** *"Decision = 'what HTTP framework for the internal service.' TR1: nothing external depends on the framework choice itself → not yet one-way. TR3: an agent could swap Express for Fastify behind our own handler interface in a pass → TWO-WAY. Pick the boring default, note agents may revisit, write no ADR."*

**Worked leaf —** *"Decision = 'the orders table schema.' TR1: production data will live here and three services read it → ONE-WAY. TR2: can't hide a shared schema behind a seam without owning the data per-service (a bigger decision) → genuinely irreversible → full rigor, ADR with options considered, design for growth/indexes up front ([data-design.md](data-design.md))."*

---

## WEIGHT-CLASS SELECTOR — how much architecture does this even earn?

Architecture must match scale and risk — *够用就好*, enough and no more. Over-architecting a throwaway is the same category of error as under-architecting a payments platform. Three dials set the class — **cost of getting it wrong × change frequency × collaborators (humans + agents)** — but don't score them numerically: match the system to the nearest archetype in the **Looks like** column below, and when two dials pull toward different classes, take the **higher** one and let the trip-wires upgrade you from there. One agent-era twist on the dials: because agents make evolution cheap, *high change frequency no longer argues for pre-building flexibility* — it argues for the leanest modular monolith with clean, refactor-freely seams, not a speculative framework you'll maintain forever (SHIFT 7 in [agent-era-shifts.md](agent-era-shifts.md)).

| Weight class | Looks like | Ceremony it earns |
|---|---|---|
| **Featherweight** | A script, a spike, a one-off migration, a prototype you'll throw away. Low blast radius, rarely changed, one worker. | None. Pick the obvious structure, skip this skill, build. State in one line why you skipped. |
| **Lightweight** | An internal tool, a single feature in an existing system, a CRUD app for a known small load. Contained blast radius, moderate change, a small team or a couple of agents. | Style + boundaries + the *one or two* one-way doors it actually has (usually its data model). One short ADR if a one-way door appears. Skip the full NFR sweep — spot-check only the qualities it plausibly touches. |
| **Middleweight** | A product service with real users, real data, an external API, several collaborating teams/agents. Real blast radius, frequent change, genuine parallelism. | The full six-stage flow. Boundaries by capability with a *machine-enforced* mechanism, contract-first interfaces, an explicit data/CAP decision, NFR realization with guardrails, ADRs for every one-way door. |
| **Heavyweight** | A platform many teams build on, a system on a regulatory/safety boundary, anything where an outage or a breach is front-page. Severe blast radius, constant change, large human + agent fleet. | Everything middleweight requires, plus fitness functions enforced in CI ([adr-and-evolution.md](adr-and-evolution.md)), defense-in-depth and SAST in the loop ([nfr-realization.md](nfr-realization.md)), per-service data ownership, and explicit reversibility budgets on the durable layer. |

**Feature-within-an-existing-system mode** (the common agent-era case). When you are designing *one feature inside an existing system* rather than a whole system, do **not** size by the LOC you add — size by the **most irreversible seam the feature touches** (its data, its trust/auth boundary, its public contract). A few-hundred-line feature that alters the auth model is heavyweight *on that seam*. Inherit the host system's style, stack, and boundaries as **fixed constraints** — don't re-litigate them — and spend STAGE 0 triage only on the *new* one-way doors the feature introduces. Then run the one-line reconcile: which durable decisions does the upstream requirements artifact / existing code already fix, and am I *validating* them rather than re-opening them? (See STAGE 0's **Reconcile inherited decisions** step — re-deriving a settled upstream call is bloat; silently dropping a blocking upstream open question is the failure it guards against.)

### Trip-wires — any one forces an upgrade one class up

You are at a chosen weight class. The moment **any** of these becomes true, move up a class and re-open the stages the discovery belongs to:

```
WC1  A production data schema or a public/inter-service contract appears
     where you'd assumed there was none — a one-way door materialized.
WC2  A second team OR a second parallel agent now needs to work the code
     without colliding — you need real, machine-enforced seams.
WC3  An NFR turns out to constrain the architecture (10k concurrent users,
     a HIPAA/PCI scope, a hard latency SLO) — it can't be bolted on later.
WC4  The blast radius rises — the change now touches money, auth, data
     integrity, availability, or safety.
WC5  Change frequency spikes — what you sized as "build once" is now churning
     weekly, so boundary and contract discipline start paying off.
WC6  The trust boundary moved — untrusted input now reaches what you'd
     treated as internal.
```

**DEFAULT** when the class is a coin-flip: pick the **lighter** class and let the trip-wires pull you up. Over-built ceremony you didn't need wastes real effort *and* invites the speculative abstraction the agent will happily build (YAGNI); the trip-wires guarantee you won't under-build on anything that matters, because every dangerous discovery trips one.

**FALLBACK** when you can't size it because the requirements are too thin ("build me a backend"): don't pick a class for a fog. Get the funded requirements and NFRs from `groundwork` first — designing against unstated requirements is the original sin this stage inherits, not one it solves.

---

## STYLE ROUTER — which architecture style?

Default to the leanest style the weight class allows, then let specific, *earned* predicates push you toward distribution. The deep cost/benefit ledger for each style is in [architecture-styles.md](architecture-styles.md); this is the router.

```
SR1. DEFAULT: a MODULAR MONOLITH (single deployable, internal modules by
     capability with enforced boundaries).
     This is the default for almost everything. Monolith First.

SR2. Do you have a TRUE independent-scaling need?
     PREDICATE: does one component's load profile differ so sharply from the
                rest that it must scale (and fail) on its own — not "might someday"?
     ├─ YES → that component may earn its own deployable. Split only IT.
     └─ NO  → stay in SR1.

SR3. Do you have a HARD isolation / compliance boundary?
     PREDICATE: must a part be physically isolated for security, regulatory,
                or blast-radius-containment reasons (PCI scope, tenant isolation,
                a component that may NOT share a process with the rest)?
                NOT satisfied by "cleaner separation" as taste — a module
                boundary inside a modular monolith already gives logical isolation.
     ├─ YES → that boundary is a real deployable split. Justify it in an ADR.
     └─ NO  → stay in SR1.

SR4. Do you have TRUE team / agent-fleet autonomy?
     PREDICATE: do independent teams (or independent agent owners) need to
                deploy on their own cadence without coordinating releases —
                AND are the bounded contexts already stable?
                NOT satisfied by one team that "might grow", or contexts you
                are still redrawing — that bakes a moving line into a one-way door.
     ├─ YES → Conway's Law earns a service boundary along the org/ownership seam.
     └─ NO  → stay in SR1. A premature split here yields a distributed monolith.

SR5. Is the workload genuinely event-shaped or spiky-and-stateless?
     PREDICATE: is the core a stream of events with independent handlers, or
                bursty work that idles to zero?
     ├─ event-driven core → consider EVENT-DRIVEN for those flows (accept the
     │   debugging/tracing cost; design observability in from the start).
     ├─ spiky, stateless, idle-to-zero → consider SERVERLESS for those handlers
     │   (accept cold-start and vendor-coupling costs).
     └─ neither → stay in SR1.
```

### The anti-hype guard (fires before you commit to any split)

Microservices trade *code-internal complexity* for *distributed-systems complexity* — network failure, partial failure, eventual consistency, ops surface, distributed tracing, debugging across processes. **The agent era makes this trade WORSE, not better, by default.** Here's the mechanism: the classic *reason to pre-split* was "a monolith is painful to pull apart later, so split early while it's cheap" — and that split-later cost is exactly what agents now slash, because the mechanical refactoring is cheap. But the distributed *runtime* cost a split buys you is paid by the running system, which agents writing code do nothing to reduce. So **Monolith First is STRONGER in the agent era, not weaker.** Before you accept any split, all of these must be true; if not, the hype is talking, not the weight class:

- SR2, SR3, or SR4 fired with a *concrete, present* need — not "to be ready for scale," not "microservices are best practice," not "it'll look good."
- The bounded contexts are **stable** (you've stopped redrawing them). Splitting along a boundary you're still moving bakes the wrong line into a one-way door.
- You can name who operates each deployable at 3 a.m. and how you'll trace a request across them — *before* you split, not after.

**DEFAULT** when distribution is a coin-flip: stay a **modular monolith** with clean internal boundaries. You keep every option open — the split is a two-way door *from* a well-bounded monolith and a one-way door once depended on — and agents make the later extraction cheap. Splitting first throws away that optionality.

**FALLBACK** when you can't tell whether a scaling/isolation need is real: build the boundary *in the monolith* (a module with an enforced interface), instrument it, and let the data decide. A module is trivially promoted to a service later; a premature service is surgery to re-merge. Cross-link: [boundaries-and-contracts.md](boundaries-and-contracts.md) for drawing the boundary, [architecture-styles.md](architecture-styles.md) for the per-style ledger.

**Worked leaf —** *"'Should the image-resizer be its own service?' SR2: its CPU profile spikes 50× the rest and must not starve the API → independent-scaling need is real and present → split that ONE component, keep the rest a monolith, ADR records the load evidence. Note the new service↔API contract is now a one-way door."*

---

## ROUTING MAP — open question → reference / stage

Find the question you're actually stuck on; it names the sibling reference to open and the stage that owns the work.

| If your open question is… | Open this reference | Stage that owns it |
|---|---|---|
| "Is this even worth architecting, or do I just build it?" | this file — Weight-Class Selector | STAGE 0 — Frame |
| "Which of these decisions are the expensive ones?" | this file — Triage | STAGE 0 — Frame |
| "What changed now that an agent writes the code?" | [agent-era-shifts.md](agent-era-shifts.md) | every stage |
| "Monolith or microservices? Which style?" | this file — Style Router, then [architecture-styles.md](architecture-styles.md) | STAGE 1 — Structure |
| "Where do the module boundaries go?" | [boundaries-and-contracts.md](boundaries-and-contracts.md) — cohesion/coupling, bounded contexts | STAGE 1 — Structure |
| "How do I stop an agent crossing a boundary?" | [boundaries-and-contracts.md](boundaries-and-contracts.md) — machine-enforced rules | STAGE 1 — Structure |
| "What stack / language / framework?" | [tech-selection.md](tech-selection.md) — model fluency, verifiability, the classics | STAGE 2 — Select |
| "Am I about to build a layer I'll never use?" | [tech-selection.md](tech-selection.md) — speculative abstraction / YAGNI | STAGE 2 — Select |
| "How do I design this API / interface to last?" | [boundaries-and-contracts.md](boundaries-and-contracts.md) — contract-first, versioning | STAGE 3 — Contracts & data |
| "SQL or NoSQL? What's the data model?" | [data-design.md](data-design.md) — access pattern, CAP, per-service data | STAGE 3 — Contracts & data |
| "How do I make it scale / stay up / be secure?" | [nfr-realization.md](nfr-realization.md) — NFR → decision + guardrail | STAGE 4 — Non-functional |
| "How do I keep an agent from gold-plating / optimizing early?" | [nfr-realization.md](nfr-realization.md) — enforced KISS/YAGNI | STAGE 4 — Non-functional |
| "How do I stop the next agent undoing this decision?" | [adr-and-evolution.md](adr-and-evolution.md) — ADRs as persistent memory | STAGE 5 — Record & evolve |
| "How does the architecture keep evolving safely?" | [adr-and-evolution.md](adr-and-evolution.md) — fitness functions | STAGE 5 — Record & evolve |

If your question isn't here, you're usually at the wrong altitude — re-run the Triage to confirm the decision is even one this skill should slow down for, then re-check the weight class.

---

## ESCALATION LADDER — when irreversibility × uncertainty rises

When you hit a decision you can't confidently make, you do not get to freeze and you do not get to guess. You climb this ladder. Each rung costs the user (or the running system) more than the last, so spend the *cheapest* rung the decision's **irreversibility × uncertainty** justifies, and climb only when the rung below is insufficient. Two-way doors live on Rung 0; one-way doors are forbidden from resting there.

```
Rung 0 — PICK A DEFAULT AND DELEGATE (cheapest; for two-way doors)
    State the reasonable default, note "agents may revisit", proceed.
    "Using Postgres + a thin repository interface; the library behind it is
     swappable, so this is a two-way door — moving on."
    Use when: TWO-WAY door, low uncertainty. Cost: none.

Rung 1 — INFER & CONFIRM
    State your best inference on a one-way door and ask for a yes/no before
    you build on it.
    "I'm modeling money as integer minor-units, not floats — confirm before
     I commit the schema."
    Use when: one-way door, you have a well-grounded answer. Cost: one glance.

Rung 2 — SPIKE / PROTOTYPE TO DECIDE
    When you can't responsibly infer because you lack evidence, build the
    cheapest throwaway that produces the evidence — a load test on a candidate
    store, a spike of the tricky integration, a sketch of the schema against
    real query shapes. The agent era makes this rung cheap: a spike is mechanical.
    Use when: the unknown is empirical (will it scale? does this API fit?) and
    a guess on it would set a one-way door. Cost: an agent's time, not the user's.

Rung 3 — DEFER BEHIND A CONTRACT (turn the one-way door two-way)
    When you can't decide yet AND can't afford to wait, hide the undecided
    choice behind an interface you own, so the choice becomes swappable. The
    SEAM is now the one-way door (design it well); what's behind it is two-way.
    "I don't yet know SQL vs a document store for this; both go behind a
     `ProfileStore` port, so we can decide with real data later."
    Use when: the decision is genuinely irreversible-if-made-now but can be
    walled off. This is the single most powerful move in the engine — it
    converts scarce-judgment decisions into cheap ones. Cost: one interface.

Rung 4 — ASK THE USER ONE SHARP QUESTION
    When the call is a one-way door, can't be inferred, can't be spiked cheaply,
    and can't be deferred behind a seam, ask the human-in-the-loop exactly ONE
    high-leverage question — the one whose answer collapses the most uncertainty.
    "Must this data be deletable per-user under GDPR? It changes the storage
     model irreversibly, so I need the answer before I commit the schema."
    Use when: irreversibility HIGH, the answer is the user's to give. Cost: one decision.

Rung 5 — ESCALATE TO THE OWNER
    When the unknown is a policy/legal/compliance call, a cross-team contract,
    or a cost/architecture tradeoff the user in chat is not authorized to make,
    surface it as a decision FOR THE OWNER, refuse to proceed on the affected
    one-way door, and park it as a named open question with an owner.
    "Whoever owns the public API must sign off on this breaking change — I've
     blocked it until they do."
    Use when: irreversibility HIGH and the answer isn't the user's to give.
    Cost: routing to the right human. Worth it — the alternative is shipping
    an unauthorized irreversible decision.
```

### How irreversibility sets the floor

- **Two-way door:** you may start *and* finish on Rung 0. Pick the default, let agents refactor. Interrupting the user for a reversible choice wastes the attention you'll need for the real one-way doors.
- **One-way door, low uncertainty:** start no lower than Rung 1 — confirm the inference before you commit; never silently bake an irreversible default.
- **One-way door, high uncertainty:** you are **forbidden** from resting on Rung 0 or 1. The top-of-file invariant binds. Prefer Rung 3 (defer behind a contract) whenever the choice can be walled off — it's the cheapest way to keep a one-way door open. If it can't, spike (Rung 2), ask (Rung 4), or escalate (Rung 5). A one-way door committed on a silent guess is the single worst failure this skill exists to prevent.

**DEFAULT** when unsure which rung to start on: start one rung *higher* (more cautious) than feels necessary on anything that smells one-way. The cost asymmetry is steep — an extra confirming question or a one-interface deferral costs almost nothing; an unconfirmed irreversible commit costs a migration or a breach.

**FALLBACK** when even the right rung doesn't resolve it (user unreachable, owner hasn't answered): do not let the decision vanish into the build. Take the **most reversible** option available now — usually Rung 3, defer behind a seam, or the most conservative concrete default — record it as an explicit assumption with its open question and owner in an ADR ([adr-and-evolution.md](adr-and-evolution.md)), and carry both into the handoff. A deferred decision behind a clean interface is recoverable; an irreversible one buried in a schema is a latent incident.

---

## Putting the engine together — one full traversal

A worked end-to-end pass, so the routing is concrete.

> **Incoming task:** *"Design the backend for a multi-tenant SaaS that ingests webhooks from customers' systems and shows them dashboards. Start coding."*
>
> **Weight-class selector** — Real users, real per-tenant data, an external webhook contract, several agents will build it in parallel, a tenant-isolation requirement from `groundwork`. Cost-of-error high (cross-tenant data leak), change frequency high, collaborators many → **middleweight, trending heavyweight** (the tenant-isolation NFR trips WC3). Full six-stage flow. *Resist the urge to start coding before the durable layer is triaged.*
>
> **Triage** — Sort the looming decisions. ONE-WAY: the webhook payload contract customers integrate against (TR1 yes — external consumers); the tenant data schema and its isolation model (TR1 yes — production data + a trust boundary); the auth model deciding who sees which tenant's data (TR1 yes — a breach if wrong). TWO-WAY: the dashboard rendering library, the internal service-to-handler structure, the HTTP framework, file layout (TR3 yes — agents swap these in a pass). The three one-way doors get deliberation + ADRs; the rest get defaults and a note that agents may revisit.
>
> **Style router** — SR1 default modular monolith. SR2: webhook ingestion may spike independently of dashboard reads — *plausible* but not yet measured → FALLBACK: build ingestion as a bounded *module* with an enforced interface and instrument it; promote to a service only if the data shows it. SR3: tenant isolation is a hard boundary, but it's a *data* and *auth* boundary, enforceable inside one deployable → no split earned yet. Anti-hype guard holds: no concrete present scaling need, contexts not yet stable → **stay a modular monolith.**
>
> **Routing map** — "Where do boundaries go?" → [boundaries-and-contracts.md](boundaries-and-contracts.md): split by capability (ingestion / dashboards / tenancy-&-auth), each agent-sized, with a dependency-rule lint so an agent can't wire the dashboard module straight into the ingestion store. "SQL or NoSQL + isolation?" → [data-design.md](data-design.md): relational with a tenant-id discriminator vs schema-per-tenant is a one-way CAP/isolation call. "What stack?" → [tech-selection.md](tech-selection.md): a boring, model-fluent, version-stable stack the user can operate.
>
> **Escalation ladder** — The tenant-isolation storage model is a one-way door with high uncertainty (row-level vs schema-per-tenant has irreversible data-layout consequences). Forbidden to rest on a default. Rung 3 first: can it hide behind a `TenantStore` port? Partly — but the physical isolation choice leaks into ops and compliance, so it can't be fully walled off. → Rung 4: ask the user the one sharp question — *"Do any tenants have a contractual/regulatory requirement for physically separate data, or is logical row-level isolation acceptable? It sets the schema irreversibly."* If that answer implies a compliance regime the user can't speak to → Rung 5: escalate to whoever owns compliance, block the schema until answered.
>
> **Record** — Each one-way door (webhook contract, tenant schema, auth model, the not-yet-split decision) becomes an ADR with options-considered, so the next stateless agent session doesn't cheerfully undo it ([adr-and-evolution.md](adr-and-evolution.md)). Boundaries ship with their enforcement lint; NFRs ship with guardrails ([nfr-realization.md](nfr-realization.md)).

The task that arrived as "design it and start coding" leaves the engine as a small, deliberated set of one-way-door decisions with ADRs, a lean monolith with machine-enforced agent-sized boundaries, a stack chosen for the agent-and-human reality, and exactly one irreversible unknown routed to the right human — which is precisely the structured-but-cheap-to-evolve foundation the rest of the flow ([architecture-styles.md](architecture-styles.md) → [tech-selection.md](tech-selection.md) → [boundaries-and-contracts.md](boundaries-and-contracts.md) → [data-design.md](data-design.md) → [nfr-realization.md](nfr-realization.md) → [adr-and-evolution.md](adr-and-evolution.md)) is built to carry into a build the agents can move fast on without breaking the durable layer.

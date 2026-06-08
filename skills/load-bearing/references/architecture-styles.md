# Architecture Styles — What Each Costs and Buys

This reference is the style half of **STAGE 1 — Structure**. You open it after STAGE 0 has set the weight class and triaged the looming decisions by reversibility; it routes you to a concrete architecture *style* and the shape of its module boundaries, then hands the boundary-enforcement and contract work to [boundaries-and-contracts.md](boundaries-and-contracts.md). Every style here is scored on four axes — what it **buys**, what it **costs**, what it **silently makes worse**, and the **weight class** it fits — because the agent era does not change *what* a style is, it changes *which costs an agent can refund and which it cannot*. Read [agent-era-shifts.md](agent-era-shifts.md) before this if you have not; the whole point of this file is to stop you parroting textbook advice whose economics agents have rewritten.

The one axis under everything below is **reversibility**. An agent collapses the cost of changing *code* toward zero — internal layout, library choices, even a full rewrite are now cheap. It does **not** touch the cost of an irreversible split: once another service or team depends on your wire, the network failure, the distributed-consistency problem, and the operational surface are permanent. So the style decision is really one question: *how much irreversible distribution does this system actually earn right now?* Default low; distribute only on a hard predicate, never on hype.

---

## The styles catalog

Pick the **leanest style the weight class allows** ([decision-tree.md](decision-tree.md) sets the weight class). The "silently makes worse" column is the one that sinks projects, because it is the cost nobody priced at kickoff. The "weight class" column is the floor at which the style starts paying for itself — below it, the style is over-engineering.

| Style | What it buys | What it costs | What it SILENTLY makes worse | Fits weight class |
|---|---|---|---|---|
| **Layered** (controller / service / data) | A familiar, low-thought default arrangement; trivial for an agent to generate because the corpus is saturated with it. | Almost nothing up front — that is the trap. | **Boundaries that aren't real.** Layers slice by *technical role*, so one business change smears across every layer; over time it congeals into a big ball of mud with horizontal seams an agent will happily cut straight through. | Any — but as an *internal* organizing tactic, never as the system's top-level decomposition. |
| **Monolith** (single deployable, can be well-structured inside) | One build, one deploy, one process to debug; in-process calls (no network, no serialization); refactor across the whole thing atomically. | Coarse scaling (you scale the whole unit); one runtime fault domain; a large codebase can exceed one agent's context. | **Erosion of internal structure.** With nothing enforcing module lines, agents wire any module to any other for the shortest path to green; "modular" decays to "tangled" invisibly until a split is impossible. | Small-to-medium, early-stage, single team or small agent fleet. The honest default. |
| **Modular monolith** (single deployable + *enforced* internal module boundaries) | Everything the monolith buys, **plus** machine-checked seams: modules talk only through declared interfaces, so a future extract-to-service is mechanical, not surgical. | The discipline cost of declaring and enforcing boundaries (dependency rules, module lint, fitness tests) — cheap to set up, and the agent does the wiring. | Very little, *if* the enforcement is real. If the boundaries live only in a diagram, it silently degrades into a plain monolith. | **The agent-era sweet spot** for anything past trivial. See the dedicated section below. |
| **Microservices** (independently deployable services, each owning its data) | Independent deploy + independent scaling per service; hard fault/team/compliance isolation; heterogeneous stacks per service. | The full distributed-systems tax: network partitions, partial failure, eventual consistency, distributed tracing, service discovery, versioned contracts, multi-service ops. **None of this tax is refunded by agents** — it is runtime, not code. | **Latent coupling becomes a distributed monolith.** Split the code but not the data/contracts and you get every distributed cost with none of the autonomy — the worst quadrant. Also: cross-cutting debugging gets dramatically harder. | Large; multiple genuinely autonomous teams/agent-fleets; real independent-scaling or isolation pressure. |
| **Event-driven** (components communicate via async events/messages) | Loose temporal coupling; natural fan-out; buffering against load spikes; easy to add consumers without touching producers. | Eventual consistency everywhere; no straight-line control flow to read; ordering, duplicate-delivery, and dead-letter handling become *your* problem. | **Causality goes invisible.** "What happened and why" is now scattered across a broker and N consumers; an agent reading one handler cannot see the whole flow, and reasoning/debugging degrade sharply without first-class tracing and a schema registry. | Medium-to-large, where decoupling and spiky/async workloads are real — as an overlay on monolith *or* services, not a whole-system religion. |
| **Serverless** (managed functions, event-triggered, scale-to-zero) | No server ops; pay-per-use; effortless scale-to-zero; fast to stand up a small surface. | Cold starts; execution-time/memory limits; deep vendor lock-in; local testing and observability are awkward. | **Architecture fragments into the cloud console.** The real system lives in IAM policies, triggers, and queues no agent can see from the repo; "where does this run and what calls it" becomes archaeology. | Small, event-shaped, bursty or glue workloads; spiky low-baseline traffic. Rarely the spine of a large system. |

**Overlays, not base styles — apply on top of any spine above, and only on a clear predicate:**

- **CQRS** (separate read and write models). **Buys:** read and write scale and evolve independently; complex read shapes without contorting the write model. **Costs/silently-worse:** two models to keep coherent and the eventual-consistency lag between them. Earn it only when read and write paths have genuinely divergent shapes or scaling profiles — not by default.
- **Event sourcing** (store the event log as the source of truth; derive state). **Buys:** a perfect audit trail and time-travel/replay. **Costs/silently-worse:** schema evolution of *old* events is a one-way-door data problem (forward-ref [data-design.md](data-design.md)), and rebuilding projections is real work. This is one of the **most irreversible** choices in the catalog — the agent does not make the historical log cheaper to reshape. Adopt only when the audit/replay requirement is funded, never for novelty.

**DEFAULT** when two styles look equally fitting: take the one with the **smaller irreversible surface** (fewer independent deployables, fewer wire contracts, simpler data ownership). You can always split later cheaply; you cannot un-split cheaply. **FALLBACK** when the weight class itself is unclear: return to [decision-tree.md](decision-tree.md) and set it before choosing — picking a style against an unknown weight class is how both over- and under-architecting happen.

---

## Monolith First, sharpened for the agent era

The classic argument (Fowler's "Monolith First") was: start with a well-structured monolith, let the real business boundaries reveal themselves under load, and split into services only once you know *where* the seams actually are. The historical objection was that monoliths are painful to break apart later, so some teams pre-split "to be safe."

The agent era settles that objection decisively, and it does so by hitting both sides of the trade asymmetrically:

- **The pre-split insurance is now nearly worthless.** "It's hard to carve a service out later" was the only reason to distribute early. Carving a service out is *mechanical refactoring* — move a module behind a network boundary, generate the client, wire serialization — exactly the work agents now do fast and cheaply. The thing you were buying insurance against got cheap.
- **The distributed tax you'd pay is unchanged.** Network failure, partial failure, distributed consistency, ops surface, and tracing are **runtime** properties of a system with multiple deployables. No agent writing code refunds a network partition. You'd be paying a permanent, irreversible cost to insure against a now-cheap one.

So the agent-era default leans toward the monolith **harder** than the textbook, not softer. Splitting later is cheap; the distributed costs of splitting early are not.

> **One-line heuristic:** *Premature distribution buys you a permanent runtime cost to avoid a now-cheap refactor. Don't.*

### The modular monolith is the sweet spot

A plain monolith has one failure mode an agent makes worse: with nothing enforcing internal module lines, the structure erodes. The **modular monolith** fixes exactly that while keeping every deploy-time advantage:

- **One deployable, one process, in-process calls** — you keep simple deploys, atomic refactors, and straight-line debugging. No network tax.
- **Internal boundaries that are *machine-enforced*** — modules expose declared interfaces and may not reach into each other's internals; a dependency rule / module-boundary lint / architecture fitness test fails the build when an agent crosses a line. (The mechanics live in [boundaries-and-contracts.md](boundaries-and-contracts.md).)
- **A cheap future split** — because each module already talks only through a contract, promoting one to its own service is the mechanical refactor agents are good at. You've kept the *option* to distribute without paying for it now.

This is the structural embodiment of the reversibility thesis: get the deploy simplicity of a monolith *and* the clean seams of services, with the one-way-door cost (an actual split) deferred until a predicate below forces it. Make the modular monolith your default for anything past a trivial script.

**PREDICATE — modular monolith vs plain monolith?** Will more than one agent or person change this codebase concurrently, OR is there any module you can already name as a likely future service? If **yes**, pay the small enforcement cost now (modular). If genuinely **no** — a throwaway or solo short-lived tool — a plain monolith is fine; don't gold-plate it. **DEFAULT:** modular. The enforcement is cheap and the erosion it prevents is expensive and invisible until too late.

---

## Conway's Law, and its agent-fleet generalization

**Conway's Law:** a system's structure ends up mirroring the communication structure of the org that builds it. If three teams build a compiler, you get a three-pass compiler. Architecture is therefore never purely technical — draw your module boundaries and your org boundaries *together*, or the org's real communication paths will silently re-draw your architecture for you.

The agent era generalizes this in two directions, and you must design for both:

1. **Modules should be agent-sized.** An agent works inside a finite context window. A boundary is well-drawn when one module — *plus its contracts and its tests* — fits in that window, so a single agent can own it end-to-end: understand it, change it, and verify it without paging in the whole system. A module too large to fit forces the agent to work blind on its edges; a swarm of nano-modules forces constant cross-boundary context-switching. "Agent-sized" is the new "team-sized." (This file states *why* the style choice depends on agent-sized seams; the mechanics of drawing and machine-enforcing them are owned by [boundaries-and-contracts.md](boundaries-and-contracts.md) — go there to operationalize, not to re-derive.)

2. **Seams must let parallel agents not collide.** A fleet of agents working in parallel is an org, and Conway applies to it. Two agents editing across the same fuzzy boundary will produce merge conflicts, double-implement the same thing, or silently break each other's assumptions. Clean, contract-mediated seams are what let agents work concurrently on different modules without stepping on each other — the same property that lets human teams work in parallel, now load-bearing at agent speed and agent volume.

**Inverse Conway maneuver:** because the org shape *will* impose itself on the architecture, deliberately choose the team/agent-ownership structure that matches the architecture you want, rather than fighting the mismatch. Decide who (which agent, which person) owns which module *as part of* drawing the boundaries — ownership and structure are one decision, not two.

---

## When to distribute — the predicate gate

Splitting into independently deployable services is a **one-way door**: once another service or team depends on your wire, you own a contract and a distributed-failure surface you cannot quietly retract. So distribution requires a *positive* reason that the weight class actually presents — not the absence of a reason to stay monolithic. Run these predicates; distribute a boundary only if at least one fires for a concrete, present need.

| Predicate | What it means | What does NOT satisfy it |
|---|---|---|
| **Independent scaling profiles** | Two parts have genuinely divergent load/resource shapes — one is CPU-bound and spiky, the other steady and memory-bound — so scaling them together wastes a lot. | "It might get big someday." Speculative scale is YAGNI; scale the monolith first and measure. |
| **Hard isolation / compliance boundary** | A regulatory, security, or blast-radius requirement *mandates* separation (e.g. PCI/PII data must live in an isolated trust zone; one component must not be able to take the rest down). | "Cleaner separation" as an aesthetic. A module boundary inside a modular monolith already gives you logical isolation. |
| **Genuine team / agent autonomy** | Distinct teams (or distinct, independently-operating agent fleets) need to deploy, release, and own a service on their own cadence without coordinating every change. | One team that *might* grow. Premature org-splitting via Conway imposes coordination cost you don't have yet. |

**Anti-hype guard.** "Microservices," "event-driven," "Kubernetes," and "serverless" are architectural choices, not achievements. If the only reason on the table is that the style is modern, that a conference talk recommended it, or that it would look good on a résumé — **stop**. That reasoning belongs to the over-engineering anti-pattern; the agent will cheerfully build whatever distributed complexity you describe and feel no tedium doing it, so the deterrent has to be this gate, not the agent's reluctance. Boring, proven, monolithic-by-default is the higher-status engineering choice here.

**DEFAULT** when a predicate is borderline: **do not distribute** that boundary — keep it as a machine-enforced module inside the modular monolith. You retain the cheap option to extract it the moment the predicate genuinely fires, and you've paid none of the runtime tax meanwhile. **FALLBACK** when you cannot yet tell whether a predicate fires (you lack the load data, the compliance ruling, or the org plan): keep it monolithic and record the open question and its trip-wire in an ADR ([adr-and-evolution.md](adr-and-evolution.md)) — "extract `billing` to a service **when** PCI scope is confirmed." Distributing on a guess is the expensive direction of the one-way door.

### Escalation ladder — how much to distribute as uncertainty rises

Climb one rung only when a predicate above forces it; never skip rungs to chase the destination.

```
single layered file            (throwaway / spike)
  → structured monolith        (small, settled, solo or one agent)
     → MODULAR MONOLITH        (the default past trivial — enforced internal seams,
        │                       split-later kept cheap)
        → extract ONE service  (the single module a predicate actually fired on —
           │                    not a big-bang carve-up)
           → microservices      (multiple autonomous teams/fleets, real isolation/scale
              │                  pressure across many boundaries)
              → + event-driven   (async decoupling where flows are genuinely spiky/fan-out)
                 + CQRS / ES     (overlays, only where read/write or audit/replay demand it)
```

Each rung up adds permanent runtime cost and irreversible surface. Stop at the lowest rung the predicates justify. The cheap direction is always *down-and-later* (agents extract a service on demand); the expensive direction is *up-and-early* (you cannot un-distribute without breaking everyone who came to depend on the wire).

---

## The distributed-monolith trap

The single worst outcome in this whole space is the **distributed monolith**: you paid the full distributed-systems tax (network, partial failure, eventual consistency, multi-service ops, tracing) but the services are still *logically* entangled — they share a database, or a chatty synchronous contract, so a change to one forces coordinated changes and redeploys across several. You get every cost of distribution and none of its autonomy. It is the worst quadrant on the map, and it is *easy* for an agent to produce: told to "split into services," an agent will happily slice the deployables while leaving the data and call-graph coupling intact, because the coupling doesn't show up in a green test.

Two warning signs you are building one:

- **A shared database across "separate" services.** This is a hidden hard coupling masquerading as separation — change a column and N services break. Service-owns-its-data is the cure; see [data-design.md](data-design.md).
- **You cannot deploy one service without redeploying others.** If the services move in lockstep, the boundary is a fiction; the logical coupling never got cut.

The cure is not "distribute more carefully" — it is **getting the boundaries and contracts right *before* you distribute**, which is precisely why STAGE 1 enforces a machine-checked module decomposition and STAGE 3 enforces deliberate contracts. The full diagnosis and cure live in [boundaries-and-contracts.md](boundaries-and-contracts.md). The reversibility lesson stands: prove the seam holds as a *module* in a modular monolith first (cheap to fix when it's wrong), and only promote it across a network boundary once a predicate forces it and the contract is clean.

---

## Handoff

You leave this file with a chosen style, the rung on the escalation ladder it sits at, and — for anything past trivial — a modular-monolith default whose seams are machine-enforced. Carry that into [boundaries-and-contracts.md](boundaries-and-contracts.md) to decompose the modules by business capability and name the enforcement mechanism, then to STAGE 3 for the contracts and data model where the truly irreversible decisions live. Record every distribution decision and every deferred predicate as an ADR ([adr-and-evolution.md](adr-and-evolution.md)) so the next stateless agent session does not undo a one-way door it cannot see the reasoning for. Return to [../SKILL.md](../SKILL.md) to clear the STAGE 1 gate.

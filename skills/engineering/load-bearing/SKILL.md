---
name: load-bearing
description: >
  Design a system's architecture for the agent-assisted era: choose the
  architecture style, the stack, the module boundaries, the contracts, and the
  data model — concentrating scarce human judgment on the irreversible decisions
  and letting agents move fast behind the reversible ones. Use when the user is
  designing or restructuring a system, choosing between monolith and
  microservices, picking a tech stack or database, defining APIs or module
  boundaries, deciding how to realize non-functional requirements (scale,
  availability, security), writing an ADR, or about to build something
  structurally non-trivial. Triggers on "design the architecture", "what stack
  should I use", "monolith or microservices", "how should I structure this",
  "design the data model / API", "system design".
argument-hint: "[system / feature / change to architect]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# load-bearing

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Architecture is the set of decisions that are **expensive to reverse**. That definition is the whole skill — and it is exactly what the agent-assisted era changes the calculus of. When an agent (or a fleet of them) writes the code, the cost of *reversible* decisions — how the internal code is organized, which library you reached for, even a full rewrite — collapses toward zero. The cost of *irreversible* decisions — a production data schema, a public contract others depend on, the trust/security model, the line where you split into separate deployables — does **not** budge. Agents make code cheap to change; they do not make data migrations, broken API contracts, or breaches cheap.

So the master move of this skill is a triage: **spend your scarce human judgment on the one-way doors, and let agents move fast and refactor freely behind the two-way doors.** Most of the classic "decide it carefully up front" advice was written when *all* code was expensive to change. Half of it now applies only to the durable layer.

**Speak the owner's language, or the one-way door isn't theirs.** This skill works by spending the user's judgment where you cannot reverse it — validating an inherited decision, approving or vetoing an ADR — and they can only judge a decision they follow. Read their fluency from how they talk, and gloss a term on first use (`SSRF`, `CAP`, `idempotent`, a discriminated union). An owner nodding at an ADR they did not parse hasn't approved that door — they've abdicated it, the exact irreversible mistake this skill exists to prevent.

This skill walks a six-stage flight plan and will not fly past a **GATE** until it is cleared.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first.** It is the heart of this skill: the seven ways architecture in the agent era differs from the textbook, each with the design consequence. The human-era canon (Conway, Monolith First, DDD, CAP, ADR, KISS/YAGNI) is all still here — but re-aimed for a world where the code is written by something that has no instinct to respect a boundary, feels no cost producing complexity, and forgets everything between sessions.

This stage consumes the output of the `groundwork` skill — the funded requirements, the non-functional requirements, and the scope. If that does not exist yet, get it first; designing against unstated requirements is the original sin. If `$ARGUMENTS` is a trivial, structurally-settled change, this skill is overkill — say so and proceed.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. The reversibility triage (one-way vs two-way doors), the weight-class selector (how much architecture this even earns), the style router, and the escalation ladder. Open it at the start and keep it beside you.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: what changed now that agents write the code, and the guardrails that replace the human instincts the agent lacks. Load at the start, re-check at every gate.
- [references/architecture-styles.md](references/architecture-styles.md) — layered / monolith / modular-monolith / microservices / event-driven / serverless: what each costs and buys, Monolith First (sharpened for the agent era), and Conway's Law generalized to agent fleets.
- [references/tech-selection.md](references/tech-selection.md) — choosing a stack on agent-era criteria (model fluency + version stability, reviewer verifiability) and the classic ones (maturity, ecosystem, license, fit); résumé-driven and speculative-abstraction anti-patterns.
- [references/boundaries-and-contracts.md](references/boundaries-and-contracts.md) — module decomposition (cohesion/coupling, DDD bounded contexts, agent-sized modules), machine-enforced boundaries, and interface-first contract design.
- [references/data-design.md](references/data-design.md) — the hardest-to-reverse layer: SQL vs NoSQL by access pattern, CAP, service-owns-its-data, and planning for growth.
- [references/nfr-realization.md](references/nfr-realization.md) — turning each non-functional requirement into a concrete design decision *and* an enforced guardrail.
- [references/adr-and-evolution.md](references/adr-and-evolution.md) — ADRs as the persistent memory across stateless agent sessions, and architecture as something continuously evolved behind fitness functions.

---

## STAGE 0 — Frame (set the weight class, then triage by reversibility)

Open **[references/decision-tree.md](references/decision-tree.md)**. Before any box-drawing, set two things.

**The weight class.** Architecture must match scale and risk — *够用就好*, no more. Three dials set how much architecture this earns: **cost of getting it wrong** (blast radius), **change frequency**, and **who collaborates** — and in the agent era that last dial now counts *agents* alongside humans (parallel agents need clean seams just as teams do). A throwaway script and a payments platform are not the same weight class; over-architecting the former is the same error as under-architecting the latter.

**The reversibility triage — the agent-era core.** List the decisions this design will make and sort each into a **one-way door** (irreversible / expensive: the production data schema, a public or inter-service contract, the auth & trust model, the monolith-vs-distributed split once others depend on it) or a **two-way door** (reversible / cheap: internal module layout, a library choice, naming, file organization). The one-way doors get your real deliberation and an ADR; the two-way doors get a reasonable default and a note that agents may revisit them freely. Guessing which is which is how cheap decisions get gold-plated and expensive ones get rushed.

**Reconcile inherited decisions.** Most agent-era architecture is *one feature inside an existing system*, not a greenfield whole — see the feature-within-a-system sizing mode in the decision tree. When a `groundwork`/requirements artifact or the existing codebase has already walked some one-way doors (a fixed data model, chosen pattern-match semantics, a fail-open/closed policy, the existing stack and boundaries), list them explicitly as **INHERITED** and mark each **VALIDATE** (you agree — record why) or **CHALLENGE** (you believe it is wrong — escalate, do not silently override). Carry every upstream **open question** forward: each must be resolved, deferred behind a seam, or handed to a named owner — none may vanish into the design. You are *validating* these doors, not re-opening them: don't re-derive a settled call from scratch (that is bloat), and don't let a blocking upstream unknown disappear.

### GATE — clear before STAGE 1
1. `checklist check frame weight-class-set`
2. `checklist check frame reversibility-mapped`
3. `checklist check frame inherited-decisions-reconciled`
4. `checklist verify frame`

---

## STAGE 1 — Structure (architecture style & module boundaries)

Open **[references/architecture-styles.md](references/architecture-styles.md)** and **[references/boundaries-and-contracts.md](references/boundaries-and-contracts.md)**.

**Style.** Default to the leanest style the weight class allows. **Monolith First** is *stronger* in the agent era, not weaker: the classic reason to pre-split — "it's painful to break a monolith apart later" — is exactly the cost agents now slash, while the runtime cost microservices buy you (network failure, distributed consistency, ops, tracing) is untouched by agents writing the code. Do not let hype pick the style. Respect **Conway's Law** — the system grows into the shape of the org that builds it — and its agent generalization: a boundary should also be **agent-sized**, fitting one working context with its contracts and tests so an agent can own it end-to-end.

**Boundaries.** Split by **business capability / bounded context**, not by technical layer (controller/service/dao). High cohesion, low coupling. Getting a boundary wrong is expensive to redraw, and the **distributed-monolith** (services that are physically split but logically entangled) is the worst of both worlds. Because an agent has no instinct to respect a boundary — it will reach across one for a shorter path to a green test — name the **machine-enforced** mechanism that will hold the line (dependency rules, module-boundary lint, architecture fitness tests).

**Design for deletion, not just for extension.** A sharp, machine-checkable reading of "low coupling" is the **deletion test**: *could this whole capability be removed in a single PR without the core bleeding?* Make it pass by pointing the dependency arrows one way — from the short-lived edge toward the long-lived core (a feature may import the core; **the core never imports a feature**) — so a feature is a clean-excisable organ, not a tumor grown through nine files. This is a better bet than designing for extension: easy-to-extend pays off only if you guessed the axis of future change right (and the speculative extension point you guessed wrong becomes dead weight you can't delete *either*), whereas easy-to-delete wins on every branch — the change that does arrive is cheaper to excise-and-replace than to unpick from an over-fitted abstraction. The `utils.py` everything imports is the anti-shape: nothing can be deleted because everything depends on it.

### GATE — clear before STAGE 2
1. `checklist check structure style-justified`
2. `checklist check structure boundaries-by-capability`
3. `checklist verify structure`

---

## STAGE 2 — Select (the stack)

Open **[references/tech-selection.md](references/tech-selection.md)**. The classic trade-off was *team-familiar* vs *theoretically best*, because humans pay a learning cost. The agent-era criteria shift:

- **Model fluency + version stability.** An agent is most reliable in technologies with a deep, stable training corpus and slow-changing idioms; it hallucinates APIs in niche or post-knowledge-cutoff frameworks. The agent's "familiarity" is its training distribution — weigh it.
- **Reviewer verifiability.** The bottleneck moved from *writing* to *reviewing*: choose what the human-in-the-loop can verify, operate, and debug, and a stack whose type system / fast tests / static analysis act as guardrails on agent output.
- The durable classics: maturity, ecosystem, documentation, license, hiring, fit with the existing stack.

Reject **résumé-driven / novelty-driven** selection and **speculative abstraction** — the layer "in case we swap databases someday" the agent will happily build and you will never use (YAGNI).

### GATE — clear before STAGE 3
1. `checklist check select stack-justified`
2. `checklist verify select`

---

## STAGE 3 — Contracts & data (the durable layer — spend extra care here)

This stage groups the two things that are **hardest to reverse**, which in the agent era is precisely why they earn the most human judgment. Open **[references/boundaries-and-contracts.md](references/boundaries-and-contracts.md)** and **[references/data-design.md](references/data-design.md)**.

**Contracts.** An interface, once depended on, is a contract that is painful to change. Design it deliberately and leave room to evolve (versioning, backward compatibility). **Interface-first** pays a triple dividend now: the contract is the spec an agent codes against, the oracle that verifies it, and the seam that lets agents work both sides in parallel against stubs. Internal module interfaces deserve the same care as the public API. The reliable way to *arrive* at a good interface is **caller-first**: write the call site you wish you had — plus at least two *diverse* callers, one of them a test — *before* the implementation, and derive the interface from how it wants to be used. This is what makes a module **deep** (a simple interface over a complex implementation, Ousterhout) instead of a shallow mirror of its own internals, and it surfaces the awkwardness while the design is still free; it is also the real value of TDD (*caller*-first, which the test happens to enforce, not merely *test*-first).

**Data.** The data model is the single hardest part of the system to change — and agents *do not* lower migration cost, so as code gets cheap to rewrite, the data model's relative permanence only grows. Choose **SQL vs NoSQL by access pattern and consistency need**, not by fashion; make the **CAP** trade-off explicit; let **each service own its data** (a shared database is a hidden hard coupling); plan growth, indexes, and the dominant queries up front.

### GATE — clear before STAGE 4
1. `checklist check contracts-data contracts-defined`
2. `checklist check contracts-data data-model-justified`
3. `checklist verify contracts-data`

---

## STAGE 4 — Non-functional realization (turn qualities into decisions and guardrails)

Open **[references/nfr-realization.md](references/nfr-realization.md)**. The non-functional requirements `groundwork` recorded become design decisions *here*, and most are very hard to bolt on later. For each funded NFR, name the decision **and the guardrail that enforces it** — because an agent produces plausible-but-unsafe and plausible-but-slow code confidently, and feels no cost adding complexity:

- **Scalability** — horizontal vs vertical; what is stateless?
- **Availability** — redundancy, failover, blast-radius isolation.
- **Performance** — where to cache, where to go async; a perf budget enforced in CI.
- **Security** — authn/authz and defense-in-depth; secure-by-default frameworks and automated SAST in the loop, not left to the agent's judgment.
- **Observability** — logs, metrics, traces designed in as hooks; the agent can't feel production pain, so the system has to surface it.

Enforce **KISS / YAGNI** and **no premature optimization** as gates, not hopes — the agent's natural deterrent against complexity (tedium) is gone.

### GATE — clear before STAGE 5
1. `checklist check nonfunctional nfrs-realized`
2. `checklist verify nonfunctional`

---

## STAGE 5 — Record & evolve (ADRs + evolutionary architecture)

Open **[references/adr-and-evolution.md](references/adr-and-evolution.md)**. Capture every one-way-door decision as an **ADR (Architecture Decision Record)** — not just "we chose X" but the context, the options considered, and *why the others were rejected*. In the agent era this is not just documentation: an ADR is the **persistent memory across stateless agent sessions**, the thing that stops the next agent from cheerfully undoing a deliberate decision because it can't see the reasoning.

An ADR has a second reader besides the next agent: the human owner who approves it now and may overturn it later. Write each so they can — the decision and *why the alternatives lost* in plain terms, with a one-line gloss of any unavoidable jargon. A decision the owner cannot follow is one they cannot veto, which turns their approval into a rubber stamp.

Keep the diagrams and the code in sync (drift is faster at agent speed; prefer architecture-as-code where you can), and treat the architecture as **continuously evolved** behind **fitness functions**, not frozen at kickoff — the mechanical refactoring that makes evolution safe is now cheap.

### FINAL GATE
1. `checklist check record adrs-and-evolution`
2. `checklist verify record`
3. `checklist show` — confirm all six stages passed.
4. `checklist done` — clear this run's state.

---

## Handoff to building & testing

The architecture is a set of decisions, not a finished system — carry the chosen style, the boundaries with their enforcement mechanism, the contracts, the data model, and the ADRs forward into implementation. The contracts become the interfaces agents build against; the NFRs and their guardrails become the targets the `assay` skill validates. Groundwork said *what*; this said *how it's structured*; assay confirms *it holds*.

## Anti-patterns (use as a pre-flight checklist)

- **Hype-driven architecture** — microservices/event-sourcing/Kubernetes because they're fashionable, not because the weight class demands them. (`agent-era-shifts.md` — reversibility & Monolith First)
- **Over-engineering** — a complex architecture for imagined future needs; KISS and YAGNI. The agent makes this *free to produce* and you still pay to maintain it.
- **Premature optimization** — optimizing before data shows where the bottleneck is; the agent feels no cost adding the complexity, so this has to be a gate, not its restraint.
- **Distributed monolith** — split into services that are still tightly coupled; both costs, neither benefit.
- **Shared database across services** — a hidden hard coupling masquerading as separation.
- **Speculative abstraction** — the swap-the-database layer you'll never use; an agent will build it on request.
- **Designed-to-extend, impossible-to-delete** — extension points bet on a guessed future; favor the deletion test (excise a capability in one PR) and point dependency arrows edge→core.
- **Implementation-first interface** — an API that mirrors the internal pipeline (`set_x(); prepare(); run()`); design caller-first, deriving the interface from the call site you wish you had.
- **Boundaries by technical layer** — slicing controller/service/dao instead of by business capability.
- **Diagram–code drift** — a beautiful diagram and a codebase that does something else; keep docs alive with the system.
- **Architecture as a one-shot artifact** — frozen at kickoff; good architecture is continuously refactored, and that is now cheap.
- **Unenforced boundaries** — a rule that lives only in a doc; an agent will cross it at the first convenient opportunity.
- **Skipping a GATE** — the user's judgment at each gate can change the whole plan.

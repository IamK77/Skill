# Decision Records & Evolutionary Architecture

This reference is the depth behind **STAGE 5 — Record & evolve**, the last stage of `load-bearing`, and it has two halves. The first half is the **ADR**: how to capture each one-way-door decision as an Architecture Decision Record whose real job, in the agent era, is to be the *persistent memory across stateless agent sessions* — the written "why" that stops the next agent from cheerfully undoing a decision it cannot see the reasoning for. The second half is **evolution**: architecture is not frozen at kickoff but continuously refactored, and the only thing that makes continuous change *safe* is machine enforcement — **fitness functions** that fail the build on drift, and architecture-as-code that keeps the diagram from lying. Open this after STAGE 0 has produced the reversibility triage (see [decision-tree.md](decision-tree.md)); STAGE 5 turns that triage's one-way-door list into a durable record and a set of executable guards.

The thread running through both halves is the same one running through the whole skill (see [agent-era-shifts.md](agent-era-shifts.md)): an agent forgets everything between sessions, feels no cost producing complexity, and has no instinct to respect a boundary or a prior decision. Documentation and continuous refactoring were *aspirations* in the human era because both were expensive to keep up. Agents flip both economics — refactoring is now cheap, and undocumented decisions are now *dangerous*, not merely untidy — so STAGE 5 is where the human era's two weakest-honored disciplines become load-bearing.

---

## PART ONE — ARCHITECTURE DECISION RECORDS

### What an ADR is, and the one rule that defines it

An ADR is a short, immutable, dated note that records **one** architecturally significant decision: the context that forced the choice, the options that were on the table, the option chosen, and — the part everyone skips and the part that matters most — *why the other options were rejected*. It is not design documentation, not a spec, not a wiki page that gets edited forever. It is a single decision, captured at the moment it was made, and then left alone.

The defining rule: **an ADR records the decision AND the alternatives not taken.** "We chose PostgreSQL" is a fact, not an ADR. "We chose PostgreSQL over DynamoDB because our access patterns are relational and we need multi-row transactions; we rejected DynamoDB because modeling our join-heavy reporting queries in a single-table design would have been fragile, and we rejected staying on SQLite because we need concurrent writers" — that is an ADR. The rejected options are the whole value: six months later they are exactly what stops someone (or some agent) from "fixing" your deliberate choice by reintroducing the option you already ruled out.

> **The human-era reason ADRs existed:** to save the next *human* from archaeology — from re-litigating a settled debate, or worse, silently breaking a constraint they never knew was deliberate. That reason still holds. The agent-era reason, below, is *stronger* and changes who the audience is.

### The agent-era reason ADRs matter more now — persistent memory across stateless sessions

Every agent session starts from zero. It reads the code, infers intent from what it sees, and acts. It cannot remember why the last agent — or the human three weeks ago — made the schema denormalized, put the rate limiter in front of the cache, or kept the two services on separate databases despite the obvious convenience of sharing one. The code shows *what* is true; it almost never shows *why*, and the "why" is precisely what protects an irreversible decision.

This makes an ADR something it was not in the human era: **the durable memory that survives the context window.** A human who forgets a decision can at least be reminded by a colleague or feel a vague unease. A fresh agent has no colleague and no unease — it has only what is written. Without an ADR, a deliberate one-way-door decision is indistinguishable, to the next agent, from an accident waiting to be cleaned up. *With* an ADR, the reasoning is in the record where the next agent can read it before it touches the design.

Two operating rules follow, and STAGE 5 enforces both:

- **RULE — read before you change.** Before modifying anything architectural — a schema, a public or inter-service contract, the auth model, the distribution split — an agent MUST search for and read the relevant ADRs first. Changing a structure whose ADR you have not read is the agent equivalent of editing code you have not run: you will confidently undo something on purpose. If an ADR exists and its decision still holds, the proposed change is wrong; if the change is genuinely warranted, it *supersedes* the ADR (see "Status," below) and that supersession is itself reviewed by the human.
- **RULE — write before you commit a one-way door.** When an agent makes a one-way-door decision, it MUST write the ADR *as part of the same change*, so the human-in-the-loop reviews the **reasoning**, not just the diff. A schema migration with no ADR gives the human a wall of DDL to rubber-stamp; the same migration *with* an ADR gives the human the actual decision to approve or veto. The ADR is how the agent surfaces its judgment for the one kind of decision where human judgment is non-negotiable.

> The asymmetry is the point. Agents collapse the cost of reversible decisions toward zero (see [agent-era-shifts.md](agent-era-shifts.md)), so for two-way doors you do not need a record — let the agent refactor freely. ADRs are for the **one-way doors only**. Spend the ceremony exactly where reversal is expensive and nowhere else; an ADR for every variable rename is the documentation equivalent of over-engineering.

### What earns an ADR — the reversibility triage, applied

You already produced the one-way-door list in STAGE 0's reversibility triage. An ADR is owed to each item on it, and to nothing off it. The mapping is direct:

| Decision class | One-way door? | ADR owed | Why (agent era) |
|---|---|---|---|
| Production data schema / model | **Yes** — migrations are expensive and risky; agents do *not* lower migration cost | **Always** | The hardest layer to reverse only gets harder as code gets cheap; see [data-design.md](data-design.md) |
| Public or inter-service contract | **Yes** once depended on — breaking consumers is irreversible without coordination | **Always** | Contract is also the spec agents build against; record its shape and its evolution policy ([boundaries-and-contracts.md](boundaries-and-contracts.md)) |
| Auth / trust / security boundary | **Yes** — a breach is unrecoverable; trust models propagate everywhere | **Always** | An agent writes plausible-but-unsafe code confidently; the record names the invariant it must never break ([nfr-realization.md](nfr-realization.md)) |
| Monolith-vs-distributed split | **Yes** once others deploy against the boundary | **Always** | The split's *reversal* is cheap now, but its *consequences* (network, consistency, ops) are not; record why you split, or didn't |
| Architecture style / major framework | Mostly **two-way** in-process; **one-way** if it shapes data or contracts | **If it shapes a durable layer** | Record the style choice when it constrains the schema or the public surface, not when it is purely internal |
| Database / queue / infra *vendor* | **Yes** when data lives in it; coupling is sticky | **Usually** | Migrating live data between vendors is a one-way door even when the client code is trivial to swap |
| Internal module layout, file org, naming | **No** — refactor freely | **Never** | A two-way door; an agent may revisit it any time. An ADR here is noise |
| Library / dependency choice (no data, no public surface) | **No** — swap is cheap | **Only if it is hard to remove later** (deep coupling, lock-in) | Default: no ADR. Exception: a dependency that metastasizes into every module |

**The test, in one line:** if reversing this decision later would require a data migration, a coordinated change across teams or services, a security re-architecture, or a deploy-topology change — it earns an ADR. If reversing it is "an agent refactors it in an afternoon," it does not.

### The ADR format

Five sections. Keep each tight; an ADR that runs past a page is usually three decisions wearing one trenchcoat — split it.

| Section | What goes here | The failure if you skip it |
|---|---|---|
| **Title** | A number and a short noun phrase: `ADR-0007: Each service owns its own database`. Numbered, never renumbered | Records become unsortable and uncitable |
| **Status** | `Proposed` → `Accepted` → (later) `Deprecated` / `Superseded by ADR-NNNN`. A lifecycle, not a label | A "live" decision and a dead one look identical; an agent obeys a reversed rule |
| **Context** | The forces in play: the requirement, the constraint, the NFR, the scale, the team/agent topology. *Why a decision was needed at all* | The next reader cannot tell whether the original forces still apply |
| **Decision** | The choice, stated as an active assertion: "We will…". One decision per record | Vague decisions get reinterpreted; an agent fills the gap with a guess |
| **Options considered & why rejected** | Each real alternative, with the concrete reason it lost. This is the load-bearing section | Without it, the rejected option looks unconsidered and gets "discovered" and reintroduced |
| **Consequences** | What this makes easy, what it makes hard, what it commits you to, what new work it creates. The honest cost, both signs | A decision read as pure upside; its downstream costs surprise everyone |

**On Status specifically (the agent-era subtlety):** ADRs are immutable, but decisions are not eternal. You never edit an Accepted ADR to change its mind — you write a *new* ADR that supersedes it, and you mark the old one `Superseded by ADR-NNNN`. This is what makes the record trustworthy as agent memory: a fresh agent reading `ADR-0007 (Superseded by ADR-0019)` knows to follow the trail forward rather than obey a reversed rule. An edited-in-place ADR would silently rewrite history and the next agent would have no way to know the decision had ever been different — or *why* it changed.

### Copy-paste template (MADR-style)

```markdown
# ADR-NNNN: <short imperative title — the decision as a noun phrase>

- Status: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: <human(s) who hold authority; agent(s) who proposed>
- One-way-door: yes   # if no, you probably do not need this ADR

## Context and problem statement

<Why a decision is needed now. The requirement, constraint, NFR, scale
assumption, or team/agent topology that forces a choice. State the forces
plainly — they are the criteria the options are judged against. End with
the question in one sentence: "How should we ___?">

## Decision drivers

- <driver 1 — e.g. must support concurrent writers>
- <driver 2 — e.g. must not couple two services through shared state>
- <driver 3 — e.g. reviewer must be able to verify correctness locally>

## Considered options

1. <Option A — the one we chose>
2. <Option B>
3. <Option C>

## Decision

We will <Option A>.

<One paragraph: the choice as an active assertion, tied back to the drivers
that selected it.>

## Options considered and why rejected   <!-- the load-bearing section -->

- **<Option B>** — rejected because <concrete reason against THIS context:
  the specific cost, risk, or mismatch with a driver>.
- **<Option C>** — rejected because <…>. (Note any condition under which it
  WOULD win, so a future agent knows when to revisit.)

## Consequences

- Good: <what this makes easy / cheap / safe>.
- Bad / cost: <what this makes hard / commits us to / the new work it creates>.
- Enforcement: <the fitness function / contract test / boundary lint that now
  guards this decision — see Part Two. A decision with no guard erodes at
  agent speed.>
- Revisit when: <the trigger that should reopen this — a scale threshold, a
  new requirement, a deprecation. Leaves a tripwire for the next session.>
```

> **Two agent-era fields the classic MADR template lacks, added deliberately:** `Enforcement` ties each one-way-door decision to the machine guard that holds it (Part Two), so the ADR is not just a memory but a *checkable* one. `Revisit when` plants a tripwire: a stateless future agent cannot remember to reconsider a decision, so the condition for reconsidering it must be written into the record itself.

### A worked ADR (concrete)

```markdown
# ADR-0012: Idempotency keys on the public charge endpoint

- Status: Accepted
- Date: 2026-05-30
- Deciders: payments lead (human); implementing agent (proposed)
- One-way-door: yes  (public contract + money correctness)

## Context and problem statement
Clients retry on network timeout. Without a dedupe mechanism a retried POST
/charges can charge a card twice. This is a public contract and a
money-correctness invariant — both one-way doors. How do we guarantee
at-most-once charging across client retries?

## Decision drivers
- Double-charging is an unrecoverable trust failure (blast radius: money).
- The mechanism becomes part of the public contract — expensive to change later.
- A reviewer must be able to verify "retry => single charge" in a fast test.

## Considered options
1. Client-supplied Idempotency-Key header, deduped server-side for 24h.
2. Server-side dedupe by hashing the request body.
3. No dedupe; document "do not retry" and rely on clients.

## Decision
We will require an `Idempotency-Key` header; the server stores key→result and
returns the original result on replay within a 24h window.

## Options considered and why rejected
- **Body-hash dedupe** — rejected: two legitimately distinct charges with
  identical amounts would collide, and any incidental field reordering would
  defeat it. Fragile oracle.
- **No dedupe / "don't retry"** — rejected: pushes a money-correctness
  invariant onto clients we do not control; a single retrying client causes a
  double charge. Unacceptable blast radius.

## Consequences
- Good: at-most-once is enforced server-side, independent of client behavior.
- Bad: adds a key store and a 24h retention/cleanup job; the header is now
  permanent public surface (versioned, never silently dropped).
- Enforcement: contract test asserts replay(key) returns the original charge id
  and does NOT re-charge; this test fails the build if dedupe regresses.
- Revisit when: we need cross-region dedupe (the 24h single-store assumption
  breaks) or the window proves wrong in production.
```

Notice what the rejected-options section buys: a future agent that "simplifies" by switching to body-hashing will be confronted, in the record, with the exact reason that path was already closed — and the contract test in `Enforcement` will go red if it tries anyway.

---

## PART TWO — EVOLUTIONARY ARCHITECTURE

### The reframe: "continuously refactored" stops being aspirational

Good architecture was always supposed to be continuously evolved — refactored as the system learns, never frozen at kickoff. In the human era this was an *ideal* honored mostly in the breach, because the mechanical work of evolution (renaming across a hundred files, extracting a module, splitting a service, threading a new parameter everywhere) was tedious and expensive, so teams froze the structure and let it rot instead.

Agents change that economics directly: the mechanical refactor is now the cheap part. An agent can extract the module, split the service, and rethread the parameter across the codebase in one pass. So evolutionary architecture flips from *aspiration* to *default*. The constraint is no longer "can we afford to refactor?" — it is "**can we refactor safely, at agent speed, without drift?**" That question has one answer: machine-enforced guardrails. The rest of this part is about those guards.

> Restated against the master axis: agents make *reversible* change cheap, which is exactly what evolution is. So evolution behind a guard becomes the normal operating mode. What does *not* get refactored freely is the one-way-door layer — those changes still go through an ADR and the human (Part One). Evolutionary architecture means "the two-way-door structure is always in motion; the one-way-door structure moves only deliberately."

### Fitness functions — executable architecture tests that fail the build on drift

A fitness function is an automated check that some architectural characteristic still holds — and that **fails the build when it does not.** It is the machine enforcement that makes safe continuous evolution possible: it lets agents move fast through two-way doors precisely *because* a red build catches the moment a fast move violates a structural rule. A boundary that lives only in a diagram or a code-review habit erodes at agent speed, because an agent feels no friction crossing a layer and will wire a controller straight to the database for a green unit test. A boundary expressed as a fitness function *cannot* be crossed without turning the build red.

The categories, with the agent-era reason each is no longer optional:

| Fitness function | What it asserts | Why it matters more at agent speed |
|---|---|---|
| **Dependency / layering rule** | No module imports across a forbidden boundary (e.g. `domain` may not import `web`; service A may not import service B's internals) | An agent takes the shortest path to green; this is the guard that stops the distributed-monolith and the layer violation ([boundaries-and-contracts.md](boundaries-and-contracts.md)) |
| **Cyclic-dependency check** | The module graph stays acyclic | Cycles form silently as an agent adds one convenient import at a time |
| **Contract test** | The running service still honors its published contract (consumer-driven) | The contract is the agent's spec *and* its oracle; this guards the one-way-door public surface ([boundaries-and-contracts.md](boundaries-and-contracts.md)) |
| **Performance budget** | p99 latency / response size / query count stays under a stated threshold | An agent cannot feel a slow path; the budget makes the regression visible ([nfr-realization.md](nfr-realization.md)) |
| **Security invariant** | No secret in logs; authz check present on every protected route; no banned sink | Plausible-but-unsafe code passes a functional test; this fails it ([nfr-realization.md](nfr-realization.md)) |
| **Schema / migration guard** | Migrations are forward-only / reversible / reviewed; no destructive change without sign-off | The hardest-to-reverse layer gets an automated tripwire ([data-design.md](data-design.md)) |
| **"No new coupling" ratchet** | Coupling metrics do not worsen vs the baseline | Erosion is gradual; a ratchet stops the slow slide |

**PREDICATE for adding a fitness function:** *is there an architectural rule whose violation would not break a normal functional test?* If yes — a layering rule, a perf budget, a security invariant, a contract — it needs a fitness function, because nothing else will catch its violation. **DEFAULT:** every one-way-door decision's ADR names its enforcing fitness function in the `Enforcement` field (Part One); a one-way door with no guard is an unprotected invariant. **FALLBACK** when you cannot yet write the check: record the rule as a *pending* fitness function and a known gap, and escalate to the human — never leave a structural rule as prose in a doc and call it enforced, because at agent speed an unenforced rule is a rule that is already being violated.

> **The litmus test for "enforced":** could an agent, optimizing only for a green test, violate this rule and still ship? If yes, the rule is not enforced — it is a wish. Convert it to a fitness function or accept that it will erode. This is the same discipline STAGE 1 demands for boundaries and STAGE 4 demands for NFRs, applied to *every* durable architectural claim.

### The diagram–code drift problem — worse at agent speed

Architecture diagrams describe a system; code *is* the system; the two drift apart the moment someone changes one without the other. In the human era drift was a slow, embarrassing rot — a diagram that quietly stopped matching reality over months. At agent speed it is *fast* rot: an agent can restructure the code in a single session and will almost never update a hand-drawn diagram it was never told exists. Worse, the stale diagram then actively misleads the *next* agent, which reads it as ground truth and makes decisions against a system that no longer exists. A wrong diagram is more dangerous than no diagram, because it is trusted.

The remedy is to stop maintaining the diagram as a separate artifact and instead make it a *projection of the code:*

| Remedy | What it does | Why it beats a hand-drawn diagram at agent speed |
|---|---|---|
| **Generate diagrams from code** | Derive the component/dependency diagram from the actual import graph, service registry, or IaC — never hand-draw the structural view | A generated diagram cannot drift; if the code changes, so does the picture, automatically |
| **Diagrams-as-code** (text → rendered) | Keep the diagram source as text in the repo, reviewed in the same PR as the code | The change and its picture move together through one review; an agent edits both in one diff |
| **Architecture-as-code** (the structure *is* config/IaC) | The deploy topology, the module boundaries, the service graph are declared in versioned code that the system is built from | There is no separate "intended" architecture to drift from — the declaration *is* the architecture, and the fitness functions check the code against it |
| **Fitness function as the real spec** | The dependency rule, not the diagram, is the authoritative statement of the boundary | The build enforces the rule; the diagram is just a human-readable render of what the build already guarantees |

**The principle:** the authoritative description of an architectural constraint must be **executable** (a fitness function) or **generated** (a diagram derived from code), never a hand-maintained artifact that an agent can silently outrun. A diagram's job is to *communicate* to a human; it must never be the *source of truth* for a machine, because the machine will leave it behind. Where you cannot generate it, treat any hand-drawn diagram as documentation with a short shelf life, date it, and tie its accuracy to a review step.

### How ADRs and fitness functions work together

The two halves of STAGE 5 are one loop, and each covers the other's blind spot:

- An **ADR** records *why* a one-way-door decision was made — durable, human-readable, the memory a fresh agent reads before changing the design.
- A **fitness function** enforces *that the decision still holds* — executable, fast, the guard a fresh agent cannot cross without a red build.

An ADR without a fitness function is a memory with no enforcement: the next agent might read it, or might not, and nothing stops a violation. A fitness function without an ADR is enforcement with no memory: the build goes red, the agent sees a rule it does not understand, and — lacking the reasoning — it may "fix" the test by deleting the rule rather than respecting it. Together: the ADR explains the rule to the agent that hits the red build, and the fitness function makes sure the agent hits it. That is why the template's `Enforcement` field is mandatory for one-way doors — it is the wire connecting the memory to the guard.

### Escalation ladder — when evolution should stop and ask the human

Continuous evolution is the default, but not every change is the agent's to make alone. Climb only as far as the change's reversibility demands:

```
two-way-door refactor (internal layout, naming, library swap)
   → agent proceeds freely; fitness functions are the only gate. No ADR, no ask.
      → fitness function goes red on a change you believe is correct
         → do NOT delete or weaken the check to go green. The red build is the
            system telling you a structural rule is in play. Read the rule's ADR;
            if the rule is genuinely obsolete, SUPERSEDE its ADR (human reviews),
            then update the check. Never silently relax a guard to ship.
         → change touches a one-way door (schema, public/inter-service contract,
            auth/trust model, distribution split)
            → STOP. Read the existing ADR(s). Write a new/superseding ADR. Put the
               REASONING in front of the human, who approves before the change lands.
               The agent proposes; the human holds authority on irreversible moves.
            → no ADR exists for a one-way door you are about to change
               → STOP harder. You are about to alter an irreversible decision whose
                  rationale was never recorded. Surface this gap to the human, write
                  the ADR that should have existed, and get explicit sign-off before
                  touching it.
```

**The one move that breaks the system:** making a green build by weakening the guard that was protecting a one-way door. A red fitness function on a durable decision is not an obstacle to route around — it is the architecture defending itself at agent speed. Respect it, trace it to its ADR, and escalate; never delete it to ship.

---

## STAGE 5 exit — what "recorded & evolving" means

You are done with STAGE 5, and with the flight, when all three hold:

- **Every one-way-door decision from the STAGE 0 triage has an ADR** — context, options, *why the others were rejected*, consequences, and a named enforcing guard. The irreversible layer's reasoning is now durable memory a fresh agent will read before it changes anything.
- **Every durable architectural claim has a fitness function** — a layering rule, a contract test, a perf budget, a security invariant, a schema guard — that fails the build on drift. The rules an agent could otherwise cross for a green test cannot be crossed silently.
- **The architecture's authoritative description is executable or generated, not hand-drawn** — diagrams are projections of the code or diagrams-as-code reviewed alongside it, so the picture cannot lie to the next session.

Carry these forward: the ADRs become the memory that protects the design through every future agent session; the fitness functions become guards that the `assay` skill runs alongside the behavioral tests; and the continuously-evolving structure stays safe because every two-way-door move is gated by a guard and every one-way-door move is gated by the human. Groundwork said *what*; the earlier stages said *how it is structured*; STAGE 5 makes the structure *remember itself and defend itself* — which, against an actor that forgets between sessions and respects no boundary by instinct, is the difference between architecture that holds and architecture that quietly dissolves. Loop back to [decision-tree.md](decision-tree.md) if the triage itself needs revisiting, and re-read [agent-era-shifts.md](agent-era-shifts.md) for why every guard here exists.

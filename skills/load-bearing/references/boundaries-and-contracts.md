# Module Boundaries & Interface Contracts

This reference is the depth behind two stages of [the load-bearing skill](../SKILL.md). **STAGE 1 (Structure)** opens its first half — how to cut a system into modules that cohere, stay decoupled, fit one agent's working context, and refuse to erode at agent speed. **STAGE 3 (Contracts & data)** opens its second half — how to design the interfaces between those modules so a fixed contract becomes the spec an agent codes against, the oracle that verifies it, and the seam that lets a fleet of agents build both sides in parallel. The two halves are one idea seen twice: a **boundary** is where you draw the line; a **contract** is the promise that holds across it. Get the line and the promise right and an agent can rewrite everything inside freely. Get them wrong and every change ripples, every agent collides, and the cheap part of the system (the code) is held hostage by the expensive part (the seams).

The governing distinction from [decision-tree.md](decision-tree.md): the *placement* of a boundary and the *shape* of a depended-on contract are **one-way doors** — expensive to move once others rely on them — while the code on either side is a **two-way door**. Agents collapse the cost of the two-way doors toward zero; they do nothing for the one-way doors. So this is where scarce human judgment is spent. See [agent-era-shifts.md](agent-era-shifts.md) for why that asymmetry is the master axis, and [data-design.md](data-design.md) for the one boundary even harder to reverse than a contract: the data model.

---

## The two gates this file clears

From the checklist, with the agent-era weight made explicit:

- **`structure boundaries-by-capability`** — modules split by **business capability / bounded context** (not technical layer), high-cohesion / low-coupling, the distributed-monolith avoided, and a **machine-enforced** boundary mechanism named (dependency rule / module lint / architecture fitness test). The last clause is non-negotiable now: an agent has no instinct to respect a line drawn only in prose.
- **`contracts-data contracts-defined`** — public and inter-module interfaces designed **contract-first** with room to evolve (versioning, backward compatibility); the contract treated as both the spec agents code against and the verification oracle, and as the seam that lets agents work both sides in parallel against stubs.

If a boundary has no executable rule guarding it, it has not cleared the first gate. If a contract is not written down somewhere a stub and a test can both read, it has not cleared the second.

---

# PART ONE — BOUNDARIES (STAGE 1)

## The two forces, made measurable

Every decomposition is a search for **high cohesion** (things that change together live together) and **low coupling** (a module knows as little as possible about the insides of another). Both are vague until you make them measurable, and an agent needs the measurable form because it cannot *feel* a leaky abstraction the way a human reviewer does.

**Cohesion — the test:** when a single business reason to change arrives, how many modules must you touch? One is ideal. If "we changed how tax is calculated" forces edits in `OrderController`, `OrderService`, `TaxHelper`, and `InvoiceDao` scattered across the codebase, you have **low cohesion** — the capability is smeared across layers. This is the **Single Responsibility Principle** read at module scale: a module should have one reason to change, expressed in the language of the business, not the framework.

**Coupling — the test:** count what crosses the boundary, and how deeply. A module that calls another through a narrow, named interface and passes plain data is loosely coupled. One that reaches into another's database tables, shares its mutable objects, depends on its internal class layout, or breaks when the other's *private* code is refactored is tightly coupled. The sharpest single heuristic: **could an agent rewrite the entire inside of module B without module A's tests going red?** If yes, the coupling is at the interface (good). If A's tests break because B renamed a private helper, the coupling has leaked through the boundary (bad).

| Coupling channel | Smell it leaves | The fix |
|---|---|---|
| Shared mutable object passed across | B mutates A's state at a distance | pass an immutable value / DTO; copy at the seam |
| Shared database table | "just join their table" | each module owns its data; cross via the interface — see [data-design.md](data-design.md) |
| Reaching into internal classes/fields | A imports B's `internal`/`impl` package | export a façade; make internals package-private and **lint the import** |
| Temporal coupling | "you must call init() before use()" | encode order in types (builder, typestate) so it can't be skipped |
| Chatty fine-grained calls | N calls to do one logical thing | coarsen the interface to one capability-level call |

---

## Split by business capability, not by technical layer

The most common bad cut — and the one an agent will reproduce by default because tutorials are full of it — is the **horizontal technical slice**: all controllers together, all services together, all DAOs together. It looks orderly. It is the wrong axis.

**Why it fails:** business changes are *vertical*. "Add a discount code at checkout" cuts down through controller, service, and DAO — but those live in three different packages owned by three different conceptual modules, so one feature touches all of them and no module owns the capability. Worse, nothing stops the `Shipping` service from calling the `Billing` DAO, because they all sit in the same undifferentiated "service layer." The technical layering is real but it is an *implementation detail inside a module*, not the top-level decomposition.

**The right axis — Domain-Driven Design's bounded context.** Cut vertically by **business capability**: `Catalog`, `Cart`, `Checkout`, `Payment`, `Shipping`, `Notification`. Each owns its own slice of every technical layer — its own controllers, its own logic, its own data, its own contract to the outside. A **bounded context** is the scope within which a single model and a single ubiquitous language are consistent: inside `Billing`, an "Order" means an invoice line; inside `Shipping`, an "Order" means a parcel to dispatch. The boundary is exactly where that meaning shifts. Drawing the line there means the model stays coherent on each side and the translation is explicit at the seam.

### Worked before / after

**BEFORE — sliced by layer (the anti-pattern):**

```
src/
  controllers/   OrderController, PaymentController, ShipmentController, UserController
  services/      OrderService, PaymentService, ShipmentService, UserService, EmailService
  repositories/  OrderRepo, PaymentRepo, ShipmentRepo, UserRepo
  models/        Order, Payment, Shipment, User           # one shared anemic model
```
"Apply a refund" touches `OrderService`, `PaymentService`, `OrderRepo`, `PaymentRepo`, and the shared `Order` model — five files in four packages, and any service may freely call any repo. There is no module that *is* "refunds." An agent asked to add refunds will wire `OrderController` straight to `PaymentRepo` because the import is right there and the test goes green. No line was crossed because no line existed.

**AFTER — sliced by capability (bounded contexts):**

```
src/
  ordering/
    api/          OrderController          # the context's inbound contract
    domain/       Order, RefundPolicy      # model + logic, package-private
    data/         OrderStore               # owns ONLY ordering's tables
    PaymentPort   (interface)              # what ordering needs FROM payment
  payment/
    api/          PaymentService           # the published contract others call
    domain/       Charge, Refund
    data/         PaymentStore
  shipping/
    api/          ShipmentService
    domain/       Shipment
    data/         ShipmentStore
  shared-kernel/  Money, CustomerId        # the deliberately shared vocabulary, tiny
```
Now "apply a refund" lives in `ordering`, which calls `payment` *through* `PaymentPort` and never touches `PaymentStore`. The cohesion test passes (refund logic is in one place); the coupling test passes (ordering depends on an interface, not payment's internals). And critically, the boundary is now something a machine can patrol: *no class in `ordering.*` may import `payment.data.*`.* That rule is the subject of the next section.

> **Heuristic for the cut:** name the capability as a verb phrase the business would recognize ("place an order", "settle a payment", "dispatch a parcel"). If you can only name it as a layer ("the service layer", "the data layer"), you are cutting on the wrong axis.

---

## Agent-sized modules — Conway's Law generalized to a fleet

Conway's Law: *a system's structure ends up mirroring the communication structure of the org that built it.* The corollary architects have always used is the **Inverse Conway Maneuver** — choose the team boundaries you want the software boundaries to be, because they will converge. In the agent era the "org" includes the agents, and a new constraint appears.

**The agent-sized module.** A module is the right size when **its public contract, its core logic, and its tests all fit comfortably in one agent's working context at once.** That is the unit an agent can own end-to-end: read it whole, reason about it whole, change it whole, and verify it whole without losing the thread. A module too big to fit forces the agent to work blind on the parts it cannot see — exactly where confident-but-wrong edits come from. A module too small fragments one capability across many context loads and re-introduces the coupling you split to avoid.

**Why this is also a parallelism constraint.** Just as Conway's Law lets human teams work in parallel only where the architecture gives them clean seams, an agent **fleet** can work in parallel only where modules have sharp, contract-mediated boundaries. Two agents editing two well-separated bounded contexts behind a fixed contract do not collide. Two agents editing two "modules" that secretly share a database table or a mutable object will produce a merge conflict at best and a silent inconsistency at worst. **The boundary is what makes parallel agent work safe.** This is the same logic as the contract-first dividend in Part Two: a stable seam lets independent work proceed against it.

**Sizing heuristics:**

| Signal the module is too big | Signal it is too small |
|---|---|
| Agent must summarize/forget parts to fit it in context | One capability spans 4+ "modules" that always change together |
| One module has 3+ unrelated reasons to change | The interface between two of them changes on every feature |
| Its test file is too large to load alongside the code | A "module" has no test of its own — it is a fragment |
| Two sub-areas never call each other | — |

When a module outgrows the context window, that is itself the signal to split it along its internal cohesion seam — and because the split is a two-way door, an agent can perform the mechanical extraction cheaply. Spend the human judgment on *where* the new seam goes; let the agent do the move.

---

## The distributed monolith — the worst of both worlds

The **distributed monolith** is a system physically split into separate deployables that are logically still one tangled unit: change one service and you must change three others in lockstep and deploy them together. You have paid the full price of distribution — network latency, partial failure, distributed transactions, deployment choreography, tracing — and bought none of the benefit (independent deployability, fault isolation, autonomous evolution). It is strictly worse than the monolith you started with.

**Detection checklist** — if two or more are true, you have one (or are building one):

- A single user-facing change routinely requires a coordinated, same-release deploy of multiple services.
- Two services read or write the **same database** or the same tables (the canonical tell — see [data-design.md](data-design.md)).
- Services share a mutable domain library, so a model change forces a synchronized upgrade everywhere.
- Synchronous call chains run deep (A→B→C→D) and any link's downtime takes the whole flow down.
- You cannot deploy service B without first redeploying service A.
- A schema or contract change in one service breaks others *at runtime*, undetected until production.

**Why agents make this trap more likely, and the antidote.** Splitting into services *feels* like progress and an agent will happily generate the scaffolding for ten microservices on request. But correct service boundaries are bounded-context boundaries — the hard, irreversible judgment call this whole file is about — and an agent given a vague prompt will cut on the wrong axis. **Antidote: do the boundary work in a modular monolith first.** A modular monolith is a single deployable with the *same* internal bounded-context boundaries, enforced by the same dependency rules below. It gives you everything the boundary discipline buys (cohesion, low coupling, agent-sized ownership, parallel work) at none of the distribution cost, and the in-process boundary is *machine-checkable in a way cross-service boundaries are not*. Because extracting a clean in-process module into a service later is a two-way door agents can mechanize, **Monolith First is stronger in the agent era, not weaker** — see [architecture-styles.md](architecture-styles.md). Split out a service only when an *irreversible* driver demands it (independent scaling, separate failure domain, separate compliance boundary, separate release cadence), and record that driver in an ADR.

---

## The boundary is a fitness function, not a doc — HARD RULE

This is the load-bearing rule of Part One. **A boundary that exists only as a diagram or a paragraph in a wiki does not exist.** A human developer feels friction reaching across a layer — the wrong import, the awkward dependency — and that friction is a (weak) enforcement mechanism. **An agent feels no friction.** Given a choice between the architecturally correct path and a shorter path to a green test, an agent will take the shorter one, cross your boundary, wire the controller straight to the foreign DAO, and report success. At agent speed, an unenforced boundary erodes in days.

So every boundary you draw must be backed by an **executable constraint** — a test that fails the build when the boundary is violated. This is an **architecture fitness function**: an automated check that the system still has the structural property you designed in. Treat it as part of the architecture artifact, not an afterthought.

### What to enforce, and with what

| Stack | Tool | What the rule looks like |
|---|---|---|
| JVM (Java/Kotlin) | **ArchUnit** | `noClasses().that().resideInAPackage("..ordering..").should().dependOnClassesThat().resideInAPackage("..payment.data..")` |
| TypeScript/JS | **dependency-cruiser**, **eslint-plugin-boundaries**, Nx module boundaries | a forbidden rule: `from ordering → to payment/data` is an error |
| .NET | **NetArchTest**, **ArchUnitNET** | fluent rule asserting no `Ordering.*` type depends on `Payment.Data.*` |
| Python | **import-linter** (contracts), **tach** | a `forbidden` contract between layers/packages |
| Go | **go-arch-lint**, `internal/` packages, **depguard** | put a context's guts under `internal/`; the compiler forbids outside imports |
| Rust | crate/module visibility, **cargo-deny**, workspace crates | **cross-crate:** one crate per context; `pub(crate)` keeps guts private; the compiler enforces it. **Intra-crate** (submodule A must not import submodule B — e.g. a pure verifier that must not import the DB layer): Rust has no built-in import-linter, so *either* split the verifier into its own crate (strongest, compiler-enforced) *or* add a CI grep / `cargo-modules` dep-graph check asserting the banned `use` edge is absent. Do **not** claim a single-crate submodule boundary is compiler-enforced when it is only convention |
| Polyglot / general | **OPA/Conftest** on a generated dep graph, custom CI script | assert the dependency graph matches the declared one |

**The four classes of rule worth encoding:**

1. **Allowed dependencies** — `ordering` may depend on `payment`'s *api* package only; never its *data* or *domain* package. A module may not depend on a module it has no business knowing.
2. **No cycles** — modules must form a directed acyclic graph. A cycle is two modules that are secretly one; most tools detect cycles for free, so turn it on.
3. **Layer direction within a module** — domain logic must not depend on the web/controller layer or the persistence framework (the Dependency Rule / hexagonal "depend inward"). Enforce the arrows point inward.
4. **Public-surface gate** — only the `api`/`port` package of a context is importable from outside; everything else is package-private/`internal`/`pub(crate)`. Prefer the **compiler** as the enforcer where the language offers visibility (Go `internal/`, Rust crate privacy, Java modules) — a rule the compiler enforces cannot be bypassed by a green test.

**Make the rule discoverable to the next agent.** Put the fitness functions in the same test suite the agent runs to check its work, name them so the failure message *teaches* ("ordering must not import payment.data; call PaymentPort instead"), and reference the rule in the ADR that established the boundary (see [adr-and-evolution.md](adr-and-evolution.md)). A boundary rule whose violation produces a clear, actionable failure is one an agent can self-correct against; a silent or cryptic one just gets worked around.

> **PREDICATE — is this boundary enforced?** Run: *could an agent cross it and still get a green build?* **DEFAULT** when unsure: assume it can, and add the rule. **FALLBACK** when the stack has no off-the-shelf tool: write a tiny CI script that diffs the actual import/dependency graph against a declared allow-list and fails on any extra edge. The crudest graph-diff beats a prose boundary every time.

---

# PART TWO — CONTRACTS (STAGE 3)

## Contract-first, and its agent-era triple dividend

A **contract** is the agreed shape of an interaction across a boundary: the operations, their inputs and outputs, the errors, the invariants, the wire/serialization format. Once anything depends on it, it is a **one-way door** — changing it breaks every consumer — so it earns deliberate design and an ADR, exactly like the data model.

**Contract-first / interface-first** means: *write the contract before either side's implementation, agree it, freeze it, then build against it.* In the human era this bought parallel team development and clean mocking. In the agent era the same move pays a **triple dividend**, and naming all three is the point:

1. **The contract is the spec the agent codes against.** A precise schema (OpenAPI, Protobuf/gRPC, JSON Schema, GraphQL SDL, a typed interface) is an unambiguous instruction set. An agent handed `POST /refunds {orderId: UUID, amount: Money} → 201 {refundId: UUID} | 409 {code: "ALREADY_REFUNDED"}` has nothing to guess. A vague prose spec is where the agent improvises — and improvises differently each session.
2. **The contract is the oracle that verifies the agent's output.** The bottleneck moved from writing code to *verifying* it (see [agent-era-shifts.md](agent-era-shifts.md)). A machine-readable contract auto-generates the test that checks conformance: schema validation, generated client/server stubs that must typecheck, contract tests that fail when the implementation drifts from the promise. The human-in-the-loop verifies *the contract* (a small, durable artifact) once, and the contract verifies the agent's code (large, churning) continuously.
3. **The contract is the seam that lets agents build both sides in parallel.** Freeze the contract and one agent builds the producer while another builds the consumer, each against a stub/mock generated from the contract — no collision, no waiting. This is the boundary-as-parallelism point from Part One, applied to the seam between producer and consumer. Without a frozen contract the two agents drift and integrate into a mess.

**The practical sequence for an agent:**

1. Draft the contract as a machine-readable artifact (schema/IDL/typed interface) — *this* is the deliverable the user reviews and approves.
2. Generate stubs/mocks from it for both sides.
3. Let implementation proceed on both sides against the stubs, in parallel, possibly by different agents.
4. Generate conformance/contract tests from the same artifact and run them in CI as a fitness function.
5. Any change to the contract goes through versioning (below), never a silent edit.

---

## A well-typed contract is the leash on hallucination

The single most effective guardrail against a confident-but-wrong agent is a contract a machine can check. Order the options by how much they constrain the agent — prefer the strongest the situation allows:

| Strength | Mechanism | What it makes impossible for the agent |
|---|---|---|
| Strongest | **Generated code from IDL** (gRPC/Protobuf, OpenAPI-generated client/server, GraphQL codegen) | Calling a field/method that doesn't exist — it won't compile |
| Strong | **Static types + exhaustive checks** (sum types, discriminated unions, `never`-exhaustiveness) | Forgetting an error case; passing the wrong shape |
| Medium | **Runtime schema validation** at the boundary (JSON Schema, Zod/Pydantic, Avro) | Accepting malformed input; emitting an off-spec response — caught at runtime, in tests |
| Weak | **Prose + examples** | Almost nothing — this is where hallucination lives |

The rule: **push every contract as far up this table as the stack allows.** A nullable `string` field with a comment "should be an ISO date" invites the agent to invent a format; a `Date` type or a schema with `format: date-time` and a validator does not. A `status: string` invites any string; a `status: "pending" | "settled" | "refunded"` enum makes the illegal state unrepresentable and forces the agent to handle every case. **Make illegal states unrepresentable** is not just clean design now — it is the mechanism that converts an agent's guess into a compile error instead of a production incident. Anchor the contract's types in the shared kernel (`Money`, `CustomerId`) so the same concept has the same type everywhere and the agent cannot quietly pass a raw `int` where a `Money` belongs.

---

## Internal interfaces matter as much as the public API

A reflex worth correcting: teams lavish care on the *public* API (it faces customers) and let *internal* module-to-module interfaces grow by accident. In the agent era this is backwards-weighted. The internal seams are exactly the boundaries an agent will cross for a shorter path (Part One), and the internal contract is exactly what lets a fleet of agents work in parallel. **Design the `PaymentPort` between `ordering` and `payment` with the same rigor as the public REST API:** name the operations at capability level, type the inputs and outputs, enumerate the errors, version it if it has more than one consumer. The difference between a clean modular monolith and a big ball of mud is entirely in the quality of these internal contracts. A public API is enforced by the pain of an external consumer complaining; an internal contract has no such external pressure — so it needs the *machine* enforcement of Part One even more.

---

## Versioning & backward compatibility — designing for evolution

A contract that others depend on must be able to change without a flag day, because you rarely control all consumers and you never want a synchronized deploy (that path leads to the distributed monolith). The discipline:

**Distinguish breaking from non-breaking changes.**

| Non-breaking (additive — safe to ship) | Breaking (needs a version / migration) |
|---|---|
| Add a new *optional* field | Remove or rename a field |
| Add a new endpoint / method | Add a new *required* field |
| Add a new enum value *consumers ignore safely* | Change a field's type or units |
| Loosen an input constraint | Tighten an input constraint; change error semantics |
| | Add an enum value consumers must handle |

**The robustness principle, applied:** be conservative in what you send (emit exactly the contract), liberal in what you accept (tolerate unknown fields rather than rejecting them) — so an old consumer survives a producer that added a field. Encode this: deserializers should **ignore unknown fields**, not throw. Protobuf and Avro give you forward/backward compatibility almost for free if you follow their field-numbering rules; JSON contracts need the tolerant-reader discipline written into the parsing.

**When a breaking change is unavoidable:**

1. **Version explicitly** — URL (`/v2/`), media type, or a version field. Prefer additive evolution; reserve a new version for genuine breaks.
2. **Run versions side by side** through an expand/contract (parallel-change) migration: *expand* — add the new shape alongside the old; *migrate* — move consumers over one at a time; *contract* — remove the old shape only after telemetry shows no one uses it.
3. **Deprecate with a clock** — mark the old contract deprecated, emit a deprecation signal, and track usage so you know when it is safe to remove.
4. **Record the break in an ADR** — including which consumers were affected and the migration window — so a future agent does not "simplify" by deleting the old version while a consumer still depends on it. The ADR is the persistent memory the stateless next session lacks ([adr-and-evolution.md](adr-and-evolution.md)).

**Agent-era note:** when the consumers are *your own* services and an agent owns both sides, an agent can perform the mechanical parallel-change migration cheaply — generate the new shape, migrate callers, delete the old. But the *decision* of when the old shape is safe to remove depends on production telemetry the agent cannot perceive. So: let the agent do the migration mechanics; keep the "is it safe to remove yet?" judgment with the human-in-the-loop, gated on real usage data.

---

## Consumer-driven contract tests — the seam's fitness function

A schema says what the producer *promises*; a **consumer-driven contract (CDC) test** verifies the producer still keeps the promises its consumers actually *rely on* — no more, no less. Each consumer declares the slice of the contract it depends on (the fields it reads, the calls it makes); those expectations are collected into a contract; the producer's CI runs them and goes red if a change would break a real consumer.

**Why this is the right tool in the agent era:**

- It lets the producer be refactored freely (a two-way door) while guaranteeing the consumer-facing promise (a one-way door) is intact — exactly the asymmetry this skill is built on. An agent can rewrite the producer's guts; the CDC suite is the wall that stops the rewrite from breaking a consumer.
- It catches the specific failure of a distributed/modular system at *test time* instead of production: the silent contract drift in the distributed-monolith detection list above.
- It is generated from the same artifact the agent codes against, so the spec, the oracle, and the regression net are one source of truth.

**Where it fits the test taxonomy:** this is the **contract test** rung of the `assay` sibling skill's decision tree — use it precisely when a published API or inter-service interface has external (or other-team / other-agent) consumers. Tools: **Pact** (cross-language CDC), **Spring Cloud Contract** (JVM), schema-compatibility checks in the CI of **gRPC/Protobuf** and **Avro/Schema Registry** pipelines. Run them as a fitness function in CI, beside the boundary rules from Part One.

> **PREDICATE — does this contract need CDC tests?** *Does it have a consumer you do not deploy in lockstep with the producer?* **YES → CDC test, run in the producer's CI.** **NO** (single deployable, in-process port, both sides always shipped together) → a generated-stub typecheck plus integration test at the seam is enough; CDC adds ceremony without payoff. **DEFAULT** when unsure: if more than one module imports the interface, add the contract test; the cost is low and the drift it catches is exactly the silent failure agents introduce. **FALLBACK** when you cannot tell who the consumers are: that uncertainty is itself the answer — treat the interface as public and version it conservatively until the consumer set is known.

---

## Escalation ladder — when a boundary or contract decision is genuinely hard

Spend effort in proportion to reversibility. Climb only as far as the decision's permanence demands; stop as soon as the doubt is resolved.

```
internal module seam, single deployable, you own both sides
   → draw the line by capability, enforce with a dependency rule, move on (two-way door — cheap to redraw)
      → the seam now has 2+ independent consumers
         → promote it to an explicit typed contract + stub + contract test
            → a consumer you do NOT deploy in lockstep appears
               → version it, add consumer-driven contract tests, write an ADR
                  → you are considering splitting it into a separate service
                     → STOP. This is a one-way door. Confirm an irreversible driver
                       (scale / failure-domain / compliance / cadence) with the user,
                       record the driver and the rejected alternatives in an ADR,
                       and only then split.
```

Each rung up costs more and binds harder. The judgment is knowing which rung a decision is actually on — over-climbing gold-plates a two-way door (the over-engineering the agent will cheerfully build for you), under-climbing rushes a one-way door. When you cannot place the decision on the ladder after a genuine attempt, that is the moment to **stop and ask the user one sharp question** rather than guess — because the boundaries and contracts are precisely the decisions the human-in-the-loop is here to own.

---

## Cross-references

- [decision-tree.md](decision-tree.md) — the reversibility triage and weight-class selector that decide how much of this rigor a given boundary earns.
- [agent-era-shifts.md](agent-era-shifts.md) — why machine-enforcement, the verification bottleneck, and agent-sized modules are the through-lines of this file.
- [architecture-styles.md](architecture-styles.md) — Monolith First / modular monolith / microservices, and Conway's Law generalized to agent fleets; the styles that these boundaries live inside.
- [data-design.md](data-design.md) — the service-owns-its-data rule that makes the boundary real, and the data schema, the one contract even harder to reverse than an API.
- [tech-selection.md](tech-selection.md) — choosing a stack whose type system and tooling can *enforce* the contracts above rather than leaving them to prose.
- [adr-and-evolution.md](adr-and-evolution.md) — recording each boundary and contract decision as the persistent memory that stops the next agent from undoing it, and evolving them behind fitness functions.

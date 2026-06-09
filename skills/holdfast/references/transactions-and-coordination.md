# Distributed transactions & coordination — the tax, paid only where you must

This reference is the depth behind **STAGE 7 — Distributed transactions & coordination** of the [../SKILL.md](../SKILL.md) flight plan, and it is the **last stage of the complete eight-stage map.** It closes the loop the others opened, so it ends not with one more mechanism but with the synthesis of the whole journey. The problem it answers traces straight back to the pain of the sharding stage:

> **Sometimes an action must complete ATOMICALLY across multiple nodes — all of them commit, or none of them do — or several nodes must AGREE on "who is in charge."** That is **coordination**, and underneath coordination almost always sits the [consensus of STAGE 4](consistency-and-consensus.md#consensus--the-algorithmic-core). The [cross-shard transaction](sharding.md#cross-partition-operations--the-most-painful-part) STAGE 5 told you to avoid is the canonical instance: the moment one logical operation spans two shards, you have left the world of ordinary local transactions and entered the world this stage is about — and everything below is the bill for that crossing.

The single judgment the whole stage installs, stated up front because every section earns the right to repeat it: **coordination is expensive — in latency, in availability, in throughput, and in the hardest-to-find bugs — so the design works to use the least of it that is still correct.** Not "how do I coordinate well," but "how little coordination can I get away with, and where it is unavoidable, how do I do it without strangling the system."

## Contents

- [Distributed transactions — when atomicity spans nodes](#distributed-transactions--when-atomicity-spans-nodes)
- [Two-phase commit — atomic, and why it blocks](#two-phase-commit--atomic-and-why-it-blocks)
- [The repair — make the coordinator fault-tolerant via consensus](#the-repair--make-the-coordinator-fault-tolerant-via-consensus)
- [Saga — the microservices turn](#saga--the-microservices-turn)
- [Coordination primitives — leader election and the dangerous lock](#coordination-primitives--leader-election-and-the-dangerous-lock)
- [Coordination services — outsource the hardest part](#coordination-services--outsource-the-hardest-part)
- [The through-line — coordination is a tax](#the-through-line--coordination-is-a-tax)
- [The engineering posture — and the close of the whole map](#the-engineering-posture--and-the-close-of-the-whole-map)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## Distributed transactions — when atomicity spans nodes

On a single machine a transaction gives you **ACID** and the database does all the work — you `BEGIN`, you write, you `COMMIT`, and atomicity, isolation, and durability are simply handed to you. The hard case, the one this stage exists for, is a transaction that **spans multiple nodes or services** and must still be all-or-nothing: either every participant commits, or every participant rolls back, with no surviving state where one committed and another did not.

That "no surviving half-state" requirement is what makes it hard. With each participant on its own machine, failing independently, talking over the [unreliable async network](the-three-enemies.md#the-third-state--the-spine-of-everything), you cannot just commit them one after another and hope — a crash between the first commit and the second leaves exactly the inconsistent half-state the transaction was supposed to forbid. You need a protocol that makes the commit decision *itself* atomic across the participants. There are two families of answer, and choosing between them soberly — rather than reaching for the first by reflex — is the substance of `distributed-transaction-chosen-soberly`: the classic **two-phase commit** (strong atomicity, bought with availability), and the microservices default, the **saga** (loose coupling and availability, bought by giving up atomicity and isolation).

---

## Two-phase commit — atomic, and why it blocks

The classic protocol is **two-phase commit (2PC)**. It has one **coordinator** and several **participants**, and it runs in the two phases its name promises.

> **Phase 1 — prepare / vote.** The coordinator asks every participant: *can you commit?* Each participant does the work, **locks the resources**, writes a **durable log record**, and then votes **yes** or **no**. The load-bearing fact is what a *yes* means: **once a participant votes yes, it has irrevocably PROMISED it can commit, and it cannot take that back.** It enters an uncertain **"prepared" state** — it has given up the right to abort on its own, and now waits, holding its locks, for the coordinator to tell it the outcome.

> **Phase 2 — commit / abort.** If *every* participant voted yes, the coordinator broadcasts **commit**; if *any* voted no (or failed to answer), it broadcasts **abort**. Every participant obeys.

Why it is atomic is exactly the structure of those two phases:

> **The prepare phase guarantees that EVERYONE *can* commit before ANYONE *actually* commits.** No participant performs the irreversible commit until the coordinator knows the whole set has promised it will succeed. That ordering — universal promise first, universal action second — is what makes the outcome all-or-nothing.

And the same structure is precisely why 2PC is fragile. The core criticism, the one that has earned 2PC its reputation:

> **A coordinator crash BLOCKS everything.** Suppose the coordinator dies *after* every participant has voted yes but *before* it sends the commit/abort decision. The participants are now stranded: each has promised to commit, each is **holding its locks**, and none of them knows the outcome or is allowed to decide alone — a participant cannot commit (maybe someone else voted no) and cannot abort (it already promised yes). So it can only **BLOCK** — hold its locks and wait — until it can reach *someone who knows the outcome* (normally the recovered coordinator). This is the famous "2PC is a **blocking protocol**," and the coordinator is a textbook [single point of failure](fault-tolerance.md#redundancy--the-basic-move-with-one-big-precondition) of the fault-tolerance stage.

The deadly window, drawn — the participants stranded in the prepared state, holding locks, with the only authority that can release them gone:

```
   COORDINATOR                 PARTICIPANT A          PARTICIPANT B
        │  prepare?  ─────────────►│                     │
        │  prepare?  ─────────────────────────────────►  │
        │◄──────────── YES (locked, logged, promised) ───│
        │◄─ YES (locked, logged, promised) ──────────────│
        │                          │                     │
        ╳  COORDINATOR DIES here — before sending the decision
                                   │                     │
                          prepared, LOCKED        prepared, LOCKED
                          "commit or abort??"     "commit or abort??"
                          cannot decide alone     cannot decide alone
                                   │                     │
                          ════════ BLOCKED, holding locks, until the
                                   coordinator comes back ════════
```

The cost does not stop at the crash case; even in the happy path 2PC is heavy:

- **Locks are held for the WHOLE protocol.** From a participant's prepare to the final commit, every resource it touched stays locked. That drops throughput and raises contention — and **one slow or dead participant stalls everyone**, because the coordinator (and thus every other participant) waits on the slowest vote.
- **It is synchronous and multi-round.** Prepare-then-decide is at least two round-trips across the network to every participant before anything commits — latency stacked on top of the contention.

The honest one-line summary of what 2PC *is*:

> **2PC chooses ATOMICITY over LIVENESS — it would rather block than risk a non-atomic outcome.** On a coordinator crash it refuses to make progress (holds its locks, waits) instead of letting some participants commit while others don't. Be precise about the property: this is ACID **atomicity** (all-or-nothing across participants), *not* CAP's **C** (linearizability) — STAGE 4 was militant about keeping [the three meanings of "consistency"](consistency-and-consensus.md#the-three-consistencys-untangled) apart, so don't relabel an atomicity-vs-liveness trade as a "CP choice." The *instinct* is the same safety-over-liveness one a [consensus cluster shows when its minority stalls under partition](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) — when in doubt, wait rather than be wrong — but the thing being protected here is atomicity. Whether that trade is acceptable is a decision to make with eyes open, not a default to stumble into. Knowing *what* 2PC is and *why* it blocks is the first half of `distributed-transaction-chosen-soberly`.

---

## The repair — make the coordinator fault-tolerant via consensus

The fragility of 2PC is concentrated in one place — the coordinator as a single point of failure — and that points straight at the fix:

> **Make the coordinator's decision FAULT-TOLERANT with consensus.** The reason a coordinator crash strands everyone is that the commit/abort decision lived on one node that died. Replicate that decision through a [consensus group](consistency-and-consensus.md#consensus--the-algorithmic-core) (Paxos / Raft) and the single point of failure is gone: if the coordinator node dies, the consensus group still holds the durable decision, a new coordinator is elected, and the participants learn the outcome instead of blocking forever. **Google's Spanner runs 2PC on top of Paxos groups** for exactly this reason — the participants are themselves Paxos-replicated, so neither a participant nor the coordinator is a lone point whose death blocks the commit.

Note the shape of the repair, because it is the recurring shape of the whole stage:

> **Fixing 2PC's fragility sends you back to consensus.** You did not escape the hard problem; you relocated it. The atomic-commit problem [reduces to consensus](consistency-and-consensus.md#consensus--the-algorithmic-core) — and the moment you want it to survive failure, the consensus of STAGE 4 reappears underneath, exactly as it reappeared underneath [the sharding stage's routing map](sharding.md#request-routing--the-map-is-itself-a-consensus-problem). Coordination that must tolerate faults is consensus wearing a different hat.

This is also why hand-rolling a fault-tolerant 2PC is a trap for the same reason hand-rolling consensus is: the corner cases that bite — a coordinator that recovers and finds the decision already made, a participant that recovers mid-prepare — are exactly the [rare-interleaving bugs](the-three-enemies.md#the-third-state--the-spine-of-everything) you will not catch by re-running a test. If you genuinely need cross-node atomic commit that survives failure, build it on a consensus-backed store, do not write the recovery logic yourself.

---

## Saga — the microservices turn

In a microservices architecture you usually do not *want* a distributed transaction at all. The coupling, the held locks, the latency, and the availability hit of 2PC are unacceptable when the whole point of splitting into services was independence. So the field turned to a different model entirely:

> **A SAGA breaks one big transaction into a SEQUENCE of LOCAL transactions, each on a single service, and undoes failures with COMPENSATING actions that SEMANTICALLY reverse the earlier steps.** Book the flight → book the hotel → book the car. Each step is an ordinary, atomic, single-service local transaction that commits immediately. If a later step fails — the car booking is rejected — you run **compensations** for the steps that already committed: refund the hotel, refund the flight. There is no global lock, no blocking coordinator, no two-phase ceremony; there is a forward path and a compensating backward path.

That buys you availability and loose coupling, but the costs are real and you pay them at the application layer, on purpose:

> **A saga is NOT atomic and NOT isolated.** Intermediate states are **visible to the outside world**: while the saga is mid-flight, someone can observe that the flight is already booked even though the hotel and car are not. There is no isolation boundary hiding the partial progress — so you must handle those intermediate states yourself, in the application (show "booking in progress," prevent double-spends against a half-committed state, and so on). The ACID guarantees the single-machine database gave you for free are now *your* responsibility.

> **Compensations must be DESIGNED, and they must be IDEMPOTENT.** A compensation is application logic you write deliberately for each step — and because the [retry discipline of the communication stage](communication.md#timeout-retry-backoff) means a compensation may be delivered more than once (the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) applies to compensations exactly as to anything else), every compensation must be [idempotent](communication.md#idempotency--the-headline-weapon) — running "refund the hotel" twice must refund once. And some actions **cannot be cleanly undone**: you cannot un-send an email. So you compensate **semantically** — you cannot retract the confirmation email, but you can send a cancellation email. The world is not rolled back to as-if-nothing-happened; it is moved forward to a state that is *equivalent in meaning* to having not done it.

Two styles, with a clean trade between them:

| | **Choreography** | **Orchestration** |
|---|---|---|
| Who drives the steps | each service emits events and reacts to others' events — **decentralized** | one central **orchestrator** drives the sequence — centralized |
| Coupling | loose; no single controller, but the flow is implicit in who-reacts-to-what | the flow is explicit and in one place, but the orchestrator is a component to own |
| Best when | a few simple steps, where an explicit coordinator would be overkill | a longer or branching flow whose logic you want visible and testable in one spot |

A saga is almost always paired with one more pattern to make its steps reliable:

> **The OUTBOX pattern solves the dual-write problem.** A saga step usually has to do two things — update its own business data *and* publish an event (or send the next message) — and those are two separate systems (the database and the broker), so a crash between them leaves you having done one and not the other. The outbox fixes it by making the two writes **one local transaction**: atomically write the business row *and* a row into an "outbox" table in the **same database**, then a separate process reliably reads the outbox and forwards the event. The publish becomes a consequence of a committed local transaction instead of a second, un-coordinated write — the "[at-least-once](communication.md#delivery-semantics--the-direct-product-of-the-third-state) plus idempotent consumer" recipe applied to the saga's own event emission.

The one-line summary, mirroring the 2PC one:

> **A saga trades ACID's atomicity and isolation for availability and loose coupling — pushing "what if it only half-finished?" to the application layer on purpose.** This is the **microservices mainstream**: most cross-service business processes are sagas, not distributed transactions. Choosing a saga deliberately — with its compensations designed and idempotent, its intermediate states handled, its dual-write closed by an outbox — rather than reaching for 2PC by reflex, completes `distributed-transaction-chosen-soberly`.

The defining choice of the stage, side by side:

| | **2PC** | **Saga** |
|---|---|---|
| Atomicity | yes — true all-or-nothing | no — steps commit independently |
| Isolation | yes (locks held) | no — intermediate states are visible |
| Availability under failure | low — blocks on a coordinator crash | high — no global lock, no coordinator to strand |
| Coupling / latency | tight; synchronous, multi-round, lock contention | loose; asynchronous, no cross-service locks |
| "What if it half-finishes?" | the protocol prevents it (at the cost of blocking) | **your** problem — compensations + visible intermediate state |
| Typical home | a few trusted nodes inside one trust boundary (and, hardened, Spanner-style 2PC-over-Paxos) | microservices, long-running business processes |

---

## Coordination primitives — leader election and the dangerous lock

Beyond atomic transactions, distributed systems need a handful of recurring coordination services: electing one node to be in charge, holding a lock across nodes, agreeing on shared configuration, tracking membership. Two of these deserve special care.

> **LEADER ELECTION runs on consensus underneath.** Electing a single node to coordinate — so that you have one actor making decisions rather than several fighting each other — is exactly the [leader-election problem that reduces to consensus](consistency-and-consensus.md#consensus--the-algorithmic-core), and it is the same election the [replication stage's failover](fault-tolerance.md#failover-and-recovery--and-mttr-over-mtbf) needed to pick a new leader. You do not get a correct election from a clever heuristic; you get it from an agreement protocol. Which is the first reason this section ends by telling you to outsource it.

The distributed lock is the one to be most afraid of:

> **A DISTRIBUTED LOCK is notoriously dangerous.** A lock grants mutual exclusion across nodes — only one holder acts at a time — but the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) wrecks the naive version. The holder can **pause past its lease expiry** — a long GC stall, a slow disk, a hypervisor freeze — and while it is paused, oblivious, the lock manager (which cannot tell [slow from dead](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess)) decides the lease expired and **grants the lock to someone else.** Now the paused holder wakes up, *still believing it holds the lock*, and acts — and so does the new holder. **Two holders act at once: split-brain again,** the same two-writers-corrupting-data hazard the [replication](fault-tolerance.md#failover-and-recovery--and-mttr-over-mtbf) and fault-tolerance stages fought.

The fix is not a longer lease or a more careful timeout — the slow-vs-dead ambiguity means no timeout is safe. The fix moves the check to the resource:

> **The fix is a FENCING TOKEN.** Each time the lock is granted, the grant carries a **monotonically increasing number** — the token. Every operation the holder sends to the protected **resource** carries its token, and the **resource itself rejects any operation stamped with a token older than the highest it has already seen.** So when the paused holder finally wakes and tries to write with its now-stale token, the resource refuses it — the new holder's higher token has already passed through. The safety no longer depends on anyone correctly detecting the pause; it depends on the resource enforcing monotonicity, which it can always do locally. **This is the heart of Martin Kleppmann's critique of Redlock** — a distributed lock without a fence the resource enforces is not safe, no matter how the lock service is built. Knowing the lock hazard and requiring the fencing token is the first half of `coordination-primitives-used-safely`.

---

## Coordination services — outsource the hardest part

Leader election needs consensus; a safe lock needs careful fencing and a consistent store; shared config and membership need an agreed single source of truth. The repeated lesson of every one of these is: **do not build it yourself.**

> **Coordination services (ZooKeeper, etcd) package the hard consensus of STAGE 4 into REUSABLE building blocks.** Each is a small, consistent, highly-available store — backed by [consensus running underneath](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) — that exposes the coordination primitives you actually need: **distributed locks, leader election, configuration, membership, and watches** (notifications when a value changes). They are the same services [the sharding stage's routing map lived in](sharding.md#request-routing--the-map-is-itself-a-consensus-problem), used here for the system's own coordination rather than its data placement.

The wisdom is blunt and it is the same posture the consistency stage took toward [hand-rolling consensus](consistency-and-consensus.md#the-engineering-posture):

> **DON'T build your own coordination — OUTSOURCE the hardest part, consensus, to a battle-tested service.** Consensus is the single easiest thing in distributed systems to get subtly, catastrophically wrong, in exactly the partition and election corners that never show up in testing. The vast majority of real systems host their metadata and coordination on ZooKeeper or etcd rather than implementing Paxos or Raft themselves — and that is the correct default, not a shortcut. Hosting coordination on a proven service instead of re-implementing it completes `coordination-primitives-used-safely`.

---

## The through-line — coordination is a tax

Step back from the individual mechanisms and the unifying truth of the whole stage comes into view. Every form of **strong coordination** — distributed transactions, consensus, distributed locks — is expensive in the same currencies: **latency** (round-trips and waiting), **availability** (a coordinator or a majority must be reachable, and is sacrificed under partition), and **throughput** (held locks, serialized decisions). And it is where the [hardest, rarest, least-reproducible bugs](the-three-enemies.md#the-third-state--the-spine-of-everything) live. So:

> **COORDINATION IS A TAX. Pay it only where you truly must.** The mature move is not to coordinate *well* but to **reduce the NEED to coordinate** in the first place — to design so that fewer operations require agreement, locks, or atomic-across-nodes commits at all.

The concrete levers, each one a call-back to an earlier stage:

- **Co-locate related data so operations stay within a single shard** ([STAGE 5](sharding.md#cross-partition-operations--the-most-painful-part)). The cross-shard transaction that would need 2PC becomes an ordinary local transaction the instant the data it touches lives on one shard. The partition key chosen to fit the access pattern is, in retrospect, a coordination-avoidance decision.
- **Use the weakest consistency that is still correct** ([STAGE 4](consistency-and-consensus.md#the-engineering-posture)). Most data does not need linearizability; causal or eventual consistency removes the coordination that linearizability demands on every operation. Strong coordination you never asked for is the most common form of the tax overpaid.
- **Prefer idempotency + eventual reconciliation over locks and transactions.** A [saga](#saga--the-microservices-turn) with idempotent steps, or a **CRDT** (Conflict-free Replicated Data Type) that merges concurrent updates without agreement, gets you correctness without a blocking coordinator — the [idempotency](communication.md#idempotency--the-headline-weapon) of the communication stage standing in for a lock.
- **Push coordination to the edge / metadata layer.** Keep the hot data path coordination-free and confine agreement to the small, slow-changing control plane — the routing map, the config, the leader identity — exactly as [the consistency stage reserved consensus for the control plane](consistency-and-consensus.md#the-engineering-posture).

Naming coordination as a tax and actively minimizing the need for it — co-locate, weaken the consistency, prefer idempotency-plus-reconciliation, push to the edge — is the whole of `coordination-minimized`.

---

## The engineering posture — and the close of the whole map

Close on the stance — and because this is the **final stage**, the close is the close of the entire skill.

For this stage alone the posture is the through-line above: **coordination is a tax; pay it only where you truly must.** For an agent the lever is the suite's usual one — it will reach for a distributed transaction or a distributed lock by reflex, because each reads like the single-machine `BEGIN…COMMIT` or `lock()` it already knows, and it feels none of the [coordinator blocking under a crash](#two-phase-commit--atomic-and-why-it-blocks), the [held locks throttling throughput](#two-phase-commit--atomic-and-why-it-blocks), or the [split-brain a missing fence invites](#coordination-primitives--leader-election-and-the-dangerous-lock). So this judgment must be **gated**, not trusted to instinct: the distributed transaction chosen soberly (2PC's blocking faced, or a saga preferred), the primitives used safely (fencing tokens, consensus outsourced to ZooKeeper/etcd), and the coordination minimized. The architectural call of *whether* this system should pay for strong coordination at all belongs to `load-bearing`; running the coordination service in production — etcd/ZooKeeper operations, the on-call response when a lock service or a saga gets stuck — belongs to `stationkeeping`. holdfast's job is to make the coordination *sober, safe, and minimal* before any of it is operated.

And now the larger close, because the map is complete. Its **eight stages are eight facets of one thing** — every one a way of coping with the [three enemies of the foundation](the-three-enemies.md#the-third-state--the-spine-of-everything): **partial failure, an asynchronous unreliable network, and no global clock or global state.** **STAGE 0 (frame)** named those enemies themselves; the seven stages built on it are seven disciplined answers to them:

- **Communication (1)** taught you to talk when a request's outcome is inherently ambiguous — the third state, idempotency, retries with discipline.
- **Ordering (2)** taught you to define "before" with no global clock — causality over the wall clock.
- **Replication and consensus (3–4)** taught you to make many copies look like one with no global state — topologies, the consistency spectrum, CAP, consensus.
- **Sharding (5)** taught you to grow sideways when no one machine can hold it all.
- **Fault tolerance (6)** taught you to stay alive as parts keep breaking — it is, in the end, [Richard Cook's *How Complex Systems Fail*](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) turned into code.
- **Coordination (7)** — this stage — taught you that because coordination is so expensive, you use as little of it as you possibly can.

The most elegant part, and the note to end on: the central idea of this entire journey is the **same** idea as the software-engineering through-line that runs under the whole suite — **manage complexity; make the cost match the real need.** In software engineering it shows up as "[don't distribute until you must](the-three-enemies.md#the-first-law--dont-distribute-until-you-must); good enough beats gold-plated." In distributed systems it shows up as "choose the weakest correct consistency; coordination is a tax." **The scale changed; the wisdom did not.** A distributed system is just the same discipline of paying only for what you genuinely need, carried across the machine boundary where the prices are higher and the bugs are quieter.

For going deeper, two authoritative destinations. The book-length version of this whole map is **Martin Kleppmann's *Designing Data-Intensive Applications* (DDIA)** — the canonical treatment of every stage here. For hands-on implementation, **MIT 6.824 (Distributed Systems)**, with its **Raft** and **MapReduce** labs, is the classic course where you build the machinery yourself. Read DDIA to hold the map; do 6.824 to feel the third state in your own code.

---

## Anti-patterns and pre-flight checklist

Run this before calling a coordination design correct. Each line is a failure this stage exists to prevent.

- **Reaching for 2PC on every cross-service action** — it blocks on a coordinator that is a [single point of failure](fault-tolerance.md#redundancy--the-basic-move-with-one-big-precondition) and holds locks for the whole protocol; prefer a saga, or better, [co-locate](sharding.md#cross-partition-operations--the-most-painful-part) so the transaction stays single-shard and never crosses nodes at all. (`distributed-transaction-chosen-soberly`)
- **Forgetting that 2PC blocks** — a coordinator crash after the yes-votes but before the decision strands every participant in the prepared state, holding locks, unable to decide alone. It chooses *atomicity over liveness* — it blocks rather than risk a non-atomic outcome (atomicity is ACID's all-or-nothing, not CAP's C); if it must survive failure, make the coordinator's decision fault-tolerant via consensus (Spanner = 2PC over Paxos). (`distributed-transaction-chosen-soberly`)
- **Hand-rolling a fault-tolerant atomic commit** — the recovery corners (coordinator returns to find the decision made, participant recovers mid-prepare) are [rare-interleaving bugs](the-three-enemies.md#the-third-state--the-spine-of-everything) you won't catch by re-running a test; build on a consensus-backed store, don't write the recovery yourself. (`distributed-transaction-chosen-soberly`)
- **A saga with no compensations, or non-idempotent ones** — a half-finished saga that can't be unwound, or a compensation that double-refunds on a [retry](communication.md#timeout-retry-backoff). Design a compensation per step, make each [idempotent](communication.md#idempotency--the-headline-weapon), and compensate *semantically* where an effect can't be literally undone. (`distributed-transaction-chosen-soberly`)
- **Ignoring a saga's visible intermediate state** — a saga is not isolated, so the outside world *can* observe the half-done state; handle it in the application instead of pretending atomicity you don't have. (`distributed-transaction-chosen-soberly`)
- **The dual-write problem left open** — updating the database and publishing the event as two un-coordinated writes, so a crash between them loses one. Use the **outbox** pattern: both writes in one local transaction, forwarded reliably. (`distributed-transaction-chosen-soberly`)
- **A distributed lock without a fencing token** — a holder paused past its lease ([slow ≠ dead](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess)) plus a new holder = two writers corrupting data (split-brain). Require a **monotonic token the resource itself enforces** — Kleppmann's Redlock critique. (`coordination-primitives-used-safely`)
- **Hand-rolling leader election or a lock service** — leader election runs on [consensus](consistency-and-consensus.md#consensus--the-algorithmic-core), the hardest thing to get right; outsource it to **ZooKeeper / etcd**, which package consensus into proven primitives. (`coordination-primitives-used-safely`)
- **Coordinating everywhere** — distributed transactions, consensus, and locks are a tax in latency, availability, and throughput, and they hide the worst bugs. Minimize the *need*: [co-locate for single-shard ops](sharding.md#cross-partition-operations--the-most-painful-part), use the [weakest correct consistency](consistency-and-consensus.md#the-engineering-posture), prefer idempotency + eventual reconciliation (sagas, CRDTs) over locks and transactions, and push coordination to the edge / metadata layer. (`coordination-minimized`)
- **Paying for coordination the application never needed** — the most common overpayment: linearizable storage, a distributed lock, or a cross-node transaction where causal/eventual consistency, an idempotent operation, or a single-shard write would have been correct and far cheaper. (`coordination-minimized`)

The engineering posture under every one of these: **coordination is a tax, so a correct design pays the least of it that is still correct** — choosing the atomic-across-nodes mechanism soberly (2PC's blocking faced, or a saga with idempotent compensations preferred), using the primitives safely (fencing tokens, consensus outsourced), and minimizing the need by co-locating, weakening consistency, and reaching for idempotency-plus-reconciliation before locks. You are not coordinating well; you are arranging to coordinate as little as the problem allows — which is the distributed echo of the suite's master rule: make the cost match the real need.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) (the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) behind a compensation's retries and a paused lock-holder; the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) that makes the distributed lock dangerous; [Cook's framing](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) that fault tolerance turns into code; and the [first law](the-three-enemies.md#the-first-law--dont-distribute-until-you-must) — the closing synthesis ties all eight stages back to the three enemies) · [consistency-and-consensus.md](consistency-and-consensus.md) (the [consensus](consistency-and-consensus.md#consensus--the-algorithmic-core) that coordination sits on, that leader election reduces to, and that repairs 2PC; the [quorum/cluster machinery](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) ZooKeeper/etcd run on and that 2PC's CP-stall mirrors; and the [posture](consistency-and-consensus.md#the-engineering-posture) — don't hand-roll consensus, reserve it for the control plane — this stage extends) · [fault-tolerance.md](fault-tolerance.md) (the coordinator as a [single point of failure](fault-tolerance.md#redundancy--the-basic-move-with-one-big-precondition); the [failover, fencing, and split-brain](fault-tolerance.md#failover-and-recovery--and-mttr-over-mtbf) the fencing token here defends against; the [failure models](fault-tolerance.md#failure-models--how-badly-can-a-node-misbehave) coordination assumes are already handled) · [sharding.md](sharding.md) (the [cross-shard transaction](sharding.md#cross-partition-operations--the-most-painful-part) that is the pain motivating this stage, and the [routing map](sharding.md#request-routing--the-map-is-itself-a-consensus-problem) where consensus first reappeared as metadata — co-locating to keep transactions single-shard is the headline way to avoid coordination) · [communication.md](communication.md) (the [idempotency](communication.md#idempotency--the-headline-weapon) that compensations, the outbox consumer, and "reconciliation over locks" all require, and the [reliable-call recipe / retry discipline](communication.md#timeout-retry-backoff) a saga's steps and compensations reuse) · [../SKILL.md](../SKILL.md) (STAGE 7 — Distributed transactions & coordination, the gated flight plan this reference serves; the **final** stage — the map is complete). Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — *whether* this system should pay for strong coordination at all, where the transaction boundaries fall) · **`stationkeeping`** (running the coordination service in production — etcd/ZooKeeper operations, stuck-saga and lock-service incidents, the on-call response when a coordinator blocks) · **`gauge`** (encoding "this step is compensatable / this token is a fence / this operation is idempotent" in the type so a missing compensation or fence can't be silently forgotten) · **`plumb`** (keeping the saga, outbox, and fencing plumbing legible) · **`assay`** (testing the saga's compensation paths, the fencing-token rejection, and 2PC recovery — the cases and the doubles) · **`flightline`** (the event/message-schema evolution a saga's choreography and the outbox must survive across independently-deployed versions).

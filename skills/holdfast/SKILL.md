---
name: holdfast
description: >
  Design and audit distributed systems for correctness under partial failure —
  the realities a single-machine programmer (and an agent) gets wrong by default.
  The third state (a remote call can succeed, fail, OR leave you NOT KNOWING which);
  idempotency and delivery semantics (at-most / at-least / effectively-once);
  timeouts, retries with backoff+jitter, retry budgets and circuit breakers; why
  deep synchronous call chains cascade (availability multiplies, latency adds);
  ordering by causality not the wall clock (logical/vector clocks, partial vs
  total order); replicating data without losing it (single-leader / multi-leader /
  leaderless topologies, async failover and the acknowledged writes it drops,
  split-brain and fencing, conflict detection over wall-clock last-write-wins,
  replication-lag anomalies, eventual vs strong consistency); choosing a
  consistency model with eyes open (the linearizable → sequential → causal →
  eventual spectrum, CAP/PACELC, and why coordination — consensus, Paxos/Raft — is
  expensive and best used sparingly); partitioning data for scale (range vs hash vs
  consistent hashing, the partition key that keeps hot operations on one shard, skew
  and hot keys, secondary-index trade-offs, rebalancing without mass migration, and
  routing metadata that is itself a consensus problem); tolerating faults as the
  default, not the exception (failure models from crash-stop to Byzantine and what
  each costs, why failure detection is a guess, redundancy only across independent
  fault domains, graceful degradation, bulkheads / circuit breakers / backpressure
  to contain the blast radius, MTTR over MTBF, and chaos engineering); coordinating
  across nodes only when you must (two-phase commit and why it blocks, sagas and
  compensating transactions, distributed locks and fencing tokens, leader election,
  ZooKeeper/etcd — and that coordination is a tax to minimize); and the first law —
  don't distribute until you must. Use when the user designs or reviews anything that
  spans machines: RPC / microservices, retries and idempotency, message queues and
  delivery guarantees, event ordering, clocks and timestamps across servers,
  replication and failover, consistency models and consensus, partitioning /
  sharding, fault tolerance and graceful degradation, distributed transactions and
  coordination, or asks whether a distributed design is correct. Triggers on "is this
  retry safe", "exactly-once", "idempotency", "is this distributed design correct",
  "microservice call chain", "ordering / timestamps across servers", "is this
  replication safe", "split-brain", "eventual vs strong consistency",
  "read-your-writes", "CAP / CP vs AP", "linearizability", "how strong a consistency
  do we need", "do we need consensus", "Raft / Paxos / etcd / ZooKeeper", "how should
  I shard this", "partition / shard key", "consistent hashing", "hot key / hotspot",
  "rebalancing", "is this fault-tolerant", "failure model", "circuit breaker /
  bulkhead", "graceful degradation", "chaos engineering", "MTTR", "two-phase commit /
  2PC", "saga / compensating transaction", "distributed lock", "leader election",
  "fencing token", "should this even be distributed". The agent-era
  distributed-correctness lens — the FIRST skill of the distributed suite, and the
  COMPLETE eight-stage map: frame · communication · ordering · replication ·
  consensus · sharding · fault-tolerance · coordination.
argument-hint: "[distributed design or code to audit, or the thing you're about to distribute]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# holdfast

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A distributed system is a set of independent computers that fail independently, talk over an unreliable asynchronous network, and share no clock and no memory — trying to behave, to the outside, like one reliable machine. Nearly all of its difficulty comes from three enemies: **partial failure**, the **asynchronous, unreliable network**, and the absence of a **global clock or global state**. `holdfast` is the fixing device you clamp onto a distributed design or distributed code to keep it *correct while those enemies are active* — because they are always active. It audits (and guides you to build) across gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it.

**The one mental shift everything hangs on — the third state.** On a single machine an operation has two outcomes: **success** or **failure**. Cross a network and a third appears: **"I don't know."** You sent a request and got no reply — did it not arrive? arrive and run slowly? run, but the reply was lost (so it *did* happen)? did the node die? *You cannot tell.* "Slow" and "dead" are indistinguishable from the outside, so a timeout is a **guess**, not a fact. Single-machine code has **no branch for "unknown"** — and most distributed bugs grow in that missing branch. Every technique in this skill answers one question: **given that "I don't know" will happen, what do I do?**

**The first law, because it governs everything:** *don't distribute until you must.* A single strong machine is dramatically simpler — shared memory, one clock, all-or-nothing failure. You distribute only when forced: data/traffic too big for one box (scale), no single point of failure (availability), users too far (latency), or the problem is inherently multi-site. Everything hard below is the **bill** for that choice. This is the suite's "by scale and risk, not by fashion" — `load-bearing`'s Monolith-First, aimed at the machine boundary.

**The framing that makes failure normal:** Richard Cook's *How Complex Systems Fail* — a complex system runs **degraded as its constant background state**, disasters are **cascades** of several aligned failures (no single root cause), and safety is a **system-level** property, not a component one. In distributed terms that is literal: at any moment some node is slow, some disk dying, some link flapping, and the system serves anyway *because it was built to tolerate that*. So fault tolerance is not a feature you add — it is the **floor**.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Speak the user's language.** Most calls here are trade-offs the user owns (is this consistency level worth the latency, is this duplication-on-retry acceptable, do we actually need to distribute this). Read their fluency and gloss a term on first use (the third state, idempotency, at-least-once, partial order, causality, backoff/jitter, circuit breaker). A "finding" the user can't evaluate is an opinion imposed, not a judgment shared.

**Read [references/the-three-enemies.md](references/the-three-enemies.md) first** — the must-be-told foundation: the three enemies, the third state, the fallacies a single-machine programmer carries over, and why "failure is the background." It is the key that makes every later stage derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the complete map, one per stage:

- **[references/the-three-enemies.md](references/the-three-enemies.md)** — the foundation: partial failure, the unreliable async network, no global clock/state, the **third state**, concurrency/non-determinism, the eight fallacies, the Cook framing, and the first law (don't distribute until you must). Load at STAGE 0; it is the key to all of it.
- [references/communication.md](references/communication.md) — how nodes talk *despite* the third state: RPC as a leaky abstraction, sync vs async (and why deep sync chains cascade — availability multiplies, latency adds), delivery semantics (at-most/at-least/effectively-once), idempotency as the headline weapon, timeout/retry/backoff+jitter/circuit-breaker, and schema evolution across independently-deployed versions.
- [references/time-and-causality.md](references/time-and-causality.md) — why wall clocks can't order cross-machine events (and silently lose data via last-write-wins), happened-before and causality, partial vs total order, Lamport vs vector clocks, HLC, and the lesson that you only get the **causal partial order** for free — a global total order costs coordination.
- [references/replication.md](references/replication.md) — keeping copies of the same data without losing or corrupting it: the three topologies (single-leader / multi-leader / leaderless), synchronous vs asynchronous and the writes async failover drops, failover hazards (split-brain, fencing), write conflicts and how leaderless quorums (W+R>N), read-repair, anti-entropy and version vectors handle them, the replication-lag anomalies (read-your-writes / monotonic-reads / consistent-prefix), eventual consistency and its limits, and change propagation (statement / WAL / logical-row CDC). Applies STAGE 2's ordering lesson and bridges to consistency & consensus.
- [references/consistency-and-consensus.md](references/consistency-and-consensus.md) — the heart: the consistency spectrum (linearizable → sequential → causal → eventual) and choosing the weakest model still correct; the three meanings of "consistency" untangled (ACID-C vs CAP-C vs the model spectrum) and linearizability vs serializability; CAP as it really is (partition is not optional → CP vs AP, not three-choose-two) and PACELC (coordination costs latency even without a partition); consensus as the algorithmic core (what reduces to it, FLP and how real systems sidestep it via safety-always/liveness-under-timing, Paxos vs Raft, majority quorums and odd-sized clusters); and the posture — don't hand-roll consensus, use it sparingly.
- [references/sharding.md](references/sharding.md) — splitting *different* data across nodes for scale (orthogonal to replication, and layered with it — each shard is itself a replicated cluster): the partitioning schemes (range vs hash vs consistent hashing vs fixed partition count) and choosing a partition key that fits the access pattern; skew and the single hot key hashing can't fix; secondary-index trade-offs (local scatter-gather reads vs global cross-partition writes); rebalancing without mass migration (and why auto-rebalance + auto-failure-detection can cascade); request routing whose partition→node map is itself consensus-backed metadata; and minimizing the painful cross-shard joins and transactions.
- [references/fault-tolerance.md](references/fault-tolerance.md) — Cook's *How Complex Systems Fail* made into code: failure is the default, so build a reliable whole from unreliable parts. The failure models (crash-stop / crash-recovery / omission / Byzantine, and the 2f+1 vs 3f+1 price of malice); why failure detection is an unavoidable guess (heartbeat/timeout, the timeout dilemma, phi-accrual); redundancy and its one precondition — *independent* failure (correlated failures across rack/AZ/version defeat it); failover and recovery (fence, catch up, MTTR over MTBF); containing the blast radius (graceful degradation, bulkheads, circuit breakers, backpressure, timeouts); and designing for failure then *exercising* it with chaos engineering.
- [references/transactions-and-coordination.md](references/transactions-and-coordination.md) — the final stage: when you must act atomically across nodes or agree on who's in charge, and why to do as little of it as possible. Two-phase commit (2PC) and why it *blocks* — the coordinator as a single point of failure that strands participants holding locks — and its repair by consensus (Spanner = 2PC over Paxos); the microservices turn to **sagas** (local transactions + idempotent compensations, not atomic, not isolated) and the outbox pattern; coordination primitives (leader election, distributed locks and the fencing token that keeps a paused lock-holder from corrupting data — Kleppmann's Redlock critique) and outsourcing the hard part to ZooKeeper/etcd; and the through-line — *coordination is a tax: pay it only where you truly must.*

> **The map is complete.** These eight stages — frame · communication · ordering · replication · consensus · sharding · fault-tolerance · coordination — are the whole of holdfast: eight facets of one problem, defending against the three enemies of [the-three-enemies.md](references/the-three-enemies.md). holdfast gates all eight below.

---

## STAGE 0 — Frame (do you even need this, and what can fail?)

Open **[references/the-three-enemies.md](references/the-three-enemies.md)**. Internalize the three enemies and the **third state**, then size the problem before designing anything.

- **The first law: don't distribute until you must.** Confirm a real driver (scale / availability / latency / inherently-distributed) — or take the dramatically simpler single-machine option. Distributing for fashion is the most expensive mistake on this list.
- **Name the failure model for *this* system.** What can fail (nodes crash; the network delays, drops, reorders, partitions; no shared clock/state), and accept the third state — every remote operation here has three outcomes, not two, and your design must have a branch for "I don't know."

### GATE — clear before COMMUNICATION
1. `checklist check frame distribution-justified`
2. `checklist check frame failure-model-named`
3. `checklist verify frame`

---

## STAGE 1 — Communication (talk reliably on top of the third state)

Open **[references/communication.md](references/communication.md)**. Every remote interaction must survive "I don't know."

- **Handle the third state in every remote call.** Pick the delivery semantics deliberately (at-most-once = may lose; at-least-once = may duplicate — the common choice; effectively-once = at-least-once **+ idempotency**, because exactly-once *delivery* is essentially impossible). Make operations **idempotent** (idempotency keys / dedup, or naturally-idempotent "set to X" over "add X") so a retry is harmless.
- **Retry with discipline.** Bounded retries, **exponential backoff + jitter**, a retry budget, and a **circuit breaker** — and retry **only idempotent** operations. Naive retries are a **retry storm** that turns a struggling service into a dead one (a Cook cascade). The one-line recipe: **timeout + bounded-retry(backoff+jitter) + idempotency key + circuit breaker.**
- **Don't build naive synchronous call chains.** A deep sync chain's availability is the **product** of each link's and its latency is the **sum** — five 99.9% hops ≈ 99.5%. Bound it: bulkheads, tight inner timeouts, go async where you can. And because services deploy independently at **different versions**, make the message schema forward/backward compatible (this routes to `flightline` / `load-bearing`'s API-evolution).

### GATE — clear before ORDERING
1. `checklist check communication third-state-handled`
2. `checklist check communication retry-discipline`
3. `checklist check communication no-naive-sync-chains`
4. `checklist verify communication`

---

## STAGE 2 — Ordering (causality, never the wall clock)

Open **[references/time-and-causality.md](references/time-and-causality.md)**. Once messages are async and can arrive out of order, "who happened first?" is a real question — and the wall clock cannot answer it.

- **Never order cross-machine events by wall-clock time.** Clocks drift and skew (NTP residual is tens of ms and can jump *backward*), so wall-clock **last-write-wins silently drops data**. Use a **monotonic** clock for durations, never for cross-machine order.
- **Order by causality.** Use happened-before / logical or vector clocks (or version vectors) where order matters; **detect concurrent writes** (genuinely unordered) instead of letting one clobber the other. Remember you only get the **partial (causal) order** for free — a true total order costs coordination (STAGE 4: consensus).

### GATE — clear before REPLICATION
1. `checklist check ordering no-wallclock-ordering`
2. `checklist verify ordering`

---

## STAGE 3 — Replication (copies of the same data, kept correct)

Open **[references/replication.md](references/replication.md)**. The moment one datum lives on more than one node, the asynchronous network guarantees the copies *will* diverge for a while. Replication is the whole discipline of handling that divergence — and it is where STAGE 2's ordering lesson stops being abstract: "concurrent writes, detected not clobbered" is now the daily conflict-resolution problem. (Keep replication — copies of the *same* data — distinct from **sharding** (STAGE 5) — splitting *different* data across nodes; they are orthogonal and usually combined.)

- **Choose the topology and the sync mode on purpose.** Single-leader (all writes through one node → one authoritative order, simplest, most common) vs multi-leader (each site writes locally → fast and partition-tolerant, but concurrent writes can now *conflict*) vs leaderless/Dynamo (quorum reads & writes, highest availability). And pick **synchronous vs asynchronous** with eyes open: sync protects the data but a slow follower stalls writes; **async is fast but a leader that crashes before propagating silently loses already-acknowledged writes** — "the async follower is safe" is false.
- **Treat failover as the dangerous operation it is.** Deciding the leader is *really* dead is the **third state** again (a timeout, never a fact). Picking the new leader needs agreement (STAGE 4: consensus). And the old leader must be **fenced** (STONITH / fencing tokens) — a merely-slow old leader that revives and keeps writing is **split-brain**, two leaders corrupting the data. Acknowledge that un-propagated async writes are **lost** at cutover (don't silently resurrect them later).
- **Face conflicts and lag head-on.** Detect concurrent writes with **version vectors** and resolve by merge / CRDT / app-logic — never wall-clock **last-write-wins** (STAGE 2: it silently drops data). Remember a **quorum** (W + R > N) guarantees the read and write sets overlap but is **necessary, not sufficient** — concurrent writes inside the quorum still need conflict detection. Name the **replication-lag anomalies** and buy the guarantee where it matters: read-your-writes, monotonic reads, consistent-prefix. And do not mistake **eventual** consistency for strong — "eventually" has no upper bound and promises nothing about the read you're about to do.

### GATE — clear before CONSENSUS
1. `checklist check replication topology-and-sync-chosen`
2. `checklist check replication failover-split-brain-guarded`
3. `checklist check replication conflict-and-lag-faced`
4. `checklist verify replication`

---

## STAGE 4 — Consistency & Consensus (the heart: how much agreement, at what price)

Open **[references/consistency-and-consensus.md](references/consistency-and-consensus.md)**. This is the heart of the whole subject, and the one place a word will trip you: **"consistency" is overloaded.** It means at least three different things — ACID's **C** (a transaction preserves an application invariant; not a distributed concept), CAP's **C** (specifically *linearizability*), and the **consistency-model spectrum** (what a read is allowed to observe). This stage is about the last two; keep them apart from ACID-C. The through-line: *strong consistency needs **consensus**; consensus needs a **majority quorum** whose liveness needs **timing assumptions**; under a partition the minority can't reach a majority, so a strong-consistency system goes unavailable there — which is exactly CAP.* "How strong a consistency, at what cost?" = "how much coordination, paid for in availability-under-partition and latency-always."

- **Choose a consistency model explicitly — the *weakest* one still correct.** Know the spectrum, strong to weak: **linearizable** (behaves as one copy, every op atomic at an instant, respects *real time* — "strong consistency") → **sequential** (a total order matching each process's program order, but not real time) → **causal** (orders causally-related ops; the *strongest model still available under a partition*) → **eventual** (converges, nothing in between). Stronger is not "better" — it is more expensive. (Don't conflate: **linearizability** ≠ **serializability** — single-object real-time recency vs multi-transaction isolation; both together = strict serializability; and neither is ACID-C.)
- **Face CAP as it really is — then PACELC.** A partition is *not optional* (the network is unreliable — STAGE 0), so it is never "three-choose-two" and **CA is not a real option**: the only question is **when a partition happens, sacrifice C or A?** — CP vs AP. And CAP says nothing about the normal case, so **PACELC** completes it: *if Partition → A vs C, **else** → Latency vs C.* **Coordination has a cost**: even with no partition, stronger consistency is bought with latency.
- **Use consensus well — sparingly, and never hand-rolled.** Consensus (agreeing on a value/log despite crashes on an async network) is the core primitive — leader election, atomic commit, config, a linearizable store all reduce to it. But it is expensive (a reachable **majority quorum**; use **odd-sized** clusters; the minority side of a partition stalls = CP) and **FLP** says no deterministic async algorithm can *guarantee* termination if a node may crash — so real systems keep **safety always** and get **liveness only under timing assumptions**. Therefore: **don't hand-roll it** (use etcd / ZooKeeper / a mature Raft library), and **reserve it for the control plane** (the things that need one source of truth), running the data plane on weaker, cheaper models.

### GATE — clear before SHARDING
1. `checklist check consensus consistency-model-chosen`
2. `checklist check consensus cap-pacelc-faced`
3. `checklist check consensus consensus-used-well`
4. `checklist verify consensus`

---

## STAGE 5 — Partitioning / sharding (split different data across nodes)

Open **[references/sharding.md](references/sharding.md)**. When data is too big for one machine or traffic too heavy for one node, you **split** it across nodes — that is partitioning (sharding). Keep it straight from replication: **replication (STAGE 3) is the *same* data copied for fault tolerance; partitioning is *different* data split for scale.** They are orthogonal and **layered** — a real system is a 2-D grid: sharded across, replicated down, so **each shard is itself a small replicated cluster and STAGE 3/4 run again inside it.**

- **Choose the scheme and the partition key to fit the access pattern — the decision everything else pays for.** **Range** partitioning gives efficient scans but **hotspots** on a monotonic key (a timestamp sends all new writes to the last shard); **hash** spreads evenly but kills range scans, and naive `hash mod N` is a rebalancing **disaster** (change N → almost every key moves) — use **consistent hashing** (~K/N keys move) or a **fixed, large partition count** (move whole partitions). Above all, pick the key so the operations you care about **stay on one shard** — a mis-aligned key taxes every later query and transaction.
- **Expect skew and the hot key.** Real load is power-law; "uniform" rarely holds. Hashing fixes order-clustering but **not a single hot key** (a celebrity, a viral post — same hash, same shard) — split it with a random prefix/suffix and re-gather on read. And face the **secondary-index** trade-off: a **local** (document-partitioned) index is cheap to write but a query **scatter-gathers** every shard; a **global** (term-partitioned) index reads efficiently but writes are expensive, cross-partition, and usually async (the index lags). No free option.
- **Make rebalancing and routing safe.** Rebalance by moving the **minimum** data, online and fairly (never `hash mod N`). Beware the cascade: **auto-rebalance + auto-failure-detection** can read a merely-slow node (STAGE 0) as dead, kick off a massive data move, and tip a strained system over (a Cook cascade) — keep a **human in the loop**. Routing needs the partition→node map, which is consistent cluster **metadata** living in a coordination service (ZooKeeper / etcd) that runs on **consensus** (STAGE 4) — *consensus reappears.* And **minimize cross-shard work** — joins need a shuffle (denormalize, co-locate), cross-shard transactions need distributed coordination (2PC — STAGE 7) that is slow and fragile; design to keep them single-shard.

### GATE — clear before FAULT-TOLERANCE
1. `checklist check sharding partition-key-fits-access`
2. `checklist check sharding skew-and-secondary-indexes-handled`
3. `checklist check sharding rebalance-and-routing-safe`
4. `checklist verify sharding`

---

## STAGE 6 — Fault tolerance (a reliable whole from unreliable parts)

Open **[references/fault-tolerance.md](references/fault-tolerance.md)**. This stage gathers every failure the earlier stages met into one discipline, and it is essentially Cook's *How Complex Systems Fail* turned into engineering. The premise is the one from STAGE 0: **in a distributed system failure is the constant background, not an exception** — with enough nodes, *something* is broken at any instant, so the job is to build a reliable whole from unreliable parts. Fault tolerance is therefore not a feature; it is the **floor**.

- **Name the failure model, and treat detection as a guess.** Decide how bad a node may get and design for exactly that: **crash-stop** (halts for good — simplest) → **crash-recovery** (returns, maybe stale, maybe a zombie — needs recovery + fencing) → **omission** (drops messages) → **Byzantine** (lies / arbitrary). Malice is expensive: f crash failures need **2f+1** nodes, f Byzantine need **3f+1** — so **don't pay for BFT inside a trusted datacenter** (default to crash faults; reserve BFT for untrusted settings — blockchain, aerospace). And failure **detection** (heartbeat + timeout) cannot tell *dead* from *slow* (STAGE 0) — too short a timeout false-positives a slow node (needless failover, the STAGE 5 cascade); prefer an accrual detector (phi-accrual) and respect that a false positive often hurts more than the slowness.
- **Make redundancy real, and recover fast.** Eliminate single points of failure with spares — but redundancy masks **only independent** failures: replicas in the same rack / AZ / power feed / buggy version die from **one** event, so spread across **fault domains** and avoid shared dependencies. On failover, **fence** the old component (no zombie / split-brain — STAGE 3) and don't lose in-flight state; a recovering node must **catch up** before it serves and never serve stale data. Because failure is inevitable, **optimize MTTR over MTBF** — fast automatic recovery beats chasing "never fails."
- **Contain the blast radius, then exercise it.** When part fails, **degrade gracefully** (cache / stale / shed load / partial results) rather than collapse. Stop the cascade (Cook) with **bulkheads** (isolate resources so one failure can't drain them all), **circuit breakers** (stop calling a dead dependency — kills the STAGE 1 retry storm), **backpressure / load-shedding** (reject early, don't die wholesale), and **timeouts everywhere** (never wait forever). Then **design for failure** as the default path and **exercise it — chaos engineering** (kill nodes, add latency, partition the network): a failure mode you have never exercised is one whose real reliability you do not know.

### GATE — clear before COORDINATION
1. `checklist check fault-tolerance failure-model-and-detection-honest`
2. `checklist check fault-tolerance redundancy-without-correlation`
3. `checklist check fault-tolerance blast-radius-contained`
4. `checklist verify fault-tolerance`

---

## STAGE 7 — Distributed transactions & coordination (the tax, paid only when you must)

Open **[references/transactions-and-coordination.md](references/transactions-and-coordination.md)**. The last stage closes the loop the others opened: sometimes an action *must* be atomic across nodes (all-commit-or-all-abort), or several nodes *must* agree on who's in charge — that is **coordination**, and underneath it almost always sits the consensus of STAGE 4. The whole stage is one judgment: coordination is **expensive**, so use the least of it you can.

- **Choose the atomic-across-nodes mechanism soberly.** **2PC** (two-phase commit) gives atomicity — a coordinator runs *prepare* (each participant does the work, locks, durably logs, votes yes/no; a yes is an irrevocable promise) then *commit/abort* — but it **blocks**: the coordinator is a single point of failure (STAGE 6), and if it dies after the votes but before the decision, participants are stuck **holding locks** with no way to decide. It trades availability for atomicity; its repair is to make the coordinator's decision fault-tolerant via **consensus** (Spanner = 2PC over Paxos). The microservices default is to **avoid the distributed transaction**: use a **saga** (a chain of local transactions with **idempotent compensations** to semantically undo), accepting it is *not* atomic and *not* isolated (intermediate states show; some effects only undo semantically), with the **outbox** pattern for the dual write.
- **Use coordination primitives safely — and outsource the hard part.** Leader election runs on consensus. A **distributed lock** is dangerous: a holder paused past its lease (GC, slow disk) while the lock is re-granted gives you **two holders** — split-brain (STAGE 3/6); require a **fencing token** (monotonic; the resource rejects stale tokens — Kleppmann's Redlock critique). And **don't hand-roll consensus**: host metadata and coordination on **ZooKeeper / etcd**, which package it into proven primitives (locks, election, config, watches).
- **Minimize coordination — it's a tax.** All strong coordination (distributed transactions, consensus, locks) costs latency, availability, and throughput and hides the worst bugs. Design to **need less**: co-locate so operations stay single-shard (STAGE 5), use the weakest correct consistency (STAGE 4), prefer **idempotency + eventual reconciliation** (sagas, CRDTs) over locks and transactions, push coordination to the edge / metadata layer. *Pay the tax only where you truly must.*

### FINAL GATE — the map is complete
1. `checklist check coordination distributed-transaction-chosen-soberly`
2. `checklist check coordination coordination-primitives-used-safely`
3. `checklist check coordination coordination-minimized`
4. `checklist verify coordination`
5. `checklist show` — confirm all **eight** stages passed.
6. `checklist done` — clear this run's state.

---

## The thread through all of it

holdfast is the **distributed-failure-mode correctness lens**, held over any design or code that crosses a machine boundary. Its eight stages are **eight facets of one problem** — every one is a way of surviving the three enemies of STAGE 0: **partial failure, the asynchronous unreliable network, and the absence of a global clock or global state.** Communication (1) is how to talk when a request's outcome is inherently ambiguous; ordering (2) is how to define "before" with no global clock; replication and consensus (3–4) are how to make many copies act like one with no global state; sharding (5) is how to grow sideways; fault tolerance (6) is how to stay alive as parts keep dying — Cook's *How Complex Systems Fail* in code; coordination (7) is the tax, and how to pay as little of it as possible. And the through-line is the suite's own: **manage complexity; make the cost match the real need** — here, "distribute only when forced, choose the weakest correct consistency, and treat coordination as a tax."

It pairs with its siblings without duplicating them: `load-bearing` owns the architecture decision (monolith vs services, CAP as a *design* choice); `stationkeeping` owns running it in production (SRE, chaos engineering, incident response); `gauge` and `plumb` own the code-level signal and craft; `assay` tests behavior — holdfast names the *distributed* failure modes those others don't, and routes the fix. For an agent the lever is the same as everywhere in the suite: it writes code that assumes the network is reliable, that a retry is free, that a timestamp orders the world — feeling none of the future 3 a.m. page — so distributed correctness must be **judged and gated**, with the version that survives "I don't know" made the one that ships.

## Anti-patterns (use as a pre-flight checklist)

- **Distributing before you must** — a single strong machine is far simpler; distribute only for scale/availability/latency/inherently-distributed.
- **No branch for "I don't know"** — code written as if remote calls are two-state (success/failure); the third state is where the bugs live.
- **Treating an RPC like a local call** — it is slower by orders of magnitude, fails in new ways, and can be partitioned; the network is the thing you can't hide.
- **Retrying a non-idempotent operation** — duplicate effects (double charge); make it idempotent first.
- **Retry without backoff + jitter (+ budget, breaker)** — a retry storm; you DDoS your own struggling service (a cascade).
- **Believing in exactly-once *delivery*** — it's an end-to-end *effect* property (at-least-once + idempotency), not something the network gives you.
- **Deep synchronous call chains** — availability multiplies, latency adds; bound them, bulkhead, go async.
- **Assuming sender and receiver share a version** — independent deploys; evolve the schema forward/backward compatibly.
- **Ordering cross-machine events by wall clock** (and wall-clock last-write-wins) — clocks drift/skew/jump; order by causality.
- **Treating "concurrent" as an error to suppress** — concurrency is a real state to detect and resolve, not to clobber.
- **Believing asynchronous replication can't lose data** — a leader that crashes before propagating drops already-acknowledged writes; "the async follower is safe" is false.
- **Failing over without fencing the old leader** — a slow-not-dead leader revives and you have split-brain: two leaders corrupting the same data.
- **Resolving write conflicts with wall-clock last-write-wins** — it silently discards one writer; detect with version vectors and merge.
- **Trusting a quorum (W + R > N) to prevent conflicts** — overlap guarantees you *read* a fresh copy, not that two concurrent writes didn't both land; they still need conflict detection.
- **Mistaking eventual consistency for strong** — "eventually" has no upper bound and says nothing about the read you're about to do (read-your-writes / monotonic reads must be bought).
- **Reading CAP as "three-choose-two" (and thinking CA is achievable)** — partitions are not optional; the only real choice is CP vs AP when one happens.
- **Assuming consistency is free as long as there's no partition** — PACELC: stronger consistency costs latency even in normal operation; coordination is never free.
- **Confusing linearizability with serializability** — single-object real-time recency vs multi-transaction isolation; they are different guarantees (both together = strict serializability), and neither is ACID's C.
- **Hand-rolling a consensus or leader-election protocol** — it is notoriously easy to get subtly wrong; use etcd / ZooKeeper / a mature Raft library.
- **Reaching for strong consistency everywhere** — consensus is expensive (a reachable majority, coordination latency); reserve it for the control plane (leader, config, metadata) and run the data plane on weaker, cheaper models.
- **Running a consensus cluster with an even number of nodes** — no better fault tolerance than the odd size below it and a needless split risk; use 3 or 5.
- **Partitioning with `hash mod N`** — adding or removing a node remaps almost every key (mass migration); use consistent hashing or a fixed partition count.
- **A monotonic partition key (timestamp, auto-increment) on range partitioning** — every new write lands on the last shard; that shard is your hotspot.
- **Believing hashing cures hotspots** — it spreads *order-clustering*, but a single hot key still maps to one shard; split the hot key with a prefix/suffix.
- **Ignoring the secondary-index tax** — a local index scatter-gathers reads across all shards; a global index makes writes cross-partition and lagging. Pick deliberately.
- **A partition key that doesn't fit the access pattern** — you pay a cross-shard join or transaction on every important query; co-locate what's read together.
- **Fully automatic rebalancing wired to automatic failure detection** — a slow node read as dead triggers a mass data move and cascades; keep a human in the loop.
- **Reaching for 2PC on every cross-service action** — it blocks on a coordinator that is a single point of failure and holds locks the whole time; prefer a saga, or avoid the cross-node transaction entirely.
- **A saga with no compensations, or non-idempotent ones** — a half-finished saga can't be unwound; design idempotent compensations, and handle the visible intermediate state.
- **A distributed lock without a fencing token** — a paused holder past its lease plus a new holder = two writers corrupting data; require a monotonic token the resource enforces.
- **Hand-rolling coordination instead of using ZooKeeper / etcd** — consensus is the hardest thing to get right; outsource it to a service that already has.
- **Coordinating everywhere** — distributed transactions, consensus, and locks are a tax; minimize the need (co-locate, weaker consistency, idempotency + reconciliation) and pay only where you must.
- **Treating failure as an exception, not the default** — with enough nodes something is always broken; build for it, don't bolt it on.
- **A failure-detection timeout set too short** — it false-positives slow-but-alive nodes into "dead," triggering needless failover and flapping (a cascade); tune it, prefer an accrual detector.
- **Trusting redundancy against correlated failure** — replicas in the same rack / AZ / power feed / software version die together; spread across fault domains.
- **Leaving a single point of failure** — the one load balancer, the one coordinator; find it and give it a spare.
- **Chasing MTBF while ignoring MTTR** — since failure is inevitable, fast automatic recovery usually buys more than "never fails."
- **No bulkheads or circuit breakers** — one slow dependency drains every thread/connection and sinks the whole service; isolate and fail fast.
- **Never running a chaos / game-day exercise** — a failure mode you've never triggered is one whose blast radius you'll first learn about in production.
- **Paying for BFT (3f+1) inside a trusted network** — Byzantine tolerance is for untrusted participants; default to crash faults (2f+1) in your own datacenter.
- **Skipping a GATE** — and remember the first law: the cheapest distributed bug is the one you avoided by not distributing.

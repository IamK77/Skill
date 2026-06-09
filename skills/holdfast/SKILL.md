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
  total order); and the first law — don't distribute until you must. Use when the
  user designs or reviews anything that spans machines: RPC / microservices,
  retries and idempotency, message queues and delivery guarantees, event ordering,
  clocks and timestamps across servers, or asks whether a distributed design is
  correct. Triggers on "is this retry safe", "exactly-once", "idempotency",
  "is this distributed design correct", "microservice call chain", "ordering /
  timestamps across servers", "should this even be distributed". The agent-era
  distributed-correctness lens — the FIRST skill of the distributed suite, and a
  FOUNDATION cut (frame · communication · ordering); replication, consistency &
  consensus, sharding, fault tolerance, and coordination are forthcoming stages.
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

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Three references back this foundation cut:

- **[references/the-three-enemies.md](references/the-three-enemies.md)** — the foundation: partial failure, the unreliable async network, no global clock/state, the **third state**, concurrency/non-determinism, the eight fallacies, the Cook framing, and the first law (don't distribute until you must). Load at STAGE 0; it is the key to all of it.
- [references/communication.md](references/communication.md) — how nodes talk *despite* the third state: RPC as a leaky abstraction, sync vs async (and why deep sync chains cascade — availability multiplies, latency adds), delivery semantics (at-most/at-least/effectively-once), idempotency as the headline weapon, timeout/retry/backoff+jitter/circuit-breaker, and schema evolution across independently-deployed versions.
- [references/time-and-causality.md](references/time-and-causality.md) — why wall clocks can't order cross-machine events (and silently lose data via last-write-wins), happened-before and causality, partial vs total order, Lamport vs vector clocks, HLC, and the lesson that you only get the **causal partial order** for free — a global total order costs coordination.

> **Scope note.** This is the foundation cut. The remaining stages — **replication**, **consistency & consensus** (the heart: CAP/PACELC, linearizability→eventual, Paxos/Raft, FLP), **partitioning/sharding**, **fault tolerance**, and **distributed transactions & coordination** (2PC/Saga, leader election, locks, ZooKeeper/etcd) — are forthcoming. Until then, holdfast gates the three foundational stages below.

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
- **Order by causality.** Use happened-before / logical or vector clocks (or version vectors) where order matters; **detect concurrent writes** (genuinely unordered) instead of letting one clobber the other. Remember you only get the **partial (causal) order** for free — a true total order costs coordination (forthcoming: consensus).

### FINAL GATE (foundation cut)
1. `checklist check ordering no-wallclock-ordering`
2. `checklist verify ordering`
3. `checklist show` — confirm the three foundation stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

holdfast is the **distributed-failure-mode correctness lens**, held over any design or code that crosses a machine boundary. It pairs with its siblings without duplicating them: `load-bearing` owns the architecture decision (monolith vs services, CAP as a *design* choice); `stationkeeping` owns running it in production (SRE, chaos engineering, incident response); `gauge` and `plumb` own the code-level signal and craft; `assay` tests behavior — holdfast names the *distributed* failure modes those others don't, and routes the fix. For an agent the lever is the same as everywhere in the suite: it writes code that assumes the network is reliable, that a retry is free, that a timestamp orders the world — feeling none of the future 3 a.m. page — so distributed correctness must be **judged and gated**, with the version that survives "I don't know" made the one that ships.

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
- **Skipping a GATE** — and remember the first law: the cheapest distributed bug is the one you avoided by not distributing.

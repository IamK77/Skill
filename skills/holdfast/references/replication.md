# Replication — copies of the same data, kept correct while they disagree

This reference is the depth behind **STAGE 3 — Replication** of the [../SKILL.md](../SKILL.md) flight plan. It is the stage where the three foundation stages stop being separate lessons and start operating together. The single fact this whole stage hangs on:

> **The instant the same datum has more than one copy, the asynchronous network guarantees those copies WILL temporarily disagree.** A write lands on one copy before it reaches another, and between those two moments a reader can see either. That disagreement is not a defect you can engineer away — it is a *consequence* of [enemy 2](the-three-enemies.md#enemy-2--the-unreliable-asynchronous-network), the unbounded-delay network. **How you handle the disagreement IS the entire topic.** And handling it well is the bridge to the *consistency & consensus* stage (STAGE 4), because every choice here is a down-payment on a consistency model you'll name precisely there.

Replication exists because a single machine, the thing the [first law](the-three-enemies.md#the-first-law--dont-distribute-until-you-must) tells you to prefer, has a single point of failure and a single point of service. Keeping copies buys three things — and each is one of the drivers that crossed you over the machine boundary in the first place:

- **Fault tolerance** — a copy survives the death of the node holding the original (answers the *availability* driver).
- **Lower latency** — a copy near the user serves reads without a round-trip across the planet (answers the *latency* driver).
- **Higher read throughput** — many copies share the read load (answers part of the *scale* driver).

But — and this is the whole posture of the file — every one of those gains is bought by **introducing new failure modes that did not exist with one copy**: writes that vanish, leaders that fork, copies that conflict. That is [Cook's framing](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) made literal — *change introduces new ways to fail* — and we close on it.

## Contents

- [Replication is not sharding](#replication-is-not-sharding)
- [The three topologies — where a write goes, and how it spreads](#the-three-topologies--where-a-write-goes-and-how-it-spreads)
- [Single-leader — one place defines write order](#single-leader--one-place-defines-write-order)
- [Failover — the single most dangerous operation](#failover--the-single-most-dangerous-operation)
- [Multi-leader — local writes, and conflicts in the flesh](#multi-leader--local-writes-and-conflicts-in-the-flesh)
- [Leaderless — quorums, read repair, version vectors](#leaderless--quorums-read-repair-version-vectors)
- [Replication lag and its named anomalies](#replication-lag-and-its-named-anomalies)
- [Eventual consistency — state it precisely, warn precisely](#eventual-consistency--state-it-precisely-warn-precisely)
- [How the change is propagated](#how-the-change-is-propagated)
- [The engineering posture](#the-engineering-posture)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## Replication is not sharding

Disambiguate this before anything else, because conflating the two muddles every later decision:

> **Replication** = many copies of the **SAME** data. **Partitioning / sharding** (a later stage) = splitting **DIFFERENT** data across nodes so no one node must hold it all. They are **orthogonal**, and real systems **combine** them — shard the data into pieces, then replicate each shard for fault tolerance.

The two answer different drivers: replication answers *availability* and read *latency* (keep a copy alive, keep a copy close); sharding answers *write/storage scale* (no node holds it all). This file is only about the first. When a design says "we'll scale by adding nodes," pin down which one is meant — adding *replicas* multiplies your read capacity and your fault tolerance but does **nothing** for write or storage scale, and adding *shards* does the reverse. Keeping them distinct is the first STAGE 3 check.

---

## The three topologies — where a write goes, and how it spreads

A replication topology is just an answer to two questions: **where is a write allowed to land, and how does that write propagate to the other copies?** Everything else — the simplicity, the failure modes, the conflicts — falls out of that one answer. There are three answers in wide use:

| Topology | Where writes land | The defining virtue | The defining hazard |
|---|---|---|---|
| **Single-leader** | one node only (the leader) | one authoritative write order — *simplest* | the leader is a bottleneck and a failover problem |
| **Multi-leader** | several leaders, each accepts writes | local writes, sites survive independently | concurrent **write conflicts** |
| **Leaderless** | client writes to several replicas directly | highest availability | the client owns conflict detection and repair |

Read them top to bottom as a trade of **simplicity for availability/locality**. Single-leader hands you one place that defines the order of all writes; the other two give up that single order to gain the ability to keep writing locally when a node or a whole datacenter is unreachable.

---

## Single-leader — one place defines write order

The most common topology, and the default of relational databases (leader/follower, sometimes called primary/replica). **All writes go to the one leader**, which applies them and then replicates the change to its followers; **reads may hit the leader or any follower.**

Its biggest virtue is exactly what the previous stage taught you to treasure. Because every write passes through a single node, that node **defines a total order of all writes for free**. Recall from [time-and-causality.md](time-and-causality.md#partial-order-vs-total-order--the-load-bearing-takeaway) that a true total order normally costs coordination — it is something you must *manufacture and pay for*. Single-leader replication is the case where you get one without a consensus protocol: the leader's sequence of writes *is* the order, by construction. That is the deep reason single-leader is the simplest topology, and why you should reach for it first.

The leader's virtue comes with two knobs you must set on purpose.

**Synchronous vs asynchronous replication** is the first, and it is a direct durability-vs-availability trade:

| | **Synchronous** | **Asynchronous** |
|---|---|---|
| Leader acknowledges the client… | only **after** a follower confirms it has the write | **immediately**, then propagates in the background |
| If the leader dies right after the ack | the follower has the data — **no loss** | the un-propagated writes are **LOST** |
| Cost | a slow or dead follower **stalls all writes** (hurts availability) | none to latency — but the durability hole above |

> **Asynchronous failover silently loses already-acknowledged writes.** This is the trap to say out loud. With async replication the leader tells the client "done" *before* the followers have the data. If the leader then crashes, every write it acknowledged but had not yet shipped is **gone** — the client was told it succeeded, and it didn't survive. "The async follower is safe" is **false.** The data is only as safe as the slowest copy that actually received it.

In practice nobody runs fully synchronous (one slow follower would freeze the cluster) and few run fully asynchronous for data that matters. The common compromise is **semi-synchronous**: keep *one* follower synchronous (so at least one other copy always has every acknowledged write) and let the rest run async (so the cluster doesn't stall when any single follower lags). Choosing sync, async, or semi-sync — and naming the loss window of whichever you pick — is the heart of the `topology-and-sync-chosen` check.

---

## Failover — the single most dangerous operation

When the leader dies, some follower must be promoted to take its place. **Failover is the #1 source of trouble in single-leader systems**, and the reason is instructive: *every step of it lands on an earlier enemy.* Failover is where the abstractions of STAGE 0 through STAGE 2 come to collect.

**Step 1 — decide the leader REALLY died.** This is the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) and the [slow-vs-dead ambiguity](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) in their purest form. You cannot *know* the leader is dead; you can only wait past a timeout and *decide* to treat it as dead. A timeout is a guess, never a fact — and getting this guess wrong is what sets up the catastrophe in step 3.

**Step 2 — choose which follower becomes the new leader.** You want the *most up-to-date* follower (the one that lost the fewest writes), but the surviving nodes must **agree** on which one that is — and agreeing on a single value despite stale views and no global clock is exactly the **consensus** problem (STAGE 4: *consistency & consensus*, Paxos/Raft). Leader election is consensus wearing a costume. For now, note only that this step is not free and not trivial; it needs a real agreement protocol underneath.

**Step 3 — fence the old leader, or get split-brain.** This is the most dangerous failure in the entire topology:

> **SPLIT-BRAIN.** The old leader didn't actually die — it was merely *slow* (step 1's guess was wrong, a false positive). It now revives, still believing it is the leader, and keeps accepting writes. Meanwhile the newly-promoted leader is *also* accepting writes. **Two leaders, both authoritative, both writing** — and the data **forks and corrupts** down two divergent histories that may be impossible to reconcile. The single authoritative write order, the whole virtue of single-leader, is destroyed.

The defense is **fencing**: lock the old leader out so it *cannot* keep writing even if it revives. Two mechanisms appear constantly — **STONITH** ("Shoot The Other Node In The Head," forcibly power off or isolate the suspected-dead node) and **fencing tokens** (every write carries a monotonically increasing token; the storage layer rejects any write bearing a token older than the highest it has seen, so a revived old leader's stale-token writes bounce). Fencing is what converts the unavoidable false-positive of step 1 from "two leaders corrupt the data" into "the wrong guess is harmless." A failover design without fencing is not a failover design; it is a split-brain waiting for a slow leader.

**Step 4 — accept that un-propagated async writes are lost.** If you were running async (or semi-sync), the writes the old leader acknowledged but never shipped are **gone** at cutover, as the trap above already warned. The discipline here is twofold: *acknowledge* the loss as a known consequence of the sync mode you chose, and — critically — **do not silently resurrect those writes later**. If the old leader comes back and its un-propagated writes are quietly merged back in, they can clobber writes the new leader has since accepted; that is a second, sneakier flavor of corruption. Discard them deliberately, or reconcile them through the same conflict-detection machinery you'd use for any concurrent writes (below) — never resurrect them by accident.

These four steps are the `failover-split-brain-guarded` check, and every one of them is an earlier enemy collecting its bill.

---

## Multi-leader — local writes, and conflicts in the flesh

In **multi-leader** replication, several nodes are each a leader: each accepts writes locally and replicates them to all the other leaders. You give up the single write order; in return you get genuinely independent write availability. The classic uses:

- **Multi-datacenter** — one leader per datacenter. Writes are served by the *local* leader (fast, no cross-ocean round-trip), and each datacenter keeps accepting writes even when the link between datacenters is down. The DCs reconcile when the link heals.
- **Offline-capable clients** — a device with a local database that accepts writes while offline is, in effect, its own leader. A calendar app you edit on a plane is multi-leader replication where one of the "leaders" is your phone.
- **Collaborative editing** — many users editing one document concurrently is the same shape: many writers, reconciled after the fact.

The core difficulty is the price of giving up the single order:

> **WRITE CONFLICTS.** Two leaders concurrently modify the same datum without having seen each other's change. This is precisely the [concurrent-versions](time-and-causality.md#what-these-are-for--conflict-detection-and-causal-consistency) problem from STAGE 2, no longer abstract: `write1 ∥ write2` — two writes with *neither* causally before the other — and **neither is authoritative.** You must decide what to do.

The options, in rough order of preference:

- **Avoid conflicts** — route every write for a given record to the *same* leader (e.g. shard the keyspace so each record has a "home" leader). If you can arrange this, it is the best answer: no conflict can arise because no two leaders ever own the same record at once. Most production multi-leader setups lean hard on conflict *avoidance* and treat real conflicts as the exception.
- **Last-write-wins (LWW)** — keep the write with the largest timestamp. Simple, and **it drops data**, and it leans on wall-clock comparison — which is exactly the [silent-data-loss trap](time-and-causality.md#the-classic-trap--ordering-by-timestamp-and-silent-data-loss) STAGE 2 forbade. Choose it only when the application can genuinely tolerate losing one of two concurrent writes, and choose it *knowing* it is lossy, never because you believe the timestamps give you a true order.
- **Application-level merge / CRDT** — keep both writes and merge them. A **CRDT** (Conflict-free Replicated Data Type) is a data structure designed so that concurrent updates *merge deterministically* — every replica, applying the same set of updates in any order, converges to the identical result with no coordination. CRDTs are how collaborative editors and shopping carts resolve conflicts without dropping anyone's change.

The throughline: multi-leader is where STAGE 2's "detect concurrency, don't clobber it" becomes a daily operational task, and it is half of the `conflict-and-lag-faced` check.

---

## Leaderless — quorums, read repair, version vectors

In **leaderless** replication (the Dynamo style — Cassandra, Riak, and friends), there is no leader at all. **The client sends each write to several replicas, and reads from several replicas**, and consistency is *tuned* rather than fixed. The knob is the **quorum**:

> Of **N** replicas, require **W** to acknowledge a write and **R** to respond to a read. As long as **W + R > N**, the set of replicas a write touched and the set a read touches **must overlap by at least one** — so any read is guaranteed to reach at least one replica that has the latest *successfully completed* write (this assumes a *strict* quorum — see the caveat below). A common setting is **N = 3, W = 2, R = 2** (`2 + 2 > 3`).

The overlap is what gives leaderless its consistency story without a leader: you don't need every replica to be current, you only need the read and write sets to intersect. Because not every replica gets every write synchronously, two background mechanisms pull the stragglers back into line:

- **Read repair** — when a read touches several replicas and notices one is stale, it writes the latest value back to the stale replica on the spot. Reads heal the data they touch.
- **Anti-entropy** — a background process that continuously compares replicas (e.g. via Merkle trees) and syncs any differences, so data that is rarely read still converges.

And concurrent writes are detected — not clobbered — exactly as STAGE 2 taught:

> **Concurrent write conflicts are detected with [version vectors](time-and-causality.md#vector-clocks--full-causality-at-a-price).** Two versions whose vectors are *incomparable* (each has a slot larger than the other) are a **genuine conflict** — concurrent writes, `∥`, neither a descendant of the other. The system keeps both as **siblings** and resolves them (merge / CRDT / hand to the application) rather than silently picking one. A version whose vector is strictly *less than* another's is simply an older ancestor and is safely superseded — no conflict.

Now the critical subtlety, the other half of the `conflict-and-lag-faced` check:

> **A quorum is NECESSARY, not SUFFICIENT.** `W + R > N` guarantees a read *set* overlaps a write *set* — it guarantees you will *read* a copy that saw the latest *committed* write. It does **NOT** guarantee that two *concurrent* writes didn't both reach the quorum. If two clients write the same key concurrently, both can satisfy `W` against overlapping-but-not-identical replica sets, and now multiple incomparable versions exist. The quorum got you a fresh read; it did **not** prevent the conflict. You still need version-vector conflict detection on top. Trusting the quorum alone to mean "no conflicts" is a standard, costly mistake.

And one more asterisk on the overlap itself: it holds only for a **strict** quorum. Dynamo-style systems also offer **sloppy quorums** with **hinted handoff** — when a partition cuts off the usual home replicas, `W` and `R` can be satisfied by *other* nodes standing in, so the read set and write set may not overlap at all. That trades the freshness guarantee away for availability: under a sloppy quorum a read can return stale data *even when* `W + R > N`. Strict quorum buys overlap; sloppy quorum buys uptime — know which one you've configured.

This quorum/lag material is also the **bridge to the consistency & consensus stage (STAGE 4)**: the moment you start tuning W and R, you are choosing a point on the CAP/PACELC trade-off, and "as strong as linearizable" vs "merely eventual" stops being hand-waving and becomes a named model. That stage makes it precise; this one hands it the vocabulary.

---

## Replication lag and its named anomalies

Under asynchronous replication a follower (or a not-yet-repaired leaderless replica) trails the leader by some interval — the **replication lag**. Read a lagging replica and you get one of three named, user-visible anomalies. Each one has a *name* because each motivated a specific *guarantee* invented to prevent it — and naming them is part of facing lag head-on rather than being ambushed by it.

| Anomaly | What the user sees | The guarantee that prevents it |
|---|---|---|
| **Read-your-writes** (read-after-write) | You submit a write, then read — and **don't see your own write** (your read hit a lagging replica that hasn't got it yet). | **read-your-writes consistency** — route a user's reads to a replica known to have their own writes. |
| **Monotonic reads** | You read a new value, then read again and get an **older** one — *time appears to move backward* (the second read hit a more-lagging replica than the first). | **monotonic reads** — pin a user to one replica, or never serve them a read older than one they've already seen. |
| **Consistent-prefix reads** | You see writes in a **different order than they were committed** — a *torn* prefix of the write history, e.g. an effect before its cause (the answer before the question, the reply before the message). Felt most sharply across partitions/shards, where independent write streams interleave. | **consistent-prefix reads** — every read reflects some *prefix* of the committed write order, so causally-related writes are never seen out of order. A special case **closely related to** the [causal consistency](time-and-causality.md#what-these-are-for--conflict-detection-and-causal-consistency) of STAGE 2 (honor happened-before, so a cause is never read after its effect) — not a synonym for it. |

These three are the everyday surprises that weak consistency hands you, and they are precisely why the *consistency & consensus* stage (STAGE 4) exists: a consistency model is, in the end, a *named promise about which of these anomalies cannot happen*. The engineering instinct to install: name the anomaly your application cannot tolerate, then buy *exactly* the guarantee that forbids it — no weaker (the bug ships) and no stronger (you over-pay in latency and availability).

---

## Eventual consistency — state it precisely, warn precisely

The default promise of every asynchronous / multi-leader / leaderless system is **eventual consistency**:

> **Eventual consistency:** *if writes stop, all replicas will EVENTUALLY converge to the same value.* That is the entire guarantee. It is a real and useful promise — it is what lets the system stay available during a partition and reconcile afterward — but it is far weaker than it sounds, and two warnings must travel with it every time.

- **"Eventually" has NO upper bound.** The convergence window is not specified — it could be milliseconds or, under a long partition, minutes or hours. Nothing in the word "eventually" promises *when*.
- **It promises NOTHING about reads during the convergence window.** While the replicas are still converging — which, given a steady write stream, is *always* — a read can return any of the un-converged values, including a stale one or one of several conflicting siblings.

> **Eventual ≠ strong.** A large and recurring class of bugs comes from developers reading "eventually consistent" as "consistent, just a moment later" and then writing code that assumes the read they're about to do reflects the write they just made. It does not. The read-your-writes / monotonic-reads / consistent-prefix anomalies above are *exactly* what "eventual" permits. If your code needs a stronger promise for a particular operation, you must **buy** it (route to a synchronous replica, pin the session, demand a quorum read, or escalate to the linearizable model the next stage names) — eventual consistency will not hand it to you for free. Not mistaking eventual for strong is the last clause of the `conflict-and-lag-faced` check.

---

## How the change is propagated

A brief but practical note on the mechanism the leader uses to ship a change to followers, because the choice has real coupling consequences:

- **Statement-based** — replicate the raw SQL/command (`UPDATE ...`). **Fragile**: any non-deterministic function — `NOW()`, `RAND()`, an auto-increment, a trigger with side effects — evaluates *differently* on each replica, so the copies silently **diverge**. Largely abandoned for this reason.
- **Write-ahead-log (physical) shipping** — replicate the storage engine's low-level WAL (the exact byte changes to disk pages). Faithful, but it **couples replication to the exact storage-engine version** — the follower must run a byte-compatible engine, which makes zero-downtime version upgrades painful.
- **Logical (row-based) log** — replicate a *logical* description of each row change (this row, these columns, these new values), decoupled from both the SQL surface and the storage internals. This is the **modern mainstream**: it survives engine-version skew, and — a major bonus — it doubles as **change data capture (CDC)**, a clean stream of "what changed" that downstream systems (search indexes, caches, data warehouses, analytics) can subscribe to. The replication log becomes a reusable event source.

The takeaway: prefer the logical log; it decouples the replicas and gives you CDC as a free side effect.

---

## The engineering posture

Close where the foundation told you we'd land. Replication is **redundancy** in [Cook's](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) sense — it lets the system run *degraded* and survive the loss of a component, which is the whole reason fault tolerance is the floor and not a feature. **But it introduces new failure modes that did not exist with one copy**: lost writes (async failover), split-brain (failover without fencing), and write conflicts (multi-leader, leaderless). That is *exactly* Cook's warning that **change introduces new ways to fail** — the redundancy that buys you survival also buys you a fresh catalog of corruption modes, and a replication design is correct only when it has named and guarded each one.

So choosing a topology is, at bottom, **a trade-off between simplicity and availability/locality:**

> **Single-leader buys SIMPLICITY** — one node defines a single authoritative write order, so there are no write conflicts to resolve, at the cost of a failover problem and a write bottleneck. **Multi-leader and leaderless buy AVAILABILITY and LOCALITY** — every site keeps writing through a partition, and writes are served close to the user, at the cost of *conflicts you must detect and resolve*. The deciding question is blunt: **can this application tolerate write conflicts and the lost writes of async failover?** If no, stay single-leader and pay for synchronous (or semi-sync) replication. If yes — or if availability/locality is non-negotiable — go multi-leader or leaderless and build the version-vector conflict detection to match.

That decision, and the named consistency model behind it (CAP/PACELC, linearizable→eventual), is the seam into the **consistency & consensus** stage (STAGE 4). This stage's job is done when the topology is chosen on purpose, the sync mode's loss window is named, failover is fenced, and conflicts and lag are faced rather than wished away.

---

## Anti-patterns and pre-flight checklist

Run this before calling a replication design correct. Each line is a failure this stage exists to prevent.

- **Conflating replication with sharding** — "we'll scale by adding nodes" without saying which. Adding *replicas* buys read capacity and fault tolerance, not write/storage scale; adding *shards* buys write/storage scale, not redundancy. Keep them distinct (they're orthogonal, usually combined).
- **Choosing a topology by default, not on purpose** — landing on multi-leader or leaderless without asking whether the application can tolerate the conflicts they make possible. Reach for single-leader first; give up its single write order only for a real availability/locality driver.
- **Believing asynchronous replication can't lose data** — a leader that crashes before propagating drops **already-acknowledged** writes. "The async follower is safe" is false. Name the loss window; run semi-sync or sync for data that can't be lost.
- **Failing over without fencing the old leader** — a slow-not-dead leader revives and you have **split-brain**: two leaders corrupting the same data. Fence it (STONITH / fencing tokens); a failover design without fencing isn't one.
- **Treating a failover timeout as a fact** — deciding the leader "is dead" is the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) guess, never a measurement; design for the false-positive (that's what fencing is for), and remember new-leader choice needs agreement (consensus, STAGE 4).
- **Silently resurrecting un-propagated writes** — quietly merging the old leader's lost writes back in after cutover, where they clobber writes the new leader has since accepted. Discard deliberately or reconcile through conflict detection; never resurrect by accident.
- **Resolving write conflicts with wall-clock last-write-wins, believed correct** — it silently discards one of two concurrent writes ([STAGE 2's data-loss trap](time-and-causality.md#the-classic-trap--ordering-by-timestamp-and-silent-data-loss)). Detect with version vectors; resolve with merge / CRDT / app-logic. If you choose LWW, choose it knowing it's lossy.
- **Trusting a quorum (W + R > N) to prevent conflicts** — overlap guarantees you *read* a fresh committed copy; it does **not** stop two concurrent writes from both landing. The quorum is necessary, not sufficient — concurrent writes inside it still need conflict detection.
- **Ignoring replication lag** — shipping read-your-writes / monotonic-reads / consistent-prefix bugs because reads hit a lagging replica. Name the anomaly the app can't tolerate and buy exactly the guarantee that forbids it.
- **Mistaking eventual consistency for strong** — "eventually" has no upper bound and says nothing about the read you're about to do. If an operation needs a stronger promise, buy it; eventual won't hand it over.
- **Statement-based replication for non-deterministic writes** — `NOW()`/`RAND()`/auto-increment diverge across replicas. Prefer the logical (row-based) log; it decouples the replicas and gives you CDC for free.

The engineering posture under every one of these: **replication makes the copies disagree, so a correct design is one that has named, detected, and resolved the disagreement at every point it can arise** — and has *not* pretended the redundancy came free of new failure modes. You are not preventing divergence; you are making it safe.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) (the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) behind the failover guess, the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess), [enemy 3](the-three-enemies.md#enemy-3--no-global-clock-no-global-state) behind stale copies, and [Cook's "change introduces new failure modes"](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) this stage closes on) · [communication.md](communication.md) (the [asynchronous channel](communication.md#delivery-semantics--the-direct-product-of-the-third-state) that makes copies diverge, plus [idempotency](communication.md#idempotency--the-headline-weapon) and the [reliable-remote-call recipe](communication.md#timeout-retry-backoff) the replication stream itself runs on, and the [schema evolution](communication.md#schema-and-contract-evolution) the replicated change must survive) · [time-and-causality.md](time-and-causality.md) (why [wall-clock LWW silently drops data](time-and-causality.md#the-classic-trap--ordering-by-timestamp-and-silent-data-loss), [version vectors](time-and-causality.md#vector-clocks--full-causality-at-a-price) for detecting concurrent writes, [partial vs total order](time-and-causality.md#partial-order-vs-total-order--the-load-bearing-takeaway) behind single-leader's free order, and the [causal consistency](time-and-causality.md#what-these-are-for--conflict-detection-and-causal-consistency) behind consistent-prefix reads) · [../SKILL.md](../SKILL.md) (STAGE 3 — Replication, the gated flight plan this reference serves; the **consistency & consensus** stage (STAGE 4) — CAP/PACELC, linearizability, Paxos/Raft, FLP — this quorum/lag/eventual material bridges to). Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — replication topology and CAP as a *design* choice, where the data lives) · **`stationkeeping`** (running it in production — failover drills, replication-lag monitoring, the on-call response when split-brain or a lost-write incident fires) · **`gauge`** (encoding "this value may be stale / this is a sibling set, not a single value" in the type so weak consistency can't be silently mistaken for strong) · **`plumb`** (keeping the version-vector and conflict-resolution plumbing legible) · **`assay`** (testing conflict resolution, failover, and lag behavior — the cases and the doubles) · **`flightline`** (the schema-evolution mechanics the replication / CDC stream must survive across versions).

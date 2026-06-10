# Partitioning / Sharding — splitting different data across nodes for scale

This reference is the depth behind **STAGE 5 — Partitioning / sharding** of the [../SKILL.md](../SKILL.md) flight plan. It is the stage where every earlier stage comes back at once — because a sharded system runs replication *and* consensus *inside every piece of itself*. The fact this whole stage hangs on, and the one you must install before any scheme is chosen:

> **When data is too big for one machine, or traffic too heavy for one node, you SPLIT it across nodes — that is partitioning (sharding). It is ORTHOGONAL to replication and used TOGETHER with it.** [Replication](replication.md#replication-is-not-sharding) is the **SAME** data copied to many nodes, for **fault tolerance**; partitioning is **DIFFERENT** data split across nodes, for **scale**. A real large-scale system is therefore a **2-D grid**: horizontally the data is split by key into shard 1 / shard 2 / shard 3, each holding *different* data; vertically each shard is itself replicated into a leader and followers. So **a single shard is itself a small replication cluster — [STAGE 3](replication.md) replication and [STAGE 4](consistency-and-consensus.md) consensus run again INSIDE every shard.** Hold that grid in your head; it is the picture the rest of the file decorates.

Partitioning answers exactly one driver — **scale**, the same first-law driver that justified crossing the machine boundary at all ([the-three-enemies.md](the-three-enemies.md#the-first-law--dont-distribute-until-you-must)): when no single box can *hold* the data or *serve* the write/storage load, you have no choice but to split it. Adding *replicas* multiplies read capacity and fault tolerance and does nothing for write or storage scale; adding *shards* does the reverse. Keeping that distinction sharp is the first thing the `partition-key-fits-access` check asks of you, and it is the seam back to [replication.md](replication.md#replication-is-not-sharding), which made the same point from the other side.

## Contents

- [Replication and partitioning — orthogonal, layered, both running at once](#replication-and-partitioning--orthogonal-layered-both-running-at-once)
- [Partition strategy — which shard does a key land on?](#partition-strategy--which-shard-does-a-key-land-on)
- [Skew and the hot key — hashing can't save you from a celebrity](#skew-and-the-hot-key--hashing-cant-save-you-from-a-celebrity)
- [Secondary indexes — the underrated pain](#secondary-indexes--the-underrated-pain)
- [Rebalancing — move the minimum, and keep a human in the loop](#rebalancing--move-the-minimum-and-keep-a-human-in-the-loop)
- [Request routing — the map is itself a consensus problem](#request-routing--the-map-is-itself-a-consensus-problem)
- [Cross-partition operations — the most painful part](#cross-partition-operations--the-most-painful-part)
- [The engineering posture](#the-engineering-posture)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## Replication and partitioning — orthogonal, layered, both running at once

Disambiguate this completely before choosing a scheme, because conflating the two muddles every later decision exactly as it did in [replication.md](replication.md#replication-is-not-sharding):

> **Replication** = many copies of the **SAME** data → **fault tolerance** (and read latency, read throughput). **Partitioning / sharding** = **DIFFERENT** data split across nodes → **scale** (write and storage capacity no single node can hold). They are **orthogonal** — independent choices on independent axes — and real systems **layer** them: shard the data into pieces, then replicate each piece.

The consequence is the grid above, and it is not a metaphor — it is the literal architecture of Cassandra, of a sharded MySQL fleet, of every horizontally-scaled store. Each shard is a replication cluster: it has a topology (single-leader / multi-leader / leaderless), it has the failover and split-brain hazards of [STAGE 3](replication.md#failover--the-single-most-dangerous-operation), and if it wants a fault-tolerant linearizable write order it runs the [consensus of STAGE 4](consistency-and-consensus.md#consensus--the-algorithmic-core) underneath. **Nothing you learned in the previous four stages is retired here; it is instantiated, once per shard.** When a design says "we'll scale by sharding," the first move is to confirm the team knows they are now operating *N* replication clusters, not one — and that every per-shard correctness question from STAGE 3 and STAGE 4 still has to be answered, inside each. This is the orthogonal-and-layered clause of `partition-key-fits-access`.

---

## Partition strategy — which shard does a key land on?

A partition strategy is just an answer to one question: **given a key, which shard owns it?** There are four answers in wide use, and they trade *scan efficiency* against *spread* against *rebalancing cost*.

| Scheme | How a key maps to a shard | The virtue | The hazard |
|---|---|---|---|
| **Range** | contiguous key intervals per shard (A–F here, G–M there) | efficient **range scans** — ordered keys, "find X..Y" hits a few shards | **hotspots** on a monotonic key |
| **Hash** | hash the key, then assign | **even spread**, no order-clustering | **range scans destroyed**; naive `mod N` is a rebalancing disaster |
| **Consistent hashing** | nodes and keys on a ring; key → next node clockwise | adding/removing one node moves only **~K/N** keys | more machinery; still no range scans |
| **Fixed partition count** | far more partitions than nodes, up front; assign partitions to nodes | rebalance moves **whole partitions**, never individual keys | you must pick the count well up front |

**Range partitioning** assigns each shard a contiguous interval of the keyspace. Its upside is real and specific: because keys stay *ordered*, a range query ("everything between X and Y") touches only the few shards that overlap the range — ideal for time-series and ordered data. Its downside is just as specific and is the classic trap:

> **A monotonic key on range partitioning manufactures a hotspot.** If the partition key is a timestamp (or an auto-increment id), then *all of today's writes* — every new write in the system — land on the single last shard, the one holding the newest interval. That shard melts while the others idle. The very ordering that makes range scans cheap is what funnels the write front onto one node.

**Hash partitioning** hashes the key first, then assigns the hash to a shard. Hashing destroys the order-clustering, so writes spread evenly across shards and the monotonic-key hotspot disappears. The price is symmetric: **range scans are destroyed** — adjacent keys now hash to scattered shards, so a range query must ask *every* shard and merge. And the most naive form is a rebalancing catastrophe:

> **`hash mod N` is a rebalancing DISASTER.** Map a key to `hash(key) mod N` where `N` is the node count, and the moment you add or remove a node `N` changes — so for almost *every* key the value of `hash(key) mod N` changes, and almost the entire dataset has to move at once. A single node join becomes a whole-cluster migration. This is the canonical thing not to do, and the next two schemes exist to avoid it.

**Consistent hashing** fixes the mass-migration nightmare. Map both the nodes and the keys onto a ring (a hash space wrapped into a circle); a key belongs to the *next node clockwise* from where it lands. The key property:

> **Adding or removing one node moves only the small neighborhood of keys around it (~K/N of the data), not all of it.** Because a node owns only the arc between itself and its predecessor, a join or departure disturbs one arc, not the whole ring. The catch with the *plain* ring is unevenness: one position per node means each owns one big arc, so a departure dumps its *entire* arc on a single successor and load comes out lopsided — which is the whole reason **virtual nodes** exist. Give each physical node many small arcs scattered around the ring and both problems close at once: distribution evens out, and a join/leave draws a fair ~K/N share from *many* nodes instead of clobbering one. (The ~K/N figure is really the vnode case.)

Two attributions worth getting right, because this is the single most-muddled corner of the topic. Classic consistent hashing (Karger et al.) underlies Amazon's original [Dynamo](replication.md#leaderless--quorums-read-repair-version-vectors) design — but production wide-column stores like **Cassandra** do *not* shuffle keys around a live ring. They give each node a *fixed* set of token ranges (its virtual nodes) and rebalance by moving **whole ranges**, which actually puts them in the **fixed-partition-count** family below. The two schemes converge in practice: virtual nodes are precisely what turns a ring into a fixed set of movable partitions, so "consistent hashing with vnodes" and "fixed partition count" are two names for nearly the same operational reality — both relocate whole partitions, never individual keys.

**Fixed partition count** is the route many production systems actually take, and it is the simplest to operate. Up front, create **far more partitions than nodes** (say 1000 partitions across 10 nodes), then assign partitions to nodes. On rebalance you **move whole partitions between nodes, never reassign individual keys** — a node that joins simply takes over some existing partitions wholesale. Elasticsearch and Couchbase work this way. The one judgment it demands is choosing the partition count well at the start: too few and you can't spread across future nodes; too many and each carries fixed overhead.

The throughline under all four — and the heart of `partition-key-fits-access` — is that the scheme is the *easy* half of the decision. The hard half is the **partition key itself**, and it is settled at the end of this file ([cross-partition operations](#cross-partition-operations--the-most-painful-part)), because you cannot choose it well until you have seen what cross-shard work costs.

---

## Skew and the hot key — hashing can't save you from a celebrity

Hashing spreads load evenly *on average*, and a beginner reads that as "hashing solves hotspots." It does not, and the gap is where production incidents live:

> **Hashing fixes order-clustering hotspots but NOT a single scalding key.** A celebrity account, a viral post, a runaway tenant — one key that takes a wildly disproportionate share of the load — **always hashes to the same shard**, so that one shard is hot no matter how good the hash. Hashing de-clusters *many* keys; it does nothing for *one* key that is hot all by itself.

There is no infrastructure-level fix; the only cure is **application-level intervention**:

> **Split the hot key deliberately.** Add a random prefix or suffix to the hot key (`celebrity_07`, `celebrity_42`, …) so its writes fan out across several shards instead of pounding one. The cost is paid on read: you must now **gather the fragments back together** — read all the splits and recombine — to reconstruct the logical key. You are trading a cheap read and a melted shard for a more expensive read and a survivable one. The split is done by the application, for the specific keys it knows are hot; it is not something the partitioner can do for you, because only the application knows which key is the celebrity.

And the deeper lesson, the one to carry past any single technique:

> **SKEW is the permanent enemy of partitioning.** Real load is almost always **power-law** — a few keys take most of the traffic — and the comfortable "uniform distribution" the math assumes rarely holds in production. Designing as if load were uniform is designing for a world you do not live in. Assume skew, find your hot keys, and plan the split *before* the celebrity arrives, not during the incident.

This skew material is the first half of `skew-and-secondary-indexes-handled`.

---

## Secondary indexes — the underrated pain

The partition key decides where each record *lands*. That is fine until you need to query by a field that is **not** the partition key — a secondary index — and then a genuine, unavoidable trade-off opens up. There are two ways to build a secondary index across shards, and **neither is free**:

| | **Local index** (document-partitioned) | **Global index** (term-partitioned) |
|---|---|---|
| Where the index lives | each shard indexes only **its own** data | the index is partitioned **by the indexed term** |
| Write cost | **cheap** — done locally, on the same shard as the row | **expensive** — one write may touch index partitions on **other** nodes |
| Read by the indexed field | **scatter-gather** — ask every shard, merge | **efficient** — go straight to the shard holding that term |
| The catch | every secondary-index read fans out across all shards | the cross-node index update is usually **async → the index LAGS** |

> **A LOCAL (document-partitioned) index keeps writes cheap but makes the read SCATTER-GATHER across every shard.** Each shard indexes only the documents it holds, so a write updates one shard's index locally — fast. But a query *by* that index has no idea which shards hold matches, so it must ask **all** of them and merge the results. The write is local; the read fans out.

> **A GLOBAL (term-partitioned) index makes reads efficient but writes expensive, cross-shard, and lagging.** The index itself is partitioned by the indexed term, so a read goes straight to the one shard holding that term — efficient. But a single document write may have to update index partitions sitting on **other** nodes, and that cross-node update is usually done **asynchronously** to keep the write fast — so the index **lags** the data, and a read can miss a just-written value.

The choice is forced and it is real: **fan out across all shards on READ (local), or update across shards on WRITE (global, with lag).** There is no option that is cheap on both sides; pick the one whose expensive side your workload can afford. This is the second half of `skew-and-secondary-indexes-handled`.

---

## Rebalancing — move the minimum, and keep a human in the loop

When nodes are added or removed, or data simply grows, partitions must be **moved** to re-even the load. The goals are three, and they pull gently against each other:

- **move as LITTLE data as possible** (which is exactly why `hash mod N` is forbidden and consistent-hashing / fixed-count exist);
- **stay online during the move** (rebalancing is a background operation, not a maintenance window — which means the data movement must be *throttled* so it does not starve foreground reads and writes; the move-drags-the-system-slower dynamic the cascade below weaponizes is the same one a throttle holds back);
- **distribute fairly** (no shard left carrying double).

The blunt anti-pattern is the `hash mod N` mass migration already named. But there is a subtler, more dangerous trap here — and it is [Cook's warning that *change introduces new failure modes*](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) made literal:

> **Fully-automatic rebalancing wired to fully-automatic failure detection is a cascade waiting to fire.** A node that is merely **slow** — [STAGE 0's slow-vs-dead ambiguity](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess), the third state in the flesh — gets *misjudged as dead* by the automatic detector. That triggers automatic rebalancing, which starts moving a **huge** amount of data off the "dead" node. The data movement drags the already-strained system **slower**, which makes *more* nodes look slow-hence-dead, which triggers *more* rebalancing — an avalanche. One slow node plus two automatic mechanisms equals a [Cook cascade](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp): a disaster assembled from a single degraded component and a structure that amplifies the degradation.

The defense is deliberately *not* more automation:

> **Keep a HUMAN IN THE LOOP for rebalancing.** Automatic failure detection can flag a suspect node; automatic rebalancing can *prepare* a plan; but a human confirms before the cluster starts shoveling terabytes across the network on the strength of a timeout that was only ever a [guess](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess). The whole point of STAGE 0 was that you cannot distinguish slow from dead — so wiring the most expensive possible reaction (mass data movement) directly to the least reliable possible signal (a failure-detection timeout) is precisely the mistake the foundation warned against.

This rebalancing material is the first part of `rebalance-and-routing-safe`.

---

## Request routing — the map is itself a consensus problem

Once data is spread across shards, every request faces a question: **"which node holds the key I want?"** Someone has to know the **partition → node mapping**, and the mapping *changes* every time rebalancing moves a partition. There are three standard places to put that knowledge:

- the **client asks any node**, which knows the map and forwards (or replies with a redirect) — no extra infrastructure, but an extra hop and every node must carry the map;
- a **dedicated routing tier** sits in front and routes — one place to update when the map changes, but a component you now have to run and keep available;
- the **client knows the map directly** and talks straight to the owning node — fewest network hops, but every client must learn the map and track its changes.

These differ in where the lookup happens, but they all depend on the same thing being true, and that is the load-bearing observation:

> **The routing map is cluster METADATA that must be kept CONSISTENT — so it is itself a CONSENSUS problem.** The partition→node mapping is a single source of truth that every router reads and that changes under rebalancing; if two routers disagree about who owns a partition, requests go to the wrong node and writes can split. So the map is exactly the kind of "agree on the one true config" problem that [reduces to consensus](consistency-and-consensus.md#consensus--the-algorithmic-core), and it is typically stored in a coordination service — **ZooKeeper or etcd** — which keeps it consistent by [running consensus underneath](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap). **Consensus, which you met as the heart of STAGE 4, reappears here a second time** — not for the data, but for the metadata that tells you where the data lives.

This is the moment the grid closes on itself: consensus runs *inside* each shard (to order that shard's writes if it wants linearizability) **and** *above* all the shards (to agree on the routing map). The same primitive, two altitudes. Knowing the routing map is consensus-backed metadata is the second part of `rebalance-and-routing-safe`.

---

## Cross-partition operations — the most painful part

Operations that touch a **single** shard are easy — they are just operations on one (replicated) node, with everything STAGE 3 and STAGE 4 gave you. **Cross-shard** operations are where partitioning hurts, and there are two flavors:

> **Cross-shard JOIN.** The two sides of a join live on different shards, so the data must be **shuffled** — moved between nodes over the network — before it can be joined. Analytics engines (Spark, Presto, BigQuery) shuffle routinely and it scales fine for throughput-bound batch work; the killer is the **low-latency request path**, where an online query cannot afford a network shuffle. This is *exactly why* OLTP-sharded systems **denormalize**: you duplicate related data so that the things joined together already live on the same shard, trading storage and write-time duplication for the avoided shuffle.

> **Cross-shard TRANSACTION.** An atomic transaction that touches multiple shards needs **distributed-transaction coordination** — two-phase commit (**2PC**), a later stage this file only points to, never specifies. It is slow, it is fragile, and it **sacrifices availability** (a coordinator or participant failure can leave the transaction stuck). This is why everyone works hard to keep a transaction **within a single shard**, where it is just an ordinary local transaction.

Both flavors converge on the single most consequential decision in the whole stage:

> **Choose the partition key so the operations you care most about stay WITHIN one shard.** Put data that is *accessed together* on the *same* shard; align the partition key with the **access pattern**. This is the one decision that everything else pays for: choose the key well and your hot joins and hot transactions are single-shard and cheap; choose it badly and **every** later query and transaction pays the cross-shard tax — a shuffle here, a 2PC there — for the life of the system. The scheme (range / hash / consistent-hashing / fixed-count) is a detail next to this; the *key* is the architecture.

This is the substance — and the name — of `partition-key-fits-access`: the scheme *and* the key chosen to fit the access pattern, so the operations that matter stay single-shard, and cross-shard joins and transactions are minimized by construction. It is also the last part of `rebalance-and-routing-safe` (minimize the cross-shard work).

---

## The engineering posture

Close on the stance, because the schemes are not the deliverable — the judgment about the key is.

> **The whole art of partitioning is to spread load AND data evenly WHILE keeping related data together — and these two goals FIGHT.** Even spread pushes you toward hashing, which scatters related keys across shards; keeping related data together pushes you toward co-location, which clusters load. The balance point is not universal — it **depends entirely on your access pattern**. So the partition key must be chosen to *follow* the read/write pattern you actually have, never picked at random or for tidy uniformity.

That is why this stage sits where it does, after replication and consensus: a sharded system *is* a grid of replicated, consensus-ordered clusters with a consensus-backed map on top, and getting it right means getting every earlier stage right *per shard* and then getting the one new thing — the partition key — right *across* shards. The later stages connect directly: **distributed transactions & coordination** (2PC/Saga, the thing a cross-shard transaction needs) and **fault tolerance** build on top of this grid. holdfast's job here is to make the partition key a *chosen, justified* decision that fits the access pattern — before the first shard is provisioned and the wrong key is set in concrete.

For an agent the lever is the suite's usual one: it will reach for a hash partition on whatever id is handy because hashing "spreads evenly" and reads like the safe default — never feeling the cross-shard join it just guaranteed on the query that matters, the celebrity key it left unsplit, or the `hash mod N` migration it signed the cluster up for. So the partition scheme and key must be **judged and gated**, not trusted to instinct. The architectural call of *whether* to shard at all, and where the data should live, belongs to `load-bearing`; running the sharded cluster in production — rebalancing operations, hot-shard incidents, the on-call response when a celebrity arrives — belongs to `stationkeeping`. holdfast names the *distributed* failure modes and routes the fix.

---

## Anti-patterns and pre-flight checklist

Run this before calling a partitioning design correct. Each line is a failure this stage exists to prevent.

- **Conflating partitioning with replication** — sharding splits *different* data for **scale**; replication copies the *same* data for **fault tolerance**. They are orthogonal and layered; each shard is itself a replicated cluster running STAGE 3/4 inside it. Adding shards buys write/storage scale, not redundancy. (`partition-key-fits-access`)
- **Choosing the scheme before the key** — the scheme (range / hash / consistent-hashing / fixed-count) is the easy half; the **partition key**, chosen to fit the access pattern, is the architecture. (`partition-key-fits-access`)
- **A monotonic partition key on range partitioning** — a timestamp or auto-increment sends *every* new write to the last shard; that shard is your hotspot. (`partition-key-fits-access`)
- **`hash mod N` partitioning** — adding or removing one node remaps almost every key, a whole-cluster migration. Use **consistent hashing** (~K/N keys move) or a **fixed, large partition count** (move whole partitions). (`partition-key-fits-access`)
- **Believing hashing cures hotspots** — it de-clusters *many* keys but a single hot key (a celebrity, a viral post) still maps to one shard. Split the hot key with a random prefix/suffix and re-gather on read. (`skew-and-secondary-indexes-handled`)
- **Assuming uniform load** — real load is **power-law**; skew is the permanent enemy. Design for the celebrity before it arrives, not during the incident. (`skew-and-secondary-indexes-handled`)
- **Ignoring the secondary-index tax** — a **local** (document-partitioned) index scatter-gathers every read across all shards; a **global** (term-partitioned) index makes writes cross-shard and lagging. There is no free option; pick the side your workload can afford. (`skew-and-secondary-indexes-handled`)
- **Rebalancing by `hash mod N`, or moving more than the minimum** — rebalance should move the **least** data, stay online, and distribute fairly. (`rebalance-and-routing-safe`)
- **Fully-automatic rebalancing wired to automatic failure detection** — a merely-**slow** node ([slow-vs-dead](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess)) read as dead triggers a mass data move that drags the system slower and **cascades**. Keep a **human in the loop** for rebalancing. (`rebalance-and-routing-safe`)
- **Forgetting the routing map is consensus-backed metadata** — the partition→node map changes under rebalancing and must stay consistent across routers; it lives in a coordination service (ZooKeeper / etcd) that runs **consensus**. Consensus reappears. (`rebalance-and-routing-safe`)
- **Designing for cross-shard joins and transactions** — a cross-shard join needs a **shuffle** (denormalize and co-locate instead); a cross-shard transaction needs **2PC** (STAGE 7) that is slow, fragile, and sacrifices availability. Choose the key so the operations you care about stay **single-shard**. (`rebalance-and-routing-safe` / `partition-key-fits-access`)

The engineering posture under every one of these: **partitioning makes load and data spread, so a correct design is one whose partition key follows the real access pattern** — keeping related data together and the hot operations single-shard, while spreading the rest evenly — and that has named the cost (skew, the secondary-index tax, the rebalancing cascade, the cross-shard tax) at every point it can arise. You are not eliminating skew or cross-shard work; you are choosing the key that makes them survivable.

---

**Cross-links:** [replication.md](replication.md) ([replication is not sharding](replication.md#replication-is-not-sharding) — same data copied for fault tolerance vs different data split for scale, the orthogonal-and-layered grid where each shard is its own replicated cluster; the [single-leader write order](replication.md#single-leader--one-place-defines-write-order), [failover and split-brain](replication.md#failover--the-single-most-dangerous-operation), and [leaderless quorums](replication.md#leaderless--quorums-read-repair-version-vectors) that run again *inside* each shard) · [consistency-and-consensus.md](consistency-and-consensus.md) (the [consensus](consistency-and-consensus.md#consensus--the-algorithmic-core) the routing map reduces to and the [quorum/cluster machinery](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) ZooKeeper/etcd run it on — consensus reappears, above the shards and inside them) · [the-three-enemies.md](the-three-enemies.md) (the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) and [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) behind the rebalancing cascade, [Cook's "change introduces new failure modes"](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) the cascade embodies, and the [first law](the-three-enemies.md#the-first-law--dont-distribute-until-you-must) — scale is the driver that justifies sharding at all) · [../SKILL.md](../SKILL.md) (STAGE 5 — Partitioning / sharding, the gated flight plan this reference serves). Later stages build directly on this grid: **fault tolerance** (STAGE 6) and **distributed transactions & coordination** (STAGE 7 — 2PC/Saga, what a cross-shard transaction needs, kept single-shard until then). Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — *whether* to shard at all, where the data lives, the partition key as a *design* choice) · **`stationkeeping`** (running the sharded cluster in production — rebalancing operations, hot-shard and skew incidents, the on-call response when a celebrity key melts a shard) · **`gauge`** (encoding "this read scatter-gathers / this index may lag / this key is a hot-key split" in the type so the cross-shard cost can't be silently forgotten) · **`plumb`** (keeping the routing and hot-key-split plumbing legible) · **`assay`** (testing rebalancing, scatter-gather reads, and cross-shard behavior — the cases and the doubles) · **`flightline`** (the routing-metadata / partition-map schema evolution the consensus-backed control plane must survive across versions).

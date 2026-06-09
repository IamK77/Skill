# Consistency & Consensus — the heart: how much agreement, at what price

This reference is the depth behind **STAGE 4 — Consistency & Consensus** of the [../SKILL.md](../SKILL.md) flight plan. It is the heart of the whole subject, the place every earlier stage was bending toward, and the single place where a *word* will trip you before any mechanism does. So the file opens not with an algorithm but with a disambiguation, because the most common consistency bug is committed in plain English, before a line of code is written.

> **"Consistency" is a badly overloaded word with at least three different meanings, and conflating them is where everyone trips.** (1) **ACID's C** — a single transaction preserves an application invariant (the books balance, the foreign key holds); this is *not a distributed concept at all*. (2) **CAP's C** — specifically and only **linearizability**. (3) The **consistency-model spectrum** — the rules for what a read is allowed to observe (linearizable → sequential → causal → eventual). This file is about (2) and (3). Keep them ruthlessly apart from ACID-C; the moment you let them blur, you will "solve" a distributed problem with a database transaction, or demand linearizability when you meant a business invariant.

With that landmine disarmed, the through-line of the whole stage is one chain you should be able to recite: *strong consistency requires **consensus**; consensus requires a **majority quorum** whose liveness requires **timing assumptions**; under a partition the minority cannot reach a majority, so a strong-consistency system goes unavailable there — which is exactly **CAP**.* Everything below builds that chain and then earns the right to say its consequence: **"how strong a consistency, at what cost?" is the same question as "how much coordination, paid for in availability-under-partition and latency-always?"**

## Contents

- [The three "consistency"s, untangled](#the-three-consistencys-untangled)
- [The consistency spectrum — strong to weak](#the-consistency-spectrum--strong-to-weak)
- [Linearizability is not serializability](#linearizability-is-not-serializability)
- [CAP, stated correctly — and the misreadings killed](#cap-stated-correctly--and-the-misreadings-killed)
- [PACELC — the trade-off CAP omits](#pacelc--the-trade-off-cap-omits)
- [Consensus — the algorithmic core](#consensus--the-algorithmic-core)
- [FLP — why no perfect consensus exists, and how real systems live anyway](#flp--why-no-perfect-consensus-exists-and-how-real-systems-live-anyway)
- [Paxos vs Raft — the shared skeleton](#paxos-vs-raft--the-shared-skeleton)
- [Quorums and cluster sizing — the concrete mechanism of CAP](#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap)
- [The whole thing in one line](#the-whole-thing-in-one-line)
- [The engineering posture](#the-engineering-posture)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## The three "consistency"s, untangled

Before the spectrum, finish the disambiguation, because each of the three lives in a different world and routes to a different fix.

| Sense | What it means | Whose problem |
|---|---|---|
| **ACID-C** | One transaction takes the database from one valid state to another — it preserves the application's invariants. | Single-node transaction isolation; **not distributed**. It is really a property of the *other* three ACID letters doing their job. |
| **CAP-C** | **Linearizability** specifically — the system behaves as one copy, respecting real-time order. | The narrow recency guarantee CAP forces you to trade against availability. |
| **The model spectrum** | A named promise about *what a read may observe* — how stale, how out-of-order. | The everyday choice this stage exists to make. |

The point is not pedantry. It is that **ACID-C is unrelated to distribution** — you can have it on a single machine, and having it tells you nothing about whether two replicas agree — while CAP-C and the spectrum *are* the distributed question. When a design doc says "we need consistency," the first move is always: *which of the three?* This naming is the first half of the `consistency-model-chosen` check.

---

## The consistency spectrum — strong to weak

A consistency model is a contract between the system and the reader: *given the writes that have happened, which values is a read allowed to return?* The models form a **gradient**, strongest at the top, and the single most useful way to hold them is: **stronger = more like a single machine.**

> **Linearizability** — the strongest. The system behaves as if there is **only one copy** of the data; every operation appears to take effect **atomically at a single instant** somewhere between its call and its return; and that instant **respects real (wall-clock) time** — once a write *completes*, every read that *begins* afterward, in real time, MUST see it (or a later value). This is what people mean by "strong consistency." It is the model that lets you reason about a distributed store as if it were a variable in a single program.

> **Sequential consistency** — all operations appear in *some* single total order, and that order is consistent with **each process's own program order** (the order each client issued its own operations). But it is **NOT required to match real time**: if two clients on two machines issue operations, sequential consistency may order them in a way no wall clock would agree with, as long as each client's own operations keep their relative order. Strictly weaker than linearizable — it manufactures *a* total order, just not the *real-time* one.

> **Causal consistency** — operations that are **causally related** (the [happened-before](time-and-causality.md#the-key-mental-shift--happened-before) relation from STAGE 2) are seen by everyone in their causal order; **concurrent** operations may be seen in different orders by different observers. You will never see a reply before the message it answers; you may see two unrelated posts in either order. The load-bearing fact: **causal consistency is the strongest model still achievable under a network partition** — it is the natural sweet spot, far cheaper than linearizable, far stronger than eventual, and it is *defined* in terms of the partial order STAGE 2 built.

> **Eventual consistency** — replicas converge eventually *if writes stop*; in between, no guarantee of order or freshness. The default of asynchronous / multi-leader / leaderless systems, treated in full in [replication.md](replication.md#eventual-consistency--state-it-precisely-warn-precisely): "eventually" has **no upper bound**, and it promises **nothing** about the read you are about to do.

The rule that ties the gradient together, and the load-bearing takeaway of the entire spectrum:

> **Stronger = more like a single machine = easier to program, but more expensive. Weaker = cheaper and more available, but you must handle the anomalies yourself.** The craft is therefore not "pick the strongest you can afford" — it is **pick the WEAKEST model that is still correct for your use case.** Too weak and the bug ships (you read stale data and act on it); too strong and you over-pay, permanently, in latency and availability for a guarantee the application never needed. Each step down the spectrum hands you back some performance and some uptime in exchange for an anomaly you now have to design around on purpose.

This is the substance of `consistency-model-chosen`: name the model explicitly, justify it as the weakest one that is still correct, and know exactly which step on the gradient you are standing on and what the step below would have cost you.

---

## Linearizability is not serializability

A second high-frequency confusion, every bit as costly as the ACID one, because the two words rhyme and both feel like "the strong one":

> **Linearizability ≠ serializability.** **Serializability** is a *transaction* isolation property: a set of multi-operation transactions appears to execute in *some* serial order, one after another. **Linearizability** is a *single-object* recency property: a single operation respects *real-time* order. They are **orthogonal** — they constrain different things. Serializability says nothing about *which* serial order (it need not match real time); linearizability says nothing about *transactions* (it is about one object at a time).

| | **Serializability** | **Linearizability** |
|---|---|---|
| About | multiple **transactions** (isolation) | a single **object/operation** (recency) |
| Guarantees | *some* serial order exists | respects **real-time** order |
| Cares about real time? | **No** | **Yes** |
| The "C" it is | a database **isolation** level (the I in ACID, really) | **CAP's C** |

Having **both** is **strict serializability** — transactions appear to run in a serial order *and* that order respects real time. It is the strongest practical guarantee a distributed transactional store can offer, and the most expensive. The takeaway to keep next to the ACID one: **linearizability, serializability, and ACID-C are three different guarantees** — neither of the first two is the third — and a design that wants "consistency" must say which it means. This is the last clause of `consistency-model-chosen`.

---

## CAP, stated correctly — and the misreadings killed

CAP is the most-cited and most-misquoted result in the field. Stated correctly it is small and sharp:

> **When a network partition (P) occurs, you must choose between Consistency (C — here meaning *linearizability*) and Availability (A — every request gets a non-error response).** That is the whole theorem. It is a statement about *one specific bad moment* — a partition — and a forced choice during it.

Now kill the misreadings, because the pop version ("pick two of three") gets every part wrong:

- **It is NOT "pick two of three."** A partition is not a property you opt into or design away — it is something the network *does to you*. The network is unreliable ([enemy 2](the-three-enemies.md#enemy-2--the-unreliable-asynchronous-network)); partitions **will** happen. So you are not choosing among three menus labelled CP, AP, and CA. **CA is simply not an option for a real distributed system** — to "choose CA" is to claim partitions never occur, which is false. The real, narrower choice is: **when a partition happens, do you give up C or A?** That is CP vs AP, and only those two.
- **CAP's C and A are very narrow.** C is *linearizability* specifically, not "consistency" in any looser sense; A is *every request to a non-failed node gets a response*, a strict definition. Casual usage means much weaker things by both words.
- **CAP says nothing about the normal, partition-free case.** The theorem is silent the entire time the network is healthy — which is *almost always*. A system can be "CP" and still be making a consistency-vs-latency trade every single millisecond of normal operation that CAP does not even mention. That silence is the gap PACELC fills.

So the honest reading: **CP** means *under a partition, the minority side stops answering rather than return possibly-stale data* (it sacrifices availability to keep linearizability); **AP** means *under a partition, every side keeps answering, accepting that the answers may diverge* (it sacrifices linearizability to keep availability). Both keep serving when the network is healthy; CAP only describes their behavior when it breaks. Choosing CP vs AP *with eyes open*, and never reaching for the phantom CA, is the first half of `cap-pacelc-faced`.

---

## PACELC — the trade-off CAP omits

Because CAP is silent on the normal case, the more complete statement is **PACELC** (Abadi):

> **If Partition (P) → choose Availability (A) or Consistency (C); ELSE (E, normal operation) → choose Latency (L) or Consistency (C).** The first clause *is* CAP. The second clause is the part CAP omits and the part you live in almost all the time: **even with no partition, stronger consistency must be bought with higher latency.**

Why is there a latency cost with no partition at all? Because **coordination has a cost.** To guarantee a read sees the latest write — linearizability — the nodes must *talk to each other and wait*: a write must reach a quorum before it is acknowledged, a read may have to confirm it isn't stale against other replicas. That round-trip is latency, and it is there in perfect weather, not just during failures. A system can be **PC/EC** (consistent under partition, consistent-and-slower in normal operation — e.g. a Spanner-style or Raft-backed store), **PA/EL** (available under partition, low-latency in normal operation — e.g. Dynamo-style), or other combinations; the letters name the two distinct trades.

The deep truth, the sentence the whole stage rests on:

> **Coordination has a cost.** Strong consistency *requires* coordination, and coordination shows up two ways: as **lost availability under partition** (the minority can't coordinate, so it can't serve), and as **lost latency the rest of the time** (you must coordinate and wait on every operation). You never buy consistency once; you pay for it on every request, forever, in one currency or the other.

Naming PACELC's else-branch — that you are paying latency for consistency *even when nothing is broken* — is the second half of `cap-pacelc-faced`. It is the most common blind spot: teams accept the partition trade and then forget they are also paying, continuously, in the normal case.

---

## Consensus — the algorithmic core

Everything above describes *what* guarantee you want. **Consensus** is the algorithm that *produces* the strong end of it. It is the heart of the heart.

> **Consensus is getting a group of nodes to agree on a value (or a sequence of values) despite node failures and an asynchronous network.** That is the whole problem statement, and it is brutally hard precisely because of the two conditions: nodes can crash mid-agreement, and the network can delay messages without bound, so you can never be sure who is alive.

Why it is *the* core primitive, not one tool among many — because an enormous list of distributed problems all **reduce to consensus**:

- **leader election** (agree on who is leader) — recall [failover's "pick the new leader"](replication.md#single-leader--one-place-defines-write-order) needed exactly this;
- **total-order broadcast** (agree on one order for all messages);
- **distributed locks** (agree on who holds the lock);
- **atomic commit** (agree to commit or abort across nodes);
- **configuration / metadata** (agree on the one true cluster config);
- **replicated state machines** (agree on the log of operations every replica applies).

> **A *fault-tolerant* linearizable system is built on a consensus core.** When you want the strong end of the spectrum *and* it must survive node failure, underneath it there is always an agreement protocol manufacturing the single total order that "behaves like one copy" requires. (A single node is trivially linearizable — it just isn't fault-tolerant; the moment you replicate for availability, you need consensus to keep the copies acting like one.) Strong consistency is not a thing you switch on — it is a thing you *build*, on consensus.

A consensus protocol must satisfy three properties:

- **Agreement** — all nodes that decide, decide the *same* value. (No two correct nodes disagree.)
- **Validity** — the decided value was actually *proposed* by some node; consensus can't invent a value out of thin air. (A companion safety property, *integrity*, adds that each node decides **at most once** and never flip-flops — kept separate, not folded in here.)
- **Termination** — every correct node *eventually* decides. (Liveness — it doesn't hang forever.)

Hold onto that split: **agreement and validity are *safety* (nothing bad ever happens); termination is *liveness* (something good eventually happens).** The next section is about why that split is not academic.

---

## FLP — why no perfect consensus exists, and how real systems live anyway

The foundational impossibility result, and the reason consensus is genuinely hard rather than merely fiddly:

> **FLP impossibility (Fischer, Lynch, Paterson, 1985):** in a **purely asynchronous** system where **even one node may crash**, there is **NO deterministic consensus algorithm guaranteed to terminate.** Not "no efficient one" — no *correct-and-always-terminating* one at all.

The intuition is one you already own. It is exactly the [slow-vs-dead ambiguity](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) — [enemy 1](the-three-enemies.md#the-third-state--the-spine-of-everything) meeting [enemy 2](the-three-enemies.md#enemy-2--the-unreliable-asynchronous-network). You cannot distinguish a crashed node from a merely-slow one, because delay is unbounded and silence never proves death. So any deterministic protocol can be forced, by an adversarial schedule of "just slow enough" messages, to wait forever for a node that might be about to speak — it can never safely give up on it. The third state, formalized: there is no perfect failure detector, so there is no protocol that always decides. FLP is the slow-vs-dead keystone turned into a theorem about agreement.

Here is the elegant part — how real systems sidestep FLP without violating it:

> **Safety is ALWAYS preserved; liveness is only guaranteed under timing assumptions.** Real consensus algorithms **never decide two different values and never decide a wrong one** (agreement and validity hold *unconditionally*, even during arbitrary network chaos). What they cannot promise unconditionally is *termination* — but they recover it *in practice* with two moves: (a) **partial synchrony** — assume the network is *usually* timely and use **timeouts** to make progress, accepting that during a bad spell the protocol merely *waits* rather than deciding wrong — and decides again the moment the network is timely; and (b) **randomization** — make a random choice so the adversary can't construct the one schedule that blocks forever, terminating with probability 1.

The crucial reframe, and the tie back to [Cook](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp): **safety is a system property you never trade away; liveness is the thing that degrades under bad conditions.** A correct consensus system, during a partition or a storm of delays, does not corrupt — it *stalls*. It would rather make no progress than make wrong progress. That is the right shape for a safety-critical primitive: when in doubt, wait. Understanding that real algorithms keep safety always and obtain liveness only under timing assumptions is a core clause of `consensus-used-well`.

---

## Paxos vs Raft — the shared skeleton

Two algorithms dominate. They are different in presentation and identical in essence.

| | **Paxos** (Lamport) | **Raft** (Ongaro & Ousterhout) |
|---|---|---|
| Designed for | being *correct* (and provably so) | being *understandable* |
| Reputation | famously hard to grasp and to implement right | deliberately approachable; the teaching default |
| Structure | a subtle protocol of proposers/acceptors | an explicit **leader** + **terms** + **log** |
| Used in | Chubby, Spanner, many internal Google systems | etcd, Consul, CockroachDB, TiKV, and many more |

**Raft**, because it is the one you will read, in brief: the cluster elects a single **leader** (using monotonically increasing **terms** plus **randomized election timeouts** — the randomization breaks symmetry so two candidates rarely split the vote and stall); the leader takes **all** writes and replicates its **log** to the followers; an entry is **committed once a majority** of nodes have stored it; if the leader dies, a follower whose log is at least as up-to-date wins a new election and continues. Note that the randomized timeout is the same trick as the [retry jitter](communication.md#timeout-retry-backoff) from STAGE 1 — randomization to de-synchronize a crowd that would otherwise collide.

Their shared skeleton is what you should actually remember, because once you see it, "consensus" stops being magic:

> **Majority quorum + leader/term + replicated log.** (1) A **majority quorum** — any decision needs more than half the nodes, and the reason it works is that **any two majorities must intersect** in at least one node, so a value committed by one majority is *seen* by the next, which is what gives you agreement. (2) A **leader** within a numbered **term** serializes proposals so there is one order, not a free-for-all. (3) A **replicated log** is the agreed sequence of operations every node applies in the same order. Put together: **consensus is, in essence, building a fault-tolerant linearizable replicated state machine** — and you can now see why the single-leader topology's "one node defines the write order" was [lightweight consensus](replication.md#single-leader--one-place-defines-write-order) all along, just without the fault-tolerant election underneath.

The intersection-of-majorities argument is the same idea as leaderless replication's [quorum overlap `W + R > N`](replication.md#leaderless--quorums-read-repair-version-vectors) — STAGE 3's quorum *prefigured* the majority you meet here. The difference is that consensus uses the overlap to agree on a *sequence of decisions over time*, not just to make one read see one write.

---

## Quorums and cluster sizing — the concrete mechanism of CAP

This is where consensus reconnects, mechanically, to CAP — the bottom of the through-line chain.

Consensus needs a **majority alive and able to communicate** to make any decision. Three consequences fall straight out:

- **Use odd-sized clusters (3, 5).** A cluster of `n` tolerates **⌊(n−1)/2⌋** failures while keeping a majority. A 3-node cluster tolerates 1 failure; 5 tolerates 2. An *even* size buys nothing: 4 nodes also tolerate only 1 failure (you need 3 for majority either way) while adding cost and a slightly higher chance of an even split — so 4 is strictly worse than 3, and 6 worse than 5. Always go odd.
- **Bigger clusters are *more* fault-tolerant but *slower*.** Every decision waits for a majority to acknowledge, so more nodes means a larger quorum to wait on — more coordination, more latency. This is PACELC's else-branch made concrete: the consistency the cluster provides is paid for, on every write, in the round-trip to a majority.
- **Under a partition, the minority cannot assemble a majority → it cannot make progress.** This is the concrete mechanism that closes the loop:

> **A consensus cluster split by a partition keeps the majority side alive and freezes the minority side.** The minority literally cannot collect enough votes to commit anything, so it stops accepting writes rather than fork the log — *sacrificing availability on that side to preserve consistency.* **That is choosing CP, implemented.** CAP is not an abstract law the system "obeys"; it is the direct, visible behavior of "you need a majority and a partition denied you one." The minority side waiting it out *is* the C-over-A choice, in code.

Knowing the majority requirement, the odd-sizing, the ⌊(n−1)/2⌋ fault tolerance, and that the minority stall *is* CP — completes `consensus-used-well`.

---

## The whole thing in one line

Now collapse the entire stage into the chain promised at the top, each link mechanical:

- **Linearizability (strong consistency) requires consensus** — to behave like one copy you need an agreed single total order, and agreeing on that order *is* consensus.
- **Consensus requires a majority quorum** (so any two decisions intersect and agree), and its **liveness requires timing assumptions** (FLP forbids guaranteed termination otherwise — safety always, liveness under partial synchrony).
- **Under a partition the minority can't reach a majority → can't make progress → a strong-consistency system is unavailable on the minority side.** That is **CP**, and it is **the concrete mechanism of CAP.**
- Therefore **"how strong a consistency, at what cost?" = "how much coordination, paid for in availability-under-partition + latency-always?"** The two questions are *the same question*.

And the call-backs that make this stage the culmination of the cut, not a fresh topic:

- [Enemy 1's](the-three-enemies.md#the-third-state--the-spine-of-everything) slow-vs-dead is the **root of FLP** — the impossibility is the third state proved as a theorem about agreement.
- From [time-and-causality.md](time-and-causality.md#partial-order-vs-total-order--the-load-bearing-takeaway): **linearizability is "pretend a single real-time total order exists"; consensus is the machinery that "manufactures an agreed-upon total order"; causal consistency is "calmly embrace the partial order."** This stage is STAGE 2's partial-vs-total-order question, finally priced.
- From [replication.md](replication.md): single-leader's one write order is [lightweight consensus](replication.md#single-leader--one-place-defines-write-order), and the leaderless [quorum `W + R > N`](replication.md#leaderless--quorums-read-repair-version-vectors) prefigured the **majority** you build consensus on; [eventual consistency](replication.md#eventual-consistency--state-it-precisely-warn-precisely) is simply the bottom of the spectrum this file ranks.

---

## The engineering posture

Close on the stance, because the algorithms are not the deliverable — the judgment is.

> **Don't hand-roll consensus.** It is extraordinarily easy to get subtly wrong in exactly the details that matter — the corner of a partition, the moment of an election, the fencing of a deposed leader. Use **etcd**, **ZooKeeper**, or a **mature Raft/Paxos library**. A consensus protocol you wrote yourself is a split-brain or a lost-commit waiting for the one interleaving you didn't test (and recall from [the foundation](the-three-enemies.md#the-third-state--the-spine-of-everything) that the bug only appears under the rare interleaving — you will not catch it by re-running the test).

> **Use consensus sparingly.** It is expensive: coordination latency on every decision, and a reachable majority as a hard precondition. Apply it where you genuinely need a **single source of truth** — leader election, configuration, metadata, atomic commit, the cluster's control plane — and run the **data plane** on weaker, cheaper models wherever the application can tolerate them. A system that routes *everything* through consensus has bought linearizability for data that only needed causal or eventual, and it pays for that mistake on every request.

> **And always: choose the weakest consistency model that is still correct for your case.** That single instinct subsumes the whole stage. It forces you to name the model (which of the three "consistency"s, which step on the spectrum), to face the trade honestly (CP vs AP, and the latency you pay in the else-branch), and to reach for the expensive coordination of consensus only where weaker would actually be wrong.

For an agent the lever is the suite's usual one: it will reach for "strongly consistent" by reflex because that is what feels safe and reads like a single machine, never feeling the latency tax in the else-branch or the minority stall under partition — and it will cheerfully attempt to hand-roll a lock or an election that is subtly broken. So this judgment must be **gated**, not trusted to instinct. The architectural decision of *whether* this system should pay for strong consistency at all — CAP as a *design* choice, where the source of truth lives — belongs to `load-bearing`; running the consensus cluster in production (etcd/ZooKeeper operations, quorum-loss incidents, election storms) belongs to `stationkeeping`. holdfast's job is to make sure the model is *chosen*, the trade *faced*, and the consensus *used well* — before any of them are operated.

---

## Anti-patterns and pre-flight checklist

Run this before calling a consistency/consensus design correct. Each line is a failure this stage exists to prevent.

- **Conflating the three "consistency"s** — solving a distributed agreement problem with an ACID transaction, or demanding linearizability when you meant an application invariant. Say which of ACID-C / CAP-C / the model spectrum you mean *first*. (`consistency-model-chosen`)
- **Picking a consistency model by default, not on purpose** — landing on "strongly consistent" because it felt safe, or "eventually consistent" because it felt fast, without naming the model or justifying it as the **weakest still correct**. Stronger is not better; it is more expensive. (`consistency-model-chosen`)
- **Confusing linearizability with serializability** — single-object real-time recency vs multi-transaction isolation; orthogonal guarantees (both together = strict serializability), and neither is ACID-C. (`consistency-model-chosen`)
- **Reading CAP as "three-choose-two" (and thinking CA is achievable)** — partitions are not optional, so CA is a fantasy; the only real choice is **CP vs AP** *when a partition happens*. (`cap-pacelc-faced`)
- **Assuming consistency is free as long as there's no partition** — PACELC's else-branch: coordination costs **latency even in normal operation**. You pay for strong consistency on every request, forever, not just during failures. (`cap-pacelc-faced`)
- **Hand-rolling a consensus or leader-election protocol** — notoriously easy to get subtly wrong in the partition/election corners; use etcd / ZooKeeper / a mature Raft library. (`consensus-used-well`)
- **Reaching for strong consistency everywhere** — consensus is expensive (a reachable majority + coordination latency on every decision); reserve it for the control plane (leader, config, metadata, atomic commit) and run the data plane on weaker, cheaper models. (`consensus-used-well`)
- **Running a consensus cluster with an even number of nodes** — no better fault tolerance than the odd size below it, plus a needless split risk and added latency; use **3 or 5**. (`consensus-used-well`)
- **Expecting consensus to *guarantee* termination** — FLP forbids it in an asynchronous system where a node may crash. Real algorithms keep **safety always** and get **liveness only under timing assumptions** (partial synchrony) or randomization; under a bad partition a correct system **stalls**, it does not corrupt. (`consensus-used-well`)
- **Forgetting the minority stall is CP, implemented** — when a partition denies the minority a majority and it stops serving, that *is* the C-over-A choice, not a bug. Treating it as an outage to "fix" by letting the minority write anyway is how you manufacture split-brain. (`consensus-used-well`)

The engineering posture under every one of these: **consistency is coordination, and coordination is never free** — so a correct design has *named* the weakest model that is still correct, *faced* the CP-vs-AP and latency-vs-consistency trades with eyes open, and *spent* consensus only where a single source of truth is genuinely required. You are not buying agreement once; you are choosing, deliberately, how much to pay for it on every operation for the life of the system.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) (the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) and the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) that are the **root of FLP**, [enemy 2](the-three-enemies.md#enemy-2--the-unreliable-asynchronous-network) — partitions are **not optional** — and [Cook's safety-as-a-system-property](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) that consensus's safety-always/liveness-under-timing embodies) · [time-and-causality.md](time-and-causality.md) ([happened-before / causal order](time-and-causality.md#the-key-mental-shift--happened-before) behind causal consistency, [partial vs total order](time-and-causality.md#partial-order-vs-total-order--the-load-bearing-takeaway) — linearizability manufactures the total order, consensus is how, causal embraces the partial — and the lesson that [a total order costs coordination](time-and-causality.md#partial-order-vs-total-order--the-load-bearing-takeaway)) · [replication.md](replication.md) ([single-leader as lightweight consensus](replication.md#single-leader--one-place-defines-write-order), the [quorum `W + R > N`](replication.md#leaderless--quorums-read-repair-version-vectors) prefiguring the **majority**, and [eventual consistency](replication.md#eventual-consistency--state-it-precisely-warn-precisely) as the bottom of this spectrum) · [communication.md](communication.md) (the [randomized backoff/jitter](communication.md#timeout-retry-backoff) that Raft's randomized election timeout reuses) · [../SKILL.md](../SKILL.md) (STAGE 4 — Consistency & Consensus, the gated flight plan this reference serves; the **final** stage of the foundation+replication+consensus cut). Forthcoming stages build directly on this: **sharding** (consensus and replication reappear *inside each shard*), **fault tolerance**, and **distributed transactions & coordination** (2PC/Saga, leader election, distributed locks, ZooKeeper/etcd — all of which *build on* consensus). Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — CAP as a *design* choice, where the single source of truth lives, how strong a consistency the system should pay for at all) · **`stationkeeping`** (running the consensus cluster in production — etcd/ZooKeeper operations, quorum-loss and election-storm incidents, the on-call response when the minority stalls) · **`gauge`** (encoding "this read is linearizable / this one may be stale" in the type so a weak guarantee can't be silently mistaken for a strong one) · **`plumb`** (keeping the consensus and quorum plumbing legible) · **`assay`** (testing consistency under partition — Jepsen-style, the cases and the doubles) · **`flightline`** (the config/metadata-schema evolution the consensus-backed control plane must survive across versions).

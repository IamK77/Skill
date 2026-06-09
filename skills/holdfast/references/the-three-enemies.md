# The Three Enemies — the foundation every later stage is derived from

This reference is the must-be-told foundation behind **STAGE 0 — Frame** of the [../SKILL.md](../SKILL.md) flight plan. It is the key that makes every later stage *derivable* rather than memorized: once you hold the three enemies and the **third state** in your head, idempotency, retries, timeouts, delivery semantics, and causal ordering stop being a grab-bag of tricks and become the obvious answers to a single question. Read this first; the rest of holdfast assumes it.

It backs the two STAGE 0 checks — `distribution-justified` (the first law) and `failure-model-named` (accept the third state for *this* system) — but its real job is to install one mental model so thoroughly that you cannot write single-machine code over a network boundary by reflex again.

The governing definition, restated because every claim below is judged against it:

> **A distributed system is a set of independent computers that fail independently, talk over an unreliable asynchronous network, and share no clock and no memory — trying to behave, to the outside, like ONE reliable machine.** Leslie Lamport's working definition is sharper still: *a distributed system is one in which the failure of a computer you did not even know existed can render your own computer unusable.* That is the whole problem in one sentence — your correctness now depends on machines you cannot see, cannot trust, and cannot reach reliably.

---

## The first law — don't distribute until you must

Before any of the hard material below: **the cheapest distributed bug is the one you avoided by not distributing.** A single strong machine is *dramatically* simpler, and the simplicity is not a matter of degree — it is categorical. One machine silently hands you three guarantees that distribution destroys all at once (the next section names them). So the first decision is not *how* to distribute but *whether*, and the bar is high.

You cross the line only when a real driver forces it:

| Driver | The forcing condition |
|---|---|
| **Scale** | Data or traffic genuinely exceeds what one machine (vertically scaled as far as it goes) can hold or serve. |
| **Availability** | The business cannot tolerate a single point of failure — one box dying must not take the service down. |
| **Latency** | Users are physically too far from one location; you need to be near them (multi-region, edge). |
| **Inherently distributed** | The problem itself spans sites — multiple data centers, devices, organizations, or independent teams that must integrate. |

Everything hard in the rest of this file — partial failure, the unreliable network, the absent global clock, the third state — is the **bill** for crossing that line. Distributing for fashion (microservices because the conference talk said so) pays that bill in full and buys nothing. This is the suite's recurring posture — *by scale and risk, not by fashion* — aimed at the machine boundary; it is `load-bearing`'s **Monolith-First** and **CAP-as-a-design-choice** material, and the architecture decision (monolith vs services, where the boundaries fall, what the CAP trade buys) **routes to `load-bearing`**, not here. holdfast's concern starts the moment you *have* crossed the line and must now stay correct on the other side.

---

## The organizing spine — three gifts, three roots, five facets

Here is the tidy way to hold the whole subject. A single machine silently gives you **three "shared" gifts**, and you never notice them because you never lacked them:

- **Shared fate** — when the machine fails, *everything* on it fails together, at once, and you find out immediately.
- **Shared clock** — every part of the program reads the same monotonic notion of "now," so "before" and "after" are unambiguous.
- **Shared memory** — any part can read the true, current state of any other part by reading a variable.

**Distribution removes all three gifts simultaneously.** Remove them and you get the **three enemies**:

```
single machine gives:        distribution removes it, yielding:
  shared fate         ──►      ENEMY 1  partial failure   (parts fail while others serve)
  shared clock        ──►      ENEMY 3a no global time     (no shared "now")
  shared memory       ──►      ENEMY 3b no global state    (no node knows the whole truth)
```

Two more facets are not separate roots — they fall out of *how* the gifts are removed:

- The medium that replaces shared memory is **the network**, and the network's unreliability is what manufactures the **third state** (next section). This is the source of enemy 2.
- The actors are now **independent**, running at once with no shared clock to order them, which produces **concurrency and non-determinism**.

So: **five facets, three roots.** Partial failure, the unreliable async network, no global clock/state are the roots; the third state and concurrency/non-determinism are what those roots produce when they interact. Hold the three gifts and you can re-derive the rest at any time.

---

## Enemy 1 — partial failure

On one machine, **failure is all-or-nothing.** The process is up or it is down. It is *fail-stop*: when it dies it stops cleanly, you learn at once (your call returns an error, the process exits), and everything dies together — there is no state where half your program is alive and serving while the other half is dead and you don't know which.

Cross to distribution and that guarantee is gone. **Some parts fail while the rest keep serving** — one replica crashes, one disk fills, one link flaps — and, the sharper half:

> **The survivors usually cannot tell who failed.** From inside node A, a dead node B and a slow node B and a fine node B behind a broken link all look *identical* — silence. There is no system-wide "B is down" signal; there is only A's local, possibly-wrong, possibly-stale belief about B.

This is **the defining trait of distributed systems** — not one item on a list of difficulties, but *the* thing that makes them a different kind of object from a single program. Every other technique in holdfast exists because partial failure is real and undetectable from the outside.

It also reframes what "running" means. Richard Cook's *How Complex Systems Fail* is the on-ramp here: **a complex system runs degraded as its constant background state.** At any instant in a real distributed system some node is slow, some disk is dying, some link is dropping packets — and the system serves correctly *anyway*, because it was built to tolerate exactly that. Partial failure is not an exceptional event you handle and return to normal; **partial failure IS normal.** Fault tolerance is therefore not a feature you bolt on — it is the floor you build on. (The Cook framing gets its full treatment at the end of this file; running the degraded system in production — SRE, chaos engineering, incident response — **routes to `stationkeeping`**.)

---

## Enemy 2 — the unreliable, asynchronous network

The network connecting your nodes makes none of the promises your function calls make. It will, at arbitrary times, do all of the following:

- **Delay** a message — with **no upper bound.** This is what *asynchronous* means precisely: there is no maximum delivery time, so "no reply yet" never proves "no reply coming." A message can arrive after you have given up on it.
- **Lose** a message entirely.
- **Duplicate** a message — deliver the same one twice.
- **Reorder** messages — deliver B before A though you sent A first.
- **Partition** — split the network so two groups of healthy nodes cannot reach each other while each keeps running.

The arbitrary, unbounded delay is the cruel one, because it is what makes enemy 2 collide with enemy 1. Consider the most ordinary thing in the world — you send a request and **no reply comes back.** What happened?

```
   A  ──── request ────►  B
   A  ◄ ?? (silence) ???  B
```

Four cases are *indistinguishable* from A's seat:

| # | What actually happened | Did the operation execute? |
|---|---|---|
| 1 | The request never arrived (lost on the way out). | **No.** |
| 2 | It arrived; B is processing it slowly (still alive). | Not yet — but it *will*. |
| 3 | It executed; the **reply** was lost on the way back. | **Yes — it already happened.** |
| 4 | B died (before, during, or after executing). | **Unknown.** |

A sees the same thing — silence — in all four. **This ambiguity cannot be removed.** No protocol, no cleverness, no faster network erases it; an asynchronous network with unbounded delay makes cases 2, 3, and 4 permanently confusable from the outside.

And notice the trap baked into cases 2 and 3: **the operation may already have executed.** So a *blind retry* can double the effect — charge the card twice, ship the order twice, decrement the inventory twice. The retry is not wrong *in principle*; it is wrong *unless the operation is safe to repeat.* This single observation is the seed of the entire next stage — **idempotency, delivery semantics (at-most / at-least / effectively-once), timeouts, and retry discipline are precisely the tools for coping with an ambiguity you cannot eliminate.** Those mechanics live in [communication.md](communication.md); this file's job is only to make you *feel* why they are not optional.

---

## Enemy 3 — no global clock, no global state

This enemy is two faces of the same loss — shared clock and shared memory gone.

**No global clock.** Every machine has its own quartz oscillator, and they all **drift** (run slightly fast or slow) and are **skewed** (set to slightly different values). NTP corrects them but leaves tens of milliseconds of residual error and — worse — can step a clock *backward*. So **there is no shared "now."** Two events on two machines stamped `12:00:00.000` did not necessarily happen at the same instant, and an event stamped earlier did not necessarily happen first. The consequence is concrete and silently destructive: ordering cross-machine events by wall-clock timestamp, and especially **wall-clock last-write-wins**, drops data with no error — the "loser" write is discarded though it may be the one you wanted. This is the entire reason [time-and-causality.md](time-and-causality.md) exists, and the lesson it installs: order by **causality**, not by the clock.

**No global state.** No node knows the instantaneous, true state of the whole system, because:

> **By the time information about node B reaches node A, it is already stale.** It describes B as B *was* when the message left, one network delay ago — and B may have changed since. You are always looking at light from a star that may already be gone.

So you can **never decide on "the current state of the system"** — there is no such observable thing. You can only ever decide on a **possibly-stale local view.** Every "is the cluster healthy?", "is this lock free?", "who is the leader?" is answered against a snapshot that was already out of date when you read it. This is the ground beneath replication and consistency (both **forthcoming** stages): all of consistency is, in the end, a set of rules about *how stale* a view a reader is allowed to see.

---

## The keystone — where enemies 1 and 2 meet: a timeout is a guess

Stand enemy 1 (you cannot tell *who* failed) next to enemy 2 (the network can delay without bound) and they fuse into the single hardest fact in distributed systems:

> **You cannot distinguish "slow" from "dead."** A node that is alive but slow and a node that is dead both produce the same observable — silence that goes on. Since delay has no upper bound, no amount of waiting *proves* death.

Which means **a timeout is a guess, not a fact.** When you set a deadline and the node misses it, you have not *measured* that it is dead — you have *decided* to treat it as dead, and you might be wrong. The error is two-sided and you cannot escape both:

- **Timeout too short** → you declare healthy-but-slow nodes dead. These are **false positives**, and they are dangerous: the "dead" node is still running and serving, so now two nodes think they are in charge (**split-brain**), or the work gets done twice (**duplicate effects**).
- **Timeout too long** → you react slowly to *real* deaths; requests pile up behind a corpse, latency spikes, resources leak.

There is no setting that is right in both directions, and the deeper reason is a theorem, not a missing optimization:

> **There is NO perfect failure detector in an asynchronous system.** You cannot build a mechanism that always correctly and promptly distinguishes a crashed node from a slow one when message delay is unbounded. This is a fundamental limit of the model. (It connects to the **FLP impossibility result** — that no deterministic protocol can guarantee consensus in an asynchronous system if even one node may crash — which gets its proper treatment in the **forthcoming** fault-tolerance / consensus block. For now: stop looking for the perfect timeout. It does not exist.)

The engineering consequence is that timeouts, heartbeats, and failure detectors are all *best-effort heuristics tuned for a particular blast radius*, and every design must assume its failure detector will sometimes be wrong — which is, again, why idempotency and retries (coping with "I acted on a guess that was wrong") are the load-bearing tools.

---

## The third state — the spine of everything

Everything above converges on one reframe, and it is the single most important idea in this skill. Make it the lens you read all distributed code through.

> **A single-machine operation has TWO outcomes: success or failure. Cross a network and a THIRD appears — "I do not know."** The unanswered request, the slow-vs-dead node, the lost reply, the partitioned peer — these are not separate problems. They are all faces of the **third state**: an operation whose outcome you genuinely cannot determine. Success and failure are both *answers*; the third state is the *absence of an answer*, and it is permanent, not transient.

Now the load-bearing observation about how this hurts you:

> **Single-machine code has NO branch for "I do not know."** Every `try/except`, every `if err != nil`, every `Result<T, E>` encodes a two-valued world: it worked, or it threw. There is no syntax, no habit, and no instinct for "the call returned nothing and I cannot find out whether it ran." **Most distributed bugs grow in that missing branch** — the code assumes silence means failure (and retries something that already happened), or assumes the absence of an error means success (and proceeds on an operation that never ran).

Concretely, the bug is almost always one of these two reflexes:

```python
# REFLEX A — treat the third state as failure, then blindly retry.
resp = call(charge_card, amount)   # times out -> we got the third state
if resp is None:
    call(charge_card, amount)      # BUG: it may have SUCCEEDED the first time. Double charge.

# REFLEX B — treat the absence of a thrown error as success.
call(ship_order, id)               # returns without raising
mark_shipped(id)                   # BUG: a lost reply, not a confirmation. May have never shipped.
```

Both are single-machine code wearing distributed clothes. The cure is never "make the third state go away" — you cannot. The cure is to **give the missing branch a real implementation**, and that is exactly what every later technique does:

| Technique (later stages) | The answer it gives to "I do not know" |
|---|---|
| **Idempotency** | "Make the operation safe to repeat, so I can retry into the unknown without fear." |
| **Delivery semantics** | "Decide *in advance* whether duplicates or losses are the acceptable failure here." |
| **Timeout + bounded retry + backoff** | "Bound how long I wait on the unknown, and how hard I probe it." |
| **Idempotency key / dedup** | "Recognize the repeat so the second attempt is a no-op." |
| **Reconciliation / read-back** | "When in doubt, go *look* at the real state rather than assume." |

So here is the test for any distributed code you write or review: **find the place a remote call returns, and ask — what does this code do when the answer is "I don't know"?** If the answer is "there is no such branch; it assumes one of the two clean outcomes," you have found the bug, or the place the next bug will be. Every gate in holdfast is, underneath, a way of forcing that branch to exist.

---

## Concurrency and non-determinism — the fifth facet

The actors in a distributed system run **independently and at the same time**, with no shared clock to order them. So events **interleave in an enormous number of possible orders**, and the same inputs can produce **different results** on different runs depending on which interleaving and which failures happened to occur. The system is *non-deterministic* in a way a single-threaded program is not.

The worst consequence is not the wrong answer — it is *how* the wrong answer hides:

> **Distributed bugs are emergent and non-reproducible.** A bug appears only under a *specific* combination of timing + interleaving + partial failure — node B crashes in exactly the 40-millisecond window after it committed but before it acked, while a partition heals at exactly that moment. You cannot hit that combination by running the test again, because the next run takes a different interleaving. The bug is real, rare, and invisible to ordinary testing.

This is precisely why distributed systems are so hard to test, and why the field invented heavier tools — **chaos engineering** (inject failures in production to surface the cascades), **deterministic simulation testing** (run the whole system on a controllable virtual clock so an interleaving can be replayed), and **Jepsen-style** consistency testing under partition. Note the routing carefully: the **testing craft** — designing the cases, choosing the doubles, property-based and characterization tests — **routes to `assay`**; the **production chaos practice** — running game days, failure injection, incident response on a live system — **routes to `stationkeeping`**. holdfast's job is to make you *expect* emergent non-reproducible failure, so you design for it instead of being ambushed by it.

---

## The eight fallacies of distributed computing

Peter Deutsch and colleagues (Sun, 1990s) catalogued the eight assumptions that programmers carry over from one machine and that the network punishes. Each is a single-machine truth that is **false over a network**:

1. **The network is reliable.** (It loses, duplicates, reorders, partitions — enemy 2.)
2. **Latency is zero.** (A remote call is orders of magnitude slower than a local one.)
3. **Bandwidth is infinite.** (It is finite and shared; large payloads and chatty calls saturate it.)
4. **The network is secure.** (It is a hostile, observable medium.)
5. **Topology doesn't change.** (Nodes come and go; routes shift; addresses move.)
6. **There is one administrator.** (Many hands, many configs, many versions deployed at once.)
7. **Transport cost is zero.** (Serialization, bandwidth, and infrastructure all cost.)
8. **The network is homogeneous.** (Mixed hardware, OSes, protocols, and versions.)

**Do not memorize the list.** The list is not the point — the *generator* of the list is. Every fallacy is the same mistake: **an assumption that is silently, freely true on one machine, carried over to a place where it is false and expensive.** So the durable lesson is a habit, not a recitation:

> **Whatever is "obvious" or "free" on a single machine is usually false — and costly — over a network.** When a design feels obviously fine, the reflex to train is: *which single-machine assumption am I leaning on, and does it survive the network?*

---

## The Cook framing — the intellectual on-ramp

Richard Cook's *How Complex Systems Fail* is the perfect way into distributed thinking because it describes, for any complex system, exactly the world the three enemies create. Four of its claims map straight onto this skill:

- **Complex systems run in a degraded mode as their normal state.** There is never a moment when *everything* is healthy. This is enemy 1 made into a worldview — partial failure is the background, not the exception.
- **Catastrophe requires multiple failures — disasters are cascades of several aligned faults, so there is no single "root cause."** The single-root-cause story is **hindsight bias**: after the fact you trace one clean line, but in truth a slow node *and* a too-aggressive retry *and* a healed partition *and* a stale cache aligned. (This is why a *retry storm* — naive retries hammering a struggling service into a dead one — is a Cook cascade, covered in [communication.md](communication.md).)
- **Safety is an emergent, system-level property, not a property of any component.** No single node is "the safe one"; safety is produced by how the parts behave *together* under failure. You cannot make a distributed system correct by making each node correct in isolation.
- **Operators always act on incomplete, ambiguous information.** This is **enemy 3 stated as an operational fact** — no one ever has the true global state; every decision, human or automated, is made against a possibly-stale local view.

Two routings fall out. First, this is the intellectual source of **blameless postmortems** — if there is no single root cause and everyone acted on incomplete information, blame is both wrong and useless; the practice lives in the SE suite (**`stationkeeping` / husbandry**), not here. Second, Cook is the *on-ramp*, not the destination: it tells you the world is degraded, cascading, emergent, and partially-observed — and the three enemies tell you *mechanically why*, so you can design against it.

---

## The engineering posture — the throughline for every later block

End on this, because it is the stance the whole skill is built to install. The three enemies are not bugs to fix or limits to be lifted by a cleverer protocol. They are **properties of reality** once you cross the machine boundary — permanent, and not negotiable.

> **You cannot eliminate these realities. You can only design AROUND them.** Embrace asynchrony instead of pretending calls are instant. Assume partial failure is *always happening* and build to serve through it. Replace the nonexistent "global truth" with **explicit protocols** that make a defined, weaker guarantee you actually understand.

That sentence is the seed of every forthcoming stage. Each major distributed technique is one disciplined answer to the same question — *in this world, how do we keep ourselves safe?*

- **Replication** (forthcoming) — answers partial failure: keep copies so the death of one node does not lose the data or the service.
- **Consistency & consensus** (forthcoming) — answers no-global-state: agree on a shared decision *despite* stale views and no global clock (CAP/PACELC, linearizable→eventual, Paxos/Raft, FLP).
- **Sharding** (forthcoming) — answers scale: split the data so no one node must hold it all.
- **Fault tolerance & coordination** (forthcoming) — answer the third state and concurrency: detect failure as best you can, elect leaders, hold locks, and make progress when nodes disagree.

And the foundation cut you have *now* is the first layer of that posture: **frame** (this file — justify distributing, name the failure model, accept the third state), **[communication.md](communication.md)** (talk reliably on top of the third state — idempotency, delivery semantics, retry discipline), and **[time-and-causality.md](time-and-causality.md)** (order by causality, never the wall clock).

For an agent the lever is exactly the one the rest of the suite names: it writes code that assumes the network is reliable, a retry is free, and a timestamp orders the world — and it feels none of the future 3 a.m. page that proves otherwise. So this model must be **judged and gated**, not trusted to instinct. The version that has a branch for "I do not know" is the one that ships.

---

## Anti-patterns (use as a STAGE 0 pre-flight checklist)

- **Distributing before you must** — no real driver among scale / availability / latency / inherently-distributed; a single strong machine was the right answer and was simpler by a category, not a degree.
- **No branch for "I do not know"** — code written as if a remote call has two outcomes (success / failure); the third state is unhandled, and that missing branch is where the bug is.
- **Treating "slow" as "dead" (or vice versa)** — acting on a timeout as if it were a measured fact; no design accounts for the failure detector being wrong (false positives → split-brain / duplicate work).
- **Blind retry into the unknown** — retrying an operation that may already have executed (cases 2 and 3), with no idempotency to make the repeat safe → double effects.
- **Assuming silence means failure** — concluding "no reply" = "didn't happen," when the reply may simply have been lost on the way back.
- **Assuming no-error means success** — proceeding as if a returned call confirms the effect landed, when the confirmation could have been lost.
- **Ordering cross-machine events by the wall clock** — leaning on synchronized time that does not exist; wall-clock last-write-wins silently drops data (depth in [time-and-causality.md](time-and-causality.md)).
- **Deciding on "the current global state"** — reading a cluster-wide truth that is not observable; every cross-node view is already stale when you read it.
- **Carrying a single-machine assumption over the network** — any of the eight fallacies; the tell is a design that feels "obviously fine."
- **Expecting distributed bugs to reproduce** — relying on rerunning a test to catch an emergent timing+interleaving+failure bug that only one rare interleaving exposes (route testing to `assay`, chaos to `stationkeeping`).
- **Trying to eliminate the enemies instead of designing around them** — hunting for the protocol or the perfect timeout that makes partial failure / unbounded delay / stale state go away. They do not go away. Build the explicit, weaker guarantee instead.

---

**Cross-links:** [communication.md](communication.md) (the next stage — idempotency, delivery semantics, timeout/retry/backoff, the depth behind *how* you cope with the third state) · [time-and-causality.md](time-and-causality.md) (enemy 3 in depth — why the wall clock can't order events and how causality does) · [../SKILL.md](../SKILL.md) (the gated flight plan this foundation serves — STAGE 0 Frame). Sibling skills this file routes to: **`load-bearing`** (the architecture decision — monolith vs services, module boundaries, CAP as a *design* choice) · **`stationkeeping`** (running the degraded system in production — SRE, chaos engineering, incident response, blameless postmortems) · **`gauge`** (the code-level type signal and boundary validation that gives the third-state branch teeth) · **`plumb`** (code craft and legibility) · **`assay`** (testing distributed behavior — the cases, doubles, and property tests) · **`flightline`** (message-schema and API evolution mechanics across independently-deployed versions).

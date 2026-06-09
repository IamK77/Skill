# Time & Causality — ordering events without a clock you can trust

This reference is the depth behind **STAGE 2 — Ordering** of the [../SKILL.md](../SKILL.md) flight plan. It picks up exactly where [the-three-enemies.md](the-three-enemies.md) left off: enemy 3 is *no global clock and no global state*, and [communication.md](communication.md) has just made every message **asynchronous** — it can be delayed, dropped, and **reordered**. The moment messages can arrive out of order, a question that was free on one machine becomes a real, hard problem: **who happened first?** This file is the formal answer. Its single thesis is that you cannot recover the objective "real order" of events across machines, so you stop asking for it — you track the **causal order** you *can* know for certain, and you treat "concurrent" not as an error to suppress but as a real state to detect and resolve.

The governing fact this whole stage hangs on, inherited from [the-three-enemies.md](the-three-enemies.md) and restated because every mechanism below is judged against it:

> **There is no global clock. Each machine reads its own clock; no two of those clocks agree; and the network gives you no way to compare a reading on one machine with a reading on another. "What time is it, really?" has no answer a distributed system can act on. So the wall clock is not a source of truth for ordering — treat it as a liar, not a reference.**

---

## Why physical clocks cannot order cross-machine events

A computer keeps time with a **quartz oscillator** — a crystal that ticks at a nominal frequency. No two crystals are identical: each runs slightly fast or slightly slow, and that error changes with temperature and age. Two facts fall out of this, and both are fatal to naive ordering:

- **Drift** — a single machine's clock gains or loses time against true time at its own rate (typically tens of ppm — seconds per day if uncorrected).
- **Skew** — at any given instant, two machines' clocks read **different values**. Skew is what kills cross-machine ordering: the same wall-clock number means a different real instant on every host.

**NTP** (and PTP) bound the damage by periodically syncing a machine's clock to a reference, but synchronization is not agreement. NTP leaves a **residual error** — best case a few milliseconds on a quiet LAN, **tens of milliseconds or worse** across a jittery WAN, because the protocol must estimate one-way delay from a round trip and the network's variance leaks straight into the estimate. And the correction itself is hostile to ordering: when NTP discovers the clock is off, it can **step** the clock — making time **jump forward, or jump backward**. Wall-clock time is therefore **non-monotonic**: read it twice and the second read can be *smaller* than the first.

This forces a distinction every program that touches time must respect — **there are two different clocks, and confusing them is a bug:**

| | **Time-of-day / wall clock** | **Monotonic clock** |
|---|---|---|
| Answers | "what time is it" (calendar time) | "how much time has elapsed" |
| Can jump / go backward? | **Yes** — NTP steps, leap seconds | **No** — only ever increases |
| Comparable across machines? | Pretends to be, but skew makes it a lie | **No** — meaningful only *within one machine* |
| Use it for | logging a human timestamp, displaying a date | **measuring a duration** (timeouts, latency, backoff) |
| Never use it for | **measuring a duration; ordering cross-machine events** | comparing to another machine's reading |

```python
# WRONG — wall clock can jump backward mid-measurement; "elapsed" can be negative
start = time.time();           do_work();  elapsed = time.time() - start

# RIGHT — monotonic clock only increases; safe for the duration
start = time.monotonic();      do_work();  elapsed = time.monotonic() - start
```

The monotonic clock is the right tool for the timeouts and backoff in [communication.md](communication.md) — but note its ceiling: it is monotonic *on one machine only*. You cannot subtract one machine's `monotonic()` from another's. For cross-machine **ordering**, neither physical clock will save you, and the next section is the trap that proves it.

## The classic trap — ordering by timestamp, and silent data loss

The most natural thing in the world is to stamp each event with `now()` and order events by the stamp. On one machine this is correct. Across machines it is a **silent, production-grade data-loss bug**, and it hides because it produces no error — just a quietly wrong answer.

Consider two replicas accepting writes to the same key, each resolving conflicts by **last-write-wins (LWW)**: keep the value with the largest timestamp. Now let replica B's clock be 100 ms behind replica A's:

```
real time ───────────────────────────────────────────────▶

A's clock:        ... 12:00:00.200 ...
B's clock (−100ms): ... 12:00:00.100 ...

t1 (really first):  A writes x = "v1"   stamps it 12:00:00.200
t2 (really later):  B writes x = "v2"   stamps it 12:00:00.150   ← later in real time,
                                                                   SMALLER timestamp

LWW keeps the larger stamp → keeps "v1".
The causally-later write "v2" is SILENTLY DROPPED.
```

The user's most recent write vanished, no exception was raised, and the timestamps "looked fine." This is not a corner case — it is the **default behavior** of clock skew under LWW, and it is why timestamp ordering must be treated as forbidden, not merely discouraged.

> **Clock skew can give a causally-LATER event a SMALLER wall-clock timestamp. Therefore "keep the latest by timestamp" (last-write-wins) silently drops writes whenever two machines' clocks disagree — which is always. It is a real, silent, data-losing bug, not a theoretical one. Never order cross-machine events by wall-clock time.**

(LWW is not always wrong — it is a deliberate, lossy conflict-resolution *policy* you may choose when the application can tolerate losing one of two concurrent writes. The bug is using it while *believing* the timestamps give you a true order. The **replication** stage (STAGE 3) treats LWW honestly, as one option among merge / CRDT / hand-to-application.)

## The paid-for exception — Spanner / TrueTime

There is exactly one way to make a wall-clock timestamp usable for global ordering, and it is instructive precisely because of what it costs. Google's **Spanner** does not pretend its clocks agree. Instead, **TrueTime** equips every machine with **GPS and atomic-clock** references and exposes time not as a point but as an **interval** — `TT.now()` returns `[earliest, latest]`, a window guaranteed to contain the true time, with a known bound on its width (single-digit milliseconds). The uncertainty is not eliminated; it is **measured and bounded**.

The clever move is what Spanner does with that bound on commit: it **waits out the interval**. After picking a commit timestamp `s`, the transaction deliberately sleeps until `TT.now().earliest > s` — until it is *certain* that real time has passed `s` everywhere — before releasing its result. By paying that **commit-wait latency**, Spanner guarantees that if transaction T1 commits before T2 starts, then T1's timestamp really is smaller — buying back a usable, externally-consistent **global timestamp order**.

> **You cannot eliminate clock uncertainty. You can only BOUND it and pay for it EXPLICITLY — with special hardware (atomic clocks, GPS) and added latency (commit-wait). Spanner is the proof that a true global time-order is *purchasable*, not free, and that everyone without that budget must order by causality instead.**

That is the pivot. Most systems cannot buy atomic clocks. So the rest of this file is the technique for everyone else: stop trying to know *when* things happened, and track *what could have influenced what*.

## The key mental shift — happened-before

Here is the move that dissolves the problem. **In a distributed system you almost never actually need the real physical time.** What you need to know is **causality**: *could event A have influenced event B?* If A could have caused B, their order matters and must be preserved. If neither could have reached the other, their order is genuinely **meaningless** — and pretending to order them is exactly the mistake LWW makes.

Leslie Lamport formalized this in 1978 as the **happened-before** relation, written **A → B**. It is defined by three rules and *nothing else* — note that no clock appears anywhere in the definition:

1. **Within one process**, events are ordered by the order they occur. If A and B happen in the same process and A is first, then A → B.
2. **A send happens-before the matching receive.** If A is "send message m" and B is "receive message m," then A → B. (A message cannot be received before it was sent.)
3. **Transitivity.** If A → B and B → C, then A → C.

If **neither A → B nor B → A**, the two events are **concurrent**, written **A ∥ B**. Concurrent does not mean "at the same instant" — it means **causally unrelated**: no chain of message passing connects them, so neither could possibly have influenced the other, and asking which came "first" has no physical meaning.

The **spacetime diagram** makes this concrete. Each vertical line is a process advancing through time; dots are events; diagonal arrows are messages. **Only paths that follow process-lines and message-arrows define order.** The horizontal (wall-time) axis is *not* the truth — an event drawn further right is **not** necessarily "after" one to its left.

```
        P1:   a ──────▶ b ──────────────▶ e
                         \                ▲
                          \ (message)    /
                           ▼            /
        P2:        c ───────▶ d ───────/
                              (message)

  a → b → e        (rule 1, same process)
  b → d            (rule 2, message send→receive)   so  a → d, a → e, b → e
  c → d            (rule 1, same process)            so  c → d → e ⇒ c → e (c is NOT concurrent with e)
  c ∥ a   c ∥ b    — no message path connects c to a or b → CONCURRENT, order meaningless
```

The deep payoff: **we replaced an unanswerable question — "when did this happen?" — with a trackable one — "what could have influenced what?"** The first needs a global clock we proved we don't have. The second needs only message passing, which we already have. Causality is recoverable *without a clock*.

## Partial order vs total order — the load-bearing takeaway

Happened-before does **not** order all pairs of events. Some pairs are ordered (causally related); others are concurrent (unordered). A relation that orders *some* pairs but not all is a **partial order**. This is the single most important idea in this file, and most of consistency theory is a footnote to it.

> **Happened-before yields a PARTIAL order. Some events are causally ordered; many are concurrent and have NO order. There is no single true TOTAL order of events in a distributed system — that global "what really happened, in what exact sequence" is generally a *fiction*. Reality is a partial order; the single timeline is something you must pay to manufacture, and most of the time you shouldn't.**

Everything downstream is a stance toward this fact:

- **Strong consistency / linearizability** (STAGE 4: the *consistency & consensus* block) is essentially **"pretend a total order exists"** — make the whole system behave as if every operation happened at a single instant on a single timeline. It is achievable, but it is the *expensive* model precisely because manufacturing a total order is expensive.
- **Weaker models** (eventual, causal) **calmly embrace the partial order** — they let concurrent events be unordered and only constrain what is causally related.
- A true total order **is not free**: it costs **coordination** — nodes must communicate and agree, which is the job of **consensus** (STAGE 4). Every time you demand a single global order, you are signing up for that coordination bill. The architectural decision of *whether* to pay it (and the CAP/PACELC trade behind it) belongs to the `load-bearing` skill; holdfast's job here is to make sure you know a total order is a *purchase*, not a given.

So the engineering instinct to install: **default to respecting the partial order; demand a total order only where the application truly needs one, knowing it costs coordination.**

## Logical clocks — turning causality into comparable numbers

Happened-before is a relation, not a number. To *use* it in code — to compare two events and ask "is this causally after that?" — we attach counters that track causality mechanically. These are **logical clocks**: they count *events and messages*, not seconds.

### Lamport clocks — cheap, total order, but blind to concurrency

A **Lamport clock** is one integer counter `L` per process. Three rules maintain it:

1. **On any local event**, increment: `L = L + 1`.
2. **On send**, increment and **attach** the counter to the message.
3. **On receive** of a message carrying timestamp `t`: `L = max(L, t) + 1`.

```
P1:  L=1(a) ── L=2(b, send t=2) ───────────────── L=4(e, recv t=3)
                          \                        ▲
                           ▼ recv t=2     send t=3 │
P2:        L=1(c) ── L=max(1,2)+1=3 (d) ───────────┘
```

The guarantee is the **clock condition**: **if A → B then L(A) < L(B)**. Causally-ordered events get strictly increasing numbers. Break ties (two events with equal `L`) by appending a fixed **process id** — `(L, pid)` — and you get a **total order** that is *consistent with causality* (it never contradicts a real → edge).

But there is a sharp **limitation: the converse fails.** `L(A) < L(B)` does **not** imply `A → B`. A smaller Lamport number can belong to a concurrent event that just hasn't seen many messages. So a Lamport clock **cannot detect concurrency** — by forcing every pair into a total order, it *throws away the information about which events were genuinely concurrent*. It tells you a consistent order to process things in; it cannot tell you whether two writes actually conflict.

### Vector clocks — full causality, at a price

A **vector clock** carries one counter *per process*: `V = [v1, v2, ..., vN]`. Each process increments its own slot on an event; on receive, it takes the element-wise `max` of its vector and the message's, then increments its own slot. Comparing two vectors recovers the **exact** relationship:

- `V(A) < V(B)` (every slot ≤, at least one strictly <)  ⇒  **A → B**
- `V(B) < V(A)`  ⇒  **B → A**
- **neither** (each has a slot bigger than the other)  ⇒  **A ∥ B — concurrent**

```
A = [2,1,0]   B = [2,3,1]   →  A < B   ⇒  A → B          (B is causally after A)
A = [2,1,0]   C = [0,1,4]   →  neither ⇒  A ∥ C          (A and C are CONCURRENT — a real conflict)
```

That third case is the whole point: a vector clock can **distinguish a true concurrent conflict from a write that is merely the causal descendant of another.** The **cost** is size — the vector grows **O(N)** with the number of participating processes, so in a system with many or churning nodes the metadata becomes a real scalability concern (mitigated by dotted version vectors, pruning, etc., in the replication stage).

**The one-line trade-off to remember:** *Lamport clocks are cheap and give a consistent total order but are blind to concurrency; vector clocks see concurrency (full causality) but are heavier (O(N)).* Pick by whether you need to *detect concurrent writes* (vector) or just *agree on some consistent processing order* (Lamport).

### Hybrid logical clocks (HLC) — readable *and* causal

A Lamport number is causally correct but meaningless to a human (it's just a count); a wall-clock timestamp is human-readable but causally broken. **Hybrid Logical Clocks** blend the two: a timestamp is a pair of *(physical time, logical counter)* maintained so it stays **close to real wall-clock time** (human-readable, roughly comparable across machines, sortable like a date) **while still respecting causality** (if A → B then HLC(A) < HLC(B), regardless of clock skew). The logical part absorbs the skew so the physical part can stay meaningful. **CockroachDB** and others use HLCs to get timestamps that read like real time yet never violate happened-before.

## What these are for — conflict detection, and causal consistency

Logical clocks are not academic bookkeeping; they are the machinery behind two things you will build directly on top of this stage.

**Conflict detection in replication.** When two replicas of the same datum diverge, the only question that matters is: *was one write causally after the other, or were they concurrent?*

- If `V(write1) < V(write2)`, write2 is the **causal descendant** — it already "saw" write1, so write2 simply **wins, with no conflict.** (LWW-by-timestamp can't tell this apart from a real conflict, which is half of why it loses data.)
- If `write1 ∥ write2` — **concurrent** — that is a **true conflict**: two writers acted without seeing each other, and *neither is authoritative*. Now you must **resolve**: last-write-wins (lossy, your choice), application-level **merge**, a **CRDT** that merges deterministically, or **hand the siblings to the application** to decide. **Dynamo** and **Riak** do exactly this — they keep version vectors, return *both* concurrent values as siblings, and refuse to silently pick one.

The **replication** stage (STAGE 3) is built entirely on this distinction; this stage is where you learn to make it.

**Causal consistency.** A consistency model that guarantees you observe **causally-related events in their causal order** — you will **never see a reply before the message it answers**, never see a comment before the post it replies to — while leaving **concurrent events free to appear in any order**. It is exactly "honor the partial order, don't manufacture a total one." Its importance: **causal consistency is the strongest consistency model still achievable under a network partition** (the *consistency & consensus* stage (STAGE 4) makes this precise against CAP). It is the natural sweet spot — much stronger than eventual, far cheaper than linearizable — and it is *defined* in terms of the happened-before relation this file built.

## Anti-patterns (use as a pre-flight checklist)

- **Ordering cross-machine events by wall-clock timestamp** — the headline bug; skew gives a later event a smaller stamp. Order by causality (logical/vector clock), never by `now()`.
- **Wall-clock last-write-wins, believed to be correct** — silently drops concurrent writes; data loss with no error. If you choose LWW, choose it knowing it is lossy, not because you think the timestamps are true.
- **Using the wall clock to measure a duration** — it can jump backward; your "elapsed" goes negative or huge. Use the **monotonic** clock for timeouts, latency, backoff.
- **Comparing one machine's monotonic clock to another's** — monotonic is meaningful *within one machine only*; it is not a cross-machine ordering tool either.
- **Assuming NTP means clocks agree** — it bounds skew to tens of ms at best and can step time backward; "synced" is not "equal."
- **Treating "concurrent" as an error to suppress or clobber** — concurrency (A ∥ B) is a **real, expected state**. Detect it (vector clock), then resolve it (merge / CRDT / app); do not force-order it.
- **Using a Lamport clock to detect conflicts** — it can't; `L(A) < L(B)` doesn't mean `A → B`. Use a vector clock when you need to *detect concurrency*; Lamport only gives you a consistent total order.
- **Demanding a global total order by reflex** — a total order costs **coordination** (consensus, STAGE 4). Default to the partial (causal) order; pay for a total order only where the application truly needs one.
- **Believing you can buy Spanner's guarantee for free** — TrueTime's global order is purchased with atomic clocks + GPS + commit-wait latency. Without that budget, order by causality.
- **Putting a human wall-clock timestamp in the data and later ordering by it** — fine for *display*, forbidden for *ordering*. Keep the two uses separate, or use an HLC so the same value is both readable and causal.

The engineering posture, in one line: **this block is the formal answer to enemy 3. You cannot get the objective real order, so track the causal order you *can* know for certain, and accept "concurrent" as a state to detect and resolve — never force-order it.** It is the Cook stance applied to time — you act on the causality you can *see*, and never on the invisible "real" time you can't.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) (enemy 3 — no global clock/state — and the third state this stage extends to *time*) · [communication.md](communication.md) (the async, reordering network that makes "who first?" a real question; the monotonic clock powers its timeouts/backoff) · [../SKILL.md](../SKILL.md) (STAGE 2 — Ordering, the flight plan this reference serves; replication, consistency & consensus, and coordination are later stages built on this partial-order foundation) · `load-bearing` (the architecture call of *whether* to pay for a total order — CAP/PACELC as a design choice) · `stationkeeping` (clock-skew monitoring, NTP health, and the production realities of running this) · `gauge` (encoding "this is a monotonic instant, not a wall-clock time" in the type system so the two clocks can't be confused) · `plumb` (keeping the version-vector / clock plumbing legible).

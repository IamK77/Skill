# Communication — talking reliably on top of the third state

This reference is the depth behind **STAGE 1 — Communication** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 0 established the one fact this whole stage is built around — read [the-three-enemies.md](the-three-enemies.md) first if you haven't, because everything below is a *consequence* of it:

> **THE THIRD STATE.** On a single machine an operation has two outcomes: **success** or **failure**. Cross a network and a third appears — **"I don't know."** You sent a request and got no reply: did it not arrive? arrive and run slowly? run, and the *reply* was lost (so it *did* happen)? did the node die mid-call? *You cannot tell from the outside.* Single-machine code has **no branch for "I don't know"** — and almost every technique in this file exists to fill that missing branch.

The question this stage answers is therefore narrow and concrete: **given that "I don't know" will happen on every remote call, how do two nodes talk reliably anyway?** Not "how do we make the network reliable" — you can't — but "how do we build correctness *on top of* an unreliable, ambiguous channel." The answer is a small set of moves — idempotency, delivery semantics, disciplined retries, decoupling in time — and they all reduce to the same posture: **acknowledge the ambiguity and build around it, never wish it away.**

## Contents

- [RPC as a leaky abstraction](#rpc-as-a-leaky-abstraction)
- [The sync vs async axis — and the cascade](#the-sync-vs-async-axis--and-the-cascade)
- [Interaction patterns and the broker](#interaction-patterns-and-the-broker)
- [Delivery semantics — the direct product of the third state](#delivery-semantics--the-direct-product-of-the-third-state)
- [Idempotency — the headline weapon](#idempotency--the-headline-weapon)
- [The mechanism, drawn — a lost ack absorbed safely](#the-mechanism-drawn--a-lost-ack-absorbed-safely)
- [Timeout, retry, backoff](#timeout-retry-backoff)
- [Schema and contract evolution](#schema-and-contract-evolution)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## RPC as a leaky abstraction

The first temptation, and the one an agent reaches for by default, is to make the remote call *look like a local one*. **RPC** (remote procedure call — gRPC, Thrift, and friends) does exactly that: you call `chargeAccount(user, amount)` and it looks, in the source, identical to a function call in the same process. The framework marshals the arguments, ships them over the wire, runs the call on another machine, and hands you back a return value. Convenient — and **the abstraction must leak**, because a remote call differs from a local one on four axes the local-call shape cannot hide:

1. **It is slower by orders of magnitude.** A local call is nanoseconds; a remote call is milliseconds — a factor of roughly a *million*. Code written as if the call is free (a remote call in a loop, an N+1 of network round-trips) is fast on one machine and a disaster across two.
2. **It fails in new ways — and adds the third state.** A local call is two-state: it returns or it throws, and you saw which. A remote call adds **"I don't know"** — the connection drops, the timeout fires, the node dies, and you cannot tell *slow* from *dead* or *lost-request* from *lost-reply*. The local-call shape has nowhere to put that third outcome.
3. **Arguments must be serialized.** What crosses the wire is *bytes*, not memory. Pointers, references, callbacks, open file handles, and anything tied to local address space **do not cross**; a large object is expensive to serialize and ship; mutating a "passed" object on the far side changes nothing here. Pass-by-reference is a local-only fiction.
4. **It carries network details.** Connection setup, TLS, timeouts, retries, backpressure — the local-call signature shows none of these, but they are all really there and all able to fail.

> **A good RPC framework does not hide these — it makes them shout.** It exposes **timeout**, **error**, and **retry** explicitly in the API and *forces the caller to handle them*, rather than burying them under a return value that looks local. This is the same spirit as plumb's **trust chain**: the dangerous thing is the *silent* break that the next reader mistakes for safety. A `chargeAccount(...)` that can only return or throw is lying about the third state; a `chargeAccount(...) -> Result<Receipt, RpcError>` where `RpcError` includes a `Timeout`/`Unknown` variant is telling the truth. Choose the framework — and write the call site — so the leak is loud.

The rule is not "never use RPC." It is **never let the local-call shape trick you into forgetting which of the four axes is about to bite.** Treating an RPC like a local call is the root anti-pattern this whole stage guards against.

---

## The sync vs async axis — and the cascade

Every remote interaction sits somewhere on one axis: **synchronous** (send the request and *block* waiting for the reply) versus **asynchronous** (send a message and *move on*, handle the reply later or never).

**Synchronous is simple but it time-couples the two ends.** Blocking for the reply means: *both ends must be up at the same instant*; the caller's thread/resources are *held* for the whole duration; and a failure or slowness downstream **propagates back instantly** to the caller. It reads like a function call and that is its appeal — and its trap.

> **THE CASCADE — the number-one microservices killer.** A **deep synchronous call chain** — `A` blocks on `B`, which blocks on `C`, which blocks on `D` — couples the availability *and* the latency of the whole chain into the caller. When `C` gets slow (not even down — just *slow*), `C`'s slowness travels *up* the chain: `B`'s threads pile up waiting on `C`, then `A`'s threads pile up waiting on `B`, and the whole chain stalls and falls over together. This is a **Cook cascade** — a disaster assembled from one degraded component plus a structure that propagates the degradation — and it is the single most common way a microservice architecture dies.

Make it **quantitative**, because the math is what makes the danger undeniable:

- **A sync chain's availability is the PRODUCT of each link's.** Five services, each a respectable **99.9%**, chained synchronously give `0.999^5 ≈ 0.995` — about **99.5%**, which is roughly **3.6 hours of downtime per month**. You assembled five "three nines" components into something well short of "two and a half nines." Every hop you add *multiplies* the availability down.
- **A sync chain's latency is the SUM of each link's.** The caller waits for the slowest path through the whole chain; tail latencies stack, and the p99 of the chain is worse than the p99 of any single hop.

**Asynchronous decouples in time.** You send a message and move on; the receiver can be *down right now* and catch up later when it recovers. This is dramatically more resilient — a slow or dead downstream no longer reaches up and stalls the caller — but it costs complexity you must pay honestly:

- there is **no instant result** — the answer comes later, or via a separate reply message, or not at all;
- you must **correlate** request and response yourself, typically with a **correlation id** carried on both;
- you must **accept eventual consistency** — for a while, different parts of the system disagree about what happened, and the design has to be correct anyway.

The discipline: **don't build naive deep synchronous chains.** Where a call must be sync, *bound the blast radius* — tight inner timeouts (tighter than the caller's), **bulkheads** (isolate the thread pool per dependency so one slow dependency can't exhaust all threads), and a **circuit breaker** (below). Where you can, **go async** and break the time-coupling outright. The architectural call — how deep the service graph should be at all, monolith vs services — is `load-bearing`'s; holdfast's job here is to name the cascade and bound it.

---

## Interaction patterns and the broker

Above the sync/async axis sit a handful of **interaction patterns** — the shapes a conversation between nodes can take. Match the pattern to what you actually need:

- **Request–response (1:1).** You ask one party and you want an *answer*. The default, and usually synchronous. Use it when you genuinely need the result to proceed — and remember each one is a link in a potential cascade.
- **Publish–subscribe (1:many).** A publisher emits an event; *zero or more* subscribers receive it, and **the publisher does not know who is listening.** This is the deepest decoupling — you can add a new consumer of "order placed" without touching the producer at all. The producer's job ends at "I announced it."
- **Message queue (point-to-point, async, buffered).** A producer enqueues work; *one* consumer (from a pool) dequeues and processes it. The buffer **absorbs bursts** — a spike of work piles up in the queue instead of overwhelming the consumer — and gives you **backpressure**: a growing queue is a visible, measurable signal that consumers are falling behind.
- **Stream (a continuous, ordered event log).** A durable, replayable log of events (Kafka is the archetype) that many consumers read at their own pace, each tracking its own position. The log *is* the source of truth; consumers are derived views.

Turning "two nodes talking directly" into "two nodes talking through a buffer" is the job of a **message broker** (Kafka, RabbitMQ, and kin). The trade is clean:

> **A broker trades a hop + eventual consistency for time-decoupling + resilience.** It buys you **decoupling** (producer and consumer never need to be up together), **peak-shaving** (the buffer absorbs spikes), **durability** (messages survive a consumer crash), and often **built-in retry/redelivery** — at the cost of **one more component to operate** (the broker itself, now a thing that can fail and must be scaled) plus the **eventual-consistency and ordering concerns** that come with putting a buffer in the middle.

A broker is not free infrastructure you sprinkle on — it is a deliberate architecture decision with an operational bill. When it's the right call, the resilience is worth the hop; when it isn't, you've added a distributed component to a problem that wanted a function call.

---

## Delivery semantics — the direct product of the third state

Here is where the third state stops being philosophy and becomes a decision you *must* make on every message path. **Delivery semantics** name what guarantee you get when you send something over an unreliable channel, and there are exactly three:

- **At-most-once** — send it, **don't retry**. If it's lost, it's lost. You may **lose** a message, but you will **never duplicate** one. Correct for fire-and-forget where loss is cheap: a metrics tick, a heartbeat, a non-critical log line. Cheapest, weakest.
- **At-least-once** — **retry until acknowledged.** You will **never lose** a message — but you may **duplicate** it, and the reason *is the third state*: you cannot distinguish "it never arrived" from "it arrived, was processed, but the **ack was lost** on the way back." From the sender's side those two look *identical* — "I don't know" — so the only safe move is to send again, and sometimes "again" means the receiver does it twice. This is the **common, default choice** for anything that matters.
- **Exactly-once** — the grail: every message processed once, no loss, no duplication. Everyone wants it; the network refuses to give it.

> **EXACTLY-ONCE *DELIVERY* IS ESSENTIALLY IMPOSSIBLE — but exactly-once *EFFECT* is achievable.** No transport can guarantee a message crosses an unreliable network *exactly* once, precisely *because of the third state*: the sender can never know whether a silent attempt landed, so it must choose between possibly-lose (at-most-once) and possibly-duplicate (at-least-once) — there is no third option at the transport layer. What you *can* build is exactly-once **effect**: **at-least-once delivery + idempotency (or dedup) = once in effect.** So when someone says "we need exactly-once," they almost always mean *"at-least-once delivery plus an idempotent receiver, so duplicates land harmlessly and the net effect is once"* — **not** a magic transport guarantee. (Systems that advertise "exactly-once," Kafka included, deliver effect-once this way: at-least-once on the wire plus dedup/transactional bookkeeping underneath.) Demand the effect; never believe in the delivery.

This is the crux of the whole stage. The transport gives you at-most-once or at-least-once; **you** supply the idempotency that turns at-least-once into effect-once. Which means the real work moves to the receiver — and that work is idempotency.

---

## Idempotency — the headline weapon

> **An operation is IDEMPOTENT when applying it N times has the same effect as applying it once.** The logic chains straight off the third state: *because you do not know whether your last attempt succeeded, make a re-attempt harmless* — then you can retry freely, and at-least-once delivery becomes safe. Idempotency is the property that converts "I don't know" from a correctness threat into a non-event: if doing it again can't hurt, then *not knowing whether you already did it* doesn't matter.

There are two ways to get there.

**1. Use naturally idempotent operations.** Some operations are idempotent by their very shape — and the difference is sharp and load-bearing:

```
set balance to 100      # idempotent: do it once or five times, balance == 100. Safe to retry.
add 100 to balance      # NOT idempotent: retry it and you've added 200. A double-charge bug.
```

A *replace/assign* ("set the shipping address to X", "set state = SHIPPED") is naturally idempotent; a *delta* ("add 100", "increment the counter", "append") is not. Whenever you can phrase the operation as "make the world be in state X" rather than "apply this change to whatever the world currently is," retries become free. This is design work, done before any retry logic — and it is one of the core skills of distributed engineering.

**2. Make a non-idempotent operation idempotent with an idempotency key.** When the operation is *inherently* a delta (charge a card, send an email, create an order — you genuinely cannot rephrase "charge $100" as a pure assignment), add a **dedup layer**:

- the **client** tags each logically-distinct request with a **unique idempotency key** `K` (a UUID, an order id — *generated once per intent, reused across retries of that same intent*);
- the **server** keeps a record of keys it has already processed (a **dedup table**); on a request it checks: *have I seen `K`?* If **no**, it performs the operation, records `K` (ideally in the *same transaction* as the effect, so the record and the effect commit together), and returns the result. If **yes**, it **skips the operation** and **replays the stored result**.

The key must be generated by the client *per intent* and held stable across all retries of that intent — a fresh key per retry defeats the entire mechanism, because the server can't tell the retries apart. Designing operations to be idempotent — naturally where you can, with keys where you can't — is **the** core defensive move of this stage. Everything about retries below depends on it.

---

## The mechanism, drawn — a lost ack absorbed safely

This is the whole stage in one picture: **at-least-once delivery + an idempotent receiver, absorbing a retry caused by a lost ack, with money charged exactly once in effect.**

```
   CLIENT                                              SERVER
     │                                                   │
     │  charge  id=K, $100                               │
     ├──────────────────────────────────────────────────►│  K unseen →
     │                                                    │  CHARGE $100 once,
     │                                                    │  record K + result
     │                          200 OK ($100 charged)     │
     │           ╳ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤   ← reply LOST in transit
     │                                                    │
     │   THE THIRD STATE: client got no reply.            │
     │   Did the charge happen? IT DOES NOT KNOW.         │
     │                                                    │
     │  charge  id=K, $100   (RETRY, same key)            │
     ├──────────────────────────────────────────────────►│  K already seen →
     │                                                    │  do NOT charge again,
     │                                                    │  REPLAY stored result
     │                          200 OK ($100 charged)     │
     │◄───────────────────────────────────────────────────┤
     │                                                    │
   client finally has the result.        money was charged EXACTLY ONCE.
```

**Caption.** The idempotency key `K` turns **"I don't know"** into **"asking again is harmless."** The client never has to resolve the third state — it doesn't *need* to know whether the first attempt landed, because re-sending with the same `K` is safe either way. That substitution — *replacing certainty you can't have with a retry that doesn't need it* — is the core mechanism of this entire stage. Note what each half supplies: **at-least-once** (the retry) guarantees the charge is *never lost*; **idempotency** (the dedup on `K`) guarantees it is *never duplicated*; together they give exactly-once **effect** over a channel that can only offer at-least-once **delivery**.

---

## Timeout, retry, backoff

Idempotency makes retrying *safe*; this section makes retrying *disciplined*. The two are inseparable — a retry without idempotency corrupts data, and idempotency without retry discipline takes down the service you're calling.

**A timeout is a guess, not a fact.** It is the only tool you have to *act* on the third state — but it cannot tell **slow** from **dead**. Set it too short and you *false-kill* healthy-but-slow requests, then retry them, manufacturing duplicate work and load on a service that was fine. Set it too long and you detect real failures slowly, holding resources and stalling callers while a dead dependency drags. There is no perfect value; there is only a tuned trade-off, and *advanced* moves to tighten it: **adaptive timeouts** (derived from observed latency percentiles rather than hard-coded), and **deadline propagation** — pass a single absolute deadline *down the call chain* so `A`, `B`, and `C` all race the same clock and inner hops don't keep working on a request the outer caller has already abandoned.

**Retries are necessary — and a naive retry is dangerous.** Transient failures (a blip, a brief overload, a dropped packet) are exactly what retries are *for*. But the obvious implementation is a weapon pointed at yourself:

> **THE RETRY STORM — another cascade.** A service gets slow or starts erroring. Every client times out at *roughly the same moment* and retries *in lockstep* — so a service that was merely *struggling* is now hit with a synchronized wall of duplicated load that hammers it from struggling to *dead*. It is a **self-inflicted DDoS**: the retries meant to ride out a blip become the thing that finishes the service off, and the failure cascades outward. The third state set this up — clients couldn't tell slow from dead, so they all retried — and a lack of discipline pulled the trigger.

Two one-liners worth stating flat, because each names a whole class of outage:

- **retry + not-idempotent = data corruption** (the double charge — never retry an operation you haven't made idempotent);
- **retry + no backoff = you DDoS yourself** (the retry storm — never retry in a tight synchronized loop).

The discipline that defuses both:

- **Exponential backoff + jitter.** Wait longer after each failure (`base · 2^attempt`), and add **randomized jitter** so a crowd of clients *de-synchronizes* instead of retrying in a thundering-herd lockstep. The jitter is not optional polish — it is the part that breaks the synchronization that makes a retry storm.
- **A retry budget.** Cap total retries as a *fraction of overall traffic* (e.g. retries may add at most 10% load), not just per-request. A per-request cap still lets a system-wide failure multiply total load; a budget bounds the *aggregate* amplification.
- **A circuit breaker.** When a dependency is failing, **stop calling it** for a cooling-off window — fail fast locally instead of piling retries onto a service that's already down, then probe gently to see if it has recovered. This is what stops one dependency's outage from cascading into yours.
- **Retry only idempotent operations.** The non-negotiable precondition that ties this section back to the last. If you can't prove the operation is idempotent, you cannot safely retry it — full stop.

> **THE RELIABLE-REMOTE-CALL RECIPE.** A remote call you can trust =
> **timeout** (bounded, ideally a propagated deadline) **+ bounded retry** (exponential **backoff + jitter**, under a **retry budget**) **+ idempotency key** (so the retry is harmless) **+ circuit breaker** (so a failing dependency can't cascade). Drop any one term and you've reintroduced a specific failure mode: no timeout → hang forever on the third state; no backoff/jitter → retry storm; no idempotency → duplicate-effect corruption; no breaker → cascade. Wire all four, every time, on any call that matters.

*Running* these in production — tuning the breaker thresholds, chaos-testing the retry behavior, alerting on budget exhaustion, the on-call response when the cascade fires anyway — is `stationkeeping`'s domain. holdfast's job is to get the *design* right so there is something correct to operate.

---

## Schema and contract evolution

Two nodes can only talk if they agree on the **message format** (JSON, Protobuf, Avro) *and* the **schema** that gives the bytes meaning. The distributed reality that makes this hard:

> **You can never assume sender and receiver share a version.** Services **deploy independently, at different versions** — there is no moment when you upgrade every node atomically; during any rollout, a v2 sender is talking to a v1 receiver and vice versa, and old messages sit in queues and logs waiting to be read by code that has since moved on. Therefore messages **must** be **forward- and backward-compatible**, and **schema evolution is mandatory, not optional** — a "flag day" where everyone upgrades at once does not exist in a real distributed system.

Concretely this means the familiar discipline — add fields, don't remove or repurpose them; never reuse a field's tag/number for a new meaning; tolerate unknown fields on read; make new fields optional with sane defaults; deprecate before deleting across a window long enough that all old messages have drained. The *mechanics* of evolving an API or a message schema compatibly — versioning strategy, compatibility modes, the contract tests that pin them — are `load-bearing`'s and `husbandry`'s; holdfast's contribution is only the *why*: the third-state world has no flag day, so the wire contract must survive mixed versions by construction.

---

## Anti-patterns and pre-flight checklist

Run this before you call a remote-communication design correct. Each line is a failure this stage exists to prevent; the master question behind all of them is **"what does this do when the call returns 'I don't know'?"** — if the design has no answer, it has a bug.

- **No branch for "I don't know."** Code written as if a remote call is two-state (returns or throws). The third state is where the bug lives — every remote call needs an explicit timeout/unknown path.
- **Treating an RPC like a local call.** Forgetting it is ~10⁶× slower, fails in new ways, can't pass references, and carries the network. The local-call shape is a convenience that lies about all four axes.
- **Retrying a non-idempotent operation.** `retry + not-idempotent = data corruption` (the double charge). Make it idempotent — naturally ("set to X") or with an idempotency key + dedup table — *before* you add any retry.
- **Retry without backoff + jitter (+ budget, breaker).** `retry + no backoff = you DDoS yourself` — the retry storm, a self-inflicted cascade. Exponential backoff, randomized jitter, a retry budget, a circuit breaker.
- **No circuit breaker on a flaky dependency.** Piling retries onto a service that's already down is how its outage becomes yours. Fail fast, cool off, probe.
- **Believing in exactly-once *delivery*.** It's an end-to-end *effect* property (at-least-once **+** idempotency), never a transport guarantee. When someone says "exactly-once," confirm they mean effect-once and that the idempotency is actually built.
- **A fresh idempotency key per retry.** Defeats the entire dedup mechanism — the key must be generated once per *intent* and held stable across all retries of it.
- **Deep synchronous call chains.** Availability multiplies (five 99.9% hops ≈ 99.5%), latency sums, and one slow link cascades up the chain. Bound it: bulkheads, tight inner timeouts, deadline propagation, go async where you can.
- **A message broker added without owning its bill.** It buys time-decoupling and resilience but costs a hop, an operated component, plus eventual-consistency and ordering concerns. Adopt it deliberately, not reflexively.
- **Assuming sender and receiver share a schema version.** Independent deploys mean mixed versions always; there is no flag day. Evolve the schema forward/backward compatibly (route the mechanics to `load-bearing` / `husbandry`).
- **No timeout at all.** A call with no timeout hangs forever the instant the third state appears — the simplest and most common way a thread pool dies.

The engineering posture under every one of these: **communication design is acknowledging the ambiguity and building around it** — *assume duplication* (so: idempotency), *assume slowness and failure* (so: timeouts, backoff, breakers), *assume the two ends are neither in sync nor on the same version* (so: async, schema evolution). You are not removing the third state; you are making it harmless.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) (the third state, the fallacies, and the Cook framing this stage is the consequence of — read first) · [time-and-causality.md](time-and-causality.md) (once messages are async and can arrive out of order, ordering them becomes the next problem — STAGE 2) · [../SKILL.md](../SKILL.md) (the gated flight plan this reference serves). Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — monolith vs services, how deep the service graph should be, CAP as a *design* choice) · **`stationkeeping`** (running it in production — tuning breakers, chaos-testing retries, SRE and incident response when the cascade fires) · **`gauge`** (the code-level signal — making the RPC's timeout/error/unknown outcomes explicit in the type, boundary validation of inbound messages) · **`plumb`** (code craft and legibility — the trust-chain spirit of making the leak shout) · **`assay`** (testing the retry/idempotency/dedup behavior) · **`load-bearing`** / **`husbandry`** (the API / message-schema evolution mechanics).

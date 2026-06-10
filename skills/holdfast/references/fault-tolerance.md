# Fault tolerance — a reliable whole from unreliable parts

This reference is the depth behind **STAGE 6 — Fault tolerance** of the [../SKILL.md](../SKILL.md) flight plan. It is the stage where every "failure" the earlier stages met as a local hazard — the third state, the slow-vs-dead guess, split-brain, the rebalance cascade — is gathered into one discipline. And that discipline has a name already in your head: it is the **engineering incarnation of Richard Cook's *How Complex Systems Fail*.** STAGE 0 told you the world Cook describes is the world the three enemies create; this stage is the explicit pay-off — Cook's essay, turned into code. The single fact it is all built on is the same line the foundation opened with:

> **In a distributed system, FAILURE IS THE NORM, NOT THE EXCEPTION.** With enough nodes, the probability that *something* is broken at any given instant approaches 1 — a disk dying here, a link flapping there, a process that just OOM'd over there. So fault tolerance is not an optional feature you bolt on for the bad day; it is the **default premise** of the whole design. The goal of the entire stage states itself: **build a reliable whole out of unreliable parts.** You are not trying to make the parts not fail — they will — you are arranging unreliable parts so the *system* stays up while they do.

This is [enemy 1 made into a worldview](the-three-enemies.md#enemy-1--partial-failure): partial failure is the constant background, never an exceptional branch, so fault tolerance is the **floor you build on**, not a feature you add. Everything below is one layer of that floor.

## Contents

- [Failure models — how badly can a node misbehave](#failure-models--how-badly-can-a-node-misbehave)
- [Failure detection — why it is doomed to be a guess](#failure-detection--why-it-is-doomed-to-be-a-guess)
- [Redundancy — the basic move, with one big precondition](#redundancy--the-basic-move-with-one-big-precondition)
- [Failover and recovery — and MTTR over MTBF](#failover-and-recovery--and-mttr-over-mtbf)
- [Graceful degradation and isolation — contain the blast radius](#graceful-degradation-and-isolation--contain-the-blast-radius)
- [Design for failure, then rehearse it](#design-for-failure-then-rehearse-it)
- [The engineering posture](#the-engineering-posture)
- [Anti-patterns and pre-flight checklist](#anti-patterns-and-pre-flight-checklist)

---

## Failure models — how badly can a node misbehave

Before you can tolerate failure you must say *what kind* of failure, because the cost of tolerating it scales hard with how badly a node is allowed to behave. The failure models form a ladder from easy to hard, and the first move of `failure-model-and-detection-honest` is to climb only as high as your reality forces you to.

| Model | What a node may do | What it costs to tolerate |
|---|---|---|
| **Crash-stop** | works correctly, or stops completely and never returns | simplest — *detect* it's gone and route around it |
| **Crash-recovery** | crashes, then later returns (maybe with persisted state, maybe having lost in-memory state) | the returned node may be **stale**, may have missed messages, may reappear as a **zombie** — needs state recovery + fencing |
| **Omission** | drops *some* messages, otherwise fine | no extra nodes — make every handler **idempotent** and retransmit (the at-least-once recipe) |
| **Byzantine** | behaves **arbitrarily** — lies, sends contradictory messages to different peers, is buggy or maliciously controlled | the hardest — needs **3f+1** nodes to tolerate f failures |

> **Crash-stop** is the kind everyone hopes for: a node either gives the right answer or it halts cleanly and stays halted. You "only" have to notice it is gone and stop depending on it. **Crash-recovery** is harder because the corpse can sit up: a node that crashed and came back may be running on its pre-crash persisted state (stale), may have lost everything in memory, and may not know it missed a leadership change while it was down — the **zombie** — the returning-node hazard that, for a *leader*, becomes the [split-brain of the replication stage](replication.md#failover--the-single-most-dangerous-operation). A returning node needs careful state recovery *and* fencing before it is allowed to act.

**Omission** is the odd rung — not really a separate model so much as the lossy network of [enemies 1 and 2](the-three-enemies.md#the-third-state--the-spine-of-everything) seen at the node level: the node answers correctly when it answers, but silently drops some messages. So you already own the fix from the [communication stage](communication.md#timeout-retry-backoff) — **at-least-once delivery + idempotency + retransmit/dedup**. You don't add *nodes* for omission; you make every operation safe to receive twice or not at all. (That orthogonality is why the cost column gives it no node count.)

The big jump is the last rung:

> **Byzantine failure is a node behaving ARBITRARILY** — not just silent, but *wrong on purpose or by corruption*: it lies, it tells peer X one thing and peer Y the contradictory thing, it has a bug that produces garbage, or an attacker controls it. This is the hardest model, and the price is concrete: tolerating **f Byzantine failures requires 3f+1 nodes**, where reaching *agreement* despite the same f *crash* failures needs only **2f+1** (a surviving majority — and merely *detecting* a crash and routing around it needs just **f+1**, one survivor). The extra Byzantine nodes buy the ability to outvote liars who may also be sending different lies to different observers. BFT (Byzantine fault tolerance) is dramatically more expensive in nodes, messages, and protocol complexity.

The practical judgment the check wants is the one about *where* malice lives:

> **Inside your own datacenter, default to NON-BYZANTINE (crash) failures — do not pay for BFT.** You trust your own nodes; a crash, an omission, a slow link is the realistic threat, not a node that lies to its neighbors. BFT's cost is justified only where you genuinely **cannot trust the participants**: **blockchains** (mutually distrusting parties), **aerospace and safety-critical control** (radiation bit-flips that make a node compute arbitrary wrong answers), and **adversarial environments**. Naming the model honestly means choosing the *cheapest* one your trust boundary allows — usually crash-stop or crash-recovery — and reserving 3f+1 for the rare place that earns it. This crash-vs-Byzantine decision, and the 2f+1 / 3f+1 it implies, is the first half of `failure-model-and-detection-honest`. (The node counts here are the same [majority-quorum arithmetic](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) the consensus stage built — 2f+1 is just "a majority survives f crashes"; BFT raises the bar to 3f+1 because some of the survivors may be lying.)

---

## Failure detection — why it is doomed to be a guess

Having named *what* a node may do, you need to *notice* when one has done it. The mechanism is universal and humble: **heartbeat + timeout.** Each node periodically emits "I'm still alive"; if no heartbeat arrives within a window T, you declare it dead. And the moment you write that rule, the [STAGE 0 ghost](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) returns to collect:

> **You cannot reliably distinguish "the node died" from "the node (or the network) is just slow."** In an asynchronous network delay has no upper bound, so a missing heartbeat never *proves* death — it might mean the node is alive and merely behind, or the heartbeat is alive and merely in flight. **Failure detection is therefore a GUESS, not a measurement.** A timeout firing is a *decision* to treat a node as dead; it is not a fact that the node is dead. This is the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) and the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything), wearing the costume of a monitoring system.

So every detector lives on the horns of the timeout dilemma, and there is no setting that escapes both:

| Timeout | Buys | Costs |
|---|---|---|
| **Too short** | fast detection of real deaths | **many false positives** — a slow-but-alive node judged dead → needless failover, **flapping**, the [STAGE 5 rebalance cascade](sharding.md#rebalancing--move-the-minimum-and-keep-a-human-in-the-loop) |
| **Too long** | few false positives | **slow discovery** — requests pile up behind a corpse, latency spikes, resources leak |

The dilemma is not a missing optimization waiting for a cleverer engineer. It is a [fundamental limit](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess): **no perfect failure detector exists under asynchrony.** The impossibility is one-sided, and worth getting right — completeness (every real death is *eventually* detected) you can always have for free (a detector that suspects everyone is trivially complete); it is **accuracy** (never wrongly suspecting a live node) that cannot be guaranteed when delay is unbounded, and a *perfect* detector needs both. So every real detector trades away some accuracy to keep completeness — it *will* sometimes suspect a healthy-but-slow node. Stop hunting for the perfect timeout; it does not exist. What you *can* do is be smarter than a binary verdict:

> **Prefer a PHI-ACCRUAL detector to a hard dead/alive threshold.** Instead of "heartbeat late by more than T ⇒ dead," a phi-accrual detector outputs a continuous **suspicion value** (phi) that rises the longer a heartbeat is overdue, computed from the recent distribution of inter-arrival times — derived *from* the probability that a heartbeat is already this late, but not itself a probability (phi is unbounded — it climbs without ceiling as the silence drags on) — and **self-adapts to network jitter**: when the network has been bumpy it widens its expectations; when it has been crisp it tightens them. Downstream logic chooses its own threshold on that suspicion number for its own blast radius. **Cassandra and Akka** use exactly this. The win is that the detector degrades its confidence gradually rather than flipping a node from "fine" to "dead" the instant one heartbeat is late behind a transient hiccup.

And the cost to respect above all others:

> **Watch the COST OF A FALSE POSITIVE — it is often worse than the slowness it reacts to.** A flapping node wrongly judged dead triggers a failover and a rebalance — a mass data move, a leader election, a cutover — that is **more destructive than the original slowness** would ever have been. One slow node plus an over-eager detector plus automatic reaction is a [Cook cascade](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp): exactly Cook's warning that **change introduces new failure modes.** The reaction to a suspected failure is itself a new failure mode, and a detector tuned to fire fast manufactures them. Treating detection as the guess it is — tuned for the blast radius of being wrong, accrual not binary, and humble about the cost of acting — is the second half of `failure-model-and-detection-honest`.

---

## Redundancy — the basic move, with one big precondition

The most basic answer to "parts will break" is the oldest one: **keep spares.** And the organizing principle is a single instruction:

> **Eliminate single points of failure (SPOF).** Find the component whose failure takes *everything* down — the one load balancer, the one coordinator, the one shared library every service links, the one database with no replica — and add redundancy so its loss is survivable. A SPOF is the place where the whole "reliable whole from unreliable parts" promise collapses to "as reliable as this one part," so hunting SPOFs and giving each a spare is the first half of `redundancy-without-correlation`.

But redundancy carries a precondition so often ignored that forgetting it is the headline failure of this section:

> **Redundancy only masks INDEPENDENT failures.** Two replicas protect you only if they cannot fail *together*. **Correlated failure makes redundancy useless** — if your "redundant" copies sit in the **same rack**, the **same room**, behind the **same power feed**, or run the **same buggy software version**, then **one event takes them all out at once**: the rack loses power, the room floods, the bad deploy crashes every replica on the same null-pointer. You bought N copies and got the fault tolerance of one, while paying for N — the redundancy is illusory.

So real redundancy is a statement about *fault domains*, not just node count:

> **Spread redundancy across FAULT DOMAINS and avoid shared dependencies.** A fault domain is a boundary inside which a single event can take everything down — a rack, an **availability zone**, a **region**, a power feed, a network segment, a deploy unit. Put your replicas in *different* domains so no single event can claim two of them, and audit for **shared dependencies** (the common config service, the common certificate, the common library version) that secretly re-correlate replicas you thought were independent. The right question is never "how many copies do I have?" but "**what single event could take more than one of them at once?**" — and the answer must be "none that the application can't survive." This independence-across-fault-domains requirement is the heart of `redundancy-without-correlation`. (It is the deeper reason a [consensus cluster wants odd nodes spread across AZs](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap): three replicas in one rack tolerate zero rack failures, however the quorum math reads.)

---

## Failover and recovery — and MTTR over MTBF

When a redundant component dies, **failover** is the act of switching to the spare; **recovery** is the act of bringing the dead one safely back. The replication stage already walked the hardest instance of failover — [leader failover, the single most dangerous operation](replication.md#failover--the-single-most-dangerous-operation) — and it is worth seeing that **leader failover is a special case of the general failover problem**, with all the same teeth:

- **detection is imperfect**, so you may be cutting over because of a guess that was wrong (the false positive above);
- you must **cut over cleanly** — one authoritative successor, not two contenders;
- you must **prevent split-brain by FENCING the old component** so a merely-slow predecessor that revives cannot keep acting (STONITH — "Shoot The Other Node In The Head" — or fencing tokens, exactly as in [replication](replication.md#failover--the-single-most-dangerous-operation)) — without the fence, the zombie of the crash-recovery model corrupts data;
- you must **not lose in-flight state** at the cutover seam.

Recovery is the mirror image and has its own non-negotiable:

> **A returning node must CATCH UP before it serves, and must NEVER serve stale data.** A node that crashed and came back is a [crash-recovery node](#failure-models--how-badly-can-a-node-misbehave): it may be running on state from before the crash, ignorant of everything that happened while it was down. It must first **replay its log / sync state** to the current truth, *then* be **safely re-admitted** — fenced until it is current, so it cannot serve a stale read or, worse, act as a zombie leader. A node that starts serving the instant it boots, before catching up, is a stale-read or split-brain bug waiting for its first request.

And the orientation that should govern how much you invest in all of this — echoing the SRE framing of the SE suite:

> **Since failure is unavoidable, optimize MTTR over MTBF.** **MTBF** (mean time *between* failures) is the "make it never break" axis; **MTTR** (mean time *to recovery*) is the "make it recover fast when it breaks" axis. Because the first law of this stage is that it *will* break, **making recovery fast and automatic almost always buys more reliability than chasing a higher MTBF** — a system that fails every week but heals itself in 10 seconds is more available than one that fails twice a year and is down for six hours each time. Fast, automatic, *rehearsed* recovery beats the fantasy of "never fails." Doing failover right — fence, catch up, no zombie, no stale read — and spending your reliability budget on MTTR is the recovery half of `redundancy-without-correlation`.

---

## Graceful degradation and isolation — contain the blast radius

Redundancy and recovery keep the dead parts from sinking you. This section keeps the *living* parts from being dragged down with them when something breaks anyway. The principle:

> **When part of the system breaks, DEGRADE GRACEFULLY — don't collapse wholesale.** Return **cached or stale data** when the fresh source is down; **turn off non-core features** to protect the core; **shed excess load** rather than melt under it; **give partial results** instead of no results. Fail **soft**, not total. A product page that renders without the live recommendation strip is degraded; a product page that 500s because the recommendation service is slow is collapsed — and the difference is entirely in whether the design treated that dependency as optional.

Graceful degradation is the goal; the mechanisms that achieve it are a small set of **defenses that break the cascade** — because, as [Cook insists, disasters are cascades](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp): one degraded component plus a structure that propagates the degradation.

> **BULKHEAD** — compartmentalize resources so a failure in one place cannot consume all of them and sink the whole ship. Give each dependency its **own thread pool / connection pool**, so that when dependency C goes slow, only C's pool fills up — the threads waiting on C cannot exhaust the threads serving everything else. The name is the ship's bulkhead: a breach floods one compartment, not the hull. This is the direct antidote to the [synchronous-chain cascade](communication.md#the-sync-vs-async-axis--and-the-cascade) where one slow dependency drains every thread in the caller.

> **CIRCUIT BREAKER** — for a dependency that is *persistently* failing, simply **STOP CALLING IT.** After N failures the breaker **opens**: calls fail fast locally instead of piling onto a service that is already down; after a cooling window it lets a probe through, and **closes** again only if the dependency has recovered. This is what kills the [retry storm](communication.md#timeout-retry-backoff) of the communication stage — the self-inflicted DDoS where every client hammers a struggling service into a dead one — and it severs the resource-exhaustion cascade at its source by refusing to feed it.

> **BACKPRESSURE / RATE-LIMITING / LOAD-SHEDDING** — when you are overwhelmed, **actively push back or drop excess requests.** **Rejecting early beats dying wholesale**: a fast `429`/`503` to the marginal request keeps the system alive for the requests it *can* serve, whereas accepting everything until you fall over serves *nobody*. Backpressure also makes the overload **visible** (a growing queue, a rising reject rate) instead of hiding it until collapse.

> **TIMEOUTS EVERYWHERE** — **never wait infinitely on a dependency.** A call with no timeout hangs forever the instant the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) appears, and a hung call holds a thread, and held threads are how a bulkhead fills and a service dies. Every remote call needs a bound (ideally a propagated deadline, per the [reliable-call recipe](communication.md#timeout-retry-backoff)) — the timeout is the thing that *lets* the bulkhead and breaker work at all.

The shared purpose under all four is one sentence, and it is the whole of `blast-radius-contained`:

> **Keep the BLAST RADIUS SMALL.** Accept that things break — then make sure one part's failure cannot drag down the whole. Bulkheads stop a failure from spreading by resource exhaustion; circuit breakers stop it from spreading by retry amplification; backpressure stops it from spreading by overload; timeouts stop it from spreading by held resources. Together they are the **engineering embodiment of Cook's "defense in depth"** — layered, independent barriers, no one of which has to be perfect, arranged so the failure that gets past one is caught by the next.

---

## Design for failure, then rehearse it

The mechanisms above only help if the system was built expecting to need them. So the governing design philosophy:

> **DESIGN FOR FAILURE — treat failure as the DEFAULT path, not an exceptional branch.** This is the [third-state lesson](the-three-enemies.md#the-third-state--the-spine-of-everything) at system scale: just as every remote call needs a branch for "I don't know," every component needs a planned answer to "what happens when my dependency is down / slow / lying?" If the failure path is an afterthought — an `except` clause nobody tested — it will be exercised for the first time during the incident, which is the worst possible moment to discover it doesn't work.

And the move that turns "designed for failure" from a claim into knowledge:

> **CHAOS ENGINEERING — proactively inject failures to learn the failure modes BEFORE a real incident.** Kill nodes, add latency, drop packets, partition the network, fail a dependency — on purpose, in a controlled setting (**Chaos Monkey**, **game days**) — and watch whether the bulkheads hold, the breakers open, the failover fences, the degradation degrades. This directly answers [Cook's line that "running without failure requires experience dealing with failure"](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp): you cannot have that experience if the only failures you've ever seen are the real ones. The blunt statement of *why*:

> **A system whose failure modes you have NEVER rehearsed is one whose real reliability you do not actually know.** Untested failover is a hope, not a capability; an unexercised circuit breaker is a config value, not a defense. The reliability you can *claim* is exactly the reliability you have *rehearsed* — everything else is a guess about how unfamiliar machinery will behave under stress, which is the category of guess that produces 3 a.m. pages. Designing for failure and then *exercising* it closes `blast-radius-contained`. (Running these exercises in production — game-day operations, the live chaos practice, the incident response when something fires anyway — is the SRE craft and **routes to `stationkeeping`**; holdfast's job is to make the design *worth* rehearsing.)

---

## The engineering posture

Close on the stance, because the mechanisms are not the deliverable — the worldview that makes you reach for them is.

> **The whole of fault tolerance is turning Cook's essay into code.** First, *acknowledge the world Cook describes*: the system **runs degraded all the time** (some node is always slow, some disk always dying), **disasters are cascades** of several aligned failures rather than one root cause, and **safety is a property of the WHOLE, not of any component** — no single node is "the safe one," safety is produced by how the parts behave together under failure. Then *build against that world in layers*: **redundancy** (across independent fault domains), **detection** (humble, accrual, tuned for the cost of being wrong), **isolation** (bulkheads, breakers, backpressure, timeouts), **fast recovery** (MTTR over MTBF, fence and catch up), and **active rehearsal** (design for failure, then chaos-test it). No single layer is sufficient; the reliability is **emergent** from all of them, which is Cook's defense-in-depth stated as an architecture.

That is why this stage sits so late in the map: it does not introduce a new enemy, it *systematizes the response* to every enemy the earlier stages met. The failure model names *what* can go wrong; detection notices it (and accepts it cannot do so perfectly); redundancy survives it (if the failures are truly independent); failover and recovery heal it (fast, fenced, caught-up); isolation contains it (small blast radius); and chaos engineering proves the whole arrangement actually works *before* the night it has to.

For an agent the lever is the suite's usual one. An agent writes the **happy path** — the call that assumes the dependency answers, the failover it never fences, the retry with no breaker, the single replica it never spreads across AZs — because it feels none of the future outage that proves the failure path was missing, and it will never *rehearse* a failure mode it cannot imagine. So fault tolerance must be **judged and gated**, not trusted to instinct: name the failure model honestly, make detection a humble guess, prove the redundancy is uncorrelated, contain the blast radius in layers, and rehearse it. The version that has been *exercised under injected failure* is the one whose reliability you can actually claim — and the one that ships. The architectural call of *how much* reliability to buy belongs to `load-bearing`; **running** the degraded system in production — SRE, on-call, real chaos days, incident response, blameless postmortems — belongs to `stationkeeping`. holdfast's job is to make the design tolerate failure *by construction*, before any of it is operated.

---

## Anti-patterns and pre-flight checklist

Run this before calling a fault-tolerance design correct. Each line is a failure this stage exists to prevent.

- **Treating failure as an exception, not the default** — with enough nodes *something* is always broken; build for the degraded background state, don't bolt tolerance on for the bad day. (`failure-model-and-detection-honest`)
- **Not naming the failure model** — designing without saying whether you face crash-stop, crash-recovery, omission, or Byzantine; you cannot tolerate a failure class you never named. (`failure-model-and-detection-honest`)
- **Paying for BFT (3f+1) inside a trusted datacenter** — Byzantine tolerance is for *untrusted* participants (blockchain, aerospace bit-flips, adversarial settings); default to crash faults (**2f+1**) where you trust your own nodes. (`failure-model-and-detection-honest`)
- **Treating a failure-detection timeout as a fact** — it cannot tell *slow* from *dead* (STAGE 0); it is a guess. Design for the false positive; don't act as if the node is provably dead. (`failure-model-and-detection-honest`)
- **A timeout set too short** — false-positives a slow-but-alive node into "dead," triggering needless failover, **flapping**, and the [STAGE 5 rebalance cascade](sharding.md#rebalancing--move-the-minimum-and-keep-a-human-in-the-loop); prefer a **phi-accrual** detector and respect that a false positive often hurts more than the slowness. (`failure-model-and-detection-honest`)
- **Leaving a single point of failure** — the one load balancer, the one coordinator, the one shared library; find it and give it a spare. (`redundancy-without-correlation`)
- **Trusting redundancy against correlated failure** — replicas in the same rack / AZ / power feed / software version die from **one** event; the redundancy is illusory. Spread across **fault domains** and audit shared dependencies. (`redundancy-without-correlation`)
- **Failing over without fencing** — a merely-slow old component revives as a **zombie** and you have [split-brain](replication.md#failover--the-single-most-dangerous-operation); fence it (STONITH / fencing tokens). (`redundancy-without-correlation`)
- **Letting a recovering node serve before it catches up** — it serves **stale** data or acts as a zombie; make it replay/sync and be safely re-admitted *first*. (`redundancy-without-correlation`)
- **Chasing MTBF while ignoring MTTR** — since failure is inevitable, fast automatic **recovery** usually buys more availability than chasing "never fails." (`redundancy-without-correlation`)
- **Collapsing instead of degrading** — 500-ing because an *optional* dependency is slow, when you could serve cached/stale data, shed the non-core feature, or return a partial result. Fail soft. (`blast-radius-contained`)
- **No bulkheads** — one slow dependency drains every thread/connection and sinks the whole service; give each dependency its own pool. (`blast-radius-contained`)
- **No circuit breaker on a failing dependency** — piling retries onto a service that's already down is how its outage becomes yours (the [retry storm](communication.md#timeout-retry-backoff)); open, fail fast, probe. (`blast-radius-contained`)
- **No backpressure / load-shedding** — accepting every request until you fall over serves nobody; **reject early** and stay alive for what you can serve. (`blast-radius-contained`)
- **A call with no timeout** — hangs forever the instant the [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) appears, holding the thread that fills the bulkhead; bound every remote call. (`blast-radius-contained`)
- **Never running a chaos / game-day exercise** — a failure mode you've never injected is one whose real blast radius you'll first learn in production; design for failure, then *exercise* it. (`blast-radius-contained`)

The engineering posture under every one of these: **failure is the constant background, so a correct design builds a reliable whole from unreliable parts in layers** — naming the failure model, treating detection as a humble guess, making redundancy *independent*, recovering fast and fenced, containing the blast radius, and rehearsing the whole arrangement before the incident. You are not eliminating failure; you are arranging for it to be survivable, and *proving* it is.

---

**Cross-links:** [the-three-enemies.md](the-three-enemies.md) ([enemy 1 — partial failure](the-three-enemies.md#enemy-1--partial-failure) and "[failure is the background](the-three-enemies.md#enemy-1--partial-failure)" this stage is the pay-off of; the [slow-vs-dead keystone](the-three-enemies.md#the-keystone--where-enemies-1-and-2-meet-a-timeout-is-a-guess) and [third state](the-three-enemies.md#the-third-state--the-spine-of-everything) behind detection-as-a-guess; the [first law](the-three-enemies.md#the-first-law--dont-distribute-until-you-must) — the cheapest failure is the one you avoided by not distributing; and [Cook's framing](the-three-enemies.md#the-cook-framing--the-intellectual-on-ramp) — degraded-as-normal, disasters-as-cascades, safety-as-a-system-property, "change introduces new failure modes" — that this whole stage turns into code) · [communication.md](communication.md) (the [retry storm](communication.md#timeout-retry-backoff) the circuit breaker kills, the [reliable-remote-call recipe](communication.md#timeout-retry-backoff) — timeout + bounded-retry + idempotency + breaker — fault tolerance reuses wholesale, and the [synchronous-chain cascade](communication.md#the-sync-vs-async-axis--and-the-cascade) bulkheads contain) · [replication.md](replication.md) ([leader failover as the special case](replication.md#failover--the-single-most-dangerous-operation) of the general failover problem — fencing, split-brain, and the zombie this stage generalizes) · [sharding.md](sharding.md) (the [rebalance cascade](sharding.md#rebalancing--move-the-minimum-and-keep-a-human-in-the-loop) a false-positive failure detection triggers — and why a human stays in the loop) · [consistency-and-consensus.md](consistency-and-consensus.md) (the [majority-quorum arithmetic](consistency-and-consensus.md#quorums-and-cluster-sizing--the-concrete-mechanism-of-cap) behind 2f+1, and [consensus](consistency-and-consensus.md#consensus--the-algorithmic-core) — what the 3f+1 BFT bound extends, and what a fenced leader election runs on) · [../SKILL.md](../SKILL.md) (STAGE 6 — Fault tolerance, the gated flight plan this reference serves). The one later stage builds directly on top of this floor: **distributed transactions & coordination** (STAGE 7 — 2PC/Saga, leader election, distributed locks, ZooKeeper/etcd) — the coordination machinery that *assumes* the fault tolerance here is already in place; this file only points to it. Sibling skills this stage routes to: **`load-bearing`** (the architecture decision — how much reliability to buy, where the fault domains fall, the availability target as a *design* choice) · **`stationkeeping`** (running the degraded system in production — SRE, on-call, live chaos days and game days, incident response, blameless postmortems) · **`gauge`** (encoding "this dependency is optional / this result is degraded / this read may be stale" in the type so a fallback can't be silently forgotten) · **`plumb`** (keeping the bulkhead, breaker, and failover plumbing legible) · **`assay`** (testing the failure paths — failover, breaker-open, degradation, recovery — the cases and the doubles) · **`flightline`** (the schema/version evolution a recovering or failed-over node must survive across mixed versions).

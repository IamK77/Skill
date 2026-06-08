# Realizing Non-Functional Requirements

This reference is the depth behind **STAGE 4 (Non-functional realization)** of [the load-bearing skill](../SKILL.md). STAGE 4 opens it after the style, the boundaries, the stack, the contracts, and the data model are settled — because nearly every non-functional quality is a *consequence* of those earlier decisions, and most cannot be retrofitted once the architecture is poured. Your job here is to take each funded NFR that `groundwork` recorded (scalability, availability, performance, security, observability) and produce two things per class: the **design decision** that realizes it, and the **machine-enforced guardrail** that stops an agent from silently regressing it later. A decision without a guardrail is a wish; in the agent era it is a wish a confident agent will undo the next time it touches the code.

The agent-era twist runs through every section below. An agent produces **plausible-but-slow** and **plausible-but-unsafe** code with total confidence, feels **no cost** adding complexity, and **cannot feel production pain** — it never gets paged at 3am for the N+1 query it wrote. So NFRs cannot be left to the agent's judgment the way a senior engineer's instinct once carried them. Each one becomes an *executable constraint* the build can check, or it erodes at agent speed. See [agent-era-shifts.md](agent-era-shifts.md) for why this is structural, not stylistic.

Cross-links: the data model that several of these NFRs ride on is in [data-design.md](data-design.md); the decisions you make here are one-way doors that earn an ADR in [adr-and-evolution.md](adr-and-evolution.md); the master reversibility triage and escalation ladder live in [decision-tree.md](decision-tree.md).

---

## The gate you are clearing

STAGE 4 has one checklist check, and everything in this file exists to make it true:

- **`nonfunctional nfrs-realized`** — each funded NFR turned into a concrete design decision **AND** a guardrail that enforces it (secure-by-default + SAST, perf budget in CI, observability hooks, enforced KISS/YAGNI) — because agents produce plausible-but-unsafe/slow code confidently and feel no cost adding complexity.

The check is not satisfied by a paragraph of intentions. It is satisfied when, for every NFR you funded, there is a decision recorded in an ADR **and** an automated check that goes red when the decision is violated. "We will be secure" is not a realization. "Auth is a secure-by-default framework; Semgrep + dependency scanning run on every PR and block merge" is.

---

## The one law: NFRs are poured, not bolted on

A functional bug is local — a wrong function, a wrong branch — and an agent can refactor it freely behind a two-way door. A non-functional failure is **architectural**: it lives in the shape of the system, not in one place. You cannot make a synchronous request-per-row design "scalable" with a patch; you cannot make a system that logs nothing "observable" by adding a logger to one handler; you cannot bolt authorization onto a data model that never carried a tenant boundary. These are one-way doors, and the master axis of this whole skill — reversibility — applies hardest here.

So the sequence is fixed:

1. **Decide** the structural approach while the architecture is still wet (this stage, against the weight class from STAGE 0).
2. **Encode** the decision as a guardrail the build enforces, so the next agent cannot regress it without going red.
3. **Record** the decision and its rejected alternatives as an ADR (STAGE 5), so the next *session* — which starts blind — does not undo it for a shorter path.

Skip step 2 and the human era's safety net is gone. A human engineer felt friction violating an NFR — adding a blocking call in a hot path *felt* wrong, an unauthenticated endpoint *looked* alarming. An agent feels nothing. The friction has to be moved out of the human's gut and into CI.

---

## TREE N — Does this NFR earn realization, and how heavy?

Run **once per funded NFR** from the `groundwork` ledger. Not every system needs every quality at full strength; over-realizing an NFR is the same KISS/YAGNI violation as a speculative abstraction, just wearing a respectable suit. Match the realization to the weight class set in STAGE 0 (blast radius × change frequency × collaborators).

Every fork carries the three-part discipline so two agents realizing the same NFR land in the same place:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot yet answer the predicate.

```
N1. Did groundwork fund this NFR with a measurable target (a number, an SLO, a threat in scope)?
    PREDICATE: is there a fit criterion you could write a failing test against?
    ├─ YES → it earns a decision + a guardrail. Go to its section below.
    └─ NO  → do NOT invent a target to look thorough. Either pull the number from the user
             (one sharp question) or record it as explicitly out of scope. An unquantified
             NFR cannot be enforced and is not realized — see groundwork's NFR catalog.

N2. Is the blast radius of getting this NFR wrong high (money, data integrity, breach, outage)?
    PREDICATE: from the STAGE 0 dials — does failure here touch a one-way door?
    ├─ YES → realize it AND guard it now; this is exactly where scarce human judgment goes.
    └─ NO  → realize the decision, pick the lightest guardrail, and note it as low-stakes.

N3. Is the realization itself reversible (a cache you can add later) or irreversible
    (a trust model, a sharding key, a stateless/stateful split others build on)?
    PREDICATE: can an agent retrofit this cheaply once data proves it's needed?
    ├─ REVERSIBLE   → do NOT pre-build it. Design so it CAN be added; add it when measured.
    │                 (Premature optimization is this branch taken wrongly.)
    └─ IRREVERSIBLE → decide it now, with care, and an ADR. You will not get a cheap second chance.
```

**DEFAULT** when an NFR's weight is unclear: realize the decision at the lean end and install the guardrail anyway — a guardrail is cheap insurance and surfaces the real load when it arrives. **FALLBACK** when you cannot answer N1 (no target exists): you are not ready to realize it; the *requirement* is unsettled. Stop and get the number, or scope it out explicitly. Realizing an NFR against an imagined target produces a precise solution to the wrong constraint.

**One-line worked leaf —** *"NFR = 'p99 checkout latency < 300ms' → N1 YES, a number → N2 high blast radius (revenue) → N3 caching is reversible but the async/sync split of the payment call is not → decide the split now, guard latency with a perf budget in CI."*

---

## The per-class realization table

For each NFR class: the design decision you make, and the enforced guardrail that holds it. Read down the column for your funded NFRs; the prose sections after expand each.

| NFR class | Core design decision (decide now) | Enforced guardrail (so an agent can't silently regress it) |
|---|---|---|
| **Scalability** | Horizontal vs vertical; what is **stateless**; sharding / partitioning key | **Load / perf budget** test against the target throughput; a CI check that fails if a new shared-state field breaks horizontal scaling |
| **Availability** | Redundancy, failover path, **blast-radius isolation** (bulkheads), graceful degradation | **Chaos / failure-injection tests** that kill a dependency and assert the system degrades instead of cascading |
| **Performance** | Where to **cache**, where to go **async / queue**, the read/write path budget | A **PERF BUDGET enforced in CI** — query-count and latency assertions so an agent's N+1 fails the build |
| **Security** | authn / authz model, **defense-in-depth**, secure-by-default framework, secrets handling | **Automated SAST + dependency scanning IN THE LOOP** on every PR — agents introduce vulns at scale and with confidence; this cannot be judgment |
| **Observability** | Structured logs, metrics, traces, **correlation IDs** as designed-in hooks | A check that new endpoints/handlers emit the required structured fields; trace propagation asserted, not assumed |

The pattern is identical across every row: **a structural decision the agent must not reverse, paired with a red-on-violation check that no agent can talk its way past.** The decision is human judgment; the guardrail is what makes the judgment survive a stateless fleet.

---

## SCALABILITY — design for horizontal first, enforce statelessness

**The decision.** Decide *where state lives* before you write a line. The cheapest scaling story is **horizontal** (add identical instances behind a load balancer), and it is unlocked by one property: the request-handling tier is **stateless** — no session in process memory, no local file the next request depends on, no in-process cache treated as the source of truth. State goes to a shared store (DB, cache, object storage) that is itself the thing you scale or shard. Vertical scaling (a bigger box) is the lazy default that hits a ceiling and a single point of failure; reach for it only when the weight class is genuinely small and likely to stay that way.

If you will shard or partition, the **partition key is a one-way door** — re-keying a populated dataset is a migration on the order of the data-model changes in [data-design.md](data-design.md), and agents do not make that cheaper. Choose the key by the dominant access pattern (the one that must stay fast at scale), not by what is convenient to write today.

**The agent failure this guards against.** An agent will cheerfully introduce process-local state — a module-level dict "cache", a counter, an in-memory rate limiter — because on one instance, in tests, it works perfectly and looks clean. It has no instinct that this silently breaks the moment you run a second instance. The friction a human felt ("wait, that won't work behind a load balancer") is absent.

**The guardrail.**
- A **load test against the funded throughput target** that runs (at least nightly) and fails below the SLO — so a regression that halves throughput is caught mechanically, not in production.
- A **statelessness check**: a lint/fitness rule that flags mutable module-level/static state in the request tier, or a test that runs the handler tier across two instances and asserts no cross-request leakage. Encode it (see machine-enforced boundaries in [boundaries-and-contracts.md](boundaries-and-contracts.md)) so "stateless" is executable, not a comment.

**DEFAULT** when scale is uncertain: build stateless from day one (it costs little and unlocks everything) but do **not** shard until data shows a single store is the bottleneck — sharding pre-emptively is premature optimization wearing a scalability badge.

---

## AVAILABILITY — isolate the blast radius, then prove it under failure

**The decision.** Availability is bought with **redundancy** (no single point of failure on the critical path), a **failover** path that is actually exercised, **blast-radius isolation** (bulkheads — one failing dependency must not take the whole system down), and **graceful degradation** (a partial answer beats a 500). Decide, per critical dependency: when it is down or slow, does the system fail closed, fail open, serve stale, or degrade to a reduced feature set? This is a design decision because the *seams* that make degradation possible — timeouts, circuit breakers, fallbacks, queue-and-retry — must be present in the structure; you cannot sprinkle them on later.

This is where the CAP trade-off from [data-design.md](data-design.md) becomes concrete: under a partition you chose either consistency or availability, and the availability behavior here must match that choice.

**The agent failure this guards against.** An agent writes the **happy path** by default and confidently. It adds a downstream call with no timeout, no retry budget, no fallback — because the call works in the test and the failure path is invisible. The result is a system that cascades: one slow dependency exhausts the connection pool and the whole service falls over. The agent never felt the outage, so it never designed for it.

**The guardrail.**
- **Chaos / failure-injection tests**: kill or slow a dependency in a test environment and assert the system degrades gracefully (returns a fallback, sheds load, trips a breaker) instead of hanging or cascading. This is the `assay` chaos overlay — it belongs in the build for any system whose availability was funded.
- A **timeout/retry lint**: a rule that flags any external call without an explicit timeout and bounded retry, so an agent cannot add an unbounded blocking call.
- A **failover drill** run on a schedule (not just written once), because a failover path that is never exercised is decoration.

**DEFAULT** when the degradation policy is unclear for a dependency: fail closed on anything touching money/auth/data integrity, degrade-and-serve-stale on read-only enrichment — and write the chaos test that pins whichever you chose.

---

## PERFORMANCE — decide cache and async placement, enforce a budget in CI

**The decision.** Two structural questions, decided now: **where to cache** (which reads are hot, idempotent, and tolerant of staleness — those earn a cache and an invalidation rule) and **where to go async / queue** (which work does not need to block the user — email, thumbnails, indexing, webhooks — moves off the request path onto a queue). Both are about the *shape* of the read and write paths. The latency budget for the critical path is a sum of its parts; decide the budget per hop so a regression has a number to fail against.

Critically, most caching is a **reversible** decision (N3) — you can add a cache once measurement proves a read is hot. So do **not** pre-cache everything; that is premature optimization, and it adds invalidation complexity an agent will happily generate and you will pay to maintain forever. Decide *where caching is possible* (the seam) now; *add* the cache when data demands it.

**The agent failure this guards against.** This is the canonical one: an agent writes a clean-looking loop that issues **one query per row** — the N+1 — and it passes every functional test because the data is correct. It is plausible, confident, and quietly O(n) round-trips. The agent cannot feel the 2-second page load it just created. Multiply that across a fleet writing features in parallel and performance dies by a thousand confident cuts.

**The guardrail — a PERF BUDGET enforced in CI. This is the one that catches the N+1.**
- A **query-count assertion** around the hot endpoints: the test asserts the handler issues at most *k* queries; the N+1 makes it issue *n*, and the build goes red. This is the single highest-leverage NFR guardrail in the agent era because it converts an invisible, confident mistake into a hard failure.
- A **latency budget test**: a stated threshold (from the funded SLO) the test fails below, run on representative data — not a one-row fixture that hides the N+1.
- A **bundle-size / payload-size budget** where it matters (front-end, mobile), since an agent adding a heavy dependency feels no weight cost.

Encode these with the `assay` performance overlay so the budget is a hard threshold, not a vibe.

**DEFAULT** when you cannot yet measure: install the query-count and latency assertions on the critical endpoints anyway, with generous-but-finite thresholds — a ceiling that only fires on a real regression. Tighten as real data arrives. **Never** optimize a path before the budget shows it is the bottleneck.

---

## SECURITY — secure-by-default, defense-in-depth, and SAST in the loop

**The decision.** Security is the NFR least forgivable to bolt on, because the **trust model is a one-way door**: who can do what, where the boundaries are, what is authenticated vs authorized. Decide it explicitly:

- **authn / authz**: how identity is established, and authorization checked at every boundary — not just the UI. Default-deny; an endpoint with no explicit authz is a hole.
- **Secure-by-default framework**: choose a stack whose defaults are safe (parameterized queries / ORM that escapes by default, output encoding, CSRF protection, secure session handling) rather than one that requires the developer — or agent — to remember the safe path every time. This is also a tech-selection criterion; see [tech-selection.md](tech-selection.md).
- **Defense-in-depth**: no single control is the whole defense. Validate at the edge *and* enforce at the data layer; assume any one layer can be bypassed.
- **Secrets handling**: secrets come from a vault / secret manager / injected env, never the repo, never a log line, never a default value in code.

**The agent failure this guards against — and why this guardrail is non-negotiable.** Agents introduce vulnerabilities **at scale and with complete confidence**. They concatenate user input into a query (SQL injection) because string-building is the obvious path and the test passes. They echo a secret into a debug log. They reach for a dependency with a known CVE because it was common in the training corpus. They write `verify=False` to make an HTTPS call "just work." Every one of these looks correct and ships green. A human reviewer cannot catch them all by eye across a fleet writing thousands of lines. So security **cannot be left to judgment** — it must be in the loop, automated, blocking.

**The guardrail — automated SAST + dependency scanning IN THE LOOP.**
- **SAST** (Semgrep, CodeQL, or the language's analyzer) on **every PR**, configured to **block merge** on high-severity findings — injection, deserialization, path traversal, hardcoded secrets, `verify=False`/disabled TLS. Not a nightly report nobody reads; a gate.
- **Dependency / SCA scanning** (Dependabot, `npm audit`, `pip-audit`, `cargo audit`, Trivy) that fails the build on a known-vulnerable transitive dependency — because an agent's library choices outrun any human's CVE memory.
- **Secret scanning** (gitleaks / trufflehog) in the pre-merge gate, so a leaked credential is caught before it lands, not after.
- The strictest analyzer the toolchain offers, run as a build gate alongside tests (the same discipline `assay`'s language norms enforce).

**DEFAULT** when the threat model is thin: turn on the standard SAST/SCA/secret rule packs (they encode the OWASP-class mistakes agents make most) and default-deny on authz. **FALLBACK** when the trust model is genuinely unsettled: do not guess it — this is a one-way door; get the user to decide who is trusted with what, then realize it. Escalate per [decision-tree.md](decision-tree.md) rather than inventing a security posture.

**When the security NFR is a correctness invariant (auth / crypto / parsers).** If the funded risk is *not* an OWASP-class injection/secret mistake but the **correctness of a verification or trust-decision routine** — JWT/JWKS validation, signature checks, tenant/identity resolution, parser safety — then SAST/SCA/secret-scanning catches **none** of it. Realize it instead as:
- a **structural fail-closed default** poured into the control flow — no code path reaches the trusted branch without the check having returned ok; make the unverified state un-representable, not merely discouraged;
- a **negative-test pack** enumerating each abuse case: `alg:none`, alg-confusion (a symmetric key where an asymmetric one is expected), a missing/empty required claim, containment-vs-equality on a set-valued claim (e.g. `aud`), a stale key / unknown `kid`, expired-but-cached, fail-*open* on an unreachable dependency;
- a **structural guard that the verifier cannot reach trusted resources** — the pure-verification module does not import the DB/secret layer (see the intra-module import-ban FALLBACK in [boundaries-and-contracts.md](boundaries-and-contracts.md)).

First check whether the chosen library already enforces a clause natively (e.g. an audience/issuer/exp check) before hand-rolling — and verifying it — yourself.

---

## OBSERVABILITY — designed-in hooks, because the agent can't feel production

**The decision.** Observability is the NFR the agent has the least native incentive to build, precisely because **it cannot feel production pain** — it will never read the logs it failed to write. So the *system* must surface its own behavior, and the hooks must be designed in:

- **Structured logs** (key-value / JSON, not free-text), so failures are queryable, not grep-able prose.
- **Metrics** on the things an SLO is written against (latency, error rate, saturation, throughput — the golden signals).
- **Distributed traces** across service hops, so a slow request can be attributed to the hop that caused it.
- **Correlation / request IDs** propagated through every call and stamped on every log line and span, so one user's failing request can be reconstructed end to end across services and async boundaries.

These are *designed-in*: a correlation ID that is not threaded through from the entry point cannot be added at the leaf later, and a log that was never structured cannot be parsed retroactively. This is the "leave hooks in the architecture" point — observability is poured with everything else.

**The agent failure this guards against.** An agent ships a handler with no logs, no metric, no trace context — or with an unstructured `print("error")` — because the feature *works* and observability is invisible to a passing test. When that feature fails in production, there is nothing to debug with. The agent's blind spot here is total: it has no production feedback loop at all.

**The guardrail.**
- A **structured-logging fitness check**: a test/lint that asserts new request handlers emit the required structured fields (correlation ID, route, status, latency) and reject bare `print`/unstructured logging in the request path.
- A **trace-propagation test**: assert the correlation ID set at the entry point appears in a downstream span / log line — so propagation is verified, not assumed (it is exactly the kind of plumbing an agent drops).
- **Logging is part of the contract**: treat "emits these fields" the way you treat an API contract, so an agent building against it must satisfy it. (See contract-first discipline in [boundaries-and-contracts.md](boundaries-and-contracts.md).)

**DEFAULT** when unsure how much to instrument: emit a structured log + correlation ID + one latency/error metric on every external-facing endpoint as the floor — that floor is what makes the *other* NFRs' guardrails (the latency budget, the chaos test) meaningful, because they need signal to assert against.

---

## The closing gates: enforced KISS / YAGNI and no premature optimization

These are not NFRs in the SLO sense, but they are the meta-constraint that decides whether every decision above stays honest — and in the agent era they must be **gates, not hopes**. The human era relied on a deterrent that no longer exists: complexity was *tedious to write*, so engineers naturally resisted it. An agent feels none of that tedium. It will, on request and with a straight face, produce a speculative abstraction, a plugin system for one plugin, a "future-proof" config layer, a database-swap interface you will never exercise. The natural brake is gone, so the brake must be external.

**KISS / YAGNI as a gate.**
- For every abstraction, interface seam, or layer an agent adds for a *future* need: it does not pass unless a **funded, present** requirement demands it. "We might need to swap the database" is not a present requirement — it is the speculative abstraction this skill names as an anti-pattern. The reversibility logic backs this: adding the abstraction *when you actually need it* is now cheap (an agent does the mechanical refactor), so deferring it costs almost nothing and saves the maintenance of a thing you never use.
- A complexity guardrail in CI where it pays: cyclomatic-complexity / file-length / dependency-count fitness functions that flag a module growing past the weight class. Not to police style — to make the agent's free-to-produce complexity *visible* so a human can reject it.

**No premature optimization as a gate.**
- An optimization (a cache, a denormalization, a hand-tuned query, a micro-perf rewrite) does not pass unless the **perf budget or a profile shows this path is the bottleneck**. The perf budget you installed above is exactly the instrument that licenses optimization: optimize what is red, leave what is green. Optimizing a green path is the same YAGNI violation as a speculative abstraction — added complexity for an unmeasured need.

**The unifying move.** Every NFR in this file follows one shape: a human decides the irreversible structural question, then encodes it as a check the build enforces, so a stateless fleet of agents — fast, confident, and blind to production — cannot regress it without going red. The decisions are recorded as ADRs in [adr-and-evolution.md](adr-and-evolution.md) so the *next* session knows why the guardrail exists and does not delete it for a shorter path. That is what it means to realize a non-functional requirement in the agent era: not to intend the quality, but to make the system fail loudly the moment the quality slips.

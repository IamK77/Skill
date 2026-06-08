# Observability

This reference is the depth behind **STAGE 3 — Observability** of the [../SKILL.md](../SKILL.md) flight plan, where you make the running system *emit clear signal* so an operator who is not in the loop can still tell what it is doing. It governs the three pillars (logs, metrics, traces), structured logging with a correlation/trace id, the distinction between monitoring and observability, keeping secrets and PII out of telemetry, and the cardinality/retention cost that all of it carries. The human-era→agent-era shift is the one named in [agent-era-shifts.md](agent-era-shifts.md) as **SHIFT 3**: an experienced operator read a green dashboard *and a quiet pager* through a mental model of the system and got a prickle when a busy graph went flat or a metric simply stopped — the agent has no such model, **reads green as safety and silence as health**, and reports success while users fail. Read [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 3, and SHIFT 7 for the redaction half) for *why* this matters; read this file for *how* to build it. Before you instrument anything, restate the governing fact this stage inherits from [decision-tree.md](decision-tree.md): **production is the only truth, and an unrehearsed control is not a control** — and its observability corollary, **absence of signal is not absence of failure.**

This is also where `load-bearing`'s promise to "design the observability hooks in" gets cashed. The architecture left the seams — the boundaries where a trace id is injected, the call sites the consequential paths run through, the contracts a span can wrap. STAGE 3 does not re-architect them; it makes the running system *speak through* them. If the seams were never left, you will discover it here as instrumentation you cannot place without touching the code path — note that gap back to the architecture, do not paper over it with a wall of `print` lines.

## Contents

- [The three pillars: metric, trace, log](#the-three-pillars-metric-trace-log)
- [Structured logging, correlation ids, and context propagation](#structured-logging-correlation-ids-and-context-propagation)
- [Monitoring vs observability — and making absence a signal](#monitoring-vs-observability--and-making-absence-a-signal)
- [Keeping secrets and PII out of telemetry](#keeping-secrets-and-pii-out-of-telemetry)
- [Cost and retention — cardinality is the bill](#cost-and-retention--cardinality-is-the-bill)
- [The STAGE 3 exit check](#the-stage-3-exit-check)

---

## The three pillars: metric, trace, log

`telemetry-three-pillars` is satisfied only when all three pillars are present *and composed*, not when one of them is verbose. They answer different questions, in a fixed order, and the discipline is to reach for them in that order rather than grepping logs first because logs are what the agent knows how to produce.

| Pillar | What it is | The question it answers | Reach for it when |
|---|---|---|---|
| **Metric** | A numeric measurement over time, aggregated (a counter, gauge, or histogram) — cheap, always-on, low per-event detail. | *Is something wrong, and how wrong?* — error rate climbing, p99 latency over budget, queue depth growing. | Always on. This is what your dashboards and alerts watch; it tells you **that** there is a problem. |
| **Trace** | The path of one request across every service it touched, as a tree of timed **spans** with a shared trace id. | *Where is it wrong?* — which service, which call, which hop added the latency or threw the error. | Once a metric says something is wrong, to localise it across a distributed call graph. |
| **Log** | A timestamped record of a discrete event, ideally structured, carrying the trace id and the context of that event. | *What exactly happened?* — the specific values, the branch taken, the error and its cause at one point. | Once a trace points you at the span, to read the detail of that exact event. |

The composition is the point, and it is the single sentence to internalise: **a metric tells you something is wrong, a trace tells you where, a log tells you what.** A system with only logs makes you grep a haystack to discover there even *is* a fire; a system with only metrics tells you the building is hot but not which room; a system with only traces shows you the path of one request but not whether it is representative. The failure class this pillar set owns is the distributed one — "*why is checkout slow for users in region X?*" — which no single pillar answers and which is, in a distributed system, most of your real incidents.

**The agent failure mode this guards against:** the agent, asked to add observability, reaches for the pillar it can emit from inside a single function — a log line — and calls it done. It produces verbose, free-text logs and no metrics and no traces, so the system can describe individual events in prose but cannot tell anyone *that* something is wrong (no metric to alert on) or *where* (no trace to follow). Verbosity is not observability. Require the metric and the trace, not just the log.

**Decision fork — which pillar does this signal belong in?**

- **PREDICATE:** is the thing you want to know a *rate/quantity over time* (→ metric), a *cross-service path* (→ trace), or a *single discrete event with detail* (→ log)?
- **DEFAULT** on a coin-flip — e.g. "I want to know how often X happens": **a metric** (a counter), not a log line you later `grep | wc -l`. Counting by grepping logs is the anti-pattern; it does not aggregate, costs the most to store, and breaks the moment the log format drifts.
- **FALLBACK** when you cannot tell yet: emit it as a **structured log with a trace id** (the most convertible form — you can derive a metric or attach it to a trace later) rather than an unstructured one you can never machine-read.

OpenTelemetry (OTel) is the vendor-neutral standard that unifies all three: one set of SDKs and one wire protocol (OTLP) emits metrics, traces, and logs, and you point them at whatever backend you run (Prometheus/Grafana, Jaeger/Tempo, Loki, or a hosted vendor) without re-instrumenting. Standardise on OTel at the boundary so the instrumentation is a property of *your code* and the backend stays a swappable, reversible choice — exactly the kind of decision `load-bearing` keeps reversible.

---

## Structured logging, correlation ids, and context propagation

A free-text log line — `User 4821 failed to check out: error` — is human-readable and machine-useless. You cannot filter on `user_id`, you cannot facet by error type, and across a fleet of services emitting in a dozen ad-hoc formats you cannot search at all. **Structured logging** fixes this: every log is a record of key-value fields (JSON or logfmt), so `level`, `service`, `user_id`, `error_code`, `latency_ms`, and crucially `trace_id` are *fields* you can query, aggregate, and alert on — not substrings you regex out and hope the format never changed.

The load-bearing field is the **correlation / trace id**. One incoming request gets an id at the edge; that id is propagated into every downstream call, log line, and span the request triggers, across every service and queue hop. With it, "show me everything that happened to *this one request*" is a single query across the whole system. Without it, a request that fans out across five services leaves five disconnected piles of logs that no one can stitch back together — the distributed-systems version of the snowflake server: a failure no one can reproduce because no one can even see it whole.

**Context propagation** is what carries that id (and baggage like the user/tenant) across process boundaries. In-process, frameworks thread it through automatically; across the wire it rides in headers (the W3C `traceparent` header, which OpenTelemetry implements). The discipline:

1. **Generate or accept a trace id at every ingress** — the API gateway / edge mints one if the caller didn't send a `traceparent`, and adopts the caller's if it did, so a request entering from another service keeps its identity.
2. **Propagate it on every egress** — every outbound HTTP call, every message you publish to a queue, every DB call you want in the trace carries the context forward. The dropped-propagation bug (a worker pulls a job off a queue and starts a *fresh* trace) is the most common way a trace goes dark in the middle; the message must carry the trace context as metadata.
3. **Inject it into every log** — bind the trace id into the logging context (e.g. a contextvar / MDC) so *every* log line within that request automatically carries it without each call site remembering to. A log without a trace id is an orphan you cannot place on any request.

**The agent failure mode this guards against:** the agent writes a log statement with a clear, English sentence — optimised for a human reading that one line in isolation — and ships hundreds of them across services with no shared structure and no id. Each line looks fine in review. In production they are unsearchable in aggregate, and the first real distributed incident has no thread to pull. Require structured output and an end-to-end propagated trace id, and verify it the only way that counts: pick a real request and confirm you can follow it across *every* service it touched from one query.

**Decision fork — is this logging surface adequate?**

- **PREDICATE:** can you, from telemetry alone, retrieve every event for a single named request across all services it touched?
- **DEFAULT** on a coin-flip: assume **no** until you have actually run that query end-to-end on a real request — an agent reports the logging "set up" when the SDK is imported, which is not the same as the id propagating.
- **FALLBACK** when propagation is partial (some services on, some off): the trace is only as complete as its weakest hop; treat any un-propagated service as a blind spot and instrument it before you rely on the trace, rather than trusting a trace with holes.

---

## Monitoring vs observability — and making absence a signal

These are not synonyms, and the difference is the whole reason this stage exists.

| | Monitoring | Observability |
|---|---|---|
| **Answers** | *known* questions — "is the thing I decided to watch OK?" | questions you did **not** anticipate — "why is *this specific cohort* failing *now*?" |
| **Shape** | predefined dashboards and alerts on a fixed set of metrics | high-cardinality, explorable telemetry you can slice by any dimension after the fact |
| **Built from** | a curated metric set + thresholds | wide structured events / traces with rich attributes |
| **Fails on** | the failure you didn't think to watch for | (its job *is* the unanticipated failure) |

Monitoring is necessary and not sufficient. You predefine what to watch, and it tells you when one of *those* things breaks. But in a distributed system the failures are overwhelmingly the ones you didn't predict — a particular client version, a specific region, one tenant's data shape, a dependency degrading in a way no dashboard anticipated. **Observability** is the property that the system can answer questions you never pre-registered, by letting you slice high-cardinality telemetry (by user, by endpoint, by version, by region) on demand. The test from [agent-era-shifts.md](agent-era-shifts.md): if you can answer "why is checkout slow for users in region X?" from telemetry *without shipping new instrumentation first*, you have observability; if every new question needs a new deploy, you have monitoring.

**Absence is a signal.** This is the operational twin of `gauge`'s "make absence a signal," and SHIFT 3's sharpest demand. The agent reads silence as health, so silence has to be made loud. A metric that *stops reporting*, a request count that drops to zero, a nightly job that produced no logs, a synthetic probe that never completed, a deploy that emitted nothing new — each of these is a no-data condition, and a no-data condition must **fire**, not sit as a blank panel that an agent (and a tired human) reads as "nothing wrong." Concretely:

- **Heartbeat / synthetic checks.** Stand up a synthetic probe (Prometheus Blackbox exporter, a hosted uptime check, a cron heartbeat) that exercises the real user path on a schedule, and **alert on the probe not completing**, not just on it returning an error. A check that *never ran* must itself fire — a silent cron is the classic "it was working until it quietly wasn't."
- **No-data as an alert state.** Configure your alerting so absence-of-metric is an explicit alarm condition (`absent()` in PromQL, "no data" → alerting in the rule), not the default of "no data = no alert." The dead-man's-switch pattern (alert when a regularly-firing signal goes quiet) is the canonical form.
- **Expected-but-missing.** For a metric you *expect* to be non-zero (logins per minute, orders per minute), alert when it drops to zero, because a zeroed business metric on green hosts is the textbook "machine-green, user-red."

**The agent failure mode this guards against:** the agent stands up dashboards, sees every panel green, and certifies the system healthy — when several of those panels are green because their metric *stopped reporting an hour ago* and a flat/empty line renders as calm. It cannot feel the prickle a human gets from a normally-busy graph going flat. So you engineer the prickle: no-data and stopped-metric conditions must page, exactly as a real error would.

**Decision fork — does a missing signal currently alarm?**

- **PREDICATE:** if a critical metric or the synthetic probe stopped emitting entirely right now, would anything fire within your alert window?
- **DEFAULT** on a coin-flip: assume **no** — the out-of-the-box behaviour of almost every alerting stack is "no data → no alert," which is precisely backwards for an agent operator. Add the absence alarm explicitly.
- **FALLBACK** when you can't be sure: add a single dead-man's-switch heartbeat on the most critical user path now, and treat the rest as an open gap, rather than assuming the existing green is meaningful.

(The depth on *which* signals to watch — the golden signals, symptom-over-cause alerting, and curating the page set so every alert is actionable — is STAGE 4's job; this stage's contract is that the signal *exists and absence fires*. The two stages compose: observability makes the system speak, monitoring/alerting decides what is worth waking someone for.)

---

## Keeping secrets and PII out of telemetry

This is the second check of the stage, `sensitive-data-out-of-telemetry`, and it is governed by **SHIFT 7** in [agent-era-shifts.md](agent-era-shifts.md) as much as SHIFT 3: the runtime safety net must be *machine-enforced, not trusted to an actor that feels no wrongness leaking a secret*. Telemetry is one of the highest-frequency real-world compliance incidents, and the mechanism is mundane: a log line, a span attribute, or an error payload that captures a request body, a header, or an object — and that body contains a password, an API key, a bearer token, a card number, an email, a national id, a full address. Once it lands in your logging backend it is replicated, indexed, retained, and shipped to whatever third-party vendor you use; "delete it" then means scrubbing every replica and index across your retention window, which is a breach response, not a cleanup.

**Exactly what an agent does to cause this:** chasing a bug it cannot reproduce, the agent reaches for visibility the cheapest way — it logs the *whole* request, the *whole* object, the *whole* exception with its arguments, because dumping everything is the fastest path to seeing the problem. It feels no wrongness writing `logger.info("payload: %s", request.body)` or attaching the user object to a span. The line looks like reasonable debugging in review. In production it streams credentials and PII into a system built to retain and replicate them. This is not an edge case; it is the *default* behaviour of "make the bug visible" without a redaction discipline in the way.

The defense is **redaction at the boundary** — structural, not a code-review reminder:

1. **Allowlist, don't blocklist, what enters telemetry.** Log a curated set of safe fields (ids, status codes, durations, error *types*) rather than dumping whole objects and hoping a denylist catches the secret. A blocklist of field names always misses the next field someone adds; an allowlist fails closed.
2. **Redact in the logging/telemetry pipeline, not at each call site.** Install a processor/filter in the logging framework and an OpenTelemetry span/log processor that scrubs known-sensitive keys (`password`, `authorization`, `token`, `ssn`, `card`, `email`, …) and pattern-matches obvious secrets (card-number, JWT, key-shaped strings) *before* the record leaves the process. One enforced chokepoint beats N disciplined call sites — the same reason the redaction belongs at the boundary that `gauge` puts validation at.
3. **Never log the auth material at all.** Authorization headers, cookies, tokens, and request bodies on auth/payment endpoints are denied by default; if a body must be logged for debugging, it is the *redacted* body.
4. **Scan for it as a gate.** Run secret-scanning (gitleaks-style detectors) over your telemetry/log output in a pre-prod check, and keep secrets in a real manager (Vault / a cloud secrets manager) so a token's canonical home is never a log in the first place. `flightline` enforces secrets-out-of-code at build time; this is the *running-system* counterpart — the same property, machine-enforced where the agent actually leaks it.

**The verification that satisfies the check:** redaction is wired into the pipeline *and* you have confirmed, on a real sensitive request, that the secret/PII does not appear in the resulting telemetry. A redaction config that has never been tested against a real payload is, per the governing fact, an *unrehearsed control* — treat it as not done.

**Decision fork — is this field safe to put in telemetry?**

- **PREDICATE:** is the field on the curated allowlist of known-safe fields?
- **DEFAULT** on a coin-flip — a field you're unsure about: **exclude it / redact it.** The cost of an over-redacted log is a slightly harder debug; the cost of an under-redacted one is a compliance incident and a breach notification. The asymmetry is total.
- **FALLBACK** when you genuinely need the value to debug: log a **safe derivative** — a hash, a last-4, a length, a boolean "present" — never the raw value.

---

## Cost and retention — cardinality is the bill

Observability data has a cost that scales in ways the agent will not anticipate, and "log everything, keep it forever, label it with everything" is a default that becomes frighteningly expensive at production volume. This is also where `load-bearing`'s "design the observability hooks in" promise is fully cashed: the hooks were placed at design time precisely so that *what* you emit is a deliberate, bounded choice rather than a reflexive firehose retrofitted under incident pressure — you decided where the seams are, so now you decide what flows through them and for how long.

Two cost drivers dominate:

- **Cardinality** — the number of *distinct label/attribute combinations* on a metric. Each unique combination is a separate time series your backend stores and indexes. Add a `user_id` (or request id, or full URL with ids, or raw error message) as a metric label and a single counter explodes into millions of series; this is the number-one way teams accidentally take down or bankrupt their metrics backend. The rule: **labels are for low-cardinality dimensions you slice by** (region, endpoint *template*, status code, version) — *not* for unbounded identifiers. High-cardinality identity belongs on **traces and structured logs** (where it is an attribute on an event, not a new series), never on metric labels.
- **Verbosity** — the raw volume of logs/spans. Ingest and retention are billed by volume; debug-level logging left on in production, or a span on every trivial function, multiplies the bill without multiplying insight.

The levers that keep it affordable without going blind:

| Lever | What it does | Apply it to |
|---|---|---|
| **Sampling** | Keep a representative fraction of traces (head sampling), or keep all the *interesting* ones — errors, slow requests — and a sample of the rest (**tail sampling**). | High-volume traces. Tail-sample so every error/slow trace is kept and the routine ones are thinned. |
| **Log levels** | Emit `DEBUG` in dev, `INFO`/`WARN`/`ERROR` in prod; make the level runtime-adjustable so you can turn up verbosity *during* an incident and back down after. | All logging. Don't ship `DEBUG` to prod by default. |
| **Retention tiers** | Keep high-resolution data briefly, downsample/aggregate to coarser resolution for the long tail, archive cold. | Metrics (raw days → rolled-up months), logs (hot search window → cold archive). |
| **Cardinality limits / bounded labels** | Cap or drop high-cardinality labels at the collector; lint metric definitions for unbounded labels. | The metrics pipeline, as a guard against the explosion above. |

What is worth keeping is set by blast radius (the [decision-tree.md](decision-tree.md) weight class), not by completeness: a LIGHT system keeps error-rate and basic latency metrics with short retention and no tracing; a HEAVY one keeps full traces with tail sampling, golden-signal metrics at long retention, and structured logs in a searchable window with a cold archive for compliance. The discipline is to decide retention and sampling *deliberately, per signal*, and write it down — not to accept whatever the vendor defaults to.

**The agent failure mode this guards against:** facing pressure to "have good observability," the agent maximises emission — every field as a metric label, `DEBUG` on in prod, full traces at 100%, infinite retention — because more telemetry reads as more safety, and it feels no flinch at the bill (the same instinct as SHIFT 6's "just scale up"). The result is a five-figure surprise invoice and a metrics backend buckling under cardinality, with no better insight than a bounded setup would have given. Bound cardinality, set sampling and retention as explicit choices, and treat a spiking telemetry bill as a signal to diagnose — exactly the absence-is-a-signal logic applied to cost.

---

## The STAGE 3 exit check

You may advance past the OBSERVABILITY gate when both checks hold, *proven* and not merely configured:

- **`telemetry-three-pillars`** — metrics, traces, and logs are all present and composed (a metric can alert, a trace can localise, a log can detail), unified on OpenTelemetry; logs are structured and carry a correlation/trace id that **propagates end-to-end** (verified by following one real request across every service); monitoring-vs-observability is internalised — you can answer an unanticipated question from telemetry alone — and **absence is a signal**: a stopped metric, a zeroed business metric, and a failed synthetic probe each *fire*, so the agent's reading of silence-as-health cannot pass for healthy.
- **`sensitive-data-out-of-telemetry`** — secrets and PII are redacted at the boundary by an enforced pipeline filter (allowlist, not blocklist), confirmed on a real sensitive payload, with secrets living in a manager rather than a log; and telemetry cost is bounded by deliberate cardinality limits, sampling, and retention tiers rather than a firehose.

Carry forward the two compositions this stage exists to enable: the signal you stood up here is what STAGE 4 turns into the golden-signal dashboards and the actionable page set, and the trace ids you propagated are what STAGE 5's runbooks reference when an incident is in flight. See [decision-tree.md](decision-tree.md) for sizing how much of this floor the system earns, and [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 3, SHIFT 7) for why each control reads the way it does once an agent is the one watching the dashboard.

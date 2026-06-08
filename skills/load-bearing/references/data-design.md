# Data Design — The Hardest Layer to Reverse

This reference is the data half of **STAGE 3 (Contracts & data)** — the durable layer of the flight plan. Its sibling, [boundaries-and-contracts.md](boundaries-and-contracts.md), covers the interface half; open both when STAGE 3 sends you here. Everything in this file exists because the data model is the single part of a system an agent **cannot** make cheap to change: code is now near-free to rewrite, but migrating live production data costs exactly what it always did. That asymmetry is the spine of every decision below — it tells you where to spend the user's scarce judgment, and what to hand an ADR. Read [agent-era-shifts.md](agent-era-shifts.md) for the seven-shift frame this rests on, and [decision-tree.md](decision-tree.md) for the reversibility triage that routes you here in the first place.

Each fork below carries the same three labels the rest of this skill uses, so two agents handed the same schema land on the same plan:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One invariant overrides every DEFAULT and FALLBACK in this file:

> **An agent never free-hands a production schema change.** Any `ALTER`, any index on a live table, any data backfill, any column drop is a one-way door until proven otherwise. Propose it as schema-as-code, route it through the migration discipline below, and surface it to the human-in-the-loop for sign-off. Silent schema edits are to data design what silent guessing is to requirements: the one move that turns the whole stage into theater.

---

## Why data is the durable core — and why the agent era widens the gap

The human-era rule was already blunt: you can throw code away and rewrite it, but you cannot throw away the data a paying customer put in your database. Schema is where the irreversibility lives. A bad function is a bad afternoon; a bad column on a table with a hundred million rows is a quarter of careful, online, backward-compatible migration with a rollback plan and a war room.

The agent era does not soften this — it **sharpens** it, by moving the denominator:

- **Code cost → near zero.** An agent can rewrite a service, swap a library, restructure a module tree, or port a language in an afternoon. The classic "design it perfectly up front because changing it later is agony" reasoning evaporates for everything *reversible*.
- **Data migration cost → unchanged.** No agent shrinks the cost of moving a terabyte of production rows, reconciling dual-write windows, or recovering from a botched backfill. The mechanics are the same as they were a decade ago: slow, risky, and irreversible if you corrupt state.

So the **relative** permanence of the data model goes *up*, not down. When everything around it got cheap and it did not, the schema becomes the load-bearing wall of the whole system — the thing future agents will route around rather than move. The practical consequence for this stage:

| Decision | Door | Who decides | Artifact |
|---|---|---|---|
| Production table/collection schema | **One-way** | Human deliberates; agent proposes | **ADR** (see [adr-and-evolution.md](adr-and-evolution.md)) |
| SQL vs NoSQL engine choice | **One-way** (data is captive to the engine's model) | Human deliberates; agent proposes | **ADR** |
| Consistency / CAP corner per use case | **One-way** (rewrites the failure semantics callers depend on) | Human deliberates; agent proposes | **ADR** |
| Which service owns which data | **One-way** (a shared table is a coupling that calcifies) | Human deliberates; agent proposes | **ADR** |
| Index choices, query shapes inside one engine | **Two-way-ish** (reversible, but costly online on big tables) | Agent proposes; human reviews the migration | reviewed migration |
| ORM / query-builder / data-access library | **Two-way** | Agent's call; revisit freely | none |
| In-memory caching, serializers, internal DTOs | **Two-way** | Agent's call | none |

The discipline: every row marked **one-way** earns real human thought and a written "why." Everything **two-way** gets a reasonable default and a note that agents may revisit it. Spending equal deliberation on the ORM choice and the schema is the error this table exists to prevent.

---

## TREE — SQL vs NoSQL, by access pattern and consistency need

Pick the data model by how the data is **shaped**, how it is **read**, and how **consistent** it must be — never by what is fashionable, and never by what the agent saw most often in its training data (which biases toward whatever was popular when the corpus was scraped). The agent-era twist: the engine is a one-way door, so this is exactly the kind of decision the human signs off on, with an ADR recording the rejected alternatives so the *next* agent does not "modernize" it on a whim.

```
D1. Strong relationships + multi-entity transactions + strong consistency?
    PREDICATE: do writes span several entities that must commit atomically,
               and do reads need to see a single consistent truth (money,
               inventory, bookings, anything with invariants across rows)?
    ├─ YES → RELATIONAL (Postgres / MySQL / SQL Server / a distributed SQL
    │         like CockroachDB/Spanner if you also need horizontal scale).
    │         This is the DEFAULT and the boring-technology choice. Stop here
    │         unless a later branch genuinely overrides it.
    └─ NO  → continue. You must now JUSTIFY leaving relational, not assume it.

D2. What is the DOMINANT access pattern? (pick the one that runs hottest)
    PREDICATE: how is this data overwhelmingly read and written?
    ├─ Get/put by a single known key, massive throughput, no ad-hoc queries
    │     → KEY-VALUE (Redis, DynamoDB, Memcached). Sessions, caches,
    │       feature flags, rate-limit counters, shopping carts.
    ├─ Self-contained documents read/written whole, schema varies per record,
    │   nested structure, few cross-document joins
    │     → DOCUMENT (MongoDB, DynamoDB single-table, Couchbase, Firestore).
    │       Product catalogs, user profiles, CMS content, event payloads.
    ├─ Enormous write volume, queries always scoped by a partition key + range,
    │   time-series or per-tenant fan-out, you can model around the query
    │     → WIDE-COLUMN (Cassandra, ScyllaDB, Bigtable, HBase). Telemetry,
    │       activity feeds, IoT, audit logs at scale.
    ├─ The VALUE is in the relationships themselves — multi-hop traversal,
    │   "friends of friends", recommendation paths, fraud rings
    │     → GRAPH (Neo4j, Neptune, ArangoDB). Social graphs, knowledge graphs,
    │       permission hierarchies, network/dependency analysis.
    └─ Full-text / fuzzy / relevance-ranked search, or analytics over columns
          → SPECIALIZED ENGINE (Elasticsearch/OpenSearch for search; a
            columnar store — ClickHouse/BigQuery/Snowflake — for OLAP). These
            are USUALLY a *secondary* store fed from the system of record, not
            the primary — see the polyglot note below.

D3. Does NoSQL's flexibility actually buy you something HERE?
    PREDICATE: are you choosing NoSQL for a real access-pattern or scale
               reason from D2 — or just to "avoid migrations" / because it's trendy?
    ├─ Real reason → proceed; record it in the ADR with the access pattern named.
    └─ No real reason → STOP. Schemaless does not mean schema-free; it means the
          schema moved from the database into every piece of application code,
          unenforced — which is precisely the constraint an agent will violate
          (writing a record in a new shape that silently breaks an old reader).
          Default back to relational.
```

**The relational default is the agent-era safe choice for three reasons:** it has the deepest, most stable training corpus (the agent hallucinates least), its constraints (`NOT NULL`, `FOREIGN KEY`, `CHECK`, `UNIQUE`) are *machine-enforced guardrails* that catch the confident-but-wrong agent at write time, and its query language is the most reviewer-verifiable. You leave it only when D1/D2 give a concrete, written reason.

**DEFAULT** when D1 is a coin-flip: choose **relational**. You can model document-ish data in a `JSONB` column and add a key-value cache in front; you cannot easily add transactions and joins to a store that was built without them. **FALLBACK** when you cannot yet name the dominant access pattern: do not pick an engine — that is the FALLBACK trigger to go gather the dominant queries (the "plan-ahead" section below) before committing the one-way door.

**Worked leaf —** *"Store = order line-items with a running total invariant that must never go negative → D1 YES (multi-row transaction + strong consistency) → RELATIONAL. Do not let 'orders feel document-shaped' override an invariant that needs a transaction."*

**Worked leaf —** *"Store = per-user activity feed, 50k writes/sec, always read as 'last N events for user X' → D1 NO → D2 wide-column (partition by user, cluster by time) → Cassandra. Record in ADR: chosen for write throughput + partition-scoped reads, NOT for schema flexibility."*

### Polyglot persistence — earn each extra store

It is legitimate to run a relational system of record *plus* a search index *plus* a cache. But every additional engine is another one-way door, another consistency boundary, another thing the human must operate, and another API surface the agent can hallucinate against. The rule: **one system of record per piece of data; secondary stores are derived and rebuildable.** If you cannot rebuild the search index from the source of truth, it has quietly become a second source of truth — a far worse coupling than a join. Default to **one** store until a named access pattern forces a second.

---

## CAP and PACELC — make the trade-off concrete per use case

CAP is not abstract once data is distributed across nodes: when a network partition splits your cluster, you must choose, *for that operation*, whether to keep serving (stay **A**vailable, risk stale/divergent reads) or to refuse (stay **C**onsistent, return errors until healed). You cannot have both during a partition. The decision is **per use case**, driven by what the business can tolerate, and it is a one-way door because it rewrites the failure semantics every caller is coded against.

```
CAP1. During a partition, is a WRONG/STALE answer worse than NO answer?
    PREDICATE: would serving stale or conflicting data here cause harm
               (double-spend, oversell, broken invariant, safety/auth)?
    ├─ YES → CP. Prefer Consistency; refuse or block rather than diverge.
    │         Payments, inventory decrement, account balances, auth tokens,
    │         uniqueness constraints. Use a strongly-consistent store / quorum.
    └─ NO  → AP. Prefer Availability; serve and reconcile later.
              Social feeds, product views, likes, recommendations, telemetry,
              presence. Eventual consistency + conflict resolution is fine.
```

**PACELC nod — the part teams forget:** CAP only describes behavior *during* a partition. PACELC adds the common case: **E**lse (no partition), you still trade **L**atency vs **C**onsistency. A globally strongly-consistent write (cross-region quorum) is *slow even when nothing is broken*. So a store is classified as, e.g., "PC/EL" (consistent under partition, low-latency otherwise) or "PA/EL" (available + fast, eventually consistent). Spell out **both** halves per use case: what happens when the network breaks, and what latency you pay every ordinary day for the consistency you chose.

**For the human-in-the-loop, write it as a sentence per use case:** *"Checkout inventory: CP / PC-EC — we refuse to sell during a partition and we eat the cross-region latency, because overselling is unacceptable. Homepage product feed: AP / PA-EL — we serve possibly-stale data fast and never block, because a slightly stale view is harmless."* That sentence is the ADR content, and it is the artifact that stops a future agent from "optimizing" the checkout path to be eventually consistent because the feed path was.

**DEFAULT** when the tolerance is genuinely unclear: choose **CP** for anything touching money, inventory, identity, or invariants, and surface the choice — over-refusing is recoverable; a silent double-charge is not. **FALLBACK** when you cannot judge the business tolerance at all: this is a question for the human, not a guess — escalate it (see the ladder below) rather than picking a corner silently.

---

## Service-owns-its-data — and the shared-database anti-pattern

If STAGE 1 split the system into services (see [architecture-styles.md](architecture-styles.md)), then **each service owns its own data and is the only thing that touches its store directly.** Other services reach it through that service's contract — never by connecting to its database.

The anti-pattern this forbids is the **shared database**: two or more services reading and writing the same tables. It looks like reuse and is actually the tightest coupling in the system, disguised as separation:

- A schema change in one service silently breaks every other service that reads those tables — the boundary you drew on the architecture diagram does not exist in the data layer.
- There is no contract, so there is nothing to version, mock, or test against. The coupling is invisible until it breaks in production.
- It is the signature of a **distributed monolith** (see [architecture-styles.md](architecture-styles.md)): the services are split for deployment but fused at the data layer, so you pay distributed-systems cost and get monolith-grade entanglement.

**Why this is sharper in the agent era:** a shared database is the path of least resistance to a green test. An agent told to add a field will join straight into another service's table because the SQL is shorter than going through an API — and it has no instinct that this crosses a boundary. A human feels friction reaching into someone else's schema; an agent feels none. So the boundary must be **machine-enforced**, not documented: separate database credentials/schemas per service so a cross-service query *cannot* connect, plus a CI fitness function that fails the build if service A's code references service B's tables. An unenforced "please don't share the DB" rule erodes at agent speed. (The boundary-enforcement mechanics live in [boundaries-and-contracts.md](boundaries-and-contracts.md); the runtime guardrails this implies live in [nfr-realization.md](nfr-realization.md).)

**The counterweight — do not over-split.** Service-per-data is a property of a system that *already* earned microservices in STAGE 1. In a **modular monolith** (the agent-era default for most weight classes), the modules share one database but own disjoint schemas/tables with no cross-module foreign keys — you get the ownership discipline without the distributed-systems tax, and splitting to separate databases later is cheap because the seam is already clean. Do not invoke "each service owns its data" as a reason to distribute a system the weight class did not call for; that is hype-driven architecture wearing a data-design hat.

**DEFAULT** when unsure whether two pieces of data belong to the same owner: keep them together under one owner — merging is a refactor (cheap, agent-territory), splitting captive data later is a migration (expensive, one-way). **FALLBACK** when ownership is genuinely contested between two bounded contexts: that is a boundary question — resolve it in [boundaries-and-contracts.md](boundaries-and-contracts.md) before you place the table.

---

## Plan ahead — growth, indexes, and the dominant queries

You design the schema **against the queries**, not in the abstract. Three things must be on the table before the schema is fixed, because all three are painful to retrofit on a populated table:

1. **Data growth.** Estimate the row/document count at 1×, 10×, and 100× current scale. A design that is fine at a thousand rows (full scans, no partitioning, a `UUID` primary key with random insert order) can be unworkable at a billion. The shape that scales — partition/shard key, time-based partitioning, archival/TTL strategy — is hard to add after the data exists. Decide it while the table is empty.

2. **Indexing strategy, derived from the dominant queries.** List the handful of queries that will run hottest and most often, then index *for those*. Index design is a real trade-off, not a free win: every index speeds reads and slows writes, costs storage, and — critically — **adding an index to a large live table is itself a risky online migration**. Composite-column order matters (an index on `(tenant_id, created_at)` serves a tenant-scoped time range; the reverse does not). The agent failure mode is two-sided: it under-indexes (a query that scans the whole table passes every test on tiny fixtures, then melts in production), and it over-indexes (slapping an index on every column "to be safe," silently taxing every write). Pin the dominant queries explicitly so the agent indexes *those* and nothing speculative.

3. **The dominant query patterns themselves.** Whether a store is even the right *kind* (the SQL-vs-NoSQL tree above) is decided by these queries. Write them down — literally, as the 3–7 queries the system runs most — before choosing the engine and before drawing the schema. In document and wide-column stores this is not optional polish: you model the data *around* the access pattern, so the queries are an input to the schema, not an afterthought.

**DEFAULT** when growth is unknown: design for 10× current scale and pick a primary key and partition strategy that does not foreclose 100× — but do **not** pre-shard or pre-partition a system that has no users yet (that is premature optimization; see [nfr-realization.md](nfr-realization.md)). The win is keeping the *option* open cheaply, not building the scaled-out version now. **FALLBACK** when the dominant queries are not yet known: stop — you cannot responsibly fix the schema or the engine. Go enumerate them with the user; this is the same FALLBACK that fired in the SQL-vs-NoSQL tree, and it gates both decisions.

---

## Migration discipline — the one cost agents do not slash

Every change to a populated schema is a **migration**, and migrations are where the irreversibility bites. This is the section that earns the most rigor, because it is the one place in the whole skill where the agent's superpower — making changes cheap — simply does not apply.

### Expand / contract (the parallel-change pattern)

Never change a live schema in one destructive step. Split every breaking change into reversible, backward-compatible phases so old and new code coexist and you can roll back at any point:

```
EXPAND   → Add the new structure ADDITIVELY. New nullable column / new table /
           new field. Old readers and writers are untouched and still work.
           This phase is safe and reversible.

MIGRATE  → Dual-write to old AND new; backfill existing rows in batches.
           Reads can start preferring new with a fallback to old.
           Still fully reversible — old data is intact.

CONTRACT → Only after new is fully populated, verified, and every reader has
           moved: stop writing old, then (separately, later) drop it.
           This is the one irreversible step — and it happens last, alone,
           with the new path already proven in production.
```

The whole point is that no single deploy is a one-way door: each phase is independently shippable and rollback-able, and the irreversible drop is deferred until the new path has earned trust. A backward-compatible migration is one where, at every intermediate step, **both the old and the new application version run correctly against the database** — which is also what lets you deploy without downtime.

### The agent guardrails — non-negotiable

Because the cost of getting this wrong is the cost agents *cannot* lower, the controls here are stricter than anywhere else in the skill:

| Guardrail | Why it exists |
|---|---|
| **Schema-as-code, version-controlled migrations.** Every change is a reviewed migration file in the repo (Flyway / Liquibase / Alembic / Prisma / Rails / sqlx), never an ad-hoc `ALTER` run by hand or by an agent against prod. | Makes the change a reviewable diff, reproducible across environments, and revertable. An out-of-band schema edit has no history and no rollback. |
| **Every migration is reviewed by the human-in-the-loop before it touches production data.** | The schema is the one-way door; review is the gate on it. This is the data-design instance of "the bottleneck moved from writing to verifying." |
| **Every migration has a tested rollback (or is provably expand-only).** | Forward-only is acceptable *only* for additive expand-phase changes. Anything destructive needs a proven way back. |
| **Backfills run in batches against production-scale data, not in one transaction.** | A single giant `UPDATE` locks the table and can take the system down; an agent testing on a 10-row fixture will not see this. |
| **Migrations are exercised in CI/staging against a realistic dataset before prod.** | A migration that passes on an empty test DB and times out on a billion live rows is the canonical agent blind spot. |
| **The agent proposes; it does not apply to prod.** | Restates the invariant at the top of this file. Generating the migration is agent work; running it against live customer data is a human-authorized act. |

**DEFAULT** when unsure whether a change needs the full expand/contract dance: if the table is non-trivially populated *or* multiple app versions will run during the deploy, use the full pattern — the ceremony is cheap relative to a botched destructive migration. **FALLBACK** when you cannot tell whether a change is destructive (e.g., a type change that might lose precision): treat it as destructive and route it through expand/contract; the cost of an unnecessary expand phase is hours, the cost of silent data loss is unbounded.

---

## Escalation ladder — when data uncertainty rises

Data decisions are one-way doors, so the response to uncertainty is to **escalate toward the human**, not to pick a corner and hope. Climb one rung at a time:

```
1. Engine/model choice unclear (SQL vs NoSQL family)
      → enumerate the dominant queries first; the access pattern usually decides it.
2. Still unclear after the queries are written
      → default to relational, note the assumption, flag for review. Cheap to add a
        cache/search index later; expensive to bolt on transactions.
3. Consistency tolerance unclear (which CAP/PACELC corner)
      → this is a BUSINESS call, not a technical default. Ask the user the concrete
        question: "during an outage, is stale-but-available or correct-but-down worse here?"
4. A change to a POPULATED production schema is needed
      → never let the agent run it. Produce the expand/contract migration plan +
        rollback, and get explicit human authorization before it touches prod.
5. Two services / contexts contend for ownership of the same data
      → kick it back to boundaries-and-contracts.md; a contested owner is a boundary
        bug, and placing the table before resolving it bakes in the coupling.
```

Each rung up the ladder hands more authority back to the human-in-the-loop, which is exactly right: the further into one-way-door territory you go, the less an agent should decide alone.

---

## What this stage hands forward

Carry out of STAGE 3's data half: the **engine choice** (with its access-pattern justification), the **consistency corner per use case** (the CAP/PACELC sentence), the **data ownership map** (which service/module owns which store, with the no-shared-DB rule machine-enforced), the **growth + index + dominant-query plan**, and the **migration discipline** the team will follow. Every one-way-door item among these becomes an **ADR** in STAGE 5 — see [adr-and-evolution.md](adr-and-evolution.md) — because the ADR is the persistent memory that stops the next stateless agent session from undoing a schema decision it cannot see the reasoning for. The runtime qualities these choices imply — replication, backups, read replicas, connection limits, encryption-at-rest, query budgets — become concrete guardrails in [nfr-realization.md](nfr-realization.md). The contract half of this stage, and the boundary enforcement this file leans on, live in [boundaries-and-contracts.md](boundaries-and-contracts.md). The whole flight plan is in [../SKILL.md](../SKILL.md).

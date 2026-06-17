# Server State & the Data Layer — Cache, Consistency, and Local-First

## 1. The Core Insight: Server State Is a Cache

Server-fetched data is not your state — it is a **cached copy of truth that lives on the server**. Treating it as local state and manually synchronising it (e.g. storing API responses in Redux) is the root cause of most data-layer pain.

Two fundamentally different categories:

| Kind | Owner | Nature | Tooling |
|---|---|---|---|
| **Server state** | Server | Async, shared across clients, can expire | TanStack Query / SWR / RTK Query / Apollo |
| **Client / UI state** | Browser | Sync, ephemeral (form inputs, modal open, theme) | useState / Zustand / Jotai / Redux |

**Never put server state into a client state manager.** The separation is not style — it is architecture.

---

## 2. Query Libraries — The Mechanics

All three major libraries (TanStack Query, SWR, RTK Query) share the same conceptual model:

- **Query key as cache identity.** Use structured keys: `['todos', { status, page }]`. Build a key factory so invalidation scope is deterministic.
- **`staleTime` vs `gcTime` (TanStack Query).** `staleTime` — how long data is considered fresh before a background refetch is triggered (default `0`: refetch on every mount). `gcTime` — how long an unused cache entry survives before garbage collection. **Tune both.** Default `staleTime=0` causes unnecessary refetches on every component mount.
- **Stale-while-revalidate (SWR).** Serve the stale cached value immediately, refetch in the background, update when the fresh response arrives. Perceived performance wins without a loading spinner.
- **Automatic background refetch triggers:** window focus, network reconnect, configurable interval (`refetchInterval`). No manual freshness logic needed.
- **Request deduplication.** Multiple components mounting and requesting the same key → exactly one in-flight request. Consumers share the result.
- **`isLoading` ≠ `isFetching`.** `isLoading` fires only on the first fetch (no cached data). `isFetching` fires on any in-flight request including background revalidation. Use the right flag for the right UI state.

---

## 3. Async State Machine — Handle All States

Every query has a state machine: `idle → loading → success | error`, plus `fetching` (revalidating with stale data visible) and `paused` (offline).

**Handle every branch** — most code only handles `loading` + `success` and ships broken UIs:

- `loading` → skeleton / placeholder
- `error` → retry button + message; respect `stale-if-error` (keep serving stale data on error rather than showing a blank)
- `empty` → explicit empty state (not a blank list)
- `stale-refetching` → subtle indicator, do not block interaction

**Retry policy:** exponential back-off; distinguish **retryable** (network errors, 5xx) from **non-retryable** (4xx — retrying a 403 is pointless). Use error boundaries for unrecoverable states; per-query error UI for contained failures.

---

## 4. Cache Invalidation — The Hard Problem

When a mutation changes server data, cached queries that reflect that data must be invalidated. Two primary strategies:

- **`invalidateQueries(key)`** — marks matching cache entries stale, triggers background refetch. Simple and always correct; costs a round-trip.
- **`setQueryData(key, updater)`** — directly writes new data into the cache without a refetch. Faster; requires writing the correct shape manually.

**Scope invalidation precisely.** Too broad (invalidate everything) causes over-fetching. Too narrow (miss a related query) leaves stale data. Structured query keys make scoping mechanical: invalidate `['todos']` to hit all todo queries; invalidate `['todos', { id: 42 }]` for a single item.

---

## 5. Mutations and Optimistic Updates

**Mutation lifecycle (TanStack Query):**

```
onMutate  → snapshot current cache + apply optimistic update
onError   → roll back to snapshot
onSettled → invalidateQueries to reconcile with server truth
```

Optimistic update: write the expected result into the cache *before* the server responds. The UI feels instant. On error, restore the snapshot. On settled, invalidate to get ground truth.

**Failure modes to guard against:**
- **Concurrent mutations:** if two mutations target the same query concurrently, rollback of one may clobber the other's snapshot. Cancel in-flight queries in `onMutate` with `cancelQueries` to prevent a refetch from overwriting the optimistic state mid-flight.
- **Race condition:** a background refetch arriving between `onMutate` and `onSuccess` can overwrite the optimistic value. `cancelQueries` before applying the optimistic update is the fix.

---

## 6. Pagination, Infinite Scroll, and Prefetch

- **Cursor-based pagination over offset-based.** Offset pagination breaks under concurrent inserts (items shift, pages duplicate or skip). Cursors are stable.
- **`keepPreviousData` / `placeholderData`** (TanStack Query v5: `placeholderData: keepPreviousData`): while fetching the next page, keep the current page rendered. Prevents layout jumps.
- **Infinite queries** (`useInfiniteQuery`): accumulate pages; `getNextPageParam` drives load-more / infinite scroll. Each page is cached individually under its own key fragment.
- **Prefetch:** call `queryClient.prefetchQuery` on hover, route intent, or next-page anticipation. The data lands in cache before the user navigates — zero-latency apparent load.
- **Dependent queries:** use `enabled: !!parentId` to gate a query on a prior result. Avoids requests with undefined parameters and models the dependency explicitly.
- **Parallel queries:** fire independent queries in the same render; `useQueries` batches them without waterfalls.

---

## 7. Normalised vs Document Cache

| Model | How it stores | Strength | Weakness |
|---|---|---|---|
| **Document cache** (TanStack Query, SWR) | Per query key, full response shape | Simple, low ceremony | Same entity in two queries can diverge; must invalidate both |
| **Normalised cache** (Apollo, RTK Query) | Entities by ID, shared references | One update reflects everywhere | Higher complexity, cache configuration overhead |

GraphQL clients lean normalised because the query graph maps naturally to entities. REST clients typically use document caches and accept the "invalidate everything that might touch this entity" cost. Choose based on how often the same entity appears in multiple query responses.

---

## 8. Data-Fetching Architecture — Avoiding Waterfalls

- **Client-side fetching** (React Query inside components): flexible for SPAs, but sequential render → fetch → child render → fetch chains create **waterfalls** that add hundreds of ms.
- **Server loaders** (Remix / React Router `loader`, Next.js `getServerSideProps`, RSC): fetch on the server before the client HTML arrives. Eliminates client waterfalls for initial data.
- **Parallel fetching:** `Promise.all` or `useQueries`; hoist fetches to the route boundary so sibling subtrees do not block each other.
- **Over-fetching / under-fetching:** REST endpoints often return too much or too little. GraphQL fetches exactly the declared shape (at the cost of client-side complexity). **tRPC** gives end-to-end type safety over procedure calls without a schema language.

---

## 9. Real-Time and Live Data

- **Polling** (`refetchInterval`): simplest, always works, wastes bandwidth. Use only when push infra is unavailable.
- **WebSocket / SSE:** server pushes events → handler calls `queryClient.setQueryData` or `invalidateQueries` to inject live data into the cache. The query library remains the single source of rendered state; the socket is just a delivery channel.
- **GraphQL subscriptions:** same pattern — subscription event updates the Apollo/URQL cache.
- **Optimistic real-time:** apply the local mutation immediately via `setQueryData`, then let the sync channel confirm or correct.

---

## 10. Advanced: From Cache to Distributed State

Once optimistic updates, multiple clients, and offline coexist, you are no longer managing a cache — you are managing **a local replica of distributed state**. The failure modes become those of distributed systems.

### 10.1 Consistency Models

- **Eventual consistency:** replicas converge after writes stop — but intermediate states are visible to users.
- **Guarantees worth naming explicitly:** read-your-writes (you see your own mutation immediately), monotonic reads (never see a value older than one you already saw), causal consistency (causally ordered operations appear in order).
- Naive optimistic + multi-client setups **break all three**: another client's write can overwrite your in-flight mutation; a page refresh can roll back what you just wrote.
- **CAP trade-off in the UI:** choosing offline availability is choosing availability over strong consistency. Make this choice explicitly in your architecture decision record.

### 10.2 Conflict Resolution Strategies

| Strategy | Mechanism | When to use |
|---|---|---|
| **Last-write-wins (LWW)** | Higher timestamp wins | Low-conflict fields; simple; silently loses updates |
| **Server-authoritative rebase** | Client mutations re-applied on top of latest server state | General-purpose; preserves intent; the Replicache model |
| **CRDT** | Commutative merge; no central coordination | Collaborative / offline-heavy; convergence guaranteed |
| **OT (operational transformation)** | Transform concurrent ops; requires server | Collaborative documents; Google Docs classic |

**Mutation log + rebase:** queue mutations as *mutators* (pure functions describing intent, not final state). When the server confirms, replay the queue on top of the authoritative state rather than blindly overwriting. Preserves causal ordering.

### 10.3 CRDTs and Collaborative Editing

- CRDTs merge commutatively — two replicas can merge in any order and reach the same result without a coordinator.
- **Sequence CRDTs (text):** RGA, YATA. Use **tombstones** to mark deletions (cannot remove position metadata while other clients may reference it). Tombstones accumulate → **metadata bloat** → periodic GC required.
- **Yjs** is the production implementation of choice. Pairs with **awareness/presence** for cursor positions and online indicators.
- **CRDT vs OT:** OT requires server coordination (still the model behind Google Docs); CRDT is decentralised but carries more per-document overhead. Choose based on whether offline / P2P operation is required.

### 10.4 Local-First Architecture

The paradigm shift: **reads and writes hit a local database first** (instant, always available), and a **sync engine replicates bidirectionally** with the server. The network becomes a synchronisation detail, not a read/write dependency.

- **Default offline, default optimistic.** No loading spinners for reads.
- **Partial replication / sync scope:** sync only the slice relevant to the current user / workspace / query. Syncing an entire dataset to a client is almost never feasible.
- **Mutators model:** declare mutations as deterministic functions applied locally first, then forwarded to the server. Server confirms or rebases; client reconciles.
- **Sync engines:** Replicache (mutator + rebase model), ElectricSQL (Postgres → client sync), PowerSync (SQLite local-first for mobile/web), Zero (reactive query engine over local replica).

### 10.5 Reactive Query Engine

Local-first stores pair naturally with reactive query engines: **a query over the local replica re-executes precisely when its data dependencies change** via incremental view maintenance / differential dataflow. Only the changed portion of the result is recomputed — not a full table scan. Zero implements this model directly. This closes the loop on the "two graphs" framing: the data-dependency graph drives exact reactive updates rather than coarse re-renders.

---

## 11. Boundary Contracts and Runtime Validation

- Define the API contract with a schema: OpenAPI, GraphQL SDL, or tRPC.
- **Never trust the shape of a server response at runtime** — schemas drift, servers have bugs, deployments are gradual. This is the mirror image of "never trust the client."
- **Parse, don't validate (Zod):** at the network boundary, parse raw responses into typed domain models. If parsing succeeds, internal code holds a correct type. If it fails, fail loudly at the boundary — not silently mid-component.
- Contract tests (e.g. Pact) catch frontend/backend drift before it reaches production.

---

## 12. Idempotency and Mutation Correctness

- **Idempotency keys:** attach a stable client-generated ID to each mutation. The server deduplicates on that key — retried requests (network blip, double-submit) become effectively exactly-once from the user's perspective.
- **Causal ordering in queued mutations:** an offline mutation queue must replay in causal order. Replaying "delete item 42" before "create item 42" produces a different outcome. Track vector clocks or sequence numbers if ordering matters.

---

## Quick-Reference Checklist

| Concern | Rule |
|---|---|
| State classification | Server state = cache; never into Redux/Zustand |
| Tool split | Server state → Query lib; UI state → useState/Zustand |
| Cache config | Set `staleTime` explicitly; tune `gcTime`; never leave both at defaults |
| Dedup | Same key → one request; check this before adding manual dedup logic |
| Invalidation | `invalidateQueries` (correct) vs `setQueryData` (fast); scope by key structure |
| Optimistic | `onMutate` snapshot → `onError` rollback → `onSettled` invalidate; `cancelQueries` before apply |
| All async states | Handle loading / error / empty / stale-refetching; `isLoading` ≠ `isFetching` |
| Retry | Exponential back-off; skip retry on 4xx |
| Pagination | Cursor &gt; offset; `keepPreviousData` / `placeholderData` to prevent layout jump |
| Prefetch | On hover / route intent; `enabled` for dependent queries |
| Real-time | Socket/SSE → `setQueryData` / `invalidateQueries`; polling as fallback only |
| Waterfalls | Parallel fetch; hoist to route boundary; server loader / RSC |
| Cache model | Normalised (consistent, complex) vs document (simple, may diverge) |
| Consistency | Name your model; pick read-your-writes / monotonic / causal explicitly |
| Conflicts | LWW / server rebase / CRDT / OT — match to use-case |
| CRDT | Tombstone bloat → GC; Yjs for text collab; CRDT for offline/P2P |
| Local-first | Local DB + sync engine; partial replication; mutator model |
| Runtime trust | Zod parse at boundary; never trust response shape |
| Idempotency | Idempotency key on every mutation; causal order in offline queues |

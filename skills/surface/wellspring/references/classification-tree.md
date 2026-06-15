# The wellspring Classification Tree

This is the deterministic engine at the heart of `wellspring` — the router the **Classify** stage calls into so that two agents architecting the same application's state reach the *same* bucket for each piece of it. Open it at **STAGE 0 (Classify)** alongside [the-membrane.md](the-membrane.md), and keep it beside you for the rest of the build, because every later stage is downstream of where the state landed here. It is two mechanisms: the **five-question classification tree** (cheapest-answer-first, stop-on-hit — feeds `state-classified-by-bucket`) and the **store-size thermometer** that tells you, after the pass, whether the classification was right. It closes with the **grep-able classification smells** — the executable tells that the buckets are wrong.

The siblings own the other halves and are not re-explained here: minimizing the source of truth, the **duplicate-fact audit**, and the **form-as-deliberate-fork** live in [source-of-truth.md](source-of-truth.md); collapsing flag-soup into a status union lives in [state-machines.md](state-machines.md); the two-graphs wiring and the component-API discipline live in [data-flow-and-component-api.md](data-flow-and-component-api.md). Back to the contract: [../SKILL.md](../SKILL.md).

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **Nearly all frontend complexity is the same truth having more than one copy — in the DOM, the in-memory model, the server DB, the URL, localStorage, a component's state — and those copies drifting out of sync. So the whole discipline is subtraction: assign each piece of state to the ONE bucket that owns it, keep the source of truth minimal, and derive the rest.** The tree's order is deliberate: the cheapest, most local, least-stored answer is asked *first*, and you only escalate when forced. The agent will not feel the cost of this — it gets no green for picking the lighter bucket, it dumps everything into one global store because that is the path of least resistance, and a bloated store *looks* like a managed application. So the asymmetry that decides every coin-flip here: a piece of state placed too local is a cheap lift to a wider bucket later behind a clean boundary; a piece placed too global — or stored when it should have been derived — is a sync contract you signed and the next session will break. When a fork is a real toss-up, pick the **more local, less-stored, more-derived** bucket and write down the requirement that would make you escalate.

---

## TREE 1 — The five-question classification tree

Run **every meaningful piece of state** down this tree. Ask the five questions **in order**; **stop on the first "yes."** The order is not arbitrary — it sorts the buckets from cheapest (compute it, store nothing) to most expensive (a global store with its own lifecycle), so the first hit is the cheapest correct home. A piece that hits Q1 must never be carried down to Q4; an agent that "puts it in the store to be safe" has skipped the four cheaper buckets above it.

### Q1 — Can it be computed from state you already have?

- **PREDICATE:** is this value a pure function of other state already in hand — a filter, a sort, a sum, a boolean over a list, a validity flag?
- **Yes** → it is **DERIVED**. Never store it; **recompute it on the spot** (`filter(list, query)`, `items.every(selected)`, `isValid(form)`). **Stop.** The moment you store a derivative you sign a "remember to update this everywhere `query` changes" contract — and you will forget. This is where the single largest class of frontend bugs dies.
- **DEFAULT** on a coin-flip between "derive" and "store": **derive.** Recomputation is cheap and always correct; a stored derivative is a standing invitation to drift. Reach for memoization (not storage) only if a real profiler — not a guess — shows the recompute is hot.
- **FALLBACK** when you cannot yet tell if it is purely a function of other state: try to *write the function*. If you can express it as `f(existingState)` with no extra input, it is derived; if it needs a fact that lives nowhere else, it is independent — keep walking the tree.
- **Examples:** the filtered/searched list, is-all-selected, form validity, the derived total, "has unsaved changes" — all `filter(...)`/`every(...)`/`reduce(...)` computed at render.

### Q2 — Is its canonical copy owned by the server?

- **PREDICATE:** is this value persisted on the server and changeable by *another* session, user, job, or source — so the copy on screen is a snapshot of a remote truth that can move underneath you?
- **Yes** → it is **SERVER-CACHE**, not your state. Put it in the **query/cache layer** (a TanStack-Query-class library: invalidation, request dedup, background refresh, stale-while-revalidate) — not a variable, not a store. **Stop.** Treating remote data as a cache (with a freshness lifecycle) instead of as plain state is the single distinction that shrinks most "state-management" problems.
- **DEFAULT** on a coin-flip between "server-cache" and "client-owned": **server-cache.** Most of what *feels* global is server-cache in disguise; misfiling it as client state is the mistake the thermometer below is built to catch. Ask "who is the source of truth — the server, or this tab?" The honest answer is usually the server.
- **FALLBACK** when you cannot tell who owns the canonical copy: ask "if this tab vanished, where would this value still exist?" If the server, it is server-cache. If only here, keep walking.
- **Examples:** the logged-in user's profile (it *feels* like global state — it is server-cache); a fetched list, a record being viewed, anything that came over the wire. ~90% of what a novice would jam into a global store is correctly diverted here.

### Q3 — Should it survive refresh, be shareable, or take part in back/forward?

- **PREDICATE:** would you want this value to outlive a page refresh, be reproducible by pasting a URL to a colleague, or be undone by the browser back button?
- **Yes** → it is **URL STATE**. Put it in the router — **search params** for filters/tabs/pagination, the **path** for the resource identity. **Stop.** The router *is* a state container; the URL is shared, bookmarkable, and back/forward-aware for free, and re-implementing those by hand is the SPA tax.
- **DEFAULT** on a coin-flip about whether something belongs in the URL: **put it in the URL** if it changes *what the user is looking at*. The test is concrete — *send this URL to a colleague; should they see the same screen?* If yes, it is URL state.
- **FALLBACK** when you cannot tell if it should be shareable: ask whether losing it on refresh would annoy the user. A filtered table that resets to empty on F5 is the tell that it should have been URL state.
- **Examples:** filter/search criteria, the active tab, pagination, the selected detail item, a deep-linkable modal's open state.

### Q4 — Is it genuinely client-owned AND needed by components with no clean parent-child line?

- **PREDICATE:** does this value (a) belong to *this client* — not the server, not the URL — *and* (b) get read by multiple components that have no clean owner→descendant relationship?
- **Yes** → it is **SHARED CLIENT STATE** (a store / signals / context). **But first ask one more question** (the cheaper alternative the agent always skips): *can it be lifted to a common ancestor and passed down as props (composition)?* Reach for a store **only when** lifting-and-passing is genuinely too ugly — distant cousins, deep scattered leaves. The channel choice (props/composition vs context vs store-with-selectors) is the wiring discipline owned by [data-flow-and-component-api.md](data-flow-and-component-api.md); here, the bar is simply *did you rule out lifting first?*
- **DEFAULT** on a coin-flip between "lift it" and "put it in a store": **lift it.** Composition (children/slots) dissolves most prop-drilling with *no* state library, and it keeps the store small — which is the whole point (see the thermometer). The store is the expensive bucket; earn it.
- **FALLBACK** when you cannot tell if the consumers are truly scattered: assume they are not yet. Start with props/composition; promote to a store the moment a real second scattered consumer appears, not in anticipation of one.
- **Examples:** the few things that are *both* truly global *and* genuinely client-owned — theme (light/dark), sidebar collapsed/expanded, a client-only feature toggle. This bucket should stay nearly empty.

### Q5 — None of the above

- **PREDICATE:** did the state fall through Q1–Q4 with no "yes"?
- **Yes** → it is **LOCAL UI STATE** — keep it in the component (`useState`). This is the **default home**, and most ephemeral state belongs here.
- **DEFAULT / FALLBACK:** there is nothing below this; Q5 is the floor. When in doubt about *any* piece of state, the bias is *toward* here — local, ephemeral, owned by exactly one component — not toward the store above it.
- **Examples:** the text being typed in an input, hover state, whether *this one* dropdown is open, a transient "copied!" tooltip flag.

---

## TREE 2 — The store-size thermometer (the self-check after the pass)

The five-question tree is the procedure; the thermometer is how you know it worked. Run the whole pass, then look at what landed in **Q4 (the global store).**

| Store-size reading | What it means | What it points at |
|---|---|---|
| **Tiny** (theme, a couple of truly-global client toggles) | the classification is healthy — server-cache, URL state, and local UI state were each diverted to their own bucket | done; keep it this small as features grow |
| **Large / growing** | near-certain proof the classification is **wrong** — the cheaper buckets above Q4 were skipped | re-run the tree on each item in the store; **usually it is server-cache masquerading as client state** — divert it to the query/cache layer and the store deflates |

- **PREDICATE:** after the pass, is the global store small (a handful of genuinely-global client values) or large (lists, fetched records, filters, half the app)?
- **DEFAULT** on a coin-flip about whether the store is "too big": treat it as **too big** and re-run the tree. The cost of a falsely-small verdict (a bloated store that rots) is far higher than the cost of one extra classification pass.
- **FALLBACK** when you cannot judge the store's size against the app's: count what *should* be there — the truly-global, truly-client-owned values — and check whether the store holds much more than that list. If it does, the surplus is misfiled.

> **The store's size is the temperature of your classification.** It is the one number that tells you, without reading any logic, whether the buckets are right. A large store is not a sign you need a *better* state library — it is a sign you classified wrong, almost always by leaving server-cache in the store instead of giving it to the cache layer. This is also the gauge `husbandry` re-reads later: when features pile on and the store swells again, that is the signal to re-run this tree and move the server-cache back out. **The store is a means to a small, well-classified surface, never an end** — a big store is a symptom, not a capability.

> **The agent multiplier:** an agent feels none of the out-of-sync bugs that a bloated, mis-bucketed store produces — it gets the same green from `state.user = ...` in a global store as from a query cache, and the store is the path of least resistance because one mutable bag asks no classification questions. It will store the derived list *and* wire a `useEffect` to keep it in sync, dump fetched records into the store, and never feel the sync contract it just signed. That is exactly why the bucket for each piece of state is a call that must be **decided and gated by a human** — the thermometer is the cheap, mechanical check that the agent's default did not quietly happen.

---

## The grep-able classification smells

These are the executable tells that the buckets are wrong — each one searchable in the codebase, each pointing at a specific re-classification. Treat a hit as a finding, not a style nit.

| Smell (grep-able) | The tell | Re-classify to | Tree fork |
|---|---|---|---|
| **A large global store** | the store holds lists, fetched records, or half the app's data | most of it is server-cache → move to the query/cache layer | Q2 / thermometer |
| **`useEffect` copying one state into another** | `useEffect(() => setX(deriveFromY(y)), [y])` — the canonical "stored a derivative" anti-pattern; grep for it directly | a stored derivative → delete the copy, recompute on the spot | Q1 |
| **Filter/search lost on refresh, or unshareable** | the table resets to empty on F5; the filtered view can't be sent as a link | it should be URL state → move filters to search params | Q3 |
| **Server data copied into a local variable / store** | a fetched value re-assigned into `useState`/store (e.g. `user` → local `userName`) | server-cache treated as plain state → keep it in the cache layer; if it needs editing, that is a *form* (a deliberate fork — see [source-of-truth.md](source-of-truth.md)) | Q2 |
| **A bug report that says "it's out of sync"** | the view didn't update when the data did, or two components disagree | the same fact is stored in two places → run the duplicate-fact audit in [source-of-truth.md](source-of-truth.md) | Q1 / source |
| **Three-plus interdependent boolean flags** | `isLoading`, `isError`, `isSuccess`, `isSubmitting` as separate booleans | an un-modeled state machine → collapse to a `status` union; this is the **Machine** stage, owned by [state-machines.md](state-machines.md) | (machine) |

> Some of these are mechanically enforceable. `husbandry` and the project's lint layer can ban direct global-store/localStorage writes outside a designated layer, and a custom rule can flag the "copy state into state with `useEffect`" smell — the Q1 derivative tell. Not everything classifies by lint, but the high-frequency violations above do; gate the ones that can be, and keep the human judgment for the calls that can't.

---

## Worked traversal (a product-list screen handed to you)

A screen showing a paginated, filterable list of products; a search box; a multi-select with a "select all"; a row that expands to a detail panel; a theme toggle in the header. The agent's first draft put *all* of it in one global store. Walk each piece down the tree:

1. **The product list (fetched from the API).** Q1 no (not computed). Q2 **yes** — the server owns it, another session can change it. → **SERVER-CACHE**, query/cache layer. Stop. *(Out of the store.)*
2. **The filtered/searched list.** Q1 **yes** — it is `filter(products, query)`. → **DERIVED**, recompute at render; never store. Stop. *(The agent had stored it and wired a `useEffect` — delete both.)*
3. **The search query + active filters + page number.** Q1 no, Q2 no. Q3 **yes** — send the URL to a colleague and they should see the same filtered page; it should survive refresh and back/forward. → **URL STATE**, search params. Stop. *(Out of the store.)*
4. **The selected detail item.** Q3 **yes** — deep-linkable, should survive refresh. → **URL STATE** (the path or a search param). Stop.
5. **"Is everything selected" flag.** Q1 **yes** — `selectedIds.length === products.length`. → **DERIVED**. Stop.
6. **The set of selected row IDs.** Q1 no, Q2 no, Q3 — arguably no (transient bulk action). Q4 — read only by the table and its toolbar, a clean ancestor exists. → not shared; lift to the table's parent. **LOCAL UI STATE** at that ancestor (Q5).
7. **The theme toggle.** Q1 no, Q2 no, Q3 no. Q4 **yes** — genuinely client-owned, read by scattered components with no clean parent line. → **SHARED CLIENT STATE** (a low-frequency value — Context is the right channel; see [data-flow-and-component-api.md](data-flow-and-component-api.md)).
8. **The search input's in-progress text / a row's hover.** Falls through to Q5. → **LOCAL UI STATE**, `useState`.

**Thermometer:** what's left in the global store is the theme — *one* value. The list, the filters, the selection, the derived flags all went to their proper buckets. The store deflated from "half the app" to a single toggle: the classification is right. The map this produces — every piece of state, its bucket, its source of truth — is the stage's product, and it is what the duplicate-fact audit in [source-of-truth.md](source-of-truth.md) is then run against, and what `seaworthy` turns into the loading/error/empty/data states each piece must handle.

# Source of Truth & Consistency — the deepest one-way door

This reference is the depth behind **STAGE 2 — Source** of the [../SKILL.md](../SKILL.md) flight plan. It governs the two checks of that stage: **`source-of-truth-mapped`** (the table — where each truth's canonical copy lives) and **`consistency-and-trust-boundary-fixed`** (how consistent that copy must be, and the network/trust line every client input crosses). This is the most clarifying decision of stage zero, and the most expensive to reverse — so it is gated, on paper, before any line of code can fossilize the wrong answer.

The deterministic *routing* — the PREDICATE/DEFAULT/FALLBACK forks of the consistency tree, the trust-boundary rider, the hot/cold cut — lives in [decision-tree.md TREE 2](decision-tree.md#tree-2--the-consistency-model-tree-the-deepest-one-way-door); this file is the *why* and the *judgment* behind those forks: how to build the table, how to read "weakest sufficient," and why the trust boundary admits no exception. The two read together — open both at STAGE 2.

The governing fact, inherited from [the-membrane.md](the-membrane.md) and restated because every call below is judged against it:

> **The source of truth lives in the user's mind, not the database — and almost all frontend pain is one truth having more than one copy that drift out of sync. So the craft is subtraction: name where each truth's canonical copy lives, keep that set minimal, derive everything else, and demand a real requirement before letting any copy go consistent the expensive way.** A consistency model is a one-way door: under-build and you add the feature behind a clean boundary later; over-build (a CRDT nobody co-edits, a subscription where a refetch would do) and you have signed a rewrite and a tax on every future reader.

## Contents

- [The table — where each truth's canonical copy lives](#the-table--where-each-truths-canonical-copy-lives)
- [Derived values get no home — storing a derivative signs a sync contract](#derived-values-get-no-home--storing-a-derivative-signs-a-sync-contract)
- [Server state is a cache, not state — the category error under the table](#server-state-is-a-cache-not-state--the-category-error-under-the-table)
- [The consistency model — pick the weakest sufficient one](#the-consistency-model--pick-the-weakest-sufficient-one)
- [Meaning consistency beats data consistency](#meaning-consistency-beats-data-consistency)
- [The trust boundary — every client input is hostile](#the-trust-boundary--every-client-input-is-hostile)
- [The agent-era failure mode, and what it forces](#the-agent-era-failure-mode-and-what-it-forces)
- [Where findings route](#where-findings-route)

---

## The table — where each truth's canonical copy lives

The artifact this stage produces is one table. For each class of core data, name the location of its **canonical copy** — the one place that, when it and another copy disagree, *wins by definition* — and the consistency model that copy must hold. Four homes:

| Home | What lives here | Example |
|---|---|---|
| **Server** | data the client does not own — a truth living elsewhere, that other sessions and backend jobs can mutate | product price, order status, the user's profile |
| **URL** | state that must survive a refresh, be shareable, and take part in back/forward | the current filter, the search query, the open tab, pagination |
| **Local client** | state the client genuinely owns and no one else can see | a modal's open/closed, an unsubmitted form's contents, a hover |
| **Collaborative CRDT** | a truth co-edited by several clients at once, reconciled without a single server arbiter | a shared document body, a shared canvas |

A worked starting table, drawn from the source — note the columns, and note the row that matters most:

| Data class | Source of truth | Consistency model |
|---|---|---|
| Product price | Server | fetch + cache, may be briefly stale |
| Current filter | URL | synced, shareable |
| Draft content | Local (or collaborative CRDT) | depends on whether it is co-edited |
| **Shopping cart** | **? ← this `?` is exactly the call you must make now** | |

**The `?` is the whole point of the exercise.** The shopping cart is the classic unresolved cell because it has a real, hard answer hiding behind a shrug: is it server-owned (persists across devices, survives logout — then it is a cache with all a cache's duties), or local (lives in this browser, dies with it — then it is client state)? Leaving the cell blank does not defer the decision; it makes it *implicitly*, badly, the first time two copies disagree and a customer sees the wrong total. **An undecided owner is a sync bug already written.** The exit bar for the table is that a new engineer can read it and say, of any datum, *who owns this and how fresh must it be* — without a conversation. If a cell needs a conversation, it is not filled.

This same table is the one-page boundary doc that the `wellspring` skill later refines into the full five-bucket state classification (its Q1–Q5 tree and the store-size thermometer). Here you pin the *core data classes* and the one-way door; there it becomes *every meaningful piece of state in the app*. Pin the doors here; let `wellspring` do the fan-out.

## Derived values get no home — storing a derivative signs a sync contract

Before you assign a home to anything, ask whether it deserves one. **A value that can be computed from state you already hold is *derived*; it gets no row in the table, because it has no canonical copy — it *is* the computation.** The filtered list is the list plus the filter, recomputed. "Is everything selected" is the selected set compared to the full set. Form validity is the form run through the rules.

Storing a derivative is not a convenience; it is signing a contract that reads *"I promise to recompute and rewrite this every single time any of its inputs change, in every code path, forever"* — and that contract is broken the first time a path is added that forgets. The two copies (the inputs and the stored derivative) drift, and the drift is a class of bug that does not exist if the value was never stored. So the rule is sharp: **derived values are recomputed, never stored.** When the table tempts you to give a derivative a home — give it none, and write the derivation instead.

(The *duplicate-fact audit* that systematically hunts stored derivatives across the whole app — `items` + `filteredItems` is a bug, `items` + `selectedItemId` is fine because they are two different facts — belongs to the `wellspring` skill's source stage. Here you only refuse to *seat* a derivative in the core table; there it becomes a full sweep.)

## Server state is a cache, not state — the category error under the table

The single insight that makes the table fall into place: **data fetched from the server is not "state" — it is a cache of a truth that lives somewhere else.** Local state is state you *own* (a popover's open flag, what's typed into a form). Server data you do not own; it is a copy of a canonical truth living on the server, and a cache has properties local state never has:

- it goes **stale** (the price changed on the server while you held the old one),
- it needs **revalidation** (re-check against the source),
- it needs **request deduplication** (two components asking for "the current user" at once should share one request, not fire two),
- it needs **background refresh** (silently re-fetch so the next read is fresh).

The historical error — the "original sin of the Redux era" — was jamming fetched-from-server data and local UI state into the same box with the same lifecycle, when they are *different species*. The real insight of a TanStack-Query-class library (or SWR, or any cache layer) is not its ergonomic API; it is that it names this a **category error** and hands server data the cache mechanics it always needed — invalidation, stale-while-revalidate, dedup — instead of treating it as a plain variable in a global store.

This matters at *table-drawing* time, not just at coding time: when a row's source of truth is **Server**, you have not finished by writing "Server" — you have committed to a *cache*, with a staleness answer (how stale is tolerable?) and an invalidation answer (what event makes this row wrong?). Writing "Server / cache, may be briefly stale" in the consistency column is a real decision, not boilerplate. (Frontend, going in circles, rediscovers the old joke: the two hard problems in computer science are cache invalidation and naming things.)

## The consistency model — pick the weakest sufficient one

The source-of-truth column says *where* the truth lives; the consistency column says *how consistent the on-screen copy must be with it* — and **that is the real one-way door.** It is decided down [decision-tree.md TREE 2](decision-tree.md#tree-2--the-consistency-model-tree-the-deepest-one-way-door)'s three predicates, walked in order, stopping at the first "yes" a real requirement forces. The conceptual content of those three rungs — and why each is a heavier door than the last:

| Rung | The question | What "yes" commits you to | Why it is a one-way door |
|---|---|---|---|
| **1 — live read** | will this value go stale *while the user watches it*, because another source mutates the canonical copy? | realtime / poll / subscribe — a client cache kept live against a moving server | contained, but you now own a subscription's lifecycle and reconnection |
| **2 — concurrent edit** | do two users mutate the **same** record at once, so writes genuinely collide? | conflict resolution — CRDT / OT / last-write-wins-with-rules | a **whole-architecture fork**: the client joins a distributed consensus problem; bolting it on later is a rewrite, not a feature |
| **3 — offline** | must the user create/edit with no network and sync later? | local-first — the client becomes a distributed node with its *own* source of truth | the heaviest: pulls in conflict resolution (the user's two devices now collide), background sync, a local persistence layer |

**The discipline runs backwards, and this is the whole point.** Every "yes" pushes the project toward heavier, harder-to-reverse architecture, so the burden of proof sits on *escalating*, never on staying light. **Default to the weakest consistency model that meets a real requirement, and escalate only when a concrete need forces you.** The novice escalates on aesthetics — "make it realtime," "make it collaborative" — and signs a rewrite for a benefit no user asked for. The master demands a concrete scenario before each "yes": *who* sees the stale value and *why is it wrong* (not merely old) before adding live updates; *which two users* edit the *same* record concurrently before reaching for a CRDT; *what task* must happen with no network at all (not just on a flaky one) before going local-first.

Two collapses do most of the un-escalation work:

- **"Make it collaborative" usually means "make it live."** Most "multi-user" products are multi-user *readers* of single-writer records — that is rung 1, not rung 2. Two people moving *different* cards on a board is last-write-wins-per-card, not a conflict. Reserve rung 2 for genuine co-editing of the *same* object (a shared doc body, a shared cell). *Do not put a CRDT on something nobody co-edits because collaboration is cool* — the cost is permanent, the benefit imaginary.
- **"Offline" usually means "resilient to a bad network."** Surviving a flaky cafe connection (rung 1's cache + optimistic UI handles it) is a far weaker and cheaper requirement than working fully offline on a plane (rung 3). Conflating them buys a rewrite to solve a perception problem.

When a requirement is "maybe later," do not build it and do not pretend it is gone: **record it as a deferred one-way door** — name the data class that *would* need to escalate, and the trigger that would force it. You are buying the option to decide later with eyes open. The one thing the agent must never do is *half*-build an escalation (half-built offline silently drops writes — worse than none).

### Meaning consistency beats data consistency

The deepest reason the *weakest* model is usually right, and the one that contradicts engineering instinct: **a slightly-stale-but-stable view usually beats a freshest-possible-but-flickering one.** The machine's correctness wants the newest data always; the mind's correctness wants a coherent, non-jumping picture it can reason about. When those conflict, the mind wins on most paths — because a value that visibly twitches as live updates land is *less* usable than one that is a second old and holds still.

This is not a compromise of rigor; it is the actual justification behind debounce, skeleton screens, and stale-while-revalidate — techniques that deliberately show slightly-old-but-stable data rather than chase the freshest. So "default to the weakest consistency" is not only the cheaper-architecture argument; it is often the *better-experience* argument too. (The perception-side depth — why a stable view reads as trustworthy and a flickering one as broken — is [perception-contract.md](perception-contract.md)'s.) Add live updates when a stale value is *wrong*, not merely *old*.

## The trust boundary — every client input is hostile

Drawn on the same table as the consistency model, because both define the *network/trust line* — the boundary the membrane sits on. Unlike the consistency model, this rider has **no DEFAULT and no FALLBACK, because it has no coin-flip:**

> **Treat every input that arrives from the client as hostile.** The client is not yours. The user can read your JavaScript, open the network tab, forge any request, replay it, and skip your UI entirely. A request is *not* made by your form — it is made by whoever holds the endpoint.

So for each data class and each mutation, **name explicitly** which **validations** and which **authorizations** are re-done on the server:

- The client-side check is a **UX affordance** — fast feedback, a red field before a round-trip. It is not, and can never be, enforcement.
- The server-side check is the **actual enforcement**. If a rule has consequences — price, ownership, quota, role, identity — it is enforced server-side or it is not enforced at all.

**Before / after, the canonical leak:**

```
# the agent's reflex — validation lives only where the form is
client: if (price < 0) showError()        # the only check
server: charge(userId, cartTotal)          # trusts cartTotal as sent — forge it and the price is yours

# the boundary drawn — the client check is a courtesy, the server check is the law
client: if (price < 0) showError()                 # fast feedback, nothing more
server: cart = loadCart(session.userId)            # re-derive from the truth the client cannot touch
        assert authorize(session.userId, cart)      # re-check ownership, not "the form said so"
        charge(session.userId, recompute(cart))     # recompute the total server-side; never trust the sent one
```

The tell is always the same: a rule validated *only* on the client because "the form already shows the error, so the request can't be malformed." It can — the request is not the form. Walk every consequential mutation and mark the server re-check: re-validate the shape, re-authorize the actor, re-derive any value that has consequences (never trust a price, a quantity, a role, or an id sent from the client). This is also where the table meets the `aegis` skill's threat-modeling — the trust line you draw here is the same line `aegis` defends; name it once, here, with no exceptions.

## The agent-era failure mode, and what it forces

This decision is gated precisely because of how the agent fails it. Three reliable tells, and why each is invisible to the agent:

- **It models the database, not the mind.** Handed a domain, the agent reflexively makes the UI a visualization of the tables — because the schema is the most concrete artifact in its context, and the user's mental model is in a brain it cannot read. The table-drawing discipline forces the inversion: the canonical truth is *where the user believes it lives*, then the data structures serve that.
- **It over-escalates the consistency model, feeling none of the rewrite.** "Realtime," "CRDT," and "local-first" read as sophistication in the training distribution; picking the lighter door earns no green and looks like under-engineering. The agent will reach for the impressive answer and never feel the rewrite it signed — *or* skip the decision entirely, because `fetch(...)` compiles and runs whether or not anyone decided the consistency model. Both failures are silent. The gate forces the call onto paper while reversing it is still free.
- **It trusts its own input.** The agent validates on the client because that is where the form is, and the request it imagines is the request its own UI makes — it does not model an adversary forging the call, because no part of "make the feature work" surfaces the attacker. It will ship a client-only check green and feel finished.

What this forces: **the source-of-truth table, the consistency model per class, and the trust boundary must be decided and gated here** — written down, before the code exists to fossilize a wrong default and before the agent's green-seeking optimizer can substitute "it runs" for "it is right." This is the suite's through-line at its sharpest: push correctness out of runtime carefulness and into a structural decision made once, on paper, at the root. The agent does the mining and the drafting of the table; the calls it *cannot* make — which truth lives where, which consistency model to commit to, where the trust line falls — stay with you.

## Where findings route

- The deterministic routing for every fork above — the PREDICATE/DEFAULT/FALLBACK forms, the trust-boundary rider, the worked "collaborative project-tracker" traversal — is [decision-tree.md](decision-tree.md). This file is its *why*; that file is its *how*.
- The latency side of "must feel instant, so it cannot wait on the server" — which forces optimistic UI on top of a weak-consistency model — is the [perception-contract.md](perception-contract.md) tier table. The two meet at every hot-path mutation.
- Whether the metric the live/collaborative feature serves is an *honest* one (engagement-on-a-board can be a manipulation target) routes to [objective-function.md](objective-function.md).
- The full state classification this table seeds — the five-bucket Q1–Q5 tree, the **duplicate-fact audit**, the store-size thermometer, server-cache-vs-client-state at the *per-state* grain — is the `wellspring` skill's, downstream. Pin the core data classes and the one-way door here; hand the fan-out there.
- The server-side enforcement this trust boundary names is built and threat-modeled by the `aegis` skill; the same boundary is attacked to prove it holds by `gungnir`. Name the re-checks here; route the implementation and the proof there.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (the *state* axis and the network/trust line — *why* this stage reads as it does) · [decision-tree.md](decision-tree.md) (TREE 2, the consistency forks and trust-boundary rider this file is the depth behind) · [perception-contract.md](perception-contract.md) (meaning-consistency, and the instant tier that forces optimistic UI) · [objective-function.md](objective-function.md) (whether a live/collaborative feature serves the user) · [../SKILL.md](../SKILL.md) (the five-stage flight plan this reference serves — STAGE 2, Source).

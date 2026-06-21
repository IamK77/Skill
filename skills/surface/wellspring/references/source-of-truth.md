# The Source of Truth — the duplicate-fact audit and the one legitimate copy

This reference is the depth behind **STAGE 1 — Source** of the [../SKILL.md](../SKILL.md) flight plan. It governs one check: **`source-of-truth-minimized`** — the discipline that keeps the truth *single* once [classification-tree.md](classification-tree.md) has decided *where* each piece of state lives.

The previous stage answered **where** truth lives (server-cache, URL, shared client, or local — the five-question tree). This stage answers a sharper, narrower question that the bucket assignment alone does not settle: **for each fact, is it stored more than once — and if so, which copy must die?** A piece of state can be in the *right bucket* and still be a bug, because the bucket says nothing about whether the same fact also lives, redundantly, somewhere else.

The governing fact, inherited from [the-membrane.md](the-membrane.md)'s *state* axis and restated because every call below is judged against it:

> **Nearly all frontend complexity is the same truth living in more than one copy, and those copies drifting out of sync.** The craft is subtraction: keep the source of truth minimal and *derive* everything else, so there is nothing left to keep in sync. A value you store is a value you have promised to keep current; a value you compute cannot lie, because there is no second copy to disagree with the first. Every rule here is judged by one question — *does this create a second copy of a fact I now have to keep synchronized?* — never applied as dogma.

## Contents

- [The core principle — a stored derivative is where bugs die](#the-core-principle--a-stored-derivative-is-where-bugs-die)
- [The duplicate-fact audit — the executable method](#the-duplicate-fact-audit--the-executable-method)
  - [Step 1 — list the facts, not the variables](#step-1--list-the-facts-not-the-variables)
  - [Step 2 — for each fact, ask "is this same fact stored anywhere else?"](#step-2--for-each-fact-ask-is-this-same-fact-stored-anywhere-else)
  - [Step 3 — when the answer is yes, decide which copy dies](#step-3--when-the-answer-is-yes-decide-which-copy-dies)
  - [The judgment call — two facts vs one fact twice](#the-judgment-call--two-facts-vs-one-fact-twice)
- [Worked examples — fine, bug, bug](#worked-examples--fine-bug-bug)
- [The one legitimate copy — a form is a deliberate fork](#the-one-legitimate-copy--a-form-is-a-deliberate-fork)
- [The agent-era failure mode — why this must be gated](#the-agent-era-failure-mode--why-this-must-be-gated)
- [How findings route](#how-findings-route)

---

## The core principle — a stored derivative is where bugs die

A **derived value** is any fact you can *compute* from facts you already hold: the filtered list (`filter(items, query)`), the is-all-selected flag (`items.every(selected)`), the form's validity (`validate(draft)`), the order's display label (`statusLabels[order.status]`), the count, the total, the sorted view. None of these is independent state. Each is a *function of* state that already exists.

The moment you **store** a derived value instead of computing it, you have signed a contract: *"every time any input changes, I will remember to recompute and rewrite this."* The contract has no enforcement. Nothing in the type system, nothing in the runtime, reminds you the day you add a new way to mutate the input. So the stored copy and its source drift, and the drift surfaces as the single most common class of frontend bug — *"it's out of sync."* This is why **a stored derivative is the first place bugs die.** It is not a style preference; it is the difference between a fact that *cannot* be wrong (recomputed on the spot, always current) and a fact that is wrong the first time someone forgets the contract — which, across a codebase's life and a chain of agent sessions with no memory of the contract, is *certain*, not *possible*.

The cure is one move, applied relentlessly: **minimize the source of truth, derive the rest.** Store only what is genuinely independent — what cannot be computed from anything else. Everything downstream is recomputed at the point of use. There is then no second copy, so there is nothing to keep in sync, so that entire class of bug is *structurally absent* rather than *defended against*. This is the suite's through-line — *push correctness into structure* — at its sharpest: the bug is gone not because you guard against it but because the state it needs has no representation.

> **The minimal-state probe, for any value you are about to store:** *can I write a pure function that produces this from state I already hold?* If yes, it is derived — do not store it; write the function and call it. If no — if it is a genuinely independent fact that no computation can reconstruct — store it, and it earns its place in the source of truth.

---

## The duplicate-fact audit — the executable method

The audit is the operational form of the principle. It is the second half of STAGE 1, run after the classification tree has bucketed every piece of state, and it is mechanical enough to hand most of it to an agent while keeping the judgment for yourself.

### Step 1 — list the facts, not the variables

Write down every meaningful piece of state in the slice. The discipline is to list it as *facts the system knows*, not as the variables that happen to hold them — because the whole point of the audit is to catch the case where **one fact wears two variables**. "The list of products," "which product the user has selected," "what the user has typed in the search box" are three facts. "The filtered list" is *not* a fourth fact — it is the first three composed — and listing it as a variable is exactly the error the next step exposes.

**Start the list from what the user sees.** The most reliable entry point is the rendered surface: every number, count, status, label, and total on screen is a fact the system is asserting — write those down first, then trace each back to the state it is read from or computed from. A displayed value that *more than one* source could produce (a stored field **or** a derivation) is already the duplicate, caught from the outside in. Starting instead from "the state in the slice" biases you toward the code you happened to be reading and lets a displayed value with a hidden second source slip past — which is exactly how a buried stored-derivative survives an audit that only walked the code path already in view.

### Step 2 — for each fact, ask "is this same fact stored anywhere else?"

Walk the list and, for each entry, ask the single audit question:

> **Is this same fact stored anywhere else — in another variable, another bucket, another component, the server *and* a local copy?**

This is a *fact-identity* question, not a *value-equality* question. Two variables that happen to hold the same value right now are not necessarily a duplicate; two variables that are *the same fact* are, even when their values momentarily differ (in fact, the moment their values differ is the bug firing). The probe that disambiguates: **if fact A changed, would fact B have to change in lockstep to stay correct?** If yes, B is not independent — it is a copy or a derivative of A, and storing both is the contract you will break.

**Do not "ask" from memory — enumerate by search.** The question is answered by *finding every site that writes the fact*, not by recalling whether you have happened to see a second copy. For each fact, search the code for every place that **assigns** it — its setter, every `updateX` / `setX`, every reducer case, every handler that writes it — not just where it is read; the duplicate is precisely the writer you did not have in view. Two shapes make it explicit:

- **Two or more independent writers of the same fact** — the same total / flag / id assigned from more than one place is a fact with more than one author, and they will drift. (A running total accumulated by two different event handlers is the canonical case.)
- **A read of the shape `hasStored(x) ? x : derive(x)`** — a consumer that *prefers a stored copy* and only *derives* as a fallback is holding one fact twice. The `derive(x)` branch is proof the value is derivable, which makes the stored/preferred branch the redundant copy: delete it and always derive. This one hides in plain sight — the clean `derive` function sitting next to it reads as "good," when it is in fact the evidence that the stored copy must die.

### Step 3 — when the answer is yes, decide which copy dies

A "yes" is never resolved by *syncing* the two copies — syncing is the contract, and the contract is the bug. It is resolved by **removing the duplication**, one of two ways:

| The duplicate is… | The fix | Why |
|---|---|---|
| **A derivative** (one copy is computable from the other) | delete the stored copy; compute it at the point of use | the source remains single; the derivative cannot drift because it no longer exists as state |
| **A redundant copy** (the same independent fact held in two places for no editing reason) | delete one; have both readers consume the one that remains | one fact, one home; there is no second copy to disagree |

The single move that is *not* on this table — and is the agent's reflex — is **"keep both and add a `useEffect` to copy one into the other."** That is not a fix; it is the contract written in code, the canonical *stored-a-derivative* smell, and it is grep-able. Deleting it and computing on demand is almost always the correct change.

### The judgment call — two facts vs one fact twice

This is the call the audit turns on, and the one the agent cannot reliably make, so it stays with you. Most of the audit is mechanical (list the state, grep for copies); the diagnosis of *whether two variables are two facts or one fact twice* is judgment.

- **PREDICATE:** are these two variables *independent facts* (each can change without forcing the other to change to stay correct) or *one fact in two clothes* (one is computable from the other, or both are the same datum copied)?
- **DEFAULT** on a genuine coin-flip: treat it as **a duplicate** and make one derived. The asymmetry favors it — collapsing two genuinely-independent facts into one derivation is a small, visible, easily-reverted mistake (you discover it the moment they need to diverge), whereas keeping a real duplicate is an invisible sync bug that fires later, in production, far from the cause. When unsure, prefer the form with fewer stored facts.
- **FALLBACK** when you cannot yet tell whether they will always move together (the requirement isn't pinned): keep them separate for now, but **write down the question** — "is `X` always derivable from `Y`, or can they legitimately diverge?" — and resolve it before the slice ships. An undecided duplicate is an unsigned sync contract; do not let it through the gate unnamed.

---

## Worked examples — fine, bug, bug

The audit's calibration lives in three canonical pairs. The first is *fine*; the next two are *bugs*. Memorize the shape, not the cases.

**`items` + `selectedItemId` → fine (two different facts).** The list of items is one fact; *which* item is selected is a genuinely independent second fact — knowing the list tells you nothing about the selection, and the selection can change without the list changing. Neither is computable from the other. Two facts, two stores, no duplication. This passes the audit untouched.

**`items` + `filteredItems` → a bug (the second is derived).** `filteredItems` is `items.filter(matchesQuery)` — fully determined by `items` and the query. It is not a fact; it is a *function of* facts. Stored, it is the textbook signed-and-broken contract: change `items` (an item arrives, one is deleted) or change the query, and unless every such mutation also rewrites `filteredItems`, the view shows a stale filter. The fix is to *delete* `filteredItems` from state and compute it where it is read — `const filteredItems = items.filter(matchesQuery)` at render. Now it is structurally impossible for the filtered view to disagree with the list, because there is only one list.

**Server `user` copied into a local `userName` → a bug.** The server owns `user` (it is server-cache — see [classification-tree.md](classification-tree.md)). Copying `user.name` into a separate local `userName` variable creates a second home for one fact: when the server's `user` refetches or updates, `userName` is stale, and the screen shows the old name beside fresh data. Read `user.name` directly from the cache; do not mint a local mirror. The only thing that *would* justify a local copy here is the next section — and it is a copy with a name and a job.

> Note the family resemblance: all three "bugs" are the same disease — a fact given a second home — and the cure is always the same move, *delete the second home* (derive it, or read the canonical one). The audit is just the habit of looking for the second home before it drifts.

---

## The one legitimate copy — a form is a deliberate fork

There is exactly **one** honest reason to copy a fact the system already owns (especially server-owned truth) into a separate local store: **to make it editable.** This is a form — or more precisely, a *draft*.

When a user edits a profile, you cannot edit the server's truth in place — the user might cancel, the edit might fail validation, the write might be rejected. So you **deliberately fork** the canonical truth into a local draft: you copy the server's `user` into local form state, the user edits the *draft* freely (and the canonical copy stays untouched and authoritative the whole time), and at an **explicit commit point** — the Save button, the submit — you write the draft back to the source. Name it as exactly what it is:

> **A form is a deliberate, explicitly-committed fork of the truth.** It is the one duplicate that is *correct*, because the duplication is the point — the local draft *exists to diverge* from the source for the duration of the edit, and the divergence is resolved at a single, named, intentional commit, not silently and continuously the way a stored derivative drifts.

This reframe dissolves most of the "where does form state go?" confusion in one stroke. The confusion comes from trying to decide whether form state is "server state" or "local state" — it is *neither and both*: it is a **local draft fork of server truth**, and that name tells you everything about how to treat it.

- **The draft is local UI state** while it is being edited — it does not belong in the query cache (it is not the cache; it is a divergent copy on purpose) and it does not belong in a global store (it is local to the edit). It lives where the edit lives.
- **The commit is explicit, and one-directional** — the draft flows back to the source at the commit point (the mutation), not continuously. *Auto-save* is just a form whose commit point fires on a timer or on-blur instead of on a button; it is still a deliberate, named commit, not a sync.
- **What makes the fork legitimate is the explicit commit.** A form copies-to-edit-and-writes-back at a named point. A bug copies-and-tries-to-stay-in-sync forever. The presence of a single, intentional commit point is the line between the two — if you cannot point to *the moment the copy is reconciled with its source*, you have a stored derivative wearing a form's clothes, not a form.

The corollary the unhappy-path stage inherits (handed to `seaworthy`): because the draft is a *fork*, a failed commit must not destroy it — *never lose the user's input*. The edit survives a rejected write so the user can retry, precisely because the local fork is still the authoritative copy of *the edit* until the commit succeeds.

---

## The agent-era failure mode — why this must be gated

The human author who stored a derivative felt a small unease — they knew they were signing a "remember to update this everywhere" contract, and they had been burned by an out-of-sync bug before, so the cost was *felt*. **The agent feels none of it.** Asked for a filtered list, it produces the most locally-complete-looking artifact: it stores the list, the query, *and* the filtered result, and wires a `useEffect` to keep the third in step with the first two — because that code *runs*, *looks* thorough, and turns the immediate task green. The agent does not feel the sync contract it just signed, does not carry the memory of the 3 a.m. drift bug, and will not be the session that forgets to update the copy — *a later session will*, inheriting a derivative-as-state it has no reason to suspect.

This is why the discipline cannot be left to taste and **must be gated** at `source-of-truth-minimized`:

- The agent **stores derivatives by default** — every "compute and remember" reads to it as more complete than "compute on demand," because the stored version has more code and more code looks like more work done.
- The agent **reaches for `useEffect` to sync state into state** — the canonical tell, and a grep-able one. It does not see a `useEffect` that copies one piece of state into another as a *smell*; it sees it as *wiring*.
- The agent **mints local mirrors of server fields** — pulling `user.name` into a `userName` for "convenience," signing a sync contract against a cache it does not control.
- The agent **cannot tell a form from a drift** — it will copy server state locally with no explicit commit point and call it a form, and it will store a derivative and call it state, because the *name* (form vs derivative) is a judgment about intent, and intent is precisely what the agent has no felt access to.
- The agent **blesses a path on the strength of a nearby clean derive function** — it sees a `calculateX()` / pure-compute helper and concludes "derived, single-source, clean," without checking whether a *stored* copy of the same fact is written elsewhere and *preferred* over that derivation. The clean derive is not reassurance; it is proof the value is derivable, which makes any stored copy a deletion target.
- The agent **pronounces the slice healthy before running the enumeration** — "well-architected," "no stored derivatives," "the store is small" — as an overall impression rather than the bottom line of a per-fact writer search, and that early impression then anchors a confirmation bias that suppresses the dig.

The gate forces the duplicate-fact audit to be *run and written down* while removing a duplicate is still a one-line change — before the slice ships and the drift becomes a production bug found far from its cause. The posture it enforces is **assume a stored derivative is hiding until the per-fact writer search says otherwise**: a "looks clean" verdict that is not itself the *output* of that enumeration is the confirmation bias this stage exists to break, not an audit. The final-check phrasing is the audit's verdict: **no fact is stored twice** (the one exception being a form, a named and committed fork), and the source of truth is minimal with everything else derived.

---

## How findings route

`source-of-truth` owns the duplicate-fact audit and forms-as-fork; it hands its findings on and leans on its siblings for the parts it deliberately does not re-explain.

- **The five-question bucket tree** (Q1 derived → Q2 server-cache → Q3 URL → Q4 shared-client → Q5 local) and the **store-size thermometer** live in [classification-tree.md](classification-tree.md). This file does *not* re-teach where state lives — it assumes the buckets are assigned and audits for duplication *within and across* them. (Q1 of that tree — *can it be computed from state you already have?* — is the duplicate-fact audit's twin seen at classification time; the audit is the same question run again as a sweep over the whole map.)
- **The source-of-truth TABLE and the consistency tree** were set one stage upstream, in the `bearings` skill — [../../bearings/references/source-of-truth-and-consistency.md](../../bearings/references/source-of-truth-and-consistency.md). That table names *where each class of core data's canonical copy lives* (server / URL / local / collaborative) and *how consistent it must be* (the deepest one-way door). `wellspring` refines that coarse table into the full per-state classification, and this file keeps the refined map's truth single. Do not re-decide the consistency model here; consume it.
- **A derivative that turns out to be an interdependent set of booleans** — `isLoading` / `isError` / `isSuccess` masquerading as independent facts — is not a duplicate-fact finding; it is an un-modeled state machine. Route it to [state-machines.md](state-machines.md): collapse the booleans into a `status` union and list the legal transitions so the illegal combinations cannot be represented. (The two stages are kin — both *make illegal states unrepresentable* — but the booleans are the *machine* stage's concern, not the audit's.)
- **A duplicate that exists only because a value had to be passed through layers that don't care about it** — so a copy was stashed in a store to avoid prop-drilling — is a data-flow problem, not a truth problem. Route it to [data-flow-and-component-api.md](data-flow-and-component-api.md): composition (children/slots) usually dissolves the prop-drill with *no* second copy and *no* state library, which removes the duplication's reason to exist.
- **A genuinely independent fact that should have lived in the URL** (a filter lost on refresh, an unshareable view) is a *classification* miss, not a duplication one — send it back to [classification-tree.md](classification-tree.md). The audit only fires when the *same* fact has *two* homes; a fact in the *wrong single* home is the tree's job.

When the audit produces a "yes" you cannot cleanly resolve — the two copies are load-bearing for different reasons and neither is obviously derivable — that is the signal to write the FALLBACK question down and resolve it before the gate, not to ship a synced pair and hope. The store stays small, the truth stays single, and the one copy you keep has a name and a commit point.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves) · [the-membrane.md](the-membrane.md) (the *state* axis — the source-of-truth discipline this file executes) · [classification-tree.md](classification-tree.md) (the five-question bucket tree and the store-size thermometer — *where* truth lives, set before this stage) · [state-machines.md](state-machines.md) (interdependent booleans are a machine, not a duplicate) · [data-flow-and-component-api.md](data-flow-and-component-api.md) (a copy stashed to dodge prop-drilling is a flow problem) · [../../bearings/references/source-of-truth-and-consistency.md](../../bearings/references/source-of-truth-and-consistency.md) (the upstream source-of-truth table and consistency tree this stage refines).

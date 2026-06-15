# The Four States — the per-slice acceptance bar

This reference is the depth behind **STAGE 0 — States** of the [../SKILL.md](../SKILL.md) flight plan, and it owns one check: **`four-states-designed`**. It is the engine of `seaworthy` — the place the skill's inverted discipline (*the happy path is ~40% done, not 90%*) cashes out into a concrete, gateable acceptance bar.

The governing fact, inherited from [the-membrane.md](the-membrane.md) (the *mind* axis) and restated because every call below is judged against it:

> **What you ship is not a correct program — it is a maintained illusion of direct manipulation over a real, asynchronous, failing system. A feature's quality is therefore not "does the data case render" but "what causal story forms in the user's head when this loads, breaks, is empty, or is mis-clicked — and does the slice keep that story whole?"** The four states *are* the product; the happy path is the 40% mark.

And the structural source, from the *state* axis: **every fetch-or-mutate slice has at least four states beyond the happy one.** The naive author writes the success case and leaves loading/error/empty/edge as `// TODO`. Each of those four is a first-class design with a concrete pass/fail bar, and this file is that bar.

## Contents

- [The four bars](#the-four-bars)
- [How to run the gate](#how-to-run-the-gate)
- [Where findings route](#where-findings-route)

## What this doc owns, and what it doesn't

This file owns the **acceptance bars for the four states**: the concrete conditions under which loading, error, empty, and edge are *done*. It is detection-and-criteria, not mechanism:

- **Illusion-maintenance is a sibling.** *How* you keep the causal story whole — optimistic updates with rollback, the cheap-vs-consequential call, animation as causal narrative — is [illusion-maintenance.md](illusion-maintenance.md). Here, loading and error are the *honest confession* when the illusion can't hold; the optimistic *lie* lives there.
- **A11y and the perf budget are a sibling.** The keyboard walk, focus management, and the numeric CI gates (INP/LCP/CLS, bundle size) are [accessibility-and-performance.md](accessibility-and-performance.md). This file references the perception thresholds (no spinner-flash, no blank-on-refetch) because they *bound the loading state*; the budget that turns them into red builds lives there.

The boundary is sharp: **four-states owns the per-slice acceptance criteria for the failure modes; the toolbox that satisfies them and the numbers that enforce them are next door.**

---

## The agent-era failure mode this counters — and why it must be GATED

The agent writes the fetch-and-render, the test passes on the data case, and it **stops**. It leaves loading/error/empty/edge as `// TODO`, because the happy path turns green and the failure states earn no reward. This is not laziness — it is structural blindness:

- It **cannot feel** the spinner that flashes for 50ms, the screen that goes blank on a refetch, the layout that shifts as content lands. Those live in a human nervous system it has no access to.
- It treats a dropped form on an error as fine, because no test asserts the input survived — it never feels the betrayal of "I typed for five minutes and it's gone."
- It ships a blank `<div>` for empty, because an empty array *is* a valid render — it never feels the first-run user deciding to leave.
- It writes the data case and skips the **out-of-order response** that lets an old fetch overwrite new data, because the race only fires under timing it never exercises.

So the four states cannot be a "polish pass" the agent is trusted to do later — that pass never gets the time, and under deadline it is the first thing cut. They must be **designed first and gated per slice**: built before or with the happy path, in the same PR, and not advanced past the GATE until the `checklist` clears `four-states-designed`. That is the whole point of pushing this into a gate rather than a guideline — the agent's "done" is the 40% mark, and only a gate moves the bar to 100%.

---

## The four bars

Each state below has a **PASS** condition (the bar) and the **FAIL** tells that mean the slice is not done. Treat these as the substance the gate checks, not a vibe.

### Loading — protect the causal clock and the layout

The user clicked or arrived and the data isn't here yet. The bar is about **honesty about time** and **not jolting the layout**.

| Concern | PASS | FAIL |
|---|---|---|
| **Layout stability** | Skeleton's dimensions match the final content, so nothing reflows when data lands (protects CLS) | A spinner in the void, then content slams in and shoves the page down |
| **First-load vs background-refresh** | First load → skeleton. Refetch of data already on screen → **keep the old data + an unobtrusive indicator** (stale-while-revalidate) | The screen blanks to a skeleton on every refetch — the user loses their place to fetch data they were already reading |
| **Perception thresholds** | If data usually returns <100ms, **show nothing** — no spinner. Delay the indicator ~200–300ms; show real progress only past ~1s | A spinner that appears and vanishes inside 50ms — *worse than none*, because the flash itself reads as a glitch |

**The non-obvious rules, spelled out:**

- **A spinner-flash is a defect, not a nicety.** A meaning-of-stable view that is slightly stale beats a "live-correct" view that flickers (the *meaning-consistency over data-consistency* principle from [the-membrane.md](the-membrane.md)). If the wait is imperceptible, the *honest* thing is to show nothing and let it feel instant.
- **Never blank the screen on a refetch.** This is the single highest-leverage loading move and the one the agent gets wrong by default. Distinguish *"I have no data yet"* (skeleton) from *"I have data and am checking for newer"* (old data + quiet indicator). Blanking on refetch is a perceived-performance regression with no upside.
- The **delay-then-show** pattern (wait ~200–300ms before rendering any indicator) means fast responses never flash and slow ones still get feedback. This is a means to a stable causal clock, not an end in itself.

> **DEFAULT** when you can't tell which tier an interaction lands in: treat it as <1s "responsive" — show an immediate visual acknowledgement, delay the heavy indicator. The tier comes from `bearings`'s perception contract; if that contract didn't classify this interaction, that's a gap to send back upstream.

### Error — never lose the user's input

Something failed. The bar is **tell the user what happened and what they can do, and never destroy what they already gave you.**

| Concern | PASS | FAIL |
|---|---|---|
| **Input preservation** | After the error, the form still has its contents; the user retries from where they were | The error wipes the form — a five-minute betrayal the agent never feels |
| **Recoverable vs unrecoverable** | Recoverable (transient network, 500) → a **retry**. Unrecoverable (403, gone, malformed) → an **exit / help / contact** path | One generic "Something went wrong" for everything, with no next action |
| **Boundary scope** | Error boundaries are **scoped** — one block failing leaves the rest of the page working | A single failed widget blanks the whole page (a lazy global boundary) |
| **Reported** | The error is sent to error tracking (routes to `stationkeeping`'s observability) so a human sees it | The error dies on the client; no one knows it happened |
| **Tone & leakage** | Says what happened in plain terms; doesn't blame the user; doesn't leak a stack trace or internal IDs | "Invalid input" (which input?) or a raw `TypeError` dumped on screen |

**The worked example — the order-status / consequential mutation.** A user edits an order's shipping address and the save fails. The PASS slice: the form keeps every field exactly as typed; an inline message says *"Couldn't save — check your connection"* with a **Retry**; the failed save is reported; the rest of the order page (line items, history) still works because the edit panel has its own boundary. The FAIL slice: the panel throws, React unmounts the subtree, the whole order page goes white, and the user's edits are gone. Note the link to the sibling: whether this save should have been *optimistic at all* is an illusion-maintenance call — a consequential, half-reversible action like an address change leans toward an honest pending state, not a reassuring lie ([illusion-maintenance.md](illusion-maintenance.md)).

> **PREDICATE for recoverable vs not:** can the *same action, unchanged*, plausibly succeed on a retry? Transient (timeout, 429, 503) → recoverable, give Retry. Deterministic (403, 404, 422 validation, a contract mismatch) → unrecoverable *as-is*, give an exit/fix path — a Retry button that will always fail again is a worse lie than no button. **FALLBACK** when genuinely unsure: offer Retry *and* a help path, and report it loudly so the ambiguity surfaces in tracking.

### Empty — the three empties, never one blank div

The query returned nothing. The bar is **distinguish *why* it's empty, because each "why" needs a different response.**

| Empty because… | The right response | The FAIL |
|---|---|---|
| **…new** (the user has created nothing yet) | An **onboarding CTA** — this is where the user decides to stay or leave; it's a product opportunity, not an absence | A blank `<div>` on first run; the user concludes the product is broken or pointless and leaves |
| **…filtered** (data exists, the current filter excludes all of it) | **Explain why** ("No orders match *Shipped + last 7 days*") **and offer a one-click clear** | The same empty as first-run, so the user thinks their data vanished |
| **…error** (the fetch failed and returned nothing) | **That is the error state, not the empty state** — route it to the Error bar above | A failed fetch silently shows "Nothing here," hiding a real failure as if it were normal |

**The worked example — the filtered list.** A list of orders with status/date filters. The derived list is `filter(orders, query)` computed live, never stored (the *minimal source of truth* discipline from the state axis). Three distinct renders: (1) the account is brand new → "No orders yet" + a CTA to place one; (2) `orders` is non-empty but the filter matches none → "No orders match these filters" + a **Clear filters** button; (3) the fetch 500'd → the *error* state with a retry, **not** an empty state. The agent's default collapses all three into `if (list.length === 0) return <Empty/>` — which is wrong in cases (1) and (3) and barely-tolerable in (2). The fix is a single branch on *cause*, and the cause is already knowable: is there data upstream? did the fetch error? is a filter active?

> The first-run empty is the highest-stakes of the three: it's the first impression of the whole feature. Treat it as a designed screen with a clear next action, not a fallthrough.

### Edge — the "…but what if…" list

The corners where `UI = f(state)` leaks. The bar is **you have walked the list and each corner is handled or consciously accepted.** This is where identity bugs and async races live — the part the agent skips hardest because the timing never fires in its tests.

The list to walk per slice:

- **Cardinality: 0 / 1 / many.** Zero (→ the empty bar), exactly one (singular vs plural copy; layouts that assume ≥2), and *very* many (does a 10,000-row list virtualize, paginate, or melt?).
- **Content extremes.** Very long content — does it truncate, wrap, or overflow and break the layout? Very short — does a one-character name collapse the cell? Unexpected characters, RTL, emoji.
- **Network reality: slow / offline / stale.** A page left open for an hour — is the data quietly an hour old, or refreshed? Offline — does the action queue, fail honestly, or hang forever? Slow — does the loading bar above engage?
- **Races — the agent's signature blind spot.** Rapid clicks and **out-of-order responses**: the user types "a", then "ab"; the "a" request returns *after* the "ab" request and overwrites the newer result with the older. **PASS: cancel stale requests (or discard their responses) so an old response can never overwrite new data.** This is also why list **keys must carry true identity** — an array-index key under a reorder or insertion lands DOM state (focus, cursor, in-flight animation) on the wrong row (the *identity* axis in [the-membrane.md](the-membrane.md)).
- **Permission lost mid-session.** The user's token expires or their role is revoked while the page is open — does the next action fail gracefully (→ recoverable/unrecoverable error) or throw an uncaught exception?
- **Collaboration / concurrent edit.** A collaborator (or the same user in another tab) changed the same thing — does the slice detect the conflict, or silently last-write-wins and lose data?

> **The edge bar is a *walked list*, not a *cleared list*.** You don't have to handle every corner — a single-user internal tool legitimately ignores collaboration; a list that is provably small can skip virtualization. The bar is that each corner was **consciously considered and either handled or accepted with a reason**, never silently skipped. An un-walked list is the fail; a walked list with documented "N/A for this slice" is a pass.

---

## How to run the gate

`four-states-designed` is not "I thought about failure" — it is "each of the four states meets its bar, designed as first-class, in this slice." The PR-level acceptance, distilled (this is the deliverable the gate certifies):

1. **Loading:** no layout shift; first-load distinguished from background-refresh; no spinner-flash under the threshold.
2. **Error:** input preserved; recoverable vs unrecoverable split; boundary scoped; reported; no blame, no leak.
3. **Empty:** new / filtered / error distinguished; first-run has a CTA or the filtered-empty has an explanation + clear.
4. **Edge:** 0/1/many tested; slow/offline/stale handled; races handled (stale requests cancelled, keys carry identity); the rest of the list walked.

**The one-line field test** (the exit standard from the source): *randomly pull the network cable, randomly make the API return 500, feed it empty data — does the interface catch the user gracefully every time?* Put concretely: **would you dare yank the network cable in front of the user?** If not, the unhappy paths aren't done — and that is exactly the felt-cost the agent cannot feel, which is why it must be a gate and not a guideline.

---

## Where findings route

- **A loading or error state that needs an optimistic lie or a causal animation to feel right** → [illusion-maintenance.md](illusion-maintenance.md). This file says *the loading state must be honest*; the sibling says *what the honest-vs-optimistic call is and how to roll back when the lie breaks*.
- **A skeleton whose mismatched dimensions cost CLS, or a load that blows the INP budget** → [accessibility-and-performance.md](accessibility-and-performance.md), where the perception thresholds become hard CI numbers (CLS < 0.1, INP < 200ms) that fail the build.
- **An error or edge state that has no keyboard path or steals focus** → the a11y section of [accessibility-and-performance.md](accessibility-and-performance.md) (an error toast the keyboard can't reach is not done).
- **A state that is missing because the *source of truth* was mis-classified upstream** (e.g. a filter that should have been URL state, so it has no shareable empty) → that's `wellspring`'s state map; the four states grow directly out of it.
- **Every state you build here is a testable behavior** → `trials` (correctness): feed loading → assert skeleton; feed an error response → assert the error UI *and that input survived*; feed empty → assert the CTA; feed data → assert content. The four states are the test cases, not guesses.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (the *mind*, *state*, and *identity* axes — *why* this bar exists) · [illusion-maintenance.md](illusion-maintenance.md) (optimistic UI, causal animation — the toolbox these states call) · [accessibility-and-performance.md](accessibility-and-performance.md) (the keyboard path and the perf numbers that bound the loading state) · [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves, and the `four-states-designed` gate).

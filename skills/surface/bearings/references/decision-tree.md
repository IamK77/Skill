# The bearings Decision Tree

This is the deterministic engine at the heart of `bearings` — the routers the stages call into so that two agents scoping the same product reach the *same* one-way-door commitments. Open it at **STAGE 0 (Chart)** alongside [the-membrane.md](the-membrane.md), and keep it beside you through STAGE 2 (Source) and STAGE 3 (Render). It is three mechanisms, in the order the build hits them: the **hot-vs-cold path cut** (frequency × consequence — feeds `journeys-and-paths-mapped`), the **consistency-model tree** with its trust-boundary rider (the deepest one-way door — feeds `consistency-and-trust-boundary-fixed`), and the **rendering-architecture router** with the platform keep-or-rebuild list (feeds `rendering-and-platform-decided`).

The two siblings own the other halves and are not re-explained here: the perception tiers (Instant/Responsive/Tolerable/Long and their architecture consequences) live in [perception-contract.md](perception-contract.md); the north-star / guardrails / pre-mortem live in [objective-function.md](objective-function.md). Back to the contract: [../SKILL.md](../SKILL.md).

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **A consistency model and a rendering architecture are one-way doors — brutal to reverse once a line of code fossilizes them — so the discipline runs backwards: default to the *weakest* model and the *cheapest* architecture that meets a real requirement, and escalate only when a need forces you, never because a heavier answer is fashionable.** The agent will not feel the future cost of a fossilized wrong call; it earns no green for picking the lighter door, and "realtime" or "RSC" reads as sophistication. So the asymmetry that decides every coin-flip here: under-building is a feature you add behind a clean boundary later; over-building (a CRDT nobody co-edits, a SPA that hand-rebuilds the browser) is a rewrite and a tax on every future reader. When a fork is a real toss-up, pick the lighter, more reversible door and write down the requirement that would make you escalate.

---

## TREE 1 — The hot-vs-cold path cut (frequency × consequence)

Effort is the scarce resource, and not all journeys earn the same. Before any latency tier or data model, rank the journeys you mapped (the JTBD list from `journeys-and-paths-mapped`) so the polish lands where it pays. The failure mode is spreading effort evenly across every page; the discipline is concentrating ~80% of the polish on 2–3 hot paths.

| Journey's role | Frequency × consequence | What it earns |
|---|---|---|
| **Hot path** | run constantly *and* high blast-radius when it breaks (the checkout, the compose box, the core create-verb) | optimize relentlessly — the tightest perception tier, the most illusion-maintenance, the e2e test, the performance budget enforced in CI |
| **Cold path** | rare, or low consequence if it stalls (settings, an admin export, the about page) | good-enough — a correct, accessible default; do not spend hot-path budget here |

- **PREDICATE:** how often is this journey run, and what is the blast radius when it stalls, errors, or feels wrong — does a bad second here cost a user, a sale, or trust?
- **DEFAULT** on a coin-flip between hot and cold: rank it **hot** only if it is *both* frequent and consequential; a journey that is frequent-but-trivial (a tooltip) or consequential-but-rare (account deletion) is cold for *polish* even if it earns rigor elsewhere. When genuinely torn, treat it as cold — over-polishing a cold path steals from a hot one, and the budget is zero-sum.
- **FALLBACK** when you have no usage data yet (a 0-to-1 build always): rank by the *primary JTBD* — the one or two journeys the product exists to serve are hot by definition; everything supporting them is cold until evidence says otherwise. Re-rank once real traffic exists.

> **The agent multiplier:** an agent treats every screen as equally worth its attention, because each looks like an isolated, finishable task and none carries a felt sense of "this one is the product." The hot/cold cut is the human judgment that tells it where the 80% goes — without it the agent polishes the settings page to the same sheen as the checkout and runs out of budget before the path that matters. This cut also feeds the siblings: the hot paths are the ones that earn the tight tiers in [perception-contract.md](perception-contract.md) and the ones whose guardrails bite hardest in [objective-function.md](objective-function.md).

---

## TREE 2 — The consistency-model tree (the deepest one-way door)

For each class of core data in the source-of-truth table (`source-of-truth-mapped`), you have named *where its canonical copy lives* — server, URL, local client, or a collaborative CRDT. This tree decides the harder half: *how consistent must that copy be*, which is `consistency-and-trust-boundary-fixed`. Walk the three predicates **in order** and stop at the first "yes" that a real requirement forces — every "yes" pushes the project toward heavier, harder-to-reverse architecture, so the burden of proof is on escalating, not on staying light.

### The three predicates, in order

**Q1 — Will the data change from another source while the user is watching it?**
- **PREDICATE:** can a value on screen go stale *during* a session because someone or something else (another user, a backend job, a price change) mutates the canonical copy?
- **No** → a **simple fetch** (a TanStack-Query-class cache: fetch, cache, stale-while-revalidate). This is the floor and most data lives here. Done — do not read on.
- **Yes** → **realtime / poll / subscribe** (polling, SSE, or a websocket subscription). You are now keeping a client cache live against a moving server; that is a real but contained step.
- **DEFAULT** on a coin-flip: **No / simple fetch.** "Meaning consistency beats data consistency" — a slightly-stale-but-stable view usually beats a flickering live one (this is the real reason behind debounce, skeletons, and stale-while-revalidate; depth in [perception-contract.md](perception-contract.md)). Add live updates when a stale value is *wrong*, not merely *old*.
- **FALLBACK** when you can't tell how fast the data moves: assume **No**, ship the simple fetch behind a query-cache boundary, and note the refetch-on-focus the cache already gives you for free — it covers most "feels live enough" needs without committing to a subscription.

**Q2 — Will multiple users edit the same thing at the same time?**
- **PREDICATE:** do two or more users mutate the *same* record concurrently, such that their writes can genuinely collide (a shared doc, a shared canvas, a shared cell)?
- **No** → stay at Q1's answer. Most "multi-user" products are multi-user *readers* of a single-writer record — that is not concurrent edit, and last-write-wins with a rule is fine.
- **Yes** → **conflict resolution: CRDT / OT / last-write-wins-with-rules.** This is **a whole-architecture fork** — the client becomes a participant in a distributed consensus problem, and bolting it on after the fact is a rewrite, not a feature. It changes the data model, the network protocol, and the state classification `wellspring` will later refine.
- **DEFAULT** on a coin-flip: **No.** Do not put a CRDT on something nobody co-edits because "collaboration is cool" — the cost is permanent and the benefit is imaginary. Demand a concrete concurrent-edit scenario before you escalate.
- **FALLBACK** when collaboration is "maybe a future feature": **do not build it now, but record it as a known one-way door.** Note which data class *would* need conflict resolution if collaboration ships, and what the trigger is. You are buying the option to decide later with eyes open, not committing to the architecture.

**Q3 — Must it work offline?**
- **PREDICATE:** must the user create or edit this data with no network, and have it sync when connectivity returns?
- **No** → stay at the prior answer; the network is a hard dependency and that is fine.
- **Yes** → **local-first.** The client becomes a distributed node with *its own* source of truth that later reconciles with the server. This is the heaviest escalation on the tree — it pulls in conflict resolution (Q2 is now implied even for a single user, because the user's two devices conflict), background sync, and a local persistence layer.
- **DEFAULT** on a coin-flip: **No.** "Works on a flaky connection" (which Q1's cache + optimistic UI handles) is a far weaker and cheaper requirement than "works fully offline" — do not conflate them. Most "offline" requests are really "resilient to a bad network," which is a perception-contract concern, not a local-first architecture.
- **FALLBACK** when offline is aspirational: ship online-only behind a clean network boundary and a query cache, and note that local-first is a rewrite-class decision deferred — never let the agent half-build offline support, which is worse than none (it silently loses writes).

> **Why this is gated and not left to taste:** all three escalations are one-way doors that earn no green and feel like progress. An agent left to choose will reach for the impressive answer (subscriptions, CRDTs, local-first) because they look like real engineering, and will never feel the rewrite it has signed the team up for — or, just as bad, will skip the decision entirely because "fetch the data" compiles and runs. The gate forces the call to be made, on paper, while reversing it is still free.

### The trust-boundary rider (no exceptions)

Drawn on the same table as the consistency model, because both define the *network/trust line* — the boundary the membrane sits on. This one has no DEFAULT and no FALLBACK, because it has no coin-flip:

- **Treat every client input as hostile.** The client is not yours and cannot be trusted — the user can read your JS, forge your requests, and skip your UI.
- For each data class and each mutation, **name explicitly** which **validations** and which **authorizations** are re-done on the server. The client-side check is a UX affordance (fast feedback); the server-side check is the actual enforcement. If a rule matters, it is enforced server-side or it is not enforced.
- The agent's tell: validating only on the client because the form already shows the error, so the request "can't" be malformed. It can — the request is not made by the form. Mark the server re-check for every rule that has consequences (price, ownership, quota, role).

---

## TREE 3 — The rendering-architecture router (derive from requirements, not popularity)

Choosing a rendering architecture is choosing *which free platform powers you keep and which you hand-rebuild* — the document-vs-application impedance mismatch, made into a commitment. Derive it from the need, then **count what it costs** with the keep-or-rebuild list. This is `rendering-and-platform-decided`. Walk the predicates in order and take the first match.

### The router, in order

**Q1 — Need SEO, or a fast first paint on a weak network / weak device?**
- **Yes** → **SSR or SSG.** The server produces meaningful HTML so crawlers index it and the first paint does not wait on a JS bundle. (SSG if the content can be built ahead of time; SSR if it must be per-request.)
- **No** → continue to Q2.

**Q2 — Is the content basically static (a blog, marketing site, docs)?**
- **Yes** → **SSG / MPA + progressive enhancement.** The cheapest and most robust answer — you keep almost every native platform power for free and rebuild almost nothing. Reach for this more often than instinct says; a great deal of "we need a SPA" is content wearing an app's clothes.
- **No** → continue to Q3.

**Q3 — A logged-in app, strong interaction, SEO irrelevant?**
- **Yes** → **SPA or RSC.** Behind a login wall the crawler argument evaporates and the interaction is the product; client-side routing and rich state earn their cost here. (RSC if you want to keep server-side data-fetching and a smaller client bundle within the app model.)
- **No / it's a mix** → continue to Q4.

**Q4 — Need *both* SEO/first-paint *and* rich local interactivity on the same pages (commerce, news with comments)?**
- **Yes** → **islands / partial hydration.** Server-render the page for SEO and first paint, then hydrate only the interactive regions — you pay client-JS cost only where you actually have interaction.

- **DEFAULT** on a coin-flip between two architectures: pick the one that **keeps more native platform powers** — the one with fewer "rebuild myself" rows below. The cheapest-to-keep door (MPA + progressive enhancement < islands < SPA/RSC in platform debt) wins ties, because every rebuilt power is a permanent tax.
- **FALLBACK** when the SEO / interactivity requirements are not yet pinned: do **not** default to a SPA because it is the familiar shape. Resolve the two questions that actually route this — *is this content public-and-indexed?* and *is the interaction rich-and-stateful?* — with the user first; they are a ten-minute conversation that decides a one-way door.

### The platform keep-or-rebuild list (where the SPA's true cost hides)

Once the architecture is chosen, walk this list and mark each row **keep native** or **rebuild myself**. Every "rebuild" is a debt you are signing here — the cost of a SPA is mostly hiding in these rows, not in the framework choice:

| Platform power | Free in MPA/SSR | In a SPA you must… |
|---|---|---|
| **URL as state** | the address bar reflects the page | wire routing → URL by hand; an un-shareable URL is the tell you didn't |
| **Back / forward button** | the browser owns history | manage the history stack yourself; broken back-button is the classic SPA bug |
| **Scroll restoration** | the browser restores scroll on back | re-implement scroll position per route |
| **Accessibility (focus, landmarks)** | full-page loads reset focus correctly | manage focus across client-side route changes (the second render tree — see [the-membrane.md](the-membrane.md)) |
| **View transitions** | none, but page loads are atomic | build transition animation, or accept jank |

- **PREDICATE:** for each row, does the chosen architecture give it to me free, or am I re-implementing a browser feature?
- **DEFAULT:** when unsure whether a row is "free enough," mark it **rebuild myself** and count the cost — the conservative error (budgeting for work the platform turns out to do for you) is cheap; the optimistic error (discovering the back button is broken in week ten) is a hot-path regression found late.
- **FALLBACK** when you can't yet tell how much a "rebuild" row will cost: estimate it as a *hot-path* concern if any hot path traverses it (a broken back button on the checkout is a different cost than on the settings page), and size the debt against TREE 1.

> **The agent multiplier:** the agent reaches for the popular framework and the SPA default because that is what its training distribution is densest in, and it never tallies the keep-or-rebuild list — each rebuilt power arrives later as an isolated bug ("the back button doesn't work"), not as a line item it chose. Forcing the list here turns a hundred future bug reports into one visible, signed decision.

---

## Worked traversal (a "collaborative" project-tracker handed to you)

A team wants a Trello-class board: cards in columns, multiple people, "feels instant," and someone said "make it realtime and offline."

1. **TREE 1 — hot/cold:** the primary JTBD is *move a card to reflect work status*; that drag is the hot path (frequent, and a stuck/janky drag destroys trust). The settings page and the activity-log export are cold. ~80% of the polish goes on the card drag.
2. **TREE 2 / Q1 — changes while watched?** Yes — a teammate can move a card while you're looking. → realtime/subscribe for the board's card positions. Record it.
3. **TREE 2 / Q2 — concurrent edit of the *same* thing?** Two people drag *different* cards constantly (not a conflict — last-write-wins per card is fine); two people editing the *same card's description* at the same time is rare. → **No CRDT.** Last-write-wins-with-a-rule on the card, a subscription for positions. The "make it collaborative" instinct is downgraded to "make it live," which is Q1, not Q2 — a whole rewrite avoided. Note CRDT as a deferred one-way door *only* if shared rich-text editing later becomes a real requirement.
4. **TREE 2 / Q3 — must it work offline?** "Offline" turns out to mean "survive a flaky cafe connection," not "create cards on a plane." → **No local-first.** Optimistic UI on the drag (a perception-contract concern) + the query cache covers it. Local-first recorded as a rewrite-class decision deferred, with its trigger written down.
5. **Trust-boundary rider:** the client can forge a "move card to a board I don't belong to" request → server re-checks board membership and card ownership on every mutation; client-side checks are UX only. No exceptions.
6. **TREE 3 — render:** logged-in app, SEO irrelevant, interaction is the whole product → **Q3: SPA or RSC.** Keep-or-rebuild list: URL-as-state (rebuild — board/card deep links must be shareable), back button (rebuild — count it, it's hot-path-adjacent), focus management across route changes (rebuild — a11y, non-negotiable). Three signed debts, sized against TREE 1.
7. **Hand-off:** the result is the source-of-truth table (positions = server, live; card body = server, last-write-wins; current board filter = URL) plus the rendering decision and its debt list — the one-page artifacts `keel` proves the walking skeleton against and `wellspring` refines into the full state classification. The latency tiers for that drag live in [perception-contract.md](perception-contract.md); whether "engagement on the board" is an honest north-star lives in [objective-function.md](objective-function.md).

---

## The smells (tells that a one-way door was walked blind)

- **A `?` left in the source-of-truth table** (the classic: the shopping cart) — the unanswered cell *is* the consistency decision; an undecided owner is a sync bug already written. Resolve it down TREE 2 now.
- **A CRDT (or OT, or a sync engine) on data nobody co-edits** — Q2 answered "yes" without a concurrent-edit scenario; "collaboration is cool" is not a requirement. Un-escalate.
- **"We'll add offline later"** treated as a feature, not a rewrite — Q3 deferred without recording it as a one-way door, or worse, the agent half-built it and now silently drops writes.
- **A subscription where a refetch-on-focus would do** — Q1 over-answered; a stable slightly-stale view beats a flickering live one on most paths.
- **A SPA chosen by default with the keep-or-rebuild list never walked** — the true cost is hiding in the unmarked rows; a broken back button or an un-shareable URL is the tell it was skipped.
- **Client-only validation on a consequential mutation** — the trust-boundary rider violated; the request is not made by the form. Name the server re-check.
- **Even polish across every screen** — TREE 1 never run; the agent sheen-matched the settings page to the checkout and spent the hot path's budget. Cut hot from cold and re-allocate.
- **A rendering architecture justified by "it's what we know" / "it's the popular one"** — derived from popularity, not requirements; re-run TREE 3 from the SEO and interactivity predicates, and let the answer fall out of the need.

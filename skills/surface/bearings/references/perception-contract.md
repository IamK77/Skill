# The Perception Contract — latency tiers that become architecture

This reference is the depth behind **STAGE 1 — Contract** of the [../SKILL.md](../SKILL.md) flight plan, the stage that turns "feels right" into hard numbers. It governs one check — **`perception-contract-set`** — and it owns one slice of the membrane and only that slice: **the perception/latency contract and the animation budget.** Where each truth *lives* and how *consistent* it must be is the [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md) one-way door; which platform *renders* it is [decision-tree.md](decision-tree.md)'s rendering router; what you *optimize for* is [objective-function.md](objective-function.md). This file owns only the question *"how long may it take before the user's causal story breaks — and what does that forbid?"*

The governing fact, inherited from [the-membrane.md](the-membrane.md) and restated because every call below is judged against it:

> **The correctness spec lives in a wet human nervous system, not a document. 16ms is the flicker-fusion threshold; 100ms is "I touched it directly." These are psychophysical constants, not SLAs — and you cannot write a unit test for "feels responsive." So the only way to make this part of the spec checkable is to write the threshold down as a constraint *before code*, where it can govern an architecture decision instead of being discovered as jank at the end.**

## Contents

- [The core principle — a threshold is a constraint, not a target](#the-core-principle--a-threshold-is-a-constraint-not-a-target)
- [The method — the four-tier table and its right-hand column](#the-method--the-four-tier-table-and-its-right-hand-column)
  - [How to tier an interaction](#how-to-tier-an-interaction)
  - [The architecture consequences, in full](#the-architecture-consequences-in-full)
  - [Worked example — the like button vs. the payment](#worked-example--the-like-button-vs-the-payment)
- [Animation is causal narrative, not decoration — the budget](#animation-is-causal-narrative-not-decoration--the-budget)
- [The flicker rule and the threshold corollaries](#the-flicker-rule-and-the-threshold-corollaries)
- [The agent-era failure mode this counters](#the-agent-era-failure-mode-this-counters)
- [Genuinely-ambiguous calls — PREDICATE / DEFAULT / FALLBACK](#genuinely-ambiguous-calls--predicate--default--fallback)
- [Where findings route](#where-findings-route)

---

## The core principle — a threshold is a constraint, not a target

Most teams treat latency as something you *measure and then improve*: build the feature, profile it, optimize the slow paths. That order is backwards for the interactions that matter, and the reason is structural. A perceptual threshold is not a performance *goal* you approach asymptotically — it is a **cliff**. Below 100ms the user believes they manipulated the object directly; one millisecond above it, the illusion is gone and no amount of "it's only 110ms" buys it back. Because the threshold is a cliff and the cliff sits *inside the user's nervous system*, the only place it can be honored is in the architecture — and the architecture is decided before the first line, while reversing it is still free.

So the move is to **judge each key interaction against the cliff first, and let that judgment forbid an architecture.** Calling an interaction "instant" is not a wish; it is a decision that **a network round-trip is now illegal on that path.** The right-hand column of the table below is the whole point: the tier is a means, the architecture consequence it locks is the end. A perception contract that tiers interactions but does not write down what each tier *forbids* has produced a wish list, not a contract — it has not passed `perception-contract-set`.

This is the perception half of the suite's through-line — *push correctness from runtime carefulness into structural constraint.* "Be careful to keep the like button fast" is runtime carefulness; "the like button is instant, therefore it never waits on the server" is a structural constraint that the rest of the build cannot accidentally violate.

---

## The method — the four-tier table and its right-hand column

Build one table. For every interaction on a **hot path** (the frequency × consequence ranking from [decision-tree.md](decision-tree.md)'s TREE 1), name its tier and write the consequence the tier locks. Cold-path interactions get a tier too, but you spend the architecture budget on the hot ones.

| Tier | Threshold | What the user feels | Architecture consequence (the point) |
|---|---|---|---|
| **Instant** | **<100ms** | "I touched it directly" — direct manipulation | **No network round-trip on this path.** It must be local, cached, or optimistic. A server confirmation cannot be on the critical path. |
| **Responsive** | **<1s** | Train of thought unbroken; "the system is working" | May be async, **but needs an immediate visual acknowledgement** — the click registers *now*, even if the result lands later. |
| **Tolerable** | **<10s** | Attention holds only if it sees progress | **Must show progress** — a skeleton or a bar, sized to the final content. **Never a blank screen.** |
| **Long** | **>10s** | Attention is lost; the user disengages | **Make it a background task + a notification.** Don't make the user sit and wait; let them leave and pull them back when it's done. |

The thresholds are Nielsen's psychophysical constants, with 16ms (the flicker-fusion frame budget) underneath them as the floor for *animation* smoothness specifically. They are not arbitrary and not negotiable by taste — a stable 100ms beats a jittery 50ms, because the instrument is the brain and the brain punishes *variance* harder than *latency*.

### How to tier an interaction

For each hot-path interaction, ask in order:

1. **Is it direct manipulation?** (Dragging, toggling, typing, liking — anything where the user's mental model is "I am moving *this* thing with *my* hand.") → **Instant.** The cliff is real here: a toggle that waits on a server feels broken, not slow.
2. **Does the user expect a near-immediate result but will tolerate a beat?** (Submitting a search, opening a detail view.) → **Responsive,** *if* you give the acknowledgement in the first frame.
3. **Is it inherently heavy but bounded?** (Loading a dashboard, running a report that finishes in seconds.) → **Tolerable** — owe the user a skeleton.
4. **Is it genuinely long or unbounded?** (Video export, bulk import, a large model run.) → **Long** — owe the user their freedom and a notification.

The discipline that keeps the table honest is that **the tier is a claim about the user's nervous system, and the consequence is the bill that claim runs up.** If you are not willing to pay the bill (build the optimistic path, the cache, the local computation), you do not get to call it instant — downgrade the tier honestly rather than write "instant" and ship a server round-trip behind it.

### The architecture consequences, in full

The right column compresses a real architectural commitment; here is what each one actually obligates.

- **Instant → local or optimistic.** Either the answer is already on the client (computed locally, in cache, in URL state) or you **show the probable truth before it is confirmed** and reconcile afterward. Optimistic update is the human-node form of optimistic concurrency control: you tell the user the likely truth early to prevent the causal rupture of "I clicked → nothing → *then* it moved." The reconcile step has three branches and the last is the one most often skipped: *optimistically mutate the cache → fire the request → on success, confirm (or replace with the server's response) → on failure, roll back and tell the user.* **A silently-failing optimistic update is a lie that corrodes trust** — it is the difference between a maintained illusion and a deception.
- **Responsive → immediate acknowledgement.** The work may be async, but the *acknowledgement* is not allowed to be. The button depresses, the row highlights, the spinner — *if past the flicker rule below* — appears, all in the first frame. The user's question "did it hear me?" must be answered before the system answers "what's the result?"
- **Tolerable → progress, never blank.** A skeleton sized to the final content (so the layout does not jump when data lands), or a determinate bar. Distinguish *first load* (show skeleton) from *background refresh* (keep the stale data + an unobtrusive indicator — stale-while-revalidate; **never clear the screen on a refetch**, because meaning-consistency beats data-consistency: a slightly-stale stable view beats a "correct" flickering one).
- **Long → background + notify.** The interaction leaves the foreground. The user is freed to do other things; the system owns the obligation to summon them back. Forcing a human to watch a 30-second bar is spending their attention to save yourself an async path.

### Worked example — the like button vs. the payment

The like button and the payment button look identical in the DOM — a click handler that calls an API. The perception contract splits them, and the split is an architecture decision:

- **The like button is Instant (<100ms).** Liking is cheap, reversible, high-frequency. Consequence: it **must not wait on the server.** The heart fills the instant the finger lands; the request fires in the background; if it fails, the heart quietly empties and we tell the user. The classic failure is discovering *halfway through the build* that "the like button is janky because it's waiting on the endpoint" — a problem that should have been ruled out on this table, before any code, by writing "Instant → no round-trip."
- **The payment button is *not* Instant, and that is also a contract.** Paying is consequential and irreversible. The rule inverts: **cheap / reversible / frequent → optimistic; consequential → honest pending.** Here an honest pending state beats the reassuring lie, because lying about whether money moved is exactly the dark-pattern boundary [objective-function.md](objective-function.md) guards. So the payment is Responsive-at-best with a truthful spinner, never optimistic.

The same DOM, two tiers, two architectures — and the table is where that gets decided once, in writing, instead of re-litigated per-feature later.

---

## Animation is causal narrative, not decoration — the budget

Motion is not garnish. **Movement answers the user's question "where did this come from / where did it go?"** — it sutures the causal chain that the asynchronous machine keeps trying to break. A new item that simply *appears* is a small causal rupture; the same item *sliding in from the "Add" button* tells the user "this is the result of the click you just made." That is information, not decoration, which is why its timing is a **contract, not a taste call** — and why you fix it here, on paper, rather than letting it accrete per-component later.

The budget:

| Motion | Duration | Why |
|---|---|---|
| **Micro-feedback** (button press, toggle, hover state) | **~150ms** | Fast enough to read as a direct consequence of the touch; longer feels laggy. |
| **Transition** (route change, panel open, list reorder) | **~250–300ms** | Long enough for the eye to track the causal path (the thing came *from there*); longer wastes the user's time. |
| **Easing** | **one consistent curve** | A single easing curve across the app reads as one physics; mixing curves reads as multiple authors and breaks the illusion of one coherent surface. |

Three executable rules turn "animation = causality" into something checkable:

1. **Anything that appears, moves, or disappears because of a user action animates from/to its causal source.** A deleted row *collapses* (it doesn't blink out of existence); a new item *slides in from the direction of the control that created it*; a popover *expands from the button that triggered it*. The animation names the cause.
2. **Decorative motion that narrates no causality is noise — delete it.** A logo that pulses for no reason is not part of the contract; it taxes attention and pays nothing back. (This is the [the-membrane.md](the-membrane.md) ethics axis in miniature: motion that doesn't serve the user's model is serving someone else's.)
3. **Respect `prefers-reduced-motion`.** It is both an accessibility obligation and an ethics one — some users are physically harmed by motion, and overriding their stated preference is the membrane working *against* them.

---

## The flicker rule and the threshold corollaries

The thresholds cut both ways: just as a slow path must show progress, a *fast* path must **not** flash a transient state, because the flicker is itself a perceptual violation.

> **If data usually returns in <100ms, do not flash a spinner.** A spinner that appears and vanishes within ~50ms is *worse than nothing* — it reads as a flicker, a glitch in the causal story. **Delay the loading indicator ~200–300ms** before showing it (so fast responses never trigger it at all), and only escalate to a progress bar / skeleton once the path crosses ~1s.

This is the corollary that catches the naive "always show a loading state" instinct. The loading state is owed at the **Tolerable** tier, forbidden as a flicker at the **Instant** tier, and conditional (delayed) in the **Responsive** band between them. The tier table tells you which.

A second corollary is the **race**: on fast, repeatable interactions (rapid re-clicks, type-ahead), responses can arrive out of order — cancel stale requests so an old response never overwrites newer data. The perception contract is where you *notice* this is in scope (any Instant/Responsive path that fires repeatedly); the consistency mechanics of handling it route to [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md).

---

## The agent-era failure mode this counters

Left alone, an agent building a frontend will **make every interaction a server round-trip**, because that is the simplest correct-on-the-machine-axis path: click → call API → await → render. It feels none of the lost 100ms, because the agent has no nervous system on the far side of the membrane — there is no brain it is degrading, so there is no signal it is doing anything wrong. The code is *correct* (the data is never shown before it is confirmed) and *green* (every test passes), and it is also **janky in exactly the way no test can catch**, because "feels like direct manipulation" is not expressible as an assertion.

That is precisely why this must be **gated on paper before the build**:

- The threshold cannot be discovered late. "Feels janky," found at the end, is an *architecture* problem (a round-trip on a path that should never have had one) that you locked in at the start — and unwinding it is a rewrite of the data-flow, not a tweak.
- The agent will not set the contract itself, because setting it requires modeling a mind it cannot access. The human supplies the tiering judgment ("this *is* direct manipulation, so it's Instant"); the agent then does the mechanical work the judgment licenses (wire the optimistic cache mutation, the rollback, the 200ms delay, the 150ms easing) — but only against a contract that already exists.
- A green dashboard reads as safety. The agent will treat passing tests as done; the perception contract is the part of "done" that the dashboard structurally *cannot* show, so it must be a written gate, not a runtime check.

So `perception-contract-set` does not ask "did you measure latency" — it asks **"did you tier each hot-path interaction *and write down the architecture consequence each tier locks*, and did you fix the animation budget as a contract."** Order over substance: the gate enforces that the judgment was made and recorded before code; the rigor of the judgment is yours.

---

## Genuinely-ambiguous calls — PREDICATE / DEFAULT / FALLBACK

Most tiering is decisive once you ask "is this direct manipulation?" These are the real coin-flips:

- **PREDICATE:** the interaction is direct-manipulation *and* consequential/irreversible (e.g. a drag that permanently reorders something billed per-position; toggling a setting that fires off-platform side effects).
  - **DEFAULT:** treat as **Responsive with an honest pending state, not Instant-optimistic.** The "consequential → honest pending" rule wins ties against the "direct manipulation → instant" rule, because a confidently-shown lie about a consequential action is the costlier failure. Surface a fast acknowledgement, but do not pretend it's done.
  - **FALLBACK:** if the consequence is genuinely severe (money, deletion, anything you cannot cleanly undo), require an explicit confirmation step and a truthful pending state — never optimistic, regardless of frequency.

- **PREDICATE:** you cannot yet tell whether a path will land under or over 100ms (it depends on a data-model or rendering decision not yet made).
  - **DEFAULT:** write the tier you *want* and mark the consequence as a **constraint on those downstream decisions** — "this is Instant, therefore the source-of-truth for this datum must be local or cached." Now the perception contract *drives* the [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md) call instead of being a victim of it.
  - **FALLBACK:** if no architecture can make it Instant, tier it honestly as Responsive and design the immediate acknowledgement — do not leave "Instant" written next to a path that physically cannot be.

- **PREDICATE:** it's a throwaway prototype that ships nothing and dies in a week.
  - **DEFAULT:** a one-line tiering of the 2–3 hot interactions is enough; skip the full table. The bar is sized to how long the thing must live (the [../SKILL.md](../SKILL.md) overkill clause).

---

## Where findings route

The perception contract is one of the five artifacts; it hands work to its siblings and to later stages rather than doing their jobs:

- **An "Instant" verdict that forces a datum local/cached** → a constraint on [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md). Perception decides *how fast*; that doc decides *where the truth lives* and *how consistent* — and an Instant tier can dictate the answer (local-first, optimistic) before that tree is even walked.
- **A tier that can't be hit on the chosen rendering path** → back to [decision-tree.md](decision-tree.md)'s rendering router. If "fast first paint" is a perception requirement, it pushes the rendering decision toward SSR/SSG.
- **The thinks-vs-actually gap list** (from STAGE 0 Chart) → each gap is a place the perception contract owes an illusion-maintenance tool (optimistic UI, animation, a loading/error state). This contract names the *budget*; `seaworthy` later *builds* the unhappy-path states against it, and `keel`'s walking skeleton proves the hot path can hit its tier end-to-end.
- **The animation/motion ethics** (decorative motion that narrates no causality; overriding `prefers-reduced-motion`) → the ethics axis of [the-membrane.md](the-membrane.md) and the guardrails of [objective-function.md](objective-function.md). Motion that serves no user model is serving the optimizer's.
- **The CI translation** — turning these thresholds into hard gates (INP, LCP, CLS budgets that fail the build) — is *not* this stage's job; it is a later-stage move (RUM / Core Web Vitals are "psychophysics encoded as numbers"). This doc's product is the *written contract* the CI gate later enforces.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (the spec-lives-in-a-brain thesis and the ethics axis — *why* this stage reads as it does) · [decision-tree.md](decision-tree.md) (the hot-vs-cold path cut that scopes which interactions get the architecture budget, and the rendering router a tier can constrain) · [source-of-truth-and-consistency.md](source-of-truth-and-consistency.md) (where an "Instant" verdict forces the truth to live, and the race-handling mechanics) · [objective-function.md](objective-function.md) (the ethics guardrails the optimistic-vs-honest and motion rules answer to) · [../SKILL.md](../SKILL.md) (the five-stage flight plan this reference serves, and the `perception-contract-set` gate it backs).

# Illusion Maintenance — the optimistic lie, told honestly

This reference is the depth behind **STAGE 1 — Illusion** of the [../SKILL.md](../SKILL.md) flight plan, the round where the suite's central reversal stops being philosophy and becomes code. It governs one check: **`illusion-maintenance-applied`** — the user's causal story held intact against a real, asynchronous, failing machine.

It rests on the heart of the skill, so read [the-membrane.md](the-membrane.md) first if you have not — specifically **AXIS 1 (mind)** and **AXIS 1b (the two conflicting corrects)**. This file does not re-argue *why* the work is structured this way; it tells you *how* to execute it, slice by slice, and *when not to*.

The governing fact, inherited from the membrane and restated because every call below is judged against it:

> **What you ship is not a correct program. It is a maintained illusion of direct manipulation over a system that is distant, asynchronous, and free to fail. "I dragged the file / I flipped the switch" is a lie you tell on the machine's behalf — and the craft is keeping that lie *coherent in the user's head* through success, failure, slowness, and the mis-click. Every tool below is a means to that one end, not an end in itself.**

There are exactly three tools in the box, and one rule that says when to put a tool down:

1. **Optimistic updates** — tell the likely truth before it is confirmed, so the click never produces *nothing*.
2. **Animation as causal narrative** — say *this new thing came from that action*, so effect is sewn to its cause.
3. **Honest loading / error states** — the confession, when the illusion can no longer hold (this is mostly [four-states.md](four-states.md)'s territory; here it is the *fallback the other two degrade into*).

And the rule: **don't lie about things with consequences.** Cheap, reversible, high-frequency actions get the reassuring lie; consequential, irreversible ones get the honest wait.

## Contents

- [The agent-era failure mode this stage counters](#the-agent-era-failure-mode-this-stage-counters)
- [Tool 1 — optimistic updates, with rollback](#tool-1--optimistic-updates-with-rollback)
  - [The four-step flow](#the-four-step-flow)
  - [Worked example — the order-status toggle](#worked-example--the-order-status-toggle)
- [The rule — when NOT to be optimistic](#the-rule--when-not-to-be-optimistic)
- [The negotiation — machine-correct vs mind-correct](#the-negotiation--machine-correct-vs-mind-correct)
  - [Worked example — the filtered list that thrashes](#worked-example--the-filtered-list-that-thrashes)
- [Tool 2 — animation as causal narrative](#tool-2--animation-as-causal-narrative)
- [The race edge — where optimism meets identity](#the-race-edge--where-optimism-meets-identity)
- [The acceptance bar and how findings route out](#the-acceptance-bar-and-how-findings-route-out)

---

## The agent-era failure mode this stage counters

The human author who built an optimistic update *felt* the betrayal of "it said it saved and it didn't" — they had been on the other side of that lie, as a user, and the memory of it pushed them to write the rollback branch. They felt the jank of a list that re-sorts on every keystroke and the wrongness of a modal that materializes from nowhere, because their own nervous system flagged it. That felt sense was the governor.

**The agent has no nervous system and no perception clock, so the entire mind-side spec is invisible to it**, and it fails in two reliably opposite directions:

- **It fakes failure dishonestly, or not at all.** It writes the optimistic update — change the cache, fire the request — and *stops*, because the success path turns green and the failure branch earns no reward. A silently-failing optimistic update is the worst artifact in the whole skill: it told the user a lie and then never took it back, so the user believes a thing happened that did not. The agent felt none of it.
- **It shows the honest-but-jarring truth and calls it correct.** A spinner on every keystroke, a list that thrashes, motion that appears from nowhere — all machine-clean, all test-green, all a mind-side disaster. It optimizes the side it can *measure* (machine-correct, which the type-checker proves and the test asserts) and is blind to the side it must *feel*.

So the negotiation between the two corrects — the call at the center of this stage — **cannot be left to the agent's default**, because its default silently betrays one side or the other. That is why `illusion-maintenance-applied` is a **GATE**, not a guideline: the rollback branch, the optimistic-vs-honest call, and the causal honesty of every animation must be *designed and gated* per slice. (For *why* the agent is structurally blind here, [the-membrane.md](the-membrane.md) AXIS 1b is the depth.)

---

## Tool 1 — optimistic updates, with rollback

An optimistic update is **telling the user the likely truth before the server confirms it**, so the causal break "I clicked → nothing → *then* it moved" never happens. It is machine-*incorrect* (you displayed unconfirmed state) and mind-*correct* (the feedback was instant) — that tension is the whole point, and it is only safe to resolve in optimism's favor when you can *take the lie back cleanly*.

The trigger is the perception contract, not a hunch: an action belongs in optimistic territory only if it lands in the **"instant" (<100ms expected) tier** of `bearings`'s perception contract. If the contract already says this interaction must feel like direct manipulation, the network round-trip is too slow to wait for, and an optimistic update (or a purely local computation) is the *only* way to honor it.

### The four-step flow

The flow has four steps, and **the agent reliably ships the first two and skips the fourth.** All four are the contract:

| Step | What you do | The failure if skipped |
|---|---|---|
| 1. **Optimistically change the cache** | Write the expected post-success state into the client cache *now*, before the request, and snapshot the previous state so you can restore it | (can't be skipped — it's the feature) |
| 2. **Send the request** | Fire the mutation to the server | (can't be skipped) |
| 3. **On success, reconcile** | Confirm the optimistic value, *or* replace it with the server's authoritative response (the server may have normalized, timestamped, or assigned an id) | UI and server drift; a `temp-id` lingers; the next write races a value that doesn't exist server-side |
| 4. **On failure, ROLL BACK and tell the user** | Restore the snapshot from step 1 **and** surface a non-blaming, recoverable error | **The lie is never retracted.** The user believes a thing happened that didn't. This is the trust-corroding default the gate exists to catch |

> **The meta-rule, applied here:** the goal is not "an optimistic update exists" — it is *an optimistic lie you can and do retract*. An optimistic update without step 4 is not an incomplete feature; it is a **net-negative** one — worse than no optimism at all, because the honest version (a pending spinner) at least never lied. Counting "did it update instantly?" instead of "does it roll back and confess on failure?" is the over-application failure, the mind-side twin of counting `cast`s instead of locating leaks.

A library of the *TanStack-Query class* gives you this flow as infrastructure (an `onMutate` that snapshots and writes, an `onError` that rolls back, an `onSettled` that reconciles) — but **the tool is a means, not the contract.** The contract is the four steps; name them in whatever your stack provides, and gate the fourth.

### Worked example — the order-status toggle

A user marks an order **Shipped**. It is cheap, reversible (they can set it back), high-frequency (a warehouse clerk does it hundreds of times a day), and the perception contract puts it in the *instant* tier. This is optimism's home turf.

**Before — the agent's "done" (steps 1–2 only):**

```ts
function markShipped(orderId: Id) {
  cache.set(orderId, { ...cache.get(orderId), status: "shipped" });  // 1. optimistic
  api.patch(`/orders/${orderId}`, { status: "shipped" });            // 2. send — and that's it
}
// Network drops. The badge stays green. The order is NOT shipped.
// The clerk moves on, certain it's done. The lie is permanent.
```

**After — the four steps, with the confession the agent omits:**

```ts
function markShipped(orderId: Id) {
  const previous = cache.get(orderId);                               // snapshot for rollback
  cache.set(orderId, { ...previous, status: "shipped" });            // 1. optimistic
  api.patch(`/orders/${orderId}`, { status: "shipped" })            // 2. send
    .then((server) => cache.set(orderId, server))                    // 3. reconcile to authoritative
    .catch(() => {
      cache.set(orderId, previous);                                  // 4a. ROLL BACK
      toast.error(`Couldn't mark order ${orderId} shipped — try again.`); // 4b. tell the user, non-blaming
    });
}
```

The difference between these two is invisible to a test that only exercises the success path — which is exactly why it is the agent's default and exactly why it must be gated.

---

## The rule — when NOT to be optimistic

Optimism is a *lie told for the user's benefit*, and the benefit only exists when the lie is harmless to retract. **When failure is consequential or irreversible, an honest pending state beats the reassuring lie**, because a lie you can't take back doesn't reassure — it deceives.

This is the ethics axis ([the-membrane.md](the-membrane.md) AXIS 7) landing in code as a single sentence: **don't lie about things with consequences.** Place every mutation on one axis and let the axis decide:

| | Cheap / reversible / high-frequency | Consequential / irreversible |
|---|---|---|
| **Examples** | like, star, toggle, reorder, mark-read, rename | payment, deletion, send-message, submit-order, publish, irreversible state change |
| **The call** | **optimistic** — mind-correct wins; the lie is harmless because rollback is clean | **honest pending** — machine-correct wins; show a real in-flight state, confirm only on the server's word |
| **Why** | an unneeded spinner costs a moment of patience | a silently-failed optimistic "payment succeeded" costs trust, money, and possibly the user's data |

The decision fork, in the suite's PREDICATE / DEFAULT / FALLBACK form (it is the same fork as the membrane's AXIS 1b card, restated here as the code-level gate):

- **PREDICATE:** is this action cheap, reversible, AND high-frequency, AND in the perception contract's *instant* tier? → optimistic.
- **DEFAULT** on a coin-flip: **honest pending.** The reassuring lie is only worth telling when you can take it back cleanly; when you're unsure you can, the honest confession beats a lie you can't retract.
- **FALLBACK** when you can't yet tell whether the action is reversible: treat it as consequential and wait honestly. The asymmetry is the whole reason — an over-honest call costs a moment of patience; a dishonest one on something irreversible costs trust on every use, for the life of the feature.

> A "honest pending" state is not a lesser feature — it is the *correct* feature for a consequential action. The skill that disappears the spinner on a payment is not a more polished skill; it is a dishonest one. Spend the polish budget on making the pending state *legible* (what's happening, how long, can I cancel) instead of on faking its absence.

---

## The negotiation — machine-correct vs mind-correct

The two tools above are both moves in one game: almost every interesting interaction is **a negotiation between two incompatible definitions of "correct,"** and that negotiation is the human's to run, because one of the two parties lives in a nervous system and cannot be formalized.

| | **Machine-correct** wants | **Mind-correct** wants |
|---|---|---|
| Source of truth | minimal, single, consistent | the user's causal story stays whole |
| Data shown | never show unconfirmed state | show the likely truth *now*, reconcile later |
| Recomputation | recompute whenever inputs change (it's pure and right) | stability — don't flicker, jump, or re-sort under the user's hands |
| Proven by | the type-checker and the test | only by a human's perception — no test captures it |

An optimistic update is machine-incorrect and mind-correct. A "strictly correct" list that re-sorts on every keystroke is data-flawless and a mind-side catastrophe. The agent optimizes the column it can measure and is blind to the other, so **you name the call in the user's language** ("is this safe to fake?", "does this need to feel instant, or is honest waiting fine?") — a "feel" judgment the user can't weigh in on is taste imposed, not shared.

### Worked example — the filtered list that thrashes

A search box filters a list. The data-correct instinct says: the filtered list is *derived*, so recompute it on every keystroke (and never store it — that's the state-sync discipline from [four-states.md](four-states.md) and the membrane's AXIS 2). Correct, as far as the machine goes.

**Before — machine-correct, mind-disaster:** every keystroke recomputes and re-sorts the visible list, rows leap, the result count flickers, and a row the user was about to click jumps out from under the cursor. The agent ships this and the test is green — `filter(list, query)` returns the right rows for every query.

**After — the same derivation, negotiated for the mind:**

- **Debounce the *expensive* reaction, not the input.** The text field updates instantly (mind-correct: the user sees their typing), but the re-sort/refetch waits ~200–300ms for a pause (mind-correct: no thrash). The *meaning* of the list is allowed to lag the *truth* of the keystrokes by a few hundred milliseconds — meaning-consistency beating data-consistency, which is the membrane's whole second insight.
- **Keep old results visible while the new ones compute** (stale-while-revalidate; a refetch never blanks the screen — see [four-states.md](four-states.md)). A slightly-stale-but-stable view beats a real-time-correct-but-flickering one.
- **Hold identity stable** so the rows that *survive* the filter don't re-mount and lose focus/scroll (the race edge, below).

Nothing here makes the list *less* correct as data — it makes it correct *for the nervous system reading it*. That second correctness is the one with no test, and the one the agent can't feel.

---

## Tool 2 — animation as causal narrative

Animation is **not decoration. Motion is the sentence that says *this new thing came from that action*** — it sews effect to cause across the gap where the user might otherwise lose the thread. Judged that way, an animation is either *narrating a causality* or it is *noise* (and at worst, a *lie* about cause). There is no third category called "polish."

The executable rule: **anything that appears, moves, or disappears because of a user action animates from or to its causal source.**

| The action | The causal animation | The lie / noise to delete |
|---|---|---|
| Delete a row | the row **collapses** in place (it was *here*, now it's gone) | the row **vanishes** instantly (no causal trace — did I delete the right one?) |
| Add an item | the new item **slides in from the "add" button** (it came from *that* click) | it **fades in at the top** from nowhere (no link to the action) |
| Open a modal | it **expands from the trigger** that opened it (this panel is *about* that thing) | it **materializes center-screen** (where did this come from?) |
| Submit a form | the submitted thing **moves toward its destination** | a decorative spinner-flourish that narrates no causality |

Two hard constraints sit on top of the rule:

- **Honor `prefers-reduced-motion`.** This is both accessibility *and* ethics ([the-membrane.md](the-membrane.md) AXIS 7): a user who has asked for less motion — for vestibular, attentional, or preference reasons — must get less motion. Provide a reduced variant (a cross-fade or an instant state change) that *still narrates the causality* without the large movement. "Respecting the setting" is not "disabling the storytelling"; it's telling the same story with a quieter voice.
- **Decorative motion that narrates no causality is deleted, not toned down.** If you can't say what causal link a piece of motion is drawing, it isn't maintaining the illusion — it's taxing it. The agent adds motion because motion looks like polish; the move here is the opposite of the agent's instinct — *subtract* the motion that says nothing.

The motion *durations* are a contract from the perception layer, not taste: micro-feedback ~150ms, transitions ~250–300ms, one consistent easing curve. They come from `bearings`'s perception contract; here you only ensure the motion that exists is *causal* and *reduced-motion-aware*.

---

## The race edge — where optimism meets identity

Optimism and async open a door the agent walks through blind: **out-of-order responses and rapid clicks**, where an old response overwrites newer truth. It belongs partly to the edge-state bar in [four-states.md](four-states.md), but it is called out here because it is *created by* the optimistic flow and breaks the same causal story.

The scenario: the user filters to "shipped", then immediately to "pending". Two requests are in flight; the *first* (shipped) returns *last* and overwrites the pending results the user is now looking at. The list now shows shipped orders under a "pending" filter — a torn causal story with a green test.

The discipline: **cancel stale requests so an old response can't overwrite new data**, or tie each response to the request that's still current (a request token / `AbortController`-class cancellation; a library of the TanStack-Query class does this by query key). And **stable identity** — keys tied to the data's real identity, never the array index — so the rows that persist across a re-render keep their focus, cursor, and in-flight animation. (This is the membrane's AXIS 3 landing in code; the *detection* of identity bugs and the full edge list live in [four-states.md](four-states.md).)

---

## The acceptance bar and how findings route out

A slice clears `illusion-maintenance-applied` when **every one of these holds** — this is the gate's substance, the same vocabulary as the `.checklist.yml` check:

- **Optimistic updates have rollback.** Every "instant"-tier mutation that updates the cache optimistically also *snapshots, reconciles on success, and on failure rolls back AND tells the user* (the four-step flow). No silent optimistic update survives the gate.
- **The optimistic-vs-honest call was made deliberately.** Each mutation was placed on the cheap-reversible ↔ consequential-irreversible axis; consequential/irreversible actions show an honest pending state, not the reassuring lie.
- **Animation narrates causality.** Everything that appears/moves/disappears from a user action animates from or to its causal source; decorative motion that narrates nothing is deleted; `prefers-reduced-motion` is honored with a reduced-but-still-causal variant.
- **Races can't tear the story.** Stale requests are cancelled (or response-to-request identity is enforced) so an old response can't overwrite new data.

When a slice fails the bar, the disposition routes by *what* failed — and most of the fixes leave this skill:

- A **missing rollback / dishonest optimism** is a `seaworthy` finding, fixed here (add step 4) — it is the heart of this gate.
- The **optimistic-vs-honest call you can't settle yourself** climbs the [escalation ladder](the-membrane.md#escalation-ladder--when-the-call-is-unclear): it bottoms out in *one sharp question to the user in their language*, because one side of "correct" lives in their nervous system. Default to the honest, machine-correct option and record the residual.
- The **loading / error / empty states** that optimism degrades into are [four-states.md](four-states.md)'s bar — the *confession* tool lives there; this file owns only the two *illusion* tools and the rule.
- The **perception thresholds and durations** the optimism and animation rely on come from `bearings`'s perception contract upstream; the **perf budget** that keeps the interaction in its tier (INP under the line, no main-thread stalls) is [accessibility-and-performance.md](accessibility-and-performance.md)'s gate.
- The **`prefers-reduced-motion`** variant is also an accessibility concern — its keyboard/focus/semantic siblings are [accessibility-and-performance.md](accessibility-and-performance.md)'s; here it is the *ethics-of-motion* framing only.
- The **identity / key correctness** behind the race edge is detected in [four-states.md](four-states.md)'s edge bar; here it is the race-condition framing.
- The **trials** skill tests all of this next: each of the four states and the rollback are *behaviors*, not guesses — feed a failing request and assert the UI rolled back and confessed; the four states you maintained here are exactly its test scenarios.

> **The one-line check at the gate, the same one the membrane closes on:** *would you dare yank the network cable in front of the user?* If a dropped request leaves a lie on the screen that you never retract, the illusion isn't maintained — it's a betrayal the agent couldn't feel and the test couldn't catch. That is what this gate exists to refuse.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 1 / 1b — the maintained illusion and the two corrects, *why* this stage reads as it does; AXIS 7 — the ethics of the optimistic lie and of motion; AXIS 3 — identity behind the race edge; and the escalation ladder this file routes to) · [four-states.md](four-states.md) (the honest loading/error/empty confession the illusion degrades into, plus the edge bar and identity detection) · [accessibility-and-performance.md](accessibility-and-performance.md) (`prefers-reduced-motion`'s a11y siblings, and the perf budget that keeps an interaction in its perception tier) · [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves — STAGE 1, the `illusion-maintenance-applied` gate).

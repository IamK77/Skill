---
name: seaworthy
description: >
  The build-it lens for a frontend feature, with one inverted discipline: the
  happy path is ~40% done, not 90%, so you design the UNHAPPY paths first, not as a
  polish pass that never gets time. Use when building feature slices (after
  wellspring's state map), or auditing whether a feature is production-grade. The one
  shift: what you ship is not "a correct program" but a maintained ILLUSION of direct
  manipulation over a real, asynchronous, failing system — so loading / error /
  empty / edge states aren't afterthoughts, they ARE the product, and accessibility
  and a performance budget are built in from the first slice, not bolted on. Triggers
  on "build this component / feature", "loading / error / empty states", "optimistic
  update", "skeleton screen", "animation / transition", "accessibility / a11y /
  keyboard / screen reader / focus", "performance / Web Vitals / INP / LCP / CLS /
  bundle size", "it feels janky / slow", "race condition / stale response".
argument-hint: "[the feature slice to build production-grade, or to audit for the unhappy paths]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# seaworthy

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A seaworthy ship isn't one that sails in calm water — every hull does that — it's one that keeps the crew alive in the storm. A feature is the same: anyone can write the happy path; its real quality is entirely in how it catches the user when the system breaks, returns nothing, runs slow, or gets mis-clicked. `seaworthy` is the fourth skill of the `surface` suite, the lens you hold *while building*, and it carries one inverted discipline — **the happy path is about 40% done, not 90%, so you design the unhappy paths first.** Its product is feature slices that are each complete: data → state → view → *and* the loading / error / empty / edge states, with accessibility and a performance budget built in. It runs across gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The reversal that governs everything here: what you ship is a maintained illusion, not a correct program.** "Direct manipulation" — that you are dragging the file, flipping the switch — is a lie; you are sending a message to a possibly-distant, possibly-failing, thoroughly asynchronous system. The real craft of the frontend is **maintaining a coherent causal story in the user's head against the machine's true asynchronous, failure-prone nature.** Seen that way, a whole class of "best practices" stops being polish and becomes *illusion-maintenance*: optimistic updates tell the user the likely truth before it's confirmed, so "I clicked → nothing → then it moved" never happens; animation is causal narrative, telling the user *this new thing came from that click*; honest loading and error states are the confession when the illusion can't hold. So the unhappy paths are not a TODO list for later — **they are the product**, and they are designed first, because the polish pass that's supposed to add them never gets the time, and when the deadline bites, it's the unhappy paths that get cut.

This is where the agent era bites:
- **The agent ships the happy path and calls it done.** It writes the fetch-and-render, the tests pass on the data case, and it stops — leaving loading/error/empty/edge as `// TODO`, because the happy path turns green and the failure states earn no reward. But the failure states are where the user's trust is won or lost. **The agent's "done" is the 40% mark.**
- **The agent fakes nothing about failure honestly.** A silent optimistic update with no rollback is a trust-eroding lie; an error that drops the user's input is a betrayal it won't feel. It treats animation as decoration (adding motion that *lies* about causality) and leaves accessibility for "later" (a cost multiple of building it in).
- **The agent never feels "janky."** Perception performance lives in a nervous system the agent has no access to — a spinner that flashes for 50ms, a list that re-sorts on every keystroke, a layout that shifts — so a perf budget must be a hard CI number, not a feeling it's trusted to have.

**Read [references/the-membrane.md](references/the-membrane.md) first** — the heart; for `seaworthy`, lean on the *mind* axis (the membrane: direct-manipulation-is-a-lie, the product as maintained illusion, the two conflicting "corrects" — machine-correct wants no unconfirmed data, mind-correct wants the reassuring optimistic lie). Load at the start, re-check at every gate.

**Speak the user's language.** The calls here are the user's — is this action safe to fake optimistically, is this animation honest, what does "feels right" mean for this interaction. Read their fluency and gloss a term on first use (*optimistic UI* / rollback, *skeleton* screen, *stale-while-revalidate*, *causal* animation, `prefers-reduced-motion`, *focus management*, *INP/LCP/CLS*, a *performance budget*). A judgment about "feel" the user can't weigh in on is taste imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/the-membrane.md](references/the-membrane.md)** — the heart: the seven axes reframed for the agent era; for `seaworthy`, the *mind* axis (the maintained illusion, the two conflicting corrects) is the spine. Load at the start, re-check at every gate.
- [references/four-states.md](references/four-states.md) — the engine: the per-slice acceptance bar for loading, error, empty, and edge states — each with its concrete pass/fail conditions (no-layout-shift skeletons, input-preserving errors, the three kinds of empty, the 0/1/many and race-condition edges).
- [references/illusion-maintenance.md](references/illusion-maintenance.md) — the optimistic-update flow with rollback, when NOT to be optimistic (consequential/irreversible → honest pending), animation as causal narrative (and `prefers-reduced-motion`), and the machine-correct-vs-mind-correct negotiation.
- [references/accessibility-and-performance.md](references/accessibility-and-performance.md) — accessibility built in (semantic HTML, the unplug-the-mouse keyboard walk, focus management, ARIA only when semantics fall short), and the performance budget as hard CI numbers that fail the build on regression.
- [references/forms-states-and-offline.md](references/forms-states-and-offline.md) — forms (validation timing, controlled vs uncontrolled, the submission lifecycle), app-level composition with empty/loading/error states as product, and offline/PWA (service workers, cache strategies, background sync).
- [references/accessibility-deep.md](references/accessibility-deep.md) — the hard a11y bones past the basics: ARIA patterns done right, focus architecture (trap, roving tabindex, restore), live regions, the APG widget patterns, and the real screen-reader test matrix.

> **The arc is one slice, built whole.** Four stages — states · illusion · reach · budget — turn a happy-path demo into a production-grade feature: states designs the four failure modes as first-class (not TODOs); illusion maintains the user's causal story against an async, failing machine; reach makes it usable without a mouse and without sight; budget makes "feels fast" a number CI enforces. `seaworthy` gates all four per slice; `trials` (correctness) is the next step — and the four states you built here are exactly the behaviors it tests.

---

## STAGE 0 — States (design the four failure modes as first-class, not TODOs)

Open **[references/four-states.md](references/four-states.md)**. Any fetch-or-mutate slice has at least four states beyond the happy one; each has a concrete bar.

- **Loading.** No layout shift — the skeleton's dimensions match the final content (protect CLS). Distinguish *first load* (skeleton) from *background refresh* (keep old data + an unobtrusive indicator — stale-while-revalidate; never blank the screen on a refetch). Respect the perception thresholds: if data usually returns <100ms, don't flash a spinner — one that appears and vanishes in 50ms is worse than none; delay ~200–300ms, show progress only past ~1s.
- **Error.** Tell the user what happened and what they can do, and **never lose their input** (the form still has its contents after the error). Distinguish recoverable (give a retry) from unrecoverable (give an exit/help path). Scope error boundaries — one block failing shouldn't blank the whole page. Report it (to error tracking). Don't blame the user; don't leak internals.
- **Empty.** Distinguish *empty-because-new* (an onboarding CTA) from *empty-because-filtered* (explain why + a one-click clear) from *empty-because-error* (that's the error state). The first-run empty state is where the user decides to stay or leave — it's a product opportunity, not a blank `div`.
- **Edge.** The "…but what if…" list: 0 / 1 / many; very long content (truncate/wrap/overflow) and very short; slow network / offline / stale data (page open an hour); races (rapid clicks, out-of-order responses — cancel stale requests so an old response can't overwrite new data); permission lost mid-session; a collaborator changed the same thing.

### GATE — clear before ILLUSION
1. `checklist check states four-states-designed`
2. `checklist verify states`

---

## STAGE 1 — Illusion (maintain the causal story against an async, failing machine)

Open **[references/illusion-maintenance.md](references/illusion-maintenance.md)**. This is where the fourth-round insight cashes out into code.

- **Optimistic updates — with rollback.** For changes that land in the "instant" perception tier (from `bearings`'s contract), update the UI immediately, then reconcile: optimistically change the cache → send the request → on success confirm (or replace with the server's response) → **on failure roll back and tell the user.** That last step is the one most often skipped — a silently-failing optimistic update is a lie that corrodes trust.
- **When NOT to be optimistic.** When failure is consequential or irreversible (payment, deletion), an honest pending state beats the reassuring lie. The rule: cheap / reversible / high-frequency → optimistic; consequential → honestly wait. (This is `bearings`'s ethics landing in code: don't lie about things with consequences.)
- **Animation is causal narrative, not decoration.** Anything that appears, moves, or disappears because of a user action should animate *from or to its causal source*: a deleted row collapses (not vanishes), a new item slides in from the "add" button, a modal expands from the trigger. Decorative motion that narrates no causality is noise — delete it. Respect `prefers-reduced-motion` (accessibility *and* ethics).

### GATE — clear before REACH
1. `checklist check illusion illusion-maintenance-applied`
2. `checklist verify illusion`

---

## STAGE 2 — Reach (usable without a mouse, without sight — built in, not bolted on)

Open **[references/accessibility-and-performance.md](references/accessibility-and-performance.md)** (the accessibility section). The second render tree, present from the first slice.

- **Start from semantic HTML.** The executable check: **unplug the mouse and complete the key path with the keyboard alone.** If you can't, it's broken — and you run this check per slice, not as a final retrofit (which costs several times as much, and is an ethical/inclusion issue, not just technical).
- **Manage focus.** After a route change / modal open / async completion, decide where focus goes: modal opens → focus moves in and is trapped; closes → focus returns to the trigger.
- **ARIA only when semantics fall short.** A real `<button>` beats `<div role="button" tabindex=0 onKeyDown=...>` every time. Reach for ARIA when native semantics genuinely can't express it — not before.
- **Make it a gate.** Run an automated checker (axe-style) in CI plus a "key-path keyboard walkthrough" line on the PR checklist.

### GATE — clear before BUDGET
1. `checklist check reach accessibility-built-in`
2. `checklist verify reach`

---

## STAGE 3 — Budget (make "feels fast" a number CI enforces)

Open **[references/accessibility-and-performance.md](references/accessibility-and-performance.md)** (the performance section). Translate `bearings`'s perception contract into CI gates — because "optimize later" never happens and costs 10× when it does.

- **Set numeric budgets.** INP < 200ms, LCP < 2.5s, CLS < 0.1, and a bundle-size budget per route. These are the perception thresholds expressed as numbers.
- **Enforce in CI.** Lighthouse-CI / bundle-size checks that go red on regression — the point being that a performance regression is caught **in the PR that caused it**, not three months later in production with no one knowing which change did it.
- **The high-leverage moves.** Don't blank the screen on refetch (perceived performance), match skeleton dimensions (protect CLS), code-split by route, lazy-load below the fold, keep a single interaction's main-thread work under ~50ms (protect INP), push heavy work to a web worker or chunk it.

### FINAL GATE
1. `checklist check budget performance-budget-enforced`
2. `checklist verify budget`
3. `checklist show` — confirm all four stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`seaworthy` is **the building stage** of the `surface` suite, and it inverts the naive order: the unhappy paths first, because they are the product, not its polish. It grows directly out of `wellspring`'s classified state (each piece of state's loading/error/empty set becomes the four states you build) and `bearings`'s perception contract and thinks-vs-actually gaps (which become the illusion-maintenance and the perf budget), and it hands `trials` exactly the behaviors to test — the four states are testable scenarios, not guesses. The through-line is the suite's own — *push correctness into structure* — here as: the failure modes are designed up front and gated per slice, so quality is built in, not retrofitted under deadline.

It pairs with the engineering suite without duplicating it. `assay` designs the *tests*; `gauge` keeps machine *signal* trustworthy; `plumb` keeps the code legible — `seaworthy` owns the part with no home there: the maintained illusion (optimistic UI, causal animation), the perception-tier budget, and frontend accessibility as the second render tree. For an agent the lever is the same as everywhere in the suite: it ships the happy path as "done," fakes failure dishonestly or not at all, and can't feel "janky" — so the four states, the rollback, the keyboard path, and the perf number must be **designed and gated** per slice, with the unhappy paths built first.

## Anti-patterns (use as a pre-flight checklist)

- **Happy path shipped as "done"** — that's the 40% mark; the four failure states are the product, design them first.
- **Loading/error/empty left as `// TODO`** — the polish pass never gets the time; build them in the same slice.
- **Blanking the screen on refetch** — distinguish first-load (skeleton) from background-refresh (keep old data); stale-while-revalidate.
- **A spinner that flashes for 50ms** — worse than none; respect the perception thresholds, delay the indicator.
- **An error that drops the user's input** — a betrayal; preserve input, distinguish recoverable from not, scope the boundary, report it.
- **A blank `div` for empty** — distinguish new/filtered/error; the first-run empty is where the user decides to stay.
- **Silent optimistic update with no rollback** — a trust-corroding lie; reconcile and tell the user on failure, and don't fake consequential/irreversible actions.
- **Decorative animation that narrates no causality** — noise (or worse, a lie about cause); motion should connect effect to its source; honor `prefers-reduced-motion`.
- **Accessibility deferred** — costs several times more to retrofit; unplug the mouse and walk the key path per slice.
- **Performance "optimized later"** — it won't be; set numeric budgets and fail the build on regression in the causing PR.
- **Skipping a GATE** — and remember: would you dare yank the network cable in front of the user? If not, the unhappy paths aren't done.

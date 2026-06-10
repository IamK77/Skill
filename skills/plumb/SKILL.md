---
name: plumb
description: >
  Audit code for craft — and write it craft-grade — so it stays cheap to read
  and change: intent-revealing names, small single-purpose functions, comments
  that explain why (not what), earned abstraction (DRY but not premature),
  cohesion and low coupling, SOLID and design patterns as guidance not dogma,
  the trust-chain escape hatches (Any/cast/isinstance/getattr and their
  cross-language family) contained at the edges, the classic code smells swept,
  and testability used as the design litmus — tuned for a world where an agent
  writes plausible-but-clever code, over-abstracts, names vaguely, rots comments,
  and is itself the next reader. The cross-cutting craft/legibility lens. Use when
  the user wants a code review or quality audit, asks whether code is clean /
  readable / well-named / over-engineered, wants to tame complexity or a "clever"
  module, mentions code smells, SOLID, design patterns, DRY, or refactoring for
  clarity, or asks "is this good code". Triggers on "review this code", "is this
  clean / readable", "code smells", "this is too clever / over-engineered",
  "naming", "should I use a design pattern here", "DRY this up", "audit code
  quality", "make this legible".
argument-hint: "[code / module to audit or write craft-grade]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# plumb

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The goal of good code is not "it runs" — it is **staying cheap to read and change**, which is the same as **managing complexity.** That picks up the number the `husbandry` skill leaves you with: maintenance is 60–80% of cost, and nearly all of it is spent *reading* and *changing* code. So the one sentence under everything here is the oldest one in the craft: **code is written for humans to read, and only incidentally for a machine to run.** Every technique below — naming, function shape, abstraction, the trust-chain discipline, smell-hunting — serves legibility and changeability, nothing else. This skill is the **plumb line** you hold against code to see whether it is *true*: it audits code for craft (and guides you to write it craft-grade) across six gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it.

**One stance first, because it governs every judgment downstream: these are guidance, not dogma.** Clean Code, SOLID, the design patterns — each has supporters and critics, and *over*-applying any one of them is its own defect. The craft is **judgment, not rule-recitation**: the test for every technique is always the same — *does this make the code clearer and cheaper to change, or just more rule-compliant?* A codebase contorted to satisfy SOLID, or drowned in patterns it didn't need, is worse than the plain version it replaced. This is the suite's recurring "X is a means, not an end," aimed at code itself.

Craft is where the agent era bites in a quiet, compounding way:
- **The agent writes clever, not clear.** It produces plausible, dense, "elegant" code by default — and feels no cost reading it back, because it re-reads anything instantly. So nothing in its instinct steers toward the boring, obvious version the *next* reader needs. **Boring is the goal**: simple, clear, predictable, legible at a glance — not clever.
- **The agent is now the next reader.** The default reader of this code is a fresh agent session (or future-you) with *no context* — only the source and the docs. Cleverness, a vague name, a stale comment, a sprawling function each tax that reader directly, and the agent that wrote them felt none of it.
- **The agent over-abstracts and under-names.** It reaches for a premature abstraction, a pattern, a SOLID-shaped split because it pattern-matches "good engineering" — and names things `data`, `handle`, `process`, `tmp` because a precise name earns no green. Both make the code harder to read while *looking* sophisticated.
- **The agent leaves the trust-chain escape hatches.** `Any`, `cast`, `isinstance`, `getattr` (and their cross-language family) are where a static guarantee the tool could have proven gets downgraded to "trust me" or "decide at runtime" — and the agent scatters them through core logic because each one makes the immediate thing work. They are its tells.

So the rule that governs this skill: **optimize for the next reader, not the machine and not your own cleverness — and prove craft by judgment, not by rule-compliance.**

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what each craft practice becomes once the code is written by something that writes clever-not-clear, over-abstracts, names vaguely, and reads its own output back for free. If `$ARGUMENTS` is a genuine throwaway, this machinery is overkill — say so; the craft bar is sized to how long the code must stay legible.

**Speak the user's language.** Craft judgments are trade-offs the user often owns (is this abstraction worth it, is this clever line acceptable here, is this debt we accept). Read their fluency and gloss a term on first use (code smell, DRY/AHA, SOLID, a design pattern, `parse-don't-validate`, primitive obsession). A craft "finding" the user can't evaluate is a style opinion imposed, not a judgment shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the six stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. Sizing the craft bar to the code's role and longevity, the rename/extract calls, the **duplicate-or-abstract** fork (DRY vs AHA), the "does this pattern/principle make it clearer?" router, the trust-chain **edge-or-core** router, the smell→fix map, and the disposition router. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how each craft practice changes when an agent writes the code and is its own next reader. Load at the start, re-check at every gate.
- [references/craft-stance.md](references/craft-stance.md) — boring-over-clever, code-for-humans, complexity as the thing you are managing, guidance-not-dogma, and how the craft line threads the suite.
- [references/naming.md](references/naming.md) — names as the primary documentation: intent-revealing, searchable, no encodings, consistent vocabulary, length scaled to scope — the highest-ROI craft there is.
- [references/functions-and-flow.md](references/functions-and-flow.md) — small functions that do one thing at one abstraction level, few parameters, no flag arguments; comments that explain *why* (and the stale-comment danger); error handling as design — fail fast, never swallow.
- [references/abstraction-and-design.md](references/abstraction-and-design.md) — DRY vs the wrong abstraction (AHA / rule of three), cohesion and low coupling at the code level, SOLID as guidance, design patterns as shared vocabulary (and pattern-itis), and resisting over-engineering.
- [references/smells-and-trust-chains.md](references/smells-and-trust-chains.md) — the signature reference: one master question and eight smell families, each with a single lens. The trust-chain escape hatches (`Any`/`cast`/`isinstance`/`getattr` and their family across languages) contained at the edges via *parse-don't-validate*, primitive obsession cured with domain types, illegal states made unrepresentable — then the whole Fowler catalog organized into six lenses (coupling, mutable shared state, size, abstraction, intent, dead matter) you derive rather than memorize.
- [references/testability-and-disposition.md](references/testability-and-disposition.md) — testability as the design litmus (hard-to-test is bad design), and disposing every finding (fix now / refactor-under-test / accept with a reason) by handing off to the sibling skills.

---

## STAGE 0 — Frame (set the craft bar, take the judgment stance)

The craft bar is sized to how long the code must stay legible and how many readers it has — *够用就好*; a one-off script earns clarity but not a SOLID refactor, a core domain module read daily for years earns the full craft. Open **[references/craft-stance.md](references/craft-stance.md)** and **[references/decision-tree.md](references/decision-tree.md)**: fix the bar, and internalize the governing fact — **code is read far more than written, the next reader is an agent with no context, so boring-and-legible beats clever** — and the stance that makes this skill safe to wield: **everything here is guidance, judged by whether it makes the code clearer and cheaper to change, never applied as dogma.**

**Decide the mode: AUDIT or SETUP.** **AUDIT** (the common case — you are reviewing existing code): survey the unit, then judge it stage by stage against the craft bar, producing ranked findings with a fix direction each — never flagging a "violation" that doesn't actually hurt legibility or changeability (a style opinion is not a finding). **SETUP** (you are writing new code): apply the same craft as you write, so the boring-and-legible version is the one that lands.

### GATE — clear before NAMES
1. `checklist check frame craft-bar-set`
2. `checklist verify frame`

---

## STAGE 1 — Names (the highest-ROI craft there is)

Open **[references/naming.md](references/naming.md)**. A name is code's primary documentation, and naming is the single most undervalued, highest-return move in the craft. Audit (or choose) names for one property above all: **they reveal intent.** `elapsedTimeInDays` over `d`; `isEligibleForRefund()` over `check()`. A name should be searchable, pronounceable, free of encodings (no Hungarian prefixes, no `str_` clutter), and drawn from one consistent vocabulary (don't call it `fetch` here and `get` and `retrieve` elsewhere for the same thing). Length scales with scope — a loop index can be `i`, a module-level export cannot. The agent's tells here are the generic placeholder names (`data`, `info`, `handle`, `process`, `tmp`, `obj`) that reveal nothing; a precise name pays back its cost the first time anyone reads the line, and saves a comment and ten minutes of the next reader's confusion.

### GATE — clear before FUNCTIONS
1. `checklist check names names-reveal-intent`
2. `checklist verify names`

---

## STAGE 2 — Functions & flow (small, one thing, honest about failure)

Open **[references/functions-and-flow.md](references/functions-and-flow.md)**.

- **Small, and do one thing.** A function should work at a **single level of abstraction** — don't compute business logic, build a SQL string, and format output in the same body. Keep parameters few; more than three or four is usually a sign they should be grouped into an object. And **distrust the flag argument** (`doStuff(true)`) — it almost always means the function does two things and should be split.
- **Comments explain *why*, not *what*.** Good code already says what it does; a comment earns its place by recording **intent, a trade-off, or a counter-intuitive trap** ("looks redundant, but removing it triggers the X bug"). Delete comments that merely restate the code — and treat a **stale comment as worse than none**: it actively lies to the next reader, the same hazard `husbandry` names for stale docs.
- **Error handling is design, not an afterthought.** Handle errors **explicitly and fail fast**; never silently swallow an exception (an empty `catch` is a time bomb). An error message must help locate the problem, not say `something went wrong`.

### GATE — clear before ABSTRACTION
1. `checklist check functions functions-small-single-purpose`
2. `checklist check functions comments-and-errors-honest`
3. `checklist verify functions`

---

## STAGE 3 — Abstraction & design (earned, not premature; guidance, not dogma)

Open **[references/abstraction-and-design.md](references/abstraction-and-design.md)**.

- **DRY, but resist the wrong abstraction.** Removing duplication is right — but **a wrong abstraction is more expensive than the duplication it replaced** ("duplication is far cheaper than the wrong abstraction" — Sandi Metz). The agent's (and the novice's) error is abstracting two similar snippets immediately; when the two needs diverge, the shared abstraction becomes the thing no one can change. The rule is **AHA — avoid hasty abstraction**: tolerate a little duplication until the pattern is genuinely stable (rule of three), *then* extract.
- **High cohesion, low coupling — at the code level.** A class/module has one focused responsibility; the dependencies between them are few and explicit, so changing one place doesn't ripple. (The *architectural* version is the `load-bearing` skill's; this is the same idea inside a module.)
- **SOLID and patterns are vocabulary and guidance, never a checklist.** SOLID's five principles help you write flexible code; design patterns give a team a shared name for a recurring solution. But **pattern-itis** — wrapping three lines in a factory and two abstraction layers — and SOLID-as-dogma — splitting simple logic into eight classes to satisfy a principle — are *over-engineering*, the agent's favorite failure because it feels no cost generating structure. The only test: does the pattern/split make this *clearer and easier to change*, or just more "correct"? If simple code solves it, use simple code (KISS/YAGNI).

### GATE — clear before TRUST
1. `checklist check abstraction abstraction-earned`
2. `checklist check abstraction patterns-solid-as-guidance`
3. `checklist verify abstraction`

---

## STAGE 4 — Trust & smells (where the guarantee leaks, and what stinks)

Open **[references/smells-and-trust-chains.md](references/smells-and-trust-chains.md)** — the signature of this skill.

- **Contain the trust-chain escape hatches at the edges.** `Any`, `cast`, `isinstance`, `getattr` (and the same family in every static language — TS `any`/`as`/`!`, Java reflection/unchecked casts, Go `interface{}`, Rust `unwrap`/`unsafe`, …) are each a point where a guarantee the *tool* could prove gets downgraded to "I'll vouch for it" or "decide at runtime." At a **boundary** (deserializing external JSON, an FFI, a generic library) they are necessary; **scattered through core domain logic they are a smell** — the trust chain leaking from compile time to runtime. The cure is **parse, don't validate**: at the edge, parse untrusted/dynamic data *once* into a trusted type (a `dataclass`, a validated model, a `NewType`), and let the type carry that guarantee into the core so nothing re-checks it. The static-layer *tooling* for this is the `gauge` skill's; plumb names where the chain leaks and routes the fix there.
- **Kill primitive obsession; make illegal states unrepresentable.** A `user_id: str` and an `email: str` the checker treats as interchangeable is a leak; domain types (`NewType`, enums, value objects) and sealed/union types that can't represent a bad state close it.
- **Sweep the classic smells — by lens, not by list.** Run six lenses over the unit, each isolating *one underlying failure*: **coupling** ("change one place, ripple everywhere" — shotgun surgery, feature envy, message chains), **mutable shared state** ("can't reason from a local read" — hidden side effects, races), **size & bloat** ("more than fits in one head" — long functions/classes, deep nesting), **abstraction misalignment** ("wrong axis of change" — duplication *and* speculative generality), **implicit intent** ("meaning lives in your head" — magic numbers, flag args, boolean blindness), and **dead matter** ("existence is a cost" — dead and commented-out code). Each smell is a *tell* pointing at a specific fix; the reference organizes the whole Fowler catalog this way so you *derive* it rather than memorize a flat list. Some smells roll up further into a shared **root cause** that crosses lenses — *knowledge with no single home* unifies shotgun surgery and duplication, *a missing domain type* unifies primitive obsession and data clumps — and naming that root cause is what makes one fix dissolve several smells at once.
- **Sweep dynamically, not just statically — the worst smells only show under change.** Shotgun surgery, the change that touches nine files, the divergent duplicate — none of these is visible *reading* the code; every site looks clean in isolation, because the smell lives in the *relationship between* places, and that surfaces only when you try to **modify**. This is why reading clean code never trains the nose for them — only changing does. Since you usually can't change just to find out, **simulate it** with three probes: **"if rule X changed, how many sites must I touch?"** (knowledge duplication), **"if I deleted this feature, how many files bleed?"** (coupling / the deletion test), **"to test this unit, how many things must I mock?"** (mixed responsibility). When a probe surfaces a duplicated *predicate* — the same rule as `status in {…}` here and `status not in {…}` there — **diff the two copies**: identical means de-duplicate before it forks; already-diverged means it is no longer a smell but a *live bug*. Prefer the fail-safe whitelist (a new case is excluded, waiting for a human) over the fail-silent blacklist (a new case is admitted, no one asked), and give the rule one named home (`gauge` owns turning that silent drift into a CI signal). Keep the stance throughout: **a probe firing is a hypothesis, not a verdict** — it says "go look," not "guilty"; the diagnosis, confirmed against the master question, is what makes it a finding. (The mechanical half — running the grep, building the dependency graph — is exactly what to hand an agent; the instrument choice and the diagnosis are yours.)

### GATE — clear before DISPOSITION
1. `checklist check trust trust-chain-contained`
2. `checklist check trust smells-swept`
3. `checklist verify trust`

---

## STAGE 5 — Testability & disposition (the litmus, then close the loop)

Open **[references/testability-and-disposition.md](references/testability-and-disposition.md)**.

- **Testability is the design litmus.** **Hard-to-test code is almost always badly-designed code.** A function you can only test by mocking a dozen things is too coupled and does too much; pushing toward testability pushes you toward good design — separate pure logic from side effects (I/O, network, time), inject collaborators so they're replaceable. So "how hard is this to test?" is a probe you can run on any code to read its design quality. (Designing the tests themselves is the `assay` skill's craft.)
- **Dispose every finding — a found smell that's never fixed is worthless.** For each: **fix it now** if it's small and safe; **refactor it under test** — handed to the `husbandry` skill (small steps, boy-scout rule, behavior pinned) for anything larger; or **accept it with a written reason** (this clever line is justified here / this duplication isn't stable enough to abstract yet). Route the type-discipline fixes to `gauge`, the refactors to `husbandry`, the test gaps to `assay`. A review that produces a list nobody acts on is the same as no review.

### FINAL GATE
1. `checklist check disposition testability-litmus`
2. `checklist check disposition findings-disposed`
3. `checklist verify disposition`
4. `checklist show` — confirm all six stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

plumb is cross-cutting: it is the **legibility-and-craft lens** you hold over code at any point in the lifecycle, the plumb line that says whether the code is *true*. It pairs with its siblings without duplicating them — `gauge` makes the code emit trustworthy machine *signal* (types, validation, errors-as-values); plumb makes the code legible to the next *human-or-agent reader*; the two meet exactly at the trust-chain, where a leaked static guarantee is both a weak signal and an unreadable intent. `husbandry` keeps the system cheap to change over its life and owns the refactoring *mechanics*; plumb judges the moment-to-moment craft and hands the fixes there. `assay` tests behavior; plumb uses testability as a design probe. `load-bearing` draws the module boundaries; plumb keeps the code *inside* them cohesive. For an agent the lever is the same as everywhere in the suite: it writes clever-not-clear and is its own next reader, feeling none of the future cost of an unreadable line — so craft must be **judged and gated**, with the boring, legible version made the one that ships.

## Anti-patterns (use as a pre-flight checklist)

- **Clever over clear** — code that needs deciphering; write the boring, obvious version for the next reader.
- **Vague / generic names** (`data`, `handle`, `tmp`) — names are the primary docs; reveal intent.
- **Giant functions / classes** doing many things at mixed abstraction levels — small, one thing, one level.
- **Flag arguments** — usually two functions wearing one name; split them.
- **Comments that restate the code** (and stale comments) — explain *why*; a stale comment lies.
- **Silently swallowed errors** — an empty `catch` is a time bomb; fail fast, explicit, helpful messages.
- **Premature / wrong abstraction** — duplication is cheaper than the wrong abstraction; AHA, rule of three.
- **Static-only smell sweep** — the deadliest smells (shotgun surgery, the un-deletable feature, the divergent duplicate) are invisible to reading; run the three simulate-modification probes, and diff duplicated predicates for an already-live bug.
- **Pattern-itis & SOLID-as-dogma** — over-engineering that looks sophisticated; the test is "clearer and easier to change?"
- **Trust-chain leaks** — `Any`/`cast`/`isinstance`/`getattr` through core logic; parse once at the edge.
- **Primitive obsession** — `str` everywhere; domain types and unrepresentable illegal states.
- **Untestable code** — hard-to-test is badly-designed; separate pure from effects, inject collaborators.
- **Smell seen, never fixed** — dispose every finding; a review nobody acts on is no review.
- **Skipping a GATE** — and remember the meta-rule: these are guidance, not dogma; judgment over rules.

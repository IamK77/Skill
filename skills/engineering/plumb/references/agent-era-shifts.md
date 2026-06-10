# Agent-Era Shifts in Code Craft

This is the heart of `plumb` — the seven ways the craft of writing readable code changes once an agent (or a fleet of them) writes it, and a human-in-the-loop mostly reads, reviews, and lives with the result. It is opened at **STAGE 0 (Frame)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The classic craft canon — intent-revealing names, small functions, comments that explain why, DRY (but not hasty), cohesion and low coupling, SOLID and patterns as guidance, smell-hunting — is all still correct; it was written for an author who *felt the cost of reading their own bad code next month*, who got a flicker of doubt at a vague name or a sprawling function, and who knew "clever" would bite them. None of those feelings survive contact with an agent. This reference re-aims each practice for an author that **writes clever instead of clear, names things vaguely, over-abstracts without friction, leaves the trust-chain escape hatches, and reads its own output back for free — so it feels none of the legibility tax it imposes on the next reader, which is now another agent with no context.** The other references teach you *how* to do each piece — [craft-stance.md](craft-stance.md), [naming.md](naming.md), [functions-and-flow.md](functions-and-flow.md), [abstraction-and-design.md](abstraction-and-design.md), [smells-and-trust-chains.md](smells-and-trust-chains.md), [testability-and-disposition.md](testability-and-disposition.md). This one names *what is different about the work now*, and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you write or judge a line

> **Ask of every line: "would a fresh session with no context read this correctly, on the first pass?"** The next reader of this code is not the author who just wrote it with the whole problem in their head — it is a stateless agent session (or future-you) with *nothing but the source*. Cleverness, a vague name, a stale comment, a premature abstraction, a trust-chain escape hatch each tax that reader directly, and the agent that wrote them felt *zero* cost, because it re-reads anything instantly and has no next-month to dread. The whole job of this skill is to move craft out of "it works / it looks sophisticated" and into "the next reader gets it at a glance." **Code is read far more than it is written; the next reader is an agent with no context; so boring-and-legible beats clever — and every rule below is guidance, judged by whether it makes the code clearer, never applied as dogma.** Everything else is a consequence of that.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the author felt the cost of their own bad code and got a flicker of doubt at a vague name.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to judge and gate instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent writing or auditing code on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## SHIFT 1 — Clever, not clear → boring is the goal, and you are the next reader

> **The root shift. If you internalize only one card, internalize this one — every other card is a corollary.** Gate: [`craft-bar-set`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The author wrote code they would have to *read again* — next month, on a bug, with the context gone — so legibility was self-interest: a clever one-liner you couldn't decode at 2 a.m. punished *you*. "Code is read far more than written" was felt, not just recited, and the friction of re-reading your own dense code was the governor that pushed toward the plain version. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent writes **clever, dense, "elegant" code by default** — its training distribution rewards the impressive-looking solution — and it feels **no cost reading it back**, because it re-parses anything instantly and has no next-month to suffer. The governor is gone. Worse, the *next reader is now an agent too*: a fresh session with no memory of why the code exists, which means legibility stopped being a courtesy to a colleague and became the *only* way the next session understands the code at all. This **SHARPENS "write for the reader" from good advice into the whole premise**: the property that keeps code alive — a fresh reader gets it at a glance — is exactly the property the agent is blind to. |
| **THE DESIGN CONSEQUENCE** | Legibility must be *judged and gated on every unit*, not trusted to an instinct the agent lacks — and the target is explicit: **boring.** Simple, clear, predictable, obvious, legible at a glance — not clever, not impressive, not "needs a second to follow." Size the bar to how long the code must stay readable and how many readers it has (a throwaway vs a core module), but at every level the test is the same: the next stateless session reads it correctly the first time. And it is all *guidance* — judged by clarity, never applied as dogma, because over-applying a craft rule is its own way to make code worse. |
| **DO THIS** | At Frame, set the craft bar and take the judgment stance. As you write or audit, prefer the boring readable version over the clever one; when a line needs deciphering, that is the finding. Ask the pre-flight question — *would a no-context session read this on the first pass?* — and when the answer is no, the code, not the reader, is wrong. |

> Anti-pattern this card kills: **"clever, elegant, impressive."** The agent's default aesthetic; the next session's tax. Boring is a feature.

---

## SHIFT 2 — The agent names vaguely → names must reveal intent

> Gate: [`names-reveal-intent`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A careful author *struggled* over names — naming is famously one of the two hard problems — because a vague name was a debt they would pay every time they re-read the code, so they reached for the precise one. The effort was governed by the felt cost of `d` and `tmp` and `handle` six months later. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent names things `data`, `info`, `handle`, `process`, `tmp`, `result`, `obj` by default — the generic placeholder that reveals nothing — because a precise name earns no green reward and the agent feels no cost re-reading a vague one (it reconstructs meaning from context instantly, every time). The single highest-ROI move in the craft is the one the agent under-invests in most, because its payoff is entirely in a *future reader's* time the agent doesn't experience. This **takes naming from a struggled-over craft to a step that must be required**. |
| **THE DESIGN CONSEQUENCE** | Names are audited and chosen to **reveal intent** as a gated property: `elapsedTimeInDays` not `d`, `isEligibleForRefund()` not `check()`. Searchable, pronounceable, no encodings (no Hungarian, no `str_`), one consistent vocabulary across the codebase (not `fetch`/`get`/`retrieve` for the same act), length scaled to scope. A name is code's primary documentation; a good one deletes a comment and saves the next reader ten minutes. |
| **DO THIS** | At Names, flag every generic placeholder and replace it with an intent-revealing name. Check the vocabulary is consistent. When you cannot name a thing clearly, treat that as a signal the thing itself is unclear (doing two jobs, wrong boundary) — the naming difficulty is diagnostic, not just cosmetic. |

> Anti-pattern this card kills: **`data`, `handle`, `tmp`.** The agent's reflex names; each one a small unpaid debt that the next session pays in confusion.

---

## SHIFT 3 — Sprawling functions, rotting comments, swallowed errors → small, honest, fail-fast

> Gates: [`functions-small-single-purpose`](#gate-map), [`comments-and-errors-honest`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An author kept functions small and focused partly because a 200-line function doing five things was *painful to hold in their head* when they came back to change it; they wrote comments sparingly and felt the wrongness of a comment that no longer matched the code; and they handled errors because an unhandled one bit them in production. The discipline was backed by lived consequences. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **emits sprawl without friction**: a long function that computes business logic, builds a query, and formats output in one body — at mixed abstraction levels — because it works and the agent feels no strain holding it. It **rots comments**: it changes the code and leaves the comment stale (no green reward to update it), and the *next* session reads the stale comment as truth (the `husbandry` stale-doc trap, at the line level). And it **swallows errors** — an empty `catch`, a bare `except: pass` — because suppressing the error is the cheapest path to a green run. Each is invisible to a passing test. |
| **THE DESIGN CONSEQUENCE** | Three gated properties. **Functions small and one-thing at one abstraction level**, with few parameters and *no flag argument* (a `doStuff(true)` is two functions wearing one name). **Comments explain *why* not *what*** — intent, a trade-off, a counter-intuitive trap — and a *stale comment is worse than none*, because it actively lies. **Errors handled explicitly and fail-fast** — never silently swallowed, with messages that locate the problem, not `something went wrong`. |
| **DO THIS** | At Functions, split the sprawling function along its abstraction seams; group long parameter lists into objects; split the flag-argument function in two. Delete comments that restate code; keep (and fix) the ones that capture *why*; treat any comment the change made stale as a defect of that change. Replace every empty `catch`/`except` with explicit handling that fails fast and says something useful. |

> Anti-pattern this card kills: **the empty `catch` and the stale comment** — two silent time bombs the agent plants because neither turns anything red.

---

## SHIFT 4 — The agent over-abstracts → earn the abstraction; guidance, not dogma

> Gates: [`abstraction-earned`](#gate-map), [`patterns-solid-as-guidance`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Abstraction had a *felt cost*: a human had to write and then maintain the factory, the base class, the extra layer — so they hesitated, and a wrong abstraction that everyone had to route around was a visible, painful tax. The deterrent against premature abstraction was the tedium of building and living with speculative structure. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent **over-abstracts enthusiastically**, because the deterrent is gone — it generates the factory, the five-class SOLID split, the pattern, the abstraction layer at *no cost to itself*, and they *look* like good engineering (its training is full of them), so "make it flexible / extensible / SOLID" produces a pile of speculative structure the next session must read through. It abstracts two similar snippets *immediately* (the wrong abstraction that's more expensive than the duplication), and it reaches for a design pattern where three lines would do (pattern-itis). This **takes "don't over-engineer" from a discipline to a rule that must be enforced against an author that produces complexity for free**. |
| **THE DESIGN CONSEQUENCE** | DRY is judged against **AHA — avoid hasty abstraction**: tolerate a little duplication until the pattern is genuinely stable (rule of three), because *a wrong abstraction is more expensive than the duplication it replaced*. Cohesion/low-coupling are kept at the code level. And SOLID and patterns are **guidance and shared vocabulary, never a checklist**: the only test is *does this split/pattern make the code clearer and easier to change, or just more rule-compliant?* — if simple code solves it, simple code wins (KISS/YAGNI). |
| **DO THIS** | At Abstraction, when tempted to extract a shared abstraction from two similar snippets, *wait* for the third and for the pattern to stabilize. When tempted by a pattern or a SOLID split, ask whether it makes *this* code clearer or just more "correct"; if the latter, delete the structure and keep it simple. Treat speculative generality — config for one case, a plugin system with no plugins — as a finding. |

**Decision fork — extract this abstraction now, or tolerate the duplication?**

- **PREDICATE:** have you seen this exact pattern at least three times, and is it stable (the instances aren't about to diverge)?
- **DEFAULT** on a coin-flip: **tolerate the duplication** — it's cheaper to abstract later, once the shape is proven, than to un-build a wrong abstraction everyone routes around. The burden of proof is on the abstraction.
- **FALLBACK** when you can't tell if the instances will diverge: leave them duplicated and *named clearly* so the relationship is visible; an abstraction you might have to tear out is worse than a duplication you can collapse later.

---

## SHIFT 5 — The agent leaves the trust-chain escape hatches → parse once at the edge

> Gates: [`trust-chain-contained`](#gate-map), [`smells-swept`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An author who reached for `cast`, `isinstance`, `Any`, `getattr` (or `as`, reflection, `interface{}`, `unwrap`) felt a small unease — they knew they were *stepping outside the guarantee the tool would otherwise give them*, vouching for something the checker could no longer prove, and they reached for it only where they had to (a boundary) and felt wrong scattering it through core logic. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent scatters these **without unease**, because each one makes the immediate thing work and the agent feels none of the lost guarantee. So the trust chain — the property that a value's type is *proven*, not *asserted* — leaks from compile time to runtime all through the core, one convenient `cast`/`isinstance`/`Any` at a time, and the next session inherits code where nothing is actually guaranteed. These escape hatches are the agent's **tells**: a cluster of them in core domain logic is a reliable signature of trust that should have been established once at the edge and wasn't. This **takes "minimize the dynamic escape hatches" from a felt discipline to a smell that must be hunted**. |
| **THE DESIGN CONSEQUENCE** | The escape hatches are **contained at the edges**, not banned: at a boundary (deserializing external data, an FFI, a generic library, gradually typing legacy) they are necessary; in core logic they are a smell. The cure is **parse, don't validate** — at the edge, parse untrusted/dynamic data *once* into a trusted type (a `dataclass`, a validated model, a `NewType`/domain type), so the type carries the guarantee inward and the core never re-checks. Plus: kill primitive obsession with domain types, and make illegal states unrepresentable. The static-layer *tooling* (the strict checker, `pydantic`/`zod`) is the `gauge` skill's; plumb names where the chain leaks and routes the fix there. And the rest of the classic smells (long function, large class, shotgun surgery, feature envy, magic numbers) are swept the same way — each a tell, each pointing at a fix. |
| **DO THIS** | At Trust, find the clusters of `Any`/`cast`/`isinstance`/`getattr` (or the language's family) in core logic and ask: *can this trust be established once, at a boundary, by parsing into a type?* Push the dynamism to the edge; replace primitive-typed parameters that mean different things with domain types; sweep the Fowler catalog and route each smell to its refactoring (handed to `husbandry`). |

> Anti-pattern this card kills: **rebuilding trust at every call site** — the `isinstance`/`cast`/`if x is not None` re-checks scattered through the core that should have been one parse at the edge.

---

## SHIFT 6 — The agent ignores testability → use "is it testable?" as the design litmus

> Gate: [`testability-litmus`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A developer who had to *write the test* felt the pain of badly-designed code directly — a function that needed a dozen mocks to test was annoying to test, and that annoyance was honest feedback that the design was too coupled, so testability pressure quietly pushed toward better design. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent does not feel that pain — it will generate the dozen mocks without complaint, or write tightly-coupled code it never tries to test in isolation, so the **honest signal that "hard to test = badly designed" never reaches it**. It also tangles pure logic with side effects (I/O, network, time) freely, producing code that is both hard to test and hard to reason about, and feels neither cost. This **takes testability from an implicit design-feedback loop to a probe you must run deliberately**. |
| **THE DESIGN CONSEQUENCE** | Testability is used as the **design litmus**: *how hard is this to test?* is a probe of design quality you run on any code. A function testable only by mocking many collaborators is too coupled and does too much; the fix is to **separate pure logic from side effects** (pure functions are trivially testable and easy to reason about) and to **inject collaborators** so they're replaceable. Pushing toward testability pushes toward good design. (Designing the tests themselves is the `assay` skill's craft; here testability is a *design probe*, not a test plan.) |
| **DO THIS** | At Disposition, for any unit, ask what it would take to test it. If the answer is "mock a dozen things" or "I can't without a database," read that as a design smell: extract the pure logic, inject the I/O. Use the difficulty as the measurement, then fix the design it reveals — don't just write the painful test. |

> Anti-pattern this card kills: **"it's hard to test, so skip the test."** Hard-to-test is the *finding*: the design is wrong, and the testability pain is how you know.

---

## SHIFT 7 — The agent stops at the finding → dispose every smell, boy-scout the rest

> Gates: [`findings-disposed`](#gate-map), [`smells-swept`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A reviewer (or an author who spotted their own smell) understood the point was to *fix* it, or consciously decide not to — a review that produced no improvement was a wasted review, and "I'll clean it up when I'm next in here" was a real intention a person would (sometimes) act on, because they felt ownership of the code. |
| **WHAT CHANGED IN THE AGENT ERA** | Producing the audit turns the task green — the smells are listed, the review "done" — so the agent's reward arrives *before* anything is fixed, and its default is to hand over a list and stop. And it has **no boy-scout instinct**: passing through code, it will not leave it a little cleaner than it found it, because the cleanup earns no green and it feels no ownership. So smells accumulate (the only-add-never-clean reflex seen across the suite) and audits pile up unactioned. This **takes "the value is the fix" from an understood truth to a step the process must force**. |
| **THE DESIGN CONSEQUENCE** | The final stage is the *disposition loop*, not the list. Every finding is disposed: **fix now** (small, safe), **refactor under test** via the `husbandry` skill (small steps, boy-scout, behavior pinned) for anything larger, or **accept with a written reason**. Type-discipline fixes route to `gauge`, refactors to `husbandry`, test gaps to `assay`. A review whose findings nobody acts on is the same as no review — and the continuous-craft habit is the boy-scout rule: leave each piece of code a little cleaner than you found it, every time you're in it. |
| **DO THIS** | At Disposition, rank the findings and dispose each — fix, refactor-under-test (route to `husbandry`), or accept-with-reason. Don't stop at the list. And as a standing habit, when you're in a file for any reason and see a cheap, safe craft improvement under the existing tests, make it — boy-scout it cleaner. |

> Anti-pattern this card kills: **the smell list in the drawer** — and the agent passing through dirty code and leaving it exactly as dirty.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.*

Read down this table at the corresponding GATE: it tells you which shift you are actually enforcing and what "done" means for code written or audited by an agent. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent-era framing |
|---|---|---|---|
| frame | `craft-bar-set` | **SHIFT 1** | Boring-and-legible as the goal, sized to the code's readers and longevity; the next reader is a no-context agent session; and craft as judgment-not-dogma — because the agent writes clever-not-clear and feels no cost reading it back. |
| names | `names-reveal-intent` | **SHIFT 2** | Intent-revealing, searchable, consistent names — because the agent reaches for `data`/`tmp`/`handle` and feels no cost re-reading a vague name. |
| functions | `functions-small-single-purpose` | **SHIFT 3** | Small functions, one thing, one abstraction level, few params, no flag args — because the agent emits sprawl at mixed levels without friction. |
| functions | `comments-and-errors-honest` | **SHIFT 3** | Comments explain *why* (stale = worse than none); errors fail-fast, never swallowed — because the agent rots comments and empties `catch` blocks to go green. |
| abstraction | `abstraction-earned` | **SHIFT 4** | DRY judged by AHA / rule of three; code-level cohesion & low coupling — because the agent abstracts hastily and the wrong abstraction costs more than the duplication. |
| abstraction | `patterns-solid-as-guidance` | **SHIFT 4** | SOLID & patterns as guidance not dogma; over-engineering flagged — because the agent generates speculative structure for free and it *looks* sophisticated. |
| trust | `trust-chain-contained` | **SHIFT 5** | `Any`/`cast`/`isinstance`/`getattr` (& family) contained at the edges via parse-don't-validate; domain types; illegal states unrepresentable — because the agent scatters the escape hatches through core logic, leaking the guarantee to runtime. |
| trust | `smells-swept` | **SHIFT 5**, SHIFT 7 | The Fowler smell catalog swept, each pointed at its fix — because each smell is a tell the agent emits without feeling it. |
| disposition | `testability-litmus` | **SHIFT 6** | "How hard to test?" used as a design probe; pure/effects separated, collaborators injected — because the agent never feels the hard-to-test = badly-designed signal. |
| disposition | `findings-disposed` | **SHIFT 7** | Every finding fixed / refactored-under-test (→ `husbandry`) / accepted-with-reason; boy-scout the rest — because producing the list turns the task green before anything is fixed. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this clever line acceptable here, is this abstraction worth it, is this `cast` a boundary or a leak — climb one rung at a time rather than guessing silently:

```
pick the DEFAULT for a clearly low-stakes craft choice (the boring version, the plain name, the duplication tolerated)
   → wrapped: make the choice reversible and small — a rename you can revert, a refactor under the existing tests
      → check it against the test: does the readable/boring version pass the same tests? (legibility shouldn't change behavior)
         → ask the user one sharp question — they own the trade-offs craft can't settle: is this cleverness justified by a
           real constraint (a hot path, a domain idiom), is this abstraction worth its weight, is this a debt we accept
           (the SHIFT 4 abstraction call and the "accept-with-reason" disposition bottom out here)
            → if still unresolved, default to the BORING, simpler, more reversible option (plain over clever, duplication
              over hasty abstraction, a domain type over a primitive) and record the residual as a craft note for the user.
```

The asymmetry that governs the ladder: **an over-cautious craft choice costs the agent a little terseness or a moment of "too simple"; a clever line, a wrong abstraction, or a leaked trust-chain costs every future reader — now mostly agent sessions — the time to decode it, on every read, for the life of the code.** When the call is a genuine toss-up, err toward boring, plain, and legible. See [decision-tree.md](decision-tree.md) for sizing the craft bar and the duplicate-or-abstract and edge-or-core routers, and [../SKILL.md](../SKILL.md) for the stage order these gates run in. And remember the meta-rule from Frame: **these are guidance, judged by whether they make the code clearer — not dogma to apply for its own sake.**

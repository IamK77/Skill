# Agent-Era Shifts in Maintenance & Evolution

This is the heart of `husbandry` — the seven ways maintaining and evolving a system changes once an agent (or a fleet of them) does the maintaining: reads the code, takes the bug, proposes the refactor, bumps the dependency, edits the doc, and a human-in-the-loop only sets the trade-offs, holds authority, and inherits whatever the codebase has become. It is opened at **STAGE 0 (Frame)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The classic maintenance canon — manage technical debt, refactor under test, fix bugs at the root, version with semver, keep docs alive, prefer incremental change to a rewrite — is all still correct; it was written for a maintainer who *felt* the slow drag of accumulating debt, dreaded the silent regression, carried the scar of a rewrite that went badly, and knew the implicit history of the code. None of that survives contact with an agent. This reference re-aims each practice for a maintainer that **optimizes the change in front of it and feels none of the future cost, loves a rewrite, banks debt with no ledger, cannot feel a regression a missing test would have caught, and leaves the docs to rot for its own next session.** The other references teach you *how* to do each piece — [maintenance-types-and-stance.md](maintenance-types-and-stance.md), [technical-debt.md](technical-debt.md), [refactoring.md](refactoring.md), [defect-management.md](defect-management.md), [versioning-and-dependencies.md](versioning-and-dependencies.md), [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md). This one names *what is different about the work now*, and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you touch the code

> **For every change you are about to make, ask: "does this leave the system *cheaper* or *more expensive* to change next time — and how would I know?"** The agent optimizes the change in front of it: make the test pass, make the bug's symptom stop, make the messy code go away by rewriting it. It feels none of the cost it is shifting onto the *next* change — the debt it banks, the edge-case it discards in a rewrite, the regression it can't feel, the doc it leaves lying. The whole job of this skill is to move maintainability from a thing trusted to instinct (an instinct the agent does not have) into a thing **measured, budgeted, tested, and gated** — because the most prolific maintainer is now one that, left alone, reliably makes the next change more expensive while this one looks done. **Software is read and changed far more than it is written; optimize for the next change, not this one.** Everything below is a consequence of that single sentence.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the maintainer felt the drag of debt, dreaded a regression, and carried the code's history.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to build into the maintenance process instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent maintaining a system on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## SHIFT 1 — Optimize for the next change, not this one → the root shift

> **If you internalize only one card, internalize this one — every other card is a corollary.** Gate: [`maintenance-stance-set`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A maintainer writing a change *felt* the cost of the code being hard to change — they were the one who would come back to it next month, so "leave it readable, keep it decoupled, don't bank debt silently" was self-interest as much as discipline. Code was understood to be **read far more than written**, and the person editing it carried an internal model of where the next change would land. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent optimizes the change **in front of it** — pass the test, close the ticket, make the diff look done — and feels *none* of the cost it shifts onto the next change, because there is no "next month" it will personally suffer. It has no stake in readability (it can re-read anything instantly), no felt drag from coupling, no memory of the system to protect. This **SHARPENS "design for change" from a virtue into the entire premise of the skill**: the property that makes a system survivable — cheapness of the *next* change — is exactly the property the agent is blind to. |
| **THE DESIGN CONSEQUENCE** | Maintainability cannot be left to the maintainer's instinct; it must be a *judged, gated property of every change*. Match the investment to the system's **stage of life** (actively-growing earns the most care; sunsetting earns the least) — but at every stage, each change is evaluated by the cost of the next one: readability over cleverness (the next reader is a fresh session with no context), high cohesion / low coupling so a change doesn't ripple, and *no* speculative over-engineering (a structure for an imagined future is future maintenance burden the agent will happily build because it feels no cost). |
| **DO THIS** | At Frame, place the system on its life arc and size the rigor. For every change, ask the pre-flight question — cheaper or more expensive to change next time? Prefer the boring readable version over the clever one; keep modules cohesive and loosely coupled; delete speculative generality. When a change would make the next change harder, that cost is the thing to surface to the user, not hide behind a green test. |

> Anti-pattern this card kills: **"it works, ship it."** Working is necessary and not sufficient; a change that works *and* makes the next change more expensive is a loss the agent will book as a win.

---

## SHIFT 2 — The agent reaches for the rewrite → restrain it to incremental change

> Gates: [`no-reckless-rewrite`](#gate-map), [`legacy-and-sunset-planned`](#gate-map) (strangler-fig vs big-bang).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "Let's rewrite it" was tempting but *expensive to act on* — a human had to write all the new code by hand, which made the cost viscerally obvious, and the people proposing it usually remembered the last rewrite that overran. The implicit knowledge baked into the old system — why that weird branch exists, the edge-case someone hit in production three years ago and fixed — was understood to be valuable and hard to recover. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent's single most dangerous reflex. It finds messy code *distasteful* and can **generate a plausible replacement fast**, so the rewrite feels cheap — and it feels **no loss** of the implicit knowledge, the thousands of edge-case fixes, and the battle-tested corners the old code accreted, because that history is invisible to it. So "this is bad, let me rewrite it" becomes the default response to any code the agent didn't write, and the rewrite discards exactly the hard-won value that doesn't show up in the source. This **takes the big rewrite from a known-risky temptation to the agent's reflexive first move**. |
| **THE DESIGN CONSEQUENCE** | Incremental refactoring must be the *enforced default*, and a rewrite a deliberate, justified, rare exception. The same logic governs legacy migration: a **big-bang cutover** (the rewrite at system scale) is forbidden in favor of the **strangler-fig pattern** — grow the replacement around the old system and retire it piece by piece, so the implicit knowledge is preserved and migrated, not discarded. The agent's "rewrite it" must be intercepted and redirected to "refactor it under test, in small steps." |
| **DO THIS** | When the instinct is "rewrite," stop and refactor incrementally instead (STAGE 2), under a test net. Reserve a true rewrite for a documented, exceptional case — and when one is genuinely warranted, do it behind the strangler fig (incremental replacement), never a flag-day big-bang. Before discarding old code, mine it for the edge-cases and fixes it encodes (the weird conditionals are usually scar tissue from real incidents) and carry them forward as tests. |

**Decision fork — rewrite or refactor this?**

- **PREDICATE:** can the desired end state be reached by a sequence of small, individually-tested, behavior-preserving steps from the current code?
- **DEFAULT** on a coin-flip: **refactor incrementally** — the rewrite's cost and its loss of implicit knowledge are almost always underestimated; the burden of proof is on the rewrite.
- **FALLBACK** when you genuinely can't tell (the old code is opaque, untested, and resists incremental change): do *not* leap to a rewrite — first add characterization tests to make it legible and changeable, *then* re-evaluate; most "must rewrite" cases dissolve once the code is under test.

---

## SHIFT 3 — The agent banks debt with no ledger → make debt visible and budgeted

> Gate: [`debt-tracked-and-budgeted`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Technical debt was incurred by people who mostly *knew* they were incurring it — a deliberate shortcut to hit a date, with a half-intention to come back. They felt its interest directly: the next change in that area was visibly slower and more annoying, and that drag was a standing reminder the debt was there. Even un-repaid, the debt lived in someone's awareness. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent lives in Fowler's **inadvertent-and-reckless** corner by default: it takes the cheapest path to a green result, banking shortcuts it doesn't recognize *as* debt and would never log or repay, because it feels no interest payment — the next change is just as cheap *for it* to attempt (it re-reads everything from scratch anyway). It has the only-add-never-clean reflex seen across the suite (the flag graveyard, the test graveyard): it will accrue debt indefinitely and never spend effort paying it down without being made to. This **takes debt from a known, felt loan to an invisible, compounding one**. |
| **THE DESIGN CONSEQUENCE** | Debt must be made **external and visible**, because the agent supplies no internal awareness of it: a debt register that logs and *quantifies* each item by its interest (how much it slows/endangers future change), and a **fixed paydown budget every iteration** so repayment is scheduled, not left to a "when we have time" that never arrives. The aim is *managed* debt, not zero — deliberate-prudent debt is a legitimate tool — but every item must be *acknowledged*, which is exactly what the agent will not do on its own. |
| **DO THIS** | Keep a debt register; when you take a deliberate shortcut, log it with its reason and its interest. Each iteration, spend a fixed fraction of effort paying down the highest-interest debt. In review, name the debt a change incurs out loud — an un-logged shortcut is the reckless-inadvertent quadrant. Treat "we'll clean it up later" with no register entry and no budget line as equivalent to never. |

> Anti-pattern this card kills: **silent debt.** Not the debt itself — deliberate, logged debt is fine — but debt the team (and the agent) doesn't know it is carrying, compounding until the system is too rigid to touch.

---

## SHIFT 4 — The agent cannot feel a regression → refactoring requires the test net

> Gates: [`refactor-under-test`](#gate-map), [`small-and-separated`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A careful human refactoring had an internal sense of whether they were preserving behavior — they reasoned about the change, ran it, eyeballed the result, and felt a prickle of doubt when a "harmless cleanup" touched something load-bearing. Tests made refactoring *safe*, but a disciplined human with no tests could still often refactor small things without breaking them, because they understood the code's intent. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has **no felt sense of a behavior change**. Asked to "clean this up," it will restructure the code and report success while having silently altered what it does — because nothing in its process distinguishes a behavior-preserving refactor from a behavior-changing rewrite *except a test that fails*. It does not get the prickle. This **takes "tests make refactoring safer" from good advice to a hard precondition**: for an agent, refactoring without a test net is not refactoring at all, it is undetectable rewriting. |
| **THE DESIGN CONSEQUENCE** | The test safety net is **mandatory, not advisory**, before any refactor — and where the code has none (the legacy case), **characterization tests** that pin current behavior must be written *first*, then the structure changed under their cover. Two more disciplines keep agent refactoring legible: keep it **small and continuous** (boy-scout, not a giant risky restructure the review can't follow), and keep refactoring commits **separate from behavior-changing commits**, so that if behavior *did* change, the diff that changed it is identifiable rather than buried in a structural reshuffle. |
| **DO THIS** | Before refactoring, confirm a passing test covers the behavior you're about to restructure; if not, write it (characterization tests for legacy — pin what the code *does*, including bugs, then improve). Refactor in small steps, running the tests after each. Commit the refactor alone, no feature change mixed in. The `assay` skill designs these tests; this skill *requires* them as the gate that catches the regression you can't feel. |

**Decision fork — is this change a refactor or a behavior change?**

- **PREDICATE:** is the external, observable behavior (outputs, side-effects, contracts) intended to be *identical* afterward?
- **DEFAULT** on a coin-flip / when unsure: treat it as a **behavior change** — require it under test, in its own commit, and verify the tests still pass; assuming "this cleanup is safe" is exactly the agent error this gate exists to catch.
- **FALLBACK** when there is no test covering the behavior at all: do **not** refactor yet — add the characterization test first; an "untested refactor" is the contradiction this whole stage forbids.

---

## SHIFT 5 — The agent whack-a-moles to green → fix the root cause

> Gates: [`triage-and-regression-first`](#gate-map), [`root-cause-fixed`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An engineer fixing a bug usually *wanted* to understand it — a recurring bug was a personal annoyance and a professional embarrassment, so chasing the root cause (rather than papering over the symptom) was the natural, if not always followed, instinct. They knew that a symptom suppressed would come back, and coming back would cost *them* again. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent's reward is the **green result**, so a bug is "fixed" the instant the symptom stops — the failing test passes, the error log goes quiet, the user-visible glitch disappears. Reaching for the *root cause* is extra work with no additional green reward, so the agent's cheapest path is **symptom suppression**: catch and swallow the exception, special-case the bad input, add the null check at the crash site rather than where the null was born. The fault stays, and recurs. This **takes whack-a-mole from a lazy-day temptation to the default behavior of a green-optimizing actor**. |
| **THE DESIGN CONSEQUENCE** | The bug-fix process must *force* understanding and *prevent* recurrence: **reproduce every bug with a failing test first** (which proves the bug is understood, not just that a symptom moved), and **drive to the root cause** (5-Whys or equivalent) rather than accepting the first change that turns the light green. Triage so effort goes to the bugs that matter, and find defects *proactively* from the `stationkeeping` error monitoring rather than waiting for a user — because the agent will not go looking. |
| **DO THIS** | Triage incoming defects by severity/priority; record explicit won't-fixes. For each bug: write a test that fails on the current code, *then* fix it, *then* confirm the test passes — the fail-first regression discipline of the `assay` skill. Ask "why" until you reach the underlying cause, not the surface one; a fix at the crash site that doesn't explain *why* the bad state arose is a symptom patch. Wire production error monitoring into the defect intake so failures become tracked bugs automatically. |

> Anti-pattern this card kills: **"the error stopped, so it's fixed."** For a green-optimizing agent, a swallowed exception and a fixed bug look identical from the dashboard; only a root-cause fix with a reproducing test is the latter.

---

## SHIFT 6 — The agent breaks callers and lets dependencies rot → evolve compatibly and continuously

> Gates: [`versioning-and-compatibility`](#gate-map), [`dependencies-kept-current`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An engineer changing a public API *felt* an obligation to the callers — there were real people downstream who would be broken, and breaking them had a social cost, so backward compatibility and graceful deprecation were instinctive courtesies. And keeping dependencies current was understood as ongoing hygiene; a responsible maintainer bumped them as part of the job, flinching at the thought of a framework drifting toward EOL. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent feels **no obligation to callers it cannot see**: tasked with changing an interface, its cheapest move is to *change it* — rename it, alter its signature, delete the old one — because the consumers aren't in its context and breaking them has no felt cost. And it has **no hygiene instinct** for dependencies: it will leave them frozen indefinitely (an upgrade is friction with no green reward) until something forces the issue, by which point the deferred upgrade has compounded into dependency hell or an EOL emergency. This **takes "compatibility and currency" from felt responsibilities to properties that must be enforced**. |
| **THE DESIGN CONSEQUENCE** | Compatibility must be **communicated and enforced**, not trusted: semantic versioning so a breaking change is a visible major bump (and is *recognized* as breaking), backward-compatible public APIs, and **graceful deprecation** — mark old, provide a migration path and a transition window, remove later — rather than the agent's default delete-it-now. Dependency currency must be a **scheduled, continuous tax** — small frequent upgrades backed by the test suite — with EOL dates tracked, so no load-bearing framework drifts into an unsupported emergency migration. |
| **DO THIS** | Version with semver; when a change is breaking, bump major *and* say so. Never delete a public interface in place — deprecate it (warning, docs, migration guide), keep it for a window, then remove. Upgrade dependencies in small regular batches behind the test suite (a chore an agent does well *when told to*); track each major dependency's EOL date and migrate *before* it, not after. In review, hunt the silent API break and the suspiciously-old pinned dependency. |

**Decision fork — can this interface change ship as-is?**

- **PREDICATE:** does any consumer outside this change's blast radius depend on the current behavior/shape of the interface?
- **DEFAULT** on a coin-flip: assume **yes** — keep the old path working and deprecate it with a migration window; the cost of a deprecation cycle is small, the cost of a surprise break is every downstream caller's incident.
- **FALLBACK** when you can't enumerate the consumers (a public or widely-used API): treat it as breaking, bump major, and provide the migration path — never silently change a contract you can't prove is private.

---

## SHIFT 7 — The agent rots the docs and then trusts them → keep documentation living

> Gate: [`knowledge-and-living-docs`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Documentation drifted out of date, and that was a known, tolerable decay — because the humans maintaining the system carried the *real* knowledge in their heads and used the docs as a fallible aid, mentally correcting for the parts they knew were stale. Tribal knowledge, lossy as it was, persisted across a person's tenure and patched over the documentation's gaps. A stale doc was a nuisance a knowledgeable human routed around. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has **no head to hold the real knowledge** and **no memory between sessions**, so the documentation is not a fallible aid — it is the agent's *primary source of truth*, and the next session **trusts a stale doc as fact** and is actively misled by it. Worse, the agent *creates* the staleness: it changes the code and feels no pull to update the doc (no green reward), so session A leaves a doc wrong and session B builds on the wrong doc. This **takes "stale docs are a nuisance" to "stale docs are a poison the agent both produces and ingests"** — and makes the old line literally true: an out-of-date doc is *worse* than no doc. |
| **THE DESIGN CONSEQUENCE** | Documentation must be **living** — kept in sync with the system as a condition of change, lightweight enough to actually maintain, and biased toward the durable *why* (ADRs, the agent-readable `AGENTS.md`/runbooks) over volatile detail that rots fastest. And the **bus factor** must be actively lowered by externalizing knowledge into these durable artifacts, because for a stateless agent the artifacts are the *only* continuity — there is no tenure, no "ask the person who wrote it." Treat a doc the change made wrong as a defect of that change. |
| **DO THIS** | When a change invalidates a doc, update the doc in the *same* change (or delete the doc if it's not worth maintaining — no doc beats a wrong one). Keep an `AGENTS.md`/ADR trail capturing the *why* the next session relies on. Lower bus factor by writing knowledge down where the agent reads it, not leaving it in one head or one session. In review, treat a code change that left its doc stale as incomplete. |

> Anti-pattern this card kills: **the lying doc.** A stale doc the next agent session trusts is not neutral debris; it is misinformation in the one place the stateless maintainer looks for truth.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.*

Read down this table at the corresponding GATE: it tells you which shift you are actually enforcing and what "done" means for a system maintained by an agent. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent-era framing |
|---|---|---|---|
| frame | `maintenance-stance-set` | **SHIFT 1** | Investment matched to the system's stage of life; every change judged by the cost of the *next* change (readability, cohesion/low-coupling, no over-engineering) — because the agent optimizes this change and feels none of the future cost. |
| debt | `debt-tracked-and-budgeted` | **SHIFT 3** | Debt made visible in a register, quantified by interest, paid down on a fixed budget — because the agent banks debt invisibly (inadvertent-reckless) and never repays it. Managed debt, not zero. |
| debt | `no-reckless-rewrite` | **SHIFT 2** | Incremental refactoring the enforced default; a rewrite a rare justified exception — because the agent reaches for a rewrite reflexively and feels no loss of the implicit knowledge / edge-case fixes it discards. |
| refactor | `refactor-under-test` | **SHIFT 4** | Refactoring only under a test net (characterization tests first for legacy) — because only a test, not the agent's belief, catches the silent regression a "cleanup" introduces. |
| refactor | `small-and-separated` | **SHIFT 4** | Small continuous boy-scout refactors, kept in commits separate from behavior changes — so a regression is attributable and review can see what actually changed. |
| defects | `triage-and-regression-first` | **SHIFT 5** | Defects triaged by severity; every bug reproduced with a failing test before the fix — the fail-first regression discipline, proving the bug is understood, not just that a symptom moved. |
| defects | `root-cause-fixed` | **SHIFT 5** | Root-cause fixes (5-Whys) over whack-a-mole symptom suppression, plus proactive discovery from production error monitoring — because the agent's cheapest path is to silence the symptom and call it green. |
| evolve | `versioning-and-compatibility` | **SHIFT 6** | Semver, backward-compatible APIs, graceful deprecation with a migration window — because the agent feels no obligation to callers it can't see and will delete an interface in place. |
| evolve | `dependencies-kept-current` | **SHIFT 6** | Continuous small dependency upgrades, EOL dates tracked and migrated before — because the agent has no hygiene instinct and will let a framework rot into an emergency migration. |
| continuity | `knowledge-and-living-docs` | **SHIFT 7** | Bus factor lowered into durable artifacts (the stateless agent's only continuity); docs kept living — because the agent both rots the docs and then trusts the stale ones as fact, misleading its own next session. |
| continuity | `legacy-and-sunset-planned` | **SHIFT 2**, SHIFT 1 | Legacy worked under characterization tests; large migration via strangler-fig (not big-bang); retirement on a plan — the system-scale form of "incremental over rewrite," and the end of the life arc Frame placed it on. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — rewrite or refactor, carry the debt or pay it, deprecate or break, keep the system or retire it — climb one rung at a time rather than guessing silently (guessing is exactly the move an agent makes, and on a long-lived system the wrong guess compounds for years):

```
pick the DEFAULT for a clearly low-stakes, reversible maintenance choice
   → wrapped: make the change reversible and small (a refactor under test you can revert, a deprecation you can extend)
      → test it: pin the behavior with characterization tests / a reproducing test, so the change is provably safe before you lean on it
         → ask the user one sharp question — they hold authority on debt tolerance, on what an API break costs their callers,
           and on whether a system is worth maintaining or should be retired (the SHIFT 2 rewrite fork, the SHIFT 3 debt budget,
           the SHIFT 6 break-vs-deprecate call, and the keep-vs-retire decision all bottom out here)
            → if still unresolved, default to the move that keeps the next change CHEAPER and more reversible (refactor over rewrite,
              deprecate over break, log the debt over hiding it) and note the residual as maintenance risk for the user to accept in writing.
```

The asymmetry that governs the whole ladder: **an over-cautious maintenance choice costs the agent some minutes; a reckless rewrite, an un-logged debt, or a silent API break costs years of compounding expense the agent will have booked as a finished task.** When the call is genuinely a toss-up, err toward the smaller, reversible, better-understood change. See [decision-tree.md](decision-tree.md) for sizing the care to the system's stage of life and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

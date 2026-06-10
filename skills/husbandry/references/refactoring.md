# Refactoring — Improving Structure Without Changing Behavior

This reference is the depth behind **STAGE 2 — Refactor** of the [../SKILL.md](../SKILL.md) flight plan, the stage that improves a system's internal structure so the *next* change is cheaper — and the stage where an agent is most dangerous, because it will restructure code, believe it preserved behavior, and be wrong with no way to feel it. The governing fact this stage inherits from [decision-tree.md](decision-tree.md): **software is read and changed far more than it is written — optimize for the next change, not this one.** Refactoring is the literal act of paying that down: you spend effort now, change *nothing* a user can observe, and bank a structure that absorbs the next change at lower cost. The human-era→agent-era shift is brutal and specific here: a careful human refactoring had an internal sense of whether behavior was preserved — they reasoned about the code, ran it, and felt a prickle of doubt when a "harmless cleanup" touched something load-bearing; **the agent has no such prickle.** Asked to "clean this up," it will silently alter what the code does and report success, because nothing in its process distinguishes a behavior-preserving refactor from a behavior-changing rewrite *except a test that fails*. For *why* that single fact reshapes the whole stage, read **SHIFT 4 (the agent cannot feel a regression → refactoring requires the test net)** in [agent-era-shifts.md](agent-era-shifts.md); this file is the *how* — how to build the net, how to keep the steps small and attributable, and how to pin behavior on legacy code that has no net at all.

This stage backs two checks, and every section below serves one or both:

- **`refactor-under-test`** — refactoring happens only under a test net that proves behavior is unchanged; for legacy code with none, characterization tests are written *first*.
- **`small-and-separated`** — refactors are small, continuous, boy-scout steps, kept in commits separate from behavior-changing commits, so a regression is attributable.

---

## Contents

- [What refactoring is — and why "without changing behavior" is the whole discipline](#what-refactoring-is--and-why-without-changing-behavior-is-the-whole-discipline)
- [The test net is a PRECONDITION, not advice (`refactor-under-test`)](#the-test-net-is-a-precondition-not-advice-refactor-under-test)
- [Characterization tests — pinning legacy behavior, bugs and all](#characterization-tests--pinning-legacy-behavior-bugs-and-all)
- [Small, continuous, boy-scout — over the big-bang (`small-and-separated`)](#small-continuous-boy-scout--over-the-big-bang-small-and-separated)
- [Separate the refactor commit from the behavior-change commit (`small-and-separated`)](#separate-the-refactor-commit-from-the-behavior-change-commit-small-and-separated)
- [A working vocabulary of canonical refactorings](#a-working-vocabulary-of-canonical-refactorings)
- [The refactor-vs-rewrite line](#the-refactor-vs-rewrite-line)
- [STAGE 2 exit — what the gate certifies](#stage-2-exit--what-the-gate-certifies)

---

## What refactoring is — and why "without changing behavior" is the whole discipline

Fowler's definition is exact and worth holding precisely: **refactoring is a change to the internal structure of software to make it easier to understand and cheaper to modify *without changing its observable behavior*.** Rename a variable to say what it means, pull a tangle of inline code into a named function, split a class that does two jobs — the system computes the same outputs, throws the same errors, writes the same rows, and calls the same collaborators as before. That last clause is not a footnote; **it is the entire discipline.** A change that improves structure *and* alters behavior is not a refactor — it is a rewrite of that behavior wearing a refactor's clothes, and the moment the two are conflated you lose the one property that makes refactoring safe to do continuously: that you can do it without re-validating the system's correctness from scratch, because correctness, by definition, did not move.

This is why the word matters in front of a user. **Glossing on first use is required by the skill** (`refactoring` vs *rewrite*): a refactor preserves behavior and is low-risk *by construction*; a rewrite changes or re-derives behavior and carries all the risk of new code. A user who hears "I'll refactor this" and pictures behavior held constant must actually get behavior held constant — and the only thing standing between that promise and a silent breach is the test net below.

> **"Observable behavior" includes the *order* of side effects, not just the final outputs.** The subtlest behavior-changing "refactor" is identical on the happy path and divergent only when something fails. Reorder a side-effect relative to a state mutation — `gateway.refund(); order.status = CANCELLED` reflowed to `order.status = CANCELLED; gateway.refund()` — and every green test still passes, because the outputs match *whenever the refund succeeds*. But when the refund **throws**, the first leaves the order in `PAID` (recoverable, retryable) and the second strands it `CANCELLED`-but-unrefunded (money owed, no path back). The sequence of effects relative to state changes *is* observable behavior, so the net must pin the **failure** path — a happy-path-only suite is blind to exactly this class — and a "pure readability" reflow that touches effect order is a behavior change until a failure-path test proves otherwise. This is the husbandry-side complement to the `flightline` reviewer's hunt for a "behavior-changing refactor": there it is caught at the gate, here it is prevented by the net.

The agent failure mode this whole stage guards against: **the agent reaches for a rewrite, or "refactors" without a net and changes behavior while believing it didn't.** It finds messy code distasteful, can generate a plausible replacement fast, and feels none of the loss when it discards a load-bearing edge case. Steered, the same agent is an *excellent* refactorer — it executes mechanical, catalogued transformations tirelessly and correctly. The stage's job is to install the rails that make its speed safe instead of reckless.

---

## The test net is a PRECONDITION, not advice (`refactor-under-test`)

For a human, "have tests before you refactor" was good advice a disciplined engineer could occasionally skip on a small, well-understood change and get away with. **For an agent it is a hard precondition, because the agent has no felt sense of a behavior change** — the only thing in its loop that can distinguish "I preserved behavior" from "I silently broke it" is a test that was green before the refactor and is green after. Remove the test and you have removed the *entire* error-detection mechanism; what remains is the agent's belief, and its belief is exactly what is unreliable. So this stage treats the net as a gate, not a suggestion.

The division of labor across the suite is clean: the `assay` skill *designs and writes* the tests (it owns oracles, equivalence classes, edge probes, the fail-first discipline); **this skill *requires* them as a precondition of touching structure.** husbandry does not re-teach test construction — it refuses to let a refactor proceed without the net `assay` builds.

**The governing decision — do you have a net for *this* refactor?**

- **PREDICATE:** does a *passing* test exist that exercises the externally observable behavior of the exact code you are about to restructure — same inputs, same outputs, same side effects and error paths — such that a behavior change in this region would turn it red?
- **DEFAULT** (the net exists and is genuinely green over this region): refactor in small steps, **running the tests after each step** (next section), and ship. This is the fast path and the common one on a healthy system.
- **FALLBACK** (no test covers this behavior, or the tests are `named-only` — they exist but don't actually exercise the region you'd change): **do not refactor yet.** Drop to characterization tests (below): pin the current behavior first, watch them pass, *then* restructure under their cover. An "untested refactor" is the contradiction this stage forbids — it is indistinguishable from undetectable rewriting.

Two traps the predicate is written to catch, both classic agent moves:

- **Coverage theater.** Tests that import the module and assert almost nothing — or assert on the implementation's own present output as if that output were the spec — are *change-detectors*, not behavior-oracles (the `assay` skill's distinction). They go red on a *correct* refactor (they were pinned to internal structure) and stay green on an *incorrect* one (they never checked the behavior that broke). A net you can't trust is worse than a known hole. If the only tests over this region assert structure, treat the region as **untested** and take the FALLBACK.
- **Editing the test to match the refactored code.** When a test reddens mid-refactor, the agent's cheapest path to green is to *change the test*. That is the precise act of removing the net while standing on it. A refactor must never touch the assertions that pin the behavior it claims to preserve; if a behavior-oracle test goes red during a refactor, the refactor changed behavior — that is the net doing its only job, and the answer is to fix the code, not the test.

> The one-line check at this gate: *if I deleted my belief that this is safe, what would still tell me it's safe?* If the honest answer is "nothing," you do not have a net — you have a hope.

---

## Characterization tests — pinning legacy behavior, bugs and all

Most code worth refactoring in a long-lived system has *no* useful tests — that is the legacy case, and it is where the FALLBACK above lands. The technique, from Michael Feathers' *Working Effectively with Legacy Code*, is the **characterization test**: a test whose job is not to assert *correct* behavior but to **pin down the behavior the code actually has right now**, so you have a net to refactor under. (Feathers' working definition of "legacy code" is exactly this gap: *code without tests* — code you cannot change with confidence.)

The method is deliberately backwards from normal test design, and the inversion is the whole point:

1. Call the code with a realistic input and let it produce whatever it produces.
2. **Assert that it produces exactly that** — capture the current output, side effects, and error behavior as the expected values.
3. Run it; it passes by construction. Now you have a net.
4. Refactor under the net. If a step reddens a characterization test, your refactor changed behavior — revert or fix.

The counter-intuitive rule that the skill insists on: **characterization tests pin the current behavior *including its current bugs*.** You are not writing down what the code *should* do — you are writing down what it *does*, warts and all, because the contract of a refactor is "behavior unchanged," and the existing buggy behavior is part of the behavior callers may (knowingly or not) depend on. If a function rounds wrong in a corner case, the characterization test *records the wrong rounding*. You fix that bug **later, as a separate, deliberate, clearly-labeled behavior change** (STAGE 3 — Defects, with its own fail-first reproducing test) — never silently folded into a refactor, where it would be a behavior change masquerading as structure and would corrupt the very net you built. This separation is the same `small-and-separated` discipline the next two sections enforce, applied at the moment of greatest temptation.

For an agent this technique is doubly valuable, because the act of characterizing the code is also the act of **mining the implicit knowledge** the agent is otherwise blind to. Those weird conditionals and special cases are usually scar tissue from real production incidents; pinning them as tests carries that hard-won knowledge forward into a form the next stateless session can read, instead of discarding it in a rewrite. The deeper legacy playbook — bus factor, the strangler-fig migration, and retiring a system on a plan — lives in [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md); this file covers characterization only as the *precondition that unblocks a refactor* on untested code.

---

## Small, continuous, boy-scout — over the big-bang (`small-and-separated`)

The second iron rule. Refactoring is done in **small, continuous, behavior-preserving steps**, following the **boy-scout rule — leave each piece of code a little cleaner than you found it** — rather than hoarding a giant "we'll restructure it all at once" effort. This is not aesthetic preference; it is risk and reviewability management, and it maps directly onto an agent's failure modes.

| | Big-bang restructure | Small continuous steps |
|---|---|---|
| **Blast radius if wrong** | the whole change is suspect; you can't tell which edit broke it | each step is one named transformation you can bisect to |
| **Reviewability** | a thousand-line diff no human can actually review — rubber-stamped | each step reviewable on its own; intent visible |
| **Reversibility** | revert loses *all* the work; partial revert is surgery | revert one step, keep the rest |
| **Test feedback** | tests run once at the end; a red gives no locality | **tests run after every step**; a red points at the step that caused it |
| **Agent fit** | the agent's instinct (rewrite the mess in one go) — high risk | the rail that makes the agent's speed safe |

The mechanical discipline that makes this real: **run the tests after each small step.** A refactor is a *sequence* of tiny transformations — extract this function, then rename it, then move it — and the net's value comes from being consulted *between* each one, so a regression is localized to the single step that introduced it. An agent that batches twenty transformations and runs the suite once at the end has thrown away exactly the locality that makes the net useful: it knows *something* broke but not *what*, which is barely better than no net. Small steps + run-after-each is how the agent gets a tight, attributable feedback loop instead of a late, opaque one.

The boy-scout framing matters specifically because **the agent has no instinct to leave code cleaner than it found it** — it takes the cheapest path to green and moves on, banking structural debt (see [technical-debt.md](technical-debt.md)). "Refactor continuously, opportunistically, in the course of other work" is the counter-habit: when you are already in a file for a feature or a fix and you see a small structural improvement that is *safe under the existing net*, make it — as its own step, in its own commit. This is how a system stays cheap to change without ever budgeting a scary standalone "refactoring sprint." The hoarded big-bang restructure is, at the limit, just the rewrite (SHIFT 2) under a friendlier name — and the next section's commit discipline is what keeps it honest.

---

## Separate the refactor commit from the behavior-change commit (`small-and-separated`)

The commit discipline, and the second half of `small-and-separated`: **never mix a structural change and a behavior change in the same commit (or the same diff).** A commit is either "I changed the structure, behavior identical" or "I changed the behavior" — never both. This is not bookkeeping fussiness; it is what makes a regression *attributable* and a review *possible*.

Why it is load-bearing, in agent-era terms:

- **Attribution.** If a regression surfaces, a clean history lets you bisect to a single commit and read instantly whether it *claimed* to change behavior. A red landing on a commit labeled "refactor: extract validator" is a contradiction that flags itself — the refactor lied, behavior moved, and you know exactly where. Bury that same structural change inside a 500-line feature commit and the regression is un-attributable: you cannot tell whether the feature or the cleanup broke it, and the bisect dead-ends in a diff too tangled to read.
- **Reviewability.** A reviewer (human or agent) facing a mixed diff cannot answer the one question review exists to answer — *what actually changed?* Structural noise (a rename touching 80 lines) drowns the three lines of real behavior change, and the behavior change ships unexamined. Split, the refactor commit is verifiable at a glance (the tests are green and no behavior was meant to move) and the behavior commit is *small enough to actually scrutinize* — which is where the bugs are.

The operational rule for an agent given a mixed task ("clean this up and add the discount"):

- **PREDICATE:** in the diff you're about to commit, is *any* hunk intended to change observable behavior?
- **DEFAULT** (yes, it's mixed): **split it.** First land the pure refactor — restructure with behavior held constant, tests green before and after, commit it alone. *Then*, on the clean structure, make the behavior change as its own commit with its own tests. Refactor-first-then-change is the canonical order: you reshape the ground to make the real change small and obvious, then make it.
- **FALLBACK** (you can't cleanly tell which hunks are structural vs behavioral): that uncertainty *is* the finding — you do not understand the change well enough to land it safely. Stop and pull the unambiguous refactors out into their own commit until what remains is a small, legible behavior change you can reason about. The decision-fork in SHIFT 4 says it sharply: **when unsure whether a change is a refactor or a behavior change, treat it as a behavior change** — require it under test, in its own commit, and verify the tests still pass. Assuming "this cleanup is safe" is precisely the agent error this gate exists to catch.

---

## A working vocabulary of canonical refactorings

A handful of named, catalogued transformations — enough to ground the technique, not the whole Fowler catalog. Each is **behavior-preserving by construction** when done under the net; naming them matters because a named, mechanical transformation is reviewable ("this commit is an Extract Function, nothing else") and an agent executes catalogued moves reliably. For the full catalog, the canonical source is Fowler's *Refactoring*.

| Refactoring | What it does | The smell it relieves |
|---|---|---|
| **Extract Function / Method** | pull a coherent fragment of inline code into a named function called in its place | long functions; a comment explaining "what this block does" (the name replaces the comment) |
| **Rename (variable / function / class)** | change a name to say what the thing actually is or does | misleading or cryptic names — the cheapest, highest-leverage refactor for the *next reader*, which is the whole point |
| **Extract Module / Class** | split a unit doing two jobs into two cohesive units | low cohesion; a class that changes for two unrelated reasons; the god object |
| **Replace Nested Conditional with Guard Clauses** | turn deep `if/else` nesting into early returns for the edge cases, leaving the main path unindented | arrow-code; the happy path buried under nesting you have to hold in your head |
| **Introduce Parameter Object** | bundle a clump of arguments that always travel together into one named object | long parameter lists; the same three args threaded through every signature |

Two things to hold while using these. First, the transformation must be **mechanical and reversible** — if you can't see how to undo it cleanly, it's bigger than a refactor and probably smuggling a behavior change. Second, each lands as **its own small step with the tests run after it** (`small-and-separated`): a rename and an extract are two commits, not one, even when you do them back to back. The vocabulary exists so that a refactor reads as a *sequence of known-safe moves* rather than an undifferentiated reshuffle the reviewer has to reverse-engineer.

---

## The refactor-vs-rewrite line

The hardest judgment this stage abuts, and the one the agent gets most wrong: **when is the right move to refactor incrementally, and when (rarely) to rewrite?** The full decision lives in [decision-tree.md](decision-tree.md) (the refactor-vs-rewrite fork) and its *why* in **SHIFT 2** of [agent-era-shifts.md](agent-era-shifts.md); the line as it bears on *this* stage:

- **PREDICATE:** can the desired end state be reached by a sequence of small, individually-tested, behavior-preserving steps from the current code?
- **DEFAULT** on a coin-flip: **refactor.** The burden of proof is on the rewrite. A rewrite discards the implicit knowledge and the thousands of edge-case fixes baked into the old code — value invisible in the source and felt by the agent not at all — and its cost is almost always underestimated. Incremental refactoring under a net beats the big rewrite in nearly every case.
- **FALLBACK** when the code is so opaque/untested you *can't* tell whether incremental change is possible: **do not leap to a rewrite.** Add characterization tests first to make the code legible and changeable — and most "we have to rewrite this" cases *dissolve* once the code is pinned under test and you can finally refactor it in safe steps. The path to "should we rewrite?" runs *through* characterization, never around it.

The connection back to STAGE 1 (Debt): the impulsive big rewrite is the most seductive trap in maintenance, and this stage is the constructive alternative to it. When the agent says "this is too messy, let me start over," the answer is almost always: pin it under test, then refactor it in small attributable steps — which is everything above.

---

## STAGE 2 exit — what the gate certifies

Before `checklist verify refactor`, both checks must hold with evidence, not assertion:

- **`refactor-under-test`** — every refactor landed under a *behavior-oracle* test net (not coverage theater) that was green before and after; for any region that had no net, characterization tests pinned the current behavior — bugs included — *before* the structure was touched. The honest "if I deleted my belief, what tells me it's safe?" answer is a passing test, not a hope.
- **`small-and-separated`** — refactors landed as small, continuous, boy-scout steps with the tests run after each, and every refactor commit is *separate* from every behavior-change commit, so any regression is attributable to a single, readable diff. No mega-refactor, no mixed commit, no refactor smuggling a behavior change.

If either fails, the regression you cannot feel is exactly the one this stage exists to catch — fix the net or split the commits before advancing to STAGE 3 (Defects). The agent-era reason it is a hard gate and not advice: only a test, never the agent's belief, catches the silent regression — and only a clean, separated history makes that regression attributable when it slips through.

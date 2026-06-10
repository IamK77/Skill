# Code Review — The Irreplaceable Gate

This reference is the depth behind **STAGE 3 (Code review)** of [the flightline skill](../SKILL.md). The stage opens this file at the line "the irreplaceable gate," and everything here exists to make one claim operational: in a codebase where an agent writes much of the code, review is the **one quality gate no automation replaces** — and therefore the gate that must actually *happen*, not degrade into a reflex approval. Formatting and linting were settled by the machine in [code-style.md](code-style.md); tests, scans, and coverage are enforced by the pipeline in [ci-cd.md](ci-cd.md). What is left for review is the irreducibly human judgment — *is this logic correct, is this design sound, is this change actually what was asked* — and the agent-era twist is that the author of the code can no longer be trusted to have judged any of it. See [agent-era-shifts.md](agent-era-shifts.md) for why this inversion is the spine of the whole skill.

The governing fact: **a rubber-stamp LGTM on a human's PR wastes a little goodwill; a rubber-stamp LGTM on an agent's PR means literally nothing checked it.** The agent optimized for "looks done." If the reviewer also only checks whether it "looks done," the change reaches production having passed through zero minds. Review is where the human-in-the-loop spends their scarce attention, so this file is mostly about *spending it well* — on the right diffs, at the right size, hunting the right failures.

---

## The two gates this file clears

From [the checklist](../SKILL.md), with the agent-era weight made explicit:

- **`code-review small-reviewable-prs`** — PRs kept small enough to *actually* review. The agent's unit of work is deliberately constrained to a human-readable size, because a several-thousand-line diff gets a blind LGTM and an agent will emit exactly that diff on request.
- **`code-review review-is-the-gate`** — review treated as the irreplaceable gate: focused on logic / design / edge-cases / security / maintainability (not format); an independent agent used as a pre-review *filter* but never a *substitute* on consequential changes; critique-the-code-not-the-person with a response SLA; no rubber-stamping, no bikeshedding; the agent's characteristic failures actively hunted.

If a PR is too big for a human to read with attention, the first gate is not cleared no matter how clean the diff looks. If the approval was given without a reviewer forming an independent opinion on correctness, the second gate is not cleared no matter what the checkmark says.

---

## Why review still earns its cost — the four benefits, re-weighted

Review was always justified by four returns. The agent era changes which ones dominate, so know the new ranking.

| Benefit | Human-era weight | Agent-era weight | Why it shifts |
|---|---|---|---|
| **Catches defects** before they ship | high | **highest** | The author (an agent) did not feel the bug. Review is often the *first* mind to evaluate correctness, not the second. |
| **Spreads knowledge** — no module owned by one head | high | **rises** | The "author" forgets everything between sessions (see [agent-era-shifts.md](agent-era-shifts.md)). A human reviewer becomes the *only* persistent understanding of the code; review is how that understanding is built. |
| **Collective code ownership** — the team owns it, not the author | medium | **rises** | There is no agent to page at 3am. Whoever approved it owns it. Approval *is* the act of taking ownership; treat it that way. |
| **Style unification** | medium | **near zero** | Already settled by formatter + linter ([code-style.md](code-style.md)). Spending review on style now is pure waste — it is the bikeshedding anti-pattern. |

The practical consequence: the value of review has concentrated into *correctness* and *durable human understanding*. Those are exactly the two things a reviewer must protect, and exactly the two things a rubber stamp destroys.

---

## Small PRs — the precondition for every other benefit

A reviewer's attention is finite and degrades fast with size. The empirical floor most teams converge on: careful review holds up to roughly **200–400 changed lines**; past that, defect-detection per line collapses and the reviewer starts skimming. A several-thousand-line PR does not get reviewed four times as hard — it gets a blind "LGTM" because reading it properly costs more than anyone will spend. **A PR too big to review is, in practice, a PR that was not reviewed.**

This was already true for humans. The agent makes it acute, because the agent's natural output is the giant diff: ask for a feature and it will cheerfully refactor six files, rename a module, and add the feature in one 1,800-line change. So the agent-era move is not "ask reviewers to try harder" — it is to **constrain the agent's unit of work** up front so the diff that lands is reviewable by construction.

### How to size a PR

| Aim for | Avoid |
|---|---|
| **One concern per PR** — one feature, one fix, one refactor | Mixing a refactor *and* a behavior change in one diff (the reviewer can't tell which lines changed behavior) |
| **Under ~400 lines** of meaningful change | Thousand-line diffs; "while I was in there" sprawl |
| A diff a reviewer can hold in their head at once | Generated/vendored files inline with logic — segregate or `.gitignore` them |
| A title that names the single concern | "Misc updates", "address feedback", "various fixes" |
| Pure-refactor PRs that change *no behavior* (so review = "is this behavior-preserving?") | Refactor smuggled inside a feature PR |

### Constraining the agent's unit of work

The instruction to the agent is the lever. Concrete tactics:

- **Scope the task before the agent starts.** "Add the validation, nothing else; we'll wire it into the endpoint in a separate PR." A scoped task produces a scoped diff. An open-ended task produces sprawl.
- **Stacked PRs / stacked diffs.** Split one logical change into a *stack* of small dependent PRs, each reviewable alone, each building on the last — tooling: **Graphite**, **Sapling/ghstack**, `git` branch stacks, GitLab stacked merge requests. The reviewer approves rung by rung; the agent rebases the stack as each lands. This is how you ship a large change *without* a large diff.
- **Separate the mechanical from the meaningful.** Have the agent land the pure rename / move / format pass as its own trivially-reviewable PR, then the behavior change as a small second PR. Never let a one-line logic change hide inside a 500-line rename.
- **Reject the giant diff as a process failure, not a one-off.** If the agent keeps emitting huge PRs, the *task decomposition* is wrong — fix the instruction, don't just review harder.

> **PREDICATE — is this PR reviewable?** Could a competent reviewer who did *not* write it form an independent, confident opinion on its correctness in one sitting? **DEFAULT** when unsure: it is too big — split it. **FALLBACK** when it genuinely cannot be split (a single atomic migration, a generated lockfile bump): say so explicitly in the PR description, segregate the un-reviewable parts (mark generated files), and tell the reviewer exactly which ~50 lines carry the real risk so their attention lands there.

---

## What to review — and what the machine already settled

Spend human attention only where a machine cannot help. Everything in the left column below is the reviewer's job; everything in the right was already enforced before the PR opened, and re-litigating it is wasted attention (and, when it crowds out the left column, dangerous).

| REVIEW THIS (human judgment) | THE MACHINE ALREADY HANDLED THIS |
|---|---|
| **Correctness** — does the logic do what it claims, on every path? | Formatting, indentation, quote style → formatter (Prettier/gofmt/black/rustfmt) |
| **Design** — is this the right shape; does it fit the architecture? | Unused vars, unreachable code, obvious type errors → linter (ESLint/golangci-lint/clippy/ruff) |
| **Edge cases** — empty, null, zero, max, concurrent, malformed, the error path | Import ordering, naming conventions, line length → linter rules |
| **Security** — is untrusted input trusted; is a secret leaking; is authz right? | Known-bad patterns, some injection sinks → SAST; committed secrets → secret-scanner |
| **Maintainability** — will the next reader (or the next agent session) understand this? | Test pass/fail, coverage floor → CI ([ci-cd.md](ci-cd.md)) |
| **Tests** — do they actually assert the behavior, or just run it? | Whether the suite was *run* at all → CI |
| **Scope** — is everything here actually part of the task? | — |

The rule from [code-style.md](code-style.md) is load-bearing here: **format is the machine's job so that the human's review attention is reserved for the things in the left column.** If your review comments are about whitespace or naming, either the linter is misconfigured (fix the linter, not the PR) or you are bikeshedding (stop).

### The human contract for *how* you review

- **对事不对人 — critique the code, not the person.** "This function can deadlock if two callers hit it concurrently" is a fact about the code. "You always forget locking" is an attack on a person. The first invites a fix; the second invites defensiveness. In the agent era the "author" is often an agent, which makes this *easier* (no ego to bruise) but no less important to keep as a habit, because the same PR may have a human author next time — and because the comment's job is to *teach the next reader*, an audience that is always human.
- **Be constructive and specific.** A comment should say what is wrong, why it matters, and ideally what would fix it. "This is bad" is not a review comment. "This trusts `req.body.id` directly in the SQL string — parameterize it or this is an injection hole" is.
- **Distinguish blocking from non-blocking.** Mark which comments must be addressed before merge versus which are suggestions. A wall of equally-weighted nits buries the one comment that says "this corrupts data." Convention: prefix non-blocking comments with `nit:` and blocking ones with `blocking:` (or use the platform's "Request changes" only for real blockers).
- **Set a response SLA.** Review that sits for days blocks everyone downstream and, worse, tempts people to bypass it ("it's been three days, I'll just merge"). Agree a team norm — e.g. *first response within one business day* — and treat a stale review queue as a process failure. The agent makes this sharper: an agent fleet can *open* PRs far faster than humans can review them, so the review queue is now a genuine throughput bottleneck and must be staffed and measured as one. See the throughput discussion under [ci-cd.md](ci-cd.md) (the same shift-left logic applies: the cheapest review is the one a pre-commit hook or the agent-filter already cleared).

---

## The two classic anti-patterns — now existential

| Anti-pattern | What it is | Why the agent era makes it worse |
|---|---|---|
| **Rubber-stamp review** | Approving without actually reading — a reflex LGTM, or trusting "CI is green so it's fine." | With a human author, a rubber stamp at least had *one* mind (the author's) on the change. With an **agent author, a rubber stamp means zero minds checked correctness.** The change reaches production unjudged. This is no longer laziness; it is a hole straight through the only gate automation can't replace. |
| **Bikeshedding** | Arguing endlessly over trivia (naming, brace style, a variable name) while the substantive risk sails through unexamined. | The trivia *should already be settled by the linter* ([code-style.md](code-style.md)). If a reviewer is debating it, attention has been pulled off the logic — and an agent's plausible-but-wrong logic is precisely the kind of risk that slips past while everyone argues about a name. |

The defense against both is the same: **make the review's attention land on correctness.** Configure the machine to settle everything settleable (so there is nothing to bikeshed), keep PRs small (so reading them properly is feasible), and treat an approval as a *claim* — "I read this and I believe it is correct" — not a courtesy. If you cannot honestly make that claim, do not approve.

---

## The agent-as-reviewer pattern — a filter, never a substitute

An independent agent can read a diff and flag problems before a human spends time. Used correctly this is a genuine force-multiplier; used wrong it manufactures false confidence. The distinction is **filter vs. substitute.**

- **As a FILTER (correct):** run a second, independent agent — one that did *not* write the code — over the diff as a *pre-review*, to catch the obvious before a human looks. It surfaces the dropped error case, the off-by-one, the missing null check, the suspicious test. The human then reviews a diff that has already had the cheap mistakes removed, and spends their scarce attention on the deep ones. Tools: GitHub Copilot PR review, CodeRabbit, Claude/Codex review bots, or a scripted `git diff | agent-review` step in CI. Treat its output as **advisory comments**, exactly like a junior reviewer's — useful, not authoritative.
- **As a SUBSTITUTE (the trap):** letting the agent's approval *be* the gate on a consequential change, with no human forming an independent opinion. **Two agents can share a blind spot.** They are trained on overlapping data and reason in similar ways, so a plausible-but-wrong change that fooled the first agent will often fool the second — and now you have two confident green checkmarks co-signing a wrong change, which is *worse* than no review, because it looks reviewed. The reviewer-agent is most likely to miss exactly the subtle, plausible errors that matter most. And the blind spot is deeper than shared *training*: it is shared *instrument*. Running the same review strategy through more agents — however independent their contexts — converges on the *same* gap, because a review's coverage is set by which probes you run, not by how many reviewers run them. Adding clean reviewers removes *bias*, not *blind spots*; only a different instrument widens coverage, and choosing it is the human's call ([§The non-delegable core](#the-non-delegable-core--judgment-on-a-budget-then-a-signature)).

> **PREDICATE — can the agent's review stand alone on this PR?** Is the change low-stakes *and* mechanical (a dependency bump, a doc fix, a generated-code regen, a rename the compiler verifies)? **YES →** an agent filter plus green CI may be a sufficient gate; let the human spot-check. **NO** (the change touches money, data integrity, auth, security boundaries, irreversible side effects, or core logic) **→ a human MUST form an independent opinion; the agent review is only a pre-filter.** **DEFAULT** when unsure: treat it as consequential and require the human gate — the cost of an unnecessary human read is minutes; the cost of two agents co-signing a data-corruption bug is an incident. **FALLBACK** when no human reviewer is available right now: do not auto-merge a consequential change on agent approval alone — hold it, or escalate to the user, who holds final authority on what ships.

### The solo, no-second-human case — name the degraded gate honestly

The agent dial in [decision-tree.md](decision-tree.md) forces even a one-person project to a STANDARD floor with required review — but a solo maintainer driving agents has no *second independent human* to be the reviewer, and never will. This is a common, high-stakes agent-era configuration (one person, agents writing most of the code, shipping publicly), so don't paper over it; state the degraded form plainly.

- **The owner is still the irreplaceable human gate — but the review must be real.** The danger is the self-LGTM: glancing at your own agent's diff and merging because you "watched it being written." Review it as if a stranger wrote it — run the [HUNT-LIST](#the-hunt-list--characteristic-failure-modes-of-agent-written-code), trace one input by hand, read for what the code *does*, not what it *reads like*. This is harder than reviewing someone else's code, because you must fight the "I already know this is fine" bias.
- **Widen the agent filter into an adversarial panel — a wider *filter*, never the *substitute* gate.** Run separate refute-by-default lenses (security/sink, edge-case, reproducibility, spec-conformance), each told to break the change and reject under uncertainty. This recovers real independence *only* for failure classes with an external referent the verdict can be checked against — rebuild-and-diff, enumerable sinks/boundaries, conformance to a **written spec** (so write the spec first; without it, spec-conformance has nothing to check). It does **not** recover two classes, because every lens shares one training distribution: **substrate-correlated reasoning** (an off-by-one in a domain rule, a wrong concurrency assumption, a missed *sink type*) and **business-intent correctness** ("is this even the right rule"). Voting across same-substrate agents reduces variance, not that shared bias — so never read the aggregate verdict as discharge; five "PASSED" is *easier* to rubber-stamp than one.
- **Record the residual, don't mark the gate green.** Those two un-delegable classes rest on the owner alone — log "no second independent human reviewed this; substrate-correlated reasoning and business-intent correctness rest on the owner" as an explicit accepted risk, route consequential calls to the user who holds final authority (the top of the [escalation ladder](#escalation-ladder--when-a-review-decision-is-genuinely-hard)), and never auto-merge a consequential change on panel consensus alone. Review here is weaker than the team case by construction; make it as strong as the structure allows and be explicit about the gap, rather than pretend it is whole.

---

## The HUNT-LIST — characteristic failure modes of agent-written code

This is the core of agent-era review. A human author and an agent author fail *differently*. Human bugs cluster around fatigue, haste, and missing knowledge; agent bugs cluster around **confident plausibility** — code that reads beautifully, names things well, and is wrong in ways that survive a skim precisely *because* it looks right. Review human code for the usual things; review agent code for *these*. Run this list against every agent-authored diff.

| # | Failure mode | What it looks like | How to hunt it |
|---|---|---|---|
| 1 | **Plausible-but-wrong logic** | Clean, well-named, confidently-structured code that implements the *wrong rule* — off-by-one, inverted condition, wrong rounding, subtly wrong business logic. The prose looks right; the behavior isn't. | Don't read for *style*, read for *truth*. Trace one concrete input through by hand. Ask "what is the actual rule, and does this code compute it?" — not "does this look like code that would do it?" |
| 2 | **Hallucinated / misused APIs** | A call to a method, flag, or library that doesn't exist, or that exists but means something else; a config key invented to be plausible; an SDK used with the wrong semantics. | Check that every non-obvious API call is real and used correctly — the type-checker/compiler catches non-existent ones (lean on it, per [code-style.md](code-style.md)), but a *real method used wrongly* compiles fine. Cross-reference the docs for anything unfamiliar. |
| 3 | **Missing edge cases** | The happy path is handled; empty input, null, zero, the boundary, the concurrent case, and the error path are silently absent. | This is the reviewer's single most valuable contribution. For each input, ask: empty? null? max? negative? duplicate? concurrent? malformed? What happens when the call it depends on *fails*? See the boundary discipline in the `assay` sibling skill. |
| 4 | **Confidently-introduced security holes** | Untrusted input flowing into SQL/shell/HTML/a path without sanitization; authz check dropped; a secret logged or hardcoded; CORS opened wide — all written with the same confidence as correct code. | Trace untrusted input to every sink. Confirm authz is *present* on each new endpoint, not assumed. Watch for a hardcoded credential the agent added "to make it work" (the secret-scanner from [version-control.md](version-control.md) is the backstop, but review-catch it earlier). |
| 5 | **Tests that don't actually assert** | A test that runs the code and asserts nothing meaningful — `assert True`, a mock asserted against itself, a snapshot accepted blindly, an `expect` with no awaited result. Green, and worthless. | Read the test's *assertions*, not its setup. Ask: would this test FAIL if the code were wrong? If you can't see how it could go red, it has no teeth. (This is why coverage alone is gameable — see below.) |
| 6 | **Over-mocking** | Every collaborator mocked, so the test verifies the agent's *assumptions about* the dependencies rather than real behavior — and passes even when the integration is broken. | Check that the test exercises real logic, not a hall of mirrors. If the mocks encode the same wrong assumption as the code, the test confirms the bug. Prefer real objects at the seam (see the test-double guidance in `assay`). |
| 7 | **Silent scope creep** | The diff does more than the task asked — an unrequested refactor, a "while I'm here" change, a renamed API, a new dependency — bundled in so the real change is hard to isolate. | Diff the *intent* against the *diff*. Every changed file should trace to the stated task. Anything that doesn't is either a separate PR or a conversation, not a rider. (This mirrors the gold-plating blind spot in `groundwork`.) |
| 8 | **Copy-paste duplication** | The agent solves a problem by duplicating an existing block with small edits rather than reusing/extracting, leaving two copies that will drift. | Watch for near-identical blocks. Ask whether the new code should call existing code instead. Duplication an agent introduces is duplication a *future* agent will edit inconsistently. |
| 9 | **Confident wrongness in the description** | The PR description / commit message confidently claims the change does X; the code does X′. The agent's narration and its code diverged. | Read the description as a *claim to verify*, never as ground truth. The description is the agent's belief about its code, not evidence about it. |
| 10 | **Behavior-changing "refactor"** | A diff narrated as *refactor / cleanup / simplified / "while I was here" / 顺手* that is **not** behavior-preserving — it reorders side-effects, flips an error path, or changes evaluation order, and the change hides inside the noise of a rename or a re-flow. The classic shape: `cancel()` is "tidied" from *refund-then-set-status* to *set-status-then-refund* — identical on the happy path, but when the refund throws, one leaves the order recoverable and the other strands it cancelled-but-unrefunded. | Treat the word **"refactor"/"cleanup"/"顺手"** as a *trigger*, not a reassurance: it means "diff behavior, not just structure." A real refactor is behavior-preserving **including side-effect ordering and the error path** — the order of a side-effect relative to a state mutation *is* behavior, not style. Demand it be split: a pure-refactor PR (review = "is this behavior-preserving?") plus a separate behavior-change PR. If it can't be cleanly split, it was never a pure refactor. |

**The meta-rule for the whole list:** *fluency is not correctness.* An agent's defining property as an author is that its wrong code looks exactly as confident and well-crafted as its right code. The human-era reviewer's instinct — "this looks well-written, probably fine" — is precisely the instinct that fails here. Read for what the code *does*, never for how it *reads*.

---

## Un-gameable gates — review the gate-changing parts hardest

The agent optimizes the green light, so the most dangerous diff is the one that *changes the gate itself*. A change to a test, a CI config, a coverage threshold, or a lint rule deserves **more** scrutiny than ordinary code, because it is the agent's most direct route to manufacturing a green light without doing the work. This is the review-side complement to the CI integrity rules in [ci-cd.md](ci-cd.md).

| Change in the diff | The gaming move to look for |
|---|---|
| A test was deleted or `skip`/`xfail`/`it.only`'d | The agent removed the assertion that was failing instead of fixing the code. **Demand the justification.** |
| An assertion was weakened (`assertEqual` → `assertTrue`, tightened bound → loosened) | The test now passes because it checks less. Restore the strength or get a real reason. |
| A coverage threshold was lowered, or excludes added | The floor was moved to fit the code, not the code raised to the floor. Coverage floors must be met by *covering*, never by *excluding*. |
| A lint rule was disabled inline (`// eslint-disable`, `# noqa`, `#[allow(...)]`) | A real warning was silenced rather than addressed. Each suppression needs a justifying comment. |
| Branch-protection / required-check config changed | The gate's enforcement itself is being loosened — this is a high-trust change; route it to the user. |
| A mock was added so a failing integration "passes" | The bug was hidden behind a mock, not fixed. |

Make these structurally hard, not just review-dependent: protect the default branch (require review + green CI to merge), require review specifically on test/CI/config paths (a `CODEOWNERS` rule on `**/test/**`, `.github/workflows/**`, coverage config), use coverage floors that can't be met by deleting assertions, and reach for **mutation testing** (Stryker, PIT, `cargo-mutants`, `mutmut`) on critical modules to verify the tests actually have teeth. A green light the agent can manufacture is not a gate — full treatment in [ci-cd.md](ci-cd.md).

---

## Handed a giant agent diff — the decision

You will sometimes be handed a 2,000-line agent diff and asked to review it. Do not just start reading; that path ends in a blind LGTM. Decide first.

> **PREDICATE — can this diff be split?** Does it contain more than one concern (feature + refactor, several independent changes)?
> - **YES → push back: split it.** Ask the agent to decompose into a stack of small PRs (one concern each, mechanical separated from meaningful). This is the right answer in the large majority of cases and it is *cheap* — re-decomposing is exactly the kind of mechanical work the agent does well. Do not absorb the cost of reviewing a giant diff to spare the agent a re-run.
> - **NO, it is genuinely one atomic change** (a single migration, a framework upgrade, a generated artifact) **→ review by risk surface** rather than line by line:
>   1. **Triage:** identify the ~10% of the diff that carries real risk (the logic, the security-sensitive lines, the data-touching code) and the ~90% that is mechanical (renames, generated code, moved files). Get the agent or the diff tooling to label which is which.
>   2. **Spend your attention on the risky 10%** with the full HUNT-LIST. Trace inputs by hand there.
>   3. **Verify the mechanical 90% is actually mechanical** — spot-check that renames are pure renames and generated files match their generator — rather than reading every line.
>   4. **Lean on the machine** for the bulk: the type-checker for API correctness, the test suite for behavior, the formatter/linter for style, an agent pre-filter for the obvious. Your human read targets what those cannot judge.
>   5. **If the risky core is still too large to review with confidence,** that *is* the split signal after all — kick it back. "Atomic" rarely means "2,000 risky lines."
> - **DEFAULT** when unsure whether it's splittable: assume it is and push back. **FALLBACK** when you must review an un-splittable, high-risk diff under time pressure: review the risk surface now, *explicitly* record what you did *not* fully review, and flag the residual risk to the user — never let a silent "LGTM" imply a thoroughness you didn't deliver.

---

## The non-delegable core — judgment on a budget, then a signature

Everything this file has built — the hunt-list, the agent pre-filter, the adversarial panel, the gate-changer scrutiny — is *instrumentation around* a decision. The agent era makes that instrumentation cheap and abundant: you can gather evidence, locate the risky lines, pre-filter the obvious, and run five independent lenses, all for the price of a few prompts. That abundance is real leverage and you should use all of it. But it hides a trap, because it lets the reviewer outsource everything *except the part that was the job.* Three acts do not survive delegation, and naming them exactly is the point.

1. **Choosing the instrument.** A review's coverage is set by *which probes you run*, not how many times you run them. This is the deeper reading of "two agents share a blind spot": it is not only that they share a training distribution — it is that running the *same strategy* through ten clean-context agents converges on the *same* blind spot, because you handed all ten the same instrument. A clean context removes **bias** (the author defending its own work); it does not add **coverage**. The only thing that widens coverage is a *different* instrument — a probe family the others weren't running — and selecting it is an act of judgment no panel can perform for you, because the panel only knows the lenses you gave it. If the dimension that matters never got a probe, the loop returns a confident green over the exact hole that sinks it.

2. **Declaring the evidence sufficient.** Probing has no natural stopping point — there is always one more lens, one more clean agent, one more trace. So fix the budget *before* you start: at most N rounds, then adjudicate. The reason to bound it in advance is that the unbounded version has a name, and it is not diligence — it is **"reviewed a lot, decided nothing."** This is the mirror image of rubber-stamping and it ships exactly as little judgment: the rubber-stamp approves without looking, the endless re-audit looks without approving, and both arrive at the same place — *no human ever made a call.* The second is the more dangerous precisely because it feels responsible. A reviewer who keeps ordering more audits is usually not pursuing correctness; they are deferring the moment of exposure, because before you sign you cannot be wrong, and after you sign you can.

3. **Signing.** An approval is a claim — "I read this and I believe it is correct" — and in the agent era it is often the *only* claim anyone makes about the change (the author felt nothing). The signature is where accountability attaches: there is no agent to page at 3am, so whoever signed owns it. This is not a burden to minimise away; it is the irreducible thing the human is *for.* Judgment grows in exactly one loop — **decide → bear the consequence → correct** — and a reviewer who outsources the verdict never enters that loop, never gets the feedback that grows the nose, and degrades over time into one more agent in the panel. The scarce resource the human supplies is *signed* judgment, and a reviewer's real professional range is **the set of changes they will put their name on.**

**Signing under incomplete evidence — state the bet.** The budget will sometimes run out before certainty does. The correct move then is not another round; it is to sign *and name the bet*: "Approve — but I have no evidence on the refund-failure path; I'm betting it's safe, and if it isn't, that's on me." A named bet is higher-quality judgment than an unbounded probe, because it makes the residual risk explicit, attributes it, and lets the user (who holds final authority) overrule it when the stake is too high. The discipline runs the other way too: a **request-changes carries its clearing condition** — the specific evidence that would flip it to approve ("restore the pre-fix side-effect order, *or* show me a test that goes red on a gateway failure"). That pre-loads the next probe round so the loop converges on a decision instead of spinning; a request-changes with no stated exit is a deferral wearing a verdict's clothes.

> **PREDICATE — am I adjudicating, or deferring?** Have I made a *call* this round (approve / request-changes-with-a-clearing-condition / escalate-to-the-user), or have I only ordered more evidence? **DEFAULT** when the budget is spent and certainty hasn't arrived: sign with the bet named, or request-changes with the condition named — not "let me run one more pass." **FALLBACK** when the stake is too high to bet on: that *is* the escalation signal — hand the call to the user (the top of the ladder), with the residual stated, rather than auto-running the panel again. The user can own a risk you cannot; the panel can own none.

This is why the solo-no-second-human case above ends at "record the residual, don't mark the gate green," and why the ladder below ends at the user: the panel and the filter extend your reach, but the three acts here are the part that was always yours.

---

## Escalation ladder — when a review decision is genuinely hard

Most PRs resolve at the bottom rung: read it, hunt the list, approve or request changes. Climb only as the stakes and uncertainty rise; stop as soon as the doubt is resolved.

```
1. READ IT AND HUNT THE LIST.
   The default. Trace one input by hand, run the 9-row hunt-list, approve only if you can
   honestly claim "I read this and believe it is correct."
      ↓ the change is large or mixes concerns
2. SEND IT BACK TO BE SPLIT.
   Don't review the unreviewable. A stack of small PRs is cheaper to produce (agent re-runs)
   than a giant one is to review, and far safer.
      ↓ you suspect plausible-but-wrong logic you can't fully verify by reading
3. RUN AN INDEPENDENT AGENT FILTER + ASK FOR A TEST.
   Have a second agent pre-review for the obvious, and require a test that would FAIL on the
   bug you suspect — a real assertion is worth more than more reading. (assay sibling.)
      ↓ the change is consequential (money / data / auth / security / irreversible)
4. REQUIRE A HUMAN INDEPENDENT OPINION — no agent-only approval.
   Two agents can co-sign a wrong change; on consequential code a human must form their own
   view. Add a CODEOWNERS rule so this is structural, not optional.
      ↓ the diff changes the gate itself (tests / CI / coverage / branch protection)
5. TREAT AS HIGH-TRUST — scrutinize the gate change, route config changes to the user.
   The agent's most direct route to a fake green light. Demand justification for every
   deletion/weakening; loosened enforcement goes to the human who owns production.
      ↓ you cannot resolve whether the change is correct after a genuine attempt
6. STOP AND ASK THE USER ONE SHARP QUESTION.
   The reviewer's version of "don't guess silently." A precise question about the one
   uncertain behavior beats approving on hope. The user holds final authority on what ships.
```

The cardinal rule across all six rungs, the same one that runs through this whole skill: **an approval is a claim that someone competent checked this and believes it is correct.** With an agent author, you are often the *only* one who can make that claim. If you can't make it honestly, the correct move is never the silent checkmark — it is request-changes, split, or ask.

---

## Cross-references

- [code-style.md](code-style.md) — the formatter + linter that settle everything *not* worth reviewing, so review attention lands on logic; the linter as the first automated reviewer of agent output, upstream of the human gate here.
- [ci-cd.md](ci-cd.md) — the un-gameable pipeline whose integrity this file's "review the gate-changers hardest" rule protects from the review side; coverage floors, mutation testing, branch protection.
- [agent-era-shifts.md](agent-era-shifts.md) — why review inverts from courtesy to load-bearing gate, why the stateless agent author makes the human reviewer the only persistent understanding, and why two agents share blind spots.
- [version-control.md](version-control.md) — small frequent integration (which keeps PRs small and reviewable) and the secret-scanning backstop the security hunt relies on.
- [../SKILL.md](../SKILL.md) — STAGE 3 and the gate IDs this reference clears.

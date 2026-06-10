# Coverage, Mutation, Economics & Bug Disposition

Loaded at **Triage** (the do-not-test cut), **Bite** (suite validation), and **Books** (disposition). This is the doc that keeps you honest: it answers "does GREEN mean CONSTRAINED?", "what was never worth touching?", and "a test just caught a real bug — now what?".

Cross-links: [decision-tree.md](decision-tree.md) · [test-doubles.md](test-doubles.md) · [probe-construction.md](probe-construction.md) · [determinism-and-flakiness.md](determinism-and-flakiness.md)

---

## 1. Coverage literacy

Coverage measures **what the tests touched**, never **what they proved**. A line can execute under a test that asserts nothing meaningful; it counts as covered and verifies nothing. Treat the number as a flashlight for finding dark corners, never as the scoreboard.

### The three granularities

| Metric | Counts | Blind spot |
|---|---|---|
| **Line / statement** | each source line ran at least once | a line holding a branch counts as hit even though only one side of the decision ran |
| **Branch / decision** | each edge out of a conditional taken — the true *and* the false arm | the *combinations* of conditions, and which end-to-end path through several branches occurred |
| **Path** | each distinct route through the control-flow graph | combinatorially explosive — usually impractical above trivial functions |

Default to **branch coverage**. Line coverage flatters you: in the function below, one happy-path call lights up every line, so line coverage reads near-100% — yet the *error* arms, usually the riskier code, were never entered.

```
func transfer(from, to *Account, amt Money) error {
    if amt <= 0 { return ErrNonPositive }      // happy path takes the FALSE arm only;
    if from.Balance < amt { return ErrFunds }  // the TRUE arms (both error returns)
    from.Balance -= amt; to.Balance += amt     // never run — line coverage hides this,
    return nil                                 // branch coverage exposes it.
}
```

Line coverage here can show 100% while two error branches and their specific errors go completely unverified. That is the gap branch coverage is built to surface.

### Reading a report the right way

Do **not** sort by percentage and grind the lowest files up to a target. Instead:

1. Overlay the report on your **risk ledger** (Triage). Find the **uncovered branches inside high-blast-radius code** — the error path in the payment routine, the auth-deny arm, the corruption-recovery branch. Those are the lines worth a test.
2. Ignore uncovered lines in code the ledger already marked do-not-test (see §3). 100% in trivial glue is wasted effort that buys zero risk reduction.
3. A **branch that no test enters** is a question, not a debt: is it dead code (delete it), an unreachable defensive guard (acceptable — note it), or a real untested path (test it)? Coverage gaps are leads to investigate, not numbers to flatten uniformly.

### Coverage as guide, not target — and Goodhart's law

The instant a coverage percentage becomes a gate or a bonus metric, it stops measuring quality. People write assertion-free tests, delete hard-to-cover branches, or pad with trivial cases to clear the bar. The metric rises; the suite's defect-catching power does not. *When a measure becomes a target, it ceases to be a good measure.* Use coverage to **find** gaps; use **mutation testing** (§2) to **judge** strength.

### Honest delta reporting

When you report what a session bought, lead with **bugs and retired risk**, not coverage. The two sessions below are not equivalent, and the percentage actively misleads about which mattered:

> - `+2% branch coverage, 1 real bug found and fixed, 2 high-risk failure modes retired` ✅ high value
> - `+20% line coverage, 0 bugs, all on low-risk glue` ⚠️ low value — exercised code without constraining it

Always pair any coverage figure with: bugs surfaced, ledger items retired, and mutation results. A green run that found nothing still has value — it **bought down detection-gap risk** on the failure modes it covered — but say *that*, and don't dress it up as a coverage win.

---

## 2. Mutation testing — the real adequacy signal

Coverage asks "did a test run this line?" Mutation testing asks the only question that matters: **"if this line were wrong, would a test fail?"** That is the working definition of a useful test.

### What a mutant is

A **mutant** is a copy of your code with one small, behavior-changing edit injected by the tool:

- flip a relational operator: `<` → `<=`, `==` → `!=`
- negate a boolean or condition: `if x` → `if !x`
- swap arithmetic: `+` → `-`, `*` → `/`
- replace a return value or constant: `return n` → `return 0`, `true` → `false`
- delete a statement or a void method call (call removal)
- nudge a boundary: `>=` → `>`

The tool runs your suite against each mutant and labels the outcome:

- **Killed** — at least one test failed. Good: the suite detects that defect.
- **Survived** — every test still passed. **The mutant is a bug your suite cannot see.** This is the signal you are mining for.
- **Timed out** — the edit produced an infinite loop; counted as killed (the change was detectable by divergence).
- **No coverage** — the mutated line never executed under any test; a coverage hole wearing a mutation hat, fix it like one.

The **mutation score** = killed ÷ (total viable, non-equivalent mutants). It is a far truer adequacy measure than coverage, because it rewards *assertions*, not mere *execution*.

### Reading survived mutants

Each survivor is a concrete, actionable finding. Triage every one:

- **Real gap** → add or strengthen an assertion so the mutant dies. Most survivors mean a test executes the line but never checks the result, or your boundary case is one value off.
- **Equivalent mutant** → the edit yields behavior indistinguishable from the original (e.g. `x = x + 0`, a reordering with no observable effect, or a change to a value that is later overwritten). It *cannot* be killed; mark it ignored with a one-line reason. These are noise, not debt — but verify before dismissing, because labeling survivors "equivalent" is the easiest way to fake a good score.
- **Don't-care line** → survivor in code the ledger said skip; ignore it, consistent with §3.

A surviving mutant in a `>=` or `<` boundary check almost always means you never tested the exact edge — go back to the boundary tables in [probe-construction.md](probe-construction.md).

### When to run it

Mutation runs the whole suite once per mutant, so it is slow by a large constant factor. Scope it deliberately:

- on the **high-risk modules from the ledger**, not the entire repo;
- on the **diff** in CI (mutate only changed lines) for routine work;
- **after** you believe a target is well-tested, to prove it — this is the Bite teeth check, not an exploration tool.

### Per-language tooling

| Language | Tool |
|---|---|
| Python | `mutmut`, `cosmic-ray` |
| JS / TS | **Stryker** (`stryker-mutator`) |
| Java / JVM | **PIT** (`pitest`) |
| Go | `go-mutesting`, `gremlins` |
| Rust | `cargo-mutants` |
| C# / .NET | Stryker.NET |
| Ruby | `mutant` |

### No-tooling fallback: the manual mutant

If no mutation tool exists for the stack, do it by hand — it is the single highest-leverage two-minute check in the whole skill:

1. Pick the riskiest line a new test claims to cover.
2. **Break it on purpose**: flip the comparison, negate the guard, return a constant, or comment out the call.
3. Run the suite. **Expect red.**
4. **Still green? The test has no teeth** — it executes the line but asserts nothing about its effect. Fix the assertion *first*, confirm the mutant now dies, then continue.
5. **Revert.** The code must be byte-identical to before; diff to be sure.

For a **regression test** (motivation = bug-fix), this is automatic and mandatory: you already have a "mutant" — the unfixed code. The test must be **red before the fix, green after**. If it passes on the broken code, it does not test the bug.

---

## 3. What is NOT worth testing — the economics

Choosing **not** to test is a first-class engineering deliverable, not laziness and not an omission. Every test costs authoring time, run time, and — most expensively — *maintenance drag*: it must be read, updated, and debugged for the life of the code. A test that constrains nothing is pure liability; it dilutes the suite's signal and taxes every future change. Triage produces an explicit, justified **DO-NOT-TEST list**; this table is its rubric.

| Category | Example | Why skip | Reason tag |
|---|---|---|---|
| **Thin wrapper / delegate** | a method that just forwards to an already-tested core, adds no logic | no logic of its own; covered by the core's tests | `thin-wrapper` |
| **Trivial glue / accessor** | plain getters/setters, field-copy constructors, simple DTOs | no branches, nothing to get wrong; a test merely restates the field | `trivial` |
| **Generated code** | ORM models, protobuf/gRPC stubs, scaffolded clients | owned by the generator; test the generator or the contract, not its output | `generated` |
| **Framework-guaranteed** | routing, serialization, DI wiring, ORM query building | the framework's own suite covers it; you'd be testing their code | `framework-guaranteed` |
| **Soon-to-be-rewritten** | code slated for deletion/rewrite this iteration | tests die with the code; at most a characterization test if you must refactor it first | `soon-to-be-rewritten` |
| **Cost ≫ value** | low-risk code needing a major refactor-for-testability to isolate | isolation cost dwarfs the risk retired; defer until the risk rises | `cost>>value` |
| **Covered indirectly** | a branch a higher-level integration test already exercises *and asserts* | a unit test would duplicate, not add, signal | `covered-indirectly` |

**Caveats that override the skip:**
- A "thin wrapper" that does *any* mapping, defaulting, error translation, or validation is **not** thin — that mapping is exactly where bugs hide. Test it.
- If a target is reachable by **untrusted / external input**, it is never trivial regardless of size (it is a boundary + fuzz candidate; see [decision-tree.md](decision-tree.md)).
- "Covered indirectly" only holds if the higher-level test **asserts** the behavior, not merely runs through it.

Record each skip with its one-line reason. A reviewer should be able to read the DO-NOT-TEST list and agree the line was drawn deliberately, not forgotten.

---

## 4. When a test surfaces a REAL bug

This is the payoff. A failing assertion — or a survived mutant that turns out to reflect a genuine defect — means the suite did its job. Do **not** silently "fix the test to pass." Work the protocol.

### Step 1 — Lock it with a regression test

Before touching the production code, ensure a test **encodes the correct behavior and currently fails**:

- **Red before** — run it against the unfixed code and watch it fail. This proves the test actually targets the bug.
- **Green after** — apply the fix and watch it pass.
- A regression test never seen red proves nothing; it might be asserting the wrong thing entirely.

Name it after the defect, not the function: `test_transfer_rejects_overdraft_when_balance_equals_amount`, and reference the issue/PR. Pin the **exact** boundary that broke — usually an off-by-one or an unhandled equivalence class. Every past bug becomes a permanent pinned example so it can never silently return.

### Step 2 — Decide disposition WITH THE USER

The agent does not unilaterally change product behavior. Surface the bug and choose together:

| Option | When | Action |
|---|---|---|
| **Fix in this PR** | small, safe, in scope, clearly a defect | apply the fix; regression test goes red → green; ship them together |
| **Open an issue / defer** | out of scope, risky, needs design or owner sign-off | file the issue with the discovery story plus a failing (or `skip`-marked, ticket-linked) test attached |
| **Pin current behavior** | other code or external consumers may *depend* on the quirk, "wrong" is ambiguous, or you must lock behavior before a refactor | write a **characterization test** asserting the *actual current* behavior, with an explicit comment: *"Pins observed behavior; this is likely a bug — see #1234. Do not 'fix' the test; fix the code and update this."* |

The cardinal sin is editing an assertion to match buggy output **without** the explanatory note — that converts a caught bug into a permanently blessed one and destroys the next reader's ability to tell intent from accident.

**Documented ≠ scenes-à-faire.** Pin-as-characterization is for behavior other code may legitimately *depend* on. Behavior that is merely *documented* — a code comment, an explicit error string — but causes silent data loss, a misleading diagnostic, or an attacker-controllable bad outcome is a **bug to file**, not a quirk to bless: record the documentation caveat honestly and set severity by blast radius, but still report it. "It's documented" answers *was this intended?*, never *is this acceptable?*.

### Step 3 — Tell the discovery story

In the PR or issue, write the narrative plainly: **what input triggered it, what the code did, what it should have done, the blast radius, and how the test now guards it.** This is what makes the find reviewable and the fix trustworthy — and it is the honest counterpart to the coverage number.

---

## 5. Suite-validation audits (Bite)

Two smells routinely make a green suite lie. Run both before declaring a target done.

### Over-mock smell — the refactor-fragility check

A test should constrain **behavior**, not **structure**. The probe: *mentally (or actually) perform a behavior-preserving refactor* of the SUT — rename a private method, reorder independent internal calls, extract a helper, swap a collaborator for an equivalent one. **Does a test break even though observable behavior is unchanged?** If yes, that test is welded to the implementation — it will cry wolf on every harmless change and dull the team's response to real failures.

The cause is almost always **over-mocking**: doubles standing in for things that should be real, with assertions on *how* the code worked internally rather than *what* it produced. Remedy: replace mocks with real collaborators or a **fake**, and assert resulting **state / return value** instead of interaction sequences. See [test-doubles.md](test-doubles.md) for the full anti-pattern catalogue and the classicist-default rationale.

### Fake-drift contract check

A **fake** (in-memory DB, fake clock, stub HTTP server) is a parallel implementation of a real collaborator. Over time the real thing changes — a new constraint, a different error, altered semantics — and the fake silently lags. Tests stay green against a fake that **no longer matches reality**, manufacturing false confidence.

Remedy: wherever a fake or an owned adapter stands in for an external dependency, add a **contract test** that runs the *same* behavioral assertions against **both the fake and the real collaborator** (the latter behind an integration / `@slow` tag, a test-container, or a recorded interaction). When they diverge, the contract test goes red and pins the drift before production does. This is the standing price of using fakes; pay it, or the fake quietly becomes fiction.

---

## 6. Residual-risk audit & session summary (Books)

Close the loop by re-scoring the **risk ledger** from Triage. Every failure mode ends in exactly one of two states:

- **Retired** — name the test(s) that retire it and the evidence they have teeth (a killed mutant / a red-then-green regression / a branch now covered *and asserted*).
- **Consciously accepted** — recorded residual risk with a one-line reason (cost ≫ value, deferred to issue #N, out of scope this session). Accepted risk is a decision on the record, not a gap swept under the rug.

Then emit an **honest session summary**:

```
assay session summary
  Tests written:        <n> (unit / integration / property / ...)
  Bugs found:           <n> — <one-liner + disposition each>
  Coverage delta:       <branch% before → after>   (guide, not target)
  Mutation:             <score / survivors triaged>  — or manual-mutant note
  Risk ledger:          <k retired> / <m consciously accepted>
  Residual risk:        <accepted items + reasons>
  Remaining targets:    <funded risks not yet addressed>
```

The summary's job is to make the value legible without spin: a small coverage bump that retired two high-blast-radius failure modes is a strong session; a large bump that retired nothing is not. Report it the way it is.

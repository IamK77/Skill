# The Feedback Decision Engine

This is the deterministic core of `gauge`, opened at **STAGE 0 (Frame)** and kept open at every later GATE. Its one job: for each way the code can fail, route that failure mode to the source that gives the clearest signal cheapest, and push that signal as far **left** as it goes. An agent runs a loop — act, observe a signal, correct — and the loop is only as good as the signal at each step. The agent has no intuition, no memory across sessions, and no feel that something is subtly wrong; it knows only what the code, the checker, the test, and the logs tell it. The engine below scores a signal on six axes, selects a source per failure mode, routes that source left, dials strictness by risk, and escalates when no clear source exists. It does not reimplement its siblings: contracts and boundaries come from `load-bearing`, the behavior tests from `assay`, the pipeline from `flightline`, the production observability from `stationkeeping`. Read [../SKILL.md](../SKILL.md) for the five-stage order these forks run inside.

Every fork below carries three fields so two agents working the same code reach the same plan:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to pick when the predicate is genuinely a coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

If a fork is still ambiguous after DEFAULT and FALLBACK, stop and ask the user one sharp question. Guessing silently is the move an agent makes — don't model the failure you are guarding against.

Deeper material lives in the sibling docs; each leaf names the one you open next: [agent-feedback-shifts.md](agent-feedback-shifts.md) · [feedback-sources.md](feedback-sources.md) · [python-recipe.md](python-recipe.md) · [typescript-recipe.md](typescript-recipe.md) · [honest-ceiling.md](honest-ceiling.md).

---

## PART 1 — The six dimensions as scoring axes

"Clear" is not one property; it is six, and a signal can have some and lack others. Score every signal you rely on against all six. A signal that fails any axis is not yet feedback — it is, at best, a rumor the agent will mis-handle. Each axis has a one-line test you can apply on the spot.

| Axis | What it means | One-line test | Failure looks like |
|---|---|---|---|
| **FAST** | Returns inside the agent's working loop — on save, on one command — not minutes later, not only in prod. | "Did this fire before the agent moved on to the next edit?" | A check that only runs in a nightly job; an error first seen in production logs. |
| **LOCAL** | Points at the exact site: file, line, sub-expression — not "something failed downstream". | "Does it name the offending line, or just the symptom three layers away?" | A `KeyError` surfacing in a handler far from the bad parse; a stack trace whose top frame is library code. |
| **ATTRIBUTED** | Says *why*: expected X, got Y; *this* constraint failed — not just "error". | "Could the agent fix it from the message alone, without re-deriving the cause?" | `ValueError: invalid input`; an assertion with no message; `AssertionError` with two bare values. |
| **DETERMINISTIC** | Same input, same signal. A flaky signal is no signal — the agent cannot attribute a result it can't reproduce. | "Run it ten times — does it give the same verdict every time?" | A test that passes on retry; a check that depends on wall-clock, ordering, or a live network. |
| **TRUSTWORTHY** | Green means good, and *absence* of a signal means "fine", not "this path was never checked". | "If this is silent, was the path verified — or merely never visited?" | 90% green coverage where the untested 10% is the risky branch; a checker that skipped an `Any`-typed path silently. |
| **UN-FAKEABLE** | A signal the agent can flip green by hand — delete the assertion, `as any`, widen the timeout — is noise. | "Can the agent turn this green without making the code correct?" | `# type: ignore` on the failing line; a deleted assertion; `retries=5` masking a flake. |

**How to use the scorecard.** When you instrument a failure mode, name its signal and walk the six. The first axis it fails tells you the next move — and the next move maps to a part of this engine:

- fails **FAST** → route it further left (PART 3).
- fails **LOCAL** or **ATTRIBUTED** → pick a better source, or make the current source speak at the site (PART 2; for structured errors see [feedback-sources.md](feedback-sources.md)).
- fails **DETERMINISTIC** → install a seam before you assert; never retry-to-green (this is `assay`'s determinism overlay).
- fails **TRUSTWORTHY** → make absence visible (PART 5, rung 4; [honest-ceiling.md](honest-ceiling.md)).
- fails **UN-FAKEABLE** → gate it and ban the escape hatch (PART 4).

The agent angle, in one line per axis: the loop is bounded by FAST + LOCAL + ATTRIBUTED (how quickly and precisely it can correct); DETERMINISTIC is what makes a signal *attributable* at all to a stateless actor; TRUSTWORTHY and UN-FAKEABLE are what stop the agent from reading silence as safety and from gaming the gate. The deep treatment of why each matters more for an agent than a human is in [agent-feedback-shifts.md](agent-feedback-shifts.md).

---

## PART 2 — The per-failure-mode source selector

No single tool delivers all six axes. You **assemble** clear feedback by mapping each failure class to the source that owns it. The table is the routing summary; the tree under it is how you walk an actual failure mode.

| Failure mode | Cheapest clearest source | Lives as far left as | Owns which axes natively | Recovered / topped up by |
|---|---|---|---|---|
| Wrong shape / broken contract (caller passes the wrong type, missing field, wrong arity) | **Static types** — strict checker | **editor** (in-loop, pre-run) | FAST, LOCAL, ATTRIBUTED, DETERMINISTIC | UN-FAKEABLE needs the gate (PART 4); shape at runtime needs boundary validation |
| Bad external / untyped data (HTTP body, env, file, untyped lib, deserialized blob) | **Boundary validation** — parse into a typed model | **boundary** (first line that touches the data) | LOCAL, ATTRIBUTED, DETERMINISTIC | recovers what runtime erasure loses; the static type alone is a *claim* here, not a check |
| Wrong behavior (right shape, wrong answer — an invariant types can't express) | **Behavior test** — legible oracle | **pre-commit / CI** | DETERMINISTIC, ATTRIBUTED, TRUSTWORTHY (with coverage/mutation) | designed in `assay`; absence made visible by coverage + mutation (PART 5) |
| Runtime fault (a real fault fires at run time — a parse fails, a precondition breaks) | **Structured error** — fail loud at the site | **runtime**, but surfaced in tests/CI | LOCAL, ATTRIBUTED | put the failure in the *signature* (errors-as-values) so the checker pulls it left to editor |
| Production-only (only appears under real traffic, real data, real concurrency) | **Observability** — structured logs, traces, correlation IDs | **prod** (last resort — can't be pulled fully left) | ATTRIBUTED, LOCAL (with a correlation ID) | the agent can't *feel* prod; this is the only source that makes that failure legible. Operated by `stationkeeping` |

```
SELECTOR — run per failure mode from the STAGE 0 ledger.

S1. Is it expressible as a type? (shape, arity, presence, a closed set of cases)
    PREDICATE: could a strict checker reject the wrong version before the code runs?
    ├─ YES → STATIC TYPES. Model it as a typed record / union, not an untyped bag.
    │        Put the failure in the signature (errors-as-values) so the checker
    │        forces the caller to handle it. → feedback-sources.md (static) + the recipe.
    └─ NO  → S2.

S2. Does the data cross a trust/runtime boundary? (external input, network, file,
    env, an untyped library, anything deserialized)
    PREDICATE: is the static type here a CLAIM about data the checker never saw?
    ├─ YES → BOUNDARY VALIDATION. Parse into a typed model AT the edge (pydantic/zod)
    │        so a bad shape fails THERE, attributed, not three layers in.
    │        Contain Any/any to the adapter; convert immediately; never flow it inward.
    │        → python-recipe.md / typescript-recipe.md (boundary section).
    └─ NO  → S3.

S3. Is the failure behavioral? (right shape, wrong result; an invariant)
    PREDICATE: can you state an oracle — "how will I know the answer is wrong"?
    ├─ YES → BEHAVIOR TEST. One behavior, one reason to fail, expected-vs-actual message.
    │        DESIGN of the test is assay's job; here you ensure the mode HAS a
    │        test that fails clearly, and that coverage/mutation prove it has teeth.
    └─ NO  → S4.

S4. Is it a runtime fault that should stop the program loudly?
    PREDICATE: when this breaks, do you want a precise crash at the site, or a value?
    ├─ STRUCTURED ERROR. Raise/return a typed error that names the cause at its site —
    │  not a generic exception swallowed and re-raised three layers up.
    │  Where it pays, lift it into the signature as a Result so the checker pulls the
    │  handling left. → feedback-sources.md (structured errors).
    └─ If it only manifests under real traffic/data/concurrency → S5.

S5. Production-only?
    PREDICATE: can NO left-of-prod source see it (it needs real scale/data/timing)?
    └─ OBSERVABILITY. Emit a structured, queryable signal (log/trace + correlation ID)
       so the failure the agent cannot feel becomes a readable signal.
       Operating that observability is stationkeeping's job; here, ensure the HOOKS exist.
```

**DEFAULT** when two sources could own a mode: take the **leftmost** one that covers it (a type beats a test beats a log), and add the next source only for the residual the leftmost can't reach. **FALLBACK** when you can't classify the mode yet: park it in a "needs-recon" bucket with its blast-radius guess; do not force it onto the nearest source.

**One-line worked leaf —** *"`order_total` returns the sum of line items → S1 YES, the result and the line-item shape are types; the 'an item may be discounted below zero' rule is S3 behavioral → a `frozen dataclass` for the line item (static) PLUS one test for the floor rule (behavior)."*

---

## PART 3 — Shift-left routing

Every source has a natural home, but the same check is cheaper the further left it runs. Route each signal to the **leftmost lane it can live in**, then mirror it right as a backstop. The lanes, left to right:

```
editor (on save / on type)
   → pre-commit (on git commit, local)
      → PR / CI (on push, the blocking backstop)
         → prod (observability — a signal you never want to FIRST see here)
```

The cost-of-catching-late gradient is why left wins — and the gradient is steeper for an agent, because a signal that fires after it has moved on is, to a stateless actor, a signal that effectively did not fire:

| Caught in | What the agent pays | What you pay |
|---|---|---|
| **editor** | a red squiggle, fixed in the same thought | nothing |
| **pre-commit** | a blocked commit, fixed in the same session | seconds of local CI |
| **PR / CI** | a context-switch back to a diff it had left | minutes of pipeline + review attention |
| **prod** | nothing — it cannot feel it; a human must catch and route it back | an incident, reported by the agent as a success |

**Routing rule per source:**

- **Static types** → run the checker in-editor (LSP) AND as a pre-commit hook AND as a blocking CI gate. The editor instance is the agent's compiler; the gate is what makes it UN-FAKEABLE. Strict mode in both — a checker that isn't strict and isn't gated does not exist for an agent.
- **Boundary validation** → the parse runs at runtime, but its *correctness* is pulled left by a type on the parsed model (editor) and a test of the reject path (CI).
- **Behavior tests** → the fast unit subset at pre-commit; the full suite in CI. Keep the pre-commit subset genuinely fast or the agent will `--no-verify` past it.
- **Structured errors** → lift into the signature as a Result where it pays, which pulls "did the caller handle this" all the way to the editor.
- **Observability** → the one source you cannot pull fully left; the goal is to make sure that when it *is* the only lane, it is ATTRIBUTED enough to route the fix back left next time.

**Decision fork — is this signal as far left as it can go?**

- **PREDICATE:** is there a lane to the left of where it currently fires that *could* host this check at acceptable cost?
- **DEFAULT** on a coin-flip: move it left; the asymmetry favors it — an over-eager local check costs the agent a few seconds, a late check costs a context-switch or an incident.
- **FALLBACK** when you can't tell if the left lane can host it: spike it in that lane on a branch and watch it catch a seeded failure before committing.

The pipeline that runs the gate lanes (pre-commit, CI) is operated by `flightline`, the prod-observability lane by `stationkeeping`; this engine only decides *which signal goes how far left*.

---

## PART 4 — Un-fakeable: gate the source, ban the escape hatch

A signal the agent can flip green by hand is not feedback — it is a gate the agent games the way it games any gate. UN-FAKEABLE is not an optional polish pass; it is what makes the other five axes worth anything, because the agent's reflex when a check goes red is to silence the check, not fix the code. Two moves, both required.

**Move 1 — gate every source in CI *and* pre-commit.** An ungated strict checker is advice the agent walks past. The gate must be one the agent cannot edit to weaken (branch-protect the CI config and the checker config the same way you protect product code — this overlaps `flightline`'s gate-integrity requirement).

**Move 2 — ban the escape hatches**, by lint rule where possible and by review where not. A "must-be-told" card per hatch:

| Hatch | What it fakes | The ban | If genuinely needed |
|---|---|---|---|
| `Any` / `any` / `dict[str, Any]` | disables checking on everything derived from it | lint rule (ruff `ANN401` / ban-`Any`; eslint `no-explicit-any`) | contain to a thin adapter at a boundary; convert immediately; `unknown` over `any` in TS |
| `cast` / `as` / `as any` | a *claim* the checker trusts blindly instead of a check | review-gate; prefer a real parse | only at a boundary, right next to the validation that earns it |
| `# type: ignore` / `@ts-ignore` | silences one site | require a justification code (`# type: ignore[code]`) and review the diff | with the specific error code and a one-line why |
| **checker-config subtraction** (`mypy disable_error_code` / empty `ruff … select` / lowered `typeCheckingMode` / broad `per-file-ignores`) | silences a whole error *class* repo-wide, invisibly, at zero friction — more potent than any single in-source ignore | inventory the checker's own config *first*; treat any disable / `select`-narrowing as a reviewed, justified diff; CI grep-guard that fails if a known-dangerous mute (e.g. `attr-defined`) reappears | only with a tracked reason + expiry; the strict config itself is branch-protected and diff-reviewed like product code |
| deleted / weakened assertion | empties a test so it passes verifying nothing | regression-first (the test must fail on the unfixed code); mutation testing | never — fix the code, not the test |
| widened timeout / `retries` | masks a flake as a pass | the determinism overlay (`assay`); install a seam instead | never retry-to-green; quarantine, don't paper over |

**Decision fork — is an escape hatch here justified?**

- **PREDICATE:** is this `Any`/`cast`/`ignore` at a genuine boundary adapter, with a parse or a documented reason next to it?
- **DEFAULT** on a coin-flip: **reject it** — the cost of a wrongly-trusted hatch is a silent hole in checking that propagates inward; the cost of refusing it is a few minutes finding the real type.
- **FALLBACK** when you can't tell if it's a real boundary: treat it as not-a-boundary (ban it) and ask the user, because an inward `Any` disables checking on everything it touches.

The full inventory of hatches per language and how to wire the bans is in [python-recipe.md](python-recipe.md) and [typescript-recipe.md](typescript-recipe.md); why the agent reaches for them at all is in [agent-feedback-shifts.md](agent-feedback-shifts.md).

---

## PART 5 — Absence is a signal

The one move that neutralises gradual typing's central weakness: make "not checked" *visible*. An agent reads silence as safety, which is exactly where the residual risk hides — an unannotated path, an untested branch, a test with no teeth all look identical to a verified one unless you surface the gap. Turn each form of silence into a signal:

| Silent gap | Make it speak with | Reads as |
|---|---|---|
| an `Any`-typed / unannotated path the checker skipped | pyright `reportUnknownX` / `--warn-return-any`; basedpyright's unknown reporting | "this path is unchecked", a map of where the type layer is blind |
| an untested branch | coverage read as a **map of untested paths**, not a single percentage | "this line was never exercised" — not "fine" |
| a test that asserts nothing | mutation testing (mutmut / `cargo-mutants` / Stryker / PIT) | "a mutant survived here — the test has no teeth" |
| a boundary that asserts instead of validating | grep `cast(`/`# type: ignore` (Py) or `as`/`as any` (TS) at edges; review the adapter | "this is a claim, not a check" |

Read coverage as topology, not a number: 95% green where the missing 5% is the auth branch is worse than an honest 80% that names the gap. The economics of reading coverage and mutation this way is `assay`'s [coverage material]; here the rule is only *surface the silence*.

---

## PART 6 — Strictness by risk (够用就好)

Rich instrumentation is not free, and over-instrumenting is its own failure: noise buries the real signal as surely as silence does. Dial the strictness to the weight of the code. This is the same asymmetry that governs the gates, run in reverse for trivial code — an over-instrumented helper costs review attention and noise; an under-instrumented payments path costs an incident.

| Weight class | Predicate | Instrumentation it earns |
|---|---|---|
| **Trivial / stable / low-blast** (a pure formatter, a one-line getter, generated code) | rarely changes, failure is cosmetic, no one downstream depends on its internals | the strict checker (it's free) and nothing more — no bespoke errors, no dedicated tests, no observability |
| **Ordinary logic** | real branches, owned by you, moderate blast radius | static types + a test for each real branch + structured errors on the fault paths |
| **Durable / high-blast / churned** (money, auth, data integrity, a public contract, code that changes often) | failure touches money/data/auth/availability/safety, OR it changes frequently (churn breeds bugs) | the full stack: errors-as-values in signatures, boundary validation, behavior + property tests with mutation coverage, structured errors, and observability hooks with correlation IDs |

**Decision fork — does this path earn rich instrumentation?**

- **PREDICATE:** does a failure here touch money, data integrity, auth, availability, or safety — OR does this code change often?
- **DEFAULT** on a coin-flip: instrument it as ordinary, not rich; you can climb the escalation ladder (PART 7) when a real failure mode demands it, but you cannot un-spend the noise.
- **FALLBACK** when blast radius is unknown: treat it as durable until proven trivial (the asymmetry favors the gate on consequential code), and confirm the class with the user.

`load-bearing` already ranked the irreversible, high-blast decisions; reuse that weighting here rather than re-deriving it.

---

## PART 7 — The escalation ladder

When a failure mode has no clear source — nothing you rely on scores six-of-six on PART 1 — climb one rung at a time rather than declaring it covered. Each rung costs more; stop at the first that gives the mode a clear, un-fakeable signal, or at the top with an honestly-recorded residual.

```
1. ADD a source.
   The mode has no signal at all → pick the owner from the PART 2 selector and stand it up.

2. MOVE it left.
   It has a signal but the signal fails FAST (fires too late) → route it to a lefter
   lane (PART 3): editor checker, pre-commit hook, CI gate.

3. MAKE it un-fakeable.
   It fires early but the agent can flip it green → gate it in CI + pre-commit and ban
   the escape hatch (PART 4). A signal the agent can manufacture is not a rung.

4. MAKE absence visible.
   You cannot fully close the mode (gradual ≠ sound; green ≠ proof) → surface the gap
   (PART 5): report Any, map untested paths, mutation-test. Silence becomes a signal.

5. ACCEPT the residual, in writing.
   The mode is irreducible at acceptable cost → record it as accepted residual risk
   with its blast radius, so the next stateless session inherits the gap as a known,
   not as a silent hole. Then STOP.
```

The honest ceiling that makes rung 5 necessary — why you asymptote toward total coverage but never reach it, and why even a sound language only covers a *class* of errors — is in [honest-ceiling.md](honest-ceiling.md). When DEFAULT and FALLBACK don't resolve a rung, ask the user one sharp question; they hold authority on what blast radius is acceptable for *this* project.

---

## A full worked traversal

**The code:** an HTTP handler that takes a JSON body describing a fund transfer, looks up two accounts, and moves money between them — external input plus an irreversible state change. High blast radius. We walk the whole engine.

**STAGE 0 — Frame.** Enumerate the failure modes and weight them: (a) the body is the wrong *shape* — missing `amount`, `amount` a string, no `to_account`; (b) the body is well-shaped but *bad data* — `amount` negative, accounts equal; (c) *wrong behavior* — the transfer debits but never credits, or rounds wrong; (d) a *runtime fault* — an account doesn't exist; (e) *production-only* — under concurrent requests the same balance is debited twice. All five touch money → **durable / high-blast** (PART 6) → earns the full stack.

**Mode (a), wrong shape — SELECTOR S1/S2.** Shape *is* a type, but the data crosses a boundary (S2 YES): the static type on the handler's parameter is a claim about bytes the checker never saw. → **boundary validation**. Parse the raw body into a typed model at the first line of the handler:

```python
class TransferRequest(BaseModel):
    from_account: AccountId          # NewType('AccountId', str), not a bare str
    to_account: AccountId
    amount: Decimal = Field(gt=0)    # validates (b)'s sign rule HERE, attributed

req = TransferRequest.model_validate(raw_body)   # bad shape fails at the edge
```

Now a wrong shape fails at the boundary, ATTRIBUTED ("amount: input should be greater than 0"), LOCAL (the field), DETERMINISTIC. Everything *inside* the handler operates on a `TransferRequest`, fully typed → the checker (S1) owns shape from here inward, in the editor.

**Mode (b), bad data.** Partly absorbed above (`gt=0`, the `AccountId` newtype). The cross-field rule "from ≠ to" isn't a shape, so it drops to S3 — but it's a cheap validator, keep it at the boundary as a model validator so it still fails at the edge, attributed.

**Mode (c), wrong behavior — S3.** "Debit equals credit, balance conserved" is an invariant types can't express. → **behavior test** with a clear oracle: a property test that asserts `sum(balances)` is conserved across any transfer, plus a pinned example for rounding. Design depth is `assay`'s; here we only ensure the mode *has* a test that fails on one reason. Mutation testing (PART 5) confirms the assertion has teeth.

**Mode (d), runtime fault — S4.** "Account not found" is a fault we want to handle, not crash on. Lift it into the signature as a Result so the checker forces the caller to handle both arms (errors-as-values pulls it left to the editor):

```python
def load_account(id: AccountId) -> Result[Account, AccountNotFound]: ...

match load_account(req.from_account):
    case Ok(acct): ...
    case Err(e):   return http_404(e)        # checker errors if this arm is missing
```

The error is LOCAL and ATTRIBUTED at its site, and exhaustiveness (`match` + `assert_never`) makes a forgotten case a checker error in the editor.

**Mode (e), production-only — S5.** The double-debit race needs real concurrency; no left-of-prod source feels it reliably. → **observability**: emit a structured log with a correlation ID and the transfer id on every debit/credit, so the race becomes a queryable signal. Hooks here, operation by `stationkeeping`.

**Route left (PART 3).** Checker in editor + pre-commit + CI strict; the boundary model's type checked in editor, its reject path tested in CI; the conservation property in the fast suite; the Result handling enforced by the editor checker; the observability the one lane that stays at prod.

**Make it un-fakeable (PART 4).** Ban `Any` so no one "simplifies" `TransferRequest` into a `dict`; ban `cast` so the boundary parse can't be swapped for an assertion; regression-first on the conservation test so it can't be emptied; no `retries` on the race test — quarantine and seam it instead. All gated in CI and pre-commit, on branch-protected config.

**Absence visible (PART 5).** Coverage read as a map confirms the `Err` arm and the negative-amount reject are *exercised*, not just present; mutation testing confirms the conservation assertion fails when the credit is mutated away; pyright's unknown-type report confirms no `Any` leaked inward from the boundary.

**Result:** every one of the five modes has a signal that scores six-of-six, each pushed as far left as it goes, none the agent can flip green by hand, and the one irreducibly-prod mode (the race) made visible rather than silent. That is the property a good static language delivers — assembled, here, from five sources.

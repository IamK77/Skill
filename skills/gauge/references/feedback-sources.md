# The Feedback Sources Catalogue

This is the catalogue `gauge` works from across **STAGE 1 (Static layer)** through **STAGE 4 (Trustworthy)** — STAGE 1 opens it to build the leftmost signal, STAGE 2 returns to it for the boundary row, STAGE 3 for behavior and runtime, and STAGE 4 for the un-fakeable column. It names the five sources of clear feedback a codebase can emit, and for each one fixes the **failure class it owns**, which of the six dimensions it is strong and weak on, how far **left** it naturally lives, the **gate that makes it un-fakeable**, and what it **cannot** catch — so the reader always knows which source to add next. The engine that decides *which* source a given risk earns (and how far left to push it) is [decision-tree.md](decision-tree.md); the copy-usable tool configs are in [python-recipe.md](python-recipe.md) and [typescript-recipe.md](typescript-recipe.md); the limits no source escapes are in [honest-ceiling.md](honest-ceiling.md).

---

## The thesis: no single source gives all six dimensions

"Clear feedback" decomposes into six axes (defined in [../SKILL.md](../SKILL.md) and scored in [decision-tree.md](decision-tree.md)): **fast, local, attributed, deterministic, trustworthy, un-fakeable**. No one tool delivers all six. A static checker is fast and local but blind to runtime data and to behavior. A test is attributed about behavior but slow and silent on the paths it never exercises. Observability sees production but lands far to the right, minutes or hours after the act. So you do not *choose* a source — you **assemble** them: enumerate the ways the code can fail (STAGE 0), and for each failure class pick the source that gives the clearest signal cheapest, then push it as far **left** (editor → pre-commit → PR/CI → prod) as it goes. The dimensions are the scorecard; this catalogue is the parts bin.

The five sources and the failure class each owns:

| Source | Owns this failure class | One-line job |
|---|---|---|
| **Static types** | Shape / contract errors | The leftmost, cheapest signal — wrong type, missing field, unhandled case, caught before anything runs. |
| **Boundary validation** | Bad external / untyped data | Recovers at runtime what type-erasure loses at the edge: a bad shape fails *there*, attributed. |
| **Behavior tests** | Wrong behavior types can't express | The invariant a green type check still permits (off-by-one, wrong order, lost field). |
| **Structured errors** | Runtime faults | A fault that *will* happen, made loud, local, and attributed at its site instead of swallowed. |
| **Observability** | Production-only failures | The failure the agent cannot feel from its loop, turned into a readable signal after the fact. |

Read each card below as: *what it catches → where on the six axes it is strong/weak → how far left → the gate that stops an agent flipping it green → what it misses (so you reach for the next card).*

---

## SOURCE 1 — Static types

The closest thing to a compiler an agent gets: it runs in the editor, on every keystroke, before a single line executes.

**Owns:** shape and contract errors. Wrong type passed, field that doesn't exist, `None`/`undefined` where a value was required, a union case left unhandled, a return that doesn't match the signature. On its class the signal is near-total and the cheapest you will ever get.

**Six-dimension profile:**

| Dimension | Grade | Why |
|---|---|---|
| Fast | ★★★ | In-editor, sub-second, before runtime. The leftmost signal there is. |
| Local | ★★★ | Points at the exact file/line/sub-expression. |
| Attributed | ★★★ | "Expected `Order`, got `dict[str, Any]`" — says *why*, not just "error". |
| Deterministic | ★★★ | Same source → same diagnostics, every time. |
| Trustworthy | ★☆☆ | **Only on annotated paths.** Silence over an `Any` or an unannotated function means "not checked", not "fine" — this is the gradual-typing hole. |
| Un-fakeable | ★☆☆ | Trivially faked unless gated: `cast`, `# type: ignore`, `as any` flip any diagnostic green. |

**How far left:** the leftmost source. It lives in the editor LSP and re-runs on save; it costs the agent nothing to consult and returns inside the tightest possible loop. Push *everything it can own* onto it — every shape error you can express as a type is one fewer test you have to write and one fewer fault that reaches runtime.

**Make it un-fakeable** — the type layer doesn't exist for an agent until all four hold:

1. **Strict mode.** `pyright`/`basedpyright` strict or `mypy --strict`; `tsc` `strict` + `noUncheckedIndexedAccess`. A non-strict checker silently waves through exactly the gaps an agent leaves.
2. **Gated, not advisory.** The checker is a *blocking* pre-commit hook **and** a *blocking* CI step. An unenforced checker is a suggestion, and an agent walks past suggestions.
3. **Escape hatches banned or justification-gated.** `Any`, `cast`, `# type: ignore`, `as`, `as any`, `@ts-ignore` are the reflex an agent reaches for to silence a red checker. Lint-ban them (ruff `ANN`/`no-explicit-any`; typescript-eslint `no-explicit-any`/`no-unsafe-*`); where one is genuinely needed, require a written justification on the line so a reviewer sees it.
4. **Absence made visible.** Have the checker *report* unknown/`Any` types (pyright's unknown-type diagnostics; `mypy --disallow-any-explicit`) so the un-checked surface is a signal, not silence. See SOURCE-gap note below and [honest-ceiling.md](honest-ceiling.md).

**Cannot catch — so add the next source:**
- **Runtime shape of external data.** Types are *erased* at runtime; at any edge where real/untyped data enters, the type is a *claim* the checker already believed. → **Boundary validation.**
- **Behavioral correctness.** `sort()` that returns the input unsorted still type-checks. Order, arithmetic, invariants — green types permit all the wrong ones. → **Behavior tests.**
- **Faults that are legal at the type level.** A division by zero, a key that wasn't in the map, a network timeout — typed code, runtime fault. → **Structured errors.**

> **Design move, not just a checker setting:** put failure modes *in the signature*. An untyped `throw`/`raise` is invisible to the checker, so the caller is never forced to handle it. Returning `Result[T, E]` (errors-as-values) makes the failure part of the type, and the checker forces the caller to deal with it. Same for closed unions matched with `match` + `assert_never`/`never` (the checker errors on a missing case) and `Optional`/`strictNullChecks` (narrow before use). These turn "shape error" into a *compile-time* signal instead of a runtime surprise. Language-specific syntax lives in the recipes.

---

## SOURCE 2 — Boundary validation

The runtime signal that recovers what type-erasure throws away. It is not a second type system — it is the *check* behind the static *claim*, installed exactly where untyped reality meets your typed core.

**Owns:** bad external or untyped data. A JSON body with a missing field, a string where a number was promised, an env var that's empty, an upstream API that changed its schema, a row from an untyped DB driver. The static type over this data was a lie the checker couldn't detect; boundary validation makes the lie fail *at the edge*, attributed, before it propagates.

**Six-dimension profile:**

| Dimension | Grade | Why |
|---|---|---|
| Fast | ★★☆ | Runs at runtime, but at the *first* touch of the data, not minutes downstream. |
| Local | ★★★ | Fails at the boundary line with the offending field named — not three layers in where the `KeyError` finally surfaces. |
| Attributed | ★★★ | "field `amount`: expected number, got string" — pydantic/zod errors are field-precise. |
| Deterministic | ★★★ | Same input → same validation outcome. |
| Trustworthy | ★★★ | If it parses, the typed model downstream is *real*, not a claim. This is the source that makes the static layer's claims true. |
| Un-fakeable | ★★☆ | Strong, unless an agent replaces a `parse` with an `assert`/`cast` (a claim, not a check). Gated against below. |

**How far left:** as left as a *runtime* signal can go — the first instruction that touches incoming data. Push the validation to the literal boundary function so nothing inward ever handles unvalidated data. The further inward a bad shape travels before it fails, the more opaque and less local the eventual error.

**Make it un-fakeable:**

1. **Validate, don't assert.** A typed model parse (`Model.model_validate(...)` / `schema.parse(...)`) *checks*; a `cast`/`as`/`# type: ignore`/`assert isinstance` only *claims*. Ban the claim forms at boundaries by lint and review — the anti-pattern is "asserting instead of validating at the boundary."
2. **Contain `Any`/`any` to thin adapter modules at the edge and convert immediately.** One inward `Any` silently disables checking on everything derived from it — it propagates like a virus along data-flow, stopped only by an explicit return type or a strict gate. Keep the untyped surface in a named adapter file, parse to a typed model on the way out, and lint-fail inward `Any`.
3. **Gate the boundary list.** Maintain (and review) the set of edges that must validate — external input, network, files, untyped libraries — so a new edge added without a parser is caught in review, not in production.

**Cannot catch — so add the next source:**
- **Well-shaped but wrong data.** A perfectly valid `Order` with a negative total that your *business rule* forbids — validation confirms the *shape*, not the *meaning*. → **Behavior tests** (and validators that encode the rule, but the test proves the rule fires).
- **Faults after the edge.** Once the data is in and typed, a downstream timeout or arithmetic fault is not a boundary concern. → **Structured errors.**
- **Failures only the production environment produces.** A boundary you didn't know existed because it only appears under real traffic. → **Observability.**

---

## SOURCE 3 — Behavior tests

The signal for the failure class types fundamentally cannot express: *the code runs, type-checks, parses its inputs — and does the wrong thing.* A test is also the only feedback source that doubles as an executable **spec the next stateless session inherits** — a legible, one-reason-to-fail test is the clearest statement of intent an agent ever reads.

**Owns:** invariants types can't encode. Off-by-one, wrong sort order, a dropped field on round-trip, a discount applied twice, a state machine that reaches a forbidden state. The bug that survives a green checker and a clean parse.

**Six-dimension profile:**

| Dimension | Grade | Why |
|---|---|---|
| Fast | ★★☆ | A fast unit suite returns in the loop; broad integration/E2E suites drift right. Keep the inner loop fast (see `flightline` on CI budget). |
| Local | ★★☆ | A focused unit test points near the fault; a broad E2E says "the journey failed" without saying where. |
| Attributed | ★★★ | *Only if designed for it:* one behavior per test, one reason to fail, an expected-vs-actual message. A test asserting five things attributes nothing. |
| Deterministic | ★★☆ | **The flake risk lives here.** Uncontrolled time/randomness/order/IO makes a test a non-signal. The determinism overlay in `assay` exists for exactly this. |
| Trustworthy | ★☆☆ | A passing test only covers the paths it *exercises*. Green tells you nothing about the untested branch — silence ≠ safety. |
| Un-fakeable | ★☆☆ | The single most game-able source: delete the assertion, `skip`/`xfail`, loosen the matcher, lower the coverage floor. Gated below. |

**How far left:** the fast unit subset belongs in the agent's loop (one command, pre-commit). Integration, contract, and E2E suites sit further right (PR/CI). Push each *individual* test as far left as its scope allows — a behavior testable at unit scope should not wait for an E2E run.

**Make it un-fakeable** — this is where an agent games hardest, so the gate is the heaviest:

1. **Gate the suite and gate the test changes.** Tests run blocking in CI, and *diffs to tests are reviewed as carefully as product code* — "did the agent delete/`skip`/weaken an assertion to go green?" is a required review question (`flightline` SHIFT 3).
2. **Regression-first.** A test added with a fix must **fail on the unfixed code first**, so the gate can't be satisfied by an empty or always-green test.
3. **Mutation testing where stakes justify it.** Line coverage is game-able by deleting assertions (the line still runs, coverage stays green); mutation testing (`mutmut`/`cosmic-ray`, Stryker, PIT, `cargo-mutants`) introduces a fault and checks a test *catches* it — a surviving mutant is a test with no teeth. This is the un-fakeable backstop for "the test asserts nothing."
4. **Coverage read as a map, not a number.** Use coverage to *locate untested paths*, not to chase a percentage — see the absence note below.

**Cannot catch — so add the next source:**
- **Faults you didn't think to test.** A test only checks the cases you wrote; the unanticipated runtime fault still needs to fail loudly on its own. → **Structured errors.**
- **Failures that only exist under production scale/data/config.** No fixture reproduces them. → **Observability.**

> **Seam:** designing *which* tests, at what scope, with what doubles and cases, is the `assay` skill's whole job — its own decision-tree engine does the selection. `gauge`'s narrower job is only to ensure each behavioral failure mode from STAGE 0 *has* a test that fails clearly and un-fakeably. Do not reimplement test design here.

---

## SOURCE 4 — Structured errors

Not a tool you install but a *discipline in how the code fails*: when a runtime fault is unavoidable, make the fault itself a clear signal instead of a generic crash three layers from its cause.

**Owns:** runtime faults — the failure that is legal at the type level and got past the boundary. A lookup miss, a divide-by-zero, an exhausted retry, a precondition violated mid-flow. The question is not "can this fail" (it can) but "*when it fails, is the signal clear?*"

**Six-dimension profile:**

| Dimension | Grade | Why |
|---|---|---|
| Fast | ★★☆ | Fires the instant the fault occurs at runtime — in a test or in prod, depending where the path runs. |
| Local | ★★☆ → ★★★ | **Depends entirely on discipline.** A structured error raised *at the site* with context is sharply local; a generic exception swallowed and re-raised three frames up is the opposite. |
| Attributed | ★★☆ → ★★★ | Same: a typed error that names the cause and includes the offending values attributes precisely; a bare `Exception("error")` attributes nothing. |
| Deterministic | ★★★ | The same fault path produces the same error — *if* you didn't paper over it with a retry. |
| Trustworthy | ★★☆ | Fail-loud is trustworthy; a swallowed exception (`except: pass`) is the opposite — it turns a fault into silence. |
| Un-fakeable | ★★☆ | An agent silences these by swallowing, broadening the `except`, or wrapping in a retry. Gated below. |

**How far left:** errors-as-values pull a *foreseeable* fault all the way left into the type signature (the checker forces the caller to handle the `Err` branch — see SOURCE 1's design move). For the *exceptional* channel that survives underneath (any code or library can still raise), the discipline is to fail at the site: raise a specific, named error carrying the cause, and wrap library raises into `Err` in the adapter module rather than letting a raw third-party exception travel inward.

**Make it un-fakeable:**

1. **Ban the silencer.** A bare `except: pass` / empty `catch {}` / `except Exception` that swallows is the agent's reflex for making a fault disappear. Lint-flag overly broad and silent handlers; require either handling or re-raising with context.
2. **No fault-masking retries.** A `retry` wrapped around a deterministic failure converts a clear red into intermittent green — a flake the agent manufactured. Ban retries-as-error-suppression in review; retries belong only around genuinely transient I/O, with a budget, not around logic faults.
3. **Specific errors, not generic.** Lint/review for `raise Exception("...")` / `throw new Error("...")` with no type and no context on consequential paths — a generic message is an unattributed signal.

**Cannot catch — so add the next source:**
- **The fault you never see because the agent isn't in production.** A structured error is only a signal to *someone watching*. In prod, the someone is the telemetry pipeline. → **Observability.**
- **Wrong-but-not-erroring behavior.** Code that produces a wrong answer without raising at all. → **Behavior tests.**

---

## SOURCE 5 — Observability

The signal for the one failure class the agent structurally **cannot feel**: the fault that only happens in production, under real data, real scale, real concurrency, real config — long after the agent's loop has closed.

**Owns:** production-only failures. A race that only manifests under concurrent load, a slow query that only bites at real table size, a config that's wrong only in prod, an integration that drifts only against the live upstream. None of these reproduce in the editor or the test suite; without telemetry they are *invisible* to an agent.

**Six-dimension profile:**

| Dimension | Grade | Why |
|---|---|---|
| Fast | ☆☆☆ | The rightmost signal — lands minutes to hours after the act, in production. This is its defining weakness, and why you push every *other* failure class off it and onto a leftward source. |
| Local | ★★☆ | A trace with spans and a correlation ID can pin the failing call; raw unstructured logs cannot. |
| Attributed | ★★☆ | Structured logs/spans with context attribute well; a wall of `print` lines does not. |
| Deterministic | ★☆☆ | Production is non-deterministic by nature — the value is in *aggregates and traces*, not in a single reproducible signal. |
| Trustworthy | ★★☆ | A real failure produces real telemetry — but only for the paths you instrumented; an un-instrumented path fails silently. |
| Un-fakeable | ★★☆ | Hard for an agent to fake (it's real production behavior), but easy to *under-instrument*; gated below. |

**How far left:** structurally the rightmost — and that is the point. Observability is the *backstop of last resort*, the safety net for failure classes that genuinely cannot be caught earlier. The design discipline is the inverse of the others: **minimize what you rely on it for** by pushing every catchable failure class left onto types/boundaries/tests/errors, so that what reaches observability is only the genuinely production-only residue.

**Make it un-fakeable** (here it means "make the signal real and complete," not "stop an agent gaming a green light"):

1. **Structured, not free-text.** Structured logs (key-value/JSON), traces with spans, and correlation IDs so a failure is queryable and a request is followable across services — not `print` debugging an agent can't aggregate.
2. **Instrument the consequential paths.** The high-blast-radius operations from STAGE 0 (money, auth, data integrity) must emit telemetry; an un-instrumented critical path is a silent failure surface.
3. **Ensure the hooks exist.** `gauge`'s job stops at *the hooks are present and the consequential paths emit*. *Operating* the pipeline — dashboards, alert thresholds, on-call, retention — is the `flightline` skill's job; do not reimplement it here.

**Cannot catch:**
- **Nothing further right** — this is the last net. Everything it catches *should ideally have been caught left of it*; a failure that reaches observability and *could* have been a type error, a boundary parse, or a test is a signal that the left-of-it sources have a gap to close. Read production incidents back as instructions for which earlier source to strengthen.

---

## The absence problem — make "not checked" a signal (cross-cutting)

Three of the five sources share one weakness on the **trustworthy** axis: they are silent about what they *didn't* check. A checker says nothing about an `Any` path; a test says nothing about an unexercised branch; observability says nothing about an un-instrumented call. An agent reads silence as safety — and that is precisely where the residual risk hides. The single move that neutralises this (the one move that closes the gradual-typing weakness) is to **make absence itself a signal**:

| Source | Silent about | Turn the silence into a signal |
|---|---|---|
| Static types | `Any` / unannotated paths | Checker reports unknown/`Any` types (`mypy --disallow-any-explicit`, pyright unknown diagnostics, eslint `no-explicit-any`). |
| Behavior tests | Unexercised branches & teeth-less tests | Coverage read as a *map of untested paths*; mutation testing surfaces assertion-free tests. |
| Observability | Un-instrumented paths | Audit critical paths for telemetry; an alert for "no signal where one is expected" (operated by `flightline`). |

This is the heart of STAGE 4's `absence-is-a-signal` check. The point is not 100% — it is that the *gap is visible* instead of silent, so the agent (and the reviewer) can see exactly what was never checked. See [honest-ceiling.md](honest-ceiling.md) for why the gap never closes to zero.

---

## Summary — the five sources across the six dimensions

Grades are *typical* (★★★ strong, ★★☆ conditional, ★☆☆/☆☆☆ weak); several are conditional on the gate being in place — an ungated source forfeits its **un-fakeable** and **trustworthy** grades entirely.

| Source | Owns | Fast | Local | Attributed | Determ. | Trust. | Un-fakeable | Leftmost home |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **Static types** | shape / contract | ★★★ | ★★★ | ★★★ | ★★★ | ★☆☆† | ★☆☆‡ | editor / LSP |
| **Boundary validation** | bad external data | ★★☆ | ★★★ | ★★★ | ★★★ | ★★★ | ★★☆‡ | edge function (runtime) |
| **Behavior tests** | wrong behavior | ★★☆ | ★★☆ | ★★★§ | ★★☆§ | ★☆☆† | ★☆☆‡ | unit: pre-commit; rest: CI |
| **Structured errors** | runtime faults | ★★☆ | ★★☆§ | ★★☆§ | ★★★ | ★★☆ | ★★☆‡ | signature (Result) / site |
| **Observability** | production-only | ☆☆☆ | ★★☆ | ★★☆ | ★☆☆ | ★★☆† | ★★☆ | production (rightmost) |

† weak on **trustworthy** because silent about what it didn't check — recover with the absence table above. ‡ the **un-fakeable** grade is *contingent on the STAGE 4 gate*; ungated, it drops to ☆☆☆. § conditional on design discipline (one-behavior-per-test, fail-at-site).

**How to read the table:** scan a *row* to see what one source costs you on each axis; scan a *column* to see which source to lean on for a given axis. No row is all ★★★ — that is the thesis. The job is to lay the sources side by side so that for *every* failure class from STAGE 0 there is at least one source graded ★★★ (or gated up to it) on the axes that matter for that class, and to push each as far left as its leftmost-home column allows.

---

## Strictness by risk (够用就好)

Every card above describes the *full* instrumentation a source can carry. You do not apply all of it everywhere. **High-blast-radius, durable, frequently-changed paths earn the rich version** — strict types *and* boundary parse *and* behavior tests *and* mutation testing *and* observability. **Trivial, stable, low-risk code earns almost none of it.** Over-instrumenting a throwaway helper produces noise, and noise buries the real signal exactly as silence does. STAGE 0 sets the dial per path; [decision-tree.md](decision-tree.md) holds the scoring engine that turns blast-radius into a per-path instrumentation level.

---

## Where the sources meet the sibling skills

`gauge` wires these five sources together and ensures each failure mode has a clear, un-fakeable signal; it does **not** reimplement the siblings that own depth in three of them:

- The **contracts and boundaries** being instrumented are `load-bearing`'s architecture decisions — `gauge` makes them emit signal, it does not design them.
- The **behavior tests** (SOURCE 3) are designed in `assay` — its decision tree picks the type, scope, doubles, and cases; `gauge` only ensures the behavioral modes from STAGE 0 each have a clearly-failing test.
- The **gate pipeline** (CI/pre-commit that makes every source un-fakeable) and the **production observability** (SOURCE 5) are operated by `flightline` — `gauge` ensures the hooks exist and the gates are wired; `flightline` runs them.

For the language-specific tool names and copy-usable configs that realize each source, go to [python-recipe.md](python-recipe.md) or [typescript-recipe.md](typescript-recipe.md). For the irreducible limits no amount of instrumentation removes, go to [honest-ceiling.md](honest-ceiling.md).

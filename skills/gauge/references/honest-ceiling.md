# The Honest Ceiling

`gauge`'s **STAGE 4 (Trustworthy)** opens this file. By that stage you have a strict checker gated, boundaries validated, errors-as-values, and observability hooks — the machinery that produces the *experience* of a static language. This reference is the counterweight: it states plainly what that machinery does **not** buy you, so the skill does not oversell a green checker as a correctness proof. Its job is to keep you from the two false beliefs an agent slides into — "the checker is green, therefore the code is correct" and "no signal fired, therefore this path is fine" — and to give the one move that converts the residual risk from *silent* into *visible*. Read it as the place where you decide what to claim to the user and what to leave honestly uncovered.

---

## The two sentences this whole file defends

> **Gradual ≠ sound. Green ≠ proof.**

A gradually-typed checker (pyright, mypy, `tsc`) is not a *soundness proof*: it does not guarantee the absence of the errors it checks for. It guarantees that *the parts it actually checked* are consistent with the annotations it was given. Two gaps make the difference between "checked" and "proven", and both are structural, not bugs you can configure away:

1. **Runtime erasure** — types are erased before the code runs, so at every edge where real or untyped data enters, a static type is a **claim**, not a check. Nothing at runtime enforces that the `User` you annotated is shaped like a `User`.
2. **Gradualness** — an unannotated path, or one tainted by `Any`/`any`, is **not checked at all**. The checker reports green because it had nothing to disagree with, not because it found the path correct.

Both are **recoverable per-site** — validate at the boundary closes (1); gate `Any` closes (2) — but neither is recoverable **for free** or **universally**. You buy down the residual site by site. You asymptote toward total coverage; you never arrive. The skill's promise is the *feel* of a static language, delivered by config and discipline, not the *soundness* of one.

---

## Why this is an agent problem specifically

A human carries the residual in their head: they *remember* that the `parse_response` helper takes `Any` and is therefore unchecked, and they instinctively distrust its output. An agent has no such memory. It reads the green checker as a total verdict over the whole codebase and the absence of a signal as a clean bill of health. So the gap that a human silently compensates for is exactly the gap an agent walks straight into. The residual is not just "smaller for static languages" — for an agent it is *invisible unless you make it visible*, which is what [agent-feedback-shifts.md](agent-feedback-shifts.md) means by "the agent reads absence as safety." This file's central move (make "unchecked" a signal) exists because the agent cannot supply the missing distrust itself.

---

## The two irreducible residuals, as must-be-told cards

Each residual gets a four-field card: what the textbook (or a salesperson) would assume, what actually breaks, what that forces, and the literal move that bounds it.

### RESIDUAL 1 — Runtime erasure: a static type is a claim until validated

| Field | Content |
|---|---|
| **THE OVERSELL** | "The function is typed `(req: CreateUser) -> User`, so by the time the body runs, `req` *is* a `CreateUser`." The annotation reads like a guarantee about runtime values. |
| **WHAT ACTUALLY HOLDS** | The annotation is erased before execution. It constrains *callers the checker could see*; it does **nothing** to a value arriving from JSON, a DB row, an env var, a `pickle`, an untyped library, or any reflection-built object. At those edges the type is a sentence you wrote, not a fact the runtime enforces. A malformed payload satisfies the annotation and explodes three layers in, far from the edge, with a signal that points at the wrong place. |
| **WHAT IT FORCES** | You cannot *assert* the type at a boundary (a `cast` / `as` is just a louder claim). You must **parse** untrusted data into the typed model at the edge, so a bad shape fails *there*, attributed to the offending field. This is the entire reason STAGE 2 exists — see [feedback-sources.md](feedback-sources.md) for which edges count and [python-recipe.md](python-recipe.md) / [typescript-recipe.md](typescript-recipe.md) for pydantic/zod parse-at-the-boundary. |
| **THE BOUNDING MOVE** | At every external edge, replace `cast(T, data)` / `data as T` with `T.model_validate(data)` / `Schema.parse(data)`. The residual shrinks to exactly the edges you have not yet parsed — a finite, enumerable list, not a fog. |

> The recovery is **per-site**: each unvalidated edge is a hole, each `parse` closes one. It is not free (you write and maintain the schema) and not universal (you must find every edge). You are buying the runtime check the static language never gave you in the first place.

### RESIDUAL 2 — Gradualness: an `Any`/unannotated path is unchecked = no signal

| Field | Content |
|---|---|
| **THE OVERSELL** | "The checker is green across the whole repo, so the whole repo is type-checked." Green is read as total coverage. |
| **WHAT ACTUALLY HOLDS** | Gradual typing means unannotated code and anything typed `Any`/`any` is **exempt** from checking, and the exemption **propagates**. One inward `Any` silently disables checking on every value derived from it, flowing along the data path like a stain until something gives it an explicit type or a strict gate stops it. Green over an `Any`-tainted region is not "checked and fine" — it is "the checker was told to look away." The dangerous part is that this looks *identical* to a genuinely-checked green. |
| **WHAT IT FORCES** | "Not annotated" and "fine" must stop being indistinguishable. The checker has to *report* where it gave up (unknown/`Any` types), and the escape hatches that re-open the exemption (`# type: ignore`, `cast`, `as any`, `@ts-ignore`) must be gated, not free — see the STAGE-4 un-fakeable gate and [agent-feedback-shifts.md](agent-feedback-shifts.md) on signal-gaming. |
| **THE BOUNDING MOVE** | Turn on the "report what I couldn't check" knobs (next section), then drive the reported count down and gate it so it can't climb back. The residual becomes a *number you can see and bound*, not a silent region. |

> Again **per-site, not free, not universal**: each `Any` you replace with a real type closes one hole; you will not reach zero on a real codebase with third-party `Any` and dynamic corners, and chasing literal zero is itself a waste (see "the practical end-state").

---

## THE ONE MOVE — make "unchecked" itself a signal

The weak dimensions among the six are **trustworthy** and its corollary **absence-is-a-signal**: green must mean good, and *silence* must mean "checked and fine", not "never looked at". The single move that neutralises the gradual-typing weakness is to make *not-checked* emit a signal of its own. Three instruments, one per kind of silence:

| Silence | Instrument | What it converts silence into | Gate it with |
|---|---|---|---|
| Unknown / `Any` types the checker skipped | **checker's own report-on-unchecked mode** | a count + locations of expressions the checker could not verify | fail the build if the count rises |
| Code paths no test ever ran | **coverage read as a map of untested paths** | a list of lines/branches with no behavioral signal | a floor that blocks merge below threshold |
| Tests that run a path but assert nothing | **mutation testing** | surviving mutants = assertions with no teeth | run on high-stakes modules; fail on survivors |
| One rule encoded twice, in opposite directions | **twin-predicate diff** | a divergence silent today that flips wrong under the next state added | a review/CI check on duplicated predicates; one named set both consume |

The literal knobs:

```toml
# pyproject.toml — pyright / basedpyright: make "I couldn't check this" loud
[tool.pyright]
typeCheckingMode = "strict"
reportUnknownVariableType = "error"
reportUnknownMemberType  = "error"
reportUnknownArgumentType = "error"
reportUnknownParameterType = "error"
reportMissingTypeStubs = "error"
reportUnnecessaryTypeIgnoreComment = "error"  # an ignore that no longer suppresses anything is itself a signal
```

```ini
# mypy alternative — refuse to let Any pass silently
[mypy]
strict = True
warn_return_any = True
disallow_any_explicit = True
disallow_any_generics = True
warn_unused_ignores = True
```

```jsonc
// tsconfig.json — TS has no "report Any" flag, so you ban Any at the lint layer instead
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true } }
// + typescript-eslint: no-explicit-any, no-unsafe-assignment/-call/-member-access/-return as ERRORS
```

```bash
# coverage as a map, not a number — and mutation to test the tests
pytest --cov --cov-report=term-missing --cov-fail-under=<floor>   # the "Missing" column IS the map
mutmut run        # Python: surviving mutant = an assertion that wasn't there
npx stryker run   # TypeScript: same idea
```

The point of all three: an agent that reads a number it can see will act on it; an agent that reads silence will declare victory. You are giving the residual a face.

### Mutation testing only counts if it actually runs

A mutation tool is itself a signal source, so the skill's own rule applies to it: **a mutation gate that lies is worse than none.** Before trusting "0 survivors", confirm the mutants are actually exercised — the cheap sanity check is to hand-introduce one trivial mutant (flip a `>` to `>=`, delete a `return`) and confirm the suite kills it. If that "survives", the tool is testing nothing and every result it gives is noise. Two ways it silently lies, both seen in the field:

- **In-process / source-rewriting mutators on I/O-driven code.** `mutmut` rewrites source and re-runs the suite in-process; against code driven by file descriptors, sockets, or subprocesses, a mutated path can *segfault* the runner rather than fail a test — you get aborts and garbage, not a clean killed/survived verdict.
- **`src`-layout + editable install (import-path mismatch).** If the mutator mutates files in one place but the runner imports the package from another (`pip install -e .` resolving to the original `src/`), every test runs against the *unmutated* module and **every mutant "survives"** — a confident, wrong "all survived" that reads as "your tests have no teeth" when the tool actually tested nothing. A false *all-survived* is worse than no signal.

When the tool can't run faithfully on a module, don't ship it as a gate. Prefer a **rebuild-based mutator** with no import-path ambiguity — `cargo-mutants` (Rust) compiles each mutant, Stryker (TS/JS) instruments the build — or skip mutation there and lean on the other absence-signals (the coverage map, test diversity, any cross-implementation conformance/contract suite). An honestly-incomplete coverage map beats a confidently-false mutation score.

### The fourth silence — twin predicates that drift

The three silences above are each about *one* site (an unchecked type, an untested path, an assertion-free test). There is a fourth that lives in the *relationship between two* sites, and it is the one a strict checker and a green suite both sail straight over: the **same piece of knowledge encoded twice, in opposite directions,** so the two copies agree today and silently disagree the moment the state space grows. The canonical shape:

```python
# reports.py — "what counts as revenue-bearing", written as a WHITELIST
def revenue(orders):
    return sum(o.amount for o in orders if o.status in ("paid", "shipped"))

# elsewhere — "what counts as active", the SAME set, written as a BLACKLIST
def active_count(orders):
    return sum(1 for o in orders if o.status not in ("cancelled", "pending"))
```

Today both pick out `{paid, shipped}`. They are one piece of knowledge — *which states are live* — wearing two encodings. Now add a `delivered` state, and the two diverge **with no signal at all**: the whitelist *excludes* `delivered` (revenue silently under-counts — but at least it waits for a human to add the state), while the blacklist *includes* it (`delivered` is silently counted active, and no one was asked whether that is right). Nothing fails. No type is unknown, no path uncovered, no assertion missing. Both the checker and the suite are green over a logic error now in production.

Two moves convert this silence into a signal:

- **The whitelist/blacklist asymmetry — prefer the encoding that fails loud under extension.** A whitelist (`status in {…}`) **fails safe**: a newly added state is excluded by default, so the worst case is a too-small result waiting for someone to notice. A blacklist (`status not in {…}`) **fails silent**: a new state is *admitted* by default, quietly changing behaviour with no one in the loop. When a predicate enumerates membership, prefer the whitelist form, and pair it with the exhaustiveness machinery (the `assert_never` move / STAGE 1) so adding a state forces a checker error at the *definition* rather than a silent shift at every use site.
- **Name the set once; make both sites consume it.** The real cure is to refuse the duplication — give the knowledge a single home and a name, and the divergence becomes impossible to construct:

```python
REVENUE_BEARING = {Status.PAID, Status.SHIPPED}        # the ONE definition
ACTIVE          = REVENUE_BEARING - {Status.DELIVERED}  # forced to answer: is delivered active?

def revenue(orders):      return sum(o.amount for o in orders if o.status in REVENUE_BEARING)
def active_count(orders): return sum(1 for o in orders if o.status in ACTIVE)
```

Naming does more than de-duplicate: an *anonymous* predicate (`status not in ("cancelled","pending")`) has no one forced to define its semantics, so when a state is added no one is asked the question. A *named* set (`ACTIVE = REVENUE_BEARING - {Status.DELIVERED}`) cannot be written without answering "is `delivered` active?" — the name drags the silent decision into the open. **The review reflex:** the instant you see a duplicated predicate, *diff its copies* — identical means the knowledge is still latent (de-duplicate before it forks), already-diverged means you are not looking at a smell but at a live bug (a `> 365` here and a `>= 365` there is a customer-facing inconsistency, not a style nit). This reflex earns its keep especially against agent-written code, which is a prolific source of near-identical copies. (The duplication-as-knowledge framing is `plumb`'s Lens 4; the single-named-set and the `assert_never` exhaustiveness are this skill's STAGE 1 — this section is *why* the drift is a silence STAGE 4 must make audible.)

---

## How far the matching actually goes — the honest comparison table

The fair comparison is **narrow**, not "Python is now as safe as Rust." Break "correct" into the classes a checker can own and state, per class, whether a gated strict Python/TS setup **matches** a static language or merely **approximates** it:

| Failure class | Static-language guarantee | Can strict Python / TS match it? | What it costs you |
|---|---|---|---|
| Exhaustiveness (closed union, all cases) | total — compiler errors on a missing arm | **MATCH** | `match` + `typing.assert_never` (Py) / `never`-default arm + `assertNever` (TS); the checker errors on the missing case exactly like a compiler |
| Null / absence | total — no null unless declared | **MATCH** | strict Optional (Py) / `strictNullChecks` (TS); narrow before use |
| Shape / contract of *internal* values | total — checked at compile time | **MATCH within the checked region** | strict mode + typed records, no untyped bags |
| Shape of values *crossing a boundary* | total — the type is real at the edge | **APPROXIMATE** — types are erased, so you must add a runtime parse | pydantic / zod at every edge (RESIDUAL 1); the gap = unparsed edges |
| Anything touched by `Any`/`any` | n/a — the language has no such hole | **APPROXIMATE** — gradualness leaves it unchecked | ban + gate + report `Any` (RESIDUAL 2); the gap = remaining `Any` |
| Behavioral correctness | **NOT covered even by Rust** | n/a — needs tests, not types | this is `assay`'s job; no type system gives it |

Two readings to take from this table:

- **Even Rust's totality is bounded.** It is total over *a class* — types, memory safety, null, exhaustiveness — not over **behavioral correctness**. A Rust program that compiles can still compute the wrong answer. So "we don't have Rust's soundness" overstates the loss: on the two classes that matter most for the hand-feel (exhaustiveness, no-null) you **match** it, and on the class neither language covers (behavior) you were always going to need tests regardless of language.
- **The only genuine gaps** versus a static language are the two residuals: erasure (recovered by runtime validation) and gradualness (recovered by banning/gating `Any`). Name exactly those when you set expectations — not a vague "it's not really type-safe."

---

## What to claim, and what not to — a decision fork

When you report STAGE-4 status to the user, you will be tempted to round up to "type-safe" or round down to "it's not really checked." Both are wrong. Use this fork.

- **PREDICATE:** for the path in question, is every external edge parsed (RESIDUAL 1 closed) **and** is it free of inward `Any` with the checker's unknown-type report clean over it (RESIDUAL 2 closed)?
- **DEFAULT** when it is a coin-flip whether a given edge or `Any` is closed: treat the path as **not yet** at the ceiling and say so — claiming coverage you don't have is the exact failure this file guards against; the cost of under-claiming is a few minutes of an agent double-checking, the cost of over-claiming is a silent hole shipped as "safe."
- **FALLBACK** when you cannot tell whether an edge is parsed or an `Any` is contained: that uncertainty *is* the answer — the path is in the residual. Surface it as visible-residual (the one move), don't assume it closed.

Claim, when the predicate holds: *"On this path the checker is green as a hard gate, every edge validates at runtime, and the residual `Any` is acknowledged, localised, and reported — so green here is trustworthy."* Never claim: *"the types prove this is correct."* They prove a class of *shape* errors absent on the *checked* region; they prove nothing about behavior, and nothing about a path the checker was told to skip.

---

## The practical end-state — and why it is NOT "zero `Any`"

The target you actually ship is not a token count of zero. Chasing literal `Any: 0` on a real codebase means fighting third-party stubs, dynamic metaprogramming, and legitimately-untyped corners — high effort, and it produces the same *noise* that over-instrumenting trivial code does. The honest, sufficient end-state (够用就好) is three properties, in order:

1. **The strict checker is green as a hard merge gate** — unenforced strictness does not exist for an agent (it walks past a warning).
2. **Every external edge validates at runtime** — RESIDUAL 1 is closed on the paths that carry untrusted data, weighted by blast radius.
3. **The residual `Any` is acknowledged, localised, and *visible*** — contained to thin edge adapters, never flowing inward, and counted by the checker's unknown-type report so it cannot silently grow. The residual is **bounded and seen**, not **eliminated**.

That third property is the whole thesis of this file: you do not remove the residual, you move it from *silent* to *signalled*. A codebase with twelve `Any`s the checker reports and gates is in a far better state than one with three `Any`s nobody can see.

---

## Escalation ladder — when you can't tell if a residual is closed

Uncertainty about whether a path is at the ceiling rises in rungs; climb one at a time rather than guessing, because guessing-it's-fine is precisely the agent failure mode this file exists to stop.

```
turn on the report-on-unchecked knobs and re-read the path
   → the checker now names the unknown/Any sites → close them per-site (parse the edge / type the value)
      → still can't tell if an edge is reachable by untrusted data → trace it back to its source;
        if any source is external, treat it as a boundary and parse
         → mutation-test the path's tests → surviving mutants mean the behavioral signal has no teeth
           regardless of the types; fix the assertions (this is assay's territory)
            → still ambiguous → ask the user where the risk tolerance sits for THIS path, and
              record the remaining residual in writing as accepted, not silently assumed closed.
```

The asymmetry that governs the ladder, same as everywhere in the skill: an over-cautious "this path is still residual" costs an agent a few minutes of verification; an over-confident "this is type-safe" ships a silent hole that fails in production where the agent cannot feel it. When it is a toss-up, mark it residual and make it visible.

---

## Where this sits

This file is the truth-in-advertising layer over the rest of `gauge`. The mechanics it sets honest expectations about live in [feedback-sources.md](feedback-sources.md) (which source owns which failure class), [python-recipe.md](python-recipe.md) and [typescript-recipe.md](typescript-recipe.md) (the concrete stacks and their per-language limits), and the routing that decides where to spend effort lives in [decision-tree.md](decision-tree.md). Why the residual matters more for an agent than a human — statelessness, signal-gaming, absence-as-safety — is [agent-feedback-shifts.md](agent-feedback-shifts.md). The behavioral correctness that *no* type system covers is designed in `assay`; the production observability that catches the failures the agent cannot feel is operated by `stationkeeping`; the contracts and boundaries being instrumented are `load-bearing`'s decisions. `gauge`'s honest claim, stated here so the skill makes it nowhere louder: you get the *experience* of clear static feedback with the gap made *visible* — not a soundness proof. Return to [../SKILL.md](../SKILL.md) STAGE 4 to clear the final gate.

# Property-Based Testing

This document is the deep-dive companion to the **property-based** branch of the [type-selection decision tree](decision-tree.md). Reach for it once you've decided (in [evidence-catalogue.md](evidence-catalogue.md)) that a unit of behavior is a candidate for property testing; it tells you how to find properties, build generators, and harden the result into a durable regression.

## When to reach for it

Property-based testing (PBT) generates many random inputs and asserts a *property* — a statement that must hold for *all* valid inputs — rather than hand-picking input/output pairs. Use the decision below; it slots into the **Choose** stage.

| Signal | Lean property-based | Lean example-based |
|---|---|---|
| Input space | Large / combinatorial | Small, enumerable |
| Specification | A checkable invariant exists ("output is always sorted") | Behavior is a lookup table of cases |
| Oracle | Reference impl, inverse, or model available | Only known by worked examples |
| Bug class feared | Unanticipated edge cases | Specific known regressions |
| Cost of a wrong answer | High (parsers, serializers, money, crypto-adjacent) | Low / cosmetic |

**Strong fit:** serializers/parsers, encoders, data-structure operations, numeric/financial routines, query planners, anything with an algebraic flavor.

**Do NOT reach for it when:**
- You cannot state a property more cheaply than re-implementing the function (the test becomes a second buggy copy).
- The behavior is inherently example-shaped (UI copy, specific business rules, fixed mappings).
- Inputs can't be generated without effectively encoding the answer.
- Determinism is not yet under control — fix that first (see [determinism-and-flakiness.md](determinism-and-flakiness.md)).

PBT complements rather than replaces example-based tests. A typical unit keeps a handful of pinned examples (including every discovered counterexample) *plus* one or two properties.

## How to find properties

The hardest part of PBT is naming a true, non-trivial property. Work through this catalog — most code satisfies at least one.

| Pattern | Shape | Example |
|---|---|---|
| **Roundtrip / inverse** | `decode(encode(x)) == x` | serialize↔parse, compress↔decompress, encrypt↔decrypt |
| **Idempotency** | `f(f(x)) == f(x)` | normalize, dedupe, sort, `saturate`, clamp |
| **Commutativity** | `f(a,b) == f(b,a)` | set union, `max`, merge |
| **Associativity** | `f(f(a,b),c) == f(a,f(b,c))` | reducers, monoid folds |
| **Monotonicity** | `a ≤ b ⟹ f(a) ≤ f(b)` | rate limits, scoring, indexes |
| **Conservation / invariant** | A quantity is preserved or bounded | sort preserves multiset & length; a transfer preserves total balance |
| **Oracle / model** | `f(x) == reference(x)` | new fast impl vs. slow obvious impl; cache vs. source of truth |
| **Metamorphic** | Relate outputs of *related* inputs without knowing either output | `sin(x) == sin(x + 2π)`; adding an irrelevant filter doesn't change a search ranking's top hit |
| **Never crashes / well-formed** | For all valid input, `f` returns and output satisfies a structural check | parser never throws on UTF-8; emitted JSON always re-parses |

Practical tips:
- **Roundtrip is the highest-leverage property** — start there for anything that converts between representations. Mind asymmetry: `encode(decode(y)) == y` only holds if every `y` is canonical; for lossy/normalizing codecs assert `decode(encode(x)) == decode(encode(decode(encode(x))))` (idempotent canonicalization) instead.
- **Metamorphic relations** rescue you when no oracle exists: you can't say what the output *is*, only how it must *change*. Underused and very powerful for ML, search, and numerics.
- **Model-based** properties shine when an obvious-but-slow implementation exists; the slow one is your oracle.

See [probe-construction.md](probe-construction.md) for turning these into concrete assertions and choosing boundaries.

## Generator design

A property is only as good as the inputs it sees. Generators are where most of the engineering goes.

**Principles**

1. **Generate from your domain types, not raw primitives.** Compose small generators (`genUser = map2(genName, genEmail, User)`) so every produced value is structurally valid. This is *constructive* validity and is far better than generate-then-filter.
2. **Constrain to *valid* inputs, but no narrower.** A generator that's too narrow gives false confidence (it never explores the space); one that's too wide wastes runs on inputs your contract excludes. Match the generator to the function's actual precondition.
3. **Prefer construction over filtering.** Heavy `filter`/assume that rejects most candidates is slow and can starve (the framework gives up). If you reject >50% of draws, build the constraint into the generator instead (e.g. to get a sorted list, generate a list and sort it; to get `a < b`, generate `a` and a non-negative delta).
4. **Bias toward edge cases.** Random integers rarely hit `0`, `1`, `-1`, `MAX`, `MIN`, empty collections, single-element collections, duplicates, NaN, empty strings, or strings with newlines/Unicode/null bytes. Good frameworks inject these automatically; otherwise mix them in with a frequency/weighted combinator so they're over-represented.
5. **Control size.** Tie collection length and number magnitude to the framework's size parameter so small cases run early (and shrink well) and large cases still appear. Cap sizes so a single run stays fast — a generator that emits million-element lists will make the suite unusable.

**Composition combinators you'll use constantly:** `map`, `flatMap`/`bind` (dependent generation — pick a length, then generate that many), `oneOf`/`frequency` (tagged unions, weighted variants), `tuple`/`record`, and recursive generators with a depth bound for trees/JSON.

| Generator smell | Symptom | Fix |
|---|---|---|
| Too narrow | Property passes but bugs ship | Widen ranges; add edge-case bias; check coverage of produced values |
| Too wide | Spurious failures on out-of-contract inputs | Tighten precondition into the generator |
| Filter-heavy | Slow / "too many discards" | Construct valid values directly |
| Unbounded size | Suite is slow or OOMs | Scale with size param; cap maxima |
| Implicitly biased | Always even, never empty, etc. | Audit the distribution; sample and eyeball it |

## Shrinking

When a property fails, the framework **shrinks** the counterexample — repeatedly tries "smaller" inputs that still fail — to report the minimal reproduction. A 480-element list that fails is useless; `[0, 0]` that fails is a bug report.

Why it matters: shrinking is the single feature that makes PBT usable for debugging. Protect it.

- **Integrated shrinking** (Hypothesis, fast-check, Hedgehog-style) derives shrinking from how the value was *constructed*, so composed generators shrink correctly and **shrunk values stay valid by construction**. Prefer it.
- **Type-based shrinking** (classic QuickCheck/jqwik with separate `Arbitrary`/shrinker) requires you to keep the shrinker in sync with the generator. The classic trap: the shrinker produces values that violate the generator's invariant, so shrinking walks into an *invalid* input and reports a "failure" that's really a precondition violation.

Rules to keep shrinking meaningful:
- **Never let shrinking escape the valid domain.** If you used `filter`/assume, ensure the shrinker re-checks it (most frameworks re-apply `assume` during shrinking — verify yours does).
- **Shrink toward your real edge cases:** smaller numbers toward 0, shorter collections toward empty, characters toward `a`/`0`. Custom types need a defined notion of "smaller."
- If counterexamples look bloated, your generator is constructing values that don't shrink — switch to integrated shrinking or add shrink logic.

## Stateful / model-based testing

The high-value mode for systems with internal state: caches, connection pools, allocators, parsers with modes, databases, file systems, CRDTs, state machines.

Instead of one input, the framework generates a **random sequence of operations** (commands). You maintain a simplified **model** (e.g. a plain dictionary standing in for a key-value store) and, after each command, assert that the real system's observable state agrees with the model.

```
model         = {}                       # the simple reference
preconditions = which commands are legal given model
for cmd in generated_sequence:
    assume precondition(cmd, model)
    real_result  = system.apply(cmd)
    model        = model_step(cmd, model)
    assert postcondition(cmd, real_result, model)   # real agrees with model
```

Reach for stateful testing when:
- Bugs emerge from **interactions between operations**, not single calls (use-after-free, stale cache, ordering, concurrency-shaped state).
- You can write a model that's obviously correct because it's trivially simple.

Shrinking applies to the *command sequence* too — the framework minimizes to the shortest failing trace (often 2–3 operations), which usually points straight at the bug. This is frequently worth more than dozens of hand-written integration tests. Concurrency variants (parallel command execution checked for linearizability) exist but raise the determinism bar sharply — see [determinism-and-flakiness.md](determinism-and-flakiness.md).

## Fuzzing as a no-crash property

Fuzzing is PBT's "never crashes / always well-formed" property with a firehose of inputs (often coverage-guided, e.g. corpus-evolving fuzzers). The minimal valuable property: *for all byte inputs, the parser returns or raises a declared error — never a crash, hang, or undefined-behavior panic*. Wire your decoders/parsers to a fuzz target; persist the corpus. Security-grade fuzzing (sanitizers, taint, exploitability) is out of scope here — defer to dedicated security guidance.

## Reproducibility and regression-locking

Random tests are worthless if a failure can't be reproduced.

1. **Pin or print the seed.** Every PBT framework derives runs from a seed; on failure it prints the seed and the minimal counterexample. Capture both in CI logs. For local debugging, set the seed to replay an exact run.
2. **Decide your seed policy.** Random seed each CI run = maximum bug-finding but non-deterministic CI (a flake risk). Fixed seed = reproducible but explores less. Common compromise: fixed seed in CI for stability, plus a separate scheduled job with random seeds and a higher example count to keep hunting.
3. **Regression-lock every counterexample.** The moment a property finds a failing input, copy the *shrunk* value into an **example-based test** with a comment linking the cause. This guarantees the exact bug is checked on every run regardless of seed, and documents the case for the next reader. Many frameworks also persist a failing-example database — commit it, but don't rely on it as your only record.

## Pitfalls

| Pitfall | Why it bites | Mitigation |
|---|---|---|
| **Tautological / weak property** | `f(x) == f(x)` or asserting only the type; passes always, finds nothing | Ask "what input would break this?" If none, strengthen it |
| **Reimplementing the function as the oracle** | Test duplicates the bug; both wrong, property green | Use an *independent* oracle (inverse, model, simpler algorithm) |
| **Overfitting to the implementation** | Property encodes *how* code works, not *what* it guarantees; breaks on every refactor | Assert observable contract, not internal steps |
| **Non-deterministic property** | Depends on time, random, ordering, locale, threads → flaky | Inject/seed all nondeterminism; see [determinism-and-flakiness.md](determinism-and-flakiness.md) |
| **Flaky / starving generator** | Filter discards too much; framework bails with "too many discards" | Construct valid inputs directly |
| **Generator too narrow** | Green suite, real bugs unexercised | Audit distribution; add edge bias; pair with [coverage-and-mutation.md](coverage-and-mutation.md) |
| **Shrinking to invalid input** | Reported counterexample violates a precondition | Re-apply constraints during shrink; use integrated shrinking |
| **Too few examples** | Default run count too low to hit rare paths | Raise example count for high-risk units |

Use **mutation testing** to check that your properties actually constrain behavior: if you can mutate the implementation and every property still passes, the properties are too weak. See [coverage-and-mutation.md](coverage-and-mutation.md).

## A framework-neutral example

A property plus a constrained generator, in pseudo-code:

```
# Property: encoding then decoding round-trips; output is always well-formed.

gen Order:
    id     <- intInRange(1, 1_000_000)
    items  <- listOf(genItem, minLen=0, maxLen=20)   # includes empty list
    note   <- oneOf(genUnicodeText, constant(""))    # bias toward empty + weird text
    return Order(id, items, note)

property "order survives JSON round-trip":
    forall order in gen Order:
        bytes   = encode(order)
        assert  isWellFormedJson(bytes)        # never-crash / well-formed
        decoded = decode(bytes)
        assert  decoded == order               # roundtrip / inverse
```

The generator constructs only valid orders (no filtering), deliberately includes empty collections and awkward Unicode, and bounds list length so runs stay fast. On failure the framework shrinks `order` toward the smallest failing value and prints the seed; that shrunk value then becomes a pinned example-based test.

Mature implementations exist in most ecosystems — **fast-check** (JS/TS), **Hypothesis** (Python), **proptest** (Rust), **jqwik** (Java/JVM), **PropEr** (Erlang), among others. Choose the idiomatic one for your stack; the concepts above transfer unchanged. Integrated-shrinking frameworks generally cost you less ongoing maintenance.

## Where this fits

- Deciding *whether* to use PBT for a unit: [decision-tree.md](decision-tree.md), [evidence-catalogue.md](evidence-catalogue.md).
- Turning properties into concrete assertions and boundaries: [probe-construction.md](probe-construction.md).
- Keeping random tests reproducible and non-flaky: [determinism-and-flakiness.md](determinism-and-flakiness.md).
- Confirming properties are strong enough to catch real defects: [coverage-and-mutation.md](coverage-and-mutation.md).

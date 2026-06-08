# Python: A Static-Language Hand-Feel

This is the concrete Python stack for `gauge`. It is opened at **STAGE 1 (Static layer)** as the language recipe paired with [feedback-sources.md](feedback-sources.md), and stays open through **STAGE 2 (Boundary)** for the validation section. The goal is not to make Python *look* like Rust — `Result` and `match` are means, not the point. The goal is to reproduce the one property a good static language gives an agent: clear feedback at every step. Each piece below is mapped to the dimension it serves (fast / local / attributed / deterministic / trustworthy / un-fakeable) and the failure class it owns (shape, bad external data, behavior, runtime fault, production-only). Match the depth to risk — *够用就好*: a payments module earns the full stack; a one-off script does not. The honest limits are not an appendix here — read [honest-ceiling.md](honest-ceiling.md) alongside, because the residual gap is part of the spec.

## Contents

- [The stack at a glance](#the-stack-at-a-glance)
- [1. `uv` — the reproducible substrate (deterministic)](#1-uv--the-reproducible-substrate-deterministic)
- [2. The static checker — the "compiler" (fast, local, attributed)](#2-the-static-checker--the-compiler-fast-local-attributed)
- [3. `ruff` — annotations enforced, escape hatches banned (un-fakeable)](#3-ruff--annotations-enforced-escape-hatches-banned-un-fakeable)
- [4. Records, never untyped bags (local, attributed)](#4-records-never-untyped-bags-local-attributed)
- [5. Errors-as-values: a hand-rolled `Result` (local, attributed, un-fakeable)](#5-errors-as-values-a-hand-rolled-result-local-attributed-un-fakeable)
- [6. Exhaustiveness: `match` + `assert_never` (the static guarantee Python *can* match)](#6-exhaustiveness-match--assert_never-the-static-guarantee-python-can-match)
- [7. Boundary validation with `pydantic` (attributed, trustworthy) — STAGE 2](#7-boundary-validation-with-pydantic-attributed-trustworthy--stage-2)
- [8. STAGE 4 — make it un-fakeable and make absence visible](#8-stage-4--make-it-un-fakeable-and-make-absence-visible)
- [Honest limits (do not oversell)](#honest-limits-do-not-oversell)

---

## The stack at a glance

| Piece | Dimension it serves | Failure class it owns | Lives how far left |
|---|---|---|---|
| `uv` (interpreter + deps + lockfile) | deterministic, trustworthy | "works on my machine" / version drift | editor + CI |
| `pyright`/`basedpyright` strict (or `mypy --strict`) | fast, local, attributed | shape / contract errors | **in-editor** + pre-commit + CI |
| `ruff` (ANN rules, ban `Any`) | un-fakeable, local | un-annotated code, reached-for escape hatches | on-save + pre-commit + CI |
| `pydantic` at boundaries | attributed, trustworthy | bad external / untyped data | runtime, at the edge |
| frozen dataclasses / `NewType` / `Literal` / `Enum` | local, attributed | untyped-bag shape errors | compile-time (checker) |
| hand-rolled `Result` + `match`/`assert_never` | local, attributed, un-fakeable | unhandled runtime faults, missing cases | compile-time (checker) |

No single piece gives all six dimensions. You assemble them, and you gate every one (STAGE 4) — an ungated checker does not exist for an agent.

---

## 1. `uv` — the reproducible substrate (deterministic)

`uv` manages the interpreter, the dependencies, and the lockfile in one tool. It serves the **deterministic** dimension at the coarsest grain: the same `uv.lock` resolves to the same bytes on the agent's machine, in pre-commit, and in CI, so a signal that is green here is green there. Without a lockfile, a dependency bump silently changes behavior and the agent cannot attribute the new failure.

```toml
# pyproject.toml
[project]
name = "svc"
requires-python = ">=3.12"          # 3.12+ for the `type` statement + PEP 695 generics
dependencies = ["pydantic>=2.7"]

[dependency-groups]
dev = ["pyright>=1.1.370", "ruff>=0.6", "pytest>=8"]

[tool.uv]
# uv writes and maintains uv.lock; commit it.
```

```bash
uv sync            # create the venv, install pinned deps from uv.lock
uv run pyright     # run a tool inside that env — same env everywhere
uv lock            # refresh the lockfile when deps change (a reviewable diff)
```

- **PREDICATE:** is the project pinned by a committed lockfile? **DEFAULT** on a new project: yes, `uv` + committed `uv.lock`. **FALLBACK** if an existing project uses Poetry/pip-tools and a migration is out of scope: keep its lockfile, but require *a* committed lock — the dimension is "deterministic env", not "this exact tool".

The lockfile is also a `flightline` concern (reproducible builds, supply-chain). Here it matters only because a non-deterministic environment makes *every other signal* non-deterministic.

---

## 2. The static checker — the "compiler" (fast, local, attributed)

The strict type checker is the leftmost, cheapest signal and the closest thing an agent gets to a compiler: it runs **in the editor** as the agent types, before anything executes, points at the exact sub-expression, and says *why* (expected `X`, got `Y`). This is the single highest-leverage piece. Two viable engines:

### `pyright` / `basedpyright` (recommended)

Runs as the editor's language server *and* as a CLI gate — the same diagnostics in both, which is what makes the in-editor feel trustworthy. `basedpyright` is a fork with stricter defaults and a `reportAny` rule that directly serves "absence is a signal" (STAGE 4).

```toml
# pyproject.toml
[tool.pyright]
typeCheckingMode = "strict"            # turn the whole strict bundle on
pythonVersion = "3.12"
reportMissingTypeStubs = "error"       # an untyped dep is a hole, not a shrug
reportUnknownParameterType = "error"
reportUnknownVariableType = "error"
reportUnknownMemberType = "error"      # these three surface inferred-Any: ABSENCE made visible
reportUnnecessaryTypeIgnoreComment = "error"   # a stale `# type: ignore` is itself flagged
reportUntypedFunctionDecorator = "error"
# basedpyright only, the sharpest "not checked" signal — flags a written-out `Any`:
reportAny = "error"
```

### `mypy` (alternative)

If the project is already on `mypy`, the equivalent bar is `--strict` *plus* the flags that close the `Any` holes `--strict` alone leaves open:

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true                  # enables disallow-untyped-defs, no-implicit-optional, etc.
warn_return_any = true         # a function that returns Any is a silent hole — flag it
disallow_any_explicit = true   # ban a written-out `Any` in annotations
disallow_any_generics = true   # `list` / `dict` with no params (implicit Any) is an error
disallow_any_decorated = true
warn_unreachable = true
```

**Why both `--strict` and the `--disallow-any-*` / `--warn-return-any` family:** `--strict` makes the checker *demand* annotations, but `Any` satisfies that demand while disabling checking. The extra flags are what turn `Any` from "accepted" into "rejected". This is the gradualness hole (see [honest-ceiling.md](honest-ceiling.md)) closed by config.

- **PREDICATE:** greenfield, or no existing checker? → **DEFAULT** `basedpyright` strict (sharpest agent feedback, best `Any`-surfacing). **FALLBACK** on an established `mypy` codebase: stay on `mypy --strict` + the flags above rather than churn; the dimension is "strict static layer", not the brand.

### Astral's `ty` (zero-install recon checker)

On a machine where no checker is installed but `uv` is present — a common recon state — Astral's `ty` is the lowest-friction first signal: `uvx ty check --python .venv <pkg>` resolves your synced venv and emits diagnostics with **no install and no dev-dependency edit**. It fits the `uv` substrate this recipe already centers. Use it as the recon/bootstrap checker to get a real number fast; keep `basedpyright` strict as the *gate* for a project you own.

### When the checker is already declared but red (the brownfield default)

Mature targets usually have a strict block already in `pyproject.toml` that is **ungated and deep red** (hundreds of errors), or a strict bar **blunted by config** — `disable_error_code=[...]` muting a whole error class, or an empty `[tool.ruff.lint] select` so the `ANN`/`Any` rules are simply off. The work here is not "make it strict" — it already is on paper — but:

1. **Run it** at its current/default mode to get the real count (`uvx ty check` / `uvx mypy <pkg>`).
2. **Audit what the config has turned OFF**: every `disable_error_code` entry, every absent `select` rule, any lowered `typeCheckingMode` — these are the highest-leverage faking surface (see [decision-tree.md](decision-tree.md) PART 4).
3. **Ratchet, don't flag-day**: commit a baseline (e.g. `mypy <pkg> > .mypy-baseline.txt`), gate that the count must not *exceed* it, and burn it down as tracked work. A baseline-gated red checker beats an ungated green-because-unrun one — the latter is exactly the "advice the agent walks past" below.

**This is not real until it is gated (STAGE 4).** A strict checker the agent can walk past with an un-justified `# type: ignore` is advisory, and advisory feedback does not exist for an agent.

---

## 3. `ruff` — annotations enforced, escape hatches banned (un-fakeable)

`ruff` is the fast linter/formatter. Its job in *this* recipe is narrow but load-bearing: enforce that code is **annotated at all** (so the checker has something to check) and **ban the escape hatches** an agent reaches for to flip the checker green. It runs on-save and at pre-commit, the same loop the agent works in.

```toml
# pyproject.toml
[tool.ruff.lint]
select = [
  "E", "F", "W",     # baseline
  "ANN",             # flake8-annotations: every function arg + return must be typed
  "RUF",             # ruff-native rules
  "ASYNC", "B",      # bugbear: real-logic footguns
]
# Ban the agent's reflexes to silence the checker:
#   - bare/blanket suppressions are caught by pyright's reportUnnecessaryTypeIgnoreComment
#   - explicit `Any` in annotations is caught by mypy disallow_any_explicit / basedpyright reportAny (enabled in §2)
# ruff adds the annotation-presence half:
[tool.ruff.lint.flake8-annotations]
allow-star-arg-any = false
mypy-init-return = false
suppress-none-returning = false
```

The division of labor: **ruff** guarantees an annotation *exists*; the **checker** guarantees the annotation is *not `Any`* and is *correct*. Together they close "un-annotated" and "annotated-as-`Any`" — the two ways an agent makes the static layer vacuous. See STAGE 4 for the full escape-hatch ban list.

---

## 4. Records, never untyped bags (local, attributed)

> **Must-be-told card — the single biggest hand-feel killer.**

| Field | Content |
|---|---|
| **The anti-pattern** | `dict[str, Any]` (and bare `dict`, `**kwargs: Any`, untyped tuples) as the shape of domain data. The checker knows nothing about the keys, so `order["totl"]` is green and blows up at runtime, three layers from the typo. |
| **Why it kills the feel** | Every access off an untyped bag is unchecked. One bag passed inward erases the static layer on everything derived from it. The agent gets *silence*, reads silence as safety, and ships the typo. |
| **Do this instead** | A **frozen dataclass** for records, `NewType` for domain primitives, `Literal`/`Enum` for closed sets. The checker now knows every field, flags the typo *at the access site*, and `frozen=True` makes the value immutable so a mutation is a checker error, not a heisenbug. |
| **Un-fakeable hook** | `slots=True` makes `order.totl = 1` an `AttributeError` at runtime too — the typo cannot even be smuggled past the checker by dynamic assignment. |

```python
from dataclasses import dataclass
from enum import Enum
from typing import NewType

UserId = NewType("UserId", int)        # not interchangeable with a bare int — the checker enforces it
Cents = NewType("Cents", int)

class Currency(Enum):                  # closed set; see exhaustiveness below
    USD = "USD"
    EUR = "EUR"

@dataclass(frozen=True, slots=True)    # frozen = immutable; slots = no typo'd attributes
class Order:
    id: UserId
    amount: Cents
    currency: Currency

# order.amount is Cents, not int — passing it where UserId is wanted is a checker error.
# order["amount"] does not type-check at all. A typo'd field is caught at the access site.
```

- `frozen=True` — immutability; a stray mutation becomes a signal, not a silent state bug.
- `slots=True` — bans attributes outside the declared set; closes the dynamic-assignment hole and is faster.
- `NewType` — gives a domain primitive its own type so `UserId` and `Cents` (both `int`) can't be swapped.
- `Literal["pending", "paid"]` / `Enum` — closed sets the checker can verify exhaustively (next section).

**When the shape already lives in a runtime registry.** Some mature code stores its shape at runtime — a registry of field-name→type, a plugin table, a schema dict, a dynamic-`setattr` data model whose class declares *no* fields. Do **not** hand-author a parallel dataclass that will drift from it. **Generate** the static view *from* the registry: emit a stub (one annotation per registry key, the type taken from the registry entry), and pair it with a runtime guard at the single ingestion chokepoint that rejects an unknown name as a **shape error**, not a silent dynamic attribute. The registry is then the one source of truth for both the static stub and the runtime whitelist, so they cannot diverge — this turns a dynamic-`setattr` black box (invisible to the checker) into a checked, localized signal at the exact access site.

---

## 5. Errors-as-values: a hand-rolled `Result` (local, attributed, un-fakeable)

> **Must-be-told card — put failure modes in the signature.**

| Field | Content |
|---|---|
| **The core problem** | A raised exception is invisible to the checker. `def charge(...) -> Receipt` says nothing about the three ways it can fail; the caller is never *forced* to handle them, and an unhandled fault surfaces far from its cause. |
| **The move** | Where a failure is *expected* (validation, lookup-miss, a declared business error), return it as a value: `Result[T, E]`. The failure is now in the **signature**, the checker forces the caller to `match` on it, and a missing handler is a compile-time error — not a 2am traceback. |
| **Why hand-rolled, not a library** | A hand-written tagged union of two frozen dataclasses is more legible to an agent than the monadic `returns` library's `@safe`/`.bind`/`.map` chains. The agent reads `match`/`case`; it does not reliably reason about a do-notation it half-remembers. Legibility *is* the feature here. |
| **The honest limit** | This is a *convention over* the exception channel, not a replacement for it. The channel still exists — any library can raise. You wrap library raises into `Err` in the adapter (STAGE 2 boundary); you do not pretend exceptions are gone. There is no `?` operator to thread the `Err`, so the `match` is explicit. |

```python
from dataclasses import dataclass
from typing import assert_never

@dataclass(frozen=True, slots=True)
class Ok[T]:
    value: T

@dataclass(frozen=True, slots=True)
class Err[E]:
    error: E

type Result[T, E] = Ok[T] | Err[E]     # PEP 695 `type` alias — needs 3.12+

# A domain error as a closed set, not a string:
@dataclass(frozen=True, slots=True)
class InsufficientFunds:
    short_by: int

@dataclass(frozen=True, slots=True)
class AccountFrozen:
    pass

type ChargeError = InsufficientFunds | AccountFrozen

def charge(balance: int, amount: int, frozen: bool) -> Result[int, ChargeError]:
    if frozen:
        return Err(AccountFrozen())
    if amount > balance:
        return Err(InsufficientFunds(short_by=amount - balance))
    return Ok(balance - amount)
```

The caller *cannot* reach the success value without confronting the failure — the checker won't let `.value` be read off a `Result` until it has been narrowed by a `match`:

```python
from typing import assert_never

def handle(balance: int, amount: int, frozen: bool) -> str:
    match charge(balance, amount, frozen):
        case Ok(value=remaining):
            return f"charged; {remaining} left"
        case Err(error=e):                      # all failures land here…
            match e:                            # …then branch on the cause (e: ChargeError)
                case InsufficientFunds(short_by=n):
                    return f"declined; short by {n}"
                case AccountFrozen():
                    return "declined; account frozen"
                case _ as unreachable:
                    assert_never(unreachable)   # checker proves every cause is handled (§6)
```

The two-level `match` is what the strict checker actually verifies as exhaustive: the outer arm `Err(error=e)` covers *all* failures, the inner `match` covers every `ChargeError` variant, and `assert_never` makes "add a variant → checker errors here" hold. A flat `match` with nested patterns (`Err(error=InsufficientFunds(...))`) does **not** type-check under strict pyright — it cannot prove the function returns on all paths.

- **PREDICATE — `Result` or a raised exception for this failure?** **DEFAULT:** *expected, recoverable, caller-must-decide* failures → `Result` (the failure is part of the contract). *Truly exceptional, unrecoverable, programmer-error* faults (a bug, an invariant breach) → raise; let it crash loud and local. **FALLBACK** when unsure: model it as `Result` if a *sane caller would branch on it*; otherwise raise. Don't wrap genuine bugs in `Result` — that hides the signal.

---

## 6. Exhaustiveness: `match` + `assert_never` (the static guarantee Python *can* match)

This is the one place Python reaches the *same* guarantee a static language gives, not an approximation. Add a `case _` that passes the residual to `typing.assert_never`. `assert_never`'s parameter is typed `Never`; when every arm of a closed union is handled the residual *is* `Never` and the call type-checks. **Add a new variant to the union and the checker errors at that exact call** — the residual is no longer `Never` — pointing the agent straight at the unhandled case.

```python
def describe(e: ChargeError) -> str:
    match e:
        case InsufficientFunds(short_by=n):
            return f"short by {n}"
        case AccountFrozen():
            return "frozen"
        case _ as unreachable:
            assert_never(unreachable)    # checker proves this is Never == every case handled
```

Now extend the union and watch the signal fire:

```python
@dataclass(frozen=True, slots=True)
class DailyLimitExceeded:
    pass

type ChargeError = InsufficientFunds | AccountFrozen | DailyLimitExceeded
```

With `describe` unchanged, the checker reports at the `assert_never` line:

```
error: Argument of type "DailyLimitExceeded" cannot be assigned to parameter
       "arg" of type "Never" in function "assert_never"   (reportArgumentType)
```

That is **local** (the exact line), **attributed** (names the unhandled type), and **un-fakeable** (the only way to silence it is to actually handle the case — deleting the arm just moves the error). This is why closed unions of dataclasses beat string tags: the checker can prove the match is total.

> **Runtime belt-and-braces:** `assert_never` also raises at runtime if reached, so a path the checker somehow missed (a value smuggled in via an un-validated boundary) still fails loud and local rather than falling through silently.

---

## 7. Boundary validation with `pydantic` (attributed, trustworthy) — STAGE 2

Types are **erased at runtime**. At every edge where real or untyped data enters — an HTTP body, a JSON file, an env var, an untyped library's return — the static type is a *claim*, not a *check*. A `cast` or a bare annotation asserts the shape; it does not verify it, so a bad shape sails inward and detonates three layers from the edge, unattributed.

**Validate, don't assert.** Parse incoming data into a typed model *at the boundary* with `pydantic`, so a bad shape fails *there*, naming the field and the violated constraint.

```python
from pydantic import BaseModel, ValidationError

class CreateOrder(BaseModel):       # the boundary model — pydantic checks at runtime
    user_id: int
    amount: int
    currency: str

def parse_order(raw: bytes) -> Result[CreateOrder, str]:
    try:
        return Ok(CreateOrder.model_validate_json(raw))
    except ValidationError as exc:
        # the failure is attributed: which field, what rule, at the edge
        return Err(str(exc))
```

A bad payload yields a located, attributed error instead of a downstream `KeyError`:

```
1 validation error for CreateOrder
amount
  Input should be a valid integer, unable to parse "ten" [type=int_parsing, ...]
```

**Contain `Any` to the adapter.** An untyped library is an `Any` source. Confine it to a thin adapter module at the edge and convert *immediately* — one inward `Any` silently disables checking on everything derived from it; it propagates along data-flow like a virus, stopped only by an explicit return type or the strict gate. The adapter's signature is the firewall:

```python
import some_untyped_lib  # returns Any

def fetch_order(uid: int) -> Result[CreateOrder, str]:   # explicit return type = the firewall
    raw: object = some_untyped_lib.get(uid)              # name it `object`, not `Any` — forces narrowing
    try:
        return Ok(CreateOrder.model_validate(raw))       # validate the Any into a typed model at the edge
    except ValidationError as exc:
        return Err(str(exc))
```

Note `object` over `Any` for the raw value: like TypeScript's `unknown`, `object` *forces* narrowing and does **not** propagate, where `Any` would silently flow inward. This is also where the exception-channel honesty from §5 lands — the adapter is exactly where you catch a library's raise and turn it into an `Err`.

**When the boundary already exists but is toothless.** A common brownfield finding is not a *missing* parse but a present-but-loose one: a pydantic model whose fields are wide unions — `Union[Decimal, float, None]`, `Union[date, str]` — *asserts shape* while checking almost nothing. A passing parse is then not evidence the value is right: a never-parsed `str` date, or a lossy `float` where `Decimal` precision matters, sails straight through. The moves: **narrow the union to the real domain** (drop the `str` arm from a date; drop the `float` arm from a money field — if a row genuinely failed to parse, *raise* at the boundary, don't ship a `str` downstream); add `model_config = ConfigDict(strict=True)` so pydantic won't silently coerce (`float`→`Decimal` precision loss is the canonical trap); and treat any `model_validator(mode="before")` that takes an untyped `data: dict` as boundary logic that is *itself* unchecked. A boundary that validates shape but not value is a claim, not a check ([honest-ceiling.md](honest-ceiling.md), RESIDUAL 1).

The contracts and boundaries you are validating here are `load-bearing`'s architecture decisions; this recipe only ensures each one *emits a clear signal* when violated.

---

## 8. STAGE 4 — make it un-fakeable and make absence visible

A signal helps only if the agent cannot flip it green by hand and if silence cannot be mistaken for safety. Gate every source in **pre-commit and CI** (mirror the local loop so a `--no-verify` bypass is caught), and ban the escape hatches:

| Escape hatch the agent reaches for | Ban / surface it with |
|---|---|
| un-justified `# type: ignore` | pyright `reportUnnecessaryTypeIgnoreComment = "error"`; require a rule-code + reason, reviewed |
| written-out `Any` in an annotation | mypy `disallow_any_explicit`; basedpyright `reportAny` |
| inferred / silent `Any` (the worse kind) | pyright `reportUnknown*Type = "error"`; mypy `warn_return_any` + `disallow_any_generics` |
| `cast(X, junk)` to launder a shape | review test/type diffs; a `cast` at a boundary is a smell — it should be a `pydantic` parse |
| deleted assertion / weakened test | mutation testing (`mutmut`) — a deleted assertion lets a mutant survive, score drops |
| missing-coverage path read as "fine" | read coverage as a **map of untested paths**, not a percentage to clear |

**Absence is a signal — the one move that neutralises gradualness.** Make "not checked" *loud*: turn on the checker's unknown/`Any` reports (above), read coverage as which branches were *never executed*, and run mutation testing to expose assertion-free tests. Otherwise the agent reads the silence of an unchecked path as safety, which is precisely where the residual risk hides. The pipeline that *runs* these gates and the production observability are `flightline`'s to operate; `gauge`'s job is to ensure the hooks exist and every failure mode is wired to one.

---

## Honest limits (do not oversell)

Gradual ≠ sound; green ≠ proof. This stack buys the *experience* of clear static-language feedback, not a free, total soundness proof. Read [honest-ceiling.md](honest-ceiling.md) for the full account; the Python-specific residual is four things, each recoverable **per-site** but neither free nor universal:

1. **Types are erased.** A static type is a *claim* until validated. Recovered per-edge by the §7 boundary parse — but only at edges you actually instrument. An un-validated edge is an un-checked claim.
2. **The checker is gradual.** An un-annotated or `Any` path is *unchecked* = no signal. Recovered per-site by gating `Any` (§2, §3, §8) — but it takes discipline + the gate, and one inward `Any` un-checks everything downstream of it.
3. **The exception channel still exists under `Result`.** Any code or library can raise; `Result` is a convention, not an enforced effect type. You wrap library raises into `Err` *in the adapter* (§7) — the channel is contained, not eliminated. There is no `?` operator, so threading an `Err` is an explicit `match`, not sugar.
4. **No borrow checker.** Python matches a static language on **exhaustiveness** (`match` + `assert_never`, §6) and **no-null** (strict `Optional`, narrow before use) — these are real, not approximations. It does *not* get memory/aliasing guarantees, and even a language that did (Rust) only covers a *class* of errors — types, memory, null, exhaustiveness — never behavioral correctness. That still needs tests, designed in `assay`.

You asymptote toward total; you never reach it. The discipline is to make the gap **visible** (§8) rather than silent — a known, named residual the agent can see is feedback; an unknown one is the bug it ships at 2am.

---

**Cross-links:** [honest-ceiling.md](honest-ceiling.md) (what is not achievable, and the absence-as-signal move) · [feedback-sources.md](feedback-sources.md) (the source-per-failure-mode catalogue) · [typescript-recipe.md](typescript-recipe.md) (the TS analogue — same dimensions, different escape hatches) · [decision-tree.md](decision-tree.md) (the six-dimension scoring engine and strictness-by-risk dial) · [../SKILL.md](../SKILL.md) (the five-stage flight plan this recipe serves).

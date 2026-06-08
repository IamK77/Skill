# Trust-Chains & Smells

This reference is the depth behind **STAGE 4 — Trust & smells** of the [../SKILL.md](../SKILL.md) flight plan, the signature stage of `plumb`: it governs the two checks `trust-chain-contained` and `smells-swept` — where a static guarantee leaks from compile time to runtime, and what the rest of the code smells of. The human-era author who reached for `cast`, `isinstance`, `Any`, `getattr` (or `as`, reflection, `interface{}`, `unwrap`) felt a small unease — they knew they were stepping outside the guarantee the tool would otherwise prove, vouching for something the checker no longer could, and they confined it to a boundary and felt wrong scattering it through the core. The agent scatters these *without* that unease, because each one makes the immediate thing work and the agent feels none of the lost guarantee — so the trust chain leaks all through the core, one convenient `cast`/`isinstance`/`Any` at a time, and it stops at the *finding-list* rather than the fix because producing the audit already turned the task green. For *why* this is the shift, read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 5** (the agent leaves the trust-chain escape hatches) and **SHIFT 7** (smells found, never fixed). This file is the *how*: the trust-chain reframe, the per-language family, the parse-don't-validate cure, primitive obsession and unrepresentable illegal states, and the Fowler smell catalog with the fix each one points at.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and restated here because every call below is judged against it:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer, never applied as dogma.**

The meta-rule bites especially hard at this stage, because the trust-chain discipline is the one most easily turned into zealotry: **the test for every move here is "does this make the code clearer and cheaper to change, or just more rule-compliant?"** A `cast` at a genuine boundary is *correct*; ripping it out to satisfy a "no casts" rule, or hand-rolling a validation layer the data never needed, is over-application — its own defect. You are hunting *leaks*, not *occurrences*.

## Contents

- [The trust-chain reframe — the signature of the skill](#the-trust-chain-reframe--the-signature-of-the-skill)
- [The Python family in depth](#the-python-family-in-depth)
- [The cross-language family — same smell, different clothes](#the-cross-language-family--same-smell-different-clothes)
- [The cure — parse, don't validate](#the-cure--parse-dont-validate)
- [Primitive obsession and illegal states](#primitive-obsession-and-illegal-states)
- [The Fowler smell catalog — each a tell, each pointing at a fix](#the-fowler-smell-catalog--each-a-tell-each-pointing-at-a-fix)
- [Sweep, dispose, boy-scout](#sweep-dispose-boy-scout)

---

## The trust-chain reframe — the signature of the skill

The reframe is this: **a static checker holds a chain of guarantees** — at every point, a value's type is *proven*, not *asserted*, and the proof flows from where the value was created to where it is used. `Any`, `cast`, `isinstance`, `getattr` and their family are each a **point where that chain breaks** — where a guarantee the tool *could have proven* is downgraded to something weaker. They are not all the same break:

| Escape hatch | What it downgrades the guarantee to | The break |
|---|---|---|
| `Any` | *unknown, and infectious* — checking is disabled, and the unknown flows inward along data-flow | the chain dissolves silently and spreads |
| `cast(T, x)` | *"I vouch for it"* — an unchecked assertion the checker believes without proof | the chain is asserted, not proven, at one point |
| `isinstance` / `getattr` | *"decide at runtime"* — the type question is deferred from compile time to a runtime branch | the chain is pushed past the checker entirely |

So the question is **never "can I use it?"** — every one of these is necessary somewhere. The question is **"where?"** And the answer routes through the [decision-tree.md edge-or-core router](decision-tree.md#the-trust-chain-edge-or-core-router--stage-4):

- **At a BOUNDARY** — deserializing external JSON, an FFI call, a generic library, gradually typing legacy code — the break is *necessary*: the data genuinely arrives untyped, and *somewhere* it must become typed. The right move is to make this the *one* place it becomes typed.
- **Scattered through CORE domain logic** — the break is a **smell**: the trust chain leaking from compile time to runtime, a cluster of `cast`/`isinstance`/`Any` re-establishing at every call site a guarantee that should have been established once at the edge.

**A cluster of these in core logic is the agent's reliable tell.** It is the signature of trust that should have been parsed once at the boundary and wasn't — the agent reached for each hatch because it made the immediate line work, felt none of the lost guarantee, and the next session inherited code where *nothing is actually proven*. The disposition is `trust-chain-contained`: push the dynamism out to a boundary, parse once, let the type carry the guarantee in.

> **The meta-rule, applied here:** the goal is not zero escape hatches — it is the chain *unbroken in the core*. An isolated `cast` at a clear edge is fine; do not flag it. A cluster in the domain is the finding. Counting occurrences instead of locating leaks is the over-application failure.

---

## The Python family in depth

The family is larger than the canonical four — anything that lets a value be used at a type the checker cannot prove belongs to it. Each below is a tiny bad-vs-good; the *fix tooling* (the strict checker, `pydantic`, `NewType`) is the `gauge` skill's — plumb names the leak and routes the parse-once fix there.

**`Any` — the infectious unknown.** Disables checking and spreads along data-flow; one inward `Any` un-checks everything derived from it.

```python
def load(raw) -> Any:          # everything downstream of load() is now unchecked
    return json.loads(raw)
order = load(body)
order.totl                      # green; blows up three layers away
```
Fix: give it a real return type at the edge (parse-don't-validate, below). Prefer `object` over `Any` for a not-yet-narrowed value — `object` *forces* narrowing and does not propagate.

**`cast` — the unchecked assertion.** The checker believes you with no proof.

```python
user = cast(User, blob["user"])   # if blob["user"] is a dict, this is a lie the checker can't catch
```
Fix: a `cast` in the core is a smell; it should be a parse at the boundary that *verifies* the shape, not asserts it.

**`isinstance` chains — runtime type dispatch that should be polymorphism.** A ladder of `isinstance` branches is Fowler's *replace-conditional-with-polymorphism* waiting to happen.

```python
# bad — the dispatch lives in a conditional the checker can't help with
def area(shape) -> float:
    if isinstance(shape, Circle):   return 3.14159 * shape.r ** 2
    elif isinstance(shape, Square): return shape.side ** 2
    elif isinstance(shape, Rect):   return shape.w * shape.h
```
```python
# good — the dispatch lives in the type; add a shape, the type system points at the gap
class Shape(Protocol):
    def area(self) -> float: ...
# (or a closed union + exhaustive match, which the checker can prove total — see gauge)
```
A *single* `isinstance` to narrow at a boundary is fine; a *ladder* in the core means the polymorphism was never built.

**`getattr` / `setattr` / `__getattr__` — structure encoded in strings.** The shape of the object lives in string keys the checker cannot trace; a typo is invisible until runtime, and you cannot find the field's readers.

```python
value = getattr(config, field_name)    # which fields? the checker has no idea; rename breaks silently
```
Fix: if the set of names is known, it is a record (dataclass / TypedDict / model) — fields the checker can see and rename. Dynamic `getattr` belongs only where the names are genuinely open (a plugin registry), and even then routed through a generated stub + a runtime whitelist (a `gauge` move).

**The same family, less obviously:**

| Tell | Why it breaks the chain | Route to |
|---|---|---|
| `# type: ignore` / `# noqa` | silences the checker at a point — a stale one lies | justify with a code + reason, or remove (`gauge`) |
| `dict[str, Any]` instead of a record | the checker knows nothing about the keys; `d["totl"]` is green | a dataclass / `TypedDict` / model (`gauge`) |
| `**kwargs` passthrough | hides the real signature from caller *and* checker | name the parameters, or a typed config object |
| `hasattr` duck-typing | structural shape decided at runtime, untraceable | a `Protocol` the checker verifies structurally |
| over-wide `Union[A, B, C]` return | dumps the `isinstance` ladder onto every caller | return one type, or a closed union with exhaustive `match` |
| primitive obsession (`user_id: str`, `email: str`) | the checker treats them as interchangeable | domain types (`NewType`) — see below |
| `eval` / `exec` | the ultimate break — arbitrary code, zero static knowledge, an injection surface | almost never necessary; a dispatch dict or real parsing |

---

## The cross-language family — same smell, different clothes

Every statically-checked language has this family; the *clothes* differ, the *break* is identical. The meta-point governs which ones to worry about most.

| Language | Infectious unknown | Unchecked assert | Runtime dispatch | Reflection / heavy | Untyped bag | The "good" explicit form |
|---|---|---|---|---|---|---|
| **TypeScript** | `any` | `x as T`, `!` non-null | `instanceof` / `typeof` | — | `[key: string]: any` | **`unknown`** — forces narrowing before use |
| **Java** | `Object` | `(T) x` unchecked cast, `@SuppressWarnings` | `instanceof` + downcast | reflection, `setAccessible` | `Map<String,Object>` | sealed classes + pattern `switch` |
| **C#** | `dynamic`, `object` | `as`, explicit cast | `is` + cast | reflection | `object` / `Dictionary<string,object>` | nullable-ref + exhaustive `switch` |
| **C / C++** | `void*` (the ultimate) | C-cast, `reinterpret_cast`, `const_cast` | `dynamic_cast` | macros, union type-punning | — | `std::variant` + `std::visit` |
| **Go** | `interface{}` / `any` | `x.(T)` type assertion | type `switch x.(type)` | `reflect`, `unsafe.Pointer` | `map[string]any` | a concrete struct; `errors.As` |
| **Rust** | `Box<dyn Any>` | `as` numeric truncation | `match` on an enum | `transmute` | — | `enum` + exhaustive `match` |
| **Kotlin / Swift** | `Any` | `!!`, `as!` | `is` / `as?` | reflection | — | sealed/`enum` + `when`/`switch`, `as?` returning optional |

Two language details worth pulling out:

- **Rust `unwrap`/`expect` are a panic-cast** — "I assert this `Option`/`Result` is the happy variant, panic if I'm wrong." Scattered through core logic they are the same smell as `cast`; at a boundary in a script they are fine. `unsafe` and `transmute` are the deeper breaks.
- **Go's discarded error `_` is a swallowed-failure cousin** — `v, _ := f()` throws away the very signal the type system handed you. (Error-swallowing proper is the [functions-and-flow.md](functions-and-flow.md) concern; here it is the trust-chain framing — you discarded a proven failure value.)

**The meta-point that decides what to hunt:** *good* languages and styles make "I am breaking the guarantee" **explicit and local** — Rust's `unsafe` block you must write and a reviewer can grep, TypeScript's lintable `any`, Kotlin's glaring `!!` that no one types by accident. *Bad* ones make the break **invisible and default** — C's `void*` reachable everywhere, a dynamic language's untyped-by-default surface, reflection buried deep where no reader will find it. So the craft move, in any language, is to make the break **shout**: confine it to a named, greppable, local place, never let it be the silent default. A `# type: ignore` with a rule-code and a reason shouts; an unannotated function that infers `Any` is silent — and the silent one is the dangerous one, because the next session reads its silence as safety.

---

## The cure — parse, don't validate

This is the direct antidote to the broken chain, and the single idea this stage exists to install.

**The wrong way reconstructs trust everywhere.** The untrusted data flows inward still-untrusted, and every function that touches it re-checks the shape — a scatter of `isinstance` / `cast` / `if x is not None` re-validations, the break leaking through the whole core:

```python
def handle(payload: dict) -> Receipt:          # dict[str, Any] — untrusted all the way in
    if not isinstance(payload.get("amount"), int):
        raise ValueError("bad amount")
    amount = cast(int, payload["amount"])       # re-asserted here…
    user = lookup(cast(str, payload["user"]))   # …and here…
    return charge(user, amount)

def charge(user, amount):
    if not isinstance(amount, int):             # …and re-checked AGAIN, because nothing proved it
        raise ValueError("bad amount")
    ...
```
Every function distrusts its own inputs because no type carries a guarantee; the same shape is checked three times and proven zero times.

**The right way parses once at the edge into a trusted type, and the type carries the guarantee in:**

```python
@dataclass(frozen=True)
class Charge:
    user: UserId
    amount: Cents

def parse_charge(payload: object) -> Result[Charge, str]:   # the ONE place untrusted -> trusted
    ...  # validate the shape here, once (the tooling is gauge's: pydantic / a validated model)

def handle(charge: Charge) -> Receipt:    # receives a TRUSTED type — no re-checks anywhere downstream
    return charge_account(charge.user, charge.amount)

def charge_account(user: UserId, amount: Cents) -> Receipt:
    ...                                    # amount is Cents, proven; nothing re-validates
```
The dynamism is contained to `parse_charge`; past it, the type *is* the proof, and the `isinstance`/`cast`/`if x is not None` re-checks dissolve because nothing downstream has anything left to doubt.

> **CRITICAL DELEGATION:** the static-layer *tooling* — the strict checker, `pydantic`/`zod`, `NewType` — is the `gauge` skill's craft, and so is the *boundary-validation* mechanism. plumb's job at `trust-chain-contained` is to **spot the leak** (the cluster of re-checks in the core, the `dict[str, Any]` flowing inward) and **name the parse-once fix**, then route the implementation to `gauge`. Do not re-teach `pydantic`/`zod` here.

---

## Primitive obsession and illegal states

Two related cures that finish closing the chain.

**Cure primitive obsession with domain types.** When `user_id: str` and `email: str` are both just `str`, the checker treats them as interchangeable and will happily let you pass an email where a user-id is wanted — a leak the type system was *capable* of catching but wasn't asked to.

```python
# bad — two different domain concepts the checker cannot tell apart
def grant(user_id: str, resource_id: str) -> None: ...
grant(resource_id, user_id)   # arguments swapped; green; wrong

# good — domain types the checker enforces as distinct
UserId = NewType("UserId", str)
ResourceId = NewType("ResourceId", str)
def grant(user_id: UserId, resource_id: ResourceId) -> None: ...
grant(resource_id, user_id)   # checker error — they are not the same type
```
Beyond `NewType`: enums for closed sets (a `status: str` that is really one of four values), value objects for things with invariants (a `Money` that carries currency, an `EmailAddress` validated on construction).

**Make illegal states unrepresentable.** Push it one step further: design the types so a bad state *cannot be constructed at all*, rather than constructed-then-checked.

```python
# bad — four booleans encode 16 states, but only 3 are legal; the other 13 are bugs waiting
class Connection:
    is_connecting: bool
    is_connected: bool
    is_closed: bool
    error: str | None      # what does connected=True, error="..." mean? undefined.

# good — a sum/sealed type; only the legal states exist, the rest are unconstructable
type ConnState = Connecting | Connected | Closed | Failed
@dataclass(frozen=True)
class Connected: session_id: str
@dataclass(frozen=True)
class Failed: reason: str        # error lives ONLY in the Failed state — can't be set otherwise
```
A bad combination is now a compile-time impossibility, not a runtime check you might forget. (The exhaustiveness guarantee that makes `match` total over such a union is `gauge`'s `assert_never` move — route it there.) This is the deepest form of `trust-chain-contained`: the chain can't break because the broken state has no representation.

---

## The Fowler smell catalog — each a tell, each pointing at a fix

`smells-swept` is the rest of the classic catalog beyond the trust-chain. **Each smell is a *tell* — a surface symptom — that points at a specific refactoring.** This is the [decision-tree.md smell→fix map](decision-tree.md#the-smell--fix-map-stage-4-and-the-disposition-router-stage-5); the table here is the depth behind it. Spotting a smell is the *finding*; the fix-direction is what makes it actionable rather than a complaint.

| Smell | The tell | Points at |
|---|---|---|
| **Long function** | many lines, several jobs, mixed abstraction levels in one body | extract functions — one thing, one level ([functions-and-flow.md](functions-and-flow.md)) |
| **Large class** | too many fields/methods, more than one responsibility | extract class; split by responsibility (cohesion — [abstraction-and-design.md](abstraction-and-design.md)) |
| **Long parameter list** | 4+ params, or several always passed together | introduce a parameter object |
| **Data clumps** | the same group of fields/args travels together everywhere | make the clump a type — it's a value object that wants to exist |
| **Magic numbers / strings** | unexplained literals (`* 0.0875`, `"PENDING"`) | named constants / an enum |
| **Shotgun surgery** | one conceptual change forces edits scattered across many files | move the related behavior together — raise cohesion |
| **Divergent change** | *one* module changes for many unrelated reasons | split it — each reason-to-change is its own responsibility |
| **Feature envy** | a method mostly manipulates *another* object's data | move the method to the data it envies |
| **Message chains** | `a.getB().getC().getD()` — the caller knows the whole graph | hide the navigation behind a method (Law of Demeter) |
| **Primitive obsession** | `str`/`int` for domain concepts; interchangeable `user_id`/`email` | domain types (see above) |
| **Comments as deodorant** | a comment explaining a confusing block, masking the real problem | fix the code so the comment isn't needed; a comment is not a fix for bad code |

Two notes on judgment: **shotgun surgery and divergent change are duals** — one change hitting many places (too little cohesion) versus one place hit by many changes (too little separation) — and the fix for each is the opposite cohesion move. And **comments-as-deodorant** is the trust-chain idea applied to prose: a comment that exists to make a confusing line bearable is hiding a smell the way a `cast` hides a leak; the cure is to make the code clear, not to annotate the unclear.

> **The meta-rule, once more:** a "smell" that doesn't actually tax the next reader is a *style opinion*, not a finding — drop it (the [decision-tree.md finding taxonomy](decision-tree.md#audit-vs-setup--pick-the-mode-then-the-finding-taxonomy)). A three-line function with a magic `2` that everyone reads as "double it" is not primitive obsession waiting to be cured. Flag what leaks or what genuinely confuses; let the formatter own formatting (`flightline`).

---

## Sweep, dispose, boy-scout

A smell found and never fixed is worthless — this is **SHIFT 7**, the agent stopping at the list because producing the audit already turned the task green. `smells-swept` is not "I listed the smells"; it is "each found smell has a disposition." That disposition is the next stage's router ([testability-and-disposition.md](testability-and-disposition.md)): **fix now** if small and safe (a rename, an extract under existing tests), **refactor under test** for anything larger — handed to the `husbandry` skill, which owns the refactoring *mechanics* (small steps, behavior pinned with characterization tests first, the boy-scout rule), or **accept with a written reason** (this `cast` is a real boundary; this duplication isn't stable enough to abstract yet). The trust-chain *tooling* fixes route to `gauge`; designing the tests that pin behavior before a refactor is `assay`'s; the module-boundary calls are `load-bearing`'s. plumb names the smell and routes the fix — it does not re-implement the refactoring engine.

And the standing habit that keeps the catalog from re-filling: the **boy-scout rule** — when you are in a file for any reason and see a cheap, safe craft improvement under the existing tests, make it; leave the code a little cleaner than you found it. The agent has no boy-scout instinct (the cleanup earns no green, it feels no ownership), so this too must be a deliberate move, not a trusted reflex. Smells accumulate exactly as fast as no one disposes of them.

---

**Cross-links:** [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 5 and SHIFT 7 — *why* this stage reads as it does) · [decision-tree.md](decision-tree.md) (the edge-or-core router, the smell→fix map, the disposition router this file is the depth behind) · [functions-and-flow.md](functions-and-flow.md) (error-swallowing, the function-shape smells) · [abstraction-and-design.md](abstraction-and-design.md) (cohesion, the cure for shotgun-surgery/divergent-change) · [testability-and-disposition.md](testability-and-disposition.md) (where every swept smell gets disposed) · [craft-stance.md](craft-stance.md) (boring-over-clever, guidance-not-dogma) · [naming.md](naming.md) (the names a domain type earns) · [../SKILL.md](../SKILL.md) (the six-stage flight plan this reference serves).

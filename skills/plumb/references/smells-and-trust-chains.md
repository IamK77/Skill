# Trust-Chains & Smells — the six lenses

This reference is the depth behind **STAGE 4 — Trust & smells** of the [../SKILL.md](../SKILL.md) flight plan, the signature stage of `plumb`. It governs the two checks: **`trust-chain-contained`** (where a static guarantee leaks from compile time to runtime) and **`smells-swept`** (what the rest of the code smells of, organized below into six lenses).

A code-smell catalog is famously hard to remember, and the reason is that most catalogs list *names* without a *lens* — twenty unrelated labels you memorize and forget. This file is built the other way. **Every smell answers one question — "does it make the code harder to understand, or harder to change?"** — and the smells that share an *underlying failure* are grouped into a **family with one lens**, the way the trust-chain reframe gives `Any`/`cast`/`isinstance`/`getattr` a single lens ("where did trust leak from compile time to runtime?"). Learn the six lenses and the master question, and you do not need to memorize the list — you can *derive* it.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and restated because every call below is judged against it:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer and cheaper to change, never applied as dogma.**

## Contents

- [The map — one question, eight families, two checks](#the-map--one-question-eight-families-two-checks)
- [The signature lens — the trust chain](#the-signature-lens--the-trust-chain)
  - [The reframe — a chain of guarantees, and where it breaks](#the-reframe--a-chain-of-guarantees-and-where-it-breaks)
  - [The Python family in depth](#the-python-family-in-depth)
  - [The cross-language family — same smell, different clothes](#the-cross-language-family--same-smell-different-clothes)
  - [The cure — parse, don't validate](#the-cure--parse-dont-validate)
  - [Primitive obsession and illegal states](#primitive-obsession-and-illegal-states)
- [The six lenses of the sweep](#the-six-lenses-of-the-sweep)
  - [Lens 1 — Coupling: change one place, ripple everywhere](#lens-1--coupling-change-one-place-ripple-everywhere)
  - [Lens 2 — Mutable shared state: you can't reason from a local read](#lens-2--mutable-shared-state-you-cant-reason-from-a-local-read)
  - [Lens 3 — Size & bloat: more than fits in one head](#lens-3--size--bloat-more-than-fits-in-one-head)
  - [Lens 4 — Abstraction misalignment: not aimed at the real axis of change](#lens-4--abstraction-misalignment-not-aimed-at-the-real-axis-of-change)
  - [Lens 5 — Implicit intent: the meaning lives in your head, not the code](#lens-5--implicit-intent-the-meaning-lives-in-your-head-not-the-code)
  - [Lens 6 — Dead matter & noise: existence is a cost](#lens-6--dead-matter--noise-existence-is-a-cost)
- [Sweep, dispose, boy-scout](#sweep-dispose-boy-scout)

---

## The map — one question, eight families, two checks

The whole stage hangs off **one master question, applied to any line you are unsure about:**

> **"Will the person who has to change this in six months — very likely a fresh agent session, possibly you — have an easier time, or a harder one?"** If the honest answer is *harder*, it is a smell, whatever its textbook name; if *neither*, it is a style opinion, not a finding (drop it). The name is a label for a thing you already detected with this question — never the other way around.

The families below each isolate *one underlying failure* and hand you the lens that detects every member of it:

| # | Family | The underlying failure | Check |
|---|---|---|---|
| **signature** | **Trust chain** | a guarantee the tool could prove is downgraded to "trust me" / "decide at runtime" | `trust-chain-contained` |
| **1** | Coupling | things that should move independently are tangled, so a change can't be made locally | `smells-swept` |
| **2** | Mutable shared state | one datum is writable by many, at uncertain times, so you can't reason from a local read | `smells-swept` |
| **3** | Size & bloat | a unit holds more than fits in working memory | `smells-swept` |
| **4** | Abstraction misalignment | the abstraction is cut along the wrong axis — too little *or* too much | `smells-swept` |
| **5** | Implicit intent | the meaning lives in convention and comments, not in the code itself | `smells-swept` |
| **6** | Dead matter & noise | code that exists costs attention and maintenance without paying it back | `smells-swept` |

An **eighth family — error handling** (swallowed exceptions, exceptions as control flow, over-defensive checks, leaky abstractions) — has its lens *"errors and boundaries are first-class design, not an afterthought"* and already lives in [functions-and-flow.md](functions-and-flow.md) (and the *tooling* in the `gauge` skill); it is named here only so the map is complete.

The families are not disjoint, and the overlaps are where the deepest smells sit: **primitive obsession** is both a trust-chain leak (the checker can't tell `UserId` from `Email`) and an implicit-intent smell (Lens 5) — the two families meet there. **Mutable shared state** (Lens 2) is itself a kind of implicit coupling (Lens 1). Two of these overlaps run so deep they are better named as a **root cause** in their own right, because each unifies smells the six lenses deliberately split — derive *down to the disease*, not just to the lens:

- **Knowledge with no single home.** **Shotgun surgery** and **divergent change** (Lens 1) and **duplication** (Lens 4) are three faces of one disease: a single piece of *knowledge* that has no one authoritative place to live, so it is either smeared across many sites (one change must touch all of them) or copied into several (the copies drift apart). This is the DRY-as-**knowledge** / Parnas information-hiding cut — and it is why the fix for all three is the *same* move: give the knowledge one home. The duplication forensic in Lens 4 (diff the twins, watch the encoding direction) is this root cause caught in the act; the "if this rule changed, how many sites?" probe in Lens 1 is the same root cause seen dynamically.
- **A domain concept absent from the code.** **Primitive obsession** (signature lens), **data clumps** and **long parameter lists** (Lens 3), and **boolean blindness** (Lens 5) are symptoms of a concept that exists in the domain but was never given a type — the `Money`, the `DateRange`, the `EmailAddress` that should be one named thing is instead three loose primitives travelling together. Name the missing type and several of the surface smells dissolve at once.

When a smell shows up under two lenses — or rolls up into one of these root causes — that is signal it is worth fixing, not a contradiction.

The signature lens gets the deepest treatment because it is `plumb`'s identity and the model for the rest; then the six lenses are the spine of the `smells-swept` sweep.

---

## The signature lens — the trust chain

The human-era author who reached for `cast`, `isinstance`, `Any`, `getattr` (or `as`, reflection, `interface{}`, `unwrap`) felt a small unease — they knew they were stepping outside the guarantee the tool would otherwise prove, vouching for something the checker no longer could, and they confined it to a boundary and felt wrong scattering it through the core. The agent scatters these *without* that unease, because each one makes the immediate thing work and the agent feels none of the lost guarantee — so the trust chain leaks all through the core, one convenient `cast`/`isinstance`/`Any` at a time, and it stops at the *finding-list* rather than the fix because producing the audit already turned the task green. For *why* this is the shift, read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 5** (the agent leaves the trust-chain escape hatches) and **SHIFT 7** (smells found, never fixed).

### The reframe — a chain of guarantees, and where it breaks

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

### The Python family in depth

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

### The cross-language family — same smell, different clothes

Every statically-checked language has this family; the *clothes* differ, the *break* is identical. The meta-point governs which ones to worry about most.

| Language | Infectious unknown | Unchecked assert | Runtime dispatch | Reflection / heavy | Untyped bag | The "good" explicit form |
|---|---|---|---|---|---|---|
| **TypeScript** | `any` | `x as T`, `!` non-null | `instanceof` / `typeof` | — | `[key: string]: any` | **`unknown`** — forces narrowing before use |
| **Java** | `Object` | `(T) x` unchecked cast, `@SuppressWarnings` | `instanceof` + downcast | reflection, `setAccessible` | `Map<String,Object>` | sealed classes + pattern `switch` |
| **C#** | `dynamic`, `object` | `as`, explicit cast | `is` + cast | reflection | `object` / `Dictionary<string,object>` | nullable-ref + exhaustive `switch` |
| **C / C++** | `void*` (the ultimate) | C-cast, `reinterpret_cast`, `const_cast` | `dynamic_cast` | macros, union type-punning | — | `std::variant` + `std::visit` |
| **Go** | `interface{}` / `any` | `x.(T)` type assertion | type `switch x.(type)` | `reflect`, `unsafe.Pointer` | `map[string]any` | a concrete struct; `errors.As` |
| **Rust** | `Box<dyn Any>` | `unwrap`/`expect` (panic-cast), `as` truncation | `match` on an enum | `transmute` | — | `enum` + exhaustive `match` |
| **Kotlin / Swift** | `Any` | `!!`, `as!` | `is` / `as?` | reflection | — | sealed/`enum` + `when`/`switch`, `as?` returning optional |

Two language details worth pulling out:

- **Rust `unwrap`/`expect` are a panic-cast** — "I assert this `Option`/`Result` is the happy variant, panic if I'm wrong." Scattered through core logic they are the same smell as `cast`; at a boundary in a script they are fine. `unsafe` and `transmute` are the deeper breaks.
- **Go's discarded error `_` is a swallowed-failure cousin** — `v, _ := f()` throws away the very signal the type system handed you. (Error-swallowing proper is the [functions-and-flow.md](functions-and-flow.md) concern — the seventh family; here it is the trust-chain framing: you discarded a proven failure value.)

**The meta-point that decides what to hunt:** *good* languages and styles make "I am breaking the guarantee" **explicit and local** — Rust's `unsafe` block you must write and a reviewer can grep, TypeScript's lintable `any`, Kotlin's glaring `!!` that no one types by accident. *Bad* ones make the break **invisible and default** — C's `void*` reachable everywhere, a dynamic language's untyped-by-default surface, reflection buried deep where no reader will find it. So the craft move, in any language, is to make the break **shout**: confine it to a named, greppable, local place, never let it be the silent default. A `# type: ignore` with a rule-code and a reason shouts; an unannotated function that infers `Any` is silent — and the silent one is the dangerous one, because the next session reads its silence as safety.

### The cure — parse, don't validate

This is the direct antidote to the broken chain, and the single idea this lens exists to install.

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

### Primitive obsession and illegal states

Two related cures that finish closing the chain — and the place the trust-chain family meets **Lens 5 (implicit intent)**, because a domain type both proves a guarantee *and* records intent.

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

## The six lenses of the sweep

`smells-swept` is everything beyond the trust-chain. Run the six lenses over the unit; each isolates one underlying failure, names its members, and hands you the cure. This is the depth behind the [decision-tree.md smell→fix map](decision-tree.md#the-smell--fix-map-stage-4-and-the-disposition-router-stage-5) — spotting a smell is the *finding*; the lens's cure is what makes it actionable.

### Lens 1 — Coupling: change one place, ripple everywhere

**The underlying failure: things that should move independently are tangled, so a change can't be localized.** The members:

- **Shotgun surgery** — one conceptual change forces scattered edits across many files.
- **Divergent change** — the dual: *one* module changes for many unrelated reasons (its responsibilities aren't single).
- **Feature envy** — a method mostly manipulates *another* object's data; it's living in the wrong house.
- **Message chains / train wrecks** (`a.b().c().d()`) — the caller depends on a long internal structure; any link changing breaks it (Law of Demeter).
- **Temporal coupling** — you must call A before B, but nothing *enforces* the order; it lives only in someone's head.
- **Circular dependencies**, and implicit coupling through **global mutable state / singletons** (which is also Lens 2).

**The lens / cure: pursue *locality of change*** — put what changes together in one place (high cohesion), keep what changes separately apart (low coupling). Shotgun surgery and divergent change are the two failure directions of the same dial, and their fixes are opposite cohesion moves. Hide a message chain behind a method that owns the navigation. Make temporal coupling structural — a builder, a type that can't be used before it's ready, a state machine — so the order can't be got wrong. This is the *architectural* cohesion of the `load-bearing` skill, applied inside a module; the module-boundary calls themselves route there.

> **Calibrate feature envy before you flag it — the classic over-report.** The tell is *not* "this method reads another object's data." A renderer that reads ten `order` fields to format a receipt is *using* data, not envying it — exactly as the address on an envelope uses the recipient's name without belonging to them. Feature envy is when a method makes a **decision that belongs to the other object** — computes *its* discount, enforces *its* invariant, decides *its* state transition — so a piece of *behaviour* is squatting in the wrong house. "Reads a lot of `X`'s fields" is the probe (it says *go look*); the finding is "there is a *decision* here that should live on `X`," and if no such squatting decision is present, a high access count is not a smell. Mislabelling data-use as envy is the same error as counting `cast`s instead of locating leaks — the probe firing is not the verdict.

#### Static vs dynamic smells — run the three simulate-modification probes

Most of this lens's members share a property that makes them the hardest smells in the whole catalog to catch: **they are invisible to static reading.** Feature envy you can sometimes spot by eye; shotgun surgery and divergent change you cannot, because each individual site looks clean — the smell is not *in* any one place, it is in the **relationship between** places, and that relationship only reveals itself when you try to *change* something. This is the structural reason "I've read a lot of clean code" never trains the nose for these: reading exercises the *static* smells (a bad name, a long function); only *modifying* exercises the *dynamic* ones.

Since you usually can't afford to actually perform the change just to find out, **simulate it.** Three probes, each a question you put to the code without touching it, each aimed at one dynamic failure:

| Probe — "if I had to…" | …count the places you'd touch | What a high count means |
|---|---|---|
| **…change this one rule** (a tax rate, a status's meaning, a validation) | grep the concept; count the edit sites | **shotgun surgery** — one piece of knowledge smeared across many places (Lens 4 duplication, seen dynamically) |
| **…delete this feature entirely** | count the files that bleed, the imports left dangling | **coupling** — the *deletion test*; if you can't excise it in one clean PR, its dependencies have grown into the core |
| **…test this unit in isolation** | count the collaborators you'd have to mock | **mixed responsibility / no seam** — a unit that needs a dozen mocks does too much and is wired too tightly (the testability litmus of [../SKILL.md](../SKILL.md) STAGE 5, run early) |

The discipline that keeps the probes honest is the master question itself: **a probe firing is a hypothesis, not a verdict.** A high count says *go look*, not *guilty* — and the look can exonerate. A deletion test that touches nine files inside a feature that is *supposed* to be one cohesive unit with one owner is fine; nine files scattered across three unrelated contexts is the disease. The probe selects *where* to look; the diagnosis — confirmed against *"will the next changer have it easier or harder?"* — is what turns a hit into a finding. Note the agent-era division of labour this opens: the *evidence-gathering* half (run the grep, build the dependency graph, list the mocks) is exactly the mechanical work to hand an agent; the *instrument choice* (which probe to run) and the *diagnosis* (is this hit a real disease) stay with you. (The deletion test as a *design target* — arranging modules so a feature can be deleted cleanly — is `load-bearing`'s coupling heuristic; here it is a detection probe you run on code that already exists.)

### Lens 2 — Mutable shared state: you can't reason from a local read

**The underlying failure: one datum is writable by many places, at uncertain times, so reading a function locally no longer tells you how it behaves.** The members: hidden side effects, global mutable state, aliasing bugs (two names for one mutable object, so a write *here* changes a value *there*), and the sharpest form — **concurrency: races and deadlocks** (shared mutable state + multiple threads).

```python
# bad — behaviour depends on invisible, mutable, shared state
TAX_RATE = 0.0                      # mutated somewhere far away
def price(net): return net * (1 + TAX_RATE)   # reading this tells you nothing; depends on global history

# good — state is an explicit input; the function is a pure, local, reasoning-closed unit
def price(net: Cents, tax_rate: Rate) -> Cents:
    return Cents(round(net * (1 + tax_rate)))
```

**The lens / cure: make state reasoning-closed.** Prefer immutability, pure functions, and value objects; make every state change **explicit and local**; push side effects (I/O, network, the clock, randomness) out to the edges and keep the core pure — *functional core, imperative shell*. Then any function can be understood by reading it alone, which is the whole game. Note this lens is a special case of Lens 1: shared mutable state is implicit coupling through data. (The immutability/effect-typing *tooling* and errors-as-values overlap the `gauge` skill; *testing* the concurrency is `assay`'s. plumb's job is to name the smell — "this can't be reasoned about locally" — and route the mechanics.)

### Lens 3 — Size & bloat: more than fits in one head

**The underlying failure: a unit does or holds more than fits in working memory, so the cognitive load to understand it exceeds what a reader can hold.** The members: long functions, god classes / god functions, long parameter lists, **data clumps** (the same group of fields always travelling together — a value object that wants to exist), deep nesting (arrow code / the pyramid of doom), and high cyclomatic complexity.

**The lens / cure: decompose, extract, raise the abstraction level.** A sharp test is Ousterhout's **deep module**: a *good* module is a **simple interface over a complex implementation** — it hides a lot and asks little of the caller; a *bad* one is a **shallow module** whose interface is as complex as its implementation, so it hides nothing and only adds surface. A module's value is **the complexity it hides minus the complexity its interface adds** — so the cure for bloat is not just "smaller pieces" but "pieces whose interfaces are *much* simpler than their innards." (The function-shape depth — small, one thing, one level, few parameters, no flag arguments — is [functions-and-flow.md](functions-and-flow.md).)

### Lens 4 — Abstraction misalignment: not aimed at the real axis of change

**The underlying failure: the abstraction is cut along an axis that doesn't match how requirements actually vary — and *both* directions are a disease.**

- **Under-abstracted: duplication** — the same knowledge encoded in several places, so a change must be made in all of them.
- **Over-abstracted: speculative generality** — extension points, parameters, and layers built for an imagined future no one needs (the YAGNI violation); **middle man** (a class that only forwards to another); premature abstraction.

**The lens / cure: aim the abstraction at what *actually* changes.** This is the [decision-tree.md duplicate-or-abstract fork](decision-tree.md#the-duplicate-or-abstract-fork-dry-vs-aha--stage-3): **a wrong abstraction is more expensive than the duplication it replaced** (Sandi Metz), because once the two needs diverge it becomes the thing no one can change. So tolerate a little duplication until the axis of change is clear — *rule of three, then extract* (AHA: avoid hasty abstraction). DRY removes duplicated **knowledge**, not coincidentally-similar **text**. (Cohesion/coupling and SOLID/patterns depth is [abstraction-and-design.md](abstraction-and-design.md).)

**The duplication forensic — diff the twins, and watch the encoding direction.** When the sweep (or the "change this one rule" probe above) surfaces *duplicated knowledge*, don't stop at "there are two copies." Two follow-ups turn a vague smell into a precise finding:

- **Diff the copies.** Identical today means the knowledge is still latent — you can de-duplicate cleanly *before* it forks. Already-diverged means you are no longer looking at a smell but at a **live bug**: two copies of one rule that already disagree (a `> 365` in one place and a `>= 365` in another is a customer-facing inconsistency, not a style nit). The agent is a prolific source of near-identical copies, so this diff is a high-yield habit on agent-written code specifically.
- **Watch the encoding direction.** The most dangerous duplicate is one rule written *two opposite ways* — a whitelist (`status in {paid, shipped}`) here and a blacklist (`status not in {cancelled, pending}`) there. They agree today and **diverge silently the moment a new case is added**: the whitelist *excludes* it (fails safe — too-small result, waits for a human), the blacklist *includes* it (fails silent — quietly changes behaviour, no one asked). Prefer the whitelist form; better, refuse the duplication entirely and give the rule **one name and one home** (`ACTIVE = REVENUE_BEARING - {DELIVERED}`) that both sites consume — because an *anonymous* predicate has no one forced to define its semantics when the state space grows, while a named set cannot be written without answering the question. (Turning that silent drift into a CI/type signal is `gauge`'s job — its STAGE 4 *absence-is-a-signal*; plumb names the smell and the cure.)

### Lens 5 — Implicit intent: the meaning lives in your head, not the code

**The underlying failure: the code's meaning is carried by convention, comments, and tribal knowledge rather than written into the code itself** — so the next reader has to reconstruct what you meant. The members: **magic numbers / strings** (`* 0.0875`, `"PENDING"`), **flag parameters** (`f(true)` — *what* is true?), **boolean blindness** (a run of `True`/`False` no one can keep straight), **primitive obsession** (which is *also* a trust-chain leak — this is where the two families meet), and **comments-as-deodorant** (prose explaining a confusing block instead of fixing the block).

**The lens / cure: encode the intent *into the code*** — named constants, enums, value types / `NewType`, named/keyword arguments, and types that make illegal states unrepresentable. A comment that exists to make a confusing line bearable is hiding a smell the way a `cast` hides a leak; the cure is to make the code say what it means, not to annotate the unclear. (Naming — the highest-ROI form of making intent explicit — is [naming.md](naming.md); the domain-types depth is in the signature lens above; the **flag-argument** and parameter-shape depth is [functions-and-flow.md](functions-and-flow.md)'s, as for Lens 3.)

### Lens 6 — Dead matter & noise: existence is a cost

**The underlying failure: every line that exists demands attention and maintenance, but not every line pays it back.** The members: dead code (unreachable or never called), **commented-out code** ("might need it later" — version control already remembers; delete it), redundant comments that merely restate the code, unused variables and imports, and lazy classes that don't earn their keep.

**The lens / cure: delete, ruthlessly.** The least code is the most legible: there is less to read, less to understand, less to keep correct. The agent has no instinct to delete (removing code earns no green and it feels no ownership of the clutter), so this is a deliberate move — the cheapest, safest legibility win there is, and the one most often skipped.

> **Where the seventh family lives:** error handling — swallowed exceptions, exceptions-as-control-flow, over-defensive guards, leaky abstractions — is covered in [functions-and-flow.md](functions-and-flow.md) under the lens *"errors and boundaries are first-class design, not an afterthought,"* with the strict-failure *tooling* in `gauge`. It is one of the families; it just has a home of its own.

> **The meta-rule, once more:** a "smell" that doesn't actually tax the next reader is a *style opinion*, not a finding — drop it (the [decision-tree.md finding taxonomy](decision-tree.md#audit-vs-setup--pick-the-mode-then-the-finding-taxonomy)). A three-line function with a magic `2` everyone reads as "double it" is not primitive obsession waiting to be cured. Flag what *leaks* or what *genuinely confuses*; let the formatter own formatting (`flightline`).

---

## Sweep, dispose, boy-scout

A smell found and never fixed is worthless — this is **SHIFT 7**, the agent stopping at the list because producing the audit already turned the task green. `smells-swept` is not "I listed the smells"; it is "each found smell has a disposition." That disposition is the next stage's router ([testability-and-disposition.md](testability-and-disposition.md)): **fix now** if small and safe (a rename, an extract under existing tests), **refactor under test** for anything larger — handed to the `husbandry` skill, which owns the refactoring *mechanics* (small steps, behavior pinned with characterization tests first, the boy-scout rule), or **accept with a written reason** (this `cast` is a real boundary; this duplication isn't stable enough to abstract yet). The trust-chain *tooling* fixes route to `gauge`; designing the tests that pin behavior before a refactor is `assay`'s; the module-boundary calls are `load-bearing`'s. plumb names the smell and routes the fix — it does not re-implement the refactoring engine.

Two habits keep the catalog from re-filling, and both must be deliberate because the agent has neither instinct:

- **Smells are hypotheses, not verdicts.** "Smell" is the right word — it says *"something here is probably worth a look,"* not *"this is definitely wrong."* Every family has legitimate exceptions: a `cast` at a true boundary, a hand-rolled loop on a real hot path, framework-mandated boilerplate, duplication that isn't yet stable enough to abstract. **Do not turn the six lenses into a new checklist to enforce** — that is the dogma the whole skill warns against, aimed back at itself. Confirm each candidate against the master question before you call it a finding.
- **The boy-scout rule** — when you're in a file for any reason and see a cheap, safe craft improvement under the existing tests, make it; leave the code a little cleaner than you found it. Smells accumulate exactly as fast as no one disposes of them.

And when in doubt about any candidate, fall all the way back to the one question every lens is a special case of: **"will the next person to change this have an easier time, or a harder one?"** If *harder*, it is a smell, whatever its name. If you can't say *harder*, let it go.

---

**Cross-links:** [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 5 and SHIFT 7 — *why* this stage reads as it does) · [decision-tree.md](decision-tree.md) (the edge-or-core router, the smell→fix map, the disposition router this file is the depth behind) · [functions-and-flow.md](functions-and-flow.md) (the seventh family — error handling — and the function-shape smells of Lens 3) · [abstraction-and-design.md](abstraction-and-design.md) (cohesion for Lens 1, DRY-vs-AHA for Lens 4, SOLID/patterns) · [testability-and-disposition.md](testability-and-disposition.md) (where every swept smell gets disposed) · [craft-stance.md](craft-stance.md) (boring-over-clever, guidance-not-dogma) · [naming.md](naming.md) (intent-revealing names — the front line of Lens 5) · [../SKILL.md](../SKILL.md) (the six-stage flight plan this reference serves).

# Abstraction & Design — Earn It, or Don't Build It

This reference is the depth behind **STAGE 3 — Abstraction & design** of the [../SKILL.md](../SKILL.md) flight plan, the stage that decides when to extract a shared abstraction and when to leave the duplication, and whether a pattern or a SOLID split earns its place or is just structure for its own sake. It governs four things: **DRY vs the wrong abstraction**, **cohesion and low coupling inside a unit**, **SOLID and patterns as guidance**, and **resisting over-engineering**. The human-era→agent-era shift under all four is the same: abstraction used to have a *felt cost* — a human had to write and then live with the factory, the base class, the extra layer — so they hesitated, and a wrong abstraction everyone routed around was a visible, painful tax. The agent feels none of that. It generates the five-class split, the pattern, the speculative layer *for free*, and they *look* like good engineering, so "make it flexible / extensible / SOLID" produces a pile of structure the next stateless session must read through. For *why* this is the agent's signature failure, read **[agent-era-shifts.md](agent-era-shifts.md) SHIFT 4** (the agent over-abstracts — premature DRY, pattern-itis, SOLID-dogma); this file is the *how* — the calls you make at each fork.

Restate the governing fact this stage inherits from [decision-tree.md](decision-tree.md), because every fork below bends to it:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer, never applied as dogma.**

And the meta-rule that runs through this entire file, sharper here than anywhere else in the skill because abstraction is where rule-compliance most masquerades as quality: **these are guidance, not dogma. The test for every technique on this page is "does this make the code clearer and cheaper to change, or just more rule-compliant?" Over-applying any one of them — DRY, SOLID, a pattern — is its own defect, and a worse one than the thing it was supposed to fix, because it ships as "good engineering" and the next reader pays for the indirection on every read.**

Where this stage finds a real fix, it routes it: the **refactoring mechanics** of un-building a wrong abstraction or extracting a cohesive unit under test are the `husbandry` skill's; the **module-boundary / fitness-function** version of cohesion-and-coupling at the *architecture* level is the `load-bearing` skill's. plumb names the design issue and hands the mechanics off; it does not re-implement them.

---

## DRY removes *knowledge* duplication, not coincidental similarity

DRY — Don't Repeat Yourself — is real and right, but it is routinely misread as "no two passages of text may look alike." That misreading is the source of most wrong abstractions. The correct statement is narrower:

> **DRY removes duplication of *knowledge* — a single decision, rule, or fact that lives in one place. It does not remove *coincidental text similarity* — two passages that happen to look alike but encode different decisions.**

Two snippets that look identical today but answer to different requirements are **not** duplication. Abstracting them couples two things that should move independently, so the next time one requirement changes you must either contort the shared abstraction or tear it back out. The test is not "do these look the same?" but "if the rule behind one changes, must the other change with it?" — if no, they are not the same knowledge, and merging them is a coupling defect wearing a DRY badge.

```python
# NOT duplication — coincidental similarity. Two different decisions.
def is_eligible_for_trial(user):
    return user.age >= 18 and user.country in SUPPORTED

def can_purchase_alcohol(user):
    return user.age >= 18 and user.country in SUPPORTED
```

The `18` and the `SUPPORTED` set match *today*, but one is "minimum account age" and the other is "legal drinking age" — different rules from different authorities that will diverge the day one jurisdiction changes its drinking age. Hoisting them into a shared `meets_age_and_country(user)` is the wrong abstraction: it asserts a relationship that does not exist, and it will break the first time the rules part ways. Leave them separate; the *real* duplicated knowledge to factor out, if any, is the named constant `LEGAL_DRINKING_AGE = 18`, not the predicate.

### The wrong abstraction is more expensive than the duplication

> **"Duplication is far cheaper than the wrong abstraction."** — Sandi Metz

This is the load-bearing sentence of the whole stage. A wrong abstraction does not just sit there inertly like a duplicated block does; it *actively rots*. The cycle:

1. You see two similar instances and extract a shared abstraction with a parameter or two to cover the small difference.
2. A third need arrives, slightly different — you add a flag or a branch to the abstraction rather than touch the (now intimidating) shared code.
3. Repeat. The abstraction accretes parameters and conditionals, each serving one caller, until it is a parametrized monster the diverging callers *fight over* — every change risks breaking a sibling, so everyone routes around it instead of into it.
4. Now it is the thing no one can change. Un-building it costs far more than the duplication you "saved," because the callers are entangled through it.

Duplicated code, by contrast, is *visible and local*: when the pattern finally stabilizes you can collapse it in one mechanical step, and until then each copy changes independently at zero blast radius. The asymmetry is the whole point — **a duplication you can collapse later is cheap; an abstraction you must tear out is expensive** — so the burden of proof sits on the abstraction, never on the duplication.

This is exactly the agent's failure mode: it abstracts two similar snippets *immediately*, because the extraction is free to generate and *looks* like the DRY thing to do, and it never feels the cost of the monster it is seeding. The deterrent that governed a human — the tedium of building and living with the shared code — is gone, so the discipline must be a gated rule.

### The rule of three, and where the fork lives

The operational discipline is **AHA — Avoid Hasty Abstraction**: tolerate a little duplication until the pattern is genuinely stable, *then* extract. The conventional trigger is the **rule of three** — wait until you have seen the *same* knowledge duplicated *three* times before abstracting, because two points define a line through anything (you cannot yet tell what is essential and what is incidental), and three is the first evidence the shape is real and not coincidence.

The full **PREDICATE / DEFAULT / FALLBACK** routing for this call — three-times-and-stable, what to do on a coin-flip, what to do when you can't tell if the instances will diverge — already lives in [decision-tree.md](decision-tree.md) as the **duplicate-or-abstract fork**. Use it; do not re-derive it here. The short of it: on a toss-up, **tolerate the duplication** (the burden is on the abstraction), and when you genuinely can't predict divergence, leave the copies in place but *named clearly* so the relationship is visible to the next reader, and collapse them later if the pattern proves out.

| | Duplication | Wrong abstraction |
|---|---|---|
| Visibility | local, obvious, in front of you | hidden behind indirection |
| Blast radius of a change | one copy | every caller of the abstraction |
| Cost to fix when needs diverge | collapse or copy — cheap, mechanical | un-build the abstraction — expensive, entangling |
| Direction of the bet | reversible (collapse later) | one-way-ish (callers depend on it) |

The rule of three is itself **guidance, not a counting ritual.** If three instances are clearly *different knowledge* that coincidentally repeated, do not abstract on the count — the count is evidence the shape is stable, not a license that overrides the "is it the same decision?" question. And if a single piece of genuinely-shared knowledge is duplicated even *twice* in a way that will obviously drift out of sync and corrupt data (a tax rate, a serialization format, a validation rule that *must* agree), factor it now — waiting for a third copy of a single authoritative fact is dogma misapplied. The count serves the judgment; it does not replace it.

---

## Cohesion and low coupling — at the code level

The other half of good design is how a unit is *organized* and how it *connects*. Two properties, the same ones the architecture stage cares about, but here scoped *inside* a class or module:

- **High cohesion** — a class or module has **one focused responsibility**, and its parts (fields, methods) all serve that one job. A class whose methods split into two clumps that don't touch each other's data is two classes wearing one name; a module that handles parsing *and* HTTP *and* retry policy is three concerns sharing a file. Cohesion is "everything in here belongs together."
- **Low coupling** — the dependencies between units are **few and explicit**, so changing one place doesn't ripple into many others. A unit that reaches into another's internals, or that must be edited every time an unrelated unit changes, is tightly coupled. Coupling is "this can change without dragging that with it."

The two are a pair: raise cohesion and coupling tends to fall, because related things that live together stop reaching across boundaries. They are the *why* behind half the smells in [smells-and-trust-chains.md](smells-and-trust-chains.md) — **shotgun surgery** (one change scattered across ten places) is low cohesion made visible, and **feature envy** (a method that mostly manipulates another object's data) is the method living in the wrong unit, a coupling tell. When you spot those smells, the fix direction is "raise cohesion": move the related behavior to live with the data it serves.

> **The boundary with `load-bearing`:** the *architectural* version of this — module boundaries between deployable or top-level units, dependency rules, fitness functions that fail the build when a seam is crossed — is the `load-bearing` skill's, and it owns the machine-enforcement. STAGE 3 here is the **same idea one level down**: cohesion and coupling *inside* a unit, judged by reading, not by an architecture-fitness test. If the cohesion problem is really a *module-boundary* problem (two top-level subsystems entangled), that is `load-bearing`'s call, not a plumb finding — route it there.

The agent failure this guards against is the same free-structure reflex: an agent will happily wire any unit to any other for the shortest path to green (coupling it didn't feel), and pile unrelated concerns into one class because it works (cohesion it didn't feel). Neither shows up in a passing test, which is why cohesion and coupling are *read and judged*, not measured by the suite.

---

## SOLID as guidance — each principle, and each over-application

SOLID is five principles that, used well, push toward flexible, changeable object-oriented code. Each is a one-sentence idea — and each has a characteristic *over*-application that is worse than ignoring the principle, because the over-applied version ships as "clean architecture" and taxes every reader. Hold both columns at once: the principle, and the failure of taking it too far.

| Principle | The guidance (one sentence) | The over-application failure |
|---|---|---|
| **S** — Single Responsibility | A unit should have one reason to change — one responsibility, one axis of change. | Splitting a coherent class into **eight one-method classes** because each line "could" be a separate reason to change; now the logic is shattered across files and you read all eight to understand one operation. Lower cohesion, dressed as SRP. |
| **O** — Open/Closed | Open to extension, closed to modification — you should be able to add behavior without editing the existing, tested code. | Building an **extension/plugin mechanism for a thing that has exactly one implementation and always will** — speculative generality (YAGNI). The hook points are indirection with no second case to justify them. |
| **L** — Liskov Substitution | A subtype must be usable anywhere its base type is, without surprising the caller (no strengthened preconditions, no broken invariants). | Contorting a class hierarchy to *technically* satisfy substitutability when the two types simply **aren't an is-a relationship** — forcing inheritance where composition was the honest model. |
| **I** — Interface Segregation | A client shouldn't be forced to depend on methods it doesn't use — prefer several small, role-focused interfaces over one fat one. | **Shattering one cohesive interface into a dozen single-method interfaces** nobody implements separately, so every consumer juggles a fistful of types to express one collaborator. Indirection with no client that benefits. |
| **D** — Dependency Inversion | Depend on abstractions, not concretions — high-level policy shouldn't be wired directly to low-level detail. | **An interface for every class** "to be testable / decoupled," including ones with a single implementation that will never have another. A `FooImpl`-behind-`IFoo` for every concrete type is ceremony, not decoupling. |

The meta-caveat ties the column together: **splitting, inverting, or segregating *for the sake of SOLID* is over-engineering.** Each principle answers a real pressure — too many responsibilities in one place, editing tested code to extend it, a surprising subtype, a bloated interface, policy welded to detail. When that pressure is *actually present*, the principle relieves it and the code gets clearer. When it isn't, applying the principle anyway adds indirection the next reader must traverse for no gain. The router for "does this split/principle make it clearer or just more correct?" is the **pattern/SOLID router** in [decision-tree.md](decision-tree.md) — its PREDICATE is exactly that question. Use it; don't re-run the logic here.

The agent's tell: it produces the *over-application* column by default — the `IFoo`-for-every-`Foo`, the eight-class SRP split, the plugin system with one plugin — because that shape saturates its training as "good engineering" and costs it nothing to generate. SOLID-as-dogma is therefore something to *flag as a finding*, not a quality bar to enforce upward.

---

## Design patterns — shared vocabulary, not a checklist

Design patterns (Strategy, Factory, Observer, Adapter, Decorator, and the rest) are **named, mature solutions to recurring design problems.** Their genuine, first-order value is **communication**: a pattern is a shared word. When someone says "use a Strategy here," a team that knows the vocabulary instantly understands the shape — a family of interchangeable behaviors behind one interface, selected at runtime — without spelling out the whole structure. That compression is real and worth having; patterns are a vocabulary for designs the way design idioms are a vocabulary for the team.

But the value is in *recognizing a pattern that is already present*, not in *installing patterns to look engineered*. The anti-pattern is **pattern-itis**: reaching for a pattern where the problem it solves is not actually there.

```python
# Pattern-itis: a Factory + an abstraction layer to wrap three lines.
class GreeterFactory:
    def create_greeter(self) -> "Greeter":
        return EnglishGreeter()

class Greeter(ABC):
    @abstractmethod
    def greet(self, name: str) -> str: ...

class EnglishGreeter(Greeter):
    def greet(self, name: str) -> str:
        return f"Hello, {name}"

greeting = GreeterFactory().create_greeter().greet("Sam")
```

```python
# What it actually needed:
def greet(name: str) -> str:
    return f"Hello, {name}"

greeting = greet("Sam")
```

The Factory and the abstract base buy *nothing* here — there is one greeter, there will be one greeter, and the indirection exists only so the code *resembles* a textbook. The next session reads three files to find out it says "Hello." Pattern-itis is using a pattern to **show off, or to pad, or to pre-empt a flexibility that no requirement demands** — the agent's favorite version, because the elaborate structure looks like competence and costs it nothing to emit.

The rule, which is just the meta-rule pointed at patterns: **reach for a pattern when the problem it solves is genuinely present, not to pre-empt one.** A Strategy when you *do* have a family of interchangeable behaviors selected at runtime: yes, and now the team has a name for it. A Strategy because you *might someday* have a second behavior: no — that is speculative generality; write the one behavior plainly and grow into the pattern *if and when* the second case actually arrives (it is cheaper to evolve simple code into a pattern than to un-build a pattern whose flexibility never materialized). The pattern/SOLID router in [decision-tree.md](decision-tree.md) is the gate, and its DEFAULT on a coin-flip is **simple code**.

---

## Over-engineering, KISS, and YAGNI — the agent's favorite failure

Everything above converges on one disease with several names. **Over-engineering** — also **speculative generality** (building for needs you imagine but don't have), violating **KISS** (Keep It Simple), and **YAGNI** (You Aren't Gonna Need It) — is the addition of structure, flexibility, or abstraction that the present problem does not require.

This is **the agent's signature defect at this stage**, for a specific reason: the agent *generates structure for free* and the structure *looks sophisticated*. A human hesitated before building a config system, a plugin registry, an extra layer, because they would have to write and maintain it; the agent feels no such tedium, and its training is saturated with elaborate "enterprise" designs that read as competence. So "make this robust / flexible / extensible / future-proof" reliably produces a pile of speculative machinery — config for one case, an interface with one implementer, a plugin system with no plugins, a generalized framework where a function would do — that the next stateless session must read through to find the three lines that matter. The structure is not a bug a test will catch; it ships green and *impressive*, which is exactly why it must be judged and flagged, not trusted.

Apply the **single test** to every abstraction, pattern, principle, and split on this page:

> **Does this make the code clearer and easier to change — or just more "correct," more flexible-in-theory, more rule-compliant, more sophisticated-looking?** If the latter, delete the structure and keep it simple.

```python
# Over-engineered: a configurable, strategy-driven discount "engine"
# for a flat 10% off. Speculative generality with one real case.
class DiscountStrategy(ABC):
    @abstractmethod
    def apply(self, price: Decimal) -> Decimal: ...

class PercentageDiscount(DiscountStrategy):
    def __init__(self, rate: Decimal) -> None:
        self.rate = rate
    def apply(self, price: Decimal) -> Decimal:
        return price * (1 - self.rate)

class DiscountEngine:
    def __init__(self, strategy: DiscountStrategy) -> None:
        self.strategy = strategy
    def calculate(self, price: Decimal) -> Decimal:
        return self.strategy.apply(price)

final = DiscountEngine(PercentageDiscount(Decimal("0.10"))).calculate(price)
```

```python
# What the requirement was: 10% off.
def apply_member_discount(price: Decimal) -> Decimal:
    return price * Decimal("0.90")

final = apply_member_discount(price)
```

The "engine" is defensible *only if a second discount kind is a present, funded requirement* — then a Strategy is the right named shape and the abstraction is earned. With one flat discount, it is over-engineering: four types and an injection where one function and one literal carry the whole meaning. When the second discount actually arrives, you grow into the Strategy then, cheaply, with the real shapes in hand — which is strictly better than guessing the abstraction now and discovering the second case doesn't fit it.

Note the symmetry that makes the meta-rule honest: **over-applying a craft rule is itself over-engineering.** The eight-class SRP split, the `IFoo` for every `Foo`, the rule-of-three abstraction extracted on a coincidence — these are over-engineering *committed in the name of clean code*, and they are the most insidious kind, because they wear the badge of the very discipline they violate. The cure is the same single test, and the same DEFAULT the [decision-tree.md](decision-tree.md) routers all share: when it's a toss-up, **the boring, simpler, more reversible option wins** — plain code over a pattern, duplication over a hasty abstraction, one function over four classes. You can always grow simple code into structure later; un-building speculative structure everyone has come to route around is the expensive direction.

---

## Handoff

You leave STAGE 3 with the abstractions *earned* (or the duplication knowingly tolerated, named clearly), the units cohesive and loosely coupled, and every pattern / SOLID split / layer that failed the "does it make it clearer?" test marked as a finding — over-engineering flagged, not enforced. Where a fix is real: the **mechanics** of un-building a wrong abstraction or extracting a cohesive unit go to the `husbandry` skill (small steps, behavior pinned under test first — never an un-tested craft refactor); an *architecture-level* boundary problem masquerading as a cohesion finding goes to `load-bearing`. Carry the findings into STAGE 4 ([smells-and-trust-chains.md](smells-and-trust-chains.md)), where cohesion and coupling reappear as concrete smells with concrete fixes, and into the disposition router in [decision-tree.md](decision-tree.md) where each one is fixed, refactored-under-test, or accepted with a written reason. Return to [../SKILL.md](../SKILL.md) to clear the STAGE 3 gate — `abstraction-earned` and `patterns-solid-as-guidance`.

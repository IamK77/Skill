# Enforce Boundaries — fossilize the architecture into machine gates

This reference is the depth behind **STAGE 0 — Enforce** of the [../SKILL.md](../SKILL.md) flight plan, the first and load-bearing stage of `bulwark`. It governs one check: **`boundaries-machine-enforced`** — the architecture made *self-enforcing*, so it does not depend on anyone remembering the rules. It is the engine `bulwark` runs first because every other stage assumes the boundaries already hold.

The governing fact, inherited from [the-membrane.md](the-membrane.md) (AXIS 1, Scope) and restated because every move below is a consequence of it:

> **A boundary that lives only in a head or a wiki is already violated; only a boundary the machine rejects at merge time holds — and every real violation must become a new permanent rule.**

This is not a counsel of vigilance. Vigilance is exactly what 1-to-N cannot afford: at scale, across years, with a stateless agent session as the next maintainer, *no one remembers the rules*. The master's move is not to remember harder — it is to **move every rule out of human memory and into a gate** the CI refuses to merge without. Machine-enforcement is a *means*, not an end: the end is that the dependency graph keeps the shape you designed instead of decaying into "whoever was in a hurry."

## Contents

- [The agent-era failure mode this stage counters](#the-agent-era-failure-mode-this-stage-counters)
- [The five deliverables of self-enforcement](#the-five-deliverables-of-self-enforcement)
- [Deliverable 1 — import/layer rules](#deliverable-1--importlayer-rules)
- [Deliverable 2 — the public-API (single-entry) module](#deliverable-2--the-public-api-single-entry-module)
- [Deliverable 3 — lint-able state-classification rules](#deliverable-3--lint-able-state-classification-rules)
- [Deliverable 4 — architecture fitness functions in CI](#deliverable-4--architecture-fitness-functions-in-ci)
- [Deliverable 5 — CODEOWNERS on the load-bearing files](#deliverable-5--codeowners-on-the-load-bearing-files)
- [The immune-system meta-rule](#the-immune-system-meta-rule--every-violation-becomes-a-permanent-rule)
- [When the call is unclear](#when-the-call-is-unclear)
- [Where findings route](#where-findings-route)

---

## The agent-era failure mode this stage counters

A human author *felt the cost* of a boundary they were about to cross. The deep import into another feature's internals was the shortest path to working code — but the human knew they would have to untangle it next month, so they felt a small friction and reached for the public entry instead. That friction is the entire human-era enforcement mechanism, and **the agent does not have it.**

The agent crosses a boundary for convenience and feels *zero* cost to the architecture. A direct import into another module's guts compiles, passes the tests, and turns green — so unless the machine rejects it, the boundary you designed quietly dissolves, one "just this once" cross-import at a time. This is **boundary erosion**, one of the two lines along which a living frontend rots ([the-membrane.md](the-membrane.md) calls it spooky-action-at-a-distance, now at the module level). It is invisible: each individual import looks clean; the disease is in the *relationship* between modules, and that only reveals itself when the graph has already drifted.

So the design consequence is forced: **the boundary must be a fact in the code, checked at merge, not a sentence in a doc the next session never reads.** A boundary the machine refuses is the only kind that survives contact with a stateless maintainer who has no memory of which boundary is load-bearing. Everything below is a way to fossilize one rule into one gate.

---

## The five deliverables of self-enforcement

Five concrete artifacts, each moving one class of rule out of memory and into the machine. They compose: the import rules and the public-API module shape the graph, the state-lint and fitness functions guard the structure's properties, CODEOWNERS guards the files that define all of it, and the immune-system meta-rule grows the set over time.

| # | Deliverable | The rule it fossilizes | The gate |
|---|---|---|---|
| **1** | Import/layer rules | which module may depend on which | CI red on a forbidden import |
| **2** | Public-API module | a module is reached only through its one entry | CI red on a deep import |
| **3** | State-classification lint | truth is written only in its designated bucket | CI red on a stray store/`localStorage` write or a state-into-state effect |
| **4** | Fitness functions | the structure's invariants (no cycles, layering, bundle budget) | CI red on a structural assertion failing |
| **5** | CODEOWNERS | the load-bearing files change only under review | merge blocked without the owner's approval |
| **meta** | Immune-system rule | every real violation that *could* have been caught | a new permanent rule added after each breach |

> **All of it is a means, not an end.** The point is never "we have lint." It is that the designed module graph, the small source of truth, and the honest contracts stay true *without anyone remembering to keep them true*. A rule that does not catch a real class of mistake is noise; a rule that catches one is a guard. Add guards, not noise.

---

## Deliverable 1 — import/layer rules

Encode the dependency graph you designed as rules a linter checks. A cross-boundary import turns CI **red** at merge — this fossilizes the designed module graph into a fact in the code, not an aspiration in a diagram.

The three canonical rules, stated in the source's own terms (tools named only as examples — an `eslint-plugin-boundaries`-class layer linter, `no-restricted-imports`, a `dependency-cruiser`-class graph checker — never mandated):

| Rule | What it forbids | Why it is load-bearing |
|---|---|---|
| **Layer A can't import layer B** | upward or sideways imports that break the layering | keeps the dependency direction acyclic and the layers meaningful |
| **Features can't import each other's internals — only the public entry** | feature-to-feature deep imports | keeps features isolated, so one can be deleted or changed without bleeding into another |
| **The UI layer can't touch the data layer** | a component reaching past the data-access seam | keeps the two graphs (component tree vs data dependency) from fusing into one tangle |

**Worked before/after.** A feature `cart` needs the current user. The convenient path the agent takes:

```ts
// BAD — cart reaches into profile's internals; an invisible edge in the dependency graph
import { userStore } from "../profile/state/userStore";   // deep import, another feature's guts
```

The forbidden import is caught at merge: the linter knows `features/*` may not import `features/*/...` except through the public entry. The fix routes through the boundary the source designed:

```ts
// GOOD — cart consumes profile only through its one public entry
import { useCurrentUser } from "../profile";   // the public-API surface; internals stay private
```

> **PREDICATE:** is the import within one feature, or across the layer/feature seam you drew? **DEFAULT** (a coin-flip case, e.g. a shared util both features use): hoist the shared thing to a lower *shared* layer both may legitimately depend on, rather than letting one feature import the other. **FALLBACK** (you cannot yet tell whether the seam is real): add the rule in *warn* mode, watch the violations for a sprint, then promote to *error* once the legitimate exceptions are known — a rule you can relax is cheaper than a leaked boundary.

---

## Deliverable 2 — the public-API (single-entry) module

Each module exposes **one** entry — an `index` — and deep imports into its internals are lint-banned. This keeps the dependency graph the shape *you* designed, not the shape "whoever was in a hurry" left behind.

The mechanism: the module's directory has a single public surface (`index.ts`) that re-exports exactly what is meant to be consumed; everything else is private. The import rule from Deliverable 1 forbids any path that reaches *past* the index. The payoff is that the module's internal structure becomes **freely refactorable** — you can move, rename, split its internal files without breaking a single consumer, because no consumer was ever allowed to depend on them. The public entry is the only contract; the internals are reversible.

```
features/cart/
  index.ts          ← the ONLY thing other modules may import
  state/cart.ts     ← private; deep import is lint-banned
  api/checkout.ts   ← private
  components/...     ← private
```

This is the same move as scope at the language level (lexical scope solved spooky-action-at-a-distance decades ago) applied to modules: the index *is* the module's lexical boundary. A deep import is a reach into another scope's locals.

> **PREDICATE:** does a consumer need something the index does not export? **DEFAULT:** add it to the public surface deliberately (now it is part of the contract, and you will think before changing it) rather than reaching past the index. **FALLBACK:** if exporting it would leak an internal you do not want to commit to, that is a signal the consumer wants a *capability* the module should provide as a function, not a raw internal — design the entry, don't widen the crack.

---

## Deliverable 3 — lint-able state-classification rules

Not all of the state classification ([the-membrane.md](the-membrane.md) AXIS 2/3, owned for *re-classification* by [prune.md](prune.md)) can be linted — but the high-frequency violations can, and those are exactly the ones the agent commits without friction. Lint what you can; gate the rest.

Two rules carry most of the weight:

- **Ban writes to the global store / `localStorage` outside the designated layers.** If only the data layer may write the global store, a component that writes it directly is migrating truth into the wrong bucket — the start of two-graph drift. A `no-restricted-imports`-class or custom rule that forbids the store's write API outside the allowed paths turns this red at merge.
- **Flag the state-into-state synchronization smell** — the `useEffect`-class effect that copies one piece of state into another (the stored-derived-value smell from the state-architecture stage). A custom lint rule that matches "an effect whose only job is to set state from other state" surfaces it. Derived state must be *computed on the spot*, not stored; a stored copy is a synchronization contract the next session will forget.

```ts
// BAD — flagged: a derived value stored and an effect signed to keep it in sync
const [filtered, setFiltered] = useState<Item[]>([]);
useEffect(() => {
  setFiltered(items.filter((i) => i.active));   // state-into-state; will drift the moment `items` changes out of band
}, [items]);

// GOOD — derived on the spot; no second copy, no contract to forget
const filtered = items.filter((i) => i.active);
```

The lint *catches* the smell; the *fix* (inline the derived value, reclassify the drifted store slice) and the store-size thermometer live in [prune.md](prune.md). Enforce names the rule and makes it red; prune does the periodic sweep.

> **The boundary of what to lint:** lint the *mechanical* rule (this API may not be called here), not the *judgment* (is this datum really independent state). The judgment is the user's and the prune pass's. A lint rule that tries to encode judgment will misfire and get disabled — the worse failure, because a disabled rule is a boundary that *looks* enforced and is not.

---

## Deliverable 4 — architecture fitness functions in CI

A **fitness function** is an executable assertion about the *structure itself* — not about behavior, which the tests own ([../SKILL.md](../SKILL.md) routes behavior to `trials`), but about the architecture's invariants. (Gloss it on first use for the user: a fitness function is a test that fails the build when the *shape* of the codebase violates a property you decided must always hold.) Run them in CI; a violation turns the build red.

The three from the source, each a property a `dependency-cruiser`-class tool or a bundle analyzer can assert:

| Fitness function | Asserts | Catches |
|---|---|---|
| **No circular dependencies** | the import graph is acyclic | a cycle the agent introduced by an expedient import — the tangle that makes any change ripple |
| **Layer X does not depend on layer Y** | the layering holds globally, not just at the file the import rule saw | a transitive leak the per-file import rule missed |
| **A route's bundle is under budget** | the shipped bundle for a route stays below a number | performance rot — the route that quietly grew past the perceptual budget as features piled on |

The difference from Deliverable 1: an import rule guards *one import at a time* as it is written; a fitness function guards a *global property* of the whole graph, so it catches the emergent violation no single import looked guilty of. Run both — the import rule for the fast local signal, the fitness function for the structural invariant.

> The bundle-budget fitness function is where this stage touches performance: the perceptual performance budget pinned in an earlier stage becomes a *standing* CI gate here, so the Nth feature can't silently push a route past it.

---

## Deliverable 5 — CODEOWNERS on the load-bearing files

Some files are not like the others: the contracts, the core types, the module-boundary definitions, the import-rule config itself. A change to these is a change to the *architecture*, not to a feature — and it must not pass on the strength of one stateless session's confidence. Put **CODEOWNERS** on them: a change to a load-bearing file requires the owner's review before it can merge.

This is the one deliverable that gates a *human* (or a designated reviewer) rather than a pure machine check, and that is deliberate: which boundary is load-bearing is a judgment the machine cannot make, so the call to *change* a boundary is routed to the person who can. CODEOWNERS does not decide the change; it guarantees the right eyes see it. The set is small by design — if everything is owned, nothing is, and review becomes a rubber stamp. Own the files where a wrong change is expensive and irreversible (the data model, the network contract, the layering config), and leave the reversible feature code free.

> **PREDICATE:** would a wrong change to this file be a one-way door (expensive to walk back, breaks callers, drifts a contract)? Then it is load-bearing → CODEOWNERS it. **DEFAULT:** when unsure, owning is cheap and un-owning is free — err toward owning the seam, then remove it if review proves a no-op. **FALLBACK:** if you cannot name an owner, that is itself a finding — a load-bearing file with no owner is a bus-factor risk the vitals stage will eventually read as rot.

---

## The immune-system meta-rule — every violation becomes a permanent rule

This is the move that makes the architecture *defend itself across years*, and it is the through-line of the whole stage. The other deliverables fossilize the boundaries you can foresee; this one grows the set from the ones you couldn't.

> **Every time a boundary is violated by accident, ask: "is there a lint rule that would have caught it?" — and if so, add it.**

The boundary set is not written once and frozen. It *grows* by turning each real violation into a permanent guard, the way an immune system remembers a pathogen so the second exposure is caught at the door. A violation that slipped through is information: it names a class of mistake your current gates don't cover. Encode that class as a new rule, and the same mistake can never recur silently — not from this session, not from the next, not from a human in a hurry two years from now.

This is why the stage has **no exit**: the rule set is alive, and it should be *larger* every quarter than it was the last, because every quarter surfaces violations the previous rule set didn't anticipate. A boundary set that never grows is a sign you've stopped looking, not that you've achieved perfection. (The vitals stage reads "each new violation class turned into a rule" as one of its standing health signs — see the vitals section of [conway-and-design-system.md](conway-and-design-system.md).)

The agent-era sharpening: the agent will keep finding *new* shortest-paths-to-green you didn't foresee, because it explores the space of expedient moves without the friction that would have stopped a human. So the immune response must be deliberate and routine — the agent will not add the guard on its own (adding a rule earns no green; it only constrains the next add), so the human keeps this move, and the discipline is: **a violation is never just fixed, it is fixed *and* fenced.**

---

## When the call is unclear

The cards above carry their own PREDICATE / DEFAULT / FALLBACK. When those don't resolve it — is this import a legitimate cross-boundary use or a leak, should this file be owned, is this rule worth its noise — climb the [escalation ladder in the-membrane.md](the-membrane.md#escalation-ladder--when-the-call-is-unclear) rather than guessing silently. The asymmetry that governs every rung: **an over-cautious enforcement choice costs the agent a little friction — a slightly stricter rule, an extra public-entry export, a CODEOWNERS review; a leaked boundary costs every future maintainer the entropy tax on every change, for the life of the system.** When it is a genuine toss-up, err toward machine-gated, smaller-source-of-truth, and reversible. And note the agent-era division of labour: building the rule, wiring the CI check, running the graph analysis is exactly the mechanical work to hand the agent; *which* boundary is load-bearing and *whether* a violation is real stay with the user.

---

## Where findings route

Enforce owns **the machine-enforcement of boundaries** — and only that. It does not prune, align teams, or build the catalog; those are siblings.

- A **drifted store slice, a wrong abstraction, a stale flag, or stored derived state** the import-audit or state-lint surfaces → route to [prune.md](prune.md). Enforce makes the *new* violation red; prune runs the periodic sweep that removes the *accumulated* rot and re-classifies the drift (the store-size thermometer is prune's).
- A **misplaced boundary** — a routine change that needs three teams, a module seam fighting the org chart — is not an enforcement bug; the rule is correctly enforcing a boundary drawn in the wrong place. Route to the Conway section of [conway-and-design-system.md](conway-and-design-system.md): move the seam to the team line, *then* the import rule guards the right boundary.
- A **boundary set that has stopped growing**, or an enforced architecture only a senior can navigate → the vitals read (newcomer time-to-first-independent-delivery), in the vitals section of [conway-and-design-system.md](conway-and-design-system.md).
- The **judgment that a rule encodes** — which boundary is load-bearing, whether the team structure should change to produce the architecture (inverse Conway) — is the *user's*; surface it, don't decide it. See [the-membrane.md](the-membrane.md).

It pairs with the engineering suite without duplicating it: the *general* process floor — branching, the CI pipeline itself, dependency hygiene — is `flightline`'s; the *general* maintenance-and-evolution craft — refactoring mechanics, debt classification, the same add-never-remove agent failure in the large — is `husbandry`'s; the static-layer *tooling* a state-lint rule leans on is `gauge`'s. `bulwark`'s Enforce is the *frontend dialect*: feature isolation, the public-API module, the state-classification lint, the bundle-budget fitness function, the two-graph-drift gates.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 1 Scope — *why* boundaries must be machine-gated; the escalation ladder; the gate map) · [prune.md](prune.md) (the periodic sweep, the extract/delete/keep flow, state reclassification — where surfaced rot routes) · [conway-and-design-system.md](conway-and-design-system.md) (the Conway section — where a *misplaced* boundary routes; the vitals read of whether enforcement is working) · [../SKILL.md](../SKILL.md) (the five-stage steady-state loop this reference's STAGE 0 opens).

# Prune — extract/delete/keep, dead matter, and state reclassification

This reference is the depth behind **STAGE 1 — Prune** of the [../SKILL.md](../SKILL.md) flight plan, the counter-move to the agent's add-never-remove default. It governs one check: **`abstractions-pruned-and-state-reclassified`** — the discipline of *removing*, in a stage whose enemy is accretion.

A living frontend rots in one direction by default: **everything only gets added.** A feature, an abstraction, a flag, a store slice — each one arrives, each one turns green, and none of them ever leaves. The agent is the purest form of this bias: adding earns a passing test and a closed ticket, while deleting earns nothing and *feels* risky, so the agent's natural output is **entropy** — a global store that only grows, abstractions that only stack, flags that linger past their rollout, and derived values quietly stored where they should have been computed. None of it turns anything red. **That is exactly why prune must be a gate and not a good intention:** the one motion the agent will never perform on its own is the one this stage forces.

The governing fact, inherited from [the-membrane.md](the-membrane.md) (AXIS 2, the two graphs) and restated because every call below is judged against it:

> **A wrong abstraction is more expensive than the duplication it replaced** — duplication is local and *visible*, but a wrong abstraction is an invisible edge in the dependency graph that couples distant things. So the maintenance-era bias inverts the building-era one: when unsure, prefer to *delete the abstraction and duplicate*, never to keep a leaky shared thing.

## Contents

- [The map — three prunes, one gate](#the-map--three-prunes-one-gate)
- [Prune 1 — the abstraction: extract / delete / keep](#prune-1--the-abstraction-extract--delete--keep)
  - [The decision flow, in order](#the-decision-flow-in-order)
  - [The two tells — the flag-argument and the no-escape-hatch](#the-two-tells--the-flag-argument-and-the-no-escape-hatch)
  - [Worked example — the order-status badge](#worked-example--the-order-status-badge)
  - [Inlining is the cure, not the failure](#inlining-is-the-cure-not-the-failure)
- [Prune 2 — the dead: unused exports, stale flags, stored derived state](#prune-2--the-dead-unused-exports-stale-flags-stored-derived-state)
- [Prune 3 — reclassify the drifted state: the store-size thermometer revisited](#prune-3--reclassify-the-drifted-state-the-store-size-thermometer-revisited)
- [The agent-era failure mode this gate counters](#the-agent-era-failure-mode-this-gate-counters)
- [Disposition and routing](#disposition-and-routing)

---

## The map — three prunes, one gate

The gate `abstractions-pruned-and-state-reclassified` is three distinct passes that share one verb (*remove*) and one root cause (*the two graphs drifting as features pile on*):

| # | The prune | What it removes | The tell that triggers it | Routes to |
|---|---|---|---|---|
| **1** | The abstraction | a wrong/premature shared thing | consumers fight it, or it's used once or twice | inline it back, or split it |
| **2** | The dead | unused exports, stale flags, stored derived values | a `knip`/`ts-prune`-class pass; a flag at 100% with no reader | delete; re-audit the import graph |
| **3** | The drifted state | state living in the wrong bucket | the global store is *growing* | re-run the classification tree; reclassify |

These are not independent. A wrong abstraction (Prune 1) is itself dead weight; stored derived state (Prune 2) is also a state-classification error (Prune 3); and all three are surfaced by the same instrument — *watching what grows when no one is watching*. The agent plants all three the same way: it adds, never reclassifies, and the two graphs (component tree vs data-dependency graph) diverge invisibly. The build-era skill was *when to extract* (the rule of three, owned by the suite's state-architecture stage); **the harder maintenance-era skill is when to delete** — because abstractions rot too.

---

## Prune 1 — the abstraction: extract / delete / keep

The rule of three governs *extraction*: don't abstract the first or second occurrence of a pattern; extract only on the third, *and only when the behavior is genuinely shared* — because premature abstraction does far more harm than a little duplication. This stage owns the inverse: for any abstraction that *already exists*, decide whether it has earned its place or should be dissolved.

### The decision flow, in order

Run this on any existing abstraction. The order is deliberate — the cheapest, most decisive disqualifier first; first hit wins.

| # | Ask | If… | Then |
|---|---|---|---|
| **Q1** | Used 3+ times **and** is the behavior genuinely shared? | **No** — used once or twice, or the "sharing" is coincidental similarity, not essential | **Premature / wrong abstraction → inline it back.** Delete the abstraction, duplicate the code. Duplication is cheaper than a wrong abstraction. |
| **Q2** | Are consumers *fighting* it — passing flags to make it behave differently, or everyone needing an escape hatch? | **Yes** | It coupled **unrelated** things (it abstracted a coincidental likeness, not an essential one) → **split it or delete it.** The flag-argument is the tell — see below. |
| **Q3** | Can a consumer **escape** when it hits an edge case the abstraction didn't foresee? | **No** — there's no escape hatch | It's a trap → **refactor to headless/compound, or delete.** Give primitives, not a monolith. |
| **Q4** | Load-bearing **and** stable — used widely, rarely changes, no one fights it? | **Yes** | **Keep it.** It's earning its keep. This is the only branch that keeps. |

The bias when a call is genuinely close: **DEFAULT to delete-and-duplicate.** A wrong abstraction is an invisible coupling edge between distant parts of the dependency graph; duplication is local and a reader can *see* it. You can always re-extract later when the axis of change is clear; you cannot easily see the harm a leaky abstraction is doing.

### The two tells — the flag-argument and the no-escape-hatch

Two structural signs reliably out a wrong abstraction without needing to trace every call site:

- **The flag-argument tell (Q2).** When an abstraction sprouts boolean parameters that *switch its behavior* — `renderCard(data, { compact, withActions, asLink })` — **it is two things wearing one coat.** Each flag is a seam where two different responsibilities were welded together because their *code* looked similar, not because their *concept* is one. The fix is to split along the flags into the things they were always separately describing. (A boolean that configures *data*, like `disabled`, is not this smell; a boolean that selects *which behavior runs* is.)
- **The no-escape-hatch tell (Q3).** A good abstraction lets a consumer drop down a level when it hits a case the abstraction didn't anticipate. **Compound components** (`<Select><Select.Option/></Select>`) and **headless hooks** pass this test — the consumer can compose around the edge case, or take the raw state and render its own. A giant configure-everything monolith (`<Select optionsConfig={…} renderEverything={…} />`) fails it: when the edge case arrives, the consumer is trapped, and the abstraction that was supposed to save work becomes the thing no one can change. **Give primitives, not a behemoth.**

> **PREDICATE for "genuinely shared" (Q1):** the behaviors must change *together* for the *same reason*. If a future requirement would change one consumer's use but not the others', the likeness was coincidental — inline. **FALLBACK** when you cannot tell: treat it as coincidental and inline; re-extraction on a later rule-of-three is cheap, un-coupling a wrong abstraction across N call sites is not.

### Worked example — the order-status badge

Three call sites render an order's status. An agent sees three near-identical JSX snippets and "DRY"s them into one component:

```tsx
// The abstraction the agent reached for — already sprouting flags
function StatusBadge({ status, showIcon, clickable, size, tone }: StatusBadgeProps) {
  // a growing thicket of conditionals, one per flag, per consumer's need
}
// Consumer A: <StatusBadge status={o.status} showIcon size="sm" />
// Consumer B: <StatusBadge status={o.status} clickable tone="muted" />   // opens a drawer
// Consumer C: <StatusBadge status={o.status} showIcon clickable size="lg" tone="loud" />
```

Run the flow. **Q1**: used 3 times — but is the behavior *genuinely* shared? The three sites render the same *string*, but A is a read-only table cell, B is an interactive filter control, C is a page-header hero. **Q2**: consumers are already fighting it — `clickable`, `tone`, `size`, `showIcon` are flag-arguments switching behavior; this is the tell that it coupled three unrelated things. The "sharing" was the *status-to-label map*, not the component. Disposition: **split.** Extract the one thing that is genuinely shared knowledge — the status→label/color mapping — into a tiny pure function or token set, and let each site render its own badge from it:

```tsx
// The genuinely-shared knowledge: a pure lookup, no behavior, no flags.
const STATUS = { paid: { label: "Paid", tone: "ok" }, shipped: { label: "Shipped", tone: "info" } } as const;
// Each consumer renders its own badge — duplication of a few lines of JSX, zero coupling.
```

The duplication that remains (three small `<span>`s) is local and visible; the coupling that's gone was an invisible edge that would have forced every status-rendering site to change in lockstep.

### Inlining is the cure, not the failure

Deleting an abstraction and restoring duplication *feels* like regression, which is exactly why the agent won't do it and why it must be gated. Reframe it: inlining a wrong abstraction is removing a hidden edge from the dependency graph, restoring **locality of change**. The deleted abstraction is not lost — version control remembers it, and the rule of three will resurrect a *correct* one when the real axis of change reveals itself.

---

## Prune 2 — the dead: unused exports, stale flags, stored derived state

Run this pass on a schedule, not on inspiration — the dead accumulates exactly as fast as no one removes it. A `knip`/`ts-prune`-class tool does the mechanical evidence-gathering (the part to hand an agent); the judgment of *what is truly dead vs. what is a public API or a not-yet-wired feature* stays with you.

- **Unused exports.** A module's public surface that nothing imports is dead weight that still demands attention on every read and every refactor. Delete it. **PREDICATE:** "unused" means unused *within the repo's reachable graph* — a deliberately-published library entry point is not dead; a leftover internal helper is.
- **Stale feature flags.** A flag rolled to 100% three months ago and never deleted is **an un-merged fork** — both branches of every `if (flag)` still in the code, the dead branch a permanent reading tax and a latent bug surface. A flag is *debt*: it buys you a safe rollout, and the loan comes due when you delete it. The rollout being complete is the signal to prune the flag and the dead branch with it. (Flags as a *release* mechanism are `lookout`'s / the delivery stage's; *removing the spent ones* is this stage's.)
- **Stored derived state.** The deepest dead matter, because it's also a correctness bug. If a value can be *computed* from existing state, storing it signs you up for a contract — "remember to re-sync it on every change" — that you will eventually break. The grep-able tell is the famous **`useEffect`-that-syncs-state-into-state** anti-pattern: an effect whose only job is to copy one piece of state into another. Inline it back to on-the-spot computation:

```tsx
// bad — filteredItems is derived, but stored and hand-synced; it WILL drift out of sync
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => { setFilteredItems(items.filter(matches)); }, [items, query]); // the tell

// good — derived on the spot; cannot drift, because there's only one source of truth
const visible = items.filter(matches);
```

`items` + `selectedItemId` stored together is fine — two independent facts. `items` + `filteredItems` stored together is a bug — the second is derived from the first. (This is `wellspring`'s source-of-truth discipline, re-applied as a *maintenance* pass: state drifts back into the wrong shape as features land, so the audit re-runs.)

- **Re-audit the import graph** in the same pass: look for new cycles or cross-layer leaks that slipped past the lint rules. Each one found is a candidate for a *new permanent rule* — route it to the immune-system meta-rule in [enforce-boundaries.md](enforce-boundaries.md), so the prune pass feeds the enforcement engine.

---

## Prune 3 — reclassify the drifted state: the store-size thermometer revisited

State does not stay where you first classified it. As features land, a server-cached value gets dropped into the global store "just to share it," a piece of URL state gets mirrored into a slice, and the store swells. **The global store's *size* is the thermometer** (`wellspring`'s instrument, re-read here): a small store is the sign of a correct classification, and **a growing store is near-certain proof that something is misclassified — almost always server-state that drifted back in disguised as client state.**

When the thermometer climbs, re-run the state-classification tree on the store's contents, in order — first hit wins:

| Ask | If yes → bucket | The move |
|---|---|---|
| Can it be **computed** from existing state? | derived | Never store it; compute on the spot. Delete the slice (this is Prune 2). |
| Is its **canonical copy owned by the server** (persisted, changeable by other sessions)? | server-cache | **Move it back to the cache layer** (a TanStack-Query-class library). It's a cache of remote truth, not your state. |
| Should it **survive refresh / be shareable by URL / participate in back-forward**? | URL state | Move it to the router (search params / path). |
| Genuinely client-owned **and** needed by disconnected components? | shared client state | *Now* it may live in the store — but first try lifting it to a common ancestor and passing via composition. |
| None of the above? | local UI state | Component-local; the default home. |

The reclassification you'll make nine times out of ten is **server-cache → cache layer**: the swelling store is full of `user`, `orders`, `settings` — remote truth that was hand-managed as if it were local. Moving it to the cache layer reclaims the invalidation, dedup, and background-refresh machinery you were re-implementing by hand, and the store shrinks back to the handful of things that are *truly* global and *truly* client-owned. (Reclassification is judgment; the tree is the same one `wellspring` installed — this stage just re-runs it because drift is the steady state, not a one-time event.)

---

## The agent-era failure mode this gate counters

Everything above exists to counter one shift: **the agent only ever adds.** It will add a feature, an abstraction, a flag, a store slice — and it will *never* delete the dead, never inline the wrong abstraction, never reclassify the drifted state, because:

- **Adding turns green; pruning earns nothing.** A new feature closes a ticket and passes its test. Deleting code closes no ticket, and worse, *feels* risky — so the agent's reward gradient points entirely toward accretion.
- **The agent over-abstracts and "DRY"s coincidental likeness.** It sees two similar snippets and merges them immediately — the wrong abstraction, born before the axis of change is known — and it keeps a leaky abstraction because it looks DRY, feeling none of the invisible coupling edge it just drew across the dependency graph.
- **It feels none of the entropy.** The store growing, the flag lingering, the derived value stored — none of it turns red, so to the agent the system is healthy. The **entropy tax** (the cost of the Nth feature climbing above the cost of the first) is invisible to the thing incurring it.

This is why pruning **cannot be left to discipline or to the agent** — it must be a scheduled, gated pass that *forces* the one motion the agent will never volunteer. The same default is the engineering suite's [`husbandry`](../../../engineering/husbandry) concern in its general form (debt made visible, refactor-don't-rewrite, the add-never-remove agent failure); `bulwark`'s prune is its **frontend dialect** — the abstraction extract/delete/keep flow on components and hooks, the stale-flag and dead-export sweep, and the store-size thermometer.

## Disposition and routing

A prune *found* and not *performed* is worthless — the same SHIFT as a smell listed but never fixed. The gate is not "I identified the dead code"; it is "each finding has a disposition." Route accordingly:

- **The wrong abstraction** → inline it back (small, do it now under existing behavior tests) or split it. The *refactoring mechanics* — small steps, behavior pinned with characterization tests first — are [`husbandry`](../../../engineering/husbandry)'s; designing the tests that pin behavior before you touch it is the suite's testing stage (`shakedown`). Prune names the call; those execute it safely.
- **The dead** (unused exports, stale flags, stored derived state) → delete, ruthlessly. This is the cheapest, safest legibility win there is, and the one most often skipped.
- **The drifted state** → reclassify per the tree; the *source-of-truth discipline* and the classification tree itself are `wellspring`'s.
- **A new cycle or cross-layer leak** found during the import-graph audit → don't just fix it; turn it into a permanent lint rule via the immune-system meta-rule in [enforce-boundaries.md](enforce-boundaries.md), so the prune pass *feeds* the enforcement engine instead of repeating itself.

Prune is the maintenance loop, not a finish — 1-to-N is a steady state. It re-runs every time the store-size thermometer climbs or the dead-code pass finds new accretion, and its findings flow outward: to `enforce` (new rules), to `husbandry`/`shakedown` (safe refactor), and back to `wellspring` (reclassification). The standing sign that it's working is the one [vitals](../SKILL.md) reads — *abstractions pruned not piled, and the global store stays small as features grow.*

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 2 the two graphs, AXIS 3 derived-state, AXIS 4 the abstraction-as-its-own-edge — *why* this stage reads as it does, and the store-thermometer framing) · [enforce-boundaries.md](enforce-boundaries.md) (where a new cycle/leak becomes a permanent rule — the immune-system meta-rule) · [conway-and-design-system.md](conway-and-design-system.md) (the sibling stages — team-aligned boundaries and the living catalog) · [../SKILL.md](../SKILL.md) (STAGE 1 — Prune, the gate this reference serves; and STAGE 4 — Vitals, which reads whether it's working).

# Data Flow & Component API — the two graphs and the escape-hatch test

This reference is the depth behind **STAGE 3 — Flow** of the [../SKILL.md](../SKILL.md) flight plan. It governs one check: **`data-flow-and-component-api-disciplined`** — wiring each piece of state to the components that need it *along the data-dependency graph* rather than forcing it through the component tree, and keeping the component APIs that carry it composable rather than configured into a monolith.

The earlier stages decided **where** each piece of state lives ([classification-tree.md](classification-tree.md)), kept the truth **single** ([source-of-truth.md](source-of-truth.md)), and made the hard interactions **explicit machines** ([state-machines.md](state-machines.md)). This stage is the last one: now that every fact has one home, **how does it travel from that home to the components that read it — without leaking through layers that don't care, and without binding consumers into an abstraction they can't escape?**

The governing fact, inherited from [the-membrane.md](the-membrane.md)'s *two-graphs* axis and restated because every call below is judged against it:

> **The component tree and the data-dependency graph are different shapes, and every state-management tool is a bypass channel for where they disagree.** The component tree is a *tree*, shaped for visual nesting — who renders inside whom. The data-dependency graph is an *arbitrary DAG* — which component needs which fact, the source often far from the consumer. If the two graphs had the same shape, props alone would suffice and "state management" would not exist as a category. It exists *because* they don't: a fact is needed by two distant cousins at once, or by a deeply-buried leaf whose source is on the other side of the tree. **Prop-drilling is the symptom of cramming DAG-shaped data through a tree-shaped pipe.** Every rule here is judged by one question — *am I routing this fact along the dependency it actually has, or bending it through the tree because the tree is what's in front of me?* — never applied as dogma.

## Contents

- [The core principle — wire the dependency, not the tree](#the-core-principle--wire-the-dependency-not-the-tree)
- [The channel decision — four channels, chosen by reach and frequency](#the-channel-decision--four-channels-chosen-by-reach-and-frequency)
  - [The decision steps](#the-decision-steps)
  - [Composition: the underrated move](#composition-the-underrated-move)
  - [Worked example — the filtered list and the toolbar](#worked-example--the-filtered-list-and-the-toolbar)
- [Component API — composition over config, rule of three, escape-hatch test](#component-api--composition-over-config-rule-of-three-escape-hatch-test)
  - [Composition over config](#composition-over-config)
  - [The rule of three](#the-rule-of-three)
  - [The escape-hatch test](#the-escape-hatch-test)
  - [Worked example — the order-status select](#worked-example--the-order-status-select)
- [The agent-era failure mode — and what is therefore gated](#the-agent-era-failure-mode--and-what-is-therefore-gated)
- [Where findings route](#where-findings-route)

---

## The core principle — wire the dependency, not the tree

There is a quieter idea under the two-graphs reframe, and it is worth naming first because it dissolves a twenty-year confusion: **colocation is the real separation of concerns.** The old dogma — split HTML, CSS, and JS into three layers — was never separation of *concerns*; it was separation by *technology*. A date-picker is *one* concern; its structure, style, and behavior are three faces of the same thing, and splitting them across three files means a single feature change forces you to jump between three places — that is coupling, not decoupling. Putting everything one UI unit needs *in one place* is the cut that actually follows the concern.

The two-graphs principle is the same idea applied to *data*: route a fact to where it is *used*, by the dependency it actually has — not by where the tree happens to put things. When you do that, most prop-drilling never appears, because you stop threading data through layers that have no use for it. When you don't, you reach for a state library to paper over a routing mistake, and the store swells (the [classification-tree.md](classification-tree.md) thermometer reads "wrong").

So the discipline is: **for each fact, look at its consumers' relationship to its owner, and pick the lightest channel that reaches them.** "Lightest" is load-bearing — the channels form a cost ladder, and every step up is a step toward an implicit, global, harder-to-trace dependency. Like the classification tree, the bias is downward: a fact wired too narrowly is a cheap widening later; a fact thrown into a global bypass channel it didn't need is an invisible edge in the dependency graph that the next session inherits and cannot see.

---

## The channel decision — four channels, chosen by reach and frequency

When a fact must reach a component, exactly two things decide the channel: **reach** (is the consumer a descendant of the owner, or scattered elsewhere in the tree?) and, if scattered, **update frequency** (how often does the value change, and how precisely must consumers subscribe?).

| Channel | Use when | Cost / risk |
|---|---|---|
| **Props** | the consumer is a direct descendant of the owner; the tree shape matches the dependency | none — this is the baseline; if it suffices, stop here |
| **Composition** (children / slots) | the consumer is a descendant, but **intermediate layers don't care** about the fact | none beyond a little wiring; the underrated move that kills most prop-drilling with *no* state library |
| **Context** | consumers are **scattered** (distant cousins, deep leaves) and the value is **low-frequency / stable** (theme, current user, locale) | re-renders **every** consumer on **any** change — fine for rarely-changing values, a performance trap for hot ones |
| **Store / signals / atoms, with selectors** | consumers are scattered **and** the value is **high-frequency or fine-grained** | each consumer subscribes *precisely* to the slice it reads; the most powerful and the most global — earn it, and keep the store small |

Every one of these — Context, a store, signals, jotai/recoil-class atoms — is the *same thing underneath*: a bypass channel that lets data flow along the dependency line instead of the tree line. Signals and atoms are interesting precisely because they make that implicit dependency graph *explicit* and first-class. So the perennial "Context vs store vs signals" argument is really one question: *what data structure should represent the dependency graph the component tree cannot express?* The answer is chosen by reach and frequency, not fashion.

### The decision steps

For each fact, walk these in order and stop on the first that fits.

1. **Is the consumer a descendant of the owner?**
   - **PREDICATE:** does the data flow downward along the tree to where it's needed?
   - **Yes, and every layer in between uses it** → **props**. Stop.
   - **Yes, but intermediate layers don't care** → **composition** (pass the consuming component in as `children` or a slot, so the data goes straight from owner to consumer and the middle layers never see it). Stop. *(See below — this is the move the agent skips.)*
   - **DEFAULT** on a coin-flip between props and composition: prefer **composition** when more than one indifferent layer sits between owner and consumer; prefer **props** when they're adjacent. Threading one prop through one layer is not drilling.

2. **Are the consumers scattered** (distant cousins, deep leaves, source on the other side of the tree)?
   - **PREDICATE:** can no clean owner→descendant line carry this fact? The tree genuinely can't express the dependency.
   - **Yes** → a **bypass channel** is warranted. Choose it by frequency (step 3). First confirm this is real scatter, not laziness — a single second consumer one hop away is a lift-and-pass, not a bypass.
   - **FALLBACK** when you can't yet tell if consumers are truly scattered: assume they are **not**. Start with props/composition; promote to a bypass channel the moment a *real* second scattered consumer appears, never in anticipation of one. Lifting later is cheap; un-globalizing a fact later is not.

3. **How often does the value change, and how precisely must consumers subscribe?**
   - **PREDICATE:** low-frequency stable value, or high-frequency / fine-grained?
   - **Low-frequency / stable** (theme, current user, locale) → **Context**. It re-renders all consumers on any change, which is harmless for a value that rarely changes.
   - **High-frequency / fine-grained** → a **store / signals / atoms with selectors**, so each consumer re-renders only when *its* slice changes. Context here is a performance trap: one update re-renders every consumer.
   - **DEFAULT** on a coin-flip about frequency: treat it as **high-frequency** and use selectors. A value put in Context that turns out to be hot is a diffuse re-render problem that's hard to trace; a selector-based store that turns out to be cold costs nothing.

### Composition: the underrated move

The single highest-leverage move in this whole stage is composition, and it is the one the agent almost never reaches for. The frame that unlocks it: **what you lift is the content, not the state.** Instead of threading `props` down through layers that don't use them, you pass the *already-wired component* in as `children` or a named slot, and the data flows straight from owner to consumer — the intermediate layers carry an opaque `children` they never inspect.

```tsx
// bad — props drilled through layers that don't care about `user`
function Page({ user }) {
  return <Layout user={user} />;       // Layout doesn't use user…
}
function Layout({ user }) {
  return <Sidebar user={user} />;      // …Sidebar doesn't either…
}
function Sidebar({ user }) {
  return <Avatar user={user} />;       // …only Avatar does. Three layers threaded for one consumer.
}

// good — lift the content; the indifferent layers carry an opaque `children`
function Page({ user }) {
  return (
    <Layout>
      <Sidebar>
        <Avatar user={user} />          {/* owner wires the consumer directly */}
      </Sidebar>
    </Layout>
  );
}
// Layout and Sidebar now take `children`; they never see `user`, so they never re-render on its change.
```

This dissolves a large fraction of prop-drilling with *no* state library and *no* new global edge — and that is exactly why it must be considered before any bypass channel. A store reached for when composition would have done is the most common way the global store grows for no reason.

### Worked example — the filtered list and the toolbar

A list screen: a `<ProductTable>` owns the visible rows; a `<BulkToolbar>` (a sibling, not a descendant) needs the current selection to enable its "delete selected" button; a deeply-nested `<ThemeToggle>` in the header needs the theme.

- **Selection → the toolbar.** The toolbar is a *sibling* of the table, not a descendant — the tree can't carry selection down to it. But the consumers aren't *scattered*: table and toolbar share one clean parent. → **lift selection to that parent and pass props** to both. No store. *(If the agent had put selection in a global store, the thermometer would read wrong — this is a lift, not a bypass.)*
- **Theme → the toggle and a hundred styled components.** Consumers are genuinely scattered across the whole tree, and theme is **low-frequency**. → **Context**. A re-render of every consumer on a theme flip is fine; theme flips approximately never.
- **A live "rows-per-second" ticker → a scattered status bar and a chart.** Scattered *and* **high-frequency**. → a **store/signals with selectors**, so the chart re-renders on the number but the status bar's unrelated widgets don't.

Three facts, three different channels — each chosen by reach then frequency, none by default-to-store.

---

## Component API — composition over config, rule of three, escape-hatch test

The channels above carry data *into* components; this half is about the *shape of the component itself* — the API a consumer programs against. The failure here is the mirror of prop-drilling: instead of leaking data through the tree, you build an abstraction so configured-from-the-outside that no consumer can ever do the one thing it didn't anticipate.

### Composition over config

Two ways to make a component reusable. **Config** exposes a growing pile of props that switch behavior from the outside (`<Select optionsConfig={...} renderHeader={...} showFooter ...>`). **Composition** exposes *primitives* the consumer assembles (`<Select>` with `<Select.Option>` children, or a headless hook that returns state and handlers and lets the consumer render). Prefer composition: **give primitives, not monoliths.** A config-driven monolith answers every question you anticipated and *no* question you didn't; a composable primitive answers questions you never imagined, because the consumer supplies the rendering.

A flag parameter is the smell that a config monolith is forming: when an abstraction grows a fistful of booleans that toggle what it does (`compact`, `inline`, `readonly`, `withIcon`), it is usually **two things wearing one coat** — split it, or expose the parts.

### The rule of three

**Don't abstract the first or second occurrence of a pattern; extract on the third, once it's stable.** The first two sightings don't yet tell you which parts are the *essential* shared shape and which are *coincidental* similarity that will diverge. Extracting early freezes the wrong axis — and a wrong abstraction is more expensive than the duplication it replaced, because duplication is local and visible while a wrong abstraction is an *invisible edge in the dependency graph* that silently couples distant things. So tolerate a little duplication until the axis of change is clear (AHA: avoid hasty abstraction). The deliberate under-abstraction early is the master move, not sloppiness.

### The escape-hatch test

The executable test for whether an abstraction is *good*: **when a consumer hits an edge case the abstraction didn't anticipate, can it escape?**

| Shape | Escape? | Verdict |
|---|---|---|
| **Compound components** (`<Select><Select.Option/></Select>`) | yes — the consumer composes its own children for the case you didn't foresee | passes |
| **Headless hooks** (logic returned as state + handlers; consumer renders) | yes — the consumer owns the rendering, so any edge case is theirs to handle | passes |
| **Config-driven monolith** (`<Select optionsConfig=... renderEverything=...>`) | no — the consumer can only do what a prop allows; the unanticipated case has no door | fails — a trap that will bind you |

If the answer is *no escape*, the abstraction is a trap: sooner or later a consumer needs the one thing it can't express, and now you either fork the component or bolt on yet another config prop (and the monolith grows). Compound components and headless hooks pass because the consumer always retains the ability to drop down a level. **Give primitives, not monoliths** is the same verdict stated as a rule.

- **PREDICATE:** can a consumer facing an unanticipated edge case still get what it needs without you changing the abstraction?
- **DEFAULT** on a coin-flip about whether to extract at all: **don't extract yet** — wait for the third occurrence. The cost of a little more duplication is local and cheap; the cost of a wrong, escape-less abstraction is global and dear.
- **FALLBACK** when you can't tell whether the shared shape is essential or coincidental: keep it duplicated and *named the same* at each site, so the third occurrence (and the diff between the copies) reveals the true axis before you commit.

### Worked example — the order-status select

A `<StatusSelect>` for an order's status, needed in three places: the order detail page, the bulk-edit dialog, and an inline table cell.

- **First two sightings** (detail page, dialog) look near-identical. **Rule of three:** *do not abstract yet* — duplicate the small component. The two uses haven't yet revealed whether the dropdown chrome is essential or coincidental.
- **Third sighting** (the inline table cell) wants the *same* status options and validation but a radically different trigger — a tiny inline pill, not a full dropdown. Now the axis of change is visible: **the options + validation are shared; the rendering is not.**
- **Extract — as a primitive, not a monolith.** A config monolith (`<StatusSelect variant="inline" | "full" hideChevron ...>`) fails the escape-hatch test: the table cell's bespoke rendering has no door, and the next variant adds another flag. A **headless** `useOrderStatus()` (returns the legal options, the current value, the change handler — see the legal transitions in [state-machines.md](state-machines.md)) passes: each of the three sites renders its own trigger, and a fourth site with a rendering nobody foresaw still works. The shared *knowledge* has one home; the rendering stays the consumer's.

---

## The agent-era failure mode — and what is therefore gated

The agent feels none of the costs this stage exists to avoid, so it defaults to the two worst moves, and both turn green:

- **It prop-drills, or reaches straight for a global store, instead of seeing the two-graph mismatch.** It does not feel the indifferent layers it threads a prop through, and it gets the same green from a global store as from a lifted prop — the store is the path of least resistance because one global bag asks no routing questions. So it never reaches for **composition** (the move that needs *judgment* about which layers care), and the store swells with facts that had a cheaper channel. The [classification-tree.md](classification-tree.md) thermometer catches the symptom; this stage catches the *cause* — a fact wired through the tree instead of along its dependency.
- **It over-abstracts into a config monolith with no escape hatch.** Asked to make a component "reusable," it builds the configured-from-outside version, because adding a prop for every case *looks* thorough and earns a green. It abstracts on the first sighting (no rule of three), and it builds the shape that *can't escape* (no headless/compound), because it cannot feel the future consumer who needs the one case the config didn't anticipate.

Neither failure produces a red signal in the moment — the prop-drilled value arrives, the config monolith renders, the tests pass. The cost is paid later, by a different session, as an un-traceable global re-render or a component nobody can extend without forking. **That is why the channel choice and the component-API shape must be decided and gated, not left to the agent's default** — the gate is the only place the cheaper channel and the escapable abstraction get chosen on purpose. Concretely, `data-flow-and-component-api-disciplined` clears only when: each fact is wired along its dependency (composition used where intermediate layers are indifferent; a bypass channel only for genuine scatter, Context for low-frequency, store/signals-with-selectors for high), and each reusable component API is a composable primitive extracted on the rule of three and passing the escape-hatch test.

---

## Where findings route

This stage is the last gate in `wellspring`, and its findings fan out to the siblings and to the engineering suite:

- **A swollen global store surfaced while wiring** → re-run the [classification-tree.md](classification-tree.md) tree; the store size is the thermometer, and a fact reaching for a bypass channel it didn't need is usually server-cache or a fact that should have been lifted.
- **A fact stored in two places to "make wiring easier"** → that is a duplicate fact; route it to the duplicate-fact audit in [source-of-truth.md](source-of-truth.md). Wiring convenience is never a reason to keep a second copy.
- **A headless abstraction that carries interaction logic** (the `useOrderStatus` of the worked example) → its legal states and transitions are owned by [state-machines.md](state-machines.md); the hook exposes the machine, it does not re-invent it.
- **The component-API discipline is the frontend instance of a general craft call** — composition-over-config, the rule of three, and the escape-hatch / flag-argument smell are the `plumb` skill's [abstraction-misalignment lens](../../../engineering/plumb/references/smells-and-trust-chains.md) (under- vs over-abstraction, the wrong abstraction costing more than the duplication). `wellspring` owns the frontend-specific shape (compound components, headless hooks, slots); the general "extract on the rule of three, inline a wrong abstraction" mechanics route to `plumb` and `husbandry`.
- **Enforcing the channel discipline mechanically** — banning direct global-store writes outside a designated layer, flagging the "copy state into state with `useEffect`" smell — is a lint/boundary concern owned by the project's `flightline` / `husbandry` setup (e.g. an eslint-plugin-boundaries or dependency-cruiser rule); this stage names the discipline, and the durable guard is built there.

The map this stage completes — every fact, its bucket, its source of truth, its machine, and now its channel and the API that carries it — is the written **data-flow convention** that is `wellspring`'s final product, and it is what `seaworthy` builds the unhappy paths against.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves — STAGE 3) · [the-membrane.md](the-membrane.md) (the *two-graphs* axis this stage is the depth behind) · [classification-tree.md](classification-tree.md) (where a fact's bucket — and the store-size thermometer — is decided) · [source-of-truth.md](source-of-truth.md) (the duplicate-fact audit a wiring shortcut can trip) · [state-machines.md](state-machines.md) (the machine a headless hook exposes) · the `plumb` skill's [smells-and-trust-chains.md](../../../engineering/plumb/references/smells-and-trust-chains.md) (the general abstraction-misalignment lens behind composition-over-config and the rule of three).

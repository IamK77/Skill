# State Machines — counting the booleans, collapsing them into a status union

This reference is the depth behind **STAGE 2 — Machine** of the [../SKILL.md](../SKILL.md) flight plan. It governs one check: **`hard-interactions-as-explicit-machines`** — the move from a pile of interdependent boolean flags to a single explicit machine, so the illegal states *and* the illegal transitions stop being representable at all.

This stage is the **behavioral twin** of "make illegal states unrepresentable." [source-of-truth.md](source-of-truth.md) kept the *data* single; this one keeps the *behavior* honest. The data-side move says: don't let two copies of a fact disagree. The behavior-side move says: don't let an interaction occupy a combination of states that contradict each other (loading *and* errored *and* successful at once), and don't let it take a step the interaction's logic forbids ("submit while already submitting"). Both are the same discipline — push correctness out of runtime checks and into a structure where the wrong thing cannot be expressed.

The governing fact, inherited from [the-membrane.md](the-membrane.md)'s *state* axis and restated because every call below is judged against it:

> **Almost every non-trivial UI interaction is, underneath, a finite state machine — and the bug is that most people write it as a scatter of loose booleans plus event handlers, so the machine is *implicit*, which is exactly why it breaks in the corners.** A login form is not the conjunction `isLoading && isError && isSubmitted`; it is a machine: `idle → submitting → (success | error) → …`. Model the states and transitions explicitly and you kill not just the illegal *states* but the illegal *transitions*. Every rule here is judged by one question — *does this let a contradictory or impossible state get constructed?* — never applied as dogma. A statechart library is a means, not an end; the lens is the thing you must keep.

## Contents

- [The core principle — an implicit machine breaks in the corners](#the-core-principle--an-implicit-machine-breaks-in-the-corners)
- [The executable trigger — count the interdependent booleans](#the-executable-trigger--count-the-interdependent-booleans)
- [The method — three steps from flag-soup to a machine](#the-method--three-steps-from-flag-soup-to-a-machine)
  - [Step 1 — collapse the legal states into one variable](#step-1--collapse-the-legal-states-into-one-variable)
  - [Step 2 — list the legal transitions](#step-2--list-the-legal-transitions)
  - [Step 3 — anything not in the table cannot happen](#step-3--anything-not-in-the-table-cannot-happen)
- [The executable check — can it be loading AND error at once?](#the-executable-check--can-it-be-loading-and-error-at-once)
- [Worked example — the async request, before and after](#worked-example--the-async-request-before-and-after)
- [When a statechart library earns its weight](#when-a-statechart-library-earns-its-weight)
- [The agent-era failure mode — why this must be gated](#the-agent-era-failure-mode--why-this-must-be-gated)
- [How findings route](#how-findings-route)

---

## The core principle — an implicit machine breaks in the corners

Take the textbook async request. The naive shape is three independent fields:

```ts
isLoading: boolean
error: string | null
data: Data | null
```

Three boolean/nullable fields combine to `2 × 2 × 2 = 8` states. Only **three** of them are legal — *loading*, *errored*, *succeeded*. The other five are self-contradictory: "loading *and* errored *and* holding data" is a state that has no meaning, yet the types permit it, so sooner or later something constructs it by accident — and you are debugging it at 3 a.m. The states *can* be expressed, therefore one day they *will* be.

The correct model is a **tagged union** (a discriminated union, a status enum, a sum type — the same idea in any clothing): the state is *either* `Loading`, *or* `Error(msg)`, *or* `Success(data)` — mutually exclusive, and the illegal combinations simply do not exist at the type level. The philosophy behind it is the one that runs through the whole skill: move the burden of correctness *forward*, from runtime defensive checks ("if loading, ignore the error field…") to the design of the data structure ("the error field only exists inside the Error variant"). Rather than write an `if` at every site to guard against a contradictory state, make the contradictory state impossible to construct in the first place. That is the line between defensive programming and *speaking in types*.

The behavioral version goes one step further than the data version. Collapsing booleans into a union kills the illegal *states*. Listing the transitions kills the illegal *transitions* — "the user clicked submit while the form was already submitting" cannot fire, because there is no edge from `submitting` back to `submitting` on the submit event. Statecharts add two more tools beyond a flat union: **hierarchy** (nested states) and **orthogonality** (parallel states), which are the rigorous antidote to the despair of "this component has twelve booleans and I no longer know which combinations are even legal."

---

## The executable trigger — count the interdependent booleans

The lens is concrete enough to be a countable trigger, not a vibe:

> **Count the state booleans in one interaction. Three or more that constrain each other means you have an implicit state machine, and it must be made explicit.**

The qualifier *interdependent* is load-bearing. Two unrelated booleans (`isMenuOpen`, `isDarkMode`) are just two facts and need no machine — they do not constrain each other, and all four of their combinations are legal. The trigger fires on booleans that are *mutually exclusive or mutually constraining*: `isLoading`, `isError`, `isSuccess`, `isSubmitting` — where some combinations are nonsense, where flipping one is supposed to flip another, where you find yourself writing `if (isLoading) setIsError(false)` to keep them consistent. That hand-maintained consistency *is* the implicit machine leaking out; the transition logic is already there, smeared across event handlers, just never named.

| Signal | What it means | Move |
|---|---|---|
| 3+ booleans that constrain each other | an un-modeled machine | collapse to a `status` union; list transitions |
| `if (a) setB(false)` keeping two flags consistent | a transition smeared into a handler | name the transition in the table instead |
| a combination of flags that "should never happen" | an illegal state the types still permit | make it unrepresentable via the union |
| "what does `loading=true, error='x'` mean?" has no answer | the state space includes garbage | shrink the space to the legal states only |

- **PREDICATE:** are three-plus of this interaction's booleans interdependent (some combinations illegal, or one flag's value forces another's)? → it is a machine; make it explicit.
- **DEFAULT** (on a coin-flip — two-or-three booleans, unsure if they truly constrain each other): collapse to a `status` union anyway. The union of two states is no more code than two booleans and removes the question; the cost of over-modeling a simple interaction is near-zero, the cost of under-modeling a real machine is a recurring corner-case bug.
- **FALLBACK** (you cannot yet enumerate the legal states because the interaction's behavior isn't pinned down): write down the states and events you *do* know, mark the gaps, and resolve them before the gate — do not ship a flag-soup placeholder and intend to "machine it later," because later is a session with no memory of the intent.

---

## The method — three steps from flag-soup to a machine

Once the trigger fires, the move is three mechanical steps.

### Step 1 — collapse the legal states into one variable

Replace the `N` booleans with **one** variable whose type is the union of the legal states — not N flags, one discriminated value:

```ts
// before — N booleans, 2^N combinations, most of them illegal
isLoading: boolean
isError: boolean
isSuccess: boolean

// after — one variable, exactly the legal states, nothing else expressible
type Status =
  | { tag: 'idle' }
  | { tag: 'submitting' }
  | { tag: 'success'; data: Data }
  | { tag: 'error'; message: string }
```

Note that the data each state carries now lives *inside the state that owns it*: `data` exists only in `success`, `message` only in `error`. There is no way to have an error message while succeeding, because the field is not reachable from the `success` variant. (For a simple flat case a string enum — `status: 'idle' | 'submitting' | 'success' | 'error'` — is enough; reach for the carried-data form when each state owns distinct data.)

### Step 2 — list the legal transitions

Write the table of which state can go to which, on which event. This is the part the implicit version never wrote down — it lived in the order the event handlers happened to fire.

| From | Event | To |
|---|---|---|
| `idle` | `submit` | `submitting` |
| `submitting` | `resolved` | `success` |
| `submitting` | `rejected` | `error` |
| `error` | `submit` | `submitting` (retry) |
| `success` | `reset` | `idle` |

Everything *absent* from this table is now, by construction, an illegal transition: there is no edge `submitting → submitting` on `submit`, so the double-submit cannot happen; there is no edge `success → error`, so a late-arriving rejection cannot clobber a settled success.

### Step 3 — anything not in the table cannot happen

The transition function is total over `(state, event)` and returns the current state (a no-op) for any pair not in the table. That is the structural payoff: the illegal transition is not *guarded against* with a runtime `if` you might forget — it is *unreachable*, because the only way to change state is to go through the table.

```ts
function next(state: Status, event: Event): Status {
  switch (state.tag) {
    case 'submitting':
      if (event.type === 'resolved') return { tag: 'success', data: event.data }
      if (event.type === 'rejected') return { tag: 'error', message: event.message }
      return state                      // a 'submit' while submitting: no edge, no-op
    // …
    default:
      return state
  }
}
```

A `status` enum plus a reducer like this is the whole tool for the common case. You do not need a library to get the guarantee — you need the union and the table.

---

## The executable check — can it be loading AND error at once?

The single fastest way to know whether an interaction is actually modeled:

> **Ask: "can my UI be `isLoading` and `isError` at the same time?"** If the *types* allow that combination to be constructed, you have not modeled the interaction — you have only named some flags. Collapse them into a union so the answer becomes a structural *no*.

This is the gate's executable verdict, and it is binary. With three independent booleans the answer is "yes, trivially — `{isLoading: true, isError: true}` is a value the type system accepts." With the union the answer is "no — there is no inhabitant of `Status` that is both `submitting` and `error`." The check is not "did we add an assertion that forbids it" — a runtime assertion is exactly the defensive check this stage exists to delete. The check is "is the contradictory state *unconstructable*." If you can still write it down as a value, it is not modeled yet.

Run the same check on transitions, not just states: *can the UI go from `success` straight back to `submitting` without passing through a `submit` event?* If the transition function permits it, an edge is missing from the table.

---

## Worked example — the async request, before and after

**Before — the implicit machine.** A submit handler flips flags by hand:

```ts
const [isLoading, setIsLoading] = useState(false)
const [isError, setIsError] = useState(false)
const [data, setData] = useState<Data | null>(null)

async function onSubmit() {
  setIsError(false)              // hand-maintained consistency: the implicit machine leaking
  setIsLoading(true)
  try {
    setData(await save())
  } catch {
    setIsError(true)             // nothing stops a second onSubmit from racing this
  } finally {
    setIsLoading(false)
  }
}
```

The bugs are in the corners no one tested: a double-click fires two `save()`s; a slow rejection arrives after a later success and flips `isError` back true over good data; the empty-vs-loading-vs-error rendering has to re-derive "which state am I in" from a combination of flags at every render.

**After — the explicit machine.** The state is a union, the transitions are a table, and the handler only *sends events*:

```ts
type Status =
  | { tag: 'idle' }
  | { tag: 'submitting' }
  | { tag: 'success'; data: Data }
  | { tag: 'error'; message: string }

function onSubmit() {
  if (status.tag === 'submitting') return   // or: simply no edge — the dispatch is a no-op
  dispatch({ type: 'submit' })
}
```

The double-submit is gone (no `submitting → submitting` edge), the late-rejection-clobbers-success is gone (no `success → error` edge), and rendering reads one `status.tag` instead of triangulating three flags. The same shape covers the filtered-list-with-async-load and the multi-step wizard: the wizard's "can I go to step 3 before step 2 validates?" is just a missing edge, answered by the table rather than by a scatter of `canProceed` booleans.

---

## When a statechart library earns its weight

Most teams do not need to pull in a state-machine library — but they do need the lens: faced with any non-trivial interaction, the first question is *"what are the states and what are the transitions?"*, not *"let me write an `onClick`."* A `status` union plus a reducer is the default and it is enough for the overwhelming majority of interactions.

A statechart library (XState is the example of the class) earns its weight only when the flat union starts to strain — specifically when you hit one of:

- **Nested states (hierarchy)** — a state that is itself a sub-machine (`editing` containing `editing.clean` / `editing.dirty` / `editing.saving`), where a flat enum would force you to enumerate the cross-product by hand.
- **Parallel states (orthogonality)** — two regions that vary independently and *should* be a product, not a flattened sum (a media player that is simultaneously `playing | paused` *and* `muted | unmuted` *and* `fullscreen | windowed`); flattening these into one enum is the twelve-boolean despair re-encoded.
- **Guarded or delayed transitions** — an edge that fires only if a condition holds, or only after a timeout/debounce, where putting the guard logic in the reducer starts to obscure the machine.

- **PREDICATE:** does the interaction have nested sub-machines, genuinely parallel regions, or guarded/delayed edges? → a statechart library is justified.
- **DEFAULT** (a flat handful of states, no nesting, no parallelism): a `status` union + reducer. Do not reach for the library; the lens is the value, and the library is overhead until the shape demands it.
- **FALLBACK** (unsure whether it will grow into nesting/parallelism): start with the union + reducer — it refactors *into* a statechart cleanly if the need appears, whereas a library introduced before the shape needs it is config-driven overhead you carry for nothing. The library is a means; the explicit machine is the end, and you already have the end with a union.

A statechart is also a means with a second payoff worth naming: because the machine is a value (states, events, transitions as data), it can be visualized, simulated, and tested directly — the transition function is a pure function of `(state, event)`, which is exactly the shape unit tests are good at. But that payoff does not, by itself, justify the dependency; the shape (nesting / parallelism / guards) does.

---

## The agent-era failure mode — why this must be gated

The human author who wrote `isLoading` / `isError` / `isSuccess` as three booleans felt the cost the first time the combination went wrong — they had debugged the "loading and errored at once" render, had been burned by the double-submit, and so the pain pushed them toward collapsing the flags into a status. **The agent feels none of that.** Asked to wire an async submit, it produces the most locally-plausible artifact: three `useState` booleans and a handler that flips them, because that code *runs*, *looks* thorough, and turns the immediate task green. The illegal combinations it leaves representable are invisible to it — they turn nothing red — and the corner-case bug fires three sessions later, in someone else's lap, far from where it was planted.

This is why the discipline cannot be left to taste and **must be gated** at `hard-interactions-as-explicit-machines`:

- The agent **writes flag-soup by default** — independent booleans read to it as the obvious encoding of "loading," "error," "success," because each flag maps one-to-one to a thing it can see; the *constraints between* the flags are exactly the part it does not feel.
- The agent **guards illegal states with runtime `if`s instead of making them unrepresentable** — it will add `if (isLoading) return` to paper over a double-submit, which is the defensive check this stage exists to delete, not the structural fix.
- The agent **does not list transitions** — it has no instinct that "which state can follow which" is a thing to write down, so the transition logic stays smeared across handlers in the order they happened to be added.
- The agent **reaches for a statechart library too early or not at all** — it cannot weigh "does this shape justify the dependency," so it either pulls in XState for a two-state toggle or hand-rolls a twelve-boolean component a statechart would have tamed.

The gate forces the booleans to be *counted* and the machine to be *made explicit and written down* while the interaction is still small — before the slice ships and the illegal-state bug becomes a production incident found far from its cause. The final-check verdict is the executable check made structural: **no interaction is described by a pile of interdependent booleans; each hard interaction is a `status` union with a listed transition table, and the contradictory combination cannot be constructed.**

---

## How findings route

`state-machines` owns the implicit-to-explicit machine move and nothing else. The classification and the data flow are siblings; do not re-decide them here.

- **Where each piece of state *lives*** (the five-question bucket tree — derived / server-cache / URL / shared-client / local — and the store-size thermometer) is [classification-tree.md](classification-tree.md)'s job. This file assumes the buckets are assigned; it asks only whether an interaction's *behavior* is modeled. A `status` union is itself a piece of state and must be classified like any other (it is almost always local UI state, or carried by the server-cache layer's own request status) — but *that* call belongs to the tree, not here.
- **Whether a fact is stored twice** (the duplicate-fact audit, forms-as-deliberate-fork) is [source-of-truth.md](source-of-truth.md)'s job. The two stages are kin — both *make illegal states unrepresentable* — but the booleans are this stage's concern. When the duplicate-fact audit surfaces `isLoading` / `isError` / `isSuccess` masquerading as independent facts, *that* is the hand-off into this file: it is not a duplication finding, it is an un-modeled machine. Collapse it here.
- **How the machine's state reaches the components that render it** (props vs composition vs context vs store/signals, chosen by the two-graphs mismatch) is [data-flow-and-component-api.md](data-flow-and-component-api.md)'s job. Model the machine here; wire it there. A machine whose state every distant cousin needs is a flow problem layered on top of a modeled machine, not a reason to leave the machine implicit.
- **Server-request status specifically** — *is fetching / is stale / is refetching / errored* — is often already a small machine the server-cache layer (a TanStack-Query-class library) hands you. Do not re-implement it as local booleans; consume the library's status and only build your own machine for the *interaction* layered on top (the optimistic submit, the multi-step commit). Route the "this is server-cache, manage it as a cache" call back to [classification-tree.md](classification-tree.md).
- **The set of states each piece of state can be in** (loading / error / empty / data) is what the next skill consumes: `seaworthy` turns the modeled states into the product's unhappy paths — the explicit machine *is* the enumeration of what `seaworthy` must build a screen for. A modeled machine here is the upstream that makes "build the unhappy path first" a checklist rather than a guess.

When the trigger fires but you cannot cleanly enumerate the legal states or transitions — the interaction's behavior is genuinely undecided — that is the signal to write the FALLBACK question down and resolve it before the gate, not to ship flag-soup and intend to model it later. The booleans get counted, the machine gets named, and the contradictory state stops being a value anyone can construct.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan this reference serves) · [the-membrane.md](the-membrane.md) (the *state* axis — `illegal-states-unrepresentable`, of which this is the behavioral twin) · [source-of-truth.md](source-of-truth.md) (interdependent booleans surfaced by the duplicate-fact audit route here) · [classification-tree.md](classification-tree.md) (where the `status` value itself gets classified; server-request status is server-cache) · [data-flow-and-component-api.md](data-flow-and-component-api.md) (how the machine's state reaches its consumers — model here, wire there).

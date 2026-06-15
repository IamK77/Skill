# Contracts That Can't Drift — the deliverable of the contract stage

This reference is the depth behind **STAGE 2 — Contract** of the [../SKILL.md](../SKILL.md) flight plan, and it backs the one check that stage gates: **`contract-cannot-drift`**. The other timbers of the skeleton are siblings — the full catalogue of integration points is [seam-checklist.md](seam-checklist.md), and the nine-point acceptance gate is [skeleton-acceptance.md](skeleton-acceptance.md). This file owns one discipline and one only: making the types between two systems *impossible to drift apart*, so that when the server's truth changes, the client cannot stay quietly wrong.

The governing fact, inherited from [the-membrane.md](the-membrane.md)'s **trust-boundary axis** and restated because every call below is judged against it:

> **The toolchain is a commodity; the contract is not.** The framework, the build tool, the styling strategy are reversible doors — pick a boring, well-supported one in an hour and move on. The contract that crosses the network boundary is the near-one-way door: drift there is expensive, silent, and discovered in production. So the week of care goes into making the contract undriftable, not into choosing the framework. The novice spends the week the other way around.

A contract here is not "we agreed on a shape." It is **identity-synchronization across the network boundary** — the front-end and back-end are two systems holding what is supposed to be *one* truth (the types, the auth shape, the error shape), and the only thing keeping their two copies identical is the mechanism you wire in this stage. Get the mechanism right and the two copies *cannot* disagree; the compiler enforces it. Get it wrong — hand-copy a type, mock a shape from memory — and the two copies are free to drift, and they will, silently, until the drift surfaces as a runtime crash on a path no test covered.

## Contents

- [The core principle — a contract is fake unless a field change fails the build](#the-core-principle--a-contract-is-fake-unless-a-field-change-fails-the-build)
- [The executable acceptance test](#the-executable-acceptance-test)
- [Generate from a single source — the decision](#generate-from-a-single-source--the-decision)
- [Stub impl OK, stub contract NOT](#stub-impl-ok-stub-contract-not)
- [Schema-backed mocks — the most dangerous artifact in the build](#schema-backed-mocks--the-most-dangerous-artifact-in-the-build)
- [Design tokens are a contract too](#design-tokens-are-a-contract-too)
- [The agent-era failure mode this counters](#the-agent-era-failure-mode-this-counters)
- [Where findings route](#where-findings-route)

---

## The core principle — a contract is fake unless a field change fails the build

Two systems on opposite sides of a network line each need to know the shape of the data that crosses it. There are exactly two ways to make that happen, and only one of them is a contract:

| Mechanism | What it is | Will it drift? |
|---|---|---|
| **Hand-copied types** | A human (or an agent) reads the API and transcribes a matching type on the client | **Yes — silently.** The copy and the source have no link; the server changes, the copy stays stale, nothing complains until runtime |
| **Generated types** | The client's types are *derived* from the server's single source of truth (OpenAPI / GraphQL schema / tRPC router) by a build step | **No.** The copy *is* the source, transformed; when the source changes, the regenerated type changes, and every now-wrong client call fails to typecheck |

The whole stage is the move from the first row to the second. **A hand-copied type is not a weak contract — it is the *absence* of a contract wearing a contract's clothes.** It looks identical to the real thing in code review (a clean interface, fully typed call sites, a green build) and behaves identically right up until the server changes and the client doesn't find out. That invisibility is precisely why it must be gated rather than trusted: nothing in the day-to-day signal distinguishes a real contract from a fake one. Only one test does.

---

## The executable acceptance test

This is the single test that separates a real contract from a hand-copy, and it is the substance of `contract-cannot-drift`:

> **Change a field on the server, and the client must FAIL TO COMPILE.** Rename `order.status` to `order.state`, or change `total: number` to `total: { amount: number; currency: string }`, on the server's source of truth — then run the client's typecheck. If it goes red at every call site that touched the old shape, the contract is real. **If it stays green, your contract is fake** — you only hand-copied a set of types that will silently go stale.

The test is executable on purpose: it is not "review the types and convince yourself they match," it is a thing you *run*, and its result is a binary the agent cannot fake green. Run it once by hand to certify the stage; better, wire it as a CI step so the certification is continuous (this is where it rejoins the Floor stage's CI gate — see [skeleton-acceptance.md](skeleton-acceptance.md)).

A worked example, the canonical order-status case:

```ts
// SERVER source of truth (e.g. an OpenAPI schema, a GraphQL SDL, a tRPC router)
//   Order { id: string; status: "pending" | "paid" | "shipped"; total: number }

// CLIENT — types are GENERATED from the above, never hand-written
import type { Order } from "./generated/api-types";   // <- derived, not transcribed

function badge(order: Order) {
  return order.status === "shipped" ? "Out for delivery" : "Processing";
}
```

Now the server renames `status` → `state`. Regenerate, typecheck:

```
client/order-badge.ts: error — Property 'status' does not exist on type 'Order'. Did you mean 'state'?
```

The build is red, at the exact line that is now wrong, *before* any user sees a crash. That red is the contract doing its job. With a hand-copied `interface Order { status: ... }`, the regenerate step does not exist, the typecheck stays green, and the badge silently reads `undefined` in production — the failure surfaces as a mislabelled order on a customer's screen, three weeks and forty commits later, with no compiler pointing at the cause.

**The PREDICATE for the whole stage is this test, and nothing softer.** Not "are the types nice," not "did the agent say it generated them" — *does a server field change turn the client build red?* If you cannot run that experiment and watch it fail, the gate is not cleared.

---

## Generate from a single source — the decision

The mechanism is "types generated from one source, wired into the build." *Which* source depends on the transport the architecture already chose at [bearings]; the discipline is identical across all of them, so name them only as examples, never mandate one:

| Source of truth | Generation direction | Example tooling (illustrative, not mandated) |
|---|---|---|
| **OpenAPI / JSON Schema** | server spec → client types | an `openapi-typescript`-class generator |
| **GraphQL schema (SDL)** | schema → typed operations + hooks | a GraphQL-codegen-class tool |
| **tRPC / end-to-end-typed RPC** | server router *is* the type | the router type imported directly; no generation step, the type *is* shared |

The decision steps when you arrive at this stage:

1. **Find the single source.** What is the one artifact the server *already* owns that defines the wire shape? (the OpenAPI doc it serves, the GraphQL schema it exposes, the tRPC router it exports). If there isn't one, the first task is to make one — drift is impossible to prevent until there is a single thing to derive from.
2. **Wire generation into the build, not into a human's memory.** The generate step runs in `install` / `build` / CI, so a stale generated type is itself a build failure, not a thing someone forgot to re-run. A generator that only runs when someone remembers to run it has reintroduced the hand-copy's core flaw — a human in the synchronization loop.
3. **Run the field-change test** (above). This is the acceptance, not the wiring.
4. **PREDICATE for which transport:** whichever the network boundary already speaks — do not adopt GraphQL to get codegen. **DEFAULT** on a greenfield with a typed backend you also own: the end-to-end-typed RPC route (zero generation step, the type is literally shared) is the strongest form of "cannot drift," because there is no derived copy at all. **FALLBACK** when the backend is owned by another team and exposes only REST: generate from its OpenAPI doc, and if it has no OpenAPI doc, *that absence* is the first finding — escalate it, because without a single source there is nothing to make undriftable.

The deep reason this is a near-one-way door while the framework is a reversible one: the framework touches your code's *internals* (swap it and the blast radius is your components, which you control); the contract touches the *boundary between two systems you may not both control*, and drift there is discovered by your users, not your compiler. Spend the care where the door doesn't swing back.

---

## Stub impl OK, stub contract NOT

The most common real situation at this stage: the backend isn't built yet. The instinct — the agent's instinct especially — is to mock it. That instinct is *half* right, and the half it gets wrong is the dangerous half.

> **A stub *implementation* is fine. A stub *contract* is not.** The backend's logic may be a thin stub that returns fake data — `return { id: "1", status: "paid", total: 4200 }` hard-coded. But it must speak the **real contract**: the real types, the real auth shape, the real error shape. The stub fakes the *logic*; it must not fake the *shape*.

The distinction, made concrete:

| | Fakes the logic (OK) | Fakes the shape (NOT OK) |
|---|---|---|
| **Data** | returns a hard-coded `Order` | returns `{ orderId, state }` when the real API returns `{ id, status }` |
| **Auth** | accepts any token, returns a fixed session | skips the token entirely — never proves the credentialed-request → server-validation flow |
| **Errors** | always returns success | returns a string `"error"` when the real API returns `{ code, message, retryable }` |

A stub that fakes the logic but speaks the true contract lets the skeleton cross the data and auth seams *for real* (see [seam-checklist.md](seam-checklist.md)) — the client genuinely fetches, genuinely handles the real error shape, genuinely runs the token flow — even though the backend behind it is a placeholder. When the real backend lands, the client doesn't change: it was already talking to the real contract. A stub that fakes the shape gives you a green skeleton built against a fiction, and the rebuild happens at integration time, which is the exact cliff this whole skill exists to avoid.

The way to make a stub *structurally unable* to fake the shape is the next section: back it with the generated schema.

---

## Schema-backed mocks — the most dangerous artifact in the build

A mock that disagrees with reality is **the single most dangerous artifact in a frontend build**: it produces a *green test and a broken production*, the worst possible combination, because the green is read as safety and the break is invisible until the real boundary is hit. The danger is not mocking — mocking the network boundary is correct and necessary (a network-boundary mock like MSW lets tests exercise the real component + state + logic and fake only the one external seam). The danger is a mock whose *shape* is authored independently of the real shape, because then the mock and the contract are two hand-copies that can drift apart — and the mock always wins the test, so the drift hides.

> **Back every mock with the generated schema.** The mock's response shape must be *derived from or validated against* the same single source the client types come from — so the mock physically cannot return a shape the contract forbids. A mock authored from memory is a hand-copy with extra steps; a schema-backed mock is the contract speaking with a stub's voice.

Worked example — the filtered-list endpoint:

```ts
// WEAK — the mock's shape is hand-authored, free to drift from the real API
server.use(
  http.get("/api/orders", () =>
    HttpResponse.json([{ id: "1", status: "paid" }])   // is `status` even a field? who knows
  )
);
// The server later adds a required `total` field. This mock keeps returning the old
// shape. Every test stays green. Production, hitting the real API, gets `total` —
// or worse, the client renders against a shape the real server never sends.

// STRONG — the mock's response is typed by the SAME generated contract the client uses
import type { Order } from "./generated/api-types";
const order: Order = { id: "1", status: "paid", total: 4200 };  // <- typechecked against the source
server.use(http.get("/api/orders", () => HttpResponse.json([order])));
// Now the server adds required `total` and the test fixture FAILS TO COMPILE until
// it is updated. The mock cannot drift from the contract; the field-change test
// reaches the mocks too.
```

The strong form makes the field-change acceptance test transitive: change the server field, the generated type changes, and now *both* the client call sites *and* the mock fixtures go red. The mock is pulled along by the same gate as the production code, which is the only state in which a mock is trustworthy. (This is the same discipline the testing stage relies on — mock at the network boundary, and let the contract back the mock, so a test never asserts against a fiction.)

---

## Design tokens are a contract too

The same drift hazard lives on the visual side, and the same cure applies. The perceptual contract from [bearings] — spacing scale, type scale, color, motion timing — is supposed to be *one* source of truth that every component consumes. If it is, it is a contract; if components hand-copy values from it, it is decoration that will rot.

> **Tokens are executable too: change a design token, and every consumer changes.** If you change the primary spacing unit or the brand color and some components shift while others don't, the token isn't really wired in — it's a number someone copied into a stylesheet, the visual twin of a hand-copied type.

The acceptance test mirrors the field-change test exactly:

> **Change one token at its source. Does every place that should consume it change?** If yes, the token is a real contract. If a hard-coded `#0066ff` or `16px` survives the change, that survivor is the visual equivalent of a hand-copied type — flag it.

This is why the styling strategy is chosen as a *scope* decision, not an aesthetic one (see [seam-checklist.md](seam-checklist.md), the style/scope seam): the strategy's job is to guarantee that tokens flow to components from one place and cannot be locally overridden by a copied literal. A token system where components copy values is exactly as drift-prone as types where clients copy fields — same disease, same gate.

---

## The agent-era failure mode this counters

The walking-skeleton canon — generate the contract, don't hand-copy, back mocks with the schema — was written for an author who *felt* a hand-copied type go stale, who got a flicker of dread shipping a mock they'd authored from memory, who knew the integration cliff was coming. **None of those feelings survive contact with an agent.** Re-aimed at the agent, the failure mode is sharp and specific:

- **The agent hand-copies types because it makes the immediate thing compile**, and feels none of the future staleness. It will read an API response, write a matching `interface`, type every call site against it, and produce a clean, green, fully-typed module — that is *the absence of a contract*, indistinguishable from the real thing in review, discovered only when the server changes and nothing goes red.
- **The agent mocks a shape that disagrees with reality without unease**, because a plausible fake turns the test green and the broken production is invisible from where it stands. The most dangerous artifact in the build is the one the agent reaches for first.
- **The agent treats auth and error shapes as things to stub *past*** — fixed session, `"error"` string — never running the real token flow or the real error shape, because the happy-path UI is green without them.

Each of these turns green and earns no future signal, so the agent has no instinct against any of them — which is exactly why this stage cannot be left to instinct. **What must therefore be gated:** the *executable* field-change test (does a server field change turn the client build red?), because it is the one check the agent cannot satisfy with a plausible-looking hand-copy. The gate is executable precisely because the failure is invisible to every other signal.

> **The meta-rule, applied here:** the goal is not "lots of types" or "a mock for everything" — it is the contract *undriftable*. A fully-typed module built on hand-copied types has more types and less contract than a thinner one built on generation. Count nothing; run the field-change test.

---

## Where findings route

This file owns the contract-can't-drift discipline and nothing else; when the work touches a sibling concern, route it:

- **The seam this contract crosses** — the data seam and the auth seam (and what "pierced" means for each) live in [seam-checklist.md](seam-checklist.md). This file makes the *types* on that seam undriftable; that file enumerates *which* seams the skeleton must cross at all.
- **The acceptance gate** — the field-change test is condition (3) of the nine-point acceptance, and the CI wiring that makes it continuous is conditions (3)–(4); the full nine and the reproducibility master gate live in [skeleton-acceptance.md](skeleton-acceptance.md).
- **Why the contract is the door that doesn't swing back** — the reversibility framing (framework reversible, contract near-one-way) and the network/trust axis it rests on are in [the-membrane.md](the-membrane.md).
- **The one server-state round-trip** the contract types — fetch → cache → mutate → invalidate → re-render — is generalized into the whole state classification by the next skill, `wellspring`; here it is exercised once, typed by this contract.
- **The general engineering process floor** (version control, review, CI/CD, dependency management) is the engineering suite's `flightline`; this stage shares the CI instinct but owns only what is frontend-specific: the contract across the network boundary and the design-token flow. Don't re-teach CI here.

---

**Cross-links:** [../SKILL.md](../SKILL.md) (the four-stage flight plan and the `contract-cannot-drift` gate this file serves) · [the-membrane.md](the-membrane.md) (the trust-boundary axis — *why* the contract is the deliverable) · [seam-checklist.md](seam-checklist.md) (the data, auth, and style/scope seams this contract crosses) · [skeleton-acceptance.md](skeleton-acceptance.md) (the nine-point gate where the field-change test becomes a standing CI condition).

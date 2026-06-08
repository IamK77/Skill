# TypeScript: A Static-Language Hand-Feel

This is the concrete TypeScript stack. **STAGE 1 (Static layer)** opens it for the checker and the typed-record habit, and **STAGE 2 (Boundary)** opens it again for the parse-at-the-edge section; the gates that make these signals un-fakeable land at **STAGE 4 (Trustworthy)**. The aim is not to write TypeScript that *looks* like Rust — `Result` and tagged unions are means. The aim is the property a static language gives an agent: feedback that is fast, local, attributed, deterministic, trustworthy, and un-fakeable. TypeScript can reach the *in-editor feel* of that, but its guarantees are config + discipline, not soundness — and being honest about which is which is the whole job. The dimensions and the per-failure-mode source selector live in [decision-tree.md](decision-tree.md); the catalogue of feedback sources is [feedback-sources.md](feedback-sources.md); the ceiling you cannot cross is [honest-ceiling.md](honest-ceiling.md).

## Contents

- [What TypeScript gives you, and what it does not](#what-typescript-gives-you-and-what-it-does-not)
- [The stack (copy-usable)](#the-stack-copy-usable)
- [tsconfig — the checker, made strict](#tsconfig--the-checker-made-strict)
- [typescript-eslint — ban the escape hatches](#typescript-eslint--ban-the-escape-hatches)
- [Typed records, never untyped bags](#typed-records-never-untyped-bags)
- [Discriminated unions + exhaustiveness via a `never` default arm](#discriminated-unions--exhaustiveness-via-a-never-default-arm)
- [The Result pattern — because the throw channel is untyped](#the-result-pattern--because-the-throw-channel-is-untyped)
- [Boundaries — validate, don't assert (types are erased at runtime)](#boundaries--validate-dont-assert-types-are-erased-at-runtime)
- [Honest limits — what strict TypeScript still cannot promise](#honest-limits--what-strict-typescript-still-cannot-promise)
- [Make absence a signal, then gate it (STAGE 4)](#make-absence-a-signal-then-gate-it-stage-4)
- [Strictness by risk (够用就好)](#strictness-by-risk-够用就好)
- [One-screen checklist](#one-screen-checklist)

---

## What TypeScript gives you, and what it does not

| Failure class | Default TS | This recipe | Source it becomes |
|---|---|---|---|
| Wrong shape / contract | partial — `any` leaks, unsound `as` | `tsc` strict + ban-`any`, gated | static types, leftmost |
| Bad external data | **none** — types erased at runtime | parse at the boundary (zod/valibot/ArkType) | boundary validation |
| Missing union case | silent fall-through | tagged union + `never` default arm | static types |
| Runtime fault path | `throw` is **untyped** (`catch` is `unknown`) | `Result<T, E>` in the signature | structured errors |
| Behavior / invariant | not expressible in types | tests (`assay` designs them) | behavior tests |

The two rows that types *cannot* close on their own — "bad external data" and "behavior" — are exactly the residual the [honest-ceiling.md](honest-ceiling.md) names. Everything below pushes each failure class to the leftmost source that owns it.

---

## The stack (copy-usable)

| Layer | Tool | Role |
|---|---|---|
| Type checker | `tsc` (strict) | the "compiler"; in-editor + a CI gate |
| Lint (type-aware) | `typescript-eslint` `strict-type-checked` | bans the escape hatches, catches floating promises |
| Boundary parse | `zod` (default) / `valibot` (small bundle) / `arktype` (TS-syntax schemas) | validate untyped data into typed models |
| Test runner | `vitest` / `node --test` | the behavior oracle (see `assay`) |
| Package + run | `pnpm` / `npm` with a committed lockfile | reproducible installs |

Pick **one** validator and stay with it; mixing zod and valibot in one codebase is noise. zod is the default unless bundle size is a hard constraint (then valibot) or you want schemas that read as TS types (then arktype).

---

## tsconfig — the checker, made strict

`strict: true` is the floor, not the ceiling. It turns on `strictNullChecks` (the no-null guarantee), `noImplicitAny`, and six more. Add the three flags strict does **not** include — they close the gaps an agent falls through most.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                        // strictNullChecks, noImplicitAny, +6 more
    "noUncheckedIndexedAccess": true,      // arr[i] / obj[k] is T | undefined, not T
    "exactOptionalPropertyTypes": true,    // {x?: number} != {x: number | undefined}
    "noImplicitOverride": true,            // 'override' must be explicit
    "noFallthroughCasesInSwitch": true,    // a case without break/return is an error
    "noImplicitReturns": true,             // every path returns, or none does
    "verbatimModuleSyntax": true,          // import type stays type-only at runtime
    "isolatedModules": true,               // per-file transpile stays sound
    "skipLibCheck": false,                 // DO check .d.ts; see "@types can lie" below
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  },
  "include": ["src"]
}
```

Two flags do the heavy lifting and deserve a note, because their absence is a silent hole an agent never sees:

- **`noUncheckedIndexedAccess`** — without it, `const u = users[id]` is typed `User` even when the key is absent, so `u.name` type-checks and throws at runtime: a claim the checker presented as a check. With it, `u` is `User | undefined` and the agent is *forced* to narrow. This is the array/record equivalent of `strictNullChecks`.
- **`exactOptionalPropertyTypes`** — without it, `{ retries?: number }` silently admits `{ retries: undefined }`, and `undefined` is not the same as absent for code that does `'retries' in opts`. With it, the two are distinct and the bug surfaces at the type level.

**`skipLibCheck`: keep it `false` on the durable paths.** The common advice to set it `true` is a speed trade that *hides* a class of error — a wrong hand-written `@types/*` declaration. That is exactly the "@types can lie" failure below; do not turn off the only checker that could catch it on code you depend on.

---

## typescript-eslint — ban the escape hatches

`tsc` strict still trusts `any` and `as`. The type-aware lint layer is what makes "no `any`, no unsafe cast" an *enforced* property instead of a hope. Use the `strict-type-checked` preset and keep the bans at `error`.

```js
// eslint.config.js  (flat config)
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }, // type-aware rules need the type info
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",      // ban the any keyword
      "@typescript-eslint/no-unsafe-assignment": "error",  // catch any flowing in
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-floating-promises": "error",  // an un-awaited promise is a silent dropped error
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error", // backs the never-arm pattern below
      "@typescript-eslint/restrict-template-expressions": "error",
    },
  },
);
```

Why these specific rules, in agent terms:

- **`no-explicit-any` + the five `no-unsafe-*`** are a pair. Banning the keyword stops you *writing* `any`; the `no-unsafe-*` family stops `any` that arrives from an untyped library or a `JSON.parse` from flowing inward and silently disabling the checker on everything it touches. One inward `any` propagates along data-flow until an explicit annotation or a parse stops it. The `no-unsafe-*` rules are the tripwire on that propagation.
- **`no-floating-promises`** catches the most common agent runtime fault that types alone miss: a forgotten `await`, where the error rejects into the void and nothing reports it. This is the lint version of "fail loud."

---

## Typed records, never untyped bags

`Record<string, any>` / `object` / `any` is the single biggest hand-feel killer — one of them turns off the checker for everything downstream. Model data as a closed shape.

```ts
// NO — an untyped bag; the checker can't help past this point
function priceOrder(order: any) { return order.total * order.taxRate; } // typos compile

// YES — a record; every field access is checked, every typo is local + attributed
interface Order {
  readonly id: OrderId;            // a branded primitive, below
  readonly total: number;
  readonly taxRate: number;
}
function priceOrder(order: Order) { return order.total * order.taxRate; }
```

For domain primitives that must not be interchanged, use a **branded type** so `OrderId` and `UserId` are not both just `string`:

```ts
type Brand<T, B> = T & { readonly __brand: B };
type OrderId = Brand<string, "OrderId">;
type UserId  = Brand<string, "UserId">;
// makeOrderId() at the boundary mints these; the rest of the code can't mix them up
```

`prefer 'unknown' over 'any'` is the rule for *genuinely* unknown data (a parsed payload, a caught error). `unknown` forces you to narrow before use and — unlike `any` — does **not** propagate: you cannot call a method on it or assign it onward without a check. It is the type that keeps the boundary honest.

---

## Discriminated unions + exhaustiveness via a `never` default arm

This is how TypeScript matches a static language's "the compiler errors on a missing case." A **tagged** (discriminated) union has a literal `kind` field; a `switch` on it with a `default` that assigns to `never` turns *adding a variant* into a compile error at every unhandled site.

```ts
// the assertNever helper — the whole mechanism
function assertNever(x: never): never {
  throw new Error(`unhandled union case: ${JSON.stringify(x)}`);
}

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number }
  | { kind: "tri"; base: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "rect":   return s.w * s.h;
    case "tri":    return 0.5 * s.base * s.height;
    default:       return assertNever(s); // <- if a Shape variant is unhandled,
  }                                       //    s is not 'never' here and this is a COMPILE error
}
```

The payoff is agent-shaped: add `{ kind: "hex"; ... }` to `Shape` and every `switch` that forgot it goes red *at the unhandled site* — local, attributed, before anything runs. The `switch-exhaustiveness-check` lint rule above is the belt to this suspenders, flagging the same gap even where someone omitted the `default`. Narrowing on `s.kind` inside each arm gives you the variant's fields with no cast.

---

## The Result pattern — because the throw channel is untyped

TypeScript's `throw` is the single biggest hole in its static story: **you cannot type "this function throws `E`".** `catch (e)` types `e` as `unknown` (it was `any` before strict), and a function's signature says nothing about what it might throw. So a runtime failure mode is invisible to the checker and to the caller — the opposite of "put the failure mode in the signature."

Move the *expected* failures out of `throw` and into the return type as a tagged union. Now the checker forces the caller to handle the error, and the failure is local and attributed.

```ts
type Result<T, E> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

const ok  = <T>(value: T): Result<T, never>  => ({ ok: true,  value });
const err = <E>(error: E): Result<never, E>  => ({ ok: false, error });

type ParseError =
  | { kind: "empty" }
  | { kind: "not-a-number"; raw: string }
  | { kind: "negative"; value: number };

function parseAmount(raw: string): Result<number, ParseError> {
  if (raw.trim() === "") return err({ kind: "empty" });
  const n = Number(raw);
  if (Number.isNaN(n))   return err({ kind: "not-a-number", raw });
  if (n < 0)             return err({ kind: "negative", value: n });
  return ok(n);
}

// the caller CANNOT reach .value without first handling the failure — the checker enforces it
const r = parseAmount(input);
if (!r.ok) {
  switch (r.error.kind) {        // exhaustively, via the same never-arm trick
    case "empty":        return reportEmpty();
    case "not-a-number": return reportBadNumber(r.error.raw);
    case "negative":     return reportNegative(r.error.value);
    default:             return assertNever(r.error);
  }
}
useAmount(r.value); // r is narrowed to { ok: true } here
```

Where `Result` pays vs. where `throw` is fine:

- **Use `Result`** for *expected, recoverable* failures the caller must decide about — parse failures, validation, "not found", a domain rule violated. These belong in the signature.
- **Let it `throw`** for *bugs and truly unrecoverable* faults (a violated invariant, OOM). You are not going to handle those at every call site; a loud crash at the source is the right signal there.
- **Honest limit:** the throw channel still exists *under* `Result` — any code or library can `throw`. A pure-`Result` API is a discipline, not a guarantee. At a boundary that calls throwing code, wrap it: `try { ... } catch (e) { return err(toMyError(e)); }` in the adapter, and never let raw `unknown` from a `catch` flow inward. (TypeScript has no `?` operator, so propagation is a manual early-return on `!r.ok`.)

---

## Boundaries — validate, don't assert (types are erased at runtime)

At every edge where real or untyped data enters — an HTTP body, a query result, a file, `JSON.parse`, an env var, an untyped library — the TypeScript type is a **claim**, not a check. Types are erased; nothing at runtime enforces them. `as MyType` is the worst move here: it tells the checker to *stop* checking exactly where the data is least trustworthy.

Parse the data into a typed model at the boundary, so a bad shape fails **there**, attributed, instead of three layers in as a confusing `undefined`.

```ts
import { z } from "zod";

const OrderSchema = z.object({
  id:      z.string().min(1),
  total:   z.number().nonnegative(),
  taxRate: z.number().min(0).max(1),
});
type Order = z.infer<typeof OrderSchema>; // the static type is DERIVED from the runtime check — one source of truth

// at the HTTP boundary — return a Result, don't throw into the handler
function readOrder(body: unknown): Result<Order, z.ZodError> {
  const parsed = OrderSchema.safeParse(body); // .safeParse, not .parse — keep it in the Result channel
  return parsed.success ? ok(parsed.data) : err(parsed.error);
}
```

Three rules at the boundary:

1. **Parse, infer the type from the schema.** `z.infer` makes the runtime check and the static type the same object — they cannot drift. A hand-written `interface` next to a separate validator *can* drift, silently.
2. **Take `unknown`, not `any`, as the input.** `function readOrder(body: unknown)` forces the parse; `body: any` lets the agent skip it and `as Order` instead.
3. **Contain the `any` from untyped libraries to a thin adapter module at the edge and convert immediately.** Parse or brand it on the way in; never let it reach the core. One inward `any` disables the checker on everything derived from it.

`valibot` and `arktype` do the same job with the same shape (`v.safeParse` / `type({...})`); the pattern is identical — a runtime check at the edge, a static type inferred from it.

---

## Honest limits — what strict TypeScript still cannot promise

Do not oversell this stack. With `strict` + ban-`any` + boundary-parse you get the **in-editor type-checking feel of a static language** — fast, local, attributed feedback on the shape/contract class. But the guarantees are **config + discipline, not soundness.** Four residuals, each recoverable per-site but never free or universal:

| Limit | Why | Per-site recovery |
|---|---|---|
| **Unsound by design** | `as` / `as any` are escape hatches the checker **trusts blindly** — it stops checking and believes you. One `as` can re-introduce every error the type was preventing. | Ban `as any`; gate `as` to justified, reviewed sites; prefer parse over cast. |
| **Types erased at runtime** | No type exists at runtime, so a static type at any external edge is a claim. | Parse at the boundary (above); take `unknown`, not `any`. |
| **Throw channel untyped** | `catch` is `unknown`; a signature can't declare what it throws, so a failure mode is invisible to the checker. | `Result<T, E>` for expected failures; wrap library throws in the adapter. |
| **`@types/*` can lie** | Hand-written declaration files for untyped JS packages are *unchecked claims*; they can describe an API that no longer matches the JS. | Keep `skipLibCheck: false` on durable paths; prefer packages with first-party types; pin and test the integration (a `assay` contract test). |

The boundary between "the checker proved this" and "I told the checker to trust me" is the entire honesty of this setup — and it is exactly where the `as`/`any`/`@ts-ignore` escape hatches live.

---

## Make absence a signal, then gate it (STAGE 4)

The gradual-typing weakness is that *unchecked* reads as *safe*. Make "not checked" visible, then make the green un-fakeable:

- **`tsc --noEmit` clean, gated.** A type layer that isn't enforced doesn't exist for an agent — it walks past it with `@ts-ignore`. Run `tsc --noEmit` in pre-commit and CI.
- **Report the `any` you didn't write.** `eslint` with `no-unsafe-*` at `error` surfaces the implicit `any` flowing in from untyped libs — that is your "unchecked path" map. Add a `type-coverage` run (e.g. `type-coverage --strict --at-least 99`) to read the codebase as a percentage of *known* types, so a creeping `any` shows up as a falling number.
- **Ban the escape hatches in CI, not just in lint config.** An agent games a signal the way it games any gate. Block these as blocking checks (mirrors `flightline`'s gate discipline):

| Escape hatch | What it fakes | Gate |
|---|---|---|
| `as any` / `as unknown as T` | re-enables every error the type prevented | lint `error` + reject in review |
| `// @ts-ignore` | silences the checker at one line, no reason given | forbid; require `// @ts-expect-error` *with a reason*, which itself errors if the line later type-checks |
| `// eslint-disable` on a `no-unsafe-*` | hides inward `any` | forbid on the unsafe family without a reviewed justification |
| widened test timeout / `retry` | masks a flake so red turns green | review timeout/retry diffs; quarantine flakes, don't retry-to-green |
| deleted assertion / `expect.anything()` | a test that verifies nothing | review test diffs; mutation-test high-stakes modules (`assay`) |

These gates run in the pipeline that `flightline` operates; the behavior tests behind the last two rows are designed in `assay`; the contracts and edges you are parsing were decided in `load-bearing`. This recipe's job is only to ensure every TS failure mode has a clear, un-fakeable signal and that they are wired together.

---

## Strictness by risk (够用就好)

Do not gold-plate trivial code into noise. The full strictness — branded primitives, `Result` everywhere, `type-coverage 99`, mutation testing — is earned by **high-blast-radius, durable, frequently-changed** paths (payments, auth, the data model, public APIs). A stable one-off script earns `strict` + boundary-parse on its inputs and little more. Over-instrumenting a trivial helper buries the real signal exactly as surely as leaving a payments path on `any` does. The per-risk dial lives in [decision-tree.md](decision-tree.md), and the catalogue of which source to spend where is [feedback-sources.md](feedback-sources.md).

---

## One-screen checklist

```
[ ] tsconfig: strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes; skipLibCheck false on durable paths
[ ] typescript-eslint strict-type-checked; no-explicit-any + no-unsafe-* + no-floating-promises at error
[ ] data is typed records / branded primitives, never any or Record<string, any>
[ ] tagged unions matched with a never default arm (assertNever); switch-exhaustiveness-check on
[ ] expected failures returned as Result<T, E>, not thrown; library throws wrapped in the adapter
[ ] every boundary parses (zod/valibot/arktype safeParse) into a type INFERRED from the schema; input is unknown
[ ] any from untyped libs contained to a thin edge adapter, converted immediately, never flowed inward
[ ] tsc --noEmit + eslint + type-coverage gated in pre-commit AND CI; as any / @ts-ignore banned, @ts-expect-error needs a reason
[ ] strictness matched to risk — rich on durable/high-blast-radius paths, minimal on trivial stable code
```

Read this stack alongside [feedback-sources.md](feedback-sources.md) (which source owns which failure) and [honest-ceiling.md](honest-ceiling.md) (what green still does not prove). Back to the flight plan: [../SKILL.md](../SKILL.md).

# Test Doubles — The Centerpiece

A *test double* is any object you swap in for a real collaborator so the test can run fast, deterministically, and in isolation. "Double" is the umbrella; the five named kinds below are points on it. Picking the right one is the single highest-leverage decision in a unit test, because the wrong double tests the *shape of your code* instead of *what it does*.

This document is loaded at **Choose** and **Compose**. It expands **Tree C** of the decision tree.

---

## Contents

- [1. The one axis that explains everything: state vs. behavior](#1-the-one-axis-that-explains-everything-state-vs-behavior)
- [2. The five doubles — precise definitions + one-line discriminator](#2-the-five-doubles--precise-definitions--one-line-discriminator)
- [3. The same double across languages](#3-the-same-double-across-languages)
- [4. Tree C — choosing the double (the decision spine)](#4-tree-c--choosing-the-double-the-decision-spine)
- [5. What-the-test-needs → which-double (lookup table)](#5-what-the-test-needs--which-double-lookup-table)
- [6. Classicist (Chicago) vs. mockist (London) — as a selection rule](#6-classicist-chicago-vs-mockist-london--as-a-selection-rule)
- [7. Anti-pattern catalogue — detection + remedy](#7-anti-pattern-catalogue--detection--remedy)
- [8. Un-owned dependencies: the adapter / ports-and-adapters seam](#8-un-owned-dependencies-the-adapter--ports-and-adapters-seam)
- [9. Fake-drift and the contract test](#9-fake-drift-and-the-contract-test)
- [10. Quick reference card](#10-quick-reference-card)

## 1. The one axis that explains everything: state vs. behavior

Every double either feeds the test or judges it.

- **State verification** — after the action runs, you inspect a *return value* or *observable state* and assert it is correct. The double's job was only to let the code reach that point. (dummy, stub, fake supply inputs; you assert on results.)
- **Behavior verification** — you assert that the SUT *called a collaborator* in a particular way (which method, what arguments, how many times, in what order). The interaction itself is the thing under test. (spy, mock record calls; you assert on the calls.)

Hold this axis in your head: **prefer state verification.** Reach for behavior verification only when the call *is* the contract (see §6). Most over-mocking is just behavior verification used where state verification would have been truthful and refactor-proof.

```
                 supplies inputs            judges interactions
                 (state verification)       (behavior verification)
  passive  ───►  DUMMY ── STUB ── FAKE  │  SPY ── MOCK  ◄─── assertive
                 weakest ──────────────────────────────► strongest coupling
```

---

## 2. The five doubles — precise definitions + one-line discriminator

| Double | Definition | One-line discriminator |
|---|---|---|
| **Dummy** | A placeholder passed only to satisfy a signature; never actually used. | "It exists so the call compiles; nothing reads it." |
| **Stub** | Returns hard-coded answers to *queries*, steering the SUT down a chosen path. No assertions on it. | "Canned answers in; I assert on the *result*, never on the stub." |
| **Spy** | A real-ish double that *records* how it was called so the test can assert afterward. | "Let it run, then ask: were you called, with what?" |
| **Mock** | Pre-programmed with *expectations* of exactly which calls must occur; fails the test if they don't (or extras do). | "I declare the calls up front; the mock enforces them." |
| **Fake** | A lightweight but genuinely *working* implementation (in-memory DB, fake clock, in-memory queue). | "Real behavior, no real infrastructure." |

**Stub vs. mock is the classic confusion.** A stub *cannot fail a test* — it only supplies inputs. A mock *can* fail a test independent of your assertions, because it carries its own expectation. A spy sits between: it records like a passive object but you write the assertion yourself, afterward, in the test body (so it reads like state verification of "what happened").

**Fake vs. stub:** a stub gives the same canned answer regardless of what you did to it; a fake actually *remembers* — `fake_repo.save(x)` then `fake_repo.get(x.id)` returns `x`. Use a fake when stubbing every call would be tedious or would encode a fragile script of the implementation.

---

## 3. The same double across languages

To anchor the vocabulary, here is **a stub** (canned query answer) expressed identically across ecosystems, then the **same collaborator as a mock**. Note: every framework can build any of the five — these libraries are not "mock-only."

```python
# Python — unittest.mock
repo = Mock()
repo.find_user.return_value = User(id=7, plan="pro")   # STUB: canned query
svc = Billing(repo)
assert svc.monthly_charge(7) == 2000                   # assert on RESULT (state)
```

```ts
// TypeScript — jest
const repo = { findUser: jest.fn().mockReturnValue({ id: 7, plan: "pro" }) }; // STUB
const svc = new Billing(repo);
expect(svc.monthlyCharge(7)).toBe(2000);                                      // state
```

```java
// Java — Mockito
UserRepo repo = mock(UserRepo.class);
when(repo.findUser(7)).thenReturn(new User(7, "pro"));   // STUB (thenReturn = query)
Billing svc = new Billing(repo);
assertEquals(2000, svc.monthlyCharge(7));                // state
```

```go
// Go — hand-written or gomock; here hand-written (idiomatic)
type stubRepo struct{}
func (stubRepo) FindUser(id int) User { return User{ID: 7, Plan: "pro"} } // STUB
svc := Billing{Repo: stubRepo{}}
if got := svc.MonthlyCharge(7); got != 2000 { t.Fatalf("got %d", got) }    // state
```

And the **same collaborator as a mock** (behavior verification — use only per §6):

```python
mailer = Mock()
checkout.complete(order)
mailer.send_receipt.assert_called_once_with(order.email)   # MOCK/SPY: assert the CALL
```

```java
verify(mailer, times(1)).sendReceipt(order.email());        // Mockito mock verify
```

```go
// gomock
mailer.EXPECT().SendReceipt(order.Email).Times(1)           // expectation set up front
```

```rust
// Rust — mockall
let mut mailer = MockMailer::new();
mailer.expect_send_receipt().withf(|e| e == "a@b.com").times(1).returning(|_| Ok(()));
```

The discriminator is *where the assertion lives*, not which library you imported: assert on the **result** ⇒ stub/fake; assert on the **call** ⇒ spy/mock.

---

## 4. Tree C — choosing the double (the decision spine)

Run this **once per real collaborator** of the SUT, top to bottom. Output: a named double (or "none") plus the one risk it isolates.

### Gate 0 — Do you even need a double?

```
Is the collaborator fast, in-process, deterministic, and free of
irreversible side effects?
  └─ YES → USE THE REAL THING. No double. Stop here.   (classicist default)
  └─ NO  → continue.
```

A pure helper, a value object, a small in-memory collaborator: **just use it.** Doubling a deterministic in-process object buys nothing and couples the test to call structure. Default to real; double only what *forces* you to (slowness, nondeterminism, network/disk, cost, irreversible effects, or an unbuilt collaborator).

### Gate 1 — Do you own the interface? (the own-it gate)

```
Is this an interface/type YOU define and control?
  └─ YES → continue to Gate 2.
  └─ NO  (3rd-party SDK, HTTP client, vendor type) →
       DO NOT double it directly.
       1. Wrap it behind a thin adapter interface YOU own.
       2. Double the ADAPTER in unit tests.
       3. Pin the real library's behavior with one integration/contract test.
```

Mocking a type you don't own freezes *your guess* of how the third party behaves; when they ship a change, your green tests lie. See §7 (anti-patterns) and §8 (ports & adapters).

### Gate 2 — Role gate: pick the WEAKEST double that works

Stop at the first branch that answers the test's question. The branches below are ordered by *the question you're asking*, not strictly by coupling strength — a fake is less coupling than a spy/mock (it never asserts), but it sits last here because you only reach for one when canned answers won't do. The coupling order remains dummy < stub < fake < spy < mock; when two doubles could both work, take the one further left.

```
Does the test ever read or care about this collaborator's value?
  └─ NO, it only fills a parameter slot               → DUMMY
Does the SUT need specific answers from it to reach the path under test?
  └─ YES, and I assert on the RESULT, not the call    → STUB     (stub QUERIES)
Is the call itself a side effect I must confirm happened, with no useful return?
  └─ YES, and I can assert AFTER the fact              → SPY
Must I both program behavior AND demand an exact interaction, up front?
  └─ YES, the interaction IS the contract             → MOCK     (verify COMMANDS)
Do I need realistic, stateful behavior that would be painful to stub call-by-call?
  └─ YES (in-mem DB / clock / FS / queue)             → FAKE     (+ contract-test it, §9)
```

> **Stub queries, verify commands.** A *query* asks for data and has no side effect (`findUser`, `now()`) — **stub** it; never assert it was called (that's testing implementation). A *command* changes the world (`sendEmail`, `charge`, `publish`) — that's the only place a **spy/mock** assertion is legitimate, because the side effect is invisible to state verification.

> **Prefer a SPY over a MOCK.** A spy records calls and you assert *after* the fact (loose, state-friendly); a mock sets strict expectations *before* the run and fails on any deviation. Reach for a mock only when **call ordering** or **"no other interactions occurred"** is itself the property under test — otherwise a spy proves the command happened without over-constraining *how* it happened.

### The weakest-double rule, stated plainly

> Use the *least powerful* double that still answers the test's question. A dummy can't accidentally assert; a stub can't fail your test; only a mock can fail on a refactor that changed *how* but not *what*. Power is coupling. Buy only as much as the risk requires.

---

## 5. What-the-test-needs → which-double (lookup table)

| What the test needs from the collaborator | Verification style | Double |
|---|---|---|
| Nothing — just fill an argument | none | **Dummy** |
| A canned value to steer a branch / reach a path | state (assert result) | **Stub** |
| To later confirm a side-effecting call occurred | behavior (assert after) | **Spy** |
| To demand an exact call sequence/args before running | behavior (pre-set) | **Mock** |
| Realistic stateful behavior, cheaply | state (assert result) | **Fake** |
| Real thing is fine (fast, pure, deterministic) | state | **No double** |
| Third-party type you don't own | wrap first | **Adapter + (stub/fake) + contract test** |

---

## 6. Classicist (Chicago) vs. mockist (London) — as a selection rule

These are two schools of *how to isolate a unit*, not a style preference. Make the choice **per target** and record it (Choose gate `stance-and-guards`).

- **Classicist / Chicago / "sociable" / state-based.** Use *real* collaborators wherever they're cheap; use *fakes* for the expensive ones; assert on **resulting state and return values**. A "unit" is a behavior, not a single class. Tests survive internal refactors because they never mention *how* the work was done.
- **Mockist / London / "solitary" / interaction-based.** Isolate the SUT from *every* collaborator with mocks; assert on the **interactions** between them. Drives outside-in design (you discover collaborators' interfaces by mocking them before they exist).

### The rule: be classicist by default; go mockist only when the interaction *is* the observable

```
CHOOSE CLASSICIST (default) when:
  • the outcome is observable as a return value or queryable state
  • the collaborator is cheap, deterministic, in-process
  • you're protecting a refactor (refactor-safety motivation) or pinning legacy behavior
  • you value tests that don't break when internals are rearranged

CHOOSE MOCKIST (this collaborator only) when:
  • the effect is invisible to state — it leaves the system:
      sends an email, charges a card, publishes an event, writes to a foreign service
  • the INTERACTION itself is the contract:
      ordering, idempotency, retry/backoff, exactly-once, call-count, fan-out
  • you're designing an unwritten collaborator outside-in and need its interface
```

Mockist is a *scalpel applied to one boundary*, not a whole-test philosophy. A healthy test is usually classicist with one mock at the single outgoing side-effect. If you find yourself mocking three collaborators to test one method, you've drifted into over-mocking (§7).

---

## 7. Anti-pattern catalogue — detection + remedy

Each guard below should fire as a **hard stop** at the exact moment you reach for the offending double.

### A. Over-mocking / mirroring the implementation
- **Smell:** the test re-states the method body as a script of expected calls; it reads like a transcript of the code.
- **Detection:** *"Would a behavior-preserving refactor (rename a private method, reorder calls, extract a helper, switch a loop to map) break this test even though the output is identical?"* If yes — over-mocked.
- **Remedy:** replace mocks with a **fake** or real collaborators and assert on **state/return** instead; or widen to a small **integration test**. Mock only the genuine outgoing side effect, if any.

### B. Mocking what you don't own
- **Smell:** `mock(StripeClient)`, `mock(SomeSdkResponse)`, patching a library's internal function.
- **Detection:** the mocked type's source lives in `node_modules` / `site-packages` / a vendored jar — not your repo.
- **Remedy:** define your own `PaymentGateway` port, implement it with a thin adapter over the SDK, **double the port**, and write **one** integration/contract test that exercises the real SDK so drift is caught (§8, §9).

### C. Asserting interactions when observable state exists
- **Smell:** `verify(repo).save(x)` when you could instead read the object back and check it's persisted/correct.
- **Detection:** there's a return value or a queryable state that already reflects success, yet the test asserts on the *call*.
- **Remedy:** prefer the **state** assertion (`assert repo.get(id) == x` against a **fake**). Reserve interaction assertions for invisible commands only.

### D. Mocking value objects
- **Smell:** `mock(Money)`, `stub(DateRange)`, `mock(Coordinate)`.
- **Detection:** the type is immutable, equality-by-value, no I/O, no meaningful collaborators.
- **Remedy:** **construct the real thing.** `Money(20, "USD")`. Value objects are already deterministic and free; a double only adds noise and hides equality bugs.

### E. Stubbing / mocking the SUT itself (partial mocks)
- **Smell:** you mock a method *on the object under test* to "skip" part of it.
- **Detection:** the same class appears as both the system under test and a mocked dependency.
- **Remedy:** that's a design signal: the method you wanted to stub belongs in a **separate collaborator**. Extract it, inject it, and double *that*. Never test a half-real object.

### F. Mocking to route around hard-wired dependencies
- **Smell:** "I have to monkeypatch `datetime.now` / a module-level singleton because there's no way to inject it."
- **Detection:** the only way to control the collaborator is patching a global or import.
- **Remedy:** **introduce a seam** (constructor/parameter injection, a `Clock` port) instead of mocking around bad design. The seam makes the next test easier too. (See `determinism-and-flakiness.md`.)

### G. Brittle deep / strict expectations
- **Smell:** strict mocks that fail on any unexpected call; deep argument matchers that pin every field; `verifyNoMoreInteractions` everywhere.
- **Detection:** trivial, correct code changes turn the suite red with "unexpected invocation" errors.
- **Remedy:** **loosen** — match only the arguments that matter, allow incidental calls, or switch to a **fake**. Assert the *contract*, not the *choreography*.

---

## 8. Un-owned dependencies: the adapter / ports-and-adapters seam

The fix for "don't mock what you don't own" and for most hard-wired-dependency pain is the same structural move.

```
        ┌────────────────┐     port (interface YOU own)    ┌────────────────────┐
  SUT → │  PaymentGateway │ ──────────────────────────────►│ StripeAdapter (real)│→ Stripe SDK
        └────────────────┘                                 └────────────────────┘
                 ▲                                          ┌────────────────────┐
   unit tests ───┘  swap in ────────────────────────────►  │ FakePaymentGateway  │ (in-memory)
                                                            └────────────────────┘
```

- **Port** = a small interface expressed in *your* domain terms (`charge(amount, token) -> Result`), owning only what you need.
- **Adapter** = the thin real implementation that translates the port to the vendor SDK. It contains *no logic* worth unit-testing — it's a humble object.
- In unit tests, inject a **stub** or **fake** of the port. Your domain logic is now fully isolated and refactor-proof.
- The adapter's correctness against the *real* vendor is covered by exactly one slow **integration/contract test** (and possibly a recorded-interaction test). This is where reality is pinned — once, in a known place, instead of scattered across every mock.

This is also the cure for "I can't control the clock / RNG / filesystem": wrap each non-deterministic source behind a port (`Clock`, `RandomSource`, `FileStore`) and inject a deterministic implementation in tests.

---

## 9. Fake-drift and the contract test

A **fake** is the most powerful and most dangerous double, because it carries its own behavior — and that behavior can silently diverge from the real collaborator it stands in for. Your tests stay green while production breaks. This is **fake drift**.

- **Hazard:** `InMemoryUserRepo` returns `None` for a missing id, but the real Postgres repo raises `NotFound`; or the fake is case-insensitive and the real store isn't. Every unit test passes; integration fails.
- **Remedy — one shared contract test, run against both:**

```python
# A single abstract test suite parameterized over implementations.
class UserRepoContract:
    def make_repo(self): raise NotImplementedError
    def test_get_missing_raises_not_found(self):
        with pytest.raises(NotFound):
            self.make_repo().get("nope")
    def test_save_then_get_roundtrips(self):
        r = self.make_repo(); u = User("a"); r.save(u)
        assert r.get(u.id) == u

class TestFakeRepo(UserRepoContract):  make_repo = lambda self: InMemoryUserRepo()
class TestRealRepo(UserRepoContract):  make_repo = lambda self: PostgresUserRepo(test_db())  # @integration
```

Run the same suite against the fake (fast) and the real implementation (integration tier). When they must agree and don't, the contract test goes red instead of production. Treat the contract test as the *definition* of the port's behavior — both implementations are obligated to it.

The same idea covers **adapter** drift: the adapter must satisfy the port's contract test against the live dependency.

---

## 10. Quick reference card

- **Default to the real object.** Double only what forces you to.
- **Pick the weakest double that answers the test.** dummy < stub < fake < spy < mock in power and coupling.
- **Stub queries; verify commands.** Never assert a query was called.
- **Assert on state/return by default; assert on interactions only when the call is invisible or is itself the contract.**
- **Classicist by default; mockist as a scalpel** at a single side-effecting boundary.
- **Never mock what you don't own** — wrap it in a port, double the port, contract-test the real thing.
- **Never mock value objects or the SUT.** Construct values; extract & inject instead of partial-mocking.
- **Fakes need contract tests** against the real collaborator, or they drift.
- **A mock that breaks on a behavior-preserving refactor is a bug in the test, not a finding.**

Cross-links: type selection → `evidence-catalogue.md`; case design & the oracle → `probe-construction.md`; seams, injection, and taming non-determinism → `determinism-and-flakiness.md`; the full traversal → `decision-tree.md`.

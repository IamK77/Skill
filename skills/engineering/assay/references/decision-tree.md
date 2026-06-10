# The Master Decision Tree

This is the deterministic engine of assay. Four nested trees plus two overlays and an escalation ladder. Traverse them **top-down, once per funded risk item** from the Triage ledger — never once per file. The output of each tree feeds the next: Tree A decides *whether* a risk earns a test, Tree B fixes the *type and scope*, Tree C picks a *double per collaborator*, Tree D designs the *cases*. The overlays then make every chosen test deterministic and (only when motivation warrants) resilient.

Every fork below carries three things so two agents working the same code reach the same plan:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to pick when the predicate is genuinely a coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

If a fork is still ambiguous after DEFAULT and FALLBACK, stop and ask the user one sharp question. Guessing silently is the one move that breaks reproducibility.

Deeper material lives in sibling docs; each leaf links to the one you open next:
[evidence-catalogue.md](evidence-catalogue.md) · [test-doubles.md](test-doubles.md) · [probe-construction.md](probe-construction.md) · [property-based.md](property-based.md) · [determinism-and-flakiness.md](determinism-and-flakiness.md) · [coverage-and-mutation.md](coverage-and-mutation.md)

---

## Motivation overrides (apply BEFORE you traverse anything)

Charter's motivation class is the **root bias**. It does not merely flavor the plan — it rewrites branches and, in two cases, lets you skip a tree entirely. Resolve the override first, then enter Tree A already biased.

| Motivation | What it rewrites |
|---|---|
| **bug-fix** | Tree A is **skipped at the bug's site** — a known defect is worth a test by definition. A regression test that **fails on the unfixed code first** is mandatory before any fix lands. |
| **refactor-safety** | Bias Tree C **classicist**, minimize doubles, and write **characterization tests** that pin *current* behavior (even if imperfect) so the refactor can't silently change it. |
| **hunt-unknown-bugs** | Bias Tree B toward **property-based / fuzz / cross-component invariants** — example-based tests rarely surprise you. |
| **load-or-hardening** | Enable the **resilience overlay** (chaos / stress / load / performance / security) on the funded risks. |
| **pre-release** | Bias Tree B toward **smoke + a thin slice of E2E** over the real user journey; depth comes later. |
| **audit-existing-suite** | The center of gravity inverts to the **standing suite**. Tree A ranks *existing tests + coverage gaps* by residual risk, not just code — a covered-but-unverified path scores on `detection-gap`. Trees B–D run only for the gaps the audit funds (net-new) and the weak/smelly tests it rewrites; the real work is the Bite sweep (mutation teeth, smell cards, single-call audit, delete-is-maintenance). Every gate still clears. |
| **general-confidence** | No override — start recon-first and let Tree A do the triage. |

**DEFAULT** when motivation is mixed: take the *highest-stakes* override that applies and note the others. **FALLBACK** when motivation is unstated: it is `general-confidence`; confirm with the user before committing budget.

---

## TREE A — Should I test this? (worth-it / risk triage)

Run per unit of code or per failure mode. The goal is a **ranked risk ledger** plus an explicit, justified **DO-NOT-TEST list**. Choosing not to test is a deliverable, not an omission — see [coverage-and-mutation.md](coverage-and-mutation.md) for the economics.

```
A1. Reachable by untrusted / external input (user, network, file, env)?
    PREDICATE: can an attacker or a careless caller reach this directly?
    ├─ YES → HIGH priority. Flag as a boundary + fuzz candidate. Continue.
    └─ NO  → continue.

A2. Does it encode REAL logic, or just delegate?
    PREDICATE: branches / state / arithmetic / parsing present?
    ├─ Pure delegation to an already-tested core, adds nothing → SKIP  (reason: thin wrapper)
    ├─ Framework / generated / boilerplate (DTO, getter, arg parser) → SKIP  (reason: framework-guaranteed / trivial)
    ├─ Marked for rewrite or deletion this iteration → SKIP, or characterization-only (reason: soon-to-be-rewritten)
    └─ Real logic → continue.

A3. Blast radius if it is wrong?
    PREDICATE: does failure touch money / data integrity / auth / corruption / availability / safety?
    └─ HIGH → bump priority one rank.

A4. Already caught by an existing higher-level test?
    PREDICATE: would a current E2E / integration test go red on this exact bug?
    ├─ YES, fully → SKIP a dedicated test (reason: covered-indirectly); don't duplicate.
    └─ Partially → LOWER priority; add only the uncovered slice.

A5. Cost to isolate vs value?
    PREDICATE: does a test require a refactor-for-testability?
    ├─ cost >> value AND risk low → DEFER/SKIP (reason: cost>>value). Flag the refactor.
    ├─ cannot be tested at all without a rewrite → SKIP (reason: untestable-without-rewrite). Flag it loudly.
    └─ Otherwise → continue.
```

**Score every survivor:** `likelihood × blast-radius × detection-gap`.

- *likelihood* — how plausible is a defect here? Mine churn × complexity: code that changes often and branches heavily is where bugs breed.
- *blast-radius* — the stakes from Charter (money, data, auth, availability, safety, reputation).
- *detection-gap* — how *late* would we currently catch it? High when nothing else guards this path; near-zero when prod alarms or upstream tests already would.

Rank by the product. **DEFAULT** when a survivor is uncertain: treat it as worth a unit-level test and ask the user. **FALLBACK** when you cannot score it: park it in a "needs-more-recon" bucket rather than forcing a number.

**One-line worked leaf —** *"`parse_amount()` takes a raw HTTP body → A1 YES (untrusted) → A2 real parsing → A3 money → score HIGH, fund first."*

**Output:** the ranked ledger + a DO-NOT-TEST list with one reason each. Skip reasons are exactly: thin-wrapper · framework-guaranteed/trivial · soon-to-be-rewritten · covered-indirectly · cost>>value · untestable-without-rewrite.

---

## TREE B — Which test type? (scope + example-vs-property + overlays)

Run per **funded** risk that cleared Tree A. Output: one leaf = scope + an example-vs-property decision + any overlay.

```
Q1. SCOPE of the behavior under test?
    PREDICATE: how many real, owned units must collaborate for the behavior to exist?
 ├─ Pure function / class, no collaborators, no side effects
 │     → UNIT, NO DOUBLES. Go to Q2.  (A double here is itself an anti-pattern.)
 ├─ One unit WITH collaborators or side effects
 │     → Go to Q2, then route doubles through Tree C.
 │       Result is UNIT (mockist) or NARROW INTEGRATION (classicist), per Tree C stance.
 ├─ 2+ real modules YOU own that meet at a seam and could disagree on an invariant
 │     → INTEGRATION. Use real objects at the seam; double only the outer edges.
 ├─ Behavior depends on an external system you do NOT own (DB / HTTP / queue / cache)
 │     → INTEGRATION with a FAKE or test-container for infra you operate;
 │       CONTRACT test for a service you merely call.
 ├─ A published API or wire protocol with external consumers
 │     → CONTRACT (consumer-driven).
 ├─ A full user-visible journey / acceptance criterion
 │     → E2E / ACCEPTANCE, written Given/When/Then. Keep them FEW — slow and brittle.
 └─ "Is the deploy even alive?" gate
       → SMOKE.

Q2. (single unit only) EXAMPLE-BASED vs PROPERTY-BASED?
    PREDICATE: is the input space small/enumerable, or large/combinatorial with a checkable invariant?
 ├─ Small, enumerable, well-understood input space
 │     → EXAMPLE-BASED UNIT + boundary/equivalence design (Tree D).
 ├─ Large / combinatorial space AND a checkable invariant holds
 │   (roundtrip, idempotency, commutativity, monotonicity, conservation,
 │    model-equivalence vs a reference, "never crashes on valid input")
 │     → PROPERTY-BASED. See property-based.md.
 │       Operation sequences over a stateful object → STATEFUL / MODEL-BASED PROPERTY.
 ├─ Consumes untrusted bytes; goal is "never crashes / no memory-safety or security hole"
 │     → FUZZ (a no-crash / no-panic property).
 └─ Output is large or structural; expected value = "whatever it is now, alarm on change"
       → SNAPSHOT / GOLDEN. Human-reviewed baseline ONLY; never the sole oracle; review every diff.
 Best practice: properties for the space + a handful of pinned examples (including every past regression).

Q3. ORACLE GATE (always — you cannot skip this):
    PREDICATE: can you state "how will I know the expected result?"
    └─ NO → resolve via Tree D's oracle menu BEFORE you commit to example-based.
            If no point oracle exists at all → prefer PROPERTY (metamorphic / invariant)
            or SNAPSHOT-with-review. See probe-construction.md.

Q4. RESILIENCE OVERLAY (only if the Charter motivation justifies it — see overlay below):
 ├─ "It crashes under load"             → STRESS / LOAD / concurrent contention.
 ├─ "Recovery / replay must hold"       → CHAOS (kill mid-write, corrupt/truncate, assert replay-consistency).
 ├─ "Latency / throughput is the SLO"   → PERFORMANCE (explicit budget + a hard threshold).
 └─ "It sits on a trust boundary"       → SECURITY (injection / auth-bypass / secrets-in-output) + fuzz.
```

**PERSPECTIVE — black-box by default.** Test through the public interface; such tests survive refactoring because they assert *behavior*, not structure. Switch to **white-box** only to (a) reach an untested branch a high-risk item is hiding, or (b) hit an error path that the public API cannot trigger. Record the reason whenever you go white-box.

**DEFAULT leaf:** example-based unit + boundary analysis. **FALLBACK** when the type is genuinely unclear: start at unit and escalate via the Bite ladder rather than over-investing up front.

**One-line worked leaf —** *"Risk = 'JSON serializer loses fields on round-trip' → Q1 single unit, pure → Q2 large space + roundtrip invariant → PROPERTY-BASED, oracle = inverse `parse(dump(x)) == x`."*

Per-type definitions, costs, and the cross-language framework table live in [evidence-catalogue.md](evidence-catalogue.md). Property mechanics live in [property-based.md](property-based.md).

---

## TREE C — Which test double? (per collaborator, only after a real dependency is named)

Run **once per collaborator** of the unit chosen in Tree B. The full guide — precise definitions, parallel multi-language sketches, and every anti-pattern with its remedy — is in [test-doubles.md](test-doubles.md). This is the routing summary.

```
GATE 0 — Do you even need a double?
    PREDICATE: is the collaborator fast, deterministic, in-process, and side-effect-free?
    └─ YES → USE THE REAL THING (classicist default). NO DOUBLE. Stop.
       NO  → continue.

GATE 1 — Do you OWN the collaborator's interface?
    PREDICATE: is it a type you control, or a third-party SDK / HTTP client / lib type?
    └─ DON'T OWN → do NOT mock it directly.
         Wrap it behind an adapter YOU own, double the adapter, and pin the real
         behavior with a separate integration or contract test.
         [anti-pattern guarded here: mocking what you don't own]

GATE 2 — Pick the WEAKEST double that answers this test's question:
    ├─ Value is irrelevant; only fills a slot; never invoked          → DUMMY
    ├─ Supplies canned indirect inputs to steer a path; no checking   → STUB   (stub QUERIES)
    ├─ Must assert a call HAPPENED / how; return is meaningless        → SPY    (record, assert after — classicist-friendly)
    ├─ Must pre-program behavior AND assert the exact interaction       → MOCK   (use sparingly; verify COMMANDS)
    └─ Needs realistic stateful behavior too complex to stub
         (in-memory DB / clock / filesystem / queue)                  → FAKE   (then CONTRACT-TEST it vs the real thing → guards drift)

GATE 3 — Classicist (Chicago) vs Mockist (London):
    ├─ DEFAULT CLASSICIST: use real collaborators + fakes; assert resulting STATE or return value.
    │     Refactor-resilient. Use for pure-ish logic, refactor-safety, and cheap collaborators.
    └─ MOCKIST only when: the collaborator is slow / nondeterministic / has an irreversible
          side effect (sends mail, charges a card, publishes an event), OR the interaction
          ITSELF is the contract (ordering, idempotency, retry), OR you are designing an
          unwritten collaborator outside-in. Then assert INTERACTIONS.
```

**HARD-STOP anti-pattern guards (each fires at the node that would produce it):**

- Mocking the unit's own internals / the SUT → **STOP**, you'd be testing structure. Double only at the boundary.
- Asserting an interaction when observable state exists → prefer the **state** assertion.
- Mocking value objects → just construct the real value.
- Reaching for a mock because the dependency is hard-wired → introduce a **seam** instead (see [determinism-and-flakiness.md](determinism-and-flakiness.md)); don't mock around bad design.
- Deep / strict expectation chains → loosen them, or switch to a fake.

**DEFAULT** when a collaborator's character is unclear: assume it's cheap and real (classicist). **FALLBACK** when you can't classify it: name it in the seam map and decide after recon, never mid-write.

**One-line worked leaf —** *"Collaborator = Stripe SDK → GATE 1 don't-own → wrap in a `PaymentGateway` port, FAKE the port for unit tests, contract-test the real adapter; assert the charge state, not the call."*

---

## TREE D — How do I design the cases?

Run per chosen test to turn a leaf into concrete cases. Full tables, the oracle problem, fixtures, and quality rules are in [probe-construction.md](probe-construction.md). Summary:

```
1. EQUIVALENCE CLASSES — partition the input domain; one representative per class.
2. BOUNDARIES (per ordered/bounded domain) — min−1 / min / min+1, max−1 / max / max+1,
   empty, null/None, zero, negative, overflow, duplicate, unsorted, unicode/emoji/NUL,
   off-by-one indices.
3. ERROR PATHS — enumerate every rejection/throw; assert the SPECIFIC error, not just "raises".
4. ORACLE per case (resolution menu — pick one):
     known constant │ inverse-roundtrip f(g(x))==x │ reference/oracle impl (differential)
     │ metamorphic relation │ golden master │ property/invariant │ bounds/tolerance │ human.
     No oracle → escalate to property or snapshot-with-review.
5. INVARIANTS (if property-based) — roundtrip, idempotency, commutativity, monotonicity,
   conservation/no-loss, model-equivalence, no-crash, + domain invariants mined from the
   spec / state machine / "what must ALWAYS hold across any operation sequence?".
6. NEGATIVE SPACE — things that must NEVER happen (no double-charge, a terminal state never
   reverts, no secret in a log line).
```

**DEFAULT minimum per unit:** 1 happy path + 1 error path + the relevant boundaries. **FALLBACK** when the domain is unfamiliar: build the equivalence partition first, then ask the user to confirm the boundaries before writing.

**One-line worked leaf —** *"Risk = pagination off-by-one → boundaries page 0 / 1 / last / last+1, empty result set, exact-page-size set; oracle = known count; negative space = no row appears on two pages."*

---

## DETERMINISM OVERLAY (apply to EVERY selected test, before assertions)

A test that depends on uncontrolled time, randomness, ordering, or I/O is a flake waiting to happen — and a flaky test erodes the whole suite's signal. For each source the test touches, install the seam *first*, then assert. Full taxonomy, refactor-for-testability patterns, and the soak procedure are in [determinism-and-flakiness.md](determinism-and-flakiness.md).

| Source | Install this seam | Anti-pattern it replaces |
|---|---|---|
| time / `now()` | inject or freeze the clock; advance virtual time | sleeping; asserting wall-clock |
| randomness / UUIDs | seeded or injected RNG; pin the seed in the test | unseeded randomness |
| concurrency / async | deterministic scheduler, or await quiescence / barriers | sleep-to-wait; timing asserts |
| network | fake server or recorded interactions | live calls in unit tests |
| filesystem | temp dir or in-memory FS fake | shared, hard-coded paths |
| env / locale / tz / globals | pin then reset between tests; randomize test order | order-dependent state |

If a test still can't be made deterministic at unit scope, widen it to integration with real-but-isolated infra, or quarantine it (tracked, temporary) out of the fast suite. **Never** retry-to-green.

---

## RESILIENCE OVERLAY (motivation-gated — only when Charter unlocked it)

Apply only when the motivation is **load-or-hardening** (or a specific risk's blast radius demands it). These tests are expensive and live outside the fast loop.

| Trigger phrase from the risk | Overlay |
|---|---|
| "falls over under volume" | **STRESS / LOAD** — sustained and burst traffic; concurrent contention on shared resources. |
| "must survive a crash and replay" | **CHAOS / fault injection** — kill mid-write, corrupt or truncate state, drop a dependency; assert recovery and replay-consistency. |
| "latency / throughput is a promised SLO" | **PERFORMANCE** — a stated budget and a hard threshold the test fails below. |
| "sits on a trust boundary" | **SECURITY** — injection, auth-bypass, secret-leakage attempts, plus fuzz on the boundary. |

**DEFAULT** when unlocked but unsure which: start with the single overlay that maps to the *stated* failure story; don't enable all four. **FALLBACK** when not unlocked: skip this overlay entirely — note it as deferred residual risk. See [evidence-catalogue.md](evidence-catalogue.md) for each overlay's recipe.

---

## STRATEGY ESCALATION LADDER (Bite — when an approach finds nothing)

When your current tests pass and surface no defect, climb one rung at a time rather than declaring victory:

```
manual example-based
   → property-based
      → cross-component invariants
         → chaos / stress
            → mutation-test the TESTS (do they even have teeth?)
               → conclude the code is solid, STOP.
```

Each rung costs more; stop as soon as a rung finds a bug (then dispose of it via Books) or you reach the top with the budget you funded.

**Parallel form (ultracode).** With a fleet of agents the ladder need not be climbed one rung at a time — its rungs can be run **concurrently**: dispatch a batch of finders, one per rung, pool and dedup, and loop until *two consecutive rounds surface nothing new*. The exhaustion rule is unchanged (one quiet round is not exhaustion), and so is what comes next — every survivor is verified adversarially against a **named oracle and a red-on-unfixed test** before it counts as a defect. More agents agreeing is not evidence; the oracle is. The full projection of this ladder onto a fleet is in [parallel-execution.md](parallel-execution.md).

**Honest-scoring note:** a green run that found no bug is **not** zero value — it bought down the *detection-gap* on that risk. Report it truthfully as exactly that. Never inflate it into a bug catch, and never dismiss it as wasted. Coverage and mutation literacy for this honest accounting is in [coverage-and-mutation.md](coverage-and-mutation.md).

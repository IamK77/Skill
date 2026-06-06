# Probe Construction — The Oracle-First Pipeline

This reference is organized around a single discipline: **a test earns the right to exist only once you can name its source of truth.** Every probe is built by a numbered pipeline that starts from the question *"how would I know the right answer?"* and derives the inputs, edges, and assertions from that answer — never the reverse. There is no fill-in-the-blank case template here and no master boundary table to copy from; equivalence classes, edge probes, and invariant families enter the pipeline as later steps, downstream of the oracle.

Loaded at **COMPOSE**. You arrive holding a funded risk, a chosen scope and example-vs-property call, and a set of doubles from CHOOSE. Turn each risk into concrete cases *before* writing a single assertion.

The pipeline runs 1 → 10 per funded risk. Steps 1–8 produce the case list and its oracles; steps 9–10 lock isolation and the per-case quality bar that BUILD will honor. Cross-links: route wide-input-space cases to [property-based.md](property-based.md); weigh oracle and teeth economics against [coverage-and-mutation.md](coverage-and-mutation.md); pick the weakest double per collaborator in [test-doubles.md](test-doubles.md); choose the rung of evidence and the trust-boundary stance in [evidence-catalogue.md](evidence-catalogue.md); build determinism in by construction per [determinism-and-flakiness.md](determinism-and-flakiness.md).

---

## 1. Name the oracle, or you have no case

An **oracle** is the external authority a test consults to decide whether an observed result is correct. A case whose expected value comes from running the code and recording whatever came back is not a test — it is a transcript. It pins the implementation to its own present behavior and can only ever detect *change*, never *wrongness*. The most common way a suite rots into a change-detector is the line `assert result == <the value the function happened to return the first time>`.

**The hard rule:** no case may assert the implementation's own output as if that output were the specification. If you cannot say *where the expected value comes from*, the case is not designed — stop and resolve the oracle.

### The oracle ladder — strongest source first

Walk this top to bottom and take the first rung that applies. Strength drops as you descend; reach lower only when every rung above is genuinely unavailable.

| Rung | Source of truth | Reach for it when | Original example |
|---|---|---|---|
| **Spec / hand-derived value** | A constant you can justify from the written contract, mathematics, or a pencil computation | The correct output is small and derivable independently of the code | `cents_to_words(105) == "one dollar and five cents"`, worked out by hand |
| **Parallel / reference implementation** | A second, independently trusted implementation — a naive version, a stdlib routine, an external library | You are optimizing or rewriting something a slow-but-obvious version already does | `our_quicksort(xs) == sorted(xs)` |
| **Inverse / roundtrip** | Apply the operation, then its true inverse, and demand the original back | The operation has a genuine inverse — serialize/deserialize, encode/decode, compress/decompress, push then pop | `from_csv(to_csv(rows)) == rows` |
| **Metamorphic relation** | Assert a *relation* between the outputs of related inputs, without knowing either absolute answer | No point oracle exists, but a known input transform forces a known output transform | adding a more restrictive filter can only shrink a result set, so `query(f + " AND status=open")` is a subset of `query(f)` (assuming `f` does not already constrain `status`) |
| **Golden value with provenance** | A reviewed, checked-in baseline of expected output, each line traceable to *why* it is correct | Output is large or structural (rendered template, serialized report, generated AST) and hard to state inline | a blessed snapshot of a generated PDF receipt — **reviewed on every diff, never the lone oracle for behavior** |
| **Tolerance / bounds** | Assert the answer lands inside a range, not on an exact value | Floating-point, statistical, timing-derived, or otherwise approximate results | `abs(annualized_rate(cashflows) - 0.0725) < 1e-6` |
| **Human-confirmed** | A person states the expected answer per case, recorded in a fixture | None of the above exists — usually a signal the spec itself is missing | a table of expected risk tiers blessed by a domain expert |

### Resolving the rung

```
Can you state the exact correct answer from the spec, math, or hand calculation?
  YES -> SPEC / HAND-DERIVED.
  NO  -> Does a second trusted implementation exist?
          YES -> PARALLEL / REFERENCE.
          NO  -> Is there a true inverse operation?
                  YES -> INVERSE / ROUNDTRIP.
                  NO  -> Can you predict how transforming the input transforms the output?
                          YES -> METAMORPHIC RELATION.
                          NO  -> Is the result approximate or numeric?
                                  YES -> TOLERANCE / BOUNDS.
                                  NO  -> Is the output large/structural?
                                          YES -> GOLDEN VALUE (reviewed, with provenance).
                                          NO  -> HUMAN-CONFIRMED. Flag the missing spec.
```

Landing on golden-value or human-confirmed is itself a finding: it usually means the specification is under-defined, and that belongs in the BOOKS disposition ledger and a note to the user, not silently absorbed. When the input space is large enough that no single oracle can cover it but a *law* holds across all inputs, that is not the bottom of this ladder — it is a signal to route the case to step 6 and [property-based.md](property-based.md), where the oracle becomes the invariant itself.

---

## 2. Partition the input domain into equivalence classes

Inputs that the code routes through the *same* behavior form one equivalence class; one representative per class buys nearly all the defect-finding power of exhaustively enumerating the class at a sliver of the cost.

**Method:**

1. Enumerate each input dimension — every argument, every relevant field, and every piece of ambient state (configuration, the entity's current status, the clock) the behavior reads.
2. Split each dimension into classes of uniform behavior. Capture **valid** classes (accepted, but processed along different routes) *and* **invalid** classes — and give each invalid class its own entry, because each is rejected for a *distinct reason*.
3. Pick one ordinary representative per class.
4. Combine across dimensions deliberately, not exhaustively. The full cartesian product is almost always wasteful; cover every class at least once and combine only the *high-risk interactions*.

**Worked example — `withdraw(account, amount)`:**

| Dimension | Valid classes | Invalid classes |
|---|---|---|
| `amount` | normal (< balance), exactly balance | zero, negative, > balance, NaN / non-numeric |
| `account` | active, not-yet-overdrawn | frozen, closed, nonexistent |
| currency precision | 2-dp money | sub-cent fraction (rejected) |

Each invalid class earns its own case *and* its own specific failure assertion (step 4). "Rejected because negative" and "rejected because insufficient funds" are different behaviors; collapsing them into one *"it raises something"* test discards exactly the distinction that matters.

---

## 3. Edge probes per domain

Defects swarm at the edges of equivalence classes: off-by-one, `<` versus `<=`, inclusive versus exclusive, empty versus one element, the instant a token crosses its expiry. For every *ordered or bounded* dimension a class boundary touches, probe the value on each side of every edge. The general numeric shape is **`edge − 1`, `edge`, `edge + 1`** at both ends of every range; the catalogues below give the domain-specific edges to sweep.

### Numeric (integer / float)
| Probe | Why |
|---|---|
| `min−1`, `min`, `min+1`, `max−1`, `max`, `max+1` | range off-by-one |
| `0`, `−0` (float), `1`, `−1` | sign and zero handling |
| largest/smallest representable; the overflow point | wraparound, saturation |
| `NaN`, `+Inf`, `−Inf` (float) | special-value handling |
| values straddling a tolerance threshold | rounding, `<` vs `<=` |

### String / text
| Probe | Why |
|---|---|
| `""`, `" "`, single character | empty and minimal |
| at the max length, max+1 | length-limit off-by-one |
| leading/trailing whitespace, internal whitespace | trimming assumptions |
| `\n`, `\r\n`, `\t`, embedded `\0` (NUL) | delimiter / C-string truncation |
| Unicode: combining marks, emoji, RTL runs, surrogate pairs | byte vs codepoint vs grapheme length |
| case variants; locale-sensitive casing (Turkish dotless `ı`) | case-folding bugs |
| injection payloads (`'; DROP`, `../`, `${...}`) at a trust boundary | see the trust-boundary discussion in [evidence-catalogue.md](evidence-catalogue.md) |

### Collection / array / map
| Probe | Why |
|---|---|
| `[]` (empty), `[x]` (singleton), `[x, x]` (duplicates) | empty / singleton / dup special cases |
| sorted, reverse-sorted, already-deduped input | order assumptions |
| at capacity, capacity+1 | resize / limit boundary |
| a `null`/`None` element nested inside | null-in-container |
| a very large collection | quadratic blowup, memory pressure |
| map: absent key, colliding key, reliance on insertion order | iteration-order bugs (also a determinism source) |

### Time / date
| Probe | Why |
|---|---|
| epoch / zero time; far future; pre-epoch (negative) | signed/unsigned time bugs |
| Feb 29 (leap day), Dec 31 → Jan 1 rollover | calendar edges |
| DST spring-forward / fall-back (a wall-clock hour that never exists / occurs twice) | local-time arithmetic |
| an expiry landing exactly at `now`, `now−1s`, `now+1s` | inclusive vs exclusive expiry |
| timezone boundaries; a non-UTC locale | tz conversion |
| leap second; differing month lengths | duration math |

> Time is also a determinism source — freeze or inject the clock per [determinism-and-flakiness.md](determinism-and-flakiness.md); never assert against a live `now()`.

### State (entity lifecycle)
| Probe | Why |
|---|---|
| every *valid* transition fires and lands in the correct state | happy transitions |
| every *invalid* transition is refused and leaves state untouched | guard correctness |
| self-loops; re-entering a final state | idempotency / no-revert |
| full operation sequences (created → ... → settled) | path-dependent bugs |
| concurrent transition attempts on one entity | races on the guard |

### Filesystem
| Probe | Why |
|---|---|
| absent file, empty file (`0` bytes), file at the size limit | existence / size edges |
| permission denied, locked / in-use file | I/O error paths |
| truncated / half-written / corrupted content | crash-mid-write recovery |
| path edges: `..`, symlink, very long path, spaces/unicode in the name | path handling |
| disk-full / quota exceeded | write-failure path |

### Network
| Probe | Why |
|---|---|
| timeout at the threshold; just under / just over | deadline handling |
| connection refused, reset mid-stream, DNS failure | error-path coverage |
| partial / truncated / chunked response | parser robustness |
| retry count 0, max, max+1; backoff timing | retry-loop off-by-one |
| 2xx / 3xx / 4xx / 5xx and a malformed status line | status handling |
| slow-drip response (each byte delayed) | stall detection |

### Auth / concurrency
| Probe | Why |
|---|---|
| just-granted vs just-revoked credential | permission timing |
| credential expiring at exactly `now−1s` / `now` / `now+1s` | expiry boundary |
| conflicting or overlapping roles; a privilege-escalation attempt | authz logic |
| double-submit / replay of one request | idempotency |
| simultaneous writes to one resource; last-write-wins; lost update | race conditions |
| lock acquired / held / released; deadlock-prone ordering | concurrency safety |

---

## 4. Enumerate the failure paths

Happy paths are the easy fraction; the defects that reach production live overwhelmingly on the *rejection* paths. Per unit:

1. List every way the operation can legitimately fail — each invalid equivalence class from step 2, plus every dependency and resource failure it can encounter.
2. For each, write a case that pins the **specific** failure: the exact exception *type*, the error *code or variant*, and where it matters the *message* or offending *field* — not a bare "it raised something".
3. Assert the **side-effect contract of failure**: on rejection, did state stay exactly as it was? Was a partial write rolled back? Was nothing charged, nothing sent, nothing enqueued?

```python
# WEAK — green even if the code throws the wrong error for the wrong reason
with pytest.raises(Exception):
    withdraw(account, -50)

# STRONG — pins the specific failure AND the no-side-effect guarantee
before = account.balance
with pytest.raises(ValidationError, match="amount must be positive"):
    withdraw(account, -50)
assert account.balance == before          # negative-space: nothing moved
```

```javascript
// JS/TS: assert the error's type AND shape, not merely that it threw
const before = account.balance;
await expect(withdraw(account, -50))
  .rejects.toMatchObject({ name: "ValidationError", code: "AMOUNT_NOT_POSITIVE" });
expect(account.balance).toBe(before);
```

Languages with typed error returns (Go's `error`, Rust's `Result`) must match the concrete variant — `errors.Is` against the sentinel, matching the specific `Err(...)` arm — not just confirm `err != nil`.

---

## 5. Negative-space assertions — what must NEVER happen

Most assertions confirm a good thing occurred. **Negative-space** assertions confirm a *bad* thing did **not** — and these routinely catch the highest-blast-radius defects, because the worst bugs are silent wrong actions, not missing outputs. Derive them from the stakes recorded in CHARTER.

Original examples by domain:

- **Money:** a retried checkout never double-charges the card; across any transfer the sum of all account balances is conserved.
- **Lifecycle:** a `refunded` order never silently reverts to `paid`; a rejected guard transition mutates nothing.
- **Security / privacy:** no API key, session token, password, or PII ever surfaces in a log line, an error body, or a serialized response.
- **Data integrity:** a batch import drops no row and duplicates none (records-in equals records-out); no foreign key is left dangling.
- **Resources:** no socket, file handle, or lock leaks after the operation — whether it succeeded or failed.

Write each as an explicit assertion ("assert no emitted log line contains the token", "assert the open-handle count returned to its baseline"). For guarantees that must hold across *all* inputs rather than one scenario, promote them to properties — step 6 and [property-based.md](property-based.md).

---

## 6. Mine invariants for property routing

When CHOOSE routed a risk to property-based testing, the oracle is no longer a per-case value but a *law* that holds across the whole generated input space. Start from the standard invariant families, then mine the domain for laws the spec implies.

**Standard invariant families:**

- **Conservation / no-loss:** a count, sum, or set membership is preserved (`len(out) == len(in)`, total balance unchanged across a transfer)
- **Model equivalence:** behaves identically to a deliberately simple reference model
- **Roundtrip / inverse:** `decode(encode(x)) == x`
- **No-crash:** any value of the declared input type is handled without an unhandled exception or panic
- **Idempotency:** `f(f(x)) == f(x)`
- **Commutativity / order-independence:** `f(a, b) == f(b, a)`
- **Monotonicity:** `a <= b ⇒ f(a) <= f(b)`
- **Metamorphic:** a known input transform forces a known output transform (step 1)

**Invariant-mining questions** — pose these to the spec, the lifecycle diagram, and the user, never to the implementation:

1. What must hold of the output *regardless of input*? (a postcondition)
2. What quantity is conserved — a count, a sum, a set — across the operation?
3. Is there an operation that should exactly undo this one?
4. If it runs twice, should the second run change anything?
5. Does input order matter — and if the spec says "no", is that order-independence actually enforced?
6. Take the entity's whole life, not one call: name a guard the spec forbids ever violating — a settled invoice that can never un-settle, an inventory count the rules never let drop below zero, a search index the writes must never leave stale. That forbidden-state guard is your property.

Derive these from the written contract and the stated business rules; the design notes and any lifecycle diagram are where the laws hide. **Never** read them off the implementation — that only re-encodes whatever bug already lives there into a test that will defend it.

---

## 7. The call-it-again probe — state progression and idempotency

A case that invokes a unit **once** is structurally blind to the single most common state defect: the effect *repeating*. Any operation that advances state, or that is meant to run "exactly once," must be driven a **second time** within a test. Most double-charge and double-send bugs sail green through a suite that never makes the second call.

Two questions select the assertion:

- **Should a repeat be a no-op (idempotent)?** Assert the second call has **no additional effect** — identical resulting state, no extra side-effecting call. Pair it with a [spy](test-doubles.md): after *two* invocations, assert the payment gateway was called with the single charge exactly once.
- **Should a repeat advance to the next step?** Assert state **moved forward** — the cursor advanced, the billing schedule rolled to the next period, the sequence number incremented — and that a third call now observes the new state.

The canonical defect this catches: an operation that checks a *due / pending / unprocessed* flag, acts on it, but **never clears or advances** the flag — so every later invocation re-fires (double-charge, double-email, reprocessed queue message). A single-call test passes it without complaint.

**Recipe:**

1. Arrange the precondition (due / pending / first-time).
2. Invoke once; assert the intended effect happened.
3. **Invoke again** under the *same* arranged state.
4. Assert: idempotent → the effect did **not** repeat; progressing → state advanced and the next call behaves accordingly (commonly a no-op or the next step).

This is the design-time counterpart of the **BITE single-call audit**: if a unit mutates state, its case list is not finished until one case calls it twice.

**Pure units take no second-invocation case.** Parsers, decoders, pure compute — no state, no side effects — do not get a state probe; manufacturing one is *N/A, not a gap*. Satisfy this probe once for the whole pure slice by asserting **referential transparency** (same input → equal output / error class), e.g. inside a fuzz body. When a funded slice is dominated by pure units (a parsing/decoding core behind an untrusted boundary is the common shape), the call-it-again obligation legitimately collapses to that single purity property plus the one genuinely stateful unit, if any — that is the expected, correct outcome, not a coverage hole.

---

## 8. The fail-first regression proof

A regression case exists to lock one specific past defect shut. It is valid *only* if you have watched it fail on the broken code — a regression test you never saw go red is indistinguishable from a test that asserts nothing.

**The rule (mandatory for any bug you lock down OR discover mid-flight — whether the CHARTER motivation is bug-fix, or a bug simply surfaced during an audit/hunt under another charter; the proof attaches to the bug, not the charter):**

1. Write the case encoding the *correct* behavior for the bug's scenario.
2. Run it against the **unfixed** code → it must go **RED**. A green here means the case doesn't actually exercise the defect — the case is wrong, not the code; repair the case until it reddens.
3. Apply the fix.
4. Run again → it must go **GREEN**.
5. Name the case for the defect (issue number, symptom) so its purpose outlives the memory of the bug.

This is the case-level instance of the redden-on-purpose discipline measured in BITE and detailed in [coverage-and-mutation.md](coverage-and-mutation.md): a suite that cannot be made to fail is not a suite.

---

## 9. Fixtures, isolation, and the determinism plan

Bad fixtures manufacture brittle, order-dependent, or misleadingly-green tests.

**Construction patterns:**

- **Builder / fluent factory:** start from a valid default object and override only the one field the case turns on, so each case's *intent* is visible — `an_account().with_balance(0).build()`.
- **Factory function:** a `make_user(**overrides)` helper that yields a valid entity with sensible defaults.
- **Object Mother:** named, ready-made canonical instances — `Accounts.frozen()`, `Orders.shipped()` — for recurring scenarios.

**Isolation and determinism principles:**

- **Minimal realistic data:** populate exactly the fields the behavior depends on, with values plausible enough to expose real defects; strip decorative noise that hides which field actually drove the result.
- **Per-test fresh state over shared mutable state:** construct fresh data inside each case (or a fresh-per-test fixture). **Shared mutable fixtures are the single largest source of order-dependent flakiness** — case B passes only because case A ran first and left the world just so.
- **Read-only shared setup is fine** (a constant lookup table, an immutable sample document). The instant a case writes to it, isolate it.
- **Reset every touched resource:** any global, environment variable, singleton, temp directory, or database row a case mutates must be torn down or rolled back. This ties straight to **order-independence** — run the suite in shuffled order (the BUILD soak) and it must still pass.
- **Plan each nondeterminism source now:** for every case, name how the clock, randomness, concurrency, iteration order, and I/O will be pinned — clock injected, seed fixed, network faked — so BUILD can make the case deterministic *by construction* rather than retrofit it. See [determinism-and-flakiness.md](determinism-and-flakiness.md) and [test-doubles.md](test-doubles.md).

---

## 10. The per-case quality bar

These hold for *every* case the pipeline emits, regardless of type:

- **Assert behavior, not structure.** Verify observable outcomes — return values, resulting state, emitted events — through the public interface. Do not assert on private fields, internal call order, or implementation details a behavior-preserving refactor would change. Prefer state assertions over interaction assertions; the classicist/mockist split lives in [test-doubles.md](test-doubles.md).
- **One behavior per case, with a visible arrange / act / assert.** Set up state and doubles, make the single call to the unit under test, then check the outcome — keeping the three regions visually distinct without dressing them in a fixed keyword template. A case may make several physical assertions, but they must all corroborate *one* behavior; if a case checks unrelated facts, split it so a failure points at a single cause.
- **No branching to decide what you assert.** A test must not use `if` / `for` / `while` / `try` to choose its assertions — branching logic in a test is untested code testing your code. If you need many inputs, drive them as separate table rows, each independently named, rather than looping; split conditionals into distinct cases.
- **Descriptive scenario names.** The name states condition → expected outcome — `withdraw_rejects_amount_exceeding_balance`, `parse_returns_empty_list_for_blank_input`. When it fails in CI, the name alone should tell you what broke.

**Default minimum per unit:** one happy path + one failure path + the boundary probes relevant to its domains (step 3). Scale up for high-risk items per the TRIAGE risk ledger; do not pad low-risk units to chase a coverage number — the economics are in [coverage-and-mutation.md](coverage-and-mutation.md).

---

## COMPOSE exit — what BUILD inherits

A written artifact per funded risk containing:

- each case with its **named oracle** (step 1) and its arrange/act/assert intent,
- the equivalence classes and boundary probes covered (steps 2–3),
- the enumerated failure paths with their **specific** assertions (step 4),
- the negative-space "must never happen" assertions (step 5),
- the properties and invariants for any property-routed case (step 6, [property-based.md](property-based.md)),
- the call-it-again probe for every state-mutating or should-be-idempotent unit (step 7),
- the fail-first plan for every regression case (step 8),
- and the fixture, isolation, and determinism plan (step 9).

Carry this into **BUILD**: install the seams first, then write the cases — deterministic by construction, asserting behavior over structure.
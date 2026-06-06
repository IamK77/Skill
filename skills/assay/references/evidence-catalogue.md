# Evidence and its Trust Ceiling — what each test can and cannot see

Cross-linked references: `test-doubles.md`, `property-based.md`, `coverage-and-mutation.md`, `determinism-and-flakiness.md`, `decision-tree.md`. Sibling: `probe-construction.md`. Stages: Charter, Survey, Triage, Choose, Compose, Build, Bite, Books.

Every test buys one fact about the system and is structurally blind to others, no matter how well written. This catalogue indexes the kinds of evidence a test can produce as triplets — **[ what failure it proves | what it costs | what it is structurally BLIND TO ]** — and organizes them so the *blindness* is what you read first. Choose evidence by what a technique can never observe — that blind spot is where the surviving defect lives. The **Choose** stage opens this file: once **Triage** has named and funded the risks, you come here to fit each funded risk to the cheapest evidence whose blind spot does not overlap that risk. The decision tree in [decision-tree.md](decision-tree.md) routes you to a specific entry; this file tells you what that entry can certify and what it leaves uncertified. For how a chosen evidence type becomes concrete written cases, hand off to [probe-construction.md](probe-construction.md).

Evidence has three independent axes that compose freely: a **blast radius** (how much of the system actually runs), a **generation-and-judgment strategy** (where inputs come from and how you know the answer), and an optional **stress overlay** (what abnormal pressure you apply on top). A property-based check at owned-seam radius under a soak overlay is one legal point; a single example at in-process radius with a golden value is another. Read all three axes before committing.

---

## 1. The blast-radius ladder — how much really runs

Four rungs, narrowest to widest. The governing economics: **push every behavior down to the lowest rung that can still observe it.** A defect provable in-process should never be chased at liveness radius — the higher rung runs slower, fails vaguer, flakes more, and points at no specific line. Climb a rung only when the behavior you must observe genuinely does not exist at the rung below. This is an economic rule about where to *spend* evidence, not a shape to fill out; there is no quota and no picture to match.

### Rung 1 — In-process (one behavior, nothing external real)
- **Proves:** branch logic, arithmetic, parsing, a single state transition, boundary handling, the exact error raised on bad input. Failure localization is surgical — a red test names the defect.
- **Costs:** cheapest to write; microseconds to milliseconds per run; thousands per second. The hidden cost is *coupling to internal structure* if you replace too many collaborators with doubles (see the over-isolation trap in [test-doubles.md](test-doubles.md)).
- **Blind to:** everything *between* pieces — wrong wiring, schema drift, a real collaborator that behaves differently from the double you trusted, ordering races. A fully green in-process suite says nothing about whether the parts agree with each other.

### Rung 2 — Owned seam (two-plus components you own, meeting for real)
- **Proves:** the contract two owned components actually exercise where they meet — serialization round-trips, the SQL that really runs, transaction and ordering behavior, field mapping, a collaborator whose live behavior diverges from the stub an in-process test believed.
- **Costs:** slower (tens of milliseconds to seconds), needs setup/teardown and isolated infrastructure such as a throwaway container or an in-memory store, more fragile to environment. Only the *outer* edges — third-party systems, the network boundary — are faked or pinned as isolated infra.
- **Blind to:** whole-journey concerns (a login flow spanning several screens, multi-service orchestration) and anything beyond the owned boundary you faked away. A failure here points at a region, not a line.

**Boundary-agreement evidence (a specialized owned-seam variant).** When the seam crosses a team or deployment boundary you do not control end-to-end, the consumer can declare the requests it issues and the responses it depends on, and that declaration is replayed against the provider in the provider's own pipeline.
- **Proves:** a breaking interface change — a dropped field, a renamed key, a changed status code — *before* either side deploys, without standing both systems up together. It also keeps a fake honest: replay the same declaration against the fake to defeat fake-drift (see [test-doubles.md](test-doubles.md)).
- **Costs:** moderate in code, high in coordination — two parties must agree on the declaration and keep agreeing as both evolve.
- **Blind to:** end-to-end behavior, performance, and any assumption the consumer never wrote down. It certifies interface shape — fields, types, status codes — not whether the values are correct.

### Rung 3 — Assembled system (the whole thing, driven like a real client)
- **Proves:** integration-of-everything defects — routing, auth wiring, configuration, deployment glue, cross-service orchestration. The only rung that proves the user-visible journey actually completes. A *business-requirement* framing of this rung, phrased in stakeholder language, additionally proves "we built the agreed thing, not a near-miss." It doubles as executable specification.
- **Costs:** the highest — slow (seconds to minutes), flaky, expensive to maintain, painful to debug because the fault could be anywhere. Keep these *few*: a thin layer over only the riskiest journeys. The requirement-framed variant adds the cost of staying readable to non-engineers and grows brittle if pinned to incidental UI details.
- **Blind to:** edge cases and error branches — combinatorially hopeless to enumerate at this radius, so push them down to Rung 1. Localization is weak: red tells you *something* broke, rarely *what*. The requirement-framed variant is additionally blind to anything outside the stated criteria and is no substitute for lower-rung depth.

### Rung 4 — Liveness (is the deployed thing even alive?)
- **Proves:** gross total breakage right after deploy or startup — bad config, a failed migration, a dead dependency, a broken deploy — caught fast, before deeper suites or real users hit it. A health endpoint answers; the app boots; the critical path returns a success status.
- **Costs:** trivial, seconds. The cheapest possible early-warning signal.
- **Blind to:** essentially all correctness. Green here means "not on fire," never "working."

---

## 2. Generation-and-judgment strategies — where inputs and answers come from

These attach to a rung (usually 1 or 2) and decide how cases are produced and, crucially, how the test *knows the right answer* — its oracle. The strategy you pick fixes the *kind of truth* the evidence can certify. Oracle sourcing is covered in full in [probe-construction.md](probe-construction.md); here, read each strategy by the truth it cannot reach.

### Example (hand-chosen input, hand-known answer)
- **Certifies:** that one concrete, named input produces one concrete, named output — the most legible and debuggable evidence available.
- **Costs:** negligible per case; the cost is human time to pick inputs worth picking.
- **Cannot certify:** anything about the inputs you did not write down. One example is one point; the defect may sit one value to the left of it.

### Partition / boundary (equivalence classes, then their edges)
- **Certifies:** that the code handles a whole *category* correctly (one representative per class the code treats identically) and — this is the high-yield part — that it handles the *edges between categories*: min−1 / min / min+1, max−1 / max / max+1, zero, empty, null, the first value past a limit, the off-by-one index, the overflow. Catches the single commonest defect family — fencepost and `<`-vs-`<=` errors. Example: for a `withdraw(amount)` against a balance, the funded edges are `amount` of 0, exactly the balance, one cent over the balance, and a negative `amount`.
- **Costs:** low; partitioning *reduces* case count (a thinking step), and each ordered dimension adds only a handful of edge probes.
- **Cannot certify:** behavior *between* representatives far from any edge, and interactions across several inputs at once. Drawing a class boundary wrong silently hides whatever falls in the mis-drawn class.

### Regression / fail-first (a case pinned to a specific past defect)
- **Certifies:** that a once-fixed bug stays fixed as the code evolves — but only when the case was first watched failing against the buggy code, then watched passing once patched. A regression assertion that has never gone red proves nothing, because it may be green for reasons unrelated to the fix.
- **Costs:** low per case; the catalogue grows monotonically across the project's life.
- **Cannot certify:** anything but the one failure it pins. It guards yesterday's bug, never tomorrow's.

### Snapshot / golden (a blessed baseline, diffed on every run)
- **Certifies:** that large structural output (a rendered tree, a serialized blob, a generated report) has not *changed* since a baseline you captured — useful where per-field assertions would be impractical.
- **Costs:** cheap to capture, *expensive to trust* — humans rubber-stamp diffs and bless real regressions straight into the baseline.
- **Cannot certify:** whether the baseline was ever *correct*. It detects change, not wrongness. Never the sole oracle: keep snapshots small and human-readable, review every diff, and pair with at least one semantic assertion (see the oracle ladder in [probe-construction.md](probe-construction.md)).

### Differential / metamorphic (judgment without a known absolute answer)
- **Certifies:** correctness when you cannot state the right answer outright but can either compare against a trusted twin or assert a relation. *Differential* runs the input through a reference implementation (or the prior version) and asserts the outputs agree. *Metamorphic* asserts a relation between related inputs/outputs without knowing either absolute — e.g. `sort(shuffle(x)) == sort(x)` (order of arrival must not change the sorted result); or `search(q AND extra)` must return a subset of `search(q)`; or paginating a list with `page_size=10` then concatenating all pages must reproduce the single-page result exactly (no row dropped or duplicated at a page edge).
- **Costs:** differential needs a trustworthy second implementation; metamorphic needs a *true* relation you can defend — finding the relation is the hard part.
- **Cannot certify:** any bug the reference implementation *shares*, and anything outside the chosen relation. A weak relation certifies a weak fact.

### Property (an invariant over all valid inputs, machine-generated)
- **Certifies:** that a stated invariant holds across a large, machine-generated input space including edge inputs you would never hand-pick; the framework shrinks any failure to a minimal counterexample, and a pinned seed reproduces it. Routes here when the input space is large and a true invariant holds — full mechanics in [property-based.md](property-based.md).
- **Costs:** higher design effort (a real invariant plus a good generator) and slower runs; nondeterministic if the seed is not pinned.
- **Cannot certify:** anything the stated invariant does not constrain. A tautological or too-weak property passes vacuously and finds nothing — best paired with a few pinned examples.

### Fuzz (hostile or malformed input, survival as the oracle)
- **Certifies:** that code *survives* untrusted or malformed bytes — does not crash, panic, hang, leak, or corrupt memory. Coverage-guided fuzzers evolve inputs toward new paths. This is the parser / decoder / deserializer attack surface.
- **Costs:** setup plus long machine time; needs a seed corpus and a stable harness.
- **Cannot certify:** that the *answer* is right — survival is not correctness. Add a stronger oracle if you need more than "it didn't fall over."

---

## 3. Stress overlays — abnormal pressure, gated on the Charter goal

Overlays run *on top of* a rung and are only in scope when the **Charter** goal funds them (the hardening / load / pre-release classes of job, resolved through the decision-tree root override in [decision-tree.md](decision-tree.md)). Do not apply an overlay a correctness-only Charter never asked for.

### Load (sustained realistic traffic over time)
- **Proves:** slow leaks (memory, file handles, connections), gradual degradation, and throughput ceilings that surface only under duration at or near expected peak.
- **Costs:** long-running; needs a representative workload generator and a stable target.
- **Blind to:** cold-start and beyond-capacity behavior (that is stress), and all functional correctness.

### Stress (pushed past designed capacity)
- **Proves:** the *breaking point* and, more importantly, the *failure mode* — does the system shed load gracefully or fall over and corrupt state? Also recovery-after-overload.
- **Costs:** high and environment-sensitive; results are noisy and need a controlled rig.
- **Blind to:** steady-state correctness and functional bugs.

### Soak / chaos (faults injected into a running system)
- **Proves:** recovery behavior and silent corruption under injected failure — a process killed mid-write, a truncated or corrupted file, dropped packets, a partitioned network, injected latency, an exhausted pool. Assert the system recovers consistently: no partial-write corruption, retry/idempotency relations hold, no split-brain. *Soak* additionally proves stability under a long-held abnormal condition.
- **Costs:** high — needs a running system and infrastructure to break; breaking things is cheap, asserting correct *recovery* is expensive.
- **Blind to:** single-component logic and steady-state correctness.

### Fuzz-as-overlay and the performance/security framings
- **Performance:** measure latency/throughput against an **explicit asserted budget** (p99 under N ms, at least M req/s) and fail the build on regression — without a threshold it is a benchmark, not a test. Needs a stable, isolated environment or it flakes on noise (see [determinism-and-flakiness.md](determinism-and-flakiness.md)). Blind to correctness.
- **Security:** attack the trust boundary on purpose — **injection** (SQL / command / template / path traversal), **auth/authz bypass** (privilege escalation, IDOR, missing checks, broken sessions), and **secrets exposure** — any path where a credential, token, or piece of PII escapes its trust zone, whether emitted to an observability sink, returned in a payload, surfaced in a stack trace, or persisted to a debug artifact. Combine targeted cases with fuzzing of every untrusted-input path. Blind to novel attack classes and design-level flaws not encoded in your cases — pair with external scanning and review.

The **Books** stage is where performance and security get either a pointing test or an explicit deferral; an overlay funded by the Charter and never run is a residual risk to log there, not a silent gap.

---

## 4. Observation stance — through the interface, or into the structure

Orthogonal to every axis above: *from where* do you observe?

- **Through-the-interface (default).** Observe only through the public surface, using the spec as your guide. The evidence survives any behavior-preserving refactor and asserts *behavior*. This is where you start and where you stay unless forced off it.
- **Structure-aware (deliberate, costed).** Use knowledge of internals *only* to reach a branch otherwise unreachable from the public surface — an error path you cannot trigger from outside, or a branch a high-risk item hides. The coupling cost is real: structure-aware evidence binds to implementation and reddens on refactor, so spend it deliberately and, even when internal knowledge *selected* the case, aim the assertion back at observable behavior wherever you can.

The rule: let blast radius and the funded risk pick the rung, let the oracle pick the strategy, and keep the stance through-the-interface until a specific unreachable branch forces you inward — then name the coupling you just took on.

---

## 5. Stack → tooling

Pick your stack's row and substitute equivalents freely. "Property" is the property-based engine; "Doubles" is the mocking/faking library (semantics, mechanics, and the weakest-double rule in [test-doubles.md](test-doubles.md)). Mutation and coverage tooling live in [coverage-and-mutation.md](coverage-and-mutation.md).

| Language | Runner / assert | Property | Fuzz | Doubles | Snapshot |
|---|---|---|---|---|---|
| **Python** | `pytest`, `unittest` | `hypothesis` | `atheris`, hypothesis | `unittest.mock`, `pytest-mock` | `syrupy` |
| **JS / TS** | `jest`, `vitest`, `mocha` | `fast-check` | `jsfuzz`, fast-check | `jest.fn`/`vi.fn`, `sinon`, `testdouble` | `jest`/`vitest` built-in |
| **Java / JVM** | `JUnit 5`, `TestNG` | `jqwik` | `jazzer` | `Mockito`, `EasyMock` | `ApprovalTests` |
| **Go** | `go test`, `testify` | `rapid`, builtin `testing/quick` | builtin `go test -fuzz` | `gomock`, `testify/mock` | `cupaloy`, `goldie` |
| **Rust** | builtin `#[test]`, `cargo test` | `proptest`, `quickcheck` | `cargo-fuzz` (`libfuzzer`) | `mockall`, `faux` | `insta` |

Boundary-agreement (consumer-driven) tooling is largely language-agnostic — `Pact` has bindings across most of the above.

---

## 6. Fast picker — keyed to the decision-tree leaves

When the tree in [decision-tree.md](decision-tree.md) drops you on a leaf, this is the one-line read. Skipped the tree? Default to the **lowest rung that can see the behavior**; when ambiguous, ask the user before escalating up the ladder.

- Pure logic, answer known → **in-process + partition/boundary**, example oracle.
- Pure logic, large input space + a true invariant → **in-process + property** ([property-based.md](property-based.md)).
- Two owned components meeting at a seam → **owned seam**, real at the seam.
- You depend on a service you do not own → **boundary-agreement** declaration + a fake guarded by it.
- Untrusted bytes, "must not crash or be exploited" → **fuzz** + **security** framing.
- A user-visible journey or a signed-off requirement → a **thin** assembled-system case (keep few).
- "Is the deploy alive?" → **liveness**.
- Charter funds hardening/load → add the matching **load / stress / soak-chaos / performance** overlay.

Once an evidence type is chosen, take the funded risk into [probe-construction.md](probe-construction.md): name its oracle first, then derive the cases.
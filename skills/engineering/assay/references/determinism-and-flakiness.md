# Determinism and Flakiness

This is the determinism home of the skill. In **Build** you build determinism in by construction (Part 1); when a test goes flaky anyway, the diagnosis procedure (Part 2) finds the root cause instead of papering over it. For where determinism enters decisions across the suite, see the [decision tree's determinism overlay](decision-tree.md).

A flaky test is one that passes and fails on the *same code*. It is not a nuisance to be retried away — it is a defect in the test (or the system) that destroys the signal the suite exists to provide. The cure is determinism by construction; the fallback is disciplined diagnosis.

---

## Part 1 — Determinism by construction

A test is **deterministic** when the same inputs always produce the same result. It is **hermetic** when it sets up and tears down its own world, depends on nothing external, and shares nothing with its neighbors. Hermeticity is what makes determinism survive parallel execution and random ordering.

### The sources of nondeterminism

Every flaky test traces back to one of these. Tame the source rather than suppress the symptom.

| Source | Why it bites | How to tame it |
|---|---|---|
| **Wall-clock time** | `now()`, timeouts, TTLs, date math across DST/midnight | Inject a clock interface; freeze or advance it explicitly. Never call the system clock from code under test. |
| **Randomness** | Unseeded RNG, UUIDs, shuffles | Inject the RNG or seed it from the test; assert on structure, not the specific random value. |
| **Concurrency & scheduling** | Thread interleaving, async ordering, `sleep`-based waits | Control execution: await completion signals, use deterministic schedulers / virtual time, replace `sleep` with explicit synchronization. |
| **Iteration & collection order** | Hash-map/set order, unordered query results | Sort before asserting, or assert order-independently. Never depend on map iteration order. |
| **I/O & filesystem** | Shared paths, leftover files, cwd assumptions | Per-test temp directories; absolute paths; clean up in teardown. |
| **Network & external services** | Latency, outages, rate limits, shared mutable state | Replace with fakes; verify the boundary with contract tests. See [test-doubles.md](test-doubles.md). |
| **Global / shared state** | Singletons, caches, static fields, env mutation | Reset between tests; prefer instance state over global. |
| **Locale / timezone / env** | Number/date formatting, sort collation, `$TZ`, `$LANG` | Pin them explicitly in the test (UTC, `C`/`en-US`) rather than inheriting the machine's. |

### Taming the big three

**Time.** Code that calls the system clock directly is untestable at the edges. Introduce a `Clock` seam — an interface with `now()` — and inject a real clock in production, a controllable one in tests. The test then *freezes* time at a known instant or *advances* it deterministically to exercise timeouts and expiry. This also lets you test the awkward instants (leap day, DST boundary, epoch rollover) on demand.

**Randomness.** Two valid strategies: (a) inject the RNG so the test supplies a fixed sequence, or (b) seed a real RNG from the test and log the seed. Prefer asserting on *invariants* ("result is a permutation of the input", "length is 16", "all elements unique") over a single golden value — that is the bridge to [property-based testing](property-based.md). Treat UUIDs and IDs as injected too.

**Concurrency.** Banish `sleep(n)` as a synchronization tool — it is simultaneously too slow and too flaky. Instead:

- Await an explicit signal: a latch, future, completion callback, or condition the test can poll with a *bounded* timeout.
- Use a deterministic / single-threaded scheduler or virtual-time test executor where the framework offers one.
- Push real concurrency to the system's edge and test the core sequentially (see seams below).
- If you must poll, poll for the *condition* with a generous ceiling — never assume "100ms is enough."

### Hermeticity checklist

A test is hermetic when every box is checked:

- [ ] Creates its own fixtures, temp dirs, and data; assumes nothing pre-exists.
- [ ] Tears down everything it created — files, rows, registrations, global mutations.
- [ ] Has **no order dependence**: passes when run alone, first, last, or shuffled.
- [ ] Is **parallel-safe**: no shared file paths, ports, DB rows, or singletons with a neighbor.
- [ ] Pins time, RNG seed, timezone, and locale rather than inheriting them.
- [ ] Touches no real network or external service (uses a fake/double instead).
- [ ] Asserts order-independently unless order is part of the contract.

### Refactor-for-testability: seams

Most nondeterminism is curable by moving the nondeterministic part to the edge and keeping the core pure.

- **Dependency injection.** Pass clocks, RNGs, network clients, and the filesystem in as collaborators rather than reaching for globals. The test supplies controllable versions. This is the single highest-leverage move for determinism.
- **Humble object.** Make the component that touches the messy world (UI, socket, scheduler, frameworks) as thin and logic-free as possible. All real behavior lives in a plain, fully testable object the humble shell delegates to.
- **Extract the edge behind an interface.** Wrap "what is the time / random / on disk / over the wire" in a narrow interface. Production wires the real implementation; tests wire a fake. The core logic becomes a pure function of its inputs — deterministic by construction.

The payoff: the unpredictable 5% is isolated and tested with doubles, while the deterministic 95% is tested directly. For turning that pure core into thorough cases, see [probe-construction.md](probe-construction.md); for choosing and building the doubles at the edge, see [test-doubles.md](test-doubles.md).

---

## Part 2 — Diagnosing a flaky test

When a test flakes despite the above, do not retry it and move on. Run the procedure.

### The diagnosis procedure

1. **Reproduce.** Run the test in a loop — repeat-N (e.g. 100–1000 runs) and/or a timed *soak*. A test that fails 1-in-500 needs enough iterations to surface. If it never fails in isolation, the cause is environmental or order-related, not internal.
2. **Shuffle order.** Run the suite with randomized test ordering (and record the seed). If failures appear only under certain orderings, you have **order dependence** / shared state.
3. **Isolate.** Run the suspect test *alone*, then *inside the full suite*. Alone-passes-but-suite-fails confirms pollution from a sibling. Suite-passes-but-alone-fails confirms a hidden setup dependency.
4. **Bisect the cause.** Narrow which test, commit, or resource is responsible: `git bisect` across history; binary-search the set of co-running tests; toggle resources (network, parallelism, DB). The goal is the *minimal* reproduction.
5. **Capture on failure.** Make the failure forensically useful: log the RNG seed, the frozen/observed time, thread/timing traces, the shuffle seed, and full environment. A flake you can't inspect is a flake you can't fix. Wire this *before* you stop reproducing — the next failure is your only evidence.

### Symptom → cause → fix

| Symptom | Likely root cause | Fix |
|---|---|---|
| Fails only in certain test orders | Order dependence / shared state | Reset state in teardown; remove cross-test coupling; make setup self-contained |
| Passes alone, fails in suite | Pollution from a sibling (global, cache, file, DB row) | Isolate state; per-test fixtures; unique resource names |
| Fails near midnight / month-end / under load | Real wall-clock time or `sleep` | Inject and freeze a clock; replace sleeps with awaits |
| Different result each run, no time link | Unseeded randomness | Seed or inject the RNG; assert on invariants |
| Fails intermittently under parallelism | Race condition | Add synchronization; await signals; serialize the contended resource |
| Degrades over a long run; "too many open …" | Resource leak / limit (fds, connections, threads) | Close/release in teardown; pool and cap; assert no leak |
| Fails when CI network is slow/down | Network / external flakiness | Replace with a fake; add a [contract test](test-doubles.md) at the boundary |
| Asserts equal but values "look the same" | Nondeterministic assertion (set-vs-list order, float ==) | Compare order-independently; use tolerance/epsilon for floats |

### Quarantine protocol

Quarantine isolates a known-flaky test from the gating signal so one bad test does not block everyone — without losing the test.

**When to quarantine:** the test flakes in CI *and* cannot be fixed within the current change. Quarantine is for *buying time*, not for tests you've given up on.

**How:**

1. Tag the test so it no longer gates merges (still runs, results visible — never silently skipped).
2. **File a ticket immediately** with the reproduction, captured logs/seeds, and a hard **deadline**. Quarantine is a ticket-with-a-deadline, not a graveyard.
3. Assign an owner. An unowned quarantined test is a deleted test in slow motion.
4. At the deadline: fix it or *delete* it deliberately. Never let it rot indefinitely in quarantine.

**Never delete the signal.** A flaky test is frequently reporting a *real* race or leak in the production code. Deleting (or permanently muting) it discards a bug report. Quarantine preserves the signal while unblocking the team.

### Why retries are a smell, not a fix

Automatic reruns ("retry up to 3×, pass if any succeeds") feel like a fix and are not:

- They **hide real bugs** — a genuine production race now shows green.
- They **mask degradation** — flakiness silently worsens until retries can't paper over it.
- They **slow the suite** and inflate cost, paying repeatedly to ignore a problem.
- They **erode trust** — once green is unreliable, every failure gets dismissed, including the real ones.

A bounded retry can be a *temporary* bridge while a quarantine ticket is open, but it is never the resolution. The resolution is determinism by construction (Part 1).

---

## Related

- [decision-tree.md](decision-tree.md) — the determinism overlay across testing decisions
- [test-doubles.md](test-doubles.md) — fakes/contract tests for network and external edges
- [probe-construction.md](probe-construction.md) — designing cases for the pure core once the edge is isolated
- [property-based.md](property-based.md) — asserting invariants instead of golden values; controlling generator seeds
- [coverage-and-mutation.md](coverage-and-mutation.md) — confirming the deterministic tests actually exercise behavior

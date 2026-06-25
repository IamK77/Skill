---
name: gauge
description: >
  Engineer a codebase's feedback surface so an agent gets clear feedback at every
  step — fast, local, attributed, deterministic, and hard to fake green — instead
  of flailing against late, opaque, or false-green signals. Set up the strict type
  layer, boundary validation, errors-as-values, structured failures, observability,
  and the gates that make the signal trustworthy. Use when the user wants a project
  to give the agent a "static-language / Rust-like hand-feel", asks to set up strict
  typing (pyright/mypy/tsc), add boundary validation (pydantic/zod), make failures
  legible, stop an agent guessing, or harden the feedback the codebase produces.
  Triggers on "clear feedback for the agent", "Rust-like hand-feel in Python/TS",
  "set up strict typing", "make failures legible", "the agent keeps flailing".
argument-hint: "[project / module to gauge]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# gauge

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An agent works in a loop: act → observe a signal → correct. Its effectiveness is bounded by the **quality of the signal at each step** — it has no intuition about the system, no memory between sessions, and no "feel" that something is subtly wrong. It knows only what the code, the checker, the test, and the logs *tell* it. So the highest-leverage thing you can do for an agent is make the codebase's feedback **clear**.

The goal is not to copy a static language's syntax — it is to reproduce the *property* a good static language delivers: clear feedback. Decompose "clear" into the dimensions you actually engineer for:

- **Fast** — it returns inside the agent's working loop (on save, on one command), not minutes later and not only in production.
- **Local** — it points at the exact site (file, line, sub-expression), not "something failed downstream".
- **Attributed** — it says *why* (expected X, got Y; this constraint failed), not just "error".
- **Deterministic** — same input, same signal; a flaky signal is no signal, because the agent can't attribute it.
- **Trustworthy** — green means good, and *absence* of a signal means "fine", not "this path was never checked".
- **Un-fakeable** — a signal the agent can flip green by hand (delete the assertion, `as any`, widen the timeout) is noise, not feedback.

No single tool delivers all of this. You **assemble** clear feedback from several sources, and for each way the code can fail you pick the source that gives the clearest signal cheapest, and push it as far **left** (early) as it will go. This skill walks a five-stage flight plan and will not fly past a **GATE** until it is cleared.

**Discipline:** finish every GATE before the next stage. The `checklist` tool enforces the order; let it. Commands address stages by **name**. **Recon mode:** when this runs as a solo, read-only assessment with no user present (no one to consult at a gate, nothing built yet), the GATEs become a *self-check that each stage's failure modes are characterized*, and the deliverable is a findings ledger — the six-dimension scoring plus a ranked, scoped fix list — not a built feedback surface. `verify <stage>` then means "I have diagnosed and ranked this stage's gap," not "I stood the source up."

**Read [references/agent-feedback-shifts.md](references/agent-feedback-shifts.md) first** — why feedback quality is the lever for an agent specifically, and why *un-fakeable* is not optional (an agent games a signal the way it games any gate). Match effort to risk — richly instrumenting a trivial helper is the same waste as leaving a payments path opaque.

**Match the reader's fluency.** Much of this skill's vocabulary is unavoidably technical (`Any`, a discriminated union, boundary parsing, mutation testing), and with a fluent engineer that register is correct. But the strictness-by-risk dial and the recon findings ledger are set *with* whoever owns the code, and not every owner is fluent — read it from how they talk, and gloss a term on first use when they are not. A dial nobody but you understood is a strictness budget one party set; its whole point is a shared call on where rigor is worth its friction.

## Where this sits next to the other skills

`gauge` is the *medium*, not a lifecycle phase: it makes the code emit clear signal, and it leans on its siblings for depth. The **contracts and boundaries** it instruments are `load-bearing`'s decisions; the **behavior tests** that are one feedback source are designed in `assay`; the **pipeline** that runs the gates is operated by `flightline`; the **production observability** is operated by `stationkeeping`. This skill's job is to ensure *every failure mode has a clear, un-fakeable signal* and that they are wired together — not to reimplement those skills.

## The reference library

- **[references/decision-tree.md](references/decision-tree.md)** — the engine: the six dimensions as scoring axes, the per-failure-mode source selector (which signal, pushed how far left), and the strictness-by-risk dial.
- [references/agent-feedback-shifts.md](references/agent-feedback-shifts.md) — the must-be-told reference: how an agent's loop, statelessness, and signal-gaming change what "good feedback" means.
- [references/feedback-sources.md](references/feedback-sources.md) — the catalogue: static types, boundary validation, behavior tests, structured errors, observability — what failure class each catches, how far left it lives, and how to make each un-fakeable.
- [references/python-recipe.md](references/python-recipe.md) — the concrete Python stack for a static-language hand-feel and its honest limits.
- [references/typescript-recipe.md](references/typescript-recipe.md) — the concrete TypeScript stack and its honest limits.
- [references/honest-ceiling.md](references/honest-ceiling.md) — what is *not* achievable (gradual ≠ sound; green ≠ proof), the irreducible residual, and the one move that neutralises it: make "unchecked" itself a signal.

---

## STAGE 0 — Frame (failure modes, and the bar)

Open **[references/decision-tree.md](references/decision-tree.md)**. List the ways this code can actually fail — wrong shape, bad external data, wrong behavior, runtime fault, production-only failure — weighted by blast radius. The target is a **clear-feedback source for each mode** (fast / local / attributed / deterministic / trustworthy / un-fakeable). Set the strictness by risk: *够用就好* — the durable, high-blast-radius paths earn rich instrumentation; trivial, stable code does not. Over-instrumenting everything produces noise, and noise hides the real signal as surely as silence does.

### GATE — clear before STAGE 1
1. `checklist check frame failure-modes-and-bar`
2. `checklist verify frame`

---

## STAGE 1 — Static layer (the leftmost, cheapest signal)

Open **[references/feedback-sources.md](references/feedback-sources.md)** and the matching language recipe. The static checker is the closest thing to a compiler an agent gets — fast, local, in its own edit loop, before anything runs. Make it real:

- **Run the checker in strict mode and as a gate** (pyright/mypy/`tsc` strict). A type layer that isn't enforced doesn't exist for an agent. **Brownfield first:** on most existing targets the checker is either *declared but dead* (strict in config, yet ungated and deep red) or absent entirely. Do **not** open at strict on a codebase with latent diagnostics — that buries the real defects under annotation-presence noise. Run the checker at its default mode to get a **finite baseline count**, gate that the count must not rise (ratchet down only), and add a CI guard that fails if the gate hook is removed or re-commented; strict-from-day-one is the greenfield default only. If no checker is installed but `uv` is present, bootstrap one with zero install footprint (`uvx ty check`, `uv run --with mypy mypy …`) before scoring — an *unrunnable* signal is not the same as an *absent* one. See [references/python-recipe.md](references/python-recipe.md) §2.
- **Typed records, never untyped bags** — a dataclass / model / interface, not `dict[str, Any]` / `any`. This single habit decides most of the hand-feel.
- **Put failure modes in the signature** — prefer errors-as-values where it pays, so the checker forces the caller to handle them, instead of an untyped throw the type system can't see.
- **Exhaustiveness and no-null** — closed unions matched exhaustively (the checker errors on a missing case), and non-null narrowed before use.

### GATE — clear before STAGE 2
1. `checklist check static static-layer`
2. `TYPECHECK_CMD="<your strict type-check command>" checklist verify static` — `static-checker-green` is a **sensor**, not a self-certified check: `verify` runs `${TYPECHECK_CMD}` (e.g. `tsc --noEmit`, `mypy --strict`, `pyright`) in the project and clears only if it exits 0. A green you only claim does not count.

---

## STAGE 2 — Boundary (runtime signal where static can't reach)

Open the language recipe's boundary section. Static types are erased at runtime, so at every edge where real or untyped data enters — external input, network, files, an untyped library — the static type is a *claim*, not a *check*. **Validate, don't assert:** parse incoming data into a typed model at the boundary (pydantic / zod), so a bad shape fails *there*, attributed ("field X violated Y"), instead of three layers in. **Contain `Any`/`any` to thin adapter modules** at those edges and convert immediately; never let it flow inward, where it silently disables checking on everything it touches.

### GATE — clear before STAGE 3
1. `checklist check boundary boundaries-validated`
2. `checklist verify boundary`

---

## STAGE 3 — Behavior & runtime (the signal types can't give)

Some failures are behavioral or only appear at runtime; types won't catch them. Give each a source:

- **Behavior** → tests as legible oracles: one behavior per test, one reason to fail, a message that states expected-vs-actual. Designing them well is the `assay` skill's job; here, ensure the behavioral failure modes from STAGE 0 *have* a test that fails clearly. **Fallback when the suite exists but cannot run in your environment** (encrypted/missing fixtures, env-gated golden files, uninstalled toolchain): score the source by *inspection* — confirm it is gated upstream (read the CI config) and read its structure — and record **explicitly that you could not execute it**, so the unexercised state is a visible residual, not silently scored present or absent. Carve out the runnable subset (a pure unit on a parse helper, a directly-constructed model) and assert *that* with real teeth rather than assuming the whole suite verifies.
- **Runtime faults** → **fail loud, local, and attributed**: a structured error that names the cause at its site, not a generic exception swallowed and re-raised three layers up.
- **Production-only** → observability: structured logs, traces, correlation IDs, so a failure the agent cannot feel becomes a readable signal. Operating that observability is `stationkeeping`'s job; here, ensure the hooks exist.

### GATE — clear before STAGE 4
1. `checklist check behavior-runtime behavior-and-runtime-legible`
2. `checklist verify behavior-runtime`

---

## STAGE 4 — Trustworthy (un-fakeable, and absence made visible)

Open **[references/honest-ceiling.md](references/honest-ceiling.md)**. A signal only helps if it can't be faked and if silence can't be mistaken for safety.

- **Un-fakeable** — gate every source in CI and pre-commit, and ban the escape hatches an agent reaches for to flip a signal green: unjustified `Any`/`cast`/`# type: ignore` / `as any` / `@ts-ignore`, deleted assertions, widened timeouts, `retries` masking flakes. A green light the agent can manufacture is not a gate.
- **Absence is a signal** — this is the one move that neutralises the gradual-typing weakness. Make "not checked" *visible*: have the checker report unknown/`Any` types, read coverage as a map of untested paths, use mutation testing to expose assertion-free tests — but a mutation gate only counts if it actually exercises mutants (a false "all survived" is worse than none; sanity-check it, and prefer a rebuild-based mutator on I/O-driven or editable-install code — see [references/honest-ceiling.md](references/honest-ceiling.md)). A subtler silence to hunt: the *same* knowledge encoded twice in **opposite directions** — a whitelist (`status in {…}`) in one place and a blacklist (`status not in {…}`) in another. The two agree today and diverge *silently* the first time a state is added — the blacklist fails silent (quietly admitting the new state), the whitelist fails safe (excluding it) — a logic bug the checker and the suite both stay green over. Diff duplicated predicates, collapse them to **one named set** both sites consume, and prefer the fail-safe whitelist form (paired with the STAGE-1 exhaustiveness check so a new case errors at the definition); full treatment in [references/honest-ceiling.md](references/honest-ceiling.md). Otherwise an agent reads silence as safety, which is exactly where the residual risk hides.

Accept the honest ceiling: this gets you the *experience* of clear static-language feedback, not a free, total, soundness *proof*. You asymptote toward it with discipline and gates; you don't reach it — but you make the gap visible instead of silent.

### FINAL GATE
1. `checklist check trustworthy ungameable-green`
2. `checklist check trustworthy absence-is-a-signal`
3. `checklist verify trustworthy`
4. `checklist show` — confirm all five stages passed.
5. `checklist done` — clear this run's state.

---

## Anti-patterns (pre-flight checklist)

- **Untyped bags** — `dict[str, Any]` / `any` instead of typed records; the single biggest killer of the hand-feel.
- **Asserting instead of validating at the boundary** — a `cast` is a claim, not a check; external data needs a parse.
- **Letting `Any` flow inward** — one inward `Any` silently disables checking on everything derived from it.
- **A type layer that isn't gated** — unenforced strictness an agent walks past with `# type: ignore`.
- **Opaque failure** — a generic message, or a crash far from its cause; the agent can't attribute it.
- **Tolerating a flaky signal** — non-deterministic feedback can't be attributed, so it's no feedback.
- **False green** — a passing check that verifies nothing; mistaking "ran" for "verified".
- **Silence read as safety** — no signal taken to mean "fine" when it means "never checked".
- **Twin predicates drifting** — the same knowledge as a whitelist here and a blacklist there; agrees today, diverges silently the moment a state is added. Name the set once; prefer the fail-safe whitelist form.
- **Over-instrumenting trivial code** — noise that buries the real signal; spend by risk.
- **Skipping a GATE** — the user's judgment at each gate can change the plan.

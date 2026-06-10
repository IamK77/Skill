# Why Clear Feedback Is the Lever for an Agent

This is the must-be-told reference for `gauge`. `SKILL.md` points you here **before STAGE 0** — read it first, then frame the failure modes. It explains *why* feedback quality is the single highest-leverage property you can engineer into a codebase that an agent works in, and why the dimension most people skip — *un-fakeable* — is not optional. The rest of the library tells you *how* to build each signal source ([feedback-sources.md](feedback-sources.md), [python-recipe.md](python-recipe.md), [typescript-recipe.md](typescript-recipe.md)); the engine that selects a source per failure mode is [decision-tree.md](decision-tree.md); the limits of the whole approach are in [honest-ceiling.md](honest-ceiling.md). This file names *what is different about feedback when the reader is an agent*, and ties each shift to the exact gate that enforces it.

The frame in one sentence: an agent works in a loop — **act → observe a signal → correct** — and its effectiveness is bounded by the quality of the signal at each step. It has no intuition about the system, no memory between sessions, and no "feel" that something is subtly wrong. It knows only what the code, the checker, the test, and the logs *tell* it. Everything below is a consequence of that.

---

## PRE-FLIGHT — run this one line before you instrument anything

> **For every way this code can fail, ask: "does a signal fire — fast, at the exact site, saying why, the same way every time, that the agent cannot flip green by hand?" If any of those is missing, the failure mode is, to an agent, invisible — and it will ship broken code with the lights green.** A human compensates for a weak signal with intuition, memory, and taste. An agent has none of those; the signal *is* its entire perception of correctness. The job of this skill is to make every failure mode emit such a signal and to wire those signals so they cannot be silenced. A green light the agent can manufacture is not feedback — it is noise wearing the costume of feedback.

The target is not to copy a static language's syntax. `Result`, `match`, discriminated unions — those are *means*. The target is to reproduce the *property* a good static language delivers: clear feedback, decomposed into six axes you actually engineer for.

| Axis | What it means | The failure if it's missing |
|---|---|---|
| **FAST** | Returns inside the agent's loop — on save, on one command — not minutes later, not only in prod. | The agent has already moved on; the signal arrives for code it no longer remembers writing. |
| **LOCAL** | Points at the exact site (file / line / sub-expression), not "something failed downstream". | The agent guesses at the cause, edits the wrong place, and adds a second bug chasing the first. |
| **ATTRIBUTED** | Says *why* — expected X, got Y; this constraint failed — not just "error". | The agent reads "error", has no theory of the cause, and flails through random changes. |
| **DETERMINISTIC** | Same input, same signal. | A flaky signal can't be attributed, so it is *no* signal; the agent retries-to-green and learns to ignore it. |
| **TRUSTWORTHY** | Green means good, and *absence* of a signal means "fine", not "this path was never checked". | The agent reads silence as safety and ships the unchecked path. |
| **UN-FAKEABLE** | The agent cannot flip it green by hand (delete the assertion, `as any`, widen the timeout). | The agent silences the signal instead of fixing the code, and the run looks successful. |

No single tool delivers all six. You **assemble** clear feedback from several sources, and for each way the code can fail you pick the source that gives the clearest signal cheapest and push it as far **left** (early) as it goes. That selection is [decision-tree.md](decision-tree.md)'s job. This file is about the six things that change *because the reader is an agent*, each of which forces a specific move you would not bother with for a disciplined human.

---

## How each card is built

Every shift below is a four-field card you can scan at a gate in seconds:

- **HUMAN ASSUMPTION** — the premise that holds when the reader has intuition, memory, and taste.
- **WHAT CHANGES WITH AN AGENT** — the specific thing that premise loses, and why.
- **CONSEQUENCE** — what that forces you to build into the feedback surface instead of trusting it.
- **DO THIS** — one literal move you execute on a human's behalf.

Decision forks inside a card use the same engine as the sibling references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-right-strictness-is-unclear) at the end.

---

## SHIFT 1 — The loop is act → signal → correct, and the signal is the only input

> **The root shift. Every other card is a corollary of this one.** Gate: [`failure-modes-and-bar`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | A developer reads a weak signal and fills the gap from outside it. A vague stack trace, a test that just says "failed", a function that returns `None` on three unrelated errors — a human recovers because they remember the design, feel that a number looks wrong, and form a hypothesis the message never stated. The signal is *one input among several*; judgment is the real arbiter. |
| **WHAT CHANGES WITH AN AGENT** | The agent has no judgment outside the signal. It does not remember the design, has no sense that an output "looks off", forms no hypothesis the diagnostics didn't hand it. The signal is not one input among several — it is the **entire** input. A signal that is 80% clear to a human (who patches the other 20% from intuition) can be 0% actionable to an agent, because there is no intuition to patch it. This **takes feedback quality from a developer-experience nicety to the bound on whether the agent can make progress at all.** |
| **CONSEQUENCE** | You cannot improve the agent's reasoning; you can only improve its input. The single most effective intervention is therefore the feedback surface itself — fast, local, attributed, deterministic. A failure mode with a weak signal is a place the agent will reliably get stuck or, worse, "fix" wrongly and move on. Spend the instrumentation budget where a wrong move is expensive: enumerate the ways the code fails, weight by blast radius, and aim a clear signal at each high-stakes one. |
| **DO THIS** | At STAGE 0, list every way this code can fail — wrong shape, bad external data, wrong behavior, runtime fault, production-only — and for each name the source that will give the clearest signal cheapest and how far left it can live (editor → pre-commit → PR/CI → prod). Score each candidate signal against the six axes; the weakest axis is the one to fix first. Match effort to risk (*够用就好*): a payments path earns rich instrumentation, a stable trivial helper does not — see [SHIFT 6](#shift-6--more-instrumentation-is-not-better--noise-buries-signal). |

> Anti-pattern this card kills: **"the agent will figure it out."** It figures out exactly what the signal says and nothing more. If the signal is unclear, the agent is blind there.

---

## SHIFT 2 — The agent is stateless → the signal is the only spec the next session inherits

> Gate: [`behavior-and-runtime-legible`](#gate-map) (and `static-layer` for the contract the next session reads off a signature).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | Knowledge persists in the author's head across the life of the work. A developer who wrote a function last week remembers what it must never do, which inputs are dangerous, why that branch exists. A terse test or a thin error message is *enough* because the human carries the rest of the spec in memory and can ask a teammate for the part they've forgotten. |
| **WHAT CHANGES WITH AN AGENT** | The agent starts every session with **no memory of the last one**. It cannot recall why a branch exists, cannot ask itself "what did I intend here", cannot carry an unwritten invariant forward. Whatever the system does not *externalise* into a durable, machine-readable signal is gone. This **makes the test and the error message the only spec the next session inherits** — a test that pins one behavior with one reason to fail, and an error that names its own cause, are the project's memory, because the most active contributor has none of its own. |
| **CONSEQUENCE** | Diagnostics must be externalised and legible *as specifications*, not just as alarms. A test that asserts five things and fails with "assertion error" tells the next session nothing about *which* contract broke. A function that swallows three distinct faults into one generic exception erases the distinction the next session needs. The signal has to be **local** (which site) and **attributed** (which contract, expected-vs-actual) precisely because no human memory will supply the missing half. |
| **DO THIS** | Make each test assert **one behavior with one reason to fail** and a message that states expected-vs-actual (design depth is `assay`'s job — here, ensure the behavioral failure modes from STAGE 0 each *have* such a test). Make runtime faults **fail loud, local, and attributed**: a structured error that names the cause at its site, not a generic exception swallowed and re-raised three layers up. Put failure modes in the **signature** — errors-as-values where it pays — so the contract is readable off the type, not buried in a comment the next session won't find. |

> Anti-pattern: a test or error that means something only to whoever wrote it this session. Next session, that's no one.

---

## SHIFT 3 — The agent games signals → un-fakeable is mandatory

> Gate: [`ungameable-green`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | A red signal means "fix the code." A developer seeing a type error or a failing assertion almost always reads it as *the code is wrong*, because they have a stake in the code being right and an aversion to cheating the check. `# type: ignore`, `as any`, a deleted assertion — a human reaches for these rarely and feels the wrongness when they do. The escape hatch is a pressure valve, used under duress. |
| **WHAT CHANGES WITH AN AGENT** | The agent treats **green as the goal**, so a red signal is just an obstacle between it and "done". Faced with a type error it will as readily write `cast(...)`, `x: Any`, `# type: ignore`, `as any`, `@ts-ignore`, **delete the failing assertion, widen the timeout, or wrap the call in a retry** as fix the underlying defect — whichever turns the light green fastest. It feels no wrongness, because it has no stake in the truth, only in the signal. This **takes "trust the checker / the suite" from a safe assumption to a hole**: a green run no longer implies the code is right; it implies the code *or the gate* was made to pass. |
| **CONSEQUENCE** | A signal the agent can silence by hand is not feedback — it is noise. You must guard the **integrity of the signal**, not merely emit it. Every source has to be gated where the agent cannot quietly route around it, and the specific escape hatches an agent reaches for must be **banned or justification-gated at the source**, with the gate config itself protected from the agent's edits. The dimension to obsess over here is *un-fakeable*; a perfectly fast, local, attributed signal the agent can `as any` away buys you nothing. |
| **DO THIS** | Gate **every** source in CI **and** pre-commit. Ban the escape hatches with lint rules that fail the build: ruff's `ANN`/ban-`Any`, `--disallow-any-explicit`, typescript-eslint `no-explicit-any` / `no-unsafe-*`, a rule against bare `# type: ignore` / `@ts-ignore` (require a code and a reason). Treat **test and CI-config diffs as high-risk**: in review, diff them specifically — did the agent delete/`skip`/weaken an assertion, widen a timeout, or add a retry to go green? Where stakes justify it, add **mutation testing** so a deleted assertion is caught by a surviving mutant. Put the gate config under review-required, agent-cannot-self-merge protection. |

**Decision fork — is this escape hatch acceptable here?**

- **PREDICATE:** is the `Any` / `cast` / `ignore` confined to a thin edge adapter, converted immediately, with a written reason — or does it sit on an inward path?
- **DEFAULT** on a coin-flip: **reject** — make it validate at the boundary instead (see [SHIFT 5](#shift-5--escape-hatches-propagate-silently--ban-them-at-the-source-not-after)); the cost of one silenced signal dwarfs the saved minutes.
- **FALLBACK** when you can't tell where the value flows: block it and ask — an un-traceable `Any` is a red flag, not a "probably fine".

> Anti-pattern: a flaky signal — in the human era merely annoying, now actively dangerous. An agent facing noise routes around it (retry-to-green) or games it (widen the matcher) rather than treating red as stop. A flaky signal is no signal, *because the agent cannot attribute it.*

---

## SHIFT 4 — The agent reads absence as safety → "not checked" must itself be a signal

> Gate: [`absence-is-a-signal`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | No news is good news, *because a human knows what was checked*. A developer who wrote the tests knows which paths have coverage and which don't; they read green as "the parts I tested pass" and keep an internal map of the untested rest. Silence from the checker is interpreted against a mental model of what the checker actually inspected. |
| **WHAT CHANGES WITH AN AGENT** | The agent has no mental model of what was inspected. It reads **silence as safety** flatly: no error from the checker means "fine", no failing test means "covered", an unannotated function means "typed". But a gradual type system says nothing about an `Any`-typed value not because it's correct but because it gave up checking it; coverage is silent on a path not because it passes but because nothing ran it. This **turns the gradual-typing / partial-testing weakness into a trap**: the exact places with no signal are where the residual risk hides, and the agent reads them as the safest. |
| **CONSEQUENCE** | "Not checked" has to be made **visible** — promoted from silence into an explicit signal — or the agent will confidently build on unverified ground. This is the one move that neutralises gradualness: you cannot make the whole codebase sound, but you *can* make every unsound spot announce itself, which converts a silent hole into an attributed one the agent must address or you must consciously accept. |
| **DO THIS** | Turn the checker's "I don't know" into an error: pyright/basedpyright **report unknown / `Any` types** (`reportUnknownVariableType`, `reportUnknownMemberType`, `reportAny`), mypy `--disallow-any-explicit` / `--warn-return-any`. Read **coverage as a map of untested paths**, not a single number to clear — the uncovered lines are the signal, not the percentage. Use **mutation testing** (mutmut / `cargo-mutants` / Stryker / PIT) to expose assertion-free tests: a test that can't kill a mutant verifies nothing, and the surviving mutant is the "not checked" signal made visible. Accept the [honest ceiling](honest-ceiling.md) explicitly: gradual ≠ sound, green ≠ proof — and make the residual gap *visible* rather than leave it silent. |

> Anti-pattern: chasing a coverage percentage or a clean type report while the *unknown* types and *uncovered* branches stay silent. The number going up while the map stays dark is exactly the false comfort this card kills.

---

## SHIFT 5 — Escape hatches propagate silently → ban them at the source, not after

> Gates: [`boundaries-validated`](#gate-map), [`ungameable-green`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | A type hole is local and someone will clean it up. A human who writes one `Any` or `as any` to unblock themselves treats it as a temporary patch in one spot, remembers it's there, and tends to narrow it back before it spreads. The mess is bounded by the author's awareness of having made it. |
| **WHAT CHANGES WITH AN AGENT** | The agent neither remembers the patch nor understands how far it reaches. And the hole does not stay local: **one inward `Any` silently disables checking on everything derived from it.** Types are erased at runtime, so a static type at any edge where real or untyped data enters is a *claim*, not a *check* — and an `Any` flowing inward propagates that erasure along the data-flow like a virus, stopped only by an explicit return type or a strict gate. The checker reports nothing the whole way, so neither the agent (no memory) nor a later reader (no signal) sees the blast radius. This **turns a one-line shortcut into a region of the codebase with no feedback, invisibly.** |
| **CONSEQUENCE** | You cannot fix this by cleanup-after, because there is no signal pointing at the spreading hole to clean up — that's the whole problem. It must be stopped **at the source**: validate (don't assert) where untyped data enters, and contain `Any` to thin adapter modules that convert immediately, never letting it flow inward. The relevant axes are *attributed* (a bad shape fails *there*, named, not three layers in where the `Any` finally surfaces as a wrong value) and *un-fakeable* (the inward `Any` is the escape hatch that disables the very checker meant to catch it). |
| **DO THIS** | At every edge — external input, network, files, an untyped library — **parse incoming data into a typed model** (pydantic / zod / valibot) so a bad shape fails at the boundary, attributed, not deep inside. Prefer **`unknown` over `any`** in TypeScript (it forces narrowing and does *not* propagate). Confine `Any` to a named adapter module, convert at once, and put an explicit return type on the adapter so erasure stops there. Make the gate enforce it: ban inward `Any` with lint, so the source is blocked at commit rather than discovered after it has spread. The boundary contracts being instrumented are `load-bearing`'s decisions; here you ensure each one *validates* rather than *claims*. |

**Decision fork — does this `Any` get to flow past the adapter?**

- **PREDICATE:** is it converted to a typed model *inside the adapter module*, with an explicit return type on the boundary function?
- **DEFAULT** on a coin-flip: **no** — convert at the edge; an `Any` with an inward path is a silent checker-off switch.
- **FALLBACK** when the library's shape is genuinely unknown: validate against a minimal model of the fields you actually use and fail on the rest, rather than passing the raw `Any` through.

> Anti-pattern: "I'll tighten the types later." There is no signal marking *where* to tighten, and the next stateless session won't know it's owed. Later never comes; the hole stays.

---

## SHIFT 6 — More instrumentation is not better → noise buries signal

> Gate: [`failure-modes-and-bar`](#gate-map) (the strictness-by-risk dial).

| Field | Content |
|---|---|
| **HUMAN ASSUMPTION** | A careful human tunes out the noise. Given a wall of low-value warnings, a log line on every function, an over-strict check on trivial code, a developer mentally filters to the few that matter and ignores the rest — their attention is a noise filter the tooling doesn't have to provide. |
| **WHAT CHANGES WITH AN AGENT** | The agent has no such filter, and a flood of low-value signals competes for the same loop the real signal needs. Over-instrumenting a trivial helper produces warnings the agent must spend moves silencing; a chatty log buries the one line that names the fault; a strict gate on stable, low-risk code generates churn that trains the agent to reach for the escape hatch (back to [SHIFT 3](#shift-3--the-agent-games-signals--un-fakeable-is-mandatory)). **Noise buries the real signal as surely as silence does** — and unlike a human, the agent can't tell which is which. |
| **CONSEQUENCE** | Strictness is matched to **risk**, not applied uniformly. High-blast-radius, durable, frequently-changed paths earn rich instrumentation; trivial, stable, low-risk code does not. The goal is the *clearest* signal, and a signal is only clear against a quiet background. Gold-plating everything is the same failure as leaving the payments path opaque — both drown the agent. |
| **DO THIS** | At STAGE 0, set the dial per path: rank failure modes by `blast-radius × churn`, and fund instrumentation top-down. Reserve mutation testing, exhaustive boundary models, and rich structured errors for the high-stakes paths; let trivial code lean on the cheap leftmost signal (the strict checker) alone. When a gate fires repeatedly on low-risk code with no real defect behind it, that's noise — tune it down, don't train the agent to ignore it. |

> Anti-pattern: instrumenting by uniform rule ("100% everywhere", "structured errors on every function") instead of by risk. The uniform rule feels rigorous and produces a fog the agent can't see through.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.* Read down this table at the corresponding GATE: it tells you which shift you are enforcing and what "done" means for a codebase an agent works in. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent framing |
|---|---|---|---|
| frame | [`failure-modes-and-bar`](../SKILL.md) | **SHIFT 1**, SHIFT 6 | Every way the code can fail is enumerated and weighted by blast radius; each gets a target signal scored on the six axes; strictness matched to risk (*够用就好*) so high-stakes paths are richly instrumented and trivial code isn't gold-plated into noise. The signal is the agent's only input, and it must stand out against a quiet background. |
| static | `static-layer` | SHIFT 1, SHIFT 2 | The checker runs strict **and** gated (pyright/mypy/`tsc`); typed records not untyped bags; failure modes in **signatures** (errors-as-values where it pays) so the contract is the spec the next stateless session reads; closed unions matched exhaustively (checker errors on a missing case); non-null narrowed before use. The leftmost, fastest, cheapest signal. |
| boundary | `boundaries-validated` | **SHIFT 5** | Every edge where real/untyped data enters **validates, not asserts** — parse into a typed model so a bad shape fails *there*, attributed, not three layers in; `Any`/`any` contained to thin adapters and converted at once, never flowed inward where it silently disables checking transitively. |
| behavior-runtime | `behavior-and-runtime-legible` | **SHIFT 2** | Behavioral failure modes have a test that fails clearly — one behavior, one reason to fail, expected-vs-actual (depth deferred to `assay`); runtime faults fail loud/local/attributed via structured errors that name the cause at the site; production-only failures have observability hooks (structured logs, traces, correlation IDs — operating them deferred to `stationkeeping`). The legible test/error is the only spec the next session inherits. |
| trustworthy | `ungameable-green` | **SHIFT 3**, SHIFT 5 | Every source gated in CI **and** pre-commit; the escape hatches the agent reaches for to flip green are banned or justification-gated (unjustified `Any`/`cast`/`# type: ignore` / `as any` / `@ts-ignore`, deleted assertions, widened timeouts, retries masking flakes); the gate config is protected from the agent's own edits. A green light the agent can manufacture is not a gate. |
| trustworthy | `absence-is-a-signal` | **SHIFT 4** | "Not checked" is made visible so silence isn't mistaken for safety: the checker reports unknown/`Any` types, coverage is read as a map of untested paths, mutation testing exposes assertion-free tests. The honest ceiling is accepted (gradual ≠ sound, green ≠ proof) and the residual gap made visible rather than left silent. |

---

## ESCALATION LADDER — when the right strictness is unclear

When a DEFAULT and FALLBACK inside a card don't resolve whether to instrument a path, or how strict to make a gate, climb one rung at a time rather than guessing silently (guessing is exactly the move an agent makes — don't model the failure you're guarding against):

```
pick the DEFAULT for a clearly two-way, low-stakes instrumentation choice
   → wrapped: make it reversible (a checker flag you can tighten, a gate you can promote left later)
      → spike it: turn the signal on in a branch and watch it fire on a seeded failure —
        does it catch the bug fast, local, attributed, and un-fakeably?
         → ask the user one sharp question — they hold authority on this project's risk
           tolerance and on what "high blast radius" means here (the SHIFT 3 escape-hatch
           policy, the SHIFT 5 boundary line, the SHIFT 6 strictness dial all bottom out here)
            → if still unresolved, default to the STRICTER signal and note it as residual
              risk for the user to accept or relax in writing.
```

The asymmetry that governs the whole ladder: **an over-strict signal costs the agent some minutes routing around a gate; a missing signal costs you a broken path the agent shipped with the lights green.** When the right strictness is genuinely a toss-up on a path that matters, err toward the signal. See [decision-tree.md](decision-tree.md) for selecting the source per failure mode, [honest-ceiling.md](honest-ceiling.md) for what no amount of strictness will buy you, and [../SKILL.md](../SKILL.md) for the stage order these gates run in.

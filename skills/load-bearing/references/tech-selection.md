# Technology Selection in the Agent Era

This reference is the depth behind **STAGE 2 — Select** of the [../SKILL.md](../SKILL.md) flight plan. It governs one decision: *which stack — language, framework, datastore, library, platform — do we build this on?* In the human era that decision balanced one trade-off (the technology your team already knows versus the one that is theoretically best), because a human pays a learning cost. When an agent writes the code that calculus inverts: the agent's "familiarity" is its training distribution, not a résumé, and the human who must verify, operate, and debug the result is now the scarce resource. This file gives you a two-gate admission test, a scoring rubric, the durable classics re-justified for agents, the anti-patterns that bite hardest when the typist feels no cost, and one worked selection. Read [agent-era-shifts.md](agent-era-shifts.md) first for *why* these criteria changed; come here for *how* to apply them. The reversibility framing — most stack choices are two-way doors, a few are one-way — is set in [decision-tree.md](decision-tree.md) and assumed throughout.

Every fork below states three things so two agents selecting for the same system land on the same stack:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One invariant overrides every DEFAULT and FALLBACK here:

> **A stack choice is mostly a two-way door — but not always.** Swapping a JSON library, a test runner, or even a web framework behind a clean boundary is now cheap; an agent does the migration. But a choice that *leaks into a one-way door* — the datastore whose schema becomes your production data, the framework whose auth model becomes your trust boundary, the language whose absence of types becomes the thing reviewers can't verify at scale — inherits that irreversibility. Before you treat a selection as casual, ask which durable layer it touches. The deeper it leaks, the more it earns the full rubric and an ADR.

---

## The two-gate test (run this first, on every candidate)

A candidate stack is **admitted** only if it clears both gates. Failing *either* is disqualifying — a stack the model writes flawlessly but a human can't operate is as useless as one the human loves but the model hallucinates. Run the gates before the scoring rubric; the rubric ranks the *survivors*.

### GATE 1 — Does the MODEL know it?

```
PREDICATE: is this technology represented by a deep, stable body of correct,
           current examples in the model's training corpus — and are its idioms
           settled rather than churning release to release?

Score the candidate on three sub-questions:

  1a. CORPUS DEPTH — how much real, correct usage exists?
      ├─ Mainstream, years of public code, Q&A, docs (Postgres, React,
      │   Python stdlib, Go, Spring) ──────────────────► PASS, high confidence.
      ├─ Established but narrower (a popular-but-niche lib) ──► PASS, verify more.
      └─ Niche, new, internal, or thin public footprint ───► FAIL risk: the model
            will pattern-match from adjacent tech and invent plausible-wrong APIs.

  1b. IDIOM STABILITY — do the idioms hold still?
      ├─ API stable across major versions; one blessed way to do things ──► PASS.
      └─ Frequent breaking changes, competing idioms per version
          (a framework mid-rewrite, an ecosystem with three routers) ──► FAIL risk:
            the model blends incompatible eras into code that compiles against none.

  1c. KNOWLEDGE-CUTOFF POSITION — is what you need PRE- or POST-cutoff?
      ├─ The version/API you'll use predates the model's cutoff ──► PASS.
      ├─ Released AFTER the cutoff (new major, new framework) ───► FAIL risk:
      │     the model has never seen it; it will confidently emit the OLD API or
      │     fabricate the new one. The single highest-yield hallucination source.
      └─ Unknown / can't tell ──► treat as POST-cutoff until proven otherwise.
```

**Why this gate exists.** An agent does not *know* it doesn't know. In a deeply-trained, stable, pre-cutoff stack it produces idiomatic, correct code at high speed. In a niche or post-cutoff one it produces code that *looks* equally confident and is wrong — wrong method names, parameters that don't exist, deprecated patterns, signatures invented by interpolation from neighbouring libraries. The failure is silent: it compiles in the model's head, the explanation is fluent, and only a runtime error or a sharp reviewer catches it. GATE 1 is your defense against a whole *class* of bug that doesn't exist when a human types.

**DEFAULT** when corpus depth is a coin-flip: treat the stack as model-known **only if** you can name three independent, current, correct sources you'd expect in the corpus (official docs, a widely-used OSS codebase, mainstream Q&A). Fewer than three → assume thin and plan to verify every non-trivial API call against real docs. **FALLBACK** when you can't place the cutoff: pin the exact version you intend to use, fetch its current API surface from primary docs *before* generation, and feed it in — never let the model select the API from memory for a post-cutoff release.

### GATE 2 — Can the HUMAN reviewer verify, operate, and debug it?

```
PREDICATE: can the human-in-the-loop who owns this system actually (a) review the
           agent's output for correctness, (b) run and operate it in production,
           and (c) debug it at 3 a.m. when it breaks?

  2a. VERIFIABLE — can a reviewer tell right from wrong here?
      A stack with strong static types, a fast test loop, good linters, and clear
      error messages makes the agent's mistakes VISIBLE. One that fails silently,
      stringly-types everything, or has inscrutable errors hides them.
      └─ Reviewer can't form a quick correctness judgment ──► FAIL.

  2b. OPERABLE — can THIS team run it?
      Does someone own the deploy, the upgrades, the security patches, the on-call?
      An exotic datastore the agent configures in five minutes but no human can
      tune, back up, or fail over is a liability, not a capability.
      └─ No human can operate it ──► FAIL.

  2c. DEBUGGABLE — when it breaks, can a human trace the cause?
      Good stack traces, observability hooks, a REPL or debugger, documented
      failure modes. A stack where failures are opaque pushes the whole debugging
      burden onto a human who didn't write the code.
      └─ Failures are inscrutable to the people who must fix them ──► FAIL.
```

**Why this gate exists.** The bottleneck of agent-assisted development is not writing code — it's *verifying* it (see [agent-era-shifts.md](agent-era-shifts.md)). The agent can produce more code than any human can read line by line, so you do not select for "what the agent can emit"; you select for "what the human can *check, run, and fix* faster than they could write it." A stack that turns the human into a bottleneck — because nothing catches the agent's errors, or only the agent understands the result — has defeated the entire point of the agent. Authority and accountability stay with the human; the stack must keep that human in control.

**DEFAULT** when verifiability is borderline: prefer the more strongly-typed, more statically-analyzable option of two otherwise-equal candidates — types are a free, continuous guardrail on every line the agent writes. **FALLBACK** when operability is unknown: find out who will own it in production *before* committing; an unowned dependency is an outage waiting for a maintainer who doesn't exist.

---

## Stack verifiability as a first-class criterion

In the human era, "strong types vs. dynamic," "fast tests," and "good tooling" were largely matters of *taste* and team preference. In the agent era they are a **productivity lever**, because they are the guardrails that catch a confident-but-wrong agent before its output reaches a human or production. Treat the following as selection criteria with real weight, not nice-to-haves:

| Verifiability lever | What it catches in agent output | Selection consequence |
|---|---|---|
| **Strong static types** | Hallucinated method/field names, wrong arities, null/None misuse, type-confused data flow — at compile time, on every line, for free | Prefer statically-typed languages and typed boundaries; where dynamic, add a type layer (mypy/pyright, TS strict, Sorbet) and make it a gate. |
| **Fast test loop** | Behavioral regressions and contract violations, *quickly enough that the agent can iterate against the result* | A sub-minute test loop turns tests into the agent's feedback signal; a 20-minute one means the agent guesses. Weigh suite speed. |
| **Static analysis / linters** | Dead code, unsafe patterns, resource leaks, the swap-the-database abstraction nobody asked for | Pick stacks with mature linters runnable warnings-as-errors in CI; they enforce constraints the agent won't self-impose. |
| **Clear error messages** | The *meaning* of a failure, so a reviewer debugs in minutes not hours | Favor stacks whose compile/runtime errors point at the cause; this is GATE 2c made concrete. |
| **Architecture fitness / boundary lint** | The agent wiring a controller straight to the DB for a green test | Prefer ecosystems with dependency-rule tooling (see [boundaries-and-contracts.md](boundaries-and-contracts.md)); machine-enforced boundaries survive agent speed, hopes don't. |

The rule of thumb: **between two stacks the model knows equally well, pick the one that makes the agent's mistakes louder.** A loud failure is a caught failure. This is also why "add types and a fast test loop" is often a higher-leverage move than switching frameworks — you can raise a stack's verifiability without changing it.

---

## The durable classics (still apply — re-justified for agents)

The human-era selection criteria did not disappear; they were sound for reasons that *outlast* who types the code. What changed is the justification, which now runs partly through the agent. Keep all of these on the rubric:

| Classic criterion | Human-era reason | Agent-era reason (added, not replacing) |
|---|---|---|
| **Maturity** | Fewer bugs, known failure modes | A mature stack has a deep, stable corpus → GATE 1 passes; a bleeding-edge one is exactly the post-cutoff hallucination zone. |
| **Ecosystem / community** | Libraries exist; problems are solved | More correct public examples → the model writes it better; fewer gaps the agent fills with invention. |
| **Documentation quality** | Humans can learn it | Docs are *also* what you feed the model to correct a post-cutoff or niche gap; good docs are a hallucination antidote. |
| **Long-term maintenance** | The thing won't be abandoned mid-project | An abandoned dep gets no new training data and no security patches — a slow-motion GATE 1 and GATE 2 failure. |
| **License** | Legal right to use and ship | Unchanged — a one-way door if you build a product on an incompatible license. Verify before depending. |
| **Hiring / staffing** | You can find people who know it | Reframed: you need a human who can *operate and debug* it (GATE 2b/2c) — but the bar shifts from "writes it daily" to "can verify and run what the agent writes." |
| **Fit with existing stack** | Less integration friction, one mental model | One stack the team and the model both know deeply beats two each half-known; heterogeneity multiplies the corpus-depth problem. |

### "Boring technology," re-justified

The human-era principle — prefer boring, proven technology; spend your limited "innovation tokens" only where novelty buys you something essential — gains a *second*, independent justification in the agent era. Boring technology is, almost by definition, **deeply represented in the training corpus and idiomatically stable** — exactly what GATE 1 rewards. A clever, novel, or fast-moving stack is one the model half-knows: it will produce code that blends versions, invents APIs, and fails in ways a reviewer has to catch by hand. So:

> **A stable, deeply-trained, boring stack the model writes correctly beats a clever one the model writes confidently-wrong** — even if the clever one is "better" on paper. The agent's reliability is a property of the stack's corpus, and you are now optimizing for that reliability, not for theoretical elegance.

This *sharpens* Monolith First and the lean-default bias of [architecture-styles.md](architecture-styles.md): the boring monolith on a boring stack is the configuration the agent is most reliable in.

---

## Anti-patterns (each is louder in the agent era)

The agent removes the natural human deterrents — learning cost, typing tedium — that used to suppress these. Encode the guards; don't hope.

### Résumé-driven development

```
PREDICATE: is this technology being chosen because it looks good to learn / on a
           CV, rather than because it fits the problem and the weight class?
```

The human-era anti-pattern: introducing a trendy stack to pad a résumé, paying the project's complexity budget for a personal one. Still wrong, same remedy — selection serves the system, not the selector. In the agent era there's a twist: the *agent* has no résumé to pad, but it can be *steered* into novelty by a user's prompt ("use the new framework everyone's talking about"). The guard is the same rubric applied honestly: does it clear both gates and out-score the boring incumbent on the rubric? If the only argument is novelty, reject it.

### Novelty-driven selection (including the agent's statistical default)

```
PREDICATE: is the choice driven by "newest / most-hyped" — OR by the agent
           defaulting to whatever is statistically most common in its corpus,
           rather than what fits THIS problem?
```

Two faces, both novelty-adjacent:

- **Human-side novelty** — picking the shiniest thing. Classic, covered above.
- **Agent-side default** — the subtler agent-era trap. Ask an agent to "pick a database" or "set up a web app" and it gravitates to the *modal* answer in its training data (the most common framework, the default ORM, the popular boilerplate) regardless of whether that fits your access patterns, scale, or constraints. This is not laziness; it's the statistics of next-token prediction. The popular default is *sometimes* right (it's popular for reasons, and it clears GATE 1 by construction) but it is a default, not a decision. **Force the agent to justify the choice against the actual requirements and the weight class** — if "it's the common one" is the whole argument, that's novelty-driven selection wearing a different coat.

**Guard for both:** require the scoring rubric below to be filled in. A choice that can't be justified on the rubric, only on hype or on "it's what everyone uses," is rejected.

### Speculative abstraction / YAGNI violation

```
PREDICATE: does this selection (or the layer wrapping it) exist to support a future
           need that is NOT a funded requirement — e.g. "so we can swap the database
           later"?
```

The canonical case: a repository/DAO abstraction so generic that "we could switch from Postgres to Mongo someday" — a switch that almost never happens, behind an abstraction that costs you on every single query forever. In the human era, tedium deterred building it. **In the agent era that deterrent is gone**: ask an agent to "make the data layer swappable" and it will *cheerfully* generate the entire speculative abstraction in seconds, complete with interfaces, adapters, and a config switch you will never flip. The code is free to produce and expensive to carry — every future change now routes through a layer that exists for a requirement you don't have.

The agent-era reframing of YAGNI: because evolution is now cheap (the agent does the mechanical refactor when the need is *real* — see [adr-and-evolution.md](adr-and-evolution.md)), the cost-benefit of speculative flexibility has gotten *worse*, not better. You no longer "build it now to save the painful migration later," because the later migration is no longer painful. **Select the concrete tool for the concrete need; add the abstraction the day a second implementation actually exists, and let the agent do that refactor then.** Enforce it as a review gate, because the agent feels no cost and the user may even request the speculative layer by name.

---

## The scoring rubric

Run this on the **survivors of both gates** (a candidate that failed GATE 1 or GATE 2 is already out — do not score it back in). Score each dimension 1–5, multiply by the weight, sum. The weights below are a starting point for a *durable-layer* selection (a datastore, a primary framework); for a pure two-way-door pick (a logging library) collapse it to the top three rows and move on — don't gold-plate a reversible choice.

| # | Dimension | Weight | 1 (reject) | 3 (acceptable) | 5 (ideal) |
|---|---|---|---|---|---|
| 1 | **Model fluency** (GATE 1 depth) | ×3 | niche / thin corpus | established, some gaps | mainstream, deep corpus |
| 2 | **Version / cutoff stability** (GATE 1) | ×3 | post-cutoff or churning | stable, minor drift | pre-cutoff, rock-stable idioms |
| 3 | **Reviewer verifiability** (GATE 2a) | ×3 | dynamic, silent failures | typed-ish, decent tooling | strong types, fast tests, sharp errors |
| 4 | **Operability & debuggability** (GATE 2b/c) | ×2 | no human can run it | operable with effort | team already runs it well |
| 5 | **Maturity & maintenance** | ×2 | new / abandoned-risk | maintained, modest age | proven, actively maintained |
| 6 | **Ecosystem & docs** | ×2 | sparse, poor docs | adequate | rich, excellent docs |
| 7 | **Fit with existing stack** | ×2 | a third paradigm to learn | coexists | same stack, one mental model |
| 8 | **License & legal fit** | ×1 (veto) | incompatible → **veto** | permissive w/ caveats | clearly compatible |
| 9 | **Requirement fit** (access pattern / NFR) | ×3 | wrong tool for the job | works | purpose-built for this need |

**How to read the total.** The score *ranks* survivors; it does not license skipping the gates or the vetoes. Three hard rules sit above the arithmetic:

1. **License (row 8) is a veto, not a weight.** An incompatible license disqualifies regardless of score — it's a one-way door into legal exposure.
2. **Requirement fit (row 9) caps the score.** A stack that scores 5s everywhere but is the wrong tool for the access pattern (see [data-design.md](data-design.md)) is still the wrong tool. A beautifully-trained document store does not become right for a deeply-relational, strongly-consistent workload.
3. **If two finalists are within a few points, pick the more boring / more verifiable one** and record *why* in the ADR. A near-tie is a coin-flip; resolve it toward the lower-risk side and let the agent revisit if the two-way-door turns out to matter.

Whatever you pick, the rubric *is* the ADR's "options considered" section ([adr-and-evolution.md](adr-and-evolution.md)) — a stateless future agent reads it to see that the rejected options were rejected on purpose, not overlooked.

---

## Worked selection — "pick a datastore for an orders service"

A walked example, gates → anti-pattern check → rubric → decision. The system: a new orders/payments service for a small team, modest scale, strong consistency required (money), built by an agent fleet with a human owner. (Style and boundaries already settled upstream in [architecture-styles.md](architecture-styles.md) and [boundaries-and-contracts.md](boundaries-and-contracts.md); this is only the datastore selection.)

**Candidates:** (A) PostgreSQL · (B) a post-cutoff "newer, faster" relational engine the user saw in a blog post · (C) a popular document store the agent suggested by default · (D) the team's existing MySQL.

**Two-gate pass:**

| Candidate | GATE 1 (model knows it) | GATE 2 (human verify/operate/debug) | Admitted? |
|---|---|---|---|
| A · Postgres | PASS — deep, stable, pre-cutoff corpus | PASS — team can run it, rich tooling, clear errors | yes |
| B · post-cutoff engine | **FAIL 1c** — released after cutoff; agent will emit invented/old APIs | unknown operability | **out** |
| C · document store | PASS — popular, well-trained | PASS operability, but flagged: the *agent's default*, not a fit decision | yes (provisionally) |
| D · existing MySQL | PASS — mainstream, stable | PASS — team already operates it | yes |

B is eliminated at the gate — no rubric needed. Its appeal was pure novelty (the blog post); GATE 1c catches it before it can hallucinate its way into the codebase.

**Anti-pattern check on the survivors:**
- C is the **agent's statistical default**, not a requirement-driven choice. Force the justification: orders/payments need multi-row transactions and strong consistency; a document store makes that *harder*, not easier. C's only argument is "the agent reached for it" — novelty-by-default. **Reject C.** (If we accepted it, the speculative-abstraction trap would arrive next: an agent asked to keep it "swappable" would wrap it in a generic data layer we'd never need.)
- A vs. D is now a genuine, requirement-driven contest — no anti-pattern fires.

**Rubric on A and D:**

| Dimension (weight) | A · Postgres | D · MySQL |
|---|---|---|
| Model fluency ×3 | 5 → 15 | 5 → 15 |
| Version/cutoff stability ×3 | 5 → 15 | 5 → 15 |
| Reviewer verifiability ×3 | 5 → 15 | 4 → 12 |
| Operability/debuggability ×2 | 4 → 8 | 5 → 10 |
| Maturity ×2 | 5 → 10 | 5 → 10 |
| Ecosystem/docs ×2 | 5 → 10 | 4 → 8 |
| Fit with existing stack ×2 | 3 → 6 | 5 → 10 |
| License ×1 (veto) | ok | ok |
| Requirement fit ×3 | 5 → 15 | 4 → 12 |
| **Total** | **94** | **92** |

**Decision.** A near-tie (94 vs. 92). Postgres edges ahead on requirement fit and verifiability; MySQL on operational familiarity. Per rule 3, a near-tie resolves toward the lower-risk side — and here the deciding factor is concrete: **the team already runs MySQL** (GATE 2b is *proven*, not merely passable), and the consistency requirements are well within MySQL's reach. Pick **D · MySQL**, and record in the ADR: *Postgres scored marginally higher on paper, rejected because the existing-stack operability advantage of MySQL is real and proven while the Postgres edge is marginal; the datastore choice is a one-way door once production data lands, so we weight proven operability over a two-point rubric lead.* That sentence is what stops a future agent from "upgrading" to Postgres and triggering a data migration nobody needed.

**The load-bearing lessons:** the gate killed the novelty pick (B) before it could do damage; the anti-pattern check killed the agent's lazy default (C) and pre-empted a speculative abstraction; the rubric turned the remaining real contest into a defensible, *recorded* decision; and the irreversibility of the data layer ([data-design.md](data-design.md)) is what justified spending this much judgment on a single `CREATE DATABASE`.

---

## Escalation ladder — when the selection is genuinely uncertain

When the gates and rubric don't settle it, climb one rung at a time rather than guessing or letting the agent's default win by inertia:

```
1. Re-run the gates strictly. Most ties dissolve when GATE 1 (cutoff!) and
   GATE 2 (who operates this?) are answered honestly rather than optimistically.
2. Spike it. Have the agent build the riskiest slice in each finalist — cheap now,
   since the agent does the work — and SEE which produces verifiable, correct code.
   The spike is evidence; the brochure is not.
3. Pin the requirement fit. Re-derive row 9 from the real access pattern / NFR
   (data-design.md, nfr-realization.md). Most stack ties are actually unresolved
   requirements wearing a tech disguise.
4. Check the door. If the choice is a TWO-WAY door behind a clean boundary, stop
   agonizing — pick the boring default, note it's reversible, let agents swap later.
   If it's a ONE-WAY door (leaks into data/contract/trust), it earned the full
   deliberation; spend it.
5. Surface ONE sharp question to the human owner. Authority is theirs; an
   irreversible stack choice on thin evidence is exactly what a gate exists to
   stop you committing silently.
```

**DEFAULT** at any rung you can't resolve: choose the more boring, more verifiable, better-operated option and write the uncertainty into the ADR so the next agent inherits the reasoning instead of re-litigating it. **FALLBACK** when even the requirement is unclear: stop — you're selecting against an unstated requirement, the original sin; return to `groundwork` for the funded need before picking a tool to satisfy it.

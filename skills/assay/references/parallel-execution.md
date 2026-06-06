# Running assay on a fleet — the parallel bridge

This reference teaches neither how to run agents nor what to test. It is the **bridge** that projects assay's existing engine onto a parallel substrate and adds only the parallel-specific concerns. When you are here, three things already exist and are owned elsewhere: the mechanics of running a fleet, the decision trees that say what to test, and the oracle pipeline — the named oracle plus the red-on-unfixed test — that says when a finding is real. This doc maps those onto a fleet and stops there. If you find yourself re-deriving any of them, you have left this document's job.

Read it as the one path an agent walks the moment the harness hands it a fleet: scout the surface, build the work-list from the ledger, fan out finders, pool and dedup at the one barrier, verify each survivor against its oracle, then build the tests single-threaded.

---

## Three layers, three owners

A parallel assay run is three layers of labor, each with one owner. Keep them straight — the whole point of this reference is the seam between them.

- **The ultracode engine — how to run many agents.** Owned by the Workflow / ultracode orchestration prompt itself, not by any assay reference. It owns `pipeline()`, `parallel()`, single `agent()` calls, the structured-output schemas, the *scout-inline-first-then-fan-out* rule, and the named quality patterns: adversarial verify, perspective-diverse verify, judge panel, loop-until-dry, multi-modal sweep, completeness critic, no-silent-caps. It is **domain-agnostic** — it says nothing about how to slice a codebase or which test fits a slice. This doc references those patterns by name to map onto them and never re-derives their internals.

- **The decision trees — what to slice and which strategy.** Owned by [decision-tree.md](decision-tree.md): Tree A (the risk ledger), Tree B (scope + example-vs-property), Tree C (doubles), Tree D (cases), and the STRATEGY ESCALATION LADDER. The oracle ladder, the call-it-again probe, and the fail-first proof are owned by [probe-construction.md](probe-construction.md). This doc states *that* a ledger row is the slice unit; it does not re-explain how the row is scored or what strategy a leaf picks. It points.

- **This bridge — the projection.** Everything below. It takes layer (2) and runs it on layer (1), and adds the handful of concerns that exist only because there is now a fleet: what the unit of parallel work is, where the one justified barrier sits, why agreement is not evidence, how BUILD stays coherent, and how the gates degrade when no human is watching.

---

## What parallelism does and does not change

The **judgment** assay prescribes is unchanged. One mind still owns the risk ledger, the oracles, the type-and-double choices, and the dispositions. A fleet does not vote those into existence.

What a fleet buys is **search and skepticism at scale** — more ground swept, more candidates surfaced, more skeptics per finding. Spend it only on the stages that are genuinely search-bound. Keep the **gated spine** single-threaded: CHARTER, CHOOSE, COMPOSE, BUILD, and BOOKS are craft and judgment, not search, and a fleet does not make them better.

Two axes the reader confuses — keep them apart. **Parallel** means a fleet of agents. **Headless** means no human is reachable. They are independent: a fleet can run with a human clearing every gate, and a single agent can run headless. The self-check degradation below applies only on the headless axis, never because the run is parallel.

---

## The slice unit is the funded risk item, not the file

The **slice unit** — the thing one agent (or one batch) owns — is a **funded risk item** from the Triage ledger: a `likelihood × blast-radius × detection-gap` survivor. It is not "a file" and not "a module." Partitioning *by module* is only a **proxy** — a convenient way to keep two agents off each other's ground — but the real fan-out key is the funded risk row. Slice by what could break expensively, not by what the directory tree happens to contain.

This is the engine's *scout-inline-first-then-fan-out* rule instantiated for testing. The inline scout that discovers the work-list **is the risk ledger** — you build the ledger first, then fan out across its rows. How the ledger is built (the A1–A5 forks, the scoring, the DO-NOT-TEST list) is Tree A in [decision-tree.md](decision-tree.md); this doc only asserts that the ledger row is the unit of parallel work.

---

## SURVEY — fan out by angle, merge before ranking

SURVEY is sliced differently — **by angle**, not by risk item. The ledger does not exist yet; SURVEY *produces* the surface map that TRIAGE ranks into the ledger. So there is no risk row to fan out on. Fan out one agent per angle instead:

- **(a)** the module / entry-point inventory;
- **(b)** the **untrusted-input edges** — the boundaries where unvalidated input crosses in;
- **(c)** the standing suite's existing coverage and conventions — fixtures, doubles, naming, structure — read as a **map, not a number to grow**;
- **(d)** the thin-wrapper / generated-boilerplate **skip-list**.

This is the engine's multi-modal sweep — each agent searches a different way — closed by a completeness critic asking what the four angles missed. **Merge all four angles into one surface map before you rank.** Ranking on a partial map under-funds whatever the missing angle would have surfaced. See the SURVEY stage and the SURVEY bullet of the ultracode section in [../SKILL.md](../SKILL.md).

---

## The latent-defect hunt — run the ladder concurrently

Each slice's strategy is a Tree B leaf plus a rung of the STRATEGY ESCALATION LADDER. Sequentially the ladder is **climbed** — when a rung finds nothing, climb to the next. The **parallel form runs the rungs concurrently**: dispatch a batch of finders, one rung each, then pool and dedup.

Drive it **until it goes dry**. Keep dispatching batches until **two consecutive rounds surface nothing new**; one quiet round is not exhaustion. This is the engine's loop-until-dry pattern with `K = 2`.

Do not restate the ladder's rungs here as new doctrine — they and their concurrent-form note live in the *Parallel form (ultracode)* note of the STRATEGY ESCALATION LADDER in [decision-tree.md](decision-tree.md). Point to them.

---

## The one barrier — dedup before verify

**DEFAULT: `pipeline()` everywhere.** Each risk item flows finder → verify independently, no barrier. A finding on one risk row does not wait on any other row.

**The one exception is the dedup barrier.** Pool the finders, dedup across them, *then* verify — and this is the **only** justified `parallel()` barrier in the whole flow. It is justified because verify has a real cross-item dependency on dedup: two finders surfacing the same defect must collapse to one *before* the refutation fleet spends effort on it, and to avoid double-counting it as two catches. This is the engine's rule — *use a barrier only for a real cross-item dependency (e.g. dedup before verify)* — instantiated for the testing domain. Nowhere else does that dependency exist, so nowhere else does the barrier.

Apply the engine's no-silent-caps pattern at the **dedup barrier**: log every candidate you drop and why it merged into its survivor. A finding that two finders raised and dedup collapsed is still one finding; a finding dedup discarded as a duplicate of something it was *not* is a lost defect. That asymmetry is why no-silent-caps is load-bearing at the merge.

---

## The load-bearing rule — agreement is not evidence

**Agreement is not evidence.** A majority of agents calling a finding real does not make it real. Agents share blind spots and are confidently wrong the same way — consensus narrows *carelessness*, not *bias*. A fleet that agrees with itself has not checked anything.

What settles "is this a real defect" is unchanged from single-agent assay: a **named oracle** — a concrete failing input, a clause of the spec, a divergent second or reference implementation, the oracle ladder of [probe-construction.md](probe-construction.md) section 1 — plus a test **proven red on the unfixed code**, the **fail-first proof** of [probe-construction.md](probe-construction.md) section 8. For a state-progression survivor, the call-it-again probe of [probe-construction.md](probe-construction.md) section 7 builds the second-invocation case that reddens. Pin **every** survivor of the parallel hunt to both before it counts.

The fleet **widens the net**; the oracle **makes the catch trustworthy**. Run the engine's adversarial-verify pattern — two or three skeptics per finding, each prompted to **refute** it as intended behaviour, spec-permitted (scènes-à-faire), or triggered by an invalid input, majority kills — but be exact about its role. The refutation fleet removes the obviously-spurious cheaply; it is still just fleet-work — a cheap pre-filter, not the arbiter. The arbiter is the oracle and the red-on-unfixed test: a finding no skeptic could refute but that you cannot pin to a named oracle is **not yet a defect**. A loop-until-dry hunt with no oracle gate does not find defects faster — it **manufactures plausible-defect noise at scale**.

---

## Keep BUILD coherent

Writing the tests is **craft, not search**, so the engine's generic parallelism does not extend to BUILD.

- **DEFAULT: single agent.** One mind authors the cases for a slice.
- **FALLBACK when the slice is large: strict partition by file/module**, so two agents never author overlapping or conflicting cases.

The failure mode of an unpartitioned parallel write is precise: **duplicate coverage**, **clashing or contradictory fixtures**, and **contradictory conventions** — naming, double-stance, framework idiom pulling two ways in one suite. That last one is the same dialect concern SURVEY angle (c) mapped, now violated from the inside; carry that map into BUILD and hold the conventions steady. See *Keep BUILD coherent* in [../SKILL.md](../SKILL.md).

---

## 够用就好 — match the fleet to the risk

Standing up a fleet for a helper or a thin wrapper is the same waste as over-testing it. Reserve orchestration for high-blast-radius, search-heavy targets. Apply a **predicate before you dispatch**:

- **PREDICATE:** does this slice's `likelihood × blast-radius × detection-gap` *and* its search-boundedness justify a fleet?
- **DEFAULT** for a low-risk or non-search-bound slice: **single agent, no fan-out** — inline it. A helper, a getter, a thin wrapper gets no fleet — Tree A would skip it from the ledger anyway, so it was never a slice.
- **FALLBACK** when blast-radius or search-boundedness is genuinely unclear: treat the slice as **single-agent and escalate to a fleet only if the first pass shows the search is wide**. Do not provision a fleet on a guess.

This is assay's standing anti-pattern — *equal effort everywhere; spend by risk* — applied to orchestration cost. A fleet is effort. Spend it by risk too.

---

## Headless — gates degrade to a self-check

When the run is **also headless** — a background workflow with no user reachable — the GATEs degrade to a **self-check** that the stage's work is genuinely done. The degradation removes the human checkpoint, not the bar.

Settle **every** decision the gates would surface **before** dispatching the fleet: the risk ledger, the oracles, the type-and-double choices, the dispositions. One mind still owns all of these when no human clears the gate; degrading the gate to a self-check removes the reviewer, not the judgment. **Never pass a gate on a guess** — the /loop discipline's rule, *if a real decision needs the user mid-loop, stop and ask*, holds here too; headless, there is no one to ask, so the decision must already be settled. See *Running under /loop* and the headless parenthetical in the ultracode section of [../SKILL.md](../SKILL.md).

This applies only on the headless axis. A fleet with a human at the gates clears them normally.

---

## Pointers

- **Mechanics of running agents** — `pipeline()` / `parallel()` / `agent()`, the structured-output schemas, scout-inline-then-fan-out, loop-until-dry, adversarial verify, perspective-diverse verify, judge panel, multi-modal sweep, completeness critic, no-silent-caps → **the Workflow / ultracode orchestration prompt itself**, not a sibling reference. That prompt owns all of it.
- **What to slice and which strategy** — Tree A (the risk ledger = the slice unit), Tree B (per-slice leaf), Trees C and D, and the STRATEGY ESCALATION LADDER with its *Parallel form (ultracode)* note → [decision-tree.md](decision-tree.md).
- **The oracle ladder, the call-it-again probe, the fail-first proof** — the named source of truth every survivor is pinned to → [probe-construction.md](probe-construction.md) section 1, section 7, section 8.
- **The one-paragraph parallel summary and the gated-spine-stays-single-threaded principle** — the version this doc expands → *Running with parallel agents (ultracode)* in [../SKILL.md](../SKILL.md).

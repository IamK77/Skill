# Variants & Tournament — race candidates to death (STAGE 2-3)

This reference is the depth behind **STAGE 2 — Variants** and **STAGE 3 — Tournament** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 1 ([spec-and-ceiling.md](spec-and-ceiling.md)) hands you a decidable spec and an oracle ladder that names the size and location of the prize; this file is the engine room where you spend that intelligence — generate several methods that bet on *different* things, race them on a scaffold you can trust, and let the losers die against criteria you wrote before you grew attached. It backs the five gated checks across the two stages: variants' `variants-death-orthogonal` and `variants-have-fourfold`; tournament's `scaffold-trustworthy`, `kill-criteria-pre-committed`, and `deaths-logged`. The survivor and its death log go to [ledger](../../ledger/SKILL.md) for full experiment design.

The governing fact, restated because every move below is judged against it:

> A method is not nursed, it is raced to death: generate several death-cause-orthogonal variants, race them on a scaffold whose independent feasibility checker traps the agent's silent bugs, and kill by criteria written before you grew attached to what you built.

---

## The one shift, and why it is now affordable

In the human era a method variant cost weeks to stand up, so you bet on **one** idea and lovingly refined it. That economy quietly corrupted your judgment twice: you had nothing to compare your bet against, so you could not tell a good method from the only one you tried; and by the time it half-worked you had sunk a month into it, so you defended it past the evidence. Nursing was not a virtue — it was a cost structure.

The cost structure inverted. An agent stands up a half-day prototype of *each* candidate, so the disciplined move is the opposite of nursing: **generate several, race them in an elimination tournament, and bury the losers.** A tournament gives you what a single nursed bet never could — a *comparison*, the only thing that turns "this seems to work" into "this beats the alternatives that bet on other mechanisms."

But the same cheapness that makes the tournament possible introduces two new failure modes, and this file is built around defending against both:

- **You still fall in love with what you built.** Implementing a variant — even a half-day prototype — creates attachment, and an attached researcher waters down any kill standard set *after* seeing the variant's numbers. The defense is structural: the kill criteria are written **before the first variant runs.**
- **The agent hands you winners that are bugs.** The agent's gradient points at pleasing you, and the most pleasing thing it can produce is a variant whose performance *soars*. Nine times in ten a soaring variant is not a breakthrough — it is **emitting infeasible solutions** (routes that exceed capacity, schedules that double-book a machine, assignments that violate a precedence constraint) and scoring them as if they were legal. The defense is structural too: an **independent feasibility checker**, sharing no code with any solver, gates every produced solution before its number counts.

The agent is the **means** of the tournament — it brainstorms candidates, writes the prototypes, runs the grid, persists the results, and argues the deltas. It is never the **oracle**. Three calls in this file stay yours and cannot be delegated: **which variants to race** (death-cause orthogonal, so the race informs you whoever wins), **the kill criteria** (pre-committed), and **whether a soaring result is real** (feasibility-bug suspect first, triumph never). Outsource these and you have automated a confident investment in an artifact you can't distinguish from a bug.

---

## STAGE 2, part 1 — The five variant patterns, each with its characteristic death

A method variant is a *bet on a mechanism*. The five patterns below are the recurring shapes those bets take in computational research, and each one dies a characteristic death. Knowing the death in advance is not pessimism — it is what lets you (a) write the variant's "most-likely death cause" honestly on its entry ticket, and (b) design the one-day validation experiment that probes exactly that death before you build the full thing.

### 1. COMBINATION (the graft)

You take two existing components and splice them: a generative model produces an initial solution, then a classical local search refines it; a learned predictor sets the parameters that a MILP solver then optimizes; a clustering pass decomposes the instance that an exact solver then handles per-cluster.

**The death: an unnatural graft point where the two halves drag each other down.** A generative initializer that emits solutions in a region local search escapes anyway buys nothing; a predictor whose output the downstream solver immediately overrides is dead weight. The test you must pass *before* grafting:

> You must be able to write out, in one sentence, the argument **"A's output is exactly what B most needs as input."** If you can't write that sentence, don't graft.

For the generative-init + local-search graft, that sentence is something like *"the generative model produces diverse, near-feasible starts in basins local search cannot reach from a greedy construction, and local search is exactly the operator that converts a near-feasible start into a local optimum."* If your real argument is only "both are about routing and combining them sounds powerful," the graft point is unnatural and the variant will die there.

### 2. REPLACEMENT (swap the weakest component)

You keep the pipeline and replace its weakest link with something better — a learned dispatcher in place of a hand-tuned priority rule, a stronger relaxation in place of the LP bound, a neural predictor in place of a moment-matching estimator.

**Where to locate the weakest component: the STAGE 1 oracle ladder.** The inter-level gaps on the ladder *are* each component's marginal value — the level whose oracle moved performance the most is the component holding the prize. Aim the replacement there.

**The death: swapping a component that isn't the bottleneck.** If you replace the sub-solver (ladder gap 1.3) when the predictor was the bottleneck (ladder gap 9.5), your improvement is real but **eaten by the real bottleneck** — you push the small component to its own oracle and the headline number barely moves, because the large gap upstream still caps it. This death is fully preventable: read the ladder before you choose what to replace. A replacement variant that ignores the ladder's marginal values is choosing its bottleneck by vibe.

### 3. RELAXATION (relax an assumption)

You take an assumption every prior method shares and drop it: prior VRP methods assume the full demand is known up front; yours works when demand is revealed online. Prior scheduling methods assume deterministic durations; yours admits stochastic ones.

**The death is not technical — it is in EVALUATION.** Relaxing the assumption is often the easy part. The trap is that **once you relax it, the original benchmark may no longer apply** — the standard dataset *encodes* the assumption you just dropped (it ships full-information instances; there is no online-revelation variant of it), so you cannot compare on it, and you must **build your own evaluation protocol**: instances that exercise the relaxed setting, a metric that is fair across methods that see different information, baselines adapted to the new setting. That nearly **doubles the work** of the variant, and the doubling is invisible until you try to run the comparison.

Conversely — and this is why relaxation is worth the cost when it lands — **the new benchmark you are forced to define becomes the thing later work cites.** A field's evaluation protocol is high-leverage infrastructure; defining the online-demand VRP benchmark can outlast the specific method that motivated it. Budget the doubled evaluation cost honestly on the entry ticket, and count the citable benchmark as part of the prize.

### 4. STRUCTURE-EXPLOITATION (find and exploit structure)

You find structure the general-purpose method ignores and build a method that exploits it. Three entry points worth probing:

- **The problem's DUAL form** — a constraint that is awkward in the primal is a variable that is cheap in the dual; a Lagrangian or LP-dual view often exposes a decomposition the primal hides.
- **The constraint matrix's sparsity / block pattern** — a block-diagonal or block-angular structure with few linking constraints invites Benders / Dantzig-Wolfe decomposition; near-banded structure invites dynamic-programming sweeps.
- **The statistical regularities of real instance data** — the degree distribution of the network, demand correlation across nearby nodes, the empirical rank of the travel-time matrix, the clustering coefficient of the conflict graph.

**The death: the structure exists only in your synthetic data.** Synthetic generators bake in regularities (uniform demand, Euclidean symmetric distances, i.i.d. arrivals) that real instances violate, and a method tuned to the synthetic regularity collapses on real data where the regularity is absent. So the **first thing you do after finding structure is verify it holds on REAL instances** — load the real data, compute the one quantity your method's value hinges on (the actual matrix rank, the actual demand correlation), and confirm the structure is there before you build the method that exploits it. This check is exactly the kind of one-day validation experiment the entry ticket asks for; for a structure-exploitation variant it is non-negotiable.

### 5. LEARNING-AUGMENTED (replace search with a learned model)

You replace expensive search with a trained model: a learned construction heuristic that builds a solution in one forward pass instead of a branch-and-bound tree, a GNN that predicts which variables to fix, a policy that dispatches without re-solving.

**The most hidden death: inference time eats back the solve time you saved.** The variant's whole pitch is speed — but the forward pass, the feature extraction, the post-processing to repair the model's near-feasible output, and the per-instance model load are all time too, and they are easy to leave out of the headline. A learned router that "solves in 50 ms" while the baseline takes 2 s looks like a 40× win — until you count the 1.8 s of feature construction and the 0.5 s feasibility-repair pass, and the win evaporates.

The defense, baked into the variant from the prototype onward:

> Report **end-to-end total time** — feature extraction + inference + any repair/decode + post-processing — never the solve phase alone, and never inference latency in isolation.

A learning-augmented variant that reports anything narrower than end-to-end wall-clock is concealing its own most-likely death from you, and the agent — whose gradient is to make the number look good — will report the narrow figure unless the scaffold's one shared metric codebase forces the end-to-end one.

### The five patterns at a glance

| Pattern | The bet | Characteristic death | The pre-build test |
|---|---|---|---|
| **Combination** | A's output feeds B better than B's current input | Unnatural graft point; halves drag each other down | Write "A's output is exactly what B most needs" — or don't graft |
| **Replacement** | The swapped component was the bottleneck | Swapping a non-bottleneck; gain eaten upstream | Aim at the ladder's biggest inter-level gap |
| **Relaxation** | Dropping an assumption opens a real setting | Evaluation, not technique — old benchmark no longer applies | Budget the new protocol (≈2× work); claim the citable benchmark |
| **Structure-exploitation** | A real-data regularity the general method ignores | The structure exists only in synthetic data | Verify the structure on REAL instances first |
| **Learning-augmented** | A learned model beats search on time | Inference + features + repair eat the saved solve time | Report end-to-end wall-clock from the prototype on |

---

## STAGE 2, part 2 — Combining variants for the tournament (`variants-death-orthogonal`, `variants-have-fourfold`)

You do not take five variants into the tournament. You take **two or three**, chosen so the race teaches you something no matter who wins. Two properties govern the choice.

### Death-cause orthogonality

> The two or three variants you race must bet on **different things**, so that one assumption falling does not wipe out the whole field.

The failure to avoid: three variants that all, underneath, bet on the same thing. Suppose a dynamic vehicle-routing field and three candidates — a demand-forecasting initializer, a learned dispatcher trained on predicted demand, and a robust-optimization variant tuned to a forecast distribution. They look different, but **all three bet on "demand is predictable."** If that single assumption is false in your real instances, all three die together and the tournament taught you nothing about the problem — you spent three prototypes to discover one fact you could have checked directly.

Orthogonal bets are the opposite. Race (a) a structure-exploitation variant betting "the travel-time matrix is low-rank," (b) a relaxation variant betting "the value is in handling online demand, no prediction needed," and (c) a combination variant betting "a generative initializer reaches basins local search can't." Now whoever wins, you learn something about the **problem**: if the structure variant wins, the matrix structure is real and exploitable; if the relaxation variant wins, the online setting was the actual gap; if all three tie the baseline, the direction itself is in question. The tournament's job is not only to pick a survivor — it is to **convert prototype-spend into knowledge about the problem**, and only orthogonal bets do that.

A practical test: for each pair of variants, name the one assumption whose falsification kills *both*. If you can name it for every pair, your field is not orthogonal — collapse the redundant ones and add a variant that bets elsewhere.

### The four-piece entry ticket

Brainstorm candidates with the agent — but the agent floods you with plausible-sounding methods, and most are not yet thought through enough to race. The filter: **every candidate must carry a four-piece entry ticket, and a candidate missing any piece does not enter discussion.**

1. **Mechanism in one sentence** — *what* makes it work, not what it is built from. "A GNN predicts edge-inclusion probabilities that warm-start the LP" is a mechanism; "a deep learning approach to routing" is not.
2. **Most-likely death cause** — which of the five characteristic deaths (or another, named) this variant is most exposed to. A candidate whose author can't name how it most likely dies hasn't thought about it.
3. **A one-day minimal validation experiment** — the smallest thing that probes the most-likely death. For a structure variant, "compute the real-data matrix rank"; for a learning-augmented variant, "measure end-to-end time on ten instances against the baseline." It is the variant's own cheap kill-shot, designed before it is built.
4. **The delta vs the nearest existing work** — one line a domain expert would accept as genuinely-not-done, not a relabel. (This is the precise-delta discipline `prospect` installs — see [../../prospect/SKILL.md](../../prospect/SKILL.md) — applied now to the method, not the gap.)

Copy-ready brainstorming prompt — note it is handed the spec, the close-reading notes, and the death log together, so the agent proposes against what is already known and already dead:

```
You are helping me generate method VARIANTS to race in an elimination tournament.
I will give you three inputs:
  - SPEC: <paste the STAGE 0 three-column decidable spec>
  - CLOSE-READING NOTES: <prospect's notes on the gap and the 3 closest works>
  - DEATH LOG: <variants already killed and WHY — do not re-propose a dead bet>

Propose 4-6 candidate variants spanning these patterns where they apply:
combination / replacement / relaxation / structure-exploitation / learning-augmented.

For EACH candidate, fill the four-piece entry ticket. A candidate missing any
piece is incomplete — mark it INCOMPLETE, do not pad it:
  1. MECHANISM (one sentence): what makes it work, not what it is built from.
  2. MOST-LIKELY DEATH CAUSE: which characteristic death is it most exposed to?
  3. ONE-DAY VALIDATION: the smallest experiment that probes that death cause —
     exact data, the ONE quantity to measure, the threshold that would kill it.
  4. DELTA: one line vs the nearest existing work that an expert would accept as
     genuinely-not-done (cite the work; mark UNVERIFIED if you cannot confirm it).

Then, ACROSS the candidates, report the DEATH-CAUSE ORTHOGONALITY check:
  - for each pair, name the single assumption whose falsification kills BOTH;
  - flag any cluster of candidates that all bet on the same underlying assumption.

Output: one filled ticket per candidate, then the orthogonality table. Do not
recommend a winner — that is my call.
```

The gate checks are clear when **each candidate carries a complete four-piece ticket** (`variants-have-fourfold`) and **the two or three you carry forward bet on assumptions whose falsifications are independent** (`variants-death-orthogonal`) — a choice you made against the orthogonality table, not one the agent made for you.

---

## STAGE 3, part 1 — The scaffold (`scaffold-trustworthy`)

The tournament runs on a scaffold, and the scaffold is where both new failure modes strike — the agent's silent bugs and your attachment. A trustworthy scaffold has a fixed shape and two iron rules.

### The three-piece shape

- **One config file** defines the **variant × instance × seed** grid — every combination the race will run, in one declarative place, so the grid is auditable and reproducible rather than scattered across scripts.
- **One command runs it all** and persists **structured** results — CSV or SQLite, one row per (variant, instance, seed) with the metric, the wall-clock, the feasibility verdict, and the seed. Structured, not scraped from logs: a number you have to grep out of stdout is a number you will misalign.
- **One command emits the comparison table** from the persisted results — so the table is a deterministic function of the data, regenerable on demand, never hand-assembled.

This three-piece shape (config → run+persist → table) is what makes the race cheap to re-run when you add a variant or fix a bug, and what makes the eventual paper's main table fall out of the same pipeline.

### Iron rule 1 — ONE metric-computation codebase, shared by every variant

> Letting each variant compute its own metric is the **number-one source of misaligned experiments.**

If variant A's code computes total cost including the return-to-depot leg and variant B's omits it, or one counts a soft-constraint penalty the other ignores, the tournament is comparing two different quantities and every conclusion drawn from it is noise. The fix is mechanical and absolute: **one metric module, imported by the scaffold, applied uniformly to every variant's output.** A variant produces a *solution*; the shared codebase produces the *number*. No variant computes its own score. (This is also where the learning-augmented variant's end-to-end timing is enforced — the shared module times the whole pipeline, so a variant cannot quietly report solve-phase-only.)

### Iron rule 2 — an INDEPENDENT FEASIBILITY CHECKER, run on every solution

> A variant whose performance "soars" is, nine times in ten, producing **infeasible solutions.** The feasibility checker is your strongest weapon against the agent's silent bugs.

The checker validates every produced solution against the hard constraints — and it must share **no logic with any solver.** If the checker reuses the solver's own constraint code, it inherits the solver's bug: a solver that miscomputes capacity will have a checker that agrees the over-capacity route is fine. Independence is the whole point — write the checker from the *problem definition* (capacity ≤ Q, every node visited exactly once, precedence respected, time windows met), simply and slowly, optimized for obvious correctness rather than speed, and run it on **every** solution before its metric counts. A solution that fails the checker scores nothing; a variant that produces infeasible solutions cannot soar past the baseline because its illegal solutions are disqualified, not rewarded.

This is the single most important defense in the file. The agent will, without intending to, hand you a variant whose constraint-handling has a hole, and that variant will post the best number in the table — because emitting solutions that ignore a constraint is *easier* and *cheaper* than respecting it. The independent checker is what stands between that bug and your belief in it.

### The instance sets — discriminating, and a held-out guard

A small instance set is fine — the tournament is *exploration*, a fast race, not the frozen confirmation [ledger](../../ledger/SKILL.md) runs. But the small set must satisfy two properties:

- **Discriminating.** The baseline must do *well on some instances and badly on others.* A set the baseline **aces uniformly** cannot resolve differences (everything looks equal at the ceiling); a set the baseline **fails uniformly** cannot either (everything looks equal at the floor). You need spread — instances where the baseline varies — because the variants' differences only become visible against a baseline that itself varies. Construct the set by sampling across the dimension the baseline is sensitive to (instance size, demand tightness, network density), then confirming the baseline's scores actually spread.
- **Covers the target cell.** The set must include instances from the **matrix cell you are aiming at** (the asymmetric-large-VRP cell, the online-demand cell). A discriminating set that doesn't touch your target setting resolves differences in the wrong place.

Plus a **small held-out set used for NO decision, ever.** You run it every couple of weeks, look at it, and *change nothing in response* — its only job is to catch the design quietly over-fitting to the tournament instances. If the tournament set and the held-out set agree, your survivor's lead is real; if the survivor leads on the tournament set but not the held-out set, you have been tuning to the tournament and the lead is an artifact. The held-out set is a tripwire, not a knob — the moment you let one held-out number change one design decision, it stops being held out and you have lost the guard.

Copy-ready scaffold stand-up prompt:

```
Stand up a tournament scaffold for racing method variants. Build it in pieces and
SHOW me each piece before wiring the next.

PROBLEM: <one-line problem definition + the HARD constraints, verbatim from the spec>
VARIANTS: <names + how to invoke each — each takes an instance, returns a solution>
INSTANCES: <path/format of the discriminating set and the held-out set, kept separate>

Build:
1. CONFIG: one declarative file defining the variant × instance × seed grid.
2. RUNNER: one command that runs the whole grid and persists STRUCTURED results
   (CSV or SQLite) — one row per (variant, instance, seed): metric, end-to-end
   wall-clock, feasibility verdict, seed. No metric scraped from logs.
3. METRIC MODULE: ONE shared metric-computation codebase, imported by the runner,
   applied identically to every variant's output. No variant computes its own metric.
   It times the FULL pipeline (features + inference + repair + post-processing),
   never a sub-phase.
4. FEASIBILITY CHECKER: an INDEPENDENT checker that shares NO code with any solver.
   Write it straight from the HARD constraints above — simple and obviously correct,
   not fast. Run it on EVERY produced solution; a solution that fails scores NOTHING
   and is flagged INFEASIBLE in the results, never silently dropped or zero-filled.
5. TABLE: one command that emits the comparison table from the persisted results —
   per variant, per scale tier: median metric, the feasibility-pass rate, end-to-end
   time. A variant with a feasibility-pass rate below 100% is flagged, not hidden.

Do NOT reuse any solver's constraint code in the checker. When a variant's number
looks too good, the FIRST thing to report is its feasibility-pass rate.
```

The `scaffold-trustworthy` check is clear when **the scaffold has the three-piece shape, one shared metric codebase, an independent feasibility checker run on every solution, and a discriminating instance set covering the target cell plus an untouched held-out set.**

---

## STAGE 3, part 2 — The kill criteria, pre-committed (`kill-criteria-pre-committed`)

> Write the elimination rule in black and white **before the first variant runs** — because people grow attached to a variant they implemented, and a post-hoc kill standard always gets watered down.

The mechanism is human, not technical. The afternoon you finish a variant's prototype, you are invested in it; if the kill standard is still unwritten when its mediocre numbers come in, you will — without feeling dishonest — find the qualification that spares it ("it's only behind on the large tier, and that's the harder one anyway; let me tune it once more"). The pre-committed kill takes that wiggle room away from both you and the agent, whose please-you gradient is strongest exactly when a result is borderline.

**Aim each criterion at the competitor the variant must beat to justify its existence — not at the floor everything clears.** A variant is added to prove a *specific* mechanism: a dynamic policy exists to beat the best *static* one, a learned component to beat the best *hand-tuned* one, a graft to beat its *stronger* half alone. So the kill rule must name *that* competitor. A rule that only asks "did it beat the baseline?" lets a variant clear the floor by a wide margin, pass its pre-committed kill, and survive — while a simpler member of the same tournament quietly matched it and the new mechanism never earned its keep. (This is a real and easy mistake: you can pre-commit the kill honestly and *before* the run, yet aim it at the wrong opponent — the criterion's *target* is as much a bet as the threshold.) Write the kill against the competitor that would make the variant *pointless*, and the tournament tells you whether the *mechanism* is real, not merely whether the *method* beats the baseline.

A kill criterion is **decidable and stated against the metric the scaffold already computes.** Examples:

- *"Killed if its median is no better than the baseline on **both** scale tiers."*
- *"Killed if its feasibility-pass rate is below 100% and the bug isn't fixed within one re-trial."*
- *"Killed if its end-to-end median time exceeds the baseline's while its solution quality only ties."* (the learning-augmented death, made a kill rule)
- *"Killed if its lead on the tournament set does not appear on the held-out set."* (the over-fitting tripwire, made a kill rule)

Write them as a short list, dated, *before* the run — ideally committed to the repo so the timestamp is a record. A criterion you can rephrase after seeing results is not pre-committed; the test is whether someone reading only the criterion and the results table, without your commentary, would reach the same kill verdict you did.

The `kill-criteria-pre-committed` check is clear when **the elimination rules are written down, decidable against the scaffold's metric, and dated before the first variant ran** — not assembled around the results after the fact.

---

## STAGE 3, part 3 — The death log (`deaths-logged`)

Every eliminated variant is recorded in an **append-only death log.** This is not bookkeeping for its own sake — the classification it forces is load-bearing for what you do next, and the log itself is the foundation [ledger](../../ledger/SKILL.md) builds its exploration record on (see ledger's firewall between exploration and confirmation).

Each entry carries five fields:

| Field | What it records |
|---|---|
| **Variant name** | The candidate, traceable to its four-piece entry ticket. |
| **Mechanism assumption** | The one thing it bet on — the assumption from its ticket. |
| **Key evidence numbers** | The medians, the feasibility-pass rate, the end-to-end times that decided it — against the pre-committed criterion. |
| **Death-cause classification** | One of: **implementation bug** / **mechanism assumption falsified** / **tied by a simple baseline** / **engineering-infeasible**. |
| **Revival condition** | What would bring it back — "revisit if a faster feature extractor lands," "revisit if the real-data structure check is repeated on the new dataset." |

### The classification is load-bearing

The death-cause class decides what happens to the variant *and to its siblings*:

- **Implementation bug** — the variant died because of a defect (often the feasibility checker caught infeasible solutions, or a metric mismatch). This death **deserves a fix and a re-trial** — the mechanism was never actually tested. Do not bury it; repair the bug and race it again. (A soaring variant the checker disqualified is the canonical bug-death — it didn't beat the baseline, it cheated the constraints.)
- **Mechanism assumption falsified** — the variant's core bet was wrong (the structure wasn't in the real data; demand wasn't predictable). This death is **buried together with every other candidate that bet on the same assumption.** This is precisely why death-cause orthogonality mattered upstream: a falsified assumption is a knife that cuts through every variant resting on it, and the log makes that cut explicit — you don't waste a prototype re-betting a buried assumption.
- **Tied by a simple baseline** — the variant works but a far cheaper method matches it; its complexity buys nothing. Buried as not-worth-it, with the simple baseline noted as the thing to beat.
- **Engineering-infeasible** — the mechanism is sound but cannot be built within constraints (needs a solver that doesn't terminate, memory you don't have). Buried with the engineering blocker as the revival condition.

A death log that records *that* a variant died but not *which class* of death is half a log — it can't tell you whether to fix-and-retry or to bury a whole assumption-class, which is the entire decision the log exists to inform.

Copy-ready death-log entry prompt — run it the moment a variant is killed, while the evidence is in front of you:

```
Variant <name> just hit a pre-committed kill criterion. Write its death-log entry.
Append only — do not edit prior entries.

  - VARIANT NAME + ticket reference
  - MECHANISM ASSUMPTION: the one bet from its entry ticket
  - KEY EVIDENCE: the exact numbers that triggered the kill (medians per tier,
    feasibility-pass rate, end-to-end time) and WHICH pre-committed criterion fired
  - DEATH-CAUSE CLASS: exactly one of
      [implementation bug | mechanism assumption falsified | tied by simple baseline
       | engineering-infeasible]
    and one sentence of justification for the class
  - REVIVAL CONDITION: what specifically would bring it back

If the class is "implementation bug", also flag: this is a FIX-AND-RETRY, the
mechanism was not tested. If the class is "mechanism assumption falsified", LIST
every other live or dead variant that bets on the SAME assumption — they are
buried with it.
```

The `deaths-logged` check is clear when **every eliminated variant has an append-only entry carrying all five fields, with the death-cause class assigned and justified** — and, for assumption-falsified deaths, the siblings that share the assumption named.

---

## What you carry out of STAGE 3

You leave the tournament with **one survivor** (occasionally two), and three artifacts that the rest of `crucible` and all of `ledger` build on:

1. **The survivor** — a method that beat its orthogonal rivals on a discriminating set, every solution feasibility-checked, against criteria you couldn't water down. Not a method you liked; one that *earned* the survival.
2. **The trustworthy scaffold** — config, runner, shared metric codebase, independent checker, table — which becomes the harness the eventual paper's main experiments run on, and which [ledger](../../ledger/SKILL.md) freezes for confirmation.
3. **The death log** — the append-only record of what didn't work and *why*, which is reusable intelligence (it tells future-you and the field which mechanisms are dead) and the seed of ledger's exploration record.

The survivor now goes on to be deepened and defended: [theory.md](theory.md) (STAGE 4 — hunt counterexamples, then prove, and don't launder a fluent proof) and [ablation-and-novelty.md](ablation-and-novelty.md) (STAGE 5-6 — pre-wired ablation switches with null doubles, and the mechanism-keyword novelty defense). A survivor that came through a feasibility-checked, pre-committed, orthogonal tournament is a categorically different thing to deepen than a single method you nursed and hoped about — because you know it beat alternatives that bet elsewhere, and you know its number isn't a bug.

---

**Cross-links:** [spec-and-ceiling.md](spec-and-ceiling.md) (STAGE 0-1 — the decidable spec the variants must satisfy and the oracle ladder whose inter-level gaps aim the replacement variant and whose total gap justified the race at all) · [theory.md](theory.md) (STAGE 4 — deepening the survivor: counterexample search before proof, the proof-laundering guard) · [ablation-and-novelty.md](ablation-and-novelty.md) (STAGE 5-6 — pre-wired ablation switches with the three null doubles, the complexity budget, and the mechanism-keyword novelty search) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 2 Variants, STAGE 3 Tournament) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (step one — the landed gap and precise-delta discipline the four-piece ticket reapplies to the method) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (step three — which freezes this scaffold for confirmation and builds its exploration record on this death log).

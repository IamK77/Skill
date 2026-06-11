---
name: crucible
description: >
  The method-design lens: turn a landed research gap into a method worth writing
  up — for any field where you run experiments to publish (machine learning,
  combinatorial optimization, operations research, systems, scheduling). Use after
  prospect has landed a gap, when you are designing an algorithm / model /
  improvement and choosing among approaches, or stress-testing a method you already
  have. The one shift: a method is NOT nursed — you don't lovingly refine one idea —
  it is RACED TO DEATH. Cheap agent prototypes let you generate several variants and
  run an elimination tournament against kill criteria written BEFORE the race
  (because you fall in love with what you built), on a scaffold whose independent
  feasibility checker traps the agent's silent bugs (a variant that "soars" is
  usually emitting infeasible solutions); and you measure the ceiling FIRST (an
  oracle ladder) so you know the prize and which component holds it. Triggers on
  "design a method / algorithm / model", "how should I approach this", "which
  variant is better", "ablation", "is my contribution novel enough", "prove a bound
  / approximation ratio / convergence", "oracle / skyline / upper bound experiment",
  "what's my baseline gap", "is this method real or a bug". Installs the
  decidable-spec-as-claim-draft, the oracle ceiling ladder, the five variant
  patterns and death-cause orthogonality, the trustworthy tournament scaffold with
  pre-committed kills and a death log, counterexample-search-before-proof with the
  proof-laundering guard, pre-wired ablation switches with a complexity budget, and
  the mechanism-keyword novelty defense. The agent is the means (parallel
  prototyper, proof-filler, adversary), never the oracle; you keep the bets — which
  variants to race, the kill criteria, and whether a result is real.
argument-hint: "[the gap to turn into a method, or a method/variant to stress-test]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# crucible

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A crucible is the vessel you put a substance into to test it under heat: the true part survives, the rest burns off. `crucible` is the lens you hold over **method design** — research step two, after [prospect](../prospect/SKILL.md) has landed a defensible gap — to turn that gap into a method that survives review. It is the second skill of the `inquiry` suite. It audits (and guides you to run) a gated arc that *forges* a method by racing several candidates and keeping only what survives, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — a method is raced to death, not nursed.** In the human era, implementing a method variant cost weeks, so you bet on **one** idea and lovingly refined it — and your judgment was quietly corrupted by attachment to the thing your own hands built. In the agent era an agent stands up a half-day prototype of *each* variant, so you do the opposite: **generate several, race them in an elimination tournament, and let the losers die.** But that same cheapness brings two new failure modes the whole skill is built to defend against. You **still** fall in love with what you built — so the **kill criteria are written before the race**, when you are not yet attached. And the agent hands you winners that are really **infeasible-solution bugs** — a variant whose performance "soars" is, nine times in ten, producing solutions that violate the constraints — so an **independent feasibility checker** gates every result before you believe it.

**Measure the ceiling before you build.** Before racing anything, you run an **oracle ladder** — open the cheats one level at a time (perfect information, an exact sub-solver, ground-truth components) and watch performance climb. The *total* gap tells you whether the direction is worth a year; the *per-level* gaps tell you which component holds the prize (so you attack that one); and the *reverse* signal — a level that moves nothing — tells you the bottleneck isn't where you thought, killing half your candidates for free. You learn the size and the location of the prize before spending a week chasing it.

**Design for the paper from day one.** The spec is the **draft of your claims**; the oracle ladder is the **motivation figure**; the ablation switches are **pre-wired** before you need them; the theory is **calibrated to the venue**; the novelty is **defended with mechanism-keyword search**. Nothing here is busywork for its own sake — every artifact this skill produces is a part of the eventual paper, made at the moment it is cheapest.

**What you cannot delegate — the bets.** The agent prototypes, fills proofs, runs searches, and argues. But three calls stay yours: **which variants to race** (pick death-cause-orthogonal ones, so the tournament informs you whoever wins), **the kill criteria** (written before you are attached), and **whether a result is real** (a "soaring" number is a feasibility-bug suspect first, a triumph never). Outsource these and you have automated a confident investment in an artifact, not a method.

**Speak the user's language.** Most calls here are the researcher's bets — is this graft natural, is this delta novel or cosmetic, is the theory worth the weeks, which variant deserves the deepening. Read their field fluency and gloss a term on first use (the *oracle ladder*, *death-cause orthogonality*, the *null doubles*, *proof laundering*, the *degenerate-special-case theorem*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared — and the bet is theirs to place.

**Read [references/spec-and-ceiling.md](references/spec-and-ceiling.md) first** — the foundation: the decidable spec that is your claim draft, and the oracle ceiling ladder that tells you the size and location of the prize before you build. It is what makes the rest of the arc aim true.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/spec-and-ceiling.md](references/spec-and-ceiling.md)** — STAGE 0-1: the three-column decidable spec (hard / soft / free) and its second identity as the paper's claim draft; the oracle typology (information / computation / tuning / component); building the ladder, reading the total gap, the per-component marginal value, and the precious reverse signal. Load at STAGE 0.
- [references/variants-and-tournament.md](references/variants-and-tournament.md) — STAGE 2-3, the heart: the five variant patterns (combination / replacement / relaxation / structure-exploitation / learning-augmented) and each one's characteristic death; death-cause orthogonality and the four-piece entry ticket; the trustworthy scaffold (one metric codebase, the independent feasibility checker, discriminating and held-out instances), the pre-committed kill criteria, and the death log. Load at STAGE 2.
- [references/theory.md](references/theory.md) — STAGE 4: counterexample search before proof (three weapons, hunting the degenerate boundary); the five-beat human-agent proof protocol and the proof-laundering guard; calibrating theory depth to the venue; the high-ROI degenerate-special-case theorem. Load at STAGE 4 (honestly skippable for purely empirical work).
- [references/ablation-and-novelty.md](references/ablation-and-novelty.md) — STAGE 5-6: pre-wired switches and the three null doubles (identity / random / cheap-heuristic), the "cheap substitute can't match it" bar, the two-component complexity budget and the empty-ablation-table technique, the resident brute-force contestants; the mechanism-keyword novelty search, the verifiable-consequence diff template, claim-strength calibration, and defensive citation. Load at STAGE 5.

> **The arc is one tournament with a measured prize.** Seven stages — spec · ceiling · variants · tournament · theory · ablation · novelty — turn a gap into a method that survives review: spec and ceiling fix the target and the prize, variants and tournament race candidates to a survivor, theory and ablation and novelty deepen and defend it. `crucible` gates all seven below, and hands the survivor to [ledger](../ledger/SKILL.md) for full experiment design.

---

## STAGE 0 — Spec (a decidable spec that is your claim draft)

Open **[references/spec-and-ceiling.md](references/spec-and-ceiling.md)**. Before any design, fix what "good" means — decidably.

- **Write the three-column spec.** HARD constraints (the gap statement translated directly — violating one disqualifies the method), SOFT constraints (quantified, negotiable trade-offs), FREE design space (fully open). Keep the columns fixed so the spec reads as a contract.
- **Make every line decidable.** "The method should be fast" is noise; "median solve time on the scaffold instances is within 2× the baseline's" is a spec. The efficient check: hand the gap statement to the agent, have it rewrite each requirement as a measurable acceptance criterion, and have it **flag the ones it cannot** — those are the requirements you haven't thought through yet, and they are work to do now.
- **Recognize the spec is your claim draft.** Write the two or three sentences the finished paper must make a reader believe; the spec is their verifiable form. Every later experiment collects evidence for these claims; anything serving no claim is work you can skip — the biggest time-saver in the whole of method and experiment design.

### GATE — clear before CEILING
1. `checklist check spec spec-is-decidable`
2. `checklist check spec spec-is-claim-draft`
3. `checklist verify spec`

---

## STAGE 1 — Ceiling (the oracle ladder: how big is the prize, and where?)

Open **[references/spec-and-ceiling.md](references/spec-and-ceiling.md)** (the ceiling section). Measure the prize before you chase it.

- **Build the oracle ladder, not a single ceiling.** Open the cheats one level at a time. Know the typology: INFORMATION oracle (true future values / ground-truth parameters), COMPUTATION oracle (exact brute-force sub-solver / infinite time), TUNING oracle (tune on the test set), COMPONENT oracle (a module replaced by ground truth). Two rules: the oracle's metric must match the final main experiment (or the ceiling isn't comparable), and measure at **at least two scale tiers** (a small instance's bottleneck can differ entirely from a large one's).
- **Read the ladder for three payoffs.** The **total** gap says whether the direction is worth doing (a low ceiling kills it now, cheaply). The **inter-level** gaps are each component's marginal value — they aim your STAGE 2 replacement variant at the component worth investing in (a 9.5-gap predictor beats a 1.3-gap sub-solver). The **reverse** signal is equally precious: a level that moves nothing means the bottleneck isn't where you thought — which can veto half your candidate variants. (And the ladder is your paper's motivation figure, for free.)

### GATE — clear before VARIANTS
1. `checklist check ceiling oracle-ladder-built`
2. `checklist check ceiling ceiling-justifies-direction`
3. `checklist verify ceiling`

---

## STAGE 2 — Variants (generate candidates with orthogonal deaths)

Open **[references/variants-and-tournament.md](references/variants-and-tournament.md)**. Don't design one method — generate a few that bet on different things.

- **Use the five patterns, each with its death in mind.** COMBINATION (graft, e.g. learned initial solution + classical local-search refine — argue "A's output is exactly B's needed input" or don't graft); REPLACEMENT (swap the biggest-gap component the ladder found — not a non-bottleneck); RELAXATION (relax an assumption — the death is in *evaluation*: the old benchmark may not apply, so you build a new protocol; but that new benchmark gets cited); STRUCTURE-EXPLOITATION (enter via the dual form, the constraint-matrix sparsity/blocks, or real-data statistics — verify the structure exists in *real* instances, not just your synthetic ones); LEARNING-AUGMENTED (the hidden death: inference time eats the solve time saved — report **end-to-end** time from the prototype).
- **Choose death-cause-orthogonal variants.** Take two or three into the tournament that bet on *different* things — if all three bet on "demand is predictable," one assumption falling wipes them all out; orthogonal bets mean the tournament teaches you about the problem whoever wins.
- **Require the four-piece entry ticket.** Each candidate carries: mechanism in one sentence, most-likely death cause, a one-day minimal validation experiment, and the delta vs the nearest work. No four-piece set, no discussion. (Brainstorm with the agent given the spec, the prospect close-reading notes, and the death log.)

### GATE — clear before TOURNAMENT
1. `checklist check variants variants-death-orthogonal`
2. `checklist check variants variants-have-fourfold`
3. `checklist verify variants`

---

## STAGE 3 — Tournament (race them on a scaffold you can trust)

Open **[references/variants-and-tournament.md](references/variants-and-tournament.md)** (the tournament section). The heart of the skill — and where the agent's bugs and your attachment both strike.

- **Build a trustworthy scaffold.** One config defines the variant × instance × seed grid; one command runs it and persists structured results (CSV / SQLite); one command emits the comparison table. Two iron rules: **one** metric-computation codebase shared by all variants (per-variant metric code is the #1 cause of misaligned experiments); an **independent feasibility checker** sharing no logic with any solver, run on every solution (your strongest weapon against silent bugs — a "soaring" variant is usually emitting infeasible solutions). Pick a **discriminating** small instance set (the baseline does well on some, badly on others) covering your target cell, plus a **held-out** set used for no decision, run every couple of weeks to catch over-fitting to the tournament.
- **Pre-commit the kill criteria — aimed at the right competitor.** Write the elimination rule in black and white *before* the first variant runs (e.g. "killed if its median beats neither scale tier's baseline"), because you grow attached to what you built and a post-hoc standard always leaks. And aim each rule at the competitor the variant must beat to *justify its existence* — a dynamic variant against the best *static* one, a learned component against the best *hand-tuned* one — not merely the baseline everything clears, or a variant survives while failing the very thing it was added to prove.
- **Keep a death log.** Per eliminated variant: name, mechanism assumption, key numbers, death-cause class (implementation bug / assumption falsified / tied by a simple baseline / engineering-infeasible), revival condition. The class matters: a bug-death deserves a fix and re-trial; an assumption-falsified death buries every candidate betting that same assumption. (This append-only log is what [ledger](../ledger/SKILL.md) builds its exploration record on.)

### GATE — clear before THEORY
1. `checklist check tournament scaffold-trustworthy`
2. `checklist check tournament kill-criteria-pre-committed`
3. `checklist check tournament deaths-logged`
4. `checklist verify tournament`

---

## STAGE 4 — Theory (hunt counterexamples first, then prove — and don't launder)

Open **[references/theory.md](references/theory.md)**. For theory-bearing work; for a purely empirical contribution, record this stage N/A with that reason (an honest skip, not a silent one).

- **Search for counterexamples before opening a proof.** Three weapons: SMALL-SCALE EXHAUSTION (enumerate the instance space where you can), PROPERTY-DRIVEN RANDOM GENERATION (sample near the assumption's **boundary** — counterexamples hide in degenerate cases: empty set, single point, parameter at 0 or ∞, a constraint exactly binding), and AGENT PROPERTY-BASED TESTING (encode the proposition as automated property tests, e.g. `hypothesis`, which does boundary-shrinking search). Prove only what survives all three.
- **Prove in five beats, and guard against proof laundering.** You give proposition + sketch → agent fills details → you hand-verify line by line → a **fresh** agent session plays hostile reviewer (boundary cases, inequality directions, constants' parameter-dependence, whether "WLOG" truly loses none) → patch and attack again. The laundering risk, named: agent proofs always *read* fluent, and errors hide under "by X it easily follows," "without loss of generality," "similarly" — every such phrase is **expanded into a full derivation**, and one that won't expand is a hole. Calibrate depth to the venue (match three-to-five recent comparable papers' theory sections). Consider the high-ROI **degenerate-special-case theorem** (set a parameter to 0 or ∞, prove it reduces to a known method — a sanity check, a positioning as a generalization, and usually easy).

### GATE — clear before ABLATION
1. `checklist check theory claims-survived-counterexample-search`
2. `checklist check theory proofs-laundering-checked`
3. `checklist verify theory`

---

## STAGE 5 — Ablation (pre-wire the switches, budget the complexity)

Open **[references/ablation-and-novelty.md](references/ablation-and-novelty.md)**. Build the ablation *into* the method, before you need it.

- **Pre-wire the switches with three null doubles.** Every switch is a config item, never commented-out code; each component's interface reserves IDENTITY (off), RANDOM (same interface, random output), and CHEAP-HEURISTIC (the most naive implementation). The convincing ablation is not "worse when off" (only shows the component is used) but "a cheap substitute can't match it" (shows your design is *necessary*) — which is what reviewers challenge.
- **Budget the complexity, and draw the empty ablation table now.** Two new components is the sweet spot; three-plus and the story blurs and the table explodes. Draw the future paper's **empty** ablation table now — one row per switch combination, one column per metric — because drawing it exposes which components can't be isolated and which combinations are too many to run, both signals to simplify. Keep three brute-force contestants resident in the tournament: baseline + 10× time, baseline + large hyperparameter search, and (if you have a learning component) your most-naive learning version.

### GATE — clear before NOVELTY
1. `checklist check ablation ablation-prewired`
2. `checklist check ablation complexity-budgeted`
3. `checklist verify ablation`

---

## STAGE 6 — Novelty (defend it with mechanism-keyword search)

Open **[references/ablation-and-novelty.md](references/ablation-and-novelty.md)** (the novelty section). The second adversarial search — by mechanism, not problem.

- **Run the mechanism-keyword search.** prospect's first search used PROBLEM keywords ("dynamic vehicle routing"); this one uses MECHANISM keywords ("decompose constraint class Y via structure X," "fuse prediction and optimization in manner Z") — mechanism words hook the papers that solve a *different* problem with *your* technique, exactly the "have you seen this one?" a reviewer loves. Push the scope down to workshops, tech reports, and unpublished arXiv.
- **Make every delta a verifiable consequence, and calibrate the claim.** Per near-neighbor: "X also uses technique A, but for purpose B / under assumption C; our difference is D, which causes result E" — E must be **verifiable**; a delta with no E is decorative. Calibrate claim strength to novelty type: new mechanism → "we propose a novel…"; new combination → "we are the first to combine… and show that…"; new application → "we adapt… which requires non-trivially addressing…". Cite **all** neighbors and discuss the differences in related work — proactive discussion shows command; a pointed-out omission undermines the novelty itself.

### FINAL GATE — the method is forged
1. `checklist check novelty mechanism-search-run`
2. `checklist check novelty deltas-have-verifiable-consequence`
3. `checklist verify novelty`
4. `checklist show` — confirm all **seven** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`crucible` is the **method-design lens**, held over a landed gap to forge a method that survives review. Its seven stages are one arc against one enemy — **investing months in a method that was never going to work, or that you can't tell from a bug.** Spec (0) fixes a decidable target that is your claim draft; ceiling (1) measures the size and location of the prize before you chase it; variants (2) and tournament (3) race death-cause-orthogonal candidates against pre-committed kills on a feasibility-checked scaffold, so the survivor earned it; theory (4), ablation (5), and novelty (6) deepen and defend that survivor for the venue. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: measure the ceiling before you build, race several because prototypes are cheap, write the kill before you're attached, and never trust a number your feasibility checker hasn't cleared.

It pairs with its siblings without duplicating them. Inside `inquiry`, [prospect](../prospect/SKILL.md) hands it a landed gap with reproduced baselines (the tournament's reference and the oracle's floor), and it hands [ledger](../ledger/SKILL.md) a surviving, deepened method with small-scale empirical evidence, pre-wired ablation switches, and a defended novelty claim — crucible's tournament is *exploration* (a small, fast race to pick the survivor); ledger runs the frozen *confirmation*. And it routes to the engineering suite when the work turns to production-grade code: `assay` tests the experiment harness, `gauge` and `plumb` keep its signal and craft, `husbandry` keeps the scaffold cheap to change. For an agent the lever is the same as everywhere in the suite: it will hand you a "soaring" variant that emits infeasible solutions, a fluent proof with a hole under "WLOG," and a relabel it calls novel — feeling none of the future desk-reject — so the method must be **raced, feasibility-checked, and gated**, with the version that survived the tournament made the one you write up.

## Anti-patterns (use as a pre-flight checklist)

- **Nursing one method instead of racing several** — prototypes are cheap now; generate variants and run a tournament, don't lovingly refine a single bet.
- **A spec full of platitudes** — "fast," "robust," "scalable" decide nothing; every spec line is a measurable acceptance test or it isn't a spec.
- **Designing experiments that serve no claim** — the spec is your claim draft; work that supports no claim is work you skip.
- **Building before measuring the ceiling** — run the oracle ladder first; a low total gap kills the direction for a day's cost.
- **One all-on oracle instead of a ladder** — you lose the per-component marginal value (which component to attack) and the reverse signal (the bottleneck isn't where you thought).
- **Variants that all bet on the same assumption** — one falsification wipes the field; pick death-cause-orthogonal candidates so the tournament informs you whoever wins.
- **Per-variant metric code** — the number-one source of misaligned experiments; one metric codebase, shared.
- **Believing a "soaring" variant** — it is usually emitting infeasible solutions; an independent feasibility checker gates every result before you celebrate.
- **Setting the kill criteria after seeing results** — attachment to what you built waters them down; pre-commit the kill before the race.
- **A discriminating-blind instance set** — a set the baseline aces or fails uniformly can't resolve differences; pick instances where the baseline varies, and keep a held-out set against over-fitting.
- **Proving before searching for counterexamples** — hunt the degenerate boundary first (empty set, single point, 0/∞, binding constraint); prove only what survives.
- **Trusting a fluent proof** — errors launder under "easily follows / WLOG / similarly"; expand every such phrase or treat it as a hole, and have a fresh session attack it.
- **Over- or under-investing in theory** — calibrate depth to the venue's recent comparable papers; consider the cheap degenerate-special-case theorem.
- **Ablation as commented-out code** — switches are config items with identity / random / cheap-heuristic null doubles; show a cheap substitute *can't match*, not just that off is worse.
- **More than two new components** — the story blurs and the ablation table explodes; draw the empty table now and simplify until it fits.
- **Novelty searched by problem only** — use mechanism keywords to catch the same technique on a different problem, down to workshops and arXiv; make every delta a verifiable consequence and cite all neighbors.
- **Skipping a GATE** — and remember the cheapest method failure is the variant you killed in a day instead of nursing for a season.

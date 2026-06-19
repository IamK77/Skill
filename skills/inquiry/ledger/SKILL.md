---
name: ledger
description: >
  The experiment-design lens: turn the surviving method into a protocol that produces
  evidence a reviewer believes — for any field that runs experiments to publish (ML,
  optimization, operations research, systems). Use after crucible lands a method, when
  planning the experiments, or stress-testing a plan. The one
  shift: you write down what counts as EVIDENCE before you look at the data — the
  protocol (claims, instances, baselines, metrics, and the bar for support OR
  refutation) is FROZEN before the main run, because choosing a good story after the fact
  is p-hacking. The keystone is a firewall between EXPLORATION (generates
  hypotheses, never enters the paper) and CONFIRMATION (survivors, fresh seeds).
  Triggers on "design the experiments",
  "experiment protocol", "which baselines / is this comparison fair", "what metrics /
  statistical test / how many seeds", "ablation / sensitivity / scaling plan",
  "p-hacking / data leakage", "compute budget / how long",
  "pre-register", "is my evaluation honest".
argument-hint: "[the method to design experiments for, or an experiment protocol to stress-test]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# ledger

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A ledger is a record you commit entries to in order — and cannot quietly rewrite after the fact. `ledger` is the lens you hold over **experiment design** — research step three, after [crucible](../crucible/SKILL.md) has produced a surviving method — to turn that method into a protocol that produces evidence a reviewer believes. It is the third skill of the `inquiry` suite. Its product is one artifact: an **experiment-protocol document, written and frozen before the main run**, that doubles as the paper's experiments chapter and the reproduction package's README. It audits (and guides you to write) that protocol across gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — write down what counts as evidence before you look at the data.** The protocol — the claims, the instances, the baselines, the metrics, and the conditions that count as *support or refutation* — is committed **before** the main run. The reason is that the opposite order is p-hacking: run a pile of experiments, then notice a pattern, then build the story around it. You saw the pattern only after looking at many results, so it has a real chance of being noise you fished out — and a reviewer's nose for this is extremely good. Writing the verdicts first means you cannot move the goalposts after the ball is kicked.

**The keystone — a firewall between exploration and confirmation.** Chaos-testing a quick MVP — randomly kicking the system to see what breaks — is the *fastest* way to find what's real, and you should do it. But its output and the paper's evidence are two different things. So the work splits in two, and their data never mix. **Exploration** generates *hypotheses* ("component X seems to drag on large instances") into an **append-only notebook**; its numbers never enter the paper. **Confirmation** takes the believed hypotheses, writes them as claims with pre-written verdicts, and re-runs them on **fresh seeds and fresh instances** under the frozen protocol. Exploration discovers what *might* be true; confirmation proves what *is*. (If you already keep an append-only lab notebook, you have the exploration half right — this skill adds the confirmation half and the firewall between them.)

**The agent is the experiment operator, never the oracle.** Here the agent batch-submits jobs, watches them, auto-retries failures with the reason logged, and summarizes results into tables — the experiment operator's labor, run in parallel. But it is not the judge of what the numbers mean, and it optimizes for a good-looking result: it will not flag the data leak, and it will report the suspiciously-good number as a triumph. So your role shrinks to two things it cannot do — **audit the protocol**, and **investigate anomalies**: a number that is too good triggers a feasibility-and-leakage check *first*, never a celebration.

**What you cannot delegate — the bets.** Three calls stay yours: **the verdicts written before the data** (what counts as support, partial, refutation), **the firewall** (keeping exploration's fished-out patterns out of the confirmation evidence), and **whether an anomaly is a bug or a result**. Outsource these and you have automated a confident, fluent, p-hacked evaluation that dies in review.

**Speak the user's language.** Most calls here are the researcher's — which metric is the headline, is this baseline comparison fair, how many seeds is enough, is this finding real or fished. Read their field fluency and gloss a term on first use (the *firewall*, *run provenance*, a *paired test*, *multiple-comparison correction*, *effect size*, a *performance profile*, *data leakage*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared.

**Read [references/matrix-and-firewall.md](references/matrix-and-firewall.md) first** — the foundation: the claim-evidence matrix with pre-written verdicts, and the exploration/confirmation firewall with run-provenance and the distilled state companion. It is the spine the rest of the protocol hangs on.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/matrix-and-firewall.md](references/matrix-and-firewall.md)** — STAGE 0-1, the spine: the claim-evidence matrix checked both ways and the verdicts written before the data; the exploration/confirmation firewall, run-provenance stamping (git hash / config / seed / data version → run ID), the append-only history file and its rewritable distilled companion, and the agent's self-contradiction sweep. Load at STAGE 0.
- [references/instances-and-baselines.md](references/instances-and-baselines.md) — STAGE 2-3: the three-layer instance set (benchmark with its preprocessing-convention trap, real/industrial, controlled generator with difficulty knobs) and the leakage guards; the four baseline classes and the fairness protocol (same hardware/time, original code + reproduced-vs-claimed, same tuning budget, the disclosed settings-diff table). Load at STAGE 2.
- [references/metrics-and-statistics.md](references/metrics-and-statistics.md) — STAGE 4: primary vs secondary metrics and the performance profile; the statistics protocol — seeds from a variance estimate, mean±std vs median+IQR, the paired Wilcoxon test, multiple-comparison correction, effect size over p-value, and timing hygiene. Load at STAGE 4.
- [references/ablation-sensitivity-budget.md](references/ablation-sensitivity-budget.md) — STAGE 5-6: the ablation table (reusing crucible's switches and null doubles) and the leave-one-out / add-one-in structure; the sensitivity sweep for a wide robust interval, the scaling experiment, the failure-case section; and the compute budget, the pilot run, the schedule order, and the frozen-protocol changelog. Load at STAGE 5.

> **The arc is one frozen protocol.** Seven stages — matrix · firewall · instances · baselines · stats · ablation · freeze — turn the surviving method into evidence a reviewer believes: the matrix and firewall fix what counts as evidence and keep exploration out of it; instances, baselines, stats, and ablation specify the evidence-gathering; freeze totals the cost, pilots the pipeline, and locks the protocol. `ledger` gates all seven below; the full-scale run and the result analysis are the next steps.

---

## STAGE 0 — Matrix (map claims to experiments, write the verdicts first)

Open **[references/matrix-and-firewall.md](references/matrix-and-firewall.md)**. Before designing any experiment, decide what each one is *for*.

- **Build the claim-evidence matrix, checked both ways.** Map the two or three claims (from crucible's spec) to the experiments that support them. A claim with no experiment gets one added or gets deleted; an experiment serving no claim is not run (the saved machine-hours are the point). This document becomes the paper's experiments chapter and the reproduction README — one investment, three returns.
- **Write the verdicts before the data.** For each claim, write now what counts as SUPPORT ("median beats all baselines on the main table *and* a paired test is significant"), what counts as PARTIAL (wins only on one instance class → weaken the claim), and what counts as REFUTATION. Writing the negation condition before seeing data is the line between honest research and post-hoc story-fitting.

### GATE — clear before FIREWALL
1. `checklist check matrix matrix-bidirectional`
2. `checklist check matrix verdicts-pre-written`
3. `checklist verify matrix`

---

## STAGE 1 — Firewall (split exploration from confirmation)

Open **[references/matrix-and-firewall.md](references/matrix-and-firewall.md)** (the firewall section). The keystone — keep what you fished out of the evidence you publish.

- **Split the two phases, and never mix their data.** EXPLORATION (chaos testing, the MVP) generates *hypotheses* into an append-only notebook; its numbers never enter the paper, because a pattern you noticed after looking at many results may be noise. CONFIRMATION writes the believed hypotheses as claims with the pre-written verdicts and re-runs them on **new instances and new seeds** under the frozen protocol. Exploration finds what might be true; confirmation proves what is.
- **Stamp every run with provenance.** Even casual exploration runs auto-log git hash, full config, seed, and data version into the result file, so each notebook entry needs only a run ID to replay (the cure for "an amazing result three weeks ago I now can't reproduce"). Pair the append-only history with a **rewritable companion** (e.g. `state.md`) the agent periodically distills — current believed conclusions (each pointing to its evidence), open hypotheses, dead ends — and task the agent to flag **self-contradictions** across months and answer "have I tried this before?" before any new experiment.

### GATE — clear before INSTANCES
1. `checklist check firewall phases-split`
2. `checklist check firewall runs-provenance-stamped`
3. `checklist verify firewall`

---

## STAGE 2 — Instances (three layers, leakage guarded)

Open **[references/instances-and-baselines.md](references/instances-and-baselines.md)**. Pick the data so it can prove the claims and can't leak.

- **Build three layers.** LAYER 1 — public BENCHMARKS for comparability (not skippable); first defuse the trap by having the agent inventory how every paper uses the same-named benchmark, because the *same* benchmark often carries *different* preprocessing, splits, and metric conventions — state which you align to. LAYER 2 — REAL / industrial instances for realism (valued in OR). LAYER 3 — your own CONTROLLED generator for mechanism analysis, with difficulty knobs (scale, constraint tightness, randomness, structural parameters) for "performance vs. factor" curves; publish its code and seeds or reviewers suspect a favorable distribution.
- **Guard against leakage.** With a learning component: split time-series **by time**, never randomly; tune on a validation set only; touch the **test set once, at the very end**. Leakage is the silent failure that looks brilliant in development and collapses on deployment — and the agent won't flag it.

### GATE — clear before BASELINES
1. `checklist check instances instances-three-layer`
2. `checklist check instances leakage-guarded`
3. `checklist verify instances`

---

## STAGE 3 — Baselines (four classes, fair by protocol)

Open **[references/instances-and-baselines.md](references/instances-and-baselines.md)** (the baselines section). The most-attacked part of review — nail it in writing.

- **Include four classes.** The recent strong SOTA (MANDATORY — beating only old methods convinces no one); one or two classic strong methods (the consensus reference frame); a simple/brute baseline (greedy, random, or brute-force-with-more-compute — it calibrates the difficulty floor; beating it only a little means no story); and your own ablation versions.
- **Fix the fairness protocol.** Same hardware and time budget for all; prefer the authors' original code and report your reproduced number **side by side** with the claimed one; the **same tuning budget** for every method including yours (same search space, budget, procedure — "the baseline used defaults" is self-sabotage, and tuning each baseline is an agent batch job); and have the agent compile and disclose a table of the baselines' original-setting differences (hardware, time limit, preprocessing) in an appendix, before a reviewer raises them.

### GATE — clear before STATS
1. `checklist check baselines baselines-four-classes`
2. `checklist check baselines fairness-protocol-fixed`
3. `checklist verify baselines`

---

## STAGE 4 — Stats (metrics and a statistics protocol that survives scrutiny)

Open **[references/metrics-and-statistics.md](references/metrics-and-statistics.md)**. Compare by numbers that mean something, not by eyeballing.

- **Split primary and secondary metrics.** PRIMARY tied to the core claims (solution quality, optimality gap, objective); SECONDARY recording the cost (run time, memory, convergence). For OR / optimization across many methods and instances, a **performance profile** (Dolan-Moré curve) is the field's standard language — one figure for three tables.
- **Specify the statistics, don't improvise.** Set seeds/repeats from a **variance estimate** in the pilot (raise where variance is high); report mean±std, or median+IQR when skewed; use a **paired** test (paired Wilcoxon — your method and a baseline score on the *same* instances, far more sensitive than mixing two piles); apply a **multiple-comparison correction** (Holm / Bonferroni) when comparing several methods; and report the **effect size**, not just the p-value ("significant but 0.4% faster" and "significant and 15% faster" are two papers). Time cleanly: exclude IO and one-time compilation, run decisive comparisons serially or on an exclusive node, record the hardware.

### GATE — clear before ABLATION
1. `checklist check stats metrics-primary-secondary`
2. `checklist check stats stats-protocol-sound`
3. `checklist verify stats`

---

## STAGE 5 — Ablation (attribution, sensitivity, and honest failure)

Open **[references/ablation-sensitivity-budget.md](references/ablation-sensitivity-budget.md)**. Plan the experiments that attribute the gain and bound the method.

- **Plan ablation, sensitivity, and scaling.** The ABLATION table reuses crucible's pre-wired switches and three null doubles (off / random / cheap-heuristic), each combination run under the *same* protocol/instances/seeds; with many components use "full minus one" and "baseline plus one," not the full grid. The SENSITIVITY scan sweeps the two or three most critical hyperparameters on the controlled generator to show a **wide robust interval** ("under 3% across two orders of magnitude" beats "tuned to the optimum," which signals fragility). The SCALING experiment follows the scale knob to verify the complexity analysis.
- **Plan the failure-case analysis.** Design experiments that show *where the method fails and why* (usually where an assumption is violated) — a small amount of paper space bought for a large amount of reviewer trust, and exactly what a careful reviewer looks for to believe the rest.

### GATE — clear before FREEZE
1. `checklist check ablation ablation-and-sensitivity-planned`
2. `checklist check ablation failure-analysis-planned`
3. `checklist verify ablation`

---

## STAGE 6 — Freeze (budget it, pilot it, lock it)

Open **[references/ablation-sensitivity-budget.md](references/ablation-sensitivity-budget.md)** (the budget section). Total the cost and lock the protocol before the main run.

- **Account the budget and pilot the pipeline.** Total = methods × instances × seeds × per-run time. Over budget is normal — and the point: cut **before** the run (drop seeds, sample instances, trim a secondary sweep), not mid-run when you're forced to cut the *main* experiment. Run a small **pilot** first to validate the whole chain — submit, monitor, retry-on-failure, persist, auto-summarize — *not* to read the numbers; then scale up in order: main table → ablation → sensitivity → extension. The agent operates (submit / watch / auto-retry / summarize); you audit the protocol and investigate anomalies (a too-good number → feasibility-and-leakage check first).
- **Freeze the protocol with a changelog.** Once finalized, freeze it. A genuine mid-experiment change (a flawed benchmark, an ill-defined metric) is fine — but the only thing separating an honest adjustment from p-hacking is a **paper trail**: an append-only changelog of what changed, why, and after seeing which results. That changelog is your evidence if a reviewer questions the setup.

### FINAL GATE — the protocol is frozen
1. `checklist check freeze budget-accounted-and-piloted`
2. `checklist check freeze protocol-frozen-with-changelog`
3. `checklist verify freeze`
4. `checklist show` — confirm all **seven** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`ledger` is the **experiment-design lens**, held over the surviving method to produce evidence that survives review. Its seven stages are one arc against one enemy — **a fluent, good-looking evaluation that a reviewer (or a replication) exposes as p-hacked, leaked, or unfair.** The matrix (0) and firewall (1) decide what counts as evidence and keep the fished-out patterns of exploration out of it; instances (2), baselines (3), stats (4), and ablation (5) specify how the evidence is gathered, fairly and significantly; freeze (6) totals the cost, pilots the pipeline, and locks the protocol with an honest changelog. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: write the verdicts before the data, firewall exploration from confirmation, and treat a too-good number as a bug until proven a result.

It pairs with its siblings without duplicating them. Inside `inquiry`, [crucible](../crucible/SKILL.md) hands it a surviving method with small-scale empirical evidence and pre-wired ablation switches (crucible's tournament was *exploration* — a fast race to a survivor; ledger runs the frozen *confirmation*), and its claims are crucible's spec made into a matrix; [prospect](../prospect/SKILL.md) supplied the reproduced baselines this protocol compares against. The full-scale run and the result analysis (statistical tests, tables, figures, the honest write-up of what the numbers show) are the next steps the suite will cover. And it routes to the engineering suite when the harness becomes real code: `assay` tests the experiment pipeline, `gauge` keeps its signal trustworthy and un-fakeable, `plumb` keeps it legible, `stationkeeping` runs the long compute jobs. For an agent the lever is the same as everywhere in the suite: it will hand you a leaked split, an unfair default-tuned baseline, and a too-good number presented as a win — feeling none of the future desk-reject or failed replication — so the evaluation must be **pre-registered, firewalled, and gated**, with the protocol frozen before the data is seen.

## Anti-patterns (use as a pre-flight checklist)

- **Running experiments first, then choosing the story** — that is p-hacking; write the protocol and the verdicts before the main run.
- **A claim with no experiment, or an experiment with no claim** — check the matrix both ways: add the experiment, delete the claim, or don't run the experiment.
- **Setting "what counts as success" after seeing results** — write support / partial / refutation conditions before the data.
- **Letting exploration numbers into the paper** — a pattern noticed after the fact may be noise; re-confirm on fresh seeds and instances under the frozen protocol.
- **Unreproducible exploration** — stamp every run with git hash / config / seed / data version, or "the amazing result I can't reproduce" is gone for good.
- **A write-only notebook** — append-only is right, but pair it with a distilled, rewritable companion and have the agent sweep it for self-contradiction.
- **Aligning to a benchmark without checking its conventions** — the same benchmark carries different preprocessing and splits across papers; state which you match.
- **Random-splitting time-series, or tuning on the test set** — data leakage looks brilliant in dev and collapses live; split by time, touch test once at the end.
- **Omitting the recent strong SOTA** — the single most common fatal flaw; beating only old or simple baselines is no story.
- **Default-tuned baselines** — self-sabotage; give every method the same tuning budget and procedure, and disclose the settings-diff table.
- **Eyeballing the comparison** — use a paired test, correct for multiple comparisons, and report effect size, not just "it's bigger" or a bare p-value.
- **One all-on ablation** — show a cheap substitute can't match it; with many components use full-minus-one and baseline-plus-one, not the grid.
- **Tuning to a single optimum** — a wide robust interval convinces; a knife-edge optimum signals fragility.
- **Hiding the failure cases** — a deliberate failure-analysis section buys reviewer trust; design experiments to find where the method breaks.
- **Discovering you're over budget mid-run** — total methods × instances × seeds × time first and cut before running, never cut the main experiment under duress.
- **Skipping the pilot run** — pilot the whole submit→retry→persist→summarize chain before scaling, or you debug the pipeline on the expensive runs.
- **Changing the frozen protocol with no paper trail** — a logged change is honest, a silent one is p-hacking; append every change with what / why / after-which-results.
- **Celebrating a too-good number** — it's a feasibility or leakage bug until proven otherwise; investigate before you believe.
- **Skipping a GATE** — and remember the cheapest evaluation failure is the leaked split you caught before the run, not the retraction after.

---
name: reckoning
description: >
  The results-analysis lens: turn a finished results store into settled claims,
  mechanism evidence, and paper-grade figures — for any field running experiments to
  publish (ML, optimization, operations research, systems). Use when the runs are done
  and you are analyzing the results, or stress-testing an analysis. The one shift:
  analysis is NOT "compute a mean and see who is bigger" — it is audit, attribution, and
  the language of evidence. You audit before you read (a too-good number is a bug until
  proven otherwise); you prove WHY the method wins with mechanism probes; and you defend
  against the garden of forking
  paths, which the agent era amplifies because cheap experiments make cheating cheap.
  Triggers on "analyze the results", "read the main table / the
  ablation", "is this result significant / real / statistical test / effect size",
  "which is better", "make the figures / plots", "interpret these numbers / why does my
  method work", "the result looks too good", "review my results / write up".
argument-hint: "[the results to analyze, or the analysis/claim/figure you're stuck on]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# reckoning

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The runs are done; the numbers are on disk. `reckoning` is the lens you hold over the **results** — the step where data becomes settled claims, an explanation of *why*, and figures a reviewer reads in three seconds. It is the fifth skill of the `inquiry` suite: it owns step five of doing computational research — *analyzing the results until every claim has a verdict and the win has a proven cause.* It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — analysis is audit, attribution, and the language of evidence, not "compute a mean and see who is bigger".** Three things separate this from arithmetic. First, you **audit before you read**: a too-good number, an outlier, anything surprising is a *bug or an infeasible solution* until it survives that suspicion — never a breakthrough on first sight. Second, you prove **why** the method wins with **mechanism probes** — checkable predictions that are *not the main result itself* — because winning the table only shows the method *works*, not that it works *for the reason you claim*; this is the dividing line between a publishable paper and a strong one. Third, you defend against the **garden of forking paths** — the danger the agent era *amplifies*, because when experiments are cheap, unconscious cheating is cheap, and every path you might wander down "passes its tests". The arc is: *audit the data → read the distribution and slices → interpret the ablation → probe the mechanism → draw the failure boundary → settle every claim → red-team and render.*

**The agent is the means, not the oracle.** Here it has three jobs: the **auditor** (run the mechanical pre-read checklist and report), the **probe runner** (build the counterfactual instances, sweep the structure knob, batch the specification multiverse), and the **adversarial reviewer** (attack your claims and figures from separated roles). It is *not* the source of truth and *not* the judge of what counts. Its gradient points at pleasing you — left soft it confirms your story, and its "review" decays into universally-true platitudes ("the experiments could be more thorough"). So the red-team is run as a *system* (separated roles, fresh sessions, real-review calibration), and the mechanism question is yours, because an agent will happily call a coincidence a cause.

**What you cannot delegate — three judgments.** The pipeline parallelizes the labor, but three points stay yours: **(1) what the unit of analysis is** — instance, not instance×seed; get this wrong and a tenfold-inflated `n` crushes every p-value into false significance; **(2) what prediction the mechanism implies** — the probe only has force if *you* derive a consequence that is not the win itself; **(3) which claims to settle how** — supported, revised, or dropped, including the honesty to conditionalize or delete a claim that confirmation shrank. Outsource these and you have automated a confident, well-formatted wrong conclusion.

**What "done" looks like — the paper already exists in pieces, not "I made some plots".** Analysis is over when: **every claim has a verdict** and the settling is recorded; **the mechanism explanation has at least two probes** behind it; **the failure boundary is characterized**; and **every figure is script-generated** and has survived the red-team. At that point the paper *exists* — the claims are its argument, the protocol is its experiments section, the probes are its discussion, the difference table is its related work. If you have those, stop analyzing. "I made some plots and the method wins" is not the terminus.

**Speak the user's language.** Most calls here are the user's to own — whether a 5% win is "wins everywhere" or "wins on a slice", whether a probe's miss kills the story, whether a shrunk effect should be downgraded or dropped. Read their field fluency and gloss a term on first use (the *unit of analysis / pseudo-replication*, the *shifted geometric mean*, a *performance profile*, a *mechanism probe*, the *forking garden*, *multiverse analysis*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared — and the claims are theirs to settle.

**Read [references/why-audit-not-celebrate.md](references/why-audit-not-celebrate.md) first** — the must-be-told foundation: why analysis is audit-and-attribution not mean-comparison, the bug-first hypothesis, mechanism probes as the publishable/strong dividing line, the forking garden amplified in the agent era (and the multiverse turn that flips the same compute from cheating-engine to robustness-proof), the agent as adversarial reader, and the three non-delegable judgments. It is the key that makes every stage below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-audit-not-celebrate.md](references/why-audit-not-celebrate.md)** — the foundation: the audit-attribution-evidence reframe, the bug-first hypothesis for any surprising number, mechanism probes as the dividing line, the forking-garden danger and its multiverse inversion, the agent as adversarial reader (and its platitude failure), and the three non-delegable judgments. Load at STAGE 0.
- [references/distribution-and-statistics.md](references/distribution-and-statistics.md) — reading the numbers right: the mean lies (distribution + paired differences + slices), the performance profile, the five statistical pitfalls (pseudo-replication, censoring/survivor bias, dimensional bullying / shifted geometric mean, performance-profile edges, slice multiple-comparison), effect size beside p, and the three ablation-reading traps (interaction, scale-drift, counterintuitive). Load at STAGE 1-2.
- [references/mechanism-probes.md](references/mechanism-probes.md) — proving WHY: the not-identical-to-the-main-result rule, the four probe types in depth (dose-response, counterfactual destruction, intermediate-quantity, transfer prediction — with the negative half as the strongest evidence), and the failure boundary as the transfer probe's negative half. Load at STAGE 3-4.
- [references/forking-garden-and-redteam.md](references/forking-garden-and-redteam.md) — settling and defending: the garden of forking paths (researcher degrees of freedom, the agent-era amplification, the red line, multiverse analysis), the graded response when confirmation overturns exploration, the six-practice systematized agent red-team, and figure utilitarianism (one point per figure). Load at STAGE 5-6.

> **The pipeline is one arc.** Seven stages — audit · distribution · ablation · mechanism · boundary · verdict · redteam — turn a results store into a paper that already exists in pieces. Auditing and distribution-reading establish *what is true*; ablation, mechanism and boundary establish *why and where*; verdict settles every claim and redteam makes the evidence legible and attacks it. `reckoning` gates all seven below.

---

## STAGE 0 — Audit (count before you read)

Open **[references/why-audit-not-celebrate.md](references/why-audit-not-celebrate.md)**. Internalize *audit before you celebrate* and the *bug-first hypothesis* before you look at who won.

- **Run the mechanical pre-read audit — hand it to the agent.** Before reading who won: is task completion 100%; are failures **concentrated** in some method × instance cell (concentration is itself a finding); is every row's version tag consistent across the table; do the key magnitudes match exploration and the pilot. Skipping this and celebrating — then finding during writing that a column came from a silent bug — is the most classic tragedy of a research career.
- **Treat every surprising number as a bug first.** A too-good result, an outlier, anything surprising: the **first hypothesis is an implementation error, an infeasible solution that slipped the check, or a mis-specified instance** — *not* a genius result. Only after a number survives that suspicion is it allowed to be exciting. (This is the analysis-side echo of forge's independent feasibility checker.)

### GATE — clear before DISTRIBUTION
1. `checklist check audit count-before-read`
2. `checklist check audit suspicious-is-bug-first`
3. `checklist verify audit`

---

## STAGE 1 — Distribution (the mean lies; read the spread and the slices)

Open **[references/distribution-and-statistics.md](references/distribution-and-statistics.md)**. Go past the average to the distribution, the slices, and statistics done right.

- **Read the distribution and slice it.** A 5% average win can be "wins a little everywhere" or "ties on 90%, wins big on 10%" — different papers, the latter often more valuable (it points at a characterizable applicable condition). Plot the per-instance **paired difference** as a distribution; then **slice by feature** — scale, constraint-tightness, instance class — to answer *where* you win and lose. For OR, add a **performance profile** (Dolan-Moré), the community's shared language.
- **Do the statistics right — guard the five pitfalls.** The independence unit is the **instance**, not instance×seed (aggregate seeds within an instance first, then test across instances — else the inflated `n` crushes the p-values into false significance); never drop timed-out runs (report **solve-rate** separately, compare time on the solved intersection, penalize with a stated convention like PAR10); don't arithmetic-mean raw objectives across scales (normalize, or use the **shifted geometric mean**); remember a performance profile's shape depends on the method pool (not comparable across papers; you may not delete a strong baseline to flatter your curve); and pre-declared slices are confirmatory while mid-analysis slices are exploratory. Report **effect size beside every p-value** — p says the difference is real, effect size says whether to care.

### GATE — clear before ABLATION
1. `checklist check distribution distribution-and-slices`
2. `checklist check distribution statistics-done-right`
3. `checklist verify distribution`

---

## STAGE 2 — Ablation (interpret the table, don't just tabulate it)

Open **[references/distribution-and-statistics.md](references/distribution-and-statistics.md)** (the ablation-traps section). The ablation table is read for what it *means*, against three traps.

- **Read the ablation against its three traps.** **(1) Interaction** — if removing A alone or B alone barely hurts but removing both collapses, the honest claim is "A and B provide *redundant* protection", not "both contribute significantly". **(2) Scale-drift** — a component useless on small instances but critical on large ones must be ablated at **two scale tiers**, or the single-tier conclusion misleads. **(3) Counterintuitive** — your proudest component ablates to a slight *improvement*: this is a gold mine, not a nuisance; chase it to either an implementation bug or a wrong understanding of the mechanism, both far more informative than "all as expected". Every anomalous cell earns a logged hypothesis in the 历程.

### GATE — clear before MECHANISM
1. `checklist check ablation ablation-traps-read`
2. `checklist verify ablation`

---

## STAGE 3 — Mechanism (prove WHY, not just THAT)

Open **[references/mechanism-probes.md](references/mechanism-probes.md)**. Winning the table shows the method works; the probes show it works *for the reason you claim*.

- **Derive a prediction that is not the main result.** From the mechanism explanation M, derive a checkable prediction P that is **not the win itself** — "the method is better" cannot evidence "the mechanism holds", since the win is exactly what M is invoked to explain. And the probe's measured quantity must not be a mathematical relative of the main metric, or the two "evidences" share one source. This is the line between a publishable paper and a strong one.
- **Stand the explanation on at least two probes.** Draw from the four types (increasing strength): **dose-response** (sweep the exploited structure from zero to strong; the advantage should rise monotonically and vanish at zero — a clean monotone curve beats a single point by an order of magnitude); **counterfactual destruction** (method untouched, break the structure *in the data*; the advantage should disappear — higher-grade than component ablation); **intermediate-quantity** (open the black box; an internal quantity aligns with a ground truth M predicts); **transfer prediction** (the strongest — effective on another problem sharing the structure, mediocre where it's absent; the *negative* half, predicting your own failure and seeing it land, is the highest-grade evidence there is). A probe that **misses** while the table still wins means the method works but the story is wrong — fix the story, never bury the miss.

### GATE — clear before BOUNDARY
1. `checklist check mechanism probes-not-identical-to-main-result`
2. `checklist check mechanism two-probes-minimum`
3. `checklist verify mechanism`

---

## STAGE 4 — Boundary (find where you lose, first)

Open **[references/mechanism-probes.md](references/mechanism-probes.md)** (the failure-boundary section). Hunt your own failure before the reviewer does.

- **Characterize the failure boundary as a condition.** Actively find the slices where the method loses and write the boundary as a conditional — "when constraint-tightness exceeds X, the advantage disappears" — then put it in limitations. This is **pre-emption, not weakness**: a reviewer *will* hunt for where you lose, so finding it first — and best, connecting it to the mechanism (the regime is exactly where the mechanism's assumption breaks) — turns a potential desk-reject into evidence you understand the method deeply. The transfer probe's negative half *is* this boundary: one experiment, two uses.

### GATE — clear before VERDICT
1. `checklist check boundary failure-edge-characterized`
2. `checklist verify boundary`

---

## STAGE 5 — Verdict (settle every claim; defend the forking garden)

Open **[references/forking-garden-and-redteam.md](references/forking-garden-and-redteam.md)**. Each claim gets a definite verdict, and the analysis is kept honest against the garden of forking paths.

- **Settle every claim — including the honesty to revise or drop.** Each claim in the matrix resolves to **supported / revised / dropped**, and the settling is recorded. When confirmation contradicts an exploration finding (the exciting effect shrinks or vanishes on fresh seeds): still-significant-but-smaller → **downgrade the wording**; only-in-a-slice → **conditionalize** (often a sharper paper); gone → **delete** and go back to method design or the next variant. An honestly-revised claim is a stronger paper than a defended false one.
- **Defend the garden of forking paths — and flip the compute.** The red line: **never invent a new story from the confirmation data and declare it validated on that same data** — any pattern found while digging is a *new hypothesis* needing a fresh batch; the append-only 历程's timestamps make "did I hypothesize this before or after seeing the data" auditable. Where a choice is genuinely arbitrary (mean vs median), don't choose — run **all** reasonable specifications (multiverse / specification-curve) and report "the conclusion holds under 95% of reasonable paths". The agent's compute dividend is spent proving every path converges, not finding the prettiest one.

### GATE — clear before REDTEAM
1. `checklist check verdict every-claim-settled`
2. `checklist check verdict forking-garden-disciplined`
3. `checklist verify verdict`

---

## STAGE 6 — Redteam (make the evidence legible, then attack it)

Open **[references/forking-garden-and-redteam.md](references/forking-garden-and-redteam.md)** (the red-team and figure sections). Render each figure to carry one point, then turn a hostile agent loose on the whole thing.

- **Run the agent red-team as a system.** Not "take a look" — the agent defaults to polite platitudes. Use **separated roles in fresh sessions** (a statistics reviewer, a domain veteran fed the near-neighbor PDFs, a reproduction reviewer who actually runs the README clean, a story reviewer on the three-second test); **calibrate** with the venue's real review form and real public reviews; **grade the intensity** ("at most three fatal flaws ranked by reject-probability", then in a new session "you have decided to reject — write the most unanswerable rejection"); give **concrete targets** (an alternative explanation per claim, a way each figure misleads, the convention behind each bold number, a search for missed near-neighbor work); and **defend the known failure modes** (confident prose lowers its criticism — review a neutralized version; long sessions drift onto your side — every review is a new session). What it *cannot* judge — whether the problem matters, whether the direction has taste — stays with human reviewers.
- **Make every figure carry exactly one point.** One information point per figure, stateable in one sentence ("Figure 3: our advantage grows as instances scale") — a figure that fails that sentence is deleted. Self-contained captions; bold the best value, mean±std, significant digits matched to precision; confidence bands not bare means; honest axes with truncation marked. Every figure's generation script joins forge's one-command regeneration chain, so "the reviewer wants the figure changed" is a three-minute edit. The agent drafts; you own the one-point list each figure must carry.

### FINAL GATE — the reckoning is settled
1. `checklist check redteam adversarial-review-systematized`
2. `checklist check redteam figures-carry-one-point`
3. `checklist verify redteam`
4. `checklist show` — confirm all **seven** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`reckoning` is the **results-analysis lens**, held over a project once the runs are done. Its seven stages are one arc against one enemy — **a confident conclusion that the data does not actually support** (a silent bug, an inflated p-value, a coincidence dressed as a cause, a story dredged from the noise). Auditing (0) refuses to celebrate before counting; distribution (1) reads the spread and slices with statistics that don't lie; ablation (2) interprets the table against its traps; mechanism (3) proves *why* with predictions that aren't the win itself; boundary (4) finds the failure first; verdict (5) settles every claim and defends the forking garden; redteam (6) makes the evidence legible and turns a hostile agent on it. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: audit before you trust, prove the cause not just the effect, and spend the agent's cheap compute proving every analysis path converges rather than hunting the one that flatters you.

It pairs with its siblings without duplicating them. Inside `inquiry`, `reckoning` owns step five — *analyze until every claim has a verdict and a cause*; it takes from `forge` a results store where every number is on disk and regenerable (so analysis reads evidence rather than chasing it), it enforces the exploration/confirmation firewall `ledger` designed (the red line against dredging a story from confirmation data), and it leaves the writing step a paper that already exists in pieces — claims as argument, protocol as method, probes as discussion. And it routes to the engineering suite when the analysis turns to *code*: `assay` tests the analysis scripts, `gauge` and `plumb` watch their signal and craft. For an agent the lever is the same as everywhere in the suite: it will read a mean as a verdict, call a coincidence a mechanism, dredge a fresh story from the same data and pronounce it confirmed, and "review" your paper with comfortable platitudes — feeling none of the future rebuttal or failed replication — so the analysis must be **audited, probed, firewalled, and gated**, with the claims settled to verdicts and the figures survived a systematized attack.

## Anti-patterns (use as a pre-flight checklist)

- **Celebrating before auditing** — run the mechanical pre-read checklist first; the silent bug found during writing is the classic tragedy.
- **Reading a surprising number as a breakthrough** — the first hypothesis for any too-good result is a bug, an infeasible solution, or a mis-specified instance.
- **Reporting the mean alone** — the mean lies; read the paired-difference distribution and slice by feature to find *where* you win.
- **Pseudo-replication** — the unit of analysis is the instance, not instance×seed; aggregate seeds first or an inflated `n` manufactures false significance.
- **Dropping the timeouts** — that is survivor bias on the hardest instances; report solve-rate separately and compare time on the solved intersection.
- **Arithmetic-meaning across scales** — the biggest instances dictate the average; normalize or use the shifted geometric mean.
- **Deleting a strong baseline to flatter a performance profile** — the curve depends on the method pool and a replication check catches the omission.
- **Mistaking redundancy for double significance** — if A and B each ablate harmlessly but both together collapse, claim redundant protection, not two significant contributions.
- **Single-tier ablation** — a component's value drifts with scale; ablate at two tiers before concluding.
- **Burying a counterintuitive ablation** — your proudest component improving when removed is a gold mine; chase it to the bug or the wrong mechanism story.
- **Calling the win evidence of the mechanism** — the win is what the mechanism explains; prove WHY with a probe that is not the main result.
- **Standing a mechanism on one probe** — use at least two of the four types; the negative transfer prediction (predicting your own failure) is the strongest.
- **Burying a probe that missed** — a miss while the table still wins means the story is wrong; fix the story, don't hide the miss.
- **Hiding where you lose** — characterize the failure boundary first and connect it to the mechanism; pre-emption beats a reviewer's discovery.
- **Defending a claim confirmation shrank** — downgrade, conditionalize, or drop it honestly; a revised claim is a stronger paper than a defended false one.
- **Dredging a story from the confirmation data** — any pattern found while digging is a new hypothesis needing fresh data; the 历程 timestamps keep you honest.
- **Spending cheap compute on the prettiest path** — run the multiverse and prove the conclusion holds across reasonable analysis paths instead.
- **Asking the agent to "take a look"** — run a systematized red-team: separated roles, fresh sessions, real-review calibration, graded intensity, concrete targets.
- **One figure, many points** — each figure carries one sentence-statable point or it is deleted; script every figure into the regeneration chain.
- **Outsourcing the three judgments** — the unit of analysis, the mechanism's prediction, and how to settle each claim are yours; automating them formats a confident wrong answer.
- **Skipping a GATE** — and remember the cheapest analysis failure is the false claim you caught in audit instead of in rebuttal.

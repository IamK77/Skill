# Ablation, Sensitivity & Freeze — bound the method, lock the protocol (STAGE 5-6)

This reference is the depth behind **STAGE 5 — Ablation** and **STAGE 6 — Freeze** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 5 attributes the gain (which component earned it), bounds the method (where it stays robust, where it breaks, how it scales), and writes the failure cases down on purpose; STAGE 6 totals the compute, pilots the whole pipeline on a small scale, and freezes the protocol behind an append-only changelog. Together they close the experiment-design arc: every preceding stage *specified* evidence, and these two *bound the method and lock the contract* before a single full-scale machine-hour is spent. This file backs the four gated checks across those two stages — ablation's `ablation-and-sensitivity-planned` and `failure-analysis-planned`, and freeze's `budget-accounted-and-piloted` and `protocol-frozen-with-changelog`.

The governing fact, restated because every move below is judged against it:

> Total the compute before you run and cut *then*, not mid-run; pilot the whole pipeline before scaling; and freeze the protocol behind an append-only changelog — the only thing that separates an honest mid-experiment change from p-hacking.

---

## Where these two stages sit, and why in this order

By the time you arrive here the protocol already knows what it is measuring (matrix, STAGE 0), what counts as evidence versus exploration (firewall, STAGE 1), which instances it runs on (STAGE 2), which baselines it beats (STAGE 3), and which statistics decide the verdict (STAGE 4). What is *not* yet decided is two different kinds of question:

- **STAGE 5 asks "is the method real, and where does it stop being real?"** The main table can show your method winning while the win is an accident of one lucky component, a knife-edge hyperparameter, a scale you never leave, or an instance class you quietly avoided. Ablation, sensitivity, scaling, and failure analysis are the four experiments that turn "it wins" into "it wins *because of X*, *across this range*, *up to this scale*, *except on this class*." That last clause — the exception, stated by you — is what a careful reviewer reads first.
- **STAGE 6 asks "can I afford it, does the pipeline work, and is the contract locked?"** A protocol that is correct but unaffordable gets cut mid-run, and a mid-run cut lands on the *main* experiment because the cheap secondary sweeps already ran. A protocol that is affordable but un-piloted debugs its submit/retry/persist chain on the expensive runs. And a protocol that is frozen but un-logged cannot tell an honest mid-experiment fix apart from a story fished out of the data after the fact.

The order is load-bearing. You plan the full slate of STAGE-5 experiments *before* you budget, because the budget totals what STAGE 5 plus the main table actually cost — and you cut against that total *before* the pilot, *before* the run, while a cut still costs you a sensitivity sweep instead of a result.

The lever is the same as everywhere in `ledger`. The agent does the operator's labor in parallel — it stands up the ablation grid, sweeps the sensitivity axes, runs the scaling ladder, batch-submits and watches and retries and summarizes — but its gradient points at handing you a clean, winning, *pleasing* table. Left soft it reports the all-on ablation as proof the components matter, tunes silently to the one hyperparameter setting that wins, runs scaling only up to the size where the method still leads, omits the instance class where it falls over, and celebrates a too-good number instead of checking it. **The agent is the means — the experiment operator. It is never the oracle.** Three calls below are yours and stay yours: whether an ablation drop is an effect or noise, whether a number is too good to be real, and what the failure section honestly admits.

---

## STAGE 5, part 1 — the ablation table: attribute the gain (`ablation-and-sensitivity-planned`)

A method is a stack of components. The main table proves the *stack* wins; it says nothing about *which part of the stack earned the win*. The ablation table is the attribution experiment: hold everything else fixed and vary one component, so a drop in performance when the component is removed is the component's contribution, measured.

### Reuse crucible's switches and the three null doubles

You do not invent the ablation structure here. [crucible](../../crucible/SKILL.md) forged the method with its components already wired behind **switches** — each one flippable without touching the rest — precisely so that this stage is a configuration sweep, not a re-engineering job. STAGE 5 reuses those switches, and for each one runs it against the **three null doubles**:

| Null double | What it replaces the component with | What its result tells you |
|---|---|---|
| **off** | the component removed entirely; the stack runs without it | the raw contribution — does anything break or degrade when it's gone? |
| **random** | the component replaced by a random/uninformed stand-in of the same shape (a random policy where a learned one was, random pivot selection where a learned rule was) | whether the component's *structure* matters or only its *presence* — a learned router that ties a random router is not earning its keep |
| **cheap-heuristic** | the component replaced by the simplest sensible non-learned rule (nearest-neighbor, greedy, a fixed schedule) | the bar the clever component must clear to justify its cost — beating *off* and *random* but only tying the cheap heuristic means the heuristic is the honest design |

The three doubles answer three different skeptics. *off* answers "is this component load-bearing at all"; *random* answers "is it the structure or just the extra capacity"; *cheap-heuristic* answers "is the complexity worth it over the obvious simple thing." A component that survives all three has earned its place; one that only beats *off* is suspect.

The non-negotiable rule for the whole table:

> Every ablation row runs under the **same protocol, the same instances, and the same seeds** as the full method.

If the ablation runs on different instances or fresh seeds, the drop you measure is confounded with the instance/seed change and attributes nothing. Same instances, same seeds, one component varied — that is the only configuration where a difference is the component.

### When components are many — don't run the grid

With *k* independent switches the full combinatorial grid is 2^k configurations. At k=8 that is 256 runs × instances × seeds, and most of those cells answer no question anyone asked. Do not run the grid. Run **two linear routes** instead:

- **Full method, minus one component at a time** (leave-one-out). Start from the complete stack and knock out each component once. A large drop means that component is load-bearing *in the presence of all the others* — the interaction-aware contribution. This is the route reviewers trust most, because it measures each part inside the real method.
- **Baseline, plus one component at a time** (add-one-in). Start from the bare baseline and add each component alone. A large gain means that component carries weight *on its own*. This catches the component that does nothing in isolation but is essential in combination (small add-one-in, large leave-one-out → an interaction effect worth a sentence) and the component that helps alone but is redundant in the full stack (large add-one-in, small leave-one-out → drop it).

Two routes are 2k+1 runs instead of 2^k, and the pair of readings (leave-one-out vs. add-one-in) for each component tells you more than the grid: it separates standalone contribution from interaction contribution. Reserve a few targeted grid cells only for a specific interaction you have a reason to suspect — not the whole grid on spec.

crucible's three null doubles (off / random / cheap-heuristic) are the *substitution choice used within* each per-component step of these two routes, not an extra multiplicative axis on top of them: "minus one" defaults to the **identity** double (off), and you escalate that one component to its **cheap-heuristic** double only where you need the stronger "a cheap substitute can't match it" evidence (the necessity claim a reviewer challenges). The run count stays linear; the null double is which knob you turn, not another dimension to sweep.

### The judgment that stays yours: is a drop an effect or noise

The agent fills the table and reports the deltas. Whether a 0.6% drop when component X is removed is X's contribution or just seed noise is **your call, and it is the same paired-test discipline from STAGE 4 (the metrics-and-statistics reference)** — the ablation row and the full-method row are scored on the *same instances and seeds*, so the comparison is paired, and a drop inside the seed-to-seed variance is not an attribution. The agent will report every nonzero delta as a finding; you read it against the variance. An ablation table with no variance and no paired test is a pile of point estimates, and a reviewer knows it.

Copy-ready ablation-planning prompt:

```
Plan the ablation table for this method. The components, each already behind a
switch, are: <list components + their switch names from crucible's spec>.

For EACH component, plan three null-double rows under the SAME protocol,
instances, and seeds as the full method:
  - OFF: component removed.
  - RANDOM: component replaced by a random stand-in of the same shape.
  - CHEAP-HEURISTIC: component replaced by the simplest non-learned rule
    (name the rule explicitly per component).

Do NOT enumerate the full 2^k grid. Use two linear routes:
  - FULL-MINUS-ONE: full method, knock out each component once.
  - BASELINE-PLUS-ONE: bare baseline, add each component alone.

Output:
  1. A table: row = (route, component, null-double), columns = the metric +
     the delta vs. the reference config, with a column reserved for the paired
     test vs. the reference and one for the seed-to-seed std.
  2. The total run count (configs × instances × seeds) — I will budget against it.
  3. For any component, flag if you EXPECT off/random/cheap-heuristic to tie the
     full method (i.e. the component may not earn its place) — do not hide it.

Do not run anything yet. Report the plan and the count.
```

---

## STAGE 5, part 2 — the sensitivity scan: a wide robust interval beats a tuned optimum (`ablation-and-sensitivity-planned`)

Ablation attributes the gain across *components*; sensitivity bounds it across *hyperparameters*. The question a reviewer is really asking is: **did you find a robust method, or did you tune your way onto a knife-edge that a re-implementation will fall off?**

### Pick the critical two or three, sweep on the controlled generator

You do not sweep every hyperparameter — most don't matter and the sweep would dwarf the main table. Pick the **two or three most critical** ones (the learning rate and the regularization weight; the temperature and the rollout depth; the penalty coefficient and the neighborhood size) and sweep each across a wide range — ideally **two orders of magnitude** — on the **controlled generator** (LAYER 3 of the instance set; see the instances-and-baselines reference). The generator is the right venue because you control its difficulty knobs, so the sweep isolates the hyperparameter's effect from instance variation.

The result you want is counter-intuitive until you have seen a paper rejected for the opposite:

> "Performance varies under 3% across two orders of magnitude" is far more convincing than "we tuned carefully to the optimum."

A wide robust interval says the method works for a *range* of settings — anyone reproducing it will land inside the plateau. A sharp optimum says the headline number depends on a setting you happened to find, and signals **fragility**: the reviewer reads it as "this works once, on your machine, with your seed." A flat sensitivity curve is one of the cheapest pieces of trust you can buy. If the curve is *not* flat — if the method really does need a precise setting — that is itself a finding you must state plainly (it bounds the method honestly) rather than hide by reporting only the peak.

The agent's failure mode here is exact and predictable: asked to "show the method is robust," it sweeps a narrow range around the value it already knows wins and reports a flat line. **Command the wide range explicitly and have it report the *worst* point in the interval, not the best.** The honest claim is about the floor of the plateau, not its peak.

```
Plan a sensitivity scan on the controlled generator (fixed difficulty knobs:
<state them>). Sweep these critical hyperparameters, each independently:
  <param 1>: across <wide range, ideally 2 orders of magnitude>
  <param 2>: across <wide range>
  (<param 3> if a third is genuinely critical)

For each param, report the metric at every swept value with seed variance, and
explicitly report the WORST point in the interval, not just the best. State the
width of the interval over which performance stays within <e.g. 3%> of peak.
If no such wide interval exists, say so plainly — do not narrow the range to
manufacture a flat curve. Output the run count for budgeting.
```

---

## STAGE 5, part 3 — the scaling experiment: verify the complexity analysis (`ablation-and-sensitivity-planned`)

crucible's method came with a complexity analysis — a claim about how cost grows with problem size (this solver is near-linear in nodes; this policy's inference is O(n log n); this bound degrades as O(√n)). The scaling experiment is the empirical check of that claim, and it uses the controlled generator's **scale knob** to do it: run the method across a ladder of sizes and plot the measured cost (time, memory, or the metric) against size.

Two things the scaling experiment catches:

- **The complexity claim is wrong.** The analysis said near-linear; the curve bends quadratic at the sizes that matter. Better to find this in your own plot than in a reviewer's "the claimed complexity is not borne out by Fig. 4."
- **The method only wins in a regime you never leave.** Run the scaling ladder *past* the sizes where your method leads, not up to them. If the baseline overtakes you at 2× your largest tested size, a reviewer who tests that size will say so; you want to be the one who reported it. (This connects directly to the failure-case section below — "fails above scale S" is one of the most common honest failure clauses.)

Follow the generator's knob, plot measured-vs-predicted, and state where the empirical curve and the analysis agree and where they diverge. A scaling plot that matches the analysis is a strong, cheap confirmation; one that diverges is a finding you report, not a result you trim.

---

## STAGE 5, part 4 — the failure-case section: buy reviewer trust with paper space (`failure-analysis-planned`)

This is the section most papers omit and the one a careful reviewer looks for first. It is its own gated check (`failure-analysis-planned`) precisely because the agent's please-you gradient points hardest against it: nothing in "make the table win" suggests adding a section that says where the method *loses*.

> Deliberately design experiments to show **on which instance class the method does NOT work, and why** — usually the class where one of the method's assumptions is violated.

### Why volunteering the failure is the strong move

The trade is explicit and favorable:

> A small amount of paper space, bought for a large amount of reviewer trust.

A reviewer's default posture is suspicion: *what are they not showing me?* A method presented as winning everywhere reads as a method whose failures were hidden — and the reviewer's job is to go find them. A method that presents its own failure boundary — "here is the instance class where we degrade, here is the assumption that breaks there, here is the curve" — disarms that search. The reviewer who finds the failure *you already disclosed* trusts everything else; the reviewer who finds a failure *you hid* discounts the whole paper. You are spending half a page to convert the adversary into a reader.

### How to find the failure honestly

The failure usually lives where an **assumption is violated**. The method assumed low-rank structure in the cost matrix — build instances with full-rank costs and show the degradation. It assumed the demand distribution is light-tailed — feed it a heavy-tailed generator and watch the bound stop biting. It assumed the constraint graph is sparse — densify it. The controlled generator is again the venue: its knobs are exactly the assumption dials, so you turn each assumption off and measure where the method falls below the baseline. Then you state *why* — tie the degradation to the violated assumption, not just "it gets worse on hard instances."

The discipline is to design this **before** the run, as part of the protocol, so the failure cases are pre-registered claims with their own verdicts (the matrix from STAGE 0 has a row for them). A failure section discovered after the run and written to look deliberate is the same p-hacking the firewall exists to prevent, run in reverse.

```
Design the failure-case analysis. For each of the method's load-bearing
ASSUMPTIONS:
  <assumption 1, e.g. "cost matrix is approximately low-rank">
  <assumption 2, e.g. "demand is light-tailed">

Plan a controlled-generator instance class that VIOLATES that assumption (name
the knob and the setting). Predict, before running, where the method should
degrade and below which baseline. Output, per assumption:
  - the violating instance class and the generator knob/setting,
  - the metric to plot vs. the degree of violation,
  - the pre-stated point at which the method is expected to fall below
    <which baseline> — this is a matrix claim with its own verdict.

These rows go in the claim-evidence matrix as failure-boundary claims. Report
the plan and run count; do not run yet. Do NOT design these to look better than
they are — the value is in honestly locating the boundary.
```

The check `ablation-and-sensitivity-planned` is clear when the ablation table (switches × three null doubles, leave-one-out + add-one-in, same instances/seeds), the sensitivity scan (critical params, wide range, worst-point reported), and the scaling experiment (the generator's knob, run past the winning regime) are all planned with run counts. `failure-analysis-planned` is clear when at least one failure-boundary experiment exists per load-bearing assumption, pre-registered as a matrix claim with a verdict — not deferred to "we'll see what breaks."

---

## STAGE 6, part 1 — the compute budget: total it, then cut (`budget-accounted-and-piloted`)

You now have a complete slate of experiments: the main table, the ablation table, the sensitivity scan, the scaling ladder, the failure-case experiments. Before you run any of it at scale, total the compute.

> **Budget = methods × instances × seeds × per-run time** — summed across every experiment in the slate.

Total it honestly, per experiment, and add them up. The expected outcome is that you are **over budget** — and that is the protocol working, not failing:

> Coming out over budget is the normal case and is the protocol's value — it forces the cut **before** the run, not halfway through.

The whole reason to total the cost up front is to move the cut to the cheap end of the timeline. Cut now and you trade away the least valuable evidence on purpose. Cut mid-run and you are out of resources with the expensive runs unfinished, and the only thing left to cut is the **main experiment** — the one piece of evidence you cannot do without. The cuts you make *before* the run, in priority order, are the ones that cost the least:

- **Drop seeds** where the pilot showed low variance (the seed count comes from a variance estimate; STAGE 4 — the metrics-and-statistics reference). High-variance comparisons keep their seeds; low-variance ones can shed some.
- **Sample instances** — run the full method on the whole benchmark but the ablation and sensitivity on a representative subset, stated as such.
- **Trim a secondary sensitivity sweep** — the third hyperparameter, the widest scaling rungs, an extra null double on a component that clearly earns its place.

Note the asymmetry: every one of these cuts the *secondary* evidence and protects the main table. Mid-run, you have already spent the budget on the secondary runs and the main table is what's left exposed. Budgeting first inverts that, on purpose.

```
Total the compute budget for the full experiment slate. For EACH experiment
(main table, ablation, sensitivity, scaling, failure cases), compute:
  methods × instances × seeds × per-run wall-clock (use the pilot's per-run time)
and give a subtotal. Sum to a grand total in GPU-hours (or core-hours).

My budget ceiling is <state it: e.g. 2x A100 for 3 weeks>. If the total exceeds
it, propose cuts IN THIS PRIORITY ORDER, never cutting the main table:
  1. drop seeds where pilot variance is low (say which, by how much),
  2. sample instances for ablation/sensitivity (state the subset + that it's a subset),
  3. trim the lowest-value secondary sweep.
Output the before/after totals and the exact cut list. I approve the cuts.
```

---

## STAGE 6, part 2 — the pilot run: validate the chain, not the numbers (`budget-accounted-and-piloted`)

Before scaling, run a **small-scale pilot** — the whole experiment slate at tiny size (a few instances, two seeds, the smallest scale rung). Its purpose is precise and easy to get wrong:

> The pilot validates the whole **chain** — submit, monitor, retry-on-failure, persist, auto-summarize-into-a-table — **not** to look at the numbers.

The pilot is a pipeline test, not an experiment. You are checking that jobs submit and land on the right hardware, that a crashed job is detected and retried with the reason logged, that results persist with full provenance (git hash, config, seed, data version — the run-ID stamping from STAGE 1, the firewall), and that the persisted results auto-summarize into the comparison table you'll actually read. If any link in that chain is broken, you want to find it now, on runs that cost minutes, not on the expensive full-scale runs where a persistence bug loses a week of compute.

The discipline is to **not read the pilot's numbers as results.** The pilot ran on a handful of instances and two seeds; its numbers are statistically meaningless and — worse — reading them is a back-door violation of the firewall, because you'd be looking at data before the frozen confirmation run. The pilot answers exactly one question: *does the pipeline work end to end?* The variance estimate it produces feeds the seed count (a pipeline output, not a result); the numbers themselves you do not interpret.

Then scale up in a fixed order:

> **main table → ablation → sensitivity → extension.**

The main table runs first because it is the load-bearing evidence — if compute is going to run short, you want the headline result complete before anything else. Ablation second (it attributes the main table's gain). Sensitivity and scaling third (they bound it). Extensions last (they are the nice-to-haves that get cut first under pressure — and because they run last, cutting them costs nothing already spent).

---

## STAGE 6, part 3 — the agent as experiment operator (`budget-accounted-and-piloted`)

This is where the agent does its heaviest parallel labor and where the role split is sharpest. The agent is the **operator**:

- **batch-submit** the grid of (method × instance × seed) jobs;
- **monitor** the jobs and report status;
- **auto-retry failures, with the reason logged** — an out-of-memory job retried at lower batch size with that noted, a preempted job resubmitted, a genuinely broken config flagged rather than silently skipped;
- **persist** every result with full provenance, so each run replays from its run ID;
- **periodically summarize** the persisted results into the comparison table.

Your role shrinks to **two things the operator cannot do**:

1. **Audit the protocol** — confirm the frozen protocol is what's running (right instances, right seeds, right baselines, the failure cases included), not a drifted version the agent quietly "improved."
2. **Investigate anomalies** — and here the rule is absolute. A suspiciously-good number triggers a **feasibility-and-leakage check first, never a celebration.** The agent will report a too-good result as a triumph because its gradient points at pleasing you; the too-good number is, until proven otherwise, a bug — a leaked test set, a metric computed on the training instances, an off-by-one that scores the oracle. *Whether an anomaly is a bug or a result is the third non-delegable bet*, and it is exercised right here, on the operator's output. Celebrate after the leakage check clears, not before.

```
You are the experiment OPERATOR for this frozen protocol. Do NOT change the
protocol. Do NOT interpret results as good or bad — operate the pipeline.

1. SUBMIT the job grid: methods × instances × seeds as specified in the frozen
   protocol (paste/point to it). Respect the scale-up order:
   main table -> ablation -> sensitivity -> extension. Do not start a tier until
   the previous one is fully persisted.
2. MONITOR: report job status on a regular cadence (running / done / failed).
3. AUTO-RETRY failures, and LOG THE REASON for each retry (OOM, preemption,
   timeout, config error). After N retries on the same reason, STOP and flag it
   to me — do not silently skip a cell.
4. PERSIST every run with full provenance: git hash, full config, seed, data
   version -> a run ID. A result without provenance does not count as done.
5. SUMMARIZE the persisted results into the comparison table on a regular cadence
   (method × metric, with seed variance and the paired-test column ready).

Flag to me, do NOT act on, two things:
  - any number that looks TOO GOOD (better than the known optimum, a perfect
    score, a result that beats the upper bound) — flag for a feasibility-and-
    leakage check; do not celebrate it.
  - any cell that fails repeatedly for the same reason.
```

---

## STAGE 6, part 4 — freeze the protocol behind a changelog (`protocol-frozen-with-changelog`)

Once the protocol is finalized — matrix, firewall, instances, baselines, stats, ablation, budget, pilot all done — it is **frozen.** Freezing means the document does not change silently, and the confirmation run executes exactly what the frozen document says.

But experiments are not omniscient at design time. You will sometimes discover, mid-run, that the protocol genuinely needs changing — a benchmark turns out to be flawed (a leak, a corrupted instance, a mislabeled split), a metric turns out to be ill-defined (it's undefined on degenerate instances, or it rewards the wrong behavior). **This is normal and you should fix it.** The danger is not the change; the danger is the *indistinguishability* between an honest fix and a story fished out of the data:

> The only thing separating an honest adjustment from p-hacking is a **paper trail** — every change recorded in an append-only changelog stating *what changed, why, and after seeing which results it changed.*

That third field — *after seeing which results* — is the one that does the work, and the one the temptation is to leave out. "Changed the primary metric from mean to median because the distribution is skewed" is honest if you decided it before seeing the comparison and suspicious if you decided it after seeing that median wins and mean doesn't. The changelog forces you to write down the order of events, and the order of events is the whole question. An append-only changelog cannot be quietly back-dated; that is exactly why it is the artifact a reviewer can trust.

A changelog entry has three fields, always:

| Field | What it records | Why it's the line against p-hacking |
|---|---|---|
| **what changed** | the precise edit to the protocol (metric, instance set, baseline, seed count, verdict condition) | makes the change auditable — a reviewer sees the before and after |
| **why** | the genuine reason (benchmark flaw, ill-defined metric, infeasible budget) | distinguishes a forced fix from a convenience |
| **after seeing which results** | what data, if any, you had looked at when you decided | the load-bearing field: a change made before seeing the relevant results is honest; one made after is suspect, and the entry says which |

> That changelog is your evidence if a reviewer ever questions the experimental setup.

When a reviewer asks "why did you switch metrics halfway," the answer is the changelog entry, dated and append-only, showing the switch was made on instance-validity grounds before the headline comparison was run. Without it, you have only your word, after the fact, which is exactly what the reviewer's suspicion is calibrated against.

```
Maintain the protocol changelog as an APPEND-ONLY file. For every change to the
frozen protocol, append one entry with exactly three fields:
  WHAT: the precise edit (old value -> new value, which section).
  WHY: the genuine reason (e.g. benchmark instance #N is corrupted; metric M is
       undefined on degenerate instances).
  AFTER-SEEING: which results, if any, I had already looked at when deciding —
       state "none / pre-data" if the change was made before any confirmation
       results were seen.
Never edit or delete a past entry. Never make a protocol change without an entry.
If I ask for a change without giving the AFTER-SEEING field, ask me for it before
applying the change.
```

---

## The exit condition for step three

`ledger` closes — the experiment design is done, and the full-scale run can begin — when three things hold at once:

> The protocol document is **frozen**, the **pilot** run has exercised the full pipeline end to end, and the **compute budget balances.**

Each maps to a STAGE-6 check and each guards a distinct failure:

- **Frozen protocol with a changelog** (`protocol-frozen-with-changelog`) — the verdicts and conditions are locked, and any later change is logged with its three fields, so an honest fix never looks like p-hacking.
- **Piloted pipeline** (`budget-accounted-and-piloted`, the pilot half) — the submit → retry → persist → summarize chain ran end to end on tiny instances, so the expensive runs are not where you debug it.
- **Balanced budget** (`budget-accounted-and-piloted`, the budget half) — the total fits the ceiling because the cuts were made before the run, on the secondary evidence, with the main table protected.

When all three hold, the `FINAL GATE` clears (`checklist show` confirms all seven stages passed, `checklist done` clears the run) and what you carry out is a single frozen artifact: an experiment-protocol document that doubles as the paper's experiments chapter and the reproduction package's README. The full-scale confirmation run executes it; the result analysis interprets what it produced. Those are the next steps the suite covers — but the bet has already been made here, in writing, before the data: *this is what counts as evidence, this is what it costs, and this is the record of every time we changed our minds and why.*

---

**Cross-links:** [../SKILL.md](../SKILL.md) — the gated flight plan this depth serves (STAGE 5 Ablation, STAGE 6 Freeze, and the seven-stage arc they close). The ablation switches and null doubles reused here are forged in [../../crucible/SKILL.md](../../crucible/SKILL.md) (research step two — the method-design lens, whose tournament was *exploration*; this stage runs the frozen *confirmation*). The reproduced baselines the budget counts and the protocol compares against come from [../../prospect/SKILL.md](../../prospect/SKILL.md) (research step one — the literature-review lens). Within `ledger`, the ablation's paired-test discipline, the seed-count-from-variance, and the performance profile live in the STAGE-4 metrics-and-statistics reference; the controlled generator the sensitivity, scaling, and failure experiments all run on, and the leakage guards the too-good-number check protects, live in the STAGE-2/3 instances-and-baselines reference; the run-ID provenance the pilot validates and the firewall the pilot must not breach live in the STAGE-0/1 matrix-and-firewall reference.

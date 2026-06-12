# Distribution & Statistics — read the spread, not the mean (STAGES 1-2)

This reference is the depth behind **STAGE 1 — Distribution** and **STAGE 2 — Ablation** of the [../SKILL.md](../SKILL.md) pipeline. STAGE 1 is where the results store stops being a mean-of-means table and becomes a *distribution you read* — the paired differences, the slices, the performance profile — under statistics that survive a reviewer's test. STAGE 2 reads the ablation table for what it *means* rather than tabulating it. It backs three checks: `distribution-and-slices` (the win is read as a distribution and sliced by feature), `statistics-done-right` (the five pitfalls are guarded), and `ablation-traps-read` (the three ablation traps are interpreted). The single fact this stage hangs on:

> The mean lies. A 5% average win is not one result — it is "wins a little everywhere" or "ties on 90%, wins big on 10%," and those are different papers. Read the distribution and slice it; report effect size beside every p-value; and run the statistics on the right independence unit, or the win is an artifact of how you counted.

---

## Why the average is the wrong first number

Analysis here is audit and attribution, not "compute a mean and see who is bigger" — and the mean is the place that reframe bites first. A single average per method is a lossy compression that discards exactly the structure a paper is made of. Consider two methods that both report a 5% mean improvement over the baseline. One **wins a little everywhere** — a tight cloud of small per-instance gains. The other **ties on 90% of instances and wins big on the remaining 10%** — a spike of large gains on an identifiable subset, flat elsewhere. The mean is identical; the papers are not. The second is often the more valuable result, because a win concentrated on a slice points at a *characterizable applicable condition* — a statement of the form "this method is the one to use when instances are large / tightly constrained / of class X," which is a contribution a reviewer can use, where "5% better on average" is a number they have to take on faith.

The agent's role at this stage is the operator labor: it plots the distributions, computes the slices, runs the tests across a table of dozens of cells, draws the performance profile. That is what the experiment operator exists to do. But its gradient points at the clean flattering scalar — the single mean that reads as a win — and at the statistical default that inflates significance. Left to choose, it hands you a mean-of-means table with an uncorrected `p < 0.05` and no effect size, because that is the path of least resistance to a number that pleases. The discipline below removes the choices: it fixes *what* you read off the distribution and *which* statistic renders the verdict, so the agent is computing an analysis you specified, not selecting the one that looks best.

---

## Part 1 — The mean lies: read the distribution and the slices

### Plot the per-instance paired difference

Your method and a baseline were run on the **same instances**, so the natural unit is the per-instance **paired difference** — `your_value[i] − baseline_value[i]` (or the relative gap, see Pitfall 3). Plot the *distribution* of those differences, not their average: a boxplot, a histogram, or a violin. The distribution answers the question the mean buries — *is the win uniform or concentrated?* A tight cloud centered on a small positive value is "wins everywhere." A bimodal shape — a mass at zero and a spike of large positive differences — is "ties mostly, wins big on a slice." The shape *is* the result.

Reading the distribution also surfaces the sign structure a mean hides: a method with a positive mean can still *lose* on a third of instances, and that third is a finding (where does it lose, and why?), not a footnote. The mean of a difference that is +20 on a quarter of instances and −2 on the rest is positive and says nothing useful; the distribution says everything.

### Slice by instance feature

Once you see the win is concentrated, the next move is to *locate* it: **slice the paired differences by an instance feature** and read where you win and lose. The features are the structural axes of your benchmark:

- **scale** — instance size (nodes, variables, jobs, dimension);
- **constraint-tightness** — how binding the constraints are (a scheduling problem near its feasibility edge vs. a slack one);
- **instance class** — the generator family or real-world source (random vs. structured, one application domain vs. another).

Slicing turns "5% on average" into "the gain is entirely on large, tightly-constrained instances of class X, and is flat-to-negative on small slack ones" — the characterizable applicable condition. This is the single highest-value reading you do at STAGE 1, because it converts an average into a usable claim. (It also has a statistical cost; see Pitfall 5 — slicing is a multiple-comparison hazard, and *which* slices are confirmatory vs. exploratory must be decided correctly.)

### The performance profile — the field's shared language

For OR and optimization comparisons across **many methods on many instances**, the community already has a standard figure that compresses the whole many-methods × many-instances grid into one plot you can read: the **performance profile**, the Dolan-Moré curve. When you compare more than two or three solvers across a heterogeneous instance set, add a performance profile as the primary comparison figure — it is the shared language for exactly this comparison, and it makes your figure legible to anyone who reads that literature.

For each method *s* and instance *p*, take the *performance ratio* — that method's score on *p* divided by the best score any method achieved on *p* (for smaller-is-better metrics; invert otherwise). A ratio of 1 means *s* was best on *p*; 2 means twice the cost of the winner; a large cap means it failed *p*. The profile plots, per method, the cumulative fraction of instances solved within a factor τ of the best, against τ (often log-scaled from 1). The value at **τ = 1** is the method's outright-best rate (its win rate); the **right asymptote** is the fraction it ever solved (its coverage). A curve highest everywhere dominates; **curves that cross** tell the real story a mean erases — method A best on the easy majority (higher left), method B more robust on the hard tail (higher right). Its edges and abuses are Pitfall 4 below.

### Effect size beside every p-value

A p-value answers *"is the difference real?"* — it does **not** answer *"is it big enough to matter?"* With enough instances, a 0.4%-better method is statistically significant; so is a 15%-better one, with the same star. **"Significant but 0.4% faster" and "significant and 15% faster" are different papers.** So every significance claim carries an effect size next to it: the plain practical difference in the metric's own units ("15% lower mean gap," "2.3× faster median") whenever the metric has a meaningful scale, or a standardized effect size (e.g. matched-pairs rank-biserial correlation for a Wilcoxon, or the median per-instance difference with a confidence interval) when you need a scale-free number. **No starred p stands alone.** *p says the difference is real; effect size says whether it is worth caring about* — and the table must show both, or it tells the reader which paper this is only by accident.

---

## Part 2 — The five statistical pitfalls

The statistics follow the *frozen protocol* — the paired test, the correction, the reporting were chosen before the data (in `ledger`, the experiment-design stage), so the analysis here *executes* that protocol rather than improvising a test that flatters. The default for these paired, per-instance, usually-non-normal comparisons is the **paired Wilcoxon signed-rank test** — not a t-test, because solve times and optimality gaps are rarely normal — with **Holm** (or another multiple-comparison correction) applied across the family of methods or slices being compared. Five pitfalls turn a clean experiment into a false verdict; each has a fix.

### 1. Pseudo-replication — the independence unit is the instance, not instance × seed

This is the highest-leverage error at the stage, and the first non-delegable judgment: **what is the unit of analysis?** A randomized method run with 10 seeds on each of 50 instances produces 500 numbers. The seduction is to treat all 500 as independent samples and run the test on `n = 500`. They are not independent. **Ten seeds on one instance are ten repeated measurements of one object, not ten independent samples** — a hard instance is hard however you seed it, so those ten numbers are highly correlated. Flattening them treats correlated repeats as fresh evidence, **inflates n tenfold, and crushes the p-values** — manufacturing significance out of seed repetition.

**Fix: aggregate, then test.** First collapse seeds *within* an instance to one number — mean or median over seeds — giving one score per instance. Then run the paired test **across instances**, on the true independence unit, with the honest `n` (the instance count, here 50, not 500). Report the seed variance *separately*, as a stability metric — it is real information (how reproducible is the method run-to-run?), it just is not sample size. Mixed-effects models are the statistically fancy option that models instance and seed as separate variance components; "aggregate then test" is enough for most papers and is the default. Get this wrong and **every p-value in the paper is crushed by a tenfold-inflated `n`** — significance manufactured out of seed repetition — which is why the unit of analysis is yours to fix, not the agent's.

### 2. Censoring / survivor bias — the instances that time out

Some instances will hit the time limit and not finish. The tempting move is to drop them from the timing statistic — you have no finish time, so you exclude the row. This creates **survivor bias**: the dropped instances are the *hardest*, which is often exactly where methods differ most, so excluding them throws away the most discriminating evidence. It is worse when **your method times out more often than the baseline** — dropping the failures then quietly deletes your method's losses and flatters it, the timing version of survivorship.

**Fix, three parts.** Report **solve-rate as its own metric** — the fraction of instances each method finished within the limit is a first-class result, not a footnote, and it is where a coverage difference lives. Compare **time only on the intersection both methods solved** — the timing claim is honest only on instances where both produced a finish time. For a single combined metric that folds time and failure together, use a **stated penalty convention** — e.g. **PAR10**, which scores a timeout as ten times the time limit — declared in the protocol, not invented at write-up. And instances each method *uniquely* solved (one finished, the other timed out) are listed as **qualitative evidence** — they are the boundary between the methods and belong in the paper, not in the discard pile.

### 3. Dimensional bullying — the arithmetic mean a few giants dictate

Objective values and runtimes span orders of magnitude across a heterogeneous instance set — one instance's objective is in the millions, another's in single digits. An **arithmetic mean of raw values across such instances is dictated by the largest few**: the millions-scale instances drown out everything else, so the "mean objective" is really "the mean of the three biggest instances," and a method's rank can flip on a single giant. (In combinatorial optimization, a benchmark mixing tiny and huge instances makes this routine.)

**Fix, two options.** Either **normalize per-instance to a relative gap** — percent from best-known or from optimal — so every instance contributes on the same 0-to-something scale regardless of its raw magnitude; or use the **shifted geometric mean**. The geometric mean (the product of the values, *n*-th-rooted) resists scale differences because it averages *ratios*, not magnitudes, so no single large instance dominates; the **shift** — adding a small constant before taking the mean — prevents near-zero values from collapsing the whole product toward zero. The shifted geometric mean is the **MIP / solver community's de-facto standard** for aggregating across heterogeneous instances, which has a second payoff: using it makes your tables directly comparable to that literature.

### 4. Performance-profile edges — the curve depends on the pool

The performance profile is powerful and abusable, because **its curve shape depends on the method pool** it was computed against — the ratio is to *the best method present*, so adding or removing a method rescales everyone's ratios and moves every curve. Three consequences:

- **Profiles across papers are not comparable.** Two papers' profiles were computed against different pools, so the curves are on different implicit axes; you cannot read one paper's curve against another's.
- **You may not delete a strong baseline to "improve" your curve.** Dropping the method that was beating you on the easy instances lifts your τ = 1 value — a pure artifact of pool selection, and the red line of this stage. A replication check (re-running with the full declared pool) catches it, which is exactly why the pool is fixed in the protocol.
- **The metric must be comparable for the profile to mean anything.** Plot **time and quality as separate profiles**; do **not** invent a mixed metric (some weighted blend of runtime and gap) to get one curve — the weights are an unstated knob, and the blended ratio is uninterpretable.

### 5. Slice multiple-comparison — enough cuts and one is "significant"

Slicing by scale, then by tightness, then by class, then by their combinations, is itself a multiple-comparison machine: **make enough cuts and one of them will come up "significant" by chance** even when nothing is there. This is the garden of forking paths localized to the slicing step — the danger the cheap-experiment agent era amplifies, because slicing forty ways costs nothing.

**Fix: the confirmatory/exploratory split.** Slices you **pre-declared** — named in the protocol before the data, "we will test the scale and tightness slices" — are **confirmatory**: they are correct to test, and you report them *after the multiple-comparison correction* over the declared family (e.g. Holm). Slices you **invented mid-analysis** — "let me also cut by this feature I just thought of" — are **exploratory**: they are legitimate for generating hypotheses but must be **re-confirmed on new data** or explicitly **labelled post-hoc** in the writeup, never presented as if pre-declared. This is the same principle the **历程** (the append-only lab notebook) timestamp enforces everywhere in the suite: *when* you decided to look determines what the look can claim, and the timestamp is the only thing that can tell a confirmatory slice from a forked one after the fact.

---

## Part 3 — Reading the ablation: the three traps (STAGE 2)

An ablation table — the metric with each component removed in turn — is **read for what it means, not tabulated**. The same primary/secondary metrics and the same paired-test-and-correction protocol from STAGE 1 score every ablation row, so attribution is measured the way the headline win was. Three traps turn an ablation table into a wrong story.

### Trap 1 — Interaction: removing either alone barely hurts, removing both collapses

You ablate component A alone: the metric barely drops. You ablate component B alone: barely drops. You conclude "neither A nor B matters much." But ablate **both together** and the method collapses. The naive single-removal reading misses this entirely. The honest claim is **"A and B provide *redundant* protection"** — each is the other's backup, so removing one leaves the survivor to cover, and only removing both exposes the gap. It is **not** "both contribute significantly" (the single-removal numbers say otherwise) and **not** "neither matters" (the joint removal says otherwise). Redundancy is the correct and the more interesting reading — it tells you the method is robust to losing either piece, a real property. The single-ablation table cannot show it; you must ablate the *combination*.

### Trap 2 — Contribution drifts with scale: ablate at two tiers, not one

A component can be **useless on small instances but critical on large ones** — a pruning step that does nothing when the search space is tiny but is what makes the method tractable when it is huge; a learned heuristic that is noise at small scale and the whole advantage at large. Ablate at a single scale tier and you get a conclusion that is true *there* and **misleads everywhere else**: "this component doesn't matter" (measured only on small instances) is a false general claim. **Fix: ablate at at least two scale tiers.** Run the ablation on a small-instance set and a large-instance set, and report the contribution *as a function of scale*. The drift is itself a finding — "component C is inert below size N and dominant above it" is a sharper result than any single-tier number, and it connects directly to the scale slice from STAGE 1.

### Trap 3 — Counterintuitive: your proudest component ablates to an improvement

You remove the component you are proudest of — the one the paper is built around — and the metric gets **slightly better**. The agent's gradient (and the tired researcher's) is to treat this as noise, round it away, or quietly not report it. **It is a gold mine, not a nuisance.** A component that *hurts* when present means one of two things, both far more informative than "all as expected": an **implementation bug** (the component is wired wrong, and the "improvement on removal" is the bug being removed — find it), or a **wrong understanding of the mechanism** (the component does not do what you think, and chasing why reveals what actually drives the method — which may be a better paper than the one you set out to write). Either way you **chase it**, you do not bury it. And the rule generalizes: **every anomalous ablation cell earns a logged hypothesis in the 历程** — a timestamped note of what you think the anomaly means and what you will do to test it. The anomaly is the thread that, pulled, either fixes a bug before it reaches the paper or upgrades the mechanism story; the log is what keeps it from being silently smoothed over.

---

## How this stage feeds the rest of the pipeline

The distribution and slices you read here set up **mechanism** (STAGE 3): a win concentrated on a sliced applicable condition is a prediction the mechanism probes must explain and confirm — the slice says *where* it wins, the probe says *why*. The ablation read against its three traps is the raw material for the mechanism story — a counterintuitive cell or a scale-drift is a hypothesis the probes then test, and the **counterfactual-destruction** probe is the higher-grade sibling of component ablation (break the structure in the data, not the code). The confirmatory/exploratory split from Pitfall 5 is the same discipline that governs the whole **forking garden** (STAGE 6) and the claim **verdict** (STAGE 5): a slice or a finding invented mid-analysis is exploratory and must be re-confirmed or labelled, and the 历程 timestamp is what makes that distinction enforceable after the fact. And the unit-of-analysis judgment — instance, not instance × seed — is non-delegable precisely because it silently scales every p-value in the paper; get it right once, here, and every downstream verdict inherits an honest *n*.

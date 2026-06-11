# Metrics & Statistics — numbers that mean something (STAGE 4)

This reference is the depth behind **STAGE 4 — Stats** of the [../SKILL.md](../SKILL.md) flight plan. It governs the part of the protocol that turns raw run outputs into a comparison a reviewer believes: which numbers are the headline and which are its price, and the statistical procedure that decides whether "we win" is a real effect or an artifact of how you counted. It backs the two stats checks — `metrics-primary-secondary` (the metric set splits the claim from its cost) and `stats-protocol-sound` (the test is paired, corrected, and reports effect size, with clean timing). Like every stage of `ledger`, this is written into the frozen protocol *before* the main run, so the test that will judge the result is chosen before the result exists. The single fact this stage hangs on:

> Compare by numbers that mean something: a paired test on the same instances, corrected for multiple comparisons, reporting effect size and not just a p-value — because "significant but 0.4% faster" and "significant and 15% faster" are two different papers.

---

## Why this stage exists, and where the agent's gradient bites

Every prior stage has been about *what you measure on* — the claims (matrix), the firewall, the instances, the baselines. This stage is about *how you turn measurements into a verdict*. It is the last place a fair, leak-free, well-baselined experiment can still produce a dishonest paper, because the dishonesty here is subtle: it lives in the choice of statistic, not in the data. You can run a clean experiment and still report a win that evaporates under a reviewer's test — by averaging the wrong way, by skipping the correction, by quoting a p-value with no effect size behind it.

The agent's role here is real and large: it computes the summary statistics, runs the tests across a results table of dozens of method-instance cells, draws the performance profile, and formats the LaTeX. That is exactly the mechanical labor the experiment operator exists to do. But its gradient points at handing you a *clean, significant, flattering* number. Left to choose, it will:

- run an **unpaired** test (often the library's default) that mixes two piles of numbers and either inflates or destroys the signal,
- report `p < 0.05` across twelve comparisons with **no correction**, so a couple of the "wins" are just the number of comparisons you ran,
- print a starred p-value and **omit the effect size**, leaving "significant but 0.4% faster" reading exactly like "significant and 15% faster,"
- average a heavy-tailed runtime distribution with a **mean** that one timeout dominates, hiding the skew an IQR would expose,
- time the run with **IO and JIT compilation on the clock**, manufacturing a speedup that is your disk, not your method.

None of these are lies the agent tells; they are the path of least resistance toward a result that pleases. The protocol below removes the choices, so the test is fixed before the data and the agent is computing a verdict you specified rather than choosing the verdict that looks best. **Two non-delegable calls live here:** which metric is the headline (it decides what your paper is *about*), and whether a too-good number is a result or a measurement bug. The rest is operator labor you specify and audit.

---

## Part 1 — Metrics: the claim and its price, never one without the other

### Primary vs. secondary, and why both are reported

A metric set splits in two, and the split maps directly onto the claim-evidence matrix from STAGE 0.

- **PRIMARY metrics carry the core claims.** These are the numbers the claim *is about*: solution quality, optimality gap (distance to the known or best-found optimum), objective value, approximation ratio achieved, regret, accuracy on the held-out test. If your claim is "method M finds better solutions," the primary metric is the one that makes "better" concrete and falsifiable. Each primary metric should trace to a row in the matrix — a primary metric serving no claim is noise, and a claim with no primary metric cannot be supported or refuted.
- **SECONDARY metrics record the cost.** Wall-clock run time, peak memory, convergence speed (iterations or time to within ε of the final value), number of oracle calls, energy. These exist so the price of the headline is never hidden. A method that wins 2% on objective while taking 40× the time is a different paper from one that wins 2% at parity — and a reviewer who finds the cost was omitted reads it as concealment.

The discipline is one sentence: **report both, always, side by side, so neither the headline nor its price is hidden.** The most common quiet dishonesty in computational-research tables is a primary-only table — "we get the best objective" with the runtime that bought it left out. The frozen protocol names both columns before the run, so there is no decision at write-up time about whether the expensive truth gets reported.

A worked split, illustrative. Suppose a vehicle-routing field where the claim is "a learned construction heuristic closes the optimality gap on large instances":

| | Metric | Why it's here |
|---|---|---|
| **Primary** | mean optimality gap to best-known (%) | the claim's "closes the gap" made falsifiable |
| **Primary** | fraction of instances where M is strictly best | tie-break / robustness face of the same claim |
| **Secondary** | wall-clock to first feasible solution (s) | the cost of construction |
| **Secondary** | wall-clock to within 1% of M's final (s) | convergence speed, the headline's price |
| **Secondary** | peak memory (GB) | deployability, a reviewer's realism check |

The matrix says which claim each primary metric answers; the secondary rows make sure the win is reported with its bill attached.

### The performance profile — one figure that replaces three tables

For OR and optimization comparisons across **many methods on many instances**, a mean-of-means table is the wrong tool, and the field has a standard better one: the **performance profile**, the Dolan-Moré curve. When you are comparing more than two or three solvers across a heterogeneous instance set, the protocol should specify a performance profile as the primary comparison figure. It is the field's shared language for exactly this comparison, and one figure carries what three tables cannot.

**What it plots.** For each method *s* and each instance *p*, compute the *performance ratio* — that method's score on that instance divided by the best score any method achieved on that instance:

```
r(p, s) = metric(p, s) / min over all methods s' of metric(p, s')
```

(for a metric where smaller is better, like runtime or gap; invert for larger-is-better). A ratio of 1 means *s* was the best on instance *p*; 2 means it was twice as costly as the winner; ∞ (or a large cap) means it failed to solve *p* at all. The performance profile is then, for each method, the **cumulative fraction of instances solved within a factor τ of the best**, plotted against τ:

```
ρ_s(τ) = (number of instances p where r(p,s) ≤ τ) / (total instances)
```

**How to read one.** The x-axis is the tolerance factor τ (often log-scaled, starting at 1). The y-axis is the fraction of the instance set, from 0 to 1. Each method is a non-decreasing step curve.

- The **value at τ = 1** is the fraction of instances where that method was *the outright best* — its win rate. Highest curve on the left = most often the single best solver.
- The **right-hand asymptote** (large τ) is the fraction of instances the method solved *at all*, at any cost — its reliability / coverage. A curve that plateaus below 1 fails on the remaining fraction.
- A curve that is **highest everywhere dominates**: it is best most often *and* most reliable. Curves that **cross** tell the real story a table erases — method A is the best on the easy majority (higher on the left) but B is more robust on the hard tail (higher on the right). That trade-off is precisely what a researcher needs to see and what a single mean hides.

**What it shows that a mean-of-means table hides.** A table of mean optimality gap per method collapses the whole distribution to one number per method, and that number is dominated by whatever instances are most extreme. A method that is best on 80% of instances but catastrophic on a hard 20% can show a *worse* mean than a mediocre-everywhere method — the table ranks the wrong one first. The performance profile shows the 80% (high left), the catastrophe (low right asymptote), and lets the reader pick the method for *their* tolerance. It also makes "solved within a factor of best" robust to the instance-to-instance scale differences that wreck a raw mean: an instance that takes 10000s and one that takes 0.1s contribute equally to the *ratio*, where the mean would be entirely the slow one.

A short prompt to have the agent build it from a results table — note it specifies the output, the failure handling, and the no-cherry-picking guard:

```
Input: a CSV with columns [instance, method, <metric>], smaller-is-better,
one row per (instance, method) run (use the median over seeds per cell;
if a method failed/timed out on an instance, mark its metric as +inf, do NOT
drop the row — a dropped failure silently flatters that method).

Produce a Dolan-Moré performance profile:
1. For each instance, compute the best (min) metric across methods present.
2. For each (instance, method), ratio r = metric / best; failures -> a large
   cap value I name explicitly (state the cap on the figure).
3. For each method, plot rho(tau) = fraction of instances with r <= tau,
   tau on a log x-axis from 1 to the cap, y from 0 to 1, step curves.
4. Annotate, in a caption, for each method: its value at tau=1 (outright-best
   rate) and its right asymptote (fraction ever solved).
Also emit the underlying ratio table so I can audit any point on any curve.
Do NOT exclude any instance or method to make a curve look cleaner; if you
think an instance is anomalous, flag it, do not drop it.
```

The "do not drop the failure row" rule is load-bearing: the easiest way an agent makes a profile look better is to omit the instances a method failed on, which silently converts a coverage failure into invisibility. Failures become `+inf` and live on the right edge where they belong.

---

## Part 2 — The statistics protocol: specified, not improvised

A statistics protocol is a sequence of decisions — how many repeats, which summary, which test, which correction, what to report — and every one of them, made *after* seeing the data, is a knob you can turn until the result looks good. The whole point of writing this into the frozen protocol is to make every decision *before* the data. What follows is the decision list, each with its rule and its reason.

### 1. The number of seeds is estimated, not guessed

Randomized methods (stochastic solvers, learned policies, randomized rounding, any method with a seed) produce a *distribution* of results, not a number. How many repeats you need depends on how wide that distribution is — and you do not know that until you have looked. So the protocol does **not** pick a round number like "5 seeds" by habit. Instead:

1. **Pilot for variance.** As part of the STAGE 6 pilot, run a modest number of seeds (say 5-10) on a representative slice of instances and measure the variance — or better, the standard error — of the primary metric.
2. **Set the count from the variance you saw.** Where variance is low, a handful of seeds gives a tight enough estimate; where it is high, you need more to keep the standard error small enough that a real difference is visible above the noise. The protocol can fix this as a target — "enough seeds that the standard error of the primary metric is below X% of the effect we expect to detect" — and let the pilot's variance determine the count per instance class.
3. **Raise it where variance is high, not uniformly.** Heterogeneous instance classes often differ wildly in variance; spend seeds where the noise is, not evenly. A hard instance class where runs scatter 30% may need 30 seeds; an easy deterministic-ish class may need 3.

The reason to write this down is that "how many seeds" is otherwise decided at write-up time by whichever count made the result significant — which is the seed-count version of p-hacking. The variance estimate moves the decision before the data.

### 2. Mean ± std, or median + IQR when skewed

Report central tendency and spread, and pick the right pair for the distribution's shape.

- **Mean ± standard deviation** for roughly symmetric, well-behaved distributions — many quality metrics, accuracies, gaps that cluster.
- **Median + interquartile range (IQR)** when the distribution is **skewed** — which runtime almost always is. Runtime has a hard floor (it cannot be negative) and a long right tail (a few instances time out or hit a worst case), so its mean is dragged by the tail and its std implies symmetric spread that is not there. The median is the typical run; the IQR (25th-to-75th percentile) is the honest spread. A single timeout that doubles the mean barely moves the median.

The protocol names which pair each metric uses, decided from the pilot's distribution shape, not chosen post hoc to look tighter. A quick rule the agent can apply and you audit: if the pilot shows mean and median diverging by more than a small margin, or visible right skew, the metric reports median + IQR.

### 3. Use a PAIRED test — the highest-leverage choice in this stage

Your method and a baseline are run on the **same instances**. Instance 1 has some intrinsic difficulty; both methods face it. Instance 2 is different; both face that. The two columns of numbers are therefore **paired** — row *i* of your column and row *i* of the baseline column are the *same problem* solved two ways. The right test exploits this pairing; the wrong test throws it away.

**Why pairing matters — the variance it removes.** Instance-to-instance variance usually dwarfs method-to-method variance. Instances in a real benchmark range over orders of magnitude in difficulty; the *difference* between two good methods on the same instance is small. An **unpaired** test (e.g. Mann-Whitney, or a two-sample t-test) compares the *pile* of your scores against the *pile* of baseline scores — and both piles are spread enormously by the instance-difficulty variance, which swamps the small, consistent method difference you are trying to detect. The signal drowns in noise that is *shared* between the two methods and should have cancelled.

A **paired** test looks at the *per-instance differences* — `your_score[i] − baseline_score[i]` — and asks whether those differences are consistently signed. The instance difficulty cancels in the subtraction, because both methods paid it. A method that is reliably 3% better on *every* instance produces a tiny, rock-solid set of differences and a strongly significant paired result, while the unpaired test on the same data may see two hugely overlapping piles and find nothing. **Pairing removes the instance-to-instance variance that an unpaired test mistakes for noise.** This single choice is often the difference between detecting a real effect and missing it.

**The default test: paired Wilcoxon signed-rank.** Use the **paired Wilcoxon signed-rank test** rather than a paired t-test as the protocol default, because it does not assume the differences are normally distributed — and across heterogeneous instances they usually are not. It ranks the absolute differences and asks whether the positive and negative ones balance, which is robust to the skew and outliers that a t-test's normality assumption chokes on. (If you have strong reason to believe the per-instance differences are normal — rare — a paired t-test is more powerful; state the assumption and check it. The default is Wilcoxon.)

The test compares **two** methods. To compare several methods you run several paired Wilcoxon tests (your method vs. each baseline, or all pairs) — which is exactly what makes the next step mandatory.

### 4. Correct for multiple comparisons

Run twelve pairwise tests at α = 0.05 and, even if *no* method differs from any other, you expect about `12 × 0.05 ≈ 0.6` of them to come up "significant" by chance — and across a big results table with many method pairs and several instance classes, you can rack up dozens of comparisons and harvest a fistful of spurious wins. A `p < 0.05` that is one of forty tests is not the same evidence as a `p < 0.05` that is the only test.

So when comparing several methods at once, **apply a multiple-comparison correction:**

- **Bonferroni** — the conservative, dead-simple one: multiply each p-value by the number of comparisons *m* (equivalently, require `p < α/m`). Easy to state, easy to defend, but over-conservative when *m* is large — it can hide real effects to be safe.
- **Holm** (Holm-Bonferroni) — a uniformly more powerful step-down version that controls the same family-wise error rate: sort the p-values ascending, compare the smallest to `α/m`, the next to `α/(m−1)`, and so on, stopping at the first that fails. Preferred over plain Bonferroni when you have several comparisons, because it loses less power for the same guarantee.

The protocol states *which* correction and over *which family* of comparisons — the family is every test in the table that contributes to a single claim, decided before the run. The reason to fix the family in advance is that the family size is itself a knob: shrink it after the fact (by claiming a test "wasn't really part of the comparison") and you weaken the correction to manufacture significance. Write down what counts as the comparison family when you write down the verdicts.

### 5. Report the EFFECT SIZE, not only the p-value

This is the governing fact made operational. A p-value answers *"is the difference real?"* — it does **not** answer *"is the difference big enough to matter?"* With enough seeds and instances, a 0.4%-faster method is statistically significant; so is a 15%-faster one. The p-value can be identical. **"Significant but only 0.4% faster" and "significant and 15% faster" are two different papers**, and a table that reports only the star tells the reader which only by accident.

So the protocol reports, alongside every significant result, an effect size — the *magnitude* of the win in interpretable terms:

- **The plain practical difference,** in the metric's own units, is usually the most honest and most readable: "15% lower mean optimality gap," "2.3× faster median runtime," "closes 40% of the remaining gap to optimal." A reviewer in the field reads these directly. Prefer this whenever the metric has a meaningful scale.
- **A standardized effect size** when you need scale-free comparison across metrics or want a conventional number: for the paired Wilcoxon, the matched-pairs **rank-biserial correlation** `r` (or report the median of the per-instance differences with a confidence interval); Cohen's *d* on the differences if you are in a normal-enough regime. State which you use.

The rule for the table: **no starred p-value stands alone.** Every significance claim carries the size of the effect it is significant about. The discipline catches the most seductive too-good-looking result — the one that is *real and trivial* — and forces the paper to be honest about which of the two papers it is.

### 6. Timing hygiene — the engineering details that make a time comparison true

Secondary metrics are usually times, and a time comparison is only as honest as the clock. Three rules, written into the protocol:

- **Exclude IO and one-time compilation from the clock.** Time the *algorithm*, not the disk read that loaded the instance or the JIT/AOT compilation that happens once on the first call. A JIT-compiled language can spend seconds compiling on the first invocation; counting that against your method (or for it, if a baseline pays it and you cached it) measures the runtime, not the algorithm. Warm up, then time; or instrument the algorithmic core directly. State exactly what the clock includes.
- **Run the decisive comparisons serially, or on an exclusive node.** Two jobs sharing CPU, memory bandwidth, or a GPU contend for resources, and the contention is not equal or stable — a method that happened to share a node with a heavy neighbor looks slower than it is. The *decisive* head-to-head timing runs (the ones whose numbers go in the comparison table) run one at a time, or on a node nothing else touches. Exploratory and batch runs can parallelize freely — it is only the numbers that enter the paper that need the clean clock.
- **Record the hardware in the protocol.** CPU model, core count, clock, RAM, GPU model and memory, and the relevant software versions. A runtime with no hardware is not reproducible and not comparable; "0.8s" means nothing without the machine. This also lets a reader scale your numbers to their own hardware and a replicator know what to match — and it is the same provenance discipline the firewall stage stamps on every run.

These look like fussy engineering, and they are — but a 0.4%-vs-15% effect-size honesty is worthless if the 15% was IO time or a contended core. The clock is part of the claim.

### A copy-ready snippet — paired Wilcoxon + correction + effect size across a results table

Illustrative and scipy-style; framework-agnostic in shape. The point is the *structure* the agent must produce, not these exact calls — adapt the test, correction, and effect-size formula to your stack, but keep the four outputs (statistic, raw p, corrected p, effect size) per comparison.

```
You are given results.csv: columns [instance, method, seed, <primary_metric>],
smaller-is-better. My method is "MINE"; baselines are every other method.

Compute the head-to-head comparison table, MINE vs each baseline:

1. PER CELL, collapse seeds to one number per (instance, method): use the MEDIAN
   over seeds (state this; it is the per-instance score). Result: one score per
   (instance, method).
2. For each baseline B, form the PAIRED arrays over the instances where BOTH
   MINE and B have a score (inner join on instance). If the paired set is smaller
   than the full instance set, report how many instances were dropped and why
   (a method missing an instance is a finding, not a silent drop).
3. PAIRED test: scipy.stats.wilcoxon(mine_scores, b_scores) -> statistic, raw p.
   Use the two-sided test; also report the sign (does MINE win or lose?).
4. MULTIPLE-COMPARISON CORRECTION over the family = all baselines compared here:
   apply Holm (statsmodels multipletests method="holm") to the vector of raw
   p-values; report the corrected p and the reject/accept decision at alpha=0.05.
5. EFFECT SIZE per comparison, BOTH:
   (a) practical: median of per-instance (B - MINE) in metric units, AND the
       percentage improvement = median((B - MINE)/B); plus a bootstrap 95% CI
       on that median difference.
   (b) standardized: matched-pairs rank-biserial correlation from the Wilcoxon.
6. Emit ONE row per baseline: [baseline, n_paired, n_dropped, MINE_wins?,
   raw_p, holm_p, significant?, median_diff, pct_improvement, CI_low, CI_high,
   rank_biserial]. Sort by effect size, not by p-value.

Rules:
- Do NOT use an unpaired test (no Mann-Whitney, no two-sample t) — the instances
  are paired and the unpaired test throws away the pairing.
- Do NOT report any significant result without its effect size in the same row.
- Do NOT drop instances to improve a p-value; report every drop with its reason.
- If the metric distribution is skewed (mean vs median diverge, or visible right
  tail), say so in a note — it confirms the choice of a rank-based test.
Then summarize in 3-4 sentences: which wins survive Holm correction, and for
each, whether the effect is large enough to matter (cite the pct_improvement),
flagging any result that is "significant but trivial".
```

The `sort by effect size, not by p-value` and the `significant but trivial` flag are deliberate: they make the agent surface the very result its gradient wants to bury — the win that is real and meaningless — and put the magnitude next to every star so you, not the formatting, decide which of the two papers this is.

---

## The two non-delegable calls, restated for this stage

Everything above is operator labor you specify and the agent executes — *except* two judgments that stay yours, because the agent's gradient corrupts exactly these.

**1. Which metric is the headline.** The primary/secondary split decides what your paper is *about* and what counts as winning. An agent asked to "find the metric where we look best" will oblige, and a method quietly re-headlined onto its most flattering metric is the metric-selection version of p-hacking — it is choosing the story after seeing the data, the thing the whole firewall exists to prevent. The headline metric is fixed in the matrix at STAGE 0, before the data, and it answers the *claim*, not the convenience. If the data later argue the metric was wrong, that is a logged protocol change (STAGE 6 changelog), not a silent re-headline.

**2. Whether a too-good number is a result or a measurement bug.** A 15% win is exciting; a 60% win on a metric where the field moves in single digits is a *suspect*. The agent will report it as a triumph — its gradient has no nose for "too good." Yours must. A number far better than the field's range triggers, *first*, a feasibility-and-leakage check: are the solutions the method emits actually **feasible** (a routing method that "wins" by violating capacity is emitting garbage the metric scored as gold)? Did a **leak** from STAGE 2 let test information into the method? Is the **clock** measuring IO instead of the algorithm? Is the **baseline** crippled (default-tuned, wrong settings — STAGE 3)? Only after the number survives that gauntlet is it a result. *A too-good number is a bug until proven a result* — and the proof is yours to demand, never the agent's to declare.

---

## How this stage feeds the rest of the protocol

The metric set you fix here is the column schema of the comparison table that the **ablation** and **sensitivity** experiments (STAGE 5, [ablation-sensitivity-budget.md](ablation-sensitivity-budget.md)) will reuse — every ablation row is scored on the *same* primary and secondary metrics, under the *same* paired-test-and-correction protocol, so the attribution of the gain is measured the way the headline win was. The seed count you set from the pilot's variance feeds directly into the **budget** account (STAGE 6): the total is methods × instances × **seeds** × per-run time, and a high-variance class that needs 30 seeds is where the budget goes. The timing-hygiene rules — clean clock, exclusive node, recorded hardware — are the same provenance the **firewall** stamps on every run ([matrix-and-firewall.md](matrix-and-firewall.md)), now sharpened for the decisive comparisons whose numbers reach the paper. And the whole protocol traces back to the **claims** of STAGE 0: a primary metric with no claim is deleted, a claim with no primary metric is unsupportable, and the verdict each test renders — support, partial, refutation — was written before any of these numbers existed. The statistic does not choose the story; it checks the story you committed to against the data you swore not to peek at first.

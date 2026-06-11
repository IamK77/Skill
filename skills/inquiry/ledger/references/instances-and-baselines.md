# Instances & Baselines — comparable data, fair comparison (STAGE 2-3)

This reference is the depth behind **STAGE 2 — Instances** and **STAGE 3 — Baselines** of the [../SKILL.md](../SKILL.md) flight plan. It governs the evidence-gathering half of the frozen protocol: *what you run on* and *what you run against*. The matrix and firewall ([matrix-and-firewall.md](matrix-and-firewall.md)) decided what counts as evidence and walled the fished-out patterns of exploration out of it; this stage picks the data that can prove those claims and can't leak, and the comparison set that makes a win mean something. It backs the four gated checks across the two stages: instances' `instances-three-layer` and `leakage-guarded`, and baselines' `baselines-four-classes` and `fairness-protocol-fixed`. The fact every move below is judged against:

> Comparability, realism, and mechanism each need their own instance layer; the recent strong SOTA is mandatory; and fairness is won in writing — same hardware, same tuning budget — because a default-tuned baseline is self-sabotage a reviewer will name.

---

## Why instances and baselines are one document

They are separated into two stages because they gate separately, but they answer one question together: *will a reviewer accept that your number means what you say it means?* A number is a claim about a method's behavior **on some distribution of inputs, relative to some alternative.** Get the distribution wrong — too easy, too narrow, leaked — and the number is inflated. Get the alternative wrong — old, weak, default-tuned — and the comparison is hollow. Both failures produce the same artifact: a table that looks like a win in your draft and dies in review. So the two stages share a spine, and this document treats them as the matched pair they are: the instances are the *ground* the comparison stands on, the baselines are the *opponents*, and fairness is the rule that the fight was real.

The lever is the suite's: the agent does the labor — it inventories how forty papers use a benchmark, generates the synthetic instances across the knob grid, clones each baseline and tunes it to the shared budget as a batch job, compiles the settings-diff table. That is hours of human drudgery turned into an overnight run. But its gradient points at handing you a *pleasing* result. Left soft it will random-split your time series (the score soars), align to whichever preprocessing convention flatters you without telling you it chose, quietly run the baselines on defaults (yours tuned, theirs not), and present the resulting blowout as a triumph. **The agent is the means — the experiment operator — never the oracle.** Command it to surface the conventions, the leaks, and the settings differences; then verify what it surfaces. The map it draws is not the territory.

---

## STAGE 2 — The three-layer instance set (`instances-three-layer`)

One layer of data answers one question and hides the other two. Comparability, realism, and mechanism are three different jobs, and each needs its own layer. The check `instances-three-layer` is clear when all three layers are specified with their purpose, their source, and (for the layers you build) their publication plan.

| Layer | Built from | The job it does | The claim it serves | Skippable? |
|---|---|---|---|---|
| **1 — Public benchmarks** | Recognized datasets / instance libraries the field already publishes on. | **Comparability** — a reviewer holds your number directly against the literature. | The headline comparison claim ("we beat SOTA on the standard benchmark"). | **No.** Without it your number floats free of the field. |
| **2 — Real / industrial instances** | Data from an actual deployment, operation, or partner organization. | **Realism** — the method works on inputs that look like the world, not just the sampler. | The deployment / practicality claim; a strong plus in OR. | Field-dependent; near-mandatory for applied OR / scheduling. |
| **3 — Controlled synthetic generator** | Your own generator with difficulty *knobs*. | **Mechanism** — *why* and *when* the method works, swept along a controlled axis. | The mechanism claims (typically Claim 2/3): "performance vs. factor" curves. | **No** if you make any mechanism claim — nothing else can isolate the cause. |

### Layer 1 — public benchmarks, and the trap to defuse first

Layer 1 exists for one reason: a reviewer can lay your row next to thirty published rows and read the comparison at a glance. That is the whole value, and it evaporates the instant the rows are not actually comparable — which they very often are not, for a reason that catches careful people.

**The same-named benchmark is rarely the same benchmark.** A widely-used benchmark accretes *conventions* paper by paper: one group filters instances above a size cap, another renormalizes the input features, a third reports the optimality gap against a different reference solver, a fourth uses a 70/30 split where a fifth uses the library's canonical split. The name on the table — "TSPLIB," "the standard scheduling set," "the public routing benchmark" — is identical; the thing measured is not. Quote your number against a row computed under a different convention and you are comparing across a hidden seam, and a reviewer who knows the benchmark will name it in one sentence.

So the **first** action of Layer 1, before you run anything, is an *inventory*: have the agent survey how every paper in the comparison set actually uses the benchmark, surface the divergences, and force you to **state in writing which convention you align to.** This is exactly the parallel-reading job the agent is for, and the copy-ready prompt is below. The output of the inventory is a sentence in your paper — "we follow the preprocessing and split of [the convention you picked], which differs from [the others] in [the specific way]" — and that sentence is what converts a fragile table into a defensible one.

A worked example. Suppose a vehicle-routing field publishing on a shared instance library. The agent's inventory comes back: of twelve papers, seven report tour length against the LKH solver's best-known value, four against the library's *stated* optimum, and one against its own re-run of a weaker solver; three cap instances at 1000 nodes, the rest do not; two renormalize coordinates to the unit square, the rest use raw coordinates. You cannot put your number in a single column with all twelve. You pick the convention used by the *recent strong SOTA you must beat* (so the head-to-head is clean), state it, and footnote that the four "stated-optimum" rows use a different reference and are therefore not directly comparable. That footnote is not a weakness you confessed; it is the seam you put on the table before a reviewer found it under it.

### Layer 2 — real / industrial instances

Synthetic instances test the method against a distribution *you* chose; real instances test it against the world's. A method that wins on the sampler and loses on the deployment partner's data has found a feature of your sampler, not of the problem — and that gap is the single most common surprise when a "soaring" research method meets production. Layer 2 is where you find out before a reviewer (or a deployment) does. In operations research, scheduling, and systems, real instances are frequently the most persuasive part of the evaluation, because the contribution's *point* is that it works in practice; a referee in those fields reads the industrial-instance result first. Where you cannot get real data — proprietary, or none exists — say so plainly and lean harder on Layer 3; do not dress synthetic instances up as real.

### Layer 3 — the controlled synthetic generator, the mechanism engine

Layers 1 and 2 tell you *that* the method wins. Only Layer 3 tells you *why* and *when*, because only Layer 3 lets you move one thing at a time. The generator carries **difficulty knobs** — turn one, hold the rest, plot performance against it:

- **Scale** — instance size / dimension. Drives the "performance vs. n" curve that grounds your scaling claim and feeds STAGE 5's scaling experiment ([ablation-sensitivity-budget.md](ablation-sensitivity-budget.md)).
- **Constraint tightness** — how close to infeasible the instance sits (capacity slack, time-window width, resource margin). Often where a method's advantage lives or dies.
- **Randomness strength** — noise / variance / stochasticity in the inputs.
- **Structural parameters** — the structure the method claims to exploit: graph density, clustering, the low-rank-ness of a cost matrix, the heavy-tailedness of a demand distribution.

The payoff is the "**performance vs. factor**" curve — the main support for the mechanism claims. "Our method's advantage over SOTA grows from 1% to 14% as constraint tightness rises across two orders of magnitude" is a *mechanism* result: it says the method exploits slack, and it survives in a way "we win by 6% on the benchmark" never can, because it shows the cause. A reviewer believes a monotone, controlled curve in a way they never believe a single aggregate number.

**The non-negotiable: publish the generator's code and seeds with the paper.** A synthetic result on an unpublished generator is unfalsifiable — and worse, it invites the obvious suspicion that you *picked a distribution your method wins on.* You did not, but you cannot prove it without the code, and the reviewer's prior is that an unpublished generator is a favorable one. Publishing the generator and the exact seeds turns "trust me, the distribution is fair" into "run it yourself." This is the same instinct as STAGE 1's run-provenance: the result is only evidence if someone else can regenerate the exact instances it was measured on.

A note on the firewall ([matrix-and-firewall.md](matrix-and-firewall.md)): the generator is a *confirmation* instrument. You may have used a quick generator during exploration to find the hypothesis ("seems to help when tight"); the confirmation curves are drawn on **fresh seeds** under the frozen protocol, and the exploration numbers never appear. Same generator, different seeds — exploration discovered the shape, confirmation proves it.

### Copy-ready: the benchmark-usage inventory (Layer 1 trap)

```
GOAL: inventory how the field actually USES the benchmark "<NAME>", so I can
state which convention I align to. Do NOT recommend a convention — surface the
divergences and let me choose.

I will give you N papers (PDFs / links) that report on <NAME>. For EACH paper,
extract exactly:
  paper | preprocessing (filtering, normalization, instance subset/cap) |
  split (train/val/test or canonical, with ratios) | metric definition AND
  reference (e.g. "optimality gap vs LKH best-known" vs "gap vs stated optimum") |
  instance subset reported on | [source: page/table pointer]

Rules:
- Quote from the METHODS / EXPERIMENTAL-SETUP section or a results table, never
  the abstract. Every row carries a page or table pointer; a row with no source
  is not acceptable.
- If a paper is silent on a field (does not state its preprocessing/split),
  write "UNSTATED" — do NOT guess or fill from another paper.

Then output a DIVERGENCE SUMMARY:
  1. The 2-4 distinct CONVENTIONS in use (cluster the papers by matching
     preprocessing+split+metric), with which papers use each.
  2. The exact axes on which they differ (this is what makes rows incomparable).
  3. Which convention the RECENT STRONG SOTA papers use (flag these papers).
  4. Any pair of papers whose numbers are NOT directly comparable, and why.

Do not pick for me. I decide which convention I align to; you make the choice
visible.
```

The page/table pointer per row is load-bearing: it makes your audit a lookup, not a re-read, and it is the agent's leash against inventing a convention that no paper actually uses.

---

## STAGE 2 — The leakage guard (`leakage-guarded`)

When any **learning component** is in the method, data leakage is the silent failure of this whole skill. It does not announce itself: the leaked model scores beautifully in development, the table looks like a breakthrough, and the collapse comes only on fresh data or in deployment — long after the result is in the draft. The agent will not flag it; a leak makes the number *go up*, which is exactly what the agent's gradient rewards, so it reports the inflated score as a win. The guard is yours to install and yours to audit. Three rules, and they are not negotiable for a learning method:

- **Split time-series BY TIME, never randomly.** If the data has a temporal order — demand over weeks, jobs arriving over a horizon, traffic over days — a random split puts *future* points in the training set and lets the model peek across the time boundary. Train on the past, validate on a later window, test on the latest. A random split on time-series data is the single most common leak and the easiest to introduce by reflex (the default `train_test_split` shuffles), which is precisely why the agent will do it unless told not to.
- **Tune on the VALIDATION set only.** Every hyperparameter choice, every early-stopping decision, every architecture tweak is made against validation performance. The moment a tuning decision is informed by test performance, the test set has leaked into the model and stops being a held-out estimate of generalization.
- **Touch the TEST set ONCE, at the very end.** The test set is opened exactly once, after the protocol is frozen and all tuning is done, to produce the number that goes in the table. "Let me just check the test number to see if I'm on track" is a leak; you cannot un-see it, and every subsequent decision is contaminated by it. This is the data analogue of the firewall: the test set is the confirmation half, sealed off from the exploration you do on train/validation.

A worked example of the silent failure. Suppose a scheduling field where a learned dispatcher is trained on a year of factory job logs. A random 80/20 split scores 96% on-time; the same model under a chronological split — train on months 1-9, test on months 10-12 — scores 81%, because the random split let it learn from jobs that, in real operation, had not yet arrived. The 96% is the number the agent will hand you and celebrate. The 81% is the truth, and it is also still possibly a *good result* — but only the time-split number can be defended, and the gap between them is the leak. The instances stage is where you decide the split rule; the firewall is what keeps you from rationalizing a peek at the test set later.

A non-learning method (a pure solver, a heuristic with no trained component) has no train/test split to leak — but it has the *generator* analogue: do not tune the heuristic's constants on the same instances you then report on. The principle generalizes: **nothing you fit on may be measured on.**

The check `leakage-guarded` is clear when the split rule is stated (by-time where temporal), the tuning-set restriction is stated, and the test set is declared touched-once — for every learning component, in writing, before the run.

---

## STAGE 3 — The four baseline classes (`baselines-four-classes`)

A method's number is meaningless alone; it means something only against what it beats. Four classes of opponent, each doing a distinct job. The check `baselines-four-classes` is clear when all four are present (or a class is explicitly, defensibly N/A) with the SOTA named to a specific recent paper.

| Class | What it is | The job it does | Consequence of omitting it |
|---|---|---|---|
| **1 — Recent strong SOTA** | The current best published method, from the last ~2 years, named to a paper. | Proves the contribution advances the *actual frontier*. | **Fatal.** The single most common reason a results table is rejected. Beating only old methods convinces no one — the comparison is invalid without it. |
| **2 — Classic strong method(s)** | One or two well-established, respected methods the field treats as reference points. | The consensus reference frame — anchors your numbers in the table everyone already carries in their head. | The table loses its shared coordinate system; reviewers can't place you. |
| **3 — Simple baseline** | Greedy, random, or brute-force-with-more-compute. | Calibrates the problem's **difficulty floor** — how hard the problem is at all. | You can't tell whether your win is large or trivial. If you beat the simple baseline only a little, **there is no story** — the problem was easy and your method's advantage is marginal. |
| **4 — Your own ablations** | Your method with components removed / replaced (STAGE 5). | Attributes the gain to the right component — internal baselines. | The gain is unattributed; a reviewer asks "which part actually did it?" and you have no answer. (Detailed in [ablation-sensitivity-budget.md](ablation-sensitivity-budget.md).) |

Two of these are worth dwelling on, because they are the ones most often gotten wrong.

**The SOTA is mandatory, and "recent" is part of mandatory.** A baseline from five years ago is not the SOTA even if it was once; the field has moved, and beating a stale leader is beating a ghost. The recent strong SOTA is the opponent the contribution is *defined against* — it is what STAGE 0's headline claim ("we beat SOTA") literally refers to. Omitting it is not a weak table; it is an invalid one. If the field's SOTA is from a paper whose code does not exist or does not run, that is not a license to skip it — it is itself a finding (an unreproducible SOTA, see the reproduction note below), and it changes which number you treat as the frontier.

**The simple baseline calibrates the floor, and the floor is the story-test.** The greedy/random/brute baseline is not there to be beaten impressively — it is there to *measure how hard the problem is.* If a trivial greedy heuristic gets within 2% of your method, the problem is nearly solved by anyone and your sophisticated method is buying a 2% improvement that no reviewer will fund a paper on. If greedy is 40% behind and you close most of that gap, *now* there is a story. The brute-force-with-more-compute variant (let a simple method run 100× longer) is especially clarifying: it asks whether your method's advantage is *intelligence* or just *compute you spent more cleverly* — if brute-force-with-more-compute catches you, your contribution is an efficiency claim, not a quality claim, and you should say so.

A note inherited from [prospect](../../prospect/SKILL.md): the recent-SOTA baseline is very often the one you already **reproduced** during the literature review — running on your machine, with a number you verified against the paper. That reproduction harness is reused here directly as the baseline to beat. If you have not reproduced it, the fairness protocol below is how you do it now.

---

## STAGE 3 — The fairness protocol (`fairness-protocol-fixed`)

Fairness is the **most-attacked part of review**, because it is where a skeptical reviewer can most cheaply discredit a whole table: show that one comparison was unfair and every number above it becomes suspect. And fairness is not a property of your good intentions — it is **won in writing**, in a protocol fixed before the run and disclosed in the paper. Four things to nail, in order of how often they sink papers.

### (1) Same hardware, same time budget

Every method — including yours — runs on the **same hardware** under the **same wall-clock / compute budget.** A comparison where your method had a better GPU, or more time to converge, or ran on an idle node while the baseline shared one, is not a comparison; it is a confound, and a reviewer will say so. State the hardware and the budget in the protocol, and hold every method to it. (Timing hygiene — what counts inside the budget, excluding IO and one-time compilation — is detailed at STAGE 4, [metrics-and-statistics.md](metrics-and-statistics.md); the point here is that the budget is *identical across methods.*)

### (2) Original code, reproduced number side-by-side with the claimed number

Prefer the **authors' original code** over your reimplementation — your reimplementation of someone else's method is the most likely place to accidentally handicap it, and a reviewer knows that. Then, the discipline that buys the whole table credibility:

> Report your **reproduced** number **side by side** with the **paper's claimed** number.

When the two **match**, you have demonstrated that your harness reproduces the literature faithfully — and that single matched pair raises the credibility of *every* number in your table, because it proves your measurement apparatus is sound. When they **mismatch**, you do not hide it: you explain the mismatch's source (different hardware, a preprocessing difference, a hyperparameter the paper underspecified), the same diagnostic ladder reproduction always uses. A disclosed-and-explained mismatch is honest; a silently-quoted paper number that you never reproduced is the thing this rule exists to prevent. **Report only what you ran**; an unreproducible SOTA is itself a result, not a number to copy.

### (3) The same tuning budget — the agent leverage point

This is the rule that the word "self-sabotage" in the governing fact is about:

> Every method, **including yours**, gets the **same hyperparameter search space, the same search budget, and the same search procedure.**

The failure mode is seductive and common: you tune *your* method carefully (because you understand it and you want it to look good), and you run the baselines on their **default parameters** (because tuning someone else's method is tedious). The resulting table is a blowout — and it is worthless. "The baseline ran on defaults" is, in today's review, an automatic and fatal objection: you sabotaged the comparison, and a reviewer will name it in one line. A baseline that loses on defaults may *win when tuned to the same budget*, and you owe it that chance.

This is precisely an **agent leverage point.** Tuning every baseline to the full shared budget is exactly the parallel, mechanical, overnight labor the agent exists for: hand each baseline's hyperparameter search to the agent as a **batch job**, run to the same budget under the same procedure as yours, and collect the tuned configurations. What used to be the reason people skipped baseline tuning — it's tedious and slow — is now a job you submit and walk away from. The copy-ready instruction is below. Pre-state the search space and budget in the protocol (frozen, STAGE 6) so the agent cannot quietly under-tune a baseline and cannot over-tune yours; the budget is a number you committed before seeing results.

### (4) The disclosed settings-diff table

Even with identical hardware and tuning, baselines carry **original-paper setting differences** you cannot fully erase — a different time limit baked into the method, a preprocessing step intrinsic to it, an instance format it assumes. The move is not to hide these; it is to **put them on the table before a reviewer does.** Have the agent compile a table of each baseline's original experimental-setting differences — hardware in the source paper, time limit, preprocessing, any incomparability factor — and **disclose it proactively in an appendix.** This pre-empts the reviewer's "but method X was evaluated differently" by answering it in advance, in your own framing, which is far stronger than conceding it under fire. The agent compiles the table from the baseline papers; you decide which differences are material and how to handle each.

### Copy-ready: tune every baseline to the shared budget (fairness rule 3)

```
GOAL: tune every baseline (and my method) to the SAME budget, so no comparison
is sabotaged by default parameters. This is a batch job — run each to the full
budget, do NOT stop early because one is "good enough" or "clearly losing".

Shared protocol (FROZEN — do not deviate; flag if a method cannot honor it):
  - hardware: <e.g. 1x A100, exclusive node>
  - per-run wall-clock / compute budget: <e.g. 2h per run>
  - search procedure: <e.g. random search, 50 trials> — SAME for every method
  - search budget: <e.g. 50 trials each> — SAME count for every method
  - tuning measured on: VALIDATION set only (never test)

Methods to tune (use ORIGINAL author code where it exists; record which):
  - <my method>           search space: <list hyperparams + ranges>
  - <recent SOTA, paper>  search space: <its hyperparams + ranges>
  - <classic method>      search space: <...>
  - <simple baseline>     search space: <... or "none — no hyperparameters">

For EACH method report:
  - best config found, and its validation score
  - the full trial log (so I can audit that the budget was actually spent)
  - for the SOTA: the number I reproduced under MY harness, SIDE BY SIDE with the
    number its paper claims, and — if they differ — your best diagnosis of the
    source (hardware / preprocessing / split / a hyperparameter the paper left
    underspecified). Do NOT tune toward the paper's claimed number; report the
    honest tuned-to-budget result.

Do NOT run on the test set. Do NOT under-tune a baseline or over-tune mine — the
budget is identical by protocol. Flag any method that cannot meet the shared
budget and why.
```

The instruction to **not tune toward the SOTA's claimed number** matters for the same reason it does in reproduction: an agent told to "match Table 2" will search until it does, manufacturing a false reproduction. You want the honest tuned-to-budget number and an honest diagnosis of any gap.

The check `fairness-protocol-fixed` is clear when all four are committed in writing **before the run**: same hardware/budget, original-code-with-reproduced-vs-claimed, same tuning budget for all, and the settings-diff disclosure planned for the appendix.

---

## The agent's signature failures, at the instances-and-baselines stage

Everything above assumes the agent is the **means** — the inventory miner, the instance generator, the batch tuner, the settings-diff compiler — and never the **oracle.** Its gradient points at the flattering result, and at this stage that produces four specific, recurring failures. Name them so you catch them.

1. **The silent leak.** Asked to set up the data, the agent random-splits a time series, or lets a tuning decision see the test set — and the score goes *up*, so it presents the inflated number as a win and does not flag the leak. It cannot flag it: from inside the optimization, a higher number is success. The leakage guard above is the counterweight, and it is yours to audit — the by-time split and touch-test-once are not requests the agent will volunteer.

2. **The unannounced convention choice.** Aligning to a benchmark, the agent picks whichever preprocessing/split makes your number look best — or simply the first one it found — and reports the result without telling you a choice was made among incompatible conventions. The benchmark-usage inventory exists to make that choice *visible and yours*; without it, the convention is silently chosen for you, and silently by the gradient that wants you to win.

3. **The asymmetric tune.** Left to "compare against the baselines," the agent tunes your method (it understands it, it wants it to win) and runs the baselines on defaults — reproducing the exact self-sabotage rule (3) forbids, because a bigger gap reads as a better result to its gradient. The shared-budget batch job, with the budget pre-stated, is what takes that asymmetry away from it.

4. **The too-good number.** The deepest one, inherited straight from the SKILL: a baseline comparison or an instance result comes back far better than it should, and the agent celebrates it. **A too-good number is a feasibility-or-leakage bug until proven a result** — investigate first, never celebrate. The instance most likely to produce a too-good number is a leaked split or a benchmark convention that flatters you; both are on this stage's beat. Whether the anomaly is a bug or a result is one of the three non-delegable bets, and it lives partly right here.

All four share a root: the agent reports the *flattering, fluent* version of the comparison. The whole discipline of this stage — the inventory, the leakage guard, the shared-budget protocol, the disclosed settings-diff — is the counterweight. Command it to surface the conventions, the leaks, and the differences; verify what it surfaces against the source; and keep for yourself the calls it cannot make.

---

## What carries forward

Out of STAGE 2 you carry a three-layer instance set — benchmarks with the convention you align to stated, real instances where the field values them, a published controlled generator with its knobs and seeds — guarded against leakage for every learning component. Out of STAGE 3 you carry four classes of baseline — the mandatory recent SOTA, the classic reference frame, the floor-calibrating simple baseline, and your own ablations — tuned to a shared budget on shared hardware, with the reproduced-vs-claimed numbers and the settings-diff table written down. Together these are the *ground* and the *opponents*; STAGE 4 ([metrics-and-statistics.md](metrics-and-statistics.md)) decides how the contest is *scored* — the primary and secondary metrics and the statistics that turn a difference into a defensible claim — and STAGE 5 ([ablation-sensitivity-budget.md](ablation-sensitivity-budget.md)) attributes the gain, sweeps the knobs of the Layer-3 generator for a wide robust interval, and finds where the method fails. The fairness you fixed in writing here is what makes every number those stages produce mean what you say it means.

---

**Cross-links:** [matrix-and-firewall.md](matrix-and-firewall.md) (STAGE 0-1 — the claim-evidence matrix whose claims these instances and baselines serve, and the exploration/confirmation firewall that the leakage guard and the fresh-seed generator obey) · [metrics-and-statistics.md](metrics-and-statistics.md) (STAGE 4 — the metrics scored on these instances and the paired test / correction / effect size that judge the comparison against these baselines) · [ablation-sensitivity-budget.md](ablation-sensitivity-budget.md) (STAGE 5-6 — the ablations as the fourth baseline class, the sensitivity sweep over the Layer-3 knobs, and the budget that totals methods × instances × seeds) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (the reproduced baseline harness this stage reuses as the SOTA to beat) · [../../crucible/SKILL.md](../../crucible/SKILL.md) (the forged method whose claims these instances and baselines are chosen to prove) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 2 Instances, STAGE 3 Baselines).

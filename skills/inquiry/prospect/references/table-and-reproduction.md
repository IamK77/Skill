# Landing the Gap — the comparison table, reproduction, and the one-page statement (STAGE 5)

This reference is the depth behind **STAGE 5 — Land** of the [../SKILL.md](../SKILL.md) flight plan. It governs the close of the whole hunt: turning a gap that has survived the filter ([falsify-and-rank.md](falsify-and-rank.md)) and its cheap kill-shot into the three concrete artifacts that *are* a finished literature review. It backs the three land checks — `baselines-reproduced`, `gap-statement-one-page`, and `comparison-table-complete` — and it installs the close-reading discipline that feeds them. The single fact this stage hangs on:

> The literature review is done when three artifacts exist — a one-page gap statement, a core-paper comparison table, and a baseline reproduced on your own machine with a number you verified — not when the reading stops. Report only what you reproduced; an unreproducible SOTA may itself be your gap.

---

## Why "three artifacts," and not "I finished reading"

Reading has no terminus. There is always one more paper, one more citation chain, one more arXiv listing from last week. An agent that can batch-read a hundred PDFs makes this worse, not better: it removes the natural exhaustion that used to stop a human, so the pile can grow without bound while you feel productive. The signature failure of this whole skill is not laziness — it is **forever reading, never committing**: the researcher who has read two hundred papers, can recite every method, and still cannot say in one sentence what they will do that is new.

The cure is to define "done" by **what you produce**, not by what you consume. Three artifacts:

1. **A one-page gap statement** — what's the problem, where's the SOTA, where *exactly* is the hole, by what idea you fill it.
2. **A core-paper comparison table** — ~30 papers compressed to a fixed column schema, the direct raw material for your eventual Related Work section.
3. **One or two reproduced baselines** — the methods you will be judged against, *running on your machine*, with numbers you personally verified against the paper.

When you hold these three, stop. You are done — not because you've read everything (you haven't, and you never will) but because you can now place the bet with evidence behind it. When you don't hold them, you are not done, no matter how high the unread pile. The rest of this document is how to build each one, and the close-reading discipline that feeds all three.

The three are not independent. The table is built from the mining output and refined by close reading; the close-reading notes accumulate a "limitations I found myself" column that *is* the gap; the reproduced baselines turn one row of the table from claimed numbers into verified ones — and a reproduction that *fails* may rewrite the gap statement entirely. Build them in roughly that order — table first as scaffolding, close reading to fill and sharpen it, reproduction to ground-truth it, gap statement last as the distilled conclusion — but expect to loop.

---

## Build step 1 — the core-paper comparison table

### What it is

After mining ([seven-seams.md](seven-seams.md)) you have a wide pool — often 50-100 in-scope papers the seams surfaced. The table is the **compression of that pool to ~30** along a fixed schema, one row per paper, so that the field becomes *legible at a glance*: who solves what, with what idea, under what guarantee, on what benchmark, with code or without, admitting what limitation, and how each relates to your idea.

Two things make this artifact worth real care.

**First, it is the free Related Work section.** Every computational-research paper has a Related Work / prior-art section, and writing it from cold months later is slow and error-prone. If you build this table carefully *now*, at the moment your understanding of the field is forming, the writing later is nearly free: each row is a sentence or two of prose, and the "relation to your idea" column is the argument that section has to make. The cost is front-loaded into the part of the project where it pays the most — choosing the bet — and recovered with interest at writing time.

**Second, building it forces the field through your head.** You cannot fill "relation to your idea" for thirty papers without forming a real model of the territory. The table is not bookkeeping; it is the externalized shape of your understanding.

### The column schema

A workable default — adjust the columns to your field, but keep them *fixed* across rows so the table reads as a matrix, not a pile of notes:

| Column | What goes in it | Why it earns a column |
|---|---|---|
| **Problem setting** | The exact problem class: inputs, objective, constraints, online/offline, stochastic/deterministic. | This is what decides whether two papers are even comparable. Half of all "they already did it" panics dissolve here — the settings differ. |
| **Method core idea** | One phrase for the technical heart: "LP relaxation + randomized rounding," "GNN policy trained by REINFORCE," "column generation with a learned pricing heuristic." | Lets you cluster by approach and spot the crowded vs. empty method families. |
| **Theoretical guarantee** | The proven claim, if any: approximation ratio, regret bound, convergence rate, sample complexity — or explicitly *"none (empirical only)."* | The blank cells in this column are often the gap: a strong empirical method with no guarantee is an opening for a theory contribution. |
| **Benchmark & metrics** | Datasets / instance generators and the metrics reported (optimality gap, makespan, wall-clock, primal-dual gap). | Tells you what you'll have to run, and whether a shared benchmark even exists (a fundability question — see [falsify-and-rank.md](falsify-and-rank.md)). |
| **Key numbers** | The headline result, with its condition: *"1.8% mean optimality gap on TSPLIB ≤1000 nodes"* — never a bare "SOTA." | This is the number you will try to reproduce. Recording its *condition* is half the work of later catching favorable-setup tricks. |
| **Code open?** | Link, or "no," or "partial (inference only)." | Decides reproduction cost and flags reproduction-arbitrage candidates ([seven-seams.md](seven-seams.md)). |
| **Self-stated limitations** | What the authors admit — in the limitations / future-work section, or buried in the experimental caveats. | These are gaps the authors *argued the importance of for you.* High-frequency, cross-paper admitted limitations are the limitation-clustering seam's raw ore. |
| **Relation to your idea** | One line: subsumes / orthogonal / strictly weaker setting / same idea different domain / the baseline I must beat. | This column *is* your Related Work argument and your novelty case. The hardest to fill and the most valuable. |

### Who fills the cells, and who decides the rows — the division of labor

The agent is the **batch-extraction miner** here. Feed it the PDFs and have it extract the cells per paper. This is exactly the manual labor the agent exists to do in parallel: thirty papers' worth of "find the guarantee, find the benchmark, find the admitted limitation" is hours of human drudgery and minutes of agent work.

But **which papers enter the table versus get cut is your call, and it is not delegable.** The selection criterion *is your understanding of the field taking shape* — deciding that these five papers are the spine of the area and those twenty are derivative is the judgment the whole artifact exists to externalize. Hand that choice to the agent ("pick the 30 most relevant") and you have automated away the one part that was teaching you the field. The agent ranks by citation count and keyword overlap; you rank by what actually decides your direction.

So the loop is: **you choose the ~30 (and keep choosing as the table teaches you); the agent fills the cells; you audit the cells.** The audit is not optional — see the verification discipline below.

A copy-ready extraction instruction:

```
I will give you N paper PDFs. For EACH paper, extract exactly these fields and
return ONE markdown table row per paper. Do not editorialize, do not rank, do
not drop any paper — extract all N.

Columns: problem_setting | method_core_idea | theoretical_guarantee |
benchmark_and_metrics | key_numbers_with_condition | code_open | self_stated_limitations

Rules:
- theoretical_guarantee: quote the proven claim verbatim (e.g. "2-approximation,
  Thm 3.1"). If the paper proves nothing, write "none (empirical only)". Do NOT
  infer a guarantee from the abstract's language.
- key_numbers_with_condition: the single headline result AND the exact condition
  it holds under (dataset, instance size, metric). Quote from a RESULTS TABLE,
  not the abstract. If the abstract and the table disagree, use the table and
  flag it.
- self_stated_limitations: quote or tightly paraphrase only what the AUTHORS
  admit. If they admit none, write "none stated".
- For every cell, append the page or table number you took it from, like [p.7]
  or [Tbl 2]. A cell with no source pointer is not acceptable.

After the table, list any paper where you could NOT find a field, naming the
field — do not guess to fill a blank.
```

The page/table pointer in every cell is the load-bearing rule: it makes the audit a lookup instead of a re-read, and it is the agent's leash against the two signature failures below.

### A short illustrative row

Suppose a vehicle-routing field. One row of the table might read (fields abbreviated):

> **Setting:** capacitated VRP, single depot, deterministic, offline. **Core idea:** attention-encoder + autoregressive decoder, trained by REINFORCE with a greedy rollout baseline. **Guarantee:** none (empirical only) [p.5]. **Benchmark:** uniform-random instances n=20/50/100; metric = tour length, gap to LKH [Tbl 2]. **Key numbers:** 0.9% gap to LKH at n=50, 4.5% at n=100 [Tbl 2]. **Code open:** yes (training + inference). **Self-stated limitation:** "performance degrades sharply beyond the training distribution size" [p.8]. **Relation to my idea:** this is my primary learned baseline; my claimed delta is the out-of-distribution generalization to n=200+ that this paper admits it cannot do.

Notice that the gap statement is already half-written by the time this single row is honest: the admitted limitation in one column and the relation in the last column together name the hole and the bet. That is the table doing its job.

This is an illustrative construction, not a surveyed fact — the point is the *shape* of a good row, not these numbers.

---

## The feeder — close reading, with the agent as co-reader not lead

The table is built mostly by skim-and-extract. But **5-10 core papers truly decide your direction** — the ones whose method you might build on, whose baseline you must beat, whose proof your contribution extends or contradicts. These you read **word by word yourself**, including the appendix and the proofs. The agent does not read these *for* you; the understanding has to live in your head, because it is what you will defend at review and build on for a year.

Here the agent's role shifts from **lead** (it extracts, you skim) to **co-reader** (you read, it assists). That shift is the whole point of this section. Concretely, the agent is good at four close-reading jobs:

1. **Explain a derivation you're stuck on.** Upload the PDF, point at the step, ask it to expand the algebra or name the lemma being used. Then *check the expansion against the paper* — it will confidently fill a gap the authors left, sometimes correctly, sometimes by inventing a plausible bridge.
2. **Check whether a step holds.** "Does the move from eq (3) to eq (4) actually follow, or is there a hidden assumption?" This is the highest-value use: the agent is a tireless, un-embarrassed checker of the steps you'd otherwise nod past.
3. **Contrast assumptions across papers.** "What is the *essential* difference in ASSUMPTIONS between this paper and that one — not the method, the assumptions?" Differences in assumptions are where most real gaps hide, and they are exactly what abstracts paper over.
4. **Adversarial questioning — the keystone pattern.** After *you* form an understanding, have the agent try to **refute it**, and see whether you can hold your ground. This inverts the please-you gradient (see below) into a stress test. The understanding you can defend against a determined refutation is one you actually own.

A copy-ready adversarial close-reading prompt:

```
I have read this paper closely and formed this understanding:
"<your one-paragraph claim about what the paper proves / assumes / fails at>"

Your job is to REFUTE me, not agree. Specifically:
1. Find the strongest case that my claim is WRONG — a place in the paper (cite
   page/equation/table) that contradicts or undercuts it.
2. If my claim is about a limitation, argue that the limitation does NOT hold —
   that the paper handles the case I think it misses.
3. If my claim is about the proof, find the step where my reading breaks.
Cite the paper for every counter-point. If after a genuine attempt you cannot
refute a point, say so explicitly and explain why it survives.
```

If your understanding does not survive, you learned something cheaply. If it survives a real attack, that surviving claim is a column in your table and possibly a line in your gap statement.

### The fixed close-reading note template

For each core paper, take notes against a fixed five-field template, so the notes accumulate into something you can mine:

1. **What it solves** — the problem, stated precisely enough to compare against its neighbors.
2. **How it solves it** — the mechanism, in enough detail that you could re-derive the key step.
3. **Do the experiments REALLY support the conclusion?** — the critical field. Watch for **favorable conditions hidden in the experimental setup**: a baseline run with default rather than tuned hyperparameters; instances small enough to flatter the method; a metric chosen because it's the one they win on; a single seed; missing variance. The abstract claims a conclusion; the experiments may support a much narrower one. (See the rhetoric-as-result trap below — this field is its antidote.)
4. **Is the limitation author-admitted, or one YOU found?** — keep these separate. Author-admitted limitations are the field's known frontier. **The ones you found yourself are the gold** — a weakness the authors did not flag is one the field may not have priced in.
5. **What technique can I steal for my project?** — the constructive field; even a paper you're not building on usually has one transferable trick.

**The accumulated "limitations I found myself" across the core papers IS the raw material for the gap.** This is the through-line from close reading through the comparison table to the gap statement: read closely → record found-limitations → they cluster → the cluster names the hole → the hole becomes the gap statement. The note template is the funnel.

---

## Build step 2 — baseline reproduction (the biggest agent-era speedup)

### Why this is where agents change the economics most

Pre-agent, getting someone else's research code to run was a notorious time-sink: clone the repo, discover the README is three years stale, fight a dependency graph pinned to a CUDA version that no longer exists, guess at undocumented preprocessing, and finally get the training or solve script to start — often **1-2 weeks** of pure yak-shaving before you saw a single number. Many researchers simply skipped reproduction and quoted the paper's number, which is exactly the failure this stage exists to prevent.

With a coding agent the same task is often **1-2 days**: the agent clones the repo, resolves and installs the dependencies, reads the tracebacks and fixes the environment errors, and runs the script — iterating through the failure modes far faster than a human typing one fix at a time. This is the single largest concrete speedup `prospect` gets from the agent, and it is why reproduction moves from "nice if you have time" to a **required deliverable**.

### The target and the instruction

Reproduction needs a *specific, checkable target*, not "get it running." Pick a number from the paper and aim at it.

A copy-ready reproduction instruction:

```
Repo: <link>   Paper: <attached PDF>
TARGET: reproduce the numbers in Table 2 of the paper on dataset X — specifically
the <metric> for method <M> at <setting>, which the paper reports as <value>.

Do this:
1. Clone the repo. Set up a clean, reproducible environment (record exact
   versions — Python, framework, CUDA, every pinned dep) so I can recreate it.
2. Get the training/solve script for Table 2 running on dataset X. Fix
   environment and dependency errors as they arise; log each fix.
3. Run it to completion and report the number you actually obtained, alongside
   the paper's claimed number, in a small table.
4. List EVERY place where you had to deviate from the paper or the repo's
   defaults: undocumented preprocessing, a hyperparameter you had to guess, a
   data split you had to choose, a seed. Flag each as a possible source of any
   discrepancy.
5. Do NOT tune to match the paper's number. Report the honest first faithful run.

Then write the whole thing up as (a) a README that lets me re-run it from a clean
checkout, and (b) a single one-button script (`./reproduce.sh`) that goes from
environment to the reported number.
```

The instruction to **not tune toward the paper's number** is deliberate: an agent left to "match Table 2" will quietly search hyperparameters until it does, which manufactures a false reproduction and destroys the signal. You want the honest first faithful run.

### The human does not leave — verify the number yourself

This is the hard rule of the whole stage: **report ONLY what you verified on your machine; NEVER the number the paper merely claims.** The agent produces a number; *you* check it against the paper, and any difference beyond explainable random variation gets chased down. The diagnostic ladder:

- **Different preprocessing?** — the most common cause; a normalization or filtering step the paper mentioned in one clause and the repo did differently.
- **Different hyperparameters?** — a learning rate, a beam width, an instance-size cap, a seed the agent had to guess.
- **Different data split or instance generator?** — "uniform random n=100" hides a dozen generator choices.
- **Or water in the original paper** — the number is favorable-condition cherry-picking, a reporting error, or simply does not hold under faithful settings.

The agent gathers the evidence for each branch (it can diff its config against the paper, re-run with a corrected preprocessing step, sweep a suspected hyperparameter). The *verdict* on which branch it is — and whether the residual gap is explainable variance or something real — is yours.

### Reproduction failure is intelligence

The most important reframe here: **a reproduction that fails is not a dead end — it may be your entry point.** A method claiming SOTA that you cannot reproduce under faithful, fair settings is itself a finding:

- It may be a **re-evaluation / reproducibility paper** in its own right — several venues have an explicit track for exactly this, and "the field's reported SOTA doesn't replicate" is a real, publishable contribution.
- Its **one genuinely-working component**, separated from the parts that don't hold up, may be the honest starting point for your method.
- At minimum it *corrects your table*: the row you would have entered with the claimed number gets entered with the real one, and your sense of where the SOTA actually sits shifts — sometimes opening the gap you were looking for.

So do not treat a failed reproduction as wasted days. It is the reproduction-arbitrage seam ([seven-seams.md](seven-seams.md)) paying out at the landing stage. The hard rule and this reframe are the same coin: because you only ever report verified numbers, the *gap between claimed and verified* becomes visible — and that gap is intelligence.

### Capture it as a README + one-button script

Have the agent write the whole reproduction up as a **README plus a one-button script** (`./reproduce.sh` from clean checkout to the reported number). This is not tidiness for its own sake: the later inquiry skills' large-scale-experiment stage will **reuse this harness repeatedly** — as your baseline to beat, as the scaffold your own method plugs into, as the thing you re-run when a reviewer asks. The reproduction you do now is infrastructure you amortize across the whole project. A reproduction that lives only in your shell history and your memory has to be redone; one captured as a script is done once.

---

## The agent's two signature failures, at the landing stage

Everything above assumes the agent is the **means** — the parallel extractor, the co-reader, the reproduction engine — and never the **oracle**. The reason is its gradient: the agent is optimizing to please you, and at this stage that produces two specific, recurring failures. Name them so you catch them.

**1. Citation hallucination.** Asked to fill the table or support the gap statement, the agent will invent a plausible paper — a real-sounding title, a real author's name, a venue and year — that does not exist, or attach a real paper to a claim it never made. The map is not the territory. **Every cell traces to a source you can open.** This is why the extraction prompt demands a page/table pointer per cell and why the audit is a lookup: an unsourceable cell is a hallucination until proven otherwise. Before any paper enters your library, its title *and* its core claim are checked against the actual source.

**2. Reading an abstract's rhetoric as an experimental result.** "We significantly outperform prior work" in an abstract is *marketing*, not a result. The agent — and the hurried human — will lift that sentence into the "key numbers" cell or the gap statement as if the experiments established it. They may establish something far narrower (one dataset, one instance size, one favorable metric), or the abstract may overstate what Table 2 shows. The discipline: **the key-numbers cell quotes a results table with its condition, never the abstract**; the close-reading note's third field ("do the experiments REALLY support the conclusion?") exists precisely to separate the claimed conclusion from the supported one. When the abstract and the table disagree, the table wins and you flag the gap.

Both failures share a root: the agent reports the *flattering, fluent* version. The whole verification discipline of this stage — sourced cells, verified numbers, table-not-abstract — is the counterweight. Command it adversarially (the refutation prompt), make it cite, and check what it cites.

---

## Build step 3 — the one-page gap statement

### What it is

One page. Four questions, answered in order:

1. **What is the problem?** — stated so a non-specialist in your subfield understands the stakes, and a specialist agrees it's the right framing.
2. **Where have existing methods got to — the SOTA?** — the honest current frontier, anchored in your table and your *verified* (not claimed) numbers.
3. **Where EXACTLY is the hole?** — and which *kind* of hole it is. The four kinds, because the kind dictates the contribution:
   - **Performance not good enough** — everyone's still bad on this benchmark / this regime (a better-method contribution).
   - **Assumptions too strong / unrealistic** — every method assumes something false in practice (a relaxed-setting contribution, with a built-in motivation story).
   - **A theoretical blank** — strong empirical results, no guarantee; or a conjecture nobody has proven (a theory contribution).
   - **A flawed evaluation protocol** — the benchmark is saturated, leaky, or measures the wrong thing (a re-evaluation / new-benchmark contribution — and this is often what a failed reproduction reveals).
4. **By what idea do you intend to fill it?** — the one-line bet, concrete enough to design an experiment against.

### Why one page, and why it isn't outsourced

This page is **pure judgment and taste, and like the choice of which papers enter the table, it is not delegable.** The agent did the extraction, the co-reading, the reproduction; it cannot do *this*, because this is the bet, and the bet is yours to own and defend. What the agent *can* do is play **devil's advocate against the finished statement** — the same adversarial move as everywhere in this skill:

```
Here is my one-page gap statement: <paste>

Attack it as a hostile reviewer:
1. "Why has nobody filled this in three years — is it un-thought-of, or is it
   unimportant / too hard / already done under another name?" Make the strongest
   case that the hole is NOT worth filling.
2. Find the weakest of my four answers (problem / SOTA / hole / idea) and say why
   a reviewer would reject it.
3. Name the single most likely existing paper that already does this, and the
   precise reason a reviewer would call my contribution incremental.
Do not reassure me. If after a real attempt the statement holds, say which parts
survived and why.
```

You run the attack; you weigh it; **the conclusion is yours.** The agent that wrote your gap statement for you wrote you a confident bet on a gap it cannot feel the cost of being wrong about.

The **one-page constraint is itself a test**: if the gap won't fit on a page, you don't yet understand it well enough to bet on it. A gap you can't state crisply is a gap you can't defend at review, can't scope into a 3-6 month experiment plan, and probably can't tell apart from the three nearest existing works. The page is the forcing function that converts "I've read a lot" into "I know exactly what I'm doing and why."

---

## The terminus

With the three in hand — **the one-page gap statement, the comparison table, and one or two reproduced baselines running on your machine with numbers you verified** — the literature review is **done.** Not "when every paper is read." Not "when the agent stops finding new arXiv listings." When the three artifacts exist.

Restate the anti-pattern one last time, because it is the failure this entire stage is built to prevent: the signature failure of `prospect` is not laziness but its opposite — **forever reading, never daring to commit.** The terminus is the three artifacts, not the empty inbox of unread PDFs. An infinite reading list always has one more paper; three finished artifacts are a place to stop, and a bet you can defend.

Carry them forward. The gap statement is the thesis the later inquiry skills design a method against; the table is your Related Work section, already 80% written; the reproduced baselines are the harness your experiments reuse and the numbers you must beat. You did not "finish reading" — nobody ever does. You **landed the gap**, and you have the three things that prove it.

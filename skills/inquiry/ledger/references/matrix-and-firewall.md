# Matrix & Firewall — decide evidence before you look (STAGE 0-1)

This reference is the depth behind **STAGE 0 — Matrix** and **STAGE 1 — Firewall** of the [../SKILL.md](../SKILL.md) flight plan. It is the spine the rest of the protocol hangs on: STAGE 0 turns crucible's two or three claims into experiments and writes the verdict for each one *before* any data exists; STAGE 1 builds the wall that keeps the patterns you fished out of exploration from ever becoming numbers in the paper. It backs the four gated checks across those two stages — matrix's `matrix-bidirectional` (every claim has an experiment and every experiment has a claim) and `verdicts-pre-written` (support / partial / refutation conditions committed before the run); firewall's `phases-split` (exploration and confirmation data never mix) and `runs-provenance-stamped` (every run, however casual, replayable from a run ID). Two of the three non-delegable bets of the whole skill live here.

The governing fact, restated because every move below is judged against it:

> Write down what counts as evidence before you look at the data, and never let a pattern you fished out of exploration become a number in the paper: exploration generates hypotheses, confirmation proves them on fresh seeds under a frozen protocol, and the two never mix.

---

## What step three produces

The product of this whole skill is **one document**: an experiment-protocol written *before* any formal experiment runs. It contains, in order, the claim-evidence matrix, the instance list, the baseline list plus its tuning protocol, the metric and statistics plan, the ablation and sensitivity plan, and the compute budget plus schedule. The later references fill the later sections; this one fixes the first two and the discipline that governs all of them.

Writing the protocol *first* is not paperwork that precedes the science — it **is** the methodology. The opposite order is the experiment-version of p-hacking: run a pile of experiments, then notice a pattern, then build the story around it. You saw the pattern only after looking at many results, so it has a real chance of being noise you fished out, and a reviewer's nose for this is extremely good. The protocol-first order removes the move that lets you slide the goalposts after the ball is kicked.

The investment is front-loaded once and returns three times:

| The protocol section | Becomes, later | Returned to |
|---|---|---|
| claim-evidence matrix + verdicts | the paper's experiments chapter (what we test, what counts) | reviewers, future-you |
| instances + baselines + stats | the reproduction package's README and config | replicators, the field |
| ablation + sensitivity + budget | the rebuttal material when a reviewer attacks the setup | yourself, six months out |

You are not writing a plan you'll throw away. You are writing the experiments chapter and the README before the experiments, which is the only order that keeps them honest.

The lever, as everywhere in the suite: the agent does the parallel labor — it drafts the matrix, batch-runs the chaos tests, stamps provenance, distills the notebook, sweeps for contradictions — but its gradient points at **pleasing you**. Left soft it writes a verdict loose enough that any result "supports" the claim, lets a leaked split through because the number looks great, and reports the too-good result as a triumph rather than a bug. The agent is the **means** — the experiment operator. It is never the oracle. On the two judgments this file installs — *what counts as evidence* and *which side of the firewall a number is on* — it cannot be, because both require a model of what a reviewer will believe that the agent does not have and will fabricate if you ask it to.

---

## STAGE 0 — The claim-evidence matrix

### Translate claims into experiments, both ways

You arrive from [crucible](../../crucible/SKILL.md) with two or three claims — the spec of what the surviving method is supposed to be true about ("learns a construction heuristic that scales to instances 10× past where the SOTA degrades", "needs no per-instance retraining", "the gain comes from the attention over the partial route, not the extra parameters"). The matrix is the table that maps each claim to the experiment(s) that would show it, and it is checked in **both** directions:

```
   CLAIMS (rows)                          EXPERIMENTS (columns)
   ─────────────                          ─────────────────────
   C1 scales 10× past SOTA  ───supports──▶ E1 main table @ {100,1k,5k,10k}
                            ───supports──▶ E2 scaling curve vs size
   C2 no per-instance retrain ─supports──▶ E3 zero-shot transfer table
   C3 gain is the attention ──supports──▶  E4 ablation: attention off/random
                                           E5 wall-clock vs baselines  ◀── serves NO claim
```

- **A claim with no supporting experiment** is a claim you cannot defend. Either add the experiment, or **delete the claim** — an unsupported claim in the paper is a line a reviewer circles and a promise you didn't keep.
- **An experiment that serves no claim is simply not run.** E5 above measures wall-clock but no claim is *about* wall-clock; either it is secondary cost-reporting attached to C1 (then say so) or it is machine-hours spent to produce a number nobody is arguing over. **The saved machine-hours are the point** — the bidirectional check is also a budget instrument. In a vehicle-routing field where one 10k-node run is six GPU-hours, an experiment column nobody's claim points at is a row of the budget table you can strike before you spend it.

The check `matrix-bidirectional` is clear when **the matrix has been read both ways**: no claim row is empty of experiments, and no experiment column is empty of claims (or is explicitly tagged secondary-cost under a named claim).

### The most important column: the verdict, written before the data

A matrix that only says "C1 is supported by E1" is half-built. The load-bearing column is the one written in advance: **what result counts as SUPPORT, what counts as PARTIAL support that forces the claim to be weakened, and what counts as REFUTATION.** Writing the negation condition before seeing the data is the line between honest research and post-hoc story-fitting.

A worked verdict for C1 ("scales 10× past where SOTA degrades"):

| Verdict | Condition (written now, before E1/E2 run) | Consequence |
|---|---|---|
| **SUPPORT** | Median objective better than *all* baselines on the main table at ≥5k nodes, AND a paired Wilcoxon test significant at the corrected level. | Claim stands as written. |
| **PARTIAL** | Wins at ≥5k only on the Euclidean instance class, loses or ties on the clustered class. | **Weaken** the claim to "...on Euclidean instances," do not report it as general. |
| **REFUTATION** | No size at which the median beats the strong SOTA, or the gap shrinks as size grows. | Claim is false. Retire it; the firewall section says how to recover something honest. |

Three properties make this column real rather than decorative:

- **It names the metric, the threshold, the instance scope, and the statistical bar together.** "Better" is not a verdict; "median better on the main table at ≥5k nodes AND paired test significant after Holm correction" is. The statistics and metric machinery lives in [metrics-and-statistics.md](metrics-and-statistics.md); STAGE 0 only requires that the verdict *references* it concretely, not that you've run it.
- **The PARTIAL row is where honesty actually happens.** Pure support/refute is easy to write; the discipline is pre-committing the *narrowing* — "if it wins only on one class, the claim becomes about that class." Without this row, a one-class win gets written up as a general win and the reviewer who reads the per-class table desk-rejects you for it. With it, you've already promised yourself the weaker, true claim.
- **The refutation condition is non-negotiable.** A claim you cannot imagine a result refuting is not a scientific claim; it is a slogan. If you cannot write the REFUTATION row, you do not yet understand what the claim asserts — fix the claim, not the matrix.

### The verdict is the first non-delegable bet

The agent can draft this matrix — and you should make it, because a first draft in five minutes beats a blank page. But **the verdict is yours**, and it is the first of the three bets you cannot outsource. The agent's gradient is to write verdicts that the eventual result will satisfy; asked to "set a success threshold," it will pick one loose enough that almost any run clears it, because a cleared threshold pleases you. You set the threshold against what a *reviewer* will believe, which is stricter and which the agent does not feel.

Copy-ready matrix-draft prompt (you edit the verdicts after):

```
From these claims about my method, draft a claim-evidence matrix. Do NOT
soften anything; draft tight, I will tighten further.

  Claims (from the method spec):
    C1: <...>   C2: <...>   C3: <...>
  My field / setting: <e.g. capacitated VRP, learned construction heuristic>

For EACH claim, propose:
  1. EXPERIMENT(S) that would support it — name the table/curve, the instance
     classes, the sizes, and which baselines appear. Be specific enough that I
     could run it.
  2. A draft SUPPORT condition, a draft PARTIAL condition (what narrower result
     would force me to WEAKEN the claim, and to what), and a draft REFUTATION
     condition (what result makes the claim FALSE). State each as a concrete
     threshold on a named metric over a named instance scope — never "better"
     or "works well".

Then, separately, list any experiment you proposed that does NOT map to a
claim, and any claim you could NOT propose an experiment for. Flag both — I
need to add an experiment, delete the claim, or drop the orphan experiment.

Output: the matrix as a table (claim | experiment | support | partial |
refutation), then the orphan-and-gap list.
```

The check `verdicts-pre-written` is clear when **every claim carries an explicit, concrete support / partial / refutation condition committed before the main run** — thresholds on named metrics over named instance scopes, not adjectives, and *you* set them.

---

## STAGE 1 — The exploration / confirmation firewall (the keystone)

The matrix says what counts as evidence. The firewall makes sure the evidence is *earned*, not fished. It is borrowed from pre-registered research and it is the keystone of this skill.

### Honor the real practice first: the MVP and the append-only notebook

The common, good, real practice of computational research looks like this, and the firewall does not throw it away — it completes it. You build an MVP of the idea, you chaos-test it (kick it, vary it, throw it at odd instances to see what breaks), you find problems progressively, and — if you are disciplined — you keep an **append-only history file**: a markdown log of findings in time order, appended to and never edited.

Append-only is genuinely good, and worth saying why so the discipline survives the inconvenient day:

- It is the **experimental-science lab notebook**. A wet-lab notebook is bound and paginated precisely so you cannot tear a page out; the append-only markdown file is the computational version.
- It fights the two biggest cognitive enemies of honest research. **Hindsight bias** — rewriting a messy, branching exploration into a clean "I knew it all along" straight line — is impossible if the messy line is sitting there in timestamp order. And the **temptation to quietly delete unfavorable evidence** — the run that contradicted your favorite hypothesis — has nowhere to hide when deletion is off the table.
- It **unifies two records into one**: the death log (what you tried and abandoned, and why) and the protocol changelog (what you later changed about the frozen plan, and after seeing what). One file, one timeline.

If you already keep this notebook, you have the *exploration* half right. The firewall adds the *confirmation* half and the wall between.

### The missing step: split the phases, never mix the data

> Chaos testing is **exploration**. Its job is to **generate hypotheses**, not to produce numbers for the paper.

Split the workflow into an **EXPLORATION** phase and a **CONFIRMATION** phase whose data never mix.

Exploration's output is hypotheses, written into the history file: *"component X seems to drag on large instances"*, *"results jump once parameter p crosses ~0.3"*, *"the baseline collapses on clustered instances but we don't"*. These are leads. They are not findings.

**Exploration numbers never enter the paper.** This is the whole point and the easiest rule to break. A pattern you noticed only *after* looking at many results — many chaos runs, many configs, many instance slices — has a real chance of being noise you fished out, because looking at many things and reporting the most striking one is exactly how noise is manufactured into a false discovery. Reporting that pattern as a conclusion is unconscious p-hacking. It does not feel like cheating; it feels like "I noticed something real." That feeling is the failure mode.

The correct hand-off, in three moves:

```
   EXPLORATION (chaos)                CONFIRMATION (frozen)
   ──────────────────                 ─────────────────────
   chaos-test the MVP                 (1) pick believed findings out of the
        │                                 history file
        ▼                             (2) write each as an explicit hypothesis
   append findings to                     with a PRE-WRITTEN verdict
   history.md (hypotheses)                 ──▶ this IS the claim-evidence matrix,
        │                                      only grown from exploration
   findings accumulate                       rather than designed in a vacuum
        │                             (3) re-run on NEW instances and NEW seeds
        └──── hand off ───────────▶       under the FROZEN protocol
                                       ─────────────────────────────────────
   discovers what MIGHT be true       proves what IS true
   numbers stay in the notebook       numbers go in the paper
```

Note what move (2) does to the matrix from STAGE 0: a matrix grown out of real exploration findings is *better* than one designed in a vacuum, because its claims are ones you've already seen flicker. The firewall does not forbid using exploration — it forbids using exploration's *numbers*. You keep the lead; you re-earn the number on fresh seeds and fresh instances. **Exploration discovers what might be true; confirmation proves what is.**

The check `phases-split` is clear when **the workflow has a named exploration phase whose numbers are notebook-only and a named confirmation phase that re-runs the believed hypotheses on fresh seeds and instances under the frozen protocol** — and you can point at the wall between them.

### Chaos in the ideas, not in the engineering — and run chaos on the scaffold too

A subtlety that decides whether exploration is upgradeable into confirmation at all: **the chaos belongs in the IDEAS, not in the engineering.** You want to be reckless about *what you try* (wild hypotheses, odd parameter regimes, adversarial instances) and rigorous about *how you record it*.

The failure scenario this prevents, which nearly everyone has lived:

> A history entry three weeks ago reads "tried change Y, amazing effect on large instances." Today you want to build on it — and you cannot reproduce it, because you hand-edited a few lines, ran it casually, and kept no record of what changed, which config, which seed, which data slice. The most promising lead you ever had is now unrecoverable.

The fix is to put the rigor in the *scaffold* so it costs you nothing per-run: **the scaffold auto-logs provenance.** Every run, however casual, records into its own result file —

- the **git commit hash** of the code that produced it,
- the **full config** (every hyperparameter, not the ones you remember),
- the **seed**,
- the **data version** (which instance set, which preprocessing).

— so that each history entry needs only a **run ID** to be replayed exactly. The chaos must *also* run on this scaffold: a casual run that bypasses the logger to "just check something quickly" is precisely the run you'll later wish you could reproduce. There is no exception for quick checks, because the quick checks are the ones that surprise you.

The engineering cost is **one-time, and small** — an agent can add provenance-stamping to the MVP in half a day. What you buy is "reproducible chaos": exploration that stays wild in its ideas but leaves a replayable trail, which is the *precondition* for any exploration finding to be upgradeable into a confirmation experiment. A lead you can't replay can't be confirmed; it can only be re-fished, which puts you back in the p-hacking you were trying to escape.

Copy-ready scaffold-instrumentation prompt for the MVP:

```
Add run-provenance logging to this experiment scaffold. Requirements:

  - On EVERY run (including quick/casual ones — no opt-out, no "skip for speed"
    flag), write a result record that includes:
      RUN_ID (a short unique id), timestamp, git commit hash (fail loudly if
      the working tree is dirty — record the dirty diff or refuse to run),
      the FULL resolved config (all hyperparameters, not just overrides),
      the seed, and the data version / instance-set identifier + preprocessing.
  - Store each record so it can be looked up by RUN_ID and replayed exactly:
    a "replay RUN_ID" path that reconstructs config + seed + data version and
    re-runs.
  - Make the RUN_ID trivial to paste into a markdown notebook entry.

Do NOT change the method itself. Show me the record schema and the replay
command. Then run it once and give me the RUN_ID so I can confirm replay works.
```

The check `runs-provenance-stamped` is clear when **the scaffold auto-logs git hash, full config, seed, and data version on every run, and any history entry can be replayed from its run ID** — including the casual ones.

---

## The living companion — curing the write-only notebook

Append-only has a built-in flaw that surfaces around month three: the notebook becomes **write-only**. Two thousand lines of time-ordered entries that you will never re-read end to end, so the early findings — often the best ones — are effectively lost. The log is honest but inert. Two stacked fixes keep it alive without breaking the append discipline.

### (a) A lightweight entry template — search handles without losing append-only

Give each entry a minimal template. It does not break append-only (you still only ever append; you just append in a shape):

```
## 2026-06-11 14:30  RUN: a3f9c2
TYPE: hypothesis        ← one of: observation | hypothesis |
                          hypothesis-confirmed | hypothesis-refuted | decision
Component X's cost grows super-linearly past ~5k nodes; the attention block
dominates wall-clock there. Suspect it's the quadratic adjacency, not the
decode. Worth a controlled scaling check on the generator.
```

- `date` + `RUN:` ties the entry to a replayable run.
- The **TYPE TAG** is the load-bearing addition. Five tags — `observation`, `hypothesis`, `hypothesis-confirmed`, `hypothesis-refuted`, `decision` — give later search and statistics a handle: *"show me every open hypothesis"*, *"how many of my hypotheses got confirmed vs refuted"* (a humbling and useful ratio), *"what decisions did I make and on what evidence."* Without the tag, the file is prose; with it, it is queryable.
- The content stays free-form. The template is a frame, not a form to fill — append discipline is preserved precisely because the only rule is "append, with these few fields at the top."

### (b) A second, rewritable file — the distilled state

Build a **second file** (call it `state.md`) that **is** allowed to be rewritten. It is the snapshot of your current understanding, distilled from the log:

- **Conclusions you currently believe** — each pointing back, by run ID and entry date, to its evidence in the history file. (The pointer is what keeps the state file honest: a belief with no history entry behind it is a belief you should distrust.)
- **Open hypotheses** — the leads not yet confirmed or refuted.
- **Confirmed dead ends** — the directions you've closed, so you don't reopen them.

The relationship is exact and worth stating plainly: **the history file is the log; the state file is the living world-view distilled from it.** The log is append-only and complete and inert; the state is rewritable and lossy and alive. You never edit the log to match the state; you re-derive the state from the log.

The distillation is **the agent's job**, and it is a job the agent is genuinely good at — read the whole history file, rewrite the state file. Two things to demand of it that you cannot easily do yourself:

- **Detect self-contradiction across months.** The agent reads all two thousand lines at once, which you no longer will, and flags *"entry 47's observation (component X helps on large instances) conflicts with entry 213's conclusion (component X is the bottleneck on large instances) — you never went back to resolve this."* A contradiction you forgot is a finding you don't actually have; surfacing it is the agent earning its keep.
- **Answer "have I tried this before?"** Hook the history file into a retrievable workflow so that *before any new experiment* you ask the agent whether you've run something like it. This kills repeated dead-end work — the second most common waste mode after sunk cost, below.

Note the firewall still holds across both files: the state file distills *exploration's* understanding, and its believed conclusions are leads to be re-confirmed under the frozen protocol — they are not, themselves, paper numbers. The state file tells you *what to confirm*; it does not let you skip the confirming.

### The sunk-cost guard — a pre-written abandonment condition (links to crucible)

The most common waste mode of MVP-driven work is **sunk cost**. The MVP is built; chaos testing always turns up *some* small improvement (it always does — there is always a knob that buys 1%); so you grind for four months on a direction whose ceiling is actually low, because every week of small wins makes quitting feel like quitting just before the breakthrough.

The structural fix has two parts:

1. **crucible's oracle ceiling** — the upstream estimate of how good this direction could *possibly* get if everything went right. (This is crucible's work; see [crucible](../../crucible/SKILL.md).) If the ceiling is low, no amount of chaos-test grinding raises it.
2. **A pre-written abandonment condition, appended into the history file in advance**, in the append-only spirit:

```
## 2026-03-01 09:00  RUN: —
TYPE: decision
ABANDON CONDITION: if by 2026-07-01 the median gap to the strong SOTA at 5k
nodes has not closed to within 2%, abandon this direction. (Oracle ceiling
estimate: best plausible is ~1% gap; if we're not near it by July, the ceiling
isn't reachable here.)
```

This works *because* it is append-only. You cannot edit it away when July comes and the result is inconvenient — it sits in the log, in your own hand, and when the date arrives you must face it. A live, editable to-do would be quietly deleted the week before the deadline; the append-only abandonment condition cannot be. It is the sunk-cost circuit-breaker installed *before* you have anything sunk.

### Copy-ready: the periodic distill-and-contradiction sweep

Run this on the history file at a regular cadence (weekly during heavy exploration). It produces the rewritten state file and the contradiction report:

```
Read the ENTIRE history file at <path>. Then do three things.

1. DISTILL → rewrite state.md (overwrite it) with three sections:
   - BELIEVED CONCLUSIONS: each as one line, with a pointer to the history
     entry/entries (date + RUN id) that support it. Omit any "conclusion" that
     has no supporting entry — tell me you dropped it and why.
   - OPEN HYPOTHESES: TYPE:hypothesis entries not yet confirmed or refuted.
   - CONFIRMED DEAD ENDS: directions closed (TYPE:hypothesis-refuted or a
     decision to abandon), so I don't reopen them.

2. CONTRADICTION SWEEP: scan all entries for pairs that conflict — an
   observation that contradicts a later conclusion, a hypothesis confirmed in
   one entry and refuted in another, a decision that ignores an earlier
   finding. For each, cite BOTH entries (date + RUN id) and state the conflict
   in one line. If a conflict was never resolved, say so.

3. ABANDONMENT CHECK: list every TYPE:decision entry containing an ABANDON
   CONDITION, with its deadline and threshold, and flag any whose deadline has
   passed — state plainly whether the condition is now met.

Do NOT edit the history file. Do NOT invent conclusions not present in it.
Quote run IDs exactly; if an entry lacks a run ID, say "no run id — not
replayable" rather than guessing one. Output state.md in full, then the
contradiction report, then the abandonment check.
```

Two guards in that prompt earn their place. "Omit any conclusion with no supporting entry" stops the agent inventing a tidy world-view that the log doesn't actually support — its please-you gradient otherwise rounds your beliefs up into conclusions. "Say 'no run id — not replayable' rather than guessing" stops it fabricating a provenance pointer to make an entry look more solid than it is — a hallucinated run ID is worse than a flagged gap, because it sends you replaying a run that never happened.

---

## The firewall as the second non-delegable bet

The agent operates both phases: it batch-runs the chaos tests, stamps provenance, distills the state file, sweeps for contradiction, answers "have I tried this before." All of that is the means. But **which side of the firewall a number is on — exploration or confirmation — is the second non-delegable bet**, and the agent will get it wrong in the flattering direction every time.

The mechanism is the same one as everywhere in the suite. A striking number from a chaos run *looks* like a finding; the agent, optimizing for handing you good news, will present it as one — "component X gives a 12% improvement!" — without flagging that the number came from exploration, was noticed after looking at many slices, and has not been re-earned on fresh seeds. It is not lying; it is reporting the result you'd be happy to hear. The firewall is the rule that the *number's source*, not its size, decides whether it can enter the paper, and only you hold that line:

| The agent does (means) | You decide (the bet) |
|---|---|
| runs chaos tests, stamps provenance | whether a striking chaos number is a lead or a finding |
| distills `state.md`, flags contradictions | which beliefs are solid enough to write as claims |
| re-runs hypotheses under the frozen protocol | that the re-run used *fresh* seeds/instances, not the exploration ones |
| reports "this configuration scored 12% better" | that 12% from exploration is notebook-only until confirmed |

The third non-delegable bet — *whether an anomaly is a bug or a result* (a too-good number triggers a feasibility-and-leakage check, never a celebration) — is set up here by provenance (you can replay the anomaly) and lands in the downstream stages where the leakage guards and the budget pilot live ([instances-and-baselines.md](instances-and-baselines.md), [ablation-sensitivity-budget.md](ablation-sensitivity-budget.md)).

---

## What you carry out of STAGE 0-1

Out of these two stages you carry: a **claim-evidence matrix** read both ways, with a concrete support / partial / refutation verdict written for every claim *before* any data exists; a **firewalled workflow** with a named exploration phase (chaos-testing the MVP, hypotheses into an append-only, provenance-stamped notebook) and a named confirmation phase (the believed hypotheses re-run on fresh seeds and instances under the frozen protocol); and the **living companion** — the templated append-only log, the rewritable distilled `state.md`, the periodic contradiction sweep, and the pre-written abandonment condition that no inconvenient day can edit away.

That is the spine. Everything downstream — which instances ([instances-and-baselines.md](instances-and-baselines.md)), which baselines and how to tune them fairly ([instances-and-baselines.md](instances-and-baselines.md)), which metrics and statistics make a difference believable ([metrics-and-statistics.md](metrics-and-statistics.md)), which ablations attribute the gain and how the protocol is finally frozen ([ablation-sensitivity-budget.md](ablation-sensitivity-budget.md)) — is the specification of *how the confirmation phase gathers the evidence the matrix demands*. The verdict written here is the thing all of it is measured against.

---

**Cross-links:** [instances-and-baselines.md](instances-and-baselines.md) (STAGE 2-3 — the three-layer instance set the confirmation runs use, the leakage guards that keep the firewall honest at the data level, and the four baseline classes the matrix's verdicts compare against) · [metrics-and-statistics.md](metrics-and-statistics.md) (STAGE 4 — the paired test, multiple-comparison correction, and effect size that turn a verdict's "significant" from an adjective into a number) · [ablation-sensitivity-budget.md](ablation-sensitivity-budget.md) (STAGE 5-6 — the ablation that confirms C3-style "the gain comes from X" claims, and the freeze that locks this protocol with the same append-only changelog discipline as the history file) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 0 Matrix, STAGE 1 Firewall) · [../../crucible/SKILL.md](../../crucible/SKILL.md) (upstream — the surviving method and its claims that become this matrix, and the oracle ceiling that backs the sunk-cost abandonment condition) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (the suite's first lens — its documented-death discipline and adversarial-verification ethos are the same discipline this firewall extends from gap-finding into experiment design).

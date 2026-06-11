# Spec & Ceiling — fix the target and measure the prize (STAGE 0-1)

This reference is the depth behind **STAGE 0 — Spec** and **STAGE 1 — Ceiling** of the [../SKILL.md](../SKILL.md) flight plan. It is the foundation the rest of the arc aims through: before a single component is built, you fix *what good means* as a contract of decidable acceptance tests that doubles as your paper's claim draft, and you *measure the prize* — its size and its location — with an oracle ladder, so the variants you race next are aimed at the component that actually holds the gain. It backs the two spec checks — `spec-is-decidable` (every line is a measurable acceptance test, not a platitude) and `spec-is-claim-draft` (the spec is the verifiable form of the two-or-three sentences the paper must make a reader believe) — and the two ceiling checks — `oracle-ladder-built` (you opened the cheats one level at a time, at two scale tiers, not one all-on ceiling) and `ceiling-justifies-direction` (the total gap says the direction is worth doing and the inter-level gaps say which component to attack).

> A method's target is fixed before it is designed: every spec line is a decidable acceptance test and a draft of a paper claim, and the size and location of the prize are measured by an oracle ladder before a single component is built.

---

## Why both halves come before the design

The two stages share one job: **stop you from building before you know what you are building toward and whether it is worth it.** In the human era both were skipped by default, because the only way to find out whether a direction paid off was to build the method and measure it — weeks of work to learn a direction was dead. The spec was a vague intention in your head ("make it scale better"); the ceiling was unmeasured because measuring it cost almost as much as the method itself.

The agent-era change is that both are now cheap. The agent rewrites your gap statement into decidable criteria in an afternoon. The agent stands up an oracle prototype — a version that *cheats*, that gets to see the future or solve subproblems exactly — in a day, because a cheating prototype is far easier to write than a real method (you skip the hard part on purpose). So you front-load both: you fix the target as a contract, and you measure the prize against that contract, **before** STAGE 2 generates a single variant. The payoff compounds — the spec becomes the paper's claims, the ladder becomes the paper's motivation figure, and the inter-level gaps aim the tournament. Nothing here is preamble; every artifact is a part of the eventual paper made at the moment it is cheapest.

**The agent is the means, never the oracle — twice in these two stages.** It is your *spec-translator* (it rewrites woolly requirements into acceptance tests and flags the ones it cannot) and your *oracle-prototyper* (it builds the cheating versions and runs the ladder). It is never the source of truth on either. Its gradient points at pleasing you, and that produces the two signature failures this document keeps guarding against: it will hand back a spec line that *looks* decidable but quietly measures the wrong thing ("solve time within 2× baseline" — on instances the baseline happens to ace), and it will hand back a ceiling number that *soars* because the oracle prototype has a bug that lets it cheat harder than you specified (a "perfect predictor" that also leaked the optimal solution). A too-good ceiling is a bug suspect first, a windfall never. Verify, don't trust.

---

## PART 1 — THE DESIGN SPEC

### The three-column template

A spec is a contract in three fixed columns. Keep the columns — they force you to classify every requirement, and the classification is itself information.

| Column | What goes in it | The rule |
|---|---|---|
| **HARD** | A direct translation of the gap statement. The things that, if violated, disqualify the method outright. | Violating one is fatal. No trade-off, no negotiation. |
| **SOFT** | Quantified, negotiable trade-offs — what you would *like*, with the price you will pay attached. | Stated as a number with a direction and an acceptable range, never as an adjective. |
| **FREE** | The design space that is fully open. What you explicitly do **not** constrain. | Naming it is the point: it tells the variant stage where it may roam. |

The HARD column is the gap statement made operational. If `prospect` landed the gap *"every existing scheduler assumes job processing times are known exactly; in practice they are 15-20% estimates,"* the HARD column says: *the method must accept processing-time distributions (or interval estimates) as input and produce a schedule whose feasibility does not depend on point estimates.* That is not negotiable — a method that needs exact times has not addressed the gap, however well it scores. The HARD column is short; if it is long, you have smuggled preferences into it.

The SOFT column is where the real engineering judgment lives, and it is where the discipline below bites hardest, because *"the method should be fast"* belongs here and is useless until quantified. SOFT lines look like: *"median solve time on the scaffold instance set ≤ 2× the baseline's"*; *"degrades by ≤ 5% relative cost when demand variance doubles"*; *"uses ≤ 2 GB memory at the 1000-node tier."* Each is a number, a direction, and a comparison point. The negotiability is explicit — you might trade 2× solve time for a 10% cost improvement, and the SOFT column is where you wrote down that you *would*.

The FREE column is the permission slip. *"The internal representation is open"; "we do not constrain whether the method is learning-based or classical"; "no requirement to match the baseline's output format."* Writing the FREE column stops two failures: it stops you from quietly importing a constraint nobody asked for (you assumed the method must be a single solver call because the baseline was — but that was never a requirement), and it tells STAGE 2 where the variant patterns may legitimately differ. A blank FREE column usually means you have over-constrained the problem in your head.

### Every line decidable — the acceptance test

The non-negotiable property of every spec line, in any column, is that it is **decidable**: there is a measurable procedure that returns pass or fail. *"The method should be fast"* is noise — it decides nothing, two reasonable people read it two ways, and at the end you cannot say whether you met it. *"Median solve time on the scaffold instance set is within 2× the baseline's median, at both the 200-node and 1000-node tiers"* is a spec — you run it, you compute it, it passes or it fails. The test for a spec line is one question: **could the agent write a script that, given a method and the scaffold, prints PASS or FAIL for this line?** If not, it is not yet a spec line.

This matters beyond tidiness. An undecidable spec line is a place where, at the end, you will grade your own homework — and your gradient, like the agent's, points at passing. *"Robust"* becomes whatever your method happens to do. *"Scalable"* becomes the largest instance you happened to run. Decidability is the mechanism that takes the verdict out of your hands and puts it in the scaffold's, which is the same move the tournament makes with pre-committed kills. The spec is where it starts.

### The efficient check — hand it to the agent, harvest the flags

The cheap, high-yield move: hand the gap statement and your rough requirements to the agent and have it rewrite each as a measurable acceptance criterion **and explicitly flag the ones it cannot.** The flags are the gold. A requirement the agent cannot turn into a test is exactly a requirement *you have not yet thought through* — it is vague because your idea of it is vague — and the flag is a to-do item surfaced now, when it costs a sentence, instead of at submission, when it costs a rebuttal.

```
You are turning a research gap statement and a set of rough requirements into a
DECIDABLE design spec.

GAP STATEMENT: <the gap prospect landed, verbatim>
ROUGH REQUIREMENTS: <your bullet list, however woolly>
SCAFFOLD / INSTANCE SET (if known): <what you will measure on>
BASELINE: <the method you compare against>

For EACH requirement, do ONE of two things:
  (A) REWRITE it as a decidable acceptance test — a sentence of the form
      "<quantity> on <instance set> is <comparison> <threshold>", such that a
      script could print PASS or FAIL. State the metric exactly (which number,
      which instances, which comparison point). Then classify it: HARD (violation
      disqualifies the method) / SOFT (a quantified, negotiable trade-off) / FREE
      (something we are explicitly NOT constraining).
  (B) FLAG it as NOT-YET-DECIDABLE — say precisely what is missing (no metric? no
      threshold? no instance set? an undefined word like "robust"?). Do NOT invent
      a threshold to make it decidable; surfacing the gap is the point.

Return two lists: the rewritten decidable lines (with HARD/SOFT/FREE labels), and
the flagged not-yet-decidable lines with what each one is missing.
Do NOT pad the HARD column — a requirement is HARD only if violating it makes the
method fail to address the gap at all.
```

Work the flags yourself. Each one is a small decision you owe the spec: pick the metric, pick the threshold (look at the baseline's number and the ceiling you are about to measure), pick the instance set. When the flagged list is empty, the spec is a contract.

### The spec's second identity — it is your claim draft

Here is the move that saves the most time across the whole of method *and* experiment design, and it is the reason `spec-is-claim-draft` is a gate, not a nicety. **The spec is the draft of your paper's claims.** Write down now, in plain sentences, the two or three things the finished paper must make a reader believe. They are the abstract's promises before you have earned them:

- *"We are the first to schedule under uncertain processing times without degrading throughput versus the exact-time baseline."*
- *"Our method scales to 1000 nodes within 2× the baseline's solve time, where prior learning-augmented methods do not run at all."*
- *"The gain comes from the prediction module, not from extra solver time — we show this by ablation."*

The spec is the **verifiable form** of exactly these sentences. Claim one is the HARD line about accepting distributions plus the SOFT line about throughput; claim two is the SOFT solve-time lines at both tiers; claim three is a SOFT line that pre-commits an ablation result. The identity is not poetic — each claim *is* one or more spec lines, and each spec line *serves* some claim. Which gives you the single biggest filter in research: **anything that serves no claim can be skipped.** An experiment that supports no claim is work you do not do. A theorem that backs no claim is weeks you do not spend. A spec line that maps to no claim is either a missing claim (you forgot to state something the paper needs) or a requirement you do not actually have (cut it).

Run the mapping explicitly and keep it: it is the seed of [ledger](../../ledger/SKILL.md)'s claim-evidence matrix, where every experiment in the confirmation phase is justified by the claim it feeds. The matrix you start here is the same matrix `ledger` finishes — you are not duplicating work, you are beginning it at the cheapest moment.

```
Here are my draft paper claims and my decidable spec lines.
CLAIMS: <the 2-3 sentences the paper must make a reader believe>
SPEC LINES: <the HARD/SOFT lines from the previous step>

Build a CLAIM × SPEC-LINE table. For each claim, list the spec lines whose
PASS/FAIL would be evidence for it. Then flag:
  - any CLAIM with NO supporting spec line (the paper promises something the spec
    does not yet test — a missing spec line, work to add now);
  - any SPEC LINE serving NO claim (either a claim we forgot to write, or a
    requirement we do not actually have — decide which and cut or add).
Return the table and both flag lists. Do not invent claims to cover orphan lines.
```

A spec whose every line maps to a claim, and whose every claim has a supporting line, is a method whose experiments are pre-justified. You will not run an experiment in `ledger` and wonder why; you ran it because a claim needs it, and you knew that before you built anything.

---

## PART 2 — THE ORACLE CEILING

### What an oracle is, and why you measure it first

An **oracle** version of your method is one that is allowed to cheat — to use information or computation no real method could have — so that its performance marks the **ceiling**: the best any method of this shape could possibly do if the hard part were solved for free. You measure the ceiling first because it answers, for a day's cost, the question that otherwise costs a season: **is the prize big enough to chase, and where in the pipeline does it live?**

A cheating prototype is cheap precisely because it skips the research. You do not have to *build* a good demand predictor to measure what a perfect one would buy you — you feed the method the true future demand and run it. If the perfect predictor buys almost nothing, you have just killed a year of predictor research for the price of an afternoon, before writing one line of the real thing.

### The oracle typology — cheating has several forms

Name the kind of cheat, because the ladder opens them one at a time and each corresponds to a different component you might later attack.

| Oracle | What it cheats | Concrete form |
|---|---|---|
| **INFORMATION** | knowledge of the unknown | a predictor is fed the true future values; uncertain parameters are set to their ground-truth values; stochastic demand is revealed in advance |
| **COMPUTATION** | the cost of solving | a subproblem is solved exactly by brute force; the time budget is set to infinite; a heuristic is replaced by an exact solver |
| **TUNING** | the cost of not knowing the test | hyperparameters are tuned directly on the test set (the upper bound of what perfect tuning could reach) |
| **COMPONENT** | one module's quality | a pipeline stage is replaced by its ground-truth output (the true clustering, the true decomposition, the optimal sub-route) |

Each cheat answers a different "what if this part were free?" — which is exactly why opening them separately, not together, is the whole technique.

### Build a ladder, not a single ceiling

The instinct is to turn on every cheat at once and read the one "all-on" number. **Do not.** An all-on ceiling tells you only the total prize and hides which component holds it — it is the single number from which you can learn the least. Instead **open the oracles one level at a time, building a ladder**: baseline → +one cheat → +the next → … → full oracle. The ladder pays three ways the single number cannot.

**Payoff 1 — the TOTAL gap tells you whether to do this at all.** Baseline to full-oracle ceiling is the entire prize available to *any* method of this shape. A low total gap is a kill signal, and a cheap one: if even a fully cheating method barely beats the baseline, no honest method will, and you have learned this for a day's work instead of a year's. This is what `ceiling-justifies-direction` checks — a direction with a low ceiling does not advance to STAGE 2.

**Payoff 2 — the INTER-LEVEL gaps are each component's marginal value.** The jump from one rung to the next is what *that one cheat* bought. A prediction module whose oracle adds 9.5 points and a sub-solver whose oracle adds 1.3 points are telling you, unambiguously, where the prize lives: in prediction, not in solving. This aims the STAGE 2 *replacement variant* directly — you swap the high-gap component, not the one that felt interesting. Designing a clever exact sub-solver when the sub-solver oracle bought 1.3 points is pouring a season into a component the ceiling already told you was not the bottleneck.

**Payoff 3 — the ladder is the paper's motivation figure, for free.** The plot of performance climbing rung by rung is precisely the figure a reviewer needs to believe the gap is real and your chosen component is the right one to attack. You drew the motivation figure before you built the method, at the moment it was cheapest, and it is honest because the numbers are real measurements of real cheating prototypes.

### Three cautions that decide whether the ladder is trustworthy

**The oracle's metric must match the final main experiment.** If the ceiling is measured with one metric (say, average route cost) and the eventual headline experiment uses another (say, worst-case cost or solved-within-budget rate), the ceiling is not comparable to anything you will report, and the "gap" you computed is a fiction. Fix the metric to the main experiment's metric *now*, while building the oracle, so the ladder and the paper speak the same units. This is the same discipline the spec's decidable lines enforce: one metric, defined once.

**Measure at AT LEAST two scale tiers.** A small instance's bottleneck structure can differ completely from a large one's. At 50 nodes the sub-solver may be the whole game (everything fits, prediction barely matters); at 1000 nodes prediction dominates and the sub-solver oracle moves nothing. A ladder at one tier is a ladder that may point your STAGE 2 variant at the wrong component for the scale you actually care about. Run the ladder at a small tier and a target-scale tier and compare the *shapes* — if they disagree, that disagreement is itself a finding about where the prize lives at scale.

**The REVERSE signal is equally precious.** When opening an oracle level moves performance **not at all**, you have learned something as valuable as a big gap: the bottleneck is **not** where you thought. A component oracle that changes nothing means that component is not what is holding the baseline back — and that single measurement can **veto half your candidate variants** before STAGE 2, because every variant that bet on improving that component is now known to be chasing a non-bottleneck. The reverse signal is cheap pruning: it is the ceiling telling you which families of method not to bother racing.

### Worked example — a dynamic vehicle-routing field (illustrative numbers)

Suppose a dynamic vehicle-routing field: requests arrive over the day, demands are uncertain at dispatch time, and you must build routes under a time budget. The baseline is a re-optimizing heuristic that uses point-estimate demands and a fast local-search sub-solver. The gap `prospect` landed is *"all existing methods treat demand as known at dispatch; in practice it is uncertain, and methods degrade."* You build cheating prototypes and run the ladder at two tiers. **Numbers below are illustrative, not measured data** — they show how the ladder is *read*, not what any real system scores.

Metric: total route cost, lower is better; reported as % above a per-instance lower bound (so 0% = optimal).

| Rung | What is cheated | Small tier (~50 reqs) | Target tier (~800 reqs) |
|---|---|---:|---:|
| 0. Baseline | nothing | 18.0% | 24.0% |
| 1. + INFORMATION oracle | true future demand revealed | 16.5% | 14.5% |
| 2. + COMPUTATION oracle | exact brute-force sub-solver, unlimited time budget | 9.0% | 13.2% |
| 3. + full oracle | also perfect tuning on test | 8.6% | 12.8% |

Read the **target tier** column, the one you care about. **Total gap:** 24.0% → 12.8%, an 11.2-point prize — large enough to justify the direction (`ceiling-justifies-direction` passes). **Inter-level gaps:** the information oracle alone closes 24.0 → 14.5, a **9.5-point** jump; the exact sub-solver adds only 14.5 → 13.2, a **1.3-point** jump; perfect tuning adds a negligible 0.4. The ladder is shouting: **the prize is in demand prediction, not in the sub-solver.** Your STAGE 2 replacement variant should swap the demand model, not engineer a better exact sub-solver — the sub-solver oracle is a 1.3-point non-prize, and a season spent there is a season the ceiling told you not to spend.

Now read the **small tier** and compare shapes. At 50 requests the information oracle buys only 1.5 points (18.0 → 16.5) while the sub-solver buys 7.5 (16.5 → 9.0) — the *opposite* ranking. At small scale the routing is easy to predict and hard to solve exactly; at target scale it is easy to solve locally and hard to predict. **Had you measured only the small tier, the ladder would have aimed your variant at the sub-solver — exactly wrong for the scale you ship at.** This is why the two-tier rule is not optional: the bottleneck migrated with scale, and only the two-tier ladder caught it.

Finally, the **reverse signal**: the tuning oracle moved the needle 0.4 points at both tiers. Tuning is not your bottleneck anywhere — so any STAGE 2 variant whose whole pitch is "better hyperparameter adaptation" is vetoed now, for free, by a rung that barely moved.

And the figure — performance climbing 24 → 14.5 → 13.2 → 12.8 at the target tier, with the giant first step — is the paper's motivation figure, drawn before a line of the real method exists.

### When the ladder surprises you — trust it over the design you wanted

The hardest case is the one where the ladder contradicts the variant you already fell in love with. You came in certain the sub-solver was the lever — that is why you read this field — and the ladder says the sub-solver oracle buys 1.3 points. The gradient (yours and the agent's) is to explain the surprise away: *maybe the oracle prototype is too weak, maybe the small tier is more representative, maybe with a better metric…*. Resist it the way you resist a "soaring" tournament result: **a ceiling that contradicts your prior is a finding, not a bug to debug until it agrees with you** — unless you can show the oracle prototype literally failed to cheat as specified.

So the order of suspicion runs both ways, and you must run it deliberately. A ceiling that is **surprisingly low** (or a level that moves nothing when you expected a jump): check the oracle prototype is *actually* cheating — is the "perfect predictor" truly fed ground truth, or silently still estimating? A ceiling that is **surprisingly high** (a level that soars): check the oracle prototype is not cheating *harder than specified* — the classic bug is an information oracle that also leaks the optimal solution, or a component oracle wired to the test labels of a downstream stage too. Verify the prototype does exactly the cheat in the typology and no more. Once verified, the number stands, and you let it redirect the design — that redirection is the entire reason you measured the ceiling before building.

---

## What STAGES 0-1 hand forward

Out of these two stages you carry four artifacts into the rest of `crucible`, every one of them also a piece of the eventual paper:

- **A three-column decidable spec** — the contract STAGE 3's tournament scaffold checks against, and the source of its pre-committed kill thresholds. The SOFT lines *are* the elimination rules in waiting.
- **A claim-evidence map** — the two-or-three claims and the spec lines that serve them, which becomes [ledger](../../ledger/SKILL.md)'s claim-evidence matrix and the filter that lets you skip any later experiment serving no claim.
- **An oracle ladder at two scale tiers** — the total gap that justified the direction, the inter-level gaps that aim STAGE 2's replacement variant at the high-gap component, the reverse signals that already vetoed whole variant families, and the paper's motivation figure.
- **A located prize** — the named component the ladder says holds the gain, so the variants in [variants-and-tournament.md](variants-and-tournament.md) are generated to attack *that* component with death-cause-orthogonal bets, not to wander.

The two non-delegable judgments these stages install, the bets the agent cannot place for you: **what every spec line decides** (the metric, the threshold, the HARD/SOFT/FREE classification — hand the agent the dimensions it proposes and you have outsourced the definition of success to a willing party), and **which component the ladder says to attack** (the agent runs the rungs; you read the gaps, distrust the surprises until the prototype is verified, and decide where the prize lives). Fix the target, measure the prize, and the rest of the arc — variants, tournament, theory, ablation, novelty — has something true to aim at.

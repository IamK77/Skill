# Falsify, Rank, Kill — turning candidates into a bet (STAGE 2-4)

This reference is the depth behind **STAGE 2 — Filter**, **STAGE 3 — Rank**, and **STAGE 4 — Kill** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 1 ([seven-seams.md](seven-seams.md)) hands you 10-20 candidate gaps; this file is the funnel that narrows them to one or two bets and arms each one with evidence. It backs the seven gated checks across those three stages: filter's `blank-causes-diagnosed`, `adversarial-search-run`, and `survivors-have-precise-delta`; rank's `four-questions-scored` and `ranked`; kill's `kill-experiment-designed` and `kill-experiment-run`. Where the mine stage *widens*, this stage *cuts* — and two of the human's three non-delegable judgments live here.

The governing fact, restated because every move below is judged against it:

> A candidate gap is a suspect, not a finding. Diagnose why the ground is empty, command the agent to **prove** the idea was already done, keep only what survives with a precise delta and a fundable shape — then spend one day trying to kill it before you spend a year building it.

---

## The shape of the funnel

You arrive with a written list of ~10-20 candidates, each tagged with the seam that surfaced it and a one-line statement of the hole. You leave with **one or two bets**, each carrying a precise delta, a fundability score, and the corpse of its own kill-shot — survived. The funnel has three movements, in this order, and the order is load-bearing:

```
  10-20 candidates
        │
   ┌────▼─────────────────────────────────────────┐
   │ FILTER  (STAGE 2)                             │
   │  A. diagnose the blank's cause   (4 verdicts) │
   │  B. adversarial existence search (the attack) │
   │  C. precise-delta bar            (cosmetic→×) │
   └────┬─────────────────────────────────────────┘
        │  survivors (typ. 4-8) — each with a one-line delta
   ┌────▼─────────────────────────────────────────┐
   │ RANK   (STAGE 3)                              │
   │  D. fundability four-questions   (score /4)   │
   │     <3 → SHELVED (parked, not killed)         │
   │     rank + CHOOSE the 1-2 bets                │
   └────┬─────────────────────────────────────────┘
        │  top 2-3
   ┌────▼─────────────────────────────────────────┐
   │ KILL   (STAGE 4)                              │
   │  E. cheapest disproving experiment            │
   │     design it BEFORE building anything        │
   │     run it; let cheap deaths happen early     │
   └────┬─────────────────────────────────────────┘
        │
   the gap you carry into method design — backed by evidence, not hope
```

Why this order. Filtering is the cheapest cut, so it runs first and on every candidate — you spend a targeted search and a five-minute verdict to drop the already-done and the cosmetic. Ranking is a paperwork cut — four yes/no questions, no new search — so it runs on the smaller surviving set. Killing is the most expensive cut (a day of an agent's prototyping per candidate), so it runs last, on only the top two or three. **Each movement is cheaper to fail than the next, so you fail as early as you can.** That is the same principle the kill stage states out loud — *the cheaper an idea can be killed, the sooner it should be* — applied to the whole funnel, not just the last step.

The lever, as everywhere in this skill: the agent does the parallel labor — runs the per-blank searches, runs the inverted existence search five ways, stands up the throwaway prototype the same afternoon — but its gradient points at **pleasing you**. Left soft, it confirms the gap you handed it, invents a plausible citation for a paper that doesn't exist, and reads "we significantly outperform" in an abstract as if the experiment table had said it. So the discipline of the whole funnel is: **command the agent adversarially, and verify what it surfaces against the source.** The agent is the miner and the adversary. It is never the oracle. The map it draws is not the territory.

---

## A. Diagnose the blank's cause — filter, part 1 (`blank-causes-diagnosed`)

A blank or sparse cell in the matrix, a high-frequency unsolved limitation, an empty corner of the leaderboard — these are *suspects*, not gaps. The single most expensive mistake in this whole pipeline is treating "nobody published here" as "nobody can or should." A cell is empty for one of exactly four reasons, and **only two of the four are worth your year:**

| # | Cause | Is it a gap? | What you do |
|---|---|---|---|
| **(a)** | **Nobody thought of it.** The direction is feasible and worth doing; it simply wasn't on the field's radar. | **Yes — the good gap.** | Carry it to the attack (B). |
| **(b)** | **Done — under different terminology, in an adjacent field, or at a low-tier venue.** The work exists; you just didn't search the name it was published under. | **No.** | Not a gap — go *find* it. The search that proves this is itself valuable intelligence. |
| **(c)** | **A fundamental technical barrier** made it infeasible. People tried; it didn't work; they stopped. | **Only if a new tool just removed the barrier.** | A gap *only* if you can name the recent tool/model/benchmark that changed the feasibility — the trend-arbitrage link. Otherwise the barrier is still there and so is the empty cell. |
| **(d)** | **Done and pointless.** It is empty because the field tried it, found it useless, and moved on — or because no one wants the result. | **No — the trap that burns three years.** | Avoid. This is the most dangerous blank because it *looks* exactly like (a). |

The treacherous pair is **(a) vs (d)**: an un-thought-of gap and a tried-and-abandoned-as-useless gap present identically — an empty cell, no recent papers. The whole point of diagnosing is to separate them *before* you invest, because (d) is invisible in the matrix and only visible in the field's judgment.

### How the agent helps, and where the human's judgment is non-delegable

The agent runs a **targeted per-blank search to gather evidence** for the classification — but the **verdict on the cause is the second non-delegable judgment**. The agent can surface "here are four older papers in an adjacent field that touch this" (evidence pointing at cause b), or "this was a workshop track in 2019 and then nothing" (evidence pointing at c or d). It cannot reliably tell you *why* the field stopped — that requires taste about what the field values, which the agent does not have and will fabricate if pressed.

Copy-ready evidence-gathering prompt for one blank:

```
For this empty/sparse cell in my field matrix:
  axis A = <e.g. method family: learned construction heuristics>
  axis B = <e.g. problem setting: large-scale capacitated VRP, >1000 nodes>

Gather evidence for WHY this cell is empty. Do not conclude — gather. Return:
1. EXISTENCE: the 3-5 closest papers that touch this cell, even loosely,
   in this field OR an adjacent one (give exact title + venue + year; if you
   cannot find the paper, say "none found", do NOT invent one).
2. FEASIBILITY: is there a known technical barrier that makes this cell hard?
   (e.g. no benchmark at this scale, a solver that doesn't terminate, a known
   negative result). Cite the source of the barrier claim.
3. RECENCY: did anything in the last ~2 years (new solver, model, benchmark,
   hardware) change that feasibility? Name it or say "nothing found".
4. ABANDONMENT SIGNAL: any sign the field tried this and moved on
   (a workshop paper then silence, a negative-result note, a survey that
   dismisses it). Quote the dismissal if you find one.

Output as four labelled sections. Verify every paper's title and core claim
against its abstract before listing it.
```

Then **you** read the four sections and assign the cause. The mapping is a judgment, but it is a *structured* one:

- Closest papers are all genuinely distant and feasibility is fine and nothing in the field dismisses it → lean **(a)**, carry to the attack.
- One of the "closest papers" is actually the same thing under another name → **(b)**, drop and go read it.
- A real barrier exists *and* nothing recent removed it → **(c) not yet**; park it and re-check when a tool lands.
- A barrier exists *and* you can name the recent tool that just removed it → **(c) gap** — this is one of the strongest gap shapes there is, because the field's "it's impossible" is now stale.
- A dismissal or an abandonment signal exists → **(d)**, drop unless you can argue the field's reason for abandoning is itself wrong (rare, but the basis of some of the best contrarian papers).

**Worked example.** Suppose a vehicle-routing field. Your matrix has a blank at *(learned construction heuristic × asymmetric travel-time matrices)*. The agent's evidence comes back: closest papers all assume symmetric Euclidean distances (genuinely distant — good); no benchmark exists with realistic asymmetric travel times (a barrier); but a public ride-hail travel-time dataset was released eight months ago (the barrier just moved); no dismissal anywhere. Verdict: this is **(a)/(c)-just-opened** — un-thought-of *because* the data to even pose it arrived last year. Strong suspect, carry to the attack. Now suppose instead the agent surfaces a 2018 paper titled "Asymmetric Neural Routing" that does exactly this. Verdict: **(b)** — not a gap; go read it (and possibly find *its* limitation as a new candidate).

### The sparse cell often beats the pure blank

A cell with **2-3 papers** is frequently a better bet than a perfectly empty one. The empty cell carries an unresolved ambiguity — is it (a) or (d)? The sparse cell has already resolved it: *someone validated that the direction is feasible and worth a paper* (it isn't pointless, killing (d); it isn't impossible, killing (c)) — and yet it is plainly **far from worked out** (two papers, single seeds, no strong baseline, narrow setting). That is a gap with the riskiest cause already eliminated for you. Do not over-prize the pure blank; prize the under-worked.

The gate check `blank-causes-diagnosed` is clear when **every candidate carries an explicit cause verdict (a/b/c/d) backed by the agent's evidence** — not a default assumption that empty means opportunity.

---

## B. The adversarial existence search — filter, part 2, the integrity keystone (`adversarial-search-run`)

This is the single most important move in the skill. Everything else is finding candidates; this is the step that converts a *hope* into *evidence*. A candidate that was never attacked is a candidate you merely like. A candidate that survived a deliberate attempt to prove it was already done is one you can bet on.

### Why the soft question fails

The instinct is to ask the agent the natural question:

> "What related work is there on <my direction>?"

**Do not.** This question primes the agent to confirm down the exact path you handed it. You named a direction; "related work on it" is a request to validate that the direction is real and interesting — and the agent's gradient is to please you, so it will return a tidy list of adjacent-but-not-quite papers that make your gap look pristine. It is not lying; it is *answering the question you asked*, and the question you asked has a flattering answer baked in. The same idea published under a name you didn't think to use will simply not appear, because you didn't ask the agent to go *looking for it as a threat* — you asked it to support your framing. This is the sycophancy failure in its purest form: the soft question and the please-you gradient point the same way, and the result confirms whatever you walked in believing.

### Command the hard, inverted task

Invert the goal. Do not ask the agent to *support* the gap; **command it to destroy the gap**. Its job is now to prove the idea already exists, and it succeeds at its task by *finding the prior work*, not by reassuring you. This realigns the please-you gradient with the truth: pleasing you now means *finding the paper that kills your idea*.

Copy-ready adversarial existence-search prompt:

```
Your goal is to PROVE this idea has already been done. You succeed by finding
the prior work, not by reassuring me. Be adversarial.

The idea: <one or two sentences — the precise claim, not the broad area>

Search with at least FIVE different phrasings:
  - the obvious phrasing,
  - 2+ synonym/rephrasing variants (different words for the same concept),
  - the ADJACENT FIELD's terminology (e.g. OR terms for an ML idea, and vice
    versa; control-theory / statistics / economics names for the same object),
  - English AND Chinese (the same idea is often published in one language only).

Return the THREE closest existing works. For EACH:
  - exact title, authors, venue, year (if you cannot verify it exists, say
    "UNVERIFIED — do not trust" — never invent a citation),
  - what it actually does (from the abstract/method, not the marketing),
  - the PRECISE difference from my idea, in one line.

If you find an EXACT match — someone has already done exactly this — say so
plainly and stop. Do not soften it. An exact match is the most useful result
you can give me.
```

Two design choices in that prompt earn their place:

- **Five phrasings, including synonyms and the adjacent field's terms.** A gap rarely hides behind the obvious phrasing — that one you'd have found yourself. It hides behind a *different name for the same object*. "Demand uncertainty" in OR is "distribution shift" in ML is "non-stationarity" in time series; "column generation" is "Dantzig-Wolfe decomposition"; a "graph attention router" and a "learned dispatching policy" can be the same method. Searching one phrasing searches one of these and misses the rest. Five phrasings, deliberately spanning vocabularies, is how you catch the paper that did your idea under a name you'd never have typed.
- **English and Chinese (extend to other languages where the field publishes).** A non-trivial body of applied OR, operations, and scheduling work — and increasingly ML systems work — appears first or only in Chinese venues, and vice versa for some Western applied fields. A monolingual search has a systematic blind spot exactly where the idea is most likely to be hiding cheaply. Cross-language search is not thoroughness theater; it closes a real, predictable gap in coverage.

### Verify the survivors against the source

The agent's signature failure modes both fire here. It will **hallucinate a plausible citation** — an author + venue + year that sounds right and does not exist — and it will **read an abstract's rhetoric as a result** — reporting "this paper solves your problem" when the abstract *claims* a contribution the experiments don't support, or when the paper addresses a superficially-similar but actually-different setting. So:

- **Every paper the attack surfaces is verified against its real abstract** before it counts as a hit. If the agent can't produce a verifiable title/venue, treat the "match" as non-existent — a hallucinated kill is worse than no kill, because it scares you off a real gap.
- **A "match" is judged on what the paper's method and experiments actually do, not on its abstract's marketing.** "We significantly improve over prior work" is a sentence anyone can write; whether it *matches your idea* depends on the setting, the assumptions, and the actual result table. The map (abstract) is not the territory (experiments).

The gate check `adversarial-search-run` is clear when **each surviving candidate has been put through the inverted "prove it was already done" search — five phrasings, cross-language, adjacent-terminology — and the three closest works have been surfaced and verified.** Candidates that the attack kills outright are dropped here; that is the attack working, not failing.

---

## C. The precise-delta bar — filter, part 3 (`survivors-have-precise-delta`)

A candidate that survived the attack survived because the three closest works are *close but not the same*. The delta is what "not the same" means. The bar:

> Each survivor carries a **one-line, expert-acceptable difference** from the three closest existing works — a difference a domain expert would accept as *genuinely not done*, not a cosmetic relabel of an existing result.

Why this bar, and why *here*. The cheapest place to discover that your "novel" contribution is a relabel is now — at the filter stage, on paper, before you've written a line of code or a page of the draft. The most expensive place to discover it is in **review**, where a reviewer writes *"this is incremental; the difference from [Smith 2023] is cosmetic"* and desk-rejects you after a year of work. The delta bar moves that judgment from the expensive end of the timeline to the cheap end. Pay the cost of being honest about your delta now, when being wrong costs you a candidate, not a year.

### What a precise delta looks like (and doesn't)

| Cosmetic / vague (drop it) | Precise / expert-acceptable (keep it) |
|---|---|
| "We use a transformer instead of an RNN." | "We give the first method with a *provable* constant-factor approximation guarantee for this setting; all prior learned methods are heuristic with no bound." |
| "We apply method X to a new dataset." | "We relax the full-information assumption that *every* prior method shares; ours is the first to work when demand is revealed online." |
| "We get better numbers on benchmark B." | "Prior SOTA degrades sharply past 1000 nodes; we hold accuracy to 10× scale, where the problem actually lives in practice." |
| "We combine A and B." | "A and B were thought incompatible because of <reason>; we show a construction that satisfies both, contradicting that folklore." |

The left column is a *change*; the right column is a *contribution*. A reviewer believes the right column and is unmoved by the left. The test of which column you're in: can you state, in one line, a property your work has that **none of the three closest works has** — and would an expert agree that property matters?

### The two-sentence field test

A fast, brutal sanity check before you commit a delta. State the gap in two sentences to someone *in the field* (or have the agent simulate a skeptical domain expert, knowing it's a simulation) and listen to the reflex:

- A **holding** gap gets: *"Right — nobody's really done that."* (Mild surprise, then agreement.)
- A **dead** gap gets: *"Didn't so-and-so do that in 2023?"* (Instant recall of prior work — your attack missed it, or your delta is cosmetic.)

If you hear the second reflex, you have either missed a paper (go back to B with that author's name) or your delta is a relabel (drop it). The field test is cheap and the field's memory is the best adversary you have; use it before the four-questions, not after.

Copy-ready delta-pressure prompt (devil's-advocate framing — note it's a simulation, the real field test is a human):

```
Act as a skeptical senior reviewer in <field> who has read everything.
Here is my claimed gap and its one-line delta against the 3 closest works:
  <gap>
  closest works + my stated delta: <...>

Attack the delta specifically:
  - Is the delta cosmetic (a relabel/reframing) or genuinely-not-done?
  - Name any paper that already has the property I claim is unique to me.
  - If you were reviewing this, what one sentence would you write to call it
    incremental? If you can't write that sentence, say so.
Be specific; cite verifiable papers only.
```

The gate check `survivors-have-precise-delta` is clear when **every remaining candidate has a one-line, expert-defensible delta against its three closest works**, and the vague/cosmetic candidates have been dropped — at this cheap stage, not carried forward.

---

## D. The fundability four-questions — rank (`four-questions-scored`, `ranked`)

Survival is necessary, not sufficient. A gap can be genuinely un-done and still be a bad bet — because you can't *measure* the contribution, can't *beat* anything anyone respects, can't *finish* the experiments in your budget, or can't *say* what it is in one sentence. Ranking is the utilitarian filter: among the truly-novel survivors, which are *publishable with your resources*. Score each survivor on four questions, **one point each:**

| # | Question | A point means | A zero means |
|---|---|---|---|
| **1** | Is there a **recognized benchmark** so the contribution is quantifiable? | A standard dataset/metric the field accepts; "better" has a number. | No accepted benchmark — you'd have to invent one *and* convince the field it's fair, which is a second paper's worth of work. |
| **2** | Is there a recent (**last-2-years**) **strong baseline** to beat **head-on**? | A current SOTA method exists and you can compare against it directly. | The only baselines are old or weak — **beating only old/weak methods convinces no reviewer.** A win nobody believes is not a win. |
| **3** | With **your** compute and time, are the **main experiments doable in 3-6 months**? | The core results fit your actual GPU budget and calendar. | The experiments need a cluster you don't have or a year you can't spend — a true gap you cannot afford is not your gap. |
| **4** | Can the core contribution be stated in **one sentence**? | "We are the first to <X> for <Y>, giving <Z>." | If you need a paragraph, you don't yet understand it well enough — and neither will a reviewer skimming the abstract. |

Add the points. The rule:

> **Below 3 → SHELVED.** Parked, not killed.

The distinction matters. A *killed* candidate is one the attack (B) proved already-done or the field test exposed as cosmetic — it's gone. A *shelved* candidate is one that's genuinely novel but not fundable *right now*: no benchmark yet, or no compute this quarter, or no strong baseline has appeared so the comparison would be unconvincing. Park it with a note on *what would un-shelve it* ("when a benchmark for asymmetric VRP exists", "when I have cluster access", "when a strong learned baseline appears to beat"). Shelved candidates are a standing pipeline; some of your best future bets are today's shelved gaps, un-shelved by a benchmark release or a tool you didn't have.

Why these four and not others. They are the four things a reviewer's rejection actually says, turned into pre-flight questions: *"no standard evaluation"* (Q1), *"weak baselines / not compared to recent work"* (Q2), *"claims unsupported by adequate experiments"* (Q3, because you ran out of budget), *"unclear contribution"* (Q4). Scoring them now is rehearsing the rejection before you've done the work, while it's still free to change your mind.

Copy-ready scoring prompt:

```
Score this survivor gap on the fundability four-questions, 1 point each, and
justify each with EVIDENCE (not opinion):

  Q1 BENCHMARK: name the recognized benchmark(s) for this setting. If none
     exists, score 0 and say what one would have to be invented.
  Q2 STRONG BASELINE: name a last-2-years strong method I'd beat head-on
     (exact paper). If the only baselines are old/weak, score 0.
  Q3 FEASIBILITY: given <my compute: e.g. 2× A100, my horizon: 4 months>,
     estimate whether the MAIN experiments fit. List the heaviest experiment
     and a rough cost. Score 0 if it doesn't fit.
  Q4 ONE SENTENCE: write the core contribution in ONE sentence. If it needs
     more, score 0.

Output: a 4-row table (question, score 0/1, evidence) and the total /4.
Cite verifiable papers/benchmarks only; mark anything you cannot verify.
```

### Rank and choose — the third non-delegable judgment

The scores **rank** the survivors; they do not **choose** for you. Choosing the one or two gaps to actually bet a year on is the **third non-delegable judgment** — pure taste, exercised *after* the filter and the score have done their mechanical work. Two gaps can both score 4/4 and one is still the right bet because it fits *your* skills, *your* lab's direction, *your* read of where the field is going. The agent cannot weigh those; it can only score what's scoreable.

You **may** let the agent play devil's advocate to pressure the choice — but the decision stays yours:

```
For my top 2 ranked gaps, argue the devil's-advocate case against each:
  - Why has nobody filled this in three years — is it un-thought-of, or is it
    quietly unimportant and I'm about to learn why the hard way?
  - What's the strongest reason a smart researcher would NOT pick this?
Be specific. I will decide; give me the sharpest case against each so I decide
with my eyes open.
```

The gate checks `four-questions-scored` and `ranked` are clear when **every survivor has a 0-4 score with evidence, sub-3 candidates are shelved (not deleted), and you have consciously chosen the 1-2 to carry into the kill stage** — a choice you made, not the agent.

---

## E. The cheapest-kill experiment — kill (`kill-experiment-designed`, `kill-experiment-run`)

You now have one or two (at most three) gaps that survived the attack, carry a precise delta, and scored fundable. The instinct at this point is to start *building* — design the full method, write the system, run the headline experiments. **Resist it for one more day.** Before any of that, design and run the single experiment whose failure would tell you the bet is dead.

> Design — **before building any full system** — the experiment that runs in a **day** (a **week** at the very most) and whose **negative result directly kills the idea.**

It is the *smallest thing that can disprove the bet*, not a small version of the full implementation. The two canonical shapes:

- **A rough prototype on small instances, to see if the trend even holds.** Your bet is that learned method M beats SOTA at scale. The kill-shot is not "build M." It's: stand up the crudest possible version of M, run it on tiny instances against the strong baseline, and look at whether the *gap moves in your direction at all* as size grows. If the curves cross the wrong way even roughly, the bet is dead — and you learned it in an afternoon, not a year.
- **A direct check that the core conjecture holds in the data.** Your method *depends on* an assumption — "real travel-time matrices have low-rank structure my method exploits," "the demand distribution is heavy-tailed in the regime where my bound bites," "the SOTA's failure on class B is the failure I think it is." Don't build the method that exploits the structure; **first check the structure is there.** Load the data, compute the one quantity the method's value hinges on, look at it. If the conjecture is false, the method built on it cannot work, and you've spent a query instead of a quarter.

The defining property: a negative result must *directly kill the idea*. If the experiment can come back negative and you'd still want to build the thing, it wasn't a kill-shot — it was a warm-up. **An idea with no cheap kill-shot is an idea you cannot yet afford to commit to** — because you have no way to be wrong cheaply, which means every doubt costs a year to resolve.

### The agent stands it up the same day

This is exactly the parallel-miner lever pointed at disproof. A coding agent can stand up the throwaway prototype, load the dataset, compute the conjecture-check, and plot the small-instance trend **the same afternoon** you design it. The thing that used to be a two-week side quest — "let me just check whether this even works before I commit" — is now a day. That collapse in cost is *why* the kill stage is affordable at all, and why skipping it has no excuse.

Copy-ready kill-shot design + run prompt:

```
For this gap, design the CHEAPEST experiment that could KILL it — runs in a
day (a week max), and whose NEGATIVE result means I should abandon the idea.
NOT a full implementation. The smallest disproof.

  The bet: <one sentence>
  The load-bearing conjecture it depends on: <the one thing that must be true>

Propose the kill-shot as ONE of:
  (a) a rough prototype on small/synthetic instances to see if the trend even
      moves in my favor, or
  (b) a direct measurement of the conjecture in the real data.

Specify: exact data/instances, the ONE quantity to compute or plot, and the
threshold at which the result KILLS the bet (state it before running, so I
can't rationalize a bad result afterward).

Then implement and run the throwaway version now. Report the number, the plot,
and the verdict: SURVIVES or KILLED, against the pre-stated threshold. Keep the
code disposable; do not build the full method.
```

Note the discipline of **stating the kill threshold before running** — "the bet dies if the small-instance gap doesn't shrink by size 100" — so a disappointing result can't be rationalized into a survivor after the fact. The agent's please-you gradient is strongest exactly when a result is borderline; pre-committing the threshold takes that wiggle room away from both of you.

### Let cheap deaths happen early — and count them as wins

> The cheaper an idea can be killed, the **sooner** it should be — because every week of attachment raises the cost of abandoning it.

Attachment compounds. Week one, the idea is a sentence; killing it costs nothing. Month three, it's half a codebase and a paragraph in your advisor's update; killing it costs ego and sunk effort, and you'll find yourself defending it past the evidence. So you run the kill-shot *while the idea is still a sentence*, when you have nothing invested and can read a negative result honestly. The kill stage exists to force the abandonment decision to the cheapest possible moment.

And the reframe that makes this bearable:

> **A negative that retires a candidate is a *successful* prospect, not a wasted one.**

The point of `prospect` is not to fall in love with a gap; it's to find one worth a year and *prove it before paying*. A kill-shot that comes back negative did its entire job: it saved you the year. Record what it showed — the number, the plot, the verdict — because a documented death is reusable intelligence (it tells future-you, and the field, why that direction doesn't work), and because the *survivor's* kill-shot is the first real evidence in your eventual paper. The cheapest research failure of all is the bet you never placed because the gap didn't survive — and the second cheapest is the one you killed in a day.

The gate checks `kill-experiment-designed` and `kill-experiment-run` are clear when **each top candidate has a designed kill-shot with a pre-stated threshold, it has actually been run, and the outcome is recorded** — survivors carried forward with their evidence, deaths logged as successful prospects.

What you carry out of STAGE 4 is the one gap (occasionally two) that survived its own kill-shot. It goes into method design ([table-and-reproduction.md](table-and-reproduction.md), STAGE 5) **backed by evidence instead of hope** — the trend moved in your favor on small instances, or the conjecture held in the data — which is a categorically different thing to start a year's work on than a gap you merely read into existence and liked.

---

## Where the human's judgments concentrate

The three non-delegable judgments of the whole skill are not spread evenly — **two of the three live in this file:**

| Judgment | Lives in | What the agent does | What stays yours |
|---|---|---|---|
| **(1) How to slice the dimensions** | the **mine** stage ([seven-seams.md](seven-seams.md)) | fills the matrix cells, clusters the limitations | choosing the axes and themes — what becomes *visible* at all |
| **(2) Why a blank is blank** | **here — A** | runs the per-blank evidence search | the verdict (a/b/c/d) — feasible-and-novel vs. tried-and-pointless |
| **(3) Which gap to bet on** | **here — D** | scores fundability, plays devil's advocate | the final choice — taste, after the filter and score |

Everything else in this funnel is parallelized to the agent: the existence search five ways across two languages, the delta-pressure simulation, the four-question scoring with evidence, the throwaway kill-shot stood up the same afternoon. The agent is the **means** — the parallel miner running the searches and the adversary attacking your gap. It is the labor and the attack surface. It is not the oracle, and on these two judgments — *why the ground is empty* and *which bet to place* — it cannot be, because both require a model of what the field values that the agent does not have and will fabricate if you ask it to. Command it adversarially, verify what it surfaces, and keep the two verdicts for yourself.

---

**Cross-links:** [seven-seams.md](seven-seams.md) (STAGE 1 — the seven mining seams that produce the candidate list this file refines, each with its characteristic false positives that the filter here catches) · [table-and-reproduction.md](table-and-reproduction.md) (STAGE 5 — landing the survivor: the comparison-table schema the closest-works analysis feeds, baseline reproduction, and the one-page gap statement) · [why-mine-not-read.md](why-mine-not-read.md) (the foundation — mine-don't-read, the agent as means and its two signature failures, the three causes of a blank in full, the three non-delegable judgments) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 2 Filter, STAGE 3 Rank, STAGE 4 Kill).

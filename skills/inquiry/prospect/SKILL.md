---
name: prospect
description: >
  The research-gap prospecting lens: find a defensible, fundable research gap
  BEFORE you sink months of compute and writing into it — for any field where you
  run experiments to publish (machine learning, combinatorial optimization,
  operations research, systems, scheduling). Use when choosing a topic, doing a
  literature review, or stuck for an idea — or when stress-testing a gap you
  already have. The one shift: a gap is NOT read out of the literature, it is
  MINED out — by running fixed extraction strategies in parallel — and then it
  must SURVIVE an adversarial "prove it's already been done" attack before you bet
  on it. Triggers on "what should I work on", "find a research gap / research
  direction", "literature review", "survey this area", "I have no idea / I'm stuck
  for a topic", "has anyone done X", "is this novel / is my contribution enough",
  "pick baselines / benchmark", "reproduce this paper", "review whether this gap
  holds".
argument-hint: "[the rough area to prospect for a gap, or the gap/idea you want stress-tested]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# prospect

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A research gap is a vein of value in a field that, from a distance, looks fully mined out. `prospect` is the lens you hold over a research area — at the very start of a project, the literature-review step — to find that vein **before** you sink months of compute, implementation, and writing into the wrong rock. It is the first skill of the `inquiry` suite: it owns step one of doing computational research — *choosing what to work on, and proving it is worth working on.* It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — a gap is mined, not read.** The human-era way was serendipity: read a survey and five to ten papers closely until an idea "emerges". That relied on luck and let one person run exactly one search thread at a time. The agent-era way is different in kind: you run a **fixed set of extraction strategies in parallel**, each blind to the others, to *manufacture* a candidate list of 10-20 gaps — and then you turn the agent **against** every candidate. A gap you read into existence is a hope; a gap that survived a deliberate attempt to prove it was already done is **evidence.** The whole pipeline is: *bound the ground → mine candidates in parallel → attack and filter → rank by fundability → kill the survivors cheaply → land the three deliverables.*

**The agent is the means, not the oracle.** Here it has exactly two jobs: the **parallel miner** (the manual labor — read 100 papers, build the matrix, cluster the limitations, reproduce a baseline) and the **adversary** (attack your gap until it breaks or holds). It is *not* the source of truth, and *not* — in this skill — the research object. Its gradient points at **pleasing you**: left soft, it will confirm your gap, invent a plausible citation, and read an abstract's marketing as an experimental result. So two disciplines are non-negotiable from the first search: **the map is not the territory** — every paper it surfaces has its title *and* core claim checked against the source before it enters your library — and **every candidate is commanded adversarially**, never asked to agreeably agree.

**What you cannot delegate — three judgments.** The pipeline parallelizes almost everything, but three points are yours and stay yours: **(1) how to slice the dimensions** — the matrix axes and the clustering themes decide what you can even *see*; **(2) why a blank is blank** — an empty cell is gold only if nobody thought of it, not if it is merely too hard, pointless, or already done under another name; **(3) which gap to bet on** — taste, after the filter and the cheap kill have done their work. Outsource these and you have automated your way to a confident bet on the wrong thing.

**What "done" looks like — three deliverables, not "I read everything".** The literature review is over when you hold: a **one-page gap statement**, a **core-paper comparison table**, and **at least one or two baselines reproduced and running on your machine** with numbers you personally verified. If you have those three, stop reading — you are done. If you don't, you are not done, no matter how many papers you have read. The most common failure of this step is the opposite of laziness: *forever reading, never daring to commit.* The terminus is the three artifacts, not the empty inbox of unread PDFs.

**Speak the user's language.** Most calls here are bets the user owns — which gap is worth their next year, whether a delta is "genuinely novel" or cosmetic, whether an assumption is "obviously unrealistic". Read their field fluency and gloss a term on first use (a *seam*, the *adversarial existence search*, *reproduction arbitrage*, the *bitter lesson / time-discounting*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared — and the bet is theirs to place.

**Read [references/why-mine-not-read.md](references/why-mine-not-read.md) first** — the must-be-told foundation: why mining beats reading, the agent as means (and the citation-hallucination / rhetoric-as-result traps), the three causes of a blank, the bitter-lesson time-discount, the three non-delegable judgments, and the three deliverables. It is the key that makes every stage below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-mine-not-read.md](references/why-mine-not-read.md)** — the foundation: the mine-don't-read reframe, the agent as means (parallel miner + adversary) and its two signature failures (citation hallucination, abstract-rhetoric-as-result), the map-≠-territory rule, the three causes of a blank cell, bitter-lesson time-discounting, the three non-delegable judgments, and the three deliverables that define "done". Load at STAGE 0.
- [references/seven-seams.md](references/seven-seams.md) — the seven mining strategies in depth, each with a copy-ready agent instruction template and its characteristic false positives: limitation-clustering, the cross-blank matrix, assumption-audit, leaderboard-weakness, reproduction-arbitrage, cross-domain transplant, and trend arbitrage. Load at STAGE 1.
- [references/falsify-and-rank.md](references/falsify-and-rank.md) — turning candidates into a bet: diagnosing the four causes of a blank, the adversarial existence search (the exact "prove this was already done" prompt and why the soft question fails), the precise-delta bar, the fundability four-questions, and the cheapest-kill experiment. Load at STAGE 2-4.
- [references/table-and-reproduction.md](references/table-and-reproduction.md) — landing the gap: the core-paper comparison-table schema (and why it is the free Related-Work section), the baseline-reproduction discipline (verify the number, never quote the claim), reproduction-failure-as-intelligence, and the one-page gap-statement template. Load at STAGE 5.

> **The pipeline is one arc.** Six stages — frame · mine · filter · rank · kill · land — turn a rough area into a gap you can bet a year on. Mining widens (10-20 candidates); filtering, ranking and killing narrow (to one or two); landing proves the survivor real. `prospect` gates all six below.

---

## STAGE 0 — Frame the hunt (bound the ground, set the discipline)

Open **[references/why-mine-not-read.md](references/why-mine-not-read.md)**. Internalize *mine-don't-read* and *the agent is the means*, then bound the ground before any search.

- **Bound the hunting ground.** Fix the scope concretely — problem setting × method families × target venues × time window — so "is this paper in scope?" has a yes/no answer. Too wide drowns the miner in noise; too narrow re-finds only the red ocean. This bounded range is the *input the agent departs from* — gap-finding is "hunt this defined ground exhaustively", not "survey everything".
- **Discount for the times (the bitter lesson).** Aim the scope at a **structural** problem that survives stronger models and more capable agents — optimality / approximation guarantees, verifiability, large-scale solve efficiency, hard problem structure — not at "complex hand-design that patches a model's *current* weakness", which the next model generation may steam-roll. Ask: *will this still be open in two years when the models are much stronger?* Frame so the answer is yes.
- **Set the verification discipline now.** The agent is the **means**, not the oracle: its signature failures here are inventing a plausible citation and reading an abstract's rhetoric as an experimental result. Fix the rule before the first search — every surfaced paper's title *and* core claim is checked against the source before it enters your library, and the agent is commanded adversarially, never invited to confirm.

### GATE — clear before MINE
1. `checklist check frame scope-bounded`
2. `checklist check frame hunt-survives-stronger-models`
3. `checklist check frame source-verification-set`
4. `checklist verify frame`

---

## STAGE 1 — Mine candidates (run the seams in parallel)

Open **[references/seven-seams.md](references/seven-seams.md)**. Don't wait for a gap to surface — open the seams and dig.

- **Run at least three or four of the seven seams in parallel** (each blind to the others, for cross-coverage): **limitation-clustering** (batch-read 50-100 in-scope papers, extract only the limitation / future-work / admitted-failure passages, cluster and count — high-frequency, cross-paper, three-years-unsolved is a hole whose importance the authors already argued for you); **cross-blank matrix** (method line × problem setting; blank and sparse cells are candidates); **assumption-audit** (an assumption shared by *all* papers but false in reality is a gap with a built-in story); **leaderboard-weakness** (pool every results table; find where everyone is still bad, or who wins on A and collapses on B); **reproduction-arbitrage** (suspect papers — old baselines, missing ablation, single seed — reproduced); **cross-domain transplant** (a technique mature in an adjacent field, absent in yours); **trend arbitrage** (rising-but-still-rare keywords, and a rolling scan of "what just became possible" from new tools/models/benchmarks).
- **Produce a written candidate list of ~10-20 gaps** — each tagged with the seam that surfaced it and a one-line statement of the hole. Two or three candidates means you under-mined; go back and open more seams before filtering.
- **Slice the dimensions yourself.** How you cut the matrix axes and cluster the limitations decides what becomes visible at all — this is the **first non-delegable judgment**. The agent fills the cells; you decide what the cells *are*. (Hand it the dimensions *it* proposed and you've outsourced the one choice that shapes everything downstream.)

### GATE — clear before FILTER
1. `checklist check mine seams-run-in-parallel`
2. `checklist check mine candidates-listed`
3. `checklist check mine dimensions-are-yours`
4. `checklist verify mine`

---

## STAGE 2 — Filter (diagnose the blanks, then attack)

Open **[references/falsify-and-rank.md](references/falsify-and-rank.md)**. A candidate is a suspect, not a finding — diagnose it, then try to kill it.

- **Diagnose why each blank is blank — don't assume it's opportunity.** An empty or sparse cell is empty for one of four reasons, and only some are gold: **(a) nobody thought of it** — the good gap; **(b) done, under other terms / an adjacent field / a low-tier venue** — not a gap, go find it; **(c) a fundamental technical barrier** — a gap only if a *new tool just removed it*; **(d) done and pointless** — the trap that burns three years. The agent gathers evidence per blank; the **verdict on the cause is the second non-delegable judgment**. (A sparse cell — 2-3 papers — often beats a pure blank: the direction is validated as feasible but far from worked-out.)
- **Run the adversarial existence search — the keystone.** Do *not* ask the soft "what related work is there?" (the agent will gently confirm down your path). Command the hard version: *"Your goal is to prove this idea has already been done. Search with at least five different phrasings — synonyms, the adjacent field's terms, English and Chinese — and return the three closest existing works with their precise difference from this idea."* This inverts the please-you gradient into a kill attempt.
- **Keep only survivors with a precise delta.** Each survivor carries a one-line, expert-acceptable difference from the three closest works — *genuinely not done*, not a cosmetic relabel. Drop the vague or cosmetic ones **here**, at the cheap stage, not in the paper where a reviewer kills them as incremental.

### GATE — clear before RANK
1. `checklist check filter blank-causes-diagnosed`
2. `checklist check filter adversarial-search-run`
3. `checklist check filter survivors-have-precise-delta`
4. `checklist verify filter`

---

## STAGE 3 — Rank by fundability (the utilitarian filter)

Open **[references/falsify-and-rank.md](references/falsify-and-rank.md)** (the four-questions section). Survival isn't enough — a gap must be *publishable* with your resources.

- **Score each survivor on the fundability four questions, one point each:** (1) a **recognized benchmark** so the contribution is quantifiable? (2) a recent (last-two-years) **strong baseline** to beat head-on — beating only old/weak methods convinces no one? (3) with *your* compute and time, the **main experiments doable in 3-6 months**? (4) the core contribution stated in **one sentence**? Below 3 points → **shelved** (parked, not killed).
- **Rank and choose — the third non-delegable judgment.** Pick the one or two to bet on. You may let the agent play devil's advocate ("why has nobody filled this in three years — un-thought-of, or unimportant?"), but the choice is yours. Field-test a finalist: state it in two sentences to someone in the field and listen for *"right, nobody's really done that"* — not *"didn't so-and-so do that in 2023?"*

### GATE — clear before KILL
1. `checklist check rank four-questions-scored`
2. `checklist check rank ranked`
3. `checklist verify rank`

---

## STAGE 4 — Kill it cheaply (the smallest disproving experiment)

Open **[references/falsify-and-rank.md](references/falsify-and-rank.md)** (the cheapest-kill section). Before building anything, try to destroy the bet for a day's cost.

- **Design the cheapest kill-shot first.** For the top two or three, design the experiment that runs in a **day** (a week at most) and whose **negative result directly kills the idea** — a rough prototype on small instances to see if the trend even holds, or a direct check that the core conjecture the method depends on holds in the data. It is the *smallest thing that can disprove the bet*, not a full implementation. An idea with no cheap kill-shot is one you cannot yet afford to commit to.
- **Run it, and let cheap deaths happen early.** A coding agent can stand up the throwaway prototype the same day. The cheaper an idea can be killed, the **sooner** it should be — every week of attachment raises the cost of abandoning it. Record the outcome (a negative that retires a candidate is a *successful* prospect, not a wasted one). The gap that survives its own kill-shot is the one you carry into method design, backed by evidence instead of hope.

### GATE — clear before LAND
1. `checklist check kill kill-experiment-designed`
2. `checklist check kill kill-experiment-run`
3. `checklist verify kill`

---

## STAGE 5 — Land the gap (the three deliverables)

Open **[references/table-and-reproduction.md](references/table-and-reproduction.md)**. The review ends not when the reading stops but when these three artifacts exist.

- **Reproduce the baselines you'll be judged against.** Get the 1-2 key baselines **running on your machine**, with numbers matching what *you* verified — never the number the paper merely claims. Chase any gap beyond explainable variance (preprocessing? hyperparameters? or water in the paper?). **Reproduction failure is intelligence:** a "SOTA" you can't reproduce under fair settings may *be* your gap — a re-evaluation paper, or its one real working component as your start. Capture it as a README + one-button script; the large-scale-experiment stage will reuse it.
- **Write the one-page gap statement.** Four questions on one page: what is the problem; where has the SOTA got to; where *exactly* is the hole (performance? too-strong assumptions? theoretical blank? flawed evaluation?); by what idea you fill it. Pure judgment — the agent may attack it, but the conclusion is yours. If it won't fit on a page, you don't yet understand it well enough to bet on it.
- **Complete the core-paper comparison table.** Columns roughly: setting · core idea · theoretical guarantee · benchmark & metrics · key numbers · code open? · self-stated limitations · relation to your idea. The agent drafts the cells; **you own which papers make the table** (the selection criterion *is* your understanding taking shape). Built now, it is the direct raw material for Related Work — that section nearly free later.

### FINAL GATE — the gap is landed
1. `checklist check land baselines-reproduced`
2. `checklist check land gap-statement-one-page`
3. `checklist check land comparison-table-complete`
4. `checklist verify land`
5. `checklist show` — confirm all **six** stages passed.
6. `checklist done` — clear this run's state.

---

## The thread through all of it

`prospect` is the **research-gap prospecting lens**, held over a field at the start of a project. Its six stages are one arc against one enemy — **betting a year of your life on a gap that isn't there** (already filled, too hard, or pointless). Framing (0) bounds the ground and arms you against the agent's flattery and hallucination; mining (1) manufactures candidates in parallel instead of waiting for serendipity; filtering (2) and ranking (3) turn the agent on its own candidates and keep only what survives an attack *and* is fundable; killing (4) spends a day to avoid spending a year; landing (5) proves the survivor real and leaves you holding the three deliverables that *are* a finished literature review. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: mine in parallel because you can, attack before you trust, and kill cheap before you build.

It pairs with its siblings without duplicating them. Inside `inquiry`, `prospect` owns step one — *find and prove the gap*; the later skills will own method design, experiment design, analysis, and writing (this skill hands them a landed gap with reproduced baselines, not a hunch). And it routes to the engineering suite when the work turns to *building*: `assay` tests the behavior of the experiment code, `gauge` and `plumb` watch its signal and craft, `groundwork` and `load-bearing` shape the system you build to run the study. For an agent the lever is the same as everywhere in the suite: it will agreeably confirm the gap you hoped for, quote a number it never reproduced, and call a relabel novel — feeling none of the future desk-reject or failed replication — so the gap must be **mined, attacked, and gated**, with the version that survived the attack made the one you bet on.

## Anti-patterns (use as a pre-flight checklist)

- **Reading for a gap instead of mining for one** — waiting for an idea to "emerge" from close reading; run the seams in parallel and manufacture candidates.
- **Running one search thread** — the human-era limit; the whole agent-era gain is several seams at once, each blind to the others.
- **Trusting the agent as oracle** — it is the means (miner + adversary), not the source of truth; verify every surfaced paper against the source.
- **Believing a hallucinated citation** — the agent invents plausible papers; title and core claim are checked before a paper enters your library.
- **Reading an abstract's rhetoric as a result** — "we significantly improve" in the abstract is marketing until the experiment table says so; the map is not the territory.
- **Treating every blank cell as opportunity** — a blank is gold only if nobody thought of it; diagnose the four causes (un-thought-of / done-elsewhere / too-hard / pointless) first.
- **Asking the soft question** — "what related work is there?" lets the agent confirm your path; command "prove this was already done" instead.
- **Accepting a cosmetic delta** — a relabel of an existing result dies at review as incremental; demand a precise, expert-acceptable difference at the cheap stage.
- **Betting on an un-fundable gap** — no benchmark, no recent strong baseline, undoable in your compute budget, or unspeakable in one sentence; score the four questions first.
- **Beating only weak/old baselines** — a win no reviewer believes; the comparison must include the recent strong method.
- **Building the full system before testing the bet** — design the day-long experiment whose negative result kills the idea, and run that first.
- **Clinging to an idea past its kill-shot** — the cheaper an idea dies, the earlier it should; a killed candidate is a successful prospect.
- **Quoting the paper's number instead of reproducing it** — report only what you verified on your machine; an unreproducible "SOTA" may itself be your gap.
- **Forever reading, never committing** — the terminus is the three deliverables (gap statement, comparison table, reproduced baselines), not the empty unread-pile.
- **Outsourcing the three judgments** — the dimensions, the blank's cause, and the final bet are yours; automating them is automating your way to a confident wrong answer.
- **Chasing a gap the next model will erase** — apply the bitter-lesson discount; hunt structural problems (guarantees, verifiability, efficiency) that survive stronger models.
- **Skipping a GATE** — and remember the cheapest research failure is the bet you never placed because the gap didn't survive the attack.

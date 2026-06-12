# The Forking Garden, the Verdict & the Red-Team — settle every claim, then attack it (STAGE 5-6)

This reference is the depth behind **STAGE 5 — Verdict** and **STAGE 6 — Redteam** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 5 resolves every claim in the matrix to a definite verdict and defends the analysis against the garden of forking paths — the most insidious threat the agent era amplifies. STAGE 6 renders each figure to carry exactly one point and then turns a systematized hostile agent loose on the whole paper. Together they close the analysis arc: every preceding stage *established what is true and why* (audit, distribution, ablation, mechanism, boundary), and these two *settle the claims into the language of evidence and stress-test that evidence before a reviewer does.* This file backs the four gated checks across those two stages — verdict's `every-claim-settled` and `forking-garden-disciplined`, and redteam's `adversarial-review-systematized` and `figures-carry-one-point`.

The governing fact, restated because every move below is judged against it:

> The forking garden contaminates a researcher who is subjectively, completely honest — so the defense cannot be "be more honest." It must move every analysis choice to *before* you see the data, and spend the agent's cheap compute proving every reasonable path converges instead of hunting the one that flatters you.

---

## Where these two stages sit, and why in this order

By the time you arrive here the data has been audited (STAGE 0), the distribution and slices read with correct statistics (STAGE 1), the ablation interpreted against its traps (STAGE 2), the mechanism stood on at least two probes (STAGE 3), and the failure boundary characterized (STAGE 4). What is *not* yet done is two different kinds of work:

- **STAGE 5 asks "what does each claim resolve to, and did I walk an honest path to get there?"** Every claim in the matrix must become **supported / revised / dropped** — and the act of settling is where the forking garden does its damage, because the temptation is to settle each claim along whichever of the many defensible analysis paths makes it land. Defending the garden is not a separate task bolted onto settlement; it *is* settlement done honestly.
- **STAGE 6 asks "is the evidence legible, and does it survive attack?"** A settled claim a reviewer cannot read in three seconds is a settled claim that gets rejected anyway; and a claim that has never met an adversary is a claim whose holes you discover in rebuttal — three to six months and one submission cycle too late. Render first (one point per figure), then attack.

The order is load-bearing. You settle the claims *before* the red-team, because the red-team attacks settled claims — it cannot stress-test a verdict that does not yet exist. And you defend the forking garden *inside* settlement, not after, because once a claim is written down along a fished path, no amount of later review recovers the path you should have walked.

The lever is the same as everywhere in `reckoning`. The agent does the analyst's labor in parallel — it batches the multiverse, drafts the figures, plays every adversarial role tirelessly and without ego — but its gradient points at confirming your story and, when asked to criticize, decays into universally-true platitudes ("the experiments could be more thorough"). Left soft it settles every claim as supported, picks the figure that looks best over the one that carries the point, and reviews your paper into a tepid blended compliment. **The agent is the means — the prober and the adversary. It is never the oracle.** The judgments below are yours: which claims to settle how, whether a shrunk effect is downgraded or deleted, and what one point each figure must carry.

---

## STAGE 5, part 1 — the garden of forking paths: the honest researcher's contamination (`forking-garden-disciplined`)

The garden of forking paths (Gelman & Loken) is **not** p-hacking, and the distinction is the whole point. P-hacking is deliberate: you run the test, it misses, you try another, and another, until one is significant — you know you are fishing. The forking garden is the **no-malice** version, and it is worse precisely because the researcher walking it is subjectively, completely honest.

Here is how it works. As you analyze, you meet a chain of nodes, and at each one you make a choice that *looks reasonable*:

- this one instance clearly has a data problem — drop it, or keep it?
- what timeout/censoring convention — PAR10, or report the solved intersection?
- report the mean, or the median?
- which slice — by scale, by constraint-tightness, by class?
- how many seeds is enough?

At each node you choose in good conscience. The problem is that **the choices are made after seeing the data**, and you would have chosen differently had the data come out differently. Drop the weird instance — but would you have looked for its "data problem" at all if it hadn't been hurting you? Report the median — but would you have reached for it if the mean had already favored you? Each choice is contingent on the data in a way you cannot feel.

The consequence is exact and counter-intuitive: **even a single analysis you ran exactly once has an inflated false-positive rate.** You did not try twenty tests. You ran one. But the other forks exist in the **possibility space** — you *need not have walked them*, yet their existence is what inflates the rate, because your one path was selected, post hoc, by the data. This is why the garden is so insidious: there is no moment of dishonesty to catch, no second test to confess. The contaminated researcher passes every check, including their own conscience.

### The researcher-degrees-of-freedom list (concrete to computational experiments)

The forks are not abstract. In a computational-experiments paper they are a specific, recurring list — learn to see each one as a fork:

- **Instance-set inclusion** — "this instance clearly has a data problem." The tell: did you find the problem *after* it hurt you? An instance dropped for a flaw discovered when it cost you a win is a fork walked.
- **Timeout / censoring convention** — which runs count as solved, how timeouts are penalized. Change the convention and the ranking can flip.
- **Metric choice** — gap, objective, or time. There is almost always one of the three that favors you; choosing it after seeing all three is a fork.
- **Aggregation method** — mean, median, geometric mean, per-instance vs. pooled.
- **Seed-count timing** — the sharpest fork of all. "Add five more seeds" when you are behind, but never when you are ahead, is **optional stopping** — and optional stopping *alone*, with no other degree of freedom, is enough to inflate the false-positive rate badly.
- **When to stop the whole experiment** — quitting once the result looks good is the experiment-level version of optional stopping.
- **Which baseline version** — an older, weaker baseline build that flatters you.
- **How to slice** — and which slice to report once you have seen them all.
- **How to handle anomalous runs** — which to keep, which to call a glitch.

Each item is a node. A paper threads dozens of them. The path you walked feels forced at every step; the possibility space says otherwise.

### Why the agent era AMPLIFIES it

The harm from the forking garden scales with **the number of paths you could have walked** — and that number was historically bounded by the cost of an experiment. When a run took a week of cluster time, you could not afford to wander far; the budget capped the forks.

Cheap agent experiments drop that cap. Worse: they drop the cost of the *experiment* and the cost of *unconscious cheating* together, in lockstep — every dollar shaved off a run is a dollar shaved off the price of one more fork. **This is the most important dark side of agent-driven research — more dangerous than "the agent writes bugs."** A bug gets caught by the feasibility checker, the audit, the independent verifier. Garden-drift passes every check, because nothing in it is wrong: each individual choice is defensible, the code is correct, the number is real. The contamination lives in the *selection* of the path, which no test inspects.

### The defenses — one shared target: choices before data

Every defense against the garden, once you see them together, has the same target: **move the analysis choices to before you see the data.** That is the whole game.

- **Protocol pre-registration + freeze** (from `ledger`) — the choices are written and locked before the confirmation run.
- **Exploration / confirmation firewall** — the line that says exploration may wander all it likes; confirmation runs the frozen choices once.
- **Kill / decision criteria first** — what counts as success is declared before the result arrives.
- **Held-out instances** — a set the analysis never touched until the final, single confirmation.
- **The append-only 历程 (the lab notebook — an immutable, timestamped record of every hypothesis and decision)** — with immutable timestamps, it makes "did I hypothesize this before or after seeing the data?" an **auditable fact, not a memory.** Memory rewrites itself to feel honest; a timestamp does not.

Two special weapons deserve their own treatment, because they do more than relocate a choice — they eliminate it:

**(a) Decision-rules-in-advance.** Write the choice as a *mechanical rule* in the protocol, of the form "if X happens, do Y," before any data is seen. The outlier definition and its handling ("an instance whose runtime exceeds the median by more than k× is excluded, by this rule, regardless of which method it hurts"); the seed-count rule ("run exactly N seeds, fixed in advance, no top-ups"); the stopping rule ("stop at the pre-set instance count, not when the result looks good"). When the data arrives, **you have no decision to make** — the rule already decided. And no decision means no fork. This is the cleanest defense there is: it does not ask you to choose honestly, it removes the choice.

**(b) Multiverse / specification-curve analysis.** Where a choice is *genuinely arbitrary* — mean vs. median has no right answer, some censoring conventions are equally defensible — do not choose at all. Run **all** reasonable combinations and report the result across the whole set: "the conclusion holds under 95% of reasonable analysis paths." A claim that survives the entire multiverse is far stronger than one that survives the single path you happened to pick, *and* it is immune to the accusation that you picked the flattering path — because you picked all of them.

This is the reversal the stage turns on, the suite's through-line made concrete. The agent's compute dividend — the very thing that *amplified* the garden by making forks cheap — is exactly what funds the multiverse. **Spend the cheap compute running the whole garden to prove convergence, not hunting the best-looking path through it.** The same lever that lets you cheat unconsciously lets you prove you did not.

---

## STAGE 5, part 2 — settling claims when confirmation overturns exploration (`every-claim-settled`)

Sometimes the exciting finding from the exploration 历程 shrinks or vanishes when it meets fresh seeds or held-out instances in confirmation. This is not a failure of the analysis; it is the firewall working. The response is **graded** — the verdict depends on *how* the effect changed, and an honestly revised claim is a stronger paper than a defended false one:

- **Effect smaller but still significant → DOWNGRADE the wording.** The claim survives, but "dramatically outperforms" becomes "modestly but reliably outperforms." You revise the language to match the confirmed magnitude, not the exploratory excitement.
- **Effect only in a slice → CONDITIONALIZE the claim.** It held on large instances, not small; on tight-constraint problems, not loose. The claim narrows to "the method wins *when* constraint-tightness exceeds X." This is often a **sharper, better paper** — a characterized applicable condition is more valuable than a vague everywhere-win, because it points the reader at exactly where to use the method.
- **Effect gone → DELETE the claim.** It does not survive confirmation. The claim comes out, and you go back to method design or move to the next variant. Deleting a dead claim is cheaper than defending it through review and into a failed replication.

### The red line

> Never invent a new story from the confirmation data and declare it validated on that same data.

When the original effect vanishes, the confirmation run sits there full of numbers, and the temptation is to dig — to find *some* pattern in it that works, and report that pattern as confirmed. This is the firewall breached in reverse. **Any pattern found while digging in confirmation data is a NEW hypothesis**, and a new hypothesis requires a *fresh* batch to confirm. The confirmation data already spent its one shot validating the pre-registered claim; it cannot also be the data that validates a story discovered inside it. The 历程's timestamps are what enforce this: a claim whose hypothesis-timestamp post-dates the confirmation run is, by the record, exploratory — no matter how clean its number looks.

---

## STAGE 6, part 1 — the systematized agent red-team (`adversarial-review-systematized`)

The agent makes an extraordinary reviewer and a terrible one, depending entirely on how you run it. **Calibrate the expectation first:** it is cheap, tireless, and infinitely repeatable — you can run the harshest review thirty times for free — but it *defaults to polite platitudes* ("the work is solid; the experiments could be more thorough"). The entire goal of the system below is to **squeeze the platitudes out.** A red-team that returns comfortable generalities has told you nothing a reviewer will not later tell you for real. Six practices turn the agent from a flatterer into an adversary.

### 1. Role separation

Run **separate fresh sessions**, each forbidden to comment outside its lane:

- a **statistics reviewer** — tests, aggregation, censoring only; nothing about novelty or writing;
- a **domain veteran** — novelty only, fed the near-neighbor PDFs, asked "how does this differ *essentially* from X?";
- a **reproduction reviewer** — only the repro package + protocol; it actually runs the README clean from scratch and reports every blocker it hits;
- a **story reviewer** — only the intro + figures, run against the three-second test: each figure understood in three seconds, each claim restated accurately.

Mixed into one session, the agent averages these into a single tepid, blended opinion — the statistics worry diluted by the writing praise into nothing actionable. Separated, each lane stays sharp.

### 2. Feed ammunition to calibrate

Give the agent the **target venue's real review form** and **real public reviews** (e.g. from OpenReview) and require it to match the same format and the same severity baseline. Without a calibration sample, the agent's "strict" is imaginary — it has no idea what a real reject-grade comment reads like, so it invents a polite one. Show it what real severity looks like and it can imitate it.

### 3. Intensity-graded prompts

Escalate across three sessions:

- **Round 1:** "list **at most three** fatal flaws, ranked by reject-probability." The cap of three is the key — uncapped, the agent floods you with twenty undifferentiated items and you cannot tell the lethal one from the cosmetic. Forcing a ranked top-three makes it commit to what actually sinks the paper.
- **Round 2, new session:** "assume you have *decided* to reject this paper; write the most persuasive, hardest-to-rebut rejection." Starting from the decision to reject removes the agent's instinct to hedge.
- **Round 3, another new session:** have it write a **rebuttal** to that rejection, and watch the attack/defense exchange. The points you cannot hold in the rebuttal are exactly the holes to fill before submission.

### 4. Concrete targets

Aim the agent at specifics, not "review this":

- for **each claim** — construct an alternative explanation consistent with the same data;
- for **each figure** — a way it could mislead;
- for **each bold number** — interrogate its convention (how many seeds, what aggregation, how censored);
- and open search to find **missed near-neighbor work**.

### 5. Defend the known failure modes

The agent has predictable weaknesses; design around each:

- **Confident writing genuinely lowers its criticism** — so review a *neutralized* version, with the boastful adjectives stripped, or it will mistake your confidence for evidence.
- **A long session drifts onto your side** — so every important review is a **new session.** Never ask for a review in a session that helped you write the paper; it has already joined your team.
- You can also **forbid it from commenting on writing** to force it onto experimental validity, where the real danger lives.

### 6. Timing — front-loaded

The cheapest review is the earliest one. A flaw caught **before the protocol freeze** costs *one line* of edit; the same flaw arriving from a real reviewer costs a **submission cycle of three to six months.** So run the agent red-team three times, at descending ROI:

1. **the protocol, before freeze** — highest ROI by far;
2. **the analysis, after results**;
3. **the manuscript, when drafted.**

### The boundary — what the agent cannot judge

The agent catches **structural holes, consistency errors, vague conventions, and missed near-neighbors** — which is the *majority* of real review comments, caught for free before submission. But it **cannot reliably judge whether the problem itself matters, or whether the direction has taste.** Those stay with humans — your advisor, your collaborators, a friendly pre-submission read. **Taste calibrates only against people.** Treat the agent as the exhaustive catcher of the mechanical and the structural, and humans as the only judges of whether the whole thing is worth doing.

---

## STAGE 6, part 2 — figure utilitarianism (`figures-carry-one-point`)

A figure exists to deliver **exactly one information point**, stateable in one sentence: "Figure 3: our advantage grows as instances scale." Write that sentence first. **A figure that fails the one-sentence test is deleted** — not shrunk, not moved to an appendix, deleted. A figure carrying two points carries neither, because the reader does not know which one to take away.

With the one point fixed, the craft makes it legible:

- **Captions self-contained** — the figure plus its caption must be understandable without the body text, because reviewers read figures before prose and skim back to them.
- **Tables: bold the best value, show mean±std, match significant digits to measurement precision.** Reporting a runtime to four decimal places advertises that you never thought about precision — the digits claim a resolution your measurement does not have.
- **Comparison curves carry confidence bands, not bare means** — a bare mean line hides whether the gap is real, which is the first thing a careful reviewer checks.
- **Axes start at an honest zero, and any truncation is explicitly marked** — a y-axis that starts at 90% to make a 2% gap look enormous is the oldest misleading figure there is, and a reviewer who spots it discounts every other figure.

Every figure's generation script joins **forge's one-command regeneration chain**, so when "the reviewer wants the figure changed" arrives, it is a three-minute edit and a re-run, not a day of manual replotting. The division of labor holds here too: **the agent drafts the figures; the human owns the one-point list** — the sentence each figure must carry. The agent will happily produce a beautiful plot that says nothing; deciding what each figure is *for* is yours.

---

## The exit condition for step five

`reckoning` closes — the analysis is done, and the paper exists in pieces — when four things hold at once:

- **Every claim settled** (`every-claim-settled`) — each matrix claim resolves to supported / revised / dropped, the settling recorded, with the honesty to downgrade, conditionalize, or delete what confirmation shrank.
- **The forking garden defended** (`forking-garden-disciplined`) — the choices were made before the data (decision-rules-in-advance, the firewall, the multiverse where a choice is arbitrary), the red line held, and the 历程's timestamps make the path auditable.
- **The red-team systematized** (`adversarial-review-systematized`) — separated roles in fresh sessions, calibrated against real reviews, graded in intensity, aimed at concrete targets, run before the freeze — with taste left to humans.
- **Every figure carries one point** (`figures-carry-one-point`) — one sentence per figure or it is deleted, with self-contained captions, honest axes, and a script in the regeneration chain.

When all four hold, the `FINAL GATE` clears (`checklist show` confirms all seven stages passed, `checklist done` clears the run) and what you carry out is not "some plots and a method that wins." It is a paper that already exists in pieces: the settled claims are its argument, the mechanism probes are its discussion, the failure boundary is its limitations, and every figure has survived an adversary. The writing step assembles them — but the evidence has already been settled here, honestly, along paths chosen before the data and stress-tested against attack.

---

**Cross-links:** [../SKILL.md](../SKILL.md) — the gated flight plan this depth serves (STAGE 5 Verdict, STAGE 6 Redteam, and the seven-stage arc they close). The exploration/confirmation firewall the forking-garden defense extends, the pre-registered protocol whose frozen choices defeat optional stopping, and the append-only 历程 whose timestamps make the path auditable are all designed in [../../ledger/SKILL.md](../../ledger/SKILL.md) (research step four — the experiment-design lens; this stage runs the *confirmation* it froze). The near-neighbor PDFs the domain-veteran reviewer is fed and the difference table the related-work review attacks come from [../../prospect/SKILL.md](../../prospect/SKILL.md) (research step one — the literature-review lens). Within `reckoning`, the claims this stage settles are derived in the STAGE-0/1 audit-and-distribution work (the why-audit-not-celebrate and distribution-and-statistics references); the mechanism probes that become the paper's discussion and the failure boundary the red-team checks live in the STAGE-3/4 mechanism-probes reference; and the one-command figure regeneration the figure craft depends on is forge's chain, reused here so a reviewer's requested change is a three-minute edit.

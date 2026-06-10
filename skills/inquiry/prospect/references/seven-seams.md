# The Seven Seams — the mining strategies behind STAGE 1 (Mine)

This reference is the depth behind **STAGE 1 — Mine** of the [../SKILL.md](../SKILL.md) flight plan. It is the catalogue of *how you dig*: the search infrastructure the seams run on, and the seven fixed extraction strategies that, run in parallel and each blind to the others, manufacture a written candidate list of 10-20 gaps instead of waiting for one to surface from close reading. It backs the three mine checks — `seams-run-in-parallel` (you opened several seams, not one search thread), `candidates-listed` (the run terminates in a written list, not a vibe), and `dimensions-are-yours` (you, not the agent, decided what the matrix axes and clustering themes *are*).

The governing fact, restated because every seam below is judged against it:

> You do not wait for a gap to emerge; you open the seams and dig. The human-era limit was one search thread at a time; the agent-era gain is several extraction strategies at once, each blind to the others — and the one thing the agent cannot do for you is decide which dimensions to dig along.

---

## What a seam is, and why there are seven

A **seam** is a fixed extraction strategy: a repeatable procedure that takes the bounded hunting ground from STAGE 0 and returns a list of candidate gaps, each with the evidence that surfaced it. It is not "read until inspired." It is "point the agent at this specific seam, demand this specific structured output, get back this specific kind of candidate."

The seven seams are different cuts through the same body of papers, and they surface different *kinds* of gap:

| Seam | What it mines | The gap it surfaces |
|---|---|---|
| 1. Limitation clustering | what authors admit they can't do | a community-acknowledged unfilled hole |
| 2. The matrix | the method × setting grid | an un-tried combination |
| 3. Assumption audit | what every method depends on | a too-strong shared assumption |
| 4. Leaderboard weakness | the pooled results tables | a hard-bone instance class, or a robustness collapse |
| 5. Reproduction arbitrage | suspect headline results | an inflated SOTA you can re-evaluate or strip |
| 6. Cross-domain transplant | adjacent fields' new techniques | a validated technique absent from your field |
| 7. Trend arbitrage | venue keyword trends + new tooling | a rising-but-rare subfield, a just-unlocked problem |

They overlap on purpose. Run several and the same gap will show up under two seams (a limitation cluster that is also a blank matrix cell, a shared assumption that is also a hard-bone class) — **that convergence is a signal it is real and worth the bet**, not redundant work. Conversely, a gap that only one seam can see at all is a thinner bet.

You do not have to run all seven. STAGE 1 asks for at least three or four, chosen for the field. But you run them **in parallel and blind to each other** — that is the whole agent-era gain, and it is the first thing the `seams-run-in-parallel` check looks for. The human-era researcher ran one search thread, serially, and let the next query be biased by what the last one found. The agent can run the limitation cluster, the matrix scan, and the assumption audit at the same time, none of them knowing what the others turned up, and you read the three candidate lists side by side. Blindness matters: it stops the second seam from confirming the first seam's hope.

**The agent is the means, not the oracle — twice over.** It is your parallel **miner** (it reads the 100 papers, fills the cells, pools the tables, reproduces the baseline — the manual labor you could never do alone at this speed) and, later in STAGE 2, your **adversary**. It is never the source of truth. Its gradient points at pleasing you, and in this stage that produces two signature failures you must guard against on *every* seam:

- **Citation hallucination.** It will return a plausible title, plausible authors, a plausible venue, and a plausible result — for a paper that does not exist, or whose result is nothing like what it reported. Every paper must have its title *and* core claim checked against the real source before it enters your library. The map is not the territory.
- **Abstract-rhetoric-as-result.** It reads "we significantly improve over prior work" in an abstract and records it as an experimental conclusion. Marketing is not a measurement. The claim is real only when the *results table* says so — which is exactly why seams 4 and 5 go to the tables, not the prose.

Build both checks into the prompt of every seam (each template below names the verification it owes you) and re-state them at the top of the run.

---

## The search infrastructure the seams run on — broad search, agent-rebuilt

Before the seams, the wide net. You need a working library of in-scope papers for the seams to dig through, and the agent rebuilds how you cast that net.

**The human-era breadth move**, still valid, still your starting frame:

- Start from **1-2 recent surveys** in the area plus the **top-venue last-3-years accepted lists** (browse DBLP by venue — it gives you the unfiltered population, not a ranked feed).
- **Citation snowballing** in both directions: **backward** through a key paper's references to find the idea's origins and the assumptions it inherited; **forward** through its "cited by" to find the latest progress and who has already chipped at it. Semantic Scholar, Connected Papers, and Google Scholar's "cited by" are the standard tools; Connected Papers is good for seeing the local neighborhood of a paper at a glance.

**The agent-era change** is to hand the wide net to a deep-research-type tool — but the prompt that works is not the prompt people reach for. The instinct is "what's new in field X?" and it returns a shallow listicle. The effective prompt is **your specific problem setting plus its constraints**, and it demands a **structured product**, not prose:

```
You are building a structured literature library for a research review.

PROBLEM SETTING: <your exact setting — e.g. "capacitated vehicle routing with
  stochastic demand, instances up to 1000 nodes, solved within a time budget">
CONSTRAINTS / SCOPE: <method families, target venues, last N years>

Find the in-scope papers and return them GROUPED BY METHOD CATEGORY.
For EACH paper give, in a table row:
  - title, authors, venue, year
  - problem setting actually solved (not the general area — the exact setting)
  - core technique in one phrase
  - benchmark / dataset used
  - the key numbers reported (the actual figures, with the metric)
  - the limitations the authors themselves state
For EACH paper also give the URL or DOI you used as the source.
Do NOT include a paper you cannot point to a real source for. If you are
unsure a paper exists, say so and exclude it rather than guess.

RUN THIS PROMPT 3×, changing ONLY the grouping each time — (1) by method
category, (2) by problem setting, (3) restricted to the last 12 months — then
merge and dedup the three runs into one library.
```

Run **2-3 angles for cross-coverage** — by-method-category, by-problem-setting, and last-12-months-only — because each ordering surfaces papers the others drop. Then merge and dedup into one library.

**The discipline at the door:** verify every paper's title and core conclusion against the source before it enters the library. Citation hallucination and abstract-rhetoric-as-conclusion are the two most common errors of these tools, and a poisoned library quietly corrupts every seam downstream — a hallucinated paper fills a real matrix cell with a phantom, a misread abstract turns a hard-bone class into a solved one. The library is the substrate; keep it clean.

---

## SEAM 1 — Limitation-paragraph clustering (the highest-ROI move)

The single best place a gap hides is in the sentences where authors admit what their method cannot do. Every paper has a "limitations" and a "future work" passage, and the experiment sections quietly confess failure cases. Read 50-100 papers' worth of those passages, cluster them, and count — the high-frequency, cross-paper, still-unsolved cluster is a hole the community has already agreed is a hole.

Have the agent **batch-read 50-100 in-scope papers from the last ~3 years and extract ONLY** each paper's limitation, future-work, and author-admitted failure cases from the experiments — nothing else, no summaries. Then cluster and count. The instruction must pin the output format down hard:

```
Read each of the following <N> in-scope papers. For EACH paper, extract ONLY:
  - LIMITATION: the limitation the author admits, quoted or closely paraphrased,
    WITH the source location (section / figure / "Limitations" / "Future Work").
  - KIND: is this limitation method-INHERENT (built into how the method works)
    or merely ENGINEERING (an implementation detail a later effort would fix)?
  - ALREADY SOLVED?: has a LATER paper already addressed this limitation? If yes,
    give the paper and the evidence (the result that closes it). If no, say "open".

Then CLUSTER the limitations by theme. For EACH cluster report:
  - the theme in one phrase
  - mention frequency (how many of the N papers raise it)
  - the EARLIEST year it was raised
  - the share that are method-inherent vs engineering
  - the share still "open" (no later paper solved it)

Rank clusters by (frequency × years-open), inherent-only. Return the top clusters.
Verify every cited paper against its source; exclude any you cannot source.
```

What you are hunting is the cluster that is **high-frequency, cross-paper, and three-years-unsolved** — many independent author teams flagged the same hole, and no follow-up closed it. That is a community-acknowledged unfilled hole, and it carries a free gift for the writing stage: **when you write the introduction you do not have to argue "why this matters" — you quote the original authors saying it matters.** Their own limitation paragraphs are your motivation section.

**Worked example.** Suppose a vehicle-routing field. The agent reads 80 papers and the limitation clusters come back as: "doesn't scale past ~500 nodes" (mentioned 31×, earliest 2021, mostly inherent, still open); "assumes demand known in advance" (mentioned 24×, earliest 2020, inherent, still open); "single-threaded / slow wall-clock" (mentioned 18×, mostly engineering, several later papers closed it); "limited to Euclidean distances" (mentioned 6×). The first two clusters are candidates — high frequency, inherent, years open. The third is **not** a gap (it is engineering, and follow-ups already solved it — the "already solved?" column caught it). The fourth is too thin. Two candidates out of this seam, each with a built-in motivation paragraph.

**False positives this seam produces:**

- **A limitation a follow-up already solved.** The author admitted it in 2021; someone closed it in 2023. The "already solved?" column is there precisely to catch this — without it you would propose a filled gap.
- **An engineering limitation masquerading as fundamental.** "Our implementation is slow" or "we didn't tune hyperparameters" is not a research gap; it is a weekend. The inherent-vs-engineering column separates the structural hole from the chore.

---

## SEAM 2 — The matrix (cross-blank scan)

Organize the field into a 2-D grid: one axis the **method / technique lines**, the other the **problem settings** (constraint type, scale, information structure, dynamics, …). Each cell holds the count of papers at that intersection plus a representative work. **Blank cells are candidate gaps** — combinations nobody (visibly) tried.

But the table is the easy half and the dangerous half. **The key move is not drawing the matrix — it is interrogating each blank for its CAUSE.** A blank is not automatically an opportunity; it is a question. Have the agent run a targeted search *per blank cell* and classify it:

```
Here is a method × setting matrix for <field>. Cells with counts are filled;
the following cells are BLANK or SPARSE: <list>.

For EACH blank/sparse cell, run a targeted search (try the field's terms AND
adjacent fields' terms AND non-English terms) and classify the cause as ONE of:
  (a) GENUINELY NEVER DONE — no work at this intersection anywhere.
  (b) DONE ELSEWHERE — done, but published low-tier, or under another field's
      terminology, or framed as a different problem. Give the work.
  (c) FUNDAMENTAL BARRIER — a real technical reason it hasn't been done. Name
      the barrier. Then: has any NEW tool/result in the last 2 years removed it?
  (d) DONE AND POINTLESS — tried and abandoned, or trivially uninteresting.
      Give the evidence it is a dead end.

Return, per blank cell: the cause (a/b/c/d), the evidence, and — for (c) — whether
the barrier has just dissolved. Cite real sources only.
```

**Only (a), and the (c) whose barrier a new tool just dissolved, enter the candidate list.** (b) is not a gap — go read the work you just found. (d) is the three-year trap. (This four-way diagnosis is STAGE 2's first job; the matrix just front-loads the question per cell. The full treatment is in [falsify-and-rank.md](falsify-and-rank.md).)

Note a subtlety: a **sparse** cell (2-3 papers) is often a *better* bet than a pure blank. Someone has validated that the direction is feasible and publishable — so it is not cause (c) too-hard or (d) pointless — but it is far from worked-out, which leaves room. A pure blank carries the risk that it is blank for a reason nobody bothered to write down.

**Worked example (illustrative — not surveyed data).** Take methods {exact algorithms, heuristics, learning-augmented, decomposition} × settings {static-deterministic, stochastic-demand, dynamic-online, very-large-scale}:

|                     | static-deterministic | stochastic-demand | dynamic-online | very-large-scale |
|---------------------|:---:|:---:|:---:|:---:|
| **exact**           | 14  | 6   | 3   | 1   |
| **heuristics**      | 20+ | 11  | 8   | 9   |
| **learning-augmented** | 7 | 4 | **0** | 5 |
| **decomposition**   | 9   | 5   | 2   | **0** |

The static and stochastic columns are dense to saturated — red ocean, leave them. Two cells are **blank**: learning-augmented × dynamic-online, and decomposition × very-large-scale. Those are the **amber candidate cells** — but they go to the agent for cause-diagnosis before they become candidates. Maybe learning-augmented × dynamic-online is (a) genuinely never done (a gap). Maybe decomposition × very-large-scale is (c) blocked because no solver could handle the subproblems at that scale — in which case the candidacy turns on *whether a new solver version just changed that* (which is exactly what SEAM 7 feeds in).

State the rule plainly: **the three reasons a cell is blank are nobody-thought-of-it / too-hard / not-worth-it, and only the first is a good gap.** (The matrix's (b) "done elsewhere" is the fourth answer — and a reminder that a blank cell can simply mean your axes missed where the work was filed.)

**False positive this seam produces:** treating **every** blank as an opportunity without diagnosing its cause. An undiagnosed blank list is a list of suspects, not findings — and most of them are (b), (c), or (d). The whole value of the seam is the diagnosis, not the grid.

---

## SEAM 3 — Assumption audit

Every method buys its tractability with assumptions: convexity, stationarity, full information, demand independence, a scale cap, unlimited solve time, a known distribution, a fixed graph. Make those assumptions visible and you find the gap where they all share one that reality breaks.

Have the agent extract, for each in-scope paper, **the assumption the method DEPENDS ON** — the load-bearing one, the one that if false breaks the method — into an **assumption × paper** table:

```
For each in-scope paper, identify the assumption(s) its method structurally
DEPENDS ON to work or to be tractable (e.g. convexity, stationarity, full/known
information, demand independence, a hard scale cap, unbounded solve time, a fixed
known graph, i.i.d. data). For each, give:
  - the assumption, stated precisely
  - the source location where it is made or relied on
  - whether it is LOAD-BEARING for tractability (relaxing it likely breaks the
    method or its guarantees) or merely SIMPLIFYING (relaxing it is mostly work)

Build an ASSUMPTION × PAPER table. Then report, for each assumption:
  - how many papers share it
  - whether it is plainly FALSE in the real deployment setting <describe yours>
  - whether any existing paper already relaxes it (give the work)
```

**The utilitarian read:** an assumption **shared by all (or nearly all) papers** but **plainly false in the real setting** is a ready-made gap with a built-in story — *"all existing methods assume X; in practice X fails; we are the first to relax it."* That sentence is a paper's spine, and it writes itself.

**OR / optimization papers reward this seam especially**, because in those fields **"a more realistic setting" is itself a contribution** — relaxing an assumption that everyone made is not a footnote, it is the result. (In some ML subfields the same move is weaker, because a more realistic setting without a method that exploits it can read as just a harder benchmark. Know which kind of field you're in.)

**Worked example.** In a scheduling field, the audit shows 90% of papers assume **job processing times are known exactly in advance**. In the real factory they are estimates with 15-20% error. That shared, reality-false, load-bearing assumption is a clean candidate: *every existing scheduler assumes known processing times; ours is the first robust-scheduling method for the uncertain case.* The built-in story is the contribution.

**False positive this seam produces:** an assumption that is genuinely **load-bearing for tractability**. If convexity is what makes the whole approach solvable, "relax convexity" is not a cheap win — it is very likely a (c) too-hard blank in disguise, a research program rather than a gap you can land in 3-6 months. The load-bearing-vs-simplifying column is there to flag exactly this: relaxing a *simplifying* assumption is a contribution; relaxing a *load-bearing* one may be a thesis or a wall.

---

## SEAM 4 — Leaderboard / results-table weakness

Each paper reports its own results in its own table and tells its own winning story. Pool every in-scope paper's **main results table into one big table** — unified datasets, unified metrics — and the field's collective weaknesses become visible in a way no single paper shows.

```
Collect the MAIN results table from each in-scope paper. Normalize onto a SHARED
set of datasets / instance classes and a SHARED metric set. Where two papers
report on the same benchmark, put their numbers side by side. Where numbers are
NOT comparable (different splits, different metric definitions, different
preprocessing), DO NOT silently merge them — FLAG the mismatch and keep them apart.

Then answer two questions from the pooled table:
  (1) HARD-BONE: which instance classes / settings have ALL methods still doing
      badly (no method gets near the achievable/ideal)? List them with the best
      result any method achieves there.
  (2) ROBUSTNESS: which methods WIN on class A but COLLAPSE on class B? List each
      such method with its A-result and its B-result.

Cite the source table for every number. Quote the number the paper reports; do
not infer numbers.
```

Two gaps fall out:

- **The hard-bone gap.** An instance class or setting where *every* method is still bad — nobody can crack it. That is a hole the whole field has bounced off, and a clean target: you don't have to beat a strong method, you have to be the first to do *well at all* on the hard bone.
- **The robustness gap.** A method that wins on class A and collapses on class B exposes that the field optimizes for A. "A single method robust across A and B" is a contribution, and you have the table that proves the collapse is real.

**Byproduct, and it is a large one:** you now hold a **panoramic comparison table** across the field — broader than any single paper's table — which is most of the way to STAGE 5's core-paper comparison table and to your eventual Related Work section. (The schema and how to finish it live in [table-and-reproduction.md](table-and-reproduction.md).)

**False positive this seam produces:** **incomparable numbers across papers.** Paper A's "92%" and paper B's "89%" may be on different splits, different metric definitions, different preprocessing — comparing them directly invents a weakness or a win that isn't there. The agent must **normalize or flag**, never silently merge. A pooled table built on quietly-mismatched numbers is worse than no table, because it looks authoritative.

---

## SEAM 5 — Reproduction-gap arbitrage

Some headline results don't hold up. Picking a suspect one and actually re-running it is a high-ROI seam, because the reproduction either gives you a publishable re-evaluation or hands you the one component that actually works. (This seam cross-links to STAGE 5's reproduction discipline — the verify-the-number, never-quote-the-claim rule — in [table-and-reproduction.md](table-and-reproduction.md).)

Pick **2-3 fast-rising-citation papers you SUSPECT of inflated results.** The telltale signals:

- **the baselines are all old methods** — the win is over a weak field, not the current strong method;
- **a key ablation is missing** — you can't tell which component does the work;
- **only a single seed is reported** — the gain may be noise.

Have a coding agent reproduce them under **fair settings**:

```
Reproduce the headline result of <paper> from its released code (or a faithful
reimplementation). Run it under FAIR settings:
  - compare against a RECENT strong baseline, not only the paper's old baselines
  - run multiple seeds and report mean ± spread, not a single run
  - hold preprocessing / data splits / tuning budget equal across methods
Report: the paper's claimed number, your reproduced number, and the gap. If the
advantage shrinks or disappears under fair settings, isolate WHICH component the
remaining advantage (if any) comes from via ablation.
Flag any setting where you had to guess (missing hyperparameters, unclear split) —
fairness is the point; an unfair reproduction proves nothing.
```

If the advantage **shrinks or vanishes** under fair settings, you have two plays:

- **Write a re-evaluation / benchmark paper.** Many venues have a dedicated track for exactly this (reproducibility, datasets-and-benchmarks, evaluation). It is **very high ROI** — the work is mostly careful re-running, the contribution is honest, and the bar is "you did the experiment the original didn't."
- **Strip out the component that actually does the work** and use it as the starting point of your own method — you've found, by ablation, the one real lever in an over-claimed paper.

**False positive this seam produces:** **your own unfair reproduction.** Wrong hyperparameters, a worse tuning budget, a mishandled split — and *you* manufactured the gap, not the original authors. **Fairness is on you.** Before you claim a result doesn't reproduce, you must have given it every advantage the original had. An unfair non-reproduction is not intelligence; it is a bug in your harness with your name on it.

---

## SEAM 6 — Cross-domain transplant

A technique mature in one field is often unknown in an adjacent one. The gap is the **set difference**: technique T is standard in field A, and field B — yours — has never tried it.

Give the agent **two parallel search tasks**, then the difference:

```
TASK 1: List the techniques currently used in <your target field B> for <the
  problem class>. For each, one line on what it does.
TASK 2: List techniques that EMERGED in the last ~2 years in these ADJACENT
  fields: <e.g. for vehicle routing → production scheduling, network design;
  for ML systems → databases, compilers>. For each, one line on what it does
  and one on what structural feature of its home field it exploits.

Then take the SET DIFFERENCE: for each technique T mature in an adjacent field A
but ABSENT from field B's literature, report:
  - T, and the result that established it in A
  - a search confirming T has NOT (or has only quietly) appeared in B
  - the structural feature of B that would make porting T NON-TRIVIAL
Exclude any T whose transplant to B would be mechanical/trivial.
```

A transplant gap has a real advantage: **low technical risk.** The technique is validated elsewhere, so you are not betting on whether it works at all. The whole argument therefore rests on one sentence — **"why does field B's structure make this transplant non-trivial?"** — and **that sentence must hold**, because if the port is mechanical, a reviewer calls it incremental and the paper dies. A transplant where B's structure genuinely fights the technique (different objective, different constraints, a structural feature A's version assumed away) is a real contribution; a transplant where you just changed the dataset is not.

**Worked example.** A decomposition technique is standard in network design but absent from a vehicle-routing subfield. The transplant is a candidate only if routing's structure makes it non-trivial — say the routing problem's coupling constraints break the clean subproblem separation that network design relied on, so the technique needs a real modification to apply. If it ports unchanged, it's incremental. The non-triviality sentence is the whole bet.

**False positives this seam produces:** a transplant that is **trivial** (a reviewer kills it as "just applying X to Y"), or one **already done quietly** (someone in B tried it in a workshop paper you didn't find). The "confirm T has NOT appeared in B" search and the "make porting non-trivial" requirement are there to catch both — but the non-triviality judgment is yours, not the agent's.

---

## SEAM 7 — Time-difference / trend arbitrage

Fields move, and the timing of when you enter a subfield matters as much as the subfield. Two concrete moves.

**Move 1 — the rising-but-rare keyword.** Have the agent tabulate the **target venues' accepted-paper keyword distribution over the last 3 years and its year-on-year change.** You are hunting subfields whose **frequency is rising but absolute count is still small** — the rising tide that the reviewer pool is naturally friendly to (they've seen enough to accept it as legitimate) but that isn't yet crowded.

```
For <target venues>, tabulate the keyword / topic distribution of accepted papers
for each of the last 3 years. Compute year-on-year change per topic.
Return topics that are RISING in frequency (clear upward YoY trend) but still SMALL
in absolute count (not yet saturated). For each, give the 3-year counts, the trend,
and 2-3 representative recent papers. Cite the venue program / proceedings as source.
```

A rising-but-small topic is a **dividend**: entering it now means a friendlier reviewer pool and an uncrowded field. Enter it three years later and it's a red ocean.

**Move 2 — the just-unlocked problem (run this monthly).** Have the agent scan the **last 60-90 days of arXiv plus the tooling layer** — new solver version features, new open models, new benchmark releases — and ask the one question:

```
Scan (a) the last 60-90 days of arXiv in <scope> and (b) recent tooling updates:
new solver versions and their new capabilities, new open models, newly released
benchmarks/datasets in <area>. For EACH new capability, answer:
  "What problem that was previously infeasible does this newly make possible?"
Return capability → newly-unlocked problem, with the source of the capability.
```

This is the feed for **SEAM 2's "barrier just dissolved" (c) cells.** When a matrix cell is blank because of a fundamental barrier, the question is whether a new tool just removed that barrier — and this scan is what tells you. A new solver that handles 10× larger subproblems may have just opened the decomposition × very-large-scale cell from the worked example above.

**A note on agent-as-object (one trend instance, not the framing).** Some of the not-yet-saturated subfields are about agents themselves: LLM+solver hybrids, agents doing algorithm design or hyperparameter search, agent-automated experiment pipelines. For a CS×OR background these are a genuine dividend entry point — rising, friendly, uncrowded. But treat this as **one instance of trend arbitrage, not the lens of the whole skill.** In `prospect` the agent is the *means* (miner + adversary), and only here, as one trend among others, does it appear as a possible research *object*. Don't let the shiny case rewrite the framing.

**False positive this seam produces:** mistaking a **hype spike for a rising tide.** A keyword that spiked once on a single splashy paper and is already cresting is not a dividend — it's a bandwagon you'd join at the top. Look for a sustained upward trend with room left, not a one-year jump. And a "newly possible" problem is only real if the capability genuinely removes the old barrier — verify the capability does what the release notes claim before you build a candidate on it.

---

## What STAGE 1 produces, and the one thing only you can do

**The output of STAGE 1 is a WRITTEN candidate list of ~10-20 gaps** — not a feeling that the field is crowded, not a single favorite, a list. Each entry carries:

- **the seam that surfaced it** (so you know what kind of evidence backs it, and so a gap that surfaced under two seams is visibly stronger);
- **a one-line statement of the hole** (precise enough that STAGE 2 can attack it).

This list is what the `candidates-listed` check looks for. And the count matters: **under-producing — 2 or 3 candidates — means the seams weren't run broadly or in parallel enough.** It is the symptom of running one seam, or running seams serially so each biased the next, or stopping at the first plausible gap. Go back and open more seams before you filter. The mining stage is supposed to *widen*; the narrowing is STAGE 2's job (diagnose the blanks, then attack — see [falsify-and-rank.md](falsify-and-rank.md)), not STAGE 1's.

And the one thing the agent cannot do for you, the thing the `dimensions-are-yours` check guards: **the dimensions.** How you slice the matrix axes, what themes you cluster the limitations into, which adjacent fields count as "adjacent," which assumptions you treat as load-bearing — these decide what becomes *visible at all*. A matrix with the wrong axes hides the gap in a cell that was never drawn. A clustering with the wrong themes buries the high-frequency limitation by splitting it across three labels. **The agent fills the cells; you decide what the cells are.** This is the first of the skill's three non-delegable judgments, and it is non-delegable for a structural reason: if you hand the agent the dimensions *it* proposed, you have outsourced the one choice that shapes everything downstream — and the agent's proposed dimensions point, like its gradient, at the conventional cut everyone already made, which is exactly the cut that hides the gap. Choose the dimensions yourself, run the seams in parallel against them, and read the candidate list they manufacture. That is the dig.

# Skeleton & Sections — the figure-first spine and the section templates (STAGE 0-1)

This reference is the depth behind **STAGE 0 — Skeleton** and **STAGE 1 — Draft** of the [../SKILL.md](../SKILL.md) flight plan. It governs the construction half of the step: *how the manuscript is built* before a word of it is defended or carried anywhere. The foundation ([why-the-paper-already-exists.md](why-the-paper-already-exists.md)) established that the paper already exists in pieces — the claims are its argument, the frozen protocol its experiments, the mechanism probes its discussion, the comparison table its related work — and that writing is *stringing those pieces into prose*, not composing from a blank page. This stage is the stringing: it lays the spine that fixes the order, writes the one-sentence insight that makes the line legible, tests that spine before any prose is spent on it, and then fills the existing argument into near-fixed section shapes. It backs the four gated checks across the two stages: skeleton's `figures-first-story-fixed` and `skeleton-reader-tested`, and draft's `intro-and-contributions` and `body-organized-by-claim`. The fact every move below is judged against:

> The figure SEQUENCE is the paper's skeleton — one figure per argument step — and the one-sentence insight is its soul; both are fixed and reader-tested before a paragraph is written, because the cheapest place to find a broken argument is in the captions, not in the prose. The sections are templates the existing argument is poured into, organized by CLAIM, never written top-to-bottom from page one.

---

## Why you do not write top-to-bottom

The instinct on "write the paper" is to open a file and start at the title, then the abstract, then the intro, and write forward to the conclusion. That instinct produces the worst version of the paper, for a mechanical reason: writing forward forces you to commit the *prose* of the argument before you have settled the *shape* of the argument, so you spend your most expensive effort — paragraph-level writing — on a line you will then have to tear up when the shape turns out wrong. The shape is cheap to change while it is still a list of figures; it is expensive to change once it is three pages of connected prose. So the order is inverted: settle the shape first in the cheapest possible medium (a sequence of figures and a one-page storyline), prove the shape holds (the reader test), and only then spend prose.

This is the suite through-line applied to writing: *make the cost match the real need.* The need at the start of writing is to get the argument's order and legibility right; that need is met by figures and a storyline, which cost an afternoon, not by prose, which costs weeks. Spending prose to discover that your argument's order is wrong is paying the high cost for a job the low cost does better.

---

## STAGE 0 — Figures first: the sequence is the skeleton (`figures-first-story-fixed`)

reckoning produced a pile of script-generated figures — more than the paper can hold. The first act of writing is not to write; it is to **spread every figure out and pick the six-to-ten the argument actually needs**, then **order them into a line.** That ordered line is the paper's skeleton, and the governing rule is **one figure per argument step.** A figure that does not advance the argument by one step is not in the paper, however pretty; a step in the argument that has no figure is a hole you find now, while it costs a figure to fill, not in review.

Six-to-ten is not arbitrary. Below six, the argument usually is not carrying its own weight — either the contribution is thin or you have not surfaced the evidence that proves it. Above ten, the reader cannot hold the line in their head, and the paper is almost always trying to make two arguments at once; the fix is to cut to the one argument the insight names and let the other figures go to an appendix or a second paper. The number forces the discipline of *one paper, one argument.*

A worked example, generic. Suppose a scheduling method whose contribution is that it exploits constraint slack. The figure line might be: (1) an overview figure of the method — the argument's "here is the idea"; (2) the headline benchmark table — "it beats SOTA"; (3) the performance-vs-tightness curve from ledger's Layer-3 generator — "and here is *why*: the advantage grows as slack shrinks"; (4) the ablation that removes the slack-exploiting component — "and *that* component is what does it"; (5) the real-instance result — "and it holds on the deployment partner's data"; (6) the failure-mode figure — "and here is where it stops working." Six figures, each one step, in an order a reader can walk. That sequence is the skeleton; everything else in the paper is connective tissue between these six.

### The one-sentence insight — cognitive, not procedural

With the figure line laid, write the one-page **storyline**: the **two or three claims** the paper makes, plus the single **ONE-SENTENCE INSIGHT.** The insight is the paper's soul, and the rule that decides whether you have it is sharp: it must be **cognitive, not procedural.** A procedural sentence describes what you did — "we propose method X." A cognitive sentence describes what you *understood* — "X works **because** we noticed Y." The first is a press release; the second is a contribution to knowledge. "We propose a slack-aware scheduler" is procedural. "Scheduling improves most when you spend search on the tightest constraints, because that is where the solution space actually narrows" is cognitive — it names the *why*, and the method is merely the consequence of having understood it.

The test is unforgiving and it is also a diagnostic on the prior work: **if you cannot write the one-sentence cognitive insight, the mechanism is not understood.** Not "the writing is hard" — the *understanding* is missing. The honest move when the sentence will not come is to go back to reckoning's mechanism stage and **add a probe** — run the experiment that isolates *why* the method works — not to paper over the gap with fluent prose that asserts a mechanism you have not demonstrated. Prose can make a missing insight *read* like a present one; it cannot make it present. A paper whose insight is procedural reads as competent and forgettable: a reviewer feels the absence even when they cannot name it — the experiments are fine, the writing is clean, and yet there is nothing to take away. The insight is what they take away.

### Outline to the subsection, then fill — and write the intro twice

Once the figure line and the insight are fixed, **outline to the subsection level before filling any text.** The outline is the skeleton extended down one level: section, subsection, and for each, the one figure or one claim it carries. Only when the outline is complete do you fill prose into it — and even then, the intro gets special handling.

**Write the INTRO TWICE.** Write a rough version *early* — before the body exists — for one purpose: to **force the story clear.** Writing the intro is the most ruthless test of whether the argument holds, because the intro has to state the gap, the insight, and the contribution in order, and if any of the three is mushy the rough intro exposes it immediately. That rough intro is scaffolding, not the final text. Then, once the *whole paper exists* and your understanding has moved — because writing the body always teaches you something about your own argument you did not know going in — **throw the rough intro away and rewrite it from scratch.** The final intro is written by a person who now understands the paper; the rough one was written by a person who only thought they did. Trying to edit the rough intro into the final one keeps the early, lesser understanding embedded in the most important page of the paper. Rewrite, do not patch.

---

## STAGE 0 — Reader-test the skeleton before you draft (`skeleton-reader-tested`)

This is the cheapest test in the entire publication process, and it is run *before a single paragraph of body prose is written.* Hand the **figure sequence — figures plus captions ONLY, no body text** — to someone who has not read the paper (a colleague outside the subfield, or a **fresh agent session** with no prior context), and ask one question: **restate the thesis.** What is this paper claiming?

The test has a binary outcome and it is decisive either way:

- **They can reconstruct the main claims from figures and captions alone.** The skeleton stands. The argument is legible in its cheapest form, which means it will be legible once prose connects the figures. Proceed to draft.
- **They cannot.** The argument is not yet legible — and you have learned this for the price of reading six captions, not for the price of a reviewer's rejection. **Fix the sequence or the captions first.** Either the figures are in the wrong order (the line does not walk), or a step is missing (there is a jump the reader cannot make), or the captions are not carrying their share (a caption that says "Results on benchmark X" instead of "Method beats SOTA by 14%, and the gap grows with problem size" is a wasted step). Do not write prose to paper over a sequence the captions cannot carry; prose will hide the break from you and leave it for the reviewer.

The reason this works is that **figures and captions are what a reviewer reads first** — most reviewers skim the figures before they read a word of body — so a paper whose argument is legible from the figure line alone is already most of the way to a reviewer who understands it. The reader test simulates the reviewer's first pass at the cheapest possible moment: before the prose that the test might have made you write exists. It is the figure-first analogue of every other firewall in the suite — test the argument in its cheap, falsifiable form before you commit the expensive artifact.

A note on using a fresh agent session as the reader. This is one of the agent's legitimate jobs (the full set is in [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md)): a clean session has no memory of your intent, so it cannot fill your gaps with what you *meant* — it can only react to what the captions *say*, which is exactly what a real reviewer does. Ask it to restate the thesis, not "is this good?" — "is it good?" invites the please-you answer; "restate what these figures claim" produces a concrete reconstruction you can check against the thesis you intended. Where its reconstruction diverges from your intent is the exact coordinate of a weak caption or a missing step.

### Copy-ready: the skeleton reader test

```
You are reading this paper's figures for the first time. You have NOT read the
body — there is none yet. I am giving you ONLY the ordered figure sequence and
each figure's caption.

Your task: from the figures and captions ALONE, restate this paper's THESIS.
Specifically:
  1. What is the paper's single main claim? (one sentence)
  2. What are the 2-3 supporting claims, in the order the figures make them?
  3. For each figure: what one argument step does it carry? If a figure's point
     is unclear from its caption, say so — name the figure and what's missing.
  4. Is there a JUMP — a place where the argument skips a step you can't make
     from the figures given? Name it.

Do NOT tell me whether the paper is good. Do NOT guess what I probably meant.
React only to what the captions actually say. Where you can't reconstruct a
step, that is the answer I need.
```

If the restatement matches the thesis you intended, the skeleton is reader-tested and the gate clears. If it does not, the divergence is your fix list — sequence or captions — before any body prose is written.

---

## STAGE 1 — The section templates: pour the existing argument into fixed shapes

Drafting is not invention; it is pouring the pieces the prior five steps produced into near-fixed section shapes. The shapes are conventions of the field, and using them is not a lack of originality — it is *letting the reviewer's trained reading reflexes work for you* instead of against you. A reviewer who finds the gap where the gap always is, and the contributions where the contributions always are, spends their attention on your argument rather than on hunting for its parts. Four templates carry the paper.

### The intro — five near-fixed beats

The introduction has five beats, in order, and they are near-fixed because the field reads for them in this sequence:

1. **Why the problem matters.** The stakes — who cares about this problem and why it is worth a paper. One or two paragraphs, concrete, not grandiose.
2. **Where existing methods got to.** The current frontier in brief — what the field can already do, fairly stated. This is not yet the gap; it is the setup that makes the gap land.
3. **The GAP — argued, where possible, with the original authors' OWN admitted limitation.** This is the beat that does the most work and the one most often done weakly. The strongest form of the gap is not *you* asserting the prior work falls short — that reads as self-serving — but the **original authors' own words admitting the limitation,** mined in prospect. When the paper that holds the frontier *says itself* "our approach does not handle the tight-constraint regime," you quote that, and **the literature argues your gap for you.** A gap the prior authors conceded is a gap no reviewer can wave away as your invention. (This is the direct payoff of prospect's mining discipline: the admitted-limitation quotes you collected then are the ammunition here.)
4. **The one-sentence core insight.** The cognitive insight from STAGE 0, stated plainly. **This is the intro's center of gravity** — everything before it is setup for it, everything after it is consequence of it. If a reader remembers one sentence from your paper, it is this one, and the intro is built so that it is the sentence they cannot miss.
5. **The contribution list.** What the paper delivers, as a list.

**Contributions are VERIFIABLE and map ONE-TO-ONE to a claim.** Each contribution is a thing a reviewer could in principle check — a stated, falsifiable deliverable — and each corresponds to exactly one claim the paper proves. "We propose a slack-aware scheduler and show it beats SOTA by 14% on the standard benchmark, with the advantage growing under tight constraints" is a contribution: verifiable, mapped to a claim. **"We ran extensive experiments" is NOT a contribution** — it is unverifiable (how extensive? showing what?) and maps to no claim. It is filler that signals the absence of a real contribution where a real one should be. The one-to-one discipline also keeps the paper honest: if you have a contribution with no claim behind it, you are over-claiming; if you have a claim with no contribution stated, you are under-selling proven work. The list and the claims are the same set, named twice.

### Related work — from the comparison table, grouped by theme

Related work is **generated from prospect's COMPARISON TABLE,** not written from scratch and not assembled by re-reading forty papers under deadline. The table already grouped the prior work; the section is that grouping rendered as prose. Two rules:

- **Group by THEME, not paper-by-paper.** A related-work section that walks one-paper-per-paragraph ("Smith did A. Jones did B. Lee did C.") is an annotated bibliography, not an argument — it makes the reader do the synthesis you should have done. Group the prior work into the **themes** the comparison table's columns already define (e.g., "exact methods," "learning-based heuristics," "decomposition approaches"), and write one paragraph per theme that *characterizes the group.*
- **End each paragraph with "the difference from us."** Every theme paragraph closes by stating how *your* work differs from that whole group — the column in the comparison table that is your contribution. This turns related work from a defensive survey into a *positioning argument*: each paragraph places a body of prior work and then plants your flag relative to it.

For **near-neighbors** — the one or two prior methods closest to yours, where a reviewer will most suspect insufficient novelty — handle each with **crucible's fixed difference template**: the structured statement of what the neighbor does, what you do, and the specific, defensible axis on which they differ. The near-neighbor is where novelty is won or lost; the difference template is what makes the distinction precise rather than hand-waved.

### Method — top-down, with a single running example

The method section is written **TOP-DOWN:** one paragraph of **intuition** and an **overview figure** *first*, then the formalization. The reader gets the shape of the idea — what it does and why it should work — before the notation arrives, so that when the formalization comes, every symbol lands in a structure the reader already holds. The opposite order — definitions and equations first, intuition last or never — forces the reader to hold meaningless notation in memory until the intuition finally explains it, which is how method sections lose their readers by the second page.

Thread a **single RUNNING EXAMPLE** through the whole method. Pick one concrete, small instance — one scheduling problem, one small graph, one worked input — and follow it through *every* step of the method: here is the input, here is what step one does to it, here is the intermediate state, here is the output. The running example roughly **halves the reader's comprehension cost,** because the abstract operation and its concrete effect are always on the page together; the reader never has to simulate the method in their head from the formal definition alone. One example, carried the whole way through — not a fresh example per subsection, which costs the reader a new setup each time.

### Experiments — organized BY CLAIM, not by experiment type

This is the template with the most leverage and the one most often gotten wrong. The experiments section is organized **BY CLAIM,** not by experiment type. The wrong organization groups experiments by *kind* — a "benchmark results" subsection, an "ablations" subsection, a "scalability" subsection — which scatters the evidence for any single claim across the whole section and forces the reviewer to reassemble your argument themselves. The right organization is **one subsection per claim,** and each subsection **opens with "this section validates claim X."** Inside it sit exactly the experiments — benchmark rows, ablation, sensitivity curve, whatever — that bear on *that claim,* drawn from wherever they live.

The payoff is structural and it is large: **a reviewer reading the experiments section by section automatically AUDITS your argument.** They read "this section validates claim 1," then the evidence for claim 1, and either it convinces them or it does not — and they move to claim 2 having rendered a verdict on claim 1. The section *is* the argument, walked claim by claim, with the evidence for each claim gathered in one place under a header that names what it is for. The reviewer is not hunting; they are auditing, in the order you built, and a clean audit is an acceptance.

This is **ledger's claim-evidence matrix projected into the paper** — name that lineage, because it is exact. The matrix in ledger paired each claim with the specific evidence that proves it and walled out everything that does not; the by-claim experiments section is that same matrix rendered as section structure. Each subsection is one row of the matrix: the claim in the header, its evidence in the body. If you built the matrix in ledger, the experiments section's skeleton already exists — you are projecting a table you have into a section structure, which is the suite's reframe (the paper already exists in pieces) holding once more.

---

## The agent's role at the skeleton-and-draft stage

The agent is the **means** here, never the author of the argument — and at this stage that boundary has two concrete edges worth naming (the full treatment, including the cardinal sin, is in [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md)).

The agent's legitimate jobs at skeleton and draft are real and high-value: it is the **fresh reader** for the skeleton reader test (a clean session with no memory of your intent is the ideal naive reviewer); it is the **polisher** that tightens the prose once you have written what to say; and it is the **outline filler** that drafts connective sentences between figures whose order and point *you* have already fixed. Each of these improves *how* the argument reads without deciding *what* the argument is.

The two things the agent must not be allowed to do at this stage are the two halves of the boundary. First, **it does not write the insight or the story.** The one-sentence cognitive insight is the paper's soul and it is taste and understanding made into a sentence — if the agent writes it, you have outsourced the one thing the paper is for, and you will not notice the insight is procedural-dressed-as-cognitive because the agent's version reads fluently. The story line — which claim leads, what order the argument runs — is taste, and taste is the human's. Second, and continuing into draft, **it does not write a sentence whose evidence it has not seen.** As you fill the experiments section, every number and every "experiments show" the agent helps draft traces to a results-store **run id** — an agent filling a fluent experiments paragraph will, helpfully, round a number or assert a result to make the paragraph complete, and a plausible invented number that enters the draft here is the same lethal accident the cardinal sin forbids. Command it to leave a marked gap where it lacks the run id, never a smooth guess; then you fill the gap from the store. The agent strings the prose; it does not source the evidence.

---

## What carries forward

Out of STAGE 0 you carry a **figure-first skeleton** — six-to-ten figures ordered into a line, one per argument step — and a **one-page storyline** fixing the two-or-three claims and the single cognitive one-sentence insight, with that whole spine **reader-tested** (figures and captions alone reconstruct the thesis) before any prose was spent. Out of STAGE 1 you carry a **drafted manuscript** built by template: a five-beat intro centered on the insight with verifiable one-to-one contributions, a related-work section grouped by theme from prospect's comparison table with the difference stated per group, a top-down method threaded by a single running example, and an experiments section organized by claim — ledger's matrix projected into section structure so the reviewer audits as they read. That draft is the input to STAGE 2 ([agent-and-the-three-redlines.md](agent-and-the-three-redlines.md)), where the agent vet makes it correct and legible and the run-id rule keeps every number honest, and then to the submission half ([submit-rebut-persist.md](submit-rebut-persist.md)). The skeleton you tested and the templates you filled are what make the vet a polish pass rather than a rescue: an argument that was legible in its captions and organized by its claims is most of the way to a reviewer who understands it.

---

**Cross-links:** [why-the-paper-already-exists.md](why-the-paper-already-exists.md) (the foundation — the paper exists in pieces, the four things the human keeps, and the cardinal sin whose draft-stage form is named above) · [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md) (STAGE 2 — the agent's legitimate jobs in full, the consistency vet and the reader test, and the three red lines including the run-id rule that the experiments draft must already obey) · [submit-rebut-persist.md](submit-rebut-persist.md) (STAGE 3-5 — where the drafted manuscript goes: venue fit, the repro package, the rebuttal, and the ladder) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 0 Skeleton, STAGE 1 Draft) · [../../reckoning/SKILL.md](../../reckoning/SKILL.md) (upstream — the script-generated figures spread into the sequence, and the mechanism stage you return to if the one-sentence insight will not come) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (upstream — the comparison table that becomes related work and the admitted-limitation quotes that argue the gap) · [../../crucible/SKILL.md](../../crucible/SKILL.md) (upstream — the difference template for near-neighbors in related work) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (upstream — the claim-evidence matrix projected into the by-claim experiments section).

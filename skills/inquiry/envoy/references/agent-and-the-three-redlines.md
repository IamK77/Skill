# The Agent and the Three Red Lines — agent-assisted writing on a short, bright leash (STAGE 2)

This reference is the depth behind **STAGE 2 — Vet** of the [../SKILL.md](../SKILL.md) flight plan. It governs the move from *a complete draft* to *a draft that is correct, legible, and honestly the author's* — the pass that runs before the paper goes out the door. It backs two checks: `evidence-traceable-no-invention` (the three red lines, the cardinal one first) and `manuscript-vetted-and-read-tested` (the consistency vet and the reader test). The framing the whole stage rests on:

> The agent is a powerful writing assistant on a short, bright leash. It does the labor that makes a paper read well and hang together; it does **not** decide what the paper claims, and it does **not** write a sentence whose evidence it never saw. Know exactly what is on each side of the leash before you let it touch the manuscript.

The earlier steps put the agent to work as miner, prototyper, operator, and reader. Writing is the step where its help is most seductive and its failure most expensive, because the output carries a person's name. So this stage is deliberately two-sided: a clear account of the agent's *legitimate, high-value* jobs, and three lines it does not cross.

---

## The legitimate, high-value jobs

These are real, and refusing them is its own mistake — the agent is genuinely good at exactly the labor a tired author is worst at. Three jobs, in rising order of value.

**Language polish and page-limit compression.** Tightening prose, smoothing the connective sentences, and — the one most worth handing over — **cutting to a hard page limit.** Compression under a fixed limit is a search problem the agent is good at and the author is bad at (the author is attached to every sentence; the agent is not), and it is squarely *means* work: it changes *how* the argument reads, never *what* the argument is. Hand it the over-length section and the limit; keep the judgment of which point may be cut for yourself.

**The consistency vet.** The mechanical sweep over a long document that the human eye reliably misses and the agent reliably catches: every **symbol defined before its first use**, **terminology uniform** across sections (one name per concept, not three), **citation format consistent**, and **figure and table numbers aligned with their in-text references** (every "see Figure 3" pointing at the figure it means, every figure referenced somewhere). Human attention on this degrades by page twenty; the agent's does not. This is the agent at its best — tireless attention to mechanical uniformity across a whole manuscript — and it catches a class of error that is individually trivial and collectively the difference between a clean read and a sloppy one.

**The reader test — the highest-value use of all.** Open a **clean session, give it only the paper** (no prior context, no conversation history, none of the shared understanding you and the paper already have), and ask it to restate the claims, the method's flow, and each figure's one information point. Every place the restatement goes wrong is the **exact coordinate of where you wrote unclearly.** This is worth ten times asking the agent "is this good?": "is it good?" invites the please-you answer and you get a yes; "restate what this paper claims" produces a concrete, located failure you can fix. The reader test turns the agent's freshness — the very thing that makes it a poor judge of importance — into a measuring instrument. It is the direct continuation of reckoning's clean-session red-team, pointed now at legibility instead of validity: a fresh reader who cannot reconstruct your thesis is the cheapest possible warning that a real reviewer won't either.

A note on what these three share: each is labor in service of an argument the human already owns. None of them is the argument. That is the line the three red lines below make absolute.

---

## The three red lines

### Red line 1 — the argument is written and owned by the human

The **story line, the claim wording, and the contribution statements are written and owned by you.** They are the paper's soul and its locus of responsibility — the one-sentence insight, the exact strength of each claim ("improves" vs "tends to improve" vs "improves on the low-treewidth class"), the contribution list that the byline warrants. The agent may **suggest** phrasings, and a suggested phrasing is fine to adopt once *you* have judged it says what you mean. What the agent may not do is **decide what is claimed** — because the claim wording is `spec` (what counts as success) and the signature on it is `responsibility`, two of the four things the suite reserves for the human from the start. A claim the agent wrote and you waved through is a claim no one actually decided to make. The author writes the sentences that carry the warranty; the agent writes the sentences around them.

### Red line 2 — the agent never writes a sentence whose evidence it never saw

This is the **cardinal line**, and it is mechanical and absolute. The failure it forbids is the one the foundation names: an agent writing fluent prose around results will, without malice, fill a gap with a **plausible-looking number** or an unsupported *"experiments show that X"* — because it cannot feel the difference between a number it read and one it manufactured. A fabricated number that slips into a submitted manuscript is among the most damaging accidents there is: it survives review precisely because it is plausible, and it surfaces — if it surfaces — as a correction or a retraction with your name on it. The rule:

> Every number, and every "experiments show / results indicate" in the prose, traces to a specific run in the results store — a **RUN ID**. If a sentence's evidence cannot be named by a run id, the sentence does not go in.

The enforcement is concrete, not aspirational. The agent may only cite a number it can **point to** — in the results store, or in a table forge's one-command pipeline generated from it — never one typed from memory or "reconstructed" from context. A workable discipline: numbers enter the prose by reference to a generated table or query, and the vet pass (below) flags any quantitative sentence whose number does not appear in the results store. This is not a new rule; it is the **writing-side continuation of forge's provenance and reckoning's audit-not-celebrate** — the run-id chain that began as engineering hygiene is what finally lets you sign the paper. There is no exception for a number that "must be about right" or a claim that "is obviously true": the run id is the only currency the prose accepts.

### Red line 3 — check the venue's LLM policy against the current official wording

Before the agent touches the manuscript, check the **target venue's LLM-use policy** — and check the **current official wording**, not your memory or your impression of it. These policies differ widely across venues and **keep changing**; most permit language polishing but **require disclosure**, and some scenarios are stricter (limits on generated text, on generated figures, on what counts as authorship). Look up the venue's author guidelines directly (a web fetch of the current call-for-papers or author instructions), read what it says *now*, and follow it — including any required disclosure statement. Guessing here is a real risk: a policy you remember from last year, or from a sibling venue, can be wrong in a way that is a compliance problem at exactly the wrong moment. This is the one red line that is about the outside world rather than the evidence, and it is checked the same way: against the source, not from memory.

---

## The pre-submission vet pass

The two checks of this stage compose into a single pass the manuscript makes **before submission**: the **consistency vet** and the **reader test**, both run by the agent, both with their judgments reserved for you.

- Run the **consistency vet** over the full draft: symbols defined before use, terminology unified, citations consistent, figure/table numbers aligned with their references — and, folded in, the **run-id audit**: every quantitative sentence's number is one the results store can produce. The vet *finds* the mechanical errors and the untraceable numbers; *you* decide what a flagged inconsistency means (a typo, or a real disagreement between the prose and the data).
- Run the **reader test** with a clean session: restate the claims, the method flow, each figure's one point. The test *locates* the unclear spots; *you* decide how to rewrite them (the fix is authorial, the diagnosis is the agent's).

Both are squarely the agent's labor — tireless mechanical attention and fresh-eyes restatement, the two things it does better than a tired author. Neither is a judgment: the vet does not decide whether the paper is sound, and the reader test does not decide whether it is good. They make the manuscript *correct and legible*; whether it is *right* was settled in the first five steps, and whether it is *worth publishing* is the author's taste. Pass both, and the paper is ready to leave the door honest — every claim the author's, every number traceable, every reference aligned, and every unclear sentence either fixed or knowingly kept.

---

**Cross-links:** [why-the-paper-already-exists.md](why-the-paper-already-exists.md) (the foundation — the human/agent boundary, the four reserved things, and the cardinal sin this stage enforces) · [skeleton-and-sections.md](skeleton-and-sections.md) (STAGE 0-1 — the draft this stage vets) · [submit-rebut-persist.md](submit-rebut-persist.md) (STAGE 3-5 — where the venue's LLM policy and the repro package are finalized, and where the run-id chain is re-verified at camera-ready) · [../SKILL.md](../SKILL.md) (the gated flight plan) · [../../forge/SKILL.md](../../forge/SKILL.md) (upstream — the results store and run ids the cardinal line traces to) · [../../reckoning/SKILL.md](../../reckoning/SKILL.md) (upstream — the clean-session red-team the reader test continues, and the audit-not-celebrate ethos the run-id rule carries into the prose).

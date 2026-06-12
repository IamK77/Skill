# Why the Paper Already Exists — the foundation (load at STAGE 0)

This reference is the foundation behind the whole [../SKILL.md](../SKILL.md) flight plan. It is loaded **first**, before any stage, because every move in skeleton, draft, vet, submit, rebuttal, and persist is derived from the four facts stated here: the paper already exists in pieces, this is the step with the sharpest human/agent boundary, the cardinal sin that one boundary forbids, and the single thing all the discipline across all six research steps guards. The downstream stages are the application; this is the model they apply. Read it once, in full, and the stages stop being a manual to memorize and become consequences you can re-derive.

The governing fact, restated because every move below is judged against it:

> If the first five steps were done with discipline, the paper is not a blank page — its argument, its experiments section, its discussion, and its related work already exist as artifacts. Writing is stringing an existing argument into prose. And this is the step where the human keeps the most and the agent must be held the tightest, because here the human's four reserved things all come due at once and the agent's one lethal failure mode is at its most tempting.

---

## The paper already exists in pieces

The single mental shift this whole step hangs on: **if the prior five skills actually ran, the manuscript's hard parts are already written — as artifacts, not prose.** The mapping is exact, and it is the reason writing is far less work than people fear:

| The paper section | Already exists as | Produced by |
|---|---|---|
| the argument (what we claim, why it's true) | the **CLAIMS** with their pre-written verdicts | crucible (the claims), ledger (the verdicts) |
| the experiments section | the **FROZEN PROTOCOL** and its confirmation runs | ledger / forge |
| the discussion | the **MECHANISM PROBES** (why it works, not just that it works) | reckoning |
| related work | the **DIFFERENCE / COMPARISON TABLE** | prospect (the table), crucible (the per-neighbor difference) |

Read that table the right way: it is not a metaphor that the pieces "resemble" the sections. The claim-evidence matrix *is* the spine of the experiments chapter; the comparison table *is* the related-work section grouped by theme; the mechanism probes *are* the discussion's "why". Writing is the act of **stringing these existing pieces into prose** — choosing the order, supplying the connective sentences, and fixing the one-sentence insight that makes the line legible. That is real work, but it is *legibility and defense* work, not *composition* work. The blank-page terror people carry into "writing the paper" is misplaced: the argument was settled in steps one through five; you are transcribing and ordering it, not inventing it.

**The precondition, stated sharply because the reframe is false without it.** This holds *only* if prospect, crucible, ledger, forge, and reckoning actually ran with discipline. If you skipped the difference table, you have no related work to string — you have to do prospect's work now, under deadline, which is the worst time. If the protocol was never frozen, the experiments section has no spine and you are back to post-hoc story-fitting. If there were no mechanism probes, the discussion is hand-waving and the one-sentence insight (below) cannot be written because the mechanism isn't understood. The reframe is a *reward* for the prior discipline, not a free pass that lets you write a paper the discipline was never done for. When a piece is genuinely missing, the honest move is to go back and produce it — not to paper over the gap with fluent prose, which only hides the hole from you and exposes it to the reviewer.

---

## The sharpest human/agent boundary in the suite

Across the **whole** suite the human keeps exactly four things, and only four. Everything else is discipline and the agent. Name them, because envoy is where they stop being abstract:

- **TASTE** — what to work on. (Set in prospect: which gap is worth a paper.)
- **SPEC** — what counts as success. (Set in crucible and ledger: the claims and their pre-written verdicts.)
- **JUDGMENT** — what to bet on, what to abandon, how to fight a rebuttal. (Exercised everywhere: the abandonment condition, the firewall side-call, the rebuttal strategy.)
- **RESPONSIBILITY** — the signature on the claims and their proofs. (Borne at submission: the byline is a personal warranty that every number is real.)

In the earlier steps these four come due **one at a time** — taste in prospect, spec in crucible/ledger, judgment scattered across the abandonment calls and firewall verdicts. **envoy is the step where all four come due AT ONCE**, which is exactly why the human/agent line is sharpest here:

| The human's reserved thing | Where it lands in envoy |
|---|---|
| TASTE | the **story** — which insight is the soul of the paper, what order the argument runs in |
| SPEC | the **contribution** — the claim wording, the one-to-one contribution list |
| JUDGMENT | the **rebuttal strategy** — whether a reviewer is wrong or confused, which one is worth your limited words, what to add |
| RESPONSIBILITY | the **byline** — the signature on the claims and their proofs |

Everything *outside* those four is the agent's to do under the human's hand. That is not a hedge; it is the operating principle of the step. The story, the contribution, the rebuttal judgment, and the signature are irreducibly the author's because they are the four things the suite has reserved for the human from the start. The agent is the **means** that carries the rest.

---

## The agent's legitimate jobs (preview)

The agent is a powerful writing assistant on a short, bright leash. Its high-value, legitimate jobs here are real, and detailed in [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md); this is the preview that the boundary above makes sense of:

- **Language polish and page-limit compression.** Tightening prose, cutting to the page limit, smoothing the connective sentences. The agent is good at this and it is squarely the means: it improves *how* the argument reads without deciding *what* the argument is.
- **The consistency vet.** The mechanical sweep the human eye reliably misses and the agent reliably catches: every symbol defined before its first use, terminology uniform across sections, citation format consistent, figure and table numbers aligned with their in-text references. This is the agent at its best — tireless attention to mechanical uniformity over a long document, which human attention degrades on by page twenty.
- **The reader test.** Give a **clean session only the paper** — no prior context, no conversation history — and ask it to restate the claims, the method's flow, and each figure's one point. Every place the restatement goes wrong is the **exact coordinate** of where you wrote unclearly. This is worth ten times asking the agent "is this good?": "is it good?" invites the please-you answer (it will say yes), while "restate what this paper claims" produces a concrete failure you can locate and fix. The reader test turns the agent's freshness into a measuring instrument instead of a flattery surface.
- **Running rebuttal-window experiments.** Operating forge's one-command regeneration pipeline to add a baseline, an ablation, or a scale tier during review (below, and in [submit-rebut-persist.md](submit-rebut-persist.md)).

Each of these is *means* work — labor in service of an argument the human owns. None of them is the argument itself.

---

## The cardinal sin — no sentence whose evidence the agent never saw

State this sharply, because it is the single most lethal accident in the whole step: **the agent must never write a sentence whose evidence it has not seen.** An agent asked to write fluent prose around results will, helpfully and without malice, invent a plausible-looking number to fill a gap, or write "experiments show that X" where no experiment showed X — because a fluent, complete-looking sentence is what pleases you, and the agent has no way to feel the difference between a number it read and a number it manufactured. A fabricated number that slips into a submitted manuscript is among the **most damaging accidents there is**: it survives review precisely because it is plausible, and it surfaces — if it surfaces — as a correction or a retraction with your name on it.

The rule that forbids it is mechanical and absolute:

> Every number, and every "experiments show / results indicate" in the prose, traces to a specific run in the results store — a **RUN ID**. If a sentence's evidence cannot be named by a run id, the sentence does not go in.

This is not a new rule; it is the **writing-side continuation of forge's provenance discipline and reckoning's audit**. forge stamped every run with a replayable id so the number could be traced; reckoning audited the numbers rather than celebrating them; envoy carries that same chain into the prose, so that the paper's every quantitative sentence is a pointer back to a run that actually happened. The traceability that began as engineering hygiene ends as the thing that lets you sign the paper. There is no exception for a number that "must be about right" or a claim that "is obviously true" — the run id is the only currency the prose accepts.

---

## The agent-era change to rebuttal (preview)

Historically the rebuttal window allowed **almost no new experiments**: there was no time to re-run a pipeline, re-tune a baseline, and regenerate a figure inside the days a rebuttal allows, so the standard advice was to argue from the experiments you already had and promise the rest "in the final version." That constraint is now substantially relaxed, and it changes rebuttal strategy materially.

forge's **one-command-regeneration pipeline**, operated by an agent, makes **补实验** (the act of adding an experiment in the rebuttal window — a missing baseline, an ablation, a scale tier) realistic within the days a rebuttal allows. When a reviewer says "you didn't compare against baseline B" or "this needs the ablation that isolates component X," the honest and most persuasive response is no longer a promise — it is the number itself. The rule that follows, *where the venue's author-response policy permits a new experiment* (some venues forbid it, some have no response phase — checked word-for-word like the anonymity policy): **if you can add it, actually add the number.** A produced result beats an argument about a result every time, and the pipeline plus an agent operator now make the produced result reachable in the window. This is the one place the agent's means-work changes what is strategically possible; the strategy itself — which reviewer is worth the experiment, whether the number will help or hurt — stays the human's judgment. The detail is in [submit-rebut-persist.md](submit-rebut-persist.md).

---

## The meta-thesis the whole suite guards

End on the thing all the discipline — across all six steps — exists to prevent. State it plainly, because envoy is where it bites hardest:

> All the discipline across all six steps prevents one thing: **the you who SAW THE RESULTS getting to deceive the you who MADE THE DECISIONS.**

Every guard in the suite is an instance of this. prospect's documented-death discipline stops you from rounding a near-neighbor's prior work up into your novelty. ledger's firewall stops the you who saw a striking chaos number from feeding it to the you deciding what to claim. forge's provenance stops you from quietly losing the run that contradicted you. They all defend the same boundary: the part of you that has seen the data must not be allowed to quietly improve the story for the part of you that decides and signs.

**Writing is where that temptation is strongest.** Here you have seen all the results, and the prose is the one place where softening a claim by a word, or improving the story one notch past what the evidence supports, costs nothing in the moment and reads better on the page. A claim you meant sharply becomes "tends to" because the clustered instance class was a little weaker; a one-class win becomes a general win because the general sentence flows better. The **run-id rule is the final guard** against exactly this: it forces every quantitative sentence back to a run that happened, so the you who is writing cannot drift past the you who ran the experiments without the drift becoming a missing run id you can see.

---

## Map is not the territory — and why the four things stay in your hand

The reason the argument, the contribution, and the signature stay in the human's hand reduces to one fact about the agent: **the map is not the territory, and the agent lives entirely in the map.** It will write a fluent sentence around a number it never saw. It will soften a claim you meant sharply, because the softer sentence reads more safely and pleases you more. It will "improve" the story past what the evidence supports, because a cleaner story is a better-looking artifact and the artifact is all it optimizes. And it will do all of this **feeling none of the future correction, none of the retraction, none of the reputational cost** — because those land on a person, in a territory the agent cannot see, six months after the fluent sentence was written. The agent optimizes the readable surface; the consequences fall on the human who signed. That gap is precisely why taste, spec, judgment, and responsibility cannot be delegated: they are the four things whose cost lands in the territory, and only the person standing in the territory can weigh them.

**envoy closes the suite.** There is no seventh skill. When the paper lands — submitted, defended, and through the gauntlet — the research is done, and the next project re-enters at [prospect](../../prospect/SKILL.md). The discipline that began with finding a documented gap ends with a signed paper whose every number still traces, bit for bit, to a run that happened. That closed loop — gap to signature, with the run-id chain intact through all six steps — is the whole point of the suite, and this step is where it is sealed.

---

**Cross-links:** [skeleton-and-sections.md](skeleton-and-sections.md) (STAGE 0-1 — the figure-first skeleton, the one-sentence insight, and the section templates that string the existing pieces into prose) · [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md) (STAGE 2 — the agent's legitimate jobs in full and the three red lines, with the cardinal sin and the run-id rule as the bright one) · [submit-rebut-persist.md](submit-rebut-persist.md) (STAGE 3-5 — venue fit, the repro package, the 48-hour rule and four-beat rebuttal with the now-feasible 补实验, and the resubmission ladder) · [../SKILL.md](../SKILL.md) (the gated flight plan this foundation makes derivable) · [../../crucible/SKILL.md](../../crucible/SKILL.md) and [../../ledger/SKILL.md](../../ledger/SKILL.md) (upstream — the claims and pre-written verdicts that become the paper's argument) · [../../forge/SKILL.md](../../forge/SKILL.md) (upstream — the provenance and one-command regeneration the run-id rule and the rebuttal change both rely on) · [../../reckoning/SKILL.md](../../reckoning/SKILL.md) (upstream — the mechanism probes that become the discussion and the audit-not-celebrate ethos the run-id rule continues) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (upstream — the comparison table that becomes related work, and the re-entry point when this paper lands).

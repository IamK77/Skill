---
name: envoy
description: >
  The writing-submission-rebuttal lens: string the argument the first five steps
  already built into a manuscript, carry it to the right venue, defend it through
  review, and persist up the resubmission ladder — for any field where you run
  experiments to publish (machine learning, combinatorial optimization, operations
  research, systems, scheduling). Use when you are writing the paper, choosing a
  venue, drafting a rebuttal, or deciding where to resubmit after a rejection. The
  one shift: if the prior discipline held, the paper ALREADY EXISTS IN PIECES (claims
  = the argument, protocol = the experiments section, mechanism probes = the
  discussion, the comparison table = related work) — writing is stringing an existing
  argument into prose, not composing from scratch. And this is the step with the
  SHARPEST human/agent boundary: the human keeps the story, the claim wording, the
  contribution, the venue taste, the rebuttal judgment, and the signature; the agent
  polishes, checks consistency, reader-tests, and (the agent era's one real change to
  rebuttal) runs the new experiments a one-command-regeneration pipeline now makes
  feasible inside the rebuttal window. The cardinal sin: the agent writing a sentence
  whose evidence it never saw — every number must trace to a run id; and the venue's
  current LLM-use policy is checked and followed, not guessed. Triggers on
  "write the paper / write up", "intro / related work / experiments section", "make
  the figures into a paper", "which venue / where should I submit", "write a rebuttal
  / respond to reviewers", "the paper got rejected / where to resubmit", "camera-ready",
  "reproduction package / anonymize". Installs the figure-first skeleton and the
  one-sentence insight, the section templates (five-beat intro, claim-organized
  experiments), the three red lines on agent-assisted writing, venue-fit selection and
  deadline back-planning, the 48-hour rule and four-beat rebuttal with the now-feasible
  "actually add the number", and the revise-before-resubmit ladder. The agent is the
  MEANS (the polisher, the consistency checker, the reader-tester, the rebuttal-experiment
  operator), never the author of the argument; you keep four things — taste, spec,
  judgment, and the signature on the claims.
argument-hint: "[the analyzed results/paper to write up, or the writing/venue/rebuttal problem you're stuck on]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# envoy

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The analysis is settled; the claims have verdicts. `envoy` is the lens you hold over the **paper** — the step that carries the finished work out to its community, defends it before the court of peers, and keeps going up the ladder until it lands. It is the sixth and last skill of the `inquiry` suite: it owns step six of doing computational research — *writing the paper, submitting it, defending it through review, and resubmitting after a rejection.* It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — the paper already exists, and this is the step the human owns most.** If the first five steps were done with discipline, the paper is not a blank page: the **claims are its argument**, the **frozen protocol is its experiments section**, the **mechanism probes are its discussion**, the **comparison table is its related work**. Writing is *stringing an existing argument into prose* — far less work than most people fear. And precisely because the raw material is done, the remaining work is the most *human* in the whole pipeline: the story line, the claim wording, the contribution, the choice of venue, the judgment in a rebuttal, and the **signature on the claims** are all irreducibly yours. The arc is: *lay the figure-first skeleton → draft by template → vet for evidence and legibility → submit to the right venue → rebut → persist up the ladder.*

**The agent is the means, not the author of the argument — and here the line is bright.** The agent's legitimate, high-value jobs are real: **language polish and page-limit compression**, the **consistency vet** (symbols defined before use, terminology unified, figure numbers aligned with their references — the mechanical errors the human eye misses and the agent almost always catches), the **reader test** (a clean session given only the paper, asked to restate the claims and each figure's point — its failures are the exact coordinates of where you wrote unclearly), and the agent era's one real change to rebuttal: **running the new experiments** that forge's one-command regeneration now makes feasible in days. But the **cardinal sin** is sharp and absolute: *the agent must never write a sentence whose evidence it has not seen* — every number, every "experiments show", traces to a results-store **run id**, because an agent helpfully inventing a plausible number that slips into the text is among the most lethal submission accidents there is.

**What you cannot delegate — four things, and they are the whole point.** Across the entire suite the human keeps exactly four: **taste** (what to work on), **spec** (what counts as success), **judgment** (what to bet on, what to abandon, how to fight a rebuttal), and **responsibility** (the signature on the claims and their proofs). `envoy` is where all four come due at once — the story is taste, the contribution is spec, the rebuttal strategy is judgment, the byline is responsibility. Everything else is discipline and the agent. And all of that discipline guards a single thing: *the you who saw the results must not get to deceive the you who made the decisions.*

**What "done" looks like — out the door and through the gauntlet, not "the draft is finished".** The step is over when the paper is **submitted**, the **reproduction package is finalized** (anonymized, licensed, smoke-tested clean), the **rebuttal is fought**, and — the common outcome — after a rejection the paper is **revised and resubmitted one rung down the ladder**, or, on acceptance, the **camera-ready checklist** is closed. "The draft is finished" is not the terminus; a paper that has run the gauntlet is.

**Speak the user's language.** Almost everything here is the user's to own — which insight is the soul of the paper, whether a reviewer is wrong or merely confused, which venue is the right community, whether to spend rebuttal words on a given reviewer. Read their field fluency and gloss a term on first use (the *one-sentence insight*, the *figure-first skeleton*, *claim-organized experiments*, the *48-hour rule*, the *resubmission ladder*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared — and the paper carries their name, not yours.

**Read [references/why-the-paper-already-exists.md](references/why-the-paper-already-exists.md) first** — the must-be-told foundation: why the paper exists in pieces and writing is stringing, the sharpest human/agent boundary and the four things the human keeps, the cardinal sin (no unseen-evidence sentence; every number to a run id), the agent-era change to rebuttal, and the one thing all the discipline guards. It is the key that makes every stage below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-the-paper-already-exists.md](references/why-the-paper-already-exists.md)** — the foundation: the paper-in-pieces reframe, the human/agent boundary and the four things the human keeps (taste, spec, judgment, responsibility), the cardinal sin and the run-id traceability rule, the agent-era rebuttal change, and the deceive-yourself thesis the whole suite guards against. Load at STAGE 0.
- [references/skeleton-and-sections.md](references/skeleton-and-sections.md) — building the manuscript: the figure-first skeleton, the one-page storyline and the cognitive one-sentence insight, reader-testing the skeleton, intro-written-twice, and the section templates (five-beat intro, verifiable contributions, related-work-from-the-table, top-down method with a running example, experiments organized by claim). Load at STAGE 0-1.
- [references/agent-and-the-three-redlines.md](references/agent-and-the-three-redlines.md) — agent-assisted writing done right: the legitimate uses (polish, the consistency vet, the reader test), the three red lines (human owns the argument; no unseen-evidence sentence / every number to a run id; check the venue's current LLM policy), and the pre-submission vet pass. Load at STAGE 2.
- [references/submit-rebut-persist.md](references/submit-rebut-persist.md) — out into the world: venue fit over rank (CS-conference vs OR-journal), deadline back-planning and arXiv/anonymity, the repro package finalized and anonymized; the 48-hour rule and the four-beat rebuttal with the now-feasible added experiment; and the revise-before-resubmit ladder plus the camera-ready checklist. Load at STAGE 3-5.

> **The pipeline is one arc.** Six stages — skeleton · draft · vet · submit · rebuttal · persist — carry an existing argument from a pile of figures to a paper that has run the gauntlet. Skeleton and draft string the pieces into prose; vet makes it correct and legible and keeps the agent honest; submit, rebuttal, and persist carry it through the court of peers. `envoy` gates all six below.

---

## STAGE 0 — Skeleton (figures first, story fixed)

Open **[references/why-the-paper-already-exists.md](references/why-the-paper-already-exists.md)**, then **[references/skeleton-and-sections.md](references/skeleton-and-sections.md)**. Build the spine before you write a paragraph.

- **Lay the figure-first skeleton and fix the one-sentence insight.** Don't write top-to-bottom from page one. Spread reckoning's figures, pick the **six-to-ten the argument needs**, and order them into a line — that sequence *is* the skeleton, one figure per argument step. Then write the one-page **storyline**: the two or three claims plus the single **one-sentence insight**. That insight is the paper's soul and it is **cognitive, not procedural** — not "we propose X" but "X works *because we noticed Y*". If you can't write that sentence, the mechanism isn't understood; go back to reckoning's mechanism stage and add a probe — don't paper over it. (Plan to write the intro **twice**: a rough version now, a from-scratch rewrite once the whole paper exists.)
- **Reader-test the skeleton before drafting.** Hand the figure sequence — **figures and captions only, no body** — to someone who hasn't read the paper, or a fresh agent session, and ask them to restate the thesis. If they can reconstruct the claims from figures and captions alone, the skeleton holds. If not, the argument isn't legible yet — fix the sequence or the captions *now*, before prose buries the problem.

### GATE — clear before DRAFT
1. `checklist check skeleton figures-first-story-fixed`
2. `checklist check skeleton skeleton-reader-tested`
3. `checklist verify skeleton`

---

## STAGE 1 — Draft (fill the templates, organize by claim)

Open **[references/skeleton-and-sections.md](references/skeleton-and-sections.md)** (the section-templates half). Fill the existing argument into the near-fixed shapes.

- **Write the five-beat intro and disciplined contributions.** The intro's five beats: **(1)** why the problem matters; **(2)** where existing methods got to; **(3)** the **gap** — stated where possible with the *original authors' own admitted limitation* (from prospect), so the literature argues it for you; **(4)** the one-sentence insight; **(5)** the contribution list. Every contribution is **verifiable and one-to-one with a claim** — "we ran extensive experiments" is not a contribution.
- **Organize the body by claim, with a running example.** Related work comes from prospect's **comparison table**: grouped by *theme*, not paper-by-paper, each paragraph ending in "the difference from us" (near-neighbors via crucible's difference template). Method is **top-down** — intuition and an overview figure, then formalization — threading a single **running example** through the whole method (halving comprehension cost). And the **Experiments section is organized BY CLAIM**, not by experiment type: each subsection opens "this section validates claim X", so a reviewer reading section by section automatically audits your argument. This is ledger's claim-evidence matrix projected into the paper.

### GATE — clear before VET
1. `checklist check draft intro-and-contributions`
2. `checklist check draft body-organized-by-claim`
3. `checklist verify draft`

---

## STAGE 2 — Vet (keep the agent honest; make it legible)

Open **[references/agent-and-the-three-redlines.md](references/agent-and-the-three-redlines.md)**. The agent is a powerful writing assistant on a short, bright leash.

- **Hold the three red lines — the cardinal one first.** The agent **never writes a sentence whose evidence it hasn't seen**: every number and every "experiments show" traces to a results-store **run id** (an invented-but-plausible number slipping into the text is a lethal accident). The **story, claim wording, and contributions are written and owned by you** — the paper's soul and your responsibility. And the target venue's **LLM-use policy** is checked against the *current* official wording (they differ and keep changing; most permit polishing with disclosure, some are stricter) and followed, not guessed.
- **Run the agent vet and the reader test.** The **vet** is the mechanical sweep the human eye misses: every symbol defined before use, terminology uniform, citation format consistent, figure/table numbers aligned with their in-text references. The **reader test** is worth ten times "is this good?": a **clean session given only the paper**, asked to restate the claims, the method's flow, and each figure's one point — every place the restatement goes wrong is the exact coordinate of unclear writing. (Polishing and page-limit compression are the agent's too; the judgments above are not.)

### GATE — clear before SUBMIT
1. `checklist check vet evidence-traceable-no-invention`
2. `checklist check vet manuscript-vetted-and-read-tested`
3. `checklist verify vet`

---

## STAGE 3 — Submit (the right venue, on time, with the package)

Open **[references/submit-rebut-persist.md](references/submit-rebut-persist.md)** (the submission half). Aim at your community, back-plan from the deadline, and finalize the package.

- **Choose the venue by fit over rank.** Look at where the papers you **cite most** are published — that is your conversation community, the pool where a reviewer can understand you. Choose with the field's structure in mind: **CS is predominantly conference-led** (fixed deadlines, three-to-six-month cycles, hard page limits — though subfields like theory and the ML journals JMLR/TMLR publish in journals); **OR is predominantly journal-led** (OR, Management Science, INFORMS Journal on Computing — no deadline, year-scale cycles, room for heavy theory-plus-experiment). Cross-work can go either way; the tiebreaker is which side's language your **core contribution** speaks.
- **Back-plan the timing and finalize the repro package.** For a conference, work backward: full draft **four weeks out**, co-author internal review **two weeks out**, paper frozen (changes only, no additions) **one week out** — so writing starts **at least six weeks** before the deadline. Check arXiv-early **word-for-word** against the venue's anonymity policy. Finalize forge's `repro/` package now: **anonymized** (author paths, institution, tokens removed — a scan to hand the agent), a **license** added, and a **clean-environment smoke test** re-run so "works on my machine" dies before a reviewer hits it.

### GATE — clear before REBUTTAL
1. `checklist check submit venue-fit-over-rank`
2. `checklist check submit timing-and-repro-finalized`
3. `checklist verify submit`

---

## STAGE 4 — Rebuttal (wait two days, classify, then answer with evidence)

Open **[references/submit-rebut-persist.md](references/submit-rebut-persist.md)** (the rebuttal half). The first read is not a decision input.

- **Apply the 48-hour rule and classify every comment.** The first read of reviews produces an emotional response (anger plus feeling wronged) that is **not admissible** as input to any decision — read once, wait two days, read again; half the apparent malice is misunderstanding. Then classify and set a per-class strategy: **misunderstanding** (a *writing* problem — point to the text, apologize for the phrasing, give the fix); **needs-an-experiment** (next bullet); **fundamental disagreement** (polite but firm, cite evidence not emotion); **reviewer-is-wrong** (most dangerous, they hold a vote — give them a ladder: "an easy point to confuse; we've clarified in Section X", packaging "you're wrong" as "we wrote it unclearly").
- **Answer in four beats, and actually add the number.** Each response: **restate the concern** (prove you understood) → **respond** → **evidence** (a number or a precise location) → **a concrete revision promise** (to the section, never one you can't keep). The agent-era change: forge's one-command regeneration plus an agent operator make adding a baseline, an ablation, or a scale tier realistic **within days** — so, **where the venue's author-response policy permits a new experiment** (checked word-for-word, like the anonymity policy — some venues forbid it, some have no rebuttal phase), **if you can add it, actually add the number**, the most persuasive response there is. Allocate limited words to the **borderline reviewer who clearly read it** (the extremes rarely move), and have a clean agent session play that reviewer and rehearse the counter-attack.

### GATE — clear before PERSIST
1. `checklist check rebuttal comments-classified-48h`
2. `checklist check rebuttal responses-four-beat-evidence`
3. `checklist verify rebuttal`

---

## STAGE 5 — Persist (revise, ladder, or land)

Open **[references/submit-rebut-persist.md](references/submit-rebut-persist.md)** (the resubmission half). A rejection is data and free consultation, not a verdict on you.

- **Revise before you resubmit; ladder, never blast.** File **all reviews into the 历程** verbatim — a rejection is free deep consultation from domain experts. Then the iron rule: **revise the main issues before the next venue, never fire the identical paper onward** — the field is small and the same paper hitting the same reviewer is reputation damage. Plan a **two-or-three-tier ladder** in advance (ideal → same-tier backup → safe option); after each rejection, fix per the reviews and drop one rung, so the worst case is **monotonically rising quality**. One or two rejections before acceptance is common and expected, not failure.
- **On acceptance, run the camera-ready checklist.** This is where careless final errors enter: **acknowledgments and funding numbers** added, the paper **de-anonymized** (every anonymization undone), the **final numbers re-verified against the results store** one last time (manuscript and single source of truth must still agree after the rebuttal edits), and the **arXiv version synced**. This closes the loop forge opened: every number in the published paper still traces, bit-for-bit, to a run id.

### FINAL GATE — the paper has run the gauntlet
1. `checklist check persist revise-before-resubmit`
2. `checklist check persist camera-ready-checklist`
3. `checklist verify persist`
4. `checklist show` — confirm all **six** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`envoy` is the **writing-submission-rebuttal lens**, held over a project once the analysis is settled. Its six stages are one arc against one enemy — **a finished result that never lands, because it was written unclearly, aimed at the wrong room, defended badly, or abandoned at the first rejection.** Skeleton (0) builds the spine from the figures and fixes the one-sentence insight; draft (1) strings the existing argument into the section templates, organized by claim; vet (2) keeps the agent honest (every number to a run id) and makes the prose legible; submit (3) aims at the community by fit and finalizes the package; rebuttal (4) waits out the anger, classifies, and answers with evidence and — newly feasible — added numbers; persist (5) revises and ladders rather than blasting or quitting. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: the paper already exists in pieces, so spend the effort on the argument's *legibility* and *defense*, not on composition, and keep the four human things (taste, spec, judgment, responsibility) in human hands.

It pairs with its siblings without duplicating them, and it closes the suite. Inside `inquiry`, `envoy` owns step six — *write, submit, defend, persist*; it takes from reckoning a set of settled claims and script-generated figures (the argument and the skeleton, already built), it carries forward forge's results store so every number in the prose and every rebuttal experiment still ties to a run id, and it draws on prospect's comparison table for related work and crucible's difference template for novelty. There is no seventh skill: when the paper lands, the research is done, and the next project re-enters at prospect. For an agent the lever is the same as everywhere in the suite, but the stakes are highest here because the output carries a human's name: it will write a fluent sentence around a number it never saw, soften a claim you meant to make sharply, and "improve" the story past what the evidence supports — feeling none of the future correction or retraction — so the writing must be **skeleton-tested, claim-organized, run-id-traceable, and gated**, with the argument, the contribution, and the signature kept in the author's own hand.

## Anti-patterns (use as a pre-flight checklist)

- **Writing top-to-bottom from page one** — build the figure-first skeleton and fix the one-sentence insight first; the figure sequence is the paper's spine.
- **An insight that's procedural, not cognitive** — "we propose X" is not the soul; "X works because we noticed Y" is. If you can't write it, the mechanism isn't understood — go back and probe.
- **Drafting prose on an untested skeleton** — reader-test the figures-and-captions first; if a fresh reader can't restate the thesis, fix the sequence before writing.
- **Contributions that aren't verifiable or claim-mapped** — "extensive experiments" is not a contribution; each one maps one-to-one to a claim.
- **Related work listed paper-by-paper** — group by theme from the comparison table, end each paragraph with the difference from you.
- **Experiments organized by experiment type** — organize by claim; each subsection opens "this validates claim X" so the reviewer audits your argument as they read.
- **Letting the agent write a sentence whose evidence it never saw** — the cardinal sin; every number and "experiments show" traces to a run id, or it doesn't go in.
- **Outsourcing the argument** — the story, claim wording, and contributions are the author's; the agent polishes, vets, and reader-tests, it does not decide what is claimed.
- **Guessing the venue's LLM policy** — check the current official wording and follow it; disclosure rules differ and change.
- **Skipping the reader test** — a clean session restating the paper finds the exact unclear spots; it beats "is this good?" tenfold.
- **Choosing a venue by rank over fit** — submit where your most-cited references live; that is the room that can understand you.
- **Starting to write too late** — back-plan from the deadline: full draft −4 weeks, internal review −2, freeze −1, so writing begins −6 at the latest.
- **Reacting to reviews in the first 48 hours** — the first read's anger is not a decision input; wait two days, then classify and answer.
- **Not adding the experiment you could add** — where the venue permits new experiments in rebuttal (check the policy first), the one-command pipeline makes a baseline or ablation realistic; if you can add the number, add it.
- **Telling a reviewer they're wrong** — give them a ladder ("an easy point to confuse; clarified in Section X"); they hold a vote.
- **Blasting the unchanged paper at the next venue** — revise before resubmitting and ladder down; the field is small and the reviewer pool overlaps.
- **Reading a rejection as failure** — one or two rejections before acceptance is common and expected; archive the reviews as free consultation and climb down the ladder.
- **Skipping the camera-ready re-verification** — re-check the final numbers against the results store; manuscript and single source of truth must still agree after the rebuttal edits.
- **Skipping a GATE** — and remember the cheapest publication failure is the unclear sentence a reader test caught before a reviewer did.

# Submit, Rebut, Persist — carry the paper to its room and through the gauntlet (STAGE 3-5)

This reference is the depth behind **STAGE 3 — Submit**, **STAGE 4 — Rebuttal**, and **STAGE 5 — Persist** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 3 chooses the venue by community, back-plans the timing, and finalizes the reproduction package; STAGE 4 waits out the first read, classifies every comment, and answers each in four beats; STAGE 5 archives a rejection as data and climbs a planned ladder, or — on acceptance — runs the camera-ready checklist that re-ties every published number to a run id. These three stages carry an argument that already exists in prose out of the workspace and through the court of peers. This file backs the six gated checks across them — submit's `venue-fit-over-rank` and `timing-and-repro-finalized`, rebuttal's `comments-classified-48h` and `responses-four-beat-evidence`, and persist's `revise-before-resubmit` and `camera-ready-checklist`.

These three stages are also where the suite's human/agent boundary is at its sharpest. The agent's legitimate jobs here are narrow and real — it runs the anonymization scan, re-runs the clean-environment smoke test, operates the rebuttal-window experiments, plays the adversarial reviewer in a clean session, and re-verifies the camera-ready numbers against the results store. But the venue taste, the read of which reviewer to spend words on, the call of whether a reviewer is wrong or merely confused, the decision to drop a rung on the ladder, and the signature on the resubmitted claims are all irreducibly yours. The agent is the **means** — the operator, the consistency-checker, the reader-tester, the rebuttal-experiment runner — never the author of the argument it carries.

---

## STAGE 3, part 1 — choose the venue by fit, not by rank (`venue-fit-over-rank`)

The first move is not "where is the most prestigious place this could go." It is a question about community:

> Look at where the papers you **cite most** are published — that is your conversation community, the pool where a reviewer can actually understand you.

A venue is not a ranking slot; it is the room your work is a sentence inside. The reviewers a venue draws are the people who published the work you build on and argue with. Submit there and a reviewer can place your contribution against the prior they already hold; submit to a higher-ranked room whose conversation you are not part of and you draw reviewers who must reconstruct your whole context before they can judge you — and a reviewer who has to work that hard defaults to suspicion. The most-cited references are the empirical signal of where your conversation already lives. Aim there.

Choose with the field's structure in mind, because the structure dictates everything about timing and shape:

- **CS is predominantly conference-led.** Fixed deadlines, three-to-six-month review cycles, hard page limits — though several subfields publish in journals (theory, and the machine-learning journals JMLR/TMLR). The deadline is the organizing fact of the calendar; the page limit forces compression as a first-class task.
- **OR is predominantly journal-led.** OR, Management Science, INFORMS Journal on Computing and the like — no deadline, year-scale cycles, room for heavy theory-plus-experiment (OR has conference and fast-track channels too). There is no clock to back-plan from, and the format rewards a full development rather than a compressed one.

Cross-disciplinary work can go either way, and the tiebreaker is not where it would be impressive but which side's language your **core contribution** speaks. If the load-bearing claim is an algorithm with a complexity result, it speaks the journal's language; if it is an empirical method that beats a benchmark the conference community tracks, it speaks the conference's. Pick the room whose language your central contribution is already written in.

---

## STAGE 3, part 2 — back-plan the timing from the deadline (`timing-and-repro-finalized`)

For a conference, the deadline is fixed and the only variable is when you start. Work backward from it:

> Full draft complete at least **four weeks out**; co-author internal-review round by **two weeks out**; paper **frozen** — changes only, no additions — **one week out**. So writing starts no later than **six weeks** before the deadline.

Each milestone guards a distinct failure. The four-week full draft exists so that the two weeks of internal review operate on a *complete* paper, not a draft missing its experiments section — co-authors reviewing a fragment catch fragment-level problems and miss whole-argument ones. The one-week freeze ("changes only, no additions") exists because new content added in the final week is content nobody has reviewed and nothing has been smoke-tested against; the last week is for fixing what review found, not for opening new fronts. And the six-week start is simply the arithmetic of the other three — start later and the draft is not done at four weeks, which collapses the review window, which pushes additions into the freeze week. The back-plan is not aspirational scheduling; it is roughly the latest each step can begin without crushing the one after it — stretch every interval for more co-authors or a heavier theory section.

Whether to post the paper to arXiv early is **not** a judgment call you make on instinct — it is checked **word-for-word against that venue's anonymity policy**. Many venues run double-blind review and have explicit rules about pre-printing during the review window; some forbid it, some allow it with constraints, and the wording differs and changes between cycles. Read the current official text and follow exactly what it says. An anonymity violation discovered after submission is a desk reject, and it is entirely avoidable by reading the policy rather than assuming it.

---

## STAGE 3, part 3 — finalize the reproduction package (`timing-and-repro-finalized`)

forge accumulated a `repro/` directory across the experiment runs — the configs, the scripts, the results store, the one-command regeneration. At submission it stops being a working directory and becomes an artifact a stranger will run on a machine you will never see. Three finalization steps turn the one into the other:

- **Anonymize it.** Author paths (a home directory with your name in it), institution names (a cluster hostname, an internal package), personal tokens (an API key, a private registry credential) — all removed. This is a *dedicated scan*, and it is exactly the kind of mechanical, exhaustive sweep to hand the agent: point it at the whole package and have it find every author path, institution string, and token-shaped secret. A single forgotten path in a config file de-anonymizes a double-blind submission.
- **Add a LICENSE.** A reproduction package with no license is, strictly, not legally usable by the reviewer or anyone after them. Add the license the work will ship under, now, before it leaves your hands.
- **Re-run a clean-environment smoke test.** "Works on my machine" is the default failure of every reproduction package, because your machine has state — installed packages, environment variables, cached data — that the package's declared setup does not capture. Re-run the smoke test in a clean environment (a fresh container, a stripped virtualenv) so the gap between "what I have installed" and "what the package declares" is caught by you, not by a reviewer who then writes "I could not reproduce the results." The clean-environment run is the cheapest possible place to find that gap.

The check `timing-and-repro-finalized` is clear when the back-plan milestones are set against the real deadline (or, for a journal, the draft is fully developed), the arXiv decision is reconciled with the written anonymity policy, and the `repro/` package is anonymized, licensed, and smoke-tested clean.

---

## STAGE 4, part 1 — the 48-hour rule (`comments-classified-48h`)

The reviews arrive. Do not act on the first read.

> The first read of reviews triggers an emotional response — anger plus the feeling of being wronged — that is **not admissible** as input to any decision. Read once, wait two days, read again. Half the apparent "malice" turns out to be misunderstanding.

The mechanism is specific. On the first read you are not reading the review; you are reading your own defense of work you are close to, and every critique registers as an attack. That state produces exactly the rebuttal you must not send — defensive, point-scoring, treating a confused reviewer as a hostile one. Two days is enough for the emotional response to drain and for the second read to be a read of the *text* rather than of your reaction to it. On that second read, a comment that looked like malice resolves into a reviewer who read a sentence the way it was actually written — which is a writing problem, not an attack. The 48-hour wait is not politeness; it is the gap that makes the review usable as information.

---

## STAGE 4, part 2 — classify every comment, strategy per class (`comments-classified-48h`)

On the second read, sort every comment into one of four classes and set the strategy the class dictates. The classification is the work; the responses follow from it.

| Class | What it is | Strategy |
|---|---|---|
| **Misunderstanding** | the reviewer misread the paper | this is really a **writing problem**, and it is the easiest to answer: point to the text that already says it, apologize for the unclear phrasing, give the fix. The reviewer's misreading is a coordinate of where you wrote unclearly — fix the prose and thank them for finding it. |
| **Needs-an-experiment** | the comment asks for a baseline, an ablation, or a scale tier you don't have | the agent-era class — see the next bullet. The short version: *if the venue permits a new experiment in the response and you can produce it*, **actually add the number.** |
| **Fundamental disagreement** | the reviewer disagrees with a real, defended choice | polite but firm; **cite evidence, not emotion**: "we respectfully disagree, because…" followed by the number or the argument. You are allowed to hold your ground — you are not allowed to hold it on feeling. |
| **Reviewer-is-wrong** | the reviewer made an error of fact or logic | the **most dangerous** class, because they hold a vote. Do not tell them they are wrong. **Give them a ladder:** "this is an easy point to confuse; we have added a clarification in Section X," packaging "you were wrong" as "we wrote it unclearly." A reviewer told they erred digs in; a reviewer handed a graceful way down concedes. |

The reviewer-is-wrong class deserves the emphasis it gets. Being right is not the goal of a rebuttal — landing the paper is, and the reviewer who is wrong still casts a vote you need. The ladder lets them change their assessment without having to admit a mistake in writing to the area chair, which is the only form of concession that costs them nothing. You are not lying — you genuinely *can* add a clarifying sentence — you are choosing the framing that lets a correct outcome happen.

### The agent-era change: actually add the number

The needs-an-experiment class is the one that has changed, and it changed because of forge:

> forge's **one-command regeneration** plus an **agent operator** make adding a baseline, an ablation, or a scale tier realistic within **days** — so 补实验 (adding an experiment in the rebuttal window, *where the venue's response policy permits it*): "**if you can add it, ACTUALLY add the number.**"

This is the single most persuasive response a rebuttal can contain. A reviewer who asked "how does this compare to baseline B" and receives, in the response, the actual measured comparison — not a promise, a number — has nothing left to push on. In the human era this was often infeasible inside the short rebuttal window; the experiment took longer than the window allowed, and the honest answer was a promise to add it in revision. With forge's pipeline and the agent operating it (the same operator role from ledger — submit, monitor, retry, persist, summarize), the experiment that used to take weeks runs in days, inside the window. But feasibility is not permission: **whether a new experiment is admissible at all is a venue-policy question, checked word-for-word against the current author-response rules exactly as the anonymity and LLM policies are.** Some venues forbid or discourage new experimental results in the response; some admit them only to answer a specific reviewer question, with the original submission still the basis for the decision; and many journals — and some conferences — have no author-response phase at all. So the rule, fully stated: *where the venue permits it*, the default flips from "promise it for the camera-ready" to "add it now and report the number" — the agent era removed the feasibility barrier, not the policy one. The number ends the argument; the promise only defers it.

---

## STAGE 4, part 3 — the four beats of a response (`responses-four-beat-evidence`)

Every response to every comment has the same four beats, in order:

1. **Restate the concern** — in your own words, to prove you understood it. A reviewer reading a response that misstates their point concludes you didn't read carefully and digs in. Restating correctly is the price of admission to the rest of the response.
2. **Respond** — the substance: the clarification, the agreement, the disagreement, the added experiment.
3. **Evidence** — a *number*, or a *precise location in the paper* ("as shown in Table 3," "Section 4.2, second paragraph"). Evidence is what separates a response from an assertion. A reviewer can dismiss "we believe the method is robust"; they cannot dismiss "the sensitivity scan in Table 4 shows under-3% variation across two orders of magnitude."
4. **A concrete revision promise** — down to the section number ("we will add this to Section 5.1"), and **never a promise you cannot keep.** A broken revision promise discovered at camera-ready is worse than no promise; the reviewer's trust in the rebuttal was the thing that moved their vote, and a promise you can't honor retroactively poisons it.

The four beats together convert a defensive reaction into an auditable answer: you understood it, here is what we did, here is the proof, here is exactly what changes. A response missing the restate beat reads as not-listening; one missing the evidence beat reads as bluster; one missing the promise beat leaves the reviewer with nothing to verify at revision.

### Where to spend the fire

Rebuttal words are scarce and reviewers are not equally movable:

> Spend limited rebuttal words on the **borderline reviewer who clearly read the paper.** The two extremes — very high, very low — rarely move.

The enthusiastic reviewer has already voted for you; words spent there are wasted. The hostile reviewer who clearly didn't engage rarely moves regardless of what you write, and chasing them burns the words the borderline reviewer needed. The borderline reviewer who *read the paper* is the one whose vote is genuinely in play and who will genuinely weigh your response — that is where the fire goes. Allocating rebuttal effort is a triage decision, and it is yours: read each review for engagement and movability before you spend a word.

### The agent red-team

Before you send, stress-test the response:

> Have a **clean agent session play that reviewer** and rehearse how they will counter-attack your response, so you can pre-empt it.

A response you wrote feels airtight to you because you wrote it. A clean session given the review and your draft response, instructed to play the reviewer and find the comeback, surfaces the counter-attack you didn't see — the follow-up question your added experiment invites, the place your clarification opens a new hole. You then close that hole before the reviewer ever sees the response. This is the agent doing what it does well — adversarial rehearsal on a bounded text — and it is firmly on the operator side of the line: the agent rehearses the attack, you decide what to concede and how to reframe.

---

## STAGE 5, part 1 — archive the rejection, then revise; never blast (`revise-before-resubmit`)

Most papers are rejected at least once. The rejection is not a verdict on the work or on you:

> **Archive all reviews into the 历程** (the append-only lab notebook) **verbatim** — a rejection is free deep consultation from several domain experts.

Several experts in your field read your paper closely and wrote down, for free, exactly where it failed to convince them. Filed verbatim into the 历程, that is the most valuable revision input you will get — more honest than a co-author, more detailed than a casual read. Archive it before you do anything else, because the next move depends on reading it as data.

Then the iron rule, and it has two halves:

> **Revise before you resubmit; never blast the identical paper at the next venue.**

The "never blast" half is about a small field. The reviewer pools of venues in the same community overlap, and the same paper landing on the same reviewer at the next venue — not at all unlikely — is reputation damage: the reviewer sees a paper they rejected, unchanged, and now reads it as the work of someone who ignores review. The "revise before" half is the constructive form: you have several experts' free consultation in the 历程; use it to fix the main issues the reviews named before the paper goes anywhere.

Plan the path before the first submission, not after the first rejection:

> Plan a **two-or-three-tier ladder** in advance: ideal venue → same-tier backup → safe option. After each rejection, fix the main issues per the reviews and **drop one tier**, so the worst case is **monotonically rising paper quality.**

The ladder makes rejection productive instead of merely disappointing. You aim at the ideal venue first; if rejected, you revise per its reviews — which raises the paper's quality — and aim one tier down at a venue where the revised, now-stronger paper is a better fit. Each rung down is also a quality increment up, so the descent is not a slide toward giving up but a process whose worst case is a steadily better paper landing at a steadily more appropriate venue. And the expectation to hold onto:

> A rejection or two before acceptance is **common and expected** in many fields — not a verdict on the work.

A first rejection is the expected path through the ladder, not a signal that the work is wrong. Read it as the consultation it is, revise, drop a rung, resubmit.

---

## STAGE 5, part 2 — the camera-ready checklist (`camera-ready-checklist`)

On acceptance, the paper is not done — there is a final pass where careless errors most easily enter, because the celebratory mood and the loosened review discipline coincide. Run the checklist:

- **Add acknowledgments and grant/funding numbers.** These were omitted for anonymity and must go back in; a missing or wrong grant number is a real administrative problem for the people who funded the work.
- **De-anonymize the paper.** Every anonymization done for submission is now undone — author names, affiliations, the self-citations you had to obscure, the repository link you had to redact. The danger is the *missed* one: an anonymized phrase left in the camera-ready reads as carelessness in the permanent record.
- **Re-verify the final numbers against the results store, one last time.** The manuscript went through a rebuttal round of edits — added experiments, revised tables, a metric clarified. The single source of truth (forge's results store) and the manuscript must **still agree** after all of that. Re-check every headline number against its run id; an edit during rebuttal that updated a table but not its in-text mention, or vice versa, is exactly the kind of drift this pass catches. This is the agent's mechanical sweep, on your audit.
- **Sync the arXiv version to camera-ready.** The public version and the published version must match; an arXiv copy frozen at the submission draft, with the rebuttal-round corrections missing, is a second, wrong version of the paper in permanent circulation.

This pass closes the loop forge opened at the very start of the experiments:

> Every number in the published paper still traces, **bit-for-bit, to a run id.**

That is the property the entire results-store discipline existed to guarantee, redeemed here at the last possible moment. The number in the published table is not a number someone typed; it is the output of a specific run, identified by its run id, regenerable from the frozen config. After the rebuttal edits, after the de-anonymization, after the arXiv sync, that property must still hold — and the camera-ready re-verification is the check that it does. The `camera-ready-checklist` check is clear when acknowledgments and funding are restored, the paper is fully de-anonymized, every headline number has been re-verified against its run id, and arXiv is synced to the camera-ready.

---

## The exit condition for step six

`envoy` closes — the research is done — when the paper has run the full gauntlet, not when a draft is finished. Concretely, across these three stages:

> The paper is **submitted** to the right room, the **rebuttal is fought** with classified comments and evidence-backed four-beat responses, and after a rejection the paper is **revised and resubmitted one rung down the ladder** — or, on acceptance, the **camera-ready checklist is closed** and every published number still traces to a run id.

Each maps to a STAGE 3-5 check and each guards a distinct failure:

- **Venue fit and a finalized package** (`venue-fit-over-rank`, `timing-and-repro-finalized`) — the paper is aimed at the community that can understand it, the timing is back-planned so writing didn't start too late, and the repro package is anonymized, licensed, and smoke-tested so a reviewer's "I couldn't reproduce it" never happens.
- **Classified, evidence-backed rebuttal** (`comments-classified-48h`, `responses-four-beat-evidence`) — the first read's anger is not in the response, every comment has a per-class strategy, each answer runs the four beats, the fire went to the movable reviewer, and the experiments that could be added were added.
- **Revise-and-ladder, then camera-ready** (`revise-before-resubmit`, `camera-ready-checklist`) — a rejection became archived consultation and a one-rung descent with rising quality, not a blast of the unchanged paper; on acceptance the final numbers still agree with the results store bit-for-bit.

When all hold and the `FINAL GATE` clears (`checklist show` confirms all six stages passed, `checklist done` clears the run), the research is finished and the next project re-enters the suite at prospect. The through-line held to the end: the paper already existed in pieces, so the effort went to its *legibility* and its *defense* rather than its composition — and the four human things, taste in the venue, the spec of the contribution, the judgment in the rebuttal, and the signature on the resubmitted claims, stayed in the author's own hand. The agent carried the package, ran the added experiments, played the adversary, and re-checked the numbers; it never authored the argument it carried.

---

**Cross-links:** [why-the-paper-already-exists.md](why-the-paper-already-exists.md) (the foundation — the cardinal sin and the run-id traceability rule that the rebuttal's added numbers and the camera-ready re-verification both enforce, and the four human things that come due across these three stages) · [skeleton-and-sections.md](skeleton-and-sections.md) (STAGE 0-1 — the claim-organized experiments section a reviewer audits as they read, which shapes the needs-an-experiment classification) · [agent-and-the-three-redlines.md](agent-and-the-three-redlines.md) (STAGE 2 — the venue's LLM-use policy checked against current wording, the same word-for-word policy discipline as the anonymity check here) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 3 Submit, STAGE 4 Rebuttal, STAGE 5 Persist) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (upstream — the agent-as-operator role the rebuttal-window experiments reuse, and the frozen protocol whose run-ids the camera-ready re-verification traces back to) · [../../forge/SKILL.md](../../forge/SKILL.md) (the results store and one-command regeneration that make 补实验 feasible in days and that every published number must still trace to).

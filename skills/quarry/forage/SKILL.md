---
name: forage
description: >
  The open-source discovery lens: find the few repositories worth your time —
  before you sink hours into the wrong one — in either of the two modes that
  finding actually happens in. TARGETED, when you have a concrete need ("a
  lightweight task queue to replace Celery"): the agent fans out every search
  seam in parallel and returns a ranked, deduped candidate shortlist.
  SERENDIPITOUS, when you have no goal and just want to be surprised: the agent
  ranges the high-signal surfaces (Show HN, off-peak trending, topic corners,
  taste-feeds) and brings back the orthogonal finds, captured cheaply so none is
  lost. The one shift: search-syntax mastery is COMMODITIZED — the agent knows
  every qualifier — so your edge is the NEED-SPEC and which seams to mine, and
  serendipity is HARVESTED, not searched. Use when looking for a library, tool,
  framework, reference implementation, or alternative; when browsing for
  interesting projects; or when you keep hitting the same dead high-star repos.
  Triggers on "find a library/tool for X", "alternative to Y", "what should I use
  for", "is there a repo that", "show me interesting projects", "good first
  issue", "discover repos", "browse GitHub", "find open-source projects".
  Installs the targeted seams (qualifier-combo search · snowball from taste-stars,
  awesome lists, dependency graphs and Used-by · code-search · issue "alternatives"
  threads), the wandering surfaces and the adjacency dial, the provenance rule
  (no invented repo, no fact the agent didn't pull from the source), and the
  cheap capture discipline. The agent is the MEANS (the parallel miner and the
  wanderer), never the judge of what's worth it; you keep two things — the
  need-spec, and the "眼前一亮 / this one's worth a look" verdict. Hands its
  shortlist to `touchstone` for evaluation.
argument-hint: "[a concrete need to hunt for, or a domain/vibe to wander — or nothing, to just browse]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# forage

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A useful repository is a vein of value in a commons that, from the trending page, looks like nothing but noise and abandoned star-farms. `forage` is the lens you hold over the open-source world to find that vein **before** you sink an afternoon into the wrong one — whether you arrive with a sharp need or just wander in to look around. It is the first skill of the `quarry` suite: it owns *discovery* — bringing back the few candidates worth a closer look. It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not supply it, so the judgment is yours.

**The one mental shift everything hangs on — the search syntax is no longer the skill.** The human-era craft of finding repos was fluency: memorize the qualifiers, learn which awesome-list to grep, build the muscle for `language:python stars:>1000 pushed:>2026-01-01`. The agent already knows every qualifier and can run forty queries while you type one — so that fluency is **commoditized**, and clinging to it is optimizing the part the machine took over. What is left for you is the part it can't do: in **targeted** mode, *saying precisely what you need* (the sharper the spec, the better everything downstream — "a task queue" finds noise; "a lightweight Celery alternative with no broker dependency, still maintained in 2026" finds the answer); and in **serendipitous** mode, the *taste* to feel which find is worth a second look. The agent's job is to fan the seams out wide; yours is to aim them and to judge what comes back.

**The agent is the means, not the judge.** Here it has two jobs: the **parallel miner** (run every seam at once, targeted) and the **wanderer** (range the high-signal surfaces, serendipitous). It is *not* the arbiter of what's good. Its gradient points at *handing you something that looks like an answer*, and in this domain that gradient is dangerous in three specific ways: it **trusts the most gameable signals** — a big star count and a polished README — exactly the two an abandoned project or an AI-generated star-farm wears best; it **invents repositories**, or asserts that a real one "supports X" without ever opening it; and it **flattens everything to "relevant"**, returning ten more of what you already know when serendipity needed the one orthogonal thing. So two disciplines hold from the first query: **every candidate carries its provenance** — which seam found it, which query — and no repo enters the list that the agent did not actually pull from a source; and **stars and the README are treated as claims to be corroborated later by `touchstone`, never as proof of quality here.**

**What you cannot delegate — two judgments.** The pipeline parallelizes the labor, but two points are yours and stay yours: **(1) the need-spec** (targeted) or **the adjacency dial** (serendipitous) — what you are hunting, and how far from your usual ground to roam, decides what can even be found; hand the agent a vague need and you have automated a thorough search of the wrong commons. And **(2) the "worth a look" verdict** — the 眼前一亮, the *this one's interesting*. The agent can rank by stars and recency; it cannot feel the pull that makes a project worth your weekend. Outsource that and you have a tidy list nobody actually wanted to open.

**What "done" looks like — a captured shortlist, not an open tab graveyard.** Foraging is over when you hold a **small, categorized shortlist** — each survivor with its provenance and a one-line reason it's there — recorded somewhere durable (a star-list, a notes file), not twenty browser tabs you'll close unread. Targeted foraging ends with a handful of genuine candidates framed for `touchstone`. Serendipitous foraging ends with the surprises captured cheaply into an "interesting, not sure why yet" list — because the value of a wander rarely lands the day you find it, but three months later when a problem arrives and you think *"wait, I starred something for this."* The terminus is the captured shortlist, not the number of repos you skimmed.

**Speak the user's language.** Most calls here are the user's: which need is worth solving by a dependency at all, whether a find is *genuinely* interesting or merely on-topic, how far to wander. Read their fluency and gloss a term on first use (a *seam*, the *adjacency dial*, *snowballing* from a person's stars, an *awesome list*, *star-farming*). A find the user can't see the point of is a tab they'll close — name why it's worth opening, and let the verdict be theirs.

**Read [references/why-mine-and-wander.md](references/why-mine-and-wander.md) first** — the must-be-told foundation: the two modes and why each needs its own method, the search-syntax-is-commoditized reframe, the agent as means (and its three traps — trusting stars/README, inventing repos, flattening to relevant), the provenance rule, the cheap-capture law, and the two non-delegable judgments. It is the key that makes every stage below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-mine-and-wander.md](references/why-mine-and-wander.md)** — the foundation: targeted-mining vs serendipitous-harvest and why the same tool serves both, search-syntax as commoditized labor, the agent as means (parallel miner + wanderer) and its three signature failures (stars/README over-trust, repo hallucination, flattening to on-topic), the provenance and capture-cost rules, and the two non-delegable judgments. Load at STAGE 0.
- [references/the-seams-and-syntax.md](references/the-seams-and-syntax.md) — TARGETED mode in depth: the advanced-search qualifiers and the combinations that matter (`pushed`/`stars`/`topic`/`created`/`in:readme`/`good-first-issues`/code-search), and the snowball seams — a trusted person's stars, awesome lists, the dependency graph, the "Used by" count, off-peak trending, and the "alternatives" threads in issues — each with a copy-ready agent instruction and its characteristic false positive (the dead high-star repo first among them). Load at STAGE 1-2 in targeted mode.
- [references/the-wandering-surfaces.md](references/the-wandering-surfaces.md) — SERENDIPITOUS mode in depth: the high-density surfaces where good projects surface first (Show HN, off-peak and all-language trending, the topic corners, the "vibe" keywords like `tiny`/`from-scratch`/`weekend-project`, taste-people's star feeds, the curator newsletters), the adjacency dial for steering toward the orthogonal, and the frequency-beats-duration cadence. Load at STAGE 1-2 in serendipitous mode.
- [references/sift-and-capture.md](references/sift-and-capture.md) — narrowing and keeping: the cheap first-pass cull (dead / mirror / star-farmed / duplicate, recorded — and why this is NOT yet the `touchstone` evaluation), keeping for fit-not-hype, the categorized-capture discipline that drives the recording cost toward zero, and the handoff that frames survivors for `touchstone` while leaving the taste verdict in your hands. Load at STAGE 3-4.

> **The pipeline is one arc.** Five stages — frame · seams · cast · sift · capture — turn "I need something" or "show me something" into a shortlist worth evaluating. Casting the seams widens (a broad candidate pool); sifting narrows (cull the dead and the duplicate); capture keeps what's left, cheaply and categorized. `forage` gates all five below, and hands the survivors to `touchstone`.

---

## STAGE 0 — Frame the hunt (pick the mode, sharpen the aim, set the discipline)

Open **[references/why-mine-and-wander.md](references/why-mine-and-wander.md)**. Internalize the two modes and *the agent is the means*, then aim before any search.

- **Declare the mode, and aim it.** **Targeted:** write the **need-spec** — the one or two sentences sharp enough that "does this repo fit?" has a yes/no answer: the language/runtime, the must-haves, the deal-breakers, and the thing it would replace. The sharpness of this sentence sets the ceiling on everything downstream; a vague need cannot be rescued by a wide search. **Serendipitous:** name the **surfaces** you'll wander and set the **adjacency dial** — how far from your usual ground to roam (more dial = more orthogonal, more noise) — because "show me anything good" with no dial just returns the popular things you've already seen.
- **Set the capture destination first (capture must be cheap).** Decide *now* where a find lands — a categorized star-list, a notes file, a scratch list — so recording a hit costs one line, not a decision. The whole value of a wander leaks away if capturing a surprise is expensive; you will simply not do it. (This is the discipline the human-era version calls *lower the cost of recording, not finding*.)
- **Set the source discipline (the agent is the means).** Fix the rule before the first query: every candidate carries its **provenance** (which seam, which query/surface), the agent surfaces **no repository it did not actually pull from a source** (no invented names, no "this one supports X" it never opened), and **stars and the README are recorded as claims, not quality** — their test is deferred to `touchstone`. Command the agent to find and bring back, not to reassure you that it found something.

### GATE — clear before SEAMS
1. `checklist check frame mode-and-need-fixed`
2. `checklist check frame capture-cheap-set`
3. `checklist check frame provenance-discipline-set`
4. `checklist verify frame`

---

## STAGE 1 — Pick the seams (plan a multi-source cast, not one query)

Open **[references/the-seams-and-syntax.md](references/the-seams-and-syntax.md)** (targeted) or **[references/the-wandering-surfaces.md](references/the-wandering-surfaces.md)** (serendipitous). One search is one thread; the agent-era gain is many at once.

- **Name at least three or four INDEPENDENT seams (targeted) or surfaces (serendipitous).** Single-sourcing is how you miss the best find. The targeted **seams**: qualifier-combo search (combine `language` · `stars` · `pushed` · `topic` · `created` · `in:readme` · `good-first-issues`, and the **Code** search tab for how an API is really used); and **snowballing** — a trusted developer's stars page, the relevant `awesome-*` list, a known-good project's dependency graph and its "Used by" count, off-peak (weekly/monthly) trending, and the "what's the alternative to X?" threads inside issues and discussions. The serendipitous **surfaces**: Show HN, off-peak / all-language trending, an unfamiliar `github.com/topics/...` corner, the "vibe" keywords (`tiny`, `toy`, `from-scratch`, `in-1000-lines`, `weekend-project`), the star feeds of people whose taste you trust, and the curator newsletters.
- **Set the bias toward what survives, not what scored.** Targeted: weight **maintained and actually-used** (recent `pushed`, real "Used by", a recent release) over raw star count — many four-figure-star repos stopped breathing years ago, and stars are a record of *past* attention, not present life. Serendipitous: point the **adjacency dial** at the orthogonal — the goal of a wander is the thing you wouldn't have searched for, not ten more of what you already follow.
- **The choice of seams is yours.** Which seams to open, and (serendipitous) how wide to set the dial, is the judgment that decides what becomes findable at all. The agent runs whatever you point it at; aim it at one narrow seam and you have parallelized a tunnel.

### GATE — clear before CAST
1. `checklist check seams seams-or-surfaces-planned`
2. `checklist check seams activity-and-orthogonality-bias-set`
3. `checklist verify seams`

---

## STAGE 2 — Cast (run the seams in parallel, capture with provenance)

Open the seams. This is the labor the agent is *for* — run it wide and bring everything back tagged.

- **Run the planned seams, in parallel, and actually execute them.** Fire the qualifier combos, walk the snowball links, sweep the surfaces — many threads at once, each blind to the others. Use the live tools (web search, `gh`, the GitHub search and code tabs); do not reason about what *might* be out there. A repo the agent describes but never retrieved does not exist for this purpose.
- **Tag every candidate with its provenance.** Each repo that enters the pool carries the seam that surfaced it and the query/surface behind it — both so you can judge coverage (all from one seam = you under-cast) and so no hallucinated name slips in unsourced. Record the cheap facts the seam already returned (name, one-line description, last-push date, star/Used-by if shown) — but do **not** start evaluating here; that is `touchstone`'s job, kept separate on purpose so cheap discovery stays cheap.
- **Cast wide enough.** Targeted: a pool of more than a handful — finding two candidates is the tell that you cast one narrow seam, so go back and open more before narrowing. Serendipitous: a real sweep across the surfaces, not the first page of one trending list.

### GATE — clear before SIFT
1. `checklist check cast fanout-run-with-provenance`
2. `checklist check cast pool-wide-enough`
3. `checklist verify cast`

---

## STAGE 3 — Sift (cull the dead and the duplicate, cheaply)

Open **[references/sift-and-capture.md](references/sift-and-capture.md)**. Narrow the pool with a cheap pass — this is triage, not trial.

- **Run the cheap first-pass cull.** Drop the obvious non-starters on signals you can read in seconds: **dead** (no commit in years, archived), **mirror / re-upload** of another project, **empty or stub** (a README and nothing behind it), **star-farmed** (a high star count with no issues, no forks-in-use, no real history), and **duplicate** of a stronger candidate already in the pool. Record the cull reason for each — a one-word tag is enough.
- **This is NOT the evaluation.** The deep "is it actually good?" — bus factor, issue-response quality, the slop check, the per-axis scoring — belongs to `touchstone`, and pulling it forward here defeats the point of cheap discovery. Sift only removes what is *plainly* not worth evaluating; when in doubt, keep it and let `touchstone` decide.
- **Keep for fit, not for hype.** A survivor stays because it genuinely fits the need (targeted) or genuinely pulls (serendipitous) — not because it has the most stars or the slickest README. Carry that suspicion of the gameable signals forward; it is exactly what `touchstone` will test.

### GATE — clear before CAPTURE
1. `checklist check sift deduped-and-cheap-culled`
2. `checklist check sift shortlist-is-fit-not-hype`
3. `checklist verify sift`

---

## STAGE 4 — Capture (record cheaply, mark the keepers, hand off)

Open **[references/sift-and-capture.md](references/sift-and-capture.md)** (the capture section). The find is worthless if it's lost — record it where you'll find it again.

- **Capture every survivor, cheaply and categorized.** Each one goes into the destination set in STAGE 0 with its **provenance** and a **one-line reason** it's there ("Celery alternative, no broker, last push last week" / "weird and lovely, no idea what for yet"). Categorize as you go — "candidates for need X", "interesting, not sure why yet" — so the list stays usable. Cheap and immediate beats thorough and later: a find you don't record in the moment is a find you've lost.
- **Mark the keepers — the verdict is yours.** Which candidates are worth pursuing (targeted) and which genuinely made you sit up (serendipitous, the 眼前一亮) is *your* mark, not the agent's relevance rank. The agent can order the list; only you can say which ones to actually open.
- **Hand the keepers to `touchstone`.** For the ones you'll evaluate, frame them for the next skill: the targets, and the **use-context** that will set the bar there (a weekend tryout, a production dependency, a contribution, a thing to learn from). Park the rest in the "not sure yet" list — un-judged, not discarded. That framed shortlist is the terminus.

### FINAL GATE — the shortlist is foraged
1. `checklist check capture captured-cheaply-with-why`
2. `checklist check capture taste-verdict-and-handoff`
3. `checklist verify capture`
4. `checklist show` — confirm all **five** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`forage` is the **open-source discovery lens**, held over the commons either with a need or just to look. Its five stages are one arc against one enemy — **the wrong repository that looks right**: the dead project with a beautiful README, the star-farm, the on-topic result that buried the orthogonal one you actually needed. Framing (0) aims the hunt and arms you against the agent's trust in gameable signals; picking the seams (1) refuses to single-source; casting (2) runs them wide and brings everything back tagged; sifting (3) cuts the plainly-dead cheaply, without pretending to evaluate; capture (4) keeps what's left where you'll find it again and lets *you* mark the keepers. The through-line is the suite's own — *the cost should match the find*: cast wide because the agent makes width free, cull cheap before you judge deep, and never let the recording cost swallow the discovery.

It pairs with its sibling without doing its job. Inside `quarry`, `forage` owns *finding*; **[touchstone](../touchstone/SKILL.md)** owns *judging* — `forage` hands it a shortlist with provenance and a use-context, and `touchstone` decides whether each find is genuine quality or gameable noise. And it routes onward when a find is worth committing to: the engineering suite's `plumb` reads its code craft, `assay` its tests, `aegis` its dependency and security posture, and `husbandry` weighs taking it on as a long-lived dependency — while the deeper "should we build on this?" is a `groundwork`/`load-bearing` question. For an agent the lever is the same everywhere: it will hand you a confident answer made of a high star count and a fluent README, feeling none of the afternoon you'll lose to an abandoned repo — so the find must be **sourced, sifted, and captured**, with the keep-or-open verdict left to the one person who can feel it.

## Anti-patterns (use as a pre-flight checklist)

- **Polishing the search syntax** — the agent knows every qualifier; your edge is the need-spec and the taste, not the cleverness of the query.
- **A vague need-spec** — "a task queue" searches the wrong commons thoroughly; sharpen it until "does this fit?" is yes/no before casting.
- **Wandering with no adjacency dial** — "show me anything good" returns the popular things you've already seen; set how far to roam, and aim it at the orthogonal.
- **Single-sourcing** — one query, one awesome-list, one trending page; open three or four independent seams so the best find can't hide in the one you skipped.
- **Trusting stars as quality** — a star count is a record of past attention, not present life; bias toward maintained and actually-used, and defer the quality test to `touchstone`.
- **Believing a hallucinated repo** — the agent invents plausible project names and unverified "it supports X" claims; nothing enters the pool unsourced.
- **Evaluating inside `forage`** — bus factor, issue-response, the slop check belong to `touchstone`; sift only removes the plainly-dead, cheaply, and keeps the rest.
- **Letting capture be expensive** — if recording a find takes a decision, you won't do it; set the cheap categorized destination first and record in one line.
- **Collapsing serendipity to relevance** — the agent returns ten more of what you follow; a wander's whole point is the one orthogonal thing, so don't let it cull the surprising for being off-keyword.
- **Outsourcing the keeper verdict** — the agent ranks; only you feel the 眼前一亮, and only you decide which to actually open.
- **The open-tab graveyard** — twenty unread tabs is not a forage; the terminus is a small captured, categorized shortlist you'll still have next month.
- **Skipping a GATE** — and remember the cheapest discovery failure is the great repo you found, didn't capture, and can never find again.

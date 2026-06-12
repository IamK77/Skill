# Sift and Capture — narrowing and keeping, behind STAGE 3-4

This reference is the depth behind **STAGE 3 — Sift** and **STAGE 4 — Capture** of the [../SKILL.md](../SKILL.md) flight plan: how you take the wide tagged pool that casting left you and bring it down to a small, durable, categorized shortlist without doing the evaluation that belongs to the next skill. It backs the four checks across both stages — `deduped-and-cheap-culled` and `shortlist-is-fit-not-hype` (sift), `captured-cheaply-with-why` and `taste-verdict-and-handoff` (capture).

> Sifting is triage, not trial. You remove the candidates that are *plainly* not worth a closer look — on signals you read in seconds — and you keep everything else. The deep "is it actually good?" is `touchstone`'s job, on purpose; pull it forward and cheap discovery stops being cheap. When in doubt, keep, and let `touchstone` decide.

---

## The shape of the funnel here

Casting widened the pool; the back half of the pipeline narrows and keeps. The split between the two halves is deliberate and load-bearing, so name it before the parts:

> **cast wide (a broad tagged pool) → sift cheap (drop the plainly-dead, record the reason) → keep for fit, not hype → capture cheaply and categorized → mark the keepers → hand the keepers to `touchstone` with their use-context.**

Sift *removes*; capture *keeps*. Neither *evaluates*. The entire reason `forage` and `touchstone` are two skills and not one is that finding should be cheap and judging should be deliberate, and mixing them makes finding expensive — you start opening commit histories and reading issue threads on candidates that a one-second glance would have retired, and the wander dies of friction. Sift is the cheap pass that earns the right to be cheap by *refusing* to evaluate. Hold that line and the rest of this document follows.

---

## 1. The cheap first-pass cull — second-glance signals, recorded

A first-pass cull is not a review. It is a set of **second-glance signals**: things visible on the search-result row, the repo header, or a five-second look at the page, that retire a candidate without opening anything. The agent already pulled most of these during the cast (STAGE 2 records the cheap facts the seam returned — name, description, last-push date, star / Used-by if shown), so the cull mostly reads data you already have. Each drop carries a **cull reason** — a one-word tag is enough — for two purposes: so you can audit *why* the pool shrank (all of one kind of cull means a seam was noisy), and so a candidate isn't quietly re-found and re-culled on the next pass.

The five second-glance signals, each with the tell and the tag:

- **Dead / archived** — `dead`. No commit in years, or GitHub's `archived` banner across the top of the repo (the owner explicitly froze it; the repo page shows "This repository has been archived by the owner"). The agent can read this without opening the repo: archived status and `pushed_at` come back on the API. Note that *archived* is a stronger signal than *old*: an archived repo is a decision, a years-stale one might just be finished — and "finished vs abandoned" is exactly the nuance `touchstone` is built to weigh, so don't over-read a merely-old repo here. Archived and explicitly dead, cull. Old-but-maybe-finished, keep.
- **Mirror / re-upload** — `mirror`. A read-only copy of a project that lives somewhere else: the description says "mirror of …", or the repo is a verbatim re-upload of a more canonical one (a GitHub *fork* shows a "forked from" banner in the header; a re-uploaded mirror usually does not — its tells are the description, a history identical to the original, and a link back to the real home). You want the upstream, not the mirror — find the canonical home and keep *that* instead, culling the copy.
- **Empty / stub** — `stub`. A README and almost nothing behind it: a few files, one commit, no real source. The "all README, no project" case. The slop era produces a lot of these — a beautiful landing page over an empty repo — but here you don't need the slop *detector* to catch the obvious ones; a near-empty file tree retires them on sight. The borderline "thin but maybe real" ones you keep; depth-vs-breadth is `touchstone`'s slop-check.
- **Star-farmed (obvious cases only)** — `starfarm`. A high star count with nothing underneath it: no issues, no forks-in-use, no real commit history, stars that arrived in a suspicious clump. You are only catching the *blatant* ones here — the repo whose stars are plainly disconnected from any sign of use. The careful star-farm and AI-slop diagnosis (stars with no matching reality, fabricated benchmarks, generated-looking code) is `touchstone`'s adversarial slop-check, and it is *not* your job at this stage. If it takes more than a glance to tell, keep it and let `touchstone` run the detector.
- **Duplicate of a stronger candidate** — `dup`. The pool already holds a better entry for the same need: same niche, same approach, but one is clearly more alive or more used. Keep the stronger, cull the weaker, and record which one it duplicates (`dup-of:<name>`) so the decision is auditable. Be conservative — two repos that *look* similar from the row may differ in ways only `touchstone` surfaces; cull only when one plainly dominates on the cheap signals.

The copy-ready instruction for the agent, which keeps the cull mechanical and the reasons recorded:

> For each candidate in the pool, apply the cheap first-pass cull. Drop a candidate ONLY if it is plainly one of: `dead`/`archived` (no commits in years or the archived banner), `mirror` (a re-upload of a canonical repo elsewhere), `stub` (a README over a near-empty tree), `starfarm` (high stars with no issues, forks-in-use, or real history — obvious cases only), or `dup` of a stronger candidate already in the pool. For each drop, record the candidate and a one-word cull reason (for `dup`, name what it duplicates). Do NOT evaluate the survivors — no opening commit histories, no reading issue threads, no scoring. When a candidate is borderline on any signal, KEEP it. Return the surviving pool and a separate list of culls with reasons.

The point of the recorded reason is not bureaucracy. It is that a cull you can't explain is a cull you can't trust later, and the agent's gradient — reach a tidy short answer — will happily drop a good repo to make the list look clean. A tag per drop keeps the narrowing honest and reversible.

---

## 2. The boundary that everything here defends — triage, not trial

This is the single most important thing in the stage, so it gets its own section: **the sift is triage, not trial.** The line between "plainly not worth evaluating" and "evaluated" is the line between `forage` and `touchstone`, and the agent will cross it the instant you let it, because crossing it *feels* like being thorough.

What belongs to `touchstone`, not here — and culling on any of these is the error:

- **Bus factor.** Whether 95% of the work is one person and whether they're still active is a contributor-graph read, not a glance. `touchstone`'s Healthy axis.
- **Issue-response quality.** Not the issue *count* (that you might glimpse) but whether the maintainer actually *engages* — substantive replies, recent ones answered — is a read of actual threads. `touchstone`'s issue-RESPONSE signal, distinct from issue count on purpose.
- **The slop check.** The careful AI-slop / feature-stacking diagnosis — a polished README over a thin or incoherent history, breadth without depth, fabricated benchmarks, uniform generated-looking code — is an *adversarial* pass `touchstone` runs by commanding the agent to attack. Here you catch only the empty stub and the blatant star-farm, and only because they retire on sight.
- **Per-axis scoring.** Alive / Healthy / Well-built, each scored from pulled evidence, is the whole back half of `touchstone`. None of it happens in `forage`.

Why the boundary is worth defending so hard: the sift's value is *speed*, and speed comes from refusing to look closely. The moment you start pulling commit histories to decide a borderline case, you've made discovery as expensive as evaluation, and you'll do less of both. There is also a correctness reason — a cheap glance has a high false-negative rate on quality, so a glance-based *reject* of a real repo is a genuine loss, while a glance-based *keep* of a weak one costs only one more pass through `touchstone`'s fast scan. The asymmetry says: **when in doubt, keep.** A borderline repo kept is a few seconds of `touchstone`'s time; a borderline repo wrongly culled is a find you'll never get back. Sift only removes what is *unambiguously* not worth evaluating; the rest survives to be judged where judging is cheap and deliberate. The reference for that judging is [../../touchstone/SKILL.md](../../touchstone/SKILL.md).

---

## 3. Keep for fit, not for hype — carry the suspicion forward

A survivor stays for one reason: it genuinely fits the need (targeted) or genuinely pulls (serendipitous). Not because it has the most stars. Not because its README is the slickest. Those are exactly the two signals the agent over-trusts — a high star count and a polished README are the cheapest things in a repo to fake, the mask an abandoned project or an AI-generated star-farm wears best — and the whole `quarry` suite is built around discounting them.

In sift this has a specific, narrow meaning, because you are *not* yet weighting signals (that's `touchstone`'s STAGE 2). It means: **don't let the gameable signals drive the keep/cull decision.** Concretely:

- Do not cull a strong-fit repo because it has few stars. A focused, exactly-right library with 200 stars beats an on-topic 12k-star monorepo you'd have to carve a piece out of. Stars record *past attention*, not *present fit*.
- Do not keep a weak-fit repo because it has many stars or a beautiful README. If it doesn't actually answer the need-spec, the star count doesn't rescue it — and a fluent README claiming it "supports X" is a *claim*, recorded as a claim, never confirmed here.
- When you rank or order the surviving pool to hand off, order by **fit and signs of life** (matches the need-spec, recent `pushed`, real Used-by), not by stars. The agent will default to a star-sort; override it.

You are carrying a *suspicion* forward, not resolving it. The suspicion of stars and READMEs is precisely what `touchstone` is built to test — it inverts the weighting, discounts the gameable signals to suspect-until-corroborated, and runs the adversarial slop-check. Your job in sift is the lighter one: don't let those signals do the narrowing *for* you, so that the survivors reach `touchstone` selected for fit, and `touchstone` gets to do the corroboration on a clean shortlist rather than on a star-ranked one.

---

## 4. The capture discipline — drive the recording cost to zero

A find you don't record is a find you've lost, and the cheapest discovery failure of all is the great repo you found, didn't capture, and can never find your way back to. So capture is governed by one law: **lower the cost of recording until it's free, because anything that costs a decision won't get done.** The destination was set back in STAGE 0 for exactly this reason — so that recording a hit is one line, not a choice about where it goes.

**The categorized destination.** A find lands somewhere durable, not in a browser tab. Two forms that cost nothing to maintain:

- **GitHub Star Lists** — when you star a repo, GitHub lets you file it into a named list (the "Add to list" control on the star button; lists live at `github.com/<you>?tab=stars`). A list per recurring need ("task-queue candidates", "tiny-tools to look at") turns capture into one click plus a category. This is the native home for serendipitous finds — you're already on the repo page, the star is one click, the list is the second.
- **A notes file** — a flat markdown file (or scratch list) with one line per find. Better than star-lists when you want the *why* and the provenance inline, or when the find isn't on GitHub. One line per entry, appended, never reorganized in the moment.

**The one-line "why it's here" plus provenance.** Every captured survivor carries two things beyond its name:

- the **provenance** it has carried since the cast — which seam or surface found it, and the query/surface behind it (so the list is auditable and no unsourced name slipped in);
- a **one-line reason it's here** — what it's *for*, in the words you'll understand in three months.

A captured entry looks like:

> `repo: tembot/lightq` — Celery alternative, no broker dependency, last push last week. [seam: qualifier-combo `task queue language:python stars:>500 pushed:>2026-01-01`]

> `repo: anon/strfield` — weird and lovely, no idea what for yet. [surface: Show HN, 2026-06]

The two examples are not interchangeable, and that's the next discipline.

**Two bins: "candidates for need X" vs "interesting, not sure why yet".** Capture is categorized as you go, into at minimum these two kinds:

- **Candidates for need X** — the targeted survivors, filed under the need they answer. These are headed for `touchstone` now, framed with a use-context.
- **Interesting, not sure why yet** — the serendipitous finds, the 眼前一亮 you can't yet justify. These get captured *un-judged*, on purpose. The value of a wander rarely lands the day you find it; it lands three months later when a problem arrives and you think *"wait, I starred something for this."* Forcing yourself to say what an orthogonal find is "for" at capture time is how you fail to capture it — so the legitimate one-line reason here is literally "don't know yet, but it pulled."

Categorizing as you go is what keeps the list usable instead of a flat dump you'll never re-read. It costs nothing in the moment (the bin is the star-list you click, or the heading you append under) and it's what makes the list a tool rather than a graveyard.

**Why cheap-and-immediate beats thorough-and-later.** The instinct is to capture *well* — write a paragraph, evaluate a little, tidy the entry. Resist it. A thorough entry written later is an entry not written, because "later" competes with everything else and loses. A cheap entry written *now*, in the moment the find is in front of you, is the one that actually exists. The asymmetry is the same one that governs the whole skill: the cost should match the find, and a find's capture cost should round to zero. Thoroughness is `touchstone`'s job and it's deliberate there; capture's job is to make sure the find survives long enough to *reach* `touchstone`. An immediate one-liner you can act on beats a perfect record you never wrote.

---

## 5. The handoff to `touchstone` — and the verdict that stays yours

Capture ends in two moves: marking the keepers, and handing them on. They're separate because one is the human's and one is mechanical.

**Mark the keepers — the verdict is yours.** Which candidates are worth pursuing (targeted) and which genuinely made you sit up (serendipitous — the 眼前一亮) is *your* mark, not the agent's relevance rank. The agent can order the list by fit and recency; it cannot feel the pull that makes a project worth your weekend. This is the second of `forage`'s two non-delegable judgments (the first is the need-spec / adjacency dial, set at STAGE 0). Outsource the keeper verdict and you have a tidy ranked list nobody actually wanted to open. So the keepers are *your* mark on the captured list — a star, a flag, a "→ touchstone" — applied by you.

**Hand the keepers to `touchstone` with the use-context.** For the marked keepers, frame them for the next skill. Two things travel across the handoff:

- **The targets** — the keeper repos, each still carrying its provenance, so `touchstone` inherits a sourced shortlist and starts on clean evidence rather than re-finding.
- **The use-context that sets `touchstone`'s bar** — what you'd actually *use* each for: a weekend tryout, a production dependency, a contribution target, or a thing to learn from. This is the single most important thing you hand over, because it sets the bar `touchstone` judges against. The *same* repo — a clever, fast, single-maintainer tool last touched eight months ago — is a fine pick to try for a weekend, a reasonable base to learn from, and a bad bet as a load-bearing production dependency. `touchstone`'s STAGE 0 reads the use-context to derive its bar; hand it the targets with no use and you've handed it a verdict with no scale.

The copy-ready handoff frame:

> Keepers for `touchstone`, each with provenance and use-context:
> - `<repo>` — use-context: **production dependency**. [seam: …] — found as a Celery alternative; would replace a broker-coupled queue.
> - `<repo>` — use-context: **weekend tryout / learning**. [surface: …] — interesting approach, want to read how it's built.
> Park the rest in "interesting, not sure why yet" — un-judged, not discarded.

The unmarked finds aren't thrown away. They stay in the "not sure why yet" bin, un-judged, waiting. That's not a failure of the forage — it's the point of a wander, captured cheaply against a future that hasn't arrived. The terminus of `forage` is exactly this: a small, categorized, captured shortlist, with the keepers marked by you and framed for `touchstone`, and the surprises parked where you'll find them again. Not twenty browser tabs. Not a star-ranked dump. A list you'll still have, and still understand, next month.

---

**Cross-links:** [why-mine-and-wander.md](why-mine-and-wander.md) (the foundation — the two modes, the agent's three traps, the provenance and capture-cost laws, the two non-delegable judgments) · [the-seams-and-syntax.md](the-seams-and-syntax.md) (targeted mode — the qualifiers and snowball seams that fill the pool you sift here) · [the-wandering-surfaces.md](the-wandering-surfaces.md) (serendipitous mode — the surfaces whose finds land in the "not sure why yet" bin) · [../SKILL.md](../SKILL.md) (the flight plan these stages sit in) · [../../touchstone/SKILL.md](../../touchstone/SKILL.md) (the evaluation lens that judges the keepers you hand off — bus factor, issue-RESPONSE, the slop-check, the three-axis score) · the engineering suite downstream of a passing verdict — [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (code craft), with `assay`, `aegis`, and `husbandry` for tests, security, and long-run dependency cost.

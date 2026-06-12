# Why Mine and Wander — the foundation behind STAGE 0 (Frame the hunt)

This reference is the depth behind **STAGE 0 — Frame the hunt** of the [../SKILL.md](../SKILL.md) flight plan: the must-be-told key that makes every later stage derivable rather than memorized. It installs the two modes finding happens in, the reframe that retires search-syntax fluency, the agent's role and its three signature failures in this domain, and the two disciplines — provenance and cheap capture — you set before the first query. It backs the three frame checks: `mode-and-need-fixed`, `capture-cheap-set`, and `provenance-discipline-set`. Read it once in full; the seams, the surfaces, the sift, and the capture are all consequences of what you fix here.

> A useful repository is not READ off the trending page; it is MINED out (when you have a need) or WANDERED into (when you don't), then captured before it's lost. The agent is the means — the parallel miner and the wanderer — never the judge of what's worth your time. A star count is a record of past attention, not present life; a polished README is a claim, not a quality.

---

## The whole pipeline in one line

Before the parts, the arc — so you read every section below as a piece of one machine:

> **frame the hunt (pick the mode, sharpen the aim, set the discipline) → pick the seams or surfaces → cast them in parallel with provenance → sift the dead and the duplicate cheaply → capture the survivors, categorized, and mark the keepers.**

Casting *widens* (one need or one vibe becomes a broad candidate pool); sifting *narrows* (cull the plainly-dead and the duplicate); capture *keeps* what's left where you'll find it again, and leaves the keep-or-open verdict in your hands. Everything in STAGE 0 exists to make that machine run in the right mode, aimed at the right ground, and immune to its own most dangerous input — an agent whose gradient points at handing you something that *looks* like an answer. The rest of this document is the *why* under each of those framing moves.

---

## 1. Two modes, because finding is two different jobs

Repository finding is not one activity with one method. It is two, and they fail in opposite directions if you run one's method on the other.

**TARGETED.** You arrive with a concrete need: a lightweight task queue to replace Celery, a Rust crate for SIMD JSON parsing, a reference implementation of Raft you can read. There is a right answer or a small set of them, and the job is to *converge* — surface the few repositories that genuinely fit, ranked, deduped, with the dead ones already dropped. Success is a handful of real candidates you can hand to evaluation. The enemy is the **wrong repo that looks right**: the abandoned project with a beautiful README, the star-farm, the one that claims to support your runtime but doesn't.

**SERENDIPITOUS.** You arrive with no goal. You want to be surprised — to find the thing you wouldn't have known to search for. There is no "right answer" to converge on; the job is to *range* the surfaces where good and strange projects appear and bring back what makes you sit up. Success is a captured surprise, not a shortlist. The enemy here is the *opposite* of the targeted enemy: it is **relevance** — being handed ten more of what you already follow, the popular things you've already seen, because nothing orthogonal survived the filter.

The reason they need separate methods is that **their success conditions are inverted.** Targeted finding wants precision: tight qualifiers, a sharp spec, aggressive culling of anything off-need. Run that same precision in serendipitous mode and you strangle the wander — every tight filter you add removes exactly the off-axis find that was the point. Conversely, serendipitous finding wants breadth and a tolerance for noise; run *that* in targeted mode and you drown a clean need in trending-page mush. One mode searches a defined space to convergence. The other harvests an undefined space for surprise. The first thing STAGE 0 does is make you **declare which one you're in**, because the rest of the pipeline is tuned differently for each, and a hunt run in the wrong mode is thorough work aimed at the wrong kind of result. (This declaration is half of the `mode-and-need-fixed` check; the other half is the aim, below.)

A note on the word *serendipity*. In the human-era literature review, serendipity was the accident you hoped for while reading — and a thing you could not summon on purpose. Here it is **harvested, not waited for.** You don't hope to stumble on something good; you point the wanderer at the surfaces where good things surface first (Show HN, off-peak trending, topic corners, the star feeds of people whose taste you trust) and set how far off your usual ground to roam. The surprise is still a surprise. But you manufactured the conditions for it instead of praying for them. That is the whole agent-era move on this mode: serendipity becomes a *surface you sweep*, not a lottery you enter by browsing.

---

## 2. The reframe: search-syntax mastery is commoditized

The human-era craft of finding repositories was **fluency**. You memorized the qualifiers, you learned which `awesome-*` list to grep, you built the muscle for `language:python stars:>1000 pushed:>2026-01-01` and could rattle off `in:readme`, `topic:`, `good-first-issues:>5` without looking them up. That fluency *was* the skill, because casting a query was manual and serial: you wrote one, read its page of results, refined, wrote the next. The person who knew the qualifiers cold found more, because each query cost real attention and they spent fewer of them badly.

The agent already knows every qualifier, and it can run forty queries while you type one. So that fluency is **commoditized** — the part of the old craft the machine took over completely. Clinging to it is optimizing the part you no longer own. The agent will combine `language:rust stars:100..2000 pushed:>2026-01-01 topic:parser`, then re-cast it by problem-setting, then by `created:` window, then sweep the Code search tab for how the API is actually called — in parallel, none of the runs biased by the others, faster and more exhaustively than any human fluency ever managed. Producing query strings is no longer where a human adds value.

What's left is the part the machine can't do, and it splits by mode:

- **Targeted: the NEED-SPEC.** The sharpness of one or two sentences sets the ceiling on everything downstream. "A task queue" finds noise — the commons has a thousand. "A lightweight Celery alternative with no broker dependency, still maintained in 2026, Python 3.12-compatible" finds the answer, because now "does this repo fit?" has a yes/no answer and every seam can be aimed at it. The agent cannot write this sentence for you; it doesn't know which of your constraints are deal-breakers and which are nice-to-haves. A vague need cannot be rescued by a wide search — you have only automated a thorough search of the wrong commons.
- **Serendipitous: TASTE.** When there is no spec, the human edge is the *feel* for which find is worth a second look — the 眼前一亮, the *this one's interesting*. The agent can rank by stars and recency; it cannot feel the pull that makes a weird little project worth your weekend. Taste is also what sets the adjacency dial: how far from your usual ground is *too* far to still be interesting to *you*. That's a judgment about you, which the agent doesn't hold.

So the edge moved. It used to live in the query; now it lives in the **spec** (targeted) and the **taste** (serendipitous). The agent fans the seams out wide and deep; you aim them and you judge what comes back. Polishing your own qualifier-craft is the anti-pattern this reframe names — it is rehearsing the one move the machine does better than you ever will.

---

## 3. The agent is the means, not the judge — and its three traps

The agent here has exactly two jobs, and naming them as a hard boundary matters because every misuse is a drift outside it:

- **The parallel miner (targeted).** Run every seam at once — the qualifier combos, the snowball links from a trusted person's stars, the awesome lists, the dependency graph and "Used by" count, the off-peak trending, the "what's the alternative to X?" threads in issues. This is throughput you could never match by hand, and it is the labor the agent is *for*.
- **The wanderer (serendipitous).** Range the high-signal surfaces and bring back the orthogonal finds — the ones a tight relevance filter would have killed.

Notice what is *not* on the list: **judging what's worth your time.** The agent does not decide whether a find fits your need, whether a project is genuinely good, or which surprise is worth keeping. The moment you treat its ranked list as a verdict rather than raw material — the moment you ask "is this a good repo?" and take the answer as a decision — you have promoted the means to a judge, and a judge whose gradient points at handing you something that *looks* like an answer is the most dangerous instrument in the hunt. In this specific domain that gradient produces three signature failures, and STAGE 0 is where you set the disciplines that defang them:

- **(a) It trusts the most gameable signals — stars and a polished README.** These are the two cheapest things in the commons to fake or to inherit. A star count is a record of *past* attention; an abandoned 4,000-star repo wears it as well as a living one. A README is marketing the author wrote; an AI-generated star-farm wears a *beautiful* one precisely because the README is what gets generated. The agent, optimizing for a clean confident answer, reads "12k stars, great README" as "good repo" and ranks it first. It is reading the two signals that correlate *least* with present quality.
- **(b) It invents repositories, or asserts "it supports X" without opening it.** Asked for a Celery alternative, it can produce a plausible project name with a plausible description for a repo that does not exist — a confident well-formed answer reads as more helpful than "I found three." Or it takes a *real* repo and asserts it "supports async / has a Postgres backend / runs on 3.12" without ever opening the repo to check, because the claim *fits the shape of an answer*. This is the costliest failure: a hallucinated repo wastes the afternoon you spend trying to install it, and a fabricated "it supports X" sends you down a path the project never paved.
- **(c) It flattens everything to "relevant."** Told to find interesting projects, it returns ten more of what you already follow, because "relevant to your stated interests" is the safe, approval-maximizing read of "interesting." But serendipity needed the *orthogonal* thing — the find off your usual axis. The agent's flattening instinct culls exactly the surprise that was the whole point of wandering, because the surprise scores low on on-topic-ness. Relevance is the enemy of serendipity, and the agent defaults to relevance.

These are not occasional bugs to catch later. They are the **default output** of a soft interaction, with (a) and (c) the dominant failures in targeted and serendipitous mode respectively, and (b) — invention — a hazard in both. So STAGE 0 sets two disciplines before the first query — §4 and §5 — and they are non-negotiable for the rest of the hunt.

---

## 4. The provenance rule — nothing unsourced enters the pool

Every candidate carries **where it came from**: which seam surfaced it, and the query or surface behind it. This is the `provenance-discipline-set` check, and it does two jobs at once.

First, it **kills the hallucination (failure b).** A repo that cannot name the seam and query that found it did not get found — it got generated. Provenance is the door, and a name with no source behind it doesn't get through. Concretely, every entry that enters the pool carries a real, resolvable identity — the `owner/repo`, a URL you can open — pulled from a search the agent actually ran, not a name it produced. A repo the agent *describes* but never retrieved does not exist for this purpose.

Second, it **lets you judge your own coverage.** If every candidate in the pool carries the same seam tag, you single-sourced — you under-cast, and the best find is hiding in the seam you skipped. Provenance makes that visible at a glance: a pool that's all `topic:` search and no snowball, all one trending page, tells you to go back and open more seams before you narrow. Without the tag you can't see the gap in your own net.

There is a third clause, and it is the antidote to failure (a): **stars and the README are recorded as claims, not as quality.** When a seam returns a star count or a README blurb, those facts go into the pool *as data the seam reported*, not as evidence the repo is good. Their test — is the project actually alive, actually maintained, actually what it says — is deferred to the next skill, `touchstone`. Inside `forage` they are claims awaiting corroboration, never proof. This is the discipline that stops the gameable signals from driving the ranking: you record "12k stars, last push 2026-06" as two facts the seam surfaced, and you let `touchstone` decide whether the stars mean anything.

Make the rule explicit to the agent at the outset, so its output arrives in a shape you can trust. A copy-ready standing instruction:

```
You are finding GitHub repositories for me. Standing rules for everything you
surface, no exceptions:

1. PROVENANCE. Every repository you return carries (a) its real owner/repo and a
   URL I can open, (b) the seam/surface that found it, and (c) the exact query or
   link behind it. If you cannot give all three, do not include the repo.

2. NO INVENTION. Only return repositories you actually retrieved from a search or
   a page you opened this session. Never produce a plausible-looking project name
   from memory. If you are unsure a repo exists, leave it out — do not guess.

3. NO UNVERIFIED CAPABILITY CLAIMS. Do not assert a repo "supports X / has a Y
   backend / runs on Z" unless you opened the repo and saw it. If you did not
   check, write "claims X in README — unverified" or "not checked", never a bare
   "supports X".

4. STARS AND README ARE CLAIMS. Report star count, last-push date, and README
   blurb as facts the search returned — label them as such. Do NOT rank by them
   or call a repo "good" because of them. Quality is judged later, not here.

I will spot-check your repos against their real pages. A confident wrong repo is
worse to me than an honest "I found fewer than you asked for."
```

The provenance rule is what makes the pool *auditable* — you can trace every entry back to a real source, see where your net had holes, and keep the gameable signals quarantined as claims until the skill whose job is to test them gets its turn.

---

## 5. The capture-cost law — lower the cost of recording, not finding

The agent has made *finding* nearly free: it can surface fifty candidates in the time it takes to read one. So finding is no longer the bottleneck. **Recording is.** The cheapest discovery failure in this whole skill is the great repo you found, didn't capture, and can never find again — and it happens precisely when capturing a find costs more than a glance.

The law, stated plainly: **lower the cost of RECORDING, not finding.** This inverts the human-era instinct, where finding was the scarce, effortful act and recording was the easy afterthought. Now finding is cheap and recording is where the value leaks. If capturing a surprise requires a decision — *which list does this go in? do I even want it? let me think about it* — you will not do it. You'll leave it in a browser tab, and the tab will close unread, and three months later when the problem arrives that the repo solved, it's gone.

So STAGE 0 sets the **capture destination first**, before any search runs. You decide *now* where a find lands — a categorized star-list on GitHub, a notes file, a scratch list — and you set the categories *now*: "candidates for need X", "interesting, not sure why yet". This is the `capture-cheap-set` check, and the test is concrete: recording a hit should cost **one line**, not a choice. When the destination and the buckets already exist, capturing a find is "paste the URL under the right header, add a five-word why" — friction near zero. When they don't, every capture is a small decision, and small decisions at scale don't happen.

The reason this is a STAGE 0 concern and not a STAGE 4 one is that the value of capture is invisible at the moment of finding, especially in serendipitous mode. The whole point of a wander is that the surprise pays off *later* — when a problem arrives and you think "wait, I starred something for this." If the cheap destination isn't set before you start, you'll wander, find something lovely, feel the friction of recording it, and skip it — and the wander produced nothing durable. Set the destination first and the wander's value survives the day you found it. (The mechanics of categorized capture are in [sift-and-capture.md](sift-and-capture.md); what STAGE 0 owns is *deciding the destination exists and is cheap* before the first find can be lost.)

---

## 6. The two non-delegable judgments

The pipeline parallelizes almost everything. The agent runs the seams, sweeps the surfaces, dedupes the pool, drops the plainly-dead. But **two points stay human**, and they are the two that decide whether all that parallel labor was aimed at anything worth keeping. Outsource either and you have automated a confident result nobody actually wanted.

1. **The need-spec / the adjacency dial.** *What you are hunting* (targeted) and *how far to roam* (serendipitous) decide what can even be found. In targeted mode this is the need-spec from §2 — the sentence sharp enough that fit is a yes/no, the sentence that sets the ceiling on everything downstream. In serendipitous mode it is the **adjacency dial**: how far off your usual ground to range, where more dial means more orthogonal and more noise, and zero dial means the popular things you've already seen. The agent will happily *propose* a spec or pick a default radius — and if you accept its proposal you have outsourced the one choice that shapes every candidate. The agent runs whatever you aim it at; *what to aim it at* is yours. Hand it a vague need and you've parallelized a tunnel.

2. **The "worth-a-look" verdict.** After the seams have cast and the sift has culled, *which candidates are worth pursuing* (targeted) and *which genuinely made you sit up* (serendipitous, the 眼前一亮) is your mark, not the agent's relevance rank. The agent can order the list by stars and recency; it cannot feel the pull that makes a project worth opening. This is the verdict §2 named as taste and §3 named as the thing the flattening-to-relevant trap destroys. Outsource it and you have a tidy ranked list nobody actually wanted to open — which is the open-tab graveyard wearing the costume of a result.

These two resist delegation for the same reason in two forms: each requires **what the search cannot contain.** The spec requires knowing which of your constraints are deal-breakers — a fact about your situation, not the commons. The verdict requires owning a future the agent has no stake in — the weekend you'll spend, the dependency you'll carry. The agent operates on the territory of *what exists and what scores*; both judgments live in the territory of *what's worth it to you*. Keep them, even when the agent's parallel throughput makes surrendering them feel efficient. Efficiency aimed at the wrong find, or at a find nobody wanted to open, is the most expensive thing in the hunt.

---

## What STAGE 0 leaves you holding

Frame is the cheapest stage and the one that decides whether the rest aim true. When you clear its gate you should be holding three things, one per check:

- **A declared mode with its aim fixed** (`mode-and-need-fixed`) — *targeted* with a need-spec sharp enough that "does this repo fit?" is a yes/no, or *serendipitous* with named surfaces and an adjacency dial set, so the agent is aimed before any search runs.
- **A cheap capture destination, set first** (`capture-cheap-set`) — a categorized place a find lands in one line, decided before the first find can be lost, because recording is now the bottleneck, not finding.
- **The source discipline, committed in writing and stated to the agent** (`provenance-discipline-set`) — every candidate carries its provenance, nothing unsourced or invented enters the pool, no unverified "it supports X", and stars/README recorded as claims for `touchstone` to test, never as quality here.

With those three in hand, the agent becomes what it should be — a parallel miner and a wanderer pointed at the right ground in the right mode — and never what it must not be: a judge whose eagerness to hand you something that looks like an answer decides what you sink an afternoon into. Now open the seams ([the-seams-and-syntax.md](the-seams-and-syntax.md)) or the surfaces ([the-wandering-surfaces.md](the-wandering-surfaces.md)) and start the cast.

---

**Cross-links:** [the-seams-and-syntax.md](the-seams-and-syntax.md) (TARGETED mode — the qualifiers and snowball seams in depth) · [the-wandering-surfaces.md](the-wandering-surfaces.md) (SERENDIPITOUS mode — the high-signal surfaces and the adjacency dial) · [sift-and-capture.md](sift-and-capture.md) (the cheap cull and the categorized-capture discipline) · [../SKILL.md](../SKILL.md) (the forage flight plan) · [../../touchstone/SKILL.md](../../touchstone/SKILL.md) (the sibling that *judges* what `forage` finds — where stars and READMEs are finally tested) · downstream when a find is worth committing to: [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (code craft), [../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md) (its tests), [../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md) (dependency/security posture), [../../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md) (taking it on as a long-lived dependency).

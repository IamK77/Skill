# The Wandering Surfaces — the serendipitous method behind STAGE 1-2 (Seams / Cast)

This reference is the depth behind **STAGE 1 — Pick the seams** and **STAGE 2 — Cast** of the [../SKILL.md](../SKILL.md) flight plan, in its **serendipitous** mode: the catalogue of high-density *surfaces* where good projects surface first, the **adjacency dial** that steers a wander toward the orthogonal instead of more-of-the-same, and the **frequency-beats-duration** cadence that keeps you in front of those surfaces while their exposure windows are open. It backs the serendipitous reading of the STAGE 1 checks `seams-or-surfaces-planned` and `activity-and-orthogonality-bias-set`, and the STAGE 2 checks `fanout-run-with-provenance` and `pool-wide-enough`. Read it when the call is "show me something interesting" rather than "find me a Celery alternative" — the qualifier combos and snowball seams for the latter live in [the-seams-and-syntax.md](the-seams-and-syntax.md).

> Serendipity is HARVESTED, not searched. You cannot query for the thing you didn't know to want — but you can stand, every day, on the surfaces where that thing surfaces first, and capture it the instant it does. The agent maximizes the exposure and drives the capture cost to zero; the surprise verdict — the 眼前一亮 — stays yours.

---

## Why a wander needs its own method

Targeted mining starts from a need-spec and converges: every seam is aimed at the same hole, and the win is the candidate that fits. A wander does the opposite. It starts from *nothing* — no spec to converge on — and its win is the find you could not have specified, because if you could have written the need-spec, you'd have run the targeted pipeline instead. That difference is structural, and it breaks the targeted toolkit in two places.

First, **the search box is the wrong instrument.** A query is a request for what you already named. `language:rust stars:>500` returns Rust repositories you'd recognize the shape of; it cannot return the weird Forth interpreter that makes you rethink how you parse, because "weird Forth interpreter" was not in the query and never would have been. Serendipity does not live in the search index keyed by your words. It lives where *other people's* judgment has already concentrated interesting things — a front page, a curated list, a trusted person's stars. So the serendipitous unit is not a query, it is a **surface**: a place where finds accumulate by someone else's filter, and you sweep what washed up.

Second, **the agent's relevance gradient is actively hostile here.** In targeted mode "more relevant" is the goal. In a wander it is the enemy. Asked to "find interesting projects," the agent's path of least resistance is to return ten more of what you already follow — same language, same domain, same tier of popular — because those score highest on every similarity metric it has. That is the **flatten-to-relevant** failure named in [why-mine-and-wander.md](why-mine-and-wander.md), and it is the specific way a wander dies: it quietly collapses into a recommendation feed for things you've already seen. The whole method below is built to fight that collapse — to point exposure at the orthogonal and to stop the agent culling a find for being off-keyword, because off-keyword is the entire point.

The division of labor is the same as everywhere in `forage`. The agent is the **wanderer**: it ranges every surface in parallel, replays the ones that move while you sleep, and captures each find with its provenance so none is lost. It does two things no human has the throughput for — **maximize exposure** (be on twelve surfaces at once, every day) and **slash capture cost** (one find, one line, already categorized). What it cannot do is feel the pull. Whether a find is *genuinely* interesting or merely novel-shaped is the one judgment that does not delegate, and the surfaces exist to put more candidates in front of that judgment, not to replace it.

---

## The surfaces — where good projects surface first

A surface is good for a wander when three things are true of it: finds accumulate there by *someone's* filter (not raw chronology), the filter is *not your own past behavior* (so it can surprise you), and there's a **ranked replay** so you don't have to be present at the moment of cresting. The surfaces below are ordered roughly by signal density. For each: what it's good for, and exactly how to sweep it.

### Hacker News "Show HN" — the highest-density surface for the brand-new

**What it's good for.** `Show HN` is the channel where people post the thing they just built. It is the earliest a project surfaces to a discerning crowd — often the repo's first hundred stars happen here — and the crowd is technical enough that the comment section is itself a filter (the top comment is frequently "here's the prior art you missed" or "this is the one real idea"). It skews toward the *new and the personal*: weekend projects, from-scratch reimplementations, tools someone scratched their own itch with. That is exactly the orthogonal-rich material a wander wants and a star-sorted search will never show you, because these projects are too young to have stars.

**How to sweep it.** The live `Show HN` feed is chronological, which means you have to be present — bad for a wander, whose value is frequency not vigil. The fix is **ranked replay**: read the *past* window, sorted by what the crowd elevated, on a cadence that fits you. Two surfaces do this.

[hn.algolia.com](https://hn.algolia.com) is the replay you want. Its **web UI** takes URL parameters like `query`, `type=story`, `sort=byPopularity` or `sort=byDate`, and `dateRange`. The underlying **REST API** has two endpoints — `/api/v1/search` (custom-ranked by relevance, points, and comments) and `/api/v1/search_by_date` (most-recent-first) — filtered with `tags`, `numericFilters`, `hitsPerPage`, and `page`; you pick recency-vs-relevance by which endpoint you call, not a `sort` parameter. The copy-ready wander sweep:

> Pull the top "Show HN" stories of the past week from the HN Algolia API, ranked by points. Hit `https://hn.algolia.com/api/v1/search?tags=show_hn&numericFilters=created_at_i>{one_week_ago_unix}&hitsPerPage=50`. For each story return: the title, the points, the comment count, and the linked URL — and if the URL is a github.com repo, the repo's one-line description and last-push date. Do NOT filter by topic or relevance to anything; bring back the whole ranked window. Tag each with provenance `Show HN / week of {date}`.

[hckrnews.com](https://hckrnews.com) is the complementary replay: it shows HN's front page *by day*, with the top stories of each day and a points threshold, so you can scan "what crested on HN last Tuesday" in one screen. Good when you want the broader front page (not just Show HN) replayed day by day.

The tag filter is the load-bearing detail. `tags=show_hn` isolates the built-a-thing posts from the link-aggregation and discussion that dominate the rest of HN. Without it you sweep the whole front page and drown the repos in news.

### github.com/trending — off-peak and all-language

**What it's good for.** [github.com/trending](https://github.com/trending) is the canonical "what's gaining stars right now" surface. Used naively it is one of the worst surfaces for a wander — the default daily English-JavaScript view is the most-seen page in open source, and sweeping it returns exactly the popular things everyone already saw. Two knobs turn it from a noise generator into a wander surface.

**The cadence knob: monthly beats daily.** The `since` parameter takes `daily`, `weekly`, `monthly`. Daily trending is dominated by the hype-of-the-hour — a launch, a HN spike, a viral thread — and reverts the next day. **`since=monthly`** filters for the projects that gained sustained attention over weeks, which is a far better proxy for "real" than a one-day spike, and it is *slower-moving*, so a once-a-week sweep of monthly trending doesn't miss much. Daily wants vigilance; monthly rewards frequency-without-vigilance, which is the cadence a wander can actually sustain.

**The language knob: leave the popular languages.** The `spoken_language_code` parameter filters by the *natural* language of the repo's docs (`en`, `zh`, `es`, `ja`, ...), and the path segment filters by *programming* language (`/trending/rust`, `/trending/zig`). The wander move is to deliberately leave the crowded lanes. Trending in an **uncommon language** — Zig, Nim, Elixir, OCaml, Crystal, Roc — is a different population: smaller, more craft-driven, far more likely to surface something you wouldn't have searched for, because the people writing Zig are disproportionately the people doing something structurally unusual. And switching `spoken_language_code` to a language you don't read (`zh`, `ja`, `ko`) surfaces a near-disjoint world of projects that the English-default trending never shows. The copy-ready sweep:

> Sweep github.com/trending across a spread of languages and windows, all at once. Fetch `https://github.com/trending/{lang}?since=monthly` for lang in {zig, nim, elixir, ocaml, crystal, roc, haskell} and `https://github.com/trending?since=monthly&spoken_language_code={code}` for code in {zh, ja, de}. For each repo return name, description, language, and the period's star gain. Bring back everything — do not pre-filter to my interests; the point is the language I don't write. Tag provenance as `trending / {lang or spoken-lang} / monthly`.

The reason to fan these in parallel is the agent's whole edge: a human checks one trending view and gives up; the agent checks twelve disjoint ones in the time it takes to read the first.

### github.com/topics — the corners

**What it's good for.** [github.com/topics](https://github.com/topics) is GitHub's tag index. Every topic — `github.com/topics/{topic}` — is a page of repos that declared themselves part of that subject, sortable by stars and by recently-updated. The wander value is in the *named, vivid corners*: topics specific enough that the page is curated by self-selection rather than flooded. The broad topics (`machine-learning`, `web`) are red oceans. The vivid ones are gardens. Real examples worth wandering:

- [github.com/topics/awesome](https://github.com/topics/awesome) — the index of curated lists themselves; each one is a surface inside the surface.
- [github.com/topics/tui](https://github.com/topics/tui) and `github.com/topics/terminal` — terminal UI craft, a corner that attracts the obsessive.
- [github.com/topics/esolang](https://github.com/topics/esolang) — esoteric programming languages, pure orthogonality by construction.
- [github.com/topics/creative-coding](https://github.com/topics/creative-coding), `github.com/topics/generative-art` — visual, weird, rarely on your daily feed.
- `github.com/topics/self-hosted`, `github.com/topics/single-file`, `github.com/topics/zero-dependency` — corners defined by a *value* (own your data, fit in one file, no deps) rather than a domain, which is where the taste-driven projects cluster.
- `github.com/topics/raspberry-pi`, `github.com/topics/homelab`, `github.com/topics/plan9` — communities-of-practice with their own aesthetic.

**How to sweep it.** Pick the corners by the value you're curious about, not the domain you already work in, and sort by recently-updated to catch the alive ones rather than the canonical dead ones:

> For each topic in {esolang, tui, single-file, creative-coding, plan9}, fetch `https://github.com/topics/{topic}` and list the repos on the first page or two, with name, description, stars, and last-update. Surface the *odd* ones — the projects whose description made you go "huh" — not the most-starred canonical entry I'd already know. Tag provenance `topic/{topic}`.

The named-corner discipline is what keeps this from collapsing into search. You are not querying for relevance; you are walking into a room curated by a value and seeing who's there.

### The vibe keywords — `tiny`, `toy`, `from-scratch`, `weekend-project`

**What it's good for.** There are two kinds of keyword. **Functional keywords** name *what a thing does* — `parser`, `scheduler`, `orm`, `http-client` — and they're for targeted mode, where you want the tool that does the job. **Vibe keywords** name *how a thing was made or what spirit it's in* — and they're the serendipitous instrument, because they filter for the projects built for love, learning, or constraint rather than for adoption. Those are the projects that surprise. The vibe set:

- `tiny`, `minimal`, `nano`, `micro` — built under a size constraint, which forces clarity and often reveals the irreducible core of an idea.
- `toy`, `experimental`, `playground` — built to explore, not to ship; the author was following curiosity.
- `from-scratch`, `from-first-principles`, `no-dependencies`, `zero-dependency` — built to understand by rebuilding; these are the best things to *learn* from.
- `in-1000-lines`, `in-a-weekend`, `weekend-project`, `100-lines` — built under a time or line budget, the "here's the whole idea, small enough to read in one sitting" genre.
- `reimplementation`, `clone`, `educational`, `annotated` — built to illuminate something that already exists by doing it transparently.

**How to sweep it.** Run them as repo-search terms across `in:name,description,readme`, biased to recent so you get living experiments rather than abandoned ones, and *do not* combine them with a functional keyword (that re-collapses you into targeted mode). The copy-ready sweep:

> Search GitHub repos for each vibe keyword in {tiny, toy, "from scratch", "in 1000 lines", weekend-project, "no dependencies"}, matching name/description/readme, sorted by recently-updated, pushed in the last year. For each: name, description, language, stars, last-push. Bring back the whole spread per keyword — do NOT narrow by topic or my stated interests. Tag provenance `vibe:{keyword}`.

A `tiny` raytracer, a `from-scratch` TCP stack, a database `in-1000-lines` — none of these answer a need-spec, and all of them are the kind of thing a wander exists to find.

### Star feeds of people whose taste you trust

**What it's good for.** This is the single highest-signal serendipitous surface, because the filter is a *human you've calibrated on*. When you've watched someone's taste long enough to trust it, their stars are a pre-filtered stream of things that passed a judgment like yours — which is exactly the surprise-verdict you can't delegate to the agent, borrowed from a person who's already exercised it. A trusted person's recent stars beat any algorithm, because the algorithm optimizes for relevance and the person optimizes for *interesting*.

Two feeds:

- **A specific person's stars:** [github.com/{user}?tab=stars](https://github.com/sindresorhus?tab=stars) lists what they've starred, most-recent first. Keep a short list of five to ten developers whose taste you trust and sweep their recent stars on a cadence. The ones who star widely and weirdly are worth more than the ones who star only their own ecosystem.
- **Your home feed of who you follow:** github.com's logged-in dashboard surfaces "X starred Y" and "X created Y" events from the people you follow. This is passive serendipity — the surface comes to you — and it's worth curating your *follow* list specifically for it: follow the people whose stars you'd want to see, not just the famous ones.

**How to sweep it.**

> For each user in my trusted-taste list {user1, user2, ...}, fetch `https://github.com/{user}?tab=stars` and list their 20 most recent stars with name, description, and when starred. Flag any repo that appears in *two or more* of these people's recent stars — convergent taste is a strong signal. Bring back all of them with provenance `stars/{user}`; do not cull for relevance to my work.

The convergence flag matters: a repo two trusted people independently starred is the serendipitous analogue of a gap that surfaced under two seams in targeted mode — the cross-confirmation is the signal.

### Curator newsletters and aggregators

**What it's good for.** Some people make a *practice* of finding and writing up good projects, and their output is a surface with an extremely high hit rate, because the curation labor is already done. These are good for the *steady drip* — the things that don't trend and don't hit Show HN but are quietly excellent. Named sources worth subscribing to or sweeping:

- **[Console.dev](https://console.dev)** — a weekly newsletter reviewing developer tools and beta projects; tight editorial taste, low volume, high signal.
- **[HelloGitHub](https://hellogithub.com)** — a monthly roundup (originally Chinese, with English) specifically of *interesting, beginner-friendly, and fun* GitHub projects; explicitly curated for the wander spirit rather than the popular.
- **[lobste.rs](https://lobste.rs)** — a smaller, tag-driven, invite-only HN alternative with a more systems-and-craft-leaning crowd; its front page and its tag pages (`lobste.rs/t/{tag}`) are a different population from HN, and the overlap is small enough to be worth sweeping both.
- **[r/coolgithubprojects](https://reddit.com/r/coolgithubprojects)** — a subreddit that is exactly its name; flairs by language, lower editorial bar than Console but broad reach.

**How to sweep it.** These move slowly, so a weekly or monthly sweep suffices, and several have feeds the agent can pull directly:

> Pull the latest issue of Console.dev and the current HelloGitHub monthly, the lobste.rs front page, and the top of the week from r/coolgithubprojects. For each, list the projects mentioned with name, link, and the one-line reason the curator highlighted it. Keep the curator's framing — it's the human filter I'm borrowing. Tag provenance `curator/{source}`.

The "keep the curator's framing" instruction matters: the reason *they* found it interesting is itself a piece of taste, and worth capturing alongside the repo.

---

## The adjacency dial — steering toward the orthogonal

The surfaces put finds in front of you. The **adjacency dial** decides *how far from your usual ground* those finds are allowed to be — and it is the control that separates a real wander from a recommendation feed. Set it low and every surface gets filtered back toward what you already know; set it high and you roam into territory you'd never have searched. It is the serendipitous twin of the targeted need-spec: the one knob you, not the agent, must set, because the agent's default is dial-at-zero (maximum relevance, maximum more-of-the-same).

Think of it as a setting from 1 to 3:

- **Dial 1 — adjacent.** Neighboring languages and tools in your own domain. A Rust web developer wandering into Rust CLI tooling, or into Go web frameworks. Useful for staying current; weakest for surprise, because it's still *your* world.
- **Dial 2 — one field over.** A different domain that shares a technique or a value with yours. The web developer wandering into game-engine ECS design, or into embedded constraint-driven coding, or into the demoscene. The overlap is a *transferable idea*, not a shared toolchain — this is where most genuinely useful surprises live.
- **Dial 3 — orthogonal.** Deliberately unrelated. The web developer wandering into Plan 9, into music-tracker software, into esolangs, into scientific-computing Fortran. Lowest hit rate, highest ceiling: most of it won't apply, but the one thing that does will reframe how you think, because it came from a tradition that solved your problem under different constraints.

**How to turn the dial in practice.** It's not a parameter you type; it's the *distance* you instruct the wanderer to keep from your starting point. Concretely, you set it by choosing which surfaces and which corners to sweep:

> My usual ground is {your domain/language}. Set the adjacency dial to 2 — one field over. Choose trending languages, github.com/topics corners, and vibe-keyword sweeps that share a *technique or a value* with my work but NOT my toolchain or domain. Explicitly exclude my own ecosystem's repos from this wander; I see those already. For each find, tell me the one transferable idea it might carry back to my work.

The dial also defends against the agent's flatten-to-relevant gradient, by naming the failure as a constraint: *exclude my own ecosystem*. Left unsaid, the agent re-centers on what's relevant to you and the dial drifts back to zero. Said explicitly, "the point is the field I don't work in" becomes the instruction the agent optimizes toward — the same adversarial-framing move the targeted pipeline uses against the relevance gradient, pointed here at the orthogonal.

One more discipline the dial enforces, at STAGE 2: **do not let the agent cull a find for being off-keyword.** When the dial is high, most finds *will* be off-keyword — that is the dial working, not failing. A find that "doesn't match your stated interests" is precisely the candidate a wander exists to surface, and an agent left to its relevance instinct will quietly drop it as noise. The bias you set at STAGE 1 (`activity-and-orthogonality-bias-set`) is the explicit counter-order: *bring back the orthogonal, especially the orthogonal; the surprise verdict is mine to make, not yours to pre-empt.*

---

## Frequency beats duration — the cadence

The last piece is not a surface or a knob, it is a *rhythm*, and it is the one most people get wrong. The instinct is to batch: "I'll set aside two hours next month to discover some projects." That loses, badly, to **five minutes daily**, for one structural reason — **exposure windows are short.** A `Show HN` post is on the front page for hours. A daily-trending repo reverts in a day. A trusted person's star scrolls down their feed in a week. The interesting thing surfaces and then sinks, and if your only sweep is monthly, you systematically miss everything whose window was shorter than a month — which is most of the new, which is most of what a wander is for.

So the cadence rule is: **frequency beats duration.** A small, daily exposure catches the windows; a large, infrequent one watches the same already-cresting surface and finds only what stayed up long enough to still be there — the popular things, the very failure mode the wander was trying to escape. Two hours monthly is structurally biased toward the un-surprising.

This is the single place the agent changes the economics most. A daily five-minute human sweep is hard to sustain and shallow. The agent makes it free and deep: it runs the full fan-out — Show HN replay, monthly trending across a dozen languages, the topic corners, the vibe keywords, the trusted star feeds, the curator drip — *every day*, in parallel, and hands you back one short, deduped, already-categorized digest. You spend your five minutes on the *verdict*, not the gathering. The standing instruction:

> Run my full wander fan-out daily: the past-week top Show HN, monthly trending across {language spread}, my {topic} corners, my vibe-keyword sweep, and the recent stars of my trusted-taste list. Dedup against what you showed me the previous days. Return ONE short digest, categorized by surface, each find one line with its provenance. I will mark the ones worth a look; capture the rest into the "interesting, not sure why yet" list so nothing is lost.

Two things stay human inside that cadence. The **frequency you can sustain** is a real choice — daily if the agent does the gathering, weekly if you want a denser digest; the rule is just that *more-frequent-and-smaller* beats *rarer-and-bigger*. And the **verdict every time** is yours: the agent's daily digest is a tray of candidates held up to your taste, never a list of things it decided were good. It maximizes exposure and drives the capture cost toward zero — the two things it's for — and leaves the one thing it can't do, the felt pull of *this one's worth a look*, exactly where it belongs. From there the finds flow into the cheap, categorized capture that [sift-and-capture.md](sift-and-capture.md) governs, so a wander ends as a kept shortlist and not an open-tab graveyard.

---

**Cross-links:** [why-mine-and-wander.md](why-mine-and-wander.md) (the foundation — the two modes, the agent's three traps, the provenance and capture rules) · [the-seams-and-syntax.md](the-seams-and-syntax.md) (the targeted twin — qualifier combos and snowball seams for when you arrive with a need-spec) · [sift-and-capture.md](sift-and-capture.md) (where the wander's finds get culled cheaply and captured categorized) · [../SKILL.md](../SKILL.md) (the five-stage flight plan these surfaces serve) · [../touchstone/SKILL.md](../../touchstone/SKILL.md) (where a captured keeper goes to be judged genuine-quality or gameable-noise) · for a find worth building on, the engineering suite: [../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (its code craft), [../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md) (taking it on as a long-lived dependency).

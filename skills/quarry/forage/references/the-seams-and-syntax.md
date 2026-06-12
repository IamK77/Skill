# The Seams and Syntax — the targeted-mode method behind STAGE 1-2 (Seams / Cast)

This reference is the depth behind **STAGE 1 — Pick the seams** and **STAGE 2 — Cast** of the [../SKILL.md](../SKILL.md) flight plan, in **targeted** mode. It is the catalogue of *how you dig for a known need*: the advanced-search qualifiers the agent already knows cold, the combinations that actually separate a live repo from a star-farm, and the snowball seams that find the repos search never will — each with a copy-ready agent instruction and its characteristic false positive. It backs the seams checks `seams-or-surfaces-planned` and `activity-and-orthogonality-bias-set`, and the cast checks `fanout-run-with-provenance` and `pool-wide-enough`.

The governing fact, restated because every seam below is judged against it:

> The search syntax is no longer the skill. The agent knows every qualifier and runs forty queries while you type one, so fluency is commoditized — your edge is the need-spec and which seams to mine. And a star count records *past* attention, not present life: the dead high-star repo is the trap this whole stage is built to catch.

---

## What a seam is, and why you run three or four

A **seam** is a fixed source you mine for candidates: a repeatable instruction you point the agent at, that returns a list of repos with the evidence that surfaced each. There are two families. **Qualifier-combo search** is GitHub's own search box, driven by the right combination of qualifiers — wide, fast, and exactly the labor the agent is for. **Snowballing** is the set of seams that follow a *trust link* instead of a keyword: a person's stars, a curated list, a dependency edge, a "Used by" count, an off-peak trending slice, an "alternatives" thread. Snowball seams reach the repos that don't rank for your keyword and that GitHub search will never hand you.

You run **at least three or four, in parallel, blind to each other.** Single-sourcing is the way you miss the best find — every awesome-list curator has blind spots, every dependency graph is one project's taste, search ranking buries the new and the differently-named. Run a qualifier combo *and* a person's stars *and* an awesome-list *and* the dependents graph at once, none knowing what the others turned up, and read the four lists side by side. When the same repo shows up under two independent seams, that convergence is a real signal it's worth a look — not redundant work. A repo only one narrow seam can see is a thinner bet. If your whole pool came from one seam, you under-cast; go back and open more before you narrow (this is what `pool-wide-enough` checks).

**Tag every candidate with its provenance.** Each repo enters the pool carrying the seam that surfaced it and the exact query or link behind it. Two reasons, both load-bearing. First, coverage: if every candidate traces to one seam, the tags make the under-cast visible. Second, the hallucination guard — the agent invents plausible repo names and asserts "this one supports X" for repos it never opened, so nothing enters the pool that the agent didn't actually retrieve from a source, and the provenance tag is the proof it did. Record only the cheap facts the seam already returned (name, one-line description, last-push date, stars or Used-by if shown). Do **not** start evaluating here; bus factor, issue-response quality, the slop check belong to `touchstone`, and pulling them forward defeats cheap discovery.

---

## The false positive that rules them all — the DEAD HIGH-STAR REPO

Lead with this because it is the trap every seam can produce and the one the agent walks into by default: **a repository with thousands of stars and a beautiful README that has not shipped a commit in three years.**

Stars are a **record of past attention.** They accreted during one viral week in 2021 — a Show HN, a conference talk, a "10 tools you must know" listicle — and they *never decay.* A repo that was abandoned the month after it trended carries the same star count today as one shipping weekly. The README is worse: it is **marketing**, written once to win those stars, and it keeps promising features the code stopped supporting two maintainer-departures ago. These are the two most gameable signals on the platform, and they are exactly the two the agent's gradient reaches for, because a high star count and a fluent README *read as* a confident answer. The agent feels none of the afternoon you'll lose discovering, after you've built against it, that the project is a corpse.

So the bias is fixed before the first query (`activity-and-orthogonality-bias-set`): **weight what survives, not what scored.** The live signals, in rough order of how hard they are to fake:

- **`pushed` date.** When did real work last land? Recent `pushed` is the cheapest liveness check there is, and it belongs in nearly every qualifier query. A repo with 8k stars and `pushed:<2023-01-01` is a museum piece.
- **Real usage — the "Used by" / dependents count.** How many *other* repos actually depend on this one. Stars cost a click; a dependency edge means someone shipped it. This is the **Seam E** signal below, and it is the single hardest number to game.
- **Release recency.** A tagged release in the last few months says someone still cuts versions. (An empty releases page next to a five-figure star count is a tell.)
- **Issue and PR cadence.** Issues opened *and closed* recently, PRs merged, maintainers replying. A repo with hundreds of open issues and no maintainer comment since 2022 is staffed by ghosts.

Make the rule explicit to the agent at the top of the run, so a dead star-farm never enters the pool wearing its stars as a crown:

> For every candidate you surface, report the last-push date, the latest release date (or "none"), and the "Used by" count if GitHub shows one — alongside the star count, never in place of it. Rank and present by liveness (recent push, real dependents, recent release), not by stars. Flag any repo whose stars are high but whose last push is older than ~18 months as "STALE — stars are historical." Never describe a repo as "actively maintained" or "popular" unless the push/release/issue evidence shows it; if you cannot see that evidence, say so.

Every seam below produces its own variant of this false positive. They all reduce to the same lesson: corroborate the gameable signal against a hard one before the repo earns a place on the list.

---

## Seam A — qualifier-combo search (the wide net)

This is GitHub's search box (`github.com/search`), driven by the right qualifier combination. The agent knows the syntax; your job is the *combination* that fits the need-spec. The qualifiers that matter, with verified literal syntax:

- **`language:`** — the runtime. `language:python`, `language:rust`, `language:typescript`.
- **`stars:`** — a floor or a range. `stars:>500`, `stars:>=1000`, `stars:200..2000`. Use it as a *noise filter*, not a quality signal — a floor cuts the empty stubs, but never read a high number as "good."
- **`pushed:`** — last-activity date, the liveness qualifier. `pushed:>2026-01-01` keeps only what shipped this year. This is the one that kills the dead high-star repo at the query stage.
- **`created:`** — repo birth date. `created:>2025-01-01` finds the new entrants the star ranking buries; `created:<2018-01-01` finds the battle-tested old guard.
- **`topic:`** — a curated label maintainers self-apply. `topic:task-queue`, `topic:vector-database`. Topics are higher-signal than free-text because the maintainer chose to file under them.
- **`in:readme` / `in:description` / `in:name`** — restrict where the term matches. `broker-less in:readme`, `celery alternative in:description`, `queue in:name`. `in:readme` finds repos that *talk about* a concept even when it isn't in the name.
- **`good-first-issues:` / `help-wanted-issues:`** — for contribution hunts. `good-first-issues:>2`, `help-wanted-issues:>4`. These surface projects that have *labeled* welcoming work, which is itself a maintainer-health signal.
- **`archived:false`** — drop the explicitly retired. `archived:false` belongs on almost every contribution query; an archived repo accepts no PRs.
- **`mirror:false`** — cut the read-only mirrors that clone a real project's stars without its life. (Forks are excluded from repository search by default; add `fork:true` or `fork:only` only when you want to *include* them.)
- **`license:`** — when the license is a hard constraint. `license:apache-2.0`, `license:mit`.

The combination is where the need-spec turns into a query. A worked copy-ready instruction for the running example ("a lightweight Celery alternative, no broker dependency, still maintained in 2026, Python"):

> Run these as separate searches and merge the results, tagging each repo with the query that found it:
> 1. `language:python topic:task-queue pushed:>2026-01-01 archived:false stars:>100`
> 2. `language:python "celery alternative" in:readme pushed:>2025-06-01 archived:false`
> 3. `language:python broker-less in:readme topic:queue pushed:>2025-01-01`
> 4. `language:python topic:job-queue created:>2024-01-01 archived:false` (the new entrants ranking hides)
> For each hit return: name, one-line description, last-push date, latest-release date, stars, "Used by" count if shown. Do not filter for quality — return the pool; flag anything pushed before 2024 as STALE.

Vary one axis per query: same need, different `topic`, different `in:` field, a `created:` slice for the newcomers. Four queries from one need-spec, each catching what the others' ranking drops.

**The Code search tab — how an API is *really* used.** GitHub's modern code search (`github.com/search?type=code`) searches file contents across the platform, and it answers a question the repo search can't: *who actually imports and uses this thing, and how.* It supports exact strings in quotes (`"from celery import"`), boolean operators (`(language:python OR language:cython) AND NOT path:"/tests/"`), path filters (`path:*.py`, `path:/src/**/*.ts`), the `symbol:` qualifier for function and class definitions, and full **regex surrounded in slashes** (`/import\s+huey/`). This is how you find real production usage rather than READMEs that merely *mention* a library:

> Use the Code search tab. Search `language:python /from (huey|rq|dramatiq) import/` across public repos and report which import appears in the most *real, non-fork, non-tutorial* repositories. Also search `"broker_url" path:*.py` to find live configuration usage. The goal is which alternative is actually wired into running code, not which is described in prose.

**Characteristic false positive of seam A:** the **keyword-stuffed README.** A repo whose description front-loads every fashionable term to rank — "fast, lightweight, distributed, async, broker-less task queue" — on top of two hundred lines of stub. `in:readme` ranks it; the code behind it is empty. The cure is the same as always: `pushed` date, a glance at the file tree, and the Used-by number. A README that says everything and a commit log that says nothing is the AI-generated star-farm's signature.

---

## Seam B — a trusted developer's stars page

The fastest snowball: find one developer whose taste in *this* domain you trust — a known maintainer in the space, the author of a tool you already rely on, a prolific contributor — and read what *they* starred. Their stars page (`github.com/<user>?tab=stars`) is a hand-curated feed by someone with domain judgment and no incentive to inflate. It reaches sideways into repos that share no keyword with your search but solve adjacent problems the curator cares about.

> Look at the starred repositories of `<github-username>`, a trusted maintainer in `<domain>`. Filter to repos relevant to my need-spec: `<need-spec>`. For each, return name, description, last-push date, and why it plausibly fits. Then also check who *that person follows* and surface one or two of their stars too — the taste-graph is transitive.

**Characteristic false positive of seam B:** the **aspirational star.** People star things to read later, to bookmark a clever idea, to support a friend's first project — not only things they vouch for or use. A star on a stranger's page means "this caught my eye once," which is weaker than "I depend on this." Treat a starred repo as a *lead*, then apply the liveness check; the curator's attention got it onto your radar, it doesn't certify the repo is alive.

---

## Seam C — the relevant `awesome-*` list

For almost any domain there is an `awesome-<topic>` repository: a curated, categorized index of the field's tools, maintained by people who track it. `awesome-python`, `awesome-rust`, `awesome-selfhosted`, `awesome-vector-search`. Find the list, read the section that matches your need, and you get a pre-categorized candidate set with one-line descriptions someone already wrote.

> Find the `awesome-<topic>` list(s) for `<domain>` (search GitHub for `awesome <topic>` and `topic:awesome-list <topic>`). Open the section matching `<need-spec>`. Return every entry in that section with its name, the list's one-line description, and the repo's actual last-push date — flag any whose link is dead or whose repo is archived. Note which list and which section each came from.

**Characteristic false positive of seam C:** the **stale list entry.** Awesome lists accrete and rarely prune. An entry added in 2019 sits there forever, even after the project it points to died — and worse, the list inherits the curator's *cutoff*: anything newer than the last burst of maintenance is simply absent, so a list can be confidently complete and three years out of date. Cross-check every entry's `pushed` date, and never treat the list's existence as currency. A well-starred awesome-list with a last commit in 2022 is itself a stale high-star repo.

---

## Seam D — a known-good project's dependency manifest

Pick a project you already trust in the space and read its **dependency manifest** — `package.json`, `pyproject.toml` / `requirements.txt`, `Cargo.toml`, `go.mod`. Its dependencies are libraries that a real, working project chose, vetted enough to ship against. This is taste expressed through *commitment*, the strongest kind: someone built on these and it held. GitHub also surfaces a parsed view at `github.com/<owner>/<repo>/network/dependencies`.

> Open the dependency manifest of `<owner>/<repo>` (a project I trust in `<domain>`). List its direct dependencies relevant to `<need-spec>`, with each dependency's repo, last-push date, and what role it plays in the project. Prefer dependencies that are themselves actively maintained. Also note any dependency that does something adjacent to my need even if not exactly it.

**Characteristic false positive of seam D:** the **legacy / transitive dependency.** A manifest also carries things pinned years ago and never revisited, plus deep transitive deps the authors never chose deliberately. A dependency's presence means "this project uses it," not "this project would pick it again today." Stick to *direct* dependencies, and check whether the trusted project itself is still maintained — a dead project's manifest is a snapshot of dead choices.

---

## Seam E — the "Used by" count and the dependents graph

The inverse of seam D, and the **hardest signal on the platform to fake.** GitHub's dependency graph records which repos depend on a given one, surfaced as the **"Used by"** number on the repo page and the full list at `github.com/<owner>/<repo>/network/dependents`. A star costs a click; a dependent means someone wired the library into a project and shipped. High "Used by" with recent dependents is real, present-tense usage — exactly the corroboration the dead high-star repo lacks.

Run it two ways. To *measure* a candidate already in your pool, read its Used-by. To *find* candidates, start from a known-good repo and walk its dependents to discover the ecosystem built around it:

> For `<owner>/<repo>`, report the "Used by" count and open the dependents network (`/network/dependents`). List notable, actively-maintained repos that depend on it — these are real users and often adjacent tools worth their own look. Then, for each candidate already in my pool, report its own "Used by" count so I can rank by real usage, not stars.

**Characteristic false positive of seam E:** **inflated dependent counts from forks and templates.** The graph counts forks, abandoned toy projects, and repos generated from a starter template that happened to include the dependency — none of which is a vouching user. A five-figure "Used by" that is mostly forks of one tutorial overstates real adoption. Sample the actual dependents: are they real, distinct, maintained projects, or a fork-cloud? The number is strong only when the repos behind it are.

---

## Seam F — off-peak (weekly / monthly) trending

`github.com/trending` defaults to daily, which is dominated by whatever spiked on Hacker News in the last twelve hours — loud, ephemeral, often a single splashy post. Switch the range to **weekly or monthly** (`?since=weekly`, `?since=monthly`) and filter by language (`/trending/python?since=monthly`) and the noise settles into projects with *sustained* momentum: repos that climbed and stayed, not a one-day flash. For a targeted hunt, the language- and topic-scoped monthly view surfaces tools gaining steady real traction in your stack.

> Open `github.com/trending/<language>?since=monthly`. Return repos relevant to `<need-spec>` with their description, total stars, stars-gained-this-period, and last-push date. Prefer sustained climbers over one-day spikes. Also check `?since=weekly` for the same language and note any repo appearing in both — sustained presence across both windows is the signal.

**Characteristic false positive of seam F:** the **hype spike mistaken for traction.** A repo trending this week on the back of one viral thread may be cresting already — a bandwagon you'd board at the top, with no real users behind the star surge. Sustained presence across weekly *and* monthly, plus a "Used by" that's actually growing, distinguishes a rising tool from a one-week firework. New-and-trending also means *unproven*; trending is a lead to capture, not a verdict on quality.

---

## Seam G — the "what's the alternative to X?" threads

When a popular tool frustrates people, they ask for alternatives where the tool lives: in its **issues** and **discussions**, in "alternatives" issues, in migration threads. These are gold because the recommendations come from people with the *exact* pain you have, and the replies name tools that search ranking buries — often newer, more focused projects positioned precisely against the incumbent's weakness.

> Search the issues and discussions of `<incumbent-tool>` (and GitHub-wide) for "alternative", "instead of", "migrate away from", "replacement for". Also search Discussions across GitHub: `<incumbent> alternative`. From the threads, extract every named alternative project, with the repo link, the reason commenters give for switching, and the alternative's last-push date. Prioritize alternatives named by multiple independent commenters.

**Characteristic false positive of seam G:** the **drive-by self-plug and the stale thread.** "Alternatives" threads attract maintainers promoting their own young project, and a recommendation from 2022 may point at a tool that has since died (or one the incumbent has since fixed past). A name dropped once by an account that only ever mentions that one repo is an advert, not a recommendation. Weight alternatives named by *multiple independent* people, check the thread's date, and apply the liveness check to every name before it enters the pool.

---

## What STAGE 1-2 produces, and the line you don't cross

**The output is a wide, deduped, provenance-tagged candidate pool** — more than a handful (`pool-wide-enough`), each repo carrying the seam and query that found it (`fanout-run-with-provenance`), each with its cheap facts recorded and its liveness flagged. Three or four independent seams ran in parallel; convergence across them marks the stronger candidates; nothing entered that the agent didn't actually retrieve.

And the line that keeps cheap discovery cheap: **this is not the evaluation.** You sorted by liveness and culled the plainly-dead, but the deep "is it actually good?" — code craft, test coverage, bus factor, the slop check, the per-axis score — is `touchstone`'s job, deferred on purpose. Sift in STAGE 3 only removes what is *plainly* not worth evaluating; when in doubt, keep it and let `touchstone` decide (the cull discipline is in [sift-and-capture.md](sift-and-capture.md)). The seams *widen* — that is their whole agent-era purpose, with width made free by parallel fan-out. Narrowing comes next. What you owe this stage is breadth with provenance, and a hard refusal to let a star count or a fluent README stand in for a pulse.

---

**Cross-links:** [why-mine-and-wander.md](why-mine-and-wander.md) (the foundation — the two modes, the agent's three traps, the provenance and capture rules) · [the-wandering-surfaces.md](the-wandering-surfaces.md) (the serendipitous-mode counterpart to this file) · [sift-and-capture.md](sift-and-capture.md) (the cull and the capture that follow this cast) · [../SKILL.md](../SKILL.md) (the flight plan these seams back at STAGE 1-2). The pool this stage hands forward goes to [../touchstone/SKILL.md](../../touchstone/SKILL.md) for evaluation; a find worth committing to routes onward to [../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) for code craft, [../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md) for its tests, [../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md) for its dependency and security posture, and [../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md) for taking it on as a long-lived dependency.

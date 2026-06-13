# Scoring and Verdict — the judgment behind STAGE 4-5 (Score / Verdict)

This reference is the depth behind **STAGE 4 — Score the three axes** and **STAGE 5 — Verdict** of the [../SKILL.md](../SKILL.md) flight plan. STAGE 0-3 did the gathering and the doubting: the scan pulled the real dashboards, signal-weighting discounted the gameable ones, the slop-check hunted the tells of a fake. This is where the pulled evidence becomes a number, and the number becomes a decision you can act on. It backs the four checks of those two stages — `three-axes-scored`, `scored-from-evidence-not-stars`, `verdict-calibrated-to-context`, and `handoff-and-traceable`.

> Three axes, scored from evidence and not from stars, that are allowed to disagree — then one verdict that only means something once you name the bar it was measured against. The agent scores the axes; only you say what the score means for your risk. A verdict with no bar is an opinion in a number's clothing.

---

## Part 1 — The three axes

The whole point of three axes instead of one rating is that quality is not one thing. A repository can be vigorously developed and structurally fragile. It can be rock-solid and untouched for a year. It can be beautifully built and dying because the one person who built it stopped answering. Collapse those into a single "8/10" and you have thrown away exactly the distinctions that decide whether you should depend on it. So you score three things separately, each off its own evidence, and you let them tell three different stories about the same repo.

### ALIVE — is anyone still working on it?

The question is whether the project is in motion right now. Three signals compose it, all pulled in STAGE 1:

- **Last activity date.** Read it from the repo, not guessed. The cheap read is the last-*push* date — `gh repo view OWNER/REPO --json pushedAt,updatedAt,isArchived,archivedAt` — and the true last-*commit* date comes from `gh api repos/OWNER/REPO/commits --jq '.[0].commit.committer.date'`. Note `pushedAt` is the last push to any branch and `updatedAt` moves on metadata changes too — so a "recent" `updatedAt` over a stale `pushedAt` means someone edited the description, not the code. And `isArchived: true` is decisive: the maintainer has formally declared the repo read-only. An archived repo is not "low Alive", it is *Alive: none, by the owner's own statement* — record it as that, not as a slow pulse.
- **Release cadence.** Pull the tags and their dates: `gh release list --repo OWNER/REPO --limit 20`, or `gh api repos/OWNER/REPO/releases`. You are reading *rhythm*, not count. Regular releases over two years is a steady heartbeat; a flurry of releases in month one and silence since is the shape of an abandoned launch. Still on `0.0.x` after three years says the author never considered it stable enough to commit to.
- **Issue-response recency.** Not how many issues — *how recently a human replied to one*. Open the three most recent issues (`gh issue list --repo OWNER/REPO --limit 10 --state all`) and look at whether a maintainer responded, and when. A repo with the last commit eight months ago but a maintainer answering issues last week is more alive than one with a commit last month and a hundred issues nobody has touched since spring.

Alive is the **easiest axis to read and the easiest to misread**, because low Alive is ambiguous — which is the whole of the finished-vs-abandoned nuance below.

### HEALTHY — if the lead walks away, does it die?

Alive asks "is it moving?"; Healthy asks "would it survive losing its driver?" This is the axis stars are most blind to, and the one a production decision turns on.

- **Bus factor.** How concentrated is the work? Pull the contributor stats: `gh api repos/OWNER/REPO/stats/contributors` returns per-author commit totals (the same data behind Insights → Contributors). If one author owns 95% of commits, the bus factor is one — the project is one person's availability away from frozen. The number alone is not the verdict: a bus factor of one whose sole author committed yesterday is a *risk*; a bus factor of one whose author went quiet four months ago is closer to *abandoned*. Cross it with the Alive read.
- **External contributors.** Beyond the lead, is anyone else landing changes? `gh api repos/OWNER/REPO/stats/contributors` shows the tail; a handful of recurring non-lead committers, and merged PRs from outside the core, mean the knowledge is not trapped in one head. A long tail of one-commit drive-bys is weaker than three or four sustained secondary contributors.
- **Company or foundation backing.** Does an institution stand behind it? Read the org owner, the funding links (`fundingLinks` in `gh repo view --json`), the GOVERNANCE or a foundation badge (CNCF, Apache, etc.) in the README, and whether the contributors share a corporate email domain. A project under a foundation or a paying company has a survival mechanism a hobby project does not — the lead leaving is a staffing problem, not an extinction event.

A hot new project routinely scores **high Alive, low Healthy**: furious commit activity, single maintainer, no institution, no second contributor. The energy is real and the fragility is real, and Healthy is the axis that records the fragility the star count hides.

### WELL-BUILT — is the code likely to be any good?

This is a *likelihood* read from the outside, not a verdict on the code itself — that deeper read is `plumb`'s and `assay`'s job, downstream of a passing verdict. You are reading the **engineering hygiene the dashboard exposes**:

- **Tests — strength, not presence.** A `tests/` tree is a presence check, and presence is not strength. Counting test *files* misses the tests that live inline (Rust's `#[cfg(test)]` modules, inlined `def test_` / `it(...)`), and an absolute count rewards a big codebase for being big. So measure the suite properly — *Measuring test strength*, below — and remember that a few token test files staged to look tested is its own slop tell.
- **CI.** Is there a workflow under `.github/workflows/`, and is it green? `gh run list --repo OWNER/REPO --limit 5` shows recent run conclusions; a red main-branch build that has been red for weeks says the maintainer is not watching, whatever the README badge claims. The badge is a picture; the run list is the fact.
- **CHANGELOG.** A maintained `CHANGELOG.md` (or real GitHub release notes) signals the author thinks about downstream consumers — they tell you what broke and what changed. Its absence is not damning, but its presence is a positive un-gameable signal: it is annoying to fake convincingly over many releases.
- **Documentation structure.** Not README polish (that is gameable and discounted in STAGE 2) but *structure*: a docs site, an API reference, examples that actually run, an architecture note. Depth of documentation is expensive to produce and correlates with care; a gorgeous README over no other docs is the opposite signal.
- **The QUALITY of maintainer issue-replies.** This is the hardest of the five to fake — you are reading the maintainer's actual grasp of their own system. Open a few closed issues and *read the maintainer's replies*. A reply that says "fixed in abc123, here's the root cause, here's the regression test I added" is a maintainer who understands their own system. A reply that closes a bug report with "works for me" or a wall of plausible-but-empty text, or no engagement and a silent close, tells you what reading the code would. You are reading the **mind behind the repo**, and that mind cannot be star-farmed.

**Measuring test strength, not just test presence.** "Is there a `tests/` directory?" is a presence check, and three things turn presence into a wrong verdict on the WELL-BUILT axis — each with its fix:

- **Count test units, inline-aware — not test files.** The file tree misses the tests that don't live in their own file: Rust puts them in `#[cfg(test)] mod tests` *inside* the source, and Python and JS projects often inline `def test_` / `it(...)` next to the code; only Go and its kin keep them in separate `_test.go` files. A repo with a single file under `tests/` can carry hundreds of inline `#[test]`s, and a fat `tests/` tree can hold three real assertions per file. For a no-clone estimate, `gh search code '#[test]' --repo OWNER/REPO` (or `def test_`, `func Test`, `it(`) counts how many files carry tests — already enough to catch the inline-tested repo the file tree called untested. For the precise number, a shallow `git clone --depth 1` and a grep over the checkout for the test markers and their assertions (`assert`, `assert_eq!`, `expect(`) is the honest measure — still *counting*, not the line-by-line reading that is `plumb`'s and `assay`'s job.
- **Normalize by code size — density, not an absolute count.** An 80-KLOC project with 800 test functions is more thinly tested than a 4-KLOC project with 400: per unit of code it has a tenth the coverage. Raw counts reward size. Divide into **test functions per 1000 lines of source** and **assertions per KLOC** — those two numbers are the comparable measure of how hard the code is actually exercised.
- **Calibrate against a baseline repo, not an absolute threshold.** There is no universal "good" density — what is thin for a parser is plenty for a CLI wrapper. So do for the test axis exactly what the verdict does for the use-context: pick a *reference* repo whose rigor you trust, or one the user hands you, measure *it* first, and compare densities head to head. "Thinner than `<baseline>` = thin" is reproducible; "feels under-tested" is not.

And confirm CI actually *runs* the tests: a workflow that builds but never invokes `cargo test` / `pytest` / `go test`, or a green badge on a job that skips them, is presence without strength again.

A worked shape — the numbers are illustrative; the baseline is whatever reference you or the user pick at evaluation time, never a repo fixed in this skill. If the reference measures ~100 test-functions and ~150 assertions per KLOC and the candidate comes in at ~10 and ~20, the candidate is about a tenth as test-dense — *thin relative to that bar*, even though it may carry more test functions in raw count (its codebase is simply far larger). Record it as "WELL-BUILT: tests thin vs `<baseline>` — 10 vs 100 test-fn/KLOC", never "well-tested, 800 tests".

Well-built is read from these signals *named explicitly* — never from the star count. "Well-built: strong — full suite under `tests/`, CI green on main for the last 20 runs, every recent issue answered with a concrete fix and a test" is a score. "Well-built: it has 12k stars" is the exact mistake this whole skill exists to prevent.

### Score each axis explicitly, on a consistent scale, from evidence

Per target, write each axis as a level plus the signals behind it. A simple, defensible scale is **strong / moderate / weak / unknown**, and `unknown` is a first-class value — when the signal could not be pulled (private stats, an API you didn't hit), the axis is `unknown`, never a guess dressed as a finding. For a **batch**, the scale must be *consistent across targets*: pull the same signals for every repo (the same `gh` calls, the same questions) so that "moderate Alive" means the same thing on repo A and repo D. A batch scored on signals pulled unevenly is not comparable, and an incomparable batch cannot be ranked.

Make the agent produce it in a fixed shape. A copy-ready instruction:

> For each repo, output a row: `repo | ALIVE (level + the last-commit date, release cadence, and issue-response recency behind it) | HEALTHY (level + the bus-factor %, external-contributor count, and backing behind it) | WELL-BUILT (level + tests/CI/CHANGELOG/docs presence and one quote from a maintainer issue-reply) | SLOP-RISK (low/med/high + tells)`. Every level must name the signals it rests on. Where a signal was not pulled, write `unknown` — do not infer it from the star count or the README. Use the same scale and the same pulled signals for every repo in the batch.

### The axes are INDEPENDENT and routinely DISAGREE — do not average them

This is the load-bearing rule of Part 1. The three axes measure three different things and they split apart constantly. The split is not noise to be smoothed away; **the split is the information.** Averaging "Alive: weak / Healthy: weak / Well-built: strong" into "6/10" destroys the one fact you needed — that this is a beautifully made thing nobody is maintaining — and replaces it with a number that means nothing.

Two canonical disagreements you will see again and again:

- **The finished tool: low Alive, high Well-built.** A small, focused, Unix-philosophy library — last commit fourteen months ago, two releases ever, single author. Read naively that is "dead, score it low." Read on its axes: Alive is weak (truly little recent motion) but Well-built is strong (complete test suite, every issue answered with a real fix, clean docs) and Healthy may be moderate (the author still replies within a day). The low Alive is not decay. It is *done*.
- **The hot new project: high Alive, low Healthy.** A trending repo with commits every day this week, one maintainer, no second contributor, no institution. Alive is strong, Well-built may be moderate (tests are forming), and Healthy is weak — a bus factor of one and nothing to catch the project if that one person loses interest next month. The energy is genuine; so is the fragility.

A single number cannot represent either of these honestly. Keep the three apart.

### The FINISHED-vs-ABANDONED nuance

Low Alive is the most over-read signal in repository evaluation, because a tired human (and an eager agent) reads "no recent commits" as "dead" and moves on. But a project sits still for two opposite reasons, and they demand opposite verdicts:

- **Finished.** A small, complete library with a stable surface. The reasons it is quiet are good ones: there is nothing left to add, the scope was deliberately small, and it works. The tells are **issues answered** (recent ones get a reply even if no commit follows), **dependents present** (real downstream "Used by" — people rely on it and it serves them), **a stable major version** (it reached 1.x or 2.x and stayed there on purpose), and **no pile of unanswered bug reports**. A finished library is a *fine* dependency: its lack of churn is reliability, not rot.
- **Abandoned.** A project that stopped mid-life. The tells are the inverse: **open issues piling up unanswered** for months, **PRs rotting** with no maintainer response, **a broken or red CI nobody fixes**, **dependents fleeing** (the "Used by" trending down, or forks where people moved their work), and often **an unfinished `0.x` version** that was never declared stable. An abandoned project is a liability — the bugs will not get fixed and the security holes will not get patched.

Same low-Alive number, opposite meanings. The distinguisher is **the response and the downstream**, not the commit clock. A copy-ready probe:

> This repo's last commit is N months old. Decide finished vs abandoned from evidence, not the date: are the most recent issues answered by a maintainer, or piling up unanswered? Is CI green or red? Are there real downstream dependents (check the "Used by" / dependents page and reverse-dependency search), trending up or down? Is it on a stable major version or stuck on 0.x? Report finished, abandoned, or unclear — with the specific signals, not the commit age.

(One accuracy note for the agent: the **"Used by" / dependents count is a web-only view** on the repo's network page — it is not returned by `gh repo view` or the GraphQL API. To pull it, `WebFetch` the `https://github.com/OWNER/REPO/network/dependents` page, or read the count off the repo homepage. State it as read from there, or as `unknown` if you didn't fetch it — never assert a dependents number you couldn't retrieve.)

---

## Part 2 — The verdict

The score is not the answer. Three well-evidenced axes are still just a description of the repo; they become a *decision* only when measured against the bar you set in STAGE 0. This is the calibration the agent cannot do for you, because the bar lives in your situation, not in the repo.

### Calibrate the axis-read to the use-context bar

STAGE 0 fixed the use-context. Each use sets a different bar, and the bar decides which axis weaknesses are fatal and which are fine:

- **Tryout** (a weekend, throwaway, evaluating for yourself). The bar is low: *does it run and roughly do what it claims?* Health barely matters — you are not betting a system on it. Even high slop-risk is survivable if you are eyes-open and disposable about it.
- **Dependency** (production, load-bearing, long-lived). The bar is high and it is mostly **Healthy and Well-built**: a survivable bus factor, real maintenance, a clean security and dependency posture, tests and CI you can trust. A bus factor of one or high slop-risk is close to disqualifying here regardless of how alive or popular it looks.
- **Contribution** (you want to land PRs). The bar is mostly **Alive and the quality of maintainer engagement**: do recent issues get answered, do outside PRs get merged, are there tractable `good first issue`-grade tasks? A brilliant but unresponsive maintainer makes a bad contribution target however well-built the code.
- **Learning** (read it to understand a technique). The bar is **Well-built and legible** code; institutional health and even active maintenance matter little. A finished, dormant, single-author library can be an *excellent* learning source — the very thing it fails as a production dependency.

### The four-call rubric

Land one call per target:

- **DEEP-DIVE** — clears the bar and is worth a real look at the actual code. This is the only call that triggers a handoff to the engineering suite.
- **TRY IT** — good enough for a tryout or learning, not a production bet. The honest call for a promising-but-fragile project.
- **DON'T-BET-IN-PRODUCTION** — fine to play with, fails the *dependency* bar specifically: low Healthy, a bus factor of one, high slop-risk, or a security/dependency posture you can't vouch for. Names *why* it fails the production bar.
- **SKIP** — fails the bar that was actually set; not worth more of your time for this use.

### The same repo, different verdicts under different bars — worked examples

This is the heart of why naming the bar is what makes the verdict honest. Take **Repo X**: a clever, fast, single-maintainer CLI tool. Axis read (identical across all four cases, because it's the same repo): *Alive moderate* (last commit 3 months ago, maintainer answered an issue last week), *Healthy weak* (bus factor one, no backing, no second contributor), *Well-built strong* (full test suite, green CI, maintainer replies with root-cause fixes), *slop-risk low*.

- **Under the tryout bar:** TRY IT. It runs, it's well-made, you're risking a weekend. The weak Healthy is irrelevant to a throwaway.
- **Under the learning bar:** TRY IT (read to learn). Strong Well-built and a legible single author make it a great teacher; you don't care that the bus factor is one.
- **Under the dependency bar:** DON'T-BET-IN-PRODUCTION. The strong Well-built is real but the weak Healthy is fatal here — one person, no institution, and you'd be staking a production system on their continued interest. The exact same axes, a different call, *because the bar moved.*
- **Under the contribution bar:** TRY IT / engage. The maintainer answers issues (good sign for contribution), so it's worth opening a PR — but the single-maintainer concentration means your changes live or die on one person's attention.

Now take **Repo Y**: a polished, feature-listing README, 9k stars, but the slop-check found a thin commit history (three giant dumps), no real issues, no dependents, generated-looking uniform code. Axis read: *Alive weak-to-unclear, Healthy weak, Well-built weak, slop-risk HIGH.* Under **every** bar this is SKIP — and the verdict says *why*: not "few stars" (it has many) but "high slop-risk, no downstream reality, un-evidenced quality." The stars moved the verdict the least; the un-gameable signals decided it.

The rule the examples teach: **a high-Alive / low-Healthy project is a TRY IT, not a DEEP-DIVE, for a production decision** — and the only way to say that correctly is to state the bar in the same breath as the call.

### The structured, traceable report

Every claim in the verdict points back to a signal pulled in STAGE 1 — a date, a percentage, an issue thread URL, a contributor split, a CI run conclusion — so the user can *check the reasoning* rather than trust the conclusion. This evidence-backed report is what supersedes the old "search-and-score-and-summarize" one-shot.

For **one repo**, a go/no-go with reasons:

> **Repo:** OWNER/REPO — **Use-context:** production dependency — **Verdict: DON'T-BET-IN-PRODUCTION**
> **ALIVE: moderate** — last commit 2026-03-10 (via the commits endpoint); 2 releases in 18 months; maintainer answered issue #214 on 2026-06-05.
> **HEALTHY: weak** — bus factor 1 (lead = 96% of commits per stats/contributors); no second sustained contributor; no company/foundation backing.
> **WELL-BUILT: strong** — `tests/` present and substantial; CI green on main (last 20 runs); maintainer reply in #198 gave root cause + regression test.
> **SLOP-RISK: low** — coherent multi-year history, real issues, real dependents (1.2k via /network/dependents).
> **Why this call:** clears Well-built and Alive, fails the *dependency* bar on Healthy alone — a bus factor of one is the single risk that sinks it for production. Would be a DEEP-DIVE under a learning bar.

For a **batch**, a ranked, justified shortlist — ordered by how well each clears *the stated bar* (not by stars, not by an averaged score), each line carrying its axes and its one-reason verdict, ties broken by slop-risk and Healthy. The terminus is the ranked judgment plus its evidence, never "the one with the most stars."

### The handoffs — what touchstone deliberately stops short of

`touchstone` ends at "worth the deeper look." It does not read the source line by line; that is exactly the work it hands to the engineering suite once a repo earns a **DEEP-DIVE**. The dashboard read is a likelihood; the deep dive is the verification. Route the survivors:

- **[../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md)** — code craft and legibility. Touchstone's Well-built was read from tests/CI/docs/issue-replies *outside* the code; `plumb` reads the code itself for naming, complexity, over-abstraction, and the smells a dashboard can't see. This is where "likely good" becomes "actually good (or not)."
- **[../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md)** — the real state of the tests. A `tests/` directory and green CI are presence signals; `assay` reads whether the suite tests the things that matter or just inflates a coverage number. A green build over hollow tests is exactly the kind of false-green this suite distrusts.
- **[../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md)** — security and supply-chain posture. Before you make it a dependency, `aegis` reads the dependency tree, the secrets handling, the known-CVE exposure, and the supply-chain risk — none of which the five-glance scan covers.
- **[../../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md)** — the long-run cost of taking it on. A dependency is a liability for its whole life; `husbandry` reads the maintenance and upgrade burden, the API-stability and version-evolution track record, and what it will cost you to live with this thing for years — the question a DON'T-BET-IN-PRODUCTION call most needs answered before it flips.
- **The contribution workflow** — a chosen contribution target goes forward into the fork/branch/PR flow, where the maintainer-responsiveness signal you scored becomes the thing you actually test by opening a PR.

And the loop back upstream: **[../../forage/SKILL.md](../../forage/SKILL.md)** owns *finding* and hands `touchstone` a shortlist with provenance and a use-context; `touchstone` owns *judging* and returns this calibrated, ranked verdict. Finding feeds judging; judging feeds the deep dive. Touchstone is the joint between them, and its job is done the moment the verdict — with its bar, its axes, and its evidence — is in the user's hands.

---

**Cross-links:** [why-the-gameable-signals-lie.md](why-the-gameable-signals-lie.md) · [the-dashboard-sweep.md](the-dashboard-sweep.md) · [signal-weighting-and-slop.md](signal-weighting-and-slop.md) · [../SKILL.md](../SKILL.md) · upstream [../../forage/SKILL.md](../../forage/SKILL.md) · deep-dive handoffs [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md), [../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md), [../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md), [../../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md)

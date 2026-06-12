# The Dashboard Sweep — the five-glance checkup behind STAGE 1 (Scan)

This reference is the depth behind **STAGE 1 — Scan** of the [../SKILL.md](../SKILL.md) flight plan: the five-glance dashboard sweep, run from the actual repo, with what to pull and what good-versus-bad looks like at each glance. It backs the two scan checks — `dashboard-pulled-from-repo` (every glance read from the real repo, via `gh` / the REST API / web) and `facts-traced-not-asserted` (raw reads recorded, so every later claim has a source instead of a guess).

> Pull, don't presume. The scan *gathers* the dashboard; it does not yet judge it. A datum you didn't retrieve is not a datum, and a number the agent produces without an endpoint behind it is the gap-fill this whole skill exists to stop. Read the five surfaces, write down what they actually say, and leave the weighting to STAGE 2.

The five glances are ordered the way a careful human opens the browser tabs: the **homepage** for the 30-second vital signs, the **README** for whether the project can even explain itself, the **issues and PRs** for whether anyone is home, the **Insights** view for who *is* home and for how long, and the **file tree** for whether the thing was built by someone who tests their work. Each glance below names the concrete pull and the good/bad read. Run them, capture the raw values, and the dashboard is built.

---

## The pull surfaces, and why three of them

You have three ways to read a repo, and the right one differs per glance:

- **`gh` CLI** — the fastest path for the structured top-level facts (description, stars, forks, license, last push, latest release). One command, JSON out, scriptable across a batch. This is your default.
- **The REST API via `gh api`** — for the views the CLI doesn't surface as a flag: the commit-activity pulse, the contributor distribution, the Community Standards health, the per-release timestamps. `gh api` carries your auth and your rate limit, so it works on a batch without you handling tokens.
- **The web page** — for the handful of things GitHub renders but does *not* expose through any API. The big one is the **"Used by" count** on `network/dependents`: it is not in the REST or GraphQL API, only on the page. When a glance needs the web, this reference says so.

**For a batch, pull uniformly.** Whatever you pull for one target, pull for all of them, with the same command and the same fields, so the targets are comparable. A batch where one repo got its commit pulse read and another got eyeballed is not a comparison; it's two different evaluations wearing one table. The copy-ready instruction for the whole sweep:

> For each repo, pull the SAME fields with the SAME commands and record the raw values in a per-repo row: never compare a value you pulled for one target against a value you eyeballed for another. If a pull fails or a signal is absent, write "unknown" or "absent" in that cell — do not leave it blank and do not infer it.

Now the five glances.

---

## Glance 1 — The homepage, 30 seconds (the vital signs)

The repo's front page carries six facts that, together, tell you in half a minute whether the thing is alive and usable at all. Pull them in one shot:

```
gh repo view OWNER/REPO --json nameWithOwner,description,homepageUrl,pushedAt,stargazerCount,forkCount,licenseInfo,latestRelease,isArchived,createdAt
```

That single call covers most of the glance. Two facts need a second pull, noted below. Here is each fact, what good and bad look like, and the gotcha.

**The About line and the doc-site link** (`description`, `homepageUrl`). *Good:* one sentence that says what the thing *is* and what problem it solves, plus a link to real docs. *Bad:* empty, or a vague slogan ("the future of X", "blazingly fast Y") with no doc site. A missing description on a 10k-star repo is itself a small tell — real projects describe themselves.

**The last-commit date** (`pushedAt`). This is the single most load-bearing vital sign. *Good:* within weeks for an active project. *Bad:* `pushedAt` more than a year old with open issues piling up. But hold the judgment — STAGE 2 distinguishes *finished* from *abandoned*, and a small, complete library can correctly sit untouched. Here you only **record the date**. If you want the actual last commit (not just the last push, which a tag or a fork can bump), pull it directly:

```
gh api repos/OWNER/REPO/commits --jq '.[0].commit.committer.date'
```

**The star / fork / "Used by" ratio.** Stars (`stargazerCount`) and forks (`forkCount`) come from the first call. The **"Used by" count is web-only** — it is not in any API — so fetch the page:

```
WebFetch https://github.com/OWNER/REPO/network/dependents  → "What are the 'Repositories' and 'Packages' dependent counts shown on this page?"
```

*Good:* a high "Used by" relative to stars means real downstream adoption — people actually depend on it, not just bookmarked it. A healthy fork count alongside merged outside contributions signals a living project. *Bad:* tens of thousands of stars with a near-zero "Used by" and few forks is the classic shape of attention without use — bookmark-bait, or a star-farm. (The full weighting of this ratio is STAGE 2's; record the three numbers now.)

**The releases** (`latestRelease`, plus the cadence). The single call gives you the latest tag. For cadence — steady shipping versus one-and-done — pull the timestamps:

```
gh api repos/OWNER/REPO/releases --jq '[.[] | {tag: .tag_name, published: .published_at}]'
```

*Good:* a regular drumbeat of releases, and a version that has graduated past `0.0.x` / `0.x` into something the author is willing to call stable. *Bad:* one release two years ago, or no releases at all, or a perpetual `0.0.x` on a repo that claims production-readiness. A project still on `0.0.x` after years is telling you it doesn't consider itself done — believe it.

**The LICENSE** (`licenseInfo`). *Good:* a recognized SPDX license (MIT, Apache-2.0, BSD, GPL). *Bad:* **no license at all — which makes the repo legally unusable in any serious setting**, because "no license" means all rights reserved, not "free to use." This is a hard gate for a dependency or contribution target, not a soft signal. One gotcha: `gh repo view`'s GraphQL `licenseInfo` field occasionally returns null even when a license exists; if it comes back empty, confirm via REST before declaring "no license":

```
gh api repos/OWNER/REPO --jq '.license.spdx_id'
```

`isArchived: true` is the other hard stop — an archived repo is explicitly read-only and done.

**The 30-second read, recorded.** Six values in a row: description present?, last-commit date, stars/forks/used-by, release cadence + still-0.0.x?, license (or none), archived?. That row is the homepage glance.

---

## Glance 2 — The README skeleton (structure, not prose)

Read the README for its **skeleton, not its prose** — and this is deliberate, because in the slop era the prose is the cheapest, most polished, least trustworthy thing in the repo. You are not judging whether it reads well; an agent can write a beautiful README in a minute. You are checking whether the *structure* does the jobs a real README does. Pull it raw:

```
gh api repos/OWNER/REPO/readme --jq '.content' | base64 --decode
```

(or `gh repo view OWNER/REPO` prints the rendered README to the terminal). Then check the skeleton against five questions:

**Does it answer what / why / how-to-start?** *Good:* a reader learns what the thing is, why it exists over the obvious alternative, and how to install-and-run within the first screen. *Bad:* paragraphs of mission-statement prose with no concrete "here's how you use it", or a quickstart that skips straight to advanced config. The fastest real-quality tell is a copy-pasteable minimal example near the top.

**Screenshots or a demo** (for anything with output or a UI). *Good:* a screenshot, a GIF, an asciinema cast, a hosted demo link — evidence the thing runs and someone watched it run. *Bad:* a UI tool with zero visual proof it works.

**The badges, and what they actually say.** Badges are a structural signal *if you read them rather than count them.* *Good:* a **CI badge that is green** (the build passes), a coverage badge with a real number, a current release badge. *Bad:* a CI badge that is **red or stale**, a row of purely decorative badges (downloads, "made with love", a dozen social links) with no build or test badge among them. A wall of badges and no CI badge is a costume. Click through the CI badge to confirm it points at a workflow that actually ran, not a hardcoded "passing" image.

**An honest "comparison with X".** *Good:* a section that names the real alternatives and says, plainly, where this tool wins and where it loses. That honesty is expensive to fake and rare in slop — a fabricated project oversells and never concedes a weakness. *Bad:* no comparison at all, or a comparison table where this project has a green check in every row and every competitor has red X's. A too-perfect comparison is a marketing artifact, not an engineering one.

**The read, recorded.** Note presence/absence per item: answers-what-why-how?, demo/screenshot?, CI badge (green/red/none) + coverage?, honest comparison?. The skeleton glance is a checklist of structural jobs done or skipped — its *weight* (and the slop tell of polished prose over a thin history) is STAGE 2-3's. Here you only record what the skeleton contains.

---

## Glance 3 — Issues & PRs (the RESPONSE, not the count)

This is the glance most easily done wrong, because the instinct is to read the *count* — "2,000 issues, must be popular" or "500 open issues, must be broken." **The count is nearly noise; the signal is the RESPONSE.** A repo with 800 issues all answered is healthier than one with 10 issues all ignored. What you are reading is: when a real person files a recent issue, does a maintainer show up, how fast, and in what tone?

Pull the recent open issues and look at what happened *inside* them:

```
gh issue list --repo OWNER/REPO --state open --limit 15 --json number,title,createdAt,comments,author
gh issue list --repo OWNER/REPO --state all  --limit 30 --json number,state,createdAt,closedAt --jq 'map({number, state, opened: .createdAt, closed: .closedAt})'
```

Then open two or three recent ones in full to read the actual exchange:

```
gh issue view NUMBER --repo OWNER/REPO --comments
```

Here is what to read:

**Did the maintainer reply, how fast, what tone.** *Good:* recent issues have a maintainer response within days, and the response is substantive — it asks a clarifying question, links a fix, explains a decision. The tone is engaged. *Bad:* recent issues sit for months with no maintainer comment, or the only replies are other confused users, or the maintainer's tone is dismissive ("works for me, closing"). A single substantive reply to a hard recent issue tells you more than the whole issue count.

**The open/closed trend.** From the `--state all` pull, look at whether issues get closed at a rate that keeps pace with opening, and whether *recent* issues are being closed or only old ones swept. *Good:* a steady close rate, recent issues moving. *Bad:* a monotonically growing open pile where nothing recent ever closes — the project is taking input and doing nothing with it.

**External PRs merged.** This is the strongest single health signal in the glance, because it shows the project accepts work from outside its core. Pull the PRs:

```
gh pr list --repo OWNER/REPO --state merged --limit 30 --json number,author,mergedAt,title
```

Then check how many of the merged authors are *not* the owner. *Good:* outside contributors get their PRs reviewed and merged — the project is collaborative and the maintainer has bandwidth. *Bad:* every merged PR is the owner's own; outside PRs sit open or get closed unmerged.

**The stale-PR graveyard.** Open the old open PRs:

```
gh pr list --repo OWNER/REPO --state open --limit 30 --json number,author,createdAt,title --jq 'sort_by(.createdAt) | .[0:10]'
```

*Good:* few old open PRs, and the ones there have maintainer comments explaining the hold. *Bad:* a graveyard of year-old PRs with green CI and zero maintainer response — contributors tried to help and were ghosted. That graveyard is a louder "abandoned" signal than the last-commit date, because it shows people *wanted* in and nobody answered.

**The read, recorded.** Per repo: did recent issues get a maintainer reply (and how fast)?, open/closed trend (keeping pace or piling)?, external PRs merged (yes/no, roughly how many)?, stale-PR graveyard (present/absent)? You are recording the *interaction*, never the headline count.

---

## Glance 4 — Insights (contributors, the pulse, the standards)

The Insights tab holds three reads that no amount of README polish can fake, because they are computed from the repo's own history. All three are available through the REST API, so you can pull them on a batch without opening a browser.

**The Contributors graph — the bus factor.** The *bus factor* is how many people would have to vanish for the project to stall. Pull the contributor distribution:

```
gh api 'repos/OWNER/REPO/contributors?per_page=20' --jq '[.[] | {login: .login, contributions: .contributions}]'
```

Read the *shape*. *Good:* contributions spread across several active people, or one lead plus a real bench of regular contributors. *Bad:* one person at ~95% of all commits and everyone else at a handful — a **bus factor of one**. That single-maintainer shape is not automatically disqualifying (it is fine for a weekend tryout), but for a production dependency it is the risk a star count will never tell you about, and you must cross it with whether that one person is *still active* (their recent commit dates, from glance 1). One person at 95% who went quiet three months ago is the exact production trap this suite exists to catch.

**The commit-activity pulse.** Is the project a steady heartbeat, a single burst that flatlined, or a recent cliff? Pull the weekly participation:

```
gh api repos/OWNER/REPO/stats/participation --jq '{all: .all, owner: .owner}'
```

This returns 52 weeks of commit counts. Read the curve. *Good:* a steady or healthily-varying pulse over the year. *Bad — three distinct shapes:* a **one-burst-then-zero** (a wall of commits at the start, then flat — the signature of a dumped-then-abandoned project, and a slop tell worth carrying to STAGE 3); a **sudden cliff** (steady, then nothing for the last N weeks — the maintainer walked away recently); or a **flatline** the whole year (dead, unless it's a finished library). The `owner` array versus `all` also re-confirms the bus factor: if `owner` ≈ `all` every week, one person is the entire pulse.

**The Community Standards page.** GitHub computes a health checklist — does the repo have CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates, a description, a license. Pull it:

```
gh api repos/OWNER/REPO/community/profile --jq '{health: .health_percentage, files: (.files | keys)}'
```

*Good:* a high `health_percentage`, with `contributing` and `code_of_conduct` among the `.files` keys — these signal a project run with some discipline and an intent to be contributed to. *Bad:* a low score and no CONTRIBUTING (the maintainer hasn't thought about outside help). The security policy is **not** one of this endpoint's `.files` keys, so check it separately — a `SECURITY.md` in the file tree, or an entry on the repo's Security tab — because for anything you'd take as a dependency, no declared path to report a vulnerability is a real yellow flag. Don't over-weight the ceremony otherwise: a brilliant small library can skip it.

**The read, recorded.** Per repo: bus factor (N people, top contributor's share, are they still active?), pulse shape (steady / one-burst / cliff / flatline), community health (% + which of CONTRIBUTING/CoC/SECURITY present).

---

## Glance 5 — The file tree (no code reading)

The last glance walks the **root file tree without reading a line of code.** The presence and arrangement of a handful of files tells you whether the repo was built by someone who tests their work, automates their checks, and keeps a tidy house — and the deep code read is `plumb` / `assay`'s job downstream, not yours here. Pull the tree:

```
gh api repos/OWNER/REPO/git/trees/HEAD --jq '.tree[] | .path' | head -60
```

(or `gh api repos/OWNER/REPO/contents/` for just the root level). Then check for five things:

**A `tests/` or `test/` directory** (or `__tests__`, `spec/`, `*_test.go` alongside sources). *Good:* a real test directory with real test files. *Bad:* none — the maintainer ships untested, and you'll inherit that. (Whether the tests are *real* or hollow is `assay`'s call; here you only record presence.)

**CI under `.github/workflows/`.** Pull it:

```
gh api repos/OWNER/REPO/contents/.github/workflows --jq '[.[].name]'
```

*Good:* one or more workflow files (`ci.yml`, `test.yml`) — the project runs automated checks on every change. Cross this with the README's CI badge: a green badge backed by a real workflow file is trustworthy; a green badge with no workflow file is a painted-on image. *Bad:* no `.github/workflows/` at all — nothing automated guards the code.

**A CHANGELOG.** *Good:* a `CHANGELOG.md` (or release notes that serve the purpose) kept current — the maintainer tracks what changed and respects downstream users enough to tell them. *Bad:* none, or one that stops two years before the last commit.

**A dependency manifest *and* its lockfile.** Look for the pair: `package.json` + `package-lock.json` / `pnpm-lock.yaml`; `pyproject.toml` / `requirements.txt` + a lock; `go.mod` + `go.sum`; `Cargo.toml` + `Cargo.lock`. *Good:* both present — reproducible installs, pinned dependencies. *Bad:* a manifest with no lockfile (non-reproducible, and a supply-chain question `aegis` will want to look at), or a sprawl of dependencies far past what the project's scope justifies (a feature-stacking tell for STAGE 3).

**Root tidiness.** *Good:* a clean root — source in its place, config files where they belong, a README and LICENSE up top. *Bad:* a junk-drawer root full of `test.py`, `temp/`, `output.log`, `untitled.ipynb`, commented-out scratch — the sign of code that grew by accretion or was generated in one dump with no one keeping house.

**The read, recorded.** Per repo: tests dir?, CI workflows?, CHANGELOG?, manifest + lockfile?, root tidy?. Five presence/absence marks, no code read.

---

## What STAGE 1 leaves you holding

A per-target row — for one repo a single record, for a batch a uniform table — built from the five glances, every cell a value you **pulled** (a date, a count, a presence/absence, a screenshot of a thread) rather than asserted. Nothing in this stage is a verdict. The star count is recorded but not yet trusted; the README is read for skeleton but not yet weighted; the last-commit date is noted but not yet judged finished-or-abandoned. That separation is the whole discipline of the scan: **gather now, judge later**, so that when STAGE 2 discounts the gameable signals and STAGE 4 scores the three axes, every claim they make points back to a raw read in this row — and any cell you couldn't fill says "unknown", never a plausible guess dressed as a finding. That traceable, uniformly-pulled dashboard is what `facts-traced-not-asserted` is checking for, and it is the substrate the rest of the pipeline stands on.

---

**Cross-links:** [why-the-gameable-signals-lie.md](why-the-gameable-signals-lie.md) (the foundation — why stars and READMEs are the cheapest signals to fake, loaded at STAGE 0) · [signal-weighting-and-slop.md](signal-weighting-and-slop.md) (STAGE 2-3 — discount the gameable reads from this sweep, weight the un-gameable ones, and run the slop detector over the pulled tells) · [scoring-and-verdict.md](scoring-and-verdict.md) (STAGE 4-5 — read the three axes off these recorded signals and calibrate the verdict to your use) · [../SKILL.md](../SKILL.md) (the flight plan) · sibling suite skill [../../forage/SKILL.md](../../forage/SKILL.md) (hands `touchstone` the shortlist to scan) · and the engineering deep-dive handoffs for survivors: [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (code craft), [../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md) (whether the `tests/` are real), [../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md) (the dependency/SECURITY posture this glance only flagged).

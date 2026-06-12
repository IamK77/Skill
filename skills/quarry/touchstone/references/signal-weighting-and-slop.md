# Signal Weighting and the Slop Detector — the depth behind STAGE 2-3

This reference is the depth behind **STAGE 2 — Weight the signals** and **STAGE 3 — Slop-check** of the [../SKILL.md](../SKILL.md) flight plan: the inversion that decides which dashboard reads actually move the verdict, and the adversarial detector that hunts the repo built to *look* valuable. It backs the three checks of these two stages — `signal-weight gameable-discounted`, `signal-weight ungameable-assessed`, and `slop-check ai-slop-and-farming-checked` — plus the `signal-weight` and `slop-check` verifies that close each stage. STAGE 1 pulled the raw dashboards; this is where you decide what they're worth and whether any of it is real.

> Rank a signal by how cheaply it can be faked, then weight it inversely. A star count and a fluent README are the two cheapest things in a repository to manufacture, so they corroborate nothing on their own. The expensive-to-fake signals — coherent commit history, a maintainer who actually answers, a surviving bus factor, real downstream users, tests and CI — are what the verdict is built from. The agent is the means here, twice: the dashboard reader that pulls those signals, and the adversary commanded to prove the repo is a fake.

---

## Why weight at all — the convenience-ordering trap

A tired human ranks repos by what is in front of them: the star count at the top of the page and the README they just scrolled. An agent does the same thing for a worse reason — those two signals are the highest-salience tokens on the page and the easiest to summarize, so its gradient toward a clean, confident answer reaches for them first. Both instincts rank by *availability*, not by *evidential weight*. The whole of STAGE 2 is one correction: stop ranking by what is easy to read, start ranking by what is hard to fake.

The ordering principle is a single question asked of every signal: **how many minutes does it cost an adversary to manufacture this?** A star count costs a few dollars on a star-farm and zero skill. A README costs one prompt to an agent. A coherent two-year commit history with real issue threads and three independent downstream dependents costs either two years of genuine work or a forgery effort so large it would have been easier to just write the library. That cost gap *is* the weighting. Order the signals by it and the verdict reorganizes itself.

| Signal | Cost to fake | Weight | How it's read |
|---|---|---|---|
| Star count | Dollars, zero skill (farmed) | **Discount — suspect until corroborated** | not as evidence; only as a *prompt to check the reality behind it* |
| README polish / feature list | One agent prompt | **Discount — suspect until corroborated** | as a claim to be falsified against the commit history |
| Long roadmap, vanity badges | Minutes | **Discount** | a roadmap is a promise, not a delivery; a badge can link to nothing |
| Commit substance | Years, or an enormous forgery | **Weight heavily** | read the actual messages and the diff-size pattern |
| Issue-RESPONSE quality | Cannot be faked at scale | **Weight heavily** | read whether recent issues get a substantive reply |
| Bus factor (+ is the lead still active) | Cannot be faked | **Weight heavily** | contributor split, then the lead's recent activity |
| Real "Used by" / dependents | Cannot be faked cheaply | **Weight heavily** | the dependency graph, sampled for realness |
| Tests + CI presence and result | Easy to *add*, hard to make *pass meaningfully* | **Weight, with a caveat** | presence is weak; green-on-real-tests is strong |

The right column is the rest of this document.

---

## PART 1 — Signal weighting

### The gameable signals, and why each lies

**Stars.** A star records a moment of past attention by one account. It says nothing about whether the code works, whether the project is maintained today, or whether the attention was real. Stars are sold in bulk; a "trending" surge can be bought; and even honest stars *lag reality* by months — a repo can collect 10k stars in a hype week and be dead three months later with every dependent fleeing, and the star count never moves down. So a high star count is not evidence of quality. It is a *flag that says "now go check whether the reality matches"* — and the discipline is to do exactly that, never to let the number stand in for the check. Treat it as **suspect until corroborated** by the un-gameable signals below.

**README polish and the feature list.** In 2026 a fluent, screenshot-rich, feature-listing README is the single cheapest artifact in a repository to produce — an agent generates a beautiful one in under a minute, complete with a comparison table, a badge row, and an architecture diagram. So README quality has *inverted* as a signal: it used to weakly correlate with care, and now it correlates with nothing, because the slop repos have the *best* READMEs (that is their entire product). Read the README for *what it claims*, then treat every claim as a hypothesis to be falsified against the commit history and the code tree. A feature the README advertises but no commit ever implemented is the most common slop tell there is.

**The long roadmap.** A roadmap is a list of things not yet done. It is a promise, and promises are free. A 40-item roadmap on a repo with 30 commits is a red flag, not a sign of ambition — it inflates perceived scope without any delivery behind it.

**Vanity badges.** A badge is an image with a link. A "build passing" badge can point at a workflow that runs nothing, or a stale run from a year ago; a "coverage 98%" badge can link to a deleted report or a service that no longer exists. Click them. A badge whose link 404s or whose underlying run is empty is worse than no badge, because it was placed to deceive. (CI that genuinely runs is an un-gameable signal — see below — but the *badge* is not the CI.)

### The un-gameable signals, and how to READ each

These are the load-bearing signals. Each costs real time or real community to produce, so each is hard to fake — but each also has a *wrong* way to read it (counting instead of reading) that throws the weight away. The skill is in the reading, not the pulling.

**1. Commit SUBSTANCE — read the messages and the diff-size pattern, not the count.** The commit *count* is gameable (a script can manufacture 500 trivial commits). The *substance* is not. Pull the real history and read it:

```
gh api repos/{owner}/{repo}/commits --paginate \
  --jq '.[] | "\(.commit.author.date[0:10])  \(.commit.message | split("\n")[0])"'
```

Then read the **shape** of it. A genuine project shows *coherent evolution*: messages that name real changes ("fix off-by-one in pagination cursor", "handle empty-input case in parser"), commits spread across months or years, and a diff-size distribution that is mostly small-to-medium with occasional larger features. A faked or AI-dumped project shows the opposite — a handful of **giant commits** ("Initial commit" of 8,000 lines, then "Add features", then "Update README"), little or no evolution between them, and messages that are generic, templated, or describe *what the README promises* rather than *what changed*. Pull the diff sizes to see the pattern directly:

```
gh api repos/{owner}/{repo}/commits --paginate \
  --jq '.[].sha' | head -40 | while read sha; do
    gh api repos/{owner}/{repo}/commits/$sha --jq '"\(.sha[0:7]) +\(.stats.additions) -\(.stats.deletions)"'
  done
```

The tell to weight: **a whole project that arrived in one or three enormous dumps with no real iteration is a project nobody actually built incrementally** — which is the signature of a generated repo, not a worked one. Real software has a messy, lumpy, dated history because real software was debugged.

**2. Issue-RESPONSE quality — read whether the maintainer ENGAGES, not how many issues exist.** Issue *count* is noise (a popular project has thousands; a dead one has zero). The signal is whether *recent* issues get a *substantive* reply from a maintainer. Pull the recent issues and look at who answered and how:

```
gh api 'repos/{owner}/{repo}/issues?state=all&sort=updated&per_page=20' \
  --jq '.[] | select(.pull_request == null) |
        "\(.created_at[0:10])  c:\(.comments)  \(.state)  \(.title)"'
```

Then open three or four recent threads and read them. Good looks like: a maintainer replying within days with a concrete answer, a question, a "fixed in #1234", or a clear "won't fix, here's why" — engagement that closes the loop. Bad looks like: recent issues sitting open for months with zero maintainer comment, or replies that are bot-generated stalling, or a graveyard of "is this project still alive?" issues nobody answered. **800 issues all answered beats 10 all ignored.** A repo where the last twenty issues got real maintainer replies is alive in the way that matters; a repo with a green "passing" badge and a wall of unanswered issues is not.

**3. BUS FACTOR — and is the lead still active.** The bus factor is how many contributors could be hit by a bus before the project dies. Pull the contributor distribution:

```
gh api 'repos/{owner}/{repo}/contributors?per_page=100' \
  --jq '.[] | "\(.contributions)\t\(.login)"' | sort -rn | head -15
```

If one account authored 95% of the commits, the bus factor is one. That is not automatically disqualifying — many excellent libraries are one person's work — but it is a risk that must be **paired with the lead's recent activity**. A single maintainer who committed last week and answers issues is a living project; the *same* distribution where the lead's last commit was eleven months ago and the last issue reply was longer is a project one life-event away from abandoned. So always read the bus factor and the lead's recency *together*: check the lead's last commit date (the first date in the commit pull above) and whether they still appear in recent issue threads. A bus factor of one plus a silent lead is the production risk no star count discloses.

**4. Real downstream "Used by" / dependents.** Genuine adoption is expensive to fake because it requires *other real projects* to depend on this one. GitHub surfaces this as the **"Used by"** count on the repo homepage and the full list at `github.com/{owner}/{repo}/network/dependents`. Pull it and *sample it for realness*: open five or six of the listed dependents and check they are themselves real projects (their own commits, their own stars, a plausible reason to depend on this), not empty forks or sock-puppet repos created to inflate the number. A package on a registry gives a second, harder-to-fake read — npm download counts, PyPI download stats, crates.io dependents — because downloads by real CI systems are costly to forge at scale. Real dependents are the strongest single corroboration that a repo does something people need; *zero* dependents under a high star count is one of the loudest slop tells (Part 2).

**5. Tests + CI — presence is weak, green-on-real-tests is strong.** A `tests/` directory and a `.github/workflows/` file are *easy to add* — a generated repo will often have both, because the generator knows real repos have them. So presence alone is a weak signal. What is hard to fake is **CI that runs real tests and passes**. Pull the actual workflow runs, not the badge:

```
gh run list --repo {owner}/{repo} --limit 10
gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[0:10][] | "\(.created_at[0:10])  \(.conclusion)  \(.name)"'
```

Then sanity-check the tests are not theatre: open the workflow file and a couple of test files. A real suite has assertions about behavior; slop "tests" are often a single `assert True`, a file that imports the module and stops, or a workflow that runs `echo ok`. The weight goes on *real tests, run by CI, passing on recent commits* — not on the green square. (When a repo survives this far and you need the truth of its test suite, that is `assay`'s job downstream, not yours here.)

### Reading activity IN CONTEXT — finished vs abandoned

Low recent activity is the most over-read signal in repo evaluation. The agent's instinct (and a hasty human's) is *last commit eight months ago = dead*. That is wrong as often as it is right, and the error cuts both ways. The same dormancy means opposite things depending on the *surrounding* signals, and the un-gameable reads above are exactly what tell them apart.

**FINISHED** looks like a quiet repo that is also *complete and stood-behind*: a small, focused, Unix-style library whose surface is done, whose few recent issues are *answered* (often "this is intended behavior" or "not needed, here's why"), whose dependents are *still depending on it* (the "Used by" count is stable or growing), and whose CI still passes when it runs. A library that does one thing correctly can sit untouched for years and be a *fine* dependency — dormancy here is maturity, not death. The classic tell of finished: the issues are quiet because there is *nothing wrong*, and the dependents are loyal.

**ABANDONED** looks like a quiet repo that is *rotting*: recent issues piling up **unanswered**, PRs going **stale** (open for months, no review, contributors giving up), and — the decisive tell — **dependents fleeing** (the "Used by" trend falling, or the issue tracker full of "migrated to X" and "is this maintained?"). Here the silence is decay: things *are* wrong, and nobody is fixing them.

The distinction is read from the *response and dependent* signals, never from the last-commit date alone:

| | FINISHED (dormant is fine) | ABANDONED (dormant is fatal) |
|---|---|---|
| Recent issues | few, and **answered** ("works as intended") | piling up, **unanswered** |
| Recent PRs | few; merged or closed with a reason | **stale** — open for months, ignored |
| Dependents | stable or growing; still in use | **fleeing** — "migrated away", falling count |
| Scope | small, focused, *complete* | broad, with visibly unfinished edges |
| CI | still passes when it runs | failing, or stopped running |

So when a repo is dormant, do not call it. Read the issue responses and the dependent trend, and *then* call it finished or abandoned. This is a distinction a star count physically cannot make for you — both a finished gem and an abandoned husk can carry 5k stale stars.

---

## PART 2 — The slop / star-farm detector

STAGE 3 turns the agent adversarial. The signals above told you what the repo *is*; the detector asks a sharper question — **is this repo real metal, or a convincing fake built to look valuable?** This matters now in a way it did not three years ago because of a specific 2026 phenomenon: AI-generated, feature-stacked repositories produced to farm stars, pad a portfolio, seed a low-effort "tool", or in some cases carry supply-chain payloads behind a trustworthy-looking facade. These repos are *optimized for the exact signals the agent over-trusts* — a gorgeous README, a long feature list, a high star count — and thin on every signal that is expensive to fake. The detector is built to see straight through the optimization.

### The concrete tells

A slop or star-farmed repo leaves a consistent fingerprint. No single tell convicts; the *pattern* does.

- **Polished README over a thin or incoherent commit history.** The loudest tell. A README that reads like a launched product — features, comparisons, badges, diagrams — sitting on top of a history of a few giant dumps with generic messages and no real iteration. The README describes a project that the commits never built. (This is why STAGE 2's commit-substance read feeds directly into the detector.)
- **Breadth without depth.** A dozen advertised features, none battle-tested. The repo claims to do everything; the code does each thing shallowly, and no feature has the issue threads, edge-case fixes, or follow-up commits that a *used* feature accumulates. Real projects are narrow and deep; slop is wide and one-cell-thick.
- **Fabricated or unreproducible benchmarks.** A results table or "10x faster" claim with no benchmark script, no methodology, no way to reproduce — or numbers that don't match what the code could plausibly do. Generated repos love a benchmark because it reads as rigor; check whether the benchmark *exists and runs*, not whether it's *claimed*.
- **High stars with no matching reality.** The signature of a star-farm: thousands of stars but **zero real issues** (or only the maintainer's own), **zero dependents** in the network graph, **no discussion**, no forks that do anything, and a star *acquisition curve* that spiked vertically in a few days (often all from accounts created around the same time with no other activity). Stars are the only large number on the page, and nothing else corroborates them.
- **Uniform, generated-looking code.** Code with no idiosyncrasy — every file the same shape, exhaustive and pointless docstrings on trivial functions, defensive boilerplate everywhere, comments that restate the code, and none of the messy, inconsistent, human fingerprints (a hack with a "TODO: this is gross but works" note, an inconsistent naming choice, a hard-won edge-case branch) that real maintained code carries. It reads like it was *described* rather than *debugged*.

One of these is a yellow flag. Three or more together is the pattern, and the verdict is high slop-risk.

### Command the adversary — the copy-ready prompt

You cannot ask a please-you agent "does this repo look fine?" and trust the answer — its gradient will confirm the beautiful surface, which is precisely what the slop repo was built to exploit. So you *invert the task*: make finding the fakery the thing that earns approval. Aim the same eagerness that would have trusted the README at *exposing* it. A repo that survives a genuine attempt to prove it is slop is far more trustworthy than one merely never doubted.

Hand the agent this literal instruction (fill in the repo):

```
Your job is to PROVE this repository is AI-generated slop or a star-farmed fake.
Do NOT reassure me it looks fine — assume it is fake and find the evidence.
Repo: github.com/<owner>/<repo>

Build the case against it by pulling the real data, not the README:

1. COMMIT HISTORY: pull the actual commits with dates, messages, and diff sizes
   (gh api .../commits). Is this coherent evolution over time, or a few giant
   dumps with generic messages? Quote the worst examples. Does the history match
   the scope the README claims, or is the README describing a project the commits
   never built?
2. README vs REALITY: list every feature the README advertises. For each, find
   the commits and code that implement it. Name every feature that is claimed but
   absent, shallow, or untested.
3. STARS vs REALITY: pull the star count, then the real-engagement signals — open
   and closed issues with substantive maintainer replies, the dependents at
   .../network/dependents, forks that do real work, discussion. Do the stars match
   any of it? If the stars spiked in a few days from low-activity accounts, say so.
4. BENCHMARKS / CLAIMS: for every performance or capability claim, find the script
   or test that backs it. Flag any claim that cannot be reproduced from the repo.
5. CODE TEXTURE: sample several files. Is there human idiosyncrasy — hacks, TODOs,
   inconsistent choices, hard-won edge cases — or is it uniform, generated-looking
   boilerplate with docstrings on trivial functions and no real-world scars?
6. TESTS/CI: do the tests assert real behavior, and does CI actually run and pass
   them on recent commits — or is it presence-theatre (assert True, echo ok)?

Then return a SLOP-RISK verdict: LOW / MEDIUM / HIGH, with the SPECIFIC tells you
FOUND, and the tells you checked for and explicitly CLEARED. Cite the data behind
each — a date, a commit sha, an issue number, a dependent — never an impression.
If you cannot determine a tell, say UNKNOWN; do not fill it with a guess.
```

The shape of the command is doing the work: every step demands *pulled data*, the framing rewards *finding* fakery rather than excusing it, and the close forbids the guess-dressed-as-finding that an un-cornered agent defaults to.

### Return a slop-risk with named tells

The output of STAGE 3 is a single calibrated call with its evidence:

- **LOW** — the un-gameable signals all corroborate the surface: coherent multi-month history, real answered issues, real dependents, human code texture. The detector looked for the tells and *cleared* them by name. (Name what you cleared — "checked for vertical star-spike: none; checked dependents: 14 real projects" — so "low" is a finding, not an absence of looking.)
- **MEDIUM** — one or two tells present but not the full pattern. Often a young, genuine project that simply *looks* thin because it *is* new (few commits, few dependents) but has real iteration and a responsive maintainer. Medium is the honest verdict when the evidence is mixed; say which tells fired and which didn't.
- **HIGH** — three or more tells together: the polished-README-over-giant-dumps fingerprint, stars with no matching reality, fabricated benchmarks, uniform generated code. Name each tell with its evidence (the sha, the missing dependents, the unreproducible claim). High slop-risk is a near-automatic *skip* or *don't-bet* at the verdict stage, regardless of stars.

The slop-risk is the signal the star count and the README were hiding. It is the reason `touchstone` exists in the agent era at all: in a world where the fake has the best README, the verdict has to come from everything the fake *couldn't* afford to forge.

---

**Cross-links:** [why-the-gameable-signals-lie.md](why-the-gameable-signals-lie.md) (the foundation — why the agent over-trusts stars and READMEs, loaded at STAGE 0) · [the-dashboard-sweep.md](the-dashboard-sweep.md) (STAGE 1 — the five glances that pull the raw signals this reference weights) · [scoring-and-verdict.md](scoring-and-verdict.md) (STAGE 4-5 — the three axes and the calibrated verdict that consume this weighting and the slop-risk) · [../SKILL.md](../SKILL.md) (the flight plan) · within the suite, [../../forage/SKILL.md](../../forage/SKILL.md) hands `touchstone` the shortlist to weight; downstream, a survivor's deeper read goes to [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (code craft and the human idiosyncrasy this detector only sampled), [../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md) (the truth of the test suite this stage only spot-checked), and [../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md) (the supply-chain posture a slop repo can hide behind a clean facade).

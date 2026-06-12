---
name: touchstone
description: >
  The repository-evaluation lens: judge whether a repo is worth your time in a
  few minutes — by SCANNING its dashboards, not reading its code. It runs the
  five-glance checkup (homepage · README skeleton · issue & PR interaction ·
  the Insights/contributors view · the file tree) and scores three axes —
  ALIVE (still maintained?), HEALTHY (will it be orphaned?), and WELL-BUILT
  (is the code likely any good?). The one shift: an agent can check fifty repos
  in seconds, but it over-trusts exactly the two signals that are easiest to
  fake — the star count and a polished README — which is precisely what an
  abandoned project or an AI-generated, feature-stacked, star-farmed repo wears
  best. So touchstone INVERTS the weighting: discount the gameable signals,
  weight the ones that can't be faked (commit substance, issue-RESPONSE quality,
  bus factor, real downstream "Used by", tests and CI), and trace every judgment
  to the actual repo. Use when sizing up a repo or a batch before depending on,
  contributing to, or learning from them; when a project "looks good" and you
  want to know if it really is; or to vet a shortlist from `forage`. Triggers on
  "is this repo any good", "should I use/trust this library", "evaluate this
  project", "is this maintained", "is this AI-generated slop", "compare these
  repos", "vet this dependency", "rate this GitHub project". Installs the
  five-glance dashboard sweep, the gameable-vs-un-gameable signal weighting, the
  AI-slop / star-farm detector, the three-axis score, and the verdict calibrated
  to YOUR use-context (a weekend tryout and a production dependency pass
  different bars). The agent is the MEANS (the dashboard reader and the
  adversary), never the oracle; you keep the calibration — what the score means
  for your risk. Hands deep-dive survivors to the engineering suite.
argument-hint: "[a repo (or batch / forage shortlist) to evaluate, and what you'd use it for]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# touchstone

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A touchstone is the dark stone a jeweler rubs gold against to tell real metal from a convincing fake. `touchstone` is what you rub a repository against to tell genuine quality from the things that merely *look* like it — before you stake an afternoon, a dependency, or a production system on it. It is the second skill of the `quarry` suite: it owns *evaluation* — the fast, deliberate scan that turns a candidate into a verdict. It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each glance before the next — not the *substance* of the judgment inside it; the tool structures the discipline, it does not supply it, so the calibration is yours.

**The one mental shift everything hangs on — weight the signals that can't be faked, not the ones that can.** The goal is not to read the project; it is to scan a handful of dashboards and form a fast "worth more of my time?" judgment. An agent is superb at this *mechanically* — it can pull the commit history, release cadence, issue timeline and contributor graph for fifty repos in seconds. But its instinct is to rank them by the **star count and the README**, and those are precisely the two signals that are **cheapest to manufacture**: stars can be farmed, and in 2026 a fluent, feature-rich README sitting on top of a thin or incoherent commit history is the signature of AI-generated slop. So `touchstone` inverts the convenience-ordering a tired human falls into: **down-weight stars and README polish to suspect-until-corroborated, and up-weight the expensive-to-fake signals** — whether the commits are real changes or padding, whether the maintainer actually *responds* in issues, the bus factor, the real downstream "Used by", and the presence of tests and CI. The verdict is built from what is hard to fake.

**The agent is the means, not the oracle.** Here it has two jobs: the **dashboard reader** (pull the real signals fast, from the actual repo) and the **adversary** (actively look for the tells that this is dead, abandoned, or slop). It is *not* the judge of whether the repo is right *for you*. Its gradient points at a confident, tidy verdict, and it will reach one by trusting the surface and **filling gaps with plausible facts** — asserting "actively maintained" from a high star count, or inventing a contributor statistic it never pulled. So one discipline is absolute: **every claim traces to the actual repo.** A number is read from the repo's data or it is not stated; "well-maintained" names the last-commit date and the issue-response pattern behind it, or it is not claimed; when a signal can't be determined, the verdict says *unknown*, never a guess dressed as a finding.

**What you cannot delegate — the calibration.** The agent can score the axes; only you can say **what the score means for your situation**, because the bar moves with the use. The same repo — a clever, fast, single-maintainer tool, last touched eight months ago — is a *fine* pick to try out for a weekend, a *reasonable* base to read and learn from, and a *bad* bet to make a load-bearing production dependency. Low activity is not automatically bad: a small, focused, Unix-style library can be "finished" and correctly sit untouched for years. The agent reports the signals; **you** decide whether they clear the bar your context sets. Hand it the calibration and you have automated a context-free verdict onto a context-dependent decision.

**What "done" looks like — a calibrated verdict with its evidence, not a star-ranked list.** The checkup is over when each target has a **three-axis read** (alive / healthy / well-built), each axis backed by the specific signals behind it, a **slop-risk** call, and a **verdict calibrated to your use-context** — deep-dive, try it, don't-bet-in-production, or skip — with every claim traceable to the repo. For a batch, that is a ranked, justified shortlist; for one repo, a go/no-go with reasons. The terminus is the judgment plus its evidence, not "the one with the most stars".

**Speak the user's language.** The decision is the user's: whether to depend on, contribute to, or learn from a project, at the risk level they carry. Read their fluency and gloss a term on first use (the *bus factor*, *star-farming*, *feature-stacking*, the *issue-RESPONSE* signal as distinct from issue count, a *characterization* of "finished" vs "abandoned"). A verdict the user can't trace to a signal is an opinion imposed; show the dashboard behind the call, and let the bet be theirs.

**Read [references/why-the-gameable-signals-lie.md](references/why-the-gameable-signals-lie.md) first** — the must-be-told foundation: the scan-not-read principle, why the agent over-trusts stars and READMEs and how the slop era weaponizes both, the gameable-vs-un-gameable inversion, the trace-every-claim rule, the three axes, and the calibration the human keeps. It is the key that makes every glance below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-the-gameable-signals-lie.md](references/why-the-gameable-signals-lie.md)** — the foundation: scan dashboards not code, the agent as means (dashboard reader + adversary) and its signature failure (trusting stars/README and filling gaps with plausible facts), why stars and READMEs are the cheapest signals to fake and how AI-generated slop and star-farms exploit exactly that, the trace-every-claim rule, the three axes, and the calibration the human cannot delegate. Load at STAGE 0.
- [references/the-dashboard-sweep.md](references/the-dashboard-sweep.md) — the five-glance checkup in depth: the homepage 30 seconds (About, last-commit, star/fork/Used-by ratio, releases, license), the README *skeleton* (what/why/quickstart, screenshots, badges, "comparison with X"), the issue & PR *interaction* (response not count, open/closed trend, merged outside PRs), the Insights view (contributors, bus factor, commit-activity pulse, Community Standards), and the file-tree glance (tests/, CI config, CHANGELOG, dependency hygiene) — each with what to pull (via `gh`/API/web) and what good vs bad looks like. Load at STAGE 1.
- [references/signal-weighting-and-slop.md](references/signal-weighting-and-slop.md) — the inversion and the detector: ranking signals by how easily they're faked, the un-gameable set (commit substance, issue-RESPONSE quality, bus factor, real "Used by", tests/CI) and how to read each, and the AI-slop / feature-stacking / star-farm detector — the concrete tells (a polished README over a thin or incoherent history, breadth without depth, fabricated benchmarks, high stars with no real issues or users, uniform generated-looking code). Load at STAGE 2-3.
- [references/scoring-and-verdict.md](references/scoring-and-verdict.md) — landing the judgment: the three axes (alive / healthy / well-built) and the signals that compose each, the "finished vs abandoned" nuance, calibrating the verdict to the use-context (tryout / dependency / contribution / learning), the deep-dive / try / don't-bet / skip rubric, the structured report, and the handoffs to the engineering suite for the deep dive. Load at STAGE 4-5.

> **The pipeline is one arc.** Six stages — frame · scan · signal-weight · slop-check · score · verdict — turn a repo (or a batch) into a verdict you can act on. Framing sets the bar; the scan pulls the real dashboards; signal-weighting and the slop-check separate genuine quality from its convincing fakes; scoring reads the three axes from that evidence; the verdict calibrates to your use. `touchstone` gates all six below.

---

## STAGE 0 — Frame the checkup (what, for what, against which bar)

Open **[references/why-the-gameable-signals-lie.md](references/why-the-gameable-signals-lie.md)**. Internalize *scan-don't-read* and *the gameable signals lie*, then set the bar before the first glance.

- **Fix the targets and the use-context.** Name what is being evaluated — one repo, or a batch (a `forage` shortlist) — and, decisively, **what you would use it for**: a weekend tryout, a production dependency, a contribution target, or a thing to learn from. The use-context sets the bar, and the same repo clears it for one use and fails it for another. An evaluation with no declared use is a verdict with no scale.
- **Derive the bar from the context.** Write down what *this* use actually requires: a tryout needs little more than "it runs and roughly works"; a production dependency demands a survivable bus factor, real maintenance, and a clean security/dependency posture; a contribution target needs responsive maintainers and tractable issues; a learning source needs legible code over institutional health. The bar is what the later scoring is judged against.
- **Set the source discipline (every claim traces to the repo).** The agent is the means, not the oracle: its failure here is reaching a confident verdict by trusting the surface and filling gaps with plausible facts. Fix the rule now — every signal is **pulled from the actual repo** (via `gh`/API/web), every number is read not guessed, and any signal that can't be determined is reported as *unknown* rather than invented. No claim of "maintained" or "popular" without the dated evidence behind it.

### GATE — clear before SCAN
1. `checklist check frame targets-and-use-context-fixed`
2. `checklist check frame bar-and-source-discipline-set`
3. `checklist verify frame`

---

## STAGE 1 — Scan (the five-glance dashboard sweep, from the real repo)

Open **[references/the-dashboard-sweep.md](references/the-dashboard-sweep.md)**. Pull the dashboards, not the code — five glances, each from the actual repo.

- **Run the five glances and pull their real data.** **(1) Homepage 30s** — the About line and doc-site link, the last-commit date, the star/fork/"Used by" ratio, the releases (cadence and whether it's still 0.0.x), and the license (no license = unusable in any serious setting). **(2) README skeleton** — does it answer *what / why / how to start*, are there screenshots or a demo, what do the badges say (CI green or red, coverage), is there an honest "comparison with X". **(3) Issues & PRs** — open a few recent ones; **(4) Insights → Contributors** — the contributor distribution, the commit-activity pulse, and Community Standards; **(5) file tree** — `tests/`, a CI config under `.github/workflows/`, a `CHANGELOG`, and a sane dependency manifest with a lockfile.
- **Pull, don't presume.** Use `gh` / the API / web to read the actual numbers and dates; for a batch, pull them uniformly so the targets are comparable. A datum you didn't retrieve is not a datum.
- **Record signals, defer judgment.** This stage *gathers* the dashboard; weighting and scoring come next. Capture the raw reads (dates, counts, presence/absence) per target so the later stages have evidence to point at — and so every eventual claim has a source.

### GATE — clear before SIGNAL-WEIGHT
1. `checklist check scan dashboard-pulled-from-repo`
2. `checklist check scan facts-traced-not-asserted`
3. `checklist verify scan`

---

## STAGE 2 — Weight the signals (discount the gameable, read the un-gameable)

Open **[references/signal-weighting-and-slop.md](references/signal-weighting-and-slop.md)**. Not all signals are worth the same — rank them by how easily they're faked.

- **Discount the gameable signals.** A high **star count** and a **polished README** move the verdict the least: stars are farmable and lag reality, and a fluent README is the cheapest thing in the repo to produce (an agent can generate a beautiful one in a minute). Treat both as *suspect until corroborated*, not as evidence of quality.
- **Weight the expensive-to-fake signals.** Build the read from what is costly to manufacture: **commit substance** (are the commits real, coherent changes over time, or padding and a single dump?), **issue-RESPONSE quality** (does the maintainer actually engage — not how *many* issues, but whether recent ones get a substantive reply), **bus factor** (is 95% of the work one person, and are they still active?), real **downstream "Used by"** and dependents, and the **presence of tests and CI**. These are the signals a fake can't cheaply wear.
- **Read activity in context, not as a verdict.** Low recent activity is ambiguous, not damning: a small, complete, Unix-style library can be correctly dormant. Distinguish *finished* (stable surface, issues answered, used downstream) from *abandoned* (open issues piling unanswered, PRs rotting, dependents fleeing) — a distinction stars cannot make for you.

### GATE — clear before SLOP-CHECK
1. `checklist check signal-weight gameable-discounted`
2. `checklist check signal-weight ungameable-assessed`
3. `checklist verify signal-weight`

---

## STAGE 3 — Slop-check (real metal or convincing fake?)

Open **[references/signal-weighting-and-slop.md](references/signal-weighting-and-slop.md)** (the detector section). Turn the agent adversarial: try to show this is a fake.

- **Run the AI-slop / star-farm detector.** Look for the tells of a repo built to *look* valuable: a too-polished, feature-listing README sitting over a **thin or incoherent commit history** (a few giant dumps, not real evolution); **breadth without depth** (a dozen advertised features, none battle-tested); **fabricated or unreproducible benchmarks**; a **high star count with no matching reality** (no real issues, no dependents, no discussion); and **uniform, generated-looking code** with no idiosyncrasy of a real maintainer. Any one is a yellow flag; several together is the pattern.
- **Command the adversary, don't ask it nicely.** Tell the agent its job is to find the evidence this is slop or farmed, not to confirm the repo is fine — the same please-you gradient that makes it trust the README will, redirected, make it a good detector. A repo that survives a genuine attempt to expose it as fake is far more trustworthy than one merely never doubted.
- **Return a slop-risk verdict with its tells.** Low / medium / high, naming the specific tells found *or* explicitly cleared. This is the signal stars and the README were hiding — and the reason this suite exists in the agent era at all.

### GATE — clear before SCORE
1. `checklist check slop-check ai-slop-and-farming-checked`
2. `checklist verify slop-check`

---

## STAGE 4 — Score the three axes (from evidence, not from stars)

Open **[references/scoring-and-verdict.md](references/scoring-and-verdict.md)**. Read each axis off the weighted evidence.

- **Score the three axes per target.** **Alive** (is it still being worked on?) — last commit, release cadence, issue-response recency. **Healthy** (if the lead leaves, does it die?) — bus factor, external contributors, whether a company or foundation stands behind it. **Well-built** (is the code likely good?) — tests (by *strength* — test-function and assertion density, counted inline, weighed against a baseline repo, not the presence of a `tests/` folder), CI, CHANGELOG, documentation structure, and the *quality* of the maintainer's replies in issues. Score each axis explicitly; for a batch, on a consistent scale so targets are comparable.
- **Back every axis with its evidence, not its stars.** Each score names the signals behind it (from STAGE 1-3), never the star count. "Well-built: strong — full test suite, green CI, every recent issue answered with a concrete fix" is a score; "well-built: it has 12k stars" is the mistake this whole skill is built to prevent.
- **Let the axes disagree.** The three axes are independent and a healthy read often splits them — a *finished* tool scores low on Alive but high on Well-built; a hot new project scores high on Alive but low on Healthy (single maintainer, no institutional backing). The split is information; don't average it into a single misleading number.

### GATE — clear before VERDICT
1. `checklist check score three-axes-scored`
2. `checklist check score scored-from-evidence-not-stars`
3. `checklist verify score`

---

## STAGE 5 — Verdict (calibrate to the use, then hand off)

Open **[references/scoring-and-verdict.md](references/scoring-and-verdict.md)** (the verdict section). The score is not the answer until it's measured against *your* bar.

- **Calibrate the verdict to the use-context.** Read the three axes against the bar set in STAGE 0 and land one call: **deep-dive** (clears the bar, worth a real look at the code), **try it** (good enough for a tryout/learning, not a production bet), **don't-bet-in-production** (fine to play with, fails the dependency bar — low health, high slop-risk, or a bus factor of one), or **skip**. The same axis-read yields different verdicts under different bars, and naming the bar is what makes the verdict honest. A high-Alive / low-Healthy project is a *try it*, not a *deep-dive*, for a production decision.
- **Make the verdict traceable.** Every claim in it points back to a signal pulled in STAGE 1 — a date, a count, an issue thread, a contributor split — so the user can check the reasoning rather than trust the conclusion. For a batch, this is a ranked, justified shortlist; for one repo, a go/no-go with reasons. (This structured, evidence-backed report is what supersedes the old "search-and-score-and-summarize" one-shot.)
- **Hand off the survivors.** A repo worth a deep dive goes to the engineering suite — `plumb` for code craft, `assay` for the real state of its tests, `aegis` for its security and dependency posture, `husbandry` for the cost of taking it on as a long-lived dependency — and a contribution target to the contribution workflow. `touchstone` ends at "worth the deeper look"; it does not read the source line by line.

### FINAL GATE — the verdict is rendered
1. `checklist check verdict verdict-calibrated-to-context`
2. `checklist check verdict handoff-and-traceable`
3. `checklist verify verdict`
4. `checklist show` — confirm all **six** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`touchstone` is the **repository-evaluation lens**, rubbed against a candidate to tell real value from its convincing fakes. Its six stages are one arc against one enemy — **the repo that looks good and isn't**: the dead project with a beautiful README, the star-farm, the AI-generated feature-stack, the single-maintainer tool you almost made a production dependency. Framing (0) sets the bar from your use and arms you against the agent's trust in the surface; the scan (1) pulls the real dashboards from the actual repo; signal-weighting (2) and the slop-check (3) discount what's easy to fake and hunt the tells of what's faked; scoring (4) reads the three axes off that evidence; the verdict (5) measures the score against *your* bar and hands the survivors on. The through-line is the suite's own — *the cost should match the find*: a five-minute scan that is mostly the agent's labor, spent so you don't lose a week to a repo that was never real.

It pairs with its sibling without doing its job. Inside `quarry`, **[forage](../forage/SKILL.md)** owns *finding* and hands `touchstone` a shortlist with provenance and a use-context; `touchstone` owns *judging* and returns a calibrated verdict. Then it routes onward for the work it deliberately stops short of: the engineering suite reads what a dashboard can't — `plumb` the code's craft, `assay` the truth of its test suite, `aegis` its security and supply-chain posture, `husbandry` the long-run cost of depending on it — and the contribution workflow takes a chosen target forward. For an agent the lever is the same everywhere: it will hand you a confident "looks great" built from a star count and a fluent README, feeling none of the production incident a star-farmed dependency will cause — so the repo must be **scanned, weighted, slop-checked, and scored from evidence**, with the bar set by the one person who carries the risk.

## Anti-patterns (use as a pre-flight checklist)

- **Reading the code to evaluate** — the checkup is a dashboard scan, not a code review; the deep read is `plumb`/`assay`'s job, downstream of a passing verdict.
- **Ranking by stars** — a star count records past attention and is farmable; weight the signals that can't be cheaply faked instead.
- **Trusting the README** — a fluent, feature-rich README is the cheapest thing in the repo to produce and the favorite mask of AI-generated slop; corroborate it, don't believe it.
- **No use-context** — "is this good?" has no answer without "good for what?"; set the bar from the use before scoring.
- **Counting issues instead of reading the response** — 800 issues all answered beats 10 all ignored; the signal is whether the maintainer engages, not the count.
- **Missing the bus factor** — one person at 95% who went quiet three months ago is a production risk no star count discloses; check the contributor split and their recent activity.
- **Calling low activity "dead"** — a finished, focused library can be correctly dormant; distinguish finished (issues answered, used downstream) from abandoned (issues rotting, dependents fleeing).
- **Skipping the slop-check** — in the agent era the polished-fake is the default failure; run the detector and command the agent to attack, not confirm.
- **Asserting an un-pulled fact** — "actively maintained" with no date behind it is a guess; every claim traces to a signal read from the actual repo, and unknown is reported as unknown.
- **Averaging the axes into one number** — alive / healthy / well-built routinely disagree, and the split is the information; don't blend it into a misleading single score.
- **A verdict with no bar** — the same repo is a fine tryout and a bad production bet; name the use the verdict is calibrated to, or it's just an opinion.
- **Skipping a GATE** — and remember the cheapest evaluation failure is the beautiful repo you trusted on its stars and lost a week to.

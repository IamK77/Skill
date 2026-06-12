# Why the Gameable Signals Lie — the foundation behind STAGE 0 (Frame)

This reference is the depth and foundation behind **STAGE 0 — Frame the checkup** of the [../SKILL.md](../SKILL.md) flight plan: the must-be-told key that makes every later glance derivable rather than memorized. It governs why a repo evaluation is a *scan* and not a *read*, why the agent is a means and not a verdict-machine, which signals you trust and which you discount, and the source discipline you fix *before* the first dashboard loads. It backs the two frame checks: `targets-and-use-context-fixed` and `bar-and-source-discipline-set`. Read it once in full; the sweep, the weighting, the slop-check, and the scoring are all consequences of what is installed here.

> Stars and the README are the two cheapest signals in a repository to manufacture, and they are exactly the two an agent reaches for first. So the evaluation inverts the convenient ordering: discount what is cheap to fake, weight what is expensive to fake, and let no claim into the verdict that wasn't read off the actual repo. The agent is the dashboard reader and the adversary — never the oracle — and a beautiful surface is not evidence of anything underneath it.

---

## The whole checkup in one line

Before the parts, the arc — so you read every section below as a piece of one machine:

> **frame the bar from your use → scan five dashboards from the real repo → weight the signals (discount gameable, read un-gameable) → run the slop / star-farm detector → score the three axes off that evidence → calibrate the verdict to your use and hand off the survivors.**

Everything in STAGE 0 exists to make that machine aim at the right repo, judged against the right bar, and immune to its most dangerous input: a confident agent that will hand you "looks great" built from a star count and a fluent README, feeling none of the production incident a star-farmed dependency will cause six months from now. The rest of this document is the *why* under the frame.

---

## 1. Scan, don't read — the goal is "worth more of my time?"

The thing `touchstone` produces is a **fast triage judgment**, not a code review. You are not auditing the source; you are looking at a handful of dashboards and answering one question: *is this repo worth more of my time?* The deep read — the line-by-line look at craft, the real state of the test suite, the security and supply-chain posture — is deliberately downstream, in the engineering suite (`plumb`, `assay`, `aegis`, `husbandry`), and it only happens for a repo that **survives the scan**. Spending an hour reading the code of a repo you could have eliminated in ninety seconds from its Insights tab is the inverted economics this skill exists to prevent.

So the unit of work is the **glance**, not the file. The five-glance sweep (its depth is in [the-dashboard-sweep.md](the-dashboard-sweep.md)) reads the homepage, the README *skeleton*, the issue and PR *interaction*, the Insights/contributors view, and the file tree — each in seconds, each from the live repo. The whole point of the scan is to be cheap enough that you run it on a *batch*. An agent can pull the commit history, release cadence, issue timeline, and contributor graph for fifty repos in the time a human opens three browser tabs. That throughput is the entire reason the agent era changes this task: the labor that made repository evaluation a chore — clicking through dashboards, tabulating dates and counts — is exactly the labor that now parallelizes.

The verb matters. You do not *read until you form an opinion*; you *scan fixed dashboards and read the signals off them*. A scan that drifts into reading the code is a scan that has forgotten its job: it has spent the deep-read budget before earning the right to. **The deliberate cheapness is the design, not a corner cut.** If a repo deserves a real read, the scan says so and routes it onward; the scan itself stays a triage.

---

## 2. The agent is the means, not the oracle

`touchstone` uses the agent as a **tool**, and it has exactly two jobs. Naming them as a hard boundary matters, because every misuse is a drift outside it.

- **The dashboard reader — the mechanical labor.** Pull the last-commit date, the release tags, the star/fork/Used-by counts, the open/closed issue trend, the contributor distribution, the presence or absence of `tests/` and a CI config. For one repo or fifty, uniformly, fast, from the live repo. This is throughput you could never match by hand, and it is what makes the batch scan possible at all.
- **The adversary — the attack.** Turned loose in the slop-check, its job is to *find the evidence this repo is dead, abandoned, or AI-generated slop* — not to confirm it's fine. The same please-you gradient that makes it trust a polished README will, redirected, make it a sharp detector of the tells that README is hiding.

Notice what is **not** on the list: **deciding whether the repo is right for you.** The agent does not tell you the verdict. It is not the source of truth. It reads dashboards and it attacks; you set the bar and you make the call.

The moment you treat its summary as the finding rather than the raw material — the moment you accept "this looks like a solid, well-maintained library" as a verdict instead of as a set of claims each owed an evidentiary source — you have promoted the means to an oracle. And this particular oracle has a **signature failure** worth installing as an operating assumption, not a caveat.

### The signature failure: trusting the surface and filling gaps with plausible facts

Left soft, the agent reaches a confident, tidy verdict the cheapest way available: by **trusting whatever the surface shows** and **filling the gaps with plausible facts**. Concretely, in this task, that produces two moves that wreck an evaluation:

- **It asserts a conclusion from a proxy it never checked.** "This project is actively maintained" — derived from a high star count, not from a last-commit date it pulled. Stars do not measure maintenance; they measure past attention, much of it stale or bought. The agent collapses *popular* into *maintained* because both read as "good" and the leap is invisible in fluent prose. A repo can have 40k stars and a last commit fourteen months ago; the star count cannot tell you that, and the agent that ranks by stars will call it healthy.
- **It invents a statistic it never pulled.** Asked about the contributor base, it will produce a number that *should* be true — "around a dozen active contributors," "the top contributor accounts for maybe 60% of commits" — because a confident, well-formed answer reads as more helpful than "I didn't pull the contributor graph." The figure is generated to satisfy the request, not retrieved from the Insights tab. A fabricated bus-factor number is the most expensive of these: it can green-light a single-maintainer project as institutionally safe, or condemn a healthy one, with equal fluency.

These are not occasional bugs to catch. They are the **default output** of a soft interaction, and they are why STAGE 0 sets the source discipline *before* the first dashboard loads. The agent's gradient points at a clean verdict that pleases you now; it feels none of the future cost of a wrong one. So you structure the interaction against that gradient from the start.

---

## 3. The core inversion: the cheapest signals to fake are the ones the agent trusts most

Here is the load-bearing fact of the whole skill. **The two signals an evaluator instinctively leans on — the star count and the README — are the two cheapest things in the entire repository to manufacture.** Rank every signal by *how much it costs an adversary to fake*, and the convenient ones sit at the bottom.

**Stars are farmable and they lag reality.** A star is one click; star-farming services sell them in bulk; a repo that trended once and was abandoned keeps its stars forever. The count records *past attention*, possibly bought, and says nothing about whether the project is alive *now*. Two repos with 8k stars each can be a thriving dependency and a two-year corpse, and the number is identical on both.

**A fluent, feature-rich README is the cheapest artifact in the repo to produce.** Of everything in a repository, the README is the part that takes the least effort to make look excellent — and in 2026 an agent can generate a beautiful one, with a feature list, a comparison table, badges, and a quickstart, in under a minute. README polish and project quality were never tightly coupled; in the agent era they have come apart completely. A gorgeous README sitting on top of a thin or incoherent commit history is not a sign of a good project. It is the *signature of the failure mode this skill is built to catch*.

### Why the slop era weaponizes exactly these two

The reason the inversion is now urgent, and not just good hygiene, is that **AI-generated slop targets precisely the two cheap signals.** A slop repo — feature-stacked, never battle-tested, often built to farm attention — invests where investment is cheap and visible: the README and the star count. It generates a fluent README advertising a dozen capabilities, then farms or buys the stars to make the README look earned. Both signals are loud, both are fake, and both are exactly what a tired human or an eager agent reads first. The slop repo wears the two cheapest masks because they are the two an evaluator trusts. That is not a coincidence; it is the optimization.

The full detector — the concrete tells of AI-slop, feature-stacking, and star-farming — lives in [signal-weighting-and-slop.md](signal-weighting-and-slop.md). What STAGE 0 installs is the *inversion itself*, because every later stage is downstream of it:

| Signal | Cost to fake | How to treat it |
|---|---|---|
| **Star count** | One click each; farmable in bulk; lags reality | **Discount.** Suspect until corroborated. Never a verdict input. |
| **README polish / feature list** | Minutes for an agent; the cheapest artifact in the repo | **Discount.** Corroborate against the history, don't believe. |
| **Commit substance** | Years of real, coherent change; cannot be back-filled cheaply | **Weight.** Real evolution vs. a few giant dumps. |
| **Issue-RESPONSE quality** | Requires a human who actually engages, over time | **Weight.** Not issue *count* — whether recent ones get a substantive reply. |
| **Bus factor** | Cannot be faked; it's a fact about the contributor graph | **Weight.** Is 95% of the work one person, still active? |
| **Real downstream "Used by"** | Other real projects must actually depend on it | **Weight.** Dependents are expensive to fabricate. |
| **Tests / CI** | A real suite and a green pipeline take real work | **Weight.** Present and passing, or absent. |

The rule the frame sets: **down-weight stars and README polish to suspect-until-corroborated; up-weight the expensive-to-fake signals.** The verdict is built from what is hard to fake. A repo that survives because its *commit history is real and its maintainer answers issues* is trustworthy in a way a repo that "has 12k stars and a great README" never is — because the first set of signals costs an adversary years to forge and the second set costs a minute.

---

## 4. Trace every claim — a number is read or it is not stated

The discipline that defeats the signature failure (§2) is a single rule, fixed at STAGE 0 and non-negotiable for the rest of the checkup: **every claim in the verdict traces to the actual repo.**

Concretely, three commitments:

1. **A number is read from the repo, or it is not stated.** "1,847 stars," "last commit 2026-05-30," "top contributor is 71% of commits in the last year" — each is a figure pulled from the live repo via `gh`, the REST/GraphQL API, or the web UI, or it does not appear. No round-number estimate, no "roughly a dozen contributors" that was never retrieved. A datum you didn't pull is not a datum.
2. **A qualitative claim names the signal behind it.** "Well-maintained" is not a claim; it is a conclusion. The claim is "last commit was nine days ago and the three most recent issues each got a substantive maintainer reply within a week" — and *that* supports "well-maintained." Strip the evidence and you have an opinion the agent generated to please you.
3. **Unknown is reported, never guessed.** When a signal can't be determined — the dependents graph is empty, the contributor data didn't load, the test directory is ambiguous — the verdict says **unknown** for that signal. An honest "I couldn't determine the bus factor" is worth more than a fabricated one, because the fabricated one is invisible: it reads exactly like a real finding and quietly decides the verdict.

State the rule to the agent at the outset, so its output arrives in a shape you can check. This is the copy-ready instruction the frame promises:

```
You are evaluating GitHub repositories. Standing rule for every claim you make
about any repo, no exceptions:

1. Every NUMBER is read from the actual repo — via `gh`, the GitHub API, or the
   live page — and you state WHERE you read it. Do NOT estimate, round, or
   produce a plausible-looking figure you did not retrieve. If you did not pull
   it, you do not have it.
2. Every QUALITATIVE claim ("maintained", "popular", "healthy", "well-built")
   must name the dated signal behind it (last-commit date, issue-response
   pattern, contributor split, tests/CI presence). A claim with no signal behind
   it is not allowed in the output.
3. If a signal cannot be determined, write "UNKNOWN — could not retrieve" for it.
   Never fill a gap with a fact that sounds right. An honest unknown is required;
   a confident guess is forbidden.
4. NEVER infer "maintained" from a star count, or "good" from a README. State
   stars and README content as raw observations only, flagged suspect-until-
   corroborated — never as evidence of quality.

Output each repo's signals as a table: | signal | value | source | confidence |.
I will spot-check your numbers against the repo. A confident wrong number is
worse to me than an honest "unknown".
```

The pull tools are concrete. `gh repo view OWNER/REPO --json stargazerCount,forkCount,pushedAt,isArchived,licenseInfo,latestRelease` returns the homepage facts in one call. `gh api repos/OWNER/REPO/commits` reads the real commit cadence; `gh issue list --repo OWNER/REPO --state all --limit 20 --json number,title,createdAt,closedAt,comments` reads the issue *interaction*. The contributor split and the "Used by" panel live in the web UI — the contributors graph under `/OWNER/REPO/graphs/contributors`, the dependents under `/OWNER/REPO/network/dependents` (Insights → Dependency graph → Dependents). The point is not the exact command; it is that **the source exists and was used.** A claim with a real source behind it can be checked; a claim the agent invented cannot, and reads identically until it costs you a week.

---

## 5. The three axes — what the scan is actually measuring

The scan does not produce one blurry "quality" score. It reads three **independent** properties, and naming them now keeps the later scoring (its depth is in [scoring-and-verdict.md](scoring-and-verdict.md)) from collapsing into a single misleading number.

- **Alive — is it still being worked on?** Last-commit date, release cadence, recency of issue responses. Measures whether the project is moving *now*.
- **Healthy — if the lead leaves, does it die?** Bus factor, external contributors, whether a company or foundation stands behind it. Measures *survivability* — the risk that the project orphans.
- **Well-built — is the code likely any good?** Tests, CI, a real CHANGELOG, documentation structure, and the *quality* of the maintainer's replies in issues. Measures the odds that what's underneath the dashboards is sound.

The three are **independent on purpose, and they routinely disagree** — that split is information, not noise to average away. A small, finished Unix-style library scores low on Alive, low on Healthy (one author), and high on Well-built, and that combination is *fine* for many uses. A hot new framework scores high on Alive, low on Healthy (single maintainer, no institutional backing, no dependents yet), and middling on Well-built. Blend those into one number and you have destroyed the very information the three axes exist to expose. The frame names the three so the scoring can keep them apart.

---

## 6. The calibration the human keeps — the score's meaning depends on the use

Here is what you cannot delegate. The agent can read the three axes off the evidence. Only you can say **what that read means for your situation**, because **the bar moves with the use.**

The same repo — a clever, fast, single-maintainer tool, last touched eight months ago — is:

- a **fine** pick to try out for a weekend (it runs, it roughly works, that's the whole bar);
- a **reasonable** base to read and learn from (legible code matters; institutional health doesn't);
- a **bad** bet to make a load-bearing production dependency (a bus factor of one and eight months of silence is a risk a star count never disclosed).

Same axis-read. Three different verdicts. The difference is entirely the **use-context**, and naming it is what makes a verdict honest rather than an opinion floating free of any bar. So STAGE 0 fixes the use before the first glance: a weekend **tryout**, a production **dependency**, a **contribution** target, or a thing to **learn** from. An evaluation with no declared use is a verdict with no scale.

The use sets the bar concretely. A tryout needs little more than "it runs and roughly works." A production dependency demands a survivable bus factor, real maintenance, and a clean security and dependency posture. A contribution target needs responsive maintainers and tractable issues. A learning source needs legible code over institutional health. The same signals clear one bar and fail another, which is why the bar is written down at the frame and the verdict is measured against it at the end.

### Low activity is not death — finished vs abandoned

One calibration error is common enough to call out by name: reading **low activity as "dead."** It often isn't. A small, focused, complete library can correctly sit untouched for years — it is **finished**, not abandoned. The Unix-tool ideal is a program that does one thing, does it well, and stops changing because there is nothing left to change. Its last commit being two years old is a sign of *completeness*, not decay.

The distinction is real and you can read it off the dashboards:

| | **Finished** | **Abandoned** |
|---|---|---|
| Commits | Quiet because the surface is stable | Quiet because the maintainer left |
| Recent issues | Answered (the maintainer still watches) | Piling up unanswered |
| Recent PRs | Triaged or closed with a reason | Rotting open for months |
| Dependents | Stable or growing — people still rely on it | Fleeing — issues mention migrating away |

Low Alive plus answered issues and stable dependents is *finished*. Low Alive plus rotting issues and fleeing dependents is *abandoned*. Stars cannot tell the two apart — both keep their stars. The agent, told to rank by activity, calls both "inactive" and may call both "dead." The human, reading the issue-response signal and the dependents trend, tells finished from abandoned and calibrates the verdict to the use: a finished library is a perfectly good dependency *if its job is done*; an abandoned one is a liability whatever its stars say.

This is the judgment the agent cannot make for you, because it requires a stake the agent does not carry and a use it does not have. Hand it the calibration and you have automated a context-free verdict onto a context-dependent decision — which is the most expensive kind of confident wrong answer, because it arrives wearing the costume of a finished evaluation.

---

## What STAGE 0 leaves you holding

Frame is the cheapest stage and the one that decides whether the scan aims true. When you clear its gate you should be holding two things, one per check:

- **Fixed targets and a declared use-context** (`targets-and-use-context-fixed`) — one repo or a batch, named, *and* what you'd use it for (tryout / production dependency / contribution / learning), so the later scoring has a bar to be judged against. No declared use means no scale for the verdict.
- **A bar and a source discipline, set before the first glance** (`bar-and-source-discipline-set`) — what *this* use actually requires, written down; and the trace-every-claim rule (numbers read not guessed, qualitative claims naming their signal, unknown reported not invented, stars and README discounted to suspect-until-corroborated), committed in writing and stated to the agent.

With those in hand, the agent becomes what it should be — a fast dashboard reader and a sharp adversary, pointed at the un-gameable signals, every claim traceable to the repo — and never what it must not be: an oracle that hands you "looks great" from a star count and a fluent README, and feels none of the cost when the star-farmed dependency takes down production. Now open [the-dashboard-sweep.md](the-dashboard-sweep.md) and run the five glances.

---

**Cross-links:** [the-dashboard-sweep.md](the-dashboard-sweep.md) (the five-glance sweep STAGE 0 sets up) · [signal-weighting-and-slop.md](signal-weighting-and-slop.md) (the gameable-vs-un-gameable inversion and the slop / star-farm detector) · [scoring-and-verdict.md](scoring-and-verdict.md) (the three axes scored, and the verdict calibrated to your use) · [../SKILL.md](../SKILL.md) (the flight plan) · sibling skill [../../forage/SKILL.md](../../forage/SKILL.md) (finding — hands `touchstone` a shortlist with a use-context) · downstream engineering suite for the survivors: [../../../engineering/plumb/SKILL.md](../../../engineering/plumb/SKILL.md) (code craft), [../../../engineering/assay/SKILL.md](../../../engineering/assay/SKILL.md) (the real state of the tests), [../../../engineering/aegis/SKILL.md](../../../engineering/aegis/SKILL.md) (security and supply-chain posture), [../../../engineering/husbandry/SKILL.md](../../../engineering/husbandry/SKILL.md) (the long-run cost of depending on it).

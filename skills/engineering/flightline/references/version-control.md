# Version Control & Branching

This reference is the depth behind **STAGE 1 — Version control & branching** of `flightline`. It covers four things: choosing a **branching strategy** matched to your release cadence and team scale; avoiding the **long-lived-branch trap** that ends in merge hell; **commit hygiene** that makes each change atomic and each message a durable record of *why*; and the **machine-enforced secret discipline** that keeps credentials out of history. Open it when STAGE 1 sends you here, after STAGE 0 has sized the project on team × cadence × agent-involvement (see [decision-tree.md](decision-tree.md)). The governing fact from that calibration carries straight through: **the gate is the quality** — an agent writes most of the diffs, has no self-discipline, and honors only what an automated, hard-to-game gate forces. Everything below is phrased for that reality; the broader reframing of every practice for the agent era lives in [agent-era-shifts.md](agent-era-shifts.md).

---

## Why branching strategy is a real decision, not a default

A branching strategy is a contract about *how often code returns to the trunk* and *how many released lines you maintain at once*. Pick wrong in the heavy direction and a two-person project drowns in ceremony; pick wrong in the light direction and a team shipping three supported major versions has nowhere to land a backported security fix. The classic guidance — match the strategy to release rhythm and team size — still holds. The agent era adds one pressure that tilts the default further toward lightweight integration: **a fleet of agents spawns more concurrent branches than a human team ever did, and a single long agent run can pile up a huge, unreviewable diff on one branch.** Both failure modes — many branches and fat branches — are cured by the same discipline: integrate small and integrate often. So the default leans hard toward trunk-based / GitHub Flow, and the heavier strategies must *earn* their weight.

---

## The strategy table — what each buys, what it costs, where it fits

| Strategy | How it works | What it buys | What it costs | Cadence / scale it fits |
|---|---|---|---|---|
| **Trunk-Based Development** | Everyone commits to `main` (or via tiny, hours-not-days branches); incomplete work hidden behind **feature flags**; trunk is *always* releasable | Minimal divergence → near-zero merge conflict; continuous integration in the literal sense; the fastest path to CD | Demands real discipline and tooling: feature flags, a fast green pipeline, and a culture of small commits. A red trunk blocks *everyone* | **Default for continuous delivery.** Teams of any size shipping daily/continuously; the strongest fit when agents author much of the code |
| **GitHub Flow** | One short-lived branch per change → PR → review + CI gates → merge to `main` → deploy. `main` is always deployable | The trunk-based benefits with an explicit **review + gate checkpoint** on every change — the PR is where the human-in-the-loop and the gates sit | Slightly more overhead than raw trunk commits; relies on PRs staying *small* or the review checkpoint rots into rubber-stamping | **The pragmatic default** for most teams, especially agent-assisted ones — the PR boundary is exactly where you constrain the agent's unit of work and run the gates |
| **Release branches** | Trunk for daily work; cut a `release/x.y` branch to stabilize; fixes flow trunk→branch (or branch→trunk via cherry-pick) | Lets you stabilize and ship a version while trunk keeps moving; a clean home for a hotfix to an already-released version | Backporting/cherry-picking is manual and error-prone; branches that linger re-introduce divergence | Layer *on top of* trunk-based/GitHub Flow when you have discrete releases (mobile app store builds, on-prem versions) but **not** indefinite multi-version maintenance |
| **Git Flow** | Long-lived `develop` + `main`, plus `feature/*`, `release/*`, `hotfix/*` branches with prescribed merge paths | A formal, well-documented process for **maintaining several released versions simultaneously** with scheduled releases | Heavy: many long-lived branches, the most divergence, the most merge pain, the steepest onboarding. The long-lived `develop` is itself a standing merge-hell risk | **Only** when you genuinely run multiple released versions at once (e.g. shipping v2 while still patching v1.x for enterprise customers). For a single continuously-deployed product it is over-engineering |

**PREDICATE — do you maintain more than one released version at the same time?**
- **NO (the common case)** → **DEFAULT: GitHub Flow** (or raw trunk-based if you have feature flags and a fast pipeline). Short-lived branches, PR per change, gates on merge.
- **YES, discrete releases but a single live line** → trunk-based/GitHub Flow **plus release branches** for stabilization and hotfixes. Don't adopt full Git Flow for this.
- **YES, several supported versions in parallel** → Git Flow (or a deliberately tailored multi-branch model) is justified. Accept the ceremony; it is buying real multi-version capability.

**FALLBACK when you can't yet tell:** start with GitHub Flow. It is the cheapest strategy to *escalate from* — adding a release branch later is trivial; unwinding Git Flow's standing branches is not. Under-committing to process is recoverable here; over-committing calcifies.

The branch-strategy router in [decision-tree.md](decision-tree.md) is the canonical fork; this table is the catalog it points into.

---

## The long-lived-branch trap → merge hell

A branch's cost is not its existence; it is its **divergence over time**. Every commit that lands on trunk while a feature branch sits open widens the gap the eventual merge must close. The relationship is worse than linear: conflicts interact, a rebased branch invalidates earlier conflict resolutions, and a branch that has drifted for weeks can require re-deriving decisions nobody remembers making. That endgame is *merge hell* — a single painful, high-risk integration that should have been a hundred trivial ones. The deeper damage is that the branch's code was, the whole time, **never actually integrated** — "it works on my branch" is the distributed-version-control twin of "it works on my machine."

### The agent-era sharpening

Two things get strictly worse when agents write the code:

1. **More branches.** A fleet of agents working in parallel opens far more concurrent branches than a human team would. Each one is an open divergence account accruing conflict interest. The arithmetic of merge hell is combinatorial in the number of open branches, and agents push that number up.
2. **Fatter branches.** A long, unsupervised agent run does not self-limit to a reviewable unit. Left alone, it will produce a single branch with a thousand-line diff touching twenty files — simultaneously a merge-hell risk *and* an unreviewable PR (see [review-practice.md](review-practice.md)). The agent feels no cost in either dimension; it optimizes "task looks done," not "this lands cleanly and a human can read it."

### The cure — small, frequent integration

- **Short-lived branches.** Measure a branch's life in hours, at most a couple of days — never weeks. The merge it implies should be boring.
- **Integrate to trunk continuously.** Pull/rebase from trunk frequently so your branch never drifts far. Many small, absorbed conflicts beat one catastrophic one.
- **Feature flags for incomplete work.** This is what makes trunk-based development *possible*: merge unfinished code to trunk behind a flag that keeps it dark in production, rather than hiding it on a branch. The work integrates continuously; the *behavior* ships when it's ready. Flags decouple "merged" from "released."
- **Constrain the agent's unit of work.** This is the operative agent-era rule. Scope each agent task to a change that produces a small, self-contained, mergeable, reviewable branch — then merge it before starting the next. Do not let one agent session accumulate a mega-branch. If a task is genuinely large, decompose it into a sequence of small merges (stacked or sequential), each independently reviewable and each landing on trunk. The unit of agent work and the unit of review and the unit of integration should be the same small thing.

> **RULE:** if a branch can't be merged back within roughly a day, it is too big — split the task, not the timeline. The fix for a sprawling agent branch is never "review harder"; it is "don't let it get sprawling."

---

## Commit hygiene

Commits are the project's primary record, and in the agent era they are *also* the durable memory across stateless sessions and the reviewer's narrative. Two properties matter: each commit should be **atomic**, and each message should explain **why**.

### Atomic commits

An atomic commit is one logical change — it does exactly one thing, and the tree builds and passes tests at that commit. Atomicity is what makes the rest of version control work: `git revert` can back out one change without collateral, `git bisect` can pin a regression to a single small commit, and a reviewer can read the history as a sequence of intelligible steps rather than one undifferentiated blob. The anti-pattern is the "WIP" / "fix stuff" / "address review" commit that mixes a refactor, a bug fix, and a formatting sweep — it makes the diff unreadable and `revert`/`bisect` useless. Agents are especially prone to this: an agent will happily bundle a feature, an unrelated cleanup it noticed, and a dependency bump into one commit. Keep each commit to one purpose; reorganize a messy local history before the PR.

### Conventional Commits

Adopt **Conventional Commits** as the message format — a small, machine-parseable grammar: `type(optional scope): description`, optionally with a body and footer.

| Type | Use for |
|---|---|
| `feat` | A new feature (user-visible capability) |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A change that improves performance |
| `test` | Adding or correcting tests |
| `build` | Build system or dependency changes |
| `ci` | CI configuration / pipeline changes |
| `chore` | Routine maintenance that doesn't touch `src` or tests |
| `style` | Formatting/whitespace only (no logic change) |
| `revert` | Reverts a previous commit |

A breaking change is flagged with `!` after the type/scope or a `BREAKING CHANGE:` footer (`feat(api)!: drop v1 auth header`). Example:

```
fix(auth): reject tokens with a future-dated `iat`

A clock-skew bug let tokens minted slightly in the future pass validation,
widening the replay window. Clamp `iat` to now and reject anything ahead of
a 30s skew allowance. Chosen over widening the skew window because the latter
weakens replay protection for every token to paper over one client's bad clock.

Refs: #482
```

The format is not bureaucracy. It makes history greppable (`git log --grep`), and it lets tooling derive things mechanically: **semantic-release** and **release-please** compute the next semver bump and generate the changelog directly from the commit types, so versioning stops being a manual judgment call (`fix` → patch, `feat` → minor, `!`/`BREAKING CHANGE` → major). Enforce the format with **commitlint** in a commit-msg hook (it shares the pre-commit machinery described in [code-style.md](code-style.md)) so a malformed message is rejected before it lands — another check shifted left.

### The message is the WHY — the agent-era point

The diff already shows *what* changed; the reviewer can read that. What the diff cannot show is *why* — the constraint that forced this approach, the alternative rejected and the reason, the bug's mechanism, the ticket it answers. In the human era a sloppy message cost a future colleague some archaeology. In the agent era the cost is higher and the audience is different:

- **The next agent session is stateless.** It starts with no memory of why the last change was made. The commit message (alongside ADRs and docs) is the only place that "why" survives the context window. A blank or generic message (`update code`, `fix bug`) is, to a fresh agent, an instruction it cannot learn from — and it may cheerfully undo the change for a reason the message would have pre-empted.
- **The message is the reviewer's narrative.** A human reviewing an agent's PR is reconstructing intent from the outside. A clear per-commit message that states the *why* is what lets the reviewer evaluate the *judgment*, not just the mechanics — which is the whole point of review when an agent wrote the code (see [review-practice.md](review-practice.md)).

**RULE for agent-authored commits:** the body must state *why*, not restate *what*. "Renamed `x` to `y`" is worthless; "Renamed `x` to `y` because the old name collided with the new billing field and was silently shadowed in the serializer" is the durable record.

### Attribution for agent commits

Mark machine-authored work so the audit trail is honest about provenance. Use a `Co-Authored-By:` trailer (or `Co-Developed-By:`) naming the agent in the commit footer, e.g. `Co-Authored-By: <agent name> <agent-email>`. This is not decoration: it lets you query later "which changes were agent-authored?", it sets the right expectation that the diff was machine-produced and human-reviewed (not human-authored), and it keeps accountability legible — the human reviewer/merger still owns what they approved. Whatever convention your environment specifies for that trailer, apply it consistently so provenance is queryable across the whole history.

---

## Secrets: a blocking gate, not a guideline

Committing a credential — an API key, a database password, a private key, a token — is one of the highest-frequency security incidents in real codebases, and it is **worse with agents.** An agent's entire optimization is "make the thing work," and the path of least resistance to a working integration is often to paste the live key straight into the code or a config file. It has no instinct that this is dangerous, and it will do it confidently. The same reflex applies to large binaries: an agent will commit a model file, a build artifact, or a dataset to make a path resolve, bloating history permanently (Git keeps every version forever).

Treat this exactly as the SKILL frames it: **not a rule you trust a human or an agent to follow, but a machine-enforced gate that blocks the commit.** Trusting discipline here fails by construction, because the actor with the most commits has none.

### The layered defense

1. **`.gitignore` — the floor, not the wall.** Ignore the file *patterns* that hold secrets and bulk: `.env`, `*.pem`, `*.key`, `credentials.json`, `id_rsa`, build outputs, large data files. Commit a `.env.example` with placeholder values so the *shape* of required config is documented (load-bearing onboarding knowledge — see [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md)) while the real values stay local. `.gitignore` prevents the *accidental* `git add .`; it does nothing about a secret hardcoded *inside* a tracked source file, which is the case that actually bites.

2. **Secret-scanning as a blocking pre-commit hook — the real wall.** Wire a scanner into the **pre-commit** framework so it runs on every commit *before* the secret can land:
   - **gitleaks** — fast, regex- and entropy-based; the common default. Add it to `.pre-commit-config.yaml`:
     ```yaml
     repos:
       - repo: https://github.com/gitleaks/gitleaks
         rev: <pinned-tag>
         hooks:
           - id: gitleaks
     ```
   - **trufflehog** — also *verifies* candidate secrets against live providers, cutting false positives by confirming a key is real.
   - **detect-secrets** — baseline-driven; good for retrofitting onto an existing repo by snapshotting known findings and failing only on *new* ones.

   The hook runs locally so the bad commit is stopped on the developer's (or agent's) machine — the leftmost possible point.

3. **The same scan as a CI gate — because hooks can be bypassed.** A pre-commit hook is skippable (`git commit --no-verify`, an unconfigured machine, an agent that doesn't run the hook). So the *identical* scan must also run as a **blocking** CI check on every push/PR, and the branch protection must require it to pass before merge (see [ci-cd.md](ci-cd.md)). Defense in depth: the hook is the fast feedback, the CI gate is the one that can't be skipped. Enable your platform's native **push protection** (GitHub secret scanning / push protection) as a third layer that rejects a known secret pattern at the remote.

> **The agent-era rule, stated plainly:** any quality property not encoded as a hard gate is, for an agent, optional. "Don't commit secrets" as a guideline is therefore not a control at all. The control is the scanner that *fails the commit and the build.*

### Incident response — when a secret has already leaked

If a secret reaches the remote (or even just your local history), assume it is compromised the instant it left your machine. Order matters, and the common mistake is doing them backwards:

1. **ROTATE FIRST.** Revoke and reissue the leaked credential immediately. This is the only step that actually stops the bleeding — a key in a public repo is scraped within minutes, so the leaked value must be made worthless *before* you touch history. Purging history on a live key is theater.
2. **Then purge history.** Remove the secret from every commit with **git-filter-repo** (the modern tool; BFG Repo-Cleaner is the older alternative), then force-push the rewritten history and have all collaborators re-clone. Note that on shared hosts (GitHub, etc.) the blob may persist in caches and forks even after a rewrite — which is precisely why rotation, not purging, is the load-bearing step.
3. **Close the gap that let it through.** A leak that reached the remote means a gate was missing or skipped. Add/repair the pre-commit hook *and* the CI scan so the same class of secret can't pass again. The incident's real output is a new gate.

The ordering — **rotate, then purge, then harden** — is the rule to remember. Treat a leaked secret as already-public and act accordingly.

---

## Where this connects

- [decision-tree.md](decision-tree.md) — the branch-strategy router and the process-weight sizing that decides how much of this you need.
- [code-style.md](code-style.md) — the pre-commit framework that hosts both the formatter/linter hooks and the secret-scanning / commitlint hooks described here; install them together so the right thing is one `pre-commit install` away.
- [review-practice.md](review-practice.md) — why small, atomic, well-messaged commits are what make an agent's PR reviewable at all.
- [ci-cd.md](ci-cd.md) — turning the local secret scan and commit-lint into *blocking* CI gates that branch protection enforces and an agent cannot skip.
- [agent-era-shifts.md](agent-era-shifts.md) — the through-line: every practice on this page changes shape because the most prolific contributor has no self-discipline, no memory between sessions, and a constant pull toward whatever turns the light green.

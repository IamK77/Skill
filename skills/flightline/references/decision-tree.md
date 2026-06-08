# The Engineering-Process Decision Engine

This is the deterministic router at the heart of **flightline**. STAGE 0 (Calibrate) opens it by name, but you should open it *first* and keep it beside you through every stage — it decides the two things the whole process hangs on: **how much process this project earns, and which gate catches which failure.** Everything downstream — branching, style, review, CI/CD, dependencies — is reached *from* this file. Traverse it top-down, once per project or workflow you're handed; the leaves link into the stage references where the work happens. The agent-era reasoning the whole engine assumes — why these classic practices change when the code is written by something with no self-discipline — lives in [agent-era-shifts.md](agent-era-shifts.md); read it before you trust any DEFAULT below.

Every fork is written to be *decidable* — hand two agents the same project and they should land on the same branch. To make that hold, each fork states three things up front:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — which branch to take when the predicate is a genuine toss-up.
- **FALLBACK** — what to do when you can't answer the predicate yet.

There is exactly one invariant that overrides every DEFAULT and FALLBACK below — the governing fact of the whole skill:

> **The gate is the quality.** A quality property that is not encoded as a hard, enforced, un-gameable gate is, for an agent, *optional* — and the newest, fastest, most prolific contributor on the project is an agent that optimizes the observable success signal (green CI, "looks done"), not the underlying correctness, and has no self-discipline (自觉) to fall back on. So you never ship on *trust* a property you could ship on a *gate*. If you find yourself writing "the team should remember to…" or "contributors are expected to…", you have not built a floor — you have written a wish. Convert it to a gate or treat it as already violated.

---

## The three dials this engine runs on

You route faster if these are crisp. They recur in every tree, and the third is the master dial — the agent era bent the whole field around it.

| Dial | Light end | Heavy end | Why it routes |
|---|---|---|---|
| **Team size** | One contributor, no coordination | Many parties — human teams *and* parallel agents — touching the same code, who must not collide or quietly diverge in style and structure | Sets how much shared, *enforced* convention is needed. Two collaborators can argue formatting; ten plus a fleet of agents cannot — the machine must settle it. |
| **Release cadence** | A throwaway script, run once, never shipped | Continuous delivery to production many times a day, or multiple released versions maintained at once | Sets the branch strategy and the depth of CI/CD. Faster cadence demands smaller integration units and a faster, harder pipeline. |
| **Degree of agent involvement** | A human writes and reviews every line | Most code is agent-written; multiple agents run in parallel emitting large diffs | **The master dial.** Sets how much of the floor must be *automated and enforced* rather than trusted. More agent, more parallelism → MORE machine-enforced floor, not more human vigilance — because there is *less* discipline in the loop, not more. |

**The agent-era bend on the master dial.** In the human era, "how much process" scaled mostly with team size and cadence, and a small, careful team could lean on shared discipline to hold quality. That lever is gone the moment an agent writes the code. An agent has no conscience, no memory between sessions, and a relentless pull toward whatever turns the light green — so *every increment of agent involvement must be matched by an increment of automated, enforced gating*, not by an exhortation to be careful. This is counterintuitive and load-bearing: the human-era instinct is "small trusted team → light process." The agent-era correction is **"agent-written → the floor must be machine-held even when the team is tiny,"** because the actor writing the code cannot be trusted at all, regardless of headcount. A two-person team shipping mostly-agent code needs a *heavier automated floor* than a five-person all-human team. The whole point of this engine is to put the floor where the agent era moved the risk.

---

## PROCESS-WEIGHT SELECTOR — how much process does this even earn?

Process must match scale and risk — *够用就好*, enough and no more. Over-processing a throwaway is the same category of error as leaving a payments service with no floor under it. Match the project to the nearest archetype in the **Looks like** column; when two dials pull toward different classes, take the **higher** one. The **agent dial overrides**: a project that *looks* lightweight by team-and-cadence but is mostly agent-written jumps to at least Standard, because the safety system has to be automated.

| Weight class | Looks like | Process it earns |
|---|---|---|
| **Throwaway** | A one-off script, a spike, a notebook, a migration you run once and delete. One author, never shipped, no second reader. | Almost none. A `.gitignore` so you don't commit a key, a sane commit. State in one line why you skipped the rest. **But:** the moment an agent writes it *and* it touches anything real, it is no longer throwaway — re-class. |
| **Solo / small, human-led** | A personal project or a tiny tool, a couple of humans writing most of the code themselves, infrequent releases. | Version control with atomic commits; a formatter + linter run locally; a lockfile. Review optional between trusting humans. Lean CI (build + test on push). The floor is light because a human conscience is genuinely in the loop. |
| **Standard / team or agent-assisted** | A real service or app with users; a small team, OR a small team where **agents write much of the code**; regular releases. *Most projects, and every agent-assisted one, land here.* | The full six-stage floor, **machine-enforced**: trunk-based branching, pre-commit hooks (format + lint + secret-scan), required review on every PR, CI gating merge (test + lint + SAST + coverage floor), lockfile + SCA on dependencies, a README/AGENTS.md a fresh session can bootstrap from. Review and CI are *blocking*, not advisory. |
| **High-stakes / fleet or regulated** | A platform many build on, money/auth/PII/safety in scope, a large human + agent fleet emitting code in parallel, an outage or breach makes headlines. | Everything Standard requires, plus: branch protection that can't be bypassed, mutation testing on critical paths, coverage floors that can't be met by deleting assertions, signed commits, SBOM + dependency allowlist, CD with one-click rollback and progressive delivery, mandatory ADRs for irreversible calls. The gate integrity itself is guarded. |

### The agent dial, stated as a rule

```
Read the three dials, pick the class by team-size × cadence, THEN apply:
  agent-involvement = none/low   → keep the class the first two dials chose.
  agent-involvement = significant → floor must be at least STANDARD, machine-enforced,
                                    even if team-size and cadence said lighter.
  agent-involvement = high + parallel fleet → add the gate-integrity guards
                                    (un-gameable coverage, mutation, branch protection,
                                    review of test/CI changes). The more agents, the
                                    more the floor is automated — never the more humans watch.
```

**DEFAULT** when the class is a coin-flip *and the code is human-written*: pick the **lighter** class; over-process wastes real effort. **DEFAULT** when the class is a coin-flip *and an agent writes the code*: pick the **heavier** class — the asymmetry flipped, because an agent will exploit every ungated gap and a too-light floor is how a plausible-but-wrong change ships green.

**FALLBACK** when you can't size it because the project is a fog ("set up our workflow"): ask the three dial questions directly — *who writes the code (humans, agents, both)? how often do you ship? how many people and agents touch it?* Don't pick a class for an unknown; one sharp question collapses it.

**Worked leaf —** *"Three humans, one of whom runs two agents that write most of the feature code, shipping a web service weekly. Team-size says small; cadence says regular; agent-involvement says significant. The agent dial overrides → STANDARD floor, machine-enforced, even though three people sounds light. Required review, pre-commit hooks, CI gating merge, secret-scan and SCA blocking. The two agents make the automated floor the entire safety system."*

---

## BRANCH-STRATEGY ROUTER — which branching model?

Default to the lightest strategy that fits the cadence, then let one specific, *earned* predicate push you to the heavier Git Flow. The deep mechanics live in [version-control.md](version-control.md); this is the router.

```
BR1. DEFAULT: TRUNK-BASED DEVELOPMENT or GITHUB FLOW.
     Short-lived branches off main, small PRs, merge back fast, main always releasable.
     This is the default for almost everything and the only sane default under continuous delivery.

BR2. Do you genuinely maintain MULTIPLE RELEASED VERSIONS at once?
     PREDICATE: are there real, separately-supported release lines in the wild right now
                (v2.x getting security fixes while v3.x ships features) that need parallel
                maintenance and back-porting — NOT "we might version someday"?
     ├─ YES → GIT FLOW (or a release-branch model) is EARNED. Its release/hotfix branches
     │        exist precisely to maintain several live versions. Accept the ceremony.
     └─ NO  → stay in BR1. Git Flow's extra branches buy you nothing here and cost you merge friction.

BR3. Are you forced onto long-lived feature branches by some constraint?
     PREDICATE: a multi-week feature that "can't" merge incrementally?
     ├─ Almost always this is a DESIGN smell, not a requirement → put it behind a FEATURE FLAG
     │  and merge the dormant code to trunk continuously. Keep the branch short-lived anyway.
     └─ Genuinely unavoidable (rare) → keep it as short as possible, rebase on trunk DAILY,
        and treat the divergence as a tracked risk, not a default.
```

### The long-lived-branch trip-wire

This is the single most expensive version-control failure, and the agent era sharpens it. A branch that lives for weeks diverges further from trunk every day until the eventual merge becomes *merge hell* — a giant, conflict-ridden, under-reviewed integration. **A fleet of agents spawns many concurrent branches**, so divergence compounds: the more parallel agents, the more the strategy must force small, frequent integration back to a releasable trunk. Wire the trip-wire as a *gate*, not a hope:

```
TRIP if any branch is more than ~1–2 days diverged from trunk, OR a PR exceeds the
     reviewable-size budget (a several-thousand-line diff is unreviewable — see review-practice.md),
     OR an agent's unit of work spans more than one mergeable increment.
THEN constrain the agent's task to a trunk-mergeable slice, integrate now, and re-slice the rest.
```

**DEFAULT** when trunk-based vs GitHub Flow is a toss-up: they are nearly the same for your purposes — pick GitHub Flow (PR-per-change) if you want review and CI on a named branch before merge, which under an agent author you almost always do. **FALLBACK** when you can't tell whether multiple versions are really maintained: assume **not** (trunk-based) until a real second release line exists; adopting Git Flow's weight speculatively is the same waste as gold-plating. Cross-link: [version-control.md](version-control.md) for commit hygiene, Conventional Commits, and the secret/`.gitignore` gate.

---

## THE GATE MAP — which gate catches which failure, and how far left it lives

This is the core artifact of the engine: for each *class* of failure, the gate that catches it and the leftmost point that gate can live. The master rule binds every row — **an agent honors only what is gated, so a row with no gate is a failure class you have decided to ship.** "How far left" is the position in the pipeline; pushing each gate as far left as it goes is the next section.

| Failure class | Gate that catches it | Leftmost home | Why there, and the agent-era sharpening |
|---|---|---|---|
| **Formatting / style drift** | Formatter (Prettier, gofmt, black, rustfmt) + linter (ESLint, golangci-lint, clippy, ruff) | **Pre-commit hook** (and re-checked in CI) | Format is mechanical — never spend a human or an agent's review attention on it. The linter is also the *first automated reviewer* of agent output: unused vars, unhandled promises, obvious type errors caught before any human looks. → [code-style.md](code-style.md) |
| **Logic / design / edge-case errors** | **Human code review** | **PR, before merge** | The one gate no automation replaces. When an agent wrote the code, a rubber-stamp LGTM means *nothing checked it* — review is now load-bearing, not courtesy. Use a second independent agent as a pre-review *filter*, never a substitute. → [review-practice.md](review-practice.md) |
| **Behavioral regression** | Automated test suite | **Pre-commit (fast subset) → CI (full)** | Tests are the executable spec of "still works." An agent will weaken or skip a failing test to turn the light green, so *test changes are themselves reviewed* and coverage floors must not be satisfiable by deleting assertions. → [ci-cd.md](ci-cd.md), and the `assay` skill for the tests themselves. |
| **Integration / "works on my machine"** | CI build + test on every commit, in a clean container | **CI** | Surfaces the cross-component break early, in an environment that matches prod. → [ci-cd.md](ci-cd.md), [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Committed secrets / credentials** | Secret-scanning (gitleaks, trufflehog, `detect-secrets`) + `.gitignore` | **Pre-commit hook** (and CI as backstop) | An agent *will* commit a key to make something work. This is not a rule you trust anyone to follow — the hook *blocks the commit*. Add server-side push protection so a bypassed local hook still fails. → [version-control.md](version-control.md) |
| **Vulnerable / malicious / hallucinated dependency** | SCA + dependency review (Dependabot, Renovate, `npm audit`, `pip-audit`, OSV-Scanner), ideally against an allowlist | **PR / CI** (and editor where tooling allows) | An agent reaches for libraries reflexively and can hallucinate or *slopsquat* a package name; a typo'd name can be a supply-chain attack (recall left-pad for the fragility, slopsquatting for the malice). Blocking gate, not advisory. → [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Insecure code (injection, auth bypass, secret-in-output)** | SAST (CodeQL, Semgrep, Bandit, gosec) | **PR / CI** | An agent introduces security holes confidently and plausibly. Static analysis catches whole classes mechanically before a human reasons about them. → [ci-cd.md](ci-cd.md) |
| **Performance / coverage regression** | CI threshold gate (coverage floor, perf budget with a hard fail) | **CI** | Make the floor *un-gameable*: coverage that can't be met by deleting assertions, mutation testing where it counts, so a green number means real protection rather than a manufactured one. → [ci-cd.md](ci-cd.md) |
| **Non-reproducible build** | Lockfile + pinned, containerized build (devcontainer, Docker) | **CI and every dev machine** | "Works on mine" must mean "works everywhere," including a fresh stateless agent session. The lockfile and container are the gate that makes the environment identical. → [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Lost tribal knowledge / un-bootstrappable project** | README / AGENTS.md a fresh session can run; ADRs and Conventional-Commit messages as durable memory | **The repo itself** | The agent is a permanent, stateless newcomer that forgets between sessions. "Can a newcomer bootstrap in half a day" becomes "can a *fresh agent session*." Knowledge not externalized into docs does not exist for the next session. → [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md) |
| **Tampered / ungated release artifact** | Signing + provenance (build-provenance attestation, SLSA, `cosign` for images) + an ungated-publish check + least-privilege release tokens | **Release / CD pipeline** | The publish path is itself a gate: an agent — or a compromised action — can ship an artifact the PR gates never saw. Gate the artifact-*producing* job (not just the PR), sign and attest so a consumer can verify origin, and never grant a release job `write-all`. → [ci-cd.md](ci-cd.md) |

**Reading the map:** every failure class your project can suffer should have a row with a *real, enforced* gate. A row where the "gate" is "we review carefully" or "we remember not to" is, under an agent author, an open hole. The most common way a project looks safe but isn't: the gates exist but are *advisory* (CI runs but doesn't block merge; the linter warns but doesn't fail; SCA reports but doesn't gate). Advisory is, for an agent, identical to absent.

When you are **auditing** an existing project rather than building one, score each row with one of five statuses, not a bare yes/no: **present-blocking** (runs *and* blocks merge), **present-advisory** (runs, reads green, but doesn't block — `continue-on-error`, soft-fail, or a status that isn't actually *required*), **present-but-path-gated** (a real gate whose `on:`/`paths:` trigger means it never *fires* on a PR that introduces the risk by another path — a green that never ran), **absent**, or **unknown-platform** (it lives in settings you can't read — score it a gap, per the platform-layer note above). "Advisory equals absent" catches the first kind of hole; "never fired" is the second — so check each security job's *trigger*, not only its `continue-on-error`.

**Where the gate actually lives — read the platform layer, not just the repo.** A gate can be enforced in a tracked file (`.pre-commit-config.yaml`, a CI workflow, `cargo-deny.toml`) *or* at the platform/settings layer that never appears in the repo: the host's **native secret-scanning and push protection**, **Dependabot / native SCA**, **branch-protection required status checks**, org policy. So when you audit an existing project for whether a gate exists, read *both* — the repo config **and** the platform settings (the host's UI or API). Two false reads to refuse: "no config file" taken as "no gate" (it may be a platform feature already switched on — the exact way an audit reports a false zero), and "a workflow file exists" taken as "the gate is enforced" (it is only a gate if branch protection makes it *required* — advisory equals absent). One cost dial rides on top: several native gates (CodeQL, native secret-scanning, Dependabot) are free on **public** repos but paid on **private** ones (e.g. GitHub Advanced Security) — on a private repo, route to the OSS equivalent already in the rows (Semgrep, Trivy / OSV-Scanner, gitleaks) or budget for the paid tier, but never let a tool's cost silently become a missing gate.

**Read the platform layer programmatically, and how to score it when you can't.** With shell access on GitHub, don't *guess* at required checks — read them: `gh api repos/{owner}/{repo}/branches/{branch}/protection` (inspect `required_status_checks.contexts` and `required_pull_request_reviews`), `gh api repos/{owner}/{repo}/rulesets`, and for native gates `gh api repos/{owner}/{repo}/dependabot/alerts` and `…/secret-scanning/alerts`. The scoring rule when you **cannot** read it (no admin token, auditing a clone): a present-but-unconfirmable required check is scored a **GAP / `unknown` — never `blocking`**; a gate whose required-status you could not verify is, for audit purposes, advisory until proven otherwise. And an unconfirmable **required-review** is a *force-multiplier*: if branch protection isn't actually requiring it, every "present-blocking" gate above silently degrades to advisory — so an unverifiable review requirement caps the confidence of the entire map, and must be reported as the top risk, not a footnote.

---

## SHIFT-LEFT ROUTING — push every check as far left as it goes

The same gate costs wildly different amounts depending on *where* it fires. The agent always takes the path of least resistance the gates allow, so the cheapest way to steer it is to make the correct path the easiest one — which means catching each failure at the leftmost station, where the feedback is fastest and the blast radius smallest.

```
EDITOR  →  PRE-COMMIT HOOK  →  PR / CI  →  PRODUCTION
fastest, cheapest, agent self-corrects ............... slowest, costliest, users hit it
```

| Station | What lives here | Cost of catching the failure HERE vs further right |
|---|---|---|
| **Editor / on-save** | Formatter on save, linter inline, type-checker in the language server | Caught in milliseconds; the agent (or human) fixes it before it's even committed. Nearly free. |
| **Pre-commit hook** (`pre-commit`, Husky, lefthook) | Format check, fast lint, secret-scan, the fast unit subset | Caught in seconds, locally, before it pollutes history. The agent self-corrects in the same session. A secret blocked here never enters the repo at all. |
| **PR / CI** | Full test suite, full lint, SAST, SCA, coverage gate, human review | Caught in minutes, before merge, before anyone else builds on it. The expensive-but-still-cheap station. |
| **Production** | Whatever escaped everything left of here | Caught by users, incidents, rollbacks — the costliest place, and the one an agent's "looks done" optimism routinely lets things reach. |

**The cost-of-catching-late argument.** A failure caught in the editor costs an autocorrect; the same failure caught in production costs an incident, a rollback, possibly a breach. Every station you push a check leftward multiplies the value of the gate, because it shrinks both the feedback delay and the number of people (and downstream commits) the failure can poison. For an agent specifically, leftward is even more valuable: a pre-commit failure lands *inside the agent's working session*, where it can read the error and fix it autonomously; a production failure lands long after the session ended and the context is gone.

**Routing rule:** for each row in the Gate Map, install the gate at the **leftmost station it can run at**, then mirror it rightward as a backstop. Format and secret-scan belong at pre-commit (a developer who skips the hook is caught again in CI). Tests run as a fast subset at pre-commit and the full suite in CI. SAST/SCA run in CI (and in the editor where the tooling supports it). The backstop matters because an agent — or a human — can `--no-verify` past a local hook, so the leftmost gate is the *fast* line of defense and the CI mirror is the *un-bypassable* one. Cross-link: [ci-cd.md](ci-cd.md) for the pipeline that owns the right-hand backstops; [code-style.md](code-style.md) and [version-control.md](version-control.md) for the pre-commit setup.

**DEFAULT** when unsure how far left a check can go: push it one station further left than feels necessary and measure the friction; if it's too slow at pre-commit, demote it to CI rather than dropping it. **FALLBACK** when a check is too expensive for any pre-merge station (a multi-hour soak, a full E2E matrix): run it on a schedule or post-merge on trunk, gate the *release* on it rather than the *commit*, and document that it's a right-of-PR gate so no one mistakes its absence at PR time for safety.

---

## ESCALATION LADDER — a quality property is being violated

When you discover a quality property the code is supposed to hold but doesn't reliably (style is inconsistent, secrets have leaked, a test was silently weakened, a dependency snuck in), you do not get to file a "please be careful" note. You climb this ladder until the property is *enforced* and *un-gameable*. Each rung binds the property harder than the last; stop climbing only when an agent can no longer violate the property while looking successful. The top-of-file invariant binds the whole ladder: **never ship on trust a property you could encode as a gate.**

```
Rung 0 — NAME THE PROPERTY AND THE FAILURE CLASS
    State exactly what must always hold and which Gate-Map row it belongs to.
    "Public API responses must never contain a stack trace." → security / secret-in-output row.
    Use when: you've just noticed the gap. Cost: a sentence. This rung alone fixes nothing —
    it only stops you from mistaking a wish for a gate.

Rung 1 — ADD THE GATE (make the check exist)
    Encode the property as an automated check at its leftmost Gate-Map station.
    "Add a Semgrep rule + a response-shape test." Now a machine evaluates it on every change.
    Use when: the property had no automated check at all. Cost: writing one rule/test.

Rung 2 — MAKE IT BLOCKING (advisory → required)
    Turn the check from a warning into a merge-blocking required status.
    A check an agent can ignore is, for an agent, not a check. Required-status / CI-gates-merge.
    Use when: the gate exists but is advisory. Cost: a branch-protection / pipeline config change.
    This is the single most common missing rung — the gate is there but doesn't actually stop anything.

Rung 3 — MAKE IT UN-GAMEABLE (guard the gate's integrity)
    Close the ways an agent can manufacture a green light without satisfying the property:
      • Review changes to tests and CI config (an agent "fixes" red by deleting the assertion).
      • Coverage floors that can't be met by deleting assertions; mutation testing on critical paths.
      • Branch protection that blocks force-push and direct-to-main; secret-scan push protection
        server-side so a bypassed local hook still fails.
      • Pin/allowlist dependencies so SCA can't be dodged by swapping the source.
    Use when: the gate is blocking but the agent can satisfy the LETTER while breaking the SPIRIT.
    Cost: real, and worth it on anything consequential — a green light the agent can fake is no gate.

Rung 4 — ESCALATE TO THE HUMAN OWNER
    When the property can't be fully mechanized, or enforcing it is a policy/authority call
    (a compliance control, a breaking public-contract change, a risk acceptance), surface it
    as a decision FOR the human-in-the-loop, refuse to proceed on the affected change, and park
    it as a named open item with an owner.
    "This dependency has a known CVE with no patch; shipping it is a risk-acceptance call — blocked
     until the owner signs off."
    Use when: the violation isn't yours to wave through. Cost: routing to the right human.
    Worth it — the alternative is an agent silently shipping an unauthorized risk.
```

### How the violation's stakes set the floor

- **Cosmetic property (style, naming):** Rung 1–2 is plenty. Add the formatter/linter and make it blocking; don't burn effort hardening a gate whose failure is harmless.
- **Correctness property (logic, regression):** climb to Rung 3 on anything an agent could game — the test/CI-change review and un-deletable coverage floor are exactly what stop the agent from "passing" by weakening the check.
- **Security / supply-chain / data property:** start at Rung 2 (blocking, never advisory) and go straight to Rung 3, because these are the classes an agent violates most confidently and most invisibly. If enforcement requires authority you don't have, Rung 4 — block and escalate, never proceed on a silent guess.

**DEFAULT** when unsure how high to climb: climb one rung *higher* than feels necessary on anything touching security, money, data, or auth. The asymmetry is steep — an extra required check costs a config line; an un-gated security property is how a breach ships green. **FALLBACK** when you can't fully gate a property right now (the tooling doesn't exist, the check is too slow, the owner is unreachable): take the most-enforced option available *today* — at minimum make it a blocking manual review item with a named owner and record it as an explicit, tracked gap, never as "handled." A documented un-gated property is recoverable; one silently trusted to an agent is a latent incident.

---

## Putting the engine together — one full traversal

A worked end-to-end pass, so the routing is concrete.

> **Incoming task:** *"Set up the engineering process for our web service. We're three people; two of us mostly drive coding agents that write the feature code; we ship to production a few times a week. Nothing's enforced right now — people just try to remember."*
>
> **Process-weight selector** — Team-size says small (three). Cadence says regular (a few times a week). Agent-involvement says *significant* — two of three contributors are mostly agent-driven, so most code is agent-written and often in parallel. The agent dial overrides the headcount: this is **STANDARD**, machine-enforced, despite "only three people." The tell is in the task itself — *"people just try to remember"* is the exact failure mode the master invariant forbids, and with agents writing the code there is no conscience to remember at all. The whole floor must move from memory to machine.
>
> **Branch-strategy router** — BR1 default: a few releases a week is continuous delivery → **trunk-based / GitHub Flow**, PR-per-change so review and CI fire before merge. BR2: no second released version is maintained in the wild → Git Flow not earned, would only add friction. The long-lived-branch trip-wire matters *more* here because two agents will spawn concurrent branches: wire the size/divergence budget so each agent's work merges back as a small, reviewable slice rather than a multi-day diff that becomes merge hell.
>
> **Gate map** — Walk the rows and place each gate at its leftmost home: formatter + linter at **pre-commit** (and CI); human review at the **PR** (load-bearing now — an agent wrote it, so a rubber-stamp checks nothing); test suite fast-subset at pre-commit, full in **CI**, with test/CI changes themselves reviewed; secret-scan at **pre-commit** with server-side push protection as backstop (an agent *will* try to commit a key); SCA + dependency review at **CI** against an allowlist (an agent reaches for and can hallucinate packages); SAST in **CI**; coverage floor in **CI**, made un-deletable; lockfile + devcontainer for reproducibility; a README/AGENTS.md a *fresh agent session* can bootstrap from. Every one of these is **blocking**, because advisory equals absent under an agent.
>
> **Shift-left routing** — Push each gate left: format and secret-scan land in the agent's own working session at pre-commit, where it reads the failure and self-corrects before history is touched; the full suite, SAST, and SCA backstop in CI, un-bypassable, before merge. The `--no-verify` escape is covered by mirroring the fast gates as required CI checks. The argument that sells it: a secret caught at pre-commit costs an autocorrect; the same secret caught in production costs a key rotation and an incident.
>
> **Escalation ladder** — Today nothing is enforced, so every property sits at Rung 0 (named only) or below. Climb each: add the gate (Rung 1), make it merge-blocking via branch protection and required CI checks (Rung 2 — the rung this project is entirely missing), then harden the consequential ones (Rung 3): review test/CI edits, un-deletable coverage floor, branch protection against direct-to-main, dependency allowlist. If a dependency surfaces a CVE with no patch, that's a Rung 4 risk-acceptance call for the human owner — block and ask, never let an agent wave it through.
>
> **Record** — The branch strategy, the gate placements, and any irreversible call (the secret-management approach, the dependency allowlist policy) go into the README/AGENTS.md and Conventional-Commit messages, so the *next* stateless agent session inherits the floor instead of cheerfully working around it.

The request that arrived as "set up our process / people just try to remember" leaves the engine as a concrete, machine-enforced floor: a trunk-based workflow with size-bounded agent slices, a full Gate Map placed leftmost-first and blocking, and every property that mattered climbed up the ladder until an agent can no longer violate it while looking successful — which is exactly the automated safety system the agent era demands, built precisely because the contributors writing the code have no discipline to lean on. From here the stage references do the depth: [version-control.md](version-control.md) → [code-style.md](code-style.md) → [review-practice.md](review-practice.md) → [ci-cd.md](ci-cd.md) → [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md), with [agent-era-shifts.md](agent-era-shifts.md) open beside every one. Return to [../SKILL.md](../SKILL.md) to run the stages in order.

# Dependencies, Builds & Reproducibility

This reference is the depth behind **STAGE 5 — Dependencies, builds & reproducibility** of the [../SKILL.md](../SKILL.md) flight plan, the final stage and the one that closes the loop on "works on mine." It governs four bound-together questions: *is the build the same everywhere*, *is every dependency you pull in worth its attack surface*, *do the dev / CI / prod environments actually match*, and *can a fresh contributor — human or a stateless agent session — get the project running from the docs alone in half a day?* In the human era these were hygiene; an honest engineer kept a lockfile, skimmed a new package's README, and wrote an onboarding doc out of professional courtesy. The agent era promotes every one of them to a **machine-enforced gate**, because the contributor who now reaches for packages most eagerly, commits a key most casually, and remembers the least between sessions is the agent — and the agent has no courtesy to fall back on. Read [agent-era-shifts.md](agent-era-shifts.md) for *why* these shift; come here for *how* to enforce them. The branch-strategy and small-integration discipline that keeps lockfile churn reviewable is in [version-control.md](version-control.md); the pipeline that runs these scans on every commit is in [ci-cd.md](ci-cd.md).

Every fork below states three things so two agents hardening the same project reach the same setup:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK here, inherited from [decision-tree.md](decision-tree.md):

> **The gate is the quality.** A reproducibility or supply-chain property you do not encode as a hard, enforced, hard-to-game gate is — for an agent optimizing the green light — optional. "We review new dependencies" is a wish; a CI job that *fails the build* on an unreviewed or vulnerable dependency is a gate. This file is a catalog of wishes turned into gates.

---

## Part 1 — Lockfiles & reproducible builds

A reproducible build means: the same source, resolved on any machine at any time, produces the same dependency tree and the same artifact. Without it, "it passed on my machine" carries no information about CI or production, and the agent — which runs on a machine you will never see — can hand you green output that is green only there.

### The lockfile is non-negotiable and committed

The single mechanism that makes a build reproducible is the **lockfile**: a machine-generated file that pins every dependency *and every transitive dependency* to an exact version and content hash. Your manifest (`package.json`, `pyproject.toml`, `go.mod`) declares ranges; the lockfile freezes the resolution of those ranges into one exact graph. Commit it. A lockfile in `.gitignore` is the same bug as no lockfile.

| Ecosystem | Manifest | Lockfile (commit this) | Install from lockfile (CI must use this) |
|---|---|---|---|
| Node (npm) | `package.json` | `package-lock.json` | `npm ci` (not `npm install`) |
| Node (pnpm) | `package.json` | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |
| Node (yarn) | `package.json` | `yarn.lock` | `yarn install --immutable` |
| Python (Poetry) | `pyproject.toml` | `poetry.lock` | `poetry sync` (Poetry ≥2.0; `install --sync` before) |
| Python (uv) | `pyproject.toml` | `uv.lock` | `uv sync --frozen` |
| Python (pip) | `requirements.in` | `requirements.txt` (compiled, hashed) | `pip install --require-hashes -r requirements.txt` |
| Rust | `Cargo.toml` | `Cargo.lock` | `cargo build --locked` |
| Go | `go.mod` | `go.sum` (+ `GOFLAGS=-mod=readonly`) | `go build` with verified `go.sum` |
| Ruby | `Gemfile` | `Gemfile.lock` | `bundle install --frozen` |
| Java (Gradle) | `build.gradle` | `gradle.lockfile` (dependency locking) | `gradle --write-locks` then build |
| PHP (Composer) | `composer.json` | `composer.lock` | `composer install` (uses the lock) |

**The frozen-install rule is the load-bearing half.** A committed lockfile does nothing if CI runs the *mutating* install command (`npm install`, `poetry update`, a bare `pip install`), which is allowed to re-resolve ranges and silently drift. CI must run the **frozen / `--locked` / `ci` variant that fails if the lockfile and manifest disagree** — that failure is the gate that proves dev and CI resolved the identical graph. This matters more under an agent: an agent that hits a resolution error will reflexively run `npm install` or `poetry update` to "fix" it, quietly rewriting the lock. Make the frozen install the only install CI knows how to do.

```
PREDICATE: does the project commit a lockfile AND does CI install from it with the frozen variant?
├─ Lockfile committed + frozen install in CI ──────────► reproducible. Done.
├─ Lockfile committed, CI uses mutating install ───────► HALF a gate. CI can drift from
│     the lock undetected. Switch CI to `npm ci` / `--frozen-lockfile` / `--locked`.
└─ No lockfile (or it's gitignored) ───────────────────► NOT reproducible. Generate and
      commit it before anything else in this stage; nothing below is trustworthy without it.
```

**DEFAULT** when an ecosystem offers several package managers: pick the one whose frozen-install story is strictest and whose lock includes content hashes (pnpm, uv, Cargo all qualify) over a looser one. **FALLBACK** when you inherit a repo with no lockfile and unpinned ranges: pin the *current working* resolution first (generate the lock from what's installed and green), commit it, *then* start updating deliberately — never begin by upgrading and pinning in the same move, or you can't tell a pre-existing break from one you just introduced.

### Lockfile review and merge discipline

A lockfile diff is large and looks like noise, so it is exactly the kind of change a reviewer skims and an agent edits freely. Two rules keep it honest:

- **A change to the lockfile that is not explained by a manifest change is suspicious.** If `package-lock.json` moved but `package.json` did not, someone (or some agent) ran an unfrozen install, or a transitive dep shifted — either way it deserves a glance, not a blind LGTM. Review practice for agent-authored diffs is in [review-practice.md](review-practice.md).
- **Resolve lockfile merge conflicts by re-running the lock tool, never by hand-editing.** Hand-merging a lockfile produces a graph that resolved on no machine. Take one side, re-run the resolver, commit the regenerated lock. Long-lived branches make these conflicts frequent and ugly — another reason for the small-frequent-integration discipline in [version-control.md](version-control.md).

---

## Part 2 — Dependency as attack surface and maintenance burden

Every dependency you add is code you now ship but did not write, cannot fully audit, and must keep patched forever. It is simultaneously **attack surface** (its vulnerabilities and its maintainers' compromise become yours, all the way down the transitive tree) and **maintenance burden** (its breaking changes, its abandonment, its license becoming yours to track). The classic discipline — *don't pull a giant library for a trivial need* — has a name in scar tissue: the **left-pad incident**, where the un-publish of an eleven-line string-padding package broke builds across the npm ecosystem because thousands of projects had taken a dependency on something they could have written in a minute. The lesson is not "never depend"; it is "a dependency must earn its place against the cost of owning it."

### The agent-era twist: reflexive reach, hallucinated and slopsquatted names

An agent reaches for a library by reflex. Asked to pad a string, parse a date, or debounce a call, it will `import` a package rather than write five lines — because its training distribution is full of code that does. Two failure modes follow, both unique to a non-human contributor:

- **Hallucinated packages.** The agent invents a plausible-sounding package name that does not exist (`requests-oauth-helper`, `lodash-deep-merge`), confident it's real because it pattern-matches the shape of real names. A human notices the install fails. An agent on a loop may try variants until one resolves.
- **Slopsquatting.** This is the genuinely dangerous one. An attacker, anticipating which names models hallucinate, *pre-registers the invented name* with malicious code inside. Now the agent's hallucinated `import` resolves successfully — to an attacker's payload. The install works, the code runs, the tests may even pass, and you have shipped a backdoor that no human ever chose to add. Typosquatting (a malicious `colour` next to `color`, `python-requets` next to `requests`) is the older cousin of the same attack; the agent's reflexive, high-volume reaching makes both far more potent.

The consequence is not "tell the agent to be careful." An agent has no restraint to invoke. The consequence is a **blocking gate on dependency introduction**: a new dependency is reviewed and SCA-scanned before it can merge, and ideally drawn only from an allowlist.

### The dependency admission gate

Run this before any new dependency lands. It is a gate, not a guideline — wire its automatable parts into CI per [ci-cd.md](ci-cd.md).

```
NEW DEPENDENCY ADMISSION

D1. Does it exist and is it the package you think it is?
    PREDICATE: is this the real, canonical package — not a hallucination, typo, or squat?
    ├─ Resolves on the official registry, name matches the canonical docs,
    │   maintainer/repo is the expected one ─────────────► continue.
    └─ Name is one the agent proposed and you cannot independently confirm ──► STOP.
          Verify against primary docs / the project's real homepage. Treat an
          unconfirmable name as hostile until proven otherwise (slopsquat default).

D2. Do you actually need a dependency at all?
    PREDICATE: is the need non-trivial enough to justify owning external code forever?
    ├─ Trivial (left-pad class: a few lines, no edge cases you can't handle) ──► write it.
    └─ Real (crypto, parsing untrusted formats, a protocol, hard correctness) ──► continue;
          do NOT hand-roll these — a vetted library is safer than your own crypto.

D3. Is it healthy enough to depend on?
    PREDICATE: maintained, popular enough to be watched, sane transitive footprint, OK license?
    ├─ Active commits, real maintainers, reasonable dep tree, compatible license ──► continue.
    └─ Abandoned, single-maintainer with no successor, drags in a huge transitive
        tree for a small need, or a license you can't ship ──► reject or find an alternative.

D4. Does it pass the security scan?
    PREDICATE: does SCA report no known-exploitable vulnerability in it or its transitives?
    ├─ Clean (or only low-severity with no fix, accepted explicitly) ──► admit + add to lock.
    └─ Known critical/high CVE with a fix available ──► block until updated past it.
```

**DEFAULT** when D3 is borderline (a useful package with a thin maintainer base): prefer the more-watched alternative even if slightly less ergonomic; popularity is imperfect but it means more eyes find a compromise faster. **FALLBACK** when you cannot assess health quickly: vendor the minimal slice you need behind an interface you own (so swapping it later is cheap — see boundaries in `load-bearing`) rather than taking the whole library on faith.

### Tooling: SCA, allowlists, pinning, SBOM

| Control | What it does | Concrete tools |
|---|---|---|
| **SCA / vulnerability scan** | Flags known CVEs in your dependency tree, including transitives; opens fix PRs | Dependabot, Renovate, Snyk, `osv-scanner`, `npm audit`, `pip-audit`, `cargo audit`, `govulncheck`, Trivy, Grype |
| **Allowlist / policy gate** | Permits only pre-approved packages/licenses/registries; blocks the rest | `cargo-deny`, OSV-Scanner with policy, `pip-tools` + private index, npm `--registry` lockdown, internal proxy (Artifactory/Verdaccio) |
| **Pin + verify** | Exact versions + content hashes so the resolved bytes can't be swapped | the lockfiles in Part 1; `--require-hashes` (pip); `cargo --locked`; `go.sum` verification |
| **Provenance / signatures** | Proves a package came from the real publisher's pipeline | npm provenance (Sigstore), `cosign`, SLSA attestations |
| **SBOM** | A machine-readable bill of every component you ship, for audit and incident response | Syft, CycloneDX, SPDX generators |

**Make at least the SCA scan a blocking CI gate** — opening a fix PR is good, but an *advisory* scan an agent can ignore is not a gate; a build that fails on a new critical CVE is. An **allowlist / private proxy registry** is the strongest defense against slopsquatting, because a hallucinated or squatted name simply isn't in the allowed set and never installs. An **SBOM** turns "are we affected by the new CVE in library X?" from a frantic afternoon into a query — generate it in the release pipeline and store it with the artifact.

**Updater ≠ vulnerability gate.** Be precise about what Dependabot/Renovate *are*: by default they are version **updaters** that open PRs, **not** vulnerability gates. They only *gate* when their security-update / vulnerability-alert path is explicitly turned on **and** the merge is blocked on it. A repo that has Renovate configured purely to bump versions (`automerge` patch/minor on green) has **no** SCA gate at all, however busy its PR queue looks — its mere presence in the "SCA" row of an audit satisfies nothing. Pair the updater with a blocking `npm/pip/cargo audit` or OSV-Scanner step, or the gate is imaginary.

---

## Part 3 — Update discipline

Dependencies rot. Not updating is itself a risk: you accumulate known-vulnerable versions and the eventual forced upgrade is a cliff. The discipline is **regular, small, security-driven updates, with the test suite as the backstop** against a breaking change slipping in. A version bump is a code change like any other and earns the same gates — tests, CI, review of anything load-bearing.

```
PREDICATE: is this update routine-and-covered, or risky-or-uncovered?
├─ Patch/minor bump, full green suite that actually exercises the dependency's
│   surface, SCA clean ─────────────────────────────────► low-risk. Automate it
│     (Dependabot/Renovate opens the PR, CI gates it, auto-merge on green is fine).
├─ Major bump / known breaking changelog ───────────────► human-reviewed. Read the
│     migration notes; expect to change call sites; never auto-merge.
└─ Update touches code your tests barely cover ─────────► raise coverage on that path
      FIRST (see assay), or treat the bump as high-risk and review it by hand.
```

**The agent-era opportunity.** A mechanical-update-plus-run-the-suite loop is genuinely well-suited to an agent: bump the version, run the full suite, read the failures, apply the migration, repeat. This is real leverage — *provided* the backstop is honest. The danger is the agent's reflex to make red turn green: faced with a test that fails after an upgrade, it may "fix" the test (delete the assertion, loosen the expectation, mark it skipped) instead of fixing the integration. That is exactly the gate-gaming guarded against in [ci-cd.md](ci-cd.md), and it is why **test changes that ride along with a dependency bump must be reviewed by a human** — a green suite is only a backstop if the agent can't manufacture the green by gutting the test. Mutation testing and coverage floors that survive assertion-deletion (see `assay`) close the same loophole.

**DEFAULT** for routine maintenance: configure Renovate/Dependabot to batch low-risk dev-dependency and patch updates on a schedule, auto-merge on green, and isolate every major bump into its own reviewed PR. **FALLBACK** when the suite is too thin to trust as a backstop: do *not* enable auto-merge; the agent's update loop has no net, so keep a human on every bump until coverage of the critical paths is real. One caveat on "auto-merge on green": **a green CI is not a vulnerability gate** — it means the suite passed, not that the new version is advisory-free. So an auto-merged bump can *introduce* a vulnerable transitive dependency that no one reviewed; pair auto-merge with the blocking SCA/audit step above (and set `vulnerabilityAlerts`/security updates to require review), or vulnerable versions merge unscanned on a green light.

---

## Part 4 — Containerization & environment parity

"Works on my machine" is not a joke; it is a *class of bug* born from the dev, CI, and prod environments differing in OS, runtime version, system library, or env var. Pin the environment the same way you pin dependencies, so the agent's machine, the CI runner, and production are byte-for-byte the same place. This is where "works on mine" stops meaning anything *because there is only one "mine."*

| Tool | What it pins | Use it for |
|---|---|---|
| **Dockerfile / OCI image** | OS, system libs, runtime, your app + deps | the unit that runs identically in CI and prod |
| **Dev Container (`devcontainer.json`)** | the full *editing/build* environment | onboarding: a fresh clone opens into the exact toolchain |
| **Docker Compose** | the multi-service local topology (app + db + queue) | one command to stand up the whole stack locally |
| **Runtime version pin** (`.nvmrc`, `.python-version`, `.tool-versions`/asdf/mise, `rust-toolchain.toml`, `go` directive) | the language/toolchain version | so dev and CI agree on the interpreter, not just the libs |
| **Nix flake** (when warranted) | the entire dependency closure, hermetically | maximal reproducibility for teams that invest in it |

```
PREDICATE: how much does environment drift threaten this project?
├─ Multiple services, native deps, "works locally but not in CI" already seen ──►
│     containerize (Dockerfile + Compose) AND add a devcontainer; CI builds and runs
│     the SAME image it ships.
├─ Single service, pure-managed-runtime, simple ───────► a committed runtime-version pin
│     (`.tool-versions` / `.nvmrc`) + lockfile may be enough; don't over-engineer.
└─ Unsure ─────────────────────────────────────────────► pin the runtime version at
      minimum (cheap, high value); add containers when the first parity bug appears.
```

**The build-once-promote-the-same-artifact rule.** The container CI builds, tests, and scans must be the *same image* that reaches production — not a rebuild from the same Dockerfile, which can pick up a different base-image layer or a newly-published transitive. Build once, scan once, promote that exact digest. **Scan the image too** (Trivy, Grype, Docker Scout): your application lockfile says nothing about the CVEs in the base OS layer. **DEFAULT:** if the project already has any "but it worked locally" history, containerize — the parity bug will recur. **FALLBACK** when full containerization is too heavy right now: pin the runtime version and document the exact toolchain in `AGENTS.md` (Part 5) as the interim contract.

---

## Part 5 — Reproducible onboarding (the maturity tell)

Here is the single sharpest test of whether a project's process is real or theatre: **can a newcomer who has never seen the repo get it cloned, built, tested, and running locally from the written docs alone, in about half a day?** If they can, the knowledge lives in the docs. If they can't — if they need to DM someone for the secret env var, the undocumented setup step, the "oh you also have to run *that*" — then load-bearing knowledge is trapped in someone's head, and the project is one resignation away from being unbuildable.

The agent era sharpens the test to its limit. The newcomer is no longer occasional; **a fresh agent session is the most common newcomer there is, and it is a *permanently stateless* one.** It starts every session with zero tribal knowledge, no memory of the last session, and no one to DM. So the bar becomes: *can a fresh, stateless agent session bootstrap and run this project from the README and `AGENTS.md` alone?* Anything an agent needs but cannot read is, for that agent, lost. This is why externalizing knowledge stops being good manners and becomes a hard requirement: the durable memory of the project is its docs, its commit messages, and its ADRs — there is no head for an agent to hold knowledge in.

### `AGENTS.md`: the machine-readable extension of the README

The README orients a human. `AGENTS.md` (a converging convention; equivalently the tool-specific `CLAUDE.md`, `.cursorrules`, Copilot instructions) is the **machine-readable operating manual for the agent** — the place you write down everything an agent must do and cannot infer. Keep it terse, command-first, and *true*; a stale `AGENTS.md` is worse than none, because the agent will trust it. At minimum it states:

| Section | What it must contain | Why an agent needs it |
|---|---|---|
| **Setup / bootstrap** | exact commands to install deps and prepare the env, from a clean clone | the agent can't ask how; the commands must be copy-runnable |
| **Build** | the build command(s) and any required env | so it builds the way CI does, not a way it invented |
| **Test** | how to run the full suite, a single test, the must-run checks | so it verifies its own work the way the gate will |
| **Run** | how to start the app / services locally | so it can actually exercise a change end to end |
| **Lint / format** | the formatter + linter commands (the ones from [code-style.md](code-style.md)) | so it self-corrects before review, not after CI fails |
| **Conventions** | branch naming, commit format (Conventional Commits), PR size limits | so its output matches [version-control.md](version-control.md) without a human reformatting it |
| **Gotchas / non-obvious** | the things that bite: required services, generated code, the step that isn't in the obvious place | this is the tribal knowledge — externalize it or lose it every session |
| **Boundaries** | what NOT to touch, where secrets live (and that they're never committed), which deps are allowlisted | so it doesn't "fix" something by committing a key or pulling a banned package |

**The bootstrap test is itself a gate you can automate.** Periodically — ideally in CI on a clean runner — run exactly the commands in your setup docs, end to end, on a fresh checkout. If a fresh-clone build/test from the documented commands fails, your onboarding is already broken; you just haven't noticed because everyone's machine is warm. A `make bootstrap && make test` that a clean CI job runs *is* the proof that a stateless newcomer can start.

```
PREDICATE: can a fresh clone reach green tests using only the committed docs/commands?
├─ Yes, verified by a clean-runner CI job running the documented steps ─────► onboarding is real.
├─ Yes "as far as we know" but never tested from clean ─────────────────────► run the test;
│     warm-machine confidence is how hidden steps survive. Add the clean-runner job.
└─ No — needs an undocumented step / a secret nobody wrote down ────────────► that step is
      tribal knowledge. Externalize it into README/AGENTS.md (with secrets handled via the
      documented secret mechanism, never committed) until the clean run is green.
```

**DEFAULT** for what to externalize: if you had to *tell* the agent (or a new hire) something to unblock them, that fact belonged in the docs — write it down the moment you say it out loud. **FALLBACK** when the project is genuinely too complex for half-a-day onboarding: that is a signal to invest in a one-command bootstrap (a `Makefile` target, a devcontainer, a `setup.sh`) rather than to accept the tribal knowledge — the complexity is precisely what an agent can't infer.

---

## Anti-patterns (pre-flight checklist for STAGE 5)

| Anti-pattern | Why it bites harder with an agent | The gate that kills it |
|---|---|---|
| **No lockfile / gitignored lockfile** | the agent runs on a machine you'll never see; without a lock its green proves nothing | commit the lockfile (Part 1) |
| **CI runs the mutating install** (`npm install`, `poetry update`) | the agent "fixes" resolution errors by re-resolving, drifting silently from the lock | frozen/`--locked`/`ci` install in CI |
| **Hand-edited / hand-merged lockfile** | resolves on no machine; the agent will do this to clear a conflict | regenerate via the resolver; never hand-merge |
| **Reflexive dependency for a trivial need** (left-pad class) | the agent imports rather than writes five lines, by training reflex | the admission gate D2 |
| **Unverified package name** (hallucinated / slopsquatted / typosquatted) | the agent invents plausible names; attackers pre-register them | admission gate D1 + allowlist/private proxy |
| **Advisory-only SCA scan** | an advisory the agent can ignore is not a gate | make the SCA scan *block* the build on new criticals |
| **"Fixing" a post-upgrade test failure by gutting the test** | the agent optimizes green; deleting an assertion turns it green | review test changes; mutation testing; coverage floors |
| **Skipped dependency updates** | rot accumulates into a forced cliff upgrade no one wants to do | scheduled Renovate/Dependabot with a real test backstop |
| **Environment drift** ("works on my machine") | there is no single "mine"; the agent's machine differs from CI and prod | container/devcontainer + runtime pin; build-once-promote |
| **Unscanned base image** | the app lock says nothing about CVEs in the OS layer the agent's image ships | image scan (Trivy/Grype) in the pipeline |
| **Tribal knowledge / undocumented setup step** | a stateless agent has no one to ask and no memory to fall back on | README + `AGENTS.md`; clean-runner bootstrap CI job |
| **Stale `AGENTS.md`** | the agent trusts it and acts on wrong instructions confidently | treat docs as code; update them in the same PR as the change |

---

## Escalation ladder (when reproducibility is still shaky)

When a build is "mostly reproducible" but you still get the occasional "green here, red there," climb one rung at a time rather than declaring it solved:

```
commit the lockfile + frozen install
   → pin the runtime version (.tool-versions / .nvmrc / toolchain file)
      → containerize dev = CI = prod (Dockerfile + devcontainer), build-once-promote
         → scan deps AND the image in a blocking CI gate (SCA + Trivy/Grype)
            → allowlist / private proxy registry (kills slopsquatting at the source)
               → SBOM + provenance/signatures (full supply-chain attestation)
                  → hermetic builds (Nix / Bazel) when correctness justifies the cost
```

Each rung costs more than the last; stop at the rung where the project's risk is covered — a solo internal tool earns the first two or three, a payments service earns most of them. The governing question from [decision-tree.md](decision-tree.md) decides how far you climb: how much does a non-reproducible build, an unvetted dependency, or an unbootstrappable repo actually cost *this* project if it fails? Fund the gates to that answer, and no further. The end state is the one this whole skill points at — the right thing (a clean, locked, scanned, documented, reproducible build) is also the path of least resistance, so the agent takes it without being asked.

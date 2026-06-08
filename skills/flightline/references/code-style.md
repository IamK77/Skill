# Code Style — Let the Machine Hold the Line

This reference is opened by **STAGE 2** of the flight plan ([../SKILL.md](../SKILL.md)). It clears the gate checks `code-style format-and-lint-enforced` and `code-style verify`. Its job is narrow and load-bearing: turn code style from a thing contributors are *asked* to respect into a thing the **machine enforces automatically**, so that human review attention — the scarcest resource in an agent-built codebase — is never spent on formatting. The whole reference is a single argument: **format goes to the machine, logic stays with the human**, and in the agent era the linter becomes the *first automated reviewer* of everything the agent emits. Read it after [version-control.md](version-control.md) (you will share its pre-commit harness) and before [ci-cd.md](ci-cd.md) (which re-runs every check here as the second line of defense). The agent-era turn driving all of it is catalogued in [agent-era-shifts.md](agent-era-shifts.md).

---

## Why style is not an aesthetics question

The instinct to wave off style as bikeshedding ("tabs vs spaces, who cares") is right about the *argument* and wrong about the *stakes*. Consistent style is not about taste. It pays three concrete, measurable dividends, and every one of them gets sharper when an agent is writing the code:

| Dividend | What it buys | Why the agent era sharpens it |
|---|---|---|
| **Lower reading load** | A reader spends cognition on *what the code does*, not on parsing an unfamiliar brace style or re-indenting in their head. | The reviewer is now reading code they did not write — every line is unfamiliar. Cognitive budget spent decoding layout is budget stolen from spotting the plausible-but-wrong logic. |
| **Clean diffs** | A diff shows the *semantic* change and nothing else — no whitespace churn, no reflowed lines, no import reordering masking the one real edit. | Agents emit large diffs. A 600-line PR where 550 lines are reformatting is unreviewable; the real change hides in the noise and gets a blind LGTM. Deterministic formatting keeps the diff honest. |
| **Review focuses on logic** | Reviewers stop nitpicking commas and argue about design, correctness, and edge cases — the things that actually matter. | The human review is the *one gate no automation replaces* ([review-practice.md](review-practice.md)). Every second it spends on format is a second not spent on the gate's real job. |

The through-line: **style consistency is a precondition for the division of labor that makes agent-built code reviewable at all.** Format is a solved, mechanical problem. Hand it to a machine, and the human is freed to do the irreplaceable part.

> The classic human-era framing was "consistency lowers cognitive load for the team." The agent-era framing is stronger: **the agent has no aesthetic preference and no fatigue, so it will follow whatever style is configured, perfectly, forever — but only if something configures and enforces it.** Left unconfigured, an agent produces *locally plausible but globally inconsistent* code, because each session reaches for whatever the surrounding snippet or its training prior suggests. Consistency is free to obtain and impossible to get by goodwill.

---

## The format / logic division of labor

This is the organizing principle of the whole stage. Sort every property a reviewer might care about into two bins:

- **Mechanical & decidable → the machine.** Indentation, quote style, line length, import ordering, trailing commas, brace placement, spacing. A formatter computes the one canonical rendering; there is exactly one right answer and a program produces it. **A human must never review these. Ever.** If a reviewer is commenting on indentation, the toolchain has failed, not the author.
- **Judgment & semantics → the human (with machine assistance).** Is the logic correct? Is the abstraction right? Are the edge cases handled? Is this the simplest design? Is there a security hole? These need judgment, and the human is the gate.

In between sits a third bin the linter occupies: **decidable defects** — unused variables, unreachable code, a floating promise, a shadowed binding, an obviously wrong type. These are not *style* and not *deep logic*; they are mechanically detectable mistakes. The linter catches them *before a human looks*, which is exactly where you want them caught.

```
                 format (decidable layout)  ──▶  FORMATTER     (zero human attention)
 every change ─▶ decidable defects          ──▶  LINTER + TYPES (first automated review)
                 semantics / design / risk  ──▶  HUMAN          (the irreplaceable gate)
```

The agent-era payoff: by pushing the first two bins entirely onto machines, you collapse the human's surface area down to *only* the bin a machine cannot do. With an agent author, that is the difference between a reviewable PR and an unreviewable one.

---

## The tooling: four layers, defense in depth

A complete style floor has four tools, each catching a different class. Pick one of each for the language and wire them into the same gate. Names below are the current defaults; substitute the equivalent for the stack.

| Layer | Job | Per-language default | What it catches |
|---|---|---|---|
| **Formatter** | Impose the one canonical layout. No config debates — opinionated by design. | Prettier (JS/TS), `gofmt`/`gofumpt` (Go), Black (Python), `rustfmt` (Rust), `clang-format` (C/C++), `ktlint`/Spotless (JVM), `dotnet format` (C#) | Layout: indentation, quotes, line wrap, import order, trailing commas. |
| **Linter** | Flag decidable *defects* and risky patterns beyond layout. | ESLint / Biome (JS/TS), Ruff (Python), `golangci-lint` (Go), Clippy (Rust), `clang-tidy` (C/C++), `rubocop` (Ruby) | Unused vars, dead code, shadowing, floating promises, `==` vs `===`, banned APIs, complexity ceilings. |
| **Type-checker** | Prove type contracts where the language has one. | `tsc --noEmit` (TS), `mypy`/`pyright` (Python), the compiler itself (Go/Rust/Java/C#) | Type mismatches, null/undefined misuse, wrong signatures, impossible branches. |
| **EditorConfig** | Set baseline whitespace/charset rules every editor and tool honors, *before* any of the above run. | `.editorconfig` (universal) | Indent style/size, end-of-line, charset, final newline, trailing-whitespace trim. |

Two rules govern how they're wired:

1. **Run them at pre-commit AND re-run them in CI.** This is deliberate redundancy — *defense in depth*. The pre-commit hook ([version-control.md](version-control.md) shares the harness) gives instant local feedback and is the shift-left win; CI ([ci-cd.md](ci-cd.md)) is the *un-bypassable* backstop, because a pre-commit hook can be skipped with `--no-verify` (and an agent told "just commit it" will do exactly that). **The local hook is for speed; the CI check is for truth.** Never have only one.
2. **`--check` mode is the gate; `--write` mode is the convenience.** CI runs the formatter in *check* mode (fail if anything is unformatted) and never rewrites — a CI job that auto-formats and pushes is a gate that can't fail. The pre-commit hook may auto-fix locally, but the merge gate only ever *verifies*.

### A copy-usable pre-commit sketch

The [pre-commit](https://pre-commit.com) framework is the cross-language standard; it pins each tool to a version (reproducibility — see [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md)) and runs them on staged files. A polyglot `.pre-commit-config.yaml`:

```yaml
# .pre-commit-config.yaml — install once with `pre-commit install`
repos:
  # Universal whitespace / secrets hygiene (shared with version-control.md)
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-merge-conflict
      - id: check-added-large-files        # blocks the accidental binary blob
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks                        # secret-scan — see version-control.md

  # Python: format + lint + type-check
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.4
    hooks:
      - id: ruff                            # lint, --fix locally
        args: [--fix]
      - id: ruff-format                     # formatter
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks:
      - id: mypy                            # type gate, not optional

  # JS/TS: format + lint (run type-check in CI; tsc is slow for a hook)
  - repo: local
    hooks:
      - id: prettier
        name: prettier
        entry: npx prettier --write
        language: system
        types_or: [javascript, ts, tsx, json, css, markdown]
      - id: eslint
        name: eslint
        entry: npx eslint --max-warnings=0
        language: system
        types_or: [javascript, ts, tsx]
```

In CI the *same* tools run in verify-only mode so a skipped hook can't sneak past:

```yaml
# CI step — the un-bypassable backstop (full pipeline in ci-cd.md)
- run: ruff format --check . && ruff check .
- run: mypy .
- run: npx prettier --check . && npx eslint --max-warnings=0 .
- run: npx tsc --noEmit          # the type gate the fast hook skipped
```

> **Decision — where does each check live?**
> **PREDICATE:** is the check fast (< ~2s on the staged diff) and auto-fixable? → pre-commit hook (instant feedback, may `--write`). Is it slow, project-wide, or must-not-be-bypassable? → CI gate (and optionally a slower pre-push hook). **DEFAULT:** formatter + fast linter at pre-commit *and* CI; type-checker and the full-tree lint at CI (and pre-push). **FALLBACK** when you can't tell if a check is fast enough for the hook: put it in CI only — never make the commit loop slow, because a slow hook is a hook the agent (and the human) will start skipping with `--no-verify`, and a skipped hook is no hook.

---

## The agent-era turn: the linter is your first reviewer

Here is the shift that re-aims the whole stage. In the human era the linter was a tidiness tool — nice to have, occasionally pedantic. **In the agent era the linter is the first automated reviewer of agent output**, and it runs before a single human second is spent. The agent produces plausible code at volume; the linter and type-checker are the cheapest, fastest filter that catches a whole class of its characteristic mistakes *for free*, so the human gate downstream sees a cleaner diff and can spend its attention on the bugs only judgment finds.

Enumerate what that first reviewer catches with zero human involvement:

| Bug class the linter/types catch | Why an agent emits it | Rule that flags it |
|---|---|---|
| **Unused variable / import / parameter** | The agent drafts, edits, leaves scaffolding behind; it has no discomfort about a dangling binding. | `no-unused-vars` (ESLint), `F401`/`F841` (Ruff), `unused` (Clippy), compiler (Go). |
| **Floating promise / unhandled await** | The agent forgets to `await` an async call; the happy path "works" and the failure is silent. | `no-floating-promises` / `no-misused-promises` (typescript-eslint), `RUF006` (Ruff). |
| **Variable shadowing** | A fresh session reuses an obvious name and silently shadows an outer binding, masking a bug. | `no-shadow` (ESLint), `shadow` lints (Clippy), `redefined-outer-name` (Pylint/Ruff). |
| **Obvious type error** | The agent passes a `string` where a `number` is wanted, or accesses a possibly-null value — confidently. | `tsc`, `mypy`/`pyright`, the compiler. |
| **Dead / unreachable code** | Refactors leave behind a branch nothing reaches; the agent rarely prunes. | `no-unreachable` (ESLint), Ruff/Clippy dead-code lints, `go vet`. |
| **Banned / dangerous API** | The agent reaches for `eval`, `any`, `console.log`, a deprecated call, or `unwrap()` on a Result. | Custom `no-restricted-syntax` / `no-explicit-any` / `clippy::unwrap_used` rules. |
| **Complexity over budget** | The agent generates a 200-line function with cyclomatic complexity 40 and no complaint. | `complexity` / `max-lines-per-function` (ESLint), `C901` (Ruff), `gocyclo` (golangci-lint). |

Each of these would otherwise be a human review comment — or worse, an undetected defect. Catching them in the linter means the human reviewer opens a PR where this entire bin is *already clean*, and can spend their whole budget on the things no rule can check. **That is the leverage: the cheaper the automated first pass, the more the expensive human pass is worth.** This is the same shift `load-bearing` calls "the bottleneck moved from writing code to verifying it" — code style is one of the places you build the verification apparatus.

Two consequences specific to an agent author:

- **Wire the linter's output back to the agent.** The agent can read lint/type errors and fix its own output before the human ever sees it — a tight `lint → fix → re-lint` loop the agent runs against itself. This is the single highest-leverage automation in the stage: the agent fixes the entire decidable-defect bin autonomously, and the human inherits a clean diff. (See [ci-cd.md](ci-cd.md) for wiring the same loop into the pipeline; agents wired into CI auto-fix must still pass the same gates.)
- **But the linter passing is NOT the code being correct.** A green linter means *no decidable defect*, not *correct logic*. The agent optimizes the observable signal, so it will treat a green linter as "done" — and it will look done, while the logic is plausibly wrong. The linter is the *first* reviewer, never the *only* one. Guard against the agent silencing a rule to get green: an inline `// eslint-disable-next-line` or `# type: ignore` is a review red flag (see the gameability note below), and the human gate must look for it.

---

## Pick ONE ruleset and stop debating

Which formatter style or lint config you choose is **almost entirely irrelevant**; that the project has exactly one and enforces it is **entirely the point**. This was true in the human era (the team that argues for a week about semicolons has already lost). It is *more* true now, for a reason unique to the agent:

> **The agent will follow whatever ruleset is configured, instantly and without complaint. It has no preference to satisfy and no habit to unlearn.** So the entire value of "choose a style" is *consistency across the codebase*, and consistency is maximized by picking any reasonable config and never touching it. There is zero upside to a bespoke style and real downside: a custom rule the agent doesn't have a strong prior for, it will fight, producing churn. Off-the-shelf configs (Prettier's defaults, Black's near-zero options, `gofmt`'s single answer, the Airbnb/Standard ESLint presets, Ruff's recommended set) win precisely because they are *unsurprising* to the model.

Concretely:

- **Prefer opinionated, low-config formatters.** `gofmt` has no options on purpose; Black exposes almost none; Prettier a handful. Fewer knobs = fewer arguments = fewer ways for the config to drift. This is a feature.
- **Adopt a standard lint preset, then add only rules that catch *real bugs you've seen*.** Don't hand-author a 300-line ESLint config; start from a community preset and layer on a few project-specific `no-restricted-*` rules for APIs you've banned.
- **Lock the tool versions** (in the lockfile and `.pre-commit-config.yaml` `rev:`) so the same code formats identically on every machine and in CI — a reproducibility concern shared with [dependencies-and-reproducibility.md](dependencies-and-reproducibility.md). A formatter that renders differently across versions reintroduces exactly the diff noise you adopted it to kill.

---

## Keep the gate un-gameable

Because the agent optimizes the green light, the style gate must resist being *satisfied without being honored* — the same discipline [ci-cd.md](ci-cd.md) applies to tests. The agent's path of least resistance to a passing lint is often to *suppress the rule*, not fix the code:

- **Treat inline suppressions as review surface.** `// eslint-disable`, `# noqa`, `# type: ignore`, `#[allow(...)]`, `@ts-ignore` — each is the agent (or a human) turning off a check at one spot. They are sometimes legitimate, but every one is a hole in the gate and **must be reviewed**. Configure the linter to require a *reason* on each suppression (e.g. ESLint's `reportUnusedDisableDirectives`, Ruff's blanket-`noqa` ban) so a bare silencer fails.
- **Forbid the global off-switch.** A PR that loosens the root config (sets `strict: false`, drops a rule from the preset, downgrades an error to a warning) is changing the *gate itself* and deserves the same scrutiny as a test deletion. Branch protection plus review of config files (treat `.eslintrc`, `ruff.toml`, `tsconfig.json` as protected) closes this.
- **Warnings-as-errors, or warnings are lies.** A linter that emits warnings the build tolerates trains everyone — and the agent — to ignore the output entirely. Run with `--max-warnings=0` / `-D warnings` / `error` mode so the signal is binary: clean or blocked. A tolerated warning is not a gate.

> The principle, stated once: **a green light the agent can manufacture is not a gate.** Style is the lowest-stakes place this rule applies, which makes it the perfect place to build the habit before it matters on tests and security.

---

## Adopting style on an existing messy codebase

The common blocker: the rules are clear for a greenfield repo, but you've inherited 80,000 lines of inconsistent code and turning on the formatter would produce a five-thousand-file diff. Two viable strategies; pick by team appetite.

> **Decision — big-bang reformat vs ratchet?**
> **PREDICATE:** can the team tolerate one large, mechanical, logic-free commit that touches most files? → **big-bang.** Is `git blame` continuity and a clean review history more valuable, or is the codebase too large/active to freeze for one commit? → **ratchet.**

**DEFAULT — the one big formatting commit (big-bang).** This is the right answer for most repos and the one to reach for first:

1. Land all in-flight PRs first (a reformat invalidates open diffs — coordinate the freeze).
2. Run the formatter over the whole tree in a *single commit that does nothing but reformat* — no logic changes mixed in, so it is trivially reviewable as "yep, that's just the formatter."
3. Add that commit's SHA to `.git-blame-ignore-revs` so `git blame` and `git log` skip past it and history stays legible:
   ```
   # .git-blame-ignore-revs
   a1b2c3d4...   # repo-wide formatter adoption, no logic change
   ```
   (Configure with `git config blame.ignoreRevsFile .git-blame-ignore-revs`; GitHub honors it automatically.)
4. Turn on the pre-commit hook and the CI `--check` *in the same PR* so the codebase can never drift back.

**FALLBACK — the ratchet (when big-bang isn't tolerable).** Enforce the rules only on *changed* code, tightening over time, so you never freeze the repo:

- Run the linter/formatter on the **diff only** (e.g. `ruff check --diff`, lint-staged, `darker` for Black-on-diff, or a tool like `betterer`) so a PR is required to clean only the lines it touches.
- Record current violation counts as a **baseline that may only decrease** — the build fails if the count goes *up*, passes if it holds or drops. The codebase converges to clean as files are naturally edited, with no flag day.
- Optionally schedule periodic agent-driven cleanup PRs that format one directory at a time — a mechanical, low-risk chore an agent does well, each small enough to review ([review-practice.md](review-practice.md)).

Either way the **end state is identical**: every line that lands after adoption is machine-formatted and lint-clean, enforced at pre-commit and CI, with zero human attention on format from that point forward. The choice is only about how you cross the gap.

---

## Stage exit — what "done" looks like

You have cleared `code-style format-and-lint-enforced` when all of the following are true:

- A **formatter, linter, type-checker** (where the language has one), and **`.editorconfig`** are configured, version-pinned, and run from **one ruleset nobody is still debating**.
- They run at **pre-commit** (fast feedback, shared harness with [version-control.md](version-control.md)) **and** are re-checked in **CI in `--check` mode** as the un-bypassable backstop ([ci-cd.md](ci-cd.md)).
- The linter is wired so it is the **agent's first reviewer** — ideally in a self-fix loop — and the human review inherits a diff with the entire decidable-defect bin already clean.
- The gate is **un-gameable**: warnings are errors, inline suppressions carry reasons and get reviewed, and the config files are protected from quiet loosening.
- For an existing codebase, adoption is **done, not aspirational** — either one big formatting commit (in `.git-blame-ignore-revs`) or a ratchet baseline that only decreases — so no un-formatted line can land going forward.

When that holds, format costs the human exactly zero attention, the machine holds the line on every commit without anyone remembering to, and the human gate downstream is free to do the one thing no tool can: judge whether the agent's confident code is actually right. Return to [../SKILL.md](../SKILL.md) STAGE 3 for the gate that does that.

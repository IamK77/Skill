# touchstone

> A touchstone is the assayer's stone: streak a metal across it and you know if it's real gold.
> **touchstone** does that for a skill — it asks, honestly, *does this skill actually change what the
> model does?* — and answers in a way a skeptic can check, because the only way to convince a skeptic
> is to refuse to flatter yourself.

It runs a **fair fight**: an agent reviews the same code **twice** — once **with** the skill running
(as its gated, navigated workflow), once **without** (free navigation, no skill) — same model, same
tools, same blind grader. The only variable is the skill. Repeat N times so it isn't a fluke. Works
for any skill in `skills/<suite>/<name>`.

## Where "correct" comes from (the honest part)

We do **not** write the answer key — the author grading their own homework is exactly what this
avoids. Each fixture is a real moment from a real open-source project's history:

- **target** — the code *before* a maintainer touched it (`before.*`).
- **reference** — the maintainer's *actual* change (`fix.diff`): a known-good answer we didn't
  author, and **not** the only valid one.
- **metric** — how good the review's recommendations are for this code, **0–10, graded blind on the
  review's own merits** (the grader never sees the diff). The score is *composed in code* from a few
  low-variance factual judgments — is it grounded in this code? does it find a genuinely real problem?
  several? are the fixes concrete? any actively-harmful advice? — so a single mis-call nudges the score,
  never collapses it.
- **false-positive control** — run the *same* review on the already-fixed `after` code. If it
  re-raises the resolved problem, that's a measured false positive ("does it invent problems where
  there are none?"). **Both arms** carry this control, so their cry-wolf rates are comparable.

The quality grader sees the code + the review but **NOT the diff, NOT the skill, NOT which arm produced
the review** — so it can't anchor on the maintainer's spot or be swayed by the skill. A *separate*
overlap probe does see the diff, only to record topical overlap (recorded, never scored).

## The two arms — the skill is the only variable

Both arms **navigate the code** with the same tools (`ls` / `grep` / `read_file` over a virtual file
tree — the code is sought, not force-fed) and the same turn ceiling. The *only* difference:

- **no skill** (`harness.runNavReview`) — the agent navigates freely and writes its review when it
  judges it has seen enough.
- **with skill** (`harness.runHarness`) — the skill **runs as a gated workflow**: ordered stages, each
  with a GATE that must clear before the next unlocks, references pulled on demand. A faithful
  reimplementation of running a skill as an agent — not Claude Code literally, but the same shape
  (text-marker tools, deterministic gates, model-driven navigation and substance).

This measures the skill the way it actually *runs* — its structure AND its content — not "SKILL.md
dumped into the prompt", which was never how a skill works.

**Grading is decomposed, not holistic.** The earlier holistic "pick a 0–10 band" grader was so noisy
it scored one fixed review 8 / 1 / 3. v2 replaces the band-pick with a few factual yes/no judgments
composed into the score in code — far lower variance, and blind to the diff. The Why panel shows each
trial's judgments (`grounded`/`real`/`multiple`/…) plus the run's turns, nav-calls, gates, and refs.

## Run it — the web bench

```bash
node server.mjs        # → http://localhost:5178
```

Open the URL, **fill in the provider** (kind + base URL + model + API key) right in the page, then
**Run experiment**. No env vars. The server makes the provider call server-side, so your key stays
on your machine (the browser never hits a third-party API directly — CORS would block it). Non-secret
fields persist in `localStorage`; the **key is in memory only, never written to disk**.

### On claude.ai (clone the repo, invoke the artifact)

Give claude.ai this repo's URL; it clones, and you point it at a **self-contained** artifact:

```
touchstone/artifacts/<suite>-<name>.jsx     # e.g. touchstone/artifacts/surface-wellspring.jsx
```

Each artifact embeds the engine **+ nav-harness**, styles, the skill's `SKILL.md` **and its
references**, and the fixture(s) — one file per skill, runs on claude.ai's injected credentials (no
key), at concurrency 8 (12 trips claude.ai's rate limit). It is **generated from these same sources**
by `build-artifact.mjs`, so it renders identically to the local page and runs the identical logic.

- **Build one locally:** `node build-artifact.mjs --skill surface/wellspring` → `artifacts/surface-wellspring.jsx`.
- **Kept in sync automatically:** the `touchstone-artifacts` GitHub Action rebuilds and commits the
  artifacts whenever a source or skill changes (like release-please maintains CHANGELOG) — so the
  committed file a clone gets is never stale. **Don't hand-edit the artifact; edit the sources.**
- One transformation is applied to the embedded *data* only: the literal ES-module keyword is escaped
  to `import` (decode-identity — byte-for-byte the same at runtime) so claude.ai's regex
  dependency pre-scan doesn't mistake the *reviewed code's* own imports for real dependencies.

### Headless / CLI

`run-harness-ab.mjs` runs the same nav-harness A/B from the terminal, configured by env, with the
full per-trial trace (turns, nav-calls, gates cleared, references opened):

```bash
LAB_FLAVOR=anthropic LAB_BASE_URL=https://api.deepseek.com/anthropic \
LAB_API_KEY=sk-... LAB_MODEL=deepseek-v4-pro \
node run-harness-ab.mjs --skill surface/wellspring --trials 2
```

Point the **grader** at a *different* model (`LAB_GRADER_*`) so a blind spot isn't shared between
reviewer and grader. `harness-smoke.mjs` runs a single skill arm and prints the live gate-by-gate
trace; `grader-variance-test.mjs` re-grades saved reviews K× to measure the grader's spread.

## Read the numbers honestly

- **One fixture is one data point.** Few fixtures + small N = a **signal, not a proof**.
- **Read the per-fixture split, not just the headline delta** — a skill can help a lot on the case
  that matches its lens and not at all on a near-ceiling case; the blended number hides that.
- **A near-ceiling case can't discriminate.** If the model already scores high without the skill,
  there's no room to show a lift (and noise can read as a small negative). That's a property of the
  fixture, not the skill.
- **The grader is itself an LLM** — fair, but fallible. The decomposed v2 grader is far steadier than
  the old holistic one, but the judgments it composes from are still model calls; read the per-trial
  judgments, don't trust a single delta.
- **The code is not executed** (by design, for now): this measures the review's *advice*, not whether
  a rewrite compiles.

## Add a fixture

```
evals/<suite>/<name>/
  profile.json          # { skill, domain, reviewSystem } — the per-skill framing
  fixtures/<id>/
    meta.json           # repo, commit, file, target/answer/answer_key filenames, fix_summary
    before.*            # target (old code)
    after.*             # maintainer's fixed version
    fix.diff            # the real maintainer diff = the known-good reference
```

A **good** fixture is real, **uncurated** (the bug sits in realistic noise, not excerpted), and
matches the skill's core thesis — ideally with a tempting *wrong* move the no-skill arm can fall into.
Mine them from real history:

```bash
git clone --filter=blob:none --no-checkout https://github.com/<repo>
git -C <repo> log -E --grep='derive|single source|redundant state|prop.?drill|out of sync' --oneline
git -C <repo> show <sha>^:<path> > before.ext   # before
git -C <repo> show <sha>:<path>  > after.ext    # after
git -C <repo> show <sha> -- <path> > fix.diff   # the reference
```

The real `SKILL.md` is read **live** from `skills/<suite>/<name>/` — never copied here.
Disabled fixtures live in `evals/<suite>/<name>/_disabled-fixtures/` (move back to re-enable).

## What's here

| file | role |
|---|---|
| `core.mjs` | the grader (decomposed `gradeQuality`, blind reference-overlap, FP) + orchestration (`mapPool`, `summarize`). Pure ESM, runs in Node **and** the browser. |
| `harness.mjs · navfs.mjs` | the engine: skill-as-gated-workflow (`runHarness`) + skill-free baseline (`runNavReview`) over an in-memory virtual file tree the agent navigates. Browser-safe; embedded into the artifact. |
| `web/index.html` | the web UI (the product surface). |
| `web/tokens.css · type.css · layout.css · form.css · motion.css` | the design system (built with the `atelier` suite). |
| `web/DESIGN-CANON.md · *-REPORT.md · INTERACTION.md` | the design brief, measured-contrast report, and the visual-agnostic logic spec. |
| `web/color-build.mjs` | rebuilds + **measures** the colour tokens' contrast (WCAG + APCA); exits non-zero on a floor miss (CI-able). |
| `build-artifact.mjs` | `--skill <suite>/<name>` → generates the self-contained claude.ai artifact into `artifacts/`. Reads from disk (no server); self-checks for stray imports. |
| `artifacts/<suite>-<name>.jsx` | the generated claude.ai artifacts (one per skill) — kept in sync by the `touchstone-artifacts` Action; don't hand-edit. |
| `providers.mjs · node-lib.mjs · server.mjs` | the model client, Node-only loaders, and the local server. |
| `run-harness-ab.mjs · harness-smoke.mjs · grader-variance-test.mjs` | headless CLIs: the nav-harness A/B, a single-arm gate trace, and the grader-variance probe. |
| `evals/surface/wellspring/` | the skill-specific eval set: `profile.json` + `fixtures/`. |

## Licence

Apache 2.0 — see the repository root `LICENSE` and `NOTICE`.

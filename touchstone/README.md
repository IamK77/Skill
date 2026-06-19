# touchstone

> A touchstone is the assayer's stone: streak a metal across it and you know if it's real gold.
> **touchstone** does that for a skill — it asks, honestly, *does this skill actually change what the
> model does?* — and answers in a way a skeptic can check, because the only way to convince a skeptic
> is to refuse to flatter yourself.

It runs a **fair fight**: the same small review loop runs **twice** on the same code, same model,
same blind grader — once **with** the skill's guidance in context, once **without**. The only
variable is the skill. Repeat N times so it isn't a fluke. Works for any skill in `skills/<suite>/<name>`.

## Where "correct" comes from (the honest part)

We do **not** write the answer key — the author grading their own homework is exactly what this
avoids. Each fixture is a real moment from a real open-source project's history:

- **target** — the code *before* a maintainer touched it (`before.*`).
- **reference** — the maintainer's *actual* change (`fix.diff`): a known-good answer we didn't
  author, and **not** the only valid one.
- **metric** — how good the review's recommendations are for this code, **0–10, anchored on the
  maintainer's change = 6** (an equally-valuable real fix also ≈ 6; clearly more thorough → higher;
  partial/vague/cosmetic → lower; **wrong or harmful → capped low**). The fixed anchor keeps scores
  comparable run-to-run instead of drifting with the grader's mood.
- **false-positive control** — run the *same* review on the already-fixed `after` code. If it
  re-raises the resolved problem, that's a measured false positive ("does it invent problems where
  there are none?"). **Both arms** carry this control, so their cry-wolf rates are comparable.

The grader is a separate model call that sees the code + the review + the real diff — **never the
skill, never which arm produced the review**.

## The two arms — the skill is the only variable

Both arms run the **identical small loop** (`core.runMiniHarness`: a draft pass, then a
self-revision pass). The *only* difference:

- **no skill** — the loop, nothing extra in context.
- **with skill** — the same loop, with the skill's `SKILL.md` in context.

This deliberately isolates the skill's **content**. (It is *not* the skill's heavy gated workflow —
that conflated the skill's content with the multi-step structure; the small loop holds the process
fixed so a difference is attributable to the skill, not to "it took more steps.")

**Grading is consensus.** The grader is noisy (same review, temp 0, still wobbles ±2–3), so each
review is graded **2×, averaged; if the two disagree by >2, a 3rd is taken and the median used**.
The per-trial `graded X/Y` trace is shown in the Why panel so you can see the grader's spread.

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

Each artifact embeds the engine, styles, the skill's `SKILL.md`, and the fixture(s) — one file per
skill, runs on claude.ai's injected credentials (no key), at concurrency 8 (12 trips claude.ai's rate
limit). It is **generated from these same sources** by `build-artifact.mjs`, so it renders identically
to the local page and runs the identical logic.

- **Build one locally:** `node build-artifact.mjs --skill surface/wellspring` → `artifacts/surface-wellspring.jsx`.
- **Kept in sync automatically:** the `touchstone-artifacts` GitHub Action rebuilds and commits the
  artifacts whenever a source or skill changes (like release-please maintains CHANGELOG) — so the
  committed file a clone gets is never stale. **Don't hand-edit the artifact; edit the sources.**
- One transformation is applied to the embedded *data* only: the literal ES-module keyword is escaped
  to `import` (decode-identity — byte-for-byte the same at runtime) so claude.ai's regex
  dependency pre-scan doesn't mistake the *reviewed code's* own imports for real dependencies.

### Headless / CI

`run.mjs` is a no-UI variant configured by env (shares `core.mjs`, but runs a single-pass review):

```bash
LAB_FLAVOR=openai LAB_BASE_URL=https://api.deepseek.com/v1 \
LAB_API_KEY=sk-... LAB_MODEL=deepseek-v4-pro node run.mjs --trials 3
```

Point the **grader** at a *different* model (`LAB_GRADER_*`) so a blind spot isn't shared between
reviewer and grader.

## Read the numbers honestly

- **One fixture is one data point.** Few fixtures + small N = a **signal, not a proof**.
- **Read the per-fixture split, not just the headline delta** — a skill can help a lot on the case
  that matches its lens and not at all on a near-ceiling case; the blended number hides that.
- **A near-ceiling case can't discriminate.** If the model already scores high without the skill,
  there's no room to show a lift (and noise can read as a small negative). That's a property of the
  fixture, not the skill.
- **The grader is itself an LLM** — fair, but fallible; the `graded X/Y` spread shows how much it
  wobbled. Consensus dampens it; it doesn't erase it.
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
| `core.mjs` | the engine — prompts, the small loop `runMiniHarness`, grading, consensus, FP, summary. Pure ESM, runs in Node **and** the browser. |
| `web/index.html` | the web UI (the product surface). |
| `web/tokens.css · type.css · layout.css · form.css · motion.css` | the design system (built with the `atelier` suite). |
| `web/DESIGN-CANON.md · *-REPORT.md · INTERACTION.md` | the design brief, measured-contrast report, and the visual-agnostic logic spec. |
| `build-artifact.mjs` | `--skill <suite>/<name>` → generates the self-contained claude.ai artifact into `artifacts/`. Reads from disk (no server); self-checks for stray imports. |
| `artifacts/<suite>-<name>.jsx` | the generated claude.ai artifacts (one per skill) — kept in sync by the `touchstone-artifacts` Action; don't hand-edit. |
| `color-build.mjs` | rebuilds + **measures** the colour tokens' contrast (WCAG + APCA); exits non-zero on a floor miss (CI-able). |
| `providers.mjs · node-lib.mjs · server.mjs` | the model client, Node-only loaders, and the local server. |
| `run.mjs · compare.mjs · regrade.mjs` | headless CLI variants. |
| `evals/surface/wellspring/` | the skill-specific eval set: `profile.json` + `fixtures/`. |

## Licence

Apache 2.0 — see the repository root `LICENSE` and `NOTICE`.

# skill-lab web UI — interaction logic (visual-agnostic spec)

What the front-end *does*, independent of how it looks. The redesign rebuilds the
visual against this; the logic, data, and states below must all be expressed.

## Engine (unchanged — not part of the redesign)

The page is a no-build React app (`<script type="text/babel">`). It pulls one ES
module at runtime: `./core.mjs` (prompts, the small review loop `runMiniHarness`, grading,
consensus, summary). Everything below is the *App
component* — state, effects, and the view it renders.

## Boot & environment

1. **Skill under test** — from `?skill=<suite>/<name>` query param, default
   `surface/wellspring`. Read once, fixed for the session.
2. **Environment detection** — `GET /api/config`: 200 ⇒ `mode="local"` (a local
   server is present); failure ⇒ `mode="claudeai"` (running as a claude.ai
   artifact, no local server). Until resolved, `mode=null` ("detecting…").
3. **Fixtures load** — `GET /api/fixtures?skill=…` → `{ skillStruct, fixtures[], profile }`.
   - `fixtures[]`: each `{ id, repo, pr?, file, fix_summary, before, after, diff }`
     — a real before→after commit.
   - `skillStruct`: `{ skillMd, references, checklist:{phases[]} }` — the `skill` arm uses
     `skillMd` (the small loop puts it in context; references/checklist are unused now).
   - `profile`: `{ domain, reviewSystem }` — the per-skill framing for prompts.
   - On failure → `err`.

## Provider configuration (two mutually-exclusive panels by `mode`)

- **local** — a provider form the user fills:
  - `flavor`: `openai` (OpenAI-compatible, e.g. DeepSeek) | `anthropic` (keyed).
  - `baseUrl` (openai only), `model`, `apiKey` (password).
  - **Persistence**: `flavor`, `baseUrl`, `model` saved to `localStorage`
    (`skilllab.flavor` / `.baseUrl` / `.model4`). **The API key is in-memory only —
    never persisted, never baked into the page.**
  - Calls go to the **local server** `POST /api/model` (server makes the provider
    call; key never leaves the machine; avoids browser CORS).
- **claudeai** — no form; just a `claudeModel` picker
  (sonnet-4-6 / haiku-4-5 / opus-4-8). Calls `POST https://api.anthropic.com/v1/messages`
  directly with **injected credentials, no key** (`callClaudeProxy`).

`providerReady` = claudeai: `!!claudeModel`; local+openai: `baseUrl && model && apiKey`;
local+anthropic: `model && apiKey`.

## The manipulated variable — "arms"

**Both arms run the IDENTICAL small loop** (`core.runMiniHarness`: a draft pass, then a
self-revision pass — 2 model calls). The ONLY difference is whether the skill's guidance is in
context, so the skill's CONTENT is the single manipulated variable and the process is held fixed.
Order `["base","skill"]`, each toggle-able (`arms{}`):
- **base** — "no skill": the small loop, nothing in context.
- **skill** — "with skill": the same loop, with `skillStruct.skillMd` in context.

`skillReady` = skill arm not selected, OR `skillStruct.skillMd` present.
If the skill arm is on but the skill text is absent → inline warning, arm unrunnable.

(The heavy gated-workflow runner `harness.mjs` is no longer wired into the bench — it conflated the
skill's content with its multi-turn structure; the mini-harness isolates content as the variable.)

## Run controls & gating

- `trials` per arm: integer 1–8 (default 4).
- `concurrency` = 12 local / **8 on claude.ai** (it rate-limits harder). Rate-limit (429/529/503)
  model calls are **retried** with exponential backoff + jitter; non-rate-limit errors fail fast.
- **Run button enabled** iff `!running && fixtures.length && configReady`, where
  `configReady = providerReady && (≥1 arm selected) && skillReady`.
- A status line echoes: env/model, and the cost preview
  `fixtures × selected-arms × trials = N trials` (+ note: each arm is a 2-pass loop ×2 for
  before+after FP, plus 2–3 consensus grader calls/trial, ≤12 at once).

## Run orchestration (`run()`)

1. Reset `results=[]`, `log=[]`, `err=""`, `running=true`.
2. Build **units** = every `fixture × selected-arm × trial`.
3. `core.mapPool(units, 12, …)` — at most 12 in flight. **Per unit, both arms are identical except
   `skillText`** (`skill` arm → `skillStruct.skillMd`; `base` arm → `null`):
   - `core.runMiniHarness({…, skillText, code: before, onEvent})` (draft → self-revise) →
     `core.gradeConsensus()`; then the **false-positive control** runs the SAME loop on the
     already-fixed `after` code → `core.gradeFalsePositive()`. Record: `{trial, foundScore, foundWhy,
     harmful, review, gradeScores, gradeEscalated, turns, falsePositive, fpWhy, cleanReview}`.
   - **Grading is CONSENSUS (both arms):** the grader is noisy (same review, temp 0, still
     wobbles ±2–3), so each review is graded **2×, averaged; if the two disagree by >2 a 3rd
     grade is taken and the median used** (`core.gradeConsensus`). The rubric is the detailed
     0–10 spec in `core.gradeReviewMessages` (anchor: maintainer's change = 6; harm/ceiling/empty
     caps in `core.scoreFromGrade`). `gradeScores`/`gradeEscalated` are surfaced per trial in the
     Why view. **Both arms carry the false-positive control** (`gradeFalsePositive`, single-grade —
     it is a boolean, not a 0–10 score), so the two arms' cry-wolf rates are directly comparable.
     Cost: each arm runs the 2-pass loop **twice** (before + after-FP) + 2–3 grader calls per trial.
     The CLI `run.mjs` path stays single-grade unless `consensus` is passed.
   - Each unit emits **log lines** via `onEvent` (`[fixtureId] arm · tN · <phase/event>`).
   - On a unit error → log `… · SKIPPED — <msg>` (the run continues).
   - After each unit, **recompute** `results` incrementally (group records by
     `fixture|arm`, summarize via `core.summarize`).
4. End: log `done.`; on fatal error → `err`. `running=false` throughout disables inputs.

## Results model & derived values

- `results[]`: `{ fixture, arm, meanFound, fpRate, n, records[] }`.
- Per-arm aggregate `aggOf(arm)` across fixtures → `{ meanFound, fpRate, n }` (null if none).
- `delta` = skill.meanFound − base.meanFound (only when both arms have data).
- `haveResults` = any arm has an aggregate.

## What the view must render (states)

1. **Header** — wordmark + the live environment tag (`this machine` / `claude.ai` /
   `detecting…`); the question (parametrized by skill name); the method blurb
   (blind grader; 0–10; **6 = the maintainer's change = the known-good anchor**, not
   the only right answer).
2. **Fixtures** (when loaded) — list of `repo`, optional `source` link, `fix_summary`, `file`.
3. **Provider** — the local form OR the claude.ai model picker (per `mode`), with the
   key-stays-local / injected-creds note.
4. **Delivery modes** — the two arm toggles (no skill / with skill) with their blurbs; the
   skill-arm-unavailable warning when relevant.
5. **Controls** — trials input + Run button (with its enable logic) + the cost/status line.
6. **Error** — `err` when set.
7. **Result** (when `haveResults`) — the headline `delta` (+points, `lo.mean → hi.mean`);
   per-arm score **on a 0–10 scale with the anchor at 6** + false-positive rate + n;
   a per-fixture breakdown when >1 fixture.
8. **Why** — per arm → per fixture → per trial record: `foundScore/10`, the consensus
   `graded X/Y` trace, the grader's `foundWhy`, the false-positive verdict; **expandable**
   to read the full `review` (and the `cleanReview` of the already-fixed code, when present).
9. **Run log** — the live (then final) line stream (last ~400 lines).
10. **Read-honestly footer** — the standing caveats: one fixture = one data point, N
    small (signal not proof); grader credits any genuinely-better rec (fairer but
    subjective); the workflow arm is a faithful *reimplementation*, not literal Claude
    Code, at ~5–13× the calls; code is not executed (measures advice, not compilation).

## Invariants the redesign must preserve

- All inputs disabled while `running`.
- The API key never persisted / never in source.
- `6` is the reference anchor on the 0–10 result scale.
- Mode-driven provider panel switch; un-met `configReady` keeps Run disabled.
- Incremental result updates as units complete (the view fills in live).

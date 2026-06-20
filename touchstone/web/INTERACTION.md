# skill-lab web UI — interaction logic (visual-agnostic spec)

What the front-end *does*, independent of how it looks. The redesign rebuilds the
visual against this; the logic, data, and states below must all be expressed.

## Engine (not part of the redesign)

The page is a no-build React app (`<script type="text/babel">`). It pulls two ES modules at runtime:
`./core.mjs` (the decomposed grader `gradeQuality`, the blind reference-overlap probe, the
false-positive grader, and `mapPool`/`summarize`) and `./harness.mjs` (the engine: `runHarness` =
skill-as-gated-workflow, `runNavReview` = skill-free baseline, both navigating an in-memory virtual
file tree). Everything below is the *App component* — state, effects, and the view it renders.

## Boot & environment

1. **Skill under test** — from `?skill=<suite>/<name>` query param, default
   `surface/wellspring`. Read once, fixed for the session.
2. **Environment detection** — `GET /api/config`: 200 ⇒ `mode="local"` (a local
   server is present); failure ⇒ `mode="claudeai"` (running as a claude.ai
   artifact, no local server). Until resolved, `mode=null` ("detecting…").
3. **Fixtures load** — `GET /api/fixtures?skill=…` → `{ skillStruct, fixtures[], profile }`.
   - `fixtures[]`: each `{ id, repo, pr?, file, fix_summary, before, after, diff }`
     — a real before→after commit.
   - `skillStruct`: `{ skillMd, references, checklist:{phases[]} }` — the `skill` arm runs the FULL
     struct: the checklist drives the gates, references are pulled on demand, `skillMd` is the system
     context. All three are load-bearing for the harness.
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

**Both arms navigate the same code** with the same tools (`ls`/`grep`/`read_file` over a virtual file
tree) and the same turn ceiling — the skill is the only manipulated variable. Order `["base","skill"]`,
each toggle-able (`arms{}`):
- **base** — "no skill" (`H.runNavReview`): the agent navigates freely and writes its review when it
  judges it has seen enough.
- **skill** — "with skill" (`H.runHarness`): the skill runs as a gated workflow — ordered stages, gates
  that must clear in order, references pulled on demand — over the same code.

`skillReady` = skill arm not selected, OR `skillStruct.skillMd && skillStruct.checklist` present.
If the skill arm is on but the struct is incomplete → inline warning, arm unrunnable.

## Run controls & gating

- `trials` per arm: integer 1–8 (default **2** — each trial is now a multi-turn agent loop).
- `withFP`: optional false-positive control (default **off**) — re-runs each arm on the fixed code,
  DOUBLING the cost.
- `concurrency` = 12 local / **8 on claude.ai** (it rate-limits harder). Rate-limit (429/529/503)
  model calls are **retried** with exponential backoff + jitter; non-rate-limit errors fail fast.
- **Run button enabled** iff `!running && fixtures.length && configReady`, where
  `configReady = providerReady && (≥1 arm selected) && skillReady`.
- A status line echoes: env/model, and the cost preview
  `fixtures × selected-arms × trials = N runs` (×2 if `withFP`) — each run a multi-turn agent loop
  (≤28 turns) + 2 grader calls, ≤concurrency at once.

## Run orchestration (`run()`)

1. Reset `results=[]`, `log=[]`, `err=""`, `running=true`.
2. Build **units** = every `fixture × selected-arm × trial`.
3. `core.mapPool(units, concurrency, …)` — at most `concurrency` in flight. Per unit, the arm picks
   the engine (`skill` → `H.runHarness` with the full `skillStruct`; `base` → `H.runNavReview`), both
   over `before` with the same tools and turn ceiling:
   - run the arm → `core.gradeQuality({code: before, review})` (NO diff) for the score, plus
     `core.gradeReferenceOverlap({diff, review})` (recorded, not scored). If `withFP`, re-run the SAME
     arm on the fixed `after` code → `core.gradeFalsePositive()`. Record: `{trial, foundScore, foundWhy,
     harmful, review, judgments, overlap, turns, navCalls, gatesCleared, refsOpened, complete,
     falsePositive?, fpWhy?, cleanReview?}`.
   - **Grading is DECOMPOSED, single-grade (both arms):** `gradeQuality` asks the grader a few factual
     yes/no questions (`grounded`/`real`/`multiple`/`concrete`/`depth`/`harmful`) and
     `core.scoreFromQuality` composes the 0–10 score **in code** — far lower variance than the old
     holistic band-pick, and the grader never sees the diff. The per-trial judgments + `turns/nav/
     gates/refs` + `ref-overlap` are surfaced in the Why view. **Both arms carry the optional
     false-positive control** (`gradeFalsePositive`, a boolean), so cry-wolf rates are comparable.
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
   (blind grader; 0–10; scored on the review's own merits — the grader sees neither the skill nor
   the maintainer's diff).
2. **Fixtures** (when loaded) — list of `repo`, optional `source` link, `fix_summary`, `file`.
3. **Provider** — the local form OR the claude.ai model picker (per `mode`), with the
   key-stays-local / injected-creds note.
4. **Delivery modes** — the two arm toggles (no skill / with skill) with their blurbs; the
   skill-arm-unavailable warning when relevant.
5. **Controls** — trials input + Run button (with its enable logic) + the cost/status line.
6. **Error** — `err` when set.
7. **Result** (when `haveResults`) — the headline `delta` (+points, `lo.mean → hi.mean`);
   per-arm score on a **0–10 scale** + false-positive rate (when `withFP`) + n;
   a per-fixture breakdown when >1 fixture.
8. **Why** — per arm → per fixture → per trial record: `foundScore/10`, the decomposed `judgments`
   (`g=… r=… m=…`), the run's `turns/nav/gates/refs`, `ref-overlap`, the grader's `foundWhy`, the
   false-positive verdict; **expandable** to read the full `review` (and `cleanReview`, when present).
9. **Run log** — the live (then final) line stream (last ~400 lines).
10. **Read-honestly footer** — the standing caveats: one fixture = one data point, N small (signal
    not proof); grader scores each review blind on its own merits (fairer but subjective); both arms
    are a faithful *reimplementation* of an agent reviewing by navigating code, the skill arm adding
    the gated workflow — not literal Claude Code; code is not executed (measures advice, not compilation).

## Invariants the redesign must preserve

- All inputs disabled while `running`.
- The API key never persisted / never in source.
- The quality grader never sees the diff or the skill (blind, decomposed, composed-in-code score).
- Mode-driven provider panel switch; un-met `configReady` keeps Run disabled.
- Incremental result updates as units complete (the view fills in live).

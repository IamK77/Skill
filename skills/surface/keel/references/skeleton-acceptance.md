# Skeleton Acceptance — the slice, the nine points, and the README-alone gate

This reference is the depth behind two stages of the [../SKILL.md](../SKILL.md) flight plan: **STAGE 1 — Slice** (the check `vertical-slice-pierces-the-stack`) and **STAGE 3 — Floor** (the check `walking-skeleton-accepted`). It owns three things and only three: **the canonical real-but-trivial slice**, the **nine-point acceptance gate**, and the **README-alone reproducibility gate** that is the ninth point and the master one. The catalogue of *which seams exist* is [seam-checklist.md](seam-checklist.md)'s; making the *contract undriftable* is [contracts-that-cant-drift.md](contracts-that-cant-drift.md)'s; the *why* — the medium and trust-boundary axes that make a seam the thinnest point of the membrane — is [the-membrane.md](the-membrane.md)'s. This file is the *acceptance instrument*: how you choose the one slice, and how you prove it is genuinely done rather than green-on-mocks done.

The governing fact below is **inherited from [the-membrane.md](the-membrane.md)'s PRE-FLIGHT line, not minted here** — it is restated verbatim-in-spirit because every call in this file is judged against it, and an inherited rule should be visibly inherited rather than read as a fresh claim:

> **Real, but trivial. Build deep through every seam first, not wide across static pages — and gate it, because a project dies at the seams, not in any one component, and "looks 90% done" on mocks almost always means 100% of the integration risk is still live, parked at the deadline.** *(the-membrane.md, PRE-FLIGHT)*

## Contents

- [The slice — one sentence, the whole stack](#the-slice--one-sentence-the-whole-stack)
- [Choosing your slice — the leak test and a worked derivation](#choosing-your-slice--the-leak-test-and-a-worked-derivation)
- [The nine-point acceptance gate](#the-nine-point-acceptance-gate)
- [Number nine — the README-alone reproducibility gate](#number-nine--the-readme-alone-reproducibility-gate)
- [The novice-vs-master trap — fake completeness](#the-novice-vs-master-trap--fake-completeness)
- [Where findings route](#where-findings-route)

---

## The slice — one sentence, the whole stack

A walking skeleton is not a small feature. It is the **thinnest feature that is nonetheless structurally complete** — describable in one sentence, yet passing through every real seam the architecture has. The two properties are in tension on purpose: thin enough that it has *zero product value*, complete enough that *every bone is present*. Looks empty; skeleton's all there.

The canonical slice, the one to reach for by default:

> **"A logged-in user sees their own name fetched from the server, can edit it, and the change persists and re-renders."**

One sentence. Trace what it crosses:

| The clause | The seam it pierces | What would leak if it were faked |
|---|---|---|
| *a logged-in user* | **auth** — login → session → credentialed request → server-side validation | the most underrated seam; an auth edge case found at the deadline is a launch slip |
| *sees their own name fetched from the server* | **data / network** — one real call to a real-or-stub backend, typed by the contract | a contract mismatch; a hand-copied type already gone stale |
| *can edit it … persists and re-renders* | **state round-trip** — fetch → cache → mutate → invalidate → re-render | a view re-rendered from a hand-synced local copy, not from cache — the bug that detonates wide later |
| *sees … re-renders* | **render / hydration** — server-render → hydrate → interactive, no mismatch | the classic ship-day killer: perfect on localhost, mismatched on the real server-rendered round-trip |
| *(once you deploy it)* | **deploy + config/secrets** — commit → CI → preview env mirroring prod | "works on my machine"; an env/secret that is a different shape in prod |

That single line gives **every** seam at least one chance to leak, on day one, while the cost to patch a leak is near zero. It has no product value to show a stakeholder — and that is the point. You are not building a feature; you are *proving the pipeline*.

---

## Choosing your slice — the leak test and a worked derivation

You will not always be handed the name-edit feature; your architecture may have seams the canonical slice misses (a websocket, a file upload, a third-party redirect). The slice is *correct* when it passes one test:

> **Does this slice give *every* enumerated seam at least one chance to leak — on a real deploy, on day one?** A slice that never touches auth, or never hits a real deploy, does not count.

This is the same shape as the membrane's governing question, narrowed to the one feature. Run it as a coverage check against the seam list from [seam-checklist.md](seam-checklist.md): line up the seams you enumerated, and for each, name the clause of your slice that pierces it. A seam with no clause is a seam you have *chosen to first cross at the deadline.*

**Worked derivation — a filtered list.** Suppose someone proposes the skeleton be "a page that shows a filtered, paginated list of orders." Run the leak test against it:

| Seam | Does the proposed slice pierce it? |
|---|---|
| build/dev, data, render | yes — it fetches and renders |
| **auth** | **no** — a public list never logs anyone in |
| **state round-trip (mutate → invalidate)** | **no** — a read-only list never mutates, so cache invalidation is never exercised |
| deploy, config | only if you actually deploy it |

It fails the test on two of the most dangerous seams. The fix is not to *abandon* the list but to **thin it until it pierces the gaps, or pick the slice that does.** "A logged-in user edits their own name" is the minimal feature that lights up auth *and* the full mutate-invalidate round-trip in one sentence — which is exactly why it is canonical. The filtered list, if you want it, is wide work for STAGE 3 (`wellspring` and beyond), *after* the vertical path is proven; it is not the keel.

The lesson generalizes: **a slice's value is measured in seams pierced, not in lines of UI.** When two candidate slices both look trivial, prefer the one that pierces *more* real seams per sentence.

**PREDICATE:** the slice as written leaves one real seam (say, the render/hydration seam under SSR) untouched.
**DEFAULT:** widen the slice by the smallest clause that pierces it (e.g. make the name render server-side, then hydrate to interactive), rather than adding a second feature — one sentence, more bones, still trivial.
**FALLBACK:** if no single trivial slice can reach a genuinely exotic seam, add a *second* throwaway slice dedicated to that seam alone, and record why — but suspect first that you are over-counting a seam your architecture does not really have.

---

## The nine-point acceptance gate

The skeleton is **done — `walking-skeleton-accepted` clears — if and only if all nine hold.** Not eight. The nine are not a wishlist; each is one seam proven across, expressed as a condition you can check rather than a feeling you can have. Translated faithfully from the authoritative checklist:

| # | The condition | What it proves | The fake that passes a weaker check |
|---|---|---|---|
| 1 | A real (even trivial) feature runs **user action → server → back to the screen**, on a **deploy environment, not localhost** | the whole pipeline connects end to end where it will actually run | a localhost demo — proves nothing about prod |
| 2 | It passed through real **auth** (if the system has any) | the most underrated seam was crossed while it was free | an unauthenticated page that "we'll gate later" |
| 3 | Data comes from a real API **typed by the generated contract** — a server field change **fails the client build** | the contract is genuine, not a hand-copied snapshot | a hand-written type that compiles green while the API has moved on |
| 4 | Every PR triggers **CI** (typecheck + lint + test + build); **red blocks merge** | the quality floor is automated, not disciplinary | a CI that runs but is advisory, or none at all |
| 5 | Every PR gets a clickable **preview deploy** | perceptual changes are visible immediately; the deploy seam is exercised every PR | "we deploy from one person's laptop" |
| 6 | Errors from the **deployed app** land in **error tracking** | a leaked seam becomes *visible* instead of silent | console logs no one watches; tracking "to be added" |
| 7 | Preview/staging **config** (env, secrets) **mirrors prod** | the medium's worst leaks — the local-vs-prod config differences — are caught now | a preview with a dev database and dev secrets |
| 8 | **Rollback** works: a deploy can be reverted in **minutes** | the escape hatch exists before you need it under fire | "we'll figure out rollback if something breaks" |
| 9 | Another engineer, on the **README alone**, can clone → install → run → deploy — **no tribal knowledge** | the build does not live in one person's head (bus factor > 1) | a setup only its author can reproduce |

A few of these earn no green on their own and are therefore exactly the ones the agent defers — CI (4), preview (5), error tracking (6), config parity (7), rollback (8). **They are part of the skeleton, not a later chore.** A "feature works" demo that skips them has proved the cheap half and left the death-zone half for the deadline. Walk all nine explicitly; do not let a green slice stand in for the gate.

**PREDICATE:** one point cannot be cleanly proven yet — say rollback (8) can't be exercised because there is no second deploy to revert to.
**DEFAULT:** treat the point as *failed*, not waived — the gate is all-nine-or-not-done, and a point you can't prove is a point you haven't proven; do the smallest thing that lets you prove it (push a trivial second deploy, then revert it) rather than marking it green on faith.
**FALLBACK:** if proving it genuinely depends on infrastructure that does not exist this week, record the point as an open risk with an owner and a date — never silently as passed — and do not let the FINAL GATE clear until it is closed.

> **Each point is a means, not an end** *(synthesis — generalizing the source's two explicit "executable" tests, not a claim it states for all nine)*. The source makes the point sharply for two of them and this file extrapolates the rest from that shape: point 3 is "可执行的验收测试是:在服务端改掉一个字段,客户端应当编译失败" — not "we have a codegen step" but "a server field change *fails the client build*", so run the change and watch it fail, or the point is unproven; point 9 is "大师级的验收闸…证明这套搭建不活在某一个人的脑子里" — not "there is a README" but "a *different* engineer got to a deploy with no one in the room." Read the remaining seven the same way: the gate checks the *property*, never the *artifact that usually carries it.*

---

## Number nine — the README-alone reproducibility gate

Point nine is the **master gate**, and it deserves its own treatment because it is the one the whole suite holds everywhere and the one most quietly failed.

> **A second engineer, using the README and nothing else — no Slack thread, no "oh you also have to set X," no asking the author — can clone the repo, install, run it locally, and deploy it.**

Why this is the master point: the other eight can all be green while the build still has a **single point of failure made of a human.** The pipeline runs, CI is green, the preview deploys — but only because one person knows the undocumented env var, the local proxy, the manual migration step. That knowledge is the most fragile dependency in the project, and it is invisible to every other check. Point nine is the only one that surfaces it, by *removing the author from the room.*

How to actually run it (it is a test, not a claim):

1. **Hand the README to someone who has never run the project** — a teammate, or a fresh agent session with no prior context, which is the harsh and honest version. Stricter still: a fresh clone in a clean container.
2. **Watch where they get stuck.** Every stumble — a missing step, an assumed tool, a secret not mentioned — is a finding. The README is wrong, not the reader.
3. **Fix the README, not the reader.** Resist the urge to "just tell them the one thing." The one thing you would tell them is precisely the tribal knowledge the gate exists to evict.
4. **Pass = they reached a deploy with zero questions to the author.** Anything less is a fail; the bus factor is still one.

**PREDICATE:** the reader stalls, and you can't tell whether it's a README gap or just their unfamiliarity with the stack.
**DEFAULT:** count it as a finding against the README — the gate measures whether the *document* suffices, so any stall the document could have prevented is the document's fault; fix the README, not the reader.
**FALLBACK:** if the stall is genuinely about the reader's own environment (a missing OS-level tool the README can't assume), note it as an explicit prerequisite in the README rather than dismissing it — the prerequisite list is part of what "no tribal knowledge" means.

Pass it and STAGE 3 is **genuinely over** — the build is reproducible and the integration risk has been paid down at the cheapest possible moment. Fail it and you do not have a walking skeleton; you have a demo that one person can keep alive.

(This is the same reproducibility bar `flightline` — the engineering suite's process-floor skill (version control, review, CI/CD, dependencies) — holds for the general engineering floor; see [Where findings route](#where-findings-route). `keel` owns the *frontend-specific* form of it: that the deploy, the contract codegen, and the preview pipeline are reproducible from the README, not just the test runner.)

---

## The novice-vs-master trap — fake completeness

The single largest trap in this whole stage, stated in one line:

> **Completeness measured on mock data is a lie about how much risk remains.**

The two life-cycles, side by side:

| | **Novice** | **Master** |
|---|---|---|
| First days | builds every page's static UI against mock data — home, list, detail — "looks 90% done!" | ships one trivial feature that crosses *all* seams, deployed, CI-green, days 1–3 |
| What's deferred | real data, real auth, real deploy — the death-zone seams, pushed to the end | nothing real is deferred; the pipeline is proven before any width is added |
| The last 20% | becomes a **cliff** — hydration mismatch, auth edge cases, env/config differences all detonate together at the deadline | is just more width along a vertical path *already proven to hold* |
| The app looks | impressively full, dangerously hollow | empty, but every bone present |

The mechanism of the lie: building wide on mocks turns green *fast* and *feels* like progress, but it advances only on the half of the work that was never risky. The integration risk — the seams — is untouched, and now scheduled for the moment you have the least time and the most code piled on top. "Looks 90% done" is the most expensive sentence in the build, because it is measured against the wrong denominator. The master inverts the order: pay the integration risk first, when a leak costs an hour; then *width is cheap*, because it repeats a path that already works. This is exactly why acceptance here is **gated, not trusted**: the nine points are written as checkable properties precisely so a green-on-mocks "done" cannot pass — the *why* of that gating, and the agent-era reasons the cliff is no longer felt, are [the-membrane.md](the-membrane.md)'s, not this file's.

A subtler face of the same trap is the **stub that fakes the wrong thing.** A stub *implementation* is fine — a thin backend returning canned data while the real one is built. A stub *contract* is not: a mock whose *shape* disagrees with reality is the most dangerous artifact in the build, because it is green in test and broken in prod. The discipline — back every mock with the generated schema so it *cannot* drift — is [contracts-that-cant-drift.md](contracts-that-cant-drift.md)'s; here it is named because it is the form fake-completeness takes inside the data seam. (The same rule echoes into testing: mock at the network boundary, backed by the real schema, never at the module boundary — that is `assay`'s concern, the descendant of this one.)

---

## Where findings route

This doc is the acceptance instrument; the fixes it surfaces live in its siblings and in the engineering suite.

**Cross-links:**

- [../SKILL.md](../SKILL.md) — the four-stage flight plan; this file backs STAGE 1 (`vertical-slice-pierces-the-stack`) and STAGE 3 (`walking-skeleton-accepted`).
- [the-membrane.md](the-membrane.md) — the *why*: the medium and network/trust axes that make a seam the thinnest point of the membrane, and the decision ladder for "is this seam real / is a stub acceptable." Read at the start, re-read at every gate.
- [seam-checklist.md](seam-checklist.md) — the catalogue of seams the slice's leak test is run against, and how to find the ones your architecture adds. Owns *which seams exist*; this file owns *the slice that pierces them and the gate that accepts it.*
- [contracts-that-cant-drift.md](contracts-that-cant-drift.md) — the generation pipeline, the field-change → compile-fail test (acceptance point 3), and the stub-impl-OK-stub-contract-NOT / schema-backed-mock rule that defeats the fake-completeness-via-mock face of the trap above.
- **`flightline`** (engineering suite) — owns the *general* reproducibility-and-CI floor (version control, review, CI/CD, dependencies). Point 9's README-alone bar is the frontend specialization of `flightline`'s reproducibility instinct; the contract-codegen and preview-deploy pipeline are what `keel` adds on top.
- **`wellspring`** (next `surface` skill) — inherits the one server-state round-trip the slice proved (fetch → cache → mutate → invalidate → re-render) and generalizes that single path into the whole state classification. The slice hands it a working spine.
- **`assay`** (engineering suite) — inherits the mock discipline named here (mock at the network boundary, backed by the real schema) as its own testing rule; route the test-strategy implementation there.

And when in doubt about whether the skeleton is genuinely done, fall back to the one question the whole stage is a special case of: **did this slice give every real seam at least one chance to leak, on a real deploy, on day one — and could a stranger reproduce it from the README alone?** If either answer is no, it is not accepted, whatever the demo looks like.

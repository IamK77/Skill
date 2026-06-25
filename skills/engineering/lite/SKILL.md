---
name: lite
description: >
  The whole engineering lifecycle distilled into one lean, gated, six-stage flow
  for SMALL projects — frame, shape, build, prove, harden, ship — so a script,
  CLI, prototype, or internal tool gets every discipline (real scope, a sound
  design, validated boundaries, tests that can actually fail, a security floor, a
  repeatable ship) without paying for six heavyweight skills and their reference
  libraries. The one shift: match ceremony to stakes — a small project still
  needs every discipline, just one light pass of each, not the full flight. Use
  when the user wants to build something small end-to-end ("write me a script /
  CLI / small tool / prototype", "build a quick app"), asks for the lightweight
  or token-cheap engineering path, or when pilot judges the full suite overkill.
  Escalate any one stage to its full skill the moment it turns high-stakes. Not
  for one-line fixes (just do it) or large/critical systems (use the full suite).
argument-hint: "[small thing to build]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# lite

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The full engineering suite is six gated skills and a shelf of reference libraries — the right weight for a system people depend on, and far too much for a script, a CLI, an internal tool, or a prototype. But "small" is not "skip the engineering": small projects fail for the same boring reasons large ones do — built the wrong thing, no real tests, a secret in the repo, no way to ship it twice. This skill keeps **every** discipline and spends **one light pass** on each, across six stages it will not fly past until each **GATE** is cleared.

**The one shift — match ceremony to stakes, never drop the discipline.** Each stage below is the 20% of its full skill that catches 80% of the failures. When a stage turns out to carry real risk — money moves through it, untrusted users reach it, an outage is expensive, the data is sensitive — **stop and escalate that one stage** to its full skill, then come back. Lite is a floor, not a ceiling.

**Discipline:** the gates are machine-enforced. Finish each GATE before opening the next stage — never skip ahead, batch the checks, or self-certify a stage you did not do. The external `checklist` CLI is the sole authority that a gate cleared; commands address stages by **name**. One check is a real **sensor**: the test gate runs your actual suite and will not clear on a green you only claimed.

**No human in the loop?** If you are building from a written spec with no user to confirm, the invariant still binds: do not guess silently on anything expensive to get wrong — park it as a named open question with its blast-radius, and point the Frame stage's confirmation at the best written authority you have.

If `$ARGUMENTS` names something to build, build that. If it is a one-line fix or rename, this skill is overkill — say so and just do it. If it is a large, critical, or multi-team system, say so and use the full suite instead.

---

## STAGE 0 — Frame (build the right thing)

Do not open an editor yet. Pin down, in a few lines:

- **The real need**, not the literal ask. "Add an export button" is a solution; the need is "I hand my boss a report every month." Build to the need.
- **2–5 Must-haves**, each with a one-line **done-test** — how you will know it works ("running `tool x` on a sample file prints the totals"). A requirement you cannot test is still too fuzzy.
- **What's out of scope**, written down. The single best brake on a small project quietly becoming a large one.

Confirm this back with the user (or, design-only, against the written spec) before building. Catching a misunderstanding here is the cheapest fix you will ever make. *(Depth: `groundwork`.)*

### GATE — clear before SHAPE
1. `checklist check frame need-and-scope`
2. `checklist verify frame`

---

## STAGE 1 — Shape (the smallest design that holds)

Decide the shape before you pour code into it:

- **Structure & stack** — the simplest layout that fits (one module or a handful; the language/runtime already in play). Resist frameworks the size of the problem.
- **Boundaries & contracts** — name the few seams (the CLI surface, the one API call, the file format, the DB table) and what crosses each: the inputs, the outputs, the error shape.
- **Data model** — the core entities and their fields. Most small-project pain is a data model that didn't fit.
- **The expensive-to-reverse calls** — flag the one or two decisions that are costly to undo (the storage format, a public interface, an external dependency) and spend a moment's thought there; everything else can change later, cheaply.

Keep names honest and functions single-purpose from the first line — it is cheaper than refactoring later. *(Depth: `load-bearing`, `plumb`.)*

### GATE — clear before BUILD
1. `checklist check shape design-decided`
2. `checklist verify shape`

---

## STAGE 2 — Build (write it so it can be trusted)

Implement the Must-haves — and nothing outside scope. As you write:

- **Small, honest functions.** One job each; a name that says what it does. No function you have to scroll to read.
- **Strict at the boundaries.** Validate and type every untrusted input where it enters (CLI args, request bodies, file contents, env). Garbage in must be rejected at the door, not propagated.
- **Fail loud and legible.** An error says what failed and what to do, with context — never a swallowed exception or a bare `except: pass`. The next reader is you in a month.
- **No obvious smells, no secrets in code.** Skip the copy-paste duplication, the dead code, the 200-line function; keep keys and config out of the source (env / config file, git-ignored).

*(Depth: `plumb` for code craft, `gauge` for types-and-failures.)*

### GATE — clear before PROVE
1. `checklist check build built-clean`
2. `checklist verify build`

---

## STAGE 3 — Prove (a green you can believe)

A suite that cannot go red proves nothing. For a small project you do not need exhaustive coverage — you need tests on the **parts that would actually hurt**:

- **Test the risky bits** — the core logic, the boundaries, the error paths — each with a real **oracle** (assert the *correct* answer from a spec or a hand-worked example, not just whatever the code happens to return today).
- **Prove the teeth.** At least once, make a test go **red** on purpose — break the code or the assertion and watch it fail — so you know the green means something.
- **Run the whole suite green.** This is a **sensor**, not a checkbox: supply your test command and the gate runs it.

*(Depth: `assay` — for state-mutating code, idempotency/second-call tests, mutation testing.)*

### GATE — clear before HARDEN
1. `checklist check prove tests-meaningful`
2. `TEST_CMD="<your full test command>" checklist verify prove` — runs `${TEST_CMD}` in the project; the gate clears only if the suite actually exits 0. (`tests-green` is mechanical — `checklist check prove tests-green` is rejected; let `verify` run it. If red, fix the code or the tests, do not route around it.)

---

## STAGE 4 — Harden (the security floor)

Not a full threat model — the floor no project may ship below. Walk it once:

- **Authn / authz** — every entry point that should be restricted actually checks who's calling and what they may do. The most common real breach is a missing check, not a clever exploit.
- **Untrusted input** — validated, and **encoded on the way out** (SQL parameterized, HTML/shell escaped). Injection and XSS are still the top of the list.
- **Least privilege** — tokens, DB users, file permissions scoped to what's needed, no more.
- **Secrets & dependencies** — nothing sensitive in the repo or logs; known-vulnerable deps updated (`npm audit` / `pip-audit` / equivalent).

*(Depth: `aegis` for a real threat model, `gungnir` for adversarial testing — escalate the moment money, PII, or untrusted users are in play.)*

### GATE — clear before SHIP
1. `checklist check harden security-floor`
2. `checklist verify harden`

---

## STAGE 5 — Ship (make it repeatable)

A thing that runs on your machine once is not shipped. Close the loop:

- **Version control hygiene** — committed in small, message-bearing commits; secrets git-ignored; a README line on how to run it.
- **CI runs the tests** — even one workflow that runs the Prove suite on push, so a regression is caught by a machine, not a user.
- **Repeatable deploy + rollback** — one documented command to ship it and one to undo (even "re-run the script" / "revert and redeploy"). If you can't ship it twice, you can't ship it.
- **Minimal operability** — enough logging/health to tell whether it's working, and a written line of the **deferred debt and residual risk** so the next person (or you) inherits the map.

*(Depth: `flightline` for process/CI, `stationkeeping` for real ops/observability, `husbandry` for evolution & debt.)*

### FINAL GATE
1. `checklist check ship shippable`
2. `checklist verify ship`
3. `checklist show` — confirm all six stages passed.
4. `checklist done` — clear this run's state.

---

## Anti-patterns (pre-flight checklist)

- **"It's small, skip the engineering"** — small projects fail for the same boring reasons; lite is the cheap floor that stops them, not a license to wing it.
- **Lite for a big problem** — if it's critical, multi-team, or high-blast-radius, lite's one-light-pass is too thin. Use the full suite.
- **Building the literal ask** — the export button, not the report the user actually needs. Frame exists to stop this.
- **Tests with no teeth** — assertions that pass on broken code, or a green nobody proved can go red. The Prove sensor + the deliberate-red are the guard.
- **Scope creep** — the out-of-scope list is the brake; "while I'm here…" is how a weekend project eats a month.
- **Secrets in the repo / no deploy story** — the two ship-day failures that are pure unforced error.
- **Skipping a GATE** — the discipline is the point; a skipped gate is a skipped pass, and that's the one that bites.

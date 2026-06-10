---
name: pilot
description: >
  Navigate the engineering skill suite: given a task, route to the right
  skill(s) in the right order — or say plainly when no skill is warranted.
  The dispatcher / front door for the ten engineering skills (groundwork,
  load-bearing, gauge, assay, flightline, stationkeeping, husbandry, plumb,
  aegis, gungnir). Use when you don't know which skill fits, suspect several
  apply in sequence, want a plan for a piece of engineering work, or aren't
  sure a skill is needed at all. Triggers on "which skill should I use",
  "where do I start", "what's the right process for X", "help me plan this
  engineering work", "is there a skill for this", "I don't know which one",
  "route this for me".
argument-hint: "[the task, goal, or confusion you want routed]"
allowed-tools: Read Bash Skill(engineering:*)
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# pilot

The engineering suite is ten skills, and the cost of having ten is that the person in front of them has to know *which* one — and, more often, that the real job needs *several, in order*, or **none at all**. `pilot` is the front door: it takes a task, a goal, or just a confusion, and returns a **routing verdict** — run this one, run these in this order, or *don't reach for a skill, here's why*. It is a dispatcher, not a methodology, so it has **no GATEs**; its whole value is the call it makes in the next paragraph of your conversation, not a flight plan it walks you through.

**Earn your keep above the harness, or stay quiet.** The harness already routes a *single* clearly-named task to its skill on the trigger description alone. So `pilot` exists for the four things that matching can't do:

1. **Sequence** — one ask ("build me X", "make this production-ready") is really *several* skills in order; name the chain and the hand-offs.
2. **Redirect** — the user asks for skill X but the real need is Y first ("review my code" when there are no tests yet → the gap is `assay`/`gauge`, not review). This is the highest-value routing and the one a trigger match never does.
3. **Refuse** — the honest "no skill for this" (below). A router that always finds a skill to sell is worse than none.
4. **Disambiguate** — the confusable pairs (`plumb` vs `gauge`, `assay` vs `gauge`, `flightline` vs `husbandry`, `aegis` vs `gungnir`) where the wrong pick wastes a whole flight plan.

**Scope: the ten engineering skills only.** Distributed-systems correctness is the separate `distributed` suite (`holdfast`) — point there, don't route into it. Anything that isn't software engineering (a factual lookup, prose, a one-off shell command) is out of scope: say so and stop.

---

## STEP 0 — Prerequisite: is `checklist` installed?

Every engineering skill except this one opens with `checklist init` and is **gated by the `checklist` CLI**. If you route someone into `flightline` and the CLI isn't there, the gates silently don't run and the skill degrades to prose. So before handing off into any gated skill, check once:

```bash
command -v checklist
```

- **Found** → proceed; route normally.
- **Not found** → tell the user the engineering skills won't enforce their gates without it, and recommend installing it before continuing:
  ```bash
  npm i -g @iamk77/skill-checklist
  ```
  Routing *advice* still works without the CLI (you can recommend a skill and a sequence); only the in-skill GATE enforcement needs it. Don't block on it — recommend, note the degradation, and let the user decide.

`pilot` itself runs no gates and needs no `checklist`.

---

## The map — the suite in one screen

Two axes. The **lifecycle spine** is a rough order of operations; the **cross-cutting lenses** fire on existing code at any point.

**Lifecycle spine — roughly in order:**

| When | Skill | Owns the question |
|---|---|---|
| Before any code | **groundwork** | *What* are we actually building? (real need, requirements, acceptance) |
| Before any code | **load-bearing** | *How is it structured?* (architecture, boundaries, contracts, data model — the irreversible decisions) |
| As you build | **gauge** | Does the code emit *clear, un-fakeable feedback*? (strict types, boundary validation, errors-as-values) |
| As you build | **assay** | *What and how to test* (the right test type, doubles, the cases that catch bugs) |
| Around the repo | **flightline** | The *process floor* (version control, style, code review, CI/CD, dependencies) |
| Shipping & running | **stationkeeping** | *Get it to prod and keep it serving* (deploy/release, observability, SLOs, incident, capacity, DR) |
| After it's live | **husbandry** | *Keep it cheap to change* (tech debt, safe refactoring, defects, versioning, legacy, retirement) |

**Cross-cutting lenses — any time, on existing code:**

| Lens | Skill | Owns the question |
|---|---|---|
| Craft / legibility | **plumb** | *Is this good code?* (naming, function shape, smells, earned abstraction, over-engineering) |
| Feedback signal | **gauge** | (also a lens) *Can the agent trust the green?* |
| Security — shield | **aegis** | *Build it secure* (threat model, secure design, secrets, OWASP, gate SAST/DAST) |
| Security — spear | **gungnir** | *Attack it to prove the defenses hold* (authorized pentest; build-vs-prove pair with aegis) |

---

## The triage procedure

1. **Read the task for its real shape**, not its words. "Clean this up", "make it faster", "review this", "build me X" are all under-specified — find what is actually being asked.
2. **Ask at most one or two clarifying questions — and only if the route genuinely depends on the answer.** If you can route without asking, route. (Don't interrogate; that's the over-ceremony the suite warns against.)
3. **Run STEP 0** (checklist) if you're about to send them into a gated skill.
4. **Classify** on the two axes (lifecycle phase? cross-cutting concern?) and against the **refusal test** below.
5. **Return a verdict**, one of:
   - **No skill** — and why (refusal rules below).
   - **One skill** — name it, one line on why, the exact invocation.
   - **A sequence** — the chain in order, with the hand-off reason at each step ("groundwork to pin the requirement → load-bearing because it changes the data model → assay for the new behavior").
6. **Hand off** (below) — invoke the first skill, or give the user the command.

See **[references/suite-map.md](references/suite-map.md)** for the full per-skill role, the confusable-pair disambiguation in depth, and ready-made sequences for common task shapes ("ship a new feature", "inherited a messy repo", "make this production-ready", "is this safe to launch").

---

## The router — what they say → where it goes

A starting map; the depth and the edge cases are in [references/suite-map.md](references/suite-map.md).

| The user says… | Route to |
|---|---|
| "add a feature / build X / what should this do" (vague goal) | **groundwork** first (pin the need), then the chain |
| "design the architecture / monolith or microservices / data model / API" | **load-bearing** |
| "what stack / which database / which framework" | **load-bearing** (tech selection) |
| "set up CI / branching / code review process / pre-commit / reproducible builds" | **flightline** |
| "is this clean / readable / well-named / over-engineered / too clever" | **plumb** |
| "the agent keeps guessing / make failures legible / strict typing / Rust-like hand-feel" | **gauge** |
| "what should I test / write tests / mocks / flaky tests / I just fixed a bug" | **assay** |
| "deploy / release strategy / monitoring / SLOs / on-call / our alerts are noisy / capacity / DR" | **stationkeeping** |
| "tech debt / should we rewrite / refactor safely / triage bugs / bump a major version / EOL / legacy" | **husbandry** |
| "make it secure / threat model / auth / secrets / injection / OWASP" | **aegis** |
| "pentest / attack my app / validate a fix closed the hole / pre-launch security attack" | **gungnir** |
| "is this distributed design correct / retries / idempotency / consensus / sharding / ordering" | **out of scope → `distributed` suite (holdfast)** |

---

## Refusal rules — saying "no skill" is first-class

Per the suite's own ethic (*means, not an end*), the right answer is sometimes that no skill should come out. Refuse, plainly and with the reason, when:

- **It's trivial or throwaway.** A one-liner, a rename, a script you'll run once — just do it inline; a gated flight plan is pure ceremony.
- **It isn't engineering.** A factual question, prose, a single shell command, a "what does this error mean" — out of scope; answer directly or say where it belongs.
- **A skill is already mid-flight.** If the user is *inside* a skill's work, don't bounce them to another for a sub-question; answer in place.
- **The ask names a skill but the need is elsewhere.** Redirect honestly: "you asked for a review, but there are no tests for the changed behavior — the real gap is `assay`/`gauge` first." This is the most valuable thing `pilot` does; do it even when it contradicts the request.
- **The work is too small for the skill it nominally matches.** A two-file change doesn't need the full `load-bearing` flight plan — name the one decision that matters and skip the ceremony.

The test, before you route anyone anywhere: *would a competent engineer reach for a multi-stage skill here, or just do the thing?* If the latter, say so.

---

## Hand-off — invoke, or hand the user the command

Once the verdict is a skill (or a chain), hand off:

- **Auto-invoke (best effort):** invoke the first skill via the `Skill` tool (e.g. `engineering:groundwork`). Skill-to-skill invocation is permitted but not formally documented, so treat it as best-effort.
- **If auto-invoke isn't available or fails:** give the user the exact command to run themselves — `/engineering:groundwork <the framed task>` — plus the rest of the chain as a short numbered list they can walk. The routing is the value; the click is theirs if the harness won't make it.
- **For a sequence,** hand off only the *first* step, and state the next ones as "after that, `assay` for the new behavior, then `flightline` if review/CI isn't set up." Don't try to drive the whole chain from here; each skill owns its own flight and hands back.

> The names above use the `engineering:` plugin prefix (how the suite installs). If the skills are loaded un-prefixed in the current workspace, drop the prefix — the harness resolves the bare name.

---

## Anti-patterns (for pilot itself)

- **Always finding a skill to sell** — the refusal cases are half the job; a router that never says "no" is noise.
- **Interrogating before routing** — ask only what the route depends on; otherwise route and move.
- **Routing into a gated skill without the `checklist` check** — the gates silently no-op and the user thinks they're protected.
- **Re-litigating a skill's own content** — `pilot` says *which* and *in what order*, never *how*; the chosen skill owns the how.
- **Driving the whole chain from the cockpit** — hand off the first step and let each skill fly its own; don't puppet the sequence.
- **Routing a distributed-correctness problem into engineering** — that's the `distributed` suite (`holdfast`); point, don't absorb.

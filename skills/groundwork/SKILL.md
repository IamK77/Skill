---
name: groundwork
description: >
  Discover and pin down what to build before building it, with a gated five-stage
  flow: elicit the real need (not the stated solution), analyze and prioritize,
  write verifiable requirements, validate shared understanding, and manage change.
  Use when the user asks for a feature, system, or change — especially a vague or
  solution-shaped one ("add an export button", "make it faster", "build me an X");
  mentions requirements, specs, user stories, acceptance criteria, scope,
  stakeholders, MoSCoW, or non-functional needs; or before you start coding
  anything non-trivial whose real goal is not yet nailed down.
argument-hint: "[feature / system / change to scope]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# groundwork

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Building the wrong thing well is the most expensive mistake in software, and an agent's strongest instinct — implement the literal ask — walks straight into it. This skill is the discipline that runs *before* code: discover the real need, the people it touches, the unspoken constraints, and the explicit edges of scope. Requirements work is a collaboration — you supply systematic rigor, the user supplies domain truth and the stakes.

This skill walks an explicit five-stage flight plan and will not fly past a **GATE** until it is cleared.

**Discipline:** finish every GATE before entering the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not actually done. The `checklist` tool enforces the order; let it. Commands address stages by **name**, so you never have to track a number.

**The agent's special handicap:** you cannot walk the floor, run a workshop, or interview the silent stakeholder. So you must enlist **the user as proxy** for everyone the requirement touches, and you must read what *can* be read — the existing code, docs, tickets, competitors. Read [references/agent-blind-spots.md](references/agent-blind-spots.md) first; it names the failure modes this skill exists to stop.

**Speak the user's language, or the proxy breaks.** The user can only stand in for the stakeholders if they actually follow you. Read their domain fluency from how they talk in STAGE 0, and match it — when a technical term or acronym first appears (`SSRF`, `BYOK`, `p95`, `idempotent`), gloss it in half a sentence. Skipping that is not brevity; it buys a confirmation that confirms nothing — a user nodding at words they did not parse, which makes STAGE 3's *"what I understood = what you want"* check pass falsely.

**When there is no human in the loop (design-only).** Sometimes *no* user is reachable for the whole run — you are scoping an OSS feature from an RFC, or designing against a written spec alone. The skill still applies, in a shifted mode: the invariant *never guess silently on a high-blast-radius unknown* still binds — its satisfaction shifts from *get a yes* to **park the unknown as a named open question with an owner-to-ask and its blast-radius-if-wrong**. Re-point the validation oracle from user intent to the best available **written authority** (the RFC, an enumerated reviewer comment, a standard like RFC 7519, the existing code) — see the WRITTEN-PROXY rule in [references/decision-tree.md](references/decision-tree.md). STAGE 3 (Validate) then degrades to *replay every Must against its written source + walk the full review checklist + park the unconfirmable*; STAGE 4 (Manage) produces a **proposed** governance contract for whoever inherits the work, not a live authority gate. This is a weaker claim than user-confirmed understanding — label it as such in the handoff. The conservative-default FALLBACKs scattered through the references *are* this one mode; read them as one.

If `$ARGUMENTS` names a target to scope, scope that. If the ask is already a fully-pinned, low-risk change (a one-line fix, a rename), this skill is overkill — say so and proceed without it. When in doubt, open the decision tree.

## The reference library

The depth lives in `references/`. Open each one when a stage sends you there — not all upfront.

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. Is this even a requirements situation? How deep do you go? How does an agent stand in for stakeholders it cannot interview? Open it at the start and keep it beside you.
- [references/agent-blind-spots.md](references/agent-blind-spots.md) — the failure modes an agent must be *told*: implementing the literal/solution-shaped ask, skipping stakeholder discovery, ignoring non-functional and implicit needs, gold-plating, silent scope creep, treating requirements as one-shot. Load at the start, re-check at every gate.
- [references/elicitation.md](references/elicitation.md) — stakeholder discovery, digging the *why* under a stated solution, surfacing implicit requirements, and the methods (interview, observe, prototype-to-react-to) — adapted for an agent who interviews through the user.
- [references/analysis.md](references/analysis.md) — functional vs non-functional (with an NFR catalog), MoSCoW prioritization, surfacing stakeholder conflicts, and drawing the scope / out-of-scope line that fights scope creep.
- [references/specification.md](references/specification.md) — user stories + INVEST, acceptance criteria (Given/When/Then), use cases, the six quality attributes, and the vague-word → measurable conversion that makes a requirement testable.
- [references/validation-and-management.md](references/validation-and-management.md) — confirming "what you understood = what they want", and then the change process + traceability that accept requirements will evolve.

---

## STAGE 0 — Elicit (gather: who to ask, and what they really need)

Do not design or estimate yet. First, *who*: build a **stakeholder map** — direct users, the funder/sponsor, operators, compliance/legal, and the silent-but-affected. A missed requirement is usually a missed *person*, not a missed analysis. You cannot interview them, so ask the user to identify and speak for them.

Then, *what they really need*: a stated solution is not a requirement. When the ask is solution-shaped ("I want an export button"), step back and dig for the why ("every month I have to hand my boss a report") — see the five-whys technique in [references/elicitation.md](references/elicitation.md). And surface **implicit requirements** — the things nobody says because they seem obvious (don't lose data, don't store passwords in plaintext). Their absence is an incident, not a feature gap.

Pull from every cheap source: the user's words, the existing system/code, tickets, competitors.

### GATE — clear before STAGE 1
1. `checklist check elicit stakeholders-mapped`
2. `checklist check elicit real-need-surfaced`
3. `checklist verify elicit`

---

## STAGE 1 — Analyze (sort by importance, expose the contradictions)

Open **[references/decision-tree.md](references/decision-tree.md)** and **[references/analysis.md](references/analysis.md)**.

**Split functional from non-functional.** Functional = what the system *does*; non-functional = performance, security, reliability, usability, scalability, compliance, observability. NFRs are the most-skipped class and the one that most often *decides the architecture* — surface them now, not after the design is set. Run the NFR sweep in `analysis.md` deliberately; do not wait for the user to volunteer them.

**Prioritize.** Resources never suffice. Rank with **MoSCoW** (Must / Should / Could / Won't). "Everything is important" is a planning failure.

**Surface conflicts.** Different stakeholders *will* contradict each other (more features vs. more stability). Put the conflict on the table now; resolving it in development is rework.

**Draw the scope line.** Writing down what is **out of scope** — explicitly, in black and white — is the single most effective weapon against scope creep. Do it here.

### GATE — clear before STAGE 2
1. `checklist check analyze functional-nonfunctional-split`
2. `checklist check analyze prioritized-and-scoped`
3. `checklist verify analyze`

---

## STAGE 2 — Specify (turn the fuzzy into the executable)

Open **[references/specification.md](references/specification.md)**. Capture requirements in the right vessel — user stories + acceptance criteria, use cases, or a short SRS, as the scale warrants.

**Every requirement must clear the quality bar: unambiguous, verifiable, necessary, feasible, consistent, traceable.** The keystone is **verifiable** — after writing each one, ask *"how would I test that this passed?"* If you cannot answer, it is still too fuzzy.

**Kill the vague words.** "Fast", "user-friendly", "efficient", "robust", "scalable" are not requirements until quantified. "Responses should be fast" → "p95 response time < 200 ms under N concurrent users". Each funded requirement gets concrete **acceptance criteria** (Given/When/Then) that double as the validation contract for the next stage.

### GATE — clear before STAGE 3
1. `checklist check specify requirements-verifiable`
2. `checklist check specify acceptance-criteria-defined`
3. `checklist verify specify`

---

## STAGE 3 — Validate (confirm everyone understood the same thing)

Written does not mean correct. Close the loop with the user/stakeholders: walk the requirements and their acceptance criteria back to them, demo a prototype or wireframe where words are slippery, and confirm that **what you understood is what they want**. Every misunderstanding caught here saves multiplied rework downstream — see [references/validation-and-management.md](references/validation-and-management.md).

If validation exposes a gap, *go back* — re-elicit or re-analyze — rather than paper over it.

### GATE — clear before STAGE 4
1. `checklist check validate shared-understanding-confirmed`
2. `checklist check validate high-blast-unknowns-parked`
3. `checklist verify validate`

---

## STAGE 4 — Manage (requirements will change — plan for it)

Open [references/validation-and-management.md](references/validation-and-management.md) (PART TWO). Requirements are not carved once. Establish a lightweight **change process** (who can change a requirement, how its impact is assessed, how the change is recorded) and **traceability** — ideally every requirement traces down to its design, code, and tests, so a change here tells you what it touches there. Record a baseline, the residual risk, and any open questions so whoever inherits this work inherits the map too.

### FINAL GATE
1. `checklist check manage change-and-traceability`
2. `checklist verify manage`
3. `checklist show` — confirm all five stages passed.
4. `checklist done` — clear this run's state.

---

## Handoff to building

Groundwork's output is the contract the build honors. When you proceed to implement (and, later, to test — see the `assay` skill), carry the funded requirements, their acceptance criteria, and the out-of-scope list forward verbatim. The acceptance criteria you wrote in STAGE 2 are exactly the oracles a test suite needs.

## Anti-patterns (use as a pre-flight checklist)

- **Solution-as-requirement** — implementing the stated fix without digging for the underlying need. The single most common agent failure. (`agent-blind-spots.md` BS-1)
- **Scope creep** — requirements quietly accreting with no one calling stop. The out-of-scope list is the brake. (BS-5)
- **Gold plating** — adding capability the user never asked for; it buys complexity and bugs, not value. (BS-4)
- **Listening only to the loudest** — the silent stakeholder's missing requirement sinks the project just as hard. (BS-2)
- **Ignoring non-functional requirements** — remembering high-concurrency or compliance only after the architecture is poured. (BS-3)
- **The waterfall illusion** — believing requirements can be gathered once and frozen; they evolve, so manage them. (BS-6)
- **Unverifiable requirements** — "fast", "friendly", "robust" with no number; if you can't test it, you can't build to it. (BS-8)
- **Skipping a GATE** — the user's judgment at each gate can change the whole plan.

The BS-* tags point to the deep cards in [references/agent-blind-spots.md](references/agent-blind-spots.md), each with the corrective behavior and a literal "do this".

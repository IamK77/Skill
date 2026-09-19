---
name: gungnir
description: "Investigate a specifically authorised security hypothesis with minimal, reproducible evidence. Use only on an agreed target and scope; deliver a bounded finding rather than speculative accusations."
argument-hint: "[your own / authorized target to attack — a staging system or lab]"
metadata:
  kind: sop
disable-model-invocation: true
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# gungnir

Investigate a specifically authorised security hypothesis with minimal, reproducible evidence. Use only on an agreed target and scope; deliver a bounded finding rather than speculative accusations.

## Inputs

Explicit target and authorisation; allowed techniques and impact limits; a security hypothesis; a safe reproduction environment.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### authorise

Record who authorised which target and actions. Establish stop conditions for sensitive data, service impact, or scope expansion. Read local boundaries before interacting with the target.

Record these artifacts after doing the work:

- Target, authority, allowed actions, and stop conditions are recorded.
  `checklist check authorise scope --run "$RUN" --evidence "<artifact and observation>"`
- The suspected trust-boundary violation is stated as a testable hypothesis.
  `checklist check authorise hypothesis --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance authorise --run "$RUN"`.

### reproduce

Trace the relevant code path and construct the least invasive demonstration. Record prerequisites, inputs, outputs, and counterexamples. Stop rather than escalating beyond the agreed impact.

Record these artifacts after doing the work:

- The reachable path and required attacker capabilities are evidenced.
  `checklist check reproduce trace --run "$RUN" --evidence "<artifact and observation>"`
- A safe reproduction or a documented failed attempt supports the finding.
  `checklist check reproduce reproduction --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance reproduce --run "$RUN"`.

### report

Separate confirmed impact from inferred consequences. Suggest a repair at the responsible boundary and a regression. Deliver through the authorised channel; do not publish or contact third parties implicitly.

Record these artifacts after doing the work:

- Report includes affected versions, steps, impact, and uncertainty.
  `checklist check report finding --run "$RUN" --evidence "<artifact and observation>"`
- Test artifacts and sensitive material are handled within the agreed scope.
  `checklist check report cleanup --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance report --run "$RUN"`.

## Branches

Without explicit authorisation, stop at passive local review and request scope. Tool availability or a checklist entry does not authorise exploitation, credential use, disclosure, or external messages.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A reproducible, bounded security finding or an evidence-backed negative result. No exploit escalation or public disclosure is part of automatic completion.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent era shifts](references/agent-era-shifts.md)
- [chaining and impact](references/chaining-and-impact.md)
- [decision tree](references/decision-tree.md)
- [exploitation by class](references/exploitation-by-class.md)
- [recon and enumeration](references/recon-and-enumeration.md)
- [report fix retest](references/report-fix-retest.md)
- [scope and authorization](references/scope-and-authorization.md)
- [tools and practice](references/tools-and-practice.md)

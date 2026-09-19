---
name: groundwork
description: "Turn a request into an agreed, testable task definition. Use when requirements, constraints, examples, or acceptance boundaries are unclear."
argument-hint: "[feature / system / change to scope]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# groundwork

Turn a request into an agreed, testable task definition. Use when requirements, constraints, examples, or acceptance boundaries are unclear.

## Inputs

The human’s request; affected users and current behaviour; known constraints; who can resolve conflicting requirements.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### understand

Restate the desired outcome and ask only the questions that change scope or acceptance. Separate facts, assumptions, and choices still owned by the human.

Record these artifacts after doing the work:

- Users, problem, and desired outcome are stated.
  `checklist check understand need --run "$RUN" --evidence "<artifact and observation>"`
- Material ambiguities and their decision owners are recorded.
  `checklist check understand unknowns --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance understand --run "$RUN"`.

### specify

Write concrete success and failure examples, non-goals, constraints, and interfaces affected. Resolve contradictions with the decision owner rather than selecting a requirement silently.

Record these artifacts after doing the work:

- Acceptance examples include meaningful boundaries and failure behaviour.
  `checklist check specify examples --run "$RUN" --evidence "<artifact and observation>"`
- Non-goals, constraints, and unresolved decisions are explicit.
  `checklist check specify scope --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance specify --run "$RUN"`.

### agree

Walk the examples with the human or cite an existing authoritative specification. Mark unresolved work as blocked; preserve the link from requirement to later verification.

Record these artifacts after doing the work:

- The requirement has an attributable agreement or authoritative source.
  `checklist check agree agreement --run "$RUN" --evidence "<artifact and observation>"`
- Implementation and test work can trace back to acceptance examples.
  `checklist check agree handoff --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance agree --run "$RUN"`.

## Branches

For a small change, a few concrete examples may be the entire artifact. If the human wants possibilities rather than a commitment, use an appropriate heuristic lens instead of manufacturing a specification.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

An agreed task definition, or a clearly blocked draft naming the missing decision. A checklist confirmation records the agreement source; it does not grant consent.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent blind spots](references/agent-blind-spots.md)
- [analysis](references/analysis.md)
- [decision tree](references/decision-tree.md)
- [elicitation](references/elicitation.md)
- [specification](references/specification.md)
- [validation and management](references/validation-and-management.md)

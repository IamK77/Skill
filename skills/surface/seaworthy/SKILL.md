---
name: seaworthy
description: "Harden a selected frontend journey across async states, recovery, accessibility, and performance constraints. Use for implementation readiness, not a universal visual-style audit."
argument-hint: "[the feature slice to build production-grade, or to audit for the unhappy paths]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# seaworthy

Harden a selected frontend journey across async states, recovery, accessibility, and performance constraints. Use for implementation readiness, not a universal visual-style audit.

## Inputs

Existing journey; target users/devices; important failure modes; agreed accessibility and performance requirements.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### states

Map loading, empty, success, error, retry, and cancellation where applicable. Define what the user should perceive and retain when requests fail or arrive out of order.

Record these artifacts after doing the work:

- Relevant async and failure states have expected visible outcomes.
  `checklist check states states --run "$RUN" --evidence "<artifact and observation>"`
- Supported input modes, devices, and performance requirements are explicit.
  `checklist check states constraints --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance states --run "$RUN"`.

### harden

Implement the missing state and recovery behaviours. Exercise keyboard/focus paths and semantic accessibility; test race cases and slow/failing requests. Measure relevant performance on a representative path.

Record these artifacts after doing the work:

- State transitions and recovery paths were exercised.
  `checklist check harden behaviour --run "$RUN" --evidence "<artifact and observation>"`
- Keyboard, semantic accessibility, and relevant performance checks are recorded.
  `checklist check harden access --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance harden --run "$RUN"`.

### handoff

Retain regression coverage for the risky paths and document any unsupported conditions or measured limits. Report exactly which accessibility checks ran, not blanket compliance.

Record these artifacts after doing the work:

- Risky interaction and failure paths have retained tests.
  `checklist check handoff regressions --run "$RUN" --evidence "<artifact and observation>"`
- Measured results and unsupported or unverified conditions are explicit.
  `checklist check handoff limits --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

Not every product needs offline operation or optimistic updates; define the actual behaviour instead of adding features to satisfy a list. Use applicable accessibility requirements, not a generic claim about legal compliance.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A more robust journey with reproducible checks and named gaps. Trials can deepen behavioural coverage.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Check the selected journey under its actual constraints](references/accessibility-and-performance.md)
- [Follow meaning and interaction beyond appearance](references/accessibility-deep.md)
- [Preserve user intent across form and connectivity states](references/forms-states-and-offline.md)
- [Model the states that matter to the actual task](references/four-states.md)
- [Make asynchronous behaviour match the promise](references/illusion-maintenance.md)
- [Robustness around a selected journey](references/the-membrane.md)

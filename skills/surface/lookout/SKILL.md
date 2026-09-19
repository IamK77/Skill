---
name: lookout
description: "Establish delivery observation and decision-linked frontend telemetry for a chosen release. Use for preview, measurement, and post-release checks with privacy and rollback boundaries."
argument-hint: "[the delivery/observability to set up, or the metric/experiment to gate]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# lookout

Establish delivery observation and decision-linked frontend telemetry for a chosen release. Use for preview, measurement, and post-release checks with privacy and rollback boundaries.

## Inputs

Change or release; intended user outcome; authorised environments; success/abort signals; permitted telemetry and retention.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### plan

Define the decision each signal informs and the environment to observe. Choose a representative preview path and rollback/disable action. Avoid collecting data merely because it is available.

Record these artifacts after doing the work:

- Signals link to explicit release or product decisions.
  `checklist check plan decision --run "$RUN" --evidence "<artifact and observation>"`
- Environment, rollback, and telemetry/privacy boundaries are recorded.
  `checklist check plan boundary --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance plan --run "$RUN"`.

### instrument

Create or inspect the preview and relevant health/performance observations. Validate event schemas and sampling, and exercise a known success and failure so the telemetry has meaning.

Record these artifacts after doing the work:

- The changed journey is observable in the intended preview environment.
  `checklist check instrument preview --run "$RUN" --evidence "<artifact and observation>"`
- Health and event instrumentation were exercised with known cases.
  `checklist check instrument signals --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance instrument --run "$RUN"`.

### handoff

Record measured baselines, release thresholds, owners, and what happens when a signal trips. Stop before external rollout unless specifically authorised.

Record these artifacts after doing the work:

- Baselines, thresholds, and their limitations are documented.
  `checklist check handoff thresholds --run "$RUN" --evidence "<artifact and observation>"`
- Each material signal has an owner and response action.
  `checklist check handoff response --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

For local-only work, document a proposed production measurement rather than adding external tracking. Consent, retention, and access requirements come from the actual product context.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A decision-linked observation plan and tested instruments. A dashboard is evidence to interpret, not a self-proving claim of product health.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [delivery and instruments](references/delivery-and-instruments.md)
- [ethics gate](references/ethics-gate.md)
- [performance engineering](references/performance-engineering.md)
- [telemetry discipline](references/telemetry-discipline.md)
- [the membrane](references/the-membrane.md)

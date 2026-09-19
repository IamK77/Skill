---
name: stationkeeping
description: "Prepare and execute an explicitly authorised operational change with observability, rollback, and post-change checks. Use for release or incident procedures, not unattended production action."
argument-hint: "[service / system to deploy & operate]"
metadata:
  kind: sop
disable-model-invocation: true
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# stationkeeping

Prepare and execute an explicitly authorised operational change with observability, rollback, and post-change checks. Use for release or incident procedures, not unattended production action.

## Inputs

Environment and service identity; authorised operation; current health; owner/contact; rollback plan and observable success/abort thresholds.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### prepare

Confirm the exact environment, current deployment/configuration, authority, and blast radius. Check that rollback artifacts and access actually exist. Do not alter the process or network carrying this conversation.

Record these artifacts after doing the work:

- Environment, operation, authority, and blast radius are unambiguous.
  `checklist check prepare target --run "$RUN" --evidence "<artifact and observation>"`
- Rollback path and success/abort thresholds are recorded and feasible.
  `checklist check prepare rollback --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance prepare --run "$RUN"`.

### operate

Establish a health baseline. Execute the approved bounded action, watching the named signals. On an abort condition, use the agreed rollback or escalate; do not widen permissions to force progress.

Record these artifacts after doing the work:

- Pre-change health and relevant configuration are recorded.
  `checklist check operate baseline --run "$RUN" --evidence "<artifact and observation>"`
- Action, observed signals, and any rollback are logged.
  `checklist check operate operation --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance operate --run "$RUN"`.

### handoff

Check the user-visible path as well as internal health. Record deployed versions, remaining risks, and the next owner; do not infer recovery from one green dashboard.

Record these artifacts after doing the work:

- Post-change checks cover the intended outcome and abort signals.
  `checklist check handoff health --run "$RUN" --evidence "<artifact and observation>"`
- Operational record names current state, open issues, and next owner.
  `checklist check handoff owner --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

For planning-only requests, produce the runbook without executing it; execution checks remain pending. If a change can cut the agent’s communication path, hand that action to the human.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A recorded operational outcome with verified health or an explicit rollback/escalation state. Completion does not mean every reliability risk is eliminated.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent era shifts](references/agent-era-shifts.md)
- [capacity and continuity](references/capacity-and-continuity.md)
- [decision tree](references/decision-tree.md)
- [environments and config](references/environments-and-config.md)
- [monitoring and alerting](references/monitoring-and-alerting.md)
- [observability](references/observability.md)
- [release and rollback](references/release-and-rollback.md)
- [reliability and incident](references/reliability-and-incident.md)

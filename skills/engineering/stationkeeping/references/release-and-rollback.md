# A bounded release with a feasible reversal

## Use when

Use an authorised target, identified artifact, compatibility requirements, and success or abort conditions.

## Method

Record the current version and prepare the reversal before changing the environment. Check code, configuration, and data compatibility together. Apply the agreed bounded rollout, observe the relevant user path and health signals, and use the prepared abort action when its condition is met. Preserve the action log and resulting state.

## Example and record

An old binary may not understand data written by a new version, so redeployment alone may not be a rollback. A compatible staged schema change or a separate data recovery plan may be needed. State that limitation before rollout rather than discovering it during an incident.

## Limits and handoff

Do not widen permissions or blast radius merely to continue a troubled release. A prepared artifact and green CI do not independently authorise deployment.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

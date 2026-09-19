# Select an operational procedure from the actual risk

## Use when

Use the environment, operation, authority, blast radius, current health, and recovery options.

## Method

For a reversible configuration change, prepare the old value and observable success or abort conditions. For a deployment, check artifact identity and compatibility. For a data operation, distinguish rollback of code from restoration or reconciliation of data. For an incident, prioritise containment and continuity while preserving a useful action record.

## Example and record

A local preview can be restarted under a small scope; a production schema change may need staged compatibility and an explicit recovery decision. The same command name does not make those operations equivalent.

## Limits and handoff

If target identity, authority, or recovery is unclear, stop for that missing input. Do not apply an operational change to the process or network carrying this conversation; hand that action to the human.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

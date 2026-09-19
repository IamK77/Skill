# Alerts with an owner and a useful response

## Use when

Use a service objective, a failure someone needs to act on, and available measurement paths.

## Method

Choose signals that distinguish actionable conditions from routine variation. Record the aggregation window, threshold rationale, known blind spots, owner, and response. Exercise a known condition through the actual alert path and verify delivery and interpretation. Revisit noisy or unactionable alerts rather than accumulating them.

## Example and record

A high error count may reflect a traffic increase while the failure proportion is stable, or a small number of critical requests may deserve attention despite a low aggregate rate. Link the alert to the user consequence and retain enough context for investigation.

## Limits and handoff

A dashboard is not an alerting policy, and a delivered alert is not proof of recovery. State what the instrument observes and which conditions remain unmeasured.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

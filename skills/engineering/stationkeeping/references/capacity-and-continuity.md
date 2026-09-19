# Measure a limit and exercise a recovery path

## Use when

Use the service's intended workload, critical user paths, resource constraints, and continuity objectives.

## Method

Measure representative load and identify the limiting resource rather than extrapolating from one average. Include relevant bursts, tail behaviour, and downstream constraints. For continuity, identify failure domains and shared dependencies, verify backups or failover inputs, and exercise a bounded recovery with observed results.

## Example and record

Replicas in different locations can still depend on one identity service or configuration source. Record those dependencies and test the recovery path that the design actually relies on. A backup existing is not evidence that it can restore the required state within the needed window.

## Limits and handoff

Capacity and recovery targets come from the service context, not a universal percentage or uptime slogan. Keep assumptions about workload, data loss, and recovery time explicit.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

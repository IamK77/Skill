# Size delivery preparation to the task

## Use when

Use the requested outcome, affected consumers, and cost of failure.

## Method

For a small internal patch, focus on the relevant regression, reproducible build, and reviewable diff. For an API or data change, add consumer and migration checks. For an operational release, include target identity, observation, rollback, and explicit delivery authority. Follow applicable organisational requirements rather than inventing a generic regulated-project checklist.

## Example and record

A local library cleanup may end with a commit. A schema migration may need an expand/contract sequence and a recovery plan. The requested boundary determines whether publishing or deployment is included; a technically ready artifact does not imply permission to deliver it.

## Limits and handoff

Use risk to justify extra work, not to decorate a simple task with every available tool. Keep unavailable checks and assumptions visible.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

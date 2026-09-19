# Choose a maintenance change for an observed cost

## Use when

Use a concrete defect, compatibility obligation, dependency issue, or repeated change burden.

## Method

Distinguish a repair, behaviour-preserving restructuring, migration, and retirement. Identify consumers and the behaviour to preserve, then choose a focused unit of change and the evidence appropriate to it. If the work would change a product decision, separate that decision from the maintenance rationale.

## Example and record

Duplicate parsing may justify a shared mechanism only after intentional policy differences are understood. An unsupported dependency may instead require a compatibility migration. Record why the chosen action addresses the observed burden rather than simply modernising the code's appearance.

## Limits and handoff

Do not use a cleanup request as permission for an unrelated rewrite. A small well-protected change can be preferable to a comprehensive reorganisation whose consumers are not understood.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Assert the experience the contract promises

## Use when

Use an acceptance example or defect and the user-visible or persisted consequence that matters.

## Method

Act through a meaningful interaction boundary and assert the outcome rather than incidental component internals. Include relevant error, interruption, or ordering cases. Keep assertions precise enough to distinguish the target fault but flexible enough to survive a legitimate implementation refactor. Show that a controlled fault or broken implementation makes the test fail.

## Example and record

For stale search results, control two responses and release them in reverse order, then assert which result is visible. Counting a hook call or asserting an internal counter may not protect the actual experience.

## Limits and handoff

Some structural properties, such as required semantic roles or module boundaries, are themselves contracts and deserve direct checks. The distinction is whether the assertion protects a requirement, not whether it mentions implementation syntax.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

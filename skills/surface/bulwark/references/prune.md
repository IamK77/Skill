# Remove unused or superseded frontend structure safely

## Use when

Use observed consumers, build/runtime entrypoints, and the proposed removal.

## Method

Check static references together with dynamic registration, routing, generated usage, and external consumers where relevant. Remove a coherent obsolete path, update navigation or documentation, and exercise representative remaining consumers. Verify that the content is recoverable in Git before relying on history; handle untracked local material separately.

## Example and record

A component absent from direct imports may still be selected through a registry or content schema. Inspect that boundary before deletion. When replacing a component, remove the old implementation only after its compatibility obligation is understood.

## Limits and handoff

Unused-looking code and unattractive code are different questions. Do not delete a supported variant or a user's unrelated work merely to produce a cleaner tree.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

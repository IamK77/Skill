# Make asynchronous behaviour match the promise

## Use when

Use the interaction's intended acknowledgement, persistence, ordering, and recovery semantics.

## Method

Keep local acknowledgement, pending remote work, and confirmed completion distinguishable where they imply different choices. Handle obsolete responses, repeated submissions, cancellation, and failures according to the selected contract. Preserve user intent while making unresolved outcomes visible rather than hiding them behind a success animation.

## Example and record

If a person changes a search query before the first response arrives, identify which response belongs to the current intent. If an optimistic action later fails, reconcile the visible state and explain the remaining choice. Retain tests for those event orders.

## Limits and handoff

Optimism is not inherently better than waiting. Choose the experience for the cost of an incorrect promise and do not treat smooth animation as evidence that an operation completed.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

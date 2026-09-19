# Recovery without assuming a total failure

## An opening

Tell a failure story from the participant that disappears, the one that keeps working, and the one returning with old information. Invent a useful experience for each perspective. Resilience might mean preserving intent, reducing a promise, or changing coordination—not simply adding retries everywhere.

## Elaborate a candidate

A process, request, network path, or dependency can fail while other participants continue. Retries can duplicate effects or increase load, so relate them to request identity, deadlines, resource limits, and the selected operation semantics. Replicas can share a failure domain even when they run on different machines.

## A small comparison

Tell a partial-write story and a delayed-response story with the same visible timeout. They may need different recovery actions. Preserve the distinction between what was observed and what is merely suspected, then explore the promise that remains useful under uncertainty.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

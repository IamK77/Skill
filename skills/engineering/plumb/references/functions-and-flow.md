# Expose transformations, decisions, and effects

## An opening

Tell a calculation as a pipeline of values, then as an explicit state transition, then as a set of independent decisions. Each makes different intermediate information visible. Compare one failure or interruption across the versions before deciding whether an extracted function actually clarifies the work.

## Elaborate a candidate

Separate a calculation from an effect when doing so makes the contract or failure behaviour clearer. Keep names and return types tied to meaningful domain distinctions. An early return, pipeline, dispatch table, or explicit transition can each fit a different control relationship; none is universally clearer.

## A small comparison

Compare a refund operation as one imperative sequence and as a decision followed by explicit effects. Preserve the order and failure semantics that matter. A function being shorter does not establish that an important recovery path survived the refactor.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

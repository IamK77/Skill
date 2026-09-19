# Partial failure, delay, and incomplete knowledge

## An opening

Change one property of the world: communication pauses, participants disagree about time, or only part of an operation survives. Instead of immediately restoring the original illusion, invent a promise that remains useful in that world. The resulting product semantics may eliminate a coordination problem.

## Elaborate a candidate

Use a small participant story to distinguish absence of a response from proof of failure, physical time from causal relation, and a local observation from global agreement. These distinctions can guide a design without requiring an exhaustive tour of every distributed-systems mechanism.

## A small comparison

A worker finishes a task but its acknowledgment is delayed. Imagine the coordinator assigning another worker, waiting, or requesting a durable receipt. Each option changes latency, duplication risk, and the product promise. Let the inconvenient story generate alternatives rather than merely condemn one implementation.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

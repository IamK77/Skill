# Making failures reproducible

## Use when

Use a failing or intermittently failing test, its execution context, and any reproducible seed or event order.

## Method

Identify uncontrolled time, randomness, shared state, asynchronous ordering, external services, and resource contention. Control the smallest relevant boundary: inject a clock, retain a seed, allocate isolated resources, or explicitly schedule responses. Wait for observable conditions rather than adding arbitrary sleep intervals. Check both the fixed failure and normal execution.

## Example and record

A search test can release two responses in reverse order to exercise stale-result handling deterministically. A randomised test should report its seed and minimized input so the same failure can be rerun. Keep the triggering case after repair.

## Limits and handoff

Repeating until green is not a diagnosis. Quarantine may protect delivery temporarily, but retain an owner and a visible repair task. Do not remove assertions simply because they expose a real race.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

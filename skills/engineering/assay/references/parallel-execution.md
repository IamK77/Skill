# Independent tests and shared resources

## Use when

Use the runner's scheduling model and the resources tests actually share.

## Method

Give each test or worker isolated paths, identifiers, ports, databases, or namespaces where feasible. For unavoidable shared resources, define ownership and serialize the complete transaction rather than only the last write. Exercise the concurrency property with real competing processes when process isolation is part of the claim.

## Example and record

Two CLI invocations updating one run should not both read the same revision and later overwrite one another. Hold a transaction lock through prerequisite checks, execution, and commit; test that a second writer is refused or waits according to the contract. Different runs should still proceed independently.

## Limits and handoff

Do not infer multiprocess safety from an in-memory mutex or an atomic rename alone. Keep concurrency tests bounded with explicit handshakes and cleanup rather than timing guesses.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

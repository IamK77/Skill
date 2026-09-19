# Preserve the identity and failures of a research run

## Use when

Use the versioned plan, code, data access, configuration, and execution environment.

## Method

Give runs stable identifiers and record the inputs needed to reproduce them: code revision, data version or manifest, configuration, seeds, commands, and relevant environment. Preserve failures, interrupted attempts, and deviations. Check output completeness and association with the correct run before producing summaries.

## Example and record

A resumed job may combine outputs from different configurations if filenames alone identify the experiment. Retain a run manifest and validate the configuration associated with each artifact. Do not silently replace failed runs with favourable reruns while presenting the result as the original schedule.

## Limits and handoff

Provenance records are not automatically tamper-proof and may contain sensitive paths or data. Capture what is necessary with appropriate access, and distinguish a recorded command from a successfully reproduced result.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

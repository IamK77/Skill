# Measure a relevant frontend performance problem

## Use when

Use a user-visible path, representative content and devices, and an agreed performance objective.

## Method

Reproduce the slow or unstable experience and identify whether the limiting work is network, parsing, rendering, main-thread execution, memory, or another measured resource. Make a targeted change and compare the same path under stated conditions. Inspect regressions in interaction and correctness as well as the chosen timing metric.

## Example and record

A large list may be expensive because of repeated work rather than element count alone. Compare a focused update or rendering strategy using the actual interaction and content. Record the device, workload, sampling, and what the measurement excludes.

## Limits and handoff

There is no universal frame-time or bundle-size threshold that establishes quality for every product. A benchmark is evidence about its conditions; avoid replacing the actual objective with a favourable synthetic score.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

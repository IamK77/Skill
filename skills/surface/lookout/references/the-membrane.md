# Observation that informs a release decision

## Connect a signal to a decision

Name the question before adding telemetry: whether a release should continue, whether a failure mode is increasing, or whether a journey achieves its intended outcome. For each signal, identify the owner and response action.

## Validate the instrument

Exercise known successful and failed events through the actual collection path. Record sampling, aggregation, retention, and missing-data behaviour. A dashboard that renders plausible numbers has not necessarily measured the right population.

## Example

A conversion drop could reflect a broken checkout, a changed event schema, or a changed audience. Check event delivery and denominators, then compare a representative user journey. Do not infer the cause from the graph alone.

## Scope collection

Collect only information needed for the named decision, with the product's consent, access, and retention requirements. Local development does not imply permission to add external tracking or transmit production data.

## Handoff

Record a baseline, useful thresholds, their uncertainty, and who investigates when a threshold is crossed. A preview and observation plan can be complete without authorising rollout; external delivery is a separate action.

# From a reported symptom to a retained regression

## Use when

Use the reported behaviour, expected contract, affected environment, and available reproduction.

## Method

Reproduce the smallest relevant case and distinguish a product ambiguity from an implementation defect. Trace the responsible boundary, repair it, and retain a test that has been seen to detect the fault. Record affected versions or conditions, the observed result, and any adjacent cases that remain unresolved.

## Example and record

A retry may duplicate a persisted effect only after an interrupted acknowledgement. Reproduce that event order rather than changing a timeout until the symptom disappears. Verify the repair against both the duplicate-delivery case and the legitimate first operation.

## Limits and handoff

Severity depends on actual impact and reachability, not solely on a label or a dramatic hypothetical chain. Do not hide failed reproductions or claim that one fixed symptom establishes all related paths are correct.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Keep the client/server seam inspectable

## Use when

Use the selected journey, actual request/response contract, and participating consumers.

## Method

Identify field meaning, optionality, error behaviour, authentication context, and version assumptions at the seam. Use a shared schema or generated interface when it helps, but still validate the runtime boundary and an actual integration path. Keep any substitute aligned with representative real responses and label unavailable integration evidence.

## Example and record

A typed client can compile against a response shape the service no longer emits. Exercise the actual adapter or a contract check with a representative payload and rejection case. Preserve the checked revision and the consumer observation.

## Limits and handoff

No artifact makes drift impossible. Shared types, schema generation, and mocks each have limits; record what the chosen check actually compares instead of treating the filename as a guarantee.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Validate event meaning before interpreting a graph

## Use when

Use a decision-linked event definition, collection path, aggregation, and allowed data scope.

## Method

Specify event identity, relevant fields, outcome semantics, sampling, and duplicate or missing-event handling. Exercise a known success and failure through collection and analysis. Check denominators and version changes before comparing trends. Keep payloads minimal and document access and retention.

## Example and record

A completion-rate drop can reflect a real failure, a changed population, or a schema mismatch. Compare a representative journey and the actual emitted payload before attributing the graph to user behaviour. Preserve the event-version and analysis context.

## Limits and handoff

Telemetry can be incomplete or misleading without anyone acting dishonestly. Do not call a dashboard self-proving or assume a rendered chart validates the collection system.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

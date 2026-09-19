# Semantic tokens with explicit ownership

## Use when

Use the selected visual language, actual consumers and renderers, and existing generation or packaging conventions.

## Method

Separate primitive values from semantic roles and component-specific decisions where that distinction is useful. Choose an authoritative editable source and make derived outputs reproducible. Define how themes or platforms map a shared role to their appropriate values. Keep exceptions and ownership explicit and test representative rendered consumers after a token change.

## Example and record

A CSS interface and a canvas chart may share a semantic status role while requiring different output formats. Generate or validate their mappings rather than hand-maintaining parallel palettes. A stale committed token bundle should fail a freshness check before delivery.

## Limits and handoff

One source of truth means an explained authority and derivation path, not that every value must appear physically once. Do not create a generation framework whose maintenance cost exceeds the actual reuse.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

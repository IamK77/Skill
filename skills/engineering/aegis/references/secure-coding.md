# Handling untrusted representations

## Use when

Use the target language, actual input sources, and output or storage sinks.

## Method

Validate structural expectations at the boundary and retain the distinction between raw input and accepted domain values. Use parameterised database operations rather than concatenating untrusted text into query syntax. Encode output for its actual rendering context; a transformation safe for one context may not be safe for another. Check authorisation independently of input validity.

## Example and record

A comment may legitimately contain arbitrary text. Length and shape checks can protect resource assumptions, while rendering and query construction still need appropriate sink protections. Test ordinary content, boundary values, and a representative hostile representation without storing real secrets in fixtures.

## Limits and handoff

Do not invent a home-grown escaping or cryptography scheme to satisfy a recipe. Use the project's supported facilities, review their actual contract, and report untested paths instead of declaring input universally safe.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

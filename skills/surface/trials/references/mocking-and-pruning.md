# Keep frontend doubles and fixtures honest

## Use when

Use the behaviour under test, substituted external boundaries, and representative API contracts.

## Method

Retain real component and state integration when it is the subject. Substitute external latency, responses, or failure in a controlled way, and validate important doubles against real contracts. Remove redundant fixtures and irrelevant assertions while preserving important hard cases. Keep cleanup reliable so tests do not influence one another.

## Example and record

A fake response missing a field the real service always supplies may exercise a different path, while a fake that always succeeds hides error handling. Use representative successful and failed payloads, then keep at least a bounded integration observation at the critical seam.

## Limits and handoff

Do not prune a test merely because it exposes a real race or a disputed requirement. Quarantine should remain visible and attributable, not become a permanent hidden success condition.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

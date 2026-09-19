# Follow meaning and interaction beyond appearance

## Use when

Use real content and a selected interaction with its intended input and assistive-technology support.

## Method

Prefer appropriate native semantics where they fit, and inspect the actual accessible names, roles, states, and reading order. Exercise keyboard operation, focus movement and return, errors, announcements, zoom/reflow, and information conveyed through colour or motion where relevant. Validate custom behaviour against its intended interaction contract rather than adding attributes decoratively.

## Example and record

A custom menu needs a coherent focus and selection model, not only a role label. Test opening, navigating, choosing, dismissing, and returning to the invoking context where those behaviours apply. Keep the result attributable to the environment exercised.

## Limits and handoff

An automated score or an ARIA attribute does not establish complete accessibility. Use the product's actual conformance target and relevant manual/assistive-technology checks; do not make a legal determination from this reference.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

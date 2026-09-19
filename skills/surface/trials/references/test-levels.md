# Use the cheapest level that observes the real failure

## Use when

Use the risky behaviour, actual integration seams, available browser environment, and maintenance cost.

## Method

Test pure transformations directly, component/state interactions with appropriate integration, and selected critical journeys through the browser. Use visual and accessibility checks for the properties they observe, not as substitutes for behavioural assertions. Retain a target regression and demonstrate its sensitivity before broadening coverage.

## Example and record

A serialization issue may need a direct boundary test, while focus return after a modal closes needs the relevant interaction environment. A checkout path may deserve a thin end-to-end check even when its individual components are well tested.

## Limits and handoff

No fixed test pyramid ratio fits every frontend. Report the browser, input modes, and paths actually exercised; a green unit suite does not establish an unavailable browser journey.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

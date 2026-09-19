# Trace one thin journey across its seams

## Use when

Use one selected user action and an observable end-to-end outcome.

## Method

List the necessary boundaries: interaction, route or request, policy, data transformation, persistence or side effect, and visible return. Identify which are real and which are substituted in the current slice. Exercise the path through the uncertain seams and capture a useful failure case. Keep the slice small enough that a broken boundary can be located.

## Example and record

A save-preferences slice should show that the changed value reaches the intended service and is retrieved after reload. Toggling a local variable demonstrates only the interaction, while a successful isolated API request demonstrates only another part of the journey.

## Limits and handoff

The seam list supports the chosen slice; it is not a requirement to construct every product capability. Report substituted or unavailable boundaries without presenting them as completed integration.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

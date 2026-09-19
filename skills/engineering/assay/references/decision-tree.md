# Choosing a test around a risk

## Use when

Use an observable outcome, the boundary that produces it, and the cost of an undetected failure.

## Method

Test pure transformations directly when that is where the risk lies. Use an integration test when the important property crosses real collaborators. Use an end-to-end path for a small number of critical user journeys or deployment seams. A known defect calls for a targeted regression, while exploratory testing may first clarify what is wrong.

## Example and record

An ownership defect needs real policy evaluation with distinct principals; a test that stubs the policy only protects wiring. A serialization defect may be observed more cheaply with a direct round-trip and boundary fixture. Record why the chosen level observes the failure.

## Limits and handoff

There is no universal ratio of unit, integration, and end-to-end tests. Keep test setup proportional to the task and expose environmental limitations. If the expected behaviour is undecided, request the requirement rather than encode a guess as an oracle.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

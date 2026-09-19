# Construct a probe for one behavioural claim

## Use when

Use a concrete failure or acceptance example, a controllable input, and an observable outcome.

## Method

Arrange the smallest environment that still contains the subject of the test. Act through the boundary whose behaviour matters. Assert a result that distinguishes the correct implementation from the target fault, including relevant side effects and failure paths. Demonstrate sensitivity on the broken implementation or a controlled mutation, then restore and rerun.

## Example and record

For a refund path, assert both the external refund attempt and the persisted order state when that attempt fails. A happy-path output alone may miss an incorrect reordering of effects. Keep the failure fixture and the intended recovery behaviour visible.

## Limits and handoff

An oracle may be a reviewed expected value, an independently justified property, or an appropriate reference implementation. Repeating the production calculation inside the assertion does not create an independent oracle. Test failure in setup does not prove that the behavioural assertion works.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

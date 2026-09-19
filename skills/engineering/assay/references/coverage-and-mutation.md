# Coverage, fault sensitivity, and gaps

## Use when

Use a requirement or defect and the existing tests around the affected behaviour.

## Method

Use coverage to locate execution gaps, then inspect what the assertions actually observe. Introduce a controlled fault representative of the risk and confirm that a retained test detects it. Restore the code exactly and rerun the relevant suite. Treat mutation results as evidence about the chosen fault set, not a universal quality percentage.

## Example and record

A parser test can execute every branch while checking only that the result is non-null. Change a boundary comparison and verify that a meaningful expected value or rejection assertion fails. Retain the boundary case and note gaps that the mutation did not exercise.

## Limits and handoff

Some mutations are equivalent under the contract, and some surviving faults reveal weak tests or an ambiguous requirement. Investigate rather than manipulating the denominator. A target regression should fail on the broken behaviour, not merely on unavailable setup.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

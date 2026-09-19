# Properties and generated cases

## Use when

Use a domain relation that should hold over a meaningful set of inputs.

## Method

State the property and its preconditions before choosing generators. Include boundary values and valid structural constraints, retain seeds and minimized counterexamples, and distinguish an invalid generated input from an implementation defect. Combine broad generated coverage with small named regressions for important discovered cases.

## Example and record

A serialization round-trip can check preservation of supported values, but only within the format's declared domain. A sorting test can check order and preservation of multiplicities rather than comparing only output length. Record assumptions about equality, exceptional values, and allowed normalization.

## Limits and handoff

A property can be too weak or wrong. Validate it against representative counterexamples and avoid a generator that excludes the very boundaries the feature must handle. Passing many samples is evidence about those samples, not a proof over an unbounded domain.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

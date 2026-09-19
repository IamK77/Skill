# State what a static check actually establishes

## Use when

Use a passing or failing diagnostic and the claim it is being used to support.

## Method

Describe the property the tool checks under its configuration and assumptions. Keep runtime input, policy, performance, and user-outcome claims separate unless they are independently tested. Review escape hatches such as casts, ignored files, generated declarations, and suppressions when they affect the chosen boundary.

## Example and record

A typed API client can make a request shape easier to express correctly while still receiving an incompatible or malicious runtime response. Validate the real boundary and exercise meaningful failures; do not treat a type declaration as observed remote behaviour.

## Limits and handoff

The useful conclusion is narrow and inspectable, not pessimistic: identify the guarantee, its assumptions, and the next observation required for a stronger claim. A checklist confirmation cannot extend the tool's scope.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

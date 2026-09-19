# Trust boundaries and bounded security claims

## Use when

Use this note when deciding what a control is meant to protect and what evidence would support it.

## Method

Separate identity, permission, representation validity, and the eventual side effect. Minimise privileges and exposed interfaces where that serves the use case. Keep rejection behaviour explicit and test failures at the responsible boundary. Consider additional layers when they reduce a relevant residual risk rather than merely duplicate the same assumption.

## Example and record

A syntactically valid object ID is not proof that a caller owns the object. A useful test creates two principals and demonstrates the permitted operation and the rejected cross-owner operation. The report names the target revision and tested path.

## Limits and handoff

A principle is a design aid, not an assurance certificate. State prerequisites and residual risks. Do not claim that a scanner, checklist, or coding style establishes overall security.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

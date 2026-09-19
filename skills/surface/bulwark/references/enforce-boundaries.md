# Retain a check for a meaningful module boundary

## Use when

Use a concrete dependency or contract rule, the code it covers, and legitimate exceptions.

## Method

Express the rule in an appropriate static check, build boundary, or integration test. Introduce a representative violation in a controlled fixture and confirm that the actual command detects it. Restore the normal code and test an allowed case. Check generated files, aliases, and indirect imports where they could bypass the intended boundary.

## Example and record

A layer-import rule should reject a real forbidden import from a representative consumer, not simply inspect a naming convention unrelated to resolution. Retain that fixture so later configuration changes cannot silently disable the rule.

## Limits and handoff

A rule protects the property it can observe; it is not proof of architectural quality. Keep exceptions narrow and attributable, and do not block a legitimate consumer merely to preserve a diagram.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

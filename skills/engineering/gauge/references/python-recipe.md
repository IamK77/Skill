# A Python feedback loop that fits the project

## Use when

Use the supported Python versions, package layout, existing checker/linter, and test command.

## Method

Start from the repository's configuration and inspect a representative diagnostic baseline. Add typing or a rule at the boundary where it prevents a concrete mistake. Check that the tool analyses the intended modules and that stubs or third-party types match the environment. Exercise a deliberate violation, restore it, and run the normal check and relevant tests.

## Example and record

For a parser returning several result variants, a focused type annotation and exhaustive handling check may expose an omitted branch. Runtime validation still handles external values that do not match the annotation. Record both kinds of evidence if both are part of the task.

## Limits and handoff

Do not prescribe a new checker or a maximal strictness profile regardless of compatibility. Keep incremental exclusions explicit, and verify actual installed options rather than copying version-sensitive flags from memory.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

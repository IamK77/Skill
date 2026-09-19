# Keep style feedback useful and local

## Use when

Use existing formatter/linter configuration and the actual diff.

## Method

Apply the repository's established formatting and naming conventions where they clarify the code. Automate mechanical formatting rather than debating it repeatedly. Separate broad reformatting from a focused behavioural change when doing so keeps review readable. Investigate a diagnostic before suppressing it; record a narrow reason for any exception.

## Example and record

A two-line bug fix should not acquire a repository-wide style rewrite because a different default configuration was installed. Run the existing command on the intended scope and verify that generated files or vendor code are handled according to the project convention.

## Limits and handoff

A style rule does not establish correctness or architecture. If a convention obstructs a required change, explain the concrete problem and make a focused adjustment instead of treating either the old rule or a preferred style as universal.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Combine observations without confusing their scope

## Use when

Use the error classes, tool configurations, and developer workflow of the repository.

## Method

Identify what each tool reads and what its result means: source, types, dependency metadata, a built artifact, or a running system. Choose overlapping checks when they catch distinct failure modes, not merely to increase a count. Reproduce a representative diagnostic and verify the exact command invoked locally and in CI.

## Example and record

A build can succeed while a package exports the wrong file, so a small consumer or relocated-artifact test may add information that another lint rule cannot. Record which failure the new check detects.

## Limits and handoff

Tool names are not guarantees. Configuration, file selection, suppressions, and environmental differences can change coverage. Report those limits and retain a sensitivity fixture for custom rules.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

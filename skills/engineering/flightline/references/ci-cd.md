# A reproducible delivery pipeline

## Use when

Use the repository's actual build inputs, required checks, generated artifacts, and authorised delivery boundary.

## Method

Run checks against the intended revision and preserve dependency/toolchain inputs needed to reproduce it. Make generated-artifact freshness fail before merge. Separate validation from publication credentials and deployment actions. If selecting tests by impact, retain an appropriate broader check to detect selection mistakes. Validate a new CI rule with a representative failing case.

## Example and record

A source test and a relocated shipping bundle can share a contract suite. Intentionally stale output should fail the bundle check rather than be rebuilt silently inside the test. Record the commands and artifacts that correspond to the release candidate.

## Limits and handoff

A green pipeline covers the checks that ran, not every product risk. Automatic publication is a distinct action with its own triggers and authority. Do not let a repair workflow push unexpected code simply to conceal inconsistent generated artifacts.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

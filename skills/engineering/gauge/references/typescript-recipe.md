# A TypeScript feedback loop that reaches consumers

## Use when

Use the repository's tsconfig, supported runtime/module targets, dependencies, and test/build commands.

## Method

Inspect which files and declaration boundaries the configured type check covers. Introduce a representative invalid use and confirm the real command rejects it. Restore the file and exercise an affected consumer or shipped artifact when runtime packaging is involved. Document casts or exclusions that weaken the intended boundary.

## Example and record

A source import can type-check while a package's emitted entrypoint is wrong. Keep type feedback and a runtime consumer test as separate observations. Similarly, a discriminated union can constrain internal values but does not validate arbitrary incoming JSON by itself.

## Limits and handoff

Do not assume one strictness profile or module setting fits every runtime. Use the project's supported configuration and name untested targets or external-value validation gaps.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Improve a measured contributor feedback loop

## Use when

Use a concrete setup, build, test, or navigation cost experienced in the repository.

## Method

Reproduce the friction and identify its cause before adding infrastructure. Make a focused improvement to setup, diagnostics, examples, or iteration speed, and measure the same path afterward. Keep commands aligned across documentation and CI. Verify that a convenience wrapper still exposes failures and does not silently rebuild or skip the artifact under test.

## Example and record

A local test command that hides a stale bundle can feel convenient while weakening delivery confidence. Separate deliberate regeneration from freshness verification and document the distinction. Record the before/after observation and the supported environment.

## Limits and handoff

Do not adopt a framework solely because it is fashionable or claim that one benchmark represents every contributor's environment. A simple documented command may be the most maintainable improvement.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Fit tests to the repository's language and conventions

## Use when

Use the project's actual test runner, fixtures, package boundaries, and contributor guidance.

## Method

Read nearby tests before introducing a new pattern. Use assertions that express the language's relevant value and error semantics, and isolate global state the runner may share. Keep test discovery and command selection explicit. Verify the installed tool's behaviour instead of assuming an option from another runner or version exists.

## Example and record

An asynchronous test should await the operation that produces the effect and assert both its useful output and relevant failure behaviour. A fixture that changes environment variables or a working directory should restore them even when the test fails. Retain a small example in the repository's established style.

## Limits and handoff

Conventions are a starting point, not a reason to preserve a broken test shape. Explain a necessary departure in terms of the behaviour being protected rather than importing a new framework for stylistic preference.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

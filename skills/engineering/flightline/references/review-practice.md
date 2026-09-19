# Review the intended behaviour and its evidence

## Use when

Use the requirement, diff, existing worktree context, and relevant test results.

## Method

Read the affected behaviour and its callers before treating a local change as isolated. Check failure paths, side-effect ordering, compatibility, generated artifacts, and whether the regression observes the intended fault. Separate a concrete defect from a preference, and explain findings with a reproducible path or clear contract violation.

## Example and record

A refactor moving a state update before a remote effect may preserve the success output but change recovery after failure. Review the failure path and retain a test for it. A finding should state the prerequisite and consequence rather than only call the code risky.

## Limits and handoff

Do not turn review into an unrelated rewrite or claim that every unchecked possibility is a defect. Report what was inspected and what was not, and resolve product ambiguities with the decision owner.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

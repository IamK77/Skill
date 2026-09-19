---
name: trials
description: "Build frontend regression tests that observe real user behaviour and survive implementation refactors. Use for interaction, integration, and critical journey coverage."
argument-hint: "[the frontend feature/suite to test or audit for behavior-vs-structure]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# trials

Build frontend regression tests that observe real user behaviour and survive implementation refactors. Use for interaction, integration, and critical journey coverage.

## Inputs

Journey or defect; observable acceptance examples; actual test stack; API contracts; relevant device/input modes.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### behaviour

Choose a user-visible outcome and a test level that observes its failure. Keep critical cross-page paths thin; isolate pure logic only when that is where the risk lives.

Record these artifacts after doing the work:

- Tests are tied to concrete visible outcomes and failure cases.
  `checklist check behaviour examples --run "$RUN" --evidence "<artifact and observation>"`
- Test levels and substituted boundaries fit the actual risk.
  `checklist check behaviour level --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance behaviour --run "$RUN"`.

### exercise

Write the test using real component/state integration where practical. Validate doubles against the contract. Observe the intended red result, repair or restore the implementation, then run the suite.

Record these artifacts after doing the work:

- The targeted fault made the test fail for the expected reason.
  `checklist check exercise red --run "$RUN" --evidence "<artifact and observation>"`
- The restored implementation and relevant suite passed, with logs retained.
  `checklist check exercise green --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance exercise --run "$RUN"`.

### handoff

Remove assertions about irrelevant internals and stabilize clocks, data, and async waits. Retain the tests and report browser/device coverage and remaining gaps.

Record these artifacts after doing the work:

- Tests retain meaningful assertions and deterministic setup.
  `checklist check handoff maintainable --run "$RUN" --evidence "<artifact and observation>"`
- Execution environments and untested paths are explicit.
  `checklist check handoff coverage --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

Visual comparisons and accessibility scans supplement behavioural tests; neither replaces a keyboard walkthrough or meaningful assertions. If the browser environment is unavailable, report unrun tests rather than substituting a green unit test.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

Retained frontend regressions with demonstrated fault sensitivity and a clear execution record.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [behavior not structure](references/behavior-not-structure.md)
- [mocking and pruning](references/mocking-and-pruning.md)
- [test levels](references/test-levels.md)
- [the membrane](references/the-membrane.md)

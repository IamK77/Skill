---
name: assay
description: "Build regression tests around observable behaviour and demonstrate that they detect the fault. Use for test design, missing coverage, and validating a code change."
argument-hint: "[target module / scope to test]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# assay

Build regression tests around observable behaviour and demonstrate that they detect the fault. Use for test design, missing coverage, and validating a code change.

## Inputs

Behaviour or defect to protect; observable acceptance examples; target project; its actual test command and supported test environment.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

Before starting, inspect the project and bind `TEST_CMD` to its real trusted command with `--var 'TEST_CMD=<actual command>'`. Do not use an echo/no-op to produce a green result. `checklist resume "$RUN" --var 'TEST_CMD=<new command>'` changes the binding and invalidates earlier readings; commands and output are stored locally, so do not bind secrets.

## Procedure

### contract

Translate the requirement into examples and identify the cheapest level that observes the real behaviour. Name external boundaries and decide which may be substituted without replacing the subject of the test.

Record these artifacts after doing the work:

- Acceptance examples name observable outcomes and relevant edge cases.
  `checklist check contract behaviour --run "$RUN" --evidence "<artifact and observation>"`
- Test level and any doubles preserve the behaviour under test.
  `checklist check contract boundary --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance contract --run "$RUN"`.

### exercise

Write the smallest useful regression. Observe it fail for the intended reason before fixing the implementation, or introduce a controlled fault if the feature already works. Restore the code exactly, then run the selected suite.

Record these artifacts after doing the work:

- The test failed on the targeted fault, not on setup or unrelated breakage.
  `checklist check exercise red --run "$RUN" --evidence "<artifact and observation>"`
- Controlled faults are removed and the intended implementation is restored.
  `checklist check exercise restored --run "$RUN" --evidence "<artifact and observation>"`

Run the bound sensor: `checklist verify exercise --run "$RUN"`. A failed or unavailable command is not a successful review.

When this stage is fulfilled: `checklist advance exercise --run "$RUN"`.

### handoff

Review whether assertions survive a legitimate refactor, remove redundant fixtures, and report exactly what ran. Leave new tests in the repository.

Record these artifacts after doing the work:

- Regression tests are retained with maintainable fixtures.
  `checklist check handoff durable --run "$RUN" --evidence "<artifact and observation>"`
- Result summary distinguishes executed checks, exclusions, and remaining risk.
  `checklist check handoff limits --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

If the environment is unavailable, keep the test and report it unrun; do not record a passing sensor. For nondeterministic behaviour, control seeds/time or use a justified statistical assertion instead of repeating until green.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A retained test that has been seen to fail and then pass, plus suite results and named gaps. Groundwork supplies acceptance examples; this skill does not invent missing requirements.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent test smells](references/agent-test-smells.md)
- [coverage and mutation](references/coverage-and-mutation.md)
- [decision tree](references/decision-tree.md)
- [determinism and flakiness](references/determinism-and-flakiness.md)
- [evidence catalogue](references/evidence-catalogue.md)
- [language norms](references/language-norms.md)
- [parallel execution](references/parallel-execution.md)
- [probe construction](references/probe-construction.md)
- [property based](references/property-based.md)
- [test doubles](references/test-doubles.md)

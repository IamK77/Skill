---
name: gauge
description: "Install or tune useful static feedback for a codebase and verify that it catches representative mistakes. Use for type-checking and lint feedback loops, not claims that static checks prove correctness."
argument-hint: "[project / module to gauge]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# gauge

Install or tune useful static feedback for a codebase and verify that it catches representative mistakes. Use for type-checking and lint feedback loops, not claims that static checks prove correctness.

## Inputs

Target language/toolchain; existing diagnostics and configuration; failures worth preventing; actual static-check command.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

Before starting, inspect the project and bind `TYPECHECK_CMD` to its real trusted command with `--var 'TYPECHECK_CMD=<actual command>'`. Do not use an echo/no-op to produce a green result. `checklist resume "$RUN" --var 'TYPECHECK_CMD=<new command>'` changes the binding and invalidates earlier readings; commands and output are stored locally, so do not bind secrets.

## Procedure

### baseline

Read existing tool configuration and measure the present diagnostic baseline. Choose a feedback loop for errors that matter in this project, not a generic strictness score.

Record these artifacts after doing the work:

- Current configuration and diagnostic baseline are recorded.
  `checklist check baseline baseline --run "$RUN" --evidence "<artifact and observation>"`
- Target error classes and acceptable adoption scope are named.
  `checklist check baseline goal --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance baseline --run "$RUN"`.

### configure

Make a focused configuration or typing change. Introduce a representative error, confirm the tool reports it, then restore the file and run the real check. Document suppressions individually.

Record these artifacts after doing the work:

- A representative mistake was detected and the probe restored.
  `checklist check configure sensitivity --run "$RUN" --evidence "<artifact and observation>"`
- New suppressions or exclusions have explicit reasons.
  `checklist check configure exceptions --run "$RUN" --evidence "<artifact and observation>"`

Run the bound sensor: `checklist verify configure --run "$RUN"`. A failed or unavailable command is not a successful review.
Only if the check genuinely does not apply: `checklist na configure static-checker-green --run "$RUN" --reason "<scope reason>"`. N/A stays distinct from pass.

When this stage is fulfilled: `checklist advance configure --run "$RUN"`.

### handoff

Connect the same command to the developer workflow or CI when requested. Explain which runtime behaviours still need tests.

Record these artifacts after doing the work:

- Reproducible invocation and integration location are documented.
  `checklist check handoff workflow --run "$RUN" --evidence "<artifact and observation>"`
- Static guarantees and unchecked runtime behaviour are distinguished.
  `checklist check handoff ceiling --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

If adopting strict checks would bury the target work in unrelated errors, use a documented incremental boundary. An unavailable tool is an error or an explicit N/A, never a green check.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A working feedback loop with demonstrated sensitivity and a documented ceiling. Assay covers behavioural claims that static feedback cannot establish.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Designing a useful feedback loop](references/agent-feedback-shifts.md)
- [Choose a feedback source for a specific mistake](references/decision-tree.md)
- [Combine observations without confusing their scope](references/feedback-sources.md)
- [State what a static check actually establishes](references/honest-ceiling.md)
- [A Python feedback loop that fits the project](references/python-recipe.md)
- [A TypeScript feedback loop that reaches consumers](references/typescript-recipe.md)

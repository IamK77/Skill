---
name: flightline
description: "Prepare a reviewable, reproducible change and delivery pipeline. Use for repository hygiene, CI work, or release preparation without implying permission to commit, push, or deploy."
argument-hint: "[project / practice area to set up or harden]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# flightline

Prepare a reviewable, reproducible change and delivery pipeline. Use for repository hygiene, CI work, or release preparation without implying permission to commit, push, or deploy.

## Inputs

Change scope; repository conventions; current branch and worktree; expected lint/build/test commands; requested delivery boundary.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

Before starting, inspect the project and bind `LINT_CMD` to its real trusted command with `--var 'LINT_CMD=<actual command>'`. Do not use an echo/no-op to produce a green result. `checklist resume "$RUN" --var 'LINT_CMD=<new command>'` changes the binding and invalidates earlier readings; commands and output are stored locally, so do not bind secrets.

## Procedure

### scope

Inspect the current worktree and separate the requested change from unrelated edits. Read the repository contribution and dependency conventions; identify the intended review or delivery boundary.

Record these artifacts after doing the work:

- Branch, existing changes, and ownership boundaries are recorded.
  `checklist check scope worktree --run "$RUN" --evidence "<artifact and observation>"`
- Required checks and the requested delivery boundary are known.
  `checklist check scope contract --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance scope --run "$RUN"`.

### prepare

Make a focused change, keep generated artifacts aligned with source, and ensure dependency changes are reproducible. Run the real formatter/linter and relevant build/test commands; inspect their outputs rather than accepting a wrapper exit blindly.

Record these artifacts after doing the work:

- The diff is focused and includes required source/generated artifacts.
  `checklist check prepare diff --run "$RUN" --evidence "<artifact and observation>"`
- Build and dependency reproduction evidence is recorded.
  `checklist check prepare repro --run "$RUN" --evidence "<artifact and observation>"`

Run the bound sensor: `checklist verify prepare --run "$RUN"`. A failed or unavailable command is not a successful review.
Only if the check genuinely does not apply: `checklist na prepare lint-green --run "$RUN" --reason "<scope reason>"`. N/A stays distinct from pass.

When this stage is fulfilled: `checklist advance prepare --run "$RUN"`.

### handoff

Summarise the change, checks, risks, and rollback approach for review. Stop at the requested boundary: preparing a commit is not permission to push it.

Record these artifacts after doing the work:

- Review notes include exact check results and unresolved issues.
  `checklist check handoff review --run "$RUN" --evidence "<artifact and observation>"`
- Any external delivery action has separate authorisation or is explicitly left pending.
  `checklist check handoff delivery --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

If no meaningful linter exists, mark only that sensor N/A with the reason and record the checks actually used. Do not install tools or rewrite repository conventions merely to satisfy a template.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A reviewable diff and reproducible verification record. Committing, pushing, publishing, and deploying remain separate decisions.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [A reproducible path from change to delivery](references/agent-era-shifts.md)
- [A reproducible delivery pipeline](references/ci-cd.md)
- [Keep style feedback useful and local](references/code-style.md)
- [Size delivery preparation to the task](references/decision-tree.md)
- [Reproduce the dependency graph you intend to ship](references/dependencies-and-reproducibility.md)
- [Review the intended behaviour and its evidence](references/review-practice.md)
- [Record focused work without losing existing changes](references/version-control.md)

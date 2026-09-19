---
name: keel
description: "Build a walking skeleton for one selected frontend journey across real integration seams. Use to establish an end-to-end path, not for ordinary CSS questions or speculative architecture."
argument-hint: "[the project or architecture to prove end-to-end with a walking skeleton]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# keel

Build a walking skeleton for one selected frontend journey across real integration seams. Use to establish an end-to-end path, not for ordinary CSS questions or speculative architecture.

## Inputs

Chosen journey and acceptance example; target project; API/data contract; environment and deployment constraints.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### seams

Map the selected journey from user action through UI, service, persistence, and return path. Name uncertain integration seams and choose the smallest slice that exercises them.

Record these artifacts after doing the work:

- One concrete user journey and its acceptance outcome are agreed.
  `checklist check seams journey --run "$RUN" --evidence "<artifact and observation>"`
- Integration seams and contract assumptions are explicit.
  `checklist check seams seams --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance seams --run "$RUN"`.

### slice

Implement the thin path using real contracts. If a service is unavailable, use a clearly labelled contract-faithful substitute and retain the unresolved integration task.

Record these artifacts after doing the work:

- The thin user-visible path runs through the intended seams.
  `checklist check slice path --run "$RUN" --evidence "<artifact and observation>"`
- Contracts are checked and substitutions or unresolved seams are named.
  `checklist check slice contract --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance slice --run "$RUN"`.

### handoff

Run the path from documented setup and exercise a failure case. Leave enough setup and observation guidance that another contributor can reproduce the result.

Record these artifacts after doing the work:

- The selected journey can be run from documented setup.
  `checklist check handoff reproduce --run "$RUN" --evidence "<artifact and observation>"`
- Failure behaviour and remaining integration gaps are recorded.
  `checklist check handoff limits --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

Do not turn a skeleton into the whole product. Routine layout or styling fixes should be handled directly. Bearings is optional exploration when the journey itself is unsettled.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A reproducible thin vertical slice and a seam-risk record. Seaworthy and trials can extend robustness and regression coverage.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Keep the client/server seam inspectable](references/contracts-that-cant-drift.md)
- [Implement the chosen spatial relationship](references/css-layout-and-space.md)
- [Trace one thin journey across its seams](references/seam-checklist.md)
- [Accept the thin slice at its stated boundary](references/skeleton-acceptance.md)
- [A thin slice through real integration seams](references/the-membrane.md)

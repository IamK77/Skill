---
name: husbandry
description: "Perform evidence-led maintenance and refactoring while preserving required behaviour. Use for cleanup, migration, and reducing an identified maintenance burden."
argument-hint: "[system / module to maintain & evolve]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# husbandry

Perform evidence-led maintenance and refactoring while preserving required behaviour. Use for cleanup, migration, and reducing an identified maintenance burden.

## Inputs

Target maintenance problem; behaviour that must remain; current tests; dependency and compatibility constraints; rollback requirements.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### locate

Locate the actual maintenance burden in code and change history. Decide what is intentionally preserved and what can change; separate cleanup from feature work.

Record these artifacts after doing the work:

- Concrete code or change evidence identifies the maintenance problem.
  `checklist check locate burden --run "$RUN" --evidence "<artifact and observation>"`
- Preserved behaviour and compatibility boundaries are explicit.
  `checklist check locate invariants --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance locate --run "$RUN"`.

### change

Add a characterization test where coverage is insufficient. Make small coherent changes, remove superseded paths, and run the tests that protect the boundary.

Record these artifacts after doing the work:

- Characterization or regression tests protect the affected behaviour.
  `checklist check change safety --run "$RUN" --evidence "<artifact and observation>"`
- The intended simplification is implemented without unexplained parallel paths.
  `checklist check change refactor --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance change --run "$RUN"`.

### handoff

Inspect the final diff for accidental behavioural changes and document migration or rollback steps where needed.

Record these artifacts after doing the work:

- Before/after verification results and any gaps are recorded.
  `checklist check handoff verification --run "$RUN" --evidence "<artifact and observation>"`
- Consumers can adopt or roll back the change with known limitations.
  `checklist check handoff migration --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

If the change exposes an unresolved product decision, pause for that decision rather than hiding it in a refactor. Broad rewrites require evidence that a smaller coherent change is insufficient.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A maintainable change with preserved-behaviour evidence and a clear migration boundary.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Maintenance decisions grounded in change cost](references/agent-era-shifts.md)
- [Choose a maintenance change for an observed cost](references/decision-tree.md)
- [From a reported symptom to a retained regression](references/defect-management.md)
- [Retire obsolete paths without losing necessary knowledge](references/knowledge-legacy-and-retirement.md)
- [Name the kind of change and its preserved contract](references/maintenance-types-and-stance.md)
- [Preserve behaviour while changing structure](references/refactoring.md)
- [Make a maintenance tradeoff inspectable](references/technical-debt.md)
- [Maintain compatibility through a dependency or API change](references/versioning-and-dependencies.md)

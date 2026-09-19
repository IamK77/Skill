---
name: forge
description: "Execute a defined research experiment with traceable inputs, configurations, runs, and outputs. Use for experiment implementation and reproducibility, not to invent the research claim."
argument-hint: "[the method/protocol to harden and run, or the experiment-run problem you're stuck on]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# forge

Execute a defined research experiment with traceable inputs, configurations, runs, and outputs. Use for experiment implementation and reproducibility, not to invent the research claim.

## Inputs

Versioned experimental plan; implementation; data access; environment; compute authorisation and budget.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### prepare

Match code, data, and configuration to the plan. Run a small end-to-end sanity check and verify that metrics and failure records have the intended meaning.

Record these artifacts after doing the work:

- Code, data, environment, and plan versions are recorded.
  `checklist check prepare inputs --run "$RUN" --evidence "<artifact and observation>"`
- A small end-to-end run validates data flow and metric computation.
  `checklist check prepare sanity --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance prepare --run "$RUN"`.

### execute

Run within the agreed budget. Preserve seeds, commands, logs, failed runs, and deviations; checkpoint where useful. Keep exploratory adjustments separate from the committed comparison.

Record these artifacts after doing the work:

- Successful and failed runs have reproducible configurations and logs.
  `checklist check execute runs --run "$RUN" --evidence "<artifact and observation>"`
- Plan deviations and data-boundary checks are recorded.
  `checklist check execute integrity --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance execute --run "$RUN"`.

### package

Regenerate at least a representative result from saved inputs and document the remaining reproduction cost. Package raw-to-summary transformations, not only final charts.

Record these artifacts after doing the work:

- A representative result was regenerated from recorded inputs.
  `checklist check package reproduction --run "$RUN" --evidence "<artifact and observation>"`
- Run manifest and analysis inputs are available for independent review.
  `checklist check package artifacts --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance package --run "$RUN"`.

## Branches

If resources or data are unavailable, report the blocked run rather than substitute synthetic results silently. A method change that changes the comparison returns to ledger for a new plan version.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A traceable experiment artifact set for reckoning and envoy; resource use stays within explicit authorisation.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Preserve the identity and failures of a research run](references/harden-and-provenance.md)
- [Validate the path from input data to reported metric](references/pipeline-and-integrity.md)
- [Regenerate a result from retained artifacts](references/regeneration-and-repro.md)
- [Execute a plan without hiding methodological changes](references/why-operator-not-developer.md)

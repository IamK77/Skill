---
name: touchstone
description: "Evaluate a specific software project for a stated use using source, maintenance, compatibility, and trial evidence. This is a repository-assessment skill, not the root A/B experiment platform."
argument-hint: "[a repo (or batch / forage shortlist) to evaluate, and what you'd use it for]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# touchstone

Evaluate a specific software project for a stated use using source, maintenance, compatibility, and trial evidence. This is a repository-assessment skill, not the root A/B experiment platform.

## Inputs

Candidate repository/version; intended use and risk tolerance; required features; deployment/licence constraints; evaluation budget.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### fit

State the adoption decision and non-negotiable constraints. Record the exact version or revision and sources inspected; distinguish the project’s claims from observed behaviour.

Record these artifacts after doing the work:

- Use case, constraints, and evaluation scope are defined.
  `checklist check fit decision --run "$RUN" --evidence "<artifact and observation>"`
- Candidate revision and dated primary sources are recorded.
  `checklist check fit identity --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance fit --run "$RUN"`.

### inspect

Inspect implementation, tests, dependency/licence information, releases, and issue/maintenance evidence relevant to the use. Run a bounded representative trial if feasible. Popularity is context, not proof.

Record these artifacts after doing the work:

- Relevant capabilities and risks have inspectable source evidence.
  `checklist check inspect evidence --run "$RUN" --evidence "<artifact and observation>"`
- Representative trial results or explicit untested limitations are recorded.
  `checklist check inspect trial --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance inspect --run "$RUN"`.

### verdict

Separate capability, adoption cost, and maintenance risk. Recommend adopt, trial further, defer, or reject with conditions and uncertainties; do not compress incomparable concerns into an unexplained score.

Record these artifacts after doing the work:

- Capability, cost, and maintenance tradeoffs are explicit.
  `checklist check verdict tradeoffs --run "$RUN" --evidence "<artifact and observation>"`
- Recommendation follows the intended use and cites decisive evidence.
  `checklist check verdict recommendation --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance verdict --run "$RUN"`.

## Branches

For high-cost or safety-sensitive adoption, raise the evidence threshold and name expert review needs. Missing evidence is unknown, not automatically failure or trustworthiness.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A use-specific, evidence-linked recommendation and a reversible next step. This skill remains supported independently of the retired root touchstone experiment platform.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Make a use-specific adoption recommendation](references/scoring-and-verdict.md)
- [Weight observations by their connection to the decision](references/signal-weighting-and-slop.md)
- [Inspect maintenance and compatibility where they matter](references/the-dashboard-sweep.md)
- [Treat popularity and polish as leads, not verdicts](references/why-the-gameable-signals-lie.md)

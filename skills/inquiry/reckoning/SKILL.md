---
name: reckoning
description: "Analyse research results against the recorded plan, inspect failure patterns, and bound the claims. Use for evidence review before writing or making a research decision."
argument-hint: "[the results to analyze, or the analysis/claim/figure you're stuck on]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# reckoning

Analyse research results against the recorded plan, inspect failure patterns, and bound the claims. Use for evidence review before writing or making a research decision.

## Inputs

Experimental plan; raw results and run manifest; deviations; analysis code; intended claim.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### audit

Check that runs, exclusions, and metric definitions match the plan. Identify missing or failed runs and data leakage concerns before estimating an effect.

Record these artifacts after doing the work:

- Included, excluded, failed, and missing runs are accounted for.
  `checklist check audit population --run "$RUN" --evidence "<artifact and observation>"`
- Metric definitions and deviations are checked against the plan.
  `checklist check audit protocol --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance audit --run "$RUN"`.

### analyse

Inspect distributions and meaningful subgroups, estimate uncertainty appropriately, and test plausible alternative explanations. Distinguish exploratory discoveries from planned comparisons.

Record these artifacts after doing the work:

- Effect estimates, uncertainty, and failure regimes are documented.
  `checklist check analyse effect --run "$RUN" --evidence "<artifact and observation>"`
- Ablations or other evidence address plausible alternative explanations.
  `checklist check analyse alternatives --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance analyse --run "$RUN"`.

### conclude

Write the narrowest claim the evidence supports, the strongest counterevidence, and the limitations. Preserve analysis code and the link from statements to artifacts.

Record these artifacts after doing the work:

- Claims distinguish observations, interpretations, and uncertainty.
  `checklist check conclude claim --run "$RUN" --evidence "<artifact and observation>"`
- Conclusions link to retained analysis and source artifacts.
  `checklist check conclude trace --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance conclude --run "$RUN"`.

## Branches

If the run is compromised, recommend a corrected plan or rerun; do not rescue it with unreported exclusions. A null or negative result is a valid conclusion.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

An evidence-linked analysis and bounded claim set that envoy can communicate without overstating the findings.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [distribution and statistics](references/distribution-and-statistics.md)
- [forking garden and redteam](references/forking-garden-and-redteam.md)
- [mechanism probes](references/mechanism-probes.md)
- [why audit not celebrate](references/why-audit-not-celebrate.md)

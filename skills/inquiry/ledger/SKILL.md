---
name: ledger
description: "Write a reproducible experimental plan for a chosen research question. Use after direction selection to define comparisons, data boundaries, metrics, and resource limits."
argument-hint: "[the method to design experiments for, or an experiment protocol to stress-test]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# ledger

Write a reproducible experimental plan for a chosen research question. Use after direction selection to define comparisons, data boundaries, metrics, and resource limits.

## Inputs

Chosen hypothesis; method candidates and baselines; available data; resource budget; decision the experiment should inform.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### question

State the claim under test and plausible alternatives. Define what observation would weaken it, and which comparison distinguishes the mechanisms.

Record these artifacts after doing the work:

- Hypothesis, alternatives, and falsifying outcomes are explicit.
  `checklist check question claim --run "$RUN" --evidence "<artifact and observation>"`
- Baselines and comparisons address the stated claim.
  `checklist check question comparison --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance question --run "$RUN"`.

### design

Specify data partitions, sampling, seeds, metrics, uncertainty treatment, ablations, and stopping/resource limits. Keep exploratory work distinct from final evaluation.

Record these artifacts after doing the work:

- Data boundaries, metrics, repetitions, and analysis are specified.
  `checklist check design protocol --run "$RUN" --evidence "<artifact and observation>"`
- Ablations, stopping conditions, and resource limits are recorded.
  `checklist check design budget --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance design --run "$RUN"`.

### freeze

Review feasibility and leakage risks, then version the agreed plan before the committed run. Record later deviations rather than rewriting the original plan to fit results.

Record these artifacts after doing the work:

- Feasibility and leakage review issues are resolved or named.
  `checklist check freeze review --run "$RUN" --evidence "<artifact and observation>"`
- The agreed plan is versioned with a deviation-recording convention.
  `checklist check freeze version --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance freeze --run "$RUN"`.

## Branches

When the mechanism is still unsettled, return to prospect or crucible. Small feasibility experiments may precede commitment, but label their role and do not present them as untouched evaluation data.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A versioned plan that forge can execute and reckoning can audit, with no fabricated results.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [ablation sensitivity budget](references/ablation-sensitivity-budget.md)
- [instances and baselines](references/instances-and-baselines.md)
- [matrix and firewall](references/matrix-and-firewall.md)
- [metrics and statistics](references/metrics-and-statistics.md)

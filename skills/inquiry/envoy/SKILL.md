---
name: envoy
description: "Turn a validated research record into a clear manuscript or response. Use for research communication, preserving claim-to-evidence links and explicit author decisions."
argument-hint: "[the analyzed results/paper to write up, or the writing/venue/rebuttal problem you're stuck on]"
metadata:
  kind: sop
disable-model-invocation: true
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# envoy

Turn a validated research record into a clear manuscript or response. Use for research communication, preserving claim-to-evidence links and explicit author decisions.

## Inputs

Claim set and limitations; experiment artifacts; target audience or venue; authorship and submission constraints.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### structure

Identify the reader’s question and organise the argument around supported claims. Separate contribution, method, evidence, and limitations before polishing prose.

Record these artifacts after doing the work:

- Outline connects the contribution to supported claims.
  `checklist check structure argument --run "$RUN" --evidence "<artifact and observation>"`
- Each factual claim has an attributable source or experiment artifact.
  `checklist check structure sources --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance structure --run "$RUN"`.

### draft

Write the argument, figures, and methods with enough detail to inspect or reproduce the work. Verify citations and numeric consistency; never manufacture references, experiments, or author statements.

Record these artifacts after doing the work:

- Draft and figures faithfully represent the research record.
  `checklist check draft manuscript --run "$RUN" --evidence "<artifact and observation>"`
- Citations, numbers, methods, and limitations were cross-checked.
  `checklist check draft integrity --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance draft --run "$RUN"`.

### review

Review against the actual target requirements and obtain author decisions on contentious claims. Prepare submission or response material; do not submit or contact others without explicit permission.

Record these artifacts after doing the work:

- Author review and unresolved issues are recorded.
  `checklist check review review --run "$RUN" --evidence "<artifact and observation>"`
- Requested manuscript or response package is complete for human review.
  `checklist check review package --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance review --run "$RUN"`.

## Branches

For a rebuttal, answer the actual comment with evidence and mark new work clearly; no universal response deadline is assumed. If evidence is missing, narrow the claim or request the experiment.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A reviewable communication package. Submission, publication, and external correspondence require separate authorisation.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent and the three redlines](references/agent-and-the-three-redlines.md)
- [skeleton and sections](references/skeleton-and-sections.md)
- [submit rebut persist](references/submit-rebut-persist.md)
- [why the paper already exists](references/why-the-paper-already-exists.md)

---
name: aegis
description: "Run a scoped defensive security review and remediation workflow. Produce a threat model, reproducible findings, tested changes, and residual-risk handoff."
argument-hint: "[system / feature / scope to secure]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# aegis

Run a scoped defensive security review and remediation workflow. Produce a threat model, reproducible findings, tested changes, and residual-risk handoff.

## Inputs

Target repository or design; assets and trust boundaries; authorised test scope; deployment context. Establish the real dependency-scan command before running it.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

Before starting, inspect the project and bind `SCA_CMD` to its real trusted command with `--var 'SCA_CMD=<actual command>'`. Do not use an echo/no-op to produce a green result. `checklist resume "$RUN" --var 'SCA_CMD=<new command>'` changes the binding and invalidates earlier readings; commands and output are stored locally, so do not bind secrets.

## Procedure

### scope

Map entry points, sensitive assets, identities, and trust boundaries. Agree which systems and test actions are in scope; a local review does not authorise production probing.

Record these artifacts after doing the work:

- Threat model identifies assets, entry points, and trust boundaries.
  `checklist check scope boundary --run "$RUN" --evidence "<artifact and observation>"`
- Test scope and allowed actions are recorded.
  `checklist check scope permission --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance scope --run "$RUN"`.

### defend

Follow the highest-impact abuse paths into actual code. Reproduce safely, repair the responsible boundary, and retain a regression. Run the project dependency scanner; distinguish a negative finding from an unavailable scanner.

Record these artifacts after doing the work:

- Each finding has a reachable path, impact, and reproducible evidence.
  `checklist check defend findings --run "$RUN" --evidence "<artifact and observation>"`
- Changes and regression results are recorded, with unresolved findings explicit.
  `checklist check defend repairs --run "$RUN" --evidence "<artifact and observation>"`

Run the bound sensor: `checklist verify defend --run "$RUN"`. A failed or unavailable command is not a successful review.
Only if the check genuinely does not apply: `checklist na defend dependency-scan-clean --run "$RUN" --reason "<scope reason>"`. N/A stays distinct from pass.

When this stage is fulfilled: `checklist advance defend --run "$RUN"`.

### handoff

Separate fixed, mitigated, unverified, and accepted risks. Name an owner and next action for each remaining material issue; do not turn scanner success into a blanket security claim.

Record these artifacts after doing the work:

- Residual risks and validation limits are explicit.
  `checklist check handoff risk --run "$RUN" --evidence "<artifact and observation>"`
- Review report links findings, changes, and test artifacts.
  `checklist check handoff report --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

For design-only work, produce attack scenarios and proposed controls rather than claiming fixes. A dependency scan may be N/A only with a recorded scope reason. Exploitation outside the agreed scope requires fresh permission.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A review report with a bounded conclusion; remediation evidence where changes were requested. Gungnir can investigate a selected authorised attack path separately.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [agent era shifts](references/agent-era-shifts.md)
- [decision tree](references/decision-tree.md)
- [operate and respond](references/operate-and-respond.md)
- [principles and stance](references/principles-and-stance.md)
- [secure coding](references/secure-coding.md)
- [secure design](references/secure-design.md)
- [security testing and gates](references/security-testing-and-gates.md)
- [threat modeling](references/threat-modeling.md)

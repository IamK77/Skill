---
name: bulwark
description: "Maintain frontend module boundaries and reusable design artifacts with demonstrable checks. Use for architecture erosion, stale abstractions, and design-system integration."
argument-hint: "[the living frontend system to keep changeable as it scales]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# bulwark

Maintain frontend module boundaries and reusable design artifacts with demonstrable checks. Use for architecture erosion, stale abstractions, and design-system integration.

## Inputs

Observed maintenance problem; affected modules/components; current dependency rules and tests; ownership and compatibility constraints.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### locate

Identify a concrete boundary violation, duplication, or maintenance bottleneck. Trace affected consumers and decide which behaviour and APIs must remain stable.

Record these artifacts after doing the work:

- The maintenance problem is supported by concrete code/change evidence.
  `checklist check locate problem --run "$RUN" --evidence "<artifact and observation>"`
- Affected consumers and compatibility boundaries are known.
  `checklist check locate consumers --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance locate --run "$RUN"`.

### repair

Make a coherent boundary or component change. Add a targeted import/contract/regression check and deliberately violate the rule to show the check catches it; restore the code afterward.

Record these artifacts after doing the work:

- The responsible boundary or abstraction is repaired.
  `checklist check repair change --run "$RUN" --evidence "<artifact and observation>"`
- A retained check detects a representative violation and the probe is restored.
  `checklist check repair guard --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance repair --run "$RUN"`.

### handoff

Verify consumers and update usage examples or migration notes. Assign unresolved cross-team changes to an owner rather than hiding them in a local rule.

Record these artifacts after doing the work:

- Affected consumers and relevant checks were exercised.
  `checklist check handoff consumers --run "$RUN" --evidence "<artifact and observation>"`
- Usage, migration guidance, and unresolved ownership are documented.
  `checklist check handoff migration --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

Do not extract a framework solely to eliminate visual repetition. Systems provides selected tokens/component contracts; this SOP integrates and protects them rather than dictating creative direction.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A boundary-preserving maintenance change with a meaningful retained check and consumer migration evidence.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open only the techniques relevant to the current step. Older essays are background, not extra required gates; this entrypoint defines the workflow.

- [conway and design system](references/conway-and-design-system.md)
- [enforce boundaries](references/enforce-boundaries.md)
- [frontend dx](references/frontend-dx.md)
- [frontend security](references/frontend-security.md)
- [prune](references/prune.md)
- [the membrane](references/the-membrane.md)

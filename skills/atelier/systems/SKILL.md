---
name: systems
description: "Turn a selected visual direction into versioned tokens, reusable components, and an inspectable handoff. Use for design-system implementation, not to choose the creative direction by checklist."
argument-hint: "[the design system / component library / token architecture to make non-drifting]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# systems

Turn a selected visual direction into versioned tokens, reusable components, and an inspectable handoff. Use for design-system implementation, not to choose the creative direction by checklist.

## Inputs

Selected direction or existing design language; target platforms; real component use cases; token and ownership constraints.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### contract

Inventory the selected decisions and actual consumers. Define primitive/semantic token roles, component responsibilities, and the source that owns each value; keep exceptions explicit.

Record these artifacts after doing the work:

- Token roles and representative component use cases are specified.
  `checklist check contract roles --run "$RUN" --evidence "<artifact and observation>"`
- Sources of truth, consumers, and exceptions are named.
  `checklist check contract ownership --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance contract --run "$RUN"`.

### implement

Implement tokens and representative components, including important states and themes. Build living examples and exercise the actual consuming code; avoid parallel hand-maintained copies.

Record these artifacts after doing the work:

- Tokens and representative components exist as reusable artifacts.
  `checklist check implement artifacts --run "$RUN" --evidence "<artifact and observation>"`
- Live examples cover relevant states, themes, and consumer integration.
  `checklist check implement examples --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance implement --run "$RUN"`.

### handoff

Compare the implemented examples with the chosen direction and measure the requirements that apply. Record versioning, migration, and contribution rules sized to the project.

Record these artifacts after doing the work:

- Implementation and relevant accessibility/visual checks are recorded.
  `checklist check handoff validation --run "$RUN" --evidence "<artifact and observation>"`
- Usage, ownership, and version/migration guidance are documented.
  `checklist check handoff adoption --run "$RUN" --evidence "<artifact and observation>"`

When this stage is fulfilled: `checklist advance handoff --run "$RUN"`.

## Branches

A small product may need a token file and a few examples, not a platform. If creative direction is still open, use canon or another heuristic lens without demanding an upstream approval certificate.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

An inspectable token/component package and adoption guidance. Surface bulwark can maintain its code boundaries after adoption.

After all required work and stage closures is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Hand off a selected visual direction as inspectable artifacts](references/design-to-code-handoff.md)
- [Examples that exercise real reusable components](references/the-living-component-library.md)
- [Semantic tokens with explicit ownership](references/token-architecture-one-source.md)

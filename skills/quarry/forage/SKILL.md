---
name: forage
description: "Find and capture a bounded shortlist of software projects for a concrete need. Use for repository discovery, with dated sources and an explicit search stopping point."
argument-hint: "[a concrete need to hunt for, or a domain/vibe to wander — or nothing, to just browse]"
metadata:
  kind: sop
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# forage

Find and capture a bounded shortlist of software projects for a concrete need. Use for repository discovery, with dated sources and an explicit search stopping point.

## Inputs

Problem to solve; runtime and licence constraints; acceptable maturity; search budget and shortlist size.

## Run record

Use checklist 0.5 or newer for this SOP. Reading or reloading the skill must not reset work. For a new task, run `checklist init "${CLAUDE_SKILL_DIR}" --new --path "/absolute/project"`; retain its returned ID as `RUN`. For existing work, use `checklist resume "$RUN"`, then `checklist show --run "$RUN"`. Outside Claude, replace the skill-directory variable with this directory’s actual path.

Commands below record work after it is done. Replace evidence placeholders with concise artifact locations and observations. Manual confirmations are not independent proof; a sensor pass covers only the command and inputs it observed. `verify` does not close a stage; `advance` checks that its required readings are fulfilled. Use `report --run "$RUN"` for the retained history.

## Procedure

### main

Define inclusion and exclusion criteria, then search several relevant surfaces: code/package indexes, dependency graphs, discussions, or neighbouring projects. Follow useful leads within the time budget. Inspect candidate source material and capture why each remains plausible.

Record these artifacts after doing the work:

- Need, constraints, and search budget are explicit.
  `checklist check main criteria --run "$RUN" --evidence "<artifact and observation>"`
- Queries and consulted sources are recorded with dates.
  `checklist check main search --run "$RUN" --evidence "<artifact and observation>"`
- Candidates include direct sources, fit, and disqualifying uncertainties.
  `checklist check main shortlist --run "$RUN" --evidence "<artifact and observation>"`
- Shortlist separates discovery from adoption recommendations.
  `checklist check main handoff --run "$RUN" --evidence "<artifact and observation>"`

## Branches

Stop when the agreed search budget or useful shortlist is reached. If no candidate fits, return the negative result and missing capability rather than padding the list. Current claims require current source checks.

If an input or permission is missing, name the blocker and leave the relevant item pending. A changed requirement may need a new run; an accepted checklist edit uses `resume "$RUN" --refresh` and requires fresh readings. To abandon work, use `checklist reset --run "$RUN" --reason "<reason>"`; history is retained.

## Completion

A bounded, dated shortlist. Quarry touchstone can investigate adoption risk for selected candidates; discovery alone is not an endorsement.

After all required work is recorded, use `checklist done --run "$RUN"`. This archives the result without deleting its history; it does not authorise any external action.

## Reference shelf

Open the technique relevant to the current step. These notes provide concrete methods and examples, not additional phases; this entrypoint defines the run's completion conditions.

- [Capture a shortlist with evidence and uncertainty](references/sift-and-capture.md)
- [Search around the actual missing capability](references/the-seams-and-syntax.md)
- [Follow useful leads across different discovery surfaces](references/the-wandering-surfaces.md)
- [Discovery before commitment](references/why-mine-and-wander.md)

---
name: pilot
description: "Route surface work to an execution SOP, a creative heuristic, or a direct answer. Use when the needed kind of help is unclear; do not impose a suite-wide pipeline."
argument-hint: "[the frontend task, goal, or confusion you want routed]"
metadata:
  kind: router
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# pilot

Route surface work to an execution SOP, a creative heuristic, or a direct answer. Use when the needed kind of help is unclear; do not impose a suite-wide pipeline.

## Choose the kind of help

- A chosen outcome needing steps, artifacts, and verification: suggest the smallest relevant SOP.
- An open question, stuck framing, or desire for possibilities: suggest a heuristic. Explore rather than inspect every dimension.
- A small factual, syntax, or local implementation question: answer directly; no skill is a valid choice.

Ask a short clarifying question only if the distinction changes the work. A router is an auxiliary entrypoint, not a third substantive skill category. It starts no run and requires no CLI to offer directions.

## Map

| Skill | Kind | Use |
| --- | --- | --- |
| [bearings](../bearings/SKILL.md) | heuristic | Explore frontend architecture by reframing journeys, ownership, and the experience of time. |
| [bulwark](../bulwark/SKILL.md) | sop | Maintain frontend module boundaries and reusable design artifacts with demonstrable checks. |
| [keel](../keel/SKILL.md) | sop | Build a walking skeleton for one selected frontend journey across real integration seams. |
| [livery](../livery/SKILL.md) | heuristic | Explore coherent visual directions across colour, type, space, form, imagery, and motion. |
| [lookout](../lookout/SKILL.md) | sop | Establish delivery observation and decision-linked frontend telemetry for a chosen release. |
| [seaworthy](../seaworthy/SKILL.md) | sop | Harden a selected frontend journey across async states, recovery, accessibility, and performance constraints. |
| [trials](../trials/SKILL.md) | sop | Build frontend regression tests that observe real user behaviour and survive implementation refactors. |
| [wellspring](../wellspring/SKILL.md) | heuristic | Generate alternatives for frontend state and interaction models using ownership, time, and representation shifts. |

## Handoff

Name the selected skill, why it fits, and the concrete input it needs. Suggest a chain only when a real artifact connects its steps. Heuristics have no completion gates and need not converge; begin an SOP only after its target is selected. Check runtime availability only when executing an SOP, not before creative exploration. Never silently install tools or reset an existing run.

Use `livery` for a coherent visual direction and atelier lenses for a specific visual dimension. `keel` is a walking skeleton across integration seams, not a destination for routine CSS questions. `bearings` and `wellspring` explore alternatives; neither is an obligatory prerequisite.

[Suite map](references/suite-map.md).

[Optional handoffs, not a pipeline](references/lifecycle-handbook.md).

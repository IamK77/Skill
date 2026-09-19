---
name: pilot
description: "Route engineering work to an execution SOP, a creative heuristic, or a direct answer. Use when the needed kind of help is unclear; do not impose a suite-wide pipeline."
argument-hint: "[the task, goal, or confusion you want routed]"
metadata:
  kind: router
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# pilot

Route engineering work to an execution SOP, a creative heuristic, or a direct answer. Use when the needed kind of help is unclear; do not impose a suite-wide pipeline.

## Choose the kind of help

- A chosen outcome needing steps, artifacts, and verification: suggest the smallest relevant SOP.
- An open question, stuck framing, or desire for possibilities: suggest a heuristic. Explore rather than inspect every dimension.
- A small factual, syntax, or local implementation question: answer directly; no skill is a valid choice.

Ask a short clarifying question only if the distinction changes the work. A router is an auxiliary entrypoint, not a third substantive skill category. It starts no run and requires no CLI to offer directions.

## Map

| Skill | Kind | Use |
| --- | --- | --- |
| [aegis](../aegis/SKILL.md) | sop | Run a scoped defensive security review and remediation workflow. |
| [assay](../assay/SKILL.md) | sop | Build regression tests around observable behaviour and demonstrate that they detect the fault. |
| [flightline](../flightline/SKILL.md) | sop | Prepare a reviewable, reproducible change and delivery pipeline. |
| [gauge](../gauge/SKILL.md) | sop | Install or tune useful static feedback for a codebase and verify that it catches representative mistakes. |
| [groundwork](../groundwork/SKILL.md) | sop | Turn a request into an agreed, testable task definition. |
| [gungnir](../gungnir/SKILL.md) | sop | Investigate a specifically authorised security hypothesis with minimal, reproducible evidence. |
| [husbandry](../husbandry/SKILL.md) | sop | Perform evidence-led maintenance and refactoring while preserving required behaviour. |
| [load-bearing](../load-bearing/SKILL.md) | heuristic | Explore alternative software architectures through boundaries, reversibility, and borrowed models. |
| [plumb](../plumb/SKILL.md) | heuristic | Generate alternative representations, APIs, and algorithms by changing the way a problem is described. |
| [stationkeeping](../stationkeeping/SKILL.md) | sop | Prepare and execute an explicitly authorised operational change with observability, rollback, and post-change checks. |

## Handoff

Name the selected skill, why it fits, and the concrete input it needs. Suggest a chain only when a real artifact connects its steps. Heuristics have no completion gates and need not converge; begin an SOP only after its target is selected. Check runtime availability only when executing an SOP, not before creative exploration. Never silently install tools or reset an existing run.

For distributed design possibilities, suggest `distributed:holdfast`. Distinguish representation exploration (`plumb`) from installing feedback (`gauge`), and defensive review (`aegis`) from explicitly authorised security investigation (`gungnir`).

[Suite map](references/suite-map.md).

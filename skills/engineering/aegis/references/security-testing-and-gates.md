# Choosing security checks by their observations

## Use when

Use the changed boundary and a question a check can actually answer.

## Method

Static analysis can identify source patterns; dependency analysis can identify relevant package metadata; dynamic testing observes a running target; instrumentation can add execution context. Combine them when their observations complement one another. Validate a new rule with a representative positive and negative fixture, and inspect whether it runs over the intended files or environment.

## Example and record

A static warning about a dangerous sink becomes more useful when a bounded reproduction demonstrates reachability. Conversely, a dynamic scan that never reaches an authenticated route says little about that route. Preserve the warning, reproduction prerequisites, and final disposition together.

## Limits and handoff

Instrumentation does not automatically prove exploitability, and a quiet scanner is not proof of absence. Configure CI enforcement for the project's accepted risks and false-positive handling; do not describe any check as impossible to game.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

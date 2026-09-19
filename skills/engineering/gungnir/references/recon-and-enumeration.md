# Map the authorised attack surface

## Use when

Use the target definition, known assets, and the permitted distinction between local inspection and remote interaction.

## Method

Inspect routes, interfaces, data flows, dependency boundaries, and published configuration relevant to the hypothesis. Label each observation's source and date or revision. Distinguish examining an existing local artifact from making a request to a remote service; even a seemingly passive network request can be logged or have side effects.

## Example and record

A local route table may reveal an alternate handler for the same capability. Follow its policy checks and consumers before making an authorised test request. A guessed hostname or third-party search result is a lead, not proof that an asset belongs to the permitted scope.

## Limits and handoff

Do not treat public visibility as authorisation for active scanning. Stop at uncertain ownership and avoid collecting unrelated data merely because it is discoverable.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

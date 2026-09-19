# Write a task definition someone can verify

## Use when

Use the chosen outcome and resolved acceptance decisions.

## Method

Record inputs, observable outputs, meaningful failure behaviour, constraints, and non-goals. Include examples at the important boundaries and identify affected interfaces. Keep implementation proposals separate unless the chosen technique is itself a requirement. Link acceptance statements to the later test or observation that can support them.

## Example and record

'Reject exports outside the caller's account' can be illustrated by an allowed owned export, a rejected cross-account request, and the expected absence of an export artifact after rejection. The examples make the policy and side-effect boundary inspectable.

## Limits and handoff

A precise document can still contain an unresolved decision; mark it explicitly. Avoid treating a long specification or a checklist completion as evidence that a human agreed to it.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

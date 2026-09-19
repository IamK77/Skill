# Substitute boundaries without replacing the subject

## Use when

Use the behaviour to protect and identify which collaborators are outside the subject's responsibility.

## Method

Use simple fakes for controlled stateful behaviour, stubs for selected responses, and interaction assertions only when the interaction itself is part of the contract. Keep the substitute's interface aligned with the real collaborator. Prefer at least one integration check at important seams so an independently plausible fake cannot drift unnoticed.

## Example and record

A payment adapter test may verify its request and response translation against a recorded contract. A domain refund test can use a failing adapter to exercise recovery. Neither test alone proves that the real remote service accepts the request in production.

## Limits and handoff

Over-mocking can make every internal refactor break tests while real integration defects remain invisible. Keep doubles narrow, representative, and explicit about what they do not simulate.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

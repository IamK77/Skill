# Preserve user intent across form and connectivity states

## Use when

Use the form's actual save, validation, retry, persistence, and connectivity expectations.

## Method

Separate a local draft from the accepted server value and define what refresh, retry, cancellation, and conflicting edits mean. Make validation and submission results understandable without discarding relevant input. If offline work is required, specify storage, reconciliation, and failure behaviour; otherwise define the supported interrupted experience explicitly.

## Example and record

A refreshed server response should not silently overwrite an in-progress draft unless that is the chosen contract. An interrupted submission may require request identity or a reconciliation step to avoid duplicate effects. Exercise the event order that matters and retain the input where appropriate.

## Limits and handoff

Offline capability and optimistic updates are product choices, not compulsory features. Do not claim that storing a draft locally establishes secure persistence, conflict resolution, or successful remote submission.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

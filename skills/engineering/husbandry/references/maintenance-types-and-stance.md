# Name the kind of change and its preserved contract

## Use when

Use the observed maintenance problem and the requested outcome.

## Method

A defect repair restores an intended behaviour; a refactor changes structure while intending to preserve relevant behaviour; a migration changes a compatibility boundary; retirement removes an obsolete obligation. State which applies and identify the evidence needed. Mixed work can be legitimate, but make the structural and behavioural portions reviewable.

## Example and record

Extracting a parser while changing its handling of missing fields is not solely a refactor. Separate the acceptance decision about missing fields and retain tests for both the new contract and the shared parsing mechanism.

## Limits and handoff

Labels do not make a change safe. Even a mechanical-looking refactor can alter side-effect order, exceptions, timing, or external consumers. Verify the relevant behaviour rather than treating the word refactor as a proof.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

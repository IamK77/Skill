# Preserve behaviour while changing structure

## Use when

Use the maintenance burden, affected consumers, and the behaviour that must remain stable.

## Method

Add characterization coverage where existing behaviour is insufficiently observed, while keeping accidental legacy behaviour distinguishable from intended requirements. Make coherent reversible transformations and run the relevant tests between meaningful steps. Separate behavioural decisions from structural rearrangement where it improves attribution and review; not every rename needs its own commit.

## Example and record

Moving a state update before a remote refund can preserve the success result while changing the state left after a failure. Retain the failure-path case before restructuring and inspect the effect order. A passing happy-path suite does not establish equivalence.

## Limits and handoff

Tests supply evidence for selected behaviours, not a universal proof that a refactor is low-risk by construction. If a legacy behaviour should change, get that decision explicitly and test the new contract rather than hiding the change under cleanup.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

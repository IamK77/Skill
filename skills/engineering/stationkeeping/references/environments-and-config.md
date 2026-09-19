# Change the intended environment and configuration

## Use when

Use an identified environment, configuration source, owner, and authorised change.

## Method

Determine which values are effective at runtime and where they originate. Separate secrets from ordinary configuration and avoid exposing them in logs or reports. Compare relevant environment differences, record the prior value or artifact, and validate the changed user path after applying the bounded operation.

## Example and record

A deployment may read a startup environment variable while a control panel changes a stored value used only on restart. Verify the effective configuration rather than assuming the write changed live behaviour. Record any required restart as a distinct operational action.

## Limits and handoff

Similar names and a successful write are not sufficient evidence of target identity or activation. Avoid copying production secrets into local fixtures or changing shared infrastructure to make a test pass.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

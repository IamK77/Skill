# Operating with an observable rollback boundary

## Establish the concrete target

Confirm environment, service, operation, authority, and current health before changing a running system. Similar names are not evidence that two environments are equivalent. Record the exact configuration or deployment identifier that the operation affects.

## Prepare a reversible unit

Name success signals, abort thresholds, and a feasible rollback before starting. Some changes, especially data transformations, are not reversed by redeploying an old binary; describe the recovery path separately.

## Example

For a configuration rollout, record the old value, apply the new value to a bounded population, and observe the affected user path and saturation/error signals. If the abort condition is reached, use the prepared reversal instead of increasing the blast radius to obtain more evidence.

## Interpret multiple signals

A health endpoint can be green while a user path is broken. Conversely, an alert may reflect a measurement issue. Compare the intended outcome with logs, metrics, and a representative operation, then state what each observation supports.

## Stop conditions

Do not alter the process or network path carrying this conversation. Hand that action to the human. Missing authority, uncertain target identity, or an unavailable recovery path should leave the operation pending, not encourage bypassing a control.

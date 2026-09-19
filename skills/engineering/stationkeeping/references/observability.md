# Follow one operation through its consequences

## Use when

Use a user-visible operation and the components that contribute to it.

## Method

Connect logs, metrics, traces, and relevant state with identifiers that let an investigator follow the operation without collecting unnecessary sensitive content. Check that timestamps, sampling, and missing spans are understood. Exercise a success and a representative failure so the recorded path can be interpreted.

## Example and record

A request can return quickly while background work later fails. Observe the queued operation and final state rather than declaring success from the HTTP response alone. Record what each signal means and whether it covers the synchronous or asynchronous portion.

## Limits and handoff

Instrumentation changes resource use and can leak information. Choose fields and retention for the actual diagnostic need, and do not claim that a single instrument provides a complete causal account.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

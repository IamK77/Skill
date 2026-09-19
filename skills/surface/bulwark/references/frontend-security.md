# Protect frontend-facing boundaries without trusting the surface alone

## Use when

Use the actual data sources, rendering contexts, authentication/session model, and server-side policy.

## Method

Trace untrusted values into rendering, navigation, storage, and requests. Use the framework's appropriate safe rendering path and review deliberate escape hatches. Keep authorisation enforced at the responsible server or capability boundary rather than relying on hidden controls. Check session and sensitive-data handling under the product's actual requirements.

## Example and record

Removing an administrative button from the UI does not prevent a caller from invoking its endpoint. Exercise a forbidden request against the real policy boundary and verify that the surface handles rejection without leaking or retaining inappropriate data.

## Limits and handoff

This note is not permission to probe a production target. Use authorised environments and do not expose credentials in fixtures, screenshots, telemetry, or external analysis tools.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

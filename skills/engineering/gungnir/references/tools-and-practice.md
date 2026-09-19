# Use tools as bounded instruments

## Use when

Use the chosen security hypothesis and a tool whose behaviour and target scope are understood.

## Method

Inspect what a command will read, send, modify, and retain before running it. Select the narrowest useful mode and preserve the exact invocation and relevant output. Verify a suspicious result through the actual path or an independent observation, and distinguish a tool execution error from a negative finding.

## Example and record

A scanner warning about a dependency can motivate source inspection and a bounded reproduction. An unavailable scanner cannot be replaced with a success message, and a broad default scan is not justified when the authorised question concerns one local path.

## Limits and handoff

Commands and reports may contain sensitive data. Avoid unnecessary capture and do not pass credentials or repository contents to external services without permission. Tools provide observations, not immunity from scope or impact limits.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

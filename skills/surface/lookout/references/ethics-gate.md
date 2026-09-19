# Make telemetry and delivery constraints concrete

## Use when

Use the product's data, consent, retention, access, and user-impact requirements and the responsible decision owner.

## Method

Identify what a proposed event or experiment collects, why it is needed, where it goes, who can access it, and how long it remains. Prefer less sensitive observations when they answer the same question. Check that the experience does not conceal a consequential choice or erase a user's stated preference. Escalate uncertain obligations to the appropriate owner.

## Example and record

Measuring whether an upload completes may require an outcome and timing category, not the uploaded document's contents. Verify the actual payload and retention path rather than relying on a reassuring event name.

## Limits and handoff

This is a scoped design and implementation review, not a universal moral certificate or legal opinion. Local development and tool availability do not authorise transmitting user data to another service.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

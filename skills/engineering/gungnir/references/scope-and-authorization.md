# Record the authority and limits of a test

## Use when

Use the person or organisation granting permission, the exact target, and the requested security question.

## Method

Record allowed environments, accounts, techniques, data handling, timing constraints, and stop conditions. Identify actions that need a new decision, such as availability testing, access to real sensitive data, or contact with another owner. Keep credentials and authorisation records out of unnecessary logs and external services.

## Example and record

Permission to inspect a local repository is not automatically permission to test its production deployment. A local reproduction can proceed within its own scope while a production hypothesis remains untested. Record that distinction in the finding.

## Limits and handoff

Tool availability, an authenticated session, public code, or a manual checklist confirmation does not create authorisation. When the boundary is unclear, ask the responsible person rather than infer consent.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

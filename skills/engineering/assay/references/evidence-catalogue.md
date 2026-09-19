# An inspectable verification record

## Use when

Use the requirement, retained tests, execution commands, and observed results for a change.

## Method

Record what was run, against which code and environment, and which outcome supports which claim. Keep manual inspection distinct from an executed test and from an inference. Reference artifacts by useful paths or identifiers instead of pasting an entire log into every summary. Preserve relevant failures and exclusions as well as successes.

## Example and record

A change may have a targeted regression that passed locally, a full suite that was unavailable, and a manually inspected migration script. Report those as three different observations. Do not let one green command imply that every validation happened.

## Limits and handoff

Logs can contain private data and are not inherently tamper-proof. Keep necessary evidence locally with appropriate access and redaction. The checklist records the stated evidence; it does not independently verify a person's assertion or consent.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

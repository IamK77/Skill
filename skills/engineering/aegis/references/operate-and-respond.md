# Security response and operational follow-through

## Use when

Use an observed incident or a concrete defensive finding, with an incident owner and authorised environment.

## Method

Preserve relevant evidence without unnecessarily spreading sensitive data. Identify affected identities and capabilities, contain the immediate exposure, and plan recovery with the service owner. Check whether credentials, derived artifacts, or previously issued access remain usable after a code repair. Record the sequence and rationale so another responder can continue.

## Example and record

After repairing a leaked-token path, test the repaired boundary and determine whether exposed tokens need revocation. A passing regression does not show that old credentials stopped working. Retain a redacted timeline, action log, and outstanding risks.

## Limits and handoff

Incident phases may overlap as information changes. Prefer a learning-oriented review without asserting that one meeting format guarantees honesty or eliminates responsibility. External notifications follow the organisation's actual authority and requirements.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

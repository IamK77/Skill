# Prepare observations for an authorised frontend delivery

## Use when

Use the release candidate, target environment, intended outcome, and delivery authority.

## Method

Verify artifact identity and a representative preview path, then connect useful health, performance, and product observations to explicit release decisions. Record baselines, abort or investigation conditions, owners, and rollback or disable actions. Exercise instruments with known cases before relying on them during rollout.

## Example and record

A successful preview may establish that the built assets load and the selected journey works in that environment. It does not prove production configuration, telemetry delivery, or a rollout permission. Report those separately and stop at the requested boundary.

## Limits and handoff

Publishing, deployment, and adding external analytics are distinct actions. Do not let a convenient delivery tool silently broaden the authorised environment or data collection.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

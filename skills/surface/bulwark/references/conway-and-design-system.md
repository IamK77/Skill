# Align component ownership with actual consumers

## Use when

Use the affected teams or maintainers, shared component contracts, and concrete change history.

## Method

Identify who decides semantic roles, public component behaviour, and consumer-specific policy. Keep ownership and contribution paths visible. Use representative consumers to discover where apparent duplication is a shared contract and where it reflects intentional differences. Coordinate cross-owner changes rather than imposing a local architecture through a hidden convention.

## Example and record

Two teams may share a button's accessibility and interaction contract while intentionally using different visual mappings. A common token role and a tested component boundary can support that relationship without forcing every surface into one implementation detail.

## Limits and handoff

Organisational structure can influence code boundaries but does not mechanically determine the correct design. Avoid extracting a platform solely because several teams have superficially similar screens.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

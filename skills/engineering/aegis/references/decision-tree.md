# Selecting a defensive review

## Use when

Use the actual change, affected assets, and allowed environment to choose a review depth.

## Method

For a small input-handling change, trace the input to its sinks and exercise relevant rejection cases. For a new capability or trust boundary, sketch assets, principals, and abuse paths before inspecting controls. For a dependency update, inspect resolved versions and reachability rather than treating an advisory match as an exploit.

## Example and record

An export feature needs an ownership check and a cross-owner regression; a new file parser needs representative malformed inputs and resource-limit observations. Record why those checks address the changed boundary.

## Limits and handoff

A review path is a scoping aid, not permission for active testing. Use the agreed risk context; do not impose an organisation-wide certification workflow on a local change.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

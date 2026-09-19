# Validate the path from input data to reported metric

## Use when

Use the planned data boundaries, transformations, model or method implementation, and metric definition.

## Method

Run a small end-to-end sanity case whose expected behaviour can be inspected. Check split assignment, transformations, duplicate or leaked information, output completeness, and metric computation. Keep exploratory adjustments separate from committed runs. Record the actual versions and deviations when implementation constraints require a plan change.

## Example and record

A preprocessing cache keyed only by a dataset name can mix transformations from different splits or configurations. Validate the cache identity and the rows contributing to each result. A plausible final metric does not establish that the intended pipeline produced it.

## Limits and handoff

Synthetic or tiny sanity inputs are useful for plumbing but do not replace the planned population. Report blocked data or environment requirements instead of silently substituting a different experiment.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

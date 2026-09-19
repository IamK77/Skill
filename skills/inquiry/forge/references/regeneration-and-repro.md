# Regenerate a result from retained artifacts

## Use when

Use the run manifest, preserved inputs, analysis code, and the result to reproduce.

## Method

Reconstruct a representative result from the documented inputs and command sequence. Compare meaningful outputs with the stated reproducibility tolerance, and identify environment, nondeterminism, or external-resource constraints. Keep raw-to-summary transformations available rather than saving only a final plot. Document the cost and prerequisites for a fuller rerun.

## Example and record

Regenerating a table from cached metrics verifies part of the analysis path but not model training or data collection. State which layer was regenerated. If a numerical result legitimately varies, explain the accepted relation instead of claiming bitwise reproduction.

## Limits and handoff

A README that looks complete is not a performed reproduction. Record the actual attempt, differences, and unavailable components, and do not expose restricted datasets or credentials merely to make reproduction convenient.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

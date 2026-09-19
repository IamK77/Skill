# Retire obsolete paths without losing necessary knowledge

## Use when

Use the superseded implementation, known consumers, retention obligations, and recoverable history.

## Method

Identify what is still used and what historical information must remain recoverable. Verify the tracked snapshot before removing a path. Migrate consumers and links, remove obsolete automation, and record how to inspect the historical version. Treat untracked local material separately because Git cannot restore content it never recorded.

## Example and record

A retired experiment platform can leave the active tree once its tracked source and artifacts are confirmed in a named commit. Existing untracked runs or scripts should not be silently deleted or published; review their data and ownership separately. A similarly named supported skill may remain independent.

## Limits and handoff

Retirement is not a reason to keep a second active implementation indefinitely, but data, external consumers, or compliance constraints may require a different retention plan. Do not claim that a directory's existence alone establishes an archival guarantee.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

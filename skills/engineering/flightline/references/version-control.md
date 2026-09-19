# Record focused work without losing existing changes

## Use when

Use the current branch, index, working tree, repository policy, and requested delivery boundary.

## Method

Inspect existing edits before staging. Stage only the intended files or hunks, review the staged diff, run relevant checks, and commit a coherent change with its behavioural intent. Before pushing, inspect the remote relationship and use the repository's normal integration path. Preserve recoverable history for removals and migrations.

## Example and record

A workspace may contain an unrelated draft and generated experiment results alongside a completed bug fix. Stage the fix and its regression explicitly rather than using a bulk add that publishes everything. Verify the commit contents after creation.

## Limits and handoff

Commit, push, force-push, history rewriting, and release publication are different operations. Do not bypass hooks or overwrite remote work to make progress. If the remote diverged, inspect the divergence and resolve it deliberately.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

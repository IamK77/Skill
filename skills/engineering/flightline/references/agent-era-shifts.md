# A reproducible path from change to delivery

## Select the actual delivery boundary

A request may end at a local patch, a review branch, a release candidate, or a deployed service. Record that boundary and preserve unrelated work already in the tree. Preparing an operation and executing it are different activities.

## Make feedback correspond to the diff

Run the repository's formatter/linter, relevant tests, and build against the intended tree. If a generated artifact is committed, compare it with a fresh in-memory build or regenerate and review it deliberately. A successful source test does not establish that a stale bundle behaves the same way.

## Example

A command-line package ships TypeScript source and a standalone bundle. Run one lifecycle test against compiled source and the copied bundle, including failure paths. Make stale output fail before merge rather than relying on an automatic follow-up commit after merge.

## Keep reproduction small

Record the dependency lockfile, toolchain assumptions, exact commands, and meaningful outputs. Pin what the project requires rather than installing a new toolchain to match a generic template. Explain which checks were unavailable and why.

## Handoff

A review note should identify the behaviour changed, retained regression, compatibility consequences, and rollback approach. Commit, push, publish, and deploy only within the requested scope. A green pipeline is a record of selected checks, not a blanket guarantee about the release.

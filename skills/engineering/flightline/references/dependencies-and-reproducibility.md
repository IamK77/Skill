# Reproduce the dependency graph you intend to ship

## Use when

Use the ecosystem's actual manifest, resolution files, package manager, and distribution model.

## Method

Record the dependency resolution needed for reproducible application or tool builds and follow the repository's lockfile policy. Review dependency changes for compatibility, maintenance, licensing, and relevant exposure. Distinguish direct dependencies from transitive resolution and check generated artifacts after an update. Reproduce installation in an appropriate clean environment when that is part of the delivery claim.

## Example and record

Updating a package range without updating its resolved application lockfile can leave local and CI builds observing different versions. Conversely, a published library must also consider the versions its consumers may resolve. State which graph the test exercised.

## Limits and handoff

There is no single lockfile rule for every ecosystem or distribution model. Do not install unrelated tools or refresh all dependencies merely to make a targeted change appear current.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Retired A/B experiment platform

The root `touchstone/` platform and its artifact-generation workflow were removed from the tracked working tree on 2026-09-19. Skills, the checklist CLI, and design probes remain maintained. The supported `quarry:touchstone` skill assesses software repositories; it is a different component.

## Historical snapshot

Commit `a793b19` contains the platform before removal, including its sources, tracked experiment fixtures, generated artifacts, and documentation. For example:

```sh
git show a793b19:touchstone/README.md
```

If you need the whole historical tree, use a separate checkout rather than restoring it over current local files:

```sh
git worktree add --detach ../Skill-ab-history a793b19
```

Choose an unused worktree path. Historical software is not a maintained execution environment; review its dependencies and actions before running it. Removing current files does not remove these commits from Git history.

## Local files that were never committed

The removal only deleted files whose contents were verified against the saved commit. Pre-existing untracked experiment scripts, fixtures, and results were not deleted or uploaded. They may still exist locally under `touchstone/`; that retired directory is ignored to avoid accidentally publishing private experiment data in a later bulk add.

Git cannot recover files that were never committed. Review such local material separately before deciding whether to archive or discard it. No claim is made that those untracked files exist in repository history.

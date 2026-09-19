# Migration: 0.4 → 0.5 run-based SOPs

This is a breaking CLI/workflow change. The working tree is updated; no publication or global installation is implied.

## Existing work is not erased

Old state files and journals remain where they are. The new CLI writes only its separate `v2/runs/` store and does not import old passes as current evidence. Copy or retain an old journal as historical context, then start a new run and perform the applicable checks under its definition.

A 0.4 active pointer is not a v2 run ID. `--force` is rejected, not translated into a reset. Existing v2 runs can be listed with `runs` and resumed with `resume ID` from any cwd. Completed/abandoned runs remain reportable but cannot be reopened for mutation.

## Replace lifecycle assumptions

| Before | Now |
| --- | --- |
| Skill-load shell opener runs `init --force` | Loading is read-only. Deliberately choose `init --new` or `resume ID`. |
| Implicit active skill/project state | A distinct run ID; explicit selection or exactly one active run in a named session. |
| Target inferred again from cwd | Canonical target is fixed at creation. Conflicting target overrides are refused. |
| Manual confirmation implicitly opens later phases | Record confirmations, then explicitly `advance phase`. |
| `verify` sounds like stage completion | It only runs sensors. Manual work may remain pending. |
| `show phase` can execute sensors | All show/report operations are read-only. |
| `done` aliases deletion/reset | `done` completes; `reset --reason` abandons. Both retain history. |
| Not-applicable recorded as pass | Explicit `na` with reason, only on an item declaring `allow-na: true`. |
| Empty command can become a manual item or no-op | Empty rules/expanded commands are errors. |
| Manual evidence mixed with command results | Readings retain source and time; subprocess artifacts retain command, cwd, timing, exit/signal and separate output streams. |
| Read/merge/write may race | Exclusive local run lock covers the full mutation/execution transaction. |

Definition refreshes, changed bindings, and upstream re-verification invalidate dependent records rather than silently reusing them. Changes to arbitrary project files are not automatically detected; rerun the relevant sensors.

## Skill authors

1. Pick `metadata.kind: sop` or `heuristic`. Use `router` only for auxiliary navigation.
2. Remove dynamic shell initialization and broad tool preapproval from entrypoints.
3. For SOPs, write concrete inputs, procedure, branches, and completion. Use flat `checks` when staged dependencies add no value.
4. Make run identity explicit in commands. `verify` and `advance` are different operations.
5. For heuristics, remove the checklist entirely. Replace mandatory inspection stages with generative perspectives, analogies, and a worked shift. Do not rename a diagnostic checklist “creative”.
6. Update routing and validate with both the Python authoring lint and the CLI schema/parity lint.

The repository's 38 entrypoints have been migrated. Existing reference essays and probe implementations are retained as optional resources; they do not impose additional stages. Three intentionally user-started workflows (`gungnir`, `stationkeeping`, and `envoy`) declare `disable-model-invocation: true`; host permission prompts remain separate.

## Recovery and limits

A busy run is not permission to delete its lock. Inspect the owner and let an active operation finish. `unlock` requires the recorded process to have exited. Ownerless/corrupt locks, interrupted recovery directories, or shared cross-host state require manual inspection. Retain the run record before recovery.

Normal termination stops the active sensor group; SIGKILL or machine failure cannot run cleanup. A sensor attempt is already marked stale before execution. Inspect possible remaining processes and rerun; do not turn an interrupted attempt into a pass.

This record is a local collaboration aid, not tamper-proof evidence, a sandbox, or proof of human consent. Manual statements still require judgement.

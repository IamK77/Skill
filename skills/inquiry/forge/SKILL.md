---
name: forge
description: >
  The experiment-run lens: turn the method that survived crucible into production code
  and RUN it to produce confirmation evidence — for any field that runs
  experiments to publish (ML, optimization, operations research, systems).
  Use when you are past method design and about to run the real experiments, or
  stress-testing a run plan. The one shift: the run is FROZEN and the agent's role
  switches from developer to OPERATOR — read and execute only, no write — because a
  coding agent optimizes "the test passed", not "the result is correct", and its shortest
  path to a passing validator is to edit it; and the governing standard is ONE-COMMAND
  REGENERATION — every table and figure rebuilds from raw results by one command.
  Triggers on "run the experiments", "harden /
  productionize the prototype", "set up the experiment pipeline", "make this reproducible
  / reproduction package", "organize my results", "my results don't match / numbers
  changed", "provenance / seeds / determinism", "cluster runs / resume".
argument-hint: "[the method/protocol to harden and run, or the experiment-run problem you're stuck on]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# forge

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The method survived the tournament; the protocol is frozen. `forge` is the lens you hold over the **run** — the step where the design becomes real, executed, recorded evidence. It is the fourth skill of the `inquiry` suite: it owns step four of doing computational research — *hardening the surviving method into production experiment code and running it to produce confirmation-grade results.* It audits (and guides you to run) a gated pipeline, and it will not advance past a **GATE** until the `checklist` tool clears it. That gate enforces *order* — each step done before the next — not the *substance* of the work inside it; the tool structures the discipline, it does not audit it, so the rigor is yours to supply.

**The one mental shift everything hangs on — the run is frozen, and the agent becomes an operator.** Up to here the agent was a builder; from here it is an **operator**. The code is frozen, the agent holds **read and execute only — no write**, and it does not get to "helpfully fix" a number that looks wrong or nudge a validation threshold until the check passes. The reason is mechanical, not moral: a coding agent's gradient points at *"the test passed"*, not *"the result is correct"*, and the shortest path to a passing validator is to **edit the validator**. Permission isolation closes that path in a way that telling it not to never will. And the whole step has a single governing standard — **one-command regeneration**: every table and figure the paper will contain rebuilds from the raw results by one command, with no hand-edited number anywhere. That one bar buys reproducibility, anti-data-rot, and most of the reproduction package at the same time. The arc is: *harden the MVP → wire provenance into every run → run idempotently → operate (don't edit) → keep the results uncorrupted → regenerate everything from one command.*

**The agent is the means, not the author of the numbers.** Here its job is the dull, well-bounded labor: the hardening refactor (under your frozen interface), submitting the task grid, watching logs, retrying by the rules, drafting progress and anomaly reports, and running the clean-environment repro smoke test. It is *not* the author of the results and *not* permitted to change what the experiment measures. Its signature failure in this step is the one above — silencing a check rather than reporting the bug under it — so the defense is built into the *permissions*, and every produced solution is re-checked by an **independent feasibility checker that shares no logic with any solver** (a number that "soars" is, nine times in ten, an infeasible solution the agent's code produced and its own code blessed).

**What you cannot delegate — the run shrinks the human to two events.** Done right, this step automates almost everything; what stays yours is exactly two kinds of decision. **(1) Protocol-change decisions** — whether a discovered bug forces a full rerun, whether to add seeds, whether the frozen interface must be cut to a new version. **(2) Anomalies the agent cannot auto-attribute** — the failure that is neither a clean resource error nor a clean code error, the result that is suspicious but feasible. Everything else should be the agent turning. Outsource these two and you have automated your way to a confidently-recorded wrong number.

**What "done" looks like — four conditions, not "the jobs finished".** The run is over when: **every number the protocol calls for is on disk and version-consistent**, **any table or figure regenerates from the raw results by one command**, **the clean-environment reproduction smoke test passes**, and **the 历程 (lab-notebook) evidence chain is complete** — each formal run traceable to its run id, commit, and seed. If you have those four, stop running. "The cluster jobs all finished" is not the terminus; the regenerable, reproducible, traceable evidence base is.

**Speak the user's language.** Most calls here are the user's to own — whether a bug's blast radius forces a full rerun, whether a suspicious-but-feasible number is signal or noise, how much determinism cost is worth paying. Read their field fluency and gloss a term on first use (the *feasibility checker*, *task-level determinism*, the *run archive / provenance*, *idempotent resume*, *one-command regeneration*). A verdict the user can't evaluate is an opinion imposed, not a judgment shared — and the run is theirs.

**Read [references/why-operator-not-developer.md](references/why-operator-not-developer.md) first** — the must-be-told foundation: why the run is frozen and the agent becomes an operator, the "tests pass ≠ results correct" failure and why permission isolation beats exhortation, the research-code quality standard (trustworthy-and-reproducible, not maintainable-forever), one-command regeneration as the governing thread, and the two events that stay human. It is the key that makes every stage below derivable rather than memorized.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/why-operator-not-developer.md](references/why-operator-not-developer.md)** — the foundation: the developer→operator role switch and why it is enforced by permission not instruction, the agent's "silence the validator" failure mode, the research-code quality standard, one-command regeneration as the step's governing thread, and the two non-delegable events. Load at STAGE 0.
- [references/harden-and-provenance.md](references/harden-and-provenance.md) — making each run trustworthy and replayable: the four hardening investments (config-ize, single metric path, independent feasibility checker, freeze the interface), regression-against-the-MVP, randomness-as-recorded (multiple derived seeds, GPU determinism, task-level determinism), the minimal-sufficient run archive, and the clean-commit gate. Load at STAGE 0-1.
- [references/pipeline-and-integrity.md](references/pipeline-and-integrity.md) — running at scale without corruption: the idempotent execution pipeline (queue → execute → validate → summarize), failure classification (resource auto-retry / code never), the operator permission boundary, the graded bug response, and the version-tag anti-mixing rule with a single source of truth. Load at STAGE 2-4.
- [references/regeneration-and-repro.md](references/regeneration-and-repro.md) — closing the evidence chain: one-command regeneration of every table and figure (no hand-edited numbers), the reproduction package accumulated as you go, and the clean-environment smoke test that the agent runs. Load at STAGE 5.

> **The pipeline is one arc.** Six stages — harden · provenance · pipeline · operator · integrity · regen — turn a surviving prototype into a regenerable, reproducible evidence base. Hardening and provenance make each run trustworthy and replayable; the pipeline and the operator boundary run it at scale without the agent editing the numbers; integrity and regen keep the results uncorrupted and rebuildable from one command. `forge` gates all six below.

---

## STAGE 0 — Harden (the MVP becomes experiment code)

Open **[references/why-operator-not-developer.md](references/why-operator-not-developer.md)**, then **[references/harden-and-provenance.md](references/harden-and-provenance.md)**. Internalize the operator switch and the quality standard before you refactor anything.

- **Harden to the research standard — and no further.** The standard is *results trustworthy and reproducible*, not *maintainable for a decade*: over-abstraction and design-pattern polish are time you cannot afford. Exactly four investments earn their keep: **config-ize everything** (zero magic numbers; one config file defines a run completely), collapse metric computation to a **single shared code path** (per-method metric code is the number-one source of misaligned experiments), build an **independent feasibility checker** that shares no logic with any solver and runs on *every* produced solution, and **freeze the interface** — once confirmation starts, the method's external behavior does not change; to change it is to cut a new version. The hardening refactor itself is good work to hand the agent.
- **Regression-check the new code against the old MVP.** Before migration counts as done: same config, same seed, several instances — the new implementation's numbers must **match** the MVP's. A refactor that "reads clean and passes its own tests" is *not* evidence the numbers held; only the regression match is. This is the trap the whole stage exists for.

### GATE — clear before PROVENANCE
1. `checklist check harden hardened-to-research-standard`
2. `checklist check harden regression-against-mvp`
3. `checklist verify harden`

---

## STAGE 1 — Provenance (make every run replayable by record)

Open **[references/harden-and-provenance.md](references/harden-and-provenance.md)** (the provenance half). Manage randomness by *recording* it, and stamp every run so a reviewer's question three months out has a bit-for-bit answer.

- **Record randomness — don't kill it with one global seed.** Each random source — instance generation, initial solution, algorithm internals, data shuffling — gets an **independently derived seed, separately recorded**, so editing one piece of code doesn't shift every stream and destroy comparability. On GPU, beware cuDNN's non-deterministic ops and float-accumulation order: for the key comparisons turn the determinism switches **on** and pay the speed cost. The target is **task-level determinism** — the same (config, seed) yields the same result on any rerun (bit-for-bit where the determinism switches are on) — the precondition for resume *and* anti-mixing.
- **Auto-record the minimal-sufficient run archive.** Every formal run packs, under one **run id**: git commit hash, full config snapshot, environment lockfile (or container tag), data version (file hash), hardware, timestamp, seed. This is the machine version of the append-only 历程 ledger relies on — the 历程 records only the run id, and the evidence chain closes itself.
- **Gate the run on a clean commit.** Formal experiments run **only** from a clean commit; an uncommitted working tree makes the run *refuse to start* (one guard line). Without it, the archive's commit hash and the code that actually ran can silently diverge, and the later replay reconstructs the wrong state.

### GATE — clear before PIPELINE
1. `checklist check provenance randomness-recorded-not-eliminated`
2. `checklist check provenance run-archive-minimal-sufficient`
3. `checklist check provenance clean-commit-gated`
4. `checklist verify provenance`

---

## STAGE 2 — Pipeline (run it idempotently, classify the failures)

Open **[references/pipeline-and-integrity.md](references/pipeline-and-integrity.md)**. Build the execution loop so a crash, a scale-up, or extra seeds is a non-event.

- **Make the execution loop idempotent.** The protocol auto-expands into a task queue (the full method × instance × seed grid) → batch execute → validate and persist → auto-summarize, with failure-attribution as a sidecar. On startup the executor checks which (config, seed) cells already have a **valid** result and **skips** them — so an interruption, a scale-up, or adding seeds is just "run the same command again", and you never hand-account which runs finished. Idempotent resume plus task-level determinism makes mid-run recovery free.
- **Classify failures and handle them by class.** **Resource** failures (OOM, preemption, timeout) auto-retry on a larger resource tier. **Code** failures (an exception, a feasibility-check that doesn't pass) are **never** auto-retried — they are marked and escalated. The correct response to a code bug is the graded handling of the operator stage, *not* rerunning until it happens not to error; an auto-retried code failure is a bug laundered into a "flaky" result.

### GATE — clear before OPERATOR
1. `checklist check pipeline idempotent-resume`
2. `checklist check pipeline failures-classified`
3. `checklist verify pipeline`

---

## STAGE 3 — Operator (the agent runs; it does not edit)

Open **[references/pipeline-and-integrity.md](references/pipeline-and-integrity.md)** (the operator and bug-response sections). The code is frozen; the agent's job is to run it and report, not to improve the numbers.

- **Enforce the operator boundary by permission, not instruction.** During the run the agent holds **read and execute only — no write**. It submits tasks, watches logs, retries by the failure rules, and drafts progress and anomaly reports ("73% done; method B's failure rate on the large tier is abnormal, suspected memory"). It may **not** fix a number that looks wrong, **not** adjust a threshold to make a check pass; any code change passes your review and bumps the version. The reason is the documented failure mode — agents optimize "test passed" over "result correct", and the cheapest way to a green check is to edit the check. Permissions close that path mechanically: run the formal-run phase in a session or sub-agent whose **allowed-tools exclude `Edit` and `Write`** (read and execute only), or against a read-only checkout — the build agent that hardened the code hands off to a run context that physically cannot edit it.
- **Respond to a mid-run bug by blast radius — graded, pre-planned.** A bug affecting **all** methods (e.g. instance-loading): fix, bump the version, rerun **everything** — costly, but fairness is non-negotiable. A bug affecting **some**: fix and rerun **all** affected combinations, not just the most visibly broken one. The most dangerous move — fix, rerun a part, and let old and new numbers share one table — is forbidden (the integrity stage catches it structurally). Every bug-and-rerun decision is appended to the 历程 and the protocol changelog.

### GATE — clear before INTEGRITY
1. `checklist check operator agent-is-operator-not-writer`
2. `checklist check operator bug-response-graded`
3. `checklist verify operator`

---

## STAGE 4 — Integrity (one version per table, one source of truth)

Open **[references/pipeline-and-integrity.md](references/pipeline-and-integrity.md)** (the anti-mixing section). The most common way experiment data rots is silent; defend against it with a machine, not the eye.

- **Version-tag every result; let the summary refuse a mixed table.** Mixing old and new numbers in one table — *混表* — is the number-one data-corruption mode: silent now, un-auditable later. Every result row carries the **code version** that produced it, and the summary script **forcibly checks** that a single table draws from a single version — erroring out and refusing to emit on any mismatch. The human eye cannot see a version mismatch in a column of numbers; the machine must.
- **Keep one source of truth.** All results land in **one** store (SQLite is plenty); raw logs and solution files are archived by run id and kept (reviewers, OR journals especially, may demand them). One source of truth is what makes the next stage's one-command regeneration possible and stops two subtly-different copies of "the results" from drifting apart.

### GATE — clear before REGEN
1. `checklist check integrity results-version-tagged`
2. `checklist check integrity single-source-of-truth`
3. `checklist verify integrity`

---

## STAGE 5 — Regen (every number rebuilds from one command)

Open **[references/regeneration-and-repro.md](references/regeneration-and-repro.md)**. The run ends not when the jobs finish but when the evidence base is regenerable and reproducible.

- **Regenerate every table and figure from one command — no hand-edited numbers.** Each table and figure the paper will contain is produced by a **script** from the results store, by **one command**, with no manual number-editing anywhere (a hand-edited spreadsheet is the number-one channel for untraceable error). This single bar is the governing standard of the step — reproducibility, anti-rot, and most of the repro package at once — and it makes the stage-5 analysis loop cheap: changing a figure, adding seeds, swapping a test all become "edit the script, rerun one command".
- **Accumulate the reproduction package as you go, and smoke-test it clean.** Maintain a `repro/` directory throughout — environment lockfile, data fetch-and-preprocess scripts, a one-command main-table script, a README — each experiment class adding its command as it completes. Periodically the **agent runs the README from scratch in a fresh clean environment**: a repro package's most common death is "works on the author's machine", and the clean-env smoke test is exactly the dull, well-bounded job the agent is best at.

### FINAL GATE — the run is forged
1. `checklist check regen one-command-regeneration`
2. `checklist check regen repro-package-smoke-tested`
3. `checklist verify regen`
4. `checklist show` — confirm all **six** stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

`forge` is the **experiment-run lens**, held over a project once the method is chosen and the protocol is frozen. Its six stages are one arc against one enemy — **a recorded number you cannot trust or cannot reproduce.** Hardening (0) turns the prototype into experiment code at the research standard and proves it still matches the MVP; provenance (1) stamps every run so any number is replayable bit-for-bit; the pipeline (2) runs the grid idempotently and refuses to launder a code bug as flakiness; the operator boundary (3) lets the agent run and report but not edit the numbers; integrity (4) keeps a single version per table and a single source of truth; regen (5) rebuilds every table and figure from one command and proves the package reproduces in a clean room. The through-line is the suite's own — *manage complexity; make the cost match the real need* — here: freeze before you run, record everything, and let a machine (not your eye, not the agent's goodwill) guard the integrity of the numbers.

It pairs with its siblings without duplicating them. Inside `inquiry`, `forge` owns step four — *run the experiments and produce trustworthy evidence*; it takes the frozen protocol and surviving method from `ledger` (whose exploration/confirmation firewall and append-only 历程 it operationalizes as run ids and the clean-commit gate), and it hands `reckoning` (results analysis) a results store where every number is on disk, version-tagged, and regenerable — so analysis is reading evidence, not chasing it. And it routes to the engineering suite when the work turns to *building the harness*: `assay` tests the behavior of the experiment code, `gauge` and `plumb` watch its signal and craft, `stationkeeping` runs the cluster jobs. For an agent the lever is the same as everywhere in the suite: it will silence a failing check, retry a buggy run until it passes, and record an infeasible solution as a triumph — feeling none of the future retraction or failed replication — so the run must be **frozen, permission-bounded, and gated**, with the numbers guarded by an independent checker and rebuilt from one command.

## Anti-patterns (use as a pre-flight checklist)

- **Letting the agent keep writing during the run** — the role switched to operator; it holds read and execute only, and a code change means your review plus a version bump.
- **Trusting "the test passed"** — the agent optimizes the green check, not the true result; the cheapest path to a passing validator is editing the validator, so guard integrity by permission, not instruction.
- **Skipping the independent feasibility checker** — a number that soars is usually an infeasible solution; check every produced solution with logic that shares nothing with the solver.
- **Hardening to "maintainable" instead of "reproducible"** — over-abstraction is wasted time; spend only on config-ization, the single metric path, the feasibility checker, and the frozen interface.
- **Skipping the regression against the MVP** — a clean refactor can silently change behavior; same config and seed must reproduce the old numbers before migration counts.
- **Killing randomness with one global seed** — derive and record a seed per source instead, so one code edit doesn't shift every stream and break comparability.
- **Running from a dirty working tree** — the recorded commit hash then lies; gate the run on a clean commit so the replay reconstructs the real state.
- **Auto-retrying a code failure** — that launders a bug into a "flaky" result; only resource failures auto-retry, code failures are marked and escalated.
- **Fixing a bug and rerunning only part** — old and new numbers in one table is silent corruption; rerun all affected combinations and tag every row with its code version.
- **Mixing versions in one table** — the eye can't see it; the summary script must check single-version-per-table and refuse to emit on mismatch.
- **Hand-editing numbers into a figure or spreadsheet** — the number-one untraceable-error channel; every table and figure regenerates from the results store by one command.
- **Cramming the repro package before submission** — accumulate it as you go and have the agent smoke-test it from scratch in a clean environment, where "works on my machine" dies.
- **Calling it done when the jobs finish** — done is four conditions: every number on disk and version-consistent, any table/figure regenerable by one command, the clean-env smoke test green, the 历程 chain complete.
- **Outsourcing the two human events** — protocol-change decisions and un-auto-attributable anomalies are yours; automating them records a confident wrong number.
- **Skipping a GATE** — and remember the cheapest run failure is the one the frozen protocol and the independent checker caught before it reached a table.

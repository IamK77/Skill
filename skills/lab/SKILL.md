---
name: lab
description: >
  The inquiry-lab operations manual: how an agent drives the computational
  research lab — the durable executor that turns inquiry-suite discipline into
  server-enforced gates. Use whenever research work touches the lab: creating a
  case, grounding novelty, freezing a kill plan or protocol, registering and
  validating baselines, submitting exploratory or confirmation runs, uploading
  datasets or source bundles, reading results and audit chains, or sealing
  evidence for a Terra export. Triggers on "submit a run / experiment to the
  lab", "freeze the kill plan / protocol", "register a baseline", "why was my
  run/manifest rejected", "seal the evidence", "lab budget".
argument-hint: "[the lab operation you are attempting, or the rejection you are debugging]"
allowed-tools: Read Bash Edit Write
---


<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ../../LICENSE and ../../NOTICE · https://www.apache.org/licenses/LICENSE-2.0
Source of truth: https://github.com/IamK77/inquiry-lab/blob/main/skills/lab/SKILL.md
-->
# lab

inquiry-lab is the execution and evidence layer for computational research. The
inquiry suite (`prospect → crucible → ledger → forge → reckoning → envoy`)
supplies the discipline as prose and checklists; the lab enforces the subset an
agent is most tempted to fake — as **server-side rejections, not instructions**.
You cannot skip a state, review your own work, spend a budget twice, promote
exploratory numbers into confirmation evidence, or delete a failed observation.
When the lab rejects a call, the correct response is to fix the research
process, never to route around the gate.

Endpoint: `https://lab.chenyinfeng.wiki` (control plane `labd`). Execution
happens on a pull-based GPU worker; artifacts live in content-addressed R2
storage. Everything below is verified against a live end-to-end walk.

## Identity: four credentials, enforced server-side

Role comes from the bearer token, never from a request field. Keep tokens in
`~/.config/inquiry-lab/labctl.env`:

| Principal | Token variable | May do |
|---|---|---|
| `builder:*` | `LAB_TOKEN` | create cases, ground novelty, freeze kill plans, register baselines, submit exploratory runs, upload bundles/datasets |
| `reviewer:*` | `LAB_REVIEWER_TOKEN` | validate baselines, resolve pilot reviews, freeze protocols, seal evidence — rejected if the same principal built the case |
| `confirmation-runner:*` | `LAB_RUNNER_TOKEN` | submit confirmation runs only, and only exact protocol instantiations |
| `worker:*` | (worker host only) | claim leases, heartbeat, complete attempts |

A builder session and a reviewer session are **different MCP server instances /
different `Authorization` headers**. Plan handoffs explicitly; asking the
builder credential to validate a baseline returns `reviewer_required`.

## Interfaces

- **MCP (agent-native)**: `labctl mcp` with `LAB_SERVER`, `LAB_TOKEN`,
  `LAB_WORKSPACE_ROOT`, `LAB_TERRA_ROOT` set. Tools: `case_create`, `case_get`,
  `novelty_import`, `kill_plan_freeze`, `baseline_register`,
  `baseline_validate`, `pilot_review`, `protocol_freeze`, `evidence_seal`,
  `evidence_get`, `run_submit`, `run_get`, `run_spec_digest`, `audit_list`,
  `terra_search`, `dataset_upload`.
- **CLI**: `labctl request METHOD /v1/... [JSON]` for any endpoint; plus
  `labctl bundle CASE_ID` (upload clean-tree source bundle),
  `labctl source-git` (Git provenance + tree digest for confirmation),
  `labctl dataset CASE_ID PATH` (workspace-confined dataset upload),
  `labctl digest RUNSPEC.json` (semantic digest, needed for protocols).
- Every mutation needs an `Idempotency-Key`. Reusing a key with identical
  content replays the original response; reusing it with different content is a
  `409`. Pick stable, meaningful keys (`freeze-kill-plan-<case>-v1`), not UUIDs,
  so retries are safe.

## The case state machine — what each state allows

```text
candidate → novelty_reviewed → kill_plan_frozen → baseline_validated
  → pilot_review → { killed | reframe | method_ready }
  → protocol_frozen → confirmation_running → (seal) → supported|rejected|inconclusive
```

Run admission by state (verified live):

| Run you want | Requires |
|---|---|
| `setup_smoke` (exploratory) | any of `candidate`/`novelty_reviewed`/`kill_plan_frozen`, case builder |
| `baseline_sanity`, `experiment`, `analysis`, `figure_build` (exploratory) | state in `kill_plan_frozen`…`method_ready`, case builder |
| confirmation | state exactly `protocol_frozen`, `confirmation-runner:*` token, RunSpec semantic digest present in the frozen protocol's `expected_run_matrix` |

Consequence worth planning around: **analysis runs must be submitted while the
case is still in the exploratory window** (typically `method_ready`, before the
protocol freezes) — after confirmation starts, no exploratory submission is
accepted. Schedule analysis-pipeline runs before `protocol_freeze`.

## Golden path (the calls, in order)

1. **`case_create`** — draft needs `schema_version:1`, ids, title, question,
   `precise_delta`, `domain_profile`, and a **hard budget**:
   `{max_runs, max_concurrent_gpu_runs, max_gpu_seconds, max_failed_runs,
   max_output_bytes, max_wall_seconds}`. Budget arithmetic: every submitted run
   *reserves* `timeout_seconds × gpus` GPU-seconds and `output_bytes` at
   admission. Reserve generously per run and the budget exhausts early; the
   gate is a hard `409` (verified). Size `max_runs` with failures in mind.
2. **`novelty_import`** — you send `{evidence_id, academic_request_body,
   agent_verdict, recall, terra_snapshot_commit}`; `labd` itself calls
   academic-go (`{"candidates":[...], "limit":N}`) and stores the full
   request/response/digest. You cannot inject a fabricated literature result.
   `recall: low|unknown` requires `recall_override_reason` or the call fails.
   Check terra first with `terra_search`.
3. **`kill_plan_freeze`** — before any comparative run: `hypothesis`,
   `instance_family`, `sampling_unit`, `primary_comparison`, `metric`,
   `higher_is_better`, `operator` (`greater_than|greater_or_equal|less_than|
   less_or_equal`), `threshold`, `minimum_sample_size`, `baseline_ids`,
   `maximum_resource_budget`, optional `reframe_hints`. Version 1; edits create
   successors, never updates.
4. **Baseline sanity run** — submit a `baseline_sanity` exploratory run that
   actually exercises the baseline; it must reach `completed`.
5. **`baseline_register`** (builder) then **`baseline_validate`** (reviewer) —
   registration needs paper/repository identifiers, `exact_version`,
   `implementation_kind` (`upstream|faithful_reimplementation|local_proxy`),
   `tuning_space`, `tuning_budget > 0`, `sanity_claims`, `sanity_run_ids`.
   **A `local_proxy` baseline can never pass validation** — that is the point;
   use it for smoke work only.
6. **Exploratory experiments** — the pilot evidence. Also submit your
   **analysis run(s)** in this window (see above).
7. **`pilot_review`** (reviewer) — `{pilot_run_ids, disposition:
   killed|reframe|method_ready, rationale}`. All referenced runs must be
   terminal.
8. **Compute confirmation digests** — write each confirmation RunSpec JSON,
   then `labctl digest spec.json` (or the `run_spec_digest` MCP tool). This is
   how the protocol pre-registers its exact run matrix.
9. **`protocol_freeze`** (reviewer) — `hypotheses`, `claims`, `estimands`,
   `sampling_units`, `dataset_digests` (sha256, non-empty), `method_version`,
   `baseline_ids`, `expected_run_matrix: [{"run_spec_digest": "sha256:..."},…]`,
   `primary_metrics`, `analysis_plan`, `missing_timeout_policy`,
   `stopping_rule`, `budget`.
10. **Confirmation runs** (`LAB_RUNNER_TOKEN`) — the spec must match a frozen
    digest byte-for-byte; any parameter drift is `run_not_protocol_instantiation`.
    Confirmation specs additionally require: `source` = Git with
    `clean: true`, real `repository`/`commit`, and a `tree_digest` the worker
    re-verifies after checkout (`labctl source-git` produces all of it);
    `environment.image_digest` in immutable `name@sha256:<64hex>` form (get it
    from `docker images --digests`); `network_enabled: false`;
    `protocol_id` set.
11. **`evidence_seal`** (reviewer, must not be the builder) — VerdictDraft:
    `{verdict_id, mechanical_findings: {kill_criterion_met,
    baseline_sanity_passed, protocol_complete}, disposition:
    supported|rejected|inconclusive, confirmation_run_ids, analysis_run_ids,
    rationale, remaining_uncertainty}`. The server checks every expected run is
    accounted for (completed/failed/needs_audit all count — failures are
    evidence, not gaps). Returns the sealed `EvidenceBundle` with a
    `terra_patch` — apply it to terra-cognita locally and commit; the lab never
    writes to Terra.

## RunSpec and ResultManifest contract traps (each verified by a live rejection)

- Every metric in a result manifest needs **all** of: non-empty `name`, finite
  `value`, `unit`, `split`, `aggregation`, **`higher_is_better` (never null)**,
  `sample_size ≥ 1`. One null direction fails the whole manifest
  (`invalid_output`, run marked failed).
- A successful run with no metrics **and** no artifacts is rejected — emptiness
  is failure, not success.
- Dataset mounts must live under `/inputs/` and contain no `,` or `:`; datasets
  are downloaded, digest-verified, case-bound, and mounted read-only. Upload
  them first with `dataset_upload` / `labctl dataset`.
- `run_id` is caller-chosen but **not part of the semantic digest**; identical
  content under a new key returns the existing run (dedup, `200` not `201`).
  Same `run_id` with different content is `409`.
- The container writes `/outputs/result-manifest.json`; the worker **overwrites**
  identity, hardware, logs and resource observations — don't bother faking
  them, and don't rely on them from inside the container.
- Wall-time and output-byte limits are enforced during execution (container is
  killed, `failure_class: timeout` / `policy_violation`). Images must be
  pre-pulled on the worker; execution runs with the network disabled.

## Failure classes (what a failed run is telling you)

| `failure_class` | Meaning | Typical fix |
|---|---|---|
| `invalid_output` | manifest missing or contract-violating | fix the manifest your code writes |
| `timeout` | wall-time limit; container was killed | raise `timeout_seconds` (costs budget) or shrink work |
| `policy_violation` | output-byte quota exceeded at runtime | write less to `/outputs` |
| `dependency` | source/dataset fetch or digest verification failed | re-upload; check digests, image presence |
| `user_code` | non-zero container exit | read `stderr_tail` via the stored manifest |
| `worker_lost` | lease expired | exploratory: retried per policy; confirmation: `needs_audit` always |

`needs_audit` is not an error to retry around — it is a state that demands a
human/reviewer look before the observation can be replaced.

## Where this plugs into the inquiry suite

| inquiry stage | lab call that hardens its gate |
|---|---|
| prospect · adversarial existence search | `novelty_import` (control-plane-fetched evidence packet) |
| prospect · cheapest kill-shot | `setup_smoke` run (allowed from `candidate`) |
| crucible · kill criteria pre-committed | `kill_plan_freeze` (immutable version) |
| crucible · tournament / prospect · reproduced baselines | `baseline_register` + sanity runs + independent `baseline_validate` |
| ledger · frozen protocol & firewall | `protocol_freeze` + `evidence_class` separation |
| forge · operator, provenance, idempotent runs | worker execution: read-only source, digest verification, dedup, retry policy |
| reckoning · audit before read | `audit_list` + expected-run accounting at seal time |
| envoy · every number to a run id | `EvidenceBundle` graph + `terra_patch` |

Local fast iteration (crucible's tournament pace) is fine — the rule is:
**any number that decides a kill, enters a death log, or will be cited must
come from a lab run id.**

## Anti-patterns

- Retrying a rejected gate with cosmetic changes instead of doing the missing
  research step — the gate is the process, not an obstacle.
- Spending the whole case budget on reservations (huge `timeout_seconds` ×
  `gpus`) so later runs get `409`; reserve close to expected cost.
- Registering only a `local_proxy` baseline and expecting to reach
  `baseline_validated`.
- Freezing a protocol before computing the confirmation digests — the matrix
  is write-once; a wrong digest means the confirmation run can never be
  submitted and the protocol must be superseded.
- Forgetting analysis runs until after confirmation started (no exploratory
  window remains).
- Letting the builder credential attempt review actions and treating the
  rejection as an auth bug.
- Random idempotency keys on retries — a network-level retry then double-spends
  budget; keys must be stable per logical operation.

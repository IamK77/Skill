# The inquiry suite

Where the engineering and distributed suites are about *building* software, the **inquiry** suite is about *doing computational research* — the work of going from a vague area to published results in any field where you run experiments to publish (machine learning, combinatorial optimization, operations research, systems, scheduling). It updates human-era research practice for a world where the agent does the searching, reading, reproducing, drafting, and defending — and therefore fools you by default, optimizing for output that *looks* like a result. Six skills form the complete pipeline over all six research steps, each handing the next a concrete artifact: **prospect** (find and prove the gap) → **crucible** (design the method) → **ledger** (design the experiments) → **forge** (run the experiments) → **reckoning** (analyze the results) → **envoy** (write it up, submit, and defend). Across all six the human keeps four things — taste, spec, judgment, and the signature on the claims — and everything else is discipline and the agent.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`prospect`**](prospect/SKILL.md) | Research-gap prospecting — bound the ground, mine candidate gaps in parallel, attack & rank, kill cheaply, land the gap | 6 |
| [**`crucible`**](crucible/SKILL.md) | Method design — decidable spec, oracle ceiling, race death-orthogonal variants in a feasibility-checked tournament, deepen with theory / ablation / novelty | 7 |
| [**`ledger`**](ledger/SKILL.md) | Experiment design — claim-evidence matrix, exploration/confirmation firewall, instances & fair baselines, statistics, ablation & sensitivity, frozen protocol | 7 |
| [**`forge`**](forge/SKILL.md) | Experiment run — harden the method to research-standard code, per-run provenance, idempotent pipeline with a read-only operator agent, version-tag integrity, one-command regeneration | 6 |
| [**`reckoning`**](reckoning/SKILL.md) | Results analysis — audit before reading, distribution & slices with honest statistics, ablation traps, mechanism probes, failure boundary, claim verdicts, systematized red-team | 7 |
| [**`envoy`**](envoy/SKILL.md) | Writing, submission & rebuttal — figure-first skeleton, claim-organized sections, the three agent red-lines (every number to a run id), venue-fit submission, the four-beat rebuttal, the revise-before-resubmit ladder | 6 |

The pipeline is a chain: each skill hands the next a concrete artifact, and when the paper lands the research is finished and the next one begins again at `prospect`.

---

Invoke any skill with `/inquiry:<name>` (drop the prefix if installed standalone). Gates are held by the [`checklist` CLI](../../README.md#checklist) — without it a skill degrades to prose. ← back to [all five suites](../../README.md).

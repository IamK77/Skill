# Reference-library migration

Completed locally on 2026-09-19 after the entrypoint/run-model migration. This record describes the editorial scope; test results and remote delivery are reported separately when performed.

## Coverage

| Suite | References |
| --- | ---: |
| engineering | 78 |
| distributed | 8 |
| inquiry | 24 |
| quarry | 8 |
| surface | 48 |
| atelier | 32 |
| **Total** | **198** |

**194 reference bodies were replaced.** Four routing notes had already been migrated and were retained. The library now consists of 114 SOP references, 80 heuristic references, and four auxiliary routing notes. All 38 entrypoints link to their current reference titles.

This is a substantive replacement of the old reference interface, not a claim that every old paragraph or implementation recipe was preserved. The former encyclopedic/process-heavy material is available in commit `a793b19`; the current notes concentrate on the useful method, a concrete example or comparison, and its limits. Reference text decreased from 4,238,946 to 251,886 UTF-8 bytes at the migration checkpoint. Shortness is not itself a quality guarantee.

## What changed

### SOP references support a chosen task

The notes specify when a technique applies, what to do, the observation or artifact to retain, and its limits. They do not introduce another checklist or hidden sequence beyond the parent SOP.

Examples:

- Threat modelling starts with the actual assets, flows, boundaries, and authorised scope—not completion of another skill's architecture phase.
- Refactoring keeps side-effect and failure semantics visible; passing a happy-path test is not treated as proof of behavioural equivalence.
- Static feedback is tested with representative violations and permitted cases; a configuration file or green command name is not a guarantee.
- Experiment planning distinguishes committed comparisons from legitimate exploratory work, and analysis distinguishes observations, interpretations, and uncertainty.
- Security, operations, submission, and telemetry notes keep concrete authority and data-handling boundaries without turning them into general moral lectures.
- Retirement distinguishes tracked history from never-committed local data.

### Heuristic references open and elaborate possibilities

Each visual, architectural, research, representation, or distributed-systems resource supplies a perspective, a meaningful alternative, or an example of a different framing. Technical considerations help elaborate a candidate; they are not a disguised full-dimension inspection or a requirement to converge.

Examples:

- Architecture is explored through ownership, institutional analogies, future changes, and reversible boundaries rather than a universal ranking of styles.
- State copies are distinguished as caches, drafts, snapshots, projections, and replicas instead of treating every duplicate as a defect.
- Distributed promises are explored through reservations, receipts, escrow, partial knowledge, and the scope of agreement.
- Visual recipes are treated as contextual instruments. Family counts, tinted neutrals, pure endpoints, one light model, and a fixed frame budget are not universal aesthetic laws.
- Research variants are different causal stories; novelty and value are not certificates or mandatory tournament results.

The original filenames are generally retained for link stability, including some names that originated in the former organisation. Their current titles and contents define their purpose, not their historical basename.

## Probes and checks

Design probe implementations and fixtures remain unchanged. The canon reference now identifies the detector's flags as declared surface indicators, not evidence of authorship or aesthetic merit. A zero count is not a creativity certificate.

`devtools/skill-lint.py` now traverses both entrypoints and references. It checks local resource links, heading anchors, descriptive reference headings, and a limited set of obsolete initialization, stage, and unsupported-claim patterns. Negative fixtures demonstrate that a clean entrypoint does not conceal a broken reference. These are structural/editorial regression guards, not automatic validation of all technical truth or creative quality.

The existing CLI schema/parity tests and probe tests remain independent. No A/B evaluation platform is required for maintaining these skills; see [the platform retirement record](retired-ab.md).

## Limits

The notes were edited and checked locally, not validated by running 38 live user projects or establishing a measured improvement in creative outcomes. The attempted parallel editorial jobs failed because the model service reported insufficient balance and produced no edits; the resulting rewrites were completed by the primary agent. No independent-review claim is made.

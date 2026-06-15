# The distributed suite

Where the engineering suite is general software practice, the **distributed** suite is for systems that span machines — where partial failure, an unreliable asynchronous network, and the absence of a global clock make "correct" genuinely hard.

| Skill | Role | Stages |
|-------|------|:------:|
| [**`holdfast`**](holdfast/SKILL.md) | Distributed correctness — partial failure, communication, ordering, replication, consensus, sharding, fault tolerance, coordination | 8 |

`holdfast`'s one idea is **the third state**: a remote call can succeed, fail, *or leave you not knowing which*, and single-machine code has no branch for "I don't know" — which is where most distributed bugs live. Its eight stages are eight faces of one problem: frame · communication · ordering · replication · consensus · sharding · fault tolerance · coordination.

---

Invoke with `/distributed:holdfast` (drop the prefix if installed standalone). Gates are held by the [`checklist` CLI](../../README.md#checklist) — without it a skill degrades to prose. ← back to [all five suites](../../README.md).

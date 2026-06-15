# The engineering suite

Ten skills covering the engineering lifecycle, its security, and the craft of the code itself. The lifecycle runs **groundwork → load-bearing → flightline → assay → stationkeeping → husbandry**, with **gauge** (feedback), the **aegis** / **gungnir** security pair (shield & spear), and **plumb** (code craft) cross-cutting. A separate un-gated navigator, **pilot**, sits in front of them all: tell it your task and it routes you to the right skill(s) in the right order — or says plainly when no skill is needed.

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| [**`pilot`**](pilot/SKILL.md) | Navigator (un-gated front door) — routes a task to the right skill(s), or says none is needed | — |
| [**`groundwork`**](groundwork/SKILL.md) | Requirements — pin down what to build before building it | 5 |
| [**`load-bearing`**](load-bearing/SKILL.md) | Architecture — style, stack, boundaries, contracts, data model | 6 |
| [**`flightline`**](flightline/SKILL.md) | Engineering process — version control, review, CI/CD, dependencies | 6 |
| [**`assay`**](assay/SKILL.md) | Testing — what to test, how, and proving the suite can fail | 8 |
| [**`stationkeeping`**](stationkeeping/SKILL.md) | Operations — deploy & release, observability, monitoring, SLOs & incidents, capacity, DR | 7 |
| [**`husbandry`**](husbandry/SKILL.md) | Maintenance & evolution — debt, refactoring, defects, versioning, dependencies, legacy, retirement | 6 |
| [**`gauge`**](gauge/SKILL.md) | Feedback surface (cross-cutting) — strict types, boundary validation, legible failures | 5 |
| [**`aegis`**](aegis/SKILL.md) | Security (cross-cutting, the shield) — threat modeling, secure design & coding, SAST/DAST/SCA, OWASP defenses | 6 |
| [**`gungnir`**](gungnir/SKILL.md) | Adversarial validation (the spear) — authorized pentest: scope, recon, exploit, chain, fix & re-test | 6 |
| [**`plumb`**](plumb/SKILL.md) | Code craft (cross-cutting, the plumb line) — naming, functions, abstraction, trust-chains, smells, testability | 6 |

Each skill is a directory — `SKILL.md` (its full doc, linked above) + a `references/` library + a `.checklist.yml` gate definition. The navigator `pilot` is un-gated, so it carries no `.checklist.yml`.

---

Invoke any skill with `/engineering:<name>` (drop the prefix if installed standalone). Gates are held by the [`checklist` CLI](../../README.md#checklist) — without it a skill degrades to prose. ← back to [all five suites](../../README.md).

# The surface suite

Where the other suites are deliberately domain-agnostic, the **surface** suite is the first vertical: building a modern **frontend** from 0 to 1. It exists because frontend is the one discipline whose "correct" is not checked against a document — its benchmark is a human nervous system (16ms is a fusion threshold, 100ms is "I touched it directly"), so **taste is load-bearing and cannot be outsourced**, and as the agent writes the code the leverage migrates from the keyboard to the membrane between machine and mind: *which boundary, whose source of truth, what causal story forms in the user's head, and whose interest the optimizer serves.* Seven gated lenses run the build lifecycle, each handing the next a concrete artifact, with three principles threaded through all of them — **boundaries > frameworks**, **allocate caution by reversibility** (one-way vs two-way doors), and **the source of truth lives in the user's mind, not the database**. An un-gated navigator, **pilot**, sits in front of the seven and routes a task to the right *entry stage* — most frontend work isn't greenfield — or out to a sibling suite when the real need is general engineering, distributed correctness, or library choice.

| Skill | Lifecycle role | Stages |
|-------|----------------|:------:|
| [**`pilot`**](pilot/SKILL.md) | Navigator (un-gated front door) — route a frontend task to the right entry stage, or to a sibling suite | — |
| [**`bearings`**](bearings/SKILL.md) | Before the first line — model the mind, fix the one-way doors, write the perception contract, set the objective function | 5 |
| [**`keel`**](keel/SKILL.md) | Walking skeleton — pierce every integration seam with one real-but-trivial slice, with a contract that can't drift | 4 |
| [**`wellspring`**](wellspring/SKILL.md) | State architecture (the heart) — classify state, minimize the source of truth, model the implicit machine | 4 |
| [**`seaworthy`**](seaworthy/SKILL.md) | Build, unhappy-path-first — the four states are the product; illusion-maintenance, accessibility, a perf budget | 4 |
| [**`trials`**](trials/SKILL.md) | Correctness — test behavior not structure (the testing trophy), mock only the network | 4 |
| [**`lookout`**](lookout/SKILL.md) | Delivery & observability — RUM as psychophysics, plus the pre-launch objective-function ethics gate | 4 |
| [**`bulwark`**](bulwark/SKILL.md) | 1→N — fight entropy by making the architecture self-enforcing; a steady state | 5 |

Greenfield walks the seven front to back; real work usually enters mid-stream (a running app with a state swamp → start at `wellspring`), which is what `pilot` is for. Each gated skill is a directory — `SKILL.md` + `references/` + `.checklist.yml`; `pilot` is un-gated.

---

Invoke any skill with `/surface:<name>` (drop the prefix if installed standalone). Gates are held by the [`checklist` CLI](../../README.md#checklist) — without it a skill degrades to prose. ← back to [all five suites](../../README.md).

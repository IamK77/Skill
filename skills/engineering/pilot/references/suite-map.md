# The Engineering Suite — Map, Disambiguation, and Sequences

This is the depth behind `pilot`'s routing. The SKILL.md gives the one-screen map and the router; this file gives the per-skill role in full, the sharp distinctions for the pairs people confuse, and ready-made sequences for the task shapes that come up most. Open it when a route isn't obvious from the table — a multi-skill job, a close call between two lenses, or a "where do I even start."

---

## The two-axis model

Hold the suite as two axes, not a flat list of ten:

- **The lifecycle spine** is *roughly* ordered — you decide what to build before how to structure it, structure before you build, build before you ship, ship before you maintain. It is not strict (you revisit), but the order is the default sequence for greenfield work.
- **The cross-cutting lenses** are not a phase at all — they are held *over* code that already exists, at any point. `plumb` (craft) and `gauge` (signal) can be applied to a function written five minutes ago or five years ago; `aegis`/`gungnir` (security) likewise.

Most routing errors come from treating a lens as a phase ("we'll do security later") or a phase as a lens ("just sprinkle some architecture on it"). When you route, name which axis you're on.

---

## Per-skill roles — what each owns, and what it does NOT

### Lifecycle spine

- **groundwork** — *what to build.* Elicits the real need behind a stated solution, prioritises, writes verifiable requirements and acceptance criteria, manages scope change. Reach for it whenever the goal is vague or solution-shaped ("add an export button", "make it faster"). **Does not** design the solution — that's load-bearing.
- **load-bearing** — *how it's structured.* Architecture style, module boundaries, contracts, the data model, tech selection, turning NFRs into design + guardrails, ADRs. The home of the irreversible (one-way-door) decisions. Reach for it before building anything structurally non-trivial. **Does not** judge the code inside a module (plumb) or write tests (assay).
- **gauge** — *the feedback surface.* Makes the codebase emit clear, fast, attributed, un-fakeable signal: strict types, boundary validation (parse-don't-validate), errors-as-values, structured failures, the gates that make green trustworthy. Reach for it when an agent keeps guessing or failures are illegible. **Does not** design the tests (assay) or judge readability (plumb), though it meets both at the edges.
- **assay** — *what and how to test.* The risk-driven decision tree: what to test, which test type, which double, the cases that actually catch bugs; flaky tests, coverage, mutation. Reach for it for any "what should I test / write tests / I just fixed a bug". **Does not** set up the CI that runs the tests (flightline) or instrument the code's signal (gauge).
- **flightline** — *the process floor.* Version control & branching, code style enforcement, code review, CI/CD, dependency/build management — quality as an automated floor, not discipline. Reach for it to bootstrap or harden a team/repo's workflow. **Does not** maintain the system over time (husbandry) or design tests (assay) — it *runs* them as gates.
- **stationkeeping** — *get it to prod and keep it serving.* Deploy/release strategy, IaC & config, observability, monitoring/alerting, SLOs & incident response, capacity, cost, backup/DR. Reach for it from "merged" onward. **Does not** write the app or its tests; it operates what's shipped.
- **husbandry** — *keep it cheap to change.* Maintenance: classify/fund the work, make tech debt visible and pay it down, refactor safely under test, defects to root cause, evolve versions/APIs/deps, legacy and retirement. Reach for it for an *existing* system. **Does not** set up the process floor from scratch (flightline) — it assumes a living system and keeps it changeable.

### Cross-cutting lenses

- **plumb** — *code craft / legibility.* "Is this good code?" — naming, function shape, comments, earned abstraction (DRY/AHA), cohesion/coupling inside a module, SOLID/patterns as guidance, code smells, testability as a design litmus. A disciplined-taste lens anchored on "will the next reader have it easier or harder." **Does not** own the machine signal (gauge) or module boundaries (load-bearing).
- **gauge** — *(also a lens)* the feedback signal, applied to any existing code. See above.
- **aegis** — *security shield.* Build it secure: risk-based stance, threat model, secure design, never-trust-input, secrets, OWASP defenses, gate SAST/DAST/SCA. The defensive half.
- **gungnir** — *security spear.* Attack your own system under authorization to prove the defenses hold; confirm real vulns, chain them, report, drive the fix, re-test. The offensive half — proves what aegis builds.

---

## Disambiguation — the pairs people confuse

A sharp question for each close call. When two skills both seem to fit, ask the question; it picks one.

- **plumb vs gauge** — *Is the problem that a human reading the code has a hard time, or that a machine/agent can't trust the green?* Hard to read, clever, badly named, over-abstracted → **plumb**. Types are loose, `Any` everywhere, failures opaque, the agent keeps guessing → **gauge**. They meet at the trust-chain (a leaked `Any` is both), but the *primary symptom* picks the lens.
- **assay vs gauge** — *Are we designing the tests, or the surface the tests (and the checker) report through?* The cases, doubles, oracles → **assay**. Whether the codebase emits clear signal at all (types, validation, errors-as-values, un-fakeable gates) → **gauge**. assay designs the behavioral oracle; gauge makes *all* signal (including that oracle) trustworthy and un-fakeable.
- **load-bearing vs plumb** — *Is the question about the boundaries between modules, or the code inside one?* Where to draw the line, the contract across it, the data model → **load-bearing**. Whether the code within a module is clean → **plumb**. Same words (cohesion/coupling) at two scales.
- **flightline vs husbandry** — *Are we setting up the process for a repo, or keeping a living system changeable?* CI, branching, review, lint, hooks, reproducible builds → **flightline**. Tech debt, refactoring under test, defect root-cause, version/dependency evolution, legacy → **husbandry**. flightline builds the floor; husbandry walks on it for years.
- **aegis vs gungnir** — *Are we building defenses, or attacking to prove them?* Threat model, secure design, gate the scanners → **aegis**. Authorized pentest, exploit-and-confirm, re-test a fix → **gungnir**. Shield vs spear; gungnir proves what aegis built.
- **groundwork vs load-bearing** — *Is the uncertainty about WHAT to build, or HOW to structure it?* "What should this even do / is this the right thing" → **groundwork**. "Given the what, how do I structure it" → **load-bearing**. groundwork hands its requirements to load-bearing.

---

## Ready-made sequences — common task shapes

Hand off the **first** step; state the rest as the chain. Each skill flies its own and hands back.

- **"Build me a new feature / system" (greenfield, vague):**
  groundwork (pin the real need + acceptance) → load-bearing (structure, only if non-trivial) → build, with gauge (signal) + assay (tests) as you go → flightline (if the repo has no process floor yet) → stationkeeping (to ship) → husbandry (once it's live). *Skip any step the weight class doesn't earn — a small feature in a healthy repo may be just groundwork-lite → assay.*

- **"I inherited a messy repo / where do I even start":**
  flightline AUDIT (is there a process floor — CI, review, reproducible build?) → gauge (is the feedback surface trustworthy, or does the agent fly blind?) → husbandry (make the debt visible, characterization tests before any change) → plumb (craft pass on the hot modules). Start with flightline+gauge because you can't safely change what has no floor and no signal.

- **"Make this production-ready / safe to launch":**
  stationkeeping (deploy/observability/SLOs/DR) + aegis (security stance, gate the scanners) → gungnir (prove it under authorized attack) → flightline (confirm the gates block, not just exist). Security is two skills (build then prove), not one.

- **"Is this good code / review this":**
  First the redirect test — *are there tests for the changed behavior?* If no → **assay**/**gauge** first (you can't meaningfully review behavior with no oracle). If yes → **plumb** (craft) and, for the review *process* itself, **flightline** (the review gate). "Review" almost always decomposes into more than one skill.

- **"Make it faster":**
  groundwork first (what's the actual performance requirement, against what workload — "faster" is a solution-shaped non-goal until quantified) → then load-bearing (if it's structural) or husbandry/plumb (if it's a hot path in existing code). Don't optimise before the requirement and the data say where.

- **"It's a distributed-systems question" (retries, idempotency, ordering, consensus, sharding):**
  Out of the engineering suite — that's the **`distributed` suite (`holdfast`)**. Point there; don't route into engineering.

---

## When the answer is "no skill"

Re-state, because it is half of `pilot`'s job: trivial/throwaway work, non-engineering questions, sub-questions inside an in-flight skill, and asks where the work is too small for the skill it nominally matches — all get a plain "do it directly, here's why," not a flight plan. The suite is a means; routing into it when it isn't earned is the same error as never using it.

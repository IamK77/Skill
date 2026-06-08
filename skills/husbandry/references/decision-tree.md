# The husbandry Decision Tree

This is the deterministic router at the heart of **husbandry** — the engine the stages call into so that two agents maintaining the same system reach the *same* plan. Open it **first**, at STAGE 0 (Frame), alongside [agent-era-shifts.md](agent-era-shifts.md), and keep it beside you through every stage. The other references are the depth on each topic; this one decides *how much* care the system earns, *which* move to make at each fork, and *what catches what*. It is five mechanisms: the **lifecycle-stage sizer** (TREE 0), the **SETUP-vs-AUDIT split** with its status taxonomy, the **debt quadrant router**, the **refactor-vs-rewrite** and **break-vs-deprecate** decisions, and the **keep-vs-retire** call — feeding the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md.

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **Software is read and changed far more than it is written — optimize for the next change, not this one.** A maintenance move that makes *this* change look done while making the *next* one more expensive is a loss, and the agent (optimizing the change in front of it, feeling none of the future cost) will book it as a win. When a fork is a real toss-up, err toward the move that keeps the next change **cheaper, smaller, more reversible, and better understood** — refactor over rewrite, deprecate over break, logged debt over hidden debt. The asymmetry: an over-cautious choice costs minutes; a reckless rewrite, a silent break, or an un-logged debt compounds for years.

---

## TREE 0 — Maintenance investment by stage of life (size before you spend)

Care is a cost; match it to where the system is in its life and what an outage of its *changeability* would cost. Place the system on its life arc — the stage dominates.

| Stage of life | What it looks like | How much care it earns |
|---|---|---|
| **Actively growing** | under heavy feature development; changed daily; long future ahead | the **most** — debt paid down aggressively, living docs, refactor continuously, deps current; the cost of rigidity here is paid every day |
| **Steady-state** | mature; mostly perfective/adaptive change; stable team load | the **standard** floor — managed debt budget, refactor-on-touch, deps current, docs kept live; keep it cheap to change |
| **Legacy (kept alive)** | business-critical but rarely changed; old stack; few who understand it | **targeted** care — characterization tests before any change, lower the bus factor, patch security/EOL; don't fund a greenfield-grade overhaul of something barely touched |
| **Sunsetting** | scheduled for retirement; on life support | the **least** — security/keep-the-lights-on only, plus a *retirement plan*; do not invest in refactoring or features you're about to delete |

- **PREDICATE:** which stage is this system in, and how big is the blast radius of a change to it?
- **DEFAULT** on a coin-flip between two stages: size to the **earlier/more-active** stage for anything load-bearing or high-blast-radius (under-investing in a system that turns out to have a long future is the expensive error), and the later stage for the rest.
- **FALLBACK** when the stage is unclear (no roadmap, uncertain future): assume **steady-state** and make the system's future an explicit question for the user — an unsized system defaults to "the agent does whatever's cheapest now," which is the failure mode this skill exists to prevent.

> **The agent multiplier:** the more of the maintenance an agent does, the *more* the floor must be externalized and gated, not less — because the agent supplies none of the debt-awareness, regression-dread, or implicit knowledge a human maintainer brought. A heavily-agent-maintained steady-state system earns more enforced rigor than its stage alone suggests.

---

## SETUP vs AUDIT — pick the mode, then the status taxonomy

- **PREDICATE:** are you building maintainability *into* a new/young system (rare), or assessing and improving an existing one (common)?
- **SETUP** (greenfield): wire the practices in from the start — a debt register, the refactor-under-test rule, semver, a living-docs habit, dependency automation.
- **AUDIT** (the common case): assess each maintenance capability and fix the gaps. For each, assign a status with **evidence**, then fix only what's weak:

| Status | Means | Evidence that proves it |
|---|---|---|
| **healthy** | the practice exists and is *running* | a debt register with paid-down items; refactors landing under green tests; deps bumped this month; a doc updated alongside its code change |
| **named-only** | claimed but not practiced | a "we track debt" with an empty/stale register; "we have tests" that don't cover the code you'd refactor — treat as **not done** |
| **advisory** | exists but doesn't bind | a debt list nobody budgets against; a deprecation policy never enforced |
| **absent** | not there | — |
| **unknown** | can't tell from here | needs the user / a deeper look |

> The trap this kills: reporting a practice healthy because it is **named** rather than **running**. `named-only` is the most dangerous status — a debt register no one pays down, or "tests exist" that don't actually cover the refactor, looks like safety and is none.

---

## The debt quadrant router (STAGE 1)

Fowler's quadrant classifies *why* the debt exists; the response differs per quadrant. Detail in [technical-debt.md](technical-debt.md).

| | **Prudent** | **Reckless** |
|---|---|---|
| **Deliberate** | "We must ship now and deal with the consequences" — **legitimate.** Log it, schedule repayment. | "We don't have time for design" — known corner-cutting. Log it, repay *soon*; a habit here ossifies the system. |
| **Inadvertent** | "Now we know how we should have done it" — learning. Refactor toward the better design as you revisit. | "What's layering?" — **the fatal corner**, and the agent's default: debt incurred with no awareness at all. |

- **PREDICATE:** is this debt *acknowledged* (someone chose it and logged it), and was it *prudent* (a reasoned trade-off)?
- **DEFAULT** on a coin-flip about whether to take on a shortcut: only take **deliberate-prudent** debt — a clear, logged, repayment-intended choice — and never the reckless kinds. If you can't state the trade-off and log it, don't borrow.
- **FALLBACK** when you find debt of unknown origin (the inadvertent quadrants — the common AUDIT finding): make it visible first (add it to the register, quantify its interest), *then* prioritize paydown by interest; you can't manage what isn't logged.

The whole point: the goal is **managed, visible debt on a paydown budget**, not zero debt. Only-borrow-never-repay is what turns any quadrant fatal.

---

## The refactor-vs-rewrite decision (STAGE 1–2)

The single most consequential fork in maintenance, and the one the agent gets most wrong (it reaches for rewrite — agent-era-shifts SHIFT 2). Default hard toward incremental.

- **PREDICATE:** can the desired end state be reached by a sequence of small, individually-tested, behavior-preserving steps from the current code?
- **Yes** → **refactor incrementally** (STAGE 2), under a test net.
- **The code is opaque/untested and resists incremental change** → still **not** a rewrite yet: add **characterization tests** to make it legible, *then* re-evaluate — most "must rewrite" cases dissolve once the code is under test.
- **A rewrite is genuinely warranted** (the stack is EOL/unsupportable, the design cannot meet a hard new requirement, and the cost is justified *in writing*) → do it as a **strangler-fig incremental replacement**, never a big-bang cutover, and mine the old code's edge-cases/fixes into tests first.
- **DEFAULT** on a coin-flip: **refactor.** The rewrite's cost and its loss of implicit knowledge (the thousands of edge-case fixes invisible in the source) are almost always underestimated; the burden of proof is on the rewrite.
- **FALLBACK** when you can't judge: add tests to make the code legible and changeable, which is progress under *either* eventual path, and decide from there.

---

## The break-vs-deprecate & dependency-currency router (STAGE 4)

**Changing or removing a public interface** (detail in [versioning-and-dependencies.md](versioning-and-dependencies.md)):

- **PREDICATE:** does any consumer outside this change's blast radius depend on the current shape/behavior?
- **No, provably private** → change it freely; bump the version per semver.
- **Yes, or you can't enumerate consumers** → **never delete in place.** Keep the old path, **deprecate** (warn, document, migration guide), hold a transition window, remove later; bump **major** and say it's breaking.
- **DEFAULT** on a coin-flip: assume **a consumer depends on it** — deprecate gracefully; a deprecation cycle is cheap, a surprise break is every caller's incident.
- **FALLBACK** when consumers are unknown (public/widely-used API): treat as breaking, major-bump, provide the migration path.

**Dependency currency** — upgrade cadence:

- **PREDICATE:** is each load-bearing dependency being upgraded continuously, and is its EOL date tracked and ahead of you?
- **DEFAULT:** **small, frequent, test-backed bumps** beat a deferred giant upgrade; automate them (Renovate/Dependabot through the `flightline` gates).
- **FALLBACK** when you inherit a frozen, far-behind dependency: upgrade incrementally through intermediate majors (not one giant leap), behind the test suite, and **migrate before EOL**, never after — a framework past EOL is a security and emergency-migration liability, not a "later" item.

---

## The keep-vs-retire call (STAGE 5)

Systems have an end. Decide it on purpose rather than defaulting to "leave it running forever." Detail in [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md).

- **PREDICATE:** does this system still deliver value that exceeds its cost (maintenance, risk, resource, attention) to keep alive?
- **Yes, and actively used** → invest per its TREE 0 stage; lower the bus factor; keep it changeable.
- **Yes, but barely changed / old stack** → **legacy mode**: characterization-test it, patch security/EOL, document for the next session; don't over-invest.
- **No — superseded, little-used, or its cost exceeds its value** → **plan a retirement**: migrate remaining users (strangler-fig if there's a successor), archive the data, set a decommission date, and **shut it down on the plan**.
- **DEFAULT** on a coin-flip: a system whose value is genuinely marginal is usually costing more attention than it returns — lean toward a *planned* retirement over indefinite zombie upkeep, but never an abrupt shutdown without migrating users and data.
- **FALLBACK** when value is unclear: instrument usage (is anyone actually using it?) and decide from data, not assumption; an un-measured "we might still need it" is how zombie systems live forever.

---

## The change → gate map (what catches what)

Most maintenance failures are one of the classes below, and each stage's gate is the net for one class. Use it to find which gate a real or hypothetical failure exposes a gap in.

| Maintenance failure class | Caught by stage / gate | Reference |
|---|---|---|
| Over-investing in a dying system / under-investing in a growing one; cleverness that the next session can't read | frame / `maintenance-stance-set` | [maintenance-types-and-stance.md](maintenance-types-and-stance.md) |
| Debt compounding invisibly until the system ossifies | debt / `debt-tracked-and-budgeted` | [technical-debt.md](technical-debt.md) |
| An impulsive rewrite that discards years of edge-case fixes | debt / `no-reckless-rewrite` | [technical-debt.md](technical-debt.md) |
| A "cleanup" that silently changed behavior | refactor / `refactor-under-test` | [refactoring.md](refactoring.md) |
| A regression no one can attribute; an unreviewable mega-refactor | refactor / `small-and-separated` | [refactoring.md](refactoring.md) |
| A bug fixed without being understood; effort on the wrong bugs | defects / `triage-and-regression-first` | [defect-management.md](defect-management.md) |
| A suppressed symptom that keeps recurring | defects / `root-cause-fixed` | [defect-management.md](defect-management.md) |
| A silent API break stranding callers | evolve / `versioning-and-compatibility` | [versioning-and-dependencies.md](versioning-and-dependencies.md) |
| A frozen framework forced into an EOL emergency migration | evolve / `dependencies-kept-current` | [versioning-and-dependencies.md](versioning-and-dependencies.md) |
| Knowledge trapped in one head/session; a stale doc misleading the next session | continuity / `knowledge-and-living-docs` | [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md) |
| A big-bang legacy migration; a zombie system never retired | continuity / `legacy-and-sunset-planned` | [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md) |

---

## Worked traversal (a profitable legacy billing service, no tests, agent-maintained)

1. **TREE 0:** business-critical but rarely changed, old stack, few who understand it → **legacy (kept alive)** → *targeted* care: characterization tests, bus-factor, security/EOL — not a greenfield overhaul.
2. **Mode:** existing system → **AUDIT.** Status-pass: debt register `absent`, tests `absent` (so refactor-under-test is impossible right now), deps `named-only` ("we keep them updated" — last bump 3 years ago, framework 6 months from EOL), docs `advisory` (a wiki page last edited 2 years ago, now actively wrong). Most read as **not done**.
3. **Refactor-vs-rewrite:** the agent's instinct is "rewrite this mess." Router says **no** — opaque/untested → add **characterization tests** first to make it legible; re-evaluate after (the rewrite urge usually dissolves).
4. **Dependency router:** the framework is near EOL → upgrade incrementally through intermediate majors behind the new characterization tests, **before** EOL, not after.
5. **Break-vs-deprecate:** the billing API has external consumers you can't enumerate → any interface change is **deprecate-with-migration**, major-bump, never delete-in-place.
6. **Keep-vs-retire:** still profitable and used → **keep**, legacy mode; lower the bus factor by writing down the implicit knowledge the characterization tests surface, and fix the actively-wrong doc (or delete it).
7. Carry the unresolved calls (is a successor planned? what's the debt-paydown budget?) to the user via the escalation ladder rather than assuming.

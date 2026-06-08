# Maintenance Types and the Stance That Sizes Them

This reference is the depth behind **STAGE 0 — Frame** of the [../SKILL.md](../SKILL.md) flight plan, the place where you fund the care and set the lifecycle stance *before* you touch a line. It governs three things: what maintenance actually *is* (four kinds, and the surprise that bug-fixing is the small one), how much of it a living system earns (the organism mindset, and placing the system on its life arc), and the governing principle that turns "design for change" from a virtue into the gate every later stage inherits. The human-era→agent-era shift here is the root one: a human maintainer *felt* the drag of code that resisted change because they were the one coming back to it next month; the agent feels none of that, optimizes the change in front of it, and books "it works now" as done while quietly making the next change more expensive. For *why* this is the spine of the whole skill — the felt cost that vanished, the over-engineering the agent will cheerfully build because it feels no future burden — read **SHIFT 1** in [agent-era-shifts.md](agent-era-shifts.md). This file is the *how*: how to classify the work, how to size the investment, and how to hold the stance so two agents framing the same system reach the same plan.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and overriding every default below:

> **Software is read and changed far more than it is written — optimize for the next change, not this one.**

Everything in this file is a consequence of that sentence. The check this file delivers is `maintenance-stance-set`: the system placed on its life arc, the investment sized to it, and design-for-change set as the standard every change is judged against.

---

## The four kinds of maintenance — and why the big two aren't bug-fixing

The most expensive misconception about maintenance is that it *is* bug-fixing — that a finished system mostly just needs its defects patched. The empirical breakdown (the ISO/IEC 14764 taxonomy, borne out across decades of studies) says the opposite: corrective maintenance — actually fixing defects — is the *smallest* of the four categories. The work that dominates is the work of keeping a living system fitted to a world and a set of needs that **never stop moving**.

| Kind | What it is | Trigger | Share of the work |
|---|---|---|---|
| **Corrective** | Fix defects — wrong behavior reported against the spec the system already has. | A bug surfaces (a user report, a failing monitor). | The **smallest** slice — roughly a fifth. The one people *think* maintenance is. |
| **Adaptive** | Keep the system working in a *changed environment* — new OS/runtime, a dependency or API that moved, a changed regulation, a migrated platform. | The world around the system changed; the system did not. | Substantial and unavoidable — the environment moves whether or not you touch the code. |
| **Perfective** | Add capability or improve a quality attribute — new features, better performance, usability, a new user need. | The need the system serves grew or shifted. | The **largest** slice — the system is alive *because* its users keep wanting more of it. |
| **Adaptive + perfective together** | — | — | **The clear majority** — well over half, often two-thirds plus, of all maintenance effort. |
| **Preventive** | Improve internal structure and clarity to *forestall* future trouble — refactor, clean up, pay down debt, raise test coverage, kill dead code. | Nobody asked, but the system is getting harder to change. | Small *as logged*, large *as leverage* — the one category the agent will never initiate on its own. |

The insight to carry out of this table: **a living system's needs and its environment keep changing, so the dominant maintenance is not repairing what's broken but evolving what works** — adaptive (the world moved) plus perfective (the need grew). Corrective is real and has its own discipline (STAGE 3 — Defects), but if you frame maintenance as "the bug queue," you under-resource the two categories that actually consume the budget and decide whether the system stays cheap to change.

Preventive maintenance is the special case the agent era turns load-bearing. It is the only kind nobody *requests* — there is no ticket, no user, no failing monitor demanding it, only the slow accumulating cost of a structure that's getting harder to change. A human maintainer felt that cost and was nudged toward "leave it cleaner than I found it." The agent feels nothing, gets no green reward for it, and will therefore never initiate preventive work unless the process *schedules and budgets* it. That is exactly why STAGE 1 (Debt) and STAGE 2 (Refactor) exist as gated stages rather than as good intentions: preventive maintenance is the category most valuable over the system's life and least likely to happen on its own.

---

## The cost reality, and the organism-not-building mindset

Maintenance is **60–80% of a software system's total lifetime cost.** Initial development — the part that gets the press, the launch, the demo — is the *down-payment*; the mortgage is the years of change that follow. A frame that treats maintenance as a second-class chore left for whoever's free is mispricing four-fifths of the system's cost, and it is the single most common framing error this skill exists to correct.

The mindset that follows from that number: **software is not a building you finish and walk away from; it is a living thing that needs continuous care.** A building, once built, mostly resists change and is *done*; its value was decided at construction. Software is the opposite — its environment, its dependencies, and the needs it serves keep moving, so a system that isn't continuously tended doesn't hold steady, it *rots*: deps drift toward EOL, docs go stale, structure erodes, and the cost of each change climbs until the system ossifies. The organism metaphor is not decoration; it sets the unit of value. **A living system's long-run worth is decided less by the features it shipped with than by how cheaply it can absorb the *next* change** — because there will be hundreds of next changes, and their cumulative cost dwarfs the launch.

This is where the agent era bites hardest. The agent optimizes the change in front of it and feels *none* of the future cost — it has no "next month" it will personally suffer, no felt drag from a tangle it created, no memory of the system to protect. So the property that decides the organism's survival — cheapness of the next change — is precisely the property the agent is blind to. The whole job of Frame is to move that property from a thing trusted to a maintainer's instinct (an instinct the agent does not have) to a thing **judged and gated on every change.**

---

## Place the system on its life arc — then size the investment

Care is a cost, and not every system earns the same care. A 24/7 revenue system under daily development earns continuous debt paydown and living docs; a soon-to-retire internal tool earns the lights kept on and nothing more. Over-investing in a dying system wastes effort you'll delete; under-investing in a growing one banks the rigidity you'll pay for every day. So the first move at Frame is to **place the system on its life arc** — actively-growing, steady-state, legacy, or sunsetting — and size the rigor to that stage and to the blast radius of a change.

The sizer itself — the four stages, what each looks like, exactly how much care each earns, and the PREDICATE/DEFAULT/FALLBACK for a system between stages — is **TREE 0** in [decision-tree.md](decision-tree.md). Open it and run it; do not re-derive it here. Two reminders to carry as you do:

- **The DEFAULT on a coin-flip is to size to the *earlier/more-active* stage for anything load-bearing or high-blast-radius** — under-investing in a system that turns out to have a long future is the expensive error, and the one the agent's optimize-now instinct makes by default.
- **The agent multiplier:** the more of the maintenance an agent does, the *more* the floor must be externalized and gated, not less, because the agent supplies none of the debt-awareness, regression-dread, or implicit knowledge a human maintainer brought. A heavily-agent-maintained steady-state system earns more enforced rigor than its stage alone suggests.

The mode you operate in — **SETUP** (wire maintainability into a young system, rare) versus **AUDIT** (assess an existing system's maintenance health capability by capability and fix the gaps, the common case) — and its status taxonomy (`healthy` / `named-only` / `advisory` / `absent` / `unknown`) also live in [decision-tree.md](decision-tree.md). The trap that taxonomy kills is reporting a practice healthy because it is *named* rather than *running* — a debt register no one pays down, "tests" that don't cover the code you'd refactor. `named-only` is the most dangerous status because it looks like safety and is none.

---

## Design for change — the governing principle Frame sets

"Optimize for the next change" is not a slogan; it decomposes into three concrete properties you set as the standard at Frame and every later stage enforces. Each guards against a specific way the agent makes the next change more expensive while this one looks done.

### Readability over cleverness

**Code is read far more than it is written** — and in the agent era the next reader is very likely a *fresh agent session with no context*: no memory of why this code exists, no model of where the next change lands, nothing but the source and the docs in front of it. Write for that reader. The boring, obvious, slightly-longer version that the next session reads correctly in one pass beats the clever, compressed, "elegant" one it has to reverse-engineer — and beats it precisely because the agent that wrote the clever version felt no cost in reading it back (it re-reads anything instantly) and so has no instinct steering it toward clarity.

- **PREDICATE:** would a fresh session with no prior context understand this code's intent on a single read?
- **DEFAULT** on a coin-flip between a clever construction and a plain one: take the **plain** one. Cleverness is a cost paid by every future reader to save the author a few lines once.
- **FALLBACK** when the domain genuinely *requires* a non-obvious construction (a real performance hot path, a subtle algorithm): keep it, but make it legible — name it, comment the *why*, and pin its behavior with a test, so the next session can change around it safely instead of breaking it blind.

### High cohesion, low coupling — so a change doesn't ripple

A change is cheap when it stays *local* — touches one module, doesn't force edits across the codebase. That locality is bought by **high cohesion** (each module does one well-defined thing, so related change lands in one place) and **low coupling** (modules depend on each other only through narrow declared interfaces, so a change behind an interface doesn't ripple out to its callers). A tangle of high-coupling modules is the opposite: one business change smears across the whole system, and an agent — taking the shortest path to green, with no felt drag from the coupling — will happily wire any module to any other, congealing "modular" into "tangled" invisibly until a change is impossible to scope.

This is architecture's territory, and the depth on drawing and *machine-enforcing* module boundaries belongs to the `load-bearing` skill — Frame's job here is only to set cohesion/coupling as a maintainability standard and to inherit the structure `load-bearing` built. A system that arrived at maintenance with enforced module seams is one whose changes stay local; one that arrived as a ball of mud will fight every change, and no amount of stance fixes that after the fact. Where the structure is the problem, the move is to refactor toward those seams under test (STAGE 2), not to rewrite.

### No premature optimization, no over-engineering — KISS and YAGNI

The third property is a *subtraction*: do **not** build structure for an imagined future. Speculative generality — the configurable framework for the one case you have, the plugin system for plugins that don't exist, the abstraction layered over a thing with one implementation — is **itself future maintenance burden.** Every speculative structure is more code to read, more surface to change through, more to keep correct, all in service of a future that usually never arrives in the shape you guessed. **KISS** (keep it simple) and **YAGNI** (you aren't gonna need it) are the names of the discipline: build for the need you actually have, and add structure when a real second case forces it, not before.

This is the over-engineering the agent will build *enthusiastically*, because the deterrent that stops a human — the tedium of writing and maintaining speculative scaffolding — does not exist for the agent. It feels no cost in generating the extra abstraction, so "make it flexible / future-proof / extensible" produces a pile of imagined-future machinery the agent will cheerfully construct and the next session will have to read, change through, and keep correct forever. Premature optimization is the same error in a different costume: contorting code for a performance need you have not measured, trading the readability the *next* change depends on for a speedup nothing demanded.

- **PREDICATE:** does a *real, present* requirement demand this structure / abstraction / optimization — or is it for a future I'm imagining?
- **DEFAULT** on a coin-flip: **don't build it.** The simpler design is cheaper to change into whatever the future actually turns out to need; the speculative one is a bet that's usually wrong *and* a standing maintenance tax. (This is the same reversibility logic the `load-bearing` skill applies to architecture — you can add structure cheaply later; un-building speculative structure is the expensive direction.)
- **FALLBACK** when you genuinely can't tell whether the future need is real: build the simple version *now* and record the anticipated extension as a noted question for the user, rather than pre-building it — an unproven future requirement is exactly the over-engineering this property forbids.

---

## How maintainability cashes in every earlier investment

The reason this skill closes the lifecycle rather than standing apart from it is that **every investment the earlier skills made pays its real dividend here, at the moment of the next change.** Frame is where you confirm those dividends are actually banked — or find the gaps, in AUDIT mode, where they're only named.

- The clear requirements and validated understanding from the `groundwork` skill mean a change starts from a known target, not a guess about what the system was for.
- The enforced module boundaries, clean contracts, and ADRs from the `load-bearing` skill are what keep a change *local* and let the next session understand *why* the structure is the way it is instead of undoing a decision it can't see the reasoning for. Cohesion/low-coupling isn't a maintenance-time aspiration; it's an architecture-time investment you're now spending.
- The automated quality floor and CI from the `flightline` skill, and above all the **test suite the `assay` skill designed**, are the safety net that makes change *safe* — the only thing that catches the silent regression a "cleanup" introduces, and therefore the precondition for the refactoring STAGE 2 depends on. A maintainable system is, more than anything else, a *well-tested* one; without tests, every change is a blind rewrite and a hope.
- The observability and error monitoring from the `stationkeeping` skill feed production failures back into the defect loop (STAGE 3), so the system tells you what's breaking instead of waiting for a user to.
- The legible feedback surface the `gauge` skill engineered is what lets the agent maintaining the system get a clear, fast, hard-to-fake signal on every change rather than flailing — the difference between maintenance that converges and maintenance that thrashes.

The thread: a *maintainable* system is not one virtue but the compounded return on all of those investments, and it is realized at the next change or not at all. For an agent the lever is the same as everywhere in the suite — it optimizes for this change and feels none of the future cost, so maintainability must be **engineered and gated**, not trusted to an instinct it does not have. That is the stance Frame sets and the gate `maintenance-stance-set` enforces; carry it into STAGE 1, where the first concrete form of "the next change's cost" — technical debt — gets a register, a budget, and a name.

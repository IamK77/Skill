# Knowledge, Legacy & Retirement

This reference is the depth behind **STAGE 5 — Continuity** of the [../SKILL.md](../SKILL.md) flight plan, the last stage and the one that decides whether a system survives the people and sessions that built it — and whether it dies on a plan or rots into a zombie. It governs three bound-together questions: *does the system's knowledge live anywhere durable enough that the next maintainer can change it safely* (bus factor, living docs), *can you work a valuable-but-scary legacy system without breaking it* (characterization tests, the strangler fig), and *do you shut a system down on purpose when its value runs out, or leave it draining resources forever* (planned retirement). In the human era these were softened by a thing that no longer exists: a maintainer carried the *real* model of the system in their head across years of tenure, used the docs as a fallible aid, mentally corrected the stale parts, remembered why the weird branch was there, and felt the loss when a rewrite threw it all away. None of that survives contact with an agent. The agent has no head to hold the knowledge and no memory between sessions, so the externalized artifacts are not an aid — they are the *only* continuity there is. It both produces staleness (changes the code, skips the doc, gets no green reward for fixing it) and ingests it (the next session reads the stale doc as truth and is actively misled). And facing a scary old system it reaches for the rewrite, feeling none of the implicit knowledge it is about to discard. Read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 7** (the agent rots the docs and then trusts them) and **SHIFT 2** (the agent reaches for the rewrite; restrain it to incremental change, including the strangler-fig over the big-bang) — for *why* these shift; come here for *how* to enforce the opposite. The keep-vs-retire call this stage acts on is routed in [decision-tree.md](decision-tree.md); the life-arc stage that decides how much of this care the system earns was set at STAGE 0 by that same tree.

Every fork below states three things so two agents maintaining the same system reach the same setup:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact, inherited from [decision-tree.md](decision-tree.md), overrides every DEFAULT and FALLBACK here:

> **Software is read and changed far more than it is written — optimize for the next change, not this one.** Knowledge that lives in one head, a doc the last change left wrong, a legacy system no one dares touch, a dead service still drawing power — each makes the *next* change more expensive, and the agent (optimizing the change in front of it, feeling none of the future cost) will book the cheaper-now move as done. This whole stage is the work of moving a system's continuity out of "it's in someone's head / the doc looks right / we'll deal with the old system later" and into "written down where the agent reads it, kept living as a condition of change, pinned under tests, and retired on a dated plan."

---

## Contents

- [Part 1 — Bus factor: the stateless agent's only continuity is what's written down (`knowledge-and-living-docs`)](#part-1--bus-factor-the-stateless-agents-only-continuity-is-whats-written-down-knowledge-and-living-docs)
- [Part 2 — Living documentation: a stale doc is worse than no doc (`knowledge-and-living-docs`)](#part-2--living-documentation-a-stale-doc-is-worse-than-no-doc-knowledge-and-living-docs)
- [Part 3 — Working legacy code safely: pin it before you touch it (`legacy-and-sunset-planned`)](#part-3--working-legacy-code-safely-pin-it-before-you-touch-it-legacy-and-sunset-planned)
- [Part 4 — The strangler fig: grow the replacement around the old system (`legacy-and-sunset-planned`)](#part-4--the-strangler-fig-grow-the-replacement-around-the-old-system-legacy-and-sunset-planned)
- [Part 5 — Planned retirement: shut it down on a plan, not into a zombie (`legacy-and-sunset-planned`)](#part-5--planned-retirement-shut-it-down-on-a-plan-not-into-a-zombie-legacy-and-sunset-planned)
- [Anti-patterns (pre-flight checklist for STAGE 5)](#anti-patterns-pre-flight-checklist-for-stage-5)
- [Escalation ladder (when continuity is still shaky)](#escalation-ladder-when-continuity-is-still-shaky)

---

## Part 1 — Bus factor: the stateless agent's only continuity is what's written down (`knowledge-and-living-docs`)

The **bus factor** is the count of people who would have to be hit by a bus (or, less morbidly, quit, go on leave, or rotate off) before a system became unmaintainable because the knowledge to change it left with them. A bus factor of one is a system one resignation away from being un-changeable: only one person knows why the reconciliation job runs at 3am, which config flag is load-bearing, or how to safely deploy the thing. Lowering the bus factor — spreading the knowledge so no single departure strands the system — is a textbook continuity practice, and the human-era toolkit is real: **pairing** (two people share the context as the work happens), **rotation** (no one owns a component so exclusively that they're the only one who can touch it), **ADRs** (Architecture Decision Records that capture *why* a structural choice was made, the practice `groundwork` and `load-bearing` establish at design time), and **docs** (the runbooks, the README, the onboarding notes that let a newcomer get oriented without a tap on the shoulder).

What the agent era changes is not that these practices stop mattering — it is that **turnover stops being an occasional event and becomes the normal condition of every change**. A human team had tenure: knowledge that lived in heads persisted for years, lossy but present, and the docs were a backup to it. An agent has *no tenure and no memory between sessions*. Session A learns the system by reading it, makes a change, and **vanishes** — none of what it learned survives into session B except what it wrote down. So for an agent-maintained system the bus factor is effectively **one per session, resetting to zero at every boundary**: every session is a new hire on their first day, with access only to the artifacts. This inverts the priority of the human-era toolkit. Pairing and rotation were the *primary* knowledge-spreaders and docs the backup; for a stateless agent the **externalized artifacts ARE the only continuity there is** — there is no person to pair with, no tenure to rotate through, no one who "just knows." Knowledge that the agent does not write into a durable artifact is knowledge that ceases to exist the moment the session ends.

The agent failure mode this guards against: the agent solves a hard problem — reverse-engineers a gnarly invariant, discovers why a fix has to go in a non-obvious place, learns the one safe deploy order — and **never writes it down**, because solving the problem turned the result green and writing the explanation earns no further green reward. The knowledge was real and is now gone; the *next* session pays to rediscover it from scratch, and may rediscover it wrong. So the rule is structural: knowledge the agent gains in the course of a change must be **deposited into the durable artifacts as part of that change**, because for the agent there is no head it would otherwise live in.

```
PREDICATE: if this session vanished right now, could a fresh session change this system
           safely using only the artifacts in the repo?
├─ Yes — the why is in ADRs, the how-to-operate is in runbooks/AGENTS.md, the non-obvious
│     invariants are written where the next session reads them ──► bus factor externalized.
├─ "It's straightforward, anyone could figure it out" ──► usually a tell that the knowledge
│     is in THIS session's context and nowhere on disk. Write down what you had to learn.
└─ Knowledge is genuinely tacit and hard to articulate ──► write the partial — the dated
      decision, the gotcha, the safe-order — into an ADR/runbook; a lossy written record
      beats a perfect one that evaporates at the session boundary.
```

> **DEFAULT** when unsure whether a piece of knowledge is worth externalizing: **write it down.** The cost of an extra ADR paragraph is minutes; the cost of the next session rediscovering an invariant the hard way (or missing it and reintroducing a bug) is the exact compounding expense this skill exists to prevent. **FALLBACK** when you can't tell where it belongs: put the durable *why* in an ADR (it co-locates with the `load-bearing` decision trail) and the operational *how* in the runbook or `AGENTS.md` the next session is guaranteed to read.

---

## Part 2 — Living documentation: a stale doc is worse than no doc (`knowledge-and-living-docs`)

The counterintuitive claim is the whole point of this part: **an out-of-date document is worse than no document at all**, because no doc forces the maintainer to read the code (the one source that cannot lie), while a *wrong* doc actively misleads them in the one place they went looking for truth. In the human era this was a tolerable, well-understood decay: docs drifted, everyone knew docs drifted, and the human maintainer carrying the real model in their head mentally corrected for the stale parts — routing around a wrong sentence the way you route around a pothole you've hit before. The doc was a fallible aid to a knowledgeable reader.

SHIFT 7 detonates that tolerance. The agent has **no head holding the real model** and **no memory between sessions**, so the documentation is not a fallible aid it cross-checks against its own knowledge — it is the agent's **primary source of truth**, read and trusted as fact. And the agent is on *both* ends of the failure: it **produces** the staleness (session A changes the code, feels no pull to update the doc because nothing about the stale doc turns red, and moves on) and it **ingests** the staleness (session B reads the doc session A left wrong and confidently builds on a lie). The old line — stale docs are worse than none — stops being a quip and becomes literally operational: in an agent-maintained system a wrong doc is **poison the maintainer both manufactures and drinks**.

The response is not "write more docs" — a comprehensive manual is the *most* expensive thing to keep current and therefore rots fastest. The response is **living documentation**: lightweight enough to actually maintain, kept in sync as a condition of change, and biased toward the parts that don't rot.

| Property of living docs | What it means in practice | Why it counters the agent failure |
|---|---|---|
| **Updated in the same change** | the diff that changes the behavior also changes the doc, or it does not merge | closes the produce-staleness gap: the doc can't drift if it moves with the code |
| **Lightweight, not comprehensive** | document the durable *why* and the non-obvious; let the code be the source for the *what* | less surface to rot; a small living doc beats a big dead manual |
| **Biased toward the durable *why*** | ADRs (why this architecture), runbooks (how to operate), `AGENTS.md` (what the next session must know) | the *why* changes slowly; volatile *how-exactly* detail rots fastest and is least worth writing |
| **Deletable** | if a doc isn't worth keeping current, delete it | a deleted wrong doc sends the reader to the code; no doc beats a lying doc |
| **Co-located with what it describes** | docs next to the code/decision they explain, in version control, reviewed in the same PR | the reviewer sees the doc go stale in the diff and can block it |

The discipline that makes this enforceable: **treat a code change that left its doc stale as an incomplete change — a defect of that change, not a separate chore.** When a change invalidates a doc, the change is not done until the doc is fixed *or deleted in the same diff*. Deletion is a first-class, legitimate outcome here in a way it is not for code: removing a doc you will not keep current is strictly better than leaving it to mislead, because **no doc beats a wrong one.** Bias the writing toward the ADR/`AGENTS.md` *why* — the decisions and invariants the next session relies on and cannot recover from the code alone — and away from step-by-step *how* that a refactor will silently falsify. (The ADR habit itself is established upstream by `groundwork` for requirements decisions and `load-bearing` for architecture decisions; this stage's job is to keep that trail *living* through the system's whole maintenance life, not let it freeze into a record of how things used to be.)

```
PREDICATE: did this change touch behavior, structure, or operation that an existing doc describes?
├─ No doc describes it, and the why is non-obvious ──► write the lightweight doc (ADR/runbook).
├─ A doc describes it and is now wrong ──► fix the doc in THIS diff. The change isn't done
│     until the doc matches reality — a reviewer who sees the code change but not the doc
│     change should block it.
└─ A doc describes it, is now wrong, and isn't worth maintaining ──► delete the doc in this
      diff. No doc beats a wrong doc; deletion sends the next session to the code, which can't lie.
```

> **DEFAULT** on a coin-flip between updating a doc and deleting it: if you can update it in the same diff cheaply, **update**; if keeping it current is ongoing toil out of proportion to its value, **delete it** rather than letting it rot. **FALLBACK** when you're unsure whether a doc is even still accurate: do not trust it — verify against the code, and if you can't quickly confirm it's right, treat it as stale (fix or delete), because a doc the agent *assumes* is current is exactly the trap SHIFT 7 names.

---

## Part 3 — Working legacy code safely: pin it before you touch it (`legacy-and-sunset-planned`)

A **legacy system** in the sense that matters here is Feathers's: *code without tests*. It is the valuable-but-scary system — business-critical, often profitable, running for years — with no test suite and frequently an old stack, where every change is terrifying precisely because there is no way to know whether you broke something. Michael Feathers's *Working Effectively with Legacy Code* is the canonical method, and its central move is the one the agent most needs and least supplies on its own: **before you change legacy code, pin its current behavior under tests.**

Those tests are **characterization tests** — tests that capture what the code *actually does today*, including its bugs and its quirks, rather than what it *should* do. You don't assert the correct answer; you run the code, observe the output, and assert *that* — freezing the present behavior as a reference. They are not a statement of intent; they are a **net under the trapeze**, so that when you then change the structure, any deviation from the pinned behavior lights up red. (The depth on writing them lives in [refactoring.md](refactoring.md), and the `assay` skill designs them; this part is about *why they gate legacy work and in what order*.)

This is where SHIFT 2 and SHIFT 4 meet, and where the agent is at its most dangerous. Facing a scary, messy, untested old system, the agent's reflex is **"this is bad, let me rewrite it"** — and it feels *none* of the loss of the implicit knowledge baked into that old code: the weird conditional that is scar tissue from a real production incident three years ago, the off-by-one guard someone added after a 2am page, the thousands of edge-case fixes that are invisible in the source and exist *nowhere else*. A rewrite throws all of it away. Worse, even a careful in-place change is unsafe, because the agent has **no felt sense of a behavior change** (SHIFT 4): it will restructure the code and report success while having silently altered what it does, since nothing distinguishes a behavior-preserving change from a behavior-altering one *except a test that fails*. So legacy work has a strict order the agent must be held to:

1. **Do not rewrite, and do not change yet.** The instinct to rewrite is the SHIFT 2 trap; the instinct to "just clean it up a bit" without tests is the SHIFT 4 trap. Both are forbidden first moves.
2. **Pin current behavior with characterization tests.** Find the seams, get the code under test, and assert *what it does now*. The weird branches are the ones to pin hardest — they are usually the encoded fixes you must not lose.
3. **Now change, in small safe steps, under the net.** With behavior pinned, refactor incrementally (the discipline in [refactoring.md](refactoring.md)), running the characterization tests after each step so any regression surfaces immediately and is attributable to the step that caused it.

The payoff beyond safety: writing characterization tests **surfaces the implicit knowledge** the code held silently. Each quirk you have to pin is a piece of the bus-factor problem from Part 1 being made explicit — the test, and the comment explaining why the quirk exists, become the durable artifact that knowledge now lives in. And the decision-tree's refactor-vs-rewrite fork bottoms out here: most "we have to rewrite this" cases **dissolve once the code is under characterization tests**, because the thing that made a rewrite feel necessary was the inability to change the code safely — which the tests fix.

```
PREDICATE: does a test pin the current behavior of the legacy code you're about to change?
├─ Yes — characterization tests cover the behavior, including its quirks ──► change in small
│     steps under the net, running the tests after each (see refactoring.md).
├─ No, and the agent wants to rewrite it ──► STOP. The rewrite discards the implicit knowledge
│     the old code encodes. Add characterization tests first; re-evaluate after — the rewrite
│     urge usually dissolves once the code is legible and changeable.
└─ No, and the code resists being put under test (tangled dependencies, no seams) ──► find a
      seam (Feathers's techniques) to get a characterization test around even a slice; pin what
      you can before touching it. An untested change to legacy code is undetectable rewriting.
```

> **DEFAULT** on a coin-flip about whether legacy code needs pinning before a change: **pin it.** The agent cannot feel the regression a missing test would have caught, so "this change is small enough to be safe" is precisely the judgment that fails silently. **FALLBACK** when the code genuinely resists being put under test: get a characterization test around the *largest safe slice* you can, change only within that slice, and record the unpinned remainder as residual risk rather than changing blind.

---

## Part 4 — The strangler fig: grow the replacement around the old system (`legacy-and-sunset-planned`)

When a legacy system is too large or too dated to fix in place and genuinely must be *replaced*, the question is *how* to replace it — and this is the system-scale form of the refactor-vs-rewrite fork. The agent's reflex (SHIFT 2 at system scale) is the **big-bang cutover**: build the whole new system, then on flag day switch everything over at once. It is the highest-blast-radius move in maintenance. Every risk lands simultaneously, the new system has to be perfect on the first day under real load, there is no incremental learning, and the rollback is "switch the entire business back to the old system" — which after months of building the new one, usually nobody can actually do. The implicit knowledge problem from Part 3 is here too: a big-bang rewrite of a whole system discards the accreted edge-case fixes of the *entire* old system at once.

The disciplined alternative is Martin Fowler's **strangler-fig pattern** (named for the vine that grows around a host tree, gradually taking over until the original can be removed and the fig stands on its own). You **grow the new system around the old one and route functionality over to it incrementally**, retiring the old system piece by piece, until nothing is left routed to the old system and it can be removed. The old and new run side by side throughout; at every step the bulk of the system is the proven old one, and only the slice you just moved is new and at risk.

| | **Big-bang cutover** | **Strangler-fig (incremental replacement)** |
|---|---|---|
| **Blast radius** | the entire system, all at once, on flag day | one slice at a time; the rest stays on the proven old path |
| **Rollback** | revert the whole business to the old system (usually impossible after months) | re-route the one slice back; small and real |
| **When risk lands** | all of it on cutover day, under real load, with no rehearsal | distributed across many small, observed moves |
| **Implicit knowledge** | discarded wholesale; the new system relearns every edge case in prod | migrated slice by slice; each move can carry the old code's fixes forward as tests |
| **Learning** | none until the end, when it's too late to change course | every migrated slice teaches you before you move the next |
| **Agent fit** | the agent's reflex; feels cheap because it can generate the new system fast | the enforced default; each step is small, tested, reversible |

The mechanism in practice: place a **routing layer** (a façade, a proxy, an API gateway, a feature flag) in front of the old system so callers hit the router, not the old system directly. Then, slice by slice, stand up the equivalent functionality in the new system, **route that slice's traffic to the new path while the rest still goes to the old**, verify it under real load, and only then move the next slice. Each slice is itself a small, reversible change under a test net — exactly the incremental discipline this whole skill enforces — and crucially, each slice is an opportunity to **mine the old code for the edge-cases and fixes it encodes and carry them forward as characterization tests** (Part 3), so the implicit knowledge migrates instead of being discarded. The decision-tree's refactor-vs-rewrite call routes a genuinely-warranted rewrite *here* — "do it as a strangler-fig incremental replacement, never a big-bang cutover" — and the keep-vs-retire call routes a system that has a successor through the strangler fig as the migration path. A rewrite is rare and must be justified in writing; *when* it is justified, the strangler fig is *how*.

```
PREDICATE: can the replacement be grown incrementally — stand up new functionality slice by
           slice behind a router, moving traffic over a piece at a time?
├─ Yes ──► strangler fig: route through a façade, migrate one slice at a time, verify each
│     under real load before the next, carry the old code's edge-cases forward as tests.
├─ "Just build the new one and switch over on launch day" ──► that's the big-bang the agent
│     reaches for. Refuse it; the rollback doesn't exist and all the risk lands at once.
│     Find the seams to slice the migration instead.
└─ The system seems genuinely un-sliceable (no clean seams to route at) ──► the seam problem
      is the first thing to solve, not a reason for big-bang; introduce the routing layer / API
      boundary first (a load-bearing refactor), THEN migrate incrementally behind it.
```

> **DEFAULT** on a coin-flip about migration style: **strangler fig.** The big-bang's cost and its all-at-once risk are almost always underestimated, and its rollback usually does not exist; the burden of proof is on anyone proposing a flag-day cutover. **FALLBACK** when you can't yet see how to slice the migration: invest first in the routing seam (a façade/proxy in front of the old system) — that work is progress under *any* eventual migration and converts an un-sliceable problem into a sliceable one.

---

## Part 5 — Planned retirement: shut it down on a plan, not into a zombie (`legacy-and-sunset-planned`)

Systems have a lifecycle, and the lifecycle ends. A system past its usefulness — superseded by a replacement, used by almost no one, costing more in maintenance, security exposure, attention, and infrastructure than the value it returns — should be **decommissioned on a deliberate plan, not left running forever**. The failure mode this guards against is the **zombie system**: a service nobody owns, nobody uses much, nobody dares turn off, quietly drawing infrastructure cost, accumulating unpatched CVEs as a standing breach, and — most expensively — consuming *attention*: every audit, every dependency upgrade, every security review, every on-call rotation still has to account for it. Zombies are not free to keep alive; they are a recurring tax paid out of the same maintenance budget the live systems need.

The agent-era angle is the connection back to Parts 1–2: an agent does not *decide* to retire anything. Retirement earns no green reward — it's pure removal with risk attached — so the agent's default is to **leave it running**, the cheapest immediate move, which is exactly how zombies accumulate. And a zombie is doubly poisonous to a stateless agent: its stale docs (Part 2) and its trapped knowledge (Part 1) sit in the corpus the *next* session reads, so a dead system keeps misleading live work long after it stopped doing anything useful. Retirement must therefore be a **decided, dated, planned act**, not an absence of one.

**Decide keep-vs-retire from instrumented data, not assumption.** The question "is anyone actually using this?" is answerable, and the agent (like the team) must answer it with a number, not a guess. **Instrument usage** — request counts, active users, last-meaningful-transaction timestamps — and decide from the data. An un-measured "we might still need it someday" is precisely how zombie systems live forever; a system with a usage graph flat at zero for a quarter is a system you can retire with evidence. (The keep-vs-retire fork is routed in [decision-tree.md](decision-tree.md); its FALLBACK is exactly this: instrument usage and decide from data, not from an assumption nobody re-examines.)

When the call is *retire*, run the decommission as an ordered plan — never an abrupt `terminate`:

1. **Announce the sunset with a date.** Tell the remaining users/callers the system is being retired, by when, and what replaces it. A dated deprecation window is the same courtesy to consumers that graceful API deprecation is (the SHIFT 6 discipline in [versioning-and-dependencies.md](versioning-and-dependencies.md)) — applied to a whole system.
2. **Migrate the remaining users.** Move whoever is left to the successor — via the strangler fig (Part 4) if there is one — so retirement doesn't strand anyone. This is where the usage instrumentation pays off twice: it tells you *who* still depends on the system and must be migrated before the lights go out.
3. **Archive the data.** Preserve what has lasting value — records, audit trails, anything with a legal or analytical retention requirement — somewhere durable and retrievable, *before* the system that holds it is gone. Verify the archive is actually restorable, not merely written (the same untested-backup trap the `stationkeeping` skill warns against: an archive nobody has read back is an assumption, not a safeguard).
4. **Set a decommission date and shut it down on the plan.** With users migrated and data archived, take the system down on the announced date — decommission the infrastructure, revoke its credentials and access, remove its monitoring and on-call, and **delete or clearly archive its now-dead docs and knowledge artifacts** so they stop misleading the next session (closing the Part 2 loop). The system is now off the maintenance budget, not lingering as a zombie on it.

```
PREDICATE: does this system still deliver value that exceeds its full cost to keep alive
           (maintenance, security exposure, infrastructure, attention)?
├─ Yes, actively used (per usage data) ──► keep; invest per its life-arc stage, lower the
│     bus factor, keep it changeable. Not a retirement candidate.
├─ No — superseded / near-zero usage / cost exceeds value ──► plan a retirement: announce a
│     dated sunset, migrate remaining users (strangler fig to the successor), archive and
│     verify the data, then shut down on the date and remove its dead docs.
└─ Can't tell — value is genuinely unclear ──► do NOT default to "leave it running" (that's
      how zombies are born). Instrument usage, watch it for a defined window, and decide from
      the data; an un-measured "might still need it" keeps dead systems alive forever.
```

> **DEFAULT** on a coin-flip about a system whose value is genuinely marginal: lean toward a **planned retirement** over indefinite zombie upkeep — a marginal system usually costs more attention than it returns — but *never* an abrupt shutdown; always migrate users and archive data first. **FALLBACK** when you can't tell whether anyone still depends on it: instrument usage and decide from the graph, and surface the call to the user, who holds the authority on whether a barely-used system is still worth its cost — they own the keep-vs-retire judgment, not the agent.

---

## Anti-patterns (pre-flight checklist for STAGE 5)

| Anti-pattern | Why it bites harder with an agent | The control that kills it |
|---|---|---|
| **Knowledge in one head / one session** | the agent has no tenure and no memory; what it learns and doesn't write down evaporates at the session boundary | externalize into ADRs / runbooks / `AGENTS.md` as part of the change (Part 1) |
| **The lying doc (stale, left to rot)** | the agent both produces the staleness and trusts it as primary truth, misleading its own next session | update the doc in the same diff, or delete it — no doc beats a wrong one (Part 2) |
| **A comprehensive manual nobody maintains** | the most surface to rot; the agent keeps trusting the parts that have gone stale | lightweight living docs biased to the durable *why* (ADRs); let the code be the source for the *what* |
| **Changing legacy code with no test net** | the agent can't feel the regression; an untested change is undetectable rewriting | characterization tests pinning current behavior first, then change in small steps (Part 3) |
| **Rewriting the scary old system** | the agent feels none of the implicit knowledge / edge-case fixes it discards | pin behavior under tests; most rewrite urges dissolve once the code is legible (Part 3) |
| **Big-bang cutover for a migration** | the agent's reflex; all risk lands at once and the rollback doesn't exist | strangler fig: route through a façade, migrate slice by slice, verify each (Part 4) |
| **Keep-vs-retire decided by assumption** | the agent never decides to retire anything; "leave it running" is the cheapest move | instrument usage; decide keep-vs-retire from the data, not a guess (Part 5) |
| **The zombie system never retired** | a dead system drains cost and attention and keeps misleading the next session via its stale artifacts | dated sunset, migrate users, archive data, shut down on the plan, remove dead docs (Part 5) |
| **Abrupt shutdown (no migration / no archive)** | strands remaining users and loses data with lasting value | announce, migrate, archive-and-verify, *then* decommission on the date (Part 5) |

---

## Escalation ladder (when continuity is still shaky)

When a system is "probably understandable, probably safe to change, and probably worth keeping" but you can't point to the proof, climb one rung at a time rather than assuming — assuming is the exact agent failure this stage guards against, and on a long-lived system the wrong assumption compounds for years:

```
write down what THIS session learned (ADR / runbook / AGENTS.md) so it survives the boundary
   → bring the doc into sync with the code in the same change, or delete the doc if it's not worth keeping
      → pin the legacy code's current behavior with characterization tests before changing it
         → migrate any large replacement via the strangler fig (route a slice, verify, repeat) — never big-bang
            → instrument usage so keep-vs-retire is a data call, not an assumption
               → ask the user the one call that's theirs — is this system still worth its cost,
                 and what does an API/system break cost the people who depend on it
                  → if still unresolved, default to the move that keeps the next change cheaper and
                    more reversible (write it down over leaving it tacit, delete a doc over trusting a
                    stale one, strangler over big-bang, planned sunset over indefinite zombie) and note
                    the residual as continuity risk for the user to accept in writing.
```

Each rung costs more than the last; stop at the rung where this system's stage of life and blast radius are covered — an actively-growing, business-critical system earns all of them, a tool you're about to retire earns only the sunset plan. The governing question from [decision-tree.md](decision-tree.md) decides how far you climb: what does it actually cost *this* system to lose the one person who understands it, to mislead the next session with a stale doc, to break under a blind legacy change, or to linger as a zombie — and what does it cost to retire it carelessly? Fund the continuity to that answer and no further. The end state is the one the whole skill points at: a system whose knowledge lives in artifacts the stateless agent can read, whose docs it can trust because they were never allowed to drift, whose legacy it can change because the behavior is pinned, and whose end is a dated plan rather than a zombie no one dares touch — a system that stays cheap to change for exactly as long as it is worth keeping alive, and is shut down on purpose when it is not.

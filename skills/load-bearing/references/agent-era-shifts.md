# Agent-Era Shifts in Architecture

This is the heart of `load-bearing` — the seven ways architecture changes once an agent (or a fleet of them) writes the code, and a human-in-the-loop only verifies and operates it. It is opened at **STAGE 0 (Frame)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The textbook architecture canon — Conway's Law, Monolith First, DDD bounded contexts, CAP, ADRs, KISS/YAGNI, evolutionary architecture — is all still true; this reference re-aims it for a builder that has **no instinct to respect a boundary, feels no cost producing complexity, and forgets everything between sessions.** The other references teach you *how* to do each piece of the work — [architecture-styles.md](architecture-styles.md), [tech-selection.md](tech-selection.md), [boundaries-and-contracts.md](boundaries-and-contracts.md), [data-design.md](data-design.md), [nfr-realization.md](nfr-realization.md), [adr-and-evolution.md](adr-and-evolution.md). This one names *what is different about the work now*. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you design anything

> **Which decisions here are one-way doors, and which am I letting agents revisit freely?** If you cannot sort every looming decision into *irreversible/expensive* (production data schema, public/inter-service contract, auth & trust model, the line where you split into separate deployables) vs *reversible/cheap* (internal layout, library choice, naming, file structure), you are not ready to draw a box. The whole skill is the discipline of spending the user's scarce judgment on the one-way doors and turning the agents loose behind the two-way doors. Everything below is a consequence of that single triage.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when *all* code was expensive to change.
- **WHAT CHANGED IN THE AGENT ERA** — the specific economic or mechanical shift agents introduce.
- **THE DESIGN CONSEQUENCE** — which classic rules this OVERTURNS, which it SHARPENS, and why.
- **DO THIS** — one literal move you execute, phrased for an agent designing on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-reversibility-call-is-unclear) at the end.

---

## SHIFT 1 — Reversibility is the master axis

> **The root shift. If you internalize only one card, internalize this one — every other card is a corollary.**

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "Architecture is the set of decisions that are expensive to reverse" — and *expensive* meant **all of them**, because a human had to hand-edit every line. So the canon said: deliberate carefully up front over module structure, library choices, the lot. The cost of being wrong was uniformly high, so the caution was uniformly high. |
| **WHAT CHANGED IN THE AGENT ERA** | Agents collapse the cost of **reversible** work toward zero — re-laying-out modules, swapping a library, even a from-scratch rewrite are now mechanical jobs an agent does in an afternoon. They do **not** touch the cost of **irreversible** work: migrating live production data, changing a contract others already depend on, redrawing the trust boundary, un-splitting a distributed system. The cost curve that was flat-and-high is now bimodal — near-zero on one side, undiminished on the other. The one classic dimension (cost-of-getting-it-wrong) splits into two: cost-of-being-wrong *times* cost-of-reversing. |
| **THE DESIGN CONSEQUENCE** | **OVERTURNS** "design the internal module structure carefully up front" — that is a two-way door now; a reasonable default plus agent refactoring beats a deliberated guess you will revise anyway. **SHARPENS** "get the data model right" and "design the contract deliberately" — their permanence is now *relatively greater*, because everything around them got cheap to change and they did not. **STRENGTHENS Monolith First**: the only real argument for premature splitting was "breaking a monolith apart later is painful," and that pain is exactly what agents now slash — while the runtime cost of distribution (network failure, distributed consistency, ops, tracing) is untouched. So the case for staying monolithic until the boundaries are *proven* is stronger than it was in 2014. |
| **DO THIS** | Tag every design decision `[1-WAY]` or `[2-WAY]` in your notes. `[1-WAY]` gets a human sign-off and an ADR ([adr-and-evolution.md](adr-and-evolution.md)). `[2-WAY]` gets a default and an explicit "agents may revisit this freely" note. Never gold-plate a `[2-WAY]`; never rush a `[1-WAY]`. |

**Decision fork — is a decision a one-way door?**

- **PREDICATE:** if this turns out wrong in three months, does fixing it require migrating live data, breaking a published contract, a coordinated multi-party deploy, or a security/trust change? Or does it just require an agent editing code behind a stable interface?
- **DEFAULT** on a coin-flip: treat it as **one-way** and give it the deliberation — the asymmetry of regret favors caution on the door you cannot walk back through.
- **FALLBACK** when you cannot tell yet: design so the decision is *wrapped behind an interface you own*, which demotes many one-way doors to two-way (you can swap the implementation later). Record it as a one-way door until the wrapper exists.

> Anti-pattern to recognize: **uniform caution** — agonizing over a library choice with the same gravity as the payments schema. It wastes the human's judgment on doors that swing both ways.

---

## SHIFT 2 — The bottleneck moved from writing code to verifying it

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Writing code was the expensive, scarce step; a senior engineer's hours were the constraint. Architecture optimized to *reduce how much code humans had to write and how hard it was to reason about while writing*. Review was a cheap afterthought relative to authorship. |
| **WHAT CHANGED IN THE AGENT ERA** | Authorship is now cheap and fast; the agent emits plausible code at scale. The scarce, expensive step is **verification** — a human (or a stricter machine) confirming the confident output is actually correct, safe, and within the design. Agents are *confidently wrong*: they produce code that compiles, reads well, passes the happy path, and is subtly broken or unsafe. The constraint moved downstream. |
| **THE DESIGN CONSEQUENCE** | **SHARPENS** the entire stack toward **designed-in verifiability**. Architecture is now partly a verification apparatus: strong static types over stringly-typed data, contract tests at every seam ([boundaries-and-contracts.md](boundaries-and-contracts.md)), parse-don't-validate at trust boundaries, observability as a first-class structural concern ([nfr-realization.md](nfr-realization.md)). A choice that makes wrong code *fail loudly and early* now beats a choice that is marginally more elegant. This re-weights tech selection (SHIFT 5) and NFR realization toward whatever gives the reviewer leverage. |
| **DO THIS** | For each major component ask: "When the agent gets this wrong, what catches it before the user does?" If the answer is "the human notices in review," design a cheaper guard — a type, a contract test, an invariant assertion, a fitness function. Make the guardrail part of the architecture, not a hope. |

> Anti-pattern: **optimize-for-authorship** — picking the structure that is fastest to *write* (a dynamic blob, an untyped event bus) when authorship is no longer the bottleneck and you have just made verification harder.

---

## SHIFT 3 — Boundaries must be machine-enforced

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A boundary documented in a wiki and a diagram held up reasonably well, because a human engineer *feels friction* crossing a layer — reaching from a controller straight into the database feels wrong, violates the mental model, draws a reviewer's eye. Social and cognitive pressure enforced the architecture between formal checks. |
| **WHAT CHANGED IN THE AGENT ERA** | An agent feels **nothing**. It has no aesthetic discomfort, no team norm, no memory of the design discussion. Faced with a failing test and a shorter path through a forbidden import, it will wire the controller straight to the DB and report success. Unenforced boundaries do not erode slowly anymore — they erode at agent speed, on the first convenient opportunity, silently. |
| **THE DESIGN CONSEQUENCE** | **OVERTURNS** "a clearly documented boundary is enough." A boundary that lives only in prose is decorative. **SHARPENS** the worst case: the **distributed monolith** (physically split, logically entangled) and the **shared database** are now *more* likely, because an agent will reach across an undefended logical line by default. Every boundary you actually care about must be encoded as an **executable constraint**: dependency-direction rules, module-boundary lint, import allow-lists, architecture fitness tests in CI. If it is not in the build, it is not a boundary. |
| **DO THIS** | For each boundary from [boundaries-and-contracts.md](boundaries-and-contracts.md), name the **enforcement mechanism** before you call it a boundary: e.g. an architecture-test (ArchUnit / ts-arch / import-linter / dependency-cruiser / Rust module visibility / Go internal packages), a fitness function that fails the build on a banned dependency edge. No named mechanism → it is a suggestion, not a boundary. |

**Decision fork — how hard must this boundary be enforced?**

- **PREDICATE:** would an agent crossing this boundary cause an irreversible problem (a one-way door from SHIFT 1: data coupling, a leaked trust zone, a hidden distributed dependency)?
- **DEFAULT** on a coin-flip: enforce it in CI. A failing build is cheap; an entangled architecture discovered in month six is not.
- **FALLBACK** when you cannot wire enforcement yet: make the boundary *physically* harder to cross (separate package/module/crate with a minimal public surface) so the path of least resistance respects it, and file enforcement as a tracked follow-up — not a "we'll remember."

---

## SHIFT 4 — Conway's Law generalizes to agents; modules must be agent-sized

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Conway's Law: a system's structure mirrors the communication structure of the human org that builds it. So you aligned module boundaries with *team* boundaries — one team owns one service, clean seams reduce the coordination two teams need. The unit of ownership was a team. |
| **WHAT CHANGED IN THE AGENT ERA** | The builders now include agents, and an agent's "communication bandwidth" is its **context window** — what it can hold coherently at once. The Conway analogy generalizes: a module should be *agent-sized*, fitting into one working context together with its contracts and tests, so a single agent can own it end-to-end without thrashing or losing the thread. And a fleet of agents working in parallel collides exactly where humans on different teams would — at shared, fuzzy seams — so clean, contract-defined boundaries are what let multiple agents work simultaneously without stepping on each other. |
| **THE DESIGN CONSEQUENCE** | **SHARPENS** "high cohesion, low coupling" and "split by bounded context" with a new sizing criterion: a boundary is good partly if *one agent can hold one side of it whole*. A god-module that no single context can contain is now a productivity bug, not just a smell. **STRENGTHENS** interface-first design (SHIFT 6 / [boundaries-and-contracts.md](boundaries-and-contracts.md)): a fixed contract is the protocol that lets parallel agents — like parallel teams — work both sides without continuous coordination. The inverse-Conway move (shape the architecture to get the collaboration you want) now applies to *how you parallelize agents*, not just how you staff teams. |
| **DO THIS** | Size each module so its core code + its contract + its tests fit one agent's working context. If a module is too big for one agent to reason about whole, that is a signal to split it (or its contract is doing too much). Assign each parallel agent a module bounded by a **stable contract**, never a shared mutable internal. |

> Anti-pattern: **the context-overflowing module** — a 4,000-line "core" no single agent can hold, so every change is a partial, blind edit. Split by capability until each piece is agent-sized.

---

## SHIFT 5 — Tech selection optimizes for model-fluency + version-stability + reviewer-verifiability

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The core trade-off was *team-familiar* technology vs *theoretically best* technology. Unfamiliar tech cost human learning time, hiring difficulty, and rookie mistakes; "boring technology" and team fluency were prized because the human had to learn and operate it. The familiarity that mattered was the *team's*. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent's "familiarity" is its **training distribution**. It is fluent and reliable in technologies with a deep, stable corpus and slow-changing idioms; it **hallucinates APIs** in niche frameworks, in anything that churned hard after its knowledge cutoff, or in bespoke internal DSLs it has never seen. Meanwhile a human still has to *verify, operate, and debug* whatever the agent writes — so the stack must also be one the human-in-the-loop can review and run in production. Two new axes join the classic ones. |
| **THE DESIGN CONSEQUENCE** | **RE-AIMS** "boring technology" — it is still right, but for a new reason: boring = well-represented in the corpus + stable idioms = the agent gets it right and the reviewer can check it. **OVERTURNS** "team learning cost is the dominant input" (the agent doesn't learn the way a team does) and **REPLACES** it with: (a) **model fluency** — favor mainstream, mature, deeply-documented stacks the agent writes correctly; (b) **version stability** — avoid bleeding-edge churn the agent will get subtly wrong against its cutoff; (c) **reviewer verifiability** — favor stacks whose type system, fast tests, and static analysis act as guardrails on agent output, and that the human can actually operate. Keep the durable classics (maturity, ecosystem, license, fit). **SHARPENS** the rejection of résumé/novelty-driven choice — it now also degrades agent reliability, not just team velocity. |
| **DO THIS** | Before adopting a framework, run the fluency test: ask the agent to write a non-trivial idiomatic snippet in it and *check the API calls against real docs*. Hallucinated or outdated calls → the corpus is thin or stale; downgrade or reject. Prefer the stack the user can debug at 3 a.m. over the one that benchmarks 5% faster. Detail in [tech-selection.md](tech-selection.md). |

**Decision fork — niche/cutting-edge stack vs mainstream?**

- **PREDICATE:** is the technology widely represented in training data, stable across the last few versions, and verifiable by the human who will operate it?
- **DEFAULT** on a coin-flip: pick the **more mainstream, more stable** option — agent reliability and reviewer leverage compound across the whole project.
- **FALLBACK** when the niche tech is genuinely required: wrap it behind an interface you own (SHIFT 1 FALLBACK), pin versions hard, and over-invest in contract tests around it, because the agent's output there is least trustworthy.

---

## SHIFT 6 — ADRs are persistent memory across stateless agent sessions

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | An Architecture Decision Record was good hygiene: six months on, it saved a human from archaeology and from re-litigating a settled debate. But it was *optional discipline* — a strong team carried much of the "why" in shared memory, hallway context, and the people who were in the room. |
| **WHAT CHANGED IN THE AGENT ERA** | Every agent session starts from **zero**. The agent that changes your architecture next week was not in the room, holds none of the reasoning, and has every incentive to take the locally-shortest path — which may be to cheerfully undo a deliberate one-way-door decision because it cannot see why the door was shut. The written "why" is the **only** memory that survives across stateless sessions. ADRs stop being optional hygiene and become the load-bearing mechanism that protects irreversible decisions from being casually reversed by the next agent. |
| **THE DESIGN CONSEQUENCE** | **SHARPENS** the ADR from nice-to-have to **required for every one-way door** (SHIFT 1). The content bar is also raised: "we chose X" is useless to a fresh agent; it needs **context, the options considered, and *why the alternatives were rejected*** — the rejected options are precisely what stops the next agent from "discovering" them and walking back the decision. A new behavior emerges: agents should **read the ADRs before changing architecture** and **write an ADR for each architectural decision they make**, so the memory chain is unbroken. |
| **DO THIS** | For every `[1-WAY]` decision, write a short ADR (MADR-style: context · decision · considered options · consequences · why-not the rejected ones). Put ADRs where an agent will load them — in-repo, near the code, discoverable from the module README. At the start of any architecture change, **grep the ADRs first**; if your change contradicts one, that is a stop-and-ask, not a silent override. Full template in [adr-and-evolution.md](adr-and-evolution.md). |

> Anti-pattern: **the unwritten one-way door** — a deliberate irreversible decision with no record, so the next session has no idea it was deliberate and reverses it for a cheap win. The cost lands in production.

---

## SHIFT 7 — KISS/YAGNI must be enforced, not hoped for; evolution is now cheap

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Over-engineering had a natural deterrent: **tedium**. Building the speculative "in case we swap databases someday" abstraction layer was boring, slow human work, so YAGNI was partly self-enforcing — most engineers didn't build the thing because they didn't want to. And *evolutionary* architecture (continuous refactoring toward a better structure) was the aspiration everyone praised and few funded, because the refactors were expensive human labor. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent feels **no tedium**. Ask for the speculative abstraction and it builds it instantly and completely — so the natural deterrent against over-engineering is *gone*, and complexity floods in unless something actively pushes back. Symmetrically, the mechanical refactoring that makes architecture *evolvable* is now cheap — the agent does the tedious migration. So the two halves flip: complexity-restraint must become **active enforcement**, and continuous evolution becomes the **realistic default** rather than the aspiration. |
| **THE DESIGN CONSEQUENCE** | **OVERTURNS** "KISS/YAGNI as cultural hope" — it must become a **gate**. **SHARPENS** the anti-patterns (speculative abstraction, premature optimization, over-engineering): an agent will produce all three on request without friction, so each needs an explicit "is this funded by a *current* requirement?" check. Simultaneously **OVERTURNS** "architecture as a one-shot artifact frozen at kickoff" — since the refactors are cheap, the right posture is **continuous evolution behind fitness functions** ([adr-and-evolution.md](adr-and-evolution.md)): you don't pre-build flexibility (YAGNI), you keep the structure *cheap to change* and change it when a real requirement arrives. Start simple, evolve on evidence. |
| **DO THIS** | Make KISS/YAGNI a gate question on every component: "Is this complexity required by a funded, *present* requirement — or am I building for an imagined future?" Imagined → cut it, even if the agent already wrote it for free; you still pay to maintain and verify it. For flexibility you *will* need, prefer a cheap-to-change simple structure plus a fitness function over a pre-built abstraction. Optimize only after observability (SHIFT 2) shows the real bottleneck — never before. |

**Decision fork — build the abstraction now or not?**

- **PREDICATE:** does a requirement that exists **today** need this generality, or is it "we might need it later"?
- **DEFAULT** on a coin-flip: **don't build it** — the agent can add it cheaply *when* the requirement actually arrives, and you avoid carrying dead complexity through every future review.
- **FALLBACK** when the future need is genuinely likely and the reversal would be a one-way door: build the *seam* (a minimal interface), not the full abstraction behind it — that keeps the option open at near-zero cost. (SHIFT 1's "wrap to demote a one-way door.")

---

## GATE-BY-GATE MAP — which shift governs which check

Re-read the matching shift before you certify each gate in [../SKILL.md](../SKILL.md). The checklist IDs are exact.

| STAGE | GATE check ID | Shift(s) to re-scan | The one question |
|---|---|---|---|
| Frame | `weight-class-set` | SHIFT 4 | "Did I size this for humans **and** parallel agents — neither over- nor under-architected?" |
| Frame | `reversibility-mapped` | **SHIFT 1** | "Is every decision tagged one-way vs two-way, with judgment spent only on the one-way doors?" |
| Structure | `style-justified` | SHIFT 1, SHIFT 4 | "Is this the leanest style the weight class allows — Monolith First, since split-later is now cheap and distribution's runtime cost is not?" |
| Structure | `boundaries-by-capability` | **SHIFT 3**, SHIFT 4 | "Split by bounded context, agent-sized, and is each real boundary **machine-enforced** — not just documented?" |
| Select | `stack-justified` | **SHIFT 5**, SHIFT 2 | "Chosen for model-fluency + version-stability + reviewer-verifiability — not résumé, not novelty?" |
| Contracts-data | `contracts-defined` | SHIFT 2, SHIFT 6, SHIFT 4 | "Contract-first, versioned, treated as both spec and verification oracle, and the seam that parallelizes agents?" |
| Contracts-data | `data-model-justified` | **SHIFT 1**, SHIFT 2 | "Did the hardest-to-reverse layer get disproportionate care — by access pattern and CAP, since agents do **not** make migrations cheap?" |
| Nonfunctional | `nfrs-realized` | **SHIFT 2**, SHIFT 7 | "Is each NFR a decision **and** an enforced guardrail (SAST, perf budget, observability hooks) — because the agent is confidently unsafe/slow?" |
| Record | `adrs-and-evolution` | **SHIFT 6**, SHIFT 7 | "Is every one-way door an ADR with the rejected options, and is the architecture framed as evolved-behind-fitness-functions, not frozen?" |

---

## ESCALATION LADDER — when the reversibility call is unclear

Most shifts resolve at the lowest rung. The hard case is SHIFT 1 itself: you genuinely cannot tell whether a decision is a one-way door, and the rest of the plan hangs on it. Climb one rung at a time — each costs more, so stop as soon as the call is clear. This mirrors the engine in [decision-tree.md](decision-tree.md).

```
1. ASK THE COST-TO-REVERSE QUESTION.
   "If this is wrong in three months, does fixing it touch live data, a depended-on
   contract, the trust model, or a multi-party deploy?" Yes → one-way. No → two-way.
   Resolves most cases on the spot.
      ↓ still unclear
2. CHECK FOR A WRAPPING SEAM.
   Can an interface you own demote this from one-way to two-way (swap the impl later)?
   If yes, build the seam and treat the decision as reversible. (SHIFT 1 / SHIFT 7 FALLBACK.)
      ↓ still unclear
3. READ THE EXISTING ARCHITECTURE.
   Grep the ADRs and the code: has this door already been opened or shut elsewhere?
   A prior decision is itself the answer, and contradicting one is a stop-and-ask (SHIFT 6).
      ↓ still unclear
4. ASSUME ONE-WAY AND DESIGN FOR REVERSIBILITY ANYWAY.
   When you cannot resolve it, take the cautious branch: give it the deliberation AND
   wrap it behind a seam, so you are protected whichever way it turns out.
      ↓ the decision is irreversible AND high-stakes AND you are unsure
5. ESCALATE TO THE HUMAN-IN-THE-LOOP.
   A genuine, irreversible, high-stakes fork is exactly where the user's authority is
   non-delegable. Present the options, the cost-to-reverse of each, and your recommendation
   as a strawman — and get the sign-off before any agent writes the code behind it.
```

**The cardinal rule across all five rungs:** the one move that fails agent-era architecture is letting an agent walk through a one-way door **silently** — no ADR, no human sign-off, no enforced boundary — because the local path was shorter. Every shift in this file is a different defense against that one mistake. Tag it, enforce it, record it, escalate it — in that order — before you ever let the code get written.

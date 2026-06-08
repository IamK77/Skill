# Analysis — Sort By Importance, Expose The Contradictions

This reference is the depth behind **STAGE 1 (Analyze)** of [../SKILL.md](../SKILL.md). Elicitation handed you a pile of raw needs, stated solutions, and stakeholder voices; this stage turns that pile into a *ranked, scoped, contradiction-free* set of requirements that a build can honor. Four jobs, in order: (1) split functional from non-functional and run a deliberate NFR sweep, (2) prioritize with MoSCoW so "everything is important" stops being the plan, (3) hunt down the conflicts between stakeholders before they detonate in development, and (4) draw the in-scope / out-of-scope line that is your only real brake on scope creep. Open this when STAGE 1 sends you here; open [decision-tree.md](decision-tree.md) alongside it to decide *how deep* to go, and re-read [agent-blind-spots.md](agent-blind-spots.md) — most of what wrecks this stage is a named blind spot.

Analysis is where an agent's instinct fails hardest. You did not feel the user's pain, you cannot poll the silent operator, and you are biased to accept the first plausible plan. So this stage is run as a **sweep**, not a conversation: you walk fixed catalogs and forks whether or not the user volunteers the item, and you surface every contradiction out loud rather than quietly picking a side. The gate IDs you are working toward are `analyze functional-nonfunctional-split` and `analyze prioritized-and-scoped`.

Every fork in this reference carries the same three-part contract as the sibling skill, so two agents analyzing the same need reach the same plan:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to choose when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet (almost always: surface it to the user as a sharp question, never guess silently).

---

## The shape of STAGE 1

```
INPUT  : raw needs + stated solutions + stakeholder map   (from elicitation.md)
STEP 1 : CLASSIFY    — functional vs non-functional; run the NFR sweep
STEP 2 : PRIORITIZE  — MoSCoW; produce the Won't list as a deliverable
STEP 3 : DECONFLICT  — find every stakeholder contradiction; resolve or escalate
STEP 4 : SCOPE       — write the in-scope / out-of-scope artifact
OUTPUT : a ranked, scoped requirement set with conflicts resolved or escalated
         → handed to specification.md to be made verifiable
```

Do them in order, but expect to loop: scoping (STEP 4) often re-ranks priorities (STEP 2), and a conflict (STEP 3) is frequently a disagreement about an NFR target (STEP 1). Loop back rather than forcing a straight line.

---

## STEP 1 — Classify: functional vs non-functional

**Functional requirements** describe *what the system does* — an observable behavior, a transformation of input to output, a rule it enforces. "A user can export the month's orders as CSV." "An expired token is rejected with a 401." If you can phrase it as *"the system shall \<do a thing\>"* and watch it happen, it is functional.

**Non-functional requirements (NFRs)** describe *how well, under what constraints, and within what limits* the system must do those things — performance, scalability, availability, security, privacy, usability, maintainability, observability, portability, cost. They are properties of the *whole*, not of one feature, which is exactly why they are the most-skipped class of requirement and the most expensive to retrofit.

### Why NFRs decide the architecture (and must be surfaced NOW)

A functional requirement can usually be added later as another feature. An NFR usually *cannot* — it constrains the foundation. "Handle 50,000 concurrent users" rules out a single-node design; "tenant data must be physically isolated" rules out a shared schema; "p99 < 50 ms" rules out a chatty per-request fan-out. Discover any of these *after* the architecture is poured and the fix is a rewrite, not a patch. That is the whole reason this sweep runs in STAGE 1, before a single design decision: NFRs are load-bearing inputs to the design, so they must exist before the design does.

### The agent's NFR trap

A human architect carries these questions as instinct. An agent does not — it implements the literal functional ask and ships, because nobody *said* "and it must survive 10× traffic." So you do not wait to be told. You **run the catalog below as a sweep**, asking each row's question of every significant requirement, and you carry the unmentioned ones to the user as explicit questions. An NFR nobody raised is not absent; it is *latent*, and latent NFRs are where the architecture quietly fails.

### The NFR catalog (sweep every row)

For each requirement of any size, walk this table. Ask the question; if the answer is "don't know," that is a question for the user, not a blank to skip. The "why it drives architecture" column is your argument for why this cannot wait until design.

| NFR class | The question to ask (through the user / code / tickets) | Why it drives architecture — surface it BEFORE design |
|---|---|---|
| **Performance — latency** | What is the worst acceptable response time, and at which percentile (p50/p95/p99) under what load? | A latency budget dictates caching, indexing, sync-vs-async, and how many network hops a request may make. Retrofitting low latency means re-laying the data path. |
| **Performance — throughput** | How many requests/events/records per second at peak, sustained vs burst? | Throughput sets batching, queueing, connection pooling, and partitioning. A design that is fine at 10 rps can collapse at 10,000 rps. |
| **Scalability** | What is the growth curve — users, data volume, tenants — over 1–3 years, and must we scale horizontally? | Horizontal scale forces statelessness, sharding, and idempotency from day one; they are nearly impossible to bolt onto a stateful monolith later. |
| **Availability / reliability** | What uptime is promised (e.g. 99.9%)? What is the acceptable RTO/RPO after a failure? Single points of failure tolerated? | Targets above ~99.9% force redundancy, failover, replication, and health-checked deploys — cross-cutting structure, not a feature. |
| **Security** | What is the trust boundary? Who authenticates, who authorizes, what are the attack surfaces (untrusted input, multi-tenant data, secrets)? | Auth/authz model, encryption-in-transit/at-rest, secret handling, and tenant isolation are foundational; "add security later" is how breaches happen. |
| **Privacy / compliance** | What regulated data is touched (PII, PHI, payment, minors)? Which regimes apply (GDPR, HIPAA, PCI-DSS, SOC 2)? Data residency limits? | Compliance dictates data location, retention/deletion, audit logging, and consent flows — legal constraints baked into the data model, not a checkbox. |
| **Usability / accessibility** | Who are the users, what is their context (mobile, low bandwidth, assistive tech)? Is WCAG/Section 508 conformance required? | Accessibility and i18n shape the UI architecture, component choices, and content pipeline; retrofitting a11y onto a finished UI is a rebuild. |
| **Maintainability** | Who maintains this, with what skills? How often will it change? What are the extensibility points? | Drives modularity, coupling, documentation, and tech-stack choice. A design optimized for a one-off differs sharply from one a team evolves for years. |
| **Observability** | When it breaks in production at 3 a.m., what must be visible — logs, metrics, traces, alerts? What is the debugging story? | Structured logging, correlation IDs, metrics, and tracing must be designed in; instrumentation added after an outage is too late for that outage. |
| **Portability** | Must it run across clouds, OSes, on-prem, air-gapped, or edge? Any vendor-lock constraints? | Portability requirements forbid deep coupling to one provider's proprietary services; that constraint shapes every integration choice. |
| **Cost** | What is the budget envelope — infra spend, per-transaction cost, license cost — and who owns it? | Cost ceilings rule out architectures (e.g. always-on GPU fleets, premium managed services) and push toward serverless/spot/batch trade-offs. |

> **Worked sweep —** *Stated ask: "add a CSV export button." Functional core: user exports orders as CSV. NFR sweep surfaces — Performance: a year of orders may be 2M rows; synchronous export will time out → must be async/streamed (architecture decision). Security: export contains customer PII → who is authorized, is it logged? (compliance). Observability: failed exports must be diagnosable. Cost: large exports to object storage cost money. None of these were in the ask; all of them shape the design.* This is why the sweep runs before, not after.

**DEFAULT** when an NFR's target is unknown: do not assume "no requirement." Assume the *industry-normal* bar for the domain (e.g. PII present ⇒ encryption + access logging are non-negotiable), note it as an assumed default, and confirm with the user. **FALLBACK** when you cannot even tell whether a class applies: ask one sharp question per ambiguous class — "Does this feature touch any personal or payment data?" beats guessing.

**Relationship to the STAGE 0 sweep.** STAGE 0 (elicitation.md MOVE 3) already flushed the *implicit safety defaults* — don't-lose-data, don't-store-plaintext-secrets, basic authz — as yes/no facts the user must not be assumed to have waived. This STAGE-1 pass is *not* a rediscovery of those. It owns the **quantified, architecture-deciding targets**: the latency budget, the throughput peak, the uptime number, the compliance regime, the cost ceiling. If a class was already confirmed present in STAGE 0, your job here is to put a *number and an architectural consequence* on it, not to ask whether it exists again.

This step clears `analyze functional-nonfunctional-split`: the two classes are separated **and** the NFR sweep was run deliberately, not left to the user to volunteer.

---

## STEP 2 — Prioritize with MoSCoW

Resources are always finite; an unranked requirement list is a list of equally-urgent promises, which is no plan at all. MoSCoW sorts every requirement into one of four buckets. The point is not the labels — it is forcing a hard conversation about what is truly essential versus merely nice.

| Bucket | Meaning | The test for membership |
|---|---|---|
| **Must** | Non-negotiable for *this* delivery. Without it, the release is a failure or is not legal/safe to ship. | "If this is absent, do we cancel the release?" If no → it is not a Must. Be ruthless; a list where everything is Must has not been prioritized. |
| **Should** | Important and high-value, but the release can ship without it (with pain). | "Painful to omit, but we'd still ship?" If yes → Should. These are the first things sacrificed when time runs short. |
| **Could** | Desirable; included only if effort and time genuinely allow. | "Nice if it fits, no harm if it slips?" → Could. First to be cut, no drama. |
| **Won't (this time)** | Explicitly excluded *from this delivery* — consciously deferred, not forgotten. | "We agree NOT to do this now, and we say so out loud." → Won't. |

### "Won't (this time)" is a first-class deliverable

The most valuable bucket is the one agents skip. **Won't** is the decision, written down, that the team will *not* build something now. It is not a backlog dumping ground and not a rejection — it is an agreement that converts a vague "maybe later" into an explicit boundary. It is also the seed of your out-of-scope artifact (STEP 4): everything in Won't belongs there. An agent's failure mode is to silently treat un-discussed items as future work; naming them Won't makes the boundary real and gives the user a chance to object *now*, while it is cheap.

Always pair Won't with **"(this time)"** — it signals a deferral tied to *this* delivery, not a permanent veto, which keeps the door open for re-prioritization in STAGE 4 (manage) without re-opening scope today.

### How to run MoSCoW as an agent (you can't hold a workshop)

You interview *through* the user. Run it as a structured pass, not an open vote:

1. **Propose a first cut yourself.** Pre-sort every requirement using the membership test and what elicitation told you about the real need. A draft is faster to react to than a blank form — and the agent reacting-to-a-prototype principle from [elicitation.md](elicitation.md) applies to priorities too.
2. **Challenge every Must.** For each one, state the membership test out loud: "I marked auth as Must because shipping without it is a security incident — agree?" Force the user to defend or demote.
3. **Cap the Musts.** If the Must bucket is more than ~60% of the effort, prioritization has failed; push items down until there is real slack. A plan with no Shoulds/Coulds has no room to absorb the inevitable overrun.
4. **Read the Won't list back explicitly.** "Here is what we are agreeing NOT to do this round: X, Y, Z. Object now if any of these is actually essential." This single step prevents the most common late-stage surprise.
5. **Attach an owner to contested items.** If the user cannot adjudicate (it is really the sponsor's call), that is a conflict — route it to STEP 3.

### When MoSCoW is not enough — value/effort and Kano

MoSCoW gives a coarse four-way sort. Reach for a sharper lens when the situation demands:

- **Value vs. effort (impact/effort matrix).** Use when the Should/Could buckets are crowded and you need to *sequence* them, or to justify a cut. Plot each item by business value against implementation effort; the high-value/low-effort quadrant is your quick-win ordering, high-effort/low-value is a Won't candidate. Best when you have rough effort estimates and need a within-bucket order, not just a bucket.
- **Kano model.** Use when you must distinguish *kinds* of value, especially to catch implicit requirements. Kano sorts features into: **Basic/expected** (absent ⇒ anger, present ⇒ no credit — these are the implicit "don't lose data" requirements that *must* be Musts), **Performance** (more is linearly better — the dial you tune), and **Delighters** (unexpected wins; never a Must, often a Could). Reach for Kano when an item "feels important but nobody can say why" — usually it is a Basic expectation that was never stated, and Kano forces it into the Must bucket where it belongs. It pairs naturally with the implicit-requirement hunt in [elicitation.md](elicitation.md).

**DEFAULT** prioritization method: MoSCoW alone. **FALLBACK** when the user cannot prioritize because the items are not comparable (apples vs oranges, or it is genuinely the sponsor's tradeoff): do not invent a ranking — surface the un-rankable set to the user as a decision they or the sponsor must make, and park it as an open question.

This step contributes to `analyze prioritized-and-scoped`: requirements ranked, Won't list produced.

---

## STEP 3 — Conflict detection and resolution

Stakeholders contradict each other; this is not a malfunction, it is the normal state of a system with more than one user. Sales wants more features, operations wants fewer moving parts. The contradiction is *already present* in your requirement set — the only question is whether you find it now, in analysis, or in development, where finding it means rework. **The job is to surface conflicts, not to resolve them silently.** An agent that quietly picks a side has destroyed information the user needed.

### Find conflicts on purpose

Conflicts hide because each requirement looks reasonable in isolation. Hunt them with a deliberate cross-check rather than waiting for one to surface:

- **Cross the stakeholder map against the requirement list.** For each pair of stakeholders from your map, ask "where do their interests pull in opposite directions?" The operator's "keep it simple and stable" routinely fights the power-user's "give me more knobs."
- **Pressure-test each NFR pair.** NFRs are the richest seam of conflict because they trade off against each other physically (see the axes below). Two NFRs that can't both be maximized are a conflict even if no human voiced it.
- **Diff stated needs against implicit ones.** A loudly-stated feature that violates an unstated Basic expectation (from Kano / [elicitation.md](elicitation.md)) is a conflict — e.g. "make onboarding one click" vs. the unstated "we must verify identity."
- **Watch for the same word meaning two things.** Two stakeholders agreeing on "the report must be fast" may mean 200 ms and 2 minutes. Latent until quantified — which is [specification.md](specification.md)'s job, but you flag the ambiguity here.

### Typical conflict axes

| Axis | Pulls one way | Pulls the other way | The tradeoff to make explicit |
|---|---|---|---|
| **Features vs. stability** | More capability, faster (sales, product) | Fewer moving parts, fewer regressions (operations, SRE) | Each feature is surface area for failure; name the reliability cost of the next feature. |
| **Security vs. usability (UX)** | Strong auth, short sessions, strict validation | Frictionless flows, fewer steps, "just let me in" | Every security control adds friction; decide where on that line *with the sponsor*, don't split the difference blindly. |
| **Speed (time-to-market) vs. cost / quality** | Ship now, cheap (business) | Do it right, sustainably (engineering) | Cutting corners borrows against future cost; make the debt explicit and owned. |
| **Flexibility vs. simplicity** | Configurable, generic, future-proof (architects) | Opinionated, minimal, easy to operate (users, maintainers) | Generality is complexity and bugs (this is gold-plating's home — see [agent-blind-spots.md](agent-blind-spots.md)); justify each configuration point against a real need. |
| **Performance vs. cost** | Faster, more capacity | Cheaper infra, smaller footprint | More speed usually costs money (bigger machines, more caching); the budget ceiling from STEP 1 sets the bound. |
| **Consistency vs. availability** | Always-correct data | Always-responsive system | The classic distributed tradeoff; the answer changes the architecture, so it must be decided in analysis. |

### Resolution tactics

You rarely *resolve* a conflict yourself — you make it legible and route it to whoever owns the tradeoff. Tactics, roughly in order of escalation:

1. **Make the tradeoff explicit.** State both sides, the cost of each, and the consequence of each choice in one sentence the user can act on: "More config options means more support burden and more edge-case bugs — is the flexibility worth that?" Often, simply naming the tradeoff lets the user decide on the spot.
2. **Escalate to the sponsor.** When the conflict is a genuine business-priority clash (security vs. UX, speed vs. quality), it is not yours or the user's to settle — it is the funder's. Surface it as a decision *for the sponsor*, with the options framed. The sponsor is the tie-breaker by authority; route value clashes there. (You reach the sponsor *through* the user — name them from the stakeholder map.)
3. **Time-box a decision.** When the conflict is blocking and a perfect answer is unavailable, propose a default with a review date: "We'll go with strict validation for v1 and revisit friction after launch." Records the decision and the open question instead of stalling.
4. **Prototype to decide.** When the conflict is an empirical unknown ("will users tolerate this extra step?", "is the simple design fast enough?"), the answer is data, not debate. Propose the cheapest experiment — a wireframe to react to, a spike to measure latency — and let the result settle it. Ties into the prototype-to-react-to method in [elicitation.md](elicitation.md).

**DEFAULT** when a conflict's owner is unclear: treat it as the sponsor's call and escalate, because the cost of a wrong business tradeoff exceeds the cost of one escalation. **FALLBACK** when you cannot even tell whether two requirements truly conflict (it depends on a number nobody has set): flag it as an open question to resolve in [specification.md](specification.md) when the numbers get pinned, and do not bury it.

> **Escalation ladder for a surfaced conflict** — climb only as far as you must:
> ```
> name the tradeoff to the user           (cheapest; often enough)
>    → frame the options for the sponsor   (business-priority clashes)
>       → time-box a default + review date (blocking, no clean answer yet)
>          → prototype / spike to get data (empirical unknowns)
> ```
> Stop at the first rung that settles it. Never skip straight to "I picked one."

---

## STEP 4 — Scope: draw the in / out line

"What we will *not* do" is as load-bearing as "what we will do." The written out-of-scope list is your single most effective weapon against **scope creep** — the slow, unannounced accretion of requirements that nobody approved and nobody stopped. Without an explicit boundary, every "while you're at it…" lands inside scope by default, and the project bloats until it slips. The boundary turns each new ask into a visible decision instead of a silent expansion.

Everything in the MoSCoW **Won't (this time)** bucket flows straight into the out-of-scope list — that is its destination. STEP 2 and STEP 4 are two views of the same boundary.

### The in-scope / out-of-scope artifact (template)

Write this down, in the requirements doc, in black and white. Vagueness here is where creep enters.

```markdown
## Scope

### In scope (this delivery)
- <Capability A — one line, traceable to a funded requirement>
- <Capability B …>
- Constraints honored: <the Must-level NFRs from STEP 1, e.g. "PII encrypted at rest">

### Out of scope (explicitly NOT this delivery)
- <Excluded item X> — Reason: <Won't this time / deferred / different system / not the real need>
- <Excluded item Y> — Reason: …
- <Tempting adjacent thing Z that someone will ask for> — Reason: …

### Assumptions & boundaries
- <Assumed environment / data / integration limit, e.g. "single tenant only", "English only v1">
- <Anything assumed about NFR targets pending confirmation>

### Change note
Anything not listed In scope is Out of scope by default. Adding to In scope
requires the change process (see validation-and-management.md), not a hallway ask.
```

The last line is the mechanism: it flips the default. With it written down, the burden is on the *addition* to justify itself through a process, not on you to remember why something wasn't built.

### Scope-creep mechanics — how it actually gets in

Name the entry points so you can guard them:

- **The innocent "while you're at it."** A small adjacent ask attached to a real one. Each is tiny; the sum is a different project. Guard: every add goes on the list as a visible item, sized.
- **Gold-plating (self-inflicted creep).** *You*, the agent, adding capability nobody asked for because it seems better or more general — extra config, speculative abstraction, a feature you assumed they'd want. This is the agent-specific form of scope creep and a named blind spot ([agent-blind-spots.md](agent-blind-spots.md)). Guard: build only what traces to a funded requirement; if it's not in scope, it's gold-plating.
- **Vague requirements as a side door.** An un-quantified "make it flexible" admits unlimited future work under one line. Guard: quantify it in [specification.md](specification.md) so its edges are finite.
- **Solution-shaped scope.** Accepting a stated solution as the boundary instead of the real need — building the literal "export button" and then chasing every variant of it. Guard: scope the *need*, not the artifact (see [elicitation.md](elicitation.md)).
- **The undead requirement.** A previously-deferred "Won't" creeping back without anyone deciding to re-fund it. Guard: it re-enters only through the change process, with the sponsor's nod.

### How the out-of-scope list becomes the brake

The list does nothing on a shelf; it works when you *use* it as the response to every new ask:

1. A new request arrives mid-stream.
2. Check it against the artifact. In scope already? Proceed. Listed out of scope? Point at the line — "we agreed this was out for this round."
3. Genuinely new and wanted? It does **not** silently get built. It goes to the change process: assess impact, get the sponsor's call, update the baseline, and only then move it In scope (or back to Won't). This is exactly the handoff to STAGE 4 — see [validation-and-management.md](validation-and-management.md).

That sequence is the brake. It converts "yes, sure" into a decision with an owner and a cost — which is the only thing that actually stops creep.

This step completes `analyze prioritized-and-scoped`: stakeholder conflicts surfaced for resolution, and the explicit in-scope / out-of-scope line written down.

---

## STAGE 1 exit check

Before you clear the gate and move to [specification.md](specification.md), confirm all four jobs are genuinely done — not self-certified:

- [ ] **Classified + swept.** Every requirement is tagged functional or non-functional, and the full NFR catalog was walked row by row, with unknown targets raised to the user rather than skipped. *(→ `analyze functional-nonfunctional-split`)*
- [ ] **Prioritized.** Every requirement sits in a MoSCoW bucket; Musts are capped and defended; the **Won't (this time)** list exists and was read back to the user explicitly.
- [ ] **Deconflicted.** Stakeholder and NFR conflicts were hunted on purpose, each is named out loud, and each is either resolved with the tradeoff explicit or escalated with an owner — none silently decided.
- [ ] **Scoped.** The in-scope / out-of-scope artifact is written down, the Won't items are in it, and the "out by default" change note is present. *(→ `analyze prioritized-and-scoped`)*

If any box is empty, you have not finished analysis — go back, and if a gap traces to a missing need or person, drop back to [elicitation.md](elicitation.md) rather than papering over it. When all four hold, hand the ranked, scoped, deconflicted set to [specification.md](specification.md), where each surviving requirement is made unambiguous and verifiable. Keep [decision-tree.md](decision-tree.md) open for how-deep-to-go calls, and re-scan [agent-blind-spots.md](agent-blind-spots.md) — gold-plating and silent scope creep both make their first move right here.

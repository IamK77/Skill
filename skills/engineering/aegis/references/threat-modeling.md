# Threat Modeling

This reference is the depth behind **STAGE 1 — Model** of the [../SKILL.md](../SKILL.md) flight plan, where the system is, for the first and only guaranteed time before an attacker does it, looked at from the outside by someone asking *who would abuse this, and how*. It governs how you build a threat model: the structured way to summon the adversarial view, draw the system as data flowing across trust boundaries, enumerate what is exposed, and rank what you find so the defense lands where it matters. The human-era → agent-era shift it answers is blunt — a competent engineer carried a rough threat model in their head and half-consciously defended the login form against the brute-forcer and the SQL-in-the-username; the agent carries **no attacker in its head at all** and builds only the cooperative happy path. So threat modeling stops being a *sharpening* of instinct and becomes the *sole source* of the adversarial perspective. See [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 2 — *the agent has no threat model*) for *why* this is now the cheapest, highest-leverage work there is and why it cannot be skipped; this file is the *how*.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and true of every stage in this skill:

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail.

A threat model is the artifact where you act on that fact for the first time: where the attacker who knows everything becomes a concrete list of moves, and where the layers that might fail become a diagram you can point at. It clears exactly one gate — **`threat-model-built`** — and the rest of this file is what "built" has to mean for it to hold against a builder whose every default is the insecure one.

---

## What threat modeling is, and why it is the cheapest leverage you will ever get

A threat model is a structured answer to four questions, asked early and on paper, about a specific system:

1. **What are we building?** — a model of the system precise enough to reason over: its components, the data flowing between them, the boundaries that data crosses, and what is exposed to the outside.
2. **What can go wrong?** — the threats: who would attack this, from where, and what do they want; every way an adversary could violate the confidentiality, integrity, or availability you care about.
3. **What are we going to do about it?** — the mitigations: for each threat worth defending, the control that addresses it (and these become the inputs to the Design and Build stages).
4. **Did we do a good job?** — the validation: is the model complete enough, are the chosen mitigations actually present and tested, and is the model still true as the system changed.

(These four are the Threat Modeling Manifesto's framing; learn them as a loop, not a one-time form.) The leverage is that question 2 is asked *against a diagram*, where the answer to a discovered threat is often a line moved, a boundary added, a component removed — an architectural fix that costs minutes. Discover the same threat after the system is coded and the fix is a refactor; discover it after launch and it is an incident. **Threat modeling is the one place in this skill where defense is nearly free**, because you are editing a picture, not a codebase.

And it is precisely the work the agent never does unasked. Asking "what can go wrong?" yields no green reward, is not implied by the feature prompt, and requires an adversary the agent does not imagine — its default user is friendly. So the entire adversarial view exists only if threat modeling is a **required, explicit, gated step**. Everything below is the method for making that step yield real coverage rather than a list of whatever the agent happened to think of.

---

## STRIDE — the structured prompt that supplies the coverage imagination lacks

Left to free-form brainstorming, threat enumeration covers exactly what the modeler (human or agent) happens to imagine — which, for an agent with no attacker in its head, is close to nothing. **STRIDE** fixes this by replacing imagination with a checklist: six threat categories, each the violation of one security property, asked mechanically of every element of the system. The mapping (Spoofing↔Authentication, Tampering↔Integrity, Repudiation↔Non-repudiation, Information disclosure↔Confidentiality, Denial of service↔Availability, Elevation of privilege↔Authorization), the question each category poses, and the typical defense for each **live in the STRIDE router table in [decision-tree.md](decision-tree.md)** — that table is the lookup; do not duplicate it here. What follows is the **method** for running it over a diagram so the coverage is exhaustive instead of anecdotal.

### How to run STRIDE over a data-flow diagram

STRIDE is *per element*. You apply the six questions to each element of the data-flow diagram (DFD) and write down every "yes, plausibly" as a candidate threat. The DFD has four element types, and not every category applies to every type — the discipline is to sweep them systematically (this is "STRIDE-per-element," the standard technique):

| DFD element | What it is | STRIDE categories that typically apply |
|---|---|---|
| **External entity** | a user, a third-party service, another system you don't control | **S**, **R** |
| **Process** | code that runs: a service, a function, a worker | **S**, **T**, **R**, **I**, **D**, **E** (all six) |
| **Data store** | a database, cache, queue, file, bucket, secret store | **T**, **R**, **I**, **D** |
| **Data flow** | data moving between the above (a request, a query, a message) | **T**, **I**, **D** |

The procedure, done out loud and written down:

1. **Enumerate every element** on the DFD and give it an id. Missing an element means missing all six of its threats — completeness of the diagram is completeness of the model.
2. **For each element, walk its applicable STRIDE letters in order.** For a process: *can it be spoofed? tampered with? can its actions be repudiated? can it leak information? be denied? be elevated?* For each, ask "is this attack plausible *and* would its impact be material?" A "yes, plausibly" is a candidate threat; record it with the element, the category, and a one-line attack sketch.
3. **Pay special, doubled attention to elements that sit on or cross a trust boundary** (next section) — that is where Spoofing, Tampering, and Elevation concentrate, because a boundary is exactly where an attacker's input meets your trust.
4. **Don't stop at the first threat per element.** The agent's failure here is to find one obvious threat and move on; STRIDE's value is forcing the *other five* questions it would never ask.

The output of the sweep is a candidate-threat list, not yet a plan — ranking (below) turns it into one. The point of the mechanical sweep is that it produces coverage the agent's imagination cannot: it cannot forget to ask about Repudiation on a financial process, because the checklist asks for it.

> A note on register: STRIDE is the default structured method because it is simple, exhaustive, and maps cleanly onto a DFD. For a heavyweight system whose crown jewels justify it (TREE 0 → Heavy in [decision-tree.md](decision-tree.md)), attack-tree analysis or a kill-chain framing can supplement it, but they are additive depth, not a substitute — run STRIDE first, always.

---

## The diagram: data-flow, trust boundaries, and attack surface — drawn on the architecture

STRIDE is only as good as the picture you run it over. The picture is a **data-flow diagram annotated with trust boundaries and attack surface**, drawn *on the architecture the `load-bearing` skill produced* — you are not inventing a new model of the system, you are putting a security lens over the one that already exists. Three things must be on it.

### 1. The data-flow diagram

Draw the system as data in motion: external entities, processes, data stores, and the flows between them (the four element types above). Use the architecture's components as the nodes; the value of the DFD over a boxes-and-arrows architecture diagram is that it forces you to follow the *data* — every place a piece of data is received, transformed, stored, and emitted — because data is what the attacker is after and what crosses boundaries. Keep it at the altitude where each node is something you can reason about as a unit; if a node hides a sub-system with its own boundaries, that is a signal to decompose it.

### 2. Trust boundaries — mark every place data crosses from less- to more-trusted

A **trust boundary** is any line where data or control passes from a zone you trust less to one you trust more: the internet → your edge; the browser → your API; your API → your database; a third-party callback → your handler; one service → another; user-space → kernel; even one module → another that assumed the first had already validated. **Mark every one of them on the diagram.** They are the load-bearing annotation, because every trust boundary is a place where the rule "never trust input" must be enforced ([agent-era-shifts.md](agent-era-shifts.md), SHIFT 3) — input that crosses *into* more trust without validation is the root of injection, XSS, and broken access control. The `load-bearing` skill already drew module and service boundaries for cohesion and coupling reasons; **a trust boundary is that same line read for security** — "could the data crossing here be hostile, and is it checked before the more-trusted side uses it?" Where load-bearing asked "could an agent cross this boundary and still get a green build," aegis asks "could an *attacker's data* cross this boundary and be trusted." The lines are often the same; the question is different, and both must be answered.

The agent failure mode this guards against: the agent treats data from "inside" as automatically safe — a value from another of its own services, a field it set three calls ago, a header it expects — and so omits the validation at the boundary the data actually crossed. Marking the boundary makes the trust assumption explicit and checkable instead of implicit and wrong.

> **PREDICATE — is there a trust boundary here?** Does data or control cross from a less-trusted source to a more-trusted user of it (different origin, different privilege level, different owner, or anything you don't fully control)? **DEFAULT** on a coin-flip: **draw the boundary** — an extra boundary costs one validation you'd want anyway; a missed one is an unguarded path for hostile input. **FALLBACK** when you can't tell whether a flow's source is trusted: assume it crossed a boundary and is attacker-controlled until its provenance is proven (the same default as SHIFT 3's input fork) — and let the `gungnir` skill probe whether it is in fact reachable.

### 3. Attack surface — enumerate everything exposed

The **attack surface** is the complete set of points where an attacker can interact with the system: every exposed **endpoint** (every route, including the forgotten admin and debug ones), every open **port**, every **input** (form fields, URL/query params, headers, cookies, request bodies, file uploads, webhook payloads, message-queue messages, even environment and config an attacker might influence), and every **dependency** (each third-party library and service is attack surface you inherit — the supply chain). List it explicitly on or beside the diagram. The discipline that makes this matter: **you cannot defend or even count what you have not enumerated**, and the agent never spontaneously inventories its own exposure — it adds an endpoint to make a feature work and never notes that it widened the surface. The smaller the attack surface, the less there is to defend (which is why *minimize the attack surface* is a Design-stage principle — turn off and delete what you don't use); the enumeration here is what makes that minimization possible later, and what feeds the `gungnir` skill a complete target list rather than the obvious front door.

### Inputs to pull in — don't model in a vacuum

Two upstream artifacts feed this diagram directly, and skipping them produces a model that defends the wrong things:

- **The `load-bearing` skill's trust boundaries and module/contract structure** — the components and the lines between them are your DFD's nodes and candidate trust boundaries. Re-read them with the security question above rather than redrawing from scratch.
- **The `groundwork` skill's security non-functional requirements** — what the user said is sensitive, what the confidentiality/integrity/availability obligations are, which compliance regime applies. These tell you *which* assets are crown jewels and therefore *which* threats matter most when you rank (below). A threat model with no notion of what is worth protecting ranks every threat equally, which is the same as ranking none.

Both are *inputs the agent will not seek on its own*; naming them here is part of the method.

---

## Rank by risk — so the defense concentrates, not spreads evenly

A STRIDE sweep over a real system produces more candidate threats than any budget can defend, and defending them all equally is itself a failure: it spends scarce effort on the trivial and starves the catastrophic. **Rank by risk so the defense lands where it matters.** The base measure is:

> **risk ≈ likelihood × impact**

— how plausible the attack is, times what it costs you if it lands. A SQL injection on the payments endpoint (high likelihood, severe impact) outranks a theoretical timing side-channel on an internal health check (low likelihood, trivial impact), and the ranking says so. **DREAD** is one scheme that decomposes this into five scored dimensions — **D**amage, **R**eproducibility, **E**xploitability, **A**ffected users, **D**iscoverability — averaged into a score; treat it as one *optional* lens for forcing a consistent conversation about likelihood and impact, not as a precise instrument (its numbers are subjective). The point is not the exact arithmetic; it is the **ordering** — a ranked list that tells the Design and Build stages what to defend first.

What pulls a threat up the ranking, hard: it touches a **crown jewel** (the data/capabilities you named as most worth protecting at Frame), or it sits on a **trust boundary**. Those two get defended on principle, ahead of the likelihood-×-impact arithmetic, because a breach of a crown jewel is the catastrophic error this whole skill is sized to avoid.

> **PREDICATE — is this threat worth defending now?** Does it touch a crown jewel or cross a trust boundary, *or* does its `likelihood × impact` rank it above the line your system's weight class (TREE 0) can afford to defend? **DEFAULT** on a coin-flip about a borderline threat: **defend it** if it touches data, money, safety, or a regulated asset (an under-defended breach of regulated data is the catastrophic miss); **defer it**, recorded, otherwise — a deferred-but-named threat is a known accepted risk, which is a position; an un-enumerated threat is a blind spot, which is not. **FALLBACK** when you cannot judge its likelihood (you don't know if the path is reachable): mark the trust boundary it would cross, treat the element as reachable until proven otherwise, and let the `gungnir` skill test reachability rather than guessing it away.

The asymmetry behind every default here is the same one in the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear): over-defending a threat costs some minutes; trusting away a real one ships a breach the agent will have certified green. When a threat's ranking is a genuine toss-up, err toward defending it — and carry the truly unresolvable calls (which assets are crown jewels, what residual risk is acceptable, which compliance regime binds) to the user, who holds that authority, rather than letting the model decide silently.

---

## Do it early, on paper, and keep it alive

Two properties make a threat model worth building, and an agent will violate both unless they are enforced.

**Early and on paper — before the design hardens.** The entire economic argument for threat modeling is that a threat found on a diagram is fixed by editing the diagram. The fixes for the worst classes of weakness — a missing trust boundary, a component that shouldn't be exposed, an authorization model that can't actually enforce least privilege — are **architectural**, and architectural fixes are cheap on paper and expensive-to-impossible in code (the same reason Design is gated before Build, and the reason bolt-on security fails by construction). So threat modeling happens at STAGE 1, *before* the structure is committed and certainly before it is implemented. Doing it after the code exists is not threat modeling; it is a post-mortem on choices you can no longer cheaply change.

**Living, not a launch-day form.** A threat model is true only for the system as it was when you drew it, and the system changes — every new endpoint widens the attack surface, every new integration adds a trust boundary, every new data store adds an asset and the threats against it. A model filed once and never reopened decays into fiction, and the agent will happily add the new endpoint without ever revisiting the model, because re-modeling yields no green reward. So the model is a **living artifact**: when the architecture changes, the DFD, the boundaries, the attack-surface list, and the ranking are updated, and the four questions are re-asked over the delta. Treat "did the threat model get updated for this change?" as part of reviewing any architecturally significant change — the same instinct as updating an ADR, applied to security.

**The output is the map the rest of the skill consumes.** A built threat model is not a document that goes in a drawer; it is the input to the next three stages. The **Design** stage turns each top-ranked threat into a defense — the trust boundaries you marked become boundaries the design *enforces*, the crown jewels become what authentication and authorization protect. The **Build** stage uses the attack surface and the boundaries to know exactly where "never trust input" must hold. The **Verify** stage uses the threat list as the checklist of what must be tested and the target list it hands to the `gungnir` skill for adversarial attack. That downstream consumption is what "built" means at the gate: not "we held a meeting," but **a STRIDE-covered DFD with trust boundaries and attack surface marked on the architecture and threats ranked by risk — a map the design and build stages can act on.** Anything less is the `claimed` status from the AUDIT taxonomy in [decision-tree.md](decision-tree.md), not the real thing.

---

## What "built" requires — the `threat-model-built` checklist

The gate (`checklist check model threat-model-built`) clears only when all of these are true. Read it as the contract; the rest of this file is why each clause reads the way it does.

- [ ] **A model of the system exists as a data-flow diagram** — external entities, processes, data stores, and the data flows between them, at an altitude you can reason over, drawn on the `load-bearing` architecture.
- [ ] **Every trust boundary is marked** — every place data crosses from less- to more-trusted is a line on the diagram, with the validation/authorization that must hold there noted.
- [ ] **The attack surface is enumerated** — every exposed endpoint, port, input, and dependency is listed, including the easily-forgotten admin/debug routes and the inherited third-party surface.
- [ ] **STRIDE has been run per element** — the six questions asked of each applicable element, with each "yes, plausibly" recorded as a candidate threat (one-line attack sketch + element + category), not just the first obvious one.
- [ ] **Threats are ranked by risk** — `likelihood × impact` (DREAD optional as the lens), with crown-jewel- and trust-boundary-touching threats pulled to the top, producing an ordered list the design will defend top-down to this system's weight class.
- [ ] **The crown jewels and security NFRs from Frame/`groundwork` are reflected** — the ranking knows what is worth protecting; it does not weight every threat equally.
- [ ] **It is positioned as a living input** — done before the design hardens, and flagged to be re-opened when the architecture changes, with its output handed forward as the map Design, Build, and Verify consume (and `gungnir` attacks).

If any clause is `absent`, `claimed`, or `present-unenforced` (in the AUDIT status taxonomy of [decision-tree.md](decision-tree.md)), the model is not built — re-open it before advancing to DESIGN.

---

## Cross-references

- [../SKILL.md](../SKILL.md) — STAGE 1 (Model) and the gate this file clears; the six-stage flight plan this model feeds.
- [agent-era-shifts.md](agent-era-shifts.md) — SHIFT 2 (*the agent has no threat model → make the attacker explicit*) for *why* this is now the sole source of the adversarial view; SHIFT 3 for why a marked trust boundary is where "never trust input" gets enforced; and the escalation ladder for when a ranking call is genuinely unclear.
- [decision-tree.md](decision-tree.md) — the STRIDE router table (the category → question → property → defense lookup this file runs over a DFD), TREE 0's risk sizer (which weight class, and therefore how deep the model goes), and the AUDIT status taxonomy that defines what `built` actually means.
- The `load-bearing` skill — the architecture and module/trust boundaries this DFD is drawn on; the `groundwork` skill — the security NFRs and crown-jewel classification that drive the ranking; the `gungnir` skill — the spear that attacks the surface this model enumerates and tests the reachability the model could only assume.

# Conway, the Design System, and the Vitals — externalizing the model so the system outlives its builders

This reference is the depth behind three stages of the [../SKILL.md](../SKILL.md) flight plan — **STAGE 2 (Conway)**, **STAGE 3 (System)**, and **STAGE 4 (Vitals)** — and it governs three checks: **`module-edges-aligned-to-team-edges`**, **`design-system-is-a-real-artifact`**, and **`architecture-vitals-healthy`**. The sibling references own the *mechanics* of self-enforcement and accretion-fighting: [enforce-boundaries.md](enforce-boundaries.md) (import/layer rules, the public-API module, fitness functions, the immune-system meta-rule) and [prune.md](prune.md) (extract/delete/keep, dead-code and stale-flag pruning, state reclassification). This file owns the part of 1-to-N that is *not* a lint rule: **where the seams go (Conway), where the shared mental model lives (the design system), and the one external sign that the model got out of people's heads (the vitals).**

The governing fact, inherited from [the-membrane.md](the-membrane.md) and restated because every call below is judged against it:

> **Frontend's correctness spec lives in a human nervous system, not a document — so the real source of truth is the user's mental model, and a shared mental model that lives only in the builders' heads dies with them. The whole job of this file is to move that model out of heads and into artifacts the machine, the org chart, and a newcomer can read.** And the meta-principle of the stage: **optimize for change, not for the first version** — the system has to stay legible to people who were never in the room.

The three sections are one idea seen three ways. Conway puts the seams where the communication already is. The design system writes the model down so it is found, not retold. The vitals measure whether either actually worked. The agent-era failure they jointly counter is the same one the whole skill fights: **the agent adds and never externalizes — it ships the feature, crosses the boundary, and rots the doc, all without feeling the model staying trapped in the original builder's head.** So all three must be **gated**, because none of them produces a red signal on its own.

## Contents

- [Section 1 — Conway's law made executable](#section-1--conways-law-made-executable)
  - [The law, and why it is not advice](#the-law-and-why-it-is-not-advice)
  - [The probe — "who must be in the room to change X?"](#the-probe--who-must-be-in-the-room-to-change-x)
  - [Inverse Conway — shape the teams to get the architecture](#inverse-conway--shape-the-teams-to-get-the-architecture)
- [Section 2 — The design system as a real artifact](#section-2--the-design-system-as-a-real-artifact)
  - [The living catalog — the four states as stories](#the-living-catalog--the-four-states-as-stories)
  - [Tokens as the single source of visual decisions](#tokens-as-the-single-source-of-visual-decisions)
  - [ADRs as the living "why"](#adrs-as-the-living-why)
- [Section 3 — The vitals: how fast a newcomer ships on the docs alone](#section-3--the-vitals-how-fast-a-newcomer-ships-on-the-docs-alone)
- [How findings route](#how-findings-route)

---

## Section 1 — Conway's law made executable

*Backs the `module-edges-aligned-to-team-edges` check (STAGE 2). The axis: [the-membrane.md AXIS 5 (Medium)](the-membrane.md) — the friction is owned at a seam, not scattered.*

### The law, and why it is not advice

> **A system's structure ends up mirroring the communication structure of the organization that built it — whether you want it to or not.**

This is not a recommendation; it is an observation about a force that acts on your codebase regardless of your intentions. Two teams that have to coordinate constantly will produce two modules tangled together; two teams that barely talk will produce a clean seam between their modules — *and the reverse is also true*, which is the lever. If you draw a module boundary that cuts straight through a single team's daily work, that boundary will erode, because the team's constant internal communication will route around it one cross-import at a time. If you draw a module boundary that a single team owns end to end, the team's natural cohesion *defends* it for free.

So the executable consequence is: **draw module edges to match team edges — one team owns a module end to end — and the code's seams become the org's seams instead of fighting them.** A boundary aligned with a team line is held up by the cheapest enforcement there is (people don't reach across a wall they don't need to reach across); a boundary that cuts across a team is under constant erosive pressure that no amount of lint rules fully stops, because the people on both sides have a daily reason to puncture it.

**Conway alignment is a means, not an end.** The end is *change locality* — that a routine change can be made by one team, in one module, without a meeting. Conway is the tool: it tells you the cheapest place to put the wall is exactly where the org already has a wall. This is why the lint-enforced boundaries of [enforce-boundaries.md](enforce-boundaries.md) and the Conway alignment here are complementary, not redundant — the lint rule is the wall the machine defends at merge; the team alignment is the wall the *people* defend for free. A wall the machine defends but the people fight is a wall under permanent siege.

### The probe — "who must be in the room to change X?"

The law is abstract; the probe makes it operational. For any module or feature, ask the question literally:

> **To make a routine change to X, who must be in the room?**

Map it. Then read the count:

| Probe result for a routine change | Diagnosis | Move |
|---|---|---|
| **One team** can make the change end to end | The boundary is in the right place — it matches a team edge | Keep it; this is the target state |
| **More than one team** must coordinate for an *everyday* change | The module boundary is misplaced — it cuts across a team line | Split it along the team line, or merge the split that shouldn't have been split |
| **Constant cross-team coordination** is the daily reality | The seams and the org chart are fighting; entropy is winning | Re-cut the boundaries to the teams, or (inverse Conway) re-shape the teams |

The discipline that keeps the probe honest is the same one the whole suite uses for its probes: **a multi-team count is a hypothesis, not a verdict.** Some changes *should* need more than one team — a change to a genuinely shared contract, a cross-cutting security policy, a company-wide design-token shift. Those are *rare, deliberate* coordination points, and a wall between them is correct. The finding is not "this change touched two teams"; it is "*routine, everyday* changes keep needing two teams" — that is the misplaced boundary. The probe selects where to look; the diagnosis, confirmed against *"will the next routine change be local or cross-team?"*, is what turns a hit into a finding.

Worked example. A team owns an order-management feature. The product asks for a change to how *order status* is displayed in a filtered list — a routine, frequent kind of request. Run the probe: to change it, the order team must touch the order module *and* file a ticket against a separate "shared list-rendering" team that owns the filtered-list component, because order-status formatting was abstracted into that shared component. Two teams, every time, for an everyday change. The probe fires: the boundary is misplaced. The order-status display logic squatting in the shared list component is the seam in the wrong spot — pull it back into the order module (the order team owns its own status rendering), and the shared component goes back to owning only list *mechanics* that genuinely never change per-feature. Now the routine change is one team, one module. (Whether the shared abstraction was wrong in the first place is a [prune.md](prune.md) extract/delete/keep call — the two findings often co-fire, because a coincidental abstraction and a misplaced seam are the same disease seen from two angles.)

### Inverse Conway — shape the teams to get the architecture

The law runs both directions, and the reverse is a deliberate tool:

> **To get a target architecture, first shape the teams that would produce it.**

If you want three cleanly-separated modules, the most reliable way to get and *keep* them is three teams that own them — because then the law works *for* you: the teams' communication structure produces and defends the module structure you wanted. Trying to hold three clean modules with one undifferentiated team fighting the law is a losing position; the law will pull them back into a tangle.

- **PREDICATE:** you are restructuring an architecture at 1-to-N and the boundaries keep eroding no matter how many lint rules you add.
- **DEFAULT:** before re-cutting the modules again, check the team structure — a boundary that keeps eroding is usually one that cuts across a team, and re-cutting the *teams* to own the modules end to end is the durable fix.
- **FALLBACK:** if team structure is fixed and cannot change (small org, external constraint), then accept that boundaries cutting across the team will need *stronger* machine enforcement (CODEOWNERS, stricter import rules — [enforce-boundaries.md](enforce-boundaries.md)) to survive the erosive pressure, and document that they are under siege so the next session knows to watch them.

The anti-pattern this section kills: **a routine change that needs three teams in the room.** That is the misplaced boundary made visible — the seam is fighting the org chart, and the daily coordination tax is the entropy you are here to fight.

---

## Section 2 — The design system as a real artifact

*Backs the `design-system-is-a-real-artifact` check (STAGE 3). The axis: [the-membrane.md AXIS 6 (Mind)](the-membrane.md) — the shared mental model externalized, because the agent rots the doc and the model otherwise dies in the builder's head.*

The principle: **a shared mental model has to live in an artifact, or it dies with the people who hold it.** A design system that lives in folklore — "ask Priya how the empty states are supposed to look" — is not a design system; it is a bus-factor risk wearing a nice name. The agent makes this acute: it rots the artifact (changes the code, leaves the catalog story and the ADR stale — there is no green reward for updating them) and the next session reads the stale doc as truth, or skips it and reinvents. So the design system must be made into a **real, discoverable artifact** with three load-bearing parts: a living catalog, tokens as the single source, and ADRs as the living "why."

### The living catalog — the four states as stories

A living component catalog (a Storybook-class catalog) documents each reusable component *and its states* in a place a newcomer can discover and search — so components are **found and reused, not reinvented.** The non-negotiable content is that each component documents `seaworthy`'s **four states as stories**: **loading, error, empty, and edge.** These are not afterthoughts — they are the product (the master's reversal: the happy path is ~40% of the work; the quality is in how the system catches the user when it breaks). A catalog that shows only the happy-path render of a component is a catalog that has hidden exactly the part worth reusing.

The executable check is the gate:

> **Can a newcomer find and reuse an existing component instead of building a duplicate?**

If components keep getting reinvented — three slightly-different date pickers, four empty-state layouts that should have been one — the catalog is either **untrue** (it claims a component exists that doesn't match reality) or **undiscoverable** (the component exists but no one can find it). Constant reinvention is the failure signal, and it is the agent's signature: a stateless session with no knowledge of what already exists will build a new one every time unless the catalog makes the existing one findable. *The catalog is a means, not an end* — the end is that the model of "what a loading state looks like here" lives in the artifact, not in the heads of the three people who happened to build the first three.

| Symptom | What it means | Move |
|---|---|---|
| Components reinvented (N near-duplicate date pickers) | Catalog untrue or undiscoverable | Make it discoverable (searchable, linked from the README); reconcile the duplicates back to one |
| Catalog shows only happy-path renders | The reusable part — the four states — is hidden | Add loading / error / empty / edge as stories per component |
| Catalog drifted from real code (stale stories) | The agent rotted the artifact | Treat catalog stories as part of the component's contract; a story that doesn't match is a finding, route to [prune.md](prune.md) for dead-story pruning |

### Tokens as the single source of visual decisions

Design **tokens** (spacing, type scale, color, motion timing) are the single source of truth for visual decisions — inherited from `keel` as code constants, the materialization of the perceptual contract. The executable property: **re-theming is one edit, not a manhunt.** If changing the brand color means grepping for hex codes across forty files, the tokens are not the single source — they are decorative, and the real decisions are scattered hard-coded values. The test is the same as the contract test elsewhere in the suite: *change one token; everything that consumes it changes.* If it doesn't, the token isn't truly wired in (this echoes the first-stage rule — "change a token, all consumers change, or the token is fake"). A scattered visual decision is the two-graphs problem in CSS clothing: the *decision* (the brand color) has no single home, so it is smeared across many sites and drifts.

### ADRs as the living "why"

The third part is **Architecture Decision Records as the living "why"** — and the emphasis is on *living*, against the natural failure mode of documentation. The wrong artifact is a rotting exhaustive API doc that tries to describe everything, is never fully accurate, and goes stale the day after it is written (the agent's doc-rot, industrialized). The right artifact is a small set of **load-bearing decision records**: *why* we chose this state-classification scheme, *why* the network boundary is here, *why* this module is split the way it is. ADRs keep the *reasoning* alive after the people who made the decisions have gone — they answer the newcomer's most expensive question ("why is it like this, can I change it?") without a senior in the room.

The discriminator: an ADR records a **decision and its reasoning at a one-way door**, not the current state of the code (the code is its own truth; a doc that restates it just rots). The PREDICATE for writing one: the decision was load-bearing and would be expensive to reverse, *and* a newcomer would otherwise have to ask a person why it is the way it is. The DEFAULT: if a decision is reversible and cheap, don't ADR it — that is just more doc to rot. The FALLBACK: when in doubt whether a decision is load-bearing, ask "if a newcomer changed this without knowing the reasoning, would they break something subtle?" — if yes, the reasoning is load-bearing and belongs in an ADR.

The anti-pattern this section kills: **a design system as folklore.** If components keep getting reinvented, the catalog is untrue or undiscoverable; if re-theming is a manhunt, the tokens are fake; if the only answer to "why is it like this" is a person, the why lives in a head, not the structure.

---

## Section 3 — The vitals: how fast a newcomer ships on the docs alone

*Backs the `architecture-vitals-healthy` check (STAGE 4, the final gate). The axes: [the-membrane.md AXIS 5 (Medium) and AXIS 6 (Mind)](the-membrane.md). 1-to-N has no exit, so the vitals **replace** an exit criterion.*

There is one external metric that reads the health of everything above, and it is deceptively simple:

> **How fast can a newcomer ship a real feature to production — on the docs alone, with no tribal knowledge?**

It is the single best external sign because it integrates everything: the boundaries, the catalog, the tokens, the ADRs, the team alignment, the reproducibility gate. It cannot be faked, because it measures whether the mental model actually got externalized into the structure or merely *feels* like it did to the people who already hold it.

| Vital | Healthy | Unhealthy |
|---|---|---|
| **Time to first independent delivery** | **Days, not weeks** | **Weeks, and climbing** |
| The path | Clone → README runs and deploys it (`keel`'s reproducibility gate) → clear boundaries let them locate the relevant module → reuse from the catalog → ship a slice down a proven vertical path | A senior must walk them through "what not to touch" |
| What it proves | The model lives in the **structure** (code + docs + catalog) | The model lives in a **head** — exactly the entropy you fight |

The diagnostic power is in the unhealthy column. **If onboarding needs a senior to say "don't touch that," the architecture lives in someone's head, not in the structure** — and that is the entropy this whole skill exists to fight, made visible. The "what not to touch" knowledge is precisely the model that should have been a CODEOWNERS rule, a lint boundary, an ADR, a catalog entry. Every time a senior has to transmit it verbally, the structure failed to hold it.

Because there is **no exit** — 1-to-N is a steady state — the gate is not a one-time pass but a set of **standing health signs** you re-read as the system grows:

- Boundaries machine-enforced, and **each new violation class turned into a new rule** (the immune-system meta-rule — [enforce-boundaries.md](enforce-boundaries.md)).
- The **global store stays small** as features grow (the store-size thermometer — [prune.md](prune.md)); if it swells, server-cache drifted back in.
- **The cost of the Nth feature ≈ the cost of the first** — no *entropy tax*. If adding the hundredth feature is far more expensive than the first, entropy is winning.
- **Abstractions pruned, not just piled** ([prune.md](prune.md)).
- **Module edges match team edges** — routine changes are one-team (Section 1).

And the one number to track over time: **time to first independent delivery.** It is a leading indicator, not a snapshot — **if it is climbing, rot is outrunning your documentation of it.** That is the steady-state alarm: not "the build is red" (the agent reads green as safety), but "it takes a little longer each quarter for a new person to ship," which no test catches and only this metric reveals. *The metric is a means, not an end* — the end is a system that stays cheap to change as people and features multiply, and the metric is just the cheapest external probe of whether it does.

The anti-pattern this section kills: **treating 1-to-N as a project with an end.** It is a steady state; the health signs replace exit criteria, and the loop re-runs as the system grows. The day you declare the architecture "done" is the day you stop re-reading the vitals and entropy resumes uncontested.

---

## How findings route

This file *names* the seam, the artifact, and the vital; the fixes route to siblings and to the rest of the suite:

- **A misplaced boundary** (Conway probe fires) → if the fix is re-cutting modules, the lint/CODEOWNERS enforcement of the new boundary is [enforce-boundaries.md](enforce-boundaries.md)'s; if the misplacement co-fired with a coincidental shared abstraction, the extract/delete/keep call is [prune.md](prune.md)'s. The team-restructuring call (inverse Conway) is the **user's** — surface it, don't make it for them.
- **A stale catalog story or dead component** → [prune.md](prune.md) (dead-code / dead-story pruning).
- **A scattered visual decision (fake token)** → wire it back to the single source; the contract-style "change one, all change" test is `keel`'s discipline applied here.
- **A swelling store surfaced by the vitals** → re-run the state-classification tree and reclassify drifted state ([prune.md](prune.md), the store-size thermometer).
- **An entropy signal first seen in production** (errors clustering, cross-version performance creep) → that is `lookout`'s observability feeding the vitals; entropy becomes visible there before it shows in the newcomer metric.
- **The objective-function / ethics call** that surfaces when reading what the system optimizes is the **user's**, lives upstream of the dashboard, and is *not* the agent's to make — see [the-membrane.md AXIS 7](the-membrane.md).

And the through-line, restated once more: every move here is the same move the whole suite makes — **push correctness into structure.** Conway pushes change-locality into the team seams; the design system pushes the shared model into discoverable artifacts; the vitals measure whether the push worked. The agent will add the feature, cross the boundary, and rot the doc, feeling none of the cost — so you keep the calls it cannot make (which boundary is load-bearing, what reasoning is load-bearing enough for an ADR, what the newcomer metric is really telling you) and move every rule you can out of memory and into a gate. That is how the architecture survives its own creators.

---

**Cross-links:** [the-membrane.md](the-membrane.md) (AXIS 5 Medium, AXIS 6 Mind, AXIS 7 Ethics — *why* this file reads as it does, and the GATE MAP) · [enforce-boundaries.md](enforce-boundaries.md) (the machine enforcement of the boundaries Conway places) · [prune.md](prune.md) (the accretion-fighting this file's findings route to) · [../SKILL.md](../SKILL.md) (the five-stage steady-state flight plan this reference serves — STAGES 2, 3, 4).

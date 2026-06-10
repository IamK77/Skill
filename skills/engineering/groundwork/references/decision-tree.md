# The Requirements Decision Engine

This is the deterministic router at the heart of **groundwork**. STAGE 1 (Analyze) opens it by name, but you should open it *at the very start* — before STAGE 0 — and keep it beside you through the whole flow. It answers the three questions an agent must settle before it writes a single requirement: **is this even a requirements situation, how deep do I go, and how do I stand in for stakeholders I can never interview?** Everything downstream — elicitation, analysis, specification, validation, management — is reached *from* this file. Traverse it top-down, once per incoming ask; the leaves link you into the stage references where the real work happens. For the failure modes this engine exists to interrupt, read [agent-blind-spots.md](agent-blind-spots.md) first.

Each fork is written to be *decidable* — hand two agents the same ask and they should land on the same branch. To make that hold, every fork states three things up front:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — which branch to take when the predicate is a genuine toss-up.
- **FALLBACK** — what to do when you can't answer the predicate yet.

(For how these five mechanisms — Tree 0, the depth selector, the substitution protocol, the routing map, the escalation ladder — compose on one real ask, jump to the worked traversal at the end of this file.)

There is exactly one invariant that overrides every DEFAULT and FALLBACK below:

> **Never guess silently on a high-blast-radius unknown.** If failure of this requirement touches money, data integrity, auth, privacy, safety, legal exposure, or anything irreversible, you may *infer* a candidate answer — but you must surface the inference to the user and get a yes before you build on it. Silent guessing is the one move that turns groundwork into theater.

---

## Vocabulary this engine assumes

You will route faster if these four scales are crisp. They recur in every tree.

| Axis | Low end | High end | Why it routes |
|---|---|---|---|
| **Goal clarity** | The real outcome is named and agreed | Vague ("make it better") or solution-shaped ("add a button") | Vague/solution-shaped asks hide the actual requirement; they force elicitation. |
| **Blast radius** | A wrong build wastes an hour and is trivially undone | A wrong build corrupts data, leaks secrets, charges cards, breaks compliance, or is hard to reverse | Sets how hard you must validate before committing, and whether silent inference is ever allowed. |
| **Stakeholder count** | One person, who is also the user you're talking to | Many parties with divergent stakes (users, sponsor, ops, legal, the silent-affected) | More parties = more hidden and conflicting requirements = more discovery. |
| **Reversibility** | Cheap to change your mind after shipping | A migration, a public API, a contract, a destructive operation | Irreversible work earns heavier validation up front because the redo cost is unbounded. |

Keep these in view: the trees below are mostly questions about *where on these four axes* the ask sits.

---

## TREE 0 — Is this even a requirements situation?

Run this **first, on the raw incoming ask**, before you do anything else. Its job is triage: not every request deserves a five-stage flight, and forcing ceremony onto a one-line fix is its own failure (it burns the user's patience and trains them to route around the discipline). The output is one of three verdicts: **skip**, **lightweight**, or **full flow**.

```
T0.1 — Is the real goal already pinned?
    PREDICATE: do you know the actual outcome the user wants — not just the
               action they named — well enough to write its acceptance test right now?
    ├─ NO  → goal is vague or solution-shaped → this IS a requirements situation. Continue.
    └─ YES → continue to T0.2.

T0.2 — Single, present stakeholder?
    PREDICATE: is there exactly one party affected, and are they the person you're
               talking to (so there is no one silent or absent to speak for)?
    ├─ NO  → multiple/absent stakeholders → requirements situation. Continue.
    └─ YES → continue to T0.3.

T0.3 — Low blast radius?
    PREDICATE: if you build the wrong thing, is the damage small AND contained
               (no money, data integrity, auth, privacy, safety, or legal exposure)?
    ├─ NO  → high blast radius → requirements situation. Continue.
    └─ YES → continue to T0.4.

T0.4 — Reversible?
    PREDICATE: can the change be undone cheaply if it turns out wrong
               (no migration, no public API, no destructive or one-way operation)?
    ├─ NO  → irreversible → requirements situation. Continue.
    └─ YES → ALL FOUR are benign → SKIP groundwork. Just build it; state in one
             line why you skipped ("goal pinned, single stakeholder, reversible,
             low blast radius"), so the user can veto.
```

### Reading the verdict

- **All four benign → SKIP.** A rename, a one-line bug fix, a copy tweak, a log-level change. Building *is* faster than scoping. Say so out loud and proceed — but make the skip auditable, because the user may know a stake you can't see.
- **One axis hot, the rest benign → LIGHTWEIGHT.** The ask is *mostly* clear but tips over on a single axis — e.g. the goal is pinned and single-stakeholder but the operation is irreversible (a data migration). Run the lightweight path (below) and let its trip-wires catch any escalation.
- **Two or more axes hot, OR any one of {vague goal, high blast radius, irreversible} → FULL FLOW.** Open STAGE 0 and walk all five stages. The three named axes are *individually* sufficient because each one alone has sunk projects: a vague goal means you don't yet know what to build; high blast radius means a wrong build is expensive to survive; irreversibility means you can't iterate your way out.

**DEFAULT** when T0 is a coin-flip (the ask sits right on the boundary, e.g. "small but I'm not sure how reversible"): choose the **lightweight** path. It is the cheap insurance — a few sharp questions — and its trip-wires will pull you up into the full flow the moment depth is actually warranted. Lightweight that proves unnecessary costs minutes; a skip that proves wrong costs a rebuild.

**FALLBACK** when you cannot answer T0 at all because the ask is too thin to classify ("help me with the dashboard"): do not guess the verdict. Ask **one** orienting question that pins the most-uncertain axis — usually goal clarity ("What should be true after this is done that isn't true today?") — then re-run T0 with the answer.

**Worked leaf —** *"Ask = 'add a CSV export button to the reports page.' T0.1: goal is solution-shaped (a button), real outcome unknown → already a requirements situation. Stop here; route to full or lightweight via the depth selector. Do NOT skip just because a button sounds small."*

**Worked leaf —** *"Ask = 'rename `getUsr` to `getUser` across the repo.' T0.1 goal pinned, T0.2 single stakeholder (the dev), T0.3 low blast, T0.4 reversible → SKIP. Reply: 'Pure rename, reversible, no external contract — skipping groundwork and doing it.'"*

---

## DEPTH SELECTOR — full five-stage vs lightweight

Once TREE 0 says this *is* a requirements situation, this selector fixes **how much** of the flow you run. There are two paths. The full path is the five stages exactly as the [../SKILL.md](../SKILL.md) flight plan lays them out. The lightweight path is a compression of the *same* stages — it never deletes a stage, it shrinks each one and collapses the gates — and it carries **trip-wires** that force an upgrade to full mid-flight the instant the ask turns out to be deeper than it looked.

### What the lightweight path KEEPS (non-negotiable, every path runs these)

| Kept | Why it survives compression |
|---|---|
| **Dig the real need once** | One pass of "why do you want this?" on a solution-shaped ask. Skipping it is how you build the literal button instead of the report. |
| **Name the stakeholders you can see** | Even a quick list — user, sponsor, operator — catches the most common omission (a missed *person*, not a missed analysis). |
| **The implicit-requirements sweep** | Don't-lose-data, don't-store-secrets-in-plaintext, don't-break-auth. These are cheap to ask and catastrophic to miss; they never get dropped. |
| **A scope line** | One sentence of "this is in, that is out." The single cheapest brake on scope creep. |
| **Verifiable acceptance criteria for each funded item** | If you can't state how you'd test it, you can't build to it. This is the keystone and it is never optional. |
| **One validation read-back** | A single "here's what I understood — correct me" before code. Cheap, and it catches the misunderstanding that would otherwise cost a rebuild. |

### What the lightweight path DROPS or COMPRESSES

| Dropped / compressed | What you do instead |
|---|---|
| Formal multi-class stakeholder map | An inline list in prose; no separate artifact. |
| Full NFR sweep across all categories | Spot-check only the NFR categories the ask plausibly touches (e.g. just *performance* for a list view), not the whole catalog. |
| MoSCoW grid + conflict-resolution pass | A 2-bucket split (Must / Not-now) and a note of any obvious conflict, instead of the four-tier matrix. |
| Full SRS / use-case documents | User stories + Given/When/Then acceptance criteria only. |
| Prototype/wireframe validation | Text read-back only — unless a trip-wire fires. |
| Formal change process + traceability matrix | A one-line "open questions / what would change this" note. |
| Hard gate-by-gate ceremony | Stages run as a single continuous pass; you still hit each concern, just without stopping for a gate command. |

### TRIP-WIRES — any one of these forces an immediate upgrade to the full flow

You are on the lightweight path. The moment **any** of the following becomes true, stop compressing and switch to the full five-stage flow (re-entering at the stage the discovery belongs to):

```
TW1  A second stakeholder class surfaces whose needs you hadn't captured.
TW2  A non-functional requirement turns out to constrain the architecture
     (e.g. "oh, it also has to handle 10k concurrent users" / "must be HIPAA").
TW3  Two requirements, or two stakeholders, are in direct conflict.
TW4  The blast radius rises — the change now touches money, data integrity,
     auth, privacy, safety, or anything irreversible.
TW5  The user corrects your read-back on something material (not a typo) —
     the cheap validation just paid for itself; now do the thorough one.
TW6  Scope is creeping — the ask has quietly grown past the scope line you wrote.
```

**DEFAULT** when you cannot tell whether the ask earns full or lightweight: start **lightweight** and let the trip-wires escalate you. It is always cheaper to upgrade than to have over-built ceremony you didn't need; the trip-wires guarantee you won't *under*-build, because the dangerous discoveries all trip a wire.

**FALLBACK** when the ask is too tangled to even pick a path (several half-stated features bundled together): don't pick a depth for the bundle. Split the ask into separate items first, run TREE 0 on each, and depth-select each independently. A bundle's riskiest member should not drag a trivial member into full ceremony, nor should a trivial member let a risky one skip it.

---

## THE STAKEHOLDER-SUBSTITUTION PROTOCOL

This is the protocol that exists *because you are an agent*. A human analyst would interview the operator, sit with the sales team, walk the warehouse floor. You cannot. You have exactly one human in the loop — the user — and they are almost never every stakeholder. So you do not get to wait for interviews that will never happen, and you absolutely do not get to *invent* stakeholder needs in silence and build on them. You do the only honest thing available: **enumerate the stakeholders this domain almost certainly has, draft each one's probable needs from domain knowledge and whatever you can read, and hand that draft to the user to confirm or correct.** You convert silent guessing — which is forbidden — into explicit, reviewable inference, which is the core elicitation move. The full method bank lives in [elicitation.md](elicitation.md); this is the routine you run every time.

### Step 1 — Enumerate the stakeholder CLASSES for THIS domain

Don't list people; list *roles*. Start from this universal spine and specialize it to the domain in front of you:

| Stakeholder class | The question they answer | Easy to forget? |
|---|---|---|
| **Direct user** | Who pushes the buttons day to day? | No — but you'll over-index on them. |
| **Sponsor / funder** | Who pays, and what outcome are they buying? | Yes — the user in chat is often *not* the sponsor. |
| **Operator / on-call** | Who runs, deploys, monitors, and gets paged at 3 a.m.? | Very — they own most NFRs. |
| **Compliance / legal / security** | What rules constrain this regardless of what anyone wants? | Very — silent until violated. |
| **Downstream / integrating systems** | What other code or team consumes this output or API? | Yes — contract breakage hides here. |
| **The silent-but-affected** | Who never asks for anything but suffers if you get it wrong? (the customer whose data this is, the auditor, the support team) | The most. This class sinks projects. |

Specialize each to the domain. For "a checkout flow": direct user = shopper; sponsor = revenue/product owner; operator = payments on-call; compliance = PCI-DSS scope; downstream = the fulfillment service and the analytics pipeline; silent-affected = the cardholder and the fraud team. For "an internal admin tool": direct user = the support agent; sponsor = the support manager chasing handle-time; operator = whoever owns the admin app's auth; compliance = whoever governs who may view customer PII; downstream = the audit log; silent-affected = the end customer whose record is being edited.

### Step 2 — Mine the cheap sources before you draft

You cannot interview, but you *can* read. Before drafting needs, pull from every source that doesn't require a human:

- **The codebase** — existing modules, data models, and call sites reveal real constraints and who already depends on what. Grep for the feature's neighbors.
- **Docs, READMEs, ADRs** — past decisions and their rationale; the "why we don't do X" that prevents a re-litigation.
- **Tickets / issues / PRs / commit history** — recurring complaints name the real pain; closed-wontfix tickets name the scope line someone already drew.
- **Tests** — encode behavior someone cared enough to pin; a deleted test is a removed requirement.
- **Competitors / prior art / standards** — how the established solution in this space handles the case you're unsure about; this is your best source of *implicit* requirements.

Treat anything you read as a *hypothesis about a stakeholder need*, not a fact — it still goes to the user in Step 4.

### Step 3 — Draft each class's PROBABLE needs (the inference)

For every class from Step 1, write the one-to-three requirements that role almost certainly has, including the implicit ones they'd never say aloud. Label each as an inference, not a fact. A worked draft for a "user data export" feature:

| Class | Probable needs (drafted by inference — to confirm) |
|---|---|
| Direct user | Can export their own records to a file they can open in Excel; export reflects current data, not a stale snapshot. |
| Sponsor | Reduces the support load of manual data pulls; ship within the quarter. |
| Operator | Export must not lock the table or spike DB load during business hours; large exports must not OOM the service. |
| Compliance / legal | Export must respect per-field access rules (no exporting fields the user isn't entitled to); export of personal data may need an audit-log entry under GDPR/CCPA. |
| Downstream | File format is stable enough that any consuming script doesn't break on the next change (a contract). |
| Silent-affected | A user must not be able to export *another* user's data via a tampered ID (authorization on the export path). |

Notice that the two highest-stakes items — the access-control rule and the authorization check — came from the classes the user is *least* likely to mention. That is the entire point of the protocol.

### Step 4 — Present for confirm/correct — NEVER guess silently

Hand the draft to the user as a checklist, explicitly framed as *your inference for them to correct*. Use language that makes correction easy and makes silence safe-by-default impossible on the risky items:

> "I can't talk to your ops or compliance people, so I've drafted what I believe each stakeholder needs — please correct anything wrong or missing. The two I most need you to confirm before I build: (a) the export must enforce per-field access rules, and (b) a user must not be able to export another user's data. If either is wrong, tell me now; if I don't hear back on these two I'll treat them as required, because the cost of being wrong is a data leak."

Rules for this step:

- **Make the inference visible.** "I'm assuming X — correct me" is elicitation; assuming X and coding it is the forbidden silent guess.
- **Rank what you ask.** Lead with the high-blast-radius items; don't bury the data-leak question under formatting trivia.
- **Default the safe direction on implicit requirements.** For don't-lose-data, don't-leak-data, don't-break-auth: state that you'll *include* the safeguard unless told otherwise, rather than omit it unless asked. A safeguard wrongly included is cheap; one wrongly omitted is an incident.
- **Record the confirmations.** Each confirmed need becomes a requirement carrying its stakeholder as its source — that's the start of traceability ([validation-and-management.md](validation-and-management.md)).

**DEFAULT** when the user confirms some items and goes silent on others: treat silence as *confirmation only for low-blast-radius items*. For any high-blast-radius item, silence is **not** consent — re-ask once, sharply and alone, before building on it.

**FALLBACK** when the user genuinely cannot speak for a class ("I don't know what legal needs"): do not fill the gap with a guess. Record it as a named **open question with an owner** ("BLOCKED on legal: is exporting field X permitted?"), pick the conservative default in the meantime (omit field X), and flag the assumption loudly in the handoff so it can't ship unexamined.

**WRITTEN-PROXY rule** — when *no* human is in the loop at all (scoping an OSS feature from an RFC), a sufficiently authoritative written source — an RFC, a reviewer comment that enumerates must-decide items, a standard like RFC 7519, an existing ADR or the existing code — may stand in as the confirmation proxy *for the items it actually addresses*. Treat its explicit recommendations as confirmed requirements (sourced to that document); treat everything it does **not** address as still-unconfirmed — parked as an open question, not defaulted green. A written proxy confirms only its own coverage; it never licenses inferring intent it is silent on. This is the design-only mode named in [../SKILL.md](../SKILL.md).

---

## ROUTING MAP — open question → reference / stage

Use this table as the engine's dispatcher. Find the question you're actually stuck on; it tells you which sibling reference to open and which stage owns the work.

| If your open question is… | Open this reference | Stage that owns it |
|---|---|---|
| "Is this even worth scoping, or do I just build it?" | this file — TREE 0 | pre-STAGE 0 |
| "How deep should I go — full or quick?" | this file — Depth Selector | pre-STAGE 0 |
| "Who is even affected by this? Who am I forgetting?" | [elicitation.md](elicitation.md) (and the protocol above) | STAGE 0 — Elicit |
| "The user asked for a *solution* — what's the real need?" | [elicitation.md](elicitation.md) — the five-whys / ladder | STAGE 0 — Elicit |
| "What requirements are implied but unspoken?" | [elicitation.md](elicitation.md) — implicit-requirement sweep | STAGE 0 — Elicit |
| "What am I, as an agent, structurally blind to here?" | [agent-blind-spots.md](agent-blind-spots.md) | every stage |
| "Is this functional or non-functional? Did I miss an NFR?" | [analysis.md](analysis.md) — NFR catalog + sweep | STAGE 1 — Analyze |
| "Everything seems important — what do we actually build?" | [analysis.md](analysis.md) — MoSCoW | STAGE 1 — Analyze |
| "Two stakeholders want opposite things — now what?" | [analysis.md](analysis.md) — conflict surfacing | STAGE 1 — Analyze |
| "Where exactly is the edge of scope?" | [analysis.md](analysis.md) — scope / out-of-scope line | STAGE 1 — Analyze |
| "How do I write this so it's testable, not fuzzy?" | [specification.md](specification.md) — quality bar, vague→measurable | STAGE 2 — Specify |
| "What's the right vessel — story, use case, SRS?" | [specification.md](specification.md) — INVEST, Given/When/Then | STAGE 2 — Specify |
| "How do I confirm we all understood the same thing?" | [validation-and-management.md](validation-and-management.md) — review/prototype | STAGE 3 — Validate |
| "Requirements are going to change — how do I manage that?" | [validation-and-management.md](validation-and-management.md) — change + traceability | STAGE 4 — Manage |

If your question isn't in the table, it usually means you're at the wrong altitude — re-run TREE 0 to confirm you're even in a requirements situation, then re-read the depth selector.

---

## ESCALATION LADDER — when ambiguity and blast radius rise

When you hit an unknown, you do not get to either freeze or guess. You climb this ladder: each rung costs the user more attention than the last, so you spend the *cheapest* rung that the unknown's blast radius justifies, and you climb only when the rung below is insufficient. The rung you may start on is set by blast radius; the rung you stop on is set by getting a confident answer.

```
Rung 1 — INFER & CONFIRM (cheapest; the default for low-stakes unknowns)
    State your best inference and ask for a yes/no.
    "I'm assuming exports are scoped to the current user's own data — correct?"
    Use when: blast radius LOW and you have a well-grounded guess.
    Cost to user: one glance.

Rung 2 — STOP AND ASK ONE SHARP QUESTION
    When you can't responsibly infer, ask exactly ONE high-leverage question —
    the one whose answer collapses the most uncertainty — not a questionnaire.
    "Should a deleted account's data be exported, or treated as gone?"
    Use when: the unknown is pivotal and a wrong inference is expensive,
    but the question is answerable in words.
    Cost to user: one decision. (Batch at most a few; never bury them.)

Rung 3 — PROTOTYPE / WIREFRAME TO ELICIT
    When the user can't answer in the abstract because they don't know until
    they see it ("I'll know it when I see it"), build the cheapest concrete
    artifact — a wireframe, a sample output file, a fake API response, a
    throwaway script's output — and ask them to react to it.
    Use when: words keep sliding and the disagreement is about shape/feel,
    or the requirement is tacit until made tangible.
    Cost to user: a few minutes of reaction. See elicitation.md.

Rung 4 — ESCALATE TO THE SPONSOR (or the absent stakeholder, via the user)
    When the unknown is a conflict between stakeholders, a policy/legal call,
    or a scope/budget tradeoff that the user in chat is not authorized to make,
    surface it as a decision FOR THE SPONSOR and refuse to proceed on the
    affected item until it's resolved. Park it as a named open question with an owner.
    "This needs a call from whoever owns compliance: may we export field X?
     I've blocked that requirement until someone with authority answers."
    Use when: blast radius HIGH and the answer isn't the user's to give.
    Cost to user: routing to the right human. Worth it — the alternative is
    shipping an unauthorized decision.
```

### How blast radius sets the floor

- **Low blast radius:** you may start *and* finish on Rung 1. A wrong inference is cheap to undo, so confirm-and-proceed is enough; you don't need to interrupt for a formal question.
- **Medium blast radius:** start no lower than Rung 2. Don't infer-and-proceed on something that's annoying to redo — ask the one sharp question, or prototype if words won't settle it.
- **High blast radius (money / data integrity / auth / privacy / safety / legal / irreversible):** you are **forbidden** from resting on Rung 1. The invariant from the top of this file binds here: you may *form* an inference, but you must climb to at least Rung 2 to get explicit confirmation, and to Rung 4 if the call isn't the user's to make. A high-blast-radius unknown that ships on a silent guess is the worst failure this entire skill exists to prevent.

**DEFAULT** when you're unsure which rung to start on: start one rung *higher* (more cautious) than feels necessary. The cost asymmetry is steep — an extra confirming question costs seconds; an unconfirmed wrong build on a hot path costs a rebuild and the user's trust.

**FALLBACK** when even the right rung doesn't resolve the unknown (the user is unreachable, the sponsor hasn't answered): do not let the unknown silently disappear into the build. Pick the **conservative default** (the choice that's safest and most reversible if you turn out wrong), record it as an explicit assumption with its open question and owner, and carry both into the handoff — see the change-and-traceability note in [validation-and-management.md](validation-and-management.md). An assumption written down and flagged is recoverable; one buried in code is a latent incident.

---

## Putting the engine together — one full traversal

A worked end-to-end pass, so the routing is concrete:

> **Incoming ask:** *"Make the search faster."*
>
> **TREE 0** — T0.1: goal is vague ("faster" has no number) → requirements situation, no skip. Not all four axes benign. → **full or lightweight**.
>
> **Depth selector** — Goal is vague (one hot axis) but it's a perf tweak on an existing feature; provisionally single-stakeholder; blast radius unclear. One axis hot → start **lightweight**, watch the trip-wires.
>
> **Stakeholder substitution** — Classes: direct user (wants results to feel instant), operator (wants the fix not to hammer the DB), sponsor (wants fewer "search is slow" complaints), downstream (any cache or index this shares). Draft each one's probable need; present: *"I'm assuming 'faster' means p95 search latency under ~200 ms at current load, scoped to the existing index, without raising DB CPU — correct me."*
>
> **Trip-wire** — User replies: "Actually it has to stay fast at 10× our current traffic, and we're adding fuzzy matching." → **TW2** (NFR now constrains architecture) and **TW6** (scope grew) both fire → **upgrade to full flow**.
>
> **Routing map** — "Is this an NFR I missed?" → open [analysis.md](analysis.md), run the NFR sweep (performance + scalability now load-bearing). "How do I make 'fast' testable?" → [specification.md](specification.md): write *"p95 search latency < 200 ms at 10× current QPS; fuzzy-match recall ≥ 0.9 on the test set."*
>
> **Escalation ladder** — The 10×-traffic target is a sponsor-level cost/architecture call, not the user's to make alone → **Rung 4**: surface the scaling target to whoever owns the infra budget before committing to an approach; block the scalability requirement until answered.

The ask that arrived as four vague words leaves the engine as a small set of verifiable, stakeholder-sourced, scoped requirements with one open question routed to the right human — which is exactly what the rest of the flow ([analysis.md](analysis.md) → [specification.md](specification.md) → [validation-and-management.md](validation-and-management.md)) is built to turn into a contract for the build.

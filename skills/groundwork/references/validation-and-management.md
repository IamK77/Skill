# Validation & Management — Confirm Understanding, Then Plan For Change

This reference covers the last two stages of groundwork. **STAGE 3 (Validate)** opens its first half: prove that *what you understood equals what the user actually wants* before a line of build code is written. **STAGE 4 (Manage)** opens its second half: accept that requirements will move, and lay down the change process, the baseline, and the traceability that let a later change tell you what it breaks. Both stages are written for an agent who cannot run a workshop or interview a silent stakeholder — every technique here routes *through the user* and over the artifacts you *can* read (code, docs, tickets, competitor behavior). Validation that fails does not get patched in place; it sends you **back** to [elicitation.md](elicitation.md) or [analysis.md](analysis.md). Manage leaves a map for whoever inherits the work.

The two halves answer two different questions, and confusing them is itself a failure:

| | VALIDATION (STAGE 3) | VERIFICATION (done inside STAGE 2 spec) |
|---|---|---|
| Question | "Are we building the **right** thing?" | "Did we write each requirement **right**?" |
| Oracle | the user / stakeholder's real intent | the quality bar (unambiguous, verifiable, …) |
| Failure means | wrong target — loop back to elicit/analyze | bad wording — rewrite the line in place |
| Home | this document, first half | [specification.md](specification.md) |

You already verified each requirement against the quality bar in STAGE 2. Validation is the *other* axis: a perfectly-worded requirement can still be the wrong requirement. Do not let a clean spec lull you into skipping this.

## Contents

- [PART ONE — VALIDATION](#part-one--validation)
- [PART TWO — MANAGEMENT](#part-two--management)
- [One-screen summary](#one-screen-summary)

---

## PART ONE — VALIDATION

### Why validation exists at all

Written does not mean correct. A requirement is a second-hand model of something that lives in the user's head and the stakeholders' worlds. Between their intent and your text sit at least four lossy hops: *they* simplify when they speak → *you* interpret through your own priors → *you* compress into a spec → *the user reads your spec back through their own priors again.* Each hop drops or distorts something. Validation is the deliberate act of closing that loop and measuring the gap **while it is still cheap to close**.

The economics are the whole argument. The cost to fix a defective requirement climbs by roughly an order of magnitude per phase it survives — a misread caught at validation is an edit; the same misread caught in code is a rewrite; caught in production it is a rewrite *plus* an incident, a rollback, and lost trust. You are never "wasting time confirming the obvious." You are buying down the most expensive class of defect there is.

> **The agent's handicap, restated.** You cannot demo to a room. You cannot watch a face go blank when a stakeholder hears their requirement read back wrong. Your *only* validation channel is the user, and the user is a proxy — sometimes a perfect one, often an imperfect one. So you (a) make confirmation **explicit and per-item** rather than asking for a blanket "looks good?", and (b) name out loud which stakeholders the user is *not* able to speak for, so that gap is a recorded risk and not a silent one. See [agent-blind-spots.md](agent-blind-spots.md) for why "they said it's fine" is the most dangerous false-green you can collect.

### The core agent move — replay in their domain terms

The single most effective validation technique available to an agent is the **replay**: take each funded requirement and play it back to the user **in their own domain language, not yours**, then get an explicit per-item confirmation. You are not asking them to read a spec. You are asserting your understanding as a concrete claim and forcing a yes/no/almost on it.

Two failure modes the replay defeats:

- **The silent-agreement trap.** "Here are the requirements, look OK?" almost always returns "yep." A blanket yes confirms nothing — the user skimmed, or trusted you, or didn't want to seem difficult. Per-item replay makes each requirement a separate small decision the user must actually make.
- **The jargon mismatch.** You wrote "idempotent retry with exponential backoff." The user runs a billing team. Replaying in *their* terms — "if the charge times out and we try again, the customer is only ever charged once, even if our first attempt actually went through" — surfaces disagreements that your wording hides. If you can't restate a requirement in the user's domain language, you do not yet understand it well enough to have written it.

**Replay template (use literally):**

```
For requirement R<id>, here is what I understood — in your terms:

  "<plain-language restatement, no implementation jargon>"

  Concretely, this means:
    - WHEN <a situation from your real workflow>
    - the system WILL <observable outcome you would actually see>
    - and it will NOT <the tempting-but-wrong behavior you are ruling out>

  Acceptance check we'll hold this to:
    GIVEN <state>  WHEN <event>  THEN <result>

Three questions, please answer each:
  1. Is the situation real and the one you meant? (yes / no / partly)
  2. Is the outcome what you want — nothing missing, nothing extra? (yes / no / partly)
  3. Is the NOT-line correct, or did I just rule out something you actually need?
```

Anything other than three clean "yes"es is a finding. "Partly" and "almost" are the goldmine — they mark the exact seam where your model and their intent diverge. Drill there.

> **Rule: confirm per item, never in bulk.** A 12-requirement spec gets 12 confirmations, each recorded against its requirement ID. One global thumbs-up is not a validation; it is a deferral of risk to the build phase.

### The validation decision fork

Slippery requirements need a heavier instrument than a replay. Pick the technique by how *describable* the requirement is in words, following the same PREDICATE / DEFAULT / FALLBACK discipline used across this skill's decision forks (see [decision-tree.md](decision-tree.md)).

```
V1. Can this requirement be fully judged from a careful written restatement?
    PREDICATE: would the user reading a precise Given/When/Then know whether it is right?
    ├─ YES → REPLAY + CHECKLIST REVIEW. The default path. Most requirements live here.
    └─ NO, it's experiential / visual / interaction-shaped → go to V2.

V2. Is the slippery part the LOOK/FEEL/FLOW, or the LOGIC/RULES?
    PREDICATE: is disagreement most likely about layout/wording/sequence, or about a decision rule?
    ├─ Look / feel / flow → PROTOTYPE OR WIREFLOW (a concrete artifact to react to). Go to V3.
    ├─ A decision rule / edge-case behavior → WORKED-EXAMPLE TABLE
    │     (enumerate real input rows; ask the user to fill the expected-output column).
    │     Disagreement on any row is a found defect.
    └─ A quantitative threshold ("fast", "soon", "a lot") that slipped through spec →
          BOUNDS REPLAY: state the number you chose and the workload you assumed;
          a wrong number is far easier to correct than a vague word. If it's still
          vague, this is a STAGE-2 escapee — loop back to specification.md to quantify.

V3. Can you produce the artifact the user can react to?
    PREDICATE: can you render a wireframe / sample output / dry-run transcript cheaply?
    ├─ YES → build the cheapest faithful artifact, walk it, capture reactions per element.
    └─ NO (needs a running system you can't stand up) → SCENARIO WALKTHROUGH instead:
          narrate the user's journey step by step in prose and confirm each step.
          Note the un-demoable part as residual risk to revisit after a first build slice.
```

**DEFAULT** when a requirement's slipperiness is genuinely unclear: do the replay first — it's cheap, and the user's "partly" will tell you whether you need to escalate to a prototype. **FALLBACK** when you cannot tell whether the user even has enough context to judge: do not guess a green; ask the one sharpest disambiguating question and record the answer against the requirement.

### Validation techniques — the catalog

Each technique is rephrased for an agent that demos *through the user* and over readable artifacts.

| Technique | What it is | Agent adaptation | Best for | Cheapest tell it found something |
|---|---|---|---|---|
| **Replay / restatement** | Read each requirement back in the user's terms; get per-item yes/no | Your primary channel; do it for every funded requirement | Everything; the baseline pass | A "partly" or a correction |
| **Checklist-based review** | Walk a fixed quality checklist over every requirement (see below) | You run the checklist yourself, then surface only the *judgment* calls to the user | Catching whole *classes* of defect systematically | A checklist line you cannot answer |
| **Walkthrough** | Author leads stakeholders through the spec step by step, narrating intent | You narrate the requirement set to the user in dependency order, pausing for reactions | Shared mental model; surfacing missing links between requirements | The user adds "oh, but also…" |
| **Inspection** | Formal, role-assigned defect hunt against entry/exit criteria | Borrow the *rigor* (defined defect taxonomy, recorded findings), not the ceremony | High-stakes / regulated requirements | A logged defect with a category |
| **Acceptance-criteria replay** | Re-read each Given/When/Then aloud as a confirmation script | Treat the criteria you wrote in STAGE 2 as the literal validation script | Confirming the *testable contract* is the right contract | A criterion the user would not sign |
| **Prototype / wireframe demo** | Show a cheap artifact and harvest reactions | Render a wireframe, sample output, mock transcript, or table; walk it element by element | Slippery look/feel/flow requirements | A "that's not what I pictured" |
| **Worked-example table** | Enumerate concrete input rows; user fills expected outputs | You pre-fill rows from real data/tickets; user owns the expected column | Decision rules and edge cases | A row where your guess ≠ theirs |
| **Scenario / journey walkthrough** | Narrate a full user journey end to end | Prose walkthrough when you can't render an artifact | Flows you cannot prototype | A step the user reorders or removes |

#### The requirements review checklist (run this yourself, every time)

A checklist review is the highest-leverage thing an agent can do *without* the user, because it catches defect classes mechanically. Walk every requirement past these. Lines you can answer alone, answer. Lines that need domain truth, escalate to the user.

- **Completeness** — Is every triggering condition covered? Every error and timeout path? What happens at empty / first-run / nothing-configured? Is there a requirement for each stakeholder you mapped in STAGE 0, or did one group fall silent?
- **Correctness** — Does each requirement match the *real-need* you surfaced in elicitation, not the original solution-shaped ask?
- **Consistency** — Do any two requirements contradict? Did a STAGE-1 stakeholder conflict get *decided*, or just *worded over*? Same term, same meaning everywhere (no "user" meaning three different roles)?
- **Unambiguity** — Any vague word that slipped the STAGE-2 net (fast, soon, simple, robust, intuitive, secure)? Any pronoun whose referent is unclear?
- **Verifiability** — For each one, can you still answer "how would I know this passed?" If a requirement lost its acceptance criteria, it failed verification and must go back to [specification.md](specification.md).
- **Feasibility** — Anything that quietly assumes data you don't have, a permission you can't get, or a system that doesn't exist?
- **Necessity** — Any requirement that traces to *no* stakeholder need? That is gold-plating wearing a requirement's clothes (see [agent-blind-spots.md](agent-blind-spots.md)) — propose cutting it.
- **Scope integrity** — Does the in/out-of-scope line from STAGE 1 still hold, or did items quietly drift across it during specification?
- **Implicit-requirement coverage** — Are the unspoken obligations (don't lose data, don't log secrets, don't break existing behavior) written down now, or still living only as assumptions?

> **HARD-STOP guards (each fires at the line that would produce it):**
> - A requirement with **no stakeholder** behind it → stop, propose cutting it; do not validate gold-plating into existence.
> - A blanket "looks good" with **no per-item confirmation** → not a pass; replay item by item.
> - A requirement you cannot **restate in the user's domain terms** → you don't understand it; that is a finding, not a formatting nit.
> - A **stakeholder group you cannot reach** and the user cannot proxy for → record as residual risk now; do not silently assume their requirements are met.
> - A vague word surfacing here → it is a **STAGE-2 escapee**; loop to [specification.md](specification.md), don't paper over it.

### When validation FAILS — the loop, not the patch

This is the load-bearing rule of STAGE 3: **a validation failure sends you back, it does not get edited forward.** The instinct to "just tweak the wording and call it confirmed" is exactly the instinct that ships the wrong product. A failed validation is *evidence about where your understanding broke*, and that break almost always lives upstream of the spec.

Route each failure to its true origin:

```
A validation finding appears. Diagnose its ROOT, then loop to the matching stage.

The user says...                              → ROOT is in...        → loop back to
─────────────────────────────────────────────────────────────────────────────────────
"that's not the situation I meant" /          missing/wrong person   elicitation.md
"the person who really cares is X, not me"     or wrong real-need     (re-map, re-dig why)

"both of those can't be true" /               undecided conflict or  analysis.md
"that's lower priority than you think" /       wrong priority/scope   (re-prioritize, re-scope)

"that's roughly right but the rule is…" /     correct target,        specification.md
"the number should be 500ms not 200ms"         imprecise wording      (rewrite the line)

"I genuinely don't know / need to ask Y"       unanswerable by proxy  PARK as open question;
                                                                       record; do not guess green
```

Only the third row is a same-stage edit. The first two are **real loops** — you re-open an earlier stage, redo its work, and re-clear its GATE before returning. Yes, that re-runs the gate. That is the point: the cheapest place to redo elicitation is *before build*, and the order enforced by the checklist tool exists precisely so a late discovery cannot quietly bypass the early stages it invalidates.

> **DEFAULT** when you cannot tell which stage a finding belongs to: route it to the *earliest* plausible stage. Re-eliciting is cheaper than discovering, three stages later, that you re-specified around a misunderstanding that was really a missing stakeholder. **FALLBACK** when a finding is unresolvable through the user at all (it needs someone the user can't reach): do not force a green — park it as a named open question (see Part Two) and let the user decide whether to proceed at risk or wait.

**Worked failure, end to end:**
*Replay of R7 — "WHEN a refund is issued, the system WILL email the customer a confirmation." User answers question 2 with "partly — finance also needs it to post a reversal to the ledger, or the books won't reconcile." → ROOT: a stakeholder (finance) whose need never entered the spec. → This is not an R7 wording tweak. Loop to [elicitation.md](elicitation.md): finance was under-mapped; re-dig their real need; a new requirement is born; re-clear the elicit and analyze gates; re-validate both R7 and the newcomer.* The patch-in-place alternative — silently bolting "and post to ledger" onto R7 — would have buried an entire stakeholder's requirements under one line and skipped their prioritization and conflict checks entirely.

### Exit — what a passed STAGE 3 leaves behind

You may clear `validate / shared-understanding-confirmed` only when every funded requirement carries:

- an explicit per-item confirmation from the user (yes, not silence), recorded against its requirement ID;
- its acceptance criteria re-read and signed off as the *right* contract (not merely a well-formed one);
- every "partly"/finding either resolved by a loop-back **or** parked as a named open question with the user's informed decision to proceed at risk;
- a written note of any stakeholder group neither you nor the user could reach — carried forward as residual risk.

**Design-only exit (no human reachable for the whole run).** When there is no user to confirm against, clear `validate / shared-understanding-confirmed` on a weaker, explicitly-labeled basis instead: every Must has been **replayed against its written source-of-truth** (the RFC / reviewer comment / standard / existing code) and matches it; the full requirements review checklist above has been walked; and every item whose correctness depends on unconfirmable human intent is **parked as a named open question with owner + blast-radius** (the `high-blast-unknowns-parked` check). Label the result *faithful-to-sources, not stakeholder-confirmed* — it certifies the spec is internally sound and true to its written authorities, not that it is what a stakeholder actually wants.

Then, and only then, move to STAGE 4.

---

## PART TWO — MANAGEMENT

### The premise: requirements will change

STAGE 4 starts from a fact, not a hope: **the requirements you just validated will change.** New stakeholders surface, the market moves, the build reveals a constraint, the user learns what they actually wanted by seeing the first slice. Treating the validated spec as frozen is the **waterfall illusion** — the belief that requirements can be gathered once, sealed, and never revisited.

> **The waterfall-illusion warning.** "We collected the requirements, we're done with requirements" is false in every real project. Requirements are a *living model of an evolving need*, not a one-time artifact. The illusion does not prevent change — change comes anyway — it only ensures the change arrives **uncontrolled**: as a silent edit, a hallway agreement, a build-time "while I'm in here" tweak that no test, no traceability link, and no stakeholder ever signed off. The waterfall illusion is precisely *how* scope creep and gold-plating get in (see [agent-blind-spots.md](agent-blind-spots.md)). The cure is not to forbid change. It is to make change **visible, assessed, and recorded** — which is the entire job of this stage.

Management does not slow the team down. It is what lets the team move *fast without lying* — because everyone, including the agent who picks this up next month, can see what is true, what changed, and what a proposed change would cost before paying for it.

### The baseline

A **baseline** is the validated set of requirements, frozen as a named, versioned reference point — *"this is what we agreed to build, as of here."* It is not a prison; it is a *datum*. Its entire value is comparison: every later change is measured as a delta *against the baseline*, so "scope" stops being a feeling and becomes an arithmetic — baseline plus these approved deltas, minus these approved cuts. Without a baseline you cannot detect scope creep, because there is nothing for the creep to be relative to.

Establish it the moment STAGE 3 passes:

- **Snapshot** the validated requirements with their acceptance criteria and the in/out-of-scope line.
- **Version it** — a tag, a commit, a dated doc heading. The mechanism matters less than that the version is *referenceable by name*.
- **Record what's in it** — the funded requirements, and just as importantly the explicit **out-of-scope** list (your standing answer to "can we just add…").
- From now on, *changes reference the baseline*; the baseline itself only advances by an approved, recorded change.

### Change control — the lightweight loop

The goal is the *minimum* process that makes change visible and costed — heavy enough to stop silent drift, light enough that the team actually uses it. For an agent, that loop runs through the user, who holds the authority you do not.

```
A change is proposed.

1. CAPTURE   — Who proposes it, and what real need drives it? Dig the why, exactly
               as in elicitation — a change request is a new requirement and gets the
               same "is this the solution or the need?" scrutiny. (elicitation.md)

2. ASSESS    — Trace the change across the traceability graph (next section). What
               requirements, designs, code, and tests does it touch? What does it
               cost, what does it risk, what does it conflict with? This is impact
               analysis, and it is the reason traceability exists.

3. DECIDE    — The USER (or named owner) accepts, rejects, or defers. The agent never
               self-approves a scope change — that is gold-plating with a process
               sticker on it. Present cost + impact; let the authority choose.

4. RECORD    — Write down the decision, its rationale, who made it, and when. A
               rejected change is recorded too — so the same idea doesn't quietly
               return next week as if it were new.

5. RE-BASELINE — If accepted, update the affected requirements, RE-VALIDATE them
               (loop to Part One — a changed requirement is an unvalidated one),
               bump the baseline version, and update every traceability link the
               change touched.
```

> **Decision authority — PREDICATE / DEFAULT / FALLBACK.** *Who can approve a change?*
> - **PREDICATE:** does the change alter scope, a Must-have, an acceptance criterion, or a stakeholder commitment? → It needs the **user/owner's** explicit yes. Never the agent's.
> - **DEFAULT** when authority is unstated: treat the user as the approver and ask them to confirm or name the real owner before you act on the change.
> - **FALLBACK** when even the user can't authorize (it touches a stakeholder they don't speak for): park it as an open question; proceed only on the un-blocked remainder; record the block.
>
> The one move that breaks this stage: an agent silently implementing a "small" change it found convenient. That is uncontrolled change — the very thing the loop exists to stop.

**TREE M — how much process does this change earn?** This is the Manage stage's routing engine, the counterpart to TREE 0 in [decision-tree.md](decision-tree.md): TREE 0 triages an incoming *ask*, TREE M triages an incoming *change*. Walk it top-down and stop at the first rung whose PREDICATE fires — ambiguity and stakes decide the ceremony, so don't convene a five-step board for a typo, and don't fast-path a Must-have rewrite.

```
M1. PREDICATE: typo / clarification, no behavior change?
       → fix in place, note in the changelog, done.
M2. PREDICATE: a tweak to a Should/Could, no new stakeholder, still fits the baseline?
       → capture + user yes + record; light re-validation of the one item.
M3. PREDICATE: a new Must-have, a changed acceptance criterion, or a new stakeholder?
       → full loop: capture → impact-trace → user decision → record → re-baseline + re-validate.
M4. PREDICATE: does it reopen a STAGE-0/1 question (who? real need? priority?)?
       → loop all the way back to elicitation.md / analysis.md, then forward again.
```

**DEFAULT** when a change sits between two rungs: take the *higher* (more ceremony) rung — under-processing a real change is how silent drift gets in. **FALLBACK** when you can't tell which rung applies: run the M2 light loop (capture + user yes) at minimum, never less. Climb only as far as the change's stakes demand; stop at the lowest rung that still makes the change visible and costed.

### Traceability — the spine that makes impact analysis possible

**Traceability** is the web of links connecting each requirement to *why it exists* and *what realizes it*. It is what turns "we changed R7, what breaks?" from a guess into a query. Without it, every change is a blind edit and every impact analysis is a hope.

The chain, both directions:

```
        stakeholder need / source
                  │           ▲
        (forward) │           │ (backward — "why does this exist?")
                  ▼           │
              REQUIREMENT  ◄──┘
                  │           ▲
                  ▼           │
               design  ───────┤
                  │           │
                  ▼           │
                code   ───────┤
                  │           │
                  ▼           │
               test    ───────┘   ◄── the acceptance criteria from STAGE 2 ARE these links
```

- **Forward tracing** answers *"is this requirement actually built and tested?"* Follow requirement → design → code → test. A requirement with no test link is unverified; a requirement with no code link is unbuilt. (This is exactly the handoff the SKILL spine promises — the acceptance criteria you wrote in STAGE 2 are the requirement↔test links, and the assay skill consumes them as oracles. See [../SKILL.md](../SKILL.md).)
- **Backward tracing** answers *"why does this code/test exist?"* Follow test → code → design → requirement → stakeholder need. Code that traces back to no requirement is gold-plating or dead weight — flag it. A test with no requirement behind it may be testing an accident.
- **Bidirectional tracing** is what powers **impact analysis**: given a proposed change to any node, walk the links *outward in both directions* to enumerate everything that might move. Change a requirement → which designs, code, and tests must follow; *and* → which stakeholder need is affected and must re-confirm.

#### The traceability matrix

The practical artifact is a **traceability matrix** — a table mapping requirements to their realizations and sources. It need not be elaborate; it needs to be *current* and *queryable*.

| Req ID | Stakeholder / source | Priority | Design ref | Code ref | Test / acceptance ref | Status | Last validated |
|---|---|---|---|---|---|---|---|
| R1 | Finance (sponsor) | Must | DES-2 | `refund.py:post_reversal` | `test_refund::ledger_reversal` | Built | v1.0 |
| R2 | Ops (operator) | Should | DES-5 | — | `AC-R2` (G/W/T only) | Spec'd, not built | v1.0 |
| R7 | Customer + Finance | Must | DES-2 | `refund.py:notify` | `test_refund::email`, `test_refund::ledger` | Built | v1.1 |

Reading it pays off immediately: an empty **Code ref** with status "Built" is a lie to chase; an empty **Test ref** is an unverifiable requirement; a row whose **Last validated** predates the current baseline is a requirement that changed and was never re-confirmed. The **Stakeholder** column is also your standing audit for the loudest-voice anti-pattern — if every row traces to one noisy stakeholder and the silent groups you mapped in STAGE 0 appear nowhere, you have a coverage hole, not a finished spec.

> **Pragmatism scales the matrix.** For a small, low-stakes change, a few inline links (a requirement ID in the commit, a ticket link in the test name) *are* your traceability — don't build a spreadsheet for a one-pager. For a large or regulated system, a maintained matrix earns its keep at the first cross-cutting change. **DEFAULT** to the lightest form that still answers "what does this change touch?"; **FALLBACK** when you genuinely cannot establish a link (the code predates you and is unmapped), record *that gap* as residual risk rather than inventing a link you can't stand behind.

### Closing the work — residual risk and open questions

The last act of groundwork is to make the *un-finished* parts honest. You will hand this off — to a builder, to the assay skill, to a future agent, to yourself in three months. They inherit your conclusions; they must also inherit your **doubts**, or they will rediscover them the expensive way.

Record, at the baseline:

- **Residual risk** — what you could *not* fully pin down and chose to proceed past anyway. The stakeholder you couldn't reach. The NFR you estimated but couldn't confirm against real load. The assumption behind a "feasible" you couldn't fully verify. State each one with the *consequence if the assumption is wrong*, so the inheritor can judge whether to act on it.
- **Open questions** — the parked, still-unanswered decisions (every "I don't know / need to ask Y" from validation, every change blocked on an unreachable authority). Each gets an owner-to-ask and a *blast-radius if guessed wrong*, so it can be triaged rather than forgotten.
- **Decisions and their rationale** — *why* a conflict was resolved this way, *why* something is out of scope, *why* a number is 200ms and not 500. A decision without its rationale gets silently reversed by the next person who doesn't see the reason.
- **The baseline pointer and the matrix** — so the next change has a datum to measure against and a graph to trace through.

> **The honest-handoff rule.** A groundwork run that ends with named residual risks and open questions is **more** complete than one that ends with a falsely clean "all done." The clean lie buys a nasty surprise downstream; the honest map lets the inheritor make an informed call. Never inflate confidence to close the stage — record exactly what you know, what you assumed, and what you couldn't reach.

### Exit — what a passed STAGE 4 leaves behind

Clear `manage / change-and-traceability` only when:

- a **baseline** is recorded and version-named, including the explicit out-of-scope list;
- a **change process** is noted — who proposes, how impact is assessed across the traceability graph, how the decision and its rationale are recorded, and that the agent never self-approves a scope change;
- **traceability** is established to the depth the project warrants (requirement ↔ design ↔ code ↔ test), with the STAGE-2 acceptance criteria serving as the requirement↔test links;
- **residual risk and open questions** are written down, each with its consequence-if-wrong and an owner-to-ask, for whoever inherits the work.

The output of this stage is the contract the build honors and the map the next change reads. Hand the funded requirements, their acceptance criteria, the out-of-scope list, the traceability matrix, and the residual-risk/open-question log forward — verbatim. See [../SKILL.md](../SKILL.md) for the handoff into building and testing.

---

## One-screen summary

| Stage | Core question | Primary agent move | Failure means | On failure |
|---|---|---|---|---|
| **3 — Validate** | Right thing? | Replay each requirement in the user's domain terms; per-item confirm | Wrong target | **Loop back** to [elicitation.md](elicitation.md) / [analysis.md](analysis.md); wording-only → [specification.md](specification.md) |
| **4 — Manage** | It will change — now what? | Baseline + change loop + bidirectional traceability | Uncontrolled drift | Re-validate the changed item, re-baseline, update links |

**Three things this document refuses to let you do:** accept a blanket "looks good" as validation; patch a validation failure in place instead of looping back; treat the validated spec as frozen (the waterfall illusion). Each is the soft, fast-feeling move that costs the most later.

# Specification — Turn The Fuzzy Into The Executable

This reference is the depth behind **STAGE 2 (Specify)** of [the groundwork skill](../SKILL.md). STAGE 2 opens it after STAGE 1 has split functional from non-functional, prioritized with MoSCoW, and drawn the scope line. Your job here is to take the funded requirements — the ones that survived analysis — and forge each one into a **vessel** (user story, use case, or SRS item) carrying **acceptance criteria** sharp enough to test. The output is a contract: it is what STAGE 3 validates against the user, what the build honors, and what the `assay` skill later turns into test oracles. A requirement that you cannot test is not specified — it is still a wish.

You write this as an AI agent. You cannot run a spec workshop or whiteboard with five stakeholders. You write a draft from the code, tickets, and the user's words, then put it in front of **the user as proxy** and let them correct it. So every technique below is phrased as *draft → confront the user with the gap → revise*, not *facilitate a room*. The cheapest fix in all of requirements engineering is catching a misread sentence before it becomes a misread function.

Cross-links: STAGE 1's [analysis.md](analysis.md) feeds you the funded list and the NFR catalog; the failure modes that ruin a spec are in [agent-blind-spots.md](agent-blind-spots.md); after you finish here, [validation-and-management.md](validation-and-management.md) confirms shared understanding and sets up change control; the [decision-tree.md](decision-tree.md) governs how deep to go.

## Contents

- [The gate you are clearing](#the-gate-you-are-clearing)
- [TREE V — Which vessel does this requirement go in?](#tree-v--which-vessel-does-this-requirement-go-in)
- [VESSEL 1 — User stories (Connextra) + INVEST](#vessel-1--user-stories-connextra--invest)
- [VESSEL 2 — Acceptance criteria in Given/When/Then (Gherkin)](#vessel-2--acceptance-criteria-in-givenwhenthen-gherkin)
- [VESSEL 3 — Use cases (when a story is too thin)](#vessel-3--use-cases-when-a-story-is-too-thin)
- [VESSEL 4 — A lightweight SRS skeleton (for larger efforts)](#vessel-4--a-lightweight-srs-skeleton-for-larger-efforts)
- [The six quality attributes — a per-statement gate](#the-six-quality-attributes--a-per-statement-gate)
- [THE DE-VAGUE ENGINE — weasel words → measurable targets](#the-de-vague-engine--weasel-words--measurable-targets)
- [Acceptance criteria ARE the test oracles — the handoff](#acceptance-criteria-are-the-test-oracles--the-handoff)
- [ESCALATION LADDER — when a requirement won't get crisp](#escalation-ladder--when-a-requirement-wont-get-crisp)
- [Pre-flight checklist for STAGE 2](#pre-flight-checklist-for-stage-2)

---

## The gate you are clearing

STAGE 2 has two checklist checks. Everything in this file exists to make them true, so keep them in view:

- **`specify requirements-verifiable`** — each requirement meets the six-attribute quality bar (unambiguous, verifiable, necessary, feasible, consistent, traceable); every vague word is quantified into a measurable target.
- **`specify acceptance-criteria-defined`** — each funded requirement is captured as a user story / use case / SRS item with concrete acceptance criteria (Given/When/Then) that can serve as both the validation contract and the test oracle.

If a requirement cannot pass both, it does not leave this stage. Either sharpen it, or send it back to [analysis.md](analysis.md) because the underlying need is still unknown.

---

## TREE V — Which vessel does this requirement go in?

Run **once per funded requirement** from the STAGE 1 ledger. The vessel is not cosmetic: it decides what you are forced to make explicit. A user story forces a *who* and a *why*; a use case forces *flows and failure paths*; an SRS forces *system-wide consistency and traceability*. Pick the lightest vessel that still forces out the detail this requirement needs.

Every fork carries the three-part discipline so two agents specifying the same requirement land in the same vessel:

- **PREDICATE** — the yes/no question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot yet answer the predicate.

```
V1. Is the requirement a single chunk of user-facing value with one clear actor and benefit?
    PREDICATE: can you say "as <role> I want <goal> so that <benefit>" without it feeling forced?
    └─ YES → USER STORY + acceptance criteria (Given/When/Then). The default vessel. Go to the
             INVEST check, then write Gherkin scenarios.

V2. Does the behavior have branching flows — alternate paths, multiple actors, pre/post-conditions,
    or a sequence that matters?
    PREDICATE: is "happy path + a couple of rules" too thin to capture what actually happens?
    └─ YES → USE CASE (actor / preconditions / main flow / alternate + exception flows).
             Stories that keep sprouting "but what if…" are use cases in disguise.

V3. Is this a non-functional / cross-cutting requirement (performance, security, compliance,
    a quality the whole system must hold) rather than a discrete feature?
    PREDICATE: does it constrain many features at once instead of describing one?
    └─ YES → SRS-STYLE REQUIREMENT STATEMENT ("The system shall…") with a measurable fit criterion.
             A bare user story cannot hold an NFR; it needs a number. See the NFR catalog in analysis.md.

V4. Is the effort large, regulated, multi-team, or contractually scoped?
    PREDICATE: will someone who never spoke to the user have to build or audit from this document alone?
    └─ YES → assemble the stories/use-cases/NFRs into a LIGHTWEIGHT SRS skeleton (below).
             For a small in-team change, do NOT — the SRS is overhead there.
```

**DEFAULT** when the vessel is unclear: write a **user story with acceptance criteria**; it is the cheapest vessel that still forces a who, a why, and a testable outcome. Promote to a use case the moment a third "but what if…" appears, or to an SRS statement the moment a number is the whole point.

**FALLBACK** when you cannot answer the predicates (you do not yet know the actor, the flows, or the metric): you are not ready to specify — the *need* is unsettled. Stop and return to [elicitation.md](elicitation.md) / [analysis.md](analysis.md). Specifying on top of an unknown need just produces a precise description of the wrong thing.

**One-line worked leaf —** *"'Let users get their data out' → V1 YES, one actor, clear benefit → USER STORY: 'As an account owner I want to export my transactions so that I can give my accountant a clean record.' Then INVEST, then Gherkin."*

---

## VESSEL 1 — User stories (Connextra) + INVEST

### The template, and what each slot defends against

Write user stories in the **Connextra form**:

> **As a** `<role>` **I want** `<goal/capability>` **so that** `<benefit/why>`.

Each slot is load-bearing, and each defends against a specific agent failure (see [agent-blind-spots.md](agent-blind-spots.md)):

| Slot | What it forces | The failure it prevents |
|---|---|---|
| `As a <role>` | Name a *specific* actor, not "the user" | Building for an imagined average user; missing that admin, auditor, and guest need different things |
| `I want <goal>` | State the capability at the level of intent, not implementation | Smuggling a UI decision ("a dropdown") in where a need belongs |
| `so that <benefit>` | Justify the story; surface the real why | Gold-plating: a story whose benefit you cannot fill is probably not needed |

If you cannot fill `so that <benefit>` with a benefit the user would actually pay for, that is a signal — the requirement may be unnecessary (fails the **necessary** quality attribute) or you have not dug deep enough into the why (back to [elicitation.md](elicitation.md)). The benefit clause is the cheapest gold-plating detector you have.

The story title is a **promise of a conversation**, not the whole spec. The detail lives in the acceptance criteria. As the agent, your "conversation" is: draft the story and its criteria, then put them to the user and ask *"did I get the role and the why right?"*

### INVEST — the quality gate for a story's shape

Before a story leaves your hands, run it through **INVEST**. This is about a story's *shape*; the six quality attributes (later) are about each *statement's content*. Both must pass.

| Letter | Criterion | The concrete check you apply | If it fails |
|---|---|---|---|
| **I** | Independent | Can this be built and shipped without first building another unfinished story? | Re-cut the slice or note the dependency explicitly so sequencing is deliberate, not accidental |
| **N** | Negotiable | Is it a statement of *need*, leaving room for how? Or has an implementation been baked in? | Strip the solution; move "how" to a design note. A story that dictates the UI is a solution-as-requirement (blind spot) |
| **V** | Valuable | Does the `so that` name value to a real stakeholder? | If you can't fill the benefit, challenge whether it should exist at all |
| **E** | Estimable | Is it understood well enough to size? | If not, the need is too fuzzy — spike it or return to elicitation |
| **S** | Small | Can it be built in well under one iteration? | Split it. A "story" spanning weeks is an epic; slice by workflow step, by data variation, or by happy-path-then-edges |
| **T** | Testable | Can you write acceptance criteria that pass or fail unambiguously? | **This is the keystone.** If you cannot state how you'd test it, it is not yet a requirement — it is a wish. Quantify it (see the De-Vague Engine) |

**Splitting an oversized story (the S that agents skip):** when a story is too big, slice along a *behavioral* seam, never a technical-layer seam ("build the backend" / "build the UI" are not shippable slices). Useful seams: by workflow step (browse → add to cart → pay), by data variant (single item → bulk), by rule (default → edge case → error handling), by happy-path-first (ship the success path, follow with each failure path as its own story).

### Worked example — story + INVEST pass

> **As an** account owner **I want to** export my last 12 months of transactions to CSV **so that** I can hand my accountant a clean record without screenshotting each page.

- **I**: ships alone — no other story blocks it. ✅
- **N**: says CSV (a format the accountant needs), not "a blue export button top-right" — the *how* stays open. ✅
- **V**: benefit is concrete — stop screenshotting, satisfy the accountant. ✅
- **E**: scope is clear enough to size. ✅
- **S**: one format, one range — a few days, not weeks. ✅
- **T**: testable — see the Gherkin below. ✅

---

## VESSEL 2 — Acceptance criteria in Given/When/Then (Gherkin)

Acceptance criteria are the **conditions a story must satisfy to be considered done and correct**. They are where the fuzzy finally becomes executable. Write them in the **Given / When / Then** structure (Gherkin):

- **Given** `<the starting context / preconditions>`
- **When** `<the action or event>`
- **Then** `<the observable, checkable outcome>`
- (`And` / `But` extend any clause.)

Why this structure and not a prose paragraph: each clause maps directly onto a test's anatomy — **Given = arrange, When = act, Then = assert**. A scenario written this way *is* a test specification; a test author transcribes it. Prose acceptance criteria force the reader to reverse-engineer the arrange/act/assert, and they reverse-engineer it differently every time.

### Rules that keep scenarios testable

1. **Then asserts an observable outcome, never an internal state you can't see.** "Then the order is saved" is weak if "saved" isn't observable; "Then the order appears in the user's order history with status Confirmed" is checkable.
2. **One scenario, one behavior.** A scenario with three unrelated `When`s tests nothing cleanly. Split it.
3. **Concrete data beats abstractions.** "Then the total is correct" is not an oracle. "Given a cart of items priced 10.00 and 5.00, When tax is 8%, Then the displayed total is 16.20" *is* — it carries its own expected value.
4. **Cover the unhappy paths.** Every story needs a happy-path scenario *and* the rejection/error/empty/boundary scenarios. The failure scenarios are where requirements gaps hide. (This is exactly the negative-space and boundary thinking the build's tests will need.)
5. **Declarative, not imperative.** Describe *what* outcome, not the click-by-click UI choreography ("clicks the third icon"). Imperative criteria break on every UI tweak and over-specify the *how*, violating Negotiable.

### Worked example — full criteria for the export story

```gherkin
Scenario: Export a full year of transactions
  Given I am signed in as an account owner
    And my account has 240 transactions in the last 12 months
  When I request a CSV export for the last 12 months
  Then I receive a CSV file containing exactly 240 data rows plus one header row
    And each row has columns: date, description, amount, balance
    And the amounts in the file sum to my account's net change for the period

Scenario: Export when there is nothing to export
  Given I am signed in as an account owner
    And my account has 0 transactions in the last 12 months
  When I request a CSV export for the last 12 months
  Then I receive a CSV file with the header row and no data rows
    And I see a message that there were no transactions in this period

Scenario: Export is denied to a non-owner
  Given I am signed in as a read-only delegate, not the account owner
  When I request a CSV export
  Then the export is refused
    And no file is produced
    And I see an explanation that only the account owner can export

Scenario (NFR-derived): Export of a large account stays within budget
  Given an account with 50,000 transactions
  When I request a full export
  Then the file begins downloading within 5 seconds
    And the complete file is delivered within 60 seconds
```

Note how the last scenario pins a **non-functional** requirement (performance) into a concrete, failable threshold — that is how an NFR from [analysis.md](analysis.md) becomes testable. Note also the empty case, the authorization case, and the conservation check ("amounts sum to net change") — these are the scenarios a naive draft omits and a real export bug lives in.

### The agent's loop for writing criteria

You don't know the right numbers and edge rules by yourself. So:

1. **Draft** scenarios from the code, tickets, and the user's words — including the empty/error/boundary ones you'd expect.
2. **Surface your assumptions as questions** the user can answer fast: "Does an empty period produce an empty file or an error?" "Should a delegate be allowed to export, or only the owner?" "Is 60 seconds for a huge account acceptable, or must it be faster?"
3. **Revise** with their answers. Each answered question removes an ambiguity that would otherwise become a rework later.

A scenario you are unsure about is not a defect — it is a **question with a default attached**. Write your best-guess scenario, flag it, and let the user confirm or flip it.

---

## VESSEL 3 — Use cases (when a story is too thin)

Promote a story to a **use case** when behavior has branching flows, multiple actors, ordered steps, or pre/post-conditions that a single story plus a handful of scenarios can't hold cleanly (TREE V2). A use case is the right vessel for a *transaction* — checkout, onboarding, a multi-step approval — where the *failure and alternate paths are half the requirement*.

### The use-case skeleton

| Field | What it captures |
|---|---|
| **Name** | The goal, as a verb phrase ("Withdraw cash", "Submit expense report") |
| **Primary actor** | Who initiates and gets the value |
| **Other actors / systems** | Supporting actors and external systems involved |
| **Preconditions** | What must be true *before* the use case can start (asserted, not re-checked) |
| **Postconditions / guarantees** | What is true on success — and the *minimal guarantee* even on failure (e.g. "no money leaves the account unless dispensed") |
| **Trigger** | The event that starts it |
| **Main success flow** | The numbered happy-path steps, actor action then system response |
| **Alternate flows** | Valid variations that branch off a main step (e.g. "3a. user pays by stored card instead") |
| **Exception flows** | Error/failure paths and how the system responds (e.g. "5e. card declined → …") |

### Worked example (abbreviated)

```
Use case: Withdraw cash from ATM
Primary actor: Account holder
Preconditions: card inserted, PIN verified, account active
Postcondition (success): requested amount dispensed, balance reduced by exactly that amount
Postcondition (min guarantee): if cash is NOT dispensed, balance is unchanged

Main success flow:
  1. Actor selects "Withdraw".
  2. System prompts for amount.
  3. Actor enters amount.
  4. System checks funds and ATM cash on hand.
  5. System dispenses cash and debits the account.
  6. System prints receipt and returns the card.

Alternate flows:
  3a. Actor chooses a preset amount → continue at step 4.

Exception flows:
  4a. Insufficient funds → system shows the available balance, returns to step 2, debits nothing.
  4b. ATM has insufficient cash → system offers a lower amount or cancels; debits nothing.
  5a. Cash jam after debit attempted → system reverses the debit (honor the min guarantee), logs the incident, returns the card.
```

**Each flow step is still acceptance-criteria material.** The postconditions and the exception flows become Given/When/Then scenarios for the build to test — especially the **minimal guarantee** ("balance unchanged unless dispensed"), which is the negative-space invariant that *must never be violated*. Use cases are good precisely because they force you to write down the failure paths a story tends to skip.

**Prefer a use case over a story when:** the *order of steps matters*, there are *multiple actors*, the *failure handling is a large part of the value*, or *one goal has many valid paths*. Prefer a story when the requirement is a single thin slice of value with a clear who/why.

---

## VESSEL 4 — A lightweight SRS skeleton (for larger efforts)

For a large, regulated, multi-team, or contractually-scoped effort (TREE V4), the stories/use-cases/NFRs need a containing document so a builder who never met the user can work — and so the whole thing stays internally consistent. Use a trimmed **ISO/IEC/IEEE 29148** (successor to **IEEE 830**) structure. Do **not** impose this on a small in-team change; there it is pure overhead.

| Section | Contents | The discipline it enforces |
|---|---|---|
| **1. Introduction** | Purpose, scope, definitions/glossary, references | Forces an explicit **in-scope / out-of-scope** statement — the scope-creep brake from [analysis.md](analysis.md), in writing |
| **2. Overall description** | Product context, actors/user classes, assumptions and dependencies, constraints | Forces you to name the **silent stakeholders** and the assumptions a build would otherwise discover the hard way |
| **3. Functional requirements** | The stories and use cases, each with acceptance criteria, each with a stable ID | Forces **traceability** — every requirement has an identifier downstream artifacts can point back to |
| **4. Non-functional requirements** | Performance, security, reliability, usability, scalability, compliance, observability — each with a measurable fit criterion | Forces the NFR sweep to have **numbers**, not adjectives. The architecture-deciding section |
| **5. Interfaces / data** | External systems, APIs, key data entities and their constraints | Forces the seams and contracts to be explicit before code assumes them |
| **6. Constraints, open questions, glossary** | Regulatory/tech constraints, unresolved questions with owners, agreed terms | Forces unknowns to be *recorded*, not silently guessed |

**Agent practicality:** you can generate most of this from the code, tickets, and the validated stories/use-cases you already wrote — then hand it to the user to correct. The glossary is high-leverage: pinning the *meaning of terms* ("what exactly is an 'active' account?") removes a whole class of ambiguity at the source. Keep IDs stable; the IDs are the spine of the traceability matrix in [validation-and-management.md](validation-and-management.md).

---

## The six quality attributes — a per-statement gate

INVEST checks a story's shape. These six check each individual *requirement statement's content*. Run every funded requirement through all six; a statement that fails any one of them is not done. Each comes with the concrete check you actually apply.

| # | Attribute | The check you apply (do this, literally) | Smell that it failed |
|---|---|---|---|
| 1 | **Unambiguous** | Read it as an adversary trying to build the *wrong* thing that still satisfies the words. Can you? If two readings exist, it's ambiguous. Hunt weasel words (next section) and undefined pronouns ("it", "they", "the system"). | "fast", "appropriate", "etc.", "as needed", "and/or", a "should" that might mean "must" |
| 2 | **Verifiable** | Answer the keystone question: **"How would I test that this passed?"** Name the test, the input, and the expected result. If you can't, it's not verifiable. | No number; no observable outcome; an outcome only the author can judge |
| 3 | **Necessary** | Trace it to a stakeholder need and a benefit. Which `so that` does it serve? If none, it may be gold-plating ([agent-blind-spots.md](agent-blind-spots.md)). | No stakeholder claims it; "while we're in there" features; capability nobody requested |
| 4 | **Feasible** | Can it be built within the known tech, time, and budget? Sanity-check the number against reality before promising it. | A latency/throughput target the chosen architecture can't physically hit; conflicts with a hard constraint |
| 5 | **Consistent** | Cross-check against every *other* funded requirement. Does it contradict one? (R3 says "delete after 30 days"; R9 says "keep 7-year audit trail".) | Two requirements that can't both be satisfied; the same term used two ways; an NFR that breaks a functional one |
| 6 | **Traceable** | Give it a stable ID and confirm it can link *up* to its source need and *down* to design/code/test. | No ID; can't say which stakeholder or which goal it came from; orphaned with no test to verify it |

**Apply these as a literal pass.** Take each requirement, walk the six checks, and fix or flag. The two that agents most often fail silently are **#2 Verifiable** (no number) and **#5 Consistent** (contradiction with another requirement they wrote ten minutes earlier). Run #5 across the *whole set*, not statement-by-statement — contradictions are pairwise.

**The keystone restated:** after writing any requirement, ask *"how would I test that this passed?"* If you cannot answer with a test, an input, and an expected result, the requirement is still fuzzy. Go quantify it.

---

## THE DE-VAGUE ENGINE — weasel words → measurable targets

Vague adjectives are not requirements; they are placeholders for a number you haven't asked for yet. They feel like agreement ("yes, make it fast!") while hiding the fact that nobody has said *how* fast — so the disagreement surfaces later, as rework. Every weasel word below must be **replaced** with a measurable target before the requirement leaves STAGE 2.

You usually don't know the right number alone. That's fine: **propose a default, attach it to a question, and let the user confirm or correct.** A proposed number ("p95 under 200 ms — acceptable?") gets a real answer far faster than an open question ("how fast?") ever will.

| Weasel word | What it's secretly asking | Replace it with a target like… | Question to put to the user |
|---|---|---|---|
| **fast / responsive / quick** | latency / throughput budget | "p95 response < 200 ms and p99 < 500 ms at N concurrent users" | "What's the slowest acceptable response, and at what load?" |
| **scalable** | the load it must handle and grow to | "sustains 1,000 req/s at < 300 ms p95; scales to 10,000 with horizontal nodes, no code change" | "What's peak load today, and the 2-year target?" |
| **user-friendly / intuitive / easy** | a measurable usability outcome | "a new user completes the core task unaided in < 2 min; task success rate ≥ 90% in usability test; ≤ N support tickets/week" | "How will we know the UI is good enough — what should a new user accomplish, how fast?" |
| **secure** | the threats defended and the controls required | "passwords stored with bcrypt (cost ≥ 12); all traffic TLS 1.2+; passes OWASP Top 10 review; no secrets in logs" | "What data is sensitive, what regulation applies, what's the threat we most fear?" |
| **reliable / available / stable** | uptime and failure behavior | "99.9% monthly uptime; no data loss on a single-node crash; recovers within 30 s; RPO ≤ 1 min" | "What downtime is tolerable per month, and what must never be lost?" |
| **efficient** | resource budget | "processes a 10 MB file in < 2 s using < 256 MB RAM" | "What's the resource budget — time, memory, cost per operation?" |
| **robust / handles errors gracefully** | the specific failure inputs and required behavior | "rejects malformed input with a typed error and no crash; survives a dropped DB connection by retrying ≤ 3× then failing cleanly" | "Which failures must it survive, and what should happen on each?" |
| **flexible / configurable / extensible** | the specific axes of variation needed *now* | "supports CSV and JSON export today; new format added via a documented adapter without touching core" | "What actually needs to vary — and is that a need now or a guess?" |
| **soon / eventually / real-time / near-real-time** | a concrete time bound | "reflected in the dashboard within 5 s of the event (95th percentile)" | "What's the maximum acceptable delay before it shows up?" |
| **most / some / etc. / and so on / as appropriate** | the actual enumeration or threshold | replace with the explicit list, or "≥ 95% of cases, where a case is …" | "Can you give me the full list, or the exact cutoff?" |
| **minimal / lightweight / low overhead** | the measured cost ceiling | "adds < 5 ms latency and < 10 MB memory per request" | "What overhead is the ceiling before it's unacceptable?" |

**The keystone verifiability question, again, because it is the whole engine:** for every word you replace, the test is *"how would I test that this passed?"* If the replacement still can't answer it, you haven't replaced the vagueness — you've just used a longer vague phrase. "Should be reasonably fast under normal load" is the same wish with more syllables. Keep going until a test author could pick up the line and write the assertion without asking you anything.

---

## Acceptance criteria ARE the test oracles — the handoff

This is the load-bearing idea of STAGE 2, so it gets its own section.

A test's hardest part is the **oracle**: knowing what the *correct* answer is, so the test can tell pass from fail. When you write a Given/When/Then scenario with concrete data — "Given items priced 10.00 and 5.00, When tax is 8%, Then the total is 16.20" — you have *already written the oracle*. The expected value is right there. A test author transcribes `assert total == 16.20`; they do not have to invent the expected answer or guess the rule.

This is why the groundwork → build → test pipeline works:

- **Given** → the test's **arrange** (set up the precondition / fixture).
- **When** → the test's **act** (invoke the behavior).
- **Then** → the test's **assert** (check the observable outcome — the oracle).

So the discipline is: **write acceptance criteria that a test could be generated from verbatim.** Concrete inputs, concrete expected outputs, the empty case, the error case, the boundary, the must-never-happen invariant. The crisper your `Then`, the cheaper and stronger the test. A `Then` like "the result is correct" hands the test author no oracle and forces them to re-derive (and possibly mis-derive) the rule you already knew.

When this work later reaches the **`assay`** skill, those acceptance criteria are the starting oracles for its case design — and the empty/error/boundary scenarios you wrote here are exactly the negative-space and boundary cases its trees hunt for. Carry the funded requirements, their acceptance criteria, and the out-of-scope list forward **verbatim**; do not paraphrase a `Then` into something looser on the way. (The full handoff is in the SKILL's "Handoff to building" section; the next stage, [validation-and-management.md](validation-and-management.md), preserves the IDs that make the trace hold.)

---

## ESCALATION LADDER — when a requirement won't get crisp

Ambiguity is not binary; you sharpen a requirement rung by rung. Climb only as far as the requirement's risk warrants — a low-stakes story stops at rung 2; a money-or-safety requirement goes to the top.

```
Rung 0: prose sentence ("export should be fast")
   → too vague to test. Climb.
Rung 1: rewrite in Connextra + run INVEST + run the six attributes
   → who/why/shape fixed, but maybe still no numbers. Climb if any weasel word remains.
Rung 2: replace every weasel word via the De-Vague Engine (propose a default + a question)
   → measurable targets in place. Climb if behavior branches.
Rung 3: write Given/When/Then for happy path + empty + error + boundary
   → oracles in place. Climb if flows/actors/ordering are involved.
Rung 4: promote to a use case (main + alternate + exception flows, pre/postconditions, min guarantee)
   → failure paths captured. Climb if the effort is large/regulated/multi-team.
Rung 5: assemble into the SRS skeleton with stable IDs + glossary + scope statement
   → consistent, traceable, buildable from the document alone.
Rung 6: STILL ambiguous after all of the above?
   → the NEED is unknown, not the wording. Stop specifying. Go back to elicitation.md /
     analysis.md and ask the user the one sharp question that resolves it.
```

The signal for **rung 6** — the one agents miss — is when you keep rewording and it keeps feeling slippery. That is not a specification problem; it means *you do not yet understand what the user wants*. No amount of Gherkin fixes an unknown need. Climbing down to re-elicit is the correct move, not a failure. Guessing a plausible-sounding requirement and proceeding is the expensive mistake this whole skill exists to prevent — see [agent-blind-spots.md](agent-blind-spots.md).

---

## Pre-flight checklist for STAGE 2

Before you call `checklist verify specify`, confirm every funded requirement clears this. If any line is "no", you have not finished specifying.

- [ ] Every funded requirement sits in the right **vessel** (story / use case / SRS item) per TREE V.
- [ ] Every story passes **INVEST** — especially **T** (testable) and **N** (negotiable, no baked-in solution).
- [ ] Every requirement passes all **six quality attributes**; #2 (verifiable) and #5 (consistent across the whole set) checked explicitly.
- [ ] Every **weasel word** is replaced with a measurable target; the keystone question *"how would I test this passed?"* is answerable for each.
- [ ] Every funded requirement has concrete **Given/When/Then** acceptance criteria covering happy path **and** empty/error/boundary/negative-space.
- [ ] Non-functional requirements carry **numbers** (fit criteria), not adjectives.
- [ ] Every requirement has a **stable ID** so it can be traced down to design/code/test later.
- [ ] The acceptance criteria are crisp enough to serve **directly as test oracles** — a test author could transcribe them without asking you anything.
- [ ] Anything you guessed is **flagged as a question** for STAGE 3, not silently assumed.

Cleared? Then the requirements are executable. Take them to [validation-and-management.md](validation-and-management.md) — STAGE 3 confirms that what you understood is what the user wants, before a single line is built.

# Elicitation — Who To Ask, And What They Really Need

This reference is opened by **STAGE 0 — Elicit** of the groundwork skill. It is the gather phase: before any design, sizing, or code, you decide *who the requirement touches* and *what they actually need underneath what they said*. Your structural handicap as an agent shapes everything here — you cannot walk the floor, run a workshop, or interview the silent stakeholder, so you elicit **through the user as proxy** and by **reading what can be read** (existing code, docs, tickets, competitors). Clearing this stage means two checks pass: `elicit stakeholders-mapped` and `elicit real-need-surfaced`. The rest of this file is how to earn them. Sibling stages: [analysis.md](analysis.md) is next; the failure modes this stage exists to stop are catalogued in [agent-blind-spots.md](agent-blind-spots.md); the routing logic for *how deep to go* lives in [decision-tree.md](decision-tree.md).

Every decision fork below carries three things, so two agents working the same ask reach the same map:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to do when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

When a fork stays ambiguous after DEFAULT and FALLBACK, stop and ask the user one sharp question. A silent guess about *who matters* or *what they meant* is the one move that quietly dooms the whole build.

## Contents

- [The shape of elicitation](#the-shape-of-elicitation)
- [MOVE 1 — Stakeholder discovery (the stakeholder onion)](#move-1--stakeholder-discovery-the-stakeholder-onion)
- [MOVE 2 — Need excavation (solution vs. need)](#move-2--need-excavation-solution-vs-need)
- [MOVE 3 — The implicit-requirements sweep](#move-3--the-implicit-requirements-sweep)
- [Elicitation methods, adapted for an agent](#elicitation-methods-adapted-for-an-agent)
- [Question banks (literally usable, grouped by goal)](#question-banks-literally-usable-grouped-by-goal)
- [Capturing the output of this stage](#capturing-the-output-of-this-stage)
- [The escalation ladder for the whole stage](#the-escalation-ladder-for-the-whole-stage)

---

## The shape of elicitation

Requirements engineering runs in order: **gather → analyze → specify → validate → manage**. This file is only the first link, but it is the one that decides whether the rest has anything true to work on. A requirement that was never elicited cannot be analyzed, specified, or validated — it simply ships as a defect later. The empirical pattern is blunt: **most missed requirements are not analysis errors; they are missed people or unspoken assumptions.** So the two engines of this stage are (1) finding *everyone* the change touches and (2) digging past the stated solution to the real need, including the needs no one bothers to say out loud.

Three nested moves run here, each feeding the next:

```
MOVE 1 — STAKEHOLDER DISCOVERY   → who must this serve, constrain, or not break?
MOVE 2 — NEED EXCAVATION          → for each, what is the real need under the stated ask?
MOVE 3 — IMPLICIT SWEEP           → what won't they say because it "goes without saying"?
```

You do not leave this stage with a design. You leave it with a **stakeholder map**, a list of **real needs** (not solutions), and an **explicit list of confirmed implicit requirements** — all signed off by the user.

---

## MOVE 1 — Stakeholder discovery (the stakeholder onion)

A stakeholder is anyone who *affects* the change or is *affected by* it. The most common and most expensive elicitation error is to consult only the direct user — the loud, present, obvious person — and miss the funder, the operator, the auditor, and the person who never speaks but absorbs the blast. Picture the people in concentric rings around the change and sweep outward; nothing in an outer ring is allowed to be skipped silently.

### The onion rings

| Ring | Who | Why they hold a requirement you'd otherwise miss | How an agent reaches them |
|---|---|---|---|
| **Core: direct users** | The people who operate the feature hands-on | Workflow fit, real task shape, the steps you can't see from the ask | User describes them; read UI flows, usage analytics, support transcripts |
| **Sponsor / funder** | Who pays for it, whose goal justifies it | The *business* outcome the feature must move; the budget/time ceiling | Ask the user "whose problem does this solve, and how is success measured?" |
| **Operators / SRE / on-call** | Who runs it in production | Deployability, observability, rollback, on-call burden, capacity | Read runbooks, dashboards, alert configs, deploy scripts, IaC |
| **Compliance / legal / security** | Who can veto the launch | Data-handling law, retention, consent, license, threat model | Ask explicitly; read existing policy docs, `LICENSE`, security headers |
| **Support / success** | Who fields the tickets afterward | Error clarity, self-service, the failure modes that generate tickets | Read the existing ticket queue and FAQ for the same area |
| **Silent-but-affected** | Adjacent teams, downstream consumers, integrators | A contract you'd break, a job that reads your table, an SLA they depend on | Grep for callers/consumers; read API contracts and cross-team docs |
| **Negative / adversarial** | Attackers, abusers, fraud, and anyone who *loses* if this ships | Abuse cases, the threat the happy-path ignores, internal turf resistance | Threat-model it yourself; ask "who is harmed or made worse off by this?" |

The **silent-but-affected** and **negative** stakeholders are exactly the ones a workshop-less agent forgets, because they generate no message in the thread. They are also where the project-sinking requirement usually hides. Treat their absence as a prompt, not a clearance.

### Stakeholder discovery checklist (sweep every line — ask the user where you can't read it)

```
[ ] WHO uses this directly, day to day? (core)
[ ] WHO asked for it / pays for it / measures its success? (sponsor)
[ ] WHO has to deploy, monitor, and keep it alive at 3am? (operators)
[ ] WHO can legally or contractually BLOCK it? (compliance / legal / security)
[ ] WHO answers the support tickets when it misbehaves? (support)
[ ] WHAT other systems, teams, or jobs READ or DEPEND ON the thing I'm changing? (silent)
[ ] WHO is harmed, defrauded, or made worse off if this ships or is abused? (negative)
[ ] WHOSE existing workflow does this change WITHOUT their asking? (silent)
[ ] Is there a regulator, auditor, or contract clause in scope? (compliance)
[ ] WHO inherits this code after me, and what do they need to not be lost? (future maintainer)
```

For each identified stakeholder, record three fields so analysis has something to weigh:

- **Interest** — what outcome they want.
- **Influence** — can they block, fund, or merely complain?
- **Proxy** — since you can't interview them, *who (the user, a doc, the code) speaks for them here?*

**PREDICATE (per ring): is there a real person/role in this ring for this change?**
**DEFAULT** when unsure a ring applies: assume it *does* and ask one targeted question rather than dropping it — a falsely-included stakeholder costs one question; a falsely-excluded one costs a re-architecture.
**FALLBACK** when you cannot tell from the ask alone: read the code and docs for callers and contracts first, then ask the user to confirm or extend the list.

### Escalation ladder — when stakeholder ambiguity rises

```
1. Infer from the ask itself (who is the sentence about?)
2. Read the code/docs/tickets for callers, owners, contracts, and policy
3. Ask the user ONE grouped question naming the rings you're unsure of
4. Ask the user to NAME a human for each risky ring (sponsor, compliance, ops)
5. If a blocking ring (legal/security/ops) stays unnamed → flag it as an OPEN
   QUESTION and a residual risk; do not silently assume it's empty.
```

A blocking ring left empty by *assumption* rather than by *confirmation* is the single most dangerous gap to carry forward. Mark it, don't bury it.

---

## MOVE 2 — Need excavation (solution vs. need)

What the user says is not, by default, what the user needs. People naturally hand you a **solution** — a button, a field, a screen — because translating a frustration into a feature feels helpful. Implementing that literal solution is the most common agent failure (see [agent-blind-spots.md](agent-blind-spots.md)). Your job is to step back one or more rungs from the proposed solution to the underlying goal, *then* let the design follow from the goal.

### The five-whys / solution-vs-need technique

When an ask is shaped like a solution ("I want X"), keep asking a calm, non-accusatory **why** until you reach a goal that no longer mentions a specific mechanism. Each "why" peels one layer. You usually do not need a literal five; stop when you hit a need the user agrees is the real driver and that admits more than one solution.

**PREDICATE: is the ask phrased as a mechanism (a button, a field, a format, a tool) rather than an outcome?**
- **YES** → excavate. Ask "what does that let you do?" / "what happens today without it?" / "what are you ultimately trying to achieve?"
- **NO (already an outcome)** → confirm the outcome and move to the implicit sweep.

**DEFAULT** when you can't tell if it's a mechanism or a goal: treat it as a mechanism and dig once; one clarifying question is cheap, a wrong build is not.
**FALLBACK** when the user can't articulate the why: ask them to describe the *last time they did this by hand*, step by step. The need lives in the manual workaround.

#### Worked example A — "Add an export button"

```
Ask:   "Add a button to export the dashboard to CSV."
Why 1: "Why export to CSV?"            → "I open it in Excel."
Why 2: "Why open it in Excel?"          → "I build a summary table from it."
Why 3: "Why a summary table?"           → "I email it to my boss every Monday."
Why 4: "Why email it every Monday?"     → "He wants to see last week's numbers."
REAL NEED: "My boss needs last week's key numbers, reliably, every Monday."
```

The export button is *one* solution. Surfacing the real need opens better ones the user couldn't ask for: a **scheduled email digest** of the key numbers (no human in the loop, no Excel step, no Monday-morning scramble), or a shared live view. The point is not to override the user — it is to put the real need on the table so the *user* can choose, now informed that the button was the long way around.

#### Worked example B — "Make it faster"

"Faster" is a need wearing a number's clothing with no number. Never accept it as a requirement; interrogate it into something measurable (specification turns this into a target — see [specification.md](specification.md)).

```
Ask:   "Make the app faster."
Q:     "What specifically feels slow?"        → "The report page."
Q:     "Slow for whom, on what?"               → "Sales team, on the 10k-row accounts view."
Q:     "What does slow cost you?"              → "They give up before it loads; deals stall."
Q:     "How slow is too slow / what's good?"   → "Under ~2s would be fine; it's ~15s now."
Q:     "p50 or worst case?"                     → "Worst case for big accounts is the problem."
REAL NEED: "p95 load of the 10k-row accounts report under 2s for sales users."
```

Notice what excavation bought: a *who* (sales), a *what* (the accounts report, not the whole app), a *cost* (abandoned, stalled deals — which is also the priority signal for [analysis.md](analysis.md)), and a *number* (p95 < 2s, from ~15s). "Make it faster" optimizes the wrong page; the excavated need points the work at the one that matters.

### The need-excavation question stems (reusable)

- "What does that let you accomplish?" — climbs from mechanism to goal.
- "What happens today without it? Walk me through the workaround." — exposes the real task.
- "Who is this for, and who else does the same thing?" — links back to MOVE 1.
- "How will you know it worked?" — pre-stages the acceptance criteria.
- "What would make this a failure even if it shipped?" — surfaces hidden constraints.
- "Is the goal *this exact mechanism*, or the outcome it produces?" — the explicit fork.

A caution that protects you from over-rotating: excavation digs *toward* the need, it does not give you license to **gold-plate** away from the user's intent. If, after digging, the user genuinely wants the literal mechanism (sometimes the export button *is* the right answer), build that. Excavation informs the choice; it doesn't seize it. Adding capability they never asked for is its own anti-pattern — see [agent-blind-spots.md](agent-blind-spots.md).

---

## MOVE 3 — The implicit-requirements sweep

Some requirements are never spoken because everyone *assumes* them: "obviously we won't lose the data," "obviously passwords aren't stored in plaintext." No one lists them, so an agent that only builds what was said ships software that is missing them — and their absence is not a feature gap, it is an **incident**. You must therefore *proactively* walk the catalog below and **ASK** about each one that plausibly applies, rather than waiting for the user to volunteer it (they won't — that's the whole point).

This sweep covers the *implicit* end. The full *non-functional* analysis (performance budgets, scalability, the architecture-deciding NFRs) is run deliberately in the next stage — see [analysis.md](analysis.md). Here you are flushing the assumed-obvious into the open so nothing critical is silently dropped before you even get there.

### Implicit-requirements catalog (sweep every row; ask where it applies)

| Category | The assumed-obvious requirement | The question to ask the user |
|---|---|---|
| **Data durability** | Committed data is not lost on crash/restart/deploy | "If the process dies mid-write, what must survive? Any data we can never lose?" |
| **Consistency / integrity** | No partial writes, no duplicate effects, no corruption | "Can an operation be half-applied? Is double-submit / retry safe here?" |
| **Security defaults** | No secrets in plaintext, logs, or URLs; sane crypto | "What's sensitive here? Where do credentials/keys live? OK to log this?" |
| **Privacy / PII** | Personal data is identified, minimized, retained lawfully | "Does this touch personal data? Any retention, deletion, or consent rules?" |
| **Authentication** | The caller is who they claim to be | "Who is allowed to call this? How do we know it's really them?" |
| **Authorization** | Authenticated ≠ permitted; enforce least privilege | "Can every authenticated user do this, or only some roles? Per-record?" |
| **Audit / logging** | Sensitive actions are traceable after the fact | "Does anyone need to answer 'who did this, when'? Is an audit trail required?" |
| **Accessibility** | Usable with keyboard/screen-reader; not color-only | "Any accessibility bar to meet (WCAG, keyboard-only, contrast)?" |
| **i18n / l10n** | Text, dates, numbers, currency, locale, RTL | "One locale or many? Any non-English, currency, or timezone concerns?" |
| **Error handling** | Failures are caught, surfaced clearly, and recoverable | "When this fails, what should the user see? What must NOT just silently swallow?" |
| **Backward compatibility** | Existing callers/data/clients keep working | "Who already depends on the current behavior/shape? Must old clients keep working?" |
| **Performance floor** | A minimum acceptable latency/throughput exists | "Is there a speed/volume below which this is unacceptable?" |
| **Cost ceiling** | A budget on compute/storage/3rd-party calls | "Any cost ceiling? Does this fan out to a metered/paid API?" |
| **Capacity / scale floor** | Expected and peak load it must not buckle under | "How many users / rows / requests, normal and peak?" |
| **Observability** | You can tell in prod whether it's working | "How will we know in production that this is healthy or broken?" |

For each row you decide is in play, capture it as a confirmed requirement and carry it forward; for each you decide is *not* in play, that decision is itself worth a one-line note (it may resurface in scope). Either way, **the row was not silently ignored** — which is the whole purpose of the gate check `real-need-surfaced`, whose description explicitly names making implicit/assumed requirements "explicit and confirmed with the user."

**PREDICATE (per row): could this change plausibly violate this assumption?**
**DEFAULT** when unsure whether a row applies: ask. An unasked durability/security/authz question is the cheapest possible thing to ask and the most expensive possible thing to discover in production.
**FALLBACK** when the user defers ("not sure"): record it as an OPEN QUESTION with a sensible safe default noted, and surface it again at validation — never resolve it by silent omission.

---

## Elicitation methods, adapted for an agent

A human analyst interviews, runs workshops, and observes the floor. You cannot do any of those directly. Your toolkit is interviewing *through the user* and *reading what exists*. Each method below carries a **WHEN** so you reach for the right one instead of defaulting to "just ask the user everything."

| Method | What it is, for an agent | WHEN it fits best | Watch out for |
|---|---|---|---|
| **Structured Q&A with the user** | Grouped, purposeful questions (see banks below), not a flat interrogation | Always, but spend it on the *why*, the *implicit sweep*, and confirming the stakeholder map — the things only the user knows | Question fatigue: batch and group; never ask what you could read |
| **Read the existing system & code** | Inspect the actual implementation, schema, config, UI flows, IaC | When the change touches existing behavior; to find callers, contracts, current limits, and the *de facto* requirements already encoded | The code shows what *is*, not what *should be* — don't mistake current behavior for an intended requirement |
| **Ticket / doc archaeology** | Mine issue trackers, PRs, design docs, runbooks, support queues, commit history | To recover *why* something is the way it is, find prior attempts, and surface recurring pain that predates this ask | Stale docs lie; corroborate against the code and the user |
| **Competitor / prior-art analysis** | Study how comparable products or internal precedents solve the same need | When the need is well-trodden and you want to surface the implicit features users will *expect* by convention | "They do it" isn't a requirement; it's a hypothesis to confirm with the user |
| **Prototype-to-react-to** | Put a wireframe, a sketch, a sample output, or a tiny spike in front of the user so they react to something concrete | When the user can't articulate it in the abstract ("I'll know it when I see it"), or words are slippery and ambiguous | A polished prototype invites scope creep and premature commitment — keep it deliberately rough |

**The ordering rule that saves the user's patience:** read first, ask second. Every question you can answer by reading the code, the tickets, or a competitor is a question you should not spend on the user. Reserve the user's bandwidth for what only they hold — the business *why*, the priorities, the implicit constraints, and the sign-off. This is also why the methods are listed roughly cheapest-to-the-user first.

**PREDICATE: can I answer this question by reading something that already exists?**
- **YES** → read it (code, tickets, docs, competitor). Bring the *finding* to the user to confirm, not the open question.
- **NO** → it's a genuine user question; put it in a grouped batch.

**DEFAULT** when a fact is partly readable and partly judgment: read the fact, ask the judgment. ("The code rate-limits at 100 req/s — is that an intended requirement or an accident?")
**FALLBACK** when reading is inconclusive (ambiguous code, contradictory docs): state what you found, name the contradiction, and ask the user to adjudicate.

---

## Question banks (literally usable, grouped by goal)

Ask these in **grouped batches**, not one at a time — a wall of single questions exhausts the user and fragments the thread. Pull the rows that apply, drop the rest. Tie every answer back to a stakeholder (MOVE 1), a real need (MOVE 2), or an implicit requirement (MOVE 3).

### Bank 1 — Stakeholder discovery

```
- Who will use this directly, and how often?
- Who asked for this, and whose goal does it serve?
- How will *you* (or they) measure that this succeeded?
- Who has to operate, deploy, or support it after it ships?
- Is there anyone who has to approve this for legal, security, or compliance reasons?
- What other systems, teams, or jobs read from or depend on the part I'm changing?
- Who, if anyone, is worse off if this ships — or if it's abused?
- Whose current workflow does this change without their having asked?
```

### Bank 2 — Need excavation (the why under the ask)

```
- In one sentence, what are you ultimately trying to achieve here?
- What does [the thing you asked for] let you do that you can't today?
- Walk me through how you do this today, step by step, including the annoying parts.
- Is [the asked-for mechanism] the goal itself, or just one way to get the outcome?
- What would make this a failure even if we shipped exactly what you described?
- If you could wave a wand and the problem were gone, what would be different?
```

### Bank 3 — Implicit requirements (the assumed-obvious)

```
- If the process crashes mid-operation, what absolutely must not be lost or duplicated?
- What data here is sensitive or personal? Any rules on storing, logging, or deleting it?
- Who is allowed to do this — everyone signed in, or only certain roles?
- Does anyone need an audit trail of who did what, when?
- When it fails, what should the user see, and what must never be silently swallowed?
- Who already depends on the current behavior — must the old way keep working?
- Are there accessibility, language/locale, or regulatory bars this has to meet?
```

### Bank 4 — Constraints, scale, and cost

```
- How many users / records / requests, on a normal day and at peak?
- Is there a latency or throughput floor below which this is unacceptable?
- Any budget ceiling on compute, storage, or paid third-party calls?
- What's the deadline or event this is tied to, and is it hard or soft?
- What platforms, browsers, devices, or versions must this support?
- Are there existing standards, libraries, or systems I'm required to use or avoid?
```

### Bank 5 — Scope edges (early seed for the out-of-scope line)

```
- What's explicitly NOT part of this? What should I deliberately leave out for now?
- Is there a tempting adjacent feature we should consciously defer?
- What's the smallest version of this that would still be worth shipping?
```

Bank 5 is intentionally light here — drawing the formal in-scope / out-of-scope line is the next stage's job. But asking these early plants the stake, and a stake planted at elicitation is the cheapest defense against scope creep later (see [analysis.md](analysis.md)).

---

## Capturing the output of this stage

You leave STAGE 0 with three artifacts, ready for the gate:

1. **Stakeholder map** — every ring of the onion swept, each entry tagged with interest / influence / proxy, and any blocking ring left empty *by confirmation, not by assumption*. Satisfies `elicit stakeholders-mapped`.
2. **Real-need list** — each stated solution traced to the goal beneath it, with the user's agreement on which need actually drives the work. Satisfies the first half of `elicit real-need-surfaced`.
3. **Confirmed implicit requirements** — the catalog rows that apply, made explicit and confirmed with the user; unresolved ones logged as OPEN QUESTIONS with safe defaults. Satisfies the second half of `elicit real-need-surfaced`.

Then run the gate from the skill spine:

```
checklist check elicit stakeholders-mapped
checklist check elicit real-need-surfaced
checklist verify elicit
```

Do not advance to [analysis.md](analysis.md) until both checks pass. If, mid-stage, you realize you've been handed a solution and started designing it, stop — that is the literal failure this stage exists to catch ([agent-blind-spots.md](agent-blind-spots.md)). Go back to MOVE 2.

---

## The escalation ladder for the whole stage

When elicitation stalls or ambiguity rises, climb one rung at a time rather than guessing or stalling:

```
1. RE-READ the ask — is the who/why already implied in the sentence?
2. READ the artifacts — code, schema, tickets, docs, competitors — for facts.
3. ASK the user grouped questions (Banks 1–5), findings-first.
4. PROTOTYPE-to-react-to — put a rough sketch/sample in front of them.
5. NAME the unknown — if a blocking ring or implicit requirement stays unresolved,
   log it as an OPEN QUESTION + safe default + residual risk, and surface it again
   at validation. Never close the gap by silent omission.
```

Each rung costs more of the user's attention; stop as soon as a rung resolves the ambiguity. The cardinal rule of this stage, restated: **a missed requirement is almost always a missed person or an unspoken assumption — so the cure is always to widen the circle of who you ask and to say the unsaid out loud, never to guess quietly.**

---

**Cross-links:** previous context and routing — [decision-tree.md](decision-tree.md) and [agent-blind-spots.md](agent-blind-spots.md); this stage — **elicitation** (you are here); next stage — [analysis.md](analysis.md); downstream — [specification.md](specification.md), [validation-and-management.md](validation-and-management.md); the skill spine — [../SKILL.md](../SKILL.md).

# Agent Blind Spots in Requirements Work

This is the heart of `groundwork` — the failure catalog an AI coding agent must be *told*, because it walks into every one of these by default. It is loaded at **STAGE 0 (Elicit)** alongside the [decision-tree.md](decision-tree.md) and kept open through all five stages: re-read the relevant entry at **every GATE** before you certify it. Where the other references teach you *how* to do requirements work — [elicitation.md](elicitation.md), [analysis.md](analysis.md), [specification.md](specification.md), [validation-and-management.md](validation-and-management.md) — this one names the gravity that pulls you off course while you do it. An agent's strongest reflex (implement the literal ask, fast) is precisely the reflex that builds the wrong thing well. Read it as a pre-flight scan and a cockpit checklist, not an essay.

## Contents

- [PRE-FLIGHT SCAN — run this before you touch code](#pre-flight-scan--run-this-before-you-touch-code)
- [How each entry is built](#how-each-entry-is-built)
- [BS-1 — Implementing the literal / solution-shaped ask without digging for the why](#bs-1--implementing-the-literal--solution-shaped-ask-without-digging-for-the-why)
- [BS-2 — "I can't interview stakeholders, so I'll skip it" defeatism](#bs-2--i-cant-interview-stakeholders-so-ill-skip-it-defeatism)
- [BS-3 — Ignoring non-functional and implicit requirements because the user didn't name them](#bs-3--ignoring-non-functional-and-implicit-requirements-because-the-user-didnt-name-them)
- [BS-4 — Gold-plating: adding capability nobody asked for](#bs-4--gold-plating-adding-capability-nobody-asked-for)
- [BS-5 — Silent scope creep across a long session](#bs-5--silent-scope-creep-across-a-long-session)
- [BS-6 — Treating requirements as one-shot: no re-elicitation when validation fails](#bs-6--treating-requirements-as-one-shot-no-re-elicitation-when-validation-fails)
- [BS-7 — The "let me just start coding" reflex](#bs-7--the-let-me-just-start-coding-reflex)
- [BS-8 — Accepting ambiguous adjectives without quantifying](#bs-8--accepting-ambiguous-adjectives-without-quantifying)
- [BS-9 — Anchoring on the first interpretation; never enumerating alternative readings](#bs-9--anchoring-on-the-first-interpretation-never-enumerating-alternative-readings)
- [The blind-spot map (gate-by-gate cheat sheet)](#the-blind-spot-map-gate-by-gate-cheat-sheet)
- [ESCALATION LADDER — when ambiguity rises](#escalation-ladder--when-ambiguity-rises)

---

## PRE-FLIGHT SCAN — run this before you touch code

Before you write, edit, or even *plan* a single line of implementation, run these nine checks out loud. Each maps to a blind spot below and to a checklist gate in [../SKILL.md](../SKILL.md). If any answer is "no" or "I don't know", you are not ready to build — go back to the stage that owns it.

```
□ WHY ........ Do I know the problem behind the ask, or only the solution they typed?      → BS-1  (elicit / real-need-surfaced)
□ WHO ........ Have I enumerated stakeholder CLASSES and asked the user to proxy them?     → BS-2  (elicit / stakeholders-mapped)
□ UNSAID ..... Did I sweep non-functional + implicit needs the user never named?           → BS-3  (analyze / functional-nonfunctional-split)
□ ONLY-THIS .. Is everything I'm about to build actually requested? (gold-plating check)    → BS-4  (analyze / prioritized-and-scoped)
□ LEDGER ..... Is there a written scope + out-of-scope line, and has it drifted?            → BS-5  (analyze / prioritized-and-scoped)
□ RE-LOOP .... If validation fails, will I re-elicit — or paper over the gap?               → BS-6  (validate / shared-understanding-confirmed)
□ NOT-YET .... Am I reaching for code before the gates are clear?                            → BS-7  (all gates)
□ NUMBERS .... Is every "fast / secure / robust / scalable" replaced by a measurable bar?   → BS-8  (specify / requirements-verifiable)
□ READINGS ... Did I write ≥2 readings of any ambiguous ask before picking one?             → BS-9  (elicit / real-need-surfaced)
```

**One-line discipline:** if you cannot answer all nine, the correct next action is a *question to the user*, not a commit. Asking is cheaper than rework by an order of magnitude, and every gate in this skill exists to force the question while it is still cheap.

---

## How each entry is built

Every blind spot below is a cheat-sheet card with five fixed fields, so you can scan it at a gate in seconds:

- **DEFAULT WRONG MOVE** — what you do automatically if no one stops you.
- **WHY YOU (AN LLM) FALL IN** — the specific mechanism in how you were trained/prompted that produces it. This is not generic human advice; it is about *you*.
- **THE TELL** — the observable symptom in your own draft output that means you are doing it right now.
- **CORRECTIVE** — the behavior that replaces it, phrased for an agent who interviews *through the user* and reads code/docs/tickets/competitors instead of running workshops.
- **DO THIS / SAY THIS** — one literal line you can execute or paste verbatim.

Decision forks inside an entry use the same engine as [decision-tree.md](decision-tree.md): **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity rises past those, climb the [escalation ladder](#escalation-ladder--when-ambiguity-rises) at the end.

---

## BS-1 — Implementing the literal / solution-shaped ask without digging for the why

> **The #1 agent failure.** If you internalize only one card, internalize this one.

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | The user says "add an export button" and you add an export button. You treat the sentence as a spec and start coding. The stated *solution* becomes your requirement, untouched. |
| **WHY YOU (AN LLM) FALL IN** | You are optimized to be helpful and responsive — to map an instruction to an action with the shortest path. A solution-shaped ask is already in action-shape, so it sails past the part of you that would otherwise ask "why". You have no felt cost for building the wrong thing, so the instinct to *just do it* never gets the friction a burned engineer feels. |
| **THE TELL** | Your plan's first verb matches the user's first noun ("button" → "I'll add a button"). You can describe *what* you'll build but not *what problem it removes from the user's day*. |
| **CORRECTIVE** | Step back one level and dig for the underlying need before the ask hardens into a task. The export button may really be "every month I hand my boss a report and it takes an hour." That reframing can change the whole solution — a scheduled email, a dashboard, an API — and the button may not even be it. Use the five-whys ladder; treat the stated solution as *one hypothesis*, not the requirement. Full technique in [elicitation.md](elicitation.md). |
| **DO THIS / SAY THIS** | *"Before I build this — what does having it let you stop doing, or do better? Walk me through the moment you'd reach for it."* |

**The why-ladder (run it on every solution-shaped ask):**

```
ASK:   "Add an export button."
WHY 1: Why export? → "To get the data into a spreadsheet."
WHY 2: Why a spreadsheet? → "I have to send my boss a monthly summary."
WHY 3: Why manual each month? → "There's no other way to get the numbers out."
ROOT:  The real requirement is a recurring summary delivered to a manager —
       a button is one of several solutions, and maybe not the best.
```

**Decision fork — is this ask solution-shaped?**

- **PREDICATE:** does the ask name a UI element, a technology, an algorithm, or a verb-on-a-thing ("add X", "use Y", "make a Z") rather than an outcome or a pain?
- **DEFAULT** when unsure: treat it as solution-shaped and run the why-ladder anyway — it is cheap, and a confirmed root need costs you nothing but makes everything downstream sharper.
- **FALLBACK** when you cannot reach the user mid-task: write down both the literal reading *and* your best inferred root need, build toward the root, and surface the assumption at the next validation checkpoint ([validation-and-management.md](validation-and-management.md)). Never silently build only the literal thing.

> Anti-pattern name to recognize in the wild: **solution-as-requirement**. It is the parent of half the other cards here.

---

## BS-2 — "I can't interview stakeholders, so I'll skip it" defeatism

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | You reason: "I'm an AI, I can't run a workshop or talk to the ops team or legal, so stakeholder discovery doesn't apply to me," and you build for the single person in the chat as if they were the whole world. |
| **WHY YOU (AN LLM) FALL IN** | You correctly notice a real handicap — you genuinely cannot walk the floor — and then over-generalize it into permission to skip the step entirely. It is the easiest corner to cut because no one in the conversation is visibly harmed by cutting it; the silent stakeholder is, by definition, not in the room to object. |
| **THE TELL** | Your requirements only ever mention "the user". No funder, no operator, no compliance, no downstream consumer appears anywhere in your notes. |
| **CORRECTIVE** | The handicap changes the *method*, not the *goal*. You cannot interview stakeholders directly — so **enlist the user as proxy** and **enumerate stakeholder classes** for them to fill in. A missed requirement is almost always a missed *person*, not a missed analysis. You also read what *can* be read without anyone's permission: existing code, tickets, commit history, docs, competitor products. See the proxy-interview protocol in [elicitation.md](elicitation.md). |
| **DO THIS / SAY THIS** | *"I can't talk to them directly, so you're my proxy. For each of these — end users, whoever funds/approves this, whoever operates it in production, compliance/legal, and anyone affected but not asking — who is it, and what would they demand or veto?"* |

**Stakeholder-class checklist (paste and fill — never ship with a blank):**

| Class | Question to put to the user | If it stays blank |
|---|---|---|
| Direct users | Who actually clicks/calls this, and are there distinct *types* (admin vs guest, power vs casual)? | Assume one type, flag the assumption |
| Sponsor / funder | Who approved or pays for this work, and what outcome makes them call it a success? | Success criteria are unanchored — escalate |
| Operators / on-call | Who runs, deploys, monitors, and gets paged when it breaks? | Observability + reliability NFRs likely missing (see BS-3) |
| Compliance / legal / security | Any regulation, data-handling, retention, or audit constraint? | Treat as HIGH-risk implicit requirement until cleared |
| Silent-but-affected | Whose workflow, data, or downstream system changes even though they never asked? | The classic project-sinker — name them explicitly |

**Decision fork — the user can't name a class.**

- **PREDICATE:** does the user say "there's no one like that" for a class?
- **DEFAULT:** record it as an *explicit, confirmed* "no such stakeholder" — a documented zero is a deliverable, an unasked blank is a hole.
- **FALLBACK:** if you suspect the class exists from the code/tickets (e.g. you see auth, PII, or audit logs but the user named no compliance owner), push back once with the evidence before accepting the blank.

> Anti-pattern names: **listening only to the loudest** (you optimize for the voice in the chat) and the **missing-person miss**. The user is your microphone into the room, not the entire room.

---

## BS-3 — Ignoring non-functional and implicit requirements because the user didn't name them

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | You implement exactly the behaviors the user described and nothing else: no thought to load, latency, auth, data durability, audit, privacy, or accessibility — because they weren't in the sentence. "They didn't ask for it" feels like permission to ignore it. |
| **WHY YOU (AN LLM) FALL IN** | You are a literal, text-grounded reasoner: you act on tokens that are present and under-weight constraints that are *absent because they're obvious to a human*. Nobody writes "don't lose my data" or "don't store passwords in plaintext" — so those tokens never appear, and you never react to them. You also lack the production scar tissue that makes an engineer flinch at an unbounded query. |
| **THE TELL** | Your spec has functional bullets but no section for performance, security, reliability, scalability, compliance, or observability. Or you've chosen a data model / architecture before any NFR was even discussed. |
| **CORRECTIVE** | Run a **deliberate NFR sweep** — proactively, not on request — and separately surface **implicit requirements** (the unspoken "obviously"s). NFRs are the most-skipped class *and* the one that most often dictates the architecture; surfacing them after the design is poured is the most expensive correction in the book. Read the full NFR catalog and the implicit-requirement sweep in [analysis.md](analysis.md). |
| **DO THIS / SAY THIS** | *"A few things you probably assume but I should confirm: how many users/requests at peak? How fast is acceptable? What's the worst outcome if this data is lost or leaked? Any compliance or audit rule? Who needs to see it work in production?"* |

**NFR + implicit sweep (run every one; a deliberate "N/A" is a valid answer, silence is not):**

| Dimension | The unspoken default the user assumes | Quantify it into |
|---|---|---|
| Performance | "It'll feel instant" | p95 latency < N ms at M concurrent users |
| Scalability | "It'll handle our growth" | works to X records / Y req-s; degradation plan beyond |
| Reliability / durability | "It won't lose my data" | RPO/RTO; "no acknowledged write is ever lost" |
| Security | "It's safe" | authn/authz model; no secret in logs; input is untrusted |
| Privacy / compliance | "It's legal" | which regulation; retention; PII handling; audit trail |
| Usability / accessibility | "Anyone can use it" | target users; WCAG level; error-recovery behavior |
| Observability | "We'll know if it breaks" | what's logged/metered/alerted; who gets paged |
| Implicit safety defaults | "obviously…" | data-safety, idempotency, no destructive default, least privilege |

The absence of these is an **incident waiting to happen, not a feature gap**. Treat each unanswered row as an open risk carried into the manage stage ([validation-and-management.md](validation-and-management.md)).

**Decision fork — surface an NFR as a Must or defer it?**

- **PREDICATE:** would getting this NFR wrong corrupt data, breach a law, leak a secret, or force an architecture rewrite later?
- **DEFAULT** (architecture-deciding NFRs — scale, security model, data durability): pull it forward to STAGE 1 and treat as a **Must** candidate; these are the ones you cannot bolt on.
- **FALLBACK** (you cannot get a number from the user yet): record a *provisional* bar with the assumption stated ("assuming < 1k req/s; revisit if wrong") rather than leaving it blank — a wrong-but-visible number invites correction; a blank invites disaster.

---

## BS-4 — Gold-plating: adding capability nobody asked for

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | While building the requested thing you add a config option, a second export format, a caching layer, a "while I'm here" refactor, a settings page — none of it requested. It feels like generosity. |
| **WHY YOU (AN LLM) FALL IN** | You are trained to be maximally helpful and to produce complete-looking, impressive artifacts; "more" reads as "better" in your objective. You also pattern-match to similar projects in your training data and import their features by association ("apps like this usually have…"). Each unrequested addition is complexity and surface area for bugs that the user never agreed to own. |
| **THE TELL** | Your diff or plan contains capabilities that trace to no stakeholder need and no line in the scope ledger. You catch yourself thinking "they'll probably want…" or "it's basically free to also…". |
| **CORRECTIVE** | Build to the *funded* requirements and nothing past them. If you spot a genuinely valuable extra, do not silently build it — **name it as a candidate** and let the user decide its priority via MoSCoW ([analysis.md](analysis.md)). "It was easy to add" is not a reason; complexity is a permanent tax paid by whoever maintains it. |
| **DO THIS / SAY THIS** | *"I noticed I could also add X. I'm NOT building it unless you want it — should it be a Must, Should, Could, or Won't for this round?"* |

**Decision fork — I have an idea for an extra.**

- **PREDICATE:** does this addition trace to a stated or confirmed-implicit requirement from a real stakeholder?
- **YES →** it isn't gold-plating; spec it normally.
- **NO, but it's valuable →** surface it as a **Could/Won't** candidate for the user to rank; do not build it this round without an explicit yes.
- **NO, and it's "while I'm here" →** **STOP.** This is the purest gold-plating; drop it. If it's a real cleanup, log it as a separate future item, not a rider on this work.

> Distinguish from scope creep (BS-5): gold-plating is *you* adding unasked features; scope creep is *the requirement set* swelling over time from many small additions. They compound — gold-plating is one of the engines of creep.

---

## BS-5 — Silent scope creep across a long session

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | Over a long conversation the user says "oh, and also…" five times, you accommodate each cheerfully, and by the end you're building three times the original ask with no one having decided to. No moment ever said "this is now bigger." |
| **WHY YOU (AN LLM) FALL IN** | You process each turn somewhat locally and agreeably; you have no persistent, externalized model of "the agreed scope" unless you write one down, so each addition looks small *in isolation*. Your context window blurs the cumulative picture, and your eagerness to say yes means you rarely call a halt. |
| **THE TELL** | You cannot, right now, state the current scope in one paragraph and point to where each piece was agreed. The thing you're building no longer matches the thing you wrote down at the start — and you can't say when it changed. |
| **CORRECTIVE** | Keep a **running scope ledger**: a short, explicit list of what is **in scope** and — just as load-bearing — what is **out of scope**, updated whenever the ask moves. The out-of-scope line, written in black and white, is the single most effective brake on creep. When a new "also" arrives, don't just absorb it; route it through the ledger and let the user see the total grow. See the scope-line technique in [analysis.md](analysis.md). |
| **DO THIS / SAY THIS** | *"Adding that grows the scope. Current scope is A, B, C; out of scope is X, Y. With your new item the list becomes A, B, C, D — do we add it now (and drop something or extend the timeline), or park it for a follow-up?"* |

**Scope-ledger template (maintain it live; re-read it at every gate):**

```
SCOPE LEDGER  (rev N, updated <when/why>)
  IN SCOPE        : A — B — C
  OUT OF SCOPE    : X — Y — (explicitly NOT doing, and why)
  PENDING (unranked, from "also…"): D — E
  LAST CHANGE     : +D requested at turn 14, awaiting user ranking
```

**Decision fork — a new "also…" arrives mid-session.**

- **PREDICATE:** does it fit inside the current in-scope list and the agreed effort?
- **DEFAULT:** add it to **PENDING**, not to IN SCOPE, and ask the user to rank it before it becomes work. Pending is a holding pen, not an acceptance.
- **FALLBACK:** if you're unsure whether it's in or out, state the ambiguity and ask — the dangerous move is to resolve it silently in favor of "yes, building it."

> Anti-pattern name: **scope creep**. The ledger is the brake; the out-of-scope list is the part of the brake agents forget to write down.

---

## BS-6 — Treating requirements as one-shot: no re-elicitation when validation fails

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | You gather requirements once, write them up, and treat them as frozen. When a validation check shows the user understood something differently than you did, you patch the wording or rationalize the gap instead of going back to re-gather — or you skip validation entirely because "they already told me what they want." |
| **WHY YOU (AN LLM) FALL IN** | You favor forward progress and closure; looping back feels like failure or wasted work, and your training rewards producing a finished artifact over reopening a finished one. You also tend to treat your own first capture as ground truth, so a mismatch reads as "the user misspoke" rather than "I misunderstood." |
| **THE TELL** | There is no step in your process where you replay the requirements back to the user for confirmation; or there is, but when it surfaces a gap you edit the document rather than re-run elicitation/analysis. You think of requirements as a phase you *finished*, not a thing that *evolves*. |
| **CORRECTIVE** | Treat validation as a real loop with teeth: walk the requirements and their acceptance criteria back to the user, demo a prototype or wireframe where words are slippery, and confirm *what you understood = what they want*. When a gap appears, **go back** — re-elicit ([elicitation.md](elicitation.md)) or re-analyze ([analysis.md](analysis.md)) — rather than paper over it. And accept up front that requirements will keep changing after you "finish"; that's why the manage stage exists ([validation-and-management.md](validation-and-management.md)). Every misunderstanding caught here saves multiplied rework downstream. |
| **DO THIS / SAY THIS** | *"Let me play this back: you want \<X\>, and we'll know it works when \<acceptance criterion\>. Where is that wrong or incomplete?"* — and if anything comes back wrong: *"That changes the requirement — let me re-open it, not just reword it."* |

**Decision fork — validation surfaced a mismatch.**

- **PREDICATE:** is the mismatch in *wording* (we agree on intent, the text is unclear) or in *intent* (we wanted different things)?
- **WORDING →** tighten the spec text and re-confirm; cheap.
- **INTENT →** **go back a stage.** Re-elicit the need (BS-1) or re-analyze priority/scope; do not edit the doc to hide the disagreement.
- **DEFAULT** when you can't tell which: treat it as intent — the more expensive assumption is the safer one, because a misread intent that you "fix" as wording resurfaces as rework at the worst time.

> Anti-pattern name: the **waterfall illusion** — believing requirements can be collected once and frozen. In reality they keep moving; plan to re-loop, and instrument the change process so a later move tells you what it touches (traceability — see [validation-and-management.md](validation-and-management.md)).

---

## BS-7 — The "let me just start coding" reflex

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | The moment the ask is even roughly clear, you open a file and start implementing. You skip elicitation, analysis, and specification entirely because building is the part you're most fluent at and most rewarded for. |
| **WHY YOU (AN LLM) FALL IN** | Code generation is your highest-confidence, lowest-friction output — you are *very good* at it and it produces an immediately impressive artifact. Requirements work, by contrast, produces prose and questions, which feel less like "doing the task." Your eagerness to demonstrate competence pulls you toward the keyboard before the target is pinned. This reflex is what every gate in this skill exists to interrupt. |
| **THE TELL** | You're writing implementation before any GATE in [../SKILL.md](../SKILL.md) is cleared. You've decided on a data structure, a library, or a function signature before you can state the user's actual problem or the acceptance criteria. |
| **CORRECTIVE** | Honor the gates. Code is the *output* of groundwork, not a substitute for it. The flight plan is elicit → analyze → specify → validate → manage, and you do not fly past a GATE until it's cleared. The one legitimate exception: if the ask is genuinely a fully-pinned, low-risk change (a one-line fix, a rename), this skill is overkill — *say so explicitly* and proceed. That judgment is itself a gate, not a loophole. |
| **DO THIS / SAY THIS** | *"I'm going to resist coding until the requirements are pinned. Here's what I still need to confirm before I build: \<list\>."* (Or, for a trivial ask: *"This is a one-line, low-risk change with no hidden need — I'll skip the full requirements pass and just do it."*) |

**Decision fork — can I skip groundwork and just build?**

- **PREDICATE:** is the ask fully pinned (no hidden why, no stakeholder ambiguity, no unstated NFR) *and* low blast-radius (a rename, a typo, a one-liner with obvious intent)?
- **YES →** say so out loud and proceed; over-applying the skill is its own waste.
- **NO →** run the gates. If you're unsure, you're a **NO** — uncertainty *is* the signal that there's groundwork to do.
- **FALLBACK** when you can't tell: open the [decision-tree.md](decision-tree.md), which exists exactly to triage how deep to go.

---

## BS-8 — Accepting ambiguous adjectives without quantifying

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | The user says "make it fast," "keep it secure," "it should be robust and user-friendly," and you write those words straight into the requirements — or worse, start building toward your own private guess of what they mean. |
| **WHY YOU (AN LLM) FALL IN** | Vague adjectives are fluent and agreeable; they read as complete sentences, so your "is this specced?" sense doesn't trip. You're also comfortable filling the void with a plausible interpretation rather than flagging it, because resolving ambiguity *toward a guess* keeps you moving while asking *feels* like friction. |
| **THE TELL** | Your requirements contain any of: fast, slow, quick, scalable, secure, robust, reliable, user-friendly, intuitive, efficient, simple, flexible, lightweight, modern, seamless — with no number, threshold, or testable condition attached. |
| **CORRECTIVE** | Kill every vague word by converting it to a measurable target. The keystone test for any requirement: *"how would I test that this passed?"* If you can't answer, it's still too fuzzy. "Responses should be fast" → "p95 response time < 200 ms under N concurrent users." Now developer and tester have a shared oracle, and the acceptance criterion ([specification.md](specification.md)) writes itself. |
| **DO THIS / SAY THIS** | *"'Fast' isn't testable yet — what's the slowest acceptable response, and for what fraction of requests? E.g. 'p95 under 200 ms'. What number would make you say it failed?"* |

**Vague-word → measurable conversion bank (use literally):**

| Vague word | Sharpening question to the user | Measurable form |
|---|---|---|
| fast / responsive | "Slowest acceptable, for what % of requests?" | p95 latency < N ms at M concurrent users |
| scalable | "To how many users/records/req-s, by when?" | sustains X req/s and Y records with < Z degradation |
| secure | "Against whom, protecting what?" | authn/authz model named; OWASP top-10 covered; no secret in logs |
| robust / reliable | "Survive what failures, recover how?" | handles inputs A…D without crash; RTO < N; retries idempotently |
| user-friendly / intuitive | "Which users, doing what task, how measured?" | target user completes task T in ≤ K steps, error rate < E% |
| efficient | "Efficient in what — time, memory, cost?" | < N MB resident; < $C per 1k operations |
| available | "How much downtime is acceptable?" | 99.9% monthly; planned-maintenance window defined |

**Decision fork — the user can't give a number.**

- **PREDICATE:** can the user state a threshold when asked directly?
- **DEFAULT:** offer a concrete strawman from the bank above ("say, p95 under 200 ms?") and let them accept or correct — a number to react to is far easier than a number to invent.
- **FALLBACK:** if no number is reachable yet, anchor to a comparable benchmark (the current system's measured latency, a competitor's published SLA) and record it as provisional, flagged for confirmation. Never leave the adjective bare.

> Cross-link: an unquantified adjective is, almost always, an **unsurfaced NFR** (BS-3) wearing a disguise. Catch one and sweep for the other.

---

## BS-9 — Anchoring on the first interpretation; never enumerating alternative readings

| Field | Content |
|---|---|
| **DEFAULT WRONG MOVE** | An ambiguous ask ("show recent orders", "sync the data", "let users manage their account") has several valid readings, and you silently lock onto the first one that occurred to you, then build it as if it were the only one. |
| **WHY YOU (AN LLM) FALL IN** | You are a next-token predictor: the most probable continuation arrives first and *feels* like the obvious meaning, which suppresses the search for alternatives. Once you've committed to a reading, everything you generate afterward coheres around it (self-anchoring), so the other readings never get drafted and the user never gets to choose. |
| **THE TELL** | You can state exactly one interpretation of an ambiguous phrase, confidently, and you didn't write down any others. Words like "recent", "the data", "manage", "active", "all", "it" went unexamined. |
| **CORRECTIVE** | When an ask is ambiguous, **enumerate at least two readings before choosing one**, and put the fork to the user. Anchoring is defeated by *generating alternatives on purpose* — force yourself to write reading B and C even when reading A feels obvious. Disambiguate the load-bearing words: what does "recent" mean (7 days? last 10? since last login?); what is "the data" (which entities, which direction); what does "manage" cover (edit? delete? export? close?). See the disambiguation drill in [elicitation.md](elicitation.md). |
| **DO THIS / SAY THIS** | *"'Recent orders' could mean (a) last 7 days, (b) last 10 orders, or (c) since their last login — which one? And does 'orders' include cancelled and pending, or only completed?"* |

**Disambiguation drill (run on every ambiguous ask):**

```
1. UNDERLINE the load-bearing words ("show RECENT orders to ACTIVE users").
2. For each, list ≥2 plausible meanings.
3. If meanings change the build → present the fork to the user, don't pick silently.
4. Record the chosen reading in the spec so it's testable and traceable.
```

**Decision fork — how many readings do I owe the user?**

- **PREDICATE:** do the competing readings lead to *materially different* builds (different data, behavior, or scope)?
- **DEFAULT** (they differ materially): enumerate them and make the user choose — this is the one place you must not pick for them.
- **FALLBACK** (they barely differ, or the user is unreachable): pick the reading that is **safest and most reversible** (narrower scope, no destructive action, least data exposed), state it as an assumption, and confirm at validation. When in doubt, the reading that does *less* is the safer default.

> Cross-link: anchoring (BS-9) and solution-as-requirement (BS-1) are cousins — both are you committing to the first frame. BS-1 is anchoring on the *solution*; BS-9 is anchoring on the *meaning*. The cure for both is the same reflex: generate the alternative before you commit.

---

## The blind-spot map (gate-by-gate cheat sheet)

Re-read the matching cards before you certify each gate in [../SKILL.md](../SKILL.md). The checklist IDs are exact.

| STAGE | GATE check ID | Cards to re-scan | The one question |
|---|---|---|---|
| Elicit | `stakeholders-mapped` | BS-2 | "Did I enumerate stakeholder classes and have the user proxy them?" |
| Elicit | `real-need-surfaced` | BS-1, BS-9 | "Do I have the *why*, and did I resolve the ambiguous readings?" |
| Analyze | `functional-nonfunctional-split` | BS-3 | "Did I run the NFR + implicit sweep deliberately?" |
| Analyze | `prioritized-and-scoped` | BS-4, BS-5 | "Is everything funded, nothing gold-plated, and is the scope line written down?" |
| Specify | `requirements-verifiable` | BS-8 | "Is every vague adjective now a number I could test?" |
| Specify | `acceptance-criteria-defined` | BS-1, BS-8 | "Does each criterion trace to a real need and a measurable bar?" |
| Validate | `shared-understanding-confirmed` | BS-6 | "Did I replay it back, and will I re-loop (not reword) on a mismatch?" |
| Manage | `change-and-traceability` | BS-5, BS-6 | "Is there a change process and a trail, because this *will* move?" |
| (every gate) | — | BS-7 | "Am I reaching for code before this gate is clear?" |

---

## ESCALATION LADDER — when ambiguity rises

Most blind spots resolve at the lowest rung: ask the user one sharp question. When that isn't enough, climb one rung at a time — each costs more attention, so stop as soon as the ambiguity is resolved. This mirrors the strategy ladder in [decision-tree.md](decision-tree.md), adapted for an agent who cannot convene a meeting.

```
1. ASK THE USER ONE SHARP QUESTION.
   The default and cheapest move. A precise either/or beats an open "what do you want?".
      ↓ still unresolved (user unsure, or two stakeholders implied to disagree)
2. READ WHAT CAN BE READ.
   Mine the existing code, tickets, commit history, docs, and config for the answer the
   user can't articulate. The current behavior is itself a requirement source.
      ↓ still unresolved
3. STUDY COMPARABLES.
   Look at how the existing system, a competitor, or a sibling feature already resolved
   this. Bring the precedent back as a concrete strawman to react to.
      ↓ still unresolved
4. BUILD A REACT-TO ARTIFACT.
   When words stay slippery, draft a wireframe, a sample output, an API sketch, or a tiny
   prototype and ask "is THIS what you mean?". People correct a concrete thing far better
   than they specify an abstract one. (See prototype-to-react-to in elicitation.md.)
      ↓ still unresolved
5. NAME THE CONFLICT EXPLICITLY.
   If the ambiguity is really two stakeholders wanting opposite things (more features vs.
   more stability), stop trying to resolve it yourself — surface the conflict to the user
   for a decision. (See conflict-surfacing in analysis.md.)
      ↓ still unresolved
6. RECORD A FLAGGED ASSUMPTION AND PROCEED ON THE SAFEST READING.
   The last resort, never the first. Pick the narrowest, most reversible interpretation
   (BS-9 FALLBACK), write it down as an open question for the manage stage, and make sure
   the next validation checkpoint puts it back in front of the user.
```

**The cardinal rule across all six rungs:** resolving ambiguity *silently in favor of "just build it"* is the single move that fails requirements work. Every card in this file is a different face of that one mistake. Ask, read, show, name — in that order — before you ever assume.

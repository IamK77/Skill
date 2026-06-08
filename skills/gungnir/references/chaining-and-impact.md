# Chaining & Impact — the part a scanner cannot do

This reference is the depth behind **STAGE 4 — Chain** of the [../SKILL.md](../SKILL.md) flight plan, where the pentest stops being a tool run and becomes an attack: it governs the three things automation cannot replicate — **chaining several small flaws into one real exploit**, **abusing the business logic** no scanner understands, and **post-exploitation to show true impact** — and the load-bearing caution that an agent attacking a system agents built shares the builder's blind spots. The human-era tester carried this work as instinct: the creativity to see that two harmless behaviours combine into account takeover, the stubbornness to push past the first wall, and a *different* mind than the one that built the target. None of those is guaranteed in an agent, which runs the scanner, gets a list, and stops. For *why* this stage exists and why it is the agent's weakest point, read **[agent-era-shifts.md](agent-era-shifts.md)** — **SHIFT 4** (the agent stops at the scanner; the creative, chaining, logic-abusing attack is the whole point) and **SHIFT 3** (the agent shares the defender's blind spots; agreement is not evidence). Those cards are the *why*; this file is the *how*.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and never relaxed here: **A defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly authorized to test.** You arrive at this stage with a set of *confirmed* findings from STAGE 3 ([exploitation-by-class.md](exploitation-by-class.md)), each one reproduced, false positives discarded. This stage takes those confirmed singles and asks the question the scanner can never ask: *put together, and pushed as far as they go, what do they actually let an attacker do?*

This stage backs one check: **`chained-and-impact-shown`**.

## Contents

- [The signature of work the scanner missed: low + low = critical](#the-signature-of-work-the-scanner-missed-low--low--critical)
- [How to chain: build the attack graph, not the bug list](#how-to-chain-build-the-attack-graph-not-the-bug-list)
- [Business-logic abuse: attack the intent, not the input](#business-logic-abuse-attack-the-intent-not-the-input)
- [Post-exploitation: turn "a hole exists" into "here is the blast radius"](#post-exploitation-turn-a-hole-exists-into-here-is-the-blast-radius)
- [The shared-blind-spot caution: agreement is not evidence](#the-shared-blind-spot-caution-agreement-is-not-evidence)
- [The independence move: attack the assumptions the design made](#the-independence-move-attack-the-assumptions-the-design-made)
- [The decision: have I shown impact and taken an independent angle, or re-run my own assumptions?](#the-decision-have-i-shown-impact-and-taken-an-independent-angle-or-re-run-my-own-assumptions)
- [What leaves this stage](#what-leaves-this-stage)

---

## The signature of work the scanner missed: low + low = critical

A scanner reports findings as a flat list of independent items, each with its own severity. That framing is the lie this stage exists to break. Real attacks are rarely a single critical flaw; they are a *path* — a sequence of small, individually-unalarming weaknesses that compose into one severe outcome. A vulnerability scanner cannot see this because it scores each finding in isolation and has no model of how one finding's output becomes another's input.

The canonical shape, and the one to internalize:

> A **low-severity** information leak (a verbose error, a username enumeration on the login form, a predictable account ID in a URL) **plus** a **low-severity** weak password-reset (a reset token that is short, guessable, or doesn't expire) **chains into critical: full account takeover.** Neither flaw alone would make a triage list move. Together they are the breach.

When a triage process would have closed two "low" tickets as *won't-fix*, and chaining them yields account takeover or data exfiltration, that **"low + low → critical" is the precise signature of work the scanner missed** — and the proof that this stage earned its place. The CVSS score of a chain is not the max of its links; it is the severity of the *outcome* the chain reaches. Score the chain by where it ends.

This is also exactly the work the agent's default skips (SHIFT 4): chaining has no obvious procedure and produces no clean green, so an agent that ran the scanner and confirmed the singles will report "found three lows" and stop. The discipline of this stage is to refuse that stop — to treat every confirmed finding not as a closed ticket but as a *capability* you now hold, and ask what other capabilities it unlocks.

---

## How to chain: build the attack graph, not the bug list

Chaining is not luck; it is a search you drive deliberately. Lay the confirmed findings out as **capabilities**, not bugs, then look for edges where one capability's output feeds another's precondition.

| Reframe each finding as a capability | Then ask: what does that unlock? |
|---|---|
| Verbose error leaks a stack trace / internal path | a target for path traversal, an SSRF destination, a tech-stack fingerprint that picks the next exploit |
| Username/email enumeration on login or reset | the *list* that makes a weak reset or credential-stuffing attack actually run |
| IDOR exposes another user's record | the data (email, security-question answer, a reset link) that feeds the *next* step |
| Weak/non-expiring reset token | takeover of *any* account you can name — combine with the enumeration above |
| An unlinked `/admin-old` panel found in recon | a privileged surface reachable once any low-priv foothold gives you a session |
| Reflected XSS in an authed page | a session/credential thief that escalates a low-priv account toward an admin's |
| A file-upload that accepts a dangerous type | code execution *if* you can also reach where the file is served |

The method:

- **PREDICATE:** does the output or new access from one confirmed finding satisfy a *precondition* of another finding (confirmed or merely suspected)?
- **DEFAULT** when it plausibly might: **try the chain end-to-end in staging** and see how far it actually reaches — a chain is proven by walking it, exactly as a single finding is proven by exploiting it (the confirm-vs-false-positive fork in [decision-tree.md](decision-tree.md)). A chain you only *argued* on paper is a hypothesis, not a finding.
- **FALLBACK** when you cannot safely walk the full chain in staging (a link would corrupt shared state or touch an out-of-scope dependency): walk it as far as is safe, document the remaining links with the concrete evidence that each precondition is met, and mark the chain *demonstrated-to-step-N, remainder-reasoned* for the user — never assert an unwalked chain as exploited.

Walk every confirmed single against every other and against the suspected-but-unconfirmed leftovers; a "false positive" that couldn't be exploited *alone* sometimes becomes live once a chained step supplies its missing precondition. The unlinked surface from recon ([recon-and-enumeration.md](recon-and-enumeration.md)) is fertile ground — a forgotten endpoint is often the privileged step a foothold was missing.

---

## Business-logic abuse: attack the intent, not the input

Every other class of finding tests whether the system mishandles *malformed* input. Business-logic abuse tests whether the system can be driven to a state its designers never intended *using inputs that are individually well-formed and accepted*. No scanner finds these, because a scanner has rules for what bad input looks like and **no model of what the system is for.** And the agent attacking a system agents built may have no better model than the scanner — which is the heart of SHIFT 3 and why this is precisely the work that needs forcing.

The move is to write down the **business rules and invariants** — the things that must always be true for the system to make sense — and then try to violate each one with sequences of legitimate-looking actions:

| Invariant the design assumes | The abuse that tests it |
|---|---|
| A price / quantity / balance is non-negative | submit a negative quantity, a negative coupon, an item count that overflows — **can the total go negative and credit you?** |
| A checkout completes its steps in order | jump straight to the confirmation/fulfilment endpoint — **can you skip the payment step?** |
| A workflow has states reached only in sequence | call a later-stage endpoint before the earlier one fired — **can you reach `shipped` without `paid`, `approved` without `reviewed`?** |
| A coupon / voucher / referral is single-use | replay the redemption request, run two in parallel — **can you reuse it, or race it (TOCTOU) for double credit?** |
| A rate limit / quota bounds an action | retry, parallelize, or vary a parameter to slip the counter — **can you exceed the cap?** |
| A user acts only on their own resources | the IDOR from [exploitation-by-class.md](exploitation-by-class.md), now read as a *logic* violation: the system *intended* ownership and didn't enforce it |
| A value the client sends is trustworthy | tamper a price, a role, a `user_id`, an `is_admin` flag in the request body the server trusts |

The discipline: **list the invariants first, on purpose.** An agent that merely "tries weird inputs" will re-test the input-validation classes and miss the logic, because logic abuse is about *order and quantity and identity across multiple valid requests*, not about one malformed value. Enumerate what the system is *supposed* to guarantee, then attack each guarantee directly. This dovetails with the independence pass below: the invariants the design assumed are exactly the assumptions the builder (human or agent) is blind to.

- **PREDICATE:** is there a rule whose violation would cost money, leak data, or corrupt state that the system *assumes* holds but may not *enforce* server-side?
- **DEFAULT:** test it — drive the sequence of legitimate requests that would break the rule, in staging. The cheapest, highest-yield logic abuses (negative amounts, skipped steps, coupon reuse, client-trusted role flags) are nearly always worth an attempt.
- **FALLBACK** when you cannot tell whether a rule is an enforced invariant or just a UI convention: probe it with the safe version (one replay, one out-of-order call), observe the server's response, and escalate only if it doesn't reject you — don't assume enforcement and don't assume its absence.

---

## Post-exploitation: turn "a hole exists" into "here is the blast radius"

A finding that says *"an SQL injection exists on the search parameter"* is a fact. A finding that says *"this SQL injection reads the entire users table including password hashes, and the same DB credential reaches the orders and payments tables"* is **actionable** — it tells the owner what is actually at stake, which is what makes a fix get prioritized and resourced. Post-exploitation is the work of converting the first sentence into the second: once you are in, **how far does *in* go?**

Three questions, asked from wherever the exploit dropped you, always inside the snapshotted staging scope and never pivoting into an out-of-scope or third-party system (the authorization boundary from [scope-and-authorization.md](scope-and-authorization.md) does not loosen because you now have a foothold):

- **Lateral movement — how far across can you reach?** From this foothold, what *other* systems, services, or accounts are now reachable that weren't before? A web-shell or a leaked internal credential often reaches an internal service the perimeter hid. Map the reachable surface from the *inside*; that is the part the external recon could not see.
- **Privilege escalation — how far up can you climb?** Can the access you have become *more* access — a normal user to an admin, an app account to the host, a container to its neighbours, read to write? The chained XSS-steals-admin-session and the client-trusted `is_admin` flag are escalations; so is a misconfigured service account whose token the SSRF could fetch.
- **Data reach — what is actually exposed?** Enumerate, but do **not** exfiltrate real user data — this is staging on snapshotted data precisely so you can prove reach without handling production secrets. Show *what* the foothold can read or write (which tables, which buckets, which secrets), in terms of categories and counts, not by dumping content. "This account can read all users' PII and all payment records" is the blast radius; the dump is neither necessary nor permitted.

The output of post-exploitation is the **blast radius**: a clear statement of the maximum damage the chain achieves, expressed as the data, systems, and privileges it reaches. That statement, paired with the reproduction, is what makes the finding land in STAGE 5 — and it is the input to the severity rank in [report-fix-retest.md](report-fix-retest.md). Without it, a critical chain reads on the report like an isolated curiosity and gets deferred.

> The fix for everything you reach belongs to the `aegis` skill (the defense — server-side authorization, parameterized queries, least-privilege credentials, network segmentation) and the `husbandry` skill (landing the change). This stage's job is to *prove the reach*, not to design the containment; hand the containment over by name.

---

## The shared-blind-spot caution: agreement is not evidence

This is where SHIFT 3 bites hardest, and the load-bearing caution of the whole stage. When the design, the code, *and* the attack are produced by agents drawing on the same training distribution, the blind spots are **shared, not independent.** The business-logic gap an agent overlooked while *building* the checkout is the same gap it will overlook while *attacking* it — because the assumption that hid the gap is in the model both times. Same-model attack on same-model defense is **self-testing wearing a disguise.**

The trap has a specific, seductive shape: you run several attack attempts (or several sibling agents), they all fail to find a logic flaw, and you read that concurrence as assurance. It is not. **Agreement is not evidence.** Multiple agents that share a mind agreeing a system is secure proves they share assumptions — not that the system is safe. Concurrence among same-model attempts narrows *carelessness*, not *bias*; the bias is the very thing that hid the hole, and it is identical across the agreers.

This is the direct sibling of the `assay` skill's parallel-agent discipline, where the same rule governs finding test defects: a fleet *widens the net* but a named oracle (a concrete failing input, a violated invariant, a divergent reference) is what *makes the catch trustworthy* — running more same-model agents manufactures plausible-looking agreement at scale, not proof. Here the "oracle" is a **walked exploit or a violated business invariant**: a logic flaw nobody could exploit is not yet a finding, and a system nobody could break is not yet proven secure — it may just be a system nobody attacked from outside the shared blind spot. Treat "several attempts found nothing" as **weak evidence**, the way the `assay` skill treats agent consensus on a finding as weak evidence.

The consequence the decision below enforces: independence has to be *engineered in*, not assumed from running more attempts. And on a high-stakes system (the HEAVY dial in [decision-tree.md](decision-tree.md)), the independence must come from genuinely *outside* the model — a human tester, an external pentest firm, a bug-bounty crowd. The fleet does not, by itself, escape the shared blind spot; say so to the user rather than declaring the internal attack sufficient.

---

## The independence move: attack the assumptions the design made

Independence is not a vibe; it is a concrete pass you run. The move is to make the builder's *assumptions* the explicit target — because the assumption that hid a flaw in the build is invisible to a same-model attack unless you deliberately point at it.

The blind-spot pass, run before you certify this stage:

1. **List the assumptions the design likely made.** What did the builder take for granted? "The price always comes from our catalog, not the request body." "Nobody reaches step 4 without passing step 3." "The reset token is unguessable." "This endpoint is internal so it needn't check authorization." "The client wouldn't send a negative number." Each of these is a load-bearing assumption — and each is a place the builder did not test because they didn't see it as a question.
2. **Attack each assumption directly.** Send the price in the body. POST step 4 cold. Guess the token. Hit the "internal" endpoint from outside. Send the negative number. You are not searching the input space at random; you are violating named premises one by one.
3. **Vary the attacker persona deliberately.** Run the attempts from genuinely *different* starting points — an unauthenticated outsider, a low-privilege insider, a user who owns a *neighbouring* resource — rather than re-running the same approach and reading the repetition as thoroughness. Different starting assumptions surface different gaps; the same starting assumption run five times surfaces the same gap five times (or misses it five times).
4. **For high stakes, name the residual and escalate.** When the dial is HEAVY, record explicitly that the internal agent attack shares the builder's blind spots and that a genuinely independent (human) tester is required, and route that to the user — do not let the internal pass stand in for the independent one. This is the SHIFT 3 escalation in [agent-era-shifts.md](agent-era-shifts.md) and the spectrum's FALLBACK in [decision-tree.md](decision-tree.md).

This pass is what converts "I attacked it and found nothing" from a shared-blind-spot null result into a real, angled attack — or surfaces the chain the happy-path attack would have missed.

---

## The decision: have I shown impact and taken an independent angle, or re-run my own assumptions?

The gate question for this stage, stated as the fork that decides whether `chained-and-impact-shown` is honestly clear:

- **PREDICATE:** for the confirmed findings, have I (a) tried to **chain** them and walked the chains that reach further, (b) attacked the system's **business invariants**, not just its inputs, (c) shown **true impact** — the blast radius via lateral movement / privilege escalation / data reach — for the chains that landed, and (d) run a deliberate **independent-angle / blind-spot pass** against the assumptions the design made, rather than re-running my own first instinct?

- **DEFAULT** when any one of those four is missing: **the stage is not done — go do the missing one.** This is the conservative call by design, because the asymmetry is steep: an over-thorough chain hunt costs you some time; a missed chain ships a critical hole scored as three harmless lows. If you have a flat list of confirmed singles and no chain attempt, no logic-abuse attempt, no blast-radius statement, or no independence pass, you have the scanner's output dressed up — exactly what SHIFT 4 says the agent will mistake for a finished attack. Do not certify it.

- **FALLBACK** when you genuinely cannot resolve whether the attack was independent enough — the stakes are high and every angle you took may share the builder's blind spot — **do not certify on the agreement of same-model attempts.** Take the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) one rung: confirm what you *can* walk in staging, then ask the user the sharp question — does this system's stakes (the TREE dial in [decision-tree.md](decision-tree.md)) require a genuinely independent human tester before launch? Record the residual blind-spot risk explicitly and let the user own the disposition. Concurrence among your own attempts is not the answer to this question; the user, and on HEAVY systems an outside tester, is.

The trap this fork kills is the one SHIFT 3 and SHIFT 4 name together: **an agent re-running its own assumptions, finding nothing, and reporting "secure."** That is not an attack — it is the build's blind spot, re-confirmed from the inside, presented as a result.

---

## What leaves this stage

A set of **chains and impact statements**, each one ready for STAGE 5 ([report-fix-retest.md](report-fix-retest.md)):

- the confirmed singles, **plus** the chains that compose them, each chain walked end-to-end in staging (or walked-to-step-N with the remainder reasoned and flagged);
- for every logic-abuse finding, the **invariant it violated** and the sequence of legitimate requests that violated it;
- for every chain that landed, a **blast-radius statement** — the data, systems, and privileges actually reached, in categories and counts, never exfiltrated content;
- the **severity of the *outcome*** the chain reaches (low + low = critical, scored by the end state, not the links), feeding the rank in [report-fix-retest.md](report-fix-retest.md);
- an explicit **residual note** on independence: for high-stakes systems, that the internal agent attack shares the builder's blind spots and an independent (human) tester is still required.

Hand each finding's *defense* to the `aegis` skill and its *change* to the `husbandry` skill in STAGE 5; this stage's deliverable is the proven reach and the angled attack, not the fix.

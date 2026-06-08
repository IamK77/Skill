# Agent-Era Shifts in Adversarial Validation

This is the heart of `gungnir` — the seven ways attacking a system to prove its defenses changes once an agent (or a fleet of them) does the attacking: runs the recon, the scanner, the exploit, and a human-in-the-loop sets the scope, confirms the authorization, and owns every finding. It is opened at **STAGE 0 (Scope)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The classic offensive-security canon — scope and authorize first, recon before you strike, confirm exploitability rather than trust a scanner, chain small flaws, report and re-test — is all still correct; it was written for testers who carried an adversary's creativity, a felt sense of *whose system this is*, and the stubbornness to keep probing past the first wall. None of those are guaranteed in an agent. This reference re-aims each practice for an attacker that **can run the real tools, shares the blind spots of whoever built the target, mistakes a clean scan for a secure system, gives up at the happy path, and feels no instinct about authorization.** The other references teach you *how* to do each piece — [scope-and-authorization.md](scope-and-authorization.md), [recon-and-enumeration.md](recon-and-enumeration.md), [exploitation-by-class.md](exploitation-by-class.md), [chaining-and-impact.md](chaining-and-impact.md), [report-fix-retest.md](report-fix-retest.md), [tools-and-practice.md](tools-and-practice.md). This one names *what is different about the work now*, and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you send a single packet

> **Confirm this target is yours to attack — then ask of every "secure" claim: "have I actually broken it, or did a scanner just not find the known pattern?"** A defense is proven only by a real attack; a clean scan, a green test, a passing checklist are all the *absence of a found problem*, not the presence of security. And the agent now holds a real weapon — it can run `nmap`, `sqlmap`, an intercepting proxy — which makes the *first* question, authorization, non-negotiable: a tool that finds a hole can point at the wrong target, and the agent feels nothing about whose system it is. The whole job of this skill is to move "is it secure?" from "the scan was clean" to "I attacked it, under authorization, and here is what broke." **A defense is proven only by a real, authorized attack — and you attack only what you own or are explicitly permitted to.** Everything below is a consequence of that.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the tester had adversarial creativity, stubbornness, and a felt sense of scope.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to build into the testing process instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent attacking an authorized system on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## SHIFT 1 — A clean scan is not proof → only a real attack proves a defense

> **The root shift. If you internalize only one card, internalize this one.** Gates: [`scanned-and-enumerated`](#gate-map), [`exploited-not-just-scanned`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A security tester knew in their bones that running a scanner was the *start* of the work, not the end — the scanner produced leads, and the job was to go confirm them by actually breaking in, and to find the things the scanner never could. "We ran a scan and it was clean" was never, to a real tester, the same sentence as "it's secure." |
| **WHAT CHANGED IN THE AGENT ERA** | The agent equates a **clean result with done**, and a scanner's empty output is the cleanest-looking result there is. Running a tool and reporting "no vulnerabilities found" is the cheapest path to a green-looking conclusion, and the agent has no felt knowledge that the scanner only checks *known patterns* and proves nothing about exploitability or about the holes outside its rule set. This **takes "a scan is a lead, not a verdict" from a tester's reflex to a thing that must be enforced**, because the agent will stop at the scan and call the system secure. |
| **THE DESIGN CONSEQUENCE** | Scanning and exploitation are separated into distinct gates, and the *exploit* gate is the one that proves anything. The scan stage produces a candidate list explicitly framed as suspects, not findings; the exploit stage requires each candidate to be actually exploited (or proven exploitable with a clear reproduction) and the false positives discarded. "Secure" is never a clean scan; it is "I attacked it and here is what held and what broke." |
| **DO THIS** | Treat every scanner result as a *hypothesis* to confirm by hand. At the exploit stage, actually break the thing — pull the other user's record, get the injection to return data, fire the XSS. Discard the false positives a scanner flagged that you cannot reproduce. And never report "no findings" off a clean scan alone — report what you *attacked* and what survived. |

> Anti-pattern this card kills: **"the scanner came back clean, so it's secure."** The scanner found no *known patterns*; the exploit chain and the logic flaw are precisely what it can't see.

---

## SHIFT 2 — The agent holds a real weapon → authorization is the one absolute gate

> Gate: [`scope-and-authorization-locked`](#gate-map). **This is the safety-critical card; it is never a judgment call.**

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "Get authorization before you test" was a rule a professional tester held as basic ethics and basic legality — attacking a system you don't own is a crime, and a human carried a strong, felt sense of *whose system this is* and a fear of the consequences of getting it wrong. The scope document was a formalization of an instinct already there. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent can now *actually run the attack* — point `nmap`, `sqlmap`, an exploit framework at a target — which is exactly what makes adversarial validation cheap and continuous, and exactly what makes a mistake dangerous. And the agent has **no felt sense of ownership**: it cannot tell, by instinct, your staging server from a third party's production, and a tool that finds a vulnerability is the same tool whether it's aimed at an authorized target or an out-of-scope one. This **takes authorization from an ethical reflex to a hard, machine-checked precondition**, because the actor wielding the weapon has no conscience about where it points. |
| **THE DESIGN CONSEQUENCE** | Authorization is the **first gate and an absolute one** — not sized to risk, not a coin-flip, not waived for "it's probably ours." The target must be a system the user *owns* or is *explicitly, in writing, authorized to test*, confirmed out loud with the user; the scope pins in-bounds vs out-of-bounds (third parties and dependencies you don't own are off-limits, period); a snapshotted staging environment, never prod with real data; and the cloud provider's test policy honored. If authorization cannot be confirmed, the run **stops** — no recon, no scan, nothing. |
| **DO THIS** | At Scope, before any packet: get the user to confirm, explicitly, that this target is theirs or authorized in writing. Write the in-scope list and the out-of-scope list (especially the third-party services you must *not* touch). Point the tools only at the authorized scope. If you cannot confirm authorization, do not proceed — and say so plainly. This is the one gate with no DEFAULT toward action. |

> Anti-pattern this card kills: **"it's probably fine to test this."** Probably is not authorization. The agent cannot feel the line, so the line must be an explicit, confirmed, written gate.

---

## SHIFT 3 — The agent shares the defender's blind spots → take independent angles

> Gate: [`chained-and-impact-shown`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | It was understood that you "can't test your own work" well — the author's assumptions blind the author's testing — which is why independent testers and red teams existed: a fresh human mind brought *different* assumptions and found what the builder's mind had glossed over. The value of independence was the *difference* in perspective. |
| **WHAT CHANGED IN THE AGENT ERA** | When the design, the code, *and* the attack are all done by agents drawing on the same training distribution, the blind spots are **shared, not independent.** An agent attacking a system agents built will overlook the same business-logic gap it overlooked building it, because the assumption that hid the gap is in the model both times. Worse, multiple agent attackers can *agree* a system is secure and be wrong together — **agreement is not evidence** when the agreers share a mind. This **takes "independent testing is better" from a nice-to-have to a structural requirement**, because same-model attack and defense is self-testing wearing a disguise. |
| **THE DESIGN CONSEQUENCE** | Independence has to be *engineered in*, not assumed from running more agents. Deliberately vary the angle — different attacker personas, different starting assumptions, an explicit "what would the builder have assumed, and how do I violate that?" pass — and treat consensus among same-model attackers as weak evidence, not strong. On a high-stakes system, the independence must come from genuinely outside the model: a human tester, an external pentest firm, a bug-bounty crowd. The fleet widens the search; it does not, by itself, escape the shared blind spot. |
| **DO THIS** | When attacking a system you (or sibling agents) built, run an explicit blind-spot pass: list the assumptions the design likely made and attack *those* directly. Vary attacker perspective deliberately rather than re-running the same approach. Do not treat "several attempts found nothing" as "secure" — that may be the shared blind spot, not the absence of holes. For high stakes, escalate to a genuinely independent (human) tester and say so. |

> Anti-pattern this card kills: **agents agreeing a system is secure.** Shared training is shared blindness; concurrence among same-model attackers proves they share assumptions, not that the system is safe.

---

## SHIFT 4 — The agent stops at the scanner → the creative attack is the point

> Gates: [`owasp-classes-attacked`](#gate-map), [`chained-and-impact-shown`](#gate-map), [`exploited-not-just-scanned`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | The defining skill of a good pentester was *creativity* — chaining a trivial info leak and a weak reset into account takeover, spotting that the discount logic could be driven negative, intuiting that two harmless-looking behaviors combine into one real exploit. Tools handled the rote; the human did the part that mattered, the lateral, inventive, business-logic attack a scanner can't conceive. |
| **WHAT CHANGED IN THE AGENT ERA** | The creative, chaining, business-logic-abusing attack is exactly what the agent is **weakest** at and most likely to skip — it runs the tool, gets a list (or an empty result), and stops, because the inventive part has no obvious procedure and yields no clean green. Business-logic flaws are invisible to every scanner *and* to an agent that doesn't model the *intent* of the system it's attacking. This **takes the chain-and-abuse work from the tester's core craft to the thing that most needs forcing**, because the agent's default is to mistake "the scanner finished" for "the attack is done." |
| **THE DESIGN CONSEQUENCE** | The exploit and chain stages are gated *separately from* the scan, and demand the work tools can't do: confirm each finding by real exploitation; then chain small flaws into a real attack, abuse the business logic (test the *intent* — can a price go negative, can a step be skipped, can a state be reached out of order), and post-exploit to show true impact (lateral movement, privilege escalation, what data is reachable). A "low + low" that chains to "critical" is the signature of work the scanner missed. |
| **DO THIS** | After scanning, *attack*: confirm the candidates by hand, then deliberately try to chain them. Walk the OWASP Top 10 hands-on (the IDOR by swapping IDs, the injection via `sqlmap` on a reacting parameter — [exploitation-by-class.md](exploitation-by-class.md)). Model the business rules and try to break them, not just the inputs. If you got in, show how far you can go. Never let "the scan is done" stand in for "the attack is done." |

> Anti-pattern this card kills: **running the tool and stopping.** The scanner is the rote floor; the chain, the logic abuse, and the impact are the whole value — and the part only a real attacker (creative, persistent) produces.

---

## SHIFT 5 — The agent attacks the happy path → be persistent and assume input is trusted

> Gates: [`attack-surface-mapped`](#gate-map), [`owasp-classes-attacked`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A real attacker was *persistent and contrarian* — they fed every input the unexpected, poked the paths nobody linked to, tried again from another angle when the first failed, and operated from the assumption that the app would foolishly trust whatever they sent. Stubbornness and a willingness to do the weird thing were the job. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent's default is the **cooperative** path — it tends to use a system the way it's meant to be used, send the inputs the form expects, and accept the first "access denied" as a closed door. The attacker's stance — *assume the app trusts my input, send it garbage, find the door nobody linked, keep going past the first wall* — is the opposite of the agent's helpful, happy-path instinct. This **takes adversarial persistence from a tester's temperament to a discipline that must be prompted**, because the agent will otherwise validate that the front door is locked and never check the windows. |
| **THE DESIGN CONSEQUENCE** | The recon and exploit stages force the *un*-cooperative moves: enumerate the surface that *isn't* linked (the forgotten `/admin`, the stale API — content discovery, not just the sitemap), and at every input point feed the unexpected (the single quote, the other user's ID, the script tag, the over-long value, the skipped step) from the explicit assumption that input is trusted until proven otherwise. The mindset is named and required, not left to a temperament the agent lacks. |
| **DO THIS** | Map the *hidden* surface, not just what the UI shows ([recon-and-enumeration.md](recon-and-enumeration.md)). At every input, send what the developer didn't expect, working from "this app will trust whatever I give it." When something blocks you, try another angle rather than concluding it's safe — a single failed attempt is not a clean bill. Persistence and the unexpected input are the job. |

> Anti-pattern this card kills: **testing the system the way it's meant to be used.** That's functional testing; the attack is in the unexpected input and the unlinked door.

---

## SHIFT 6 — The agent stops at the report → close the loop, then re-test

> Gate: [`findings-fixed-and-retested`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Everyone knew the pentest report was the *means*, not the end — the point was to fix the holes and confirm they were closed. A report that produced no fixes was a failure of the engagement, and a tester (and the team) felt the report was worthless if it sat in a drawer. |
| **WHAT CHANGED IN THE AGENT ERA** | Producing the report turns the task green — the findings are documented, the deliverable exists — so the agent's reward arrives *before* anything is actually fixed or re-tested. Driving each finding to a verified fix is extra work with no further green, so the agent's default is to hand over a report and stop. And a fix it *does* make, it will report as done without re-attacking — the same whack-a-mole-to-green the suite warns of, here leaving the hole possibly still open. This **takes "the value is the closed loop" from a known truth to a thing the process must force.** |
| **THE DESIGN CONSEQUENCE** | The final stage is the *loop*, not the report: every confirmed finding is ranked by severity, the fix is driven (handed to the `aegis` skill for the defense and the `husbandry` skill for the change), and the hole is **re-attacked to verify it is actually closed** — a fix never re-tested is a hope. A report with nothing fixed counts as not done; a fix with no re-test counts as not done. |
| **DO THIS** | For each confirmed finding: write a clear reproduction, rank by impact × exploitability, route the fix to `aegis`/`husbandry`, and then **attack it again** to confirm it's closed (and that you didn't just move the symptom). Track findings to verified closure, not to "reported." The deliverable is a *closed* hole, not a documented one. |

> Anti-pattern this card kills: **the report in the drawer.** Documentation is not remediation; an un-fixed finding and an un-re-tested fix are both still open.

---

## SHIFT 7 — One-and-done goes stale → make validation continuous

> Gate: [`validation-made-continuous`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A pre-launch pentest was a major, periodic event — expensive, scheduled, a milestone — and between them a team relied on judgment and the occasional re-test. The cadence was coarse because each test was costly human effort. |
| **WHAT CHANGED IN THE AGENT ERA** | New vulnerabilities are disclosed **every day** and every change can open a hole, so a one-time pre-launch attack is stale within weeks — *and* the agent can now run the automated layers cheaply and continuously, which makes frequent self-attack actually feasible for the first time. The risk is treating the launch pentest as the finish line; the opportunity is wiring adversarial validation into the ongoing loop. This **takes "test it before launch" from a one-shot milestone to a continuous practice the agent is well-suited to sustain.** |
| **THE DESIGN CONSEQUENCE** | The pre-launch attack is the *capstone*, not the only event. It layers on automated scanning every commit (the `aegis`/`flightline` security gates), re-attack after every major change, and — on the highest-stakes systems — ongoing independent testing or a standing bug-bounty program. The deep, creative, human-or-independent attack happens at the big milestones; the cheap automated layer runs constantly; and the shared-blind-spot rule (SHIFT 3) means the continuous agent layer never fully substitutes for periodic independent eyes. |
| **DO THIS** | Wire the automated security scans into CI so every commit is attacked at the known-pattern level (`aegis`/`flightline`). Schedule a re-attack after major changes and a periodic deeper test. For high stakes, set up independent testing or a bug bounty. Treat the pre-launch pentest as one (important) point on a continuous curve, never the end of security work. |

> Anti-pattern this card kills: **"we pentested it before launch."** That result is stale within weeks; security validation is a continuous curve, not a one-time gate.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.*

Read down this table at the corresponding GATE: it tells you which shift you are actually enforcing and what "done" means for a system attacked by an agent. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent-era framing |
|---|---|---|---|
| scope | `scope-and-authorization-locked` | **SHIFT 2** | Owned/written-authorized target confirmed out loud; in-scope vs out-of-scope pinned; snapshotted staging; provider policy honored — the one absolute gate, because the agent holds a real weapon and feels nothing about where it points. |
| recon | `attack-surface-mapped` | **SHIFT 5**, SHIFT 1 | The *hidden* surface mapped (unlinked paths, stale APIs), not just the UI — because the agent's default is the cooperative, happy-path view. |
| scan | `scanned-and-enumerated` | **SHIFT 1** | The automated layer run to produce a *candidate* list, explicitly framed as suspects — because the agent mistakes a clean scan for a secure system. |
| exploit | `exploited-not-just-scanned` | **SHIFT 1**, SHIFT 4 | Each candidate actually exploited (or proven exploitable), false positives discarded — because a scan proves nothing about exploitability. |
| exploit | `owasp-classes-attacked` | **SHIFT 4**, SHIFT 5 | The OWASP Top 10 worked hands-on (IDOR by swapping IDs, injection via sqlmap, XSS probe…) from the assume-input-trusted stance — the creative/persistent attack the agent skips. |
| chain | `chained-and-impact-shown` | **SHIFT 4**, SHIFT 3 | Small flaws chained into a real attack, business logic abused, post-exploitation showing true impact — and independent angles taken, because agents share the defender's blind spots and agreement isn't evidence. |
| report | `findings-fixed-and-retested` | **SHIFT 6** | The closed loop: rank → fix (via `aegis`/`husbandry`) → re-attack to verify closed — because producing the report turns the task green before anything is fixed. |
| report | `validation-made-continuous` | **SHIFT 7** | Pre-launch attack as capstone on continuous scanning + re-attack-after-change + (high stakes) independent testing/bug bounty — because one-and-done is stale within weeks. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this finding real, is this attack in scope, is this defense actually proven — climb one rung at a time rather than guessing silently. **The one exception: authorization (SHIFT 2) has no ladder and no DEFAULT toward action — if you cannot confirm the target is authorized, you stop.**

```
for a clearly in-scope, low-impact, reversible test step, take the DEFAULT and attack
   → wrap it: work in the snapshotted staging environment so any damage is recoverable
      → confirm it: actually exploit the candidate and reproduce it, rather than trusting the scanner
         → ask the user one sharp question — they hold authority on scope, on what is authorized,
           on the disposition of a finding, and on whether a high-stakes system needs a genuinely
           independent (human) tester (the SHIFT 2 scope call and the SHIFT 3 independence call bottom out here)
            → if still unresolved on anything touching SCOPE or AUTHORIZATION, STOP — never proceed on
              an unauthorized or out-of-scope target; for everything else, default to the more conservative,
              recoverable, staging-only action and record the residual for the user.
```

The asymmetry that governs the rest of the ladder: **an over-cautious attack step costs you a little coverage; a clean-scan-mistaken-for-secure ships a live hole, and an unauthorized attack is a line you do not cross at all.** When a non-authorization call is a toss-up, err toward confirming by real exploitation in staging. See [decision-tree.md](decision-tree.md) for the authorization gate, the validation spectrum, and how deep to attack by risk; [scope-and-authorization.md](scope-and-authorization.md) for the gate itself; and the `aegis` skill for the defenses this attack exists to prove.

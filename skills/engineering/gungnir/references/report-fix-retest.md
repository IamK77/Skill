# Report, Fix & Re-test — Close the Loop, Then Keep It Closed

This reference is the depth behind **STAGE 5 — Report** of the [../SKILL.md](../SKILL.md) flight plan, the stage that governs everything *after* a real exploit is confirmed: turning a proven hole into a ranked finding, driving it to a verified fix, re-attacking to prove the fix actually closed it, and then making the whole attack continuous rather than a one-time pre-launch event. In the human era the closed loop carried felt incentives: a report that produced no fixes embarrassed the tester who wrote it, an un-re-tested fix was a professional risk the team carried, and a single pre-launch pentest going stale was something a security-minded engineer *worried* about between engagements. None of that survives contact with an agent. The agent's reward arrives the instant the deliverable exists — the findings are documented, the report renders, the task turns green — which lands the reward *before* a single hole is closed, and well before anyone re-attacks. This file is the *how*: how to write a finding that drives a fix, how to rank and triage a findings queue like a defect queue, how to hand the fix to the right skill and then re-attack it, and how to layer the pre-launch attack onto a continuous curve. For the *why* — why a green-optimizing attacker stops at the report and treats one pentest as forever — read **SHIFT 6** (the agent stops at the report) and **SHIFT 7** (one-and-done goes stale) in [agent-era-shifts.md](agent-era-shifts.md), the two shifts this stage enforces.

The fact that overrides every default here is inherited from [decision-tree.md](decision-tree.md):

> **A defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly authorized to test.** A finding "reported" but never fixed is not progress; it is a known hole left open with a paper trail. A finding "fixed" but never re-attacked is not a closed hole; it is a hope wearing a green badge. The closed loop — rank, fix, re-attack to verify — is the only thing in this whole skill that creates value, and the agent, rewarded by the deliverable in front of it, will book the report itself as the win.

The two checks this stage gates are `findings-fixed-and-retested` and `validation-made-continuous`. Everything below is the depth behind those two ids.

---

## Contents

- [The report alone is worth nothing](#the-report-alone-is-worth-nothing)
- [`findings-fixed-and-retested` — rank, fix, re-attack to verify closed](#findings-fixed-and-retested--rank-fix-re-attack-to-verify-closed)
  - [A finding that drives a fix](#a-finding-that-drives-a-fix)
  - [Rank by severity: impact × exploitability](#rank-by-severity-impact--exploitability)
  - [The severity triage matrix](#the-severity-triage-matrix)
  - [The deployment-vs-product axis — when you didn't write what you're attacking](#the-deployment-vs-product-axis--when-you-didnt-write-what-youre-attacking)
  - [Drive the fix — gungnir finds, `aegis` and `husbandry` fix](#drive-the-fix--gungnir-finds-aegis-and-husbandry-fix)
  - [Re-test: a fix never re-attacked is a hope](#re-test-a-fix-never-re-attacked-is-a-hope)
  - [The "is this finding actually closed" bar](#the-is-this-finding-actually-closed-bar)
- [`validation-made-continuous` — the pre-launch attack is a capstone, not the end](#validation-made-continuous--the-pre-launch-attack-is-a-capstone-not-the-end)
  - [Why one-and-done goes stale](#why-one-and-done-goes-stale)
  - [The continuous-validation layers](#the-continuous-validation-layers)
  - [Wiring it in — by whom and on what trigger](#wiring-it-in--by-whom-and-on-what-trigger)
- [What "STAGE 5 done" actually means](#what-stage-5-done-actually-means)

---

## The report alone is worth nothing

A penetration test report, sitting in a drawer with nothing fixed, is the exact equivalent of never having run the test — except it now also documents, for anyone who finds it, precisely how to break in. The deliverable is not the document; **the deliverable is a closed hole.** The report is a tool for getting holes closed, and it is judged only by whether the holes it names actually get closed and stay closed.

This reframes the whole stage. The agent's instinct — produce the report, mark the task done — optimizes the one artifact that creates no value by itself. Everything in `findings-fixed-and-retested` exists to push past that instinct to the part that does: the fix, and the re-attack that proves the fix.

So a good report exists to *drive* the loop, and a good finding within it is written for that purpose, not for completeness. The audience is the person (or skill) who has to fix it and the person who has to decide whether it's worth fixing now — so the finding must make both the *fix direction* and the *severity* legible at a glance.

---

## `findings-fixed-and-retested` — rank, fix, re-attack to verify closed

This check enforces the full loop for every confirmed finding: it is ranked, the fix is driven to completion, and the hole is **re-attacked** to prove it is actually closed. A report with nothing fixed counts as **not done**. A fix with no re-test counts as **not done**. Both halves are load-bearing.

A note on what enters this stage at all: only *confirmed* findings — things you actually exploited or reproduced with a clear proof, per the scan-vs-exploit / confirm-vs-false-positive call in [decision-tree.md](decision-tree.md) and the class-by-class work in [exploitation-by-class.md](exploitation-by-class.md). Scanner candidates you could not reproduce are *not* findings; they are noted as suspected-unconfirmed and never reported as confirmed. The loop below operates on the proven set.

### A finding that drives a fix

Each confirmed finding records the few things a fixer and a triager actually need:

- **A clear reproduction.** The exact steps, the input, the request, the precondition (which account, which state) to make the vulnerability fire again — the offensive twin of the *reproduce-with-a-failing-test-first* discipline the `husbandry` and `assay` skills enforce for defects. If you cannot write down how to reproduce it, you have not confirmed it; you have observed something you don't yet understand.
- **Severity** — impact × exploitability (the matrix below). CVSS is one common scheme for expressing this as a score; it is a useful shared vocabulary, not a substitute for the judgment of *how bad this is for this system*. Use it to communicate, not to outsource the call.
- **The affected component** — the precise endpoint, parameter, service, or code path, so the fix lands in one known place and the re-test knows exactly where to aim.
- **The remediation direction** — *what kind* of fix closes it (parameterize the query, enforce server-side authorization, rotate the leaked secret), pointing at the defense, not prescribing the implementation. gungnir says *what is broken and roughly what class of fix closes it*; the defensive skills own *how*.

> The agent failure mode this guards against (SHIFT 6): an agent will produce a list of findings — the deliverable exists, the task looks green — and stop, with nothing in the finding that actually compels or directs a fix. A finding written as a closed-loop driver, with reproduction + severity + component + remediation direction, is the difference between a report that gets acted on and a report in the drawer.

### Rank by severity: impact × exploitability

Not every confirmed finding is equally worth fixing now, and an unranked findings list collapses — in agent hands — to "fix them in the order I found them," which spends the fix budget on whatever surfaced first rather than whatever matters most. Rank by **severity = impact × exploitability**:

- **Impact** — how bad is it if exploited? Full account takeover, reading every user's PII, remote code execution, money moved: high. An info leak of a non-sensitive internal version string: low. This is the blast radius if the hole is used.
- **Exploitability** — how easy is it to actually pull off? Reachable unauthenticated from the internet with a single request: high. Requires an already-privileged account plus a race plus physical proximity: low. This is the likelihood the hole gets used.

The two multiply: a high-impact, low-exploitability finding and a low-impact, high-exploitability finding can land in the same middle band, and the genuinely urgent finding is high on *both*. **CVSS** formalizes exactly this decomposition (attack vector, complexity, privileges required, impact on confidentiality/integrity/availability) into a 0–10 score and severity label — use it where a shared, comparable number helps, especially when reporting to the user or feeding a queue, but the score is the *output* of the impact × exploitability judgment, not a replacement for making it.

### The severity triage matrix

Score each confirmed finding on both axes and let the cell decide urgency — the offensive counterpart of the severity × priority matrix the `husbandry` skill's defect-management discipline uses, so two agents triaging the same findings list reach the same fix order.

| | **Exploitability: easy** (unauth, one request, reliable) | **Exploitability: moderate** (needs an account / specific state) | **Exploitability: hard** (high privilege + race / narrow window) |
|---|---|---|---|
| **Impact: critical** (RCE, full data exposure, account takeover, money) | **Drop-everything.** Fix before launch / before anything else; this is a live breach waiting to happen. | Fix this cycle — a determined attacker clears the bar; do not ship on it. | Fix on schedule, but **do not dismiss** — chaining (see [chaining-and-impact.md](chaining-and-impact.md)) routinely raises exploitability of a critical-impact hole. |
| **Impact: major** (one user's data, privilege escalation within a tier) | Fix this cycle. | Fix on the normal schedule by rank. | Schedule; re-rank if a chain makes it easier. |
| **Impact: minor** (non-sensitive info leak, low-value misconfig) | Fix cheaply now if the fix is small and the exposure is public. | Batch with related hardening. | Lowest rank — log it; an explicit accept-the-risk is a user-owned call. |

- **PREDICATE:** for the finding in hand, what is its impact (blast radius if exploited) and its exploitability (how reachable / reliable the exploit is)?
- **DEFAULT** on a coin-flip between two cells: size to the **higher** cell for anything touching data, money, authentication, or availability — under-ranking a hole that turns out to expose regulated data is the catastrophic error; over-ranking a cosmetic leak costs a few minutes of fix budget. And take chaining into account: a "minor + minor" that [chaining-and-impact.md](chaining-and-impact.md) showed combining into account takeover is ranked at the *chain's* severity, not either part's.
- **FALLBACK** when you cannot rank because the business impact is genuinely unknown (you can't tell whether the exposed field is sensitive, or how reachable the path is in production): do **not** silently assign a rank and move on — surface the technical finding and the open severity question to the user, the same way the depth-by-risk TREE in [decision-tree.md](decision-tree.md) hands the data-sensitivity call back to the user. Severity that depends on business context is exactly the input the agent is not equipped to supply alone.

### The deployment-vs-product axis — when you didn't write what you're attacking

The impact × exploitability matrix ranks *how bad* a finding is. A second, orthogonal question decides *whose finding it is* — and it only arises when the target is your own **deployment of software you did not author** (an OSS product, a vendored service, a component you operate). STAGE 0 clears on owning or being authorized to test *this deployment*; that is not the same as owning *the code*. So a confirmed finding splits two ways:

- **Deployment-owned** — it exists because of *this instance's* config, secrets, network exposure, or version: no auth enabled, bound to `0.0.0.0`, a default DB password, a stale build. You can close it yourself, and another operator running the same software may already have closed it. Real, but it is your posture, not the product's.
- **Product-owned** — it lives in the code and architecture anyone running the software inherits, and **survives a correctly-hardened deployment**: auth on, least exposure, strong secrets, current version, and the flaw is *still there*. No operator can close it; only an upstream change (or your own fork) can.

The product-owned finding is the higher-value one, and it is precisely the one a purely adversarial pass buries — because the adversary's job is to get in by *any* path, so it reports "the default install fell over" with the same triumph as "this is broken no matter how you run it." The operator's lens is what separates them, and the cheapest way to apply it is mechanical: **harden the deployment, then attack again.** What dies when you turn auth on and bind to loopback was deployment-owned; what is still standing is the product's, and that is the finding worth a maintainer's time.

- **PREDICATE:** with the deployment hardened to its documented secure configuration, does the finding still reproduce?
- **DEFAULT** on a coin-flip: re-test it against a hardened instance before you rank it — the answer reclassifies the finding and usually changes who you send it to. Treat "survives hardening" as a headline of the report, not a footnote.
- **FALLBACK** when you cannot stand up a hardened instance: reason it from the code and the defaults, tag it *product-owned / unverified-against-hardening*, and say so — never report a config fault and a code fault as the same "the product is broken."

### Drive the fix — gungnir finds, `aegis` and `husbandry` fix

gungnir's job ends at a *proven, ranked, reproducible* finding. It does **not** own the fix — that is a deliberate division of labor, and keeping it clean is what makes the spear a spear:

- Hand the **defense** to the `aegis` skill. `aegis` is the shield this whole skill exists to prove; the actual control that closes the class of hole — parameterized queries for injection, server-side authorization for IDOR, secure session handling, correct configuration — is `aegis`'s domain. gungnir tells `aegis` *which defense failed and where*; `aegis` decides and builds the defense. Do not re-derive the fix here in depth.
- Hand the **change** to the `husbandry` skill. The mechanics of taking a fix to verified closure — triage as a defect queue, reproduce-before-you-fix, drive to the *root cause* rather than the crash site, leave a regression test behind — are `husbandry`'s defect-management discipline. A finding that gets a symptom patched rather than its root cause fixed will re-open under a slightly different request, exactly as `husbandry` warns; route the finding into that discipline rather than improvising a one-off patch.

Practically, treat the confirmed findings as a **defect queue**: rank by the matrix above, work highest-severity first (never first-found-first), and record an explicit, user-owned *accept-the-risk* decision for any finding deliberately not fixed — with the reason and the condition that would reopen it — exactly as `husbandry` records a WON'T-FIX. An un-actioned finding rotting at the bottom of the list is indistinguishable from a hole nobody noticed.

**When the finding is product-owned and you do not maintain the code, the loop changes shape.** You cannot hand it to `aegis`/`husbandry` to fix — there is no branch of yours to fix. The closed loop becomes **coordinated disclosure**: report it privately to the maintainer (a `SECURITY.md` channel, GitHub private vulnerability reporting, or a security contact — never a public issue for a live, exploitable hole), give them a reasonable window before any public writeup, offer a patch if you can, and **re-test against their fixed release** rather than a local branch. The deployment-owned half you still close yourself, the same day, via the normal `aegis`/`husbandry` handoff. For the product-owned half the disposition is "disclosed, awaiting upstream fix," tracked until the patched version ships and you have re-attacked it — the loop is closed by *their* release, not your report.

> The agent failure mode this guards against (SHIFT 6): producing the report turns the task green, so the agent's reward arrives before anything is fixed, and driving each finding to a real fix is extra work with no further green. The division of labor makes the fix a *handoff with an owner* — `aegis` for the defense, `husbandry` for the change — so a finding is not "done" when written, only when its owner has closed it and gungnir has re-attacked it.

### Re-test: a fix never re-attacked is a hope

A fix you have not re-attacked is not a closed hole — it is a *belief* that the hole is closed, and a belief is exactly what an attacker disproves. Re-testing is the same fail-first / verify discipline the whole suite runs on, pointed at the fix: you saw the attack succeed *before* the fix; you must see the *same attack fail* after it.

The sequence is fixed and mirrors `husbandry`'s reproduce → red → fix → green loop, in offensive terms:

```
1. Before the fix, you have a reproduction that SUCCEEDS — the exploit works. (You proved this at STAGE 3.)
2. The fix is applied (by aegis / husbandry).
3. Re-run the EXACT original exploit -> it MUST now FAIL.
      If it still succeeds, the fix did not close the hole. Not done. Back to the fixer.
4. Re-attack the AREA, not just the one payload:
      - try the obvious variants (a different injection technique, another user's id, an
        encoded payload) — confirm the fix closed the CLASS, not just the one string;
      - confirm the symptom didn't merely MOVE (the IDOR blocked on /api/v1 but live on
        /api/v2; the validation added at one entry point but not the sibling endpoint);
      - re-run the relevant scan and the chain (chaining-and-impact.md) that used this hole —
        a closed link can break a whole chain, or expose that the chain still completes another way.
5. Only when the original exploit and its near variants all FAIL is the finding CLOSED.
```

Two failure shapes this catches, both invisible from a green dashboard:

- **The fix that didn't close the hole.** The fixer changed code, the symptom you happened to report stopped, but the actual exploit still works with a trivially different input. Re-running the *exact* original attack is the floor; re-running its variants is what proves the class is shut.
- **The fix that moved the symptom.** The hole is closed at the one endpoint you reported and still open at the three sibling endpoints with the same flaw, or the input validation now rejects your payload but the underlying unsafe sink is still reachable another way. Re-attacking the *area and the chain*, not just the single payload, is what surfaces a moved symptom — the security twin of `husbandry`'s "the crash site is not the cause."

### The "is this finding actually closed" bar

Before marking any finding closed, the re-test must clear this bar:

- **PREDICATE:** when you re-run the original exploit and its near variants against the affected component, do they now **all fail** — and does the underlying *class* of flaw no longer fire, rather than just the one payload you first reported?
- **DEFAULT** on a coin-flip about whether it's truly closed: assume it is **not** and attack once more — try one more variant, one more sibling endpoint, re-run the chain. The asymmetry is stark: another re-attack costs minutes; a finding marked closed while still live ships a known hole wearing a green badge, and it is *worse* than an unknown hole because everyone now believes it's gone.
- **FALLBACK** when you cannot fully re-test the fix in the safe environment (the fix only takes effect in a configuration staging can't reproduce, or the original exploit depended on production-only state): re-test at the **highest fidelity you safely can** in the snapshotted staging mirror, mark the finding *fix-applied / re-test-incomplete* with exactly what could not be verified, and surface that residual to the user — never silently upgrade "fix applied" to "hole closed." A fix you watched fail to re-exploit is closed; a fix you merely deployed is not.

> The agent failure mode this guards against (SHIFT 6): an agent that *does* make a fix will report it done without re-attacking — the whack-a-mole-to-green the suite warns of, here leaving the hole possibly still open. The re-test bar turns "the fixer says it's fixed" into "I attacked it again and it held."

---

## `validation-made-continuous` — the pre-launch attack is a capstone, not the end

This check enforces that the pre-launch attack is wired into an ongoing practice rather than treated as a one-time gate. A single attack, however thorough, is a snapshot of one moment; security is a moving target, and the deliverable of this check is a *standing* validation program, not a single clean run.

### Why one-and-done goes stale

A pentest result expires, and fast, for two compounding reasons:

- **New vulnerabilities are disclosed every day.** A dependency that was clean at launch has a published CVE three weeks later; the component you fingerprinted as current is suddenly a known-exploitable version. Nothing in *your* system changed and it is now vulnerable. This is why the version-based, known-CVE layer (`trivy` and the SCA in CI) has to run *continuously*, not once.
- **Every change can open a new hole.** A new endpoint, a refactor of the auth check, a "small" config tweak — each is a fresh chance to introduce exactly the classes you just proved were absent. The attack you ran proves the system was secure against what you tried *at that commit*; the next commit is unproven again.

So a one-time pre-launch attack is stale within weeks. The opportunity the agent era opens (SHIFT 7) is the other side of the same coin: the agent can now run the automated layers cheaply and continuously, which makes frequent self-attack feasible for the first time — the pre-launch pentest becomes the capstone on a continuous curve, not a one-off milestone.

### The continuous-validation layers

The right program runs several layers at once, at different cadences — the validation spectrum from [decision-tree.md](decision-tree.md), now read as a *standing* program. They are additive, not alternatives.

| Layer | Cadence | What it catches | Whose gate |
|---|---|---|---|
| **Automated scanning in CI** (SAST / DAST / SCA, known-CVE deps) | every commit | known patterns, newly-disclosed vulnerable dependencies — the floor | the `aegis` / `flightline` security gates |
| **Re-attack after major change** | per significant change / release | regressions and new holes in changed auth, new endpoints, new data flows | gungnir, triggered by the change |
| **Deep internal self-test** (the full six-stage attack) | periodic / per release milestone | the OWASP-class holes and the chains an agent self-test can reach | gungnir |
| **Independent / professional pentest** | pre-launch + periodic, high stakes | the creative chains and logic flaws the builder's blind spots hid | a genuinely independent (ideally human) tester |
| **Bug bounty / ongoing red team** | continuous, mature high-stakes systems | the long tail, in production, with fresh external eyes | external researchers |

The cheap automated layer runs constantly; the deep creative attack happens at the big milestones; and — critically — the continuous agent layer **never fully substitutes** for periodic independent eyes, because same-model attack and defense share blind spots (the independence requirement from [chaining-and-impact.md](chaining-and-impact.md) and SHIFT 3 in [agent-era-shifts.md](agent-era-shifts.md)). Layering the spectrum is the point; collapsing it to "the agent scans it every commit" re-introduces exactly the shared blind spot the suite warns about.

### Wiring it in — by whom and on what trigger

Making it continuous is concrete work with named owners:

- **Wire the automated security scans into CI** so every commit is attacked at the known-pattern level — this lives in the `aegis` / `flightline` security gates, not as a thing gungnir re-implements per run. gungnir's job is to confirm the gate exists and is enforced, and to feed it the classes this attack proved matter for this system.
- **Schedule a re-attack after every major change.** A new endpoint or an auth refactor triggers a focused gungnir pass over the changed surface — the offensive equivalent of `husbandry` re-running the regression suite after a fix.
- **Schedule a periodic deeper test** even with no change, because the dependency landscape moves underneath a static system.
- **For high-stakes systems, stand up independent testing or a bug-bounty program** — recurring independent eyes the agent layer cannot replace. The depth-by-risk TREE in [decision-tree.md](decision-tree.md) decides when this is required (MEDIUM+ adds an independent pentest before launch; HEAVY adds ongoing independent testing / bug bounty).

A severity / recurrence signal makes the continuous program legible the way `husbandry`'s defect metrics do: a *re-opened* finding (a hole that was closed and came back) is the offensive twin of a rising recurrence rate, and it points at a fix that was symptom-patched rather than root-caused, or a continuous layer with a gap. Watch it; carry a worrying reading to the user via the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear).

> The agent failure mode this guards against (SHIFT 7): "we pentested it before launch" is the trap — the result is stale within weeks, and an agent rewarded by the one completed attack will treat it as the finish line. Wiring the layers in, with owners and triggers, turns the pre-launch attack into one important point on a continuous curve.

---

## What "STAGE 5 done" actually means

The FINAL GATE clears only when both halves are genuinely true, not merely documented:

- **`findings-fixed-and-retested`** — every confirmed finding is ranked by severity (impact × exploitability), its fix is driven to completion (defense via `aegis`, change via `husbandry`, or an explicit user-owned accept-the-risk), and the hole is **re-attacked and proven closed** — the original exploit and its near variants now fail, and the symptom did not merely move. A report with nothing fixed, or a fix with no re-test, does not clear this gate.
- **`validation-made-continuous`** — the pre-launch attack is layered onto a standing program: automated scanning every commit (`aegis` / `flightline`), re-attack after major change, periodic deeper testing, and — at the risk level the TREE demands — ongoing independent testing or a bug bounty. A single one-time attack, however thorough, does not clear this gate.

The thread back to the whole skill: gungnir is the spear that proves the `aegis` shield, and a defense is proven only by a real, authorized attack. The report is where that proof either becomes a closed, continuously-guarded hole — or becomes a document in a drawer that an agent called done. This stage exists to force the former. Find the holes while they are cheap; close them; attack again; keep attacking.

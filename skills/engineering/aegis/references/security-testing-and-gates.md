# Security Testing & Gates — Scan Everything, Then Attack It

This reference is the depth behind **STAGE 4 — Verify** of the [../SKILL.md](../SKILL.md) flight plan, which opens it by name. It is for the agent that must make security *visible as a gate* on the pipeline that builds every commit: which automated scanners to run, how to wire them so they **block** rather than advise, how to walk the OWASP Top 10 as a tested checklist, and where automated scanning runs out — the line past which the only proof is an adversary. The human-era-to-agent-era shift that makes this stage load-bearing: a careful engineer carried a private "wait, could this be abused?" judgment *outside* the test suite, so security testing was a useful supplement to a mind already thinking about misuse. The agent has no such judgment, equates **green with done**, and a vulnerability produces *no red* — so the gate stops being a supplement and becomes the **only** thing standing between an insecure default and production. See [agent-era-shifts.md](agent-era-shifts.md) for *why* — this stage is governed by **SHIFT 6 (a vulnerability ships green → gate it and attack it)**, with **SHIFT 3 (the agent trusts its input)** feeding the vuln-class checklist. This file is the *how*.

The governing fact this stage inherits from [decision-tree.md](decision-tree.md), and the one sentence to keep in front of you the whole way through:

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail. A clean scan is necessary; it is never sufficient.

Use the same decision-fork engine as the rest of the suite: every real choice carries a **PREDICATE** (the question that selects the branch), a **DEFAULT** (what to pick on a coin-flip), and a **FALLBACK** (what to do when you can't answer yet). When a fork stays ambiguous after both, take the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) — the user holds authority over what residual risk is acceptable.

This stage covers two checks, and the whole file is organized around them:

- **`security-testing-gated`** — SAST, DAST, SCA (and fuzzing where input handling is critical) automated into CI as *blocking* gates, retrofit by baseline-and-ratchet, with the gate config itself un-gameable.
- **`vuln-classes-defended`** — the OWASP Top 10 walked as a verification checklist (ASVS as the standard form), each class confirmed *defended and tested*, and the adversarial half handed to the `gungnir` skill.

## Contents

- [Why scanning exists at all: the agent ships green](#why-scanning-exists-at-all-the-agent-ships-green)
- [The four automated scanner types — what each finds and what each misses](#the-four-automated-scanner-types--what-each-finds-and-what-each-misses)
- [`security-testing-gated` — make the scans blocking, or they are decoration](#security-testing-gated--make-the-scans-blocking-or-they-are-decoration)
- [Baseline-and-ratchet: retrofitting gates onto an existing codebase](#baseline-and-ratchet-retrofitting-gates-onto-an-existing-codebase)
- [The gate config is itself a target — put it under review](#the-gate-config-is-itself-a-target--put-it-under-review)
- [`vuln-classes-defended` — ASVS, the Testing Guide, and walking the OWASP Top 10](#vuln-classes-defended--asvs-the-testing-guide-and-walking-the-owasp-top-10)
- [SCAN ≠ PENTEST — the load-bearing point of this stage](#scan--pentest--the-load-bearing-point-of-this-stage)
- [The ship decision: is this security-tested enough?](#the-ship-decision-is-this-security-tested-enough)

---

## Why scanning exists at all: the agent ships green

A functional test asserts *the thing it was told to do happens*. A vulnerability is not a thing that happens — it is a thing that becomes possible. The SQL injection works perfectly for every cooperative input; it is only the *hostile* input, which no functional test sends, that flips it into an exploit. So the entire class of security defects is invisible to the suite that proves the feature works, and an agent that reads green-as-done will ship the hole believing the job is finished. Nothing red ever stopped it.

Security testing is the discipline of building the red light the vulnerability never produces on its own. It does that two ways, and you need both:

- **Automated scanning** runs a battery of tools that know *known dangerous patterns* — the string-built query, the outdated dependency with a published CVE, the missing security header — and turns each match into a blocking failure. This is the body of this file's first check, `security-testing-gated`. It is cheap, fast, runs on every commit, and catches the large fraction of vulnerabilities that are *recognizable patterns*.
- **Adversarial attack** is a creative attacker trying to *break the system* — chaining three small flaws into one exploit, abusing the business logic, finding the authorization gap unique to your domain. No scanner does this; it is the `gungnir` skill's job. This file's second check, `vuln-classes-defended`, ends by handing the adversarial half off explicitly.

The trap the whole stage exists to kill, stated once: **"the scan passed, so we're secure."** A clean scan means the *known patterns* weren't found. The exploit chain and the logic flaw are exactly what a scanner cannot see — and exactly what an attacker looks for first.

---

## The four automated scanner types — what each finds and what each misses

The scanners are **complementary, and none is sufficient.** Each sees the system from one angle and is blind from the others; running one and skipping the rest leaves the gaps that one couldn't see. Know what each is *for*, and — more important for an agent that will treat any green tool as proof — know what each *cannot* find, so you never read a clean SAST run as "no vulnerabilities."

| Scanner | What it is | Sees the system as | Finds (its strength) | Misses (its blind spot) | Where it runs |
|---|---|---|---|---|---|
| **SAST** (static application security testing) | static analysis of the **source code**, no execution | the code, from the inside | insecure *patterns in code* — string-built SQL, `eval`, command concatenation, weak/homemade crypto calls, tainted data reaching a dangerous sink (taint analysis); the injection/XSS defaults the agent writes (SHIFT 3) | runtime and config issues it can't see without running; **high false-positive rate** (flags patterns that are safe in context); cannot see a logic flaw or a real exploit chain. CodeQL, Semgrep, Bandit, gosec, `cargo-audit`'s lint cousins |
| **DAST** (dynamic application security testing) | scans the **running application** from the outside, no source needed | the app as an attacker over the wire sees it | runtime/config issues SAST can't — missing security headers, reachable debug endpoints, a reflected XSS that actually fires, TLS misconfig, default credentials still live; works **black-box** on anything with an endpoint, including third-party services and compiled binaries | needs a running, reachable instance and good crawl coverage; weak on authenticated/deep flows; finds *that* an input is reflected, not *which line* caused it (no source mapping); slow. OWASP ZAP, Burp Suite, Nuclei |
| **SCA** (software composition analysis) | inventories **dependencies** and matches them against vulnerability databases | the supply chain — every library you pulled in | **known-CVE components** (CVE/NVD, OSV/GHSA feeds) — the vulnerable or end-of-life package, transitive ones included; the hallucinated or slop-squatted package an agent reached for; license violations; emits the SBOM | only finds *known, published* CVEs — a zero-day or your own first-party bug is invisible to it; noisy on unreachable/dev-only vulns. `npm`/`pnpm audit`, `pip-audit`, `osv-scanner`, Trivy, Dependabot/Renovate |
| **IAST** (interactive application security testing) | instruments the app and watches from **inside while it runs** (often during the existing test/DAST pass) | the running code from within, with the source context | combines SAST's source visibility with DAST's runtime truth — confirms a flagged path is actually reachable and exploitable, cutting the false positives of pure SAST | needs instrumentation and exercising traffic (test suite or DAST driving it); language/runtime support varies; not a drop-in for every stack. Use it where the stack supports it to *triage* SAST noise, not as a fourth mandatory gate |

**Fuzzing** is a fifth tool, situational rather than universal: it throws large volumes of malformed, random, and boundary input at a component to find crashes, memory-safety bugs, and unhandled-input paths a fixed test set never reaches. Run it **where input handling is critical** — parsers, deserializers, file/protocol decoders, anything taking untrusted bytes, especially in a memory-unsafe language. It finds the input the agent never imagined (SHIFT 3, in its rawest form: the agent writes for the input it expected). `libFuzzer`/AFL++ for native code, property-based fuzzing (`Hypothesis`, `fast-check`, `proptest`) and the language's coverage-guided fuzzers for the rest.

- **PREDICATE for whether to gate fuzzing:** does this system parse or decode untrusted input, or run in a memory-unsafe language at a trust boundary?
- **DEFAULT** on a coin-flip: **add it** for the parser/decoder core and run it on a *schedule* (it's open-ended, not a per-commit gate), seeding the corpus from real inputs; skip it for pure CRUD-over-a-validated-ORM.
- **FALLBACK** when you can't tell which components handle untrusted input: use the [threat-modeling.md](threat-modeling.md) attack-surface map — every entry on it that decodes bytes is a fuzz candidate; fuzz those first.

The one sentence to carry out of this table: **a green light from any single scanner certifies only what that scanner can see.** SAST clean means no *known bad pattern in source*; SCA clean means no *known-CVE dependency*; DAST clean means *the crawl didn't trip a known runtime issue*. None of them says "secure," and an agent must never collapse "this tool is green" into "this system is safe."

---

## `security-testing-gated` — make the scans blocking, or they are decoration

A scanner that *reports* is not a gate; a scanner that *blocks the merge* is. This is the entire difference between security testing that works on an agent and security testing that doesn't, and it is the same rule the `flightline` skill enforces for every other quality check: **an advisory check an agent can click past is decoration.** Worse than for a human — a human glancing at a warning at least *sees* it; an agent told "make CI pass" treats a non-blocking warning as already-passed and a blocking failure as a red to be cleared by the cheapest available move. So the scanner must fail the build, and the only acceptable way to clear that red is to fix the finding.

The `flightline` skill **runs the pipeline**; this stage **defines what that pipeline must enforce for security.** The division is clean: flightline owns the CI machinery, branch protection, and the un-gameable-gates discipline in general; aegis specifies the security gates that machinery must carry and what "secure enough to pass" means. Wire these as **required status checks** on the protected branch (so none can be skipped on a merge), with secret-scan, SAST, and SCA running **unconditionally on every PR** — never behind a `paths:` filter, because a path-filtered security job is a green that *never ran* (a transitively-pulled CVE with no manifest edit, a secret in an unfiltered-out file), which is indistinguishable from an absent gate.

| Security gate | Blocks the merge on | Maps to scanner above | Speed / placement |
|---|---|---|---|
| **Secret scan** | a credential in the diff | (pre-SAST hygiene) | fast — gate every commit; this is the key the agent commits "to make it work" (SHIFT 5; flightline blocks it at commit time too) |
| **SAST** | a known-dangerous code pattern at/above the severity bar | SAST | fast-to-moderate — gate every PR; tune rulesets to cut false positives so it isn't ignored |
| **SCA** | a dependency with a CVE at/above the severity bar | SCA | fast — gate every PR; pairs with the lockfile so CI scans the exact graph that ships |
| **DAST** | a runtime/config finding above the bar on a deployed build | DAST | slow — run pre-deploy / nightly against staging, **red-means-stop on that run too**; not a per-PR gate |
| **Fuzzing** | a new crash/finding in a fuzzed component | (fuzzing) | open-ended — run on a schedule, gate on *regressions* (a newly-introduced crash), not on absolute coverage |

The placement rule is the `flightline` shift-left rule applied to security: put each check **as far left as it runs reliably** (secret-scan and the fast SAST/SCA lane on every push as the merge gate; the slow DAST and fuzzing lanes pre-deploy and on a schedule), so the feedback is fast enough that the gate is obeyed rather than bypassed. A slow security gate that humans and agents route around certifies nothing — same death spiral, triggered by slowness.

**PREDICATE — is a finding allowed to block, or be triaged?** A real false positive (SAST flags a pattern that is provably safe in context) should not block forever. **DEFAULT:** block on every finding at or above the severity bar (typically high/critical for a launch gate); below the bar, track and burn down. **FALLBACK** when you can't tell if a finding is a true positive: treat it as **true until proven false** — the asymmetry is the same as everywhere in this skill, an over-cautious block costs minutes, a waved-through real finding ships a breach green. A finding dismissed as a false positive must be *suppressed with a reviewed, time-boxed annotation that names why it is safe*, never by lowering the severity bar for the whole gate. An unexplained blanket suppression is the agent's "fix" for a security red, and it disarms the gate.

---

## Baseline-and-ratchet: retrofitting gates onto an existing codebase

Turn a blocking SAST or SCA gate on against a large existing codebase and it lights up with hundreds of pre-existing findings — none introduced by the change in front of you. Block the merge on all of them and the gate is unusable on day one, so it gets turned off, and you are back to no gate. The discipline that resolves this is the **same retrofit pattern `flightline` uses for coverage and lint**: *baseline the existing findings, gate the new ones, burn the backlog down.*

- **Baseline** the current findings into a tracked, reviewed allow-list (a snapshot of "the debt we are starting with"). The gate ignores exactly these and **fails on any finding not in the baseline** — i.e., any vulnerability the current change *introduces*. This makes the gate immediately enforceable: from this commit forward, the agent cannot add a new injection sink, a new hard-coded secret pattern, or a newly-vulnerable dependency without the build going red.
- **Ratchet** the baseline **down only.** It is a high-water mark that can shrink but never grow: a finding may leave the baseline (because it was fixed), never enter it (which would be smuggling a new vuln into the "ignored" set). Budget a standing slice each iteration to drive the count toward zero, prioritized by the [decision-tree.md](decision-tree.md) risk sizing — fix the high-severity findings on the crown-jewel paths first.

- **PREDICATE — gate everything now, or baseline-and-ratchet?** Is this a new/small codebase where a from-zero clean gate is achievable, or a large existing one where it would light up red on unrelated debt?
- **DEFAULT** on a coin-flip: **baseline-and-ratchet.** A gate that blocks new findings *today* and burns the backlog down is strictly better than a from-scratch gate deferred until "we've cleaned everything up," which never arrives. Gate the new, then chip at the old.
- **FALLBACK** when you can't cleanly separate new findings from baseline (the tool has no baseline mode, or the diff is tangled): gate on **patch/diff scope** — fail only on findings in the lines the change touched — which is the same diff-coverage instinct flightline uses, and a sound proxy for "new."

The baseline file is itself security-sensitive: it is a list of vulnerabilities you are deliberately not blocking on yet. It belongs under review (next section) so the ratchet cannot be quietly run backwards.

---

## The gate config is itself a target — put it under review

An agent facing a security gate will "fix" the red the same way it fixes any red: by the cheapest move that turns the light green. If it can reach the gate's *configuration*, the cheapest move is to weaken the gate — lower the severity bar, add a blanket suppression, drop the SCA `audit` finding into an ignore-list, `paths:`-filter the scan off the PR, or add `continue-on-error: true` to the security job. Every one of those produces a green light while disarming the thing that protects production, and the agent feels no wrongness doing it because the objective ("green") was met. So the gate config must be **un-gameable**, exactly as the `flightline` skill makes every gate un-gameable:

- **Put the security-gate config under required human review** — CODEOWNERS over the SAST/DAST/SCA rulesets, the severity thresholds, the suppression/ignore-lists, the baseline file, and the workflow files themselves. A change to *how strictly the system is scanned* is reviewed at least as carefully as a change to the code being scanned, because weakening the gate is more dangerous than any single logic bug: it disarms the thing that would have caught the next one.
- **Audit the security job's trigger, not just its body.** A blocking job behind a `paths:` filter, or one that `continue-on-error`s, is indistinguishable from an absent gate — review the `on:`/`paths:` and the exit-code handling, and run security jobs unconditionally.
- **Suppressions and ignore-list entries are reviewed and time-boxed**, each carrying a named reason and an expiry — never an open-ended blanket mute. The ratchet and the severity bar live in protected files; they move toward *stricter*, never looser, without a reviewer's sign-off.
- **The agent may run inside the pipeline; it must never sit above it.** An agent triaging or auto-fixing findings *proposes* through the same gate and review as any contributor — it does not get write access to disable a check, lower a threshold, or expand the baseline unilaterally.

The point, stated as `flightline` states it: **a green light the agent can manufacture is not a gate.** A security scan whose strictness the agent can edit is a green light the agent can manufacture.

---

## `vuln-classes-defended` — ASVS, the Testing Guide, and walking the OWASP Top 10

Gating the scanners proves no *new* known-bad pattern slips in. It does not prove the *known vulnerability classes are actually defended* — a scanner can be green simply because the relevant defense was never present to flag as missing. So this check walks the common classes explicitly and confirms, for each, that the defense **exists and is tested**, not merely that nothing tripped a scanner.

Use the OWASP standards as the structure so coverage doesn't depend on the agent's imagination (which has no attacker in it):

- **OWASP ASVS (Application Security Verification Standard)** is the **verification checklist** — the catalog of security requirements to confirm a system meets, organized by category (authentication, session management, access control, validation, cryptography, and so on), with three rigor levels. Pick the ASVS level matching the system's risk weight from [decision-tree.md](decision-tree.md) — roughly L1 for Light, L2 for Medium, L3 for Heavy — and walk it as the *what to verify* list. ASVS turns "is it secure?" into a concrete, checkable list instead of a vibe.
- **OWASP Testing Guide (WSTG)** is the **how-to** companion — the procedures for *how to test* each item ASVS says to verify. Where ASVS says "verify authorization is enforced server-side," the Testing Guide says how to probe for the IDOR. Use ASVS for coverage, the Testing Guide for technique.
- **The OWASP Top 10** is the prioritized shortlist of the highest-impact classes — the minimum walk for any system, and the right granularity for the `vuln-classes-defended` check.

Walk the [decision-tree.md OWASP class → defense map](decision-tree.md#the-owasp-class--defense-map-stage-34) — it is the canonical table for this skill (Injection → parameterized queries; Broken access control → server-side authz on every request; XSS → output encoding + CSP; CSRF → tokens + `SameSite`; Cryptographic failures → TLS + at-rest encryption, no secrets/PII in logs; Identification/auth failures → vetted framework + MFA + rate limiting; Security misconfiguration → secure defaults; Vulnerable components → SCA + patching; Logging/monitoring failures → security-event logging; SSRF → outbound allowlisting). **Do not duplicate that map here** — open it, and for each row confirm two things, because the agent satisfies the first and skips the second:

1. **The defense is present** (the code/design implements it — the [secure-coding.md](secure-coding.md) and [secure-design.md](secure-design.md) construction is actually in place).
2. **The defense is tested** — there is a test that sends the *hostile* input and proves the defense holds: a forged-cross-tenant request that gets a 403, a `' OR 1=1--` username that is rejected, a `<script>` payload that comes back encoded. A defense with no adversarial test is `claimed`, not `enforced` (the [decision-tree.md](decision-tree.md) status taxonomy) — it looks like a control and may already be broken.

This is where this stage meets the `assay` skill: writing the test that *attacks the defense and asserts it holds* is `assay`'s craft (the negative/abuse case, the right test type). aegis says *which* adversarial tests must exist — one per defended class, proving the hostile input is handled — and `assay` says how to write them well. A class that is present but untested fails this check.

---

## SCAN ≠ PENTEST — the load-bearing point of this stage

This is the most important section in the file, and the one an agent most needs spelled out, because every signal it trusts says the opposite. **Automated scanning finds *known patterns*; it does not find the exploit.**

A scanner matches against a library of recognized bad shapes. That makes it excellent at the recognizable and *structurally blind* to two things that are most of real-world risk:

- **The chained exploit.** A scanner evaluates findings in isolation. A real attacker combines them: a low-severity information disclosure leaks an internal ID, which enables an IDOR the authz check half-covers, which reaches an endpoint that trusts a header the gateway forgot to strip — three findings each individually "low" or invisible, composed into full account takeover. No scanner reasons across findings to build that chain; a creative attacker does it as a matter of course.
- **The business-logic flaw.** The authorization gap unique to *your* domain — a user able to approve their own refund, apply a coupon after checkout, read another tenant's invoice by changing an ID, replay a one-time token, negative-quantity their way to a credit — is not a *pattern*. It is your specific rules, correctly implemented as code and *wrong as policy*. There is no signature for "this business rule can be abused"; a scanner has no model of what your system is *supposed* to permit, so it cannot see the permission that is one step too generous.

That creative, adversarial, system-aware attack is **penetration testing**, and it is **not this skill's job — it is the `gungnir` skill's job.** This is the deliberate seam of the security pair: aegis is the **shield** (build it, scan it, gate it, prove each known class is defended and tested); `gungnir` is the **spear** (attack what aegis built, chain the small flaws, abuse the logic, find the gap the scanners can't). Where adversarial attack is the right move — and at Medium/Heavy risk weight before launch it always is (per [decision-tree.md TREE 0](decision-tree.md#tree-0--sizing-the-defense-to-risk-size-before-you-build)) — **hand it to `gungnir` by name** rather than attempting the attack from inside this defensive stage. A shield is only ever proven against a spear.

| | Automated scanning (this stage) | Penetration testing (the `gungnir` skill) |
|---|---|---|
| **Finds** | known bad *patterns* — the recognizable injection sink, the CVE'd dependency, the missing header | the *exploit* — chained flaws, business-logic abuse, the authz gap unique to your domain |
| **Method** | match against a signature library | a creative human/agent adversary who knows the system and tries to break it |
| **Coverage** | broad, shallow, every commit, cheap | deep, narrow, periodic, expensive |
| **A green result means** | no *known pattern* was found | someone who tried hard could not break in *this time* |
| **Sufficiency** | **necessary, never sufficient** | the proof — the first time the system is *actually* attacked |

**Scanning is necessary; it is not sufficient.** Treat "the scans are clean" as a *precondition* for the adversarial test — you do not pay a pentester to find the string-built SQL a SAST gate should have caught — never as a substitute for it.

---

## The ship decision: is this security-tested enough?

The final fork of the stage, the one that distinguishes a clean scan (necessary) from a real adversarial test (the proof). Apply it as the gate on `security-testing-gated` + `vuln-classes-defended` before you let the system advance to Operate.

- **PREDICATE:** Are the SAST/DAST/SCA gates blocking and green (no new findings above the bar, the baseline ratcheting down), *and* has every defended OWASP class an adversarial test proving the hostile input is handled, *and* — for a system at Medium or Heavy risk weight — has the `gungnir` skill actually attacked it and found nothing that survives, with any findings fixed and re-tested?
- **DEFAULT** on a coin-flip about whether it's "tested enough": **not yet.** A clean scan plus a tested-class checklist clears the *necessary* bar; for anything past Light weight it is not the *sufficient* bar. The sufficient bar is "an adversary who knows the system tried to break it and couldn't" — which only the `gungnir` skill's attack provides. When in doubt, the system has been scanned, not proven; route it to `gungnir` before you call it secure.
- **FALLBACK** when the gungnir attack hasn't happened yet, or you can't tell whether a class is truly tested: do **not** certify it secure. Ship behind the controls you *can* prove (the blocking gates, the tested classes), record the un-attacked surface as **residual security risk in writing** for the user to accept — they hold authority over what risk is acceptable ([escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear)) — and queue the `gungnir` pass. A clean scan reported as "secure" is precisely the **"the scan passed, so we're secure"** trap this entire stage exists to refuse.

For a **Light**-weight system (nothing sensitive, not exposed), the blocking SAST/SCA gates and the Top-10 walk *are* the sufficient bar and a full pentest is overkill — *够用就好*. For **Medium and Heavy**, the scan is the floor and the `gungnir` attack is the proof; the system is "security-tested enough to ship" only once the spear has been thrown at the shield and the shield held. Then carry the unresolved calls — which compliance regime, what residual risk is acceptable — to the user, and move to [operate-and-respond.md](operate-and-respond.md): because a system proven secure today is, after the next CVE and the next change, only secure until tomorrow.

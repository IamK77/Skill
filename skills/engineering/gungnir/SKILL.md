---
name: gungnir
description: >
  Attack your own system — under explicit authorization — to prove its defenses
  hold, before launch and continuously after: scope and authorize, recon, scan
  and enumerate, exploit and confirm real vulnerabilities (not scanner false
  positives), chain them into real impact, then report and re-test. The
  offensive half of the security pair (the spear) that proves what the
  `aegis` skill builds (the shield). Authorized, defensive penetration testing of
  systems you own or have written permission to test — never anything else. Use
  when the
  user wants to penetration-test their own application before launch, validate a
  fix actually closed a hole, stand up adversarial validation in CI or on a
  cadence, or learn to test for OWASP-class vulnerabilities on their own staging.
  Triggers on "pentest my app / attack my own system", "red-team my staging", "is
  this actually exploitable", "pre-launch security test".
argument-hint: "[your own / authorized target to attack — a staging system or lab]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# gungnir

!`checklist init ${CLAUDE_SKILL_DIR} --force`

The single most valuable security mindset is to **think like an attacker and actively try to break your own system** — because a defense is *only ever proven by a real attack*, never by a clean scan or a green test. This skill is the **spear**: authorized, adversarial penetration testing of a system to prove (or disprove) that the defenses the `aegis` skill built actually hold. It drives a real attack through its whole arc — scope, recon, scan, exploit, chain, report — across six gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it.

**The one hard boundary, gated first and never crossed: you attack only a system you own or have explicit, written authorization to test.** Attacking anything else — a third-party service, a system you don't own, infrastructure outside the agreed scope — is out of bounds, full stop, regardless of intent. This skill is for *authorized, defensive validation*: your own staging environment, a system you've been contracted to test in writing, or a deliberately-vulnerable practice lab. STAGE 0 makes that authorization a hard gate, and it is the one gate that is never a judgment call.

Adversarial validation is where the agent era cuts both ways, and both edges matter:
- **The agent can now actually run the attack** — `nmap`, `sqlmap`, an intercepting proxy — which makes continuous self-attack cheap and real. That capability is exactly why the **authorization gate must be absolute**: a tool that can find a hole can point at the wrong target, and the agent feels no instinct about whose system it is.
- **The agent shares the blind spots of whoever built the system.** If the design, the code, and now the attack are all done by agents, they share a training distribution and an imagination — so an agent attacking a system it (or a sibling) built will *miss the same things it missed building it*. **Agreement is not evidence.** Real assurance needs *independent* angles, and on the highest-stakes systems, a genuinely independent (human) tester.
- **The agent runs a scanner, sees an empty result, and declares "secure."** A clean scan means *known patterns weren't found* — it is necessary and nowhere near sufficient. The creative work — chaining small flaws into a real exploit, abusing business logic no scanner understands — is exactly what the agent is weakest at and what this skill exists to force.

So the rule that governs this skill: **a defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you are permitted to.** The goal is not to "pass"; it is to *find the holes while they are still cheap to fix.*

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what adversarial testing becomes when the attacker is an agent that shares the defender's blind spots, can run the tools, and will mistake a clean scan for a secure system. If `$ARGUMENTS` is trivial and has nothing worth attacking, this machinery is overkill — say so.

**Speak the user's language, and confirm the authorization out loud.** This skill needs the user to set the scope, confirm ownership/authorization, and own the disposition of every finding. Read their fluency and gloss a term on first use (penetration test vs scan, recon, IDOR, injection, privilege escalation, scope, rules of engagement). A user who cannot confirm, plainly, that this target is theirs to attack has not authorized it — and STAGE 0 does not clear.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the six stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. The authorization gate, the spectrum of adversarial validation (scan → self-test → independent pentest → bug bounty / red team), how deep to attack by risk, the scan-vs-exploit / confirm-vs-false-positive call, and the escalation ladder. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how adversarial testing changes when the attacker is an agent. Load at the start, re-check at every gate.
- [references/scope-and-authorization.md](references/scope-and-authorization.md) — the absolute first gate: ownership/written authorization, in-scope vs out-of-scope targets, rules of engagement, a safe (staging, snapshotted) environment, and cloud-provider testing policy.
- [references/recon-and-enumeration.md](references/recon-and-enumeration.md) — the depth behind **both STAGE 1 (Recon) and STAGE 2 (Scan)**: mapping the attack surface (passive recon, `nmap` port/service scanning, tech-stack fingerprinting, content/directory discovery with `ffuf`/`gobuster` to find what isn't linked), then the automated scan layer that turns the map into a candidate list (DAST vuln scanner, a Burp/ZAP proxy crawl of every parameter, version-based known-CVE checks) — framed as suspects, never a verdict.
- [references/exploitation-by-class.md](references/exploitation-by-class.md) — testing the OWASP Top 10 hands-on: broken access control / IDOR, injection (`sqlmap`), auth/session, XSS, misconfiguration, sensitive-data exposure, SSRF/CSRF — and confirming a real finding vs a scanner false positive.
- [references/chaining-and-impact.md](references/chaining-and-impact.md) — the creative core a scanner can't do: chaining small flaws into a real attack, business-logic abuse, and post-exploitation (lateral movement, privilege escalation, what data is reachable) to show true impact — plus why agent-shared blind spots demand independent angles.
- [references/report-fix-retest.md](references/report-fix-retest.md) — the only part that creates value: record, rank by severity, drive the fix (`aegis` / `husbandry`), and **re-test to verify it's closed**; plus making adversarial validation continuous, not a one-time gate.
- [references/tools-and-practice.md](references/tools-and-practice.md) — the standard toolkit (`nmap`, Burp Suite / OWASP ZAP, `ffuf`/`gobuster`, `sqlmap`, Metasploit, `trivy`), the standards (PTES, OWASP Testing Guide & ASVS), and legal practice labs (OWASP Juice Shop, DVWA, WebGoat) to build the skill safely.

---

## STAGE 0 — Scope & authorize (the gate that is never a judgment call)

Open **[references/scope-and-authorization.md](references/scope-and-authorization.md)**. Before any packet is sent, establish — and have the user confirm — that this is a system **they own or are explicitly, in writing, authorized to test**, and pin the boundaries:

- **In scope vs out of scope** — the exact domains/IPs/applications to test, and everything that is *off-limits* (above all, third-party services and dependencies you do not own — never attack a system you merely depend on).
- **Rules of engagement** — what techniques are allowed (e.g. exclude denial-of-service / stress testing unless explicitly agreed), the window, and who to contact.
- **A safe environment** — attack a staging/pre-production environment that mirrors prod, **snapshotted/backed up first**, never production with real user data; an attack can corrupt data or take a service down.
- **Provider policy** — if it runs on a cloud provider (AWS/GCP/Azure), confirm their penetration-testing policy; some test types require prior notice.

If ownership/authorization cannot be confirmed in writing, **stop** — this gate does not clear, and no later stage runs. This is the one non-negotiable gate in the whole suite.

### GATE — clear before RECON
1. `checklist check scope scope-and-authorization-locked`
2. `checklist verify scope`

---

## STAGE 1 — Recon (map the attack surface)

Open **[references/recon-and-enumeration.md](references/recon-and-enumeration.md)**. You cannot attack what you haven't mapped. Within the authorized scope, enumerate the surface: which endpoints, ports, and services are exposed; what technology stack and versions are in use; and — critically — the content that *isn't linked from the UI* but still exists (a forgotten `/admin`, a `/backup`, a stale API). Use `nmap` for ports/services and a content-discovery tool (`ffuf`/`gobuster`) for hidden paths. The `aegis` skill's threat model, if one exists, is your map of where to look hardest.

### GATE — clear before SCAN
1. `checklist check recon attack-surface-mapped`
2. `checklist verify recon`

---

## STAGE 2 — Scan & enumerate (cast the wide net)

Open **[references/recon-and-enumeration.md](references/recon-and-enumeration.md)**. Run the automated layer over the mapped surface: a vulnerability scanner, a web proxy crawl (Burp Suite / OWASP ZAP) of every page and API parameter, and version-based checks for known-CVE components. This produces the *candidate* list — the suspicious points to investigate. Hold the line internalized from the start: **a scanner finds known patterns; it does not prove exploitability, and an empty scan is not a secure system.** Scanning is the floor, not the verdict.

### GATE — clear before EXPLOIT
1. `checklist check scan scanned-and-enumerated`
2. `checklist verify scan`

---

## STAGE 3 — Exploit (confirm what's real, by class)

Open **[references/exploitation-by-class.md](references/exploitation-by-class.md)**. Now actually try to exploit the candidates — because the value is in confirming a vulnerability is *genuinely exploitable*, not a scanner's guess. Work the OWASP Top 10 by class against your own system, always from the attacker's core assumption — **the app will trust whatever input I give it** — and feed each input point the unexpected:

- **Broken access control / IDOR** (highest-yield, easiest to self-test): log in as two ordinary users; change a resource ID in a URL or request to another user's and see if you get their data; hit an admin endpoint with a normal account.
- **Injection**: enter a single quote `'` and watch for a database error; then use `sqlmap` against the parameters that react. Test command and NoSQL injection the same way.
- **Auth & session**: weak-password acceptance, brute-force protection, token expiry after logout, `HttpOnly`/`Secure` cookies, lingering default credentials.
- **XSS**: put a harmless probe script in a field that gets reflected and see if it executes rather than displays as text.
- **Misconfiguration / sensitive data**: exposed debug endpoints, verbose errors leaking internals, public buckets, plaintext transport, secrets in responses or logs.

Confirm each finding (a real exploitation or a clear, reproducible proof) and discard the false positives.

### GATE — clear before CHAIN
1. `checklist check exploit exploited-not-just-scanned`
2. `checklist check exploit owasp-classes-attacked`
3. `checklist verify exploit`

---

## STAGE 4 — Chain & show impact (the part a scanner can't do)

Open **[references/chaining-and-impact.md](references/chaining-and-impact.md)**. A pentest's real worth — and the thing automation cannot replicate — is **creatively chaining several small flaws into one real attack**, abusing **business logic** no scanner understands, and doing **post-exploitation** to show *true impact*: if you got in, how far can you move laterally, can you escalate privilege, what data can you actually reach? A "low-severity" info leak plus a "low-severity" weak reset can chain into full account takeover. This is also where **agent-shared blind spots** bite hardest: an agent attacking a system agents built will overlook the same logic it overlooked building it — so deliberately take *independent* angles (and on a high-stakes system, get a genuinely independent human tester), because **agreement is not evidence**.

### GATE — clear before REPORT
1. `checklist check chain chained-and-impact-shown`
2. `checklist verify chain`

---

## STAGE 5 — Report, fix & re-test (the only part that creates value)

Open **[references/report-fix-retest.md](references/report-fix-retest.md)**. A penetration test report, by itself, is worth nothing — **the value is the closed loop.** For every confirmed finding: record it with a clear reproduction and **rank it by severity** (impact × exploitability). When you are attacking your own *deployment* of software you did not author, rank by a second axis too — **would a correctly-hardened deployment still have it?** A flaw that survives auth-on, least-exposure, strong-secrets, and a current version is the **product's**, not your config's, and ranks above anything correct deployment would have erased. Then drive the **fix** — a deployment-owned finding you close yourself (defense via the `aegis` skill, change via `husbandry`); a **product-owned** finding in code you do not maintain takes a different loop, **coordinated disclosure to the maintainer**, re-tested against their patched release. And **re-test to verify the hole is actually closed** — a fix you never re-attacked is a hope. A report that sits in a drawer with nothing fixed is the same as never having tested.

And make it **continuous**: a one-time pre-launch attack is stale within weeks, because new vulnerabilities are disclosed daily and every change can open a new hole. The pre-launch attack is the capstone, not the only event — layer it on automated scanning every commit (the `aegis`/`flightline` gates), re-attack after major changes, and on the highest-stakes systems, ongoing independent testing or a bug-bounty program.

### FINAL GATE
1. `checklist check report findings-fixed-and-retested`
2. `checklist check report validation-made-continuous`
3. `checklist verify report`
4. `checklist show` — confirm all six stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

gungnir is the **spear**, and it exists to prove the **shield**: it attacks what the `aegis` skill builds, because a defense untested by a real attack is only an assumption — the same "an unrehearsed control is not a control" the `stationkeeping` skill insists on, pointed at security. The two are a matched pair: `aegis` weaves defense through the lifecycle; gungnir adversarially validates it. For an agent the lever cuts twice: it can finally run the attack itself (so make validation continuous), but it shares the defender's blind spots and mistakes a clean scan for safety (so demand independent angles and real exploitation, never just a green scanner) — and it can point a real weapon at the wrong target, which is why authorization is the one absolute gate. Find the holes while they are cheap; fix them; attack again.

## Anti-patterns (use as a pre-flight checklist)

- **Attacking anything unauthorized** — the one unforgivable error; only your own or explicitly-permitted systems, never a third party.
- **Testing in production with real data** — use a snapshotted staging mirror; an attack can corrupt or take down.
- **Scan = pentest** — a clean scanner is necessary, never sufficient; the exploit chain and logic flaw are what it misses.
- **Stopping at the first wall** — real attackers are persistent and creative; assume the input is trusted and try the unexpected.
- **Agent attacking what agents built, alone** — shared blind spots; take independent angles, agreement is not evidence.
- **A report nobody acts on** — worthless; the value is fix-and-re-test, the closed loop.
- **A fix never re-attacked** — an unverified fix is a hope; re-test every closed finding.
- **One-and-done** — a single pre-launch pentest is stale fast; make adversarial validation continuous.
- **Skipping a GATE** — especially STAGE 0; the authorization gate is never a judgment call.

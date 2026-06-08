---
name: aegis
description: >
  Weave security through the whole lifecycle instead of bolting it on at the end:
  set a risk-based security stance and the timeless principles (least privilege,
  defense in depth, fail secure, zero trust), build a threat model, turn it into
  secure design, write code that never trusts its input and never holds a secret,
  gate SAST/DAST/SCA in CI, defend the common vulnerability classes (OWASP Top
  10), and operate with patching and incident response — tuned for a world where
  an agent writes insecure code by default, has no threat model, trusts its input,
  and ships a vulnerability green. The defensive half of the security pair (the
  shield); its adversarial counterpart is the `gungnir` skill (the spear). Use
  when the user wants to make a system secure-by-design, do threat modeling,
  handle authentication/authorization, manage secrets, prevent injection / XSS /
  broken access control, set up SAST/DAST/dependency scanning, meet a compliance
  or data-protection requirement, or stand up security monitoring and incident
  response. Triggers on "is this secure", "threat model this", "secure coding",
  "OWASP", "least privilege", "manage secrets", "auth/authz design", "shift-left
  security / DevSecOps", "GDPR / PII / data classification", "security review".
argument-hint: "[system / feature / scope to secure]"
allowed-tools: Read Bash Edit Write
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# aegis

!`checklist init ${CLAUDE_SKILL_DIR} --force`

Security is not the last check before launch; it is **a line that runs through every part of the lifecycle.** Treating it as something you add once the features work — *bolt-on security* — fails almost by construction, because the most damaging weaknesses live in architecture and design, where they cannot be patched in afterward, only rebuilt. The correct posture is the one this whole suite keeps returning to: **shift security left** (the DevSecOps idea), the same "catch it early, surface it cheap" instinct as quality-left and red-means-stop. This skill is the **shield** — the discipline of building a system secure-by-design — across six gated stages, and it will not advance past a **GATE** until the `checklist` tool clears it. Its adversarial counterpart, the **spear** that attacks what this builds to prove it holds, is the `gungnir` skill.

Security is where the agent era is most dangerous, because a vulnerability is the worst possible fit for how an agent works:
- **The agent writes insecure code by default.** Its training distribution is full of vulnerable patterns — string-concatenated SQL, `eval`, weak or homemade crypto, hard-coded keys — and it reproduces them, because insecure code *works perfectly* until someone attacks it.
- **A vulnerability passes every green test.** It is the *absence of an attack so far*, not a failure — so it sails through every functional test and every green dashboard, and a green-optimizing agent ships it believing the job is done. Security is the ultimate "green ≠ correct."
- **The agent has no threat model and trusts its input.** It does not spontaneously ask "who would attack this, and how"; it writes the happy path and treats input as friendly, which *is* injection and XSS.
- **The agent invents crypto/auth and over-grants to make it work.** It will happily generate a custom authentication scheme or widen a permission to `*:*` to clear an error, feeling none of the risk.

So the rule that governs this skill: **security must be woven in and enforced at every stage, never trusted to instinct** — because the most prolific contributor is an agent whose every default is the insecure one, and whose green light certifies nothing about whether the system can be attacked. The aim is not absolute security (which is impossible and infinitely costly) but **risk management**: identify what is most worth protecting and most likely to be attacked, and concentrate the defense there.

**Discipline:** finish every GATE before the next stage. GATEs are hard — never skip, batch past, or self-certify a stage you have not done. The `checklist` tool enforces the order; let it. Commands address stages by **name**.

**Read [references/agent-era-shifts.md](references/agent-era-shifts.md) first** — it is the heart: what each security practice becomes once the code is written by something with no threat model, no felt risk, and a relentless pull toward whatever turns the light green. If `$ARGUMENTS` is a throwaway with no sensitive data and no exposure, this machinery is overkill — say so. The leanest *sufficient* defense for the system's real risk is the goal, not maximum ceremony.

**Speak the user's language, or the risk gets accepted blind.** This skill makes the user own real trade-offs only they can price: what data is sensitive, what an outage or breach costs, which compliance regime applies, how much defense a risk earns. Read their fluency and gloss a term on first use (threat model, STRIDE, least privilege, defense in depth, SAST/DAST/SCA, CIA, zero trust). A user who signs off on "this residual risk is acceptable" in words they never parsed has not accepted it — and the FRAME, MODEL, and OPERATE judgments this skill leans on them for are then hollow.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront. Eight references back the six stages:

- **[references/decision-tree.md](references/decision-tree.md)** — the engine. Sizing the defense to risk (crown jewels × threat × exposure), the STRIDE threat-model router, the build-vs-buy call for anything security-critical (never invent crypto), the OWASP class → defense map, and the escalation ladder. Open it at the start.
- [references/agent-era-shifts.md](references/agent-era-shifts.md) — the must-be-told reference: how each security practice changes when an agent writes the code. Load at the start, re-check at every gate.
- [references/principles-and-stance.md](references/principles-and-stance.md) — the timeless principles (least privilege, defense in depth, fail secure, minimize attack surface, no security through obscurity, zero trust), the CIA triad, crown-jewel / data classification, and security as risk management.
- [references/threat-modeling.md](references/threat-modeling.md) — STRIDE, trust boundaries, attack-surface enumeration, data-flow diagrams, and ranking by risk — the cheapest, highest-leverage security investment.
- [references/secure-design.md](references/secure-design.md) — authentication and authorization models, enforcing trust boundaries, layering defense in depth, failing secure, secure defaults, and the never-invent-crypto rule.
- [references/secure-coding.md](references/secure-coding.md) — never trust input (validate at the boundary), parameterized queries, output encoding, the OWASP Top 10 vulnerability → defense catalog, secrets out of code, and least-privilege wiring.
- [references/security-testing-and-gates.md](references/security-testing-and-gates.md) — SAST / DAST / SCA / fuzzing automated as blocking CI gates, the OWASP ASVS verification checklist, and the hand-off to the `gungnir` skill for adversarial penetration testing.
- [references/operate-and-respond.md](references/operate-and-respond.md) — runtime defense, security monitoring and detection, patching and CVE/vulnerability management, secret rotation, and security incident response — because security is never *done*.

---

## STAGE 0 — Frame (set the stance, size the defense to the risk)

Security investment must match what is at stake — *够用就好*; a system holding payment data and PII earns threat modeling, hard auth, and security gates, a static brochure site does not. Open **[references/decision-tree.md](references/decision-tree.md)** and **[references/principles-and-stance.md](references/principles-and-stance.md)**: name the **crown jewels** (the data and capabilities most worth protecting — classify what is sensitive/PII/regulated), size the exposure and threat, and set the defense to that. Internalize the **CIA** goal (Confidentiality, Integrity, Availability) and the timeless principles you will apply at every later stage — **least privilege, defense in depth, fail secure, minimize attack surface, no security through obscurity, zero trust** — and the governing fact: **security is risk management, not a quest for the absolute.** Assume the attacker knows your system completely and that any single layer can fail.

**Decide the mode: SETUP or AUDIT.** **SETUP**: build security in from the start as you design and code. **AUDIT / security review** (the common case — an existing system): assess each control capability by capability with evidence (is there a threat model? is input validated? are secrets in a manager? are the gates running?), and fix the gaps — never reporting a control sound because it is *named* rather than *enforced*.

### GATE — clear before MODEL
1. `checklist check frame security-stance-set`
2. `checklist verify frame`

---

## STAGE 1 — Model (think like an attacker, on paper, early)

Open **[references/threat-modeling.md](references/threat-modeling.md)**. Threat modeling is the single highest-leverage, cheapest security investment, and the thing an agent will never do unasked: systematically ask **"who would attack this, from where, and what do they want?"** Use **STRIDE** (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) over the system's data-flow, mark the **trust boundaries** (where data crosses from less-trusted to more-trusted) and the **attack surface** (every exposed endpoint, port, input, and dependency) right on the architecture diagram, and rank the threats by risk so the defense lands where it matters. This is where the `load-bearing` skill's trust boundaries and the `groundwork` skill's security NFRs become a concrete map of what to defend.

### GATE — clear before DESIGN
1. `checklist check model threat-model-built`
2. `checklist verify model`

---

## STAGE 2 — Design (build the defenses into the structure)

Open **[references/secure-design.md](references/secure-design.md)**. Turn the threat model into design decisions, because the worst weaknesses are architectural and cannot be patched in later:

- **Authentication and authorization, designed not improvised** — use a vetted framework; enforce authorization **server-side on every request**, never by hiding a button.
- **Enforce the trust boundaries** the model drew, and layer **defense in depth** so no single control is the whole defense — assume each layer can be breached.
- **Fail secure** — on error, default to *deny*, not allow (an auth service that is down must refuse access, not wave it through).
- **Minimize the attack surface** — expose the fewest endpoints, ports, and features; turn off and delete what you don't use.
- **Never invent crypto or core security primitives.** Assume the attacker knows your design (no security through obscurity), so security must hold anyway — which is exactly why you use public, audited algorithms and libraries, never a homemade scheme the agent was happy to generate.

### GATE — clear before BUILD
1. `checklist check design defenses-and-trust-boundaries`
2. `checklist verify design`

---

## STAGE 3 — Build (code that never trusts input and never holds a secret)

Open **[references/secure-coding.md](references/secure-coding.md)**. Secure coding rests on one assumption applied everywhere: **never trust user input** — every external input is validated at the boundary before use.

- **Defend the common vulnerability classes by construction** ([the OWASP Top 10 catalog](references/secure-coding.md)): **parameterized queries / prepared statements** for injection (never concatenate input into SQL or a command), **output encoding** for XSS, **server-side authorization checks** for broken access control, CSRF tokens + `SameSite` cookies, encryption in transit (TLS) and at rest for sensitive data, and safe configuration (no default passwords, no exposed debug endpoints, no public buckets).
- **Secrets never live in code or logs.** Inject them from a secrets manager / vault (the `flightline` skill blocks them at commit time; this stage keeps them out of the running code and the telemetry — never log a password or PII).
- **Least privilege in the wiring** — every component, query, and credential gets only the access it needs.

### GATE — clear before VERIFY
1. `checklist check build input-never-trusted`
2. `checklist check build secrets-and-least-privilege`
3. `checklist verify build`

---

## STAGE 4 — Verify (automate the security gates; defend the known classes)

Open **[references/security-testing-and-gates.md](references/security-testing-and-gates.md)**. Security testing must be automated into the pipeline and run every commit — because a vulnerability is invisible to a functional test and a green-optimizing agent will never seek it out.

- **Gate SAST, DAST, and SCA, blocking** — static analysis of the source, dynamic scanning of the running app, and dependency/supply-chain scanning (the `flightline` skill runs the pipeline; this defines what it must enforce). Add **fuzzing** where input handling is critical. Advisory scans an agent can ignore are not gates.
- **Walk the OWASP Top 10 as a verification checklist** (OWASP ASVS is the standard form): for each class, confirm the defense exists *and* is tested.
- **Hand the adversarial half to `gungnir`.** Automated scanning finds *known patterns*; it does not chain small flaws into a real exploit or abuse business logic. That creative, adversarial attack — penetration testing — is the `gungnir` skill's job, and it is where a system is truly proven. Scanning is necessary; it is not sufficient.

### GATE — clear before OPERATE
1. `checklist check verify security-testing-gated`
2. `checklist check verify vuln-classes-defended`
3. `checklist verify verify`

---

## STAGE 5 — Operate (defend, patch, and respond — security is never done)

Open **[references/operate-and-respond.md](references/operate-and-respond.md)**. New vulnerabilities are disclosed every day and every change can open a new hole, so security is a *continuous* practice, not a one-time checkpoint.

- **Runtime defense and security monitoring** — the security slice of the `stationkeeping` skill's observability: detect and alert on attacks and anomalies, log security events, and keep least-privilege access controls with auditing.
- **Patch and track vulnerabilities continuously** — follow disclosed CVEs and upgrade vulnerable dependencies promptly (the `husbandry` skill's "don't drift to EOL," in its security form: an unpatched known vulnerability is a standing breach).
- **Have a security incident-response plan** — a known, rehearsed way to respond to a breach (detect → contain → eradicate → recover → learn), run **blameless** like every incident in this suite so problems surface fast instead of hiding.

### FINAL GATE
1. `checklist check operate runtime-defense-and-patching`
2. `checklist check operate incident-response-ready`
3. `checklist verify operate`
4. `checklist show` — confirm all six stages passed.
5. `checklist done` — clear this run's state.

---

## The thread through all of it

aegis is the **shield**, and it is cross-cutting by nature: the security line runs through every sibling — security NFRs in `groundwork`, trust boundaries in `load-bearing`, SAST/secret-scan/SCA gates in `flightline`, security testing in `assay`, runtime defense and patching in `stationkeeping` and `husbandry`, and the legible, hard-to-fake signal of `gauge`. aegis owns that line and pulls the threads together; it does not replace the siblings' mechanics, it directs them toward defense. And it is one half of a pair: a shield is only proven against a spear, so what aegis builds, the **`gungnir`** skill attacks — the sharpest spear against the hardest shield. For an agent the lever is the same as everywhere in the suite: every one of its defaults is the insecure one and a vulnerability ships green, so security must be **woven in and gated**, not trusted to an instinct it does not have.

## Anti-patterns (use as a pre-flight checklist)

- **Bolt-on security** — added after the features; the architectural holes can't be patched in. Weave it through from STAGE 0.
- **Trusting user input** — the root of injection and XSS; validate every external input at the boundary.
- **Inventing your own crypto / auth** — assume the attacker knows your design; use public, audited primitives.
- **Security through obscurity** — "they won't find it" is not a control; assume full knowledge of the system.
- **Secrets in code or logs** — inject from a manager; never hard-code a key or log a password/PII.
- **Over-broad permissions** — the agent widens to `*:*` to stop an error; grant least privilege from deny-all.
- **Default / unreviewed configuration** — default passwords, debug endpoints, public buckets; secure defaults, reviewed.
- **Unpatched known vulnerabilities** — a disclosed CVE left in a dependency is a standing breach; patch continuously.
- **Green ≠ secure** — a vulnerability passes every functional test; gate SAST/DAST/SCA and have `gungnir` attack it.
- **Chasing absolute security** — impossible and infinitely costly; manage risk — defend the crown jewels first.
- **Skipping a GATE** — the user's judgment on what to protect and what risk to accept can change the whole plan.

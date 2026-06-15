# The aegis Decision Tree

This is the deterministic router at the heart of `aegis` — the engine the stages call into so that two agents securing the same system reach the *same* defense. Open it **first**, at STAGE 0 (Frame), alongside [agent-era-shifts.md](agent-era-shifts.md), and keep it beside you through every stage. The other references are the depth on each topic; this one decides *how much* defense the system earns, *which* move to make at each fork, and *what defends what*. It is five mechanisms: the **risk sizer** (TREE 0), the **SETUP-vs-AUDIT split** with its status taxonomy, the **STRIDE threat-model router**, the **build-vs-buy** decision for security-critical primitives, and the **OWASP class → defense map** — feeding the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md.

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail. When a fork is a real toss-up, err toward the **fail-closed, vetted, defended** option — deny over allow, validate over trust, buy the audited primitive over inventing one, patch now over later. The asymmetry: an over-cautious choice costs minutes or a little friction; a trusted hostile input, an invented cipher, or an unpatched CVE costs a breach the agent will have shipped green.

---

## TREE 0 — Sizing the defense to risk (size before you build)

Defense is a cost; match it to what a breach would actually cost — *够用就好*. Score the system on three dials, take the **highest**, and read off the floor.

| Dial | Light | Medium | Heavy |
|---|---|---|---|
| **Crown jewels** (what's lost if breached) | nothing sensitive; public/static data | real user data; some PII; reputational cost | payment data, health/PII at scale, secrets, safety, regulated data |
| **Exposure** (reachability) | internal-only / not internet-facing | internet-facing, authenticated | internet-facing, public, high-traffic, valuable target |
| **Threat** (who'd attack, how motivated) | no one specific; opportunistic only | opportunistic + some targeted | motivated, funded, targeted adversaries |

- **PREDICATE:** what is the highest dial this system hits?
- **LIGHT → the minimum:** input validation, parameterized queries, HTTPS, no secrets in code, dependency scanning, sane defaults. Skip a formal threat model, a pentest, a full IR plan.
- **MEDIUM → the standard floor:** all six stages, lightly — a threat model, designed authn/authz, the OWASP defenses, SAST/DAST/SCA gated, patching, a basic IR plan; a pentest (`gungnir`) before launch.
- **HEAVY → the full floor:** threat modeling as a living practice, defense in depth proven, hard authz, blocking security gates + fuzzing, an independent professional pentest, runtime detection, a rehearsed IR plan, and compliance controls (the user's regime).
- **DEFAULT** on a coin-flip between two classes: size to the **higher** class for the dial touching data, money, safety, or compliance (an under-defended breach of regulated data is the catastrophic error) and the lower class elsewhere.
- **FALLBACK** when you can't size it (unknown data sensitivity, unclear exposure): assume **MEDIUM**, and make the data classification and compliance regime explicit questions for the user — an unsized system defaults to "the agent secures it as little as the happy path required," which is the failure mode.

> **The agent multiplier:** the more an agent writes/operates the system, the *more* of the defense must be enforced as a gate, not trusted — because every one of the agent's defaults is the insecure one and it supplies no defensive instinct to back-stop a light floor.

---

## SETUP vs AUDIT — pick the mode, then the status taxonomy

- **PREDICATE:** are you building security into a new/changing system (SETUP) or reviewing an existing one (AUDIT)?
- **SETUP**: build the defense in stage by stage to the TREE 0 floor.
- **AUDIT / security review** (the common case): assess each control with **evidence**, then fix the gaps:

| Status | Means | Evidence that proves it |
|---|---|---|
| **enforced** | exists and *blocks/holds* | a SAST/DAST/SCA gate that fails the build; authz that denies a forged request in a test; a secret-scan that blocks a commit |
| **present-unenforced** | configured but advisory / not blocking | a scanner that only warns; an authz check only in the UI — treat as **not done** |
| **claimed** | asserted, not verified | "we validate input" with no test proving a hostile input is rejected |
| **absent** | not there | — |
| **unknown** | can't tell from here | needs the user / a deeper look (or a `gungnir` probe) |

> The trap this kills: reporting a control sound because it *exists* rather than because it *blocks*. `present-unenforced` is the most dangerous status — an advisory scanner or a UI-only authz check looks like a defense and stops nothing. A control is only real once it is enforced *and* something has tried to get past it.

### The deployment-vs-product axis (when you operate what you did not author)

A second axis cuts across the status taxonomy whenever the system under review is one you **operate but did not write** — an OSS product, a vendored service, a dependency you deploy. Now "fix the gap" forks by *who can fix it*, and the two are not equally valuable to surface:

| Owner | What it covers | Closed by | The finding's value |
|---|---|---|---|
| **Deployment** | config, secrets, network exposure, host, the options you chose | you, by deploying correctly | real, but it is *your* posture — another operator may already have it right |
| **Product** | the code and architecture anyone running it inherits | only an upstream change (or your own fork) | highest — it **survives a correctly-hardened deployment**, no operator can close it, and it is what the maintainer must hear |

- **PREDICATE:** would a *correctly-hardened deployment* (auth on, least exposure / bound to loopback, strong secrets, current version) still have this gap? If yes → **product-owned**; if no → **deployment-owned**.
- **DEFAULT** on a coin-flip: the cheapest way to settle it is to *harden the deployment and look again* — close the config gaps first, then see what is still standing. What remains is the product's, and ranks above anything a config change would have erased. This is the operator's lens the adversarial pass does not supply on its own: a default install falling over proves little about the product; a flaw still live after you did everything right proves a lot.
- **FALLBACK** when you cannot harden it yourself to test (no control over the build, can't change the config): reason it through from the code and the defaults, tag the finding *product-owned / unverified-against-hardening*, and say so — never let a deployment-fault and a product-fault be reported as the same thing.

> The agent blind spot this kills: an agent reviewing software it operates conflates the **deployment** with the **product** — it reports "I broke the default install" with the same weight as "this is broken in code no matter how you run it," because it has no notion of *who ships the fix*. Separating the two turns a generic "your defaults are bad" into the specific, high-value "this survives correct deployment — it's yours to patch." A product-owned finding you cannot fix yourself routes to coordinated disclosure (the `gungnir` skill's report stage owns that loop).

---

## The STRIDE threat-model router (STAGE 1)

Run STRIDE over each element of the system's data-flow diagram (external entities, processes, data stores, and the data flows between them). For each, ask the six questions; each "yes, plausibly" is a threat to rank and defend. Detail in [threat-modeling.md](threat-modeling.md).

| STRIDE threat | The question | Property it violates | Typical defense |
|---|---|---|---|
| **S**poofing | can an attacker pretend to be someone/something else? | Authentication | strong authn, vetted identity, MFA |
| **T**ampering | can data be modified in transit or at rest? | Integrity | TLS, signing/HMAC, input validation, access control |
| **R**epudiation | can someone deny an action with no proof? | Non-repudiation | audit logs, signed records |
| **I**nformation disclosure | can data leak to someone unauthorized? | Confidentiality | encryption (transit + rest), least privilege, no secrets/PII in logs |
| **D**enial of service | can the system be made unavailable? | Availability | rate limiting, quotas, autoscaling (`stationkeeping`), input limits |
| **E**levation of privilege | can a user gain rights they shouldn't have? | Authorization | server-side authz on every request, least privilege, deny-all default |

- **PREDICATE:** for this element and this threat, is the attack plausible *and* the impact material?
- **DEFAULT** on a coin-flip about whether a threat is worth defending: defend it if it touches a crown jewel or a trust boundary; for the rest, rank by `likelihood × impact` and defend top-down until the budget for this system's weight class is spent.
- **FALLBACK** when you can't tell if a threat is reachable: mark the trust boundary it would cross and treat the element as reachable until proven otherwise — and let `gungnir` test whether it actually is.

Mark **trust boundaries** (every place data crosses from less- to more-trusted) and the **attack surface** (every exposed endpoint/port/input/dependency) directly on the diagram — they are where defense concentrates.

---

## The build-vs-buy decision (anything security-critical)

The single fork the agent gets most dangerously wrong (it will happily invent crypto — agent-era-shifts SHIFT 4). Detail in [secure-design.md](secure-design.md).

- **PREDICATE:** is this crypto, authentication, authorization, session management, password storage, tokens, or randomness — anything whose *subtle* flaw is an exploit?
- **Yes** → **buy/adopt a public, audited, widely-used implementation** (OAuth/OIDC, a KMS, argon2/bcrypt/scrypt for passwords, the platform's crypto library, a vetted authz framework). Never the agent's homemade version.
- **No, it's ordinary application logic** → build it — under the rest of this skill's defenses.
- **DEFAULT** on a coin-flip about whether something is "security-critical enough" to buy: **buy.** The space of subtle, exploitable crypto/auth mistakes is vast and invisible to a functional test; the homemade version *looks* fine and fails only against an expert attacker.
- **FALLBACK** when no vetted option seems to fit: that usually means the need is mis-scoped — re-frame to a standard one before ever hand-rolling, and escalate to the user rather than invent a primitive.

> The rule behind this fork is **no security through obscurity**: assume the attacker knows your design, so "they won't figure out our scheme" is never a defense — which is exactly why only publicly-audited primitives, whose security holds *with* the design known, are safe.

---

## The OWASP class → defense map (STAGE 3–4)

The common vulnerability classes (the OWASP Top 10 is the canonical list) and the defense each requires. Use it as a checklist at Build (defend each) and Verify (test each). Full depth in [secure-coding.md](secure-coding.md).

| Vulnerability class | The attack | The defense (by construction) |
|---|---|---|
| **Injection** (SQL/NoSQL/command) | input interpreted as code/query | **parameterized queries / prepared statements**; never concatenate input into SQL/commands |
| **Broken access control** | user reaches data/actions they shouldn't (IDOR, forced browsing) | **authorization checked server-side on every request**, against the actual user — never a hidden UI control |
| **Cryptographic failures** (sensitive-data exposure) | data read in transit or at rest | TLS in transit + encryption at rest; vetted crypto; no secrets/PII in logs |
| **Identification & auth failures** | weak passwords, no brute-force protection, sessions that don't expire | vetted auth framework, MFA, rate limiting, secure session management, `HttpOnly`/`Secure` cookies |
| **Cross-site scripting (XSS)** | user content executed as script | **output encoding/escaping** for the context; a content security policy |
| **Cross-site request forgery (CSRF)** | a user's browser tricked into an action | CSRF tokens; `SameSite` cookies |
| **Security misconfiguration** | default passwords, debug endpoints, public buckets | secure defaults; config review; minimal attack surface |
| **Vulnerable & outdated components** | a known-CVE dependency | SCA scanning + prompt patching (`flightline`/`husbandry`) |
| **Security logging & monitoring failures** | a breach goes unnoticed | security-event logging + alerting (`stationkeeping`) |
| **SSRF** | server tricked into requesting an internal resource | validate/allowlist outbound targets; network segmentation |

> The thread through the whole table: **never trust user input** (agent-era-shifts SHIFT 3). Injection, XSS, broken access control, and SSRF are all, at root, input that was trusted when it should have been validated, encoded, or authorized.

---

## Worked traversal (an internet-facing app handling user PII and payments)

1. **TREE 0:** crown jewels = payments + PII (Heavy), exposure = public internet-facing (Heavy), threat = motivated/targeted (Heavy) → **HEAVY → full floor, pentest required.**
2. **Mode:** existing system → **AUDIT.** Status-pass: threat model `absent`, input validation `claimed` (no test proves a hostile input is rejected), authz `present-unenforced` (checked in the UI, not server-side — an IDOR waiting to happen), secrets `absent` control (a key found hard-coded), SAST/DAST `absent`. Most read as **not done**.
3. **STRIDE:** over the data flow surfaces Elevation-of-privilege (the UI-only authz) and Information-disclosure (the hard-coded key, PII in logs) as top-ranked; trust boundary at the API edge.
4. **Build-vs-buy:** the team's homemade session-token scheme → **buy** (adopt a vetted session library / OAuth); the invented token is the finding.
5. **OWASP map:** broken access control → server-side authz on every request; injection → parameterized queries; crypto failures → TLS + at-rest encryption + secret to a vault; walk the rest.
6. **Verify → gungnir:** gate SAST/DAST/SCA; then the `gungnir` skill attacks the staging app — and the IDOR and the logic flaws are exactly what the scanners missed and the spear finds.
7. Carry the unresolved calls (which compliance regime? what residual risk is acceptable?) to the user via the escalation ladder rather than assuming.

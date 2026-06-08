# Security Principles and the Stance That Sizes the Defense

This reference is the depth behind **STAGE 0 — Frame** of the [../SKILL.md](../SKILL.md) flight plan, the place where you set the security stance and size the defense to the risk *before* you model a single threat or write a line. It governs four things: the goal every defense ultimately serves (the **CIA triad**), what is actually worth defending (the **crown jewels** and a data classification that points the defense at what matters), the **timeless principles** you bind here and apply at every later stage, and the governing posture that turns "build it secure" from a virtue into the gate the rest of the skill inherits — security as **risk management**, not a quest for the absolute. The human-era→agent-era shift here is the root one: a human builder carried a flicker of defensive instinct as they coded, so a security review near the end was a backstop on mostly-careful work; the agent supplies no such instinct, writes the insecure pattern by default, and books "it works" as done over a system that was never secure to begin with. For *why* this is the spine of the whole skill — the felt risk that vanished, the bolt-on review that is now the *first* time anything checked security — read **SHIFT 1** in [agent-era-shifts.md](agent-era-shifts.md). This file is the *how*: how to set the goal, classify what matters, bind the principles, and hold the stance so two agents framing the same system reach the same plan.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and overriding every default below:

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail.

Everything in this file is a consequence of that sentence. The check this file delivers is `security-stance-set`: the crown jewels named and the data classified, the defense sized to the risk, the CIA goal internalized, and the timeless principles bound as the standard every later stage is judged against.

---

## Contents

- [The goal every defense serves — the CIA triad](#the-goal-every-defense-serves--the-cia-triad)
- [Crown jewels and data classification — point the defense at what matters](#crown-jewels-and-data-classification--point-the-defense-at-what-matters)
- [The timeless principles — and the agent failure mode each guards](#the-timeless-principles--and-the-agent-failure-mode-each-guards)
- [Security is risk management, not a quest for the absolute](#security-is-risk-management-not-a-quest-for-the-absolute)
- [How the security line threads every sibling skill](#how-the-security-line-threads-every-sibling-skill)

---

## The goal every defense serves — the CIA triad

Before you can size a defense you need to know what "secure" even means for this system, and the answer is older than any framework: a system is secure to the degree it preserves three properties of its data and its service. Every threat you will enumerate at Model, every control you will design at Design, and every vulnerability class you will defend at Build is, at root, an attack on one of these three. Naming them at Frame gives the rest of the skill a target: a defense exists to protect a *named property of a named asset*, and a property you care about but cannot point to an enforced control for is, by definition, unprotected.

| Goal | What it means | The attack it loses to | Where it's defended later |
|---|---|---|---|
| **Confidentiality** | Only those authorized can read the data — *don't leak.* | Information disclosure: the data is read by someone who shouldn't (a leaked key, PII in a log, an unencrypted channel, a broken access check). | Encryption in transit (TLS) and at rest, least privilege, no secrets/PII in logs, server-side authorization. |
| **Integrity** | The data and the code are not altered by anyone unauthorized — *don't let it be tampered.* | Tampering: data changed in transit or at rest, a record forged, a transaction altered (the *T* and *R* of STRIDE). | Input validation, signing/HMAC, TLS, access control, audit logs for non-repudiation. |
| **Availability** | The system is up and serving its authorized users — *don't let it be knocked down.* | Denial of service: the system is made unreachable or unusably slow (a flood, a resource-exhaustion input, a dependency taken out). | Rate limiting, quotas, input limits, autoscaling and redundancy (the `stationkeeping` skill's resilience). |

The triad is not academic decoration; it is the *coverage check* for a threat model. When you run STRIDE at Model ([threat-modeling.md](threat-modeling.md)), each STRIDE letter maps to a CIA property it violates — and if your defenses cover confidentiality and integrity but you never asked "can this be knocked down," you have a blind spot the triad makes visible. The agent failure mode this guards against is the narrow one: an agent asked to "make it secure" reaches reflexively for confidentiality (encrypt the thing) and forgets that an unbounded input that exhausts memory is an availability breach, or that an unsigned update channel is an integrity breach. Frame the goal as all three, weighted to this system — a read-only public dataset prizes integrity and availability over confidentiality; a medical record prizes confidentiality above all — so the later stages defend the properties this system actually depends on, not just the one that comes to mind first.

---

## Crown jewels and data classification — point the defense at what matters

Absolute security is impossible and infinitely costly (the next section is the whole argument), so the first real move at Frame is to decide *where the defense goes*. That decision rests on naming the **crown jewels** — the handful of data assets and capabilities whose breach would actually hurt — and **classifying the data** so the defense concentrates on the sensitive and the regulated rather than spreading evenly over everything, which spreads thin over nothing.

**Name the crown jewels first.** These are the data and capabilities most worth protecting and most likely to be attacked: the user PII and credentials, the payment data, the secrets and signing keys, the customer database, the admin capability that can act on every account, the money-movement path. A defense that protects the crown jewels well and the brochure copy lightly is correctly sized; one that hardens the static marketing page while the password store sits in plaintext has spent its budget exactly backwards. The agent failure mode this guards against: the agent has no sense of which asset matters, so left to itself it defends uniformly (or, worse, defends the thing it happened to be working on) and leaves the actual jewels exposed because nothing in the task pointed at them.

**Then classify the data**, so every later stage knows how hard to defend each piece. A workable scheme — adapt the labels to the user's compliance regime, but keep the gradient:

| Class | What it is | Defense it earns |
|---|---|---|
| **Public** | Intended for anyone — marketing copy, published docs, open data. | Integrity and availability (don't let it be defaced or knocked down); confidentiality is moot. |
| **Internal** | Not secret, but not for outsiders — internal dashboards, non-sensitive operational data. | Access control to authenticated users; modest. |
| **Sensitive** | Business-confidential — pricing, source, internal financials, trade secrets. | Encryption, tight access control, audit. |
| **PII** | Personal data identifying a human — names, emails, addresses, behavior. | Encryption in transit + at rest, strict least-privilege access, minimization (collect/retain less), no PII in logs. |
| **Regulated** | Data under a legal regime — payment data (PCI DSS), health data (HIPAA), EU personal data (GDPR), and the like. | The above *plus* the specific controls the regime mandates — which the **user must name**, because only they hold authority on which regime applies. |

Two rules ride on this classification. First, **PII and regulated data raise the whole system's weight class** — a system that touches them cannot be sized as Light no matter how simple it looks, because the cost of *their* breach (legal, regulatory, reputational) is categorical, not proportional. Second, **the agent will not ask which regime applies** — it has no concept that "this is an email address" means GDPR obligations or that "this is a card number" means PCI scope; that is a judgment only the user can price, so surface the data classification and the compliance regime as explicit questions for them, and record the answer.

This is the input to the risk sizer, not a duplicate of it. The crown jewels you name and the data you classify here feed directly into **TREE 0** in [decision-tree.md](decision-tree.md) — the *crown jewels × exposure × threat* dial that reads off how much defense the whole system earns (Light / Medium / Heavy). Run that tree; do not re-derive it here. This file's job is to make sure the dials it reads — *what is worth protecting* — are named honestly before the tree turns them into a floor.

---

## The timeless principles — and the agent failure mode each guards

These are the principles you **bind at Frame and apply at every later stage** — the standard the threat model is built against, the design is judged against, and the code is reviewed against. They are not new; the security canon has taught them for decades. What changed is that they were *cultural knowledge transmitted with a sense of why* — a human builder felt the danger of a homemade cipher, felt the laziness of `*:*`, felt the unease of trusting a raw input — and that felt sense is exactly what the agent does not have (this is **SHIFT 1**, and its corollaries SHIFT 3–5, in [agent-era-shifts.md](agent-era-shifts.md)). So each principle below is paired with the specific agent failure mode it now has to be *enforced against*, not merely taught. Set them here; the later references turn each into concrete mechanism.

### Least privilege

Every identity, service, query, and credential gets **only the access it needs, and nothing more** — scoped from deny-all upward, not granted broadly and trimmed later (trimming never happens). The blast radius of any single compromised component is then bounded to what that one component could reach.

- **The agent failure mode it guards:** the agent **over-grants to clear an error.** The instant an `AccessDenied` blocks it, the cheapest path to green is to widen the permission to `*:*` — and it feels none of the wrongness a human felt, so the over-broad grant ships as a standing breach. Least privilege has to be the *enforced default posture* and a permission-widening a reviewed change, never a quiet fix. Depth at [secure-coding.md](secure-coding.md) (the wiring) and [agent-era-shifts.md](agent-era-shifts.md) SHIFT 5.

### Defense in depth

**No single control is the whole defense.** Layer independent controls — network, application, data, identity — so that a breach of any one layer does not hand over the system, because every layer is assumed breachable. A WAF *and* input validation *and* parameterized queries *and* least-privilege DB access; not any one of them trusted alone.

- **The agent failure mode it guards:** the agent **over-trusts its own structure** — a single check reads to it as "secured," and it has no instinct that the one control it wrote will be bypassed. Defense in depth has to be designed in deliberately, because the agent's natural output is a single happy-path gate with nothing behind it. Depth at [secure-design.md](secure-design.md) and SHIFT 4.

### Fail secure (default deny on error)

When something goes wrong — an exception, a timeout, an unreachable auth service, an unparseable token — the system **defaults to *deny*, not allow.** An authorization service that is down must refuse access, not wave requests through; a validation that throws must reject the input, not skip the check. Security must hold *on the error path*, which is the path least tested and most attacked.

- **The agent failure mode it guards:** the agent writes the **happy path** and treats the error path as cleanup, so its instinct on a failure is "let it through so the feature keeps working" — `except: pass` around an auth check, a fallback that grants on timeout. Fail-secure inverts that: the error path defaults closed. Depth at [secure-design.md](secure-design.md).

### Minimize the attack surface

The most secure component is the one that **isn't there.** Expose the fewest endpoints, ports, features, and dependencies the system actually needs; turn off and *delete* what you don't use — the unused debug endpoint, the dead feature flag, the dependency pulled in for one call, the open port. Every exposed thing is something an attacker can probe and you must defend.

- **The agent failure mode it guards:** the agent **adds, never subtracts.** It enables the extra option, leaves the scaffold endpoint in, keeps the dependency "just in case" — accreting surface with no felt cost, because removal earns no green reward. Minimizing attack surface is the deliberate subtraction the agent will never initiate. Depth at [secure-design.md](secure-design.md).

### No security through obscurity

A secret *design* is not a control. Assume the attacker **knows your system completely** — the source, the schema, the algorithm, the endpoints — and require that security holds anyway. "They won't find the hidden endpoint / won't guess our token format / won't reverse our scheme" is never a defense; the only thing that may be secret is a *key*, and keys are protected as secrets, not as obscure designs.

- **The agent failure mode it guards:** this is the principle behind **never invent crypto.** The agent will cheerfully generate a homemade encryption routine, token scheme, or auth flow — it produces plausible code fast and feels none of the danger, and the homemade primitive *looks* fine and passes a functional test while its fatal flaw is invisible without an expert attacker. Because the attacker is assumed to know the design, only **public, audited primitives** — whose security holds *with* the design known — are safe. The build-vs-buy fork that operationalizes this lives in [decision-tree.md](decision-tree.md) (and depth at [secure-design.md](secure-design.md)); the rule it enforces: anything whose subtle flaw is an exploit — crypto, authentication, authorization, session, randomness — is **bought, not built** (OAuth/OIDC, a KMS, argon2/bcrypt, the platform's crypto), never a scheme the agent generated. See SHIFT 4.

### Zero trust

**Verify every access; trust nothing by location.** A request is not safe because it came from "inside" the network, from another service, or from a previously-authenticated session — every access is authenticated and authorized on its own merits, at the point it happens. The old castle-and-moat model (hard perimeter, soft trusted interior) fails the moment the perimeter is crossed once; zero trust assumes the interior is already hostile.

- **The agent failure mode it guards:** the agent **trusts its input** — and "internal" input most of all. It treats a value from another service, an internal API, or its own earlier code as friendly and skips the check, which is exactly how a single foothold becomes lateral movement across the system. Zero trust makes "never trust input, anywhere" extend past the user to every boundary, internal ones included. This is **SHIFT 3**; depth at [secure-coding.md](secure-coding.md) and [threat-modeling.md](threat-modeling.md).

> The thread tying all six together is the governing fact at the top of this file: **assume the attacker knows the design and any single layer can fail.** Least privilege bounds the blast radius when a layer fails; defense in depth gives you more layers; fail-secure makes the failure deny; minimize-surface gives the attacker less to fail you on; no-obscurity forbids relying on the attacker's ignorance; zero trust refuses the free pass of location. They are six faces of one assumption.

---

## Security is risk management, not a quest for the absolute

The single posture that prevents both failure modes at the edges of this skill — *under*-securing the system that matters and *over*-securing the one that doesn't — is to treat security as **risk management, not a quest for the absolute.** Absolute security is impossible (any layer can fail, the attacker always learns) and its pursuit is infinitely costly; a system defended against every conceivable threat regardless of likelihood is a system that never ships and bankrupts its budget on threats no one would mount. The discipline is the same *够用就好* / match-rigor-to-risk restraint the whole suite runs on, applied to defense: **identify what is most worth protecting and most likely to be attacked, and put the defense there.**

That is what TREE 0 in [decision-tree.md](decision-tree.md) operationalizes — the crown jewels and classification from above, crossed with exposure and threat, sized to a Light / Medium / Heavy floor. A static brochure site does not earn a threat model, hard auth, and a pentest; a payments service handling PII earns all three and more. Sizing *up* a brochure site wastes effort; sizing *down* a payments service banks a breach. Frame's job is to make that sizing explicit and honest, then let the floor it produces drive every later stage.

Two corollaries of "risk management, not absolute" govern *how* you spend the budget once it's sized:

**Shift security left — DevSecOps.** Security is cheapest when caught early and most expensive when caught in production, the same "catch it early, surface it cheap" instinct the rest of the suite runs on (quality-left, red-means-stop). So the defense is woven through the lifecycle — a stance at Frame, a threat model at Model, controls at Design, secure code at Build, gates at Verify, defense and patching at Operate — rather than concentrated in one review near the end. The agent failure mode this guards: the agent equates green with done and would happily defer all of security to a final check, on a system whose every default was insecure — so the final check becomes the *first* time anything looked at security, and finds the expensive problems too late.

**Why bolt-on security fails — architectural weaknesses can't be patched in.** This is the reason "do it at the end" is not merely inefficient but structurally broken. The most damaging weaknesses are *architectural* — a missing trust boundary, an authorization model that checks in the UI instead of the server, a design that mingles privilege levels, a data flow that carries PII where it shouldn't. Those are decided at design time, and once the system is built around them they cannot be patched in afterward, only **rebuilt.** A late security review on such a system finds a hole that is expensive or impossible to close — which is exactly why this skill front-loads Model and Design as gated stages: the cheap, high-leverage security work happens *before* the structure hardens, on paper, where it can still change the design. Bolt-on security fails because by the time you bolt it on, the holes worth worrying about are load-bearing.

> **PREDICATE:** is a given defense earning its cost on *this* system — defending a named crown jewel against a plausible, material threat? **DEFAULT** on a coin-flip about whether a defense is worth it: size to the **higher** risk for anything touching data, money, safety, or compliance (an under-defended breach of regulated data is the catastrophic, irreversible error) and the lower risk elsewhere — the same asymmetry the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) bottoms out in. **FALLBACK** when you can't size the risk yet (unknown data sensitivity, unclear exposure, undeclared compliance regime): assume **Medium**, and make the classification and the regime explicit questions for the user — an unsized system defaults to "the agent secures it as little as the happy path required," which is precisely the failure mode this stance exists to prevent.

---

## How the security line threads every sibling skill

aegis is the **shield**, and it is cross-cutting by nature: security is not a stage that happens once but a *line that runs through every part of the lifecycle*, surfacing inside each sibling skill as that skill's security slice. Frame is where you confirm that line is live in each place — or find, in AUDIT mode, where it is only named. aegis owns the line and pulls the threads together; it does not replace the siblings' mechanics, it directs them toward defense.

- **`groundwork`** — security shows up first as **non-functional requirements**: what data is sensitive, which compliance regime binds, what an outage or breach would cost, what "secure enough" means for this system. The crown jewels and data classification you name here trace back to requirements groundwork should already have pinned; where they're missing, that is a gap to surface to the user.
- **`load-bearing`** — security becomes **trust boundaries and architecture**: where data crosses from less- to more-trusted, how privilege levels are separated, how the data model keeps PII contained. These are the architectural decisions that, if wrong, can't be patched in later — which is exactly why Design is gated. The threat model at Model consumes the boundaries `load-bearing` drew.
- **`flightline`** — security becomes **blocking CI gates**: SAST (static source analysis), secret-scanning at commit time, and SCA (dependency/supply-chain scanning). `flightline` runs the pipeline; aegis defines what it must enforce. Advisory scans an agent can ignore are not gates.
- **`assay`** — security becomes **security testing**: confirming each defense not only exists but is *tested* — that a hostile input is actually rejected, that a forged authorization request is actually denied. A vulnerability passes every functional test, so the test design has to deliberately include the adversarial case.
- **`stationkeeping`** and **`husbandry`** — security becomes **runtime defense and continuous patching**: detection and alerting on attacks and anomalies (the security slice of `stationkeeping` observability), and tracking disclosed CVEs to upgrade vulnerable dependencies promptly (the security form of `husbandry`'s don't-drift-to-EOL — an unpatched known vulnerability is a standing breach).
- **`gauge`** — security depends on the **legible, hard-to-fake signal** `gauge` engineers: a security gate is only a gate if it blocks and can't be quietly weakened, and a runtime attack is only caught if the signal that reveals it is clear rather than buried. The same "green must mean what it claims" discipline that `gauge` enforces is what keeps a security gate honest.

And aegis is one half of a pair. A shield is only proven against a spear, so what aegis *builds*, the **`gungnir`** skill *attacks* — authorized penetration testing, the adversarial creativity that chains small flaws into a real exploit and abuses business logic, which no scanner and no functional test will ever find. Where this skill reaches the point that the right next move is to *attack* the system rather than defend it, it hands off to `gungnir` by name; this file and the references it links describe how to build the shield, not how to wield the spear. The two are the shield-and-spear pair: aegis owns the defensive line through the lifecycle, and `gungnir` is the sharpest spear thrown against the hardest shield to prove it holds.

The thread: for an agent the lever is the same as everywhere in the suite — every one of its defaults is the insecure one, and a vulnerability ships green and is reported as done, so security must be **woven in and gated**, not trusted to an instinct it does not have. That is the stance Frame sets and the gate `security-stance-set` enforces; carry the crown jewels, the classification, the CIA goal, and the six principles into STAGE 1, where the abstract attacker becomes a concrete threat model.

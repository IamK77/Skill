# Agent-Era Shifts in Security

This is the heart of `aegis` — the seven ways securing a system changes once an agent (or a fleet of them) writes the code, designs the interfaces, and wires the permissions, and a human-in-the-loop only sets the risk tolerance, holds authority, and owns the breach when it comes. It is opened at **STAGE 0 (Frame)** alongside [decision-tree.md](decision-tree.md) and kept open at **every GATE**: before you certify a stage, re-read the shift that governs it. The classic security canon — least privilege, defense in depth, threat modeling, never trust input, never invent crypto, patch continuously — is all still correct; it was written for engineers who felt a flicker of wrongness pasting a key into a file, who carried a rough threat model in their head, and who knew that a clever-looking auth scheme was probably a trap. None of those instincts survive contact with an agent. This reference re-aims each practice for a builder that **writes the insecure pattern by default, has no attacker in its head, trusts every input as friendly, invents crypto without fear, over-grants to clear an error, and ships a vulnerability green because nothing red ever stopped it.** The other references teach you *how* to do each piece — [principles-and-stance.md](principles-and-stance.md), [threat-modeling.md](threat-modeling.md), [secure-design.md](secure-design.md), [secure-coding.md](secure-coding.md), [security-testing-and-gates.md](security-testing-and-gates.md), [operate-and-respond.md](operate-and-respond.md). This one names *what is different about the work now*, and ties every shift to the exact gate that enforces it. Read it as a pre-flight scan and a cockpit checklist, not an essay.

---

## AGENT-ERA PRE-FLIGHT — run this one line before you secure anything

> **For the system in front of you, name what an attacker would want and ask of every defense: "is this enforced and tested — or am I trusting that no one tried yet?"** A vulnerability is not a failure that shows up red; it is the *absence of an attack so far*. It passes every functional test, lights every dashboard green, and a green-optimizing agent ships it believing the job is done — until someone attacks it, which is the first and only time the system was ever really tested for security. The whole job of this skill is to move security out of "looks fine / no one's complained" and into "threat-modeled, designed-in, coded against untrusted input, gated by SAST/DAST/SCA, attacked by `gungnir`, and patched forever." **Security is woven in, never bolted on — and green is not secure.** Assume the attacker knows your system completely and that any one layer can fail. Everything below is a consequence of that.

---

## How each card is built

Every shift is a cheat-sheet card with four fixed fields, so you can scan it at a gate in seconds:

- **HUMAN-ERA ASSUMPTION** — the textbook premise, true when the builder felt a flicker of risk and carried a rough threat model.
- **WHAT CHANGED IN THE AGENT ERA** — the specific habit it OVERTURNS or SHARPENS, and why the agent breaks it.
- **THE DESIGN CONSEQUENCE** — what this forces you to build into the security process instead of trust.
- **DO THIS** — one literal move you execute, phrased for an agent securing a system on a human's behalf.

Decision forks inside a card use the same engine as the other references: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When ambiguity climbs past those, take the [escalation ladder](#escalation-ladder--when-the-call-is-unclear) at the end.

---

## SHIFT 1 — Security is woven in, or it isn't there → the root shift

> **If you internalize only one card, internalize this one — every other card is a corollary.** Gate: [`security-stance-set`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Security could be a phase — a review near the end, a checklist before launch — because a careful engineer was building defensively *along the way* out of instinct, so the final check was a backstop on mostly-secure work. Bolt-on security was a known anti-pattern, but a team of conscientious humans got a lot of security "for free" from people who felt the risk as they coded. |
| **WHAT CHANGED IN THE AGENT ERA** | There is no defensive instinct underneath to back-stop. The agent writes the *insecure* pattern by default and gets nothing for free, so a security phase tacked on at the end is checking work that was never secure to begin with — and the most damaging weaknesses are **architectural**, decided at design time, where a late check finds them only when it is expensive or impossible to fix. This **SHARPENS "shift security left" from best practice into the entire architecture of the skill**: security has to be present and *enforced* at every stage, because nothing secure happens between the gates on its own. |
| **THE DESIGN CONSEQUENCE** | Security is a line through the whole lifecycle, gated stage by stage (frame → model → design → build → verify → operate), not a checkpoint. And because absolute security is impossible and infinitely costly, the line is steered by **risk**: name the crown jewels (the data/capabilities most worth protecting), size the threat and exposure, and concentrate defense there. Match total ceremony to what a breach of *this* system would actually cost — a brochure site and a payments service are not the same. |
| **DO THIS** | At Frame, name what is worth protecting and classify the data (sensitive / PII / regulated), set the timeless principles as the standard for every later stage, and size the defense to the risk. Treat any property you care about (confidentiality, integrity, availability) and cannot point to a *enforced* control for as unprotected — build the control or accept the risk in writing. |

> Anti-pattern this card kills: **"we'll do a security review before launch."** With an agent writing the code, that review is the *first* time anything checked security — on a system whose every default was the insecure one.

---

## SHIFT 2 — The agent has no threat model → make the attacker explicit

> Gate: [`threat-model-built`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A decent engineer carried a rough threat model in their head — building a login form, they half-consciously thought "someone will try to brute-force this, someone will try SQL in the username," and defended accordingly. Formal threat modeling sharpened that instinct; it did not create it from nothing. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent has **no attacker in its head at all.** It builds the function it was asked for, against the inputs it expects, for the user it imagines — a cooperative one. It does not spontaneously ask "who would abuse this, and how," because that question yields no green reward and is not implied by the task. So the entire adversarial perspective — the cheapest, highest-leverage security work there is — simply does not happen unless it is a required, explicit step. This **takes threat modeling from a sharpening of instinct to the sole source of the adversarial view.** |
| **THE DESIGN CONSEQUENCE** | Threat modeling must be an explicit gated stage, done **on paper, early**, before the design hardens. Use a structured prompt so coverage doesn't depend on imagination the agent lacks — **STRIDE** over the data flow, **trust boundaries** marked where data crosses from less- to more-trusted, the **attack surface** enumerated (every endpoint, port, input, dependency), threats ranked by risk. The output is a map of what to defend that the design and build stages consume. |
| **DO THIS** | At Model, run STRIDE across the system's data-flow diagram. For each element ask the six questions (can it be spoofed, tampered, repudiated, leak information, be denied, be elevated). Draw the trust boundaries and list the attack surface explicitly on the architecture. Rank by risk (likelihood × impact) so defense lands where it matters. Pull in the `load-bearing` trust boundaries and the `groundwork` security requirements as inputs. |

> Anti-pattern this card kills: **building only the happy path.** The agent's default user is friendly; the threat model is the only place the hostile one is ever considered.

---

## SHIFT 3 — The agent trusts its input → never trust input, anywhere

> Gates: [`input-never-trusted`](#gate-map), [`vuln-classes-defended`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "Validate your inputs" was discipline a good engineer mostly followed, with a felt unease about data crossing a trust boundary unchecked — they knew a raw string from a user was dangerous near a SQL query or an HTML page, and reached for the parameterized query or the encoder by reflex on the paths that mattered. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent treats input as **friendly by default.** It writes the path that works for the expected value, and validation/encoding is friction with no green reward, so it concatenates the user string into the SQL, drops it into the HTML, passes it to the shell — because that *works* for the cooperative input it was imagining, and the injection only appears when a hostile input arrives. The two highest-impact vulnerability classes in existence — **injection and XSS** — are, at root, this single shift: the agent trusting input it should never trust. |
| **THE DESIGN CONSEQUENCE** | "Never trust user input" becomes a hard, enforced rule applied at **every boundary**, not a discipline. Every external input is validated where it enters; and the dangerous sinks are defended *by construction* — **parameterized queries** so input can never be interpreted as SQL/command, **output encoding** so it can never be interpreted as markup, server-side checks so it can never bypass authorization. The OWASP Top 10 is, in large part, the catalog of what goes wrong when this shift is unguarded; defending each class is the concrete form of "never trust input." |
| **DO THIS** | At Build, treat every external input (form fields, URL params, headers, API bodies, file uploads, even data from another service) as hostile until validated at the boundary. Use parameterized queries everywhere — never string-build SQL or a shell command from input. Output-encode user content for its context (HTML, attribute, JS, URL). Walk the OWASP Top 10 ([secure-coding.md](secure-coding.md)) and confirm the defense for each. Then let `gungnir` try to inject anyway. |

**Decision fork — is this input safe to use as-is?**

- **PREDICATE:** did this value originate inside your trust boundary and remain unmodified by anything outside it?
- **DEFAULT** on a coin-flip: **treat it as untrusted** — validate and encode it. The cost of validating safe input is nil; the cost of trusting hostile input is an injection.
- **FALLBACK** when you can't trace its origin: assume it crossed a trust boundary — validate at the point of use; an input whose provenance you can't prove is, by default, attacker-controlled.

---

## SHIFT 4 — The agent invents crypto and over-trusts its own design → use vetted primitives, layer defenses

> Gate: [`defenses-and-trust-boundaries`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | Engineers were taught — often by scar tissue — **never to roll their own crypto**, and a good one felt the danger in a homemade auth scheme and reached for the vetted library. They also understood, roughly, that one defense is not enough, and that "no one will figure out our trick" is not security. The principles were cultural knowledge, transmitted with a sense of *why*. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent will **cheerfully generate a custom encryption routine, a homemade token scheme, or a bespoke auth flow**, because it can produce plausible code fast and feels none of the danger — the homemade crypto *looks* fine and passes a functional test, and its fatal weakness is invisible without an expert attacker. It also over-trusts its own structure: a single check reads as "secured," and it has no instinct that the attacker is assumed to know the design (so obscurity protects nothing). This **takes "don't invent crypto / don't rely on obscurity / layer your defenses" from transmitted wisdom to rules that must be enforced against a builder that will break all three without noticing.** |
| **THE DESIGN CONSEQUENCE** | Security-critical primitives are **bought, not built**: public, audited algorithms and battle-tested libraries for crypto, authentication, authorization, session management — never a scheme the agent generated. Authorization is enforced **server-side on every request**, never by a hidden control. **Defense in depth** is designed in — no single layer is the whole defense, every layer assumed breachable — and the system **fails secure** (errors default to deny). All of it assumes the attacker knows the design completely (**no security through obscurity**), so it must hold anyway. |
| **DO THIS** | At Design, for anything security-critical, **pick a vetted library/standard and forbid the homemade version** — if the agent wrote a crypto or auth primitive, that is the finding. Enforce authz server-side on every request. Layer independent defenses so a single bypass isn't game-over. Make the failure path *deny*. Assume your source is public and check the design still holds. |

**Decision fork — build or buy this security-critical primitive?**

- **PREDICATE:** is this crypto, authentication, authorization, session, or randomness — anything whose subtle flaw is an exploit?
- **DEFAULT** on a coin-flip: **buy** — a public, audited, widely-used implementation. The space of subtle, exploitable mistakes is vast and invisible to a functional test; you will not out-design the field, and the agent certainly won't.
- **FALLBACK** when no vetted option seems to fit: that is almost always a sign you've mis-scoped the need — re-frame to a standard one (OAuth/OIDC, a KMS, argon2/bcrypt, the platform's crypto) before ever hand-rolling; escalate to the user rather than invent.

---

## SHIFT 5 — The agent leaks secrets and over-grants → machine-enforce least privilege

> Gate: [`secrets-and-least-privilege`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | "Don't commit secrets" and "grant least privilege" were discipline — a human felt a flicker of wrongness hard-coding a key or logging a password, and granting `*:*` felt lazy and dangerous even when it was expedient. The `.gitignore` and the IAM review were backstops to mostly-careful judgment. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent feels **no wrongness** doing either, and both are its cheapest path to a green result. To make something work *now*, it will hard-code a real key, paste a token into config, log the whole request (PII and all) to debug, and widen a permission to `*:*` the moment an `AccessDenied` blocks it. None of these turn anything red; all of them ship. This **takes "guard your secrets and scope your permissions" from discipline you trust to rules you can no longer trust to the actor doing the work.** |
| **THE DESIGN CONSEQUENCE** | Both become **machine-enforced**, not norms. Secrets are injected at runtime from a manager/vault, never in code, an image layer, or a log — and a secret-scanning gate blocks the commit (`flightline`) while telemetry redaction keeps them out of logs (`stationkeeping`/`gauge`). **Least privilege** is the default posture: every identity, service, query, and credential scoped from **deny-all** to exactly what it needs, with access audited, and a permission-widening treated as a reviewed change, not a quiet fix. |
| **DO THIS** | At Build, keep every secret in a manager and inject it; never hard-code or log one (redact PII/credentials in telemetry). Scope every permission from deny-all and add only what a real use proves necessary; when an `AccessDenied` appears, *narrow the need*, don't widen the grant. In review, treat a hard-coded secret or a `*:*` grant as a blocking finding. |

> Anti-pattern this card kills: **"widen the permission / paste the key to make it work."** Both clear the error and ship a standing breach the agent felt no reason to avoid.

---

## SHIFT 6 — A vulnerability ships green → gate it and attack it

> Gates: [`security-testing-gated`](#gate-map), [`vuln-classes-defended`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | A failing test meant "fix the code," and a human's own judgment — "wait, could this be abused?" — lived outside the test suite as a backstop. Security testing (SAST, the occasional pentest) was a useful supplement to engineers who were already thinking, at least sometimes, about misuse. |
| **WHAT CHANGED IN THE AGENT ERA** | The agent equates **green with done**, and a vulnerability produces *no red*. Functional tests pass, the dashboard is green, the feature works — and the security hole sits there invisibly, because it is the absence of an attack, not a failed assertion. There is no judgment outside the suite to catch it; the agent's only signal is the light, and the light says ship. This **takes security testing from a supplement to the *only* thing standing between an insecure default and production** — and makes the integrity of those gates paramount, since an agent facing a security gate will "fix" it the same way it fixes any red (suppress, weaken, skip) if it can. |
| **THE DESIGN CONSEQUENCE** | Security must be made *visible as a gate*: **SAST** (static source), **DAST** (running app), and **SCA** (dependencies/supply chain) automated into CI as **blocking** checks on every commit, plus fuzzing where input handling is critical — advisory scans an agent ignores are not gates. The known classes are walked as a checklist (OWASP Top 10 / ASVS) so each defense is confirmed *and tested*. And because scanners only find *known patterns* and never chain small flaws into a real exploit or abuse business logic, the system must also be **attacked adversarially** — which is the `gungnir` skill's job. Scanning is necessary; the spear is what proves the shield. |
| **DO THIS** | At Verify, gate SAST/DAST/SCA blocking in the pipeline (`flightline` runs it; you define what it enforces). Walk the OWASP Top 10 and confirm each class is defended and has a test. Put the security-gate config under review so it can't be quietly weakened. Then hand off to `gungnir` for the adversarial attack the scanners cannot do — and treat "the scan was clean" as necessary, never as "secure." |

> Anti-pattern this card kills: **"the scan passed, so we're secure."** A clean scan means the *known patterns* weren't found; the exploit chain and the logic flaw are exactly what it can't see — and what `gungnir` is for.

---

## SHIFT 7 — Security is never done → defend, patch, and respond continuously

> Gates: [`runtime-defense-and-patching`](#gate-map), [`incident-response-ready`](#gate-map).

| Field | Content |
|---|---|
| **HUMAN-ERA ASSUMPTION** | After launch, a responsible team kept half an eye on security — noticed a weird spike, applied the urgent patch, knew roughly who to call if something went wrong. Security decayed slowly and a conscientious human arrested the decay by ongoing attention and a sense of duty to the running system. |
| **WHAT CHANGED IN THE AGENT ERA** | New vulnerabilities are disclosed **every day**, and every change the agent makes can open a fresh hole — while the agent has **no ongoing attention and no felt duty** to a system it isn't currently asked to change. It will leave a disclosed CVE unpatched in a dependency (an upgrade is friction with no green reward), miss the attack in progress (it reads quiet logs as safe — the `stationkeeping` silence-is-health trap, in security form), and improvise badly in a breach because nothing remembers how to respond. This **takes "keep an eye on security" from a duty you trust to a continuous, externalized practice that must be wired up.** |
| **THE DESIGN CONSEQUENCE** | Security after launch is **continuous and instrumented**: runtime detection and alerting on attacks/anomalies (the security slice of `stationkeeping` observability), security-event logging, audited least-privilege access — *plus* relentless **patching**: track disclosed CVEs and upgrade vulnerable dependencies promptly (`husbandry`'s don't-drift-to-EOL, where an unpatched known vuln is a standing breach). And a **rehearsed incident-response plan** — detect → contain → eradicate → recover → learn — run **blameless** so a breach surfaces fast instead of being hidden. |
| **DO THIS** | At Operate, wire security monitoring/alerting and security-event logging. Track CVE feeds for your stack and patch vulnerable dependencies on a cadence, not when forced. Write and *rehearse* an incident-response runbook (detect/contain/eradicate/recover/learn); run the postmortem blameless. Treat an unpatched known vulnerability and an un-rehearsed response plan as the same kind of standing risk. |

> Anti-pattern this card kills: **"we secured it at launch."** Security is a moving target — new CVEs, new changes, new attacks — and a one-time hardening is stale within weeks.

---

## GATE MAP

*Each shift mapped to the exact `.checklist.yml` check it governs.*

Read down this table at the corresponding GATE: it tells you which shift you are actually enforcing and what "done" means for a system secured by an agent. The checks are the contract; the shifts are *why* the contract reads the way it does.

| Stage | Check ID | Primary shift(s) | What it enforces, agent-era framing |
|---|---|---|---|
| frame | `security-stance-set` | **SHIFT 1** | Security woven through the lifecycle, sized to risk (crown jewels, data classification); the timeless principles set as the standard — because nothing secure happens between gates on its own and the agent's defaults are all insecure. |
| model | `threat-model-built` | **SHIFT 2** | STRIDE over the data flow, trust boundaries and attack surface marked, threats ranked — because the agent has no attacker in its head and builds only the happy path. |
| design | `defenses-and-trust-boundaries` | **SHIFT 4** | Vetted crypto/auth (never invented), server-side authz, defense-in-depth, fail-secure, no security-through-obscurity — because the agent rolls its own primitives and over-trusts its design. |
| build | `input-never-trusted` | **SHIFT 3** | Every input validated at the boundary; injection/XSS/broken-access-control defended by construction (parameterized queries, output encoding, server-side checks) — because the agent trusts input as friendly. |
| build | `secrets-and-least-privilege` | **SHIFT 5** | Secrets injected from a manager (never in code/logs); least privilege from deny-all — because the agent hard-codes keys and widens to `*:*` to clear an error, feeling no wrongness. |
| verify | `security-testing-gated` | **SHIFT 6** | SAST/DAST/SCA + fuzzing as blocking CI gates — because a vulnerability ships green and the agent never seeks it; advisory scans aren't gates. |
| verify | `vuln-classes-defended` | **SHIFT 6**, SHIFT 3 | OWASP Top 10 walked as a tested checklist, and the adversarial attack handed to `gungnir` — because scanners find known patterns but not the exploit chain or logic flaw. |
| operate | `runtime-defense-and-patching` | **SHIFT 7** | Runtime detection/alerting + continuous CVE patching — because security decays daily and the agent has no ongoing duty to patch or watch. |
| operate | `incident-response-ready` | **SHIFT 7** | A rehearsed, blameless detect→contain→eradicate→recover→learn plan — because nothing remembers how to respond and a breach must surface fast, not hide. |

---

## ESCALATION LADDER — when the call is unclear

When a DEFAULT and FALLBACK inside a card don't resolve the question — is this input trusted, build or buy this primitive, is this residual risk acceptable — climb one rung at a time rather than guessing silently (guessing is exactly the move an agent makes, and a wrong security guess is a breach, not a bug):

```
pick the DEFAULT for a clearly low-risk, reversible security choice
   → wrapped: make the safe choice the default (validate by default, deny by default, the vetted library)
      → test it: have it attacked — a SAST/DAST run, or `gungnir` against it in staging — before you trust it
         → ask the user one sharp question — they hold authority on what data matters, what a breach costs,
           which compliance regime applies, and what residual risk is acceptable (the build-vs-buy call,
           the trust-this-input call, and the accept-the-risk call all bottom out here)
            → if still unresolved, default to the MORE secure, fail-closed option (deny, validate, buy the
              vetted primitive, patch now) and record the residual as security risk for the user to accept in writing.
```

The asymmetry that governs the whole ladder: **an over-cautious security choice costs the agent some minutes or a little friction; a trusted hostile input, an invented cipher, or an unpatched CVE costs you a breach the agent will have shipped green and reported as done.** When the call is genuinely a toss-up, err toward the fail-closed, vetted, defended option. See [decision-tree.md](decision-tree.md) for sizing the defense to the risk and the build-vs-buy and OWASP routers, [../SKILL.md](../SKILL.md) for the stage order, and the `gungnir` skill for attacking what you build here to prove it holds.

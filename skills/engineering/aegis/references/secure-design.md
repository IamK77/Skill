# Secure Design — Build the Defenses Into the Structure

This reference is the depth behind **STAGE 2 — Design** of the [../SKILL.md](../SKILL.md) flight plan, the stage where the threat model becomes structure: authentication and authorization that are designed rather than improvised, the trust boundaries from the model turned into enforced controls, defense in depth layered so no single bypass is game-over, a system that fails secure, secure defaults, and the hard rule that you never invent crypto or a core security primitive. Design is the highest-leverage and most dangerous security stage, because **the worst weaknesses are architectural — they cannot be patched in later, only rebuilt.** A late check finds an architectural hole only when it is expensive or impossible to fix; the design stage is where the most damaging holes are either prevented or created.

The human-era → agent-era shift this file governs: a good engineer felt the danger in a homemade auth scheme and reached for the vetted library, understood roughly that one defense is not enough, and knew "no one will figure out our trick" is not security. None of those instincts survive contact with an agent. The agent will **cheerfully generate a custom encryption routine, a homemade token scheme, or a bespoke auth flow** — it produces plausible code fast and feels none of the danger — and it **over-trusts its own structure**: a single check reads to it as "secured." See [agent-era-shifts.md](agent-era-shifts.md), **SHIFT 4 (the agent invents crypto and over-trusts its own design)**, for *why* this is structural; this file is the *how*. It backs one gate:

- **`defenses-and-trust-boundaries`** — vetted crypto/auth (never invented), authorization enforced server-side on every request, defense in depth, fail-secure, secure defaults, and minimized attack surface, all assuming the attacker knows the design.

The governing fact this stage inherits from [decision-tree.md](decision-tree.md), which overrides every default below:

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail. When a design fork is a real toss-up, err toward the **fail-closed, vetted, defended** option.

Decision forks here use the same engine as the rest of the suite — **PREDICATE** (the question that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet). When a fork won't resolve, climb the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear).

---

## Authentication vs authorization — two distinct decisions, both designed

These are routinely conflated, and conflating them *is* a vulnerability. They answer two different questions:

| | **Authentication (authn)** | **Authorization (authz)** |
|---|---|---|
| Question | **Who are you?** Prove your identity. | **What may you do?** Decide if *this* identity may take *this* action on *this* resource. |
| STRIDE threat it counters | **S**poofing | **E**levation of privilege |
| Happens | once per session, at the edge | **on every request**, at every protected action |
| Gets it wrong | impersonation, account takeover | broken access control / IDOR — the most common serious web vuln |
| You design it with | a vetted identity framework (OAuth/OIDC + an IdP), MFA, secure sessions | a server-side check against the *actual* user, deny-by-default |

A system can have flawless authentication and still be wide open: it knows exactly who you are and lets you read everyone else's records anyway. Design the two separately, and never let one stand in for the other.

### Authentication — adopt a framework, never hand-roll the flow

**Authentication is a buy, never a build** (see [the build-vs-buy fork below](#never-invent-crypto-or-a-core-security-primitive)). The agent failure mode here is direct: asked to "add login," an agent will *invent* a credential-checking and session flow that looks fine and passes a functional test, with subtle fatal weaknesses (timing leaks, missing rate limits, weak session tokens, no MFA path) invisible without an expert attacker.

- **Identity via a vetted framework / provider** — **OAuth 2.0 / OIDC** against a real identity provider (your IdP, or a managed service), or a battle-tested auth library for the platform. The framework owns the protocol; you own the configuration.
- **Password storage, if you must store passwords at all, uses a slow, salted password hash** — **argon2** (preferred), **bcrypt**, or **scrypt** — never a fast general-purpose hash (MD5/SHA-x), never plaintext, never reversible encryption. The agent will reach for the fast hash because it "hashes the password" and the test passes; the weakness only appears under an offline cracking attack. (This is the same never-invent-crypto rule applied to the most common primitive.)
- **MFA where the crown jewels earn it** (TREE 0 Medium/Heavy) — a second factor for privileged or sensitive accounts.
- **Secure session management** — session tokens that are high-entropy, server-validated, rotated on privilege change, and expiring; transported in cookies marked `HttpOnly`, `Secure`, and `SameSite` (the cookie hardening detailed in [secure-coding.md](secure-coding.md) for CSRF). A session that never expires and a token guessable across users are both designed-in holes.

### Authorization — enforced server-side, on every request, against the actual user

This is the single defense an agent most reliably gets wrong, because the insecure version *works on the happy path*. The rule is absolute:

> **Every protected action checks authorization server-side, on every request, against the identity actually making the request — and denies by default.**

Three failure modes to design out, each a form of **broken access control** (OWASP) and each one an agent writes by default:

- **Hiding a UI control is not authorization.** Removing a button, greying a menu, or omitting a link from the page changes only what the *cooperative* user sees. The attacker calls the endpoint directly. If the server does not re-check, the action goes through. *Never gate access by hiding a control — gate it in the handler.*
- **IDOR (Insecure Direct Object Reference)** — the handler trusts an identifier from the request (`/invoice/1043`, `account_id` in the body) and returns or mutates that object *without checking the requesting user owns or may access it*. The agent writes "fetch object by id and return it" because that is the obvious path and it is correct for the user it imagined. Defense: **every object access is scoped to the authenticated principal** — the query itself filters by owner/tenant, or an explicit ownership check precedes the action. Authorize the *(user, action, object)* triple, never just the action.
- **Forced browsing / missing function-level authz** — an admin or internal endpoint with no authz check because "only admins know the URL." Obscurity is not a control (the design is assumed known). Every endpoint declares who may reach it; an endpoint with no explicit authz is a hole.

**Decision fork — does this request reach a protected action?**
- **PREDICATE:** does this handler read, mutate, or trigger anything that is not public to every anonymous caller?
- **DEFAULT** on a coin-flip: **treat it as protected** — require an authenticated principal and check authorization server-side against the specific object. The cost of an over-checked public read is negligible; the cost of an under-checked private action is broken access control.
- **FALLBACK** when you can't tell who should be allowed: **deny-by-default** and make "who is authorized for this" an explicit question for the user — they hold the authority on what data matters. Do not ship an open endpoint while you decide.

A useful litmus for the gate: a test that takes user A's session and tries to read user B's object must get **403/404, not 200**. If no such test exists, the authz control is `claimed`, not `enforced` (the status taxonomy in [decision-tree.md](decision-tree.md)) — and a UI-only check is `present-unenforced`, the most dangerous status of all.

---

## Enforce the trust boundaries the threat model drew

[threat-modeling.md](threat-modeling.md) produced a map: the **trust boundaries** (every place data crosses from less-trusted to more-trusted) and the **attack surface** (every exposed endpoint, port, input, dependency). STAGE 1 *found* them; STAGE 2 *enforces* them. A boundary that is drawn on a diagram but not realized as a control in the structure is decoration — and the agent, having no attacker in its head, will pass data across a boundary unchecked because the data was correct for the cooperative caller it imagined.

For each boundary the model marked, the design must place an enforced control on the trusted side:

- **At the network/process edge** — authentication and input validation happen *as data enters the more-trusted zone*, not deep inside where the code already assumed it was clean. Validate at the boundary (depth in [secure-coding.md](secure-coding.md)); the design's job is to ensure there is a single, unavoidable place that validation lives.
- **Between services** — a request arriving from another internal service is still crossing a boundary if that service is less trusted or independently reachable. **Zero trust**: do not grant a request more authority because of *where* it came from; authenticate and authorize service-to-service calls too. "It's internal" is not a trust decision an agent should make for you.
- **Into a dangerous sink** — the boundary just before a SQL query, a shell, an HTML response, or an outbound request (SSRF) is where input stops being data and can become code. The design ensures the sink is reached only through a safe construction (parameterized query, encoder, allowlist) — covered in [secure-coding.md](secure-coding.md); the design names *which* sinks exist and *which* boundary guards each.

The enforced control on every boundary makes "trust boundary" executable rather than a comment, the way the threat model intended.

---

## Defense in depth — layer independent controls, assume every layer breaches

**No single control is the whole defense.** Design so that a bypass of any one layer is not game-over — every layer is assumed breachable, because the governing fact says any single layer can fail. This is the structural antidote to the agent's over-trust in its own design: it reads a single check as "secured" and has no instinct that the one check might be wrong, disabled, or bypassed.

The discipline that makes layering *real* rather than redundant: the layers must be **independent** — a single mistake, a single shared assumption, must not defeat all of them at once. Two checks that both call the same flawed `is_authorized()` are one layer wearing two hats.

A worked example — protecting a sensitive record — shows independent layers stacking, each assuming the one outside it failed:

| Layer | Control | What it assumes failed above it |
|---|---|---|
| Network | the data store is not publicly reachable; segmented | the app could be compromised |
| Authentication | the request carries a valid, current identity | a token could be stolen |
| Authorization | server-side check that *this* user may access *this* record | authn could be spoofed |
| Data | the query is scoped to the owner/tenant; row-level isolation | the authz check could be wrong |
| At-rest | the field is encrypted; the key is in a KMS | the store could be exfiltrated |
| Detection | access is logged and anomalies alerted (`stationkeeping` slice) | every control above could be silently bypassed |

Each layer is independently sufficient to stop *some* attacks and independently insufficient against all; together they mean an attacker must defeat several unrelated controls, and a defender gets a signal (the detection layer) even when the preventive ones fail.

**Decision fork — does this control need a second, independent layer behind it?**
- **PREDICATE:** if this single control is bypassed (a bug, a misconfig, a stolen credential), is a crown jewel directly exposed?
- **DEFAULT** on a coin-flip: **add the independent layer** — the cost is a little structure; the cost of a single-point-of-failure on a crown jewel is the breach.
- **FALLBACK** when you can't tell what's behind it: assume nothing is, and design the next layer in; an undetermined depth defaults, for an agent, to "one check, and it's fine."

> The point of layering is not paranoia for its own sake — it is sized to risk (TREE 0 in [decision-tree.md](decision-tree.md)). A Light system earns one solid layer on the boundary; a Heavy system earns the full stack, proven. Match the depth to the crown jewels, *够用就好*.

---

## Fail secure — on error, default to deny

When something breaks — an exception, a timeout, a dependency outage, an unparseable input — the system must default to **deny, not allow**. This is **fail-closed**, and it is a design property of the control flow, not an afterthought you add in a `catch`.

The canonical case: **an authorization or authentication service that is down must refuse access, not wave it through.** The insecure version — `try { return authz.check(user, obj) } catch { return true }` — is exactly what an agent writes to "make the error go away," because returning `true` clears the exception and the happy path keeps working. It is a standing breach: every outage of the auth service becomes an open door. The fail-secure version returns *deny* on any failure to *prove* allow.

Design fail-closed as a structural default:

- **The trusted branch is reachable only when the check explicitly returned ok.** No code path lands on "allowed" by falling through, timing out, or catching an error. Where the platform allows it, make the unverified state *un-representable* — the type or the control flow does not offer an "allowed" value unless a successful check produced it — so an agent cannot accidentally route around the check (this is the legible-failure discipline the `gauge` skill installs, in its security form).
- **Errors deny and are logged**, not swallowed into a permissive default. A denied request on a transient failure is a momentary annoyance; an allowed request on a failure is an exploit.
- **The one deliberate exception is availability-of-the-non-sensitive** — a read-only public enrichment path may degrade-and-serve rather than hard-fail, because nothing protected rides on it. *Anything touching auth, money, or data integrity fails closed.* When the policy for a dependency is unclear, fail closed.

This is the design echo of the [decision-tree.md](decision-tree.md) rule "deny over allow, validate over trust" — applied to the *failure* path, which is the path the agent never designs because the failure is invisible to a passing test.

---

## Never invent crypto or a core security primitive

The most dangerous single fork at this stage, and the one **SHIFT 4** names directly: the agent will invent a cipher, a token scheme, a signature check, or a randomness source without fear, because the homemade version *looks* fine and passes a functional test. This fork lives in full in [decision-tree.md](decision-tree.md) (the build-vs-buy decision) — cross-link there, do not re-derive it. The depth that belongs here is the **why** and the **what**.

**The PREDICATE** (from that fork): is this crypto, authentication, authorization, session management, password storage, tokens, or randomness — *anything whose subtle flaw is an exploit?* If yes, **buy/adopt a public, audited, widely-used implementation; never the agent's homemade version.** **DEFAULT** on "is it security-critical enough?": **buy.** **FALLBACK** when no vetted option seems to fit: that almost always means the need is mis-scoped — re-frame to a standard one before ever hand-rolling, and escalate to the user rather than invent.

**The why — what makes this category special.** For ordinary application logic, a functional test that passes is strong evidence the code is right. For a security primitive, **it is no evidence at all.** The space of subtle, exploitable mistakes is *vast and invisible to a functional test*: a constant-time comparison that isn't, a nonce reused, an IV that's predictable, a padding oracle, an `alg:none` accepted, a signature checked against the wrong key. The homemade primitive encrypts, the token round-trips, the login succeeds — and it fails only against an expert attacker probing exactly the failure mode the author never imagined. You will not out-design the cryptographic community, and an agent — which feels none of the danger and has no attacker in its head — certainly will not. This is also why the rule ties straight to **no security through obscurity**: the design is assumed known to the attacker, so a scheme that is only safe while secret is not safe; a publicly-audited primitive is one whose security holds *with the design fully known*, which is the only kind that holds at all.

**The what — adopt these, forbid the homemade version:**

| Need | Adopt (audited) | The homemade version an agent writes |
|---|---|---|
| Encrypting data / managing keys | a **KMS** / the platform's vetted crypto library (libsodium, the language's standard crypto) | a custom cipher, a hard-coded key, ECB mode, a reused IV |
| Password storage | **argon2 / bcrypt / scrypt** (slow, salted) | a fast hash (SHA-256), unsalted, or "encrypted" |
| Authentication / identity | **OAuth 2.0 / OIDC** + a real IdP, a vetted auth library | a bespoke login + token flow |
| Authorization | a **vetted authz framework** / policy engine, server-side | scattered ad-hoc `if user.role ==` checks |
| Transport security | **TLS** via the platform (never `verify=False`) | plaintext "internal" traffic, disabled cert checks |
| Tokens / signatures | a standard library for JWT/HMAC/signing | a string concatenated with a "secret" and base64'd |
| Randomness for security | the **CSPRNG** (`secrets`, `crypto.randomBytes`, `/dev/urandom`) | `rand()` / `Math.random()` / a timestamp |

**At the gate:** if the agent wrote a crypto, auth, authz, session, token, or randomness primitive, *that is the finding* — replace it with the adopted standard. A self-written security primitive is `present-unenforced` at best: it looks like a defense and stops nothing an expert tries. Where you must verify that an adopted library is wired correctly (e.g. a JWT validation that rejects `alg:none`, checks audience/issuer/expiry, and pins the key), test those abuse cases explicitly — and let the `gungnir` skill attack the result, because the adversarial probe is what proves the primitive holds in *this* system, not just in the library's own tests.

---

## Minimize the attack surface at design time

Every endpoint, port, parameter, feature, and dependency is something an attacker can probe and you must defend forever. The cheapest defense is the one you never have to build, because the thing it would protect does not exist. **Minimize the attack surface in the design** — expose the fewest endpoints, ports, and features; turn off and *delete* what you don't use.

This is a design decision because attack surface, like every other security property at this stage, is architectural — a sprawling surface can't be pruned safely once everything depends on it, and each unused-but-present feature is a maintained liability that ships with the system. The agent's pull is the opposite of minimal: it adds the extra endpoint, the debug route, the "flexible" parameter, the convenient dependency, because more capability looks like more help and it feels no cost in maintained surface.

Concrete moves at design time:

- **Expose only what a funded requirement needs.** No speculative "admin" endpoint, no debug route shipped to production, no parameter that exists "in case." This is KISS/YAGNI in its security form — the `load-bearing` skill's enforced-restraint, where the unused abstraction is also an unguarded surface.
- **Close ports and disable features you don't use** — and prefer to **delete** dead code/endpoints over leaving them disabled, because a disabled-by-config feature is one misconfiguration away from live (the **security misconfiguration** class).
- **Default-deny the surface, opt-in to exposure** — a new service is reachable by nothing until a boundary explicitly allows a caller; a new field is private until exposed. Secure defaults mean the *configured-but-untouched* state is the safe state, so the agent's "leave it default" path is the locked-down path.
- **Each external dependency is attack surface too** — every added library is code you run and a future CVE you'll have to patch ([operate-and-respond.md](operate-and-respond.md)). Adopt the vetted primitive you need; don't pull a heavy dependency for a trivial convenience.

**Decision fork — does this endpoint / feature / port / dependency earn its place on the attack surface?**
- **PREDICATE:** does a *present, funded* requirement need it now?
- **DEFAULT** on a coin-flip: **leave it out** — add it when a real requirement demands it (cheap to add later; expensive to defend forever). An absent surface is the only perfectly-defended one.
- **FALLBACK** when you can't tell if it's needed: ship without it and let the requirement pull it back in explicitly — a surface that exists "just in case" defends nothing and costs everything.

---

## The thread back to the gate

STAGE 2 clears `defenses-and-trust-boundaries` when, for the system's risk weight (TREE 0): authentication is a vetted framework and authorization is enforced **server-side on every request against the actual user**; the threat model's trust boundaries each carry an enforced control; defense in depth layers independent controls so no single bypass is game-over; the failure path **denies**; the attack surface is minimized and defaults are secure; and **no security primitive is homemade** — every one is an adopted, audited standard. None of these can be retrofitted cheaply once the architecture is poured, which is why they are decided here and gated here. What this stage designs, [secure-coding.md](secure-coding.md) implements input-by-input, [security-testing-and-gates.md](security-testing-and-gates.md) gates, and the `gungnir` skill attacks — the spear that proves the shield held.

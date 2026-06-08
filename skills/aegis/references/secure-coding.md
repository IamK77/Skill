# Secure Coding: Code That Never Trusts Input and Never Holds a Secret

This reference is the depth behind **STAGE 3 — Build** of the [../SKILL.md](../SKILL.md) flight plan, the stage where the threat model and the secure design become actual code. It governs two checks — [`input-never-trusted`](#1-never-trust-user-input--the-one-assumption-applied-everywhere) and [`secrets-and-least-privilege`](#5-secrets-never-in-code-and-never-in-logs--secrets-and-least-privilege) — and the human-era→agent-era shift underneath both: secure coding *was* discipline a good engineer mostly followed by reflex, feeling a flicker of unease pasting a raw user string near a SQL query or hard-coding a key; in the agent era there is no flicker, so the discipline has to become an enforced, reviewed-for rule. For *why* the work changes, read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 3 (the agent trusts its input)** and **SHIFT 5 (the agent leaks secrets and over-grants)** are the two cards this file enforces. This file is the *how*: the concrete code-level moves that defend each class by construction.

Restate the governing fact you carry into every line from [decision-tree.md](decision-tree.md):

> **Security is woven in, never bolted on — and a vulnerability passes every green test, because it is the absence of an attack, not a failure.** Assume the attacker knows your system completely and that any single layer can fail. When a coding fork is a real toss-up, err toward the **fail-closed, validated, defended** option — the cost of validating safe input is nil; the cost of trusting hostile input is a breach.

And the agent failure mode that runs under the whole file: **the agent reproduces the insecure pattern by default.** String-concatenated SQL, unescaped output, a hard-coded key, a `*:*` grant — it pattern-matches these out of its training distribution because the insecure version *works perfectly* until someone attacks it, and nothing turns red. The secure version is never the one that "just happens"; it is the one that must be written, and reviewed for.

## Contents

- [1. Never trust user input — the one assumption applied everywhere](#1-never-trust-user-input--the-one-assumption-applied-everywhere)
- [2. Validate at the boundary: allowlist over denylist](#2-validate-at-the-boundary-allowlist-over-denylist)
- [3. The OWASP Top 10 vulnerability → defense catalog (code-level how-to)](#3-the-owasp-top-10-vulnerability--defense-catalog-code-level-how-to)
- [4. Injection and XSS in depth — the two highest-impact classes](#4-injection-and-xss-in-depth--the-two-highest-impact-classes)
- [5. Secrets never in code and never in logs — `secrets-and-least-privilege`](#5-secrets-never-in-code-and-never-in-logs--secrets-and-least-privilege)
- [6. Least privilege in the wiring — from deny-all](#6-least-privilege-in-the-wiring--from-deny-all)
- [7. The build-stage review pass](#7-the-build-stage-review-pass)

---

## 1. Never trust user input — the one assumption applied everywhere

> **Check: `input-never-trusted`. Governing shift: SHIFT 3.**

Secure coding rests on one assumption applied *everywhere*: **never trust user input.** This is not a discipline followed on the paths that feel dangerous; it is a hard rule applied at every boundary the data crosses, because the agent — which treats every input as friendly by default, writing the path that works for the value it imagined — supplies no instinct to follow it selectively.

The non-obvious half is the *scope* of "input." The agent's mental model of "user input" is a form field. The real definition is **any value that originated outside your trust boundary, or whose origin you cannot prove.** That includes, all equally hostile until validated:

- form fields, URL/query/path parameters, request bodies (JSON, XML, multipart);
- **HTTP headers** — `Host`, `Referer`, `X-Forwarded-For`, `User-Agent`, cookies — all attacker-controlled;
- **data from another service** — a microservice response, a webhook, a message off a queue — your peer can be compromised or impersonated (this is the zero-trust core: a service boundary is a trust boundary);
- **files** — an uploaded file's name, type, size, and *contents*; a config or data file whose provenance you can't vouch for;
- **the database** — stored data that an earlier, less-careful path put there unvalidated (this is *stored* / second-order injection and XSS);
- environment variables and CLI arguments in a multi-tenant or partially-trusted context.

**The decision fork — is this input safe to use as-is?** (inherited from [agent-era-shifts.md](agent-era-shifts.md#shift-3--the-agent-trusts-its-input--never-trust-input-anywhere)):

- **PREDICATE:** did this value originate inside your trust boundary and remain unmodified by anything outside it?
- **DEFAULT** on a coin-flip: **treat it as untrusted** — validate it at entry and encode it at the dangerous sink. The cost of validating safe input is nil; the cost of trusting hostile input is an injection.
- **FALLBACK** when you can't trace its origin: assume it crossed a trust boundary — validate at the point of use; an input whose provenance you can't prove is, by default, attacker-controlled.

Validation is **not** the same as defense at the sink, and you do both. Validating shape at the boundary (this is a well-formed email, this is an integer in range) does not make a value safe to concatenate into SQL or drop into HTML — a perfectly valid name `Robert'); DROP TABLE students;--` passes an "is this a plausible name" check and is still an injection. So: **validate shape at the boundary AND defend by construction at the sink** (parameterize, encode, authorize). The two are layers, not substitutes — defense in depth at the code level.

The boundary-validation mechanics (parse-don't-assert, a typed model at the edge, `Any` contained to the adapter, failures attributed to the field) are the same machinery the `gauge` skill installs for legible feedback — there the goal is a clear signal, here it is a security boundary; the same `pydantic`/`zod` parse serves both. Lean on it; don't reinvent it.

---

## 2. Validate at the boundary: allowlist over denylist

The single most important choice *inside* validation is **allowlist (accept known-good) over denylist (block known-bad).** This is the agent's second trap after trusting input at all: asked to "block SQL injection," it will reach for a denylist — strip `'`, reject the word `SELECT`, escape `<script>` — because a blocklist is the pattern its training data is full of, and it *looks* like it works against the examples in front of it.

| | Denylist (block known-bad) | Allowlist (accept known-good) |
|---|---|---|
| **What it enumerates** | every bad input you can think of | the exact set of good inputs |
| **Failure mode** | the one bad input you *didn't* think of — and the attacker's whole job is to find it | a legitimate input you forgot to allow — fails *closed*, visibly, safely |
| **Direction of error** | fail **open** (miss a payload → breach) | fail **closed** (miss a case → a bug you fix) |
| **Against an evolving attacker** | loses — new encodings, new payloads route around it (`SeLeCt`, URL-encoding, Unicode homoglyphs, double-encoding) | holds — the good set doesn't change when the attacker gets clever |
| **Verdict** | a leaky supplement at best | **the default** |

- **PREDICATE:** can you define the set of *acceptable* values (a regex of allowed characters, an enum of allowed options, a numeric range, a known list of allowed redirect hosts)?
- **DEFAULT:** define it and **reject everything else.** A status field is one of `{pending, paid, refunded}` — an `Enum`, not a free string. A filename is `^[A-Za-z0-9_.-]+$` with no `/` or `..`. A redirect target is one of a fixed set of allowed URLs, not "any URL starting with our domain" (which `evil.com/?x=ourdomain.com` defeats).
- **FALLBACK** when the input is genuinely free-form (a comment body, a display name): you can't allowlist the *content*, so you cannot rely on input validation to make it safe — you **must** defend it at every sink instead (output-encode it wherever it's rendered, parameterize it wherever it touches a query). Free-form input is exactly the case where boundary validation is insufficient and sink defense is mandatory.

Denylist has a narrow legitimate use as a *supplementary* layer (a WAF rule, a profanity filter), never as the primary control. If the agent's defense against injection is "we strip dangerous characters," that is the finding — the primary defense must be the allowlist plus the parameterized sink below.

---

## 3. The OWASP Top 10 vulnerability → defense catalog (code-level how-to)

The OWASP Top 10 is the canonical catalog of what goes wrong, and — read through SHIFT 3 — it is in large part the catalog of what happens when input is trusted that should not have been. The **vulnerability → defense table** lives in [decision-tree.md](decision-tree.md#the-owasp-class--defense-map-stage-34); do not duplicate it. Walk it there as the checklist; this section is the **code-level HOW to build each defense** so the agent writes the secure construction instead of the insecure default it would otherwise pattern-match.

| Class | The agent's insecure default | The secure construction (the HOW) |
|---|---|---|
| **Injection** (SQL/NoSQL/command/LDAP) | concatenates input into the query/command string | **parameterized queries / prepared statements** — the driver sends code and data on separate channels, so input can never be parsed as SQL. For shells, call the program with an **argument array** (`subprocess.run([...], shell=False)`), never a built string; better, avoid the shell entirely. ORMs help **only** when you use their parameter binding — a raw-SQL `.execute(f"...{x}...")` escape hatch is injection again. See §4. |
| **Broken access control** (IDOR, forced browsing) | checks authorization in the UI / trusts an ID from the request as the user's own | **enforce authz server-side on every request**, against the *authenticated* identity, not a client-supplied id. For object access (`GET /orders/{id}`) confirm *this user owns this object* — the agent's default `SELECT * FROM orders WHERE id = ?` skips the `AND owner_id = :current_user` and ships an IDOR. Deny by default; the UI hiding a button is not a control. See §6. |
| **Cross-site scripting (XSS)** | drops user content into HTML unescaped (`innerHTML`, an unescaped template, `dangerouslySetInnerHTML`) | **context-aware output encoding** at render — HTML-body vs HTML-attribute vs JS vs URL vs CSS each need a different escaper; use the framework's auto-escaping templating and never bypass it. Add a **Content-Security-Policy** as the second layer so an injected script won't execute even if encoding is missed. See §4. |
| **Cryptographic failures** (sensitive-data exposure) | sends/stores sensitive data in the clear; invents a cipher | **TLS in transit** (HTTPS everywhere, `HSTS`) and **encryption at rest** for sensitive data, using vetted primitives only — never an agent-generated scheme (the build-vs-buy fork lives in [decision-tree.md](decision-tree.md#the-build-vs-buy-decision-anything-security-critical); detail in [secure-design.md](secure-design.md)). Passwords are **hashed** with `argon2`/`bcrypt`/`scrypt`, never encrypted, never MD5/SHA-1. No secrets/PII in logs (§5). |
| **Identification & auth failures** | rolls a homemade session/token scheme; no rate limiting | adopt a vetted auth framework and **OAuth/OIDC** for federation; rate-limit and lock out brute force; `HttpOnly` + `Secure` + `SameSite` cookies; expire and rotate sessions. This is a *design* decision — see [secure-design.md](secure-design.md) — that the build stage merely wires correctly. |
| **CSRF** | state-changing endpoint trusts an authenticated browser request | **anti-CSRF tokens** (synchronizer token / double-submit) on state-changing requests, plus **`SameSite=Lax`/`Strict` cookies** as the modern baseline. Safe methods (`GET`) must stay side-effect-free. |
| **Security misconfiguration** | ships default passwords, debug endpoints, verbose errors, public buckets | **secure defaults, reviewed** — change/disable defaults, turn off debug and directory listing in prod, return generic error messages (no stack traces to the client), lock down storage ACLs (no public bucket), set security headers. Minimize the attack surface: delete what you don't use. |
| **Vulnerable & outdated components** | pulls a dependency with a known CVE | **SCA scanning** gated in CI and **prompt patching** — the `flightline` skill runs the scan, the `husbandry` skill drives the upgrade cadence; the build stage's job is to not *introduce* a known-vulnerable version and to pin via lockfile. |
| **Security logging & monitoring failures** | logs nothing security-relevant (or logs secrets) | emit **security-event** logs (authn/authz decisions, denials, anomalies) — *without* secrets or PII (§5) — for the `stationkeeping` skill's detection. Absence of logging is why a breach goes unnoticed. |
| **SSRF** | fetches a URL built from user input against no allowlist | **allowlist the outbound targets** — validate the destination against a fixed set of permitted hosts/schemes, block requests to internal/link-local ranges (`169.254.169.254`, `127.0.0.0/8`, RFC-1918), resolve-then-check to defeat DNS rebinding, and segment the network so the fetcher can't reach internal services. A denylist of "bad" IPs loses (§2); allowlist the few you actually call. |

The thread, again: **injection, XSS, broken access control, and SSRF are all the same root — input that was trusted when it should have been validated, encoded, or authorized.** Defend each by construction here; in [security-testing-and-gates.md](security-testing-and-gates.md) you confirm each is *tested*, and you hand the adversarial attempt — chaining these into a real exploit, abusing business logic the scanners can't see — to the `gungnir` skill.

---

## 4. Injection and XSS in depth — the two highest-impact classes

These two are SHIFT 3 made concrete: the agent trusting input near the two most dangerous sinks. They deserve the depth because they are the most prolific *and* the ones the agent's defaults get most reliably wrong.

**Injection — parameterize, never build the query string.** The rule is absolute: **input never becomes part of the query/command text.** A parameterized (prepared) statement sends the query structure to the engine once, then binds the data values separately, so a value can *never* be reinterpreted as code — `'; DROP TABLE` arrives as a literal string to compare against, not as SQL to run.

```python
# INSECURE — the agent's default: input is concatenated INTO the SQL text.
# A username of  ' OR '1'='1  rewrites the query; this is SQL injection.
cur.execute(f"SELECT * FROM users WHERE name = '{name}' AND pw = '{pw}'")

# SECURE — parameterized: name/pw are bound as DATA, never parsed as SQL.
cur.execute("SELECT * FROM users WHERE name = %s AND pw = %s", (name, pw))
```

The same rule across sinks: an **OS command** is run as an argument array with the shell off (`subprocess.run(["convert", user_path, out], shell=False)`), never `os.system(f"convert {user_path} ...")`. A **NoSQL** query passes a typed value, never a user-controlled operator object (`{"$where": userInput}` is injection). An **ORM** is safe only through its binding API — `User.objects.filter(name=name)` is fine; its raw-SQL escape hatch with an f-string is not. There is no "escaping" path you should hand-roll: escaping is error-prone and parameterization makes it unnecessary. If the agent wrote an escaper for SQL, that is the finding — replace it with a prepared statement.

**XSS — context-aware output encoding plus CSP.** XSS is the dual of injection at the *output* boundary: user content rendered into a page where the browser executes it as script. The defense is to **encode for the exact context** at render time, because the escaping differs by where the value lands:

| Context | Example sink | Correct encoding |
|---|---|---|
| HTML element body | `<div>{{ value }}</div>` | HTML-entity encode (`<`→`&lt;`) |
| HTML attribute | `<img alt="{{ value }}">` | attribute-encode + always quote the attribute |
| JavaScript | `<script>var x = {{ value }}</script>` | JS-string/JSON encode — or better, don't inject into JS; pass via a `data-` attribute |
| URL / query | `<a href="/p?q={{ value }}">` | URL-encode, and validate the scheme (`javascript:` is XSS) |

In practice: **use the framework's auto-escaping templating and never bypass it** — modern templates (Jinja2 autoescape, React JSX, Angular) encode by default; XSS shows up exactly where the agent reaches for the bypass (`innerHTML`, `dangerouslySetInnerHTML`, `mark_safe`, `|safe`, `v-html`). Treat any such bypass on user-derived content as a finding. Layer a **Content-Security-Policy** (`script-src 'self'`, no inline script) so that even a missed encoding cannot execute an injected script — defense in depth, the design's `fail-secure` reaching the response. Remember **stored XSS**: content read back from the database is still untrusted and must be encoded on output, even though it "came from us."

- **PREDICATE for any sink:** is a value that crossed a trust boundary about to be interpreted (as SQL, as a command, as markup, as a URL scheme)?
- **DEFAULT:** make it impossible to interpret it as code — parameterize (data channel) or context-encode (escaped text). Never rely on having cleaned the input upstream.
- **FALLBACK** when you can't tell whether the framework auto-defends this sink: assume it does **not**, encode/parameterize explicitly, and let the `gungnir` skill try to inject anyway — a clean attempt is the evidence, not your assumption.

---

## 5. Secrets never in code and never in logs — `secrets-and-least-privilege`

> **Check: `secrets-and-least-privilege`. Governing shift: SHIFT 5.**

A secret is anything that grants access if leaked: API keys, DB passwords, private keys, tokens, signing keys, connection strings. The agent feels **no wrongness** putting one in the most convenient place — and the two most convenient places are the source file and the log line, because both make the thing *work right now* and neither turns anything red.

**Never in code (or an image layer, or a committed config).** Secrets are **injected at runtime from a secrets manager / vault** (HashiCorp Vault, AWS Secrets Manager / SSM Parameter Store, GCP Secret Manager, a sealed Kubernetes secret) — the running process reads the secret from the environment or fetches it at startup; the secret never appears in the repository, the Dockerfile, or a baked image layer.

```python
# INSECURE — the agent's default: a real key, hard-coded, to make it work now.
STRIPE_KEY = "sk_live_<a-real-key-pasted-right-here>"

# SECURE — injected at runtime from the environment, populated by the secrets manager.
STRIPE_KEY = os.environ["STRIPE_KEY"]   # absent → fail loud at startup, not a default
```

This is a **defense in depth** across three skills, and you must name and lean on all three rather than rely on this single layer:

- the **`flightline`** skill runs a **secret-scanning gate** that blocks the *commit* (so a hard-coded key never lands in history — and if one did, it must be rotated, because git history is forever);
- the **`stationkeeping`** skill **redacts** secrets and PII from telemetry (so a logged token never reaches the log store) — the same redaction the `gauge` skill wires into structured failures;
- this stage keeps secrets out of the *running code and the log statements you write* in the first place.

**Never in logs.** The other half of SHIFT 5: to debug, the agent will `log.info(f"request: {request}")` and dump the whole payload — auth header, password, full PII — because it works and produces no red. The rule: **never log a password, token, key, or PII.** Log an *identifier* (a user id, a request id), never the credential or the personal data; redact at the logging boundary; and treat a verbose "log the whole request/response" as a finding. A secret in a log is a secret in plaintext in every place that log is shipped, indexed, and retained.

- **PREDICATE:** is this value a credential, key, token, or personal data?
- **DEFAULT:** it comes from the secrets manager at runtime and is **never** written to a log or an error returned to a client.
- **FALLBACK** when you're unsure whether a field is sensitive (a free-form blob, an opaque token from a partner): treat it as sensitive — redact it from logs and keep it out of source. The cost of redacting a non-secret is nil.

In review, **a hard-coded secret or a logged credential/PII is a blocking finding** — not a cleanup-later note.

---

## 6. Least privilege in the wiring — from deny-all

The second half of `secrets-and-least-privilege`, and the second half of SHIFT 5: the agent's reflex to **widen a permission to `*:*` the moment an `AccessDenied` blocks it**, because the broad grant clears the error and ships green and feels like nothing went wrong. Least privilege has to be the *default posture of the wiring*, not a norm you trust.

Every identity, credential, and grant is scoped **from deny-all to exactly what a real, demonstrated use needs**, across every layer the agent wires:

| The wiring | Over-grant the agent reaches for | Least privilege |
|---|---|---|
| **Database user** | the app connects as `root`/`admin`/owner | a role with only the tables and operations it uses (`SELECT, INSERT` on the few tables it touches; no `DROP`, no other schemas) — so an injection can't escalate to the whole database |
| **Service account / IAM role** | `Action: "*"`, `Resource: "*"` to clear an `AccessDenied` | the specific actions on the specific resources, scoped tightest where it touches crown jewels |
| **API scope / token** | a broad token that can do everything | the minimal OAuth scopes for the operation; short-lived, audience-restricted |
| **File / object permissions** | `chmod 777`, a world-readable / public bucket | the narrowest mode and owner; private storage by default |
| **Network** | open egress / a flat network | segment so a component can reach only the peers it must (this is what contains the SSRF in §3) |

The corrective move when an `AccessDenied` appears is fixed and must replace the agent's reflex: **narrow the need, don't widen the grant.** Find the one action and one resource that failed and add exactly that, treating the change as a *reviewed* permission delta — never a quiet `*:*` to make the error go away. Least privilege is also what bounds the blast radius when another layer fails: a SQL injection through an over-privileged DB user is a full-database compromise; through a least-privileged one it is limited to a few tables. That is defense in depth — you assume the upstream control can be breached and make the breach small.

- **PREDICATE:** does this identity/credential *demonstrably need* this permission for a real path?
- **DEFAULT:** grant only what a real use proves necessary, starting from deny-all.
- **FALLBACK** when you can't yet tell which narrow permission a path needs: start denied, run the path, and add **exactly** the permission the failure names — never a wildcard placeholder you intend to "tighten later" (you won't, and it ships).

In review, **a `*:*` grant, an admin-level DB connection, or a world-readable resource is a blocking finding.**

---

## 7. The build-stage review pass

Because the agent writes the insecure pattern by default, the secure version is the one that must be **reviewed for** — a vulnerability produces no red, so a green build certifies nothing here. Run this scan as you finish the stage; each line maps to a default the agent will have reached for. The checks named are the contract; this list is how you satisfy them before the GATE.

- **Every external input** (form, param, header, body, file, inter-service, stored data) is validated at its boundary, **allowlist** not denylist, and defended again at each sink. → `input-never-trusted`
- **Every query** is parameterized; **no** string-built SQL/command anywhere; no hand-rolled escaper. → `input-never-trusted`
- **Every output** of user-derived content is context-encoded; no `innerHTML`/`|safe`/`dangerouslySetInnerHTML` bypass on untrusted data; a CSP is set. → `input-never-trusted`
- **Authorization is server-side on every request** against the authenticated identity, with object-ownership checks (no IDOR); deny by default. → `input-never-trusted`
- **No secret in code, config, or an image layer**; every secret injected from the manager at runtime; the `flightline` secret-scan gate is on. → `secrets-and-least-privilege`
- **No credential or PII in any log** or client-facing error; redaction at the logging boundary; `stationkeeping` telemetry redaction relied on, not duplicated. → `secrets-and-least-privilege`
- **Least privilege everywhere** — DB user, service account, API scope, file mode, network egress all scoped from deny-all; no `*:*`, no admin-by-default, no public bucket. → `secrets-and-least-privilege`

When a call inside any fork above is a genuine toss-up, take the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear): make the safe choice the default (validate, deny, parameterize, redact), have it attacked (a SAST/DAST run, or the `gungnir` skill in staging), and escalate the residual to the user in writing rather than guessing — a wrong security guess is a breach, not a bug.

---

**Cross-links:** [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 3 and SHIFT 5 — *why* the work changed) · [decision-tree.md](decision-tree.md) (the OWASP class→defense map and the build-vs-buy fork this file builds on) · [secure-design.md](secure-design.md) (the authn/authz, fail-secure, and never-invent-crypto decisions this stage wires) · [threat-modeling.md](threat-modeling.md) (the map of what to defend) · [principles-and-stance.md](principles-and-stance.md) (least privilege and defense in depth as principles) · [security-testing-and-gates.md](security-testing-and-gates.md) (confirming each defense is *tested*, and the hand-off to `gungnir`) · [operate-and-respond.md](operate-and-respond.md) (the running-system half) · [../SKILL.md](../SKILL.md) (the six-stage flight plan this stage serves).

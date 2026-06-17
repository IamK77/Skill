# Frontend Security — Threat Model, Defenses, and Architecture

## 1. Threat Model and First Principles

- **Never trust the client, never trust input.** The client is entirely attacker-controlled — any JS can be rewritten, any request can be forged. Client-side validation is UX; security lives on the server.
- **Same-Origin Policy (SOP)** is the browser's foundational security primitive. Origin = scheme + host + port. Scripts from one origin cannot read data from another.
- **Defense in depth / least privilege / fail securely.** No single control is sufficient; layer them.

---

## 2. XSS — Cross-Site Scripting

**Three classes:**
- **Stored XSS** — malicious payload persisted in DB (e.g., comment field), served to all viewers. Highest impact.
- **Reflected XSS** — payload in URL parameter echoed into the response.
- **DOM XSS** — client-side JS reads untrusted data and writes it into a dangerous sink without sanitization.

**Root cause:** untrusted data interpreted as code (HTML/JS) rather than plain text.

**Defenses:**
- **Context-aware escaping.** Escaping rules differ by context: HTML body, HTML attributes, JavaScript, URL, CSS. Applying the wrong escaping for the context leaves you exposed.
- **Framework auto-escaping.** React, Vue, and Angular escape template expressions by default — use them. The risk is in deliberate bypasses.
- **Dangerous sinks to avoid or sanitize:**
  - `dangerouslySetInnerHTML` (React), `v-html` (Vue), `innerHTML`, `document.write`
  - `eval()`, `setTimeout(string)`, `new Function(string)`
  - `href`/`src` values set from user input — validate the scheme; `javascript:` URLs are valid XSS vectors.
- **Rendering user-supplied HTML** — use **DOMPurify** (battle-tested, continuously patched against mXSS). Never write your own sanitizer with regex.
- **`textContent` vs `innerHTML`** — always prefer `textContent` when inserting plain text.
- **Trusted Types (CSP directive):** `require-trusted-types-for 'script'` forces all DOM-XSS sinks (`innerHTML`, `eval`, etc.) to accept only values produced by a declared policy. Converts an entire class of bugs into runtime errors. Pair with the **native Sanitizer API** (`element.setHTML()`) for browser-native sanitization without a library.

**Why naive defenses fail:**
- **mXSS (mutation XSS):** The browser's HTML re-parser can mutate "already sanitized" markup back into executable XSS during DOM insertion. This is why hand-rolled sanitizers always lose eventually — DOMPurify patches against these continuously.
- **Script gadgets:** Legitimate code in your own framework/library can be triggered by injected markup to execute script, bypassing both CSP and sanitizers.
- **CSS injection exfiltration:** Even injecting only CSS is dangerous — attribute selectors + `background-image: url(...)` can exfiltrate data character by character (`input[value^="a"]{ background: url(/leak?a) }`).
- **Upgrade path:** Trusted Types + Sanitizer API over escaping-only defenses.

---

## 3. CSP — Content Security Policy

A response header that tells the browser what resources are allowed to load and execute. Even when injection occurs, a well-configured CSP limits what an attacker can do.

**Key directives:**
- `default-src` — fallback for all resource types not explicitly listed.
- `script-src` — controls JS execution; the most critical directive.
- `connect-src` — restricts `fetch`/`XHR`/WebSocket destinations.
- `frame-ancestors` — replaces `X-Frame-Options`; prevents clickjacking by restricting which origins can embed you.
- `base-uri 'none'` — blocks `<base>` tag injection (which hijacks all relative URLs).
- `form-action` — restricts where forms can submit.
- `object-src 'none'` — disables Flash and other legacy plugins.

**`script-src` best practice — avoid `'unsafe-inline'` and `'unsafe-eval'`** (they nullify CSP's XSS mitigation entirely).

Preferred: **nonce + `'strict-dynamic'`**
- Per-request random nonce: `<script nonce="r4nd0m">` + `script-src 'nonce-r4nd0m' 'strict-dynamic'`
- `'strict-dynamic'` propagates trust to scripts dynamically loaded by already-trusted scripts, making CSP practical for modern module-heavy apps.
- For static inline scripts: use **hashes** (`sha256-…`) instead of nonces.

**Deployment:** use `Content-Security-Policy-Report-Only` + a reporting endpoint (`report-to`) to collect real violations before enforcing. A strong CSP is one of the highest-value controls; most sites lack one.

---

## 4. CSRF — Cross-Site Request Forgery

An attacker tricks the user's browser (with its cookies) into making authenticated state-changing requests to your origin.

**Defenses:**
- **`SameSite` cookie attribute** — the modern primary defense. `SameSite=Lax` (browser default since 2020) blocks cross-site cookies on non-safe requests. `SameSite=Strict` is even tighter. Cross-site POST cannot carry the cookie.
- **CSRF tokens (synchronizer token / double-submit)** — server issues a per-session or per-request secret; client echoes it in a request header or body. Server validates. Required for any state-changing operation.
- **Validate `Origin`/`Referer` headers** as secondary signal.
- **Never use GET for state-changing operations** — GET requests are "simple" and can be triggered without a preflight.

---

## 5. Authentication and Token Storage

**Where to store tokens — a critical architectural decision:**

| Location | XSS risk | CSRF risk | Persistence |
|---|---|---|---|
| `localStorage` / `sessionStorage` | High — any JS can read it | None | Survives refresh |
| `httpOnly; Secure; SameSite` cookie | None — JS cannot read | Low (SameSite mitigates) | Configurable |
| In-memory JS variable | None on reload | None | Lost on refresh |

**Practical patterns:**
- **Sensitive/long-lived tokens:** `httpOnly + Secure + SameSite` cookie. Not reachable by XSS.
- **Short-lived access token:** in-memory JS variable. Refresh using an httpOnly refresh token cookie.
- **Modern SPA best practice — BFF / Token Handler pattern:** Tokens never reach the browser at all. A Backend For Frontend (BFF) holds the tokens server-side; the SPA communicates with the BFF via an httpOnly session cookie. This sidesteps the entire localStorage vs. memory debate.

**JWT specifics:** The payload is base64-encoded, not encrypted — do not store sensitive claims. Validate signatures server-side. Use short expiry.

**OAuth / OIDC:** SPAs must use **PKCE** (Proof Key for Code Exchange) — never the implicit flow. Never roll your own crypto.

**Advanced token hardening:**
- **Refresh token rotation** — issue a new refresh token on every use; detect replay by invalidating reused tokens.
- **DPoP (Demonstrating Proof of Possession)** — binds access tokens to a client key pair. A stolen token is useless without the matching private key.
- **WebAuthn / Passkeys (FIDO2)** — public-key credentials bound to the origin. Resistant to phishing (credential cannot be used on a different origin). No shared secret to steal. The highest-assurance direction for authentication.

**Logout:** invalidate server-side (revoke session/token) AND clear client-side state.

---

## 6. HTTPS and Transport Security

- **HTTPS everywhere.** HTTP exposes tokens, session cookies, and data to network attackers.
- **HSTS (`Strict-Transport-Security`)** — forces HTTPS for a declared `max-age`, optionally `includeSubDomains` + `preload`. Prevents SSL-stripping downgrade attacks.
- **Mixed content** (HTTP resources on an HTTPS page) is blocked by modern browsers; audit and eliminate.
- **`Secure` cookie flag** — cookie never sent over HTTP.
- **Secrets and tokens must not appear in URLs** — they end up in server logs, `Referer` headers, and browser history.

---

## 7. Security Response Headers

| Header | Purpose |
|---|---|
| `Content-Security-Policy` | Resource/execution policy (§3) |
| `Strict-Transport-Security` | Force HTTPS, prevent downgrade |
| `X-Content-Type-Options: nosniff` | Block MIME-type sniffing attacks |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | Disable unused browser features (camera, geolocation, etc.) |
| `X-Frame-Options: DENY` / CSP `frame-ancestors` | Prevent clickjacking |
| `Cross-Origin-Opener-Policy: same-origin` (COOP) | Isolate browsing context; blocks cross-origin window references |
| `Cross-Origin-Embedder-Policy: require-corp` (COEP) | Required for `crossOriginIsolated`; blocks unannotated cross-origin loads |
| `Cross-Origin-Resource-Policy` (CORP) | Restricts which origins can read a response |

**COOP + COEP together** enable `crossOriginIsolated = true`, unlocking `SharedArrayBuffer` and high-resolution timers — both gated because they are Spectre-exploitable in non-isolated contexts. Site Isolation (separate OS processes per site) + CORB/ORB (Opaque Response Blocking) form the post-Spectre defense architecture.

Audit tools: securityheaders.com, Mozilla Observatory.

---

## 8. CORS — Cross-Origin Resource Sharing

**Common misconception: CORS is not a server protection mechanism.** It is a browser-enforced relaxation of SOP that allows specific cross-origin reads. It protects the user's browser, not your API. A server-side endpoint is fully reachable by a non-browser client regardless of CORS headers.

**Key rules:**
- `Access-Control-Allow-Origin` declares which origins the browser will expose responses to.
- **Never combine `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`** — browsers disallow this combination.
- **Never reflect arbitrary `Origin` values with `Allow-Credentials: true`** — this defeats SOP entirely and is a critical vulnerability.
- Non-simple requests (e.g., PUT, DELETE, or custom headers) trigger a preflight OPTIONS request; the actual request proceeds only if the preflight is approved.

---

## 9. Clickjacking and Frame Control

- **`frame-ancestors 'none'`** (CSP) or **`X-Frame-Options: DENY`** — prevent your pages from being embedded in attacker-controlled iframes used to hijack user clicks.
- **`target="_blank"` tabnabbing** — the opened page's `window.opener` points back to your page, allowing the new page to navigate your origin. Always add **`rel="noopener noreferrer"`** to `target="_blank"` links (modern browsers default to `noopener` but explicit is safer).
- **`postMessage` security** — always validate `event.origin` against a strict allowlist; never use `targetOrigin: '*'` for sensitive messages; validate message structure.
- **Open redirect** — never redirect to arbitrary user-supplied URLs; validate against an allowlist of known safe destinations.
- **Sandbox untrusted embedded content** with `<iframe sandbox>` — restricts scripts, forms, popups, and same-origin access unless explicitly re-granted.

---

## 10. Supply Chain Security

**`npm audit` detects known CVEs — it does not detect malicious packages.** These are distinct threat surfaces.

**Attack vectors:**
- **Typosquatting** — malicious package published under a name one typo away from a popular one.
- **Dependency confusion** — internal private package name resolved to a public registry package with the same name (attacker wins by publishing a higher version number).
- **Malicious install scripts** — `postinstall` runs arbitrary code on your machine and in CI at install time.
- **Compromised maintainer accounts** — legitimate packages get malicious updates pushed.

**Defenses:**
- **Lock files** (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) — pin exact versions for reproducible installs. Commit them.
- **SRI (Subresource Integrity)** — `<script integrity="sha384-…" crossorigin="anonymous">` for CDN-hosted scripts. Browser refuses to execute if the hash doesn't match.
- **Behavioral analysis** (e.g., Socket.dev) — flags packages that newly added network calls, filesystem access, or install scripts, independent of CVE databases.
- **Provenance attestation** — **SLSA** (Supply-chain Levels for Software Artifacts), **Sigstore**, and `npm publish --provenance` link a published package cryptographically to its source repo and build.
- **Minimize dependencies**, audit before adding, pin versions, review install scripts of new deps.

**Third-party scripts (analytics, ads, tag managers)** run in your origin with full DOM access, cookies, and network. SRI ensures the file wasn't tampered with, but an unmodified malicious/compromised script still has full privileges.

**True third-party isolation:**
- **Sandboxed cross-origin `<iframe>` + `postMessage`** — confine the script to a separate origin or sandboxed iframe; communicate only through a controlled message interface.
- **Web Worker isolation** — Workers have no DOM access. Tools like Partytown proxy third-party scripts into workers, intercepting and brokering DOM access.
- **Cross-origin iframe for sensitive fields** — payment inputs, authentication forms in a separate origin iframe; XSS on the outer page cannot reach across the frame boundary.

---

## 11. Secrets Never in the Client

**Frontend has no secrets.** Any value shipped to the browser is public. An API key in a JS bundle is an exposed API key.

- **Secrets belong behind a server-side proxy.** The client calls your backend; your backend calls the third-party API with the real key.
- **Public/restricted keys** (e.g., map SDKs, analytics write keys) — acceptable client-side only when scoped by HTTP referer, origin, or permission scope on the provider side.
- **`localStorage` / `IndexedDB`** — not suitable for sensitive data. Persists across sessions, readable by any JS (including XSS) and browser extensions.
- **Production source maps** expose your full source code. Either omit them, or serve them only to authenticated error-monitoring services.

---

## 12. Fetch Metadata — Provenance-Based Defense

Modern browsers automatically attach request metadata headers:
- `Sec-Fetch-Site` — `same-origin`, `same-site`, `cross-site`, or `none`
- `Sec-Fetch-Mode` — `navigate`, `cors`, `no-cors`, `same-origin`, `websocket`
- `Sec-Fetch-Dest` — `document`, `script`, `image`, `fetch`, etc.
- `Sec-Fetch-User` — `?1` only for user-initiated navigations

A server-side **Resource Isolation Policy** rejects requests where `Sec-Fetch-Site: cross-site` and the destination/mode don't match expected patterns. A single middleware rule blocks a wide range of CSRF, XSSI, and information-leakage attacks with minimal false positives. Underused and highly effective.

---

## 13. Threat Modeling and Architecture

**Trust boundaries to draw explicitly:**
- Client ↔ Server API (unauthenticated, adversarial channel)
- Your origin JS ↔ Third-party scripts (same-origin, same privilege unless isolated)
- Your origin ↔ Embedded iframes (cross-origin boundary if set up correctly)
- Build pipeline ↔ Package registry (supply-chain boundary)
- Auth server ↔ Resource server (token trust boundary)

**Methodology:**
- **OWASP Top 10** as a reference checklist, not a complete threat model.
- Use **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) to enumerate threats per component.
- Identify **dangerous sinks** in code review: `innerHTML`, `eval`, dynamic script loads, `redirect()` calls, SQL/OS calls server-side.
- **SAST** (static analysis) and **dependency scanning** in CI — automated, not a substitute for design-level review.
- **Never roll your own crypto or auth.** Use vetted libraries, established protocols (OAuth 2.1, FIDO2), and platform APIs (Web Crypto API for operations that must happen client-side).

---

## Quick-Reference Checklist

| Area | Key controls |
|---|---|
| XSS | Framework auto-escaping; avoid `innerHTML`/`eval`/`dangerouslySetInnerHTML`; DOMPurify for HTML; Trusted Types; Sanitizer API |
| CSP | `nonce + strict-dynamic`; no `unsafe-inline`/`unsafe-eval`; `frame-ancestors`; `base-uri 'none'`; `object-src 'none'`; Report-Only to audit |
| CSRF | `SameSite=Lax/Strict` + CSRF tokens; no GET for mutations; validate Origin |
| Token storage | `httpOnly + Secure + SameSite` cookie; access token in memory; BFF/token-handler keeps tokens server-side entirely |
| Advanced auth | PKCE for OAuth SPAs; refresh token rotation; DPoP; WebAuthn/passkeys |
| Transport | HTTPS + HSTS; `Secure` flag; no secrets in URLs |
| Headers | `nosniff`; `Referrer-Policy`; `Permissions-Policy`; COOP + COEP for cross-origin isolation |
| CORS | Not a server guard; never reflect arbitrary Origin + credentials |
| Clickjacking | `frame-ancestors 'none'`; `rel="noopener noreferrer"`; validate postMessage origin |
| Supply chain | Lock files; SRI for CDN; behavioral analysis; provenance (SLSA/sigstore); minimize deps; audit install scripts |
| Third-party scripts | Sandboxed iframe + postMessage; Worker isolation (Partytown); cross-origin iframe for sensitive fields |
| Secrets | Never in client bundle; proxy through backend; restrict public keys by referer/scope |
| Fetch Metadata | Server-side Resource Isolation Policy on `Sec-Fetch-*` headers |
| Architecture | Explicit trust boundaries; threat modeling (STRIDE); dangerous-sink review; no custom crypto/auth |

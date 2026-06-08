# The gungnir Decision Tree

This is the deterministic router at the heart of `gungnir` — the engine the stages call into so that two agents attacking the same authorized system reach the *same* test. Open it **first**, at STAGE 0 (Scope), alongside [agent-era-shifts.md](agent-era-shifts.md), and keep it beside you through every stage. The other references are the depth on each topic; this one decides *whether you may proceed at all* (the authorization gate), *how deep* to attack, and *what move* to make at each fork. It is five mechanisms: the **authorization gate** (absolute, first), the **validation spectrum**, the **depth-by-risk sizer**, the **scan-vs-exploit / confirm-vs-false-positive** call, and the **OWASP attack map** — feeding the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md.

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **A defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly, in writing, authorized to test.** When a *non-authorization* fork is a real toss-up, err toward confirming by real exploitation in a snapshotted staging environment rather than trusting a scanner. The authorization fork is the one exception to the whole engine: it has **no DEFAULT toward action** — if you cannot confirm the target is authorized, you stop.

---

## THE AUTHORIZATION GATE — absolute, first, never a judgment call

Before any packet is sent, this gate must clear, and it is the one gate in the entire suite with no DEFAULT toward proceeding. Detail in [scope-and-authorization.md](scope-and-authorization.md).

- **PREDICATE:** has the user confirmed, explicitly, that this exact target is a system they **own** or are **authorized in writing** to test, and is it inside the agreed scope?
- **YES, confirmed and in scope** → proceed to recon, pointing every tool only at the authorized targets.
- **NO, or unclear, or out of scope** → **STOP.** Do not recon, do not scan, do not "just check." There is no FALLBACK toward action here — the fallback is to *not proceed* and to ask the user to establish authorization first.

What the gate pins (all of it, before STAGE 1):

| Element | The line |
|---|---|
| **Ownership / authorization** | the user owns it, or has explicit *written* permission to test it — confirmed out loud |
| **In scope** | the exact domains / IPs / apps you may attack |
| **Out of scope** | everything else — above all, **third-party services and dependencies you don't own**, which are never attacked even though your system touches them |
| **Rules of engagement** | allowed techniques (exclude DoS / stress unless explicitly agreed), the time window, the contact |
| **Environment** | a **snapshotted / backed-up staging** mirror, never production with real user data |
| **Provider policy** | the cloud provider's (AWS/GCP/Azure) penetration-testing policy honored; some test types need prior notice |

> Why this is absolute and not risk-sized (agent-era-shifts SHIFT 2): the agent can run a real weapon and feels nothing about where it points. Authorization is the one thing that is never "probably fine."

---

## The validation spectrum — match the depth to the stakes, layer them

Adversarial validation is a spectrum from cheap-and-continuous to deep-and-independent. They are *additive*, not alternatives; the right program runs several at once.

| Layer | What it is | Cost / cadence | Finds |
|---|---|---|---|
| **Automated scanning** | SAST/DAST/SCA in CI (the `aegis`/`flightline` gates) | cheap, every commit | known patterns, known-CVE deps — the floor |
| **Internal self-test** | you (or the agent), guided by the threat model, attack your own system | moderate, per release | the obvious exploitable holes; OWASP-class issues |
| **Independent / professional pentest** | a genuinely independent tester (ideally human) attacks it | expensive, pre-launch + periodic | the creative chains and logic flaws your blind spots hid |
| **Bug bounty / ongoing red team** | external researchers attack production continuously | ongoing, mature programs | the long tail, post-launch, with fresh eyes |

- **PREDICATE:** what is the system's risk (TREE below), and where is it in its life (pre-launch vs running)?
- **DEFAULT:** *always* run automated scanning (the floor) and internal self-test; **add an independent pentest before launch** for anything MEDIUM+; add bug bounty / ongoing red team for HEAVY, running systems.
- **FALLBACK** when you can't get an independent tester for a high-stakes system in time: do the deepest internal test you can, *explicitly flag the missing independent perspective as residual risk* (agents share the defender's blind spots — agent-era-shifts SHIFT 3), and schedule the independent test rather than declaring the internal one sufficient.

> The load-bearing caution (SHIFT 3): the cheap continuous agent layer never fully substitutes for periodic *independent* eyes, because same-model attack and defense share blind spots. Layer the spectrum; don't collapse it to "the agent scanned it."

---

## TREE — how deep to attack, by risk

Depth of attack is a cost; match it to what a breach would cost (the same sizing as the `aegis` skill's TREE 0). Take the highest dial.

| Dial | Light | Medium | Heavy |
|---|---|---|---|
| **Crown jewels** | nothing sensitive | real user data / some PII | payments, health/PII at scale, secrets, safety |
| **Exposure** | internal-only | internet-facing, authed | public, high-traffic, valuable target |

- **LIGHT** → automated scanning + a quick self-test of the obvious classes (auth, access control, injection on the main inputs). No formal pentest.
- **MEDIUM** → the full six-stage attack internally, plus an independent pentest before launch; OWASP Top 10 worked hands-on; chaining attempted.
- **HEAVY** → all of MEDIUM, plus an independent professional pentest, post-exploitation to prove blast radius, ongoing testing / bug bounty, and a genuinely independent (human) perspective at the milestones.
- **DEFAULT** on a coin-flip between two depths: go **deeper** on the dial touching data/money/safety — an under-tested breach of regulated data is the catastrophic error.
- **FALLBACK** when you can't size it: assume **MEDIUM** and make the data sensitivity and exposure explicit questions for the user.

---

## The scan-vs-exploit / confirm-vs-false-positive call (STAGE 2–3)

The fork that separates a scan from a pentest (agent-era-shifts SHIFT 1, SHIFT 4). A scanner's output is a list of *hypotheses*, not findings.

- **PREDICATE:** has this candidate been *actually exploited* (or proven exploitable with a clear, reproducible proof), or only *flagged by a tool*?
- **Flagged, not yet confirmed** → it is a *candidate*. Try to exploit it; if you can, it's a finding; if you genuinely can't after real effort, it's a likely false positive — note it, don't report it as confirmed.
- **Actually exploited / reproduced** → a real finding; record it with the reproduction.
- **DEFAULT** on a coin-flip about whether a candidate is real: **try to exploit it** before believing or dismissing it — confirmation by real attack is the whole point; both a false "secure" (dismissed real hole) and a false "vulnerable" (un-reproduced scanner noise) are failures.
- **FALLBACK** when you can't safely confirm exploitability in the staging environment: reproduce it as far as is safe, mark it *suspected-unconfirmed* with the evidence, and surface it to the user rather than asserting either way.

> The trap this kills: reporting a scanner's list as "the findings," or reporting "no findings" off a clean scan. The scanner finds known patterns; *you* prove exploitability, and the chain/logic flaw is exactly what the scanner can't see.

---

## The OWASP attack map (STAGE 3) — how to probe each class hands-on

The common vulnerability classes and how to *attack* each (the offensive mirror of the `aegis` skill's defense map). Use it as the hands-on checklist at the exploit stage; full depth in [exploitation-by-class.md](exploitation-by-class.md). Always from the attacker's stance: **assume the app trusts whatever input I send.**

| Class | How to probe it (on your authorized target) |
|---|---|
| **Broken access control / IDOR** | log in as two normal users; change a resource ID in a URL/request to the other's; hit an admin route with a normal account — highest-yield, easiest self-test |
| **Injection** | enter a single quote `'`, watch for a DB error; run `sqlmap` against reacting parameters; try command / NoSQL variants |
| **Auth & session** | weak-password acceptance, missing brute-force protection, token still valid after logout, missing `HttpOnly`/`Secure`, default creds |
| **XSS** | put a harmless probe (e.g. an alert) in a reflected field — does it execute or render as text? |
| **Misconfiguration** | exposed debug endpoints, verbose error pages, default admin panels, public buckets |
| **Sensitive-data exposure** | capture traffic — is it all HTTPS; any plaintext creds; secrets/PII in responses or logs? |
| **SSRF / CSRF / upload** | can you make the server fetch an internal URL; is a state-changing action missing a CSRF token; does upload accept a dangerous type? |

> Every row is the same stance: *trust no boundary, feed the unexpected.* The defenses for each live in the `aegis` skill; this map is how you try to get past them.

---

## Worked traversal (your own pre-launch app on staging, handling PII)

1. **Authorization gate:** the user confirms it's their app, on their staging environment, snapshotted; in-scope = the staging domain; out-of-scope = the third-party payment processor it calls (never attack that). Cloud provider policy checked. **Gate clears.**
2. **TREE:** PII + internet-facing → **MEDIUM** → full internal six-stage attack + an independent pentest before launch.
3. **Spectrum:** automated scanning already in CI (`aegis`/`flightline`); now the internal self-test; flag that an independent pentest is still scheduled (don't call the internal one sufficient — shared blind spots).
4. **Recon → scan:** map the surface (`nmap`, content discovery finds an unlinked `/admin-old`); proxy-crawl produces candidates.
5. **Scan-vs-exploit:** the scanner flags a possible SQLi and a possible IDOR. Confirm: `sqlmap` proves the SQLi real; the IDOR reproduces by swapping a user id; a flagged "XSS" can't be reproduced → false positive, not reported as confirmed.
6. **Chain:** the IDOR + the unlinked `/admin-old` chain into reading other users' PII → real impact, far above either alone — exactly the work the scanner missed.
7. **Report → fix → re-test:** rank by severity, route fixes to `aegis` (parameterize the query, server-side authz) and `husbandry` (the change), then **re-attack** to confirm each is closed. Wire it continuous; keep the independent pentest on the schedule.

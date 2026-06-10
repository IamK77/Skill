# Recon & Enumeration — Mapping the Attack Surface, Then Casting the Net

This reference is the depth behind **STAGE 1 — Recon** and **STAGE 2 — Scan** of the [../SKILL.md](../SKILL.md) flight plan, the two stages that answer "what is even here to attack, and which parts look suspicious?" before a single exploit is attempted. It governs two distinct jobs that the agent tends to collapse into one: **mapping** the surface (what exists, including what nobody linked to) and **scanning** it (running the automated layer to produce a list of suspects). The human-era tester did both by reflex — they fed every input the unexpected, poked the paths the sitemap never mentioned, and treated a scanner's empty output as the *start* of the work; the agent does neither by default. It uses a system the way it's meant to be used (the happy path), and it reads a clean scan as "secure, done." This file re-aims recon and scanning for that attacker: it maps the *hidden* surface and frames the scan output as suspects, never as a verdict. See [agent-era-shifts.md](agent-era-shifts.md) for *why* — **SHIFT 5** (the agent attacks the happy path → map the hidden surface, be persistent) and **SHIFT 1** (a clean scan is not proof → only a real attack proves a defense) — and this file for *how*.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and unchanged here: **a defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly authorized to test.** Recon and scanning are everything that comes *before* the proof: they tell you where to aim, and they tell you what looks worth aiming at. Neither one proves anything by itself. You cannot attack what you have not mapped, and you have not attacked anything until [exploitation-by-class.md](exploitation-by-class.md) — these two stages only load the candidates.

Both stages run **entirely inside the authorized scope** pinned at STAGE 0 (the [scope-and-authorization.md](scope-and-authorization.md) gate). Recon is the first place the scope boundary bites in practice: an unauthorized port scan of a host you do not own is itself an attack, and DNS/subdomain enumeration can wander onto a third party's infrastructure. Before you point any tool at anything, confirm the host is on the in-scope list. The authorization gate (SHIFT 2) has no DEFAULT toward action; if a target you discover during recon is not clearly in scope, you do not scan it — you surface it to the user.

Decision forks below use the suite's engine: **PREDICATE** (the yes/no that selects the branch), **DEFAULT** (what to pick on a coin-flip), **FALLBACK** (what to do when you cannot answer yet).

---

## Contents

- [The two jobs, kept separate](#the-two-jobs-kept-separate)
- [STAGE 1 — Recon: map the surface (check `attack-surface-mapped`)](#stage-1--recon-map-the-surface-check-attack-surface-mapped)
  - [Passive recon — look before you touch](#passive-recon--look-before-you-touch)
  - [Active scanning — port & service mapping with nmap](#active-scanning--port--service-mapping-with-nmap)
  - [Tech-stack fingerprinting — what software, which version](#tech-stack-fingerprinting--what-software-which-version)
  - [Content & directory discovery — the door nobody linked (SHIFT 5)](#content--directory-discovery--the-door-nobody-linked-shift-5)
  - [Use the aegis threat model as your map](#use-the-aegis-threat-model-as-your-map)
  - [PREDICATE / DEFAULT / FALLBACK — how thorough is thorough enough](#predicate--default--fallback--how-thorough-is-thorough-enough)
- [STAGE 2 — Scan: cast the wide net (check `scanned-and-enumerated`)](#stage-2--scan-cast-the-wide-net-check-scanned-and-enumerated)
  - [The automated layer — what runs](#the-automated-layer--what-runs)
  - [The proxy crawl — every page, every parameter](#the-proxy-crawl--every-page-every-parameter)
  - [Version-based known-CVE checks](#version-based-known-cve-checks)
  - [Holding the line: the candidate list is suspects, not findings (SHIFT 1)](#holding-the-line-the-candidate-list-is-suspects-not-findings-shift-1)
- [What the two gates inherit](#what-the-two-gates-inherit)

---

## The two jobs, kept separate

The agent's instinct is to run one tool, get one list, and move on. Recon and scanning are gated separately because they fail in different ways and guard against different agent habits.

| | **STAGE 1 — Recon** | **STAGE 2 — Scan** |
|---|---|---|
| **Question** | What exists in scope? | Which of it looks vulnerable? |
| **Output** | The attack surface: hosts, ports, services, versions, *and the unlinked paths* | The candidate list: suspicious points to investigate |
| **Agent failure it guards** | Attacking only the happy path / the linked UI (**SHIFT 5**) | Mistaking a clean scan for a secure system (**SHIFT 1**) |
| **What it proves** | Nothing — it is the map | Nothing — it is a list of hypotheses |
| **Check** | `attack-surface-mapped` | `scanned-and-enumerated` |

The reason recon comes first is mechanical: a scanner can only scan what you point it at, and a proxy can only crawl the pages it reaches. If recon misses the stale `/api/v1` that the current UI no longer calls, the scanner never sees it, the exploit stage never tests it, and the forgotten endpoint ships live. **Recon thoroughness directly bounds everything downstream** — a hole you never mapped is a hole you never attack.

---

## STAGE 1 — Recon: map the surface (check `attack-surface-mapped`)

You cannot attack what you have not mapped. The deliverable of this stage is a written inventory of the authorized attack surface — exposed hosts and ports, the service and version on each, the technology stack, and (the part the agent skips) the content that is **not linked from the UI but still exists.** Recon splits into *passive* (observe without touching the target) and *active* (send packets to the target and watch how it responds).

### Passive recon — look before you touch

Passive recon gathers what is publicly available without sending traffic that the target would log as a probe — public DNS records, certificate-transparency logs (which reveal subdomains), the technology a page advertises in its headers and HTML, public code repositories, and anything the organization itself has published. It is the lowest-risk layer and it shapes where active scanning aims.

For an authorized self-test of your own system this is partly a paperwork exercise — you already know your domains — but do it anyway, because it surfaces the surface *you forgot you have*: a subdomain in a certificate-transparency log that points at a long-abandoned staging box, an old API host still resolving in DNS, a public bucket whose name appears in a repo. The agent failure here is assuming the surface is the one in the architecture diagram; passive recon checks the diagram against reality.

> **Scope note:** even passive recon can drift out of bounds — subdomain enumeration can return a third party's host, and a public repo may belong to a vendor, not you. Inventory what you find; only carry the *in-scope* hosts into active scanning.

### Active scanning — port & service mapping with nmap

Active recon sends packets and reads the responses. The workhorse is **`nmap`**: it tells you which ports are open on an in-scope host, what service is listening on each, and — with version detection — *what software and which version* that service is running.

The progression, on authorized hosts only:

- **Open ports** — which TCP/UDP ports respond at all. An open port is an exposed door; a service nobody meant to leave reachable (a database port open to the internet, a forgotten admin service) is found here.
- **Service identification** — `nmap`'s service/version detection (`-sV`) names the daemon on each open port: this is an `nginx`, that is `OpenSSH`, that is a `PostgreSQL`.
- **Version identification** — the exact version string, which is the input to the known-CVE check in STAGE 2. "`nginx`" is a service; "`nginx 1.18.0`" is a version you can cross-reference against published vulnerabilities.

The agent's failure mode (SHIFT 5) is scanning only the obvious ports (80/443) and calling the host mapped. Map the *whole* in-scope surface — the high ports, the UDP services, the management interface on an odd port — because the door nobody remembers is exactly the one an attacker walks through. Stay inside the rules of engagement from STAGE 0: aggressive timing and full-range scans can stress a service, so honor any DoS/stress exclusion, and run against the snapshotted staging mirror, never production with real users behind it.

### Tech-stack fingerprinting — what software, which version

Fingerprinting is the web-layer counterpart to `nmap`'s version detection: identify the framework, server, language runtime, CMS, JavaScript libraries, and their versions from response headers, cookie names, error-page styling, default paths, and the static assets a page loads. The output is a parts list of the running software with versions attached.

This matters for one concrete reason: **a version is the key to a known-CVE lookup.** If fingerprinting says the app runs a specific version of a framework with a publicly disclosed authentication-bypass CVE, that is a high-priority candidate before you have sent a single exploit. The map of *what software and which versions are exposed* is the bridge from recon (STAGE 1) into the version-based checks of scanning (STAGE 2).

### Content & directory discovery — the door nobody linked (SHIFT 5)

This is the heart of STAGE 1 and the single practice the agent's happy-path instinct most reliably skips. The UI links to the pages the developer wants you to use. An attacker does not use the UI — they look for what is *reachable but not linked*: the forgotten `/admin`, the `/backup` directory, the stale `/api/v1` left running after the UI moved to v2, the `.git` folder served by mistake, the `/debug` endpoint someone left enabled.

The tools are **`ffuf`** and **`gobuster`**: content-discovery fuzzers that take a wordlist of common paths and filenames and request each one against the target, reporting which return something other than "not found." They brute-force the *namespace*, finding what crawling the linked UI never would. This is recon's version of "feed the input the developer didn't expect" — here the unexpected input is a request for a path nobody advertised.

Why this is the agent's blind spot, named plainly (SHIFT 5): the agent's default is the cooperative path — it navigates the app the way the menu intends and treats the sitemap as the surface. Content discovery is the deliberately *un*-cooperative move: assume there is a door the UI hides, and go knock on every door in the wordlist. A forgotten admin panel or a stale API is often the most exploitable thing on the whole system precisely *because* it was forgotten — nobody hardened the door nobody remembered. **The unlinked path is the persistence the happy-path attacker walks past; mapping it is the whole point of this practice.**

> **Scope note:** content discovery generates a lot of requests; honor the rules of engagement and rate limits from STAGE 0, and run it against the staging mirror.

### Use the aegis threat model as your map

If the system was built or hardened with the `aegis` skill, it has a **threat model** — the defender's own enumeration of what is sensitive, where the trust boundaries are, and which attacks they anticipated. Read it as your map of *where to look hardest*: the assets `aegis` flagged as crown jewels are the assets your recon should map most completely, and the trust boundaries it drew are exactly where you aim the exploit stage.

But hold one caution from SHIFT 5 and SHIFT 3 at once: the threat model is the *defender's* map, and if agents built both the defense and the attack, **you share its blind spots.** Use it to prioritize, never as the boundary of your search. The most dangerous hole is in the surface *nobody modeled* — the endpoint that is not in the threat model because the team forgot it exists, which is precisely what content discovery is for. Let the threat model tell you where to look hardest; let `ffuf`/`gobuster` and your own enumeration tell you what the threat model missed.

### PREDICATE / DEFAULT / FALLBACK — how thorough is thorough enough

Recon depth is a cost, and the `attack-surface-mapped` gate clears when the surface is mapped *to the depth the system's risk warrants* (the depth-by-risk TREE in [decision-tree.md](decision-tree.md)). A fork to keep recon from being either a rubber stamp or an infinite crawl:

- **PREDICATE:** is the inventory complete enough that the scan and exploit stages will not be working from a surface with known gaps — every in-scope host port-mapped, every host fingerprinted, content discovery run against each web app, and the `aegis` threat model's crown jewels mapped most completely?
- **DEFAULT** on a coin-flip about whether to keep enumerating: **go one level deeper**, weighted toward the surface that touches data, money, or auth — an attacker only needs the one door you stopped short of, and an unmapped endpoint over sensitive data is the catastrophic miss. Under-mapping ships a live hole; over-mapping costs a little time.
- **FALLBACK** when you cannot tell whether the surface is complete (you suspect more subdomains, a host you cannot confirm is in scope, an API whose full route list you cannot enumerate): record the *known* surface, mark the *suspected-but-unmapped* region explicitly, and surface it to the user — for an in-scope gap, as recon to finish; for a scope-boundary question, **stop and confirm authorization** before touching it. Do not silently treat the mapped surface as the whole surface.

A single failed enumeration pass is not a clean bill (SHIFT 5): "the wordlist found nothing on the first run" is not "there are no hidden paths." Try another wordlist, another angle, before concluding the surface is flat.

---

## STAGE 2 — Scan: cast the wide net (check `scanned-and-enumerated`)

With the surface mapped, run the automated layer over it. STAGE 2 produces the **candidate list** — the suspicious points worth investigating at the exploit stage. Its single discipline, internalized from the very start (SHIFT 1), is that **scanning is the floor, not the verdict**: a scanner finds *known patterns*, and an empty result means those patterns were not found — it is not a clean bill of health.

### The automated layer — what runs

Three layers, run over the surface STAGE 1 mapped:

1. **A vulnerability scanner (DAST)** — an automated tool that probes the running application for known vulnerability signatures across the mapped endpoints. It is fast, broad, and shallow: it catches the well-known patterns and misses everything that requires understanding the application's intent.
2. **A web-proxy crawl** of every page and API parameter (next section).
3. **Version-based known-CVE checks** against the components fingerprinting identified (the section after).

These are *additive* and they are the cheap, automatable floor of the validation spectrum in [decision-tree.md](decision-tree.md) — the same automated layer the `aegis`/`flightline` security gates run in CI on every commit. The point of running them here, by hand at a milestone, is to produce a fresh, complete candidate list over the *current* mapped surface.

### The proxy crawl — every page, every parameter

Point an intercepting web proxy — **Burp Suite** or **OWASP ZAP** — at the application and crawl it so the proxy records every page, every request, and crucially **every input parameter** the app accepts: each query-string parameter, form field, header, cookie, and JSON body field. The proxy builds a complete picture of the app's input points, then its scanner replays each one with probe payloads, flagging the parameters that react suspiciously.

Why this layer matters beyond the surface scan: **every input parameter is an attack surface**, and the proxy's catalog of parameters is the list the exploit stage works through one by one. A parameter the crawl missed is a parameter nobody attacks. Drive the app through the proxy across its authenticated flows (logged in as the test users from STAGE 0) so the crawl reaches the pages and parameters behind the login, not just the public ones — most of the interesting surface is authenticated.

### Version-based known-CVE checks

Take the component-and-version list from fingerprinting and `nmap`'s version detection, and cross-reference each against published vulnerability databases: does this exact version of this framework, server, or library have a known, disclosed CVE? For dependencies, software-composition tools like **`trivy`** scan the declared dependency tree (and container images) against CVE databases and report known-vulnerable components with their severity.

A matched CVE is a strong candidate — but still a candidate (SHIFT 1): "this version has a published CVE" is "this *could* be exploitable here," not "this is exploitable here." The component may be present but the vulnerable code path unreachable; the CVE may require preconditions this deployment does not meet. It goes on the candidate list to confirm at the exploit stage, ranked high, not onto the findings list as proven.

### Holding the line: the candidate list is suspects, not findings (SHIFT 1)

This is the discipline the whole stage exists to enforce, and the place the agent most reliably declares victory too early. **A scanner finds known patterns; it does not prove exploitability, and an empty scan is not a secure system.**

Frame the entire output of STAGE 2 as a list of **suspects to investigate**, never as findings:

- Every scanner hit is a *hypothesis* to confirm by hand at the exploit stage — it may be a real hole or a false positive the scanner flagged on a pattern that does not actually exploit here.
- Every CVE match is a *candidate*, not a confirmed breach.
- An **empty scan is the most dangerous result of all**, because it looks the most like "done." It means *the known patterns were not found* — it says nothing about the chained exploit, the business-logic flaw, or the IDOR that no scanner understands, which are exactly what the exploit and chain stages exist to find. Reporting "the scan was clean, so it's secure" is the precise anti-pattern SHIFT 1 kills.

This is where the **scan-vs-exploit / confirm-vs-false-positive fork** in [decision-tree.md](decision-tree.md) takes over: each candidate is flagged-not-yet-confirmed until you actually exploit it (then it is a finding) or genuinely cannot after real effort (then it is a likely false positive — noted, not reported as confirmed). STAGE 2 hands that fork a populated candidate list; it does not resolve a single candidate itself. The proof happens in [exploitation-by-class.md](exploitation-by-class.md), and the defenses each candidate threatens — and the eventual fix — belong to the `aegis` skill, not here.

> The trap, stated once more so it cannot be missed: **scanning is the floor, not the verdict.** Necessary, nowhere near sufficient. The candidate list is where the real work starts.

---

## What the two gates inherit

**STAGE 1 → `attack-surface-mapped`** clears when the in-scope surface is mapped to risk-appropriate depth: passive recon done, `nmap` port/service/version mapping over every in-scope host, tech-stack fingerprinting, content/directory discovery (`ffuf`/`gobuster`) run to find the unlinked paths, and the `aegis` threat model used to prioritize — with any suspected-but-unmapped region recorded, and any scope-boundary question stopped and confirmed rather than scanned.

**STAGE 2 → `scanned-and-enumerated`** clears when the automated layer has run over that surface — a vulnerability scanner, a Burp/ZAP proxy crawl cataloging every page and parameter (authenticated flows included), and version-based known-CVE checks (`trivy` for dependencies) — producing a **candidate list explicitly framed as suspects, not findings.** An empty scan does not clear this stage as "secure"; it clears it as "the floor is run, now go attack."

Both stages prove nothing. They hand [exploitation-by-class.md](exploitation-by-class.md) a complete map and a list of suspects, and the scan-vs-exploit fork in [decision-tree.md](decision-tree.md) decides which suspects become findings. The proof is the attack, under authorization, in staging — never the scan.

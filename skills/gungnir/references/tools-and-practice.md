# The Toolkit, the Standards, and Safe Practice

This reference is the depth behind every stage of the [../SKILL.md](../SKILL.md) flight plan that reaches for a tool, a standard, or a place to practice — the layer the recon, scan, exploit, chain, and report stages all call into. It governs *what the standard, publicly-documented toolkit is for*, *which standards make a pentest repeatable and accountable*, *where to build the attack skill lawfully*, and *how to run the tools safely against a system you are authorized to attack*. The human-era→agent-era shift here is sharp and double-edged: the agent can now actually *run* `nmap`, `sqlmap`, an intercepting proxy — which is exactly what makes continuous self-attack feasible — but the agent's default is to run the tool, read the empty result as "secure," and stop, skipping the creative, persistent, business-logic attack the tool was only ever meant to *feed*. See [agent-era-shifts.md](agent-era-shifts.md) for *why* — **SHIFT 1** (a clean scan is not proof) and **SHIFT 4** (tools handle the rote; the creative attack is yours), with the authorization boundary from **SHIFT 2** governing every tool you point at anything. This file is the *how*: which tool, which standard, which lab, and the safety rails around all three.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and never relaxed by anything below:

> **A defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly authorized to test.**

Every tool in the kit produces *candidates*; none of them produces a verdict. Keep that line internalized as you read.

## Contents

- [The standard toolkit — what each tool is FOR](#the-standard-toolkit--what-each-tool-is-for)
- [attack-surface-mapped: mapping before you strike](#attack-surface-mapped-mapping-before-you-strike)
- [exploited-not-just-scanned: the tool is the floor, not the verdict](#exploited-not-just-scanned-the-tool-is-the-floor-not-the-verdict)
- [The standards — what makes a pentest repeatable and accountable](#the-standards--what-makes-a-pentest-repeatable-and-accountable)
- [Building the skill safely — legal practice ranges](#building-the-skill-safely--legal-practice-ranges)
- [Operating safely and accountably](#operating-safely-and-accountably)
- [Choosing the right tool or standard — the fork](#choosing-the-right-tool-or-standard--the-fork)

---

## The standard toolkit — what each tool is FOR

These are the standard, publicly-documented tools of authorized security testing — the same ones the OWASP Testing Guide names and that ship pre-bundled on **Kali Linux**, the distribution built to carry the whole kit so you do not assemble it by hand. Each has a *job*; the discipline is knowing which job, and remembering that every one of them outputs a lead to confirm, not a conclusion to report.

| Tool | What it is for | The stage it serves | What it does NOT do |
|---|---|---|---|
| **`nmap`** | Recon: discover live hosts, open ports, the service and version behind each port | recon — map the surface | tell you whether any service is *exploitable* |
| **Burp Suite / OWASP ZAP** | The intercepting proxy at the center of web testing — see and modify *every* request between browser and server; crawl, map, and replay | recon, scan, exploit | think of the attack for you; the proxy is the lens, you are the attacker |
| **Nikto** | A quick scan for common web-server configuration issues — stale software, dangerous default files, missing headers | scan — the fast floor | distinguish a real issue from a benign default |
| **`ffuf` / `gobuster`** | Content and directory discovery: brute-force paths against a wordlist to find what *isn't linked* from the UI (a forgotten `/admin`, a `/backup`, a stale API) | recon — the hidden surface | confirm that a found path is exploitable, only that it *exists* |
| **`sqlmap`** | SQL-injection *detection and confirmation* — point it at a parameter that reacts to a probe and it confirms injectability and characterizes it | exploit — confirm injection | decide *which* parameter to test (you find the reacting one first) |
| **Metasploit** | A framework of vetted modules for *known* vulnerabilities — match a fingerprinted version to a documented CVE module and confirm exploitability | exploit — known-CVE confirmation | invent a novel exploit, or do the business-logic abuse |
| **`trivy` / `dependency-check`** | Software-composition analysis (SCA): scan your dependencies and images for components with *known* CVEs | scan — the known-CVE layer | prove the CVE is reachable in *your* usage |

Read down the right-hand column once more before you start: not one of these tools closes the gap between "found" and "proven." That gap is the whole job, and it is yours.

**Burp/ZAP is the one to internalize.** Web testing is centered on the intercepting proxy because it makes the implicit explicit: every request the browser sends, you can pause, read, and rewrite before it reaches the server. The IDOR test (swap a resource ID), the injection probe (insert a single quote), the parameter-tampering test (change a price, skip a step) — all of them are "modify the request and watch the response," which is exactly what the proxy is for. `nmap` and the content-discovery tools tell you *where* the surface is; the proxy is where you actually *attack* it.

> **Kali is convenience, not a license.** The distribution bundles the kit so you stop fighting installation; it does nothing to change the one rule. A tool pre-installed and ready is precisely why the authorization gate (**SHIFT 2**, [scope-and-authorization.md](scope-and-authorization.md)) is absolute — the weapon being *easy to fire* is what makes confirming the target non-negotiable.

---

## attack-surface-mapped: mapping before you strike

> Check: `attack-surface-mapped`. Governing shifts: **SHIFT 1** (a clean tool run is the floor), **SHIFT 4** (the tools handle the rote enumeration so you can do the attack). Depth on the recon method itself lives in [recon-and-enumeration.md](recon-and-enumeration.md); this section is the *toolkit* behind it.

**Agent failure mode this guards against:** the agent maps only the happy path — the pages the UI links to, the endpoints the docs list — and reads that as "the surface." A real attacker's first move is to find the surface *nobody meant to expose*, because that is where the defenses were never applied. You cannot attack what you have not mapped, and you cannot map only what the system politely shows you.

The mapping toolkit, in order:

1. **`nmap` for the network surface.** Discover which ports are open and, with version detection, what service and version sits behind each. A stale, exposed service is a finding waiting to happen — but at this stage it is a *candidate*, an entry on the map, not a confirmed hole.
2. **Tech-stack fingerprinting.** Identify the framework, server, and library versions in play (response headers, error-page signatures, the proxy's own analysis). Versions feed the known-CVE check later (`trivy`/Metasploit), and a fingerprint tells you *which* class of attack the stack is prone to.
3. **`ffuf` / `gobuster` for the hidden web surface.** Brute-force paths against a wordlist to surface the unlinked content — the forgotten admin panel, the `/backup`, the stale `/api/v1` left running beside `/api/v2`. This is the single most valuable recon move an agent will skip, because it is the un-cooperative one: it looks for what the system did *not* advertise.

**The `aegis` threat model is your map of where to dig hardest.** If a threat model already exists (built by the `aegis` skill), it tells you where the designers thought the danger was — start there, but do not stop there: the value of *your* mapping is finding the surface the threat model missed. Hand the *defense* of any exposed-but-unintended surface back to `aegis`; your job here is only to find it and mark it.

- **PREDICATE:** does the mapped surface include the content that is *not* linked from the UI? **DEFAULT** on any web target: run content/directory discovery (`ffuf`/`gobuster`) as a non-optional step, not just a proxy crawl of linked pages — the crawl follows links, and the dangerous paths are the unlinked ones. **FALLBACK** when a wordlist run is too noisy or slow for the staging window: run a focused list of the high-value guesses (`/admin`, `/backup`, `/.git`, `/api/<older-version>`, common framework defaults) and record the surface as *partially enumerated*, to be completed before the exploit stage rather than declared done.

A clean recon — every tool ran, nothing alarming surfaced — is a mapped surface, never a safe one. The map is the input to the attack; it is not the attack.

---

## exploited-not-just-scanned: the tool is the floor, not the verdict

> Check: `exploited-not-just-scanned`. Governing shifts: **SHIFT 1** (a clean scan is not proof) and **SHIFT 4** (the creative attack is yours). This is the spine of the whole file. The hands-on, by-class method is in [exploitation-by-class.md](exploitation-by-class.md); the scanner-vs-exploit / false-positive call is in [decision-tree.md](decision-tree.md). This section is *why no tool clears this gate for you*.

**Agent failure mode this guards against:** the agent runs the scanner, reads "no vulnerabilities found" (the cleanest-looking output there is), and concludes the system is secure — or runs the scanner, gets a list, and reports *the list* as "the findings." Both are the same error: mistaking the tool's output for the verdict. A scanner finds **known patterns**; it proves nothing about exploitability, and it is structurally blind to the chain and the business-logic flaw. The tools below are leads-generators. The lead becomes a finding only when *you* break the thing.

What each tool actually settles — and what it leaves for you:

| Tool says | That means | You still must |
|---|---|---|
| `nmap`: port 8080 runs Tomcat 8.5 | a service and version, on the map | confirm whether *this* deployment is actually reachable and vulnerable |
| `trivy`: dependency X has CVE-YYYY | a known-CVE component is present | prove the vulnerable code path is *reachable in your usage* — a present CVE is not an exploitable one |
| Nikto / a DAST scanner: "possible XSS in `q`" | a parameter matched a pattern | put a real probe in `q` and watch it *execute*, or discard it as a false positive |
| `sqlmap`: parameter `id` is injectable | injection *confirmed* (this tool actually exploits) | turn confirmed-injectable into demonstrated impact — what data did it reach? |
| Burp/ZAP active scan: a flagged finding | a candidate, framed as a suspect | reproduce it by hand through the proxy before you call it real |

Notice the asymmetry in the table: `sqlmap` and Metasploit *do* confirm exploitability for their narrow classes (injection, known-CVE), which is exactly why they sit at the exploit stage rather than the scan stage. The pure scanners (`nmap`, `trivy`, Nikto, a DAST crawl) only ever hand you a candidate. The work that no tool in the kit does at all — chaining a low-severity leak into account takeover, driving a discount negative, reaching a state out of order — is invisible to every scanner *and* to an agent that does not model the system's intent. That work is [chaining-and-impact.md](chaining-and-impact.md), and it is the reason a pentest is worth more than a scan.

**The two ways an agent makes the kit vacuous, and the rule against each:**
- *Reporting the scan as the result.* A scanner's output is a list of hypotheses. Run it, then go confirm each one by real exploitation; discard what you cannot reproduce. Never report a scanner's flags as "the findings."
- *Reporting an empty scan as "secure."* An empty result means the known patterns were not found — necessary, nowhere near sufficient. Report what you *attacked* and what survived, not what a tool failed to flag.

- **PREDICATE:** has this candidate been *actually exploited or reproduced*, or only flagged by a tool? **DEFAULT** on a coin-flip about whether a flag is real: *try to exploit it* before believing or dismissing it — confirmation by real attack is the entire point, and both a dismissed real hole and an un-reproduced scanner flag are failures. **FALLBACK** when you cannot safely confirm exploitability inside the snapshotted staging environment: reproduce it as far as is safe, mark it *suspected-unconfirmed* with the evidence, and surface it to the user rather than asserting either way.

Once a finding is confirmed, the *fix* is not yours to hand-craft here — route the defense to the `aegis` skill and the change to the `husbandry` skill, then re-attack to verify it is closed ([report-fix-retest.md](report-fix-retest.md)).

---

## The standards — what makes a pentest repeatable and accountable

A tool run is an action; a *standard* is what makes the action repeatable, complete, and accountable to someone other than you. Three matter, and they answer three different questions.

| Standard | The question it answers | How you use it |
|---|---|---|
| **PTES** (Penetration Testing Execution Standard) | *What are the phases, in order?* | The process spine: pre-engagement (scope/authorization) → intelligence gathering (recon) → threat modeling → vulnerability analysis (scan) → exploitation → post-exploitation → reporting. The six gungnir stages follow this arc. |
| **OWASP Testing Guide** | *How do I test each specific class?* | The method per vulnerability class — the concrete probe for access control, injection, auth, XSS, misconfiguration. It is the source the exploit stage draws its by-class technique from. |
| **OWASP ASVS** (Application Security Verification Standard) | *What checklist can I hold this system to?* | A leveled list of verifiable security requirements. You do not just "look for bugs"; you *verify against the checklist*, which converts "we tested it" into "we verified these N requirements, at this level, and here is the result." |

The relationship is layered, not redundant: **PTES** gives the phases, the **Testing Guide** gives the technique inside the vulnerability-analysis and exploitation phases, and **ASVS** gives the acceptance criteria you check the result against. Together they make a pentest *reproducible* — two testers (or two agents) following them reach comparable coverage — which is precisely the property [decision-tree.md](decision-tree.md) exists to enforce and the property an agent, left to improvise, will not produce on its own.

This is also the answer to the **OWASP Top 10**: the Top 10 names the *classes* (broken access control, injection, …); the Testing Guide tells you how to *test* each; ASVS tells you what *passing* looks like. The Top 10 is the map of what to attack; these standards are how you attack it accountably and how you prove you covered it. Severity, when you rank findings, uses **CVSS** so the ranking is comparable across tests rather than a personal opinion — depth on that in [report-fix-retest.md](report-fix-retest.md).

> The agent failure these standards guard against: *unrepeatable, ad-hoc poking that covers whatever caught the agent's attention and silently skips the rest.* A standard is a checklist the agent cannot drift off of without it being visible.

---

## Building the skill safely — legal practice ranges

You do not learn to attack on a system that matters, and you never learn on a system you do not own. The lawful way to get good at the attack methodology is a **deliberately-vulnerable practice application** — software *built to be attacked*, that you may probe freely because attacking it is its entire purpose. Practice the technique there until it is fluent, then apply it to your own authorized system.

| Lab | What it is | Best for practicing |
|---|---|---|
| **OWASP Juice Shop** | A modern, deliberately-insecure web app (a full single-page storefront) with a built-in scoreboard of challenges | the full OWASP Top 10 on a realistic modern stack; end-to-end web attack flow |
| **DVWA** (Damn Vulnerable Web Application) | A classic PHP/MySQL app with selectable difficulty levels per vulnerability | learning one class at a time (SQLi, XSS, command injection) with the difficulty dialed up gradually |
| **WebGoat** | An OWASP teaching app with guided, lesson-structured exercises | the *guided* path — each lesson explains the class as you exploit it |

These exist so you can run `sqlmap` against a parameter, swap an ID for an IDOR, fire an XSS probe, and chain two flaws — *for real*, against a target where doing so is sanctioned — without touching anything you are not authorized to touch. The technique is identical to what you will run against your own staging system; only the target's authorization differs, and on a practice lab that authorization is built in.

> **The line this respects (SHIFT 2):** a practice lab is authorized *by design* — that is the whole point of it. Your own staging mirror is authorized *by the user confirming it out loud*. Everything else is unauthorized, and nothing about being good at the technique changes that. Get fluent on the lab; aim the fluency only at what you own or are permitted to test.

---

## Operating safely and accountably

Authorization clears the *whether*; this section is the *how* — running the tools in a way that is recoverable, auditable, and strictly bounded. An authorized attack is still an attack: it can corrupt data, take a service down, or wander out of scope if you are careless.

1. **Snapshot / back up the target first.** Attack a staging or pre-production mirror that resembles prod, **snapshotted or backed up before the first packet**, never production with real user data. `sqlmap` can modify a database; an upload test can write files; a fuzzing run can wedge a service. A snapshot makes any damage a `restore`, not an incident.
2. **Log every action you take.** Keep a record of every command, every payload, every target and timestamp — for two reasons. First, **reproduction**: a finding you cannot reproduce is not a finding, and the log is the reproduction. Second, **audit**: an authorized test must be accountable to the owner, and the log is the account of what you did and what you did not.
3. **Stay strictly inside the authorized scope.** Point every tool only at the in-scope targets pinned at STAGE 0. The dangerous mistakes are the easy ones: a wordlist run that wanders to a neighboring host, an `nmap` range that includes an IP you do not own, a `sqlmap` follow that pivots to a third-party API the app calls. The third-party services your system *depends on* are out of scope even though your system touches them — never attack a system you merely depend on.
4. **Never aim a tool at an unconfirmed target.** Before any tool runs, the target must be confirmed yours or authorized. The agent feels nothing about whose system an IP belongs to; the tool is the same weapon whether it points at your staging box or a stranger's production. **Re-affirm the SHIFT 2 boundary every time you point a tool somewhere new** — confirmation is not done once at STAGE 0 and forgotten; it gates each new target. There is no DEFAULT toward action on authorization: if you cannot confirm, you stop. Detail in [scope-and-authorization.md](scope-and-authorization.md).

These rails are why continuous self-attack is *safe* to run cheaply: a snapshotted, logged, scoped, confirmed attack is recoverable and accountable, which is exactly what lets you make it routine (the continuous-validation move in [report-fix-retest.md](report-fix-retest.md)).

---

## Choosing the right tool or standard — the fork

Tools produce candidates and handle the rote; they do not prove exploitability and cannot do the creative chain or the business-logic abuse. A clean tool run is the **floor, never the verdict** (**SHIFT 1**), and the tool exists to free you for the attack only it cannot do (**SHIFT 4**). With that held, the fork for *which* tool or standard a given testing need calls for:

- **PREDICATE:** what is the testing need in front of you — map the surface, run the automated floor, confirm a specific candidate, structure the whole engagement, or learn a technique?

| If the need is… | Reach for… | Because |
|---|---|---|
| map the network/web surface | `nmap` + `ffuf`/`gobuster` + the proxy's crawl | find the ports, services, and *unlinked* paths first |
| the automated known-pattern floor | a DAST scanner / Nikto + `trivy`/`dependency-check` | cheap, fast, finds the known patterns and known-CVE deps |
| confirm a specific injection candidate | `sqlmap` (after a manual single-quote probe finds a reacting parameter) | it confirms and characterizes injection; you find the parameter |
| confirm a known-CVE candidate | Metasploit's vetted module for that CVE | a vetted module against a fingerprinted version |
| attack the web app by hand | Burp Suite / OWASP ZAP (the intercepting proxy) | modify every request — the IDOR, the tamper, the probe all live here |
| structure the whole engagement | PTES (phases) + OWASP Testing Guide (per-class method) + ASVS (the checklist) | repeatable, complete, accountable coverage |
| get fluent before touching real targets | OWASP Juice Shop / DVWA / WebGoat | practice the technique where attacking is sanctioned by design |

- **DEFAULT** on a coin-flip about which tool: pick the one that gets you to a **confirmed exploitation** fastest, and treat its output as a candidate to verify by hand — the point is never the tool's report, it is the proof you build from it. When the choice is "run another scanner" vs "go exploit what I already found," **go exploit** — more scanning is more candidates, not more proof.
- **FALLBACK** when you are unsure a tool is the right one, or its output is ambiguous: drop to the manual move the tool automates (the single-quote probe by hand, the ID-swap by hand, the path-guess by hand) to understand the behavior, *then* decide whether to bring the tool in to scale it. The manual probe is always available and always teaches you more than a tool's verdict; the tool is for scaling a technique you already understand.

The thread back through everything above: the kit and the standards are the *floor and the frame* — they make the rote cheap, repeatable, and accountable, which is exactly what frees you to spend your effort on the confirmation, the chain, and the impact that no tool produces. Run the tools; never let the tool's green stand in for the attack.

---

**Cross-links:** [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 1 and SHIFT 4 — *why* the tool is the floor; SHIFT 2 — *why* authorization gates every target) · [decision-tree.md](decision-tree.md) (the authorization gate, the validation spectrum, depth-by-risk, the scan-vs-exploit call) · [scope-and-authorization.md](scope-and-authorization.md) (the first gate the safety rails enforce) · [recon-and-enumeration.md](recon-and-enumeration.md) (the mapping method the toolkit serves) · [exploitation-by-class.md](exploitation-by-class.md) (the by-class hands-on attack) · [chaining-and-impact.md](chaining-and-impact.md) (the creative work no tool does) · [report-fix-retest.md](report-fix-retest.md) (rank, fix via `aegis`/`husbandry`, re-test, make it continuous) · [../SKILL.md](../SKILL.md) (the six-stage flight plan this toolkit layer serves).

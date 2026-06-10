# Scope and Authorization — the Gate That Is Never a Judgment Call

This reference is the depth behind **STAGE 0 — Scope** of the [../SKILL.md](../SKILL.md) flight plan, the gate that must clear before a single packet is sent — it governs *whether you are allowed to attack this target at all*, and it is the one gate in the entire suite with no default toward action. It pins five things: that the target is a system the user **owns** or is **explicitly, in writing, authorized to test**; the exact in-scope vs out-of-scope boundary; the rules of engagement; a safe (snapshotted staging) environment; and the cloud provider's penetration-testing policy. The human-era→agent-era shift here is the safety-critical one: a human tester carried, as basic ethics and basic legality, a felt sense of *whose system this is* and a fear of the consequences of pointing a weapon at the wrong one — the scope document merely formalized an instinct already in the room. The agent has none of it. It can now actually run the attack — point `nmap`, `sqlmap`, an exploit framework at a target — and it cannot tell your staging server from a third party's production by instinct, because a tool that finds a vulnerability is the same tool whichever way it points. For *why* this turns authorization from an ethical reflex into a hard, machine-checked precondition, read **SHIFT 2** in [agent-era-shifts.md](agent-era-shifts.md). This file is the *how*: how to confirm authorization, how to draw the scope boundary, how to set the rules of engagement, and how to stand up a safe environment, so two agents framing the same engagement reach the same locked scope.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and overriding every default below:

> **A defense is proven only by a real, authorized attack — a clean scan is not proof — and you attack only what you own or are explicitly authorized to test.**

Everything in this file is a consequence of that sentence. The check this file delivers is `scope-and-authorization-locked`: the target confirmed authorized out loud with the user, the in/out-of-scope boundary written down, the rules of engagement agreed, a snapshotted staging environment in place, and the provider policy honored — and if authorization cannot be confirmed, the run **stops** here.

---

## The absolute first gate — authorization, confirmed out loud, no default toward action

Authorization is the first thing you establish and the only thing in the whole suite that is *never* sized to risk, never a coin-flip, never waived because "it's probably ours." Before any recon, before any scan, before you "just check" a single port, you must have the user confirm — explicitly, out loud, in this conversation — that the exact target you are about to attack is a system they **own** or are **explicitly, in writing, authorized to test**.

Why this is non-negotiable and why it gets no default toward proceeding: the agent holds a real weapon and **feels nothing about whose system it is.** A human tester would hesitate at an unfamiliar IP; the agent will not. It optimizes the task in front of it — "the user asked me to find vulnerabilities" — and a `sqlmap` run that breaches an authorized staging app is the same command, byte for byte, that breaches an out-of-scope production system. The agent supplies no conscience about where the weapon points, so the line cannot live in instinct; it must be an explicit, confirmed, written gate. **Attacking a system you do not own and are not authorized to test is out of bounds, full stop, regardless of intent** — it is unlawful, not merely impolite, and "I was only checking" is not a defense.

This is the agent failure mode this gate guards against: **the agent feels nothing about authorization** and will point a real tool wherever the task seems to lead. So the gate is built to not rely on feeling.

> **PREDICATE:** has the user confirmed, explicitly and in this conversation, that this exact target is a system they **own** or are **authorized in writing** to test?
> **DEFAULT:** there is none. This is the one fork in the engine with **no DEFAULT toward action** — a coin-flip resolves to *stop*, not to attack.
> **FALLBACK:** if you cannot confirm authorization — the user is vague, the target is "a system we work with," ownership is unclear, the written permission doesn't exist or doesn't cover this target — **STOP.** Do not recon, do not scan, do not send one probe. The fallback is to *not proceed* and to ask the user to establish ownership or obtain written authorization first. Say so plainly.

"Probably fine to test this" is not authorization. Probably is exactly the gap this gate exists to close, because the agent cannot feel the line and will read "probably" as "yes."

---

## In scope vs out of scope — and the third-party services you never touch

Authorization is not a blanket; it covers *specific* targets. The second thing the gate pins is the exact boundary between what you may attack and what you may not — written down, so it is unambiguous and so the tools can be pointed only at the authorized list.

| Boundary | What it names |
|---|---|
| **In scope** | the exact domains, IPs, hostnames, and applications you are authorized to attack — by precise identifier, not "the app" loosely |
| **Out of scope** | everything else — and *named* where there is any chance of confusion (a shared host, a sibling subdomain, an admin panel on a different box) |
| **Above all out of scope** | **third-party services and dependencies you do not own** — the payment processor, the auth provider, the SaaS API, the CDN, the upstream library's hosted service — never attacked, even though your system calls them constantly |

The trap the agent walks into here is the third-party dependency. Your application *touches* a payment processor, an identity provider, a managed database, an email API — so when the agent maps the attack surface it will find those endpoints in the traffic and treat them as part of "the system." **You never attack a system you merely depend on.** Your authorization covers your own code and your own infrastructure; it does not extend to the services you integrate with, no matter how tightly your app is wired to them. Attacking your payment processor's API because your checkout flow calls it is attacking a third party — the same out-of-bounds line, just disguised as "testing my own feature." When recon surfaces a dependency you don't own, it goes on the **out-of-scope** list explicitly, and the tools are kept off it.

The agent failure mode this guards against: **the agent attacks a system it merely depends on** because the dependency shows up in its own app's traffic and looks in-bounds. Name the third parties as out-of-scope at Scope, before recon can blur the line.

> **PREDICATE:** is this endpoint a system the user owns / is authorized to test, or a third-party service their app merely *calls*?
> **DEFAULT:** if you cannot tell whether you own an endpoint that appeared in your own app's traffic, treat it as **out of scope** and ask — the conservative error (skipping something you owned) costs a little coverage; the other error (attacking a third party) is the line you do not cross.
> **FALLBACK:** when ownership of a surfaced endpoint is genuinely unclear, do not probe it; list it as *unconfirmed — out of scope pending confirmation* and surface it to the user to resolve before any tool touches it.

---

## Rules of engagement — what's allowed, when, who to call, what happens to data

With *what* you may attack pinned, the rules of engagement pin *how*. This is the agreement that keeps an authorized attack from doing authorized damage, and it has four parts.

- **Allowed and disallowed techniques.** Agree which classes of attack are in bounds. The default exclusion that matters most: **no denial-of-service or stress/load testing unless it is explicitly agreed** — a DoS test can take the service down for real, and "it was a test" doesn't bring it back up. Most authorized self-tests are about finding *exploitable* holes (injection, broken access control, misconfiguration), not about proving you can knock the service over; exclude DoS by default and only include it if the user explicitly opts in for a target that can absorb it. Likewise agree the posture on anything destructive or irreversible before you run it.
- **The time window.** When the test runs — so the attack traffic is expected, not mistaken for a real breach, and so it lands when someone can respond. An authorized attack that fires at 3 a.m. with no one watching is how a snapshot-restore that should have happened doesn't.
- **The emergency contact.** Who to reach the instant something goes wrong — a service degrades, data looks corrupted, you hit something you didn't expect. There must be a named human reachable during the window who can stop the test and trigger recovery.
- **How data encountered is handled.** A real attack will surface real (or realistic) data — user records, secrets, internals. Agree up front that any sensitive data encountered is handled minimally: not exfiltrated, not retained beyond what proves the finding, and reported through the finding, not copied around. Prefer a staging environment seeded with synthetic data precisely so this question is small.

The agent failure mode here: **the agent attacks the happy path of "find vulnerabilities" and runs whatever technique surfaces one** — including a stress test that takes the box down, at a time no one is watching, with no plan for the data it pulls. The rules of engagement convert "find holes" into "find holes *within these bounds, in this window, with this contact, handling data this way*."

> **PREDICATE:** is this technique on the agreed-allowed list, inside the window, and non-destructive (or explicitly opted-in)?
> **DEFAULT:** if a technique is destructive, DoS-shaped, or not clearly on the allowed list, treat it as **disallowed** and confirm before running it — the recoverable error is asking; the unrecoverable one is a downed service or corrupted data.
> **FALLBACK:** when you cannot tell whether a technique is in bounds, do not run it; ask the emergency/scope contact and record the question rather than proceeding on assumption.

---

## A safe environment — staging, snapshotted, never production with real data

An authorized attack is still an attack: it can corrupt data, leave a system in a bad state, or take a service down. So the fourth thing the gate pins is *where* you attack. The rule is plain: **attack a staging or pre-production environment that mirrors production, snapshotted or backed up first — never production carrying real user data.**

- **Mirror, not the real thing.** The target should be a faithful staging copy of production — same stack, same versions, same config shape — so the findings transfer, but with **synthetic or anonymized data**, so a breach during the test exposes nothing real. A deliberately-vulnerable practice lab (the `OWASP Juice Shop`, `DVWA`, `WebGoat`) is the safest target of all for building the skill; the `tools-and-practice.md` reference covers those.
- **Snapshotted first.** Take a snapshot or verified backup of the staging environment *before* the first probe, so any corruption or downed service is a restore away. The snapshot is what makes the attack reversible; without it, an authorized test can do unauthorized-looking damage you can't undo.
- **Not production with real data, ever.** Production is where the real users and the real data live; an attack there can leak real records or take down a live service. If the only faithful target is production, that is a reason to *build a staging mirror first*, not a reason to attack prod.

This is the same authorization-gate environment row the [decision-tree.md](decision-tree.md) authorization gate pins — see that gate's table for the canonical lines on ownership, in/out-of-scope, rules of engagement, environment, and provider policy together; this section is the depth on *why* the environment must be snapshotted staging, not a restatement of the table.

The agent failure mode this guards against: **the agent attacks production because that is where the app actually is**, and runs a real exploit against real data with no snapshot to fall back to. Stand up the snapshotted staging mirror first; point the weapon there.

---

## Cloud-provider penetration-testing policy — and writing the whole scope down

If the target runs on a cloud provider — `AWS`, `GCP`, `Azure` — there is one more gate before the tools come out: **the provider's penetration-testing policy.** You own your application and your account, but the underlying infrastructure is the provider's, and most providers publish rules about what self-testing is permitted on it. The broad pattern (confirm the current specifics against the provider's own policy — do not test from memory): many common application-layer tests on your own resources are permitted without prior approval, but certain test types — notably anything DoS/stress-shaped, and tests against certain managed services — require **prior notice or are prohibited outright.** Running a forbidden test type against your own cloud-hosted app can still violate the provider's terms and trip their abuse detection. So: identify the provider, find its current penetration-testing policy, and confirm your planned techniques are within it before you start.

And the closing act of the whole gate: **write the scope and authorization down so it is unambiguous.** The owned/authorized confirmation, the in-scope and out-of-scope lists (with the third-party services named), the rules of engagement (allowed techniques, window, contact, data handling), the snapshotted-staging environment, and the provider-policy check — recorded, not held in the agent's head. The written scope is what makes the boundary checkable at every later gate; "I think this was in scope" is exactly the ambiguity this gate exists to remove.

> **PREDICATE:** is the target on a cloud provider, and have you confirmed the planned techniques are within that provider's current penetration-testing policy, with the whole scope written down?
> **DEFAULT:** there is no default toward proceeding on the authorization branch. If the provider policy is unconfirmed for a test type that may require notice (especially anything DoS-shaped), treat it as **not permitted** until confirmed — and if ownership/authorization itself cannot be confirmed in writing, **STOP**: the gate does not clear and no later stage runs.
> **FALLBACK:** when the provider policy or the authorization is unconfirmable in the moment, do not proceed; surface exactly what is missing to the user, and resume only once it is confirmed and written down.

---

## What this gate hands forward

When `scope-and-authorization-locked` clears, it hands the rest of the run a target that is *safe to attack*: confirmed authorized out loud, bounded by a written in/out-of-scope list that keeps the tools off third parties, governed by agreed rules of engagement, hosted on a snapshotted staging mirror, and clear of the cloud provider's prohibitions. Every later stage inherits that boundary — recon enumerates only the authorized surface, the exploit stages fire only at in-scope targets, and the snapshot is what lets a confirmed exploit be reproduced without fear. The defenses this attack exists to *prove* are the `aegis` skill's; the fixes a finding drives are handed to the `aegis` skill for the defense and the `husbandry` skill for the change. But none of that runs until this gate clears — because the agent holds a real weapon and feels nothing about whose system it is, and authorization is the one line that is never a judgment call. If it cannot be confirmed, the answer is not "proceed carefully"; the answer is **stop.**

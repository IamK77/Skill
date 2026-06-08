# Versioning, Compatibility & Dependency Currency

This reference is the depth behind **STAGE 4 — Evolve** of the [../SKILL.md](../SKILL.md) flight plan, the stage where a living system's interfaces and dependencies have to change *without* stranding the code and people that lean on them. It governs two bound-together obligations: *when you change something others depend on, you communicate and honor the contract* (semantic versioning, backward compatibility, graceful deprecation), and *the third-party code you depend on is kept continuously current* (small frequent upgrades, EOL tracked and beaten) — rather than the agent's two defaults of breaking the interface it was told to change and leaving the dependency frozen until it explodes. In the human era both were felt responsibilities: an engineer changing a public API flinched at the downstream callers it would break, and a responsible maintainer bumped dependencies as ongoing hygiene, uneasy at a framework drifting toward end-of-life. Neither instinct survives the agent. Read [agent-era-shifts.md](agent-era-shifts.md) — specifically **SHIFT 6 (the agent breaks callers and lets dependencies rot)** — for *why* these shift; come here for *how* to enforce them. The router that decides break-vs-deprecate and the upgrade cadence at a fork is in [decision-tree.md](decision-tree.md); the safety net every breaking-or-bumping change rides on top of is the test suite the `assay` skill designs.

Every fork below states three things, so two agents evolving the same system reach the same call:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact, inherited from [decision-tree.md](decision-tree.md), overrides every DEFAULT and FALLBACK here:

> **Software is read and changed far more than it is written — optimize for the next change, not this one.** An interface change that ships fast by breaking its callers, or a frozen dependency that saves friction today, is a loss the agent books as a win: the cost lands on the *next* change — every downstream caller's incident, the emergency migration off a dead framework — and the agent, optimizing the change in front of it and feeling none of the future cost, will not see it. When a fork here is a real toss-up, err toward the move that keeps the next change cheaper and more reversible: deprecate over break, a small frequent bump over a deferred giant one, migrate before EOL over patch-after.

---

## Part 1 — Semantic versioning: the version is a contract

A version number is not decoration and not a build counter — it is a **message to every consumer about what an upgrade will cost them**. Semantic versioning (`semver`, the `MAJOR.MINOR.PATCH` scheme) makes that message precise, so a consumer can read `2.4.1 → 2.5.0` and know, without reading your diff, that it is safe to take. Each component signals exactly one thing:

| Component | Bumps when… | What it promises the consumer | Example |
|---|---|---|---|
| **MAJOR** (`X`.0.0) | you make an **incompatible / breaking** change to the public contract | *upgrading may break you; read the migration guide before taking this* | `2.7.3 → 3.0.0` |
| **MINOR** (`x`.`Y`.0) | you **add** functionality in a backward-compatible way | *safe to take; new capabilities are available, nothing you used changed* | `2.7.3 → 2.8.0` |
| **PATCH** (`x`.`y`.`Z`) | you make a backward-compatible **bug fix** | *safe to take; behavior you relied on now works as it was always meant to* | `2.7.3 → 2.7.4` |

The discipline that makes this contract worth anything: **a breaking change is a MAJOR bump, full stop.** If you change a function signature, remove a field, tighten an input validation, alter a default, or change an observable behavior callers depend on — that is MAJOR, even if the diff is one line. The agent's failure here is to slip a breaking change into a MINOR or PATCH because the *code change* was small; the size of the version bump tracks the **blast radius on consumers**, never the size of the diff. A silent break shipped as a patch is worse than an honest break shipped as a major, because the patch lies: consumers auto-take patches precisely because patches promise safety.

**The `0.x` caveat.** Before `1.0.0`, semver explicitly suspends the contract: under `0.y.z` *anything may change at any time*, and the convention is that `0.y` increments (`0.4 → 0.5`) can carry breaking changes. So `0.x` is a signal in itself — it means "this interface is not yet stable; do not build on it as if it were." Two consequences for an agent: (1) do not read a `0.x` dependency's minor bump as safe the way you would a post-`1.0` minor; treat `0.x` upgrades as potentially breaking and gate them with tests. (2) Publishing `1.0.0` is a *commitment* — it tells the world the contract is now binding and you will honor semver from here. Don't reach `1.0` until you can keep that promise, and once you've made it, keep it.

```
PREDICATE: does this change alter the public contract in a way an existing caller could observe?
├─ Removes / renames / changes the type or shape of something public,
│   changes a default, tightens validation, changes observable behavior ──► MAJOR.
├─ Adds new public surface, leaves all existing surface working unchanged ──► MINOR.
└─ Fixes a bug, public surface and intended behavior unchanged ────────────► PATCH.
```

**DEFAULT** when you genuinely can't tell whether a change is breaking (a subtle behavior shift, an edge case a caller might rely on): treat it as **breaking → MAJOR**. Over-bumping costs a consumer a moment's caution; under-bumping ships a silent break to everyone who trusted the smaller number. **FALLBACK** when the project has no versioning scheme at all (the common AUDIT finding — an internal library shipped as "whatever's on `main`"): adopt semver and cut a deliberate baseline version *before* the next change, so subsequent changes have a contract to be measured against; you cannot communicate compatibility you never started numbering.

---

## Part 2 — Backward compatibility: the obligation to callers you cannot see

A **public API** is any interface other code depends on: a library's exported functions, a service's REST/RPC endpoints, an event schema, a CLI's flags, a config file's keys, a database view another team reads. The compatibility question is the same for all of them: **does the change keep existing callers working?** Two categories, and the line between them is the whole game:

| Change kind | Definition | Examples | Version impact |
|---|---|---|---|
| **Additive (non-breaking)** | every existing caller keeps working unchanged; you only *add* | add a new optional parameter (with a default), a new endpoint, a new optional field, a new method | MINOR |
| **Breaking** | some existing caller stops working, or works differently | remove/rename a function or field, make an optional param required, change a return type, change a status code, tighten validation, change a default | MAJOR (after deprecation — Part 3) |

The design principle is to **prefer additive evolution** and structure interfaces so growth doesn't force a break: accept new optional inputs rather than changing existing ones; return richer objects rather than changing existing fields' meaning; add a new endpoint or a new version of one rather than mutating the live one. Tolerant reading on the consumer side and additive writing on the producer side (the robustness principle, applied with care) buys years of compatible evolution.

This is exactly where **SHIFT 6** bites. The agent feels **no obligation to callers it cannot see.** Told "rename this method" or "change this response to return X," its cheapest, most literal move is to *do precisely that, in place* — rename it, drop the old field, change the signature — because the consumers aren't in its context window and breaking them carries no felt cost. A human changing a widely-used API hesitates because they can picture the pager going off downstream; the agent pictures nothing. So backward compatibility cannot be left to the maintainer's conscience; it must be a **checked property of the change**: before any public-surface edit, the question "who depends on the current shape, and does this keep them working?" is asked explicitly, and a change that fails it is routed into deprecation (Part 3), not shipped as-is.

```
PREDICATE: does any consumer outside this change's blast radius depend on the current shape/behavior of this interface?
├─ Provably private (you can enumerate every caller and they're all in this change) ──►
│     change it freely; bump per semver (Part 1).
├─ Yes — a known consumer depends on it ──────────────────────────────────────────────►
│     do NOT change in place. Keep the old path working; deprecate it (Part 3); MAJOR + migration.
└─ You cannot enumerate the consumers (public / widely-used / external API) ───────────►
      treat as breaking by default; deprecate gracefully, MAJOR-bump, ship a migration path.
```

**DEFAULT** on a coin-flip about whether something is "really" depended on: assume **yes, keep the old path working and deprecate it.** A deprecation cycle is cheap; a surprise break is every downstream caller's incident, and you'll spend more time on the incident bridge than the deprecation window would ever have cost. **FALLBACK** when you can't enumerate consumers because the API is public or its reach is unknown: treat the contract as binding — never silently change a contract you cannot *prove* is private. The decision-tree's [break-vs-deprecate router](decision-tree.md) is the canonical form of this fork; this section is the *why* behind it.

---

## Part 3 — Graceful deprecation: never delete in place

When something public genuinely must go, the answer is **not** to delete it — it is to **deprecate** it: announce it is going, give callers time and a documented path to move, then remove it only in a later major version. "Deprecate" means "marked as obsolete, still working, scheduled for removal" — the opposite of "deleted." The lifecycle has a fixed shape, and skipping any step turns a courteous evolution into a break:

1. **Mark deprecated.** Annotate the old interface as deprecated in the code and the docs (`@deprecated`, a `Deprecation` HTTP header, a `Sunset` header with the removal date, a docstring note) so it is discoverable that this path is on its way out. The interface keeps working exactly as before.
2. **Emit a runtime warning.** Make using the deprecated path *visible* to the caller — a deprecation warning to logs/stderr (`DeprecationWarning`, a one-time log line, a console warning), naming the replacement. The warning is what reaches a consumer who never read your changelog.
3. **Publish a migration guide.** Write down, concretely, how to move from the old way to the new way: the before/after, the gotchas, the deadline. A deprecation with no migration path is just a threat. This guide is also the durable artifact the *next stateless agent session* (yours or a consumer's) reads instead of guessing — see the living-docs discipline in [knowledge-legacy-and-retirement.md](knowledge-legacy-and-retirement.md).
4. **Hold a transition window.** Keep the deprecated path working, in parallel with the new one, for a window long enough for consumers to migrate — measured in *releases and calendar time appropriate to your consumers*, not "until the next PR." For a widely-used or external API the window is generous; for a small internal one with two known callers it can be short, but it is never zero.
5. **Remove in a later MAJOR.** Only after the window closes, remove the old path — and that removal is itself a breaking change, so it lands in a **MAJOR** bump, announced. The version number tells consumers the thing they were warned about is now gone.

The agent's default — and the precise thing this lifecycle exists to intercept — is **delete-in-place**: it removes or rewrites the old interface the moment the new one works, because the deprecation ceremony is friction with no green reward and the broken callers are invisible to it. Each step above replaces a felt courtesy the agent doesn't have with an explicit move it can be required to make: it can be told to *add* the new path, *mark* the old one, *warn* on it, *write* the guide, and *schedule* the removal for a later release — none of which it will do on its own.

```
PREDICATE: is the removal of this public interface ready to ship as a deletion?
├─ It has been marked deprecated, warns at runtime, a migration guide exists,
│   AND the transition window has fully elapsed ────────────► remove it now, in a MAJOR bump.
├─ It must go, but the cycle hasn't run ─────────────────────► start the cycle: add the
│     replacement, mark old as deprecated, warn, publish the guide; do NOT delete yet.
└─ You're unsure whether it can be removed safely ───────────► keep it; deprecate and watch
      usage/telemetry through the window; let real consumption data, not assumption, gate removal.
```

**DEFAULT** when the right transition-window length is unclear: pick the **longer** window and the more generous warning. The cost of carrying a deprecated path one more release is small and bounded; the cost of removing it before a consumer migrated is their outage. **FALLBACK** when you cannot tell whether anything still uses the deprecated path: instrument it (count calls, log usages) and let the *measured* usage drop to zero — plus a safety margin — gate the removal, rather than deleting on a guess. This is the same break-vs-deprecate call routed in [decision-tree.md](decision-tree.md); when it can't be resolved here, it climbs the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) to the user, who holds authority on what an API break costs their callers.

---

## Part 4 — Continuous dependency currency: small frequent upgrades beat the deferred giant

Third-party dependencies rot whether or not you touch them: their maintainers ship fixes you don't have, disclose vulnerabilities in the version you're pinned to, and move the ecosystem forward while you stand still. **Not upgrading is itself a growing risk**, and it compounds. The discipline is **regular, small, test-backed upgrades** — the opposite of the deferred-giant-upgrade pattern that ends in **dependency hell**: the state where you've fallen so many major versions behind that the upgrade is a cliff (each intermediate major had breaking changes, transitive constraints conflict, the migration guides you'd need to read in sequence are now a stack), and a routine bump has become a multi-week project no one wants to start.

The arithmetic is the point: ten small bumps spread across ten months, each one change against a green test suite, are cheap and individually attributable. The *same* ten versions taken in one leap after two years is a single enormous diff where, when the suite goes red, you cannot tell which of ten upgrades broke it. Currency is a **continuous tax, not a someday project** — you pay a little every iteration so you never face the cliff.

This is the half of SHIFT 6 where the agent's lack of a **hygiene instinct** dominates: it will leave a dependency frozen indefinitely, because an upgrade is friction with no green reward, until something *forces* the issue — by which point the deferred bumps have compounded into exactly the cliff above. The fix is to take the cadence off the agent's nonexistent instinct and put it on a schedule, with the test suite as the backstop.

**Automate the cadence through the `flightline` skill's gates.** The pipeline that *runs* these upgrades — the bot that opens the PR, the CI that gates it, the auto-merge-on-green policy — is what the `flightline` skill set up; **this** skill is the ongoing maintenance *cadence* that rides on that pipeline. Use a dependency updater to make currency the default state rather than a remembered chore:

| Tool | What it does | Note |
|---|---|---|
| **Renovate** | opens upgrade PRs on a schedule; highly configurable batching, grouping, auto-merge rules | strong batching of low-risk updates; can group an ecosystem's bumps |
| **Dependabot** | opens version-update and security-update PRs; native to GitHub | enable the *security-update* path explicitly, not just version updates |

The cadence, routed by risk:

```
PREDICATE: is this upgrade routine-and-covered, or risky-or-uncovered?
├─ PATCH/MINOR bump, full green suite that actually exercises the dependency's surface ──►
│     low-risk. Automate it: bot opens the PR, CI gates it, auto-merge on green is fine.
├─ MAJOR bump / known breaking changelog ───────────────────────────────────────────────►
│     human-reviewed. Read the migration notes, expect to change call sites, never auto-merge.
└─ Update touches code the tests barely cover ──────────────────────────────────────────►
      raise coverage on that path FIRST (the `assay` skill), or treat the bump as high-risk by hand.
```

**The agent-era trap inside the automation.** A bump-and-run-the-suite loop is genuinely well-suited to an agent — *provided the backstop is honest.* Faced with a test that goes red after an upgrade, the agent's reflex to make green is to "fix" the **test** (delete the assertion, loosen the expectation, mark it skipped) rather than fix the integration against the new version — the same whack-a-mole-to-green move SHIFT 5 warns of, now aimed at the upgrade's safety net. So **test changes that ride along with a dependency bump must be reviewed**, and the suite is only a backstop if the agent can't manufacture the green by gutting it.

**DEFAULT** for routine maintenance: configure the updater to batch low-risk dev-dependency and patch/minor bumps on a schedule, auto-merge on green, and isolate every MAJOR into its own reviewed PR. **FALLBACK** when the suite is too thin to trust as a backstop: do *not* enable auto-merge — the agent's update loop has no net; keep a human on every bump until coverage of the critical paths is real. And note the caveat the `flightline` skill is precise about: **a green CI is not a vulnerability gate.** Auto-merge-on-green can merge a bump that *introduces* a vulnerable transitive dependency, because the suite passing means the tests passed, not that the new version is advisory-clean; pair the updater with a blocking security-audit step (or the gate is imaginary).

---

## Part 5 — EOL management: migrate before the wall, never freeze until forced

**EOL (end-of-life)** is the date after which a dependency's maintainers stop shipping fixes — most critically *security* fixes. A framework, runtime, language version, or library past its EOL is not merely "old"; it is a **liability on two axes at once**: a *security* liability (newly-disclosed vulnerabilities will never be patched — you are running known-unfixable holes), and an *emergency-migration* liability (the day a critical CVE drops or a platform drops support, you are forced into an unplanned, high-pressure migration with no runway). Both are the predictable, datable consequence of the same neglect — and both are entirely avoidable, because **EOL dates are published in advance.**

The discipline is to **treat each load-bearing dependency's EOL date as a tracked deadline and migrate *before* it, on a plan** — not after, in a panic. Concretely:

- **Track the EOL date of every load-bearing dependency.** Runtimes (Node, Python, the JVM, Go), frameworks (the web framework, the ORM), the database engine, the base OS image — anything whose unsupportability would be a crisis. EOL dates are published (`endoflife.date` aggregates many; each project publishes its own support policy); record them where the maintenance loop sees them.
- **Schedule the migration to *complete* before the EOL date, with runway.** The migration off an EOL version is itself a series of upgrades (Part 4) — so starting early lets you take them small and test-backed instead of as one forced leap. A version one major behind, upgraded on a calm Tuesday, is a chore; the same version a week after its EOL, with a CVE in the news, is an incident.
- **Never let a load-bearing framework freeze until something breaks.** This is the literal SHIFT 6 failure: the agent has **no hygiene instinct** and will leave the framework untouched until it is *forced* — which is always the most expensive possible moment to act. Currency (Part 4) is the routine that prevents the freeze; EOL tracking is the deadline that makes the routine non-optional for the dependencies where a freeze is fatal.

```
PREDICATE: is each load-bearing dependency's EOL date tracked and comfortably ahead of you?
├─ EOL dates recorded, every load-bearing dep on a still-supported version with runway ──►
│     healthy. Keep upgrading continuously (Part 4) so it stays that way.
├─ A load-bearing dep is approaching EOL (months out) ───────────────────────────────────►
│     schedule the migration NOW to finish before the date; take it as incremental
│     test-backed bumps through intermediate majors, not one giant leap.
└─ A load-bearing dep is already past EOL ───────────────────────────────────────────────►
      treat as an active security incident, not a backlog item: prioritize the migration
      above feature work; you are running unfixable known holes until it's done.
```

**DEFAULT** when you inherit a dependency that is far behind and you must judge how to close the gap: upgrade **incrementally through the intermediate majors**, behind the test suite, reading each major's migration guide in sequence — not one heroic leap across all of them, which is the dependency-hell cliff in reverse. **FALLBACK** when you cannot find or confirm a dependency's EOL date: treat its support status as **unknown and assume the worst** — pin the question to the user and the upgrade plan, because an unsupported framework you *believe* is fine is exactly how a system drifts into the emergency it should have datably foreseen. The dependency-currency-and-EOL router in [decision-tree.md](decision-tree.md) is the canonical form of this fork; an EOL framework is never a "later" item.

---

## Anti-patterns (pre-flight checklist for STAGE 4)

| Anti-pattern | Why it bites harder with an agent | The move that kills it |
|---|---|---|
| **Breaking change shipped as MINOR/PATCH** | the agent sizes the bump to the *diff*, not the blast radius; a small diff hides a big break | bump tracks consumer impact, not diff size — breaking is always MAJOR (Part 1) |
| **Reading a `0.x` minor bump as safe** | the agent applies post-`1.0` semver intuition to a `0.x` dep where minors break | treat `0.x` upgrades as potentially breaking; gate with tests (Part 1) |
| **Changing a public interface in place** | the agent feels no obligation to callers outside its context window | check who depends on the shape first; route breaks into deprecation (Part 2) |
| **Delete-in-place instead of deprecate** | the deprecation ceremony has no green reward; broken callers are invisible | run the full mark → warn → guide → window → remove-in-MAJOR cycle (Part 3) |
| **Deprecation with no migration guide** | a stale-or-absent guide leaves the next stateless session guessing the new path | publish the before/after guide as the durable artifact (Part 3) |
| **Dependencies frozen until forced** | no hygiene instinct; the agent leaves deps untouched until something breaks | continuous small test-backed bumps on a schedule (Part 4) |
| **Deferred giant upgrade → dependency hell** | one huge diff where a red suite can't attribute which bump broke it | upgrade in small frequent steps, each against green tests (Part 4) |
| **"Fixing" a post-upgrade red by gutting the test** | the agent optimizes green; deleting the assertion turns it green | review test changes that ride a dependency bump (Part 4) |
| **Auto-merge-on-green as a vulnerability gate** | green means the suite passed, not that the new version is advisory-clean | pair auto-merge with a blocking security-audit step (Part 4) |
| **Untracked EOL dates** | no instinct to look ahead; the freeze is discovered at the worst moment | track each load-bearing dep's EOL date; migrate before it, on a plan (Part 5) |
| **Running a past-EOL framework as a backlog item** | unfixable known security holes treated as "later" | treat past-EOL as an active incident, above feature work (Part 5) |

---

## Escalation ladder (when the compatibility or currency call is unclear)

When a DEFAULT and FALLBACK inside this stage don't resolve the question — is this change really breaking, how long should the window be, is this dependency leap safe — climb one rung at a time rather than guessing silently (guessing is exactly the agent move, and on a long-lived contract the wrong guess strands callers for years):

```
pick the DEFAULT for a clearly private, reversible interface change or a low-risk patch bump
   → make it reversible and small: ship the additive version behind the old path, or take the
     bump alone in its own revertable commit, not batched with feature work
      → test it: pin the contract / the dependency's surface with tests so the change is
        provably compatible (or provably breaking) before you lean on the call
         → ask the user one sharp question — they hold authority on what an API break costs their
           callers, how long their consumers need to migrate, and whether an EOL migration jumps
           the queue (the break-vs-deprecate fork and the EOL-priority call both bottom out here)
            → if still unresolved, default to the move that keeps the next change CHEAPER and the
              contract intact (deprecate over break, smaller bump over giant leap, migrate-before-EOL),
              and note the residual as evolution risk for the user to accept in writing.
```

The asymmetry that governs the ladder: **an over-cautious evolution choice costs the agent some minutes — a deprecation cycle held one release too long, a major bump that was really a minor; a reckless one costs years — every downstream caller's incident from a silent break, the emergency migration off a framework left to die.** When the call is genuinely a toss-up, err toward the compatible, continuous, better-understood move. See [decision-tree.md](decision-tree.md) for the break-vs-deprecate and dependency-currency routers this stage calls into, and [../SKILL.md](../SKILL.md) for where STAGE 4 sits in the gate order.

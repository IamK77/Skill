# Testability & Disposition — the design litmus, then close the loop

This reference is the depth behind **STAGE 5 — Testability & disposition** of the [../SKILL.md](../SKILL.md) flight plan, the final stage where the audit stops being a reading exercise and becomes a change to the code. It governs two distinct moves that happen to share a stage because they share a failure: a *probe* you run on any unit to read its design quality — how hard is it to test? — and the *disposition loop* that turns every finding this whole skill produced into a fix, a scheduled refactor, or a written-down accepted debt. In the human era both were felt, not gated. A developer who had to *write the test* felt the pain of a tangled design directly, and that annoyance was honest feedback the design was wrong; and a reviewer understood that a review producing no improvement was a wasted review, because they felt ownership of the code they were about to live with. Neither feeling survives contact with an agent. This file is the *how*: how to use testability as a probe of design quality rather than a test plan, and how to dispose every finding so the audit actually changes the code. For the *why* — why an agent generates a dozen mocks without complaint and never feels the hard-to-test signal, and why producing the finding-list turns the task green before anything is fixed — read **SHIFT 6** and **SHIFT 7** in [agent-era-shifts.md](agent-era-shifts.md), the two shifts this stage enforces.

The fact that overrides every default here is inherited from [decision-tree.md](decision-tree.md):

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer and cheaper to change, never applied as dogma.** A finding produced and never disposed is the same as no review; a craft rule applied past the point it clarifies is itself a defect. Both the litmus and the disposition loop are means to a cheaper-to-change codebase, not ends — over-extracting a "pure core" the design never needed, or fixing a nit at the cost of churning a stable file, fails the same test the cleverness it replaced did.

The two checks this stage gates are `testability-litmus` and `findings-disposed`. Everything below is the depth behind those two ids.

---

## Contents

- [`testability-litmus` — how hard it is to test is a probe of how well it is designed](#testability-litmus--how-hard-it-is-to-test-is-a-probe-of-how-well-it-is-designed)
  - [Hard-to-test is the finding, not the obstacle](#hard-to-test-is-the-finding-not-the-obstacle)
  - [Move one: separate pure logic from side effects](#move-one-separate-pure-logic-from-side-effects)
  - [Move two: inject collaborators so they are replaceable](#move-two-inject-collaborators-so-they-are-replaceable)
  - [The boundary: a probe, not a test plan](#the-boundary-a-probe-not-a-test-plan)
- [`findings-disposed` — a found smell never fixed is worthless](#findings-disposed--a-found-smell-never-fixed-is-worthless)
  - [Rank by cost to the next reader](#rank-by-cost-to-the-next-reader)
  - [The disposition fork — fix now, refactor under test, or accept with a reason](#the-disposition-fork--fix-now-refactor-under-test-or-accept-with-a-reason)
  - [Route the fix to the sibling that owns it](#route-the-fix-to-the-sibling-that-owns-it)
  - [Accept-with-reason is a decision, written down](#accept-with-reason-is-a-decision-written-down)
- [The boy-scout rule — the standing continuous-craft habit](#the-boy-scout-rule--the-standing-continuous-craft-habit)

---

## `testability-litmus` — how hard it is to test is a probe of how well it is designed

This check does not ask whether the code *has* tests — that is the `assay` skill's question. It asks a design question through a testing lens: **if you tried to test this unit in isolation, how much pain would it cost you?** The amount of pain is the measurement, and the measurement reads the design.

### Hard-to-test is the finding, not the obstacle

The load-bearing claim, stated plainly: **hard-to-test code is almost always badly-designed code.** The two properties are not independent — they are the same property seen from two sides. A function you can only exercise by standing up a database, faking the clock, mocking a dozen collaborators, and threading a network call through a test harness is hard to test *because* it is too coupled and does too much. The mocks are not an accident of the test; they are a census of the function's entanglements, and a long census is the design defect made countable.

So the move is to invert the usual reflex. The agent's instinct — and the one SHIFT 6 names — when a unit is hard to test is to *write the painful test anyway*: generate the dozen mocks, stand up the fixture, get it green, move on. It feels none of the pain that, for a human, was the honest signal. The litmus says the opposite: when the test is painful, **the pain is the finding.** Do not pay it; read it. Ask what would make the test trivial, and that answer is the design fix.

> The agent failure mode this guards against: the agent never feels the "this is annoying to test, so the design must be wrong" signal — it will cheerfully produce mocks until it goes green, burying the design defect under a passing test. The litmus re-installs the signal as a deliberate probe: *count what you'd have to fake, and treat a long count as a smell.* A test that needs ten mocks is not a thorough test; it is a coupling report.

The probe has a single question and a deterministic reading:

- **PREDICATE:** to test this unit in isolation, what would you have to fake, stand up, or control — and how much of it?
- **DEFAULT** on a coin-flip about whether a given test-pain counts as a design smell: **treat it as a smell** if the pain comes from *collaborators or effects the unit reaches out to* (a DB, the clock, the network, many mocks); treat it as acceptable if the pain is only *many input cases for genuinely complex pure logic* — that is essential complexity the tests should cover, not a coupling defect.
- **FALLBACK** when you can't tell whether the difficulty is essential or accidental: trace *where the difficulty lives.* If it lives in the data and rules (lots of branches over plain values), it is essential — test it. If it lives in the wiring (mocks, fixtures, setup), it is accidental — fix the design. The line is almost always: pure-but-complex is essential, coupled-to-effects is accidental.

### Move one: separate pure logic from side effects

The first thing testability pressure pushes you toward is the **functional-core / imperative-shell** shape: pull the decision-making *logic* out of the code that talks to the outside world (I/O, network, the clock, randomness, the filesystem, global state) so the logic is a **pure function** — same inputs, same outputs, no reaching out, no reaching in. Pure functions are trivially testable (call with inputs, assert on the return — no mocks, no fixtures) and, not coincidentally, the easiest code there is to *reason* about, because everything that affects the result is in the signature.

The agent tangles the two freely, because interleaving the computation with the call that fetches its input and the call that writes its output is the shortest path to working code, and it feels no cost.

```python
# BAD — logic welded to I/O, time, and the network: untestable without
# faking the clock, the DB, and the email gateway; the rule is buried.
def process_subscription(user_id):
    user = db.fetch_user(user_id)                      # I/O
    if user.plan == "trial" and (date.today() - user.signed_up).days > 30:  # rule + clock
        user.plan = "expired"
        db.save(user)                                  # I/O
        email.send(user.email, "Your trial has ended") # network
```

```python
# GOOD — the rule is a pure function of plain values: test it with no mocks.
# I/O and time live in the thin shell that calls it.
def trial_has_expired(plan: str, signed_up: date, today: date) -> bool:
    return plan == "trial" and (today - signed_up).days > 30

def process_subscription(user_id, today: date):        # imperative shell
    user = db.fetch_user(user_id)
    if trial_has_expired(user.plan, user.signed_up, today):
        user.plan = "expired"
        db.save(user)
        email.send(user.email, "Your trial has ended")
```

`trial_has_expired` now tests in three lines with no scaffolding, and the rule — the part most likely to be wrong and to change — is legible at a glance. The shell that remains is thin enough that it earns a single integration test rather than a unit test per branch. Note the date is now *passed in*, not read from the clock inside the rule: time is a side effect, and a pure function that reads `today()` internally is not pure. This is the same idea the `load-bearing` skill draws at the module level (effects at the edges, a pure core); here it is the same line drawn inside one function.

### Move two: inject collaborators so they are replaceable

The second move: when a unit genuinely *must* use a collaborator (a payment gateway, a repository, a clock), have it **receive** the collaborator rather than **construct or import** it, so a test can pass a replacement. A unit that reaches out to a hard-wired singleton, news up its own dependency, or imports a module-level client is welded to that exact collaborator; a unit that takes the collaborator as a parameter (or a constructor argument) lets the test substitute a fake.

```python
# BAD — constructs its own gateway: a test cannot replace it, so testing
# this charges a real card or needs deep monkeypatching.
class Checkout:
    def pay(self, order):
        gateway = StripeGateway(api_key=os.environ["STRIPE_KEY"])
        return gateway.charge(order.total)
```

```python
# GOOD — receives the gateway: a test passes a fake; production passes the real one.
class Checkout:
    def __init__(self, gateway: PaymentGateway):
        self._gateway = gateway

    def pay(self, order):
        return self._gateway.charge(order.total)
```

The two moves compound: separating pure logic *shrinks* how much needs a collaborator at all (most of the decision-making becomes pure and needs none), and injecting what remains makes that residue replaceable. A unit that has done both is testable *because* it is loosely coupled and single-purpose — which is to say, well designed. Testability did not get added; good design made it fall out.

> The same instinct that scatters trust-chain escape hatches through the core (see [smells-and-trust-chains.md](smells-and-trust-chains.md)) scatters effects through it too — both are the agent reaching for the locally-convenient call with no feel for the global cost. Pushing effects to the edge and parsing trust at the edge are the same discipline pointed at two different leaks.

### The boundary: a probe, not a test plan

Hold the line on what this stage is. plumb uses testability as a **design probe** — it reads design quality off how hard the code is to test, and prescribes the design fix (extract the pure logic, inject the collaborator). It does **not** design the tests. *Which* cases to write, *what kind* of test (unit, integration, property-based, characterization), *which doubles* (fake vs mock vs stub), and how to catch the bugs that matter — that craft is the `assay` skill's, and routing test gaps there is part of disposition below. The litmus answers "is this well-designed?"; `assay` answers "how do we test it well?" Running the probe and then handing the actual test design to `assay` is the correct split — re-deriving a test plan here would be plumb doing `assay`'s job badly.

The meta-rule bears down here too: the goal is design you can *cheaply* test, not maximum extraction for its own sake. A trivial function pried apart into a "pure core" and a one-line "shell" to satisfy the pattern is over-engineering — the structure costs the next reader an indirection and buys nothing. Extract when the logic is worth isolating (it has branches, it is the thing likely to be wrong, it will change); leave a genuinely simple effectful line alone.

---

## `findings-disposed` — a found smell never fixed is worthless

Everything before this stage *produced* findings — vague names, sprawling functions, leaked trust-chains, the smell catalog, the testability defects above. This check governs what happens to them. Its whole content is one sentence: **a found smell that is never fixed is worthless**, and an audit whose findings nobody acts on is exactly equivalent to no audit at all — except that it cost the reading time and produced a list that now rots in a drawer.

> The agent failure mode this guards against: producing the audit *turns the task green.* The smells are named, the review reads as "done," and the agent's reward arrives before a single line is changed — so its default is to hand over a list and stop. SHIFT 7 names this precisely: the reward is in the finding, the value is in the fix, and nothing in the agent's instinct closes that gap. This check is the gap closed by force: the stage is not done when the list exists, it is done when every item on the list has a *disposition.*

### Rank by cost to the next reader

Before disposing, order the findings — not by how easy they are to fix or how much they offend your taste, but by **how much each one costs the next reader** (now mostly a stateless agent session) on every read for the life of the code. This is the same ranking the AUDIT finding taxonomy in [decision-tree.md](decision-tree.md) sets up: a real **finding** that taxes legibility or changeability ranks above a **nit** (real but cheap), and a **style opinion** (a preference that doesn't change clarity — the formatter's business) is not on the list at all. A misleading name in a hot path and a leaked trust-chain through the core cost every reader every time; a slightly-long-but-clear function costs almost nothing. Rank by that cost so the fix budget lands on what actually hurts, and so a genuine finding never drowns under a pile of nits.

### The disposition fork — fix now, refactor under test, or accept with a reason

Every finding gets exactly one of three dispositions. This is the disposition router from [decision-tree.md](decision-tree.md); the depth on *which* to pick:

- **PREDICATE:** is the fix small and safe under the existing tests, larger and behavior-bearing, or genuinely justified to leave?
- **Fix now** — when the change is small and safe and the existing tests still cover the behavior: a rename, a magic number to a named constant, an extracted helper, a deleted dead comment. Do it as part of the audit; it is cheaper to fix while the context is loaded than to file it.
- **Refactor under test** — when the change is larger or behavior-bearing (un-building a wrong abstraction, splitting a 180-line function, pushing effects to the edge across several call sites): hand it to the `husbandry` skill, which owns the refactoring *mechanics* — small steps, the boy-scout rule, and behavior **pinned with characterization tests first** so the refactor can't silently change what the code does. plumb names the craft defect and the fix direction; `husbandry` performs the move safely. Never an un-tested craft refactor on behavior-bearing code.
- **Accept with a written reason** — when leaving it is genuinely the right call: this clever line is justified by a real constraint, this duplication isn't stable enough to abstract yet (the duplicate-or-abstract fork said *wait*), this primitive is fine at this throwaway's craft bar. Record it (next section).
- **DEFAULT** on a coin-flip between fix-now and refactor-under-test: if the behavior is **pinned by tests that stay green**, fix now; if it is **not covered or you can't be sure the change preserves behavior**, route to `husbandry` to be pinned first. The cheap fixes you do; the larger ones you route; you accept only with a reason in writing.
- **FALLBACK** when you can't safely fix it now (no test coverage, too entangled to change confidently): do **not** improvise an un-tested refactor and do **not** silently drop the finding — route it to `husbandry` to be characterized under test *then* refactored. "Can't fix it safely right now" is a routing decision, never a reason the finding evaporates.

> The disposition is the deliverable. A stage that ends with "here are the smells" has not run this check; a stage that ends with "each smell is fixed, routed to a named skill, or accepted with a recorded reason" has.

### Route the fix to the sibling that owns it

plumb finds and judges; it does not re-implement the machinery that fixes. Each kind of finding routes to the sibling that owns the fix, and routing *is* a valid disposition — the loop is closed when the finding is handed to the owner with a clear fix direction, not only when plumb itself edits the line.

| Finding kind | Routes to | Why it lives there |
|---|---|---|
| Type-discipline / parse-once / trust-chain leak | `gauge` | owns the strict checker and boundary validation (`pydantic`/`zod`) — the static-layer tooling that establishes trust once at the edge |
| Larger refactor / under-test mechanics / debt | `husbandry` | owns the refactoring mechanics, characterization tests, and the debt register |
| Test gap exposed by the litmus | `assay` | owns test design — what cases, what kind, what doubles |
| Architecture-level module boundary | `load-bearing` | owns where the seams between modules go; plumb keeps the code *inside* them cohesive |
| Formatting / lint / style | `flightline` | owns the formatter and linter; a formatting preference was never a plumb finding to begin with |

The principle under the table: **plumb names the craft issue and routes the fix to the skill that owns it; it does not re-build that skill's machinery.** Re-deriving a test plan, re-implementing a strict-typing setup, or hand-rolling a refactor that bypasses the under-test discipline is plumb overstepping its lane and doing a sibling's job worse. A review whose findings are clearly named and correctly routed is a review acted on; the loop closes at the handoff.

### Accept-with-reason is a decision, written down

The third disposition is the one the agent will not reach on its own and the one most easily abused, so it has a bar. Accepting a finding — choosing to leave a clever line, tolerate a duplication, keep a primitive — is a real engineering **decision**, and like the `husbandry` skill's debt-register entry or the `assay` skill's do-not-test entry, it must be recorded *as one*, in writing, where the next reader will find it (a comment at the site, a note in the review). An accept that exists only as silence is indistinguishable from a finding the auditor missed.

Record, per accepted finding:

- **what** is being left and at what site,
- **why** it is justified — a real hot-path constraint, a domain idiom the team shares, a duplication whose instances aren't stable enough to abstract yet, a craft bar that doesn't earn the fix,
- and, where the call is a genuine trade-off the user owns (is this cleverness worth it, is this debt we accept), surface it to them — *is this cleverness justified?* is exactly the toss-up the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md says to carry up, not to settle silently.

> The agent failure mode this guards against: an agent will not weigh "is this clever line acceptable here" — it has no standing to judge a business trade-off — so left to itself it either fixes indiscriminately (over-applying the rule, its own defect) or drops findings into silence. A written, reasoned, user-owned accept is the deliberate middle the agent cannot reach alone, and the only honest form of "we chose to leave this."

---

## The boy-scout rule — the standing continuous-craft habit

The disposition loop closes a single audit. The boy-scout rule is the habit that keeps craft from decaying *between* audits: **leave each piece of code a little cleaner than you found it, every time you are in it.** Not a campaign, not a refactor sprint — a small, cheap, safe improvement made in passing whenever you touch a file for any reason: a clearer name, a deleted dead comment, an extracted obvious helper, a magic number named. Done continuously, it is the counter to the slow rot, and it spreads the cost of craft across every change instead of banking it into a someday-rewrite that never comes.

It exists in this skill specifically as the counter to the agent's **only-add-never-clean reflex** (the same reflex seen across the suite). Passing through code to add a feature, the agent will leave the surrounding mess exactly as messy, because cleaning it earns no green and the agent feels no ownership of code it will re-read for free. The boy-scout rule installs the habit the ownership-instinct used to supply: every visit is an opportunity to make the next visit cheaper.

The rule has the same three-way shape as the disposition fork, scoped to an opportunistic in-passing fix:

- **PREDICATE:** while you are in this code for another reason, is there a cheap, safe craft improvement available under the existing tests?
- **DEFAULT — fix it now (boy-scout it):** when the improvement is small, safe, and covered by the tests that stay green (a rename, a comment, a constant), make it as you pass through. This is the rule's whole point — the in-passing cleanup that compounds.
- **FALLBACK — refactor under test (route to `husbandry`):** when the improvement is real but larger or behavior-bearing — too big to be a safe in-passing change — do **not** balloon the current change into a risky refactor; note it and route it to `husbandry` to be done under test, the same as any other finding.
- **The third branch — accept with a reason:** when the thing you noticed is a deliberate, recorded accept (or genuinely fine at this code's craft bar), leave it — and resist the over-application reflex that wants to "clean" code that was already clear. Boy-scouting a clear file into a differently-styled clear file is churn, not craft; the rule is *leave it cleaner*, not *leave it yours*.

The boy-scout rule and the disposition loop are the same instinct at two timescales: the loop disposes the findings of a deliberate audit, the boy-scout rule disposes the one finding you happen to pass — and both refuse the agent's default of stopping at the noticing. The value was never in seeing the smell. It is in leaving the code truer than you found it. See [decision-tree.md](decision-tree.md) for the disposition router and the smell→fix map these dispositions draw on, [smells-and-trust-chains.md](smells-and-trust-chains.md) for the trust-chain and primitive-obsession findings that route to `gauge`, and [../SKILL.md](../SKILL.md) for the stage order that lands here last, where the audit finally changes the code.

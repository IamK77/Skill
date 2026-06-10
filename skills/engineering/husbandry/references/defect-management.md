# Defect Management — Triage, Reproduce, Fix the Root

This reference is the depth behind **STAGE 3 — Defects** of the [../SKILL.md](../SKILL.md) flight plan, the stage that governs what happens between a failure surfacing and a defect being genuinely, permanently closed. Bug-fixing is only one slice of maintenance — the big two kinds of maintenance are not corrective — but it is the slice with its own non-obvious discipline, and the one an agent skips by default. In the human era a bug-fix carried felt incentives: a recurring bug was a personal annoyance, a symptom suppressed today was a ticket reopened on *you* next week, and the natural pull was to understand the thing before declaring it dead. None of that survives contact with an agent. The agent's reward is the **green result** — the failing test passes, the error log goes quiet, the red dashboard goes green — so a bug is "fixed" the instant the *symptom* stops, whether or not the *cause* was ever found. This file is the *how*: how to triage so effort lands on the bugs that matter, how to reproduce a bug with a failing test before touching it, how to drive to the root cause instead of papering the symptom, and how to make production failures discover themselves. For the *why* — why a green-optimizing maintainer whack-a-moles a symptom to green and calls it done — read **SHIFT 5** in [agent-era-shifts.md](agent-era-shifts.md), the shift this whole stage enforces.

The fact that overrides every default here is inherited from [decision-tree.md](decision-tree.md):

> **Software is read and changed far more than it is written — optimize for the next change, not this one.** A bug "fixed" without its root cause is not a closed defect; it is a defect *deferred*, re-banked at compound interest onto the next change — and the agent, optimizing the green in front of it and feeling none of the recurrence cost, will book the deferral as a win.

The two checks this stage gates are `triage-and-regression-first` and `root-cause-fixed`. Everything below is the depth behind those two ids.

---

## Contents

- [`triage-and-regression-first` — sort by impact, reproduce before you fix](#triage-and-regression-first--sort-by-impact-reproduce-before-you-fix)
  - [Triage: severity is not priority](#triage-severity-is-not-priority)
  - [The severity × priority matrix](#the-severity--priority-matrix)
  - [Work highest-impact first, not first-come-first-served](#work-highest-impact-first-not-first-come-first-served)
  - [Record an explicit WON'T-FIX as a decision](#record-an-explicit-wont-fix-as-a-decision)
  - [Reproduce every bug with a failing test FIRST](#reproduce-every-bug-with-a-failing-test-first)
- [`root-cause-fixed` — chase the cause, not the crash site](#root-cause-fixed--chase-the-cause-not-the-crash-site)
  - [The crash site is not the cause](#the-crash-site-is-not-the-cause)
  - [The 5 Whys](#the-5-whys)
  - [Symptom suppression is the agent's cheapest path](#symptom-suppression-is-the-agents-cheapest-path)
  - [The root-cause acceptance test](#the-root-cause-acceptance-test)
- [Proactive discovery — make production failures find themselves](#proactive-discovery--make-production-failures-find-themselves)
- [The regression suite grows from every fixed bug](#the-regression-suite-grows-from-every-fixed-bug)
- [Defect metrics as a health signal](#defect-metrics-as-a-health-signal)

---

## `triage-and-regression-first` — sort by impact, reproduce before you fix

This check enforces two disciplines that come *before* any code changes: deciding which defect to work, and proving you understand it. Skip either and the agent does what a green-optimizer does — grabs the first ticket in the queue and moves the first symptom that turns the light green.

### Triage: severity is not priority

The two words are used interchangeably in casual talk and they are *not the same axis*. Conflating them is how effort lands on the wrong bug.

- **Severity** measures the **technical impact** of the defect if it triggers — how badly the system is wrong when this fires. Data corruption, a crash, a security hole, money miscalculated: high severity. A typo in a tooltip: low severity. Severity is a property of the *bug*, roughly objective, and largely independent of who is affected.
- **Priority** measures **how urgently it should be fixed relative to everything else** — a business decision weighing severity *together with* frequency, number of users hit, presence of a workaround, contractual or regulatory exposure, and what else is competing for the fix budget. Priority is a property of the *queue*.

They come apart constantly, and the gap is where good triage lives:

- **High severity, low priority:** a catastrophic data-corruption bug that only triggers on a hardware configuration no current customer runs. The blast radius is severe; the urgency is low because nobody hits it. Log it, schedule it, don't drop the sprint for it.
- **Low severity, high priority:** a one-character typo in the company name on every invoice. Technically trivial; commercially urgent — it ships to every customer and looks unprofessional. Fix it now.

> The agent failure mode this guards against: with no felt sense of *who is affected or how much it costs the business*, an agent treats every red item as equally worth fixing and works the queue in arrival order. Severity it can sometimes infer from a stack trace; **priority it cannot infer at all** — that input comes from the user, and an untriaged queue silently collapses to "the agent fixes whatever it saw first."

### The severity × priority matrix

Score each incoming defect on both axes and let the cell decide the disposition. This is the defect-intake counterpart of [decision-tree.md](decision-tree.md)'s debt quadrant — a small fixed grid so two agents triaging the same queue reach the same order.

| | **Priority: now** | **Priority: scheduled** | **Priority: someday / won't-fix** |
|---|---|---|---|
| **Severity: critical** (data loss, security, outage, money wrong) | **Drop-everything.** Reproduce, root-cause, fix, regression-guard immediately. | Rare cell — a severe bug nobody can currently hit. Log with the *exact* trigger condition so it's caught the moment that condition becomes reachable. | Almost never legitimate. A critical bug parked here needs an explicit, written, user-signed justification, not an agent's silence. |
| **Severity: major** (feature broken, wrong output, no workaround) | Fix this iteration. | Fix on the normal schedule, by priority order. | Candidate for a deliberate WON'T-FIX — record it as a decision. |
| **Severity: minor** (cosmetic, rare edge, easy workaround) | Only if cheap and high-visibility (the invoice typo). | Batch with related work. | The usual home for a logged WON'T-FIX. |

- **PREDICATE:** for the defect in hand, what is its severity (technical blast radius if it fires) and what is its priority (business urgency, set with the user's input)?
- **DEFAULT** on a coin-flip between two cells: size to the **higher-severity / higher-priority** cell for anything touching data, money, security, or availability — under-triaging a defect that turns out to corrupt data is the expensive error; over-triaging a cosmetic one costs minutes.
- **FALLBACK** when you cannot set priority because the business impact is genuinely unknown (you can't tell how many users hit it or what it costs them): do **not** silently assign one and proceed — surface the severity and the open priority question to the user, because priority is exactly the input the agent is not equipped to supply.

### Work highest-impact first, not first-come-first-served

Triage is worthless if the fix order ignores it. Pull from the queue by the matrix cell, not by arrival time: drop-everything cell first, then this-iteration, then scheduled by priority, never "whichever ticket I opened first." First-come-first-served is the agent's natural order precisely because it requires no judgment about impact — and it reliably spends the scarce fix budget on a minor bug while a major one waits.

### Record an explicit WON'T-FIX as a decision

A defect you have deliberately chosen **not** to fix is a real engineering decision and must be recorded *as one* — the same way the `assay` skill records a deliberate "do-not-test" entry on its do-not-test list, and the way `husbandry`'s own debt register logs a debt you're choosing to carry. A WON'T-FIX that exists only as an un-actioned ticket silently rotting at the bottom of the queue is indistinguishable from a bug nobody noticed.

Record, per WON'T-FIX:

- the defect and its severity,
- **why** it won't be fixed — superseded, by-design, cost exceeds value, fires only on an unsupported configuration,
- who decided (the user owns this call when there's business cost in either direction),
- and any condition that would *reopen* it (e.g. "revisit if a customer ever runs configuration X").

> The agent failure mode this guards against: an agent will not declare a WON'T-FIX — it has no standing to weigh business cost — so it does one of two wrong things, fix everything indiscriminately or leave bugs to rot un-triaged. An explicit, user-owned WON'T-FIX is the deliberate middle the agent cannot reach on its own.

### Reproduce every bug with a failing test FIRST

Before changing a single line, write a test that **fails on the current, buggy code** and would **pass only once the bug is actually fixed**. This is the fail-first discipline the `assay` skill enforces for every regression case, applied here at the defect intake. It is not optional bookkeeping; it does three load-bearing jobs that nothing else does:

1. **It proves the bug is *understood*, not merely *observed*.** A test that reproduces the defect forces you to state, in code, the exact inputs and conditions that trigger it and the correct behavior that should have happened instead. If you cannot write a failing test, you do not yet understand the bug well enough to fix it — you are about to move a symptom you can't characterize.
2. **It proves the fix actually works.** Watch the test go **RED** on the unfixed code, apply the fix, watch it go **GREEN**. A "fix" you never saw turn a red test green is a hope, not a fix — and a regression test you never watched fail is indistinguishable from a test that asserts nothing.
3. **It stands as a permanent regression guard.** The test stays in the suite forever, so the *specific* defect can never silently return. This is how the regression suite grows (see [below](#the-regression-suite-grows-from-every-fixed-bug)).

The sequence is fixed:

```
1. Reproduce: write a test encoding the CORRECT behavior for the bug's exact scenario.
2. Run it on the UNFIXED code  -> it MUST go RED.
      A green here means the test doesn't actually exercise the defect —
      the test is wrong, not the code. Repair the test until it reddens.
3. Apply the fix.
4. Run again -> it MUST go GREEN. The whole suite stays green.
5. Name the test for the defect (issue number / symptom) so its purpose
   outlives the memory of the bug.
```

- **PREDICATE:** does a test exist that fails on the current code *because of this defect* and would pass once it is correctly fixed?
- **DEFAULT** when unsure whether the reproduction is tight enough: make it **fail for the right reason** — a test that goes red for an unrelated reason (a typo, a missing import) is a false reproduction that will pass the moment the unrelated thing is fixed, leaving the real bug live. Confirm the red is the bug.
- **FALLBACK** when the bug genuinely resists a unit-level reproduction (it only manifests through a real dependency, a race, or production-only state): reproduce it at the *highest fidelity you can* — an integration or characterization test that pins the observable failure — rather than skipping the reproduction; do not let "hard to reproduce" become "fix blind." The `assay` skill chooses the right level and the right doubles for this.

> The agent failure mode this guards against: an agent asked to fix a bug will change code until the *reported* symptom disappears, with no test proving it understood the defect or that the change addresses *that* defect rather than coincidentally masking it. Fail-first is the gate that turns "the symptom moved" into "the bug is understood and locked shut."

---

## `root-cause-fixed` — chase the cause, not the crash site

Reproduction tells you *what* fails. This check governs *why*, and forces the fix to land on the underlying cause rather than the place the failure happened to surface.

### The crash site is not the cause

The location where a program crashes, throws, or logs an error is almost never where the fault *originated*. A `NullPointerException` on line 200 is the place a bad value was finally *used*; the bug is wherever that value was allowed to become null — line 50, or three function calls and one bad database row upstream. Treating the crash site as the bug produces the classic family of symptom patches, every one of which leaves the real fault in place:

- **The null check at the crash.** Adding `if (x == null) return;` where it blew up. The null still gets created upstream; you've just taught the code to silently swallow it, often converting a loud crash into a quiet wrong-answer — strictly worse.
- **The swallowed exception.** Wrapping the failing call in `try { ... } catch (e) { /* ignore */ }` or a bare `except: pass`. The error log goes quiet, the dashboard goes green, and the faulty state propagates unobserved.
- **The special-cased bad input.** Detecting the one malformed value that triggered the report and short-circuiting it, while the source that *produces* malformed values keeps producing them — so the next variant of the bad input crashes all over again.

Each of these makes the symptom stop. None of them fixes the bug. The defect recurs — usually elsewhere, usually harder to trace, because the original loud failure has been muffled.

### The 5 Whys

Drive from symptom to cause by asking **"why?"** repeatedly — each answer becomes the next question — until you reach a cause that, if fixed, prevents the whole chain. Five is a rule of thumb, not a quota; stop when you reach something *actionable and underlying*, which is usually a few levels below the crash.

Worked example — a checkout double-charged a customer:

1. **Why was the card charged twice?** Because the charge operation ran twice for one order.
2. **Why did it run twice?** Because the user's browser retried the request after a timeout.
3. **Why did the retry re-charge instead of being a no-op?** Because the charge endpoint isn't idempotent — it has no record of having already charged this order.
4. **Why isn't it idempotent?** Because no idempotency key is recorded before the charge, so a retry can't be recognized as a duplicate.
5. **Why was that missed?** Because retry-under-timeout wasn't in the design's failure model.

The crash-site fix would be step 1's surface — "refund the duplicate charge and add a check so *this* order can't be charged twice." The **root-cause** fix is at step 4: make the charge endpoint idempotent with a recorded key, so *no* retry of *any* order can double-charge. One is a patch for one incident; the other closes the entire class. Note where this lands: the same idempotency and "call-it-again" failure the `assay` skill probes for is exactly the root cause a 5-Whys walk surfaces here.

### Symptom suppression is the agent's cheapest path

This is **SHIFT 5** stated mechanically: reaching the root cause is *additional* work that yields *no additional green*. The test already passes once the symptom is gone; the dashboard is already green; the ticket can already be closed. A green-optimizing actor has every incentive to stop at the first change that silences the symptom and no incentive to keep digging — so the agent's default fix *is* the null check at the crash, the swallowed exception, the special-cased input. From the dashboard, **a swallowed exception and a genuinely fixed bug look identical**; only a root-cause fix backed by a reproducing test is the latter.

This is why root-cause cannot be left to instinct and must be *gated*. The reproducing test from the previous check is what makes the gate enforceable: a symptom patch will often *also* turn the reproducing test green, so the test alone is necessary but not sufficient — the gate additionally requires that the fix can answer *why the bad state arose*, not merely *that the observed value is now handled*.

### The root-cause acceptance test

Before closing a defect, the fix must pass this bar:

- **PREDICATE:** does the fix change *why the bad state arises*, such that the entire class of failure can no longer occur — or does it only change *what happens once the bad state has already arisen* at this one site?
- **DEFAULT** on a coin-flip about whether you've reached the root: assume you have **not** and ask one more "why." The asymmetry is stark — another why costs minutes; a misdiagnosed fix ships a live bug wearing a green badge, and it recurs on someone else's watch.
- **FALLBACK** when the true root cannot be fixed now (it lives in a third-party dependency, or the proper fix is a large change that must be scheduled): apply the *narrowest possible* contain­ment as an **explicitly logged interim measure** — a guarded patch with a comment and a tracked debt-register entry pointing at the real cause — never an un-logged silent swallow. A contained symptom you have *named and scheduled* is honest; a swallowed one you've called "fixed" is the failure this check exists to catch.

> The agent failure mode this guards against: the agent silences the symptom — null check, swallowed exception, special-case — reports the bug fixed because the light is green, and leaves the real fault to recur. The 5 Whys and this acceptance test force the fix down to the cause that closes the class.

---

## Proactive discovery — make production failures find themselves

Triage and root-cause both presuppose a defect has *entered the queue*. The default intake is a user reporting a problem — which means the system relies on a frustrated human to do the noticing, and silent failures (a wrong-but-not-crashing answer, a slow leak, a background job quietly dying) are never noticed at all. **The agent will not go looking.** It has no curiosity about the health of a system it isn't currently asked to change; it acts on defects placed in front of it and discovers none on its own.

Close this by wiring the **error monitoring and observability** that the `stationkeeping` skill stands up in production directly back into the defect intake, so production failures become **tracked defects automatically** instead of waiting for a report:

- Route the structured errors, exception aggregation, and alerts that `stationkeeping` produces into the same defect queue that user reports land in — an unhandled exception spiking in production should *open a defect*, not just blink on a dashboard nobody is watching.
- Carry the observability context (stack trace, request/correlation id, frequency, affected-user count, first-seen timestamp) onto the defect, because that context is exactly the severity-and-priority input the triage matrix needs and the reproduction detail the failing-test step needs.
- Let frequency and affected-user counts feed priority automatically — a quietly recurring production error with a rising count is a high-priority defect the moment it crosses a threshold, with no user having to complain.

This is the feedback loop the whole suite is built around: `stationkeeping` observes, `husbandry` acts, and the `gauge` skill's discipline of making failures legible and attributed is what makes a raw production error usable as a defect rather than noise. Without this wiring, the only defects that ever get fixed are the ones a human happened to hit and bothered to report — and an agent-maintained system with no proactive intake slowly accumulates silent faults nobody will ever assign it.

---

## The regression suite grows from every fixed bug

Every defect closed under the fail-first rule leaves its reproducing test **behind, in the suite, forever.** That is not a side effect — it is the point. A test suite is not only written up front by the `assay` skill; it **accretes** one case at a time from the history of real failures, and each added case is a defect that can now never silently return. Over a system's life this growing regression layer becomes a precise map of every way the system has actually broken — far more valuable than any test written from imagination, because each case corresponds to a failure that *really happened*.

The discipline that makes this work:

- **Never delete a regression test because it's "obviously fine now."** The reason it's fine now is that the test is guarding it. Removing it un-guards the exact failure it locks shut. (This is the test-graveyard reflex inverted: the agent's only-add-never-clean instinct is *correct* here — these tests are meant to live forever.)
- **Name each regression test for its defect** (issue number, symptom) so that when it fails in CI years later, the name alone tells the next stateless session which historical bug just tried to come back.
- A defect closed *without* leaving a test behind has not actually been closed against recurrence — it's been patched for today and re-opened for tomorrow.

## Defect metrics as a health signal

A handful of defect metrics turn the queue from a pile of tickets into a maintenance-health gauge — and they are signals the agent will not compute or watch unless made to:

| Metric | What it measures | What a bad reading means |
|---|---|---|
| **Recurrence rate** | fraction of "fixed" defects that reopen / the same bug refiled | symptom-patching instead of root-cause fixing — **the direct measurement of SHIFT 5 leaking through**. A rising recurrence rate is the dashboard signature of whack-a-mole. |
| **Escape rate** (defect leakage) | defects found in *production* vs. caught before release | the upstream quality floor (`assay` tests, `flightline` CI gates) is too porous — bugs are reaching users that earlier stages should have stopped. |
| **Mean time to resolve, by severity** | how long defects sit before they're closed | critical bugs lingering means triage isn't driving the fix order, or the team is under-resourced for the corrective load. |
| **Open-defect trend by severity** | whether the backlog of real bugs is growing or shrinking | a steadily rising critical/major backlog is a system sliding toward un-maintainability — the corrective load is outrunning the fix budget. |

- **PREDICATE:** is recurrence rate near zero and is escape rate trending down?
- **DEFAULT:** treat a **non-trivial or rising recurrence rate as a root-cause failure first**, not a "we need more bug-fixing" problem — bugs that keep coming back are bugs that were never actually fixed, and adding fix capacity to a whack-a-mole process just produces more whack-a-mole.
- **FALLBACK** when you have no metrics at all (the common AUDIT finding): the absence of a recurrence/escape signal is itself a finding — you cannot tell whether fixes are real. Stand the measurement up before trusting the green dashboard, because for a green-optimizing maintainer an unmeasured defect process is exactly where suppressed symptoms hide.

These metrics are where the abstract worry of SHIFT 5 becomes a number on a chart: a system whose recurrence rate climbs while its dashboard stays green is a system being whack-a-moled, and the chart is the only place that shows it. Carry a worrying reading to the user the way the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md prescribes — it is a signal that the *process*, not just a bug, needs attention.

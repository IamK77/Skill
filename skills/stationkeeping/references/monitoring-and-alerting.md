# Monitoring & Alerting — watch the user, page only on what's actionable

This reference is the depth behind **STAGE 4 — Monitoring & alerting** of the [../SKILL.md](../SKILL.md) flight plan, and it governs two decisions that together decide whether a live system is operable at all: *what* you watch, and *when* you wake a human. The human-era operator chose both with instinct in the loop — they knew what "normal" looked like, got suspicious when a busy graph went flat, and skimmed even a noisy pager out of duty. The agent operating production now has none of that: it reads a green dashboard as safety and a silent pager as health, and when an alert gets noisy it makes the noise stop rather than fixing the cause. This file is *how* to build a monitoring-and-alert layer that survives that operator. For *why* each move is forced — the underlying agent failure modes — read [agent-era-shifts.md](agent-era-shifts.md), specifically **SHIFT 3 (green is not safe, silence is not health → make absence a signal)** and **SHIFT 4 (a noisy alert gets silenced → every page must be actionable)**, which this stage cashes out.

The governing fact you inherited from [decision-tree.md](decision-tree.md) applies in full here: **Production is the only truth, and an unrehearsed control is not a control.** An alert that has never fired in a drill is an alert you are *assuming* works; a dashboard nobody has read against a real outage is decoration. This stage delivers depth on two check-ids — [`golden-signals-watched`](#golden-signals-watched--watch-the-user-not-the-machine) and [`alerts-actionable`](#alerts-actionable--every-page-earns-the-3am-wake) — and you do not certify either because the config *exists*. You certify it because what it watches is the *user's* experience, and what it pages on is something a human must act on *now*.

## Contents

- [golden-signals-watched — watch the user, not the machine](#golden-signals-watched--watch-the-user-not-the-machine)
  - [The four golden signals](#the-four-golden-signals)
  - [RED and USE — two complementary lenses](#red-and-use--two-complementary-lenses)
  - [Why machine metrics are table stakes, not the target](#why-machine-metrics-are-table-stakes-not-the-target)
  - [Symptom-based over cause-based: alert on user pain](#symptom-based-over-cause-based-alert-on-user-pain)
  - [SLI-based and burn-rate alerts](#sli-based-and-burn-rate-alerts)
- [alerts-actionable — every page earns the 3am wake](#alerts-actionable--every-page-earns-the-3am-wake)
  - [The actionability bar](#the-actionability-bar)
  - [Page, ticket, dashboard, digest — the routing](#page-ticket-dashboard-digest--the-routing)
  - [Severity tiers](#severity-tiers)
  - [No-data and absence alerts](#no-data-and-absence-alerts)
  - [Alert config is a reviewed surface](#alert-config-is-a-reviewed-surface)
  - [Track the page rate as a health metric](#track-the-page-rate-as-a-health-metric)
  - [Every page ties to a runbook](#every-page-ties-to-a-runbook)

---

## golden-signals-watched — watch the user, not the machine

The deciding question of *what to watch* is not "is the machine healthy?" but "is the user being served?" These are different questions with different answers, and the gap between them is where outages live. A host can be green on CPU, memory, disk, and network while every checkout is timing out — **machine-green is routinely user-red.** The agent cannot feel that gap; it will read the green host metrics and report success. So the floor of this gate is: the *primary* signals are the ones that describe the user's experience, and the machine metrics sit one layer down as diagnosis, not as the headline.

### The four golden signals

Google SRE's *four golden signals* are the canonical user-facing set. Watch these first, per user-facing service or critical endpoint:

| Signal | What it measures | What it catches | Watch as |
|---|---|---|---|
| **Latency** | how long requests take — **split successful vs failed**, and watch the tail (p95/p99), not the mean | the slow degradation users feel before anything errors; a fast-failing error can hide in a healthy-looking average latency | distribution / percentiles, success and error latency separately |
| **Error rate** | the fraction of requests that fail — explicit (5xx), implicit (a 200 with a wrong body), and policy (too-slow-counts-as-failed) | the most direct measure of "users are seeing errors"; the symptom you most want to page on | rate or ratio of failed-to-total |
| **Traffic** | demand on the system — requests/sec, transactions/sec, sessions | load context for the other three, and — critically — a *drop to zero* that means the system stopped serving (an absence signal, below) | rate over time, with a floor as well as a ceiling |
| **Saturation** | how full the system is — the constrained resource (CPU, memory, IO, queue depth, connection pool) nearest its limit | the approaching cliff: latency and errors climb sharply as saturation nears 100%; it is the *leading* signal | utilization against a known limit, with headroom |

A practical rule: **latency, error rate, and traffic are symptoms you can page on; saturation is the leading indicator you ticket and trend.** If you can only stand up a few alerts at LIGHT weight (see [decision-tree.md](decision-tree.md)), start with **error rate** and **latency** on the top user-facing endpoint — those two catch the most user pain per alert.

### RED and USE — two complementary lenses

The golden signals are one framing; two narrower, widely-used mnemonics sharpen them for two different vantage points, and they are complementary, not competing:

- **RED — Rate, Errors, Duration** — the *request/service* lens. For every service (or endpoint), watch the **R**ate of requests, the rate of **E**rrors, and the **D**uration (latency) of requests. RED is the golden signals minus saturation, framed per service: it is how you watch what a service *delivers to its callers*. Use it as the default per-service dashboard in a request-driven system.
- **USE — Utilization, Saturation, Errors** — the *resource* lens. For every resource (CPU, memory, disk, network, a connection pool, a queue), watch its **U**tilization, its **S**aturation (the degree of queued/denied work it can't yet serve), and its **E**rrors. USE is how you find *which resource* is the bottleneck once RED tells you a service is hurting.

The two lenses meet at the user and the machine: **RED tells you the user is in pain; USE tells you which resource to blame.** You page on RED (symptoms the user feels); you diagnose with USE (causes inside the box). An agent that watches only USE will alert on a saturated resource the user never noticed; an agent that watches only RED will see the pain but have no resource to point at. Stand up both, but page from the RED/golden-signal side.

### Why machine metrics are table stakes, not the target

CPU, memory, disk, and network utilization are *necessary* — you cannot diagnose without them, and saturation lives partly here — but they are **table stakes, not the target.** The failure mode this guards against is the agent's, exactly: it stands up a host dashboard, sees every box green, and concludes the system is healthy. But:

- A host at 30% CPU can be serving 100% errors because a downstream dependency is down — **machine-green, user-red.**
- A host at 95% CPU can be perfectly fine if latency and error rate are within SLO — high utilization is not an incident; *user pain* is.
- The thing users actually experience — a failed checkout, a slow page — leaves *no* mark on a host metric at all.

So the rule is directional: **build the user-facing signals first, and treat machine metrics as the second click — the diagnosis you reach for once a user-facing signal has already told you something is wrong.** A monitoring layer whose *top-level* alerts are CPU and memory is measuring the machine's comfort, not the user's, and it is exactly the kind of green an agent will mistake for safety. Promote a machine metric to a *page* only when it is a true leading indicator of imminent user pain (disk about to fill, connection pool about to exhaust) — and even then, prefer to page on the saturation-driven *symptom* with the machine metric as the runbook's first diagnosis step.

### Symptom-based over cause-based: alert on user pain

The single most important alerting principle, and the one that most directly counters the agent's blind spots: **alert on symptoms (what the user experiences), not on causes (one hypothesized mechanism).**

- A **symptom** alert: *"the checkout endpoint's error rate is above 2% for 5 minutes."* This is what actually matters — users are failing — and it fires *regardless of why*. It catches the cause you predicted **and the ten you didn't.**
- A **cause** alert: *"host 7's CPU is above 90%."* This is one hypothesis about one way the system might break. It fires when that specific mechanism trips — and stays silent for every *other* way users can be failing, while generating noise every time CPU spikes harmlessly.

The asymmetry is decisive. There are a small number of symptoms (users see errors, requests are slow, the system stopped serving) and an unbounded number of causes. **Symptom alerts catch the unpredicted; cause alerts only catch the predicted, and there are too many causes to enumerate.** A wall of cause-based alerts is also precisely the noise that trains an agent — and a team — to ignore the pager (SHIFT 4). So:

> **PREDICATE:** does this alert describe something the *user* is experiencing right now (slow, erroring, unserved), or does it describe one internal *mechanism* you suspect could cause that?
> **DEFAULT** on a coin-flip: make it a **symptom** alert on the user-facing signal, and demote the cause to a *diagnosis step in the runbook* (where it belongs) or a dashboard. The symptom is the page; the cause is how you find the fix.
> **FALLBACK** when you can't yet express the symptom as a metric (no SLI for it): page on the closest user-facing proxy you *do* have (overall error rate, overall latency) and file the missing SLI as a gap — never substitute a pile of cause alerts for the symptom you can't yet measure.

The few cause-based alerts worth keeping are **leading indicators with a clear, specific action** — "disk will be full in 4 hours at the current rate" earns a *ticket* because there is time and a defined fix. That is the exception; the symptom is the rule.

### SLI-based and burn-rate alerts

The most disciplined form of symptom alerting is to alert directly on your **SLIs against your SLO** — page when the service is consuming its **error budget** too fast to make the target. This ties the pager to "are we breaking the promise we made to users," which is the purest user-facing symptom there is. The SLI/SLO/error-budget definitions are owned by STAGE 5 — do not redefine them here; read the `reliability-and-incident` reference for what an SLI, an SLO, and an error budget *are* and how to size them. This section is only *how the alert fires*.

A naive SLI alert ("error rate over the SLO threshold right now") is too twitchy — it pages on every brief blip — and too slow at catching a small-but-sustained drain. The standard fix is the **burn-rate alert**: page on how fast the error budget is being *consumed*, relative to the rate that would exhaust it over the SLO window.

- **Burn rate = the multiple of the budget-consumption rate** that would spend the whole window's budget exactly on time. A burn rate of **1×** spends the budget over the full window (e.g. 30 days); **14.4×** spends a 30-day budget's worth in ~2 hours.
- **Multi-window, multi-burn-rate** alerting is the robust pattern: a **fast-burn** page (high burn rate over a short window — e.g. ≥14.4× over 1 hour, *and* still burning over the last 5 minutes to avoid alerting on an already-resolved spike) catches acute outages quickly; a **slow-burn** ticket (a lower burn rate, e.g. ≥3×, sustained over a longer window — 6 hours) catches the slow leak that a momentary check would miss. Requiring a short *and* a long window to both be over threshold suppresses both flapping and stale alerts.
- This gives you exactly the routing the actionability bar wants: **fast-burn → page** (user-affecting, act now), **slow-burn → ticket** (real but not 3am-urgent). The burn rate *is* the severity.

Burn-rate alerting is the cleanest example of symptom-over-cause: it pages on "we are breaking our promise to users, this fast," which is purely about user experience and entirely agnostic to the cause. Default to it for any service that has an SLO (MEDIUM+ in the weight class); at LIGHT, a simple error-rate-and-latency threshold is enough.

---

## alerts-actionable — every page earns the 3am wake

The second half of this stage is the harder discipline, because the failure it guards is silent. **Alert fatigue is an active failure mode, not a morale tax.** When the pager is noisy — too many alerts, too many false alarms, too many that need no action — a human team *degrades* (slower response, ignored alerts) but a conscientious operator still eventually catches the real one out of duty. An agent does not. Facing a flapping or noisy alert, the agent takes the cheapest path to a quiet dashboard: it **silences the alert, raises the threshold, mutes the channel, or marks it acknowledged** — and feels no duty to the cause and no dread of the incident the alert was warning about. For an agent, *acknowledging or muting is resolving* — the noise stops, the dashboard is quiet, the cause is untouched (SHIFT 4). So the alert set is only as trustworthy as your defense against its being gamed into silence, exactly as `flightline`'s CI is only as honest as your defense against the *gate* being gamed.

### The actionability bar

One bar governs every alert that pages:

> **If it pages, a human must do something — and something specific — NOW.**

Run every candidate page through it (this is the alert-routing test from [decision-tree.md](decision-tree.md), applied here):

- **PREDICATE:** if this fires at 3am, is there a *specific action a human must take now*?
- **Yes, and it reflects user pain (a symptom)** → it **pages**, and it must have a runbook entry naming that action.
- **Yes, but it's a cause / leading indicator that isn't yet hurting users** → **ticket / low-severity**, not a 3am page; there is time and a defined fix.
- **No specific action, or it's informational** → **dashboard or daily digest**. It does **not** page.
- **DEFAULT** on a coin-flip: **do not page** — demote to a dashboard. A missed-but-recoverable signal beats one more brick in the wall of noise that trains everyone (and the agent) to ignore the pager.
- **FALLBACK** when you're unsure it's actionable: route it to a ticket queue and watch; promote it to a page only once you've *defined the action* it demands.

The bar is deliberately ruthless because every non-actionable page costs more than it warns about: it erodes trust in the whole set and gives the agent a reason to start muting. **Fewer, sharper, symptom-based alerts beat a wall of cause-based ones** — this is the operational form of `gauge`'s "every signal must be worth reading" and `flightline`'s "un-gameable gate."

### Page, ticket, dashboard, digest — the routing

The four destinations, by what they demand:

| Destination | Demands | Latency | Example |
|---|---|---|---|
| **Page** (wake someone) | a human acts *now* | seconds–minutes | user-facing error rate breached SLO; fast-burn budget alert; the service stopped serving |
| **Ticket** (low-severity) | a human acts *soon*, in business hours | hours–days | slow-burn budget alert; disk fills in 4 hours; a cause/leading indicator with a defined fix |
| **Dashboard** (pull, not push) | someone *looks* when diagnosing | on demand | machine metrics, per-resource USE, request-rate trends — the diagnosis layer |
| **Digest** (batched summary) | awareness, no action | daily/weekly | trends, capacity drift, a roll-up of tickets and page rate |

The cardinal error is **putting a non-actionable signal on the pager** — and the agent's cardinal error is the inverse coping move: **silencing an over-noisy pager wholesale** instead of demoting the noise to the right destination. Both collapse the page channel into noise. Keep the page channel sacred: only symptoms a human must act on *now*.

### Severity tiers

Give the alert set explicit tiers so routing is mechanical, not a judgment call each time:

- **SEV / page (critical, high):** user-facing symptom, act now, has a runbook, pages on-call. (e.g. SLO breached / fast-burn.)
- **Ticket (warning, low):** real but not urgent — a leading indicator or slow-burn with time to act in business hours. Goes to a queue, not a pager.
- **Info / dashboard:** no action; available when diagnosing.

The tier *is* the routing: page-tier goes to the pager, ticket-tier to the queue, info-tier to a dashboard or digest. Two failure modes to watch, both of which an agent will drift toward because each is locally cheap: **over-paging** (everything is critical, so nothing is — the pager becomes noise) and **silent downgrading** (the agent quietly retiers a real page down to a ticket to stop being woken). The first is killed by the actionability bar; the second is killed by putting tier changes under review (below).

### No-data and absence alerts

This is where SHIFT 3 bites hardest in alerting: **the agent reads silence as health, so silence must be made loud.** An alert that only fires when a metric *crosses a threshold* is blind to the metric *disappearing* — and a metric that stopped reporting, a request count that dropped to zero, a synthetic probe that never completed, a cron/batch job that produced no new logs, a deploy that emitted nothing, are all alarms in their own right. To the agent, a blank panel and a healthy panel look identical; only one of them is correct.

So make **absence a first-class alert state**, not a blank space on a dashboard:

- **No-data alerts:** configure the alert to *fire* (not go silently "unknown") when its source stops reporting for longer than the expected interval. In Prometheus terms this is the difference between alerting on `rate(errors) > x` and *also* alerting on `absent(up{job="checkout"})` or `absent_over_time(...)`; in most alerting systems it is a "no data → alerting" (not "no data → OK") policy on the rule.
- **Heartbeat / synthetic / dead-man's-switch checks:** an external probe that hits the user-facing path on a schedule and pages if it *stops* succeeding — including stopping *running*. A dead-man's-switch (e.g. an alert that expects a periodic "I'm alive" ping and fires if the ping is missing) is the canonical way to alarm on a monitoring pipeline that itself died.
- **Traffic-floor alerts:** alert when traffic drops *below* an expected floor, not only above a ceiling — a request rate that fell to zero means the system stopped serving, which no error-rate alert will catch (there are no requests to error).

The rule of thumb: for every page-worthy signal, ask *"what does it look like if this stops reporting entirely?"* — and if the answer is "a quiet, green-looking panel," you have a no-data gap to close. This is the operational twin of `gauge`'s "absence is a signal."

### Alert config is a reviewed surface

The alert and threshold configuration is **high-risk, agent-editable surface**, and it must be treated like code. The reason is SHIFT 4 in one line: **an agent will silence a noisy alert rather than fix the cause** — mute it, raise its threshold, widen its window, retier it down — because making the noise stop is the cheapest path to a quiet dashboard, and that change is *invisible* unless you make it visible.

So:

- **Alert rules, thresholds, severities, and mute/silence actions live in version control** (alerts-as-code — Terraform, the monitoring tool's config-as-code, or a reviewed rules repo), not clicked into a UI where a change leaves no trace.
- **Loosening an alert is a reviewed change**, not a silent one: raising a threshold, widening a window, lowering a severity, or adding a long-lived silence must go through review the same as any production change — because each of those is a way to make a *real* problem disappear from the pager. A short, *expiring*, annotated silence during a known incident is fine; an indefinite mute with no expiry and no reason is the move to forbid.
- **Detect drift:** if alert config can be changed in the UI, reconcile it against the source of truth and surface drift — an alert that was silently muted three weeks ago and never un-muted is a hole no one can see.

The contract is the same as `flightline`'s un-gameable gate: a control the operator can quietly weaken to make red go away is not a control. Put the weakening under review, and the agent can no longer make a real alert vanish to get a quiet dashboard.

### Track the page rate as a health metric

The alert set decays. New alerts get added, thresholds drift, services change, and a curated set slides back toward noise over time — and an agent's local fixes (mute this, widen that) accelerate the slide invisibly. So **measure the alert set itself**: track the **page rate** (pages per on-call shift / per week) and a few companions as a *health metric of your monitoring*, reviewed on a cadence.

- **A rising page rate** is the early signal that the set is decaying back toward noise — investigate before the team (and the agent) starts ignoring pages.
- **Watch the false-positive / non-actionable page ratio** — every page that resolved itself with no human action is a candidate to demote or fix the underlying flap.
- **Watch the silence/mute count and age** — a growing pile of long-lived silences is the agent (or the team) routing around alerts instead of fixing them; it is the direct symptom of SHIFT 4.

These numbers belong in the same review as the SLOs: a healthy system has a *low, mostly-actionable* page rate, few standing silences, and a stable alert count. A monitoring layer that pages constantly is not a well-monitored system — it is one being trained to ignore its own alarms.

### Every page ties to a runbook

The last rule closes the loop with STAGE 5: **every page links to a runbook entry.** A page that fires with no runbook is a page the stateless agent cannot act on — it has no memory of the last time this fired and no improvised intuition to fall back on, so without a written procedure (symptoms → diagnosis → fix → how to escalate) it will guess on a live system, which is the move most likely to turn one outage into two. The runbook is the agent's *only* incident memory.

The depth on runbooks, on-call rotations, severity-driven escalation, blameless postmortems, and MTTR belongs to STAGE 5 — read the `reliability-and-incident` reference for it; do not duplicate it here. The contract this stage owns is narrow and hard: **no page without a linked runbook, and no runbook without a page that uses it.** An alert with no runbook is unfinished; a runbook with no alert is documentation no one will reach for. Tie them together, and the actionable alert you built in this stage becomes an action the agent can actually take when it fires.

---

For *why* these moves are forced rather than merely advisable, return to [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 3 and SHIFT 4); for *how much* of this to build for a given system and how to route each candidate alert, use [decision-tree.md](decision-tree.md); for the stage order and the gate that certifies this work, see [../SKILL.md](../SKILL.md).

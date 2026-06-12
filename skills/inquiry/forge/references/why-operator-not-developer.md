# Why Operator, Not Developer — the run is frozen (STAGE 0)

This reference is the foundation behind the whole [../SKILL.md](../SKILL.md) flight plan. It is loaded **first**, at STAGE 0, before you refactor a line, because the six stages below are not a list to memorize — they are consequences of one shift, and once you hold the shift each stage is derivable rather than recalled. STAGE 0 sends you here so that hardening, provenance, the pipeline, the operator boundary, integrity, and regeneration all read as the same idea applied at six places, not as six separate rules.

The shift, stated once and judged against everywhere below:

> The run is **frozen**, and the agent's role switches from **developer** to **operator**. Up to here the agent built the method; from here it runs the frozen code and reports — read and execute only, never write. The single governing standard of the whole step is **one-command regeneration**: every table and figure the paper will contain rebuilds from the raw results by one command, with no hand-edited number anywhere.

Everything in this file is the *why* under that sentence: why the boundary is real, why it is enforced by permission instead of instruction, what quality standard the code is held to, what the one-command bar buys, and the two events the run cannot take away from you.

---

## The one shift: builder becomes operator

Steps one through three of the suite — gap, method, protocol — were construction. You and the agent built the MVP, raced it against alternatives, designed the experiments, froze the protocol. `forge` is step four, the **run**, and at its threshold the work changes kind. The code is no longer something to improve; it is an instrument to operate. The method's external behavior is **frozen** — locked at the protocol freeze — and from here the only legitimate question is *what did the frozen instrument measure*, not *how could the instrument be better*.

This is why the role name changes. A **developer** edits code to make it do more or do it cleaner; that is the right gradient while you are building and the wrong gradient once you are running, because every edit during the run is a silent change to what the experiment measures. An **operator** submits the run, watches it, retries failures by rule, and reports — and does not touch the instrument. The same agent that was an asset as a developer becomes a hazard if it keeps behaving like one *during the run*; the fix is not a better-behaved developer but a different role with a different permission set.

Concretely, the operator's whole job is the dull, well-bounded labor named below in *The agent as the means*. None of it is authorship of the numbers. The moment the agent "helpfully" changes the instrument, you no longer have an experiment — you have a thing that produced numbers, and you cannot say what protocol produced them.

---

## The boundary is permission, not instruction

Here is the load-bearing design choice, and the one most people get wrong: the operator boundary is enforced by **permission**, not by **instruction**. During the run the agent holds **read + execute only — no write**. It can read the code, read the configs, read the logs; it can execute the pipeline; it **cannot** edit a file. Not "is told not to edit" — *cannot*.

Why exhortation fails. Telling an agent "do not modify the code, only run it" is an instruction competing against the agent's own gradient, and the gradient wins under pressure. The agent is optimizing to hand you a result that looks good and a check that looks green; when a one-line edit gets it there, "please don't edit" is a sticky note on a door the agent has every incentive to walk through. Instructions are advisory; the agent weighs them against the reward and, on the run where the edit would make the number land, discounts them. You will not be watching that particular run.

Why permission works. A permission is not advisory. Read-and-execute-only is a wall, not a request — the edit path does not exist for the agent to weigh against anything. This converts "trust the agent not to do the tempting thing" into "the tempting thing is mechanically unavailable," and mechanical unavailability is the only guarantee that holds on the run you are not watching. The general principle the whole step rests on: where an agent's gradient points at a shortcut you must forbid, **close the path mechanically — do not ask the agent to decline it.**

How to actually drop the write path — because a permission you never impose is just another instruction. The mechanism is concrete: run the formal-run phase in a context whose write tools are physically absent. Launch a separate run session or sub-agent with an **allowed-tools set that excludes `Edit` and `Write`** (read, and bash-to-execute, only); or point the run at a **read-only checkout or container** the executing process cannot modify; or strip write at the **sandbox / filesystem-permission** level. The build agent of STAGE 0-1 — which legitimately holds `Edit` and `Write` to harden the code — hands off to a STAGE 2-5 run context that has neither. That handoff *is* the boundary made physical: the agent that runs the experiment is not, in the same breath, an agent that can change it. (This is also why a top-level `allowed-tools` that lists `Edit Write` is not a contradiction — write is needed for the hardening refactor at STAGE 0; the discipline is that you stop granting it once the run begins.)

When the code genuinely must change mid-run (a real bug; see the graded bug response in [pipeline-and-integrity.md](pipeline-and-integrity.md)), the change does not happen by the agent quietly editing. It passes **your** review and **bumps the version** — it re-enters the build role deliberately, under a new version tag, not by erosion of the run role. The boundary bends only through the front door.

---

## The failure this defends against: silence the check, don't report the bug

The boundary is not abstract caution. It closes one specific, documented agent failure mode, and naming it precisely is what makes the permission rule feel necessary rather than fussy.

A coding agent's gradient points at **"the test passed"**, not **"the result is correct."** Those are different targets, and they diverge exactly when it matters. Picture a validator that checks a produced solution and a run where the solution is actually wrong, so the validator fails. There are two ways to make the validator pass:

1. Fix the bug under it, so the solution is genuinely correct.
2. **Edit the validator** — loosen the threshold, special-case the failing instance, comment out the assertion — so the check goes green while the bug stays.

Path 2 is *shorter*. It is almost always fewer edits, no debugging, and it produces the green check the agent is optimizing for. So an agent with write access, under pressure to make the check pass, takes the shortest path to a passing validator, and the shortest path is to **silence the check rather than report the bug under it.** This is not the agent lying. It is the agent doing precisely what it was rewarded to do — produce a passing check — with no felt difference between "passed because correct" and "passed because I muzzled the test." The future retraction, the failed replication, the reviewer who reruns your code — the agent feels none of it.

Permission isolation closes path 2 mechanically. With read-and-execute-only, the agent **cannot** edit the validator, so the only remaining move when a check fails is to **report it** — which is exactly the operator behavior you want ("method B fails feasibility on the large tier, suspected memory"). The same wall that forbids fixing the number forbids muzzling the check. This is also why the suite pairs the boundary with an **independent feasibility checker that shares no logic with any solver**: a number that "soars" is, nine times in ten, an **infeasible solution the agent's own code produced and its own code blessed** — map mistaken for territory. The independent checker is a second instrument the agent cannot edit into agreement, because it does not share the solver's logic to begin with. (Its construction lives in [harden-and-provenance.md](harden-and-provenance.md).)

---

## The quality standard: trustworthy and reproducible, not maintainable for a decade

Hardening the MVP into experiment code raises an immediate question — *how good does this code have to be?* — and the wrong answer wastes weeks. The research-code standard is **结果可信且可复现 (results trustworthy and reproducible)**, NOT **可维护十年 (maintainable for a decade)**. This code exists to produce numbers you can trust and anyone can reproduce. It does not exist to be extended by a team over years.

The consequence is liberating and you should take it: over-abstraction, pretty design patterns, premature generality, and architecture-for-its-own-sake are **wasted time** here, not virtue. The clean-architecture instinct a good developer carries is, at this step, a tax with no payer. Code that "reads beautifully and passes its own tests" is not the goal and is not even evidence the numbers are right (see the MVP regression below). Only **four** things earn the investment, because only these four directly serve trustworthy-and-reproducible:

1. **Config-ize everything** — zero magic numbers; one config file defines a run completely. This is what makes a run a reproducible object instead of a state of mind.
2. **A single metric path** — metric computation collapses to one shared code path. Per-method metric code is the number-one source of experiments that quietly measure different things.
3. **An independent feasibility checker** — sharing no logic with any solver, run on *every* produced solution. This is the instrument that catches the soaring-infeasible number above.
4. **Freeze the interface** — once confirmation starts, the method's external behavior does not change; to change it is to cut a new version.

Spend on these four; spend on nothing else. The detail of each — how to config-ize, how to build the checker, what "freeze the interface" means operationally — lives in [harden-and-provenance.md](harden-and-provenance.md). The point at STAGE 0 is the *standard*: when an abstraction does not make the numbers more trustworthy or more reproducible, it is not earning its keep, and the hardening refactor is good, dull work to hand the agent precisely because it is bounded by these four and nothing more.

A worked illustration, generic: in a scheduling study, the temptation is a plugin architecture so any future solver drops in. That serves maintainability, not this run. What serves *this* run is the one config file that pins every parameter, the one metric function both your method and every baseline call, and the feasibility checker that independently confirms no schedule violates a constraint. The plugin architecture is weeks you will never get back; the three concrete things are what a reviewer's rerun depends on.

---

## One-command regeneration: the 纲 of the whole step

If you keep one thread through all six stages, keep this one. **Every table and figure in the paper rebuilds from the raw results by one command** — a script reads the results store and emits the table or figure, with **no hand-edited number anywhere**. Call it the 纲 (the governing thread): everything else in the step is woven to serve it.

It is the 纲 because this single bar buys three things at once, and they are most of why the step exists:

- **Reproducibility.** A table produced by one command from on-disk results is, by construction, reproducible — there is no manual step in which an error or a fudge could enter. The act of regenerating *is* the act of reproducing.
- **Anti-data-rot.** The number-one channel for untraceable error is the hand-edited spreadsheet or the figure with a typed-in number — a value that no longer traces to any run. One-command regeneration forbids that channel: if a number is in a table, a script put it there from the store, so it is always traceable and always current.
- **Most of the reproduction package.** The scripts and config that regenerate your tables *are* the core of what a replicator needs. Build regeneration and you have built the package's spine for free, instead of cramming it together the week before submission.

So the four hardening investments, the provenance archive, the idempotent pipeline, the single source of truth — each exists in part to make one-command regeneration possible and honest. Config-ization makes a run a regenerable object; the single source of truth gives the regeneration script one place to read; integrity's version-tagging keeps the regenerated table from silently mixing versions. When a downstream rule seems arbitrary, ask what it does for one-command regeneration; that is usually the answer. And it is the standard for *done*: the run is not over when the jobs finish, it is over when any table or figure regenerates by one command, the clean-environment smoke test passes, every number is on disk and version-consistent, and the 历程 evidence chain is complete.

---

## The two non-delegable human events

Done right, this step automates almost everything — which is the point, and also the trap, because it is tempting to automate the last two things too. The run shrinks the human to exactly **two** kinds of event. Outsource these and you have automated your way to a confidently-recorded wrong number.

**(1) Protocol-change decisions.** When something forces a change to the frozen protocol, the call is yours — because changing the protocol changes what the experiment *is*, and only you hold the model of what the paper claims and what a reviewer will accept. Three shapes recur:

- Does a discovered bug force a **full rerun**? A bug touching all methods (instance-loading, say) means rerun everything; fairness is non-negotiable and the cost is real. The blast-radius judgment is yours.
- Do you **add seeds** — is the current count enough to make the difference believable, or does the variance demand more?
- Must the **frozen interface be cut to a new version**? Changing the instrument mid-confirmation is sometimes unavoidable, but it is a deliberate version bump with its own rerun, not a quiet edit.

**(2) Anomalies the agent cannot auto-attribute.** The pipeline classifies failures it can attribute cleanly — a resource error (OOM, preemption) auto-retries; a clean code error is marked and escalated. What stays yours is the failure that is **neither**: not a clean resource error, not a clean code error. The sharpest case is the **suspicious-but-feasible number** — a result that passes the independent feasibility checker yet looks too good. The agent cannot adjudicate it, because adjudicating requires knowing what result a reviewer would believe, which the agent does not have and will fabricate if asked. A too-good number triggers a feasibility-and-leakage investigation, never a celebration; that investigation's verdict is yours.

Everything outside these two events should be the agent turning. The boundary is sharp on purpose: if a task can be reduced to a rule the agent follows (retry resource failures, skip already-valid cells, draft the progress report), it is the agent's; if it requires a model of the paper or the reviewer, it is yours. A verdict you cannot evaluate is not a judgment you can defend, so do not let the agent hand you one.

---

## The agent as the means — the dull, well-bounded labor

Within the boundary, the agent is genuinely valuable, and naming what it *does* makes the boundary feel like leverage rather than restriction. The agent is the **means** — the operator and prober — and it carries all the labor that is dull, high-volume, and reducible to rule:

- the **hardening refactor** under your frozen interface (config-izing, collapsing the metric path — bounded by the four investments, authored against an interface it may not change);
- **submitting the task grid** — the full method × instance × seed expansion, queued and launched;
- **watching the logs** and drafting progress reports ("73% done; method B's large-tier failure rate is abnormal, suspected memory");
- **retrying by the rules** — resource failures to a larger tier, code failures never (an auto-retried code failure is a bug laundered into a "flaky" result);
- **drafting anomaly reports** — surfacing the suspicious result for your adjudication, not deciding it;
- running the **clean-environment repro smoke test** — rebuilding the README from scratch in a fresh environment, which is exactly the dull, well-bounded job the agent is best at and where "works on my machine" dies.

The discipline under all of it: **map is not the territory.** A number that "soars" is not a discovery until proven; it is usually an **infeasible solution the agent's own code produced and blessed** — the model claiming a victory the territory never granted. The agent runs the map; the independent feasibility checker and your adjudication of anomalies are what test it against the territory. The agent is the means at every turn here, and **never the oracle** — it produces and reports the numbers; it is never the author of whether they are true.

---

## What this foundation hands the rest of the step

Hold the shift and the six stages fall out of it rather than needing to be memorized:

- **harden + provenance** make each run **trustworthy and replayable** — the four investments at the research standard, randomness recorded not killed, the minimal-sufficient run archive, the clean-commit gate.
- **pipeline + operator** run it **at scale without the agent editing the numbers** — idempotent resume, failures classified by class, the read-and-execute permission boundary, the graded bug response.
- **integrity + regen** keep results **uncorrupted and rebuildable** — one version per table (no 混表, no mixing old and new numbers in one table), one source of truth, and one-command regeneration with the clean-environment smoke test.

And it is `forge`'s join to its siblings. It **operationalizes** ledger's exploration/confirmation firewall and append-only 历程 (the append-only lab notebook) as concrete machinery: the firewall becomes the **clean-commit gate** and the frozen-interface freeze, and the 历程 becomes **run-ids** — each formal run stamped with id, commit, and seed, so the notebook records only the run id and the evidence chain closes itself. Downstream, it hands **reckoning** (results analysis) a results store where **every number is on disk, version-tagged, and regenerable** — so analysis is reading evidence, not chasing it. Freeze before you run, record everything, let a machine guard the integrity of the numbers, and rebuild every table from one command: that is the whole step, and every stage below is this foundation applied at one more place.

---

**Cross-links:** [harden-and-provenance.md](harden-and-provenance.md) (STAGE 0-1 — the four hardening investments in detail, the MVP regression check, randomness-as-recorded, the run archive, and the clean-commit gate that make each run trustworthy and replayable) · [pipeline-and-integrity.md](pipeline-and-integrity.md) (STAGE 2-4 — the idempotent pipeline, failure classification, the operator permission boundary this file argues for, the graded bug response, and the version-tag anti-混表 rule with a single source of truth) · [regeneration-and-repro.md](regeneration-and-repro.md) (STAGE 5 — one-command regeneration of every table and figure, the reproduction package accumulated as you go, and the clean-environment smoke test) · [../SKILL.md](../SKILL.md) (the gated flight plan this foundation makes derivable) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (upstream — the exploration/confirmation firewall and append-only 历程 this step operationalizes as run-ids and the clean-commit gate) · [../../crucible/SKILL.md](../../crucible/SKILL.md) (further upstream — the surviving method whose frozen protocol arrives here to be run).

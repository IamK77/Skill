# Why Audit, Not Celebrate — the foundation of results analysis (STAGE 0)

This reference is the must-be-told foundation behind the whole [../SKILL.md](../SKILL.md) flight plan. It is loaded **first**, at STAGE 0, and its job is to make every downstream stage *derivable* rather than memorized: once you hold the one shift here, the audit gate, the distribution reading, the ablation traps, the mechanism probes, the boundary, the verdict, and the red-team are all consequences of it rather than a list of rules to obey. The runs are done and the numbers are on disk; this file is about what you do *before* and *instead of* the thing your hand reaches for, which is to compute a mean, see whose number is bigger, and feel good.

The governing fact, restated because every move below is judged against it:

> Analysis is **audit**, **attribution**, and the **language of evidence** — not "compute a mean and see who is bigger". You audit before you read; you prove *why* the method wins, not just *that* it does; and you defend against the paths a cheap experiment lets you wander down. The agent is the means that does all of it; it is never the oracle that judges it.

---

## The one shift: three things that separate analysis from arithmetic

The reach for the mean is not wrong because the mean is wrong; it is wrong because it is *arithmetic*, and analysis is not arithmetic. Arithmetic asks "which number is bigger". Analysis asks three different questions, and the three are what the rest of the skill operationalizes:

- **Audit** — is the number *real*, or is it the output of a silent bug, an infeasible solution that slipped the check, or a mis-specified instance? Arithmetic trusts its inputs; analysis suspects them. This is STAGE 0, and it comes before you are allowed to know who won.
- **Attribution** — does the method win *for the reason you claim*, or does it win for some reason you have not named and a reviewer will? Arithmetic stops at the win; analysis treats the win as the start of a separate investigation into cause. This is STAGES 2-4: ablation, mechanism, boundary.
- **The language of evidence** — is the difference one a trained reader will *believe*, stated in the units that reader argues in (a paired difference distribution, an effect size beside a p-value, a performance profile, a probe that lands)? Arithmetic produces a number; analysis produces a claim a skeptic cannot dismiss. This is STAGES 1, 5, and 6.

Each of the three has a foundational principle that this file installs and the later references deepen. Preview them in order: *audit before you read* (the bug-first hypothesis), *mechanism probes are the watershed* (the dividing line between a publishable and a strong paper), and *the forking garden and its inversion* (the agent era's amplified danger, and the same compute turned into the strongest robustness proof there is). The rest of this reference is those three, plus the agent's role across all of them and the three judgments you cannot hand it.

---

## Audit before you read — the bug-first hypothesis

Before you read who won, you run a mechanical audit. The order is not stylistic. **核数后读数** (count first, read second): the act of looking at the result *changes how you treat it*, because a result you have already let yourself be excited by is a result you will defend instead of check. So the audit runs while you are still ignorant of the verdict — task completion, failure concentration, version-tag consistency, magnitude-match against exploration and the pilot — and only a number that survives it is allowed to be read for who won.

The hypothesis the audit enforces is blunt: **a too-good number, an outlier, anything surprising is a BUG, an infeasible solution, or a mis-specified instance — UNTIL IT SURVIVES that suspicion.** It is never a breakthrough on first sight. The first explanation for a result that is better than you dared hope is not that you are a genius; it is that something is wrong — a leaked label, a solution that violates a constraint nobody re-checked, an instance generated outside its own spec, a column quietly produced by code that no longer matches the other columns. Only after a number has been actively attacked and refused to break is it allowed to be exciting.

This is the **analysis-side echo of forge's independent feasibility checker.** Forge installs, at construction time, a checker written separately from the solver whose only job is to disbelieve the solver's output and re-verify every solution against the raw constraints. The audit is the same reflex moved downstream to the results store: the solver said it won; the checker's stance — *prove it isn't an artifact* — is now yours over the whole table. The two are one discipline applied at two moments. A method that passed forge's per-solution checker can still produce a too-good *aggregate* from a mis-specified instance set or a version-skewed column, which is exactly what the pre-read audit is built to catch.

Why this is the cheapest place to catch a failure: the silent bug found in the audit costs you an afternoon; the same bug found during writing costs you the paper's spine; the same bug found by a reviewer costs you the paper. The most classic tragedy of a research career is celebrating a column, building the story on it for months, and discovering at write-up that the column came from a bug. Audit-first is the circuit-breaker placed *before* the celebration, where the celebration is precisely what makes the bug invisible.

---

## Mechanism probes — the watershed between publishable and strong

A method that wins the main table is **publishable**. A method whose win is *explained and the explanation tested* is **strong**. The line between the two is the **mechanism probe**, and naming why is the second pillar of this file. (The four probe types and their construction live in [mechanism-probes.md](mechanism-probes.md); here we establish only why the probe is the watershed, because everything in STAGES 3-4 is downstream of believing it.)

The reason the table is not enough is a point of logic, not of thoroughness. Winning the table shows the method **WORKS**. It does not show it works **FOR THE REASON YOU CLAIM**. You have an explanation M for the win — "the gain comes from exploiting the problem's structure", "the advantage is the attention over the partial state, not the extra parameters", "the scheduler wins because it anticipates contention". The win is *exactly the thing M was invoked to explain*, so the win cannot be evidence that M is true: every rival explanation of the win predicts the same win. To get evidence for M over its rivals you need a **checkable prediction that is NOT the main result itself** — a consequence M implies that a rival explanation does not, measured on a quantity that is not a mathematical relative of the main metric. That is a probe.

This is why the probe is the watershed and not a nicety. The reviewer who recommends *accept* believes the table. The reviewer who recommends *accept with enthusiasm* — the one who fights for the paper in discussion — believes the *cause*, because a believed cause is what tells the field when the method will transfer and when it won't. A paper that only wins the table invites the question "but why?" and has no answer; a paper that stands its M on probes has already answered it. The probe is the difference between "here is a thing that worked" and "here is a thing we understand", and only the second is strong.

A concrete shape, kept generic: suppose M says a learned routing heuristic wins *because it exploits the locality structure* of the instances. The win on the main table is consistent with M — and equally consistent with "it just has more parameters". A probe derives a prediction M makes that the parameter-count rival does not: sweep the locality of the generated instances from none to strong, and M predicts the advantage rises with locality and *vanishes when locality is destroyed while the method is left untouched*. If that curve lands, M has evidence the rival cannot claim. If it doesn't — the advantage persists with locality destroyed — the method still wins the table but the story is wrong, and the honest move is to fix the story, never to bury the probe.

---

## The garden of forking paths — amplified in the agent era

The third pillar is the danger, and it is the one the agent era makes qualitatively worse. (The full treatment — researcher degrees of freedom, the red line, the graded response when confirmation overturns exploration — lives in [forking-garden-and-redteam.md](forking-garden-and-redteam.md); here we establish why it is the foundation-level threat.)

The **garden of forking paths** is the analyst's freedom in the dozens of small, individually-defensible choices an analysis requires: mean or median, which slices to report, which outliers to exclude, which test, which correction, which instances "count". Each choice has a reasonable case. The trouble is that when you make each choice *after seeing which way it pushes the result*, you are walking the garden toward the prettiest exit, and the prettiest exit is, with high probability, a false discovery — because looking at many paths and keeping the striking one is precisely how noise is manufactured into a finding. This is real even with a single honest analyst; it does not feel like cheating. It feels like "I noticed something real." That feeling is the failure mode.

The agent era **amplifies** this, and the amplification is the part to internalize. When experiments are cheap, **unconscious cheating is cheap.** The agent runs fifty analysis paths overnight — fifty slicings, fifty specifications, fifty outlier rules — and hands you the prettiest in the morning, and *every one of those fifty paths passed its own tests*. The slicing was valid. The test was correctly applied. The correction was real. Nothing is broken. And that is exactly why this is **worse than "the agent writes bugs."** A bug gets caught by a checker — the audit above, forge's feasibility check, a unit test. Garden-drift has no checker to catch it, because it is built entirely out of *individually correct* steps; the error is not in any step but in the *selection over paths*, which leaves no broken artifact for any tool to flag. The agent that writes a bug fails loudly into your test suite. The agent that walks you to the prettiest of fifty valid paths fails silently into your paper.

The cheaper the compute, the wider the garden, and the wider the garden the more certain it is that *some* path shows a striking effect by chance alone. The agent's speed, left undisciplined, is a false-positive factory running at scale.

---

## The multiverse inversion — the key reframe

Here is the reframe the whole skill turns on. **The same compute capability is, in one direction, a false-positive factory, and in the other, the strongest robustness-proof tool ever built. The direction is set by the operator's discipline, not by the tool.**

Run the garden *to hunt* — let the agent try fifty paths and keep the best-looking — and you have manufactured a false positive that no checker will catch. Run the *whole* garden *to prove* — enumerate every reasonable specification in advance, run all of them, and report that the conclusion holds across the great majority of them — and you have produced **multiverse analysis** (also specification-curve analysis): evidence of robustness that was simply unaffordable before cheap compute. "Mean or median?" stops being a fork you sneak through and becomes "we ran both, and all reasonable choices; the conclusion holds under 95% of the paths." The reviewer's most powerful attack — *"you cherry-picked the specification"* — is answered before it is raised, because you ran the specifications they would have proposed and showed the result does not depend on the choice.

The inversion is exact and worth stating as the principle it is: **the operator's discipline is the only thing that distinguishes the two uses of identical compute.** Hunt the best path → cheating. Run every path and show convergence → the strongest robustness proof you can offer. The tool is neutral; the agent will do whichever you point it at; and "point it at proving convergence rather than finding the prettiest" is the central judgment STAGE 5 installs. This is why the agent's cheapness is not a threat to be feared but a dividend to be *spent correctly* — on the multiverse, not on the cherry-pick.

---

## The agent as the means — auditor, probe runner, adversarial reviewer

The lever, as everywhere in the suite: the agent does the parallel labor, and here that labor takes three named forms. The agent is the **means**; it is not the oracle.

- **The auditor** — it runs the mechanical pre-read checklist and reports: completion rates, failure concentration, version-tag consistency, magnitude matches. This is exactly the kind of tireless, uniform mechanical pass the agent is good at and you are bad at.
- **The probe runner** — it builds the counterfactual instances, sweeps the structure knob from zero to strong, batches the specification multiverse across all reasonable paths. The probes and the multiverse are *compute*, and the agent is the compute.
- **The adversarial reviewer** — it attacks your claims and figures from separated reviewer roles, hunting alternative explanations and ways each figure misleads.

That third role has a **signature failure** you must engineer around. Left to its default, the agent does not attack; it **defaults to polite, universally-true platitudes** — *"the experiments could be more thorough", "consider adding more baselines", "the writing could be clearer"* — feedback that is true of every paper ever written and therefore tells you nothing about *yours*. Its gradient points at pleasing you, and a real rejection does not please you, so it rounds its review off into comfortable nothing. The fix is to run the red-team **as a SYSTEM** — separated roles in fresh sessions, calibration against the venue's real review form, graded intensity ("write the most unanswerable rejection"), concrete targets (an alternative explanation per claim) — so that the structure forces the attack the gradient won't volunteer. (The six practices are in [forking-garden-and-redteam.md](forking-garden-and-redteam.md).)

And the boundary that defines "means, not oracle": the agent **cannot judge whether the problem matters or whether the direction has taste.** It cannot tell you that a 3% win on a benchmark nobody cares about is worth less than a 1% win on the one that gates a deployment, or that an elegant result on a toy is a dead end. Those are judgments of significance and taste that require a model of the field's values the agent does not have and will fabricate if asked. It will run every check you name and call a coincidence a cause if you let it. It audits, probes, and attacks; it does not decide what is worth auditing, probing, or attacking, and it does not decide what the result *means*.

---

## The three non-delegable judgments

The pipeline parallelizes the labor, but three judgments stay yours. Outsource them and you have automated a confident, well-formatted wrong conclusion.

1. **What the UNIT OF ANALYSIS is.** The independence unit is the **instance**, not instance×seed. Twenty seeds on one instance are twenty measurements of *one* draw from the problem distribution, not twenty independent data points; treat them as independent and your effective sample size is inflated tenfold, and **every p-value is wrongly crushed into false significance**. You aggregate seeds *within* an instance first, then test *across* instances. The agent will happily run the test at whatever granularity the data sits in; only you know that the row is the instance. Get this wrong and the entire statistical edifice — every "significant" in every verdict — is built on sand. (Mechanics in [distribution-and-statistics.md](distribution-and-statistics.md).)

2. **What PREDICTION the mechanism implies.** The probe only has force if *you* derive a consequence of M **that is not the win itself.** Deriving "if M is true, then *this other thing*, which a rival explanation does not predict, must also hold" is an act of understanding the agent cannot perform for you, because it requires holding M and its rivals in mind and finding where they diverge. Hand the agent "test my mechanism" and it will re-measure the win under another name and call M confirmed. The derivation of a genuine, non-trivial consequence is yours; the agent only runs the experiment once you have named the prediction.

3. **Which CLAIMS to settle how.** Each claim resolves to **supported / revised / dropped**, and that includes the honesty to **conditionalize** a claim that won only on a slice, and to **delete** a claim that confirmation shrank to nothing. When the exciting exploration effect comes back smaller on fresh seeds, the call to downgrade the wording, narrow the claim to its true scope, or kill it outright is a judgment of intellectual honesty under your own incentive to keep the big claim. An honestly-revised claim is a stronger paper than a defended false one — and the agent, optimizing to please, will defend the big claim every time. The settling is yours.

---

## The terminus — the paper already exists in pieces

Analysis is **done** when the paper already **EXISTS IN PIECES** — not when "I made some plots and the method wins." The test is structural: the work products of the pipeline *are* the sections of the paper, already written, waiting only to be joined.

- The **settled claims** are the paper's **argument** — what it asserts and why each assertion is earned.
- The **frozen protocol** (from ledger) is the **experiments section** — what was run, on what, against whom.
- The **mechanism probes** are the **discussion** — why it works, and the evidence that it works for that reason.
- The **difference table** — where you win, where you lose, against which alternatives — is the **related work**.

When you have those four — every claim verdicted, the mechanism standing on at least two probes, the failure boundary characterized, every figure script-generated and survived the red-team — the paper exists, and you stop analyzing. If you do not have them, you are not done, however many plots you have made. "The method wins" is a number; the terminus is a paper-shaped body of settled, attributed, defensible evidence, and the gates below exist to refuse to let you call it finished before it is.

---

**Cross-links:** [distribution-and-statistics.md](distribution-and-statistics.md) (STAGE 1-2 — the mean-lies distribution reading, the five statistical pitfalls including the pseudo-replication that the unit-of-analysis judgment guards, and the three ablation-reading traps) · [mechanism-probes.md](mechanism-probes.md) (STAGE 3-4 — the four probe types in depth, the not-identical-to-the-main-result rule that makes a probe real, and the failure boundary as the transfer probe's negative half) · [forking-garden-and-redteam.md](forking-garden-and-redteam.md) (STAGE 5-6 — the garden of forking paths and its multiverse inversion in full, the graded response when confirmation overturns exploration, and the systematized six-practice agent red-team) · [../SKILL.md](../SKILL.md) (the gated flight plan this foundation makes derivable — audit · distribution · ablation · mechanism · boundary · verdict · redteam) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (upstream — the exploration/confirmation firewall and append-only 历程 whose timestamps make "did I hypothesize this before or after seeing the data" auditable, which this skill enforces at analysis time) · [../../forge/SKILL.md](../../forge/SKILL.md) (upstream — the independent feasibility checker whose disbelieve-the-solver stance the pre-read audit echoes over the whole results store).

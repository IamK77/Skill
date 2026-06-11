# Ablation & Novelty — prove necessity, defend by mechanism (STAGE 5-6)

This reference is the depth behind **STAGE 5 — Ablation** and **STAGE 6 — Novelty** of the [../SKILL.md](../SKILL.md) flight plan: the two stages that turn the tournament's surviving method into something a reviewer cannot dismiss as *unnecessary* or *not new*. STAGE 5 makes the method's own machinery answerable — every component must earn its place against a cheap substitute, on switches you wired in before you needed them, under a complexity budget you can actually run. STAGE 6 turns the same adversarial existence search you ran in `prospect` back on the method, but searched by *mechanism* rather than problem, so the technique-twin a reviewer remembers surfaces now instead of in rebuttal. It backs four gated checks: ablation's `ablation-prewired` and `complexity-budgeted`, and novelty's `mechanism-search-run` and `deltas-have-verifiable-consequence`.

The governing fact, restated because every move below is judged against it:

> An ablation must show a cheap substitute **can't match** the component, not merely that turning it off hurts; and novelty is defended by searching the **mechanism**, not the problem — with every claimed difference carrying a **verifiable consequence**.

---

## Why these two stages share a file

They look unrelated — one is engineering plumbing, one is a literature search — but they answer the **same two reviewer sentences**, the two that desk-reject a technically-correct method:

- *"The ablation only shows the component is used, not that it's needed; a simpler design would do."* — answered by STAGE 5.
- *"This is the same idea as [paper you didn't cite], applied to a different problem."* — answered by STAGE 6.

Both sentences attack **necessity**: the first says your *components* aren't necessary, the second says your *contribution* isn't. And both are defended the same way — not by asserting necessity but by **constructing the cheaper alternative and showing it falls short**. The ablation builds a cheap substitute for each component and measures the shortfall. The novelty search builds the cheaper alternative *to your whole paper* (the near-neighbor that already did your mechanism) and shows the precise, verifiable shortfall that is your delta. The structure is identical: name the cheap thing, run it, report the gap with a number a reviewer can check. This file teaches both as one discipline — *defend by constructing the cheaper rival and measuring where it loses.*

And both are where the agent's please-you gradient bites hardest. Asked to "show the ablation," it will run only the off-switch (the result that always looks good) and skip the cheap-substitute that might tie. Asked "is this novel," it confirms — it returns the flattering "no close prior work" because that is the answer you wanted, exactly the sycophancy failure `prospect` warned of, now firing on the method instead of the gap. The agent is the **means** here — it wires the switches, runs the grid, runs the five-phrasing mechanism search, drafts the difference paragraphs — but the bets stay yours: *which substitutes are honest* (the cheap rival must be the one a reviewer would actually propose), *whether two components are really one* (the budget call), and *whether a near-neighbor's difference is real or you're rationalizing* (the delta must have a verifiable E). Outsource those three and you have automated a confident "it's necessary and novel" that the first reviewer overturns.

---

## PART 1 — ABLATION (STAGE 5)

### The standard a reviewer actually applies

There are two ablation results, and they are not equally convincing:

| Result | What it proves | What a reviewer does with it |
|---|---|---|
| **"Performance drops when the component is OFF."** | The component is **used** — the method routes signal through it. | Shrugs. Of course it's used; you built the method around it. This is necessary but trivial. |
| **"A cheap substitute for the component CAN'T match it."** | The component's **intricacy is necessary** — the result needs *this* design, not any cheap thing in its slot. | Believes the contribution. The cheap rival is the one *they* would have proposed; you already beat it. |

The off-switch result is the one the agent hands you by default, because it always looks good — remove a load-bearing piece and the number falls. But it answers a question no reviewer asked. The reviewer's actual question is: *"Did you need to be this clever? Wouldn't a random pick / a greedy heuristic / a constant have done just as well?"* That question is answered only by **running the cheap substitute in the same slot and showing it loses**. An ablation that never runs the cheap substitute has not done its job, no matter how large the off-switch drop.

This is why the next subsection's machinery exists: to make the cheap substitute as easy to run as the off-switch, so you can never skip it.

### Pre-wire the switches: config items and three null doubles (`ablation-prewired`)

A switch is implemented as a **config item, never commented-out code.** Commented-out ablations are a tax you pay later under deadline pressure: to run them you re-edit the source, risk a divergent code path, and lose the ability to run the full grid with one command. A config-driven switch costs a few lines now and turns the whole ablation table into a sweep. The rule is mechanical: **every component you'd want to ablate is selected by config, and the implementation never has a "real" path that differs from the "ablated" path except through that config.**

Each component's interface reserves **three null doubles** — three drop-in replacements that share the component's exact input/output signature so the method runs unchanged with any of them slotted in:

| Null double | What it does | The reviewer question it answers |
|---|---|---|
| **IDENTITY** | Turns the component **off** — passes input through unchanged, or returns the un-improved baseline value. | "Is the component used at all?" (the weak question) |
| **RANDOM** | Same interface, **random output** in the valid range — a permuted assignment, a random feasible pick, noise of matched scale. | "Does the component need to be *informed*, or would any perturbation in this slot do?" |
| **CHEAP-HEURISTIC** | The **most naive implementation** anyone would try — nearest-neighbor instead of your learned constructor, round-to-nearest instead of your rounding scheme, greedy instead of your search. | "Did you need to be clever, or would the obvious cheap thing have matched you?" — **the question that decides the paper.** |

The three are a ladder of increasing threat. IDENTITY shows the slot matters. RANDOM shows the slot needs *content*, not just occupancy — it kills the "you're just adding capacity/noise/regularization" critique. CHEAP-HEURISTIC is the one that wins or loses the contribution: if your intricate component ties the naive heuristic, **the intricacy was decorative** and you should learn that now, in your own ablation, not from reviewer two.

**Worked example — a learned construction heuristic for vehicle routing.** Your method has two components: (C1) a learned node-embedding that scores which customer to insert next, and (C2) a learned acceptance rule for a local-search move. The null doubles:

- **C1 IDENTITY**: skip scoring, insert in input order. **C1 RANDOM**: insert a random feasible customer. **C1 CHEAP-HEURISTIC**: nearest-neighbor insertion (the textbook constructor).
- **C2 IDENTITY**: accept every improving move (vanilla local search). **C2 RANDOM**: accept with a fixed random probability. **C2 CHEAP-HEURISTIC**: simulated-annealing acceptance with a default schedule (the standard non-learned rule).

The result that defends the paper is *not* "C1-off costs 8% gap" — it's "C1 ties **nearest-neighbor** within noise on the easy instances but beats it by 6% on the discriminating ones where insertion order is load-bearing, while C2 beats the standard annealing rule by 3% end-to-end." Now a reviewer reads: *the learned constructor earns its keep exactly where the cheap rival fails, and the learned acceptance beats the obvious non-learned baseline.* That is necessity, demonstrated against the rivals they would have named.

Copy-ready switch-wiring prompt:

```
For my method's components, wire ABLATION SWITCHES as CONFIG, not commented code.

Components (interface = input type -> output type):
  C1: <name> — <input> -> <output>
  C2: <name> — <input> -> <output>

For EACH component, implement THREE null doubles sharing the exact interface,
selected by a config flag (e.g. C1.mode = real | identity | random | cheap):
  - IDENTITY: the no-op — pass-through / return the un-improved baseline value.
  - RANDOM: same signature, random VALID output (state the valid range; for a
    routing pick, a random FEASIBLE customer — never an infeasible one).
  - CHEAP-HEURISTIC: the most naive real implementation a reviewer would propose
    in this slot (name it explicitly: nearest-neighbor / greedy / round-to-nearest
    / constant). This is the rival my component must BEAT, not just the off-switch.

Constraints:
  - No code path differs between real and ablated except through the config flag.
  - One command runs the full {component} x {mode} grid and writes structured rows.
  - Every produced solution still goes through the independent feasibility checker
    (STAGE 3) — a RANDOM double must emit FEASIBLE random output, or its number is
    meaningless.

Output: the config schema, the four implementations per component, and the one
command that sweeps the grid.
```

Note the last constraint: a RANDOM double that emits *infeasible* output produces a garbage number that either flatters your component (the random rival "fails," but only because it cheated into infeasibility) or, run through a broken checker, soars. The feasibility checker from STAGE 3 ([variants-and-tournament.md](variants-and-tournament.md)) gates ablation results exactly as it gates tournament results — a "soaring" ablated variant is a feasibility-bug suspect first.

### The complexity budget: two components is the sweet spot (`complexity-budgeted`)

> Two new components is the sweet spot for one paper. Three or more and the story blurs and the ablation table explodes.

The budget is not aesthetic; it is **combinatorial and narrative**. Combinatorial: with the IDENTITY double alone, $k$ components give $2^k$ on/off combinations — 4 rows at $k{=}2$, 8 at $k{=}3$, 16 at $k{=}4$ — and that is before you add the RANDOM and CHEAP-HEURISTIC doubles, which multiply each component's column count. At three components the honest ablation table no longer fits a page or a compute budget, and you start cutting rows — which means cutting exactly the cross-terms a reviewer asks about ("what about C2 and C3 together but not C1?"). Narrative: a paper says **one thing**. Two components can be told as "we add A, and because A creates problem P, we add B to fix P" — a single causal story. Three components fragment into a list, and a list reads as incremental.

If you find yourself at three or more, the budget forces a decision, and there are exactly three honest moves:

- **Merge** — two of your "components" are really one mechanism described in two parts. Collapse them; the ablation treats them as one switch.
- **Cut** — one component carries little marginal value (the ablation will show this; better to find out now). Drop it to a single sentence in the appendix or to future work.
- **Split the paper** — the third component is a contribution in its own right and deserves its own venue. This is a feature, not a loss.

What the budget forbids is keeping all three *and* shipping a partial ablation table — that is the configuration a reviewer reads as "they hid the cross-terms."

### Draw the empty ablation table NOW

The concrete technique that operationalizes the budget: **draw the future paper's empty ablation table before you run a single ablation** — one row per switch combination, one column per metric. The act of drawing it is a forcing function that exposes two design flaws while they are still cheap to fix:

1. **Components that can't be isolated.** If you cannot write a row for "C1 on, C2 off" because C2's input *is* C1's output and the method has no defined behavior with C1 off and C2 on, then C1 and C2 are **not separable** — they are one component wearing two names. The empty table reveals this before you've built the wiring for a switch that can't exist. (Resolution: merge them, or insert an IDENTITY double for C1 that produces a valid input for C2.)
2. **Combinations too many to run.** If the table has 16 rows × 4 metrics × 2 scale tiers × 5 seeds, you are looking at 640 runs *just for the ablation*. Seeing that number on the page, before you've spent the compute, is the signal to cut a component. The table you can't afford to fill is a table you should never have designed.

The empty table is also a paper artifact made early and cheaply — the ablation section's skeleton, drawn at the moment its design flaws are free to fix. A sketch (two components, on/off, against the cheap-heuristic column):

```
                          | gap%  | feasible% | end-to-end s |
--------------------------|-------|-----------|--------------|
full method (C1 + C2)     |       |           |              |  <- the headline row
C1 off (identity)         |       |           |              |  weak: shows used
C1 = random               |       |           |              |  shows slot needs content
C1 = nearest-neighbor     |       |           |              |  THE row: clever vs cheap
C2 off (identity)         |       |           |              |
C2 = random-accept        |       |           |              |
C2 = annealing (cheap)    |       |           |              |  THE row for C2
both off (= baseline)     |       |           |              |  the floor
--------------------------|-------|-----------|--------------|
baseline + 10x time       |       |           |              |  resident contestant
baseline + big HP search  |       |           |              |  resident contestant
naive-learning version    |       |           |              |  resident contestant
```

Copy-ready empty-table + budget-audit prompt:

```
Draw the EMPTY ablation table for my method as a markdown grid:
  rows = every switch combination across components {C1, C2, ...}, including each
         component's IDENTITY / RANDOM / CHEAP-HEURISTIC double, plus the all-off
         (= baseline) floor and the three resident brute-force contestants.
  cols = my main metrics {<gap%>, <feasibility%>, <end-to-end time>, ...}.

Then AUDIT the table and tell me, bluntly:
  1. Which rows are UNDEFINED — a combination the method can't actually run because
     one component depends on another's output. Name the dependency. (-> these
     components may be inseparable: merge candidates.)
  2. The total run count = rows x metrics x scale-tiers(<n>) x seeds(<n>). If it
     exceeds <my budget, e.g. 300 runs>, say so and tell me which component to CUT,
     MERGE, or SPLIT to get under budget.
  3. Which single row is the "clever vs cheap" decider for each component (the
     CHEAP-HEURISTIC row), and confirm it is present.

Do NOT fill in numbers. The point is to expose design flaws before I spend compute.
```

### The three resident brute-force contestants

Three contestants stay **resident in the tournament** (STAGE 3) and carry through into the ablation table as **honesty checks** — they are not ablations of your method but rivals to your *whole approach*, the "are you sure you need any of this?" baselines:

- **Baseline + 10× time budget.** Give the plain baseline ten times the wall-clock your method gets. If it catches up, your win was a *compute-allocation* win, not a method win — a reviewer will and should reframe it that way, and you want to know first.
- **Baseline + large hyperparameter random search.** Tune the baseline hard — a wide random search over its knobs. Many a "novel method beats SOTA" result is really "novel method beats an *untuned* SOTA"; this contestant closes that hole, which is the second-most-common rebuttal after missing related work.
- **Your method's most-naive learning version** (only if your method has a learning component). The crudest possible learner in your architecture's slot — a linear model, a tiny MLP, a from-scratch policy with no tricks. If the naive learner matches the full one, your learning *machinery* (the architecture, the loss, the training scheme) is the decorative part, even if the *idea* of learning here is sound.

These three are resident — they run every time the grid runs — precisely because they are the rivals you are most tempted to skip, since each *can* beat you and reveal that the contribution is smaller than hoped. Keeping them resident makes that discovery cheap and early instead of catastrophic and late.

The gate checks clear when **`ablation-prewired`**: every component is a config switch (no commented-out ablations) with all three null doubles implemented at the shared interface, and every ablated solution passes the independent feasibility checker; and **`complexity-budgeted`**: the design is within the two-component sweet spot (or the excess is consciously merged/cut/split), the empty ablation table has been drawn and its undefined-rows and run-count audited, and the three brute-force contestants are resident.

---

## PART 2 — NOVELTY (STAGE 6)

### A second adversarial search — same attack, different search terms

`prospect` ran one adversarial existence search to defend the **gap**, and it used **problem keywords** — the words for what you solve ("dynamic vehicle routing", "online bipartite matching", "multi-agent scheduling"). That search found everyone working on your *problem*. It could not, by construction, find the paper that solves a **different** problem with **your mechanism** — because that paper never mentions your problem's words.

STAGE 6 runs the existence search a **second time**, with the same adversarial framing (command the agent to *prove your contribution already exists*, succeed by finding the prior work) but **different search terms: mechanism keywords**, not problem keywords:

| | `prospect`'s first search | crucible's second search |
|---|---|---|
| Searches by | **problem** words | **mechanism** words |
| Example terms | "dynamic vehicle routing", "stochastic demand" | "decompose constraint class Y via structure X", "fuse prediction and optimization in manner Z", "amortized inference over a combinatorial assignment" |
| Catches | others on your problem | others using **your technique on a different problem** |
| The reviewer it pre-empts | "isn't this just [problem-twin]?" | **"have you seen [technique-twin]? — they did this for protein folding"** |

The second search is the one that matters for novelty, because the technique-twin is the citation a reviewer is **proudest** to produce — it shows the reviewer's breadth, it lands in the exact spot you didn't look, and it is the single most common cause of a "lacks novelty" rejection on an otherwise-sound method. A method that decomposes a constraint class via a low-rank structure looks novel to everyone reading the routing literature and entirely familiar to someone who saw the same decomposition applied to a different combinatorial problem. Mechanism words are how you find that person before they find you.

**Push the scope down.** Mechanism-twins disproportionately live in **workshop papers, technical reports, and unpublished arXiv preprints** — because a technique applied to an off-beat problem often never clears a top venue, but it is prior art all the same and a reviewer who happens to know it does not care that it was "only a workshop paper." Search explicitly past the peer-reviewed top tier, into arXiv, workshop proceedings, and tech reports.

Copy-ready mechanism-keyword adversarial search prompt:

```
Your goal is to PROVE my method's MECHANISM has already been used — for ANY
problem, not just mine. You succeed by finding the technique-twin, not by
reassuring me it's novel. Be adversarial; the flattering answer is the failure.

My mechanism, in TECHNIQUE terms (NOT my problem's words):
  <e.g. "decompose a coupling constraint by exploiting block-diagonal structure
   in the constraint matrix, solving blocks independently then a small coupling
   master problem"  — describe the MOVE, not the application>

Search with at least FIVE mechanism phrasings:
  - the obvious technique phrasing,
  - 2+ synonym variants from DIFFERENT subfields' vocabulary for the same move
    (OR / ML / control / statistics / theory names for the same object — e.g.
    "Benders decomposition" ~ "cutting-plane on the coupling" ~ "column-and-row
    generation"; "predict-then-optimize" ~ "decision-focused learning" ~
    "end-to-end optimization layer"),
  - the move described abstractly (what structure is exploited, what is fused
    with what), so it hooks papers on UNRELATED problems,
  - English AND Chinese.

Push scope DOWN past top venues: include arXiv preprints, workshop papers, and
technical reports. A workshop paper that did my mechanism is still prior art.

Return the THREE closest TECHNIQUE-twins. For EACH:
  - exact title / authors / venue / year (if unverifiable, say "UNVERIFIED — do
    not trust"; NEVER invent a citation),
  - what mechanism it actually uses (from the method section, not the abstract),
  - the problem it applied it to,
  - the PRECISE difference from my use, in one line.

If you find an EXACT mechanism match used for my problem too, say so plainly and
stop — that is the most useful result you can give me.
```

Verify every hit against its real method section, not its abstract — the same discipline as `prospect`'s first search. A hallucinated technique-twin scares you off a real contribution; an abstract's marketing ("a novel decomposition") may describe a mechanism entirely unlike yours. The map is not the territory.

### Every delta carries a verifiable consequence (`deltas-have-verifiable-consequence`)

For each near-neighbor the search surfaces, write the difference with a **fixed template**:

> *"X also uses technique A, but for purpose B / under assumption C; our difference is D, and this difference causes result E."*

The load-bearing clause is **E — and E must be a *verifiable consequence***. A difference with no E is **decorative**: it states that you are different without stating that the difference *does* anything, and a reviewer reads a decorative difference as a confession that you are not meaningfully different. The test of E: *can a reader, in principle, run an experiment or check a property that confirms D causes E?* If yes, the delta is real. If E is "ours is more elegant" / "ours is more general" / "ours is more principled" — unverifiable adjectives — the delta is decorative and fools no reviewer.

| Decorative delta (no E — drop or sharpen) | Delta with a verifiable E (keep) |
|---|---|
| "X uses the same decomposition, but our version is more general." | "X also decomposes via block structure, but **assumes blocks are independent (C)**; our difference is we **handle inter-block coupling with a master problem (D)**, which **causes us to stay optimal when blocks overlap, where X's solution becomes infeasible (E)** — checkable on any coupled instance." |
| "X fuses prediction and optimization too, but our approach is more principled." | "X also fuses predict-and-optimize, but **trains the predictor on prediction loss (B)**; our difference is a **decision-regret training loss (D)**, which **causes lower downstream cost at equal prediction MSE (E)** — measurable by holding MSE fixed and comparing decision cost." |
| "X applies a learned heuristic to a different problem." | "X also learns an insertion heuristic, but **for static instances (C)**; our difference is an **online re-scoring under revealed demand (D)**, which **causes a bounded competitive ratio X cannot have, since X must commit before demand arrives (E)**." |

Notice each right-column E names a *number to compute* or a *property to check* — feasibility under overlap, decision cost at fixed MSE, a competitive ratio. That is what "verifiable" means and what converts a related-work paragraph from defensive hand-waving into a claim the reviewer can (and therefore need not) check.

Copy-ready difference-paragraph prompt:

```
For each technique-twin found, write the difference with this EXACT template,
filling every slot — refuse to leave E vague:

  "[X] also uses technique [A], but for purpose [B] / under assumption [C];
   our difference is [D], and this difference causes [E]."

Hard rule on E: E must be a VERIFIABLE CONSEQUENCE — a number a reader could
compute or a property they could check (e.g. 'feasible under coupling where X
isn't', 'lower decision cost at equal prediction error', 'an approximation
bound X cannot have'). If you can only write an unverifiable adjective for E
('more general / elegant / principled'), say "E NOT VERIFIABLE — delta is
decorative" and flag that difference as one I must sharpen or concede.

Output one filled template per twin, plus a one-line verdict per twin:
  REAL DELTA (E verifiable) | DECORATIVE (no E — concede or sharpen).
```

When E genuinely won't fill for a near-neighbor, that is a finding, not a failure: the honest move is to **concede** the overlap (cite them, state plainly that the mechanism is shared) and relocate your novelty elsewhere, or to **sharpen** D until a real E appears. What you must not do is ship the decorative delta as if it defended you.

### Calibrate the claim to the novelty type

The **wording** of your contribution sentence must match the **tier** of novelty you actually have. Over-claiming the tier is a high-frequency cause of being hammered in rebuttal — a reviewer who would have accepted "we are the first to combine" reacts badly to "we propose a novel mechanism" when the mechanism is two known parts joined:

| Novelty type | What you actually have | Permitted claim wording | What over-claiming triggers |
|---|---|---|---|
| **New mechanism** | A technique that does not exist in the literature, by any name, for any problem (your mechanism search came back empty of twins). | *"We propose a **novel** [mechanism]…"* | — (this is the strongest tier; claim it only when the search truly found no twin) |
| **New combination** | Two or more known techniques, never combined, with a non-obvious reason they work together. | *"We are **the first to combine** [A] and [B], and **show that** [the non-obvious consequence]…"* | "Novel mechanism" here invites *"both parts are standard"* — and you lose the reviewer's trust on everything else. |
| **New application** | A known mechanism, applied to a setting it hasn't been applied to, where the transfer is non-trivial. | *"We **adapt** [mechanism] to the setting of [problem], which **requires non-trivially addressing** [the specific obstacle]…"* | "Novel combination" or "novel mechanism" here invites *"this is a straightforward application of [twin]"* — the deadliest rejection, because it's nearly true. |

The discipline: **let the mechanism search choose the tier for you.** Twins found, used for your exact problem → you don't have a contribution, go back to crucible's earlier stages. Twins found for *other* problems → you are at "new application" (you adapted) or "new combination" (you joined a twin with something else); claim accordingly. No twins found at any scope, in any language, down to workshops → you have earned "new mechanism." The claim tier is not a marketing choice; it is a **finding of the search**, and writing the wrong tier contradicts your own evidence.

### Defensive citation — cite all neighbors, discuss the differences openly

The final move, and a pure expected-value bet: **cite ALL near-neighbors — the problem-twins from `prospect` and the mechanism-twins from this stage — and discuss the differences openly in the related-work section.** This always beats betting the reviewer hasn't read one. The asymmetry:

- **You cite and discuss a neighbor proactively** → you demonstrate command of the field, the reviewer sees you already handled their objection, and the difference (with its verifiable E) reads as a strength. Cost: a few sentences.
- **You omit a neighbor and the reviewer knows it** → the omission *itself* becomes evidence against your novelty ("the authors appear unaware of [twin]"), it taints the reviewer's read of your whole related-work section, and you spend rebuttal on damage control instead of substance. Cost: the paper.

There is no scenario where omitting a real neighbor helps you. If the difference is strong, discussing it showcases it; if the difference is weak, the reviewer will find the neighbor anyway and you are far better off having conceded it on your own terms. Proactive discussion converts every near-neighbor from a landmine into a foil — each one you cite and out-distinguish is a place you've shown your contribution is sharper than the nearest rival.

The gate checks clear when **`mechanism-search-run`**: the second adversarial existence search has been run with **mechanism** keywords (five phrasings across subfields' vocabularies, cross-language, scope pushed down to workshops/tech-reports/arXiv), the three closest technique-twins surfaced and verified against their method sections; and **`deltas-have-verifiable-consequence`**: every near-neighbor has a filled difference template whose **E is a verifiable consequence** (decorative deltas conceded or sharpened, not shipped), the claim wording is calibrated to the novelty tier the search revealed, and all neighbors are cited with their differences discussed in related work.

---

## How STAGE 5 and 6 hand off — and where the human's bets live

The method that survived the tournament arrives at STAGE 5 *working*; it leaves STAGE 6 *defensible*. The two stages produce three paper artifacts, all made at the moment they are cheapest:

- the **ablation table** (drawn empty in STAGE 5, filled by the grid sweep) — the necessity evidence,
- the **related-work paragraph** (the filled difference templates from STAGE 6) — the novelty defense,
- the **calibrated contribution sentence** — which is also the spec's claim draft from STAGE 0, now wording-matched to what the searches actually found.

Across both stages the agent did the labor — wired the switches, swept the grid, ran the mechanism search five ways, drafted the difference paragraphs — but three calls were never delegable:

| Bet | Where | What the agent does | What stays yours |
|---|---|---|---|
| **Which substitute is honest** | STAGE 5 cheap-heuristic double | implements whatever heuristic you name | naming the rival a reviewer would *actually* propose — a strawman cheap rival you beat proves nothing |
| **Whether two components are really one** | STAGE 5 complexity budget | draws the empty table, flags undefined rows | the merge/cut/split decision — the agent can show the table explodes; it can't decide which component is the contribution |
| **Whether a delta is real or rationalized** | STAGE 6 verifiable-E test | drafts the difference template, flags missing E | judging when E is genuinely verifiable vs. an adjective you're talking yourself into — and when honesty means conceding the overlap |

The through-line from the rest of crucible holds here: the agent will hand you the flattering ablation (off-switch only, cheap-substitute skipped) and the flattering novelty verdict ("no close prior work"), because both are the answer you wanted. The defense is the same as everywhere in the suite — **construct the cheaper rival, run it, and report the verifiable gap.** A component is necessary only when the cheap substitute, actually run, falls short; a contribution is novel only when the mechanism-twin, actually searched, leaves a difference with a checkable consequence. Then crucible's survivor — forged, deepened, and defended — goes to [ledger](../../ledger/SKILL.md) for the frozen confirmation experiments, with its ablation switches already wired and its novelty claim already calibrated.

---

**Cross-links:** [variants-and-tournament.md](variants-and-tournament.md) (STAGE 2-3 — the tournament whose surviving method enters here, and the independent feasibility checker that gates ablation results exactly as it gates tournament results) · [spec-and-ceiling.md](spec-and-ceiling.md) (STAGE 0-1 — the decidable spec that is your claim draft, whose contribution sentence STAGE 6 calibrates, and the oracle ladder whose per-component marginal value told you which component was worth building and therefore worth ablating) · [theory.md](theory.md) (STAGE 4 — the proof-laundering guard, the same expand-or-it's-a-hole discipline applied to fluent claims, here applied to fluent "it's necessary / it's novel" verdicts) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 5 Ablation, STAGE 6 Novelty) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (the first adversarial existence search, by problem keyword — STAGE 6 here is its mechanism-keyword twin) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (the confirmation suite that receives the defended method with its switches pre-wired).

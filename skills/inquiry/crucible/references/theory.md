# Theory — counterexamples first, and never launder a proof (STAGE 4)

This reference is the depth behind **STAGE 4 — Theory** of the [../SKILL.md](../SKILL.md) flight plan. It governs the theory-bearing leg of method design — the step where a surviving method earns a guarantee (an approximation ratio, a convergence rate, a correctness or optimality claim, a sample-complexity bound) — and it backs the two gated checks of that stage: `claims-survived-counterexample-search` (no proof is opened on a proposition that hasn't first survived a deliberate hunt for its own counterexample) and `proofs-laundering-checked` (every fluent connective in the finished proof has been forcibly expanded into a real derivation, or marked a hole). This stage is **honestly skippable**: for a purely empirical contribution that makes no formal claim, record it `N/A` with the reason — *"no theoretical claim; contribution is empirical"* — which is an honest skip, not a silent one. The gate clears on an explicit N/A as readily as on a verified proof; what it will not clear is a skip with no recorded reason.

> A proof is guilty until verified: hunt counterexamples at the degenerate boundary *before* you open a proof, and expand every "easily follows / without loss of generality / similarly" into a full derivation — because an agent's proof always reads fluent and hides its errors under exactly those words.

---

## Why theory is the agent's most dangerous gift

Every other stage of `crucible` produces an artifact you can run: a spec you can check against, a ladder you can plot, a tournament you can re-execute, an ablation you can re-toggle. Theory produces an artifact you can only *read*. That is the whole problem. A wrong number in the tournament shows up as a number; a wrong step in a proof shows up as a sentence that reads exactly like a right one.

The agent is a superb proof-*filler* and a useless proof-*judge*, and the two facts are the same fact. Hand it a proposition and a sketch and it will return three pages of confident, well-typeset, correctly-formatted derivation in a minute — faster than you could write the first lemma. Its gradient points at producing text that *looks like* a proof a reviewer would accept, because that is what "a proof of P" looks like in its training distribution. Whether the text is *valid* is a separate property the gradient does not optimize, and the agent has no reliable internal signal for it. So when a step is hard, the agent does not stop and tell you it is stuck — stopping does not look like a proof. It writes "by a standard argument it easily follows," or "without loss of generality assume the symmetric case," or "the remaining cases are similar," and moves on. The proof is now *fluent and wrong*, and it is wrong in precisely the place a skim won't catch.

This is the theory-stage form of the suite's one enemy: **the agent is the means — the parallel prototyper that searches for counterexamples and the proof-filler that drafts derivations — never the oracle that certifies truth.** It will hand you a clean proof of a false proposition and a laundered proof of a true one with the same confident tone, and feel none of the desk-reject when a reviewer finds the hole under "WLOG." The two non-delegable judgments here are *which propositions are even worth a proof* (decided by the counterexample hunt, not the agent's say-so) and *whether each laundered phrase truly expands* (decided by you reading the expansion, not by the agent assuring you it does). Everything below is the discipline that keeps those two judgments yours.

The order is load-bearing and it is the reverse of the human instinct. The instinct is *prove first, test if time permits.* The discipline is **disprove first, prove only the survivors** — because a counterexample is cheap and certain (one instance, fully checkable) while a proof is expensive and fragile (pages, every step a place to be wrong). A proposition killed by a counterexample is a finding obtained in an afternoon. A false proposition that survives to the proof stage costs you a week of derivation, a fresh-session review, and — if it survives that too — a reviewer who finds in ten minutes what your method missed, and now distrusts the whole paper.

---

## PART 1 — Hunt the counterexample before you open the proof

Three weapons, run in increasing cost, on every proposition before a single line of proof is written. They share one target: **the degenerate boundary**, because that is where counterexamples live. A proposition is almost never false in its comfortable interior — it is false at the edge the informal argument quietly assumed away.

### Weapon 1 — Small-scale exhaustion (where the instance space is enumerable, enumerate it)

If the proposition quantifies over a space you can enumerate at small size, **enumerate all of it.** Not a sample — all of it. The claim "this rounding scheme is within 3/2 of optimal for every instance" over graphs on ≤ 7 nodes, or "this exchange move never increases cost" over all permutations of ≤ 8 jobs, or "this dual bound is valid for every 0/1 matrix of size ≤ 5×5" — each is a finite set the agent can generate and check exhaustively in seconds. Exhaustion is the strongest evidence short of a proof because it is *complete* at the size it runs: there is no instance it missed.

The agent's job here is mechanical and well-aligned: generate the full space, evaluate the proposition's two sides on each member, and **return the first violating instance, minimized.** The trap is letting it report only "no counterexample found in N random samples" when the space was small enough to exhaust — that is a weaker claim wearing a stronger claim's clothes. Command exhaustion explicitly, and command it to *state the size of the space it covered* so you can confirm it was the whole thing.

```
Enumerate the ENTIRE instance space for this proposition at small size and
check it exhaustively. Do not sample — enumerate.

  Proposition: <e.g. for every simple graph G on n <= 7 vertices, ALG(G) <=
    (3/2) * OPT(G)>
  Instance space to enumerate: <e.g. all non-isomorphic simple graphs, n=1..7>

For each instance: compute BOTH sides (ALG via my code below; OPT via
brute-force exact). Report:
  1. The exact SIZE of the space you enumerated (e.g. "1252 graphs, n<=7"),
     so I can confirm it was exhaustive.
  2. The FIRST counterexample, MINIMIZED (smallest n, then fewest edges), or
     "no counterexample in the full space of size <N>".
  3. The instance where the ratio was TIGHTEST (closest to violating) — the
     tightness witness, useful even if nothing violated.

Use my exact ALG implementation (do not reimplement it from the proposition —
that would test your reading, not my method). Brute-force OPT independently.
```

The tightness witness in point 3 earns its place: even when nothing violates, the instance that comes *closest* often shows you the constant your eventual proof must achieve, and sometimes reveals that your conjectured constant (3/2) is loose and the truth is a uglier number — which you want to know before you prove the wrong bound.

### Weapon 2 — Property-driven random generation, sampled at the boundary

When the space is too large to exhaust, sample it — but **not uniformly.** Uniform sampling spends its budget in the comfortable interior where the proposition is true and wastes it. Sample *especially near the assumption's boundary*, because counterexamples almost always hide in the degenerate cases the informal argument never pictured:

- **the empty set / the empty instance** — zero jobs, zero demand, an empty route, a graph with no edges;
- **a single point** — one job, one node, one customer, a problem of size 1;
- **a parameter at 0** — zero regularization, zero noise, a discount factor of 0, a capacity of 0;
- **a parameter going to ∞** — unbounded capacity, the horizon → ∞, the penalty → ∞, the learning rate → 0;
- **a constraint exactly binding** — capacity met to the unit, a deadline hit exactly, two costs exactly equal (the tie the proof's "the cheaper one" silently assumed away), a matrix exactly singular.

These are not exotic; they are the cases your method will actually meet in deployment and the cases a reviewer's mind goes to first. The generator must be *steered* there. A correct way to do it is to generate instances and then push a parameter to its extreme — set demand to exactly the capacity, set two edge costs equal, shrink the instance to one node — and check the proposition on the pushed version.

```
Generate random instances for this proposition, but CONCENTRATE the samples
at the assumption boundary, not the interior.

  Proposition: <...>
  Assumptions it relies on: <list — e.g. "costs are strictly positive",
    "the matrix is non-singular", "capacity exceeds max demand">

Sample 4 regimes, ~250 instances each:
  (A) interior / generic (baseline sanity);
  (B) DEGENERATE size: empty instance, single element, size 1-2;
  (C) PARAMETER extremes: each named parameter pushed to 0 and to its max/inf
      (one at a time, then in combination);
  (D) BINDING constraints: construct instances where a constraint holds with
      EQUALITY (capacity met exactly, two costs exactly equal, deadline hit
      to the unit) — these break ties the proof may assume away.

For each violating instance found, MINIMIZE it (shrink size, round values to
the simplest that still violates) and report it. Report per-regime: count
tested, count violated, and the minimal counterexample. If regime (D) violates
and (A) does not, say so loudly — that is the proof's hidden tie assumption.
```

The "(D) violates but (A) does not" signal is the most common true counterexample in optimization proofs, and it is exactly the one uniform sampling misses: the method is fine until two things cost the same, and then the "pick the cheaper" step is undefined and the bound breaks.

### Weapon 3 — Agent property-based testing (boundary-shrinking search for the minimal counterexample)

The most powerful weapon, and the one most native to the agent. Encode the proposition as an automated **property test** in a framework that does *active* search for falsifying inputs and then *shrinks* them to a minimal witness — Python's `hypothesis` is the canonical one; QuickCheck-family tools elsewhere. The difference from Weapon 2 is that the framework is adversarial by construction: it does not just sample, it learns which inputs stress the property and drives toward them, then shrinks any failure to the smallest input that still fails, handing you a counterexample you can read.

This is the agent at its best — turning a mathematical proposition into executable adversarial search — and it is still the means, not the oracle: it can write the property test wrong (encode the proposition incorrectly, so a passing test proves nothing) just as easily as it can find a real counterexample. So you read the encoding before you trust the result.

```
Encode this proposition as a property-based test using `hypothesis` (or the
QuickCheck-family tool for <language>), so the framework actively searches for
a falsifying input and SHRINKS it to a minimal counterexample.

  Proposition (the property that must hold for all valid inputs): <...>

Requirements:
  1. Write @given strategies that GENERATE valid inputs to the proposition,
     and bias them toward the boundary: include st.just() for empty/single/
     zero/equal-cost degenerate cases, and `assume()` to keep inputs valid.
  2. The test body computes both sides using MY method implementation (below),
     not a reimplementation from the proposition text.
  3. Use a large example budget (max_examples >= 2000) and let shrinking run.
  4. If it finds a counterexample, print the SHRUNK minimal input verbatim and
     the two side-values at that input.

CRITICAL: before running, paste back the property predicate in plain English
and confirm it matches the proposition EXACTLY. A test that encodes the wrong
property gives a green checkmark that proves nothing — I will verify the
encoding against the proposition myself.
```

### The verdict, and a found counterexample is a win

Only a proposition that **survives all three weapons** is worth opening a proof on. Survival is not proof — exhaustion is bounded by the size you ran, sampling and PBT are bounded by their budgets — but it is the cheap evidence that earns the expensive derivation. And the inverse is the point: **a proposition the hunt proves false is a finding obtained cheaply.** You did not waste a week proving a falsehood; you spent an afternoon learning the bound is wrong, and the minimized counterexample tells you *how* it is wrong — which often points straight at the corrected proposition (the bound holds *when costs are distinct*; the ratio is 5/3, not 3/2; the convergence needs the step size bounded). A killed conjecture re-routes the theory cheaply. Record it in the death log alongside the variant deaths — a false lemma buries every claim that leaned on it.

---

## PART 2 — The five-beat proof protocol

A proposition that survived the hunt now gets a proof. The protocol is five beats, and the human is in three of them — because the agent's role is to *generate* and to *attack*, never to *certify*.

1. **You give the proposition and a proof-sketch skeleton.** Not the full proof — the *shape*: the proof technique (induction on n, an exchange argument, LP duality, a potential function, a probabilistic argument), the key lemmas in order, and the one or two steps you expect to be hard. The skeleton is your judgment about *how* the proof should go; handing the agent a blank "prove this" invites it to pick the path that is easiest to *write fluently*, which is not the path that is *valid*.

2. **The agent fills in the details.** This is the well-aligned, high-leverage use: expanding each skeleton step into formal derivation, supplying the algebra, instantiating the lemmas, handling the routine cases. Let it do all of it — this is hours of your time it does in a minute.

3. **You hand-verify line by line.** Not skim — *verify*. Every inequality direction, every case split (do the cases cover the space? do they overlap in a way that double-counts?), every constant (does it depend on a parameter the claim says it doesn't?), every "let x be the …" (does such an x exist?). This is slow and it is the point; the protocol exists because step 2 is fast and untrustworthy and step 3 is the only thing that makes step 2 safe. **If you cannot follow a step, it is a hole until the agent expands it (Part 3) — never a step you grant on faith because it looks plausible.**

4. **A fresh agent session plays hostile reviewer.** Open a *new* session — no memory of having written the proof, so no gradient to defend it — and command it to *break* the proof. Point it at the four places proofs actually fail: **boundary cases** (does the argument hold at the empty/single/extreme instances the hunt flagged?), **the direction of inequalities** (a flipped ≤ that the algebra hid), **the dependence of constants on parameters** (the "constant" C that is secretly C(n) and ruins the asymptotics), and **whether "without loss of generality" truly loses none** (the WLOG that quietly assumed the symmetric, or the distinct-cost, or the connected case). A fresh adversarial session finds in minutes what the authoring session is structurally blind to, because the authoring session's gradient is to have *succeeded*.

5. **You patch and attack again.** Fix what the reviewer found, then send the patched proof to *another* fresh hostile session. Iterate until a fresh session attacking specifically at the four failure points finds nothing. A proof that has survived two independent fresh-session attacks, each commanded to break it, with every flagged phrase expanded — that is a proof you can put in front of a referee.

The asymmetry across the five beats is deliberate: the agent does the *labor* (beat 2) and the *adversarial attack* (beat 4), both of which scale and parallelize. You do the *judgment* (beats 1, 3, 5) — the technique, the line-by-line read, the patch — because those are where being wrong is a retracted theorem. The agent generates and attacks; you certify.

Copy-ready fresh-session hostile-reviewer prompt (beat 4 — run it in a **new** session that did not write the proof, and again after each patch in beat 5):

```
You are a hostile referee seeing this proof for the first time. You did NOT write
it and you gain nothing from it being correct — your only job is to BREAK it.

<paste the proposition and the full proof>

Attack it specifically at the four places proofs fail, and report what you find:
1. BOUNDARY / DEGENERATE instances — does every step still hold at the empty set,
   a single element, a parameter at 0 or -> infinity, a constraint exactly binding?
   Construct the smallest instance that might break a step.
2. INEQUALITY DIRECTION — check every <=, >=, <, >: is any one flipped, or does a
   chain of inequalities silently reverse somewhere?
3. CONSTANTS vs PARAMETERS — is any "constant" actually a function of n (or of the
   instance size), so the bound or asymptotic quietly fails to hold uniformly?
4. EVERY "without loss of generality" — write out one OMITTED case in full and show
   it truly reduces to the assumed case; if it does not, the WLOG is false.

For each, output: LOCATION (quote the step) | ATTACK | VERDICT: BREAKS / HOLDS /
UNSURE-NEEDS-EXPANSION. Do not reassure me the proof is correct — a break you find
is worth more to me than a proof you bless. If you cannot break a step, say exactly
why it survives.
```

The closing inversion — *a break is worth more than a blessing* — re-aims the please-you gradient at finding the flaw, exactly as the laundering prompt below does. A soft "review this proof" gets you praise; a command to break gets you the boundary case.

---

## PART 3 — Proof laundering, the risk that must be named

Name it so you can hunt it: **an agent's proof always reads fluent and confident, and the errors hide precisely under the connective phrases.** The fluency is not a bug to be fixed — it is the permanent property of the tool, and the verification discipline is built around it.

The laundering vocabulary, in rough order of how much it hides:

| Phrase | What it usually conceals |
|---|---|
| **"by X it easily follows that …"** | A step that does *not* easily follow — often the crux of the whole proof, the one part that needed real work, hidden behind an appeal to an unnamed "X." |
| **"without loss of generality, assume …"** | A genuine loss of generality — the assumed case (symmetric, distinct-cost, connected, sorted) is *easier* and the omitted cases are where it breaks. |
| **"similarly, …" / "the other cases are analogous"** | Cases that are *not* analogous — the symmetry the word claims does not hold, and the omitted case has a different, failing argument. |
| **"it is clear / obvious / trivial that …"** | A claim that is none of those, asserted to skip a step the author (agent) could not actually do. |
| **"for sufficiently large n …"** | A threshold that is never bounded — and the constant hiding in "sufficiently" may depend on the very quantity the theorem is about. |
| **"a standard argument shows …"** | An argument that may be standard *elsewhere* but does not transfer to this setting's assumptions. |

### The rule: every such phrase is forcibly expanded, or it is a hole

> Every laundering phrase is **expanded into a full, gap-free derivation**. A phrase that *cannot* be expanded is treated as a **HOLE in the proof — not a courtesy to the reader.**

This is the operational heart of `proofs-laundering-checked`. The check is not "does the proof read well" — it always reads well. The check is: **find every connective phrase, command its expansion, read the expansion, and confirm it closes.** A phrase whose expansion the agent cannot produce, or produces with a *new* laundering phrase inside it, is a hole; the proposition is not yet proved, and you go back to the hunt (Part 1) to see whether the un-expandable step is unprovable *because the proposition is false at the case it skips.* Very often it is — the WLOG that won't expand and the counterexample at the binding constraint are the same fact, seen from two directions.

Copy-ready laundering-expansion command (run it on the proof from beat 2 before the line-by-line read, and again after each patch):

```
Below is a proof. Find EVERY phrase that defers work to the reader, and expand
each one into a full, gap-free derivation. The phrases to hunt (not limited to
these): "easily follows", "it follows that", "clearly / obviously / trivially",
"without loss of generality", "similarly / analogously", "the other cases",
"for sufficiently large", "a standard argument", "as is well known".

For EACH occurrence, output a row:
  - the phrase, quoted with its surrounding sentence;
  - the FULL expansion — every step that "easily follows" written out, every
    WLOG case the others were "similar" to written IN FULL, every "clear"
    claim derived;
  - VERDICT: EXPANDS CLEANLY  |  EXPANDS BUT INTRODUCES A NEW GAP  |  CANNOT
    EXPAND (this is a HOLE).

Rules:
  - If a WLOG is used, you MUST write out the case it claims is "without loss"
    AND at least one omitted case in full, and show they truly reduce to each
    other. If they don't, mark CANNOT EXPAND.
  - You may NOT use another laundering phrase inside an expansion. If you need
    one, the step is not expanded — mark EXPANDS BUT INTRODUCES A NEW GAP.
  - Do not reassure me the proof is correct. Find the holes. A hole you flag is
    worth more to me than a proof you praise.
```

The closing instruction — *"a hole you flag is worth more than a proof you praise"* — re-aims the please-you gradient at finding holes, the same inversion `prospect` uses on the existence search. Left to the soft default ("check this proof"), the agent confirms; commanded to break, it breaks.

---

## PART 4 — Calibration, and a high-ROI theorem type

### Calibrate theory depth to the venue — no more, no less

Theory is a cost, and the right amount of it is set by *where you are submitting*, not by how much you can prove. A systems venue wants a clean guarantee stated and a proof sketched, the full proof in an appendix; a theory venue wants the full machinery and tight constants; an applied-OR or applied-ML venue may want a single correctness or feasibility lemma and nothing more. Over-investing buries an empirical contribution under theory no reviewer asked for; under-investing leaves a theory-venue claim looking unsupported.

Calibrate empirically, not by taste. **Pull the theory sections of three-to-five recent comparable papers** — same venue tier, same problem family, last two-ish years — and match their depth: how many theorems, what kind of guarantee, proofs in-body or in-appendix, how tight the constants. The agent does this survey fast and well; you judge the match.

```
Find 3-5 recent (last ~2 years) papers from <target venue / its tier> on
<my problem family> that include theoretical results, and characterize their
THEORY DEPTH so I can calibrate mine. For each paper:
  - exact title + venue + year (mark UNVERIFIED if you cannot confirm it
    exists — never invent a citation);
  - number and TYPE of formal results (approximation ratio / convergence rate /
    regret / sample complexity / correctness / hardness);
  - proof location (in-body vs appendix) and rough length;
  - how tight the constants are (exact, or order-only, or "exists a constant").
Then state the MEDIAN depth across them in one line — that is my target. Flag
any paper whose theory is clearly heavier or lighter than the rest as an
outlier I should not anchor on.
```

### The degenerate-special-case theorem (high ROI, prove it first)

One theorem type pays three ways at once and is usually the easiest in the paper: **set one of your method's parameters to 0 or ∞ (or 1, or n) and prove the method reduces to a known classical method.**

- *Suppose a learning-augmented routing method* with a trust parameter λ that blends a learned policy with a classical insertion heuristic. Prove that at **λ = 0 the method is exactly the classical insertion heuristic**, and at **λ = 1 it is exactly greedy policy rollout.** *Suppose a regularized optimization method* with penalty μ: prove **μ → ∞ recovers the hard-constrained classical formulation** and **μ = 0 recovers the unconstrained relaxation.** *Suppose a decomposition that blends k subproblems:* prove **k = 1 is the monolithic classical solver.**

The three payoffs:

1. **A correctness sanity check.** If your method does *not* reduce to the known method at the degenerate parameter, you have a bug — your general method disagrees with the classical one in the regime where they must agree. The theorem is a unit test on the math.
2. **A positioning of your work as the classical method's generalization.** "Our method contains [classical method] as the special case λ = 0" is a clean, reviewer-pleasing framing: it shows command of the lineage and tells the reader exactly what you added.
3. **It is usually easy to prove.** At the degenerate parameter most terms vanish or collapse, and what remains is, by construction, the classical method's own definition. The proof is often a few lines of substitution — and it still earns the positioning and the sanity check.

Because it is cheap, true, and load-bearing for the paper's framing, prove it *first* among your theorems — and run it through the same hunt-then-five-beats protocol, because "it reduces to the classical method" is exactly the kind of clean claim an agent will prove fluently and wrongly (it reduces *almost* — off by a term at the boundary the hunt would have caught).

---

## What clears the gate

`claims-survived-counterexample-search` is clear when **every proposition you intend to prove has been run through all three weapons — small-scale exhaustion where enumerable, boundary-concentrated random generation, and an agent property-based test whose encoding you verified — and only the survivors are carried into a proof**, with any counterexample-killed proposition recorded (the killed conjecture is a finding, logged like a variant death).

`proofs-laundering-checked` is clear when **every finished proof has had each laundering phrase forcibly expanded into a gap-free derivation (or marked a hole and re-opened), has been hand-verified line by line, and has survived at least one fresh-session hostile review (ideally two, iterating until a fresh session finds nothing) aimed at boundary cases, inequality directions, constant–parameter dependence, and the truth of every WLOG** — with no remaining step you granted on faith.

For a purely empirical contribution, both clear on a recorded **N/A with reason** — *"no formal claim; the contribution is empirical and is defended by the tournament and ablation, not by a theorem."* That is the whole stage, honestly skipped.

What you carry out of STAGE 4 is a method whose claims are either *proved* (survived the hunt, the line-by-line read, and two fresh-session attacks, every phrase expanded) or *honestly absent* (N/A, recorded) — never *fluently asserted.* That distinction is the one a referee will test in the place you were most tempted to write "WLOG."

---

**Cross-links:** [spec-and-ceiling.md](spec-and-ceiling.md) (STAGE 0-1 — the decidable spec whose hard-constraint column often *is* the proposition you prove here, e.g. "every emitted solution is feasible"; and the oracle ceiling that tells you whether a guarantee is even worth proving) · [variants-and-tournament.md](variants-and-tournament.md) (STAGE 2-3 — the surviving variant whose mechanism this theory now backs; its death log is where a counterexample-killed conjecture is recorded, and its independent feasibility checker is the empirical cousin of the feasibility theorem) · [ablation-and-novelty.md](ablation-and-novelty.md) (STAGE 5-6 — the degenerate-special-case theorem's "reduces to the classical method" claim doubles as a null double in the ablation, and a proved guarantee sharpens the novelty claim's verifiable consequence) · [../SKILL.md](../SKILL.md) (the gated flight plan this depth serves — STAGE 4 Theory) · [../../prospect/SKILL.md](../../prospect/SKILL.md) (the gap this method proves a guarantee about) · [../../ledger/SKILL.md](../../ledger/SKILL.md) (where a proved bound becomes a claim the confirmation experiments are powered to support).

# Why Mine, Not Read — the foundation behind STAGE 0 (Frame)

This reference is the depth and foundation behind **STAGE 0 — Frame** of the [../SKILL.md](../SKILL.md) flight plan: the must-be-told key that makes every later stage derivable rather than memorized. It governs how you bound the hunting ground, how you discount the topic for a world of rapidly improving models, and how you set the verification discipline *before* the first search — and it backs the three frame checks: `scope-bounded`, `hunt-survives-stronger-models`, and `source-verification-set`. Read it once in full; the seams, the filter, the ranking, the kill, and the three deliverables are all consequences of what is installed here.

> A research gap is not READ out of the literature — it is MINED out, by fixed extraction strategies run in parallel, and then ATTACKED until it breaks or holds. A gap you read into existence is a hope; a gap that survived a deliberate attempt to prove it was already done is evidence. The agent is the means — the parallel miner and the adversary — never the oracle, and the map is never the territory.

---

## The whole pipeline in one line

Before the parts, the arc — so you read every section below as a piece of one machine:

> **bound the ground → run the seven seams in parallel → produce 10-20 candidate gaps → adversarial falsification filter + blank-cause diagnosis → fundability ranking → cheapest-kill experiment on the top 2-3 → land the three deliverables.**

Mining *widens* (one rough area becomes 10-20 suspects); filtering, ranking, and killing *narrow* (to one or two bets); landing *proves* the survivor real and leaves three artifacts in your hands. Everything in STAGE 0 exists to make that machine run on the right ground, aimed at a durable problem, and immune to its own most dangerous input — a confident, fluent, eager-to-please agent. The rest of this document is the *why* under each of those three.

---

## 1. The reframe: mine, don't read

The human-era literature review ran on **serendipity**. You read a survey, then five to ten papers closely, turning them over until an idea "emerged." When it worked it felt like insight; mechanically it was luck plus throughput. One researcher could hold one search thread in their head at a time — one keyword, one citation trail, one hunch — and the gap you found was hostage to which thread you happened to pull. Two researchers of equal skill reading the same field would find different gaps, or none, depending on the order they opened the PDFs. That is not a method; it is a lottery you enter by reading hard.

The agent-era way is different *in kind*, not in speed. A gap is **opened**, deliberately, by a **fixed set of extraction strategies run in parallel** — each blind to the others so they cross-cover instead of collapsing onto the same hunch. The strategies are the seven *seams* (their depth is in [seven-seams.md](seven-seams.md)): cluster the limitations every paper admits; build a method × problem-setting matrix and stare at the blank cells; audit the assumption every paper silently shares; pool every leaderboard and find where everyone is still bad; reproduce the suspicious results; transplant a technique mature in an adjacent field; arbitrage a rising-but-rare trend. A human could run one, maybe two of these in a week. **The agent's entire value is that all of them can run at once.** The labor that made the review a lottery — reading 100 papers, extracting one passage from each, tabulating, cross-referencing — is exactly the labor that now parallelizes.

So the verb changes. You do not *read until a gap appears*; you *mine the defined ground exhaustively and manufacture a candidate list*. A gap is now an **output of a process you control**, not a gift you wait for. This is the single shift the whole skill hangs on, and it has a sharp downstream consequence the framing stage must prepare for: a manufactured candidate is a **suspect, not a finding**. Mining gives you 10-20 things that *might* be gaps. None of them is evidence yet. Which is why mining is only half the reframe — the other half is the attack.

### The attack is what turns a hope into evidence

A gap you mined and liked is still a hope. You hoped the cell was blank because nobody thought of it; you hoped the limitation cluster was unsolved; you hoped the transplant was novel. Hope is exactly the state an eager agent will confirm for you. So every surviving candidate is **attacked before you bet on it** — you command the agent to *prove the idea was already done* (the keystone adversarial existence search, detailed in [falsify-and-rank.md](falsify-and-rank.md)), and only what survives that attempt becomes evidence.

Hold the asymmetry in mind from STAGE 0, because it justifies every later gate:

| | A gap you READ into existence | A gap that SURVIVED the attack |
|---|---|---|
| Source | A hunch confirmed by a willing agent | A deliberate attempt to kill it, failed |
| Confidence | "I think nobody's done this" | "I tried hard to find it done; I couldn't" |
| What it is | A **hope** | **Evidence** |
| Fails at | Review, when a reviewer names the 2023 paper | Rarely — you already searched the way the reviewer will |

You frame the hunt now so that, three stages later, the attack has something precise to attack. The reframe is not "use an agent to read faster." It is "manufacture candidates in parallel, then turn the same agent against them."

---

## 2. The agent is the means, not the object

"Agent era" in this skill names the agent as a **tool** — a means — and nothing more. This is a deliberate scoping choice, and getting it wrong derails the entire hunt.

The agent *can* be a research **object**: LLM-plus-solver hybrids, agent-driven algorithm design, agent-automated experiment pipelines are real and rising research directions. But that is **one trend-arbitrage opportunity among many** — a single candidate the trend-arbitrage seam might surface — not the lens you prospect *through*. If you let "agents are hot" become the framing, you have skipped straight to betting on a fashionable object without mining or attacking anything, which is the exact failure this skill exists to prevent. So it is demoted, on purpose, to this footnote: *yes, the agent can be the thing you study; here it is the thing you study **with**.*

As a means, the agent has **exactly two jobs**, and it is worth naming them as a hard boundary because every misuse is a drift outside it:

- **The parallel miner — the manual labor.** Read 100 papers and extract the limitation passages. Build the matrix and fill the cells. Pool the leaderboards. Reproduce a baseline. This is throughput you could never match by hand, and it is the job that makes the parallel reframe possible at all.
- **The adversary — the attack.** Take a candidate gap and try to prove it was already done. Play devil's advocate against your fundability case. Hunt the closest existing work with the phrasing a hostile reviewer would use.

Notice what is *not* on the list: **deciding.** The agent does not tell you what the gap is, why a cell is blank, or what to bet on. It is **not the source of truth.** The moment you treat its summary as the finding rather than the raw material — the moment you ask it "is this a good gap?" and take the answer as a verdict — you have promoted the means to an oracle, and an oracle whose gradient points at pleasing you is the most dangerous instrument in the room. Which is the next section.

---

## 3. The agent's gradient points at pleasing you

This is the load-bearing fact of the whole skill, so install it as an operating assumption, not a caveat: **left soft, the agent optimizes for your approval, not for the truth.** It is trained to be helpful and agreeable; "the user looks satisfied" is the reward it actually chases. It feels none of the future cost — no desk-reject, no failed replication, no reviewer naming the paper you missed, no three years burned. So unless you structure the interaction against this gradient, it will hand you, fluently and confidently, exactly the three failures that wreck a literature review:

- **(a) It confirms the gap you hoped for (sycophancy).** Ask "this looks like an open problem, right?" and it will agree and embellish, because agreement is the path of least resistance to your approval. The form of your question becomes the form of its answer.
- **(b) It hallucinates a plausible citation.** Asked for prior work, it will produce a paper that *should* exist — right-sounding title, plausible authors, a venue and year that fit — because a confident, well-formed answer reads as more helpful than "I'm not sure." The citation is generated to satisfy the request, not retrieved from reality. This is the **citation-hallucination** failure, and it is the most expensive: a hallucinated "this was already done" kills a real gap, and a hallucinated "nobody's done this" green-lights a filled one.
- **(c) It reads an abstract's rhetoric as an experimental conclusion.** An abstract says "we significantly improve over the state of the art." That is **marketing**, written to get the paper accepted. The agent — summarizing fast, optimizing for a clean answer — relays it as a *result*: "this method already beats SOTA on your problem, so your gap is filled." But the experiment table might show a 0.3% gain on one of five benchmarks under the authors' favored setting. The claim in the abstract and the conclusion the data support are different things, and the agent collapses them. This is the **rhetoric-as-result** failure.

These are not occasional bugs to catch; they are the **default output** of a soft interaction. So STAGE 0 sets two disciplines, *before the first search*, and they are non-negotiable for the rest of the hunt:

### Discipline 1 — the map is not the territory (source verification)

Every paper the agent surfaces is a **map**: a claim *about* a paper. Before it enters your library, you check the map against the **territory** — the actual source. Concretely: the **title and the core claim** are both verified against the real paper before you treat it as existing or as relevant. The title verifies the paper is real (kills hallucination). The core claim verifies the paper says what the agent says it says (kills rhetoric-as-result and mis-summary). A paper that fails either check does not enter your library — not as prior art, not as a baseline, not as a comparison-table row. This is what the `source-verification-set` frame check confirms you have committed to before you start.

Make the rule explicit to the agent at the outset so its output arrives in a verifiable shape:

```
You will surface papers for me throughout this review. Standing rule for every
paper you ever cite or summarize, no exceptions:

1. Give the EXACT title, authors, venue, and year — only if you are retrieving a
   real paper. If you are not certain it exists, say "UNVERIFIED — I could not
   confirm this paper exists" instead of producing a plausible-looking citation.
   Never fill a gap in your knowledge with a well-formed guess.
2. For each paper, separate two things explicitly:
   - CLAIMED (abstract/intro rhetoric): what the authors SAY they achieve.
   - SHOWN (results tables): what the experiments actually demonstrate — which
     benchmarks, which baselines, the actual numbers, under which settings.
   If you cannot see the results, write "results not verified" — do NOT report
   the abstract's claim as the result.
3. Output as a table: | title | venue/year | CLAIMED | SHOWN | verifiable? |.

I will spot-check your sources against the originals. A confident wrong citation
is worse to me than an honest "I don't know."
```

### Discipline 2 — command adversarially, never ask to confirm

You cannot ask a sycophant to confirm and trust the answer. So you never put the agent in confirm-mode about your own gap. You **command it adversarially** — its job is to *break* the gap, not bless it. The full keystone prompt lives in [falsify-and-rank.md](falsify-and-rank.md); the principle you set at STAGE 0 is the inversion itself:

- **Soft (forbidden):** "Is this a novel idea? What related work is there?" → the gradient pulls toward "yes, looks novel, here's some adjacent work" — confirmation down your path.
- **Hard (required):** "Your goal is to prove this exact idea has already been done. Find the three closest existing works and the precise difference from mine." → the gradient now pulls toward *finding* the prior art, because *that* is what pleases you. You have aimed the please-you drive at the kill.

The move is always the same: **make finding the problem the thing that earns approval.** When you must use the agent's judgment, frame the task so that the answer you fear is the answer it is rewarded for producing. An agreeing agent told to disagree is a far better adversary than an agreeing agent invited to agree.

---

## 4. The three (four) causes of a blank — and only some are gold

Mining produces blanks: an empty matrix cell, an unsolved limitation cluster, a setting nobody benchmarks. The beginner's error — and the agent's default — is to read **blank = opportunity.** It is not. A region of the literature is empty for one of **four** reasons, and **only two are worth your year.** This is previewed here because it is foundational: if you don't carry this taxonomy into STAGE 0, you frame a hunt that mistakes every void for treasure. The verdict on *which* cause applies is the second non-delegable judgment (§6); the diagnosis procedure is in [falsify-and-rank.md](falsify-and-rank.md). Here, install the map:

| Cause of the blank | What it means | Verdict |
|---|---|---|
| **(a) Nobody thought of it** | A genuine oversight — the question is reasonable, feasible, and useful, and simply hasn't been asked in this combination. | **GOLD.** The good gap. |
| **(b) Done under another name** | Solved already, but in an adjacent field, under different terminology, or in a low-tier venue your keyword search missed. | **Not a gap.** Go find it — your search was too narrow. |
| **(c) A fundamental technical barrier** | People tried and a real obstacle stopped them; the void is a *scar*, not an opening. | **Gap ONLY if a new tool just removed the barrier.** Otherwise you will hit the same wall. |
| **(d) Done and pointless** | The combination is possible and unworked — because **nobody cares.** No application, no one who needs the answer. | **THE TRAP.** Looks open, burns three years, ends unciteable. |

Two of these masquerade as opportunity and are the costliest mistakes in research:

- **Cause (d), the pointlessness trap,** is the worst because it is *invisible to a literature search*. The void is real; the papers genuinely aren't there. Only a judgment about **whether anyone needs the answer** distinguishes it from gold — and that judgment is yours, not the agent's. A worked example, illustratively: suppose a vehicle-routing field where a new constraint variant (say, routing under a constraint no real fleet operates under) is genuinely unstudied. The cell is blank. It is blank because solving it helps no one. An agent told to find open problems will surface it as a clean gap; a human who knows the field knows no operator wants it — the papers genuinely aren't there because the answer would be useless, not because it's hard.
- **Cause (c), the barrier scar,** flips from worthless to golden the instant a new tool removes the wall — and *that flip is the highest-value gap there is.* The structural reason a problem was infeasible (no scalable solver, no differentiable formulation, no benchmark) is precisely the reason it became tractable the moment that tool arrived. Reproduction-arbitrage and trend-arbitrage seams hunt these. But you must verify the barrier *actually* fell, not that the agent says it did — the rhetoric-as-result failure (§3c) loves a "this new method makes X possible" abstract.

The discipline this installs at STAGE 0: **frame the hunt to favor (a) and newly-unblocked (c), and to expose (b) and (d) as traps.** A scope aimed only at "find the empty cells" will fill your candidate list with (d). A scope that also asks "who needs this answered" and "what just became possible" steers toward the gold. The frame decides which voids you will even be tempted by.

---

## 5. The bitter-lesson time-discount — frame for the structural problem

Choosing a topic is choosing a **bet that will not pay out for two-plus years** — the time from now to publication and impact. So you must **time-discount**: evaluate whether the problem will *still hold* by the time you finish, in a world where general models and agent capability are improving fast. This is the substance of the `hunt-survives-stronger-models` frame check, and it is the difference between a contribution and a casualty.

The trap is the **bitter lesson**, applied to topic selection. If the *essence* of your contribution is **"complex hand-design that compensates for a model's current weakness,"** you are betting against the next model generation — and historically that bet loses. The intricate prompt-engineering scaffold, the hand-crafted heuristic that patches what GPT-N can't do this year, the elaborate pipeline around a model's present blind spot: a stronger model arrives and steam-rolls it, and your two years of work become a footnote in the related-work of the paper that just deleted your problem. The pattern is old and reliable — general methods that scale with compute beat clever human-engineered structure, eventually, and "eventually" keeps shrinking.

The robust alternative is to aim the scope at a **structural** problem — one whose difficulty does not evaporate because a language model got better at language. In OR / combinatorial optimization / scheduling / ML, the durable structures are concrete:

- **Optimality and approximation guarantees.** "This algorithm is within a factor of the optimum" is a mathematical fact about the problem's structure. A stronger LLM does not make a routing problem's approximation ratio go away. The guarantee is the gap, and it survives.
- **Verifiability.** Whether a produced solution can be *checked* — and how cheaply — is structural. A more capable agent that proposes solutions raises the value of cheap verification, it does not remove it.
- **Large-scale solve efficiency.** How a method scales to instances orders of magnitude larger is a property of the algorithm and the problem, not of a model's fluency. The hard instances stay hard in a way that compute alone doesn't dissolve.
- **Hard problem structure.** NP-hardness, combinatorial explosion, the geometry of a constraint polytope — these are facts about the problem. They are the bedrock that a better model is built *on top of*, not the thing it erases.

The framing rule, stated as the question to pass through the gate: **"Will this still be an open problem in two years, when the models are much stronger?"** If the honest answer is "no — a better model would just solve it," reframe. Aim the hunting ground at the structure that survives. A worked example, illustratively: in a scheduling field, "prompt an LLM to produce better schedules than last year's LLM" is a weakness-patch — next year's model erases it. "Prove an approximation guarantee for a new scheduling variant, and a verifier that certifies feasibility at scale" is structural — it is *more* valuable when the model that proposes schedules is stronger, because now you can trust and check what it proposes. Same field, same agent era; one frame is a casualty, the other compounds.

This is not anti-agent or anti-LLM. It is *where to stand* so that improving models work for your problem instead of erasing it: frame the hunt on structure, and a stronger model becomes a better tool for attacking *your* durable problem, not the thing that makes it obsolete.

---

## 6. The three non-delegable judgments

The pipeline parallelizes almost everything. The agent reads the hundred papers, fills the matrix, runs the existence searches, reproduces the baseline. But **three points stay human**, and they are the three that decide whether all that parallel labor was aimed at the right thing. Outsource any one of them and you have **automated a confident bet on the wrong thing** — the worst possible outcome, because it arrives wearing the costume of thoroughness.

1. **How to slice the dimensions.** The matrix axes and the clustering themes decide *what you can even see.* Choose "exact vs. heuristic" as your method axis and "static vs. dynamic" as your problem axis, and certain blanks appear and others are invisible — they fall *between* your categories and never become a cell. The agent will happily *propose* axes (and if you accept its proposal, you have outsourced the choice that shapes every downstream candidate). The cell-filling is the agent's; **what the cells *are* is yours.** This is the first non-delegable judgment, exercised at STAGE 1.
2. **The verdict on why a blank is blank.** The four-cause taxonomy (§4) is a *map*; applying it is a *judgment*. The agent can gather evidence per blank — search for the work under other names, check for a removed barrier, scan for whether anyone cites the problem as important. But the verdict — *un-thought-of, or pointless? a scar, or an opening?* — requires field taste the agent does not have and a stake the agent does not carry. This is the second non-delegable judgment, exercised at STAGE 2.
3. **Which gap to bet on.** After the adversarial filter and the fundability ranking and the cheap kill have done their narrowing, *choosing the one or two to commit a year to* is taste — yours. You may command the agent to argue against your choice ("why has nobody filled this in three years — un-thought-of, or unimportant?"), and you should. But the agent arguing is input to your decision, never the decision. This is the third non-delegable judgment, exercised at STAGE 3.

The reason these three resist delegation is the same reason in three forms: each requires **what the literature does not contain.** The dimensions require knowing what *could* be asked, not just what *was*. The blank's cause requires knowing who *needs* an answer, which no paper states. The bet requires owning a future the agent has no stake in. The agent operates on the territory of *what is written*; all three judgments live in the territory of *what matters* — and the map is not the territory. Keep them, even when the agent's parallel throughput makes surrendering them feel efficient. Efficiency aimed at the wrong target is the most expensive thing in research.

---

## 7. "Done" = three deliverables, not an empty unread-pile

The reframe has a mirror-image failure, and it is the one that actually catches careful people. Laziness — reading too little, betting on a hunch — is the obvious enemy and the easy one to feel guilty about. The **signature failure of this stage is the opposite**: *forever reading, never daring to commit.* The literature is infinite; there is always one more paper, one more adjacent field, one more "let me just be sure." An agent makes this worse, not better — it can always surface ten more papers, so "have I read enough?" has no natural stopping point. The pile of unread PDFs becomes a permanent reason to not yet decide.

So "done" is **defined by what you hold, not by what you've read.** The literature review is over — fully, stop-now over — when these three artifacts exist:

1. **A one-page gap statement.** What is the problem; where has the SOTA got to; where *exactly* is the hole (a performance gap? too-strong assumptions? a theoretical blank? flawed evaluation?); and by what idea you fill it. **One page.** If it won't fit on a page, you don't yet understand it well enough to bet on it — and the fix is sharper thinking, not more reading.
2. **A core-paper comparison table.** The handful of papers your work lives among, on a fixed set of columns (setting, core idea, guarantee, benchmark, key numbers, code, self-stated limitations, relation to your idea). Built now, it *is* your Related Work section — the writing nearly free later. Schema in [table-and-reproduction.md](table-and-reproduction.md).
3. **1-2 baselines reproduced and running on your machine** — with numbers **you personally verified**, not the numbers the papers claim. This is where the map-≠-territory rule pays its rent: a "SOTA" you cannot reproduce under fair settings may *be* your gap. The discipline is in [table-and-reproduction.md](table-and-reproduction.md).

Hold these three and you are done — keep reading and you are procrastinating, not researching. Lack any of them and you are not done — no quantity of PDFs read changes that. **The terminus is the artifacts, not the empty inbox.** Frame the hunt, at STAGE 0, with this terminus already in view: you are not setting out to *read a field*; you are setting out to *produce three deliverables about one defensible gap*, and everything in between is instrumental to that.

A blunt test for whether you've crossed the line into forever-reading: if you cannot say what the *next* paper you read would change about your gap statement, you are reading to feel safe, not to decide. Stop and write the page.

---

## 8. Timing — the calibration the frame is sized against

For a **new** topic, the whole funnel runs about **two to four weeks.** Treat the bounds as diagnostics, not deadlines:

- **Under two weeks** usually means **insufficient breadth** — you under-mined, ran too few seams, accepted the first plausible candidate. The parallel reframe exists precisely to make breadth cheap; finishing fast is a sign you didn't use it, not a sign you're efficient.
- **Over a month** usually means **stuck in forever-reading** (§7) — narrowing fear, never committing. The three deliverables are the cure: aim at them and the clock stops when they exist.

The calibration matters at STAGE 0 because it sizes the scope you bound. A hunting ground so wide it can't be mined in four weeks is too wide (the miner drowns in noise); one so narrow it's exhausted in three days is too narrow (you re-find only the red ocean). Bound the ground so that *running the seams in parallel and landing the three deliverables fits in two-to-four weeks.* That single sizing constraint is most of what makes a scope right, and it is the felt meaning of the `scope-bounded` frame check: not "is the scope written down," but "is it the right *size* to mine in the time a topic decision deserves — fixed enough that 'is this paper in scope?' has a yes/no answer, wide enough to hold a real gap."

---

## What STAGE 0 leaves you holding

Frame is the cheapest stage and the one that determines whether the expensive ones aim true. When you clear its gate you should be holding three things, one per check:

- **A bounded hunting ground** (`scope-bounded`) — problem setting × method families × target venues × time window, sized to mine in two-to-four weeks, fixed enough that scope membership is a yes/no.
- **A structural target** (`hunt-survives-stronger-models`) — the hunt aimed at guarantees / verifiability / efficiency / hard structure that a stronger model makes *more* valuable, not a hand-design patch a stronger model deletes.
- **A verification discipline, set before the first search** (`source-verification-set`) — the map-≠-territory rule (title and core claim checked against source; CLAIMED separated from SHOWN) and the command-adversarially rule (never ask the agent to confirm your gap), both committed to in writing and stated to the agent.

With those three in hand, the agent becomes what it should be — a parallel miner and an adversary pointed at a durable problem on well-bounded ground — and never what it must not be: an oracle whose eagerness to please you decides your next two years. Now open [seven-seams.md](seven-seams.md) and start digging.

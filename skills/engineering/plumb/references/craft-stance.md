# The Craft Stance That Sizes the Audit

This reference is the depth behind **STAGE 0 — Frame** of the [../SKILL.md](../SKILL.md) flight plan, the place where you set the craft bar and take the judgment stance *before* you flag a single line. It governs three things: what "good code" actually *is* (not "it runs" but "stays cheap to read and change" — which is managing complexity), what goal state you are steering toward (boring, not clever — and why the boring version is the right one when the next reader is a no-context agent), and the load-bearing posture that keeps this skill from becoming a cudgel (every rule here is *guidance*, judged by whether it makes the code clearer, never applied as dogma). The human-era→agent-era shift under all of it is the root one: a human author *felt* the cost of their own clever line when they came back to read it next month, and that felt cost was the governor steering them toward the plain version; the agent feels none of it, writes clever by default, and re-reads its own output for free. For *why* this is the spine of the whole skill — the felt cost that vanished, the boring-is-a-feature target, the next reader who is now another agent — read **SHIFT 1** in [agent-era-shifts.md](agent-era-shifts.md). This file is the *how*: how to think about good code, how to size the bar to the code's role, and how to hold the guidance-not-dogma stance so two agents framing the same module reach the same plan.

The governing fact, inherited from [decision-tree.md](decision-tree.md) and overriding every default below:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer, never applied as dogma.**

Everything in this file is a consequence of that sentence. The check this file delivers is `craft-bar-set`: the code placed in its role-and-longevity tier, the craft bar sized to it, and the judgment stance taken — boring-over-clever as the target, guidance-not-dogma as the rule that keeps the audit honest.

---

## Contents

- [What "good code" actually is — managing complexity, for a human reader](#what-good-code-actually-is--managing-complexity-for-a-human-reader)
- [Boring over clever — the goal state, and why it's a feature now](#boring-over-clever--the-goal-state-and-why-its-a-feature-now)
- [Complexity is the thing you are managing — essential vs accidental](#complexity-is-the-thing-you-are-managing--essential-vs-accidental)
- [Guidance, not dogma — the stance that makes this skill safe to wield](#guidance-not-dogma--the-stance-that-makes-this-skill-safe-to-wield)
- [Size the craft bar to the code's role and life](#size-the-craft-bar-to-the-codes-role-and-life)
- [How the craft/legibility line threads the suite](#how-the-craftlegibility-line-threads-the-suite)

---

## What "good code" actually is — managing complexity, for a human reader

The most expensive misconception about code quality is that "good code" means "it works." Working is the floor — the *compiler* and the *tests* decide that, and they decide it the moment the code lands. But the code then *lives*: it gets read dozens of times for every once it was written, and it gets changed across a life measured in years and sessions. So the property that decides whether the code is actually good is not "does it run today" but **does it stay cheap to read and change tomorrow** — and that is the same thing as **managing complexity**, because the only reason code gets expensive to read and change is that complexity accumulates in it until each next reader has to hold more in their head than the task warrants.

This picks up the number the `husbandry` skill leaves you with: maintenance is 60–80% of a software system's lifetime cost, and nearly all of that maintenance is spent *reading* existing code to understand it and *changing* it without breaking it. If four-fifths of the cost is reading-and-changing, then the single highest-leverage property of the code is how cheap it makes reading-and-changing — and "it runs" is mute on exactly that. A module that runs perfectly and that no next session can safely change is not good code; it is a working liability.

Which is why the oldest sentence in the craft is the one sentence under everything in this skill:

> **Code is written for humans to read, and only incidentally for a machine to run.** *(the Knuth / Abelson–Sussman idea)*

The machine will run almost anything — minified, clever, obscure, it does not care. The *reader* is the constrained resource, and in the agent era the reader is most often a fresh agent session with no memory of why the code exists, holding nothing but the source and the docs. So every technique this skill teaches — intent-revealing names, small single-purpose functions, comments that explain *why*, earned abstraction, contained trust-chains, swept smells, testable design — exists to serve exactly one master: **legibility and changeability for that next reader.** Nothing here is craft for its own sake; if a technique doesn't make the code clearer or cheaper to change, it isn't earning its place, and applying it anyway is a defect (see [guidance, not dogma](#guidance-not-dogma--the-stance-that-makes-this-skill-safe-to-wield)).

The agent failure mode this frame guards against: the agent treats green tests as "done" and books the code as good the instant it works — because *working* is the only signal it gets a reward from. The whole job of Frame is to move "good" off "it runs" and onto "the next reader gets it at a glance and can change it safely," a property the agent is structurally blind to because it never pays the reading cost.

---

## Boring over clever — the goal state, and why it's a feature now

Set the target explicitly at Frame, because if you don't name it the agent's default aesthetic fills the vacuum. The goal state of every line is **boring**: simple, clear, predictable, obvious, legible at a glance. *Not* clever, not impressive, not "elegant," not "needs a second to follow." When a line needs deciphering, the line is wrong — not the reader.

This inverts an instinct the agent has and most authors quietly share: that the dense, compressed, surprising solution is the *better* one — that terseness signals mastery. It does not. Terseness signals that the author moved a cost off themselves and onto every future reader. Consider:

```python
# clever — looks sophisticated, reads like a puzzle
xs = [y for s in batches for y in s if y.ok and y.score > t][:n]

# boring — the next session reads it correctly on the first pass
passing = []
for batch in batches:
    for item in batch:
        if item.ok and item.score > threshold:
            passing.append(item)
top_n = passing[:limit]
```

The clever version is shorter and the machine runs it identically. The boring version is the *better* code, because the property that keeps code alive — a fresh reader gets it on one pass — is the property the boring version has and the clever one taxes. **Boring is a feature, not a compromise.** A reviewer who reaches for the clever line "to show it can be done" has optimized for the wrong audience.

Why this sharpens specifically in the agent era (SHIFT 1): the human author who wrote the clever one-liner had a *governor* — they knew they'd have to read it again at 2 a.m. on a bug with the context gone, and that dread pushed them toward the plain version. The agent has no governor. It writes clever by default because its training distribution rewards the impressive-looking answer, and it feels **zero cost reading it back** because it re-parses anything instantly and has no next-month to suffer. Worse, the *next reader is now an agent too* — a stateless session with no memory of why the code exists — so legibility stopped being a courtesy to a future colleague and became the *only* channel through which the next session understands the code at all. Boring-and-legible is no longer good manners; it is the load-bearing property.

- **PREDICATE:** would a fresh session with no prior context read this line's intent correctly on a single pass?
- **DEFAULT** on a coin-flip between a clever construction and a plain one: take the **plain** one. Cleverness is a cost paid by every future reader, forever, to save the author a few characters once.
- **FALLBACK** when the domain genuinely *requires* a non-obvious construction (a measured hot path, a subtle algorithm, a domain idiom): keep it, but make it legible around the irreducible part — name it, comment the *why*, and pin its behavior with a test, so the next session can change *around* it safely instead of breaking it blind. A clever line that *must* exist is acceptable when it is fenced and explained; a clever line that exists for flourish is a finding.

---

## Complexity is the thing you are managing — essential vs accidental

"Manage complexity" is precise, not a slogan, once you split the complexity in two — a distinction worth holding in your head through every later stage, because it tells you which complexity to leave alone and which to hunt.

| Kind | What it is | What to do |
|---|---|---|
| **Essential** | The complexity inherent in the problem itself — the tax rules really are conditional, the distributed system really can partition, the domain really has these states. You cannot delete it; the problem demands it. | *Make it legible.* Name it, model it with domain types, structure it so the inherent difficulty is visible and not compounded. You can't remove essential complexity, only present it clearly or bury it. |
| **Accidental** | Complexity *you* added that the problem never required — a clever construction, a premature abstraction, a leaked trust-chain re-checked at every call site, a sprawling function mixing three abstraction levels. The problem didn't need it; the code carries it anyway. | *Remove it.* This is the entire target surface of the audit — every finding in this skill is a parcel of accidental complexity the next reader is being charged for. |

The single most useful reframe this gives you: **the agent's three signature defects all manufacture accidental complexity.** Clever-not-clear code adds reading cost the problem never demanded. Premature abstraction adds a layer of indirection — and worse, a *wrong* one everyone has to route around — that the problem never demanded. A trust-chain leak (`Any`/`cast`/`isinstance`/`getattr` scattered through the core) adds re-checks and uncertainty the problem never demanded, because the trust could have been established once at the edge. None of these touch the essential complexity of the problem; all of them pile accidental complexity on top of it, and **the next reader pays the whole bill, on every read, for the life of the code.** The auditor's eye is calibrated by this: when you see complexity, ask *is this the problem's, or did we add it?* — the problem's, you clarify; ours, you cut. The depth on cutting each kind lives in the later references ([functions-and-flow.md](functions-and-flow.md), [abstraction-and-design.md](abstraction-and-design.md), [smells-and-trust-chains.md](smells-and-trust-chains.md)); the *stance* — that accidental complexity is the enemy and the agent generates it for free — is set here.

---

## Guidance, not dogma — the stance that makes this skill safe to wield

This is the stance that has to be taken *first*, before you flag anything, because it is what keeps the audit a judgment and not a witch-hunt. **The rules in this skill — Clean Code, SOLID, the design patterns, DRY, parse-don't-validate — are guidance, not law.** Each of them has supporters *and* serious critics, each was distilled from real pain and is right in the cases it was distilled from, and **over-applying any one of them is its own defect** — often a worse one than the thing it "fixed."

The test for every technique, applied without exception, is the one question:

> **Does this make the code clearer and cheaper to change — or just more rule-compliant?**

If the answer is "more rule-compliant," the technique is *not earning its place here*, and applying it anyway makes the code worse while looking sophisticated. A few concrete ways over-application is its own bug:

- A class split into eight tiny classes to satisfy the Single Responsibility Principle, when the logic was a readable forty lines — now the next reader chases the behavior across eight files to understand one operation. SOLID-as-dogma bought "correctness" and sold legibility.
- Three lines wrapped in a factory and two abstraction layers because patterns are "good engineering" — pattern-itis, indirection the next reader must traverse for no gain.
- Two coincidentally-similar snippets DRY'd into one parametrized function the moment they appeared, which then becomes the thing no one can change once the two needs diverge — the wrong abstraction, more expensive than the duplication it replaced.

Each of these is a *defect produced by following a craft rule too hard.* This is the suite's recurring **"X is a means, not an end,"** aimed at code itself: SOLID is a means to flexible code, not a target; a pattern is a means to a shared name for a real recurring solution, not a badge; DRY is a means to remove *knowledge* duplication, not a mandate to collapse anything that looks alike. The craft is **judgment, not rule-recitation** — and a craft audit that flags everything the auditor would have done differently is noise, not a review.

This is also what protects the audit's *output* from becoming a style war. The finding taxonomy in [decision-tree.md](decision-tree.md) — **finding** (genuinely taxes the reader) vs **nit** (real but cheap) vs **style opinion** (a preference that doesn't change clarity, which the formatter owns, not your taste) — is the operational form of this stance: you only flag what actually hurts legibility or changeability, and you let the `flightline` skill's formatter own formatting. The meta-rule runs through *every* later stage, so re-state it at each gate: the goal is clearer-and-cheaper-to-change, never more-compliant; **over-applying a craft rule is a finding, not a fix.**

The agent failure mode this guards against is double. First, the agent loves to *generate* rule-shaped structure (the SOLID split, the pattern, the abstraction) because it pattern-matches "good engineering" and feels no cost building it — so it over-applies by default. Second, an agent *auditing* with the rules as a checklist will mechanically flag every deviation as a violation, drowning the real findings in dogma. The stance — guidance judged by clarity, not a checklist applied for its own sake — is the fix for both.

---

## Size the craft bar to the code's role and life

Craft is a cost, and not all code earns the same craft. A one-off migration script you delete next week does not earn a SOLID refactor; a core domain module read daily for years by many sessions earns the full discipline. Over-polishing a throwaway is the *same class of error* as shipping a core module clever and unread — both spend craft where the code's life doesn't return it (够用就好). So the first concrete move at Frame, after taking the stance, is to **place the code in its role-and-longevity tier and size the bar to it.**

The sizer itself — the three tiers (**throwaway** / **internal-supporting** / **core-long-lived**), exactly what craft each earns, and the PREDICATE/DEFAULT/FALLBACK for code between tiers — is **TREE 0** in [decision-tree.md](decision-tree.md). Open it and run it; do not re-derive it here. Three reminders to carry as you do:

- **The DEFAULT on a coin-flip between two bars is to size to the *higher* one when the code sits on a path that's read often or changed often** — the cost of illegibility is paid *per read*, so frequently-traversed code repays the higher bar quickly. Size to the lower bar only for genuinely peripheral code.
- **The FALLBACK when you can't tell the code's longevity is to assume internal/supporting and apply the standard floor** — under-crafting code that turns out to be core is the expensive error (and the one the agent's optimize-now instinct makes by default); over-crafting a throwaway wastes a little effort and is recoverable.
- **The agent multiplier:** the more an agent reads and changes this code, and the more sessions touch it, the *more* the legibility bar matters — because every stateless session re-reads from scratch and pays the clever-code tax again. Agent-heavy code earns a higher bar than its role alone would suggest.

And decide the **mode** here too, because it changes what the rest of the run does (the AUDIT-vs-SETUP split and its finding taxonomy live in [decision-tree.md](decision-tree.md)): **AUDIT** (the common case — you are reviewing existing code, surveying the unit and producing ranked findings against the bar) or **SETUP** (you are writing new code, applying the same craft as you write so the boring-and-legible version is the one that lands). In AUDIT, the bar is what tells you whether a candidate is a real finding or an over-polish you should *not* flag — a vague name in a throwaway script is a nit, the same name in a public API is a finding. The bar is not just how hard you craft; it is the threshold the audit measures against.

---

## How the craft/legibility line threads the suite

plumb is cross-cutting: it is the **legibility-and-craft lens** you can hold over code at any point in the lifecycle, the plumb line that says whether the code is *true*. Frame is where you confirm that lens is aimed correctly and where it meets its siblings — because plumb deliberately does *not* re-implement what they own. It names the craft issue and routes the fix.

- **`gauge`** makes the code emit *trustworthy machine signal* — the strict type layer, boundary validation (`pydantic`/`zod`), errors-as-values, the gates that make the signal hard to fake green. plumb makes the code legible to the next *human-or-agent reader*. The two meet exactly at the **trust-chain**: a leaked static guarantee (`Any`/`cast`/`isinstance`/`getattr` clustered in the core) is simultaneously a *weak signal* (gauge's concern) and an *unreadable intent* (plumb's). plumb spots the leak and names the parse-once fix; the static-layer *tooling* for it is `gauge`'s.
- **`husbandry`** keeps the system cheap to change over its whole life and owns the refactoring *mechanics* (small steps, behavior pinned under test, boy-scout rule). plumb judges the moment-to-moment craft and, when a finding is larger than a safe rename, hands the *refactor* to `husbandry` rather than doing an un-tested craft refactor itself.
- **`assay`** designs and writes the *tests* and owns test craft. plumb uses **testability as a design probe** — "how hard is this to test?" reads design quality — but does not write the test plan; that's `assay`'s.
- **`load-bearing`** draws the *architecture-level module boundaries* and the contracts. plumb keeps the code *inside* those boundaries cohesive and low-coupling — the same cohesion/coupling idea, one altitude down, at the class/module level rather than the system level.
- **`flightline`** owns *formatting and lint* — the automated style floor. plumb never flags a formatting preference as a finding; if the formatter could settle it, it is a style opinion and `flightline`'s, not a craft judgment.

The thread: a *legible, craft-grade* codebase is not one virtue but the place where all of these meet at the line of code — a trustworthy signal (gauge), a cheap next change (husbandry), a tested behavior (assay), inside a sound boundary (load-bearing), under an automated style floor (flightline), made *readable to the next session* by plumb. For an agent the lever is the same as everywhere in the suite: it writes clever-not-clear and is its own next reader, feeling none of the future cost of an unreadable line — so craft must be **judged and gated**, with the boring, legible version made the one that ships. That is the stance Frame sets and the gate `craft-bar-set` enforces; carry it into STAGE 1 (Names), where the first and highest-ROI form of legibility — a name that reveals intent — gets its own gate.

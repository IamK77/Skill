# The plumb Decision Tree

This is the deterministic router at the heart of `plumb` — the engine the stages call into so that two agents auditing the same code reach the *same* judgment. Open it **first**, at STAGE 0 (Frame), alongside [agent-era-shifts.md](agent-era-shifts.md), and keep it beside you through every stage. The other references are the depth on each topic; this one decides *how much* craft the code earns, *which* call to make at each fork, and *what fixes what*. It is six mechanisms: the **craft-bar sizer** (TREE 0), the **AUDIT-vs-SETUP split** with its finding taxonomy, the **duplicate-or-abstract** fork (DRY vs AHA), the **pattern/SOLID "does it make it clearer?"** router, the **trust-chain edge-or-core** router, and the **smell → fix map** plus the **disposition router** — feeding the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md.

Every fork states three things so the routing is reproducible:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact overrides every DEFAULT and FALLBACK below:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer and cheaper to change, never applied as dogma.** When a fork is a real toss-up, err toward the **boring, plainer, simpler, more reversible** option: plain over clever, duplication over a hasty abstraction, a domain type over a primitive, simple code over a pattern. The asymmetry: an over-cautious craft choice costs a little terseness; a clever line, a wrong abstraction, or a leaked trust-chain taxes every future reader on every read for the life of the code.

---

## TREE 0 — The craft bar (size before you judge)

Craft is a cost, and not all code earns the same. Size the bar to how long the code must stay legible and how many readers it has — over-polishing a throwaway is the same error as shipping a core module clever and unread.

| Code's role | What it is | Craft bar |
|---|---|---|
| **Throwaway** | a one-off script, a spike, a migration you delete after | **clarity only** — decent names and small functions so *you* can finish it; skip abstraction, patterns, a smell sweep |
| **Internal / supporting** | a tool, a test helper, code read occasionally by the team | **the standard floor** — names, function shape, error handling, the obvious smells; light on SOLID/patterns |
| **Core / long-lived** | domain logic, a public API, code read daily for years by many (and many agent sessions) | **the full craft** — all six stages, hard: intent-revealing names, earned abstraction, contained trust-chains, swept smells, testable design |

- **PREDICATE:** how long must this code stay legible, and how many readers (human + agent sessions) will it have?
- **DEFAULT** on a coin-flip between two bars: size to the **higher** one if the code is on a path that's read often or changed often (the cost of illegibility is paid per read), the lower one for genuinely peripheral code.
- **FALLBACK** when you can't tell the code's longevity: assume **internal/supporting** and apply the standard floor — under-crafting code that turns out to be core is the expensive error, over-crafting a throwaway wastes effort but is recoverable.

> **The agent multiplier:** the more an agent reads and changes this code (and the more sessions touch it), the *more* the legibility bar matters, because every stateless session re-reads from scratch and pays the clever-code tax again. Agent-heavy code earns a higher bar than its role alone suggests.

---

## AUDIT vs SETUP — pick the mode, then the finding taxonomy

- **PREDICATE:** are you reviewing existing code (AUDIT, the common case) or writing new code (SETUP)?
- **SETUP**: apply the craft as you write, so the boring-and-legible version is the one that lands.
- **AUDIT**: judge the unit stage by stage and produce *findings* — but a finding must actually hurt legibility or changeability. Classify each candidate honestly, because the fastest way to make this skill useless is to drown real findings in style opinions:

| Classification | Means | Disposition |
|---|---|---|
| **finding** | genuinely hurts legibility/changeability — a real smell, a leaked trust-chain, a misleading name | rank by how much it costs the next reader; dispose (fix / refactor / accept) |
| **nit** | a minor, real, but low-cost improvement | batch it or boy-scout it; don't block on it |
| **style opinion** | a preference that doesn't change clarity (a formatting choice the formatter should own, a name you'd pick differently but is fine) | **not a finding** — drop it; the formatter/linter owns style (the `flightline` skill), not your taste |

> The trap this kills: reporting *style opinions as findings*. A craft audit that flags everything the auditor would have done differently is noise; flag only what actually taxes the reader, and let the formatter own formatting.

---

## The duplicate-or-abstract fork (DRY vs AHA) — STAGE 3

The single call the agent (and the novice) gets most wrong — it abstracts hastily (agent-era-shifts SHIFT 4). Detail in [abstraction-and-design.md](abstraction-and-design.md).

- **PREDICATE:** have you seen this *same* pattern at least three times, and are the instances *stable* (not about to diverge as their requirements differ)?
- **Yes (three+, stable)** → extract the abstraction; this is real DRY.
- **No (two instances, or likely to diverge)** → **tolerate the duplication** for now — name the instances clearly so the relationship is visible, and extract later if the pattern proves out.
- **DEFAULT** on a coin-flip: **tolerate the duplication.** A wrong abstraction is more expensive than the duplication it replaced (Sandi Metz) — it becomes the thing no one can change once the two needs diverge. The burden of proof is on the abstraction.
- **FALLBACK** when you can't tell whether the instances will diverge: leave them duplicated; collapsing duplication later is cheap, un-building a wrong shared abstraction everyone routes around is expensive.

> The rule in one line: **DRY removes *knowledge* duplication, not *coincidental text* similarity.** Two snippets that look alike but encode different decisions are not duplication — abstracting them couples two things that should move independently.

---

## The pattern / SOLID router — "does it make it clearer?" — STAGE 3

Patterns and SOLID are guidance, never a checklist (agent-era-shifts SHIFT 4). The one test, applied to any proposed pattern, split, or principle-driven change:

- **PREDICATE:** does this pattern / SOLID split / abstraction make the code **clearer and easier to change** — or just more "correct" / rule-compliant / sophisticated-looking?
- **Clearer & easier to change** → use it; that's what patterns and SOLID are for, and the shared vocabulary helps the team.
- **Just more correct / it satisfies a principle but adds indirection** → **don't** — keep the simple version (KISS/YAGNI). Wrapping three lines in a factory, or splitting simple logic into eight classes to satisfy SRP, is *over-engineering* — the agent's favorite failure, because it generates structure for free and it *looks* like good engineering.
- **DEFAULT** on a coin-flip: **simple code.** If plain code solves it readably, a pattern adds indirection the next reader must traverse for no gain. Reach for the pattern when the problem it solves is actually present, not to pre-empt one.
- **FALLBACK** when you're unsure whether the flexibility a pattern buys will be needed: don't build it (YAGNI) — the simple version is cheaper to evolve *into* the pattern later than to un-build the pattern if the flexibility never materializes.

---

## The trust-chain edge-or-core router — STAGE 4

`Any`/`cast`/`isinstance`/`getattr` (and the cross-language family) are necessary at boundaries and a smell in the core (agent-era-shifts SHIFT 5). Depth — including the per-language family and *parse-don't-validate* — in [smells-and-trust-chains.md](smells-and-trust-chains.md).

- **PREDICATE:** where does this escape hatch sit — at a **boundary** (deserializing external data, an FFI, a generic/library function, gradually typing legacy), or in **core domain logic**?
- **At a boundary** → acceptable and often necessary; the right move is to make it the *one* place the dynamic data becomes typed: **parse it once into a trusted type** here, so nothing downstream re-checks.
- **In core logic** → a **smell** — the trust chain leaking from compile time to runtime. The fix is to push the dynamism *out* to a boundary: establish the trust once at the edge (parse, don't validate) and let the type carry the guarantee in, so the core's `cast`/`isinstance`/`Any` disappears.
- **DEFAULT** on a coin-flip about whether a given escape hatch is "boundary enough": treat a **cluster** of them in one core unit as a leak to fix, and an isolated one at a clear edge as acceptable. Clusters in the core are the agent's tell.
- **FALLBACK** when you can't tell if trust could be established earlier: trace the value back toward its source; the question is always *"can this be parsed into a type once, closer to the edge?"* — usually it can, and the re-checks dissolve.

> Route the *fix* to the `gauge` skill (it owns the strict-checker, `pydantic`/`zod`, the static-layer tooling); plumb's job here is to *spot* the leak and name the parse-once fix.

---

## The smell → fix map (STAGE 4) and the disposition router (STAGE 5)

The classic smells, each a tell pointing at a specific fix (the Fowler catalog; full depth in [smells-and-trust-chains.md](smells-and-trust-chains.md)):

| Smell | The tell | Points at |
|---|---|---|
| **Long function** | many lines, many things, mixed abstraction levels | extract functions; one thing, one level |
| **Large class** | too many fields/methods, more than one responsibility | extract class; split by responsibility (cohesion) |
| **Long parameter list** | 4+ params, or several always passed together | introduce a parameter object |
| **Magic numbers/strings** | unexplained literals | named constants |
| **Shotgun surgery** | one change forces edits scattered across many places | move the related behavior together (raise cohesion) |
| **Feature envy** | a method mostly uses *another* object's data | move the method to the data |
| **Primitive obsession** | `str`/`int` for domain concepts; interchangeable `user_id`/`email` | domain types (`NewType`, enums, value objects) |
| **Trust-chain leak** | `Any`/`cast`/`isinstance`/`getattr` clustered in core | parse-don't-validate at the edge (route to `gauge`) |

Then the **disposition router** — every finding gets one (agent-era-shifts SHIFT 7):

- **PREDICATE:** is the fix small and safe, larger and behavior-bearing, or genuinely justified to leave?
- **Small & safe** → **fix it now** (a rename, an extract under existing tests).
- **Larger / behavior-bearing** → **refactor under test** — hand to the `husbandry` skill (small steps, boy-scout, behavior pinned with tests first); type-discipline fixes to `gauge`, test gaps to `assay`.
- **Justified to leave** → **accept with a written reason** (this cleverness is a real hot-path constraint; this duplication isn't stable enough to abstract yet).
- **DEFAULT** on a coin-flip about whether to fix or accept: **fix the cheap ones, route the larger ones, accept only with a reason in writing** — an undisposed finding is the same as no review.
- **FALLBACK** when you can't safely fix it now (no test coverage, too entangled): route it to `husbandry` to be pinned under characterization tests *then* refactored — never an un-tested craft refactor.

---

## Worked traversal (a "clever" core payments module handed to you)

1. **TREE 0:** core domain logic, read for years, agent-maintained → **core / long-lived → full craft.**
2. **Mode:** existing code → **AUDIT.** Classify as you go; drop the style opinions (a name you'd pick differently but is fine), keep the real findings.
3. **Names:** `process()`, `d`, `tmp`, `data` everywhere → findings (vague, no intent) → rename to reveal intent.
4. **Functions:** a 180-line `process()` computing fees + building SQL + formatting a receipt at three abstraction levels, with a `flag` parameter → split along the seams; the flag is two functions.
5. **Abstraction:** two near-identical fee calculators abstracted into one parametrized monster the two products now fight over → the **wrong abstraction**; the duplicate-or-abstract fork says these diverged — *un*-abstract them back into two clear ones.
6. **Trust:** a cluster of `cast`/`isinstance`/`dict[str, Any]` through the core, re-checking the shape of the incoming charge on every function → trust-chain leak; parse the charge once at the API edge into a typed model (route the tooling to `gauge`), and the core re-checks dissolve. `amount: int` everywhere → primitive obsession → a `Money` domain type.
7. **Testability:** the fee logic can only be tested by standing up a database → hard-to-test = bad design; extract the pure fee calculation from the I/O.
8. **Disposition:** rename + extract = fix now; the un-abstraction and the parse-once = refactor under test via `husbandry`; the one genuinely-clever rounding line with a comment explaining the regulatory reason = accept with reason. Carry the "is this cleverness justified?" call to the user where it's unclear.

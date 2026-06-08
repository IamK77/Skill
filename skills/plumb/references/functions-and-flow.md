# Functions & Flow: Small, One Thing, Honest About Failure

This reference is the depth behind **STAGE 2 — Functions & flow** of the [../SKILL.md](../SKILL.md) flight plan, the stage where a unit's *shape* is judged: how big a function is, how many things it does, how many levels of abstraction it mixes, how many parameters it takes, what its comments claim, and what it does when something goes wrong. It governs two checks — [`functions-small-single-purpose`](#1-small-and-one-thing-at-a-single-level-of-abstraction) and [`comments-and-errors-honest`](#3-comments-explain-why-not-what) — and the human-era→agent-era shift underneath both: an author who had to *hold a 200-line function in their head* on the next bug felt the sprawl as pain, felt the wrongness of a comment that no longer matched the code, and got bitten in production by the error they swallowed. The agent feels none of that. For *why* the work changes, read [agent-era-shifts.md](agent-era-shifts.md) — **SHIFT 3 (sprawling functions, rotting comments, swallowed errors)** is the one card this file enforces. This file is the *how*: the concrete moves that keep a unit small, one-thing, honest in its comments, and fail-fast in its errors.

Restate the governing fact you carry into every line, inherited from [decision-tree.md](decision-tree.md):

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer, never applied as dogma.** When a fork is a real toss-up, err toward the boring, plainer, smaller, more honest option. The asymmetry: splitting a function you maybe didn't need to split costs a function name; a 180-line body at three abstraction levels taxes every future reader on every read for the life of the code.

And the META-RULE that runs under the whole file, because function craft is the easiest place to over-apply a rule into a new defect: **these are guidance, not dogma — the test for every move below is "does this make the code clearer and cheaper to change, or just more rule-compliant?"** A function chopped into nine one-line helpers you have to chase across the file to follow one thought is *worse* than the medium function it came from; that fragmentation is its own smell. Smallness serves legibility; it is not legibility. Where over-application bites, this file says so.

The agent failure mode under all of it: **the agent emits sprawl, rot, and swallowed errors without friction.** A long function that does business logic, builds a query, and formats output in one body works on the first run; a comment left stale after a change earns no red; an empty `catch` is the cheapest path to green. Each is invisible to a passing test, and the agent — which re-reads anything instantly and has no production 3 a.m. to dread — feels none of the cost it just handed the next session.

## Contents

- [1. Small, and one thing — at a single level of abstraction](#1-small-and-one-thing-at-a-single-level-of-abstraction)
- [2. Few parameters, no flag arguments, command/query separation](#2-few-parameters-no-flag-arguments-commandquery-separation)
- [3. Comments explain WHY, not WHAT — and a stale comment lies](#3-comments-explain-why-not-what)
- [4. Error handling is design — fail fast, never swallow](#4-error-handling-is-design--fail-fast-never-swallow)
- [5. The split-or-leave decision, and where the big surgery goes](#5-the-split-or-leave-decision-and-where-the-big-surgery-goes)

---

## 1. Small, and one thing, at a single level of abstraction

> **Check: `functions-small-single-purpose`. Governing shift: SHIFT 3.**

A function should do **one thing**, and the sharpest operational test for "one thing" is not a line count — it is **a single level of abstraction.** A body that, in the same fifteen lines, reasons about *business policy* ("a refund is allowed within 30 days"), builds an *infrastructure string* (a raw SQL query), and shapes a *presentation detail* (formatting a currency string for a receipt) is doing three things at three altitudes. The reader has to context-switch between "what is the rule" and "what is the wire format" and "how does it look on screen" inside one scope, holding all three in their head at once. That cognitive load is the cost, and a stateless agent session pays it in full on every read.

**How to spot the mixed levels.** Read the body top to bottom and ask of each line, *at what altitude is this?* You are looking for the seams where the altitude jumps:

- **policy / domain rules** — "eligible if", "tax is", "the discount applies when" — the *why* of the program;
- **orchestration** — calling other functions in sequence, the *what-happens-next*;
- **infrastructure / I/O** — a SQL string, an HTTP call, a file read, JSON (de)serialization — the *how it talks to the outside*;
- **presentation / formatting** — string-building for output, currency/date formatting, HTML.

When one body visits three of these, it has seams, and the seams are where you extract. The good version reads at one altitude — orchestration that *names* the lower-altitude pieces and delegates to them:

```python
# BAD — one body, three abstraction levels: policy + SQL + formatting all mixed.
def make_refund_receipt(order_id, conn):
    row = conn.execute(
        f"SELECT amount, paid_at FROM orders WHERE id = {order_id}"   # infra (and an injection)
    ).fetchone()
    days = (datetime.now() - row["paid_at"]).days
    if days > 30:                                                     # policy
        raise RefundWindowClosed()
    refund = row["amount"] if days <= 7 else row["amount"] * 0.9      # policy
    return f"Refund: ${refund/100:.2f} ({days} days)"                # presentation
```

```python
# GOOD — top function reads at ONE altitude; each seam is a named lower-altitude piece.
def make_refund_receipt(order_id: OrderId, orders: OrderRepo) -> str:
    order = orders.get(order_id)              # infra, behind a repository
    refund = refund_amount(order)             # policy, isolated and testable
    return format_receipt(order, refund)      # presentation, isolated

def refund_amount(order: Order) -> Money:     # pure policy — no I/O, no formatting
    days = order.age_in_days()
    if days > 30:
        raise RefundWindowClosed(order.id, days)
    return order.amount if days <= 7 else order.amount * 0.9
```

The extraction bought three things the reader feels immediately: `make_refund_receipt` now tells the *story* at one altitude; `refund_amount` is pure policy you can test without a database (the testability litmus, the `testability-and-disposition.md` reference's craft); and the SQL string moved behind a repository where the parameterization and the trust boundary live. Note what extraction is *not*: it is not chopping the body at arbitrary line boundaries. You extract **along the abstraction seams**, and each extracted piece gets an intent-revealing name (the `naming.md` reference's craft) — an extract whose name is `helper2` or `do_part_b` has moved the sprawl, not removed it.

**Size, judged not counted.** "Small" is real — a function you can't see without scrolling is almost always doing too much — but the line count is a *symptom*, not the law. The law is one-thing-at-one-level. A 40-line function that does exactly one cohesive thing at one altitude (a parser's main loop, a state machine's transition) can be more legible than the same logic shredded into twelve two-line helpers you must reassemble in your head to follow one thought. **That shredding is the over-application defect** this file warns against: when the extraction makes the reader *chase* the logic instead of *read* it, you have served the rule and taxed the reader. The test, always: does pulling this piece out make the caller clearer, or just shorter? If the helper is called once and only makes sense in the context of its caller, inlining it may be the more legible move.

The agent's tell here is the **long function at mixed levels** emitted in one pass — it generates the whole flow because it works, and feels no strain holding it, so the seams never get cut. At AUDIT, the long-function smell routes to "extract along the seams" via the smell→fix map in [decision-tree.md](decision-tree.md#the-smell--fix-map-stage-4-and-the-disposition-router-stage-5); at SETUP, write the one-altitude version first.

---

## 2. Few parameters, no flag arguments, command/query separation

A long parameter list is the second function-shape smell, and it has two distinct cures depending on *why* the list is long.

**Few parameters — 0–2 ideal, 3 acceptable, 4+ a smell.** Each parameter is something the reader must understand and the caller must get right (and get in the right order). A niladic (zero-arg) or one-arg function is trivially legible; past three, the call site becomes a puzzle — `transfer(a, b, c, d, e)` tells the next reader nothing about what `c` and `e` are without going to the definition. The cure when **several parameters always travel together** is to **introduce a parameter object** that names the cluster:

```python
# BAD — 5 positional params; the call site is a guessing game.
def schedule(name, start_hour, start_minute, end_hour, end_minute): ...
schedule("standup", 9, 30, 9, 45)   # which is which? a reader must go check.

# GOOD — the cluster that always travels together becomes a named type.
@dataclass(frozen=True)
class TimeRange:
    start: Time
    end: Time

def schedule(name: str, window: TimeRange): ...
schedule("standup", TimeRange(Time(9, 30), Time(9, 45)))
```

The parameter object isn't bureaucracy for its own sake — it's earned exactly when the same several values keep moving as a unit, because then they *are* one concept (a `TimeRange`, a `DateRange`, an `Address`) and the type makes that concept explicit. (This is the long-parameter-list → parameter-object entry in the [decision-tree.md](decision-tree.md#the-smell--fix-map-stage-4-and-the-disposition-router-stage-5) smell map, and it shades into curing primitive obsession with domain types, which is the `smells-and-trust-chains.md` reference's craft.) The META-RULE applies: don't wrap two unrelated parameters in a struct just to hit "≤3" — a parameter object that bundles things that *don't* belong together is worse than the flat list. The bundle must be a real concept.

**The flag argument is a different smell — it means the function does two things.** A boolean parameter that *switches behavior* — `doStuff(true)` — is a reliable tell that the function has two jobs welded into one name, selected at the call site by a literal that tells the reader nothing:

```python
# BAD — the flag selects between two different behaviors inside one body.
def render(node, raw):
    if raw:
        return node.text                    # one job
    return escape_html(node.text)           # a different job
render(node, True)   # what does True mean here? the call site is opaque.
```

```python
# GOOD — two jobs, two names; each call site says what it means.
def render_raw(node) -> str:    return node.text
def render_html(node) -> str:   return escape_html(node.text)
```

Splitting the flag function gives every call site an honest, self-describing name — `render_html(node)` versus `render(node, False)` — and it usually shrinks each resulting function, because the two branches were never really one thing. The exception (and where over-application bites): a parameter that is genuinely a *value the function operates on*, not a behavior switch, is not a flag — `withdraw(account, dry_run=True)` is borderline, `set_visible(widget, visible)` is fine because `visible` is the data the one operation acts on, not a fork between two operations. The test is whether the boolean picks between *two code paths that do different things*; if it does, split.

**Command/query separation, in passing.** A function should either *do something* (a command — change state, cause an effect, return nothing meaningful) or *answer something* (a query — return a value, change nothing observable), **not both.** A `bool isPostmaster = setAttribute("username", "...")` that both mutates and returns a status forces the reader to wonder whether reading the value also *did* something — and makes the call dangerous to use in a condition. Keep queries side-effect-free so the reader can trust that asking a question doesn't change the answer; this is the same fail-fast honesty as §4, applied to the return value instead of the error.

---

## 3. Comments explain WHY, not WHAT

> **Check: `comments-and-errors-honest`. Governing shift: SHIFT 3.**

The default state of a comment should be *absent*, because **the code already says what it does** — that is what intent-revealing names and small one-thing functions buy you. A comment earns its place only by carrying information the code *cannot* — and the dividing line is **why versus what**:

| Legitimate comment (keep / write it) | Bad comment (delete it) |
|---|---|
| **Intent / why** — "we retry 3× because the upstream is flaky under load" | **Restates the code** — `i += 1  # increment i` adds nothing, ages badly |
| **A trade-off** — "linear scan; n is always < 20 here, a hash map isn't worth it" | **Misleading** — describes what the code *used* to do, or what the author *meant* |
| **A counter-intuitive warning** — "do NOT remove this sort; the API requires sorted input or it 500s" | **Commented-out code** — dead weight; version control remembers it |
| **A `TODO`/`FIXME`** with enough context to act on | **A section banner** — `### helpers ###` papering over a class that should be split |
| **Legal / license** header where required | **Compensating for a bad name** — `# the user's email` over `e` (fix the name instead) |

The pattern across the left column: every legitimate comment records something **not derivable from reading the code** — a reason, a constraint, a hazard, a deferred intention. The pattern across the right: each one either repeats what the code plainly states (noise that the reader must still read and verify) or actively obstructs (a banner, a name-patch, a corpse). The agent's tell is the **what-comment**: it narrates the line it just wrote (`# loop over the items`, `# return the result`) because narration looks diligent and earns no red, while the *why* — the one thing the next session genuinely needs — is exactly what the agent omits, because it isn't in the code and the agent felt no cost leaving it out.

**The stale comment is worse than no comment — because it lies.** A missing comment costs the reader a moment of working it out from the code. A *stale* comment — one the code moved past and no one updated — costs the reader far more: they read it, *trust it* (it looks authoritative, it's right there next to the code), and act on a claim that is now false. It actively misdirects the next session into a wrong mental model. This is the **`husbandry` stale-doc hazard brought down to the line level**: the same trap where documentation drifts from the system it describes, here scoped to one comment beside one function. The agent plants these constantly — it changes the code and leaves the comment, because updating the comment earns no green and nothing turns red when it rots. So two rules:

1. **A comment the change made stale is a defect *of that change*** — when you edit code, the comments above and inside it are part of the surface you edited; fix or delete them in the same move, never leave a true-yesterday comment beside changed-today code.
2. **When in doubt, delete rather than leave stale** — a deleted accurate-but-redundant comment costs nothing; a retained stale one costs the next reader a wrong belief. If you can't quickly confirm a comment is still true, it is a liability, not an asset.

The whole discipline reduces to: prefer making the code self-explanatory (a better name, a smaller function) over writing a comment; write a comment only for the *why* the code can't hold; and treat every comment as code that can rot, with the same maintenance obligation.

---

## 4. Error handling is design — fail fast, never swallow

> **Check: `comments-and-errors-honest`. Governing shift: SHIFT 3.**

Error handling is not the cleanup you sprinkle on after the happy path works — it is **part of the design**, decided alongside the function's contract: what can go wrong, who is responsible for it, and how the failure surfaces. The governing posture is **fail fast**: detect a broken assumption at the earliest point you can, and stop loudly with a message that locates the problem, rather than limping forward on bad state until it corrupts something three layers away where the cause is unrecoverable. A failure caught at its source names its cause; the same failure caught downstream names only its symptom.

**Never silently swallow an error.** The empty `catch` / bare `except: pass` is a time bomb — it converts a real failure into *silence*, so the program continues as if nothing happened, on state that is now wrong, and the bug surfaces later somewhere unrelated with no trace back to the cause. It is the single most damaging error-handling mistake, and it is the agent's reflex: **suppressing the exception is the cheapest path to a green run**, the error goes away, the test passes, and nothing turns red — so the agent reaches for it without unease.

```python
# BAD — the empty except: the failure vanishes, the program limps on with bad state.
try:
    config = load_config(path)
except Exception:
    pass                          # config is now undefined-or-stale; the bug surfaces elsewhere
```

```python
# GOOD — fail fast, and say exactly what failed and where.
try:
    config = load_config(path)
except FileNotFoundError as e:
    raise ConfigError(f"config not found at {path!r}; expected a TOML file there") from e
```

The good version differs in three ways, each a rule:

- **Fail fast and explicit** — a missing config is fatal at startup; surface it now, not as a `None` that detonates on first use.
- **Don't over-catch** — catching bare `Exception` (when you only meant `FileNotFoundError`) is a quieter swallow: it hides *unexpected* failures (a typo'd attribute, a bug) behind your handler for the *expected* one. Catch the specific error you can actually handle; let the rest propagate to fail fast.
- **`raise ... from e`** — preserve the cause chain so the next reader sees the original error, not just your wrapper.

**Prefer exceptions to ignored error codes.** A function that *returns* an error code relies on every caller remembering to check it — and the one caller who forgets gets silent corruption, the same failure as the empty `catch` by a different route. An exception cannot be silently ignored: it propagates until something handles it or the program stops. (In a codebase that has deliberately chosen **errors-as-values** — a `Result`/`Either` type the checker *forces* every caller to unwrap — that is a strong, legible alternative, not an ignored code; that machinery is the `gauge` skill's craft. The thing to forbid is the *ignorable* status return that nothing makes you check.)

**Error messages locate the problem, not "something went wrong."** A message is written for the person (or agent session) debugging at 3 a.m. with only the log line. `"something went wrong"` tells them nothing; `"config not found at '/etc/app/config.toml'; expected a TOML file there"` tells them *what* failed, *where*, and *what was expected* — enough to act without reproducing. Include the offending value (`{path!r}`), the operation, and the expectation. (Mind the boundary: a *user-facing* error and an internal log differ — never leak secrets or internals to the client; that split is the `aegis` skill's. The rule here is that the *internal* diagnostic must be specific.)

**Don't casually return `null` where it forces the caller into defensive checks.** A function that returns `None`/`null` on the not-found-or-failed path pushes a `if x is not None` guard onto every call site — and the one caller who omits it gets a null-dereference far from the cause. Prefer, in order: raise (the absence is exceptional), return an explicit empty value (an empty list/string where "none" is normal and safe to iterate), or an `Optional`/`Maybe` the type system *forces* the caller to handle (again the `gauge` skill's typed-feedback craft). A bare nullable that the checker doesn't make anyone unwrap is the trap — it looks handled and isn't. The META-RULE bounds this too: don't ceremonially wrap a value that is never absent in an `Optional` just to look rigorous — that is over-application, adding an unwrap the reader must perform for a case that can't occur.

The thread tying §4 back to the whole file: **a swallowed error and a stale comment are the same kind of defect** — a silent lie the next reader can't see, planted because it turned nothing red. SHIFT 3's anti-pattern names them together for exactly this reason.

---

## 5. The split-or-leave decision, and where the big surgery goes

Most function-shape findings reduce to one fork — *do I break this function up, or is it fine as it is?* Run it explicitly so two auditors reach the same call:

- **PREDICATE:** does this function do **more than one thing** (visits more than one abstraction level, mixes policy with I/O with formatting, carries a flag argument that forks behavior, or is genuinely too large to see at once) **AND would splitting it make the caller clearer** — not just shorter?
- **DEFAULT** on a coin-flip: **split along the abstraction seams** when the body crosses altitudes or carries a flag, because mixed-level and two-jobs-in-one-name are the costs the next reader actually pays. But **leave it whole** when the only complaint is line count and the body does one cohesive thing at one level — shredding a coherent 40-line routine into helpers you must chase is the over-application defect, and a single readable function beats a scavenger hunt across six. The question is always *legibility for the next reader*, never a number.
- **FALLBACK** when you can't tell whether a split helps: try naming the extracted piece. If it gets a clean intent-revealing name and the caller reads as a clearer story, split; if the only name you can find is `helper`/`part2`/`do_rest`, that's the signal the piece isn't a real "one thing" — leave it inline and reconsider the seams.

**Where the big surgery goes — not here.** This stage *names* the shape problem and points at the fix direction; it does not perform large restructurings in place. A small, safe extraction under existing tests (pull a pure function out, rename, split a flag) you do now. But anything larger — restructuring a function with no test coverage, untangling a body whose behavior you can't yet pin, a multi-step reshaping that could change behavior — is **refactoring mechanics**, and that is the `husbandry` skill's craft: behavior pinned under characterization tests *first*, then small reversible steps, boy-scout as you go. Routing a behavior-bearing restructuring through `husbandry` rather than free-handing it here is the safe path; an untested craft refactor is how a "clarity" change ships a regression. This is the disposition router in [decision-tree.md](decision-tree.md#the-smell--fix-map-stage-4-and-the-disposition-router-stage-5): fix the cheap ones now, route the larger ones to `husbandry`, accept-with-reason the ones genuinely justified to leave (the rare big function that is one cohesive thing and reads fine).

When the call is still unclear — is this function's size a real cost or a style preference, is this cleverness in the control flow justified by a real constraint — take the [escalation ladder](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear) in agent-era-shifts.md: default to the boring, smaller, more honest version; keep the change reversible and under the existing tests; and carry the residual judgment to the user, who owns the trade-offs craft can't settle.

---

**Cross-links:** [agent-era-shifts.md](agent-era-shifts.md) (SHIFT 3 — *why* the work changed: sprawl, rot, swallowed errors) · [decision-tree.md](decision-tree.md) (the craft-bar sizer, the long-function and long-parameter-list smell→fix entries, and the disposition router this file routes into) · [../SKILL.md](../SKILL.md) (the six-stage flight plan this stage serves). Siblings this file hands off to in prose: `naming.md` (the intent-revealing names every extraction needs), `smells-and-trust-chains.md` (parameter-object/domain-type for primitive obsession, the SQL string behind the repository boundary), and `testability-and-disposition.md` (the pure-policy extraction as the testability litmus, and disposing each finding). Other skills named, not pathed: the `gauge` skill owns the typed feedback (`Result`/`Optional`/strict-checker) behind errors-as-values; the `husbandry` skill owns the refactoring mechanics for any restructuring larger than a safe in-place extract, and the stale-doc hazard this file scopes to the comment; the `assay` skill owns designing the tests; the `aegis` skill owns the user-facing-vs-internal error split.

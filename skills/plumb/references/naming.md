# Names — Code's Primary Documentation

This reference is the depth behind **STAGE 1 — Names** of the [../SKILL.md](../SKILL.md) flight plan, the stage that audits (or chooses) every name a unit exposes against one property above all: **it reveals intent.** Naming is the single highest-ROI, most-undervalued move in the craft — a name is the documentation the next reader hits *first*, on every line, with no extra file to open and nothing to keep in sync. The human-era author struggled over names because a vague `d` or `tmp` was a debt they paid every time they re-read the code six months later; that felt cost is exactly what an agent lacks. It reaches for the generic placeholder by default, because a precise name earns no green and it reconstructs meaning from context instantly, every time, feeling none of the tax it leaves for the next session. For *why* this shifts — the lost governor, the agent's placeholder reflex — read **SHIFT 2** in [agent-era-shifts.md](agent-era-shifts.md); this file is the *how*: the rules, each with a bad→good example, the agent's tells, naming-as-diagnostic, and the predicate that decides "good enough."

The meta-rule from Frame governs here as everywhere: **these are guidance, not dogma — the test for every naming move is "does this make the code clearer and cheaper to change, or just longer / more rule-compliant?"** A name stretched to `theNumberOfElapsedDaysSinceTheAccountWasLastBilled` to satisfy "be descriptive" is its own defect — it taxes the reader it was meant to serve. Reveal intent in the *fewest* words that do it.

And the inherited governing fact, restated because it sizes every call below:

> **Code is read far more than it is written, the next reader is an agent with no context, so boring-and-legible beats clever — and every rule here is guidance, judged by whether it makes the code clearer, never applied as dogma.**

---

## What a good name buys, concretely

A name is not decoration; it is the cheapest documentation you will ever write and the only documentation that *cannot* go stale relative to the thing it names (rename the thing, the name moves with it). The return is direct and measurable:

- **A good name deletes a comment.** `# number of days since signup` above `d` is a comment that exists only because the name failed; rename `d` to `daysSinceSignup` and the comment is redundant — delete it. The name *is* the documentation now, and unlike the comment it can't drift out of sync (the stale-comment hazard `functions-and-flow.md` owns).
- **A good name saves the next reader ten minutes.** `isEligibleForRefund()` tells a fresh session what the call decides without reading the body; `check()` forces it to open the function, trace the logic, and reconstruct the intent — every time it lands there. Multiply by every read over the life of the code, almost all now by stateless agent sessions that re-read from scratch.
- **A good name is searchable.** A reader (or an agent doing a rename) can `grep daysSinceSignup` and find every use; they cannot usefully grep `d`.

The leverage is why this is STAGE 1 and not a footnote: names touch every line, the cost of a bad one is paid per read, and the fix is the cheapest in the whole skill — usually a rename under the existing tests, disposed as **fix-now** (route the mechanics to the `husbandry` skill only if it's a wide, behavior-touching rename).

---

## The rules, each with a tiny bad→good

Every rule below is one lens on the same property — *the name reveals intent to a no-context reader.* The check this stage gates on, `names-reveal-intent`, is the whole set.

### Intention-revealing — say what it is, what it does, why it exists

A name should answer *what is this and why does it exist* without a comment. This is the master rule; the rest are corollaries.

```python
# BAD — the reader must open the body to learn anything
d = (now - signup).days
if check(u): ...

# GOOD — the line reads as a sentence
days_since_signup = (now - signup).days
if is_eligible_for_refund(user): ...
```

Booleans read as predicates (`is_`, `has_`, `can_`, `should_`); functions read as verbs for the action or the question they answer (`calculate_total`, `is_eligible_for_refund`), not `check`, `do`, `handle`, `manage`. A name that needs a trailing comment to be understood is a name that hasn't done its job.

### Searchable and pronounceable

A name you can't search you can't safely change; a name you can't say you can't discuss. Single letters and number-laden abbreviations are invisible to `grep` and to a reviewer talking through the code.

```typescript
// BAD — unsearchable, unpronounceable, magic literal
const ymdhms = fmt(t, 7);

// GOOD — both the name and the constant are searchable and speakable
const MAX_RETRY_WINDOW_DAYS = 7;
const formattedTimestamp = formatTimestamp(eventTime, MAX_RETRY_WINDOW_DAYS);
```

The loop index `i`/`j` is the deliberate exception (covered under *length scaled to scope*) — its scope is one line and its meaning is conventional.

### No encodings — drop the prefixes the tooling already knows

Hungarian notation (`strName`, `iCount`), type prefixes, scope prefixes (`m_field`, `g_config`), interface `I`-prefixes — these encode into the name what the type system, the IDE, and the strict checker already tell you. They add noise, and they *lie the moment the type changes* and the prefix doesn't.

```python
# BAD — type baked into the name; now wrong if it ever becomes a list
str_name = "ada"
arr_users = load_users()

# GOOD — the type is the type's job (and the gauge skill's strict layer proves it)
name = "ada"
users = load_users()
```

The static-typing tooling that makes the bare name *safe* — the strict checker, the validated model — is the `gauge` skill's; plumb's rule is simply: don't re-encode in the name what the type already carries.

### Avoid disinformation — the name must not lie

A name that implies something false is worse than a vague one, because the reader *trusts* it and is misled. Don't call a thing a `list` if it's a `dict`; don't name it `userCount` if it holds an average; don't reuse a word that means something specific in the domain (an `account` that isn't an account).

```python
# BAD — it's a dict, the name says list; the reader plans the wrong iteration
account_list = {u.id: u for u in users}

# GOOD — the name matches the structure and the intent
accounts_by_id = {u.id: u for u in users}
```

### One word per concept — consistent vocabulary

Pick one verb per action and use it everywhere. `fetchUser`, `getOrder`, `retrieveInvoice` for the same "load from the store" act force the reader to wonder whether the three *differ* — they look like three concepts but are one. Consistency lets a name in one module predict the name in the next.

```typescript
// BAD — three words, one concept; is `retrieve` doing something `get` doesn't?
fetchUser(id); getOrder(id); retrieveInvoice(id);

// GOOD — one verb, the reader stops wondering
getUser(id); getOrder(id); getInvoice(id);
```

Pick the team's word, write it down once, and the agent's reflex to vary synonyms for flavor stops being a tax. (Where this hardens into enforced naming conventions across a codebase, the *mechanical* check belongs to lint — the `flightline` skill — but choosing the shared vocabulary is craft, and it is plumb's.)

### Length scaled to scope

Name length should track how far the name travels. A variable alive for one line in a tiny scope can be terse; a name exported from a module is read far from its definition by people with no context and must carry its full meaning.

| Scope | Good | Bad |
|---|---|---|
| one-line loop / comprehension index | `i`, `x`, `kv` | `theLoopCounterIndex` (noise) |
| local var, a few lines | `total`, `match` | `t`, `m` (too terse to travel) |
| function / method (read across the file) | `is_eligible_for_refund` | `check` (no intent) |
| module-level export, public API | `calculate_invoice_total` | `calc`, `process` (no intent, travels far) |

The error runs both ways: a one-letter export is under-named, and a paragraph-long loop index is over-named noise — both fail the "clearer?" test. *够用就好* applies to names too.

### Avoid noise and placeholder words

Words that add length but no information: `data`, `info`, `manager`, `processor`, `handler`, `helper`, `util`, `tmp`, `obj`, `result`, `value`, `item`, `the`/`a` prefixes, `Data`/`Object`/`Info` suffixes. `userData` says nothing `user` doesn't; `ProductInfo` says nothing `Product` doesn't; a `Manager` or `Processor` class is usually a bag of unrelated procedures wearing a name that hides its lack of a single responsibility.

```python
# BAD — noise words, reveal nothing
user_data = get_user_data()
result = processor.process(user_data)

# GOOD — the names name the actual things
user = get_user(user_id)
invoice = calculate_invoice(user)
```

`result`/`tmp` are the honest exceptions only in the very smallest scope (a two-line accumulation); the moment the value travels or matters, name what it *is*.

---

## The agent's tells

These are the names an agent reaches for by default, because a precise name earns it no green reward and it feels no cost re-reading a vague one — it reconstructs the meaning from context instantly, every time, and has no next-month to dread (SHIFT 2 in [agent-era-shifts.md](agent-era-shifts.md)). Treat a cluster of them as the signature that names were never actually chosen:

> **`data`, `info`, `handle`, `process`, `processData`, `tmp`, `obj`, `result`, `value`, `item`, `manager`, `helper`, `doStuff`, `check`, single-letter non-loop vars (`d`, `u`, `x` outside a comprehension), `flag`/`flag2`, `temp`/`temp2`.**

Each is a small unpaid debt the next session settles in confusion. At STAGE 1 you flag every one and replace it with an intent-revealing name — or, if you genuinely cannot find a better name, read that failure as the diagnostic below, not as a license to keep `data`.

---

## Naming difficulty is a design diagnostic, not a cosmetic one

The deepest use of naming is as a *probe of the design underneath.* **When you cannot name a thing clearly, the thing itself is usually unclear** — and the name is telling you so. A function you can only name `processData` or `handleStuff` is almost always doing **two jobs** (the name has to hedge because no single verb fits) or sitting at the **wrong boundary** (it's named for *how* it's called, not *what* it means). The naming struggle is honest feedback that the agent, generating structure for free, never feels.

```python
# Can't name it better than this? The name is hedging because it does three things.
def process_account_data(account):
    fees = ...        # compute fees
    save(account)     # write to the DB
    send_receipt(...) # send an email
```

There is no good single name for that function because it isn't one thing — it's `calculate_fees` + `save_account` + `send_receipt`. The fix isn't a cleverer name; it's the split that makes three honest names possible. So when a name resists you, don't force a vague one and move on — **route the difficulty to STAGE 2** (`functions-and-flow.md`, split along the abstraction seams) or, if it's the wrong boundary entirely, to the design call in `abstraction-and-design.md` (cohesion / responsibility). The hard-to-name name is a finding *about the design*, classified as a real **finding**, not a **nit**, per the taxonomy in [decision-tree.md](decision-tree.md). Module-boundary-level "this name has no home" goes to the `load-bearing` skill.

> The rule: a name that won't come is rarely a vocabulary problem. It's the code asking to be reshaped so a true name exists.

---

## Is this name good enough? — the predicate

For any name in the unit, run this fork (it feeds the AUDIT finding taxonomy and the escalation ladder in [agent-era-shifts.md](agent-era-shifts.md#escalation-ladder--when-the-call-is-unclear)):

- **PREDICATE:** could a fresh, no-context session read this name *alone* — not the body — and correctly predict what the thing is, what it does, or what it decides, in the fewest words that achieve that?
  - **Yes** → the name is good enough; do not gold-plate it longer to look more "descriptive." Over-naming is a defect too.
  - **No, it reveals nothing** (`data`, `check`, `d`) → it's a **finding**: rename to reveal intent, disposed fix-now.
  - **No, it actively misleads** (`account_list` that's a dict) → it's a **finding**, and a *higher-priority* one — disinformation costs more than vagueness because the reader trusts it.
- **DEFAULT** on a coin-flip between two acceptable names: pick the **plainer, more boring, more conventional** one — the word the team already uses, the obvious noun/verb — over the cleverer or more "elegant" coinage. Boring names are a feature; the next session predicts them.
- **FALLBACK** when no good name will come: do **not** ship the vague placeholder. Read the failure as the **design diagnostic** above — the thing is probably doing two jobs or sits at the wrong boundary — and route the *reshape* to STAGE 2 / `abstraction-and-design.md` (or `load-bearing` for a module boundary). The name follows the fixed design; it doesn't fix it.

### Where the line sits: craft (plumb) vs. mechanics (flightline)

Naming **as craft** — does the name reveal intent, is the vocabulary consistent, is the length scaled to scope, is it free of encodings and noise — is plumb's, and it is *judgment*, made per name against the "clearer?" test. The **mechanical** layer underneath — the casing convention (`snake_case` vs `camelCase`), the file-naming pattern, the lint rule that enforces a chosen convention codebase-wide — is the `flightline` skill's (lint/format), not plumb's, and not a craft finding. If the only thing "wrong" with a name is its casing, that is a **style opinion** the formatter owns (the AUDIT taxonomy in [decision-tree.md](decision-tree.md)), not a finding to raise here. plumb judges whether the name *means* the right thing; flightline enforces *how it's spelled*.

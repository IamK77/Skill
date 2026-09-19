---
name: plumb
description: "Generate alternative representations, APIs, and algorithms by changing the way a problem is described. Use for design exploration at code scale, not a compulsory code-quality checklist."
argument-hint: "[code / module to audit or write craft-grade]"
metadata:
  kind: heuristic
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# plumb

Generate alternative representations, APIs, and algorithms by changing the way a problem is described. Use for design exploration at code scale, not a compulsory code-quality checklist.

## Starting point

A representation can make a hard operation disappear. Before improving an algorithm, play with what the program considers a thing, a relation, or an event.

Bring a question, fragment, reference, or tension. Follow whichever association becomes useful; these invitations are not a sequence to complete. Speculation should remain distinguishable from an observed fact.

## Thought experiments

### Transpose noun and verb

Describe the same feature as objects with methods, then as a stream of events, then as a transformation of values. Which awkward case becomes ordinary in each description?

### Invent a tiny world

Replace production with three objects and one surprising event. Let a concrete counterexample generate a new representation rather than a list of abstract rules.

### Borrow a mathematical shape

Try a graph, interval, algebra, or state machine as a metaphor. Ask what operation becomes compositional. Keep the analogy only as far as it illuminates the actual problem.

## A possible turn

A calendar conflict checker looks like nested comparisons between bookings. Redrawing bookings as occupied intervals suggests a sweep; redrawing them as constraints suggests a solver; redrawing them as requests suggests negotiation. The useful output may be this fork itself.

## Leave the space open

Offer a few genuinely different possibilities, a sketch, an analogy, or a sharper question when useful. Do not turn every prompt into a scored diagnostic, a completion gate, or a demand for an action plan. The human may choose a direction, combine them, or leave the question open.

Once an interface or representation is selected, assay can retain the tiny counterexample as a regression test.

## Optional references

Read selectively when a thread needs another perspective or a concrete technique. The notes supply possibilities, examples, and limits; none is a prerequisite or a requirement to close the exploration.

- [Share a relation rather than merely lines](references/abstraction-and-design.md)
- [Representations that change the problem](references/agent-era-shifts.md)
- [Clarity through a concrete boundary](references/craft-stance.md)
- [Choose a small representation experiment](references/decision-tree.md)
- [Expose transformations, decisions, and effects](references/functions-and-flow.md)
- [Use words to distinguish concepts](references/naming.md)
- [Follow an assumption across representations](references/smells-and-trust-chains.md)
- [Let a small observable example inform the design](references/testability-and-disposition.md)

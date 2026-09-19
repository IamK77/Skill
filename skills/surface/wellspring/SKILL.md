---
name: wellspring
description: "Generate alternatives for frontend state and interaction models using ownership, time, and representation shifts. Use when the model is awkward, not for a mandatory state audit."
argument-hint: "[the application state / data flow to architect or audit]"
metadata:
  kind: heuristic
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# wellspring

Generate alternatives for frontend state and interaction models using ownership, time, and representation shifts. Use when the model is awkward, not for a mandatory state audit.

## Starting point

State is a claim about what should remain true between moments. Many troublesome variables are clues that the interaction could be imagined differently.

Bring a question, fragment, reference, or tension. Follow whichever association becomes useful; these invitations are not a sequence to complete. Speculation should remain distinguishable from an observed fact.

## Thought experiments

### Tell a value’s biography

Follow a value from creation to display, revision, disagreement, and disappearance. Try changing its author or its lifespan. What copy becomes unnecessary, or suddenly meaningful?

### Replace flags with a story

Narrate a difficult interaction as a small play: scenes, events, interruptions, returns. Sketch a state machine only if that story clarifies the experience.

### Make a fork intentional

Imagine edits as a draft, a branch, a transaction, or a live shared surface. These metaphors imply different save, undo, and conflict behaviours; explore the differences.

## A possible turn

A form keeps mirroring a server record and loses edits during refresh. Calling it a draft instead of a mirror suggests an explicit base revision and a commit. Calling it a live document suggests collaboration and reconciliation. Both are coherent, but serve different experiences.

## Leave the space open

Offer a few genuinely different possibilities, a sketch, an analogy, or a sharper question when useful. Do not turn every prompt into a scored diagnostic, a completion gate, or a demand for an action plan. The human may choose a direction, combine them, or leave the question open.

When a model is selected, keel implements the path and trials protects its visible behaviour.

## Optional references

Read selectively when a thread needs another perspective or a concrete technique. The notes supply possibilities, examples, and limits; none is a prerequisite or a requirement to close the exploration.

- [Several homes for a value](references/classification-tree.md)
- [Channels, composition, and component relationships](references/data-flow-and-component-api.md)
- [Observation, freshness, and a local proposal](references/server-state-and-data-layer.md)
- [Copies with different meanings](references/source-of-truth.md)
- [Interactions as stories with explicit transitions](references/state-machines.md)
- [State as ownership and memory](references/the-membrane.md)

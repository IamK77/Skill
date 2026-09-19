# Interactions as stories with explicit transitions

## Start with a story

Describe an interaction as scenes and events: editing, submitting, receiving a response, retrying, or leaving. Try a state machine if the ordering matters. It is one representation to explore, not a consequence of crossing an arbitrary count of booleans.

## A small candidate

```ts
type Submission =
  | { status: 'editing'; draft: string }
  | { status: 'submitting'; draft: string; requestId: string }
  | { status: 'failed'; draft: string; message: string }
  | { status: 'saved'; value: string };
```

This type excludes some contradictory flag combinations. It does not by itself enforce every transition or validate data arriving from outside the typed program. Model the events and transition function if those are the important boundaries.

## Invent an interruption

What happens if a person edits again during submission? One interpretation locks the draft until acknowledgement. Another creates a new draft while the old one is in flight. A third treats every edit as part of a continuously synchronised document. The state representation follows the selected experience.

## When structure helps

Try a transition table on a small example, including obsolete responses and cancellation. Use a statechart library when hierarchy, parallel states, or tooling make it worthwhile; a discriminated union and a function may be sufficient for a small interaction.

If the desired behaviour is undecided, keep alternatives visible rather than choosing a state representation that silently decides the requirement. Once a direction is selected, trials can retain its awkward event sequence as a regression.

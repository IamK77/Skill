# Copies, authority, and reconciliation

## An opening

Compare replicas to witnesses, notebooks, and work queues. Witnesses may remember different events; notebooks may preserve local edits; a queue suggests custody of unfinished work. Transfer one relation from the metaphor and ask what reconciliation should mean, rather than assuming every copy must behave identically at every instant.

## Elaborate a candidate

Identify what a replica contains, who may write, how changes are propagated, and what happens when histories disagree. A cache, a durable copy, and a multi-writer replica need not make the same promise. Conflict resolution chooses a meaning for concurrent or uncertain work; it is not only a background implementation detail.

## A small comparison

Compare preserving both edits for review, merging a structured operation, and selecting one acknowledged owner for a record. Each can be coherent in a different product. Use a small concurrent-edit story to reveal the difference before committing to a replication mechanism.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

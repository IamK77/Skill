# Which meaning of time does the operation need?

## An opening

Retell an event history from two participants with incompatible clocks. Which relationships depend on physical time, and which depend only on knowing that one event influenced another? A causal view, a deadline view, and a revision-history view can lead to different designs.

## Elaborate a candidate

Separate physical timestamps, elapsed durations, deadlines, logical revisions, and causal relationships. A total ordering chosen by a system may not mean that one real-world event caused another. State the assumptions a time-dependent promise requires and investigate the actual environment when implementing it.

## A small comparison

An audit display may need human-readable times while conflict handling needs a revision relation and a timeout needs elapsed duration. Treating all three as one timestamp can conceal different requirements. Compare a history-oriented design with a deadline-oriented one before choosing the representation.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

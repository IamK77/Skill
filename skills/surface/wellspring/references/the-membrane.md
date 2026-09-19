# State as ownership and memory

## Follow a value through time

Tell the biography of one value: who creates it, who may revise it, what happens when copies disagree, and when it can disappear. Changing the author or lifespan can generate a new interaction model rather than merely reorganise variables.

## Try different meanings of a copy

A cache is a temporary observation, a draft is a proposed change, a snapshot records a time, and a replica participates in a consistency model. They can contain identical fields while having different responsibilities. Duplication is not automatically wrong; an unexplained synchronisation promise is what needs attention.

## Example

A profile form that mirrors a refreshed server record can erase editing intent. Treating the form as a draft suggests a base revision and explicit commit. Treating it as a live shared document suggests conflict handling and reconciliation. The two designs express different experiences.

## Other representations

Try an event history instead of a mutable record, a state machine instead of independent flags, or a URL-addressed workspace instead of an opaque store. Use the technique notes to elaborate an interesting option. Do not turn these invitations into a mandatory inventory or require every question to end with a new state architecture.

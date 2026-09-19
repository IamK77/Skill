# Different useful promises around an operation

## An opening

Borrow reservations, escrow, receipts, or compensation from everyday institutions. “Confirmed immediately,” “reserved until a deadline,” and “accepted pending settlement” are different promises, not implementations of one identical transaction. Explore the promise before selecting its coordination machinery.

## Elaborate a candidate

Clarify what is atomic or isolated, which participants and resources are included, and how failures are recovered. A local transaction does not automatically cover an external side effect. Reservations, compensation, idempotent named requests, and distributed coordination express different semantics and costs rather than interchangeable implementations of one word.

## A small comparison

Compare an immediate confirmed booking with a time-bounded reservation and a request accepted pending settlement. The product experience may make one model more useful. Once a promise is chosen, retain failure examples around its actual boundary instead of claiming universal exactly-once behaviour from one component.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

# Copies with different meanings

## Change the meaning of a copy

A cache, a draft, a snapshot, a materialised view, and a replica may carry similar fields while making different promises. Explore the promise before deciding whether a second copy is accidental duplication.

Ask who may write it, which moment it describes, how long it can be stale, and what happens when it disagrees with another representation. Those questions can suggest a new product behaviour rather than merely reduce variables.

## Example: mirror or draft?

A profile editor copies a server response into local fields. If it promises to remain a mirror, it needs a synchronisation policy that may conflict with editing. If it is a draft, it can record a base revision, preserve local intent, and reconcile explicitly at save. If it is a live shared document, collaboration and conflict handling become part of the experience.

## Example: value or projection?

A filtered list can be computed from items and a filter. Keeping another writable list may introduce an unnecessary synchronisation obligation. A persisted materialised projection, however, can be an intentional performance or availability tradeoff if its update and staleness contracts are explicit.

## Elaborate a chosen direction

Trace writers and consumers for the selected value; identify derived representations and intentional forks. Remove unexplained duplication where it obscures the contract, but do not decree that every fact may exist in only one place. Distributed systems, history, and drafts all need richer models.

The useful creative result might be a change from mirroring to drafting, or from a current value to a history. No exhaustive duplicate-state audit is required to explore that possibility.

# Channels, composition, and component relationships

## Draw a different graph

The visual component tree and the graph of data dependencies need not be identical. Try moving a value's owner, passing a composed child, or exposing a narrower interface. Each changes which components need to know about one another.

## Possible channels

Explicit arguments make dependencies visible. Composition lets a caller supply an already assembled piece. A context-like channel can express a shared environment. A store can coordinate intentionally shared state. Choose according to ownership, update patterns, and testability rather than a universal hierarchy of virtue.

## Example

A toolbar and a result list both need the selected filter. Their parent might own the filter and pass it explicitly. Alternatively, the view may be URL-addressed, or a reusable workspace may own a longer-lived filter model. The choice depends on what navigation and reuse should mean.

## API as a proposal

Compare a component with many configuration flags to one assembled from smaller parts. Composition can expose useful variation, but it can also move too much responsibility to consumers. A configuration object may be appropriate when it describes a real stable concept. Try a representative awkward consumer before extracting a general interface.

## Leave uncertainty explicit

If two consumers disagree about behaviour, do not hide the disagreement in a generic flag until its meaning is clear. An alternative API sketch can be the output of this exploration; there is no requirement to refactor the implementation immediately.

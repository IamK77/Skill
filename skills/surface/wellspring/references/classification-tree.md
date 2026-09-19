# Several homes for a value

## Imagine a different owner

A value may belong to a server record, a URL-addressed view, a local draft, a shared client workspace, or a derivation from existing inputs. These are hypotheses about ownership and lifespan, not a mandatory classification pass over every variable.

## Compare what each home makes possible

- A URL can make a view addressable and revisitable; it is not a place for private or unbounded data merely because sharing is useful.
- Local state can preserve an interaction within a component or workspace; persistence needs a separate lifecycle decision.
- A server cache represents an observation with freshness and invalidation rules; it is not equivalent to an editable authoritative record.
- A derived value can avoid an extra writer and synchronisation obligation.
- A shared store can express intentionally shared client-owned state; its size alone says little about whether the ownership model is good.

## Example

A search filter might be temporary while composing a query, part of a shareable URL once applied, and saved as a named server-side view if it becomes a reusable artifact. The same concept can legitimately occupy different representations at different points in the journey.

## Follow the interesting fork

Sketch what refresh, back/forward, a second tab, or a different participant should mean. A new answer can generate a different workflow. Use the more detailed cache and data-flow notes only when they help elaborate a chosen candidate.

# Observation, freshness, and a local proposal

## An opening

Imagine a server response as a temporary observation, a promise with a freshness limit, and a base for a local draft. Those interpretations suggest different invalidation, reconciliation, and user-feedback models. A cache library can implement one candidate; it should not silently decide what the product means by current or saved.

## Elaborate a candidate

Distinguish a cached server observation from an authoritative server record and from a client-owned draft. Define what freshness, invalidation, retry, optimistic change, and reconciliation mean for a selected journey. A data-layer library can implement parts of that contract but does not choose it on behalf of the product.

## A small comparison

A refreshed record can update a read-only view while an open draft retains its base revision and local intent. Compare that with live shared editing. Keep the ownership and time semantics visible instead of forcing every copy into one undifferentiated store.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

# Partitions that follow a relationship

## An opening

Imagine boundaries drawn around geography, ownership, time, or a social group. Which operations become local, and which relationships now cross a border? A different partition can suggest a different product workflow as well as a different routing function.

## Elaborate a candidate

Choose a candidate partition key and examine the operations it makes local, the relationships it splits, and the workload skew it might create. Rebalancing, routing, and cross-partition operations follow from that choice. Even distribution of identifiers does not necessarily mean even distribution of work.

## A small comparison

Compare partitioning a collaboration product by document, organisation, and time. A large shared document or one active organisation can expose a different hot spot in each design. The exercise may suggest a different workflow or ownership boundary, not just another hash function.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

# Representations that change the problem

## Move between objects, events, and values

Describe the same operation as an object receiving a method, an event extending a history, and a function transforming a value. Each representation exposes different operations and awkward cases. The goal is to notice a useful alternative, not to enforce one paradigm.

## Borrow a shape

A graph makes reachability natural; an interval makes overlap natural; a state machine makes transitions explicit. Ask which relation the problem needs before selecting a container or library. A representation that removes an operation may be more valuable than a faster implementation of it.

## Example

A booking service can compare every pair of reservations, manipulate occupied intervals, or negotiate tentative claims before confirmation. The latter changes the user contract as well as the algorithm. Keep that product choice visible rather than treating it as a hidden optimization.

## Make a tiny counter-world

Try three values and one inconvenient event: duplicate delivery, a missing owner, an overlapping range. Sketch how two representations handle it. If one direction is chosen, retain the tiny example as a test; during exploration, it is a way to generate ideas, not a certificate.

## Abstraction is a possibility, not a reward

A little duplication can preserve useful differences. An abstraction earns its place when it expresses a shared relation and makes relevant changes clearer, not merely when it reduces repeated lines.

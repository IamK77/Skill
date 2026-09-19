# Follow an assumption across representations

## An opening

Follow one value as it crosses from an untrusted representation into a domain concept. Imagine moving the validation boundary, carrying an explicit capability, or returning a different kind of result. Use a smell as an invitation to consider a structure, not as automatic permission to refactor everything nearby.

## Elaborate a candidate

Treat a smell as evidence to investigate, not an automatic defect. Follow a value through parsing, validation, domain use, persistence, and output where relevant. Notice where one component assumes a property another has not established, and explore a boundary or type that makes the assumption explicit.

## A small comparison

A syntactically valid ID may still refer to a record the caller cannot use. A new domain representation can express some validated properties, but policy and runtime inputs still need their responsible checks. An abstraction should not make unobserved trust look established.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

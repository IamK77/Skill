# Share a relation rather than merely lines

## An opening

Keep a small duplication intact, then try two different abstractions over it. One might share mechanism while another shares policy. Notice which future changes each abstraction anticipates and which differences it erases. A useful abstraction expresses a relation; it need not be the shortest version.

## Elaborate a candidate

Distinguish shared mechanism from shared policy. Compare the consumers' expected changes before extracting a common interface, and preserve intentional differences rather than hiding them behind a growing set of flags. Some duplication can be a useful temporary description of unresolved similarity.

## A small comparison

Two parsers may share tokenization while differing in defaults and validation policy. Try sharing only tokenization, then a higher-level interface. A representative third consumer can expose which abstraction actually clarifies the relation instead of just reducing line count.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

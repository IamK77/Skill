# Clarity through a concrete boundary

## An opening

Take a function that feels awkward and describe it as a transformation, a conversation, and a decision with consequences. The different descriptions can reveal a hidden responsibility or a more useful interface. “Clean” should name the relationship made clearer, not an aesthetic verdict about line count.

## Elaborate a candidate

Look for a relation the code currently obscures: who owns a value, what an operation promises, where a representation becomes trusted, or which effect can fail. Explore a small alternative that makes that relation visible. Concision and familiar style can help, but neither is a universal proxy for correctness.

## A small comparison

A helper that validates input, writes state, and sends a message may conceal three different failure boundaries. Sketch those responsibilities separately and compare the recovery story. Splitting the function is useful only if the resulting interfaces express the actual contract.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

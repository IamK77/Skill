# Let a small observable example inform the design

## An opening

Imagine explaining a behaviour with three inputs and one observable result. If that is difficult, try a different boundary or representation before adding elaborate test hooks. The tiny example may suggest a simpler design; it does not require every effect to disappear into a pure function.

## Elaborate a candidate

Try expressing a behaviour through a few meaningful inputs and an observable outcome. If doing so requires replacing most of the implementation, investigate whether the responsibility or effect boundary is wrong. Test seams should expose the contract rather than create a parallel architecture used only by tests.

## A small comparison

A clock or external adapter can be substituted to control a relevant uncertainty while the domain decision remains real. Compare this with mocking every collaborator and asserting only calls. The resulting design idea may be a smaller boundary, not a new testing framework.

## Keep the choice open

Use this note when its question is useful, not as a required inspection. A sketch, a contrast, or an unresolved question can be the result. The [parent lens](../SKILL.md) offers other ways into the subject; execution begins only when a direction and task are chosen.

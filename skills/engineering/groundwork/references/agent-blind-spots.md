# Requirements that are easy to leave implicit

## Ask questions that change the work

A requirement is incomplete when two reasonable implementations would produce different user outcomes and the choice has no owner. Focus questions on those differences rather than asking for every possible detail before making progress.

## Useful distinctions

- Outcome versus suggested implementation: “retain a draft after refresh” is different from “use local storage.”
- Missing value versus explicit absence: deleting a field may mean something different from leaving it unset.
- Permission versus preference: being able to invoke an operation does not establish who may authorise it.
- Normal path versus boundary behaviour: retries, partial success, cancellation, and existing data often determine the real contract.

## Example

“Users can delete a workspace” leaves open whether deletion is reversible, how active jobs are handled, and whether shared resources remain. Ask the decision owner those questions, then write observable examples. Do not choose a retention policy merely because it is easy to implement.

## A small artifact is enough

Keep facts, assumptions, chosen decisions, and open questions distinguishable. A short brief with acceptance examples can be sufficient. If the human is still exploring what the product might be, preserve that exploration rather than forcing an agreement document.

# Robustness around a selected journey

## Identify what interruption means

For the actual interaction, describe loading, empty, success, error, retry, and cancellation where relevant. Decide what user intent should survive a refresh, failed request, or response arriving out of order. Do not add offline or optimistic behaviour unless the product needs it.

## Exercise the vulnerable seams

Try a slow request followed by a changed selection, a repeated submission, a failed retry, and leaving the view before completion. Observe visible outcomes and side effects, not only console messages. Use the cases that fit the journey instead of treating this list as mandatory feature scope.

## Example

A search result for an old query arrives after the new query. The repair may associate responses with request identity or cancel obsolete work. Test that the display corresponds to the current intent; an abort call alone does not establish the result.

## Broader readiness

Exercise keyboard and focus behaviour, semantic accessibility, zoom/reflow, and relevant performance under the agreed environment. Record what was tested and what was not. A scanner or one successful timing sample cannot establish universal readiness.

## Handoff

Retain regressions for the risky cases and document unsupported conditions. Completion belongs to the selected SOP and its stated requirements, not a separate seven-axis inspection.

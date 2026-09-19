# Model the states that matter to the actual task

## Use when

Use a selected data-backed interaction and its observable success, waiting, absence, and failure conditions.

## Method

Distinguish an empty result from unavailable data and an initial load from a refresh when the difference matters. Define what remains visible, which actions are available, and how a person retries or leaves. Add cancellation or partial results only where the contract requires them. Exercise representative transitions rather than checking only static screenshots.

## Example and record

A refreshed list may retain useful prior data while showing that a new request is pending; an initial empty workspace may instead invite a first action. Treating both as the same spinner obscures different meanings. Record the chosen behaviour and a failure-path test.

## Limits and handoff

A four-state label is a starting vocabulary, not an exhaustive state machine or a mandate for four separate components. The product may need fewer or more distinctions.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

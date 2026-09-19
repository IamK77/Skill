# Implement the chosen spatial relationship

## Use when

Use real content, the intended layout relationship, supported viewport conditions, and existing CSS conventions.

## Method

Choose normal flow, flex, grid, or positioning according to the relationship the layout needs to express. Check overflow, minimum sizes, text wrapping, and containment with representative long or missing content. Keep spacing roles understandable and use existing tokens where they express the selected design. Inspect the rendered result rather than only the stylesheet.

## Example and record

A flexible result row with a long identifier may overflow unless its relevant child can shrink or wrap. Test the actual awkward content and narrow viewport rather than fixing only the ideal mockup. Record the observed behaviour and any intentional truncation.

## Limits and handoff

Routine CSS mechanics can be answered directly; they do not require a whole walking-skeleton workflow. A layout rule is not a universal visual style, and a screenshot does not establish keyboard or assistive-technology behaviour.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

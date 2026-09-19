# Designing the responsible control boundary

## Use when

Use a capability, its principals, protected assets, and intended deployment relationships.

## Method

Draw where identity and policy decisions occur relative to side effects. Identify paths that bypass the intended control, including background work, alternate APIs, cached capabilities, and administrative operations. Prefer a small enforceable boundary with enough context to make the decision. Decide how failures and revocation should behave before distributing the policy across consumers.

## Example and record

Moving ownership checks into a shared service can prevent two handlers from implementing different rules, but only if both actually use that boundary and cannot supply a forged trusted principal. Record the call paths and add a bypass-oriented regression.

## Limits and handoff

Centralising policy can introduce coupling or availability concerns; duplicating policy can introduce drift. Select the tradeoff for the real system. A diagram supports review but does not establish that the implementation follows it.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

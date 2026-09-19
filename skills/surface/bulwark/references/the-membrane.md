# Maintainable boundaries and consumers

## Locate a concrete maintenance cost

Start from a dependency violation, repeated defect, inconsistent shared component, or expensive consumer change. Trace the affected users of the boundary before choosing an abstraction or rule.

## Repair and demonstrate

Make the smallest coherent change that addresses the cost. If a new static rule protects it, introduce a representative violation, observe the diagnostic, and restore the code. For behavioural contracts, retain a regression at the appropriate seam.

## Example

A shared button duplicates its visual tokens in multiple packages. Consolidating the token source may help, but the migration also needs to verify consumers that intentionally diverge. A blanket replacement can erase a supported variant rather than repair drift.

## Branches

Do not extract a framework solely because two components look alike. If ownership crosses teams, identify the decision owner instead of silently imposing a local rule. Design-system artifacts from systems are inputs, not a reason to reopen an already selected creative direction.

## Result

Leave a focused change, a meaningful retained check, consumer verification, and migration guidance where necessary. The notes support the existing SOP; they do not introduce additional approvals.

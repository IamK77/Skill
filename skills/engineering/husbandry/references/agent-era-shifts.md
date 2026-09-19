# Maintenance decisions grounded in change cost

## Name the burden before the remedy

A refactor should address a concrete cost: a repeated defect, a change that crosses too many modules, an unsupported dependency, or a boundary that is difficult to test. Line count alone does not determine the appropriate structure.

## Preserve the right behaviour

Use acceptance or characterization examples to separate required behaviour from accidental implementation detail. If a legacy behaviour is itself undesirable, get the product decision rather than quietly changing it under a cleanup label.

## Example

Three consumers duplicate parsing with slightly different defaults. First identify which differences are intentional. Extract a common parser only for the shared contract, then keep consumer-specific policy at the boundary. A single configurable mega-parser may cost more than the duplication it replaces.

## Retire rather than accumulate

When replacing a path, identify consumers, switch them deliberately, and remove the superseded implementation once its compatibility obligation ends. Keep migration notes and version history instead of maintaining two undocumented sources of truth.

## Size the handoff

For a local internal refactor, tests and a focused diff may suffice. A public API or data migration needs consumer guidance, rollout sequencing, and rollback or recovery limits. Report the actual verification, including what was not exercised.

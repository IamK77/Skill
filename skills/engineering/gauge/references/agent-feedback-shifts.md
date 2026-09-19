# Designing a useful feedback loop

## Choose an error class

Static feedback is useful when a diagnostic corresponds to a mistake the project actually wants to prevent. Start with examples: an unchecked variant, an import crossing a boundary, an unhandled result, or an invalid public API use. Different tools observe different properties.

## Demonstrate sensitivity

Introduce one representative violation in a controlled local edit. Confirm that the configured command reports it for the intended reason, restore the file, and run the normal command. A configuration file existing in the repository does not show that CI invokes it or that it covers the relevant files.

## Adopt incrementally

When a stricter rule uncovers substantial existing debt, choose an explicit package or changed-code boundary. Record exclusions and review them when their owners change. Avoid hiding a broad exclusion behind a reassuring command name.

## Example

A module-boundary rule should reject an actual cross-layer import, not merely match a filename convention. Place the violating import in a representative consumer, see the failure, remove it, and keep a regression fixture for the rule itself.

## Know the boundary

Types and lint rules do not by themselves establish runtime authorisation, useful product behaviour, or acceptable performance. Keep those requirements tied to their appropriate behavioural tests and observations.

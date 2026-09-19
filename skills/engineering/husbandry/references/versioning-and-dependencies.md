# Maintain compatibility through a dependency or API change

## Use when

Use current consumers, supported versions, actual resolution files, and the compatibility promise.

## Method

Read the relevant change information and inspect the affected API or behaviour. Test representative consumers and failure paths, update generated artifacts and documentation, and identify migration or rollback constraints. Distinguish an internal implementation change from a change that downstream users can observe.

## Example and record

A dependency update can preserve types while changing serialization or error behaviour. Exercise those contracts rather than relying only on a successful build. Record the resolved versions and the environments actually checked.

## Limits and handoff

Version numbers communicate an intended compatibility policy; they do not prove compatibility. Do not refresh unrelated dependencies or publish a release without the requested scope and authority.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

# Security review choices

## Start from an asset and a reachable action

A useful review begins with something that can be lost: an account boundary, private data, availability, or an administrative capability. Trace one request from untrusted input through identity, policy, and the final side effect. A finding needs a reachable path and realistic prerequisites, not merely a dangerous-looking function name.

## Choose the cheapest safe observation

- For an ownership bug, create two local test principals and demonstrate the cross-owner request against test data.
- For dependency risk, record the resolved dependency version, relevant advisory, reachable feature, and available remediation. A package-name match alone is not an exploit demonstration.
- For a design review without running code, write the abuse scenario and proposed control; label execution evidence as unavailable.

## Repair the responsible boundary

Keep parsing, authentication, authorisation, and side effects distinct enough to test. Reject an invalid request before performing its irreversible effect. Retain a regression that demonstrates the original violation and the repaired behaviour.

## Example

An export endpoint checks that the caller is logged in but accepts an arbitrary account ID. The interesting question is not whether the ID is syntactically valid: it is who may export that account. Exercise a caller-owned export, a second-account export, and the expected rejection. Document whether previously issued export URLs remain accessible after the repair.

## Evidence and limits

Record what was inspected, what was executed, and what remains unknown. Tool availability does not grant permission for production probing. Follow the authorised scope and the current SOP, not an additional review ritual.

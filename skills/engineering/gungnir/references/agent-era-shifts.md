# From security hypothesis to bounded finding

## Distinguish a hypothesis from a finding

A hypothesis connects a capability to a suspected trust-boundary violation: “a tenant user may substitute another tenant's object identifier.” A finding adds a demonstrated reachable path, prerequisites, impact, and reproducible evidence. Keep speculative follow-on impact separate.

## Use a minimal demonstration

Choose local fixtures or a permitted test environment. Prefer proving unauthorised access to a harmless marker over collecting real sensitive data. Define stop conditions before an active test: crossing the target boundary, affecting availability, or encountering unapproved data should stop the action rather than expand the scope.

## Example

A webhook verifier and its body parser may consume different byte representations. Preserve the exact test payload, signature construction, parsing path, and resulting harmless action. A successful reproduction supports a claim about that version and path; it does not show that every deployment is vulnerable.

## Handoff

A useful report contains the target revision, required capabilities, steps, expected versus observed behaviour, affected boundary, and a regression idea. Explain what the proposed repair would and would not prevent. Disclosure and third-party contact are separate authorised actions; a prepared report is not permission to send it.

# A threat model tied to an actual boundary

## Use when

Use the system or change under review, protected assets, principals, deployment context, and authorised investigation scope. An existing architecture diagram can help, but completing another skill is not a prerequisite.

## Method

1. Describe the relevant data and control flow: entry points, processing, storage, identities, and side effects. Mark places where ownership, privileges, or trust assumptions change.
2. Write plausible abuse paths with their prerequisites and consequences. A category prompt such as spoofing, tampering, repudiation, information disclosure, denial of service, or privilege escalation can help expose a missing question. It is not a proof of exhaustive coverage or a required traversal for every small change.
3. Prioritise using the actual asset value, reachability, likely actors, and impact. Keep uncertainty visible rather than assigning unexplained precise risk scores.
4. Map the important paths to a control, a verification method, or an explicitly unresolved risk with an owner. Revisit the model when the relevant design or deployment assumptions change.

## Example and record

For a document-export feature, trace the request principal, account selection, export worker, stored artifact, and download capability. A valid account identifier is not an ownership check. A correctly authorised request also does not establish that an old download link is revoked when permissions change.

The useful artifact is a small diagram and threat record connecting each material path to its prerequisites, consequence, proposed or implemented control, and observed verification. A design-only review should label controls as proposals rather than completed repairs.

## Limits and handoff

Threat modelling can reveal an inexpensive design change, but it does not guarantee that prevention is cheap or that all threats have been found. Active investigation still needs explicit scope and authority. The [current aegis workflow](../SKILL.md) records the selected review; this note adds a technique, not a separate approval gate.

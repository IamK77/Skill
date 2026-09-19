# Tests that observe the wrong thing

## Diagnose the assertion, not the author

A test can pass while the feature is broken when it checks a mock instead of the implementation, repeats the implementation's calculation, or observes an internal detail unrelated to the requirement. The useful question is which concrete defect the test can detect.

## Typical repairs

- Replace “the handler was called” with the relevant visible state or persisted effect when that is the contract.
- Keep external boundaries substitutable, but validate the double's request and response against the actual contract.
- Exercise a negative case rather than asserting only that a success object exists.
- Prefer a representative integration path over many isolated tests that all assume the seam is correct.

## Example

A permission test stubs the authorisation function to return true, then expects a successful response. That protects response wiring but not authorisation. Add a test with real policy evaluation and two owners, showing that substituting the other owner's object is rejected.

## Demonstrate that the check matters

Observe the regression fail on the target defect. If the implementation already works, apply a controlled fault, verify that the assertion complains, and restore exactly. A failure in setup is not evidence that the behavioural assertion is sensitive.

## Keep the useful tests

Remove redundant fixtures and irrelevant internal assertions, not hard cases simply because they fail. Preserve a failing case when it exposes an unresolved requirement or defect; report the limitation instead of turning it into a success condition.

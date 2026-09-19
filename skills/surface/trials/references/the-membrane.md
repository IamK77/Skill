# Choose tests around observable risk

## Start with a failure someone would notice

Name the outcome the test protects and choose a level that can observe it. Pure logic can be tested directly; component and state interactions often need integration; critical journeys may need a browser path. No universal distribution of test counts determines the right coverage.

## Keep the subject real

Substitute an external boundary when that makes a test deterministic, but verify the double against the actual contract. Avoid replacing the behaviour you intend to test. Realistic response fields and failure cases matter more than a large fixture collection.

## Example

To protect a stale-search-result bug, control two responses and deliver them in reverse order. Assert that the current query's result remains visible. Asserting a particular hook call or internal counter needlessly couples the test to one implementation.

## Check sensitivity and upkeep

See the test fail on the relevant defect, restore the intended implementation, and run the affected suite. Prefer assertions that survive a legitimate internal rewrite. Keep difficult cases that matter; remove redundant fixtures and irrelevant assertions.

## Result

Leave the regression, deterministic setup, and a clear execution record. Behavioural, visual, and accessibility checks complement one another; none should be described as an independent proof of all frontend quality.

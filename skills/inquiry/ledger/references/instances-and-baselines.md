# Choose data and baselines for the stated population

## Use when

Use the claim's intended population, available data, established comparison methods, and tuning constraints.

## Method

Define the unit of observation and relevant variation before selecting instances. Keep training, development, and evaluation roles distinct. Choose baselines that address the actual claim and give them a documented reasonable tuning and resource protocol. Record exclusions, unavailable implementations, and any mismatch in supported conditions.

## Example and record

A method intended for larger instances should be evaluated across the relevant size regime, not only where its preferred baseline fails to run. If a baseline requires an adaptation, describe and validate it rather than silently weakening the comparison.

## Limits and handoff

A benchmark is evidence about a population and protocol, not a universal ranking. Avoid treating convenience samples, popularity, or one leaderboard as complete coverage of the research question.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

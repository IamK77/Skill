# Make a maintenance tradeoff inspectable

## Use when

Use a concrete recurring cost, risk, or blocked change rather than a general dislike of the code.

## Method

Describe the present burden, the likely future situations that incur it, and a plausible repair. Compare that work with the cost of deferral and the risk of the repair itself. Identify an owner and a useful revisit trigger where the issue is intentionally deferred. Keep estimates and uncertainty visible.

## Example and record

An abstraction may save repeated changes across three consumers, but it may also bind consumers whose policies are diverging. A short trial or one representative migration can test the expected benefit before a broad rewrite. Record the observation rather than only a debt score.

## Limits and handoff

Age, duplication, and unfamiliarity are signals to investigate, not automatic debt. Avoid numerical rankings that conceal incomparable assumptions or turn every imperfect module into mandatory roadmap work.

Use the [current skill workflow](../SKILL.md) for the selected task and its completion conditions. This reference adds technique, not a separate run or mandatory stage.

// core-stats.test.mjs — the statistics + orchestration primitives. Oracle: mathematical
// identities that MUST hold for any input (a paired delta is by definition the mean of the
// paired differences; a bounded-concurrency map must preserve order and length).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pairedSummary, mapPool, isDegenerate, mean, stdev } from "../core.mjs";

const approx = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test("pairedSummary: meanDelta is exactly mean(skill) − mean(base)", () => {
  const pairs = [{ skill: 8, base: 5 }, { skill: 6, base: 6 }, { skill: 7, base: 4 }, { skill: 3, base: 5 }];
  const s = pairedSummary(pairs);
  approx(s.meanDelta, s.skillMean - s.baseMean);
});

test("pairedSummary: win/tie/loss partition sums to n", () => {
  const pairs = [{ skill: 8, base: 5 }, { skill: 6, base: 6 }, { skill: 4, base: 7 }, { skill: 7, base: 4 }];
  const s = pairedSummary(pairs);
  assert.equal(s.wins + s.ties + s.losses, s.n);
  assert.equal(s.wins, 2);
  assert.equal(s.ties, 1);
  assert.equal(s.losses, 1);
});

test("pairedSummary: non-finite pairs are filtered out of n", () => {
  const pairs = [{ skill: 8, base: 5 }, { skill: NaN, base: 5 }, { skill: 7, base: undefined }];
  const s = pairedSummary(pairs);
  assert.equal(s.n, 1, "only the one fully-finite pair counts");
});

test("pairedSummary: n<2 yields NaN CI flagged as crossing zero", () => {
  const s = pairedSummary([{ skill: 8, base: 5 }]);
  assert.ok(Number.isNaN(s.ciLo) && Number.isNaN(s.ciHi));
  assert.equal(s.crossesZero, true, "a CI we cannot compute must NOT read as a clean signal");
});

test("pairedSummary: deterministic — same seed, identical bootstrap CI", () => {
  const pairs = [{ skill: 8, base: 5 }, { skill: 6, base: 6 }, { skill: 7, base: 4 }, { skill: 5, base: 6 }];
  const a = pairedSummary(pairs, { seed: 1 });
  const b = pairedSummary(pairs, { seed: 1 });
  assert.equal(a.ciLo, b.ciLo);
  assert.equal(a.ciHi, b.ciHi);
});

test("pairedSummary: a unanimous +2 delta gives a CI that excludes 0", () => {
  const pairs = [{ skill: 7, base: 5 }, { skill: 8, base: 6 }, { skill: 6, base: 4 }, { skill: 9, base: 7 }];
  const s = pairedSummary(pairs);
  approx(s.meanDelta, 2);
  assert.equal(s.crossesZero, false);
  assert.ok(s.ciLo > 0, "lower bound of an all-positive delta should be > 0");
});

test("mean/stdev: edge behavior", () => {
  assert.ok(Number.isNaN(mean([])), "mean of empty is NaN");
  assert.equal(stdev([5]), 0, "sample sd of one point is 0, not NaN");
  approx(stdev([2, 4, 4, 4, 5, 5, 7, 9]), 2.138089935299395, 1e-9);
});

// ── mapPool: bounded-concurrency map MUST preserve input order & length ──────────
test("mapPool: output is in INPUT order even when later items finish first", async () => {
  const items = [0, 1, 2, 3, 4, 5];
  // later items resolve after FEWER microtask ticks → they complete first; a correct
  // impl still writes out[idx], so order is preserved regardless of completion order.
  const out = await mapPool(items, 3, async (x) => {
    for (let i = 0; i < x; i++) await Promise.resolve();
    return x * 10;
  });
  assert.deepEqual(out, [0, 10, 20, 30, 40, 50]);
});

test("mapPool: each item's fn is invoked EXACTLY once (no double-processing)", async () => {
  const items = [...Array(20).keys()];
  const calls = new Array(items.length).fill(0);
  const out = await mapPool(items, 4, async (x, i) => { calls[i]++; return x; });
  assert.deepEqual(out, items, "length and order");
  assert.ok(calls.every((c) => c === 1), `every item processed once: ${calls}`);
});

test("mapPool: never exceeds the concurrency limit in flight", async () => {
  let inFlight = 0, maxSeen = 0;
  await mapPool([...Array(30).keys()], 5, async () => {
    inFlight++; maxSeen = Math.max(maxSeen, inFlight);
    await Promise.resolve(); await Promise.resolve();
    inFlight--;
  });
  assert.ok(maxSeen <= 5, `peak in-flight ${maxSeen} exceeded limit 5`);
});

test("mapPool: empty input returns an empty array (no hang, no spurious worker)", async () => {
  assert.deepEqual(await mapPool([], 8, async () => { throw new Error("must not run"); }), []);
});

// ── isDegenerate: the gatekeeper deciding which cells enter the mean ─────────────
test("isDegenerate: an incomplete run is degenerate no matter how long", () => {
  const longText = "x".repeat(5000);
  assert.equal(isDegenerate(longText, { complete: false }).degenerate, true);
});

test("isDegenerate: short reviews are degenerate, at the right boundary", () => {
  assert.equal(isDegenerate("x".repeat(119), { minChars: 120 }).degenerate, true, "119 < 120 → degenerate");
  assert.equal(isDegenerate("x".repeat(120), { minChars: 120 }).degenerate, false, "120 is the floor → kept");
});

test("isDegenerate: complete defaults to true when omitted", () => {
  assert.equal(isDegenerate("x".repeat(200)).degenerate, false, "long + default-complete → kept");
});

test("isDegenerate: null / whitespace-only review is degenerate", () => {
  assert.equal(isDegenerate(null).degenerate, true);
  assert.equal(isDegenerate("    \n\t  ").degenerate, true, "trims to empty");
});

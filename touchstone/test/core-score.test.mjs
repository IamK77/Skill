// core-score.test.mjs — the score-composition functions, the highest-blast-radius code
// in the bench: a wrong number here silently corrupts every A/B conclusion.
//
// Oracle: the documented composition tables in core.mjs (combineScore + scoreFromQuality
// headers). The input spaces are tiny, so we ENUMERATE exhaustively rather than sample —
// no input escapes the check.
import { test } from "node:test";
import assert from "node:assert/strict";
import { combineScore, scoreFromQuality } from "../core.mjs";

const VERDICTS = ["correct", "partial", "miss", "inverted"];

test("combineScore: every q×verdict result stays in [0,10]", () => {
  for (let q = 0; q <= 10; q++) {
    for (const v of [...VERDICTS, "unknown", undefined]) {
      const s = combineScore(q, { verdict: v });
      assert.ok(s >= 0 && s <= 10, `combineScore(${q}, ${v}) = ${s} out of [0,10]`);
    }
  }
});

test("combineScore: matches the documented verdict→adjustment table", () => {
  // spec: correct → +1 ONLY if q>=4 (else no lift); partial −1; miss −3; inverted −4; clamp 0..10
  const expected = (q, v) => {
    let s = q;
    if (v === "correct") s = q >= 4 ? q + 1 : q;
    else if (v === "partial") s = q - 1;
    else if (v === "miss") s = q - 3;
    else if (v === "inverted") s = q - 4;
    return Math.max(0, Math.min(10, s));
  };
  for (let q = 0; q <= 10; q++)
    for (const v of VERDICTS)
      assert.equal(combineScore(q, { verdict: v }), expected(q, v), `q=${q} v=${v}`);
});

test("combineScore: load-bearing anchors", () => {
  assert.equal(combineScore(8, { verdict: "miss" }), 5, "a polished review that missed the bug loses 3");
  assert.equal(combineScore(2, { verdict: "correct" }), 2, "ungrounded review (q<4) gets NO lift from a 'correct' catch (C3)");
  assert.equal(combineScore(4, { verdict: "correct" }), 5, "grounded review (q>=4) is lifted by a correct catch");
  assert.equal(combineScore(10, { verdict: "correct" }), 10, "lift never pushes past 10");
  assert.equal(combineScore(1, { verdict: "inverted" }), 0, "inverted penalty floors at 0, never negative");
});

test("combineScore: unknown/missing verdict is treated as a miss, never NaN", () => {
  assert.equal(combineScore(8, {}), 5, "no verdict → miss (−3)");
  assert.equal(combineScore(8, null), 5, "null catch → miss (−3)");
  assert.ok(Number.isFinite(combineScore(NaN, { verdict: "correct" })), "NaN quality coerces to a finite score");
  assert.equal(combineScore(NaN, { verdict: "miss" }), 0, "NaN quality → 0, then −3 clamps to 0");
});

test("combineScore: pure — same args, same result", () => {
  assert.equal(combineScore(7, { verdict: "partial" }), combineScore(7, { verdict: "partial" }));
});

// ── scoreFromQuality: exhaustive over all 2^6 judgment combinations ──────────────
const YN = ["yes", "no"];
function* allJudgments() {
  for (const grounded of YN) for (const real of YN) for (const multiple of YN)
    for (const concrete of YN) for (const depth of YN) for (const harmful of YN)
      yield { grounded, real, multiple, concrete, depth, harmful };
}

test("scoreFromQuality: every one of the 64 combinations lands in [0,8]", () => {
  // NOTE the floor is 0, not 2: the harmful penalty (−3, floored at 0) applies AFTER the
  // band, so a grounded+real+shallow+harmful review legitimately scores 1. The 8 ceiling is
  // 5(deep)+1(multiple)+2(concrete). The exact-spec test below pins each cell precisely.
  for (const g of allJudgments()) {
    const s = scoreFromQuality(g);
    assert.ok(s >= 0 && s <= 8, `${JSON.stringify(g)} → ${s} out of [0,8]`);
  }
});

test("scoreFromQuality: a harmful real review can score BELOW ungrounded boilerplate (intended)", () => {
  // The harm override is the whole point — actively wrong advice is worse than vacuous
  // advice. This pins that ordering so a future 'cleanup' doesn't silently lift it.
  const harmfulShallow = scoreFromQuality({ grounded: "yes", real: "yes", multiple: "no", concrete: "yes", depth: "no", harmful: "yes" });
  const boilerplate = scoreFromQuality({ grounded: "no" });
  assert.equal(harmfulShallow, 1, "grounded+real+shallow+harmful = 4−3 = 1");
  assert.equal(boilerplate, 2, "ungrounded boilerplate = 2");
  assert.ok(harmfulShallow < boilerplate, "harmful advice ranks below mere boilerplate — by design");
});

test("scoreFromQuality: matches the documented branch composition", () => {
  const yes = (v) => String(v ?? "").toLowerCase() === "yes";
  const spec = (g) => {
    if (!yes(g.grounded)) return 2;
    if (!yes(g.real)) return yes(g.concrete) ? 4 : 3;
    let s;
    if (!yes(g.depth)) s = yes(g.multiple) ? 5 : 4;
    else { s = 5; if (yes(g.multiple)) s += 1; if (yes(g.concrete)) s += 2; }
    if (yes(g.harmful)) s = Math.max(0, s - 3);
    return s;
  };
  for (const g of allJudgments())
    assert.equal(scoreFromQuality(g), spec(g), JSON.stringify(g));
});

test("scoreFromQuality: anchors + robustness to missing/odd input", () => {
  assert.equal(scoreFromQuality({}), 2, "no judgments → ungrounded → 2");
  assert.equal(scoreFromQuality({ grounded: "yes", real: "no", concrete: "yes" }), 4, "cosmetic-but-concrete → 4");
  assert.equal(scoreFromQuality({ grounded: "yes", real: "no", concrete: "no" }), 3, "cosmetic only → 3");
  assert.equal(scoreFromQuality({ grounded: "yes", real: "yes", depth: "yes", multiple: "yes", concrete: "yes" }), 8, "deep+broad+concrete → the 8 ceiling");
  assert.equal(scoreFromQuality({ grounded: "yes", real: "yes", depth: "yes" }), 5, "deep but single+vague → 5");
  assert.equal(scoreFromQuality({ grounded: "YES", real: "Yes", depth: "yes", concrete: "yes" }), 7, "case-insensitive yes; deep+concrete → 7");
});

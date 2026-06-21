#!/usr/bin/env node
// run-harness-ab.mjs — the GATED-WORKFLOW A/B (the headless twin of the web bench).
//
// The question: does running a skill as its REAL, multi-turn gated checklist workflow beat NOT
// having the skill — with compute held equal (same nav tools, same turn ceiling) so a win isn't
// just "more turns to think"?
//
//   • skill arm   = runHarness (harness.mjs): the model works the skill's gated stages
//                   in order, pulling references on demand, one stage per turn, then
//                   writes the consolidated review.
//   • baseline    = runNavReview (harness.mjs): the SAME nav tools and turn ceiling, but
//                   NO skill — the agent navigates freely and stops when it judges the
//                   review done (agent-paced, NOT a forced turn count).
//   • grade       = gradeQuality (v2): decomposed factual y/n → code-composed score, BLIND to the
//                   diff (so it can't anchor on the maintainer's spot); ref-overlap recorded separately.
//   • catch       = gradeCatch: a SEPARATE, diff/answer-key-AWARE, direction-aware probe — did the
//                   review correctly DIAGNOSE the planted bug (correct / partial / inverted / miss)?
//                   It NEVER touches the quality grader (which stays blind); the FINAL score is
//                   combineScore(quality, catch) — composed in code, so getting the bug right/wrong/
//                   inverted moves the number that the paired stats below consume.
//
// So both arms cost ~K model calls; the only difference is the skill (its content AND
// its gated structure). This measures the skill the way it actually runs.
//
// Provider from env — ANTHROPIC FORMAT recommended (explicit prompt caching of the big
// turn-stable SKILL.md system block; the [cache] log shows hits):
//   LAB_FLAVOR=anthropic LAB_BASE_URL=https://api.deepseek.com/anthropic \
//   LAB_API_KEY=sk-... LAB_MODEL=deepseek-chat \
//   node run-harness-ab.mjs --skill surface/wellspring --trials 1
//
// Point the grader at a DIFFERENT model with LAB_GRADER_* so reviewer and grader don't
// share a blind spot. Start with --trials 1 as a cost probe; the [cache] lines + the
// per-trial token logs let you extrapolate before committing to more trials.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { runHarness, runNavReview } from "./harness.mjs";
import { gradeQuality, gradeReferenceOverlap, gradeFalsePositive, gradeCatch, combineScore, isDegenerate, pairedSummary, mean, stdev } from "./core.mjs";
import { loadSkillStructured, loadFixtures, loadProfile, providerConfigs, providerLabel } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, ".."); // touchstone/ sits at the repo root

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const SKILL = val("--skill", "surface/wellspring");
const TRIALS = Number(val("--trials", 1));
const WITH_FP = has("--fp");
const MAXTOK = Number(val("--max-tokens", process.env.LAB_MAX_TOKENS || 8000));
const MAXTURNS = Number(val("--max-turns", 28));

const { cfg, grader } = providerConfigs(process.env);
const callModel = makeCallModel(cfg);
const callGrade = makeCallModel(grader);

const skill = loadSkillStructured(repoRoot, SKILL);
const profile = loadProfile(here, SKILL);
const allFixtures = loadFixtures(here, SKILL);
const FIXTURE = val("--fixture", null);
// --fixture pins one; otherwise run EVERY fixture (F6: more fixtures → the delta isn't a
// single-bug artifact). The paired stats pool across all fixture×trial cells.
const fixtures = FIXTURE ? allFixtures.filter((f) => f.id === FIXTURE) : allFixtures;
if (!fixtures.length) { console.error(`no fixture${FIXTURE ? " " + FIXTURE : ""}; have: ${allFixtures.map((f) => f.id).join(", ")}`); process.exit(1); }

const domain = profile.domain || "architecture";
const system = profile.reviewSystem;

// F5/C4: a run can come back EMPTY (over-navigation -> empty synthesis) OR truncated (ran out the
// turn cap mid-navigation). The stats summary must NOT silently average such a cell — we DETECT, LOG,
// and COUNT them via the shared isDegenerate (length OR not-`complete`), then report what was dropped.
// Fixture-agnostic: keys on review length / completion, not on this bug.
const MIN_REVIEW_CHARS = Number(val("--min-review-chars", 200));

console.log(`\n  GATED-WORKFLOW A/B  —  skill-as-workflow  vs  equal-compute skill-free baseline`);
console.log(`  skill:    ${SKILL}   stages: ${skill.checklist.phases.map((p) => p.name).join(" → ")}`);
console.log(`  fixtures: ${fixtures.map((f) => f.id).join(", ")}   (${fixtures.length} × ${TRIALS} trials = ${fixtures.length * TRIALS} paired cells)`);
console.log(`  provider: ${providerLabel(cfg)}   grader: ${providerLabel(grader)}`);
console.log(`  trials:   ${TRIALS}/fixture   FP control: ${WITH_FP ? "on" : "off"}   max turns/tokens: ${MAXTURNS}/${MAXTOK}\n`);

const tick = (s) => process.stderr.write(s + "\n");
const rows = [];
const dropped = [];   // F5/C4: degenerate cells we excluded from the means — logged & counted, never silent

for (const fx of fixtures) {
 tick(`\n  ══ fixture ${fx.id} (before ${fx.before.length} chars) ══`);
 for (let t = 1; t <= TRIALS; t++) {
  tick(`  trial ${t}: skill arm (gated workflow)…`);
  const sk = await runHarness({
    callModel, skill, code: fx.before, domain, system, skillName: SKILL,
    maxTurns: MAXTURNS, maxTokens: MAXTOK,
    onEvent: (e) => tick(`      · ${e.type || e.phase}${e.turn ? " t" + e.turn : ""}${e.name ? " " + e.name : ""}${e.phase && e.type ? " " + e.phase : ""}`),
  });
  const K = sk.turns;
  tick(`    → ${K} turns, ${sk.navCalls} nav-calls; gates ${sk.gatesCleared.length}/${skill.checklist.phases.length} (${sk.gatesCleared.join(",") || "none"}); refs: ${sk.refsOpened.map((r) => r.name).join(", ") || "none"}; complete=${sk.complete}`);

  tick(`  trial ${t}: baseline (skill-free, navigates freely up to the same ceiling)…`);
  const bl = await runNavReview({ callModel, code: fx.before, domain, system, maxTurns: MAXTURNS, maxTokens: MAXTOK });
  tick(`    → ${bl.turns} turns, ${bl.navCalls} nav-calls (agent decided when done)`);

  tick(`  trial ${t}: grading both (v2 quality — decomposed factual y/n, blind to the diff)…`);
  const gSkill = await gradeQuality({ callGrade, code: fx.before, review: sk.review, domain, depthCriteria: profile.depthCriteria });
  const gBase = await gradeQuality({ callGrade, code: fx.before, review: bl.review, domain, depthCriteria: profile.depthCriteria });
  // F1/F2: CATCH — a SEPARATE, answer-key-aware, direction-aware grade (correct/partial/inverted/miss).
  // It sees fx.diff + the per-fixture fx.catch_key (so the bug shape stays out of grader code, C1) and
  // NEVER touches gradeQuality (the quality grader stays blind, C2). Composed into the final score below.
  const catchKey = fx.catch_key || null;
  const catchSkill = await gradeCatch({ callGrade, diff: fx.diff, review: sk.review, domain, catchKey }).catch(() => ({ verdict: "miss", grounded: false, why: "catch grade errored" }));
  const catchBase = await gradeCatch({ callGrade, diff: fx.diff, review: bl.review, domain, catchKey }).catch(() => ({ verdict: "miss", grounded: false, why: "catch grade errored" }));
  // FINAL score = quality (diff-blind) composed with catch (answer-key-aware), IN CODE. This is what
  // the paired stats consume, so a missed/inverted diagnosis actually costs and a grounded correct one pays.
  const finalSkill = combineScore(gSkill.score, catchSkill);
  const finalBase = combineScore(gBase.score, catchBase);
  // reference overlap — recorded for analysis, NOT scored (does the skill push the review off the maintainer's spot?)
  const ovSkill = await gradeReferenceOverlap({ callGrade, diff: fx.diff, review: sk.review, domain }).catch(() => ({ overlap: "—" }));
  const ovBase = await gradeReferenceOverlap({ callGrade, diff: fx.diff, review: bl.review, domain }).catch(() => ({ overlap: "—" }));

  let fpSkill = null, fpBase = null;
  if (WITH_FP) {
    tick(`  trial ${t}: false-positive control (review the already-fixed code)…`);
    const skFP = await runHarness({ callModel, skill, code: fx.after, domain, system, skillName: SKILL, maxTurns: MAXTURNS, maxTokens: MAXTOK });
    const blFP = await runNavReview({ callModel, code: fx.after, domain, system, maxTurns: MAXTURNS, maxTokens: MAXTOK });
    fpSkill = (await gradeFalsePositive({ callGrade, diff: fx.diff, review: skFP.review, domain })).falsePositive;
    fpBase = (await gradeFalsePositive({ callGrade, diff: fx.diff, review: blFP.review, domain })).falsePositive;
  }

  // F5/C4: flag (don't silently average) degenerate empties. A flagged cell stays in
  // `rows` (full transparency in the raw JSON) but is EXCLUDED from the means/paired stats,
  // and the exclusion is logged + counted in the summary.
  const skillDegenerate = isDegenerate(sk.review, { minChars: MIN_REVIEW_CHARS, complete: sk.complete }).degenerate;
  const baseDegenerate = isDegenerate(bl.review, { minChars: MIN_REVIEW_CHARS, complete: bl.complete }).degenerate;
  const excluded = skillDegenerate || baseDegenerate;  // pairing: drop the PAIR if either arm is degenerate
  if (excluded) {
    dropped.push({ fixture: fx.id, trial: t, skillChars: sk.review.trim().length, baseChars: bl.review.trim().length, skillDegenerate, baseDegenerate });
    tick(`    ⚠ DEGENERATE cell excluded (skill ${sk.review.trim().length}c${skillDegenerate ? " <empty>" : ""}, base ${bl.review.trim().length}c${baseDegenerate ? " <empty>" : ""}) — counted in dropped[], not averaged`);
  }

  rows.push({
    // skill/base are the FINAL composed scores (quality ∘ catch) — what the paired stats consume.
    fixture: fx.id, trial: t, skill: finalSkill, base: finalBase, excluded,
    skillDegenerate, baseDegenerate,
    // raw quality kept separately so the composition is auditable (catch did/didn't move it):
    skillQuality: gSkill.score, baseQuality: gBase.score,
    skillCatch: catchSkill.verdict, baseCatch: catchBase.verdict,
    skillCatchGrounded: catchSkill.grounded, baseCatchGrounded: catchBase.grounded,
    skillJudgments: gSkill.judgments, baseJudgments: gBase.judgments,
    skillOverlap: ovSkill.overlap, baseOverlap: ovBase.overlap,
    skillTurns: K, skillNav: sk.navCalls, baseTurns: bl.turns, baseNav: bl.navCalls,
    gatesCleared: sk.gatesCleared, refsOpened: sk.refsOpened, complete: sk.complete,
    fpSkill, fpBase, skillReview: sk.review, baseReview: bl.review,
  });
  const d = finalSkill - finalBase;
  console.log(`  ${fx.id} t${t}: skill ${finalSkill.toFixed(1)}/10 (q${gSkill.score.toFixed(0)}·catch:${catchSkill.verdict})  vs  baseline ${finalBase.toFixed(1)}/10 (q${gBase.score.toFixed(0)}·catch:${catchBase.verdict})   (Δ ${(d >= 0 ? "+" : "") + d.toFixed(1)})${excluded ? "  [EXCLUDED: degenerate]" : ""}`);
  console.log(`        compute — skill: ${K} turns / ${sk.navCalls} nav · gates ${sk.gatesCleared.length}/${skill.checklist.phases.length} · ref-overlap ${ovSkill.overlap}   |   baseline: ${bl.turns} turns / ${bl.navCalls} nav · ref-overlap ${ovBase.overlap}`);
 }
}

// F6: pair WITHIN each trial (same fixture, same compute cap, same run) and report
// per-arm spread + a CI on the paired delta — not a bare difference of two means.
const kept = rows.filter((r) => !r.excluded);
const paired = pairedSummary(kept.map((r) => ({ skill: r.skill, base: r.base })));
const fmt = (x) => (Number.isFinite(x) ? x.toFixed(2) : "—");
const signed = (x) => (x >= 0 ? "+" : "") + fmt(x);

console.log(`\n  === result over ${fixtures.length} fixture(s) × ${TRIALS} trial(s) — ${paired.n} paired cell(s)${dropped.length ? `, ${dropped.length} excluded` : ""} ===`);
console.log(`  skill-as-workflow:    mean ${fmt(paired.skillMean)}/10   sd ${fmt(paired.skillSd)}`);
console.log(`  skill-free baseline:  mean ${fmt(paired.baseMean)}/10   sd ${fmt(paired.baseSd)}`);
console.log(`  WITHIN-RUN paired Δ:  ${signed(paired.meanDelta)}  (sd ${fmt(paired.sd)}, se ${fmt(paired.se)})`);
console.log(`  ${Math.round(paired.ci * 100)}% bootstrap CI on Δ:  [${signed(paired.ciLo)}, ${signed(paired.ciHi)}]  →  ${paired.crossesZero ? "CROSSES 0 (not distinguishable from noise — need more n/fixtures)" : "excludes 0 (directional signal)"}`);
console.log(`  paired win/tie/loss:  ${paired.wins}/${paired.ties}/${paired.losses}   (skill-beats-base win-rate ${Number.isFinite(paired.winRate) ? Math.round(paired.winRate * 100) + "%" : "—"})`);
if (dropped.length) console.log(`  EXCLUDED (degenerate, < ${MIN_REVIEW_CHARS} chars): ${dropped.map((d) => `${d.fixture}/t${d.trial}`).join(", ")}`);

// F2: the catch verdict is the single most discriminating signal — surface its distribution per arm.
const catchDist = (k) => {
  const order = ["correct", "partial", "miss", "inverted"];
  const c = Object.fromEntries(order.map((v) => [v, kept.filter((r) => r[k] === v).length]));
  return order.map((v) => `${v} ${c[v]}`).join(" · ");
};
console.log(`  CATCH (diagnose planted bug) — skill: ${catchDist("skillCatch")}`);
console.log(`                                base:  ${catchDist("baseCatch")}`);

// Per-fixture breakdown so a pooled delta can't hide a single fixture driving it (F6/C1).
if (fixtures.length > 1) {
  console.log(`\n  per-fixture paired Δ:`);
  for (const f of fixtures) {
    const ps = pairedSummary(kept.filter((r) => r.fixture === f.id).map((r) => ({ skill: r.skill, base: r.base })));
    console.log(`    ${f.id}: Δ ${signed(ps.meanDelta)}  (n ${ps.n}, win ${ps.wins}/${ps.n}, skill ${fmt(ps.skillMean)} vs base ${fmt(ps.baseMean)})`);
  }
}

if (WITH_FP) {
  const fpRate = (k) => { const v = kept.map((r) => r[k]).filter((x) => x != null); return v.length ? `${Math.round(100 * v.filter(Boolean).length / v.length)}%` : "—"; };
  console.log(`  false-positive (cry-wolf):  skill ${fpRate("fpSkill")}  vs  baseline ${fpRate("fpBase")}`);
}

const perFixture = Object.fromEntries(fixtures.map((f) => {
  const ps = pairedSummary(kept.filter((r) => r.fixture === f.id).map((r) => ({ skill: r.skill, base: r.base })));
  return [f.id, ps];
}));
const outFile = path.join(here, "last-harness-ab.json");
fs.writeFileSync(outFile, JSON.stringify({
  skill: SKILL, fixtures: fixtures.map((f) => f.id), provider: providerLabel(cfg), grader: providerLabel(grader),
  trials: TRIALS, paired, perFixture, dropped, minReviewChars: MIN_REVIEW_CHARS,
  // kept for back-compat with downstream readers (grader-variance-test, etc.):
  fixture: fixtures[0].id, mSkill: paired.skillMean, mBase: paired.baseMean, delta: paired.meanDelta, rows,
}, null, 2));
console.log(`\n  raw (incl. full reviews, per-fixture stats, dropped[]) → ${path.relative(repoRoot, outFile)}\n`);

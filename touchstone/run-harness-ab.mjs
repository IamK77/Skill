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
import { gradeQuality, gradeReferenceOverlap, gradeFalsePositive } from "./core.mjs";
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
const fixtures = loadFixtures(here, SKILL);
const FIXTURE = val("--fixture", null);
const fx = FIXTURE ? fixtures.find((f) => f.id === FIXTURE) : fixtures[0];
if (!fx) { console.error(`no fixture${FIXTURE ? " " + FIXTURE : ""}; have: ${fixtures.map((f) => f.id).join(", ")}`); process.exit(1); }

const domain = profile.domain || "architecture";
const system = profile.reviewSystem;

console.log(`\n  GATED-WORKFLOW A/B  —  skill-as-workflow  vs  equal-compute skill-free baseline`);
console.log(`  skill:    ${SKILL}   stages: ${skill.checklist.phases.map((p) => p.name).join(" → ")}`);
console.log(`  fixture:  ${fx.id}   (before ${fx.before.length} chars)`);
console.log(`  provider: ${providerLabel(cfg)}   grader: ${providerLabel(grader)}`);
console.log(`  trials:   ${TRIALS}   FP control: ${WITH_FP ? "on" : "off"}   max turns/tokens: ${MAXTURNS}/${MAXTOK}\n`);

const tick = (s) => process.stderr.write(s + "\n");
const rows = [];

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
  const gSkill = await gradeQuality({ callGrade, code: fx.before, review: sk.review, domain });
  const gBase = await gradeQuality({ callGrade, code: fx.before, review: bl.review, domain });
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

  rows.push({
    trial: t, skill: gSkill.score, base: gBase.score,
    skillJudgments: gSkill.judgments, baseJudgments: gBase.judgments,
    skillOverlap: ovSkill.overlap, baseOverlap: ovBase.overlap,
    skillTurns: K, skillNav: sk.navCalls, baseTurns: bl.turns, baseNav: bl.navCalls,
    gatesCleared: sk.gatesCleared, refsOpened: sk.refsOpened, complete: sk.complete,
    fpSkill, fpBase, skillReview: sk.review, baseReview: bl.review,
  });
  const d = gSkill.score - gBase.score;
  console.log(`  t${t}: skill ${gSkill.score.toFixed(1)}/10  vs  baseline ${gBase.score.toFixed(1)}/10   (Δ ${(d >= 0 ? "+" : "") + d.toFixed(1)})`);
  console.log(`        compute — skill: ${K} turns / ${sk.navCalls} nav · gates ${sk.gatesCleared.length}/${skill.checklist.phases.length} · ref-overlap ${ovSkill.overlap}   |   baseline: ${bl.turns} turns / ${bl.navCalls} nav · ref-overlap ${ovBase.overlap}`);
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const mSkill = mean(rows.map((r) => r.skill));
const mBase = mean(rows.map((r) => r.base));
console.log(`\n  === result over ${TRIALS} trial(s) ===`);
console.log(`  skill-as-workflow:    ${mSkill.toFixed(2)}/10`);
console.log(`  skill-free baseline:  ${mBase.toFixed(2)}/10`);
console.log(`  Δ (skill − baseline): ${(mSkill - mBase >= 0 ? "+" : "") + (mSkill - mBase).toFixed(2)}`);
if (WITH_FP) {
  const fpRate = (k) => { const v = rows.map((r) => r[k]).filter((x) => x != null); return v.length ? `${Math.round(100 * v.filter(Boolean).length / v.length)}%` : "—"; };
  console.log(`  false-positive (cry-wolf):  skill ${fpRate("fpSkill")}  vs  baseline ${fpRate("fpBase")}`);
}

const outFile = path.join(here, "last-harness-ab.json");
fs.writeFileSync(outFile, JSON.stringify({ skill: SKILL, fixture: fx.id, provider: providerLabel(cfg), grader: providerLabel(grader), trials: TRIALS, mSkill, mBase, delta: mSkill - mBase, rows }, null, 2));
console.log(`\n  raw (incl. full reviews) → ${path.relative(repoRoot, outFile)}\n`);

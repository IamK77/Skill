#!/usr/bin/env node
// compare.mjs — the 3-arm comparison, all graded by the SAME grader so the scores
// are directly comparable:
//   base    — plain review, no skill
//   prompt  — skill-as-prompt: SKILL.md + references dumped flat into one call
//   harness — skill-as-gated-workflow: the harness.mjs loop (staged, model-driven
//             reference reads, gates), the simulated skill-as-skill
//
//   LAB_FLAVOR=openai LAB_BASE_URL=https://api.deepseek.com/v1 LAB_API_KEY=sk-... \
//   LAB_MODEL=deepseek-v4-pro node compare.mjs --fixture lobechat-op-usage-derive --trials 2

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { reviewMessages, mapPool, gradeConsensus } from "./core.mjs";
import { loadSkill, loadSkillStructured, loadProfile, loadFixtures, providerConfigs, providerLabel } from "./node-lib.mjs";
import { runHarness } from "./harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const SKILL = val("--skill", "surface/wellspring");
const FIXTURE = val("--fixture", null);
const TRIALS = Number(val("--trials", 2));
const MAXTOK = Number(val("--max-tokens", process.env.LAB_MAX_TOKENS || 12000));
const ARMS = (val("--arms", "base,prompt,harness")).split(",");
const CONC = Number(val("--concurrency", 6));

const { cfg } = providerConfigs(process.env);
const callReview = makeCallModel(cfg);
const callGrade = makeCallModel(cfg);
const skillText = loadSkill(repoRoot, SKILL);
const skillStruct = loadSkillStructured(repoRoot, SKILL);
const profile = loadProfile(here, SKILL);
const fixtures = loadFixtures(here, SKILL);
const fx = FIXTURE ? fixtures.find((f) => f.id === FIXTURE) : fixtures[0];
if (!fx) { console.error(`no fixture; have: ${fixtures.map((f) => f.id).join(", ")}`); process.exit(1); }
const domain = profile.domain, system = profile.reviewSystem;

async function produce(arm) {
  if (arm === "harness") {
    const r = await runHarness({ callModel: callReview, skill: skillStruct, code: fx.before, domain, system, skillName: SKILL.split("/").pop(), maxTokens: MAXTOK });
    return { review: r.review, meta: `turns=${r.turns} gates=${r.gatesCleared.length}/4 refs=${r.refsOpened.length} complete=${r.complete}` };
  }
  const text = await callReview(reviewMessages({ code: fx.before, skillText: arm === "prompt" ? skillText : null, domain }), { system, maxTokens: 16000, temperature: 1 });
  return { review: text, meta: "" };
}

console.log(`\nskill ${SKILL} · fixture ${fx.id} (${fx.before.length} chars) · ${providerLabel(cfg)} · trials ${TRIALS} · concurrency ${CONC}`);
console.log(`arms: ${ARMS.join(", ")}  (grader anchor: 6 = the maintainer's change)\n`);

// One independent task per (arm, trial); mapPool runs CONC of them at once. Trials
// are independent (harness builds a fresh checklist each call), so this is safe — it
// just turns a serial ~40-min sweep into a bounded-concurrency one. The fast base
// trials drain first and free slots for the slow multi-turn harness trials.
const results = Object.fromEntries(ARMS.map((a) => [a, []]));
const tasks = ARMS.flatMap((arm) => Array.from({ length: TRIALS }, (_, i) => ({ arm, t: i + 1 })));
await mapPool(tasks, CONC, async ({ arm, t }) => {
  try {
    const { review, meta } = await produce(arm);
    const c = await gradeConsensus({ callGrade, code: fx.before, diff: fx.diff, review, domain });
    results[arm].push({ score: c.score, scores: c.scores, escalated: c.escalated, harmful: c.grades.some((g) => g.harmful), meta, review });
    console.log(`  ${arm.padEnd(8)} t${t}  ${String(c.score).padStart(4)}/10  grades[${c.scores.join(",")}]${c.escalated ? "→med" : ""}${c.grades.some((g) => g.harmful) ? " ⚠harm" : ""}  ${meta}`);
  } catch (e) {
    results[arm].push({ score: null, error: String(e.message) });
    console.log(`  ${arm.padEnd(8)} t${t}  ERROR: ${String(e.message).slice(0, 120)}`);
  }
});

console.log("\n=== mean review-quality (0–10, anchor 6) ===");
for (const arm of ARMS) {
  const ok = results[arm].filter((r) => r.score != null);
  const mean = ok.length ? ok.reduce((a, r) => a + r.score, 0) / ok.length : NaN;
  console.log(`  ${arm.padEnd(8)} ${isNaN(mean) ? "—" : mean.toFixed(2)}  (n=${ok.length})`);
}

const outFile = path.join(here, `compare-${fx.id}.json`);
fs.writeFileSync(outFile, JSON.stringify({ skill: SKILL, fixture: fx.id, provider: providerLabel(cfg), trials: TRIALS, results }, null, 2));
console.log(`\nfull transcripts → ${path.relative(repoRoot, outFile)}\n`);

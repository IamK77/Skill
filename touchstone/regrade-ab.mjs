#!/usr/bin/env node
// regrade-ab.mjs — re-grade the SAVED reviews from a run-harness-ab.mjs run with a
// (different) grader, to ISOLATE the grader's contribution to the noise: same reviews,
// swap only the grader. If a stronger grader gives TIGHT within-trial spreads where the
// old one swung (e.g. flash's [10,4,3] on one fixed review), the grader was the culprit.
//
//   LAB_FLAVOR=anthropic LAB_BASE_URL=https://api.deepseek.com/anthropic \
//   LAB_API_KEY=sk-... LAB_GRADER_MODEL=deepseek-v4-pro \
//   node regrade-ab.mjs [--file last-harness-ab.json]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { gradeConsensus } from "./core.mjs";
import { loadFixtures, loadProfile, providerConfigs, providerLabel } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const d = JSON.parse(fs.readFileSync(path.join(here, val("--file", "last-harness-ab.json")), "utf8"));
const { grader } = providerConfigs(process.env);
const callGrade = makeCallModel(grader);
const profile = loadProfile(here, d.skill);
const fx = loadFixtures(here, d.skill).find((f) => f.id === d.fixture);
if (!fx) { console.error(`fixture ${d.fixture} not found for ${d.skill}`); process.exit(1); }
const domain = profile.domain;
const sp = (a) => (a.length ? Math.max(...a) - Math.min(...a) : 0);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

console.log(`\n  RE-GRADE — same ${d.rows.length} saved reviews, new grader: ${providerLabel(grader)}`);
console.log(`  skill ${d.skill} · fixture ${d.fixture}\n`);

const out = [];
for (const r of d.rows) {
  process.stderr.write(`  t${r.trial}: re-grading skill + baseline reviews…\n`);
  const gs = await gradeConsensus({ callGrade, code: fx.before, diff: fx.diff, review: r.skillReview, domain });
  const gb = await gradeConsensus({ callGrade, code: fx.before, diff: fx.diff, review: r.baseReview, domain });
  console.log(`  t${r.trial}: skill ${r.skill}→${gs.score} [${gs.scores.join(",")}] (spread ${sp(gs.scores)})   base ${r.base}→${gb.score} [${gb.scores.join(",")}] (spread ${sp(gb.scores)})`);
  out.push({ trial: r.trial, oldSkill: r.skill, newSkill: gs.score, skillScores: gs.scores, oldBase: r.base, newBase: gb.score, baseScores: gb.scores });
}

const spreads = out.flatMap((o) => [sp(o.skillScores), sp(o.baseScores)]);
console.log(`\n  === grader comparison on the SAME reviews ===`);
console.log(`  NEW grader (${providerLabel(grader)}):  skill ${mean(out.map((o) => o.newSkill)).toFixed(2)}  base ${mean(out.map((o) => o.newBase)).toFixed(2)}  Δ ${(mean(out.map((o) => o.newSkill)) - mean(out.map((o) => o.newBase))).toFixed(2)}`);
console.log(`  OLD grader (flash):                       skill ${mean(out.map((o) => o.oldSkill)).toFixed(2)}  base ${mean(out.map((o) => o.oldBase)).toFixed(2)}  Δ ${(mean(out.map((o) => o.oldSkill)) - mean(out.map((o) => o.oldBase))).toFixed(2)}`);
console.log(`  NEW within-trial grade spreads: ${spreads.join(", ")}  → avg ${mean(spreads).toFixed(2)}   (flash avg was 1.90, with [10,4,3]/[8,2,3] outliers)`);
console.log(`\n  → if the NEW spreads are ~0-2 (no big swings), the grader WAS the noise source.\n`);

fs.writeFileSync(path.join(here, "last-regrade.json"), JSON.stringify({ skill: d.skill, fixture: d.fixture, grader: providerLabel(grader), out }, null, 2));

#!/usr/bin/env node
// grader-variance-test.mjs — does the v2 grader actually kill the variance?
//
// The whole "fix the instrument" claim rests on ONE measurable thing: grade the SAME
// fixed review many times and the spread should collapse. v1 scored a strong review
// 8 / 1 / 3 (spread 7). v2 (decomposed factual y/n → code-composed score, no diff in
// the quality call) should land in a ~1-point band.
//
// NO reviewer calls — we re-grade reviews already saved in last-harness-ab.json. The
// only spend is grader calls: 2 reviews × 2 graders × K passes (+2 overlap probes).
//
//   LAB_FLAVOR=anthropic LAB_BASE_URL=https://api.deepseek.com/anthropic \
//   LAB_API_KEY=sk-... LAB_MODEL=deepseek-v4-pro \
//   node grader-variance-test.mjs --k 10

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import {
  gradeReviewMessages, scoreFromGrade,         // v1 (holistic, sees diff)
  gradeQualityMessages, scoreFromQuality,       // v2 (decomposed, no diff)
  gradeReferenceOverlap, mapPool,
} from "./core.mjs";
import { loadFixtures, loadProfile, providerConfigs, providerLabel } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const K = Number(val("--k", 10));
const SKILL = val("--skill", "surface/wellspring");
const CONC = Number(val("--concurrency", 6));

const saved = JSON.parse(fs.readFileSync(path.join(here, "last-harness-ab.json"), "utf8"));
const reviews = [
  { label: "skill", text: saved.rows[0].skillReview, v1past: saved.rows[0].skillScores },
  { label: "base",  text: saved.rows[0].baseReview,  v1past: saved.rows[0].baseScores },
];

const profile = loadProfile(here, SKILL);
const domain = profile.domain || "architecture";
const fixtures = loadFixtures(here, SKILL);
const fx = fixtures.find((f) => f.id === saved.fixture) || fixtures[0];

const { grader } = providerConfigs(process.env);
const callGrade = makeCallModel(grader);

const stats = (xs) => {
  const n = xs.length, mean = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const sorted = [...xs].sort((a, b) => a - b);
  return { min: sorted[0], max: sorted[n - 1], spread: sorted[n - 1] - sorted[0], mean, sd };
};
const fmt = (s) => `min ${s.min}  max ${s.max}  spread ${s.spread}  mean ${s.mean.toFixed(2)}  sd ${s.sd.toFixed(2)}`;

console.log(`\n  GRADER VARIANCE TEST  —  ${K}× per cell on FIXED saved reviews`);
console.log(`  skill:    ${SKILL}   fixture: ${fx.id}   domain: ${domain}`);
console.log(`  grader:   ${providerLabel(grader)}   (temp 0, single grade — no consensus)`);
console.log(`  v1 past (from the saved run): skill ${JSON.stringify(reviews[0].v1past)}  base ${JSON.stringify(reviews[1].v1past)}\n`);

const tick = (s) => process.stderr.write(s + "\n");
const out = [];

for (const r of reviews) {
  tick(`  grading "${r.label}" review ${K}× under v1 (holistic, sees diff)…`);
  const v1 = await mapPool(Array.from({ length: K }), CONC, async () => {
    const g = await callGrade(gradeReviewMessages({ code: fx.before, diff: fx.diff, review: r.text, domain }), { maxTokens: 8000, temperature: 0 });
    return scoreFromGrade(JSON.parse(g.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/)[0]));
  });

  tick(`  grading "${r.label}" review ${K}× under v2 (decomposed, no diff)…`);
  const v2j = [];
  const v2 = await mapPool(Array.from({ length: K }), CONC, async () => {
    const g = await callGrade(gradeQualityMessages({ code: fx.before, review: r.text, domain }), { maxTokens: 8000, temperature: 0 });
    const j = JSON.parse(g.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/)[0]);
    v2j.push(j);
    return scoreFromQuality(j);
  });

  tick(`  reference-overlap probe for "${r.label}" (recorded, NOT scored)…`);
  const ov = await gradeReferenceOverlap({ callGrade, diff: fx.diff, review: r.text, domain }).catch((e) => ({ overlap: "err:" + e.message }));

  out.push({ label: r.label, v1, v2, v2j, overlap: ov.overlap });
  const s1 = stats(v1), s2 = stats(v2);
  console.log(`\n  ── ${r.label} review ──`);
  console.log(`     v1 scores: ${JSON.stringify(v1)}`);
  console.log(`        ${fmt(s1)}`);
  console.log(`     v2 scores: ${JSON.stringify(v2)}`);
  console.log(`        ${fmt(s2)}`);
  // show the modal v2 judgment so we can see WHAT it decided
  const counts = {};
  for (const j of v2j) { const k = ["grounded", "real", "multiple", "concrete", "depth", "harmful"].map((f) => `${f[0]}=${j[f]}`).join(" "); counts[k] = (counts[k] || 0) + 1; }
  console.log(`     v2 judgments (count × pattern): ${Object.entries(counts).map(([k, c]) => `${c}×[${k}]`).join("  |  ")}`);
  console.log(`     reference-overlap: ${ov.overlap}`);
}

const outFile = path.join(here, "last-variance-test.json");
fs.writeFileSync(outFile, JSON.stringify({ skill: SKILL, fixture: fx.id, grader: providerLabel(grader), K, out }, null, 2));
console.log(`\n  === verdict ===`);
for (const r of out) {
  const s1 = stats(r.v1), s2 = stats(r.v2);
  console.log(`  ${r.label}:  v1 spread ${s1.spread} (sd ${s1.sd.toFixed(2)})  →  v2 spread ${s2.spread} (sd ${s2.sd.toFixed(2)})`);
}
console.log(`\n  raw → ${path.relative(path.resolve(here, ".."), outFile)}\n`);

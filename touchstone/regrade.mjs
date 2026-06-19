#!/usr/bin/env node
// Re-score SAVED reviews with the current rubric + CONSENSUS grading — no new review
// runs, so this isolates the GRADING from review variance. Grades each review 2× and
// averages; if the two disagree by >2 it adds a 3rd and takes the median.
//   LAB_API_KEY=sk-... node regrade.mjs --grader-model deepseek-v4-pro --file compare-lobechat-op-usage-derive.json
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { gradeConsensus, mapPool } from "./core.mjs";
import { loadFixtures } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const val = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const FILE = val("--file", "compare-lobechat-op-usage-derive.json");
const SKILL = val("--skill", "surface/wellspring");
const FIXTURE = val("--fixture", "lobechat-op-usage-derive");
const GRADER = val("--grader-model", "deepseek-v4-pro");

const saved = JSON.parse(fs.readFileSync(path.join(here, FILE), "utf8"));
const fx = loadFixtures(here, SKILL).find((f) => f.id === FIXTURE);
const domain = "state architecture";
const callGrade = makeCallModel({ flavor: "openai", baseUrl: "https://api.deepseek.com/v1", apiKey: process.env.LAB_API_KEY, model: GRADER });
console.log(`grader: ${GRADER} · consensus 2×, +3rd if |Δ|>2 → median\n`);

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

for (const arm of Object.keys(saved.results)) {
  const recs = saved.results[arm].filter((r) => r.review && r.review.length > 50);
  const out = await mapPool(recs, 4, async (r) => {
    const c = await gradeConsensus({ callGrade, code: fx.before, diff: fx.diff, review: r.review, domain });
    return { old: r.score, neu: c.score, scores: c.scores, escalated: c.escalated, harmful: c.grades.some((g) => g.harmful) };
  });
  console.log(`=== ${arm} (${out.length} reviews) ===`);
  out.forEach((o, i) => console.log(`  t${i + 1}: old ${o.old} → new ${o.neu}  grades[${o.scores.join(",")}]${o.escalated ? " (escalated→median)" : ""}${o.harmful ? " ⚠harm" : ""}`));
  const spread = out.map((o) => Math.max(...o.scores) - Math.min(...o.scores));
  console.log(`  mean: old ${mean(out.map((o) => o.old)).toFixed(2)} → new ${mean(out.map((o) => o.neu)).toFixed(2)}  · escalated ${out.filter((o) => o.escalated).length}/${out.length} · avg within-review spread ${mean(spread).toFixed(1)}\n`);
}

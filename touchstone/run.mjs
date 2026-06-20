#!/usr/bin/env node
// run.mjs — headless terminal runner (text output), for CI / scripting. The web
// bench (server.mjs) is the product surface; this shares the same engine. Being a
// CLI with no UI to fill, it takes its provider from env:
//
//   LAB_FLAVOR=openai LAB_BASE_URL=https://api.deepseek.com/v1 \
//   LAB_API_KEY=sk-... LAB_MODEL=deepseek-chat node run.mjs --trials 3

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { runCell, summarize } from "./core.mjs";
import { loadSkill, loadFixtures, loadProfile, providerConfigs, providerLabel } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, ".."); // touchstone/ sits at the repo root

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const TRIALS = Number(val("--trials", process.env.LAB_TRIALS || 3));
const WITH_FP = !has("--no-fp");
const SKILL = val("--skill", "surface/wellspring");

const { cfg, grader } = providerConfigs(process.env);
if (cfg.flavor !== "anthropic-proxy" && !cfg.apiKey && cfg.flavor !== "openai") {
  // anthropic-proxy needs no key; everything else generally does — warn, don't block.
}
const callReview = makeCallModel(cfg);
const callGrade = makeCallModel(grader);

const skillText = loadSkill(repoRoot, SKILL);
const profile = loadProfile(here, SKILL);
const fixtures = loadFixtures(here, SKILL);

console.log(`\nskill:    ${SKILL}  (domain: ${profile.domain})\nprovider: ${providerLabel(cfg)}\ntrials:   ${TRIALS}   false-positive control: ${WITH_FP ? "on" : "off"}\nfixtures: ${fixtures.length}\n`);
if (!fixtures.length) { console.error("no fixtures for this skill — add one under fixtures/"); process.exit(1); }

const results = [];
for (const fx of fixtures) {
  for (const withSkill of [false, true]) {
    const recs = await runCell({
      callReview, callGrade, fixture: fx,
      skillText: withSkill ? skillText : null,
      trials: TRIALS, withFP: WITH_FP, profile,
    });
    const s = summarize(recs);
    results.push({ fixture: fx.id, condition: withSkill ? "skill" : "base", ...s, records: recs });
    console.log(`  [${fx.id}]  ${withSkill ? "WITH skill" : "NO skill  "}   found=${s.meanFound.toFixed(2)}/10   false-pos=${fmtPct(s.fpRate)}`);
  }
}

console.log("\n=== gap the skill makes (skill − baseline) ===");
for (const fx of fixtures) {
  const b = results.find((r) => r.fixture === fx.id && r.condition === "base");
  const s = results.find((r) => r.fixture === fx.id && r.condition === "skill");
  const d = s.meanFound - b.meanFound;
  console.log(`  ${fx.id}`);
  console.log(`     review-quality score:    ${b.meanFound.toFixed(2)} → ${s.meanFound.toFixed(2)}   (Δ ${d >= 0 ? "+" : ""}${d.toFixed(2)} of 10)`);
  console.log(`     false-positive on fixed: ${fmtPct(b.fpRate)} → ${fmtPct(s.fpRate)}`);
}

const outFile = path.join(here, "last-run.json");
fs.writeFileSync(outFile, JSON.stringify({ skill: SKILL, provider: providerLabel(cfg), trials: TRIALS, results }, null, 2));
console.log(`\nraw transcripts → ${path.relative(repoRoot, outFile)}\n`);

function fmtPct(x) { return x == null ? "—" : `${Math.round(x * 100)}%`; }

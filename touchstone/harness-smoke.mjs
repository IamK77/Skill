#!/usr/bin/env node
// harness-smoke.mjs — run ONE gated-workflow review through harness.mjs and print
// the observed behavior, so we can see the loop actually work (gates clearing in
// order, the model CHOOSING which references to open, the findings) before wiring it
// into the engine + the web/jsx surfaces. Provider from env, like run.mjs:
//
//   LAB_FLAVOR=openai LAB_BASE_URL=https://api.deepseek.com/v1 \
//   LAB_API_KEY=sk-... LAB_MODEL=deepseek-v4-pro \
//   node harness-smoke.mjs --skill surface/wellspring --fixture lobechat-op-usage-derive

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { loadSkillStructured, loadFixtures, loadProfile, providerConfigs, providerLabel } from "./node-lib.mjs";
import { runHarness } from "./harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const argv = process.argv.slice(2);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const SKILL = val("--skill", "surface/wellspring");
const FIXTURE = val("--fixture", null);
const MAXTOK = Number(val("--max-tokens", process.env.LAB_MAX_TOKENS || 8000));

const { cfg } = providerConfigs(process.env);
const callModel = makeCallModel(cfg);
const skill = loadSkillStructured(repoRoot, SKILL);
const profile = loadProfile(here, SKILL);
const fixtures = loadFixtures(here, SKILL);
const fx = FIXTURE ? fixtures.find((f) => f.id === FIXTURE) : fixtures[0];
if (!fx) { console.error(`no fixture${FIXTURE ? " " + FIXTURE : ""}; have: ${fixtures.map((f) => f.id).join(", ")}`); process.exit(1); }

console.log(`\nskill:    ${SKILL}  (domain: ${profile.domain})`);
console.log(`provider: ${providerLabel(cfg)}   max_tokens/turn: ${MAXTOK}`);
console.log(`fixture:  ${fx.id}  (before ${fx.before.length} chars)`);
console.log(`stages:   ${skill.checklist.phases.map((p) => p.name).join(" → ")}`);
console.log(`refs:     ${Object.keys(skill.references).map((k) => k.replace(/\.md$/, "")).join(", ")}\n`);
console.log("── live trace ─────────────────────────────────────────────");

const onEvent = (e) => {
  if (e.type === "turn") process.stdout.write(`\n[turn ${e.turn}] `);
  else if (e.type === "read") process.stdout.write(`📖 read ${e.name.replace(/\.md$/, "")}  `);
  else if (e.type === "check") process.stdout.write(`✎ check ${e.phase}/${e.id} (${e.message.length} chars)  `);
  else if (e.type === "gate") process.stdout.write(`🚪 GATE ${e.phase} ✓  `);
  else if (e.type === "synthesize") process.stdout.write(`\n[synthesizing final review] `);
};

const t0 = Date.now();
const r = await runHarness({
  callModel, skill, code: fx.before, domain: profile.domain,
  system: profile.reviewSystem, skillName: SKILL.split("/").pop(),
  onEvent, maxTurns: 28, maxTokens: MAXTOK,
});
const secs = ((Date.now() - t0) / 1000).toFixed(0);

console.log("\n\n── outcome ────────────────────────────────────────────────");
console.log(`complete:       ${r.complete}   turns: ${r.turns}   ${secs}s`);
console.log(`gates cleared:  ${r.gatesCleared.join(" → ") || "none"}  (of ${r.stages.join(" → ")})`);
console.log(`refs opened:    ${r.refsOpened.map((x) => `${x.name.replace(/\.md$/, "")}@t${x.turn}`).join(", ") || "NONE"}`);
console.log(`review length:  ${r.review.length} chars`);
console.log("\n── final consolidated review ──────────────────────────────\n");
console.log(r.review);

// node-lib.mjs — the Node-only bits shared by run.mjs (terminal) and server.mjs
// (web). Reads files and env; never imported by the browser (core.mjs stays pure).

import * as fs from "node:fs";
import * as path from "node:path";

export function loadSkill(repoRoot, skill) {
  const dir = path.join(repoRoot, "skills", skill);
  const mdPath = path.join(dir, "SKILL.md");
  if (!fs.existsSync(mdPath)) throw new Error(`skill not found: ${path.relative(repoRoot, mdPath)}`);
  let text = fs.readFileSync(mdPath, "utf8");
  // Inline the reference library too. SKILL.md only LINKS to these; in a one-shot
  // prompt the agent can't "open" them on demand, so we append their full text —
  // this is what makes the prompt the WHOLE skill, not just its overview.
  const refDir = path.join(dir, "references");
  if (fs.existsSync(refDir)) {
    for (const f of fs.readdirSync(refDir).filter((x) => x.endsWith(".md")).sort()) {
      text += `\n\n\n===== references/${f} =====\n\n` + fs.readFileSync(path.join(refDir, f), "utf8");
    }
  }
  return text;
}

// Structured skill load for the gated-workflow harness (harness.mjs): SKILL.md kept
// SEPARATE from the references (so the harness can disclose them on demand, not
// upfront) and the .checklist.yml parsed into {phases:[{name,checks:[{id,desc}]}]}.
// Returns { skillMd, references: {<file>: text}, checklist: {phases} }.
export function loadSkillStructured(repoRoot, skill) {
  const dir = path.join(repoRoot, "skills", skill);
  const skillMd = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
  const references = {};
  const refDir = path.join(dir, "references");
  if (fs.existsSync(refDir))
    for (const f of fs.readdirSync(refDir).filter((x) => x.endsWith(".md")).sort())
      references[f] = fs.readFileSync(path.join(refDir, f), "utf8");
  const ymlPath = path.join(dir, ".checklist.yml");
  const checklist = fs.existsSync(ymlPath) ? parseChecklistYml(fs.readFileSync(ymlPath, "utf8")) : { phases: [] };
  return { skillMd, references, checklist };
}

// A targeted reader for the .checklist.yml shape this suite uses (phases → checks →
// id/description). Not a general YAML parser — it understands exactly:
//   phases:
//     - name: <stage>
//       checks:
//         - id: <id>
//           description: "<one quoted string, possibly spanning lines>"
export function parseChecklistYml(text) {
  const phases = [];
  let phase = null, check = null, pendingDesc = null; // pendingDesc collects a multi-line quoted value
  for (const raw of text.split("\n")) {
    if (pendingDesc !== null) {
      pendingDesc.value += "\n" + raw;
      if (/"\s*$/.test(raw)) { check.description = stripQuotes(pendingDesc.value); pendingDesc = null; }
      continue;
    }
    const line = raw.replace(/\s+$/, "");
    if (/^\s*#/.test(line) || line.trim() === "") continue;
    let m;
    if ((m = line.match(/^\s*-\s*name:\s*(.+)$/))) { phase = { name: stripQuotes(m[1].trim()), checks: [] }; phases.push(phase); check = null; }
    else if ((m = line.match(/^\s*-\s*id:\s*(.+)$/)) && phase) { check = { id: stripQuotes(m[1].trim()), description: "" }; phase.checks.push(check); }
    else if ((m = line.match(/^\s*description:\s*(.*)$/)) && check) {
      const rest = m[1].trim();
      if (rest.startsWith('"') && !/"\s*$/.test(rest.slice(1))) pendingDesc = { value: rest }; // opening quote, not yet closed
      else check.description = stripQuotes(rest);
    }
  }
  return { phases };
}
const stripQuotes = (s) => s.replace(/^["']/, "").replace(/["']$/, "").trim();

// The per-skill eval profile (review/grader framing). Lives next to its fixtures
// under evals/<suite>/<name>/ — swap this folder to test another skill.
export function loadProfile(labDir, skill) {
  const p = path.join(labDir, "evals", skill, "profile.json");
  if (!fs.existsSync(p)) throw new Error(`eval profile not found: ${path.relative(labDir, p)}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Every fixture dir under evals/<skill>/fixtures/ (path-scoped to the skill, so no
// filtering needed), hydrated with its before/after/diff.
export function loadFixtures(labDir, skill) {
  const fxRoot = path.join(labDir, "evals", skill, "fixtures");
  if (!fs.existsSync(fxRoot)) return [];
  return fs.readdirSync(fxRoot)
    .filter((d) => fs.existsSync(path.join(fxRoot, d, "meta.json")))
    .map((d) => {
      const dir = path.join(fxRoot, d);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
      return {
        ...meta,
        before: fs.readFileSync(path.join(dir, meta.target), "utf8"),
        after: fs.readFileSync(path.join(dir, meta.answer), "utf8"),
        diff: fs.readFileSync(path.join(dir, meta.answer_key), "utf8"),
      };
    });
}

// Reviewer + grader provider config from env. Auto: an OpenAI-compatible endpoint
// if LAB_BASE_URL is set, else the claude.ai-style proxy. Grader defaults to the
// reviewer's config; override any LAB_GRADER_* field to make it independent.
export function providerConfigs(env) {
  const cfg = {
    flavor: env.LAB_FLAVOR || (env.LAB_BASE_URL ? "openai" : "anthropic-proxy"),
    baseUrl: env.LAB_BASE_URL,
    apiKey: env.LAB_API_KEY,
    model: env.LAB_MODEL,
  };
  const grader = {
    flavor: env.LAB_GRADER_FLAVOR || cfg.flavor,
    baseUrl: env.LAB_GRADER_BASE_URL || cfg.baseUrl,
    apiKey: env.LAB_GRADER_API_KEY || cfg.apiKey,
    model: env.LAB_GRADER_MODEL || cfg.model,
  };
  return { cfg, grader };
}

export const providerLabel = (cfg) => `${cfg.flavor}${cfg.model ? " / " + cfg.model : ""}`;

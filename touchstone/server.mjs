#!/usr/bin/env node
// server.mjs — the tiny local web server (no dependencies).
//
//   node server.mjs            # → http://localhost:5178, configure the provider IN the page
//
// It does NOT read provider config from env and has no mock mode. It does two jobs:
//   1. serves the web/ page + the browser-side engine (core.mjs, providers.mjs)
//   2. /api/model — takes the provider config the BROWSER supplies per request and
//      makes the call server-side, so the key only ever reaches your own machine
//      and the browser never hits a third-party API directly (which CORS blocks).

import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { makeCallModel } from "./providers.mjs";
import { loadSkill, loadSkillStructured, loadFixtures, loadProfile } from "./node-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");   // touchstone/ lives at the repo root

const argv = process.argv.slice(2);
const PORT = Number(process.env.LAB_PORT || (argv.includes("--port") ? argv[argv.indexOf("--port") + 1] : 5178));

const MIME = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".tsx": "text/plain; charset=utf-8",
  ".diff": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
};

const send = (res, code, body, type = "text/plain; charset=utf-8") => {
  res.writeHead(code, { "content-type": type });
  res.end(body);
};
const sendJSON = (res, code, obj) => send(res, code, JSON.stringify(obj), "application/json; charset=utf-8");
async function readBody(req) { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c).toString("utf8"); }

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://localhost:${PORT}`);
    const p = u.pathname;

    // ── model proxy: the browser sends the provider config it collected in the UI;
    //    the key never leaves this machine, and CORS is dodged by calling server-side.
    if (req.method === "POST" && p === "/api/model") {
      const { role, messages, opts, provider } = JSON.parse((await readBody(req)) || "{}");
      if (!provider || !provider.flavor) return sendJSON(res, 400, { error: "missing provider config" });
      const text = await makeCallModel(provider)(messages || [], opts || {});
      // Echo each raw response (truncated) so a misbehaving model is visible here.
      console.log(`  [${role || "?"}] ${String(text).replace(/\s+/g, " ").trim().slice(0, 200)}`);
      return sendJSON(res, 200, { text });
    }

    // Presence of this endpoint is how the page knows it is in LOCAL mode (a server
    // is here) vs the claude.ai artifact (no server → use the injected proxy).
    if (p === "/api/config") return sendJSON(res, 200, { mode: "local" });

    // ── fixtures + the real SKILL.md for a skill, handed to the browser engine ──
    if (p === "/api/fixtures") {
      const skill = u.searchParams.get("skill") || "surface/wellspring";
      const skillText = loadSkill(repoRoot, skill);
      const skillStruct = loadSkillStructured(repoRoot, skill); // for the harness arm: SKILL.md + refs map + parsed gates
      const profile = loadProfile(here, skill);
      const fixtures = loadFixtures(here, skill).map((f) => ({
        id: f.id, repo: f.repo, pr: f.pr, file: f.file,
        fix_summary: f.fix_summary, before: f.before, after: f.after, diff: f.diff,
      }));
      return sendJSON(res, 200, { skill, skillText, skillStruct, profile, fixtures });
    }

    // ── static (web/ page, core.mjs, providers.mjs) ─────────────────────────────
    const rel = p === "/" ? "web/index.html" : p.replace(/^\/+/, "");
    const file = path.resolve(here, rel);
    if (!file.startsWith(here)) return send(res, 403, "forbidden");
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || "application/octet-stream");
    }
    return send(res, 404, "not found: " + p);
  } catch (e) {
    return sendJSON(res, 500, { error: String((e && e.message) || e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  skill-lab  →  http://localhost:${PORT}`);
  console.log("  configure the provider inside the page (or it auto-uses claude.ai's credentials there)\n");
});

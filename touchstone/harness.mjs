// harness.mjs — a faithful-enough REIMPLEMENTATION of "running a skill as a gated
// agent workflow", built on top of the same completion primitive everything else
// uses (callModel(messages, opts) => text). Pure ESM; runs in Node AND the browser,
// so the IDENTICAL harness runs locally and inside the claude.ai artifact — only the
// model behind callModel differs. That is what buys cross-environment consistency
// that reusing Claude Code's own harness could not.
//
// The split, taken straight from the skill's own motto ("order enforced, substance
// yours"):
//   • ORDER  — enforced by US: the stages run in sequence, each GATE must clear
//              before the next unlocks. This is deterministic JS (the checklist).
//   • SUBSTANCE + NAVIGATION — owned by the MODEL: it decides which reference to
//              open and when (a read_reference tool), what each finding is, and the
//              conclusions. We do NOT inject references at a stage; the model pulls
//              them. The gate creates the PULL (you can't clear `source` without the
//              duplicate-fact audit) without mandating the read.
//
// Progressive disclosure is therefore an OBSERVED, logged behavior (which refs the
// model opened, at which turn) — not a given we engineered.
//
// The code under review is NOT force-fed: it is a virtual file tree (navfs.mjs) the
// model navigates with ls / read_file / grep — so the agent must SEEK the problem, and
// a skill's NAVIGATION value (enumerate, trace, cross-reference) can actually manifest.

import { makeVirtualFS, runNavTool, parseNavCalls, proseWithoutNav } from "./navfs.mjs";

// ── The checklist: a deterministic, all-manual gate machine ──────────────────────
// wellspring's .checklist.yml has 4 phases, each a single MANUAL judgment check and
// ZERO mechanical `verify: shell:` rules — so the whole thing is sequential ordering
// + forced articulation, with nothing that needs a shell or a filesystem. That is
// why it reimplements faithfully in ~40 lines that run anywhere.
export function makeChecklist(config, onEvent = () => {}) {
  const phases = (config?.phases || []).map((p) => ({ name: p.name, checks: p.checks || [] }));
  const passedChecks = Object.fromEntries(phases.map((p) => [p.name, new Set()]));
  const clearedGates = new Set();

  const indexOf = (name) => phases.findIndex((p) => p.name === name);
  const earlierCleared = (i) => phases.slice(0, i).every((p) => clearedGates.has(p.name));
  const missingEarlier = (i) => phases.slice(0, i).filter((p) => !clearedGates.has(p.name)).map((p) => p.name);

  function run(cmd, args = [], message = "") {
    if (cmd === "init") return { ok: true, text: "checklist ready · stages: " + phases.map((p) => p.name).join(" → ") };
    if (cmd === "show")
      return { ok: true, text: phases.map((p) => `${clearedGates.has(p.name) ? "✓" : "·"} ${p.name}`).join("\n") };
    if (cmd === "done" || cmd === "reset") return { ok: true, text: "run state cleared" };

    if (cmd === "check") {
      const [phase, id] = args;
      const i = indexOf(phase);
      if (i < 0) return { ok: false, text: `no such stage: "${phase}". stages: ${phases.map((p) => p.name).join(", ")}` };
      if (!earlierCleared(i)) return { ok: false, text: `REJECTED: clear earlier gate(s) first — ${missingEarlier(i).join(", ")}` };
      const check = phases[i].checks.find((c) => c.id === id);
      if (!check) return { ok: false, text: `no check "${id}" in "${phase}". valid: ${phases[i].checks.map((c) => c.id).join(", ")}` };
      if (!message || message.trim().length < 40)
        return { ok: false, text: `a manual check needs the actual finding written out (you wrote ${message.trim().length} chars). Do the work in this turn's text, THEN re-emit [[checklist: check ${phase} ${id}]].` };
      passedChecks[phase].add(id);
      onEvent({ type: "check", phase, id, message: message.trim() });
      return { ok: true, text: `recorded: ${phase}/${id} ✓` };
    }

    if (cmd === "verify") {
      const [phase] = args;
      const i = indexOf(phase);
      if (i < 0) return { ok: false, text: `no such stage: "${phase}"` };
      if (!earlierCleared(i)) return { ok: false, text: `REJECTED: clear earlier gate(s) first — ${missingEarlier(i).join(", ")}` };
      const missing = phases[i].checks.filter((c) => !passedChecks[phase].has(c.id));
      if (missing.length) return { ok: false, text: `GATE BLOCKED: "${phase}" still needs check(s): ${missing.map((c) => c.id).join(", ")}` };
      clearedGates.add(phase);
      onEvent({ type: "gate", phase });
      const next = phases[i + 1];
      return { ok: true, text: `GATE CLEARED: ${phase}.` + (next ? ` "${next.name}" unlocked.` : " ALL GATES CLEARED.") };
    }
    return { ok: false, text: `unknown checklist command: "${cmd}" (use check | verify | show | done)` };
  }

  return {
    run,
    phases,
    clearedGateNames: () => phases.map((p) => p.name).filter((n) => clearedGates.has(n)),
    allCleared: () => phases.length > 0 && phases.every((p) => clearedGates.has(p.name)),
  };
}

// ── Tool-call protocol: text markers (uniform across every provider) ─────────────
// We use text markers rather than a provider's native tool-use so the SAME loop
// works on Anthropic, DeepSeek, vLLM, etc. with one code path — the price is a
// little more brittleness, paid down with strict format + a re-ask on a silent turn.
const MARKER = /\[\[\s*(read_reference|checklist|ls|read_file|grep)\s*:?\s*([\s\S]*?)\]\]/g;

export function parseToolCalls(text) {
  const calls = [], seen = new Set();
  for (const m of String(text).matchAll(MARKER)) {
    const tool = m[1];
    const rest = m[2].trim();
    let call, key;
    if (tool === "read_reference") { call = { tool, name: rest.replace(/\.md$/, "") }; key = `r:${call.name}`; }
    else if (tool === "checklist") { const [cmd, ...args] = rest.split(/\s+/); call = { tool, cmd, args }; key = `c:${cmd}:${args.join(" ")}`; }
    else { call = { tool, rest }; key = `n:${tool}:${rest}`; } // ls / read_file / grep — navigate the code
    if (seen.has(key)) continue; // a turn that repeats the same marker counts once
    seen.add(key);
    calls.push(call);
  }
  return calls;
}

// The finding attached to a `check` is whatever the model wrote in the turn, minus
// the markers — so it can think in prose and needn't cram analysis into brackets.
const proseOf = (text) => String(text).replace(MARKER, "").trim();

function readReference(skill, name, onEvent) {
  const keys = Object.keys(skill.references || {});
  const key = keys.find((k) => k === name || k.replace(/\.md$/, "") === name);
  if (!key) return { ok: false, text: `no reference "${name}". available: ${keys.map((k) => k.replace(/\.md$/, "")).join(", ")}` };
  onEvent({ type: "read", name: key });
  return { ok: true, text: skill.references[key], opened: key };
}

const firstLine = (t) =>
  String(t).split("\n").map((l) => l.replace(/^[#>\s*-]+/, "").trim()).find((l) => l.length > 0) || "";

function buildSystem({ baseSystem, skillName, skillMd, references, phases }) {
  const order = phases.map((p) => p.name).join(" → ");
  const menu = Object.entries(references || {})
    .map(([k, v]) => `  - ${k.replace(/\.md$/, "")}: ${firstLine(v).slice(0, 110)}`)
    .join("\n");
  return [
    baseSystem,
    "",
    `You are executing the \`${skillName}\` skill as a GATED WORKFLOW — not writing a one-shot review.`,
    `It runs in ordered stages (${order}) and you may not skip ahead: each stage has a GATE you must`,
    `clear, in order, before the next unlocks. ORDER IS ENFORCED HERE; the SUBSTANCE and the NAVIGATION are yours.`,
    "",
    "TOOLS — invoke by emitting a marker on its own line, EXACTLY in this form:",
    "  [[ls]]                                   list the files of the code under review",
    "  [[read_file: <path> [start-end]]]        read a file of the code (optionally a line range)",
    "  [[grep: <pattern> [in <path>]]]          search the code (case-insensitive regex) — trace, cross-reference",
    "  [[read_reference: <name>]]               open one reference from the library (returns its full text)",
    "  [[checklist: check <stage> <check-id>]]  record a stage's manual check as done; its FINDING is whatever",
    "                                           you wrote in THIS turn — so write the analysis out, substantively,",
    "                                           BEFORE the marker (a near-empty check is rejected)",
    "  [[checklist: verify <stage>]]            clear the stage's GATE (allowed only once its checks are recorded",
    "                                           AND every earlier gate is cleared)",
    "  [[checklist: show]]                      show gate status",
    "WORK ONE STAGE PER TURN: in a turn, open what the CURRENT stage needs, write that stage's finding, then",
    "[[checklist: check …]] and [[checklist: verify …]] it — then STOP and wait. The gate result and the newly",
    "unlocked next stage come back to you in the next turn; do the next stage THEN, informed by having cleared",
    "this one. Markers you emit for LATER stages in the same turn are IGNORED — don't run ahead.",
    "Do NOT merely describe a tool call in prose — emit the marker. (The skill text mentions a `checklist` CLI",
    "and an init step; init is already done for you — just use the markers above.)",
    "",
    "PROGRESSIVE DISCLOSURE — the reference library is listed below by NAME ONLY; their depth is NOT in front of",
    "you. Open a reference with [[read_reference: …]] when a stage sends you there. Don't pull them all upfront;",
    "open what the current stage needs.",
    "",
    "REFERENCE LIBRARY (open on demand):",
    menu,
    "",
    "When (and ONLY when) the FINAL gate is cleared, write your consolidated review: the real problems in the",
    "code and concrete, specific fixes.",
    "",
    "=== THE SKILL (SKILL.md, verbatim) ===",
    skillMd,
  ].join("\n");
}

const buildTask = (manifest, domain) =>
  `Work the skill's gated workflow on the ${domain.toUpperCase()} of the code under review — a real module from a ` +
  `production codebase. The code is NOT pasted here: it is a small file tree you must NAVIGATE with the tools ` +
  `([[ls]], [[grep]], [[read_file]]) to actually read what you review — SEEK the problem, don't wait for it. At each ` +
  `stage: do the stage's work in prose (navigating the code, and opening the reference it points to if you need it), ` +
  `record the stage's [[checklist: check …]], then [[checklist: verify …]] the gate. After the final gate clears, ` +
  `write your consolidated review.\n\nFILES UNDER REVIEW (read them with the tools):\n${manifest}`;

const nudge = (cl) => {
  const cleared = cl.clearedGateNames();
  const next = cl.phases.map((p) => p.name).find((n) => !cleared.includes(n));
  return `You emitted no tool call and the workflow isn't finished (cleared: ${cleared.join(", ") || "none"}; ` +
    `next stage: ${next}). Continue: do ${next}'s work, then [[checklist: check ${next} …]] and ` +
    `[[checklist: verify ${next}]]. Emit the markers exactly as specified.`;
};

// ── The loop ─────────────────────────────────────────────────────────────────────
// One harnessed review = a sequence of model turns threaded through one messages
// array, with two tools (read_reference, checklist) the model drives. Returns the
// final consolidated review PLUS the observed behavior (turns, which refs it opened,
// which gates it cleared, whether it finished) — the disclosure metrics we wanted.
export async function runHarness({
  callModel, skill, code, domain = "architecture", system, skillName = "skill",
  onEvent = () => {}, maxTurns = 28, maxTokens = 8000,
}) {
  const checklist = makeChecklist(skill.checklist, onEvent);
  const vfs = makeVirtualFS(code);
  const sys = buildSystem({ baseSystem: system || "You are a senior engineer.", skillName, skillMd: skill.skillMd, references: skill.references, phases: checklist.phases });
  const messages = [{ role: "user", content: buildTask(vfs.ls(), domain) }];
  const refsOpened = [];
  let review = "", complete = false, turn = 0, bestProse = "", navCalls = 0;

  while (turn < maxTurns) {
    turn += 1;
    onEvent({ type: "turn", turn });
    const out = await callModel(messages, { system: sys, maxTokens, temperature: 1 });
    messages.push({ role: "assistant", content: out });
    const turnProse = proseOf(out);
    if (turnProse.length > bestProse.length) bestProse = turnProse; // richest real prose, kept as a synthesis fallback

    const calls = parseToolCalls(out);
    if (calls.length === 0) {
      if (checklist.allCleared()) { review = out; complete = true; break; } // final answer turn
      messages.push({ role: "user", content: nudge(checklist) });
      continue;
    }

    const results = [];
    let deferred = false;
    for (let k = 0; k < calls.length; k++) {
      const c = calls[k];
      if (c.tool === "read_reference") {
        const r = readReference(skill, c.name, onEvent);
        if (r.opened) refsOpened.push({ name: r.opened, turn });
        results.push(`[[read_reference: ${c.name}]] →\n${r.text}`);
      } else if (c.tool === "ls" || c.tool === "read_file" || c.tool === "grep") {
        navCalls += 1;
        onEvent({ type: "nav", tool: c.tool, turn });
        results.push(`[[${c.tool}${c.rest ? ": " + c.rest : ""}]] →\n${runNavTool(vfs, c.tool, c.rest)}`);
      } else {
        const before = checklist.clearedGateNames().length;
        const r = checklist.run(c.cmd, c.args, c.cmd === "check" ? turnProse : "");
        results.push(`[[checklist: ${c.cmd} ${(c.args || []).join(" ")}]] → ${r.text}`);
        // One stage per turn: the moment a verify CLEARS a gate, stop — anything the
        // model emitted for the next stage is deferred so it must do it in a fresh
        // turn, having actually SEEN this gate clear (the point of gating).
        if (c.cmd === "verify" && checklist.clearedGateNames().length > before) {
          deferred = k < calls.length - 1;
          break;
        }
      }
    }

    if (checklist.allCleared()) {
      // Last gate just cleared: ask for the consolidated review (the gradeable artifact).
      messages.push({ role: "user", content: results.join("\n\n") + "\n\nAll gates cleared. Now write your FINAL consolidated " + domain + " review: the real problems and concrete, specific fixes, as plain prose (NO [[...]] tool markers). Be concise." });
      onEvent({ type: "synthesize" });
      let synth = proseOf(await callModel(messages, { system: sys, maxTokens: Math.max(maxTokens, 6000), temperature: 1 }));
      if (!synth.trim()) { // model answered synthesis with only a tool marker → ask once more, prose only
        messages.push({ role: "user", content: "Output ONLY the consolidated review as plain prose. Do NOT emit any [[...]] markers." });
        synth = proseOf(await callModel(messages, { system: sys, maxTokens: Math.max(maxTokens, 6000), temperature: 1 }));
      }
      review = synth.trim() ? synth : bestProse; // never discard real work to an empty review
      complete = true;
      break;
    }
    const tail = checklist.clearedGateNames().length > 0
      ? `\n\n(One stage per turn${deferred ? " — markers you emitted for later stages were ignored" : ""}: the next stage is now unlocked. Do it in your next turn.)`
      : "";
    messages.push({ role: "user", content: results.join("\n\n") + tail });
  }

  // strip stray markers; if that empties it (model ended on a bare marker), fall back
  // to the richest real prose it produced — a completed run never grades as empty.
  review = proseOf(review).trim() || bestProse || (proseOf([...messages].reverse().find((m) => m.role === "assistant")?.content || ""));
  return {
    review,
    complete,
    turns: turn,
    navCalls,                                     // how many ls/read_file/grep the agent made (its navigation)
    refsOpened,                                   // [{name, turn}] — observed progressive disclosure
    gatesCleared: checklist.clearedGateNames(),   // which stages actually cleared
    stages: checklist.phases.map((p) => p.name),
  };
}

// runNavReview — the EQUAL-OPPORTUNITY, skill-free baseline arm. Same nav tools over the
// same virtual FS and the same turn ceiling as the skill arm — but NO skill, NO gates:
// the agent navigates the code however it likes and DECIDES when it has seen enough, then
// writes its review (a turn with prose and no tool markers ends it). "Equal compute" is an
// equal ceiling + equal tools, NOT a forced floor — if this arm stops early that is its own
// choice, so a skill-arm win can't be dismissed as "it just got more turns", yet we never
// pad the baseline with aimless extra turns either.
export async function runNavReview({ callModel, code, domain = "architecture", system, maxTurns = 28, maxTokens = 8000, onEvent = () => {} }) {
  const vfs = makeVirtualFS(code);
  const sys = [
    system || "You are a senior engineer.",
    "",
    `Review the ${domain.toUpperCase()} of the code under review and report the real problems with concrete, specific fixes.`,
    "The code is NOT pasted here — it is a small file tree you must NAVIGATE with these tools (emit a marker on its own line, exactly):",
    "  [[ls]]                                list the files under review",
    "  [[read_file: <path> [start-end]]]     read a file (optionally a line range)",
    "  [[grep: <pattern> [in <path>]]]       search the code (case-insensitive regex) — trace, cross-reference",
    "Navigate as much or as little as you judge necessary. When you have SEEN ENOUGH, stop using tools and write your FINAL",
    "review as plain prose (NO [[...]] markers) — that ends the review. Don't pad; don't stop before you've actually read the code.",
  ].join("\n");
  const messages = [{ role: "user", content: `Begin your ${domain} review. The files under review (read them with the tools):\n${vfs.ls()}` }];
  let review = "", turn = 0, navCalls = 0, bestProse = "", complete = false;

  while (turn < maxTurns) {
    turn += 1;
    onEvent({ type: "turn", turn });
    const out = await callModel(messages, { system: sys, maxTokens, temperature: 1 });
    messages.push({ role: "assistant", content: out });
    const calls = parseNavCalls(out);
    const prose = proseWithoutNav(out);
    if (prose.length > bestProse.length) bestProse = prose;

    if (calls.length === 0) {
      if (navCalls === 0) { // don't accept a "review" of code it never opened
        messages.push({ role: "user", content: "You haven't read any of the code yet — use [[ls]], [[grep]], and [[read_file]] to actually look at it before reviewing." });
        continue;
      }
      review = out; complete = true; break; // agent decided on its own it's done (vs running out the turn cap)
    }
    const results = [];
    for (const c of calls) {
      navCalls += 1;
      onEvent({ type: "nav", tool: c.tool, turn });
      results.push(`[[${c.tool}${c.rest ? ": " + c.rest : ""}]] →\n${runNavTool(vfs, c.tool, c.rest)}`);
    }
    messages.push({ role: "user", content: results.join("\n\n") + "\n\n(Keep navigating, or write your final review when ready.)" });
  }
  review = proseWithoutNav(review).trim() || bestProse;
  // complete = the agent stopped on its own and wrote a review; false = it ran out the turn cap
  // mid-navigation and got truncated (treated as degenerate, mirroring the skill arm).
  return { review, turns: turn, navCalls, complete };
}

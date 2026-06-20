// core.mjs — the experiment engine. Pure ESM; runs in Node and the browser.
//
// It does NOT know how to reach a model: you inject callReview/callGrade (built by
// providers.mjs). That is what lets the identical experiment run on claude.ai
// (proxy auth) or locally against your own provider (dsv4 / DeepSeek / …).
//
// The design, in one breath:
//   target  = the OLD code, before a real maintainer touched it
//   answer  = the maintainer's ACTUAL diff  (ground truth we did not author)
//   metric  = did the review recommend the same change the maintainer made?
//   control = run the same review on the AFTER code; if it still flags the
//             already-removed problem, that is a measurable false positive.

// The review framing is PER-SKILL (see evals/<skill>/profile.json): a short `domain`
// label ("state architecture", …) and the reviewer's system prompt. The engine below
// is domain-agnostic — swapping the profile is what re-points it at another skill.
export const DEFAULT_REVIEW_SYSTEM =
  "You are a senior engineer reviewing code. Identify the real problems and give concrete, specific fixes. Be concise.";

// The ONLY manipulated variable: whether the skill's text is prepended.
export function reviewMessages({ code, skillText, domain = "architecture" }) {
  const D = domain.toUpperCase();
  const task = skillText
    ? "Follow this skill methodology when reviewing:\n\n" + skillText +
      "\n\n---\nNow review the " + D + " of this component:\n\n" + code
    : "Review the " + D + " of this component. List the problems and concrete fixes:\n\n" + code;
  return [{ role: "user", content: task }];
}

// The grader NEVER sees the skill, nor which condition produced the review. The
// maintainer's REAL diff is a KNOWN-GOOD REFERENCE, not the only right answer: the
// review is scored on whether its recommendations are genuine, correct improvements
// to THIS code — reproducing the maintainer's change OR proposing a different one
// that is equally good or better. Independence is preserved (the judge is a separate
// model, not the skill's author); the bar is concreteness + correctness.
export function gradeReviewMessages({ code, diff, review, domain = "architecture" }) {
  return [{
    role: "user",
    content:
      "You are STRICTLY judging the quality of a code review focused on " + domain + ".\n\n" +
      "The code that was reviewed (BEFORE any change):\n--- CODE ---\n" + code + "\n--- END CODE ---\n\n" +
      "For CALIBRATION ONLY, here is ONE real improvement a maintainer later made to this code — a REFERENCE " +
      "example proving the code genuinely has real " + domain + " problems at this level. It is NOT the only valid " +
      "finding, NOT a checklist, NOT an answer key. The review is NOT required to match it. A review that finds " +
      "DIFFERENT but equally-real, equally-important problems is JUST AS GOOD. Do NOT reward a review for matching " +
      "this, nor penalize it for missing this specific one:\n" +
      "--- ONE REFERENCE IMPROVEMENT (calibration, NOT the answer key) ---\n" + diff + "\n--- END ---\n\n" +
      "The review under judgement:\n--- REVIEW ---\n" + review + "\n--- END REVIEW ---\n\n" +
      "Grade the review on its OVERALL MERIT as a " + domain + " review of THIS code: how many genuinely real, " +
      "important problems does it identify, and how correct and concrete are its fixes? Pick the band by the " +
      "OBSERVABLE criteria below, not by impression, and NOT by whether it matched the reference.\n\n" +
      "STEP 1 — diagnose (state these in `why`):\n" +
      "  • found   — identifies at least one GENUINELY REAL, important problem in this code (the reference issue OR a different equally-real one)?  yes / partial / no\n" +
      "  • fixes   — correct & concrete (names what to change, would actually work)?  correct / mixed / incorrect / vague\n" +
      "  • harmful — does ANY recommendation give actively WRONG advice — introduce a bug, break working behavior, or push a clearly WORSE design?  yes / no\n" +
      "  • depth   — how much real, correct value: a single solid finding, several genuine ones, or deep/important ones?  thin / solid / rich\n" +
      "  • noise   — mostly cosmetic / stylistic / generic filler?  clean / some / mostly\n\n" +
      "STEP 2 — pick the band by QUALITY (for calibration, the one reference improvement ON ITS OWN is a 'solid' single finding ≈ 6-7; a review can equal it with a DIFFERENT real finding, fall short, or beat it with more/deeper real ones):\n" +
      "  10 = RARE & flawless: the most important real problem(s) with excellent, concrete, correct fixes; >=2 genuine issues; ZERO incorrect or vague points; no filler — a senior applies it wholesale. Any nameable flaw → not a 10.\n" +
      "   9 = excellent: real, important problems with correct concrete fixes; ONE small blemish (one vague fix / minor miss / a little filler)\n" +
      "   8 = strong & thorough: several genuine, correct, concrete " + domain + " problems; minor noise OK; no harm\n" +
      "   7 = good: at least one solid real problem well-fixed + some extra real value, with notable vagueness or one minor incorrect side-point\n" +
      "   6 = solid: one genuinely real, important problem identified with a correct, concrete fix; no harm; little extra\n" +
      "   5 = partial: a real problem with a vague/partial fix, or only one minor genuine issue\n" +
      "   4 = weak: real issues present BUT the main recommendation is wrong/impractical/wouldn't help, or a genuine point offset by an incorrect (non-harmful) one\n" +
      "   3 = one small real point buried in vague/cosmetic/incorrect suggestions\n" +
      "   2 = cosmetic/stylistic/trivial only (naming, micro-perf), no real " + domain + " improvement\n" +
      "   1 = generic boilerplate, nothing specific to this code\n" +
      "   0 = empty / no recommendations\n\n" +
      "STEP 3 — apply HARD OVERRIDES (they win over the band):\n" +
      "  • HARM: if `harmful` is yes, the score MAY NOT EXCEED 4; if the harmful rec is the review's MAIN thrust, score 0-2.\n" +
      "  • NO REAL FINDING: if `found` = no (identifies no genuinely real problem at all), the score MAY NOT EXCEED 4.\n" +
      "  • EMPTY: no concrete recommendation at all → 0.\n" +
      "  • LENGTH IS NOT VALUE: never reward length or point-count; only correct, concrete " + domain + " improvements count. Cosmetic/style/micro-perf earn nothing. A long sprawling review is not better than a tight one with the same real points.\n" +
      "  • CONCRETENESS: a recommendation that does not say WHAT to change is `vague` and does not count.\n" +
      "  • MATCHING THE REFERENCE EARNS NO BONUS and MISSING IT IS NO PENALTY: judge real-problem-finding wherever it lands.\n\n" +
      'Return ONLY JSON: {"found": "yes"|"partial"|"no", "harmful": true|false, "score": <integer 0-10>, "why": "one sentence naming the band and any override"}.',
  }];
}

// False-positive probe. The AFTER code already has THIS issue fixed. Did the review
// re-raise the very thing the maintainer resolved, or tell us to undo it? Generic
// across skills: the after-code may still contain OTHER, unrelated issues, and a
// review is free to mention those — only re-raising the RESOLVED issue counts.
export function falsePositiveMessages({ diff, review, domain = "architecture" }) {
  return [{
    role: "user",
    content:
      "A maintainer already FIXED a code issue with the change below:\n\n" +
      "--- THE FIX (already applied) ---\n" + diff + "\n--- END ---\n\n" +
      "Below is a " + domain + " review of the ALREADY-FIXED code. Count it as a FALSE POSITIVE " +
      "ONLY IF the review re-raises the very problem this fix already resolved, or tells us to undo / revert " +
      "the change. Comments about OTHER, still-present issues DO NOT count.\n\n" +
      "--- REVIEW ---\n" + review + "\n--- END REVIEW ---\n\n" +
      'Return ONLY JSON: {"false_positive": true | false, "why": "one sentence"}.',
  }];
}

function parseJSON(text) {
  const clean = String(text).replace(/```json|```/g, "").trim();
  const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("grader did not return JSON: " + clean.slice(0, 120));
  return JSON.parse(clean.slice(s, e + 1));
}
const clampScore = (s) => { const n = Math.round(Number(s)); return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0; };

// Turn a grader reply into the final score, ENFORCING the overrides in code (not just in
// the prompt). Shared by every grade consumer so the rubric's floor is mechanical.
// NOTE: the maintainer's diff is now ONLY a calibration reference, never the anchor — so
// there is NO "missed the reference → cap" rule. `found` means "found ANY genuinely-real
// problem" (reference or a different equally-real one); finding no real problem at all,
// or giving actively-harmful advice, is what caps the score.
export function scoreFromGrade(g) {
  let s = clampScore(g?.score);
  if (g?.harmful === true) s = Math.min(s, 4);   // actively wrong/harmful advice → never "good"
  if (g?.found === "no") s = Math.min(s, 4);      // identifies no genuinely-real problem → weak (NOT "missed the specific reference")
  return s;
}

// CONSENSUS grading — the grader is noisy (same review, temp 0, still wobbles ±2-3),
// so one grade is unreliable. Grade TWICE and average; if the two disagree by more
// than `threshold`, grade a THIRD time and take the MEDIAN of the three (robust to
// the outlier). Each grade gets the harm/ceiling caps before comparison.
export async function gradeConsensus({ callGrade, code, diff, review, domain = "architecture", threshold = 2, maxTokens = 8000 }) {
  const one = async () => {
    const g = await callForJSON(callGrade, gradeReviewMessages({ code, diff, review, domain }), { maxTokens, temperature: 0 });
    return { score: scoreFromGrade(g), harmful: g.harmful === true, found: g.found, why: g.why };
  };
  const grades = [await one(), await one()];
  const escalated = Math.abs(grades[0].score - grades[1].score) > threshold;
  if (escalated) grades.push(await one());
  const sorted = grades.map((g) => g.score).sort((a, b) => a - b);
  const score = escalated ? sorted[1] : (sorted[0] + sorted[1]) / 2; // median of 3, else mean of 2
  return { score, scores: grades.map((g) => g.score), escalated, grades };
}

// FALSE-POSITIVE grade — grade a review of the ALREADY-FIXED code: does it re-raise the
// resolved problem (cry wolf)? Single grade (it's a boolean, not a noisy 0–10 score, so no
// consensus). Shared by both arms so their cry-wolf rates are measured the same way.
export async function gradeFalsePositive({ callGrade, diff, review, domain = "architecture", maxTokens = 8000 }) {
  const fp = await callForJSON(callGrade, falsePositiveMessages({ diff, review, domain }), { maxTokens, temperature: 0 });
  return { falsePositive: fp.false_positive === true, why: fp.why };
}

// A REAL but SMALL agentic loop — draft, then self-revise — run IDENTICALLY on both arms.
// The ONLY difference between arms is whether `skillText` (the skill's guidance) sits in context,
// so the SKILL's CONTENT is the single manipulated variable and the process is held fixed. (Not
// the heavy gated harness; deliberately small so "with vs without skill" is a clean comparison.)
export async function runMiniHarness({ callModel, code, skillText = null, domain = "architecture", system, maxTokens = 8000, onEvent = () => {} }) {
  const sys = system || DEFAULT_REVIEW_SYSTEM;
  const base = reviewMessages({ code, skillText, domain });
  onEvent({ phase: "draft" });
  const draft = await callModel(base, { system: sys, maxTokens, temperature: 1 });
  onEvent({ phase: "revise" });
  const messages = [...base, { role: "assistant", content: draft },
    { role: "user", content: "Critique your own review: which REAL problems did you miss, and where are you flagging issues that aren't actually there? Then write your FINAL review — the real problems and concrete, specific fixes — as plain prose. Be concise." }];
  const final = (await callModel(messages, { system: sys, maxTokens, temperature: 1 }) || "").trim();
  return { review: final || draft, turns: 2, draft };
}

// Real models occasionally wrap the JSON in prose, omit it, or get truncated before
// emitting it. Ask, parse, and on failure retry ONCE with a firmer nudge — so one
// stray grader reply doesn't abort the whole run.
async function callForJSON(call, messages, opts) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const msgs = attempt === 0
      ? messages
      : messages.map((m, i) =>
          i === messages.length - 1
            ? { ...m, content: m.content + "\n\nIMPORTANT: reply with ONLY the JSON object, nothing before or after it." }
            : m);
    const text = await call(msgs, opts);
    try { return parseJSON(text); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

// One trial = one record: review the OLD code → grade against the maintainer's real
// diff, and (optionally) review the FIXED code → false-positive check. This is the
// independent unit of work; the web bench fans many of these out with mapPool().
// onEvent({ phase, trial }) drives a live log; optional (the terminal ignores it).
export async function runTrial({ callReview, callGrade, fixture, skillText, withFP, trial = 1, profile = {}, consensus = false, threshold = 2, onEvent = () => {} }) {
  const domain = profile.domain || "architecture";
  const system = profile.reviewSystem || DEFAULT_REVIEW_SYSTEM;

  onEvent({ phase: "review", trial });
  const review = await callReview(reviewMessages({ code: fixture.before, skillText, domain }), {
    system, maxTokens: 16000, temperature: 1,
  });
  onEvent({ phase: "grade", trial });
  let rec;
  if (consensus) {
    // multi-grade: grade 2×, escalate to a 3rd + median on disagreement (robust to the noisy grader)
    const c = await gradeConsensus({ callGrade, code: fixture.before, diff: fixture.diff, review, domain, threshold });
    const harmMajority = c.grades.filter((x) => x.harmful).length > c.grades.length / 2;
    rec = { trial, foundScore: c.score, foundWhy: c.grades[0].why, found: c.grades[0].found, harmful: harmMajority, review,
      gradeScores: c.scores, gradeEscalated: c.escalated };
  } else {
    const g = await callForJSON(callGrade, gradeReviewMessages({ code: fixture.before, diff: fixture.diff, review, domain }), {
      maxTokens: 8000, temperature: 0,
    });
    rec = { trial, foundScore: scoreFromGrade(g), foundWhy: g.why, found: g.found, harmful: g.harmful === true, review };
  }

  if (withFP) {
    // Same review task on the ALREADY-FIXED code → does it cry wolf?
    onEvent({ phase: "fp-review", trial });
    const cleanReview = await callReview(reviewMessages({ code: fixture.after, skillText, domain }), {
      system, maxTokens: 16000, temperature: 1,
    });
    onEvent({ phase: "fp-grade", trial });
    const fp = await callForJSON(callGrade, falsePositiveMessages({ diff: fixture.diff, review: cleanReview, domain }), {
      maxTokens: 8000, temperature: 0,
    });
    rec.falsePositive = fp.false_positive === true;
    rec.fpWhy = fp.why;
    rec.cleanReview = cleanReview;
  }
  onEvent({ phase: "trial-done", trial, foundScore: rec.foundScore, falsePositive: rec.falsePositive });
  return rec;
}

// Run one fixture under one condition for N trials, sequentially. Used by the
// terminal runner; the web bench fans trials out concurrently via mapPool instead.
export async function runCell({ callReview, callGrade, fixture, skillText, trials, withFP, profile, onEvent = () => {} }) {
  const out = [];
  for (let t = 1; t <= trials; t++) {
    out.push(await runTrial({ callReview, callGrade, fixture, skillText, withFP, trial: t, profile, onEvent }));
  }
  return out;
}

// Bounded-concurrency map: at most `limit` invocations of fn in flight at once.
// Lets the web bench overlap model calls without flooding the provider (429s).
export async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx], idx);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

export function summarize(records) {
  const n = records.length || 1;
  const meanFound = records.reduce((a, r) => a + r.foundScore, 0) / n;
  const fpRows = records.filter((r) => "falsePositive" in r);
  const fpRate = fpRows.length ? fpRows.filter((r) => r.falsePositive).length / fpRows.length : null;
  return { meanFound, fpRate, n: records.length };
}

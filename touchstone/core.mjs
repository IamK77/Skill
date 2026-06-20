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
// The review prompt AND the skill-as-workflow live in harness.mjs (runHarness = the
// skill arm; runNavReview = the skill-free baseline). core.mjs holds only the grader and
// the run orchestration. There is intentionally NO "skill text prepended to the prompt"
// path here: dumping SKILL.md into context was never the product — a skill RUNS as a
// gated, navigated workflow, which is what the harness reimplements.

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

// ─────────────────────────────────────────────────────────────────────────────
// DECOMPOSED GRADER (v2) — the instrument fix.
//
// Why v1 (gradeReviewMessages) is noisy: it shows the grader the maintainer diff and
// asks it to holistically pick a 0–10 band. Two coupled failures result —
//   (1) ANCHORING LEAK: telling it in prose "the diff is calibration, not an answer
//       key" does NOT stop a reasoning model from anchoring on it. A review sitting ON
//       the diff's code gets rewarded; a deeper review that drifts AWAY gets tanked —
//       inconsistently. That inconsistency IS the ±7 variance (a strong review scored
//       8, 1, 3 on repeat).
//   (2) HOLISTIC FRAGILITY: one wrong step in the reasoning chain collapses the whole
//       band to 1, because the score is a single impression, not a composition.
//
// The fix: the quality grade NEVER sees the diff, and emits only low-variance FACTUAL
// y/n judgments; the score is composed from them IN CODE (scoreFromQuality). A single
// mis-call moves the score by ~1, never 8→1. The maintainer diff still has a job — but
// in a SEPARATE call (gradeReferenceOverlap) that judges topical overlap only and does
// NOT feed the score. So the reference is measured, not leaked into quality.
export function gradeQualityMessages({ code, review, domain = "architecture" }) {
  return [{
    role: "user",
    content:
      "You are STRICTLY judging the quality of a code review focused on " + domain + ".\n" +
      "You are given NO answer key. Judge the review ENTIRELY on its own merits as a " + domain +
      " review of THIS code.\n\n" +
      "The code that was reviewed:\n--- CODE ---\n" + code + "\n--- END CODE ---\n\n" +
      "The review under judgement:\n--- REVIEW ---\n" + review + "\n--- END REVIEW ---\n\n" +
      "Answer these FACTUAL questions about the review. Each is yes/no. Decide EACH on its own evidence; " +
      "do NOT let an overall impression override a specific question.\n\n" +
      "  grounded — Are the review's points specific to THIS code (it names actual variables / functions / " +
      "files / lines and concrete situations here), as opposed to generic advice that could apply to any codebase?\n" +
      "  real — Does it identify AT LEAST ONE genuinely real, important " + domain + " problem actually present in " +
      "this code? (Real = a senior engineer would agree it is worth fixing — not cosmetic, not stylistic, not invented.)\n" +
      "  multiple — Does it identify TWO OR MORE genuinely real, important " + domain + " problems (distinct points, " +
      "not the same point restated)?\n" +
      "  concrete — For the real problems it raises, are the fixes concrete — do they say specifically WHAT to change " +
      "so an engineer could act (not 'consider refactoring')?\n" +
      "  depth — Is at least one real problem a deep / load-bearing architectural issue (not a micro-issue like a " +
      "single re-render or a naming nit)?\n" +
      "  harmful — Does the review's MAIN recommendation give actively WRONG advice — something that would introduce " +
      "a bug, break currently-working behavior, or is factually incorrect about how this code works? A large-but-valid " +
      "refactor is NOT harmful; ambition is NOT harm. Mark yes ONLY for advice that is actually wrong or breaking.\n\n" +
      'Return ONLY JSON: {"grounded":"yes"|"no","real":"yes"|"no","multiple":"yes"|"no","concrete":"yes"|"no",' +
      '"depth":"yes"|"no","harmful":"yes"|"no","why":"one sentence citing the specific evidence for the borderline calls"}.',
  }];
}

// Compose the score from the factual y/n judgments — deterministic, so the only variance
// is in the (low-variance) judgments themselves, never in a holistic band-pick.
//   not grounded            → 2  (generic boilerplate, not about this code)
//   no real problem         → 3 / 4  (cosmetic only; 4 if at least concrete)
//   one real problem        → 5 / 6  (6 if its fix is concrete — the calibration "solid single finding")
//   several real problems   → 6 / 8  (8 if fixes are concrete)
//   several + concrete+deep → 9
//   harmful main thrust     → capped at 4 (wins over the band)
export function scoreFromQuality(g) {
  const yes = (v) => String(v ?? "").toLowerCase() === "yes";
  if (!yes(g?.grounded)) return 2;
  if (!yes(g?.real)) return yes(g?.concrete) ? 4 : 3;
  let s = !yes(g?.multiple) ? (yes(g?.concrete) ? 6 : 5) : (yes(g?.concrete) ? 8 : 6);
  if (yes(g?.multiple) && yes(g?.concrete) && yes(g?.depth)) s = 9;
  if (yes(g?.harmful)) s = Math.min(s, 4);
  return s;
}

// Single quality grade (no diff, no consensus). The whole point of v2 is that one grade
// is stable; the variance test proves whether consensus is still needed at all.
export async function gradeQuality({ callGrade, code, review, domain = "architecture", maxTokens = 8000 }) {
  const g = await callForJSON(callGrade, gradeQualityMessages({ code, review, domain }), { maxTokens, temperature: 0 });
  return { score: scoreFromQuality(g), judgments: g, why: g.why };
}

// SEPARATE reference-overlap probe — the maintainer diff's only remaining job. Judges
// TOPICAL overlap only (does the review touch the same underlying problem the maintainer
// fixed?), never quality, and does NOT feed the score. Recorded for analysis: it tells us
// whether a skill pushes the review AWAY from the maintainer's spot toward deeper issues.
export function referenceOverlapMessages({ diff, review, domain = "architecture" }) {
  return [{
    role: "user",
    content:
      "Below are a " + domain + " review and a SEPARATE real change a maintainer made to the same code.\n\n" +
      "--- MAINTAINER CHANGE ---\n" + diff + "\n--- END ---\n\n" +
      "--- REVIEW ---\n" + review + "\n--- END REVIEW ---\n\n" +
      "For ANALYSIS ONLY (not quality): does the review address the SAME underlying problem the maintainer's change " +
      "fixes, or a problem that clearly subsumes it? Ignore how good the review is; judge only topical overlap.\n\n" +
      'Return ONLY JSON: {"overlap":"yes"|"partial"|"no","why":"one sentence"}.',
  }];
}

export async function gradeReferenceOverlap({ callGrade, diff, review, domain = "architecture", maxTokens = 4000 }) {
  const g = await callForJSON(callGrade, referenceOverlapMessages({ diff, review, domain }), { maxTokens, temperature: 0 });
  return { overlap: g.overlap, why: g.why };
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

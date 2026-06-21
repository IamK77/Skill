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
export function gradeQualityMessages({ code, review, domain = "architecture", depthCriteria = "" }) {
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
      "  depth — Does at least one real problem reflect genuine, load-bearing insight into the HARD core of " + domain +
      "? " + (depthCriteria || ("Genuine " + domain + " insight — the structural / load-bearing problems, not surface nits.")) +
      " A review that is competent but consists MAINLY of superficial, cosmetic, or peripheral nits is NOT depth — " +
      "however many such points it lists. Naming the right symbol for the WRONG reason (engaging the correct code for " +
      "the wrong cause) does NOT count as depth.\n" +
      "  harmful — Does the review's MAIN recommendation give actively WRONG advice — something that would introduce " +
      "a bug, break currently-working behavior, or is factually incorrect about how this code works? A large-but-valid " +
      "refactor is NOT harmful; ambition is NOT harm. Mark yes ONLY for advice that is actually wrong or breaking.\n\n" +
      'Return ONLY JSON: {"grounded":"yes"|"no","real":"yes"|"no","multiple":"yes"|"no","concrete":"yes"|"no",' +
      '"depth":"yes"|"no","harmful":"yes"|"no","why":"one sentence citing the specific evidence for the borderline calls"}.',
  }];
}

// Compose the score from the factual y/n judgments — deterministic, so the only variance
// is in the (low-variance) judgments themselves, never in a holistic band-pick.
//
// DEPTH IS THE SPINE. An Opus panel re-grading two saved reviews split skill 7.6 / base 4.5
// while deepseek (old rules) split them base 8.7 / skill 8.1 — the SIGN flipped. The whole gap
// was the depth dimension (Opus 4/4 vs 0/4); deepseek rubber-stamped a pure re-render/perf
// review as "deep". Replaying the saved judgments through a depth-gated composition gave 7.1/7.1
// (a TIE) — proving the composition alone can't fix it, the depth QUESTION had to be sharpened
// too (see gradeQualityMessages). With both fixed, a correct depth call drives the band:
//   not grounded            → 2  (generic boilerplate, not about this code)
//   no real problem         → 3 / 4  (cosmetic only; 4 if at least concrete)
//   real but NOT deep        → 4 / 5  (competent perf/guard review; 5 if it raises several) — capped mid
//   deep                     → 5, +1 if several, +2 if concrete  → up to 8 (the only path to the 7+ band)
//   harmful main thrust     → graduated −3 penalty (NOT a hard cap). The k=10 validation showed
//                             a hard cap (min(s,4)) turned a 30/70-UNSTABLE harm judgment into a
//                             9↔4 cliff — the whole skill-review variance. A graduated penalty lets
//                             an ambiguous harm call wobble the score by 3, not 5, while a genuinely
//                             harmful review (stable harm=yes) still loses real ground.
export function scoreFromQuality(g) {
  const yes = (v) => String(v ?? "").toLowerCase() === "yes";
  if (!yes(g?.grounded)) return 2;                      // generic, not about this code
  if (!yes(g?.real)) return yes(g?.concrete) ? 4 : 3;   // nothing real to fix
  let s;
  if (!yes(g?.depth)) {
    s = yes(g?.multiple) ? 5 : 4;          // correct but shallow (perf/guards) — caps mid
  } else {
    s = 5;                                  // genuine architectural insight unlocks the 7+ band
    if (yes(g?.multiple)) s += 1;           // breadth on top of depth
    if (yes(g?.concrete)) s += 2;           // actionable depth → 8
  }
  if (yes(g?.harmful)) s = Math.max(0, s - 3);
  return s;
}

// Quality grade with CONSENSUS — the diff-blind score that now feeds combineScore. A single
// temp-0 deepseek draw still wobbles (a smoke run flipped `grounded` to no on a clearly-grounded
// review → q2 → composed 0), and since quality flows straight into the composed score, one flip
// poisons the cell. So mirror gradeConsensus: grade TWICE and mean; if the two scores differ by
// more than `threshold`, grade a THIRD and take the MEDIAN (rejects the outlier). The returned
// judgments/why are from the run nearest the consensus score (representative for the harm flag etc.).
export async function gradeQuality({ callGrade, code, review, domain = "architecture", depthCriteria = "", threshold = 2, maxTokens = 8000 }) {
  const one = async () => {
    const g = await callForJSON(callGrade, gradeQualityMessages({ code, review, domain, depthCriteria }), { maxTokens, temperature: 0 });
    return { score: scoreFromQuality(g), judgments: g, why: g.why };
  };
  const runs = [await one(), await one()];
  const escalated = Math.abs(runs[0].score - runs[1].score) > threshold;
  if (escalated) runs.push(await one());
  const sorted = runs.map((r) => r.score).sort((a, b) => a - b);
  const score = escalated ? sorted[1] : (sorted[0] + sorted[1]) / 2; // median of 3, else mean of 2
  const rep = [...runs].sort((a, b) => Math.abs(a.score - score) - Math.abs(b.score - score))[0];
  return { score, judgments: rep.judgments, why: rep.why, scores: runs.map((r) => r.score), escalated };
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

// ─────────────────────────────────────────────────────────────────────────────
// CATCH GRADE — the direction-aware "did the review get the planted bug RIGHT" probe.
//
// Why this exists (findings F1/F2): the diff-blind quality grader scores box-checking,
// not correctness. In the last run all 4 baseline reviews scored 8 while MISSING the
// planted bug, and 2 of them recommended the EXACT INVERSION of the maintainer's fix —
// one inverted review scored 8. gradeReferenceOverlap is recorded-not-scored AND
// direction-blind: it marks an inverted review "yes" (same topic, opposite advice).
//
// This grade is DELIBERATELY answer-key-aware (it sees the maintainer's fix + the
// fixture's catch_key), so it is a SEPARATE call that NEVER touches gradeQuality (C2:
// the quality grader stays blind). Its output is composed with quality IN CODE
// (combineScore), never folded into the quality prompt.
//
// It is direction-aware (F2): the verdict is one of
//   correct  — diagnoses the planted problem AND its recommended fix points the SAME
//              direction as the maintainer's (or a strict superset that subsumes it)
//   partial  — touches the planted problem but the fix is vague / incomplete / only
//              half-right (names the symptom, not the corrected design)
//   inverted — diagnoses the area but recommends the OPPOSITE of the correct fix
//              (entrenches the bug / would make a maintainer revert) — WORSE than a miss
//   miss     — does not engage the planted problem at all
//
// GENERALITY (C1): the bug's SHAPE is NOT in this prompt. The grader logic only knows
// the abstract notions "the maintainer's actual change" (fix.diff, already per-fixture)
// and an OPTIONAL per-fixture `catch_key` { problem, correct_direction, inverted_direction }
// — plain English the fixture author writes once, the same three fields for ANY planted
// bug (a derive-don't-store bug, an IDOR, a race). No "usageMetrics" / "derive" / "draft
// release" string lives in core.mjs. If catch_key is absent the grader falls back to
// inferring direction from the diff alone (coarser, still direction-aware).
//
// ANTI-BUZZWORD (C3): the prompt requires the catch be GROUNDED — the review must name
// the actual code (the real symbol/handler/path) and reason about THIS code's mechanism.
// A review that merely chants the right slogan ("single source of truth", "add an authz
// check") without locating it in this code is `grounded:false` → combineScore refuses to
// award the catch (treated as no-better-than-miss). So a keyword can't earn the signal.
export function catchMessages({ diff, review, domain = "architecture", catchKey = null }) {
  const key = catchKey && (catchKey.problem || catchKey.correct_direction)
    ? "The planted problem, in the fixture author's words (NOT a script to match verbatim — the review may " +
      "use different language for the SAME underlying problem and fix):\n" +
      (catchKey.problem ? "  • PROBLEM: " + catchKey.problem + "\n" : "") +
      (catchKey.correct_direction ? "  • A CORRECT fix points this way: " + catchKey.correct_direction + "\n" : "") +
      (catchKey.inverted_direction ? "  • The INVERSION (entrenches/worsens the bug) looks like: " + catchKey.inverted_direction + "\n" : "") +
      "\n"
    : "";
  return [{
    role: "user",
    content:
      "You are checking whether a " + domain + " review correctly DIAGNOSED a specific known problem in the code, " +
      "and whether its recommended fix points the RIGHT direction.\n\n" +
      "Here is the REAL change a maintainer later made to fix that problem (the ground-truth direction of the fix):\n" +
      "--- MAINTAINER FIX ---\n" + diff + "\n--- END ---\n\n" +
      key +
      "--- REVIEW UNDER CHECK ---\n" + review + "\n--- END REVIEW ---\n\n" +
      "Decide TWO things:\n\n" +
      "1) grounded — Does the review actually LOCATE this problem in THIS code: does it name the real symbol / " +
      "function / handler / path involved and reason about how THIS code behaves? A review that only chants the " +
      "right slogan (e.g. names the general principle) WITHOUT pointing at the actual code is NOT grounded. " +
      "yes / no.\n\n" +
      "2) verdict — comparing the review's MAIN recommendation about this problem to the maintainer's fix DIRECTION:\n" +
      "   • correct  — it diagnoses this problem AND its fix points the SAME way as the maintainer's (or a broader " +
      "change that clearly SUBSUMES it). Different wording is fine; same direction is what matters.\n" +
      "   • partial  — it touches this problem but the fix is vague, incomplete, or only half-right (notes the " +
      "symptom, doesn't arrive at the corrected design).\n" +
      "   • inverted — it engages this area but recommends the OPPOSITE of the correct fix: advice that would " +
      "entrench or worsen the very problem, such that applying it then applying the maintainer's fix would be " +
      "contradictory. This is WORSE than not mentioning it.\n" +
      "   • miss     — it does not engage this problem at all.\n\n" +
      "Judge ONLY this one planted problem. Other findings in the review are irrelevant here.\n\n" +
      'Return ONLY JSON: {"grounded":"yes"|"no","verdict":"correct"|"partial"|"inverted"|"miss","why":"one sentence citing the review\'s actual words"}.',
  }];
}

export async function gradeCatch({ callGrade, diff, review, domain = "architecture", catchKey = null, maxTokens = 4000, k = 2 }) {
  const SEV = { inverted: 0, miss: 1, partial: 2, correct: 3 };   // bad → good; used to pick the MEDIAN if 3 differ
  const one = async () => {
    const g = await callForJSON(callGrade, catchMessages({ diff, review, domain, catchKey }), { maxTokens, temperature: 0 });
    const grounded = String(g.grounded ?? "").toLowerCase() === "yes";
    let verdict = String(g.verdict ?? "miss").toLowerCase();
    if (!["correct", "partial", "inverted", "miss"].includes(verdict)) verdict = "miss";
    // ANTI-BUZZWORD (C3): an ungrounded "catch" is a slogan, not a diagnosis — demote any
    // positive/active verdict to a miss. (An ungrounded INVERTED claim is also just noise → miss.)
    if (!grounded && verdict !== "miss") verdict = "miss";
    return { verdict, grounded, why: g.why };
  };
  // CONSENSUS — catch is the DOMINANT lever on the composed score, so do not trust one temp-0 draw.
  // Grade twice; if the verdicts agree, take it; if they disagree, escalate to a third and take the
  // MODE (the median by severity when all three differ). Mirrors gradeConsensus for the quality band.
  const runs = [await one()];
  if (k > 1) runs.push(await one());
  let chosen;
  if (runs.length < 2 || runs[0].verdict === runs[1].verdict) {
    chosen = runs[runs.length - 1];
  } else {
    runs.push(await one());
    const counts = {};
    for (const r of runs) counts[r.verdict] = (counts[r.verdict] || 0) + 1;
    const top = Math.max(...Object.values(counts));
    const modal = Object.keys(counts).filter((v) => counts[v] === top);
    const verdict = modal.length === 1
      ? modal[0]
      : runs.map((r) => r.verdict).sort((a, b) => SEV[a] - SEV[b])[1]; // 3 distinct → median severity
    chosen = runs.find((r) => r.verdict === verdict) || runs[0];
  }
  return { verdict: chosen.verdict, grounded: chosen.grounded, why: chosen.why, runs: runs.map((r) => r.verdict) };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEGENERATE-OUTPUT DETECTOR (F5). One skill review came back EMPTY (28 chars) after
// over-navigation, scored 2, and dragged the mean. The bench must DETECT this and
// flag+exclude it (logged + counted, never silently averaged — C4), not treat a
// non-review as a data point. Generic: no fixture/bug knowledge, just "is this a review
// at all". `complete=false` (the run hit the turn cap without finishing) is also degenerate.
export function isDegenerate(review, { minChars = 120, complete = true } = {}) {
  const text = String(review || "").trim();
  if (complete === false) return { degenerate: true, reason: "incomplete: hit turn cap without finishing" };
  if (text.length < minChars) return { degenerate: true, reason: `too short (${text.length} chars < ${minChars})` };
  return { degenerate: false, reason: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSE the final 0–10 from the diff-BLIND quality score and the answer-key-aware
// catch verdict — IN CODE, so the quality grader stays blind (C2) yet getting the
// planted bug right/wrong moves the score (F1/F2).
//
// Quality measures "is this a good review of this code on its own merits"; catch
// measures "did it get the ONE thing we know is wrong right". The instrument's whole
// defect was that a box-checking review that MISSES the bug, or INVERTS it, banked the
// quality 8. So catch is an additive correctness signal layered on quality:
//
//   correct  → +1, but ONLY if quality is already grounded/real (q>=4). A correct catch on an
//                    UNGROUNDED review (q 2-3) gets NO lift — so buzzwords cannot launder a bad
//                    review into a "solid" score (C3). No unconditional floor.
//   partial  → −1  (a half-catch of the one known-important problem is mild evidence of over-rating)
//   miss     → −3  (a polished review that missed the known-important problem is over-rated —
//                    the F1/F4 holistic-vs-dimensional gap, in code)
//   inverted → −4  (worse than a miss, F2: actively wrong on the main known issue — a single
//                    graduated penalty, no extra ceiling, so it can't double-dip q5→1)
//
// MAGNITUDES were TUNED by replaying the saved reviews against the Opus blind panel (n=7, directional):
// +1/−1/−3/−4 tracked the panel's holistic scores at meanAbsErr 0.50 (vs 1.21 for the first-cut
// +2/0/−2/−4, which over-rated by ~1). Revisit as more fixtures/trials accumulate. Bounded so one
// catch mis-call moves the score ≤4 (inverted) / ≤3 (others); a correct↔miss swing is 4 pts. Clamps 0–10.
// GENERALITY: these are verdict→adjustment rules, identical for every fixture; the per-fixture
// part is only WHICH verdict the catch grade returns.
export function combineScore(quality, catch_) {
  const q = Math.max(0, Math.min(10, Number(quality) || 0));
  const v = catch_?.verdict || "miss";
  let s = q;
  if (v === "correct") s = q >= 4 ? q + 1 : q;   // lift ONLY a grounded/real review (q>=4); NO unconditional floor
  else if (v === "partial") s = q - 1;
  else if (v === "miss") s = q - 3;
  else if (v === "inverted") s = q - 4;            // single graduated penalty; NO extra ceiling (was double-dipping)
  return Math.max(0, Math.min(10, s));
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

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICS (F6) — a bare mean delta over n=4, 1 fixture is not evidence. These are
// the shared, fixture-AGNOSTIC stat primitives the A/B summary and the calibration
// mode both use. They take arrays of numbers; they know nothing about this bug.
export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export function stdev(xs) {                       // SAMPLE sd (n-1); the spread WITHIN an arm
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
}

// WITHIN-RUN PAIRED comparison (F6). The skill and baseline arms are run in the SAME
// trial on the SAME fixture under the SAME compute cap — they are NATURALLY PAIRED, so
// the unit of evidence is the per-trial DIFFERENCE (skill−base), which cancels the
// shared per-fixture / per-run difficulty that made the baseline arm jump 4.75→7.25
// across runs and the cross-run delta unreliable. We report:
//   • the paired mean delta and its SD/standard-error,
//   • a bootstrap CI on the paired delta (no normality assumption — n is tiny and the
//     score is a discrete 0–10 ladder, so a t-interval would be a lie; resampling the
//     observed pairs is honest about how little we have),
//   • the win rate (fraction of pairs where skill strictly beat base) — a sign test
//     that survives the score being ordinal rather than interval.
// Pure of any fixture specifics: feed it pairs from one fixture or pooled across many.
export function pairedSummary(pairs, { iters = 10000, ci = 0.95, seed = 1 } = {}) {
  const clean = pairs.filter((p) => Number.isFinite(p.skill) && Number.isFinite(p.base));
  const n = clean.length;
  const diffs = clean.map((p) => p.skill - p.base);
  const meanDelta = mean(diffs);
  const sd = stdev(diffs);
  const se = n ? sd / Math.sqrt(n) : NaN;
  const wins = diffs.filter((d) => d > 0).length;
  const ties = diffs.filter((d) => d === 0).length;
  const losses = diffs.filter((d) => d < 0).length;
  // deterministic bootstrap (mulberry32) so a CI is reproducible across runs/CI.
  let s = seed >>> 0;
  const rng = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let lo = NaN, hi = NaN, crossesZero = true;
  if (n >= 2) {
    const boots = new Array(iters);
    for (let b = 0; b < iters; b++) {
      let acc = 0;
      for (let i = 0; i < n; i++) acc += diffs[(rng() * n) | 0];
      boots[b] = acc / n;
    }
    boots.sort((a, b) => a - b);
    const a = (1 - ci) / 2;
    lo = boots[Math.floor(a * iters)];
    hi = boots[Math.min(iters - 1, Math.floor((1 - a) * iters))];
    crossesZero = lo <= 0 && hi >= 0;        // CI spans 0 ⇒ delta not distinguishable from noise
  }
  return {
    n, meanDelta, sd, se,
    skillMean: mean(clean.map((p) => p.skill)),
    baseMean: mean(clean.map((p) => p.base)),
    skillSd: stdev(clean.map((p) => p.skill)),
    baseSd: stdev(clean.map((p) => p.base)),
    wins, ties, losses,
    winRate: n ? wins / n : NaN,
    ci, ciLo: lo, ciHi: hi, crossesZero,
  };
}

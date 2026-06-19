// skill-lab color system — construct the oklch token system and MEASURE every pair
// (WCAG 2 ratio + APCA Lc). Closes livery's standing "contrast asserted, never measured" caveat.
// Run: node color-build.mjs   → prints the contrast report + flags any floor miss.

// ---- oklch → linear sRGB → sRGB (Björn Ottosson) ----
const rad = (d) => (d * Math.PI) / 180;
function oklchToRgb(L, C, H) {
  const a = C * Math.cos(rad(H)), b = C * Math.sin(rad(H));
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const enc = (x) => { x = Math.max(0, Math.min(1, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; };
  return [enc(R), enc(G), enc(B)];
}
const inGamut = (L, C, H) => { const a = C * Math.cos(rad(H)), b = C * Math.sin(rad(H)); const l_ = L + 0.3963377774*a+0.2158037573*b, m_=L-0.1055613458*a-0.0638541728*b, s_=L-0.0894841775*a-1.2914855480*b; const l=l_**3,m=m_**3,s=s_**3; const R=+4.0767416621*l-3.3077115913*m+0.2309699292*s,G=-1.2684380046*l+2.6097574011*m-0.3413193965*s,B=-0.0041960863*l-0.7034186147*m+1.7076147010*s; return [R,G,B].every(x=>x>=-0.001&&x<=1.001); };
const hex = (L, C, H) => "#" + oklchToRgb(L, C, H).map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");

// ---- WCAG 2 contrast ratio ----
function wcagY([r, g, b]) { const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
const wcag = (fg, bg) => { const a = wcagY(fg) + 0.05, b = wcagY(bg) + 0.05; return (Math.max(a, b) / Math.min(a, b)); };

// ---- APCA (0.98G-4g) ----
function apcaY([r, g, b]) { const s = (c) => c ** 2.4; let Y = 0.2126729 * s(r) + 0.7151522 * s(g) + 0.0721750 * s(b); return Y < 0.022 ? Y + (0.022 - Y) ** 1.414 : Y; }
function apca(fg, bg) {
  const Ytxt = apcaY(fg), Ybg = apcaY(bg);
  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
  let S;
  if (Ybg > Ytxt) S = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14;        // normal: dark text / light bg
  else S = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14;                    // reverse: light text / dark bg
  let Lc;
  if (Math.abs(S) < 0.1) return 0;
  Lc = S > 0 ? (S - 0.027) * 100 : (S + 0.027) * 100;
  return Math.round(Math.abs(Lc) * 10) / 10;
}

// ===================== THE TOKEN SYSTEM (single source) =====================
// Neutral ramp — WARM paper&ink, H≈85, low chroma (no pure gray). L from contract.
const NH = 85;
const N = {
  "paper-50":  [0.985, 0.004, NH],  // page background (paper)
  "paper-100": [0.967, 0.006, NH],  // raised surface
  "paper-150": [0.945, 0.008, NH],  // recessed / track
  "n-200":     [0.905, 0.010, NH],  // hairline / faint rule
  "n-300":     [0.850, 0.012, NH],  // border / divider
  "n-400":     [0.720, 0.014, NH],  // disabled text / icon
  "n-500":     [0.620, 0.015, NH],  // placeholder
  "n-600":     [0.520, 0.016, NH],  // tertiary text (caption/caveat)
  "n-700":     [0.430, 0.016, NH],  // secondary text
  "n-800":     [0.320, 0.014, NH],  // strong text
  "ink":       [0.235, 0.012, NH],  // primary text (ink)
  "ink-950":   [0.180, 0.010, NH],  // max ink / headline
  "border-strong": [0.620, 0.015, NH], // functional input/interactive border (≥3:1, SC 1.4.11)
};
// Accent — deep evergreen, H158. canon anchor = accent-600 (0.47 0.075 158).
const A = {
  "accent-700": [0.420, 0.078, 158],
  "accent-600": [0.470, 0.075, 158], // ← canon anchor: link / brand / positive delta (light)
  "accent-500": [0.560, 0.090, 158],
  "accent-300": [0.760, 0.075, 158], // dark-mode link/accent text
  "accent-200": [0.860, 0.045, 158],
};
// Negative-delta — restrained sober ochre-brown (NOT alarmist red, NOT clay-coral, NOT indigo).
const NEG = { "neg": [0.500, 0.060, 55], "neg-dark": [0.760, 0.070, 60] };
// System error (genuine API/parse failure — a real error may use a sober red; this is NOT the result color)
const ERR = { "err": [0.500, 0.130, 28], "err-bg": [0.960, 0.020, 30] };

const ALL = { ...N, ...A, ...NEG, ...ERR };

// gamut check
const oog = Object.entries(ALL).filter(([, v]) => !inGamut(...v));
if (oog.length) console.log("⚠ OUT OF sRGB GAMUT:", oog.map(([k]) => k).join(", "));

// ===================== MEASURED PAIRS (light theme) =====================
const rgb = (k) => oklchToRgb(...ALL[k]);
const PAIRS = [
  // [fg, bg, role, wcagFloor, apcaFloor]
  ["ink",       "paper-50",  "primary body / method prose",     4.5, 75],
  ["ink-950",   "paper-50",  "headline (large)",                3.0, 60],
  ["n-700",     "paper-50",  "secondary (caveats — NO pale gray)",4.5, 75],
  ["n-700",     "paper-100", "secondary on raised surface",     4.5, 75],
  ["n-600",     "paper-50",  "tertiary / caption",              4.5, 60],
  ["n-500",     "paper-50",  "placeholder (exempt, not invisible)",3.0, 45],
  ["accent-600","paper-50",  "link / brand / positive delta",   4.5, 60],
  ["accent-600","paper-100", "accent on raised surface",        4.5, 60],
  ["paper-50",  "accent-600","on-accent (button text)",         4.5, 60],
  ["neg",       "paper-50",  "negative delta (sober)",          4.5, 60],
  ["err",       "err-bg",    "error text on error bg",          4.5, 60],
  ["border-strong","paper-50", "input/interactive border (1.4.11)",3.0, 45],
  ["border-strong","paper-100","input border on raised surface",3.0, 45],
  ["accent-600","paper-50",  "focus ring (non-text)",           3.0, 45],
];
// NOTE: --border-subtle (n-300, decorative section rules / hairlines) is EXEMPT from SC 1.4.11
// (it does not carry a component boundary) — kept delicate for the editorial "float on paper".
function report(title, pairs, rgbFn) {
  console.log(`\n=== ${title} ===`);
  console.log("role".padEnd(40), "WCAG", "  ", "APCA", "  pass");
  let fails = 0;
  for (const [fg, bg, role, wF, aF] of pairs) {
    const w = wcag(rgbFn(fg), rgbFn(bg)), a = apca(rgbFn(fg), rgbFn(bg));
    const ok = w >= wF && a >= aF;
    if (!ok) fails++;
    console.log(role.padEnd(40), w.toFixed(2).padStart(5), "  ", String(a).padStart(5), `  ${ok ? "✓" : "✗ (need W≥"+wF+" A≥"+aF+")"}`);
  }
  console.log(fails ? `\n${fails} FLOOR MISS` : "\nall pairs pass floors ✓");
  return fails;
}
let fails = report("LIGHT — measured contrast", PAIRS, rgb);

// ===================== DARK — re-tuned ramp (NOT invert) =====================
// Deep warm gray base (not #000), elevation by lighter surface, off-white text,
// accent L raised + C dropped. Same warm hue family (H≈85 neutrals, H158 accent).
const DARK = {
  "d-bg":            [0.150, 0.008, NH],  // page base (deep warm gray, halation-safe)
  "d-surface":       [0.190, 0.009, NH],  // raised surface (elevation by lighter, not shadow)
  "d-surface-2":     [0.235, 0.010, NH],  // higher elevation (result panel)
  "d-border-subtle": [0.340, 0.010, NH],  // decorative rule (exempt)
  "d-border-strong": [0.700, 0.013, NH],  // functional input border (APCA Lc≥45 on dark)
  "d-text":          [0.910, 0.006, NH],  // primary (off-white, not #fff)
  "d-text-2":        [0.865, 0.008, NH],  // secondary (caveats) — raised for APCA Lc≥75
  "d-text-3":        [0.790, 0.010, NH],  // tertiary — raised for APCA Lc≥60
  "d-placeholder":   [0.560, 0.011, NH],
  "d-accent":        [0.760, 0.072, 158], // link/brand/positive (L↑ C↓ vs light 0.47/0.075)
  "d-neg":           [0.770, 0.065, 60],  // negative delta (sober, light-on-dark)
  "d-on-accent":     [0.180, 0.010, NH],  // text on an accent fill
};
const drgb = (k) => oklchToRgb(...(DARK[k] || ALL[k]));
const DPAIRS = [
  ["d-text",        "d-bg",        "primary body / method prose",      4.5, 75],
  ["d-text-2",      "d-bg",        "secondary (caveats)",              4.5, 75],
  ["d-text-2",      "d-surface",   "secondary on raised surface",      4.5, 75],
  ["d-text-3",      "d-bg",        "tertiary / caption",               4.5, 60],
  ["d-text",        "d-surface-2", "text on result panel",             4.5, 75],
  ["d-accent",      "d-bg",        "link / positive delta",            4.5, 60],
  ["d-accent",      "d-surface",   "accent on raised surface",         4.5, 60],
  ["d-on-accent",   "d-accent",    "on-accent (button text)",          4.5, 60],
  ["d-neg",         "d-bg",        "negative delta (sober)",           4.5, 60],
  ["d-border-strong","d-bg",       "input border (1.4.11)",            3.0, 45],
  ["d-border-strong","d-surface",  "input border on raised surface",   3.0, 45],
  ["d-accent",      "d-bg",        "focus ring (non-text)",            3.0, 45],
];
fails += report("DARK — measured contrast (re-tuned, not inverted)", DPAIRS, drgb);
const doog = Object.entries(DARK).filter(([, v]) => !inGamut(...v));
if (doog.length) console.log("⚠ DARK OUT OF GAMUT:", doog.map(([k]) => k).join(", "));

// hex fallbacks for reference
console.log("\n=== token → hex (sRGB fallback) ===");
for (const [k, v] of Object.entries(ALL)) console.log(k.padEnd(12), hex(...v), `oklch(${v[0]} ${v[1]} ${v[2]})`);

process.exit(fails ? 1 : 0);

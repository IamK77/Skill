#!/usr/bin/env node
// Regression test harness for color-coherence.mjs.
// ----------------------------------------------------------------------------
// A detector is only trustworthy if it fires on known violations AND stays quiet on
// known-good designs. Each fixture below declares its ground truth; the runner drives
// the probe (via a data: URL, no temp files) and asserts the findings match. Exits
// non-zero on any mismatch — so editing the probe or its thresholds can't silently
// regress. Requires Node >= 22 and a Chromium-family browser (see color-coherence.mjs).
//
// Layers:
//   Layer 1 — per-rule positives / negatives / boundaries + a color-SYNTAX matrix
//             (hex/rgb/hsl/oklch/lab/color()) — the regression for the oklch-parsing bug.
//   Layer 2 — whole-design calibration: a coherent design must be quiet; an AI-default
//             design must be loud. Tunes the thresholds against real shapes.
//   Layer 3 — real rendered pages have no ground truth; run the probe on them manually
//             (`node color-coherence.mjs <url>`) for crash/sanity only. See TESTING.md.
// ----------------------------------------------------------------------------
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const PROBE = fileURLToPath(new URL('./color-coherence.mjs', import.meta.url))
const page = (bg, inner, extra = '') => `<body style="background:${bg};margin:0;min-height:100vh;${extra}">${inner}</body>`
const bigBox = c => `<div style="background:${c};width:70%;height:45vh;margin:0 auto"></div>`

const FIXTURES = [
  // ── Layer 1 · positives (must flag) ───────────────────────────────────────
  { name: 'pos/pure-black', expect: { mustFlag: ['pure-black'], mustNotFlag: ['temperature-break'], tempKnown: true },
    html: page('oklch(.97 .008 84)', bigBox('oklch(0 0 0)')) },
  { name: 'pos/pure-white', expect: { mustFlag: ['pure-white'], mustNotFlag: ['temperature-break'], tempKnown: true },
    html: page('oklch(.97 .008 84)', bigBox('#fff')) },
  { name: 'pos/temperature-break', expect: { mustFlag: ['temperature-break'], mustNotFlag: ['pure-black', 'pure-white'], tempKnown: true },
    html: page('oklch(.97 .008 84)', bigBox('oklch(.6 0 0)')) },
  { name: 'pos/palette-sprawl', expect: { mustFlag: ['palette-sprawl'] },
    html: page('oklch(.97 .008 84)', `<button style="background:oklch(.55 .14 250);color:#fff">A</button><button style="background:oklch(.56 .135 252);color:#fff">B</button>`) },
  { name: 'pos/low-contrast', expect: { mustFlag: ['contrast'] },
    html: page('oklch(.97 .008 84)', `<p>pale gray body text that fails the floor on warm paper</p>`, 'color:oklch(.8 .01 84);font:16px sans-serif') },

  // ── Layer 1 · negatives (must NOT flag) ───────────────────────────────────
  { name: 'neg/coherent-warm', expect: { clean: true, tempKnown: true },
    html: page('oklch(.97 .008 84)', `<h1>Heading</h1><p>Body in tinted near-black on warm paper.</p><div style="background:oklch(.985 .006 84);color:oklch(.26 .013 56);padding:20px">tinted surface card</div><button style="background:oklch(.5 .09 158);color:oklch(.97 .01 158)">Action</button>`, 'color:oklch(.26 .013 56);font:16px sans-serif') },
  { name: 'neg/light-on-dark-ok', expect: { mustNotFlag: ['contrast', 'pure-black', 'temperature-break'] },
    html: page('oklch(.97 .008 84)', `<div style="background:oklch(.2 .012 56);color:oklch(.95 .005 84);width:70%;height:45vh;margin:0 auto;padding:20px">light text on a properly tinted dark card</div>`) },
  { name: 'neg/dark-mode-coherent', expect: { clean: true },
    html: page('oklch(.16 .008 250)', `<h1>Dark</h1><p>Off-white text on a deep tinted base.</p><div style="background:oklch(.2 .008 250);padding:20px">raised dark surface</div><button style="background:oklch(.7 .1 250);color:oklch(.16 .01 250)">Action</button>`, 'color:oklch(.9 .005 250);font:16px sans-serif') },

  // ── Layer 1 · boundaries ──────────────────────────────────────────────────
  { name: 'edge/near-black-ok', expect: { mustNotFlag: ['pure-black'] },
    html: page('oklch(.97 .008 84)', bigBox('oklch(.18 .013 56)')) },
  { name: 'edge/offwhite-ok', expect: { mustNotFlag: ['pure-white'] },
    html: page('oklch(.98 .008 84)', `<p>off-white page</p>`) },
  { name: 'edge/gradient-bg-no-false-contrast', expect: { mustNotFlag: ['contrast'] },
    html: page('oklch(.2 .01 56)', `<a style="color:#2a1c0e;background:linear-gradient(145deg,#d8b878,#b87333);padding:14px 28px;border-radius:999px;display:inline-block">Buy now</a>`) },

  // ── Layer 2 · whole-design calibration ────────────────────────────────────
  { name: 'calib/good-editorial', expect: { clean: true, tempKnown: true },
    html: page('oklch(.967 .008 84)', `<h1>Report</h1><p>Warm paper, tinted ink, one restrained accent.</p><div style="background:oklch(.985 .006 84);color:oklch(.26 .013 56);padding:24px;margin:16px 0">summary card</div><a style="color:oklch(.45 .09 158)">link</a> <button style="background:oklch(.5 .09 158);color:oklch(.97 .01 158)">Export</button>`, 'color:oklch(.265 .013 56);font:16px sans-serif') },
  { name: 'calib/bad-ai-default', expect: { mustFlag: ['pure-black', 'palette-sprawl'] },
    html: page('#0a0e14', `<div style="background:#000;width:60%;height:40vh;margin:0 auto"></div><button style="background:oklch(.51 .2 277);color:#fff">A</button><button style="background:oklch(.52 .19 278);color:#fff">B</button>`, 'color:#c9d1d9;font:16px sans-serif') },
]

// ── Layer 1 · color-syntax matrix (the regression for the oklch-parsing bug) ──
// Same shape — warm page + a pure-white panel — in every syntax. The probe must READ
// the syntax (temperature detected) AND flag the pure-white panel, in all of them.
const SYNTAX = {
  hex: ['#f7f3ec', '#ffffff'],
  rgb: ['rgb(247,243,236)', 'rgb(255,255,255)'],
  hsl: ['hsl(40 33% 95%)', 'hsl(0 0% 100%)'],
  oklch: ['oklch(.97 .008 84)', 'oklch(1 0 0)'],
  lab: ['lab(96% 1 6)', 'lab(100% 0 0)'],
  'color-srgb': ['color(srgb .968 .953 .925)', 'color(srgb 1 1 1)'],
}
for (const [k, [bg, panel]] of Object.entries(SYNTAX))
  FIXTURES.push({ name: `syntax/${k}`, expect: { mustFlag: ['pure-white'], tempKnown: true }, html: page(bg, bigBox(panel)) })

function runProbe(html) {
  const target = 'data:text/html;base64,' + Buffer.from(html).toString('base64')
  return new Promise((res, rej) => {
    const p = spawn('node', [PROBE, '--json', target], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d)
    p.on('close', code => {
      const line = out.trim().split('\n').pop()
      try { res(JSON.parse(line)) }
      catch { rej(new Error(`probe gave no JSON (exit ${code}). stdout=${out.slice(0, 160)} stderr=${err.slice(0, 160)}`)) }
    })
  })
}

function check(expect, r) {
  const found = new Set(r.findings.map(f => f.rule))
  const fails = []
  if (expect.clean && r.findings.length) fails.push(`expected CLEAN, got: ${[...found].join(', ')}`)
  for (const m of expect.mustFlag || []) if (!found.has(m)) fails.push(`missing must-flag "${m}" (got: ${[...found].join(', ') || 'none'})`)
  for (const m of expect.mustNotFlag || []) if (found.has(m)) fails.push(`false-positive "${m}"`)
  if (expect.tempKnown && !r.temperature.known) fails.push('temperature NOT detected — syntax likely not parsed')
  return fails
}

let passed = 0, failed = 0
console.log(`\n  color-coherence probe · ${FIXTURES.length} fixtures\n  ${'-'.repeat(64)}`)
for (const fx of FIXTURES) {
  let fails
  try { fails = check(fx.expect, await runProbe(fx.html)) }
  catch (e) { fails = [e.message] }
  if (fails.length) { failed++; console.log(`  ✗ ${fx.name}`); for (const f of fails) console.log(`      ${f}`) }
  else { passed++; console.log(`  ✓ ${fx.name}`) }
}
console.log(`  ${'-'.repeat(64)}\n  ${passed} passed · ${failed} failed\n`)
process.exit(failed ? 1 : 0)

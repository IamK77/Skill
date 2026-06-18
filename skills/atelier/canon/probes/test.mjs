#!/usr/bin/env node
// Regression test harness for ai-default.mjs.
// ----------------------------------------------------------------------------
// A detector is only trustworthy if it fires on the known AI-default mean AND stays
// silent on a design with a decided point of view. Each fixture declares its ground
// truth; the runner drives the probe (via a data: URL, no temp files) and asserts the
// fired tell-ids match. Exits non-zero on any mismatch — so editing the detector or its
// thresholds can't silently regress. Requires Node >= 22 and a Chromium-family browser
// (see ai-default.mjs).
//
// Three fixtures, three claims:
//   default/textbook  — the statistical mean (slate canvas, indigo accent, Inter, aurora,
//                        glass, centered hero, gradient-word, hype copy, agent telemetry,
//                        stock logos): the visual AND copy tells must ALL fire.
//   decided/editorial — a design derived from a point of view (warm paper, a real display
//                        serif, monochrome headline, an off-band ink accent, human copy,
//                        no stock logos): must be CLEAN (0 tells).
//   copy/voice-only   — a visually-plain page whose only sin is the WORDS (hype + stock
//                        logos): proves copy detection fires independently of the pixels.
// ----------------------------------------------------------------------------
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const PROBE = fileURLToPath(new URL('./ai-default.mjs', import.meta.url))

const FIXTURES = [
  // ── the AI-default mean — every known tell should fire ─────────────────────
  {
    name: 'default/textbook',
    expect: {
      mustFlag: ['slate-canvas', 'accent-band', 'framework-default', 'voiceless-type',
        'aurora-gradient', 'glassmorphism', 'centered-hero', 'heading-accent-word',
        'hype-copy', 'agent-demo-template', 'stock-logo-set'],
    },
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{background:oklch(.18 .03 265);color:#c9d1d9;font:16px/1.6 Inter,system-ui,sans-serif;margin:0}
      h1{font-family:Inter,system-ui,sans-serif;font-size:52px;text-align:center;color:#e6edf3;margin:40px 0}
      .aurora{width:100%;height:320px;background-image:radial-gradient(40% 50% at 20% 10%,#6366f155,transparent),radial-gradient(40% 50% at 80% 20%,#8b5cf655,transparent)}
      .glass{width:280px;height:180px;margin:24px auto;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:#ffffff14;border-radius:16px}
      .cta{background:rgb(99,102,241);color:#fff;border:0;padding:14px 28px;border-radius:10px;font-size:16px}
    </style></head><body>
      <div class="aurora"></div>
      <h1>The future of work, <span style="color:#6366f1">supercharged</span></h1>
      <p>AI-powered outreach that seamlessly elevates your pipeline to the next level.</p>
      <div class="glass">Researching Stripe · 1.2s · 5 sources — Completed</div>
      <button class="cta">Get started</button>
      <p>Trusted by Stripe, Notion, Linear, Vercel and Figma.</p>
    </body></html>`,
  },

  // ── a design with a point of view — must be silent ─────────────────────────
  {
    name: 'decided/editorial',
    expect: { clean: true },
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{background:oklch(.965 .013 86);color:oklch(.25 .021 58);font:18px/1.7 "Iowan Old Style",Georgia,serif;margin:0;padding:48px}
      h1{font-family:"Iowan Old Style",Georgia,serif;font-size:48px;text-align:left;color:oklch(.25 .021 58);font-weight:600;letter-spacing:-.01em;margin:0 0 24px}
      .accent{color:oklch(.52 .2 33)}
      .letter p{font-size:20px;line-height:1.74;max-width:60ch}
      .note{font:14px/1.5 -apple-system,sans-serif;color:oklch(.51 .021 64)}
    </style></head><body>
      <p class="note" style="letter-spacing:.2em;text-transform:uppercase">On cold outreach</p>
      <h1>You shouldn't need forty open tabs to write one honest email.</h1>
      <div class="letter">
        <p>Give it a company. It reads their site, finds what is actually happening there,
        and drafts the letter you would write yourself — if you had the afternoon. Every line
        it sends is anchored to something it read. So you can trust it, or argue with it.</p>
        <p>For instance: Patagonia, Monzo, or A24.</p>
      </div>
      <p class="note">A footnote, in the editor's <span class="accent">red</span>: the apparatus of reading is the proof of work.</p>
    </body></html>`,
  },

  // ── only the words are AI — proves copy tells fire without any visual tell ──
  {
    name: 'copy/voice-only',
    expect: {
      mustFlag: ['hype-copy', 'stock-logo-set'],
      mustNotFlag: ['slate-canvas', 'accent-band', 'framework-default', 'voiceless-type',
        'aurora-gradient', 'glassmorphism', 'centered-hero', 'heading-accent-word'],
    },
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      body{background:oklch(.97 .008 84);color:oklch(.26 .015 60);font:18px/1.7 Georgia,serif;margin:0;padding:48px}
      h1{font-family:Georgia,serif;font-size:44px;text-align:left;color:oklch(.26 .015 60);margin:0 0 24px}
    </style></head><body>
      <h1>Outreach, reimagined</h1>
      <p>Supercharge your pipeline. The future of sales is AI-powered and effortless.</p>
      <p>Trusted by the best: Stripe, Notion, Linear, Vercel, and Shopify.</p>
    </body></html>`,
  },
]

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
  const found = new Set((r.tells || []).map(t => t.id))
  const fails = []
  if (expect.clean && found.size) fails.push(`expected CLEAN, got: ${[...found].join(', ')}`)
  for (const m of expect.mustFlag || []) if (!found.has(m)) fails.push(`missing must-flag "${m}" (got: ${[...found].join(', ') || 'none'})`)
  for (const m of expect.mustNotFlag || []) if (found.has(m)) fails.push(`false-positive "${m}"`)
  return fails
}

let passed = 0, failed = 0
console.log(`\n  ai-default detector · ${FIXTURES.length} fixtures\n  ${'-'.repeat(64)}`)
for (const fx of FIXTURES) {
  let fails
  try { fails = check(fx.expect, await runProbe(fx.html)) }
  catch (e) { fails = [e.message] }
  if (fails.length) { failed++; console.log(`  ✗ ${fx.name}`); for (const f of fails) console.log(`      ${f}`) }
  else { passed++; console.log(`  ✓ ${fx.name}`) }
}
console.log(`  ${'-'.repeat(64)}\n  ${passed} passed · ${failed} failed\n`)
process.exit(failed ? 1 : 0)

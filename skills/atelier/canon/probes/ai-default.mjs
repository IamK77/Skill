#!/usr/bin/env node
// atelier:canon — AI-DEFAULT detector
// ----------------------------------------------------------------------------
// The color probe checks the FLOOR (is the system broken?). This checks the opposite
// failure: has the design converged on the statistical mean every AI generator lands on —
// the "standard AI taste" that is coherent yet indistinguishable from ten thousand others?
//
// It detects the encodable TELLS of that mean (slate dark canvas, the indigo/violet accent
// band, unchanged framework-default palette values, voiceless system/Inter type, the
// aurora-gradient backdrop, the centered hero). It does NOT judge "good" — taste cannot be
// automated. It flags where you may have DEFAULTED instead of DECIDED, and asks you to
// justify or diverge. Every tell is a question, not a verdict.
//
// Requires Node >= 22 + a Chromium browser (auto-detected; CHROME_BIN=… to override).
// Usage: node ai-default.mjs [--json] <url | file>
// ----------------------------------------------------------------------------
import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
const sleep = ms => new Promise(r => setTimeout(r, ms))
const jsonMode = process.argv.includes('--json')
let target = process.argv.slice(2).find(a => !a.startsWith('--'))
if (!target) { console.error('usage: node ai-default.mjs [--json] <url|file>'); process.exit(2) }
if (!/^https?:|^file:|^data:/.test(target)) target = 'file://' + (target.startsWith('/') ? target : process.cwd() + '/' + target)

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN
  for (const a of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']) if (existsSync(a)) return a
  for (const b of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) { try { const p = execSync(`command -v ${b}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) return p } catch {} }
  return null
}
const CHROME = findChrome(); if (!CHROME) { console.error('No Chromium-family browser found. Set CHROME_BIN.'); process.exit(2) }
const PORT = 9222 + Math.floor(Math.random() * 2000)

const srgbToLin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
function toOklch(r, g, b) {
  const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b)
  const l = .4122214708 * lr + .5363325363 * lg + .0514459929 * lb, m = .2119034982 * lr + .6806995451 * lg + .1073969566 * lb, s = .0883024619 * lr + .2817188376 * lg + .6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  const L = .2104542553 * l_ + .793617785 * m_ - .0040720468 * s_, a = 1.9779984951 * l_ - 2.428592205 * m_ + .4505937099 * s_, bb = .0259040371 * l_ + .7827717662 * m_ - .808675766 * s_
  let H = Math.atan2(bb, a) * 180 / Math.PI; if (H < 0) H += 360
  return { L, C: Math.hypot(a, bb), H }
}
const fmt = ({ L, C, H }) => `oklch(${L.toFixed(2)} ${C.toFixed(3)} ${C < .02 ? '—' : H.toFixed(0)})`

// known framework defaults (Tailwind / shadcn), the unchanged palette an AI build ships
// chromatic accent defaults only — matching a neutral gray to "zinc-900" is trivially true of
// any dark UI and is already covered by the slate-canvas tell; matching the ACCENT means you
// shipped Tailwind/shadcn's signature hue unchanged, which is the real tell.
const FRAMEWORK = [
  ['indigo-500', [99, 102, 241]], ['indigo-600', [79, 70, 229]], ['violet-500', [139, 92, 246]], ['violet-600', [124, 58, 237]],
  ['blue-500', [59, 130, 246]], ['blue-600', [37, 99, 235]], ['sky-500', [14, 165, 233]],
]
const GENERIC_FONTS = ['inter', 'system-ui', 'ui-sans-serif', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto', 'helvetica', 'helvetica neue', 'arial', 'sans-serif', 'sf pro text', 'sf pro display', '"sf pro text"', 'noto sans', 'liberation sans']

function extract() {
  const vw = innerWidth, vh = innerHeight, out = []; let h1 = null, maxFs = 0
  const cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const norm = s => { if (!s) return null; cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const bodyBg = norm(getComputedStyle(document.body).backgroundColor)
  let radialCount = 0, glass = false
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) continue
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const area = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
    const bg = norm(cs.backgroundColor), color = norm(cs.color)
    let bdr = null; if (cs.borderTopWidth !== '0px') { const b = norm(cs.borderTopColor); if (b && b[3] >= .5) bdr = b }
    out.push({ area, bg: (bg && bg[3] >= .5) ? bg : null, color: (color && color[3] >= .5) ? color : null, bdr })
    const bi = cs.backgroundImage || ''
    radialCount += (bi.match(/radial-gradient|conic-gradient/g) || []).length
    if (cs.backdropFilter && cs.backdropFilter.includes('blur') && area > 4000) glass = true
    const fs = parseFloat(cs.fontSize), hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    if (hasText && fs > maxFs) { maxFs = fs; h1 = { fs, family: cs.fontFamily, ta: cs.textAlign } }
  }
  // heading accent-word / gradient-clipped text
  const headingAccentColors = []; let gradientText = false
  for (const h of document.querySelectorAll('h1,h2,h3')) {
    const hcs = getComputedStyle(h); const base = norm(hcs.color)
    if (hcs.webkitBackgroundClip === 'text' || hcs.backgroundClip === 'text') gradientText = true
    for (const c of h.querySelectorAll('*')) {
      const ccs = getComputedStyle(c)
      if (ccs.webkitBackgroundClip === 'text' || ccs.backgroundClip === 'text') gradientText = true
      const cc = norm(ccs.color); const txt = [...c.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
      if (txt && cc && base && (Math.abs(cc[0] - base[0]) + Math.abs(cc[1] - base[1]) + Math.abs(cc[2] - base[2]) > 24)) headingAccentColors.push(cc)
    }
  }
  return JSON.stringify({ vw, vh, area: vw * vh, bodyBg, h1, radialCount, glass, headingAccentColors, gradientText, text: (document.body.innerText || '').slice(0, 6000), els: out })
}

async function getPageWs() { for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); const p = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl } catch {} await sleep(200) } throw new Error('Chrome DevTools never came up') }
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/atelier-aidefault-${Date.now()}`, '--no-first-run', '--no-default-browser-check', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,900', target], { stdio: 'ignore' })
let data
try {
  const ws = new WebSocket(await getPageWs()); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0; const pend = new Map(); ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) } }
  const cmd = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Page.enable'); await cmd('Runtime.enable')
  let prev = -1; for (let i = 0; i < 40; i++) { await sleep(300); const c = await cmd('Runtime.evaluate', { expression: `document.querySelectorAll('body *').length`, returnByValue: true }); const n = c.result?.result?.value ?? 0; if (n > 0 && n === prev) break; prev = n }
  await sleep(300)
  const r = await cmd('Runtime.evaluate', { expression: `(${extract.toString()})()`, returnByValue: true })
  data = JSON.parse(r.result.result.value); ws.close()
} finally { chrome.kill() }

// ---------- tells ----------
const tells = []
const tell = (id, msg) => tells.push({ id, msg })
const inBand = (h, lo, hi) => h >= lo && h <= hi

// distinct chromatic colors actually used (bg / text / border)
const chroma = []
for (const e of data.els) for (const c of [e.bg, e.color, e.bdr]) {
  if (!c) continue; const ok = toOklch(c[0], c[1], c[2]); if (ok.C > 0.1) chroma.push(ok)
}
// A · slate dark canvas
if (data.bodyBg) { const b = toOklch(data.bodyBg[0], data.bodyBg[1], data.bodyBg[2]); if (b.L < 0.22 && b.C < 0.045 && inBand(b.H, 225, 290)) tell('slate-canvas', `near-black cool "slate" canvas ${fmt(b)} — the default dark page every AI build opens on`) }
// B · indigo/violet/blue accent band
const banded = chroma.filter(o => inBand(o.H, 255, 303))
if (banded.length) { const a = banded.sort((x, y) => y.C - x.C)[0]; tell('accent-band', `accent in the indigo/violet/blue band ${fmt(a)} — the one hue every AI app reaches for; ${banded.length} chromatic value(s) sit there`) }
// C · unchanged framework-default palette
const hits = new Set()
for (const e of data.els) for (const c of [e.bg, e.color, e.bdr]) {
  if (!c) continue; for (const [name, rgb] of FRAMEWORK) if (Math.hypot(c[0] - rgb[0], c[1] - rgb[1], c[2] - rgb[2]) < 12) hits.add(name)
}
if (hits.size) tell('framework-default', `ships the framework default palette unchanged: ${[...hits].join(', ')} — Tailwind/shadcn out of the box`)
// D · voiceless type
if (data.h1) { const fams = data.h1.family.toLowerCase().split(',').map(s => s.trim()); if (fams.every(f => GENERIC_FONTS.includes(f))) tell('voiceless-type', `headline uses system/Inter type (“${data.h1.family.split(',')[0]}”) — no display face, no typographic voice`) }
// E · aurora / mesh gradient backdrop
if (data.radialCount >= 2) tell('aurora-gradient', `${data.radialCount} radial/conic gradient blobs — the soft "aurora" backdrop that flooded AI products in 2023–25`)
// F · glassmorphism
if (data.glass) tell('glassmorphism', `large blurred backdrop-filter surface — glassmorphism, a default "premium" trick`)
// G · centered hero
if (data.h1 && data.h1.ta === 'center') tell('centered-hero', `centered hero headline — the default landing composition (everyone's first move)`)
// H · accent-colored word / gradient text in a heading
if (data.gradientText) tell('heading-accent-word', `gradient-clipped display text (background-clip:text) — the "magic gradient word" hero trope`)
else { const w = (data.headingAccentColors || []).map(c => toOklch(c[0], c[1], c[2])).filter(o => o.C > 0.1).sort((a, b) => b.C - a.C)[0]; if (w) tell('heading-accent-word', `a heading word is colored in the accent ${fmt(w)} amid neutral text — the SaaS/AI "color one word of the headline" move; refined work keeps headlines monochrome and lets weight/size/space carry emphasis`) }

// ---- content / copy tells (pixels aren't the loudest AI signal — the WORDS are) ----
const text = data.text || '', low = text.toLowerCase()
// I · hype / self-aggrandizing LLM-landing voice
const HYPE = ['not a chatbot', 'not just a', 'not your average', 'powered by ai', 'ai-powered', 'supercharge', '10x', 'the future of', 'seamlessly', 'effortlessly', 'unleash', 'revolutioniz', 'game-chang', 'cutting-edge', 'next-generation', 'next generation', 'harness the power', 'elevate your', 'to the next level', 'narrat']
const hypeHits = HYPE.filter(p => low.includes(p))
if (hypeHits.length) tell('hype-copy', `self-aggrandizing / LLM-landing phrasing: ${hypeHits.slice(0, 4).map(s => `“${s.trim()}”`).join(', ')} — the voice AI reaches for; a real human voice is more specific and less hyped`)
// J · templated agent-demo telemetry + status
const meta = text.match(/(·\s*\d+(\.\d+)?\s*s\b)|(\b\d+\s*sources?\b)|(\b\d+\s*src\b)|(\$\d+\.\d{2}\b)/i)
if (meta && /\b(complete|completed|running|done|finished|in progress)\b/i.test(text)) tell('agent-demo-template', `templated agent-run telemetry ("${meta[0].trim()}") + a status pill + step ladder — the stock way every AI agent demo presents itself`)
// K · the AI-favorite "developer-darling" example set
const LOGOS = ['stripe', 'notion', 'linear', 'vercel', 'figma', 'airbnb', 'spotify', 'slack', 'shopify', 'openai', 'anthropic', 'github', 'netflix', 'uber', 'supabase', 'ramp', 'mercury']
const logoHits = LOGOS.filter(n => new RegExp(`\\b${n}\\b`, 'i').test(text))
if (logoHits.length >= 3) tell('stock-logo-set', `name-drops the AI-favorite example set (${logoHits.slice(0, 5).join(', ')}) — the developer-darling companies every AI build reaches for`)

// ---------- report ----------
if (jsonMode) {
  console.log(JSON.stringify({ target, score: tells.length, tells }))
} else {
  console.log(`\n  atelier:canon · AI-default detector  ·  ${target.replace('file://', '')}`)
  console.log(`  ${'-'.repeat(74)}`)
  if (!tells.length) console.log('  ✓ none of the known AI-default tells fired — this reads decided, not defaulted')
  for (const t of tells) console.log(`  • [${t.id}] ${t.msg}`)
  console.log(`  ${'-'.repeat(74)}`)
  const n = tells.length
  const verdict = n === 0 ? 'clear' : n <= 2 ? 'leans default in places' : n <= 4 ? 'substantially the AI mean' : 'textbook AI-default'
  console.log(`  ${n} default tell(s) — ${verdict}`)
  console.log(`  Not a verdict on quality. Each tell is a place you may have DEFAULTED, not DECIDED.`)
  console.log(`  For each: name it, then justify keeping it or diverge.`)
  console.log(`  And the hard limit: even 0 tells means only "no KNOWN default signature fired" — it does`)
  console.log(`  NOT certify a point of view. Voice, situated/idiosyncratic choices, soul: not detectable.\n`)
}

#!/usr/bin/env node
// atelier:color — coherence PROBE
// ----------------------------------------------------------------------------
// Drives headless Chrome over the DevTools Protocol (no npm dependencies),
// reads every visible element's computed background / text / border color and its
// rendered AREA, converts to OKLCH, and flags the encodable color-incoherence the
// `color` lens forbids: pure black / pure white, color-TEMPERATURE breaks, large
// off-system surfaces, near-duplicate hand-picked accents, and low text contrast.
//
// The probe flags the off-system FACT. Whether a flagged surface is intended — and,
// if so, should be re-tuned INTO the system as a token — stays a human GATE. The
// instrument gives the agent the nervous system it lacks for the encodable layer;
// it does not make the taste call.
//
// Requires: Node >= 22 (built-in WebSocket/fetch) and a Chromium-family browser.
//   Browser is auto-detected; override with  CHROME_BIN=/path/to/chrome
// Usage:    node color-coherence.mjs <url | file-path>
//   e.g.    node color-coherence.mjs http://localhost:5173/
//           node color-coherence.mjs ./index.html
// ----------------------------------------------------------------------------
import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'

const sleep = ms => new Promise(r => setTimeout(r, ms))

let target = process.argv[2]
if (!target) { console.error('usage: node color-coherence.mjs <url|file>'); process.exit(2) }
if (!/^https?:|^file:/.test(target)) target = 'file://' + (target.startsWith('/') ? target : process.cwd() + '/' + target)

function findChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN
  const apps = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]
  for (const a of apps) if (existsSync(a)) return a
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { const p = execSync(`command -v ${bin}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p) return p } catch {}
  }
  return null
}
const CHROME = findChrome()
if (!CHROME) { console.error('No Chromium-family browser found. Set CHROME_BIN=/path/to/chrome'); process.exit(2) }
const PORT = 9222 + Math.floor(Math.random() * 2000)

// ---------- color math: sRGB -> OKLCH ----------
const srgbToLin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
function toOklch(r, g, b) {
  const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s)
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const C = Math.hypot(a, bb)
  let H = Math.atan2(bb, a) * 180 / Math.PI; if (H < 0) H += 360
  return { L, C, H }
}
const relLum = (r, g, b) => 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b)
const wcag = (c1, c2) => { const a = relLum(...c1), b = relLum(...c2), hi = Math.max(a, b), lo = Math.min(a, b); return (hi + 0.05) / (lo + 0.05) }
const parseRGB = s => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] } }
const fmt = ({ L, C, H }) => `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${C < 0.004 ? '—' : H.toFixed(0)})`
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }

// ---------- browser-side extractor (runs via Runtime.evaluate) ----------
function extract() {
  const vw = innerWidth, vh = innerHeight, out = []
  const opaque = c => { const m = (c || '').match(/[\d.]+/g); return m ? (m[3] === undefined ? 1 : +m[3]) >= 0.5 : false }
  const effBg = el => { let n = el; while (n) { const c = getComputedStyle(n).backgroundColor; if (opaque(c)) return c; n = n.parentElement } return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)' }
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue
    const area = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
    if (area <= 0) continue
    let cls = ''
    if (el.className && typeof el.className === 'string') cls = '.' + el.className.trim().split(/\s+/).join('.')
    const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    out.push({ sel, area, bg: cs.backgroundColor, effBg: effBg(el), color: cs.color, hasText, fontSize: parseFloat(cs.fontSize), bold: (parseInt(cs.fontWeight) || 400) >= 600 })
  }
  return JSON.stringify({ vw, vh, area: vw * vh, els: out })
}

// ---------- launch + CDP ----------
async function getPageWs() {
  for (let i = 0; i < 60; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      const p = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl } catch {}
    await sleep(200)
  }
  throw new Error('Chrome DevTools endpoint never came up')
}
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/atelier-color-probe-${Date.now()}`, '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--hide-scrollbars', '--window-size=1280,900', target], { stdio: 'ignore' })

let data
try {
  const ws = new WebSocket(await getPageWs())
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0; const pend = new Map()
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) } }
  const cmd = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Page.enable'); await cmd('Runtime.enable')
  let prev = -1                       // wait for real render (CDN/SPA apps mount late)
  for (let i = 0; i < 40; i++) {
    await sleep(300)
    const c = await cmd('Runtime.evaluate', { expression: `document.querySelectorAll('body *').length`, returnByValue: true })
    const n = c.result?.result?.value ?? 0
    if (n > 15 && n === prev) break
    prev = n
  }
  await sleep(300)
  const r = await cmd('Runtime.evaluate', { expression: `(${extract.toString()})()`, returnByValue: true })
  data = JSON.parse(r.result.result.value)
  ws.close()
} finally { chrome.kill() }

// ---------- rule engine ----------
const findings = []
const flag = (sev, rule, msg, area = 0) => findings.push({ sev, rule, msg, area })
const pct = a => (100 * a / data.area).toFixed(1) + '%'

const bgByColor = new Map()
for (const e of data.els) {
  const c = parseRGB(e.bg); if (!c || c.a < 0.5) continue
  const ok = toOklch(c.r, c.g, c.b), key = `${c.r},${c.g},${c.b}`
  const cur = bgByColor.get(key) || { rgb: [c.r, c.g, c.b], ok, area: 0 }; cur.area += e.area; bgByColor.set(key, cur)
}
const neutralsLight = [...bgByColor.values()].filter(s => s.ok.C < 0.04 && s.ok.L > 0.82).sort((a, b) => b.area - a.area)
const pageTemp = neutralsLight[0] || null
const tinted = pageTemp && pageTemp.ok.C >= 0.006

// R1 pure black / R2 pure white
for (const s of bgByColor.values()) {
  if (s.ok.L <= 0.06 && s.ok.C < 0.03) flag('blocker', 'pure-black', `pure-black surface ${fmt(s.ok)} on ${pct(s.area)} of the viewport — the lens forbids #000; a near-black should be L≈0.16–0.22 carrying the neutral temperature`, s.area)
  if (s.ok.L >= 0.995 && s.ok.C < 0.005) flag('major', 'pure-white', `pure-white surface ${fmt(s.ok)} on ${pct(s.area)} — page bg should be a tinted off-white (L≈0.98), not #fff`, s.area)
}
// R3 temperature break
if (tinted) for (const s of bgByColor.values()) {
  if (s.area / data.area < 0.04 || s.ok.L <= 0.06) continue
  const untinted = s.ok.C < 0.004
  const offHue = s.ok.C >= 0.01 && hueGap(s.ok.H, pageTemp.ok.H) > 40
  if (untinted || offHue)
    flag('major', 'temperature-break', `surface ${fmt(s.ok)} on ${pct(s.area)} ${untinted ? 'is untinted (chroma≈0)' : `sits at hue ${s.ok.H.toFixed(0)}`} while the page neutral is warm at hue ${pageTemp.ok.H.toFixed(0)} — one temperature must hold across the ramp`, s.area)
}
// R4 near-duplicate accents (palette sprawl)
const accents = [...bgByColor.values()].filter(s => s.ok.C > 0.05)
for (let i = 0; i < accents.length; i++) for (let j = i + 1; j < accents.length; j++) {
  const a = accents[i].ok, b = accents[j].ok
  if (hueGap(a.H, b.H) < 8 && Math.abs(a.L - b.L) < 0.06 && Math.abs(a.C - b.C) < 0.04)
    flag('minor', 'palette-sprawl', `two near-duplicate accents ${fmt(a)} and ${fmt(b)} — hand-picked, not one token (derive states by formula from a single base)`)
}
// R5 text contrast vs the actual (ancestor-resolved) background
for (const e of data.els) {
  if (!e.hasText) continue
  const tc = parseRGB(e.color), bgc = parseRGB(e.effBg); if (!tc || tc.a < 0.5 || !bgc) continue
  const bg = [bgc.r, bgc.g, bgc.b], ratio = wcag([tc.r, tc.g, tc.b], bg)
  const large = e.fontSize >= 24 || (e.fontSize >= 18.66 && e.bold), floor = large ? 3 : 4.5
  if (ratio < floor) flag(ratio < floor - 1 ? 'major' : 'minor', 'contrast', `text on "${e.sel}" is ${ratio.toFixed(2)}:1 (WCAG floor ${floor}:1 for this size) — ${toOklch(tc.r, tc.g, tc.b).L.toFixed(2)}L text on ${toOklch(...bg).L.toFixed(2)}L bg`)
}

// ---------- report ----------
const order = { blocker: 0, major: 1, minor: 2 }, icon = { blocker: '🔴', major: '🟠', minor: '🟡' }
findings.sort((a, b) => (order[a.sev] - order[b.sev]) || (b.area - a.area))
console.log(`\n  atelier:color coherence probe  ·  ${target.replace('file://', '')}`)
console.log(`  viewport ${data.vw}×${data.vh}  ·  ${data.els.length} visible elements  ·  page temperature: ${pageTemp ? (tinted ? 'WARM' : 'cool/neutral') + ' ' + fmt(pageTemp.ok) : 'unknown'}`)
console.log(`  ${'-'.repeat(72)}`)
if (!findings.length) console.log('  ✓ no encodable color-incoherence detected')
for (const f of findings) console.log(`  ${icon[f.sev]} [${f.rule}] ${f.msg}`)
const n = s => findings.filter(f => f.sev === s).length
console.log(`  ${'-'.repeat(72)}`)
console.log(`  ${n('blocker')} blocker · ${n('major')} major · ${n('minor')} minor`)
console.log(`  (the probe flags the off-system FACT; whether a flagged surface is intended — and should`)
console.log(`   be re-tuned into the system as a token — stays a human GATE.)\n`)

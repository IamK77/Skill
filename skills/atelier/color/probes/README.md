# color probes — instruments, not judges

The `color` lens says the benchmark is a human nervous system, so taste cannot be
outsourced — but a large part of *incoherence* is encodable, and the agent has no nervous
system to flinch at it. A **probe** is the prosthetic for that encodable layer: it reads a
real rendered surface and reports the off-system facts the lens forbids, so the GATE stops
being "please verify" and becomes "run the probe, then judge the flags."

**A probe flags the fact. The human judges intent.** A large near-black panel on a warm
page might be a mistake — or a deliberate inversion that should be re-tuned into the system
as a warm dark-elevation token. The probe surfaces the fact and makes the choice *explicit*;
it never decides for you.

## `color-coherence.mjs`

Drives headless Chrome over the DevTools Protocol (no npm dependencies) to read every
visible element's computed color + rendered area, converts to OKLCH, and flags:

| Rule | Catches |
|---|---|
| `pure-black` | `#000`-class surfaces (the lens wants a tinted near-black L≈0.16–0.22) |
| `pure-white` | `#fff`-class page surfaces (wants a tinted off-white L≈0.98) |
| `temperature-break` | a large neutral surface that is untinted or off-hue while the page neutral has a temperature |
| `palette-sprawl` | near-duplicate accents (hand-picked instead of derived from one base by formula) |
| `contrast` | text below the WCAG floor against its true (ancestor-resolved) background |

Each flagged surface is reported with its OKLCH value and the **share of the viewport** it
covers, so a big offending region reads louder than a stray pixel.

### Run

```bash
# requires Node >= 22 (built-in WebSocket/fetch) and a Chromium-family browser
node "${CLAUDE_SKILL_DIR}/probes/color-coherence.mjs" http://localhost:5173/
node "${CLAUDE_SKILL_DIR}/probes/color-coherence.mjs" ./index.html
```

The browser is auto-detected (Chrome / Chromium / Edge); override with
`CHROME_BIN=/path/to/chrome`. Output is a human-readable report; the findings are advisory
input to the GATE, not a pass/fail.

### Honest limits

- **Contrast** is subtle (background resolution, overlap, gradients). This probe does the
  ancestor-resolved common case; for a rigorous a11y audit defer to `axe-core` / Lighthouse.
  The probe's *unique* value is the **system-level** checks (temperature, pure-black/white,
  sprawl) that standard tools do not have.
- It reads the **rendered DOM**, so colors inside `<canvas>`, WebGL, or flattened images are
  invisible to it (that surface belongs to `atelier:graphics`).
- It samples one viewport at one size; run it at the breakpoints that matter.

### Trust

The probe is only as good as its calibration, so it ships with a ground-truth regression
suite — `node probes/test.mjs` asserts every rule fires on a known violation and stays quiet
on a known-good design, including a color-syntax matrix (hex/rgb/hsl/oklch/lab/color()) that
guards against the parser silently skipping a syntax. See **[TESTING.md](TESTING.md)**; CI
runs it on every probe change.

This is the first of an intended per-lens probe family (type / form / motion / systems each
have equally probeable anti-patterns). Each lens's `## Anti-patterns` section is the spec,
and each probe carries its own `test.mjs` regression net.

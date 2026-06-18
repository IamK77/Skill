# Testing the color probe

A probe is a detector, and a detector you can't trust is worse than none — it manufactures
false confidence. So the probe ships with a ground-truth regression suite. The discipline:
**every rule must fire on a known violation AND stay silent on a known-good design**, and
that contract is asserted, not eyeballed.

Run it:

```bash
node "${CLAUDE_SKILL_DIR}/probes/test.mjs"     # exits non-zero on any mismatch
```

It needs Node ≥ 22 and a Chromium-family browser (auto-detected; `CHROME_BIN=…` to override).
Fixtures are driven via `data:` URLs — no temp files, no network.

## The three layers

**Layer 1 — per-rule ground truth + the syntax matrix.** Each rule (`pure-black`,
`pure-white`, `temperature-break`, `palette-sprawl`, `contrast`) has a *positive* fixture
(the violation present → must flag), the *negatives* it must stay quiet on, and *boundary*
fixtures (a legit near-black L≈0.18 must NOT trip `pure-black`; an off-white L≈0.98 must NOT
trip `pure-white`). Plus a **color-syntax matrix**: the same warm-page-with-a-pure-white-panel
expressed in hex / rgb / hsl / **oklch / lab / color()** — each must be *read* (temperature
detected) and flag the panel. This matrix is the standing regression for the bug where an
`rgb()`-only parser silently skipped every `oklch()` surface and reported a false "clean".

**Layer 2 — whole-design calibration.** A coherent editorial design must come back quiet;
an AI-default design (pure-black panels, near-duplicate neon accents) must come back loud.
This is where the rule thresholds (the L/chroma/hue/area cutoffs) are tuned against real
shapes rather than single properties — a negative here means a threshold drifted.

**Layer 3 — real rendered pages (manual, no ground truth).** Real pages change and have no
declared expectation, so they're for crash/sanity only: run `node color-coherence.mjs <url>`
and read the report. **Limitation:** a CDN-dependent, in-browser-Babel SPA (e.g. a no-build
React page with blocking `<script src=unpkg…>` in `<head>`) is a poor headless target — if
the CDN stalls, `<body>` never parses and the probe sees nothing. Probe the deployed/static
output, or a page whose styles don't depend on flaky third-party scripts.

## CI

`.github/workflows/probe.yml` runs every `*/probes/test.mjs` on any change under
`skills/atelier/**/probes/**` (headless Chrome via `browser-actions/setup-chrome`). Adding a
probe to another lens automatically gets covered — drop a `test.mjs` next to it.

## Adding a fixture

Append to `FIXTURES` in `test.mjs`: a `name`, the `html`, and an `expect` of
`{ mustFlag?, mustNotFlag?, clean?, tempKnown? }`. Keep fixtures minimal — one concern each.

# canon probes — instruments, not judges

`canon` says the leverage lives in the calls the agent cannot make — the taste decisions
that need a point of view and a nervous system. A **probe** is the prosthetic for the one
sliver of that judgment which is encodable: not "is this good" (unanswerable by a tool) but
"did this converge on the statistical mean every AI generator lands on?"

**A probe flags the fact. The human judges intent.** Every tell it raises is a question —
*did you choose this, or default into it?* — never a verdict.

## `ai-default.mjs`

Where the color probe checks a FLOOR (is the system broken?), this checks the opposite
failure: has the design become **anonymous** — coherent yet indistinguishable from ten
thousand others? It drives headless Chrome over the DevTools Protocol (no npm dependencies),
reads every visible element's computed style + rendered area and the page's text, converts
color to OKLCH, and flags the encodable tells of the AI-default mean:

| Tell | Catches |
|---|---|
| `slate-canvas` | the near-black cool "slate" page ground every AI build opens on |
| `accent-band` | an accent in the indigo/violet/blue band — the one hue AI reaches for |
| `framework-default` | a Tailwind/shadcn palette value (indigo-500…) shipped unchanged |
| `voiceless-type` | a headline set in system-ui/Inter — no display face, no voice |
| `aurora-gradient` | the soft radial/conic "aurora" backdrop |
| `glassmorphism` | a large blurred `backdrop-filter` "premium" surface |
| `centered-hero` | the default centered hero composition |
| `heading-accent-word` | the "magic gradient/accent word" headline trope |
| `hype-copy` | LLM-landing phrasing ("supercharge", "the future of", "seamlessly") |
| `agent-demo-template` | templated agent telemetry ("· 1.2s", "5 sources") + status pill |
| `stock-logo-set` | the developer-darling logo wall (Stripe, Notion, Linear, Vercel…) |

The doctrine behind each tell — and why none is wrong *in principle* — is in
**[../references/ai-default-attractors.md](../references/ai-default-attractors.md)**.

### Run

```bash
# requires Node >= 22 (built-in WebSocket/fetch) and a Chromium-family browser
node "${CLAUDE_SKILL_DIR}/probes/ai-default.mjs" http://localhost:5173/
node "${CLAUDE_SKILL_DIR}/probes/ai-default.mjs" ./index.html
node "${CLAUDE_SKILL_DIR}/probes/ai-default.mjs" --json ./index.html   # machine-readable
```

The browser is auto-detected (Chrome / Chromium / Edge); override with
`CHROME_BIN=/path/to/chrome`. Output is a human-readable report (or `--json`); the tells are
provocations for the GATE, not a pass/fail.

### The hard limit (read this)

**0 tells does not mean the design is good.** It means only that no *known* default
signature fired. Voice, situated/idiosyncratic choices, a point of view — none of it is
detectable, and a tasteful-but-anonymous design scores 0 just as a bold one might score 1.
The detector measures the FLOOR of distinctiveness (did you clear the obvious mean?), never
the CEILING (is it any good?). And beware the hop: escaping the slate/indigo tells by
landing on a warm-cream editorial serif clears every tell here and can still be a move
between attractors — the POV gate, not this probe, is what catches that. The ceiling stays
a human gate.

### Trust

The probe ships a ground-truth regression suite — `node probes/test.mjs` asserts the
textbook-AI-default fixture fires every tell, a design-with-a-point-of-view fixture stays
silent, and a copy-only fixture fires the word tells with no visual false-positives. CI runs
it on every probe change.

This is canon's member of the per-lens probe family (color ships `color-coherence.mjs`;
type / form / motion / systems each have probeable anti-patterns). Each lens's spec is its
`## Anti-patterns` (and here, the attractors reference); each probe carries its own
`test.mjs` regression net.

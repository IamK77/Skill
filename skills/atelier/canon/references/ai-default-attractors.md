# AI-Default Attractors — the signature of the mean, named so it can be refused

> The companion to canon's first gate. `non-default-and-quantified.md` names the three
> *visual* attractors an undirected agent falls into; this doc names the full **AI-default
> signature** — the encodable tells, across pixels AND words, that mark a design as having
> converged on the statistical mean every generator lands on: coherent, competent, and
> indistinguishable from ten thousand others. The detector `probes/ai-default.mjs` reads
> these tells off a rendered surface. **Each tell is a question, not a verdict** — a place
> you may have *defaulted* instead of *decided*.

---

## why "coherent" is not the bar

The color probe checks a FLOOR: is the system broken (pure black, a contrast failure, palette sprawl)? A design can pass that floor completely and still be worthless — because the deeper agent failure is not incoherence, it is **convergence to the mean**. The model has seen a million landing pages and emits their average: a slate canvas, an indigo accent, Inter, an aurora glow, a centered hero, the same hype sentence, the same logo wall. Nothing is *wrong*. Everything is *anonymous*. The work has no point of view, and "千篇一律" (cut from one mould) is the precise complaint.

This is why coherence ≠ quality, and why a probe can only ever measure the floor. The tells below are **encodable proxies for anonymity** — the known shapes the mean takes. They catch the obvious defaults so attention is freed for the thing no tool can see: whether the design argues anything at all.

---

## the eleven tells

The detector reports each as a provocation. Visual tells read computed style + rendered area; copy/content tells read `innerText`. None is wrong *in principle* — each is wrong as an unconsidered default.

**Visual (the pixels):**

1. **`slate-canvas`** — a near-black cool "slate" page ground (L < 0.22, low chroma, hue 225–290). The dark page every AI build opens on. Decide the canvas; if dark, give it a temperature and a reason.
2. **`accent-band`** — the accent sits in the indigo/violet/blue band (hue 255–303). The one hue every AI app reaches for. An accent should come from the brand/POV, not the band of least resistance.
3. **`framework-default`** — a chromatic palette value shipped unchanged from Tailwind/shadcn (indigo-500, violet-600, blue-500…). The out-of-the-box palette is a starting point, never the decision.
4. **`voiceless-type`** — the headline is set in system-ui/Inter with no display face. The most-read element on the page has no typographic voice.
5. **`aurora-gradient`** — two or more radial/conic gradient blobs: the soft "aurora" backdrop that flooded AI products in 2023–25.
6. **`glassmorphism`** — a large blurred `backdrop-filter` surface: the default "premium" trick, reached for because it pattern-matches to polish.
7. **`centered-hero`** — a centered hero headline: the default landing composition, everyone's first move.
8. **`heading-accent-word`** — one word of the headline colored in the accent, or a `background-clip:text` gradient word. The SaaS/AI "magic gradient word" trope; refined work keeps headlines monochrome and lets weight/size/space carry emphasis.

**Copy & content (the words — often the loudest AI signal):**

9. **`hype-copy`** — self-aggrandizing LLM-landing phrasing ("supercharge", "the future of", "seamlessly", "AI-powered", "to the next level"). A real human voice is more specific and less hyped.
10. **`agent-demo-template`** — templated agent-run telemetry ("· 1.2s", "5 sources", a `$0.00` cost) plus a status pill and a step ladder: the stock way every AI agent demo presents itself.
11. **`stock-logo-set`** — name-drops the AI-favorite example set (Stripe, Notion, Linear, Vercel, Figma…): the developer-darling companies every AI build reaches for.

---

## how to use a fired tell

For each tell the detector raises: **name it, then justify keeping it or diverge.** "My surface is genuinely a dark developer tool, so the dark canvas is decided" is a valid answer — the tell asked the question and you answered from the POV. "I'll change it because I never chose it" is the other valid answer. What is *not* valid is leaving it because the detector is "only a suggestion" — the whole point is that the agent feels no wrongness, so the tell is the prosthetic flinch.

And mind the trap canon's first gate names: **escaping one tell by landing on another is not a decision.** Fleeing `slate-canvas` + `accent-band` straight into a warm-cream editorial serif (which fires *zero* of these tells) can still be a hop between attractors. A 0 here means the design cleared the *known* defaults — it does not mean the design has a point of view.

---

## the hard limit (why this can never be a quality gate)

The detector's own closing line states it: **even 0 tells means only "no known default signature fired." It does not certify a point of view.** Voice, situated and idiosyncratic choices, the spark that makes one design *this* one and not the average — none of it is detectable. A tasteful, anonymous design scores 0. A bold, alive design with a centered hero scores 1.

So the tells measure the FLOOR of distinctiveness (did you clear the obvious mean?), never the CEILING (is it any good?). The ceiling is the POV gate, and the POV gate is a human one. This instrument exists to make sure you are not *accidentally* average — it can never make you good. That stays yours.

> Calibration: `probes/test.mjs` asserts the textbook-mean fixture fires every tell and a
> design-with-a-POV fixture stays silent, including a copy-only fixture that proves the
> word tells fire independently of the pixels. CI runs it on every probe change.

# Non-Default & Quantified — the technique for deciding and measuring

> The technique behind canon's first two gates. The governing claim: premium design is not
> a set of values nudged until they look right — it is a set of NON-DEFAULT choices, each
> expressible as a rule or a number. Taste picks the choices; the numbers make them
> enforceable. The agent's statistical defaults are named here so they can be rejected on
> purpose, not by accident.

---

## the three AI default attractors (name and reject or adopt each)

An agent without a design brief converges to three statistical attractors — not because they are good design, but because they are the modal output of its training data:

1. **Warm-cream editorial** — off-white ground (~`#faf9f7`), high-contrast serif display, ochre or terracotta accent, generous spacing. Reads as "premium editorial brand." Not wrong in principle; wrong as a default, because it was never decided.
2. **Near-black neon tool** — near-black ground (~`#0f0f0f` or `#111827`), single saturated accent (electric blue, teal, or purple), zero or near-zero border-radius, dense grid. Reads as "SaaS dashboard / developer tool." Not wrong; wrong as a default.
3. **Newspaper hairline** — pure-white ground, hairline borders, dense multi-column layout, pure neutral palette, zero radius. Reads as "serious information design." Not wrong; wrong as a default.

The design brief names each and either adopts it on purpose (with a reason) or rejects it. Neither counts as a decision until it has been made consciously.

---

## the anchor: derive the point of view first

Before any of the dimensions below, before the visual language is even named, there is one upstream move that everything else derives from: **state the surface's point of view.** This is the difference between a design that has a spine and a design that is a competent average.

**The technique is directional — POV → style, never style → POV.** The agent's failure mode is to reach for a style first (the thing that "looks premium" in its training) and then rationalize it. That reversal is precisely how it lands in one of the three attractors above. The correct order:

1. **Derive the POV from the product's facts, not from aesthetics.** Ask three questions of the product itself: *What does it deliver?* (the artifact the user walks away with) · *What does it cost the user?* (the work it removes or the work it demands) · *What does it believe?* (the one claim it is implicitly arguing). The point of view is the one-sentence synthesis. It is **derivable** — you do not wait for the user to hand it to you; you read it off the product. (You still confirm it with the user; you do not originate it from a blank.)
2. **Say it without naming a style.** A real POV survives being stated with zero aesthetic words. *"A good cold email is read into existence, not generated — the deliverable is the user's voice, and the cost was the reading no one wants to do"* is a point of view: it names a belief and a cost, and it constrains choices (the output is prose → type is the hero; the value is *reading* → show the reading). *"Clean, modern, trustworthy"* is a **mood** — it names no argument and rules nothing out. If you cannot state your POV without reaching for a style or a feeling, you have not found it yet.
3. **Derive the language from the POV, then check it didn't just hop attractors.** The visual language is the answer to *"what must this look like, given that POV?"* — and only then is it checked against the three attractors. **Deciding ≠ avoiding:** escaping near-black-neon by landing on warm-cream-serif is not a decision; it is trading one gravity well for another. When the derived language *coincides* with an attractor (it often legitimately will — an editorial product genuinely wants editorial language), the coincidence is fine **only if it falls out of the POV**, not if it was reached for. The gate question is "does the POV demand this?", not "did I pick something other than the last default I used?"

**Two worked examples:**

- **Apple, a gift-occasion page.** POV: *"the product disappears; the human moment (giving) is the subject."* Everything derives: near-empty white ground (the moment needs room, not features), one playful illustrated gesture carrying 100% of the personality (the Chanel-law signature element), product imagery absent (it would make the page about the object, contradicting the POV). The whitespace is not a style choice — it is the POV made visible.
- **An outreach-research tool.** POV: the cold-email sentence above. Derivation: the deliverable is prose in the user's voice → an **editorial** language with type as the hero (not a dashboard); the value is that it *read* everything → the agent's sources rendered as **footnotes on the letter**, so the apparatus of reading becomes the proof of work; the signature element is that annotation system, not a color. This lands on the warm-cream-editorial attractor — and that is defensible *because the POV demands editorial*, not because editorial "looks nice." Had the POV not demanded it, the same palette would be a hop, not a decision.

The POV is the most leverage-dense decision in the whole build and the one most purely a matter of taste — which is why it is the first gate, and why no number can stand in for it. The dimensions below are how the language, once derived, is made measurable.

---

## color: from default to decided and measured

**Default:** the agent picks hex/HSL values by eye, generates pure gray neutrals (`#888`, `#ccc`), and uses saturated brand colors that pass no contrast check. Dark mode = `filter: invert()` or a B/W swap.

**Non-default choices, each quantifiable:**

- **Build in oklch, not hex/HSL.** HSL's `L` is perceptual fiction — yellow at `hsl(60 100% 50%)` reads far brighter than blue at the same L. oklch gives true perceptual lightness; building a ramp in oklch means every step is equally bright across hues. Decision tree: *generating a palette or ramp → oklch*; *a single known brand hex → hex is fine*; *a gradient without a gray dead-zone → interpolate in oklab*.

- **Tint the neutral ramp (critical non-default).** Pure gray (`C = 0`) reads lifeless and default. Tinting toward the brand hue at **C ≈ 0.005–0.03** unifies every surface under one temperature without reading "colored." Warm temperature: H ≈ 60–80 (editorial, human). Cool: H ≈ 250 (tech, precise). **Quantified gate: C > 0 on every neutral step.**

- **Text-black and background-white are not pure.** Text "black": L ≈ 0.18–0.25 (not 0); pure black reads as a hole and creates harsh glare. Background "white": L ≈ 0.97–0.99 with a faint brand tint (not `#fff`). **Quantified gate: text L ≈ 0.2, bg L ≈ 0.97–0.99.**

- **Contrast is a hierarchy, not a single number.** Map text roles to contrast floors:

  | role | WCAG 2 (legal floor) | APCA Lc (perceptual target) |
  |---|---|---|
  | primary body text | ≥4.5:1 | ≥75 |
  | secondary/supporting text | ≥4.5:1 | ≥75 |
  | tertiary / weak text | ≥4.5:1 | ≥60 |
  | large text / headings | ≥3:1 | ≥60 |
  | UI components, borders | ≥3:1 (1.4.11) | ≥45 |
  | disabled / placeholder | exempt (not invisible) | — |

  The secondary-text trap: a designer dials secondary text to pale gray "for elegance." It fails both floors. This is the most common agent-generated craft failure. **Quantified gate: every text/background pair has a named ratio before any component is built.**

- **Semantic colors at consistent L and C.** Success / warning / error / info feel like a family when they share the same perceptual lightness and chroma, differing only in hue. The agent picks four unrelated saturated colors; the non-default is oklch at matched L ≈ 0.62, C ≈ 0.16–0.19, varying only H.

- **Dark mode is a re-tuned ramp, not invert().** Dark bg: L ≈ 0.12–0.18 deep gray (not pure black — halation). Elevation by *lighter surface* (each layer higher L), not by deeper shadow. Accent: raise L to ≈0.70–0.75, drop C ≈20–30% (saturated mid-L vibrates on dark). The alias token mapping changes; the raw ramp stays. **Quantified gate: dark bg L ≈ 0.12–0.18; no `invert()` or B/W swap anywhere in the codebase.**

- **60-30-10 proportion.** Dominant neutral: ~60% of visual area. Secondary (surfaces, containers): ~30%. Accent: ~10%. An accent color covering more than ~10% is no longer an accent; it is a mid-tone. **Quantified gate: accent area % < 10.**

---

## type: from default to decided and measured

**Default:** the agent picks font sizes by eye (nudging until it "looks right"), uses no modular ratio, applies the same tracking to all sizes, and ignores tabular numerics, `text-wrap`, and webfont CLS.

**Non-default choices:**

- **A modular ratio, as a single number.** Every size in the type scale derives from one ratio: ≈1.2 (minor third — compact/dense UI); 1.25 (major third — versatile); 1.333 (perfect fourth — editorial); 1.5+ (expressive/marketing). The ratio is not aspirational — it constrains every size decision after this point. **Quantified gate: one ratio, written as a number.**

- **Fluid sizing with `clamp()`.** `clamp(min, preferred, max)` lets the scale breathe between viewport extremes without a waterfall of media queries. `min` = the smallest a step ever gets (accessibility floor); `preferred` = the viewport-unit expression; `max` = the cap. The `type` lens instantiates this; `canon` sets the ratio.

- **Tracking varies with size.** Large display type: −0.02 to −0.04em (tightens to hold letterforms together at large scale). Body: 0. All-caps / eyebrow / small labels: +0.05 to +0.10em (opens for legibility). The default is 0 everywhere; the non-default is a three-level system. **Quantified gate: display tracking ≤ −0.02em.**

- **Line-height varies inversely with size.** Display/giant: 1.0–1.1. Heading: 1.1–1.25. Body: 1.5–1.65. Small/caption: ≥1.6 (small text needs more air). The agent applies a flat line-height; the non-default is a per-role system. **Quantified gate: body line-height ≥1.5, display ≤1.25.**

- **Measure (line length) is gated.** Running/body text: 45–75 characters (~66ch ideal); give text blocks `max-width: 65ch`. A line over 75ch becomes hard to track back to the start. **Quantified gate: max-width ≈ 65ch on running text.**

- **Tabular numerics where data aligns.** `font-variant-numeric: tabular-nums` on price columns, metric displays, tables, timers. The agent almost never adds this; the result is ragged decimal alignment. **Quantified gate: any numeric column uses tabular-nums.**

- **`text-wrap: balance` on headings / `text-wrap: pretty` on body.** Balance prevents the orphaned short last line on multi-line headings (the ragged-bottom heading that looks accidental). Pretty prevents a lone orphan word at the end of a body paragraph. The agent does not add either without prompting. **Quantified gate: headings use `text-wrap: balance`; body paragraphs use `text-wrap: pretty`.**

- **Webfont fallback — no CLS.** A metrics-compatible fallback stack (`size-adjust`, `ascent-override`, `descent-override`) keeps layout stable when the webfont loads late. **Quantified gate: `font-display: swap` + overrides; zero CLS from webfont load.**

---

## spacing: from default to decided and measured

**Default:** `padding: 13px`, `margin-top: 22px`, a different gutter per component, group and item gaps indistinguishable. The agent spaces by eye, nudging until things look "about right."

**Non-default choices:**

- **A half-geometric scale, not linear.** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px. Pure linear (8, 16, 24…) is mechanical; random (13px, 17px) is noise. The half-geometric is the smallest non-default that reads as intentional. The `type` and `layout` lenses consume this scale; `canon` names the base unit and the density grade that sets how aggressively the steps are applied.

- **Optical alignment over mathematical alignment (the agent does not do this).** Mathematical centering via box model produces visual misalignment on mixed-content rows: an icon next to text must be shifted slightly up; a button with rounded ends needs unequal horizontal padding to look visually centered; a sharp-cornered element next to a circular one needs a small optical overshoot. These are per-element corrections, not scale values — the brief acknowledges them as craft work the agent requires explicit instruction to apply.

- **Group proximity forces separation.** The single most-missed spacing rule: **group-gap ≥ 2× intra-group gap.** If item-spacing inside a card is 8px, the spacing between cards must be ≥16px — or the eye cannot group without reading the borders. This is not a style choice; it is a perceptual law. **Quantified gate: group/item gap ratio ≥ 2:1, confirmed at STAGE 1.**

- **Touch targets floor.** ≥ 44×44px on interactive elements. **Quantified gate: all tap/click targets ≥ 44×44px.**

- **Baseline rhythm.** All vertical gaps are multiples of the base unit (4 or 8px). The page has an invisible vertical grid; text baselines and element tops land on it.

---

## depth & shadow: from default to decided and measured

**Default:** a single `box-shadow: 0 2px 4px rgba(0,0,0,0.5)` per elevated element. Hard edge, pure black, high opacity. Reads as cheap.

**Non-default choices:**

- **Two-layer shadow, colored, low opacity each.** Layer 1 (contact shadow): small offset, small blur, slightly higher opacity (0.06–0.12). Layer 2 (ambient): larger offset, large blur, very low opacity (0.03–0.06). Together they read as real elevation. **Quantified gate: ≥ 2 shadow layers; per-layer opacity ≤ 0.12; hue-tinted toward background/brand.**

- **Unified light direction.** All shadows point in the same direction (typically down-and-slightly-right). Elevation tier = how large and diffuse the layers become. **Quantified gate: all shadows share one light direction.**

- **Elevation as a named scale.** Four tiers minimum: resting (flat, no shadow or hairline) · raised (1px lift) · overlay (panel / tooltip) · modal (highest). Each tier has tokenized y / blur / spread / opacity values, not ad-hoc per-component values.

---

## radius: from default to decided and measured

**Default:** the agent picks a border-radius by aesthetic feel, applies it inconsistently, and ignores nested elements.

**Non-default choices:**

- **A radius scale.** Four or five tokenized values: 2px (tight/data-dense), 4px (standard UI), 8px (cards), 12–16px (modals/large surfaces), `9999px` (pill/full). Components reference scale steps.

- **Concentric radius law (non-default, non-obvious).** When one rounded element nests inside another, the inner element must have: `inner-radius = outer-radius − gap`. If a card has `border-radius: 12px` and a button inside has 8px padding from the card edge, the button's radius should be ≈4px. Same outer + same inner = corners that bulge outward and look wrong without anyone being able to name why. **Quantified gate: all nested rounded elements satisfy inner = outer − gap.**

---

## motion: from default to decided and measured

*(Technique lives primarily in the motion lens; canon sets the budget and purpose taxonomy.)*

**Default:** `transition: all 0.3s ease` applied broadly. Animation added because it "looks polished." No `prefers-reduced-motion` path.

**Non-default choices:**

- **Purpose taxonomy, always constant.** Every animation that ships maps to one of four jobs: *orient* (state change, what just changed); *causality* (what caused what, where did this come from); *mask latency* (loading, optimistic update, hide the wait); *direct attention* (guide the eye to what matters next). Motion without a named job is decoration; decoration does not ship.

- **Physics for interruptible motion; easing for discrete transitions.** Spring/mass-damping for gesture-driven, interruptible, or "natural" motion (a dragged element, a sheet dismiss) — a re-triggered spring continues from current velocity, it doesn't jank-restart. Short easing curves (150–300ms) for discrete UI transitions (open/close, appear/disappear). The two are not interchangeable.

- **Budget ceiling by archetype.** Set at STAGE 1; see the motion budget section there.

- **Compositor-only.** Only `transform` and `opacity`. Animating layout properties (`width`, `height`, `padding`, `top`) triggers reflow; `transition: all` includes them. **Quantified gate: no animated layout/paint properties.**

- **`prefers-reduced-motion` path is real.** Re-tuned, not stripped. Instant snaps on crossfades; spring physics replaced by cut or fade; duration tokens have a reduced-motion variant.

---

## the one signature element (Chanel law)

The difference between "bold" and "incoherent" is concentration. Bold scattered across every dimension simultaneously — expressive type AND neon accent AND heavy shadows AND dramatic motion — reads as noise. The Chanel law: decide ONE dimension where bold is spent; make everything else restrained. Common signature choices:

- A typeface that carries the personality (display cut, optical size, unusual weight)
- A palette move (an unexpected hue temperature, a deliberately muted vs unusually vivid accent)
- A spatial gesture (a dramatically wide outer margin, a compressed-then-released measure rhythm)
- A signature motion (a single interaction animation that is distinctive)

**Write it down. Everything else is quiet.**

---

*Cross-links: [surface-archetypes.md](surface-archetypes.md) — the five archetypes and what each non-default choice means per archetype; [product-sense.md](product-sense.md) — whether the brief serves the user's actual job.*

# Surface Archetypes — what the surface is for, and what that constrains

> Five canonical archetypes for web surfaces, each carrying a different governing
> constraint set. The archetype is not a theme ("it looks like a tool"); it is a
> CONSTRAINT SET — a named motion budget, a density grade, a decoration ceiling, a
> type hierarchy — that every design decision must serve. Pick the wrong archetype and
> every downstream lens will produce a surface that is internally coherent but wrong
> in kind.

---

## why archetypes, not aesthetics

The agent sees aesthetic styles — light/dark, minimalist/expressive, serif/sans — and treats them as independent sliders. The practitioner sees archetypes: *what is this surface for, and what does that demand of the visual language?* A data-dense trading terminal and a lifestyle editorial share no design DNA even if both happen to be dark and minimal. The archetype encodes the *purpose of the surface*, and from purpose flows every other constraint.

The five archetypes below are not exhaustive (real surfaces straddle); they are the canonical anchors. Name the primary; if a surface straddles two, the primary archetype's constraints take precedence where they conflict.

---

## archetype 1: dashboard

**What it is for.** At-a-glance status and decision support. The user scans, interprets, and decides — they do not read, and they do not create. The surface's job is to reduce time-to-insight on a recurring visit, not to impress on a first visit.

**Governing constraints:**

- **Density grade: standard.** Dense enough to show multiple metrics simultaneously; not so tight that scan requires fine motor control. 8px base unit; grid with consistent gutters; medium line-height (1.4–1.5 body). Not airy — whitespace that would read as "calm" on an editorial surface reads as "empty" on a dashboard where data is the content.
- **Type hierarchy: functional.** Metric values are the heroes; labels are secondary; explanatory text is tertiary and often absent. Type scale ratio ≈ 1.2–1.25. Numerics must use `tabular-nums` — misaligned digits in a metric surface are a craft failure.
- **Motion budget: orientation-only.** Motion earns its place only as: state-change confirmation (a value that changed since last visit); latency masking (a skeleton that holds layout before data loads); cautious entrance animation (≤150ms, opacity only) on initial data arrival. Expressive motion, ambient motion, and any animation that fires under streaming data — never. A widget that animates every time a real-time value updates is actively hostile to focus.
- **Color: signal, not decoration.** Every color application carries meaning (status: green = healthy, red = alert). Decorative color is absent or nearly absent. The designer must verify no color-only encoding — every semantic color is backed by a label or icon.
- **Decoration ceiling: low.** No gradients, no illustrative elements, no expressive shadows. One light model for elevation (cards vs page surface), tokenized and minimal.

**The agent trap.** The agent defaults to the near-black-neon attractor for tool/dashboard surfaces. Neon accent colors that read as "energetic" on a landing page read as misleading semantic signals on a dashboard (is this alert status?). The brief must specify that accent color is reserved for signal, not decoration.

---

## archetype 2: tool

**What it is for.** Task execution. The user is in the middle of a job — composing, configuring, building. The surface disappears; the work is primary. Every visual decision is evaluated against: does this help the user complete the task, or does it distract?

**Governing constraints:**

- **Density grade: compact or standard.** Tools are often power-user surfaces; compact density (4px base, tight gutters, information-maximizing) is appropriate for professional tooling. Standard for consumer tools. Never airy — generous whitespace on a tool is wasted screen real estate the user would prefer for content.
- **Type hierarchy: functional.** Labels, controls, and feedback text. No editorial prose. Ratio ≈ 1.2. Optical size matters for small labels in tight contexts.
- **Motion budget: near-zero.** The most restricted archetype. Motion fires only for: causality (where did this output come from?); state confirmation (did the action succeed?); orientation within a complex multi-panel layout. Duration ceiling: ≤150ms for feedback, ≤250ms for panel transitions. No ambient, no decorative, no expressive. **Every animation must have a name (orient/causality/latency); unnamed animations are deleted.**
- **Color: functional.** Semantic colors for state (error, warning, success, active). Accent color for primary action only. The near-black-neon attractor is the natural default here and must be actively examined: does the chosen accent color serve the tool's primary action, or is it incidental decoration?
- **Decoration ceiling: minimal.** Depth from one light model (elevation for active/focused elements, flat otherwise). Border radius chosen for clarity (small to zero radius on data-entry elements, slightly more on panels/containers). Icons from one set, functional not decorative.

**The agent trap.** The agent adds micro-animations to "confirm" every action — hover states, click ripples, tooltip entrances — because these are the default behaviors of popular component libraries. On a tool surface, the cumulative animation budget must be tracked; most of these animations should be instant or near-instant.

---

## archetype 3: editorial

**What it is for.** Reading. The user enters a state of sustained, focused attention. The surface's job is to create and sustain that state — to be comfortable to inhabit for 5–30 minutes. Contrast, measure, and rhythm are the primary levers; decoration is irrelevant and usually harmful.

**Governing constraints:**

- **Density grade: airy.** 8–12px base; generous leading; wide margins; large whitespace budget. The editorial version of "generous spacing" is not a trend; it reduces eye fatigue over long reading sessions.
- **Type is the hero.** The signature element is almost always typographic — a distinguished display cut, a pairing that creates hierarchy, a point size that signals authority. Ratio ≈ 1.333 (perfect fourth) to 1.5. Measure (line length) must be gated: 45–75 characters for body, ~66ch ideal. Text-wrap balance on headings.
- **Motion budget: restrained.** Scroll-driven transitions for section reveals are permitted and can be signature. Entrance animations for images/quotes are standard. Expressive interactive motion (hover reveals, parallax) is permitted but must justify itself against reading-state disruption. **Rule: nothing that fires repeatedly or unpredictably during reading.** A scroll-progress indicator is fine; a sidebar that bounces while the user reads is not.
- **Color: restrained palette.** The neutral ramp and one accent. On editorial surfaces the neutral tint temperature is the dominant brand expression — warm (H ≈ 60–80) for human/literary, cool (H ≈ 250–270) for analytical/journalistic. High-contrast text on a slightly off-white ground; the warm-cream-editorial attractor is the natural default here and must be examined: is it chosen, or defaulted?
- **Decoration ceiling: medium.** Pull quotes, image treatments, rule lines, section dividers — permitted where they serve the reading experience. Decorative elements that do not serve reading are removed.

**The agent trap.** The agent reaches for the warm-cream-serif attractor immediately. The brief must specify whether this is adopted on purpose (with a reason) or rejected in favor of a different editorial temperature.

---

## archetype 4: marketing

**What it is for.** A first impression and a conversion. The user arrives skeptical and leaves with intent — or leaves. The surface's job is to earn attention, establish trust, and move toward action. It will be seen once (or a few times), not revisited for work.

**Governing constraints:**

- **Density grade: airy.** Generous whitespace. Each section breathes. The user's eye should be led, not overwhelmed.
- **Type: expressive.** The display type can be large, dramatic, and personality-forward. Ratio ≥ 1.333, often 1.5+. The one signature element is frequently typographic — the typeface is the brand voice.
- **Motion budget: expressive.** The most permissive archetype. Signature motion (a distinctive scroll behavior, a branded entrance animation, spring physics on interactive elements) is permitted and often expected. **But:** motion must earn its place (purpose taxonomy still applies); animation overload — every element entering with an effect — reads as AI-generated noise rather than craft. The Chanel law applies to motion too: one signature motion is powerful; six competing entrance effects is amateur. Duration up to 500ms for signature moments; crisp ≤200ms for interactions.
- **Color: brand-expressive.** This is where unusual palette choices are most appropriate. The accent color can be vivid, the neutral temperature can be deliberately distinctive. The 60-30-10 proportion still applies; the choices within each slot can be bolder.
- **Decoration ceiling: high (but one signature).** Gradients, textures, illustration, imagery — permitted where they serve the conversion story. The constraint is the Chanel law: bold concentrated in one dimension, restrained elsewhere. A surface with dramatic type AND vivid color AND heavy gradients AND expressive motion AND illustrated backgrounds is incoherent.

**The agent trap.** The agent over-animates. On a marketing surface this is the most visible failure mode: every section has an entrance effect, every interactive element has a hover animation, and the cumulative effect reads as "AI-generated landing page" rather than deliberate craft.

---

## archetype 5: data-dense

**What it is for.** Maximum information per pixel for users who are experts in the data. Think: trading terminals, analytics platforms, medical records, logistics dashboards, scientific data visualization. The user knows what they are looking at; the surface's only job is to not get in the way of extracting it.

**Governing constraints:**

- **Density grade: compact.** 4px base unit, tight leading, minimal padding. Every pixel of screen real estate is information real estate. This is the one archetype where "it looks cramped" is acceptable feedback — the user expects and benefits from compression.
- **Type: utilitarian.** Small sizes (11–13px body in data contexts), tabular numerics mandatory, monospace for code or numeric columns, optical sizing for small text. Type scale ratio ≈ 1.2 or less. No decorative display type.
- **Motion budget: none.** The most restrictive motion constraint of all five archetypes. Motion is excluded except for: one use case (latency masking — a skeleton or loading indicator while data fetches). **Even state-change confirmation animation is removed** — in a data-dense surface with streaming data, animation on every row update would be visual chaos. The value changing is its own confirmation.
- **Color: information encoding only.** Every color means something. Semantic status colors are rigorous. Data visualization follows perceptual-uniformity rules (oklch monotonic lightness for sequential, Okabe-Ito for categorical — see the color lens). Decorative color is not permitted. The background must be a near-pure neutral; any warm or cool tint must be deliberately small.
- **Decoration ceiling: zero.** No gradients, no illustrative shadows, no expressive border-radius. Hairline rules for table grid. One light model only if elevation is genuinely needed (an overlay).

**The agent trap.** The agent treats "data table" as a design challenge and adds alternating row stripes, hover fills, sort animations, and rounded corners to individual cells. These are decorative impositions on a surface where the data is the only content.

---

## straddling archetypes

Most real surfaces straddle two. Common legitimate straddlings:

- **Dashboard + tool** (an application where the user monitors AND acts): primary = tool (motion budget = orientation-only, density = standard). Dashboard constraints where they are stricter (color = signal not decoration).
- **Editorial + marketing** (a brand-forward content site): primary = editorial (type, measure, reading experience). Marketing constraints at section boundaries (signature motion, expressive color on hero sections).
- **Data-dense + dashboard** (executive metrics view of dense data): primary = data-dense (motion = none, density = compact, color = encoding). Dashboard constraints for navigation and summary panels.

The rule: when archetypes conflict, the primary archetype's constraint takes precedence. Name the primary in the brief.

---

*Cross-links: [non-default-and-quantified.md](non-default-and-quantified.md) — how to quantify the choices each archetype implies; [product-sense.md](product-sense.md) — stress-testing the chosen archetype against the user's actual job.*

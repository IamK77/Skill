---
name: form
description: >
  The depth-and-shape lens for a frontend surface — where elevation becomes physical,
  corners become a language, and texture earns its place. Use after color tokens are
  committed, when establishing or auditing the depth model, or when surfaces "look flat /
  look cheap / look wrong but I can't say why." The one shift: depth comes from ONE
  consistent light model — layered shadows sharing a direction, a tokenized elevation
  z-scale, concentric radii, and texture only with a job — the agent invents a fuzzy
  box-shadow per component and four light directions, feeling no wrongness, so it must
  be gated.
  Triggers on "shadow / box-shadow / elevation / depth / z-index / z-scale / depth tokens",
  "border-radius / corner / squircle / rounded", "gradient / texture / grain / banding /
  noise", "it looks flat / looks cheap / looks plasticky / looks off", "card / modal / dropdown
  / raised surface",
  "glassmorphism / frosted / backdrop blur / scrim", "aurora / mesh gradient / ambient
  background".
argument-hint: "[the UI / component / design system to give a coherent depth model]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# form

!`checklist init ${CLAUDE_SKILL_DIR} --force`

A *form* in the sculptor's sense is the three-dimensional presence of a thing — its weight, its surface, how the light falls on it. `form` is the depth-and-shape lens of the `atelier` suite: where color tokens say *what hue lives here*, `form` says *how far above the surface it sits*, *what shape its corners make*, and *whether the surface has a texture or is empty*. Its product is a written **depth system**: one light model with a tokenized elevation z-scale, a concentric radius family, and deliberately chosen gradients and texture — each committed as tokens before components consume them.

**The governing fact: depth reads as physical when one light source drives four coordinated outputs; it reads as "CSS" when a lone fuzzy `box-shadow` is invented per component.** The four outputs are the cast shadow (layered ambient + direct), the contact shadow (tight grounding layer), the top-edge highlight (inset light on the raised face), and the surface gradient (micro light-to-dark across the face). All four must share one light direction. Most UI depth work only touches the first — and the rest of the form system is the gap between "looks designed" and "looks premium." Radii follow the same logic: concentric nesting is not a visual preference, it is a geometric fact (the inner arc must subtract the padding to stay parallel); a nested card whose inner image has the same radius as the outer card does not look like the same system. And texture, like motion, earns its place only with a named job: depth, focus, or brand. Without a job, it is noise.

This is where the agent era bites:
- **The agent invents a new `box-shadow` per component.** Each is defensible alone; the set has four different light directions, three different blur radii, and two different coloring approaches. No individual value is obviously wrong; the system is incoherent. The light model must be a decision, written down, gated.
- **The agent never does concentric radii.** It assigns a `border-radius` by eye — or copies from a similar component — and the inner element gets the same radius as the outer container, so the corners visually pinch. This is the single most reliable fingerprint of unattended craft, and the one step that is almost never taken without a gate.
- **The agent adds gradients because it can, not because they have a job.** A slight gradient on a hero card, a subtle shimmer on a button, an ambient background glow on a dashboard — each seems harmless; together they are visual entropy with no signal. The question "what is this gradient's job?" must be a gate, not an afterthought.
- **The agent never dithers.** It writes a smooth gradient over a large area and ships banding. Blue-noise dithering is invisible when done correctly — and the banding is often invisible too, until a calibrated display or a side-by-side comparison makes it obvious. The check must be explicit.

**Read [references/one-light-model-and-elevation.md](references/one-light-model-and-elevation.md) first** — the technical foundation. The four outputs, the layered shadow stack, the z-scale, shadow coloring, dark-mode flip, performance rules. Load at the start; re-check at STAGE 0's gate.

**Speak the user's language.** The depth system is theirs to decide. Read their fluency and gloss terms on first use: *elevation model* / *z-scale*, *ambient shadow* / *contact shadow* / *top-edge highlight*, *surface gradient* (the face itself, not a decorative layer), *concentric radius* / *inner = outer − padding*, *squircle* / *continuous curvature* / *G2-continuous*, *grain dithering* / *banding*, *interpolation space* / `oklch` / `oklab` (for gradients). A system the user can't read is a style imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/one-light-model-and-elevation.md](references/one-light-model-and-elevation.md)** — the light model: four outputs (cast shadow, contact, highlight, surface gradient), layered shadow stacks with doubling offsets, shadow coloring (surface hue, lower L, higher C, never black), z-scale tokens (resting / raised / overlay / modal), dark-mode flip (surface brightness lift), multiply blend mode, non-rectangular drop-shadow, press states, performance rules, accessibility.
- [references/radii-and-shape.md](references/radii-and-shape.md) — the radius family: a tokenized scale (xs → full), concentric nesting law (inner = outer − padding, recursively applied), continuous-curvature squircles (n ≈ 4–5) for prominent surfaces, shape language vocabulary (round / bevel / scoop / notch), radius as affordance and brand temperature, directional asymmetric corners with semantic meaning, clipping rules, responsive radius.
- [references/gradient-and-texture.md](references/gradient-and-texture.md) — gradients and texture with intent: job-first rule (depth / focus / brand or removed), OKLCH/OKLAB interpolation (never sRGB defaults), color banding and grain dithering (blue noise best), the transparent-black trap, eased-alpha scrims, gradient types by use, aurora/mesh with restraint, texture blend modes, gradient text contrast, `@property` animation, dark-mode rethink, performance budget.

> **The arc is one depth system.** Three stages — light model · radii · gradient/texture — turn a working-but-flat surface into a coherent material: shadows that share a light direction and map to a z-scale; corners that are concentric and carry shape language; gradients and texture that appear only with a job and without banding. `form` runs after `atelier:color` (the perceptual palette is committed as tokens) and before `atelier:motion` (depth cues are in place before the motion layer adds temporal ones). Its tokens are what the design system later enforces and what `atelier:canon` earlier specified as the surface archetype's target depth density.

> **Greenfield or retrofit? Choose the entry.** Starting clean: walk STAGE 0 → STAGE 2 in order. Retrofitting an existing surface: inventory first — every ad-hoc `box-shadow`, every magic `border-radius`, every gradient without a named job. Cluster them into what the three stages own (elevation model · radius family · gradient/texture intent). That inventory is the raw material each gate consumes; the taste decisions stay yours. The audit technique (how to surface undeclared values across CSS and JS) is in `atelier:systems` — bring its output to STAGE 0 and the gates run unchanged.

---

## STAGE 0 — One light model (commit a z-scale and shadow token set)

Open **[references/one-light-model-and-elevation.md](references/one-light-model-and-elevation.md)**. Fix the light model *before* touching any component's shadow.

- **Decide the light direction.** Almost always: directly overhead or slightly behind and above. Once chosen, every shadow in the UI must agree with it — only size and softness change per elevation step, never the direction. Write it down.
- **Build the layered shadow stack.** Not a single `box-shadow`, but 3–6 layers at low per-layer alpha (0.02–0.06), doubling offset and blur each step. The layers approximate the natural penumbra falloff. Add a tight contact shadow layer at the base (0–2px offset, 0–2px blur). Add a top-edge highlight (`inset 0 1px 0 rgba(255,255,255,.06–.12)`). Add a surface gradient to the face itself (L delta 1–3%). All four outputs, all sharing the light direction.
- **Color the shadows.** Never pure black. Shadow hue ≈ surface hue, L lower, C slightly higher. Use oklch relative color: `oklch(from var(--surface-bg) calc(l - .20) calc(c + .02) h / .04)`.
- **Map elevation to the z-scale.** Four tokens: `--z-resting` (static card), `--z-raised` (hover/interactive/sticky), `--z-overlay` (dropdown/menu/popover), `--z-modal` (dialog/drawer/toast). Each token encodes the full shadow recipe — the layered stack, the contact layer, the highlight. Components reference a token, never a literal shadow value. z-index ordering must agree with z-scale ordering.
- **Dark mode.** On dark surfaces, diffuse shadows nearly vanish. Elevation switches mechanism: each step raises the surface's L slightly (Material's overlay model), and the top-edge highlight and surface gradient carry the primary elevation signal. The shadow layers thin but don't disappear entirely.

### GATE — clear before STAGE 1
1. `checklist check light one-light-model-z-scale`
2. `checklist verify light`

---

## STAGE 1 — Concentric radii and shape (tokenized, nested, intentional)

Open **[references/radii-and-shape.md](references/radii-and-shape.md)**. Fix the radius system *before* touching any component's corners.

- **Define the radius scale.** A small token set: `--radius-xs` through `--radius-2xl` plus `--radius-full`. Map each step to a role (chip, input, button, card, modal, pill). Every component references a step by role — no magic `border-radius` values.
- **Apply concentric nesting everywhere.** Every element nested inside a rounded container must have `inner-radius = outer-radius − padding`. Apply this recursively. If the result is ≤ 0, the inner element gets `border-radius: 0`. This is geometric law, not preference — the eye sees when it's wrong. It is also the step most frequently skipped.
- **Decide the shape language.** Plain `round` is a valid choice — but it must be a *choice*, not a default. Consider `bevel` (technical/industrial), `squircle` / `superellipse` on large prominent surfaces (smoother, softer, premium). Decide it once; apply it consistently. Shape language is part of the brand temperature.
- **Handle edge cases.** Full-bleed elements touching the viewport edge: drop the radius on the touching sides. Directional elements (tabs, bottom sheets, chat bubbles): use per-corner asymmetry only when it encodes real meaning. Clip rounded containers with `overflow: hidden`.

### GATE — clear before STAGE 2
1. `checklist check shape concentric-radii-and-shape-language`
2. `checklist verify shape`

---

## STAGE 2 — Gradient and texture with intent, without banding

Open **[references/gradient-and-texture.md](references/gradient-and-texture.md)**. Commit only gradients and texture that have a job; make them banding-free.

- **Name the job for each gradient.** Depth (surface gradient, scrim), focus (mask fade, edge fade), brand (hero, ambient). If a gradient can't be named, remove it. This includes the surface gradient from STAGE 0 — name it "depth" and it is already in the system.
- **Specify the interpolation space explicitly.** Every gradient uses `in oklab` (direct mixing) or `in oklch` (hue-wheel travel, with a `shorter hue` or `longer hue` directive). Never rely on sRGB interpolation. The dead-gray midpoint in a sRGB gradient between two saturated colors is the most common invisible defect in production UI gradients.
- **Fix transparent-black.** Every fade-to-nothing uses same-color-zero-alpha (`oklch(0.55 0.20 27 / 0)` not `transparent`). Audit every gradient that fades to transparent and correct it.
- **Fix banding.** Large subtle gradients — especially the barely-visible surface gradients and hero backgrounds of premium UI — exhibit banding on 8-bit displays. Apply grain dithering: a precomputed blue-noise texture at 0.02–0.05 opacity on a pseudo-element, blended with `overlay` or `soft-light`. Cache SVG feTurbulence as a `data-URI`; never regenerate per frame.
- **Texture: job only.** Surface grain (depth/material), focus texture, brand signature material. Each texture has a named job or it ships without it. Blend mode on a pseudo-element (low opacity: 0.02–0.05). Characters must be readable above any texture — the floor is the content, not the surface.
- **Aurora and mesh gradients: decide or decline.** These are legitimate brand choices — and the current default "AI aesthetic." If this surface uses one: commit to it (tokenize the color stops and any animation parameters), limit to 2–4 color blobs at moderate saturation, add a scrim where text appears, and stop the animation under `prefers-reduced-motion`.

### FINAL GATE
1. `checklist check texture gradient-texture-with-intent-and-no-banding`
2. `checklist verify texture`
3. `checklist show` — confirm all three stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`form` is the `atelier` suite's **material conscience** — the stage where the visual system acquires physical presence. Color tokens say what hue is here; type and space say how text sits; `form` says how high off the surface a panel is floating and what that elevation looks like in light. The through-line is the suite's: *push correctness into structure*. A tokenized z-scale with a committed light model cannot produce a shadow in the wrong direction — the token encodes both. A concentric-radius rule applied everywhere cannot produce a nested card with the wrong inner radius — the formula is applied at placement time, not guessed. A "gradient has a job" gate cannot produce a decorative gradient that slipped in on instinct — it never passes the gate.

The line that keeps `form` honest: **the document holds the encodable technique (how layered shadows work, the concentric formula, banding fixes, the interpolation spaces); the taste decisions — which z-scale steps, which radius temperature, which depth density matches this surface archetype — stay a gate the user clears.** A data tool should be nearly flat, with elevation only for modals and focused panels. A consumer card surface can be heavily layered. `atelier:canon` sets the target; `form` implements it correctly and gates each step.

## Anti-patterns (use as a pre-flight checklist)

- **One fuzzy `box-shadow` per component** — the most common depth defect; replace with a layered stack from the z-scale token.
- **Four different light directions** — the agent's default; every shadow must agree on one direction.
- **Pure-black shadows** — they press the surrounding hue toward gray; tint toward the surface's own hue.
- **Missing top-edge highlight** — the raised face needs a line of light on its top edge, especially in dark mode where the diffuse shadow nearly disappears.
- **Missing surface gradient** — an elevated card with a perfectly flat fill looks like a sticker; a 1–3% L delta makes it material.
- **Dark mode depth as bigger shadows** — on dark surfaces, elevation comes from raising the surface's L, not from deeper shadows.
- **Non-concentric nested radii** — the most visible indicator of unattended craft; apply inner = outer − padding at every nesting level.
- **Same radius on all elements** — every element the same radius regardless of size or role reads as "someone set a variable once"; the scale maps step to role, and role drives the component.
- **No shape decision** — `round` is fine, but it must be a choice; the surface archetype implies a shape language, and that implication should be made explicit.
- **Gradients without a job** — each unnamed gradient is visual entropy; name it (depth / focus / brand) or remove it.
- **sRGB gradient interpolation** — the dead-gray midpoint between saturated colors is invisible to the developer and visible to the viewer; always specify `in oklab` or `in oklch`.
- **`transparent` in gradient fades** — fades to `rgba(0,0,0,0)` (transparent black), producing a dirty midpoint; always fade to same-color zero-alpha.
- **Banding unfixed** — premium UI uses barely-visible gradients over large areas; 8-bit displays band them; grain dithering fixes it silently.
- **Texture as decoration** — texture without a job is the equivalent of motion without a purpose; name the job or remove it.
- **Skipping a GATE** — and remember: every depth value should trace to the system; if it doesn't, it was picked by hand, and the next developer will pick a different one by hand.

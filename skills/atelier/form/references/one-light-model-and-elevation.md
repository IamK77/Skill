# One Light Model and Elevation — encodable technique

> The technique behind `form`'s first gate. Taste picks the light direction, the shadow
> tint, and the z-scale steps; the system then derives every shadow and surface value by
> formula. No ad-hoc `box-shadow` — every depth cue is a TOKEN computed from one source.

---

## Depth is more than shadow — the cue toolbox

Shadow is one depth cue, not the only one — and rarely the strongest. Before stacking
shadow layers, reach for the cheapest cue that already reads as *deep*; the light model
below is the systematic core, but a surface can read raised with almost no shadow when a
stronger cue carries it. The full toolbox, strongest first:

- **Occlusion / overlap — the strongest cue.** One element covering another is read as
  "in front" instantly and unambiguously, before any shadow is processed. A sheet that
  simply overlaps the content behind it is already deep. Spend this before spending blur.
- **Surface brightness.** Brighter reads as nearer — and in dark mode this *replaces*
  shadow as the primary elevation signal (see the dark-mode flip below): each higher layer
  lifts its surface L rather than deepening a shadow.
- **Backdrop blur.** A panel, sheet, or nav over blurred content (`backdrop-filter`) reads
  as floating above *and* concentrates attention on itself — depth and focus in one move
  (GPU cost is real; ration it to focal layers).
- **Scrim / tint.** A semi-opaque darkening layer behind a modal pushes the page back and
  pulls the dialog forward — the cheapest way to seat an overlay in space.
- **Scale + shadow, synchronized.** An element that grows as it rises (a modal entering, a
  card lifting on hover) with its shadow growing in step reads as moving toward the viewer.
  This is as much a motion concern as a static one — coordinate it with `atelier:motion` so
  the transform and the shadow animate together, never separately.
- **Atmospheric perspective (advanced).** Distance desaturates and cools: recessed surfaces
  lose chroma and drift slightly cooler in hue, near surfaces stay saturated and warm. A
  whisper of this between background and foreground reads as real space.

The taste call is *which* cue (or which two) carries the depth for a given surface; the
gate is that whatever you pick is a decided, tokenized cue, not an invented per-component
`box-shadow`. The light model below is how you make the shadow cue itself systematic.

---

## Why one light model

A real shadow has a direction. Real elevation has four coordinated outputs from that same
direction: a diffuse cast shadow below, a contact shadow grounding the element, a top-edge
highlight where the light hits, and a faint surface gradient from light-face to shadow-face.
Most UI "depth" only does the first — a lone `box-shadow: 0 4px 16px rgba(0,0,0,.3)` — and
the result reads as CSS, not as material. The test: cover the shadow. If the card doesn't
still look raised (because the highlight and surface gradient say so), the depth was only
ever paint, not structure.

**One light direction. Four outputs. All four must agree.**

---

## The four outputs (the light model's full scope)

### 1. Cast shadow (drop shadow)

The shadow the element throws on the surface below it. Goes down (and slightly angled if
the light is not directly overhead). Grows in size and softness as elevation rises.

Real shadow physics: there are two components, not one.
- **Key / direct shadow** — tight, offset, directional; cast by the main light source.
- **Ambient / contact shadow** — soft, nearly centered, from scattered ambient light; it
  "seals" the element to the surface.

A single `box-shadow` layer approximates neither. The correct form is a **layered stack**
of 3–6 layers at equal low alpha (~0.02–0.06 each), doubling offset and blur per layer. The
alpha sum stays moderate; the natural penumbra falloff comes from the layering, not from
one high-alpha blur. One high-alpha fuzzy shadow is the signature of a "CSS box-shadow"
and the thing a trained eye reads as cheap.

### 2. Contact shadow (grounding)

A tight, dark layer at the element's base: offset 0–2px, blur 0–2px, higher darkness.
Its job is to "land" the element — without it, even a perfectly layered diffuse shadow
makes the element look like it is floating. This corresponds to the tightest ambient
component. It is a separate layer in the shadow stack.

### 3. Top-edge highlight

The face that the light hits. `inset 0 1px 0 rgba(255,255,255,.06–.12)`. Very low alpha —
a "line of light", not a stroke. Without it, the shadow only tells the viewer "something
is below" but not "this surface is raised toward the light." In dark mode, this highlight
carries most of the elevation signal because diffuse shadows nearly disappear on dark
surfaces.

### 4. Surface gradient

The face itself, from top to bottom, carries a micro-gradient: top marginally lighter,
bottom marginally darker. Lightness delta: 1–3%. Larger deltas look retro (the 2000s
embossed button); this is a whisper. Direction must agree with the light source.

---

## Shadow coloring (the painter's rule)

Never pure black. A pure-black shadow presses the hue of whatever is beneath it toward
gray — the visual equivalent of mud. Real shadows are *colored*: lower L, slightly raised
C, tinted toward the surface's own hue. Formula: the shadow hue ≈ the surface color's
hue; L lower by ~0.15–0.25; C slightly higher than the surface (the shadowed area
concentrates the hue — Impressionist observation, engineer implementation).

In oklch: `oklch(from var(--surface-bg) calc(l - 0.20) calc(c + 0.02) h)`.

For layered stacks, keep per-layer alpha low (0.02–0.06) so the tinted layers accumulate
naturally without becoming muddy.

**Dark mode flip:** on dark surfaces, shadows nearly vanish (shadow darker than surface,
but surface is already dark — low contrast). Elevation on dark surfaces must instead come
from **surface brightness lift**: each higher elevation step raises the surface's L
slightly (Material Design's dark-mode overlay model). The top-edge highlight and surface
gradient become the primary elevation signals. Shadow layers can remain but thin out.

---

## The tokenized z-scale

Map elevation to a discrete z-scale. Four named steps cover all real UI cases:

| Token | Role | Shadow character |
|---|---|---|
| `--z-resting` | Cards, tiles, static panels | Subtle 2–3-layer stack; barely lifted |
| `--z-raised` | Hovered/interactive elements, sticky headers | 3–4-layer stack; clearly elevated |
| `--z-overlay` | Dropdowns, menus, popovers | 4–5-layer stack; floating clearly above page |
| `--z-modal` | Dialogs, drawers, toasts | 5–6-layer stack; scrim behind; maximum elevation |

Each token encodes the *full* shadow recipe: layered stack + contact shadow + highlight.
Components reference a `--z-*` token, never a literal `box-shadow` value.

**z-index must agree with z-scale:** an element at `--z-overlay` has a higher `z-index`
than one at `--z-raised`. Depth and stacking order are two views of the same model.

---

## Shadow stack reference (how to build each token)

Pattern: each layer doubles offset and blur from the previous; alpha is constant and low.

```css
/* --z-resting */
box-shadow:
  0 1px  1px oklch(from var(--surface-bg) calc(l - .20) calc(c + .02) h / .04),
  0 2px  2px oklch(from var(--surface-bg) calc(l - .20) calc(c + .02) h / .04),
  inset 0 1px 0 rgba(255,255,255,.07);   /* top-edge highlight */

/* --z-raised */
box-shadow:
  0 1px  1px .../.04,
  0 2px  2px .../.04,
  0 4px  4px .../.04,
  inset 0 1px 0 rgba(255,255,255,.09);

/* --z-overlay */
box-shadow:
  0 1px  2px  .../.04,
  0 2px  4px  .../.04,
  0 4px  8px  .../.04,
  0 8px  16px .../.04,
  inset 0 1px 0 rgba(255,255,255,.10);

/* --z-modal */
box-shadow:
  0 2px  4px  .../.04,
  0 4px  8px  .../.04,
  0 8px  16px .../.04,
  0 16px 32px .../.04,
  0 1px  2px  .../.08,   /* contact */
  inset 0 1px 0 rgba(255,255,255,.12);
```

---

## multiply blend mode for colored backgrounds

A fixed-rgba shadow looks wrong over colored or image backgrounds — it reads as a gray
film, not a shadow. Correct method: place the shadow on a pseudo-element and apply
`mix-blend-mode: multiply`. This multiplies the shadow against whatever is below it,
producing a physically correct darkening in any hue. Combine with the colored tinted
shadow recipe for maximum correctness.

---

## Inset shadows: press states and recessed surfaces

`inset` box-shadow goes inward — used for:
- **Press state** of a button: inset shadow + reduced or absent outer shadow = the element
  is pushed in.
- **Recessed inputs**: a shallow inset shadow gives an input field the tactile sense of a
  slot in the surface.
- Neumorphic techniques (inset + outset combined) can express strong materiality but carry
  low a11y contrast — use sparingly and always verify contrast.

---

## Non-rectangular elements: drop-shadow vs box-shadow

`box-shadow` follows the `border-box` — a rectangle. For elements shaped by
`clip-path`, `SVG`, or a transparent-PNG with a real silhouette, use
`filter: drop-shadow()` instead, which follows the alpha channel. Using `box-shadow` on
a clip-path element produces a rectangular ghost shadow that clearly breaks the illusion.

---

## Performance

- **Never animate `box-shadow` parameters directly** — it triggers repaint on every
  frame. For hover elevation transitions: pre-render both shadow states and cross-fade
  their `opacity` (using a pseudo-element), or use `@starting-style` + `transition`.
- `backdrop-filter: blur()` is GPU-expensive — limit to key focal layers (modal,
  frosted-glass nav). Each additional blur layer compounds the cost.
- Large blur radii on many elements stack paint cost. Profile before shipping.

---

## Accessibility

- Shadow alone must not be the only affordance signal. A user with low vision may not
  perceive a subtle elevation difference. Pair depth cues with sufficient color contrast
  and, for interactive surfaces, a border or ring on focus.
- Frosted-glass / blur panels with text: contrast must hold at the *worst* point across
  the variable background behind the blur, not at an average. Use a fallback solid-color
  region or a scrim layer to guarantee the floor.
- Focus rings: use a dual-ring approach — one high-contrast inner ring (e.g. white/black
  depending on surface), one accent outer ring. Either ring alone fails one polarity.
  Bind to `:focus-visible`, not `:focus`.

---

## Quick-reference (tokenizable / lintable)

| Item | Rule |
|---|---|
| Depth cue priority | Occlusion (strongest) > brightness > backdrop blur > scrim > scale+shadow > atmospheric; pick the cheapest that reads deep before stacking shadows |
| Light direction | One direction, site-wide — only size and softness change per elevation |
| Shadow layers | 3–6 layers; offset × 2 per layer; alpha 0.02–0.06 per layer |
| Shadow color | Surface hue, lower L, slightly higher C; never pure black |
| Contact shadow | Separate tight layer: offset 0–2px, blur 0–2px, darker |
| Top-edge highlight | `inset 0 1px 0 rgba(255,255,255,.06–.12)` |
| Surface gradient | L delta 1–3%, direction agrees with light |
| Dark mode elevation | Surface brightness lift + highlight; shadows thin out |
| z-scale | resting / raised / overlay / modal — tokenized, not ad-hoc blur values |
| z-index parity | z-index order = elevation order |
| Non-rectangular | `filter: drop-shadow()`, not `box-shadow` |
| Colored backgrounds | Pseudo-element + `mix-blend-mode: multiply` |
| Animation | Cross-fade shadow opacity via pseudo-element; never animate blur/spread |
| backdrop-filter | Limit to key layers; profile cost |

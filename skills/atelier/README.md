# atelier — the design-craft suite

> An *atelier* is a workshop where a craft is practised to a standard. This suite is the visual-design
> half of building an interface: where `surface` decides *what is true* (boundaries, state, the four
> states), `atelier` decides *what it looks and feels like* — and makes that a **system**, not a pile of
> hand-picked values.

**The governing fact:** a polished interface is values *derived from a small system*; an amateur one is
values picked one at a time. The same hex typed in nineteen places, a font-size nudged until it "looks
right", a shadow invented per component — each is defensible alone, and their sum is the incoherence the
eye reads as "cheap" without being able to name it. And the benchmark is not a document — it is a **human
nervous system** (16ms is a fusion threshold, 100ms is "I caused that"), so **taste is load-bearing and
cannot be outsourced.** The agent emits plausible-but-incoherent values and feels no wrongness; so each
layer of the system is a taste decision the human makes at a **GATE**, and the system enforces it after.

## The eight lenses

`canon` sets the system; the other seven each own one layer of it. Most design work is not greenfield —
enter at the layer that's wrong (the [pilot](pilot/) navigator routes you).

| Lens | Owns |
|---|---|
| **[pilot](pilot/)** | *(un-gated navigator)* routes a design task to the right entry lens — or out to a sibling suite |
| **[canon](canon/)** | the design-judgment spine — which visual language, which surface archetype, the quantified targets, product-sense fit |
| **[color](color/)** | a perceptual oklch palette as tokens — neutral ramp, semantic roles, dark as a re-tuned ramp, contrast at design time, colorblind-safe data-viz |
| **[type](type/)** | a modular type scale + a spacing scale on one rhythm, the optical tells, and text that survives every language (BiDi/RTL, CJK, locale) |
| **[layout](layout/)** | composition as a decision — grid & hierarchy, measure & rhythm, designed empty/error states, robustness for reality's long tail |
| **[form](form/)** | depth from one light model — layered shadows + a tokenized elevation scale, concentric radii, gradient/texture with a job and without banding |
| **[graphics](graphics/)** | DOM-first; Canvas/WebGL/GPU only where the DOM can't go (with a fallback); one icon system; a coherent imagery system |
| **[motion](motion/)** | every animation with a purpose and real physics — spring vs easing, gesture arbitration, a true reduced-motion path, compositor-only at 60fps |
| **[systems](systems/)** | the design system as one source of truth — tokens that don't drift across the CSS↔JS boundary, a living component library, a no-drift handoff |

## Relationship to `surface`

`atelier` owns the *look and feel*; `surface` owns the *frontend engineering*. The seam is **judgment vs
mechanism**: how CSS Grid / the cascade actually work is `surface:keel`; the composition *judgment* is
`atelier:layout`. *What* to build and the user's mental model is `surface:bearings`; *which visual language*
is `atelier:canon`. Enforcing the design system at 1→N is `surface:bulwark`; building the system artifact is
`atelier:systems`. `surface:pilot` and `atelier:pilot` route across the seam.

## Gates

Every lens except `pilot` is a multi-stage flow whose **GATE**s are enforced by the `checklist` CLI, which
installs separately:

```bash
npm i -g @iamk77/skill-checklist
```

Without it the gates silently no-op and a lens degrades to prose. Installs every skill under the `/atelier:`
prefix.

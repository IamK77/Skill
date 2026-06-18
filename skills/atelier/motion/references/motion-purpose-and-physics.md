# Motion Purpose and Physics — the purpose taxonomy, easing curves, spring parameters, and orchestration

> The encodable technique behind `motion`'s purpose and physics gate. Taste decides which animations earn their place and how much personality the surface warrants; this doc holds the system that turns that decision into a correct, named, tokenized motion language. **Motion is not decoration — it is a function, and an animation that maps to no function is noise.** Restraint is the default; over-animation is a tell of agent-generated work.

---

## The seven-purpose taxonomy — classify before animating

Before touching timing or curve, every animation must be named to one job. No job → noise → delete.

1. **Causality / origin story** — show where a thing came from and where it went: the button that triggered the panel; the list item that expanded into a detail view. `transform-origin` is the mechanical implementation: a modal scaling from the button that opened it, a tooltip growing from its anchor, a menu expanding from the trigger corner. Set the origin to the causal source.
2. **Spatial continuity** — on state or route change, keep the user's mental map: the object *persists and moves* rather than teleporting (shared-element morph, a card thumbnail expanding into the detail image). Prevents disorientation during navigation.
3. **Feedback / responsiveness** — confirm input was received. First visible response **< 100ms** — below this threshold the user perceives it as instant; above it, the cause-and-effect link begins to break. A button press, a toggle click, a form submission.
4. **Progress / status** — communicate an ongoing process: loading states (determinate vs indeterminate), background sync, streaming data. Indeterminate = animation with no end signal; determinate = a fill that tracks real progress.
5. **Attention / hierarchy** — direct what gets seen first: staggered list entrance, a lead element that settles before its secondary context, focus animation pulling the eye to a newly valid field.
6. **Depth / spatial model** — establish Z relationships: a modal scaling forward while its shadow grows larger and softer (reads as forward); a drawer sliding in from the edge (implies it was off-screen, behind). Echoes the depth model from `form`.
7. **Expression / brand** — the emotional layer: a playful bounce, a weighty drop, a signature transition that becomes the product's personality. Spend it on **one** signature moment, not everywhere. Every other animation should be quiet.

**The ethics test:** does this animation serve the user's task, or does it capture attention for a commercial goal? The latter is a dark pattern — motion used to manufacture urgency, hijack attention, or drag the eye toward a CTA.

**Idle / ambient motion** (things moving with no user action) should be used extremely sparingly — it is a frequent "AI-generated" tell, burns battery, and irritates focused users.

---

## Easing curves — direction, tokens, and duration

**Default error:** `linear` for everything, or one `ease` site-wide, or `transition: all 0.3s`.

Easing = energy and mass. Real objects accelerate (ease-in) and decelerate (ease-out). The direction rule is the single most important:

- **Entrance / responding to user action → ease-out** (`cubic-bezier(0, 0, 0.2, 1)`) — decelerate into place. Anything answering the user must start instantly (fast start = "follows my finger") then settle gently.
- **Exit → ease-in** (`cubic-bezier(0.4, 0, 1, 1)`) — accelerate away. Get out of the way fast.
- **On-screen A→B move → ease-in-out** (`cubic-bezier(0.4, 0, 0.2, 1)`) — standard.
- **Signature / expressive entrance** — asymmetric: extremely fast start, long slow tail. Used only for the one brand moment.
- **`linear`** — reserved for genuinely constant, no-start-no-end motion: infinite spinners, progress fill, 1:1 drag tracking. Never for UI transitions.

**Pure ease-in on an entrance is forbidden** — the slow start reads as "stuck."

Commit all four curves as tokens and reference them by name, never re-type a `cubic-bezier`.

**Duration is a function of distance and size, not a universal constant:**
- Duration grows sub-linearly with travel distance and element size (small/short → faster; large/cross-screen → slower).
- **Exit ≈ 0.6–0.8× entrance duration.** Let things leave fast.
- Perceptual bands: **< ~100ms** = not perceived as motion (≈ instant); **150–400ms** = most functional UI; **> ~400–500ms** = starts to feel sluggish (signature / hero excepted).
- **First frame of feedback < 100ms** — even if the full animation is longer, something must move immediately.
- **Stagger interval: 20–60ms** between adjacent list items. > ~80ms feels slow. **Cap total stagger duration** — never linearly stagger 50 items: cap the visible count or use a decay curve so later items accelerate.

Typical layering: micro-feedback 50–150ms · standard transition 200–300ms · large/complex 300–500ms · expressive hero may go longer.

---

## Spring parameters — the real knobs

A spring is a 2nd-order system: `m·x″ + c·x′ + k·x = 0`. Three raw parameters: **stiffness `k`** (restoring force), **damping `c`** (dissipation), **mass `m`** (inertia). Don't tune them directly — they're unintuitive. Think in the two derived perceptual quantities:

- **ω₀ = √(k/m)** — natural frequency → controls **speed** (how fast it wants to reach target).
- **ζ = c / (2·√(k·m))** — damping ratio → controls **character** (the critical knob):

| ζ | type | behavior |
|---|---|---|
| ζ < 1 | underdamped | overshoot + oscillation (bounce); smaller ζ = bouncier |
| ζ = 1 | critical damping | **fastest settle with no overshoot** — the crispest "no bounce" |
| ζ > 1 | overdamped | slow approach, no overshoot; usually sluggish in UI, avoid |

**Overshoot formula:** `exp(−ζπ/√(1−ζ²))` — ζ 0.2:53% · 0.3:37% · 0.5:16% · 0.6:9.5% · 0.7:4.6% · 0.8:1.5%.

**Design interface — what you actually tune:**
- **`response`** (perceived duration, seconds) = `2π/ω₀ = 2π·√(m/k)`. Larger = slower and looser.
- **`bounce` / `dampingFraction`**: Apple `dampingFraction` = ζ (0 = max bounce, 1 = none); Framer `bounce` ≈ 1 − ζ.
- Convert to library k/c/m when needed: `k = m·(2π/response)²`, `c = 2·ζ·√(k·m)`.

**Parameter tiers by element weight and role:**

| tier | use | ζ | response | overshoot |
|---|---|---|---|---|
| crisp/precise | buttons, switches, data controls | ≈ 1.0 | 0.2–0.3s | none |
| standard UI | most transitions, cards, panels settling | 0.8–1.0 | 0.3–0.5s | 0–tiny |
| smooth | modals, drawers, large surfaces | 0.9–1.0 | 0.4–0.6s | none |
| lively | small delight elements, badges, reactions | 0.5–0.7 | 0.3–0.5s | visible |
| bouncy (sparingly) | signature moments only | 0.35–0.5 | 0.4–0.6s | obvious |

**Bounce budget:** most of the site at ζ ≥ 0.8 (overshoot ≤ ~1.5%); visible bounce reserved for the few light/signature elements. Heavier / data-bearing / precise elements: ζ closer to 1.0, crispest settle.

**Larger elements get a longer `response`**; small elements should be quick — a large modal at 0.2s response feels frantic.

---

## The spring vs curve decision tree

The choice is mechanical — not a matter of taste:

```
discrete · state-to-state · known duration · not interruptible
        └─ easing curve  (CSS transition / Web Animations API)

gesture-driven · interruptible · needs "physics" · must carry velocity
        └─ spring  (stiffness/damping/mass; library-driven)
```

A Bézier restarted mid-flight jumps (it restarts from the beginning). A spring carries current position AND current velocity — that round-trip is the fingerprint of native feel. Use curves for the cheap declarative 90% (a hover, a fade, a discrete open) and springs for anything a finger touches or anything that must redirect without a jump.

**Interruptibility (the spring's superpower):** when a re-trigger or grab happens mid-flight, capture current *position + velocity* and feed them as initial conditions — the animation continues from where it was, at the speed it was going. The rest threshold (stop animating when displacement < ~0.5px AND velocity < threshold) prevents infinite micro-drift; settle time ≈ `4/(ζ·ω₀)`.

---

## Orchestration patterns — named and reusable

Scatter-shot effects are amateur; an ordered sequence reads as designed. Firing everything at once is the giveaway.

- **Shared-element / morph** — an element persists across state/route change (thumbnail expands into detail image). Causality + spatial continuity. `view-transition-name` and the View Transitions API are the platform implementation.
- **Staggered reveal** — list/grid items enter in sequence, 20–60ms apart. Attention / hierarchy. Cap total duration; never uniformly stagger a long list.
- **Container transform** — a container expands while its children fade/scale in. Causality + depth.
- **Enter/exit coordination** — old content leaves first (or cross-fades), new content enters after; never a hard simultaneous cut. Always explicit, never default.
- **Z-axis lift** — a modal scales up while its shadow grows larger and softer, reading as moving toward the viewer. Depth / spatial model.

**The 12 animation principles that UI actually uses (non-default):**
- **Anticipation** — a tiny reverse wind-up before a big move (a drawer sliding in from the left has a 2px "pre-move" rightward before going left).
- **Follow-through / overlap** — secondary elements start/stop slightly after the primary, producing layering.
- **Arcs** — cross-screen moves follow a curve, not a straight line.
- **Squash & stretch** — in UI, extremely restrained: a faint scale on button-press (0.97 → 1.0), nothing more.
- **Staging** — lead one focus at a time; one thing moves, others wait.
- **Exaggeration** — controlled, signature moments only.

---

## Surface archetype and the motion budget

The purpose taxonomy is constant everywhere. The motion budget is set by what the surface is *for* — and it is a taste gate, not a default:

- **Marketing / brand surface** — may spend expressive, signature motion; personality is part of the product. One signature moment is memorable; many become noise.
- **Data / tool / dashboard surface** — motion earns its place only as orientation (what just changed), causality (what-just-happened), and latency masking. Runs crisp and short. A re-fire under streaming data must **never restart or distract** — users are in the middle of reading. The motion budget here is nearly zero; every animation that makes it through must justify itself against the user's primary task.

Decide the budget as an explicit choice at STAGE 0's gate — not by default.

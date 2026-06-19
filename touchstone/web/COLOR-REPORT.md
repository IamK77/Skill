# skill-lab — color system report (atelier:color)

Single source: `tokens.css`. Constructor + measurement: `color-build.mjs` (`node color-build.mjs`,
exits non-zero on any floor miss — a CI-able gate). This report **closes livery's standing caveat**
("contrast asserted on construction, never pair-measured"): every pair below is *measured* (WCAG 2
ratio + APCA Lc 0.98G), not asserted.

## The system (decided, not hand-picked)

- **Neutral ramp** — warm paper&ink, **H 85, chroma 0.004→0.016** (no pure gray; C≥0.005 holds).
  ink text `oklch(0.235 …)` (not #000); paper bg `oklch(0.985 …)` (not #fff).
- **Accent** — one deep evergreen, anchor **`oklch(0.470 0.075 158)`** (canon), kept a single
  swappable token. NOT clay (no Anthropic clash), NOT indigo (the AI default). Used on link / brand /
  workflow arm / positive delta only → area < 10%.
- **Negative delta** — sober ochre-brown `oklch(0.500 0.060 55)`, deliberately NOT alarmist red and
  NOT clay-coral. Always paired with a redundant sign (`+`/`−`) and label → not color-only
  (survives `forced-colors` and CVD).
- **Three-layer architecture** — raw ramp → semantic alias → component reads only the alias. Theme
  switch remaps the alias layer; no `filter:invert()` anywhere.

## Measured contrast — LIGHT (floors: body/secondary Lc≥75, tertiary/heading/delta Lc≥60, UI Lc≥45)

| role | WCAG | APCA Lc | pass |
|---|---|---|---|
| primary body / method prose | 15.97 | 100.6 | ✓ |
| headline (large) | 18.01 | 102.3 | ✓ |
| secondary (caveats — NO pale gray) | 7.77 | 85.1 | ✓ |
| secondary on raised surface | 7.37 | 81.5 | ✓ |
| tertiary / caption | 5.28 | 74.5 | ✓ |
| placeholder (exempt, not invisible) | 3.49 | 61 | ✓ |
| link / brand / positive delta | 6.29 | 79.3 | ✓ |
| accent on raised surface | 5.97 | 75.8 | ✓ |
| on-accent (button text) | 6.29 | 84.1 | ✓ |
| negative delta (sober) | 5.85 | 77.4 | ✓ |
| error text on error bg | 5.66 | 72.7 | ✓ |
| input/interactive border (1.4.11) | 3.49 | 61 | ✓ |
| input border on raised surface | 3.31 | 57.4 | ✓ |
| focus ring (non-text) | 6.29 | 79.3 | ✓ |

## Measured contrast — DARK (re-tuned, NOT inverted)

| role | WCAG | APCA Lc | pass |
|---|---|---|---|
| primary body / method prose | 15.06 | 88.4 | ✓ |
| secondary (caveats) | 13.06 | 79.3 | ✓ |
| secondary on raised surface | 12.26 | 78.8 | ✓ |
| tertiary / caption | 10.17 | 65.2 | ✓ |
| text on result panel | 12.76 | 86.7 | ✓ |
| link / positive delta | 9.45 | 61.4 | ✓ |
| accent on raised surface | 8.87 | 60.9 | ✓ |
| on-accent (button text) | 9.03 | 62.6 | ✓ |
| negative delta (sober) | 9.36 | 61 | ✓ |
| input border (1.4.11) | 7.36 | 49.7 | ✓ |
| input border on raised surface | 6.91 | 49.2 | ✓ |
| focus ring (non-text) | 9.45 | 61.4 | ✓ |

**Why APCA, not WCAG, governs dark:** at the first dark cut, secondary text read WCAG **8.68**
("pass") but APCA **57.2** (fail, floor 75) — WCAG 2 ignores polarity and systematically overstates
dark-mode contrast. The dark text steps were raised until APCA cleared. This is the precise model
doing its job.

## Non-text & CVD

- Functional borders split from decorative: `--border-strong` (inputs/interactive, ≥3:1) vs
  `--border-subtle` (section hairlines, **SC 1.4.11-exempt** — kept delicate for the editorial
  "float on paper"). Focus ring uses the accent at ≥3:1.
- **No color-only encoding.** delta carries sign + label; the two arms carry text labels ("no skill"
  / "skill as workflow"); status carries an icon/label. Luminance (the CVD-robust channel) plus
  redundant text → safe under deutan/protan/tritan and screen readers.

## Data-viz palette (STAGE 3) — categorical, n=2, CVD-safe by construction

The only viz is the two arm bars + per-finding rates. Rules applied: **gray the un-emphasized, spend
color on the signal**; **direct labels beat legends**; **cap ≪ 6–8**; rainbow banned (n/a).

- `--viz-base` = neutral gray (`n-600` light / `0.620` dark) — the "no skill" control, de-emphasized.
- `--viz-treat` = the evergreen accent — the "skill as workflow" signal.
- `--viz-track` = recessed surface; bars fill via `transform: scaleX()` (never `width` — motion gate).
- CVD-safe: base↔treat differ in **both luminance and hue**, and every bar is **labeled with its
  name and value** → meaning never rests on color. A data table / text values are present (the
  per-fixture, per-trial numbers), so the data is obtainable non-visually.

## Theme switching + FOUC (zero-JS baseline already in tokens.css)

`tokens.css` gives a zero-JS baseline via `@media (prefers-color-scheme: dark)` and a
`[data-theme]` override for an explicit toggle. To prevent a flash, embed this **blocking** snippet
in `<head>` *before* the stylesheet, in BOTH targets (kept identical for local ≡ claude.ai):

```html
<script>
  try {
    var t = localStorage.getItem('skilllab.theme');     // 'light' | 'dark' | null(system)
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
</script>
```

A toggle is optional (canon: light is the designed default, dark the secondary). If added, it sets
`data-theme` + persists to `localStorage` under `skilllab.theme`.

## Hand-off

`type` / `layout` / `form` / `motion` consume **only** the alias tokens above — never a raw ramp
step, never a hex. Re-run `node color-build.mjs` after any token edit; it must exit 0.

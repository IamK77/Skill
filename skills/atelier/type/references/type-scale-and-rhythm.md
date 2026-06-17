# Type Scale and Rhythm — encodable technique

> The gate decides *taste*: which ratio, which families, which density. This file holds the
> *technique* taste then commits to tokens. The through-line: **every size, line-height, and
> tracking value derives from one ratio and a few rules — never nudged until "looks right."**
> Six sizes that share one ratio read as "designed"; nineteen sizes picked by eye read as a draft.

---

## the modular scale & ratio

Pick **one base** (body, usually `16px` = `1rem`) and **one ratio**; multiply/divide to generate the whole scale. Do not invent sizes.

| ratio | name | use |
|---|---|---|
| 1.125 | major second | dense UI / data screens (subtle hierarchy) |
| 1.2 / 1.25 | minor / major third | general apps |
| 1.333 | perfect fourth | content / marketing |
| 1.5 / 1.618 | perfect fifth / golden ratio | editorial / display (dramatic hierarchy) |

- **Small ratio → dense, restrained; large ratio → dramatic, expressive.** Match it to the brief.
- **Cap the count of sizes actually used** to ~6–7, mapped to semantic roles (`display / h1–h3 / body / small / caption`). Too many sizes = no hierarchy. Role names are the tokens; components reference roles, never raw px.
- **Unit is `rem`** — the scale honors the user's root font-size (accessibility). Never px for type sizes.
- **Don't carry one ratio across all viewports.** A `1.618` desktop hero is too large on mobile — switch ratio at a breakpoint, or compress with fluid sizing.
- **Hierarchy is two axes: size × weight.** Small + heavier often reads "more important" than large + lighter. Name each weight's role (body 400, emphasis 600, display 700) — weight is a token too, not an ad-hoc number.

---

## fluid sizing with clamp()

Size scales smoothly between a minimum and maximum viewport with no breakpoint jump:

```css
font-size: clamp(MIN, PREFERRED, MAX);
```

- `MIN` / `MAX` = the target size at the smallest / largest viewport.
- `PREFERRED` = a linear function of the viewport — **must contain a `rem` term**.

The math, given `(minVw → minSize)` and `(maxVw → maxSize)`:

```
slope     = (maxSize − minSize) / (maxVw − minVw)
preferred = minSize + slope · (100vw − minVw)
          = (intercept)rem + (slope · 100)vw     ← intercept in rem
```

- **Hard accessibility rule:** a pure-`vw` font-size does not respond to user zoom and **violates WCAG 1.4.4**. The `rem` intercept is what fixes it — never ship a `vw`-only size.
- **Systematize it (Utopia-style):** set a ratio at the min viewport (e.g. 1.2 at 320px) and a ratio at the max (e.g. 1.333 at 1240px) and generate a `clamp()` per step — the *ratio itself interpolates*, not just the sizes.
- **Don't over-fluid.** Keep the fluid range tiny for body (16–18px); fluidity matters where the span is large — display and headings.
- **Container-fluid:** use `cqi` (container-query units) so size scales with the *container*, not the viewport — a component adapts wherever it's dropped. Emerging, very non-default.
- **Optical sizing:** on a variable font set `font-optical-sizing: auto` (or drive the `opsz` axis) — large sizes get the "display" cut (finer, tighter), small sizes the "text" cut (sturdier). Tie it to the scale.

---

## font pairing & weight roles

Three roles, regardless of family count:

- **Display** — has personality; used sparingly (headings, signature).
- **Body/Text** — highly readable, neutral, the workhorse. *A good body face is one you don't notice.*
- **Utility/Mono** — data, caption, code; tabular numerals live here.

The core law: **concord or contrast, not conflict.** Two faces that are *similar but different* (two humanist sans-serifs) reads as a mistake, not a choice.

Strategies: (1) **super-family / type system** — one family with sans/serif/mono cuts (inherently harmonious, the modern product-UI default); (2) **contrast pairing** — serif + sans, or expressive display + neutral body; (3) **workhorse + accent** — a neutral body does 95% of the work, one display face takes headings.

- **Share** x-height, overall weight/color, ideally cap-height — so the faces sit together. **Differ** in classification and personality.
- **x-height mismatch:** compensate with size so the two faces look visually consistent when set together.
- **2 families is the safe default; 3 is the ceiling** (add mono/utility). More = chaos.
- Pick faces *for this brief* — avoid the AI-default look (cream background, high-contrast serif) that every agent reaches for.

---

## measure & line-height by role

- **45–75 characters per line, ideal ~66** (Bringhurst). Too short → the eye jumps; too long → the return sweep loses the next-line start. Multi-column: ~40–50ch.
- Implement on running text with **`max-width: 65ch`** (`ch` ≈ the "0" glyph width). The constraint is the *upper* bound on wide screens; short on mobile is fine.
- **The #1 amateur tell:** body text spanning the full container — 120ch+ is unreadable.
- **Line-height is inverse to size, and systematized:** tight on display (1.0–1.2), loose on body (1.5–1.65). Set per role, not per element. The role is the token.
- For 400% reflow without clipping, measure with `max-width` in `ch`/`rem` — never a fixed px width that clips on zoom.
- **Modern wrapping controls** (the agent skips all of these): `text-wrap: balance` on headings and short blocks (≤~4–6 lines) — eliminates the "long line then single orphan word" break that makes headings read as amateur; `text-wrap: pretty` on body paragraphs — fixes last-line widows at lower performance cost than `balance`; `text-wrap: stable` on editable fields — no reflow jitter while the user types. `hyphens: auto` (requires the element's `lang` attribute) for narrow columns; `text-align: justify` only with hyphens enabled, otherwise rivers of whitespace — and ragged-right is generally more readable and more accessible on screen.

---

## metrics-compatible fallback stacks & avoiding CLS

A late webfont that swaps in at a different metric shifts the whole layout (CLS). Fix it on `@font-face`:

```css
@font-face {
  font-family: "WebFont";
  src: url(font.woff2) format("woff2");
  font-display: swap;          /* or optional */
  size-adjust: 105%;           /* match the fallback's apparent size */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

- Pick a **fallback whose metrics are already close** to the webfont; tune `size-adjust` / `ascent-override` / `descent-override` until the swap causes **no layout shift**.
- `preload` critical fonts, **subset** (especially huge CJK faces — subset/dynamic-load), and prefer a **variable font** to cut file count.

---

## the optical details — tracking & font-features

**Tracking (`letter-spacing`) follows an inverse law** — the face is spaced for body size; override only at the extremes, always in **`em`** (scales with size; px breaks at other sizes):

| level | tracking |
|---|---|
| display / large headings | **negative**: −0.01 to −0.04em (very large: to −0.05) |
| body | ~0 (default) |
| small / caption | slightly positive: +0.01 to +0.02em |
| **all-caps / eyebrow / letter-spaced label** | **strongly positive**: +0.05 to +0.1em |

Large sizes look too loose → tighten. All-caps has no lowercase rhythm → it needs to breathe. Mono/code keeps the default. The inverse law is the skeleton; tune the specific value per face and context.

**OpenType, two layers:** prefer the semantic `font-variant-*` (composable, inheritable); use raw 4-letter `font-feature-settings` only for what `font-variant-*` doesn't cover (it overrides everything and inherits poorly).

- `font-kerning: normal` — pair spacing (AV, To), critical at large sizes.
- **Ligatures:** `liga` (standard — keep on), `calt` (contextual — usually on), `dlig` (discretionary — display/editorial opt-in only), `swsh` (swash — display only). Code ligatures are a *deliberate* choice: use a programming face or turn them off, never trigger by accident.
- **True small-caps** via `font-variant-caps: small-caps` — never fake small-caps (shrunk capitals are too thin and light). Use for abbreviations, eyebrows, refined labels. Related: `all-small-caps`, `petite-caps`.
- **Stylesets `ss01`–`ss20` / character variants `cv01`+** — where premium faces hide their personality (single-story a, alternate g, another &). The agent never explores these; surface via `font-variant-alternates: styleset(...)` + `@font-feature-values`, or `"ss01" 1`.
- **All-caps** wants `case` (lifts brackets/hyphens to center-align) + `cpsp` or letter-spacing.
- **Variable axes:** `wght` (continuous weight — hierarchy without size jumps), `wdth` (narrower for dense tables), `opsz` (optical size), `slnt`/`ital`, `GRAD` (grade — adjusts visual weight *without changing width*; compensates dark-mode "thinning" without reflow).
- **Language forms:** `lang` attribute drives `locl` — Turkish dotless i, Catalan ŀl, Serbian Cyrillic italics. The agent never sets this; it is load-bearing for correct rendering.

---

## quick reference (tokenizable / lintable)

| item | anchor |
|---|---|
| scale | generate from one ratio; dense 1.125–1.25 / expressive 1.333–1.618 |
| size count | cap ~6–7, mapped to semantic roles |
| unit | `rem` (honors user zoom) |
| fluid | `clamp()` with a `rem` intercept — **never pure `vw`** (WCAG 1.4.4) |
| hierarchy | size × weight; line-height inverse to size; `font-optical-sizing: auto` |
| pairing | concord or contrast, not conflict; 2 default / 3 ceiling; share x-height |
| measure / line-height | 45–75ch (~66), `max-width: 65ch`; display 1.0–1.2 / body 1.5–1.65, by role |
| tracking | display negative / caps +0.05–0.1em; unit `em` |
| features | `font-variant-*` first, `font-feature-settings` backstop; true small-caps; explore `ss01–ss20` |
| no CLS | `size-adjust`/`ascent-override` match a close fallback; `font-display`, `preload`, subset |

**Cross-links:** [spacing-scale.md](spacing-scale.md) — the rem-based spacing scale on the same rhythm; [internationalized-text.md](internationalized-text.md) — language-specific glyphs (`locl`), CJK line-break, BiDi layout.

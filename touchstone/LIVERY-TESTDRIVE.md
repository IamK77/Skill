# livery test-drive — redesigning the lab's own UI with the new skill

**Date:** 2026-06-17. **Subject:** `output/ab_exp/lab/web/index.html` (the A/B bench UI).
**Method:** use `surface:livery` as the lens to visually redesign the bench. NOT putting the
skill on the bench as a review subject — dogfooding it by *applying* it. Before preserved as
`web/index.before.html`; screenshots `web/shot-before.png` / `web/shot-after.png`
(headless Chrome defaulted to dark, so "after" exercises the new dark ramp; "before" is light-only).

## Verdict: livery produced good FE — and the redesign passes the skill's own gate
0 raw hex literals remain (76 `var(--…)` token references); the page self-checks against livery's
top anti-pattern. Concretely, by stage:

- **STAGE 0 (color & light).** The original's worst sin surfaced immediately: the SAME palette was
  stored **twice** — in `:root` CSS vars AND a duplicate `C` JS object (line 54). That is livery's
  #1 anti-pattern ("the same color hand-typed in many places") *and* a duplicate-fact (wellspring).
  Fix: one source — an oklch ramp + semantic roles in `:root`; the `C` object now aliases `var(--…)`.
  Added a re-tuned **dark theme** the original lacked entirely (it was light-only, hardcoded `#fff`).
- **STAGE 1 (type).** Six magic font-sizes (27/17/14/13/12/11) → a modular scale + a fluid headline
  (`clamp`) + tabular numerals on the `.mono` data. (Caught a real trap: an *inline* `fontSize:27`
  on `<h1>` was overriding the tokenized CSS rule — inline beats class — so the scale wasn't
  reaching the headline until the inline value was removed.)
- **STAGE 2 (depth & form).** Flat border-only cards → a single-light-source elevation scale
  (`--shadow-1/2`) + concentric tokenized radii; focus rings via `--accent-quiet`.
- **STAGE 3 (motion).** The original had ZERO motion → purposeful, compositor-only transitions
  (bar-fill width, button lift on hover, card `rise` on mount, input/checkbox focus) + a real
  `prefers-reduced-motion` path. Every transition maps to a job (feedback / state-reveal), none idle.

## What the skill was MISSING (candidate folds-back — the real value of dogfooding)
1. **No story for an INLINE-STYLE / CSS-in-JS codebase.** livery's "every value is a token" is clean
   when you author CSS; this UI keeps colors+sizes in React inline-style objects + a JS color object.
   livery says nothing about tokenizing across the **CSS↔JS boundary** (use `var(--)` strings? a JS
   token module as the single source? CSS-in-JS?). This was the single hardest part. → add a
   reference or stage note: "tokens across the CSS/JS boundary."
2. **The duplication here was cross-language, not a literal.** livery's anti-pattern catches *magic
   hex*; the subtler bug was *the same palette maintained in two places/languages*. → livery should
   cross-link **wellspring** ("the design system is itself state — one source of truth"), the way
   bearings↔livery is now lane-marked.
3. **No "audit an existing UI" entry path.** livery's stages assume you're *starting* the system;
   this was really *audit-then-retrofit* (find the ad-hoc values, then apply stages). Like `pilot`
   routes by entry stage, livery could use a retrofit mode (STAGE -1: inventory the ad-hoc values).
4. **Spacing isn't a first-class gate.** STAGE 2 gates radii/elevation but not the spacing scale,
   yet magic-px spacing was the most pervasive ad-hoc value. Spacing deserves explicit gating
   (the technique is in the css-and-tokens / css-layout refs, but not in livery's 4 gates).
5. Minor: motion guidance is tuned for rich/marketing UI; a data/dashboard surface (bar-fill +
   state-reveal) wanted less. The purpose taxonomy still held — nothing fired without a job.

## Honest caveats
- N=1, one UI, applied by the same agent that authored livery (not blind).
- before=light / after=dark (headless default) conflates redesign quality with the dark-mode add.
- Static render only — no interaction or real perf measured; code not executed.
- Tokenization is partial by design this pass: the `<style>` classes + the `C` color object are
  fully tokenized and inline color usages reference vars, but many JSX inline-style **numbers**
  (paddings, gaps, a few font-sizes, the 40px delta) remain — exactly the "CSS↔JS boundary" gap (#1).
  Screenshots predate the final `<h1>` inline-removal tweak.

## Bottom line
livery is a real, usable visual-craft lens: the 4 gates mapped onto an actual redesign, each forced
a genuine decision, and the output passes the skill's own anti-pattern check. The most valuable
output is the 5 fold-backs above — chiefly that livery needs a CSS↔JS-boundary story and an
audit/retrofit entry path, since most real frontend work (like this) is retrofit, not greenfield.

---

# livery test-drive · PASS 2 — the reworked, INSTALLED skill closes its own fold-backs

**Date:** 2026-06-18. **Skill:** `surface:livery` installed from the marketplace (commit `fde47ee`),
i.e. the version that was *reworked per PASS 1's fold-backs* — now with a spacing gate and the
`tokens-across-css-and-js` reference. Run honestly through the gated workflow (`checklist --dir <livery>`,
isolated from other state). Same subject: `web/index.html`. Backup: `$JOBTMP/index.pre-space.html`.

## What PASS 1 left open, and what PASS 2 closed
PASS 1 (light/first livery) tokenized **color** fully but explicitly left the **JSX inline-style numbers**
(padding/gap/font-size, the 40px delta) as magic values — fold-backs **#1 (no CSS↔JS-boundary story)** and
**#4 (spacing not a first-class gate)**. The reworked skill now *has* both. Applying it:

- **STAGE 1 · spacing scale (the new 2nd gate).** Added a 4px-based scale `--s-0..--s-7` (2·4·8·12·16·20·24·28)
  and snapped every off-scale value to it (9→8, 10/11→12, 14/18→16, …). Every `padding`/`margin`/`gap`/`gutter`
  — in **CSS rules and JSX inline styles** — now references a step. **64 `var(--s-*)` refs; 0 magic-px spacing.**
- **STAGE 1 · type across the boundary.** The inline `fontSize: 14/13/12/11` literals → scale steps
  (`--t--2…--t-5`, added `--t--2:11` and `--t-5:40` for the hero metric). **28 `var(--t-*)` refs.**
- **CSS↔JS boundary closed (option a).** Per `tokens-across-css-and-js.md`: CSS custom properties are the ONE
  source; JS inline styles read `var(--…)` strings (not numbers). The inline-beats-class trap is handled —
  no inline literal outranks the token system anymore. (Color was already one-source via the `C` alias object.)
- **Motion gate caught a real bug.** The result bar animated **`width`** — a layout property the motion check
  forbids ("compositor-only, never animate layout/paint"). Fixed to `transform: scaleX()` with the track
  clipping the rounding (`overflow:hidden`). **0 width-animating transitions left.** This is the gate doing its job.

## Gate result (run via the installed checklist)
All four passed in order: **color ✓ · type [scale + spacing] ✓ · form ✓ · motion ✓** → `all phases passed`.

## Honest caveats (unchanged discipline)
- **Contrast not formally measured** this pass — the oklch ramp was built for separation (ink↔ground is wide)
  but WCAG 4.5:1/3:1 wasn't computed pair-by-pair. The color gate's "verified at design time" is asserted on
  construction, not on a measured report. (A real audit would run a contrast pass.)
- **Type scale is dense/near-linear at the small end** (11·12·13·14 = +1px steps, not a strict ×1.2) — a defensible
  "tool UI" choice, not a textbook modular ratio. Running text at `maxWidth:780` / 14px runs ~85ch, a touch over the 75ch target.
- **`lineHeight` literals (1.4/1.5/1.6/1.7) left inline** — typographic fine-tuning, deliberately out of the spacing gate's scope.
- **Behavioral dims intentionally NOT tokenized**: container `maxWidth:780`, flex-bases, `minWidth`, the `width:70`
  number input, scroll `maxHeight` caps, `.bar` height, border/ring widths, shadow & motion offsets — these are
  content/layout/component sizing, not spacing rhythm.
- N=1, one UI, same author who reworked the skill (not blind). Static render; bars not exercised (need a live run).

## Tooling note (real finding)
The installed `checklist` v0.3.0 resolves no-arg `show`/`verify`/`check` against an ambiguous active-pointer —
a no-arg `checklist show` surfaced an unrelated **forge** run, not livery's. Had to pass `--dir <livery>` on every
command to isolate livery's state. This is concrete field-evidence FOR the unmerged `feat/checklist-state-relocate-rekey`
(key state by (skill,target)); on the published CLI, a workflow runner MUST pass the skill dir explicitly.

## Bottom line
The reworked livery **ate its own dog food**: PASS 1 produced the fold-backs, the rework encoded them as a
spacing gate + a boundary reference, and PASS 2 used exactly those to close the gap PASS 1 couldn't — plus the
motion gate independently caught a layout-animating bar. Final: **0 raw hex · 64 spacing tokens · 28 type tokens ·
0 layout-animating transitions · 4/4 gates.** The lab UI is now a single tokenized system end-to-end (CSS *and* JS).

---

# livery test-drive · PASS 3 — the taste push: "make it premium" (technical-luxe, dark-first)

**Date:** 2026-06-18. User verdict after PASS 2: functionality fine, interface "完全不满意" — wanted a
genuinely *high-end* look. PASS 1–2 were structural (tokenize, snap, one-source); this is the **taste call**
livery deliberately leaves to the human. Direction chosen by the user from three previews: **科技精工 / technical-luxe,
dark-first** (Linear / Vercel idiom).

Because the token system was already in place, the redesign was a **system re-theme, not a rewrite**: every
visible change is a new VALUE for an existing token (+ webfonts + a few signature rules). JSX untouched; 0 raw hex.

What changed (all via the system):
- **Color** — dark is now the *designed default* (a re-tuned ramp, not invert): near-black **cool** ground
  `oklch(.165 .013 265)`, elevation by lighter surface, one **electric indigo accent** `oklch(.72 .165 272)`
  with a glow token, hairline borders. Light mode kept as a re-tuned secondary ramp. Added `--on-accent`,
  `--accent-glow`, `--success`, `--elevated` tokens.
- **Type** — swapped `system-ui` (the #1 "not-premium" tell) for **Inter** (UI) + **JetBrains Mono** (data),
  via Google Fonts with `display:swap` + preconnect. Bigger, tighter display scale (`--t-4` up to 38px,
  `--ls-tight:-.022em`), confident 600 headline, tracked eyebrows.
- **Depth** — a **machined top-edge highlight** (`--edge: inset 0 1px 0 …`) on every card, a deeper soft
  shadow, a **carved bar track** (inset shadow), softer radii.
- **Signature details** — the primary CTA is **accent-filled with a glow** (lifts on hover); inputs are
  **recessed** (ground-colored) with an accent focus ring; the hero delta number now uses the electric accent;
  a faint accent **radial halo** on the body for techy depth.

Gates: unchanged structurally — the system is *more* thoroughly tokenized than at PASS 2 (still one source,
oklch, dark re-tuned not invert, hairline + one light model, motion compositor-only). Same honest caveat:
WCAG contrast not pair-measured (sub-text on dark ground especially should be checked in a real audit).
Screenshot: `web/shot-luxe.png` (dark, the new default). Backup: `$JOBTMP/index.pre-luxe.html`.

Bottom line: the "screenshot delta" that PASS 2 couldn't show, PASS 3 delivers — and it cost ~one token-block
rewrite, because PASS 1–2 had made the surface re-themeable. That *is* livery's thesis: taste picks the system,
the system makes the taste cheap to change.

---

# livery test-drive · PASS 4 — real LAYOUT change + light-mode polish

**Date:** 2026-06-18. Feedback after PASS 3: "整体布局没有什么变化呀，亮色也精修" — paint changed, COMPOSITION
did not, and light needed equal care. PASS 1–3 were color/type/depth/motion (livery's gates); layout is broader
(bearings/keel territory) but it's where "looks generic" actually lived.

Layout (structural, touched the JSX):
- **Masthead shell** — `skill·lab` wordmark + gradient brand-mark + an environment badge (this machine /
  claude.ai), hairline-ruled. A product shell instead of a bare column.
- **Wider canvas** 780 → 1040px, hero **measure-capped at 760px** so running text stays ~70ch.
- **2-column setup grid** — Provider ‖ Delivery-modes side by side (auto-fit minmax(300px,1fr), collapses on
  narrow), replacing the single stack. This is the change that reads as "different layout."
- **Scoreboard result** — `.result` card with an accent gradient top-bar; the delta promoted to a hero number.

Light-mode polish: cleaner cool near-white neutrals, softer hairline, richer accent (.53 .2 273), and
**layered (two-stop) soft shadows** instead of one flat shadow; the dark-only top-edge highlight is a no-op in
light. Screenshots: web/shot-luxe2.png (dark). Light headless capture was flaky (static-server keep-alive +
Google-Fonts stalled Chrome virtual-time) — verifiable by OS appearance toggle, or by adding an in-UI theme
toggle (offered). Still 0 raw hex. NOTE: masthead + grid are composition, not livery gates — livery owns paint, not IA.

---

# livery test-drive · PASS 5 — full redesign: "paper & ink" (warm editorial, light-default)

**Date:** 2026-06-18. Feedback: PASS 1–4 still felt "平庸、不够贵、乱，颜色不行，很经典的ai配色"；reference =
**Apple / Anthropic / OpenAI** sites; it's both the bench AND the front door for the livery skill itself, so a
mediocre frontend discredits the skill. Plus a hard constraint: **accent must not clash with Anthropic's clay.**

Root-cause of why earlier passes still looked cheap: **the dark-slate + indigo/violet accent IS the "classic AI"
look** — every AI startup wears it, so it reads generic. Plus card-soup + flat hierarchy. The fix was a complete
change of direction, not another nudge:

- **Color** — abandoned dark-neon for **warm paper (cream) + warm ink**, near-monochrome. ONE restrained
  **deep-evergreen** spark (`oklch(.47 .075 158)`) — deliberately NOT clay/coral (no Anthropic clash) and NOT
  indigo (not the AI default), used only on the skill name, the brand dot, links, and the workflow arm. The
  primary button is **ink-black** (Apple/OpenAI). Accent is a single token → trivially swappable.
- **Type** — **editorial serif display** (Newsreader) for the headline (the "expensive" move), **system SF**
  for UI/body (Apple-native), mono for data. Dramatic hierarchy: huge serif hero vs tiny tracked eyebrows.
- **Form / declutter** — **killed the card-soup**: `.card` stripped of border/shadow/bg, so sections now float
  on the paper, separated by whitespace + uppercase eyebrows. Only the **result** is an elevated panel (the hero).
  Reverted the 2-col grid to a calm single editorial column (max 880px).
- **Motion** — unchanged (purposeful, compositor-only, reduced-motion).

Light is now the **designed default** (matching the references); a refined **warm-dark** ramp is the secondary.
Screenshot: `web/shot-paper.png` (light). Captured by temporarily neutralizing the dark media query, shooting
via the main server (so fixtures render), then restoring it. Still 0 raw hex. Backups: `$JOBTMP/index.pre-redesign.html`.

Open knob: the evergreen accent is one token — swap to navy / oxblood / pure-monochrome in one line if desired,
and its *presence* can be dialed up (green eyebrows, green delta) or kept near-monochrome.

---

# livery test-drive · PASS 6 — layout & typesetting (editorial label-gutter)

**Date:** 2026-06-18. Direction (paper&ink + evergreen) accepted; "布局与排版需要改进". Fixes:
- **Measure control** — narrowed the shell (880→820) so the content column lands at ~70ch instead of a
  ~100ch wall (the worst 排版 sin in PASS 5, esp. the fixtures block).
- **Label-gutter grid** — `.card`/`.hero` are now a 2-col grid: the uppercase section label hangs in a
  144px left rail, content flows in a measure-capped right column (the Stripe/Tailwind-docs pattern). Pure CSS
  (force `.hl`→col1, everything else→col2); no per-section body-wrapping. Stacks on ≤720px.
- **Section rhythm** — hairline `border-top` rule + generous top margin between sections; first section ruleless.
- The result stays a full block panel (not a gutter row); the footer aligns to the content column.

Screenshot: `web/shot-paper2.png` (light). Open dials: headline currently wraps ~5 lines (max-width:15ch — can
widen to ~18ch for 3 lines); gutter-label prominence; fixtures-summary density; and the still-open accent hue.

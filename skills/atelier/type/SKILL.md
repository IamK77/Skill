---
name: type
description: >
  The type & text lens for a frontend build — where the scale, rhythm, and language-resilience
  of every string are decided, and where "looks amateur" and "won't work in Japanese" are both
  fixed. Use when establishing or auditing a type system, when text looks off (too many sizes,
  wrong spacing, uneven rhythm), or when the UI has never been tested outside English. The one
  shift: a modular type SCALE + a spacing SCALE on the same rhythm (never magic px sized by
  eye), AND text that survives EVERY language (i18n/BiDi/CJK/locale) — the agent nudges
  font-sizes until they "look right" and tests only in English, so the scale and the i18n
  robustness must be decided and gated. Triggers on "type scale / modular scale / font size /
  font pairing", "spacing / padding / margin / gap / vertical rhythm", "line height / measure /
  line length / text wrap", "tabular numbers / numerics / data table typography",
  "RTL / BiDi / right-to-left / Arabic / Hebrew", "CJK / Chinese / Japanese / Korean",
  "i18n / internationalization / locale / pluralization", "webfont / CLS / font-display /
  fallback stack", "letter-spacing / tracking / kerning / OpenType / ligatures",
  "text looks off / sizes inconsistent / spacing by eye / magic px".
argument-hint: "[the UI / component / design system to give a type system and i18n robustness]"
allowed-tools: Read Bash Edit Write WebSearch WebFetch
---

<!--
Copyright 2026 IamK77 — Licensed under the Apache License, Version 2.0.
See ./LICENSE and ./NOTICE · https://www.apache.org/licenses/LICENSE-2.0
-->

# type

!`checklist init ${CLAUDE_SKILL_DIR} --force`

An *atelier* is a craftsman's workshop where every detail is deliberate and traceable — nothing slapped on, nothing "good enough for now." `type` is the `atelier` suite's text lens: where the scale is set, the rhythm committed, the optical details sharpened, and the system stress-tested against every language it will ever carry. Its product is a written **type system**: a modular scale expressed as tokens, a spacing scale on the same rem rhythm, and an internationalized-text posture that survives BiDi, CJK, IME composition, and the full Intl API — each committed *before* components consume it. It runs across three gated stages and will not advance past a **GATE** until the `checklist` tool clears it — order enforced, substance yours.

**The governing fact: a polished typographic surface is values derived from a small system; an amateur one is values picked one at a time.** The same `font-size: 14px` typed in thirty places, a heading scaled by nudging until it "looks right", a `padding: 13px` here and `margin-top: 22px` there — each is a hand-picked value, and their sum is the visual incoherence the eye reads as "cheap" without being able to name it. The subtler failure is text that *looks* fine in English and falls apart in German (30% longer strings), Arabic (right-to-left layout breaks), Japanese (no CLS-free fallback, wrong line-breaking), or Polish (pluralization assumes only two forms). Both failures share the same root: a value or behavior that was never part of a system, just assumed to work.

This is where the agent era bites:
- **The agent nudges sizes by eye.** It will emit `font-size: 14px` here, `font-size: 17px` there, `font-size: 13px` on that label — each "looks right" in isolation, the set reads as a draft. It has no sense of ratio or rhythm. **The sizes must come from one decided scale, not per-call taste.**
- **The agent picks magic spacing.** `padding: 13px`, `margin-top: 22px`, a different gutter per component — the most pervasive single tell in real UIs. A spacing value not in the scale does not ship.
- **The agent tests only in English.** It never sets `tabular-nums` on a data column, never writes a `clamp()` with a `rem` term, never sets `line-break: strict` for CJK, never waits for `compositionend` before firing validation. These are structural correctness issues, not style choices.
- **The agent reaches for physical CSS properties.** `margin-left`, `padding-right`, `text-align: left` — each one a quiet RTL breakage waiting to ship.

**Read [references/type-scale-and-rhythm.md](references/type-scale-and-rhythm.md) first** — the suite's technical core; for `type`, the axis that is load-bearing is **the scale as a system** (a decided ratio, fluid `clamp()`, semantic roles as tokens) rather than a pile of font-size declarations. Every gate here is a taste decision the agent cannot make for you — which ratio, which families, which density, how much i18n investment the surface needs; what it *can* do is enforce the system once you've set it.

**Speak the user's language.** Gloss a term on first use: *modular scale* / *type ratio*, *fluid sizing* / `clamp()`, *measure* / line-length, *vertical rhythm* / baseline grid, *tabular numerals*, *OpenType features* / `font-variant-*`, *metrics-compatible fallback* / `size-adjust` / no CLS, *logical CSS properties* / RTL-safe layout, *grapheme cluster* / why `string.length` lies, *ICU MessageFormat* / locale-correct pluralization. A system the user can't read is one imposed, not shared.

## The reference library

The depth lives in `references/`. Open each when a stage sends you there — not all upfront.

- **[references/type-scale-and-rhythm.md](references/type-scale-and-rhythm.md)** — the modular ratio, fluid `clamp()` sizing with its accessibility constraints, font pairing strategies, measure and line-height by semantic role, the spacing scale derived from the same rem unit, and the metrics-compatible fallback stack that eliminates CLS. The technical core of STAGE 0.
- [references/spacing-scale.md](references/spacing-scale.md) — one base unit generating a small semantic step set; density as a single token; logical properties for RTL-safe spacing; auditing ad-hoc spacing on a retrofit. STAGE 1's technical core.
- [references/the-optical-tells.md](references/the-optical-tells.md) — the details that separate professional from amateur at a glance: tabular/lining/oldstyle numerics, the tracking inverse law, true small-caps, styleset exploration, all-caps refinements, and variable font axes as design tokens. The agent almost never sets any of these; they are STAGE 0's finishing layer.
- [references/internationalized-text.md](references/internationalized-text.md) — locale-aware wrapping and alignment; logical CSS properties (free RTL); CJK line-breaking rules and font loading; IME composition events; Unicode text internals (`string.length` lies, grapheme clusters, normalization, case folding); the full Intl arsenal; pluralization and ICU MessageFormat; per-script font fallback stacks. STAGE 2's full technical depth.

> **The arc is one text system.** Three stages — scale & rhythm · spacing scale · internationalized text — turn a working-but-styleless build into a typographically coherent, language-resilient surface: the scale commits the ratio and fluid sizes as tokens; the spacing scale commits the rhythm everything else lands on; the i18n stage commits correctness across every language the product will serve. `type` gates all three; it runs after the build is working and its system is what the rest of the design surface builds on.

> **Greenfield or retrofit? Decide the entry, not a new stage.** Most real work is not a blank canvas — it is an existing surface thick with ad-hoc values. If you are starting clean, walk STAGE 0→2 in order. If a UI already exists, do one pass first: **inventory the ad-hoc values** — every magic `font-size`, every magic `px` spacing, every un-`tabular-nums` data column, every `margin-left` that will break RTL — and cluster them into the three systems the stages own (scale · space · i18n). That inventory is not a deliverable; it is the raw material each gate consumes.

---

## STAGE 0 — Type scale & rhythm (commit a modular scale as tokens)

Open **[references/type-scale-and-rhythm.md](references/type-scale-and-rhythm.md)** and **[references/the-optical-tells.md](references/the-optical-tells.md)**. Fix the scale *before* sizing any component.

- **A scale, not sizes.** Choose a modular ratio (≈1.125 for dense data UI → 1.333 for editorial, 1.2 is the general-app default), express every step fluidly with `clamp()` — with a `rem` intercept, never pure `vw` (pure `vw` violates WCAG 1.4.4) — and reference scale steps from components, never magic `px`. Cap the set to ~6–7 semantic roles (`display / h1–h3 / body / small / caption`); hierarchy is two axes — size *and* weight, both tokenized.
- **Fluid sizing systematized (Utopia-style).** Set a ratio at the minimum viewport and a ratio at the maximum; generate a `clamp()` for every step so the ratio itself interpolates, not just the px values. For variable fonts, bind `font-optical-sizing: auto` to every step so large sizes get the display cut and small sizes get the text cut.
- **Pairing & weight roles.** Pick families deliberately — concord or contrast, not conflict — and name each weight's role. 2 families is the safe default; 3 is the ceiling. Share x-height; differ in classification. Avoid the AI-default look.
- **Measure, line-height & wrapping by role.** Body text: `max-width: 65ch`, `line-height` 1.5–1.65. Display text: `line-height` 1.0–1.2. Set per role, not per element — these are tokens. Apply `text-wrap: balance` to headings and short blocks (kills "long line + orphan word"), `text-wrap: pretty` to body paragraphs (fixes last-line widows), `text-wrap: stable` to editable fields (no jitter while typing). `hyphens: auto` (with a `lang` attribute) for narrow columns or justified text. `text-align: justify` only *with* hyphens enabled; ragged-right is more readable and more accessible on screen.
- **The optical tells.** Negative letter-spacing on display headings (`−0.01` to `−0.04em`); `tabular-nums lining-nums` on every number that lives in a column or updates in place; `slashed-zero` for code/IDs; true `font-variant-caps: small-caps` (never scaled caps); explore the face's styleset (`ss01`–`ss20`); `font-kerning: normal`; `case` + `cpsp` for all-caps runs. Every one of these is invisible when present; all of them show when absent.
- **Metrics-compatible no-CLS fallback.** For every webfont, define a `@font-face` fallback with `size-adjust`, `ascent-override`, and `descent-override` tuned so the swap causes zero layout shift. `font-display: swap` (or `optional`). `preload` critical fonts. Subset CJK faces.

### GATE
1. `checklist check scale type-scale-and-rhythm-systematized`
2. `checklist verify scale`

---

## STAGE 1 — Spacing scale (one base unit → a stepped scale on the same rhythm)

Open **[references/spacing-scale.md](references/spacing-scale.md)**. The spacing scale rides on the same rem rhythm as the type scale — this gate closes the system.

- **One base unit.** Choose 4px (dense/data UI) or 8px (general default) and commit it as `--space-base`. Every gap, padding, and margin references a step (`xs` / `sm` / `md` / `lg` / `xl` / `2xl` / `3xl`), never a raw `px` value. A spacing value not in the scale does not ship.
- **Same rem rhythm as type.** `--space-md: 1rem` at 8px base means one line-height worth of space is one spacing token — the vertical rhythm and the spacing scale agree. Hold inter-element spacing to the line grid where the design calls for it.
- **Density is one knob.** Compact ↔ airy is `--space-base` re-tuned once; the scale multipliers stay constant. Never adjust individual component padding to change density — adjust the base.
- **Prefer `gap` over margins** for inter-element spacing in flex/grid. Use **logical properties** (`padding-inline`, `margin-block`, `gap`, `inset-inline`) — physical properties (`padding-left`, `margin-right`) break RTL layout silently.
- **Retrofit path.** Grep for literal `px` values in spacing properties; cluster them to the nearest scale step. `13px` → `sm`, `22px` → `md`. The inventory is the raw material the gate consumes; the taste call (base, density) stays human.

### GATE
1. `checklist check spacing spacing-scale-systematized`
2. `checklist verify spacing`

---

## STAGE 2 — Internationalized text (BiDi/RTL, CJK & complex scripts, locale, no-CLS fallback)

Open **[references/internationalized-text.md](references/internationalized-text.md)**. Text that only works in English is not a finished system.

- **Logical CSS properties throughout.** Replace every `left`/`right` directional property with its logical counterpart (`inline-start`, `inline-end`, `block`). Set `<html dir lang>` on the root. RTL should require no additional CSS.
- **Bidi isolation.** User-supplied mixed-direction text (Arabic text containing an English number) must be wrapped in `<bdi>` or `unicode-bidi: isolate` to prevent direction contamination. Use `dir="auto"` on user-content containers. Lint source files for invisible bidi control characters (Trojan Source).
- **CJK & complex scripts.** Set `line-break: strict` for Japanese/Chinese content (`kinsoku` rules). Load CJK fonts as subsets or via dynamic loading — never ship the full font. Set the `lang` attribute at the content level, not just the document root. Do not process, truncate, or reverse text by code unit or code point in Arabic/Indic contexts — shaping operates at the glyph level.
- **IME composition.** On inputs that accept CJK or other IME-composed text: listen for `compositionend` + check `event.isComposing`. Never validate, search, submit, or reformat while composition is active.
- **String internals.** Replace `string.length` with `Intl.Segmenter` grapheme counting wherever the count is user-visible or used for truncation/cursor movement. Normalize on input with `str.normalize('NFC')` before compare/search/store.
- **The Intl arsenal — no hand-rolling.** All numbers → `Intl.NumberFormat`. All dates/times → `Intl.DateTimeFormat` with explicit IANA timezone (not offset); store UTC. Relative time → `Intl.RelativeTimeFormat`. User-facing sorts → `Intl.Collator`. Pluralization → `Intl.PluralRules` with CLDR categories, not `count===1`. Messages with variables/plurals/gender → ICU MessageFormat (or MessageFormat 2.0 for complex grammar).
- **Never concatenate UI strings.** `"You have " + n + " items"` breaks in any language with different word order or more than two plural forms. Every user-facing string with a variable is a parameterized message.
- **Locale detection & routing.** Explicit user preference > `Accept-Language` > inferred. Never auto-redirect by IP. Carry locale in the URL (`/en/`, subdomain, domain). `hreflang` on all alternates. Fallback chain: `zh-Hant-HK → zh-Hant → zh → en`. Lazy-load locale bundles.
- **Per-script font fallback stacks.** Every script the product supports has a named fallback in the font stack. The `lang` attribute drives the browser's script-aware font selection.
- **Layout resilience.** German is ~30% longer than English. Never fix layout widths to English string lengths. Test with pseudo-localization (add accents, expand strings ~30%).
- **SSR hydration safety.** Date/number formatting on the server (UTC, server locale) vs the client (user timezone, user locale) diverges — format on one side, or pass explicit `locale` and `timeZone` to both.

### FINAL GATE
1. `checklist check i18n internationalized-text-and-locale`
2. `checklist verify i18n`
3. `checklist show` — confirm all three stages passed.
4. `checklist done` — clear this run's state.

---

## The thread through all of it

`type` is the `atelier` suite's **text conscience** — the place where two distinct categories of failure are caught before they reach production: the *visual* failure (type sized by eye, spacing by hand, rhythm that doesn't cohere) and the *structural* failure (English-only assumptions baked into string handling, layout, and font loading). The through-line is the suite's own — *push correctness into structure* — applied to text: a size derived from a ratio can't drift; a spacing value derived from a scale can't scatter; a logical CSS property can't break RTL. The document holds the encodable technique (how `clamp()` works, why `string.length` lies, what the Intl API covers); the taste — which ratio, which families, which density, how much i18n investment the surface needs — stays a gate the human clears.

## Anti-patterns (use as a pre-flight checklist)

- **Magic font-sizes** — `14px` here, `17px` there, `13px` on that label; derive every size from one ratio via one scale. A size not in the scale does not ship.
- **Magic spacing** — `padding: 13px`, `margin-top: 22px`, a different gutter per component; derive every gap/padding/margin from one stepped scale on the same rem rhythm as the type scale.
- **Pure `vw` font-size** — violates WCAG 1.4.4 (does not respond to user zoom); the `rem` intercept in `clamp()` is what makes it accessible.
- **A webfont that shifts layout** — use `size-adjust` / `ascent-override` to match fallback metrics; a late font must cause zero CLS.
- **Type hierarchy by size alone** — hierarchy is size × weight; both are tokens; don't escalate px at every level.
- **Spacing without a density knob** — compact vs airy is `--space-base` re-tuned once, not per-component overrides.
- **Physical CSS direction properties** — `margin-left`, `padding-right`, `text-align: left` silently break RTL; use logical properties throughout.
- **`string.length` for character counting** — it counts UTF-16 code units, not user-visible characters; use `Intl.Segmenter` with grapheme granularity.
- **Hand-rolled number/date formatting** — `1,234` in English is `1.234` in German; use `Intl.NumberFormat` and `Intl.DateTimeFormat` everywhere.
- **`count===1` pluralization** — Polish has 4 forms, Arabic has 6; use CLDR categories via `Intl.PluralRules`.
- **String concatenation for UI messages** — word order and inflection differ by language; every message with a variable is an ICU MessageFormat string.
- **Missing `tabular-nums` on data columns** — digit widths jitter when values update, columns misalign; force `tabular-nums lining-nums` on any numeric data.
- **CJK without `line-break: strict`** — line-breaking does not respect kinsoku (禁則) rules; closing punctuation floats at line starts.
- **Validating during IME composition** — the intermediate pinyin/romaji string mis-fires every handler; wait for `compositionend`.
- **Full CJK font shipped** — CJK fonts can exceed 10MB; subset or dynamically load.
- **Skipping a GATE** — and remember: every value should trace to the system; if it doesn't, it was picked by hand.

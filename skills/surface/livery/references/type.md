# Type — the scale, the rhythm, and the optical tells

The gate decides *taste*: which ratio, which families, what the voice is. This file holds the *technique* taste then commits to tokens. The thread: **every type value — size, line-height, tracking, weight — derives from one scale and a few rules, never nudged by eye.** Six sizes that agree because they came from one ratio read as "designed"; nineteen picked individually read as a draft. The agent's tells: sizing by eye, `1.31` then `1.27` ratios, never `tabular-nums`, never matching a fallback's metrics, treating text as code units instead of grapheme clusters.

## The modular scale & ratio

Pick **one base** (body, usually `16px` = `1rem`) and **one ratio**; multiply/divide to generate the whole scale. Do not invent sizes.

| Ratio | Name | Use |
|---|---|---|
| 1.125 | major second | dense UI / data screens (subtle hierarchy) |
| 1.2 / 1.25 | minor / major third | general apps |
| 1.333 | perfect fourth | content / marketing |
| 1.5 / 1.618 | perfect fifth / golden | editorial / display (dramatic hierarchy) |

- **Small ratio → dense, restrained; large ratio → dramatic, expressive.** Match it to the brief.
- **Cap the *count* of sizes actually used** to ~6–7, mapped to semantic roles (`display / h1–h3 / body / small / caption`). Too many sizes = no hierarchy. The role names are the tokens; components reference roles, never raw px.
- **Unit is `rem`** so the scale honors the user's root font-size (accessibility). Never px for type sizes.
- **Don't carry one ratio across all viewports.** A `1.618` desktop hero is too violent on mobile — switch ratio at a breakpoint, or compress with fluid sizing (below).
- **Hierarchy is two axes: size × weight.** Small + heavier often reads "more important" than large + lighter — you needn't escalate size at every level. Name each weight's role (e.g. body 400, emphasis 600, display 700) so weight is also a token, not an ad-hoc number.

## Fluid sizing with clamp()

Size scales *smoothly* between a min and max viewport, with no breakpoint jump:

```css
font-size: clamp(MIN, PREFERRED, MAX);
```

- `MIN` / `MAX` = the target size at the smallest / largest viewport.
- `PREFERRED` = a linear function of the viewport that **must contain a `rem` term**.

The math, given `(minVw → minSize)` and `(maxVw → maxSize)`:

```
slope     = (maxSize − minSize) / (maxVw − minVw)
preferred = minSize + slope · (100vw − minVw)
          = (intercept)rem + (slope · 100)vw     ← intercept in rem
```

- **Hard accessibility rule:** a pure-`vw` font-size does not respond to user zoom and **violates WCAG 1.4.4**. The `rem` intercept is what fixes it — never ship a `vw`-only size.
- **Systematize it (Utopia-style):** set a ratio at the min viewport (e.g. 1.2 at 320px) and a ratio at the max (e.g. 1.333 at 1240px) and generate a `clamp()` for every step — *the ratio itself interpolates*, not just the sizes.
- **Don't over-fluid.** Keep the fluid range tiny for body (16–18px); fluidity matters where the span is large — display and headings.
- **Container-fluid:** use `cqi` (container-query units) so size scales with the *container*, not the viewport — a component adapts wherever it's dropped. Emerging, very non-default.
- **Optical sizing:** on a variable font set `font-optical-sizing: auto` (or drive the `opsz` axis) — large sizes get the "display" cut (finer, tighter), small sizes the "text" cut (sturdier). Tie it to the scale.

## Font pairing & weight roles

Three roles, regardless of family count:

- **Display** — has personality; used sparingly (headings, signature).
- **Body/Text** — highly readable, neutral, the workhorse. *A good body face is one you don't notice.*
- **Utility/Mono** — data, caption, code; tabular numerals live here.

The core law: **concord or contrast, not conflict.** Either harmonize (one super-family) or contrast clearly — never two faces that are *similar but different* (two humanist sans), which reads as a mistake, not a choice.

Strategies: (1) **super-family / type system** — one family shipping sans/serif/mono cuts (the modern product-UI default, inherently harmonious); (2) **contrast pairing** — serif + sans, or expressive display + neutral body; (3) **workhorse + accent** — a neutral body does 95% of the work, one display face takes headings.

- **Share** x-height, overall "color"/weight, ideally cap-height — so the faces sit together. **Differ** in classification and personality.
- **x-height mismatch:** a small-x display over a large-x body must be *size-compensated* to look visually consistent.
- **2 families is the safe default, 3 the ceiling** (add mono/utility). More = chaos.
- Pick faces *for this brief* — avoid the AI-default look (cream background + high-contrast serif everyone reaches for).

## Measure & line-height by role

- **45–75 characters per line, ideal ~66** (Bringhurst). Too short → the eye jumps and the rhythm shatters; too long → the return sweep loses the next line's start. Multi-column is narrower (~40–50ch).
- Implement on running text with **`max-width: 65ch`** (`ch` = the "0" glyph width — approximate but sufficient). The constraint is the *upper* bound on wide screens; short on mobile is fine. **The #1 amateur tell: body text spanning the full container (120ch+).**
- **Line-height is inverse to size, and systematized:** tight on display (1.0–1.2), loose on body (1.5–1.65). Set it per role, not per element.
- For 400% reflow without clipping, measure with `max-width` in `ch`/`rem` — never a fixed px width that crops on zoom.

## Spacing scale & vertical rhythm

Spacing is the same rhythm as type, derived from the same rem-based unit — so it lives here, gated alongside the type scale, not scattered as magic px. The gate decides *taste* (which base unit, which density); this is the encodable technique it commits to tokens.

- **Pick one base unit.** `4px` (tight, dense product/data UI) or `8px` (the common default). Everything derives from it.
- **Generate a small stepped scale** — multiples of the base, or a ~1.5×-ish geometric run — **capped at ~7 steps** mapped to semantic roles: component-internal padding · inter-component gap · section rhythm. The role names are the tokens (`xs/sm/md/lg/xl/2xl/3xl`); components reference steps, never raw px.
- **Reference steps from components, never magic px.** `padding: var(--space-md)`, not `padding: 13px`. A gap not in the scale is the most pervasive ad-hoc tell in real UIs (`padding: 13px` here, `margin-top: 22px` there, a different gutter per component).
- **Same rem unit as the type scale** so spacing and the vertical baseline rhythm agree — one rhythm, not two. Hold spacing to a baseline so headings, paragraphs, and lists land on consistent intervals — one system, not per-block nudges.
- **Density is a single knob.** Compact ↔ airy is the base re-tuned once (and re-mapped through the scale), not per-screen nudging.
- **Prefer `gap`** (flex/grid) over margins for inter-element spacing — it sidesteps margin-collapse ambiguity.
- Derive concrete values with `calc(var(--space-base) * n)` — see css-and-tokens.md for the `--space` token plumbing.

## Numerics — the agent's blind spot

Controlled via `font-variant-numeric` (preferred) with `font-feature-settings` as the low-level fallback. **Two orthogonal axes + a few features.** The agent almost never sets these, and it's exactly what separates a "professional" data screen from an "amateur" one.

**Glyph height — lining vs oldstyle:**
- `lining-nums` — cap-height, sit on the baseline → UI, all-caps contexts, tables.
- `oldstyle-nums` — with ascenders/descenders, blend like lowercase → more elegant in running prose. (The agent always uses lining; oldstyle in body is the refined choice.)

**Width — tabular vs proportional:**
- `tabular-nums` — every digit equal-width → columns align. **Force it on tables, prices, timers, any number that updates in place** (otherwise width jitters as digits change — misaligned tables, jumping clocks).
- `proportional-nums` — natural widths (1 narrower than 0) → better in prose.

**Other features:** `slashed-zero` (0 vs O — mandatory for code/IDs/data), `diagonal-fractions` (true ½ not 1/2), `ordinal` (true 1ˢᵗ), `sups`/`subs` (true super/subscript, not a shrunk font-size).

Shorthand + fallback:
```css
font-variant-numeric: tabular-nums lining-nums slashed-zero;
font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1;   /* low-level backstop */
```
Decision matrix:
```
tables / data / prices / live-updating  → tabular + lining
running prose                           → proportional + oldstyle (if the face has it)
code / IDs                              → tabular + lining + slashed-zero (often mono)
```
- **Align numeric tables right + `tabular-nums` + on the decimal point** (`text-align: "."` is emerging; fall back to right-align / padding). Currency aligns on the decimal; sign handling stays consistent.
- **Format content with `Intl.NumberFormat`** — locale-correct grouping, currency, percent, units. This is the bridge to i18n; never hand-roll separators.

## Optical details — display tracking & font-features

**Tracking (`letter-spacing`) follows an inverse law** — the face is spaced for body size; override only at the extremes, in **`em`** (scales with size; px breaks at another size):

| Level | tracking |
|---|---|
| display / large headings | **negative**: −0.01 to −0.04em (very large to −0.05) |
| body | ~0 (default) |
| small / caption | slightly positive: +0.01 to +0.02em |
| **all-caps / eyebrow / letter-spaced label** | **strongly positive**: +0.05 to +0.1em |

Large sizes look too loose → tighten; all-caps has no lowercase rhythm → it needs to breathe. Mono/code keeps the default. Faces differ in natural spacing (geometric sans vs humanist) — the inverse law is the skeleton; tune the specific value per face/context.

**OpenType, two layers:** prefer the semantic `font-variant-*` (composable, inheritable); use raw 4-letter `font-feature-settings` only for what `font-variant-*` doesn't cover (it overrides everything and inherits poorly).

- `font-kerning: normal` — pair spacing (AV, To), critical at large sizes.
- Ligatures: `liga` (standard, default on — keep it), `calt` (contextual, usually on), `dlig` (discretionary — **display/editorial opt-in only**), `hlig` (historic — rare). Code ligatures are a *deliberate* choice — use a programming face or turn them off, never trigger by accident. `swsh` (swash — decorative entry/exit strokes) is display-only.
- True small-caps via `font-variant-caps: small-caps` — **never fake small-caps** (shrunk capitals are too thin/light). Use for abbreviations, eyebrows, refined labels — lighter and more elegant than all-caps. Related values: `all-small-caps`, `petite-caps`, `unicase`.
- **Stylesets `ss01`–`ss20` / character variants `cv01`+** — where premium faces hide their personality (single-story a, alternate g, another &). The agent never explores these; surface them via `font-variant-alternates: styleset(...)` + `@font-feature-values`, or `"ss01" 1`.
- All-caps wants `case` (lifts brackets/hyphens to center-align) + `cpsp` or letter-spacing.
- Variable axes: `wght` (continuous weight — hierarchy without size jumps), `wdth` (narrower for dense tables), `opsz` (optical size), `slnt`/`ital`, `GRAD` (grade — adjusts visual weight *without changing width*; use it to compensate dark-mode "thinning" without reflow).

## Metrics-compatible fallback stacks & avoiding CLS

A late webfont that swaps in at a different metric shifts the whole layout (CLS). Fix it on `@font-face`:

```css
@font-face {
  font-family: "Web";
  src: url(web.woff2) format("woff2");
  font-display: swap;            /* or optional */
  size-adjust: 105%;             /* match the fallback's apparent size */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```
- Pick a **fallback whose metrics are already close** to the webfont, then tune `size-adjust` / `ascent-override` / `descent-override` until the swap causes **no layout shift**.
- Also: `preload` critical fonts, **subset** (especially huge CJK faces — subset/dynamic-load), and prefer a **variable font** to cut file count.

## i18n & text internals — what makes type *correct*

Type that looks right in English is not yet correct. The agent's signature failures: hand-rolled date/number formats, `"You have " + n + " items"` string concatenation, `count===1` pluralization, physical CSS directions, and treating `string.length` as a character count.

**Locale-aware wrapping & alignment:**
- **Left-align (`text-align: start`) is the most readable on screen.** Center only short blocks (≤2–3 lines, headings). Use logical `start`/`end`, never `left`/`right` (RTL-safe).
- `text-wrap: balance` for headings/short blocks (≤~4–6 lines; kills "long line + orphan"; has a line-count cap for performance — not for long body); `text-wrap: pretty` for body paragraphs (fixes last-line widows, cheaper than balance); `text-wrap: stable` for editable fields (no jitter while typing).
- Overflow: `overflow-wrap: break-word` for long URLs/words **+ `min-width: 0` on the flex/grid child** (or it won't shrink). `overflow-wrap: anywhere` is more aggressive (also shrinks `min-content`). `word-break: break-all` (break anywhere, CJK-style) / `keep-all` (never break CJK); `white-space: nowrap` keeps a run intact.
- `orphans` / `widows` (paged/multi-column context) set the minimum lines left at the bottom/top of a column or page.
- The break-control toolbox: `&nbsp;` (bind two words — semantic non-breaks: "3 km", "20 %", "Dr. Smith", "Figure 3", dates, phone numbers, brand names, initials), `&shy;` (soft hyphen — break here *with* a hyphen), `<wbr>` / `&#8203;` (zero-width break opportunity, *no* hyphen — long compounds/URLs).
- `hanging-punctuation` (Safari-limited) hangs quotes/bullets outside the measure so the text edge stays optically flush.
- `hyphens: auto` (+ element `lang`) for narrow columns; `text-align: justify` **only with hyphens** (else rivers of whitespace) — and ragged-right is generally more readable and more accessible. Manual heading widow fix: `&nbsp;` the last two words, or `text-wrap: balance`.
- **CJK breaks per character** (no spaces); `line-break: strict` enables *kinsoku* (no closing bracket/punctuation at line start, no opening at line end) — required for real CJK typesetting. `text-spacing-trim`/`text-autospace` (emerging) auto-space CJK against Latin/digits.

**Logical properties:** write `margin-inline-start`, `inset-inline`, `padding-block`, `text-align: start` — layout **mirrors for RTL for free**. Set `<html dir="rtl" lang>`. Most layout/text/icons mirror; logos, phone numbers, physical-metaphor icons (clock), and some media controls do *not*. Isolate mixed-direction runs with `<bdi>` / `unicode-bidi: isolate` / `dir="auto"` so a user's digits/name can't scramble direction. **`lang` is load-bearing:** it drives font selection, hyphenation, language-specific glyphs (`locl` — Turkish dotless i, Catalan ŀl), spellcheck, and screen-reader pronunciation.

**Dates, time, zones, calendars:** store **UTC, display local**. Use **IANA zone names** (`America/New_York`), *not* fixed offsets (offsets shift with DST) — pass `timeZone` to `Intl.DateTimeFormat`; the new **`Temporal` API** fixes `Date`'s flaws. DST pitfalls: 23/25-hour days, nonexistent/ambiguous local times. **Never assume the date format** (US MM/DD/YYYY vs DD/MM vs ISO); first day of week varies (Sun vs Mon); **calendars aren't all Gregorian** (Islamic, Hebrew, Japanese era, Buddhist, lunar — Intl supports them). Format with `Intl.RelativeTimeFormat` ("3 days ago"), `Intl.ListFormat` ("A, B, and C"), `Intl.DisplayNames` (locale-correct language/region names), `Intl.Collator` for user-facing sort (default `.sort()` is wrong: ä sorts differently DE vs SV).

**Locale detection & routing:** prefer **explicit user choice > `Accept-Language` / `navigator.languages` > inferred** — **never force by IP** (and never IP auto-redirect: Google penalizes it). Carry the locale in the URL (`/en/`, subdomain, or domain) for SEO + shareability; annotate alternates with **`hreflang`**. Define a **fallback chain**: locale → language → default (`zh-Hant-HK → zh-Hant → zh → en`). Externalize all user-facing text into keyed message catalogs (give translators context; don't reuse one string across contexts); **lazy-load locale bundles**. Use **ICU MessageFormat** for variable/plural/gender/select messages; **MessageFormat 2.0** (new Unicode standard) handles harder grammar (Slavic declension, gendered agreement, quantifier pipelines) that MF1 can't. Test with **pseudo-localization** (accents + ~30% string expansion). Don't assume name/address structure (a single "full name" field is often safest; flexible address forms; libphonenumber for phones). Vertical text via `writing-mode: vertical-rl`.

**Variable scripts & text-as-not-a-string:**
- Layers: byte < UTF-16 code unit < code point < **grapheme cluster** (a user's "one character"). **`string.length` lies** — it counts code units, so emoji (ZWJ sequences, skin tones) and combining marks break it. Don't `.substring`/`[i]`/`slice` (cuts a surrogate pair or grapheme in half). Iterate code points with `[...str]`; for counting/truncation/cursor movement use **`Intl.Segmenter(locale, {granularity:'grapheme'})`** — also required for word/sentence breaking in space-less scripts (Thai/Japanese).
- **Normalize before compare/search/store:** `"é"` can be one code point (U+00E9) or `e` + combining accent (U+0301) — visually identical, byte-different, won't match. `str.normalize('NFC')`; normalize on input, NFKC/NFKD for search.
- **Case folding is locale-dependent:** Turkish dotless i needs `toLocaleLowerCase('tr')` (`I→ı`, not `i`); German ß, Greek final sigma have special cases. For case-insensitive compare use `Intl.Collator` `sensitivity`, not a naive `toLowerCase`. Collation has **UCA strength levels** — primary (base letter) < secondary (accent) < tertiary (case) → `sensitivity` `base`/`accent`/`case`/`variant`; **search collation ≠ sort collation** (search usually ignores accents/case).
- **Locale data (CLDR / BCP-47):** CLDR gives far more than plurals — collation rules, date patterns, number systems, likely subtags, locale inheritance. Tune Intl via the **BCP-47 `-u-` Unicode extension**: `en-US-u-ca-buddhist-nu-thai` (Buddhist calendar + Thai digits); also `-co-` (collation), `-hc-` (hour cycle). Non-Latin **numeral systems** (Arabic-Indic ٠١٢٣, Devanagari) selected via `-nu-`.
- **IME / composition:** CJK and complex scripts compose via IME (pinyin→Hanzi). Listen for `compositionstart`/`compositionupdate`/`compositionend` + `event.isComposing` — **never validate/search/submit/format mid-composition** (the intermediate pinyin string mis-fires); wait for `compositionend`.
- **Shaping:** code point ≠ glyph. Arabic has contextual forms (initial/medial/final/isolated) + joining; Indic reorders vowel signs and forms conjuncts — per-char processing/truncation/reversal corrupts text.
- **Pluralization is not binary:** rules differ (English 1/other; Polish 1/few/many/other; Arabic 6 forms; Chinese 1). Use CLDR categories via `Intl.PluralRules` / ICU MessageFormat — never `count===1`. Format everything else with `Intl.*` (`DateTimeFormat`, `RelativeTimeFormat`, `ListFormat`, `Collator` for user-facing sort); watch SSR hydration mismatches (format on one side / pass explicit locale+timeZone). **Bidi safety:** lint source for invisible bidi control characters (Trojan Source, CVE-2021-42574). German runs ~30% longer than English — never fix layout width to the English string.

## Quick reference (tokenizable / lintable)

| Item | Anchor |
|---|---|
| scale | generate from one ratio; dense 1.125–1.25 / expressive 1.333–1.618 |
| size count | cap ~6–7, mapped to semantic roles |
| unit | `rem` (honors user zoom) |
| fluid | `clamp()` with a `rem` intercept — **never pure `vw`** (WCAG 1.4.4) |
| hierarchy | size × weight; line-height inverse to size; `font-optical-sizing: auto` |
| pairing | concord or contrast, not conflict; 2 default / 3 ceiling; share x-height |
| measure / line-height | 45–75ch (~66), `max-width: 65ch`; display 1.0–1.2 / body 1.5–1.65, by role |
| spacing | one base (4/8px) → ~7-step scale; reference steps, never magic px; same rem rhythm as type |
| tracking | display negative / caps +0.05–0.1em; unit `em` |
| numerals | width: tables/live → `tabular-nums` (forced); glyph: UI lining / prose oldstyle; `slashed-zero` for code/IDs; format via `Intl.NumberFormat` |
| features | `font-variant-*` first, `font-feature-settings` backstop; true small-caps; explore `ss01–ss20` |
| no CLS | `size-adjust`/`ascent-override` match a close fallback; `font-display`, `preload`, subset |
| wrapping | `balance` headings / `pretty` body / `stable` editable; `min-width:0` for overflow |
| i18n | logical properties (free RTL mirror); `lang` drives glyphs/hyphenation; `Intl.Segmenter` for graphemes; normalize NFC; `Intl.PluralRules` not `count===1` |
| i18n dates/locale | store UTC + IANA zone (not offset)/`Temporal`; never assume date format; explicit > `Accept-Language`, never IP-redirect; `hreflang`; fallback chain; BCP-47 `-u-` ext; ICU/MF2; don't validate mid-IME-composition |

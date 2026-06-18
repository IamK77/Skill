# Internationalized Text — type that survives every language

> A scale that only works in English is not a scale — it is an English scale. The agent's
> signature failures: hand-rolled date formats, `"You have " + n + " items"` concatenation,
> `count===1` pluralization, physical CSS direction properties, and `string.length` treated as
> a character count. Every one of these is a structural decision that must be made before
> components consume the type system.

---

## locale-aware wrapping & alignment

**Left-align (`text-align: start`) is the most readable alignment on screen.** Center only short blocks (≤ 2–3 lines, headings). Use **logical values** — `start`/`end`, never `left`/`right` — so text aligns correctly in both LTR and RTL without conditional CSS.

**Modern `text-wrap` values** the agent never sets:

```
headings / short blocks (≤ ~4–6 lines)  → text-wrap: balance  (eliminates "long line + orphan word")
body paragraphs                         → text-wrap: pretty   (fixes last-line widows, cheaper than balance)
editable fields                         → text-wrap: stable   (no reflow jitter while typing)
```

`balance` has a performance-related line-count cap — do not use it on long body text.

**Overflow control:**
- `overflow-wrap: break-word` — breaks long URLs/words to prevent container overflow.
- Add `min-width: 0` on the flex/grid child — without it, the child won't shrink past its `min-content` width and overflow-wrap never fires.
- `word-break: break-all` (break anywhere, CJK-style) / `keep-all` (never break CJK mid-word).
- `white-space: nowrap` keeps a run intact (use for semantic non-breaks: "3 km", "20 %", "Dr. Smith", dates, phone numbers, brand names — see below).

**Break-control toolbox:**
- `&nbsp;` — non-breaking space: binds two words so they never split across lines. The classic non-default for semantic integrity.
- `&shy;` — soft hyphen: a manual break point that renders a hyphen when used.
- `<wbr>` / `&#8203;` — zero-width break opportunity: break here with no hyphen (long compound words, URLs).

**Semantically unbreakable runs** — wrap these in `&nbsp;` or `white-space: nowrap`:
numbers + units ("3 km"), names + titles ("Dr. Smith"), dates, phone numbers, brand names, figure references ("Figure 3"), abbreviations.

**Hyphens:** `hyphens: auto` (requires the element's `lang` attribute) — for narrow columns or justified text. `text-align: justify` **only with `hyphens`** enabled, otherwise rivers of whitespace appear. Ragged-right is generally more readable and accessible.

**Heading widow fix:** `&nbsp;` the last two words of a heading, or use `text-wrap: balance`.

---

## RTL & logical CSS properties

Arabic, Hebrew, Persian, and Urdu are written right-to-left. Setting `dir="rtl"` on the `<html>` element (and the matching `lang`) flips the directionality — but only if the CSS uses **logical properties**.

```css
/* Physical — breaks RTL */
margin-left: 1rem;
padding-right: 1.5rem;
text-align: left;

/* Logical — mirrors for free */
margin-inline-start: 1rem;
padding-inline-end: 1.5rem;
text-align: start;
```

The logical-property swap is not a refactor; it is **the RTL strategy** — write once, both directions correct.

**What mirrors and what does not:**
- Mirrors: layout, text direction, most icons (forward/back arrows, chevrons).
- Does not mirror: logos, phone numbers, clock faces, media-playback controls (left=back is a physical metaphor), maps.

These non-mirroring elements need explicit `dir`-aware overrides or RTL-specific variants.

**Bidi isolation:** when user content mixes directions (Arabic text containing an English word or phone number), the Unicode Bidi Algorithm can scramble presentation. Isolate the run:
```html
<bdi>user-supplied text</bdi>   <!-- or: unicode-bidi: isolate -->
```
`dir="auto"` on an element lets the browser infer direction from the first strong character.

**Bidi security:** invisible bidi control characters can be embedded in source code to create a Trojan Source attack (CVE-2021-42574) — the code as read by the compiler differs from the code as seen in the editor. Lint source files to reject invisible bidi control characters.

---

## CJK & complex scripts

**CJK breaks per character** (no spaces); line-breaking rules differ from Latin.

- `line-break: strict` enables *kinsoku* (禁則) rules: a closing bracket/punctuation mark cannot start a line; an opening bracket cannot end one. Required for correct Japanese and Chinese typesetting; the agent never sets this.
- `text-spacing-trim` / `text-autospace` (emerging) auto-space CJK glyphs adjacent to Latin characters and digits — historically done manually with thin spaces.
- `hanging-punctuation` (Safari-limited) hangs quotation marks and bullets outside the measure so the text edge stays optically flush.

**CJK font loading:**
- CJK fonts are enormous (thousands of glyphs). Subsetting and **dynamic loading** (e.g. the Google Fonts `text=` API, or a custom subset pipeline) are required — do not ship the full font.
- The `lang` attribute drives correct variant selection: `lang="zh-Hans"` vs `lang="zh-Hant"` vs `lang="ja"` may all select different glyphs for the same code point, and different line-breaking defaults.

**Input method editors (IME):** CJK, Korean, and Indic text is composed via IME — pinyin → Hanzi, romaji → Kana. The browser fires `compositionstart` / `compositionupdate` / `compositionend` events. **Never validate, search, submit, or reformat while `event.isComposing` is true** — the intermediate pinyin string mis-fires every handler. Wait for `compositionend`.

**Complex shaping (Arabic, Indic):**
- Arabic: the same code point has four contextual forms (initial / medial / final / isolated) and joins adjacent characters — per-character processing or reversal corrupts the text irreparably.
- Indic scripts (Devanagari, Tamil, etc.): vowel signs may appear visually *before* the consonant they follow in Unicode order; conjunct forms (consonant clusters) merge multiple code points into one glyph. Truncating by code point or code unit breaks the rendering.

---

## text is not a string — Unicode internals

**`string.length` lies.** It counts UTF-16 code units, not characters a user sees. Emoji (especially ZWJ sequences like 👨‍👩‍👧 or skin-tone modifiers), combining characters (e + ̈ = ë), and surrogate pairs all break length-based assumptions.

Hierarchy of text granularity:
```
byte < UTF-16 code unit < code point < grapheme cluster (what the user sees as "one character")
```

- Do not use `.substring(0, n)`, `str[i]`, or `.slice()` to cut strings — you will split a surrogate pair or a grapheme cluster in half.
- To iterate code points (better than `length`): `[...str]` or `for...of`.
- To count characters for display, truncate text, or move a cursor: **`Intl.Segmenter(locale, { granularity: 'grapheme' })`** — the only correct tool.
- `Intl.Segmenter` is also required for word and sentence segmentation in space-less scripts (Thai, Japanese) where `split(' ')` produces nothing useful.

**Normalization:** the string `"é"` can be a single code point (U+00E9, NFC) or the letter `e` followed by a combining acute accent (U+0065 U+0301, NFD) — visually identical, byte-different, and `===` returns `false`.

- Before comparison, search, or storage: `str.normalize('NFC')`.
- For search (ignore accent differences): `normalize('NFKD')` then strip combining marks.
- The convention: normalize on input, store NFC, query NFC.

**Case folding is locale-dependent:**
- Turkish: `'I'.toLowerCase()` returns `'i'` in English but should return the dotless `'ı'` in Turkish. Use `str.toLocaleLowerCase('tr')`.
- German: `ß` uppercases to `SS` (and vice-versa for case-insensitive search).
- For case-insensitive comparison, use `Intl.Collator` with `sensitivity: 'base'` rather than `toLowerCase` + `===`.

---

## the Intl arsenal — never hand-roll

The agent's failure pattern: `new Date().toLocaleDateString()` with no locale, `count + " items"`, building a number string manually. Every one of these is locale-incorrect.

```js
// Numbers, currency, percent, compact notation
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.56)
// → "1.234,56 €"

// Dates with explicit timezone
new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long', timeZone: 'Asia/Tokyo' }).format(date)

// Relative time
new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(-3, 'day')
// → "il y a 3 jours"

// List formatting
new Intl.ListFormat('zh', { style: 'long', type: 'conjunction' }).format(['A', 'B', 'C'])
// → "A、B和C"

// User-facing sort (not .sort())
new Intl.Collator('sv').compare     // ä sorts after z in Swedish, not after a

// Grapheme-safe segmentation
const seg = new Intl.Segmenter('ar', { granularity: 'grapheme' });
[...seg.segment(str)].length        // correct character count

// Plural rules
new Intl.PluralRules('pl').select(2)  // "few" (Polish: 2 = few, not "other")
```

**Dates and times — the deep traps:**
- Store timestamps as **UTC**; display in the user's local timezone.
- Use **IANA timezone names** (`America/New_York`), not fixed offsets — offsets shift with DST.
- **Never assume the date format** (US MM/DD/YYYY vs DD/MM vs ISO 8601).
- First day of week varies by locale (Sunday in US, Monday in most of Europe).
- Calendars are not universally Gregorian (Islamic, Hebrew, Japanese era, Buddhist, lunar) — `Intl.DateTimeFormat` supports all of them.
- The **Temporal API** (TC39 Stage 3) fixes `Date`'s many flaws; use a polyfill or Temporal-based library for new code.

**SSR hydration mismatch:** the server (UTC timezone, server locale) and the client (user timezone, user locale) may format the same date differently, causing React/Vue hydration errors. Fix: format on one side, or pass explicit `locale` and `timeZone` to both sides.

---

## pluralization, messages, and ICU

`count === 1 ? "item" : "items"` is wrong in most languages. Polish has four plural forms; Arabic has six; Chinese has one. Use **CLDR plural categories** via `Intl.PluralRules` or an ICU MessageFormat library:

```
English: one / other
Polish: one / few / many / other
Arabic: zero / one / two / few / many / other
Chinese: other (one form for all counts)
```

**ICU MessageFormat** handles variables, plurals, gender, and `select` in a single message string:
```
"You have {count, plural, one {# item} other {# items}} in your cart."
```

**MessageFormat 2.0** (new Unicode standard) handles harder grammar: Slavic declension (nouns change form based on grammatical role), gendered agreement, quantifier pipelines that MF1 can't express.

**Never concatenate strings:** `"Hello " + name + ", you have " + n + " new messages"` breaks in languages with different word order. Use a single parameterized message string.

**Locale detection and routing:**
- Prefer **explicit user choice > `Accept-Language` / `navigator.languages` > inferred signal**.
- Never force-redirect by IP (Google penalizes it; user experience is worse).
- Carry the locale in the URL (`/en/`, subdomain, or domain) for SEO and shareability.
- Annotate alternate-language pages with `hreflang`.
- Define a **fallback chain**: `zh-Hant-HK → zh-Hant → zh → en`.
- Lazy-load locale bundles — never ship all languages to every user.

---

## font fallback by script

A typeface that covers Latin does not cover Arabic, Cyrillic, Devanagari, or CJK. Build **per-script fallback stacks**:

```css
body {
  font-family:
    "WebFont",           /* primary: covers Latin + extended Latin */
    "Noto Sans CJK SC",  /* CJK Simplified Chinese */
    "Noto Sans Arabic",  /* Arabic */
    "Noto Sans Devanagari", /* Hindi / Sanskrit */
    system-ui,           /* OS default for any other script */
    sans-serif;
}
```

- The `lang` attribute is required for the browser's font-selection heuristics to work correctly. Set `lang` on the `<html>` element and on any sub-tree with different language content.
- For vertical text (traditional Chinese/Japanese presentation, some creative layouts): `writing-mode: vertical-rl`.
- CJK line-height may need adjustment: CJK glyphs occupy a square em, producing different vertical spacing than Latin. Arabic and Indic scripts also have distinct vertical metrics.

---

## quick reference (tokenizable / lintable)

| item | anchor |
|---|---|
| wrapping | `balance` headings / `pretty` body / `stable` editable |
| measure | `max-width: 65ch` for running text |
| alignment | `start`/`end` (logical), never `left`/`right` |
| overflow | `overflow-wrap: break-word` + `min-width: 0` on flex/grid child |
| non-breaks | `&nbsp;` for number+unit, name+title, dates, phone, brand names |
| logical CSS | `margin-inline-start`, `padding-block`, etc. — RTL mirrors for free |
| bidi | `<bdi>` / `unicode-bidi: isolate` for user-supplied mixed-direction content |
| bidi security | lint source for invisible bidi control characters (Trojan Source) |
| CJK | `line-break: strict` (kinsoku); `lang` attr; subset fonts; wait for `compositionend` |
| Arabic/Indic | do not process/truncate by code unit or code point — shaping is glyph-level |
| string length | `string.length` lies; count with `Intl.Segmenter` grapheme granularity |
| normalization | `normalize('NFC')` before compare/search/store |
| case folding | `toLocaleLowerCase(locale)` not `toLowerCase()`; `Intl.Collator` for compare |
| numbers | `Intl.NumberFormat` — never hand-roll separators or currency symbols |
| dates | store UTC + IANA zone (not offset); `Intl.DateTimeFormat`; `Temporal` API |
| plurals | CLDR categories via `Intl.PluralRules` / ICU MF — never `count===1` |
| messages | ICU MessageFormat / MF2 — never concatenate strings |
| locale | explicit > `Accept-Language`; never IP-redirect; `hreflang`; fallback chain |
| font stacks | per-script fallback; `lang` attribute mandatory |

**Cross-links:** [type-scale-and-rhythm.md](type-scale-and-rhythm.md) — `lang`-driven OpenType `locl` features and hyphenation; [the-optical-tells.md](the-optical-tells.md) — `Intl.NumberFormat` and locale-aware numeric formatting.

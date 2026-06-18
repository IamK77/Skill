# Application States and Form Visuals — encodable technique

> The technique behind layout's Stage 2 application-layer gates. Taste picks the voice, the
> visual weight, the density; the state machine then *derives* every element's appearance from
> its current state. No ad-hoc treatments — every interactive element is a designed state machine.

---

## Empty states: the three kinds and why they differ

**Empty ≠ broken.** An empty state is a designed state, not an absence of design. Three
structurally different kinds:

### 1. First-use / blank slate

The surface has never had data. This is the **retention battlefield** — the user just arrived,
has not invested, and is deciding whether to continue. The correct response is:

- A clear statement of value ("What you'll see here when...")
- An obvious primary CTA ("Create your first X")
- A preview or example of what the surface looks like when populated
- Optional: a template or sample to lower the first-action barrier

This is the most important empty state. Treat it as a conversion surface, not a gap to fill.

### 2. Cleared / completed

The user deliberately emptied the space (inbox zero, completed task list). The correct tone is
positive acknowledgment — not the same enthusiasm as the first-use state, but affirming and calm.
No CTA is needed; the user just accomplished something.

### 3. No results (filter/search)

A query returned nothing. The correct response:
- Explain *why* it is empty ("No results for 'foo'")
- Offer a clear path out: clear the filter, broaden the search, try suggestions
- Never leave the user with a dead end

**Empty state ≠ error state.** An empty state (no data) and an error state (failed to load) look
similar but communicate entirely different things. Treat them as separate states; mixing them
confuses users about whether the surface is working.

**Loading vs empty timing:** never flash the empty state while data is still loading. The sequence
is: loading skeleton → data resolves → (render data *or* render appropriate empty state). Flashing
an empty state during load tells users there is no data when there might be.

---

## Empty state anatomy

```
[illustration / icon — restrained, on-brand]
[heading — what happened, one sentence]
[support text — one sentence, not an apology]
[primary CTA — one button, clear action]
[optional secondary help link]
```

**Language:** give direction, not emotion. "Start by creating a project" is better than "Looks like
it's empty here! 🎉 Nothing to see!" The latter signals low effort and reads as AI-generated
filler. Brand voice applies; sentimentality does not.

**Illustration restraint:** one purposeful illustration or a simple icon. Multiple illustrations,
animated mascots, and full-page artwork are over-designed and slow to render. The content of the
illustration should relate to the *content type*, not be a generic "empty box" metaphor.

**Accessibility:** empty state content must be conveyed to assistive technology. A decorative
illustration alone is not sufficient; the heading and CTA must be in the DOM and focusable.

---

## Micro-interactions: the state machine for interactive elements

Every interactive element is a state machine. Design all states before shipping any:

| state | description | visual cue |
|---|---|---|
| default | resting, no interaction | baseline style |
| hover | pointer is over the element | subtle background shift, cursor change |
| active / pressed | element is being pressed | scale down ~0.97, darken slightly |
| focus | keyboard/programmatic focus | visible focus ring (dual ring preferred) |
| disabled | action unavailable | reduced opacity or muted color, `not-allowed` cursor |
| loading | action in progress | spinner inside element + disabled |
| success | action completed | checkmark, brief confirmation |
| error | action failed | error color, error icon |

**First feedback under 100ms.** The moment an interaction fires, something must visibly change.
If the system response takes longer, show a loading indicator immediately. At 100ms the user still
perceives the response as caused by their action; beyond that, the causal link breaks.

**Inline validation timing:** validate on `blur` (when the user leaves the field), not on every
keystroke. Early keystroke validation is frustrating — the user has not finished typing. "Early
reward, late penalty" is the rule: on a field that becomes valid, show the success indicator
immediately; on a field that has an error, wait until the user leaves the field or submits the form.

**Inline validation timing caveat — `blur` before `click`.** The browser fires `blur` before
`click`. This means: if the user fills a field and immediately clicks Submit, the `blur`
validation fires first, then the click. In practice this is usually fine, but if the validation
response (showing an error) momentarily shifts the layout and moves the Submit button, the click
may miss. Keep error messages inline and in-flow (not in a shifted layout) to avoid this.

**IME composition.** On mobile and CJK keyboards, users may be in the middle of an IME
composition (composing a character from keystroke sequences) when the field fires an input event.
Never run validation on `keydown` or `input` during an active composition — use the
`compositionend` event, or rely on `blur` validation which fires after composition is complete.

**Haptic feedback on mobile confirm.** On native-capable mobile browsers, a light haptic pulse on
confirm actions (destructive action confirmed, form submitted successfully) completes the tactile
feedback loop. Use the Vibration API (`navigator.vibrate(10)`) for brief confirmation pulses when
available; it is a progressive enhancement, not a requirement.

**Delight in restraint:** a success animation (a checkmark drawing itself, a brief color flash)
adds personality. Over-animation (confetti on every save, bouncing on every hover) reads as
juvenile and is accurately described as "AI-generated interface feel." The test: can you delete
the animation and lose nothing functional? If yes, the animation is decoration. Decoration is
the budget, not the default.

**Consistency:** the same interaction behaves the same way everywhere. A hover that darkens a
button here and lightens it there is incoherence. The state machine is a design token, not a
per-component decision.

---

## Form visuals: the full specification

Forms are the primary surface for user agency — they must be composed to minimize cognitive load,
not to look interesting.

### Label placement

**Top-aligned labels are the default.** They support the fastest scan (one visual axis), work
correctly when the label is longer than the input, and are mobile-friendly. Side-aligned labels
can work for short, stable labels on desktop-only forms (reduces vertical length), but require
careful handling at translation time — translated labels may be 40% longer.

**Never use placeholder text as labels.** The placeholder disappears when the user types, leaving
no label. This fails: it is inaccessible (contrast below 4.5:1 is required for accessibility),
it cannot be referenced while filling in the field, and it breaks at any value longer than the
input width. Placeholder text is for example values and format hints only.

### Layout

**Single-column flow for primary forms.** Multi-column form layouts require the eye to zigzag;
single-column keeps the reading path linear. Reserve multi-column for: side-by-side fields that
are logically inseparable (first name / last name; city / state / zip), or for forms where
reducing vertical length is a measurable UX priority.

**Input width signals content type.** A short input (zip code) signals a short value; a wide
input (address) signals a longer one. This is affordance — it communicates before the user reads
the label. Match input width to expected value length within the layout's column grid.

**Progressive disclosure** for optional or advanced fields: show them behind a "show more" or
in an expandable section. Do not show every possible field upfront.

### Full state coverage

Every form input has the same states as interactive elements (above), plus:

- **filled** — a value is present; style may differ from default to confirm state
- **readonly** — a value is present but not editable; distinct from disabled (not gray — the
  value has meaning)
- **error** — color + icon + text. Never rely on color alone for error state; an icon and text
  are required for color-blind users and for clarity.

**Error display rules:**
- Inline, adjacent to the field that has the error (not only at the top of the form)
- Specific and actionable ("Enter a valid email address" not "Invalid input")
- Preserve the user's input — do not clear the field on error
- For long forms: provide a summary at the top with anchor links to the fields in error, in
  addition to inline errors

**Required vs optional marking:** if most fields are required, mark the optional fields ("Optional").
If most are optional, mark the required fields (asterisk + legend). Marking everything with an
asterisk when everything is required adds noise without information.

### Interactive targets and density

- Input height ≥ 44px — 44×44px is WCAG 2.5.5 (Target Size Enhanced, AAA) and the Apple HIG minimum; WCAG 2.5.8 (Target Size Minimum, AA) requires only 24×24px. 48px is the Material recommendation.
- Gap between fields ≥ `space-4` (16px) — sufficient proximity grouping and sufficient separation
- Submit button visually distinct from secondary actions
- Do not disable the submit button until validation has run — allow submission, then display
  errors. Disabling the submit button preemptively creates a "trapped form" where the user cannot
  learn what is wrong.

### Accessibility checklist

- `<label for="id">` associated with every input
- Error messages: `aria-live="polite"` on the error region; `aria-describedby` on the input
  pointing to the error; `aria-invalid="true"` on the input when in error state
- Grouped fields: `<fieldset>` + `<legend>` for radio groups, checkbox groups, and related fields
- Focus management: after form submission (success or error), move focus to the appropriate
  element (the success message, or the first error, or the heading of the error summary)
- `font-size: 16px` minimum on mobile inputs to prevent iOS auto-zoom on focus

---

## Layout-level state design

Application-layer states are not just for empty states and forms — they apply to every surface
region that has more than one possible state:

| region type | states to design |
|---|---|
| Data list / table | loading · empty (no data) · populated · filtered-empty · error |
| Dashboard widget | loading · data · stale · error · no-permission |
| Form | default · submitting · success · error |
| Navigation item | default · active · hover · disabled |
| Modal / sheet | opening · open · closing |

The agent's default is to design the "happy path" (populated, default, open) and leave all other
states as accidental or missing. Designing the state machine first — naming every state and its
visual treatment before writing the component — is the professional practice.

**Loading states:** skeleton screens (shapes that match the content's layout) are preferable to
spinners for content areas, because they communicate the *shape* of the incoming content and
reduce the perceived load time. Spinners are appropriate for actions (submitting a form, saving).

**Error states in content regions:** distinguish "failed to load" from "no data" — they require
different language and different actions. A "failed to load" state needs a retry affordance; a
"no data" state needs a creation affordance or a help link. Mixing them is a UX failure.

# Design-to-Code Handoff Without Drift

> Drift is the default. The design file moves; the code does not. Or the code
> ships a shortcut; the design does not know. The system stays in sync not by
> heroic communication but by structural contracts — a known boundary, a known
> change channel, and a CI step that catches divergence before it lands.

---

## The contract: what design hands to code

Handoff is not a Figma export and a Slack message. It is a **structured diff**:
what changed in the token taxonomy, what changed in the component API, what
new patterns are needed, and what the acceptance criteria are.

**The four things design hands to code:**

1. **Token changes** — new or modified values in the taxonomy (color, type,
   space, radius, motion). These are not "use this blue" — they are a PR to
   the token source. The designer proposes; the token audit in CI accepts.
2. **Component API changes** — new props, renamed component tokens, new
   composition slots, new stability-tier promotions. These are specced with
   the component's existing API language, not a screenshot.
3. **New patterns** — a new `EmptyState` or `OnboardingFlow`. Handed off as
   a Storybook story spec: states (empty, loading, error, populated), each
   state's token usage, accessibility contract (roles, keyboard, ARIA), and
   the acceptance criterion (which Storybook story, which visual-regression
   baseline).
4. **Acceptance criteria** — what "done" means, in terms the system can verify:
   a passing Storybook story, a passing `axe-core` run, a visual-regression
   diff below threshold, no literal in the token audit.

**The anti-pattern:** a Figma link, a comment "match this", and no discussion
of what changes in the system. This leaves the engineer to re-derive the
system decisions from a screenshot — re-deriving is re-inventing, and re-inventing
is the first step of drift.

---

## The audit that catches drift

Drift enters through one of four channels. The audit watches all four.

**Channel 1: Literal values in component source.**

```bash
# catch hex / rgb / hsl literals in component source
grep -rE '(#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|oklch\()' src/components/ \
  --include='*.tsx' --include='*.css' | grep -v 'tokens\|palette\|__tests__'
```

A match that is not in the token files is a literal that escaped the system.
Run this in CI; fail the build on new matches.

**Channel 2: Cross-language duplication (the two-source trap).**

Collect all token values from the CSS source. Collect all color/spacing values
from `.ts`/`.js`. Normalize (lowercase hex, px→number). Find near-duplicates
across the two sets — same value in two languages is a second source of truth.
Token sync tools (Style Dictionary, Theo) automate this; a custom script can
do the same for simpler stacks.

**Channel 3: Component tokens that exist in one theme but not the other.**

Every component token declared in the light theme must have a value in the
dark theme (either explicit or inherited via the semantic alias). A token with
no dark-theme value triggers IACVT and silently falls back to the property's
initial value — typically black or transparent, which is wrong.

```bash
# rough parity check: same token set in both theme blocks
tokens_light=$(grep -o '\-\-[a-z][a-z0-9-]*' tokens/light.css | sort -u)
tokens_dark=$(grep -o '\-\-[a-z][a-z0-9-]*' tokens/dark.css | sort -u)
diff <(echo "$tokens_light") <(echo "$tokens_dark")
```

**Channel 4: Visual regression against Storybook baselines.**

Chromatic / Percy runs on every PR. The comparison is against the committed
baseline — a visual diff that exceeds the threshold requires explicit human
approval. This catches the case where a token change has a correct audit trail
but an unintended visual side-effect (a component that looked fine in isolation
now reads wrong in context).

**Drift detection is not a one-time audit.** It runs in CI on every PR. The
design system stays in sync structurally, not by scheduling a quarterly review.

---

## Style Dictionary: one source generates many outputs

**Style Dictionary** (Amazon) is the canonical tool for the "one JS/JSON source
generates multiple platform outputs" pattern. It takes token definitions in JSON
or JS, applies transforms and formats, and outputs CSS custom properties, iOS
Swift, Android Kotlin, Figma tokens, and any other target — all from one source.

```json
// tokens/color.json
{
  "color": {
    "primary": { "value": "oklch(0.62 0.18 250)", "type": "color" }
  }
}
```

```js
// style-dictionary.config.js
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      files: [{ destination: 'dist/tokens.css', format: 'css/variables' }]
    },
    js: {
      transformGroup: 'js',
      files: [{ destination: 'dist/tokens.js', format: 'javascript/module' }]
    }
  }
};
```

The output `tokens.css` is the CSS layer; `tokens.js` is the JS module.
Neither is hand-maintained. The input JSON is the one source.

**When the stack is Tailwind:** the Style Dictionary output feeds `tailwind.config.js`
`theme.extend`. The config is generated, not hand-typed; arbitrary values are
banned because the config has everything.

**When the stack is CSS-in-JS (vanilla-extract):** the JS output feeds the
`createTheme` / `createThemeContract`; the CSS output feeds the fallback layer
for server-side rendering. Same source, two generated consumers.

---

## The sync loop: how the system stays current

Design → token PR → token source review → CI audit → merge → generated
outputs update → consumers see the new value on next build.

The loop has three invariants:

1. **No token change bypasses the PR.** Not a hotfix, not "I'll clean it up
   later." Every value in the system comes from a reviewed commit.
2. **Generated outputs are never hand-edited.** If `dist/tokens.css` is
   hand-edited, the next build overwrites it. Commit a `.gitignore`-ish
   warning; better, auto-generate in CI and never commit the outputs at all
   (treat them as build artifacts).
3. **The Figma plugin reads; it does not write.** The Figma token plugin
   (Tokens Studio or similar) is wired to the token source in read mode.
   Designers see the current token values in Figma. To propose a change,
   they open a PR — not a Figma edit that flows the wrong direction.

---

## The seam to `surface:bulwark`

`bulwark` enforces the system at 1→N — the PR review pass that catches drift
before it merges. Its gate is only meaningful when the system has structure
to enforce: a known token taxonomy, known component APIs, and a CI audit
that surfaces violations automatically.

`systems` builds that structure. `bulwark` runs on top of it.

The handoff from `systems` to `bulwark`: once the token architecture is in
place, the living library is generating its documentation, and the CI audit
is catching literals and cross-language duplicates — hand the boundary
enforcement to `bulwark`. The design system protects itself structurally;
`bulwark` catches what slips through.

---

## Checklist: is the system actually in sync?

Run before any major release or design review:

- [ ] Token source is one file / one package — no hand-maintained duplicates in CSS and JS.
- [ ] Generated CSS custom properties match the token source exactly (diff the outputs).
- [ ] Every component token exists in both light and dark theme.
- [ ] No literal values in component source (CI audit passing).
- [ ] No cross-language duplicates (token sync audit passing).
- [ ] Storybook visual-regression baselines are current (no unapproved diffs).
- [ ] Figma token plugin is reading from the source, not authoring it.
- [ ] Style Dictionary (or equivalent) is the only writer of generated outputs.
- [ ] Deprecation notices are in place for any renamed or removed tokens.

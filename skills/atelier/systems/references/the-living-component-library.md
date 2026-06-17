# The Living Component Library — Primitives, Patterns, and Self-Documentation

> A component library is not a Figma file and a set of screenshots in a Notion doc.
> It is a running artifact: the components are the source, the documentation is
> generated from the source, and the gap between "what design says" and "what code
> does" is structurally zero, not maintained by discipline.

---

## The hierarchy: primitives → compositions → patterns

**Primitives** own one responsibility: a token-consuming atom that carries no
opinion about layout or context. `Button`, `Badge`, `Input`, `Icon`. A primitive
surface is fully described by the token taxonomy — no literal values anywhere.
It exposes a small, explicit component token API (`--button-bg`, `--button-radius`)
that downstream can override without touching internals.

**Compositions** assemble primitives into a predictable unit: `FormField` (label +
input + error message), `CardHeader`, `DataRow`. The rule: a composition composes
primitives; it does not reimplement them. If a composition needs to override a
primitive's visual behavior, it uses that primitive's component token API, not a
new CSS rule on the same element.

**Patterns** are complete, reusable UI solutions: `SearchCombobox`, `DataTable`,
`EmptyState`, `NotificationBanner`. They may contain business logic and
accessibility contracts. They are the reference implementation of a design decision —
the place where "how should we handle an empty list?" is answered once.

**The cut rule:** anything that appears in three or more places is a composition or
pattern candidate. Anything below that threshold might be local. The test: can a
new engineer use it correctly from the documentation alone, without reading the
source? If not, it is not ready to be a pattern.

---

## Composition over configuration

A component with twenty boolean props is a pattern trying to be a primitive.
The agent era amplifies this: an agent generating a component will add a prop
for every variation it can imagine, producing `<Button variant="..." size="..."
iconLeft="..." iconRight="..." loading fullWidth pill ghost disabled>` —
each boolean a branch, the combinations unmaintainable.

The discipline:

**Replace boolean explosions with composition slots.** `<Button>` takes children
and an optional `icon` slot; it does not take `iconLeft` and `iconRight` as props.
The consumer composes what they need. The component stays simple.

**Replace variant enumerations with token overrides where the variation is
visual.** A dark-section button is `<Button>` inside `.dark-section {}` that
re-points `--button-bg`; it is not `<Button variant="dark">`. Variant enumerations
belong only to *semantically distinct* roles: `<Button intent="primary|secondary|danger">`.

**Primitives are stable; compositions and patterns iterate.** Lock the primitive
API. Let patterns evolve. A breaking change to `Button`'s API cascades everywhere;
a breaking change to `SearchCombobox` is local.

---

## The system documents itself

A living library generates its documentation from the component source — it does not
maintain separate docs that drift.

**What this means in practice:**

- **Storybook / Ladle / Histoire** — each component has stories that are the
  canonical example. The story is not a screenshot; it is running code. `chromatic`
  or `percy` visual-regression tests run against the stories; a component change
  that alters appearance fails CI before it reaches main.
- **Auto-generated prop tables** — TypeScript types + JSDoc → prop documentation
  with no copy-paste. The component's `@property` component tokens appear in the
  table via `@property` registration (the type is machine-readable).
- **Accessibility contracts in the stories** — `axe-core` / `jest-axe` in the
  story test; the story drives the contract. A missing `aria-label` fails the test.
- **Token usage surfaced** — a token audit step in CI reports which component
  tokens each story uses; a literal in a story fails the run.

**The invariant:** the documented state is the built state. If the docs say
`--button-bg` is the override hook and the source doesn't expose it, the doc is
wrong — but since docs are generated from source, the discrepancy surfaces
immediately, not at a quarterly design review.

---

## Versioning and the stability contract

**Semantic versioning applies to the component API.** Breaking changes — prop
renames, removed tokens, changed DOM structure — are major versions. Non-breaking
additions are minor. The changelog entry for a major version names every consumer
affected; a migration guide or codemod is the default.

**Deprecation before removal.** A prop or token marked deprecated fires a
console.warn in dev; stays in the build for one major version cycle; removed
in the next. Consumers have a window.

**The stability tiers:**
- **Stable (locked)** — primitives with complete stories, visual-regression
  coverage, and at least three real-world uses. Breaking changes require a major
  version.
- **Beta** — compositions and patterns in use but without full coverage.
  API may change with a minor version bump and a changelog entry.
- **Experimental** — new patterns, not yet in production. API is unstable;
  consume at your own risk. Clearly labeled in the documentation.

Communicate tier in the component's JSDoc / Storybook `status` tag. The tier
is not a signal of quality — it is a signal of API stability.

---

## The Figma ↔ code relationship

Figma is **not** the source of truth for the system. The component library is.
Figma is a design-exploration tool; the component library is the shipped artifact.
When they diverge, code wins — and the design file is updated to match, not
the other way around.

**What this means for handoff:**

- Design tokens are defined in code (or the single source feeding both). The
  Figma token plugin reads from the source; it does not author it. A designer
  who edits a token in Figma triggers a PR in the token source, not a Figma
  auto-sync that overwrites code.
- Component specs in Figma reference the component token API — the designer
  documents overrides via component tokens, not arbitrary color fills. This
  is the only channel into the system.
- New components start in Figma as explorations. They graduate to code by
  following the stability lifecycle: experimental → beta → stable.
  "The Figma component is done" is not graduation; "the Storybook story has
  visual-regression coverage" is.

**The seam to `surface:bulwark`:** bulwark enforces at 1→N — the design review
process that prevents drift from re-entering through PRs. The living library
is the artifact bulwark protects; its gates are the pre-condition for bulwark's
enforcement pass to be meaningful.

---

## Anti-patterns

- **Stories as screenshots** — a static PNG next to source code does not catch
  regressions. Running stories do.
- **Prop explosion** — a component with twelve boolean flags. Decompose.
- **The "just override with a className" escape hatch** — once you CSS-override
  a primitive from outside, you own two sources of its styling. Expose component
  tokens; make the override official.
- **Figma as source of truth** — design files drift; code is what ships.
- **Skipping the stability tier** — shipping an experimental component as stable,
  then being unable to break its API without a major version.
- **Undocumented component tokens** — a token consumers *can* override, but that
  is not in the prop table. The API is what is documented, not what is possible.

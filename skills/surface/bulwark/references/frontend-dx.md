# Frontend DX — Tooling and Automation That Fossilizes Good Practice

The goal of Frontend DX is not just convenience — it is enforcement. Every technique here either makes the right thing the easy thing, or makes the wrong thing fail loudly before it ships. A healthy codebase stays healthy because the architecture itself resists entropy.

---

## Type Safety at Boundaries

Typed component APIs are the first enforcement layer. Props carry precise types; **discriminated unions model variants** so illegal combinations are rejected at compile time — a `Button` cannot simultaneously be `loading` and `href`. Required vs. optional is explicit. Components are type contracts.

Never use `any`; it erodes the entire chain. Accept `unknown` at untrusted boundaries and narrow explicitly.

**Type-safe routing and params**: typed route definitions (React Router v6 `createBrowserRouter` + typed params, TanStack Router, Next.js typed routes) so a mistyped path segment is a compile error.

**Typed design tokens**: `theme.color.primary` autocompletes; a typo is a type error. Achieve with vanilla-extract, CSS Modules + generated type files, or typed Tailwind (`tailwind-merge` + typed class utilities).

**Generic reusable components**: `<Table<T>>`, `<Select<T>>` — the generic is the contract.

**End-to-end type safety**: tRPC or API codegen (openapi-typescript, graphql-codegen) pipes server types into components without manual duplication. Combine with Zod at every external boundary for runtime validation that matches the TypeScript type.

**CSS type gap**: CSS has no types by default. Close it with CSS Modules (run `typed-css-modules` to emit `.d.ts`), vanilla-extract (TypeScript-first CSS-in-TS), or typed Tailwind class collections.

---

## Component Testing Philosophy

**Test behavior, not implementation.** Query by role, label, or visible text — never by CSS class, test ID, or internal state. This is the exact dividing line between brittle tests and durable tests.

**Testing Trophy** (Kent C. Dodds): lean heavily on integration/component tests, light on pure unit tests, narrow E2E smoke layer on top. The component layer gives the best cost-to-confidence ratio for frontend work.

**React Testing Library pattern**: render → `userEvent` (prefer over `fireEvent` for realistic interaction) → assert on accessible output. Do not assert on internal state, implementation details, or third-party library internals.

**What not to test**: internal component state, lifecycle method calls, third-party library behavior, trivial markup with no logic.

**MSW (Mock Service Worker)** intercepts at the network layer, not the module layer. Handlers are reused across test / dev / Storybook contexts. This is the modern standard; avoid `jest.mock('fetch')` or manual axios/fetch mocking.

**Querying forces accessible markup**: `getByRole('button', { name: /submit/i })` will fail if the button has no accessible name — the test and a11y improve together. Run `jest-axe` assertions inside component tests to catch a11y violations programmatically.

---

## Visual Regression

Functional tests cannot see visual bugs. Screenshot diffing is a **frontend-exclusive test dimension** that catches unintended rendering changes.

**Tools**: Chromatic (Storybook-native, cloud-based), Percy, Playwright `toHaveScreenshot`. Integrate into CI so visual diffs block merge until approved.

**Stabilization against flakiness**:
- Freeze time (mock `Date`, CSS `animation-play-state: paused`).
- Disable CSS transitions and animations in test mode (`prefers-reduced-motion: reduce` via test setup).
- Pin font rendering, fix viewport size, fix OS rendering (use consistent Docker/VM environment).
- Use threshold tolerances for sub-pixel antialiasing differences.

**Cross-browser and device matrix**: run visual snapshots against a browser matrix (Chromium/Firefox/WebKit via Playwright) and at multiple viewport breakpoints.

---

## Storybook and Component-Driven Development

Build components in isolation first, then compose. A Story is a documented, reproducible component state.

**Cover every state**: default, loading, error, empty, overflow/long text, RTL, dark mode, disabled, focused, with tooltip open. This forces you to design every state before it reaches production.

Storybook multiplexes as: living documentation, visual test surface (Chromatic integration), a11y audit surface (storybook-addon-a11y), interaction test runner (`@storybook/addon-interactions` with `play` functions), and design-to-dev handoff reference.

Use `play` functions for interaction tests inside Storybook — they run with Testing Library queries, bridging component tests and visual review in one place.

---

## Design System and Component Library Engineering

**Composition over configuration** is the governing principle. A `<Select><Option/></Select>` composite component is better than `<Select options={[...]} renderOption={...} />` — it is extensible without API changes.

**Polymorphism**: `asChild` (Radix UI pattern) delegates rendering to a child element while keeping behavior; slot APIs for layout primitives. Support both controlled and uncontrolled usage with sensible defaults.

**Headless / unstyled primitives** (Radix UI, React Aria, Headless UI, Ariakit) handle behavior and accessibility; you apply styles. This decouples a11y correctness from visual design — never implement keyboard patterns and ARIA management manually when a headless library already did it.

**Style Dictionary token pipeline**: design tokens live as JSON/YAML source, Style Dictionary emits platform-specific outputs (CSS custom properties, JS/TS, iOS, Android). Multi-brand and multi-theme support falls out naturally. Use oklch color space for perceptually uniform palette generation and P3 gamut.

**Versioning**: component libraries use semver strictly. Breaking changes require a major bump. Provide a **codemod** (`jscodeshift` or `ts-morph`) for every breaking rename or API change — manual migration at scale fails. Deprecation paths must be explicit and documented.

**Documentation**: prop tables generated from TypeScript types (Storybook Autodocs, TypeDoc). Every component entry has: usage example, do/don't, a11y notes, keyboard behavior summary.

**Distribution**: ship ESM + CJS + TypeScript declaration files. Ensure tree-shakeable exports (`"sideEffects": false` in package.json). Handle CSS: CSS Modules, PostCSS, or CSS-in-JS — document the consumer setup. Declare `peerDependencies` correctly; never bundle React.

**Consistency enforcement via lint**: write ESLint rules (or use `eslint-plugin-no-restricted-imports`) to ban raw CSS hex values and enforce token usage, ban direct `<div onClick>` patterns, ban `z-index` magic numbers.

---

## Component Architecture and Colocation

**No prop explosion**: a component with 20+ boolean props has been designed wrong. Refactor with composition — render slots, compound components, or component variants via `cva` (class-variance-authority).

**Logic into hooks**: custom hooks isolate stateful and side-effectful logic from rendering; components stay presentational and testable without business logic setup.

**Colocation**: keep `Component.tsx`, `Component.module.css`, `Component.test.tsx`, and `Component.stories.tsx` together in one directory. Flat per-type directories (`components/`, `hooks/`, `utils/`) do not scale past ~30 files.

**Feature folders**: organize by domain/feature, not by technical type. `features/checkout/` contains its components, hooks, API calls, and tests together.

**Avoid prop drilling**: pass data through context or composition. But **do not overuse context** — every context update re-renders all consumers. Reach for Zustand, Jotai, or colocated state before making something global.

Data flows down via props; events flow up via callbacks. This is not optional — it is the primitive you enforce to make components reusable.

---

## Build Tooling and HMR

**Vite** is the current baseline for new projects: native ESM dev server, esbuild-powered transforms, Rollup-based production bundling, sub-50ms HMR for most changes. Configure `resolve.alias` to enforce clean import paths.

**HMR fast-path matters**: slow HMR (>500ms) kills flow. Keep dependencies in `optimizeDeps.include`. Avoid large barrel files (`index.ts` that re-exports 200 symbols) — they blow up HMR granularity.

**Bundle analysis**: `rollup-plugin-visualizer` or `vite-bundle-visualizer` in CI. Set size budgets (`bundlesize` or Vite's `build.chunkSizeWarningLimit`). A 3 kB utility that pulls in a 40 kB transitive dependency is caught here.

**Code splitting**: route-level dynamic `import()` is the minimum. Component-level splitting for anything not in the critical render path. `React.lazy` + `Suspense` boundaries.

**Tree shaking**: requires ESM throughout. Audit with `webpack-bundle-analyzer` or `twiggy` for dead code. `"sideEffects": false` in library packages enables aggressive shaking.

---

## TypeScript Config and Strictness

Strict mode is not optional for a maintainable codebase:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

`noUncheckedIndexedAccess` is the single highest-value addition beyond `strict` — it forces null checks on every array/object index access, catching a large class of runtime errors.

**Path aliases**: define in both `tsconfig.json` (`paths`) and the bundler (`vite resolve.alias`). Keep them in sync with a script or use a plugin (`vite-tsconfig-paths`).

**Project references** for monorepos: `composite: true` enables incremental builds and explicit dependency graphs between packages.

**`isolatedModules: true`**: required for esbuild/SWC transpilation compatibility. Catches type-only imports that need `import type`.

---

## Linting, Formatting, Static Analysis

**ESLint with frontend-specific plugins**:
- `eslint-plugin-react-hooks`: `exhaustive-deps` is mandatory — missing dependency array entries cause stale closures.
- `eslint-plugin-jsx-a11y`: accessibility violations as lint errors, not runtime surprises.
- `eslint-plugin-import` or `eslint-plugin-simple-import-sort`: enforce import ordering and no circular deps.
- `@typescript-eslint/recommended-type-checked`: type-aware lint rules that catch logic errors TypeScript alone misses.

**Biome** as a unified alternative: 10–20× faster than ESLint + Prettier, single binary, handles lint + format. Good for greenfield or when ESLint plugin ecosystem isn't needed.

**Prettier**: format on save, format in CI, no debates. Use `.editorconfig` for editor-agnostic baseline.

**Stylelint** for CSS/SCSS: enforce no magic numbers, enforce token usage via `declaration-property-value-allowed-list`.

**`lint-staged` + `husky`**: run only on staged files pre-commit. Full lint on CI, fast targeted lint locally. Never run the full lint suite in the pre-commit hook — it kills velocity.

---

## Monorepo and Workspace Tooling

**Package manager workspaces**: pnpm workspaces (recommended — strict linking, disk-efficient), Yarn Berry workspaces, or npm workspaces. Define shared configs (`eslint-config-*`, `tsconfig-base`) as internal packages.

**Turborepo**: task graph with file-hash-based caching. Define `pipeline` (now `tasks`) in `turbo.json` — `build` depends on upstream `build`, `test` is independent. Remote cache (Vercel or self-hosted) makes CI hits near-zero for unchanged packages.

**Nx** alternative: more opinionated, stronger code generation, affected graph for partial CI runs. Preferred when you have many app-level projects.

**Enforce package boundaries**: `@nx/enforce-module-boundaries` or custom ESLint `no-restricted-imports` rules. `features/` packages must not import from other `features/` packages directly — go through shared `libs/`.

**Internal package versioning**: use fixed versioning (all packages share a version) for tightly-coupled monorepos; independent versioning with Changesets (`@changesets/cli`) for publishable libraries.

---

## CI/CD Gates

Every merge to main passes this gate — no exceptions:

1. **Type check** (`tsc --noEmit`): zero errors.
2. **Lint** (`eslint`, `stylelint`): zero warnings in error-level rules.
3. **Format check** (`prettier --check`): diff fails the build.
4. **Unit + component tests** with coverage threshold.
5. **Visual regression** (Chromatic / Playwright snapshots): no unreviewed diffs.
6. **Bundle size check**: size budgets enforced per route chunk and total initial JS.
7. **a11y automated scan** (`axe-core` via Playwright or Storybook): zero violations on critical flows.

**Preview deployments** (Vercel / Netlify / Cloudflare Pages): every PR gets a live URL. Design review and QA happen on preview, not staging.

**Dependency security scan**: `npm audit` or `socket.dev` in CI. Block on high-severity vulnerabilities.

---

## Dependency Hygiene

**`depcheck`**: finds unused dependencies and missing explicit deps (things you use but rely on hoisting).

**`syncpack`**: enforces consistent versions of the same package across monorepo workspaces — version drift causes dual-bundle bugs.

**`npm audit` / `socket.dev`**: catch known CVEs and supply-chain risk (suspicious new packages, permission changes).

**Major version upgrades**: automate with Renovate Bot or Dependabot. Configure grouping (all `@radix-ui/*` together), automerge for patch/minor, manual review for major. Pin major versions explicitly in `package.json` — never use `*`.

**Peer dependency discipline**: if your library requires React 18, declare `peerDependencies: { "react": ">=18" }` — do not bundle React, do not put it in `dependencies`.

---

## Reactivity Model Awareness

DX includes knowing where performance traps live so you do not reach for the wrong tool.

**Know your framework's update model**: React re-renders components on state change (VDOM diff); Solid/Vue 3 track fine-grained signal dependencies; Svelte 5 uses a compiler-driven reactive graph. The update model determines where optimization applies and what profiling tools matter.

**React re-render rules**: a component re-renders when its state or props change, or when its parent re-renders. Common bugs: missing key prop, context updates causing wide re-renders, derived state held in state instead of computed inline.

**Do not premature-memo**: `React.memo`, `useMemo`, `useCallback` add overhead. Measure before wrapping. Memoization is only useful when a child's referential equality matters (passing to `React.memo` children or as effect deps) or when computation is genuinely expensive. Wrapping every component and every callback is anti-DX.

**"You probably don't need an effect"**: data transformation belongs in render, not effects. Fetching belongs in a data-fetching library (TanStack Query, SWR, RSC). Effects that sync external state are correct uses; effects that derive state from state are almost always wrong and create update cycles.

**RSC server/client boundary**: in Next.js App Router, components default to server; `"use client"` marks the boundary. Data fetching, DB access, and server-only secrets stay in Server Components. Event handlers and hooks (`useState`, `useEffect`) require client components. Misplacing this boundary leaks server code to the client bundle or breaks hydration.

---

## Frontend Observability

**Sentry** (or equivalent): captures client-side errors with full stacktraces. Critical requirement: **ship source maps to Sentry** (not to the public CDN) — without them, minified stacks are useless. Configure `Sentry.init` with `dsn`, `release`, and `environment`. Use `ErrorBoundary` component to catch render errors and report with component tree context.

**RUM and Web Vitals**: report LCP, CLS, FID/INP, TTFB from real users. Use `web-vitals` library + custom analytics endpoint or Datadog RUM. Field data diverges from lab data; both matter.

**Session replay** (LogRocket, Sentry Replay, FullStory): captures DOM mutations + network for reproduction. Invaluable for bugs that only appear in production on specific user paths. Configure PII scrubbing rules before enabling.

**Feature flags / experiments**: LaunchDarkly, GrowthBook, or Statsig. Client SDK evaluates flags; no redeploy to toggle. Wrap unfinished features in flags — this decouples deploy from release. Type the flag keys.

---

## The Enforcement Mindset

DX is not about comfort — it is about making accidental wrongness structurally impossible:

- A type error at compile time costs 5 seconds. A production bug costs hours and user trust.
- A lint rule that bans raw color values is enforced forever at zero ongoing cost.
- A CI gate that rejects visual regressions catches CSS bugs that no functional test would find.
- A codemod that migrates a breaking API change means no one is left behind on the old version.

The pattern repeats: **encode the decision once, enforce it automatically, remove the option to ignore it.** That is what keeps a frontend architecture healthy at scale.

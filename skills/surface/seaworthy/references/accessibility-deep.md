# Accessibility, Deep — Hard Bones: ARIA Patterns, Focus Architecture, Live Regions & AT Realities

The basics doc covers the semantic-HTML ladder and the unplug-the-mouse gate. This reference is the layer beneath: where rules break in practice, what specs don't tell you about AT behavior, and how to implement patterns that have no native-element shortcut.

---

## The Accessibility Tree

The browser builds a second tree from semantic HTML + ARIA alongside the render tree. AT reads **only** this tree. Inspect it: Chrome DevTools → Accessibility panel → full-page tree. ARIA modifies this tree — it adds semantics, **never behavior.** `role="button"` does not make an element focusable, does not wire `Enter`/`Space`. Every ARIA pattern requires you to implement the keyboard model yourself; native elements give it for free.

---

## ARIA Rules and Accessible Name Computation

**Five rules (enforcement order):**
1. Use native HTML in preference to ARIA roles/attributes.
2. Do not change native semantics (`<h2 role="tab">` → wrong).
3. All interactive ARIA controls must be keyboard operable.
4. Never use `role="presentation"` or `aria-hidden="true"` on a focusable element.
5. Every interactive element must have an accessible name.

**Accessible name priority:** `aria-labelledby` → `aria-label` → native `<label>` / element content → `title` → `placeholder`

Critical bugs:
- `<button aria-label="Submit">Submit</button>` — `aria-label` overrides content text; omit the label when visible content already names the control.
- `aria-describedby` supplements (announces after name); `aria-labelledby` replaces. Use `aria-describedby` for hint text only.
- **Static ARIA that never updates** is the most common ARIA bug. `aria-expanded`, `aria-checked`, `aria-selected`, `aria-pressed`, `aria-current`, `aria-invalid`, `aria-busy` must be wired to actual component state — not hardcoded attributes.
- `aria-hidden="true"` on a focusable element or a container holding focusable descendants: keyboard users still reach it; AT announces nothing. Banned pattern.

---

## Focus Architecture

### tabindex discipline
- `tabindex="0"` — joins natural tab order at DOM position.
- `tabindex="-1"` — removed from tab order, programmatically focusable via `.focus()`. Use for dialog containers, error summaries, skip-link targets, roving-tabindex non-active items.
- **`tabindex` > 0 is banned.** It overrides tab order globally, with no valid production use.

**Focus order = DOM order.** CSS `order`, `flex-direction: row-reverse`, `grid-template-areas`, `position: absolute` reorder paint, not Tab. Keep DOM order matching reading order.

**`:focus-visible`:** never write `outline: none` without a replacement. Use `:focus-visible` to show the ring only on keyboard navigation; provide a 2px solid ring with offset (or `box-shadow` double-ring) so it's visible against any background. WCAG 2.2 §2.4.11 requires minimum indicator area and contrast.

### Focus trap (modal / dialog)
1. On open → move focus to first focusable element inside, or the dialog container (`tabindex="-1"`).
2. While open → Tab/Shift+Tab cycle within the dialog's focusable descendants only.
3. On close → return focus to the **trigger element**. Focus lost to `<body>` is a defect.
4. Background → set `inert` on everything outside (preferred over `aria-hidden` alone — `inert` removes subtrees from both tab order and the accessibility tree simultaneously). `aria-modal="true"` signals AT to ignore background; pair it with `inert` for behavior.

Native `<dialog>.showModal()` handles trap and backdrop `inert` automatically. Use it when possible.

### Roving tabindex (composite widgets)
One item in the group holds `tabindex="0"`; all others hold `tabindex="-1"`. On arrow key: set previous item to `-1`, new item to `0`, call `.focus()` on new. Tab moves into/out of the group; arrow keys navigate within. Home/End jump to first/last (required by APG for toolbars, tab lists, grids).

### `aria-activedescendant` (alternative focus model)
Focus stays on the container; `aria-activedescendant` references the active descendant. AT announces the referenced element. Use for: combobox (focus stays on `<input>`, attribute tracks highlighted option), search result grids, trees with large item counts. Constraint: the referenced element must exist in the DOM (not virtualized/windowed).

### SPA route changes
A full-page navigation moves focus and announces the title. A client-side route change does neither by default. After every transition:
1. Move focus to the new view's `<h1>` or a skip-target (`tabindex="-1"`).
2. Announce via a `aria-live="polite"` region updated with the new page title.
3. Scroll to top.
Frameworks do not do this automatically — implement a `RouteChangeAnnouncer` component or use a router with built-in focus management (e.g., `@reach/router`).

### Focus after async changes
- Error summary appears → move focus to its container (`tabindex="-1"`, `.focus()`).
- Dialog closes after async action → focus returns to trigger; if trigger is gone, fall back to nearest logical container.
- Toast / notification → do **not** move focus. Announce via live region. Stealing focus for non-modal overlays is disruptive.

---

## Live Regions

| Attribute / Role | Behavior | Use for |
|---|---|---|
| `aria-live="polite"` / `role="status"` | Queues after current AT activity | Search result counts, autosave confirmation, step progress |
| `aria-live="assertive"` / `role="alert"` | Interrupts immediately | Critical errors, session timeout, destructive confirmations |
| `aria-atomic="true"` | Re-reads entire region on any change | Short status messages where partial re-reads confuse |
| `aria-busy="true"` | Defers AT announcement until removed | Loading/replacing container contents |

**The pre-existence gotcha (most-missed):** the live region element must exist in the DOM *before* content is injected. Inserting `<div role="alert">Error</div>` from nothing typically fires no announcement. Correct pattern:

```html
<!-- present on page load, initially empty -->
<div role="status" aria-live="polite" aria-atomic="true"></div>
<!-- later: -->
statusEl.textContent = "3 results found";
```

For repeated updates: clear → `setTimeout(0)` → set. Some AT+browser combos require one frame between clear and update to re-fire the announcement.

---

## AT Realities: Cross-Matrix Behavior

Same markup, different output across combinations:

| Combination | Notes |
|---|---|
| NVDA + Firefox | Most spec-accurate; reference for `aria-activedescendant` |
| JAWS + Chrome | Most common enterprise/government; distinct browse-mode behavior |
| VoiceOver + Safari (macOS) | Rotor (headings/landmarks/links/form controls); some live region quirks |
| VoiceOver + Safari (iOS) | Swipe navigation; double-tap activates; custom actions API |
| TalkBack + Chrome (Android) | Swipe navigation; explore by touch |

Check **a11ysupport.io** before relying on a specific ARIA attribute or role. "ARIA should support X" ≠ "this AT announces X."

**Browse mode vs. forms/focus mode:** NVDA and JAWS use a virtual cursor in browse mode; switch to forms mode for interactive elements. Arrow keys in browse mode navigate content; in forms mode they may navigate within a control. Combobox implementations use `role="combobox"` + `aria-activedescendant` to signal AT to enter forms mode, preventing AT from intercepting `ArrowDown` before the widget handles it.

**VoiceOver rotor:** VO users navigate by headings, landmarks, links, form controls, tables — not only Tab. Broken heading hierarchy and missing landmark regions are rotor-navigation failures, not keyboard-walk failures.

**Voice control (Dragon, macOS Voice Control):** WCAG 2.5.3 — the accessible name must *contain* the visible label text. `aria-label="Submit order"` on a button with visible text "Place order" breaks voice activation for both phrases.

---

## Complex Widgets (APG Patterns)

These have no native HTML equivalent. Follow the WAI-ARIA APG keyboard models exactly — any deviation breaks AT expectations.

**Combobox / autocomplete** (most complex):
```html
<input role="combobox" aria-expanded="true" aria-controls="lb"
       aria-activedescendant="opt-2" aria-autocomplete="list" autocomplete="off" />
<ul role="listbox" id="lb">
  <li role="option" id="opt-1" aria-selected="false">Paris</li>
  <li role="option" id="opt-2" aria-selected="true">Prague</li>
</ul>
```
Keys: `ArrowDown/Up` move highlight (update `aria-activedescendant`), `Enter` selects, `Escape` closes + restores value, `Home/End` first/last. `aria-selected="true"` on highlighted option, `"false"` on others (never absent).

**Dialog:** `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to heading. Esc closes, returns focus to trigger.

**Grid:** `role="grid"` → `role="row"` → `role="gridcell"`. Arrow keys navigate 2D; Tab moves to the grid boundary. `aria-sort` on header cells. Roving tabindex across cells.

**Tree:** `role="tree"` → `role="treeitem"` + `aria-expanded` on branch nodes. `ArrowRight` expands / enters children; `ArrowLeft` collapses / returns to parent; `ArrowDown/Up` navigate visible items. `aria-level`, `aria-setsize`, `aria-posinset` for hierarchy context.

**Tabs:** `role="tablist"` → `role="tab"` (with `aria-selected`) + `role="tabpanel"` (with `aria-labelledby` pointing to its tab). Arrow keys between tabs; Tab moves into panel.

**Use headless libraries** (Radix UI, React Aria, Headless UI, Ariakit) that have been tested against the matrix. You must still understand the underlying pattern — a wrong prop or a broken role hierarchy silently breaks AT behavior.

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Use `0.01ms` not `0` — preserves JS `animationend` events while making motion imperceptible. Covers WCAG 2.3.3 (AAA) and vestibular/epilepsy safety. Retain functional state changes (expand/collapse, show/hide) — remove decoration, not information.

---

## Hard Domains: Canvas, Data Visualization, Drag-and-Drop

**Canvas / WebGL** — no semantic DOM; AT sees an opaque element:
- Fallback content inside `<canvas>` is read by some AT; make it meaningful.
- Parallel accessible DOM: a hidden-but-accessible subtree mirroring interactive canvas elements as real DOM nodes with roles and handlers.
- **Use SVG instead when possible** — SVG is DOM-native; `<title>`, `<desc>`, `role`, `aria-label`, `tabindex` all work; inline SVG participates in the accessibility tree.

**Data visualization:**
- Provide an underlying `<table>` with the raw data — the chart is an enhancement.
- Write a text summary describing the trend/finding (not just "bar chart of sales").
- Keyboard-navigable data points with AT announcement of value on focus.
- Never use color as the only encoding channel (shape, pattern, or text label required).

**Drag and drop:** `aria-grabbed` is deprecated — do not use it. Required keyboard alternative:
1. Select item (`Enter`/`Space`), move with arrow keys, drop with `Enter`/`Space`.
2. Live region announces current position: "Item moved to position 3 of 7."
3. `Escape` cancels and returns item to origin, announces "Cancelled."

---

## Mobile Screen Readers

VoiceOver (iOS) and TalkBack (Android) use swipe-based navigation — Tab order is irrelevant. Swipe right/left moves sequentially; double-tap activates.

- Touch target minimum: **44×44 CSS px** (WCAG 2.2 §2.5.5 / §2.5.8); 48×48 dp on Android.
- `aria-label` is the primary labeling mechanism; visible text labels are especially critical for voice control.
- **VoiceOver Rotor** (twist gesture): cycles navigation modes (headings, links, form controls, landmarks). Broken structure is discovered here.
- **Custom actions (iOS VoiceOver):** expose non-obvious gestures to AT. On web: prefer explicit buttons over gesture-only interactions; use `aria-label` to describe what the action does.
- TalkBack "explore by touch": hovering reads elements on contact; `aria-label` must describe the action, not just the element type.

---

## Testing Matrix

Automated tools (axe-core, Lighthouse, eslint-plugin-jsx-a11y) catch ~30% of issues — missing labels, contrast failures, obvious role errors. They cannot detect: sensible focus order, trap behavior, live region announcement timing, AT-specific rendering, cognitive clarity.

**Minimum manual matrix per key-path component:**

| Test | Catches |
|---|---|
| Keyboard-only walk (unplug mouse) | Tab order, traps, reachability, focus-after-action |
| VoiceOver + Safari (macOS) + NVDA + Firefox | Role/name/state announcement, live regions, browse mode |
| VoiceOver + Safari (iOS) | Swipe navigation, touch targets, rotor |
| Browser zoom 200% | Layout reflow, text truncation, focus ring visibility |
| Browser zoom 400% | WCAG 2.1 §1.4.10 reflow — no horizontal scroll at 320px equivalent |
| OS reduced-motion preference | Animations disabled, functional changes preserved |

**Involve disabled users.** Automated + developer testing finds implementation bugs. Only users who navigate by screen reader, keyboard, or switch access daily can validate whether the experience actually works.

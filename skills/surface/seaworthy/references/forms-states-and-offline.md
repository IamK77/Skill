# Forms, States & Offline — Engineering the Unhappy Path

> Three domains that converge on one truth: the product _is_ the failure state. Validation errors, empty lists, dropped connections, and stale caches are not edge cases — they are the primary surface area where trust is won or lost.

---

## 1. Form Engineering Foundations

**Native-first, JS-enhanced.** Use `<form>` and native elements. The platform gives you submission, constraint validation, autofill, accessibility, keyboard, and Enter-to-submit for free. SPAs routinely discard this; resilient forms degrade to a plain POST.

**Constraint Validation API.**
- Attributes: `required`, `type`, `min`/`max`/`step`, `minlength`/`maxlength`, `pattern`
- JS surface: `validity` object, `setCustomValidity()`, `reportValidity()`
- CSS hooks: `:valid`, `:invalid`, `:user-invalid` (fires only after user interaction — encodes "reward early, punish late" natively)

**Input type + `inputmode` pairing.** `type` controls semantics and mobile keyboard; `inputmode` overrides keyboard without changing semantics — use `inputmode="numeric"` on `type="text"` for OTP/postal codes to keep paste/autofill intact.

**`enterkeyhint`** labels the Return key: `go`, `search`, `send`, `next`, `done` — one attribute, zero JS.

**`autocomplete` tokens — the highest-ROI attribute agents skip.**
`email`, `current-password`, `new-password`, `one-time-code` (triggers SMS OTP autofill on iOS/Android), `cc-number`, `tel`, address tokens (`address-line1`, `postal-code`, etc.). Missing tokens silently kill autofill and assistive-technology workflows.

**`<button>` default is `type="submit`"** — any bare `<button>` inside a `<form>` triggers submission. Explicit `type="button"` for everything else. Use `formaction`/`formmethod` to override per-button.

---

## 2. Validation Strategy & Timing

**Reward early, punish late.** On first interaction with a field: no validation until blur or submit. Once a field has an error: switch to real-time (keystroke) validation so the error clears as the user fixes it. `:user-invalid` in CSS encodes this without JS.

**Async validation (username availability, email uniqueness):**
- Debounce (300–500 ms) before firing the request
- Show a loading indicator during the check
- Handle race conditions — ignore responses for stale values (compare against current input on receipt)
- Never block form submission on a pending async check; treat timeout as "proceed, let server decide"

**Client-side + server-side, always.** Client validation is UX; server validation is security and truth. Mirror the rules. Never trust the client.

**Error messages must be:** specific and actionable ("Must be 8+ characters, include one number" not "Invalid"), attached to the field that failed, preserved in the input (never clear on error), and conveyed in text — not color alone.

**Error summary for long forms:** render a summary at the top listing all errors with anchor links to each field. On submit failure, move focus to the summary (or to the first errored field). This is both a11y and UX — sighted users miss inline errors when the form is long.

---

## 3. State Management: Controlled vs. Uncontrolled

**Controlled** (value + onChange): full real-time access to input state; enables per-keystroke validation; cost is re-render on every keystroke and boilerplate.

**Uncontrolled** (defaultValue + ref / native): simpler; read values at submit time. `FormData` reads the entire form in one call — closer to the platform, works well with server actions and progressive enhancement. Libraries like React Hook Form use uncontrolled inputs internally to eliminate re-renders.

**Track these states explicitly:** `dirty` (any field changed), `touched` (field visited), `pristine`, `isSubmitting`, `isSubmitSuccessful`. Derive UI from them rather than ad-hoc booleans.

**Submission lock — prevent double-submit.** Disable the submit button and show a loading state the moment submission fires. Re-enable on success or error. This is distinct from disabling when the form is invalid — that anti-pattern hides which fields are wrong and forces users to guess.

**Dependent/conditional fields, field arrays.** Register and unregister fields as sections appear/disappear. Preserve values across toggling so data survives UI state changes.

---

## 4. Submission Lifecycle

1. Validate client-side; bail early with focus on first error
2. Lock submit (disable + spinner)
3. Send request (fetch, intercepting native submit for progressive enhancement)
4. On network error: show recoverable message, **preserve all entered data**
5. On server validation error: map field errors back to individual fields via `aria-describedby`; surface a summary
6. On success: give feedback, redirect or inline confirmation, optionally reset

**Never clear the form on error.** Data loss on submission failure is a trust-destroying failure mode.

**Idempotency.** Server endpoints for form submissions should tolerate duplicate requests (idempotency keys for payments/critical mutations). The client-side lock handles the happy path; the server handles network retries.

---

## 5. Specific Form Patterns

**Password fields.** Show/hide toggle (eye icon with accessible label); `autocomplete="new-password"` on registration, `current-password"` on login; list requirements and tick them off in real time (not only on error); **allow paste** — blocking paste is a security anti-pattern (users paste from password managers).

**OTP.** `autocomplete="one-time-code"` + `inputmode="numeric"`. Single input box is more accessible than a per-digit split input (avoids focus-management complexity and clipboard paste breakage).

**Multi-step / wizard.** Show step progress indicator; validate per-step before advancing; preserve values when going back; manage focus on step transition (move to heading or first field of new step); animate the transition directionally so the user understands spatial movement.

**Auto-save / draft.** Debounce writes (1–2 s after last keystroke); show "Saved" confirmation optimistically; queue the save if offline (see §9). Never lose partially-entered data on session timeout — warn before expiry.

**File upload.** Support both drag-drop and click-to-browse; validate type and size client-side before upload; show per-file progress; allow cancellation; provide preview for images. Style `::file-selector-button` for branded appearance without replacing the native input.

**Phone / card number fields.** Format as user types for readability, but input must not break paste or `autocomplete` token resolution. Accept both formatted and raw values on the server.

---

## 6. Form Accessibility — the Non-Negotiable Checklist

- Every input has a visible `<label>` linked via `for`/`id` or wrapping — no exceptions. `aria-label` only as a last resort (invisible to sighted users).
- **Never use `placeholder` as a label.** Placeholder disappears on input, has insufficient contrast, cannot be referenced, and fails screen readers. Use it only for format hints (`e.g. YYYY-MM-DD`).
- Error state: `aria-invalid="true"` on the input + `aria-describedby` pointing to the error message element + place the message in an `aria-live="polite"` region (or move focus to it).
- Required fields: `required` attribute (also satisfies `aria-required`); mark optional fields when most are required, or mark required when most are optional — not both.
- Group related inputs with `<fieldset>` + `<legend>` (radio groups, address blocks, date components).
- Touch targets ≥ 44 × 44 px; field spacing follows proximity grouping.
- `font-size ≥ 16px` on inputs prevents iOS from zooming on focus.
- Full keyboard navigation; no keyboard traps; custom widgets get full ARIA roles + keyboard patterns (combobox, listbox, etc.).

## 6b. Security & Ethics

**Security surface.** Server validates and sanitizes everything — client validation is UX, not a security boundary. Add CSRF tokens to all state-changing submissions. Escape output before rendering any user-supplied value back into the DOM (never `innerHTML` from user input). Rate-limit submissions and consider honeypot fields over CAPTCHA (invisible trap field; bots fill it, humans don't). Log nothing sensitive; transmit over HTTPS; use the right `type` so browsers don't cache passwords.

**Ethics.** Only ask for fields that are genuinely necessary — every field is friction and a privacy cost. No dark patterns: no pre-ticked consent checkboxes, no confirmshaming (cancel buttons that read "No, I want to stay poor"), no buried opt-outs. Defaults must be honest.

---

## 7. App-Level Composition

### Layout & Visual Hierarchy

Every composition needs **one clear primary element** — established through size > weight > contrast > position > whitespace/isolation. Pages that feel flat have equal visual weight everywhere.

**Grid + breakout:** build the grid for order, then let one element span columns deliberately. The grid is the rule; the breakout is the accent. **Scan paths:** F-pattern for text-heavy pages, Z-pattern for sparse ones — put CTAs on the path. **Optical center** sits slightly above geometric center. **Density rhythm:** alternate dense and open zones; uniform density reads as monotonous. **Asymmetric balance:** large + low-contrast paired against small + high-contrast signals dynamism; symmetry signals stability.

### Microinteractions

Every interactive element is a state machine: `default → hover → active (micro-shrink) → focus (visible ring) → loading (inline spinner + disabled) → success (checkmark) → error → disabled`.

**Saffer's anatomy:** trigger → rules → feedback → loops/modes. First feedback under 100 ms. Optimistic feedback for low-risk mutations; revert on failure. `prefers-reduced-motion`: provide non-animated equivalents. Delight is a seasoning — excessive celebration degrades perceived quality. Haptic feedback on mobile where supported. Consistency: the same interaction behaves identically everywhere.

---

## 8. Empty, Loading & Error States as Product

These are not edge cases — they are the product during onboarding, slow connections, and failure.

**Three distinct empty-state types — do not conflate:**

**1. First-use / blank slate.** User has never created data. Retention battleground. Provide: headline (what this space is for) + primary CTA (one obvious action) + supporting sentence + optional template/preview. The most important empty state.

**2. Empty after clearing** (inbox zero). Positive, calm language. The user succeeded.

**3. No results (search/filter).** Explain why + one-click escape (clear filters) + alternatives. Never show a generic blank.

**Error empty ≠ empty state.** Failed data load = error state with retry — not an illustration with a CTA.

**Anatomy:** restrained on-brand illustration + clear heading + one supporting sentence + primary CTA + optional help. Voice: give direction, not emotion. Never blank `<div>`, never pity-bait, never vague CTA.

**Timing:** do not flash the empty state while data is still loading — resolve loading first, then conditionally render empty. A skeleton that flips to empty within 200 ms is worse than a longer skeleton.

**Accessibility:** decorative illustrations get `aria-hidden`; meaningful content needs accessible text. CTAs must be keyboard-reachable.

---

## 9. Offline / PWA

### Mental model: the network is a spectrum

Not "online vs offline" — slow, intermittent, lie-fi (interface connected, no actual throughput), high latency, dropped mid-request. Design across the entire spectrum. **Resilience over features.**

### Service Worker

A Service Worker (SW) is a programmable network proxy running in a background thread, independent of any page. It intercepts fetch requests and can serve from cache, enabling offline operation.

**Lifecycle:** `register → install (cache app shell) → activate (clean old caches) → idle/fetch intercept`. New SW versions go through: install in background → wait (old SW still active) → activate on next navigation. `skipWaiting()` forces immediate activation but risks resource mismatch mid-session; a user-visible "Reload for update" prompt is safer.

**Pitfalls:**
- Scope: a SW only controls pages under its registered path
- Requires HTTPS (localhost exempted)
- The page load that registers the SW is not controlled by it — add `clients.claim()` if needed
- **Do not hand-write SW cache logic — use Workbox** (handles strategies, precaching, expiry, versioning, and most failure modes)

### Cache Strategies

| Resource type | Strategy | Rationale |
|---|---|---|
| Hashed static assets (JS/CSS bundles) | Cache First, fallback to network | Immutable by content hash; network is unnecessary overhead |
| HTML / navigation / API responses | Network First, fallback to cache | Must be fresh; stale fallback is better than nothing |
| Images, fonts, infrequent API data | Stale-While-Revalidate | Serve immediately, refresh in background |
| Auth-sensitive endpoints | Network Only | Never serve stale credentials |

**Precache the app shell** (HTML skeleton, critical CSS, entry JS) so the app loads instantly and works offline. Set `maxEntries` and `maxAgeSeconds` on every runtime cache — unbounded caches balloon storage and cause eviction.

### Offline UX

- **Custom offline fallback page** registered as a navigation fallback — never show the browser's dinosaur
- **`navigator.onLine` is unreliable** (detects network interface, not actual connectivity — lie-fi reads as online). Combine with real `fetch` probes to confirm reachability
- `online`/`offline` events update a status indicator in the UI — make the sync state legible ("Saved locally, will sync when connected")
- **Queue mutations offline.** Let users write/edit while disconnected; enqueue changes; sync on reconnect. Never silently discard entered data
- **Optimistic UI** for queued actions; clearly communicate pending-sync state

### Background Sync

`BackgroundSync` API: register a sync tag on a failed POST; the SW retries it when connectivity returns — even if the page is closed. Use case: send message, submit form, log event while offline.

**Support is Chromium-only** — always build a foreground fallback (retry on next page open). Do not design a flow that requires background sync to complete.

`PeriodicBackgroundSync` for content refresh is further gated (requires installed PWA + engagement threshold). Treat as progressive enhancement only.

### Storage Layer

| Store | Use case | Limit / Notes |
|---|---|---|
| Cache Storage | Network responses (SW cache) | Per-origin quota; evictable |
| IndexedDB | App data, offline queue, structured documents | Large; async; transactional. Use `idb` or `Dexie` — raw API is hostile |
| localStorage | Tiny, non-sensitive, synchronous UI prefs | 5 MB; blocks main thread; never for offline-critical data |
| OPFS | Large files, browser-side SQLite (wa-sqlite) | Emerging; opaque to the user |

`navigator.storage.estimate()` to check quota. Call `navigator.storage.persist()` to request persistent storage — prevents the browser from evicting your data under disk pressure (the browser prompts or auto-grants based on engagement heuristics).

### PWA Installability & Manifest

Minimum install requirements: valid `manifest.json` + active SW with fetch handler + HTTPS + engagement signals. Customize the install prompt via `beforeinstallprompt` — defer it, surface it in context (not on first load).

**Manifest fields that matter:** `name`, `short_name`, `icons` (at minimum 192 px and 512 px), `start_url`, `scope`, `display` (`standalone` hides browser chrome), `theme_color`, `background_color`. Add `shortcuts` for quick actions on the home screen icon long-press.

**Post-install capabilities (Chromium):** App Badging (`navigator.setAppBadge(count)`), Share Target, File Handling, Window Controls Overlay.

**iOS reality check:** Safari's PWA support is partial and historically behind — manual "Add to Home Screen" is the only install path; push notifications only recently supported; some APIs absent. **Test on a real iOS device.** Do not assume Chromium behavior translates.

### Updates & Version Management

- Version cache names (e.g. `v2-static`); in the SW `activate` event, delete all caches not in the current version list
- Never aggressively cache HTML without an update path — a misconfigured SW can lock users on a stale version indefinitely
- Always provide an escape hatch: a visible "Update available — reload" prompt, or at minimum a cache-clearing mechanism in settings
- `skipWaiting` + `clientsClaim` combo activates new SW immediately; only safe for atomic deploys where all assets update together

### Testing & Debugging

- DevTools Application tab: SW status, Cache Storage contents, IndexedDB inspector, Manifest validation
- Toggle offline in DevTools Network tab to test fallback behavior
- Lighthouse PWA audit for installability and offline criteria
- **Test the update flow explicitly** — it is the most common source of production SW bugs
- **Test on real iOS hardware** — simulator does not reproduce Safari PWA quirks

---

## 10. Quick-Reference Checklist

| Domain | Must-have |
|---|---|
| Form base | Native `<form>`, constraint validation, degrades without JS |
| Input semantics | Correct `type` + `inputmode` + `enterkeyhint` |
| Autofill | `autocomplete` tokens esp. `one-time-code`, `new-password`, `cc-number` |
| Labels | Every input has `<label>`; `placeholder` is never a label |
| Validation timing | blur-first; real-time once error exists; `:user-invalid` |
| Dual validation | Client (UX) + server (truth) — never trust client |
| Error UX | `aria-invalid` + `aria-describedby` + live region; specific text; preserve input |
| Submit lock | Disable on submit; never disable on invalidity |
| Failure recovery | Preserve all data; map server errors to fields |
| Focus management | Move to first error on submit failure; manage focus on step change |
| Passwords | Show/hide; allow paste; real-time requirement checklist |
| Security | Server validates everything; CSRF tokens; escape output; rate-limit; honeypot > CAPTCHA |
| Ethics | Ask only what's needed; no pre-ticked consent, no confirmshaming, honest defaults |
| Layout | One primary element; grid + intentional breakout; scan-path placement |
| Microinteractions | All states explicit; first feedback < 100 ms; reduced-motion fallback |
| Empty states | First-use = retention; error ≠ empty; no flash during load |
| SW | Use Workbox; HTTPS; scope; update strategy with escape hatch |
| Cache strategy | Hash → cache-first; HTML/API → network-first; SWR for mid-tier |
| Offline detection | `navigator.onLine` + fetch probe; communicate sync state |
| Storage | IndexedDB via idb/Dexie for offline data; `storage.persist()` |
| Background Sync | Chromium only; always build foreground fallback |
| PWA install | Manifest + icons + `beforeinstallprompt` in context; test real iOS |
| SW updates | Version caches; clear old on activate; prompt reload; escape hatch |

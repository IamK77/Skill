# Product Sense — the visual that serves the user's actual job

> Design is not decoration applied to a working surface. The visual language is
> choice architecture: it directs attention, implies priority, and shapes behavior.
> A brief that is internally coherent but fights the user's job is wrong in kind.
> This reference encodes the technique for stress-testing a design direction against
> reality — the user's JTBD, the surface's long tail, the device spectrum, and the
> ethics of choice architecture.

---

## design is not the feature, the job is the feature

The frontend engineer who receives "add a dropdown" is receiving a guess at a solution. The job-to-be-done is the thing the user is actually trying to accomplish — and it is almost always different from the stated feature request. The same principle applies to design: "make it look premium" is a guess at the solution; the actual job is something like "help the user trust this enough to enter their credit card" or "help the user find the error in 200 rows of data in under 10 seconds."

**Before a design direction is finalized, state the JTBD.** Not "a trading dashboard" but "a professional who monitors 12 positions simultaneously and needs to detect an anomaly in under 3 seconds." That statement rules out: editorial-weight typography (slow to scan), expressive motion (distraction), airy spacing (wastes information density). The brief is now not just a style — it is a constraint derived from a job.

---

## the all-states obligation

The agent designs the happy path — the screen with data, the user who succeeded, the name that fits in one line, the number that is neither zero nor one million. This is not a complete design. A brief that only works for the ideal fill is a sketch.

**Verify every brief against the long tail:**

- **Empty / zero-data / first-run.** A new user with no records sees the empty state first. This is the onboarding moment — the visual language must carry meaning even with no content. The brief must work on a screen that is 80% blank.

- **Loading.** Skeleton screens, progress indicators, optimistic updates. The typography and density grade must be consistent across the loaded and loading states — a skeleton that does not match the loaded geometry creates a layout-shift moment that reads as broken.

- **Error.** Error messages are product moments. The brief's typographic hierarchy must handle an error clearly — is the type scale legible for error prose? does the semantic red read clearly against the surface? does the action (retry, contact support) have clear affordance?

- **Overflow.** A name with 80 characters. A table row with 12 columns on a 375px screen. An error message that wraps to four lines. `text-overflow: ellipsis` is not a design; it is a deferral. The brief must specify what happens.

- **Edge numerics.** 0 items. 10,000 items. A metric of 0.001. A percentage of 100.0%. The type scale and density grade must survive the full numeric range of the actual data, not just the screenshot-friendly middle.

- **Permissions / missing data.** A user who cannot see a column. A record with null fields. A section that requires a feature the user has not enabled. The visual language must carry these states without breaking hierarchy.

**Design all of these states, not as exceptions, but as first-class members of the brief.** The brief is not complete until the long tail is confirmed.

---

## the surface diversity reality check

The developer's MacBook on fast Wi-Fi with a mouse is the least representative surface for most web products. The non-default insight: there is no "average" surface. Designing for your development machine is a bias, not a baseline.

**Three dimensions of surface diversity that every brief must verify:**

**Input modality.** Touch targets ≥ 44×44px — already in the quantified targets, but verify the brief does not require hover-only interactions. A tooltip that is the only place a label appears is inaccessible on touch. Keyboard operability: can the primary JTBD be completed without a mouse? If the archetype is tool or dashboard and the user is a power user, keyboard shortcuts may be more important than mouse-hover polish.

**Device capability and network.** A marketing surface with a 500ms signature motion animation on a low-end Android device on a slow connection is not "premium" — it is broken. The motion budget must survive the least-capable device in the realistic user base. For marketing surfaces: the expressive motion applies to capable devices; the brief names the fallback (reduced or none) for `Save-Data` and low-power mode. For tool/dashboard surfaces: this matters less for motion (budget is already near-zero) and more for data-loading skeletons and optimistic updates.

**Accessibility surface diversity.** Three non-default cases the brief must verify:
- **`forced-colors` / Windows High Contrast Mode.** The OS overrides the color system. The visual language must not rely on color-only encoding; every semantic color must be backed by a redundant signal (icon, label, position). Verify the brief holds in forced-colors by asking: does the hierarchy survive without the designed colors?
- **`prefers-contrast: more`.** Some users require higher contrast than the WCAG floor. The brief's contrast targets must include whether an enhanced-contrast mode is supported.
- **`prefers-reduced-motion`.** Already in the motion budget; the brief must confirm that a no-motion version of the surface is designed, not just the motion stripped out (a re-tuned experience, not a broken one).

---

## defaults are decisions (and they belong to the user)

The brief establishes the visual hierarchy — which element is primary, which is secondary, where the eye goes first. That hierarchy is not neutral. It reflects a set of priorities. In a well-designed surface, those priorities align with the user's job. In a poorly designed one (or a manipulative one), they serve a conversion funnel instead.

**Two IA principles that affect the brief directly:**

- **Progressive disclosure.** Show the common case; hide the complex in "advanced." A brief that shows all options simultaneously has not made a hierarchy decision — it has deferred it, and the visual system will have to fake one with size and color, which always reads worse than a structural choice. The brief specifies what is primary (visible), secondary (one level down), and advanced (expert-only path).

- **`undo` over confirmation dialog.** Friction for destructive actions is necessary; a confirmation dialog is one implementation. A better one is reversibility (undo, soft-delete, restore from trash) — it removes friction from the happy path while still protecting the user. The brief specifies, for each destructive action: is this confirmed (irreversible → add friction) or reversible (→ reduce friction, provide undo)?

**Three defaults that must be verified to serve the user:**

- **Visual weight and primary action.** The element with the most visual weight (largest, most contrast, most color saturation) implies "this is what you should do." Verify: is that element the user's primary JTBD, or is it a commercial priority dressed as a user priority?

- **Friction.** The brief specifies where friction is intentional (destructive actions — delete, cancel subscription, irreversible changes) and where it has been removed (the happy path, the primary JTBD). An interface with friction on the core flow and none on the exit is a manipulative interface, regardless of how beautiful it is.

- **Information architecture matches the mental model.** The visual hierarchy implies a structural hierarchy — this section is more important than that one, this label explains this control. Verify that the IA matches how the user thinks about their work (their mental model), not how the data is structured in the database or how the organization's teams are divided.

---

## restraint as product craft

Every element added to a surface has a cost: development time, maintenance, cognitive load on the user, accessibility and internationalization surface area. The non-default is restraint.

**The two failure modes:**

- **Over-building.** A feature that solves a problem three users have while adding cognitive load to the other ninety-seven. A visual embellishment that signals "we care about design" to the designer but is invisible or distracting to the user. An animation that looks good in the design review and fires every 30 seconds during actual use.

- **Under-finishing.** The empty state that was never designed. The error message that says "Error 500." The loading state that is a spinner with no spatial relationship to the content it is loading. These are not "minor details" — they are the moments where trust is built or lost.

The brief is complete when both failures have been audited: the surface has nothing it should not have, and nothing it should have is missing.

---

## ethics: the choice architecture is yours

The visual language is a choice architecture. It directs attention. It implies urgency. It can manufacture FOMO. It can make the exit harder to find than the purchase. These are design decisions, and they are ethical decisions.

**Non-default choices in ethics:**

- **Honest defaults.** A default pre-selected option is the decision most users make. Verify: does the default serve the user, or the business? Pre-selected consent checkboxes are an ethical failure regardless of whether they are legal in the jurisdiction.

- **No dark patterns.** The canonical list: confirmshaming (a decline option written to induce shame); fake urgency ("only 2 left!" when there are 200); roach motel (easy to enter, hard to exit); misdirection (a visual hierarchy that guides the eye away from the action the user intended); disguised ads; forced continuity (a trial that auto-charges with no reminder). Verify the brief does not require any of these.

- **Accessibility is not a compliance checkbox.** An inaccessible feature excludes users — it is a product decision that says "these users are not our users." The brief must account for the excluded users.

- **Long-term vs short-term engagement.** A/B tests optimize for the measured metric. Verify: is the metric aligned with user value, or with a number that can be moved by manipulation? An interface that maximizes click-through by manufacturing anxiety is measurably "better" by the metric and measurably worse for the user.

---

*Cross-links: [non-default-and-quantified.md](non-default-and-quantified.md) — the quantified targets that make the brief enforceable; [surface-archetypes.md](surface-archetypes.md) — the archetype constraints that the product-sense check stress-tests.*

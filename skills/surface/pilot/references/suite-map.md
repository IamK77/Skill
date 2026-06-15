# The Surface Suite — Map, Entry Stage, Disambiguation, and Sequences

This is the depth behind `pilot`'s routing. The SKILL.md gives the one-screen pipeline and the router; this file gives each stage's role in full, the **entry-stage decision** (the call that matters most for a lifecycle suite), the sharp distinctions for the calls people confuse, and ready-made sequences. Open it when a route isn't obvious from the table — a multi-stage job, a close call, a cross-suite redirect, or a "where do I even start."

---

## The pipeline-not-flat-list model

Hold `surface` as a *roughly ordered lifecycle*, not ten interchangeable lenses:

- **The order is real but not strict.** Greenfield walks it front to back: bearings → keel → wellspring → seaworthy → trials → lookout → bulwark. Each stage hands the next a concrete artifact (bearings' five tables → keel's skeleton → wellspring's state map → seaworthy's slices → trials' suite → lookout's instruments → bulwark's enforced boundaries).
- **But you rarely start at the front.** Real frontend work arrives mid-stream — a running app with a state swamp, a feature that breaks ugly, a brittle test suite. So the single most valuable routing move is **naming the entry stage**, not reciting the pipeline.
- **The membrane is the through-line, not a stage.** Every stage sits on the boundary between machine and mind; the judgment calls that live there (which boundary, whose source of truth, the causal story, whose interest the optimizer serves) are the user's, at every stage. `pilot` routes; it never makes those calls.

Most routing errors here come from forcing a mid-stream task back to stage 0, or absorbing a concern that belongs to a sibling suite (general code craft, distributed correctness). When you route, name the entry stage and check the scope.

---

## Per-stage roles — what each owns, and what it does NOT

- **bearings** — *the brutal-to-reverse decisions, before code.* Models the user's mental model (not the database), fixes the network/trust boundary and the source-of-truth one-way doors, writes the perception contract (latency tiers → architecture constraints), sets the objective function and guardrails before a dashboard exists. **Does not** build anything, or do the full state classification (that's wellspring) — it pins the *table* and the consistency model.
- **keel** — *does it run end-to-end.* The walking skeleton: one real-but-trivial deployed slice that pierces every integration seam (auth, data, hydration, the state round-trip, deploy, config), with a contract generated from one source so types can't drift. **Does not** build features or architect state — it proves the pipeline connects.
- **wellspring** — *where each piece of state lives.* The heart: classify every piece of state into the bucket that owns it (derived / server-cache / URL / shared-client / local), minimize the source of truth, model the implicit state machine, wire data along the dependency graph not the component tree. **Does not** own the one-way-door consistency decision (bearings) or general module boundaries (engineering:load-bearing).
- **seaworthy** — *what happens when it breaks.* Build each feature unhappy-path-first: the loading/error/empty/edge states as the product, illusion-maintenance (optimistic UI + rollback, causal animation), accessibility, and a CI-enforced perception/perf budget. **Does not** design the test suite (trials) or do field monitoring (lookout) — it enforces the *pre-ship* budget.
- **trials** — *is the test a net or a straitjacket.* Frontend correctness: test observable behavior not internal structure, spend the budget at integration (the testing trophy, not the pyramid), mock only the network with a contract-true mock, prune what doesn't earn its keep, prove the suite can go red. **Does not** own general test-design theory (engineering:assay) — it's the frontend dialect.
- **lookout** — *what the optimizer is doing to the user.* Delivery + observability: preview-per-PR, progressive rollout, RUM (field, not lab), error tracking — and the pre-launch objective-function **ethics gate** with declared guardrails and a kill-switch. **Does not** own general ops (engineering:stationkeeping) or security (aegis/gungnir) — it owns the frontend-and-product-ethics half.
- **bulwark** — *what holds the architecture against entropy.* 1→N (a steady state, no exit): boundaries fossilized into lint and fitness functions, wrong abstractions pruned, module edges aligned to team edges (Conway), the design system kept a living artifact, read by the newcomer-ships-in-days metric. **Does not** own general maintenance craft (engineering:husbandry) — it's the frontend dialect (feature isolation, the state-classification rules, the two-graph drift).

---

## The entry-stage decision — where to start, given what exists

Run down this list; the first match is the entry stage.

- **Nothing built yet / "should we even build this, and how"** → **bearings**.
- **Decisions made, but no code proven end-to-end / "it works on my machine, not in prod" / hydration or contract pain** → **keel**.
- **A running skeleton, but state is a swamp / out-of-sync bugs / a giant global store / prop-drilling / flag-soup** → **wellspring**. *(The most common real entry point.)*
- **State is sane, but features break ugly / no loading-error-empty handling / it feels janky / not accessible** → **seaworthy**.
- **Features work, but the test suite is brittle / breaks on every refactor / no confidence** → **trials**.
- **About to ship / running an A/B test / unsure which metric to optimize / worried it's manipulative** → **lookout**.
- **It's live and rotting as it grows / boundaries eroding / onboarding takes weeks / abstractions piling up** → **bulwark**.

If two match, start at the *earliest* — an upstream gap usually causes the downstream symptom (brittle tests are often a state-classification problem; jank is often a missing perception contract).

---

## Disambiguation — the calls people confuse

A sharp question for each. When two skills both seem to fit, ask the question; it picks one.

- **bearings vs wellspring** — *Is the question what the source of truth IS and how consistent it must be, or how to CLASSIFY and minimize all the state?* The source-of-truth table, the consistency model (the one-way door), the trust boundary → **bearings**. The full bucket classification, the duplicate-fact audit, the state machine, the two-graph data flow → **wellspring**. bearings pins the door; wellspring builds the room.
- **seaworthy vs lookout** — *Is "slow / perf" a pre-ship budget or a real-user field signal?* The CI-enforced perception budget, no-blank-on-refetch, skeleton dimensions, the four states → **seaworthy** (before ship). Field RUM, real-user Web Vitals, error spikes by release → **lookout** (after ship). Same metrics (LCP/INP/CLS), two sides of the deploy line.
- **trials vs engineering:assay** — *Is this frontend behavior testing, or general test-design craft?* The testing trophy, testing-library behavior tests, network-boundary mocking, the four-states-as-cases → **trials**. The general risk-driven what-to-test decision, test-double theory, a non-UI test → **engineering:assay**. Same family; `trials` is the frontend dialect — for the general craft or a backend test, point to `assay`.
- **wellspring vs engineering:load-bearing** — *Is the boundary a frontend-state question or a general module/service one?* State buckets, the two graphs, the component-API escape-hatch → **wellspring**. Service boundaries, the data model, monolith-vs-services, the contract across a network seam → **engineering:load-bearing**. Same words (boundaries, coupling) at two different scales.
- **surface vs engineering:plumb** — *Is the question "is this good frontend architecture" or "is this good code"?* State, illusion, perception, perf, ethics → **surface**. Naming, function shape, smells, earned abstraction, over-engineering *inside a module* → **engineering:plumb**. A React component usually wants both: `wellspring`/`seaworthy` for its architecture, `plumb` for its code craft.

---

## Ready-made sequences — common task shapes

Hand off the **entry** step; state the rest as the chain. Each stage flies its own and hands back.

- **"Build me a frontend / new UI" (greenfield, vague):**
  bearings (the five one-way-door decisions) → keel (prove it runs end-to-end) → wellspring (state architecture) → seaworthy (build each feature, unhappy-path-first) → trials (behavior tests) → lookout (ship + the ethics gate) → bulwark (once it's live and growing). *Skip any stage the weight class doesn't earn — a small feature on a healthy codebase may be just wellspring-lite → seaworthy.*

- **"I inherited a messy frontend / where do I even start":**
  keel AUDIT (does it run end-to-end; is there a contract, a preview deploy, error tracking?) → wellspring (is state classified, or is the store a swamp with stored derivatives?) → seaworthy (do features handle loading/error/empty, or only the happy path?) → trials (are the tests a net, or do they break on every refactor?). Start with keel+wellspring because jank and brittle tests are usually downstream symptoms of an unproven pipeline and un-classified state.

- **"Make this production-ready and ethical":**
  seaworthy (the unhappy paths + the perf budget) → trials (behavior tests that survive refactor) → lookout (RUM + error tracking + the pre-launch objective-function ethics gate with guardrails and a kill-switch). Security is a separate concern → **engineering:aegis** then **gungnir**.

- **"It feels janky / slow":**
  bearings (is there a perception contract — is this interaction mis-tiered, asked to wait on a network round-trip when it should be optimistic?) → seaworthy (the perf budget in CI, no-blank-on-refetch, skeleton dimensions, main-thread budget) → lookout (is the *field* RUM telling a different story than the lab?). Don't optimize before the contract says what "instant" means here.

- **"My state is a mess / out-of-sync bugs everywhere":**
  wellspring, almost always — classify the state, run the duplicate-fact audit, read the store-size thermometer, collapse the flag-soup into a machine. If the out-of-sync is *across machines/users* (realtime, collaboration), the *correctness* of that is **distributed:holdfast**, not a frontend-state question.

- **"This is really a backend / distributed / general-code task":**
  Out of the surface suite. General code craft → **engineering:plumb**; general architecture → **engineering:load-bearing**; distributed correctness → **distributed:holdfast**; choosing a library → **quarry**. Point; don't absorb.

---

## When the answer is "no skill"

Re-state, because it is half of `pilot`'s job: throwaway prototypes that ship nothing, non-frontend work, sub-questions inside an in-flight stage, and asks too small for the stage they nominally match — all get a plain "do it directly (or here's the sibling suite), here's why," not a flight plan. The suite is a means; routing into it when it isn't earned is the same error as never using it. And the cross-suite redirect is first-class: surface owns the *membrane* — the frontend architecture, the perception, the state, the ethics — not every line of code in the app; when the real question is general craft, general architecture, distributed correctness, or library choice, point to the suite that owns it.

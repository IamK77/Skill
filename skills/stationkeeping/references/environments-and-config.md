# Environments & Config

This reference is the depth behind **STAGE 2 — Environments & config** of the [../SKILL.md](../SKILL.md) flight plan, the stage that decides whether "works in staging" carries any information about prod. It governs two bound-together questions: *is every environment described in reviewed, version-controlled code so it can be rebuilt rather than remembered* (`infra-as-code-and-parity`), and *is configuration — including every secret — separated from the artifact so the same image promotes from staging to prod unchanged* (`config-separated-from-code`). In the human era these were the mark of a tidy team: someone wrote Terraform out of pride, kept dev close to prod out of experience, and felt the wrongness of pasting a key into a YAML file. The agent era promotes both from tidiness to a **machine-enforced gate**, because the operator who now clicks a console to "just fix it," scales a snowflake into existence, and bakes a credential into an image to make something work — without any felt wrongness and without memory of the box being now special — is the agent. Read [agent-era-shifts.md](agent-era-shifts.md) for *why* these shift — specifically **SHIFT 6** (the agent patches prod live and scales up instead of diagnosing → immutable, IaC infrastructure) and **SHIFT 7** (the agent feels no wrongness leaking a secret → keep secrets out of the artifact) — and come here for *how* to enforce them.

Every fork below states three things so two agents hardening the same system reach the *same* setup:

- **PREDICATE** — the question that selects the branch.
- **DEFAULT** — what to pick when the predicate is a genuine coin-flip.
- **FALLBACK** — what to do when you cannot answer the predicate yet.

One governing fact, inherited from [decision-tree.md](decision-tree.md), overrides every DEFAULT and FALLBACK here:

> **Production is the only truth, and an unrehearsed control is not a control.** An environment you can only reach by clicking, a parity you assert but have never proven, a config promotion you assume is artifact-identical but have never diffed — each is a property you are *trusting* rather than *exercising*, and the agent operating the system reads its silence as success. The environment that "works on my machine" is the oldest false-green there is; this stage is about making there be only one machine.

---

## Part 1 — Infrastructure as code (no snowflakes)

The opposite of infrastructure-as-code is a **snowflake**: an environment someone clicked into existence in a cloud console, hand-tweaked under pressure, and that now exists in exactly one place, understood by at most one person, reproducible by no one. The day it dies — a region outage, a fat-fingered delete, an account suspension — you do not have a recovery procedure; you have an archaeology project. IaC is the cure: the *entire* environment — networks, compute, load balancers, databases, IAM roles, DNS — is described in **declarative code** that is committed, reviewed, and applied by a tool, so the answer to "how did this get like this" is always a file in version control, and the answer to "can we rebuild it" is always yes.

### Declarative, version-controlled, reviewed

| Property | What it means | Why the agent needs it as a gate, not a habit |
|---|---|---|
| **Declarative** | you describe the *desired end state*, the tool computes the diff and the steps | an agent writing imperative "create this, then that" scripts accumulates order-dependent, half-applied state; declarative IaC is idempotent and self-reconciling |
| **Version-controlled** | the infra definition lives in the repo, with history and blame | the agent has no memory between sessions; the git history *is* the memory of why the network looks the way it does |
| **Reviewed** | an infra change is a PR with a diff a human reads | infra changes are high-blast-radius and irreversible; the review is where a human catches the agent about to widen a security group to `0.0.0.0/0` |
| **The plan is the artifact you review** | you read the computed diff (`terraform plan`), not the source alone | the source says intent; the *plan* says what will actually change in *this* account right now, including the destroy-and-recreate you didn't expect |

Real tools: **Terraform** / **OpenTofu** and **Pulumi** (provider-agnostic, the common default), **CloudFormation** / **CDK** (AWS-native), **Bicep** (Azure), **Crossplane** and cluster-native definitions for Kubernetes. Pick one and make it the *only* way the environment changes.

```
PREDICATE: is this environment defined in committed, reviewed IaC AND is the console read-only?
├─ IaC defines it + manual console changes are disabled/detected ──► reproducible. Done.
├─ IaC exists but people still click the console to "fix" things ──► HALF a gate. The IaC
│     drifts from reality silently; every click is an unrecorded snowflake-in-progress.
│     Lock down console write access; route all change through the IaC PR; reconcile the drift.
└─ Environment was clicked into existence, no IaC ────────────────► it is a snowflake. Import
      the existing resources into IaC (terraform import / pulumi import) until the code
      describes reality, THEN make the console read-only. Nothing below is trustworthy first.
```

**DEFAULT** when choosing a tool: prefer the one with the strongest *plan/preview* and *state* story (Terraform/OpenTofu, Pulumi) over a thinner scripting wrapper — the reviewable diff is the whole point. **FALLBACK** when you inherit a live snowflake you cannot fully codify yet: import and codify the *blast-radius-critical* resources first (the database, the IAM roles, the network), label the rest as residual risk for the user, and freeze console write access so the snowflake stops growing while you catch up.

### plan / apply, and drift detection

The IaC workflow is two separated phases, and keeping them separate is a safety property, not a formality:

- **`plan`** computes the diff between the code and the live world and shows it. It changes nothing. This is the artifact a human reviews and an agent must surface before acting.
- **`apply`** executes that plan against the real account.

**Drift** is when the live world diverges from the code — someone clicked the console, an autoscaler mutated a resource, a manual hotfix happened. Drift is the snowflake re-forming. Detect it continuously (a scheduled `terraform plan` / Pulumi drift detection / `driftctl` in CI that *fails or alerts* when reality ≠ code) and reconcile it back to code — either by applying the code over the drift, or by folding a legitimate manual change *into* the code. A drift check that only logs is advisory; a drift check that pages or blocks is a gate. This is the infrastructure-level twin of `flightline`'s frozen-install rule: the committed definition is worthless if the running system is allowed to silently diverge from it.

### Agent-proposes / human-applies for irreversible infra

This is the load-bearing discipline of the stage, and it mirrors exactly the data-migration stance `load-bearing` takes on schema changes: **an agent may author and plan an infra change freely, but a human approves the `apply` for anything irreversible or high-blast-radius.** The reasons are the agent's own failure modes. An agent feels no dread before a `terraform apply` whose plan reads `destroy and recreate` on the production database; it reads the green "apply complete" as success even when the green came *after* the data was gone. The plan/apply split exists precisely so the irreversible step has a human gate.

```
PREDICATE: what is the blast radius and reversibility of this infra change?
├─ Additive + trivially reversible (a new tag, a scaled-up stateless pool you can
│   scale back, a new alarm) ──────────────────────────► agent may apply within the
│     pipeline on a green plan; small, reversible, low-stakes.
├─ Mutates networking, IAM, or any stateful resource ──► agent PROPOSES (writes the code,
│     posts the `plan`); a HUMAN reads the plan and approves the apply. Treat a plan that
│     says "destroy"/"replace" on anything stateful as STOP-and-escalate by default.
└─ Touches the production database / storage / DNS / the thing whose loss is the
    incident ─────────────────────────────────────────► irreversible. Human approval is
      mandatory; rehearse the change on a staging clone first; never apply blind to prod.
```

**DEFAULT** on a coin-flip about whether a change is "irreversible enough" to need a human: route it to a human — an over-cautious approval costs minutes; an agent-applied `destroy` on stateful infra costs an outage the agent reports as success. **FALLBACK** when you cannot tell what the plan will do to a stateful resource: apply it to a *throwaway staging copy* first, read the real diff there, and carry the result to the user before touching prod. Never let "the plan looked fine" stand in for "we ran it somewhere safe."

> Anti-pattern this part kills: **"I'll just fix it in the console."** Every console click that bypasses the IaC PR is a future snowflake and a future drift alert — and for an agent, the console fix *is* the resolution: the dashboard goes green and the divergence sits silent until it bites.

---

## Part 2 — Containerization & orchestration (the image as the unit of parity)

`flightline`'s reproducible-build discipline ended at a single, scanned, content-addressed artifact built once. This stage picks that artifact up and makes it the **unit of parity across environments**: the exact same image digest that CI built and tested is the one that runs in staging and the one that runs in prod. "Works on my machine" dies here not because everyone's machine was fixed but because *there is only one machine* — the image — and it runs identically everywhere.

- **The container image** (Dockerfile / OCI) pins the OS, system libraries, runtime, and your app and its dependencies into one immutable layer stack. Build it once, scan it once (`flightline` covers the build-time CVE scan of base layers), and **promote that exact digest** — never rebuild per environment, which can silently pick up a new base-image layer or a freshly-published transitive and reintroduce the very drift you containerized to kill.
- **Orchestration** (**Kubernetes** the common default; ECS, Nomad) makes the *runtime* identical everywhere too: the same declarative manifests describe replicas, resource limits, health probes, and rollout strategy in dev, staging, and prod, differing only in injected scale and config. The orchestrator's manifests are themselves IaC — version-controlled and reviewed, by the rules of Part 1.

The agent failure mode this guards against is the live patch. Facing a sick container, the agent's cheapest path to green is to `kubectl exec` in and mutate it — install a package, edit a file — breeding a pod that no longer matches its image: a snowflake at the container level. **Immutable infrastructure forbids this**: you do not patch a running container, you rebuild the image and roll out a replacement. Make the running fleet provably equal to a known image digest, and there is no hand-tweaked box to accumulate. (This is the runtime enforcement of the same immutability `release-and-rollback` builds the deploy pipeline around.)

```
PREDICATE: do the same image digest and the same orchestration manifests run in every env?
├─ One image, built once, promoted by digest; manifests differ only by injected config/scale ──►
│     parity holds at the runtime level. Good.
├─ Image rebuilt per environment from the same Dockerfile ─────────► drift risk: a new base
│     layer or transitive can differ between builds. Switch to build-once-promote-by-digest.
└─ Hosts configured by hand / containers hand-patched in place ────► snowflake. Move to
      immutable images and rebuild-not-patch before relying on any parity claim below.
```

**DEFAULT** when deciding how much orchestration to adopt: match it to the weight class from [decision-tree.md](decision-tree.md) — a LIGHT single service may need only a container and a runtime pin, not a Kubernetes cluster; don't buy orchestration ceremony a hobby tool will never use. **FALLBACK** when full containerization is too heavy right now: pin the runtime version and the OS image explicitly and document the exact provisioning steps as code (even a reviewed provisioning script beats a console), then containerize when the first real parity bug appears.

---

## Part 3 — dev / staging / prod parity (the staging gap is a bug nursery)

The most insidious class of production bug is the one that **works in staging and dies in prod** — because every way staging differs from prod is a place a bug can hide until it reaches users. Staging exists to catch problems before users do; the closer it is to prod, the more it catches. A staging environment that diverges in the wrong dimensions is not a safety net, it is a **bug nursery**: it breeds false confidence, certifying releases that were never really tested against the conditions they'll meet.

Not all divergences are equal. These are the ones that hide real bugs, roughly in order of how often they bite:

| Divergence | The bug it hides | How to close it |
|---|---|---|
| **Data shape** | code that works on staging's clean toy data and chokes on prod's messy, NULL-riddled, legacy-shaped real data | seed staging from anonymized/synthetic data with prod's *shape* and *cardinality*, not a hand-typed happy-path row |
| **Scale** | the query that's instant on 1k rows and times out on 50M; the connection pool that's ample at 10 RPS and exhausts at 10k | load-test against prod-scale data and traffic (the `capacity-proven` gate at STAGE 6 is where this is proven), not staging-scale |
| **Config** | the behavior that differs because a timeout, feature flag, or pool size is set differently in prod | promote the *same* artifact with config injected from the same mechanism (Part 4) — divergent config is the most common silent gap |
| **Dependencies** | a different database minor version, a missing sidecar, a stubbed-out third-party that behaves unlike the real one | run the same versions (pinned per Part 2); point staging at realistic dependency stand-ins, and contract-test the boundaries (`assay` covers contract tests) |
| **Topology / network** | the cross-AZ latency, the TLS hop, the egress rule that only exists in prod | mirror the network shape in IaC; one definition, parameterized per env |

### How close is close enough — by weight class

Perfect parity is expensive (a full prod-scale staging clone can cost as much as prod), so parity is sized to blast radius like everything else in this skill:

- **PREDICATE:** for this divergence, could a bug hide here that staging would pass and prod would fail on?
- **LIGHT:** same runtime and config mechanism and lockfile; toy-scale data is acceptable. Don't fund a prod-scale clone for a hobby tool.
- **MEDIUM:** the standard floor — identical artifact and config mechanism, realistic data *shape*, same dependency versions; scale can be smaller but the data shape must be honest.
- **HEAVY:** parity that's proven — prod-shaped, prod-scale (or load-tested to prod scale) data, identical dependency versions and topology, and game-days that exercise the real failure modes. For a revenue/safety system, the cost of the gap exceeds the cost of the clone.
- **DEFAULT** on a coin-flip about which divergence to close first: close **data shape** and **config** before **scale** — they hide the most bugs for the least money, and scale is separately proven at the `capacity-proven` gate.
- **FALLBACK** when you cannot make staging match prod on some axis (a third-party you can't replicate, a dataset you can't clone): name the divergence explicitly, decide its risk *with the user*, and compensate — canary the change in prod behind a flag (`release-and-rollback`) so the first real exposure is a small slice, not all users. An un-closeable gap you've *named* and ringfenced is safer than one you pretend isn't there.

> Anti-pattern this part kills: **"it passed in staging."** For an agent that reads green as safety, a staging pass is proof of correctness — but it only proves correctness *under staging's conditions*. The gap between those conditions and prod's is exactly where the outage lives.

---

## Part 4 — Config separated from code (12-factor)

The **twelve-factor** rule: an application's **config** — everything that varies between deploys (URLs, hostnames, credentials, feature flags, tuning knobs) — lives *outside* the code, in the environment, never hard-coded and never committed. The litmus test is sharp: *could you open-source this repo right this second without leaking a single credential?* If not, config is baked into code, and you have two bugs in one — a security leak and a parity break.

The parity payoff is the reason this sits in the environments stage. When config is fully externalized, **the exact same build artifact promotes from staging to prod unchanged**, and the *only* thing that differs between the two is the config injected at runtime. That is what makes a staging pass mean something: you tested the literal bytes that will run in prod. Bake an environment-specific value into the image and you've built a different artifact per environment — and your staging test certified an artifact that no longer exists in prod.

### Where config lives: env vars vs a config/flag service

| Mechanism | Use it for | Notes |
|---|---|---|
| **Environment variables** | the twelve-factor baseline: per-deploy values injected by the platform (k8s ConfigMap/Secret, ECS task def, the PaaS dashboard) | simplest, language-agnostic, the default; validate them at startup (`gauge`'s boundary-validation — fail fast on a missing/malformed var, don't run half-configured) |
| **Config service** | many services sharing config, dynamic reload without redeploy, audited central change | Consul, AWS AppConfig, Spring Cloud Config; the change itself becomes reviewable and versioned |
| **Feature-flag service** | decoupling *release* from *deploy* — toggling behavior per user/cohort at runtime, the kill-switch | LaunchDarkly, Unleash, Flagsmith, OpenFeature; this is the same flag surface `release-and-rollback` leans on to ship dark and flip off without a redeploy |

```
PREDICATE: does the same artifact run in staging and prod, with ONLY injected config differing?
├─ Yes — config fully externalized, verified by diffing what's baked into the image ──► good.
├─ "Should be" but never diffed ──────────────────────────────────► verify it. An agent will
│     happily inline an env-specific default "to make it work"; confirm no env value is baked in.
└─ Environment-specific values compiled into the artifact ────────► you build a different
      artifact per env; staging tests don't transfer to prod. Externalize them before trusting
      any parity claim, and before promoting anything.
```

**DEFAULT** on a coin-flip between an env var and a config service: start with **env vars** (twelve-factor default) and graduate to a config/flag service only when you need dynamic reload, central audit, or per-user targeting — don't stand up a config service a single small app will never need. **FALLBACK** when you're unsure whether a value is "config": ask *does it differ between any two deploys, now or plausibly later?* If yes, externalize it; when genuinely uncertain, externalize anyway — an over-externalized constant costs nothing, an inlined per-env value costs a parity break.

### Secrets never sit in the image or the repo

This is the **SHIFT 7** half of the stage, and the agent failure mode is blunt: the agent feels **no wrongness** pasting a key into a `.env` committed to git, an environment block in a Dockerfile, or a value baked into an image layer, if doing so makes the thing work. So the rule cannot be discipline; it must be a machine-enforced gate.

- **A secret is never committed and never baked into an image.** It is injected at runtime from a **secrets manager** — HashiCorp **Vault**, AWS/GCP/Azure Secret Manager, a Kubernetes Secret backed by an external store — into the process environment or a mounted file, and never persisted into a layer or a log. `flightline` already enforces *build-time* secret hygiene — no secret in the build, scanned by **gitleaks** / **trufflehog** as a blocking gate; this stage is the *running-system* counterpart: the secret reaches the process only at runtime, from the manager, scoped to least privilege.
- **Scan the repo *and the image* for secrets, blocking.** A `gitleaks` pre-commit/CI gate catches the secret heading into git; an image scan catches one already baked into a layer. An advisory scan an agent can ignore is not a gate; a build/commit that *fails* on a detected secret is. Pair it with **rotation** — a secret in a manager can be rotated; a secret in a git history is compromised forever and must be revoked, not just deleted.
- **The running-system security depth** — least-privilege access to the secret store, access auditing, and rotation cadence — is the `ops-security-hardened` gate at STAGE 6 (see [agent-era-shifts.md](agent-era-shifts.md) SHIFT 7). Here the line is narrow and absolute: nothing secret enters the artifact or the repo; it is injected, scoped, and scannable.

```
PREDICATE: is every secret injected at runtime from a manager, and provably absent from image+repo?
├─ Injected from a manager, gitleaks + image scan block, rotation exists ──► good.
├─ Injected at runtime BUT no scan gate proving none leaked into git/layers ──► add the
│     blocking gitleaks (repo) + image secret scan; "we're careful" is a wish, not a gate.
└─ A secret is in the repo, a committed .env, or an image layer ──────────► STOP. Rotate/revoke
      it (a committed secret is compromised, not just exposed), move it to the manager, then
      add the blocking scan so the next one can't land.
```

**DEFAULT** on a coin-flip about whether a value is "secret enough" to belong in the manager: treat it as a secret — the cost of managing a non-secret is trivial; the cost of leaking a real one is an incident. **FALLBACK** when you find a secret already in git history: revoke and rotate it immediately (deletion does not un-leak it), *then* re-issue from the manager — and add the scan gate so the lesson is enforced, not remembered.

> Anti-pattern this part kills: **"I'll just put the key in the env block / a committed `.env` to get it working."** It works, the dashboard goes green, and a live credential now sits in version control or an image layer forever — exactly the expedient move an agent makes with no felt risk.

---

## Anti-patterns (pre-flight checklist for STAGE 2)

| Anti-pattern | Why it bites harder with an agent | The gate that kills it |
|---|---|---|
| **Snowflake server / clicked-into-existence infra** | the agent "just fixes it" in the console; the box becomes irreproducible and no one notices | IaC defines everything; console write-access locked; import existing resources (Part 1) |
| **IaC exists but the console is still used to change things** | every click drifts the live world from the code silently; the agent's live fix reads as success | drift detection that pages/blocks + reconcile; all change via the IaC PR (Part 1) |
| **Agent applies an irreversible infra change unreviewed** | no dread before a `destroy`/`replace` on a stateful resource; green-after-data-loss reads as done | agent-proposes/human-applies; rehearse on a staging clone; plan reviewed before apply (Part 1) |
| **Rebuild the image per environment** | a new base layer or transitive can differ between builds, reintroducing drift | build once, promote the exact digest (Part 2) |
| **Hand-patching a running container/host** | `kubectl exec` fix is the cheapest path to green; breeds a container that no longer matches its image | immutable infra: rebuild and replace, never patch in place (Part 2) |
| **Staging diverges from prod in data shape / scale / config** | the agent reads a staging pass as proof; the gap is exactly where the outage hides | size parity to weight class; close data-shape and config gaps first (Part 3) |
| **Env-specific value baked into the artifact** | the agent inlines a default "to make it work"; staging now tests a different artifact than prod ships | externalize all config; verify nothing is baked in; same artifact promotes unchanged (Part 4) |
| **Secret in the repo / a committed `.env` / an image layer** | the agent feels no wrongness pasting a key to make it work; it's then compromised forever | inject from a manager; blocking gitleaks + image secret scan; rotate (Part 4) |

---

## Escalation ladder (when parity or config separation is still shaky)

When an environment is "mostly reproducible" and config is "mostly externalized" but you still get the occasional "green in staging, red in prod," climb one rung at a time rather than declaring it solved:

```
codify the environment in reviewed IaC + lock down the console (no snowflakes)
   → build once, promote the exact image digest; rebuild-not-patch on the running fleet
      → close the parity gaps that hide bugs (data shape, then config, then dependencies, then scale)
         → externalize ALL config so the same artifact promotes unchanged; diff to prove nothing's baked in
            → inject every secret from a manager; block on gitleaks (repo) + image secret scan; rotate
               → continuous drift detection that pages/blocks and reconciles back to code
                  → game-days that rebuild an environment from IaC + restore from backup, end to end
```

Each rung costs more than the last; stop at the rung where this system's risk is covered — the governing question from [decision-tree.md](decision-tree.md) decides how far you climb: how much does a snowflake you can't rebuild, a staging gap that ships a bug, or a leaked credential actually cost *this* system if it fails? Fund the gates to that answer, and no further. The end state is the one this whole skill points at: the reproducible, parity-tested, config-clean environment is also the path of least resistance, so the agent operates it that way without being asked — and a green staging run finally means what it claims, because the only difference between staging and prod is the config you injected on purpose.

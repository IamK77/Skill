# Authoring skills

The two substantive forms are **execution SOP** and **creative heuristic**. A router is auxiliary navigation. References, examples, and probes are supporting resources.

## Shared contract

```yaml
---
name: focused-name
description: "When this skill is useful and what kind of help it provides."
metadata:
  kind: sop # or heuristic; router only for navigation
---
```

Keep the description within the repository's 1024-character compatibility budget. Preserve LICENSE, NOTICE, and copyright attribution. Use plain, task-specific prose. Do not motivate the skill with unsupported claims about how every model thinks or behaves.

Do not execute shell initialization while loading the skill, preapprove broad Bash, or imply that a file grants permissions. Explicitly user-started, high-impact workflows can declare `disable-model-invocation: true`; that is a host invocation control, not an authorisation or sandbox mechanism.

Link to selective references instead of making every invocation read the entire library. Current entrypoints define the workflow; older reference essays are context, not extra mandatory gates. Prefer precise local examples to universal commandments.

## SOP template

An SOP begins after its target outcome is selected. Its useful structure is:

1. **Inputs:** the concrete artifacts, environment, decisions, and authority needed to begin.
2. **Procedure:** steps that produce inspectable artifacts. Use phases only where completion of one is a meaningful prerequisite of another.
3. **Branches:** what changes with scope, what is genuinely not applicable, and where to pause for missing input.
4. **Completion:** the requested deliverable and the checks that support it, with limits named.

A checklist item should describe an inspectable outcome, not an essay or an attitude. Manual confirmations should cite the artifact or observation they are based on; they are not independent proof. Mechanical checks should execute a real project command and record its result. Neither proves authorisation.

Use `init --new` once for a new task, retain its returned run ID, and use `resume ID` for existing work. Every later mutation addresses that run explicitly. `verify` runs sensors; `advance` closes a fulfilled phase; `done` archives completion. For short independent work, use flat `checks:` and phase `main` rather than artificial stage ceremonies. Declare `allow-na: true` only where inapplicability is meaningful and require a reason.

[Engineering assay](skills/engineering/assay/SKILL.md) is a sensor-backed example. [Quarry forage](skills/quarry/forage/SKILL.md) is a flat SOP. [CLI schema and lifecycle](devtools/checklist/README.md) is the command reference.

## Heuristic template

A heuristic opens a possibility space rather than validating a selected design. A useful shape is:

- **Starting point:** a philosophical perspective or productive tension that changes what can be noticed.
- **Thought experiments:** invitations to associate, borrow a relation from another field, invert an assumption, change scale or time, or compose incompatible ideas. Choose useful threads; no prescribed order.
- **A possible turn:** a concrete example showing how a different perspective generates a genuinely different idea.
- **Leave the space open:** possible expressions of the thought—a sketch, several alternatives, a new question. A handoff to an SOP is optional and follows human direction selection.

Do not add a `.checklist.yml`, mandatory certificate, scoring rubric, full-dimension diagnostic sweep, or compulsory action plan. Rewriting “check these seven dimensions” as “explore these seven dimensions” is not enough: the content must actually generate new frames and associations.

A metaphor suggests possibilities; it is not empirical evidence. Preserve that distinction without strangling exploration. References can provide depth, and a design probe can measure a candidate later; neither decides taste.

[Distributed holdfast](skills/distributed/holdfast/SKILL.md) and [atelier canon](skills/atelier/canon/SKILL.md) illustrate different generative lenses.

## Routers and handoffs

First distinguish “execute this selected task” from “help me think of possibilities.” Ask only if the difference changes the work. Then name the smallest relevant skill, its input, and why it fits. A direct answer is a valid route.

Do not require a CLI for heuristics or navigation, insist that every visual task begin with canon, or route ordinary CSS mechanics to a walking-skeleton SOP. Handoffs are based on artifacts, not a universal pipeline:

- groundwork acceptance examples → assay;
- forage shortlist → quarry touchstone;
- chosen research mechanism → ledger → forge artifacts → reckoning → envoy;
- selected visual direction → systems token/component contracts → bulwark.

## Checks authors leave behind

```sh
python3 devtools/skill-lint.py
python3 -m unittest discover -s devtools -p 'test_skill_lint.py'
node devtools/checklist/bundle/checklist.mjs lint skills --strict
```

Structural lint checks the declared form, resource links, lifecycle markers, and absence of heuristic gates. CLI lint validates actual YAML and command parity. These checks do not judge whether an analogy is interesting or a procedure is wise; that still requires reading the skill and trying it on a real task.

CLI logic changes need regression tests; demonstrate that the test detects the target fault. Source and committed bundle must pass the same run-contract cases. Probe changes retain their own behavioural tests. The root A/B experiment platform is not the required development path for skills.

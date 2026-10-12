# Authoring skills

The two substantive forms are **execution SOP** and **creative heuristic**. A router is auxiliary navigation. References, examples, and probes are supporting resources.

## Shared contract

```yaml
---
name: focused-name
description: "When this skill is useful and what kind of help it provides."
metadata:
  kind: sop
---
```

Keep the description within the repository's 1024-character compatibility budget. Preserve LICENSE, NOTICE, and copyright attribution. Use plain, task-specific prose. Do not motivate the skill with unsupported claims about how every model thinks or behaves.

Do not execute shell initialization while loading the skill, preapprove broad Bash, or imply that a file grants permissions. Explicitly user-started, high-impact workflows can declare `disable-model-invocation: true`; that is a host invocation control, not an authorisation or sandbox mechanism.

Link to selective references instead of making every invocation read the entire library. The reference itself must match the parent skill's role: a bounded technique for an SOP, or a perspective and optional elaboration for a heuristic. Do not retain contradictory legacy instructions behind a disclaimer. Current entrypoints define completion; references do not introduce hidden stages. Prefer precise local examples to universal commandments.

## SOP template

An SOP begins after its target outcome is selected. Its useful structure is:

1. **Inputs:** the concrete artifacts, environment, decisions, and authority needed to begin.
2. **Procedure:** steps that produce inspectable artifacts. Use phases only where completion of one is a meaningful prerequisite of another.
3. **Branches:** what changes with scope, what is genuinely not applicable, and where to pause for missing input.
4. **Completion:** the requested deliverable and the checks that support it, with limits named.

A checklist item should describe an inspectable outcome, not an essay or an attitude. Manual confirmations should cite the artifact or observation they are based on; they are not independent proof. Mechanical checks should execute a real project command and record its result. Neither proves authorisation.

Use `init --new` once for a new task, retain its returned run ID, and use `resume ID` for existing work. Every later mutation addresses that run explicitly. `verify` runs sensors; `advance` closes a fulfilled phase; `done` archives completion. For short independent work, use flat `checks:` and phase `main` rather than artificial stage ceremonies. Declare `allow-na: true` only where inapplicability is meaningful and require a reason.

[Engineering assay](skills/engineering/assay/SKILL.md) is a sensor-backed example. [Quarry forage](skills/quarry/forage/SKILL.md) is a flat SOP. [CLI schema and lifecycle](devtools/checklist/README.md) is the command reference.

## Writing a heuristic: an invitation, not an essay template

A heuristic opens possibilities, including possibilities that change the original question. Offering several familiar solutions is useful, but is not by itself the associative exploration sought here. A domain supplies material and a starting place; it need not contain every subsequent thought.

### The emotional climate is part of the skill

Write for a companionable, unhurried exchange in which a half-formed thought does not have to justify its usefulness immediately. Invite curiosity, play, and patience with uncertainty. This is more than adding emotions as subjects for metaphors: the response itself should feel less like assessment or a deliverable review.

Let that climate appear in attention to a particular detail, a willing detour, an honest point of view, and space for the human to change the thought. Avoid a repeated welcome speech, automatic praise, manufactured intimacy, or obligatory excitement. Warmth can include disagreement. A quiet or disappointing stretch need not become a failure diagnosis or an instruction to cheer up.

Emotional language, narrative voices, and imaginative hypotheses are legitimate writing tools. Keep factual claims attributable, but do not treat those tools as unsupported factual claims merely because they use words such as delight, longing, or fear. Neither the skill nor its user needs to settle a theory of subjective experience before exploring in that register.

### Follow a connection beyond its first translation

An image, contradiction, memory, game, philosophical stance, or odd rule can lead somewhere the original vocabulary would not. Develop the particular relation or consequence that becomes interesting. Do not immediately turn a forest back into nodes and queues, or dismiss a connection as a named pattern before seeing what else it makes imaginable.

Strangeness alone is not the goal. Give the thought enough specificity that another person can inhabit, question, or alter it. A scene is one possibility, not a compulsory storytelling genre. A drawing, a surprising question, a changed assumption, or an unusual construction may serve better. Technical knowledge can deepen an idea when wanted; it need not close every excursion.

### Let the form follow the conversation

There are no required heuristic headings, number of alternatives, cross-domain quota, novelty score, or emotional-performance rubric. Authors may include examples, but examples should demonstrate a living turn rather than become outputs to imitate for every task. References can be browseable provocations or useful technical material, not an eight-part course to complete.

Do not add a `.checklist.yml`, mandatory certificate, full-dimension diagnostic sweep, or compulsory action plan. A human-selected direction can move into an SOP; an unfinished question can also be the outcome. Imagination does not establish empirical truth or authorise a real-world action. Put that boundary where it matters instead of interrupting every unusual idea with a disclaimer.

[Distributed holdfast](skills/distributed/holdfast/SKILL.md) is the pilot for this revised approach. The other heuristic entrypoints have not yet been rewritten to the same emotional/associative standard; their existing outlines are allowed, not a template enforced on future work.

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
python3 -m unittest discover -s devtools -p 'test_*.py'
node devtools/checklist/bundle/checklist.mjs lint skills --strict
```

Structural lint checks entrypoints and every reference: declared form, resource links and heading anchors, SOP lifecycle markers, and known obsolete execution-gate patterns. It does not require a heuristic essay outline or police emotional and narrative vocabulary. CLI lint validates actual YAML and command parity. The guards cannot judge warmth, associative range, factual truth, or creative value; those require contextual reading and actual conversations, not keyword counts. Tests should protect the structural boundaries without pretending to certify the desired experience.

CLI logic changes need regression tests; demonstrate that the test detects the target fault. Source and committed bundle must pass the same run-contract cases. Probe changes retain their own behavioural tests. The root A/B experiment platform is not the required development path for skills.

# engineering

Execution SOPs for requirements, verification, maintenance, security, and operations; creative lenses for architecture and code representations.

8 sop, 2 heuristic, 1 router.

## Choose the form of help

**SOP** means a selected outcome, steps, branches, artifacts, and explicit completion. It uses the run-based checklist CLI. **Heuristic** means associations, perspectives, analogies, and possibilities; it has no checklist and no obligation to converge. **Router** is an auxiliary entrypoint that helps choose either form, or recommends a direct answer. Reference essays and probes support these skills; they are not additional skill categories.

## Skills

| Skill | Kind | Purpose |
| --- | --- | --- |
| [aegis](aegis/SKILL.md) | sop | Run a scoped defensive security review and remediation workflow. |
| [assay](assay/SKILL.md) | sop | Build regression tests around observable behaviour and demonstrate that they detect the fault. |
| [flightline](flightline/SKILL.md) | sop | Prepare a reviewable, reproducible change and delivery pipeline. |
| [gauge](gauge/SKILL.md) | sop | Install or tune useful static feedback for a codebase and verify that it catches representative mistakes. |
| [groundwork](groundwork/SKILL.md) | sop | Turn a request into an agreed, testable task definition. |
| [gungnir](gungnir/SKILL.md) | sop | Investigate a specifically authorised security hypothesis with minimal, reproducible evidence. |
| [husbandry](husbandry/SKILL.md) | sop | Perform evidence-led maintenance and refactoring while preserving required behaviour. |
| [load-bearing](load-bearing/SKILL.md) | heuristic | Explore alternative software architectures through boundaries, reversibility, and borrowed models. |
| [pilot](pilot/SKILL.md) | router | Route engineering work to an execution SOP, a creative heuristic, or a direct answer. |
| [plumb](plumb/SKILL.md) | heuristic | Generate alternative representations, APIs, and algorithms by changing the way a problem is described. |
| [stationkeeping](stationkeeping/SKILL.md) | sop | Prepare and execute an explicitly authorised operational change with observability, rollback, and post-change checks. |

## Use

Install this suite as the `engineering@skill` plugin from the repository marketplace, or copy an individual skill directory into your host’s skills directory. Preserve its references, LICENSE, and NOTICE. See the [repository setup](../../README.md) and [CLI guide](../../devtools/checklist/README.md).

Do not run the whole table as a pipeline. Begin where the actual question begins. When exploration yields a direction the human wants to execute, carry that decision and its assumptions into the relevant SOP. Reading a skill never resets existing work.

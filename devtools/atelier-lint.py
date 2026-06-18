#!/usr/bin/env python3
"""Deterministic structural / gate-integrity lint for the atelier suite.

Guards what no per-probe test can: that every gated skill's SKILL.md and its
.checklist.yml agree (every `checklist check <phase> <id>` has a matching yml entry
and vice versa, every verified phase exists), that frontmatter / copyright / LICENSE /
NOTICE are present, and that reference docs follow house style. Run from anywhere:
ROOT is resolved relative to this file. Exits non-zero on any BLOCKER or MAJOR so CI
fails the build; MINOR issues are printed but do not fail.
"""
import os, re, sys

# repo-relative: devtools/atelier-lint.py -> <repo>/skills/atelier
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills", "atelier")
GATED = ["canon", "color", "type", "layout", "form", "graphics", "motion", "systems"]
UNGATED = ["pilot"]
issues = []


def add(skill, sev, msg):
    issues.append((skill, sev, msg))


def parse_checklist_yml(path):
    """Return {phase_name: [check_ids]} preserving order."""
    phases = {}
    cur = None
    for line in open(path, encoding="utf-8"):
        m = re.match(r"\s*-\s+name:\s*(\S+)", line)
        if m and line.lstrip().startswith("- name:"):
            cur = m.group(1).strip()
            phases[cur] = []
            continue
        m = re.match(r"\s*-\s+id:\s*(\S+)", line)
        if m and cur is not None:
            phases[cur].append(m.group(1).strip())
    return phases


def read(path):
    return open(path, encoding="utf-8").read() if os.path.exists(path) else None


COPYRIGHT_RE = re.compile(r"Copyright 2026 IamK77 — Licensed under the Apache License")

for skill in GATED + UNGATED:
    d = os.path.join(ROOT, skill)
    skill_md = read(os.path.join(d, "SKILL.md"))
    if skill_md is None:
        add(skill, "BLOCKER", "SKILL.md missing")
        continue
    # LICENSE / NOTICE
    for f in ("LICENSE", "NOTICE"):
        if not os.path.exists(os.path.join(d, f)):
            add(skill, "MAJOR", f"{f} missing")
    # copyright comment at top
    head = "\n".join(skill_md.splitlines()[:40])
    if not COPYRIGHT_RE.search(head):
        add(skill, "MAJOR", "SKILL.md missing Apache copyright HTML comment (first 40 lines)")
    # house style: file must START with frontmatter (--- on line 1), like every other suite
    if not skill_md.startswith("---"):
        add(skill, "BLOCKER", "SKILL.md does not start with `---` frontmatter (leading content "
                              "before frontmatter can break YAML parsing)")
    # frontmatter
    fm = re.search(r"(?ms)^---\n(.*?)\n---", skill_md)
    if not fm:
        add(skill, "BLOCKER", "no YAML frontmatter block")
    else:
        body = fm.group(1)
        nm = re.search(r"^name:\s*(\S+)", body, re.M)
        if not nm:
            add(skill, "BLOCKER", "frontmatter: no name")
        elif nm.group(1).strip() != skill:
            add(skill, "BLOCKER", f"frontmatter name '{nm.group(1)}' != dir '{skill}'")
        for field in ("description", "argument-hint", "allowed-tools"):
            if not re.search(rf"^{field}:", body, re.M):
                add(skill, "MAJOR", f"frontmatter: no {field}")

    # references: no copyright, start with '# '
    refdir = os.path.join(d, "references")
    if os.path.isdir(refdir):
        for fn in sorted(os.listdir(refdir)):
            if not fn.endswith(".md"):
                continue
            txt = read(os.path.join(refdir, fn))
            if COPYRIGHT_RE.search("\n".join(txt.splitlines()[:6])):
                add(skill, "MINOR", f"references/{fn}: has copyright comment (should NOT)")
            if not txt.lstrip().startswith("# "):
                add(skill, "MINOR", f"references/{fn}: does not start with '# Title'")

    # gate integrity
    checks_in_md = re.findall(r"checklist check ([\w-]+) ([\w-]+)", skill_md)
    verifies_in_md = re.findall(r"checklist verify ([\w-]+)", skill_md)
    has_init = "checklist init ${CLAUDE_SKILL_DIR}" in skill_md
    has_show = "checklist show" in skill_md
    has_done = "checklist done" in skill_md

    if skill in UNGATED:
        if has_init or checks_in_md:
            add(skill, "MAJOR", "un-gated pilot should have NO checklist init/check")
        if os.path.exists(os.path.join(d, ".checklist.yml")):
            add(skill, "MAJOR", "un-gated pilot should have NO .checklist.yml")
        continue

    # gated
    if not has_init:
        add(skill, "BLOCKER", "missing `checklist init ${CLAUDE_SKILL_DIR}` line")
    if not has_show:
        add(skill, "MAJOR", "FINAL GATE missing `checklist show`")
    if not has_done:
        add(skill, "MAJOR", "FINAL GATE missing `checklist done`")

    yml_path = os.path.join(d, ".checklist.yml")
    if not os.path.exists(yml_path):
        add(skill, "BLOCKER", ".checklist.yml missing")
        continue
    phases = parse_checklist_yml(yml_path)
    yml_pairs = {(p, c) for p, cs in phases.items() for c in cs}
    md_pairs = set(checks_in_md)

    for p, c in sorted(md_pairs - yml_pairs):
        add(skill, "BLOCKER", f"SKILL.md `check {p} {c}` NOT in .checklist.yml")
    for p, c in sorted(yml_pairs - md_pairs):
        add(skill, "BLOCKER", f".checklist.yml has '{p}/{c}' NOT checked in SKILL.md")

    md_phases = set(verifies_in_md)
    yml_phases = set(phases.keys())
    for p in sorted(md_phases - yml_phases):
        add(skill, "BLOCKER", f"SKILL.md `verify {p}` but no such phase in .checklist.yml")
    for p in sorted(yml_phases - md_phases):
        add(skill, "BLOCKER", f".checklist.yml phase '{p}' never verified in SKILL.md")

# report
print(f"=== atelier structural lint: {len(issues)} issue(s) ===")
order = {"BLOCKER": 0, "MAJOR": 1, "MINOR": 2}
for skill, sev, msg in sorted(issues, key=lambda x: (order.get(x[1], 9), x[0])):
    print(f"[{sev:7}] {skill:9} {msg}")
if not issues:
    print("clean — all gates match, frontmatter/copyright/license/notice present.")

blocking = sum(1 for _, sev, _ in issues if sev in ("BLOCKER", "MAJOR"))
sys.exit(1 if blocking else 0)

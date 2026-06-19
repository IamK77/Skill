#!/usr/bin/env python3
"""Repo-wide structural lint for every skill's frontmatter — suite-agnostic.

The one invariant this guards is the platform's hard limit: an Agent Skill's
`description` must be <= 1024 characters (longer descriptions are rejected /
truncated by the loader, which silently breaks skill discovery). It also flags
a missing `name` / `description`. Scoped deliberately narrow so it can run over
ALL suites without knowing any one suite's gate conventions (that is
atelier-lint.py's job). Run from anywhere — ROOT resolves relative to this file.
Exits non-zero if any skill is over the limit.
"""
import os, re, sys, glob

# devtools/skill-lint.py -> <repo>/skills
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills")
LIMIT = 1024

issues = []
rows = []


def description_text(frontmatter):
    """Return the rendered description string, handling folded (>/|), quoted,
    and plain scalars — the same text the loader measures."""
    m = re.search(r"(?ms)^description:[ \t]*(.*?)(?=^[A-Za-z][\w-]*:[ \t]|\Z)", frontmatter)
    if not m:
        return None
    raw = m.group(1)
    head = raw.lstrip()
    if head.startswith(">") or head.startswith("|"):
        lines = raw.split("\n")[1:]  # drop the indicator line
        return " ".join(l.strip() for l in lines if l.strip())
    text = " ".join(l.strip() for l in raw.split("\n") if l.strip())
    return text.strip().strip('"').strip("'")


for path in sorted(glob.glob(os.path.join(ROOT, "**", "SKILL.md"), recursive=True)):
    rel = os.path.relpath(path, os.path.dirname(ROOT))
    txt = open(path, encoding="utf-8").read()
    fm = re.search(r"(?ms)\A---\n(.*?)\n---", txt)
    if not fm:
        issues.append((rel, "no YAML frontmatter block"))
        continue
    body = fm.group(1)
    if not re.search(r"(?m)^name:[ \t]*\S", body):
        issues.append((rel, "frontmatter: no name"))
    desc = description_text(body)
    if desc is None:
        issues.append((rel, "frontmatter: no description"))
        continue
    n = len(desc)
    rows.append((n, rel))
    if n > LIMIT:
        issues.append((rel, f"description is {n} chars (> {LIMIT} limit) — over by {n - LIMIT}"))

print(f"=== skill frontmatter lint: {len(rows)} skill(s), limit {LIMIT} chars ===")
for n, rel in sorted(rows, reverse=True):
    flag = "  <-- OVER" if n > LIMIT else ""
    print(f"{n:5}  {rel}{flag}")

if issues:
    print(f"\n{len(issues)} issue(s):")
    for rel, msg in sorted(issues):
        print(f"[FAIL] {rel}: {msg}")
    sys.exit(1)

print("\nclean — every description within the limit.")
sys.exit(0)

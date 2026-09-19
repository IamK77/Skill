#!/usr/bin/env python3
"""Local authoring contract, not a judgement of creative quality. No dependencies."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def lint_skill(path):
    text = path.read_text(encoding='utf-8')
    errors = []
    header = re.match(r'\A---\n(.*?)\n---\n', text, re.S)
    if not header:
        return ['missing YAML frontmatter']
    front = header.group(1)
    if not re.search(r'^name: [a-z0-9]+(?:-[a-z0-9]+)*\s*$', front, re.M):
        errors.append('name must be a nonempty kebab-case scalar')
    for required in ('LICENSE', 'NOTICE'):
        if not (path.parent / required).is_file():
            errors.append('missing ' + required)
    if 'Copyright 2026 IamK77' not in text[:2000]:
        errors.append('preserve the entrypoint copyright notice')
    kind_match = re.search(r'^metadata:\n  kind: (sop|heuristic|router)\s*$', front, re.M)
    kind = kind_match.group(1) if kind_match else None
    if not kind:
        errors.append('metadata.kind must be sop, heuristic, or router')
    if re.search(r'^allowed-tools:.*\bBash\b', front, re.M):
        errors.append('do not preapprove broad Bash in a shipped entrypoint')
    if re.search(r'^!`|checklist init[^\n]*--force', text, re.M):
        errors.append('skill loading must not create/reset run state')
    desc = re.search(r'^description: (.+)$', front, re.M)
    if not desc:
        errors.append('description must be a nonempty scalar')
    elif len(desc.group(1)) > 1024:
        errors.append('description exceeds 1024 characters')
    config = path.parent / '.checklist.yml'
    if kind == 'sop':
        if not config.is_file():
            errors.append('SOP requires a checklist definition')
        for heading in ['## Inputs', '## Procedure', '## Branches', '## Completion']:
            if heading not in text:
                errors.append('SOP missing ' + heading)
        for token in ['--new', 'resume', '--run', 'checklist done']:
            if token not in text:
                errors.append('SOP missing explicit run lifecycle: ' + token)
    if kind in ('heuristic', 'router'):
        if config.exists():
            errors.append(kind + ' must not carry a checklist')
        if re.search(r'checklist\s+(init|check|verify|advance)|^#{1,3} (?:STAGE|GATE)', text, re.M):
            errors.append(kind + ' must not impose execution gates')
    if kind == 'heuristic':
        for heading in ['## Starting point', '## Thought experiments', '## A possible turn']:
            if heading not in text:
                errors.append('heuristic missing ' + heading)
    for link in re.findall(r'\]\(([^)]+)\)', text):
        if '://' in link or link.startswith('#'):
            continue
        target = link.split('#')[0]
        if not (path.parent / target).exists():
            errors.append('missing linked resource: ' + target)
    return errors


def main(root=ROOT / 'skills'):
    files = sorted(Path(root).rglob('SKILL.md'))
    issues = [(p, error) for p in files for error in lint_skill(p)]
    for p, error in issues:
        print(f'{p}: {error}')
    print(f'{len(files)} skill entrypoints, {len(issues)} errors')
    return int(bool(issues) or not files)


if __name__ == '__main__':
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'skills'))

#!/usr/bin/env python3
"""Local authoring contract, not a judgement of creative quality. No dependencies."""
from pathlib import Path
import json
import re
import sys
import unicodedata
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]


def prose(text):
    """Remove fenced examples, preserving line boundaries for diagnostics."""
    lines = []
    fence = None
    for line in text.splitlines():
        match = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if match:
            marker = match.group(1)
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not line[match.end():].strip():
                fence = None
            lines.append('')
        else:
            lines.append(line if fence is None else '')
    return '\n'.join(lines)


def anchors(text):
    """Heading slugs for local documentation links, including duplicate headings."""
    result, used = set(), {}
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', prose(text), re.M):
        heading = re.sub(r'<[^>]+>', '', heading).lower()
        # GitHub-style punctuation removal; preserve unicode letters and dashes.
        base = ''.join(c for c in heading if c in '-_ ' or unicodedata.category(c)[0] in 'LN')
        base = base.replace(' ', '-')
        count = used.get(base, 0)
        slug = base if count == 0 else f'{base}-{count}'
        while slug in result:
            count += 1
            slug = f'{base}-{count}'
        used[base] = count + 1
        result.add(slug)
    result.update(re.findall(r'(?:id|name)=[\"\']([^\"\']+)[\"\']', text))
    return result


def link_errors(path, text):
    errors = []
    # Inline code examples are source text, not rendered resource links.
    rendered = re.sub(r'(`+)(?!`)(.*?)\1(?!`)', '', prose(text), flags=re.S)
    for raw in re.findall(r'\]\(([^)\n]+)\)', rendered):
        # Support a simple optional link title and angle-bracket destinations.
        link = raw[1:raw.index('>')] if raw.startswith('<') and '>' in raw else raw.split(' ', 1)[0]
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', link) or link.startswith('//'):
            continue
        target, _, anchor = unquote(link).partition('#')
        resource = path.parent / target if target else path
        if not resource.exists():
            errors.append('missing linked resource: ' + target)
        elif anchor and resource.suffix.lower() == '.md' and anchor not in anchors(resource.read_text(encoding='utf-8')):
            errors.append('missing linked anchor: ' + link)
    return errors


def lint_reference(path):
    text = path.read_text(encoding='utf-8')
    body = prose(text)
    errors = link_errors(path, text)
    if not re.match(r'\A\s*#\s+\S', body):
        errors.append('reference requires a descriptive heading')
    if (re.search(r'^#{1,6}\s+(?:STAGE\s+\d|(?:FINAL\s+)?GATE\b|AGENT-ERA PRE-FLIGHT)', body, re.M)
            or re.search(r'\b(?:clears? exactly \w+ gates?|this stage backs)\b', body, re.I)):
        errors.append('reference must not impose a hidden stage or gate')
    if re.search(r'checklist\s+init[^\n]*--force', text):
        errors.append('reference contains destructive initialization')
    if re.search(r'\b(?:agent|model)s?\b[^\n.!?]{0,80}\b(?:feels? no wrongness|cannot feel|has no taste|have no taste|always skips?|always lies?)\b', body, re.I):
        errors.append('unsupported model-psychology generalisation')
    if re.search(r'\bWCAG\b[^\n.]{0,80}(?:is|as|—|-)\s+(?:the |a )?legal (?:floor|baseline)', body, re.I):
        errors.append('universal legal claim requires contextual requirements instead')
    return errors


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
    errors.extend(link_errors(path, text))
    for reference in sorted((path.parent / 'references').rglob('*.md')):
        errors.extend(f'{reference.relative_to(path.parent)}: {error}' for error in lint_reference(reference))
    return errors


def main(root=ROOT / 'skills'):
    files = sorted(Path(root).rglob('SKILL.md'))
    issues = [(p, error) for p in files for error in lint_skill(p)]
    for p, error in issues:
        print(f'{p}: {error}')
    references = sum(len(list((p.parent / 'references').rglob('*.md'))) for p in files)
    print(f'{len(files)} skill entrypoints, {references} references, {len(issues)} errors')
    return int(bool(issues) or not files)


if __name__ == '__main__':
    sys.exit(main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'skills'))

import tempfile
import json
import unittest
from pathlib import Path
from skill_lint import ROOT, lint_skill


class SkillContract(unittest.TestCase):
    def make(self, root, kind='heuristic'):
        p = root / 'SKILL.md'
        text = ('---\nname: demo\ndescription: "A focused skill"\nmetadata:\n  kind: ' + kind + '\n---\n\n'
                '<!-- Copyright 2026 IamK77 — Licensed under the Apache License -->\n')
        if kind == 'heuristic':
            text += '## Starting point\nA frame.\n## Thought experiments\nAn invitation.\n## A possible turn\nAn example.\n'
        if kind == 'sop':
            text += '## Inputs\n## Procedure\n## Branches\n## Completion\n'
            text += 'checklist init . --new\nchecklist resume RUN\nchecklist done --run RUN\n'
            (root / '.checklist.yml').write_text('checks: []\n')
        for f in ('LICENSE', 'NOTICE'):
            (root / f).write_text('fixture')
        p.write_text(text)
        return p

    def test_all_shipped_entrypoints(self):
        files = sorted((ROOT / 'skills').glob('*/*/SKILL.md'))
        self.assertEqual(len(files), 38)
        counts = {kind: 0 for kind in ('sop', 'heuristic', 'router')}
        for p in files:
            self.assertEqual(lint_skill(p), [], str(p))
            for kind in counts:
                if '  kind: ' + kind + '\n' in p.read_text(): counts[kind] += 1
        self.assertEqual(counts, {'sop': 20, 'heuristic': 15, 'router': 3})

    def test_complete_reference_catalog_remains_linked_and_typed(self):
        counts = {'sop': 0, 'heuristic': 0, 'router': 0}
        for entry in (ROOT / 'skills').glob('*/*/SKILL.md'):
            text = entry.read_text()
            kind = next(k for k in counts if '  kind: ' + k + '\n' in text)
            for reference in (entry.parent / 'references').glob('*.md'):
                counts[kind] += 1
                relative = str(reference.relative_to(entry.parent))
                self.assertIn('](' + relative + ')', text, str(reference))
        self.assertEqual(counts, {'sop': 114, 'heuristic': 80, 'router': 4})

    def test_marketplace_registers_exactly_the_shipped_catalog(self):
        data = json.loads((ROOT / '.claude-plugin/marketplace.json').read_text())
        paths = [ROOT / skill / 'SKILL.md' for plugin in data['plugins'] for skill in plugin['skills']]
        self.assertEqual(len(paths), len(set(paths)))
        self.assertEqual(set(p.resolve() for p in paths), set(p.resolve() for p in (ROOT / 'skills').glob('*/*/SKILL.md')))
        self.assertEqual(len(data['plugins']), 6)

    def test_each_kind_has_a_valid_minimum(self):
        for kind in ('sop', 'heuristic', 'router'):
            with tempfile.TemporaryDirectory() as d:
                self.assertEqual(lint_skill(self.make(Path(d), kind)), [])

    def test_gate_and_checklist_mutations_are_caught(self):
        for mutation in ('gate', 'config', 'force', 'permission', 'missing-kind', 'missing-link'):
            with tempfile.TemporaryDirectory() as d:
                p = self.make(Path(d))
                text = p.read_text()
                if mutation == 'gate': text += '\nchecklist advance main\n'
                if mutation == 'config': (p.parent / '.checklist.yml').write_text('checks: []')
                if mutation == 'force': text += '\n!`checklist init . --force`\n'
                if mutation == 'permission': text = text.replace('metadata:', 'allowed-tools: Read Bash\nmetadata:')
                if mutation == 'missing-kind': text = text.replace('kind: heuristic', 'kind: diagnostic')
                if mutation == 'missing-link': text += '\n[missing](references/missing.md)\n'
                p.write_text(text)
                self.assertTrue(lint_skill(p), mutation)

    def test_reference_regressions_are_not_hidden_behind_a_clean_entrypoint(self):
        cases = [
            ('## STAGE 0 — compulsory\n', 'hidden stage'),
            ('## GATE — clear before proceeding\n', 'hidden stage'),
            ('It clears exactly one gate — threat-model-built.\n', 'hidden stage'),
            ('This stage backs two checks.\n', 'hidden stage'),
            ('Run `checklist init . --force` every time.\n', 'destructive initialization'),
            ('The agent feels no wrongness.\n', 'model-psychology'),
            ('WCAG is the legal floor.\n', 'universal legal'),
            ('[missing](missing.md)\n', 'missing linked resource'),
            ('[bad anchor](#does-not-exist)\n', 'missing linked anchor'),
        ]
        for body, expected in cases:
            with self.subTest(expected=expected), tempfile.TemporaryDirectory() as d:
                p = self.make(Path(d)); refs = p.parent / 'references'; refs.mkdir()
                (refs / 'note.md').write_text('# Technique\n\n' + body)
                issues = lint_skill(p)
                self.assertTrue(any(expected in e for e in issues), issues)

    def test_reference_techniques_and_examples_are_not_prohibited(self):
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d)); refs = p.parent / 'references'; refs.mkdir()
            (refs / 'note.md').write_text('# Technique\n\n## Same heading\nAn authorisation gate must reject invalid credentials.\n\n## Same heading\n[second](#same-heading-1)\n[entry](../SKILL.md#starting-point)\n\n```markdown\n[illustration](not-a-real-file.md)\n## STAGE 0 — quoted obsolete example\n```\n')
            self.assertEqual(lint_skill(p), [])

    def test_literal_links_and_fence_info_are_not_rendered_links(self):
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d)); refs = p.parent / 'references'; refs.mkdir()
            (refs / 'note.md').write_text('# Technique\n\nA literal `[example](missing.md)` is source text.\n\n```markdown\n```not-a-closing-fence\n[also literal](also-missing.md)\n```\n')
            self.assertEqual(lint_skill(p), [])

    def test_missing_sop_definition_and_creative_example_are_caught(self):
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d), 'sop'); (p.parent / '.checklist.yml').unlink()
            self.assertIn('SOP requires a checklist definition', lint_skill(p))
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d)); p.write_text(p.read_text().replace('## A possible turn', '## Verdict'))
            self.assertTrue(any('possible turn' in e for e in lint_skill(p)))


if __name__ == '__main__':
    unittest.main()

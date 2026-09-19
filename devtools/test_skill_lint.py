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

    def test_missing_sop_definition_and_creative_example_are_caught(self):
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d), 'sop'); (p.parent / '.checklist.yml').unlink()
            self.assertIn('SOP requires a checklist definition', lint_skill(p))
        with tempfile.TemporaryDirectory() as d:
            p = self.make(Path(d)); p.write_text(p.read_text().replace('## A possible turn', '## Verdict'))
            self.assertTrue(any('possible turn' in e for e in lint_skill(p)))


if __name__ == '__main__':
    unittest.main()

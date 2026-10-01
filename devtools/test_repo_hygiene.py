"""Keep local collaboration files out of commits without hiding shipped sources."""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RepositoryIgnoreContract(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.repo = Path(temporary.name)
        self.env = {key: value for key, value in os.environ.items()
                    if not key.startswith('GIT_')}
        self.env.update(GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM='1')
        self.git('init', '--quiet', '--template=').check_returncode()
        (self.repo / '.gitignore').write_bytes((ROOT / '.gitignore').read_bytes())

    def git(self, *args):
        return subprocess.run(
            ['git', '-c', 'core.excludesFile=' + os.devnull, *args],
            cwd=self.repo, env=self.env, capture_output=True, text=True,
        )

    def assert_ignored(self, relative, expected):
        path = self.repo / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.touch()
        result = self.git('check-ignore', '--no-index', '--quiet', relative)
        self.assertIn(result.returncode, (0, 1), result.stderr)
        self.assertEqual(result.returncode == 0, expected, relative)

    def test_local_schedule_is_ignored_recursively(self):
        for relative in (
            'schedule/README.md',
            'schedule/goal/example.md',
            'schedule/resources/input.csv',
            'schedule/tmp/example/src/index.ts',
        ):
            with self.subTest(path=relative):
                self.assert_ignored(relative, True)

    def test_finder_metadata_is_ignored_at_every_depth(self):
        for relative in ('.DS_Store', 'devtools/.DS_Store',
                         'skills/surface/livery/.DS_Store'):
            with self.subTest(path=relative):
                self.assert_ignored(relative, True)

    def test_ignore_rules_do_not_hide_project_sources(self):
        for relative in (
            'README.md',
            'docs/holdfast-pilot.md',
            'devtools/test_repo_hygiene.py',
            'skills/inquiry/crucible/SKILL.md',
            'examples/schedule/README.md',
            'hn-article-draft.md',
        ):
            with self.subTest(path=relative):
                self.assert_ignored(relative, False)


if __name__ == '__main__':
    unittest.main()

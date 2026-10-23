import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('ci_scope', Path(__file__).parents[1] / 'scripts/ci-scope.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
DRAFT = {'pull_request': {'draft': True}}

class ScopeTests(unittest.TestCase):
    def tier(self, paths, guard=True):
        return module.classify('pull_request', DRAFT, paths, guard)

    def test_docs_are_minimal_only_for_known_non_runtime_markdown(self):
        self.assertEqual(self.tier(['README.md', 'docs/website-v2/EXPERIENCE_SPEC.md']), 'docs')
        for file in ['docs/agent/prompt.md', 'docs/website-v2/demo.html', 'AGENTS.md', '.github/README.md']:
            with self.subTest(file=file): self.assertEqual(self.tier([file]), 'full')

    def test_public_tier_requires_transitive_guard(self):
        paths = ['frontend/src/components/public/Home.tsx', 'docs/website-v2/README.md']
        self.assertEqual(self.tier(paths), 'frontend')
        self.assertEqual(self.tier(paths, False), 'full')

    def test_backend_and_mixed_changes(self):
        self.assertEqual(self.tier(['src/core/order.js']), 'backend')
        self.assertEqual(self.tier(['src/core/order.js', 'frontend/src/config/publicContent.ts']), 'full')

    def test_shared_security_dependency_and_unknown_changes_fail_closed(self):
        for file in ['package-lock.json', 'frontend/package.json', 'frontend/vite.config.ts',
                     'src/config/env.js', 'src/app.js', '.github/workflows/ci.yml',
                     'tests/apiContainment.test.js', 'frontend/src/auth/session.ts',
                     'frontend/public/worker.js', 'frontend/src/components/public/PublicImportBoundary.test.ts', 'new.unknown']:
            with self.subTest(file=file): self.assertEqual(self.tier([file]), 'full')
        self.assertEqual(self.tier([]), 'full')

    def test_renaming_runtime_to_docs_still_validates_runtime(self):
        self.assertEqual(self.tier(['src/app.js', 'docs/website-v2/moved.md']), 'full')

    def test_every_ready_pr_release_and_post_merge_path_is_full(self):
        for event in ['push', 'merge_group', 'workflow_dispatch', 'unknown']:
            self.assertEqual(module.classify(event, DRAFT, ['README.md'], True), 'full')
        for pr in [{'draft': False}, {}, {'draft': 'true'}]:
            self.assertEqual(module.classify('pull_request', {'pull_request': pr}, ['README.md'], True), 'full')

    def test_workflow_keeps_single_status_job_and_every_release_gate(self):
        ci = (Path(__file__).parents[1] / 'workflows/ci.yml').read_text()
        self.assertIn('ready_for_review', ci)
        self.assertIn('merge_group:', ci)
        self.assertIn('  test:\n', ci)
        self.assertNotIn('pull_request_target', ci)
        self.assertNotIn('paths-ignore:', ci)
        for gate in ['Lint', 'Typecheck', 'Test backend', 'Test frontend', 'Build', 'Safe beta demos']:
            self.assertIn('name: ' + gate, ci)
        self.assertIn('tests/apiContainment.test.js', ci)
        self.assertIn('tests/public-release-boundary.test.js', ci)

if __name__ == '__main__':
    unittest.main()

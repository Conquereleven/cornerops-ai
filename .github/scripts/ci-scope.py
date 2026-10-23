#!/usr/bin/env python3
"""Fail-closed validation tiers; one existing CI job, no external dependencies."""
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess


def classify(event_name, event, files, has_guard=False):
    pr = event.get('pull_request', {})
    # Every merge candidate and every main/develop push gets complete CI.
    if event_name != 'pull_request' or pr.get('draft') is not True:
        return 'full'
    if not files:
        return 'full'
    tiers = set()
    for name in files:
        path = PurePosixPath(name)
        suffix = path.suffix.lower()
        if name == 'frontend/src/components/public/PublicImportBoundary.test.ts' or name.startswith('.github/') or path.name in {'AGENTS.md', 'CLAUDE.md', 'CODEOWNERS'}:
            return 'full'
        # Deliberately narrow: other docs may be runtime knowledge or prompts.
        if name == 'README.md' or (suffix == '.md' and name.startswith(('docs/website-v2/', 'docs/ct-infra-gha-01/'))):
            tiers.add('docs')
        elif name in {'frontend/index.html', 'frontend/public/robots.txt', 'frontend/public/sitemap.xml'} or (
            name.startswith('frontend/public/brand/') and suffix in {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.ttf', '.woff', '.woff2'}
        ) or re.fullmatch(r'frontend/src/(?:PublicApp(?:\.test)?\.tsx|routes/PublicLanding(?:\.test)?\.tsx|config/(?:siteConfig|publicContent)\.ts|styles/cornertech\.css|components/public/[\w./-]+\.(?:ts|tsx))', name):
            tiers.add('frontend')
        elif name.startswith(('src/core/', 'src/controllers/', 'src/routes/', 'src/middleware/', 'src/utils/')) and suffix == '.js':
            tiers.add('backend')
        else:
            # Packages, locks, shared config, tests outside public scope and all
            # unknown paths/types are infrastructure/shared changes.
            return 'full'
    tiers.discard('docs')
    if not tiers:
        return 'docs'
    if tiers == {'frontend'}:
        # Never enable the public tier without the reviewed transitive guard.
        return 'frontend' if has_guard else 'full'
    if tiers == {'backend'}:
        return 'backend'
    return 'full'


def changed_files(event):
    pr = event['pull_request']
    base, head = pr['base']['sha'], pr['head']['sha']
    if not all(re.fullmatch('[0-9a-fA-F]{40}', sha) for sha in (base, head)):
        raise ValueError('Invalid comparison revision')
    for sha in (base, head):
        if subprocess.run(['git', 'cat-file', '-e', sha], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
            subprocess.run(['git', 'fetch', '--no-tags', '--depth=1', 'origin', sha], check=True, stdout=subprocess.DEVNULL)
    # Two-tree diff includes base movement as well as PR changes. Renames are
    # additions/deletions, so moving runtime code under docs cannot downgrade CI.
    raw = subprocess.check_output(['git', 'diff', '--name-only', '--no-renames', '-z', base, head])
    files = [name for name in raw.decode('utf-8').split('\0') if name]
    subprocess.run(['git', 'diff', '--check', base, head], check=True)
    return files


def validate_docs(files):
    for name in files:
        file = Path(name)
        if file.is_symlink():
            raise ValueError('Documentation symlink requires review')
        if not file.exists():  # Deletions are valid changes.
            continue
        text = file.read_text(encoding='utf-8')
        if '\0' in text or not text.strip():
            raise ValueError('Empty or invalid documentation')
        if not text.endswith('\n'):
            raise ValueError('Documentation must end with a newline')


def main():
    event_name = os.environ.get('GITHUB_EVENT_NAME', '')
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    tier = 'full'
    if event_name == 'pull_request' and event.get('pull_request', {}).get('draft') is True:
        try:
            files = changed_files(event)
            tier = classify(event_name, event, files, Path('frontend/src/components/public/PublicImportBoundary.test.ts').is_file())
        except (KeyError, ValueError, UnicodeError, subprocess.CalledProcessError):
            # Insufficient history/unknown payload must never produce a cheap pass.
            tier = 'full'
        if tier == 'docs':
            validate_docs(files)
    print(f'tier={tier}')


if __name__ == '__main__':
    main()
